# CC report -- westfjords-road68-mvp (ticket #501)

Executed against `approved-prompt-v1.md` P1-P9. All figures below are real,
measured values from the production core (`composeGeometryPath`,
unmodified) and the production loader, re-run in this session -- never
copied from the approved prompt's own citations without independent
verification. Where a number matches the prompt's own citation, that match
is noted as a cross-check, not assumed.

## Files

New:
- `docs/ai/tasks/ticket-501/westfjords-road68-mvp/build-westfjords-road68-holmavik-region.mjs` -- offline build script (one-off, not production)
- `server_data/westfjords-region-1-68-holmavik.json` -- new, separate runtime region file (12 lines, no connector)
- `api/_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.js` -- loader
- `api/_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.test.js` -- 15 tests
- `docs/ai/tasks/ticket-501/westfjords-road68-mvp/build-map-data.mjs`, `map-data.json`, `map-view.html` -- review map (task-local)

Modified:
- `api/winter-route-geometry.js` -- new `isWestfjordsRoad68HolmavikPair` branch, wired before the general known-place-id gate (same pattern as the four existing westfjords branches)
- `api/winter-route-geometry.test.js` -- 6 new tests in a new `describe` block

Never touched: any of the four earlier Westfjords region files or their loaders, `server_data/winter-route-places.json` (the new `junction-1-68-stadarskali` id is never added to it), `geometryComposition.js`, `vercel.json`.

## P1 -- literal chain, no connector, CC's own measurement

The 12-line chain (`1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690, 3611, 3883[0->3]`) is connected at every join to <0.001 m, independently re-derived from the raw retained GeoJSON in the dataset test -- **no gap found anywhere**, no connector needed or added. VEGNR is "68" for the first ten lines, "61" for `3611`, "67" for `3883` -- confirmed against the raw GeoJSON. Real composed result, `junction-1-68-stadarskali -> holmavik`: status `geometry_only`, **110,073.97484054108 m**, 12 slices, sourceId order exactly as above. CC's own measurement is within 2.8e-9 m of the prompt's own cited sandbox figure (110,073.97484053829 m) -- well inside the ±0.05 m tolerance the prompt itself sets as the STOP threshold. Reverse gives the same sourceId list reversed, length within 3e-11 m, different `geometryId`. 0 double-counted edges; coordinate-chain sum matches `lengthM` to within 1e-4 m.

## P2 -- junction endpoint, no owner offset on that side

The route endpoint is `1796`'s own **literal, existing vertex 0** (native `x: 402624.25943867606, y: 517951.9698086749, z: 4.585` -- the real z value, never zeroed). `1796` is completely unmodified (31 vertices). Independently confirmed that this exact XY is shared with `1481`'s own end and `3828`'s own start (both 0 m away) -- neither `1481` nor `3828` is a line in this region file; they are not on this route, consistent with the prompt's own P2 instruction. This endpoint carries no `ownerCoordinateOffsetM` of its own (same convention as `junction-1-60-baulan`), since the owner's own Hrútafjörður point is not the endpoint. That reference point (`-21.094, 65.153`) is recorded separately in the region file as `junction.ownerReference`, **1,097.7223678800865 m** from the endpoint (cross-check: 1,097.72 m) -- the nearest literal point on `1796` to that owner coordinate is 403.5122630239918 m away (cross-check: 403.51 m) and is never used as an "approach". Neither value is counted in `lengthM`.

## P3 -- Hólmavík endpoint and J as an internal node

The route endpoint is `3883`'s own existing vertex 3, byte-identical (`x`/`y`, asserted with `toBe`) to the one already established in `westfjords-region-isafjordur-holmavik.json`. In THIS pair, J (`3611`'s own end = `3883`'s own vertex 0 = `3347`'s own vertex 0) is a real **internal node** of the route -- the split from `3611` into `3883` is literal, and the final slice is pinned exactly: `sourceId: 3883, fromIndex: 0, toIndex: 3`, **517.4229774386502 m** (cross-check: 517.4 m). The wrong result that would occur if `3347` were mistakenly treated as the endpoint (109,556.57 m) was checked and does not occur. This is the deliberate opposite of the prior round's own "J is not used" framing -- here J is correctly on the path, not the endpoint.

