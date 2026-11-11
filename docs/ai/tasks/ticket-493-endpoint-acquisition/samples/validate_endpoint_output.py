#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- EA6 independent offline validator. NO
import of driver.py, build_endpoint_output.py, or request_encoding.py
-- reads the WRITTEN raw response and the WRITTEN endpoint-wgs84.json
directly, and re-derives everything from scratch. Compares every
published (non-null) value against the correct raw feature/endpoint;
coverage (a value existing) is never treated as proof (BB1, not
hardened here). z is never compared or read as meaningful (EA5a).
No network.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent


ROLE_BY_IDFERILL = {2345: "END", 2344: "START", 2894: "END", 2892: "START"}
EXPECTED_PIECES = {"Egilsstaðir (E1)": {2345, 2344}, "Seyðisfjörður (S2)": {2894, 2892}}
VALID_TIERS = {-1, 0, 1, 2}


def load_raw_by_key(raw_path):
    data = raw_path.read_bytes()
    doc = json.loads(data)
    by_key = {}
    duplicates = []
    for f in doc.get("features", []):
        p = f.get("properties", {})
        key = (p.get("IDFERILL"), p.get("NAKVAEMNIFERLIS"))
        if key in by_key:
            duplicates.append(key)
        by_key[key] = f
    return by_key, hashlib.sha256(data).hexdigest(), duplicates


def load_native_ref():
    ref = json.loads((TASK_DIR / "samples/rp1_native_reference.json").read_bytes())
    out = {}
    for group in ("e1_features", "s2_features"):
        for r in ref[group]:
            out[(r["idferill"], r["nakvaemniferlis"])] = r["vertex_count"]
    return out


def expected_point(raw_by_key, idferill, tier, role):
    feat = raw_by_key.get((idferill, tier))
    if feat is None:
        return None
    coords = feat["geometry"]["coordinates"]
    point = coords[-1] if role == "END" else coords[0]
    if len(point) != 3:
        return {"check_id": "INVALID_COORDINATE_ARITY"}
    return {"longitude": point[0], "latitude": point[1], "objectid": feat["properties"].get("OBJECTID"), "id": feat.get("id"), "dagsferils": feat["properties"].get("DAGSFERILS")}


def check_entry(entry, raw_by_key, raw_sha, native_vertex_counts):
    """Returns a list of violated check-IDs; [] = consistent."""
    failures = []
    if entry["latitude"] is None and entry["longitude"] is None:
        return failures  # a null entry with a stated reason is not itself a failure

    if "z" in entry or "elevation" in entry:
        failures.append("Z_IN_PUBLISHED_VALUE")

    if entry["idferill"] not in EXPECTED_PIECES.get(entry["place"], set()) or entry["nakvaemniferlis"] not in VALID_TIERS:
        failures.append("PIECE_TIER_MISMATCH")
        return failures

    expected_role = ROLE_BY_IDFERILL.get(entry["idferill"])
    if entry["role"] != expected_role:
        failures.append("ROLE_FIELD_MISMATCH")

    exp = expected_point(raw_by_key, entry["idferill"], entry["nakvaemniferlis"], expected_role)
    if exp is None:
        failures.append("MISSING_FEATURE")
        return failures
    if exp.get("check_id") == "INVALID_COORDINATE_ARITY":
        failures.append("INVALID_COORDINATE_ARITY")
        return failures

    feat = raw_by_key[(entry["idferill"], entry["nakvaemniferlis"])]
    raw_vertex_count = len(feat["geometry"]["coordinates"])
    native_count = native_vertex_counts.get((entry["idferill"], entry["nakvaemniferlis"]))
    if native_count is not None and raw_vertex_count != native_count:
        failures.append("VERTEX_COUNT_MISMATCH")

    if "ROLE_FIELD_MISMATCH" not in failures:
        if entry["latitude"] == exp["longitude"] and entry["longitude"] == exp["latitude"] and (entry["latitude"], entry["longitude"]) != (exp["latitude"], exp["longitude"]):
            failures.append("LATLON_SWAP_DETECTED")
        elif entry["latitude"] != exp["latitude"] or entry["longitude"] != exp["longitude"]:
            failures.append("VALUE_MISMATCH")

    expected_id_suffix = f"faerdferlar2017_1.{exp['objectid']}"
    if entry["objectid"] != exp["objectid"] or entry.get("id") != expected_id_suffix:
        failures.append("OBJECTID_ID_MISMATCH")
    if entry.get("raw_response_sha256") != raw_sha:
        failures.append("PROVENANCE_REFERENCE_MISMATCH")
    if exp.get("dagsferils") is None:
        failures.append("MISSING_DAGSFERILS")
    elif entry.get("dagsferils") != exp.get("dagsferils"):
        failures.append("PROVENANCE_REFERENCE_MISMATCH")
    return failures


def check_tier_consistency(entries_for_role):
    present = [e for e in entries_for_role if e["latitude"] is not None]
    if not present:
        return []
    distinct = {(e["latitude"], e["longitude"]) for e in present}
    claimed_flag = present[0]["tier_consistency_flag"]
    actual_consistent = len(distinct) == 1
    if claimed_flag != actual_consistent:
        return ["TIER_CONSISTENCY_MISMATCH"]
    if not actual_consistent:
        return ["TIER_CONSISTENCY_MISMATCH"]
    return []


def run(task_dir=None, verbose=True):
    task_dir = Path(task_dir) if task_dir else TASK_DIR
    endpoint_doc = json.loads((task_dir / "endpoint-wgs84.json").read_bytes())
    entries = endpoint_doc["entries"]
    native_vertex_counts = load_native_ref()

    raw_cache = {}
    failures_all = []

    by_role_piece = {}
    for e in entries:
        by_role_piece.setdefault((e["role"], e["idferill"]), []).append(e)

    for e in entries:
        if e["latitude"] is None:
            continue
        raw_label = "E1-WGS84" if e["place"].startswith("Egilsst") else "S2-WGS84"
        if raw_label not in raw_cache:
            raw_path = task_dir / f"samples/raw-{raw_label}.json"
            if not raw_path.exists():
                failures_all.append((e["role"], e["idferill"], e["nakvaemniferlis"], ["RAW_FILE_MISSING"]))
                continue
            raw_by_key, raw_sha, raw_dupes = load_raw_by_key(raw_path)
            raw_cache[raw_label] = (raw_by_key, raw_sha, raw_dupes)
            if raw_dupes:
                failures_all.append((raw_label, "RAW_FILE", "ALL", ["DUPLICATE_FEATURE"]))
        raw_by_key, raw_sha, _ = raw_cache[raw_label]
        fails = check_entry(e, raw_by_key, raw_sha, native_vertex_counts)
        if fails:
            failures_all.append((e["role"], e["idferill"], e["nakvaemniferlis"], fails))

    for (role, idferill), group in by_role_piece.items():
        fails = check_tier_consistency(group)
        if fails:
            failures_all.append((role, idferill, "ALL_TIERS", fails))

    if verbose:
        checked = sum(1 for e in entries if e["latitude"] is not None)
        print(f"checked {checked} non-null entries + {len(by_role_piece)} tier-consistency groups")
    if failures_all:
        raise AssertionError(f"VALIDATION FAILED: {failures_all}")
    if verbose:
        print("ALL CHECKS PASSED: every published value matches its correct raw feature/endpoint; tier consistency confirmed.")
    return {"all_passed": True, "entries_checked": sum(1 for e in entries if e["latitude"] is not None)}


if __name__ == "__main__":
    run()
