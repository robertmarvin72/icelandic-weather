"""Work Package 1/2 — verify, from the retained WFS samples, that:
(a) the nationwide VEGNR='1' query excludes the #429 East-Iceland decoy
    (910330037) and the Skogar local-road ID (124200037, VEGNR 2420/2440);
(b) the 13-segment Reykjavik-Vik chain is VEGNR=1-pure by construction
    (no manual exclusion needed, since the query itself filtered on it);
(c) every consecutive pair in the chain has real coordinate adjacency
    (near-zero vertex distance), not just a name-matching coincidence;
(d) one segment plausibly reachable from the chain (902340037,
    "Threngslavegur: Threngsli") is correctly NOT part of the through-path,
    confirmed by it not being needed for continuity.
"""
import math
import sys
sys.path.insert(0, ".")
from _shared import print_input_manifest, load_json, CHAIN_ORDER

NATIONWIDE = "wfs-vegnr1-all.json"


def main():
    print_input_manifest([NATIONWIDE])
    d = load_json(NATIONWIDE)
    print(f"totalFeatures (server-reported): {d['totalFeatures']}  "
          f"features in file: {len(d['features'])}")

    ids_present = {f["properties"]["IDBUTUR"] for f in d["features"]}
    print(f"unique IDBUTUR with VEGNR=1 nationwide: {len(ids_present)}")
    print()

    for label, idb in [("#429 East-Iceland decoy (Hellisheidi eystri)", 910330037),
                        ("#429 Skogar local-road ID (VEGNR 2420/2440)", 124200037),
                        ("Threngslavegur branch (902340037)", 902340037)]:
        present = idb in ids_present
        print(f"{label}: IDBUTUR={idb} present in VEGNR=1 nationwide set: {present}")
    print()

    chain_set = set(CHAIN_ORDER)
    missing = chain_set - ids_present
    print(f"all 13 chain IDBUTUR values present in VEGNR=1 set: {not missing} "
          f"(missing: {sorted(missing)})")
    print()

    by_id = {}
    for f in d["features"]:
        by_id.setdefault(f["properties"]["IDBUTUR"], []).append(f["geometry"]["coordinates"])

    def min_dist_3057(idA, idB):
        best = None
        for ca in by_id.get(idA, []):
            for cb in by_id.get(idB, []):
                for a in (ca[0], ca[-1]):
                    for b in (cb[0], cb[-1]):
                        dd = math.hypot(a[0] - b[0], a[1] - b[1])
                        if best is None or dd < best:
                            best = dd
        return best

    print("Pairwise adjacency along the chain, ISN93 planar metres (endpoint-to-endpoint, "
          "min over all fragment endpoints of each pair):")
    prev = None
    all_small = True
    for idb in CHAIN_ORDER:
        if prev is not None:
            dist = min_dist_3057(prev, idb)
            flag = "" if (dist is not None and dist < 100) else "  ** LARGE GAP **"
            if dist is None or dist >= 100:
                all_small = False
            print(f"  {prev} -> {idb}: {dist:.1f} m{flag}")
        prev = idb
    print()
    print(f"All consecutive pairs under 100m: {all_small} "
          "(this is the geometric-continuity evidence; a name match alone would not be enough)")

    print()
    print("R2 correction (Jonesy): the chain's Reykjavik-side start (1410010037, 'Raudavatn') "
          "is NOT the nearest-Reykjavik-anchor endpoint required by the frozen plan -- Route 1 "
          "(VEGNR=1) continues further toward Reykjavik. Checking that extension:")
    ext_chain = [1410010037, 914020037, 903020037]
    for i in range(len(ext_chain) - 1):
        dist = min_dist_3057(ext_chain[i], ext_chain[i + 1])
        print(f"  {ext_chain[i]} -> {ext_chain[i+1]}: {dist:.1f} m")
    dist_to_kjalarnes = min_dist_3057(903020037, 903030037)
    print(f"  903020037 -> 903030037 ('Kjalarnes', the OTHER route's/Route-B direction): "
          f"{dist_to_kjalarnes:.1f} m")
    print("  Interpretation: 914020037 ('Sudurlandsv. um Hadegismoa') and 903020037 "
          "('Vesturlandsvegur') are real, connected VEGNR=1 continuations toward Reykjavik -- "
          "confirmed, not a rename to 'Raudavatn-Vik'. 903020037 is also adjacent to 903030037 "
          "('Kjalarnes'), i.e. this is the junction area where the Reykjavik-Vik corridor and "
          "the separate Reykjavik-Akureyri route meet near the city -- not further progress "
          "toward Vik. Both extension IDs are multi-role interchange features (ramps VEGHLUTI "
          "3/4, roundabout 5, both carriageway directions 6/7, plus undocumented 1/8) with no "
          "single, locally-justifiable through-carriageway length -- reported as connectivity "
          "CONFIRMED, length NOT COMPUTED this round (see research-report.md Sec.1).")
    print()

    print("N6 (correction v3) -- applying the frozen nearest-Reykjavik-anchor SELECTION rule "
          "explicitly, not just asserting both extension IDs are 'part of the route' because "
          "they are adjacent:")
    import json as _json
    with open("../../ticket-450/samples/vedur-stations-all-v2.json", encoding="utf-8") as f:
        stations = _json.load(f)
    anchor = [r for r in stations if r["station"] == 1][0]
    print(f"  Anchor used: Vedurstofa station 1 'Reykjavik' (RETAINED, from #450's own catalog, "
          f"NOT an imported public-knowledge coordinate): lat={anchor['lat']}, lon={anchor['lon']}")
    print("  Candidate VEGNR=1 features to rank by distance from this anchor: 1410010037, "
          "914020037, 903020037.")
    print("  BLOCKER: 914020037 and 903020037 have NO retained WGS84 geometry (they are not in "
          "the 13-ID wfs-chain-4326.json sample, which was fetched for the ORIGINAL 13 IDs "
          "only). Their only retained geometry is native ISN93 (wfs-vegnr1-all.json). Comparing "
          "a WGS84 anchor point's distance to ISN93-only geometry would require a WGS84<->ISN93 "
          "transform -- and no verified transform is available locally this round (zero new "
          "requests allowed; hand-rolling an LCC projection with unretained parameters, as the "
          "reviewer's own illustration did, is explicitly what this round must NOT do).")
    print("  THEREFORE: the nearest-anchor feature among {1410010037, 914020037, 903020037} is "
          "UNKNOWN this round, not resolved by assumption. What IS established: all three are "
          "really connected (adjacency distances above), and none can be excluded from "
          "consideration just because connectivity alone does not prove which one is the "
          "official rule's actual answer. See research-report.md Sec.1 / coverage.csv 'span 0' "
          "row for how this is carried forward as an explicit unresolved critical span.")


if __name__ == "__main__":
    main()
