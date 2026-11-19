# #501 B2-LOCAL-GEOMETRY-ATTEMPT-3 — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/b2-final-attempt/approved-prompt-v1.md`
  (Jonesy APPROVED the Host-fix and exactly one final unchanged
  attempt, O1–O5 incorporated as narrow execution notes; owner
  explicitly authorized this as the **last** B2 attempt, regardless of
  outcome).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-17.
- Authorizes the minimum Host-header fix, local byte-level proof, and
  **exactly one** final HTTP request, same URL/caps as attempts 1–2.
  No product-data change, no GitHub action, no commit/push/deploy.

## Git state

- HEAD before and after: unchanged (no commits this round).
- `git diff --check` after finishing: clean.
- `git status --porcelain` after finishing: only `docs/ai/CURRENT.md`
  and new files under `docs/ai/tasks/ticket-501/b2-final-attempt/`. No
  `server_data/`, `src/`, `api/`, config, dependency, or any other
  task's folder touched.

## O3 — both prior attempts' artifacts confirmed immutable, before AND after

```
BEFORE this round:
  b2-retry/b2_fetch.py                                           def1706d...
  b2-retry/dispatch-marker-B2-LOCAL-GEOMETRY-ATTEMPT-2.json       e9f5d1fd...
  b2-retry/request-ledger.json                                   11f2c781...
  b2-retry/raw-B2-LOCAL-GEOMETRY-ATTEMPT-2.bin                    261c4ca7...
  b2-geometry/dispatch-marker-B2-LOCAL-GEOMETRY.json              cfa658af...
  b2-geometry/b2_fetch.py                                         bbf057b5...
AFTER the real dispatch: all six hashes identical, byte for byte.
```

## The bug, proven mechanically (O1/O2), not just by code review

Jonesy found, by reading attempt-2's code, that it sent the HTTP
`Host` header twice: `conn.putrequest()` already adds one by default
(`skip_host` defaults to `False`), and attempt-2 additionally called
`conn.putheader("Host", parts.netloc)` — a second, redundant line. Two
`Host:` headers is a malformed HTTP/1.1 request that a compliant
server/proxy may reject outright.

This round built a network-free, byte-level proof
(`_case_host_header_red_green` in `b2_fetch.py`): a fake socket class
is installed on `http.client.HTTPSConnection.connect` for the *exact*
real host and URL, so the literal bytes that would be sent are
captured without any network activity. Run against:

- **attempt-2's own unmodified `bounded_get`** (imported read-only
  from `../b2-retry/b2_fetch.py` by file path — never edited, never
  given a chance to call `--dispatch`): **2** `Host:` lines — the bug
  reproduced mechanically, not asserted.
- **this attempt's `bounded_get`** (one line deleted, nothing else
  changed): exactly **1** `Host:` line, correct value, correct request
  line, no `Connection:` header, no duplicate of anything else.

## R1–R3/O1–O4 persistence and classification — unchanged from attempt-2, carried over verbatim

The entire attempt-2 wrapper (ledger persisted atomically at three
checkpoints, `http.client.HTTPException`/`KeyboardInterrupt`/
`SystemExit` all handled, `classify_response()`'s strict
`complete_usable` criteria) was copied into this new file with **one**
intended line removed. Diff against `b2-retry/b2_fetch.py` (not
quoted in full here; available by direct comparison) confirms the only
functional difference is the deleted `putheader("Host", ...)` call
plus attempt-ID/path/docstring updates — exactly the "expected
difference" the approved prompt's O2 called for.

## R3 — 14/14 local self-test cases, run and shown passing on this machine before dispatch

```
(1) connection_close_response          -> PASS
(2) truncated_chunked_incomplete_read  -> PASS (ledger_written=True)
(3) bad_status_line                    -> PASS (ledger_written=True)
(4) short_body_vs_content_length       -> PASS
(5) wall_deadline_trickle              -> PASS
(6) byte_cap_1_over                    -> PASS
(7) dispatch_marker_blocks_resend      -> PASS
(8) redirect_not_followed              -> PASS
(O1) host_header_red_green             -> PASS (RED Host_count=2, GREEN Host_count=1)
fixture[good_body]                     -> PASS
fixture[wrong_crs]                     -> PASS
fixture[number_returned_100]           -> PASS
fixture[count_mismatch]                -> PASS
fixture[not_json]                      -> PASS
```

All on `127.0.0.1`, in-memory fixtures, or the fake-socket harness —
zero real network calls during self-test. `git status --porcelain`
checked clean (no stray files, no `__pycache__` outside this folder)
after the self-test run and again after the dispatch.

## The one final request — dispatched exactly once, and it worked

- URL/`encoded_request_sha256`/`urlsplit`-reassembly verified
  byte-for-byte against `request-manifest.json` immediately before
  dispatch (identical to attempts 1 and 2 — no query change).
- `dispatch-marker-B2-LOCAL-GEOMETRY-ATTEMPT-3.json` created, then the
  one GET was sent.
- **Result: `HTTP 200`, `outcome: complete_usable`, 36,267 bytes,
  CRS/count/truncation checks all passed.** This is the first of three
  B2 attempts to actually complete — confirming the duplicate-`Host`
  header, not the query itself, server policy, or anything about the
  bbox, was the real cause of both prior `HTTP 400` responses.
- Full feature-level analysis (20 returned features: 16 already-known
  plus 4 tiers of one genuinely new `IDFERILL` on a different road,
  VEGNR 38; precise distance calculations; the literal-equality
  connector answer) is in `final-report.md` — not restated here.

## Verification performed

- `sha256` re-check of the manifest's `encoded_request_sha256` and
  `urlsplit`/reassembly, before dispatch.
- O3 hash comparison of both prior attempts' marker/script/ledger/raw
  files, before and after this round — all six identical.
- 14/14 local self-test cases, run and shown passing on this machine,
  before the real dispatch.
- Independent re-derivation of the returned features' coordinates and
  pairwise distances directly from the retained response bytes this
  round (not copied from any prior document).
- `git diff --check` — clean.
- `git status --porcelain` — only this task folder and `CURRENT.md`.
- No app tests/build/lint run — none required; no `src`/`api`/
  `server_data` changed.

## Status

The final, owner-authorized B2 request was dispatched exactly once and
succeeded completely — `complete_usable`, no truncation, CRS and
counts internally consistent. **B2 itself is not demonstrated**: no
feature's endpoint is a literal match to both target points; the
closest new finding (a VEGNR 38 piece) is a measured 16.45 m from one
endpoint, not a contact. Per the owner's explicit instruction, **B2
pursuit stops after this attempt** — no fourth request, no further
root-cause investigation, no gap-bridging proposed. No GitHub issue
closed/edited; no commit/push/deploy; no #501 implementation.


## Ripley correction JI1–JI4 — 2026-11-17

SUPERSEDED: no-connector/degenerate/coordinates-identical-across-tiers claims above. 36807 is a closed nonzero ring containing both A/B as literal XY vertices in all4 tiers, also in retained baseline. See corrected final-report.md for independently computed per-tier arcs. Geometry connectivity does not establish driving authority or authorize replacing gaps in runtime. Original CC final-report archived as final-report-cc-before-ripley.md. B2 pursuit stops, no further calls.
