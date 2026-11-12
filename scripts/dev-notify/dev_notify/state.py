"""Dedup state per docs/ai/tasks/ticket-498/dedup-rules.md. Fail-open:
any lock/parse/IO problem here must never block a real notification --
the caller gets "not a duplicate" and the notification proceeds.
"""
import json
import os
import time
from pathlib import Path
from typing import Optional

from .events import EventCategory

WINDOW_SECONDS = {
    EventCategory.COMPLETED: 75,
    EventCategory.NEEDS_ATTENTION: 15,
    EventCategory.FAILED: 5,
}
MAX_ENTRIES = 500
MAX_AGE_SECONDS = 86400
LOCK_TIMEOUT_SECONDS = 2
# Must be clearly longer than LOCK_TIMEOUT_SECONDS *and* the longest
# realistic hold time of the critical section it guards (read+prune+
# atomic-write of a small JSON file, normally well under a second) --
# per the dedup-rules addendum (CV4). Set comfortably above the hook's
# own hard total-runtime cap (see dedup-rules-addendum-1.md) too, so a
# process that gets hard-killed mid-critical-section never has its
# lock reclaimed by an ordinary waiter that merely hit its own 2s wait.
STALE_LOCK_THRESHOLD_SECONDS = 30


class _FileLock:
    """Minimal, stdlib-only, cross-platform-ish advisory lock via a
    sibling .lock file created with O_CREAT|O_EXCL. Best-effort only --
    per dedup-rules.md, failing to acquire it is NOT an error, it is a
    signal to skip dedup and just send the notification."""

    def __init__(self, path: Path, timeout_s: float = LOCK_TIMEOUT_SECONDS,
                 stale_threshold_s: float = STALE_LOCK_THRESHOLD_SECONDS):
        self.lock_path = Path(str(path) + ".lock")
        self.timeout_s = timeout_s
        self.stale_threshold_s = stale_threshold_s
        self._acquired = False

    def __enter__(self):
        deadline = time.monotonic() + self.timeout_s
        while time.monotonic() < deadline:
            try:
                fd = os.open(str(self.lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.close(fd)
                self._acquired = True
                return self
            except (FileExistsError, PermissionError):
                # Windows can raise PermissionError (not FileExistsError)
                # when two threads race O_CREAT|O_EXCL on the same path --
                # treat it identically to "someone else holds the lock".
                # A stale lock older than stale_threshold_s (WALL CLOCK,
                # via os.path.getmtime + time.time() -- NOT time.monotonic(),
                # which measures from an arbitrary, non-epoch reference and
                # previously made every lock file look "staler" than any
                # finite threshold could ever catch, so a stale lock was
                # NEVER cleared; found 2026-11-11 by independent sandbox
                # review, RN1) is cleared so a crashed prior run can never
                # permanently wedge dedup.
                try:
                    if time.time() - os.path.getmtime(self.lock_path) > self.stale_threshold_s:
                        os.remove(self.lock_path)
                        continue
                except OSError:
                    pass
                time.sleep(0.02)
        self._acquired = False
        return self

    def __exit__(self, *exc):
        if self._acquired:
            try:
                os.remove(self.lock_path)
            except OSError:
                pass

    @property
    def acquired(self) -> bool:
        return self._acquired


def _read_state(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"entries": {}, "malformed_input_count": 0}


def _write_state_atomic(path: Path, data: dict) -> None:
    tmp = Path(str(path) + f".tmp-{os.getpid()}")
    tmp.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    os.replace(str(tmp), str(path))


def _prune(entries: dict, now: float) -> dict:
    items = [(k, v) for k, v in entries.items() if now - v <= MAX_AGE_SECONDS]
    items.sort(key=lambda kv: kv[1], reverse=True)
    return dict(items[:MAX_ENTRIES])


def check_and_record(state_path: Path, event_key: tuple, event_category: EventCategory, now: Optional[float] = None,
                      lock_timeout_s: Optional[float] = None, stale_threshold_s: Optional[float] = None) -> bool:
    """Returns True if the event SHOULD be sent (not a duplicate).
    Always records the attempt (for observability) even when it
    returns False. Never raises. `lock_timeout_s`/`stale_threshold_s`
    override the module defaults -- only tests pass these, to keep
    timing-sensitive cases fast without changing production values."""
    now = now if now is not None else time.time()
    key_str = "|".join("" if p is None else str(p) for p in event_key)
    window = WINDOW_SECONDS.get(event_category, 60)

    try:
        state_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        return True  # can't even create the dir -- fail open, send it

    lock_kwargs = {}
    if lock_timeout_s is not None:
        lock_kwargs["timeout_s"] = lock_timeout_s
    if stale_threshold_s is not None:
        lock_kwargs["stale_threshold_s"] = stale_threshold_s
    with _FileLock(state_path, **lock_kwargs) as lock:
        if not lock.acquired:
            return True  # fail open, per dedup-rules.md
        data = _read_state(state_path)
        entries = data.get("entries", {})
        last = entries.get(key_str)
        should_send = last is None or (now - last) > window
        if should_send:
            entries[key_str] = now
        entries = _prune(entries, now)
        data["entries"] = entries
        try:
            _write_state_atomic(state_path, data)
        except Exception:
            pass  # recording failed; still honour should_send for THIS call
        return should_send


def increment_malformed_input_counter(state_path: Path) -> None:
    try:
        state_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        return
    with _FileLock(state_path) as lock:
        if not lock.acquired:
            return
        data = _read_state(state_path)
        data["malformed_input_count"] = data.get("malformed_input_count", 0) + 1
        try:
            _write_state_atomic(state_path, data)
        except Exception:
            pass
