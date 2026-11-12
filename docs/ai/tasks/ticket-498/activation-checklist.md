# #498 — Phase B owner-run activation checklist

Not executed by CC. Every step below is **owner-run**: CC does not
run any command in this file against a real path, does not activate
anything, and does not mark any result. `VERIFIED_BY_OWNER` is only
ever written by the owner (or Ripley, quoting the owner), with a
date, after a real answer — never inferred, never polled for.

Each step has: an exact command, how to read the result, and a
PASS/FAIL/UNKNOWN criterion **registered before the step is run**, so
no criterion is invented after seeing the outcome. `FAIL` → stop, roll
back that surface (command given), and open a new scoped prompt — do
not retry past the stated max attempts/time/bytes for that step, and
do not run a destructive command just to trigger a permission prompt
(AP4's own explicit prohibition).

Run steps **in order**; stop and roll back the current surface before
continuing if a step fails. The owner may stop after any surface's own
activation — partial activation (e.g. Windows-only, Claude CLI only)
is a valid, real outcome, not a failure to reach the end of this list.

---

## AC-1 — Claude Code CLI hook registration (dry-run first)

```
python scripts/dev-notify/dev_notify/apply_config_patch.py claude plan
```
**Read**: the printed diff. Confirm it only ADDS `hooks.Notification`/
`Stop`/`StopFailure` entries and does not remove/alter the existing
`permissions` block.
**Criterion**: `PASS` if the diff is additive-only and `no_op` is
`false`; `FAIL` (stop here, nothing yet to roll back) if the diff
touches anything else.

```
python scripts/dev-notify/dev_notify/apply_config_patch.py claude apply --apply --python-exe "<ABSOLUTE PATH TO python.exe>"
```
**Read**: the printed JSON's `applied` (must be `true`) and
`backup_path` (record it — needed for rollback).
**Criterion**: `PASS` if `applied: true`; `FAIL` → the tool itself
refuses to write on any validation failure, so a `FAIL` here means no
change was made — re-run `plan` to diagnose, no rollback needed yet.

**Rollback** (any later surface failure that needs this undone):
```
python scripts/dev-notify/dev_notify/apply_config_patch.py claude rollback --apply --backup "<backup_path from above>"
```

## AC-2 — Claude Code CLI: `async: true` actually honored (AP4b — this is a hard gate)

Trigger a real `Stop` (end a normal Claude Code CLI turn) and time
how long the NEXT prompt takes to become available.
**Read**: wall-clock delay before the CLI is ready for the next
prompt.
**Criterion**: `PASS` if the delay is not noticeably longer than
without the hook (sub-second); `FAIL` if there's a consistent ~4s (or
longer) delay on every `Stop` — this means `async: true` is NOT
honored on the installed version despite `dedup-rules-addendum-1.md`'s
own `VERIFIED_FROM_DOCS` reading, and is a hard gate: **roll back AC-1
immediately** (command above) and open a new scoped prompt — do not
proceed to AC-3+ with a known-blocking hook in place.
**Test ID**: `AC-2`. Record date + PASS/FAIL here when run.

## AC-3 — Claude Code CLI: Windows receipt under the real hook (AP4a)

