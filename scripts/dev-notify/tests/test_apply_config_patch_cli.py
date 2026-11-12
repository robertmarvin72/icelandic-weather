"""Subprocess-level smoke tests of apply_config_patch.py's own CLI.
Deliberately NEVER exercises `codex apply --apply` without
`--skip-chain` -- that specific combination is the one path that
calls the real `setx` against the real machine's user environment,
and is intentionally left NOT_TESTED by automation (see cc-report.md);
it is exercised only by a real, owner-run Phase B activation.
"""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
MODULE_PATH = SCRIPTS_DIR / "dev_notify" / "apply_config_patch.py"

CLAUDE_FIXTURE = {"permissions": {"allow": ["Bash(gh project:*)"]}}
CODEX_FIXTURE_TOML = 'model = "gpt-5"\nnotify = ["placeholder-not-real", "turn-ended"]\n'


class TestApplyConfigPatchCli(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-patch-cli-test-")

    def tearDown(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _run(self, args):
        return subprocess.run([sys.executable, str(MODULE_PATH)] + args, capture_output=True, text=True, timeout=15)

    def test_claude_plan_is_safe_and_default_dry_run(self):
        path = Path(self.tmpdir) / "settings.local.json"
        path.write_text(json.dumps(CLAUDE_FIXTURE), encoding="utf-8")
        before = path.read_text(encoding="utf-8")
        proc = self._run(["claude", "plan", "--path", str(path)])
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(path.read_text(encoding="utf-8"), before)
        result = json.loads(proc.stdout)
        self.assertFalse(result["no_op"])

    def test_claude_apply_without_apply_flag_is_dry_run(self):
        path = Path(self.tmpdir) / "settings.local.json"
        path.write_text(json.dumps(CLAUDE_FIXTURE), encoding="utf-8")
        before = path.read_text(encoding="utf-8")
        proc = self._run(["claude", "apply", "--path", str(path)])
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(path.read_text(encoding="utf-8"), before)
        result = json.loads(proc.stdout)
        self.assertFalse(result["applied"])

    def test_claude_apply_with_apply_flag_writes_and_rollback_restores(self):
        path = Path(self.tmpdir) / "settings.local.json"
        path.write_text(json.dumps(CLAUDE_FIXTURE), encoding="utf-8")
        apply_proc = self._run(["claude", "apply", "--path", str(path), "--apply"])
        self.assertEqual(apply_proc.returncode, 0)
        applied = json.loads(apply_proc.stdout)
        self.assertTrue(applied["applied"])
        written = json.loads(path.read_text(encoding="utf-8"))
        self.assertIn("hooks", written)

        rollback_proc = self._run(["claude", "rollback", "--path", str(path), "--backup", applied["backup_path"], "--apply"])
        self.assertEqual(rollback_proc.returncode, 0)
        self.assertEqual(json.loads(path.read_text(encoding="utf-8")), CLAUDE_FIXTURE)

    def test_codex_plan_is_safe_and_default_dry_run(self):
        path = Path(self.tmpdir) / "config.toml"
        path.write_text(CODEX_FIXTURE_TOML, encoding="utf-8")
        before = path.read_text(encoding="utf-8")
        proc = self._run(["codex", "plan", "--path", str(path)])
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(path.read_text(encoding="utf-8"), before)
        result = json.loads(proc.stdout)
        self.assertNotIn("placeholder-not-real", json.dumps(result))  # even this fixture's own old value is redacted

    def test_codex_apply_with_skip_chain_writes_and_rollback_restores(self):
        path = Path(self.tmpdir) / "config.toml"
        path.write_text(CODEX_FIXTURE_TOML, encoding="utf-8")
        apply_proc = self._run(["codex", "apply", "--path", str(path), "--apply", "--skip-chain"])
        self.assertEqual(apply_proc.returncode, 0)
        applied = json.loads(apply_proc.stdout)
        self.assertTrue(applied["applied"])

        rollback_proc = self._run(["codex", "rollback", "--path", str(path), "--backup", applied["backup_path"], "--apply"])
        self.assertEqual(rollback_proc.returncode, 0)
        self.assertEqual(path.read_text(encoding="utf-8"), CODEX_FIXTURE_TOML)

    def test_rollback_without_backup_arg_fails_cleanly(self):
        path = Path(self.tmpdir) / "settings.local.json"
        path.write_text(json.dumps(CLAUDE_FIXTURE), encoding="utf-8")
        proc = self._run(["claude", "rollback", "--path", str(path), "--apply"])
        self.assertEqual(proc.returncode, 2)


if __name__ == "__main__":
    unittest.main()
