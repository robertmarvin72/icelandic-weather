"""#485 iteration-4 correction v8 (R1/R2, replacing v7 R6's single
SAMPLE_INVALID outcome) -- persisted tests for:
(a) `pipeline.safe_recursive_delete_under_tmp()` -- refuses to delete
    anything outside (or equal to) this candidate's own `tmp/` directory.
(b) `pipeline._validate_and_scan_sample()` -- now returns
    `(validated_dict_or_None, sample_status, unknown_field_count)`.
    Malformed JSON, secret reflection, or an invalid stored-field type/
    value -> `SAMPLE_STRUCTURAL_FAILURE` (terminal, same as v7's single
    "invalid" outcome). A top-level JSON list -> `SAMPLE_UNSUPPORTED_
    TOP_LEVEL_LIST` (non-terminal, new in v8). A well-formed but
    incomplete body (e.g. `{}`) -> `SAMPLE_INCOMPLETE` (non-terminal,
    new in v8). An ADDITIVE unknown top-level field is dropped and
    counted, never terminal by itself (new in v8) -- this is the actual
    R1 fix: v7's allowlist rejected documented, normal response fields
    (`utc_offset_seconds`/`timezone`/`timezone_abbreviation`) as if they
    were unsafe.
(c) `pipeline._write_unique_sample()` -- writes to a filename unique to
    the given attempt ID, never a fixed/shared name (R6: no overwrite).

Uses the shared realistic fixture (`test/_docs_fixture.py`, built from
the retained docs sample's actual structure) for every success-path
test -- not a minimal `{}`/single-field fixture, which is exactly what
let the v7 defect through undetected.
"""
import json
import os
import shutil
import sys

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _THIS_DIR)
sys.path.insert(0, _PARENT_DIR)

import pipeline  # noqa: E402
import _docs_fixture as fixture  # noqa: E402

FAKE_KEY = "ITER4-SAMPLE-SAFETY-FAKE-KEY-qqq111"


def _fresh_tmp_subdir(name):
    d = os.path.join(pipeline.HERE, "tmp", "sample_safety_" + name)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d, exist_ok=True)
    return d


# ---------------------------------------------------------------------------
# safe_recursive_delete_under_tmp()
# ---------------------------------------------------------------------------

def test_delete_outside_tmp_is_refused():
    print("[cleanup-safety 1] a target OUTSIDE tmp/ is refused -- not deleted, returns False ... ", end="")
    outside_dir = _fresh_tmp_subdir("escape_victim")
    victim = os.path.join(pipeline.HERE, "samples", "_not_under_tmp_marker_dir")
    os.makedirs(victim, exist_ok=True)
    marker = os.path.join(victim, "must_survive.txt")
    with open(marker, "w", encoding="utf-8") as f:
        f.write("must survive")
    try:
        result = pipeline.safe_recursive_delete_under_tmp(victim)
        assert result is False, f"RED: expected False, got {result}"
        assert os.path.exists(marker), "RED: a path outside tmp/ was actually deleted"
        print(f"PASS (refused, {marker} still exists)")
    finally:
        shutil.rmtree(victim, ignore_errors=True)
        shutil.rmtree(outside_dir, ignore_errors=True)


def test_delete_of_tmp_root_itself_is_refused():
    print("[cleanup-safety 2] the tmp/ root ITSELF is refused (only things strictly inside it) ... ", end="")
    tmp_root = os.path.join(pipeline.HERE, "tmp")
    os.makedirs(tmp_root, exist_ok=True)
    result = pipeline.safe_recursive_delete_under_tmp(tmp_root)
    assert result is False, f"RED: expected False for the tmp root itself, got {result}"
    assert os.path.isdir(tmp_root), "RED: the tmp root directory itself was deleted"
    print("PASS (refused; tmp/ root still exists)")


def test_delete_of_a_path_genuinely_inside_tmp_succeeds():
    print("[cleanup-safety 3] a target genuinely INSIDE tmp/ is deleted, returns True ... ", end="")
    victim = _fresh_tmp_subdir("legit_victim")
    marker = os.path.join(victim, "scratch.txt")
    with open(marker, "w", encoding="utf-8") as f:
        f.write("scratch")
    result = pipeline.safe_recursive_delete_under_tmp(victim)
    assert result is True, f"RED: expected True, got {result}"
    assert not os.path.exists(victim), "RED: target still exists after a claimed successful delete"
    print("PASS (deleted, returned True)")


# ---------------------------------------------------------------------------
# _validate_and_scan_sample() -- side-effect-free, no file I/O at all
# ---------------------------------------------------------------------------

def test_malformed_json_body_is_structural_failure():
    print("[sample-safety 1] malformed JSON body -> SAMPLE_STRUCTURAL_FAILURE ... ", end="")
    sample, status, n = pipeline._validate_and_scan_sample(b"{not valid json", FAKE_KEY)
    assert sample is None and status == pipeline.SAMPLE_STRUCTURAL_FAILURE, (sample, status, n)
    print("PASS")


