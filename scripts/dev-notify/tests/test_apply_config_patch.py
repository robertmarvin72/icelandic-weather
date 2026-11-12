"""Exercises apply_config_patch.py against TEMPFILE COPIES only --
never the real `.claude/settings.local.json` or `~/.codex/
config.toml`. Proves: dry-run-by-default (NT1), backup+SHA+parse-
validate-before-and-after+merge-not-overwrite (NT7), and that the
real Codex `notify` value never appears in any rendered diff/plan
dict (the canary-style check for this task's own redaction rule).
"""
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from dev_notify import apply_config_patch as patch

SECRET_MARKER = "C:/Users/SOMEONE/SECRET-APP/legacy-notify-tool-CANARY.exe"

CLAUDE_FIXTURE = {"permissions": {"allow": ["Bash(gh project:*)", "Bash(gh auth:*)"]}}

CODEX_FIXTURE_TOML = f'''model = "gpt-5"
notify = ['{SECRET_MARKER}', "turn-ended"]

[projects.'c:/fake/path']
trust_level = "trusted"

[some_section]
notify = ["unrelated-nested-value"]
'''


def _walk_strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from _walk_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _walk_strings(v)


class TestApplyConfigPatchClaude(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-patch-claude-test-")
        self.path = Path(self.tmpdir) / "settings.local.json"
        self.path.write_text(json.dumps(CLAUDE_FIXTURE, indent=2), encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_plan_never_writes(self):
        before = self.path.read_text(encoding="utf-8")
        plan = patch.plan_claude(self.path, "python", "/x/cli_claude.py")
        self.assertFalse(plan["no_op"])
        self.assertIn("Notification", plan["diff"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_apply_without_flag_does_not_write(self):
        before = self.path.read_text(encoding="utf-8")
        result = patch.apply_claude(self.path, "python", "/x/cli_claude.py", apply=False)
        self.assertFalse(result["applied"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_display_path_masks_real_path_in_diff_header(self):
        plan = patch.plan_claude(self.path, "python", "/x/cli_claude.py", display_path=".claude/settings.local.json")
        self.assertNotIn(str(self.path), plan["diff"])
        self.assertIn(".claude/settings.local.json", plan["diff"])

    def test_apply_with_flag_writes_backup_and_merges(self):
        result = patch.apply_claude(self.path, "python", "/x/cli_claude.py", apply=True)
        self.assertTrue(result["applied"])
        backup = Path(result["backup_path"])
        self.assertTrue(backup.exists())
        self.assertEqual(json.loads(backup.read_text(encoding="utf-8")), CLAUDE_FIXTURE)
        written = json.loads(self.path.read_text(encoding="utf-8"))
        self.assertEqual(written["permissions"], CLAUDE_FIXTURE["permissions"])  # preserved, not overwritten
        for event in ("Notification", "Stop", "StopFailure"):
            self.assertIn(event, written["hooks"])
            self.assertEqual(len(written["hooks"][event]), 1)
            handler = written["hooks"][event][0]["hooks"][0]
            self.assertIs(handler["async"], True, f"{event} hook must set async: true (RN3/CV1)")
            self.assertEqual(handler["timeout"], 10)

    def test_reapply_is_idempotent_no_duplicate_entries(self):
        patch.apply_claude(self.path, "python", "/x/cli_claude.py", apply=True)
        plan2 = patch.plan_claude(self.path, "python", "/x/cli_claude.py")
        self.assertTrue(plan2["no_op"])
        patch.apply_claude(self.path, "python", "/x/cli_claude.py", apply=True)
        written = json.loads(self.path.read_text(encoding="utf-8"))
        self.assertEqual(len(written["hooks"]["Stop"]), 1)  # still 1, not 2

    def test_merge_preserves_preexisting_hook_from_another_tool(self):
        existing = json.loads(self.path.read_text(encoding="utf-8"))
        existing["hooks"] = {"Stop": [{"hooks": [{"type": "command", "command": "some-other-tool.sh"}]}]}
        self.path.write_text(json.dumps(existing, indent=2), encoding="utf-8")
        patch.apply_claude(self.path, "python", "/x/cli_claude.py", apply=True)
        written = json.loads(self.path.read_text(encoding="utf-8"))
        self.assertEqual(len(written["hooks"]["Stop"]), 2)
        commands = [h["command"] for group in written["hooks"]["Stop"] for h in group["hooks"]]
        self.assertIn("some-other-tool.sh", commands)

    def test_invalid_existing_json_raises_rather_than_guesses(self):
        self.path.write_text("{ not json", encoding="utf-8")
        with self.assertRaises(json.JSONDecodeError):
            patch.plan_claude(self.path, "python", "/x/cli_claude.py")

    def test_rollback_without_flag_does_not_write(self):
        result = patch.apply_claude(self.path, "python", "/x/cli_claude.py", apply=True)
        backup = Path(result["backup_path"])
        before_rollback = self.path.read_text(encoding="utf-8")
        rb = patch.rollback_claude(self.path, backup, apply=False)
        self.assertFalse(rb["applied"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), before_rollback)

    def test_rollback_with_flag_restores_original(self):
        result = patch.apply_claude(self.path, "python", "/x/cli_claude.py", apply=True)
        backup = Path(result["backup_path"])
        rb = patch.rollback_claude(self.path, backup, apply=True)
        self.assertTrue(rb["applied"])
        self.assertEqual(json.loads(self.path.read_text(encoding="utf-8")), CLAUDE_FIXTURE)


class TestApplyConfigPatchCodex(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-patch-codex-test-")
        self.path = Path(self.tmpdir) / "config.toml"
        self.path.write_text(CODEX_FIXTURE_TOML, encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_plan_redacts_real_notify_value_everywhere(self):
        plan = patch.plan_codex(self.path, "python", "/x/cli_codex.py")
        for s in _walk_strings(plan):
            self.assertNotIn(SECRET_MARKER, s)
        self.assertIn(patch.REDACTED_NOTIFY_PLACEHOLDER, plan["diff"])

    def test_plan_never_writes(self):
        before = self.path.read_text(encoding="utf-8")
        patch.plan_codex(self.path, "python", "/x/cli_codex.py")
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_display_path_masks_real_path_in_diff_header(self):
        plan = patch.plan_codex(self.path, "python", "/x/cli_codex.py", display_path="<HOME>/.codex/config.toml")
        self.assertNotIn(str(self.path), plan["diff"])
        self.assertIn("<HOME>/.codex/config.toml", plan["diff"])

    def test_nested_notify_under_section_is_untouched(self):
        patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True)
        written = self.path.read_text(encoding="utf-8")
        self.assertIn('notify = ["unrelated-nested-value"]', written)

    def test_apply_without_flag_does_not_write(self):
        before = self.path.read_text(encoding="utf-8")
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=False)
        self.assertFalse(result["applied"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_apply_with_flag_writes_backup_and_replaces_only_notify(self):
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True)
        self.assertTrue(result["applied"])
        backup = Path(result["backup_path"])
        self.assertEqual(backup.read_text(encoding="utf-8"), CODEX_FIXTURE_TOML)
        import tomllib
        written = tomllib.loads(self.path.read_text(encoding="utf-8"))
        self.assertEqual(written["notify"], ["python", "/x/cli_codex.py"])
        self.assertEqual(written["model"], "gpt-5")
        self.assertEqual(written["projects"]["c:/fake/path"]["trust_level"], "trusted")

    # --- AP3: persist -> verify (read back from the REAL source, never os.environ) -> only then write config ---

    def test_apply_persists_chain_with_real_old_command_only_via_injected_callable(self):
        captured = []
        store = {}

        def fake_persist(value_json):
            captured.append(value_json)
            store["value"] = value_json  # simulates the real persisted source (e.g. the registry)

        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=fake_persist, read_back_chain=lambda: store.get("value"))
        self.assertTrue(result["applied"])
        self.assertEqual(len(captured), 1)
        self.assertIn(SECRET_MARKER, captured[0])  # the real value DOES reach this one injected sink, by design
        import tomllib
        written = tomllib.loads(self.path.read_text(encoding="utf-8"))
        self.assertEqual(written["notify"], ["python", "/x/cli_codex.py"])

    def test_apply_without_flag_never_calls_persist(self):
        captured = []
        patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=False,
                           persist_chain=lambda v: captured.append(v), read_back_chain=lambda: None)
        self.assertEqual(captured, [])

    def test_apply_refuses_config_write_when_persist_fails(self):
        """AP3's own repro: the old code wrote config FIRST and only
        called setx after with check=False, so a failing setx silently
        lost the old Codex notify. This proves the new order: if
        persist_chain raises, the config file is NEVER written."""
        before = self.path.read_text(encoding="utf-8")

        def failing_persist(value_json):
            raise RuntimeError("simulated: setx exited 1")

        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=failing_persist, read_back_chain=lambda: None)
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_persist_failed")
        self.assertIsNone(result["backup_path"], "no backup should exist -- nothing was ever written")
        self.assertEqual(self.path.read_text(encoding="utf-8"), before, "config.toml must be byte-identical to before -- the old notify line must never fall out")

    def test_apply_refuses_config_write_when_readback_does_not_match(self):
        """Simulates a silently truncated/mangled setx value (e.g.
        Windows' own ~1024-char setx limit, or a quoting change) --
        persist_chain itself reports success, but what comes back from
        the real persisted source AFTER persisting does not match what
        was asked to be persisted. Must refuse the config write
        identically to an outright persist failure. Stateful fake:
        empty BEFORE persist_chain runs (so CG5(a)'s own pre-check,
        which also reads this, sees nothing pre-existing and lets
        persist_chain proceed), wrong AFTER (so the post-persist
        verification -- not the pre-check -- is what catches this)."""
        before = self.path.read_text(encoding="utf-8")
        store = {}
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: store.update(value="something-truncated-or-wrong"),
                                    read_back_chain=lambda: store.get("value"))
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_persist_verification_failed")
        self.assertIsNone(result["backup_path"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_apply_refuses_config_write_when_read_back_chain_not_given(self):
        # persist_chain given but no way to verify it -- must not
        # silently proceed as if verification passed.
        before = self.path.read_text(encoding="utf-8")
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: None, read_back_chain=None)
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_persist_verification_failed")
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_apply_with_no_persist_chain_at_all_still_writes_config(self):
        # AP3 path (ii): persistence handled as a separate owner step
        # entirely outside this tool -- apply_codex() itself does not
        # gate on anything it wasn't asked to verify.
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True)
        self.assertTrue(result["applied"])

    def test_apply_round_trips_a_value_containing_quotes(self):
        # The real old-notify argv can itself contain double quotes
        # (e.g. a Windows path with spaces gets quoted by the shell
        # that originally built it) -- the persist/readback round
        # trip must preserve them exactly, not just plain ASCII.
        self.path.write_text(CODEX_FIXTURE_TOML.replace(SECRET_MARKER, SECRET_MARKER + '" with "quotes" inside'), encoding="utf-8")
        store = {}
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: store.update(value=v),
                                    read_back_chain=lambda: store.get("value"))
        self.assertTrue(result["applied"])

    def test_apply_refuses_when_setx_style_1024_char_truncation_is_simulated(self):
        # Windows' own setx has a long-documented ~1024-character
        # value limit that silently truncates anything longer. Build
        # a fixture whose real old `notify` value is long enough that
        # a [:1024] truncation actually changes it, then have the
        # fake persist_chain simulate that exact truncation. The
        # mismatch against the FULL original value must be caught.
        long_marker = SECRET_MARKER + ("x" * 2000)
        long_fixture = f'''model = "gpt-5"
notify = ['{long_marker}', "turn-ended"]

[projects.'c:/fake/path']
trust_level = "trusted"
'''
        self.path.write_text(long_fixture, encoding="utf-8")
        store = {}

        def fake_persist_truncating(value_json):
            store["truncated"] = value_json[:1024]  # simulates setx's own silent limit

        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=fake_persist_truncating,
                                    read_back_chain=lambda: store.get("truncated"))
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_persist_verification_failed")
        self.assertEqual(self.path.read_text(encoding="utf-8"), long_fixture, "config.toml must be untouched -- the old notify command must never fall out")

    # --- RE1/CG2: apply_codex must refuse a second apply on an already-patched config ---

    def test_RE1_second_apply_on_already_patched_config_is_refused(self):
        """Exact repro, now fixed: first apply persists the ORIGINAL
        old command and writes the wrapper. A second apply must NOT
        read the now-current `notify` (the wrapper itself) as "the
        old command to chain to" and persist THAT -- it must refuse
        outright, with no side effects at all."""
        first = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True)
        self.assertTrue(first["applied"])
        after_first = self.path.read_text(encoding="utf-8")

        captured_persists = []
        second = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: captured_persists.append(v),
                                    read_back_chain=lambda: None)
        self.assertFalse(second["applied"])
        self.assertEqual(second["reason"], "already_patched")
        self.assertIsNone(second["backup_path"])
        self.assertEqual(captured_persists, [], "persist_chain must never be called on an already-patched config")
        self.assertEqual(self.path.read_text(encoding="utf-8"), after_first, "config.toml must be untouched by the refused second apply")

    def test_RE1_plan_on_already_patched_config_reports_already_patched(self):
        patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True)
        plan = patch.plan_codex(self.path, "python", "/x/cli_codex.py")
        self.assertTrue(plan.get("already_patched"))
        self.assertEqual(plan["diff"], "")

    def test_RE1_already_patched_detected_across_different_python_path_case_and_separators(self):
        # The exact gap RE1 found: a DIFFERENT python interpreter path
        # (not byte-identical to the one used originally) must still
        # be recognized as "already patched", since only the cli_codex.py
        # wrapper path itself matters, not which interpreter runs it.
        already_patched_fixture = '''model = "gpt-5"
notify = ['C:\\Different\\PYTHON.EXE', 'C:/some/other/path/CLI_CODEX.PY']
'''
        self.path.write_text(already_patched_fixture, encoding="utf-8")
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True)
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "already_patched")

    def test_RE1_two_applies_in_a_row_second_is_refused_end_to_end(self):
        results = [patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True) for _ in range(2)]
        self.assertTrue(results[0]["applied"])
        self.assertFalse(results[1]["applied"])
        self.assertEqual(results[1]["reason"], "already_patched")

    # --- CG5(a): refuse to clobber a DIFFERENT pre-existing persisted chain value ---

    def test_CG5a_refuses_when_a_different_chain_value_is_already_persisted(self):
        captured_persists = []
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: captured_persists.append(v),
                                    read_back_chain=lambda: json.dumps(["something", "else", "entirely"]))
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_already_set_different")
        self.assertIsNone(result["backup_path"])
        self.assertEqual(captured_persists, [], "persist_chain must never be called when a different value is already there")

    def test_CG5a_allows_idempotent_retry_when_persisted_value_already_equals_expected(self):
        # e.g. a retry after a prior config_write_failed -- the chain
        # value is already exactly right; re-persisting it is fine.
        expected = json.dumps([SECRET_MARKER, "turn-ended"])
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: None,
                                    read_back_chain=lambda: expected)
        self.assertTrue(result["applied"])

    # --- RF2(c)/PS1(d): an unreadable initial persisted-state check must refuse, never silently proceed ---

    def test_RF2c_apply_refuses_when_initial_readback_raises_oserror(self):
        before = self.path.read_text(encoding="utf-8")
        captured_persists = []

        def raising_read_back():
            raise PermissionError("simulated: access denied reading the registry")

        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: captured_persists.append(v),
                                    read_back_chain=raising_read_back)
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_state_unreadable")
        self.assertIsNone(result["backup_path"])
        self.assertEqual(captured_persists, [], "persist_chain must never be called when the initial read fails")
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_RF2c_apply_refuses_when_initial_readback_raises_importerror(self):
        # Simulates the non-Windows case (`import winreg` itself fails).
        before = self.path.read_text(encoding="utf-8")
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: None,
                                    read_back_chain=lambda: (_ for _ in ()).throw(ImportError("no winreg on this platform")))
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_state_unreadable")
        self.assertIsNone(result["backup_path"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    # --- RF5/PS3/PS5: an ambiguous (not genuinely wrapper-matching) old notify must get a distinct reason ---

    def test_RF5_ambiguous_old_notify_gets_distinct_reason_not_already_patched(self):
        ambiguous_fixture = '''model = "gpt-5"
notify = ["tool.exe", ""]
'''
        self.path.write_text(ambiguous_fixture, encoding="utf-8")
        plan = patch.plan_codex(self.path, "python", "/x/cli_codex.py")
        self.assertFalse(plan.get("already_patched"), "a legitimate-but-ambiguous old command must not be reported as already_patched")
        self.assertTrue(plan.get("notify_ambiguous"))

        captured_persists = []
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: captured_persists.append(v))
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "notify_ambiguous_or_wrapper")
        self.assertIsNone(result["backup_path"])
        self.assertEqual(captured_persists, [])
        self.assertEqual(self.path.read_text(encoding="utf-8"), ambiguous_fixture)

    # --- RG2/TI2: `detail` must be type-name-only (+ returncode for SetxFailedError), never exception text ---

    def test_TI2_chain_state_unreadable_detail_never_leaks_exception_text(self):
        canary = "CANARY-UNREADABLE-7f3a9c21-" + SECRET_MARKER
        before = self.path.read_text(encoding="utf-8")

        def raising_read_back():
            raise PermissionError(canary)

        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=lambda v: None, read_back_chain=raising_read_back)
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_state_unreadable")
        self.assertEqual(result["detail"], {"type": "PermissionError"})
        serialized = json.dumps(result)
        self.assertNotIn(canary, serialized)
        self.assertNotIn(SECRET_MARKER, serialized)
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_TI2_chain_persist_failed_detail_never_leaks_exception_text(self):
        canary = "CANARY-PERSISTFAIL-7f3a9c21-" + SECRET_MARKER
        before = self.path.read_text(encoding="utf-8")

        def failing_persist(value_json):
            raise RuntimeError(canary)

        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=failing_persist, read_back_chain=lambda: None)
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_persist_failed")
        self.assertEqual(result["detail"], {"type": "RuntimeError"})
        serialized = json.dumps(result)
        self.assertNotIn(canary, serialized)
        self.assertNotIn(SECRET_MARKER, serialized)
        self.assertEqual(self.path.read_text(encoding="utf-8"), before)

    def test_TI2_setx_failed_error_detail_carries_only_returncode_never_stderr_text(self):
        # real_persist_chain's own exception class -- proves the
        # returncode (a bounded int, never secret) is surfaced while
        # the constructor never even accepts stderr text to carry.
        def failing_persist(value_json):
            raise patch.SetxFailedError(17)

        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=failing_persist, read_back_chain=lambda: None)
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "chain_persist_failed")
        self.assertEqual(result["detail"], {"type": "SetxFailedError", "returncode": 17})

    def test_TI2_config_write_failed_detail_never_leaks_exception_text(self):
        canary = "CANARY-WRITEFAIL-7f3a9c21-" + SECRET_MARKER

        def failing_write_atomic(path_arg, text_arg):
            raise OSError(canary)

        old_write_atomic = patch._write_atomic
        patch._write_atomic = failing_write_atomic
        try:
            result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True)
        finally:
            patch._write_atomic = old_write_atomic
        self.assertFalse(result["applied"])
        self.assertEqual(result["reason"], "config_write_failed")
        self.assertEqual(result["detail"], {"type": "OSError"})
        self.assertIsNotNone(result["backup_path"], "backup_path must still be returned on a write failure (AP3)")
        serialized = json.dumps(result)
        self.assertNotIn(canary, serialized)
        self.assertNotIn(SECRET_MARKER, serialized)

    def test_rollback_after_persist_failure_is_a_noop_since_nothing_was_backed_up(self):
        def failing_persist(value_json):
            raise RuntimeError("boom")

        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True,
                                    persist_chain=failing_persist, read_back_chain=lambda: None)
        self.assertIsNone(result["backup_path"])  # nothing to roll back -- confirms AP3's own "no backup on refusal" contract

    def test_rollback_with_flag_restores_original(self):
        result = patch.apply_codex(self.path, "python", "/x/cli_codex.py", apply=True)
        backup = Path(result["backup_path"])
        rb = patch.rollback_codex(self.path, backup, apply=True)
        self.assertTrue(rb["applied"])
        self.assertEqual(self.path.read_text(encoding="utf-8"), CODEX_FIXTURE_TOML)

    def test_invalid_existing_toml_raises_rather_than_guesses(self):
        self.path.write_text("not = [valid toml", encoding="utf-8")
        import tomllib
        with self.assertRaises(tomllib.TOMLDecodeError):
            patch.plan_codex(self.path, "python", "/x/cli_codex.py")

    def test_missing_notify_key_raises_rather_than_guesses(self):
        self.path.write_text('model = "gpt-5"\n', encoding="utf-8")
        with self.assertRaises(ValueError):
            patch.plan_codex(self.path, "python", "/x/cli_codex.py")


