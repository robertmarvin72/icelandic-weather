# #498 — Windows-first round: CC report

Executes `approved-prompt-v8.md` (Jonesy's WV1–WV7 folded onto their
own WF1–WF3 Windows-first runbook draft). **Preparation only — no
activation.** Windows 11, Python 3.14.0 unless stated.

## What CC did this round

- Read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`/`CURRENT.md`,
  `result-review.md` (round 7 verdict), `activation-plan.md`,
  `activation-checklist.md`, `owner-activation-template.md`,
  `docs/dev/dev-notify-setup.md`, and the real source of `config.py`,
  `apply_config_patch.py`, `cli_claude.py`, `dispatch.py`,
  `windows_toast.py` — per the approved prompt's own reading list,
  before writing anything.
- Wrote `windows-first-runbook.md` (WF1): one ordered sequence of
  owner-run steps, referencing `activation-checklist.md`'s existing
  AC-1/AC-2/AC-3/AC-4/AC-9 for the actual test criteria rather than
  duplicating them, with WV1–WV7 folded in as explicit preconditions/
  corrections at each relevant step.
- Performed **three tempfile-only, read-only measurements** on this
  Windows machine (WV7 — see below) to confirm Jonesy's own Linux-
  sandbox findings reproduce here, with no code change.
- Wrote this report.
- Set `CURRENT.md`: `READY_FOR_CC` → `CC_IN_PROGRESS` → (after this
  report) `CC_COMPLETE`, with a dated handoff entry.

## What CC explicitly did NOT do (owner-pending)

- No `apply`/`rollback` against any real path (`.claude/
  settings.local.json` or anything else).
- No `setx`, no registry read/write, no secret-store call, no ntfy/
  network call, no Windows notification triggered.
- No real Claude Code CLI or VSCode turn run, timed, or observed —
  AC-2/AC-3/AC-4/AC-9 are entirely owner-run, per the approved prompt.
- No code/test/runtime change in `scripts/dev-notify/` — this round's
  own authorization (`approved-prompt-v8.md`) does not cover that; the
  3 measurements below found nothing requiring one (see WV7's own
  closing instruction: a found code-change need would be logged as a
  proposal for a separate round, not implemented here — none arose).
- No `owner-authorisation.md` (or equivalent dated authorization file)
  was created — per WF1(4)/WV5, that file is written BY THE OWNER,
  never pre-filled or signed by CC. None exists yet, so no `apply` is
  authorized by this round's own output.
- `RH1`–`RH3` are NOT claimed fixed — still open, from `result-review.md`
  round 7, unrelated to this round's own scope.
- `.gitignore` was NOT modified this round (WV2(d)'s backup-file
  gitignore gap is logged in the runbook, Step 7(5), as something
  needing its OWN separate authorization — not acted on here).

## WV7 — tempfile measurements (CC-attributed, Windows, this machine)

Jonesy's own review measured these on Linux/Python 3.13 against a
sandboxed repo copy. WF3 only requires CC to re-run such a check if a
"new doubt" exists — WV1–WV3 (now WV7's own named items) are exactly
that doubt, so these three were measured here, against **tempfiles
only**, via a disposable script (not a tracked artifact, deleted
after the run; no production file read or written other than
`apply_config_patch.py`'s own module, imported read-only). Full
disposition:

### (a) WV2(a): `apply` on a settings file that does not exist yet

Setup: `.claude/`-equivalent tempdir exists, the settings file itself
does not.

```
applied: True
backup_path: <tmp>\a\settings.local.json.bak-20261113T180353Z
backup file actually exists on disk: False
settings file now exists: True
rollback raised: FileNotFoundError: [Errno 2] No such file or directory: '...bak-20261113T180353Z'
```

**Confirmed, matches Jonesy's own finding exactly**: `apply` creates
the settings file with no backup, but still returns a `backup_path`
pointing at a file that was never written; a `rollback` against that
path fails with an uncaught `FileNotFoundError`. The runbook's Step 7
item 1 covers this (create an empty `{}` first if this path needs
rollback coverage, and record that manual step in the authorization).

### (b) WV2(c): a second `apply` on an already-patched file

```
first apply  -> applied: True   backup: ...\c\settings.local.json.bak-20261113T180353Z
plan before second apply -> no_op: True
second apply -> applied: True   no_op: True   backup: ...\c\settings.local.json.bak-20261113T180353Z
first backup == second backup (same path)? True
second backup file exists: True
number of distinct backup files on disk after 2 applies: 1
```

**Confirmed**: there is no `already_patched` guard on the Claude path
(unlike Codex's) — a second `apply` on an already-patched file still
reports `applied: true`. **One measured refinement beyond Jonesy's
own wording** ("creates a new backup"): the backup filename has only
**second**-resolution timestamp granularity
(`backup_path_for`/`_timestamp`), so two `apply` calls within the same
UTC second produce the SAME backup filename — the second write
overwrites the first in place rather than creating a distinct second
file. Harmless in this specific scenario (the content is identical
either way, since `no_op` was `true`), but worth recording precisely:
an owner should not assume `backup_path` always names a newly created,
distinct file on a repeated `apply`. Already covered by the runbook's
own Step 3/7(4): `no_op: true` is unconditionally `STOP, never apply`
regardless of this detail, so the collision has no practical
consequence under the runbook as written — logged for completeness,
not as a new gap requiring a code change.

### (c) WV3: `plan`'s diff is unredacted

```
secret_looking_perm found verbatim in diff: True
REDACTED_NOTIFY_PLACEHOLDER found in diff (should be False -- Codex-only): False
```

**Confirmed**: a `permissions` entry containing a canary string
appears verbatim in `plan_claude`'s own `diff` output — there is no
redaction logic on the Claude path at all (`_redact_text_for_display`/
`REDACTED_NOTIFY_PLACEHOLDER` exist only in the Codex path, confirmed
not present in the Claude diff here). The runbook's Step 3 covers
this: never paste raw `plan`/`apply` output; report only the bounded
field list given there.

**If these measurements had disagreed with Jonesy's own sandbox
findings, this section would say so explicitly — they did not; all
three reproduce on Windows exactly as described**, with the one
precision noted in (b) above.

## WF1–WF3 acceptance

- **WF1**: `windows-first-runbook.md` written as one ordered sequence,
  referencing (not duplicating) `activation-checklist.md`; covers
  items 1–6 from the approved prompt's own WF1 list, each with WV1–
  WV7's conditions folded in at the matching step.
- **WF2**: real testing (AC-2/AC-3/AC-9, AC-4's contention caveat) is
  described as entirely owner-run with pre-registered criteria,
  max-attempts language, and the `idle_prompt`/dedup-window caveat
  from WV6(a); the `diagnostic_dry_run.py` scope gap (WV6 note in the
  approved prompt / Step 4 of the runbook) is logged, not worked
  around.
- **WF3**: commands in the runbook were checked against the current
  `apply_config_patch.py`/`config.py`/`dispatch.py` source (the same
  reading pass listed above) — WV7's own named doubts additionally
  got the tempfile measurements above. No broader test suite re-run
  was performed, since no NEW doubt beyond WV1–WV3/WV7 arose needing
  one, per WF3's own instruction not to re-run the full suite or any
  network test without cause. Prior evidence this round explicitly
  does **not** re-claim or re-verify: the test-isolation round's own
  224 attempted/218 run/6 loopback-skip/0 fail result (Windows/Python
  3.14, 2026-11-12) stands as-is, unrelated to this round's own scope,
  and is not a stand-in for any real-hook proof.

## Logged uncertainties (not blocking; not treated as new subtasks)

- Which shell Claude Code uses on the owner's real machine, and
  whether VSCode's hook runner matches it — `UNKNOWN`, owner must
  confirm per runbook Step 0 before `apply`.
- Windows Focus Assist/notification-settings interaction with a
  `powershell.exe`-originated balloon — `UNKNOWN`.
- `diagnostic_dry_run.py`'s scope (reads Codex's persisted registry
  value too) doesn't cleanly fit a Claude-only authorization — logged
  as a real gap in how AC-4 is currently written, not resolved here.
- `RH1`–`RH3` — unrelated, still open from round 7.

None of the above triggered scope expansion; each is recorded with
its effect, per the Icelandic workflow addendum's own rule that an
`UNKNOWN` does not automatically spawn a new subtask.

## Scope confirmation (read-only)

```
$ git status --porcelain=v1
 M docs/ai/CURRENT.md
