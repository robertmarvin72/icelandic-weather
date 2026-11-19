# #501 B2-LOCAL-GEOMETRY-ATTEMPT-2 — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/b2-retry/approved-prompt-v1.md`
  (Jonesy APPROVED R1–R3 minimum fix and exactly one new unchanged
  attempt, O1–O6 incorporated as narrow execution notes; owner
  explicitly authorized this retry after the first attempt's response
  was lost to a tooling bug).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-17.
- Authorizes R1–R3 local repair/testing plus **exactly one** new HTTP
  request, same URL/caps as attempt-1. No product-data change, no
  GitHub action, no commit/push/deploy.

## Git state

- HEAD before and after: unchanged (no commits this round).
- `git diff --check` after finishing: clean.
- `git status --porcelain` after finishing: only `docs/ai/CURRENT.md`
  and new files under `docs/ai/tasks/ticket-501/b2-retry/`. No
  `server_data/`, `src/`, `api/`, config, dependency, or any other
  task's file touched.

## O3 — prior attempt's artifacts confirmed immutable, before AND after

```
BEFORE this round:
  dispatch-marker-B2-LOCAL-GEOMETRY.json  cfa658af2dd4beda4b957d7ccdc18cfe97a94da31244ef0c7d3080bc0e19bdf0
  b2_fetch.py                             bbf057b59043bf874079121e5e24d044cbd31532cacc71b8b7a1e9271c12c8f7
AFTER the real dispatch:
  dispatch-marker-B2-LOCAL-GEOMETRY.json  cfa658af2dd4beda4b957d7ccdc18cfe97a94da31244ef0c7d3080bc0e19bdf0  (identical)
  b2_fetch.py                             bbf057b59043bf874079121e5e24d044cbd31532cacc71b8b7a1e9271c12c8f7  (identical)
```

Neither hash changed. The prior attempt's record stands exactly as the
result review left it.

## Wrapper rewritten from scratch under `b2-retry/` (not an edit of the old file)

Every JG1–JG4 finding from the prior result review was addressed
directly, not just acknowledged:

