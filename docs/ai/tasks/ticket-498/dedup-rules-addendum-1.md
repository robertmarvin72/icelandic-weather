# #498 — dedup-rules addendum 1 (RN1, RN3, CV1, CV4)

2026-11-12, CC. Written and hashed BEFORE any RN1/RN3 test is written
or run, per CV4's own ordering requirement. References the ORIGINAL
`dedup-rules.md` (unchanged, SHA-256 `a23331cf69f568b5bdb5186f25a272071a073a381413facb7100dad549117b0a`)
and adds the numbers that file did not fix precisely enough, or that
RN1/RN3 found were never actually enforced in code. This is an
ADDITIVE file — `dedup-rules.md` itself is not edited or re-hashed.

## RN1 — lock staleness (state.py)

- `LOCK_TIMEOUT_SECONDS = 2` (unchanged from `dedup-rules.md`): how
  long a single `check_and_record`/`increment_malformed_input_counter`
  call waits for the lock before failing open.
- `STALE_LOCK_THRESHOLD_SECONDS = 30` (**new, this addendum**): how
  old (by **wall clock**, `time.time()` vs `os.path.getmtime()` —
  **not** `time.monotonic()`, which was the RN1 bug: comparing a
  monotonic clock against a wall-clock mtime produced a large negative
  number, so a stale lock was never cleared) a `.lock` file must be
  before any waiter may remove it. Required to be clearly longer than
  both `LOCK_TIMEOUT_SECONDS` (2 s) and the longest realistic hold time
  of the critical section it guards — bounded below by the new
  `TOTAL_RUNTIME_CAP_SECONDS` (5 s, see below), since a process can
  never legitimately hold the lock past its own hard total-runtime
  cap. 30 s gives roughly 6x headroom over that cap, so an ordinary
  waiter that merely timed out waiting (2 s) can never be mistaken for
  an abandoned lock, and a genuinely abandoned lock (crashed/killed
  process) is reclaimed well before it could cause a second, unrelated
  notification cycle to also get stuck.

## RN3 / CV1 — hook total-runtime cap

