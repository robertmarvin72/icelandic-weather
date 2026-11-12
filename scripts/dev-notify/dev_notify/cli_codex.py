#!/usr/bin/env python3
"""Entrypoint registered as the Codex `notify` command (user-level
config.toml, Phase B only -- see audit-report.md). Chains to the
PREVIOUSLY-configured notify command first and ALWAYS (preserving it
exactly, per NT7: "nuverandi skipun vardveitt og kolluo; bilun i nyja
hlutanum ma ekki rjufa tha gomlu") -- a failure in this script's OWN
new logic must never prevent that call, and must never raise past
this script's own top-level guard (RN2).

RN5 correction (2026-11-12): the payload delivery mechanism is now
VERIFIED_FROM_CODE (see dev_notify.adapters.codex_adapter's module
docstring for the exact commit/citation) -- Codex appends the JSON
payload as the FINAL element of `sys.argv`, and explicitly CLOSES the
child's stdin (`Stdio::null()`). The previous round assumed the
opposite (stdin-only, argv unused) from unverified memory; that
assumption is now replaced by a confirmed reading. This script reads
`sys.argv[1:]` as the primary (confirmed) payload source, and ALSO
performs one bounded, non-blocking stdin read -- both because Windows
cannot select()/poll() on a pipe to check for data without reading it,
and so stdin content is still available to forward to the chained
command faithfully even though it's expected to be empty on this
confirmed path. Stdin is read exactly once; the same bytes are used
both as a fallback payload source (only when argv gave us nothing)
and as what gets forwarded to the chain -- never read twice.
"""
import json
import os
import subprocess
import sys
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dev_notify import state, watchdog  # noqa: E402
from dev_notify.adapters import codex_adapter  # noqa: E402
from dev_notify.config import is_cwd_allowed, load_config, resolve_project_alias  # noqa: E402
from dev_notify.dispatch import default_state_path, dispatch  # noqa: E402
from dev_notify.events import Agent, NotifyEvent, Surface  # noqa: E402
from dev_notify.wrapper_detect import is_wrapper_argv  # noqa: E402

MAX_STDIN_BYTES = 1024 * 1024
CHAIN_ENV_VAR = "DEV_NOTIFY_CHAINED_NOTIFY_CMD"
# RE1/CG3 (2026-11-12): set ONLY in the chained child's own environment
# COPY when we spawn it (never in our own os.environ, never written to
# any config/state/doc as a real value) -- a second layer of defense,
# behind the path-based `is_wrapper_argv` check in `_chain_to_existing`,
# against an indirect self-chain (e.g. a wrapper script in between)
# that the path check alone might miss. NOT_TESTED: an intermediary
# that clears its own environment before re-exec'ing would bypass this
# marker -- the path check is the first, primary defense; this is the
# second, not a complete guarantee on its own.
CHAIN_DEPTH_ENV_VAR = "DEV_NOTIFY_CHAIN_DEPTH"
# Short: the confirmed real path (Stdio::null()) returns EOF (b"")
# almost instantly. This bound only matters for an unconfirmed future
# caller that might leave a live pipe/tty attached to stdin, and must
# stay small relative to the hook's own total-runtime cap (see
# dedup-rules-addendum-1.md) since it is one part of that budget.
STDIN_READ_TIMEOUT_S = 0.5


def _read_stdin_bounded(max_bytes: int, timeout_s: float) -> bytes:
    """Reads stdin from a background daemon thread with a join
    timeout. If nothing has arrived by the timeout, returns b"" and
    abandons the read (the daemon thread dies with the process; no
    hang, no resource leak that outlives this script)."""
    box = {"data": b""}

    def _reader():
        try:
            box["data"] = sys.stdin.buffer.read(max_bytes + 1)
        except Exception:
            pass

    t = threading.Thread(target=_reader, daemon=True)
    t.start()
    t.join(timeout_s)
    return box["data"]


def _chain_to_existing(argv_tail: list, raw_stdin: bytes) -> None:
    """Best-effort only -- any failure here is swallowed, never raised,
    per the module docstring's own chaining guarantee. Forwards the
    EXACT original argv tail (what Codex appended to US) and the
    exact stdin bytes we captured, so the previously-configured notify
    command receives the same inputs it always did, regardless of
    which delivery path (argv/stdin) turns out to carry the real data.

    RC1/QA1 (2026-11-12): previously used `subprocess.run(...,
    capture_output=True, timeout=CHAIN_TIMEOUT_S)`. Both were wrong:
    `capture_output=True` creates pipes to THIS process, which broke
    with `BrokenPipeError` on the old command's side when the
    watchdog hard-killed this process mid-chain (reproduced in
    sandbox review). `timeout=` would `TerminateProcess` the old
    command on expiry -- that command is not ours to kill ("gamla
    skipunin er aldrei drepin af okkur"); it has its own host
    lifecycle. Now: stdout/stderr go to DEVNULL (no pipes to lose),
    no timeout is ever passed to it, and the caller (main()) runs
    this function in its OWN thread so a slow/hung old command no
    longer blocks `dispatch()` from starting -- the ONLY thing that
    still bounds how long WE wait for it is main()'s own `.join()`
    (no timeout argument there either), itself bounded only by the
    outer hard-exit watchdog, exactly as before this change."""
    chain_cmd_json = os.environ.get(CHAIN_ENV_VAR)
    if not chain_cmd_json:
        return
    try:
        base_argv = json.loads(chain_cmd_json)
        # RE1/CG3(i): top-level run, chain target is wrapper-suspicious
        # (or an ambiguous/malformed shape -- `is_wrapper_argv` is
        # fail-closed) -- NEVER Popen. The caller's own dispatch still
        # runs once, normally, as it would for a legitimate chain;
        # this function just quietly declines to chain.
        if is_wrapper_argv(base_argv):
            return
        stdin_arg = subprocess.PIPE if raw_stdin else subprocess.DEVNULL
        child_env = dict(os.environ)
        child_env[CHAIN_DEPTH_ENV_VAR] = "1"  # this process's OWN os.environ is never touched
        with open(os.devnull, "wb") as devnull:
            proc = subprocess.Popen(base_argv + list(argv_tail), stdin=stdin_arg,
                                     stdout=devnull, stderr=devnull, shell=False, env=child_env)
            if raw_stdin:
                # Single write, then close -- never streamed. Known
                # limitation (not a bug, see dedup-rules-addendum-2.md):
                # a write larger than the OS pipe buffer can block if
                # the old command isn't reading concurrently; accepted
                # since the real Codex path never sends non-empty stdin.
                try:
                    proc.stdin.write(raw_stdin)
                except Exception:
                    pass
                finally:
                    try:
                        proc.stdin.close()
                    except Exception:
                        pass
            proc.wait()
    except Exception:
        pass


