#!/usr/bin/env python3
"""
#493 access-points v4 -- mutation-test harness (AA1/AA3/AA4/AA5).
Part A reruns all 41 v3 mutation tests against the real v4 validator
(AA5a), reported separately from Part B's new I1-I4 tests: 126
blank-field tests (AA1a), 2 Borgarnes tests (AA1b), 2 NO_NODE/PAIR
tests (AA1c), 3 AA2 derived-column tests, 3 AA3 G4/tolerance boundary
tests, and the AA4 provenance/missing-file tests. Every test copies
the real v3 outputs into tempfile.mkdtemp() (outside the repo, deleted
after use) and calls the real validate_final_outputs_v4.run() -- same
code path as production. Offline only -- no network.
"""
import csv
import json
import shutil
import sys
import tempfile
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
NETWORK_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network"

PHASE2_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2"
TICKET493_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import validate_final_outputs_v4 as vfo  # noqa: E402

BASE_FILES = [
    "place-access-status-v3.csv", "endpoint-candidates-v3.json",
    "place-access-status.csv", "endpoint-candidates.json",
    "samples/v3/place-node-references-v3.json", "samples/v3/input_hashes_v3.json",
    "samples/v3/v1_v2_and_input_baseline.json", "samples/v4/direction_status_frozen_map.json",
]

EXPECTED_CHECKS_V3 = {
    "role_label_only": {"ROLE_COORD_MISMATCH", "ROLE_CUM_MISMATCH"},
    "coord_deviation_0.2m": {"ROLE_COORD_MISMATCH"},
    "stored_field_swap": {"STORED_FIELD_MISMATCH"},
    "cum_incl_excl_swap": {"ROLE_CUM_MISMATCH"},
    "double_counted_1436": {"ROLE_CUM_MISMATCH"},
    "wrong_source_hash_key": {"PROVENANCE_HASH_KEY_INVALID"},
    "wrong_source_path": {"PROVENANCE_PATH_MISMATCH"},
    "wrong_crs": {"PROVENANCE_CRS_INVALID"},
    "provenance_missing_on_real_coord": {"PROVENANCE_MISSING"},
    "akureyri_wgs84_digit_altered": {"AKUREYRI_WGS84_MISMATCH"},
}


def fresh_copy():
    d = Path(tempfile.mkdtemp(prefix="access-points-v4-mutest-"))
    (d / "samples/v3").mkdir(parents=True)
    (d / "samples/v4").mkdir(parents=True)
    for rel in BASE_FILES:
        shutil.copy2(TASK_DIR / rel, d / rel)
    return d


def run_against(d, expect_pass=False):
    try:
        vfo.run(task_dir=d, network_dir=NETWORK_DIR, repo_root=REPO_ROOT, verbose=False)
        if expect_pass:
            return None
        raise AssertionError("expected validator to reject, but it passed")
    except AssertionError as e:
        if expect_pass:
            raise
        return str(e)


def mutate_csv_row(d, name, **changes):
    path = d / "place-access-status-v3.csv"
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys())
    for r in rows:
        if r["name"] == name:
            for k, v in changes.items():
                r[k] = "" if v is None else v
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(fieldnames)
        for r in rows:
            w.writerow([r[fn] for fn in fieldnames])


def mutate_reference_record(d, place, target_role, **changes):
    path = d / "samples/v3/place-node-references-v3.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    for rec in doc[place]:
        if rec["node_role"] == target_role:
            rec.update(changes)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def mutate_endpoint_node_2345(d, **changes):
    path = d / "endpoint-candidates-v3.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    node = next(n for n in doc["egilsstadir_seydisfjordur"]["nodes"] if n["idferill"] == 2345)
    node.update(changes)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def mutate_g4_node(d, idferill, role, **changes):
    path = d / "endpoint-candidates-v3.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    node = next(n for n in doc["egilsstadir_seydisfjordur"]["nodes"] if n["idferill"] == idferill and n["role"] == role)
    node.update(changes)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def mutate_akureyri_wgs84_digit(d):
    path = d / "endpoint-candidates-v3.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    doc["akureyri"]["wgs84"]["lat_deg_n"] = round(doc["akureyri"]["wgs84"]["lat_deg_n"] + 1.0, 8)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def run_one(report, kind, target, expected_ids, apply_fn):
    d = fresh_copy()
    try:
        apply_fn(d)
        msg = run_against(d, expect_pass=False)
        ok = any(c in msg for c in expected_ids)
        report.append({"kind": kind, "target": target, "expected": sorted(expected_ids), "message": msg, "pass": ok})
        assert ok, f"{kind} on {target} did not surface an expected check-ID; got: {msg}"
    finally:
        shutil.rmtree(d, ignore_errors=True)


