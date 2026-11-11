#!/usr/bin/env python3
"""
#493 access-points v3 -- F3(b)/(c)/(d) mutation-test harness. Copies
the REAL written v3 outputs into a tempfile.mkdtemp() directory OUTSIDE
the repo, mutates exactly one field at a time, and calls the real,
unmodified validate_final_outputs_v3.run() (same code path as
production, F3a) against that temp copy. Asserts the returned/raised
check-ID is in the pre-registered expected set for that mutation kind
(rules-v3.md's own table) -- never "something failed". The temp area
is deleted after use and never referenced by any hash table or index.
Offline only -- no network.
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

sys.path.insert(0, str(Path(__file__).resolve().parent))
import validate_final_outputs_v3 as vfo  # noqa: E402

EXPECTED_CHECKS = {
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

CSV_FILES = ["place-access-status-v3.csv", "place-access-status.csv", "endpoint-candidates.json", "endpoint-candidates-v3.json"]
JSON_FILES = ["samples/v3/place-node-references-v3.json", "samples/v3/input_hashes_v3.json", "samples/v3/v1_v2_and_input_baseline.json"]


def fresh_copy():
    d = Path(tempfile.mkdtemp(prefix="access-points-v3-mutest-"))
    (d / "samples/v3").mkdir(parents=True)
    for rel in CSV_FILES + JSON_FILES:
        src = TASK_DIR / rel
        dst = d / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
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


def mutate_akureyri_wgs84_digit(d):
    path = d / "endpoint-candidates-v3.json"
    doc = json.loads(path.read_text(encoding="utf-8"))
    doc["akureyri"]["wgs84"]["lat_deg_n"] = round(doc["akureyri"]["wgs84"]["lat_deg_n"] + 1.0, 8)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def main():
    report = {"tests": [], "sanity_clean_copy_passes": None}

    clean = fresh_copy()
    try:
        run_against(clean, expect_pass=True)
        report["sanity_clean_copy_passes"] = True
        print("sanity check: unmutated temp copy passes the real validator -- PASS")
    finally:
        shutil.rmtree(clean, ignore_errors=True)

    # ---- CSV-row mutations: two distinct pieces (Reyðarfjörður/2520, Vík/3849) ----
    csv_targets = [("Reyðarfjörður", "2520"), ("Vík", "3849")]
    for place, piece in csv_targets:
        with open(TASK_DIR / "place-access-status-v3.csv", encoding="utf-8") as f:
            base_row = next(r for r in csv.DictReader(f) if r["name"] == place)

        def do(kind, changes):
            d = fresh_copy()
            try:
                mutate_csv_row(d, place, **changes)
                msg = run_against(d, expect_pass=False)
                hit = EXPECTED_CHECKS[kind] & {c for c in EXPECTED_CHECKS[kind] if c in msg}
                ok = bool(hit)
                report["tests"].append({"kind": kind, "target": f"csv:{place}:{piece}", "expected": sorted(EXPECTED_CHECKS[kind]), "message": msg, "pass": ok})
                assert ok, f"{kind} on {place} did not surface an expected check-ID; got: {msg}"
            finally:
                shutil.rmtree(d, ignore_errors=True)

        other_role = "ENTRY" if base_row["node_role"] == "EXIT" else "EXIT"
        do("role_label_only", {"node_role": other_role})
        x, y = float(base_row["native_x"]), float(base_row["native_y"])
        do("coord_deviation_0.2m", {"native_x": round(x + 0.2, 4)})
        other_field = "END" if base_row["stored_field"] == "START" else "START"
        do("stored_field_swap", {"stored_field": other_field})
        do("cum_incl_excl_swap", {"cum_km_incl_1436": base_row["cum_km_excl_1436"], "cum_km_excl_1436": base_row["cum_km_incl_1436"]})
        do("double_counted_1436", {"cum_km_incl_1436": round(float(base_row["cum_km_incl_1436"]) + 2.5601, 4)})
        do("wrong_source_hash_key", {"source_hash_key": "wfs-north-4326.json"})
        do("wrong_source_path", {"source_path": "docs/ai/tasks/ticket-493/nonexistent.csv"})
        do("wrong_crs", {"crs": "EPSG:9999"})
        do("provenance_missing_on_real_coord", {"source_path": "", "source_hash_key": "", "source_field": "", "crs": ""})

    # ---- place-node-references-v3.json mutations: two distinct pieces (Selfoss/2138, Hella/3591) ----
    for place in ("Selfoss", "Hella"):
        with open(TASK_DIR / "samples/v3/place-node-references-v3.json", encoding="utf-8") as f:
            recs = json.load(f)[place]
        entry = next(r for r in recs if r["node_role"] == "ENTRY")

        def do(kind, changes):
            d = fresh_copy()
            try:
                mutate_reference_record(d, place, "ENTRY", **changes)
                msg = run_against(d, expect_pass=False)
                ok = any(c in msg for c in EXPECTED_CHECKS[kind])
                report["tests"].append({"kind": kind, "target": f"reference:{place}:ENTRY", "expected": sorted(EXPECTED_CHECKS[kind]), "message": msg, "pass": ok})
                assert ok, f"{kind} on reference {place} did not surface an expected check-ID; got: {msg}"
            finally:
                shutil.rmtree(d, ignore_errors=True)

        do("role_label_only", {"node_role": "EXIT"})
        do("coord_deviation_0.2m", {"coord": [entry["coord"][0] + 0.2, entry["coord"][1]]})
        do("stored_field_swap", {"stored_field": "START"})
        do("cum_incl_excl_swap", {"cum_km_incl_1436": entry["cum_km_excl_1436"], "cum_km_excl_1436": entry["cum_km_incl_1436"]})
        do("double_counted_1436", {"cum_km_incl_1436": round(entry["cum_km_incl_1436"] + 2.5601, 4)})
        do("wrong_source_hash_key", {"source_hash_key": "wfs-north-4326.json"})
        do("wrong_source_path", {"source_path": "docs/ai/tasks/ticket-493/nonexistent.csv"})
        do("wrong_crs", {"crs": "EPSG:9999"})
        do("provenance_missing_on_real_coord", {"source_path": None, "source_hash_key": None, "piece_id": None, "source_field": None, "crs": None})

    # ---- endpoint-candidates-v3.json mutations: Egilsstaðir node (2345) + Akureyri WGS84 (3876/2940) ----
    with open(TASK_DIR / "endpoint-candidates-v3.json", encoding="utf-8") as f:
        ec = json.load(f)
    eg = next(n for n in ec["egilsstadir_seydisfjordur"]["nodes"] if n["idferill"] == 2345)

    def do_eg(kind, changes):
        d = fresh_copy()
        try:
            mutate_endpoint_node_2345(d, **changes)
            msg = run_against(d, expect_pass=False)
            ok = any(c in msg for c in EXPECTED_CHECKS[kind])
            report["tests"].append({"kind": kind, "target": "endpoint_candidates:egilsstadir:2345", "expected": sorted(EXPECTED_CHECKS[kind]), "message": msg, "pass": ok})
            assert ok, f"{kind} on endpoint-candidates Egilsstaðir node did not surface an expected check-ID; got: {msg}"
        finally:
            shutil.rmtree(d, ignore_errors=True)

    do_eg("coord_deviation_0.2m", {"coord": [eg["coord"][0] + 0.2, eg["coord"][1]]})
    do_eg("cum_incl_excl_swap", {"ring_cum_km_incl_1436": eg["ring_cum_km_excl_1436"], "ring_cum_km_excl_1436": eg["ring_cum_km_incl_1436"]})
    do_eg("wrong_source_hash_key", {"source_hash_key": "wfs-north-4326.json"})
    do_eg("wrong_crs", {"crs": "EPSG:9999"})

    d = fresh_copy()
    try:
        mutate_akureyri_wgs84_digit(d)
        msg = run_against(d, expect_pass=False)
        ok = any(c in msg for c in EXPECTED_CHECKS["akureyri_wgs84_digit_altered"])
        report["tests"].append({"kind": "akureyri_wgs84_digit_altered", "target": "endpoint_candidates:akureyri", "expected": sorted(EXPECTED_CHECKS["akureyri_wgs84_digit_altered"]), "message": msg, "pass": ok})
        assert ok, f"akureyri_wgs84_digit_altered did not surface AKUREYRI_WGS84_MISMATCH; got: {msg}"
    finally:
        shutil.rmtree(d, ignore_errors=True)

    assert all(t["pass"] for t in report["tests"]), [t for t in report["tests"] if not t["pass"]]
    report["total_mutation_tests"] = len(report["tests"])
    report["by_kind_counts"] = {}
    for t in report["tests"]:
        report["by_kind_counts"][t["kind"]] = report["by_kind_counts"].get(t["kind"], 0) + 1
    print(f"ALL {report['total_mutation_tests']} MUTATION TESTS PASSED (each fired its own pre-registered expected check-ID against the REAL validate_final_outputs_v3.run(), on temp copies outside the repo, now cleaned up).")
    print("by kind:", report["by_kind_counts"])

    with open(TASK_DIR / "samples/v3/mutation_test_report_v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
        f.write("\n")


if __name__ == "__main__":
    main()
