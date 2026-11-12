# Concrete dry-run patch preview — `~/.codex/config.toml` (NT1/NT7)

**This preview runs against a SYNTHETIC fixture, not the real
`~/.codex/config.toml`.** The real file's existing `notify` value is
app-internal and treated as sensitive (see audit-report.md) and is
never read into any tracked file — not even redacted — by this task.
The fixture below is structurally representative only (same shape:
top-level `notify = [...]`, a `[projects.'...']` table):

```toml
model = "gpt-5"
notify = ["<SYNTHETIC_PLACEHOLDER_NOT_THE_REAL_PATH>", "turn-ended"]

[projects.'<SYNTHETIC_REPO_PATH>']
trust_level = "trusted"
```

Resulting plan (`dev_notify.apply_config_patch.plan_codex()`, read-only,
against the fixture copy above — nothing on the real machine touched):

- before_sha256 (of the fixture, not the real file): `879294287712e3fd807b2ba0c7b64447147517002478011bc9d91e701e7a9c51`
- after_preview_sha256: `ec72d0dfb965ad9467a5d579e1b4fcac1d3625b1e000b2fac4b674277a156956`
- no_op: `False`
- chain_setx_command (redacted): `setx DEV_NOTIFY_CHAINED_NOTIFY_CMD "["<EXISTING_NOTIFY_COMMAND>"]"`

```diff
--- <HOME>/.codex/config.toml
+++ <HOME>/.codex/config.toml (planned)
@@ -1,5 +1,5 @@
 model = "gpt-5"
-notify = ["<EXISTING_NOTIFY_COMMAND>"]
+notify = ["<PYTHON_EXE>", "<REPO_ROOT>/scripts/dev-notify/dev_notify/cli_codex.py"]
 
 [projects.'<SYNTHETIC_REPO_PATH>']
 trust_level = "trusted"
```

Against the REAL file, the old `notify` line is always shown redacted
as `<EXISTING_NOTIFY_COMMAND>` (never its real text) — see
`test_apply_config_patch.py::test_plan_redacts_real_notify_value_everywhere`
for the automated proof of that rule. `<REPO_ROOT>/scripts/dev-notify/dev_notify/cli_codex.py` must be
replaced with the real absolute repo path on the owner's machine
during B activation (never committed here, since it embeds the local
username).

AP3 (2026-11-12) fixed a real ordering bug: activating this patch for
real now runs `setx DEV_NOTIFY_CHAINED_NOTIFY_CMD "<the real old notify argv,
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