?? docs/ai/tasks/ticket-498/approved-prompt-v8.md
?? docs/ai/tasks/ticket-498/windows-first-prompt-review.md
?? docs/ai/tasks/ticket-498/windows-first-runbook.md
```
(`windows-first-cc-report.md` itself, this file, is the next addition.)
No `.gitignore` change. No application/API/scoring/gating/payment
code touched. No `scripts/dev-notify/` source or test file touched —
the tempfile measurements above imported `apply_config_patch.py`
read-only from a disposable script outside the repo (in the session's
own scratchpad directory, deleted after use) and never wrote to any
file under `scripts/dev-notify/`. No commit/push/GitHub action. No
dependency added. No delegation to another agent.

## Round outcome

**`PREPARED_AWAITING_OWNER_ACTIVATION`** (per the approved prompt's
own instruction: this is the correct outcome label for an ordinary
preparation handoff with no owner authorization yet in hand — not
`BLOCKED`, and not a false `E2E PASS`). `#498` remains open.
`windows-first-runbook.md` is ready for the owner to work through up
to (not including) the real `apply` step, which needs its own dated
`owner-authorisation.md` first (WV5). Next step per the workflow is
Jonesy's result review on this report, in
`windows-first-result-review.md` ("CC búinn").

---

## Round 2 — RI1–RI5 / RJ1–RJ6 (2026-11-13, CC)

Executes `approved-prompt-v9.md` (Jonesy's RJ1–RJ6 folded onto their
own RI1–RI5 result review of round 1). **Preparation only — no
activation, no code/test change.** Windows 11, Python 3.14.0,
Windows PowerShell 5.1 (`$PSVersionTable.PSVersion` = `5.1.26100.9818`)
unless stated. `pwsh` (PowerShell 7) is **not installed** on this
machine — the 5.1-only verification RJ2(d) allows for that case is
what's reported below; no PowerShell 7 claim is made.

### What changed

`windows-first-runbook.md` was substantially rewritten:
- **Reordered into a single linear sequence** (RI2): Step 0 (shell) →
  1 (Python/version) → 2 (config-check) → 3 (limits, file/folder
  preconditions, independent backup, baseline timing — in that
  order, limits FIRST since baseline turns in 3(d) are the first
  turns spent) → 4 (`plan`, last thing before authorization) → 5
  (authorization) → 6 (`apply`) → 7 (immediate post-apply
  verification) → 8 (`/hooks`) → 9 (AC-2→AC-3→AC-9) → 10 (rollback).
  A later step never runs before an earlier one's own precondition.
- **Every `plan`/`apply`/`rollback` command now has an explicit
  `--path`** (RI1), run from `$DN_REPO` via `Push-Location`/
  `Pop-Location`, using one consistent set of PowerShell session
  variables (`$DN_REPO`, `$DN_PYTHON`, `$DN_SCRIPTS`, `$DN_CLI`,
  `$DN_PATCHCLI`, `$DN_SETTINGS`) defined once at the top — never
  `$env:` variables, never a reserved name like `$HOME`.
- **Three self-contained, copy/paste PowerShell blocks**, each a
  here-string piped into `python -B -` with ASCII-only source and
  values passed as argv (never `$env:`): a config-check (Step 2), an
  additive-only check using the real `merge_claude_hooks` in-memory
  (Step 4), and a hash-check block with two modes, `text` and
  `jsonequal` (Step 7/10). All three print a closed vocabulary
  (`ok`-shaped JSON, or `STOP: <reason>`) and never an exception's own
  message text (same discipline as TI2 in the test-isolation round).
- **RJ1's hash distinction is now explicit and used correctly
  throughout**: `Get-FileHash` (byte-hash) is used ONLY in Step 3(c)
  to verify a literal file copy; everywhere `before_sha256`/
  `after_preview_sha256` are involved (Step 7, Step 10), the new
  `text` mode of the hash-check block is used instead — it replicates
  the tool's own `sha256_of_text(path.read_text(encoding="utf-8"))`
  exactly (CRLF→LF decoded, then UTF-8 re-encoded, then SHA-256), and
  detects a leading UTF-8 BOM as its own `STOP: bom` rather than
  silently mis-hashing.
