# #498 — dedup-rules addendum 2 (A2: RC1–RC5 / QA1–QA5)

2026-11-12, CC. Written and hashed BEFORE any A2 code change or new
test, per QA5's own ordering requirement. References, verbatim,
unchanged:

- `dedup-rules.md` — SHA-256 `a23331cf69f568b5bdb5186f25a272071a073a381413facb7100dad549117b0a`
- `dedup-rules-addendum-1.md` — SHA-256 `7c15bee361b4ec741099d4775c156e246d9676cd252509f4ffd7a7ea74d7de3e`

Both re-verified unchanged immediately before writing this file (see
`samples/pre_a2_snapshot.txt`). Neither file is edited or re-hashed.
**No dedup window changes**: `COMPLETED`=75s, `NEEDS_ATTENTION`=15s,
`FAILED`=5s all stay exactly as in `dedup-rules.md`. `LOCK_TIMEOUT_SECONDS`
(2s) and `STALE_LOCK_THRESHOLD_SECONDS` (30s) from addendum 1 are also
unchanged.

**Verification command for this file's own hash** (QA5/RC5a — this
addendum uses the `hash  repo-relative-path` format so `sha256sum -c`
works directly on it, unlike addendum 1's hash-only `.sha256`):

```
sha256sum -c docs/ai/tasks/ticket-498/dedup-rules-addendum-2.sha256
```

Verification command confirming addendum 1 and `dedup-rules.md` are
still byte-identical to the hashes cited above (works around addendum
1's own hash-only `.sha256` format, which `sha256sum -c` cannot parse —
RC5(a), not rewritten since it is itself a hashed, immutable file):

```
python -c "import hashlib,sys; [print(p, hashlib.sha256(open(p,'rb').read()).hexdigest()) for p in ['docs/ai/tasks/ticket-498/dedup-rules.md','docs/ai/tasks/ticket-498/dedup-rules-addendum-1.md']]"
```
Expected output (compare manually against the two SHAs quoted above):
```
docs/ai/tasks/ticket-498/dedup-rules.md a23331cf69f568b5bdb5186f25a272071a073a381413facb7100dad549117b0a
docs/ai/tasks/ticket-498/dedup-rules-addendum-1.md 7c15bee361b4ec741099d4775c156e246d9676cd252509f4ffd7a7ea74d7de3e
```

## RC1/QA1 — chain lifecycle (no change to any number, a lifecycle rule)

- The chain to the previously-configured notify command runs in its
  **own worker thread**, started immediately, **concurrently** with
  dispatch (RC1's "óháð nýrri dispatch-leið" — independent of the new
  dispatch path, not fire-and-forget: the main thread still joins this
  thread before `main()` returns).
- **No sub-timeout is applied to the chain thread's own join.** The
  main thread calls `.join()` with no timeout argument — the ONLY
  bound on how long the main thread waits for it is the pre-existing
  `TOTAL_RUNTIME_CAP_SECONDS = 5.0` hard-exit watchdog (unchanged
  number, already in `dedup-rules-addendum-1.md`). This satisfies
  QA1(a)'s "foreldrið bíður eftir henni upp að þaki (eins og í dag)" —
  the parent waits for it up to the cap, exactly as before, just no
  longer serially blocking dispatch from starting.
- The chained subprocess call drops `capture_output=True` (which
  created pipes that broke with `BrokenPipeError` when the watchdog
  hard-killed the parent mid-chain — RC1's own sandbox repro) in
  favor of `stdout=DEVNULL, stderr=DEVNULL`. **No `timeout=` kwarg is
  passed to the chain subprocess call at all** — `subprocess.run`'s
  own `timeout` parameter would `TerminateProcess` the child on
  expiry, which is exactly the "kill the old command" QA1(c)
  forbids ("gamla skipunin er aldrei drepin af okkur"). The old
  command's own process lifetime is its own business, not ours to
  bound; if our own process is hard-killed by the watchdog while the
  chain is still running, the old command's process is simply
  orphaned (not killed) — Windows does not tie a child's lifetime to
  its parent's by default (same fact already used in addendum 1's
  "Named conflict" section for the Windows toast/balloon case).
