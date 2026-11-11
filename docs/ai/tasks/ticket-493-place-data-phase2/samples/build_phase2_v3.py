#!/usr/bin/env python3
"""
#493 phase2 v3 (approved-prompt-v3.md, M1-M6). Corrects a real bug in
v2's egilsstadir_nodes(): cw_long.steps already starts with piece 1436,
so v2's "add piece_1436_length_m to get incl" double-counted it and
mislabelled the result. Offline only -- no network.
"""
import csv
import hashlib
import json
import unicodedata
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
CHAIN_WALKS_PATH = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/chain-walks-v4.json"
ROAD_LINKS_PATH = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv"

TARGET_PIECES = {2345: "EGILSSTADIR_JUNCTION_PHASE1", 2138: "SELFOSS", 3591: "HELLA", 3593: "HVOLSVOLLUR"}

# ---------------------------------------------------------------------
# M1 -- two independent computation paths over the same raw steps
# ---------------------------------------------------------------------


def _load_cw_long():
    d = json.loads(CHAIN_WALKS_PATH.read_bytes())
    return d["cw_long"]


def _stored_endpoints():
    out = {}
    with open(ROAD_LINKS_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            idf = int(row["idferill"])
            out[idf] = {"start": [float(row["start_x"]), float(row["start_y"])], "end": [float(row["end_x"]), float(row["end_y"])]}
    return out


def production_node(cw, idferill):
    """Prefix-sum path (from the start of cw_long.steps)."""
    steps = cw["steps"]
    p1436 = cw["piece_1436_length_m"]
    prefix = 0.0
    for s in steps:
        if s["idferill"] == idferill:
            entry_incl = prefix + s["gap_into_m"]
            exit_incl = entry_incl + s["piece_cost_m"]
            return {
                "direction": s["direction"],
                "entry_coord": s["entry"],
                "exit_coord": s["exit"],
                "entry_cum_km_incl_1436": entry_incl / 1000,
                "entry_cum_km_excl_1436": (entry_incl - p1436) / 1000,
                "exit_cum_km_incl_1436": exit_incl / 1000,
                "exit_cum_km_excl_1436": (exit_incl - p1436) / 1000,
            }
        prefix += s["gap_into_m"] + s["piece_cost_m"]
    raise AssertionError(f"idferill {idferill} not found in cw_long steps")


def validator_expected_node(cw, idferill):
    """Suffix-sum path (from the end of cw_long.steps) -- independent of
    production_node: never calls it, never shares a running variable."""
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
                "direction": s["direction"],
                "entry_coord": s["entry"],
                "exit_coord": s["exit"],
                "entry_cum_km_incl_1436": entry_incl / 1000,
                "entry_cum_km_excl_1436": (entry_incl - p1436) / 1000,
                "exit_cum_km_incl_1436": exit_incl / 1000,
                "exit_cum_km_excl_1436": (exit_incl - p1436) / 1000,
            }
    raise AssertionError(f"idferill {idferill} not found in cw_long steps")


def _close(a, b, tol_m=0.1):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 <= tol_m


def validate_node(record, idferill, cw, stored):
    """The ONE validator used both for acceptance and for every mutation
    test. Raises AssertionError on ANY mismatch. Compares (value, label)
    pairs, not bare numbers -- the exact gap that let v2's N1 bug pass."""
    expected = validator_expected_node(cw, idferill)
    se = stored[idferill]

    if expected["direction"] == "rev":
        exp_entry_role, exp_exit_role = se["end"], se["start"]
    else:
        exp_entry_role, exp_exit_role = se["start"], se["end"]

    assert _close(record["entry_coord"], exp_entry_role), f"entry coord {record['entry_coord']} does not match expected stored role {exp_entry_role}"
    assert _close(record["exit_coord"], exp_exit_role), f"exit coord {record['exit_coord']} does not match expected stored role {exp_exit_role}"

    for field in ("entry_cum_km_incl_1436", "entry_cum_km_excl_1436", "exit_cum_km_incl_1436", "exit_cum_km_excl_1436"):
        got = record[field]
        want = expected[field]
        assert abs(got - want) <= 0.0001, f"{field}: got {got} != expected {want} (tol 0.1m/0.0001km)"
    return True


