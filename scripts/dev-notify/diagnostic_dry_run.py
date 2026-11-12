#!/usr/bin/env python3
"""AP4 (2026-11-12): a small, read-only diagnostic entrypoint for the
owner-run Phase B checklist (`activation-checklist.md`), because
`dispatch()`'s own return value is never persisted anywhere in a real
run (see dedup-rules-addendum-3.md AP2(d)) -- there is otherwise no
local evidence to read after a real hook fires.

Hard constraints, enforced by this file's own design, not by caller
discipline:
  - NEVER calls `ntfy_client.publish`, `windows_toast.send_windows_
    notification`, or `secret_store.read_secret_file`'s own DECRYPTED
    content -- only whether a secret file PATH exists (boolean).
  - NEVER mutates dedup state (`state.check_and_record` WRITES an
    entry; this reads the state file directly instead).
  - Output is a fixed, allowlisted set of generic fields: channel
    enabled/disabled, lock presence/age, and several chain-related
    fields (booleans/tri-state only -- never the chain command's own
    value). Never a token, topic, URL, private path, or raw payload.
  - No general runtime log, no queue, no change to the notification
    transport -- this script is invoked manually by a human, once,
    reading its own stdout; it is not wired into cli_claude.py/
    cli_codex.py's own hot path.

RE2/CG1/CG6 (2026-11-12): the original version only reported
`chain_env_var_set` (presence), which cannot distinguish "chained to
a legitimate old command" from "chained to our own wrapper" -- exactly
the RE1 self-chain danger. Now also reports, for the CURRENT process
environment's own `DEV_NOTIFY_CHAINED_NOTIFY_CMD`:
  - `chain_json_valid`: tri-state (`None` if the var is absent at all,
    else `True`/`False`) -- invalid JSON (including a value truncated
    mid-string by `setx`'s own ~1024-char limit) is `False`, never
    silently treated as fine.
  - `chain_points_to_wrapper`: tri-state (`None` if absent, else
    `True`/`False` via the same shared, fail-closed `is_wrapper_argv`
    helper every other surface uses -- an unparseable/ambiguous value
    reports `True` here too, never `False`, per that helper's own
    "unknown is never marked safe" rule).

RF3/PS4 (2026-11-12): also reports, for the PERSISTED source (the
registry on Windows -- never `os.environ`, since the current
process's own environment answers a DIFFERENT question, "what would a
NEW process see", not "is anything persisted at all"):
  - `chain_persisted_state`: one of `absent | empty | set | unreadable
    | not_windows` -- never the value itself.
  - `chain_persisted_json_valid` / `chain_persisted_points_to_wrapper`:
    tri-state, `None` whenever `chain_persisted_state` is anything
    other than `set` (RF3's own fix -- the activation checklist
    previously asked the owner to confirm `chain_points_to_wrapper ==
    false` from the CURRENT PROCESS's env, which is `None` in the same
    terminal `setx` ran in and therefore an unsatisfiable condition
    that invited exactly the RE1 danger: a confused owner re-running
    `apply`). When `set`: invalid JSON -> `valid=False, wrapper=True`
    (unknown never safe); valid JSON but a non-list/empty/non-string-
    element shape -> `valid=True, wrapper=True` (same fail-closed rule,
    via the shared `is_wrapper_argv`); a clean argv list -> `valid=True,
    wrapper=` whatever `is_wrapper_argv` says.

RF2/PS1 (2026-11-12): `read_back_chain` is now an EXPLICIT, REQUIRED
argument to `_chain_persisted_summary()`, and `main()` takes an
optional `read_back_chain` keyword-only override that defaults to
`None` and resolves to the module-level `real_read_back_chain` name
*inside the function body* at call time -- NEVER as a function
default-parameter value bound once when this module is first
imported. The earlier version's `def _chain_persisted_summary(
read_back_chain=real_read_back_chain)` silently ignored any later
`diagnostic_dry_run.real_read_back_chain = fake` monkeypatch, because
Python binds default parameter values once, at `def` time, not on
every call -- found by independent review. This also means
`main(read_back_chain=fake_reader)` can now be called fully in-process
for testing, with no subprocess needed at all.

An earlier version of this docstring claimed a "would currently
dedupe" boolean that was never actually implemented -- removed rather
than left as a stale, misleading claim.

Usage (from repo root):
    python scripts/dev-notify/diagnostic_dry_run.py
"""
import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from dev_notify.apply_config_patch import real_read_back_chain  # noqa: E402  (module-level name -- see RF2/PS1 above; never bound as a default param)
from dev_notify.config import load_config  # noqa: E402
from dev_notify.dispatch import default_state_path  # noqa: E402
from dev_notify.wrapper_detect import is_wrapper_argv  # noqa: E402

