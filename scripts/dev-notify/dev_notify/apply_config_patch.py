"""Dry-run-by-default config patch tool for #498 Phase B hook wiring
(NT1/NT7). `plan` is always safe (no write) and is this module's own
default action. `apply`/`rollback` require an explicit `--apply` flag
AND a real target path -- against this repo's own `.claude/
settings.local.json` or the user's `~/.codex/config.toml` those two
real writes are themselves Phase B, gated on a separate dated owner
activation record (see docs/ai/tasks/ticket-498/). This module and its
own tests only ever run against tempfile copies or the harmless,
secret-free `.claude/settings.local.json` -- never against the real
`~/.codex/config.toml`, whose existing `notify` value is treated as
sensitive and is never written into any tracked diff/log/state.

Merge discipline (NT7): every change is additive (existing permissions/
hooks/notify preserved), backed up with a pre-change SHA-256, parse-
validated before AND after, and any rendered diff redacts the secret-
adjacent "existing notify command" value -- it is shown only as the
placeholder `<EXISTING_NOTIFY_COMMAND>`, never its real text.
"""
import difflib
import hashlib
import json
import re
import subprocess
import sys
import tomllib
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, List, Optional

# Absolute import, with a sys.path fallback -- this module is used
# BOTH as part of the `dev_notify` package (`from dev_notify import
# apply_config_patch`, tests) AND run directly as a standalone script
# (`python apply_config_patch.py ...`, the CLI entrypoint). A relative
# import (`from .wrapper_detect import ...`) raises `ImportError:
# attempted relative import with no known parent package` in the
# second case -- found via `test_apply_config_patch_cli.py`'s own
# subprocess tests failing after this import was added.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dev_notify.wrapper_detect import classify_argv  # noqa: E402

REDACTED_NOTIFY_PLACEHOLDER = "<EXISTING_NOTIFY_COMMAND>"
CLAUDE_HOOK_EVENTS = ("Notification", "Stop", "StopFailure")
CHAIN_ENV_VAR = "DEV_NOTIFY_CHAINED_NOTIFY_CMD"


class SetxFailedError(RuntimeError):
    """RG2/TI2 (2026-11-12): carries ONLY a structured, non-secret
    `returncode` -- never `setx`'s own stderr text, which could itself
    echo back the value being set (the real old `notify` command,
    secret-adjacent per this module's own docstring) on some failure
    paths. `str(self)` is deliberately generic (no stderr content) so
    that even an un-reviewed `str(e)`/`repr(e)` elsewhere can never
    leak it -- but every caller in this module must still prefer
    `type(e).__name__` + `.returncode` over `str(e)`, never the other
    way around, since this class existing is not by itself a
    guarantee against a *different* exception type carrying text."""

    def __init__(self, returncode: int):
        self.returncode = returncode
        super().__init__("setx exited with a non-zero returncode (see .returncode, text withheld)")


def sha256_of_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _exception_detail(e: BaseException) -> dict:
    """RG2/TI2 (2026-11-12): the ONLY way any exception's information
    may reach `apply_codex`'s public result dict. Returns the
    exception's TYPE NAME only, plus its `returncode` attribute IF one
    exists AND is an `int` (e.g. `SetxFailedError`) -- NEVER
    `str(e)`/`repr(e)`, and never any other attribute, since an
    exception's own message text is exactly where the real old
    `notify` command, a private path, or a registry read's own error
    string could leak (confirmed real risk: `real_read_back_chain`'s
    own `OSError` messages, and an injected-but-plausible
    `PermissionError` text, both could legitimately contain
    machine-specific path content)."""
    detail = {"type": type(e).__name__}
    returncode = getattr(e, "returncode", None)
    if isinstance(returncode, int):
        detail["returncode"] = returncode
    return detail


def _timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def backup_path_for(path: Path) -> Path:
    return path.with_name(path.name + f".bak-{_timestamp()}")


def _write_atomic(path: Path, text: str) -> None:
    import os
    tmp = path.with_name(path.name + f".tmp-{os.getpid()}")
    tmp.write_text(text, encoding="utf-8")
    os.replace(str(tmp), str(path))


# ---------------------------------------------------------------------------
# Claude: .claude/settings.local.json (JSON, merge-only)
# ---------------------------------------------------------------------------

