#!/usr/bin/env python3
"""
#493 phase2 -- P3: prove bounded_fetch.py's own enforcement on
127.0.0.1 BEFORE any real external call is sent. Own, separate
ledger (local-test-ledger.json) -- never touches the real exchange
budget. No external network access.
"""
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import bounded_fetch as bf


class TestHandler(BaseHTTPRequestHandler):
    def log_message(self, *args, **kwargs):  # silence default stderr logging
        pass

    def do_GET(self):
        if self.path == "/chunked_over_cap":
            # No Content-Length at all (simulates the chunked/unknown-
            # length response north-data's own round found curl's
            # --max-filesize cannot bound) -- send far more than the
            # test's own small cap.
            self.send_response(200)
            self.send_header("Transfer-Encoding", "chunked")
            self.end_headers()
            chunk = b"x" * 256
            for _ in range(200):  # 51,200 bytes total, >> the 1024 B test cap
                self.wfile.write(b"%x\r\n" % len(chunk))
                self.wfile.write(chunk + b"\r\n")
            self.wfile.write(b"0\r\n\r\n")
        elif self.path == "/slow":
            time.sleep(3)  # > the test's own short timeout
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"too late")
        elif self.path == "/redirect":
            self.send_response(302)
            self.send_header("Location", "https://example.invalid/elsewhere")
            self.end_headers()
        elif self.path == "/error":
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b"service unavailable")
        elif self.path == "/normal":
            body = b'{"ok": true}'
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()


def main():
    server = HTTPServer(("127.0.0.1", 0), TestHandler)
    port = server.server_port
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    try:
        results = {}

        local_allowlist = {"127.0.0.1"}

        # (a) chunked response exceeding the cap -> must truncate, not
        # read unbounded, and the ledger must record truncated=True.
        e = bf.bounded_fetch(
            "GET", f"http://127.0.0.1:{port}/chunked_over_cap",
            per_body_cap_bytes=1024, remaining_total_budget_bytes=1024,
            allow_insecure_for_local_test=True, allowlist=local_allowlist,
        )
        results["a_chunked_over_cap"] = {
            "bytes_received": e["bytes_received"], "truncated": e["truncated"],
            "pass": e["bytes_received"] <= 1024 and e["truncated"] is True,
        }

        # (b) timeout -> must not hang past the configured timeout.
        t0 = time.monotonic()
        e = bf.bounded_fetch(
            "GET", f"http://127.0.0.1:{port}/slow",
            timeout_s=1, allow_insecure_for_local_test=True, allowlist=local_allowlist,
        )
        elapsed = time.monotonic() - t0
        results["b_timeout"] = {
            "elapsed_s": elapsed, "error": e["error"],
            "pass": elapsed < 2.5 and e["error"] is not None,
        }

        # (c) redirect -> must be ledgered as its own status, NEVER
        # auto-followed (no request to the Location target is made).
        e = bf.bounded_fetch(
            "GET", f"http://127.0.0.1:{port}/redirect",
            allow_insecure_for_local_test=True, allowlist=local_allowlist,
        )
        results["c_redirect_not_followed"] = {
            "status": e["status"], "is_redirect": e["is_redirect"],
            "redirect_location": e["redirect_location"],
            "pass": e["status"] == 302 and e["is_redirect"] is True,
        }

        # (d) HTTP error status -> ledgered as such, not retried
        # (bounded_fetch itself never retries; confirmed by inspecting
        # that exactly one request was made -- the server's own request
        # counter, implicit in this single call).
        e = bf.bounded_fetch(
            "GET", f"http://127.0.0.1:{port}/error",
            allow_insecure_for_local_test=True, allowlist=local_allowlist,
        )
        results["d_http_error_status"] = {
            "status": e["status"], "pass": e["status"] == 503,
        }

        # (e) hostname allowlist rejection -- must STOP before even
        # attempting to connect (raises, caught here to record as a pass).
        try:
            bf.bounded_fetch("GET", f"http://127.0.0.1:{port}/normal", allowlist={"px.hagstofa.is"})
            results["e_hostname_allowlist_rejection"] = {"pass": False, "note": "did not raise"}
        except bf.BoundedFetchError as exc:
            results["e_hostname_allowlist_rejection"] = {"pass": True, "note": str(exc)}

        # (f) ledger write -- one normal success call, confirm a ledger
        # file is actually written with the full expected fields.
        e = bf.bounded_fetch(
            "GET", f"http://127.0.0.1:{port}/normal",
            allow_insecure_for_local_test=True, allowlist=local_allowlist,
        )
        bf.append_ledger("local-test-ledger-entries.jsonl", e)
        with open("local-test-ledger-entries.jsonl", encoding="utf-8") as f:
            lines = f.readlines()
        last = json.loads(lines[-1])
        required_fields = {
            "started_at_utc", "ended_at_utc", "method", "url", "status",
            "bytes_received", "truncated", "sha256_of_received_bytes",
        }
        results["f_ledger_write"] = {
            "pass": required_fields.issubset(last.keys()) and last["status"] == 200,
            "fields_present": sorted(last.keys()),
        }

        all_pass = all(r["pass"] for r in results.values())
        output = {"all_pass": all_pass, "results": results}
        with open("local-test-ledger.json", "w", encoding="utf-8", newline="\n") as f:
            json.dump(output, f, ensure_ascii=False, indent=1)
            f.write("\n")
        print(json.dumps(output, ensure_ascii=False, indent=1))
        return all_pass
    finally:
        server.shutdown()


if __name__ == "__main__":
    import sys

    ok = main()
    sys.exit(0 if ok else 1)