CHAIN_ENV_VAR = "DEV_NOTIFY_CHAINED_NOTIFY_CMD"


def _redacted_config_summary(cfg: dict) -> dict:
    ntfy_cfg = cfg.get("ntfy", {})
    return {
        "enabled": cfg.get("enabled", True),
        "windows_toast_enabled": cfg.get("windows_toast", {}).get("enabled", True),
        "ntfy_enabled": bool(ntfy_cfg.get("enabled")),
        "ntfy_host_configured": bool(ntfy_cfg.get("host")),  # presence only, never the value
        "ntfy_topic_configured": bool(ntfy_cfg.get("topic")),  # presence only, never the value
        "ntfy_token_secret_path_configured": bool(ntfy_cfg.get("token_secret_path")),  # presence only
        "ntfy_timeout_s": ntfy_cfg.get("timeout_s"),  # a bounded number, not a secret
    }


def _state_summary(state_path: Path) -> dict:
    """Read-only. Never calls state.check_and_record (which WRITES)."""
    out = {"state_file_exists": state_path.exists(), "entry_count": None,
           "malformed_input_count": None, "lock_present": False, "lock_age_s": None}
    if state_path.exists():
        try:
            data = json.loads(state_path.read_text(encoding="utf-8"))
            out["entry_count"] = len(data.get("entries", {}))
            out["malformed_input_count"] = data.get("malformed_input_count", 0)
        except Exception:
            out["entry_count"] = "unreadable"
    lock_path = Path(str(state_path) + ".lock")
    if lock_path.exists():
        out["lock_present"] = True
        try:
            out["lock_age_s"] = round(time.time() - lock_path.stat().st_mtime, 1)
        except OSError:
            out["lock_age_s"] = "unknown"
    return out


def _chain_env_summary() -> dict:
    """Tri-state fields for the CURRENT PROCESS's own environment --
    answers "what would a notify invocation starting from THIS shell
    see right now", which is a different question from
    `_chain_persisted_summary()`'s own "what's actually persisted"."""
    raw = os.environ.get(CHAIN_ENV_VAR)
    out = {"chain_env_var_set": bool(raw), "chain_json_valid": None, "chain_points_to_wrapper": None}
    if not raw:
        return out
    try:
        parsed = json.loads(raw)
        out["chain_json_valid"] = True
    except Exception:
        out["chain_json_valid"] = False
        out["chain_points_to_wrapper"] = True  # CG6: unknown/invalid is never marked safe
        return out
    out["chain_points_to_wrapper"] = is_wrapper_argv(parsed)
    return out


def _chain_persisted_summary(read_back_chain) -> dict:
    """CG1(c)/RF3/PS4: reads the REAL persisted source (never
    `os.environ`, never the value itself). `read_back_chain` is a
    REQUIRED positional argument -- no default -- so a caller can
    never accidentally fall back to the real reader by omission (RF2/
    PS1)."""
    base = {"chain_persisted_state": None, "chain_persisted_json_valid": None, "chain_persisted_points_to_wrapper": None}
    try:
        value = read_back_chain()
    except ImportError:
        return {**base, "chain_persisted_state": "not_windows"}
    except Exception:
        # Any other read failure (e.g. a real_read_back_chain that
        # propagated a non-FileNotFoundError OSError -- RF2(b)) is
        # `unreadable`, never silently folded into `absent`.
        return {**base, "chain_persisted_state": "unreadable"}
    if value is None:
        return {**base, "chain_persisted_state": "absent"}
    if value == "":
        return {**base, "chain_persisted_state": "empty"}
    # set -- PS4's own exhaustive table for valid/wrapper follows.
    try:
        parsed = json.loads(value)
    except Exception:
        return {**base, "chain_persisted_state": "set", "chain_persisted_json_valid": False, "chain_persisted_points_to_wrapper": True}
    return {**base, "chain_persisted_state": "set", "chain_persisted_json_valid": True,
            "chain_persisted_points_to_wrapper": is_wrapper_argv(parsed)}


def main(*, read_back_chain=None) -> int:
    """`read_back_chain` is resolved here, inside the function body,
    from the module-level `real_read_back_chain` name when not given
    explicitly -- a LIVE lookup (not a frozen default parameter), so
    tests can reliably monkeypatch `diagnostic_dry_run.real_read_back_chain`
    and have it take effect (RF2/PS1)."""
    reader = read_back_chain if read_back_chain is not None else real_read_back_chain
    cfg = load_config()
    state_path = default_state_path()
    report = {
        "config": _redacted_config_summary(cfg),
        "dedup_state": _state_summary(state_path),
        "codex_chain": {**_chain_env_summary(), **_chain_persisted_summary(reader)},
        "note": "read-only diagnostic -- no notification sent, no ntfy HTTP call made, no secret content read, no state written",
    }
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
