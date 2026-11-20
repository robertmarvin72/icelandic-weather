# CC report -- westfjords-talknafjordur-mvp (ticket #501)

Executed against `approved-prompt-v1.md` P1-P10. All figures below are
real, measured values from the production core (`composeGeometryPath`,
unmodified) and the production loader, re-run in this session -- never
copied from the approved prompt's own citations without independent
verification. Where a number matches the prompt's own citation, that match
is noted as a cross-check, not assumed.

## Files

New:
- `docs/ai/tasks/ticket-501/westfjords-talknafjordur-mvp/build-westfjords-patreksfjordur-talknafjordur-region.mjs` -- offline build script (one-off, not production)
- `server_data/westfjords-region-patreksfjordur-talknafjordur.json` -- new, separate runtime region file (3 lines + one reused connector)
- `api/_lib/winterRoute/westfjordsPatreksfjordurTalknafjordurRegionDataset.js` -- loader
- `api/_lib/winterRoute/westfjordsPatreksfjordurTalknafjordurRegionDataset.test.js` -- 15 tests
- `docs/ai/tasks/ticket-501/westfjords-talknafjordur-mvp/build-map-data.mjs`, `map-data.json`, `map-view.html` -- review map (task-local)

Modified:
- `api/winter-route-geometry.js` -- new `isWestfjordsPatreksfjordurTalknafjordurPair` branch, wired before the general known-place-id gate (same pattern as the nine existing westfjords branches)
- `api/winter-route-geometry.test.js` -- 5 new tests in a new `describe` block

Never touched: any of the eight earlier Westfjords region files or their loaders, `server_data/winter-route-places.json` (`patreksfjordur` and `talknafjordur` were both already in the 56-list; neither is modified), `geometryComposition.js`, `vercel.json`.

## P1 -- literal chain, exact slice lengths, CC's own measurement

Real composed result, `patreksfjordur -> talknafjordur`: status `geometry_only`, **17,114.94341971567 m**, 4 slices, sourceId/direction order `53127 (reverse), -5 (reverse), 3361 (forward), 2889 (forward)`. CC's own measurement is within 1.3e-9 m of the prompt's own cited sandbox minimum (17,114.943419717 m) -- well inside the ±0.05 m STOP threshold. Per-slice lengths match exactly: **1,380.244556391751 m** (53127), **4.39318262751713 m** (connector), **12,837.110304554233 m** (3361), **2,893.1953761421687 m** (2889) -- all four cross-check against the prompt's own cited figures (1,380.24 / 4,39 / 12,837.11 / 2,893.20). Reverse gives the exact mirrored sourceId/direction pattern (`2889 (reverse), 3361 (reverse), -5 (forward), 53127 (forward)`), length within 2e-6 m, different `geometryId`. `3361`'s own end is confirmed byte-identical (`toBe` on x/y/z) to `2889`'s own start. 0 double-counted edges; coordinate-chain sum matches `lengthM` to within 1e-4 m; 0 `z: null` anywhere in the composed coordinate chain.

## P2 -- literal reuse of 53127, the Patreksfjörður endpoint, and connector -5

`53127` and the `connector` object are confirmed byte-identical (full vertex-array `toEqual`) to the ones already established in `westfjords-region-flokalundur-patreksfjordur.json` -- independent copies, never a shared runtime reference. `2271` is confirmed absent from this region's own `lines` array and never appears in the composed route. The connector's own first vertex is confirmed byte-identical (`toBe` on x/y/z) to `3361`'s own vertex 0 -- this is what actually keeps the route connected, independently verified rather than assumed from the connector's historical 2271-provenance. The build script itself throws if either check fails. `lengthNote` was written to avoid reusing the prior round's own "between the retained lines 2271 and 53127" phrasing verbatim, since 2271 is not on this route -- it instead describes the connector as bridging "the start of 3361 (same coordinates as the end of 2271) and 53127".

## P3 -- Tálknafjörður endpoint and the coverage gap

