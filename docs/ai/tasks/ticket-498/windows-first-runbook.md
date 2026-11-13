# #498 — Windows-first runbook: Claude Code CLI + VSCode activation

Owner-run. CC does not run any command in this file against a real
path, does not activate anything, and `apply`/`rollback` against the
real `.claude/settings.local.json` are owner-only actions. This
runbook is **preparation**, not an authorization — see Step 7 for
what actually permits the real `apply` step.

Scope: **Claude Code CLI, then VSCode, Windows-only.** Codex CLI/app
and ntfy/iPhone stay `NOT_ACTIVATED` — nothing here touches them.
`RH1`–`RH3` (test-hardening gaps from `result-review.md` round 7)
remain **unfixed** and are not claimed fixed by anything in this
document. For the broader checklist this runbook draws from, see
`activation-checklist.md` AC-1/AC-2/AC-3/AC-4/AC-9 — this file adds
the Windows-specific preconditions/corrections those steps need.

**Run the steps below in order.** Each later step assumes the
earlier ones already passed. **The three Python check-blocks below
(config-check, additive-check, hash-check) are safe to run against
an untrusted/malformed settings or config file** — every one of them
wraps its entire body in an error boundary that never prints a raw
exception message, path, or unexpected file content; see each
block's own comment for exactly what it reports instead.

### Project variables (fill in locally — PowerShell variables, never environment variables, never a reserved name like `$HOME`)

Run this once per PowerShell window before anything else below, with
your own real values:

```powershell
$DN_REPO     = "<ABSOLUTE PATH TO REPO ROOT>"
$DN_PYTHON   = "<ABSOLUTE PATH TO python.exe>"
$DN_SCRIPTS  = "$DN_REPO\scripts\dev-notify"
$DN_CLI      = "$DN_SCRIPTS\dev_notify\cli_claude.py"
$DN_PATCHCLI = "$DN_SCRIPTS\dev_notify\apply_config_patch.py"
$DN_SETTINGS = "$DN_REPO\.claude\settings.local.json"
```

These are **PowerShell session variables**, not `$env:` variables —
they never leak into any process this shell later starts.

**Also define this helper once** — it is the DEFAULT way this
runbook runs `plan`/`apply`/`rollback` from here on (RK5/RL5d): it
checks the exit code BEFORE attempting to parse anything (a nonzero
exit, or an exception raised by the tool itself, must never be
treated as empty-output-means-fine), and temporarily forces
`$ErrorActionPreference = 'Continue'` for the native call's own
duration regardless of your session's own setting, restoring it
afterward — measured this round: with `'Stop'` in effect, `2>&1` on
a failing native command THROWS instead of returning a capturable
`ErrorRecord`, which would otherwise break this helper.

```powershell
function Invoke-DNFilteredPatch {
    param([string[]]$PatchArgs)
    $priorEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $raw = & $DN_PYTHON $DN_PATCHCLI @PatchArgs 2>&1
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $priorEap
    }
    if ($exitCode -ne 0) {
        Write-Host "STOP: nonzero_exit:$exitCode"
        return $null
    }
    $text = ($raw | Out-String)
    if (-not $text.Trim()) {
        Write-Host "STOP: empty_output"
        return $null
    }
    try {
        return $text | ConvertFrom-Json
    } catch {
        Write-Host "STOP: json_parse_error"
        return $null
    }
}
```

This returns `$null` (with a `STOP: ...` already printed) on any
failure, or a parsed object on success. **This is the default way to
call `plan`/`apply`/`rollback` in every step below** — it never shows
the raw `diff` (which contains your real `permissions` list, WV3) on
screen or in a recording. The un-filtered raw command is shown too,
in each step, ONLY as the off-screen-recording fallback if something
about the filter itself seems wrong — never the default path.

### How every check below signals STOP — read this before Step 0 (RO1)

**`exit 0` alone is NEVER `PASS`.** Every check block below can
succeed (`exit 0`) while its own JSON output still means "stop here."
Two separate things to watch for, together, at every step:

1. **Any printed line starting with `STOP:`** (e.g.
   `STOP: unexpected:<TypeName>`, `STOP: read_failed:<TypeName>`,
   `STOP: no_localappdata`, `STOP: unknown_mode`, `STOP: bom`,
   `STOP: parse_failed`, `STOP: unexpected_shape`, `STOP:
   nonzero_exit:<code>`, `STOP: empty_output`, `STOP:
   json_parse_error`) — always stop, regardless of exit code.
2. **Any `exit != 0`** on its own, even with no `STOP:` text (e.g. a
   crash before any `print` ran).
