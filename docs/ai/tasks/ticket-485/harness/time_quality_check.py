"""#485 correction v2, R2 — retained-data-only (ZERO network) signed time-
quality check for the 13 chain segments and point-events 67861/67862/73801.

Fixes: coverage.csv's span-1 note said "DagsSkrad ages 2-14590s", which no
retained script ever computed (a copy/approximation error). This script
computes the REAL signed age for every chain segment and point event,
against BOTH the acquisition (REQUEST_TIME_UTC from the retained headers)
and export (DagsKeyrtUt from the retained body) reference times, and
checks for missing/unparseable dates, negative ages, assessment-after-
export, and export-after-acquisition -- printing findings or an explicit
"none found", never silently clamping an unknown to 0.

Run with: python3 -B time_quality_check.py
"""
import json
import os
import re
from datetime import datetime, timezone

HERE = os.path.dirname(__file__)
SAMPLES = os.path.join(HERE, "..", "samples")

CHAIN = [1410010037, 903010037, 253020037, 252090037, 902030037, 902040037,
         901130037, 901230037, 901220037, 901210037, 901050037, 901040037, 801100037]


def parse_ts(value):
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def read_request_time(headers_file):
    with open(os.path.join(SAMPLES, headers_file), encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"REQUEST_TIME_UTC:\s*(\S+)", text)
    return parse_ts(m.group(1))


def main():
    acq_state = read_request_time("legacy-faerd-https.json-headers.txt")
    acq_points = read_request_time("legacy-faerdpunktar-https.json-headers.txt")
    print(f"Acquisition time (state feed, REQUEST_TIME_UTC): {acq_state.isoformat()}")
    print(f"Acquisition time (point feed, REQUEST_TIME_UTC): {acq_points.isoformat()}")

    with open(os.path.join(SAMPLES, "legacy-faerd-https.json"), encoding="utf-8") as f:
        segs = json.load(f)
    by_id = {int(r["IdButur"]): r for r in segs}

    export_vals = {r["DagsKeyrtUt"] for r in segs}
    print(f"DagsKeyrtUt (export time) distinct values nationwide: {export_vals}")
    export_state = parse_ts(next(iter(export_vals))) if len(export_vals) == 1 else None
    print()

    print("=" * 78)
    print("13 CHAIN SEGMENTS -- signed age vs acquisition and vs export")
    print("=" * 78)
    findings = []
    ages_acq = []
    rows = []
    for idb in CHAIN:
        r = by_id.get(idb)
        if r is None:
            findings.append(f"{idb}: MISSING from fresh export")
            print(f"  {idb}: MISSING")
            continue
        ds = parse_ts(r.get("DagsSkrad"))
        if ds is None:
            findings.append(f"{idb}: DagsSkrad missing/unparseable ({r.get('DagsSkrad')!r})")
            print(f"  {idb}: DagsSkrad UNPARSEABLE/MISSING")
            continue
        age_acq = (acq_state - ds).total_seconds()
        age_exp = (export_state - ds).total_seconds() if export_state else None
        ages_acq.append(age_acq)
        rows.append((idb, r["DagsSkrad"], age_acq, age_exp))
        print(f"  {idb}: DagsSkrad={r['DagsSkrad']}  age_vs_acquisition={age_acq:.0f}s  "
              f"age_vs_export={age_exp:.0f}s" if age_exp is not None else
              f"  {idb}: DagsSkrad={r['DagsSkrad']}  age_vs_acquisition={age_acq:.0f}s  age_vs_export=UNKNOWN")
        if age_acq < 0:
            findings.append(f"{idb}: NEGATIVE age vs acquisition ({age_acq:.0f}s)")
        if export_state is not None and ds > export_state:
            findings.append(f"{idb}: assessment ({r['DagsSkrad']}) is AFTER export ({export_state.isoformat()})")
    if export_state is not None and export_state > acq_state:
        findings.append(f"feed-level: export ({export_state.isoformat()}) is AFTER acquisition "
                         f"({acq_state.isoformat()})")

    print()
    print(f"Signed-age distribution vs acquisition, all {len(ages_acq)} retained chain segments "
          f"(seconds): {sorted(round(a) for a in ages_acq)}")
    print(f"  min={min(ages_acq):.0f}s  max={max(ages_acq):.0f}s")
    old_cohort = [a for a in ages_acq if a > 7 * 3600]
    fresh_cohort = [a for a in ages_acq if a <= 7 * 3600]
    print(f"  {len(old_cohort)} of {len(ages_acq)} segments are 7+ hours old "
          f"({min(old_cohort)/3600:.1f}-{max(old_cohort)/3600:.1f}h)" if old_cohort else
          "  none are 7+ hours old")
    print(f"  {len(fresh_cohort)} of {len(ages_acq)} segments are under 7 hours old "
          f"({min(fresh_cohort):.0f}-{max(fresh_cohort):.0f}s)" if fresh_cohort else
          "  none are under 7 hours old")
    print()
    print(f"QUALITY FINDINGS (segments): {findings if findings else 'NONE FOUND'}")
    print()

    print("=" * 78)
    print("POINT EVENTS 67861 / 67862 / 73801 -- signed age + GildirTil consistency")
    print("=" * 78)
    with open(os.path.join(SAMPLES, "legacy-faerdpunktar-https.json"), encoding="utf-8") as f:
        pts = json.load(f)
    pts_export_vals = {r["DagsKeyrtUt"] for r in pts}
    export_pts = parse_ts(next(iter(pts_export_vals))) if len(pts_export_vals) == 1 else None
    point_findings = []
    for ip in (67861, 67862, 73801):
        matches = [r for r in pts if int(r["IdPunktur"]) == ip]
        if not matches:
            print(f"  {ip}: NOT PRESENT in this fresh fetch")
            continue
        r = matches[0]
        reg = parse_ts(r.get("DagsSkrad"))
        valid_to = parse_ts(r.get("GildirTil"))
        if reg is None:
            point_findings.append(f"{ip}: DagsSkrad missing/unparseable")
            print(f"  {ip}: DagsSkrad UNPARSEABLE/MISSING")
            continue
        age_acq = (acq_points - reg).total_seconds()
        age_exp = (export_pts - reg).total_seconds() if export_pts else None
        print(f"  {ip}: DagsSkrad={r['DagsSkrad']}  age_vs_acquisition={age_acq:.0f}s "
              f"({age_acq/86400:.1f}d)  age_vs_export={age_exp}  GildirTil={r.get('GildirTil')}")
        if age_acq < 0:
            point_findings.append(f"{ip}: NEGATIVE registration age vs acquisition ({age_acq:.0f}s)")
        if valid_to is not None and valid_to < reg:
            point_findings.append(f"{ip}: GildirTil before DagsSkrad -- inconsistent")
        elif r.get("GildirTil") and valid_to is None:
            point_findings.append(f"{ip}: GildirTil present but unparseable ({r['GildirTil']!r})")
    print()
    print(f"QUALITY FINDINGS (point events): {point_findings if point_findings else 'NONE FOUND'}")
    print()
    print("Note: a long registration age is NOT itself a freshness guarantee or a fault; an "
          "expired/future GildirTil is NOT proof the road is clear or blocked outside its own "
          "stated validity window. These are descriptive quality facts, not safety verdicts.")


if __name__ == "__main__":
    main()
