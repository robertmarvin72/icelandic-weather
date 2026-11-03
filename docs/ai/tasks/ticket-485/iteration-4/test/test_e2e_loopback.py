"""#485 iteration-4 correction v7 (R1, R2, R6) -- REAL end-to-end tests
against a task-local COPY of the candidate tree (only `provider_target.py`
edited in the copy), running the copy's own unmodified `pipeline.
run_request()` in a fresh OS process, which itself spawns a fresh OS
child process (the copy's own `child_worker.py`, byte-identical to the
real one) against a real local loopback HTTP server. The REAL source
tree's `provider_target.py`/`pipeline.py` are never touched and never
given a live entry command of their own.

External-connect guard (R1): every test server here binds to 127.0.0.1
only, AND the copy's own runner process installs `_network_guard` before
anything else (see `e2e_copy_helper.py`'s `_RUNNER_TEMPLATE`) -- defence
in depth on top of the already-loopback-retargeted `provider_target.py`.
"""
import json
import os
import shutil
import socket
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_CANDIDATE_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _THIS_DIR)
sys.path.insert(0, _CANDIDATE_DIR)

import _network_guard as _guard  # noqa: E402
_guard.install()

import e2e_copy_helper as helper  # noqa: E402
import ledger  # noqa: E402 -- used read-only, to inspect the COPY's ledger file contents
import _docs_fixture as fixture  # noqa: E402 -- v8 R1/R2: the realistic, docs-derived sample payload

FAKE_KEY = "ITER4-E2E-FAKE-KEY-xyz789"