3. **These specific result FIELDS, even when `exit` is `0` and
   nothing printed `STOP:`**:
   - `matches_expected: false` (hash-check) — the file is not what
     it should be.
   - `json_equal: false` (hash-check, `jsonequal` mode) — the two
     files disagree semantically.
   - `permissions_equal: false`, or `other_keys_unchanged: false`
     (additive-check) — something besides the hooks changed.
   - `foreign_handlers_on_our_events` is anything other than `[]`
     (additive-check) — something else already owns that hook event.
   - `unexpected_hook_events_present: true` (additive-check) — an
     unrelated event name exists on the file.
   - `no_op: true` (`plan`'s own output) — nothing would change;
     never `apply` on this.
   - `applied: false` (`apply`'s own output, after a real `--apply`
     attempt) — read `reason`/`detail` type name, do not retry
     blindly.

   A generic `STOP: unexpected:<TypeName>` (the catch-all boundary
   every block has) is ALSO a completely valid, intended stop signal
   for genuinely unanticipated input shapes (e.g. an explicit
   `{"hooks": null}` currently surfaces as `STOP: unexpected:
   AttributeError` from inside the additive-check's own guarded
   `merge_claude_hooks` call) — treat it exactly like any other
   `STOP:` line, nothing further to diagnose from the type name alone.

---

## Step 0 — Confirm the shell Claude Code actually uses (WV1, RK4a)

Claude Code hook commands run as shell syntax. The registered hook
command is `"<python.exe>" "<cli_claude.py>"` — valid in bash/Git
Bash, but in PowerShell `"a" "b"` is a syntax error and the hook
**never runs at all**. Because the hook is `async: true` and silent,
"no notification" from a broken hook looks IDENTICAL to a
suppressed/deduped one.

```powershell
Get-Command bash.exe -All -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
```

**Read every path returned, don't just check "something was found" —
and don't assume nothing printing here means Git Bash is absent.**
Measured this round: on a normal Git for Windows install, `bash.exe`
is often NOT on `PATH` at all (only `git.exe` is) — this command can
print NOTHING even though Git Bash is genuinely installed. Separately,
`C:\Windows\System32\bash.exe` (the WSL launcher) commonly shows up
here too on a machine with WSL enabled — **that one is NOT Git for
Windows and does not count as a positive signal.** Only a path
physically inside a Git for Windows install (e.g.
`...\Git\bin\bash.exe` or `...\Git\usr\bin\bash.exe`) counts.

**Run this second check too — it's the more reliable one** (confirmed
this round: it found the real Git Bash on a machine where the command
above printed nothing at all), deriving the path from `git.exe`'s own
install location instead of relying on `bash.exe` being on `PATH`:

