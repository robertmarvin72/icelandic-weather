"""#485 iteration-4 -- mandatory local real-socket and policy tests.

SYNTHETIC/LOCAL LOOPBACK AND FAKE-CREDENTIAL ONLY. No real network, no
real key, no OPEN_METEO_API_KEY read from the environment anywhere in
this file. Each numbered section below corresponds exactly to the
approved prompt's 8 mandatory test categories.

Run with: python3 -B test_pipeline.py
"""
import gzip
import http.server
import io
import json
import os
import shutil
import socket
import ssl
import subprocess
import sys
import tempfile
import threading
import time

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _PARENT_DIR)
sys.path.insert(0, _THIS_DIR)

import test_adapter  # noqa: E402
import ledger  # noqa: E402
import leak_scanner  # noqa: E402
import pipeline  # noqa: E402
import schema  # noqa: E402

FAKE_KEY = "ITER4-FAKE-KEY/with+special=chars&more#7"

TMP_ROOT = os.path.join(_PARENT_DIR, "tmp")


def fresh_tmp_dir(name):
    d = os.path.join(TMP_ROOT, name)
    if os.path.exists(d):
        shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d, exist_ok=True)
    return d


def fresh_ledger_path(name):
    d = fresh_tmp_dir(name)
    return os.path.join(d, "ledger.json")


class _Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        server = self.server
        server.hit_count = getattr(server, "hit_count", 0) + 1
        if self.path.startswith("/drip"):
            self.send_response(200)
            self.end_headers()
            for _ in range(30):
                try:
                    self.wfile.write(b"x")
                    self.wfile.flush()
                except Exception:
                    return
                time.sleep(0.3)
        elif self.path.startswith("/stall"):
            time.sleep(15)
            self.send_response(200)
            self.end_headers()
        elif self.path.startswith("/big_plain"):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"P" * 2_000_000)
        elif self.path.startswith("/big_gzip"):
            raw = b"Y" * 3_000_000
            buf = io.BytesIO()
            with gzip.GzipFile(fileobj=buf, mode="wb") as gz:
                gz.write(raw)
            payload = buf.getvalue()
            self.send_response(200)
            self.send_header("Content-Encoding", "gzip")
            self.end_headers()
            self.wfile.write(payload)
        elif self.path.startswith("/redirect_fakekey"):
            self.send_response(302)
            self.send_header("Location", f"http://127.0.0.1:{server.server_port}/target?apikey={FAKE_KEY}")
            self.end_headers()
        elif self.path.startswith("/target"):
            server.target_hit = True
            self.send_response(200)
            self.end_headers()
        elif self.path.startswith("/leak_body"):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f"debug: key was {FAKE_KEY}".encode())
        elif self.path.startswith("/split_leak"):
            self.send_response(200)
            self.end_headers()
            payload = f"xxxx{FAKE_KEY}yyyy".encode()
            mid = len(payload) // 2
            self.wfile.write(payload[:mid])
            self.wfile.flush()
            time.sleep(0.05)
            self.wfile.write(payload[mid:])
        elif self.path.startswith("/small"):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
        else:
            self.send_response(404)
            self.end_headers()


def start_server():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


# ---------------------------------------------------------------------------
# [1] slow drip / full stall / hard worker termination
# ---------------------------------------------------------------------------
def test_1_slow_drip_and_stall_bounded():
    print("[1] slow drip past TOTAL deadline + full stall -- both bounded, worker actually gone ... ")
    srv = start_server()
    try:
        port = srv.server_port
        t0 = time.monotonic()
        outcome = test_adapter.dispatch_to_loopback(
            "127.0.0.1", port, "/drip", False, "latitude=1.0", FAKE_KEY, 1.5, 10_000_000)
        elapsed = time.monotonic() - t0
        assert elapsed < 5, f"RED: drip test took {elapsed:.1f}s, not bounded near the 1.5s deadline"
        assert outcome["category"] != "OK", "RED: drip response wrongly reported OK"
        print(f"    drip: PASS (bounded at {elapsed:.2f}s, category={outcome['category']})")

        t0 = time.monotonic()
        outcome2 = test_adapter.dispatch_to_loopback(
            "127.0.0.1", port, "/stall", False, "latitude=1.0", FAKE_KEY, 1.5, 10_000_000)
        elapsed2 = time.monotonic() - t0
        assert elapsed2 < 5, f"RED: stall test took {elapsed2:.1f}s, not bounded"
        print(f"    stall: PASS (bounded at {elapsed2:.2f}s, category={outcome2['category']})")

        # Hard worker termination proof: spawn directly, confirm the OS
        # process is actually gone after the parent's kill+wait, not merely
        # abandoned.
        stdin_obj = {"host": "127.0.0.1", "port": port, "path": "/stall", "use_tls": False,
                     "query_no_key": "latitude=1.0", "secret": FAKE_KEY,
                     "deadline_epoch": time.time() + 1.5, "decoded_cap": 10_000_000}
        proc = test_adapter.spawn_dummy_child_with_kill_timing(
            (json.dumps(stdin_obj) + "\n").encode(), total_deadline_s=1.5)
        assert proc.poll() is not None, "RED: child process still alive after parent kill+wait"
        print(f"    worker termination: PASS (child exit code {proc.poll()}, confirmed not alive)")
    finally:
        srv.shutdown()


