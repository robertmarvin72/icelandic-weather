"""These are sandbox/CC-attributed logic tests only (NT6) -- they
prove the fallback/timeout LOGIC, never a real toast or balloon. A
real, user-visible Windows-session test is Phase B/NT8's own job.
"""
import unittest

from dev_notify import windows_toast


class TestWindowsToastLogic(unittest.TestCase):
    def test_balloon_is_tried_first_by_default(self):
        """Default order is balloon-first -- see the long comment in
        windows_toast.py: a live 2026-11-11 owner test found toast
        reports success without ever visibly appearing on this
        machine's unregistered-AUMID setup, while balloon was
        confirmed actually seen."""
        calls = []

        def fake_runner(script, title, text, timeout_s, aumid):
            calls.append("toast" if "ToastNotificationManager" in script else "balloon")
            return True, "OK"

        result = windows_toast.send_windows_notification("t", "x", runner=fake_runner)
        self.assertEqual(result["method"], "balloon")
        self.assertTrue(result["ok"])
        self.assertEqual(calls, ["balloon"])  # toast never attempted once balloon succeeds

    def test_balloon_success_short_circuits_toast(self):
        calls = []

        def fake_runner(script, title, text, timeout_s, aumid):
            calls.append("toast" if "ToastNotificationManager" in script else "balloon")
            return True, "OK"

        result = windows_toast.send_windows_notification("t", "x", runner=fake_runner)
        self.assertEqual(calls, ["balloon"])

    def test_balloon_failure_falls_back_to_toast(self):
        def fake_runner(script, title, text, timeout_s, aumid):
            if "ToastNotificationManager" in script:
                return True, "TOAST_OK"
            return False, "BALLOON_FAIL: no Forms assembly"

        result = windows_toast.send_windows_notification("t", "x", runner=fake_runner)
        self.assertEqual(result["method"], "toast")
        self.assertTrue(result["ok"])

    def test_prefer_toast_flag_reverses_order(self):
        calls = []

        def fake_runner(script, title, text, timeout_s, aumid):
            calls.append("toast" if "ToastNotificationManager" in script else "balloon")
            return True, "OK"

        result = windows_toast.send_windows_notification("t", "x", runner=fake_runner, prefer_toast=True)
        self.assertEqual(result["method"], "toast")
        self.assertEqual(calls, ["toast"])  # balloon never attempted

    def test_both_fail_reports_none_without_raising(self):
        def fake_runner(script, title, text, timeout_s, aumid):
            return False, "nope"

        result = windows_toast.send_windows_notification("t", "x", runner=fake_runner)
        self.assertEqual(result["method"], "none")
        self.assertFalse(result["ok"])
        self.assertIn("nope", result["detail"])

    def test_runner_exception_does_not_propagate(self):
        def fake_runner(script, title, text, timeout_s, aumid):
            raise RuntimeError("simulated transport failure")

        with self.assertRaises(RuntimeError):
            # send_windows_notification itself doesn't swallow a raise
            # from its own runner parameter -- that's dispatch()'s job
            # (tested in test_dispatch.py), so this documents the
            # boundary precisely rather than assuming it.
            windows_toast.send_windows_notification("t", "x", runner=fake_runner)


if __name__ == "__main__":
    unittest.main()
