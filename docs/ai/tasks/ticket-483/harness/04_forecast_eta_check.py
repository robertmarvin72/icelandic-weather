"""Work Package 5 — forecast point-to-segment-to-span mapping, DERIVED from
geometry, not hardcoded.

N2 (correction v3) — the v2 version of this script defined a `POINTS` list
with literal segment/span values typed in by hand, paired with the
response by position (`zip(POINTS, d)`). That is not a derivation, it is a
restatement of a manual assumption dressed up as a mapping.

C1 (correction v4) — the mapping/span-status logic now lives in
`_shared.derive_forecast_mapping()`, a single shared, pure function. This
script and `harness/05` both call it, so the two scripts cannot silently
disagree about which spans have an interior forecast point (which is
exactly what happened in v3: this script correctly found span 5 is
boundary-only too, but `coverage.csv` still said PASS, and nothing cross-
checked that).

Real result: P1 ties between segments 903010037/1410010037 (both span 1 --
no cross-span ambiguity). P4 ties between 901130037/902040037 (both span 3
-- no cross-span ambiguity). **P5 ties between 901220037 (span 5) and
901230037 (span 4) -- a genuine cross-span boundary tie.** Both span 4 AND
span 5 therefore have NO INTERIOR point -- only this one shared boundary
point. Forecast for the interior of either span stays UNSAMPLED/UNAVAILABLE,
and the boundary point is not duplicated as evidence of whole-span coverage
for either.
"""
import sys
sys.path.insert(0, ".")
from _shared import (print_input_manifest, load_json, sample_path,
                      derive_forecast_mapping, local_xy, point_to_segment_dist)
import math

CHAIN_FORECAST = "openmeteo-chain.json"
CHAIN_4326 = "wfs-chain-4326.json"

# ETAs assumed per J8 (stated assumption, not a travel-time computation),
# assigned by the point's position in the 13-segment travel order, rounded
# to the nearest hour this hourly series provides.
ETAS = ["2026-10-29T08:00", "2026-10-29T09:00", "2026-10-29T09:00",
        "2026-10-29T10:00", "2026-10-29T11:00", "2026-10-29T12:00"]


def main():
    print_input_manifest([CHAIN_FORECAST, CHAIN_4326])

    with open(sample_path("openmeteo-chain-headers.txt"), encoding="utf-8") as f:
        header_text = f.read()
    url_line = [l for l in header_text.splitlines() if l.startswith("URL:")][0]
    print(f"Retained request URL: {url_line}")
    print(f"'wind_speed_unit' parameter present: {'wind_speed_unit' in url_line} "
          "(S1: absence explains the km/h label)")
    print()

    mapping, span_status, (req_lats, req_lons) = derive_forecast_mapping(CHAIN_FORECAST, CHAIN_4326)

    d = load_json(CHAIN_FORECAST)
    if len(d) != len(req_lats):
        print(f"** COUNT MISMATCH: {len(req_lats)} requested vs {len(d)} returned -- STOP **")
        return

    print("Geometry-derived point -> segment mapping (point-to-polyline distance, local "
          "tangent-plane metres, same method/limitation as harness/03's N1 fix):")
    for i, m in enumerate(mapping):
        lat, lon = req_lats[i], req_lons[i]
        if m is None:
            print(f"  P{i+1}: ** NO SEGMENT WITHIN SANITY DISTANCE -- UNMAPPED, FAILING LOUDLY **")
            continue
        nearest_idb, ties, spans_tied = m
        tie_note = ""
        if len(ties) > 1:
            if len(spans_tied) > 1:
                tie_note = f"  ** CROSS-SPAN TIE: spans {spans_tied} **"
            else:
                tie_note = f"  (tie within span {spans_tied[0]}, no ambiguity for span assignment)"
        print(f"  P{i+1} (req {lat},{lon}): nearest={nearest_idb}, ties={ties}{tie_note}")
    print()

    print("Per-span status (a cross-span tie counts toward BOTH spans, as a boundary point, "
          "not duplicated as interior coverage of either):")
    for s in range(1, 7):
        status = span_status[s]
        label = {"none": "NO POINT AT ALL -- forecast UNAVAILABLE",
                  "boundary_only": "NO INTERIOR point; BOUNDARY point only -- interior forecast UNSAMPLED/UNAVAILABLE",
                  "interior": "has an interior point"}[status]
        print(f"  span {s}: {label}")
    print()

    print(f"this round's hourly_units: {d[0]['hourly_units']}")
    print()
    print("Value at each point's stated (assumed, per J8) ETA, with grid-snap/elevation:")
    for i, (m, eta, p) in enumerate(zip(mapping, ETAS, d)):
        if m is None:
            continue
        nearest_idb, ties, spans_tied = m
        glat, glon = p["latitude"], p["longitude"]
        gx, gy = local_xy(glon, glat, req_lons[i], req_lats[i])
        snap_m = math.hypot(gx, gy)
        times = p["hourly"]["time"]
        if eta not in times:
            print(f"  P{i+1}: {eta} NOT IN RETURNED RANGE")
            continue
        j = times.index(eta)
        h = p["hourly"]
        vals = {k: h[k][j] for k in ["temperature_2m", "windspeed_10m", "windgusts_10m",
                                      "precipitation", "snowfall", "weathercode"]}
        print(f"  P{i+1} (segment {nearest_idb}, span(s) {spans_tied}) {eta}: {vals} "
              f"grid_snap={snap_m:.0f}m grid_elevation={p['elevation']}m")


if __name__ == "__main__":
    main()