```powershell
$gitExe = (Get-Command git.exe -ErrorAction SilentlyContinue).Source
if ($gitExe) { Test-Path (Join-Path (Split-Path (Split-Path $gitExe)) "bin\bash.exe") }
```
`True` here is a genuine positive signal for Git Bash being installed
even when the first command found nothing. **`False` here is NOT a
negative result — it's `UNKNOWN`, not "Git Bash is absent."** This
derivation assumes a layout like `...\Git\cmd\git.exe` ->
`...\Git\bin\bash.exe`; it gives a false `False` for other common,
legitimate layouts — e.g. `...\Git\mingw64\bin\git.exe` (one extra
directory level), or a `scoop`/`chocolatey`-managed install where
`git.exe` on `PATH` is a shim pointing somewhere else entirely. If
`False`, try `git --exec-path` (prints a real path inside the actual
install, more reliable than guessing from `git.exe`'s own location)
and look for `bash.exe` nearby, or check manually from the Start
Menu / known install location. If NEITHER approach finds it, the
honest result is `UNKNOWN` — not "Git Bash is not installed."

**Even finding a genuine Git for Windows `bash.exe` is necessary but
NOT sufficient** — Claude Code can still be configured to use
PowerShell regardless. If this cannot be positively confirmed by
other means (the CLI's own settings/docs for this installed
version), record it as `UNKNOWN` — do not guess, and do not write
Step 7's authorization file without it.

VSCode's own shell for the same hook events is a SEPARATE `UNKNOWN`
until Step 11's AC-9 — never assumed to match the CLI's.

---

## Step 1 — Confirm the local Python and Claude Code version

```powershell
& $DN_PYTHON -c "import sys; print(sys.version_info[:2], sys.executable)"
```

**Criterion: Python must be >= 3.11.** `apply_config_patch.py`
imports `tomllib` at module top level — on an older interpreter this
raises `ImportError` before anything else runs, for the `claude`
target too, not just `codex`. Confirm the version printed is
`(3, 11)` or higher.

Also confirm:
- the path printed is the REAL interpreter (not a Microsoft Store
  alias, not a venv that can later disappear);
- Claude Code CLI is installed, and note its version;
- **this exact Python path and `cli_claude.py`'s path must not move
  or change for the lifetime of one authorization** (Step 7) — a
  change means a fresh `plan` (Step 4, re-confirmed by Step 6) and a
  fresh authorization, not a reused one.

---

## Step 2 — Confirm the ACTIVE local notify config (WV4, RK3, RL2, RL3)

**Must be read from the environment the hook process itself starts
from (Claude Code's own process now; VSCode's own process later for
AC-9) — never a PowerShell window you just happened to open.**
`DEV_NOTIFY_CONFIG_PATH` (if set) and the resulting config file are
what `config.py` reads in THAT process.

**Exact resolution order, from the real code**: `DEV_NOTIFY_CONFIG_PATH`
if set, else `%LOCALAPPDATA%\dev-notify\config.json` (falling back to
`~\.local\share\dev-notify\config.json` only if `LOCALAPPDATA` itself
is unset, which is unusual on a normal Windows account). **If no
override file exists at all, the real defaults are**: `enabled: true`,
`windows_toast.enabled: true`, `ntfy.enabled: false` (host/topic
`null`), `project_filter.allowed_cwd_prefixes: []` (empty — see
below for what that means) — this is `DEFAULT_CONFIG` in `config.py`,
not a guess.

**Important: the real notifier (`load_config`) silently falls back to
these defaults if an override file exists but is broken** (wrong
JSON, wrong types) — a broken override never blocks a real
notification. **This check below is deliberately STRICTER than that**
— it `STOP`s on a broken override rather than silently treating it
as "fine," because for THIS runbook's purposes a broken override
means you don't actually know what the hook will do, which makes any
test result meaningless, even though the real code would just use
defaults.

Run this in the SAME PowerShell window you will use for every step
from here through Step 11's CLI parts (RK4b) — do not change `$env:`
values in this window afterward without re-running this check:

```powershell
$DN_CFG_ARG = if ($env:DEV_NOTIFY_CONFIG_PATH) { $env:DEV_NOTIFY_CONFIG_PATH } else { "NONE" }
$DN_LAD_ARG = if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } else { "NONE" }

$DN_ConfigCheck = @'
import sys
import json

def _main(config_path_arg, localappdata_arg):
    from pathlib import Path
    if config_path_arg == "NONE":
        config_path_arg = ""
    if localappdata_arg == "NONE":
        localappdata_arg = ""
    out = {"override_env_set": bool(config_path_arg), "override_path_exists": None,
           "override_parse_ok": None, "enabled": None, "windows_toast_enabled": None,
           "ntfy_enabled": None, "ntfy_host_present": None, "ntfy_topic_present": None,
           "allowed_cwd_prefixes_empty": None}
    if config_path_arg:
        p = Path(config_path_arg)
    else:
        if not localappdata_arg:
            print("STOP: no_localappdata")
            return 1
        p = Path(localappdata_arg) / "dev-notify" / "config.json"
    out["override_path_exists"] = p.exists()
    if not p.exists():
        if config_path_arg:
            print("STOP: override_env_set_but_file_missing")
            return 1
        print(json.dumps(out))
        return 0
    try:
        text = p.read_text(encoding="utf-8")
    except OSError as e:
        print("STOP: read_failed:" + type(e).__name__)
        return 1
    if text.startswith("\ufeff"):
        print("STOP: bom")
        return 1
    try:
        cfg = json.loads(text)
    except Exception:
        print("STOP: parse_failed")
        return 1
    if not isinstance(cfg, dict):
        print("STOP: unexpected_shape")
        return 1
    enabled_raw = cfg.get("enabled", True)
    if not isinstance(enabled_raw, bool):
        print("STOP: unexpected_shape")
        return 1
    wt = cfg.get("windows_toast", {})
    if not isinstance(wt, dict):
        print("STOP: unexpected_shape")
        return 1
    wt_enabled_raw = wt.get("enabled", True)
    if not isinstance(wt_enabled_raw, bool):
        print("STOP: unexpected_shape")
        return 1
    ntfy = cfg.get("ntfy", {})
    if not isinstance(ntfy, dict):
        print("STOP: unexpected_shape")
        return 1
    ntfy_enabled_raw = ntfy.get("enabled", False)
    if not isinstance(ntfy_enabled_raw, bool):
        print("STOP: unexpected_shape")
        return 1
    host = ntfy.get("host")
    if host is not None and not isinstance(host, str):
        print("STOP: unexpected_shape")
        return 1
    topic = ntfy.get("topic")
    if topic is not None and not isinstance(topic, str):
        print("STOP: unexpected_shape")
        return 1
    pf = cfg.get("project_filter", {})
    if not isinstance(pf, dict):
        print("STOP: unexpected_shape")
        return 1
    prefixes = pf.get("allowed_cwd_prefixes", [])
    if not isinstance(prefixes, list) or not all(isinstance(x, str) for x in prefixes):
        print("STOP: unexpected_shape")
        return 1
    aliases = cfg.get("project_aliases", {})
    if not isinstance(aliases, dict) or not all(isinstance(v, str) for v in aliases.values()):
        print("STOP: unexpected_shape")
        return 1
    out["override_parse_ok"] = True
    out["enabled"] = enabled_raw
    out["windows_toast_enabled"] = wt_enabled_raw
    out["ntfy_enabled"] = ntfy_enabled_raw
    out["ntfy_host_present"] = bool(host)
    out["ntfy_topic_present"] = bool(topic)
    out["allowed_cwd_prefixes_empty"] = (len(prefixes) == 0)
    print(json.dumps(out))
    return 0

try:
    rc = _main(sys.argv[1], sys.argv[2])
except SystemExit:
    raise
except BaseException as e:
    print("STOP: unexpected:" + type(e).__name__)
    rc = 1
sys.exit(rc)
'@

$DN_ConfigCheck | & $DN_PYTHON -B - $DN_CFG_ARG $DN_LAD_ARG
```

This prints **only booleans/presence flags** — never the config
file's own content, never a raw exception message or path, never an
alias's own key or value. Values are passed as **argv**, never
`$env:` assignments inside the piped script. (An empty-string
PowerShell argument is silently DROPPED by native-command argument
passing — confirmed this round — which is why `"NONE"` is used as an
explicit "not set" sentinel rather than `""`.) Every field is
**type-checked strictly** — e.g. `{"enabled": "false"}` (a STRING,
not a boolean) is treated as `STOP: unexpected_shape`, never silently
read as truthy "on" (which is what the real notifier code's own
truthiness check WOULD do — this check is deliberately stricter here
too). `project_aliases` is validated as a `dict` whose VALUES are all
`str` — its own keys need no separate check, since every JSON object
key is already a string after `json.loads` (there is no way to get a
non-string key from parsing JSON at all).

**Exactly which config keys the real hook path reads** (RO3,
confirmed this round via `grep` over `dispatch.py`/`config.py`/
`cli_claude.py`, not assumed): `enabled`, `windows_toast.enabled`,
and `ntfy.enabled`/`host`/`topic` (`dispatch.py` — this check's own
STOP conditions below already cover all of these); `project_aliases`
(`resolve_project_alias`, used by `cli_claude._run`); `project_filter.
allowed_cwd_prefixes` (`is_cwd_allowed`, used by `cli_claude._run`).
`ntfy`'s other sub-keys (`token_secret_path`, `timeout_s`, `port`,
the call-count/byte limits) are only ever read once `ntfy.enabled` is
already `true` — which this check already treats as its own STOP
condition below, so they're never reached in a state this runbook
lets you continue past. **`issue_number` is read into `NotifyEvent`
by `cli_claude.py`/`cli_codex.py`, but confirmed (via the same `grep`
pass) that NOTHING downstream — `templates.py`, `dispatch.py`,
`state.py` — ever reads it back out.** It is genuinely inert on this
entire path; this check does not validate its type or value, and
this is a documented fact about the real code, not an `UNKNOWN` and
not a new contract invented for this runbook.

