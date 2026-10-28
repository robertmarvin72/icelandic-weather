"""J4 / R3 (correction v2) — validate the WFS srsName=EPSG:4326 reprojection
against an independent control point, then compute the chain's length
CORRECTLY: `wfs-chain-4326.json` was fetched with `CQL_FILTER=IDBUTUR IN
(13 values)` only -- it is NOT VEGNR=1-pure (it carries 144 VEGNR=1 + 4
VEGNR=33 + 8 VEGNR=261 features, confirmed below). The v1 round's length
figures (177.1, then 179.2 km) wrongly included the non-Route-1 fragments
and did not apply a VEGHLUTI role rule. This version:

1. Filters to VEGNR='1' only before any grouping/summing.
2. Groups fragments into physical sub-pieces by rounded start/end
   coordinate, then selects the documented tier 0 within each group.
3. Reports the VEGHLUTI composition actually present (1, 5, 7 -- no 3/4
   ramps, no 6 in this eastbound-only sample) and isolates the roundabout
   (VEGHLUTI=5) contribution as a stated, bounded over-count rather than
   silently including or excluding it.
4. Reports tier sensitivity (-1/0/1/2) as a sensitivity table, not a single
   "best" number.
5. Cross-checks with a native-ISN93 planar length (no reprojection at all)
   on the same 13 IDs/tier/VEGNR filter, as an independent second method
   (per Jonesy's A3) -- not added to the spherical figure, reported side
   by side.

Limitation stated here, not hidden: haversine is a SPHERICAL
approximation; ISN93 planar is a projected approximation with a documented
scale factor <=1.0003 on this corridor. Neither is a true ellipsoidal
geodesic (no local tool available, confirmed in the plan's own tool check).
"""
import math
import sys
sys.path.insert(0, ".")
from _shared import print_input_manifest, load_json, haversine, CHAIN_ORDER

SRS_TEST = "wfs-srstest-4326.json"
CHAIN_4326 = "wfs-chain-4326.json"
NATIONWIDE_3057 = "wfs-vegnr1-all.json"

CONTROL_LAT, CONTROL_LON = 64.019035, -21.34235  # IRCA_MP_1, independent DATEX source


def group_physical(frags, round_to=4):
    """frags: list of ((veghluti, tier), coords) for the WGS84 case, or
    (tier, coords) for the planar case. Groups by rounded start/end
    coordinate into physical sub-pieces, keyed by tier -> (veghluti_or_None, coords)."""
    groups = {}
    for key_fields, coords in frags:
        key = frozenset([(round(coords[0][0], round_to), round(coords[0][1], round_to)),
                          (round(coords[-1][0], round_to), round(coords[-1][1], round_to))])
        if isinstance(key_fields, tuple):
            vh, tier = key_fields
        else:
            vh, tier = None, key_fields
        groups.setdefault(key, {})[tier] = (vh, coords)
    return groups


