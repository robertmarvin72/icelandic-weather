"""Work Package 3/4 — fresh road-state/closure semantics, point-incident
association, and station-to-segment distance.

N1 (correction v3) — the v2 version of this script used NEAREST-VERTEX
distance (haversine to each coordinate in the geometry) for both the
point-incident association check and the station distance check. That is
wrong when a point's true closest approach is in the MIDDLE of a line
segment, not at one of its sampled vertices -- which is exactly what
happened for point-incident 67862 (reported as "310m, unreconciled
discrepancy" in v2; that figure was a vertex-method artefact, now WITHDRAWN).
This version uses point-to-POLYLINE distance (clamped projection onto each
consecutive pair of vertices, not just the vertices themselves):
  - For point-incidents: native EPSG:3057 (ISN93) metres, using the
    point's own retained Austur/Nordur fields and the nationwide VEGNR=1
    tier-0 geometry (wfs-vegnr1-all.json) -- no reprojection needed, this
    is the same CRS both already live in.
  - For station distance: no retained station ISN93 coordinate exists, and
    no verified WGS84->ISN93 transform is available locally (confirmed in
    #429/#483's own tool checks) -- per N2's explicit allowance, a
    declared LOCAL TANGENT-PLANE metric (equirectangular approximation
    around the first vertex of each line) is used instead on the WGS84
    chain geometry. This is a stated, bounded approximation for short
    distances (a few km), not a geodetic transform, and is clearly labelled
    as such -- it is not an imported, unretained projection.

N3 additions: export-vs-acquisition lag, full-ID suffix check.

C2 (correction v4) -- N3 was incomplete: ages were only computed against
the acquisition (fetch) time, not also against the export (DagsKeyrtUt)
reference; no check existed for missing/unparseable timestamps, negative
ages, assessment-after-export, export-after-acquisition, or
valid-until-before-registration; and point-incidents had no age of their
own computed (only the export/acquisition lag for the whole feed). This
version adds all of those, for the 13 chain segments and the point-
incidents already under examination (67861, 67862, 73801), and prints
"no findings" explicitly when a check turns up nothing -- a quality-check
pass with no printed result would be indistinguishable from one that
was never run.
N7: removed the within-3km LENGTH-SHARE percentage (it used a
midpoint-sampling method mislabelled "vertex-by-vertex" in v2, and
computing a properly fine-grained version was judged unnecessary complexity
for this round) -- station proximity is now reported as nearest-line
distance only, with whole-span coverage left explicitly UNKNOWN.
"""
import math
import sys
from datetime import datetime, timezone
sys.path.insert(0, ".")
from _shared import print_input_manifest, load_json, sample_path, CHAIN_ORDER
from collections import Counter

LEGACY = "legacy-faerd-fresh.json"
LEGACY_HEADERS = "legacy-faerd-fresh-headers.txt"
POINTS = "legacy-faerdpunktar.json"
POINTS_HEADERS = "legacy-faerdpunktar-headers.txt"
NATIONWIDE_3057 = "wfs-vegnr1-all.json"
CHAIN_4326 = "wfs-chain-4326.json"

STATIONS = [
    ("Hellisheidi", 31392, 64.0187836, -21.3423805, 252090037),
    ("Sandskeid", 31488, 64.06243, -21.557644, 253020037),
]


def parse_ts(value):
    """Parse a DATEX/legacy timestamp string; return None (not an
    exception) for missing/unparseable values, so callers can report a
    quality finding instead of crashing."""
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def read_request_time(headers_file):
    with open(sample_path(headers_file), encoding="utf-8") as f:
        text = f.read()
    line = [l for l in text.splitlines() if l.startswith("REQUEST_TIME_UTC:")][0]
    return datetime.strptime(line.split(": ", 1)[1].strip(), "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def point_to_segment_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def point_to_polyline_isn93(px, py, coords):
    """coords are [easting, northing, z] ISN93 points -- no reprojection."""
    best = None
    for i in range(len(coords) - 1):
        d = point_to_segment_dist(px, py, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1])
        if best is None or d < best:
            best = d
    return best