After AC-2 passes, let a real `Stop` fire and watch the screen.
**Read**: did a balloon/toast appear, and did it stay visible for
its own full ~4s display duration (not cut off)?
**Criterion**: `PASS` only if the owner directly saw it for the
expected duration; `UNKNOWN`/`PENDING` if nothing was seen but no
error is otherwise evident (per `dedup-rules-addendum-2.md`/`-3.md`,
`PENDING` is the *normal* outcome of `dispatch()`'s own return value,
which nothing persists — the owner's own eyes are the only evidence
here, not any log); `FAIL` only if something is visibly broken (e.g.
an error dialog). Do not poll logs/transcripts to manufacture a
result (NT3's standing rule) — if unseen and nothing else is wrong,
record `UNKNOWN`, not `FAIL`.
**Test ID**: `AC-3`. `VERIFIED_BY_OWNER` requires the owner's own
dated statement of what they actually saw.

## AC-4 — Contended-lock behavior (AP4d)

Trigger two `Stop` events in quick succession (e.g. two rapid turns,
or a background + foreground session) so the dedup lock is genuinely
contended.
**Read**: run `python scripts/dev-notify/diagnostic_dry_run.py`
afterward — check `dedup_state.lock_present` (should be `false` once
both have finished) and `dedup_state.entry_count`.
**Criterion**: `PASS` if the lock is not left present after both
hooks finish, and no second notification fired for what was really
the same event within its dedup window; `FAIL` if `lock_present:
true` persists for longer than `LOCK_TIMEOUT_SECONDS + a few seconds`
(a stuck lock). **Safe cleanup if stuck**: delete the `.lock` file
reported by the diagnostic (sibling to `state.json`, same directory)
— this is always safe per `dedup-rules.md`'s own fail-open design; it
never requires touching `state.json` itself.
**Test ID**: `AC-4`.

## AC-5 — Codex CLI: chain registration (dry-run first, then the real persist+verify+write)

```
python scripts/dev-notify/dev_notify/apply_config_patch.py codex plan
```
**Read**: the diff (old `notify` value shown redacted as
`<EXISTING_NOTIFY_COMMAND>`).
**Criterion**: `PASS` if the diff only replaces the `notify` line;
`FAIL` → stop, nothing written yet.

```
python scripts/dev-notify/dev_notify/apply_config_patch.py codex apply --apply --python-exe "<ABSOLUTE PATH TO python.exe>"
```
**Read**: the printed JSON. If `applied: true`, record `backup_path`
— but **`applied: true` is not yet the finish line**: see the
persisted-field gate below before restarting Codex. If `applied:
false`, read `reason`:
  - `already_patched` → the current `notify` already points at
    `cli_codex.py` itself. **No config was written, nothing
    persisted.** Do not retry `apply`. Use `rollback` if you need to
    change anything.
  - `notify_ambiguous_or_wrapper` (RF5) → the current `notify` value's
    shape is too ambiguous to safely treat as "the old command to
    chain to" (e.g. a stray empty argv element) — this is the SAME
    fail-closed refusal as `already_patched`, just with a distinct
    reason text because the value demonstrably isn't the wrapper
    itself, only unclear. **No config was written, nothing
    persisted.** Do not retry `apply`; inspect the real `notify` value
    by hand (never via a tracked file) and fix its shape before
    re-running `plan`. Documented known limitation, not a bug.
  - `chain_already_set_different` (CG5a) → something else already
    holds the persisted chain slot with a DIFFERENT value than the
    current `notify`. **No config was written, nothing re-persisted.**
    Do not retry `apply`; diagnose what's using that slot first.
  - `chain_state_unreadable` (RF2/PS1) → the PRE-apply check of
    what's already persisted itself failed to read (not "nothing
    there" — a genuine read error, e.g. a permissions problem). **No
    config was written, nothing persisted.** Do not retry `apply`;
    diagnose the read failure itself (see `detail`, never reproduced
    in a tracked file) before trying again.
  - `chain_persist_failed` → the real `setx` call itself failed
    (returncode or missing). **No config was written** (AP3's own
    fix) — the old Codex notify command is untouched. Diagnose `setx`
    directly before retrying.
  - `chain_persist_verification_failed` → `setx` "succeeded" but the
    value read back from the registry (`HKCU\Environment`) did not
    hash-match what was sent — most likely Windows' own ~1024-char
    `setx` truncation limit, or a quoting change. **No config was
    written.** If the old `notify` value is long, this is a real,
    documented limitation of this activation path, not a transient
    bug — consider path (ii) from `approved-prompt-v4.md`'s own AP3
    options (manual persistence + `--skip-chain`) instead.
  - `config_write_failed` → the config write itself (or its own
    post-write re-validation) failed; `backup_path` is still given —
    use it to confirm nothing was left in a broken state. The chain
    value itself WAS already persisted+verified successfully before
    this step ran, so a retry after fixing the write problem (disk
    space, permissions) CAN be reasonable — but see the RG4 condition
    on this below before retrying; it is not unconditional.
**Criterion**: `PASS` only on `applied: true` **AND** the persisted-
field gate below also passing.

**⚠️ Do not re-run `apply` on a config this step has already
succeeded on (CG1/RE1).** A second `apply` against an
already-patched `config.toml` is a HIGH-severity danger: `cli_codex.py`
would be persisted as the chain value for ITSELF, and a later real
notify firing would spawn `cli_codex.py` chaining to `cli_codex.py`
indefinitely (reproduced in independent sandbox review: ~60–76
self-sustaining processes before a manual kill). This round's fix
makes `apply_codex` itself refuse this (`applied: false, reason:
already_patched`, zero side effects) — but the checklist's own
instruction is still: **if this step already reported `applied:
true` once, do not run `apply` again.** If you need to change the
python path or wrapper location, use `rollback` (below) and start
over from a fresh `plan`, never a second `apply` on top of a
successful one.

### Decision table (PS2) — resolves the retry-vs-persisted-gate question in one place

This step has TWO separate, sequential gates. Conflating them is
exactly how RE1's danger gets triggered in practice (re-running
`apply` because something downstream looked wrong) — read both
before doing anything else:

