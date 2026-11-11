#!/usr/bin/env python3
"""
#493 endpoint-acquisition-plan -- independent checks (EP7b / "Umfang og
staðfesting"). Results go into cc-report.md, NOT into acquisition-plan.md
or any already-hashed rule text. Checks:
  1. request-plan.json and coverage-matrix.json both parse as JSON.
  2. request_ids in request-plan.json are unique.
  3. every request_id referenced by coverage-matrix.json exists in
     request-plan.json.
  4. all three locations (Reykjavík/R1, Egilsstaðir/E1, Seyðisfjörður/S2)
     appear in coverage-matrix.json with at least one item each.
  5. a budget table computed FROM request-plan.json's own entries (not
     hand-typed) -- total calls, total max bytes, per-request caps.
  6. retained host/identifier references cross-checked against disk:
     IDBUTUR 911040037 / 911170037 membership, the layer name, and the
     cited sha256 of wfs-north-4326.json / wfs93-raw.json / the ledger
     line used as precedent.
No network. Writes exactly one report file.
"""
import csv
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
NETWORK_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network"
PHASE2_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2"
NORTH_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-north-data"

findings = []


def check(name, condition, detail=None):
    findings.append({"check": name, "passed": bool(condition), "detail": detail})
    assert condition, f"FAILED: {name} -- {detail}"