def test_documented_payload_is_valid_with_zero_unknown_fields():
    print("[sample-safety 2] the realistic documented-shape fixture -> SAMPLE_VALID, 0 unknown fields "
          "(R1: documented utc_offset_seconds/timezone/timezone_abbreviation accepted) ... ", end="")
    body = fixture.build_documented_sample_body()
    sample, status, n = pipeline._validate_and_scan_sample(body, FAKE_KEY)
    assert status == pipeline.SAMPLE_VALID, (sample, status, n)
    assert sample is not None and sample["timezone_abbreviation"] == "GMT" and sample["utc_offset_seconds"] == 0
    assert n == 0, f"RED: expected 0 unknown fields for the fully-documented fixture, got {n}"
    print("PASS")


def test_additive_unknown_field_is_dropped_and_counted_not_terminal():
    print("[sample-safety 3] an ADDITIVE unknown top-level field is dropped (never stored) and counted, "
          "SAMPLE_VALID not terminal (R1) ... ", end="")
    body = fixture.build_documented_sample_with_extra_field("some_future_field", "harmless-value")
    sample, status, n = pipeline._validate_and_scan_sample(body, FAKE_KEY)
    assert status == pipeline.SAMPLE_VALID, (sample, status, n)
    assert "some_future_field" not in sample, "RED: the unknown field's NAME was stored"
    assert "harmless-value" not in json.dumps(sample), "RED: the unknown field's VALUE was stored"
    assert n == 1, f"RED: expected exactly 1 unknown field counted, got {n}"
    print(f"PASS (dropped, not stored, counted as {n})")


def test_unknown_field_containing_the_secret_is_still_terminal():
    print("[sample-safety 4] the SAME unknown field, but containing the fake secret, is still terminal "
          "(additive-field tolerance never weakens the secret gate) ... ", end="")
    body = fixture.build_documented_sample_with_extra_field("debug_echo", FAKE_KEY)
    sample, status, n = pipeline._validate_and_scan_sample(body, FAKE_KEY)
    assert sample is None and status == pipeline.SAMPLE_STRUCTURAL_FAILURE, (sample, status, n)
    print("PASS")


def test_top_level_list_is_nonterminal_unsupported():
    print("[sample-safety 5] a top-level JSON list (documented multi-coordinate shape) -> "
          "SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST, non-terminal ... ", end="")
    body = fixture.build_list_response()
    sample, status, n = pipeline._validate_and_scan_sample(body, FAKE_KEY)
    assert sample is None and status == pipeline.SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST, (sample, status, n)
    print("PASS")


def test_empty_object_is_incomplete_not_valid():
    print("[sample-safety 6] `{}` is SAMPLE_INCOMPLETE, never a valid forecast sample (R2) ... ", end="")
    sample, status, n = pipeline._validate_and_scan_sample(b"{}", FAKE_KEY)
    assert sample is None and status == pipeline.SAMPLE_INCOMPLETE, (sample, status, n)
    print("PASS")


def test_missing_each_required_hourly_array_is_incomplete():
    print("[sample-safety 7] a documented payload missing any ONE of the six required hourly arrays "
          "-> SAMPLE_INCOMPLETE ... ")
    import schema
    for missing_var in schema.REQUIRED_HOURLY:
        payload = fixture.build_documented_sample_payload()
        del payload["hourly"][missing_var]
        del payload["hourly_units"][missing_var]
        body = json.dumps(payload).encode()
        sample, status, n = pipeline._validate_and_scan_sample(body, FAKE_KEY)
        assert sample is None and status == pipeline.SAMPLE_INCOMPLETE, (missing_var, sample, status, n)
    print(f"    PASS (all {len(schema.REQUIRED_HOURLY)} required-variable omissions correctly INCOMPLETE)")


def test_missing_required_hourly_unit_is_incomplete():
    print("[sample-safety 8] a documented payload missing a required hourly_units entry -> "
          "SAMPLE_INCOMPLETE (not a structural failure) ... ", end="")
    payload = fixture.build_documented_sample_payload()
    del payload["hourly_units"]["temperature_2m"]
    sample, status, n = pipeline._validate_and_scan_sample(json.dumps(payload).encode(), FAKE_KEY)
    assert sample is None and status == pipeline.SAMPLE_INCOMPLETE, (sample, status, n)
    print("PASS")


def test_invalid_stored_field_type_is_structural_failure_not_incomplete():
    print("[sample-safety 9] an INVALID type for a stored, recognised field (not merely missing) -> "
          "SAMPLE_STRUCTURAL_FAILURE, never incompleteness ... ", end="")
    payload = fixture.build_documented_sample_payload()
    payload["utc_offset_seconds"] = "not-an-integer"
    sample, status, n = pipeline._validate_and_scan_sample(json.dumps(payload).encode(), FAKE_KEY)
    assert sample is None and status == pipeline.SAMPLE_STRUCTURAL_FAILURE, (sample, status, n)
    print("PASS")


