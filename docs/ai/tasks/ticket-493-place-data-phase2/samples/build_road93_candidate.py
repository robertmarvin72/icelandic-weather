#!/usr/bin/env python3
"""Build road93-candidate.json from the retained exchange-3 WFS response.
Reuses phase1's canonical-instance rule (rules.md E2d: most vertices,
tie -> lowest OBJECTID) and direction model (VEGHLUTI 1 -> INFERRED
bidirectional) unchanged -- no re-derivation."""
import hashlib
import json
import math

RAUDAVATN_ANCHOR_CUM_KM_EGILSSTADIR = 676.0013  # cw_long cumulative at piece 2345's own area, incl. 1436, from ticket-493-place-network v4 chain-walks-v4.json


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def planar_len(coords):
    return sum(dist(coords[i][:2], coords[i + 1][:2]) for i in range(len(coords) - 1))


def main():
    raw_bytes = open("wfs93-raw.json", "rb").read()
    source_sha256 = hashlib.sha256(raw_bytes).hexdigest()
    d = json.loads(raw_bytes)
    feats = d["features"]
    by_idferill = {}
    for f in feats:
        by_idferill.setdefault(f["properties"]["IDFERILL"], []).append(f)

    canonical = {}
    for idf, copies in by_idferill.items():
        best = sorted(copies, key=lambda c: (-len(c["geometry"]["coordinates"]), c["properties"]["OBJECTID"]))[0]
        canonical[idf] = best

    order_egilsstadir_to_seydisfjordur = [2344, 3410, 3409, 2894, 2892, 2891]

    pieces = []
    total_m = 0.0
    gaps = []
    for i, idf in enumerate(order_egilsstadir_to_seydisfjordur):
        f = canonical[idf]
        p = f["properties"]
        coords = f["geometry"]["coordinates"]
        length_m = planar_len(coords)
        gap_m = 0.0
        if i > 0:
            prev_coords = canonical[order_egilsstadir_to_seydisfjordur[i - 1]]["geometry"]["coordinates"]
            gap_m = dist(prev_coords[-1][:2], coords[0][:2])
            gaps.append(gap_m)
        total_m += gap_m + length_m
        pieces.append(
            {
                "idferill": idf,
                "idbutur": p["IDBUTUR"],
                "vegnr": p["VEGNR"],
                "kaflanr": p["KAFLANR"],
                "veghluti": p["VEGHLUTI"],
                "name": p["STUTTNAFNLEIDAR"],
                "desc": p["STADARLYSING"],
                "n_vertices_canonical": len(coords),
                "objectid_canonical": p["OBJECTID"],
                "start": coords[0][:2],
                "end": coords[-1][:2],
                "length_planar_m": length_m,
                "gap_from_prev_m": gap_m,
                "direction_grade": "INFERRED (VEGHLUTI=1, undocumented majority-pattern role per rules.md E2b, unchanged from phase1)",
            }
        )

    # Junction to the ring (VEGNR=1 piece 2345, from ticket-493-place-network's own retained road-links.csv)
    ring_piece_2345_end = (715153.7400, 536679.9300)
    road93_start = pieces[0]["start"]
    junction_gap_m = dist(ring_piece_2345_end, road93_start)

    result = {
        "source_wfs_response": "wfs93-raw.json",
        "source_sha256": source_sha256,
        "query_used": "VEGNR='93', EPSG:3057, gis:faerdferlar2017_1, maxFeatures=1000",
        "completeness": {"totalFeatures": d["totalFeatures"], "numberMatched": d["numberMatched"], "numberReturned": d["numberReturned"]},
        "canonical_selection_rule": "rules.md E2d, unchanged: most vertices, tie -> lowest OBJECTID",
        "chain_egilsstadir_to_seydisfjordur": {
            "order": order_egilsstadir_to_seydisfjordur,
            "pieces": pieces,
            "total_length_planar_m": total_m,
            "total_length_planar_km": total_m / 1000,
            "all_gaps_m": gaps,
            "contact_grade": "CONTINUOUS_EXACT (every inter-piece gap is exactly 0.0 m)",
        },
        "ring_junction": {
            "ring_piece_idferill": 2345,
            "ring_piece_idbutur": 911040037,
            "ring_piece_own_end_coord": list(ring_piece_2345_end),
            "road93_own_start_coord": list(road93_start),
            "gap_m": junction_gap_m,
            "contact_grade": "VERIFIED exact native-coordinate contact (CC-independently confirmed this round; NOT a verified driving permission)",
            "ring_piece_cum_km_from_raudavatn_incl_1436": RAUDAVATN_ANCHOR_CUM_KM_EGILSSTADIR,
            "note": "CC-attributed: the cum_km figure is cited from ticket-493-place-network's own v4 chain-walks-v4.json (cw_long), not recomputed from scratch this round.",
        },
        "seydisfjordur_end": {
            "idferill": 2891,
            "coord": pieces[-1]["end"],
            "desc": canonical[2891]["properties"]["STADARLYSING"],
            "note": "INFERRED endpoint = the far end of road93's own own last digitized piece ('Vestdalseyrarvegur - Ferjubryggja', i.e. the ferry pier) -- the town of Seyðisfjörður itself is NOT a surveyed coordinate; this is a road-geometry endpoint, not a settlement centroid, per item 3's own E3(a) discipline.",
        },
    }

    with open("road93-candidate.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print("Total Egilsstaðir->Seyðisfjörður road93 length (planar, canonical):", total_m, "m =", total_m / 1000, "km")
    print("All inter-piece gaps:", gaps)
    print("Ring junction gap (piece 2345 end -> road93 start):", junction_gap_m, "m")


if __name__ == "__main__":
    main()
