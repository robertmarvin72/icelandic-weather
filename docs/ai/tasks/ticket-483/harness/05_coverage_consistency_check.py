"""Single source of truth for coverage.csv/route-segments.csv counts used
on research-report.md's page 1 -- mirrors #429's harness/05 lesson: every
headline number must be regenerable from a structured file, not hand-typed
prose. Read-only, no network.

C1 (correction v4) -- this script previously trusted coverage.csv's
forecast_cap cells at face value. That is exactly how the v3 round's
inconsistency slipped through: harness/04 correctly found span 5 is
boundary-only (same as span 4), but nothing cross-checked coverage.csv
against that finding, so the CSV kept saying PASS. This version calls the
SAME shared `derive_forecast_mapping()` function harness/04 uses and FAILS
LOUDLY if coverage.csv's forecast_cap column disagrees with the
geometry-derived span status for any resolved span.
"""
import csv
import os
import sys
sys.path.insert(0, ".")
from _shared import sha256_of, derive_forecast_mapping

ROOT = os.path.join(os.path.dirname(__file__), "..")


def main():
    for fn in ["coverage.csv", "route-segments.csv"]:
        p = os.path.join(ROOT, fn)
        print(f"- {fn}  sha256={sha256_of(p)}  bytes={os.path.getsize(p)}")
    print()

    with open(os.path.join(ROOT, "route-segments.csv"), encoding="utf-8") as f:
        segs = list(csv.DictReader(f))
    total_km_with_rings = sum(float(r["length_km_vegnr1_tier0"]) for r in segs)
    total_roundabout = sum(float(r["roundabout_km"]) for r in segs)
    total_km_without_rings = total_km_with_rings - total_roundabout
    print("C3 (v4) -- length labelled with its geometry-inclusion sensitivity explicitly, "
          "not printed as one bare number beside harness/02's range:")
    print(f"route-segments.csv: {len(segs)} segments, total VEGNR=1-only tier-0 length "
          f"{total_km_without_rings:.2f} km WITHOUT full roundabout rings, "
          f"{total_km_with_rings:.2f} km WITH full roundabout rings "
          f"(of which {total_roundabout:.2f} km is the roundabout contribution) -- "
          f"a range (geometry-inclusion sensitivity), not a single proven driven distance "
          f"(see harness/02 for the full tier-sensitivity table and the separate ISN93 planar "
          f"cross-check, never summed with this spherical figure)")
    all_greidfaert = all(r["astand"] == "GREIDFAERT" for r in segs)
    print(f"all segments GREIDFAERT at fresh fetch: {all_greidfaert}")
    ages = [float(r["dagsskrad_age_h"]) for r in segs]
    print(f"DagsSkrad age range: {min(ages):.1f}h to {max(ages):.1f}h; "
          f"{sum(1 for a in ages if a > 15)} of {len(ages)} segments older than 15h")
    print()

    with open(os.path.join(ROOT, "coverage.csv"), encoding="utf-8") as f:
        spans = list(csv.DictReader(f))
    print(f"coverage.csv: {len(spans)} spans")
    for col in ["geometry_cap", "road_state_cap", "observation_cap", "forecast_cap",
                "freshness_cap", "access_cap"]:
        from collections import Counter
        print(f"  {col}: {dict(Counter(r[col] for r in spans))}")
    print()

    resolved_spans = [r for r in spans if r["span"] != "0"]
    span0 = [r for r in spans if r["span"] == "0"]
    cap1_pass_resolved = all(r["geometry_cap"] == "PASS" for r in resolved_spans)
    cap2_pass_resolved = all(r["road_state_cap"] == "PASS" for r in resolved_spans)
    cap6_pass_all = all(r["access_cap"] == "PASS" for r in spans)
    cap4_unavailable = [r["span"] for r in spans if r["forecast_cap"] == "UNAVAILABLE"]
    print(f"N6 (v3): span 0 (Reykjavik approach) is a SEPARATE, explicitly UNRESOLVED critical "
          f"span -- not counted toward the 'every span reaches PASS' claims below, which apply "
          f"to the {len(resolved_spans)} retained, locally-resolved spans (1-6) only.")
    print(f"Capability 1 (geometry) PASS for every RESOLVED span (1-6): {cap1_pass_resolved}")
    print(f"Capability 2 (road-state) PASS for every RESOLVED span (1-6): {cap2_pass_resolved}")
    print(f"Capability 6 (access/reuse/HTTPS) PASS for every span (0-6): {cap6_pass_all}")
    print(f"Spans with capability 4 (forecast) UNAVAILABLE (no interior point): {cap4_unavailable}")
    print(f"Span 0 itself: geometry/road-state/observation/freshness all UNKNOWN (not PASS, not "
          f"FAIL) -- the Reykjavik-Vik corridor as a WHOLE (including the approach) is not fully "
          f"graded; the 13-segment Raudavatn-Vik portion is.")
    print()
    print("R1 correction (v2): approved-prompt-v1's own frozen rule says 'unresolved reuse "
          "permission or plain-HTTP-only required feed caps route at PARTIAL and overall at "
          "PARTIAL at most'. cap.6 is PARTIAL here (Open-Meteo production rights unresolved per "
          "#453; Vedurstofa terms only reused from #450, not re-verified this round; Vegagerdin "
          "terms applicability to each specific service is INFERRED, not explicit). Per that "
          "rule: ROUTE = PARTIAL, OVERALL = PARTIAL (at most) -- regardless of cap.1/cap.2 both "
          "reaching PASS for every span. The v1 round's PASS/GO conflicted with this frozen rule "
          "and is superseded, not current advice. This script does not itself assert the final "
          "grade text -- that is written in research-report.md, citing these counts.")
    print()

    print("C1 (v4) -- cross-checking coverage.csv's forecast_cap column against the SAME "
          "geometry-derived span status harness/04 computes (not a second, possibly-divergent "
          "calculation -- the identical shared function):")
    _, span_status, _ = derive_forecast_mapping()
    status_to_expected_cap = {"interior": "PASS", "boundary_only": "UNAVAILABLE", "none": "UNAVAILABLE"}
    mismatches = []
    for r in resolved_spans:
        s = int(r["span"])
        if s not in span_status:
            continue
        expected = status_to_expected_cap[span_status[s]]
        actual = r["forecast_cap"]
        match = expected == actual
        print(f"  span {s}: geometry-derived status={span_status[s]!r} -> expected forecast_cap="
              f"{expected}, coverage.csv says {actual}  {'OK' if match else '** MISMATCH **'}")
        if not match:
            mismatches.append(s)
    if mismatches:
        print(f"\n** {len(mismatches)} SPAN(S) MISMATCH BETWEEN coverage.csv AND THE GEOMETRY-"
              f"DERIVED RESULT: {mismatches} -- coverage.csv must be corrected, not this check "
              f"relaxed. This is exactly the class of error v3 left uncaught (span 5). **")
    else:
        print("\nNo mismatches -- coverage.csv's forecast_cap column agrees with harness/04's "
              "geometry-derived span status for every resolved span.")


if __name__ == "__main__":
    main()
