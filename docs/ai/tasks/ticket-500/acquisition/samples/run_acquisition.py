#!/usr/bin/env python3
"""
#500 acquisition round -- the one real run. PROBE-KEF first; only if it
passes (approved-prompt-v1.md's own gate) do BATCH-1..7 run, in order,
each exactly once. Writes raw response bytes + a per-call summary to
samples/. Never resumes a prior ledger (driver.py's own refusal).
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import driver as driver_mod  # noqa: E402

MANIFEST_PATH = HERE.parent / "request-manifest.json"
LEDGER_PATH = HERE / "exchange-ledger.jsonl"
SUMMARY_PATH = HERE / "run-summary.json"
COVERAGE_PATH = HERE.parents[5] / "server_data" / "winter-route-remaining-coverage.json"

ALLOWLIST = {"gagnaveita.vegagerdin.is"}
ICELAND_LON = (-25.0, -13.0)
ICELAND_LAT = (63.0, 67.0)


def sha256_of_file(p):
    import hashlib
    return hashlib.sha256(p.read_bytes()).hexdigest()


def validate_feature_collection(body_bytes, expected_idbutur_set, request_id):
    """Returns (ok: bool, report: dict). Never raises -- a parse/shape
    problem is itself a finding, not a crash."""
    report = {"request_id": request_id}
    try:
        doc = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        report["ok"] = False
        report["reason"] = f"INVALID_JSON: {type(e).__name__}: {e}"
        return False, report

    if doc.get("type") != "FeatureCollection":
        report["ok"] = False
        report["reason"] = f"NOT_A_FEATURE_COLLECTION: type={doc.get('type')!r}"
        return False, report

    crs = doc.get("crs", {})
    crs_name = (crs.get("properties") or {}).get("name", "") if isinstance(crs, dict) else ""
    features = doc.get("features", [])
    matched = doc.get("totalFeatures", doc.get("numberMatched"))
    returned = doc.get("numberReturned", len(features))

    report["crs_name"] = crs_name
    report["matched"] = matched
    report["returned"] = returned
    report["len_features"] = len(features)

    if len(features) >= 5000:
        report["ok"] = False
        report["reason"] = f"LEN_FEATURES_AT_OR_OVER_5000: {len(features)}"
        return False, report

    if matched is not None and not (matched == returned == len(features)):
        report["ok"] = False
        report["reason"] = f"COUNT_MISMATCH: matched={matched} returned={returned} len(features)={len(features)}"
        return False, report

    seen_idbutur = set()
    bad_coords = []
    for feat in features:
        props = feat.get("properties", {})
        idbutur = props.get("IDBUTUR")
        if idbutur is not None:
            seen_idbutur.add(int(idbutur))
        geom = feat.get("geometry") or {}
        coords = geom.get("coordinates")
        # Flatten to a list of [lon, lat, ...] vertices regardless of geometry type depth.
        def _flatten(c):
            if not c:
                return
            if isinstance(c[0], (int, float)):
                yield c
            else:
                for sub in c:
                    yield from _flatten(sub)
        for vertex in _flatten(coords or []):
            if len(vertex) < 2:
                bad_coords.append({"feature_id": feat.get("id"), "vertex": vertex, "reason": "FEWER_THAN_2_COMPONENTS"})
                continue
            lon, lat = vertex[0], vertex[1]
            if not isinstance(lon, (int, float)) or not isinstance(lat, (int, float)):
                bad_coords.append({"feature_id": feat.get("id"), "vertex": vertex, "reason": "NON_NUMERIC"})
                continue
            if not (ICELAND_LON[0] <= lon <= ICELAND_LON[1] and ICELAND_LAT[0] <= lat <= ICELAND_LAT[1]):
                bad_coords.append({"feature_id": feat.get("id"), "vertex": [lon, lat], "reason": "OUTSIDE_ICELAND_BBOX"})

    report["seen_idbutur"] = sorted(seen_idbutur)
    report["unexpected_idbutur"] = sorted(seen_idbutur - expected_idbutur_set)
    report["missing_idbutur"] = sorted(expected_idbutur_set - seen_idbutur)
    report["bad_coords"] = bad_coords[:20]
    report["bad_coords_count"] = len(bad_coords)

    if report["unexpected_idbutur"]:
        report["ok"] = False
        report["reason"] = f"WRONG_IDBUTUR_IN_RESPONSE: {report['unexpected_idbutur']}"
        return False, report

    if "4326" not in crs_name and crs_name != "":
        report["ok"] = False
        report["reason"] = f"WRONG_CRS: {crs_name!r}"
        return False, report

    if bad_coords:
        report["ok"] = False
        report["reason"] = f"BAD_COORDS: {len(bad_coords)} vertex(es) failed numeric/bbox check"
        return False, report

    if len(features) == 0 and request_id == "PROBE-KEF":
        report["ok"] = False
        report["reason"] = "PROBE_RETURNED_ZERO_FEATURES"
        return False, report

    report["ok"] = True
    report["reason"] = None
    return True, report


def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    actual_sha = sha256_of_file(COVERAGE_PATH)
    if actual_sha != manifest["source_sha256"]:
        print(json.dumps({
            "STOP": "SOURCE_COVERAGE_CHANGED",
            "manifest_sha": manifest["source_sha256"],
            "actual_sha": actual_sha,
        }, indent=2))
        sys.exit(1)

    if LEDGER_PATH.exists():
        print(json.dumps({"STOP": "LEDGER_ALREADY_EXISTS", "path": str(LEDGER_PATH)}, indent=2))
        sys.exit(1)

    d = driver_mod.Driver(
        ledger_path=LEDGER_PATH,
        allowlist=ALLOWLIST,
        max_calls=8,
        max_total_bytes=67108864,
        wall_clock_cap_s=20,
        socket_timeout_s=20,
        window_minutes=20,
        live_mode=True,
    )

    results = []
    requests_by_id = {r["request_id"]: r for r in manifest["requests"]}

    probe_req = requests_by_id["PROBE-KEF"]
    entry, body = d.attempt("PROBE-KEF", probe_req["url"], probe_req["body_cap_bytes"])
    (HERE / "raw-PROBE-KEF.json").write_bytes(body)
    ok, report = validate_feature_collection(body, set(probe_req["idbutur"]), "PROBE-KEF") if not entry.get("stop_reasons") else (False, {"request_id": "PROBE-KEF", "ok": False, "reason": f"TRANSPORT_STOP: {entry.get('stop_reasons')}"})
    results.append({"entry_summary": {k: entry.get(k) for k in ("request_id", "status", "bytes_received", "stop_reasons", "wall_clock_elapsed_s")}, "validation": report})

    if not ok:
        SUMMARY_PATH.write_text(json.dumps({
            "probe_passed": False,
            "batches_run": [],
            "results": results,
        }, indent=2, ensure_ascii=False), encoding="utf-8")
        print(json.dumps({"PROBE_FAILED": True, "reason": report.get("reason")}, indent=2))
        return

    for i in range(1, 8):
        rid = f"BATCH-{i}"
        if d.stopped:
            results.append({"entry_summary": {"request_id": rid, "skipped": True, "reason": "DRIVER_STOPPED_BY_PRIOR_CALL"}})
            continue
        req = requests_by_id[rid]
        entry, body = d.attempt(rid, req["url"], req["body_cap_bytes"])
        (HERE / f"raw-{rid}.json").write_bytes(body)
        if entry.get("stop_reasons"):
            ok, report = False, {"request_id": rid, "ok": False, "reason": f"TRANSPORT_STOP: {entry.get('stop_reasons')}"}
        else:
            ok, report = validate_feature_collection(body, set(req["idbutur"]), rid)
        results.append({"entry_summary": {k: entry.get(k) for k in ("request_id", "status", "bytes_received", "stop_reasons", "wall_clock_elapsed_s")}, "validation": report})

    SUMMARY_PATH.write_text(json.dumps({
        "probe_passed": True,
        "calls_made": d.calls_made,
        "results": results,
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"PROBE_PASSED": True, "calls_made": d.calls_made}, indent=2))


if __name__ == "__main__":
    main()
