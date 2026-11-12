# #498 — Audit report: hook/notify surfaces and event mapping (NT3)

2026-11-11, CC. Written before any code in `scripts/dev-notify/` was
implemented, per NT3's own "kortlagt fyrir virkjun" instruction and
the approved prompt's "Lestur og audit áður en skrifað er" section.
Covers the previously-unread portions of the primary docs (NT3e) and
gives the closed Supported/Unsupported/Unknown mapping NT3 requires.

## Local, read-only facts (no secrets reproduced)

| Surface | Version/location | Fact |
|---|---|---|
| Claude Code | 2.1.195 (read-only, `claude --version`-equivalent check by Ripley) | `.claude/settings.local.json` exists, is gitignored (`git check-ignore` confirms), contains only `{"permissions": {"allow": [...]}}` — **no hooks configured today**. No tracked `.claude/settings.json` exists (`git ls-files .claude/` returns nothing). |
| Codex CLI/app | codex-cli 0.167.0-alpha.3.2 (Ripley, read-only) | `~/.codex/config.toml` (92 lines) has a top-level `notify` key already set, pointing at the Codex **desktop app's own internal** executable (`...OpenAI.Codex_<version>...\app\resources\cua_node\bin\node_modules\@oai\sky\bin\windows\codex-computer-use.exe`) invoked with a fixed second argument. This is an **app-internal "turn-ended" signal for its own UI**, not a user-authored notification command — the exact path is not reproduced in any tracked file (it embeds the installed app's own version string); redacted as `<EXISTING_NOTIFY_COMMAND>` throughout this task's own artifacts, per NT1's "placeholders/ritskoðaðar slóðir." No `[hooks]`/`features.hooks` section is present — hooks are not enabled today. The config also shows this repo's own path under `[projects.'c:\users\notandi\forritun\icelandic-weather']` with a `trust_level` key (value not reproduced here). |
| Windows | User session, interactive | Native toast requires an AppUserModelID (AUMID) for a non-packaged script to show as a full toast reliably; unregistered apps often fall back to showing under "Windows PowerShell" or similar, or may not render at all depending on Windows build. Must be verified live (NT6/NT8), with a documented balloon fallback. |

These are local observations only — they are not proof of what hooks
actually execute inside the Codex **app** UI or inside Claude Code
**VSCode**, which NT3/NT8 require testing separately.

## Primary docs read (NT3e — completing the previously-unread portions)

| Page | URL | Read 2026-11-11 |
|---|---|---|
| Claude Code hooks | `https://code.claude.com/docs/en/hooks` | Full page (3 fetches, offsets 0/100000/200000 of 293,021 chars) |
| Codex config reference | `https://learn.chatgpt.com/docs/config-file/config-reference` | First 100,000 of 164,630 chars (covers `notify`, `hooks`, `features.hooks`) |
| ntfy publish | `https://docs.ntfy.sh/publish/` | First 200,000 of 205,885 chars (covers auth, webhook-GET, size limits) |
| ntfy config | `https://docs.ntfy.sh/config/` | First 100,000 of 161,476 chars (covers ACL, `auth-default-access`, tiers) |

### Claude Code hooks — confirmed facts, with exact field names

