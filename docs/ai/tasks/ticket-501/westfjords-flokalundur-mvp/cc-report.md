# CC report -- westfjords-flokalundur-mvp (ticket #501)

Executed against `approved-prompt-v1.md` P1-P9. All figures below are real,
measured values from the production core (`composeGeometryPath`,
unmodified) and the production loader, re-run in this session -- never
copied from the approved prompt's own citations without independent
verification. Where a number matches the prompt's own citation, that match
is noted as a cross-check, not assumed.

## Files

New:
- `docs/ai/tasks/ticket-501/westfjords-flokalundur-mvp/build-westfjords-flokalundur-region.mjs` -- offline build script (one-off, not production)
- `server_data/westfjords-region-budardalur-flokalundur.json` -- new, separate runtime region file
- `api/_lib/winterRoute/westfjordsFlokalundurRegionDataset.js` -- loader
- `api/_lib/winterRoute/westfjordsFlokalundurRegionDataset.test.js` -- 13 tests
- `docs/ai/tasks/ticket-501/westfjords-flokalundur-mvp/build-map-data.mjs`, `map-data.json`, `map-view.html` -- review map (task-local)

Modified:
- `api/winter-route-geometry.js` -- new `isWestfjordsFlokalundurPair` branch, wired before the general known-place-id gate (same pattern as the existing westfjords-entry branch)
- `api/winter-route-geometry.test.js` -- 5 new tests in a new `describe` block

Never touched: `server_data/westfjords-region-1-60-budardalur.json`, `api/_lib/winterRoute/westfjordsRegionDataset.js`, `server_data/winter-route-places.json`, `geometryComposition.js`.

## P1 -- the one permitted connector

The 19-line chain (`3197,3247,3462,40961,3460,3771,3755,3754,3750,49925,50566,3678,3677,3675,3672,3651,3869,3868,3648`) plus the reused `2769` is connected at every join to <0.001 m, independently re-derived from the raw retained GeoJSON in the dataset test, **except** `49925 -> 50566`, where the real measured gap is **0.005023430900293806 m**. No other gap was found. One estimated connector line bridges it: reserved negative `sourceId: -4` (distinct from the south-pilot `-1` and north-option `-2`/`-3`), `idbutur: null`, non-WFS `evidenceRef` (`"pilot-connector:estimated-westfjords-49925-50566"`), undirected, length 0.0050234... m (<= 0.01 m). The build script throws (`STOP:`) if any other gap in the chain exceeds 0.001 m, or if the connector itself exceeds 0.01 m -- neither triggered. The connector's own length is surfaced separately in the API response as `estimatedConnectorLengthM`, never folded invisibly into `lengthM` without being broken out.

## P2 -- pinned chain, both directions

Real composed result, `budardalur -> flokalundur`:
- status `geometry_only`, **172,474.2228360156 m**, 21 slices
- sourceId order: `2769, 3197, 3247, 3462, 40961, 3460, 3771, 3755, 3754, 3750, 49925, -4, 50566, 3678, 3677, 3675, 3672, 3651, 3869, 3868, 3648`
- every real slice is `veghluti 1`; no slice has `vegnr` 61/607/608/62/F66 or sourceId in `{3718,2322,2321,3418,3419,3605,2077,3321,2973,3009,3698}`
- 0 double-counted edges (all 21 sourceIds distinct in this result)
- coordinate-chain sum matches `lengthM` to within 1e-4 m (verified in the dataset test)
- reverse (`flokalundur -> budardalur`): same sourceId list reversed, length within 1e-5 m of forward, different `geometryId`

This matches the approved prompt's own cited reference (172,474.22 m ± 0.05, 21 slices) as an independent cross-check.

## P3 -- connector-is-necessary negative test

On the full retained national tier-0 graph (1,564 lines, patched only for the two insertion points already established), **without** the connector the real core returns `geometry_only` (not a disconnection) at **204,217.19933... m**, 22 slices, routed through `3718,2322,2321,3418,3419,3605,2077` instead of `49925,[connector],50566` -- the silent-wrong-detour danger P1/P3 describe, now reproduced against the real production core rather than assumed. Restoring the connector recovers the correct 172,474.22 m / 21-slice chain. This is in `westfjordsFlokalundurRegionDataset.test.js`'s own negative test, using the full fixture per P3's own instruction (the real narrow production region would simply disconnect without the connector, not silently mis-route -- the trap only manifests on the broader national graph).

## P4 -- Flókalundur endpoint

Owner coordinate `(-23.163, 65.576)` projects onto line `3648`'s own real geometry at segment index 49 of 52 (0-indexed), offset **51.300370295420294 m**. Inserted as `3648`'s new vertex index 50 of 54 total after insertion -- collinearity with the original segment verified in the dataset test. `idbutur`/`IDFERILL` for `3648` are unchanged (`905170037`/`3648`). The offset is recorded in the region file and surfaced via the API's `accessApproach.ownerCoordinateOffsetM`, excluded from `lengthM`. The 60/62 junction (`3648`'s own full remaining end) is a real, different point, 346.7728648450284 m further than the Flókalundur insertion -- composing to it gives 172,820.99570086063 m, confirmed strictly greater and not used as this pair's endpoint. `3009`/`3698` never appear in the path (confirmed via the forbidden-sourceId assertion in both the positive and negative tests).

## P5 -- IdButur list

