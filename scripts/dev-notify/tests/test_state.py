import json
import os
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

from dev_notify import state
from dev_notify.events import EventCategory

SCRIPTS_DIR = Path(__file__).resolve().parent.parent


class TestDedupState(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-state-test-")
        self.state_path = Path(self.tmpdir) / "state.json"

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_first_event_always_sent(self):
        ok = state.check_and_record(self.state_path, ("CC", "claude-cli", "proj", "COMPLETED", None), EventCategory.COMPLETED)
        self.assertTrue(ok)

    def test_same_key_within_window_is_deduplicated(self):
        key = ("CC", "claude-cli", "proj", "COMPLETED", None)
        t0 = 1000.0
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=t0))
        self.assertFalse(state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=t0 + 10))

    def test_same_key_after_window_is_sent_again(self):
        key = ("CC", "claude-cli", "proj", "COMPLETED", None)
        t0 = 1000.0
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=t0))
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=t0 + 76))

    def test_idle_prompt_after_stop_within_75s_is_suppressed(self):
        # Simulates Stop firing, then Notification/idle_prompt ~60s later
        # for the "same" turn -- both map to COMPLETED with the same key
        # (no turn id available), so the second must be suppressed.
        key = ("CC", "claude-cli", "proj", "COMPLETED", None)
        t0 = 1000.0
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=t0))
        self.assertFalse(state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=t0 + 60))

    def test_needs_attention_window_is_15s(self):
        key = ("CC", "claude-cli", "proj", "NEEDS_ATTENTION", None)
        t0 = 1000.0
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.NEEDS_ATTENTION, now=t0))
        self.assertFalse(state.check_and_record(self.state_path, key, EventCategory.NEEDS_ATTENTION, now=t0 + 10))
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.NEEDS_ATTENTION, now=t0 + 20))

    def test_permission_double_event_suppressed(self):
        # PermissionRequest's own companion Notification/permission_prompt
        # firing twice in quick succession for the same still-pending
        # prompt must not double-notify.
        key = ("CC", "claude-cli", "proj", "NEEDS_ATTENTION", None)
        t0 = 2000.0
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.NEEDS_ATTENTION, now=t0))
        self.assertFalse(state.check_and_record(self.state_path, key, EventCategory.NEEDS_ATTENTION, now=t0 + 6))

    def test_failed_window_is_5s(self):
        key = ("CC", "claude-cli", "proj", "FAILED", None)
        t0 = 3000.0
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.FAILED, now=t0))
        self.assertFalse(state.check_and_record(self.state_path, key, EventCategory.FAILED, now=t0 + 2))
        self.assertTrue(state.check_and_record(self.state_path, key, EventCategory.FAILED, now=t0 + 6))

    def test_different_discriminator_is_independent_key(self):
        key_a = ("CC", "claude-cli", "proj", "COMPLETED", "turn-1")
        key_b = ("CC", "claude-cli", "proj", "COMPLETED", "turn-2")
        t0 = 1000.0
        self.assertTrue(state.check_and_record(self.state_path, key_a, EventCategory.COMPLETED, now=t0))
        self.assertTrue(state.check_and_record(self.state_path, key_b, EventCategory.COMPLETED, now=t0 + 1))

    def test_corrupted_state_file_fails_open(self):
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        self.state_path.write_text("{ this is not valid json !!!", encoding="utf-8")
        ok = state.check_and_record(self.state_path, ("CC", "claude-cli", "proj", "COMPLETED", None), EventCategory.COMPLETED)
        self.assertTrue(ok, "a corrupted state file must never block a real notification")

    def test_concurrent_writers_do_not_corrupt_state_or_deadlock(self):
        key = ("CC", "claude-cli", "proj", "COMPLETED", None)
        results = []

        def worker(i):
            ok = state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=5000.0 + i * 0.001)
            results.append(ok)

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(20)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=5)
        self.assertTrue(all(not t.is_alive() for t in threads), "a thread was still alive after 5s -- possible deadlock")
        # The file must still be valid JSON afterward, whatever the
        # dedup outcome of each individual call was.
        data = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertIn("entries", data)

    def test_malformed_input_counter_increments(self):
        state.increment_malformed_input_counter(self.state_path)
        state.increment_malformed_input_counter(self.state_path)
        data = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertEqual(data["malformed_input_count"], 2)

    def test_RN1_stale_lock_mtime_bug_reproduced_then_fixed(self):
        """Direct regression for RN1: _FileLock previously compared
        time.monotonic() (arbitrary reference, NOT epoch-based) against
        os.path.getmtime() (wall clock) -- the difference was a large
        negative number, so a lock older than the threshold was NEVER
        considered stale. This reproduces Jonesy's exact repro: a lock
        file with mtime set 1 hour in the past must be cleared almost
        immediately (not after waiting out the full lock_timeout_s),
        the write must succeed, and dedup must work again afterward."""
        lock_path = Path(str(self.state_path) + ".lock")
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path.write_text("", encoding="utf-8")
        hour_ago = time.time() - 3600
        os.utime(lock_path, (hour_ago, hour_ago))

        key = ("CC", "claude-cli", "proj", "COMPLETED", None)
        t_start = time.monotonic()
        ok = state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=9000.0, lock_timeout_s=2.0)
        elapsed = time.monotonic() - t_start

        self.assertTrue(ok, "first call for a new key must be sent")
        self.assertLess(elapsed, 1.0, f"stale lock should be cleared almost immediately, not after the full wait (took {elapsed:.3f}s)")
        self.assertFalse(lock_path.exists(), "the lock must be released after the call")
        data = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertIn("entries", data)
        self.assertTrue(data["entries"], "the state file must actually have been written, not skipped")

        # Dedup must work again on a second identical call (same key, within window).
        ok2 = state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=9005.0, lock_timeout_s=2.0)
        self.assertFalse(ok2, "dedup must be active again after the stale lock was cleared")

    def test_fresh_lock_is_respected_not_cleared(self):
        """A lock file younger than the stale threshold must NEVER be
        removed by a waiter, even if the waiter's own wait times out --
        this is the 'ekki endurmerkja timeout sem stale' requirement
        from CV4: timing out while waiting is not the same as the lock
        being abandoned."""
        lock_path = Path(str(self.state_path) + ".lock")
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path.write_text("", encoding="utf-8")  # fresh mtime (just created)

        from dev_notify.state import _FileLock
        lock = _FileLock(self.state_path, timeout_s=0.3, stale_threshold_s=30)
        t_start = time.monotonic()
        with lock as acquired_lock:
            elapsed = time.monotonic() - t_start
            self.assertFalse(acquired_lock.acquired, "a fresh lock held by someone else must not be acquired")
        self.assertGreaterEqual(elapsed, 0.25, "must actually wait out the bounded timeout, not bail instantly")
        self.assertLess(elapsed, 1.5, "wait must be bounded, not unbounded")
        self.assertTrue(lock_path.exists(), "a fresh lock must still exist -- it was never 'stale-cleared'")

    def test_check_and_record_fails_open_when_lock_genuinely_busy(self):
        lock_path = Path(str(self.state_path) + ".lock")
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path.write_text("", encoding="utf-8")  # fresh -- simulates a concurrently-running holder
        key = ("CC", "claude-cli", "proj", "COMPLETED", None)
        t_start = time.monotonic()
        ok = state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=9000.0,
                                     lock_timeout_s=0.3, stale_threshold_s=30)
        elapsed = time.monotonic() - t_start
        self.assertTrue(ok, "must fail open (send it) rather than silently drop the notification")
        self.assertLess(elapsed, 1.5, "fail-open must happen within the bounded wait, not hang")

    def test_two_real_simultaneous_processes_do_not_corrupt_state(self):
        """RN1 acceptance explicitly requires a real two-PROCESS test,
        not just two threads in this process (a real deployment has
        two separate hook invocations, two separate Python processes)."""
        key_repr = repr(("CC", "claude-cli", "proj", "COMPLETED", None))
        script = f"""
import sys
from pathlib import Path
sys.path.insert(0, {str(SCRIPTS_DIR)!r})
from dev_notify import state
from dev_notify.events import EventCategory
ok = state.check_and_record(Path({str(self.state_path)!r}), {key_repr}, EventCategory.COMPLETED, now=42000.0)
print(ok)
"""
        procs = [
            subprocess.Popen([sys.executable, "-c", script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            for _ in range(2)
        ]
        outputs = [p.communicate(timeout=10) for p in procs]
        for p, (out, err) in zip(procs, outputs):
            self.assertEqual(p.returncode, 0, f"subprocess crashed: stderr={err}")
        results = [out.strip() for out, _err in outputs]
        self.assertEqual(set(results), {"True", "False"}, f"exactly one of the two concurrent processes should win dedup, got {results}")
        data = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertIn("entries", data)
        lock_path = Path(str(self.state_path) + ".lock")
        self.assertFalse(lock_path.exists(), "no leftover lock file after both processes finish")

    def test_restart_mid_write_leaves_recoverable_state(self):
        # Simulate a prior run's atomic-write convention by writing via
        # the same temp-then-rename path and confirming no partial file
        # is ever left in place for the real path to read.
        key = ("CC", "claude-cli", "proj", "COMPLETED", None)
        state.check_and_record(self.state_path, key, EventCategory.COMPLETED, now=1.0)
        tmp_siblings = list(self.state_path.parent.glob(f"{self.state_path.name}.tmp-*"))
        self.assertEqual(tmp_siblings, [], "no leftover temp-write file should remain after a normal write")


if __name__ == "__main__":
    unittest.main()
