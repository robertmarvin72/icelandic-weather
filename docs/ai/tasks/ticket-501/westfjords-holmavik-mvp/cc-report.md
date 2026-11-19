# CC report -- westfjords-holmavik-mvp (ticket #501)

Executed against `approved-prompt-v1.md` P1-P9. All figures below are real,
measured values from the production core (`composeGeometryPath`,
unmodified) and the production loader, re-run in this session -- never
copied from the approved prompt's own citations without independent
verification. Where a number matches the prompt's own citation, that match
is noted as a cross-check, not assumed.

## Files

New:
- `docs/ai/tasks/ticket-501/westfjords-holmavik-mvp/build-westfjords-isafjordur-holmavik-region.mjs` -- offline build script (one-off, not production)
- `server_data/westfjords-region-isafjordur-holmavik.json` -- new, separate runtime region file (26 lines, no connector)
- `api/_lib/winterRoute/westfjordsIsafjordurHolmavikRegionDataset.js` -- loader
- `api/_lib/winterRoute/westfjordsIsafjordurHolmavikRegionDataset.test.js` -- 15 tests
- `docs/ai/tasks/ticket-501/westfjords-holmavik-mvp/build-map-data.mjs`, `map-data.json`, `map-view.html` -- review map (task-local)

Modified:
- `api/winter-route-geometry.js` -- new `isWestfjordsIsafjordurHolmavikPair` branch, wired before the general known-place-id gate (same pattern as the three existing westfjords branches)
- `api/winter-route-geometry.test.js` -- 6 new tests in a new `describe` block

Never touched: any of the three earlier Westfjords region files or their loaders, `server_data/winter-route-places.json`, `geometryComposition.js`, `vercel.json` (its existing `includeFiles: "server_data/**"` already covers the new file).

## P1 -- literal chain, no connector

The 26-line chain (`3834[5->0], 3833, 3830, 3392, 3298, 3535, 3627, 3629, 3609, 3244, 3218, 3217, 3216, 3220, 3194, 3148, 3195, 3626, 3605, 3419, 3418, 3415, 53466, 3370, 3347, 3883[0->3]`) is connected at every join to <0.001 m, independently re-derived from the raw retained GeoJSON in the dataset test -- **no gap found anywhere**, no connector needed or added. `3834` is reused byte-identical from `westfjords-region-flokalundur-isafjordur.json` (its own existing, literal vertex 5 -- no insertion). VEGNR is "61" throughout except `3883` which is "67" -- confirmed against the raw GeoJSON. Real composed result, `isafjordur -> holmavik`: status `geometry_only`, **223,136.98949144362 m**, 26 slices, sourceId order `3834, 3833, 3830, 3392, 3298, 3535, 3627, 3629, 3609, 3244, 3218, 3217, 3216, 3220, 3194, 3148, 3195, 3626, 3605, 3419, 3418, 3415, 53466, 3370, 3347, 3883` -- exact cross-check against the prompt's own cited 223,136.99 m ± 0.05 / 26 slices. Reverse gives the same sourceId list reversed, same length to 2e-5 m, different `geometryId`. 0 double-counted edges; coordinate-chain sum matches `lengthM` to within 1e-4 m.

## P2 -- Ísafjörður reuse and permitted leg overlap

`region.isafjordur.endpoint` is byte-identical (`x`/`y`, asserted with `toBe`) to the existing `westfjords-region-flokalundur-isafjordur.json`'s own vertex 5 of `3834`. The `3834` slice in this leg is `fromIndex: 5, toIndex: 0, direction: "reverse"`, **870.1081131062895 m** (exact cross-check against the prompt's cited 870.1 m). `3833` and `3834` are also present in the `flokalundur<->isafjordur` leg's own slices (3,130.3737737378515 m, exact cross-check against the prompt's cited 3,130.4 m) -- confirmed as a **permitted overlap** between two independent pair legs, not a bug: no cross-pair sourceId-uniqueness rule exists or was added. Double-counting was checked only within each pair's own single result (0 repeated edges in either), which is the actual correctness requirement.

## P3 -- Hólmavík endpoint

