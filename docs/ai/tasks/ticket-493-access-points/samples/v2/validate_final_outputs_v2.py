#!/usr/bin/env python3
"""
#493 access-points v2 -- INDEPENDENT final-output validator (J2).
Deliberately has NO import of build_access_points_v2.py: it re-reads
the WRITTEN final files (place-access-status-v2.csv, endpoint-
candidates-v2.json, samples/v2/place-node-references.json) and
re-derives its own expectation from raw chain-walks-v4.json via its
own suffix-sum implementation. Also runs the two v1-verbatim negative
tests required by J2, reading the actual v1 files by their own
recorded SHA-256. Offline only -- no network.
"""
import csv
import hashlib
import json
import re
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
NETWORK_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network"


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


def expected_role_coord_cum(cw, stored, idferill, role):
    node = suffix_sum_node(cw, idferill)
    assert node is not None, f"{idferill} not in cw_long"
    se = stored[idferill]
    if node["direction"] == "rev":
        role_coord = {"ENTRY": se["end"], "EXIT": se["start"]}
    else:
        role_coord = {"ENTRY": se["start"], "EXIT": se["end"]}
    role_cum = {
        "ENTRY": (node["entry_cum_km_incl_1436"], node["entry_cum_km_excl_1436"]),
        "EXIT": (node["exit_cum_km_incl_1436"], node["exit_cum_km_excl_1436"]),
    }
    return role_coord[role], role_cum[role]


def check_record(cw, stored, idferill, role, coord, cum_incl, cum_excl, label):
    exp_coord, (exp_incl, exp_excl) = expected_role_coord_cum(cw, stored, idferill, role)
    ok_coord = close(coord, exp_coord)
    ok_incl = abs(cum_incl - exp_incl) <= 0.0001
    ok_excl = abs(cum_excl - exp_excl) <= 0.0001
    return {"label": label, "idferill": idferill, "role": role, "coord_ok": ok_coord, "incl_ok": ok_incl, "excl_ok": ok_excl, "all_ok": ok_coord and ok_incl and ok_excl, "got": {"coord": coord, "incl": cum_incl, "excl": cum_excl}, "expected": {"coord": exp_coord, "incl": exp_incl, "excl": exp_excl}}