**STOP/UNKNOWN conditions** (do not proceed to Step 3 on any of
these):
- `STOP: override_env_set_but_file_missing` / `STOP: parse_failed` /
  `STOP: bom` / `STOP: unexpected_shape` — an override file exists
  but is broken or the wrong shape. Never read this as "falls back
  to defaults, so it's fine" — that's true for the real notifier, not
  for this test's own validity.
- `enabled: false` -> **STOP** — no notification of any kind would
  fire; nothing below would be testable.
- `windows_toast_enabled: false` -> **STOP** — same reason, specific
  to the Windows surface this runbook is activating.
- `ntfy_enabled: true`, OR `ntfy_host_present`/`ntfy_topic_present`
  are `true` -> **STOP** — changing that is its own separate decision
  with its own backup/rollback/authorization.
- `allowed_cwd_prefixes_empty: false` -> **UNKNOWN/STOP** unless you
  can positively confirm the repo root (`$DN_REPO`) itself falls
  under one of the configured prefixes — matching is case-insensitive
  `startswith` (`is_cwd_allowed`), and an empty list means NO filter
  at all (everything allowed); a non-empty list you haven't checked
  against `$DN_REPO` could silently suppress every notification this
  runbook tries to observe.
- All fields `null` with `override_path_exists: false` and
  `override_env_set: false` -> this is the **"no override file"**
  case — defaults apply as documented above; this is a normal,
  continuable state, not a STOP.

---

## Step 3 — Preconditions: limits, file state, independent backup (WV2, WV6)

Do this BEFORE any `plan`/`apply` — all three parts, in order:

**(a) Agree the limits for this whole test window, before spending
any turns.** Accepted: **20 minutes; <=4 CLI turns total (this
INCLUDES the two baseline turns in Step 5 AND the two post-`apply`
measurement turns in Step 11 — there is no separate budget for
those); <=2 VSCode turns; <=6 visible notifications total,
`idle_prompt` included; 0 ntfy HTTP calls; 0 notifier network bytes.**
These are an **owner count**, not a technical enforcement. Reaching
the `<=6` notification limit mid-test means you STOP there — that is
this authorization's own boundary, not a "failure." Never run a
deliberately destructive/erroring command just to trigger a
permission prompt or a failure notification.

**(b) Confirm the settings file and `.claude/` folder already exist.**
If `.claude\` itself is missing, `apply` raises `FileNotFoundError`
outright this round — **STOP**, do not create it here (out of scope
for this authorization). If the FOLDER exists but the FILE does not,
`apply` would create it but return a `backup_path` that is **never
actually written** — a later `rollback` against that path fails with
`FileNotFoundError`. This authorization does **not** cover the
"create an empty `{}` first" workaround — if the file doesn't exist
yet, **STOP** and treat it as a separate, smaller follow-up decision.

```powershell
Test-Path $DN_SETTINGS
Test-Path (Split-Path $DN_SETTINGS -Parent)
```
Both must print `True` to continue.

**(c) Take your own independent backup, with a byte-hash check.**
This is separate from whatever `apply` itself backs up (its backup
lives right next to the file it's patching — a problem with that
directory affects both copies):

```powershell
$DN_MANUAL_BACKUP = "<ABSOLUTE PATH OUTSIDE THE REPO, e.g. a folder in your own Documents>\settings.local.json.manual-backup"
Copy-Item -Path $DN_SETTINGS -Destination $DN_MANUAL_BACKUP
(Get-FileHash -Algorithm SHA256 -Path $DN_SETTINGS).Hash -eq (Get-FileHash -Algorithm SHA256 -Path $DN_MANUAL_BACKUP).Hash
```
Must print `True` — this is a **byte-hash** (`Get-FileHash`)
comparison, valid here because it's a literal file copy with nothing
in between. **Byte-hash is NOT the right comparison for anything
written by the tool itself later** — see Step 9's own note on why
(RJ1/RK2).

---

## Step 4 — Early read-only gate: additive-check + `plan`, BEFORE spending any turns (RK4c)

**Do this before Step 5's baseline timing.** If the hook is already
registered (`no_op: true`) or something unexpected is already on
these three events, you want to know BEFORE burning two of your four
CLI turns on a baseline measurement that would turn out to be
pointless.

**Additive-only check** (RL1/RL2 — in-memory `merge_claude_hooks`,
the SAME function/inputs `plan`/`apply` use; strict shape validation
at every nesting level before touching the untrusted file; never
prints a raw/foreign key name from the file, only fixed, known
vocabulary):

```powershell
$DN_AdditiveCheck = @'
import sys
import json
import hashlib
from pathlib import Path

KNOWN_EVENTS = ("Notification", "Stop", "StopFailure")

def _validate_hooks_shape(hooks):
    if hooks is None:
        return True
    if not isinstance(hooks, dict):
        return False
    for ev, groups in hooks.items():
        if not isinstance(groups, list):
            return False
        for group in groups:
            if not isinstance(group, dict):
                return False
            handlers = group.get("hooks")
            if handlers is None:
                continue
            if not isinstance(handlers, list):
                return False
            for h in handlers:
                if not isinstance(h, dict):
                    return False
    return True