Real route-validated list (connector's own `null` skipped, never left as a stray entry): `805030037, 905070037, 905080037, 805090037, 905110037, 905130037, 560250037, 560260037, 805140037, 905150037, 905160037, 905170037` -- exact match to the approved prompt's own cited list, including `905070037` (line `3197` is literally on this chain). None of the excluded ids (`505870037, 905090037, 905100037, 907000037, 905120037, 560800037, 906520037, 660350037, 905180037`) appear. `roadConditionIds`/`#503` are untouched by this change.

## P6 -- Búðardalur-side reuse and offline composition proof

`westfjordsFlokalundurRegionDataset.js`'s own `region.budardalur.insertedNode` is byte-identical (`x`/`y`, asserted with `toBe`) to the existing entry region's own `budardalur.insertedNode` -- confirmed by a dedicated test, never recomputed with a different result. This round's own route uses only the `2769[3->4]` slice (**205.3852483378858 m**); the existing entry round's own leg uses `2769[0->3]` (**416.34546254153923 m**). Sum = **621.730710879425 m**, matching the full, unmodified `2769` line's own length to within 1e-4 m (verified in the dataset test). Offline-only combined proof (not a new route): `junction-1-60-baulan -> budardalur` (42,155.20284701861 m) + `budardalur -> flokalundur` (172,474.2228360156 m) = **214,629.4256830342 m**, matching the prompt's own cited ≈214,629.426 m, with no double-counted edge across the two legs (each leg's own sourceIds checked independently; `2769` appears once per leg at disjoint vertex ranges).

## P7 -- map advisory markers

`map-view.html` shows the route (blue), the one estimated connector (orange, dashed), both inserted endpoints (green), both owner coordinates (purple, shown separately from the road approach), and five real, literal branch points (grey, dashed, each labeled "possible future connection, not confirmed"): Þröskuldar (vegur 61, at `3755`), Reykhólasveitarvegur (607, at `3754`), Þorskafjörður A (608, at `3750`), Kollafjarðarheiði (F66, at `3675`), and the 60/62 junction. Each branch point's coordinate is a real, literal vertex shared with this chain (distance 0 in the raw retained WGS84 data -- not an invented tie-in); none are composed into any route or presented as a confirmed ID connection.

## P8 -- isolation from the existing pair and every other pair

- `flokalundur` is recognized only paired with `budardalur`; `flokalundur<->hella`, `flokalundur<->flokalundur`, and `flokalundur<->junction-1-60-baulan` all return `400 unknown_place_id` (tested).
- The existing `junction-1-60-baulan<->budardalur` pair's response is byte-identical to before this round: **42,155.20284701861 m**, 7 slices, `geometryId` forward `742bbdeda4fa8e8a43497d8baf81ca78` / reverse `559dde16d36824995bbe9cfe143b1896` (re-asserted literally in the new handler test).
- `westfjords-region-1-60-budardalur.json` and `westfjordsRegionDataset.js` are untouched (confirmed via `git status` -- not in the diff).
- Regressions re-confirmed passing: Rauðavatn<->Selfoss (`reykjavik-raudavatn|selfoss`, 44,984.77037809235 m), vegur 93, ring-options, Hella-ring-options, `same_place`, and the unsupported 51/56 places.
- One tier per call, as always (tier 0 for both westfjords pairs, never mixed with the tier-2 pilot).

## P9 -- map serving and visual review discipline

Served from `127.0.0.1:8771` (confirmed free beforehand; ports 8765-8770 left undisturbed), `python3 -m http.server 8771 --bind 127.0.0.1` launched from within this task's own directory only. Canonical OSM tile URL (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, no subdomain), `strict-origin-when-cross-origin` referrer meta, and the `local-file-note` banner, same as every prior map. Route coordinates were produced by an independently-implemented native->WGS84 inverse transform (standard Lambert Conformal Conic 2SP inverse, same parameters as every forward transform in this ticket), round-trip-validated to <1e-9 degrees and spot-checked against a real, unmodified raw-GeoJSON vertex to ~4e-10 m -- far inside the required <=0.056 m tolerance.

**CC did not and cannot visually confirm this map.** This session has no image/screenshot capability; the map is handed over as a working link (`http://127.0.0.1:8771/map-view.html`) for the owner's own review, not a claimed visual PASS. Per P9, this round stops here -- no work was done toward 61/Þröskuldar/Reykhólar/62/Brjánslækur/Ísafjörður or any ferry connection.

## Checks run

- `npx vitest run api/_lib/winterRoute/westfjordsFlokalundurRegionDataset.test.js` -- 13/13 passed
- `npx vitest run api/winter-route-geometry.test.js` -- 53/53 passed
- `npx vitest run api/` (full suite) -- 689/689 passed
- `npx eslint` on every new/modified file -- clean
- `git status --porcelain` -- scope matches exactly the files listed above plus `docs/ai/CURRENT.md`; no other file touched

## Scope notes

No work was done beyond P1-P9. No new dependency was added. No existing production file other than `api/winter-route-geometry.js` was modified. The map/build-map-data script duplicate the standard transform formula inline (same one-off-script convention as every earlier build script in this ticket) rather than importing it, since it is never needed by production request-time code.


## Ripley final-assessment clarification — 2026-11-19

Technical PASS: independently12files/218focused tests and lint pass
on Windows. CC's full api/689 result remains attributed, not rerun.
Jonesy corrected his own prompt P6 reference: whole2769 is621.730710879m;
487.268m was one original segment, not the whole line. The implementation
and tests correctly use416.345462542 +205.385248338 =621.730710879m.
There are20real source lines plus one connector. Current regionVersion
hash includes doc.connector; the surviving mutation is a test-coverage
gap, not evidence that production omits it. Visual owner acceptance pending.
