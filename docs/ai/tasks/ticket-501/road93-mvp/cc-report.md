# #501 Vegur 93 (Egilsstaðir ↔ Seyðisfjörður) MVP — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/road93-mvp/approved-prompt-v1.md`
  (Jonesy APPROVED with binding P1–P4, no blockers).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-18.
- Scope: one new handler test (the missing reverse-direction case),
  this ticket's own `road93-mvp/` docs, `CURRENT.md`. **No production
  code was changed** — the baseline already worked correctly in both
  directions (P1).

## P1 — baseline first, confirmed, no production change

Ran the real handler (`api/winter-route-geometry.js`) directly, both
directions, against the unchanged pilot dataset:

| | length | slices | geometryId |
|---|---|---|---|
| `egilsstadir → seydisfjordur` | **24,148.860880942146 m** | `2344 forward, 3410 forward, 3409 forward, 2894 forward` | `e79c0f7e8237d6c2ecd910771b8b8bda` |
| `seydisfjordur → egilsstadir` | **24,148.860880942146 m** | `2894 reverse, 3409 reverse, 3410 reverse, 2344 reverse` | `3f67cfaa1ab61fd70a7dccfaf0ebbac0` |

Matches Jonesy's own sandbox cross-check exactly (length, slice
sourceIds/order, both geometryIds). Neither response carries `mode`,
`policyVersion`, or `estimatedConnectorLengthM` — the plain, unchanged
undirected contract. No `2891`/`2892` (the ferry-pier pieces) in either
direction. `geometryId` is stable across repeated calls and genuinely
different between the two directions (re-verified by calling the
handler twice for the same query and once for each direction).
Coordinates are continuous and independently re-summable to `lengthM`
in both directions (±1e-6 m).

**Per P1, since the baseline already matched: `git status` for this
round shows no change to `winter-route-geometry.js`,
`raudavatnSelfossMvpPolicy.js`, `geometryComposition.js`,
`geometryDataset.js`, the runtime JSON, or any pinned endpoint — only
the one new test, this ticket's docs, and `CURRENT.md`.**

## P2 — the one missing test, added

The only real gap (per Jonesy's own sandbox note): no handler test
exercised the reverse direction. Added one test to
`api/winter-route-geometry.test.js` asserting, for
`seydisfjordur → egilsstadir`: the exact reversed slice list
(`[2894 r, 3409 r, 3410 r, 2344 r]`), no `2891`/`2892`, no
`mode`/`policyVersion`/`estimatedConnectorLengthM`, pinned endpoints at
both ends of the coordinate chain, independently re-summed length, the
pinned `geometryId` above, stability across repeated calls, and that it
differs from the eastbound `geometryId` while the length matches to
9 decimal places. The existing `isRaudavatnSelfossPair` predicate tests
(`false` for both `egilsstadir`/`seydisfjordur` combinations) already
existed from the Hella round and were not duplicated.

## P3 — the "two-way" assumption is NOT in the API response

Documented explicitly, as required: `egilsstadir ↔ seydisfjordur` is
**not** part of the Rauðavatn directed pilot. Its API response is the
plain undirected contract — no key anywhere states "this corridor is
assumed two-way." That assumption exists only in this report and in
`map-view.html`'s own side panel, exactly as the approved prompt
requires (no new API key was added to carry it).

## P4 — endpoints and visual honesty

- E1 = `egilsstadir`'s pinned native endpoint = IDFERILL `2344`'s own
  vertex 0, the junction where `2344`/`2345`/`2814` meet —
  **65.2586176°N, 14.3902896°W** (independently computed here via the
  same EPSG:3057→WGS84 transform validated in the Rauðavatn rounds,
  cross-checked against Jonesy's own cited value 65.25862°N/14.39029°W
  — matches to within ~0.0001°).
- S2 = `seydisfjordur`'s pinned native endpoint = IDFERILL `2894`'s own
  end vertex, in Seyðisfjörður itself — **65.2602179°N,
  14.0095313°W** (cross-checked against Jonesy's 65.26022°N/14.00953°W
  — same close match). `2891`/`2892` (the ferry-pier pieces) are
  deliberately excluded, so the route stops at S2, not the ferry.
- **24,148.861 m is endpoint-to-endpoint, not town-center-to-ferry-pier**
  — stated here and in the map's own panel.
- Built `docs/ai/tasks/ticket-501/road93-mvp/map-view.html` from the
  REAL handler's own coordinate output (not a hand-built shape),
  reusing the same validated transform. Canonical tile URL
  (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`), `<meta
  name="referrer" content="strict-origin-when-cross-origin">`, visible
  OSM attribution — same fix pattern as the two earlier Rauðavatn maps.
  Served via a local HTTP server bound **only** to `127.0.0.1:8767`
  (ports `8765`/`8766` are the still-running Rauðavatn↔Selfoss/Hella
  map servers — left undisturbed; `8767` is a fresh, unused port),
  serving **only** this task's own directory. Open at
  `http://127.0.0.1:8767/map-view.html`.

**This session still has no way to see a rendered map or image — no
visual PASS is claimed.** The three P4 review points (crosses
Fjarðarheiði between the correct ends, stops at S2 rather than
continuing to the ferry, no detour loop) are listed in the map's own
side panel for the owner's own judgment.

## Verification performed

- **Independent empirical verification before writing the test**: the
  baseline and the new test's exact expected values were taken from a
  real run of the real handler, not copied from Jonesy's sandbox table
  blindly (though they match it exactly).
- **Real `npx vitest run`**, focused set — **9 files, 159/159 tests
  pass** (up from 158 — one new test, no shim needed):
  `winter-route-geometry.test.js`, `raudavatnSelfossMvpPolicy.test.js`,
  `geometryComposition.test.js`, `geometryDataset.test.js`,
  `winter-route.test.js`, `routes.test.js`, `segments.test.js`,
  `cache.test.js`, `winterRouteRoutes.test.js`.
- `npx eslint` on the touched test file — clean.
- `git status --porcelain` / `git diff --check` — confirmed clean
  scope: only the one test file, this ticket's new docs, and
  `CURRENT.md`. No production code touched, consistent with P1's own
  requirement that an unneeded change would itself be a scope
  violation.

## Status

The Egilsstaðir↔Seyðisfjörður (vegur 93) pair already worked correctly
in both directions on the existing undirected geometry API — this
round's job was verification, one missing regression test, and a
visible map, not new implementation. This does not close ticket #501
and does not extend to any ring/alternative-route comparison mentioned
for later rounds. The one owner-facing open item is the P4 visual
check itself, which only the owner can perform by opening
`map-view.html`.


## Ripley precision correction — 2026-11-18

S1: differences between the WGS84 values quoted above and Jonesy's
rounded endpoint values are below 0.00001 degrees. The earlier
~0.0001 / handoff <0.0002 / map ~0.0004 statements were inconsistent
loose bounds, not different transformations. Map wording corrected;
embedded route coordinates and production code unchanged.