- **RJ5's rollback-content caveat** is now an explicit pre-rollback
  check (Step 10's own first block) plus a standing instruction
  (Step 9) to keep every test turn tool-less and never approve
  "Always allow" during testing, since `rollback` restores the WHOLE
  file and cannot selectively preserve anything Claude Code itself
  wrote into it after `apply`.
- **RJ3's VSCode environment caveat**: Step 9's AC-9 instructions now
  require closing ALL VSCode windows before launching one fresh
  instance from the checked-over PowerShell window (`code` reuses an
  already-running process otherwise), while still stating the
  resulting extension-host environment is `UNKNOWN` even then.
- **RJ4's AC-2 timing rule** is now the exact two-baseline/two-post-
  measurement method from the approved prompt, fitted inside the
  turn budget (the baselines ARE two of the four CLI turns, the post-
  measurements ARE the AC-3 observation turns — no separate budget).
- **RI5's corrections**: removed the wrong `DEV_NOTIFY_CHAINED_NOTIFY_CMD`
  name from the dedup caveat (that's the unrelated Codex-chain
  variable; the 75s/`COMPLETED`/`prompt_id` description itself was
  already correct) and said so explicitly rather than silently fixing
  it; clarified that Step 3(d)'s two baseline turns and Step 9's two
  post-measurement turns together ARE the `≤4 CLI turns` budget, not
  additional to it; gave explicit PASS/UNKNOWN numeric boundaries for
  AC-2 (above).
- **`owner-activation-template.md` and the previous round's own
  tempfile findings are referenced, not restated** — this round did
  not need to re-derive WV2(a)/(c)'s backup edge cases, only re-run
  them with explicit `--path` from a different cwd as part of the
  end-to-end verification below.

### RJ2 — PowerShell 5.1 verbatim verification (this machine)

All three blocks were drafted, iterated, and FIXED against real
Windows PowerShell 5.1 failures before being placed in the runbook,
then **re-extracted programmatically from the final committed file**
(a small PowerShell script parsed the `@'...'@` here-strings directly
out of `windows-first-runbook.md` itself, rather than re-typing them)
and re-run once more to confirm the committed text is exactly what
was tested — per RJ6(a)'s "run verbatim as it stands in the runbook,
not retyped" requirement.

**Two real bugs found and fixed while drafting (both are exactly the
kind of fragile-PowerShell-encoding problem RJ2 was worried about):**

1. **PowerShell silently drops an empty-string positional argument**
   when calling a native executable via `&`, whether the empty string
   is a literal `""` or a variable holding `""` — confirmed directly
   (`python -c "import sys; print(sys.argv)"` with an empty-string
   arg shows the argument is simply gone, shifting every later
   argument left by one). This would have silently fed the WRONG
   value into `config_path_arg`/`localappdata_arg` for the "not set"
   case. Fixed: every block uses an explicit non-empty sentinel
   string, `"NONE"`, for "not set," translated back to `""` inside
   the Python source — never a bare empty-string argument anywhere.
2. **A literal UTF-8 BOM character ended up embedded in the runbook's
   own Python source** (`text.startswith("﻿")` was accidentally
   authored as `text.startswith("<the actual BOM character>")`) —
   found by re-scanning the final file for any non-ASCII byte inside
   each `@'...'@` block (a short Python pass over the file, checking
   `ord(ch) > 127` line by line within the heredoc ranges) after
   RJ2(a)'s own ASCII-only requirement prompted the check. Functionally
   harmless (the same Unicode codepoint either way), but a real
   violation of "ASCII-only source" and a genuine risk across
   different terminal/copy-paste encodings — fixed by replacing the
   literal character with the proper `﻿` escape sequence in all
   three occurrences. Confirmed zero remaining non-ASCII characters
   inside any heredoc block in the final file.

Also found while fixture-building (not a runbook bug, a test-fixture
mistake caught before it produced a false result): .NET's
`[System.Text.Encoding]::UTF8` property DOES emit a BOM when used
with `WriteAllText` — an early BOM-less fixture attempt actually
produced a BOMmed file, which the config-check/hash-check blocks
correctly flagged as `STOP: bom`. Switched fixture creation to
`New-Object System.Text.UTF8Encoding $false` for genuinely BOM-less
fixtures, confirmed via raw byte inspection (first byte `123` = `{`,
not `239` = the BOM's first byte).

**Verbatim re-test results, extracted from the final file** (all
PASS as designed):
- Config-check: valid config with `ntfy.enabled`+host+topic present
  → correct booleans, `ntfy_enabled: true` etc.; a BOM-prefixed file
  → `STOP: bom`; `DEV_NOTIFY_CONFIG_PATH` set but file missing →
  `STOP: override_env_set_but_file_missing`; no override and no
  default config directory present → all fields `null`/`false` as
  designed, exit 0.
- Config-check, path-encoding case (RJ2e): a fixture directory with
  BOTH a space and a non-ASCII character (`my folder ó`) → correct
  booleans returned via the argv path, no `STOP: path_encoding`
  needed — the argv-based value passing handles it correctly.
- Additive-check: a normal fixture → `permissions_equal: true`,
  `new_top_level_keys: ["hooks"]`, no unexpected/foreign hook events,
  both full and short command SHA-256 printed; a fixture with a
  pre-existing FOREIGN hook on `Notification` →
  `foreign_handlers_on_our_events: ["Notification"]` (this specific
  field is new this round — a mechanical catch for WF1's own
  "unexpected hooks → STOP" rule, rather than relying on a human
  reading the raw diff); a canary string embedded in `permissions`
  never appeared in the block's own stdout.
- Hash-check, `text` mode: an LF-ending and a CRLF-ending version of
  the SAME semantic JSON content produce the SAME `text_sha256` —
  and that value matches `apply_config_patch.sha256_of_text()` called
  directly on the same file, confirming the block genuinely
  replicates the tool's own method. `Get-FileHash` (byte-hash) on the
  same two files, by contrast, produces two DIFFERENT hashes —
  reproducing RJ1's own finding directly on Windows (not just cited
  from Jonesy's Linux sandbox).
- Hash-check, `jsonequal` mode: the same LF/CRLF pair → `json_equal:
  true`.
- End-to-end `plan`/`apply`/`rollback`, using Step 4/6/10's EXACT
  command lines (explicit `--path`, `Push-Location`/`Pop-Location`
  into `$DN_REPO`, against a tempfile settings path well outside the
  repo): `plan` → `no_op: false`, real hashes; `apply --apply` →
  `applied: true`, real `backup_path`, `Test-Path` on it → `True`;
  `rollback --apply` → `applied: true`, restored file's own
  `current_sha256` matches the pre-rollback (patched) state as
  expected for this tool's own reported field. All three steps ran
  from `$DN_REPO` while targeting a settings path in a DIFFERENT
  directory, confirming RI1's `--path` fix actually works end-to-end,
  not just in isolation.
- WV2(a)/(c) backup edge cases (from the round-1 report) were also
  re-confirmed this round with explicit `--path` from a different
  cwd: `apply` on a nonexistent settings file still returns an
  unwritten `backup_path` (`Test-Path` → `False`); a second `apply`
  on an already-patched file still reports `applied: true, no_op:
  true` with the same (same-second-collision) `backup_path` as
  round 1 found — unchanged behavior, now reconfirmed under RI1's own
  `--path` discipline.

Everything above ran against **tempfiles only**, never the real
`.claude/settings.local.json`; every tempdir was removed after its
own test. No `scripts/dev-notify/` source or test file was read-write
touched — `apply_config_patch.py` was imported/invoked read-only
exactly as the runbook itself instructs the owner to. No notifier
call, no network call, no registry access, no Codex surface touched.

### RI3/RJ3 disposition

- (a) Step 8 (`/hooks`) added: registration-only, explicitly
  distinguished from execution.
- (b) Step 1 now states the Python ≥3.11 requirement with its own
  reason (`tomllib` top-level import) and an explicit version check
  command/criterion, not just "confirm it's installed."
  Confirmed again this round: this machine's Python 3.14.0 satisfies
  it; the `apply_config_patch.py` import chain was exercised
  end-to-end above without any `ImportError`.
- (c) Step 1 now states the Python-path/`cli_claude.py`-path
  immutability rule explicitly, tied to "needs a fresh `plan` and a
  fresh authorization."
- RJ3(a): Step 2 and Step 4 onward are now explicitly tied to running
  in the SAME PowerShell window, with a warning against changing
  `$env:` values in between.
- RJ3(b)/(c): AC-9 now requires closing all VSCode windows first (see
  above); the extension-host environment stays `UNKNOWN` regardless,
  explicitly stated as such rather than implied.
- RJ3(d): Step 0's `bash.exe` check is explicitly labeled "necessary
  but not sufficient," with no inference drawn about VSCode's own
  shell from it.

### Not done / owner-pending (unchanged from round 1, restated)

No real `apply`/`rollback` against `.claude/settings.local.json`; no
`owner-authorisation.md` (owner-written only); no real Claude Code or
VSCode turn run or observed; no `setx`/registry/secret-store/network/
notifier call; no code or test change in `scripts/dev-notify/`; no
`.gitignore` change; `RH1`–`RH3` not claimed fixed; `diagnostic_dry_run.py`
not run under this authorization (logged gap, Step 9).

### Scope confirmation (read-only)

```
$ git status --porcelain=v1
 M docs/ai/CURRENT.md
?? docs/ai/tasks/ticket-498/approved-prompt-v8.md
?? docs/ai/tasks/ticket-498/approved-prompt-v9.md
?? docs/ai/tasks/ticket-498/windows-first-cc-report.md
?? docs/ai/tasks/ticket-498/windows-first-prompt-review.md
?? docs/ai/tasks/ticket-498/windows-first-result-review.md
?? docs/ai/tasks/ticket-498/windows-first-runbook.md
```
(`approved-prompt-v8.md`/`windows-first-prompt-review.md`/
`windows-first-result-review.md` predate this round's own edits —
only `windows-first-runbook.md`, this file, and `CURRENT.md` were
touched this round.) No `.gitignore` change. No application/API/
scoring/gating/payment code touched. No commit/push/GitHub action.

### Round outcome

**`PREPARED_AWAITING_OWNER_ACTIVATION`** (per the approved prompt's
own instruction — not `BLOCKED`, not an `E2E PASS`). RI1–RI5 and
RJ1–RJ6 are addressed as described above, with two real PowerShell/
encoding bugs caught and fixed during this round's own verbatim
testing (never shipped to the runbook unfixed). `#498` remains open.
Next step per the workflow is Jonesy's result review on this report,
in `windows-first-result-review.md` ("CC búinn").

---

## Round 3 — RK1–RK5 / RL1–RL5 (2026-11-13, CC)

Executes `approved-prompt-v10.md` (Jonesy's RL1–RL5 folded onto their
own RK1–RK5 result review of round 2). **Preparation only — no
activation, no code/test change.** Windows 11, Python 3.14.0,
Windows PowerShell 5.1 (`5.1.26100.9818`) unless stated.

### Dated correction — the round-2 report's "closed vocabulary" claim was too strong (RK5b)

Round 2's own report said all three blocks print "a closed
vocabulary... never an exception's own message text." **That was
true only for the specific failure paths round 2 happened to test.**
Jonesy's own sandbox (round 3's RK1) found real, un-exercised paths
where it was false: an override config of `{"ntfy": null}` or
`{"windows_toast": 1}` raised an uncaught `AttributeError` with a raw
Python traceback on stderr; a malformed/non-dict `hooks` value in the
additive-check did the same; the hash-check's `text` mode let a bare
`FileNotFoundError` (with the **full file path** in its own message)
escape uncaught. This round fixes all three (see RK1 below) and this
paragraph is the dated correction — the round-2 text itself is left
as written, not silently rewritten.

### RK1/RL1 — unguarded exception paths + untrusted key-name leak — **FIXED**

**RK1**: every block now wraps its ENTIRE body (including the dynamic
`dev_notify` import, all `argv` access, all helper-function calls) in
one outer `try/except SystemExit: raise / except BaseException as e:
print("STOP: unexpected:" + type(e).__name__)` boundary — `SystemExit`
is re-raised untouched so a deliberate `sys.exit(1)` inside a
deliberate `STOP: ...` path is never relabeled as "unexpected."
Nothing below that boundary ever reaches stdout/stderr on an
unanticipated error — only the exception's TYPE NAME, never its
message, path, or any file content. Deliberately anticipated failure
modes (BOM, parse failure, wrong shape, missing file, unreadable
file) keep their own specific `STOP: <reason>` text, distinct from
the catch-all `STOP: unexpected:<TypeName>`.

**RL1**: separately, the additive-check block was ALSO printing raw,
untrusted key names from the settings file — `hook_events_present`/
the old `unexpected_hook_events` were `sorted(...keys())` over the
file's own `hooks` dict. Confirmed with a canary key
(`hooks: {"CANARY_EVENT_zz91": [...]}`): the old block printed
`CANARY_EVENT_zz91` verbatim on stdout. Fixed: `hook_events_present`
is now the INTERSECTION with the three known event names only
(`Notification`/`Stop`/`StopFailure`) — it can never contain a name
that wasn't already one of those three; the raw list is replaced
with `unexpected_hook_events_count` (an `int`) and
`unexpected_hook_events_present` (a `bool`) — the presence/count of
anything unexpected is reported, the name itself never is.
`foreign_handlers_on_our_events` was already safe (it only ever
contains the three fixed names) and is unchanged.

**Verbatim re-test, extracted from the final file**: canary key name
confirmed absent from stdout (and from the one line of output in
total — there's no separate stderr in the success path); `enabled:
"false"` (type-confused), `ntfy: null`, non-dict top-level JSON, a
non-dict/non-list/non-dict/non-list/non-dict shape at each of the
five additive-check nesting levels (`hooks`, event value, group,
group's `hooks`, handler) each individually produce `STOP:
unexpected_shape` — never an `AttributeError` traceback. A genuine
`ModuleNotFoundError` (bogus `scripts_dir` argument, run from a
neutral cwd that can't accidentally resolve the real package) is
caught as `STOP: unexpected:ModuleNotFoundError` — no path in the
output. A genuine `FileNotFoundError`/`PermissionError` in the hash-
check's `text` mode produces `STOP: read_failed:<TypeName>` — no path
in the output (this one keeps its own specific label rather than
falling through to the generic catch-all, since it's an anticipated
case the block already handles directly).

### RK2/RL2 corrections to this round's own text (not code) — covered together below

(Kept together since RL2 is actually a NEW, separate requirement from
round 3's own RK2 — see the two items below; the shared number is a
coincidence between the two review rounds, not the same finding.)

**RK2 (backup/rollback hash verification, Step 9/Step 12)** — **FIXED**:
the previous Step 9(3) ran `jsonequal` comparing the TOOL's backup
file against the LIVE (already-patched) settings file and said they
"should be DIFFERENT" — that only proves the backup is valid JSON,
not that it's the correct pre-`apply` content. Fixed: Step 9(3) now
runs the `text` mode against `before_sha256` instead — the actual
strong check Jonesy asked for — run once right after `apply` and
again after any later move (Step 9(4)). Step 12 (rollback) now runs
BOTH the text-hash-vs-`before_sha256` check AND a `jsonequal` against
the Step 3(c) independent manual backup, rather than only the text-
hash. The authorization file (Step 7) now also records `before_sha256`
(previously only `after_preview_sha256`/`command_sha256_full`) — it's
a hash, not a secret, and it's exactly what Step 9(3)/Step 12 need to
check against.

**RL2 (strict type validation)** — **FIXED**: the config-check block
previously used `bool(cfg.get("enabled", True))` etc. — Python
truthiness, so `{"enabled": "false"}` (a non-empty STRING) evaluated
as `True`. Confirmed this matches the real notifier's OWN behavior
(`dispatch.py` uses the same truthiness), so the block was
"accurate" about runtime behavior but misleading for an owner who
typed `"false"` meaning off. Fixed: `enabled`/`windows_toast.enabled`/
`ntfy.enabled` now require `type(x) is bool` exactly, else `STOP:
unexpected_shape`; `host`/`topic` must be `str` or absent/`null`;
`allowed_cwd_prefixes` must be a `list` of `str` (`is_cwd_allowed`
calls `.lower()` on each element — a non-string element would crash
the real notifier too). The additive-check's shape validator (added
for RK1 above) covers the equivalent nested-type requirement for
`hooks`/event-value/group/handler.

Re-tested, extracted from the final file: `{"enabled": "false"}`,
`{"ntfy": {"host": 123}}`, and `{"project_filter":
{"allowed_cwd_prefixes": ["ok", 5]}}` each produce `STOP:
unexpected_shape`; a genuinely valid, all-correctly-typed fixture
still produces the normal boolean output.

### RK3/RL3 — config STOP conditions + exact default-path documentation — **FIXED**

Step 2 now explicitly `STOP`s on `enabled: false`,
`windows_toast_enabled: false` (either makes every later test
meaningless), and treats `allowed_cwd_prefixes_empty: false` as
`UNKNOWN/STOP` unless the owner positively confirms `$DN_REPO` itself
matches one of the configured prefixes (case-insensitive
`startswith`, confirmed from `is_cwd_allowed`'s own source). Step 2
now states the EXACT default resolution order and values, read
directly from `config.py`: `DEV_NOTIFY_CONFIG_PATH` if set, else
`%LOCALAPPDATA%\dev-notify\config.json` (falling back to
`~\.local\share\dev-notify\config.json` only if `LOCALAPPDATA` itself
is unset); `DEFAULT_CONFIG` is `enabled: true`, `windows_toast.enabled:
true`, `ntfy.enabled: false` (host/topic `null`),
`allowed_cwd_prefixes: []`. Step 2 also now states explicitly that
the real notifier (`load_config`) silently falls back to these
defaults on ANY broken override (confirmed from its own `except
Exception: pass`), and that this runbook's own `STOP` on a broken
override is deliberately stricter than that real behavior, for this
runbook's own test-validity purposes only.

### RK4/RL4 — step ordering, Git Bash detection, same-window scope, mechanical stale-plan gate — **FIXED**

- **RK4a**: Step 0 now uses `Get-Command bash.exe -All` AND a second,
  `git.exe`-derived check, explicitly stating that
  `C:\Windows\System32\bash.exe` (WSL) is not a positive signal.
  **Real finding this round**: on the CC machine, `Get-Command
  bash.exe -All` printed NOTHING at all even though Git for Windows
  IS installed (only `git.exe` is on `PATH`, not `bash.exe` directly)
  — the `git.exe`-derived check correctly found the real
  `C:\Program Files\Git\bin\bash.exe` in that exact situation. The
  runbook now says to run both and treat the `git.exe`-derived one as
  the more reliable positive signal, rather than only presenting it
  as a fallback.
- **RK4b**: "run from the same PowerShell window, no `$env:` changes
  in between" now explicitly spans Step 2 through Step 6 and Step
  11's own CLI parts, not just Step 2's own neighborhood.
  AC-9/`code` is still its own separate case (Step 11).
  Step 9(2)/Step 12's stray "do not restart Codex" mention is removed
  — Codex is out of scope for this authorization entirely, so the
  sentence never made sense here.
- **RK4c**: reordered — the additive-check and `plan` (both read-
  only) now run BEFORE the baseline AC-2 timing turns (old Step 3(d),
  now Step 5), specifically so an already-registered hook (`no_op:
  true`) or a foreign handler is caught before two of the four CLI-
  turn budget is spent on a now-pointless baseline.
- **RL4**: the "stale plan" check is now fully mechanical (new
  Step 6, `$DN_StaleCheck`): a dedicated text-hash block run
  immediately before writing the authorization file, comparing the
  live settings file against Step 4's `before_sha256`. A match means
  Step 4's `plan` output is still valid and its three hash values go
  into the authorization; a mismatch means go back to Step 4 for a
  fresh `plan` and a fresh authorization — never a subjective "re-run
  `plan` if it seems necessary."

Re-tested end-to-end, extracted from the final file: a full `plan` ->
stale-check (match) -> `apply` -> backup-exists -> live-text-hash-vs-
`after_preview_sha256` -> tool-backup-text-hash-vs-`before_sha256` ->
pre-rollback staleness check -> `rollback` -> post-rollback text-hash-
vs-`before_sha256` -> `jsonequal`-vs-manual-backup chain, all against
a tempfile settings path, all produced the expected results in
sequence.

### RK5/RL5 — reporting gaps, real-unreadable-file test, filtered output as the default — **FIXED**

- **RK5a/RL5a**: this report (above) now explicitly shows the
  malformed-config, unreadable-file, and `no_op`-STOP cases that
  round 2's report omitted. The unreadable-file case was tested via a
  **genuine** `PermissionError` — a real file handle opened with
  `[System.IO.File]::Open(path, 'Open', 'ReadWrite', 'None')` (no
  sharing) held open in the SAME PowerShell session for the duration
  of the block's own run, not an injected/simulated exception. Result:
  `STOP: read_failed:PermissionError`, confirmed no path or message
  text in the output.
- **RL5b**: the `ModuleNotFoundError` test above (RK1 section) relies
  on `python -B -` putting the script's own `cwd` first in `sys.path`
  — noted here as a property of how the test was constructed, not a
  runbook requirement; a real run from `$DN_REPO` (as every step
  instructs) has the same ordering property, so this doesn't change
  anything about real usage.
- **RK5d/RL5d**: a new `Invoke-DNFilteredPatch` PowerShell function
  (defined once, at the top of the runbook) is now the DEFAULT way
  every `plan`/`apply`/`rollback` call is made — it checks
  `$LASTEXITCODE` BEFORE attempting `ConvertFrom-Json` (never treats
  empty/non-JSON output as a silent pass), and filters to
  `no_op`/`before_sha256`/`after_preview_sha256` (`plan`) or
  `applied`/`backup_path`/`after_preview_sha256` (`apply`) — the raw
  `diff` (containing real `permissions`) never needs to appear on
  screen for the default path. The un-filtered raw command is still
  given in each step, explicitly labeled as the off-screen-recording-
  only fallback.
- **RL5c**: tested directly in PowerShell 5.1, not assumed: with the
  default `$ErrorActionPreference` (`Continue`), `2>&1` on a failing
  native command (tested via `apply_config_patch.py claude rollback`
  with no `--backup`, a genuine exit code 2) wraps the stderr line
  into a `System.Management.Automation.ErrorRecord`
  (`NativeCommandError`) rather than a plain string — but
  `$LASTEXITCODE` was still correctly `2`, so the helper's own exit-
  code check (run BEFORE any parse attempt) catches this correctly
  regardless. With `$ErrorActionPreference = 'Stop'` set BEFORE the
  call, the SAME native-command failure instead THROWS a
  `RemoteException`, which would break naive `2>&1` capture entirely
  — `Invoke-DNFilteredPatch` handles both cases correctly because it
  forces `$ErrorActionPreference = 'Continue'` for the native call's
  own duration (in a `try`/`finally` that restores the caller's
  original setting immediately after) — tested under both starting
  preferences, confirmed correct in both.

### Not done / owner-pending (unchanged from rounds 1-2, restated)

No real `apply`/`rollback` against `.claude/settings.local.json`; no
`owner-authorisation.md` (owner-written only); no real Claude Code or
VSCode turn run or observed; no `setx`/registry/secret-store/network/
notifier call; no code or test change in `scripts/dev-notify/`; no
`.gitignore` change; `RH1`–`RH3` not claimed fixed; `diagnostic_dry_run.py`
not run under this authorization.

### Scope confirmation (read-only)

```
$ git status --porcelain=v1
 M docs/ai/CURRENT.md
?? docs/ai/tasks/ticket-498/approved-prompt-v10.md
?? docs/ai/tasks/ticket-498/approved-prompt-v8.md
?? docs/ai/tasks/ticket-498/approved-prompt-v9.md
?? docs/ai/tasks/ticket-498/windows-first-cc-report.md
?? docs/ai/tasks/ticket-498/windows-first-prompt-review.md
?? docs/ai/tasks/ticket-498/windows-first-result-review.md
?? docs/ai/tasks/ticket-498/windows-first-runbook.md
```
Only `windows-first-runbook.md`, this file, and `CURRENT.md` were
touched this round; the `approved-prompt-v8.md`/`-v9.md`/
`windows-first-prompt-review.md`/`windows-first-result-review.md`
entries predate this round. No `.gitignore` change. No application/
API/scoring/gating/payment code touched. No commit/push/GitHub
action.

### Round outcome

**`PREPARED_AWAITING_OWNER_ACTIVATION`** (per the approved prompt's
own instruction). RK1–RK5 and RL1–RL5 are addressed as described
above, including a dated correction of round 2's own overstated
"closed vocabulary" claim and several bugs found and fixed via real
Windows PowerShell 5.1 testing (an untrusted canary key name leaking
through the additive-check; several unguarded exception paths with
raw tracebacks/paths; a truthiness-based type check that silently
read a string `"false"` as "on"). `#498` remains open. Next step per
the workflow is Jonesy's result review on this report, in
`windows-first-result-review.md` ("CC búinn").

---

## Round 4 — RM1–RM4 / RO1–RO4 (2026-11-13, CC)

Executes `approved-prompt-v11.md` (Jonesy's RO1–RO4 folded onto their
own RM1–RM4 result review of round 3). **Preparation only — no
activation, no code/test change.** Windows 11, Python 3.14.0,
Windows PowerShell 5.1 (`5.1.26100.9818`) unless stated. Jonesy's own
contributions this round (RM1/RM2's interpretation, and the sandbox
findings cited under RO1–RO4 below) are their own Linux/Py3.13 work,
attributed to them, not re-run by CC.

### RM1/RO4 — manual backup not covered by the stale-plan gate — **FIXED**

Confirmed gap: Step 3(c)'s independent manual backup is taken once,
early. If Step 6's stale check later forces a fresh `plan` (because
the settings file changed), nothing previously re-checked whether the
manual backup still matched the NEW `before_sha256` — Step 12's own
`jsonequal` against that backup could then be comparing against a
backup that was never representative of the authorized state.

Fixed: Step 6 now runs the `$DN_HashCheck` "text" mode against
`$DN_MANUAL_BACKUP` too (same `before_sha256`), immediately after the
settings-file check. On mismatch, the runbook does NOT overwrite the
old manual backup — it takes a NEW one under a NEW local filename,
reassigns `$DN_MANUAL_BACKUP`, and sends the owner back to Step 4.

**RO4's own condition — a single continuous PowerShell 5.1 session,
using the runbook's own commands** (extracted from the final file,
only `<...>` placeholders substituted; not a fresh from-scratch
script): confirmed all four scenarios in one unbroken session,
against tempfiles only:
- **Same content**: settings-check and manual-backup-check both
  `matches_expected: true`.
