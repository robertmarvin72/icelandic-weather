"""R4/R9 — single consistent checkpoint-count table from coverage.csv, to
replace the first-page prose counts that Jonesy's R4 review found did not
match the CSV.

Method: parse coverage.csv (stdlib csv module) and compute, per route and
overall: row count, unique checkpoint identity (by checkpoint name; cross-
route duplicates, e.g. the shared Hvalfjardargong tunnel and the shared
Borgarnes destination/checkpoint, are reported explicitly rather than
double-counted), how many rows have a coordinate graded VERIFIED SAMPLE,
how many have a road-state match (road_state_idbutur != UNKNOWN), how many
have a geometry_join_result starting with VERIFIED SAMPLE, how many have a
measured value from either network, and how many have a real
forecast_fetched_utc timestamp. This script is the single source for every
page-1 count in research-report.md and next-task-proposal.md -- no count is
hand-typed into those documents without matching this output.

Strengthened v3 (Jonesy's v2 re-check): a "geometry_join_result starts with
VERIFIED SAMPLE" count is not, by itself, proof that a real, route-specific
WFS geometry join exists -- a free-text cell could say that without an
actual sample backing it (exactly what happened in v1/v2 for Route B/C,
caught by Jonesy). This version additionally cross-checks every such row's
own `road_state_idbutur` value(s) against the actual `IDBUTUR` set present
in the retained Route A WFS GeoJSON sample (the only WFS sample this round
has), excluding any ID mentioned only to document an exclusion (the
Hellisheidi-eystri decoy). A row only counts toward "geometry confirmed" if
BOTH its label says VERIFIED SAMPLE AND at least one of its actually-used
IDBUTUR values is a real member of that WFS sample's IDBUTUR set -- a
mere textual label is not accepted on its own. This will fail loudly (the
two counts will visibly disagree) if coverage.csv's prose ever drifts from
the real retained sample again.
"""
import csv
import json
import re
import sys
sys.path.insert(0, ".")
from _shared import print_input_manifest, sample_path, load_json
import os

INPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "coverage.csv")
WFS_SAMPLE = "vegagerdin-wfs-routeA-geometry.json"


def sha256_file(path):
    import hashlib
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def real_ids_in_cell(raw):
    """Extract the actually-used IdButur/IDBUTUR values from a
    road_state_idbutur free-text cell, excluding any ID mentioned only to
    document an exclusion (e.g. the Hellisheidi-eystri decoy). Shared by
    the per-route geometry check and the corridor closure cross-check so
    both use the exact same definition of "actually used"."""
    used, excluded = [], []
    for m in re.finditer(r"\d{6,}", raw):
        idb = int(m.group(0))
        window_before = raw[max(0, m.start() - 60):m.start()]
        window_after = raw[m.start():m.start() + 100]
        is_excluded_mention = "exclud" in window_before.lower() or "exclud" in window_after.lower()
        (excluded if is_excluded_mention else used).append(idb)
    return used, excluded


