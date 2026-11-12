"""Hard-exit total-runtime watchdog (RN3/CV1). Claude Code does not
enforce `timeout` at all once a command hook runs with `async: true`
(VERIFIED_FROM_DOCS, see dedup-rules-addendum-1.md) -- so a self-
imposed cap must be enforced IN the script itself, with a HARD exit
(the process ends itself), not cooperative cancellation, since a
stuck call deep in the call stack (a wedged subprocess, a blocked
read) cannot be cooperatively interrupted from here.
"""
import os
import threading

TOTAL_RUNTIME_CAP_SECONDS = 5.0


def _hard_kill():
    os._exit(0)  # pragma: no cover -- exercised via a real subprocess test, never in-process


def start(cap_s: float = TOTAL_RUNTIME_CAP_SECONDS) -> threading.Timer:
    """Starts the watchdog. Call `.cancel()` on the returned timer once
    the script's own work is done, to prevent a late, needless kill."""
    timer = threading.Timer(cap_s, _hard_kill)
    timer.daemon = True
    timer.start()
    return timer