- **Changed settings + fresh `plan`, OLD manual backup kept**: the
  settings-check correctly shows `true` against the NEW
  `before_sha256` (the settings file matches its own fresh plan), but
  the OLD manual-backup-check correctly shows `false` — exactly the
  gap RM1 identified, now mechanically caught.
- **Retake under a new filename + reassign the variable**: the NEW
  manual-backup-check shows `true`; the OLD backup file is confirmed
  **still present and byte-identical** (`Get-FileHash` before/after,
  no write ever touches it again — confirmed directly, not assumed).
- **Full `apply` -> `rollback` -> final verification**, using the
  NEW plan/backup pair end-to-end: tool backup matches the new
  `before_sha256`; after `rollback`, both the text-hash check (vs
  `before_sha256`) and the `jsonequal` check (vs the NEW manual
  backup) report `true`/`json_equal: true`.

(One early iteration of this test script had its own bug — a
PowerShell string-interpolation mistake, `"$base.FullName\..."`
instead of `"$($base.FullName)\..."`, which produced a bogus path
and a spurious `Resolve-Path` error for ONE of the "old backup
unchanged" checks. Confirmed this was a bug in the disposable test
script itself, not the runbook — the runbook's own documented
commands never use that interpolation pattern — and re-verified the
same claim cleanly with a corrected check: hash before write,
no write, hash after, identical.)

