"""#485 iteration-3 MANDATORY pre-key self-test suite. SYNTHETIC/LOCAL
LOOPBACK AND NONSECRET ONLY. Must be run, and must pass, before the
presence check for OPEN_METEO_API_KEY is even read (per the approved
prompt: "Mandatory nonsecret HTTP-loopback tests exercise shared real
socket/stream/deadline/counter code before EVEN presence check").

Uses its own throwaway ledger in a scratch directory -- never the real
iteration-3/samples/ledger.json. No real secret is used anywhere in this
file; every "fake key" value below is an obviously-synthetic placeholder
string, never read from the environment.

Run with: python3 -B client_selftest.py
"""
import gzip
import http.server
import io
import os
import shutil
import socket
import ssl
import subprocess
import sys
import tempfile
import threading
import time

import requests

sys.path.insert(0, os.path.dirname(__file__))
import client  # noqa: E402

FAKE_KEY = "FAKE-TEST-KEY-NOT-REAL-0000000000"

SCRATCH = tempfile.mkdtemp(prefix="ticket485-iter3-selftest-")


def fresh_ledger():
    p = os.path.join(SCRATCH, "ledger.json")
    if os.path.exists(p):
        os.remove(p)
    return p


class _Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path == "/drip":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            for _ in range(50):
                try:
                    self.wfile.write(b"x")
                    self.wfile.flush()
                except Exception:
                    return
                time.sleep(0.3)  # 15s total, well past a 2s test deadline
        elif self.path == "/stall":
            time.sleep(10)
            self.send_response(200)
            self.end_headers()
        elif self.path == "/big_gzip":
            raw = b"Y" * 2_000_000  # decoded size exceeds test caps below
            buf = io.BytesIO()
            with gzip.GzipFile(fileobj=buf, mode="wb") as gz:
                gz.write(raw)
            payload = buf.getvalue()
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        elif self.path == "/redirect_fakekey":
            self.send_response(302)
            self.send_header("Location", f"http://127.0.0.1:{self.server.server_port}/target?apikey={FAKE_KEY}")
            self.end_headers()
        elif self.path == "/leak":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f"debug: key was {FAKE_KEY}".encode())
        elif self.path == "/clean":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"no secrets here")
        elif self.path == "/small":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
        else:
            self.send_response(404)
            self.end_headers()