# --- PS1(c): real_read_back_chain()'s OWN internal logic, via an injected fake `winreg` module ---
# (never the real registry -- this is what makes RF2(b)'s own fix testable without Windows-admin
# machine state at all: FileNotFoundError -> None/absent, any OTHER OSError -> propagates.)

class _FakeWinregKey:
    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False


class _FakeWinregModule:
    HKEY_CURRENT_USER = object()

    def __init__(self, *, open_key_effect=None, query_value_effect=None, value=None):
        self._open_key_effect = open_key_effect
        self._query_value_effect = query_value_effect
        self._value = value

    def OpenKey(self, hkey, subkey):
        if self._open_key_effect is not None:
            raise self._open_key_effect
        return _FakeWinregKey()

    def QueryValueEx(self, key, name):
        if self._query_value_effect is not None:
            raise self._query_value_effect
        return (self._value, 1)


class TestRealReadBackChainWithFakeWinreg(unittest.TestCase):
    def setUp(self):
        import sys
        self._had_winreg = "winreg" in sys.modules
        self._saved_winreg = sys.modules.get("winreg")

    def tearDown(self):
        import sys
        if self._had_winreg:
            sys.modules["winreg"] = self._saved_winreg
        else:
            sys.modules.pop("winreg", None)

    def test_value_not_found_maps_to_none(self):
        import sys
        sys.modules["winreg"] = _FakeWinregModule(query_value_effect=FileNotFoundError())
        self.assertIsNone(patch.real_read_back_chain())

    def test_key_not_found_also_maps_to_none(self):
        # the key itself (not just the value within it) may be absent
        import sys
        sys.modules["winreg"] = _FakeWinregModule(open_key_effect=FileNotFoundError())
        self.assertIsNone(patch.real_read_back_chain())

    def test_other_oserror_propagates_rather_than_being_folded_into_none(self):
        # RF2(b): a real access problem must never be silently reported
        # as "nothing persisted" -- it must propagate so callers (the
        # CG5(a) pre-check, diagnostic_dry_run.py) can tell "absent"
        # from "unreadable" and react correctly.
        import sys
        sys.modules["winreg"] = _FakeWinregModule(query_value_effect=PermissionError("simulated: access denied"))
        with self.assertRaises(PermissionError):
            patch.real_read_back_chain()

    def test_found_value_passes_through_unchanged(self):
        import sys
        value = json.dumps(["C:/old/notify.exe", "turn-ended"])
        sys.modules["winreg"] = _FakeWinregModule(value=value)
        self.assertEqual(patch.real_read_back_chain(), value)

    def test_empty_string_value_passes_through_unchanged(self):
        import sys
        sys.modules["winreg"] = _FakeWinregModule(value="")
        self.assertEqual(patch.real_read_back_chain(), "")


if __name__ == "__main__":
    unittest.main()
