#!/usr/bin/env python3
"""
#499 base endpoints -- the actual, real, live network run. Copy of
ticket-493-endpoint-acquisition/samples/live_driver.py, modified ONLY
as approved-prompt-v1.md's JA1 permits (the old file and its own
history are untouched):

  (a) E1-WGS84 is NOT called -- it is retained from #493 (see
      endpoint-registry.json's own E1 entry) and excluded from this
      round's own call order entirely. Driver bounds are this round's
      own: max_calls=2, max_total_bytes=4456448, window_minutes=10
      (approved-prompt-v1.md's own "Afmörkuð netheimild" section).
  (b) An extra feature sharing the SAME IDBUTUR as the expected set is
      a FINDING, never a STOP by itself (JA1b/JA2a) -- E1's own prior
      response already showed this exact shape (12 extra features,
      same IDBUTUR, different IDFERILL). The count-equality check no
      longer requires len(features) == len(expected) (that equality
      is exactly what an extra-but-same-IDBUTUR feature would fail on
      for no good reason); it now checks only
      numberMatched == numberReturned == len(features).
  (c) ACCESS-CAPABILITIES is called regardless of S2-WGS84's own DATA
      validation outcome (missing/extra/duplicate/count-mismatch) --
      only a TRANSPORT/SECURITY stop on S2-WGS84 itself (non-200,
      TLS/transport error, redirect, truncation, wall-clock-cap,
      budget/window exhaustion -- i.e. driver.py's own
      `entry["stop_reasons"]`) stops ACCESS-CAPABILITIES too (JA1c).

Raw responses are saved byte-exact; the real ledger is
samples/exchange-ledger.jsonl (new, under this task -- #493's own
ledger is untouched).
"""
import json
import sys
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

sys.path.insert(0, str(Path(__file__).resolve().parent))
import driver as driver_mod  # noqa: E402
from request_encoding import REQUESTS, HOST, ORDER  # noqa: E402

LEDGER_PATH = TASK_DIR / "samples" / "exchange-ledger.jsonl"
RAW_DIR = TASK_DIR / "samples"

EXPECTED_IDBUTUR = 911170037
MAX_FEATURES_REQUESTED = 300
EXPECTED_LAYER_ID_PREFIX = "faerdferlar2017_1."
EXPECTED_CRS_NAME = "urn:ogc:def:crs:EPSG::4326"


def expected_feature_keys():
    ref = json.loads((TASK_DIR / "samples/rp1_native_reference.json").read_bytes())
    return {(r["idferill"], r["nakvaemniferlis"]) for r in ref["s2_features"]}, ref["s2_junction_native_xy"]


def validate_response(body_bytes):
    """JA1b/JA2a. Returns (ok, finding_dict). ok=False means a DATA
    STOP (S2 published as null/gap with this reason) -- it does NOT
    by itself stop ACCESS-CAPABILITIES; see main()."""
    try:
        doc = json.loads(body_bytes)
    except Exception as e:
        return False, {"deviation_type": "INVALID_JSON", "error": f"{type(e).__name__}: {e}"}

    expected_keys, _ = expected_feature_keys()
    features = doc.get("features", [])
    seen = set()
    duplicates = []
    extra_same_idbutur = []
    extra_other_idbutur_or_layer = []
    for f in features:
        p = f.get("properties", {})
        key = (p.get("IDFERILL"), p.get("NAKVAEMNIFERLIS"))
        idbutur = p.get("IDBUTUR")
        wrong_layer = not str(f.get("id", "")).startswith(EXPECTED_LAYER_ID_PREFIX)
        if key in seen:
            duplicates.append(key)
        seen.add(key)
        if key not in expected_keys:
            if idbutur == EXPECTED_IDBUTUR and not wrong_layer:
                extra_same_idbutur.append(key)  # JA1b: finding only, never a STOP by itself
            else:
                extra_other_idbutur_or_layer.append(key)

    number_matched = doc.get("numberMatched")
    number_returned = doc.get("numberReturned")
    total_features = doc.get("totalFeatures")
    length = len(features)
    missing = expected_keys - seen
    crs_name = (doc.get("crs") or {}).get("properties", {}).get("name")

    finding = {
        "number_matched": number_matched, "number_returned": number_returned, "total_features": total_features,
        "len_features": length, "expected_count": len(expected_keys), "missing_expected_keys": sorted(missing),
        "extra_keys_same_idbutur": sorted(extra_same_idbutur),
        "extra_keys_other_idbutur_or_layer": sorted(extra_other_idbutur_or_layer),
        "duplicate_keys": duplicates, "crs_name": crs_name,
    }

    if crs_name != EXPECTED_CRS_NAME:
        finding["deviation_type"] = "WRONG_CRS"
        return False, finding
    if missing:
        finding["deviation_type"] = "MISSING_EXPECTED_PAIR"
        return False, finding
    if duplicates:
        finding["deviation_type"] = "DUPLICATE_PAIR"
        return False, finding
    if extra_other_idbutur_or_layer:
        finding["deviation_type"] = "WRONG_IDBUTUR_OR_LAYER"
        return False, finding
    if number_matched is not None and number_returned is not None and number_matched > number_returned:
        finding["deviation_type"] = "PAGED_OR_SKEWED_RESPONSE"
        return False, finding
    if length >= MAX_FEATURES_REQUESTED:
        finding["deviation_type"] = "LIMIT_HIT"
        return False, finding
    if not (number_matched == number_returned == length):
        finding["deviation_type"] = "COUNT_FIELD_MISMATCH"
        return False, finding
    return True, finding


