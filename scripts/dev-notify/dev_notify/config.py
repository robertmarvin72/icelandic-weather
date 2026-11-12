"""Local config: project-alias table, enable/disable, issue number,
ntfy settings (host/topic are never hardcoded here -- see
docs/dev/dev-notify-setup.md for how the owner provides them locally).

This file defines DEFAULTS and the loader; the actual local override
file (if any) lives outside Git at a path the owner controls -- never
committed, never containing a topic name or token.
"""
import json
import os
from pathlib import Path
from typing import Optional

DEFAULT_CONFIG = {
    "enabled": True,
    "issue_number": None,
    "project_aliases": {
        # "C:\\Users\\...\\forritun\\icelandic-weather": "campcast"
    },
    "ntfy": {
        "enabled": False,  # Phase B only; Phase A never flips this true for a real send
        "host": None,  # e.g. "ntfy.sh" -- never committed with a real topic
        "topic": None,  # set only in the local override file, never in this repo
        "port": None,  # only for a self-hosted non-443 instance; ntfy.sh needs this unset
        "token_present": False,  # true only once Phase B's own secret-store read succeeds
        "token_secret_path": None,  # path to a DPAPI-encrypted secret file (secret_store.py); never a real path or token committed here (RN4)
        "timeout_s": 2,  # lowered from 5 (RN3/dedup-rules-addendum-1.md) to fit the 5s total-runtime cap
        "max_calls_total": 0,
        "max_bytes_total": 0,
    },
    "windows_toast": {"enabled": True},
    "project_filter": {
        # Codex notify has no native per-project scoping (see audit-report.md);
        # this list restricts which cwd prefixes the codex adapter will act on.
        "allowed_cwd_prefixes": [],
    },
}

LOCAL_CONFIG_ENV_VAR = "DEV_NOTIFY_CONFIG_PATH"


def default_local_config_path() -> Path:
    base = os.environ.get("LOCALAPPDATA") or str(Path.home() / ".local" / "share")
    return Path(base) / "dev-notify" / "config.json"


def load_config(path: Optional[Path] = None) -> dict:
    """Merges DEFAULT_CONFIG with the local override file, if any. Never
    raises on a missing/corrupt override -- falls back to defaults, since
    a broken local config must never block a notification (same principle
    as dedup-rules.md's own fail-open rule)."""
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))  # deep copy
    if path is not None:
        candidate = path
    elif os.environ.get(LOCAL_CONFIG_ENV_VAR):
        candidate = Path(os.environ[LOCAL_CONFIG_ENV_VAR])
    else:
        candidate = default_local_config_path()
    try:
        if candidate and Path(candidate).exists():
            override = json.loads(Path(candidate).read_text(encoding="utf-8"))
            _deep_merge(cfg, override)
    except Exception:
        pass
    return cfg


def _deep_merge(base: dict, override: dict) -> None:
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            _deep_merge(base[k], v)
        else:
            base[k] = v


def resolve_project_alias(cwd: str, cfg: dict, current_md_path: Optional[Path] = None) -> str:
    aliases = cfg.get("project_aliases", {})
    for prefix, alias in aliases.items():
        if cwd and cwd.lower().startswith(prefix.lower()):
            return alias
    task_line = _read_current_md_task_line(current_md_path or _guess_current_md(cwd))
    if task_line:
        return task_line
    return "unknown-project"


def _guess_current_md(cwd: str) -> Optional[Path]:
    if not cwd:
        return None
    p = Path(cwd) / "docs" / "ai" / "CURRENT.md"
    return p if p.exists() else None


def _read_current_md_task_line(path: Optional[Path]) -> Optional[str]:
    """Reads ONLY the first 'Task:' line of CURRENT.md, read-only. Never
    reads/writes Stage, never touches README.md (NT4/NT8c)."""
    if not path:
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            for _ in range(20):  # Task: is always near the top; bound the scan
                line = f.readline()
                if not line:
                    break
                if line.startswith("Task:"):
                    return line[len("Task:"):].strip() or None
    except Exception:
        return None
    return None


def is_cwd_allowed(cwd: str, cfg: dict) -> bool:
    prefixes = cfg.get("project_filter", {}).get("allowed_cwd_prefixes", [])
    if not prefixes:
        return True  # no filter configured -- Phase A default is permissive for THIS repo's own use
    return any(cwd and cwd.lower().startswith(p.lower()) for p in prefixes)
