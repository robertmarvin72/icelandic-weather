#!/usr/bin/env python3
"""
#493 access-points v3 -- INDEPENDENT final-output validator (F3/D4).
Deliberately has NO import of build_access_points_v3.py: re-derives
its own expectation from raw chain-walks-v4.json/road-links.csv via
its own suffix-sum implementation, and resolves/verifies coordinate
provenance against input_hashes_v3.json. Every check function returns
a LIST of violated check-IDs (empty = consistent) rather than raising
on first failure, so the mutation-test harness (samples/v3/
mutation_tests_v3.py) can assert the EXACT expected check-ID fired.
The top-level run() function takes task_dir/network_dir as PARAMETERS
(F3a) so it can run unmodified against temporary copies of the written
files. Offline only -- no network, no import of the build script.
"""
import csv
import hashlib
import json
import re
from pathlib import Path

DEFAULT_TASK_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_REPO_ROOT = DEFAULT_TASK_DIR.parent.parent.parent.parent
DEFAULT_NETWORK_DIR = DEFAULT_REPO_ROOT / "docs/ai/tasks/ticket-493-place-network"

VALID_CRS = {"EPSG:3057", "EPSG:4326"}


def suffix_sum_node(cw, idferill):
    steps = cw["steps"]
    S = cw["total_cost_m_incl_1436"]
    p1436 = cw["piece_1436_length_m"]

    def suffix(i):
        return sum(s["gap_into_m"] + s["piece_cost_m"] for s in steps[i:])

    for i, s in enumerate(steps):
        if s["idferill"] == idferill:
            entry_incl = S - suffix(i) + s["gap_into_m"]
            exit_incl = S - suffix(i + 1)
            return {
                "direction": s["direction"], "entry_coord": s["entry"], "exit_coord": s["exit"],
                "entry_cum_km_incl_1436": entry_incl / 1000, "entry_cum_km_excl_1436": (entry_incl - p1436) / 1000,
                "exit_cum_km_incl_1436": exit_incl / 1000, "exit_cum_km_excl_1436": (exit_incl - p1436) / 1000,
            }
    return None


def close(a, b, tol_m=0.1):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 <= tol_m


def expected_role_coord_stored_field_cum(cw, stored, idferill, role):
    node = suffix_sum_node(cw, idferill)
    assert node is not None, f"{idferill} not in cw_long"
    se = stored[idferill]
    if node["direction"] == "rev":
        role_coord = {"ENTRY": se["end"], "EXIT": se["start"]}
        role_stored_field = {"ENTRY": "END", "EXIT": "START"}
    else:
        role_coord = {"ENTRY": se["start"], "EXIT": se["end"]}
        role_stored_field = {"ENTRY": "START", "EXIT": "END"}
    role_cum = {"ENTRY": (node["entry_cum_km_incl_1436"], node["entry_cum_km_excl_1436"]), "EXIT": (node["exit_cum_km_incl_1436"], node["exit_cum_km_excl_1436"])}
    return role_coord[role], role_stored_field[role], role_cum[role]


def check_role_coord_cum_field(cw, stored, idferill, role, stored_field, coord, cum_incl, cum_excl):
    """Returns a list of violated check-IDs: ROLE_COORD_MISMATCH,
    STORED_FIELD_MISMATCH, ROLE_CUM_MISMATCH. Empty list = consistent."""
    failures = []
    exp_coord, exp_stored_field, (exp_incl, exp_excl) = expected_role_coord_stored_field_cum(cw, stored, idferill, role)
    if not close(coord, exp_coord):
        failures.append("ROLE_COORD_MISMATCH")
    if stored_field != exp_stored_field:
        failures.append("STORED_FIELD_MISMATCH")
    if abs(cum_incl - exp_incl) > 0.0001 or abs(cum_excl - exp_excl) > 0.0001:
        failures.append("ROLE_CUM_MISMATCH")
    return failures


def resolve_hash_key(input_hashes_by_label, label):
    return input_hashes_by_label.get(label)


