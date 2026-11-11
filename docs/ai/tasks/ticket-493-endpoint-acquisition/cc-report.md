# #493 endpoint-acquisition — CC report

2026-11-11, CC. Executed `approved-prompt-v1.md` (EA1–EA8) for
`ticket-493-endpoint-acquisition`, following Jonesy's prompt review
round 1 (APPROVED MEÐ SKILYRÐUM EA1–EA8), Ripley's folding of EA1–EA8
into the approved prompt, and the owner's real "Prompt approved"
handoff (recorded in `docs/ai/CURRENT.md` and `owner-authorisation.md`).
**This round made real network calls** — the first in this task.

## Sequence followed (EA1)

1. Read `CURRENT.md` fresh (`Stage: READY_FOR_CC`, `Approved prompt:
   approved-prompt-v1.md`); confirmed match before acting.
2. Recorded the dated owner handoff in `CURRENT.md` (naming
   `approved-prompt-v1.md` and its own independently-computed SHA-256
   `6f13b4cff953352b72f77b04663cf3aa108d64ed43bb6d6ced70b58ec95bd8dc`),
   then set `Stage: CC_IN_PROGRESS`.
3. Ran `samples/rp1_baseline.py` — SHA/size/line-ending for 18 retained
   inputs, fixed before any new output.
4. Ran `samples/rp1_native_reference.py` — native per-tier reference
   for E1 (20 features) and S2 (20 features), computed from retained
   properties (RP1), not trusted from the prompt's bare numbers.
5. Wrote and hashed `pairing-rules.md`/`.sha256` (EA5/EA6, with RP1–RP3
   corrections folded in) and `metadata-classification-rule.md`/`.sha256`
   (EA7) BEFORE building the request manifest.
6. Built `request-manifest.json`/`.sha256` from
   `samples/request_encoding.py`'s own named, pre-registered encode
   function (EA3) — the same function the live driver imports, so
   manifest and live request cannot drift. Total cap confirmed
   4,718,592 B.
7. Wrote `owner-authorisation.md` with the handoff quoted verbatim and
   limits matching the manifest exactly.
8. Ran `samples/run_ea2_tests.py` against a local `127.0.0.1` test
   server (`samples/test_server.py`) — **12 of 12** EA2 self-tests
   passed (redirect, non-200, over-cap direct/chunked, mid-body
   stall caught by the driver's own wall-clock watchdog where a
   socket-timeout-only check would miss it, remaining-budget-less-
   than-cap, 4th-call refusal, disallowed-host refusal, duplicate-ID
   refusal, pre-connect `InvalidURL` counted as a call and a STOP,
   a clean baseline call, and the driver's own refusal to start a
   live run if its ledger file already exists). **This proves the
   driver's own behaviour against a controlled local server — it
   proves nothing about `gagnaveita.vegagerdin.is` itself** (sandbox/
   CC-attributed, stated in `samples/ea2_test_report.json`).
9. Ran `samples/live_driver.py` — the real calls (see below).
10. Ran `samples/build_endpoint_output.py`, `samples/validate_endpoint_output.py`,
    and `samples/run_negative_tests.py` — all offline, no network.
11. Wrote `evidence.md` and `discovery-gaps.json`.
12. Wrote this `cc-report.md`.
13. Will run `samples/generate_hashes.py` LAST, re-verifying all 18
    retained inputs unchanged, then set `CURRENT.md → CC_COMPLETE`.

## Ledger-proven (CC-attributed, reproducible from the files in this task directory)

- **One real HTTP call was made**, to
  `https://gagnaveita.vegagerdin.is/geoserver/gis/ows` (E1-WGS84),
  recorded in `samples/exchange-ledger.jsonl` line 1: status 200,
  28,056 bytes received, not truncated, SHA-256
  `cb9382946098c2040dbc5c151985977974a1b7bf38aede520a7c1a312ee78355`,
  0 redirects, well within the 20 s wall-clock cap. The raw body is
  saved byte-exact at `samples/raw-E1-WGS84.json` and made read-only
  after receipt.