### RM2/RO3 — `project_aliases`/`issue_number` on the hook path — **FIXED**

Confirmed via direct `grep` over `cli_claude.py`, `cli_codex.py`,
`config.py`, `events.py`, `templates.py`, `dispatch.py`, `state.py`
(not assumed):
- `resolve_project_alias` (`config.py`) calls
  `cfg.get("project_aliases", {}).items()` — a non-`dict` value there
  (list/string/`null`) raises `AttributeError`, swallowed by
  `cli_claude.main()`'s own outer `except BaseException: pass` —
  meaning the hook silently exits 0 with **no notification at all**,
  indistinguishable from a suppressed/deduped one. A non-`str` alias
  VALUE (e.g. `{"C:\\a": 5}`) would flow straight into `NotifyEvent`
  unvalidated.
- `issue_number` IS read (`cfg.get("issue_number")`) into `NotifyEvent`
  by both `cli_claude.py` and `cli_codex.py` — but a `grep` for
  `issue_number`/`.issue_number` across `templates.py`, `dispatch.py`,
  and `state.py` returns **zero matches**. It is genuinely inert on
  this entire path. Per RO3(a)'s own framing, this is recorded as a
  plain fact about the current code, not as `UNKNOWN` (the usage WAS
  checked, and found absent) and not as a newly invented type
  contract.
