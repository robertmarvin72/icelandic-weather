# dev-notify — Windows + iPhone notifications for Ripley/CC (#498)

Setup/rollback reference required by NT1/NT8. This is a **Phase A**
(repo-only) document: everything it describes as "implemented" exists
in this repo and is covered by `python -m unittest discover -s
scripts/dev-notify -p "test_*.py"` today. Everything under "Phase B"
is **NOT_ACTIVATED** — it requires a separate, dated owner activation
record (same pattern as `ticket-493-endpoint-acquisition/
owner-authorisation.md`) naming the exact files, the exact hook
command, the backup path, and the number of permitted test
notifications, per NT1. `"Prompt approved"` alone never authorizes
anything in this document's "Phase B" section.

## Scripts (Phase A, already in this repo)

```
scripts/dev-notify/dev_notify/
  events.py              NotifyEvent / EventCategory / Agent / Surface
  config.py              defaults, local override file, project-alias resolution, cwd filter
  templates.py           fixed per-category text templates (NT4 allowlist)
  state.py               dedup (see dedup-rules.md), fail-open file lock
  windows_toast.py        native Windows toast via powershell.exe, balloon fallback
  secret_store.py        DPAPI (ctypes, no new package) — Phase B only, see below
  ntfy_client.py         POST-only ntfy publish, host allowlist, no redirects/retries
  dispatch.py            orchestration: dedup -> render -> PARALLEL toast + ntfy (A2/RC2), failure-isolated
  watchdog.py            hard-exit total-runtime cap (RN3) -- see dedup-rules-addendum-1.md and -2.md
  apply_config_patch.py  dry-run-by-default config patch tool (this doc's "Applying" section)
  wrapper_detect.py      shared fail-closed "is this our own cli_codex.py wrapper?" helper (RE1/CG2) -- used by apply_config_patch.py, cli_codex.py, and diagnostic_dry_run.py
  adapters/claude_adapter.py   Claude Code hook payload -> EventCategory (closed mapping)
  adapters/codex_adapter.py    Codex notify payload -> EventCategory (always COMPLETED; see Limitations)
  cli_claude.py          entrypoint to register as the Claude Code hook command
  cli_codex.py           entrypoint to register as the Codex `notify` command (chains the old one, refuses to chain to itself -- RE1/CG3)
scripts/dev-notify/diagnostic_dry_run.py   read-only owner-run diagnostic (AP4/RE2/CG1/CG6) -- note: lives one level up from dev_notify/, not inside it
scripts/dev-notify/tests/   full test suite (unittest, stdlib only)
```

Run the suite from the repo root:

```
python -m unittest discover -s scripts/dev-notify -p "test_*.py"
```

For a run whose final line cannot be misread as "all green" when
localhost-dependent ntfy tests are skipped (QA4, A2):

```
python scripts/dev-notify/run_tests_with_summary.py
```

No new pip packages anywhere in this feature (NT6). TOML parsing uses
the stdlib `tomllib` (Python 3.11+); Windows toast and DPAPI both shell
out to/ctypes into OS-native facilities.

## Event mapping chosen (see `audit-report.md` for the full matrix)

| Source | What fires `COMPLETED` | What fires `NEEDS_ATTENTION` | What fires `FAILED` | Never hooked |
|---|---|---|---|---|
| Claude Code (CLI) | `Stop`, `Notification(idle_prompt \| agent_completed)` | `Notification(permission_prompt \| agent_needs_input)` | `StopFailure` (known error codes; `unknown` falls back to a generic FAILED) | `PermissionRequest` (decision-bearing — never touched), `SessionEnd` (1.5s budget, not a real completion signal) |
| Codex CLI/app | every parseable `notify` invocation | never (payload schema is `UNKNOWN` — see Limitations) | never | `features.hooks` (disabled on the installed alpha; not used) |

## Enable / disable

- Global kill switch: the local override config's `"enabled": false` disables both Windows toast and ntfy for every event, cheaply, without touching hooks registration.
- Per-channel: `"windows_toast": {"enabled": false}` / `"ntfy": {"enabled": false}` independently.
- Full removal: delete the hook entries from `.claude/settings.local.json` (see "Rollback" below) and/or restore the Codex `notify` key via the same mechanism; the hook commands exit 0 silently if the files are ever deleted without updating the registration (malformed-input path).

## Local config and state locations (actual paths)