def test_non_increasing_time_is_structural_failure():
    print("[sample-safety 10] hourly.time entries that are not strictly increasing/unique -> "
          "SAMPLE_STRUCTURAL_FAILURE ... ", end="")
    payload = fixture.build_documented_sample_payload()
    payload["hourly"]["time"][1] = payload["hourly"]["time"][0]  # duplicate, not increasing
    sample, status, n = pipeline._validate_and_scan_sample(json.dumps(payload).encode(), FAKE_KEY)
    assert sample is None and status == pipeline.SAMPLE_STRUCTURAL_FAILURE, (sample, status, n)
    print("PASS")


def test_oversized_hourly_array_is_structural_failure():
    print("[sample-safety 11] an hourly array past the bounded length -> SAMPLE_STRUCTURAL_FAILURE ... ", end="")
    too_long = list(range(pipeline._SAMPLE_MAX_ARRAY_LEN + 1))
    body = json.dumps({"hourly": {"temperature_2m": too_long}}).encode()
    sample, status, n = pipeline._validate_and_scan_sample(body, FAKE_KEY)
    assert sample is None and status == pipeline.SAMPLE_STRUCTURAL_FAILURE, (sample, status, n)
    print("PASS")


def test_secret_reflected_in_decoded_value_is_structural_failure():
    print("[sample-safety 12] the secret reflected inside an allowlisted field -> SAMPLE_STRUCTURAL_FAILURE ... ",
          end="")
    body = json.dumps({"hourly_units": {"temperature_2m": FAKE_KEY[:32]}}).encode()
    sample, status, n = pipeline._validate_and_scan_sample(body, FAKE_KEY[:32])
    assert sample is None and status == pipeline.SAMPLE_STRUCTURAL_FAILURE, (sample, status, n)
    print("PASS")


def test_null_data_point_is_preserved_not_rejected():
    print("[sample-safety 13] a null hourly data point (legitimate missing-data marker) is preserved, "
          "still SAMPLE_VALID ... ", end="")
    payload = fixture.build_documented_sample_payload()
    payload["hourly"]["temperature_2m"][5] = None
    sample, status, n = pipeline._validate_and_scan_sample(json.dumps(payload).encode(), FAKE_KEY)
    assert status == pipeline.SAMPLE_VALID, (sample, status, n)
    assert sample["hourly"]["temperature_2m"][5] is None
    print("PASS")


# ---------------------------------------------------------------------------
# _write_unique_sample() -- unique per-attempt filename, never overwritten
# ---------------------------------------------------------------------------

def test_write_unique_sample_uses_attempt_id_in_filename():
    print("[sample-safety 14] _write_unique_sample() writes to a filename unique to the attempt ID, "
          "never a fixed shared name ... ", end="")
    os.makedirs(pipeline.SAMPLES_DIR, exist_ok=True)
    validated = {"latitude": 1.0}
    aid1, aid2 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    p1 = pipeline._write_unique_sample(aid1, validated)
    p2 = pipeline._write_unique_sample(aid2, validated)
    try:
        assert p1 is not None and p2 is not None
        assert p1 != p2, "RED: two different attempt IDs produced the same sample path"
        assert os.path.exists(p1) and os.path.exists(p2), "RED: one of the two distinct samples is missing"
        assert aid1 in os.path.basename(p1) and aid2 in os.path.basename(p2)
        print(f"PASS (two distinct attempt IDs -> two distinct, co-existing sample files)")
    finally:
        for p in (p1, p2):
            if p and os.path.exists(p):
                os.remove(p)


def main():
    test_delete_outside_tmp_is_refused()
    test_delete_of_tmp_root_itself_is_refused()
    test_delete_of_a_path_genuinely_inside_tmp_succeeds()
    test_malformed_json_body_is_structural_failure()
    test_documented_payload_is_valid_with_zero_unknown_fields()
    test_additive_unknown_field_is_dropped_and_counted_not_terminal()
    test_unknown_field_containing_the_secret_is_still_terminal()
    test_top_level_list_is_nonterminal_unsupported()
    test_empty_object_is_incomplete_not_valid()
    test_missing_each_required_hourly_array_is_incomplete()
    test_missing_required_hourly_unit_is_incomplete()
    test_invalid_stored_field_type_is_structural_failure_not_incomplete()
    test_non_increasing_time_is_structural_failure()
    test_oversized_hourly_array_is_structural_failure()
    test_secret_reflected_in_decoded_value_is_structural_failure()
    test_null_data_point_is_preserved_not_rejected()
    test_write_unique_sample_uses_attempt_id_in_filename()
    print("\nALL SAMPLE/CLEANUP SAFETY TESTS PASS (exit 0).")


if __name__ == "__main__":
    main()