def load_stored_endpoints():
    out = {}
    with open(NETWORK_DIR / "samples/road-links.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out[int(row["idferill"])] = {"start": [float(row["start_x"]), float(row["start_y"])], "end": [float(row["end_x"]), float(row["end_y"])]}
    return out


if __name__ == "__main__":
    forbidden = {"socket", "http", "urllib", "requests", "ssl"}
    src = Path(__file__).read_text(encoding="utf-8")
    used = {m for m in forbidden if re.search(rf"^\s*(import {m}\b|from {m}\b)", src, re.MULTILINE)}
    assert not used, f"forbidden import(s): {used}"
    assert not re.search(r"^\s*(import|from)\s+build_access_points_v2\b", src, re.MULTILINE), "final validator must not import the build script"
    print("static import check: PASS (no network import, no build-script import)")

    cw = json.loads((NETWORK_DIR / "samples/chain-walks-v4.json").read_bytes())["cw_long"]
    stored = load_stored_endpoints()

    results = []

    # 1. Main CSV table -- every row with a node_role+coord+cum must be self-consistent
    with open(TASK_DIR / "place-access-status-v2.csv", encoding="utf-8") as f:
        csv_rows = list(csv.DictReader(f))
    assert len(csv_rows) == 72
    checked = 0
    for r in csv_rows:
        if r["node_role"] and r["native_x"] and r["cum_km_incl_1436"] and r["native_source_piece"]:
            idf = int(r["native_source_piece"])
            if idf not in stored:
                continue
            node = suffix_sum_node(cw, idf)
            if node is None:
                continue  # e.g. Borgarnes, cum intentionally not validated
            coord = [float(r["native_x"]), float(r["native_y"])]
            res = check_record(cw, stored, idf, r["node_role"], coord, float(r["cum_km_incl_1436"]), float(r["cum_km_excl_1436"]), f"main_csv:{r['name']}")
            results.append(res)
            checked += 1
            assert res["all_ok"], f"FINAL OUTPUT VALIDATION FAILED for {r['name']}: {res}"
    print(f"main CSV: {checked} role-bearing rows independently re-validated, all consistent")

    # 2. place-node-references.json -- the dual Selfoss/Hella/Hvolsvollur records
    refs = json.loads((TASK_DIR / "samples/v2/place-node-references.json").read_bytes())
    for place, recs in refs.items():
        for rec in recs:
            res = check_record(cw, stored, rec["idferill"], rec["node_role"], rec["coord"], rec["cum_km_incl_1436"], rec["cum_km_excl_1436"], f"reference:{place}:{rec['node_role']}")
            results.append(res)
            assert res["all_ok"], f"FINAL OUTPUT VALIDATION FAILED for reference {place}/{rec['node_role']}: {res}"
    print(f"place-node-references.json: {sum(len(v) for v in refs.values())} records independently re-validated, all consistent")

    # 3. endpoint-candidates-v2.json -- Egilsstaðir node (2345, ENTRY) and Akureyri (3876, EXIT)
    ec = json.loads((TASK_DIR / "endpoint-candidates-v2.json").read_bytes())
    eg_node = next(n for n in ec["egilsstadir_seydisfjordur"]["nodes"] if n["idferill"] == 2345)
    res = check_record(cw, stored, 2345, "ENTRY", eg_node["coord"], eg_node["ring_cum_km_incl_1436"], eg_node["ring_cum_km_excl_1436"], "endpoint_candidates:egilsstadir_2345")
    results.append(res)
    assert res["all_ok"], res

    ak = ec["akureyri"]
    # cum for Akureyri isn't stored in this block (only coord); verify coord role only
    exp_coord, _ = expected_role_coord_cum(cw, stored, 3876, "EXIT")
    assert close(ak["coord"], exp_coord), f"Akureyri coord mismatch: {ak['coord']} != {exp_coord}"
    print("endpoint-candidates-v2.json: Egilsstaðir (2345) and Akureyri (3876) nodes independently re-validated")

    # 4. H2 Reykjavik leg re-derivation, fully independent (own suffix sum on piece 1436)
    rj = ec["reykjavik"]
    node1436 = suffix_sum_node(cw, 1436)
    short = rj["short_western_leg_ENTRY_stored_END"]
    long_ = rj["long_eastern_leg_EXIT_stored_START"]
    assert close(short["coord"], node1436["entry_coord"])
    assert abs(short["cum_offset_km_incl_1436"] - node1436["entry_cum_km_incl_1436"]) <= 0.0001
    assert abs(short["cum_offset_km_excl_1436"] - node1436["entry_cum_km_excl_1436"]) <= 0.0001
    assert close(long_["coord"], node1436["exit_coord"])
    assert abs(long_["cum_offset_km_incl_1436"] - node1436["exit_cum_km_incl_1436"]) <= 0.0001
    assert abs(long_["cum_offset_km_excl_1436"] - node1436["exit_cum_km_excl_1436"]) <= 0.0001
    print("Reykjavik legs independently re-derived from piece 1436's own suffix sum: PASS")

    # 5. J2 negative tests -- v1 data read VERBATIM from the actual v1 files, by their own sha
    baseline = json.loads((TASK_DIR / "samples/v2/v1_and_input_baseline.json").read_bytes())

    def baseline_sha(suffix):
        return next(r["sha256"] for r in baseline if r["path"].endswith(suffix))

    v1_csv_path = TASK_DIR / "place-access-status.csv"
    v1_csv_sha = baseline_sha("ticket-493-access-points/place-access-status.csv")
    assert hashlib.sha256(v1_csv_path.read_bytes()).hexdigest() == v1_csv_sha
    with open(v1_csv_path, encoding="utf-8") as f:
        v1_rows = {row["name"]: row for row in csv.DictReader(f)}
    v1_selfoss = v1_rows["Selfoss"]
    v1_coord = [float(v1_selfoss["native_x"]), float(v1_selfoss["native_y"])]
    v1_cum_incl = float(v1_selfoss["cum_km_incl_1436"])
    v1_cum_excl = float(v1_selfoss["cum_km_excl_1436"])
    # v1's own Selfoss row claims ENTRY-role coordinate paired with EXIT-role cum (the H1 bug) -- test it AS node_role=ENTRY (what the coord actually is) and expect the cum to NOT match ENTRY's own expectation.
    res_entry = check_record(cw, stored, 2138, "ENTRY", v1_coord, v1_cum_incl, v1_cum_excl, "NEGATIVE:v1_selfoss_as_entry")
    assert not res_entry["all_ok"], f"v1's own wrong Selfoss row should FAIL as a consistent ENTRY record, but passed: {res_entry}"
    print("J2 negative test 1 PASS: v1's own verbatim Selfoss row (sha-verified) correctly fails self-consistency as ENTRY -- it mixes ENTRY coord with EXIT cum.")

    v1_ec_path = TASK_DIR / "endpoint-candidates.json"
    v1_ec_sha = baseline_sha("ticket-493-access-points/endpoint-candidates.json")
    assert hashlib.sha256(v1_ec_path.read_bytes()).hexdigest() == v1_ec_sha
    v1_ec = json.loads(v1_ec_path.read_bytes())
    v1_short = v1_ec["reykjavik"]["short_western_leg"]
    v1_long = v1_ec["reykjavik"]["long_eastern_leg"]
    short_wrong = abs(v1_short["cum_offset_km_incl_1436"] - node1436["entry_cum_km_incl_1436"]) > 0.0001 or abs(v1_short["cum_offset_km_excl_1436"] - node1436["entry_cum_km_excl_1436"]) > 0.0001
    long_wrong = abs(v1_long["cum_offset_km_incl_1436"] - node1436["exit_cum_km_incl_1436"]) > 0.0001 or abs(v1_long["cum_offset_km_excl_1436"] - node1436["exit_cum_km_excl_1436"]) > 0.0001
    assert short_wrong and long_wrong, "v1's own Reykjavik offsets should both mismatch the independently re-derived step-0 figures, but at least one matched"
    print("J2 negative test 2 PASS: v1's own verbatim swapped Reykjavik offsets (sha-verified) both correctly mismatch the independent step-0 re-derivation.")

    print(f"\nALL FINAL-OUTPUT VALIDATION CHECKS PASSED ({len(results)} records cross-checked, 2 verbatim v1 negative tests confirmed failing as expected).")