- Local override config (never committed, optional): `%LOCALAPPDATA%\dev-notify\config.json`, or wherever `DEV_NOTIFY_CONFIG_PATH` points.
- Dedup state: `%LOCALAPPDATA%\dev-notify\state.json` (+ a sibling `.lock` file during writes). User-only access by virtue of living under the user's own `%LOCALAPPDATA%`.
- Secret store (Phase B only, see below): a DPAPI-encrypted file, current-user scope, path chosen at Phase B activation time — never a plaintext token anywhere.

## Retained-state cleanup

Deleting `%LOCALAPPDATA%\dev-notify\state.json` (and its `.lock` if present) is always safe — `state.py` fails open and treats a missing file as "no prior events," so the very next event is simply never deduplicated against history that no longer exists. There is no other retained state in Phase A. `state.py`'s own pruning already bounds the file to 500 entries / 24h, so manual cleanup is never required for size reasons.

## Offline behavior

Windows toast delivery has no network dependency at all (`windows_toast.py` only shells out to local `powershell.exe`). An ntfy failure (DNS, timeout, HTTP error, disallowed host, no config) is caught in `dispatch.py` and never prevents the Windows toast, never raises, and never blocks or crashes the calling Claude Code/Codex process — this is asserted by `test_dispatch.py`'s own failure-isolation tests.

## Known limitations

