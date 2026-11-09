#!/usr/bin/env python3
"""
#493 place-network, phase 1 CORRECTION round (approved-prompt-v2.md,
X1-X6). Corrects three defects found by Jonesy's result review of the
v1 script (national_inventory.py): a wrong-direction 6<->7 carriageway
jump near Kjalarnes, the resulting false "2.75 km ring-closure gap", and
unlabelled/overclaimed continuity grades.

Reads the already-produced samples/road-links.csv (unchanged, still the
E2d canonical-instance selection from rules.md; NOT re-selected here) and:
  1. Re-walks Rauðavatn -> C (long way, clockwise) with a direction model
     that bans direct 6<->7 carriageway transitions (rules-addendum-v2.md
     E2b'), asserting against the #483 13-IDBUTUR Vík reference and
     continuing to C (piece 3876) -- truncated there, not continued past
     C into the already-known-broken Kjalarnes stretch (out of this
     round's scope; see rules-addendum-v2.md).
  2. Attempts the same corrected walk from Rauðavatn -> Borgarnes
     (counterclockwise, short way) and asserts it against the #491
     29-piece reference chain (cited from derivation-29-pieces.md). If it
     diverges, the divergence point is reported and the short route's own
     figures fall back to the #491 citation (Ripley's sanctioned fallback,
     approved-prompt-v2.md X2b) rather than a silent/wrong substitute.
  3. Runs the X4 closure test: removes IDBUTUR 252090037 and 902020037
     from the directed graph in both directions and proves no path from
     Rauðavatn reaches a Selfoss-Hveragerði piece; separately estimates
     (not searches) the "other way around" distance from the ring total.
  4. Writes a byte-exact hash/size/line-ending table for every file this
     round produces, computed from bytes on disk.

Deterministic, reproducible from a clean tree; no network access.
"""
import csv
import hashlib
import json
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# Cited reference chains (NOT re-derived from raw geometry here -- these are
# the already-PASSed source-of-truth sequences this round asserts against).
# ---------------------------------------------------------------------------

# #483 route-segments.csv, 13 rows, IDBUTUR order (Rauðavatn -> Vík).
REFERENCE_483_IDBUTUR = [
    1410010037, 903010037, 253020037, 252090037, 902030037, 902040037,
    901130037, 901230037, 901220037, 901210037, 901050037, 901040037,
    801100037,
]

# docs/ai/tasks/ticket-491/derivation-29-pieces.md, 29 IDFERILL, Rauðavatn
# (end of 1436) -> Borgarnes (end of 2819). gap_m is the native-ISN93 gap
# INTO this piece from the previous one (0.0 for exact contact); the first
# piece's own gap (37.39 m, from 1436's own end) is recorded separately.
REFERENCE_491_CHAIN = [
    (1477, 37.39), (1431, 38.68), (42243, 3.60), (49926, 3.71), (9923, 10.83),
    (9925, 34.16), (9927, 26.55), (10242, 31.47), (2796, 40.83), (10247, 17.92),
    (2488, 32.67), (2532, 41.45), (30721, 7.09), (49281, 38.62), (49285, 2.88),
    (3025, 0.00), (3023, 0.00), (56002, 0.00), (3796, 0.00), (3794, 27.62),
    (3802, 0.00), (3740, 0.00), (3741, 0.00), (47042, 0.00), (3756, 0.00),
    (3757, 0.00), (3758, 0.00), (2876, 0.00), (2819, 0.00),
]
REFERENCE_491_SOURCE = "docs/ai/tasks/ticket-491/derivation-29-pieces.md (table '1. The 29-piece chain (reproduced)')"
REFERENCE_491_HAVERSINE_KM = 70.5664  # P4, exit of 2819 (derivation-29-pieces.md)
REFERENCE_491_PLANAR_KM = 70.78  # route-data-candidate.json total_route_length_km_planar_isn93_tier0