def main():
    manifest = json.loads((TASK_DIR / "request-manifest.json").read_bytes())
    by_id = {e["request_id"]: e for e in manifest["requests"]}

    d = driver_mod.Driver(LEDGER_PATH, allowlist={HOST}, max_calls=2, max_total_bytes=4456448,
                           wall_clock_cap_s=20, socket_timeout_s=20, window_minutes=10, live_mode=True)

    findings = {}
    data_stop_reason = None       # S2's own data-shape finding -- never blocks capabilities
    transport_stop_reason = None  # transport/security stop -- blocks everything (JA1c)

    # --- S2-WGS84 (E1 retained, not called this round -- JA1a) ---
    s2_manifest = by_id["S2-WGS84"]
    entry, body = d.attempt("S2-WGS84", s2_manifest["full_url"], s2_manifest["per_body_cap_bytes"])
    (RAW_DIR / "raw-S2-WGS84.json").write_bytes(body)
    try:
        (RAW_DIR / "raw-S2-WGS84.json").chmod(0o444)
    except Exception:
        pass
    print("S2-WGS84:", {k: entry.get(k) for k in ("status", "bytes_received", "truncated", "sha256_of_received_bytes", "stop_reasons")})

    if entry["stop_reasons"]:
        transport_stop_reason = f"S2-WGS84 call itself stopped (transport/security): {entry['stop_reasons']}"
    else:
        ok, finding = validate_response(body)
        findings["S2-WGS84"] = finding
        print("S2-WGS84 validation:", finding)
        if not ok:
            data_stop_reason = f"S2-WGS84 data validation: {finding['deviation_type']}"

    # --- ACCESS-CAPABILITIES: runs unless a TRANSPORT/SECURITY stop occurred on S2 (JA1c) ---
    if transport_stop_reason is None:
        caps_manifest = by_id["ACCESS-CAPABILITIES"]
        entry, body = d.attempt("ACCESS-CAPABILITIES", caps_manifest["full_url"], caps_manifest["per_body_cap_bytes"])
        (RAW_DIR / "raw-ACCESS-CAPABILITIES.xml").write_bytes(body)
        try:
            (RAW_DIR / "raw-ACCESS-CAPABILITIES.xml").chmod(0o444)
        except Exception:
            pass
        print("ACCESS-CAPABILITIES:", {k: entry.get(k) for k in ("status", "bytes_received", "truncated", "sha256_of_received_bytes", "stop_reasons")})
        if entry["stop_reasons"]:
            transport_stop_reason = f"ACCESS-CAPABILITIES call itself stopped (transport/security): {entry['stop_reasons']}"
    else:
        print("ACCESS-CAPABILITIES SKIPPED (transport/security stop on S2-WGS84):", transport_stop_reason)

    summary = {
        "data_stop_reason": data_stop_reason, "transport_stop_reason": transport_stop_reason,
        "findings": findings, "calls_made": d._calls_made, "bytes_received_total": d._bytes_received_total,
    }
    with open(TASK_DIR / "samples" / "live_run_summary.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(summary, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("\nSUMMARY:", json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
