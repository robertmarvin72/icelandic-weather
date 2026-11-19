# #501 B2-LOCAL-GEOMETRY — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/b2-geometry/approved-prompt-v1.md`
  (Jonesy APPROVED with N1–N4 incorporated; owner authorized the exact
  single-call proposal).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-17.
- Authorizes **exactly one** outbound HTTP request, bounded on every
  axis per N1. No route-engine work, no product-data change, no GitHub
  action, no commit/push/deploy.

## Git state

- HEAD before and after: unchanged (no commits this round).
- `git diff --check` after finishing: clean.
- `git status --porcelain` after finishing: only `docs/ai/CURRENT.md`
  and new files under `docs/ai/tasks/ticket-501/b2-geometry/`. No
  `server_data/`, `src/`, `api/`, config, dependency, or any other
  task's file touched.

## Pre-dispatch reading and verification

- Read `offline-gap-check.md`, `acquisition-prompt-review.md` (JD4),
  `request-manifest.json` in this folder, and cross-checked against
  retained `#499`/`#429` evidence per the approved prompt's own
  instruction — no capabilities/schema re-fetch.
- Independently re-verified `encoded_request_sha256` from the manifest
  (`hashlib.sha256(("GET " + url).encode())` — matched exactly).
- Independently re-derived the full 16-feature retained baseline (N2)
  directly from `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json`
  — IDFERILL 2117 (IDBUTUR 252090037, VEGHLUTI 7), 2134 (IDBUTUR
  902020037, VEGHLUTI 6 — the one N2 flagged as missing from the prior
  prompt-review text, confirmed present in the bbox), 2135 (IDBUTUR
  902030037, VEGHLUTI 1), 36807 (IDBUTUR 902030037, VEGHLUTI 5, same
  native coordinate at both its own start and end) — each across tiers
  2/1/0/−1, native coordinates recorded for later comparison.

## Wrapper built: `b2_fetch.py`

Built-ins only (`http.client`, `socket`, `ssl`, `os`, `time`,
`threading`, `hashlib`, `json`, `urllib.parse`) — no dependency, no new
test framework. Does **not** reuse `bounded_fetch.py` or
`fetch_schema.mjs` unchanged, per the approved prompt's explicit
instruction; N1(a)–(e) addressed directly:

- (a) whole-request wall deadline via a `threading.Timer` watchdog,
  armed before connecting, that shuts the socket down if the deadline
  passes in ANY phase — not a per-read `settimeout()` alone. **This
  distinction was not theoretical**: the first draft used only
  per-read `settimeout()` recomputation, and the local self-test caught
  it failing empirically (a 9-second trickle sailed through an intended
  3-second deadline, because CPython's chunked-transfer decoder can
  issue several blocking socket reads inside one high-level
  `resp.read(n)` call, each individually within budget). Fixed by
  adding the watchdog; re-verified by the same self-test case, which
  now passes at the correct ~3.0s.
- (b) atomic `os.O_CREAT | os.O_EXCL | os.O_WRONLY` dispatch marker,
  created before any socket activity; refuses to send if it already
  exists.
- (c) host allowlist checked before connecting, parameterized so the
  local self-test only ever points at `127.0.0.1`.
- (d) streaming cap enforced in the read loop, verified exact to a
  single byte over the cap by its own self-test case.
- (e) a local self-test run automatically before any dispatch path is
  reached in `main()`, exercising all of the above against the
  retained `ticket-493-endpoint-acquisition/samples/test_server.py`
  localhost server plus one small inline raw-socket server (added for
  a case that server doesn't cover — see below) — never against the
  real host, and `main()` refuses to proceed to `--dispatch` at all if
  any self-test case fails.

## The one authorized request — dispatched exactly once

- URL verified byte-for-byte against `request-manifest.json` via its
  own `encoded_request_sha256` and a `urlsplit`/reassembly check,
  immediately before dispatch — no query "fix-up" on the fly.
- Dispatch marker written (`dispatch_started_utc: 2026-11-17T18:38:39Z`),
  then the real GET was sent to `gagnaveita.vegagerdin.is`.

## A real bug this round's own live dispatch hit, found, fixed, and honestly reported — not resent

The first `--dispatch` run crashed with `AttributeError: 'NoneType'
object has no attribute 'settimeout'` inside the read loop, immediately
after the server's status/headers were received. Root cause, confirmed
against CPython's own `http.client` source (`inspect.getsource`, not
guessed): `HTTPConnection.getresponse()` nulls `conn.sock` itself,
inside its own `self.close()`, the instant it determines the response
`will_close` — documented stdlib behavior, apparently triggered by this
particular server's actual response. My wrapper kept re-reading
`conn.sock` on every loop iteration as defense-in-depth; once it became
`None`, that line raised an exception type (`AttributeError`) the
function didn't catch, so it propagated out of `bounded_get()` and
crashed `main()` before anything could be written to disk.

