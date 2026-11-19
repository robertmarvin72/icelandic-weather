# CC report -- westfjords-isafjordur-mvp (ticket #501)

Executed against `approved-prompt-v1.md` P1-P9. All figures below are real,
measured values from the production core (`composeGeometryPath`,
unmodified) and the production loader, re-run in this session -- never
copied from the approved prompt's own citations without independent
verification. Where a number matches the prompt's own citation, that match
is noted as a cross-check, not assumed.

## Files

New:
- `docs/ai/tasks/ticket-501/westfjords-isafjordur-mvp/build-westfjords-flokalundur-isafjordur-region.mjs` -- offline build script (one-off, not production)
- `server_data/westfjords-region-flokalundur-isafjordur.json` -- new, separate runtime region file (18 lines, no connector)
- `api/_lib/winterRoute/westfjordsFlokalundurIsafjordurRegionDataset.js` -- loader
- `api/_lib/winterRoute/westfjordsFlokalundurIsafjordurRegionDataset.test.js` -- 14 tests
- `docs/ai/tasks/ticket-501/westfjords-isafjordur-mvp/build-map-data.mjs`, `map-data.json`, `map-view.html` -- review map (task-local)

Modified:
- `api/winter-route-geometry.js` -- new `isWestfjordsFlokalundurIsafjordurPair` branch, wired before the general known-place-id gate (same pattern as the two existing westfjords branches)
- `api/winter-route-geometry.test.js` -- 7 new tests in a new `describe` block

Never touched: `westfjords-region-1-60-budardalur.json`, `westfjords-region-budardalur-flokalundur.json`, their loaders, `server_data/winter-route-places.json`, `geometryComposition.js`, `vercel.json` (its existing `includeFiles: "server_data/**"` already covers the new file).

## P1 -- literal chain, no connector

The 18-line chain (`3648[50->53], 3009, 3008, 2870, 38085, 38087, 38088, 2994, 3003, 2767, 2993, 2297, 2890, 2618, 2600, 3835, 3833, 3834[0->5]`) is connected at every join to <0.001 m, independently re-derived from the raw retained GeoJSON in the dataset test -- **no gap found anywhere**, no connector needed or added. `3648` is reused byte-identical from `westfjords-region-budardalur-flokalundur.json` (its own already-inserted Flókalundur node). VEGNR is "60" throughout except `3833`/`3834` which are "61" -- confirmed against the raw GeoJSON. Real composed result, `flokalundur -> isafjordur`: status `geometry_only`, **87,618.54830414167 m**, 18 slices, sourceId order `3648, 3009, 3008, 2870, 38085, 38087, 38088, 2994, 3003, 2767, 2993, 2297, 2890, 2618, 2600, 3835, 3833, 3834` -- exact cross-check against the prompt's own cited 87,618.55 m ± 0.05 / 18 slices. Reverse gives the same sourceId list reversed, length within 3e-11 m, different `geometryId`. 0 double-counted edges (all 18 sourceIds distinct); coordinate-chain sum matches `lengthM` to within 1e-4 m.

## P2 -- Flókalundur reuse and 3648 no-overlap proof