def run_mutation_tests(cw, stored):
    """M2: four independent negative tests using validate_node, the SAME
    function that accepts the correct record. All must raise."""
    correct = production_node(cw, 2345)
    results = {}

    # Sanity: the correct record must itself pass first.
    validate_node(correct, 2345, cw, stored)
    results["correct_record_accepted"] = True

    def expect_fail(name, mutate):
        rec = dict(correct)
        mutate(rec)
        try:
            validate_node(rec, 2345, cw, stored)
            results[name] = {"rejected": False}
        except AssertionError as e:
            results[name] = {"rejected": True, "reason": str(e)}

    expect_fail("entry_exit_coord_swap", lambda r: (r.__setitem__("entry_coord", correct["exit_coord"]), r.__setitem__("exit_coord", correct["entry_coord"])))
    expect_fail("incl_excl_field_swap", lambda r: (
        r.__setitem__("entry_cum_km_incl_1436", correct["entry_cum_km_excl_1436"]),
        r.__setitem__("entry_cum_km_excl_1436", correct["entry_cum_km_incl_1436"]),
        r.__setitem__("exit_cum_km_incl_1436", correct["exit_cum_km_excl_1436"]),
        r.__setitem__("exit_cum_km_excl_1436", correct["exit_cum_km_incl_1436"]),
    ))
    p1436_km = cw["piece_1436_length_m"] / 1000
    expect_fail("double_counted_1436", lambda r: (
        r.__setitem__("entry_cum_km_incl_1436", correct["entry_cum_km_incl_1436"] + p1436_km),
        r.__setitem__("exit_cum_km_incl_1436", correct["exit_cum_km_incl_1436"] + p1436_km),
    ))

    # The actual wrong v2 values, verbatim from egilsstadir_nodes-v2.json.
    v2_wrong_junction = dict(correct)
    v2_wrong_junction["entry_cum_km_incl_1436"] = 680.1945
    v2_wrong_junction["entry_cum_km_excl_1436"] = 677.6344
    try:
        validate_node(v2_wrong_junction, 2345, cw, stored)
        results["v2_wrong_junction_values"] = {"rejected": False}
    except AssertionError as e:
        results["v2_wrong_junction_values"] = {"rejected": True, "reason": str(e)}

    v2_wrong_phase1 = dict(correct)
    v2_wrong_phase1["exit_cum_km_incl_1436"] = 681.1216
    v2_wrong_phase1["exit_cum_km_excl_1436"] = 678.5614
    try:
        validate_node(v2_wrong_phase1, 2345, cw, stored)
        results["v2_wrong_phase1_values"] = {"rejected": False}
    except AssertionError as e:
        results["v2_wrong_phase1_values"] = {"rejected": True, "reason": str(e)}

    for name, outcome in results.items():
        if name == "correct_record_accepted":
            continue
        assert outcome["rejected"], f"mutation test {name} should have been REJECTED but was accepted"

    return results


def build_place_nodes():
    cw = _load_cw_long()
    stored = _stored_endpoints()

    mutation_results = run_mutation_tests(cw, stored)

    nodes = {}
    for idferill, label in TARGET_PIECES.items():
        rec = production_node(cw, idferill)
        validate_node(rec, idferill, cw, stored)  # M3: must pass before being trusted
        nodes[idferill] = {"label": label, **rec}

    return {
        "mutation_tests_before_any_output_written": mutation_results,
        "nodes_by_idferill": {str(k): v for k, v in nodes.items()},
        "comparison_targets_not_assert_targets_km": {
            "2345_entry": [677.6344, 675.0743],
            "2345_exit": [678.5614, 676.0013],
            "2138_entry": [43.7329, 41.1727],
            "2138_exit": [45.7405, 43.1803],
            "3591_entry": [80.9378, 78.3776],
            "3591_exit": [81.7696, 79.2094],
            "3593_entry": [94.3749, 91.8148],
            "3593_exit": [94.6543, 92.0942],
        },
    }


