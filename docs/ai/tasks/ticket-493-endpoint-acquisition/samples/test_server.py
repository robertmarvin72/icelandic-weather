#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- EA2 localhost test server. stdlib only.
Each path simulates one required behaviour for the driver self-test,
run on 127.0.0.1 before any live call. Not part of the live path.
"""
import http.server
import threading
import time


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass  # silence stdlib's own stderr logging

    def do_GET(self):
        if self.path.startswith("/redirect"):
            self.send_response(302)
            self.send_header("Location", "https://example.invalid/moved")
            self.send_header("Content-Length", "0")
            self.end_headers()
        elif self.path.startswith("/not-200"):
            self.send_response(500)
            self.send_header("Content-Length", "2")
            self.end_headers()
            self.wfile.write(b"no")
        elif self.path.startswith("/over-cap-direct"):
            body = b"x" * 1000
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path.startswith("/over-cap-chunked"):
            self.send_response(200)
            self.send_header("Transfer-Encoding", "chunked")
            self.end_headers()
            chunk = b"y" * 100
            for _ in range(10):
                self.wfile.write(b"%x\r\n" % len(chunk))
                self.wfile.write(chunk + b"\r\n")
                self.wfile.flush()
            self.wfile.write(b"0\r\n\r\n")
        elif self.path.startswith("/mid-body-stall"):
            # Dribbles tiny chunks slower than any per-read socket
            # timeout would catch, but slower overall than the test's
            # own wall-clock cap -- the exact gap bounded_fetch's own
            # socket timeout cannot close (ledger_integrity-v3.json's
            # own disclosed finding, re-demonstrated here on localhost).
            self.send_response(200)
            self.send_header("Transfer-Encoding", "chunked")
            self.end_headers()
            for _ in range(6):
                chunk = b"z" * 10
                self.wfile.write(b"%x\r\n" % len(chunk))
                self.wfile.write(chunk + b"\r\n")
                self.wfile.flush()
                time.sleep(1.5)
            self.wfile.write(b"0\r\n\r\n")
        elif self.path.startswith("/remaining-less-than-cap"):
            body = b"q" * 50000
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path.startswith("/ok-small"):
            body = b"{}"
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()


def start_server():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


def stop_server(server):
    server.shutdown()
    server.server_close()