**Gate 1 — may you retry `apply` at all?** Governed ONLY by `apply`'s
own `reason` (see the list above):
  - `applied: true` → **never retry** — it already succeeded.
  - `chain_persist_failed` / `chain_persist_verification_failed` →
    **up to one retry** (Max attempts: 2 total), only after fixing
    the underlying `setx`/registry cause.
  - `config_write_failed` → retry is **conditionally** allowed, once
    the write problem itself is fixed, but ONLY if a fresh `plan` run
    first confirms the config does **not** already report
    `already_patched`/`notify_ambiguous`. If it does (e.g. something
    else wrote to `config.toml` between the failed `apply` and now,
    or the failed attempt actually got further than reported), **do
    not retry — use `rollback` instead.** You never need to compare
    the persisted chain value against the previous attempt's value
    yourself: `apply`'s own CG5(a) pre-check does that automatically
    on the retry (equal → proceeds idempotently; different →
    `chain_already_set_different`, refused, no retry).
  - `already_patched` / `chain_already_set_different` /
    `chain_state_unreadable` / `notify_ambiguous_or_wrapper` →
    **never retry `apply`.** Diagnose or `rollback` instead — another
    `apply` attempt achieves nothing and cannot fix any of these.

**Gate 2 — ONLY after `applied: true`, before restarting Codex** —
the diagnostic's PERSISTED fields (never the current-process-env
fields, see RF3 below) gate whether it's actually safe to restart:
```
python scripts/dev-notify/diagnostic_dry_run.py
```
**Read**: `codex_chain.chain_persisted_state`,
`chain_persisted_json_valid`, `chain_persisted_points_to_wrapper`.
**PASS, safe to restart Codex, ONLY if ALL THREE**:
`chain_persisted_state == "set"` **AND**
`chain_persisted_json_valid == true` **AND**
`chain_persisted_points_to_wrapper == false`.
**Anything else** — `absent`/`empty`/`unreadable`/`not_windows`,
`json_valid: false`, `points_to_wrapper: true`, or either persisted
field being `null` while `chain_persisted_state` claims `set` (should
never happen; treat as `unreadable` if it does) — **STOP. Do not
restart Codex.**

**RG4 correction (do not re-run the diagnostic in a different
terminal expecting a different Gate-2 result)**: `chain_persisted_*`
reads the registry directly and is the same value from ANY terminal,
opened at any time — a fresh terminal **cannot** change what Gate 2
sees, and does **not** fix an `unreadable` state or an invalid
persisted value. (A fresh terminal only ever refreshes the SEPARATE
current-process-env fields, which Gate 2 does not even look at — see
"this shell only" below.) So if Gate 2 fails, go straight to
diagnosing the real cause — re-reading the registry key by hand,
checking what `setx` actually wrote — or `rollback` and start over
from `plan`; re-running the diagnostic itself in a new window is not
a diagnostic step that can change this outcome. **This gate is never
a reason to re-run `apply`** — `apply` already succeeded (Gate 1
above); a Gate-2 failure means the PERSIST step itself needs
investigating (`setx` from a different context, a leftover value
from something else), not another patch of `config.toml`. **A Gate-2
`STOP` only ever leads to `rollback` or manual diagnosis — never to a
new `apply` call**, exactly like every Gate-1 "never retry" reason
above; Gate 1's own `reason` is the only thing that can authorize a
retry, and `applied: true` (Gate 1's own signal that `apply` already
succeeded) forecloses that permanently for this attempt.

