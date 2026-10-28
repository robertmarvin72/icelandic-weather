"""R2/R6 — legacy Vegagerdin faerd2017_1 road-state feed: state distribution,
LOKAD detail, DagsSkrad freshness distribution, DagsKeyrtUt check.

Method: parse the retained JSON (array of 708 flat records) with the stdlib
json module. Count AstandYfirbord and AstandVidbotaruppl verbatim (no
re-grouping, no inference). DagsSkrad freshness is read as the field's own
UTC timestamp string; no timezone conversion is applied (the feed is already
UTC, 'Z' suffix). "Fetch time" used for age is the sample's own retained
response header Date, not the current wall clock, so this script's age
numbers are fixed facts about the retained sample, not live values.

Assumption: IdButur is treated as an integer identity (values arrive as
floats in JSON, e.g. 811400037.0); int() truncation is exact here because
every legacy IdButur value in this feed carries no fractional part, which
this script confirms before computing the ID set.
"""
import sys
from datetime import datetime, timezone
sys.path.insert(0, ".")
from _shared import print_input_manifest, load_json, sample_path

INPUT = "vegagerdin-faerd2017-1.json"


def main():
    print_input_manifest([INPUT, "vegagerdin-faerd2017-headers.txt"])
    records = load_json(INPUT)
    print(f"total records: {len(records)}")

    # confirm IdButur has no fractional part before truncating
    non_integral = [r for r in records if float(r["IdButur"]) != int(r["IdButur"])]
    print(f"IdButur values with non-zero fractional part: {len(non_integral)} (expect 0)")
    ids = [int(r["IdButur"]) for r in records]
    print(f"unique IdButur: {len(set(ids))}")
    print()

    from collections import Counter
    surf = Counter(r["AstandYfirbord"] for r in records)
    add = Counter(r["AstandVidbotaruppl"] for r in records)
    print("AstandYfirbord distribution (verbatim counts):")
    for k, v in sorted(surf.items(), key=lambda kv: -kv[1]):
        print(f"  {k}: {v}")
    print()
    print("AstandVidbotaruppl distribution (verbatim counts, None = field absent/null):")
    for k, v in sorted(add.items(), key=lambda kv: -kv[1]):
        print(f"  {k}: {v}")
    print()

    lokad = [r for r in records if r["AstandYfirbord"] == "LOKAD"]
    print(f"LOKAD records: {len(lokad)}")
    for r in lokad:
        print(f"  IdButur={int(r['IdButur'])} StuttNafnButs={r['StuttNafnButs']!r} "
              f"AstandVidbotaruppl={r['AstandVidbotaruppl']} "
              f"Snjomokstursregla={r['Snjomokstursregla']} "
              f"AsthungiLysingEn={r['AsthungiLysingEn']} "
              f"DagsSkrad={r['DagsSkrad']} DagsKeyrtUt={r['DagsKeyrtUt']}")
    print()

    othekkt_surf = [r for r in records if r["AstandYfirbord"] == "OTHEKKT"]
    othekkt_add = [r for r in records if r["AstandVidbotaruppl"] == "OTHEKKT"]
    print(f"OTHEKKT in AstandYfirbord: {len(othekkt_surf)}")
    print(f"OTHEKKT in AstandVidbotaruppl: {len(othekkt_add)}")
    same_ids = {int(r["IdButur"]) for r in othekkt_surf} == {int(r["IdButur"]) for r in othekkt_add}
    print(f"same record set for both OTHEKKT counts: {same_ids}")
    print()

    dagsskrad = Counter(r["DagsSkrad"] for r in records)
    print(f"distinct DagsSkrad timestamp values: {len(dagsskrad)}")
    print(f"DagsSkrad min: {min(dagsskrad)}  max: {max(dagsskrad)}")
    at_0255 = sum(c for v, c in dagsskrad.items() if v in ("2026-10-27T02:55:00Z", "2026-10-27T02:55:01Z"))
    print(f"records with DagsSkrad == 2026-10-27T02:55:00Z or 02:55:01Z: {at_0255} of {len(records)} "
          f"({100*at_0255/len(records):.1f}%)")
    print("top 5 DagsSkrad values by frequency:")
    for v, c in dagsskrad.most_common(5):
        print(f"  {v}: {c}")
    print()

    dagskeyrtut = Counter(r["DagsKeyrtUt"] for r in records)
    print(f"distinct DagsKeyrtUt (export-generation) values: {len(dagskeyrtut)} -> {dict(dagskeyrtut)}")

    with open(sample_path("vegagerdin-faerd2017-headers.txt"), encoding="utf-8") as f:
        headers = f.read()
    date_line = [l for l in headers.splitlines() if l.lower().startswith("date:")]
    print(f"retained response Date header: {date_line[0] if date_line else 'NOT FOUND'}")
    if date_line:
        fetch_dt = datetime.strptime(date_line[0].split(": ", 1)[1].strip(), "%a, %d %b %Y %H:%M:%S %Z").replace(tzinfo=timezone.utc)
        keyrtut_dt = datetime.strptime("2026-10-27T19:05:51Z", "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        min_skrad_dt = datetime.strptime("2026-10-27T02:55:00Z", "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        print(f"  DagsKeyrtUt age at fetch: {(fetch_dt - keyrtut_dt)}")
        print(f"  oldest DagsSkrad (02:55:00Z cohort) age at fetch: {(fetch_dt - min_skrad_dt)}")
        print("  NOTE: whether the 02:55Z cohort reflects a nightly batch/reset job is UNKNOWN -- "
              "this script only establishes the timestamp fact and its age, not the cause.")

    print()
    print("(Corridor-specific segment lookup is done in 05_coverage_consistency_check.py, "
          "which reads the IdButur values directly out of coverage.csv so there is only one "
          "place that list is maintained.)")


if __name__ == "__main__":
    main()
