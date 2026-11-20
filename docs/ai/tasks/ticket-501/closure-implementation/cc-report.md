# cc-report — ticket #501 step 2 (closure-implementation): B1 same_place + B2 ten combined pairs

## Scope delivered

Per `approved-prompt-v1.md` P1-P9, exactly the approved scope B1+B2:

- **B1**: `same_place` for the six supported Westfjords endpoints (budardalur,
  flokalundur, isafjordur, holmavik, patreksfjordur, talknafjordur), checked
  before the general `KNOWN_PLACE_IDS` gate so it also covers `flokalundur`
  (never part of that general list).
- **B2**: a new `server_data/westfjords-region-combined.json` (a byte-identical
  sourceId merge of the eight already-approved Westfjords region files, no
  new acquisition/transform) plus a dedicated loader
  (`westfjordsCombinedRegionDataset.js`) and a new handler branch composing
  the ten new cross-leg pairs on it: budardalur<->holmavik,
  budardalur<->isafjordur, budardalur<->patreksfjordur,
  budardalur<->talknafjordur, flokalundur<->holmavik, flokalundur<->talknafjordur,
  isafjordur<->patreksfjordur, isafjordur<->talknafjordur,
  holmavik<->patreksfjordur, holmavik<->talknafjordur.

Both branches are inserted after the eight existing specific Westfjords
branches and before the general known-place-id gate. Junction ids
(`junction-1-60-baulan`, `junction-1-68-stadarskali`,
`junction-60-61-throskuldar`) are excluded from both -- confirmed by test
(still `400 unknown_place_id` even when paired with a now-supported id).
No new region/endpoint/data acquisition; #501 is **not** closed (step 3
remains for a future round); no commit/push/deploy/GitHub action taken.

## Files

New:
- `server_data/westfjords-region-combined.json`
- `api/_lib/winterRoute/westfjordsCombinedRegionDataset.js`
- `api/_lib/winterRoute/westfjordsCombinedRegionDataset.test.js` (26 tests)
- `docs/ai/tasks/ticket-501/closure-implementation/build-westfjords-combined-region.mjs` (task-local build script)
- `docs/ai/tasks/ticket-501/closure-implementation/build-map-data.mjs` + `map-data.json` + `map-view.html`
- `docs/ai/tasks/ticket-501/closure-implementation/route-contract.md`

Modified:
- `api/winter-route-geometry.js` -- two new branches (`isSupportedWestfjordsSamePlace`, `isWestfjordsCombinedPair`), additive only.
- `api/winter-route-geometry.test.js` -- 9 pre-existing assertions updated to reflect the now-intentional behavior change (see Matrix section below), plus 35 new tests for the 10 pairs/6 same_place responses/junction exclusion/regression.

## Real measured results (10 pairs x 2 directions + 6 same_place)

Every number below was independently re-derived by calling the real
production handler against the real runtime `server_data/westfjords-region-combined.json`
(never hand-computed, never copied from the approved prompt's own cited
sandbox figures without this independent re-verification).

| Pair | lengthM | estimatedConnectorLengthM | via (forward) |
| --- | --- | --- | --- |
| budardalur<->holmavik | 78697.7705 | 0 | Gilsfjörður, Þröskuldar |
| budardalur<->isafjordur | 260092.7711 | 0.0050 (-4) | Gilsfjörður, Þorskafjörður, Klettsháls, Dýrafjarðargöng |
| budardalur<->patreksfjordur | 233874.3218 | 4.3982 (-4,-5) | Gilsfjörður, Þorskafjörður, Klettsháls, Brjánslækur, Kleifaheiði |
| budardalur<->talknafjordur | 248219.9897 | 0.0050 (-4) | Gilsfjörður, Þorskafjörður, Klettsháls, Brjánslækur, Kleifaheiði, Miklidalur |
| flokalundur<->holmavik | 154887.0832 | 0.0050 (-4) | Klettsháls, Þorskafjörður, Þröskuldar |
| flokalundur<->talknafjordur | 75745.7669 | 0 | Brjánslækur, Kleifaheiði, Miklidalur |
| isafjordur<->patreksfjordur | 148325.1015 | 4.3932 (-5) | Dýrafjarðargöng, Brjánslækur, Kleifaheiði |
| isafjordur<->talknafjordur | 162670.7695 | 0 | Dýrafjarðargöng, Brjánslækur, Kleifaheiði, Miklidalur |
| holmavik<->patreksfjordur | 216287.1822 | 4.3982 (-4,-5) | Þröskuldar, Þorskafjörður, Klettsháls, Brjánslækur, Kleifaheiði |
| holmavik<->talknafjordur | 230632.8501 | 0.0050 (-4) | Þröskuldar, Þorskafjörður, Klettsháls, Brjánslækur, Kleifaheiði, Miklidalur |