The route endpoint is `2889`'s own **literal, existing vertex 12** (no insertion, 13 vertices unchanged) -- confirmed byte-identical (to within float precision) to the **existing** `winter-route-places.json` coordinate for `talknafjordur`. The owner's own Tálknafjörður coordinate (`-23.827, 65.631`) was projected against every line in this region plus the real national network's own nearest other retained line (`2088`, the Hálfdán/Bíldudalur branch at `3361`'s own end) -- the real measured offset to the route's own end is **995.4294251543986 m** (cross-check: 995.4294251530142 m / 995,43 m), while the nearest point on `2088` is **2,825.622679847625 m** away (exact cross-check: 2,825.6 m), confirming `2889` is genuinely the best available retained approach. `accessApproach.talknafjordur.routeEndsShortOfOwnerCoordinate` is `true`, confirmed by a dedicated test -- this is a documented coverage limitation, not an error. The offset is excluded from `lengthM`. `places.json` itself is untouched.

## P4 -- region file and API branch

The new `server_data/westfjords-region-patreksfjordur-talknafjordur.json` holds exactly 3 lines (`53127, 3361, 2889`) plus its own `connector` field (not mixed into `lines`, matching the established pattern), one tier 0, its own `regionVersion`. The recorded source SHA-256 hash is confirmed to start with `cab197ad`, the exact prefix cited in the approved prompt. `places.json`, `vercel.json`, `geometryComposition.js`, and every earlier region file/loader/handler branch are confirmed unmodified (`git status` shows this as a pure addition).

## P5 -- IdButur and sourceId exclusions