def main():
    part_a = []  # rerun of 41 v3 tests
    part_b = []  # new I1-I4 tests

    clean = fresh_copy()
    try:
        vfo.run(task_dir=clean, network_dir=NETWORK_DIR, repo_root=REPO_ROOT, verbose=False)
        print("sanity check: unmutated temp copy passes the real v4 validator -- PASS")
    finally:
        shutil.rmtree(clean, ignore_errors=True)

    # ---------------- Part A: rerun of the 41 v3 mutation tests ----------------
    csv_targets = [("Reyðarfjörður", "2520"), ("Vík", "3849")]
    for place, piece in csv_targets:
        with open(TASK_DIR / "place-access-status-v3.csv", encoding="utf-8") as f:
            base_row = next(r for r in csv.DictReader(f) if r["name"] == place)
        other_role = "ENTRY" if base_row["node_role"] == "EXIT" else "EXIT"
        other_field = "END" if base_row["stored_field"] == "START" else "START"
        x = float(base_row["native_x"])
        run_one(part_a, "role_label_only", f"csv:{place}", EXPECTED_CHECKS_V3["role_label_only"], lambda d, place=place, other_role=other_role: mutate_csv_row(d, place, node_role=other_role))
        run_one(part_a, "coord_deviation_0.2m", f"csv:{place}", EXPECTED_CHECKS_V3["coord_deviation_0.2m"], lambda d, place=place, x=x: mutate_csv_row(d, place, native_x=round(x + 0.2, 4)))
        run_one(part_a, "stored_field_swap", f"csv:{place}", EXPECTED_CHECKS_V3["stored_field_swap"], lambda d, place=place, other_field=other_field: mutate_csv_row(d, place, stored_field=other_field))
        run_one(part_a, "cum_incl_excl_swap", f"csv:{place}", EXPECTED_CHECKS_V3["cum_incl_excl_swap"], lambda d, place=place, br=base_row: mutate_csv_row(d, place, cum_km_incl_1436=br["cum_km_excl_1436"], cum_km_excl_1436=br["cum_km_incl_1436"]))
        run_one(part_a, "double_counted_1436", f"csv:{place}", EXPECTED_CHECKS_V3["double_counted_1436"], lambda d, place=place, br=base_row: mutate_csv_row(d, place, cum_km_incl_1436=round(float(br["cum_km_incl_1436"]) + 2.5601, 4)))
        run_one(part_a, "wrong_source_hash_key", f"csv:{place}", EXPECTED_CHECKS_V3["wrong_source_hash_key"], lambda d, place=place: mutate_csv_row(d, place, source_hash_key="wfs-north-4326.json"))
        run_one(part_a, "wrong_source_path", f"csv:{place}", EXPECTED_CHECKS_V3["wrong_source_path"], lambda d, place=place: mutate_csv_row(d, place, source_path="docs/ai/tasks/ticket-493/nonexistent.csv"))
        run_one(part_a, "wrong_crs", f"csv:{place}", EXPECTED_CHECKS_V3["wrong_crs"], lambda d, place=place: mutate_csv_row(d, place, crs="EPSG:9999"))
        # AA5(a): blanking provenance fields on a VALIDATED row now also
        # trips I1's own stronger "all required fields must be present"
        # check (those same fields are in REQUIRED_NONEMPTY_FOR_VALIDATED),
        # which fires first -- a strictly stronger detection, not a
        # regression, so VALIDATED_ROW_MISSING_REQUIRED_FIELD is accepted
        # alongside the original PROVENANCE_MISSING.
        run_one(part_a, "provenance_missing_on_real_coord", f"csv:{place}", EXPECTED_CHECKS_V3["provenance_missing_on_real_coord"] | {"VALIDATED_ROW_MISSING_REQUIRED_FIELD"}, lambda d, place=place: mutate_csv_row(d, place, source_path="", source_hash_key="", source_field="", crs=""))

    for place in ("Selfoss", "Hella"):
        with open(TASK_DIR / "samples/v3/place-node-references-v3.json", encoding="utf-8") as f:
            recs = json.load(f)[place]
        entry = next(r for r in recs if r["node_role"] == "ENTRY")
        run_one(part_a, "role_label_only", f"reference:{place}", EXPECTED_CHECKS_V3["role_label_only"], lambda d, place=place: mutate_reference_record(d, place, "ENTRY", node_role="EXIT"))
        run_one(part_a, "coord_deviation_0.2m", f"reference:{place}", EXPECTED_CHECKS_V3["coord_deviation_0.2m"], lambda d, place=place, entry=entry: mutate_reference_record(d, place, "ENTRY", coord=[entry["coord"][0] + 0.2, entry["coord"][1]]))
        run_one(part_a, "stored_field_swap", f"reference:{place}", EXPECTED_CHECKS_V3["stored_field_swap"], lambda d, place=place: mutate_reference_record(d, place, "ENTRY", stored_field="START"))
        run_one(part_a, "cum_incl_excl_swap", f"reference:{place}", EXPECTED_CHECKS_V3["cum_incl_excl_swap"], lambda d, place=place, entry=entry: mutate_reference_record(d, place, "ENTRY", cum_km_incl_1436=entry["cum_km_excl_1436"], cum_km_excl_1436=entry["cum_km_incl_1436"]))
        run_one(part_a, "double_counted_1436", f"reference:{place}", EXPECTED_CHECKS_V3["double_counted_1436"], lambda d, place=place, entry=entry: mutate_reference_record(d, place, "ENTRY", cum_km_incl_1436=round(entry["cum_km_incl_1436"] + 2.5601, 4)))
        run_one(part_a, "wrong_source_hash_key", f"reference:{place}", EXPECTED_CHECKS_V3["wrong_source_hash_key"], lambda d, place=place: mutate_reference_record(d, place, "ENTRY", source_hash_key="wfs-north-4326.json"))
        run_one(part_a, "wrong_source_path", f"reference:{place}", EXPECTED_CHECKS_V3["wrong_source_path"], lambda d, place=place: mutate_reference_record(d, place, "ENTRY", source_path="docs/ai/tasks/ticket-493/nonexistent.csv"))
        run_one(part_a, "wrong_crs", f"reference:{place}", EXPECTED_CHECKS_V3["wrong_crs"], lambda d, place=place: mutate_reference_record(d, place, "ENTRY", crs="EPSG:9999"))
        run_one(part_a, "provenance_missing_on_real_coord", f"reference:{place}", EXPECTED_CHECKS_V3["provenance_missing_on_real_coord"], lambda d, place=place: mutate_reference_record(d, place, "ENTRY", source_path=None, source_hash_key=None, source_field=None, crs=None))

    with open(TASK_DIR / "endpoint-candidates-v3.json", encoding="utf-8") as f:
        ec = json.load(f)
    eg = next(n for n in ec["egilsstadir_seydisfjordur"]["nodes"] if n["idferill"] == 2345)
    # AA5(a): node 2345's coord/cum are now checked via the dedicated G4 path
    # (AA3's fix -- v3's validator checked 2345 via the generic role/coord/cum
    # path, v4 checks ALL 7 G4 nodes, including 2345, via check_g4_node()).
    # These two reruns therefore legitimately surface G4_* IDs instead of the
    # old ROLE_* IDs -- the expected set is widened with that documented
    # reason, not silently forced to match; provenance IDs (hash key/CRS) are
    # unaffected and still match the v3-era IDs exactly.
    run_one(part_a, "coord_deviation_0.2m", "endpoint_candidates:egilsstadir", EXPECTED_CHECKS_V3["coord_deviation_0.2m"] | {"G4_COORD_MISMATCH"}, lambda d, eg=eg: mutate_endpoint_node_2345(d, coord=[eg["coord"][0] + 0.2, eg["coord"][1]]))
    run_one(part_a, "cum_incl_excl_swap", "endpoint_candidates:egilsstadir", EXPECTED_CHECKS_V3["cum_incl_excl_swap"] | {"G4_CUM_MISMATCH"}, lambda d, eg=eg: mutate_endpoint_node_2345(d, ring_cum_km_incl_1436=eg["ring_cum_km_excl_1436"], ring_cum_km_excl_1436=eg["ring_cum_km_incl_1436"]))
    run_one(part_a, "wrong_source_hash_key", "endpoint_candidates:egilsstadir", EXPECTED_CHECKS_V3["wrong_source_hash_key"], lambda d, eg=eg: mutate_endpoint_node_2345(d, source_hash_key="wfs-north-4326.json"))
    run_one(part_a, "wrong_crs", "endpoint_candidates:egilsstadir", EXPECTED_CHECKS_V3["wrong_crs"], lambda d, eg=eg: mutate_endpoint_node_2345(d, crs="EPSG:9999"))
    run_one(part_a, "akureyri_wgs84_digit_altered", "endpoint_candidates:akureyri", EXPECTED_CHECKS_V3["akureyri_wgs84_digit_altered"], mutate_akureyri_wgs84_digit)

    print(f"Part A (rerun of v3 mutation tests): {len(part_a)} tests, all passed with the same expected check-IDs under v4.")

    # ---------------- Part B: new I1-I4 tests ----------------
    for place in sorted(vfo.VALIDATED_NAMES):
        for field in vfo.REQUIRED_NONEMPTY_FOR_VALIDATED:
            run_one(part_b, "blank_required_field", f"csv:{place}:{field}", {"VALIDATED_ROW_MISSING_REQUIRED_FIELD"}, lambda d, place=place, field=field: mutate_csv_row(d, place, **{field: ""}))

    run_one(part_b, "borgarnes_role_set", "csv:Borgarnes", {"BORGARNES_FIELD_NOT_EMPTY"}, lambda d: mutate_csv_row(d, "Borgarnes", node_role="ENTRY", stored_field="END"))
    with open(TASK_DIR / "place-access-status-v3.csv", encoding="utf-8") as f:
        borg = next(r for r in csv.DictReader(f) if r["name"] == "Borgarnes")
    run_one(part_b, "borgarnes_cum_filled", "csv:Borgarnes", {"BORGARNES_FIELD_NOT_EMPTY"}, lambda d: mutate_csv_row(d, "Borgarnes", cum_km_incl_1436="100.0", cum_km_excl_1436="97.0"))

    run_one(part_b, "no_node_field_filled", "csv:Reykjavík", {"NO_NODE_OR_PAIR_FIELD_NOT_EMPTY"}, lambda d: mutate_csv_row(d, "Reykjavík", native_x="500000.0", native_y="400000.0"))
    run_one(part_b, "pair_field_filled", "csv:Selfoss", {"NO_NODE_OR_PAIR_FIELD_NOT_EMPTY"}, lambda d: mutate_csv_row(d, "Selfoss", native_x="500000.0", native_y="400000.0"))

    run_one(part_b, "role_divergence_mutated", "csv:Egilsstaðir", {"ROLE_DIVERGENCE_MISMATCH"}, lambda d: mutate_csv_row(d, "Egilsstaðir", role_divergence="NONE"))
    run_one(part_b, "coordinate_source_mutated", "csv:Akureyri", {"COORDINATE_SOURCE_MISMATCH"}, lambda d: mutate_csv_row(d, "Akureyri", coordinate_source="RETAINED_GEOMETRY"))
    run_one(part_b, "direction_status_mutated", "csv:Vík", {"DIRECTION_STATUS_MISMATCH"}, lambda d: mutate_csv_row(d, "Vík", direction_status="UNKNOWN"))

    run_one(part_b, "g4_coord_plus_0.2m", "g4:3410", {"G4_COORD_MISMATCH"}, lambda d: mutate_g4_node(d, 3410, "end", coord=[0, 0]))
    with open(TASK_DIR / "endpoint-candidates-v3.json", encoding="utf-8") as f:
        ec2 = json.load(f)
    n3410 = next(n for n in ec2["egilsstadir_seydisfjordur"]["nodes"] if n["idferill"] == 3410)
    run_one(part_b, "g4_coord_plus_5m", "g4:3410", {"G4_COORD_MISMATCH"}, lambda d, n=n3410: mutate_g4_node(d, 3410, "end", coord=[n["coord"][0] + 5.0, n["coord"][1]]))
    run_one(part_b, "g4_tier_cum_mutated", "g4:3410", {"G4_CUM_MISMATCH"}, lambda d, n=n3410: mutate_g4_node(d, 3410, "end", cum_km_tier_minus1=round(n["cum_km_tier_minus1"] + 1.0, 4)))
    run_one(part_b, "g4_wrong_source_hash_key", "g4:3410", {"PROVENANCE_HASH_KEY_INVALID"}, lambda d: mutate_g4_node(d, 3410, "end", source_hash_key="wfs-north-4326.json"))
    run_one(part_b, "g4_native_crs_4326", "g4:3410", {"PROVENANCE_CRS_INVALID"}, lambda d: mutate_g4_node(d, 3410, "end", crs="EPSG:4326"))
    run_one(part_b, "g4_wrong_source_field", "g4:2345", {"PROVENANCE_SOURCE_FIELD_MISMATCH"}, lambda d: mutate_endpoint_node_2345(d, source_field="start_x/start_y"))

    # AA4: missing-source-file test. A fake, empty repo_root is passed to
    # run() (task_dir/network_dir/phase2_dir/ticket493_dir stay real and
    # correct, so chain-walks/road-links/wfs93/phase1-inventory loading and
    # the role/coord/cum math are all unaffected) -- only the provenance
    # step's own `repo_root / source_path` existence check sees a missing
    # file, for every one of the 19 non-null-coordinate provenance checks.
    # This proves the validator returns a named check-ID rather than
    # raising FileNotFoundError/a traceback when a source file is absent.
    d = fresh_copy()
    fake_repo_root = Path(tempfile.mkdtemp(prefix="access-points-v4-fakeroot-"))
    try:
        try:
            vfo.run(task_dir=d, network_dir=NETWORK_DIR, repo_root=fake_repo_root, phase2_dir=PHASE2_DIR, ticket493_dir=TICKET493_DIR, verbose=False)
            msg = "expected validator to reject, but it passed"
            ok = False
        except AssertionError as e:
            msg = str(e)
            ok = "PROVENANCE_SOURCE_FILE_MISSING" in msg and "FileNotFoundError" not in msg and "Traceback" not in msg
        part_b.append({"kind": "missing_source_file", "target": "all_provenance_checks", "expected": ["PROVENANCE_SOURCE_FILE_MISSING"], "message": msg, "pass": ok})
        assert ok, f"missing_source_file did not surface PROVENANCE_SOURCE_FILE_MISSING cleanly; got: {msg}"
    finally:
        shutil.rmtree(d, ignore_errors=True)
        shutil.rmtree(fake_repo_root, ignore_errors=True)

    print(f"Part B (new I1-I4 tests): {len(part_b)} tests, all passed with their pre-registered expected check-IDs.")

    assert all(t["pass"] for t in part_a), [t for t in part_a if not t["pass"]]
    assert all(t["pass"] for t in part_b), [t for t in part_b if not t["pass"]]

    report = {
        "v3_mutation_tests_rerun_count": len(part_a),
        "v4_new_mutation_tests_count": len(part_b),
        "part_a_rerun_of_v3_tests": part_a,
        "part_b_new_i1_to_i4_tests": part_b,
        "all_pass": True,
    }
    with open(TASK_DIR / "samples/v4/mutation_test_report_v4.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"\nALL {len(part_a) + len(part_b)} MUTATION TESTS PASSED ({len(part_a)} v3 reruns + {len(part_b)} new I1-I4 tests), each fired its own pre-registered expected check-ID against the REAL validate_final_outputs_v4.run(), on temp copies outside the repo, now cleaned up.")


if __name__ == "__main__":
    main()