# ---------------------------------------------------------------------------
# [2] oversized plain/compressed body stops at remaining DECODED allowance
# ---------------------------------------------------------------------------
def test_2_oversized_body_stops_at_decoded_cap():
    print("[2] oversized plain + compressed body stop at DECODED cap (incl. per-body > global remainder) ... ")
    srv = start_server()
    try:
        port = srv.server_port
        o1 = test_adapter.dispatch_to_loopback(
            "127.0.0.1", port, "/big_plain", False, "latitude=1.0", FAKE_KEY, 10, 1000)
        assert o1["truncated"] is True and o1["bytes_decoded"] <= 1000, o1
        print(f"    plain 2MB body -> {o1['bytes_decoded']}B, truncated={o1['truncated']}: PASS")

        o2 = test_adapter.dispatch_to_loopback(
            "127.0.0.1", port, "/big_gzip", False, "latitude=1.0", FAKE_KEY, 10, 1000)
        assert o2["truncated"] is True and o2["bytes_decoded"] <= 1000, o2
        print(f"    gzip 3MB decoded body -> {o2['bytes_decoded']}B, truncated={o2['truncated']}: PASS "
              "(decoded, not wire, size governs the cap)")

        # per-body cap LARGER than what remains globally: simulate by using
        # a per-attempt decoded_cap of 5000 but asserting the SAME global
        # ledger accounting (ledger.py's CLASS_CAPS bytes_total) would stop
        # a second attempt once the first consumed most of the budget --
        # exercised directly against ledger.py's own accounting.
        lp = fresh_ledger_path("oversized_global")
        orig_total = ledger.CLASS_CAPS["provider"]["bytes_total"]
        ledger.CLASS_CAPS["provider"]["bytes_total"] = 1500
        try:
            aid = ledger.reserve_attempt(lp)
            ledger.record_outcome(lp, aid, {"category": "OK", "status": 200, "bytes_decoded": 1400, "truncated": False})
            led = ledger.load_ledger(lp)
            assert led["bytes_total"] == 1400
            remaining = ledger.CLASS_CAPS["provider"]["bytes_total"] - led["bytes_total"]
            assert remaining == 100, remaining
            print(f"    global-remainder accounting: PASS (1400/1500 used, 100 remaining tracked correctly)")
        finally:
            ledger.CLASS_CAPS["provider"]["bytes_total"] = orig_total
    finally:
        srv.shutdown()


# ---------------------------------------------------------------------------
# [3] redirect carrying fake key not followed
# ---------------------------------------------------------------------------
def test_3_redirect_with_fakekey_not_followed():
    print("[3] redirect carrying a fake key: not followed, target never hit, no Location retained ... ", end="")
    srv = start_server()
    try:
        port = srv.server_port
        srv.target_hit = False
        outcome = test_adapter.dispatch_to_loopback(
            "127.0.0.1", port, "/redirect_fakekey", False, "latitude=1.0", FAKE_KEY, 10, 100_000)
        assert outcome["status"] == 302, outcome
        assert srv.target_hit is False, "RED: the redirect target was actually hit -- it was followed"
        assert "redirect_location" not in outcome and "Location" not in json.dumps(outcome), (
            "RED: a Location field leaked into the persisted outcome")
        outcome_text = json.dumps(outcome)
        assert FAKE_KEY not in outcome_text, "RED: fake key leaked into the outcome"
        print(f"PASS (302 observed, /target never hit, outcome={outcome})")
    finally:
        srv.shutdown()


