import tempfile
import threading
import time
import unittest
from pathlib import Path

from dev_notify.dispatch import dispatch
from dev_notify.events import Agent, EventCategory, NotifyEvent, Surface


def _ok_windows(title, text, **kw):
    return {"method": "toast", "ok": True, "detail": "fake"}


def _ok_ntfy(host, topic, title, text, **kw):
    return {"status": 200, "error": None}


def _raising_windows(title, text, **kw):
    raise RuntimeError("simulated Windows transport failure")


def _raising_ntfy(host, topic, title, text, **kw):
    raise RuntimeError("simulated ntfy transport failure")


class TestDispatch(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-dispatch-test-")
        self.state_path = Path(self.tmpdir) / "state.json"
        self.event = NotifyEvent(agent=Agent.CC, surface=Surface.CLAUDE_CLI, event_category=EventCategory.COMPLETED, project_alias="proj")

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_disabled_mode_sends_nothing(self):
        cfg = {"enabled": False}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows, send_ntfy=_ok_ntfy)
        self.assertFalse(result["sent"])
        self.assertEqual(result["reason"], "disabled_in_config")

    def test_ntfy_not_configured_is_skipped_not_attempted(self):
        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": False}}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows, send_ntfy=_ok_ntfy)
        self.assertTrue(result["sent"])
        self.assertTrue(result["ntfy"]["skipped"])

    def test_windows_transport_failure_does_not_prevent_ntfy_or_crash(self):
        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t", "timeout_s": 1}}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_raising_windows, send_ntfy=_ok_ntfy)
        self.assertTrue(result["sent"])
        self.assertFalse(result["windows"]["ok"])
        self.assertEqual(result["ntfy"]["status"], 200)

    def test_ntfy_transport_failure_does_not_crash_or_affect_windows(self):
        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t", "timeout_s": 1}}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows, send_ntfy=_raising_ntfy)
        self.assertTrue(result["sent"])
        self.assertTrue(result["windows"]["ok"])
        self.assertIn("error", result["ntfy"])

    # --- RN4: ntfy token wired to secret_store, only when ntfy is enabled ---

    def test_ntfy_enabled_with_secret_reads_token_and_passes_it_to_send_ntfy(self):
        captured = {}

        def fake_ntfy_capturing_token(host, topic, title, text, **kw):
            captured["token"] = kw.get("token")
            return {"status": 200, "error": None}

        def fake_read_secret(path):
            return b"super-secret-token-value"

        cfg = {"enabled": True, "windows_toast": {"enabled": False},
               "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t", "timeout_s": 1, "token_secret_path": "/fake/path"}}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows,
                           send_ntfy=fake_ntfy_capturing_token, read_secret=fake_read_secret)
        self.assertTrue(result["sent"])
        self.assertEqual(captured["token"], "super-secret-token-value")

    def test_ntfy_enabled_without_secret_path_sends_no_token(self):
        captured = {}

        def fake_ntfy_capturing_token(host, topic, title, text, **kw):
            captured["token"] = kw.get("token")
            return {"status": 200, "error": None}

        cfg = {"enabled": True, "windows_toast": {"enabled": False},
               "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t", "timeout_s": 1, "token_secret_path": None}}
        dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows,
                 send_ntfy=fake_ntfy_capturing_token, read_secret=lambda p: (_ for _ in ()).throw(AssertionError("must not be called")))
        self.assertIsNone(captured["token"])

    def test_ntfy_secret_read_failure_skips_ntfy_without_crashing(self):
        def failing_read_secret(path):
            raise RuntimeError("DPAPI decrypt failed")

        def ntfy_that_must_not_be_called(*a, **kw):
            raise AssertionError("send_ntfy must not be called when the secret read failed")

        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t", "token_secret_path": "/fake/path"}}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows,
                           send_ntfy=ntfy_that_must_not_be_called, read_secret=failing_read_secret)
        self.assertTrue(result["sent"])
        self.assertTrue(result["windows"]["ok"], "Windows must still succeed even if the ntfy secret read fails")
        self.assertTrue(result["ntfy"]["skipped"])
        self.assertEqual(result["ntfy"]["reason"], "ntfy_token_secret_read_failed")

    def test_ntfy_disabled_never_reads_the_secret(self):
        def read_secret_must_not_be_called(path):
            raise AssertionError("read_secret must never be called when ntfy is disabled")

        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": False, "token_secret_path": "/fake/path"}}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows,
                           send_ntfy=_ok_ntfy, read_secret=read_secret_must_not_be_called)
        self.assertTrue(result["ntfy"]["skipped"])

    def test_ntfy_token_never_appears_outside_the_injected_send_ntfy_call(self):
        canary = "CANARY-TOKEN-7f3a9c21-DO-NOT-LEAK"

        def fake_ntfy_ledger_style(host, topic, title, text, **kw):
            # A real ntfy_client.publish-style return never includes the token.
            return {"status": 200, "error": None, "bytes_sent": len(text)}

        cfg = {"enabled": True, "windows_toast": {"enabled": False},
               "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t", "token_secret_path": "/fake/path"}}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows,
                           send_ntfy=fake_ntfy_ledger_style, read_secret=lambda p: canary.encode("utf-8"))
        blob = __import__("json").dumps(result)
        self.assertNotIn(canary, blob, "the token must never appear in dispatch()'s own returned result")
        state_blob = self.state_path.read_text(encoding="utf-8")
        self.assertNotIn(canary, state_blob, "the token must never appear in the dedup state file")

    # --- RC2/QA2: Windows and ntfy run in parallel, each within its own sub-budget ---

    def test_RC2_ntfy_completes_within_its_own_budget_while_windows_is_still_slow(self):
        events_log = []
        lock = threading.Lock()

        def slow_windows(title, text, **kw):
            with lock:
                events_log.append(("windows_start", time.monotonic()))
            time.sleep(4.5)  # longer than WINDOWS_SUBBUDGET_S (4.0s)
            with lock:
                events_log.append(("windows_end", time.monotonic()))
            return {"method": "balloon", "ok": True}

        def fast_ntfy(host, topic, title, text, **kw):
            with lock:
                events_log.append(("ntfy_start", time.monotonic()))
            time.sleep(1.8)  # inside NTFY_SUBBUDGET_S (2.0s)
            with lock:
                events_log.append(("ntfy_end", time.monotonic()))
            return {"status": 200, "error": None}

        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t"}}
        t0 = time.monotonic()
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=slow_windows, send_ntfy=fast_ntfy)
        elapsed = time.monotonic() - t0

        self.assertEqual(result["windows"]["status"], "PENDING", f"windows should still be PENDING at its own 4.0s join deadline: {result['windows']}")
        self.assertEqual(result["ntfy"]["status"], 200, f"ntfy should have completed within its own 2.0s budget: {result['ntfy']}")
        self.assertLess(elapsed, 4.6, f"dispatch() should return near the windows sub-budget, not wait extra for anything (took {elapsed:.2f}s)")
        self.assertGreater(elapsed, 3.9, f"should not return suspiciously early either (took {elapsed:.2f}s)")

        starts = {name: t for name, t in events_log if name.endswith("_start")}
        self.assertLess(abs(starts["windows_start"] - starts["ntfy_start"]), 0.3,
                         "both channels must start together -- ntfy must never wait behind windows (QA2c)")

    def test_RC2_hanging_windows_sender_does_not_block_ntfy_or_report_false_success(self):
        def hanging_windows(title, text, **kw):
            time.sleep(100)  # never finishes within this test's lifetime -- daemon thread, harmless at process exit
            return {"method": "toast", "ok": True}  # pragma: no cover -- never reached in this test

        def fast_ntfy(host, topic, title, text, **kw):
            return {"status": 200, "error": None}

        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t"}}
        t0 = time.monotonic()
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=hanging_windows, send_ntfy=fast_ntfy,
                           windows_subbudget_s=0.3, ntfy_subbudget_s=0.3)
        elapsed = time.monotonic() - t0
        self.assertEqual(result["windows"]["status"], "PENDING")
        self.assertNotIn("ok", result["windows"], "a hanging sender must never be reported as a successful send")
        self.assertEqual(result["ntfy"]["status"], 200)
        self.assertLess(elapsed, 1.0, "a hung sender on a short injected sub-budget must not block dispatch() from returning")

    def test_RC2_hanging_ntfy_does_not_block_windows(self):
        def ok_windows(title, text, **kw):
            return {"method": "balloon", "ok": True}

        def hanging_ntfy(host, topic, title, text, **kw):
            time.sleep(100)
            return {"status": 200, "error": None}  # pragma: no cover

        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t"}}
        result = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=ok_windows, send_ntfy=hanging_ntfy,
                           windows_subbudget_s=0.3, ntfy_subbudget_s=0.3)
        self.assertTrue(result["windows"]["ok"])
        self.assertEqual(result["ntfy"]["status"], "PENDING")

    def test_RC2_each_channel_sent_exactly_once(self):
        calls = {"windows": 0, "ntfy": 0}

        def counting_windows(title, text, **kw):
            calls["windows"] += 1
            return {"method": "balloon", "ok": True}

        def counting_ntfy(host, topic, title, text, **kw):
            calls["ntfy"] += 1
            return {"status": 200, "error": None}

        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "t"}}
        dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=counting_windows, send_ntfy=counting_ntfy)
        self.assertEqual(calls, {"windows": 1, "ntfy": 1})

    def test_deduplication_prevents_second_dispatch(self):
        cfg = {"enabled": True, "windows_toast": {"enabled": True}, "ntfy": {"enabled": False}}
        first = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows, send_ntfy=_ok_ntfy)
        second = dispatch(self.event, cfg=cfg, state_path=self.state_path, send_windows=_ok_windows, send_ntfy=_ok_ntfy)
        self.assertTrue(first["sent"])
        self.assertFalse(second["sent"])
        self.assertEqual(second["reason"], "deduplicated")


if __name__ == "__main__":
    unittest.main()