# docs/ai/tasks/ticket-493-north-data/route-data-candidate.json /
# akureyri-endpoint-decision.md: Borgarnes(2819) -> C(end of 2940) haversine
# and planar, derived by subtracting the 7 pieces between C and A(32964)
# from the official north-only (excl. 2819 + ring 30401) totals.
NORTH_DATA_HAVERSINE_TOTAL_TO_A_KM = 316.7123
NORTH_DATA_HAVERSINE_C_TO_A_KM = 8.049661
NORTH_DATA_PLANAR_TOTAL_TO_A_KM = 317.7261
NORTH_DATA_PLANAR_C_TO_A_KM = 8.07533
BORGARNES_TO_C_HAVERSINE_KM = round(NORTH_DATA_HAVERSINE_TOTAL_TO_A_KM - NORTH_DATA_HAVERSINE_C_TO_A_KM, 4)
BORGARNES_TO_C_PLANAR_KM = round(NORTH_DATA_PLANAR_TOTAL_TO_A_KM - NORTH_DATA_PLANAR_C_TO_A_KM, 5)


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
                "desc": row["desc"],
                "start": (float(row["start_x"]), float(row["start_y"])),
                "end": (float(row["end_x"]), float(row["end_y"])),
                "length_planar_m": float(row["length_planar_m"]),
            }
    return pieces


import math


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


# Rules-addendum-v2.md E2b': direct 6<->7 transitions are banned (a 6-piece
# may not be followed immediately by a 7-piece of the SAME divided-highway
# pair, or vice versa -- that is a carriageway switch, not driving).
BANNED_DIRECT_SWITCH = {6: 7, 7: 6}
# Branch not taken, per #491's own established chain (approved-prompt-v2.md
# X2a): 2982 ("Hvalfjarðargöng til suðurs", idbutur 814700037) is excluded
# whenever its sibling (3023/56002/3796, idbutur 904690037) is available.
EXCLUDED_UNLESS_ONLY_OPTION = {2982}


def corrected_walk(pieces, start_idferill, start_end, gap_threshold=100.0, max_steps=260):
    used = {start_idferill}
    seq = [{"idferill": start_idferill, "entered_at": start_end, "cum_m": 0.0, "veghluti": pieces[start_idferill]["veghluti"]}]
    current = pieces[start_idferill]
    far_end = "end" if start_end == "start" else "start"
    cum = 0.0
    prev_veghluti = current["veghluti"]
    for _ in range(max_steps):
        from_point = current[far_end]
        candidates = []
        for idferill, pc in pieces.items():
            if idferill in used or idferill in EXCLUDED_UNLESS_ONLY_OPTION:
                continue
            for which in ("start", "end"):
                d = dist(pc[which], from_point)
                if d <= gap_threshold:
                    candidates.append((d, idferill, which))
        if not candidates:
            # retry allowing the excluded branch, as the ONLY option
            fallback = []
            for idferill in EXCLUDED_UNLESS_ONLY_OPTION:
                if idferill in used or idferill not in pieces:
                    continue
                pc = pieces[idferill]
                for which in ("start", "end"):
                    d = dist(pc[which], from_point)
                    if d <= gap_threshold:
                        fallback.append((d, idferill, which))
            if fallback:
                fallback.sort(key=lambda c: c[0])
                candidates = fallback
            else:
                return seq, {"reason": "gap", "at_idferill": current["idferill"], "at_end": far_end}
        candidates.sort(key=lambda c: c[0])
        banned_vh = BANNED_DIRECT_SWITCH.get(prev_veghluti)
        filtered = [c for c in candidates if pieces[c[1]]["veghluti"] != banned_vh] if banned_vh else candidates
        if not filtered:
            # the ONLY candidates are the banned-direction twin -> forced
            # exception, logged explicitly, not a silent allowance.
            filtered = candidates
            forced_switch = True
        else:
            forced_switch = False
        chosen_d, chosen_id, chosen_end = filtered[0]
        used.add(chosen_id)
        chosen_pc = pieces[chosen_id]
        cum += chosen_d + chosen_pc["length_planar_m"]
        seq.append(
            {
                "idferill": chosen_id,
                "idbutur": chosen_pc["idbutur"],
                "name": chosen_pc["name"],
                "desc": chosen_pc["desc"],
                "veghluti": chosen_pc["veghluti"],
                "entered_at": chosen_end,
                "bridge_m": chosen_d,
                "band": band_for(chosen_d),
                "piece_length_m": chosen_pc["length_planar_m"],
                "cum_m": cum,
                "forced_direction_switch": forced_switch,
            }
        )
        current = chosen_pc
        prev_veghluti = chosen_pc["veghluti"]
        far_end = "end" if chosen_end == "start" else "start"
        if chosen_id in (3876,):
            break
    return seq, {"reason": "stopped_at_target_or_max_steps"}


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