def _main(scripts_dir, settings_path, python_exe, cli_path):
    sys.path.insert(0, scripts_dir)
    from dev_notify.apply_config_patch import merge_claude_hooks
    p = Path(settings_path)
    if not p.exists():
        print("STOP: settings_missing")
        return 1
    try:
        text = p.read_text(encoding="utf-8")
    except OSError as e:
        print("STOP: read_failed:" + type(e).__name__)
        return 1
    if text.startswith("\ufeff"):
        print("STOP: bom")
        return 1
    try:
        before = json.loads(text)
    except Exception:
        print("STOP: parse_failed")
        return 1
    if not isinstance(before, dict):
        print("STOP: unexpected_shape")
        return 1
    if not _validate_hooks_shape(before.get("hooks")):
        print("STOP: unexpected_shape")
        return 1
    before_perms = before.get("permissions")
    after = merge_claude_hooks(before, python_exe, cli_path)
    after_perms = after.get("permissions")
    permissions_equal = (before_perms == after_perms)
    before_keys = set(before.keys())
    after_keys = set(after.keys())
    new_top_keys = sorted(after_keys - before_keys)
    other_keys_unchanged = all(before.get(k) == after.get(k) for k in before_keys if k != "hooks")
    after_hooks = after.get("hooks")
    after_hook_event_keys = set(after_hooks.keys()) if isinstance(after_hooks, dict) else set()
    known_set = set(KNOWN_EVENTS)
    hook_events_present = sorted(known_set & after_hook_event_keys)
    unexpected_hook_events_count = len(after_hook_event_keys - known_set)
    unexpected_hook_events_present = unexpected_hook_events_count > 0
    our_command = '"' + python_exe + '" "' + cli_path + '"'
    foreign_handlers = []
    for ev in KNOWN_EVENTS:
        for group in (before.get("hooks") or {}).get(ev, []):
            for h in group.get("hooks", []):
                if h.get("command") != our_command:
                    foreign_handlers.append(ev)
    full_hash = hashlib.sha256(our_command.encode("utf-8")).hexdigest()
    out = {
        "permissions_equal": permissions_equal,
        "new_top_level_keys": new_top_keys,
        "other_keys_unchanged": other_keys_unchanged,
        "hook_events_present": hook_events_present,
        "unexpected_hook_events_count": unexpected_hook_events_count,
        "unexpected_hook_events_present": unexpected_hook_events_present,
        "foreign_handlers_on_our_events": sorted(set(foreign_handlers)),
        "command_sha256_full": full_hash,
        "command_sha256_short": full_hash[:12],
    }
    print(json.dumps(out))
    return 0

try:
    rc = _main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
except SystemExit:
    raise
except BaseException as e:
    print("STOP: unexpected:" + type(e).__name__)
    rc = 1
sys.exit(rc)
'@

$DN_AdditiveCheck | & $DN_PYTHON -B - $DN_SCRIPTS $DN_SETTINGS $DN_PYTHON $DN_CLI
```

**Criteria — all must hold, or STOP**:
1. `permissions_equal: true`.
2. `new_top_level_keys` is `["hooks"]` and nothing else;
   `other_keys_unchanged: true`.
3. `hook_events_present` only ever shows the intersection with the
   three known names — it is never the raw, untrusted key list from
   your settings file. `unexpected_hook_events_present` must be
   `false` (an unrelated/unexpected event name exists on the file if
   `true` — STOP, do not guess what it is from this output alone;
   inspect the real file by hand if you need to know what it is).
4. `foreign_handlers_on_our_events` is `[]` — any of the three fixed
   names listed here means something else is ALREADY registered on
   that event with a different command. **STOP**, do not guess how
   to merge it.
5. `command_sha256_full` — **write this down**. The SHORT hash is
   only a quick visual cross-check, never the binding reference by
   itself.

**Now run `plan` itself** (filtered by default, per the helper
defined at the top of this document):

```powershell
Push-Location $DN_REPO
$DN_PlanResult = Invoke-DNFilteredPatch -PatchArgs @("claude", "plan", "--path", $DN_SETTINGS, "--python-exe", $DN_PYTHON, "--cli-path", $DN_CLI)
Pop-Location
if ($DN_PlanResult) { $DN_PlanResult | Select-Object no_op, before_sha256, after_preview_sha256 }
```

**If `no_op` is `true`: STOP. Never `apply`** — the hook is already
registered exactly as planned; applying again only creates/overwrites
a backup for no behavioral change (Step 9's own note) and proves
nothing. If you need the raw `diff` for some reason, the un-filtered
call is `& $DN_PYTHON $DN_PATCHCLI claude plan --path $DN_SETTINGS --python-exe $DN_PYTHON --cli-path $DN_CLI` —
remember it prints your real `permissions` list verbatim (WV3), never
on screen during a recording, never pasted anywhere.

**Write down `before_sha256` and `after_preview_sha256` from this
`plan`'s own output** — Step 6 will check whether they're still
valid right before authorization.

---

## Step 5 — Baseline AC-2 timing, now that Step 4 has ruled out a pointless measurement (RK4c)

End two ordinary, **tool-less** CLI turns (no permission prompt, no
"Always allow" — a turn that writes to `settings.local.json` would
invalidate Step 4's own hashes) and time the delay before the next
prompt is ready, each as its own number (seconds). These TWO numbers
are your baseline for Step 11's own rule — write them down now. These
two turns count toward the `<=4 CLI turns` budget from Step 3(a).
After these two turns, confirm `$DN_SETTINGS` was NOT modified (a
quick re-run of Step 4's `plan` call, checking `before_sha256` is
unchanged, is sufficient) — if it changed, start this step over.

---

## Step 6 — Final `plan`, with a mechanical stale-plan gate, right before authorization (RL4, RM1)

Run this **immediately before** writing the authorization file in
Step 7 — not any earlier, and re-run it if anything could have
touched the settings file since Step 4. **This is also the first use
— and the one, single definition for the rest of this runbook — of
the hash-check block** (RM1/RO2: defined once, here, before its first
use; Step 9 and Step 12 below reuse this same `$DN_HashCheck`
variable without redefining it):

```powershell
$DN_HashCheck = @'
import sys
import json
import hashlib
from pathlib import Path