- **Stdin to the chained command**: empty (the confirmed real Codex
  path, `Stdio::null()`, per `codex_adapter.py`'s module docstring) →
  the chain also gets `stdin=DEVNULL` — the same stdio shape Codex
  itself gives us is passed on unchanged, not upgraded or downgraded.
  Non-empty stdin (an unconfirmed/defensive-fallback caller only) is
  written in **one single `.write()` call** and the pipe is closed
  immediately afterward — never streamed incrementally. **Known,
  documented limitation (not a bug)**: if that single write is larger
  than the OS pipe buffer (Windows: typically 64 KiB) and the old
  command isn't simultaneously reading, the write call can block; if
  our own process is then hard-killed by the watchdog mid-write, the
  old command may receive a truncated stdin. This is accepted as a
  known limitation of an already-unconfirmed fallback path (the real
  Codex path never exercises it, since real stdin is always empty).

## RC2/QA2 — parallel bounded Windows + ntfy work (new numbers)

`dispatch()` now starts the Windows-toast send and the ntfy publish
in **two separate daemon threads**, both started immediately after
the dedup check (which still runs on the main thread, BEFORE either
thread starts — "dedup-athugun fyrir ræsingu þráða, ekki innan
þeirra" — so the state-file write for this event is always persisted
before either send is attempted, satisfying the standing "pre-send
state is ATTEMPT/PENDING, never DELIVERED before confirmed" rule).

| Name | Value | Role |
|---|---|---|
| `WINDOWS_SUBBUDGET_S` | **4.0 s** | How long `dispatch()`'s main thread joins the Windows-sender thread before giving up and marking that channel `PENDING` in the returned result (the thread itself may still be running in the background afterward — not killed) |
| `NTFY_SUBBUDGET_S` | **2.0 s** | Same, for the ntfy-sender thread. Matches `ntfy_client.publish`'s own internal `timeout_s` default (2.0s, unchanged from addendum 1), so the thread should normally finish within its own sub-budget in the ordinary case |
| Join scheduling | **absolute deadline, not additive** | Both threads start at the same `t0`. The main thread computes `windows_deadline = t0 + 4.0` and `ntfy_deadline = t0 + 2.0` and joins each with `max(0, deadline - now())` — so the two joins never sum to more than `max(4.0, 2.0) = 4.0s` of total added wait, never `4.0 + 2.0 = 6.0s`. This is what QA2(c)'s "hvor leið byrjar innan forskráðs tíma frá t0 án þess að bíða eftir hinni" requires: neither channel's own start is delayed by the other, and neither channel's absence of an answer forces the other to wait longer than its own budget. |

**Worst-case timeline, Claude entrypoint** (stdin already fully read
synchronously before `dispatch()` is called — unchanged, no bound
needed since Claude Code pipes it directly and closes when done):
dedup check (~ms) → both sender threads start at `t0` → main thread
waits up to `max(4.0, 2.0) = 4.0s` for both → **~4.0–4.3s typical
worst case**, inside the 5.0s hard cap with a small margin. If the
real Windows call (PowerShell cold-start + balloon's 4s internal
sleep, per addendum 1) alone takes ~4.5–5.5s, the `WINDOWS_SUBBUDGET_S`
join (4.0s) will often time out BEFORE the real send finishes —
`dispatch()` then marks that channel `PENDING` in its returned result
(never asserting delivery) and returns; the watchdog may still fire
afterward if the overall 5.0s is also exceeded, which does not stop
the already-running PowerShell child (same as addendum 1).

**Worst-case timeline, Codex entrypoint**: `STDIN_READ_TIMEOUT_S`
(0.5s, unchanged) → chain thread starts (unbounded join) CONCURRENTLY
with → dedup check + both sender threads (as above, ~4.0s worst case)
→ main thread then joins the chain thread with NO additional timeout.
Total wall-clock is bounded by `max(chain_duration, 0.5 + 4.0) ≈
max(chain_duration, 4.5s)`, itself bounded only by the outer 5.0s hard
watchdog — i.e. **this round does not claim the Codex entrypoint
reliably finishes within 5.0s when the chain is slow**; it claims the
hard watchdog is what bounds it, exactly as addendum 1 already
established, and that a slow chain no longer *starves* the new
dispatch logic the way it did before this round (RC1's own finding).

**Supersedes, in part, addendum 1's "Named conflict" section**: that
section described ntfy *never getting a chance to run* because it
waited behind a sequential Windows send. Parallelizing the two
channels resolves that specific starvation — ntfy now gets its own
concurrent 2.0s window regardless of how long Windows takes. **It does
not resolve the broader margin problem**: the overall 5.0s cap is
still tight against a real ~4.5–5.5s Windows send, and this round
still does not extend the cap (no authorization for that) or detach
the Windows worker from the hook's own blocking runtime. Per RC2's own
decision record, this round chooses **parallel bounded work**, not
option (b) (detached balloon) or (c) (raised cap) — those remain
available for a future round if the parallel approach's own remaining
margin turns out insufficient once observed on a real, owner-run
Phase B test.

## RC3/CV1 — proof-status corrections (wording only, no number changes)

Every claim in `dedup-rules-addendum-1.md` about a detached Windows
worker, a PowerShell child surviving its own Python parent process,
or "the balloon still shows after the watchdog fires" is **`INFERRED`
from general Windows process-model knowledge, not `NOT_TESTED` via an
actual observed Windows job-object/child-survival experiment this
round or the prior one**. This addendum does not rewrite addendum 1
(hashed, immutable); this paragraph is the correction of record,
together with `cc-report.md`'s own RC3 disposition. The only thing
genuinely tested about process survival this round is the chain
subprocess test itself (RC1/QA1's own test, below) — which proves a
grandchild process keeps running and finishes its own work after this
script's own process exits, specifically for a subprocess spawned the
way `_chain_to_existing` spawns it, on **this** Windows machine. It
does **not** prove anything about a Claude Code- or Codex-managed job
object, which could in principle kill all of its own descendants
including grandchildren on parent exit — that combination remains
`NOT_TESTED`, Phase B only, under real hooks.

## RC4 — scope note (no number; recorded here per QA5's own instruction to keep all A2 numbers/decisions in one place)

`gh api repos/openai/codex/tags` / `git/refs/tags` (host:
`api.github.com`) was used in the #498 correction round to confirm
which git tag corresponds to the installed Codex version. This host
is **not** one of the hosts the v2 approved prompt's CV3(a) explicitly
authorized (`developers.openai.com`, `learn.chatgpt.com`,
`code.claude.com`, `raw.githubusercontent.com/openai/codex/`). It was
read-only GET metadata (tag→commit resolution), never code content,
and no new call to `api.github.com` or any other host is made in this
A2 round to "fix" it retroactively — per Ripley's own RC4 decision,
this is recorded as a scope deviation of the prior round, not
retroactively authorized, and not repeated here.

## RC5 — hygiene (addendum-1.sha256 format; recorded, not changed)

`dedup-rules-addendum-1.sha256` contains only the hash, no filename —
unlike this file's own `.sha256` (which uses `hash  path`, verifiable
with a plain `sha256sum -c`). Addendum 1 and its `.sha256` are both
hashed/immutable and are not rewritten here; the Python verification
command above is the documented workaround. A real Phase B setup step
should use the `hash  path` format for anything new going forward.