def _hook_command_entry(python_exe: str, cli_path: str) -> dict:
    # async: true (RN3/CV1, dedup-rules-addendum-1.md): VERIFIED_FROM_DOCS
    # that Notification/Stop/StopFailure command hooks support it on the
    # installed 2.1.195 -- without it, Claude Code would otherwise wait
    # (synchronously, respecting `timeout`) for this script before
    # continuing, which the approved prompt's own RN3 finding says must
    # not happen. `timeout` is kept explicit anyway (documentation of
    # intent) even though Claude Code does not enforce it under async --
    # this script enforces its own cap instead (watchdog.py).
    return {"type": "command", "command": f'"{python_exe}" "{cli_path}"', "timeout": 10, "async": True}


def merge_claude_hooks(existing: dict, python_exe: str, cli_claude_path: str) -> dict:
    """Returns a NEW dict -- never mutates `existing`. Appends one
    command handler per event in CLAUDE_HOOK_EVENTS, skipping an event
    that already has an identical command registered (idempotent re-
    apply), and never touches any other existing top-level key
    (`permissions`, or any other hook event already configured)."""
    merged = json.loads(json.dumps(existing))  # deep copy
    hooks = merged.setdefault("hooks", {})
    entry = _hook_command_entry(python_exe, cli_claude_path)
    for event in CLAUDE_HOOK_EVENTS:
        groups = hooks.setdefault(event, [])
        already_present = any(
            h.get("command") == entry["command"]
            for group in groups
            for h in group.get("hooks", [])
        )
        if not already_present:
            groups.append({"hooks": [entry]})
    return merged


def plan_claude(path: Path, python_exe: str, cli_claude_path: str, *, display_path: Optional[str] = None) -> dict:
    before_text = path.read_text(encoding="utf-8") if path.exists() else "{}"
    before = json.loads(before_text)  # raises if the real file is somehow invalid -- STOP, never guess
    after = merge_claude_hooks(before, python_exe, cli_claude_path)
    after_text = json.dumps(after, indent=2) + "\n"
    shown = display_path if display_path is not None else str(path)
    diff = "".join(difflib.unified_diff(
        before_text.splitlines(keepends=True), after_text.splitlines(keepends=True),
        fromfile=shown, tofile=shown + " (planned)",
    ))
    return {
        "target": "claude", "path": str(path), "before_sha256": sha256_of_text(before_text),
        "after_preview_sha256": sha256_of_text(after_text), "diff": diff,
        "no_op": before == after,
    }


def apply_claude(path: Path, python_exe: str, cli_claude_path: str, *, apply: bool) -> dict:
    plan = plan_claude(path, python_exe, cli_claude_path)
    if not apply:
        plan["applied"] = False
        return plan
    before_text = path.read_text(encoding="utf-8") if path.exists() else "{}"
    before = json.loads(before_text)
    after = merge_claude_hooks(before, python_exe, cli_claude_path)
    after_text = json.dumps(after, indent=2) + "\n"
    backup = backup_path_for(path)
    if path.exists():
        backup.write_text(before_text, encoding="utf-8")
    _write_atomic(path, after_text)
    written = json.loads(path.read_text(encoding="utf-8"))  # re-validate what actually landed on disk
    if written != after:
        raise RuntimeError("post-write validation mismatch -- written content != intended content")
    plan.update({"applied": True, "backup_path": str(backup)})
    return plan


def rollback_claude(path: Path, backup_path: Path, *, apply: bool) -> dict:
    backup_text = backup_path.read_text(encoding="utf-8")
    json.loads(backup_text)  # parse-validate the backup before trusting it
    current_text = path.read_text(encoding="utf-8") if path.exists() else "{}"
    result = {"target": "claude", "path": str(path), "backup_path": str(backup_path),
              "current_sha256": sha256_of_text(current_text), "applied": False}
    if not apply:
        return result
    _write_atomic(path, backup_text)
    restored = json.loads(path.read_text(encoding="utf-8"))
    if restored != json.loads(backup_text):
        raise RuntimeError("post-rollback validation mismatch")
    result["applied"] = True
    return result


# ---------------------------------------------------------------------------
# Codex: ~/.codex/config.toml (TOML, single top-level key, line-based patch)
# ---------------------------------------------------------------------------

_TOP_LEVEL_NOTIFY_RE = re.compile(r'^(?P<prefix>\s*notify\s*=\s*)(?P<value>\[.*\])(?P<suffix>\s*(#.*)?)$')


