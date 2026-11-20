# CC report -- westfjords-throskuldar-mvp (ticket #501)

Executed against `approved-prompt-v1.md` P1-P9. All figures below are real,
measured values from the production core (`composeGeometryPath`,
unmodified) and the production loader, re-run in this session -- never
copied from the approved prompt's own citations without independent
verification. Where a number matches the prompt's own citation, that match
is noted as a cross-check, not assumed.

## Files

New:
- `docs/ai/tasks/ticket-501/westfjords-throskuldar-mvp/build-westfjords-throskuldar-holmavik-region.mjs` -- offline build script (one-off, not production)
- `server_data/westfjords-region-throskuldar-holmavik.json` -- new, separate runtime region file (4 lines, no connector)
- `api/_lib/winterRoute/westfjordsThroskuldarHolmavikRegionDataset.js` -- loader
- `api/_lib/winterRoute/westfjordsThroskuldarHolmavikRegionDataset.test.js` -- 14 tests
- `docs/ai/tasks/ticket-501/westfjords-throskuldar-mvp/build-map-data.mjs`, `map-data.json`, `map-view.html` -- review map (task-local)

Modified:
- `api/winter-route-geometry.js` -- new `isWestfjordsThroskuldarHolmavikPair` branch, wired before the general known-place-id gate (same pattern as the five existing westfjords branches)
- `api/winter-route-geometry.test.js` -- 6 new tests in a new `describe` block

Never touched: any of the five earlier Westfjords region files or their loaders, `server_data/winter-route-places.json` (the new `junction-60-61-throskuldar` id is never added to it), `geometryComposition.js`, `vercel.json`.

Side effect noted for transparency: four `server.log` files under earlier rounds' task directories (`westfjords-flokalundur-mvp`, `westfjords-holmavik-mvp`, `westfjords-isafjordur-mvp`, `westfjords-road68-mvp`) show as modified in `git status` -- this is incidental `http.server` access-log growth from this session's own health-check `curl` calls confirming those still-running map servers remain reachable (ports 8771-8774), not a content edit by this round's own work.

## P1 -- literal chain, no connector, CC's own measurement

The 4-line chain (`3321[0->47], 3324[0->63], 3611[0->26], 3883[0->3]`) is connected at every join to <0.001 m, independently re-derived from the raw retained GeoJSON in the dataset test -- **no gap found anywhere**, no connector needed or added. VEGNR is "61" for the first three lines, "67" for `3883` -- confirmed against the raw GeoJSON. Real composed result, `junction-60-61-throskuldar -> holmavik`: status `geometry_only`, **30,555.315457176555 m**, 4 slices. CC's own measurement is within 3.2e-9 m of the prompt's own cited sandbox figure (30,555.315457179793 m) -- well inside the ±0.05 m STOP threshold. The first slice is confirmed to be the **full** `3321` (`fromIndex: 0, toIndex: 47`, **10,052.127494780467 m**) -- not the old negative-test's own partial `3321[7->47]` slice. Reverse gives the same sourceId list reversed, length within 3e-11 m, different `geometryId`. 0 double-counted edges; coordinate-chain sum matches `lengthM` to within 1e-4 m.

## P2 -- junction endpoint, no owner offset, and the z trap

The route endpoint is `3321`'s own **literal, existing vertex 0** (native `x: 364140.5366828249, y: 556496.173523623, z: 42.058` -- preserved, never zeroed). `3321` is completely unmodified (48 vertices). Independently confirmed that this exact XY is shared with `3754`'s own start and `3755`'s own end (both 0 m away) -- neither line is in this region file. The real trap is confirmed directly: `3754`'s own raw z at that same XY is **41.9942**, a genuinely different value from `3321`'s own 42.058 -- the test asserts the stored endpoint z is NOT close to `3754`'s differing z, confirming the correct source was used. No `ownerCoordinateOffsetM` is reported for this end. The owner's own Þröskuldar reference point (`-21.785, 65.592`, "Áætlaður staðarpunktur" in the retained 164-place CSV) is recorded separately in the region file via a proper point-to-segment projection onto the real route (not merely the nearest vertex): **809.5062630555802 m** from the nearest point on `3324` (cross-check: 809.51 m), **15,074.198006171828 m** along the route from the junction (cross-check: 15,074 m), and **14,402.91756980774 m** in a straight line (cross-check: 14,402.92 m). None of these are counted in `lengthM`.