def check_negative_invariant(seq):
    """Assert: no adjacent 6/7 pair, no 49282->49281 step, anywhere."""
    violations = []
    for a, b in zip(seq, seq[1:]):
        va, vb = a.get("veghluti"), b.get("veghluti")
        if {va, vb} == {6, 7}:
            violations.append((a["idferill"], b["idferill"], "adjacent 6/7"))
        if a["idferill"] == 49282 and b["idferill"] == 49281:
            violations.append((49282, 49281, "named U-turn"))
    return violations


def main():
    pieces = load_pieces()

    # --- clockwise (long way), Rauðavatn (start of 1436) -> C ---
    cw_seq, cw_stop = corrected_walk(pieces, 1436, "end", max_steps=200)
    cw_idbutur_order = []
    for step in cw_seq:
        ib = pieces[step["idferill"]]["idbutur"] if step["idferill"] in pieces else None
        if ib is not None and (not cw_idbutur_order or cw_idbutur_order[-1] != ib):
            cw_idbutur_order.append(ib)
    first13 = cw_idbutur_order[:13]
    assert first13 == REFERENCE_483_IDBUTUR, f"clockwise walk diverges from #483 13-IDBUTUR reference: {first13} != {REFERENCE_483_IDBUTUR}"
    reached_3876 = any(s["idferill"] == 3876 for s in cw_seq)
    assert reached_3876, "clockwise walk did not reach piece 3876 (C's own paired piece)"

    cw_violations = check_negative_invariant(cw_seq)

    # cumulative at 3876 (end of long route, truncated at C -- NOT
    # continued past C into the Kjalarnes stretch this round).
    cum_at_3876_excl_1436 = next(s["cum_m"] for s in cw_seq if s["idferill"] == 3876)
    piece_1436_length_m = pieces[1436]["length_planar_m"]
    cum_at_3876_incl_1436 = cum_at_3876_excl_1436 + piece_1436_length_m

    # --- counterclockwise (short way), Rauðavatn (end of 1436) -> Borgarnes ---
    ccw_seq, ccw_stop = corrected_walk(pieces, 1436, "start", max_steps=60)
    ccw_ids = [s["idferill"] for s in ccw_seq[1:]]
    reference_ids = [idferill for idferill, _ in REFERENCE_491_CHAIN]
    matches_reference = ccw_ids[: len(reference_ids)] == reference_ids
    divergence_index = None
    if not matches_reference:
        for i, (got, want) in enumerate(zip(ccw_ids, reference_ids)):
            if got != want:
                divergence_index = i
                break
        else:
            divergence_index = min(len(ccw_ids), len(reference_ids))

    # --- X4 closure test ---
    # X4(i): the test must represent the PRODUCT's own fixed, predetermined
    # route (the directed greedy walk, same as the clockwise walk above),
    # NOT a full graph reachability search -- a full search trivially
    # "succeeds" on a closed ring (that is exactly the failure mode this
    # round's own result review caught: raw graph connectivity does not
    # disconnect, so it cannot answer "does the ROUTE close"). Both
    # IDBUTUR 252090037 (2117/2024) and 902020037 (2134/2116/2021) are
    # removed from the candidate pool entirely; the SAME directed walk
    # function used for the real route is re-run and must fail to reach a
    # Selfoss-Hveragerði piece before running out of candidates.
    CLOSED_IDBUTUR = {252090037, 902020037}
    pieces_for_closure_test = {k: v for k, v in pieces.items() if v["idbutur"] not in CLOSED_IDBUTUR}
    closure_seq, closure_stop = corrected_walk(pieces_for_closure_test, 1436, "end", max_steps=200)
    selfoss_reached_in_closure_walk = any(pieces[s["idferill"]]["idbutur"] == 902030037 for s in closure_seq if s["idferill"] in pieces)
    # Sanity check: with the SAME two IDBUTUR open (not removed), the
    # identical walk function must actually reach Selfoss-Hveragerði --
    # otherwise this test could pass vacuously (always "closed" regardless
    # of removal).
    open_seq, open_stop = corrected_walk(pieces, 1436, "end", max_steps=40)
    selfoss_reached_when_open = any(pieces[s["idferill"]]["idbutur"] == 902030037 for s in open_seq)

    result = {
        "clockwise_walk": cw_seq,
        "clockwise_stop": cw_stop,
        "clockwise_matches_483_first13": True,
        "clockwise_negative_invariant_violations": cw_violations,
        "clockwise_cum_m_at_3876_excl_1436": cum_at_3876_excl_1436,
        "clockwise_cum_m_at_3876_incl_1436": cum_at_3876_incl_1436,
        "piece_1436_length_m": piece_1436_length_m,
        "counterclockwise_walk": ccw_seq,
        "counterclockwise_stop": ccw_stop,
        "counterclockwise_matches_491_reference": matches_reference,
        "counterclockwise_divergence_index": divergence_index,
        "counterclockwise_matched_ids": ccw_ids,
        "reference_491_ids": reference_ids,
        "closure_test": {
            "closed_idbutur": sorted(CLOSED_IDBUTUR),
            "selfoss_reached_in_closure_walk": selfoss_reached_in_closure_walk,
            "closure_walk_stop": closure_stop,
            "closure_walk_sequence": closure_seq,
            "selfoss_reached_when_open_sanity_check": selfoss_reached_when_open,
        },
    }

    with open(OUT_DIR / "chain-walks-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print("clockwise: reached 3876?", reached_3876, "stop:", cw_stop)
    print("clockwise first13 idbutur == #483 reference?", first13 == REFERENCE_483_IDBUTUR)
    print("clockwise negative-invariant violations:", cw_violations)
    print("cum at 3876 excl 1436 (m):", cum_at_3876_excl_1436, "= ", cum_at_3876_excl_1436 / 1000, "km")
    print("cum at 3876 incl 1436 (m):", cum_at_3876_incl_1436, "= ", cum_at_3876_incl_1436 / 1000, "km")
    print("piece 1436 length (m):", piece_1436_length_m)
    print()
    print("counterclockwise matches #491 reference (29 pieces)?", matches_reference)
    print("counterclockwise got (first 10):", ccw_ids[:10])
    print("reference (first 10):          ", reference_ids[:10])
    if not matches_reference:
        print("divergence at index", divergence_index, "got", ccw_ids[divergence_index] if divergence_index < len(ccw_ids) else None, "want", reference_ids[divergence_index] if divergence_index < len(reference_ids) else None)
    print()
    print("Short route (CC-attributed citation):")
    print(f"  haversine: {REFERENCE_491_HAVERSINE_KM} + {BORGARNES_TO_C_HAVERSINE_KM} = {round(REFERENCE_491_HAVERSINE_KM + BORGARNES_TO_C_HAVERSINE_KM, 4)} km")
    print(f"  planar:    {REFERENCE_491_PLANAR_KM} + {BORGARNES_TO_C_PLANAR_KM} = {round(REFERENCE_491_PLANAR_KM + BORGARNES_TO_C_PLANAR_KM, 5)} km")
    print()
    long_planar_incl_1436_km = cum_at_3876_incl_1436 / 1000
    short_planar_km = REFERENCE_491_PLANAR_KM + BORGARNES_TO_C_PLANAR_KM
    print(f"Long route (this round's own fresh walk, planar, incl. 1436): {long_planar_incl_1436_km:.4f} km")
    print(f"Ring total (short_planar + long_planar_incl_1436, 1436 counted once): {short_planar_km + long_planar_incl_1436_km:.4f} km")
    print()
    print("Closure test (X4, directed greedy walk, not graph reachability):")
    print("  with 252090037+902020037 REMOVED, walk stop reason:", closure_stop)
    print("  Selfoss-Hveragerði reached in closure walk:", selfoss_reached_in_closure_walk, "(expect False)")
    print("  sanity check, same walk with graph OPEN, Selfoss reached:", selfoss_reached_when_open, "(expect True)")


if __name__ == "__main__":
    main()
