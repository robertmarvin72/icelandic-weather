"""AP4/RF2/RF3/PS1/PS4/RG1/TI1: proves the diagnostic dry-run
entrypoint never mutates dedup state, never calls a real transport,
never touches the real Windows registry ANYWHERE in this test
suite's own run, and never leaks a secret/topic/URL/path value into
its own allowlisted output -- only generic booleans, counts, and the
PS4-defined tri-state chain fields.

RF2/PS1 fix: an EARLIER version of this file had exactly one test for
the persisted-chain-state fields, and it called the REAL Windows
registry (via the CLI subprocess's own unavoidable default) and
asserted only "the result is one of five possible strings" -- true
regardless of what's actually persisted, so it proved nothing. Every
specific persisted-state scenario below is driven via
`diagnostic_dry_run.main(read_back_chain=...)` IN-PROCESS, with an
explicit fake -- no subprocess, no real registry access, for any of
them.

RG1/TI1 fix (2026-11-12): the version written for the PS round still
had FIVE tests (the `chain_env_*` / `canary_never_leaks_via_env_var`
tests below) that ran `diagnostic_dry_run.py` as a REAL SUBPROCESS.
Each of those subprocess calls, regardless of which fields the test
itself asserted on, caused a real read-only HKCU registry access on
Windows every time, because `main()` ALWAYS computes BOTH
`_chain_env_summary()` AND `_chain_persisted_summary(reader)` on
every invocation -- there is no way to exercise the CLI as a
subprocess with no override and have it skip the registry read, so
"this test only checks env fields, not persisted fields" did NOT mean
"this test never touches the registry." An independent review
measured this directly (a counting `winreg` shim on `PYTHONPATH`)
and found exactly these 5 call sites reaching "the registry" once
per test run. This module's own header previously claimed "never
touches the real Windows registry in this test suite's own run" and
a comment near the old subprocess helper claimed "these never touch
the registry at all" -- BOTH WERE FALSE while those 5 tests used
`_run_subprocess`. Fixed: all five moved to the same in-process
`main(read_back_chain=...)` helper every other test here already
uses, with the chain env var set via `unittest.mock.patch.dict` for
the call's duration instead of a subprocess environment. There is
now no subprocess invocation of `diagnostic_dry_run.py` anywhere in
this file at all -- `TestNoSubprocessInvokesDiagnosticWithRealReader`
below is a structural guard proving that stays true for any test
added here in the future.
"""
import json
import io
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

from dev_notify import apply_config_patch as _acp

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
DIAGNOSTIC_PATH = SCRIPTS_DIR / "diagnostic_dry_run.py"

# diagnostic_dry_run.py is a standalone top-level script (like
# cli_claude.py/cli_codex.py), not part of the `dev_notify` package --
# it does its own sys.path insert to reach `dev_notify` from wherever
# it's invoked. Importing it in-process for these tests needs the
# same path added here.
sys.path.insert(0, str(SCRIPTS_DIR))
import diagnostic_dry_run as _ddr  # noqa: E402

CANARY_TOPIC = "CANARY-TOPIC-7f3a9c21-DO-NOT-LEAK"
CANARY_HOST = "canary-host-do-not-leak.example"
CANARY_SECRET_PATH = "C:/Users/CANARY-SOMEONE/secret-do-not-leak.bin"


# --- PS1(b): suite-level guard -- the REAL registry must never be touched by this file's own tests ---

_real_read_back_chain_saved = None
_winreg_saved = _ddr_had_winreg = None


def _poisoned_reader():
    raise AssertionError("real_read_back_chain must never be called by this hermetic test suite -- a test forgot to pass an explicit fake")


class _PoisonedWinreg:
    """Raises only on an actual functional access (e.g. `OpenKey`,
    `QueryValueEx`, `HKEY_CURRENT_USER`) -- dunder attribute lookups
    (`__spec__`, `__loader__`, ...) are what Python's own `import`
    statement probes even for an already-cached sys.modules entry, so
    those must pass through quietly rather than tripping the guard."""

    def __getattr__(self, name):
        if name.startswith("__") and name.endswith("__"):
            raise AttributeError(name)
        raise AssertionError(f"winreg.{name} must never be touched by this hermetic test suite")


