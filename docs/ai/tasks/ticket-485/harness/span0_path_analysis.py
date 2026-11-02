"""#485 correction v2, R1 — retained-data-only (ZERO network) span-0 analysis.

Fixes the R1 defects in Jonesy's round-1 review:
 (a) the 5924.6/5931.6/7.0/7851.6 m figures existed only in prose/CSV, no
     retained script computed them -- THIS script computes them, with the
     exact coordinate metric/axis/units and ID/role/tier filters stated.
 (b) E=61.9m was mis-cited as a "same-object" positional-uncertainty bound.
     #483's own harness/02 output says the opposite ("this 61.9m figure ...
     is NOT a same-object projection-accuracy bound for lengths" --
     02_srs_validation_and_length-output.txt). This script does NOT reuse
     61.9m as E. Per the approved prompt's own rule ("if uncertainty
     unsupported ... span0 remains UNKNOWN"), the correct status is
     "E unsupported => ranking cannot be certified admissible => UNKNOWN",
     not "E=65m, margin 7m < 230m threshold".
 (c) connectivity from the anchor-nearest candidate to the retained 13-ID
     chain's first segment (1410010037) was never traced. This script
     traces it from the retained geometry ONLY, examining Jonesy's leads
     (IDFERILL 9924, 49926, 42244, 1431, 54723) as leads to verify, not
     assumptions to assert -- every hop's gap is computed and printed; if
     any hop exceeds the stated adjacency bound, that is reported as an
     unproven gap, not silently bridged.

Coordinate metric: haversine great-circle distance (WGS84 lon/lat as
returned by the retained wfs-extension-4326.json / wfs-chain-4326.json
samples, srsName=EPSG:4326, GeoJSON [lon, lat] axis order). This is the
SAME metric #483 used for its own chain-adjacency check (harness/01) and
for the (disputed) DATEX residual -- stated here so the metric is never
ambiguous between scripts. Anchor coordinate: Vedurstofa station 1
(64.1288833618, -21.9081897736), retained from #450's own catalog.

No network of any kind is made by this script. Run with: python3 -B
span0_path_analysis.py
"""
import json
import math
import os
import sys

HERE = os.path.dirname(__file__)
SAMPLES = os.path.join(HERE, "..", "samples")
T483_SAMPLES = os.path.join(HERE, "..", "..", "ticket-483", "samples")

ANCHOR_LAT, ANCHOR_LON = 64.1288833618, -21.9081897736