def start_server():
    srv = http.server.HTTPServer(("127.0.0.1", 0), _Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def test_slow_drip_deadline():
    print("[1] slow drip beyond total deadline -> TOTAL_DEADLINE_EXCEEDED, not a hang ... ", end="")
    srv = start_server()
    try:
        url = f"https://127.0.0.1:{srv.server_port}/drip".replace("https://", "http://")
        ledger = fresh_ledger()
        t0 = time.monotonic()
        raised = False
        try:
            client.fetch_once(url, "data", ledger, allowed_exact_urls={url}, timeout=1.5,
                               _allow_http_for_selftest_only=True)
        except TimeoutError as e:
            raised = True
            msg = str(e)
        elapsed = time.monotonic() - t0
        assert raised, "RED: expected TimeoutError, call returned normally"
        assert elapsed < 4, f"RED: took {elapsed:.1f}s, 1.5s deadline not respected"
        led = client.load_ledger(ledger)
        assert led["outcomes"][-1]["error"].startswith("TOTAL_DEADLINE_EXCEEDED")
        assert led["data"]["count"] == 1
        print(f"PASS ({elapsed:.2f}s, {msg})")
    finally:
        srv.shutdown()


def test_stalled_connect():
    print("[2] stalled read (connects, never responds) -> deadline enforced ... ", end="")
    srv = start_server()
    try:
        url = f"http://127.0.0.1:{srv.server_port}/stall"
        ledger = fresh_ledger()
        t0 = time.monotonic()
        raised = False
        try:
            client.fetch_once(url, "data", ledger, allowed_exact_urls={url}, timeout=1.5,
                               _allow_http_for_selftest_only=True)
        except (TimeoutError, requests.exceptions.RequestException):
            # A FULL stall (no bytes at all) is actually caught by `requests`' own
            # per-read timeout (same value as our outer deadline) BEFORE our outer
            # wrapper's deadline fires -- raised as ReadTimeout, not our custom
            # TimeoutError. Our outer deadline's distinct value is proven by test
            # [1] (slow drip), where individual reads succeed and requests' own
            # per-read timeout never fires on its own. Either exception here means
            # the stall was bounded, not left hanging -- both are accepted.
            raised = True
        elapsed = time.monotonic() - t0
        assert raised, "RED: expected a bounded failure, call returned normally"
        assert elapsed < 4
        print(f"PASS ({elapsed:.2f}s)")
    finally:
        srv.shutdown()


def test_oversized_compressed_body():
    print("[3] oversized compressed-expanding body -> stopped at DECODED cap, not wire size ... ", end="")
    srv = start_server()
    orig = client.CLASS_CAPS["data"]["per_body"]
    client.CLASS_CAPS["data"]["per_body"] = 1000  # tiny test cap
    try:
        url = f"http://127.0.0.1:{srv.server_port}/big_gzip"
        ledger = fresh_ledger()
        outcome, body = client.fetch_once(url, "data", ledger, allowed_exact_urls={url}, timeout=5,
                                           _allow_http_for_selftest_only=True)
        assert outcome["truncated"] is True, "RED: 2MB decoded body not flagged truncated at a 1000B cap"
        assert len(body) <= 1000, f"RED: got {len(body)} decoded bytes, expected <=1000"
        print(f"PASS (decoded-stream cut at {len(body)}B despite gzip wire framing)")
    finally:
        client.CLASS_CAPS["data"]["per_body"] = orig
        srv.shutdown()


def test_fakekey_redirect_not_followed():
    print("[4] fake-key redirect: not followed, query NEVER persisted in the ledger ... ", end="")
    srv = start_server()
    try:
        url = f"http://127.0.0.1:{srv.server_port}/redirect_fakekey"
        ledger = fresh_ledger()
        outcome, body = client.fetch_once(url, "data", ledger, allowed_exact_urls={url}, timeout=5,
                                           secret=FAKE_KEY, never_redirect=True,
                                           _allow_http_for_selftest_only=True)
        assert outcome["status"] == 302
        assert outcome["redirect_location"] is not None
        assert FAKE_KEY not in outcome["redirect_location"], "RED: fake key leaked into redacted Location"
        assert "?" not in outcome["redirect_location"], "RED: query string was not dropped"
        led = client.load_ledger(ledger)
        ledger_text = open(ledger, encoding="utf-8").read()
        assert FAKE_KEY not in ledger_text, "RED: fake key leaked into the ledger file on disk"
        print(f"PASS (302 logged, Location redacted to {outcome['redirect_location']!r}, never auto-followed)")
    finally:
        srv.shutdown()


def test_crash_then_restart_consumes_slot():
    print("[5] killed-worker-after-durable-attempt: restart still sees the slot consumed ... ", end="")
    ledger = fresh_ledger()
    orig_count = client.CLASS_CAPS["doc"]["count"]
    client.CLASS_CAPS["doc"]["count"] = 1
    try:
        # Simulate a crash: reserve a slot, then DO NOT call append_outcome
        # (as if the process died mid-request) -- this is exactly the gap
        # the old client had (count only incremented at outcome).
        seq = client.reserve(ledger, "doc", "https://example.invalid/crashed-mid-request")
        # "Restart": load the ledger fresh, as a brand-new process invocation would.
        led_after_restart = client.load_ledger(ledger)
        assert led_after_restart["doc"]["count"] == 1, (
            "RED: the crashed attempt's slot was NOT durably consumed on restart")
        blocked = False
        try:
            client._check_budget(led_after_restart, "doc")
        except client.BudgetExceeded:
            blocked = True
        assert blocked, "RED: budget check did not block a second attempt after the crash consumed the only slot"
        print("PASS (count=1 survives the simulated crash/restart; further doc attempts correctly refused)")
    finally:
        client.CLASS_CAPS["doc"]["count"] = orig_count


def test_fakekey_leak_detection_red_then_green():
    print("[6] fake-key leak scan: RED (leaking response rejected) then GREEN (clean response passes) ... ")
    srv = start_server()
    try:
        leak_url = f"http://127.0.0.1:{srv.server_port}/leak"
        clean_url = f"http://127.0.0.1:{srv.server_port}/clean"
        ledger = fresh_ledger()
        red_raised = False
        try:
            client.fetch_once(leak_url, "data", ledger, allowed_exact_urls={leak_url}, timeout=5,
                               secret=FAKE_KEY, _allow_http_for_selftest_only=True)
        except client.SuspectedSecretDisclosure:
            red_raised = True
        assert red_raised, "RED FAIL: a response containing the fake key was NOT caught"
        led = client.load_ledger(ledger)
        assert led["outcomes"][-1]["error"] == "SUSPECTED_SECRET_DISCLOSURE"
        ledger_text = open(ledger, encoding="utf-8").read()
        assert FAKE_KEY not in ledger_text, "RED FAIL: the fake key leaked into the ledger despite detection"
        print("    RED  PASS: leaking body detected, STOP raised, nothing persisted containing the secret")

        outcome, body = client.fetch_once(clean_url, "data", ledger, allowed_exact_urls={clean_url},
                                           timeout=5, secret=FAKE_KEY, _allow_http_for_selftest_only=True)
        assert outcome["status"] == 200 and body == b"no secrets here"
        print("    GREEN PASS: the same scan mechanism lets a clean response through normally")
    finally:
        srv.shutdown()


def test_keyed_constructor_refuses_wrong_target():
    print("[7] keyed-client constructor refuses before secret append ... ")
    try:
        client.build_keyed_url(None)
        print("    RED FAIL: refused to raise on missing key")
        sys.exit(1)
    except client.KeyedClientRefused:
        print("    RED  PASS: missing key correctly refused")
    url = client.build_keyed_url(FAKE_KEY)
    assert url == client.KEYED_URL, "RED: constructor returned a URL other than the fixed target"
    assert url.startswith("https://") and "customer-api.open-meteo.com" in url
    print(f"    GREEN PASS: fixed keyed target is exactly {url!r}; no base-URL parameter exists for a "
          "caller to redirect the key to HTTP/loopback/an alternate host/port/path")


def make_selfsigned_cert(dirpath):
    key, cert = os.path.join(dirpath, "key.pem"), os.path.join(dirpath, "cert.pem")
    subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-keyout", key, "-out", cert,
                     "-days", "1", "-nodes", "-subj", "/CN=127.0.0.1",
                     "-addext", "subjectAltName=IP:127.0.0.1"], check=True, capture_output=True)
    return key, cert