- **`apply_codex`/`cli_codex.py` now refuse to chain to their own wrapper (RE1/CG2/CG3, 2026-11-12)** — a real, HIGH-severity bug found by independent sandbox review: a second `apply` on an already-patched `config.toml` previously read the CURRENT `notify` value (the wrapper itself) as "the old command to chain to" and persisted it, causing `cli_codex.py` to chain to itself indefinitely once triggered (reproduced: ~60–76 self-sustaining processes before a manual kill, in a sandbox). Fixed with a shared, fail-closed `is_wrapper_argv()` helper (basename/substring match, normalized across `\`/`/`/case/quoting) used by `apply_config_patch.py` (refuses the write, `reason: already_patched`), `cli_codex.py` (refuses to chain, but still dispatches once normally), and `diagnostic_dry_run.py` (reports `chain_points_to_wrapper`, read-only). A second, independent layer — a `DEV_NOTIFY_CHAIN_DEPTH` marker set only in the spawned child's own environment copy — makes a nested/already-chained invocation exit immediately without chaining or dispatching again. **`NOT_TESTED`**: an intermediary process that clears its own environment before re-executing would bypass the depth-marker layer; the path-based check is the primary defense, the depth marker is a second layer, not a complete guarantee on its own.
- **Windows toast/balloon and ntfy now run in parallel (A2/RC2)**, each inside its own sub-budget (`WINDOWS_SUBBUDGET_S=4.0s`, `NTFY_SUBBUDGET_S=2.0s` — see `dedup-rules-addendum-2.md`), so ntfy is no longer starved by waiting behind a slow Windows send (the original problem). **The overall 5s hard cap is still tight against a real ~4.5–5.5s Windows send** — parallelizing fixed the starvation, not the margin. A channel that doesn't finish within its own sub-budget is reported as `PENDING` in `dispatch()`'s own result, never asserted as delivered; the background thread for it is never killed (daemon thread, may keep running after `dispatch()` returns, bounded only by the outer watchdog). See "Named conflict" in `dedup-rules-addendum-1.md` (partially superseded) and `dedup-rules-addendum-2.md`'s own update to it.
- **Chaining to the previously-configured notify command now runs concurrently with `dispatch()` (A2/RC1)**, in its own thread, so a slow/hung old command no longer prevents the new notification path from even starting (the original bug: the old sequential order left a slow chain with no time for `dispatch()` to run at all under the 5s cap). The old command is never killed by this script (no subprocess `timeout=`) and gets `stdout=DEVNULL, stderr=DEVNULL` instead of captured pipes (which previously broke with `BrokenPipeError` when the watchdog hard-killed the parent mid-chain).
- **Process-survival claims (a PowerShell toast/balloon child, or a chained old-notify child, continuing to run after this script's own process is hard-killed) are `INFERRED` from general Windows process-model behavior, not `NOT_TESTED` via an actual Windows job-object experiment under real Claude/Codex hooks** (RC3/A2). The one thing genuinely tested is that a plain `subprocess.Popen` grandchild (spawned exactly the way `_chain_to_existing` spawns it) keeps running and finishes after this script's own process exits, on this machine, in isolation — not under a Claude Code- or Codex-managed job object, which could in principle kill descendants on parent exit. That combination stays `NOT_TESTED`, Phase B only.
- **Codex `notify` payload schema, previously `UNKNOWN`, is now `VERIFIED_FROM_CODE`** (RN5, 2026-11-12) — see `audit-report.md`'s RN5 correction section and `codex_adapter.py`'s module docstring for the exact commit/citation. The one remaining structural property (only one enum variant exists, so this mechanism can never signal `NEEDS_ATTENTION`/`FAILED`) is now a *confirmed* fact, not a conservative fallback for an unknown shape. Still `UNKNOWN`: whether the Codex **app** (vs. the CLI) invokes `notify` through this exact same code path, and whether a future Codex release changes this ABI.
- **Codex CLI vs. Codex desktop app vs. Claude Code VSCode extension are untested integration surfaces this round** (see `audit-report.md`'s Supported/Unsupported/Unknown matrix) — NT8 requires an owner-run, dated checklist (`VERIFIED_BY_OWNER`) before any of these can be called more than `IMPLEMENTED_NOT_ACTIVATED`.
- **A persistent `DEV_NOTIFY_CHAINED_NOTIFY_CMD` user-level env var (set via `setx`) is how `cli_codex.py` learns the previously-configured Codex `notify` command to chain to.** `setx` writes to the user's persistent environment. RN5 confirmed the exact reason a restart is required, directly from Codex's own source: `codex-rs/hooks/src/registry.rs` builds the environment passed to a spawned notify command from `std::env::vars_os()`, captured **once** when Codex's own hooks registry is constructed (effectively at Codex startup), then `command.env_clear()` + `command.envs(environment)` fully REPLACES the child's environment with that snapshot — it is never the live, current environment at invocation time. So Codex (CLI or app) must itself be started/restarted *after* the `setx` call for the new var to ever reach a spawned notify command; a shell opened before the `setx` call, or a long-running Codex process from before it, will not see it either. This is a real, inherent mechanism, not a bug in this feature; the Phase B activation record must say so and the owner should expect one restart (CLI: new terminal/process; app: full app restart, possibly requiring sign-out/sign-in depending on how the app itself launches) before app-level chaining is confirmed working.
- **ntfy.sh's free tier has no documented self-service topic ACL/reservation.** The owner must pick paid/self-host/Windows-only-for-now before any iPhone push can be anything but `NOT_ACTIVATED` (see NT2(d); this script never picks for them).
- **A DPAPI-encrypted secret file only protects the token at rest on this machine, for this Windows user account.** It is not a secret-manager with rotation/audit; the setup below documents this plainly rather than overstating it.
- **Windows toast needs an AppUserModelID (AUMID) to reliably render as a full toast for an unregistered script;** `windows_toast.py` falls back to a `NotifyIcon` balloon tip when the toast call fails, but which one actually renders on a given Windows build is a live fact that only an owner-run NT8 checklist can confirm, not something this document asserts in advance.
- **No duplicate notification per event/run** is handled by `state.py`'s dedup windows (see `dedup-rules.md`) — but a dedup window is a heuristic, not a hard guarantee; a sufficiently-delayed resend of the same logical event outside its window is treated as new, by design.

---

## Phase B — activation (NOT done by this document; reference only)

Everything below is **not activated**. It documents exactly what a
future, separate, dated owner activation record would authorize —
per NT1, `"Prompt approved"` on `#498`'s own prompt never covers this
section on its own.

### 1. Claude Code hook registration

Concrete reviewable diff: [`docs/ai/tasks/ticket-498/patches/claude-settings-local-patch.md`](../ai/tasks/ticket-498/patches/claude-settings-local-patch.md) — generated read-only from the real, secret-free `.claude/settings.local.json` via `apply_config_patch.py`.

To preview (always safe, never writes):

```
python scripts/dev-notify/dev_notify/apply_config_patch.py claude plan
```

To activate for real (Phase B only, after the owner's dated record names this exact command):

```
python scripts/dev-notify/dev_notify/apply_config_patch.py claude apply --apply --python-exe "<absolute path to python.exe>"
```

This backs up the current file first (`settings.local.json.bak-<UTC timestamp>`, with its own SHA-256 recorded in the tool's JSON output), merges in `hooks.Notification` / `hooks.Stop` / `hooks.StopFailure` (each one command handler calling `cli_claude.py`, 10s timeout) without touching the existing `permissions` block or any other hook, and re-validates the written file by re-parsing it. The Claude Code workspace-trust dialog (one-time, per the hooks docs) still gates these hooks firing in an interactive session in this folder — this tool cannot and does not bypass that.

Rollback:

```
python scripts/dev-notify/dev_notify/apply_config_patch.py claude rollback --apply --backup "<the .bak-... path printed by apply>"
```

### 2. Codex `notify` chaining

Concrete reviewable diff (synthetic fixture — the real file's existing `notify` value is never read into a tracked file): [`docs/ai/tasks/ticket-498/patches/codex-config-toml-patch.md`](../ai/tasks/ticket-498/patches/codex-config-toml-patch.md).

Preview against the real file (safe — read-only, and the tool itself always redacts the existing value before printing anything):

```
python scripts/dev-notify/dev_notify/apply_config_patch.py codex plan
```

Activate for real (Phase B only):

```
python scripts/dev-notify/dev_notify/apply_config_patch.py codex apply --apply --python-exe "<absolute path to python.exe>"
```

Unless `--skip-chain` is passed, this now (AP3 fix, 2026-11-12) runs
`setx DEV_NOTIFY_CHAINED_NOTIFY_CMD "<the real old notify argv,
JSON-encoded>"` FIRST, reads the value back from its real persisted
source (the current user's `Environment` registry key — never
`os.environ`, which a new process does not inherit a `setx` value
from an old parent's own environment) and hash-compares it against
what was asked to be persisted — **only once that succeeds** does it
back up and replace the top-level `notify = [...]` line in
`~/.codex/config.toml`, re-validating the TOML before and after. A
failed, missing, or silently-truncated `setx` (Windows' own
~1024-character value limit) now means **no config change and no
backup at all** — the previous ordering (write config, then an
unchecked `setx`) could leave the old Codex notify command silently
un-chained; this is what AP3 fixed. This specific real `setx`+registry
round trip is the one code path in this whole feature that is **not
exercised by any automated test** (running it for real during Phase A
testing would itself be an unauthorized machine-config write) — the
persist-then-verify-then-write *ordering and failure handling* are
fully fake-tested (`test_apply_config_patch.py`), but the real `setx`
call and real registry read are `NOT_TESTED` by design and become
`VERIFIED_BY_OWNER` only once the owner confirms, after one
logoff/logon cycle, that the old Codex-app "turn-ended" behavior still
works alongside the new notification.

Rollback:

```
python scripts/dev-notify/dev_notify/apply_config_patch.py codex rollback --apply --backup "<the .bak-... path printed by apply>"
```

(Rollback restores the config file only; it does not clear the `DEV_NOTIFY_CHAINED_NOTIFY_CMD` env var — run `setx DEV_NOTIFY_CHAINED_NOTIFY_CMD ""` manually, or delete it via System Properties, if full reversal is wanted.)

### 3. ntfy secret setup (without the secret)

1. Owner decides, explicitly, one of: (a) a paid/reserved ntfy.sh topic, (b) self-hosting (out of scope this round), or (c) staying Windows-toast-only for now with iPhone `NOT_ACTIVATED`. This script picks none of these automatically (NT2d).
2. If (a): create a **new** topic name — never the one already exposed in GitHub `#498` — and generate a token scoped to that account. The token grants full account access on ntfy.sh (NT2e); a dedicated account/token for this purpose only is recommended.
3. Store the token locally via `secret_store.write_secret_file(path, token.encode("utf-8"))` (DPAPI, current-user scope, no new package): the token is written once, encrypted at rest, and is never placed in Git, argv, a URL, `CURRENT.md`, chat, or any log. `secret_store.py`'s own read/write functions are implemented and unit-tested against a fake/tempfile path in Phase A; a real secret-file write/read on this machine is itself a Phase B action — this owner-run step is the one place that real round-trip actually happens, and it should produce only a boolean "it worked" confirmation, never print the token.
4. Set `ntfy.enabled: true`, `ntfy.host`, `ntfy.topic` (the new, non-exposed name), and `ntfy.token_secret_path` (the path from step 3) in the local override config file. As of this round (RN4), `dispatch.py` actually reads that path via `secret_store.read_secret_file()` and sends the token in the `Authorization` header on every real publish — this was NOT true of the original #498 round (the config had a `token_present` flag that nothing read); that gap is now closed and covered by `test_dispatch.py`'s own RN4 tests (with a fake secret reader, never a real DPAPI call, in Phase A). If the secret read ever fails at runtime (corrupted file, wrong user, etc.), `dispatch()` skips ntfy for that turn with reason `ntfy_token_secret_read_failed` — it never falls back to sending unauthenticated, and Windows notification is unaffected either way.
5. First live test on the new topic is an **unauthenticated publish expected to be rejected** (HTTP status recorded as-is) — proving the topic is actually access-controlled — *before* any authenticated test is sent; this counts toward the activation record's own permitted-call budget (NT2c).
