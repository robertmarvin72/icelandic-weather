#!/usr/bin/env python3
"""QA4/AP1(b): runs the dev-notify test suite and prints an explicit
summary that cannot be misread as "all green" when the localhost-
dependent ntfy tests (or the loopback preflight test itself) were
skipped (ENV_LOOPBACK_BLOCKED). `OK (skipped=N)` from plain `unittest`
is easy to read as "N irrelevant tests skipped, everything else
proven" -- this script separates ATTEMPTED, ACTUALLY RUN (attempted
minus skipped), SKIPPED, and FAILED, and names exactly which
Authorization/redirect/timeout assertions (and the preflight test
itself) were not independently verified in THIS run, so that claim is
never silently implied.

Usage (from repo root):
    python scripts/dev-notify/run_tests_with_summary.py
"""
import platform
import sys
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent

# The specific localhost-dependent ntfy assertions this suite makes --
# named here once so the summary can call out exactly which of them
# were skipped, not just a bare count (QA4's own requirement). The
# preflight test itself is tracked separately (AP1b/RD1): it is a
# distinct test from the five below, and must be named when skipped,
# not folded silently into "skipped=N".
_NTFY_LOOPBACK_TESTS = {
    "test_successful_publish_uses_post_only": "POST-only / Authorization-on-wire",
    "test_http_failure_recorded_not_raised": "HTTP 500 recorded as a status, not an exception",
    "test_redirect_is_recorded_and_not_followed": "redirect recorded, never followed",
    "test_timeout_is_recorded_as_error_not_raised": "timeout recorded as a timeout-shaped error",
    "test_body_sha_computed_and_bounded": "request body hashing",
}
_PREFLIGHT_TEST_NAME = "test_real_loopback_is_available_on_this_machine"


def main() -> int:
    loader = unittest.TestLoader()
    suite = loader.discover(str(SCRIPTS_DIR), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=1)
    result = runner.run(suite)

    skipped_names = {t._testMethodName: reason for t, reason in result.skipped}
    skipped_ntfy = {name: label for name, label in _NTFY_LOOPBACK_TESTS.items() if name in skipped_names}
    preflight_skipped = _PREFLIGHT_TEST_NAME in skipped_names

    attempted = result.testsRun
    skipped_count = len(result.skipped)
    actually_run = attempted - skipped_count
    failed_count = len(result.failures) + len(result.errors)

    print()
    print(f"OS: {platform.platform()} | Python: {platform.python_version()}")
    print(f"SUMMARY: {attempted} attempted, {actually_run} actually run, "
          f"{skipped_count} skipped, {failed_count} failed.")
    if preflight_skipped:
        print(f"  - loopback preflight test itself ({_PREFLIGHT_TEST_NAME}) is among the skipped (ENV_LOOPBACK_BLOCKED).")
    if skipped_ntfy:
        print(f"NOT RUN HERE (ENV_LOOPBACK_BLOCKED, localhost-dependent ntfy tests): "
              + ", ".join(sorted(skipped_ntfy)))
        print("These specifically prove: " + "; ".join(sorted(skipped_ntfy.values())) + ".")
        print("Those assertions are NOT independently verified by this run -- see a run from an "
              "environment where loopback works (e.g. the Windows CC run, or Jonesy's Linux sandbox) "
              "for that proof. Do not read 'OK'/'skipped=N' alone as covering them.")
    elif result.skipped:
        print(f"Skipped (not loopback-related): {sorted(skipped_names)}")
    else:
        print("No tests skipped in this run.")

    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