def check_provenance(repo_root, input_hashes_by_label, source_path, source_hash_key, crs, coord_is_present):
    """Returns a list of violated check-IDs: PROVENANCE_HASH_KEY_INVALID,
    PROVENANCE_PATH_MISMATCH, PROVENANCE_CRS_INVALID, PROVENANCE_MISSING."""
    failures = []
    if not coord_is_present:
        return failures  # null coordinate -> no provenance expected, nothing to check
    if source_hash_key is None or source_path is None or crs is None:
        failures.append("PROVENANCE_MISSING")
        return failures
    entry = resolve_hash_key(input_hashes_by_label, source_hash_key)
    if entry is None:
        failures.append("PROVENANCE_HASH_KEY_INVALID")
        return failures
    if entry["path"] != source_path:
        failures.append("PROVENANCE_PATH_MISMATCH")
    live_path = repo_root / source_path
    if live_path.exists():
        live_sha = hashlib.sha256(live_path.read_bytes()).hexdigest()
        if live_sha != entry["sha256"]:
            failures.append("PROVENANCE_HASH_KEY_INVALID")
    if crs not in VALID_CRS:
        failures.append("PROVENANCE_CRS_INVALID")
    return failures


def check_akureyri_wgs84(decision_text, lat_deg_n, lon_deg_w):
    m = re.search(r"(\d+\.\d+)\s*°\s*N,\s*(\d+\.\d+)\s*°\s*V", decision_text)
    assert m, "could not parse Akureyri WGS84 from decision text"
    parsed_lat, parsed_lon = float(m.group(1)), float(m.group(2))
    failures = []
    if abs(parsed_lat - lat_deg_n) > 1e-9 or abs(parsed_lon - lon_deg_w) > 1e-9:
        failures.append("AKUREYRI_WGS84_MISMATCH")
    return failures