def local_xy(lon, lat, lon0, lat0):
    """Equirectangular local tangent-plane metre approximation around
    (lon0, lat0). Stated limitation: valid only for short distances
    (a few km); not a geodetic transform."""
    R = 6371000.0
    x = math.radians(lon - lon0) * math.cos(math.radians(lat0)) * R
    y = math.radians(lat - lat0) * R
    return x, y


def point_to_polyline_local_metric(lon, lat, coords):
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


def self_check_point_to_polyline():
    """Item 4 (v4) -- a minimal, synthetic (SYNTHETIC, not live coverage)
    regression check: a point offset perpendicular from the MIDPOINT of a
    two-vertex line, at a known distance, must return that known offset --
    not the (larger) distance to either vertex. This is exactly the defect
    class N1 found and fixes: a nearest-vertex implementation would fail
    this check, a correct point-to-polyline one passes it."""
    # Line from (0,0) to (0,100) in a local metre-like coordinate space;
    # test point offset 7m perpendicular from the midpoint (0,50).
    ax, ay, bx, by = 0.0, 0.0, 0.0, 100.0
    px, py = 7.0, 50.0
    line_dist = point_to_segment_dist(px, py, ax, ay, bx, by)
    vertex_dist = min(math.hypot(px - ax, py - ay), math.hypot(px - bx, py - by))
    ok = abs(line_dist - 7.0) < 1e-6 and line_dist < vertex_dist
    print(f"SELF-CHECK (SYNTHETIC, not live coverage): point (7,50) vs line (0,0)-(0,100): "
          f"line_distance={line_dist:.6f} (expected 7.0), nearest_vertex_distance={vertex_dist:.3f} "
          f"(a nearest-VERTEX implementation would wrongly return this). "
          f"{'PASS' if ok else '** FAIL -- REGRESSION TO NEAREST-VERTEX BEHAVIOUR **'}")
    assert ok, "point_to_segment_dist regressed to nearest-vertex behaviour"
    print()


