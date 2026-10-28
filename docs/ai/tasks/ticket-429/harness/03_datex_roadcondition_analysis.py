"""R2/R7 — DATEX II RoadConditionService sample: situation/situationRecord
type counts, closure-type breakdown, and the ID-overlap check against the
legacy faerd2017_1 IdButur set.

Method: regex-based extraction over the retained XML text (no XML library
dependency added; the structure is a flat, repeating DATEX2 pattern that a
targeted regex can enumerate exhaustively -- this script prints the raw
counts of each tag it searches for and cross-checks that counts are
internally consistent, e.g. roadClosed + closedPermanentlyForTheWinter must
equal the RoadOrCarriagewayOrLaneManagement situationRecord count).
"""
import re
import sys
from collections import Counter
sys.path.insert(0, ".")
from _shared import print_input_manifest, load_text, load_json

INPUT = "datex-roadcondition.xml"


def main():
    print_input_manifest([INPUT, "datex-roadcondition-headers.txt", "vegagerdin-faerd2017-1.json"])
    data = load_text(INPUT)

    situation_ids = re.findall(r'<q1:situation id="IRCA_ROADCONDITIONS_(\d+)"', data)
    print(f"situation elements: {len(situation_ids)}  unique: {len(set(situation_ids))}")

    record_types = re.findall(r'<q1:situationRecord xsi:type="q1:([A-Za-z]+)"', data)
    tc = Counter(record_types)
    print(f"situationRecord elements: {len(record_types)}")
    print(f"situationRecord xsi:type distribution: {dict(tc)}")
    print()

    road_mgmt_types = re.findall(
        r'<q1:roadOrCarriagewayOrLaneManagementType>([A-Za-z]+)</q1:roadOrCarriagewayOrLaneManagementType>',
        data)
    mgmt_counter = Counter(road_mgmt_types)
    print(f"roadOrCarriagewayOrLaneManagementType distribution: {dict(mgmt_counter)}")
    consistent = sum(mgmt_counter.values()) == tc.get("RoadOrCarriagewayOrLaneManagement", -1)
    print(f"sum of management-type values ({sum(mgmt_counter.values())}) == "
          f"RoadOrCarriagewayOrLaneManagement record count ({tc.get('RoadOrCarriagewayOrLaneManagement')}): "
          f"{consistent}")
    print()

    weather_types = re.findall(
        r'<q1:weatherRelatedRoadConditionType>([A-Za-z]+)</q1:weatherRelatedRoadConditionType>', data)
    wc = Counter(weather_types)
    print(f"weatherRelatedRoadConditionType distribution: {dict(wc)}")
    consistent2 = sum(wc.values()) == tc.get("WeatherRelatedRoadConditions", -1)
    print(f"sum of weather-type values ({sum(wc.values())}) == "
          f"WeatherRelatedRoadConditions record count ({tc.get('WeatherRelatedRoadConditions')}): {consistent2}")
    print()

    en_comments = re.findall(r'<value lang="en">([^<]+)</value>', data)
    print("English generalPublicComment value distribution (most common first):")
    for v, c in Counter(en_comments).most_common(20):
        print(f"  {v!r}: {c}")
    print()

    predef_ids = re.findall(
        r'predefinedLocationReference id="IRCA_PredefinedLocation_segments_(\d+)"', data)
    print(f"predefinedLocationReference elements: {len(predef_ids)}  unique suffixes: {len(set(predef_ids))}")
    print(f"situation-id suffix set == predefinedLocationReference suffix set: "
          f"{set(situation_ids) == set(predef_ids)}")
    print()

    legacy = load_json("vegagerdin-faerd2017-1.json")
    legacy_ids = {str(int(r["IdButur"])) for r in legacy}
    sit_set = set(situation_ids)
    pre_set = set(predef_ids)
    print(f"legacy faerd2017_1 unique IdButur count: {len(legacy_ids)}")
    print(f"DATEX situation-id suffixes subset of legacy IdButur: {sit_set.issubset(legacy_ids)}  "
          f"(missing: {sorted(sit_set - legacy_ids)})")
    print(f"DATEX predefinedLocationReference suffixes subset of legacy IdButur: "
          f"{pre_set.issubset(legacy_ids)}  (missing: {sorted(pre_set - legacy_ids)})")
    print()
    print("INFERENCE LEVEL (per R7, stated explicitly, not upgraded): this is a sample-level "
          "numeric-suffix set-membership check only. It shows every observed DATEX "
          "RoadConditionService situation/location-reference suffix in this sample is also a "
          "legacy IdButur value -- it does NOT prove the two systems' IDs are the same semantic "
          "entity (same segment boundaries, same direction), because the DATEX "
          "PredefinedLocationsPublicationService (the service that would give the DATEX-native "
          "segment geometry to compare against the legacy segment) could not be reached in the "
          "prior round (2 timeouts) and was not retried in this round (R5: no new requests).")

    print()
    print("Corridor cross-check: none of the research/report's named corridor segments were "
          "found to carry a DATEX RoadConditionService record in this sample -- see "
          "05_coverage_consistency_check.py, which performs this check directly against the "
          "same corridor IdButur list read out of coverage.csv.")


if __name__ == "__main__":
    main()
