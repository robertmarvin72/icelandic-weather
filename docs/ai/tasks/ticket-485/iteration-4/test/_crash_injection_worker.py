"""#485 iteration-4 correction v7 (R5) -- TEST-ONLY worker. The fault-
injection hook (`_post_fsync_pre_replace_hook`) no longer exists in the
real candidate's `ledger.py` at all -- it has been removed from
production entirely. This worker instead loads a task-local SCRATCH COPY
of `ledger.py` (built by `test_ledger_crash_injection.py`, with the hook
text-inserted into the COPY only) and sets the hook on THAT module
object, so the test harness can send this process a REAL kill signal at
the exact instant the COPY's ledger write has been fsynced to `.tmp` but
NOT yet `os.replace()`'d -- proving crash-recovery against an actual
kill, never against the real candidate file.

Usage: python _crash_injection_worker.py <copy_ledger_module_path> <ledger_json_path> <ready_sentinel_path>
"""
import importlib.util
import os
import sys
import time


def _load_module(module_path, name):
    sys.path.insert(0, os.path.dirname(os.path.abspath(module_path)))  # the copy's own limits.py
    spec = importlib.util.spec_from_file_location(name, module_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    copy_ledger_path = sys.argv[1]
    ledger_path = sys.argv[2]
    ready_sentinel = sys.argv[3]

    copy_ledger = _load_module(copy_ledger_path, "copy_ledger_crash_injection")

    def _pause_after_fsync():
        with open(ready_sentinel, "w", encoding="utf-8") as f:
            f.write(str(os.getpid()))
            f.flush()
            os.fsync(f.fileno())
        # Block here -- the harness kills this whole process while it is
        # sitting in this call, i.e. strictly after fsync(), strictly
        # before os.replace(). No cooperative exit is possible from here;
        # the harness's kill() is the only way this process ever ends.
        time.sleep(3600)

    copy_ledger._post_fsync_pre_replace_hook = _pause_after_fsync
    copy_ledger.reserve_attempt(ledger_path)  # never returns -- killed mid-write


if __name__ == "__main__":
    main()