def setUpModule():
    global _real_read_back_chain_saved, _winreg_saved, _ddr_had_winreg
    _real_read_back_chain_saved = _ddr.real_read_back_chain
    _ddr.real_read_back_chain = _poisoned_reader
    _acp.real_read_back_chain = _poisoned_reader  # in case anything ever references it via that module directly
    import sys as _sys
    _ddr_had_winreg = "winreg" in _sys.modules
    _winreg_saved = _sys.modules.get("winreg")
    _sys.modules["winreg"] = _PoisonedWinreg()


def tearDownModule():
    import sys as _sys
    _ddr.real_read_back_chain = _real_read_back_chain_saved
    _acp.real_read_back_chain = _real_read_back_chain_saved
    if _ddr_had_winreg:
        _sys.modules["winreg"] = _winreg_saved
    else:
        _sys.modules.pop("winreg", None)


class TestSuiteLevelGuardItself(unittest.TestCase):
    """Proves the guard above is actually live (not a no-op)."""

    def test_poisoned_reader_raises_if_ever_invoked(self):
        with self.assertRaises(AssertionError):
            _ddr.real_read_back_chain()

    def test_poisoned_winreg_raises_if_ever_touched(self):
        import winreg
        with self.assertRaises(AssertionError):
            winreg.OpenKey(None, "Environment")

    def test_main_with_no_override_would_hit_the_poisoned_reader(self):
        # Confirms main()'s own fallback genuinely performs a LIVE
        # lookup of the module-level name (not a frozen default) --
        # calling it with no override here must reach the poisoned
        # reader. `_chain_persisted_summary`'s own `except Exception`
        # catches the poison's AssertionError the same as any other
        # read failure and reports `unreadable` -- the diagnostic
        # itself does not distinguish "poisoned" from "genuinely
        # broken", so that's the correctly-observable proof here,
        # not an uncaught exception escaping `main()`.
        buf = io.StringIO()
        with redirect_stdout(buf):
            rc = _ddr.main()
        self.assertEqual(rc, 0)
        report = json.loads(buf.getvalue())
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "unreadable")