**RF3 correction (the previous version of this checklist asked for
an unsatisfiable check here)**: the OLD instruction said to read
`chain_points_to_wrapper` from the CURRENT PROCESS's own environment
(`chain_env_var_set`/`chain_json_valid`/`chain_points_to_wrapper`,
no `_persisted_` in the name) and require it to be `false` before
restarting — but that field is **always `null`** in the very same
terminal window the `setx` call ran in (per CG1's own correction
below: `setx` never updates the current process's own environment,
not even its own invoking shell), so the OLD check could never pass
in the one terminal an owner would naturally check right after
`apply` — exactly the setup that invites a confused re-`apply`. The
NEW gate above reads the PERSISTED fields instead (a direct registry
read, correct from any terminal, any time). The current-process-env
fields are still reported by the diagnostic and are still useful —
labeled here explicitly: **"this shell only" — they describe what a
notify invocation starting from THIS terminal would see right now,
never a signal to retry anything, and never the thing this gate
checks.**

**Important correction (CG1 — the previous version of this checklist
had this backwards)**: `setx` does **not** update the current
process's own environment, and a child process can never update its
parent's environment either — this is true even in the SAME terminal
window the `setx` command itself ran in. Running `diagnostic_dry_run.py`
in that same window will show `chain_env_var_set: false` (current-
process-env field, "this shell only" per RF3 above) while
`chain_persisted_state` correctly shows the real persisted value
(direct registry read) — **do not** read a `false` `chain_env_var_set`
there as "the `setx` failed" and re-`apply`; that misreading is
exactly how RE1's danger gets triggered in practice. The PERSISTED
fields (Gate 2 above) are the ones that matter for the restart
decision, regardless of which terminal you run the diagnostic from.

**Rollback** (state-aware — CG5b):
```
python scripts/dev-notify/dev_notify/apply_config_patch.py codex rollback --apply --backup "<backup_path>"
```
This restores `config.toml` to exactly its pre-`apply` content. It
does **not** clear the persisted `DEV_NOTIFY_CHAINED_NOTIFY_CMD`
value — but per CG5(b), that's fine and not a safety concern: once
`config.toml` is rolled back, the old notify command is back in
place and the persisted chain variable (even if left set) is now
unused and harmless, since nothing points `notify` at `cli_codex.py`
anymore for it to ever be read by. Clearing it is housekeeping, not a
required safety step, and the owner is never pressured into it.
Deleting the variable entirely (`setx DEV_NOTIFY_CHAINED_NOTIFY_CMD`
with no value, or `reg delete HKCU\Environment /v DEV_NOTIFY_CHAINED_NOTIFY_CMD`)
is itself `UNKNOWN`/`NOT_TESTED` this round — whether `setx NAME` with
no value deletes the variable or sets it to an empty string is
ambiguous (per Jonesy's own `VERIFIED_FROM_DOCS` reading of
Microsoft's `setx` documentation, cited in this round's own prompt
review; CC did not independently re-read it, and this round makes no
new docs-net call of its own to check). `cli_codex.py` treats an
empty persisted/env value the same as absent either way (see
`_chain_to_existing`: `if not chain_cmd_json: return`), so an empty
value left behind is also harmless regardless of which of the two
`setx` behaves. Read `chain_persisted_state` (`absent` vs `empty` vs
`set`) first (CG1c) before deciding whether any cleanup step is even
needed, and never run a deletion step against a value you did not
yourself set and record.

## AC-6 — Codex CLI: old notify command still runs alongside (AP4e — this is the core NT7 promise)

