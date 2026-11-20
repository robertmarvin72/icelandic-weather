# CC report -- westfjords-patreksfjordur-mvp (ticket #501)

Executed against `approved-prompt-v1.md` P1-P10. All figures below are
real, measured values from the production core (`composeGeometryPath`,
unmodified) and the production loader, re-run in this session -- never
copied from the approved prompt's own citations without independent
verification. Where a number matches the prompt's own citation, that match
is noted as a cross-check, not assumed.

## Files

New:
- `docs/ai/tasks/ticket-501/westfjords-patreksfjordur-mvp/build-westfjords-flokalundur-patreksfjordur-region.mjs` -- offline build script (one-off, not production)
- `server_data/westfjords-region-flokalundur-patreksfjordur.json` -- new, separate runtime region file (7 lines + one connector)
- `api/_lib/winterRoute/westfjordsFlokalundurPatreksfjordurRegionDataset.js` -- loader
- `api/_lib/winterRoute/westfjordsFlokalundurPatreksfjordurRegionDataset.test.js` -- 16 tests
- `docs/ai/tasks/ticket-501/westfjords-patreksfjordur-mvp/build-map-data.mjs`, `map-data.json`, `map-view.html` -- review map (task-local)

Modified:
- `api/winter-route-geometry.js` -- new `isWestfjordsFlokalundurPatreksfjordurPair` branch, wired before the general known-place-id gate (same pattern as the seven existing westfjords branches)
- `api/winter-route-geometry.test.js` -- 6 new tests in a new `describe` block

Never touched: any of the seven earlier Westfjords region files or their loaders, `server_data/winter-route-places.json` (the new `flokalundur` pairing is additive only; `patreksfjordur` was already in the 56-list and is unchanged), `geometryComposition.js`, `vercel.json`.

## P1 -- literal chain, CC's own measurement

The chain `3648[50->53], 3698[0->22], 3339[0->53], 3334[0->49], 3332[0->69], 2271[0->59]` is connected at every join to <0.001 m, independently re-derived from the raw retained GeoJSON in the dataset test. VEGNR is "60" only on the reused `3648`, "62" throughout the rest (including `53127`) -- confirmed. Real composed result, `flokalundur -> patreksfjordur`: status `geometry_only`, **61,400.098965121026 m**, 8 slices, sourceId order `3648, 3698, 3339, 3334, 3332, 2271, -5, 53127`. CC's own measurement is within 1e-9 m of the prompt's own cited sandbox minimum (61,400.09896512219 m) -- well inside the ±0.05 m STOP threshold. Reverse gives the same sourceId list reversed, length within 3e-11 m, different `geometryId`. 0 double-counted edges; coordinate-chain sum matches `lengthM` to within 1e-4 m.

## P2 -- the one approved estimated connector

Real measured gap between `2271`'s own end and `53127`'s own start: **4.39318262751713 m** (cross-check: 4.3932 m / 4.393183 m) -- confirmed <=5 m, the approved ceiling for this specific, owner-authorized connector. Connector: `sourceId: -5` (distinct from every earlier connector in this ticket: -1 south pilot, -2/-3 north option, -4 Búðardalur-Flókalundur), `idbutur: null`, non-WFS `evidenceRef` (`"pilot-connector:estimated-westfjords-2271-53127"`), two vertices that are literal copies of the two real endpoints with **z copied from those endpoints (0 in this case), never null** -- the build script throws if either z is null, and a dedicated test confirms zero `z: null` entries anywhere in the composed coordinate chain. The connector's own length is surfaced separately as `estimatedConnectorLengthM` (confirmed ≈4.39 in the real handler response) and its slice is marked `estimated: true`. No other connector was added or needed anywhere else in the chain.

## P3 -- Patreksfjörður endpoint

Owner coordinate `(-23.994, 65.597)` projects onto `53127`'s own real geometry at segment index 6 of 10 (0-indexed), offset **8.775919534139193 m** (cross-check: 8.7759 m), `t = 0.4677877934094363` (cross-check: 0.46778779), inserted point `(269924.76731277065, 575660.3516744098, z: 0)` (cross-check: matches the prompt's own cited coordinates to the available precision). Inserted as `53127`'s new vertex index 7 of 12 total after insertion (confirmed: the build script throws if the nearest segment is not index 6, and a dataset test confirms collinearity with the real segment). The final slice is `53127[0->7]`, **1,380.24 m**-equivalent length (verified via the real composed slice). This endpoint is confirmed distinct from the existing `winter-route-places.json` vertex 0 for `patreksfjordur` (1,291.367515735866 m from the owner coordinate -- cross-check: 1,291 m) and from the nearest raw vertex (56.313243637731134 m -- cross-check: 56.3 m), neither of which was used. `places.json` itself is untouched.