The owner coordinate `(-21.680, 65.705)` is NOT inserted anywhere. The route endpoint is `3883`'s own **literal, existing vertex 3** (native `x: 376742.4201551166, y: 580824.7020691019, z: 0`) -- exact cross-check against the prompt's own cited coordinates. `3883` is completely unmodified (4 vertices). The real measured offset from the owner coordinate is **437.31993395679643 m** (cross-check: 437.32 m), recorded in `accessApproach.ownerCoordinateOffsetM`, excluded from `lengthM`. This endpoint is confirmed byte-identical (0 m difference) to the **existing** `winter-route-places.json` coordinate for `holmavik` -- `places.json` itself is untouched. The junction J (`3347`'s own vertex 0) is recorded separately (`region.holmavik.junctionJ`), 799.4887677108303 m from the owner coordinate (cross-check: 799.5 m) -- confirmed real and different, never used as this pair's endpoint. Since the IdButur list alone cannot distinguish J from the `3883` endpoint (both lie on `idbutur` `907040037`'s own territory), the dataset test pins the exact sourceId/slice/`fromIndex`/`toIndex` and endpoint coordinates directly, not just IdButur.

## P4 -- IdButur list

Real route-validated list (collapsed on consecutive-same-value only): `906120037, 906140037, 906150037, 906160037, 906170037, 907070037, 907050037, 761220037, 907040037` -- exact match to the approved prompt's own cited list. None of the excluded ids (`906130037, 806110037, 906180037, 906190037, 907080037, 907060037, 906520037, 907100037, 907120037, 907000037, 707040037, 907030037`) appear. `roadConditionIds`/`#503` are untouched.

## P5 -- fjord-name trap (Ísafjörður town vs. the fjord at the head of Djúp)

Lines `3195, 3626, 3605, 3419` are literally named `"Djúpvegur: Ísafjörður"` (confirmed against the raw retained `STUTTNAFNLEIDAR` values) -- all four are on the real chain, naming the **fjord**, not the town. `via` is built only from an explicit candidate list (`Súðavík`, `Steingrímsfjarðarheiði`) and deliberately contains no `"Ísafjörður"` candidate at all, so it cannot leak the fjord's own name as a town reference even though the substring is literally present in the chain's own real names -- confirmed by a dedicated test asserting `via` contains `"Súðavík"` and never contains `"Ísafjörður"`. The map places no town-center pin on the fjord.

## P6 -- Djúp-chain-is-necessary negative tests

On the full retained national tier-0 graph (1,564 lines, patched only for the reused `3834`), **with** everything the result is identical to the narrow-region result (223,136.99 m / 26 slices). **Without** `3415` (Steingrímsfjarðarheiði), the real core returns `geometry_only` (not a disconnection) at **268,841.20215735293 m**, 30 slices -- exact cross-check against the prompt's cited 268,841.20 m -- with `idbutur` list containing `907060037, 560800037, 905130037, 905110037, 907000037, 707040037` exactly as cited (the 608/60/Þröskuldar detour). **Without** `3626` instead, the result is **228,544.39479358078 m**, 31 slices -- exact cross-check against the prompt's own optional second figure (228,544.40 m), routed via F66 (`2077`) and Dýrafjarðargöng, confirmed. The real positive result was also checked slice-by-slice against the full forbidden vegnr/sourceId lists from P6 -- no match.

## P7 -- roundabout caveat (visible, not a blocker)

Confirmed directly from the real core's own slice output: `isafjordur -> holmavik`'s `3834` slice has `direction: "reverse"` (the arc at vertices 2-4 is walked 4->3->2, against the line's own stored forward direction); `holmavik -> isafjordur`'s `3834` slice has `direction: "forward"` (the arc is walked 2->3->4, with the line's own direction) -- the mirror image of the prior round's own direction labeling, confirmed empirically rather than assumed from the prompt's own text. Documented in the response's own `lengthNote` (both directions). No `directed` policy rule was added; VEGHLUTI is 1 throughout.

## P8 -- API wiring and isolation from every other pair

- `isafjordur<->holmavik` is composed from the new, independent `server_data/westfjords-region-isafjordur-holmavik.json` (own `regionVersion`, 26 lines, one tier 0 per call), branch checked before the general `KNOWN_PLACE_IDS` gate.
- `flokalundur<->isafjordur` is byte-identical to before this round: **87,618.54830414167 m**, 18 slices, `geometryId` forward `8b97e2e43a594e5c9b5efc24b82d6736` / reverse `0eebee66c0e5303de512b9f643fcc75a`, `regionVersion` `06fca99f301d1444` (re-asserted literally in the new handler test).
- `flokalundur<->budardalur` is byte-identical: **172,474.2228360156 m**, `geometryId` `9d3e8ed90702ba8c1ddd42da6b77967d`.
- `junction-1-60-baulan<->budardalur` is byte-identical: **42,155.20284701861 m**, `geometryId` `742bbdeda4fa8e8a43497d8baf81ca78`.
- `holmavik` with anything other than `isafjordur` (e.g. `budardalur`, `flokalundur`) keeps the existing `200 unsupported endpoint_mapping_unavailable` contract (`holmavik` is already a known 56-list place id, like `isafjordur`) -- `holmavik<->flokalundur` specifically falls through to the existing general-gate `400 unknown_place_id` because `flokalundur` itself is not a known place id (unchanged existing behavior, confirmed).
- `isafjordur` with anything other than `flokalundur`/`holmavik` keeps the same existing `200 unsupported endpoint_mapping_unavailable` contract.
- Regressions re-confirmed passing: Rauðavatn<->Selfoss (44,984.77037809235 m), vegur 93, same_place, and the unsupported 51/56 places.

## P9 -- map advisory markers and serving discipline

`map-view.html` shows the route (blue), both endpoints (green: the reused `3834` vertex 5 and `3883`'s own vertex 3), the Hólmavík owner coordinate (purple), the junction J (dark grey, explicitly labeled as not this pair's endpoint), the roundabout (magenta), and ten real, literal branch points (grey, dashed, each labeled "possible future connection, not confirmed"): Þorskafjarðarheiði (608), Kollafjarðarheiði (F66), Djúpvegur-Skjaldfönn (635), two 633 points (Vestanverður Mjóifjörður, Vatnsfjarðarnes), the 634 fjord-name point (explicitly captioned as the fjord, not the town), Djúpvegur-Drangsnes (643), Hrófá-Hólmavík (61, at J), Tungudalur (60, Vestfjarðagöng), and Eyrarhlíð (61). Every branch-point coordinate is a real, literal vertex shared with this chain (distance 0 in the raw retained WGS84 data); none are composed into any route or presented as a confirmed ID connection.

Served from `127.0.0.1:8773` (confirmed free beforehand; ports 8765-8772 confirmed still responding, undisturbed), `python3 -m http.server 8773 --bind 127.0.0.1` launched from within this task's own directory only. Canonical OSM tile URL, `strict-origin-when-cross-origin` referrer meta, and the `local-file-note` banner, same as every prior map. Route coordinates reused the same independently-implemented native->WGS84 inverse transform already round-trip-validated in prior rounds, re-checked here with a fresh round-trip assertion against the Hólmavík owner coordinate before use.

**CC did not and cannot visually confirm this map.** This session has no image/screenshot capability; the map is handed over as a working link (`http://127.0.0.1:8773/map-view.html`) for the owner's own review, not a claimed visual PASS. Per P9, this round stops here -- no work was done toward 68/Þröskuldar/Drangsnes/Bolungarvík/Suðurfirðir as destinations, or any ferry connection.

## Checks run

- `npx vitest run api/_lib/winterRoute/westfjordsIsafjordurHolmavikRegionDataset.test.js` -- 15/15 passed
- `npx vitest run api/winter-route-geometry.test.js` -- 65/65 passed
- `npx vitest run api/` (full suite) -- 730/730 passed
- `npx eslint` on every new/modified file -- clean
- `git status --porcelain` -- scope matches exactly the files listed above plus `docs/ai/CURRENT.md`; no other file touched
- `git diff --check` on touched files -- clean

## Scope notes

No work was done beyond P1-P9. No new dependency was added. No existing production file other than `api/winter-route-geometry.js` was modified. `vercel.json` was not changed. The map/build-map-data script duplicates the standard transform formula inline (same one-off-script convention as every earlier build script in this ticket) rather than importing it, since it is never needed by production request-time code.


## Ripley correction — 2026-11-19

S2 wording corrected in P3: J and the 3883 endpoint share IdButur 907040037. Production data and tests already used the correct value; no code/data change.