- Confirmed (RO3(b)) that JSON object keys are always `str` after
  `json.loads` — so `project_aliases`' own KEYS need no validation;
  only checking its VALUES are `str` is meaningful.

Fixed: `$DN_ConfigCheck` now validates `project_aliases` is a `dict`
whose values are all `str` (else `STOP: unexpected_shape`) — never
printing an alias's own key or value either way. Step 2's own prose
now lists, confirmed via the same `grep` pass, exactly which config
keys the real hook path reads: `enabled`, `windows_toast.enabled`,
`ntfy.enabled`/`host`/`topic` (`dispatch.py`), `project_aliases`
(`resolve_project_alias`), `project_filter.allowed_cwd_prefixes`
(`is_cwd_allowed`) — and states `issue_number`'s inert status
plainly. `ntfy`'s remaining sub-keys are noted as reached only once
`ntfy.enabled` is already `true`, which Step 2 already treats as its
own STOP condition.

Re-tested, extracted from the final file: a non-`dict` `project_aliases`
and a `dict` with a non-`str` value both produce `STOP:
unexpected_shape`; a valid `dict`-of-`str` passes through to the
normal boolean output with no alias content printed.

### RM3/RO1 — stale cross-references, the STOP/exit-0 rule, `current_sha256` — **FIXED**

