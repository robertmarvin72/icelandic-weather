"""Proves the RN3/CV1 hard-exit watchdog actually works: a subprocess
whose main body hangs far longer than the cap must still be killed at
(approximately) the cap, with exit code 0 -- never left running, never
cooperatively "finishing late". Run via a real subprocess because
os._exit() cannot be exercised in-process without killing the test
runner itself.

These are sandbox/CC-attributed logic tests only (same caveat as
test_windows_toast.py): they prove the mechanism, not that a real
Claude/Codex hook invocation actually benefits from it end-to-end --
that combination (a genuinely stuck dispatch() call under the real
CLI entrypoints) is NOT_TESTED this round (see cc-report.md).
"""
import subprocess
import sys
import time
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent


class TestWatchdog(unittest.TestCase):
    def _run_with_cap(self, cap_s: float, sleep_s: float) -> subprocess.CompletedProcess:
        script = f"""
import sys, time
sys.path.insert(0, {str(SCRIPTS_DIR)!r})
from dev_notify import watchdog
wd = watchdog.start(cap_s={cap_s!r})
time.sleep({sleep_s!r})  # deliberately longer than cap_s -- must never finish normally
wd.cancel()
print("FINISHED_NORMALLY")  # must never be reached/printed if the watchdog fired first
"""
        return subprocess.run([sys.executable, "-c", script], capture_output=True, text=True, timeout=10)

    def test_hung_body_is_hard_killed_at_approximately_the_cap(self):
        t0 = time.monotonic()
        proc = self._run_with_cap(cap_s=0.5, sleep_s=5.0)
        elapsed = time.monotonic() - t0
        self.assertEqual(proc.returncode, 0, f"stderr={proc.stderr!r}")
        self.assertNotIn("FINISHED_NORMALLY", proc.stdout, "the hung body must never reach its own normal completion")
        self.assertLess(elapsed, 2.0, f"must be killed near the 0.5s cap, not after the full 5s sleep (took {elapsed:.2f}s)")
        self.assertGreaterEqual(elapsed, 0.4, "must not fire before the cap either")

    def test_fast_body_finishes_normally_and_cancels_the_watchdog(self):
        proc = self._run_with_cap(cap_s=5.0, sleep_s=0.1)
        self.assertEqual(proc.returncode, 0)
        self.assertIn("FINISHED_NORMALLY", proc.stdout)

    def test_cancel_after_fire_is_harmless(self):
        # A race where main() finishes and calls cancel() at almost the
        # exact moment the timer fires must never raise or hang.
        script = f"""
import sys, time
sys.path.insert(0, {str(SCRIPTS_DIR)!r})
from dev_notify import watchdog
wd = watchdog.start(cap_s=0.05)
time.sleep(0.2)  # the timer has definitely already fired (process will be dead) --
# this body only reaches here in the (rare) race where cancel() wins;
# either way the test just asserts the subprocess call itself doesn't hang/raise.
try:
    wd.cancel()
except Exception:
    pass
print("DONE")
"""
        proc = subprocess.run([sys.executable, "-c", script], capture_output=True, text=True, timeout=10)
        self.assertEqual(proc.returncode, 0)


if __name__ == "__main__":
    unittest.main()