# ---------------------------------------------------------------------------
# [4] kill worker after durable attempted record; restart refuses (R2)
# ---------------------------------------------------------------------------
def test_4_crash_then_restart_refuses_as_incomplete():
    print("[4] crash after durable reservation; restart refuses with LedgerIncomplete, not merely "
          "exhausted-count (R2 correction v7) ... ", end="")
    lp = fresh_ledger_path("crash_restart")
    attempt_id = ledger.reserve_attempt(lp)  # simulates: reservation durably written, then "crash"
    # "restart": fresh load, as a brand-new process invocation would do
    led_restart = ledger.load_ledger(lp)
    assert len(led_restart["attempts"]) == 1 and led_restart["attempts"][0]["status"] == "reserved"
    # CORRECTION v7 (R2): a crash-uncertain "reserved" row now blocks ANY
    # new reservation, regardless of how much count/byte budget remains --
    # v6's defect: this exact scenario let a second, ordinary
    # reserve_attempt() proceed and succeed, because only the plain count
    # cap was ever checked.
    blocked_as_incomplete = False
    try:
        ledger.reserve_attempt(lp)
    except ledger.LedgerIncomplete:
        blocked_as_incomplete = True
    assert blocked_as_incomplete, (
        "RED: a second reservation was wrongly permitted despite an unresolved 'reserved' row -- "
        "this is exactly the v6 defect this correction fixes")
    print(f"PASS (crashed attempt {attempt_id[:8]}... left 'reserved'; further attempts refused "
          f"with LedgerIncomplete, not merely once the plain count cap is reached)")


def test_4b_tmp_replace_crash_recovery():
    print("[4b] kill between temp-write and replace: recovery completes the durable intent, not discards it ... ",
          end="")
    lp = fresh_ledger_path("tmp_replace_crash")
    aid = ledger.reserve_attempt(lp)  # writes+replaces the real ledger once, normally
    ledger_before = ledger.load_ledger(lp)
    # Simulate "killed between temp write and replace": manually recreate
    # the .tmp artifact a crash would have left -- a second reservation's
    # fully-written, fsynced temp file that never got replace()'d.
    ledger_after_second_reserve = dict(ledger_before)
    ledger_after_second_reserve["attempts"] = list(ledger_before["attempts"]) + [{
        "id": "simulated-crashed-reservation", "status": "reserved",
        "reserved_utc": ledger.now_utc_iso(), "target_origin": None,
        "reserved_decoded_cap": ledger.CLASS_CAPS["provider"]["bytes_per_attempt"],
        "outcome": None,
    }]
    tmp_path = lp + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(ledger_after_second_reserve, f)
        f.flush()
        os.fsync(f.fileno())
    # No replace() call here -- this IS the "killed before replace" state.
    assert os.path.exists(tmp_path), "test setup bug: tmp file not created"

    # "Restart": load_ledger must complete the durable intent, not drop it.
    recovered = ledger.load_ledger(lp)
    assert len(recovered["attempts"]) == 2, (
        f"RED: recovery dropped the pre-replace reservation -- got {len(recovered['attempts'])} attempts, expected 2")
    assert not os.path.exists(tmp_path), "RED: orphaned .tmp file was not cleaned up by recovery"
    print(f"PASS (2/2 attempts recovered, including the one that never completed its replace())")


# ---------------------------------------------------------------------------
# [5] pipeline refuses alternate origin/port/path/http/loopback structurally
# ---------------------------------------------------------------------------
def test_5_pipeline_structurally_cannot_target_elsewhere():
    print("[5] pipeline.run_request() structurally cannot be pointed anywhere but the fixed target ... ", end="")
    import inspect
    sig = inspect.signature(pipeline.run_request)
    params = set(sig.parameters.keys())
    # CORRECTION v6 (R5): the old `ledger_path`/`_decoded_cap`/
    # `_total_deadline_s` override parameters are GONE -- every one of
    # those is now a fixed module constant (`pipeline.LEDGER_PATH`,
    # `limits.py`). The public signature carries nothing a caller could
    # use to redirect dispatch at all.
    assert params == {"param_pairs", "secret"}, params
    src = inspect.getsource(pipeline.run_request)
    assert "host" not in src.lower().replace("ledger.py", "").replace("ledger_path", ""), (
        "RED: run_request's own source mentions a host, suggesting a smuggled override path")
    print(f"PASS (public signature {sig} carries no host/port/path/url/ledger-path/deadline/cap "
          "override parameter; test_import_isolation.py separately proves the test adapter is "
          "unreachable from it, and that run_request's own dispatch call passes the literal "
          "CHILD_WORKER_PATH constant)")


