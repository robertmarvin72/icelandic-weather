"""Core dispatch: dedup -> render -> Windows toast / ntfy publish, run
in PARALLEL (RC2/QA2, 2026-11-12) so neither channel waits behind the
other. See dedup-rules.md, dedup-rules-addendum-1.md,
dedup-rules-addendum-2.md, and payload-allowlist.md -- this is the one
place those documents' rules actually get enforced in code.
"""
import threading
import time
from pathlib import Path
from typing import Optional

from . import ntfy_client, secret_store, state, templates, windows_toast
from .config import default_local_config_path, load_config
from .events import Agent, EventCategory, NotifyEvent, Surface

# dedup-rules-addendum-2.md: how long dispatch()'s main thread waits
# for each sender thread before marking that channel PENDING (the
# thread itself is daemon and may keep running in the background --
# never killed). Deadlines are computed from one shared t0, so the two
# joins never sum to more than max(WINDOWS, NTFY) of added wait.
WINDOWS_SUBBUDGET_S = 4.0
NTFY_SUBBUDGET_S = 2.0


def default_state_path() -> Path:
    import os
    base = os.environ.get("LOCALAPPDATA") or str(Path.home() / ".local" / "share")
    return Path(base) / "dev-notify" / "state.json"


def _read_ntfy_token(secret_path, read_secret) -> Optional[str]:
    """RN4: returns the token, or raises -- the caller decides what a
    read failure means (skip ntfy entirely, never send unauthenticated
    to what's supposed to be an access-controlled topic, never put the
    token anywhere but this one Authorization header)."""
    raw = read_secret(Path(secret_path))
    return raw.decode("utf-8").strip()


def _send_windows_job(send_windows, rendered: dict) -> dict:
    try:
        return send_windows(rendered["title"], rendered["text"])
    except Exception as e:  # a transport failure here must never propagate (dedup-rules.md)
        return {"method": "none", "ok": False, "detail": f"EXCEPTION: {type(e).__name__}: {e}"}


def _send_ntfy_job(send_ntfy, read_secret, ntfy_cfg: dict, rendered: dict) -> dict:
    """RC2/QA2: the secret read, the request, and both channels' own
    deadlines all live inside this one job function, so they're
    entirely scoped to ntfy's own NTFY_SUBBUDGET_S and never borrow
    time from (or lend time to) the Windows side."""
    token = None
    secret_path = ntfy_cfg.get("token_secret_path")
    if secret_path:
        try:
            token = _read_ntfy_token(secret_path, read_secret)
        except Exception:
            # RN4: never send unauthenticated to what's meant to be an
            # access-controlled topic just because the secret read
            # failed -- a GENERIC local reason, never the exception
            # text (which could in principle leak a path/detail).
            return {"skipped": True, "reason": "ntfy_token_secret_read_failed"}
    try:
        return send_ntfy(ntfy_cfg["host"], ntfy_cfg["topic"], rendered["title"], rendered["text"],
                          timeout_s=ntfy_cfg.get("timeout_s", 2), port=ntfy_cfg.get("port"), token=token)
    except Exception as e:
        return {"error": f"EXCEPTION: {type(e).__name__}: {e}"}


def dispatch(event: NotifyEvent, *, cfg: Optional[dict] = None, state_path: Optional[Path] = None,
             send_windows=windows_toast.send_windows_notification, send_ntfy=ntfy_client.publish,
             dedup_check=state.check_and_record, read_secret=secret_store.read_secret_file,
             windows_subbudget_s: float = WINDOWS_SUBBUDGET_S, ntfy_subbudget_s: float = NTFY_SUBBUDGET_S) -> dict:
    """Returns a result dict describing what happened -- never raises.
    This is the boundary every test exercises; all side-effecting
    calls are passed in as parameters so tests can substitute fakes
    without touching the real Windows session or network.
    `windows_subbudget_s`/`ntfy_subbudget_s` are overridable only for
    tests that need faster timing; production uses the module
    defaults (dedup-rules-addendum-2.md)."""
    cfg = cfg if cfg is not None else load_config()
    state_path = state_path if state_path is not None else default_state_path()

    if not cfg.get("enabled", True):
        return {"sent": False, "reason": "disabled_in_config"}

    # Dedup check (and its own state-file write) ALWAYS happens on the
    # main thread, BEFORE either sender thread starts -- never inside
    # them -- so the dedup record for this event is already persisted
    # before any send is even attempted (QA2b).
    should_send = dedup_check(state_path, event.event_key(), event.event_category)
    if not should_send:
        return {"sent": False, "reason": "deduplicated"}

    rendered = templates.render(event)
    result = {"sent": True, "rendered": rendered, "windows": None, "ntfy": None}

    t0 = time.monotonic()
    jobs = []  # (name, thread, deadline, result_box)

    if cfg.get("windows_toast", {}).get("enabled", True):
        box = {}
        t = threading.Thread(target=lambda: box.update(r=_send_windows_job(send_windows, rendered)), daemon=True)
        t.start()
        jobs.append(("windows", t, t0 + windows_subbudget_s, box))

    ntfy_cfg = cfg.get("ntfy", {})
    if ntfy_cfg.get("enabled") and ntfy_cfg.get("host") and ntfy_cfg.get("topic"):
        box = {}
        t = threading.Thread(target=lambda: box.update(r=_send_ntfy_job(send_ntfy, read_secret, ntfy_cfg, rendered)), daemon=True)
        t.start()
        jobs.append(("ntfy", t, t0 + ntfy_subbudget_s, box))
    else:
        result["ntfy"] = {"skipped": True, "reason": "ntfy not enabled or host/topic not configured (NOT_ACTIVATED)"}

    # Each channel is joined against its OWN absolute deadline (not an
    # additive per-join timeout), so neither channel's wait is ever
    # lengthened by how long the other one took (QA2c) -- the total
    # added wait here is bounded by max(windows_subbudget_s,
    # ntfy_subbudget_s), never their sum.
    for name, t, deadline, box in jobs:
        t.join(max(0.0, deadline - time.monotonic()))
        if t.is_alive():
            # Still running in the background (daemon thread, never
            # killed) -- this is a genuine PENDING outcome, never
            # reported as success (standing QA1-QA5 rule).
            result[name] = {"status": "PENDING", "detail": f"{name} send did not finish within its own sub-budget"}
        else:
            result[name] = box.get("r")

    return result