## P4 -- IdButur list, including 707040037

Real route-validated list (collapsed on consecutive-same-value only): `907350037, 907010037, 907020037, 907030037, 707040037, 907040037` -- exact match to the approved prompt's own cited list, including `707040037` (now legitimately on this chain via `3611`, unlike its exclusion in the prior Ísafjörður<->Hólmavík round). None of the excluded ids (`904060037, 907150037, 905050037, 907000037, 907060037, 906120037, 907070037, 907050037, 761220037, 806110037`) appear. The shared idbutur `907040037` (covering both `3883` and `3347`) is excluded from the forbidden-detour check by **sourceId** (`3347, 3324, 3321, 2744, 1481, 3828`), never by idbutur, per the prompt's own instruction.

## P5 -- via names and the deliberate name traps

Real retained names were independently read from both the GeoJSON's own `STUTTNAFNLEIDAR` field and the retained 708 IdButur table's own `FulltNafnButs` field (the latter parsed fresh in the dataset test, not reused from the build script). `via` is built only from an explicit candidate list (`"Innstrandavegur"`, `"Broddanes"`) and deliberately excludes `"Laxárdalsheiði"`, `"Þröskuldar"`, `"Djúpvegur"`, `"Ísafjörður"`, `"Hólmavík"`, and `"Staðarskáli"` as candidates -- confirmed necessary, since the real retained names on this exact chain literally contain `"Laxárdalsheiði"` (e.g. `"Staðarskáli-Laxárdalsheiði"`), `"Djúpvegur"` (the 708 table's own `FulltNafnButs` for both `3611` and `3883`), and `"Hólmavík"` (both `3611`'s and `3883`'s own real names) -- a test confirms these substrings ARE present on the chain's own real names while `via` never surfaces them.

## P6 -- road-68-chain-is-necessary negative tests, on the full national graph

The prompt's own narrow-dataset negative test is empty (the narrow region simply disconnects). On the full retained national tier-0 graph (1,564 lines, patched only for the reused `3883`), **with** everything the result is identical to the narrow-region result (110,073.97 m / 12 slices). **Without** `3411`, the real core returns `geometry_only` (not a disconnection) at **126,491.12180578875 m**, 20 slices -- exact cross-check against the prompt's cited 126,491.12 m -- via the Þröskuldar/60 detour (confirmed containing forbidden sourceIds `3324`/`2109`). **Without** `3611` instead, the result is **168,331.07483938918 m**, 25 slices -- exact cross-check against the prompt's own optional second figure (168,331.07 m). The real positive result was also checked slice-by-slice against the full forbidden vegnr/sourceId lists from P6 -- no match, and every slice's own vegnr is confirmed to be one of `{61, 67, 68}`.

## P7 -- no roundabout, no direction caveat on this route

Confirmed directly: every slice's own `veghluti` is 1, and sourceId `3834` (the Ísafjörður roundabout line from the prior round) never appears on this chain -- the roundabout caveat from `isafjordur<->holmavik` does not apply here and was not carried over. No `directed` policy rule was added.

## P8 -- API wiring and isolation from every other pair

- `holmavik<->junction-1-68-stadarskali` is composed from the new, independent `server_data/westfjords-region-1-68-holmavik.json` (own `regionVersion`, 12 lines, one tier 0 per call), branch checked before the general `KNOWN_PLACE_IDS` gate.
- `junction-1-68-stadarskali` is never added to `winter-route-places.json`; paired with anything other than `holmavik` (including `isafjordur`, `junction-1-60-baulan`, `budardalur`, itself, `flokalundur`) it returns `400 unknown_place_id` -- confirmed for all of these.
- `isafjordur<->holmavik` is byte-identical to before this round: **223,136.98949144362 m**, 26 slices, `geometryId` forward `2d47312feaa4fa8aa674c7af85616461` / reverse `ffe6847001f2be1ed57d85a874d2c48a`, `regionVersion` `adfc38ce4897744c`.
- `flokalundur<->isafjordur` is byte-identical: **87,618.54830414167 m**, `geometryId` `8b97e2e43a594e5c9b5efc24b82d6736`.
- `flokalundur<->budardalur` is byte-identical: **172,474.2228360156 m**, `geometryId` `9d3e8ed90702ba8c1ddd42da6b77967d`.
- `junction-1-60-baulan<->budardalur` is byte-identical: **42,155.20284701861 m**, `geometryId` `742bbdeda4fa8e8a43497d8baf81ca78`.
- `holmavik` with anything other than `isafjordur`/`junction-1-68-stadarskali` keeps the existing contract (confirmed `holmavik<->flokalundur` still `400`, `holmavik<->budardalur` still `200 unsupported endpoint_mapping_unavailable`).
- Regressions re-confirmed passing: Rauðavatn<->Selfoss (44,984.77037809235 m), Egilsstaðir<->Seyðisfjörður (24,148.860880942146 m, cross-check against the prompt's own cited 24,148.8609 m), vegur 93, same_place, and the unsupported 51/56 places.

## P9 -- map advisory markers and serving discipline

`map-view.html` shows the route (blue), both endpoints (green: `1796`'s own vertex 0 and `3883`'s own vertex 3), the two owner points (purple: Hólmavík's own coordinate and the Hrútafjörður reference point, both explicitly map-only), and four real, literal branch points (grey, dashed, each labeled "possible future connection, not confirmed"): Hringvegur 1 (at the junction itself, shown for context), Laxárdalsheiði (59, at `1720`'s own vertex 9), Þröskuldar (`3324`'s own end), and Djúpvegur `3347`/J (explicitly captioned as an internal node of this pair's own route, not a separate endpoint or future-connection candidate here).

Served from `127.0.0.1:8774` (confirmed free beforehand; ports 8765-8773 confirmed still responding, undisturbed), `python3 -m http.server 8774 --bind 127.0.0.1` launched from within this task's own directory only. Canonical OSM tile URL, `strict-origin-when-cross-origin` referrer meta, and the `local-file-note` banner, same as every prior map. Route coordinates reused the same independently-implemented native->WGS84 inverse transform already round-trip-validated in prior rounds, re-checked here with a fresh round-trip assertion against the Hrútafjörður owner coordinate before use.

**CC did not and cannot visually confirm this map.** This session has no image/screenshot capability; the map is handed over as a working link (`http://127.0.0.1:8774/map-view.html`) for the owner's own review, not a claimed visual PASS. Per P9, this round stops here -- no work was done toward 59/Búðardalur, Þröskuldar, Drangsnes, Hringvegur north/south, or any leg-combination beyond this one pair.

## Checks run

- `npx vitest run api/_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.test.js` -- 15/15 passed
- `npx vitest run api/winter-route-geometry.test.js` -- 71/71 passed
- `npx vitest run api/` (full suite) -- 751/751 passed
- `npx eslint` on every new/modified file -- clean (one irregular-whitespace BOM-literal error found and fixed during this round, in the test file and the build script, before the final lint pass)
- `git status --porcelain` -- scope matches exactly the files listed above plus `docs/ai/CURRENT.md`; no other file touched
- `git diff --check` on touched files -- clean

## Scope notes

No work was done beyond P1-P9. No new dependency was added. No existing production file other than `api/winter-route-geometry.js` was modified. `vercel.json` was not changed. The map/build-map-data script duplicates the standard transform formula inline (same one-off-script convention as every earlier build script in this ticket) rather than importing it, since it is never needed by production request-time code. The build script additionally reads the retained 708 IdButur CSV (`Vegagerdin-faerdarkaflar-708.csv`) solely to attach the `FulltNafnButs` name (e.g. "Innstrandavegur") used only for `via` matching -- never for route selection, confirmation, or any `#503`/live-færð purpose.