def _find_top_level_notify_line(lines: List[str]) -> Optional[int]:
    """Only matches a `notify = [...]` line that appears BEFORE the
    first `[section]` header -- Codex's own `notify` key is root-level;
    this must never touch a same-named key nested under some table."""
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("[") and not stripped.startswith("[["):
            break
        if stripped.startswith("[["):
            break
        if _TOP_LEVEL_NOTIFY_RE.match(line):
            return i
    return None


def _redact_notify_line(line: str) -> str:
    m = _TOP_LEVEL_NOTIFY_RE.match(line)
    if not m:
        return line
    return f"{m.group('prefix')}{json.dumps([REDACTED_NOTIFY_PLACEHOLDER])}{m.group('suffix')}"


def replace_top_level_notify(text: str, new_argv: List[str]) -> str:
    lines = text.splitlines(keepends=True)
    idx = _find_top_level_notify_line(lines)
    if idx is None:
        raise ValueError("no top-level `notify = [...]` line found -- refusing to guess where to add one")
    m = _TOP_LEVEL_NOTIFY_RE.match(lines[idx])
    newline = "\n" if lines[idx].endswith("\n") else ""
    lines[idx] = f"{m.group('prefix')}{json.dumps(new_argv)}{m.group('suffix').rstrip()}{newline}"
    return "".join(lines)


def _redact_text_for_display(text: str) -> str:
    lines = text.splitlines(keepends=True)
    idx = _find_top_level_notify_line(lines)
    if idx is not None:
        lines[idx] = _redact_notify_line(lines[idx])
    return "".join(lines)


def _compute_codex_patch(path: Path, python_exe: str, cli_codex_path: str, *, display_path: Optional[str] = None):
    """Internal only. Returns (public_plan_dict, before_text, after_text,
    real_old_notify_argv). The real old notify value is returned as its
    OWN separate element, never nested inside `public_plan_dict` -- that
    dict is the only thing `plan_codex` (and anything printed/logged)
    may ever expose."""
    before_text = path.read_text(encoding="utf-8")
    before = tomllib.loads(before_text)  # raises if the real file is somehow invalid -- STOP, never guess
    old_notify = before.get("notify")
    if not isinstance(old_notify, list) or not old_notify:
        raise ValueError("existing config has no usable top-level `notify` array to chain from")
    notify_classification = classify_argv(old_notify)
    if notify_classification != "ok":
        # RE1/CG2/PS3/PS5: the CURRENT `notify` already points at our
        # own wrapper, OR its shape is too ambiguous to trust as "the
        # old command to chain to" -- either way, refuse here, before
        # any diff/persist/write is even computed (both still fail
        # closed identically; only the REASON text differs below, so
        # a legitimate old command with e.g. a stray empty argv
        # element is never mislabeled "already_patched" when it
        # demonstrably isn't the wrapper -- RF5).
        public_plan = {
            "target": "codex", "path": str(path),
            "already_patched": notify_classification == "wrapper",
            "notify_ambiguous": notify_classification == "ambiguous",
            "before_sha256": sha256_of_text(before_text), "diff": "", "no_op": True,
        }
        return public_plan, before_text, None, None
    new_argv = [python_exe, cli_codex_path]
    after_text = replace_top_level_notify(before_text, new_argv)
    after = tomllib.loads(after_text)
    non_notify_before = {k: v for k, v in before.items() if k != "notify"}
    non_notify_after = {k: v for k, v in after.items() if k != "notify"}
    if non_notify_before != non_notify_after:
        raise RuntimeError("patch changed a key other than `notify` -- refusing")
    # The OLD notify value may be secret-adjacent (an arbitrary machine
    # path) and is always redacted for display. The NEW value is never
    # secret -- it's this tool's own tracked wrapper path -- so it is
    # shown as-is; redacting both sides identically would make a real
    # change render as an empty, misleading no-op diff.
    redacted_before_text = _redact_text_for_display(before_text)
    shown = display_path if display_path is not None else str(path)
    diff = "".join(difflib.unified_diff(
        redacted_before_text.splitlines(keepends=True), after_text.splitlines(keepends=True),
        fromfile=shown, tofile=shown + " (planned)",
    ))
    chain_setx_preview_redacted = f'setx {CHAIN_ENV_VAR} "{json.dumps([REDACTED_NOTIFY_PLACEHOLDER])}"'
    public_plan = {
        "target": "codex", "path": str(path), "before_sha256": sha256_of_text(before_text),
        "after_preview_sha256": sha256_of_text(after_text), "diff": diff,
        "chain_setx_command_redacted": chain_setx_preview_redacted,
        "no_op": before_text == after_text,
    }
    return public_plan, before_text, after_text, old_notify


