"""Shared helpers for ticket-483 research scripts. Pure stdlib, read-only,
no network, no imports of repo application code. Run with `python -B`."""
import hashlib
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "samples")


def sample_path(name):
    return os.path.join(SAMPLES_DIR, name)


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def print_input_manifest(names):
    print("## Input manifest (read-only, no network)")
    for name in names:
        p = sample_path(name) if not os.path.isabs(name) else name
        print(f"- {name}  sha256={sha256_of(p)}  bytes={os.path.getsize(p)}")
    print()


def load_json(name):
    with open(sample_path(name), encoding="utf-8") as f:
        return json.load(f)


def haversine(lon1, lat1, lon2, lat2):
    import math
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


CHAIN_ORDER = [1410010037, 903010037, 253020037, 252090037, 902030037, 902040037,
               901130037, 901230037, 901220037, 901210037, 901050037, 901040037, 801100037]

SEGMENT_TO_SPAN = {
    1410010037: 1, 903010037: 1, 253020037: 1, 252090037: 1,
    902030037: 2,
    902040037: 3, 901130037: 3,
    901230037: 4,
    901220037: 5, 901210037: 5, 901050037: 5,
    901040037: 6, 801100037: 6,
}

TIE_TOLERANCE_M = 1.0
SANITY_MAX_M = 5000


def local_xy(lon, lat, lon0, lat0):
    """Equirectangular local tangent-plane metre approximation around
    (lon0, lat0). Stated limitation: valid only for short distances
    (a few km); not a geodetic transform. Shared by harness/03 and 04/05
    so the method cannot silently diverge between scripts."""
    import math
    R = 6371000.0
    x = math.radians(lon - lon0) * math.cos(math.radians(lat0)) * R
    y = math.radians(lat - lat0) * R
    return x, y


def point_to_segment_dist(px, py, ax, ay, bx, by):
    import math
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def point_to_polyline_local(lon, lat, coords):
    lon0, lat0 = coords[0][0], coords[0][1]
    px, py = local_xy(lon, lat, lon0, lat0)
    best = None
    for i in range(len(coords) - 1):
        ax, ay = local_xy(coords[i][0], coords[i][1], lon0, lat0)
        bx, by = local_xy(coords[i + 1][0], coords[i + 1][1], lon0, lat0)
        d = point_to_segment_dist(px, py, ax, ay, bx, by)
        if best is None or d < best:
            best = d
    return best


def point_to_polyline_isn93(px, py, coords):
    """coords are [easting, northing, z] ISN93 points -- no reprojection."""
    best = None
    for i in range(len(coords) - 1):
        d = point_to_segment_dist(px, py, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
        if best is None or d < best:
            best = d
    return best


def derive_forecast_mapping(chain_forecast_name="openmeteo-chain.json", chain_4326_name="wfs-chain-4326.json"):
    """C1 (v4) -- the single, shared, geometry-derived point->segment->span
    mapping. Both harness/04 (detailed report) and harness/05 (CSV
    cross-check) call THIS function, so the two scripts cannot silently
    disagree about which spans have an interior forecast point. Returns
    (mapping, span_status) where mapping is a list of
    (nearest_idb, ties, spans_tied) or None per requested point, and
    span_status is {span: "interior"|"boundary_only"|"none"}.
    """
    import re
    with open(sample_path("openmeteo-chain-headers.txt"), encoding="utf-8") as f:
        header_text = f.read()
    url_line = [l for l in header_text.splitlines() if l.startswith("URL:")][0]
    lat_m = re.search(r"latitude=([0-9.,\-]+)&", url_line)
    lon_m = re.search(r"longitude=([0-9.,\-]+)&", url_line)
    req_lats = [float(x) for x in lat_m.group(1).split(",")]
    req_lons = [float(x) for x in lon_m.group(1).split(",")]

    d4326 = load_json(chain_4326_name)
    by_id = {}
    for f in d4326["features"]:
        p = f["properties"]
        if p["VEGNR"] != "1" or p["NAKVAEMNIFERLIS"] != 0:
            continue
        by_id.setdefault(p["IDBUTUR"], []).append(f["geometry"]["coordinates"])

    mapping = []
    for lat, lon in zip(req_lats, req_lons):
        dists = []
        for idb in CHAIN_ORDER:
            best = None
            for coords in by_id.get(idb, []):
                dd = point_to_polyline_local(lon, lat, coords)
                if best is None or dd < best:
                    best = dd
            dists.append((best, idb))
        dists.sort(key=lambda x: x[0])
        nearest_dist, nearest_idb = dists[0]
        if nearest_dist > SANITY_MAX_M:
            mapping.append(None)
            continue
        ties = [idb for dd, idb in dists if dd <= nearest_dist + TIE_TOLERANCE_M]
        spans_tied = sorted({SEGMENT_TO_SPAN[idb] for idb in ties})
        mapping.append((nearest_idb, ties, spans_tied))

    span_point_count = {s: 0 for s in range(1, 7)}
    span_interior_only = {s: 0 for s in range(1, 7)}
    for m in mapping:
        if m is None:
            continue
        _, ties, spans_tied = m
        for s in spans_tied:
            span_point_count[s] += 1
        if len(spans_tied) == 1:
            span_interior_only[spans_tied[0]] += 1

    span_status = {}
    for s in range(1, 7):
        if span_point_count[s] == 0:
            span_status[s] = "none"
        elif span_interior_only[s] == 0:
            span_status[s] = "boundary_only"
        else:
            span_status[s] = "interior"

    return mapping, span_status, (req_lats, req_lons)
