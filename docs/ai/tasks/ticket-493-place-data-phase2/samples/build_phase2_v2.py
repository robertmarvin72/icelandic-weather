#!/usr/bin/env python3
"""
#493 phase2 correction v2 (approved-prompt-v2.md, K1-K8). Offline
reprocessing of already-retained data -- NO network access. Static
check (own test, run at the bottom of this file) confirms this module
imports none of socket/http/urllib/requests/ssl.
"""
import csv
import hashlib
import json
import math
import re
import unicodedata
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
AGE_REFERENCE_UTC = "2026-11-09T00:00:00Z"  # fixed research reference, not now()

# ---------------------------------------------------------------------
# K1/S1 -- road-condition footprint
# ---------------------------------------------------------------------

def normalize_idbutur(value):
    """Replicates api/_lib/winterRoute/roadFetch.js's own normalizeIdButur."""
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value) if value == int(value) else None
    if isinstance(value, str) and value.strip():
        try:
            n = float(value)
        except ValueError:
            return None
        return int(n) if n == int(n) else None
    return None


LEGACY_FAERD_FILES = {
    "legacy-faerd-fresh.json": (REPO_ROOT / "docs/ai/tasks/ticket-483/samples/legacy-faerd-fresh.json", "592d052e2c861de34d264421b944dfefae44a0f054bfd0b8c594f2b143d90a54"),
    "legacy-faerd-https.json": (REPO_ROOT / "docs/ai/tasks/ticket-485/samples/legacy-faerd-https.json", "1b6ff2c5f074b6f9ec2d9c9addecfef1471762c110730388275b3b4a3537c3ee"),
}
LEGACY_FAERDPUNKTAR_FILES = {
    "legacy-faerdpunktar.json": (REPO_ROOT / "docs/ai/tasks/ticket-483/samples/legacy-faerdpunktar.json", "156f1136521faebe8d9e882f229930b2ab1e505be181981c7c3969d7f66ffb42"),
    "legacy-faerdpunktar-https.json": (REPO_ROOT / "docs/ai/tasks/ticket-485/samples/legacy-faerdpunktar-https.json", "788c712aa9e1a5ef8059f77444e868d52a29ca3e981d163fdd54dc8d94db325c"),
}
TARGET_IDBUTUR = [911040037, 911170037]


def _load_json_verified(path, expected_sha256):
    data = path.read_bytes()
    actual = hashlib.sha256(data).hexdigest()
    assert actual == expected_sha256, f"{path} SHA-256 mismatch: {actual} != {expected_sha256}"
    return json.loads(data)


def _age_seconds(dags_keyrt_ut, reference_iso=AGE_REFERENCE_UTC):
    from datetime import datetime, timezone

    def parse(s):
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)

    return (parse(reference_iso) - parse(dags_keyrt_ut)).total_seconds()


