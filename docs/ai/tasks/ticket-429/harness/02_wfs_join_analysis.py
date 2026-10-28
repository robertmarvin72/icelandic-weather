"""R1/R3 — WFS geometry join: per-IdButur feature counts, planar (ISN93,
EPSG:3057) bounding-box extents per IdButur, and the Hellisheidi name-
collision check.

Method: parse the retained GeoJSON FeatureCollection (already reprojected
server-side to EPSG:3057 easting/northing by the WFS GetFeature response;
this script performs no reprojection of its own). For each feature's
LineString, record vertex coordinates; per IDBUTUR, aggregate the bbox
across all of that ID's fragments (there can be more than one fragment per
ID -- a many-to-one join, not one feature per ID).

Explicit limitation (per R3): this script does NOT compute a real corridor
length by stitching fragments into an ordered path -- it only reports the
planar straight-line diagonal of each ID's combined bbox, labelled as such,
because fragment ordering/connectivity was not established. A bbox diagonal
is not a route length and must not be read as one.
"""
import sys
import math
sys.path.insert(0, ".")
from _shared import print_input_manifest, load_json

INPUT = "vegagerdin-wfs-routeA-geometry.json"


def main():
    print_input_manifest([INPUT, "vegagerdin-wfs-routeA-headers.txt"])
    d = load_json(INPUT)
    print(f"type: {d['type']}  crs: {d['crs']}")
    print(f"totalFeatures (server-reported): {d['totalFeatures']}  "
          f"numberMatched: {d['numberMatched']}  numberReturned: {d['numberReturned']}")
    feats = d["features"]
    print(f"features actually present in file: {len(feats)}")
    print()

    by_id = {}
    for f in feats:
        idb = f["properties"]["IDBUTUR"]
        coords = f["geometry"]["coordinates"]
        geom_type = f["geometry"]["type"]
        by_id.setdefault(idb, {"fragments": 0, "vertices": 0, "geom_types": set(),
                                "names": set(), "xs": [], "ys": []})
        rec = by_id[idb]
        rec["fragments"] += 1
        rec["geom_types"].add(geom_type)
        rec["names"].add(f["properties"].get("STADARLYSING"))
        if geom_type == "LineString":
            pts = coords
        else:
            pts = None
        if pts:
            rec["vertices"] += len(pts)
            for p in pts:
                rec["xs"].append(p[0])
                rec["ys"].append(p[1])

    print(f"unique IDBUTUR values in this response: {len(by_id)}")
    print()
    print("Per-IDBUTUR: fragment count, total vertices, bbox (ISN93 EPSG:3057 metres), "
          "bbox-diagonal (NOT a route length -- see docstring):")
    for idb, rec in sorted(by_id.items()):
        if rec["xs"]:
            minx, maxx = min(rec["xs"]), max(rec["xs"])
            miny, maxy = min(rec["ys"]), max(rec["ys"])
            diag = math.hypot(maxx - minx, maxy - miny)
        else:
            minx = maxx = miny = maxy = diag = float("nan")
        print(f"  IDBUTUR={idb}  fragments={rec['fragments']}  vertices={rec['vertices']}  "
              f"names={sorted(n for n in rec['names'] if n)}  "
              f"bbox=({minx:.1f},{miny:.1f})-({maxx:.1f},{maxy:.1f})  bbox_diagonal_m={diag:.1f}")

    total_fragments = sum(r["fragments"] for r in by_id.values())
    print()
    print(f"sum of fragments across all IDBUTUR: {total_fragments} (must equal feature count {len(feats)})")

    print()
    print("Hellisheidi name-collision check: does IDBUTUR 910330037 appear in this "
          "Route A response?")
    present = 910330037 in by_id
    print(f"  910330037 in Route A WFS response: {present}")
    if present:
        print(f"  -> names: {sorted(n for n in by_id[910330037]['names'] if n)}")
        print(f"  -> bbox: {by_id[910330037]}")
    else:
        print("  -> confirmed ABSENT from this Route A geometry response; the collision "
              "was identified and excluded via the separate full-list CQL query against "
              "the legacy feed's StuttNafnButs/FulltNafnButs text, not from this "
              "geometry sample, which never included it to begin with.")

    print()
    print("LIMITATION (stated per R3, not a finding): fragment ordering/connectivity "
          "was not established, so no two-point distance here should be read as a "
          "route length; a bbox diagonal only bounds the extent of that ID's fragments. "
          "Example of why this matters: an ID whose fragments run in two directions "
          "along a mountain pass can show a bbox diagonal much larger than the straight "
          "road distance between its two ends would suggest, because the bbox also "
          "captures the perpendicular spread between opposite-direction carriageways.")


if __name__ == "__main__":
    main()
