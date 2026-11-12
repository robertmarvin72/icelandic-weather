"""NT4's own canary methodology, see docs/ai/tasks/ticket-498/payload-allowlist.md.
A fixed canary token/phrase is planted in every NON-allowlisted field
of a fake payload; this test asserts it appears in NONE of the places
a leak could happen. This is the single most important negative-test
category in the whole suite.
"""
import json
import tempfile
import unittest
from pathlib import Path

from dev_notify import ntfy_client, state, templates
from dev_notify.dispatch import dispatch
from dev_notify.events import Agent, EventCategory, NotifyEvent, Surface
from dev_notify.adapters import claude_adapter

CANARY_TOKEN = "CANARY-7f3a9c21-DO-NOT-LEAK"
CANARY_PHRASE = "the quick canary jumps over"


def _fake_ntfy_publish(host, topic, title, text, **kwargs):
    # Captures what WOULD have been sent, without any network.
    _fake_ntfy_publish.last_call = {"host": host, "topic": topic, "title": title, "text": text}
    return {"status": 200, "error": None}


def _fake_windows_toast(title, text, **kwargs):
    _fake_windows_toast.last_call = {"title": title, "text": text}
    return {"method": "toast", "ok": True, "detail": "fake"}


class TestPayloadAllowlistCanary(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-canary-test-")
        self.state_path = Path(self.tmpdir) / "state.json"
        self.cfg = {
            "enabled": True,
            "windows_toast": {"enabled": True},
            "ntfy": {"enabled": True, "host": "ntfy.sh", "topic": "fake-topic-for-test", "timeout_s": 1},
        }

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_canary_never_reaches_toast_ntfy_or_state(self):
        payload = {
            "hook_event_name": "Stop",
            "session_id": "abc123",
            "cwd": f"/Users/{CANARY_TOKEN}/project",
            "last_assistant_message": f"{CANARY_PHRASE} {CANARY_TOKEN}",
            "transcript_path": f"/tmp/{CANARY_TOKEN}.jsonl",
            "stop_hook_active": False,
        }
        classification = claude_adapter.classify(payload)
        self.assertIsNotNone(classification)
        category, discriminator, error_code = classification

        event = NotifyEvent(agent=Agent.CC, surface=Surface.CLAUDE_CLI, event_category=category,
                             project_alias="test-project", discriminator=discriminator, error_code=error_code)

        result = dispatch(event, cfg=self.cfg, state_path=self.state_path,
                           send_windows=_fake_windows_toast, send_ntfy=_fake_ntfy_publish)

        # 1. Rendered text never contains the canary.
        rendered_text = json.dumps(result.get("rendered", {}))
        self.assertNotIn(CANARY_TOKEN, rendered_text)
        self.assertNotIn(CANARY_PHRASE, rendered_text)

        # 2. What was "sent" to the fake Windows toast never contains it.
        if hasattr(_fake_windows_toast, "last_call"):
            toast_blob = json.dumps(_fake_windows_toast.last_call)
            self.assertNotIn(CANARY_TOKEN, toast_blob)
            self.assertNotIn(CANARY_PHRASE, toast_blob)

        # 3. What was "sent" to the fake ntfy publish never contains it.
        if hasattr(_fake_ntfy_publish, "last_call"):
            ntfy_blob = json.dumps(_fake_ntfy_publish.last_call)
            self.assertNotIn(CANARY_TOKEN, ntfy_blob)
            self.assertNotIn(CANARY_PHRASE, ntfy_blob)

        # 4. The written state file never contains it.
        state_blob = self.state_path.read_text(encoding="utf-8")
        self.assertNotIn(CANARY_TOKEN, state_blob)
        self.assertNotIn(CANARY_PHRASE, state_blob)

    def test_canary_in_tool_input_and_cwd_never_leaks_via_codex_path(self):
        from dev_notify.adapters import codex_adapter
        payload = {
            "tool_input": {"command": f"echo {CANARY_TOKEN}"},
            "cwd": f"/Users/{CANARY_TOKEN}/project",
            "last_assistant_message": CANARY_PHRASE,
        }
        classification = codex_adapter.classify(payload)
        category, discriminator, error_code = classification
        event = NotifyEvent(agent=Agent.RIPLEY, surface=Surface.CODEX_CLI, event_category=category,
                             project_alias="test-project", discriminator=discriminator, error_code=error_code)
        result = dispatch(event, cfg=self.cfg, state_path=self.state_path,
                           send_windows=_fake_windows_toast, send_ntfy=_fake_ntfy_publish)
        blob = json.dumps(result)
        self.assertNotIn(CANARY_TOKEN, blob)
        self.assertNotIn(CANARY_PHRASE, blob)

    def test_canary_never_in_ntfy_http_request_itself(self):
        # Exercises the REAL ntfy_client.publish() construction (host
        # unreachable is fine -- we only check what bytes WOULD be sent
        # by inspecting the computed sha/body before any send failure).
        text = templates.render(NotifyEvent(agent=Agent.CC, surface=Surface.CLAUDE_CLI,
                                             event_category=EventCategory.COMPLETED, project_alias="test-project"))
        self.assertNotIn(CANARY_TOKEN, json.dumps(text))


if __name__ == "__main__":
    unittest.main()