## P3 -- Hólmavík endpoint and J as an internal node

The route endpoint is `3883`'s own existing vertex 3, byte-identical (`x`/`y`, asserted with `toBe`) to the one already established in `westfjords-region-isafjordur-holmavik.json`. J (`3611`'s own end = `3883`'s own vertex 0 = `3347`'s own vertex 0) is a real **internal node** of the route (same framing as the road-68 round) -- the final slice is pinned exactly: `sourceId: 3883, fromIndex: 0, toIndex: 3`, **517.4229774386502 m** (cross-check: 517.42 m). The wrong result that would occur if `3347` were mistakenly treated as the endpoint (30,037.89 m) was checked and does not occur.

## P4 -- IdButur list, merged only in the list

Real route-validated list (collapsed on consecutive-same-value only): `907000037, 707040037, 907040037` -- exact match to the approved prompt's own cited list. `3321` and `3324` share `idbutur` `907000037` and merge only in this list, never in the geometry (confirmed: they remain two distinct slices). None of the excluded ids (`905110037, 805090037, 506050037, 907060037, 907050037, 761220037, 907070037, 906120037, 907350037`) appear. The shared idbutur `907040037` (covering both `3883` and `3347`) is excluded from the forbidden-detour check by sourceId, never by idbutur.

## P5 -- via fixed exactly to `["Þröskuldar"]`

