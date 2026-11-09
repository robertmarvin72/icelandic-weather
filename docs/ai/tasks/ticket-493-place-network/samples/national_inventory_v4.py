#!/usr/bin/env python3
"""
#493 place-network, phase 1 CORRECTION round v4 (approved-prompt-v4.md,
T1-T5/Q1-Q7). Builds on v3's directed-instance graph, fixing:
  - T3: VEGHLUTI=8 is piece 36487 (not 1735, which is VEGHLUTI=1) --
    asserted from road-links.csv, one-directional per Ripley's decision.
  - Q1: a single lexicographic tie-break signature (cost bucketed by
    1e-6 m epsilon, piece count, IDFERILL sequence, orientation
    sequence), used as both the priority-queue key and the relaxation
    comparison -- not a bare scalar `nd < dist`.
  - Q2/T1: a real validate_route() that RAISES on any violation, run on
    the actual produced paths AND four constructed negative test cases,
    BEFORE any output file is written.
  - Q3/T4: the Selfoss closure target is the specific instance
    (2138, "rev"), not next() over an unfiltered IDBUTUR match.
  - Q4/T4: the two Borgarnes roundabout seam gaps are read from
    north-data's own retained JSON (unrounded_gap_from_prev_m), not
    hardcoded.
  - Q5/T5: the north-data leg's canonical-basis length is computed and
    compared against its own JSON-stated basis.

No network access. Deterministic, reproducible from a clean tree.
"""
import csv
import hashlib
import heapq
import json
import math
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent
NORTH_DATA_JSON = OUT_DIR.parent.parent / "ticket-493-north-data" / "route-data-candidate.json"

REFERENCE_483_IDBUTUR = [
    1410010037, 903010037, 253020037, 252090037, 902030037, 902040037,
    901130037, 901230037, 901220037, 901210037, 901050037, 901040037,
    801100037,
]
REFERENCE_491_IDS = [
    1477, 1431, 42243, 49926, 9923, 9925, 9927, 10242, 2796, 10247,
    2488, 2532, 30721, 49281, 49285, 3025, 3023, 56002, 3796, 3794,
    3802, 3740, 3741, 47042, 3756, 3757, 3758, 2876, 2819,
]
SELFOSS_ROUTE_IDS = [1436, 1735, 2071, 2024, 2117, 2135, 2138]
SELFOSS_EXPECTED_IDBUTUR = {252090037, 253020037, 902030037, 903010037, 1410010037}
SELFOSS_EXPECTED_COST_INCL_1436 = 45740.46
SELFOSS_EXPECTED_COST_EXCL_1436 = 43180.3
SELFOSS_EXPECTED_EXIT_COORD = (401739.850, 383119.047)

BANNED_PAIR = {6, 7}
EXCLUDED_IDFERILL = {2982}
GAP_THRESHOLD = 100.0
COST_EPS = 1e-6


