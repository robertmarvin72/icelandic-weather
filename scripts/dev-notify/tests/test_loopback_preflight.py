"""Proves _loopback.loopback_available()'s own two outcomes, per
CV2(a). The TRUE path is exercised naturally by every other test file
that uses a real localhost server; the FALSE path is proven here via
an injected failing `connect`, since this session's own environment
has never reproduced a genuinely blocked loopback (Ripley's original
sandbox did; this round cannot and does not claim to reproduce that
specific environment -- see cc-report.md).
"""
import socket
import unittest

from . import _loopback


class TestLoopbackPreflight(unittest.TestCase):
    def test_real_loopback_is_available_on_this_machine(self):
        """RD1 fix (2026-11-12): this test previously used
        `assertTrue(ok)`, which FAILS (not skips) on a machine where
        loopback is genuinely blocked -- exactly the `FAILED
        (failures=1, skipped=5)` pattern both Ripley and CC observed,
        contradicting CV2(a)'s own "neither green nor red" requirement
        for this exact scenario. A blocked real environment is now a
        skip, named with the same ENV_LOOPBACK_BLOCKED reason the
        consuming tests in test_ntfy_client.py already use -- never a
        failure, and never silently reported as a pass either."""
        ok, reason = _loopback.loopback_available()
        if not ok:
            self.skipTest(reason)
        self.assertTrue(ok)
        self.assertIsNone(reason)

    def test_injected_connect_failure_reports_env_loopback_blocked(self):
        def failing_connect(address, timeout):
            raise OSError("simulated: loopback connect refused by sandbox policy")

        ok, reason = _loopback.loopback_available(connect=failing_connect)
        self.assertFalse(ok)
        self.assertIsNotNone(reason)
        self.assertIn("ENV_LOOPBACK_BLOCKED", reason)

    def test_result_is_neither_silently_true_nor_a_raised_exception(self):
        # CV2(a): the outcome must be a named, inspectable result --
        # never an uncaught exception, and never coerced into looking
        # like an ordinary pass.
        def failing_connect(address, timeout):
            raise OSError("simulated failure")

        try:
            ok, reason = _loopback.loopback_available(connect=failing_connect)
        except Exception as e:
            self.fail(f"loopback_available() must never raise, got {e!r}")
        self.assertFalse(ok)


if __name__ == "__main__":
    unittest.main()