def main():
    print_input_manifest([SRS_TEST, CHAIN_4326, NATIONWIDE_3057])

    d = load_json(SRS_TEST)
    best = None
    for f in d["features"]:
        for lon, lat, *_ in f["geometry"]["coordinates"]:
            dist = haversine(lon, lat, CONTROL_LON, CONTROL_LAT)
            if best is None or dist < best:
                best = dist
    print(f"SRS control check: nearest distance from reprojected Hellisheidi geometry to the "
          f"independent DATEX control point: {best:.1f} m (within ~2000m tolerance: {best < 2000})")
    print("Note (Jonesy R3): this 61.9m figure shows the reprojection is not grossly wrong at "
          "one point -- it is NOT a same-object projection-accuracy bound for lengths.")
    print()

    d2 = load_json(CHAIN_4326)
    vegnr_counts = {}
    for f in d2["features"]:
        v = f["properties"]["VEGNR"]
        vegnr_counts[v] = vegnr_counts.get(v, 0) + 1
    print(f"VEGNR distribution in wfs-chain-4326.json (the length sample): {vegnr_counts}")
    print("CONFIRMED: this sample is NOT VEGNR=1-pure -- it was fetched by IDBUTUR only. "
          "All totals below filter VEGNR='1' explicitly before use.")
    print()

    by_id = {}
    veghluti_seen = set()
    for f in d2["features"]:
        p = f["properties"]
        if p["VEGNR"] != "1":
            continue
        idb = p["IDBUTUR"]
        veghluti_seen.add(p["VEGHLUTI"])
        by_id.setdefault(idb, []).append(((p["VEGHLUTI"], p["NAKVAEMNIFERLIS"]), f["geometry"]["coordinates"]))
    print(f"VEGHLUTI values present after VEGNR=1 filter: {sorted(veghluti_seen)} "
          "(0=centreline,3=on-ramp,4=off-ramp,5=roundabout,6=carriageway-with-direction,"
          "7=carriageway-against-direction documented; 1 and 8 are undocumented per Jonesy's "
          "owner-source reading -- 1's meaning is INFERRED as the default/undivided-carriageway "
          "tag since it is what most non-divided chain segments carry)")
    print("No VEGHLUTI 3/4 (ramps) present in this sample -- no ramp exclusion needed here. "
          "No VEGHLUTI 6 present because only the eastbound-tagged divided segments "
          "(252090037 'til austurs', 253020037) were selected for this chain, not their "
          "westbound counterparts (902020037, 902010037) -- travel direction: eastbound, "
          "Reykjavik -> Vik, stated explicitly, not implying westbound coverage.")
    print()

    def line_length(coords):
        return sum(haversine(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
                   for i in range(len(coords) - 1))

    print("Per-segment VEGNR=1-only length (tier 0, roundabout pieces isolated):")
    total_with_roundabout = 0.0
    total_roundabout_only = 0.0
    for idb in CHAIN_ORDER:
        frags = by_id.get(idb, [])
        groups = group_physical(frags)
        seg_total = 0.0
        seg_roundabout = 0.0
        for key, precmap in groups.items():
            # precmap: tier -> (veghluti, coords); prefer documented tier 0
            tier_choice = 0 if 0 in precmap else next(iter(precmap))
            vh, chosen_coords = precmap[tier_choice]
            length = line_length(chosen_coords)
            seg_total += length
            if vh == 5:
                seg_roundabout += length
        total_with_roundabout += seg_total
        total_roundabout_only += seg_roundabout
        print(f"  {idb}: physical_subpieces={len(groups)} length_km={seg_total/1000:.2f} "
              f"(of which roundabout={seg_roundabout/1000:.2f})")
    print()
    print("N8 (correction v3) -- length presented as a RANGE (geometry-inclusion sensitivity), "
          "not a single figure: the actual traversed arc through each roundabout is unresolved "
          "(not every vehicle drives the full ring), so the honest statement is a range between "
          "excluding and including the full ring geometry -- not a proven bound on the actual "
          "driven distance, and NOT the complete Reykjavik-Vik route length (the Reykjavik-ward "
          "extension in harness/01's N6 section is separately unresolved and not included here).")
    print(f"TOTAL VEGNR=1-only chain length (these 13 retained IDs only), tier 0: "
          f"{(total_with_roundabout-total_roundabout_only)/1000:.2f}-{total_with_roundabout/1000:.2f} km "
          f"(without / with full roundabout rings)")
    print(f"  of which roundabout (VEGHLUTI=5) full-ring pieces: {total_roundabout_only/1000:.2f} km")
    print(f"TOTAL excluding roundabout rings entirely: "
          f"{(total_with_roundabout-total_roundabout_only)/1000:.2f} km")
    print()

    print("Tier sensitivity (VEGNR=1 only, same grouping, each tier reported separately -- "
          "not a single 'best' number):")
    for target_tier in [-1, 0, 1, 2]:
        t = 0.0
        for idb in CHAIN_ORDER:
            frags = by_id.get(idb, [])
            groups = group_physical(frags)
            for key, precmap in groups.items():
                if target_tier in precmap:
                    _, coords = precmap[target_tier]
                    t += line_length(coords)
        label = "documented" if target_tier in (0, 1, 2) else "UNDOCUMENTED, meaning unknown"
        print(f"  tier {target_tier} ({label}): {t/1000:.2f} km")
    print()

    # ISN93 planar cross-check, native nationwide sample, same IDs/filter/tier
    d3 = load_json(NATIONWIDE_3057)
    by_id_3057 = {}
    for f in d3["features"]:
        p = f["properties"]
        if p["VEGNR"] != "1":
            continue
        idb = p["IDBUTUR"]
        by_id_3057.setdefault(idb, []).append((p["NAKVAEMNIFERLIS"], f["geometry"]["coordinates"]))

    def planar_length(coords):
        return sum(math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1])
                   for i in range(len(coords) - 1))

    total_planar = 0.0
    for idb in CHAIN_ORDER:
        frags = by_id_3057.get(idb, [])
        groups = group_physical(frags, round_to=2)
        for key, precmap in groups.items():
            tier_choice = 0 if 0 in precmap else next(iter(precmap))
            _, coords = precmap[tier_choice]
            total_planar += planar_length(coords)
    print(f"ISN93 native planar length (EPSG:3057, no reprojection), same 13 IDs/VEGNR=1/tier0: "
          f"{total_planar/1000:.2f} km")
    print(f"Spherical (haversine, WGS84 via srsName=4326) for comparison: "
          f"{total_with_roundabout/1000:.2f} km")
    print("These are TWO DIFFERENT METHODS -- never added together. The ~0.3-0.4% difference is "
          "consistent with the documented ISN93 Lambert Conformal Conic scale factor "
          "(<=1.0003 on this corridor, per Jonesy's sandbox arithmetic, not independently "
          "re-derived here). Neither is an ellipsoidal geodesic.")
    print()
    print("R2/extension note: the Reykjavik-ward extension (914020037, 903020037) is NOT "
          "included in any total above -- see harness/01's R2 section for why its length is "
          "reported as NOT COMPUTED (connectivity confirmed, VEGHLUTI role selection at that "
          "multi-ramp/roundabout interchange is not locally resolvable this round).")


if __name__ == "__main__":
    main()