def load_pieces():
    pieces = {}
    with open(OUT_DIR / "road-links.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            idferill = int(row["idferill"])
            pieces[idferill] = {
                "idferill": idferill,
                "idbutur": int(row["idbutur"]),
                "veghluti": int(row["veghluti"]),
                "name": row["name"],
                "start": (float(row["start_x"]), float(row["start_y"])),
                "end": (float(row["end_x"]), float(row["end_y"])),
                "length_planar_m": float(row["length_planar_m"]),
            }
    return pieces


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


# T3/Q7 -- asserted from road-links.csv, not assumed.
def assert_role8_identity(pieces):
    role8 = [i for i, p in pieces.items() if p["veghluti"] == 8]
    assert role8 == [36487], f"expected the single VEGHLUTI=8 instance to be [36487], got {role8}"
    assert pieces[1735]["veghluti"] == 1, f"expected piece 1735 to be VEGHLUTI=1, got {pieces[1735]['veghluti']}"


def build_instances(pieces, exclude_idferill=()):
    """(idferill, direction) -> {entry, exit, cost, veghluti}."""
    instances = {}
    for idferill, pc in pieces.items():
        if idferill in exclude_idferill:
            continue
        v = pc["veghluti"]
        if v == 1:  # INFERRED bidirectional
            instances[(idferill, "fwd")] = {"entry": pc["start"], "exit": pc["end"], "cost": pc["length_planar_m"], "veghluti": v}
            instances[(idferill, "rev")] = {"entry": pc["end"], "exit": pc["start"], "cost": pc["length_planar_m"], "veghluti": v}
        elif v == 5:  # roundabout pass-through, zero length
            instances[(idferill, "fwd")] = {"entry": pc["start"], "exit": pc["end"], "cost": 0.0, "veghluti": v}
            instances[(idferill, "rev")] = {"entry": pc["end"], "exit": pc["start"], "cost": 0.0, "veghluti": v}
        else:  # 3, 4, 6, 7, 8 -- one-directional, start->end ONLY (T3: 8 included here, correctly identified as 36487)
            instances[(idferill, "fwd")] = {"entry": pc["start"], "exit": pc["end"], "cost": pc["length_planar_m"], "veghluti": v}
    return instances


def build_adjacency(instances, gap_threshold=GAP_THRESHOLD):
    adj = {k: [] for k in instances}
    keys = list(instances.keys())
    for k1 in keys:
        i1 = instances[k1]
        for k2 in keys:
            if k2[0] == k1[0]:
                continue
            i2 = instances[k2]
            if {i1["veghluti"], i2["veghluti"]} == BANNED_PAIR:
                continue
            g = dist(i1["exit"], i2["entry"])
            if g <= gap_threshold:
                adj[k1].append((k2, g))
    return adj


def sig_key(cost, idferill_tuple, orientation_tuple):
    """Q1's own single lexicographic signature: (cost bucketed by 1e-6 m
    epsilon, piece count, IDFERILL sequence, orientation sequence)."""
    return (round(cost / COST_EPS), len(idferill_tuple), idferill_tuple, orientation_tuple)


def dijkstra_lex(instances, adj, start_coord, target_key, gap_threshold=GAP_THRESHOLD):
    """Dijkstra using the Q1 lexicographic signature as BOTH the
    priority-queue key and the relaxation comparison -- not a bare
    scalar `nd < dist`."""
    best_sig = {}
    best_cost = {}
    prev = {}
    prev_gap = {}
    pq = []
    for k, inst in instances.items():
        g = dist(start_coord, inst["entry"])
        if g <= gap_threshold:
            cost = g + inst["cost"]
            sig = sig_key(cost, (k[0],), (k[1],))
            if k not in best_sig or sig < best_sig[k]:
                best_sig[k] = sig
                best_cost[k] = cost
                prev[k] = None
                prev_gap[k] = g
                heapq.heappush(pq, (sig, k))
    visited = set()
    tie_log = []  # (node, old_sig, new_sig, rejected_or_accepted) -- for Q1's own demo test
    while pq:
        sig, k = heapq.heappop(pq)
        if k in visited:
            continue
        if sig != best_sig[k]:
            continue  # stale entry, superseded by a better signature
        visited.add(k)
        if k == target_key:
            break
        cost_here = best_cost[k]
        idferill_here = best_sig[k][2]
        orient_here = best_sig[k][3]
        for nxt, gap in adj[k]:
            new_cost = cost_here + gap + instances[nxt]["cost"]
            new_idf = idferill_here + (nxt[0],)
            new_orient = orient_here + (nxt[1],)
            new_sig = sig_key(new_cost, new_idf, new_orient)
            old_sig = best_sig.get(nxt)
            if old_sig is None or new_sig < old_sig:
                if old_sig is not None and old_sig[0] == new_sig[0]:
                    tie_log.append({"node": nxt, "old_sig_cost_bucket": old_sig[0], "replaced": True})
                best_sig[nxt] = new_sig
                best_cost[nxt] = new_cost
                prev[nxt] = k
                prev_gap[nxt] = gap
                heapq.heappush(pq, (new_sig, nxt))
            elif old_sig[0] == new_sig[0]:
                tie_log.append({"node": nxt, "old_sig_cost_bucket": old_sig[0], "replaced": False})
    if target_key not in visited:
        return None, None, None, tie_log
    path = []
    k = target_key
    while k is not None:
        path.append(k)
        k = prev.get(k)
    path.reverse()
    return best_cost[target_key], path, prev_gap, tie_log


def path_detail(pieces, instances, path, prev_gap):
    steps = []
    for k in path:
        idferill, direction = k
        pc = pieces[idferill]
        inst = instances[k]
        steps.append(
            {
                "idferill": idferill,
                "idbutur": pc["idbutur"],
                "name": pc["name"],
                "veghluti": pc["veghluti"],
                "direction": direction,
                "entry": list(inst["entry"]),
                "exit": list(inst["exit"]),
                "piece_cost_m": inst["cost"],
                "gap_into_m": prev_gap.get(k, 0.0),
            }
        )
    return steps


def band_for(d):
    if d == 0.0:
        return "exact"
    if d <= 5.0:
        return "contact_5m"
    if d <= 25.0:
        return "contact_25m"
    if d <= 100.0:
        return "contact_100m"
    return "gap"


def bridge_summary(steps, extra_gaps_m=()):
    gaps = [s["gap_into_m"] for s in steps if s["gap_into_m"] > 0.0]
    gaps.extend(extra_gaps_m)
    bands = {}
    for g in gaps:
        b = band_for(g)
        bands[b] = bands.get(b, 0) + 1
    return {
        "nonzero_count": len(gaps),
        "bands": bands,
        "highest_m": max(gaps) if gaps else 0.0,
        "all_gaps_m": sorted(gaps),
    }


# ---------------------------------------------------------------------
# Q2/T1 -- the one validator, run on real paths AND constructed negative
# cases, BEFORE any output file is written.
# ---------------------------------------------------------------------
class RouteInvalid(Exception):
    pass


def validate_route(steps, pieces, one_directional_veghluti=(3, 4, 6, 7, 8)):
    """Raises RouteInvalid on the first violation found. `steps` is a
    list of dicts with at least idferill/veghluti/direction."""
    seen = set()
    for i, s in enumerate(steps):
        if s["idferill"] in seen:
            raise RouteInvalid(f"repeated IDFERILL {s['idferill']} at step {i}")
        seen.add(s["idferill"])
        if s["veghluti"] in one_directional_veghluti and s["direction"] == "rev":
            raise RouteInvalid(f"one-directional piece {s['idferill']} (VEGHLUTI={s['veghluti']}) traversed 'rev' at step {i}")
    for a, b in zip(steps, steps[1:]):
        if {a["veghluti"], b["veghluti"]} == BANNED_PAIR:
            raise RouteInvalid(f"adjacent 6/7 pair {a['idferill']}->{b['idferill']}")
        if a["idferill"] == 49282 and b["idferill"] == 49281:
            raise RouteInvalid("named U-turn 49282->49281")
    return True


def run_negative_tests(pieces):
    """Each of these four constructed cases MUST be rejected by
    validate_route -- a non-vacuity check on the validator itself."""
    results = {}

    # (a) 54723 (veghluti 7) and 1477 (veghluti 6) traversed 'rev'.
    bad_a = [
        {"idferill": 54723, "veghluti": pieces[54723]["veghluti"], "direction": "rev"},
        {"idferill": 1477, "veghluti": pieces[1477]["veghluti"], "direction": "rev"},
    ]
    try:
        validate_route(bad_a, pieces)
        results["a_54723_1477_rev"] = "NOT REJECTED -- VALIDATOR BUG"
    except RouteInvalid as e:
        results["a_54723_1477_rev"] = f"rejected: {e}"

    # (b) a synthetic adjacent 6/7 pair.
    six = next(i for i, p in pieces.items() if p["veghluti"] == 6)
    seven = next(i for i, p in pieces.items() if p["veghluti"] == 7)
    bad_b = [
        {"idferill": six, "veghluti": 6, "direction": "fwd"},
        {"idferill": seven, "veghluti": 7, "direction": "fwd"},
    ]
    try:
        validate_route(bad_b, pieces)
        results["b_adjacent_6_7"] = "NOT REJECTED -- VALIDATOR BUG"
    except RouteInvalid as e:
        results["b_adjacent_6_7"] = f"rejected: {e}"

    # (c) the named U-turn 49282 -> 49281.
    bad_c = [
        {"idferill": 49282, "veghluti": pieces[49282]["veghluti"], "direction": "fwd"},
        {"idferill": 49281, "veghluti": pieces[49281]["veghluti"], "direction": "fwd"},
    ]
    try:
        validate_route(bad_c, pieces)
        results["c_49282_49281"] = "NOT REJECTED -- VALIDATOR BUG"
    except RouteInvalid as e:
        results["c_49282_49281"] = f"rejected: {e}"

    # (d) a repeated piece.
    bad_d = [
        {"idferill": 2138, "veghluti": 1, "direction": "fwd"},
        {"idferill": 8676, "veghluti": pieces.get(8676, {"veghluti": 1})["veghluti"], "direction": "fwd"},
        {"idferill": 2138, "veghluti": 1, "direction": "rev"},
    ]
    try:
        validate_route(bad_d, pieces)
        results["d_repeated_piece"] = "NOT REJECTED -- VALIDATOR BUG"
    except RouteInvalid as e:
        results["d_repeated_piece"] = f"rejected: {e}"

    return results


def load_north_data_gaps():
    data = NORTH_DATA_JSON.read_bytes()
    sha256 = hashlib.sha256(data).hexdigest()
    d = json.loads(data)
    gaps = {}
    for p in d["chain_pieces"]:
        if p["idferill"] in (30401, 2816):
            gaps[p["idferill"]] = p["unrounded_gap_from_prev_m"]
    assert set(gaps) == {30401, 2816}, f"expected gaps for 30401 and 2816, got {gaps}"
    return gaps, str(NORTH_DATA_JSON), sha256


def canonical_north_leg(pieces):
    """Q5 -- every piece in north-data's own chain strictly after 2819 up
    to and including 2940, excluding the ring 30401, summed from THIS
    round's own road-links.csv, plus the two seam gaps."""
    ids = [
        2816, 2800, 2775, 2753, 3103, 3406, 3407, 3408, 2243, 1481, 3828,
        3827, 3826, 3825, 3584, 3570, 52490, 3569, 2594, 2593, 3221, 2423,
        2456, 2478, 3237, 3238, 2477, 2734, 2733, 2736, 2718, 3233, 3258,
        3275, 3016, 3015, 2995, 2940,
    ]
    piece_sum_m = sum(pieces[i]["length_planar_m"] for i in ids)
    return piece_sum_m, ids


def main():
    pieces = load_pieces()
    assert_role8_identity(pieces)

    instances = build_instances(pieces, exclude_idferill=EXCLUDED_IDFERILL)
    adj = build_adjacency(instances)

    # --- CCW (short way): Rauðavatn (end of 1436) -> exit of 2819 (fwd) ---
    start_ccw = pieces[1436]["end"]
    target_ccw = (2819, "fwd")
    ccw_cost, ccw_path, ccw_gap, ccw_ties = dijkstra_lex(instances, adj, start_ccw, target_ccw)
    ccw_steps = path_detail(pieces, instances, ccw_path, ccw_gap) if ccw_path else None
    ccw_ids = [s["idferill"] for s in ccw_steps] if ccw_steps else []

    # --- CW (long way): Rauðavatn (end of 1436, traversing 1436 itself
    #     in reverse as the first step) -> exit of (3876, rev) = C,
    #     excluding every #491 short-route piece to force the other side.
    start_cw = pieces[1436]["end"]
    target_cw = (3876, "rev")
    cw_exclude = set(REFERENCE_491_IDS)
    cw_instances = build_instances(pieces, exclude_idferill=EXCLUDED_IDFERILL | cw_exclude)
    cw_adj = build_adjacency(cw_instances)
    cw_cost, cw_path, cw_gap, cw_ties = dijkstra_lex(cw_instances, cw_adj, start_cw, target_cw)
    cw_steps = path_detail(pieces, cw_instances, cw_path, cw_gap) if cw_path else None
    cw_ids = [s["idferill"] for s in cw_steps] if cw_steps else []
    cw_idbutur_order = []
    for i in cw_ids:
        ib = pieces[i]["idbutur"]
        if not cw_idbutur_order or cw_idbutur_order[-1] != ib:
            cw_idbutur_order.append(ib)

    # --- Q3: Selfoss closure target, named precisely: (2138, "rev") ---
    selfoss_target = (2138, "rev")
    sel_cost, sel_path, sel_gap, sel_ties = dijkstra_lex(instances, adj, start_cw, selfoss_target)
    sel_steps = path_detail(pieces, instances, sel_path, sel_gap) if sel_path else None
    sel_ids = [s["idferill"] for s in sel_steps] if sel_steps else []
    sel_idbutur_set = {s["idbutur"] for s in sel_steps} if sel_steps else set()
    sel_exit_coord = tuple(instances[selfoss_target]["exit"])

    # ---------------------------------------------------------------
    # Q2/T1 -- validate EVERYTHING before writing any output file.
    # ---------------------------------------------------------------
    negative_results = run_negative_tests(pieces)
    for key, outcome in negative_results.items():
        if "NOT REJECTED" in outcome:
            raise RouteInvalid(f"validator non-vacuity check failed for case {key}: {outcome}")

    validation_errors = []
    try:
        validate_route(ccw_steps, pieces)
    except RouteInvalid as e:
        validation_errors.append(f"ccw: {e}")
    try:
        validate_route(cw_steps, pieces)
    except RouteInvalid as e:
        validation_errors.append(f"cw: {e}")
    try:
        validate_route(sel_steps, pieces)
    except RouteInvalid as e:
        validation_errors.append(f"selfoss: {e}")

    if ccw_ids != REFERENCE_491_IDS:
        validation_errors.append(f"ccw does not match #491 reference: {ccw_ids}")
    if cw_idbutur_order[:13] != REFERENCE_483_IDBUTUR:
        validation_errors.append(f"cw first-13-idbutur does not match #483 reference: {cw_idbutur_order[:13]}")
    if sel_ids != SELFOSS_ROUTE_IDS:
        validation_errors.append(f"selfoss route does not match expected: {sel_ids}")
    if sel_idbutur_set != SELFOSS_EXPECTED_IDBUTUR:
        validation_errors.append(f"selfoss idbutur set mismatch: {sel_idbutur_set}")
    if abs(sel_cost - SELFOSS_EXPECTED_COST_INCL_1436) > 0.5:
        validation_errors.append(f"selfoss cost mismatch: {sel_cost} vs expected {SELFOSS_EXPECTED_COST_INCL_1436}")
    if dist(sel_exit_coord, SELFOSS_EXPECTED_EXIT_COORD) > 1.0:
        validation_errors.append(f"selfoss exit coord mismatch: {sel_exit_coord} vs expected {SELFOSS_EXPECTED_EXIT_COORD}")

    c_coord_expected = (540259.2615, 577843.7582)
    c_coord_actual = tuple(instances[(3876, "rev")]["exit"]) if (3876, "rev") in instances else None
    if c_coord_actual is None or dist(c_coord_actual, c_coord_expected) > 0.5:
        validation_errors.append(f"C coordinate mismatch: {c_coord_actual} vs expected {c_coord_expected}")

    if validation_errors:
        print("VALIDATION FAILED -- BLOCKED_WITH_EXACT_GAPS:")
        for e in validation_errors:
            print(" -", e)
        print("No output file written.")
        return

    # ---------------------------------------------------------------
    # Q1 -- demonstrate the tie-break choice explicitly.
    # ---------------------------------------------------------------
    tie_demo = {
        "ccw_chose_direct_2796_10247_not_via_2791": 2791 not in ccw_ids,
        "ccw_chose_without_49284_detour": 49284 not in ccw_ids,
        "cw_tie_events_logged": len(cw_ties),
        "ccw_tie_events_logged": len(ccw_ties),
    }

    # ---------------------------------------------------------------
    # Q4 -- Borgarnes roundabout seams, read from north-data's own JSON.
    # ---------------------------------------------------------------
    nd_gaps, nd_path, nd_sha256 = load_north_data_gaps()
    borgarnes_seams_m = [nd_gaps[30401], nd_gaps[2816]]

    hella_idx = next((i for i, s in enumerate(cw_steps) if s["idferill"] == 3591), None)
    hella_summary = bridge_summary(cw_steps[: hella_idx + 1]) if hella_idx is not None else None
    long_to_c_summary = bridge_summary(cw_steps)
    short_491_only_summary = bridge_summary(ccw_steps)
    short_full_to_c_summary = bridge_summary(ccw_steps, extra_gaps_m=borgarnes_seams_m)
    assert short_491_only_summary["nonzero_count"] == 16, short_491_only_summary["nonzero_count"]
    assert short_full_to_c_summary["nonzero_count"] == 18, short_full_to_c_summary["nonzero_count"]
    assert short_full_to_c_summary["nonzero_count"] == short_491_only_summary["nonzero_count"] + 2

    # ---------------------------------------------------------------
    # Q5 -- canonical basis for the north-data leg.
    # ---------------------------------------------------------------
    nd_canonical_piece_sum_m, nd_canonical_ids = canonical_north_leg(pieces)
    nd_canonical_total_m = nd_canonical_piece_sum_m + sum(borgarnes_seams_m)
    nd_json_stated_km = 309.6507

    piece_1436_len = pieces[1436]["length_planar_m"]

    result = {
        "role8_check": {"single_veghluti8_instance": 36487, "piece_1735_veghluti": pieces[1735]["veghluti"]},
        "negative_tests": negative_results,
        "ccw_short": {
            "total_cost_m": ccw_cost,
            "matches_491_reference_29": ccw_ids == REFERENCE_491_IDS,
            "steps": ccw_steps,
            "bridge_summary_491_only": short_491_only_summary,
            "bridge_summary_full_with_roundabout_seams": short_full_to_c_summary,
        },
        "cw_long": {
            "total_cost_m_incl_1436": cw_cost,
            "total_cost_m_excl_1436": cw_cost - piece_1436_len if cw_cost is not None else None,
            "piece_1436_length_m": piece_1436_len,
            "matches_483_reference_first13_idbutur": cw_idbutur_order[:13] == REFERENCE_483_IDBUTUR,
            "steps": cw_steps,
            "bridge_summary_to_hella": hella_summary,
            "bridge_summary_to_c": long_to_c_summary,
        },
        "selfoss_closure_target": {
            "instance": list(selfoss_target),
            "exit_coord": list(sel_exit_coord),
            "cost_m_incl_1436": sel_cost,
            "cost_m_excl_1436": sel_cost - piece_1436_len,
            "route_ids": sel_ids,
            "route_idbutur_set": sorted(sel_idbutur_set),
            "steps": sel_steps,
        },
        "closure_test": {
            "closure_set_real": sorted({252090037, 902020037}),
            "closure_set_unrelated_nonvacuity": sorted({810040037}),
            "closed_with_real_closure_set": bool(sel_idbutur_set & {252090037, 902020037}),
            "closed_with_unrelated_set": bool(sel_idbutur_set & {810040037}),
        },
        "borgarnes_seams": {
            "source_path": nd_path,
            "source_sha256": nd_sha256,
            "gap_30401_m_unrounded": nd_gaps[30401],
            "gap_2816_m_unrounded": nd_gaps[2816],
        },
        "north_data_leg_length": {
            "canonical_piece_sum_m": nd_canonical_piece_sum_m,
            "canonical_total_m_incl_seams": nd_canonical_total_m,
            "canonical_total_km": nd_canonical_total_m / 1000,
            "json_stated_km": nd_json_stated_km,
            "difference_km": nd_canonical_total_m / 1000 - nd_json_stated_km,
        },
        "tie_break_demo": tie_demo,
    }

    with open(OUT_DIR / "chain-walks-v4.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(OUT_DIR / "bridge-summary-v4.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(
            {
                "hella": hella_summary,
                "long_to_c": long_to_c_summary,
                "short_491_only": short_491_only_summary,
                "short_full_with_roundabout_seams": short_full_to_c_summary,
            },
            f,
            ensure_ascii=False,
            indent=1,
        )
        f.write("\n")

    print("=== Validation ===")
    print("role8 check: single VEGHLUTI=8 instance is 36487?", True, "piece 1735 veghluti:", pieces[1735]["veghluti"])
    print("negative tests (all must be 'rejected: ...'):")
    for k, v in negative_results.items():
        print("  ", k, "->", v)
    print("Positive validation errors:", validation_errors or "NONE")
    print()
    print("=== CCW (short) ===")
    print("matches #491 29-piece reference exactly?", ccw_ids == REFERENCE_491_IDS)
    print("total cost (m):", ccw_cost)
    print("bridge summary (#491-only, to 2819):", short_491_only_summary)
    print("bridge summary (full, with roundabout seams, to C):", short_full_to_c_summary)
    print("tie-break demo:", tie_demo)
    print()
    print("=== CW (long) ===")
    print("matches #483 13-IDBUTUR reference (first 13)?", cw_idbutur_order[:13] == REFERENCE_483_IDBUTUR)
    print("total cost incl 1436 (m):", cw_cost, "excl:", cw_cost - piece_1436_len)
    print("bridge summary to Hella (3591):", hella_summary)
    print("bridge summary to C (3876):", long_to_c_summary)
    print()
    print("=== Selfoss closure target (Q3) ===")
    print("instance:", selfoss_target, "exit coord:", sel_exit_coord)
    print("cost incl 1436:", sel_cost, "excl:", sel_cost - piece_1436_len)
    print("route:", sel_ids, "idbutur:", sorted(sel_idbutur_set))
    print()
    print("=== Borgarnes seams (Q4) ===")
    print("source:", nd_path, "sha256:", nd_sha256)
    print("gaps (unrounded m):", nd_gaps)
    print()
    print("=== North-data leg length basis (Q5) ===")
    print("canonical piece sum (m):", nd_canonical_piece_sum_m, "+ seams =", nd_canonical_total_m, "m =", nd_canonical_total_m / 1000, "km")
    print("json-stated (km):", nd_json_stated_km, "difference (km):", nd_canonical_total_m / 1000 - nd_json_stated_km)
    print()
    print("=== Closure test (route-level) ===")
    print("CLOSED with real closure set?", bool(sel_idbutur_set & {252090037, 902020037}), "(expect True)")
    print("CLOSED with unrelated set (non-vacuity)?", bool(sel_idbutur_set & {810040037}), "(expect False)")


if __name__ == "__main__":
    main()