def main():
    print("## Input manifest")
    print(f"- coverage.csv  sha256={sha256_file(INPUT_PATH)}  bytes={os.path.getsize(INPUT_PATH)}")
    wfs = load_json(WFS_SAMPLE)
    wfs_idbutur_set = {f["properties"]["IDBUTUR"] for f in wfs["features"]}
    print(f"- {WFS_SAMPLE}  sha256={sha256_file(sample_path(WFS_SAMPLE))}  "
          f"bytes={os.path.getsize(sample_path(WFS_SAMPLE))}  "
          f"(unique IDBUTUR in this sample: {sorted(wfs_idbutur_set)})")
    print()

    with open(INPUT_PATH, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print(f"total data rows: {len(rows)}")
    by_route = {}
    for r in rows:
        by_route.setdefault(r["route"], []).append(r)
    for route, rs in by_route.items():
        print(f"  {route}: {len(rs)} rows")
    print()

    names_by_route = {route: [r["checkpoint"] for r in rs] for route, rs in by_route.items()}
    all_names = [n for rs in names_by_route.values() for n in rs]
    unique_names = sorted(set(all_names))
    print(f"unique checkpoint identities (by name, across all routes): {len(unique_names)}")
    dup_names = {n for n in unique_names if all_names.count(n) > 1}
    print(f"names appearing on more than one route (shared checkpoint, not double-counted "
          f"as distinct locations): {sorted(dup_names)}")
    print()

    def grade_starts_with(rows_, col, prefix):
        return [r for r in rows_ if r[col].strip().upper().startswith(prefix.upper())]

    def not_unknown(rows_, col):
        return [r for r in rows_ if not r[col].strip().upper().startswith("UNKNOWN") and r[col].strip() != ""]

    def geometry_confirmed(rows_):
        """Strengthened v3: a row counts only if its geometry_join_result
        label says VERIFIED SAMPLE AND at least one of its actually-used
        (non-excluded-mention) IdButur values is a real member of the
        retained Route A WFS sample's IDBUTUR set. A label alone is not
        enough -- this is the fix for the Route B/C mislabeling Jonesy caught."""
        out = []
        for r in rows_:
            if not r["geometry_join_result"].strip().upper().startswith("VERIFIED SAMPLE"):
                continue
            used, _excluded = real_ids_in_cell(r["road_state_idbutur"])
            if any(idb in wfs_idbutur_set for idb in used):
                out.append(r)
        return out

    print("Per-route capability counts (each computed directly from the named column; "
          "see coverage.csv for the exact per-row values):")
    print()
    header = f"{'route':28s} {'rows':>5s} {'coord=VERIFIED SAMPLE':>23s} {'road_state matched':>20s} " \
             f"{'geometry_join VERIFIED SAMPLE':>30s} {'has measured value':>19s} {'forecast fetched':>17s}"
    print(header)
    totals = {"coord": 0, "road_state": 0, "geom": 0, "measured": 0, "forecast": 0}
    for route, rs in by_route.items():
        coord_v = grade_starts_with(rs, "coord_grade", "VERIFIED SAMPLE")
        road_v = not_unknown(rs, "road_state_idbutur")
        geom_v = geometry_confirmed(rs)
        label_only_v = grade_starts_with(rs, "geometry_join_result", "VERIFIED SAMPLE")
        if len(label_only_v) != len(geom_v):
            print(f"  ** MISMATCH for {route}: {len(label_only_v)} row(s) say VERIFIED SAMPLE in "
                  f"geometry_join_result but only {len(geom_v)} have an actually-used IdButur "
                  f"present in the retained WFS sample -- investigate before trusting this count **")
        measured_v = [r for r in rs if not_unknown([r], "datex_air_temp_c") or
                      (r["vedur_obs_sample_time_utc"].strip().upper() not in ("NOT TESTED", "UNKNOWN", ""))]
        forecast_v = [r for r in rs if r["forecast_fetched_utc"].strip().upper() not in ("NOT TESTED", "UNKNOWN", "N/A", "")]
        print(f"{route:28s} {len(rs):5d} {len(coord_v):23d} {len(road_v):20d} "
              f"{len(geom_v):30d} {len(measured_v):19d} {len(forecast_v):17d}")
        totals["coord"] += len(coord_v)
        totals["road_state"] += len(road_v)
        totals["geom"] += len(geom_v)
        totals["measured"] += len(measured_v)
        totals["forecast"] += len(forecast_v)
    print(f"{'TOTAL (sum of rows, duplicates counted once per route)':28s} {len(rows):5d} "
          f"{totals['coord']:23d} {totals['road_state']:20d} {totals['geom']:30d} "
          f"{totals['measured']:19d} {totals['forecast']:17d}")
    print()

    coord_v_all = grade_starts_with(rows, "coord_grade", "VERIFIED SAMPLE")
    coord_v_unique_names = sorted({r["checkpoint"] for r in coord_v_all})
    print(f"rows with coord_grade VERIFIED SAMPLE (any route): {len(coord_v_all)}")
    print(f"unique checkpoint NAMES among those rows: {len(coord_v_unique_names)} -> {coord_v_unique_names}")
    print()

    # Corridor road-state snapshot: every road_state_idbutur value actually
    # present in the CSV, cross-checked here against the retained legacy
    # feed and DATEX RoadConditionService sample for a closure/situation record.
    # Uses the same real_ids_in_cell() helper as the geometry check above, so
    # "actually used" is defined identically in both places.
    legacy = load_json("vegagerdin-faerd2017-1.json")
    legacy_by_id = {int(r["IdButur"]): r for r in legacy}
    rc_text = open(sample_path("datex-roadcondition.xml"), encoding="utf-8").read()
    rc_situation_ids = set(int(x) for x in re.findall(r'<q1:situation id="IRCA_ROADCONDITIONS_(\d+)"', rc_text))

    print("Corridor IdButur values referenced in coverage.csv, with their legacy AstandYfirbord "
          "at fetch time and whether a DATEX RoadConditionService situation exists for that ID "
          "in the retained sample:")
    seen_ids = set()
    excluded_ids = set()
    for r in rows:
        raw = r["road_state_idbutur"]
        used, excluded = real_ids_in_cell(raw)
        for idb in used:
            if idb in seen_ids:
                continue
            seen_ids.add(idb)
            leg = legacy_by_id.get(idb)
            astand = leg["AstandYfirbord"] if leg else "NOT IN LEGACY FEED"
            has_dc = idb in rc_situation_ids
            print(f"  IdButur={idb}  checkpoint-row={r['checkpoint']!r} ({r['route']})  "
                  f"AstandYfirbord={astand}  DATEX RoadCondition situation present: {has_dc}")
        for idb in excluded:
            if idb in excluded_ids:
                continue
            excluded_ids.add(idb)
            leg = legacy_by_id.get(idb)
            astand = leg["AstandYfirbord"] if leg else "NOT IN LEGACY FEED"
            has_dc = idb in rc_situation_ids
            print(f"  IdButur={idb}  checkpoint-row={r['checkpoint']!r} ({r['route']})  "
                  f"AstandYfirbord={astand}  DATEX RoadCondition situation present: {has_dc} "
                  f"[MENTIONED ONLY TO DOCUMENT EXCLUSION -- not an actually-used segment]")
    print()
    print(f"IdButur values actually used (excluding the documented-exclusion decoy): {len(seen_ids)}")
    print(f"IdButur values mentioned only to document an exclusion: {sorted(excluded_ids)}")
    print(f"Of the {len(seen_ids)} actually-used IDs, with a DATEX RoadConditionService "
          f"situation record in the retained sample: {sum(1 for i in seen_ids if i in rc_situation_ids)}")
    if excluded_ids:
        for idb in sorted(excluded_ids):
            leg = legacy_by_id.get(idb)
            print(f"  (side note: excluded decoy IdButur={idb} itself has AstandYfirbord="
                  f"{leg['AstandYfirbord'] if leg else 'NOT IN LEGACY FEED'} and DATEX situation "
                  f"present: {idb in rc_situation_ids} -- irrelevant to any corridor, since it is "
                  f"a different real-world location; kept only as a side observation.)")
    print("(An absent DATEX record must not be read as 'open' or 'checked' -- it means no "
          "situation was published for that ID at this snapshot, nothing more.)")


if __name__ == "__main__":
    main()