def build_road_condition_footprint():
    faerd_results = {}
    for label, (path, sha) in LEGACY_FAERD_FILES.items():
        rows = _load_json_verified(path, sha)
        normalized = [(normalize_idbutur(r.get("IdButur")), r) for r in rows]
        bad = [r for idb, r in normalized if idb is None]
        assert not bad, f"{label}: {len(bad)} rows failed IdButur normalization"
        by_id = {}
        for idb, r in normalized:
            by_id.setdefault(idb, []).append(r)
        entry = {}
        for target in TARGET_IDBUTUR:
            matches = by_id.get(target, [])
            entry[target] = [
                {
                    "astandYfirbord": m.get("AstandYfirbord"),
                    "astandLysing": m.get("AstandLysing"),
                    "snjomokstursregla": m.get("Snjomokstursregla"),
                    "dagsKeyrtUt": m.get("DagsKeyrtUt"),
                    "age_seconds_from_reference": _age_seconds(m["DagsKeyrtUt"]) if m.get("DagsKeyrtUt") else None,
                }
                for m in matches
            ]
        faerd_results[label] = {"total_rows": len(rows), "by_target_idbutur": entry}

    faerdpunktar_results = {}
    for label, (path, sha) in LEGACY_FAERDPUNKTAR_FILES.items():
        rows = _load_json_verified(path, sha)
        normalized = [(normalize_idbutur(r.get("IdButur")), r) for r in rows]
        bad = [r for idb, r in normalized if idb is None]
        assert not bad, f"{label}: {len(bad)} rows failed IdButur normalization"
        counts = {}
        for target in TARGET_IDBUTUR:
            n = sum(1 for idb, _ in normalized if idb == target)
            counts[target] = {"notice_count": n, "has_notices": n > 0}
        faerdpunktar_results[label] = {"total_rows": len(rows), "by_target_idbutur": counts}

    # IDBUTUR -> IDFERILL/VEGNR footprint, from road-links.csv (ring) + wfs93-raw.json (road93).
    ring_links_path = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv"
    footprint = {idb: {"ring_pieces": [], "road93_pieces": []} for idb in TARGET_IDBUTUR}
    with open(ring_links_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            idb = int(row["idbutur"])
            if idb in footprint:
                footprint[idb]["ring_pieces"].append(int(row["idferill"]))
    wfs93 = json.loads((TASK_DIR / "samples/wfs93-raw.json").read_bytes())
    for feat in wfs93["features"]:
        p = feat["properties"]
        idb = p["IDBUTUR"]
        if idb in footprint:
            footprint[idb]["road93_pieces"].append(p["IDFERILL"])
    for idb in footprint:
        footprint[idb]["road93_pieces"] = sorted(set(footprint[idb]["road93_pieces"]))

    return {
        "age_reference_utc": AGE_REFERENCE_UTC,
        "faerd_condition_samples": faerd_results,
        "faerdpunktar_notice_samples": faerdpunktar_results,
        "idbutur_footprint": {str(k): v for k, v in footprint.items()},
        "retraction": "v1's 'NOT_AVAILABLE' claim is RETRACTED: both target IDBUTUR are present with real condition data in both legacy-faerd samples.",
    }


# ---------------------------------------------------------------------
# K2/S2/S2b/S6 -- Hagstofa row classification and year rule
# ---------------------------------------------------------------------

def classify_hagstofa_rows():
    rows = list(csv.DictReader(open(TASK_DIR / "samples/hagstofa_settlements_2023_2025.csv", encoding="utf-8")))
    for r in rows:
        if r["code"] == "0":
            r["row_type"] = "TOTAL"
        elif r["name"].startswith("Strjálbýli á"):
            r["row_type"] = "RURAL_AGGREGATE"
        else:
            r["row_type"] = "SETTLEMENT"

    settlement_rows = [r for r in rows if r["row_type"] == "SETTLEMENT"]
    assert len(settlement_rows) > 0

    brackets = {}
    for b in (200, 500, 1000):
        brackets[b] = sum(1 for r in settlement_rows if int(r["pop_2025"]) >= b)

    # Year-rule, two interpretations (dated addendum, see rules-addendum-v2.md).
    year_completeness = {}
    for year_col in ("pop_2023", "pop_2024", "pop_2025"):
        vals = [int(r[year_col]) for r in settlement_rows]
        n_nonnull = len(vals)  # none are actually null in this table
        n_nonzero = sum(1 for v in vals if v != 0)
        year_completeness[year_col] = {
            "interpretation_A_zero_is_valid_pct": 100.0 * n_nonnull / len(vals),
            "interpretation_B_zero_is_invalid_pct": 100.0 * n_nonzero / len(vals),
        }

    zero_2025 = [r["name"] for r in settlement_rows if int(r["pop_2025"]) == 0]

    total_row = next(r for r in rows if r["row_type"] == "TOTAL")
    sum_nontotal_2025 = sum(int(r["pop_2025"]) for r in rows if r["row_type"] != "TOTAL")
    unexplained_diff = sum_nontotal_2025 - int(total_row["pop_2025"])

    # Code 50 (Reykjavík) -- INCLUDED_IN_CODE_50_INFERRED candidates: names
    # with NO row anywhere in the 120-row table at all.
    all_names_lower = {r["name"].lower() for r in rows}
    candidate_municipalities = ["Kópavogur", "Hafnarfjörður", "Garðabær", "Seltjarnarnes", "Mosfellsbær"]
    code50_inferred = {m: (m.lower() not in all_names_lower) for m in candidate_municipalities}

    # Grindavík year-selection effect (K2d).
    grindavik = next((r for r in settlement_rows if r["name"] == "Grindavík"), None)

    return {
        "rows_with_type": rows,
        "settlement_count": len(settlement_rows),
        "brackets_2025": brackets,
        "comparison_targets_not_assert_targets": {"settlement_count_target": 111, "brackets_target": {"200": 67, "500": 42, "1000": 27}},
        "year_completeness_pct": year_completeness,
        "zero_value_2025_settlement_names": zero_2025,
        "sum_non_total_rows_2025": sum_nontotal_2025,
        "total_row_2025": int(total_row["pop_2025"]),
        "unexplained_difference": unexplained_diff,
        "unexplained_difference_inferred_cause": "independent per-row rounding of an 'average population' measure (INFERRED, not proven)",
        "code_50_included_inferred_candidates": code50_inferred,
        "grindavik_2023_2024_2025": [int(grindavik["pop_2023"]), int(grindavik["pop_2024"]), int(grindavik["pop_2025"])] if grindavik else None,
        "year_2025_finality_status": "NOT_DETERMINED (no provisional/finality field in metadata; metadata 'updated' timestamp 2024-03-17 predates 2025's own existence in the table)",
    }


# ---------------------------------------------------------------------
# K3/S3/P5 -- Egilsstaðir: two distinct points from chain-walks-v4.json
# ---------------------------------------------------------------------

def egilsstadir_nodes():
    chain_walks_path = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/chain-walks-v4.json"
    d = json.loads(chain_walks_path.read_bytes())
    steps = d["cw_long"]["steps"]
    piece_1436_len = d["cw_long"]["piece_1436_length_m"]

    cum = 0.0
    entry_cum = None  # cumulative INTO piece 2345 (before its own length is added) -- the junction node
    exit_cum = None  # cumulative at piece 2345's own exit -- phase-1's own node
    entry_coord = None
    exit_coord = None
    direction = None
    for s in steps:
        if s["idferill"] == 2345:
            entry_cum = cum + s["gap_into_m"]
            entry_coord = s["entry"]
            direction = s["direction"]
            exit_cum = entry_cum + s["piece_cost_m"]
            exit_coord = s["exit"]
        cum += s["gap_into_m"] + s["piece_cost_m"]

    assert entry_cum is not None, "piece 2345 not found in cw_long steps"

    # Cross-check against road-links.csv's own stored start/end for 2345.
    ring_links_path = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv"
    stored = None
    with open(ring_links_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["idferill"]) == 2345:
                stored = {"start": [float(row["start_x"]), float(row["start_y"])], "end": [float(row["end_x"]), float(row["end_y"])]}
    assert stored is not None

    def close(a, b, tol=0.1):
        return math.hypot(a[0] - b[0], a[1] - b[1]) <= tol

    # direction "rev" means entry=stored end, exit=stored start.
    if direction == "rev":
        assert close(entry_coord, stored["end"]), f"junction entry {entry_coord} != stored end {stored['end']}"
        assert close(exit_coord, stored["start"]), f"phase1 node exit {exit_coord} != stored start {stored['start']}"
    else:
        assert close(entry_coord, stored["start"])
        assert close(exit_coord, stored["end"])

    result = {
        "direction_in_cw_long": direction,
        "junction_node": {
            "description": "ring/road93 junction -- piece 2345's own stored END, the walk's own ENTRY point",
            "coord": entry_coord,
            "cum_km_incl_1436": round((entry_cum + piece_1436_len) / 1000, 4),
            "cum_km_excl_1436": round(entry_cum / 1000, 4),
        },
        "phase1_inventory_node": {
            "description": "phase-1's own recorded node -- piece 2345's own stored START, the walk's own EXIT point",
            "coord": exit_coord,
            "cum_km_incl_1436": round((exit_cum + piece_1436_len) / 1000, 4),
            "cum_km_excl_1436": round(exit_cum / 1000, 4),
        },
    }

    # Mutation tests that MUST fail.
    mutation_failures = []
    try:
        assert close(entry_coord, exit_coord)
        mutation_failures.append("ERROR: entry/exit coords should NOT be equal but mutation check passed")
    except AssertionError:
        pass  # expected: they are genuinely different points
    try:
        assert abs(entry_cum - exit_cum) < 1.0
        mutation_failures.append("ERROR: entry/exit cum should NOT be nearly equal but mutation check passed")
    except AssertionError:
        pass
    result["mutation_tests_all_correctly_distinguished"] = len(mutation_failures) == 0
    result["mutation_test_failures"] = mutation_failures
    return result


# ---------------------------------------------------------------------
# K4/S4 -- road-93 continuity (independent of validate_route) + reuse
# ---------------------------------------------------------------------

PHASE1_V4_SCRIPT_SHA256 = "a3fa0bd4891405081fa25a1087e409c21582006f0777f3f8fbe91a2246ab3ad8"


def _dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _planar_len(coords):
    return sum(_dist(coords[i][:2], coords[i + 1][:2]) for i in range(len(coords) - 1))


def load_road93_canonical():
    raw_bytes = (TASK_DIR / "samples/wfs93-raw.json").read_bytes()
    d = json.loads(raw_bytes)
    by_idferill = {}
    for f in d["features"]:
        by_idferill.setdefault(f["properties"]["IDFERILL"], []).append(f)
    canonical = {}
    for idf, copies in by_idferill.items():
        best = sorted(copies, key=lambda c: (-len(c["geometry"]["coordinates"]), c["properties"]["OBJECTID"]))[0]
        canonical[idf] = best
    return canonical


def continuity_check(order, canonical, gap_threshold=100.0):
    """Independent of validate_route: checks only inter-piece contact."""
    gaps = []
    for a, b in zip(order, order[1:]):
        ea = canonical[a]["geometry"]["coordinates"][-1][:2]
        sb = canonical[b]["geometry"]["coordinates"][0][:2]
        gaps.append(_dist(ea, sb))
    violations = [(order[i], order[i + 1], g) for i, g in enumerate(gaps) if g > gap_threshold]
    repeats = len(order) != len(set(order))
    return {"gaps": gaps, "violations": violations, "has_repeat": repeats, "passes": not violations and not repeats}


def import_validate_route():
    phase1_script = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/national_inventory_v4.py"
    actual_sha = hashlib.sha256(phase1_script.read_bytes()).hexdigest()
    assert actual_sha == PHASE1_V4_SCRIPT_SHA256, f"national_inventory_v4.py SHA-256 mismatch: {actual_sha}"
    import importlib.util

    spec = importlib.util.spec_from_file_location("national_inventory_v4", phase1_script)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.validate_route, mod.RouteInvalid


def road93_section():
    import random

    canonical = load_road93_canonical()
    order = [2344, 3410, 3409, 2894, 2892, 2891]  # derived from KAFLANR, cross-checked against coordinates below
    kaflanr_order = [canonical[i]["properties"]["KAFLANR"] for i in order]
    assert kaflanr_order == sorted(kaflanr_order), f"KAFLANR not monotonic for the stated order: {kaflanr_order}"

    cont = continuity_check(order, canonical)
    assert cont["passes"], f"canonical order fails continuity: {cont}"

    # Negative tests that MUST fail continuity.
    random.seed(42)
    neg_results = {}
    perm = order[:]
    random.shuffle(perm)
    neg_results["random_permutation"] = continuity_check(perm, canonical)
    neg_results["duplicated_piece"] = continuity_check(order[:3] + [order[1]] + order[3:], canonical)
    # Synthetic inserted gap: fabricate a fake "piece" far away.
    fake_id = -999
    fake_piece = {"geometry": {"coordinates": [[0.0, 0.0], [1.0, 1.0]]}, "properties": {"OBJECTID": 0, "KAFLANR": "zz"}}
    canonical_with_fake = dict(canonical)
    canonical_with_fake[fake_id] = fake_piece
    neg_results["inserted_gap_over_100m"] = continuity_check([order[0], fake_id] + order[1:], canonical_with_fake)

    for name, res in neg_results.items():
        assert not res["passes"], f"negative test {name} should FAIL continuity but passed: {res}"

    validate_route, RouteInvalid = import_validate_route()

    def steps_for(route_order, direction="fwd"):
        return [{"idferill": i, "veghluti": canonical[i]["properties"]["VEGHLUTI"], "direction": direction} for i in route_order]

    fwd_steps = steps_for(order)
    rev_steps = steps_for(list(reversed(order)))
    validate_route(fwd_steps, {i: {"veghluti": canonical[i]["properties"]["VEGHLUTI"]} for i in order})
    validate_route(rev_steps, {i: {"veghluti": canonical[i]["properties"]["VEGHLUTI"]} for i in order})

    # Negative test for validate_route itself: a duplicated piece.
    dup_steps = steps_for(order[:3] + [order[1]] + order[3:])
    validator_rejected_dup = False
    try:
        validate_route(dup_steps, {i: {"veghluti": canonical[i]["properties"]["VEGHLUTI"]} for i in order})
    except RouteInvalid:
        validator_rejected_dup = True
    assert validator_rejected_dup

    # Tier sensitivity.
    by_idferill_all_tiers = {}
    for f in json.loads((TASK_DIR / "samples/wfs93-raw.json").read_bytes())["features"]:
        by_idferill_all_tiers.setdefault(f["properties"]["IDFERILL"], {})[f["properties"]["NAKVAEMNIFERLIS"]] = f

    def length_for_tier(tier):
        total = 0.0
        for i, a_id in enumerate(order):
            coords = by_idferill_all_tiers[a_id][tier]["geometry"]["coordinates"]
            total += _planar_len(coords)
            if i > 0:
                prev_coords = by_idferill_all_tiers[order[i - 1]][tier]["geometry"]["coordinates"]
                total += _dist(prev_coords[-1][:2], coords[0][:2])
        return total

    len_tier_minus1 = length_for_tier(-1)
    len_tier_2 = length_for_tier(2)

    # Two route-length variants.
    junction_coord = canonical[order[0]]["geometry"]["coordinates"][0][:2]
    from_junction_km = len_tier_minus1 / 1000
    piece_2345_len_m = 927.0346
    from_phase1_node_km = (len_tier_minus1 + piece_2345_len_m) / 1000

    return {
        "canonical_order": order,
        "kaflanr_order": kaflanr_order,
        "continuity_canonical": cont,
        "negative_tests": {k: {"passes": v["passes"]} for k, v in neg_results.items()},
        "validate_route_source_sha256_verified": PHASE1_V4_SCRIPT_SHA256,
        "validate_route_accepts_fwd_and_rev": True,
        "validate_route_rejects_duplicate": validator_rejected_dup,
        "tier_sensitivity": {"tier_minus1_m": len_tier_minus1, "tier_2_m": len_tier_2, "pct_diff": round(100 * (len_tier_2 - len_tier_minus1) / len_tier_minus1, 2)},
        "route_length_variants_km": {
            "from_junction_node": round(from_junction_km, 4),
            "from_phase1_node_via_2345": round(from_phase1_node_km, 4),
        },
    }


# ---------------------------------------------------------------------
# K5/S5 -- work-list extraction, Hagstofa matching, weather-point proposals
# ---------------------------------------------------------------------

NATIONAL_PLACE_COVERAGE_PATH = REPO_ROOT / "docs/ai/tasks/ticket-493/national-place-coverage.md"
NATIONAL_PLACE_COVERAGE_SHA256 = "2777107e48eea09b083ea278da3cbda3be7a9557b722c0247a1fb8f96a64e35e"
EDITORIAL_SUFFIX = " og fleiri firðir eftir nákvæmri yfirferð tenginga"
EXCLUDED_NON_PLACES = {"Gatnamót tenginga við veg 1": "names a type of road-junction connection, not a settlement"}


def _nfc(s):
    return unicodedata.normalize("NFC", s.strip())


def extract_work_list():
    raw = NATIONAL_PLACE_COVERAGE_PATH.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == NATIONAL_PLACE_COVERAGE_SHA256
    text = raw.decode("utf-8")

    rows = []
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
                rows.append({"region": cols[0], "col2_ring": cols[1], "col3_tengivegur": cols[2]})

    raw_entries = []  # (region, source_col, raw_cell_text)
    for r in rows:
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

    # Merge duplicate names (e.g. Stöðvarfjörður appears in both columns of Austurland)
    # into one row carrying every source reference -- nothing silently dropped.
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


def _candidate_hagstofa_names(work_list_name, hagstofa_names):
    out = []
    for hname in hagstofa_names:
        if hname == work_list_name or hname.startswith(work_list_name + ",") or hname.startswith(work_list_name + " "):
            out.append(hname)
    return out


def match_work_list_to_hagstofa(work_list, hagstofa_rows):
    name_to_code = {r["name"]: r["code"] for r in hagstofa_rows if r["row_type"] != "TOTAL"}
    hagstofa_names = list(name_to_code.keys())

    results = []
    for row in work_list["rows"]:
        candidates = _candidate_hagstofa_names(row["name"], hagstofa_names)
        if len(candidates) == 1:
            status = "MATCHED"
        elif len(candidates) > 1:
            status = "AMBIGUOUS"
        else:
            status = "UNMATCHED"
        results.append({
            "work_list_name": row["name"],
            "sources": row["sources"],
            "status": status,
            "candidates": [{"name": c, "code": name_to_code[c]} for c in candidates],
        })

    assert len(results) == work_list["output_row_count_after_merge"], "one result per work-list row required"
    return results


def road93_weather_point_proposals(canonical, order, n_points=4):
    """Points placed at even fractions along the tier -1 polyline. Proposal
    only -- no elevation/terrain/weather claim; final selection is the
    owner's."""
    segments = []  # (piece_idferill, idbutur, start_cum_m, end_cum_m, coords)
    cum = 0.0
    wfs93 = json.loads((TASK_DIR / "samples/wfs93-raw.json").read_bytes())
    idbutur_by_idferill = {}
    for f in wfs93["features"]:
        p = f["properties"]
        if p["NAKVAEMNIFERLIS"] == -1:
            idbutur_by_idferill[p["IDFERILL"]] = p["IDBUTUR"]

    for piece_id in order:
        coords = canonical[piece_id]["geometry"]["coordinates"]
        seg_len = _planar_len(coords)
        segments.append({"piece": piece_id, "idbutur": idbutur_by_idferill[piece_id], "start_m": cum, "end_m": cum + seg_len, "coords": coords})
        cum += seg_len
    total_m = cum

    def interpolate(target_m):
        for seg in segments:
            if seg["start_m"] - 1e-6 <= target_m <= seg["end_m"] + 1e-6:
                local = target_m - seg["start_m"]
                remaining = local
                coords = seg["coords"]
                for i in range(len(coords) - 1):
                    a, b = coords[i][:2], coords[i + 1][:2]
                    d = _dist(a, b)
                    if remaining <= d or i == len(coords) - 2:
                        if d == 0:
                            frac = 0.0
                        else:
                            frac = min(remaining / d, 1.0)
                        x = a[0] + (b[0] - a[0]) * frac
                        y = a[1] + (b[1] - a[1]) * frac
                        return {"coord": [round(x, 4), round(y, 4)], "piece": seg["piece"], "idbutur": seg["idbutur"], "distance_from_junction_m": round(target_m, 1)}
                    remaining -= d
        raise AssertionError(f"target_m {target_m} outside total_m {total_m}")

    points = []
    for i in range(n_points):
        frac = i / (n_points - 1)
        points.append(interpolate(frac * total_m))

    return {
        "basis": "tier -1 (canonical, most-vertices) polyline, linear interpolation only -- no elevation/terrain/weather claim",
        "total_length_m": round(total_m, 1),
        "points": points,
        "note": "point selection remains an owner decision; this is a proposal",
    }


if __name__ == "__main__":
    import sys

    forbidden = {"socket", "http", "urllib", "requests", "ssl"}
    src = Path(__file__).read_text(encoding="utf-8")
    used = {m for m in forbidden if re.search(rf"^\s*(import {m}\b|from {m}\b)", src, re.MULTILINE)}
    assert not used, f"forbidden network-capable import(s) found: {used}"
    print("static import check: PASS (no socket/http/urllib/requests/ssl import)")

    footprint = build_road_condition_footprint()
    with open(TASK_DIR / "samples/road_condition_footprint-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(footprint, f, ensure_ascii=False, indent=1)
        f.write("\n")

    classification = classify_hagstofa_rows()
    with open(TASK_DIR / "samples/hagstofa_classification-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(classification, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("settlement_count:", classification["settlement_count"], "vs target 111")
    print("brackets:", classification["brackets_2025"], "vs target 67/42/27")
    print("year completeness:", classification["year_completeness_pct"])
    print("zero-value 2025 settlements:", classification["zero_value_2025_settlement_names"])
    print("unexplained diff:", classification["unexplained_difference"])
    print("code50 inferred candidates:", classification["code_50_included_inferred_candidates"])
    print("grindavik:", classification["grindavik_2023_2024_2025"])

    eg = egilsstadir_nodes()
    with open(TASK_DIR / "samples/egilsstadir_nodes-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(eg, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(json.dumps(eg, ensure_ascii=False, indent=1))

    road93 = road93_section()
    with open(TASK_DIR / "samples/road93_section-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(road93, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("road93 tier sensitivity:", road93["tier_sensitivity"])
    print("road93 length variants (km):", road93["route_length_variants_km"])
    print("road93 negative tests (all must be passes=False):", road93["negative_tests"])

    work_list = extract_work_list()
    match_results = match_work_list_to_hagstofa(work_list, classification["rows_with_type"])
    canonical93 = load_road93_canonical()
    weather_points = road93_weather_point_proposals(canonical93, road93["canonical_order"])
    s5_output = {
        "work_list_extraction": work_list,
        "hagstofa_matching": match_results,
        "weather_point_proposals": weather_points,
    }
    with open(TASK_DIR / "samples/worklist_and_weatherpoints-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(s5_output, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("work-list input_cell_count:", work_list["input_cell_count"], "-> output rows:", work_list["output_row_count_after_merge"])
    status_counts = {}
    for r in match_results:
        status_counts[r["status"]] = status_counts.get(r["status"], 0) + 1
    print("match status counts:", status_counts)
    print("weather points total_length_m:", weather_points["total_length_m"])
