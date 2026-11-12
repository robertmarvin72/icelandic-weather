import json
import tempfile
import unittest
from pathlib import Path

from dev_notify import config


class TestConfig(unittest.TestCase):
    def test_default_config_disables_ntfy(self):
        cfg = config.load_config(path=Path("/nonexistent/path/that/does/not/exist.json"))
        self.assertFalse(cfg["ntfy"]["enabled"])
        self.assertTrue(cfg["enabled"])

    def test_default_ntfy_timeout_fits_the_total_runtime_cap(self):
        # RN3/dedup-rules-addendum-1.md: lowered from 5s to 2s so ntfy
        # has a real chance to run inside the 5s hard total-runtime cap.
        cfg = config.load_config(path=Path("/nonexistent/path/that/does/not/exist.json"))
        self.assertEqual(cfg["ntfy"]["timeout_s"], 2)

    def test_override_file_merges_without_losing_defaults(self):
        tmpdir = tempfile.mkdtemp(prefix="dev-notify-config-test-")
        try:
            override_path = Path(tmpdir) / "config.json"
            override_path.write_text(json.dumps({"ntfy": {"enabled": True, "host": "ntfy.sh"}}), encoding="utf-8")
            cfg = config.load_config(path=override_path)
            self.assertTrue(cfg["ntfy"]["enabled"])
            self.assertEqual(cfg["ntfy"]["host"], "ntfy.sh")
            self.assertIn("timeout_s", cfg["ntfy"])  # default preserved alongside override
            self.assertTrue(cfg["windows_toast"]["enabled"])  # untouched section preserved
        finally:
            import shutil
            shutil.rmtree(tmpdir, ignore_errors=True)

    def test_corrupt_override_file_falls_back_to_defaults(self):
        tmpdir = tempfile.mkdtemp(prefix="dev-notify-config-test-")
        try:
            override_path = Path(tmpdir) / "config.json"
            override_path.write_text("{ not valid json", encoding="utf-8")
            cfg = config.load_config(path=override_path)
            self.assertEqual(cfg, json.loads(json.dumps(config.DEFAULT_CONFIG)))
        finally:
            import shutil
            shutil.rmtree(tmpdir, ignore_errors=True)

    def test_project_alias_from_static_table(self):
        cfg = {"project_aliases": {"/Users/x/myproj": "myproj-alias"}}
        alias = config.resolve_project_alias("/Users/x/myproj/sub/dir", cfg)
        self.assertEqual(alias, "myproj-alias")

    def test_project_alias_from_current_md_task_line(self):
        tmpdir = tempfile.mkdtemp(prefix="dev-notify-config-test-")
        try:
            current_md = Path(tmpdir) / "docs" / "ai" / "CURRENT.md"
            current_md.parent.mkdir(parents=True)
            current_md.write_text("# Current AI Task\n\nTask: some-task-name\nStage: READY_FOR_CC\n", encoding="utf-8")
            alias = config.resolve_project_alias(tmpdir, {"project_aliases": {}}, current_md_path=current_md)
            self.assertEqual(alias, "some-task-name")
        finally:
            import shutil
            shutil.rmtree(tmpdir, ignore_errors=True)

    def test_project_alias_falls_back_to_unknown(self):
        alias = config.resolve_project_alias("/no/such/path/at/all", {"project_aliases": {}}, current_md_path=None)
        self.assertEqual(alias, "unknown-project")

    def test_cwd_filter_permissive_when_unconfigured(self):
        self.assertTrue(config.is_cwd_allowed("/any/path", {"project_filter": {"allowed_cwd_prefixes": []}}))

    def test_cwd_filter_restrictive_when_configured(self):
        cfg = {"project_filter": {"allowed_cwd_prefixes": ["/Users/x/allowed"]}}
        self.assertTrue(config.is_cwd_allowed("/Users/x/allowed/sub", cfg))
        self.assertFalse(config.is_cwd_allowed("/Users/x/other-project", cfg))


if __name__ == "__main__":
    unittest.main()