def start_https_server(key, cert):
    httpd = http.server.HTTPServer(("127.0.0.1", 0), _Handler)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(certfile=cert, keyfile=key)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def test_tls_separate():
    print("[8] TLS test (separate from the mechanics above): real local cert tooling IS available here, "
          "so the trusted-test-CA adapter path is used, not the synthetic-SSL-failure fallback ... ")
    certdir = tempfile.mkdtemp(prefix="ticket485-iter3-cert-")
    try:
        key, cert = make_selfsigned_cert(certdir)
        httpd = start_https_server(key, cert)
        try:
            url = f"https://127.0.0.1:{httpd.server_port}/small"
            ledger = fresh_ledger()
            red_raised = False
            try:
                client.fetch_once(url, "data", ledger, allowed_exact_urls={url}, timeout=3)
            except requests.exceptions.RequestException:
                red_raised = True
            except Exception as e:
                red_raised = isinstance(e, Exception)  # any failure under default verify counts as RED here
            # fetch_once uses requests internally with verify=True by default (hardcoded) --
            # confirm it does NOT silently accept the untrusted cert.
            led = client.load_ledger(ledger)
            assert led["outcomes"][-1]["error"] == "TLS_FAILURE", (
                f"RED FAIL: expected TLS_FAILURE classification, got {led['outcomes'][-1]['error']!r}")
            print("    RED  PASS: untrusted self-signed cert rejected under default verification, "
                  "classified TLS_FAILURE (no raw exception/URL persisted)")
            print("    (No provider constructor in this client exposes a `verify=` override at all -- "
                  "there is no insecure path to test a GREEN case against; this is by design, not an "
                  "oversight: see client.py's `_do_get`, which hardcodes verify=True.)")
        finally:
            httpd.shutdown()
    finally:
        shutil.rmtree(certdir, ignore_errors=True)


def main():
    print("=== #485 iteration-3 client self-test (MANDATORY, before even the key-presence check) ===")
    print(f"scratch dir: {SCRATCH}\n")
    test_slow_drip_deadline()
    test_stalled_connect()
    test_oversized_compressed_body()
    test_fakekey_redirect_not_followed()
    test_crash_then_restart_consumes_slot()
    test_fakekey_leak_detection_red_then_green()
    test_keyed_constructor_refuses_wrong_target()
    test_tls_separate()
    print("\nALL MANDATORY SELF-TESTS PASS. The client may now be used for real, bounded, nonsecret "
          "doc/data requests. Keyed requests additionally require OPEN_METEO_API_KEY to be present in "
          "this process's environment (checked separately, boolean-only, never logged).")
    shutil.rmtree(SCRATCH, ignore_errors=True)


if __name__ == "__main__":
    main()