def plan_codex(path: Path, python_exe: str, cli_codex_path: str, *, display_path: Optional[str] = None) -> dict:
    public_plan, _before_text, _after_text, _old_notify = _compute_codex_patch(path, python_exe, cli_codex_path, display_path=display_path)
    return public_plan


def apply_codex(path: Path, python_exe: str, cli_codex_path: str, *, apply: bool,
                 persist_chain: Callable[[str], None] = None,
                 read_back_chain: Callable[[], Optional[str]] = None) -> dict:
    """AP3 (2026-11-12): fixes a real ordering bug found by independent
    sandbox review. The OLD code wrote the new `notify` line FIRST and
    only called `run_setx` (the old name for `persist_chain`) AFTER --
    with `check=False`, so a failed/missing `setx`, or one that
    silently truncated a value over Windows' own ~1024-char `setx`
    limit, left `config.toml` pointing at `cli_codex.py` while the old
    notify command's own argv was never actually (or only partially)
    persisted anywhere `cli_codex.py` could read it back from -- the
    old Codex notify command would silently stop being chained to,
    the exact thing NT7 promises never happens ("gamla skipunin
    vardveitt og kolluo").

    Fixed order, now: persist -> read back from the REAL persisted
    source from a position that distrusts this process's own
    `os.environ` -- a NEW process does not inherit a `setx` value from
    an old parent's environment, only from the value's real persisted
    store (the registry, on Windows) -- and hash-compare against what
    was asked to be persisted -> only THEN write `config.toml`. Any
    failure at either of the first two steps means NO config write
    happens at all, `applied` is `False`, and no backup is created
    (there is nothing yet to back up). A failure in the config write
    itself (or its own post-write validation) still returns the
    backup path rather than raising past this function, so it is
    never lost to the caller."""
    public_plan, before_text, after_text, old_notify = _compute_codex_patch(path, python_exe, cli_codex_path)
    if public_plan.get("already_patched") or public_plan.get("notify_ambiguous"):
        # RE1/CG2/PS3/PS5: refuse unconditionally, even with --apply --
        # no persist, no backup, no write, in EITHER case (both fail
        # closed identically); only the reason text differs so a
        # legitimate-but-ambiguous old command is never mislabeled
        # "already_patched". The message points at rollback, never at
        # a forced bypass.
        reason = "already_patched" if public_plan.get("already_patched") else "notify_ambiguous_or_wrapper"
        public_plan.update({"applied": False, "backup_path": None, "reason": reason})
        return public_plan
    if not apply:
        public_plan["applied"] = False
        return public_plan

    old_notify_json = json.dumps(old_notify)

    if persist_chain is not None:
        # CG5(a): check what's ALREADY persisted (if anything) BEFORE
        # overwriting it. A different, non-empty existing value means
        # something else legitimately holds the chain slot right now
        # -- refuse rather than clobber it. An EQUAL existing value
        # (e.g. a retry after a prior config_write_failed) is fine and
        # idempotent; proceeding re-persists the same value.
        if read_back_chain is not None:
            try:
                existing_persisted = read_back_chain()
            except Exception as e:
                # RF2(c) fix (2026-11-12): previously swallowed this
                # and treated it as `existing_persisted = None` (i.e.
                # "nothing there, safe to proceed") -- a real read
                # failure here must refuse, never be silently waved
                # through as "absent". The config is NOT written and
                # NOTHING is persisted when we can't even confirm
                # what's already there. RG2/TI2: `detail` is the
                # exception's TYPE NAME only (see `_exception_detail`)
                # -- never its own message text, which could itself
                # contain a real registry error string.
                public_plan.update({"applied": False, "backup_path": None,
                                     "reason": "chain_state_unreadable", "detail": _exception_detail(e)})
                return public_plan
            if isinstance(existing_persisted, str) and existing_persisted and existing_persisted != old_notify_json:
                public_plan.update({"applied": False, "backup_path": None, "reason": "chain_already_set_different"})
                return public_plan
        try:
            persist_chain(old_notify_json)
        except Exception as e:
            # RG2/TI2: TYPE NAME (+ `.returncode` if the exception is
            # a `SetxFailedError`) only -- never the exception's own
            # message text, which `setx` could itself have populated
            # with the real old `notify` value on some failure paths.
            public_plan.update({"applied": False, "backup_path": None,
                                 "reason": "chain_persist_failed", "detail": _exception_detail(e)})
            return public_plan
        try:
            readback = read_back_chain() if read_back_chain is not None else None
        except Exception:
            readback = None
        readback_hash = sha256_of_text(readback) if isinstance(readback, str) else None
        expected_hash = sha256_of_text(old_notify_json)
        if readback_hash != expected_hash:
            # Catches a failed, missing, AND a silently-truncated/
            # mangled setx (e.g. Windows' own ~1024-char value limit)
            # identically -- any mismatch against the real persisted
            # source refuses the config write, never just a "missing"
            # special case.
            public_plan.update({"applied": False, "backup_path": None, "reason": "chain_persist_verification_failed"})
            return public_plan
    # else: persist_chain not given -- the caller is responsible for
    # having persisted (and verified) the chain value as its OWN
    # separate step before calling this with --apply (AP3 path (ii)).

    tomllib.loads(after_text)  # re-validate before writing
    backup = backup_path_for(path)
    try:
        backup.write_text(before_text, encoding="utf-8")
        _write_atomic(path, after_text)
        written_text = path.read_text(encoding="utf-8")
        if tomllib.loads(written_text) != tomllib.loads(after_text):
            raise RuntimeError("post-write validation mismatch")
    except Exception as e:
        # AP3: the backup path is always returned on error, never
        # swallowed by an uncaught raise -- the caller can still find
        # it and roll back manually even when this function itself
        # could not complete. RG2/TI2: `detail` is type-name-only (see
        # `_exception_detail`) -- never the exception's message text.
        public_plan.update({"applied": False, "backup_path": str(backup), "reason": "config_write_failed", "detail": _exception_detail(e)})
        return public_plan

    public_plan.update({"applied": True, "backup_path": str(backup)})
    return public_plan