## P4 -- Flókalundur endpoint and 3648

`region.flokalundur.insertedNode` is byte-identical (`x`/`y`, asserted with `toBe`) to the existing `westfjords-region-budardalur-flokalundur.json`'s own node (offset 51.30036446804795 m, unchanged from that round). The 60/62 junction (`3648`'s own vertex 53) is confirmed to be an internal node of the composed route, never the endpoint. `3009`/`3868` (vegur 60, Dynjandisheiði/Bíldudalsvegur) are confirmed absent from this region's own `lines` array.

## P5 -- IdButur list

Real route-validated list (connector's own `null` skipped): `905170037, 905180037, 905190037, 905200037, 905250037, 562070037` -- exact match to the approved prompt's own cited list. None of the excluded sourceIds' own idbutur values leak in (checked by sourceId exclusion per the prompt's own instruction, not by idbutur proximity).

## P6 -- via fixed exactly to `["Brjánslækur", "Kleifaheiði"]`

Confirmed via `toEqual`: `via` is built from exactly two candidates (`"Brjánslækur"`, matching the real retained names `"Flókalundur-Brjánslækur"` and `"Brjánslækur-Siglunesvegur"`; `"Kleifaheiði"`, matching `3332`'s own real name) and deliberately excludes `"Siglunesvegur"`, `"Flókalundur"`, `"Patreksfjörður"` (the endpoints themselves), `"Raknadalshlíð"`, `"Dynjandisheiði"`, `"Bíldudalur"`, `"Tálknafjörður"`, `"Miklidalur"`, and any ferry name (`"Flatey"`/`"Baldur"`) as candidates. A dedicated test confirms `"Siglunesvegur"` IS literally present in the chain's own real names while `via` still resolves to exactly the two required values.

## P7 -- two negative tests, both on the full national graph

**(a)** Removing the connector from the composed `lines` makes the real core return `unsupported` / `disconnected_graph` -- confirmed; no silent snapping across the gap occurs (the test fails if the core instead returns `geometry_only`). **(b)** On the full retained national tier-0 graph (1,564 lines, patched only for the reused `3648` and the inserted `53127`), **with** `3339` the result is identical to the narrow-region result (61,400.10 m / 8 slices). **Without** `3339` (a vegur-62 midline), the real core returns `geometry_only` (not a disconnection) at **72,208.40778649326 m**, 11 slices -- exact cross-check against the prompt's cited 72,208.40778649 m -- via `3648[50->53], 3009[0->39], 2318[66->0], 2319[79->0], 2997[22->0], 34243[13->0], 3111[34->0], 2088[93->0], 3361[53->0], -5[0->1], 53127[0->7]` (vegur 60 -> 63 -> Miklidalur), confirming the connector itself is reused by the detour (since the detour reaches the same `53127` approach) but the overall P1-approved chain is not satisfied. The real positive result was also checked slice-by-slice against the full forbidden sourceId list from P7 -- no match, and every non-connector slice's own vegnr is confirmed to be "60" only for `3648` and "62" for everything else.

## P8 -- no roundabout, no safety claim, ferry out of scope

Confirmed directly: every non-connector slice's own `veghluti` is 1, and sourceId `3834` (the Ísafjörður roundabout line) never appears on this chain. No `directed` policy rule was added. `lengthNote` explicitly states this response makes no claim about winter closure, driving conditions, or current access on Kleifaheiði, and that the Baldur ferry from Brjánslækur is out of scope and never implied by this road route.

## P9 -- API wiring and isolation from every other pair

- `flokalundur<->patreksfjordur` is composed from the new, independent `server_data/westfjords-region-flokalundur-patreksfjordur.json` (own `regionVersion`, 7 lines + one connector, one tier 0 per call), branch checked before the general `KNOWN_PLACE_IDS` gate.
- `flokalundur` with anything other than `budardalur`/`isafjordur`/`patreksfjordur` still returns `400 unknown_place_id` (confirmed for `hella`, `junction-1-60-baulan`, `holmavik`, `junction-60-61-throskuldar`).
- `patreksfjordur` -- already a known 56-list place id, with no entry in the main tier-2 pilot's own `endpoints` map -- keeps its existing `200 unsupported endpoint_mapping_unavailable` contract with every other pair, including `patreksfjordur<->patreksfjordur` (same_place is never fabricated for it).
- `flokalundur<->isafjordur` (87,618.54830414167 m), `flokalundur<->budardalur` (172,474.2228360156 m), `junction-1-60-baulan<->budardalur` (42,155.20284701861 m), `isafjordur<->holmavik` (223,136.98949144362 m), `junction-1-68-stadarskali<->holmavik` (110,073.97484054108 m), and `junction-60-61-throskuldar<->holmavik` (30,555.315457176555 m) are all byte-identical to before this round -- re-asserted literally with their own `geometryId`s in the new handler test.
- Regressions re-confirmed passing: Rauðavatn<->Selfoss (44,984.77037809235 m), Egilsstaðir<->Seyðisfjörður (24,148.8609 m), vegur 93, same_place, and the unsupported 51/56 places.

## P10 -- map advisory markers and serving discipline

`map-view.html` shows the route (blue), the one estimated connector (orange, dashed), both endpoints (green: the reused Flókalundur node and the new Patreksfjörður insertion), the 60/62 junction (purple, explicitly distinct from the Flókalundur endpoint), both owner coordinates (purple), the existing `places.json` point for Patreksfjörður (dark grey, explicitly labeled as not used by this pair), and four real, literal branch points (grey, dashed, each labeled "possible future connection, not confirmed"): vegur 60 (at the 60/62 junction), 610 Brjánslækur (explicitly distinguishing the road from the out-of-scope Baldur ferry), 612, and 63 Miklidalur (the same point the connector's own `2271`-side vertex sits at). No new destinations or ferry legs are shown.

Served from `127.0.0.1:8776` (confirmed free beforehand; ports 8765-8775 confirmed still responding, undisturbed), `python3 -m http.server 8776 --bind 127.0.0.1` launched from within this task's own directory only. Canonical OSM tile URL, `strict-origin-when-cross-origin` referrer meta, and the `local-file-note` banner, same as every prior map. Route coordinates reused the same independently-implemented native->WGS84 inverse transform already round-trip-validated in prior rounds, re-checked here with a fresh round-trip assertion against the Patreksfjörður owner coordinate before use.

**CC did not and cannot visually confirm this map.** This session has no image/screenshot capability; the map is handed over as a working link (`http://127.0.0.1:8776/map-view.html`) for the owner's own review, not a claimed visual PASS. Per P10, this round stops here -- no work was done toward Tálknafjörður, Bíldudalur, Látrabjarg, Rauðisandur, vegur 60/63 as destinations, or any leg combination.

## Checks run

- `npx vitest run api/_lib/winterRoute/westfjordsFlokalundurPatreksfjordurRegionDataset.test.js` -- 16/16 passed
- `npx vitest run api/winter-route-geometry.test.js` -- 83/83 passed
- `npx vitest run api/` (full suite) -- 793/793 passed
- `npx eslint` on every new/modified file -- clean
- `git status --porcelain` -- scope matches exactly the files listed above plus `docs/ai/CURRENT.md` and the now-familiar incidental `server.log` access-log growth from this session's own port health-checks; no other file touched
- `git diff --check` on touched files -- clean (only a benign LF/CRLF line-ending-on-checkout warning)

## Scope notes

No work was done beyond P1-P10. No new dependency was added. No existing production file other than `api/winter-route-geometry.js` was modified. `vercel.json` was not changed. The map/build-map-data script duplicates the standard transform formula inline (same one-off-script convention as every earlier build script in this ticket) rather than importing it, since it is never needed by production request-time code. The region file's own schema keeps the connector as a separate top-level `connector` field (not mixed into `lines`), matching the established pattern from the earlier Búðardalur<->Flókalundur connector round -- an inconsistency caught and corrected during this round's own build-script draft, before any test was written against it.