# ---------------------------------------------------------------------
# M4 -- ledger integrity, separated from unenforced-protection limits
# ---------------------------------------------------------------------

RAW_FILES_BY_LEDGER_ORDER = ["metadata-MAN030106-raw.json", "data-MAN030106-raw.json", "wfs93-raw.json"]


def verify_ledger_integrity():
    ledger_path = TASK_DIR / "samples/exchange-ledger.jsonl"
    lines = ledger_path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 3, f"expected exactly 3 ledger lines, found {len(lines)}"

    checks = []
    for line, raw_name in zip(lines, RAW_FILES_BY_LEDGER_ORDER):
        entry = json.loads(line)
        raw_path = TASK_DIR / "samples" / raw_name
        raw_bytes = raw_path.read_bytes()
        actual_sha = hashlib.sha256(raw_bytes).hexdigest()
        actual_len = len(raw_bytes)
        ok_hash = actual_sha == entry["sha256_of_received_bytes"]
        ok_len = actual_len == entry["bytes_received"]
        checks.append({"raw_file": raw_name, "ledger_sha256": entry["sha256_of_received_bytes"], "actual_sha256": actual_sha, "hash_match": ok_hash, "ledger_bytes": entry["bytes_received"], "actual_bytes": actual_len, "bytes_match": ok_len})
        assert ok_hash and ok_len, f"{raw_name}: ledger/disk mismatch"

    return {
        "ledger_line_count": len(lines),
        "integrity_checks": checks,
        "all_3_of_3_pass": all(c["hash_match"] and c["bytes_match"] for c in checks),
        "this_proves": "the retained bytes are exactly what the ledgered exchanges received -- NOT that any guard/protection mechanism was exercised",
        "limitations_untested_unenforced": {
            "mid_body_stall": "a response stalling mid-body can present as status=200, error=None, truncated=false, 0 bytes, with only timeout=true set; exchange*.py never checks that key (Jonesy's own 127.0.0.1 sandbox finding, result-review.md S7 -- cited as hers, not re-run this round, no new network attempt authorised)",
            "socket_vs_wallclock_timeout": "the 20s limit is a socket timeout, not a wall-clock total (same source)",
            "remaining_budget_not_exercised": "remaining_total_budget_bytes was never actually sent in any of the 3 real requests -- cap_applied_bytes=8388608 in all three ledger lines, so the min() cap was only exercised indirectly",
            "aggregate_guards_absent": "no code guards the aggregate exchange count or elapsed time across exchanges",
        },
    }


# ---------------------------------------------------------------------
# K5/M5 -- work-list matching: exact-first, match_type, generic flags
# ---------------------------------------------------------------------

NATIONAL_PLACE_COVERAGE_PATH = REPO_ROOT / "docs/ai/tasks/ticket-493/national-place-coverage.md"
NATIONAL_PLACE_COVERAGE_SHA256 = "2777107e48eea09b083ea278da3cbda3be7a9557b722c0247a1fb8f96a64e35e"
EDITORIAL_SUFFIX = " og fleiri firðir eftir nákvæmri yfirferð tenginga"
EXCLUDED_NON_PLACES = {"Gatnamót tenginga við veg 1": "names a type of road-junction connection, not a settlement"}
CODE_50_LINK_NAMES = {"Kópavogur", "Hafnarfjörður", "Garðabær"}


def _nfc(s):
    return unicodedata.normalize("NFC", s.strip())


