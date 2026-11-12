# #498 — dedup-rules addendum 3 (activation prep: RD2–RD3 / AP2)

2026-11-12, CC. Written and hashed BEFORE any changed test is run this
round, per AP2's own ordering requirement. References, verbatim,
unchanged — **no runtime number in any of them, or in production
code, changes in this file**:

- `dedup-rules.md` — SHA-256 `a23331cf69f568b5bdb5186f25a272071a073a381413facb7100dad549117b0a`
- `dedup-rules-addendum-1.md` — SHA-256 `7c15bee361b4ec741099d4775c156e246d9676cd252509f4ffd7a7ea74d7de3e`
- `dedup-rules-addendum-2.md` — SHA-256 `2137041ce2f6ec60b4f322b15057a8a1de74e8dfded71148ba4e02f14e24fe29`

Re-verified byte-identical immediately before writing this file (see
`samples/pre_ap_snapshot.txt`). **No dedup window, sub-budget, lock, or
stdin-timeout number changes anywhere in this round.**

**Verification command** (this file's own hash, `hash  path` format):
```
sha256sum -c docs/ai/tasks/ticket-498/dedup-rules-addendum-3.sha256
```

## AP2(a) — `PENDING` is the NORMAL outcome of a successful Windows send, not evidence of anything

With `WINDOWS_SUBBUDGET_S = 4.0s` (addendum 2, unchanged) exactly equal
to the balloon fallback's own internal sleep (`_BALLOON_DISPLAY_MS =
4000`, unchanged since the 2026-11-11 owner-confirmed value) **plus**
cold `powershell.exe` process-startup overhead (observed, not a fixed
number — varies by machine load), a real, successful Windows send
almost always takes **longer** than its own 4.0s join deadline. This
means:

- `dispatch()`'s own `result["windows"] = {"status": "PENDING", ...}`
  branch is not a rare edge case this round's tests happened to probe
  — it is the **typical, expected shape of the result dict for a
  perfectly successful real send**. No caller/consumer of this result
  may ever read `PENDING` as evidence of failure, nor may any future
  code path be added that tries to upgrade `PENDING` into `DELIVERED`
  without a real, owner-confirmed receipt — there is currently **no
  mechanism in this codebase that can ever produce a `DELIVERED`
  status for the Windows channel**, by design, because this script
  never waits long enough to observe the real outcome and does not
  claim to.
- This directly corrects an absence in `dedup-rules-addendum-2.md`
  and `cc-report.md`: both described the margin problem only in terms
  of *ntfy's own chance to run*, never stating outright that the
  Windows channel's own *typical* self-reported status is `PENDING`
  on the ordinary successful path, not just the slow/failure path.

## AP2(b) — the process ends ~4.0s into a normal send while the PowerShell child is still running

On the ordinary successful path, `dispatch()`'s own join for the
Windows thread returns at ~4.0s (its own sub-budget expiring, per
(a) above) while the real `powershell.exe` child is typically still
mid-sleep, with roughly **0.5–1.5s of its own balloon-display lifetime
left** (4.0s elapsed vs. ~4.0–5.5s total real duration, cold-start
dependent). Two consequences, neither previously stated outright:

- **The script's own process may reach its normal end (or the
  watchdog's hard exit, whichever comes first) before the real
  balloon has finished displaying.** Full visibility of the balloon
  therefore depends on the PowerShell child continuing to run
  independently after this script's own process ends — the SAME
  `INFERRED` (not `NOT_TESTED`-under-real-host) assumption already
  flagged in addendum 1/2's own RC3 corrections, now stated for the
  *ordinary* path too, not only the hard-exit-mid-send case addendum
  1 originally described. Previously the parent waited for the child
  before this round's RC1/RC2 changes; it no longer does.
  - Likely consequence if a future host DOES kill descendants on
    parent exit (e.g. a Claude Code/Codex job object that this round
    has never tested): a **shorter visible display**, not a lost
    notification outright — the toast/balloon API call itself
    already completed successfully before the join timed out; only
    the remaining *display* time would be cut short.
- **This is `NOT_TESTED` under a real host's own process/job-object
  behavior.** A Phase B owner-run test must confirm the balloon is
  actually seen in full when the hook process ends at ~4.0s under
  real Claude Code and/or Codex hooks (not a bare Python subprocess
  test) — see `activation-checklist.md`.

## AP2(c) — corrected worst-case timeline (RD3)

`dedup-rules-addendum-2.md`'s own worst-case timeline started
counting from "dedup check (~ms)", implicitly assuming the dedup
lock is always fast. That omits `LOCK_TIMEOUT_SECONDS = 2.0s`
(unchanged, `state.py`): under lock contention (a concurrent hook
invocation already holding it), `check_and_record()` itself can block
for up to 2.0s *before* dispatch's own sender threads ever start —
reproduced and measured (Ripley, Linux/Python 3.13): **2.0s (contended
lock) + up to 4.0s (Windows sub-budget) exceeds the 5.0s hard cap, and
the process ends via the hard-exit watchdog at a measured 5.05s**, not
at the Windows sub-budget's own 4.0s deadline as the ordinary
(uncontended) case would suggest.

Corrected timeline, worst allowed case, both entrypoints:

| Step | Claude | Codex | Note |
|---|---|---|---|
| stdin read | synchronous, Claude Code pipes and closes it (no separate bound) | up to `STDIN_READ_TIMEOUT_S = 0.5s` | Codex-only; the confirmed real path (`Stdio::null()`) returns EOF near-instantly |
| chain (Codex only) | — | unbounded join, but runs CONCURRENTLY with dispatch (A2/RC1) — does not add serially | Bounded only by the overall watchdog |
| dedup lock wait | up to `LOCK_TIMEOUT_SECONDS = 2.0s` if contended, else ~ms | up to 2.0s if contended, else ~ms | **Missing from addendum 2's own timeline — this is the RD3 correction** |
| Windows + ntfy (parallel) | up to `max(WINDOWS_SUBBUDGET_S, NTFY_SUBBUDGET_S) = 4.0s` | same | Starts only after the lock wait above completes |
| **Total, worst allowed case** | **up to 2.0 + 4.0 = 6.0s** — exceeds the 5.0s cap | **up to 0.5 + 2.0 + 4.0 = 6.5s** — exceeds the 5.0s cap | **The watchdog fires at 5.0s in both cases: this is the accepted, hard-exit outcome, not a bug** — measured 5.05s in Ripley's own sandbox run |

**What is left incomplete when the hard exit fires in this worst
case**: whichever of the two sender threads (Windows, ntfy) had not
yet reached its own result by 5.0s is abandoned mid-flight — its
thread is daemon and is never explicitly killed, but this script's
own process ends regardless, so nothing further is ever recorded
about it by this process (no result dict is ever returned to a
caller, since the hard exit happens from a background timer thread
independent of whatever `dispatch()`/`main()` were doing). The dedup
state entry for the event was already written before any sender
thread started (addendum 2, unchanged), so a retried/resent event
after the window would not be suppressed by this abandoned attempt.

This does not change any runtime number — the 5.0s cap, the 4.0s/2.0s
sub-budgets, the 2.0s lock timeout, and the 0.5s stdin read are all
exactly what addenda 1 and 2 already set. It corrects the *timeline
description* to include the lock wait, and states the hard-exit
outcome as an accepted result of the existing numbers, not a new
decision.

## AP2(d) — `dispatch()`'s own return value is never persisted anywhere in a real run

`cli_claude.py` and `cli_codex.py` both call `dispatch(event, cfg=cfg)`
and **discard the return value entirely** — there is no log file, no
debug output, nothing. This means the `PENDING`/HTTP-status/error
information `dispatch()`'s own result dict carries (exactly the
detail this addendum and addendum 2 describe) is **never visible
outside of a test that captures the return value directly** — a real
hook invocation leaves no trace of which outcome actually happened.
This is a genuine observability gap, not fixed in this round: the
approved prompt (AP4) explicitly forbids adding a general runtime log
or changing the notification transport in this activation-prep round.
The gap is intentionally left for Phase B's own separate, fake-tested
diagnostic dry-run entrypoint (see `activation-plan.md`) to address
operationally, never by making the hook's own hot path write logs.

## AP2(e) — chain subprocess `Hidden`/handle-inheritance: unchanged, `NOT_TESTED`

`_chain_to_existing`'s `subprocess.Popen(...)` call (A2/RC1) uses the
same default creation flags as before this round and before A2 — no
`CREATE_NO_WINDOW`, no `DETACHED_PROCESS`, no `CREATE_NEW_PROCESS_GROUP`,
no explicit `startupinfo` for a hidden window, and no change to handle
inheritance. This round adds no new flag and makes no claim about
whether the chained command's window (if it has one) is visible,
because that was never tested, before or after RC1's own stdio
changes (`DEVNULL` affects what the child's stdio streams connect to,
not whether a console window appears). `NOT_TESTED`, Phase B owner-run
only, per `activation-checklist.md`.