def _parse_payload(argv_tail: list, raw_stdin: bytes):
    """argv is the confirmed delivery path (RN5) and is tried first.
    Stdin is only consulted as a fallback for an unconfirmed caller
    that doesn't use argv -- never both, never guessing which one is
    "real" beyond this explicit preference order."""
    if argv_tail:
        try:
            return json.loads(argv_tail[-1])
        except Exception:
            return None
    if raw_stdin:
        try:
            return json.loads(raw_stdin.decode("utf-8", errors="replace"))
        except Exception:
            return None
    return None


def _run(payload) -> None:
    classification = codex_adapter.classify(payload)
    if classification is None:
        return
    category, discriminator, error_code = classification

    cfg = load_config()
    cwd = codex_adapter.extract_cwd(payload) or ""
    if not is_cwd_allowed(cwd, cfg):
        return

    surface_value = os.environ.get("DEV_NOTIFY_SURFACE", Surface.CODEX_CLI.value)
    try:
        surface = Surface(surface_value)
    except ValueError:
        surface = Surface.CODEX_CLI

    project_alias = resolve_project_alias(cwd, cfg)
    event = NotifyEvent(
        agent=Agent.RIPLEY, surface=surface, event_category=category,
        project_alias=project_alias, discriminator=discriminator,
        error_code=error_code, issue_number=cfg.get("issue_number"),
    )
    dispatch(event, cfg=cfg)


def main() -> int:
    """RN3/CV1: a hard-exit watchdog bounds the entire body (argv/stdin
    read, chaining, dispatch) -- Codex never waits for this script at
    all (`command.spawn()`, fire-and-forget, confirmed from source --
    see codex_adapter's module docstring), so this cap exists purely
    to stop an orphaned, hung invocation from lingering indefinitely,
    not to protect Codex's own responsiveness.

    RC1/QA1 (2026-11-12): chaining now runs in its own thread, started
    BEFORE dispatch logic, so a slow/hung old notify command no longer
    starves the new notification path (RC1's own finding: the old
    sequential order left a slow chain with no time left under the 5s
    cap for dispatch to even start). This is explicitly NOT fire-and-
    forget -- the main thread still `.join()`s the chain thread before
    returning, bounded only by the same hard-exit watchdog as before.

    RE1/CG3(ii) (2026-11-12): if `CHAIN_DEPTH_ENV_VAR` is already
    present in THIS process's own environment, this invocation IS
    itself a chained child (or a descendant of one) -- exit 0
    immediately, with no chain and no dispatch. Skipping dispatch too
    is deliberate: chaining AND dispatching here would double the
    notification for what Codex intended as one `notify` firing."""
    if os.environ.get(CHAIN_DEPTH_ENV_VAR):
        return 0
    wd = watchdog.start()
    try:
        argv_tail = sys.argv[1:]
        raw_stdin = _read_stdin_bounded(MAX_STDIN_BYTES, STDIN_READ_TIMEOUT_S)[:MAX_STDIN_BYTES]

        chain_thread = threading.Thread(target=_chain_to_existing, args=(argv_tail, raw_stdin), daemon=True)
        chain_thread.start()

        try:
            payload = _parse_payload(argv_tail, raw_stdin)
            if payload is None:
                state.increment_malformed_input_counter(default_state_path())
            else:
                _run(payload)
        except BaseException:
            pass

        chain_thread.join()  # no timeout: bounded only by the watchdog, same as before this change
    finally:
        wd.cancel()
    return 0


if __name__ == "__main__":
    # os._exit(), not sys.exit(): the bounded stdin read runs in a
    # background daemon thread that may still be blocked in the OS
    # read() syscall when main() returns (its join timeout expired,
    # not the read itself). Normal interpreter shutdown racing with
    # that still-blocked thread crashed with STATUS_ACCESS_VIOLATION
    # (0xC0000005) on Windows -- found 2026-11-12 via the never-closed-
    # stdin-pipe test. os._exit() terminates the process immediately
    # at the OS level, without running Python finalization, so the
    # stuck thread is simply reclaimed by the OS instead of racing it.
    rc = main()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(rc)
