"""#485 iteration-4 -- durable, atomic, PARENT-ONLY ledger. CORRECTION v7
(R2 atomic outcome+terminal / incomplete-blocks-reservation, R3 no-signal
locking, R4 conservative byte accounting + real MIN cap, R5 fault-hook
removed from production).

The child process never imports this module and never touches the ledger
file -- the parent is the sole writer, by construction.

Correction v7 fixes, each replacing a real v6 defect Jonesy found (Round 2):
- R2 (incomplete blocks future reservations): `reserve_attempt()` now
  refuses with `LedgerIncomplete` if ANY existing attempt is not yet
  `status == "complete"` -- not just when the ledger is `terminal`. v6's
  gap: a crash between `reserve_attempt()` and recording its outcome left
  a `reserved` row with `terminal: False`, and the very next
  `run_request()` call simply proceeded as if nothing had happened.
- R2 (atomic outcome+terminal): `finalize_attempt()` is now the ONE
  locked, atomic write `pipeline.run_request()` uses for its real
  dispatch outcome -- it sets the attempt's outcome AND (if given) the
  ledger's terminal flag TOGETHER, in a single load+mutate+write. v6
  called `record_outcome()` then separately `mark_terminal()`, two
  separate lock cycles with a real crash gap between them: a process
  that died in that gap left a `complete` deadline/401 row with no
  terminal flag at all.
- R2 (sample_written recorded): every attempt now records `sample_written`
  and a `sample_reason` category, not discarded -- so a 200 whose body
  failed safe-sample validation (wrong shape) can never look identical,
  in the ledger, to an ordinary successful 200.
- R3 (no signalling, no automatic reclaim): the exclusive lock no longer
  probes a lock owner's liveness at all (`os.kill(pid, 0)` is NOT a safe
  passive existence check on Windows -- Jonesy's finding: signal 0 is
  `CTRL_C_EVENT` there, not a no-op, and could disturb the very process
  holding the lock mid-write). A lock file whose content is readable is
  ALWAYS treated as busy, full stop -- never reclaimed by guessing at the
  owner's liveness. (A lock file that VANISHES between our failed create
  and our read of it is not a liveness judgment at all -- that is
  resolved contention, and the acquire simply retries, bounded.)
- R4 (conservative charging, category-based): byte charging is now
  derived from the outcome's own `category`, never a separate
  caller-supplied flag a caller could get wrong. Only a clean `"OK"`
  category reconciles down to the verified `bytes_decoded`; EVERY other
  category (failure, kill, timeout, unknown, malformed) charges the FULL
  reserved per-attempt cap, regardless of how many bytes were actually
  observed. v6's bug: a cooperative partial-transfer failure (server
  sends 1.9 MB then resets) was charged `bytes_known=True` with
  `bytes_decoded: 0` in the outcome dict, so `bytes_charged` was 0 --
  free budget for a misbehaving server. The honestly-observed byte count
  (even when not charged) is still recorded separately as
  `bytes_observed`, never silently dropped.
- R4 (real MIN cap): `reserve_attempt()` now stores
  `min(limits.DECODED_CAP_PER_ATTEMPT, remaining_global_budget)` as the
  attempt's `reserved_decoded_cap`, computed from the durable
  pre-dispatch reservation itself -- not merely an arithmetic invariant
  asserted elsewhere. `_check_budget()` already guarantees
  `bytes_total < caps["bytes_total"]` before this runs, so the remaining
  global figure is always positive here.
- R5 (fault-injection hook removed): the old `_post_fsync_pre_replace_hook`
  test seam is REMOVED from this production file entirely. A test that
  needs to force a real kill between fsync and replace now does so
  against a task-local COPY of this file with the hook inserted into the
  copy only (see `test/test_ledger_crash_injection.py`), never against
  the real candidate's own `ledger.py`.
"""
import json
import os
import time
import uuid
from datetime import datetime, timezone

import limits

# Mutable (tests legitimately override these in-process, e.g. a tiny count
# cap to exercise BudgetExceeded quickly) but SOURCED from the single
# frozen `limits.py` module, never redefined independently here.
CLASS_CAPS = {"provider": {"count": limits.PROVIDER_ATTEMPT_COUNT_CAP,
                            "bytes_per_attempt": limits.DECODED_CAP_PER_ATTEMPT,
                            "bytes_total": limits.DECODED_CAP_TOTAL}}
