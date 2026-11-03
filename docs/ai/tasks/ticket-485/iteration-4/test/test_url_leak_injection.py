"""#485 iteration-4 correction v7 (R1 fix, R2/R6 proof) -- injects a raw,
URL-and-secret-bearing exception at the lowest socket level, through the
REAL, unmodified production `child_worker.py` (loaded straight off disk
via `runpy.run_path()` in `_url_leak_injection_runner.py`, never copied
or edited), and proves that fake secret+URL text appears NOWHERE: not in
raw stdout, not in raw stderr (which is also where an uncaught
exception's formatted traceback -- i.e. its str()/repr() -- would land,
so a clean stderr here covers that angle too, since nothing in this
design ever lets such an exception escape to OUR code for us to inspect
directly), not in the parsed outcome dict, and not in the real ledger
file when driven through pipeline's actual dispatch function.

R1 correction: the runner now installs `_network_guard` and retargets
`provider_target` to a literal loopback address (see
`_url_leak_injection_runner.py`) -- v6's version of this test ran
`child_worker.py` against the REAL `customer-api.open-meteo.com` host,
which caused a real (if harmless, connection-less) DNS lookup. Zero
external resolver/socket activity now occurs anywhere in this test.
"""
import json
import os
import subprocess
import sys
import time

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _THIS_DIR)
sys.path.insert(0, _PARENT_DIR)

import _url_leak_injection_runner as injector  # noqa: E402
import ledger  # noqa: E402
import pipeline  # noqa: E402

RUNNER_PATH = os.path.join(_THIS_DIR, "_url_leak_injection_runner.py")

# Any of transport_core.py's own fixed category constants, or
# child_worker.py's generic fallback -- i.e. the request failed SAFELY,
# through one of this design's existing, hardcoded-string exception
# handlers, never "OK" and never anything dynamically built from the
# injected exception's own text. Which exact one fires is environment-
# dependent (e.g. whether this sandbox's socket.getaddrinfo() raises
# socket.gaierror specifically, caught before connect() is ever reached,
# or a different OSError, caught by the outer catch-all) -- both are
# equally valid proof that nothing leaks, so this test accepts either.
SAFE_FAILURE_CATEGORIES = {
    "CONNECT_FAILURE", "CONNECT_TIMEOUT", "TLS_FAILURE", "READ_TIMEOUT",
    "TRANSPORT_FAILURE", "DEADLINE_EXCEEDED", "CHILD_INTERNAL_ERROR",
}


def _popen_kwargs():
    kwargs = dict(stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=_PARENT_DIR)
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    return kwargs


def _stdin_payload():
    return {"query_no_key": "latitude=1.0", "secret": injector.FAKE_SECRET,
            "deadline_epoch": time.time() + 10, "decoded_cap": 100_000}


def test_raw_stdout_and_stderr_never_contain_the_injected_url_or_secret():
    print("[url-leak 1] raw low-level OSError embeds a full URL+secret; REAL unmodified child_worker.py "
          "is run via it -- raw stdout/stderr checked directly ... ")
    stdin_bytes = (json.dumps(_stdin_payload()) + "\n").encode()
    proc = subprocess.run([sys.executable, "-B", RUNNER_PATH], input=stdin_bytes,
                           timeout=15, **_popen_kwargs())
    stdout_text = proc.stdout.decode("utf-8", "replace")
    stderr_text = proc.stderr.decode("utf-8", "replace")

    assert injector.FAKE_SECRET not in stdout_text, f"RED: fake secret leaked into stdout: {stdout_text!r}"
    assert injector.FAKE_URL not in stdout_text, f"RED: fake URL leaked into stdout: {stdout_text!r}"
    assert injector.FAKE_SECRET not in stderr_text, (
        f"RED: fake secret leaked into stderr (would also mean an uncaught exception's "
        f"formatted traceback reached stderr): {stderr_text!r}")
    assert injector.FAKE_URL not in stderr_text, f"RED: fake URL leaked into stderr: {stderr_text!r}"

    lines = stdout_text.strip().splitlines()
    meta = json.loads(lines[0])
    assert meta["category"] in SAFE_FAILURE_CATEGORIES, (
        f"RED: expected a known-safe fixed failure category, got {meta}")
    print(f"    PASS: category={meta['category']}, neither the fake secret nor the fake URL text "
          f"appears anywhere in raw stdout or stderr (stderr length={len(stderr_text)})")


def test_full_real_dispatch_path_outcome_and_ledger_stay_clean():
    print("[url-leak 2] the same injection through pipeline's REAL dispatch function: "
          "outcome dict and the real ledger file both stay clean ... ", end="")
    stdin_obj = _stdin_payload()
    stdin_bytes = (json.dumps(stdin_obj) + "\n").encode()
    outcome, validated_sample, sample_status, unknown_field_count = pipeline._dispatch_child_and_collect(
        stdin_bytes, injector.FAKE_SECRET, 10, RUNNER_PATH)

    outcome_text = json.dumps(outcome)
    assert injector.FAKE_SECRET not in outcome_text, f"RED: fake secret leaked into the outcome dict: {outcome}"
    assert injector.FAKE_URL not in outcome_text, f"RED: fake URL leaked into the outcome dict: {outcome}"
    assert outcome["category"] in SAFE_FAILURE_CATEGORIES, outcome
    assert validated_sample is None and sample_status == pipeline.SAMPLE_NOT_APPLICABLE

    os.makedirs(pipeline.SAMPLES_DIR, exist_ok=True)
    lp = os.path.join(pipeline.HERE, "tmp", "url_leak_ledger_test", "ledger.json")
    os.makedirs(os.path.dirname(lp), exist_ok=True)
    try:
        aid = ledger.reserve_attempt(lp)
        ledger.record_outcome(lp, aid, outcome)
        ledger_text = open(lp, encoding="utf-8").read()
        assert injector.FAKE_SECRET not in ledger_text, "RED: fake secret leaked into the ledger file"
        assert injector.FAKE_URL not in ledger_text, "RED: fake URL leaked into the ledger file"
    finally:
        import shutil
        shutil.rmtree(os.path.dirname(lp), ignore_errors=True)
    print(f"PASS (outcome={outcome}, ledger file clean of both the fake secret and the fake URL)")


def main():
    test_raw_stdout_and_stderr_never_contain_the_injected_url_or_secret()
    test_full_real_dispatch_path_outcome_and_ledger_stay_clean()
    print("\nALL URL-LEAK INJECTION TESTS PASS (exit 0).")


if __name__ == "__main__":
    main()
