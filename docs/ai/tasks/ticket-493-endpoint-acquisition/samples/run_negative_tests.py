#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- EA6/pairing-rules.md's own negative-test
table. Copies the REAL written endpoint-wgs84.json and raw-E1-WGS84.json
into tempfile.mkdtemp() (outside the repo), mutates exactly one thing
per test, and calls the real, unmodified validate_endpoint_output.run()
against the copy. Each mutation must fail with its own pre-registered
check-ID. Temp dirs are deleted after use. No network.
"""
import json
import shutil
import sys
import tempfile
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent

sys.path.insert(0, str(Path(__file__).resolve().parent))
import validate_endpoint_output as vmod  # noqa: E402

RESULTS = []


def fresh_copy():
    # Plain byte copies (read + write), not shutil.copy2 -- the real
    # raw-E1-WGS84.json is read-only (EA8) and on this filesystem
    # copy2's metadata preservation carries that read-only attribute
    # into the copy too, which then blocks both mutation and later
    # cleanup. A fresh write gets default (writable) permissions.
    d = Path(tempfile.mkdtemp(prefix="endpoint-acquisition-negtest-"))
    (d / "samples").mkdir(parents=True)
    (d / "endpoint-wgs84.json").write_bytes((TASK_DIR / "endpoint-wgs84.json").read_bytes())
    (d / "samples/raw-E1-WGS84.json").write_bytes((TASK_DIR / "samples/raw-E1-WGS84.json").read_bytes())
    (d / "samples/rp1_native_reference.json").write_bytes((TASK_DIR / "samples/rp1_native_reference.json").read_bytes())
    return d


def run_against(d, expect_pass=False):
    try:
        vmod.run(task_dir=d, verbose=False)
        return None
    except AssertionError as e:
        return str(e)


def mutate_endpoint(d, target_idferill, target_tier, **changes):
    path = d / "endpoint-wgs84.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    for e in doc["entries"]:
        if e["idferill"] == target_idferill and e["nakvaemniferlis"] == target_tier and e["latitude"] is not None:
            e.update(changes)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def mutate_raw(d, target_idferill, target_tier, mutate_fn):
    path = d / "samples/raw-E1-WGS84.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    for f in doc["features"]:
        p = f["properties"]
        if p["IDFERILL"] == target_idferill and p["NAKVAEMNIFERLIS"] == target_tier:
            mutate_fn(f)
    path.write_text(json.dumps(doc, ensure_ascii=False) + "\n", encoding="utf-8")


def do(name, expected_check_id, apply_fn):
    d = fresh_copy()
    try:
        apply_fn(d)
        msg = run_against(d)
        ok = msg is not None and expected_check_id in msg
        RESULTS.append({"test": name, "expected_check_id": expected_check_id, "message": msg, "pass": ok})
        assert ok, f"{name} did not surface {expected_check_id}; got: {msg}"
    finally:
        shutil.rmtree(d, ignore_errors=True)


def main():
    clean = fresh_copy()
    try:
        vmod.run(task_dir=clean, verbose=False)
        print("sanity check: unmutated temp copy passes the real validator -- PASS")
    finally:
        shutil.rmtree(clean, ignore_errors=True)

    do("latlon_swap", "LATLON_SWAP_DETECTED", lambda d: mutate_endpoint(d, 2345, -1, latitude=-14.39028964, longitude=65.25861764))
    do("value_altered", "VALUE_MISMATCH", lambda d: mutate_endpoint(d, 2345, -1, latitude=65.0))
    do("role_swapped", "ROLE_FIELD_MISMATCH", lambda d: mutate_endpoint(d, 2345, -1, role="START"))
    do("piece_tier_mismatch", "PIECE_TIER_MISMATCH", lambda d: mutate_endpoint(d, 2345, -1, idferill=9999999))
    do("missing_feature", "MISSING_FEATURE", lambda d: mutate_raw(d, 2345, -1, lambda f: f["properties"].__setitem__("IDFERILL", 123456)))
    do("duplicate_feature", "DUPLICATE_FEATURE", lambda d: mutate_raw(d, 2344, -1, lambda f: f["properties"].__setitem__("IDFERILL", 2345) or f["properties"].__setitem__("NAKVAEMNIFERLIS", -1)))
    do("vertex_count_mismatch", "VERTEX_COUNT_MISMATCH", lambda d: mutate_raw(d, 2345, -1, lambda f: f["geometry"]["coordinates"].append(f["geometry"]["coordinates"][-1])))
    do("provenance_mismatch", "PROVENANCE_REFERENCE_MISMATCH", lambda d: mutate_endpoint(d, 2345, -1, raw_response_sha256="0" * 64))
    do("tier_consistency_mismatch", "TIER_CONSISTENCY_MISMATCH", lambda d: mutate_endpoint(d, 2345, 0, longitude=-14.0))
    do("z_in_published_value", "Z_IN_PUBLISHED_VALUE", lambda d: mutate_endpoint(d, 2345, -1, z=0))
    do("invalid_coordinate_arity", "INVALID_COORDINATE_ARITY", lambda d: mutate_raw(d, 2345, -1, lambda f: f["geometry"]["coordinates"].__setitem__(-1, f["geometry"]["coordinates"][-1][:2])))
    do("objectid_mismatch", "OBJECTID_ID_MISMATCH", lambda d: mutate_endpoint(d, 2345, -1, objectid=99999999))
    do("missing_dagsferils", "MISSING_DAGSFERILS", lambda d: mutate_raw(d, 2345, -1, lambda f: f["properties"].pop("DAGSFERILS", None)))

    all_passed = all(r["pass"] for r in RESULTS)
    report = {"results": RESULTS, "total": len(RESULTS), "all_passed": all_passed}
    with open(TASK_DIR / "samples/negative_test_report.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
        f.write("\n")
    for r in RESULTS:
        print(("PASS" if r["pass"] else "FAIL"), r["test"], "expected=", r["expected_check_id"])
    print("ALL PASSED:", all_passed)
    assert all_passed, [r for r in RESULTS if not r["pass"]]


if __name__ == "__main__":
    main()