RUN_WINDOW_S = limits.RUN_WINDOW_S
TOTAL_DEADLINE_S = limits.TOTAL_DEADLINE_S


def now_utc_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _now_epoch():
    return time.time()


class BudgetExceeded(Exception):
    pass


class LedgerTerminal(Exception):
    """Raised when the ledger is already in a terminal state -- no further
    attempt of any kind is permitted, ever, for this ledger file."""


class LedgerIncomplete(Exception):
    """R2: raised when a prior attempt was reserved but never reached a
    complete outcome (the parent crashed, or an unexpected exception
    occurred, between `reserve_attempt()` and `finalize_attempt()`/
    `record_outcome()`) -- fails closed for this ledger file. Nothing in
    this module clears it automatically; matching R3's own no-automatic-
    reclaim philosophy, a human must positively decide this is safe to
    resolve, never a liveness probe or a guess."""


class LedgerAmbiguous(Exception):
    """Raised when ledger recovery cannot safely determine the correct
    state (an unreadable-but-possibly-valid `.tmp`, or a lock file whose
    content could not be parsed) -- always fails closed, never guesses."""


class LedgerBusy(Exception):
    """Raised whenever the ledger lock file already exists and is
    readable -- R3: this is now unconditional, never followed by an
    automatic liveness check or reclaim attempt."""


def _empty():
    return {
        "run_window_start_utc": None,
        "bytes_total": 0,
        "attempts": [],
        "terminal": False,
        "terminal_reason_category": None,
        "terminal_utc": None,
    }


def _tmp_path(path):
    return path + ".tmp"


def _lock_path(path):
    return path + ".lock"


class _ExclusiveLock:
    """A simple, cross-platform-safe exclusive lock using O_CREAT|O_EXCL
    (atomic create-if-absent on both POSIX and Windows). CORRECTION v7
    (R3): no liveness probe, no automatic reclaim -- see module docstring."""

    def __init__(self, ledger_path):
        self.path = _lock_path(ledger_path)
        self._acquired = False

    def __enter__(self):
        self._acquire()
        return self

    def __exit__(self, *exc):
        self._release()

    def _acquire(self):
        # Bounded retries, but ONLY for the "lock file vanished between our
        # failed create and our existence re-check" case -- resolved
        # contention, not a liveness judgment. A lock file that still
        # EXISTS is ALWAYS LedgerBusy, immediately, no retry, no reclaim.
        #
        # CORRECTION v7 (fix found while testing this round's own R3
        # change): the content of the lock file (the owner's PID) is
        # written for human/debugging purposes only -- it is NEVER read
        # or parsed as part of acquiring the lock. An earlier version of
        # this correction DID read/parse it here, which created a real
        # race: a concurrent acquirer could observe the lock file in the
        # narrow window after O_CREAT|O_EXCL created it but before the
        # owner had finished writing+flushing its PID into it, see an
        # empty/partial read, and incorrectly raise LedgerAmbiguous for
        # what was actually just ordinary contention. Checking existence
        # alone (never content) removes that race entirely.
        for _ in range(5):
            try:
                fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                with os.fdopen(fd, "w") as f:
                    f.write(str(os.getpid()))
                    f.flush()
                    os.fsync(f.fileno())
                self._acquired = True
                return
            except FileExistsError:
                if os.path.exists(self.path):
                    raise LedgerBusy(
                        f"ledger lock file exists at {self.path!r}; no automatic reclaim is attempted "
                        f"on this platform -- manual cleanup required after confirming the owner "
                        f"process has actually exited (see README's availability tradeoff note)")
                continue  # vanished between our failed create and this check -- resolved contention, retry
        raise LedgerBusy("could not acquire the ledger lock after repeated vanish-and-retry contention")

    def _release(self):
        if self._acquired:
            try:
                os.remove(self.path)
            except OSError:
                pass
            self._acquired = False