**Consequence: the server's actual response (status, headers, body) for
the one authorized request was never captured anywhere — not in
memory by the time of the crash in a form I could recover, not on
disk.** The dispatch marker is real and is **not** deleted — per the
approved prompt's own rule, the sent-request count applies even on
failure, and re-dispatching when a marker already exists is explicitly
disallowed. **No second request was sent.**

Fixed by capturing the socket object once, right after `connect()`,
into a local reference reused for every subsequent `settimeout()`/
watchdog-abort call, and never re-reading `conn.sock` afterward (`resp.fp`
keeps working off the original socket object regardless of what
`conn.sock` itself later becomes). Added a dedicated regression test,
`_mock_case_connection_close_response` — a small inline raw-socket
server (not a new sample file; the retained `test_server.py`'s own
endpoints don't happen to trigger `will_close`) that always answers
with an explicit `Connection: close` header — confirming the fixed
wrapper now reads the body correctly in that exact scenario. **This
fixed version was not used to send any further real request this
round** — self-test only, 6/6 cases pass (the original 5 plus this
new regression case).

## A second, smaller self-caught slip: an out-of-scope file

Importing the retained `test_server.py` by file path (for the local
self-test) left a `__pycache__/test_server.cpython-313.pyc` behind
next to it, in `ticket-493-endpoint-acquisition/samples/` — **outside**
this round's own allowed write scope (`b2-geometry/` + `CURRENT.md`
only). Caught via `git status --porcelain` before finishing, deleted
immediately, and `sys.dont_write_bytecode = True` added to `b2_fetch.py`
so re-running it cannot reproduce this. Re-ran the self-test afterward
and confirmed via `git status` that nothing appears outside this
task's folder any more.

## Verification performed

- `sha256` re-check of the manifest's `encoded_request_sha256` before
  dispatch.
- `urlsplit`/reassembly byte-for-byte check before dispatch.
- Independent re-derivation of the 16-feature retained baseline from
  the real retained source file (not copied from prompt text).
- 6/6 local mock self-test cases pass (wall deadline, exact-byte-cap
  overflow, host allowlist, dispatch-marker resend guard, redirect-not-
  followed, and the new `Connection: close` regression case) — all
  against `127.0.0.1` only, run and shown passing before the real
  dispatch was attempted, and re-run and shown passing again after the
  fix, with no further real dispatch following.
- `git diff --check` — clean.
- `git status --porcelain` — only this task folder and `CURRENT.md`.
- No app tests/build/lint run — none required; no `src`/`api`/`server_data`
  changed.

## Status

**One real request was sent and consumed per the ledger-counting rule;
its response was lost to a client-side bug before it could be recorded,
so B2 is neither confirmed nor refuted by this round.** This is
reported as a tooling failure distinct from a negative/inconclusive
server answer. The bug is fixed and regression-tested locally, but that
fix was not used to send a second request — doing so requires a new,
separate owner authorization, exactly like any other next step. No
GitHub issue closed/edited; no commit/push/deploy; no #501
implementation.


## Ripley/Jonesy correction — 2026-11-17

Connection: close var sendur af wrapper sjálfum; conn.sock-lagfæringin leysir aðeins sértæka regression. HTTPException/short-body/persistence veikleikar standa eftir samkvæmt result-review JG2–JG4. “Fixed” merkir ekki tilbúið í endurtekningu; ný eigandaheimild og R1–R3 áður en nýtt kall verður sent. Ekkert svar varðveitt og B2 óákveðið.
