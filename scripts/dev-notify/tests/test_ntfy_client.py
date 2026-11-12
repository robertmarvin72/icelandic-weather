import http.server
import threading
import time
import unittest

from dev_notify import ntfy_client

from . import _loopback


class _Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    seen_methods = []

    def log_message(self, fmt, *args):
        pass

    def do_POST(self):
        _Handler.seen_methods.append("POST")
        if self.path.startswith("/redirect-topic"):
            self.send_response(302)
            self.send_header("Location", "https://example.invalid/moved")
            self.send_header("Content-Length", "0")
            self.end_headers()
        elif self.path.startswith("/fail-topic"):
            self.send_response(500)
            self.send_header("Content-Length", "2")
            self.end_headers()
            self.wfile.write(b"no")
        elif self.path.startswith("/stall-topic"):
            self.send_response(200)
            self.send_header("Content-Length", "2")
            # deliberately never finish writing the body -- simulates a hang
            time.sleep(5)
        else:
            self.send_response(200)
            self.send_header("Content-Length", "2")
            self.end_headers()
            self.wfile.write(b"ok")

    def do_GET(self):
        _Handler.seen_methods.append("GET")
        self.send_response(200)
        self.send_header("Content-Length", "2")
        self.end_headers()
        self.wfile.write(b"ok")


class TestNtfyClient(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.loopback_ok, cls.loopback_reason = _loopback.loopback_available()
        if not cls.loopback_ok:
            # CV2(a): named, neither-green-nor-red outcome -- every test
            # method below skips (unittest's own distinct "skipped"
            # status, never silently counted as a pass) rather than
            # fail confusingly against a server that was never started.
            return
        cls.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        if cls.loopback_ok:
            cls.server.shutdown()
            cls.server.server_close()

    def _require_loopback(self):
        # Only the tests that actually need the real local server skip
        # on ENV_LOOPBACK_BLOCKED -- test_disallowed_host_refused_before_connecting
        # and test_empty_topic_refused raise before any socket operation
        # and must keep running regardless (CV2a's skip is scoped to
        # what genuinely needs loopback, not a blanket skip).
        if not self.loopback_ok:
            self.skipTest(self.loopback_reason)

    def test_successful_publish_uses_post_only(self):
        self._require_loopback()
        _Handler.seen_methods.clear()
        entry = ntfy_client.publish("127.0.0.1", "ok-topic", "t", "x", timeout_s=2, allowlist={"127.0.0.1"}, allow_insecure_for_local_test=True, port=self.port)
        self.assertEqual(entry["status"], 200, f"entry={entry}")
        self.assertIsNone(entry["error"], f"entry={entry}")
        self.assertEqual(entry["method"], "POST")
        self.assertNotIn("GET", _Handler.seen_methods)

    def test_http_failure_recorded_not_raised(self):
        self._require_loopback()
        entry = ntfy_client.publish("127.0.0.1", "fail-topic", "t", "x", timeout_s=2, allowlist={"127.0.0.1"}, allow_insecure_for_local_test=True, port=self.port)
        self.assertEqual(entry["status"], 500, f"entry={entry}")
        self.assertIsNone(entry["error"], f"entry={entry}")  # HTTP-level failure is not a transport exception

    def test_redirect_is_recorded_and_not_followed(self):
        self._require_loopback()
        entry = ntfy_client.publish("127.0.0.1", "redirect-topic", "t", "x", timeout_s=2, allowlist={"127.0.0.1"}, allow_insecure_for_local_test=True, port=self.port)
        self.assertTrue(entry["is_redirect"], f"entry={entry}")
        self.assertEqual(entry["redirect_location"], "https://example.invalid/moved")
        self.assertFalse(entry["redirect_followed"])

    def test_timeout_is_recorded_as_error_not_raised(self):
        self._require_loopback()
        entry = ntfy_client.publish("127.0.0.1", "stall-topic", "t", "x", timeout_s=1, allowlist={"127.0.0.1"}, allow_insecure_for_local_test=True, port=self.port)
        # CV2(b): must be a TIMEOUT-shaped error specifically, not any
        # error -- a connection-refused or other unrelated failure must
        # not be accepted as "the timeout test passed".
        self.assertIsNotNone(entry["error"], f"entry={entry}")
        self.assertTrue(
            "timeout" in entry["error"].lower() or "timed out" in entry["error"].lower(),
            f"expected a timeout-shaped error, got: {entry['error']!r} (full entry={entry})",
        )
        self.assertIsNone(entry["status"], f"entry={entry}")

    def test_disallowed_host_refused_before_connecting(self):
        with self.assertRaises(ntfy_client.NtfyError):
            ntfy_client.publish("not-allowed.invalid", "topic", "t", "x", allowlist={"127.0.0.1"})

    def test_empty_topic_refused(self):
        with self.assertRaises(ntfy_client.NtfyError):
            ntfy_client.publish("127.0.0.1", "", "t", "x", allowlist={"127.0.0.1"})

    def test_body_sha_computed_and_bounded(self):
        self._require_loopback()
        entry = ntfy_client.publish("127.0.0.1", "ok-topic", "t", "hello", timeout_s=2, allowlist={"127.0.0.1"}, allow_insecure_for_local_test=True, port=self.port)
        self.assertEqual(len(entry["sha256_of_body_sent"]), 64)
        self.assertEqual(entry["bytes_sent"], len(b"hello"))


if __name__ == "__main__":
    unittest.main()