- **(a) Cross-references**: the intro's "see Step 8" (authorization
  is actually Step 7) is fixed; Step 0's "do not proceed past Step 6"
  is fixed to "do not write Step 7's authorization file" (already
  corrected in round 3's own text, reconfirmed unchanged this round);
  Step 1's "(Step 8)"/"(Step 6)" references are fixed to "(Step 7)"/
  "(Step 4, re-confirmed by Step 6)"; Step 7's "Step 6's own
  confirmed-fresh `plan`" is fixed to "Step 4's own `plan`,
  reconfirmed still fresh by Step 6" (Step 6 never runs `plan` itself,
  it only checks whether Step 4's is still valid).
- **(b)/RO1**: a dedicated section — "How every check below signals
  STOP," placed right after the `Invoke-DNFilteredPatch` helper,
  before Step 0 — now states explicitly that `exit 0` is never
  `PASS` by itself, and lists BOTH every `STOP:`-prefixed line AND
  every specific result field that means stop even at `exit 0`
  (`matches_expected: false`, `json_equal: false`,
  `permissions_equal: false`, `other_keys_unchanged: false`,
  `foreign_handlers_on_our_events` not `[]`,
  `unexpected_hook_events_present: true`, `no_op: true`,
  `applied: false`). Confirmed (sandbox cited by Jonesy, not
  re-run by CC) that `$DN_StaleCheck`/`$DN_HashCheck`/additive-check/
  `plan` all legitimately return `exit 0` in these "stop anyway"
  cases.
- **(c)**: the same new section states explicitly that a generic
  `STOP: unexpected:<TypeName>` (e.g. `AttributeError` for
  `{"hooks": null}`, `TypeError` for a nested null) is itself a
  valid, intended stop signal — no new error-classification code was
  added (per RM3/RO1's own explicit instruction not to build another
  error-classification engine); re-confirmed both cases still produce
  exactly those two type names, extracted from the final file.
- **(d)**: Step 12 now states explicitly that `current_sha256` in
  `rollback`'s own JSON output is the hash of the file's content
  BEFORE the restore (the still-patched state, captured by the tool
  as `rollback` starts, confirmed from `rollback_claude`'s own
  source) — not a hash of what got restored; the restore itself is
  verified separately by the two checks already in Step 12.

### RM4 — Step 0's `git.exe`-derived check: `False` is not a negative result — **FIXED**

Step 0 now states that a `False` from the `git.exe`-derived `bash.exe`
check is `UNKNOWN`, not "Git Bash is absent" — the derivation assumes
a `...\Git\cmd\git.exe` -> `...\Git\bin\bash.exe` layout, which does
not hold for e.g. `...\Git\mingw64\bin\git.exe` or a `scoop`/
`chocolatey` shim. Added `git --exec-path` as a secondary avenue, and
states that if neither approach finds it, the honest result is
`UNKNOWN`, consistent with "necessary, not sufficient" already
established for the positive case.

### RO2 — mechanical cross-reference and definition-order audit — **RUN, RESULTS BELOW**

A disposable script (outside the repo) parsed the final
`windows-first-runbook.md` directly and checked two things:

**(a) Every textual `Step N` reference resolves to a real heading.**
69 references found across the document (excluding the heading lines
themselves); **0** reference a step number with no matching `## Step
N` heading.

**(b) Each `$DN_*` block/function is defined exactly once, and used
only at or after its own definition line, in actual PowerShell CODE
(not prose).** `Invoke-DNFilteredPatch` (defined line 54, first code
use line 612), `$DN_ConfigCheck` (defined line 250, first code use
line 354), `$DN_AdditiveCheck` (defined line 485, first code use
line 586), `$DN_HashCheck` (defined line 656, first code use line
711) — all four: exactly one definition, first REAL usage strictly
after it. **One false positive worth stating honestly**: a naive
first pass (counting any line containing the name as a "use")
flagged `$DN_HashCheck` as "used" on line 652 — that line is prose
in Step 6's own introduction ("Step 9 and Step 12 below reuse this
same `` $DN_HashCheck `` variable...") announcing the definition two
lines above it, not executable PowerShell. The refined check (scoped
to lines inside ` ```powershell ` fences only) confirms this was
never a real ordering problem — reported both results rather than
silently keeping only the clean one.

### Not done / owner-pending (unchanged from rounds 1-3, restated)

No real `apply`/`rollback` against `.claude/settings.local.json`; no
`owner-authorisation.md` (owner-written only); no real Claude Code or
VSCode turn run or observed; no `setx`/registry/secret-store/network/
notifier call; no code or test change in `scripts/dev-notify/`; no
`.gitignore` change; `RH1`–`RH3` not claimed fixed; `diagnostic_dry_run.py`
not run under this authorization.

### Scope confirmation (read-only)

```
$ git status --porcelain=v1
 M docs/ai/CURRENT.md
?? docs/ai/tasks/ticket-498/approved-prompt-v10.md
?? docs/ai/tasks/ticket-498/approved-prompt-v11.md
?? docs/ai/tasks/ticket-498/approved-prompt-v8.md
?? docs/ai/tasks/ticket-498/approved-prompt-v9.md
?? docs/ai/tasks/ticket-498/windows-first-cc-report.md
?? docs/ai/tasks/ticket-498/windows-first-prompt-review.md
?? docs/ai/tasks/ticket-498/windows-first-result-review.md
?? docs/ai/tasks/ticket-498/windows-first-runbook.md
```
Only `windows-first-runbook.md`, this file, and `CURRENT.md` were
touched this round. No `.gitignore` change. No application/API/
scoring/gating/payment code touched. No commit/push/GitHub action.

### Round outcome

**`PREPARED_AWAITING_OWNER_ACTIVATION`** (per the approved prompt's
own instruction). RM1–RM4 and RO1–RO4 are addressed as described
above — a real gap closed (manual-backup staleness, RM1/RO4), several
facts about the real code confirmed via `grep` rather than assumed
(RM2/RO3), stale cross-references and an underspecified STOP rule
fixed (RM3/RO1), one overclaim softened to `UNKNOWN` (RM4), and a
mechanical audit of the final document's own internal consistency
run and reported, including a false positive found and explained
rather than hidden (RO2). `#498` remains open. Next step per the
workflow is Jonesy's result review on this report, in
`windows-first-result-review.md` ("CC búinn").