All 10 reverse directions confirmed as the exact reverse sourceId chain,
same length (within floating-point tolerance), different `geometryId`.
`regionVersion` is stable and identical across all 10 pairs + 6 same_place
responses (`b93e0334e095cf95` as of this build -- it changes if the merged
JSON is ever regenerated, by design, since it is a content hash).

Same_place: all 6 return `lengthM: 0`, `via: []`, `idButurIds: []`,
`slices: []`, a single-point `coordinates` array. `talknafjordur`'s own
response carries `routeEndsShortOfOwnerCoordinate: true` on its
`accessApproach`; the other five do not. `budardalur`'s own single
coordinate correctly carries a real z (24.473128257522806, see Finding 2
below), not null.

## Matrix comparison (P2, one-time informational check, not a new test matrix)

Before (cited in approved prompt, from the closure-scope audit): 36
`geometry_only` / 5 `same_place` / 3107 `200 unsupported` / 452 `400`, of
3600 total directed pairs (60 ids x 60 ids).

Expected after: 56 / 11 / 3086 / 447 -- exactly 26 changed cells:
- 20 `unsupported`/`400` -> `geometry_only`: 16 from `200 unsupported`
  (the 8 unordered pairs among budardalur/isafjordur/holmavik/patreksfjordur/
  talknafjordur that don't involve flokalundur, x2 directions), 4 from `400`
  (flokalundur<->holmavik, flokalundur<->talknafjordur, x2 directions).
- 6 -> `same_place`: 5 from `200 unsupported` (budardalur, isafjordur,
  holmavik, patreksfjordur, talknafjordur each paired with itself), 1 from
  `400` (flokalundur<->flokalundur).

This was **not** re-run as a full 3600-pair sweep (per the approved prompt's
own explicit instruction: a one-time informational check, not a new
test-matrix framework in the repo). It is confirmed by direct evidence
instead:
- The 9 pre-existing test assertions fixed in `api/winter-route-geometry.test.js`
  (across the flokalundur/isafjordur/holmavik/road68/throskuldar/patreksfjordur/
  talknafjordur rounds' own test blocks) each independently confirm one of
  these exact before->after transitions for the specific pair/id they cover.
- The new 35 handler-level tests confirm all 20 `geometry_only` directed
  responses and all 6 `same_place` responses now exist with the expected
  shape.
- Junction ids and every other pair/id outside this round's own 16 ids are
  confirmed unaffected by the existing "every other pair's contract is
  unaffected" regression tests (already present from every earlier round,
  re-run clean) plus this round's own new regression test.

## Two discovered data-quality findings (documented, not silently hidden)

**Finding 1 -- connector -4 has `z: null` on both its own vertices.**
`server_data/westfjords-region-budardalur-flokalundur.json`'s own
`connector` field (sourceId -4, the ~5mm Búðardalur<->Flókalundur estimated
bridge) was approved in an earlier round *before* the "copy z from real
endpoints" convention was established for connector -5. Both of its own
vertices carry `z: null`. This is a real, pre-existing characteristic of an
already-approved file -- out of this round's scope to modify (no new
connector, no edit to an already-approved region file). The coordinate
chain builder's own "skip the first vertex of every slice after the first"
dedup rule means only **one** null-z vertex survives per composed pair that
actually uses connector -4 (not two) -- confirmed and asserted explicitly in
`westfjordsCombinedRegionDataset.test.js`'s own `EXPECTED` table
(`expectedNullZ: 1` for the six pairs using -4: B-I, B-P, B-T, F-H, H-P,
H-T; `0` for the four that don't). Non-blocking: no response's coordinates
array is otherwise affected, and this is visible/testable, not hidden.

**Finding 2 -- Búðardalur's own endpoint metadata never stored a z field.**
Every region file's own `insertedNode`/`endpoint` object for `budardalur`
(e.g. `flk.budardalur.insertedNode` in the budardalur-flokalundur region)
carries only `x`/`y`, no `z`, even though this round's own approved prompt
P1 explicitly requires `z: 24.473128257522806` ("úr hnút 2769 v3"). This is
within this round's own new build script's scope to fix correctly (not a
modification to any already-approved file): `build-westfjords-combined-region.mjs`
reads the real z directly from the merged line 2769's own vertex array by
x/y match (`findVertexZ` helper) instead of defaulting to `null`. Confirmed
exactly matching the cited value, and now flows end-to-end into both the
`same_place` response's single coordinate and the combined dataset's own
`endpoints.budardalur.z` -- asserted explicitly in a dedicated test.

Both findings are real, pre-existing, non-blocking data characteristics of
the already-approved source data -- not defects introduced by this round,
and not silently smoothed over by a looser assertion.

## Tests / lint / scope

- `api/_lib/winterRoute/westfjordsCombinedRegionDataset.test.js`: **26/26 passing** (25 pre-existing + 1 new, the Finding-2 z assertion).
- `api/winter-route-geometry.test.js`: **123/123 passing** (88 pre-existing, 9 of which were updated assertions for the now-intentional behavior change; 35 new).
- Full `api/` suite: **874/874 passing across 58 files**, no regressions.
- `npx eslint` on all new/modified files: clean, zero warnings/errors.
- `git status --porcelain` / `git diff --check`: only the expected new/modified files for this round plus the already-known incidental `server.log` growth from prior rounds' own port health-checks; one benign CRLF-will-be-replaced warning on `api/winter-route-geometry.js`, no real whitespace errors.
- Note for future rounds: running vitest via this environment's Bash/Git-Bash tool produces a spurious `TypeError: Cannot read properties of undefined (reading 'config')` / "failed to find the runner" failure on **every** test file, including long-passing unrelated ones (`src/lib/scoring.test.js`) -- confirmed to be a Bash-shell-specific quirk unrelated to any code in this repo; the same commands run clean under PowerShell. All test runs in this report were executed via PowerShell.

## Map

`docs/ai/tasks/ticket-501/closure-implementation/map-view.html` + `map-data.json`,
served at `http://127.0.0.1:8778/map-view.html` (python3 http.server,
127.0.0.1-bound). A single selector cycles through all 10 pairs
(forward direction only -- reverse is the identical line traversed the
other way, verified separately in the automated tests, not re-drawn). The
four primary review cases are listed first in the selector:
budardalur<->holmavik, flokalundur<->talknafjordur, holmavik<->patreksfjordur
(both estimated connectors), isafjordur<->patreksfjordur (roundabout). Ports
8765-8777 (used by earlier rounds) were confirmed still in their own prior
state before and after starting this round's own server on 8778 -- no port
collision. **CC did not and cannot visually confirm this map** -- no
screenshot capability in this session; this is an openable artifact for the
owner's own visual review, not a claimed PASS.

## Limitations (unchanged, restated for this round's own new surfaces)

- `drivingAccess: "UNVERIFIED"` on every new response -- no claim about
  winter closure, driving conditions, or current access.
- All connector lengths are estimated, straight-line gap bridges, never
  claimed as real retained road geometry.
- All `accessApproach` offsets are planar straight-line distances to each
  place's own owner coordinate, never driving distances, never counted in
  `lengthM`.
- Tálknafjörður's own route endpoint remains ~995m short of its owner
  coordinate on every pair/same_place response involving it (town
  continuation not included) -- unchanged from the already-approved
  westfjords-talknafjordur-mvp round.
- The Ísafjörður roundabout (3834) caveat is surfaced in `lengthNote`
  whenever isafjordur is an endpoint of one of the new pairs.
- All lengths are tier-0 planar (EPSG:3057) geometry lengths, not
  driving-distance contracts.

## Per P9

#501 is **not** closed. Step 3 (final closure/handoff to #502/#503) remains
for a future round. No commit, push, deploy, or GitHub action of any kind
was taken in this round.


## Ripley validation addendum 2026-11-20

The required 3600-pair before/after sweep was not run by CC. It was independently run and confirmed by Jonesy sandbox: 36/5/3107/452 → 56/11/3086/447, exactly26changedcells; old18pairs unchanged. This is Jonesy evidence, not a CC run. Subsequent Ripley focused checks/map/contract corrections are recorded in result-review.md.
