#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- EA2's own required localhost self-test,
run BEFORE any live call. Uses test_server.py (127.0.0.1, ephemeral
port) and driver.py's own attempt_insecure_test_only() -- a separate
code path from the live attempt(), never reused by live_driver.py.
A SEPARATE test ledger (deleted before and after) keeps this entirely
apart from the live allowlist/ledger/budget state, per EA2's own
"afskilin lifandi allowlist/ledger/budget og hreinsuð" instruction.
This proves this DRIVER's own behaviour against a controlled local
server -- it proves nothing about gagnaveita.vegagerdin.is itself
(sandbox/CC-attributed, stated explicitly in the report).
No timestamps or temp paths are written into the report itself.
"""
import json
import sys
import time
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
TEST_LEDGER_PATH = TASK_DIR / "samples" / "_ea2_test_ledger.jsonl.tmp"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import driver as driver_mod  # noqa: E402
import test_server  # noqa: E402

RESULTS = []


def record(name, expected_check_id, actual_check_id, passed, detail=None):
    RESULTS.append({"test": name, "expected_check_id": expected_check_id, "actual_check_id": actual_check_id, "passed": passed, "detail": detail})


def fresh_driver(wall_clock_cap_s=20, max_calls=3, max_total_bytes=4718592):
    if TEST_LEDGER_PATH.exists():
        TEST_LEDGER_PATH.unlink()
    return driver_mod.Driver(TEST_LEDGER_PATH, allowlist={"127.0.0.1"}, max_calls=max_calls,
                              max_total_bytes=max_total_bytes, wall_clock_cap_s=wall_clock_cap_s,
                              socket_timeout_s=20, window_minutes=30, live_mode=False)


def main():
    server, port = test_server.start_server()
    base = f"http://127.0.0.1:{port}"
    try:
        # 1. redirect
        d = fresh_driver()
        entry, _ = d.attempt_insecure_test_only("T-REDIRECT", f"{base}/redirect", 1024)
        record("redirect", "REDIRECT", entry["stop_reasons"][0] if entry["stop_reasons"] else None, "REDIRECT" in entry["stop_reasons"] and entry.get("is_redirect") is True)

        # 2. non-200
        d = fresh_driver()
        entry, _ = d.attempt_insecure_test_only("T-NOT200", f"{base}/not-200", 1024)
        record("non_200_status", "NON_200_STATUS", "NON_200_STATUS" if "NON_200_STATUS" in entry["stop_reasons"] else None, "NON_200_STATUS" in entry["stop_reasons"] and entry.get("status") == 500)

        # 3. over-cap direct (cap smaller than body)
        d = fresh_driver()
        entry, body = d.attempt_insecure_test_only("T-OVERCAP-DIRECT", f"{base}/over-cap-direct", 100)
        record("over_cap_direct", "TRUNCATED", "TRUNCATED" if entry.get("truncated") else None, entry.get("truncated") is True and len(body) == 100)

        # 4. over-cap chunked (cap smaller than total chunked body)
        d = fresh_driver()
        entry, body = d.attempt_insecure_test_only("T-OVERCAP-CHUNKED", f"{base}/over-cap-chunked", 150)
        record("over_cap_chunked", "TRUNCATED", "TRUNCATED" if entry.get("truncated") else None, entry.get("truncated") is True and len(body) == 150)

        # 5. mid-body stall -- gaps (1.5s) individually under the 20s
        #    socket timeout, but driver's own wall-clock cap set to 3s
        #    for this test so the aggregate stall is caught where the
        #    socket timeout alone would not (ledger_integrity-v3's own
        #    disclosed finding, re-demonstrated here).
        d = fresh_driver(wall_clock_cap_s=3)
        entry, _ = d.attempt_insecure_test_only("T-STALL", f"{base}/mid-body-stall", 1024)
        record("mid_body_stall_wall_clock", "WALL_CLOCK_CAP_EXCEEDED", "WALL_CLOCK_CAP_EXCEEDED" if entry.get("wall_clock_cap_exceeded") else None, entry.get("timeout") is True and entry.get("wall_clock_cap_exceeded") is True)

        # 6. remaining budget < per-request cap (cap honoured as min(per_body_cap, remaining))
        d = fresh_driver(max_total_bytes=20000)
        entry, body = d.attempt_insecure_test_only("T-REMAINING", f"{base}/remaining-less-than-cap", 262144)
        record("remaining_budget_less_than_cap", "TRUNCATED", "TRUNCATED" if entry.get("truncated") else None, entry.get("cap_applied_bytes") == 20000 and entry.get("truncated") is True and len(body) == 20000)

        # 7. fourth call refused
        d = fresh_driver(max_calls=3)
        for i in range(3):
            d.attempt_insecure_test_only(f"T-OK-{i}", f"{base}/ok-small", 1024)
        try:
            d.attempt_insecure_test_only("T-FOURTH", f"{base}/ok-small", 1024)
            record("fourth_call_refused", "FOURTH_CALL_REFUSED", None, False)
        except driver_mod.RefusedBeforeConnect as e:
            record("fourth_call_refused", "FOURTH_CALL_REFUSED", e.check_id, e.check_id == "FOURTH_CALL_REFUSED")

        # 8. disallowed host
        d = fresh_driver()
        try:
            d.attempt_insecure_test_only("T-BADHOST", f"{base}/ok-small", 1024, host_override_for_test="not-allowed.invalid")
            record("disallowed_host", "HOST_NOT_ALLOWLISTED", None, False)
        except driver_mod.RefusedBeforeConnect as e:
            record("disallowed_host", "HOST_NOT_ALLOWLISTED", e.check_id, e.check_id == "HOST_NOT_ALLOWLISTED")

        # 9. duplicate request_id
        d = fresh_driver()
        d.attempt_insecure_test_only("T-DUP", f"{base}/ok-small", 1024)
        try:
            d.attempt_insecure_test_only("T-DUP", f"{base}/ok-small", 1024)
            record("duplicate_request_id", "DUPLICATE_REQUEST_ID_REFUSED", None, False)
        except driver_mod.RefusedBeforeConnect as e:
            record("duplicate_request_id", "DUPLICATE_REQUEST_ID_REFUSED", e.check_id, e.check_id == "DUPLICATE_REQUEST_ID_REFUSED")

        # 10. pre-connect failure (InvalidURL) counts toward call count and is STOP.
        # bounded_fetch.py's own broad except-clause already catches this
        # internally and returns an entry with error set (not a Python
        # exception propagating out) -- still counted and still a STOP
        # via TRANSPORT_ERROR in stop_reasons, which is what EA2(d) requires.
        d = fresh_driver()
        entry, _ = d.attempt_insecure_test_only("T-INVALIDURL", f"{base}/bad path with space", 1024)
        record("preconnect_failure_invalid_url", "TRANSPORT_ERROR (counted, STOP)", entry.get("stop_reasons"), "InvalidURL" in (entry.get("error") or "") and "TRANSPORT_ERROR" in entry["stop_reasons"] and d._stopped and d._calls_made == 1)

        # 11. clean small call passes with no stop reasons (sanity / baseline)
        d = fresh_driver()
        entry, body = d.attempt_insecure_test_only("T-CLEAN", f"{base}/ok-small", 1024)
        record("clean_small_call_passes", "NO_STOP", "NO_STOP" if not entry["stop_reasons"] else entry["stop_reasons"], not entry["stop_reasons"] and body == b"{}")

        # 12. driver refuses to start a LIVE-mode run if ledger already exists (EA2f)
        if TEST_LEDGER_PATH.exists():
            TEST_LEDGER_PATH.unlink()
        TEST_LEDGER_PATH.write_text("", encoding="utf-8")
        try:
            driver_mod.Driver(TEST_LEDGER_PATH, allowlist={"127.0.0.1"}, live_mode=True)
            record("live_mode_refuses_restart_if_ledger_exists", "DRIVER_REFUSES_RESTART_LEDGER_EXISTS", None, False)
        except driver_mod.RefusedBeforeConnect as e:
            record("live_mode_refuses_restart_if_ledger_exists", "DRIVER_REFUSES_RESTART_LEDGER_EXISTS", e.check_id, e.check_id == "DRIVER_REFUSES_RESTART_LEDGER_EXISTS")

    finally:
        test_server.stop_server(server)
        if TEST_LEDGER_PATH.exists():
            TEST_LEDGER_PATH.unlink()

    all_passed = all(r["passed"] for r in RESULTS)
    report = {
        "note": "This proves this task's own driver behaviour against a controlled 127.0.0.1 test server -- it proves NOTHING about gagnaveita.vegagerdin.is itself. Sandbox/CC-attributed.",
        "results": RESULTS, "total": len(RESULTS), "all_passed": all_passed,
    }
    out_path = TASK_DIR / "samples" / "ea2_test_report.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
        f.write("\n")
    for r in RESULTS:
        print(("PASS" if r["passed"] else "FAIL"), r["test"], "expected=", r["expected_check_id"], "actual=", r["actual_check_id"])
    print("ALL PASSED:" if all_passed else "SOME FAILED:", all_passed)
    assert all_passed, [r for r in RESULTS if not r["passed"]]


if __name__ == "__main__":
    main()