def rollback_codex(path: Path, backup_path: Path, *, apply: bool) -> dict:
    backup_text = backup_path.read_text(encoding="utf-8")
    tomllib.loads(backup_text)  # parse-validate the backup before trusting it
    current_text = path.read_text(encoding="utf-8") if path.exists() else ""
    result = {"target": "codex", "path": str(path), "backup_path": str(backup_path),
              "current_sha256": sha256_of_text(current_text), "applied": False}
    if not apply:
        return result
    _write_atomic(path, backup_text)
    if tomllib.loads(path.read_text(encoding="utf-8")) != tomllib.loads(backup_text):
        raise RuntimeError("post-rollback validation mismatch")
    result["applied"] = True
    return result


def real_persist_chain(value_json: str) -> None:  # pragma: no cover -- exercised only by a real, owner-run B activation
    """Persists the chained notify command as a user-level env var via
    the OS's own `setx` (argv list, never a shell string -- NT4's own
    no-shell-interpolation rule applies here too). This function is
    never wired up or invoked by anything in Phase A -- the CLI below
    only passes it to `apply_codex` when a caller explicitly asks, and
    CC does not invoke `--apply` against a real path this round.

    AP3 fix: previously `check=False`, silently discarding a nonzero
    `setx` exit code -- `apply_codex`'s own persist-then-verify order
    now needs a real failure signal here (it raises on one), so this
    checks the returncode explicitly.

    RG2/TI2 (2026-11-12): previously embedded `setx`'s own stderr text
    (truncated to 200 chars) in the exception message -- `setx` can
    echo the value it was asked to set back in its own error output on
    some failure paths, which would then propagate the real old
    `notify` command (secret-adjacent) into `apply_codex`'s `detail`
    field and from there into whatever the owner pastes into a
    tracked file or a chat. Now raises `SetxFailedError(returncode)`
    instead -- an integer only, never stderr text. `proc.stderr` is
    deliberately not read into any variable here at all."""
    proc = subprocess.run(["setx", CHAIN_ENV_VAR, value_json], capture_output=True, timeout=10)
    if proc.returncode != 0:
        raise SetxFailedError(proc.returncode)