def extract_work_list():
    raw = NATIONAL_PLACE_COVERAGE_PATH.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == NATIONAL_PLACE_COVERAGE_SHA256
    text = raw.decode("utf-8")

    table_rows = []
    in_table = False
    for line in text.splitlines():
        if line.strip().startswith("| Svæði |"):
            in_table = True
            continue
        if in_table:
            if line.strip().startswith("|---"):
                continue
            if not line.strip().startswith("|"):
                break
            cols = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cols) >= 3:
                table_rows.append({"region": cols[0], "col2_ring": cols[1], "col3_tengivegur": cols[2]})

    raw_entries = []
    for r in table_rows:
        for cell in r["col2_ring"].split(","):
            raw_entries.append((r["region"], "ring_or_nearby", cell))
        for cell in r["col3_tengivegur"].split(","):
            raw_entries.append((r["region"], "connecting_road", cell))
    input_count = len(raw_entries)

    cleaned = []
    excluded_log = []
    stripped_editorial_log = []
    for region, source_col, cell in raw_entries:
        name = _nfc(cell)
        if name in EXCLUDED_NON_PLACES:
            excluded_log.append({"region": region, "source_col": source_col, "name": name, "reason": EXCLUDED_NON_PLACES[name]})
            continue
        if name.endswith(EDITORIAL_SUFFIX):
            stripped = _nfc(name[: -len(EDITORIAL_SUFFIX)])
            stripped_editorial_log.append({"region": region, "source_col": source_col, "before": name, "after": stripped})
            name = stripped
        if not name:
            continue
        cleaned.append({"region": region, "source_col": source_col, "name": name})

    merged = {}
    for e in cleaned:
        merged.setdefault(e["name"], []).append({"region": e["region"], "source_col": e["source_col"]})
    output_rows = [{"name": name, "sources": srcs} for name, srcs in merged.items()]

    return {
        "input_cell_count": input_count,
        "excluded_non_places": excluded_log,
        "editorial_text_stripped": stripped_editorial_log,
        "cleaned_count_before_merge": len(cleaned),
        "output_row_count_after_merge": len(output_rows),
        "rows": output_rows,
    }


def match_work_list_to_hagstofa(work_list, hagstofa_rows, code50_inferred_candidates):
    non_total = [r for r in hagstofa_rows if r["row_type"] != "TOTAL"]
    name_to_row = {r["name"]: r for r in non_total}
    hagstofa_names = list(name_to_row.keys())

    results = []
    for row in work_list["rows"]:
        name = row["name"]
        src_text = ", ".join(f"{s['region']}/{s['source_col']}" for s in row["sources"])
        exact = name_to_row.get(name)
        if exact is not None:
            match_type = "EXACT"
            candidates = [{"name": name, "code": exact["code"]}]
            status = "MATCHED"
            reason = f"exact NFC match against Hagstofa settlement name '{name}'"
        else:
            prefix_candidates = [h for h in hagstofa_names if h.startswith(name + ",") or h.startswith(name + " ")]
            if len(prefix_candidates) == 1:
                match_type = "PREFIX_SINGLE"
                candidates = [{"name": prefix_candidates[0], "code": name_to_row[prefix_candidates[0]]["code"]}]
                status = "MATCHED"
                reason = f"no exact match; exactly one Hagstofa name starts with '{name}' ('{prefix_candidates[0]}')"
            elif len(prefix_candidates) > 1:
                match_type = "AMBIGUOUS"
                candidates = [{"name": c, "code": name_to_row[c]["code"]} for c in prefix_candidates]
                status = "AMBIGUOUS"
                reason = f"no exact match; {len(prefix_candidates)} Hagstofa names start with '{name}', none auto-resolved"
            else:
                match_type = "NONE"
                candidates = []
                status = "UNMATCHED"
                reason = f"no exact or single-prefix Hagstofa name match for '{name}'"

        flags = {}
        linked_code50 = False
        if status == "MATCHED":
            matched_row = name_to_row[candidates[0]["name"]]
            flags["zero_population"] = int(matched_row["pop_2025"]) == 0
            flags["is_rural_aggregate"] = matched_row["row_type"] == "RURAL_AGGREGATE"
            if flags["zero_population"]:
                reason += "; matched code has population 0 in 2025, interpretation NOT_DETERMINED (not asserted discontinued/reclassified)"
        elif status == "UNMATCHED":
            if name in CODE_50_LINK_NAMES and code50_inferred_candidates.get(name):
                linked_code50 = True
                reason += "; proposed INCLUDED_IN_CODE_50_INFERRED (classification step: no row of its own anywhere in the 120-row table) -- INFERRED, not a confirmed boundary, no population figure duplicated"
            else:
                reason += "; no INCLUDED_IN_CODE_50_INFERRED or other grouping proposal found in retained data"

        results.append({
            "work_list_name": name,
            "source_reference": src_text,
            "status": status,
            "match_type": match_type,
            "candidates": candidates,
            "flags": flags,
            "included_in_code_50_inferred": linked_code50,
            "reason": reason,
        })

    assert len(results) == work_list["output_row_count_after_merge"], "one result per cleaned work-list row required"
    assert all(r["reason"] for r in results), "every result must carry a non-empty reason"
    return results