def main():
    self_check_point_to_polyline()
    print_input_manifest([LEGACY, POINTS, NATIONWIDE_3057, CHAIN_4326])

    legacy = load_json(LEGACY)
    print(f"fresh nationwide legacy records: {len(legacy)}")
    c = Counter(r["AstandYfirbord"] for r in legacy)
    print(f"AstandYfirbord distribution: {dict(c)}")
    lokad = [r for r in legacy if r["AstandYfirbord"] == "LOKAD"]
    print(f"LOKAD records (fresh, nationwide): {len(lokad)}")
    for r in lokad:
        print(f"  IdButur={int(r['IdButur'])} {r.get('StuttNafnButs')!r}")
    print()

    # N3 -- full-ID suffix check (reproduced, not merely asserted)
    all_suffixes = {str(int(r["IdButur"]))[-4:] for r in legacy}
    print(f"N3/A1 -- distinct last-4-digit IdButur suffixes nationwide: {sorted(all_suffixes)} "
          f"(2019 document's own examples end in 0010/0006 -- a different version generation)")
    print()

    leg_by_id = {int(r["IdButur"]): r for r in legacy}
    fetch_time = read_request_time(LEGACY_HEADERS)
    print(f"Fetch (acquisition) time for legacy-faerd-fresh.json: {fetch_time.isoformat()}")
    dagskeyrtut_set = {r["DagsKeyrtUt"] for r in legacy}
    print(f"DagsKeyrtUt (export time) values present: {dagskeyrtut_set}")
    if len(dagskeyrtut_set) == 1:
        export_time = datetime.strptime(next(iter(dagskeyrtut_set)), "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        lag = fetch_time - export_time
        print(f"N3 -- export-to-acquisition lag (fetch time minus DagsKeyrtUt): {lag}")
    print()

    export_time_val = datetime.strptime(next(iter(dagskeyrtut_set)), "%Y-%m-%dT%H:%M:%SZ").replace(
        tzinfo=timezone.utc) if len(dagskeyrtut_set) == 1 else None

    print("Chain segment fresh road-state AND assessment age vs BOTH reference timestamps "
          "(C2/N3 -- acquisition=fetch time, export=DagsKeyrtUt; not an SLA claim):")
    ages = []
    quality_findings = []
    for idb in CHAIN_ORDER:
        r = leg_by_id.get(idb)
        if r is None:
            print(f"  {idb}: MISSING -- must yield 'unavailable', not silently skipped")
            quality_findings.append(f"{idb}: segment missing from fresh export entirely")
            continue
        ds = parse_ts(r.get("DagsSkrad"))
        export_ts = parse_ts(r.get("DagsKeyrtUt"))
        if ds is None:
            quality_findings.append(f"{idb}: DagsSkrad missing/unparseable ({r.get('DagsSkrad')!r})")
            print(f"  {idb}: {r['AstandYfirbord']}  DagsSkrad UNPARSEABLE/MISSING -- age UNKNOWN")
            continue
        age_acq = fetch_time - ds
        age_exp = (export_ts - ds) if export_ts is not None else None
        ages.append(age_acq)
        if age_acq.total_seconds() < 0:
            quality_findings.append(f"{idb}: NEGATIVE age vs acquisition ({age_acq}) -- DagsSkrad is "
                                     f"AFTER the fetch time, a clock/data inconsistency")
        if export_ts is not None and ds > export_ts:
            quality_findings.append(f"{idb}: assessment ({ds.isoformat()}) is AFTER the export time "
                                     f"({export_ts.isoformat()}) -- DagsSkrad-after-export inconsistency")
        print(f"  {idb}: {r['AstandYfirbord']}  DagsSkrad(registration)={r['DagsSkrad']}  "
              f"age_vs_acquisition={age_acq}  age_vs_export={age_exp}")
    print()
    if export_time_val is not None and export_time_val > fetch_time:
        quality_findings.append(f"feed-level: export time ({export_time_val.isoformat()}) is AFTER "
                                 f"acquisition ({fetch_time.isoformat()}) -- export-after-acquisition "
                                 f"inconsistency")
    old_cohort = [a for a in ages if a.total_seconds() > 15 * 3600]
    print(f"Segments with assessment age > 15h (the 02:55-02:58Z cluster): {len(old_cohort)} of {len(ages)}")
    print(f"Age range across all 13 segments (vs acquisition): {min(ages)} to {max(ages)}")
    print("Documented expectation (A6): state changes at least once per 24h -- a ~16h age is "
          "within that expectation, not a breach; it is an age to DISPLAY. Cause of the "
          "02:55Z cluster remains UNKNOWN.")
    print()
    print(f"QUALITY FINDINGS (segments): {quality_findings if quality_findings else 'NONE FOUND -- '
          'no missing/unparseable/negative/inconsistent timestamp detected among the 13 chain segments'}")
    print()
    print("PROPOSED DISPLAY/STALE/EXPIRY RULE (N3 -- a labelled product/engineering proposal, "
          "NOT a meteorological safety threshold or a documented SLA):")
    print("  1. Always surface each source's own timestamp(s) and the computed age next to it.")
    print("  2. An unknown/missing timestamp means UNKNOWN freshness -- never silently treated as fresh.")
    print("  3. An expired point-incident (past its GildirTil) is not active for that valid-time "
          "context, but this is NOT proof the road is clear -- absence of an active notice is "
          "not evidence of safety.")
    print("  4. A known closure (LOKAD / ALLUR_AKSTUR_BANN) is never cancelled by a favourable "
          "forecast -- closure data always takes precedence for display purposes.")
    print("  5. Missing, conflicting, or over-age REQUIRED source data yields 'unavailable' or "
          "'limited' output for that segment -- never a silent fallback to 'open'/'clear'.")
    print("  6. Any numeric age cutoff used for a 'stale' flag is an explicit, labelled product "
          "choice (e.g. 'flag if assessment age > 20h') -- never presented as an official or "
          "safety-derived threshold.")
    print("  GildirTil values reaching into 2029 describe long-running roadworks permits -- they "
          "are NOT a guarantee that the work is ongoing at any particular future ETA, nor proof "
          "of a recent re-assessment; they should be displayed with their own registration date.")
    print()

    points = load_json(POINTS)
    chain_set = set(CHAIN_ORDER)
    print(f"faerdpunktar2017_1 nationwide point-incidents: {len(points)}")
    astand_counts = Counter(r["Astand"] for r in points)
    print(f"Astand distribution ({len(astand_counts)} distinct values): {dict(astand_counts)}")
    documented_astand = {"VEGAVINNA", "OSLETTUR_VEGUR", "ANNAD", "ALLUR_AKSTUR_BANN", "STEINKAST",
                          "VATNASKEMMDIR"}
    undocumented = set(astand_counts) - documented_astand
    print(f"Astand values NOT in the owner-documented set: {sorted(undocumented)} "
          "(next-task AC: pass through as 'unrecognised condition, shown with source text', "
          "never dropped or mapped to clear)")
    print()

    points_fetch_time = read_request_time(POINTS_HEADERS)
    points_export = {r["DagsKeyrtUt"] for r in points}
    if len(points_export) == 1:
        exp_dt = datetime.strptime(next(iter(points_export)), "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        print(f"N3 -- faerdpunktar export-to-acquisition lag: {points_fetch_time - exp_dt}")
    print()

    d3057 = load_json(NATIONWIDE_3057)
    by_id_3057 = {}
    for f in d3057["features"]:
        p = f["properties"]
        if p["VEGNR"] != "1" or p["NAKVAEMNIFERLIS"] != 0:
            continue
        by_id_3057.setdefault(p["IDBUTUR"], []).append(f["geometry"]["coordinates"])

    print("N1 -- point-incident association, CORRECTED to point-to-POLYLINE (line) distance "
          "in native ISN93 metres (own IdButur's own tier-0 geometry), not nearest-vertex:")
    STATED_ASSOC_BOUND_M = 50
    assoc_count = 0
    on_chain_results = {}
    for r in points:
        own_idb = int(r["IdButur"])
        px, py = r["Austur"], r["Nordur"]
        own_dist = None
        if own_idb in by_id_3057:
            for coords in by_id_3057[own_idb]:
                d = point_to_polyline_isn93(px, py, coords)
                if own_dist is None or d < own_dist:
                    own_dist = d
        same_id = own_idb in chain_set
        if same_id and own_dist is not None:
            associated = own_dist < STATED_ASSOC_BOUND_M
            on_chain_results[int(r["IdPunktur"])] = (own_dist, associated)
            if associated:
                assoc_count += 1
            print(f"  IdPunktur={int(r['IdPunktur'])} Astand={r['Astand']!r} "
                  f"own_IdButur={own_idb} line_distance={own_dist:.3f}m "
                  f"ASSOCIATED(<{STATED_ASSOC_BOUND_M}m): {associated} GildirTil={r.get('GildirTil')}")
    # Nearby-but-different-ID check (e.g. 73801), reported separately, never counted as associated
    print("  Nearby events on a DIFFERENT IdButur (proximity alone, NOT associated by this rule):")
    for r in points:
        own_idb = int(r["IdButur"])
        if own_idb in chain_set:
            continue
        px, py = r["Austur"], r["Nordur"]
        best = None
        best_idb = None
        for idb in CHAIN_ORDER:
            for coords in by_id_3057.get(idb, []):
                d = point_to_polyline_isn93(px, py, coords)
                if best is None or d < best:
                    best = d
                    best_idb = idb
        if best is not None and best < 500:
            print(f"    IdPunktur={int(r['IdPunktur'])} Astand={r['Astand']!r} own_IdButur={own_idb} "
                  f"nearest_chain_segment={best_idb} line_distance={best:.1f}m -- NOT associated "
                  f"(different IdButur; proximity alone is not membership)")
    print()
    print(f"Association rule: own IdButur is a chain ID AND line-distance to that ID's own "
          f"tier-0 geometry < {STATED_ASSOC_BOUND_M}m. {assoc_count} point(s) meet both.")
    print()
    print("CORRECTION, WITHDRAWING v2's claim: v2 reported IdPunktur 67862 as ~310m from the "
          "chain geometry (an 'unreconciled discrepancy' with a reviewer lead) using "
          "NEAREST-VERTEX distance. That was a method artefact, not a real discrepancy: the "
          "correct point-to-LINE distance (above) is 0.138m, well inside the 50m bound -- "
          "67862 IS associated, matching 67861 (0.089m). Both VEGAVINNA notices ARE on the "
          "chain. The v2 'unreconciled discrepancy' text is withdrawn; so is the reviewer's own "
          "earlier 1m/15m addendum figures (also not reproducible, per the reviewer's own "
          "follow-up). 73801 remains NOT associated: different IdButur (901330037, not on the "
          "chain), nearest chain-segment line-distance 262.5m.")
    print()

    print("C2 -- point-EVENT ages (registration age vs both reference times, separate from "
          "GildirTil-based status-at-ETA) and inconsistency checks, for the 3 events already "
          "under examination:")
    points_export_val = datetime.strptime(next(iter(points_export)), "%Y-%m-%dT%H:%M:%SZ").replace(
        tzinfo=timezone.utc) if len(points_export) == 1 else None
    point_quality_findings = []
    for ip in [67861, 67862, 73801]:
        r = [x for x in points if int(x["IdPunktur"]) == ip][0]
        reg = parse_ts(r.get("DagsSkrad"))
        valid_to = parse_ts(r.get("GildirTil"))
        if reg is None:
            point_quality_findings.append(f"{ip}: DagsSkrad missing/unparseable")
            print(f"  IdPunktur={ip}: DagsSkrad UNPARSEABLE/MISSING -- registration age UNKNOWN")
            continue
        age_acq = points_fetch_time - reg
        age_exp = (points_export_val - reg) if points_export_val is not None else None
        print(f"  IdPunktur={ip}: DagsSkrad(registration)={r['DagsSkrad']}  "
              f"age_vs_acquisition={age_acq}  age_vs_export={age_exp}  GildirTil={r.get('GildirTil')}")
        if age_acq.total_seconds() < 0:
            point_quality_findings.append(f"{ip}: NEGATIVE registration age vs acquisition ({age_acq})")
        if valid_to is not None and valid_to < reg:
            point_quality_findings.append(f"{ip}: GildirTil ({r['GildirTil']}) is BEFORE DagsSkrad "
                                           f"({r['DagsSkrad']}) -- valid-until-before-registration "
                                           f"inconsistency")
        elif r.get("GildirTil") and valid_to is None:
            point_quality_findings.append(f"{ip}: GildirTil present but unparseable ({r['GildirTil']!r})")
    print(f"  QUALITY FINDINGS (point events): "
          f"{point_quality_findings if point_quality_findings else 'NONE FOUND -- no missing/negative/'
          'inconsistent timestamp detected among these 3 events'}")
    print("  Note: a long registration age (e.g. these events registered 2026-03-09, ~7.5 months "
          "before this fetch) does NOT by itself mean stale or inactive -- GildirTil governs "
          "status-at-ETA, registration age is a separate, purely descriptive quality signal.")
    print()

    print("N1 -- station-to-segment distance, CORRECTED to point-to-POLYLINE distance. No "
          "retained station ISN93 coordinate and no verified WGS84->ISN93 transform exists "
          "locally, so a declared LOCAL TANGENT-PLANE metre approximation is used on the WGS84 "
          "chain geometry instead (stated limitation: valid only for short, few-km distances; "
          "not a geodetic transform; no unretained projection parameters imported):")
    chain4326 = load_json(CHAIN_4326)
    by_id_4326 = {}
    for f in chain4326["features"]:
        p = f["properties"]
        if p["VEGNR"] != "1" or p["NAKVAEMNIFERLIS"] != 0:
            continue
        by_id_4326.setdefault(p["IDBUTUR"], []).append(f["geometry"]["coordinates"])

    for name, station_id, lat, lon, segment_id in STATIONS:
        best = None
        for coords in by_id_4326.get(segment_id, []):
            d = point_to_polyline_local_metric(lon, lat, coords)
            if best is None or d < best:
                best = d
        within = best is not None and best < 3000
        print(f"  {name} ({station_id}) -> segment {segment_id}: {best:.1f} m  "
              f"WITHIN 3km BOUND: {within}")
    print()
    print("N7 -- 'within 3km' is NEAREST-LINE distance to the station's single closest point on "
          "the segment, NOT a measured share of the segment's length. The v2 percentage figures "
          "(33%/49%) used a coarse midpoint-sampling method mislabelled 'vertex-by-vertex' and "
          "are REMOVED, not restated with a caveat -- the simpler, honestly-bounded statement is: "
          "nearest-line distance is within 3km for these two station/segment pairs; coverage of "
          "the REST of each segment's length, and of all 11 other segments, is UNKNOWN.")


if __name__ == "__main__":
    main()