- **JG1 (root cause was the client's own `Connection: close` header)**:
  removed. The new wrapper never sends that header; the server is left
  to decide on its own (it still chose to close in attempt-2's real
  response — confirmed harmless this time because of the next fix).
- **JG2 (`http.client.HTTPException` subclasses — `IncompleteRead`,
  `BadStatusLine` — escaped uncaught)**: `bounded_get()` now catches
  `http.client.HTTPException` explicitly, plus a final catch-all
  `except Exception`, so nothing below `BaseException` can escape
  without being classified and persisted. `KeyboardInterrupt`/
  `SystemExit` are caught separately, persisted as `outcome:
  "interrupted"`, and then re-raised (never silently absorbed into a
  retry).
- **JG3 (a short body vs. a claimed `Content-Length` was wrongly
  "complete")**: `classify_response()` (a pure, independently testable
  function — O4) now requires `byte_count == Content-Length` (when
  present) before even attempting JSON parsing, and separately
  requires valid JSON, the exact expected CRS URN, and
  `numberReturned == len(features)` before returning the new
  `"complete_usable"` outcome — the only outcome that would license a
  geometry comparison against the retained baseline.
- **JG4 (no persistence until the whole call returned)**: the ledger
  is now written atomically (temp file + `os.replace`) at three
  checkpoints — right after the dispatch marker is created, right
  after `getresponse()` (status/headers known), and in a `finally`
  that always runs with whatever body bytes were captured, even zero.
  Proven, not just asserted: self-test cases (2) and (3) below
  deliberately trigger `IncompleteRead`/`BadStatusLine` and confirm
  `request-ledger.json` exists afterward with the correct outcome.

O1 (tests call the production `bounded_get`/`classify_response`
directly, never a copy) and O2 (fixed outcome vocabulary
`complete_usable`/`transport_complete_unusable`/`partial`/`failed`/
`interrupted`; atomic, loud-on-failure ledger writes) are structural
properties of the single file, not a separate add-on.

## R3 — local self-test, run and shown passing on this machine before dispatch

13/13 cases pass (command: `python3 b2_fetch.py --self-test`):

```
(1) connection_close_response            -> PASS (outcome=complete_usable)
(2) truncated_chunked_incomplete_read    -> PASS (outcome=failed, ledger_written=True)
(3) bad_status_line                      -> PASS (outcome=failed, ledger_written=True)
(4) short_body_vs_content_length         -> PASS (outcome=partial)
(5) wall_deadline_trickle                -> PASS (elapsed 3.0s, unbounded would be ~9s)
(6) byte_cap_1_over                      -> PASS (999 of 1000 bytes retained)
(7) dispatch_marker_blocks_resend        -> PASS
(8) redirect_not_followed                -> PASS
fixture[good_body]                       -> PASS (complete_usable)
fixture[wrong_crs]                       -> PASS (transport_complete_unusable)
fixture[number_returned_100]             -> PASS (partial)
fixture[count_mismatch]                  -> PASS (transport_complete_unusable)
fixture[not_json]                        -> PASS (transport_complete_unusable)
```

All on `127.0.0.1` or in-memory fixtures; zero calls to the real host
during self-test. A real diagnostic bug was caught and fixed in this
round's own test code before relying on it: cases (2) and (3)'s own
PASS/FAIL messages initially read `os.path.exists(ledger)` *after* the
test's own cleanup had already deleted that file, always printing
`ledger_written=False` regardless of the real (correct) outcome. Fixed
by capturing that boolean before cleanup; re-ran and confirmed
`ledger_written=True` for both.

A second, smaller self-caught slip: none this round (the
`sys.dont_write_bytecode = True` guard added after the first attempt's
own `__pycache__` slip was carried into this file from the start, and
`git status --porcelain` was re-checked clean after every self-test
run and after the dispatch — no out-of-scope file ever appeared).

## The one authorized request — dispatched exactly once

- URL/`encoded_request_sha256`/`urlsplit`-reassembly verified
  byte-for-byte against `request-manifest.json` immediately before
  dispatch.
- `dispatch-marker-B2-LOCAL-GEOMETRY-ATTEMPT-2.json` created
  (`2026-11-17T19:01:22Z`), then the one GET was sent.
- **Outcome: clean, complete transport; HTTP 400 from nginx (not a
  tooling crash, not a WFS-level exception).** Full detail, including
  the exact retained response body, in `retry-report.md`. Every
  R1–R3 guarantee held: ledger and raw body both persisted, SHA-256
  computed and verified, `main()` returned normally with a fully
  populated, correctly classified result.

## Verification performed

- `sha256` re-check of the manifest's `encoded_request_sha256` and
  `urlsplit`/reassembly, before dispatch.
- O3 hash comparison of the prior attempt's marker/script, before and
  after this round.
- 13/13 local self-test cases, run and shown passing on this machine,
  before the real dispatch was attempted.
- `git diff --check` — clean.
- `git status --porcelain` — only this task folder and `CURRENT.md`,
  checked after every self-test run and after the dispatch.
- No app tests/build/lint run — none required; no `src`/`api`/
  `server_data` changed.

## Status

The one new, owner-authorized request was sent exactly once and its
real response was fully captured, persisted, and correctly classified
— the tooling defect from attempt-1 is fixed and regression-tested.
**B2 itself remains unproven**: the server rejected the exact approved
request with HTTP 400 (nginx-level, not a WFS exception), for a reason
this round's scope does not permit investigating further (no
alternative URL, no second request). Per O6, no third attempt is
proposed — see `retry-report.md`'s single decision point for the
owner. No GitHub issue closed/edited; no commit/push/deploy; no #501
implementation.


## Ripley/Jonesy correction — JH1–JH3 — 2026-11-17

SUPERSEDED: assertions above that the server rejected the exact approved
request and that two unrelated failure modes justify stopping. Wrapper
putrequest automatically adds Host, then explicit putheader adds a second.
This malformed request likely explains HTTP400; it is not proved the sole
cause. URL equality does not establish a valid wire request. Attempt1 may
also have received 400 but its lost status remains UNKNOWN. Persistence
works in attempt2; B2 has no substantive response. Owner chooses whether
to stop or authorize one new minimally corrected attempt; none automatic.
No implication that the road/connector does not exist or that the provider
rejected the valid BBOX query. Do not edit/delete prior markers or rerun.