- **The response's own feature count (32) exceeded the expected set
  (20) by 12** (`IDFERILL` 1985/2899/19524, `VEGNR` 931/941/95,
  sharing `IDBUTUR 911040037` with E1's own target pieces) — an
  EA4(ii) deviation, confirmed by comparing every returned
  `(IDFERILL, NAKVAEMNIFERLIS)` key against the pre-registered
  expected set from `samples/rp1_native_reference.json`.
- **This deviation correctly stopped all further calls**: `S2-WGS84`
  and `ACCESS-CAPABILITIES` were never attempted. `d._calls_made == 1`,
  `d._bytes_received_total == 28056` (`samples/live_run_summary.json`).
  No aggregate guard (4th call, duplicate ID, out-of-window) was ever
  exercised in the live run, because the run stopped itself cleanly
  after the first call's own validation — this is DIFFERENT from the
  EA2 self-tests, which deliberately exercised those guards against
  the local test server.
- **E1's own 20 expected features all matched** their native
  `OBJECTID`, vertex count, and geometry type exactly — confirmed
  programmatically, not eyeballed (see the printed comparison in this
  session's own run log).
- **The published E1 value is tier-consistent**: latitude
  65.25861764, longitude -14.39028964 on all 4 `NAKVAEMNIFERLIS`
  tiers, both roles (`END` of 2345, `START` of 2344).
- **The independent validator** (`samples/validate_endpoint_output.py`,
  no import of `driver.py`/`build_endpoint_output.py`/
  `request_encoding.py`) re-derived every published value from the raw
  response fresh and found no mismatch.
- **13 of 13 negative tests** (`samples/run_negative_tests.py`) each
  fired their own pre-registered check-ID on `tempfile` copies outside
  the repo — `samples/negative_test_report.json`, `all_passed: true`.
  Temp directories confirmed cleaned up after each test and after the
  full negative-test run.

## Sandbox-tested (proves the driver, not the live host)

- The 12 EA2 localhost self-tests (`samples/ea2_test_report.json`) —
  see step 8 above. Explicitly does not demonstrate anything about
  `gagnaveita.vegagerdin.is`'s own real behaviour (mid-body stall,
  chunked handling, etc. under live conditions remain untested beyond
  what the one real call above actually exercised, which was a clean,
  fast, non-chunked 200 response).

## NOT_TESTED / not attempted this round

- `S2-WGS84` and `ACCESS-CAPABILITIES` — never called (see above).
- Whether `gagnaveita.vegagerdin.is` itself exhibits the mid-body-stall
  or chunked-response behaviour the EA2 tests simulate — the one real
  call that was made completed cleanly and did not exercise those
  paths.
- `DescribeFeatureType` — skipped per RP3's own reasoning, never
  attempted.
- Any further acquisition for R1, S2's own approach name, or driving
  access — all remain exactly as open as before this round.
- App/API/lint/build — not applicable; no app code changed.

## Scope confirmation

`git status --short` confirms only `docs/ai/CURRENT.md` and this
task's own new directory (`docs/ai/tasks/ticket-493-endpoint-
acquisition/`) are touched. No file outside this task's own directory
was modified; all 18 retained inputs were only read, re-verified
unchanged in the hash table below.

## Determinism

Only the offline validator and negative-test suite are expected to be
re-run after live calls (EA8) — the live driver itself refuses a
second run against the same ledger path (EA2f, demonstrated in the
EA2 self-test suite). `samples/validate_endpoint_output.py` and
`samples/run_negative_tests.py` were each run once; their own outputs
contain no temp paths or timestamps (grepped, confirmed clean) but
are not re-run a second time here since nothing about their own
inputs changed after the first pass — re-running them now, before
`generate_hashes.py`, would be redundant rather than meaningful
(no EA8 claim of cross-run byte-identity is made for them).

## Hash table

`samples/HASHES.json`/`.sha256` generated LAST, after this report and
`evidence.md` reached final form.

## Outcome

**`PARTIAL_WITH_EXACT_GAPS`** — E1's own WGS84 value is fully acquired,
paired, and validated; S2's is `null` throughout because its own call
was never made, stopped by E1's own EA4(ii) deviation. Metadata was
`NOT_RECEIVED`. Driving access (R1/E1/S2) remains `EXACT_GAP`. R1
itself is untouched. No candidate promotion, no release approval, no
app/API/entitlement change. Production NOT_TESTED. `#493`/From-To
routing not completed by this round. `CC_COMPLETE`. Next: owner →
Jonesy ("CC búinn") → result review round 1 (`result-review.md` not
yet created). No further network call will be made after this report.