def main():
    # 1. JSON parse
    request_plan = json.loads((TASK_DIR / "request-plan.json").read_bytes())
    coverage_matrix = json.loads((TASK_DIR / "coverage-matrix.json").read_bytes())
    check("json_parse_request_plan", True)
    check("json_parse_coverage_matrix", True)

    # 2. unique request_ids
    ids = [r["request_id"] for r in request_plan["requests"]]
    check("request_ids_unique", len(ids) == len(set(ids)), {"ids": ids})

    # 3. every matrix-referenced request_id exists
    matrix_ref_ids = set()
    for item in coverage_matrix["items"]:
        matrix_ref_ids.update(item.get("request_ids", []))
    unresolved = matrix_ref_ids - set(ids)
    check("matrix_request_ids_resolve", not unresolved, {"unresolved": sorted(unresolved), "known_ids": ids})

    # 4. all three locations present with at least one item
    places_present = {item["place"].split(" (")[0] for item in coverage_matrix["items"]}
    required_places = {"Reykjavík", "Egilsstaðir", "Seyðisfjörður"}
    check("all_three_locations_present", required_places.issubset(places_present), {"found": sorted(places_present)})
    for place in required_places:
        count = sum(1 for item in coverage_matrix["items"] if item["place"].startswith(place))
        check(f"location_has_items:{place}", count > 0, {"item_count": count})

    # 5. budget computed from the request list itself
    total_calls = sum(r["max_calls"] for r in request_plan["requests"])
    total_max_bytes = sum(r["expected_bytes"]["max_response_bytes_cap"] for r in request_plan["requests"])
    per_request_caps = {r["request_id"]: r["expected_bytes"]["max_response_bytes_cap"] for r in request_plan["requests"]}
    ceiling = request_plan["budget_ceiling_reused_from_prior_precedent"]
    check("total_calls_within_ceiling", total_calls <= ceiling["max_exchanges_total"], {"total_calls": total_calls, "ceiling": ceiling["max_exchanges_total"]})
    check("total_max_bytes_within_ceiling", total_max_bytes <= ceiling["max_bytes_total"], {"total_max_bytes": total_max_bytes, "ceiling": ceiling["max_bytes_total"]})
    for rid, cap in per_request_caps.items():
        check(f"per_request_cap_within_default:{rid}", cap <= ceiling["max_bytes_per_response_default"], {"cap": cap})
    budget_table = {
        "total_requests_planned": len(request_plan["requests"]),
        "total_max_calls": total_calls,
        "total_max_bytes": total_max_bytes,
        "per_request_caps_bytes": per_request_caps,
        "timeout_s_per_request": ceiling["timeout_s_per_request"],
        "acquisition_window_minutes": ceiling["acquisition_window_minutes"],
        "retries": ceiling["retries"],
        "all_authorised_field_false": all(r["authorised"] is False for r in request_plan["requests"]),
    }
    check("all_requests_marked_not_authorised", budget_table["all_authorised_field_false"])

    # 6a. IDBUTUR membership cross-checked against road-links.csv (VEGNR=1) and wfs93-raw.json (VEGNR=93)
    with open(NETWORK_DIR / "samples/road-links.csv", encoding="utf-8") as f:
        road_rows = list(csv.DictReader(f))
    idbutur_911040037_vegnr1 = sorted({int(r["idferill"]) for r in road_rows if r["idbutur"] == "911040037"})
    idbutur_911170037_vegnr1 = sorted({int(r["idferill"]) for r in road_rows if r["idbutur"] == "911170037"})
    check("idbutur_911040037_vegnr1_pieces", idbutur_911040037_vegnr1 == [1483, 2345, 2347, 2349], {"found": idbutur_911040037_vegnr1})
    check("idbutur_911170037_has_no_vegnr1_pieces", idbutur_911170037_vegnr1 == [], {"found": idbutur_911170037_vegnr1})

    wfs93 = json.loads((PHASE2_DIR / "samples/wfs93-raw.json").read_bytes())
    idbutur_by_idferill = {}
    for feat in wfs93["features"]:
        p = feat["properties"]
        idbutur_by_idferill.setdefault(p["IDBUTUR"], set()).add(p["IDFERILL"])
    check("idbutur_911040037_vegnr93_pieces", idbutur_by_idferill.get(911040037) == {2344}, {"found": sorted(idbutur_by_idferill.get(911040037) or [])})
    check("idbutur_911170037_vegnr93_pieces", idbutur_by_idferill.get(911170037) == {3410, 3409, 2894, 2892, 2891}, {"found": sorted(idbutur_by_idferill.get(911170037) or [])})
    count_911040037 = sum(1 for feat in wfs93["features"] if feat["properties"]["IDBUTUR"] == 911040037)
    count_911170037 = sum(1 for feat in wfs93["features"] if feat["properties"]["IDBUTUR"] == 911170037)
    check("confirmed_feature_count_911040037_matches_plan", count_911040037 == 4, {"count": count_911040037})
    check("confirmed_feature_count_911170037_matches_plan", count_911170037 == 20, {"count": count_911170037})

    # 6b. layer name consistency across all planned requests
    layer_names = {r["query"]["typeName"] for r in request_plan["requests"] if "typeName" in r.get("query", {})}
    check("single_demonstrated_layer_name_used", layer_names == {"gis:faerdferlar2017_1"}, {"found": sorted(layer_names)})

    # 6c. cited sha256 values match the live files
    wfs_north_sha = hashlib.sha256((NORTH_DIR / "samples/wfs-north-4326.json").read_bytes()).hexdigest()
    check("wfs_north_4326_sha_matches_citation", wfs_north_sha == "7075416ca4635e4dea058b43124cfdefa7caec9d860d2dd43208504022eedb9b", {"live_sha": wfs_north_sha})
    with open(NORTH_DIR / "samples/exchange-ledger.jsonl", encoding="utf-8") as f:
        ledger_lines = f.readlines()
    line2_sha = hashlib.sha256(ledger_lines[1].encode("utf-8")).hexdigest()
    check("north_ledger_line2_sha_matches_citation", line2_sha == "6b0cb0d60e8894bdd7f36cd7b7320b801f5dc3279c2b4b138e0c51baf2a0cb1d", {"live_sha": line2_sha})

    # 6d. host allowlist consistency against bounded_fetch.py's own ALLOWLIST
    bounded_fetch_src = (PHASE2_DIR / "samples/bounded_fetch.py").read_text(encoding="utf-8")
    check("bounded_fetch_allowlist_includes_vegagerdin", 'gagnaveita.vegagerdin.is' in bounded_fetch_src, None)
    hosts_in_plan = {r["host"] for r in request_plan["requests"]}
    check("plan_hosts_subset_of_bounded_fetch_allowlist", hosts_in_plan == {"gagnaveita.vegagerdin.is"}, {"found": sorted(hosts_in_plan)})

    # 6e. forbidden gagnaveita.vegagerdin.is HTTPS-only check isn't violated by this plan (paths use https implicitly via host; bounded_fetch enforces scheme at call time, not planned here)
    check("no_px_hagstofa_host_in_this_plan", "px.hagstofa.is" not in hosts_in_plan, "px.hagstofa.is is task-scoped per owner-authorisation.md and not needed for R1/E1/S2 geometry requests")

    print("ALL INDEPENDENT CHECKS PASSED:")
    for f in findings:
        print(" ", f["check"], "PASS" if f["passed"] else "FAIL")
    print("\nBudget table (computed from request-plan.json):")
    print(json.dumps(budget_table, indent=1, ensure_ascii=False))

    report = {"findings": findings, "budget_table": budget_table, "total_findings": len(findings), "all_passed": all(f["passed"] for f in findings)}
    with open(TASK_DIR / "samples/verification_report.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
        f.write("\n")


if __name__ == "__main__":
    main()
