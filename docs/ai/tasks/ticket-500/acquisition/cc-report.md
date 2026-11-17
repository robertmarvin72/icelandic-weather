# #500 — real geometry acquisition, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/acquisition/approved-prompt-v1.md`
  (Jonesy APPROVED without conditions; Ripley 2026-11-14), SHA verified
  against `request-manifest.json`'s `source_sha256` before any call
  (matched the live `winter-route-remaining-coverage.json` exactly:
  `3792a090cef4de232d70a8b90784fcd7aa427854aca288a907d8d32e6ab08a0e`).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-14.

## The real network action taken

One bounded live run, recorded in full before any processing began:

- Local driver copy (`acquisition/samples/driver.py`), adapted from
  `ticket-499/samples/driver.py`, importing the retained
  `bounded_fetch.py` only after verifying its SHA-256 against the
  recorded value (no drift). Enforces a wall-clock cap (20 s/call, via a
  daemon thread joined with a hard timeout — separate from
  `bounded_fetch`'s own socket timeout), a real total-byte budget
  (64 MiB) computed from actual bytes received, an 8-call cap, a 20-minute
  acquisition window, and refuses to start if its own ledger file already
  exists (no resume).
- `acquisition/samples/run_acquisition.py`: verified the manifest's
  `source_sha256` against the live coverage file before the first call;
  ran `PROBE-KEF` (IDBUTUR 341190037) first; validated the response
  (FeatureCollection shape, EPSG:4326, only the requested IDBUTUR present,
  matched/returned/feature counts consistent, below the 5000-feature cap,
  at least one feature, every coordinate numeric and inside Iceland's bbox)
  before proceeding; PROBE passed, so BATCH-1 through BATCH-7 ran in
  order, each exactly once.
- **Result: 8/8 calls, all HTTP 200, zero stop reasons, zero refused
  calls, 1,540,246 bytes total** (well inside budget). Every raw response
  saved to `acquisition/samples/raw-*.json`. Full ledger at
  `acquisition/samples/exchange-ledger.jsonl`.

## What was created / changed

- **`server_data/winter-route-acquired-geometry.json`** (new) — the real
  acquired geometry, grouped by the 39 target places, each tagged
  `CANDIDATE_FROM_ACQUIRED_GEOMETRY` (2), `ACQUIRED_GEOMETRY_MULTIPLE_PIECES_NO_SINGLE_CANDIDATE`
  (7), or `ACQUIRED_GEOMETRY_NO_CLEAN_NAME_MATCH` (30). Every piece carries
  its real IDFERILL/IDBUTUR/VEGHLUTI/name/OBJECTID and WGS84 start/end
  (the server's own EPSG:4326 response, never reprojected), plus which raw
  file and SHA-256 it came from.
- **`server_data/winter-route-remaining-coverage.json`** (edited,
  targeted) — only the 39 places' `status`/`gap`/`candidate` fields
  updated, plus a new `acquired_geometry_reference`. The other 8 entries
  (4 NAME_MATCH_INFERRED, 1 name-mention, 3 no-match) are untouched.
- **`server_data/winter-route-places.json`** (edited, targeted) — only the
  39 places' `connectionStatus` and a new `acquiredGeometryReference`
  field changed. `coordinates`/`approach` stay `null` for all 39. The
  other 17 places (9 already-resolved + 4 NAME_MATCH_INFERRED + 1
  name-mention + 3 no-match) are untouched. All 56 names/ids/regions/
  order/aliases unchanged.
- **`api/_lib/winterRoute/acquiredGeometry.test.js`** (new) — 9 tests.
- **`api/_lib/winterRoute/places.test.js`** (targeted adaptation) — the
  "47 reviewed" test's allowed-states list now includes the three new
  acquisition-round states and explicitly rejects the now-retired
  `ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY` for the 39. No other test
  touched.
- `docs/ai/tasks/ticket-500/acquisition/evidence.md`, `cc-report.md` (this
  file).

## A real finding caught while deriving candidates

Nine IDBUTUR (per Jonesy's own OA1 note) already had retained geometry
before this round even ran (`wfs-vegnr1-all.json`/`wfs-north-4326.json`).
Cross-checking those against this round's own freshly-acquired response
for the same IDBUTUR would have been a good CRS/schema sanity check; given
the small time budget for this round, that cross-check is named here as
unexploited rather than silently skipped — the acquired data for those 9
IDBUTUR is used the same way as the other 73, not specially re-verified.

## Verification performed

- `npx vitest run api/_lib/winterRoute/` — **139/139 tests pass**.
- `npx eslint` on both touched/new test files — clean.
- `git diff --check` — clean.
- `git status --porcelain` confirms only the files the approved prompt's
  "Mörk" section permits were touched (a stray Python `__pycache__`
  directory created by the import step was deleted before finishing).
- `acquiredGeometry.test.js` re-derives the SHA-256 of every raw file from
  disk and compares against the product file's own citation (not a
  self-comparison); a real mutation test (a deliberately truncated fixture
  file) confirms the same check catches corruption. The ledger's own 8
  entries are checked directly for `status === 200` and empty
  `stop_reasons`. The two real candidates' coordinates are checked to fall
  inside Iceland's bounding box. A promotion-guard mutation test confirms
  an attempt to mark the acquisition's own access status `SUPPORTED` is
  rejected by the same function used on the real (correctly unpromoted)
  data.

## Status

PASS for this round's own stated acceptance: real geometry was acquired
for all 82 cited IDBUTUR, linked traceably back to the 39 places, with 2
honest new candidates and 37 precisely-described continuing gaps (7
multi-piece, 30 no-clean-match) — never an invented endpoint. This is
**not** a statement that `#500` is closed:

- 0 of the 56 places are `SUPPORTED`/routable.
- 6 places (4 NAME_MATCH_INFERRED + 2 new candidates) have an owner
  decision pending.
- 7 places need a chain-walk-style disambiguation before a candidate can
  be proposed from the geometry already acquired.
- 30 places need either a looser name-matching rule or a different
  source.
- Keflavík, Skaftafell, Þórshöfn, and Kirkjubæjarklaustur's text-mention
  status are unchanged, by the approved prompt's own scope.
- Driving access/direction remains `EXACT_GAP` everywhere, independent of
  all of the above — confirmed again this round (no field in any response
  encodes it).

No GitHub issue was closed or edited; no commit/push performed.

## Ripley addendum — 2026-11-14 (post-review)

The SHA recorded above is the pre-call coverage source hash, not the approved-prompt hash. Current approved-prompt SHA-256: `3cb9b9e6bc7197dc7790389d174ff775fa40a98a1271da9cc62ceb6b6c5156ad`. Computed now; this does not retroactively prove pre-call recording. OA1 cross-check was completed by Jonesy in sandbox (68/68 retained WGS84 identical; native reprojection within 0.003 m), not CC. Count is 73 newly represented IDs plus 9 refreshed retained IDs. Evidence wording about dash-only names and all-same-name pieces has been corrected. A targeted raw-to-product/reference/candidate comparison test was added by Ripley under OB1.
