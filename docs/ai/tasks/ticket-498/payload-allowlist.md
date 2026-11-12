# #498 — Payload field allowlist and origin rules (NT4)

2026-11-11, CC. Written and hashed (`payload-allowlist.sha256`)
BEFORE any test was written. Every field that can ever reach a
Windows toast or an ntfy push is listed here with its exact origin —
nothing else is ever included, and nothing here is derived from raw
hook/notify payload content beyond the narrow, named exceptions below.

## Allowlisted output fields and their origin

| Field | Origin | Notes |
|---|---|---|
| `agent` | **The adapter's own identity constant.** `claude_adapter.py` always emits `CC`; `codex_adapter.py` always emits `Ripley`. **Never read from payload.** | Matches the approved prompt's own "Codex-adapter → Ripley, Claude-adapter → CC." |
| `event` | **A closed Python enum** (`EventCategory.COMPLETED` / `NEEDS_ATTENTION` / `FAILED`), set by the adapter's own fixed mapping table (see `audit-report.md`) from `hook_event_name`/`notification_type`/`error`. **Never the raw event string itself.** | A `notification_type` not in the closed mapping (e.g. `auth_success`, `elicitation_*`, `quota_*`, `plugin_notification`) maps to **no event at all** — nothing is sent. |
| `issue_number` | **A static constant in the notifier's own local config file**, set once by Ripley/the owner (default: absent/`None`). | Never derived from any payload, branch name, or path. |
| `project_alias` | **Either** a static alias table in the notifier's own local config (keyed by `cwd`), **or**, if no alias matches, a read-only parse of the **`Task:` line of `docs/ai/CURRENT.md`** (string after `Task:`, trimmed) if that file exists under the invoking `cwd`. **No other field of `CURRENT.md` is ever read**, `Stage` is never read or written by this script, and `docs/ai/README.md` is never touched. | If neither source resolves, `project_alias` is the literal string `unknown-project` — never a raw path, branch name, or transcript excerpt. |
| `status_text` | **A fixed template string per `event_category`**, filled in only with `agent`, `project_alias`, and (for `FAILED`) the **closed `error` enum value** from `StopFailure` (e.g. `rate_limit`) — never `error_details`, never `last_assistant_message`, never any other payload field. | Example templates: `"{agent} finished a turn — {project_alias}"`, `"{agent} needs your attention — {project_alias}"`, `"{agent} turn failed ({error_code}) — {project_alias}"`. |
| `click_action` | **A local-only path or command from the notifier's own config**, used only if the target surface demonstrably supports a click action; otherwise omitted. **Never executes or approves anything** — opening-only, and only to a pre-approved local destination (e.g. the project folder), never a URL built from payload content. | |

## What is never sent, under any circumstance

`prompt`, `last_assistant_message` (or any assistant/user text),
`transcript_path` contents, `tool_input` (of any shape), any shell
command string, log contents, any filesystem path containing a
username or other PII, `error_details`, any token/secret, or any raw
repository file content. The notifier's own code never serialises the
full input payload anywhere — not to the toast, not to the ntfy push,
not to its own state file, not to stdout/stderr, and not to any log
it writes.

## Stdin handling

- Read with a hard size cap (**1 MiB**); anything larger is truncated
  before `json.loads` is attempted (so a runaway payload can never
  make the process hold unbounded memory).
- **Never** interpolated into a shell command string and **never**
  run with `shell=True` anywhere in this codebase — every subprocess
  call (the chained Codex `notify` command, in particular) uses an
  argv list.
- Malformed/non-JSON input → **silent exit 0**, with a local-only
  counter increment in `state.json` (`malformed_input_count`) — never
  surfaced to stdout/stderr/log, never raised as an exception that
  could affect exit code 2 on `Stop`.
- Nothing read from stdin is ever itself written to stdout, stderr,
  the state file, or any log file — only the derived, allowlisted
  fields above ever leave the process.

## Canary testing methodology (NT4)

Tests construct a fake payload containing a **fixed canary token**
(e.g. `CANARY-7f3a9c21-DO-NOT-LEAK`) and a **fixed canary phrase**
(e.g. `"the quick canary jumps over"`) planted in every field NOT on
the allowlist above — specifically `last_assistant_message`, `cwd`
(a synthetic path containing the canary), and a synthetic `tool_input`
object. The test then asserts the canary token/phrase appears in
**none** of: the rendered Windows-toast text, the rendered ntfy body,
the written `state.json`, any log file the notifier writes, the
`argv` list of the chained Codex `notify` subprocess call, or the
constructed ntfy HTTP request (headers or body). A test that finds
the canary anywhere in that list fails loudly — this is the single
most important negative-test category in the whole suite.
