"""Generates the two CONCRETE patch-preview files NT1 requires
('concrete patch-skrár fyrir hverja stillingu, með leyndarmál rituð
út'). Read-only against the real repo: reads the actual (secret-free)
`.claude/settings.local.json`, but NEVER touches the real
`~/.codex/config.toml` -- that file's existing `notify` value is
treated as sensitive per audit-report.md, so the Codex preview is
generated against a clearly-labelled SYNTHETIC fixture instead,
structurally representative of the real file's shape only.

Run from repo root: python docs/ai/tasks/ticket-498/samples/generate_patch_previews.py
"""
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(REPO_ROOT / "scripts" / "dev-notify"))
from dev_notify import apply_config_patch as patch  # noqa: E402

OUT_DIR = Path(__file__).resolve().parent.parent / "patches"

CLAUDE_CLI_CMD_PATH = "${CLAUDE_PROJECT_DIR}/scripts/dev-notify/dev_notify/cli_claude.py"
CODEX_CLI_CMD_PATH = "<REPO_ROOT>/scripts/dev-notify/dev_notify/cli_codex.py"
PYTHON_EXE_PLACEHOLDER = "<PYTHON_EXE>"  # owner fills in `python`/an absolute interpreter path during B activation

SYNTHETIC_CODEX_FIXTURE = '''model = "gpt-5"
notify = ["<SYNTHETIC_PLACEHOLDER_NOT_THE_REAL_PATH>", "turn-ended"]

[projects.'<SYNTHETIC_REPO_PATH>']
trust_level = "trusted"
'''


def write_claude_preview():
    real_path = REPO_ROOT / ".claude" / "settings.local.json"
    plan = patch.plan_claude(real_path, PYTHON_EXE_PLACEHOLDER, CLAUDE_CLI_CMD_PATH, display_path=".claude/settings.local.json")
    text = f"""# Concrete dry-run patch preview — `.claude/settings.local.json` (NT1/NT7)

Generated {__import__('datetime').datetime.now(__import__('datetime').timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} by
`generate_patch_previews.py`, calling `dev_notify.apply_config_patch.plan_claude()`
read-only against the REAL current `.claude/settings.local.json` (safe:
contains only `gh` CLI permissions, no secrets, already confirmed
gitignored — see audit-report.md). This is a **plan only** — nothing
was written. `before_sha256` is the real current file's hash; re-run
the generator to confirm it still matches before using this preview.

Activating this patch for real (Phase B) requires `apply_config_patch.py
claude apply --apply`, which itself still only runs with the owner's
separate dated activation record per NT1 — this file alone authorizes
nothing.

`{PYTHON_EXE_PLACEHOLDER}` must be replaced with the real Python
interpreter (e.g. an absolute path, since hook commands don't
necessarily inherit a dev shell's PATH) during that B activation step.

- before_sha256: `{plan['before_sha256']}`
- after_preview_sha256: `{plan['after_preview_sha256']}`
- no_op: `{plan['no_op']}`

```diff
{plan['diff']}```
"""
    out = OUT_DIR / "claude-settings-local-patch.md"
    out.write_text(text, encoding="utf-8")
    return out


def write_codex_preview():
    with tempfile.TemporaryDirectory(prefix="dev-notify-codex-preview-") as tmp:
        fixture_path = Path(tmp) / "config.toml"
        fixture_path.write_text(SYNTHETIC_CODEX_FIXTURE, encoding="utf-8")
        plan = patch.plan_codex(fixture_path, PYTHON_EXE_PLACEHOLDER, CODEX_CLI_CMD_PATH, display_path="<HOME>/.codex/config.toml")
    text = f"""# Concrete dry-run patch preview — `~/.codex/config.toml` (NT1/NT7)

**This preview runs against a SYNTHETIC fixture, not the real
`~/.codex/config.toml`.** The real file's existing `notify` value is
app-internal and treated as sensitive (see audit-report.md) and is
never read into any tracked file — not even redacted — by this task.
The fixture below is structurally representative only (same shape:
top-level `notify = [...]`, a `[projects.'...']` table):

```toml
{SYNTHETIC_CODEX_FIXTURE}```

Resulting plan (`dev_notify.apply_config_patch.plan_codex()`, read-only,
against the fixture copy above — nothing on the real machine touched):

- before_sha256 (of the fixture, not the real file): `{plan['before_sha256']}`
- after_preview_sha256: `{plan['after_preview_sha256']}`
- no_op: `{plan['no_op']}`
- chain_setx_command (redacted): `{plan['chain_setx_command_redacted']}`

```diff
{plan['diff']}```

Against the REAL file, the old `notify` line is always shown redacted
as `{patch.REDACTED_NOTIFY_PLACEHOLDER}` (never its real text) — see
`test_apply_config_patch.py::test_plan_redacts_real_notify_value_everywhere`
for the automated proof of that rule. `{CODEX_CLI_CMD_PATH}` must be
replaced with the real absolute repo path on the owner's machine
during B activation (never committed here, since it embeds the local
username).

AP3 (2026-11-12) fixed a real ordering bug: activating this patch for
real now runs `setx {patch.CHAIN_ENV_VAR} "<the real old notify argv,
JSON-encoded>"` and reads the value BACK from its real persisted
source (the current user's `Environment` registry key, never
`os.environ`) FIRST — only once that read-back hash-matches what was
asked to be persisted does `config.toml` get written at all. A failed,
missing, or silently-truncated `setx` (Windows' own ~1024-character
value limit) now means NO config change and no backup is created —
the old Codex notify command can never fall out silently, which the
prior ordering (config write, then an unchecked `setx`) did not
guarantee. This happens inside `apply_codex(..., apply=True,
persist_chain=..., read_back_chain=...)`, itself gated by `--apply`
and the separate B activation record.
"""
    out = OUT_DIR / "codex-config-toml-patch.md"
    out.write_text(text, encoding="utf-8")
    return out


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    p1 = write_claude_preview()
    p2 = write_codex_preview()
    print(f"wrote {p1}")
    print(f"wrote {p2}")
