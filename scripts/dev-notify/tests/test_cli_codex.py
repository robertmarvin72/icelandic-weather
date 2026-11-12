"""Subprocess-level tests of cli_codex.py -- proves the chaining
contract (existing Codex notify command always runs first, regardless
of this script's own outcome), the RN2 always-exit-0/no-output
discipline, and the RN5-corrected ABI: the payload arrives as the
FINAL element of argv, NOT via stdin (VERIFIED_FROM_CODE, see
dev_notify.adapters.codex_adapter's module docstring) -- while stdin
is still read (boundedly) and forwarded to the chained command.
"""
import json
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path

from ._hermetic_env import hermetic_env

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
CLI_PATH = SCRIPTS_DIR / "dev_notify" / "cli_codex.py"

# Writes the chained-to command's own argv tail (everything after the
# marker path) and its stdin to the marker file, as JSON, so a test
# can verify the chain received BOTH the exact original argv tail and
# the exact stdin bytes cli_codex.py captured.
_CHAIN_TARGET_SCRIPT = """
import sys, json
from pathlib import Path
out = Path(sys.argv[1])
stdin_bytes = sys.stdin.buffer.read()
out.write_text(json.dumps({"argv_tail": sys.argv[2:], "stdin": stdin_bytes.decode("utf-8", errors="replace")}), encoding="utf-8")
"""