- `TOTAL_RUNTIME_CAP_SECONDS = 5.0` — **unchanged** from the original
  "self-imposed total runtime cap: 5 s" promise in `dedup-rules.md`
  (no authorization in this round to extend it; see "Known conflict"
  below instead of a silent change). Enforced by a **hard-exit
  watchdog** (`dev_notify/watchdog.py`, `threading.Timer(cap_s,
  lambda: os._exit(0))`, started at the top of each CLI entrypoint's
  `main()`, cancelled on normal completion) — a HARD exit, not
  cooperative cancellation, because Claude Code does not enforce
  `timeout` at all once a command hook runs with `async: true`
  (VERIFIED_FROM_DOCS, `https://code.claude.com/docs/en/hooks`,
  "Run hooks in the background" section, read 2026-11-12: "Once an
  async hook is running in the background, Claude Code doesn't
  enforce `timeout` on it"). This cap covers the ENTIRE script body —
  stdin/argv reads, chaining, lock acquisition, and the notifier —
  exactly the "keðjun/IO/lock/notifier" scope the approved prompt
  requires.
- Why this cap does **not** protect Claude's own responsiveness
  (that's `async: true`'s job, confirmed below) but IS still needed:
  without it, a hung hook process (e.g. a wedged subprocess call) would
  linger indefinitely as an orphan, consuming a lock slot and OS
  resources forever, with nothing to ever kill it.
- `STDIN_READ_TIMEOUT_S = 0.5` (cli_codex.py's bounded stdin read) —
  small relative to the 5 s cap since the confirmed real path
  (Codex's `Stdio::null()`) returns EOF near-instantly; this bound
  only matters for an unconfirmed future caller.

## RN3 / CV1 — `async: true` verification (Claude Code 2.1.195)

VERIFIED_FROM_DOCS, `https://code.claude.com/docs/en/hooks`, "Run
hooks in the background" section, read 2026-11-12: *"Add `"async":
true` to a command hook's configuration to run it in the background
without blocking Claude. **This field is only available on `type:
"command"` hooks.**"* — the restriction stated is by hook **type**
(`command`), not by **event**; the page's own worked examples use
`async: true` on both a `Stop` hook and a `PostToolUse` hook, and no
per-event exclusion list for `async` is stated anywhere the page's
Notification/Stop/StopFailure sections were read (this round and the
original NT3 round combined). No minimum-version note is attached to
the `async` field itself in the common command-hook-fields table
(unlike several other fields, e.g. `PreModelSwitch`'s "Requires
Claude Code v2.1.251 or later") — the only version-gated nuance found
is that a **multi-line** JSON response on stdout from an async hook
requires v2.1.295+; irrelevant here since this hook never prints
anything to stdout (NT3a). Conclusion: `async: true` is treated as
**supported** for `Notification`, `Stop`, and `StopFailure` on the
installed 2.1.195, and `apply_config_patch.py`'s Claude hook entries
now set it.
Boundary: "the hook receives the same JSON input via stdin as a
synchronous hook" (same page) — confirms `cli_claude.py`'s existing
stdin-based reading is unaffected by adding `async: true`.

## Named conflict (CV4: report, don't silently resolve)

`windows_toast.py`'s balloon fallback sleeps **4000 ms** inside its
own PowerShell subprocess (`_BALLOON_DISPLAY_MS`, unchanged from the
2026-11-11 owner-confirmed working value — RN7 forbids requesting a
new live send to close this offline round, so this round does not
touch that number). Process startup overhead for `powershell.exe`
typically adds some hundreds of ms on top. That leaves well under 1 s
of margin under the 5 s hard cap for anything else (ntfy, chaining,
IO) to also complete before the watchdog fires. **This is an exact,
named, unresolved tension, not a silent change**: when `windows_toast`
succeeds via the balloon path, `ntfy` (when it is ever enabled —
currently `NOT_ACTIVATED`) will frequently not get a chance to run in
the same invocation before the 5 s cap. The watchdog firing in that
case does **not** stop the balloon from displaying — `_run_powershell`
spawns `powershell.exe` as an ordinary child process, and Windows does
not tie a child's lifetime to its parent's by default, so an already-
running toast/balloon subprocess keeps running (and the balloon still
shows) even if our own Python process is hard-killed by its own
watchdog mid-wait. The only real effect is that our own process may
not reach its normal exit or attempt `ntfy` that turn. Two possible
resolutions neither chosen nor implemented here: (a) a reasoned,
Jonesy-reviewed addendum raising the cap past 5 s, or (b) detaching
the Windows notifier from the hook's own blocking runtime (CV1 permits
this only if documented as necessary, and the Claude path doesn't
strictly need it since `async: true` already decouples Claude's own
responsiveness from this script's runtime — a detached worker's
survival past the parent hook process ending would itself be
`NOT_TESTED`/Phase B per CV1). This round implements neither; it only
names the conflict precisely, per CV4/CV1's own instruction not to
silently extend the cap.

## Per-step timeouts (CV4: "tímamörk á þrepum")

| Step | Timeout | Note |
|---|---|---|
| Windows toast/balloon subprocess (`windows_toast.send_windows_notification`'s `timeout_s`) | 6.0 s (unchanged) | Deliberately **above** the 5 s total cap — the watchdog, not this per-call timeout, is the real backstop; kept high so a slow-but-legitimate PowerShell startup isn't itself treated as a transport failure |
| ntfy publish (`ntfy_client.publish`'s `timeout_s`, via `dispatch`'s `ntfy_cfg.get("timeout_s", 2)`) | lowered from 5.0 s to **2.0 s** default | Gives ntfy a real chance to run inside the remaining budget after Windows; still `NOT_ACTIVATED` in production (`ntfy.enabled: false`) |
| `cli_codex.py` bounded stdin read | 0.5 s | See above |
| `_FileLock` wait (`LOCK_TIMEOUT_SECONDS`) | 2.0 s | Unchanged |
| `_FileLock` staleness (`STALE_LOCK_THRESHOLD_SECONDS`) | 30 s | New, see RN1 above |
| Hard total-runtime watchdog (`TOTAL_RUNTIME_CAP_SECONDS`) | **5.0 s** | New enforcement (RN3); the number itself is unchanged from the original promise |
| Chain subprocess timeout (`cli_codex.py`'s `CHAIN_TIMEOUT_S`) | 10 s (unchanged) | Chaining to the OLD notify command is a best-effort side call that already runs before the watchdog's own 5 s window starts counting meaningfully against OUR dispatch logic in practice, but is still inside the same hard process-level cap -- if chaining alone were ever slow enough to blow the 5 s budget, the watchdog would still fire and kill the whole process, including a still-running chain subprocess (same "child survives its Python parent" note as above applies) |