def load_stored_endpoints(network_dir):
    out = {}
    with open(network_dir / "samples/road-links.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out[int(row["idferill"])] = {"start": [float(row["start_x"]), float(row["start_y"])], "end": [float(row["end_x"]), float(row["end_y"])]}
    return out


def classify_row(row):
    """Independently re-derives final_validation_outcome from a CSV
    row's own other fields (F1) -- never trusts the written column."""
    if row["reference_status"] == "CANDIDATE_NOT_PROMOTED" and row["record_source"] == "PHASE1_AND_PHASE2_PAIR":
        return "PAIR_REFERENCE"
    if row["name"] == "Borgarnes":
        return "NOT_VALIDATED_OUTSIDE_CW_LONG"
    if row["node_role"]:
        return "VALIDATED"
    return "NO_NODE"


def run(task_dir=None, network_dir=None, repo_root=None, verbose=True):
    task_dir = Path(task_dir) if task_dir else DEFAULT_TASK_DIR
    network_dir = Path(network_dir) if network_dir else DEFAULT_NETWORK_DIR
    repo_root = Path(repo_root) if repo_root else DEFAULT_REPO_ROOT

    src = Path(__file__).read_text(encoding="utf-8")
    forbidden = {"socket", "http", "urllib", "requests", "ssl"}
    used = {m for m in forbidden if re.search(rf"^\s*(import {m}\b|from {m}\b)", src, re.MULTILINE)}
    assert not used, f"forbidden import(s): {used}"
    assert not re.search(r"^\s*(import|from)\s+build_access_points_v3\b", src, re.MULTILINE), "final validator must not import the build script"
    if verbose:
        print("static import check: PASS (no network import, no build-script import)")

    cw = json.loads((network_dir / "samples/chain-walks-v4.json").read_bytes())["cw_long"]
    stored = load_stored_endpoints(network_dir)
    input_hashes = json.loads((task_dir / "samples/v3/input_hashes_v3.json").read_bytes())
    input_hashes_by_label = {h["label"]: h for h in input_hashes}

    row_failures = {}
    classification_mismatches = []
    classification_counts = {"VALIDATED": 0, "NOT_VALIDATED_OUTSIDE_CW_LONG": 0, "NO_NODE": 0, "PAIR_REFERENCE": 0}

    with open(task_dir / "place-access-status-v3.csv", encoding="utf-8") as f:
        csv_rows = list(csv.DictReader(f))
    assert len(csv_rows) == 72, f"expected 72 rows, got {len(csv_rows)}"

    for r in csv_rows:
        fails = []
        re_derived = classify_row(r)
        classification_counts[re_derived] += 1
        if re_derived != r["final_validation_outcome"]:
            classification_mismatches.append({"name": r["name"], "written": r["final_validation_outcome"], "re_derived": re_derived})
            fails.append("CLASSIFICATION_MISMATCH")
        if r["node_role"] and r["native_x"] and r["cum_km_incl_1436"] and r["piece_id"]:
            idf = int(r["piece_id"])
            if idf in stored and suffix_sum_node(cw, idf) is not None:
                coord = [float(r["native_x"]), float(r["native_y"])]
                fails += check_role_coord_cum_field(cw, stored, idf, r["node_role"], r["stored_field"], coord, float(r["cum_km_incl_1436"]), float(r["cum_km_excl_1436"]))
                fails += check_provenance(repo_root, input_hashes_by_label, r["source_path"] or None, r["source_hash_key"] or None, r["crs"] or None, True)
        row_failures[r["name"]] = fails
        assert not fails, f"FINAL OUTPUT VALIDATION FAILED for {r['name']}: {fails}"
    assert sum(classification_counts.values()) == 72 and not classification_mismatches, (classification_counts, classification_mismatches)
    if verbose:
        print(f"main CSV: 72 rows independently re-classified (sum=72, {classification_counts}) and role-bearing rows re-validated incl. stored_field+provenance, all consistent")

    refs = json.loads((task_dir / "samples/v3/place-node-references-v3.json").read_bytes())
    ref_count = 0
    for place, recs in refs.items():
        for rec in recs:
            fails = check_role_coord_cum_field(cw, stored, rec["idferill"], rec["node_role"], rec["stored_field"], rec["coord"], rec["cum_km_incl_1436"], rec["cum_km_excl_1436"])
            fails += check_provenance(repo_root, input_hashes_by_label, rec.get("source_path"), rec.get("source_hash_key"), rec.get("crs"), True)
            assert not fails, f"FINAL OUTPUT VALIDATION FAILED for reference {place}/{rec['node_role']}: {fails}"
            ref_count += 1
    if verbose:
        print(f"place-node-references-v3.json: {ref_count} records independently re-validated (incl. stored_field+provenance), all consistent")

    ec = json.loads((task_dir / "endpoint-candidates-v3.json").read_bytes())
    eg_node = next(n for n in ec["egilsstadir_seydisfjordur"]["nodes"] if n["idferill"] == 2345)
    fails = check_role_coord_cum_field(cw, stored, 2345, "ENTRY", "END", eg_node["coord"], eg_node["ring_cum_km_incl_1436"], eg_node["ring_cum_km_excl_1436"])
    fails += check_provenance(repo_root, input_hashes_by_label, eg_node.get("source_path"), eg_node.get("source_hash_key"), eg_node.get("crs"), True)
    assert not fails, f"egilsstadir_2345_node: {fails}"

    ak = ec["akureyri"]
    exp_coord, exp_sf, _ = expected_role_coord_stored_field_cum(cw, stored, 3876, "EXIT")
    assert close(ak["coord"], exp_coord), f"Akureyri coord mismatch: {ak['coord']} != {exp_coord}"
    ak_fails = check_provenance(repo_root, input_hashes_by_label, ak.get("source_path"), ak.get("source_hash_key"), ak.get("crs"), True)
    assert not ak_fails, f"akureyri_coord_provenance: {ak_fails}"
    decision_text = (repo_root / "docs/ai/tasks/ticket-493/akureyri-endpoint-decision.md").read_text(encoding="utf-8")
    wgs_fails = check_akureyri_wgs84(decision_text, ak["wgs84"]["lat_deg_n"], ak["wgs84"]["lon_deg_w"])
    wgs_fails += check_provenance(repo_root, input_hashes_by_label, ak["wgs84"].get("source_path"), ak["wgs84"].get("source_hash_key"), ak["wgs84"].get("crs"), True)
    assert not wgs_fails, f"akureyri_wgs84: {wgs_fails}"
    if verbose:
        print("endpoint-candidates-v3.json: Egilsstaðir (2345), Akureyri (3876) coord+WGS84+provenance independently re-validated")

    rj = ec["reykjavik"]
    node1436 = suffix_sum_node(cw, 1436)
    for leg_key, role in (("short_western_leg_ENTRY_stored_END", "ENTRY"), ("long_eastern_leg_EXIT_stored_START", "EXIT"), ("raudavatn_candidate_ENTRY_stored_END", "ENTRY"), ("raudavatn_candidate_EXIT_stored_START", "EXIT")):
        leg = rj[leg_key]
        fails = check_role_coord_cum_field(cw, stored, 1436, role, leg["stored_field"], leg["coord"], leg["cum_offset_km_incl_1436"], leg["cum_offset_km_excl_1436"])
        fails += check_provenance(repo_root, input_hashes_by_label, leg.get("source_path"), leg.get("source_hash_key"), leg.get("crs"), True)
        assert not fails, f"{leg_key}: {fails}"
    assert "raudavatn_comparison_anchor" not in rj, "v2's own single-ended field must be superseded, not reused (D6/F6c)"
    if verbose:
        print("Reykjavik legs AND both Rauðavatn candidates (D6) independently re-derived from piece 1436's own suffix sum: PASS")

    # J2/F3 negative tests -- v1 data read VERBATIM from the actual v1 files, by their own sha
    baseline = json.loads((task_dir / "samples/v3/v1_v2_and_input_baseline.json").read_bytes())

    def baseline_sha(suffix):
        return next(r["sha256"] for r in baseline if r["path"].endswith(suffix))

    v1_csv_path = task_dir / "place-access-status.csv"
    assert hashlib.sha256(v1_csv_path.read_bytes()).hexdigest() == baseline_sha("ticket-493-access-points/place-access-status.csv")
    with open(v1_csv_path, encoding="utf-8") as f:
        v1_rows = {row["name"]: row for row in csv.DictReader(f)}
    v1_selfoss = v1_rows["Selfoss"]
    v1_coord = [float(v1_selfoss["native_x"]), float(v1_selfoss["native_y"])]
    fails = check_role_coord_cum_field(cw, stored, 2138, "ENTRY", "END", v1_coord, float(v1_selfoss["cum_km_incl_1436"]), float(v1_selfoss["cum_km_excl_1436"]))
    assert "ROLE_CUM_MISMATCH" in fails, f"v1's own wrong Selfoss row should FAIL ROLE_CUM_MISMATCH as a consistent ENTRY record, got {fails}"
    if verbose:
        print(f"negative test 1 PASS: v1's own verbatim Selfoss row (sha-verified) fails as ENTRY with {fails} -- it mixes ENTRY coord with EXIT cum.")

    v1_ec_path = task_dir / "endpoint-candidates.json"
    assert hashlib.sha256(v1_ec_path.read_bytes()).hexdigest() == baseline_sha("ticket-493-access-points/endpoint-candidates.json")
    v1_ec = json.loads(v1_ec_path.read_bytes())
    v1_short, v1_long = v1_ec["reykjavik"]["short_western_leg"], v1_ec["reykjavik"]["long_eastern_leg"]
    short_wrong = abs(v1_short["cum_offset_km_incl_1436"] - node1436["entry_cum_km_incl_1436"]) > 0.0001 or abs(v1_short["cum_offset_km_excl_1436"] - node1436["entry_cum_km_excl_1436"]) > 0.0001
    long_wrong = abs(v1_long["cum_offset_km_incl_1436"] - node1436["exit_cum_km_incl_1436"]) > 0.0001 or abs(v1_long["cum_offset_km_excl_1436"] - node1436["exit_cum_km_excl_1436"]) > 0.0001
    assert short_wrong and long_wrong, "v1's own Reykjavik offsets should both mismatch the independently re-derived step-0 figures"
    if verbose:
        print("negative test 2 PASS: v1's own verbatim swapped Reykjavik offsets (sha-verified) both correctly mismatch the independent step-0 re-derivation.")

    result = {"rows_checked": 72, "classification_counts": classification_counts, "reference_records_checked": ref_count, "row_failures": row_failures}
    if verbose:
        print(f"\nALL FINAL-OUTPUT VALIDATION CHECKS PASSED (72 rows + {ref_count} reference records + Reykjavik/Rauðavatn/Egilsstaðir/Akureyri nodes cross-checked, 2 verbatim v1 negative tests confirmed failing as expected).")
    return result


if __name__ == "__main__":
    run()