def load_ledger(path):
    """Recovery-aware load: if an orphaned `.tmp` exists, attempt to
    complete it (if it is confirmed, fully-readable, valid JSON) or
    discard it (if confirmed corrupt/truncated) -- NEVER discard it merely
    because reading raised an OSError/PermissionError; that case fails
    closed with `LedgerAmbiguous` instead, preserving the possibly-valid
    reservation untouched."""
    tmp = _tmp_path(path)
    if os.path.exists(tmp):
        try:
            with open(tmp, encoding="utf-8") as f:
                raw = f.read()
        except OSError as e:
            raise LedgerAmbiguous(
                f"durable .tmp exists but could not be read ({type(e).__name__}) -- "
                f"refusing to delete a possibly-valid reservation")
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            # Confirmed-corrupt/truncated write: this means the write that
            # produced this tmp never reached its own fsync, so no caller
            # could ever have received an attempt ID from it -- safe to
            # discard, nothing could have dispatched based on it.
            try:
                os.remove(tmp)
            except OSError:
                raise LedgerAmbiguous("confirmed-corrupt .tmp could not be removed")
            obj = None
        if obj is not None:
            os.replace(tmp, path)  # complete the durable intent
    if not os.path.exists(path):
        return _empty()
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _check_not_terminal(ledger):
    if ledger.get("terminal"):
        raise LedgerTerminal(
            f"ledger is in a TERMINAL state (reason category: {ledger.get('terminal_reason_category')}) -- "
            f"no further attempt is permitted; this persists across restarts")


def _check_no_incomplete(ledger):
    incomplete = [a["id"] for a in ledger["attempts"] if a.get("status") != "complete"]
    if incomplete:
        raise LedgerIncomplete(
            f"ledger has {len(incomplete)} unresolved (non-complete) attempt(s), "
            f"e.g. {incomplete[0][:8]}... -- refusing any new reservation until resolved")


def _check_budget(ledger, now_epoch):
    caps = CLASS_CAPS["provider"]
    used = ledger["attempts"]
    if len(used) >= caps["count"]:
        raise BudgetExceeded(f"provider attempt count exhausted ({len(used)}/{caps['count']})")
    start = ledger["run_window_start_utc"]
    if start is not None:
        try:
            start_epoch = datetime.strptime(start, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc).timestamp()
        except (ValueError, TypeError):
            raise LedgerAmbiguous(f"run_window_start_utc is malformed ({start!r}) -- refusing, not guessing a window")
        elapsed = now_epoch - start_epoch
        if elapsed < 0:
            raise LedgerAmbiguous(f"run_window_start_utc is in the FUTURE ({elapsed:.1f}s) -- refusing")
        if elapsed + TOTAL_DEADLINE_S > RUN_WINDOW_S:
            raise BudgetExceeded(f"60s run window would be exceeded by this attempt ({elapsed:.1f}s elapsed)")
    if ledger["bytes_total"] >= caps["bytes_total"]:
        raise BudgetExceeded("total decoded-byte budget exhausted")


def reserve_attempt(path):
    """Durable BEFORE dispatch. Refuses with `LedgerTerminal` if the
    ledger is already terminal (persists across restarts); refuses with
    `LedgerIncomplete` (R2) if any prior attempt never reached a complete
    outcome; refuses with `BudgetExceeded`/`LedgerAmbiguous` for the
    ordinary cap/window/clock problems. Returns the new attempt's unique
    ID. The attempt's `reserved_decoded_cap` (R4) is
    `min(per-attempt cap, remaining global budget)`, computed here, under
    the same lock, from the durable pre-dispatch reservation itself."""
    with _ExclusiveLock(path):
        ledger = load_ledger(path)
        _check_not_terminal(ledger)
        _check_no_incomplete(ledger)
        now_epoch = _now_epoch()
        _check_budget(ledger, now_epoch)
        if ledger["run_window_start_utc"] is None:
            ledger["run_window_start_utc"] = now_utc_iso()

        caps = CLASS_CAPS["provider"]
        remaining_global = caps["bytes_total"] - ledger["bytes_total"]
        reserved_cap = min(caps["bytes_per_attempt"], remaining_global)

        attempt_id = uuid.uuid4().hex
        ledger["attempts"].append({
            "id": attempt_id, "status": "reserved", "reserved_utc": now_utc_iso(),
            "target_origin": None,
            "reserved_decoded_cap": reserved_cap,
            "outcome": None,
        })
        _atomic_write(path, ledger)
        return attempt_id


def get_reserved_decoded_cap(path, attempt_id):
    """R4: read-only lookup of the MIN-capped decoded-byte allowance
    `reserve_attempt()` computed and stored for this attempt, so the
    caller dispatches the child with the real, budget-aware cap rather
    than the flat per-attempt constant."""
    ledger = load_ledger(path)
    found = _find_attempt(ledger, attempt_id)
    return found["reserved_decoded_cap"]