def haversine(lon1, lat1, lon2, lat2):
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def point_to_segment_frac(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return 0.0
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    return max(0.0, min(1.0, t))


def nearest_point_on_coords(coords, lon0, lat0):
    """Local-metric projection to find the nearest-approach fraction on
    each sub-segment, true distance reported via haversine on the
    interpolated lon/lat (same method as #483's harness/04)."""
    best = None
    best_pt = None
    for i in range(len(coords) - 1):
        lon1, lat1 = coords[i][0], coords[i][1]
        lon2, lat2 = coords[i + 1][0], coords[i + 1][1]
        R = 6371000.0
        latm = (lat1 + lat2) / 2
        ax = math.radians(lon1 - lon0) * math.cos(math.radians(latm)) * R
        ay = math.radians(lat1 - lat0) * R
        bx = math.radians(lon2 - lon0) * math.cos(math.radians(latm)) * R
        by = math.radians(lat2 - lat0) * R
        t = point_to_segment_frac(0, 0, ax, ay, bx, by)
        ilon = lon1 + t * (lon2 - lon1)
        ilat = lat1 + t * (lat2 - lat1)
        d = haversine(lon0, lat0, ilon, ilat)
        if best is None or d < best:
            best = d
            best_pt = (ilon, ilat)
    return best, best_pt


def load(name, base=SAMPLES):
    with open(os.path.join(base, name), encoding="utf-8") as f:
        return json.load(f)


def tier0_features(data, idb_filter=None):
    out = []
    for f in data["features"]:
        p = f["properties"]
        if p["VEGNR"] != "1" or p["NAKVAEMNIFERLIS"] != 0:
            continue
        if idb_filter is not None and p["IDBUTUR"] not in idb_filter:
            continue
        out.append((p, f["geometry"]["coordinates"]))
    return out


def main():
    print("=" * 78)
    print("R1(a) -- ANCHOR-DISTANCE RANKING, role-set sensitivity table")
    print("=" * 78)
    print(f"Anchor (retained #450 catalog, Vedurstofa station 1 'Reykjavik'): "
          f"lat={ANCHOR_LAT}, lon={ANCHOR_LON}")
    print("Metric: haversine great-circle distance on WGS84 lon/lat from the retained "
          "srsName=EPSG:4326 WFS response (service-side reprojection, no local transform "
          "library used). Filter: VEGNR='1', NAKVAEMNIFERLIS=0 (documented tier 0) on all "
          "candidates. Role set is varied below -- it was NOT justified/fixed in the frozen "
          "plan, so sensitivity across plausible role sets is shown instead of one number.\n")

    ext = load("wfs-extension-4326.json")
    chain = load("wfs-chain-4326.json", base=T483_SAMPLES)

    role_sets = {
        "{1,6,7} (original v1 choice -- includes opposing-direction carriageway 6)": {1, 6, 7},
        "{1,7} (through + same-direction only, excludes opposing carriageway 6)": {1, 7},
        "{7} only (strictly the directional through-carriageway tag)": {7},
    }

    candidates_4326 = {914020037: [], 903020037: []}
    for p, coords in tier0_features(ext, {914020037, 903020037}):
        candidates_4326[p["IDBUTUR"]].append((p, coords))

    chain_1410_coords = [coords for p, coords in tier0_features(chain, {1410010037})]

    for label, roles in role_sets.items():
        print(f"-- role set: {label} --")
        results = []
        for idb, feats in candidates_4326.items():
            best = None
            for p, coords in feats:
                if p["VEGHLUTI"] not in roles:
                    continue
                d, pt = nearest_point_on_coords(coords, ANCHOR_LON, ANCHOR_LAT)
                if best is None or d < best[0]:
                    best = (d, pt, p["IDFERILL"], p["VEGHLUTI"])
            results.append((idb, best))
        # also 1410010037 under the same role filter, VEGHLUTI=1 only present for it
        best_1410 = None
        for coords in chain_1410_coords:
            d, pt = nearest_point_on_coords(coords, ANCHOR_LON, ANCHOR_LAT)
            if best_1410 is None or d < best_1410[0]:
                best_1410 = (d, pt)
        results.append((1410010037, (best_1410[0], best_1410[1], 1436, 1) if best_1410 else None))

        results_sorted = sorted([r for r in results if r[1] is not None], key=lambda r: r[1][0])
        for rank, (idb, (d, pt, idferill, veghluti)) in enumerate(results_sorted, 1):
            print(f"    rank {rank}: IDBUTUR={idb} IDFERILL={idferill} VEGHLUTI={veghluti} "
                  f"distance={d:.1f}m")
        if len(results_sorted) >= 2:
            margin = results_sorted[1][1][0] - results_sorted[0][1][0]
            print(f"    winner/runner-up margin: {margin:.1f}m")
        print()

    print("=" * 78)
    print("R1(b) -- UNCERTAINTY BOUND E: UNSUPPORTED, not 61.9m")
    print("=" * 78)
    print("The #483 DATEX-proximity figure (61.9m, harness/02) was computed at Hellisheidi, "
          "a DIFFERENT location from this anchor/junction, and #483's OWN output states: "
          "\"this 61.9m figure shows the reprojection is not grossly wrong at one point -- it "
          "is NOT a same-object projection-accuracy bound for lengths\" "
          "(02_srs_validation_and_length-output.txt line 7, Jonesy R3 note, reused unchanged). "
          "It is not a 'service-provided paired same-object coordinate residual' for THIS "
          "anchor-to-road comparison -- that was a mis-citation in pre-sample-plan.md s5, "
          "corrected here, not silently kept.")
    print("No other retained source supplies a supported E for this specific comparison "
          "(anchor point vs. reprojected road geometry at a different location). Per the "
          "frozen approved-prompt-v1.md rule ('if uncertainty unsupported ... ranking "
          "tied/inadmissible ... span0 remains UNKNOWN, axis1 cannot PASS'): since E is "
          "UNSUPPORTED, the ranking cannot be certified admissible at ANY observed margin -- "
          "this holds independently of whether the raw margin is 7m or 100m. The correct "
          "status is 'E unsupported => inadmissible => UNKNOWN', not 'E=65m, margin 7m below "
          "230m'. The near-tie margin above is reported as a DESCRIPTIVE geometric observation "
          "only (useful color: the candidates sit close together under every role-set tried), "
          "never as a newly-supported E and never as a basis to regrade span 0.")
    print()

    print("=" * 78)
    print("R1(c) -- ordered path from the anchor-nearest candidate toward the retained chain,")
    print("          examining Jonesy's leads (IDFERILL 9924/49926/42244/1431/54723) as LEADS,")
    print("          not assumed connectors -- every hop's gap is computed, not assumed.")
    print("=" * 78)

    def get_piece(idb, idferill):
        for p, coords in candidates_4326.get(idb, []):
            if p["IDFERILL"] == idferill:
                return p, coords
        return None

    path = [
        (903020037, 9924),
        (914020037, 49926),
        (914020037, 42244),
        (914020037, 1431),
        (914020037, 54723),
    ]
    pieces = []
    for idb, idferill in path:
        got = get_piece(idb, idferill)
        if got is None:
            print(f"  LEAD NOT FOUND in retained tier-0 data: IDBUTUR={idb} IDFERILL={idferill} "
                  f"-- cannot include in the traced path, reported as missing, not assumed present.")
            continue
        p, coords = got
        length_m = sum(haversine(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
                        for i in range(len(coords) - 1))
        pieces.append((idb, idferill, p["VEGHLUTI"], coords, length_m))
        print(f"  piece IDBUTUR={idb} IDFERILL={idferill} VEGHLUTI={p['VEGHLUTI']} "
              f"({'OPPOSING-direction carriageway -- NOT a through-direction role' if p['VEGHLUTI'] == 6 else 'through/undivided role'}) "
              f"length={length_m:.1f}m start={coords[0][:2]} end={coords[-1][:2]}")

    # Append the chain's own first fragment (1410010037) as the final link to test.
    chain_piece = None
    for p, coords in tier0_features(chain, {1410010037}):
        chain_piece = (1410010037, p.get("IDFERILL"), p["VEGHLUTI"], coords,
                        sum(haversine(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
                            for i in range(len(coords) - 1)))
    if chain_piece:
        print(f"  chain-entry piece IDBUTUR=1410010037 IDFERILL={chain_piece[1]} "
              f"VEGHLUTI={chain_piece[2]} length={chain_piece[4]:.1f}m "
              f"start={chain_piece[3][0][:2]} end={chain_piece[3][-1][:2]}")
        pieces.append(chain_piece)
    print()

    print("  Endpoint-to-endpoint gaps along the traced sequence (haversine, all 4 endpoint "
          "combinations per hop, minimum reported -- same adjacency method as #483 harness/01, "
          f"which used a <100m 'all consecutive pairs under 100m' continuity bound):")
    ADJACENCY_BOUND_M = 100.0
    total_len = 0.0
    all_within_bound = True
    for i in range(len(pieces) - 1):
        a_idb, a_idf, a_vh, a_coords, a_len = pieces[i]
        b_idb, b_idf, b_vh, b_coords, b_len = pieces[i + 1]
        best_gap = None
        for ca in (a_coords[0], a_coords[-1]):
            for cb in (b_coords[0], b_coords[-1]):
                d = haversine(ca[0], ca[1], cb[0], cb[1])
                if best_gap is None or d < best_gap:
                    best_gap = d
        within = best_gap < ADJACENCY_BOUND_M
        if not within:
            all_within_bound = False
        print(f"    IDFERILL {a_idf} (IDBUTUR {a_idb}) -> IDFERILL {b_idf} (IDBUTUR {b_idb}): "
              f"gap={best_gap:.1f}m  {'within bound' if within else '** EXCEEDS ' + str(ADJACENCY_BOUND_M) + 'm BOUND -- UNPROVEN HOP **'}")
        total_len += a_len
    if pieces:
        total_len += pieces[-1][4]
    print()
    print(f"  Total length of the traced candidate pieces (connector + 914020037 segments + "
          f"chain-entry fragment, NOT the full through-road, tier0 only): {total_len:.1f}m")
    print(f"  All hops within the {ADJACENCY_BOUND_M}m adjacency bound: {all_within_bound}")
    print()
    if all_within_bound:
        print("  CONCLUSION: this specific candidate sequence IS topologically adjacent "
              "end-to-end under the same adjacency test #483 used for the retained 13-chain -- "
              "but adjacency alone does NOT establish a directionally-traversable, officially-"
              "designated through-route (VEGHLUTI role meanings for 1/8 remain UNDOCUMENTED/"
              "INFERRED, per #483; no owner/Vegagerdin confirmation of travel direction at this "
              "junction exists in retained evidence). This is a GEOMETRY OBSERVATION for a "
              "later owner/Ripley decision, not a resolved endpoint and not a new grading "
              "threshold. Span 0 stays UNKNOWN for the reason given in R1(b) above "
              "(E unsupported), independent of this connectivity finding.")
    else:
        print("  CONCLUSION: at least one hop in this specific candidate sequence is NOT "
              "proven adjacent from retained geometry alone -- reported as an unproven gap, "
              "not bridged by assumption. Span 0 stays UNKNOWN for this reason ALSO, in "
              "addition to R1(b)'s unsupported-E finding.")
    print()
    print("No claim is made here that 'only Vegagerdin can answer' or that 'further research "
          "cannot resolve this' -- those statements (research-report.md s1(c), "
          "blocker-rights-register.md) are WITHDRAWN as unsupported overclaims; this script "
          "shows exactly what retained geometry does and does not establish, and the real "
          "limiting factor found this round is the unsupported E (R1(b)), not an inherent "
          "unresolvability of the connectivity question.")


if __name__ == "__main__":
    main()