After AC-5, restart the Codex CLI session (a new process is required
for it to see the new `notify` command per the environment-snapshot
finding above) and trigger a real turn completion.
**Read**: did the OLD behavior (whatever the previously-configured
`notify` command did — e.g. the app's own internal "turn-ended"
signal) still happen, **and** did a new Windows notification also
appear?
**Criterion**: `PASS` only if BOTH happened; `FAIL` if the old
behavior stopped — this is the single most important regression this
whole feature must never cause, and failing it means **immediate
rollback** (AC-5's rollback command) regardless of whether the new
notification worked.
**Test ID**: `AC-6`.

## AC-7 — Codex CLI: Windows receipt + full-duration balloon under the real Codex hook

Same read/criterion as AC-3, but specifically for a Codex-driven
(not Claude-driven) completion. Codex never waits for this script at
all (confirmed from source — `command.spawn()`, fire-and-forget), so
there is no equivalent to AC-2's "did it delay the next action" check
here; the only question is whether the notification was seen.
**Test ID**: `AC-7`.

## AC-8 — Codex desktop app (ABI `UNKNOWN` for this surface specifically)

Trigger a real turn completion in the Codex **app** (not CLI).
**Read**: did a Windows notification appear?
**Criterion**: this surface's ABI is `UNKNOWN` (audit-report.md), so
there is no "expected" outcome to compare against:
  - A notification appearing → `PASS`, and additionally confirms the
    app shares the CLI's own ABI (upgrade this surface's status from
    `UNKNOWN` to `VERIFIED_BY_OWNER` in `audit-report.md`/`cc-report.md`,
    dated).
  - Nothing appearing, with the app's own OLD behavior (if any)
    still intact → `UNSUPPORTED`/`PENDING` for this surface specifically
    — **not** a `FAIL` for the whole feature, and not a reason to add
    polling/workarounds to force a hook (NT3's standing rule).
  - The app's OLD behavior breaking → `FAIL`, roll back AC-5
    immediately (the app and CLI share one config entry).
**Test ID**: `AC-8`.

## AC-9 — Claude Code VSCode extension (integration point itself `UNKNOWN`)

Same structure as AC-8: trigger a real `Stop` from the VSCode
extension specifically.
**Read/Criterion**: a notification appearing → `PASS`, upgrades this
surface to `VERIFIED_BY_OWNER`. Nothing appearing (and no other
regression) → `UNSUPPORTED` for this surface, not a feature-wide
`FAIL`. The workspace-trust dialog (audit-report.md) must be accepted
once in VSCode for hooks to run at all in an interactive session —
confirm that was done before recording `UNSUPPORTED`.
**Test ID**: `AC-9`.

## AC-10 — ntfy / iPhone (only if the owner chose an ACL path in `activation-plan.md`)

Prerequisite: a new, non-exposed topic + token stored via
`secret_store.py` (hidden input, see the template's own setup note —
never typed into chat, argv, or a tracked file).

1. **Unauthenticated publish, expected REJECTED** — one bounded test
   call to the new topic with no token. **Read**: the real HTTP
   status returned, recorded as-is (not asserted in advance).
   **Criterion**: `PASS` if the response indicates denial (whatever
   status ntfy.sh actually returns — this round's own audit left the
   exact code `UNKNOWN`, to be observed here, not guessed); `FAIL` if
   it succeeds (status 200) — the topic is NOT actually access-
   controlled, stop here, do not proceed to AC-10's next step, and
   do not treat this topic as usable until ACL is genuinely fixed.
   **Counts toward the test-count budget** in the owner's own
   activation record.
2. **Authenticated publish** — one bounded test call with the real
   token (never printed to chat/log/argv — only `token_present:
   true/false` is ever shown, per `payload-allowlist.md`).
   **Read**: HTTP status, AND, separately, whether the iPhone
   actually showed the notification (background/locked/DND states
   tested separately per the original NT8 requirement — HTTP 2xx is
   not phone receipt).
   **Criterion**: `PASS` only once BOTH the HTTP status is 2xx AND
   the owner directly confirms the phone showed it.
**Test ID**: `AC-10`. Counts/time/bytes for this step are set by the
owner's own activation record (`owner-activation-template.md`), never
assumed to be unlimited.

---

## Summary table (fill in as each step runs — CC does not fill this in)

| ID | Surface | Date | Result | Notes |
|---|---|---|---|---|
| AC-1 | Claude CLI hook registration | | | |
| AC-2 | Claude CLI async honored | | | |
| AC-3 | Claude CLI Windows receipt | | | |
| AC-4 | Contended lock | | | |
| AC-5 | Codex CLI chain registration | | | |
| AC-6 | Codex CLI old notify coexistence | | | |
| AC-7 | Codex CLI Windows receipt | | | |
| AC-8 | Codex app | | | |
| AC-9 | Claude VSCode | | | |
| AC-10 | ntfy / iPhone | | | |

Overall: `PASS` only if every attempted surface's own steps are
`PASS`/`VERIFIED_BY_OWNER` — any surface left `UNKNOWN`/`PENDING`/not
attempted keeps the overall result `PARTIAL`, never a full `PASS` for
`#498`.