def set_target_origin(path, attempt_id, origin_str):
    with _ExclusiveLock(path):
        ledger = load_ledger(path)
        found = _find_attempt(ledger, attempt_id)
        found["target_origin"] = origin_str
        _atomic_write(path, ledger)


def _find_attempt(ledger, attempt_id):
    for att in ledger["attempts"]:
        if att["id"] == attempt_id:
            return att
    raise KeyError(f"attempt {attempt_id!r} not found -- outcome must follow its own reservation")


def _apply_outcome(found, outcome):
    """R4: category-based conservative charging. Only a clean `"OK"`
    category reconciles down to the verified `bytes_decoded`; every other
    category charges the FULL reserved per-attempt cap, regardless of
    whatever partial byte count the outcome happens to report. The
    honestly-observed count is still recorded, separately, as
    `bytes_observed` -- never silently dropped, never used as the charge
    for anything but a clean complete success."""
    found["status"] = "complete"
    found["outcome"] = outcome
    found["completed_utc"] = now_utc_iso()
    is_clean_ok = outcome.get("category") == "OK"
    found["bytes_known"] = is_clean_ok
    found["bytes_observed"] = outcome.get("bytes_decoded", 0)
    found["bytes_charged"] = outcome.get("bytes_decoded", 0) if is_clean_ok else found["reserved_decoded_cap"]


def record_outcome(path, attempt_id, outcome):
    """`outcome`: an ALREADY-SANITISED dict -- category, safe status/
    timing/byte-count fields only. See `_apply_outcome()` for the R4
    conservative-charging rule this now always applies (no caller-
    supplied `bytes_known` flag -- that was exactly the v6 defect: a
    caller could pass `bytes_known=True` for a failed transfer and
    charge 0 bytes for real server traffic)."""
    with _ExclusiveLock(path):
        ledger = load_ledger(path)
        found = _find_attempt(ledger, attempt_id)
        _apply_outcome(found, outcome)
        ledger["bytes_total"] += found["bytes_charged"]
        _atomic_write(path, ledger)


def finalize_attempt(path, attempt_id, outcome, terminal_reason_category=None,
                      sample_written=None, sample_reason=None):
    """R2: the ONE atomic, locked write `pipeline.run_request()` uses for
    its real dispatch outcome. Sets the attempt's outcome (R4 charging
    applies identically) AND, if `terminal_reason_category` is given, the
    ledger's terminal flag -- TOGETHER, in a single load+mutate+write.
    Never two separate lock cycles with a crash gap between them (v6's
    defect: a complete deadline/401 row could be left with no terminal
    flag if the process died between two separate calls). Also records
    `sample_written`/`sample_reason` on the attempt -- so a 200 whose
    body failed safe-sample validation is never indistinguishable, in the
    ledger, from an ordinary successful 200 (v6's defect: `sample_written`
    was silently discarded by the caller)."""
    with _ExclusiveLock(path):
        ledger = load_ledger(path)
        found = _find_attempt(ledger, attempt_id)
        _apply_outcome(found, outcome)
        found["sample_written"] = sample_written
        found["sample_reason"] = sample_reason
        ledger["bytes_total"] += found["bytes_charged"]
        if terminal_reason_category is not None:
            ledger["terminal"] = True
            ledger["terminal_reason_category"] = str(terminal_reason_category)[:64]
            ledger["terminal_utc"] = now_utc_iso()
        _atomic_write(path, ledger)


def mark_terminal(path, reason_category):
    """R1: durably, atomically marks the ledger TERMINAL -- every future
    `reserve_attempt()` call against this same file (even from a brand-new
    process) will raise `LedgerTerminal` from now on. Used ONLY for the
    pre-reservation disclosure check (no attempt exists yet to tie an
    outcome to) -- once an attempt exists, `finalize_attempt()` is used
    instead, so terminal-marking and outcome-recording are never two
    separate writes for the same attempt. `reason_category`: a fixed,
    non-secret category string only -- never a raw message/value."""
    with _ExclusiveLock(path):
        ledger = load_ledger(path)
        ledger["terminal"] = True
        ledger["terminal_reason_category"] = str(reason_category)[:64]
        ledger["terminal_utc"] = now_utc_iso()
        _atomic_write(path, ledger)


def _atomic_write(path, obj):
    tmp = _tmp_path(path)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)