if __name__ == "__main__":
    import re

    forbidden = {"socket", "http", "urllib", "requests", "ssl"}
    src = Path(__file__).read_text(encoding="utf-8")
    used = {m for m in forbidden if re.search(rf"^\s*(import {m}\b|from {m}\b)", src, re.MULTILINE)}
    assert not used, f"forbidden network-capable import(s) found: {used}"
    print("static import check: PASS (no socket/http/urllib/requests/ssl import)")

    place_nodes = build_place_nodes()
    with open(TASK_DIR / "samples/place_nodes-v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(place_nodes, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("mutation tests (all except correct_record_accepted must show rejected=True):")
    for name, outcome in place_nodes["mutation_tests_before_any_output_written"].items():
        print(" ", name, outcome if name == "correct_record_accepted" else outcome.get("rejected"))
    for idf, label in TARGET_PIECES.items():
        n = place_nodes["nodes_by_idferill"][str(idf)]
        print(f"  {label} ({idf}): entry {n['entry_cum_km_incl_1436']:.4f}/{n['entry_cum_km_excl_1436']:.4f}  exit {n['exit_cum_km_incl_1436']:.4f}/{n['exit_cum_km_excl_1436']:.4f}")

    ledger_integrity = verify_ledger_integrity()
    with open(TASK_DIR / "samples/ledger_integrity-v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(ledger_integrity, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("ledger integrity all_3_of_3_pass:", ledger_integrity["all_3_of_3_pass"])

    classification = json.loads((TASK_DIR / "samples/hagstofa_classification-v2.json").read_bytes())
    code50_inferred = classification["code_50_included_inferred_candidates"]
    hagstofa_rows = classification["rows_with_type"]

    work_list = extract_work_list()
    match_results = match_work_list_to_hagstofa(work_list, hagstofa_rows, code50_inferred)
    s5_output = {"work_list_extraction": work_list, "hagstofa_matching": match_results}
    with open(TASK_DIR / "samples/worklist_matching-v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(s5_output, f, ensure_ascii=False, indent=1)
        f.write("\n")
    status_counts = {}
    for r in match_results:
        status_counts[r["status"]] = status_counts.get(r["status"], 0) + 1
    print("work-list input_cell_count:", work_list["input_cell_count"], "-> output rows:", work_list["output_row_count_after_merge"])
    print("match status counts:", status_counts, "(sandbox comparison: 67 MATCHED, 1 AMBIGUOUS, 4 UNMATCHED)")
    vogar = next(r for r in match_results if r["work_list_name"] == "Vogar")
    print("Vogar:", vogar["status"], vogar["match_type"], vogar["candidates"])
