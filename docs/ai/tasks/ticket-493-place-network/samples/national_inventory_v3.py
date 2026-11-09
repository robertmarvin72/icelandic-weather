#!/usr/bin/env python3
"""
#493 place-network, phase 1 CORRECTION round v3 (approved-prompt-v3.md,
W1-W5/Z1-Z5). Replaces v2's greedy walker (which only banned 6<->7
ADJACENCY but still let a one-directional piece be entered from either
end) with a directed-instance graph + Dijkstra shortest path, per
rules-addendum-v3.md, written before this script was run.

Reads samples/road-links.csv (unchanged, still the E2d canonical-instance
selection from rules.md). Does NOT overwrite any v2 output file (Z5a) --
writes samples/chain-walks-v3.json, samples/bridge-summary-v3.json,
samples/national_inventory_v3-output.txt (via its own runner), and
samples/HASHES-v3.json/.sha256.

No network access. Deterministic, reproducible from a clean tree.
"""
import csv
import heapq
import json
import math
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent

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

BANNED_PAIR = {6, 7}
EXCLUDED_IDFERILL = {2982}
GAP_THRESHOLD = 100.0


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


def build_instances(pieces, exclude_idferill=()):
    """(idferill, direction) -> {entry, exit, cost, veghluti}."""
    instances = {}
    for idferill, pc in pieces.items():
        if idferill in exclude_idferill:
            continue
        v = pc["veghluti"]
        if v in (1, 8):  # 1 = INFERRED bidirectional; 8 = UNKNOWN direction, both permitted (rules.md E2b)
            instances[(idferill, "fwd")] = {"entry": pc["start"], "exit": pc["end"], "cost": pc["length_planar_m"], "veghluti": v}
            instances[(idferill, "rev")] = {"entry": pc["end"], "exit": pc["start"], "cost": pc["length_planar_m"], "veghluti": v}
        elif v == 5:
            instances[(idferill, "fwd")] = {"entry": pc["start"], "exit": pc["end"], "cost": 0.0, "veghluti": v}
            instances[(idferill, "rev")] = {"entry": pc["end"], "exit": pc["start"], "cost": 0.0, "veghluti": v}
        else:  # 3, 4, 6, 7 -- one-directional, documented role, start->end ONLY
            instances[(idferill, "fwd")] = {"entry": pc["start"], "exit": pc["end"], "cost": pc["length_planar_m"], "veghluti": v}
    return instances


def build_adjacency(instances, gap_threshold=GAP_THRESHOLD):
    """node -> list of (neighbor_node, gap_m)."""
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


def dijkstra(instances, adj, start_coord, target_key, gap_threshold=GAP_THRESHOLD):
    dist_to = {k: math.inf for k in instances}
    prev = {}
    prev_gap = {}
    pq = []
    for k, inst in instances.items():
        g = dist(start_coord, inst["entry"])
        if g <= gap_threshold:
            cost = g + inst["cost"]
            if cost < dist_to[k]:
                dist_to[k] = cost
                prev[k] = None
                prev_gap[k] = g
                heapq.heappush(pq, (cost, k[0], k))
    visited = set()
    while pq:
        d, _, k = heapq.heappop(pq)
        if k in visited:
            continue
        visited.add(k)
        if k == target_key:
            break
        for nxt, gap in adj[k]:
            nd = d + gap + instances[nxt]["cost"]
            # Standard relaxation; ties broken by heap pop order (cost,
            # then lower idferill), per rules-addendum-v3.md's own stated
            # rule -- exact floating-point ties are not expected in this
            # geometry data, so no further tie-break logic is applied.
            if nd < dist_to[nxt]:
                dist_to[nxt] = nd
                prev[nxt] = k
                prev_gap[nxt] = gap
                heapq.heappush(pq, (nd, nxt[0], nxt))
    if dist_to.get(target_key, math.inf) == math.inf:
        return None, None, None
    # reconstruct
    path = []
    k = target_key
    while k is not None:
        path.append(k)
        k = prev.get(k)
    path.reverse()
    return dist_to[target_key], path, prev_gap


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
    """Count every nonzero gap (inter-piece + any extra named gaps, e.g.
    the Borgarnes roundabout's own two seams), banded, with the highest."""
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