Confirmed via `toEqual` (not merely `toContain`, per the prompt's own explicit instruction that a looser `toContain` check let a name trap survive in the prior round): `via` is built from exactly one candidate (`"Þröskuldar"`, the real retained name of `3321`/`3324`) and deliberately excludes `"Djúpvegur"` (ambiguous -- also names the Ísafjörður approach), `"Hólmavík"`, `"Gilsfjörður"`, `"Geiradalsvegur"`, `"Innstrandavegur"`, `"Þorskafjarðarheiði"`, and `"Ísafjörður"` as candidates. A dedicated test confirms `"Hólmavík"` IS literally present in the chain's own real names (`3611`'s/`3883`'s own names) while `via` still resolves to exactly `["Þröskuldar"]`.

## P6 -- Þröskuldar-chain-is-necessary negative tests

On the full retained national tier-0 graph (1,564 lines, patched only for the reused `3883`), **with** everything the result is identical to the narrow-region result (30,555.32 m / 4 slices). **Without** any one of `3324`, `3321`, or `3611` individually, the real core returns `geometry_only` (not a disconnection) at **71,909.50390853635 m**, 10 slices -- exact cross-check against the prompt's cited 71,909.50 m -- via `3754[0->61], 3750[0->14], 3718[0->20], 2322[0->62], 2321[0->53], 3415[23->0], 53466[14->0], 3370[42->0], 3347[56->0], 3883[0->3]` (road 60 -> 608 Þorskafjarðarheiði -> Djúp 61 -> Hólmavík), confirmed identical for all three removals. The real positive result was also checked slice-by-slice against the full forbidden vegnr/sourceId lists from P6 -- no match, and every slice's own vegnr is confirmed to be one of `{61, 67}`.

## P7 -- no roundabout, no direction caveat, no safety claim

Confirmed directly: every slice's own `veghluti` is 1, and sourceId `3834` (the Ísafjörður roundabout line) never appears on this chain. No `directed` policy rule was added. `lengthNote` explicitly states this response makes no claim about winter closure, driving conditions, or current access on the Þröskuldar mountain pass.

## P8 -- API wiring and isolation from every other pair

- `holmavik<->junction-60-61-throskuldar` is composed from the new, independent `server_data/westfjords-region-throskuldar-holmavik.json` (own `regionVersion`, 4 lines, one tier 0 per call), branch checked before the general `KNOWN_PLACE_IDS` gate.
- `junction-60-61-throskuldar` is never added to `winter-route-places.json`; paired with anything other than `holmavik` (including `junction-1-68-stadarskali`, `isafjordur`, `junction-1-60-baulan`, `budardalur`, itself, `flokalundur`) it returns `400 unknown_place_id` -- confirmed for all of these.
- `junction-1-68-stadarskali<->holmavik` is byte-identical: **110,073.97484054108 m**, 12 slices, `geometryId` forward `124d9ec93d3906a17c9b2d91d2cb0a73` / reverse `f1933968efffd50843055023053ef516`, `regionVersion` `c1e9cd24a2aaa02c`.
- `isafjordur<->holmavik` is byte-identical: **223,136.98949144362 m**, `geometryId` `2d47312feaa4fa8aa674c7af85616461`.
- `flokalundur<->isafjordur` is byte-identical: **87,618.54830414167 m**, `geometryId` `8b97e2e43a594e5c9b5efc24b82d6736`.
- `flokalundur<->budardalur` is byte-identical: **172,474.2228360156 m**, `geometryId` `9d3e8ed90702ba8c1ddd42da6b77967d`.
- `junction-1-60-baulan<->budardalur` is byte-identical: **42,155.20284701861 m**, `geometryId` `742bbdeda4fa8e8a43497d8baf81ca78`.
- `holmavik` with anything other than `isafjordur`/`junction-1-68-stadarskali`/`junction-60-61-throskuldar` keeps the existing contract (`holmavik<->flokalundur` still `400`, `holmavik<->budardalur` still `200 unsupported endpoint_mapping_unavailable`).
- Regressions re-confirmed passing: Rauðavatn<->Selfoss (44,984.77037809235 m), Egilsstaðir<->Seyðisfjörður (24,148.8609 m), vegur 93, same_place, and the unsupported 51/56 places.

## P9 -- map advisory markers and serving discipline

`map-view.html` shows the route (blue), both endpoints (green: `3321`'s own vertex 0 and `3883`'s own vertex 3), the two owner points (purple: Hólmavík's own coordinate and the Þröskuldar reference point, both explicitly map-only, with the 809.5 m offset shown in the popup), and four real, literal branch points (grey, dashed, each labeled "possible future connection, not confirmed"): vegamót 60/61 (the junction itself, shown for context), 605 Geiradalsvegur (`3321`'s own vertex 7), 61/68 (`3324`'s own end), and J/`3347` (explicitly captioned as an internal node of this pair's own route). Roads 60 and 68 are never shown as part of the selected route.

Served from `127.0.0.1:8775` (confirmed free beforehand; ports 8765-8774 confirmed still responding, undisturbed), `python3 -m http.server 8775 --bind 127.0.0.1` launched from within this task's own directory only. Canonical OSM tile URL, `strict-origin-when-cross-origin` referrer meta, and the `local-file-note` banner, same as every prior map. Route coordinates reused the same independently-implemented native->WGS84 inverse transform already round-trip-validated in prior rounds, re-checked here with a fresh round-trip assertion against the Þröskuldar owner coordinate before use.

**CC did not and cannot visually confirm this map.** This session has no image/screenshot capability; the map is handed over as a working link (`http://127.0.0.1:8775/map-view.html`) for the owner's own review, not a claimed visual PASS. Per P9, this round stops here -- no work was done toward vegur 605/60/68, Drangsnes, Reykhólar, Búðardalur connections, or any leg-combination beyond this one pair.

## Checks run

- `npx vitest run api/_lib/winterRoute/westfjordsThroskuldarHolmavikRegionDataset.test.js` -- 14/14 passed
- `npx vitest run api/winter-route-geometry.test.js` -- 77/77 passed
- `npx vitest run api/` (full suite) -- 771/771 passed
- `npx eslint` on every new/modified file -- clean
- `git status --porcelain` -- scope matches exactly the files listed above plus `docs/ai/CURRENT.md` and the four incidental `server.log` growth files noted above; no other file touched
- `git diff --check` on touched files -- clean (only a benign LF/CRLF line-ending-on-checkout warning, not a diff problem)

## Scope notes

No work was done beyond P1-P9. No new dependency was added. No existing production file other than `api/winter-route-geometry.js` was modified. `vercel.json` was not changed. The map/build-map-data script duplicates the standard transform formula inline (same one-off-script convention as every earlier build script in this ticket) rather than importing it, since it is never needed by production request-time code. This session observed that the five earlier CLOSED rounds have since been committed by the owner (`b24fa95c`) between sessions -- noted for context only, no action taken on it.
