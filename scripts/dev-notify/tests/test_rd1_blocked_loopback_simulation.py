"""RD1/AP1(a): proves that a genuinely blocked loopback environment
produces 0 FAIL / 6 SKIP (1 preflight test + 5 ntfy-wire tests) after
the fix -- never 1 FAIL / 5 SKIP, the exact pattern both Ripley and CC
observed before `test_real_loopback_is_available_on_this_machine` was
changed from `assertTrue` to `skipTest`.

The blocked case is proven ONLY via dependency injection (monkey-
patching `_loopback.loopback_available` for the duration of this one
test), never by changing a real firewall or machine setting (AP1(a)'s
own requirement) -- this works on any machine regardless of whether
its own loopback is actually blocked.
"""
import unittest

from . import _loopback
# Imported as MODULES, not `from .test_x import TestX` -- unittest's
# TestLoader.loadTestsFromModule scans a module's namespace for any
# accessible TestCase subclass, including one merely imported into
# it, and would otherwise double-collect these two classes under
# `python -m unittest discover` (confirmed: this file's own first
# draft inflated the suite from 145 to 156 tests this way).
from . import test_loopback_preflight as _test_loopback_preflight_mod
from . import test_ntfy_client as _test_ntfy_client_mod


class TestRD1BlockedLoopbackSimulation(unittest.TestCase):
    def test_simulated_blocked_loopback_yields_zero_fail_and_six_skip(self):
        real_loopback_available = _loopback.loopback_available

        def blocked_loopback_available(connect=None, timeout_s=1.0):
            return False, "ENV_LOOPBACK_BLOCKED: simulated for RD1 verification"

        _loopback.loopback_available = blocked_loopback_available
        try:
            suite = unittest.TestSuite()
            loader = unittest.TestLoader()
            suite.addTests(loader.loadTestsFromTestCase(_test_loopback_preflight_mod.TestLoopbackPreflight))
            suite.addTests(loader.loadTestsFromTestCase(_test_ntfy_client_mod.TestNtfyClient))
            runner = unittest.TextTestRunner(verbosity=0, stream=_DevNull())
            result = runner.run(suite)
        finally:
            _loopback.loopback_available = real_loopback_available

        self.assertEqual(len(result.failures), 0, f"failures: {result.failures}")
        self.assertEqual(len(result.errors), 0, f"errors: {result.errors}")
        self.assertEqual(len(result.skipped), 6, f"expected 1 preflight + 5 ntfy-wire tests skipped, got: {[n for n, _ in result.skipped]}")
        skipped_names = {t._testMethodName for t, _ in result.skipped}
        self.assertIn("test_real_loopback_is_available_on_this_machine", skipped_names)
        for name in ("test_successful_publish_uses_post_only", "test_http_failure_recorded_not_raised",
                     "test_redirect_is_recorded_and_not_followed", "test_timeout_is_recorded_as_error_not_raised",
                     "test_body_sha_computed_and_bounded"):
            self.assertIn(name, skipped_names)
        # These two never need loopback at all (they raise before any
        # socket operation) -- confirming they are NOT among the skips.
        self.assertNotIn("test_disallowed_host_refused_before_connecting", skipped_names)
        self.assertNotIn("test_empty_topic_refused", skipped_names)


class _DevNull:
    def write(self, *a, **kw):
        pass

    def flush(self):
        pass


if __name__ == "__main__":
    unittest.main()
