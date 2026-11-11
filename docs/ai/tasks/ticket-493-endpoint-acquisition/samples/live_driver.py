#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- the actual, real, live network run. Uses
driver.Driver's own pure attempt() (never attempt_insecure_test_only).
Order: E1-WGS84, then (only if E1 is complete/undeviated) S2-WGS84,
then (only if S2 is also complete/undeviated) ACCESS-CAPABILITIES.
Any EA4 deviation on either WGS84 call stops all further calls for
this run (Ripley's own documented choice). Raw responses are saved
byte-exact; the real ledger is samples/exchange-ledger.jsonl.
"""
import hashlib
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


def expected_feature_keys(which):
    ref = json.loads((TASK_DIR / "samples/rp1_native_reference.json").read_bytes())
    key = "e1_features" if which == "E1-WGS84" else "s2_features"
    return {(r["idferill"], r["nakvaemniferlis"]) for r in ref[key]}, ref["e1_junction_native_xy" if which == "E1-WGS84" else "s2_junction_native_xy"]


def validate_response(which, body_bytes):
    """EA4. Returns (ok, finding_dict)."""
    try:
        doc = json.loads(body_bytes)
    except Exception as e:
        return False, {"deviation_type": "INVALID_JSON", "error": f"{type(e).__name__}: {e}"}

    features = doc.get("features", [])
    expected_keys, _ = expected_feature_keys(which)
    got_keys = []
    seen = set()
    duplicates = []
    for f in features:
        p = f.get("properties", {})
        key = (p.get("IDFERILL"), p.get("NAKVAEMNIFERLIS"))
        if key in seen:
            duplicates.append(key)
        seen.add(key)
        got_keys.append(key)

    number_matched = doc.get("numberMatched")
    number_returned = doc.get("numberReturned")
    total_features = doc.get("totalFeatures")
    length = len(features)

    missing = expected_keys - seen
    extra = seen - expected_keys

    finding = {
        "number_matched": number_matched, "number_returned": number_returned, "total_features": total_features,
        "len_features": length, "expected_count": len(expected_keys), "missing_expected_keys": sorted(missing),
        "extra_keys_beyond_expected": sorted(extra), "duplicate_keys": duplicates,
    }

    if missing or duplicates:
        finding["deviation_type"] = "EA4_I_MISSING_OR_DUPLICATE"
        return False, finding
    if extra:
        finding["deviation_type"] = "EA4_II_EXTRA_FEATURE_WHILE_EXPECTED_SET_COMPLETE"
        return False, finding
    if not (number_matched == number_returned == length == len(expected_keys)):
        finding["deviation_type"] = "EA4_COUNT_FIELD_MISMATCH"
        return False, finding
    return True, finding


def main():
    manifest = json.loads((TASK_DIR / "request-manifest.json").read_bytes())
    by_id = {e["request_id"]: e for e in manifest["requests"]}

    d = driver_mod.Driver(LEDGER_PATH, allowlist={HOST}, max_calls=3, max_total_bytes=4718592,
                           wall_clock_cap_s=20, socket_timeout_s=20, window_minutes=30, live_mode=True)

    findings = {}
    stopped_reason = None

    # --- E1-WGS84 ---
    e1_manifest = by_id["E1-WGS84"]
    entry, body = d.attempt("E1-WGS84", e1_manifest["full_url"], e1_manifest["per_body_cap_bytes"])
    (RAW_DIR / "raw-E1-WGS84.json").write_bytes(body)
    try:
        (RAW_DIR / "raw-E1-WGS84.json").chmod(0o444)
    except Exception:
        pass
    print("E1-WGS84:", {k: entry.get(k) for k in ("status", "bytes_received", "truncated", "sha256_of_received_bytes", "stop_reasons")})

    if entry["stop_reasons"]:
        stopped_reason = f"E1-WGS84 call itself stopped: {entry['stop_reasons']}"
    else:
        ok, finding = validate_response("E1-WGS84", body)
        findings["E1-WGS84"] = finding
        print("E1-WGS84 validation:", finding)
        if not ok:
            stopped_reason = f"E1-WGS84 EA4 deviation: {finding['deviation_type']}"
            d.mark_stop(stopped_reason)

    # --- S2-WGS84 (only if E1 was clean) ---
    if stopped_reason is None:
        s2_manifest = by_id["S2-WGS84"]
        entry, body = d.attempt("S2-WGS84", s2_manifest["full_url"], s2_manifest["per_body_cap_bytes"])
        (RAW_DIR / "raw-S2-WGS84.json").write_bytes(body)
        try:
            (RAW_DIR / "raw-S2-WGS84.json").chmod(0o444)
        except Exception:
            pass
        print("S2-WGS84:", {k: entry.get(k) for k in ("status", "bytes_received", "truncated", "sha256_of_received_bytes", "stop_reasons")})
        if entry["stop_reasons"]:
            stopped_reason = f"S2-WGS84 call itself stopped: {entry['stop_reasons']}"
        else:
            ok, finding = validate_response("S2-WGS84", body)
            findings["S2-WGS84"] = finding
            print("S2-WGS84 validation:", finding)
            if not ok:
                stopped_reason = f"S2-WGS84 EA4 deviation: {finding['deviation_type']}"
                d.mark_stop(stopped_reason)
    else:
        print("S2-WGS84 SKIPPED:", stopped_reason)

    # --- ACCESS-CAPABILITIES (only if both WGS84 calls were clean) ---
    if stopped_reason is None:
        caps_manifest = by_id["ACCESS-CAPABILITIES"]
        entry, body = d.attempt("ACCESS-CAPABILITIES", caps_manifest["full_url"], caps_manifest["per_body_cap_bytes"])
        (RAW_DIR / "raw-ACCESS-CAPABILITIES.xml").write_bytes(body)
        try:
            (RAW_DIR / "raw-ACCESS-CAPABILITIES.xml").chmod(0o444)
        except Exception:
            pass
        print("ACCESS-CAPABILITIES:", {k: entry.get(k) for k in ("status", "bytes_received", "truncated", "sha256_of_received_bytes", "stop_reasons")})
    else:
        print("ACCESS-CAPABILITIES SKIPPED:", stopped_reason)

    summary = {"stopped_reason": stopped_reason, "findings": findings, "calls_made": d._calls_made, "bytes_received_total": d._bytes_received_total}
    with open(TASK_DIR / "samples" / "live_run_summary.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(summary, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("\nSUMMARY:", json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