Real route-validated list (connector's own `null` skipped): `562070037, 905260037, 506170037` -- exact match to the approved prompt's own cited list. None of the full forbidden sourceId set (`2271, 3332, 3334, 3339, 3698, 3648, 3009, 2318, 2319, 2997, 34243, 3111, 2088, 3868, 3869, 3651, 34245, 2102`) appears in the real positive result.

## P6 -- via fixed exactly to `["Miklidalur"]`

Confirmed via `toEqual`: `via` is built from exactly one candidate (`"Miklidalur"`, `3361`'s own real `STUTTNAFNLEIDAR` name) and deliberately excludes `"Bíldudalur"` as a candidate. A dedicated test confirms `"Bíldudalur"` appears **only** in `3361`'s own `STADARLYSING` field (never in its `STUTTNAFNLEIDAR`/`name`), so it can never leak into `via` through the existing name-matching logic, which only ever reads the `name` field.

## P7 -- two negative tests, both on the full national graph

**(a)** Removing the connector from the composed `lines` makes the real core return `unsupported` / `disconnected_graph` -- confirmed; no silent snapping occurs. **(b)** On the full retained national tier-0 graph (1,564 lines, patched only for the reused `53127`), **with** `3361` the result is identical to the narrow-region result. **Without** `3361`, the real core returns `geometry_only` (not a disconnection) at **121,586.40835449287 m**, 15 slices -- exact cross-check against the prompt's cited 121,586.40835449164 m -- via `53127, -5, 2271, 3332, 3334, 3339, 3698, 3009, 2318, 2319, 2997, 34243, 3111, 2088, 2889` (confirming the detour reuses the connector and `2271`, which are not on the approved chain, then crosses back into `53127`-adjacent roads before reaching `2088` and finally `2889`) -- exact match to the prompt's own cited sourceId order.

## P8 -- no roundabout, no safety/condition claim

Confirmed directly: every non-connector slice's own `veghluti` is 1, and sourceId `3834` (the Ísafjörður roundabout line) never appears on this chain. No `directed` policy rule was added. `lengthNote` was checked with `toMatch` (not merely a loose "tier-0" substring check, per the prompt's own explicit instruction) and confirmed to state that the route ends at the retained vegur 617 geometry's own end without reaching the owner's own Tálknafjörður coordinate, that town continuation is not included, and that it makes no claim about winter closure, driving conditions, current access, or whether any road or service is open.

## P9 -- API wiring and isolation from every other pair

- `patreksfjordur<->talknafjordur` is composed from the new, independent region file, branch checked before the general `KNOWN_PLACE_IDS` gate.
- `talknafjordur` and `patreksfjordur` both keep their existing `200 unsupported endpoint_mapping_unavailable` contract with every other pair (confirmed for `bildudalur`, `isafjordur`, `hella`, `budardalur`, `holmavik`, and same_place for both).
- `flokalundur`/`junction-*` with `talknafjordur` still return `400 unknown_place_id` (confirmed for all four).
- `flokalundur<->patreksfjordur` (61,400.098965121026 m, `geometryId` `c4312f35bf25f0bc3394423f20927a6a` forward / `b326156f58b6cf5a91c70c01fc9ffe57` reverse, `regionVersion` `1c09dfb6f6fde51c`) and seven other prior pairs (`flokalundur<->isafjordur`, `flokalundur<->budardalur`, `junction-1-60-baulan<->budardalur`, `isafjordur<->holmavik`, `junction-1-68-stadarskali<->holmavik`, `junction-60-61-throskuldar<->holmavik`) are all confirmed byte-identical to before this round -- re-asserted literally with their own `geometryId`s in the new handler test.
- Regressions re-confirmed passing: Rauðavatn<->Selfoss (44,984.77037809235 m), Egilsstaðir<->Seyðisfjörður (24,148.8609 m), vegur 93, same_place, and the unsupported 51/56 places.

## P10 -- map advisory markers, the coverage-gap caveat, and serving discipline

`map-view.html` emphasizes the coverage gap: a highlighted banner states "Retained geometry ends here -- town continuation not included" with the real measured offset, and the Tálknafjörður endpoint's own larger green marker and popup both repeat this explicitly. No road line or straight line is drawn from the route's own end to the owner's own Tálknafjörður coordinate (purple, separate marker), to avoid implying a connection that does not exist in the retained data. The reused connector is shown (orange, dashed) with its real measured length, and two real, literal branch points (grey, dashed, each labeled "possible future connection, not confirmed"): the 63/62 junction at the connector's own `3361`-side vertex, and the Hálfdán/Bíldudalur branch at `3361`'s own end -- no Bíldudalur route is implemented or implied.

Served from `127.0.0.1:8777` (confirmed free beforehand; ports 8765-8776 confirmed still responding, undisturbed), `python3 -m http.server 8777 --bind 127.0.0.1` launched from within this task's own directory only. Canonical OSM tile URL, `strict-origin-when-cross-origin` referrer meta, and the `local-file-note` banner, same as every prior map; the page's own top note additionally states that map approval confirms this bounded MVP delivery and must not be read as confirmation of a road reaching the town of Tálknafjörður itself.

**CC did not and cannot visually confirm this map.** This session has no image/screenshot capability; the map is handed over as a working link (`http://127.0.0.1:8777/map-view.html`) for the owner's own review, not a claimed visual PASS. Per P10, this round stops here -- no work was done toward Bíldudalur, Hálfdán, Látrabjarg, Rauðisandur, vegur 60/63 as destinations, or any leg combination.

## Checks run

- `npx vitest run api/_lib/winterRoute/westfjordsPatreksfjordurTalknafjordurRegionDataset.test.js` -- 15/15 passed
- `npx vitest run api/winter-route-geometry.test.js` -- 88/88 passed
- `npx vitest run api/` (full suite) -- 813/813 passed
- `npx eslint` on every new/modified file -- clean
- `git status --porcelain` -- scope matches exactly the files listed above plus `docs/ai/CURRENT.md` and the now-familiar incidental `server.log` access-log growth from this session's own port health-checks; no other file touched
- `git diff --check` on touched files -- clean (only a benign LF/CRLF line-ending-on-checkout warning)

## Scope notes

No work was done beyond P1-P10. No new dependency was added. No existing production file other than `api/winter-route-geometry.js` was modified. `vercel.json` was not changed. The map/build-map-data script duplicates the standard transform formula inline (same one-off-script convention as every earlier build script in this ticket) rather than importing it, since it is never needed by production request-time code. This round's own special characteristic -- an honestly-flagged coverage gap (`routeEndsShortOfOwnerCoordinate: true`) rather than a confirmed town approach -- is surfaced consistently across the API response (`accessApproach`), the `lengthNote`, and the map's own visual treatment, per the owner's own explicit scope approval for this exact endpoint choice.