def _text_sha256(path_str):
    try:
        text = Path(path_str).read_text(encoding="utf-8")
    except OSError as e:
        return None, "read_failed:" + type(e).__name__
    if text.startswith("\ufeff"):
        return None, "bom"
    return hashlib.sha256(text.encode("utf-8")).hexdigest(), None

def _main(mode, path_a, path_b_or_expected):
    if mode == "text":
        h, err = _text_sha256(path_a)
        if h is None:
            print("STOP: " + err)
            return 1
        out = {"text_sha256": h}
        if path_b_or_expected != "NONE":
            out["matches_expected"] = (h == path_b_or_expected)
        print(json.dumps(out))
        return 0
    if mode == "jsonequal":
        try:
            a_text = Path(path_a).read_text(encoding="utf-8")
            b_text = Path(path_b_or_expected).read_text(encoding="utf-8")
        except OSError as e:
            print("STOP: read_failed:" + type(e).__name__)
            return 1
        try:
            a = json.loads(a_text)
            b = json.loads(b_text)
        except Exception:
            print("STOP: parse_failed")
            return 1
        print(json.dumps({"json_equal": a == b}))
        return 0
    print("STOP: unknown_mode")
    return 1

try:
    rc = _main(sys.argv[1], sys.argv[2], sys.argv[3])
except SystemExit:
    raise
except BaseException as e:
    print("STOP: unexpected:" + type(e).__name__)
    rc = 1
sys.exit(rc)
'@

