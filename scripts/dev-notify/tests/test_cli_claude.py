"""Subprocess-level tests of cli_claude.py -- the actual entrypoint
that would be registered as a Claude Code hook command. These prove
NT3(a)'s own contract end-to-end: always exit 0, never write to
stdout, regardless of input shape.
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from ._hermetic_env import hermetic_env

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
CLI_PATH = SCRIPTS_DIR / "dev_notify" / "cli_claude.py"


class TestCliClaudeSubprocess(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-cli-claude-test-")
        # windows_toast/ntfy disabled so this test never pops a real
        # toast or makes a real HTTP call -- pure logic/exit-code proof.
        self.config_path = Path(self.tmpdir) / "config.json"
        self.config_path.write_text(json.dumps({"windows_toast": {"enabled": False}, "ntfy": {"enabled": False}}), encoding="utf-8")

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _run(self, stdin_bytes: bytes):
        # QA3: hermetic_env() strips every ambient DEV_NOTIFY_* var and
        # points LOCALAPPDATA/HOME at the temp dir -- cli_claude.py
        # doesn't read DEV_NOTIFY_CHAINED_NOTIFY_CMD at all, but the
        # same hermetic discipline applies uniformly to both
        # entrypoints per QA3's own blanket requirement.
        env = hermetic_env(self.tmpdir, DEV_NOTIFY_CONFIG_PATH=str(self.config_path))
        return subprocess.run([sys.executable, str(CLI_PATH)], input=stdin_bytes, capture_output=True, env=env, timeout=15)

    def test_valid_stop_event_exits_0_no_stdout(self):
        payload = json.dumps({"hook_event_name": "Stop", "session_id": "s", "cwd": self.tmpdir, "last_assistant_message": "done", "stop_hook_active": False}).encode("utf-8")
        proc = self._run(payload)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_permission_prompt_notification_exits_0_no_stdout(self):
        payload = json.dumps({"hook_event_name": "Notification", "notification_type": "permission_prompt", "cwd": self.tmpdir, "message": "x"}).encode("utf-8")
        proc = self._run(payload)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_malformed_json_exits_0_no_stdout(self):
        proc = self._run(b"{ this is not json at all !!")
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_empty_stdin_exits_0_no_stdout(self):
        proc = self._run(b"")
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_unknown_event_exits_0_no_stdout(self):
        payload = json.dumps({"hook_event_name": "SomeBrandNewEvent", "cwd": self.tmpdir}).encode("utf-8")
        proc = self._run(payload)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_oversized_stdin_truncated_and_still_exits_0_no_stdout(self):
        huge = b'{"hook_event_name": "Stop", "padding": "' + (b"x" * (2 * 1024 * 1024)) + b'"}'
        proc = self._run(huge)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_permissionrequest_payload_never_produces_stdout_even_if_misconfigured(self):
        # Defensive: even if this script were ever (incorrectly)
        # registered for PermissionRequest, it must never write to
        # stdout, since any stdout there is a live decision channel.
        payload = json.dumps({"hook_event_name": "PermissionRequest", "tool_name": "Bash", "cwd": self.tmpdir}).encode("utf-8")
        proc = self._run(payload)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    # --- RN2: exact Jonesy sandbox repro (2026-11-11) -- hostile field types ---

    def test_RN2_hostile_cwd_integer_exits_0_no_output(self):
        """Exact repro: {"hook_event_name":"Stop","cwd":123} previously
        crashed with exit 1 and a ~1.8KB traceback on stderr (TypeError
        from Path/.lower() on an int)."""
        payload = json.dumps({"hook_event_name": "Stop", "cwd": 123}).encode("utf-8")
        proc = self._run(payload)
        self.assertEqual(proc.returncode, 0, f"stderr was: {proc.stderr!r}")
        self.assertEqual(proc.stdout, b"")
        self.assertEqual(proc.stderr, b"")

    def test_RN2_hostile_cwd_list_exits_0_no_output(self):
        """Exact repro: {"hook_event_name":"Stop","cwd":["x"]}."""
        payload = json.dumps({"hook_event_name": "Stop", "cwd": ["x"]}).encode("utf-8")
        proc = self._run(payload)
        self.assertEqual(proc.returncode, 0, f"stderr was: {proc.stderr!r}")
        self.assertEqual(proc.stdout, b"")
        self.assertEqual(proc.stderr, b"")

    def test_RN2_hostile_field_types_on_every_known_event(self):
        hostile_payloads = [
            {"hook_event_name": "Stop", "cwd": None},
            {"hook_event_name": "Stop", "cwd": {"nested": "dict"}},
            {"hook_event_name": "Stop", "cwd": 3.14},
            {"hook_event_name": "Notification", "notification_type": 123, "cwd": self.tmpdir},
            {"hook_event_name": "Notification", "notification_type": ["permission_prompt"], "cwd": self.tmpdir},
            {"hook_event_name": "Notification", "notification_type": {"a": 1}, "cwd": self.tmpdir},
            {"hook_event_name": "StopFailure", "error": 123, "cwd": self.tmpdir},
            {"hook_event_name": "StopFailure", "error": ["rate_limit"], "cwd": self.tmpdir},
            {"hook_event_name": "StopFailure", "error": {"code": "rate_limit"}, "cwd": self.tmpdir},
            {"hook_event_name": 123},
            {"hook_event_name": None},
            {"hook_event_name": ["Stop"]},
        ]
        for payload in hostile_payloads:
            proc = self._run(json.dumps(payload).encode("utf-8"))
            self.assertEqual(proc.returncode, 0, f"payload {payload!r} -> stderr: {proc.stderr!r}")
            self.assertEqual(proc.stdout, b"", f"payload {payload!r} produced stdout")
            self.assertEqual(proc.stderr, b"", f"payload {payload!r} produced stderr")

    def test_RN2_root_level_non_dict_json_exits_0_no_output(self):
        for root in ([1, 2, 3], 42, "just a string", None, True, 3.14):
            proc = self._run(json.dumps(root).encode("utf-8"))
            self.assertEqual(proc.returncode, 0, f"root {root!r} -> stderr: {proc.stderr!r}")
            self.assertEqual(proc.stdout, b"")
            self.assertEqual(proc.stderr, b"")

    def test_valid_stop_event_has_no_stderr_either(self):
        payload = json.dumps({"hook_event_name": "Stop", "session_id": "s", "cwd": self.tmpdir, "last_assistant_message": "done", "stop_hook_active": False}).encode("utf-8")
        proc = self._run(payload)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")
        self.assertEqual(proc.stderr, b"")


if __name__ == "__main__":
    unittest.main()