class TestCliCodexSubprocess(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="dev-notify-cli-codex-test-")
        self.config_path = Path(self.tmpdir) / "config.json"
        self.config_path.write_text(json.dumps({"windows_toast": {"enabled": False}, "ntfy": {"enabled": False}}), encoding="utf-8")

        self.chain_script = Path(self.tmpdir) / "chain_target.py"
        self.chain_script.write_text(_CHAIN_TARGET_SCRIPT, encoding="utf-8")
        self.chain_marker = Path(self.tmpdir) / "chain_marker.json"

    def tearDown(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _env(self, chained_cmd=None):
        # QA3: hermetic_env() strips every ambient DEV_NOTIFY_* var
        # unconditionally first -- a test that wants a chain sets it
        # explicitly via `overrides` below; one that doesn't gets a
        # guaranteed-absent var, never whatever happened to be set on
        # the real machine (the exact bug Jonesy's sandbox reproduced:
        # 11/11 tests ran a real ambient chain command).
        overrides = {"DEV_NOTIFY_CONFIG_PATH": str(self.config_path)}
        if chained_cmd is not None:
            overrides["DEV_NOTIFY_CHAINED_NOTIFY_CMD"] = json.dumps(chained_cmd)
        return hermetic_env(self.tmpdir, **overrides)

    def _run(self, argv_extra=(), stdin_bytes: bytes = b"", chained_cmd=None, timeout=15):
        return subprocess.run([sys.executable, str(CLI_PATH), *argv_extra], input=stdin_bytes,
                               capture_output=True, env=self._env(chained_cmd), timeout=timeout, cwd=self.tmpdir)

    # --- RN5: payload arrives via argv, not stdin ---

    def test_payload_via_argv_exits_0_no_stdout(self):
        payload = json.dumps({"type": "agent-turn-complete", "turn-id": "t1"})
        proc = self._run(argv_extra=[payload])
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_malformed_argv_payload_exits_0_no_stdout(self):
        proc = self._run(argv_extra=["not json"])
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_no_argv_and_empty_stdin_exits_0_no_stdout(self):
        proc = self._run(argv_extra=[], stdin_bytes=b"")
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_stdin_only_fallback_used_only_when_argv_empty(self):
        # Defensive fallback for an unconfirmed caller -- not the real
        # Codex path, but must not crash or misbehave either.
        payload = json.dumps({"type": "agent-turn-complete"})
        proc = self._run(argv_extra=[], stdin_bytes=payload.encode("utf-8"))
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    # --- RN5: never hangs on a pipe that is never closed ---

    def test_stdin_pipe_that_never_closes_does_not_hang(self):
        env = self._env()
        proc = subprocess.Popen([sys.executable, str(CLI_PATH)], stdin=subprocess.PIPE,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, cwd=self.tmpdir)
        try:
            t0 = time.monotonic()
            proc.wait(timeout=3)
            elapsed = time.monotonic() - t0
            self.assertEqual(proc.returncode, 0)
            self.assertLess(elapsed, 3.0, "must not hang waiting on a never-closed stdin pipe")
        finally:
            if proc.stdin:
                proc.stdin.close()
            proc.stdout.close()
            proc.stderr.close()

    # --- chaining: exact argv tail + stdin forwarded ---

    def test_chain_receives_exact_argv_tail_and_stdin(self):
        payload = json.dumps({"type": "agent-turn-complete", "extra": "hello"})
        chained_cmd = [sys.executable, str(self.chain_script), str(self.chain_marker)]
        proc = self._run(argv_extra=[payload], stdin_bytes=b"some-stdin-bytes", chained_cmd=chained_cmd)
        self.assertEqual(proc.returncode, 0)
        self.assertTrue(self.chain_marker.exists(), "chained notify command was never invoked")
        recorded = json.loads(self.chain_marker.read_text(encoding="utf-8"))
        self.assertEqual(recorded["argv_tail"], [payload])
        self.assertEqual(recorded["stdin"], "some-stdin-bytes")

    def test_chained_command_runs_even_if_own_logic_would_fail(self):
        chained_cmd = [sys.executable, str(self.chain_script), str(self.chain_marker)]
        proc = self._run(argv_extra=["{}"], chained_cmd=chained_cmd)  # {} classifies but has no useful fields
        self.assertEqual(proc.returncode, 0)
        self.assertTrue(self.chain_marker.exists())

    def test_chained_command_runs_even_with_no_argv_at_all(self):
        chained_cmd = [sys.executable, str(self.chain_script), str(self.chain_marker)]
        proc = self._run(argv_extra=[], chained_cmd=chained_cmd)
        self.assertEqual(proc.returncode, 0)
        self.assertTrue(self.chain_marker.exists())
        recorded = json.loads(self.chain_marker.read_text(encoding="utf-8"))
        self.assertEqual(recorded["argv_tail"], [])

    def test_broken_chained_command_does_not_crash_or_change_exit_code(self):
        chained_cmd = [str(Path(self.tmpdir) / "no-such-executable-xyz")]
        proc = self._run(argv_extra=[json.dumps({"type": "agent-turn-complete"})], chained_cmd=chained_cmd)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    def test_no_chained_command_configured_still_exits_0(self):
        proc = self._run(argv_extra=[json.dumps({"type": "agent-turn-complete"})], chained_cmd=None)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout, b"")

    # --- RC1/QA1: a slow old notify command must not starve the new dispatch path, and must never see BrokenPipe ---

    def test_QA1_slow_chain_does_not_starve_dispatch_and_has_no_broken_pipe(self):
        """RC1's own sandbox repro: the old command slept 8s (longer
        than the 5s hard cap) and got BrokenPipeError when the
        watchdog hard-killed the parent mid-chain, and dispatch never
        ran at all (dt 5.06s, no dispatch -- Jonesy's own verbatim
        finding). This proves both are fixed: (a) the chain subprocess
        gets DEVNULL stdio (no pipes to break -- the fake script
        itself records whether ANY write attempt raised), and (b) the
        NEW dispatch path's own first side effect (the dedup state
        write) happens even though the chain is still sleeping,
        proving dispatch is no longer serialized behind it."""
        marker = Path(self.tmpdir) / "slow_chain_marker.json"
        fake_old_notify = Path(self.tmpdir) / "fake_old_notify.py"
        fake_old_notify.write_text(
            "import sys, json, time\n"
            "from pathlib import Path\n"
            "marker = Path(sys.argv[1])\n"
            "argv_tail = sys.argv[2:]\n"
            "write_error = None\n"
            "try:\n"
            "    sys.stdout.write('hello from the old command')\n"
            "    sys.stdout.flush()\n"
            "except Exception as e:\n"
            "    write_error = f'{type(e).__name__}: {e}'\n"
            "time.sleep(8)\n"  # longer than the 5s hard cap -- the exact RC1 repro
            "marker.write_text(json.dumps({'argv_tail': argv_tail, 'write_error': write_error}), encoding='utf-8')\n",
            encoding="utf-8",
        )
        chained_cmd = [sys.executable, str(fake_old_notify), str(marker)]
        payload = json.dumps({"type": "agent-turn-complete"})

        t0 = time.monotonic()
        proc = self._run(argv_extra=[payload], chained_cmd=chained_cmd, timeout=7)
        elapsed = time.monotonic() - t0

        self.assertEqual(proc.returncode, 0, f"stderr={proc.stderr!r}")
        self.assertEqual(proc.stdout, b"")
        self.assertEqual(proc.stderr, b"")
        self.assertLess(elapsed, 6.5, f"parent should exit near the 5s watchdog cap, not wait for the full 8s chain (took {elapsed:.2f}s)")
        self.assertGreater(elapsed, 4.0, f"should not exit suspiciously early either (took {elapsed:.2f}s)")

        # The new dispatch path's own dedup state write must have
        # happened -- proving dispatch ran concurrently with, not
        # after, the still-sleeping chain (RC1's own "no dispatch"
        # finding at dt=5.06s is what this disproves).
        state_path = Path(self.tmpdir) / "dev-notify" / "state.json"
        self.assertTrue(state_path.exists(), "dispatch's own dedup state write never happened -- the chain starved it, exactly the RC1 bug")

        # Wait for the now-orphaned grandchild (the parent already
        # exited via the watchdog) to finish its own 8s sleep and
        # write the marker -- the test waits for its own evidence
        # rather than asserting on a process handle it never owned.
        deadline = time.monotonic() + 10
        while not marker.exists() and time.monotonic() < deadline:
            time.sleep(0.2)
        self.assertTrue(marker.exists(), "the orphaned old-notify command never finished writing its marker")
        recorded = json.loads(marker.read_text(encoding="utf-8"))
        self.assertEqual(recorded["argv_tail"], [payload], "the old command must receive the exact original argv tail")
        self.assertIsNone(recorded["write_error"], f"the old command's own stdout write must never raise (DEVNULL, no broken pipe): {recorded['write_error']}")

    # --- RE1/CG3: never chain to our own wrapper; top-level still dispatches once; nested run short-circuits ---

    def test_RE1_wrapper_chain_target_is_never_spawned_but_dispatch_still_runs_once(self):
        """The exact RE1 danger scenario: DEV_NOTIFY_CHAINED_NOTIFY_CMD
        points at a path whose basename is cli_codex.py. This must be
        detected and refused BEFORE any Popen -- proven by pointing it
        at a real script that would create a marker file if actually
        invoked, and asserting that marker never appears. Dispatch
        (the top-level run's own notification) must still happen once,
        proven via the dedup state file."""
        marker = Path(self.tmpdir) / "would_be_wrapper_marker.txt"
        fake_wrapper = Path(self.tmpdir) / "cli_codex.py"  # same basename as the real wrapper
        fake_wrapper.write_text(f"from pathlib import Path\nPath(r'{marker}').write_text('ran')\n", encoding="utf-8")
        chained_cmd = [sys.executable, str(fake_wrapper)]
        payload = json.dumps({"type": "agent-turn-complete"})

        proc = self._run(argv_extra=[payload], chained_cmd=chained_cmd, timeout=10)
        self.assertEqual(proc.returncode, 0, f"stderr={proc.stderr!r}")
        self.assertEqual(proc.stdout, b"")
        self.assertFalse(marker.exists(), "the wrapper-suspicious chain target must never be spawned")

        state_path = Path(self.tmpdir) / "dev-notify" / "state.json"
        self.assertTrue(state_path.exists(), "the top-level run must still dispatch its own notification once")

    def test_RE1_in_process_popen_is_never_called_for_a_wrapper_chain_target(self):
        """CG4-safe, in-process proof (no real subprocess at all):
        monkeypatches subprocess.Popen inside cli_codex's own module
        with a fake that fails the test if ever called, then calls
        `_chain_to_existing` directly with a wrapper-pointing chain
        command. Zero risk of any real process storm, by construction."""
        import importlib
        sys.path.insert(0, str(SCRIPTS_DIR))
        cli_codex = importlib.import_module("dev_notify.cli_codex")
        import os as _os

        def _popen_must_not_be_called(*args, **kwargs):
            raise AssertionError("subprocess.Popen must never be called for a wrapper-suspicious chain target")

        old_environ_value = _os.environ.get(cli_codex.CHAIN_ENV_VAR)
        _os.environ[cli_codex.CHAIN_ENV_VAR] = json.dumps([sys.executable, "/abs/path/cli_codex.py"])
        old_popen = cli_codex.subprocess.Popen
        cli_codex.subprocess.Popen = _popen_must_not_be_called
        try:
            cli_codex._chain_to_existing([], b"")  # must return quietly, never reach Popen
        finally:
            cli_codex.subprocess.Popen = old_popen
            if old_environ_value is None:
                _os.environ.pop(cli_codex.CHAIN_ENV_VAR, None)
            else:
                _os.environ[cli_codex.CHAIN_ENV_VAR] = old_environ_value

    def test_RG3_in_process_popen_is_never_called_for_ambiguous_chain_targets(self):
        """RG3/TI3: `is_wrapper_argv` (and therefore `_chain_to_existing`)
        is fail-closed for AMBIGUOUS/malformed chain values too, not
        just a genuine basename/substring match on `cli_codex.py` --
        but until this test existed, only `test_wrapper_detect.py`'s
        pure unit tests proved that at the `classify_argv` level; the
        RUNTIME layer (this file) only had a test for a genuine wrapper
        match. A future change narrowing `is_wrapper_argv`/
        `classify_argv` could silently reopen the runtime chaining path
        for a value this ambiguous without any test here catching it.
        CG4-safe, in-process (no real subprocess at all, same pattern
        as the wrapper test above): monkeypatches `subprocess.Popen`
        with a fake that fails the test if ever called, for each of
        several ambiguous/malformed `DEV_NOTIFY_CHAINED_NOTIFY_CMD`
        values in turn. Every ambient `DEV_NOTIFY_*` var is snapshotted
        and cleared before the loop and restored in `finally`, so this
        test's own result never depends on whatever happens to be set
        in the real process running it (QA3's own discipline)."""
        import importlib
        sys.path.insert(0, str(SCRIPTS_DIR))
        cli_codex = importlib.import_module("dev_notify.cli_codex")
        import os as _os

        def _popen_must_not_be_called(*args, **kwargs):
            raise AssertionError("subprocess.Popen must never be called for an ambiguous chain target")

        ambiguous_chain_values = [
            json.dumps(["tool.exe", ""]),  # legitimate-but-ambiguous: stray empty argv element
            json.dumps([]),  # empty list
            json.dumps("not a list"),  # valid JSON, wrong shape (a bare string)
            "this is not valid json at all {{{",  # invalid JSON entirely
        ]

        saved_dev_notify_vars = {k: v for k, v in _os.environ.items() if k.startswith("DEV_NOTIFY_")}
        for k in saved_dev_notify_vars:
            del _os.environ[k]
        old_popen = cli_codex.subprocess.Popen
        cli_codex.subprocess.Popen = _popen_must_not_be_called
        try:
            for value in ambiguous_chain_values:
                with self.subTest(value=value):
                    _os.environ[cli_codex.CHAIN_ENV_VAR] = value
                    try:
                        cli_codex._chain_to_existing([], b"")  # must return quietly, never reach Popen
                    finally:
                        _os.environ.pop(cli_codex.CHAIN_ENV_VAR, None)
        finally:
            cli_codex.subprocess.Popen = old_popen
            for k, v in saved_dev_notify_vars.items():
                _os.environ[k] = v

    def test_RE1_nested_run_with_depth_marker_present_skips_chain_and_dispatch(self):
        """CG3(ii): if this process's OWN environment already carries
        the depth marker (i.e. it IS a chained child, or a descendant
        of one), it must exit 0 immediately without chaining or
        dispatching -- never creating the dedup state file at all."""
        chained_cmd = [sys.executable, str(self.chain_script), str(self.chain_marker)]
        payload = json.dumps({"type": "agent-turn-complete"})
        env = self._env(chained_cmd=chained_cmd)
        env["DEV_NOTIFY_CHAIN_DEPTH"] = "1"  # simulates being the nested child
        proc = subprocess.run([sys.executable, str(CLI_PATH), payload], capture_output=True, env=env, timeout=10, cwd=self.tmpdir)
        self.assertEqual(proc.returncode, 0, f"stderr={proc.stderr!r}")
        self.assertEqual(proc.stdout, b"")
        self.assertFalse(self.chain_marker.exists(), "a nested run must never chain either")
        state_path = Path(self.tmpdir) / "dev-notify" / "state.json"
        self.assertFalse(state_path.exists(), "a nested run must never dispatch -- would double the notification")

    def test_RE1_legitimate_chain_child_receives_the_depth_marker_in_its_own_env_only(self):
        """Confirms the defense-in-depth marker is actually set on the
        SPAWNED child's environment (never on this process's own
        os.environ) for a legitimate (non-wrapper) chain target."""
        reader_script = """
import os, sys
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(os.environ.get("DEV_NOTIFY_CHAIN_DEPTH") or "ABSENT", encoding="utf-8")
"""
        reader_path = Path(self.tmpdir) / "depth_reader.py"
        reader_path.write_text(reader_script, encoding="utf-8")
        depth_marker_out = Path(self.tmpdir) / "depth_marker_seen.txt"
        chained_cmd = [sys.executable, str(reader_path), str(depth_marker_out)]
        payload = json.dumps({"type": "agent-turn-complete"})

        proc = self._run(argv_extra=[payload], chained_cmd=chained_cmd, timeout=10)
        self.assertEqual(proc.returncode, 0)
        self.assertTrue(depth_marker_out.exists())
        self.assertEqual(depth_marker_out.read_text(encoding="utf-8"), "1")

    # --- QA3: ambient DEV_NOTIFY_CHAINED_NOTIFY_CMD must never leak into a test that didn't ask for it ---

    def test_QA3_ambient_chain_env_var_is_not_inherited_when_test_does_not_ask_for_it(self):
        """Exact regression for Jonesy's sandbox finding: simulates a
        machine where DEV_NOTIFY_CHAINED_NOTIFY_CMD is already set
        (e.g. after a real Phase B `setx`) by setting it directly in
        THIS TEST PROCESS's own os.environ, then runs a normal test
        call that does not ask for chaining. The ambient marker
        command must NOT be invoked."""
        ambient_marker = Path(self.tmpdir) / "ambient_marker.txt"
        ambient_cmd = [sys.executable, "-c", f"open({str(ambient_marker)!r}, 'w').write('ran')"]
        import os as _os
        old = _os.environ.get("DEV_NOTIFY_CHAINED_NOTIFY_CMD")
        _os.environ["DEV_NOTIFY_CHAINED_NOTIFY_CMD"] = json.dumps(ambient_cmd)
        try:
            proc = self._run(argv_extra=[json.dumps({"type": "agent-turn-complete"})])  # chained_cmd=None -- no chain requested
        finally:
            if old is None:
                _os.environ.pop("DEV_NOTIFY_CHAINED_NOTIFY_CMD", None)
            else:
                _os.environ["DEV_NOTIFY_CHAINED_NOTIFY_CMD"] = old
        self.assertEqual(proc.returncode, 0)
        self.assertFalse(ambient_marker.exists(), "an ambient DEV_NOTIFY_CHAINED_NOTIFY_CMD leaked into a test that never asked for a chain")

    # --- RN2: hostile argv payload types must never crash (BaseException guard) ---

    def test_hostile_argv_payload_still_exits_0_no_stdout(self):
        for hostile in ('{"type": ["not", "a", "string"]}', "null", "[1, 2, 3]", "42", '"just a string"'):
            proc = self._run(argv_extra=[hostile])
            self.assertEqual(proc.returncode, 0, f"hostile payload {hostile!r} must still exit 0")
            self.assertEqual(proc.stdout, b"")
            self.assertEqual(proc.stderr, b"", f"hostile payload {hostile!r} must never write to stderr")


if __name__ == "__main__":
    unittest.main()