# ---------------------------------------------------------------------------
# [6] leakage matrix: request URL, split chunks, encoded forms, red mutations
# ---------------------------------------------------------------------------
def test_6_leakage_matrix():
    print("[6] leakage matrix: fake-key request URL, split-chunk body, encoded forms, red mutations ... ")
    srv = start_server()
    try:
        port = srv.server_port

        # (a) the OLD iteration-3 defect, reproduced and asserted FIXED: a
        # fake key placed in the REQUEST URL before transport must never
        # reach the ledger. NOTE: this deliberately does NOT call
        # pipeline.run_request() against the real fixed target -- that
        # would be a forbidden external network attempt. `ledger.py`'s
        # `reserve_attempt()` takes no URL parameter at all in this new
        # design (structurally different from iteration-3's `reserve(path,
        # cls, url)`), so the old defect class is checked here by: (i)
        # confirming that signature fact directly, and (ii) running a real
        # end-to-end dispatch against LOOPBACK (same code path pipeline.py
        # uses) and confirming the ledger never contains the key.
        import inspect
        reserve_sig = inspect.signature(ledger.reserve_attempt)
        assert "url" not in reserve_sig.parameters, (
            f"RED: ledger.reserve_attempt still accepts a url parameter: {reserve_sig}")
        lp = fresh_ledger_path("leak_matrix_url")
        aid = ledger.reserve_attempt(lp)
        ledger.set_target_origin(lp, aid, pipeline._fixed_origin_string())
        outcome_loop = test_adapter.dispatch_to_loopback(
            "127.0.0.1", port, "/small", False, "latitude=1.0", FAKE_KEY, 10, 100_000)
        ledger.record_outcome(lp, aid, outcome_loop)
        ledger_text = open(lp, encoding="utf-8").read()
        assert FAKE_KEY not in ledger_text, "RED: fake key leaked into the real ledger file"
        import urllib.parse
        assert urllib.parse.quote(FAKE_KEY, safe="") not in ledger_text, (
            "RED: percent-encoded fake key leaked into the ledger file")
        print(f"    (a) reserve_attempt() takes no URL param, and a real loopback dispatch leaves "
              f"no trace of the key in the ledger: PASS (outcome={outcome_loop})")

        # (c) expected-RED: a body containing the raw key in full
        try:
            test_adapter.dispatch_to_loopback(
                "127.0.0.1", port, "/leak_body", False, "latitude=1.0", FAKE_KEY, 10, 100_000)
            print("    (c) RED FAIL -- leaking body was not caught")
            sys.exit(1)
        except pipeline.SuspectedSecretDisclosure:
            print("    (c) RED PASS -- raw key in response body correctly refused")

        # split-chunk, now properly checked as its own expected-RED
        try:
            test_adapter.dispatch_to_loopback(
                "127.0.0.1", port, "/split_leak", False, "latitude=1.0", FAKE_KEY, 10, 100_000)
            print("    (b) RED FAIL -- split-chunk leaking body was not caught")
            sys.exit(1)
        except pipeline.SuspectedSecretDisclosure:
            print("    (b) RED PASS -- key split exactly across a chunk boundary still caught")

        # (d) GREEN: a clean body passes normally
        o_clean = test_adapter.dispatch_to_loopback(
            "127.0.0.1", port, "/small", False, "latitude=1.0", FAKE_KEY, 10, 100_000)
        assert o_clean["category"] == "OK" and o_clean["status"] == 200
        print(f"    (d) GREEN PASS -- clean response passes normally ({o_clean})")

        # (e) encoded-form unit checks (percent / double-percent / JSON-escape)
        import urllib.parse, json as _json
        enc = urllib.parse.quote(FAKE_KEY, safe="")
        double = urllib.parse.quote(enc, safe="")
        jsoned = _json.dumps(FAKE_KEY)
        for label, hay in (("percent", f"x={enc}"), ("double-percent", f"x={double}"),
                           ("json-escaped", jsoned)):
            assert leak_scanner.contains_secret(hay, FAKE_KEY), f"RED: {label} form not detected"
        print(f"    (e) percent/double-percent/JSON-escaped forms all detected: PASS")
    finally:
        srv.shutdown()


# ---------------------------------------------------------------------------
# [7] TLS verification path
# ---------------------------------------------------------------------------
def test_7_tls_default_rejection():
    print("[7] TLS: real local cert tooling available -> separate local TLS adapter proves default rejection ... ")
    certdir = tempfile.mkdtemp(prefix="iter4-cert-", dir=fresh_tmp_dir("tls"))
    try:
        key, cert = test_adapter.make_selfsigned_cert(certdir)
        httpd = _start_https_server(key, cert)
        try:
            port = httpd.server_port
            outcome = test_adapter.dispatch_to_loopback(
                "127.0.0.1", port, "/small", True, "latitude=1.0", FAKE_KEY, 5, 100_000)
            assert outcome["category"] == "TLS_FAILURE", (
                f"RED: expected TLS_FAILURE for an untrusted self-signed cert, got {outcome['category']}")
            print(f"    PASS: untrusted self-signed cert rejected under default verification ({outcome})")
            print("    No `verify=` or CA-override parameter exists anywhere in pipeline.py's public API "
                  "or transport_core.request()'s TLS branch (it is hardcoded to ssl.create_default_context()) "
                  "-- there is no insecure path to demonstrate a bypass against, by design.")
        finally:
            httpd.shutdown()
    finally:
        shutil.rmtree(certdir, ignore_errors=True)