`region.flokalundur.insertedNode` is byte-identical (`x`/`y`, asserted with `toBe`) to the existing `westfjords-region-budardalur-flokalundur.json`'s own node. The new slice `3648[50->53]` measures **346.7728648450341 m** (exact cross-check against the prompt's cited 346.77 m). The prior round's own leg uses `3648[0->50]` (**11,288.093890423123 m**); sum = **11,634.866755268156 m**, matching the full, unmodified `3648` line's own length (**11,634.866755268158 m**) to within 3e-9 m -- no overlap. Optional offline-only proof (not a new route, per the prompt's own framing): `budardalur -> isafjordur` in one hypothetical future call, WITH the prior round's own connector, = 172,474.2228360156 + 87,618.54830414167 = **260,092.77114015727 m**, matching the prompt's own cited ≈260,092.771 m.

## P3 -- Ísafjörður endpoint

The owner coordinate `(-23.121, 66.074)` is NOT inserted anywhere. The route endpoint is `3834`'s own **literal, existing vertex 5** (native `x: 313430.1109331023, y: 625946.2219128008, z: 0`) -- exact cross-check against the prompt's own cited coordinates. `3834` is completely unmodified (13 vertices, verified). The real measured offset from the owner coordinate is **164.61838967158116 m** (cross-check: 164.62 m), recorded in `accessApproach.ownerCoordinateOffsetM`, excluded from `lengthM`. Vertex 12 (`3834`'s own full end) is byte-identical to the **existing** `winter-route-places.json` coordinate for `isafjordur` (confirmed via forward-transforming that file's own stored lat/lon and comparing to 0 m difference) -- deliberately not used as this pair's endpoint. `places.json` itself is untouched.

## P4 -- roundabout caveat (visible, not a blocker)

`3834`'s own vertices 2-4 are byte-identical to `25602`'s own vertices 0-2 (confirmed against the raw retained GeoJSON) -- a literal roundabout coincidence, not a bug. Only `3834[0->5]` ever appears as a slice; `25602`/`25603` never appear as a slice in either direction (confirmed in the forbidden-sourceId test). The arc `3834[2->4]` measures **39.18049953464036 m** (cross-check: 39.18 m). `flokalundur -> isafjordur` traverses this arc in `3834`'s own forward direction; `isafjordur -> flokalundur` traverses the same arc against that direction -- the core does not split a line into direction-dependent portions, so no `directed` policy rule was added (that would ban or allow the whole line, not just the roundabout arc). This is documented in the response's own `lengthNote` (both directions) and in this report, not corrected with a new line or node, per the prompt's own instruction.

## P5 -- tunnel-is-necessary negative test

On the full retained national tier-0 graph (1,564 lines, patched only for the reused `3648`), **with** `38087` the result is identical to the narrow-region result (87,618.548 m / 18 slices) -- no shorter wrong detour is silently preferred even on the full graph. **Without** `38087` (Dýrafjarðargöng), the real core returns `geometry_only` (not a disconnection) at **115,085.17645796077 m**, 22 slices -- exact cross-check against the prompt's cited 115,085.18 m -- routed through `17922, 39700, 3006, 40005, 2272, 2399` instead of the tunnel, with `idbutur` list containing `906210037, 906020037, 662210037, 906540037` exactly as cited. This is `westfjordsFlokalundurIsafjordurRegionDataset.test.js`'s own negative test, using the full fixture (required here since this pair's own narrow region has no detour roads in it at all -- removing the tunnel there simply disconnects, which would not demonstrate the real silent-wrong-answer danger P5 describes). The real positive result was also checked slice-by-slice against the full forbidden vegnr/sourceId lists from P5 -- no match.

## P6 -- IdButur list

Real route-validated list (collapsed on consecutive-same-value only): `905170037, 660350037, 905310037, 906010037, 906720037, 806030037, 906040037, 906070037, 906080037, 664020037, 906700037, 806110037, 906120037` -- exact match to the approved prompt's own cited list, including `660350037` (line `3009`) and `906120037` (lines `3833`/`3834`) because those sourceIds are literally on the chain. None of the excluded ids (`905180037, 905300037, 606210037, 906210037, 906540037, 906050037, 662710037, 662510037, 906090037, 665010037, 906130037, 906140037, 906710037`) appear. `roadConditionIds`/`#503` are untouched.

## P7 -- API wiring and isolation from every other pair

- `flokalundur<->isafjordur` is composed from the new, independent `server_data/westfjords-region-flokalundur-isafjordur.json` (own `regionVersion`, 18 lines, one tier 0 per call), branch checked before the general `KNOWN_PLACE_IDS` gate.
- `flokalundur<->budardalur` is byte-identical to before this round: **172,474.2228360156 m**, 21 slices, `geometryId` forward `9d3e8ed90702ba8c1ddd42da6b77967d` / reverse `751dbdae1921b182d2f595a78c737ecb`, `regionVersion` `2f68aa481848357b` (re-asserted literally in the new handler test).
- `junction-1-60-baulan<->budardalur` is byte-identical: **42,155.20284701861 m**, `geometryId` `742bbdeda4fa8e8a43497d8baf81ca78`.
- `flokalundur` with any other pair (e.g. `hella`, `junction-1-60-baulan`) still returns `400 unknown_place_id`.
- `isafjordur` -- already a known place id in the 56-list, but with no entry in the main tier-2 pilot's own `endpoints` map -- keeps its existing `200 unsupported endpoint_mapping_unavailable` contract with every other pair, including `budardalur`, `hella`, `reykjavik-raudavatn`, and `isafjordur<->isafjordur` (same_place is never fabricated for it). Tested explicitly.
- Regressions re-confirmed passing: Rauðavatn<->Selfoss (44,984.77037809235 m), vegur 93, same_place, and the unsupported 51/56 places.

## P8 -- map advisory markers

`map-view.html` shows the route (blue), both tunnels marked distinctly (Dýrafjarðargöng in brown, the "Vestfjarðagöng" pair -- `2618`/`2600`, real names Breiðadalsleggur/Tungudalsleggur -- in purple), both endpoints (green: the reused Flókalundur node and `3834`'s own vertex 5), the Ísafjörður owner coordinate (purple), the existing `places.json` point (dark grey, explicitly labeled as not used by this pair), the roundabout (magenta, with the direction-mismatch note), and seven real, literal branch points (grey, dashed, each labeled "possible future connection, not confirmed"): Flugvöllur-Dynjandisheiði (63), Vestfjarðavegur-Hrafnseyri (621/626), Vestfjarðavegur-Þingeyri (622), Flateyrarvegur (64), Botnsdalsleggur/Suðureyri (65), the 3835-end Súðavík/Djúp point (61), and Eyrarhlíð (61). Every branch-point coordinate is a real, literal vertex shared with this chain (distance 0 in the raw retained WGS84 data); none are composed into any route or presented as a confirmed ID connection. The colloquial "Vestfjarðagöng" label is used only on the map (P8's own instruction), never in the API's own `via` field, since it is not a literal retained line name -- the API's `via` field uses only "Dýrafjarðargöng" (the real, matching `STUTTNAFNLEIDAR` value).

## P9 -- map serving and visual review discipline

Served from `127.0.0.1:8772` (confirmed free beforehand; ports 8765-8771 confirmed still responding, undisturbed), `python3 -m http.server 8772 --bind 127.0.0.1` launched from within this task's own directory only. Canonical OSM tile URL, `strict-origin-when-cross-origin` referrer meta, and the `local-file-note` banner, same as every prior map. Route coordinates reused the same independently-implemented native->WGS84 inverse transform already round-trip-validated in the prior round (<1e-9 degrees), re-checked here with a fresh round-trip assertion against the Ísafjörður owner coordinate before use.

**CC did not and cannot visually confirm this map.** This session has no image/screenshot capability; the map is handed over as a working link (`http://127.0.0.1:8772/map-view.html`) for the owner's own review, not a claimed visual PASS. Per P9, this round stops here -- no work was done toward Djúp/Súðavík/Bolungarvík/Hólmavík/Þröskuldar, Þingeyri/Flateyri/Suðureyri/Bíldudalur as destinations, or any ferry connection. The Vestfjarðagöng single-lane/pull-out caveat is documented in the map panel as general knowledge, not a data-confirmed fact, and the retained data's own VEGHLUTI 1 (undirected two-way assumption) is left unchanged.

## Checks run

- `npx vitest run api/_lib/winterRoute/westfjordsFlokalundurIsafjordurRegionDataset.test.js` -- 14/14 passed
- `npx vitest run api/winter-route-geometry.test.js` -- 59/59 passed
- `npx vitest run api/` (full suite) -- 709/709 passed
- `npx eslint` on every new/modified file -- clean
- `git status --porcelain` -- scope matches exactly the files listed above plus `docs/ai/CURRENT.md`; no other file touched
- `git diff --check` on touched files -- clean

## Scope notes

No work was done beyond P1-P9. No new dependency was added. No existing production file other than `api/winter-route-geometry.js` was modified. `vercel.json` was not changed (its existing `includeFiles: "server_data/**"` already covers the new region file). The map/build-map-data script duplicates the standard transform formula inline (same one-off-script convention as every earlier build script in this ticket) rather than importing it, since it is never needed by production request-time code.


## Ripley final-assessment clarification — 2026-11-19

Technical PASS: independently13files/238focused tests and lint on
Windows. Full api/709 remains CC-attributed. Visual owner acceptance
pending. The map label "621/626" is positioned at the626Hrafnseyri
branch; it is not the separate621Dynjandavegur junction. That distinct
marker was not delivered; the actual selected route is unaffected.
The39.18m reverse roundabout arc on isafjordur->flokalundur is an
accepted visible MVP limitation, not proof of correct driving direction.
