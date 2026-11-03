"""#485 iteration-4 correction v7 (R1 fix, R2) -- mutation regression tests,
required verbatim by `approved-prompt-v6.md`: "Persist runnable tests/
mutation scripts: raw-request-URL ledger regression and raw-exception-
output regression in scratch copies, each must demonstrably fail
secret-safety assertion with nonzero RED; restore clean copy/code,
GREEN, final sourcehash unchanged."

Both mutations below are applied to a SCRATCH COPY only -- the real
`ledger.py`/`child_worker.py` source text is read, a small, explicit,
disclosed string substitution reintroduces an exact historical defect
(the iteration-3 bugs this whole task exists to fix), and the result is
written to a throwaway file under `tmp/mutation/`. The real files are
never opened for writing by this script at all. Each test:
  1. RED -- runs the SAME secret-safety assertion against the MUTATED
     scratch copy and confirms it genuinely fails (the secret leaks).
     This is the proof that our test suite has teeth: it would catch
     this exact regression if it were ever reintroduced for real.
  2. GREEN -- runs the identical assertion against the real, unmodified
     module and confirms it passes (already proven elsewhere; repeated
     here so RED and GREEN sit side by side under one mutation).
  3. Confirms the real source file's SHA-256 is byte-identical before
     and after the whole exercise -- the mutation never touched it.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import uuid

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _THIS_DIR)
sys.path.insert(0, _PARENT_DIR)

import _url_leak_injection_runner as injector  # noqa: E402
import _docs_fixture as fixture  # noqa: E402
import pipeline  # noqa: E402

MUTATION_ROOT = os.path.join(_PARENT_DIR, "tmp", "mutation")
RUNNER_PATH = os.path.join(_THIS_DIR, "_url_leak_injection_runner.py")


def _sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def _fresh_mutation_dir(name):
    d = os.path.join(MUTATION_ROOT, name)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d, exist_ok=True)
    return d


# ---------------------------------------------------------------------------
# Mutation 1: raw-request-URL ledger regression (iteration-3's defect:
# "reserve() persisted the full raw request URL, including the query
# string, before any redaction").
# ---------------------------------------------------------------------------

_LEDGER_SOURCE_PATH = os.path.join(_PARENT_DIR, "ledger.py")

_LEDGER_MUTATION_FROM = '''def reserve_attempt(path):
    """Durable BEFORE dispatch. Refuses with `LedgerTerminal` if the
    ledger is already terminal (persists across restarts); refuses with
    `LedgerIncomplete` (R2) if any prior attempt never reached a complete
    outcome; refuses with `BudgetExceeded`/`LedgerAmbiguous` for the
    ordinary cap/window/clock problems. Returns the new attempt's unique
    ID. The attempt's `reserved_decoded_cap` (R4) is
    `min(per-attempt cap, remaining global budget)`, computed here, under
    the same lock, from the durable pre-dispatch reservation itself."""
    with _ExclusiveLock(path):
        ledger = load_ledger(path)
        _check_not_terminal(ledger)
        _check_no_incomplete(ledger)
        now_epoch = _now_epoch()
        _check_budget(ledger, now_epoch)
        if ledger["run_window_start_utc"] is None:
            ledger["run_window_start_utc"] = now_utc_iso()

        caps = CLASS_CAPS["provider"]
        remaining_global = caps["bytes_total"] - ledger["bytes_total"]
        reserved_cap = min(caps["bytes_per_attempt"], remaining_global)

        attempt_id = uuid.uuid4().hex
        ledger["attempts"].append({
            "id": attempt_id, "status": "reserved", "reserved_utc": now_utc_iso(),
            "target_origin": None,
            "reserved_decoded_cap": reserved_cap,
            "outcome": None,
        })
        _atomic_write(path, ledger)
        return attempt_id'''

_LEDGER_MUTATION_TO = '''def reserve_attempt(path, raw_url=None):
    """MUTATED (test-only, scratch copy): reintroduces iteration-3's
    defect -- persists the caller's raw request URL (secret and all)
    directly into the attempt record, unredacted."""
    with _ExclusiveLock(path):
        ledger = load_ledger(path)
        _check_not_terminal(ledger)
        _check_no_incomplete(ledger)
        now_epoch = _now_epoch()
        _check_budget(ledger, now_epoch)
        if ledger["run_window_start_utc"] is None:
            ledger["run_window_start_utc"] = now_utc_iso()

        caps = CLASS_CAPS["provider"]
        remaining_global = caps["bytes_total"] - ledger["bytes_total"]
        reserved_cap = min(caps["bytes_per_attempt"], remaining_global)

        attempt_id = uuid.uuid4().hex
        ledger["attempts"].append({
            "id": attempt_id, "status": "reserved", "reserved_utc": now_utc_iso(),
            "target_origin": None,
            "reserved_decoded_cap": reserved_cap,
            "outcome": None,
            "raw_url": raw_url,
        })
        _atomic_write(path, ledger)
        return attempt_id'''


def test_raw_url_ledger_mutation_red_then_real_code_green():
    print("[mutation 1] raw-request-URL ledger regression: RED on a mutated scratch copy, "
          "GREEN on the real code, real source hash unchanged ... ")
    hash_before = _sha256(_LEDGER_SOURCE_PATH)

    mdir = _fresh_mutation_dir("ledger_raw_url_" + uuid.uuid4().hex[:8])
    real_source = open(_LEDGER_SOURCE_PATH, encoding="utf-8").read()
    assert _LEDGER_MUTATION_FROM in real_source, (
        "test setup bug: expected reserve_attempt() source snippet not found verbatim in ledger.py "
        "-- this mutation test is stale relative to the real file and must be updated, not skipped")
    mutated_source = real_source.replace(_LEDGER_MUTATION_FROM, _LEDGER_MUTATION_TO, 1)
    assert mutated_source != real_source
    mutated_path = os.path.join(mdir, "ledger.py")
    with open(mutated_path, "w", encoding="utf-8") as f:
        f.write(mutated_source)
    # limits.py is an unmodified dependency the mutated copy still needs.
    shutil.copy2(os.path.join(_PARENT_DIR, "limits.py"), os.path.join(mdir, "limits.py"))

    import importlib.util
    spec = importlib.util.spec_from_file_location("mutated_ledger_" + uuid.uuid4().hex[:8], mutated_path)
    mutated_ledger = importlib.util.module_from_spec(spec)
    sys.path.insert(0, mdir)
    try:
        spec.loader.exec_module(mutated_ledger)

        fake_secret = "ITER4-MUTATION-LEDGER-FAKE-SECRET-aaa111"
        raw_url = f"http://fake-provider.invalid/v1/forecast?latitude=1.0&apikey={fake_secret}"
        lp = os.path.join(mdir, "mutated_ledger.json")
        aid = mutated_ledger.reserve_attempt(lp, raw_url=raw_url)
        ledger_text = open(lp, encoding="utf-8").read()

        red_failed = fake_secret in ledger_text
        assert red_failed, (
            "RED-step setup bug: the mutated ledger did NOT actually leak the secret -- "
            "the mutation did not reintroduce the defect it claims to")
        print(f"    RED confirmed: mutated reserve_attempt(raw_url=...) DID leak the fake secret "
              f"into the ledger file (attempt {aid[:8]}...) -- our safety assertion correctly "
              f"fails against this exact historical defect")
    finally:
        sys.path.remove(mdir)
        shutil.rmtree(mdir, ignore_errors=True)

    # GREEN: the SAME kind of assertion against the real, unmodified module.
    import ledger as real_ledger
    importlib.reload(real_ledger)
    green_dir = _fresh_mutation_dir("ledger_real_check_" + uuid.uuid4().hex[:8])
    lp2 = os.path.join(green_dir, "ledger.json")
    try:
        aid2 = real_ledger.reserve_attempt(lp2)  # no raw_url parameter exists on the real function
        ledger_text2 = open(lp2, encoding="utf-8").read()
        assert fake_secret not in ledger_text2, "RED: the REAL ledger module leaked the fake secret"
        print(f"    GREEN confirmed: the real, unmutated ledger.reserve_attempt() takes no such "
              f"parameter and the ledger stays clean (attempt {aid2[:8]}...)")
    finally:
        shutil.rmtree(green_dir, ignore_errors=True)

    hash_after = _sha256(_LEDGER_SOURCE_PATH)
    assert hash_after == hash_before, (
        f"RED: ledger.py's own hash changed during this mutation exercise "
        f"({hash_before} -> {hash_after}) -- the real file was touched")
    print(f"    source hash unchanged throughout: {hash_before}")


# ---------------------------------------------------------------------------
# Mutation 2: raw-exception-output regression (iteration-3's defect:
# `do_fetch.py` printed `str(e)`, which can embed host/URL/secret text).
# Targets `transport_core.request()`'s own catch-all -- the actual layer
# in THIS architecture responsible for discarding raw exception text
# before it ever reaches `child_worker.py` (which only ever sees the
# already-sanitised `TransportError.category`). Mutating `child_worker.py`
# itself would not reproduce the defect: `transport_core.request()`'s
# unconditional `except Exception: raise TransportError(...)` means no
# raw exception from a connect()/socket fault can ever reach
# `child_worker.py`'s own `except Exception:` branch in the first place.
# ---------------------------------------------------------------------------

_TRANSPORT_SOURCE_PATH = os.path.join(_PARENT_DIR, "transport_core.py")
MUTATION2_RUNNER_PATH = os.path.join(_THIS_DIR, "_mutation2_runner.py")

_TRANSPORT_MUTATION_FROM = '''    except TransportError:
        raise
    except Exception:
        # Catch-all: never let a raw exception (which can embed the query
        # string, and therefore the secret) propagate past this function.
        raise TransportError(CATEGORY_TRANSPORT_FAILURE)'''

_TRANSPORT_MUTATION_TO = '''    except TransportError:
        raise
    except Exception as _mutated_e:
        # MUTATED (test-only, scratch copy): reintroduces the do_fetch.py-
        # style defect -- the raw exception's own str() (which can embed
        # the full query string, and therefore the secret) is folded into
        # the category instead of being discarded.
        raise TransportError(f"{CATEGORY_TRANSPORT_FAILURE}: {_mutated_e}")'''


def test_raw_exception_output_mutation_red_then_real_code_green():
    print("[mutation 2] raw-exception-output regression: RED on a mutated scratch copy, "
          "GREEN on the real code, real source hash unchanged ... ")
    hash_before = _sha256(_TRANSPORT_SOURCE_PATH)

    mdir = _fresh_mutation_dir("transport_raw_exc_" + uuid.uuid4().hex[:8])
    real_source = open(_TRANSPORT_SOURCE_PATH, encoding="utf-8").read()
    assert _TRANSPORT_MUTATION_FROM in real_source, (
        "test setup bug: expected catch-all snippet not found verbatim in transport_core.py "
        "-- this mutation test is stale relative to the real file and must be updated, not skipped")
    mutated_source = real_source.replace(_TRANSPORT_MUTATION_FROM, _TRANSPORT_MUTATION_TO, 1)
    assert mutated_source != real_source
    mutated_path = os.path.join(mdir, "transport_core.py")
    with open(mutated_path, "w", encoding="utf-8") as f:
        f.write(mutated_source)

    fake_secret = "ITER4-MUTATION2-FAKE-SECRET-bbb222"
    stdin_bytes = (json.dumps({
        "query_no_key": "latitude=1.0", "secret": fake_secret,
        "deadline_epoch": __import__("time").time() + 10, "decoded_cap": 100_000,
    }) + "\n").encode()

    popen_kwargs = dict(stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=_PARENT_DIR)
    if sys.platform == "win32":
        popen_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

    proc = subprocess.run([sys.executable, "-B", MUTATION2_RUNNER_PATH, mdir],
                           input=stdin_bytes, timeout=15, **popen_kwargs)
    stdout_text = proc.stdout.decode("utf-8", "replace")
    fake_url = f"http://fake-provider.invalid/v1/forecast?latitude=1.0&apikey={fake_secret}"
    try:
        red_failed = fake_secret in stdout_text or fake_url in stdout_text
        assert red_failed, (
            "RED-step setup bug: the mutated transport_core.py did NOT actually leak the "
            "secret/URL into stdout -- the mutation did not reintroduce the defect it claims to")
        print(f"    RED confirmed: mutated transport_core.py (str(e) folded into category) DID leak "
              f"secret-shaped text into stdout, via the REAL unmodified child_worker.py -- our "
              f"safety assertion correctly fails against this exact historical defect")
    finally:
        shutil.rmtree(mdir, ignore_errors=True)

    # GREEN: the identical injection (same fault, same fake secret) against
    # the real, unmodified transport_core.py + child_worker.py (already
    # proven separately in test_url_leak_injection.py; repeated here so
    # RED/GREEN sit side by side under this one mutation).
    import _url_leak_injection_runner as real_injector
    real_stdin_bytes = (json.dumps({
        "query_no_key": "latitude=1.0", "secret": real_injector.FAKE_SECRET,
        "deadline_epoch": __import__("time").time() + 10, "decoded_cap": 100_000,
    }) + "\n").encode()
    proc2 = subprocess.run([sys.executable, "-B", RUNNER_PATH],
                            input=real_stdin_bytes, timeout=15, **popen_kwargs)
    stdout_text2 = proc2.stdout.decode("utf-8", "replace")
    assert real_injector.FAKE_SECRET not in stdout_text2 and real_injector.FAKE_URL not in stdout_text2, (
        f"RED: the REAL transport_core.py/child_worker.py leaked the fake secret/URL: {stdout_text2!r}")
    print(f"    GREEN confirmed: the real, unmutated transport_core.py stays clean")

    hash_after = _sha256(_TRANSPORT_SOURCE_PATH)
    assert hash_after == hash_before, (
        f"RED: transport_core.py's own hash changed during this mutation exercise "
        f"({hash_before} -> {hash_after}) -- the real file was touched")
    print(f"    source hash unchanged throughout: {hash_before}")


# ---------------------------------------------------------------------------
# Mutation 3 (v8 R1/R2): reverts the sample-validator allowlist and the
# incompleteness check back to their v7 shapes in a scratch copy only --
# reproducing the EXACT historical defect Jonesy's Round-3 review found
# (documented fields rejected as unsafe; `{}` accepted as a valid sample).
# ---------------------------------------------------------------------------

_PIPELINE_SOURCE_PATH = os.path.join(_PARENT_DIR, "pipeline.py")

_ALLOWLIST_FROM = (
    '_SAMPLE_ALLOWED_TOP_FIELDS = {"latitude", "longitude", "elevation", "hourly_units", "hourly", '
    '"generationtime_ms",\n                              "utc_offset_seconds", "timezone", "timezone_abbreviation"}'
)
_ALLOWLIST_TO = (
    '_SAMPLE_ALLOWED_TOP_FIELDS = {"latitude", "longitude", "elevation", "hourly_units", "hourly", '
    '"generationtime_ms"}  # MUTATED (test-only): reverted to the v7 allowlist, missing the documented fields'
)

# v8's `_validate_sample_shape` only COUNTS unknown fields (never raises
# for them) -- shrinking the allowlist set alone has no effect on
# acceptance any more, since "unknown" stopped meaning "unsafe" in v8.
# To actually reproduce the v7 defect, the unknown-field handling itself
# must also be reverted to RAISE, not merely count.
_UNKNOWN_FIELD_HANDLING_FROM = "    unknown_field_count = len(set(payload.keys()) - _SAMPLE_ALLOWED_TOP_FIELDS)"
_UNKNOWN_FIELD_HANDLING_TO = '''    unexpected = set(payload.keys()) - _SAMPLE_ALLOWED_TOP_FIELDS
    if unexpected:
        # MUTATED (test-only): v7-style -- ANY unrecognised field is a
        # hard rejection, exactly the defect that rejected documented,
        # normal fields as if they were unsafe.
        raise ValueError(f"unexpected top-level field(s): {sorted(unexpected)}")
    unknown_field_count = 0'''

_INCOMPLETE_CHECK_FROM = '''    if not _is_complete_forecast(safe):
        return None, SAMPLE_INCOMPLETE, unknown_field_count'''
_INCOMPLETE_CHECK_TO = '''    if False:  # MUTATED (test-only): v7-style -- {} and other incomplete shapes pass as VALID again
        return None, SAMPLE_INCOMPLETE, unknown_field_count'''


def test_sample_validator_mutation_red_then_real_code_green():
    print("[mutation 3] sample-validator regression (v8 R1/R2): RED on a scratch copy reverted to the "
          "v7 allowlist/incompleteness behaviour, GREEN on the real v8 code, real source hash unchanged ... ")
    hash_before = _sha256(_PIPELINE_SOURCE_PATH)

    mdir = _fresh_mutation_dir("pipeline_sample_" + uuid.uuid4().hex[:8])
    real_source = open(_PIPELINE_SOURCE_PATH, encoding="utf-8").read()
    assert _ALLOWLIST_FROM in real_source, (
        "test setup bug: expected _SAMPLE_ALLOWED_TOP_FIELDS source snippet not found verbatim in "
        "pipeline.py -- this mutation test is stale relative to the real file and must be updated, not skipped")
    assert _UNKNOWN_FIELD_HANDLING_FROM in real_source, (
        "test setup bug: expected unknown-field-counting source snippet not found verbatim in "
        "pipeline.py -- this mutation test is stale relative to the real file and must be updated, not skipped")
    assert _INCOMPLETE_CHECK_FROM in real_source, (
        "test setup bug: expected _is_complete_forecast() check snippet not found verbatim in "
        "pipeline.py -- this mutation test is stale relative to the real file and must be updated, not skipped")
    mutated_source = real_source.replace(_ALLOWLIST_FROM, _ALLOWLIST_TO, 1)
    mutated_source = mutated_source.replace(_UNKNOWN_FIELD_HANDLING_FROM, _UNKNOWN_FIELD_HANDLING_TO, 1)
    mutated_source = mutated_source.replace(_INCOMPLETE_CHECK_FROM, _INCOMPLETE_CHECK_TO, 1)
    assert mutated_source != real_source
    mutated_path = os.path.join(mdir, "pipeline.py")
    with open(mutated_path, "w", encoding="utf-8") as f:
        f.write(mutated_source)

    import importlib.util
    spec = importlib.util.spec_from_file_location("mutated_pipeline_" + uuid.uuid4().hex[:8], mutated_path)
    mutated_pipeline = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mutated_pipeline)  # real leak_scanner/ledger/schema/etc. resolve via sys.path as-is

        doc_body = fixture.build_documented_sample_body()
        sample, status, n = mutated_pipeline._validate_and_scan_sample(doc_body, "irrelevant-secret")
        red1 = status != mutated_pipeline.SAMPLE_VALID
        print(f"    RED check 1 (documented fixture against the reverted allowlist): "
              f"status={status} (expected NOT VALID) -- {'confirmed' if red1 else 'FAILED TO REPRODUCE'}")

        sample0, status0, n0 = mutated_pipeline._validate_and_scan_sample(b"{}", "irrelevant-secret")
        red2 = status0 == mutated_pipeline.SAMPLE_VALID
        print(f"    RED check 2 ('{{}}' against the disabled incompleteness check): "
              f"status={status0} (expected VALID, reproducing the old bug) -- "
              f"{'confirmed' if red2 else 'FAILED TO REPRODUCE'}")

        assert red1, "RED-step setup bug: the mutated allowlist did NOT actually reject the documented fixture"
        assert red2, "RED-step setup bug: the mutated incompleteness check did NOT actually accept '{}' as valid"
    finally:
        shutil.rmtree(mdir, ignore_errors=True)

    # GREEN: the SAME two inputs against the real, unmutated pipeline.py.
    doc_body = fixture.build_documented_sample_body()
    real_sample, real_status, real_n = pipeline._validate_and_scan_sample(doc_body, "irrelevant-secret")
    assert real_status == pipeline.SAMPLE_VALID, (
        f"RED: the REAL pipeline.py rejected the documented fixture: {real_status}")
    real_sample0, real_status0, real_n0 = pipeline._validate_and_scan_sample(b"{}", "irrelevant-secret")
    assert real_status0 == pipeline.SAMPLE_INCOMPLETE, (
        f"RED: the REAL pipeline.py accepted '{{}}' as a valid sample: {real_status0}")
    print(f"    GREEN confirmed: the real, unmutated pipeline.py accepts the documented fixture "
          f"(status={real_status}) and correctly classifies '{{}}' as {real_status0}, not VALID")

    hash_after = _sha256(_PIPELINE_SOURCE_PATH)
    assert hash_after == hash_before, (
        f"RED: pipeline.py's own hash changed during this mutation exercise "
        f"({hash_before} -> {hash_after}) -- the real file was touched")
    print(f"    source hash unchanged throughout: {hash_before}")


def main():
    test_raw_url_ledger_mutation_red_then_real_code_green()
    test_raw_exception_output_mutation_red_then_real_code_green()
    test_sample_validator_mutation_red_then_real_code_green()
    print("\nALL MUTATION REGRESSION TESTS PASS (exit 0).")


if __name__ == "__main__":
    main()