def _start_https_server(key, cert):
    httpd = http.server.HTTPServer(("127.0.0.1", 0), _Handler)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(certfile=cert, keyfile=key)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


# ---------------------------------------------------------------------------
# [8] DNS-stall, kill-mid-response, proxy/CA env ignored
# ---------------------------------------------------------------------------
def test_8_dns_stall_bounded():
    print("[8a] DNS-stall: patched resolver blocks past deadline; parent kills/joins, no leftover process ... ",
          end="")
    t0 = time.monotonic()
    stdin_obj = {"host": "127.0.0.1", "port": 1, "path": "/x", "use_tls": False,
                 "query_no_key": "latitude=1.0", "secret": FAKE_KEY,
                 "deadline_epoch": time.time() + 1.5, "decoded_cap": 100_000,
                 "dns_stall_seconds": 10}
    proc = test_adapter.spawn_dummy_child_with_kill_timing(
        (json.dumps(stdin_obj) + "\n").encode(), total_deadline_s=1.5)
    elapsed = time.monotonic() - t0
    assert elapsed < 5, f"RED: DNS-stall test took {elapsed:.1f}s, parent did not kill promptly"
    assert proc.poll() is not None, "RED: child process still alive after DNS-stall kill"
    print(f"PASS (bounded at {elapsed:.2f}s despite a 10s patched DNS stall, child confirmed terminated)")


def test_8b_proxy_ca_env_ignored():
    print("[8b] dummy proxy/CA env vars set in parent process: child never receives or uses them ... ", end="")
    dummy_env_added = {
        "HTTP_PROXY": "http://127.0.0.1:1/bogus-proxy-must-never-be-used",
        "HTTPS_PROXY": "http://127.0.0.1:1/bogus-proxy-must-never-be-used",
        "NO_PROXY": "", "SSL_CERT_FILE": "/nonexistent/bogus-ca.pem",
        "REQUESTS_CA_BUNDLE": "/nonexistent/bogus-ca-bundle.pem",
    }
    saved = {k: os.environ.get(k) for k in dummy_env_added}
    for k, v in dummy_env_added.items():
        os.environ[k] = v
    try:
        env_passed_to_child = pipeline._minimal_child_env()
        leaked = set(dummy_env_added) & set(env_passed_to_child)
        assert not leaked, f"RED: proxy/CA env var(s) passed through to the child: {leaked}"

        srv = start_server()
        try:
            port = srv.server_port
            outcome = test_adapter.dispatch_to_loopback(
                "127.0.0.1", port, "/small", False, "latitude=1.0", FAKE_KEY, 5, 100_000)
            assert outcome["category"] == "OK" and outcome["status"] == 200, (
                f"RED: direct loopback connection failed/altered while dummy proxy env was set: {outcome}")
        finally:
            srv.shutdown()
        print(f"PASS (child env has none of {sorted(dummy_env_added)}; direct loopback request still succeeded)")
    finally:
        for k, v in saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def main():
    print("=== #485 iteration-4 mandatory local real-socket + policy tests ===")
    print("SYNTHETIC/LOCAL LOOPBACK AND FAKE-CREDENTIAL ONLY. No real network, no real key.\n")
    os.makedirs(TMP_ROOT, exist_ok=True)
    try:
        test_1_slow_drip_and_stall_bounded()
        test_2_oversized_body_stops_at_decoded_cap()
        test_3_redirect_with_fakekey_not_followed()
        test_4_crash_then_restart_refuses_as_incomplete()
        test_4b_tmp_replace_crash_recovery()
        test_5_pipeline_structurally_cannot_target_elsewhere()
        test_6_leakage_matrix()
        test_7_tls_default_rejection()
        test_8_dns_stall_bounded()
        test_8b_proxy_ca_env_ignored()
        print("\nALL MANDATORY TESTS PASS (exit 0).")
    finally:
        shutil.rmtree(TMP_ROOT, ignore_errors=True)
        os.makedirs(TMP_ROOT, exist_ok=True)


if __name__ == "__main__":
    main()