GOOD_PARAMS = [
    ["latitude", [64.0]], ["longitude", [-21.0]],
    ["hourly", ["temperature_2m", "wind_speed_10m", "wind_gusts_10m", "precipitation", "snowfall", "weather_code"]],
    ["wind_speed_unit", "ms"], ["temperature_unit", "celsius"], ["precipitation_unit", "mm"],
    ["timezone", "UTC"], ["forecast_days", 3],
]


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        server = self.server
        server.hit_count = getattr(server, "hit_count", 0) + 1
        server.last_path = self.path
        if self.path.startswith("/good_extra_field"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(fixture.build_documented_sample_with_extra_field())
        elif self.path.startswith("/good"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            # v8 R1/R2: the realistic, docs-derived fixture (every
            # documented top-level field, 72 real hourly points) -- not
            # the old minimal fixture, which could not have caught the
            # v7 allowlist defect Jonesy's Round-3 review found.
            self.wfile.write(fixture.build_documented_sample_body())
        elif self.path.startswith("/unauthorized"):
            self.send_response(401)
            self.end_headers()
        elif self.path.startswith("/list_response"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            # The documented "multiple coordinates" shape -- a top-level
            # list. Non-terminal refusal (v8 R1), not unsafe.
            self.wfile.write(fixture.build_list_response())
        elif self.path.startswith("/incomplete_200"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            # Well-formed JSON, no structural violation, but no usable
            # forecast at all -- SAMPLE_INCOMPLETE (v8 R2), non-terminal.
            self.wfile.write(json.dumps({"unexpected_field": "harmless-but-empty"}).encode())
        elif self.path.startswith("/unsafe_200"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            # A genuinely UNSAFE 200: a RECOGNISED, stored field
            # (`utc_offset_seconds`) with an INVALID type -- a real
            # structural violation, still terminal (v8 keeps this case
            # distinct from "merely incomplete" or "merely unknown").
            payload = fixture.build_documented_sample_payload()
            payload["utc_offset_seconds"] = "not-an-integer"
            self.wfile.write(json.dumps(payload).encode())
        else:
            self.send_response(404)
            self.end_headers()


def _start_server():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
    srv.hit_count = 0
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def test_real_successful_request_end_to_end():
    print("[e2e 1] REAL copied-tree run_request() succeeds end-to-end against a real loopback server ... ")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/good")
        result, stderr = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        print(f"    result: {result}")
        assert result["ok"] is True, f"RED: {result}"
        assert result["outcome"]["category"] == "OK" and result["outcome"]["status"] == 200
        assert srv.hit_count == 1
        led = ledger.load_ledger(lp)
        assert len(led["attempts"]) == 1 and led["attempts"][0]["status"] == "complete"
        attempt_id = led["attempts"][0]["id"]
        assert led["attempts"][0]["sample_written"] is True, led["attempts"][0]
        # R6: unique, per-attempt filename -- never the old fixed name.
        sample_path = os.path.join(copy_dir, "samples", f"forecast-sample-{attempt_id}.json")
        assert os.path.exists(sample_path), "RED: no safe sample was written for a clean 200 response"
        sample_text = open(sample_path, encoding="utf-8").read()
        assert FAKE_KEY not in sample_text
        ledger_text = open(lp, encoding="utf-8").read()
        assert FAKE_KEY not in ledger_text
        print(f"    PASS: real 200, 1 real server hit, unique sample forecast-sample-{attempt_id[:8]}...json "
              f"written, ledger clean of the secret")
    finally:
        srv.shutdown()


def test_rejected_input_causes_zero_socket_calls():
    print("[e2e 2] a REJECTED (schema-invalid) input causes ZERO socket/transport calls ... ", end="")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/good")
        bad_params = [p for p in GOOD_PARAMS if p[0] != "forecast_days"] + [["forecast_days", 7]]
        result, stderr = helper.run_real_request(copy_dir, runner, bad_params, FAKE_KEY)
        assert result["ok"] is False and result["exception_type"] == "CandidateRefusal", result
        assert srv.hit_count == 0, f"RED: server was hit {srv.hit_count} time(s) despite a rejected input"
        assert not os.path.exists(lp), "RED: a ledger reservation was made for a rejected input"
        print(f"PASS (refused as {result}, server hit_count={srv.hit_count}, no ledger file created)")
    finally:
        srv.shutdown()


def test_malformed_secret_causes_zero_socket_calls():
    print("[e2e 3] a malformed secret (CRLF) is rejected BEFORE any socket call, real copied tree ... ", end="")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/good")
        result, stderr = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, "bad\r\nkey")
        assert result["ok"] is False and result["exception_type"] == "CandidateRefusal", result
        assert srv.hit_count == 0
        print(f"PASS (refused as {result}, server never hit)")
    finally:
        srv.shutdown()


def test_terminal_state_persists_across_a_real_second_process():
    print("[e2e 4] a 401 from a REAL server marks the ledger terminal; a SECOND, separate real process "
          "is then refused with zero new socket calls ... ")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/unauthorized")
        result1, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result1["ok"] is True and result1["outcome"]["status"] == 401, result1
        hits_after_first = srv.hit_count
        led = ledger.load_ledger(lp)
        assert led["terminal"] is True, f"RED: ledger not marked terminal after a 401: {led}"
        assert led["terminal_reason_category"] == "AUTH_OR_RATE_FAILURE_401"

        # SECOND, entirely separate process invocation -- the real test of
        # "persists across restart," not just within one Python session.
        result2, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result2["ok"] is False and result2["exception_type"] == "LedgerTerminal", result2
        assert srv.hit_count == hits_after_first, (
            f"RED: the second call made a new real request ({srv.hit_count} vs {hits_after_first} hits) "
            f"despite the terminal marker")
        print(f"    PASS: first real 401 -> terminal; second real process call refused "
              f"(LedgerTerminal), server hit_count unchanged at {srv.hit_count}")
    finally:
        srv.shutdown()


def test_two_clean_successes_preserve_two_distinct_samples():
    print("[e2e 5] TWO clean successful attempts against the SAME ledger preserve 2 DISTINCT samples "
          "(R6: unique per-attempt filename, never overwritten) ... ")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/good")
        result1, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        result2, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result1["ok"] is True and result1["outcome"]["status"] == 200, result1
        assert result2["ok"] is True and result2["outcome"]["status"] == 200, result2
        led = ledger.load_ledger(lp)
        assert len(led["attempts"]) == 2, f"RED: expected 2 attempts, got {len(led['attempts'])}"
        ids = [a["id"] for a in led["attempts"]]
        assert ids[0] != ids[1], "RED: duplicate attempt IDs"
        for a in led["attempts"]:
            assert a["sample_written"] is True, a
        paths = [os.path.join(copy_dir, "samples", f"forecast-sample-{aid}.json") for aid in ids]
        assert os.path.exists(paths[0]) and os.path.exists(paths[1]), (
            f"RED: expected both distinct sample files to exist: {paths}")
        assert paths[0] != paths[1]
        print(f"    PASS: 2 attempts ({ids[0][:8]}..., {ids[1][:8]}...), 2 distinct sample files, "
              f"neither overwritten the other")
    finally:
        srv.shutdown()


def test_unsafe_200_is_terminal_structural_failure():
    print("[e2e 6] a genuinely UNSAFE 200 (invalid type on a RECOGNISED stored field) leaves NO sample, "
          "is reclassified, and marks the ledger terminal (v8 R1) ... ", end="")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/unsafe_200")
        result, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result["ok"] is True, result
        assert result["outcome"]["category"] == "UNSAFE_SAMPLE_REJECTED", (
            f"RED: an unsafe 200 was not reclassified away from a plain OK: {result}")
        led = ledger.load_ledger(lp)
        assert led["terminal"] is True, f"RED: ledger not marked terminal after an unsafe 200: {led}"
        assert led["terminal_reason_category"] == "UNSAFE_SAMPLE"
        att = led["attempts"][0]
        assert att["sample_written"] is False, att
        assert att["sample_reason"] == "STRUCTURAL_FAILURE", att
        samples_dir = os.path.join(copy_dir, "samples")
        written_samples = [f for f in os.listdir(samples_dir) if f.startswith("forecast-sample-")]
        assert written_samples == [], f"RED: a sample file was written despite the invalid type: {written_samples}"

        # Restart refusal: genuinely unsafe stays terminal, unlike the
        # non-terminal cases below.
        result2, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result2["ok"] is False and result2["exception_type"] == "LedgerTerminal", result2
        print(f"PASS (outcome category overridden to UNSAFE_SAMPLE_REJECTED, terminal=UNSAFE_SAMPLE, "
              f"sample_written=False, no sample file on disk, restart correctly refused)")
    finally:
        srv.shutdown()


def test_additive_unknown_field_real_e2e_is_valid_and_non_terminal():
    print("[e2e 7] a REAL 200 with the fully-documented shape PLUS one additive unknown field "
          "-> OK, sample written, drop count recorded, ledger non-terminal (v8 R1) ... ", end="")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/good_extra_field")
        result, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result["ok"] is True and result["outcome"]["category"] == "OK", result
        led = ledger.load_ledger(lp)
        assert led["terminal"] is False, f"RED: ledger wrongly marked terminal for an additive unknown field: {led}"
        att = led["attempts"][0]
        assert att["sample_written"] is True, att
        assert att["sample_reason"] == "OK_UNKNOWN_FIELDS_DROPPED:1", att
        sample_path = os.path.join(copy_dir, "samples", f"forecast-sample-{att['id']}.json")
        assert os.path.exists(sample_path)
        assert "experimental_field" not in open(sample_path, encoding="utf-8").read()
        print(f"PASS (OK, sample written, sample_reason={att['sample_reason']!r}, ledger not terminal)")
    finally:
        srv.shutdown()


def test_top_level_list_real_e2e_is_nonterminal_refusal():
    print("[e2e 8] a REAL 200 whose body is a top-level JSON list (documented multi-coordinate shape) "
          "-> non-terminal refusal, no sample, restart still allowed (v8 R1) ... ", end="")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/list_response")
        result, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result["ok"] is True and result["outcome"]["category"] == "OK", result
        led = ledger.load_ledger(lp)
        assert led["terminal"] is False, f"RED: ledger wrongly marked terminal for a list response: {led}"
        att = led["attempts"][0]
        assert att["sample_written"] is False, att
        assert att["sample_reason"] == "SAMPLE_UNSUPPORTED_TOP_LEVEL_LIST", att

        # Restart allowed: non-terminal means a second real process may
        # still proceed (budget permitting).
        result2, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result2["ok"] is True, result2
        print(f"PASS (non-terminal, no sample, sample_reason={att['sample_reason']!r}, "
              f"a second real request still proceeded)")
    finally:
        srv.shutdown()


def test_incomplete_200_real_e2e_is_nonterminal():
    print("[e2e 9] a REAL 200 that is well-formed but has no usable forecast data "
          "-> SAMPLE_INCOMPLETE, non-terminal, restart still allowed (v8 R2) ... ", end="")
    srv = _start_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/incomplete_200")
        result, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result["ok"] is True and result["outcome"]["category"] == "OK", result
        led = ledger.load_ledger(lp)
        assert led["terminal"] is False, f"RED: ledger wrongly marked terminal for an incomplete sample: {led}"
        att = led["attempts"][0]
        assert att["sample_written"] is False, att
        assert att["sample_reason"] == "SAMPLE_INCOMPLETE", att

        result2, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY)
        assert result2["ok"] is True, result2
        print(f"PASS (non-terminal, no sample, sample_reason={att['sample_reason']!r}, "
              f"a second real request still proceeded)")
    finally:
        srv.shutdown()


def main():
    try:
        test_real_successful_request_end_to_end()
        test_rejected_input_causes_zero_socket_calls()
        test_malformed_secret_causes_zero_socket_calls()
        test_terminal_state_persists_across_a_real_second_process()
        test_two_clean_successes_preserve_two_distinct_samples()
        test_unsafe_200_is_terminal_structural_failure()
        test_additive_unknown_field_real_e2e_is_valid_and_non_terminal()
        test_top_level_list_real_e2e_is_nonterminal_refusal()
        test_incomplete_200_real_e2e_is_nonterminal()
        print("\nALL E2E (real copied-tree, real loopback) TESTS PASS (exit 0).")
    finally:
        helper.cleanup_all()


if __name__ == "__main__":
    main()