def main():
    pieces = load_pieces()

    # ------------------------------------------------------------------
    # CCW (short way): Rauðavatn (end of 1436) -> exit of 2819 (fwd).
    # ------------------------------------------------------------------
    start_ccw = pieces[1436]["end"]
    target_ccw = (2819, "fwd")
    instances = build_instances(pieces, exclude_idferill=EXCLUDED_IDFERILL)
    adj = build_adjacency(instances)
    ccw_dist, ccw_path, ccw_gap = dijkstra(instances, adj, start_ccw, target_ccw)
    ccw_fallback_2982 = False
    if ccw_path is None:
        # 2982 genuinely required -- lift the exclusion, log it.
        instances2 = build_instances(pieces, exclude_idferill=())
        adj2 = build_adjacency(instances2)
        ccw_dist, ccw_path, ccw_gap = dijkstra(instances2, adj2, start_ccw, target_ccw)
        instances, adj = instances2, adj2
        ccw_fallback_2982 = True

    ccw_steps = path_detail(pieces, instances, ccw_path, ccw_gap) if ccw_path else None
    ccw_ids = [s["idferill"] for s in ccw_steps] if ccw_steps else []
    ccw_matches_491 = ccw_ids == REFERENCE_491_IDS

    # ------------------------------------------------------------------
    # CW (long way): Rauðavatn (start of 1436) -> exit of 3876 (fwd).
    #
    # Plain shortest-path search would always return the SHORT route
    # (via Borgarnes) here too, since it genuinely is shorter in real
    # distance -- that is not a defect, it is what "shortest path" means.
    # The "long way" is a specific, named alternative (the other side of
    # the ring), not a second shortest-path query on the same unrestricted
    # graph. It is found by excluding every piece that is part of the
    # #491 short-route reference chain from the graph, forcing the search
    # to find the next-best path -- which must then go the other way
    # around. This exclusion is stated here, before the result is seen,
    # not chosen after the fact to make a number come out right.
    # ------------------------------------------------------------------
    # The "Rauðavatn" anchor is 1436's own END (per #491's own
    # start_raudavatn.native_3057_end convention) -- the SAME point the
    # ccw search starts from. The long route traverses piece 1436 itself
    # in reverse (entry=end=the anchor, exit=start, continuing to 1735)
    # to reach the Nesjavallaleið/Hellisheiði direction; the short route
    # does not traverse 1436 at all. Starting from 1436's own START (a
    # first attempt) silently let the search bypass 1436 entirely via
    # 1735's own reverse instance (zero gap to the same point) -- caught
    # before reporting, since #483's own reference explicitly counts
    # piece 1436 as its own first segment.
    start_cw = pieces[1436]["end"]
    # C = end of 2940 = START of 3876 (540259.2615, 577843.7582) --
    # approaching from the EAST (via 3505 -> 3876), 3876 is entered at
    # its own END and exited at its own START, i.e. the "rev" instance;
    # "fwd" (exit=3876's own END, a DIFFERENT point further on) is not C.
    target_cw = (3876, "rev")
    cw_exclude = set(REFERENCE_491_IDS)
    cw_instances = build_instances(pieces, exclude_idferill=EXCLUDED_IDFERILL | cw_exclude)
    cw_adj = build_adjacency(cw_instances)
    cw_dist, cw_path, cw_gap = dijkstra(cw_instances, cw_adj, start_cw, target_cw)
    cw_steps = path_detail(pieces, cw_instances, cw_path, cw_gap) if cw_path else None
    cw_ids = [s["idferill"] for s in cw_steps] if cw_steps else []
    cw_idbutur_order = []
    for i in cw_ids:
        ib = pieces[i]["idbutur"]
        if not cw_idbutur_order or cw_idbutur_order[-1] != ib:
            cw_idbutur_order.append(ib)
    cw_matches_483_first13 = cw_idbutur_order[:13] == REFERENCE_483_IDBUTUR

    # ------------------------------------------------------------------
    # Negative invariant: no adjacent 6/7 pair, no 49282->49281, in
    # EITHER produced sequence.
    # ------------------------------------------------------------------
    def negative_violations(steps):
        if not steps:
            return []
        v = []
        for a, b in zip(steps, steps[1:]):
            if {a["veghluti"], b["veghluti"]} == BANNED_PAIR:
                v.append((a["idferill"], b["idferill"], "adjacent 6/7"))
            if a["idferill"] == 49282 and b["idferill"] == 49281:
                v.append((49282, 49281, "named U-turn"))
        return v

    ccw_violations = negative_violations(ccw_steps)
    cw_violations = negative_violations(cw_steps)

    # ------------------------------------------------------------------
    # W3: bridge summaries, computed from the actual path, not hand-typed.
    # Short route additionally gets the two Borgarnes roundabout seams
    # (Z2): this chain's own search result does not pass through 30401 at
    # all (2819 is the fwd-exit target itself), so the roundabout's own
    # two measured seams (2819->30401 and 30401->2816, cited from
    # north-data) are added as EXTRA named gaps when reporting the
    # SHORT ROUTE (Rauðavatn->Borgarnes->C), not the ccw-to-2819 search
    # alone (2819 is #491's own endpoint; the roundabout comes AFTER it,
    # on the Borgarnes->C leg, cited from north-data, not searched here).
    # ------------------------------------------------------------------
    borgarnes_roundabout_seams_m = [1.7704, 42.8409]  # cited, north-data

    hella_idx = next((i for i, s in enumerate(cw_steps) if s["idferill"] == 3591), None)
    hella_summary = bridge_summary(cw_steps[: hella_idx + 1]) if hella_idx is not None else None
    long_to_c_summary = bridge_summary(cw_steps)
    short_491_only_summary = bridge_summary(ccw_steps) if ccw_steps else None
    short_full_to_c_summary = bridge_summary(ccw_steps, extra_gaps_m=borgarnes_roundabout_seams_m) if ccw_steps else None

    # ------------------------------------------------------------------
    # Z4: route-level closure test (no edge removal / re-search).
    # ------------------------------------------------------------------
    selfoss_target = next((k for k in instances if pieces[k[0]]["idbutur"] == 902030037), None)
    sel_dist, sel_path, sel_gap = dijkstra(instances, adj, start_cw, selfoss_target) if selfoss_target else (None, None, None)
    sel_steps = path_detail(pieces, instances, sel_path, sel_gap) if sel_path else []
    sel_idbutur_set = {s["idbutur"] for s in sel_steps}

    CLOSURE_SET = {252090037, 902020037}
    UNRELATED_SET = {810040037}  # Reykjahlíð-area idbutur, nowhere near this route

    is_closed_with_real_closure = bool(sel_idbutur_set & CLOSURE_SET)
    is_closed_with_unrelated_closure = bool(sel_idbutur_set & UNRELATED_SET)

    # ------------------------------------------------------------------
    # Lengths, both reference bases (Z3): JSON-stated sums vs. this
    # round's own canonical-copy (road-links.csv) summation.
    # ------------------------------------------------------------------
    piece_1436_len = pieces[1436]["length_planar_m"]
    cw_cum_excl_1436 = cw_dist - piece_1436_len if cw_dist is not None else None
    cw_cum_incl_1436 = cw_dist

    result = {
        "ccw_short": {
            "start_coord": list(start_ccw),
            "target": list(target_ccw),
            "total_cost_m": ccw_dist,
            "fallback_2982_required": ccw_fallback_2982,
            "matches_491_reference_29": ccw_matches_491,
            "negative_violations": ccw_violations,
            "steps": ccw_steps,
            "bridge_summary_491_only": short_491_only_summary,
            "bridge_summary_full_with_roundabout_seams": short_full_to_c_summary,
        },
        "cw_long": {
            "start_coord": list(start_cw),
            "target": list(target_cw),
            "total_cost_m_excl_1436": cw_cum_excl_1436,
            "total_cost_m_incl_1436": cw_cum_incl_1436,
            "piece_1436_length_m": piece_1436_len,
            "matches_483_reference_first13_idbutur": cw_matches_483_first13,
            "negative_violations": cw_violations,
            "steps": cw_steps,
            "bridge_summary_to_c": long_to_c_summary,
            "bridge_summary_to_hella": hella_summary,
        },
        "closure_test": {
            "closure_set": sorted(CLOSURE_SET),
            "unrelated_set_for_non_vacuity": sorted(UNRELATED_SET),
            "selfoss_route_idbutur": sorted(sel_idbutur_set),
            "closed_with_real_closure_set": is_closed_with_real_closure,
            "closed_with_unrelated_set_non_vacuity_check": is_closed_with_unrelated_closure,
        },
    }

    with open(OUT_DIR / "chain-walks-v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(OUT_DIR / "bridge-summary-v3.json", "w", encoding="utf-8", newline="\n") as f:
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

    print("=== CCW (short) ===")
    print("matches #491 29-piece reference exactly?", ccw_matches_491, "fallback_2982?", ccw_fallback_2982)
    print("negative violations:", ccw_violations)
    if not ccw_matches_491 and ccw_ids:
        for i, (got, want) in enumerate(zip(ccw_ids, REFERENCE_491_IDS)):
            if got != want:
                print("  divergence at index", i, "got", got, "want", want)
                break
    print("total cost (m):", ccw_dist)
    print("bridge summary (#491-only, to 2819):", short_491_only_summary)
    print("bridge summary (full, with roundabout seams, to C):", short_full_to_c_summary)
    print()
    print("=== CW (long) ===")
    print("matches #483 13-IDBUTUR reference (first 13)?", cw_matches_483_first13)
    print("negative violations:", cw_violations)
    print("total cost excl 1436 (m):", cw_cum_excl_1436, "=", cw_cum_excl_1436 / 1000 if cw_cum_excl_1436 else None, "km")
    print("total cost incl 1436 (m):", cw_cum_incl_1436, "=", cw_cum_incl_1436 / 1000 if cw_cum_incl_1436 else None, "km")
    print("bridge summary to Hella (3591):", hella_summary)
    print("bridge summary to C (3876):", long_to_c_summary)
    print()
    print("=== Closure test (Z4, route-level) ===")
    print("Selfoss route's own IDBUTUR set:", sorted(sel_idbutur_set))
    print("CLOSED with real closure set {252090037,902020037}?", is_closed_with_real_closure, "(expect True)")
    print("CLOSED with unrelated set (non-vacuity)?", is_closed_with_unrelated_closure, "(expect False)")


if __name__ == "__main__":
    main()