- **Exit-code/stdout contract (NT3a):** `Stop` exit code 2 "Prevents Claude from stopping, continues the conversation" — our Notification-family hooks must **never** return exit 2. `Notification` hooks: "can't block or modify notifications," exit code and stderr "are ignored." `PermissionRequest`: "Exit code 2 isn't honored for this event and the permission flow proceeds unchanged. Deny through the `decision` object" — **any stdout JSON on this event is a live decision channel**, confirming NT3's own warning. `StopFailure`: "Claude Code ignores the hook's output and exit code, apart from `terminalSequence`."
- **Timeouts (NT3b):** default **600 s** for `command`/`http`/`mcp_tool` hooks generally, lowered to **30 s** on `UserPromptSubmit`/`PreModelSwitch`/`PostModelSwitch`, **10 s** for `MessageDisplay`. `SessionEnd` hooks share a **1.5 s** budget total (raised to the per-hook `timeout` if explicitly set, capped at 60 s). `async: true` "runs in the background without blocking," and "Claude Code doesn't enforce timeout on a command hook you run with `async: true`."
- **`Stop` input schema:** `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, **`stop_hook_active`** (bool — true when already continuing from a prior Stop-hook block), `last_assistant_message`, `background_tasks[]`, `session_crons[]`. **No `prompt_id`/turn-id field is present** — confirms NT5's own fallback ("turn-/`prompt_id` ef payload gefur, annars tímabúnt") is necessary for `Stop`, not optional. Claude Code applies "an 8-consecutive-continuation cap" on `decision: "block"` chains — irrelevant here since our hook never blocks.
- **`SessionEnd` input schema:** `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `reason` ∈ {`clear`, `resume`, `logout`, `prompt_input_exit`, `other`} (`bypass_permissions_disabled` removed in 2.1.234). **Decision: not hooked at all** (see "Design decisions," below) — the 1.5 s budget and the explicit "don't call every SessionEnd a completion" instruction both argue against it.
- **`Notification` input schema:** `message`, optional `title`, **`notification_type`** (confirmed exact field name) ∈ {`permission_prompt`, `idle_prompt`, `auth_success`, `auth_storage_failure`, `elicitation_dialog`, `elicitation_url_dialog`, `elicitation_complete`, `elicitation_response`, `agent_needs_input`, `agent_completed`, `quota_auto_resume_fired`, `quota_auto_resume_stale`, `quota_auto_resume_disabled`, `plugin_notification`}. Per-type firing conditions (verbatim): `permission_prompt` — "Claude needs you to approve a tool use or a sandboxed command's network request, and the prompt has waited about six seconds"; `idle_prompt` — "Claude finished responding about 60 seconds ago and you haven't typed since"; `agent_needs_input` — "A background session starts waiting on your input while agent view is open in a terminal"; `agent_completed` — "A background session finishes or fails. Fires only while agent view is open in a terminal."
- **`PermissionRequest` output schema:** `{"hookSpecificOutput": {"hookEventName": "PermissionRequest", "decision": {"behavior": "allow"|"deny", "updatedInput": ..., "updatedPermissions": ..., "message": ..., "interrupt": ...}}}`. "A hook that exits 2 without a `decision` object leaves the permission flow unchanged, and its stderr is discarded."
- **`StopFailure` input schema:** `session_id`, `transcript_path`, `cwd`, `hook_event_name`, **`error`** ∈ {`rate_limit`, `overloaded`, `authentication_failed`, `oauth_org_not_allowed`, `account_on_hold`, `billing_error`, `invalid_request`, `model_not_found`, `server_error`, `max_output_tokens`, `cloud_credential_error` (≥2.1.267), `unknown`}, optional `error_details`, optional `last_assistant_message` (here, "the API error string itself," e.g. `"API Error: Rate limit reached"` — **not** Claude's own text as on `Stop`). "StopFailure hooks have no decision control. They run for notification and logging purposes only." **This is the one real, short, hook-confirmed FAILED signal** — exactly NT3(c)'s own "StopFailure er skjalfest raunverulegt FAILED-event."
- **Workspace trust (NT3, the gap the prior round left unread):** "Claude Code checks workspace trust before it runs any hook from a settings file... **Interactive session**: Claude Code holds back hooks from every settings file, including your own `~/.claude/settings.json`, until you accept the workspace trust dialog for the folder... **`-p` or SDK session**: Claude Code never shows the dialog and treats the folder as trusted." Also: "Command hooks execute shell commands with your full user permissions. They can modify, delete, or access any files your user account can access." **Consequence for #498:** our hooks will not fire in an *interactive* session in an untrusted folder until the user accepts the trust dialog once — this is a one-time, user-visible Claude Code UI gate, not something `#498`'s own setup can or should bypass.
- **Config locations and merge rule:** `~/.claude/settings.json` (user, all projects, not shareable), `.claude/settings.json` (project, shareable/committable), `.claude/settings.local.json` (project, not shareable, gitignored when Claude Code itself writes to it), managed policy settings, plugin `hooks/hooks.json`, skill/subagent frontmatter. "Hook entries merge across settings levels rather than replacing each other." **This confirms NT7's instruction is correct and necessary**: our patch must live in `.claude/settings.local.json` (machine-local, never committed), never `.claude/settings.json`.

### Codex — confirmed facts, with exact field names

- `notify`: type `array<string>`, "Command invoked for notifications; receives a JSON payload from Codex." **The exact JSON field names of that payload are not documented on this page, and are not read from memory per the approved prompt's own instruction ("ekki útfæra úr minni").** This is recorded as a genuine `UNKNOWN`, not guessed — see "Design decisions" below for how the adapter handles this honestly.
- `features.hooks` (alias `features.codex_hooks`, deprecated): boolean, "Enable lifecycle hooks loaded from `hooks.json` or inline `[hooks]` config" — **disabled by default and not present in the installed config**, so Codex **hooks** (as opposed to `notify`) are **UNTESTED/UNKNOWN on this alpha** and are not used by #498's own implementation; `notify` alone is used, since it is already active and confirmed present.
- Documented `hooks.<Event>` names (schema-only, not confirmed to run on this alpha): `PreModelRequest`, `PostModelRequest`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`, `PostCompact`, `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, `UserPromptSubmit`, `Stop`, `Interrupt`. "Command and MCP tool hooks are supported while prompt and agent hook handlers are parsed but skipped." `commandWindows` (TOML: `command_windows`) is "a Windows-only command override for command hooks."
- Cloud/app caveat (verbatim): "Existing supported hooks still apply to local-only Work and Codex threads where orchestration and execution are both local," while with cloud orchestration "Command, local-config, and plugin hooks are unsupported." The page does **not** state whether `notify` specifically runs inside the Codex **desktop app** UI (as opposed to the CLI) — this remains `UNKNOWN` and must be tested per-surface (NT8), not assumed (NT3's own "ekki álykta að user-level notify keyri í appi").
- Project-local `.codex/config.toml` "is hunsað for `notify`" (ignored) — confirmed by the config-reference page's own instruction to "put provider, notification, and telemetry keys in user-level config." This is why #498's own Codex integration is necessarily **user-level only** (NT7), with its own `cwd`/project filter implemented in the adapter itself (Codex has no native per-project notify scoping).

### ntfy — confirmed facts

- Publish methods: "Publishing messages can be done via HTTP PUT/POST or via the ntfy CLI." A **separate** `GET`-based convenience exists: "To send messages via HTTP GET, simply call the `/publish` endpoint (or its aliases `/send` and `/trigger`)... Without any arguments, this will send the message `triggered` to the topic." **#498's own client must never use GET, `/send`, or `/trigger`** — POST to `/<topic>` only, per NT2(a).
- Message size: "If a message is greater than the maximum message size (4,096 bytes)... the ntfy server will automatically detect the mime type and size, and send the message as an attachment file," with "max attachment size is 15 MB (with 100 MB total per visitor)." Our own payload is capped well under 4,096 bytes by construction (fixed templates, no transcript/content) — this is a design margin, not a limit we rely on.
- Auth: Basic auth with username+password, or an access token via "an empty username" (the password is then "treated... as an access token") or `Authorization: Bearer tk_...`. **The exact HTTP status code for a denied/unauthorized publish is not stated on this page** — recorded as `UNKNOWN`, to be observed empirically (and ledgered) only in Phase B's own first authenticated-vs-unauthenticated test pair (NT2c), never asserted in advance.
- ACL / reserved topics: on a self-hosted server, `auth-default-access` controls the fallback (`read-write` default, or `read-only`/`write-only`/`deny-all`); for a *private* instance "you'll want to set this to `deny-all`." Topic reservation is mentioned only under paid tiers: "tiers... make it possible for users to reserve topics." **The page never states that the free, publicly-hosted `ntfy.sh` service lets an account reserve a topic or attach a per-topic ACL without a paid plan** — this directly confirms NT2(d)'s own premise (owner must choose paid/self-host/Windows-only) without this audit asserting which the owner will pick.

## Supported / Unsupported / Unknown matrix (per surface × event)

| Surface | Event | Status | Basis |
|---|---|---|---|
| Claude Code (CLI, interactive, trusted folder) | `Notification` (all types) | **Supported** | Hooks docs, confirmed field names/semantics above |
| Claude Code (CLI) | `Stop` | **Supported** | As above; never returns exit 2 or a block decision |
| Claude Code (CLI) | `StopFailure` | **Supported** | As above; output/exit ignored by Claude Code, used only for our own side effect |
| Claude Code (CLI) | `SessionEnd` | **Not integrated (deliberate)** | 1.5 s budget, explicit instruction not to treat every SessionEnd as completion; see "Design decisions" |
| Claude Code (CLI) | `PermissionRequest` | **Not integrated (deliberate)** | Decision-bearing event; `Notification`/`permission_prompt` already covers the attention signal with zero risk to the approval flow |
| Claude Code (VSCode extension) | `Notification`/`Stop`/`StopFailure` | **UNKNOWN — requires separate test (NT8)** | Settings-file hooks are a CLI-documented mechanism; this round does not assume VSCode runs them identically |
| Claude Code (Desktop, Jonesy's own v0.1 note) | any | **Out of scope this round** | Explicitly excluded by Ripley's own framing in the approved prompt |
| Codex CLI | `notify` | **Supported (already active for the app; CLI firing UNCONFIRMED until Phase B)** | Config key present and documented; exact CLI-vs-app firing behaviour is `UNKNOWN` per the docs' own silence |
| Codex desktop app | `notify` | **Likely supported (already wired to the app's own internal signal)**, payload shape `UNKNOWN` | See local audit fact above |
| Codex CLI/app | `hooks.*` (Stop/PermissionRequest/Interrupt/SessionEnd) | **UNKNOWN/UNTESTED** | `features.hooks` is off; enabling it is itself a Phase B config change this round does not make without separate owner sign-off beyond the activation record |
| ntfy.sh | publish (POST, unauthenticated open topic) | **Supported, but explicitly not used for the exposed GitHub-#498 topic name (NT2b)** | Already-confirmed working form from retained precedent in a different task |
| ntfy.sh | publish (POST, access-controlled/reserved topic) | **NOT_ACTIVATED pending owner ACL choice (NT2d)** | Free tier does not document self-service reservation |
| Windows | native toast (no new package) | **UNKNOWN pending live test (NT6/NT8)** | AUMID requirement for unpackaged scripts; must be observed, not assumed |

`UNSUPPORTED` is never "solved" by polling transcripts, screens, or logs (NT3's own explicit instruction) — where a surface is `UNKNOWN`/`UNSUPPORTED`, the audit states that precisely and stops there for this round.

## RN5 correction (2026-11-12, CC) — appended, original matrix above left intact

The original matrix row for Codex's `notify` payload shape ("UNKNOWN")
and the design decision below treating delivery as stdin-based were
**both based on unverified memory, never actually read from primary
source this round** — flagged by independent sandbox review
(`result-review.md` RN5) as an assumption the approved prompt's own
"ekki útfæra úr minni" instruction required to be verified, not
guessed. This round read the primary Codex source (read-only GET,
`raw.githubusercontent.com/openai/codex`, pinned to commit
`b4b58be951a4fcbbda5cf50d48dcd7d4d8a41533` / tag
`rust-v0.167.0-alpha.3.2` — the **exact installed local version**,
confirmed by an identical blob SHA at both that commit and `main`
HEAD) and found the **opposite** of the original assumption:

| Item | Original round | RN5 correction |
|---|---|---|
| Delivery mechanism | Assumed stdin-only, argv unused | **VERIFIED_FROM_CODE**: the JSON is appended as the FINAL argv argument (`command.arg(notify_payload)`, `codex-rs/hooks/src/legacy_notify.rs`); **stdin is explicitly closed** (`Stdio::null()`) |
| Payload shape | UNKNOWN | **VERIFIED_FROM_CODE**: `UserNotification` enum, exactly one variant `AgentTurnComplete`, fields `type`, `thread-id`, `turn-id`, `cwd`, `client` (optional), `input-messages`, `last-assistant-message` (optional) |
| Can the ABI ever signal NEEDS_ATTENTION/FAILED? | Unknown, conservatively assumed no | **VERIFIED_FROM_CODE, structurally no**: only one enum variant exists, fired only from `HookEvent::AfterAgent` |
| Spawned child's environment | Not examined | **VERIFIED_FROM_CODE**: `command.env_clear()` + `command.envs(environment)`, where `environment` is `std::env::vars_os()` captured once at Codex's own hooks-registry construction — a full replacement snapshot, not the live environment at invocation time (explains why `DEV_NOTIFY_CHAINED_NOTIFY_CMD` needs a Codex restart, not just `setx`) |

`cli_codex.py` and `dev_notify/adapters/codex_adapter.py` were rewritten
to match (RN5 in `cc-report.md` has the full disposition). Boundary
this still does NOT cover (unchanged from the original round): whether
the Codex **app** invokes `notify` through this exact same code path,
and whether the alpha series this installed version belongs to will
change this ABI in a later release — both remain `UNKNOWN`, to be
confirmed per-surface only by an owner-run Phase B test, never assumed.

## Design decisions following from this audit

1. **No `PermissionRequest` hook is registered, ever.** `Notification`'s own `permission_prompt`/`agent_needs_input` types give the same user-facing signal with zero ability to affect the real approval decision — the single highest-risk hook type in the whole mapping is avoided entirely by construction, not by careful coding.
2. **No `SessionEnd` hook is registered.** Its 1.5 s budget and the task's own explicit warning against treating session-end as completion make it a poor, risky fit; its only even-plausible use (cleanup logging) isn't part of #498's own goal.
3. **Codex integration uses `notify` only, not `hooks`.** `notify` already exists and is confirmed present; `hooks` is undocumented-in-practice on this alpha (`features.hooks` disabled) and enabling it would itself be a separate, larger Phase-B config change this round does not make.
4. **[SUPERSEDED by the RN5 correction above, 2026-11-12 — left as written for the historical record.]** The Codex `notify` JSON payload's exact field names are treated as `UNKNOWN`, not guessed from memory or from the CLI's own public reputation. The adapter parses it only as generic JSON (malformed → silent, counted, exit 0) and classifies every successful invocation as a single fixed `COMPLETED` category — it does not attempt to distinguish sub-cases it cannot verify the schema for. This can be refined in a future round once Phase B's own first live firing is actually observed and ledgered. *(As of RN5: the field names and delivery mechanism are now `VERIFIED_FROM_CODE`, not `UNKNOWN` — see the correction section above. `codex_adapter.classify()` now parses the confirmed `agent-turn-complete` shape and uses `turn-id` as a real dedup discriminator, while still falling back to this same conservative COMPLETED-only behavior for any unrecognized shape.)*
5. **The existing Codex `notify` command is preserved and always called first** (chained), with its own exact argv/path never reproduced in a tracked file. A failure in #498's own new logic must never prevent that call (NT7).