def real_read_back_chain() -> Optional[str]:  # pragma: no cover -- exercised only by a real, owner-run B activation
    """Reads the chain value back from its REAL persisted source --
    the current user's `Environment` registry key -- never from
    `os.environ`, which a new process does NOT inherit from an old
    parent's `setx` call (confirmed from Codex's own source --
    see codex_adapter.py's module docstring for the citation on why a
    process's environment is a point-in-time snapshot, not live).
    `winreg` is stdlib (no new package) and Windows-only; the import
    is lazy so this module stays importable on any platform."""
    import winreg
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
            value, _value_type = winreg.QueryValueEx(key, CHAIN_ENV_VAR)
            return value
    except FileNotFoundError:
        # RF2(b) fix (2026-11-12): previously caught `(FileNotFoundError,
        # OSError)` together and returned `None` (= "absent") for BOTH --
        # silently treating a real access problem (e.g. `PermissionError`,
        # itself an `OSError` subclass) as "nothing persisted" was false
        # safety, exactly where the owner needs to know the read itself
        # failed. Now ONLY `FileNotFoundError` (the key/value genuinely
        # doesn't exist) maps to "absent"; any OTHER `OSError` propagates,
        # so callers (apply_codex's CG5(a) check, diagnostic_dry_run.py)
        # can distinguish "absent" from "unreadable" and react correctly.
        return None


def _build_arg_parser():
    import argparse
    p = argparse.ArgumentParser(description="Dry-run-by-default config patch tool for #498 Phase B hook wiring.")
    p.add_argument("target", choices=["claude", "codex"])
    p.add_argument("action", choices=["plan", "apply", "rollback"], nargs="?", default="plan")
    p.add_argument("--path", help="override the real default config path (always required for rollback: the file to restore INTO)")
    p.add_argument("--backup", help="rollback only: the backup file to restore from")
    p.add_argument("--apply", action="store_true", help="actually write; omitted means dry-run/plan-only, even for action=apply/rollback")
    p.add_argument("--python-exe", default=None, help="interpreter to register in the hook/notify command (default: this interpreter)")
    p.add_argument("--cli-path", default=None, help="override the cli_claude.py/cli_codex.py path to register")
    p.add_argument("--skip-chain", action="store_true", help="codex apply only: do not persist the chained old notify command via setx")
    return p


def main(argv=None) -> int:
    import sys
    args = _build_arg_parser().parse_args(argv)
    this_dir = Path(__file__).resolve().parent
    python_exe = args.python_exe or sys.executable

    if args.target == "claude":
        path = Path(args.path) if args.path else Path.cwd() / ".claude" / "settings.local.json"
        cli_path = args.cli_path or str(this_dir / "cli_claude.py")
        if args.action == "plan":
            result = plan_claude(path, python_exe, cli_path)
        elif args.action == "apply":
            result = apply_claude(path, python_exe, cli_path, apply=args.apply)
        else:
            if not args.backup:
                print("rollback requires --backup PATH", file=sys.stderr)
                return 2
            result = rollback_claude(path, Path(args.backup), apply=args.apply)
    else:
        path = Path(args.path) if args.path else Path.home() / ".codex" / "config.toml"
        cli_path = args.cli_path or str(this_dir / "cli_codex.py")
        if args.action == "plan":
            result = plan_codex(path, python_exe, cli_path)
        elif args.action == "apply":
            persist_fn = None if args.skip_chain else real_persist_chain
            read_back_fn = None if args.skip_chain else real_read_back_chain
            result = apply_codex(path, python_exe, cli_path, apply=args.apply,
                                  persist_chain=persist_fn, read_back_chain=read_back_fn)
        else:
            if not args.backup:
                print("rollback requires --backup PATH", file=sys.stderr)
                return 2
            result = rollback_codex(path, Path(args.backup), apply=args.apply)

    print(json.dumps(result, indent=2))
    if args.action in ("apply", "rollback") and not args.apply:
        print("\n(dry-run only -- nothing was written; re-run with --apply to write for real)", file=sys.stderr)
    return 0


if __name__ == "__main__":  # pragma: no cover -- exercised via subprocess in tests/test_apply_config_patch_cli.py
    import sys
    sys.exit(main())