class TestNoSubprocessInvokesDiagnosticWithRealReader(unittest.TestCase):
    """RG1/TI1(a): a STRUCTURAL guard, not a point-in-time audit --
    scans every `tests/*.py` file's own source (not just this one)
    for a `subprocess.run`/`Popen`/`check_output`/`check_call` call
    whose arguments reference `diagnostic_dry_run.py` or
    `DIAGNOSTIC_PATH`, OUTSIDE a function whose name contains
    "harness" (the one escape hatch TI1/TI5 allow: a bounded harness
    subprocess that itself injects a fake reader before calling
    `main()`, for a test that genuinely needs real stdout/exit-code
    behavior -- none exists in this codebase today). Fails loudly the
    moment a future test reopens the exact RG1 gap (five tests that
    looked safe because they only asserted on env fields, while
    `main()` unconditionally also reads the real persisted source
    too), rather than relying on a human noticing it in review."""

    def test_no_bare_diagnostic_subprocess_call_outside_a_harness_function(self):
        import ast
        tests_dir = Path(__file__).resolve().parent
        offending = []
        for py_file in sorted(tests_dir.glob("*.py")):
            source = py_file.read_text(encoding="utf-8")
            tree = ast.parse(source, filename=str(py_file))
            for func in ast.walk(tree):
                if not isinstance(func, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    continue
                is_harness = "harness" in func.name.lower()
                for node in ast.walk(func):
                    if not isinstance(node, ast.Call):
                        continue
                    func_name = node.func.attr if isinstance(node.func, ast.Attribute) else (
                        node.func.id if isinstance(node.func, ast.Name) else "")
                    if func_name not in ("run", "Popen", "check_output", "check_call"):
                        continue
                    call_text = ast.dump(node)
                    if "diagnostic_dry_run" not in call_text and "DIAGNOSTIC_PATH" not in call_text:
                        continue
                    if is_harness:
                        continue
                    offending.append(f"{py_file.name}:{node.lineno} in {func.name}()")
        # RG1(b)/TI1(e): the number this proves, for the final report --
        # zero non-harness subprocess call-sites against the diagnostic
        # script anywhere in tests/, which is the same as zero call
        # sites using the real default reader (a harness is the only
        # construct allowed to subprocess it at all, and a harness is
        # defined as one that injects a fake reader before `main()` runs).
        self.assertEqual(offending, [],
                          "found a subprocess call referencing diagnostic_dry_run.py outside a harness-named "
                          f"function -- this reopens RG1's exact gap: {offending}")


class TestDiagnosticDryRun(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-diagnostic-test-")
        self.config_path = Path(self.tmpdir) / "config.json"
        self.config_path.write_text(json.dumps({
            "enabled": True,
            "windows_toast": {"enabled": True},
            "ntfy": {"enabled": True, "host": CANARY_HOST, "topic": CANARY_TOPIC,
                     "token_secret_path": CANARY_SECRET_PATH, "timeout_s": 2},
        }), encoding="utf-8")
        self.state_path = Path(self.tmpdir) / "dev-notify" / "state.json"

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    # --- in-process helper: no subprocess, explicit fake reader always required ---
    # (RG1/TI1: this is now the ONLY way this file ever invokes the
    # diagnostic -- there is no subprocess helper left in this module.)

    def _main_in_process(self, read_back_chain, config_path=None, localappdata=None, extra_env=None) -> dict:
        import os
        env_overrides = {
            "DEV_NOTIFY_CONFIG_PATH": str(config_path if config_path is not None else self.config_path),
            "LOCALAPPDATA": localappdata if localappdata is not None else self.tmpdir,
        }
        if extra_env:
            env_overrides.update(extra_env)
        # Always make the chain env var's presence explicit either way
        # (set via extra_env, or guaranteed absent) -- never whatever
        # happens to be ambient on the machine running this test.
        chain_var = "DEV_NOTIFY_CHAINED_NOTIFY_CMD"
        force_absent = chain_var not in env_overrides
        buf = io.StringIO()
        with mock.patch.dict(os.environ, env_overrides):
            if force_absent:
                os.environ.pop(chain_var, None)
            with redirect_stdout(buf):
                rc = _ddr.main(read_back_chain=read_back_chain)
        self.assertEqual(rc, 0)
        return json.loads(buf.getvalue())

    def test_exits_0_and_output_is_valid_json(self):
        report = self._main_in_process(read_back_chain=lambda: None)
        self.assertIn("config", report)
        self.assertIn("dedup_state", report)

    def test_canary_host_topic_and_secret_path_never_appear_in_output(self):
        report = self._main_in_process(read_back_chain=lambda: None)
        blob = json.dumps(report)
        self.assertNotIn(CANARY_TOPIC, blob)
        self.assertNotIn(CANARY_HOST, blob)
        self.assertNotIn(CANARY_SECRET_PATH, blob)

    def test_reports_presence_booleans_not_values(self):
        report = self._main_in_process(read_back_chain=lambda: None)
        self.assertTrue(report["config"]["ntfy_host_configured"])
        self.assertTrue(report["config"]["ntfy_topic_configured"])
        self.assertTrue(report["config"]["ntfy_token_secret_path_configured"])
        self.assertTrue(report["config"]["ntfy_enabled"])
        self.assertTrue(report["config"]["windows_toast_enabled"])

    def test_never_mutates_dedup_state(self):
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        before = json.dumps({"entries": {"some-key": 12345.0}, "malformed_input_count": 2})
        self.state_path.write_text(before, encoding="utf-8")
        report = self._main_in_process(read_back_chain=lambda: None)
        after = self.state_path.read_text(encoding="utf-8")
        self.assertEqual(after, before, "the diagnostic must never write to the dedup state file")
        self.assertEqual(report["dedup_state"]["entry_count"], 1)
        self.assertEqual(report["dedup_state"]["malformed_input_count"], 2)

    def test_reports_lock_presence_and_age_without_content(self):
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path = Path(str(self.state_path) + ".lock")
        lock_path.write_text("", encoding="utf-8")
        report = self._main_in_process(read_back_chain=lambda: None)
        self.assertTrue(report["dedup_state"]["lock_present"])
        self.assertIsInstance(report["dedup_state"]["lock_age_s"], (int, float))
        self.assertGreaterEqual(report["dedup_state"]["lock_age_s"], 0)

    def test_no_lock_reports_absent(self):
        report = self._main_in_process(read_back_chain=lambda: None)
        self.assertFalse(report["dedup_state"]["lock_present"])
        self.assertIsNone(report["dedup_state"]["lock_age_s"])

    # --- RE2/CG6: tri-state chain_json_valid / chain_points_to_wrapper, from the CURRENT process env ---
    # (RG1/TI1: these NEVER actually avoided the registry as subprocess
    # tests -- main() always also computes the PERSISTED fields on
    # every call, real reader included, regardless of which fields a
    # given test asserts on. Moved in-process like everything else in
    # this file; a harmless `lambda: None` fake stands in for the
    # reader since these tests don't care about the persisted fields.)

    def test_chain_env_fields_are_null_when_env_var_absent(self):
        report = self._main_in_process(read_back_chain=lambda: None)
        self.assertFalse(report["codex_chain"]["chain_env_var_set"])
        self.assertIsNone(report["codex_chain"]["chain_json_valid"])
        self.assertIsNone(report["codex_chain"]["chain_points_to_wrapper"])

    def test_chain_env_fields_for_legitimate_non_wrapper_value(self):
        extra_env = {"DEV_NOTIFY_CHAINED_NOTIFY_CMD": json.dumps(["C:/old/notify.exe", "turn-ended"])}
        report = self._main_in_process(read_back_chain=lambda: None, extra_env=extra_env)
        self.assertTrue(report["codex_chain"]["chain_json_valid"])
        self.assertFalse(report["codex_chain"]["chain_points_to_wrapper"])

    def test_chain_env_fields_for_wrapper_pointing_value(self):
        extra_env = {"DEV_NOTIFY_CHAINED_NOTIFY_CMD": json.dumps(["python", "C:/abs/path/cli_codex.py"])}
        report = self._main_in_process(read_back_chain=lambda: None, extra_env=extra_env)
        self.assertTrue(report["codex_chain"]["chain_json_valid"])
        self.assertTrue(report["codex_chain"]["chain_points_to_wrapper"])

    def test_chain_env_fields_for_invalid_json_are_never_marked_safe(self):
        extra_env = {"DEV_NOTIFY_CHAINED_NOTIFY_CMD": "this is not valid json at all {{{"}
        report = self._main_in_process(read_back_chain=lambda: None, extra_env=extra_env)
        self.assertFalse(report["codex_chain"]["chain_json_valid"])
        self.assertTrue(report["codex_chain"]["chain_points_to_wrapper"], "invalid JSON must never be reported as safe")

    def test_canary_never_leaks_via_env_var_path(self):
        canary = "CANARY-WRAPPER-7f3a9c21-DO-NOT-LEAK/cli_codex.py"
        extra_env = {"DEV_NOTIFY_CHAINED_NOTIFY_CMD": json.dumps(["python", canary])}
        report = self._main_in_process(read_back_chain=lambda: None, extra_env=extra_env)
        blob = json.dumps(report)
        self.assertNotIn(canary, blob)
        self.assertNotIn(CANARY_TOPIC, blob)
        self.assertNotIn(CANARY_HOST, blob)

    # --- RF3/PS4: exhaustive persisted-state table, all in-process with explicit fakes ---

    def test_persisted_absent(self):
        report = self._main_in_process(read_back_chain=lambda: None)
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "absent")
        self.assertIsNone(report["codex_chain"]["chain_persisted_json_valid"])
        self.assertIsNone(report["codex_chain"]["chain_persisted_points_to_wrapper"])

    def test_persisted_empty(self):
        report = self._main_in_process(read_back_chain=lambda: "")
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "empty")
        self.assertIsNone(report["codex_chain"]["chain_persisted_json_valid"])
        self.assertIsNone(report["codex_chain"]["chain_persisted_points_to_wrapper"])

    def test_persisted_not_windows(self):
        def raise_import_error():
            raise ImportError("no winreg on this platform")
        report = self._main_in_process(read_back_chain=raise_import_error)
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "not_windows")
        self.assertIsNone(report["codex_chain"]["chain_persisted_json_valid"])
        self.assertIsNone(report["codex_chain"]["chain_persisted_points_to_wrapper"])

    def test_persisted_unreadable_on_permission_error(self):
        def raise_permission_error():
            raise PermissionError("simulated: access denied")
        report = self._main_in_process(read_back_chain=raise_permission_error)
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "unreadable")
        self.assertIsNone(report["codex_chain"]["chain_persisted_json_valid"])
        self.assertIsNone(report["codex_chain"]["chain_persisted_points_to_wrapper"])

    def test_persisted_unreadable_error_message_never_in_output(self):
        secret_detail = "CANARY-DETAIL-do-not-leak-this-path-or-message"

        def raise_with_sensitive_message():
            raise OSError(secret_detail)
        report = self._main_in_process(read_back_chain=raise_with_sensitive_message)
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "unreadable")
        self.assertNotIn(secret_detail, json.dumps(report))

    def test_persisted_set_valid_non_wrapper(self):
        report = self._main_in_process(read_back_chain=lambda: json.dumps(["C:/old/notify.exe", "turn-ended"]))
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "set")
        self.assertTrue(report["codex_chain"]["chain_persisted_json_valid"])
        self.assertFalse(report["codex_chain"]["chain_persisted_points_to_wrapper"])

    def test_persisted_set_valid_wrapper(self):
        report = self._main_in_process(read_back_chain=lambda: json.dumps(["python", "C:/abs/path/cli_codex.py"]))
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "set")
        self.assertTrue(report["codex_chain"]["chain_persisted_json_valid"])
        self.assertTrue(report["codex_chain"]["chain_persisted_points_to_wrapper"])

    def test_persisted_set_invalid_json_is_never_marked_safe(self):
        # e.g. a value truncated mid-string by setx's own ~1024-char limit
        report = self._main_in_process(read_back_chain=lambda: '["C:/old/notify.exe", "trunca')
        self.assertEqual(report["codex_chain"]["chain_persisted_state"], "set")
        self.assertFalse(report["codex_chain"]["chain_persisted_json_valid"])
        self.assertTrue(report["codex_chain"]["chain_persisted_points_to_wrapper"])

    def test_persisted_set_valid_json_but_ambiguous_shape_is_never_marked_safe(self):
        # valid JSON, but not a clean non-empty list of strings
        for value in (json.dumps([]), json.dumps("just a string"), json.dumps(["tool.exe", 123])):
            with self.subTest(value=value):
                report = self._main_in_process(read_back_chain=lambda v=value: v)
                self.assertEqual(report["codex_chain"]["chain_persisted_state"], "set")
                self.assertTrue(report["codex_chain"]["chain_persisted_json_valid"])
                self.assertTrue(report["codex_chain"]["chain_persisted_points_to_wrapper"])

    def test_persisted_canary_value_never_appears_in_output(self):
        canary_argv = ["python", "CANARY-PERSISTED-7f3a9c21-DO-NOT-LEAK/cli_codex.py"]
        report = self._main_in_process(read_back_chain=lambda: json.dumps(canary_argv))
        blob = json.dumps(report)
        self.assertNotIn("CANARY-PERSISTED-7f3a9c21-DO-NOT-LEAK", blob)
        self.assertTrue(report["codex_chain"]["chain_persisted_points_to_wrapper"])  # still correctly flagged

    def test_module_never_imports_real_transport_functions(self):
        # Structural guarantee, not just behavioral: the diagnostic
        # script's own CODE (not its docstring, which documents these
        # names in prose) never imports the real send functions, so it
        # cannot call them even by accident. Checks BOTH the dotted
        # module path (`from dev_notify.ntfy_client import ...`) and
        # plain `import ntfy_client` forms.
        import ast
        tree = ast.parse(DIAGNOSTIC_PATH.read_text(encoding="utf-8"))
        forbidden_modules = {"ntfy_client", "windows_toast", "secret_store"}
        referenced_modules = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module:
                referenced_modules.update(node.module.split("."))
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    referenced_modules.update(alias.name.split("."))
        self.assertFalse(referenced_modules & forbidden_modules,
                          f"diagnostic_dry_run.py must never import {forbidden_modules}, found: {referenced_modules & forbidden_modules}")


if __name__ == "__main__":
    unittest.main()
