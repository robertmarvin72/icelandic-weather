#!/usr/bin/env python3
"""Entrypoint registered as the Claude Code hook command for
Notification/Stop/StopFailure (NEVER PermissionRequest, NEVER
SessionEnd -- see audit-report.md). Per NT3(a): ALWAYS exits 0, NEVER
writes anything to stdout (stdout is a decision channel on some hook
events; this script treats stdout as forbidden unconditionally, not
just where currently required, so a future re-registration on a
different event can never accidentally turn silence into a decision).
All diagnostic output, if any, goes only to the local state file via
state.py's own counters -- never to stderr either, to stay inert on
every documented hook event without needing to special-case per event.
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dev_notify import state, watchdog  # noqa: E402
from dev_notify.adapters import claude_adapter  # noqa: E402
from dev_notify.config import is_cwd_allowed, load_config, resolve_project_alias  # noqa: E402
from dev_notify.dispatch import default_state_path, dispatch  # noqa: E402
from dev_notify.events import Agent, NotifyEvent, Surface  # noqa: E402

MAX_STDIN_BYTES = 1024 * 1024


def _as_str_or_none(value):
    """RN2: a payload field whose type is hostile (int/list/dict/etc,
    e.g. `{"cwd": 123}` or `{"cwd": ["x"]}`) must be treated as absent,
    never passed on to a function that assumes str (`.lower()` etc,
    which previously raised an uncaught TypeError -- found 2026-11-11
    by independent sandbox review)."""
    return value if isinstance(value, str) else None


def _run(payload) -> None:
    classification = claude_adapter.classify(payload)
    if classification is None:
        return
    category, discriminator, error_code = classification

    cwd = _as_str_or_none(payload.get("cwd")) if isinstance(payload, dict) else None
    cfg = load_config()
    if not is_cwd_allowed(cwd or "", cfg):
        return

    surface_value = os.environ.get("DEV_NOTIFY_SURFACE", Surface.CLAUDE_CLI.value)
    try:
        surface = Surface(surface_value)
    except ValueError:
        surface = Surface.CLAUDE_CLI

    project_alias = resolve_project_alias(cwd or "", cfg)
    event = NotifyEvent(
        agent=Agent.CC, surface=surface, event_category=category,
        project_alias=project_alias, discriminator=discriminator,
        error_code=error_code, issue_number=cfg.get("issue_number"),
    )
    dispatch(event, cfg=cfg)


def main() -> int:
    """RN2: the entire body runs under one outer try/except BaseException
    so that ANY unanticipated failure -- a hostile payload field type,
    a bug several calls deep, anything -- still exits 0 with no stdout/
    stderr output, exactly as NT3(a) requires for every documented hook
    event this script is ever registered for. This is defense in depth
    on top of (not a replacement for) the specific per-field type checks
    below and in claude_adapter.classify().

    RN3/CV1: a hard-exit watchdog bounds the ENTIRE body (including
    dispatch(), which can shell out to powershell.exe/ntfy) to
    TOTAL_RUNTIME_CAP_SECONDS, because Claude Code never enforces
    `timeout` once a command hook runs with `async: true` (see
    dedup-rules-addendum-1.md) -- so this script must self-enforce."""
    wd = watchdog.start()
    try:
        raw = sys.stdin.buffer.read(MAX_STDIN_BYTES + 1)
        truncated = len(raw) > MAX_STDIN_BYTES
        raw = raw[:MAX_STDIN_BYTES]

        try:
            payload = json.loads(raw.decode("utf-8", errors="replace")) if raw and not truncated else None
        except Exception:
            payload = None

        if payload is None:
            state.increment_malformed_input_counter(default_state_path())
            return 0

        _run(payload)
    except BaseException:
        pass
    finally:
        wd.cancel()
    return 0


if __name__ == "__main__":
    # os._exit(), not sys.exit(): consistent with cli_codex.py's own
    # fix for the same class of issue -- a watchdog Timer thread could
    # in principle still be mid-fire at the exact moment main() returns
    # and cancel()s it; os._exit() sidesteps any such interpreter-
    # shutdown race by never running Python finalization at all.
    rc = main()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(rc)