$DN_BEFORE_SHA = "<before_sha256 FROM STEP 4's plan OUTPUT>"
$DN_HashCheck | & $DN_PYTHON -B - "text" $DN_SETTINGS $DN_BEFORE_SHA
```

**If `matches_expected: false`**: the settings file changed since
Step 4's `plan` — it is now stale. Go back to Step 4, re-run the
additive-check and `plan`, and use the NEW `before_sha256`/
`after_preview_sha256`/`command_sha256_full` everywhere below. **Do
not reuse Step 4's old values** once this check fails once.

**Now check your Step 3(c) independent manual backup too — RM1**
(the stale-settings check above does NOT, by itself, prove the
manual backup is still representative of the SAME `before_sha256`;
it only proves the settings file's CURRENT content matches it):

```powershell
$DN_HashCheck | & $DN_PYTHON -B - "text" $DN_MANUAL_BACKUP $DN_BEFORE_SHA
```

**If this `matches_expected: false`** (even though the settings
check above passed): your Step 3(c) manual backup is stale — it was
taken against an earlier settings state than the one `before_sha256`
now refers to. **Do not overwrite the old manual backup file.** Take
a NEW one under a NEW local filename (e.g. append a second
timestamp), point `$DN_MANUAL_BACKUP` at the new file, and repeat
Step 4 before writing the authorization file — this is exactly Step
3(c)'s own procedure, just re-run with a fresh destination name:

```powershell
$DN_MANUAL_BACKUP = "<SAME DIRECTORY, A NEW FILENAME, e.g. ...manual-backup-2>"
Copy-Item -Path $DN_SETTINGS -Destination $DN_MANUAL_BACKUP
(Get-FileHash -Algorithm SHA256 -Path $DN_SETTINGS).Hash -eq (Get-FileHash -Algorithm SHA256 -Path $DN_MANUAL_BACKUP).Hash
```
The OLD manual backup file is left on disk, untouched — it's harmless
history, not something to clean up mid-procedure, and keeping it
means nothing is lost if you need to compare later.

**Only once BOTH checks show `matches_expected: true`** — settings
AND manual backup, against the SAME `before_sha256` — is Step 4's
`plan` output still valid. Use its `before_sha256`,
`after_preview_sha256`, and the additive-check's `command_sha256_full`
in Step 7's authorization file — this mechanical check is what
"still valid" means, not a judgment call.

---

## Step 7 — Authorization (WV5) — only a dated owner file permits Step 8

**Do not `apply` on "Prompt approved" alone, and not on an expired
waiting period — only on a dated owner authorization file.** `NT1`
stands: prompt approval authorizes PREPARING this runbook, never the
real `apply`.

The owner writes a **new** file — e.g. `owner-authorisation.md` in
this task directory — containing, with **no real absolute paths or
personal strings**:
- the settings path, **repo-relative** (`.claude/settings.local.json`),
  never the real absolute path;
- date and the owner's name;
- surface + scope: Claude CLI + VSCode, Windows-only; Codex/ntfy
  remain `NOT_ACTIVATED`;
- the limits from Step 3(a);
- **`before_sha256`, `after_preview_sha256`, and `command_sha256_full`,
  all from Step 4's own `plan`, reconfirmed still fresh by Step 6**
  (RK2c) — all three
  are hashes, never secrets, and safe to record; a short/truncated
  hash is never sufficient as the binding reference, only as a quick
  visual aid;
- a note that the real absolute paths are kept locally, outside the
  repo.

This file is written and signed **by the owner only** — CC never
fills it in, never signs it. `owner-activation-template.md` (the
broader Claude+Codex+ntfy template) stays unfilled; this is a
separate, narrower, Claude-CLI-only record. It covers exactly ONE
`apply` + its own rollback — a later change needs a fresh Step 4
`plan` and a fresh dated authorization.

---

## Step 8 — `apply`, once (RK5d)

Only after Step 7's file exists. Filtered by default:

```powershell
Push-Location $DN_REPO
$DN_ApplyResult = Invoke-DNFilteredPatch -PatchArgs @("claude", "apply", "--apply", "--path", $DN_SETTINGS, "--python-exe", $DN_PYTHON, "--cli-path", $DN_CLI)
Pop-Location
if ($DN_ApplyResult) { $DN_ApplyResult | Select-Object applied, backup_path, after_preview_sha256 }
```

**Read**: `applied` (must be `true`) and the real `backup_path`.
`exit 0` alone is never `PASS`. Un-filtered fallback (off-screen-
recording only):
`& $DN_PYTHON $DN_PATCHCLI claude apply --apply --path $DN_SETTINGS --python-exe $DN_PYTHON --cli-path $DN_CLI`.

---

## Step 9 — Immediate post-`apply` verification (WV2, RK2)

Do this **immediately**, before anything else touches the file:

**(1) Confirm the backup actually exists:**
```powershell
$DN_BACKUP = "<backup_path FROM apply'S OWN OUTPUT>"
Test-Path $DN_BACKUP
```
Must be `True` — a precondition for calling Step 8 `PASS`, not
optional.

**(2) Confirm the LIVE settings file's TEXT-hash matches the
authorized `after_preview_sha256`.** This is a **text-hash**, not a
byte-hash — `before_sha256`/`after_preview_sha256` are SHA-256 of the
file's TEXT after universal-newline decoding (`Path.read_text`'s own
CRLF->LF translation), exactly what the tool's own `sha256_of_text()`
computes. Measured this round (reproduced directly on Windows): the
SAME semantic JSON content with LF vs CRLF line endings produces the
SAME text-hash but DIFFERENT `Get-FileHash` byte-hashes — because
`Path.write_text` (used by `apply`, `rollback`, and the tool's own
backup) writes `\n` as `\r\n` on Windows. Using the SAME
`$DN_HashCheck` block Step 6 already defined:

```powershell
$DN_AFTER_PREVIEW_SHA = "<after_preview_sha256 FROM YOUR AUTHORIZATION FILE>"
$DN_HashCheck | & $DN_PYTHON -B - "text" $DN_SETTINGS $DN_AFTER_PREVIEW_SHA
```
`matches_expected` must be `true`. If not: **STOP**, diagnose first,
`rollback` (Step 12) if needed.

**(3) Confirm the TOOL's OWN backup is exactly the pre-`apply` text**
(RK2a — this is the correct check here, NOT a `jsonequal` comparison
against the live patched file, which would only prove the backup is
valid JSON, not that it's the right content):
```powershell
$DN_BEFORE_SHA = "<before_sha256 FROM YOUR AUTHORIZATION FILE>"
$DN_HashCheck | & $DN_PYTHON -B - "text" $DN_BACKUP $DN_BEFORE_SHA
```
`matches_expected` must be `true`.

**(4) Move the backup, or exclude it, before any broad `git add` —
then re-run (3) against the NEW location.** The backup file is
**NOT covered by `.gitignore`** — it sits next to
`.claude/settings.local.json` as
`settings.local.json.bak-<UTC-timestamp>` and contains your real
`permissions` list; `.gitignore` only excludes the exact name
`.claude/settings.local.json`. Either move `$DN_BACKUP` to a location
outside the repo, or add it to your own untracked
`.git/info/exclude` — as **one step** that updates both the move and
the `$DN_BACKUP` variable's value. No change to the tracked
`.gitignore` happens under this authorization. **After moving, re-run
step (3) above against the new `$DN_BACKUP` path** — confirming the
move didn't corrupt or truncate it, before trusting it for a later
rollback.

**No Codex restart step applies here** — this authorization is
Claude CLI/VSCode only; nothing in this step touches Codex.

---

## Step 10 — `/hooks` registration check (WV1)

In a **genuinely NEW** Claude Code CLI session (registration is
picked up from the settings file; a session already running before
`apply` may not see it):

```
/hooks
```

**Read**: are `Notification`/`Stop`/`StopFailure` listed with the
expected command? **This confirms REGISTRATION, not execution** —
necessary but not sufficient; only a real, seen notification
(Step 11) proves the hook actually ran. Step 0's shell question still
applies regardless of what `/hooks` shows.

---

## Step 11 — Real testing, owner-run: AC-2 -> AC-3 -> AC-9 (WF2, RJ4)

Use `activation-checklist.md`'s own AC-2/AC-3/AC-9 wording for
PASS/FAIL/UNKNOWN; this step only pins down the exact AC-2 method.
Run the CLI parts (steps 1-2 below) from the SAME checked-over
PowerShell window as Steps 2 and 4-6 (RK4b) — do not change `$env:`
values in it first.

**AC-2 timing rule (RJ4 — use exactly this, it fits inside the turn
budget):**
1. You already have TWO baseline measurements from Step 5, taken
   before the hook existed.
2. Now take TWO MORE measurements, each a normal, tool-less CLI
   turn's own delay before the next prompt is ready, with the hook
   now active — these are also your AC-3 visual-observation turns.
3. `delta` = (higher of the two POST measurements) - (higher of the
   two BASELINE measurements). Negative delta is allowed.
4. **`delta < 3s` -> timing `PASS`** for AC-2, provided the two
   baseline measurements themselves don't differ from each other by
   >=1.5s (if they do, the baseline itself is too noisy — `UNKNOWN`,
   not `PASS`, and do not add extra measurement turns without a new
   authorization).
5. **`delta >= 3s` in EITHER post-measurement -> `FAIL`.** Roll back
   immediately (Step 12) — do not proceed to AC-9.
6. Insufficient/inconsistent measurements -> `UNKNOWN`, never a
   forced `PASS`.

**A timing `PASS` is not an AC-3 `PASS`.** AC-3 (did you actually SEE
the balloon for its own full ~4s) is a separate, independent
criterion, checked during the same two post-measurement turns: seen
in full -> `PASS`; not seen, nothing else visibly broken -> `UNKNOWN`
(record Focus Assist/DND state if known) — never `FAIL`, and never
retried past Step 3(a)'s own turn/notification budget.

**AC-9, last, independently**: one VSCode turn, workspace trust
accepted, with **ALL VSCode windows closed first, then exactly one
new one opened from this same checked-over PowerShell window**
(`code $DN_REPO`) — VSCode's `code` CLI reuses an already-running
VSCode process rather than starting fresh, so the extension host
would inherit THAT older process's own environment otherwise. Even
with a clean launch, the extension host's own resulting environment
is still `UNKNOWN` — an integrated terminal inside VSCode proves
nothing about it either. `DEV_NOTIFY_SURFACE` defaults to
`claude_cli`, so make sure no CLI session is left open during this
test, or the result is ambiguous. `UNSUPPORTED` requires Step 0's
shell question AND workspace trust both already confirmed.

**AC-4 (contended lock)**: mark it genuinely tested **only** if two
`Stop` events actually overlapped; otherwise `NOT_TESTED`, and do not
add a stress test or log-polling to manufacture a result.
**`diagnostic_dry_run.py`** also reads the Codex **persisted**
registry value, outside this Claude-only authorization — **do not
run it here**; a logged, real gap, not worked around in this round.

Caveat for notification counting: `Stop` gets a 75s `COMPLETED` dedup
window keyed on `prompt_id` (`claude_adapter.py`) — distinct turns
don't collide, but `Notification` `idle_prompt` can add one EXTRA
notification after a turn completes; that counts toward Step 3(a)'s
`<=6` notification budget.

For every test above: write down the pre-registered criterion and a
dated PASS/FAIL/UNKNOWN/NOT_TESTED with what was actually seen —
never mark `VERIFIED_BY_OWNER` without that.

---

## Step 12 — Rollback, on FAIL/STOP (WV2, RK2b)

**Before rolling back**, check whether anything (including Claude
Code itself — its docs describe it saving settings into this same
file) has written to the settings file since `apply`:

```powershell
$DN_HashCheck | & $DN_PYTHON -B - "text" $DN_SETTINGS $DN_AFTER_PREVIEW_SHA
```
If `matches_expected: false` here, rolling back will **discard**
whatever changed it — record what that was before proceeding; this
is why every test turn is told to stay tool-less and never approve
"Always allow": rollback restores the WHOLE file, it cannot
selectively undo just the hook part.

```powershell
Push-Location $DN_REPO
$DN_RollbackResult = Invoke-DNFilteredPatch -PatchArgs @("claude", "rollback", "--apply", "--path", $DN_SETTINGS, "--backup", $DN_BACKUP)
Pop-Location
if ($DN_RollbackResult) { $DN_RollbackResult | Select-Object applied, current_sha256 }
```

**`current_sha256` in this output is the hash of the file's content
BEFORE the restore (the still-patched state, captured by the tool
right as `rollback` starts) — it is NOT a hash of what got restored**
(RM3d, confirmed from the tool's own source). Do not read it as
confirmation of the rollback's own result; the restore itself is only
verified by the two checks below.

**Verify the restore — BOTH checks required (RK2b/RJ1):**
```powershell
$DN_HashCheck | & $DN_PYTHON -B - "text" $DN_SETTINGS $DN_BEFORE_SHA
$DN_HashCheck | & $DN_PYTHON -B - "jsonequal" $DN_SETTINGS $DN_MANUAL_BACKUP
```
The first (`$DN_HashCheck`, `text` mode) `matches_expected` must be
`true` — the restored file's text matches `before_sha256` exactly.
The second (`jsonequal`, against your Step 3(c) independent manual
backup) must show `json_equal: true` — confirming semantic agreement
with your OWN independent copy, not just the tool's own round trip.
If `$DN_BACKUP` was moved in Step 9(4), use the moved path in the
rollback command above — the manual backup from Step 3(c) is
**never** what `rollback` itself reads; it exists only as your own
independent fallback copy and as this final cross-check.

---

## Open questions (logged, not blocking preparation)

- Which shell Claude Code uses on this machine, and whether VSCode's
  hook runner uses the same one — both `UNKNOWN` until Step 0/AC-9.
- Whether Windows Focus Assist/notification settings on this machine
  would silently suppress a `powershell.exe`-originated balloon —
  `UNKNOWN`.
- The VSCode extension host's own resulting environment after a
  clean `code` launch — `UNKNOWN` even when Step 11's own close-all-
  windows-first procedure is followed exactly.
- `diagnostic_dry_run.py`'s own scope (reads Codex's persisted value
  too) does not fit a Claude-only authorization — logged in Step 11.
- `RH1`–`RH3` (test-hardening gaps, `result-review.md` round 7) —
  unrelated to this round, still open, not claimed fixed by anything
  above.

Round outcome without a dated owner authorization in hand:
**`PREPARED_AWAITING_OWNER_ACTIVATION`** — not `BLOCKED` and not an
`E2E PASS` (no real receipt exists yet). `#498` stays open.
