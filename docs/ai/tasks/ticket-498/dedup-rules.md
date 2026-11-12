# #498 — Dedup/event-key rules (NT5)

2026-11-11, CC. Written and hashed (`dedup-rules.sha256`) BEFORE any
test in `scripts/dev-notify/tests/` was written. Tests are derived
from these numbers, not the other way around.

## Event-key composition

```
event_key = (agent, surface, project_alias, event_category, discriminator)
```

- `agent` ∈ {`Ripley`, `CC`} — from the adapter's own identity (never
  from payload, per `payload-allowlist.md`).
- `surface` ∈ {`codex-cli`, `codex-app`, `claude-cli`, `claude-vscode`}
  — from which entrypoint/adapter ran, set by the installed hook
  command itself, never inferred from payload content.
- `project_alias` — from the static alias table or the read-only
  `Task:` line of `docs/ai/CURRENT.md` (see `payload-allowlist.md`).
- `event_category` ∈ {`COMPLETED`, `NEEDS_ATTENTION`, `FAILED`}.
- `discriminator` — the payload's own turn/`prompt_id` **if the
  payload provides one** (none of the mapped Claude Code events do,
  per `audit-report.md`'s own confirmed schemas); otherwise `None`,
  and dedup falls back to the sliding time-window rule below alone.

## Dedup window (sliding, per category — not a fixed time bucket)

A new event is **suppressed** (not sent, but still counted in local
state) if an event with the **same `event_key`** (same agent/surface/
project_alias/event_category/discriminator) was already sent less
than `window_seconds` ago for that key, where:

| `event_category` | `window_seconds` | Rationale |
|---|---:|---|
| `COMPLETED` | 75 | Covers Claude's own `Notification`/`idle_prompt` firing "about 60 seconds" after the matching `Stop` for the same turn, with a 15 s margin, while still letting a genuinely new `Stop` minutes later through. |
| `NEEDS_ATTENTION` | 15 | Collapses a literal near-duplicate signal for the *same* still-pending prompt (`PermissionRequest`'s own companion `Notification`/`permission_prompt`, or a repeat within the ~6 s wait the docs describe) without suppressing the next, genuinely different, attention event — "ný attention eftir nýtt atvik á sama session er leyfð" is satisfied because a *different* real prompt is very unlikely to also land inside the same 15 s window as the first. |
| `FAILED` | 5 | `StopFailure` is a discrete API-error event; a window this short only guards against an accidental double-invocation of the hook itself, never against two genuinely different failures. |

This is a sliding comparison against the **last-sent time for that
exact key**, not a fixed-size time bucket — a bucket boundary can
never split one real event into two separate "buckets" by bad luck.

## State storage

- Location: a single JSON file under the user's own local-app-data
  directory (`%LOCALAPPDATA%\dev-notify\state.json` on Windows),
  **outside Git**, with user-only ACL (set at creation; Phase A tests
  use a `tempfile` copy and never touch the real path).
- Retention: at most **500 entries**; prune the oldest entries first
  once exceeded. Each entry older than **86,400 seconds (24 h)** is
  pruned on the next write, regardless of count.
- Concurrency: a sibling `.lock` file, acquired with a **2-second**
  timeout. **If the lock cannot be acquired, or the state file is
  missing/corrupt/unreadable, the notifier proceeds WITHOUT dedup
  (sends the notification anyway) rather than ever blocking Windows
  delivery or the calling agent** — a stale or broken dedup state is
  explicitly never allowed to silence a real notification.
- `session_id` is never used alone as (part of) the key in a way that
  would suppress *all* later notifications for that session — it does
  not appear in `event_key` at all; repeated turns in the same session
  are distinguished only by the sliding window above, so a later,
  genuinely new `COMPLETED` always gets through once 75 s have passed.

## Hook-runtime and lock-timeout ceiling

- **Self-imposed total runtime cap: 5 seconds** per hook invocation,
  measured from the notifier's own start — well under Claude Code's
  600 s command-hook default and under any plausible Codex `notify`
  timeout. If any single step (dedup lookup, Windows toast, ntfy
  publish attempt) is still running when this cap is reached, the
  notifier abandons that step (never raises, never blocks) and exits
  0. This is a belt-and-braces limit on top of the per-step bounds
  below — it does not replace them.
- Windows toast attempt: bounded by the native API's own call, never
  awaited past a few hundred milliseconds in practice; no code path
  waits on user interaction with the toast itself.
- ntfy HTTP attempt: `timeout_s` from `request-manifest`-style
  per-call config (Phase A default: 5 s), 0 retries (see NT2).

## Tests derived from these numbers (not the reverse)

- Same turn, repeated `COMPLETED` within 75 s → suppressed.
- New `COMPLETED` after 75 s → sent.
- Two `NEEDS_ATTENTION` within 15 s → second suppressed.
- Two `NEEDS_ATTENTION` 20 s apart → both sent.
- `FAILED` always sent unless a literal duplicate within 5 s.
- Concurrent writers (two processes invoking the notifier at once) do
  not corrupt `state.json` and do not deadlock past the 2 s lock
  timeout.
- A corrupted/unparseable `state.json` does not raise — the event is
  sent (fail open on dedup, never fail closed on delivery).
- A restart (process exits mid-write) leaves `state.json` in a
  recoverable state on the next run (atomic write via temp-file +
  rename, never a partial write left in place).
