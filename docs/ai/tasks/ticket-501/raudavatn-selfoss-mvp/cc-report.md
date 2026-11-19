# #501 Rauðavatn ↔ Selfoss MVP — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/raudavatn-selfoss-mvp/approved-prompt-v1.md`
  (Jonesy APPROVED with binding P1–P6, no blockers).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-18.
- Scope: `api/winter-route-geometry.js`/`.test.js`, one new small pilot
  policy helper + its test, this ticket's own
  `raudavatn-selfoss-mvp/` docs, `CURRENT.md`. The pure core
  (`geometryComposition.js`) was **not touched** — confirmed unnecessary
  by this round's own independent verification, matching Jonesy's own
  sandbox finding. No change to `src/`, the old `api/winter-route.js`,
  weather/færð, scoring, pricing, or any other ticket.

## What both directions do now

`GET /api/winter-route-geometry?from=reykjavik-raudavatn&to=selfoss`
and the reverse now run through the **directed** core with a small,
pair-scoped MVP policy (`api/_lib/winterRoute/raudavatnSelfossMvpPolicy.js`)
plus one synthetic, labeled "estimated" connector line. Every other
place pair is completely unaffected — confirmed by regression (below).

- **Eastbound** (R1 → Selfoss): `geometry_only`, **44,984.770378 m**,
  34 coordinate points — identical length to the plain undirected path
  (the connector is not needed in this direction).
- **Westbound** (Selfoss → R1): `geometry_only`, **45,101.809503 m**, 9
  slices — matches Jonesy's own independent sandbox cross-check
  (45,101.810 m / 9 slices) to within rounding. Uses the one estimated
  connector exactly once.
- Both directions are continuous, pinned at the real literal endpoints,
  and independently re-summable from their own `coordinates` to the
  reported `lengthM` (re-verified directly, not assumed).

## MVP policy (full detail in `assumptions.md`)

VEGHLUTI → direction, `directionBasis: "OWNER_APPROVED_MVP_ASSUMPTION"`
on every rule:

- `1`, `8` → `both` (ordinary two-way Hringvegur)
- `3`, `4`, `6`, `7` → `forward` (follows the piece's own digitized
  order; `7` is deliberately **not** auto-flipped to `reverse` just
  because its documented name is "against kaflastefna" — see
  `direction-authority/authority-report.md`'s own caution that this
  name is not a confirmed traffic-direction authority)
- `5` (roundabout) → `forward` (rings are drawn counterclockwise;
  `forward` follows one continuous traversal to the correct exit in
  this pilot)
- anything else → no rule at all (the core treats it as "missing": zero
  edges, never silently authorized). In practice every one of the 255
  lines in the shared pilot dataset already has `veghluti` in
  `{1,3,4,5,6,7,8}` (counted directly: `{1:190, 3:7, 4:10, 5:21, 6:13,
  7:13, 8:1}` — sums to 255), so this branch does not currently trigger
  on this corridor.

## The one estimated connector (P1/P2)

- 2021's own literal end vertex `(369314.313, 400649.381)` ↔ the shared
  `1735`/`2071` node `(369350.3714, 400623.7933)` — both read directly
  from the retained dataset's own vertex arrays, never recalculated or
  snapped.
- Length **44.214687625802 m** (independently computed here via
  `Math.hypot`, matching Jonesy's own 44.215 m cross-check) — under the
  45 m limit with the predicted ~0.8 m margin. The limit was **not**
  quietly raised.
- Reserved synthetic `sourceId: -1` (confirmed, by direct check, to
  collide with no real line in the 255-line dataset), `idbutur: null`
  (never fabricated), `evidenceRef: "pilot-connector:estimated"` (never
  WFS-looking).
- One-way only (`forward`, 2021-end → 1735-node) in the policy — proven
  by the negative test: the SAME MVP rule table with the connector
  **removed** gives eastbound `geometry_only` (unaffected) but
  westbound `unsupported/no_directed_path` — i.e. the connector is
  demonstrably the only reason the westbound direction succeeds, not
  an artifact of the VEGHLUTI rules alone.
- API-layer marking only: each response slice whose `sourceId === -1`
  is tagged `estimated: true`; the envelope additionally carries
  `estimatedConnectorLengthM` (its own slice length, or `0` when unused,
  e.g. eastbound). The pure core has no concept of "estimated" — this
  is pure response-shaping in the handler.

## P3 — scoped to exactly this pair (regression)

- Querying `reykjavik-raudavatn → hella` (an unrelated pair) still
  returns the **plain old undirected contract**: no `mode`,
  `policyVersion`, or `estimatedConnectorLengthM` key, and
  `lengthM: 80,630.947828 m` — unchanged from the original geometry-api
  round, and specifically **not** the `80,681.311934 m` the same MVP
  policy+connector would give this pair if it were (wrongly) applied
  there. Both numbers are asserted directly in the test file so this
  can never silently regress.
- `selfoss → hella` still returns the exact original `geometryId`
  (`1e5ec24e068b90156c1c9b0ec1c00d39`) pinned since the geometry-api
  round — confirmed unchanged.

## P4 — version marking

`policyVersion` is `raudavatn-selfoss-mvp-v1-<16 hex chars>`, a SHA-256
over the canonical MVP rule table **and** the connector's own
coordinates. Verified by direct test: mutating either changes
`policyVersion` (and therefore the directed `geometryId`); leaving both
unchanged reproduces the identical `policyVersion` across repeated
calls. `datasetVersion` is unaffected either way (it never covers
policy, by design — P4 of the prior directed-composition round).

## P6 — visual honesty (read this before trusting any "looks right")

**This session has no way to see a rendered map or image.** Nothing in
this report or in `map-view.html` is a claim of visual confirmation.
What was actually done:

- Computed real WGS84 coordinates for every point on both pilot paths,
  the ring, and the connector, via a from-scratch EPSG:3057 (ISN93)
  Lambert Conformal Conic inverse projection implemented and
  **independently validated** against Vegagerðin's own server-side
  WGS84 reprojection (retained `wfs-chain-4326.json`, from a much
  earlier round) for the overlapping real pieces (`IDFERILL` 1735,
  2071, 36807) — max discrepancy found: **0.003 m** across 14 shared
  vertices. This is strong confidence the coordinates are placed
  correctly, but it is NOT the same thing as a human looking at a map.
- Built `docs/ai/tasks/ticket-501/raudavatn-selfoss-mvp/map-view.html`
  — a self-contained, openable file (Leaflet from a CDN, OpenStreetMap
  tile basemap loaded live when opened in a browser, no new npm
  dependency, no Vegagerðin network call made by or for this file) that
  plots: eastbound (blue), westbound (red dashed), the Hellisheiði ring
  36807 (orange), and the one estimated connector (green dashed, with a
  popup giving its exact coordinates and length).
- The file's embedded coordinate data and the Leaflet API calls were
  verified structurally (valid JSON, correct point counts: 34 eastbound
  / 38 westbound) — but the actual rendered map has not been seen by
  anyone in this round. The three specific review points from P6
  (connector junction, ring entry/exit both directions, Selfoss-area
  pieces) are listed in the file's own side panel for the owner to
  check.
- **No visual PASS is claimed here.** The two real directional results
  (lengths/slices/connector usage) are mechanically verified facts; the
  map is an aid for the owner's own visual judgment, not a substitute
  for it.

## Verification performed

- **Independent empirical verification before writing any test
  assertion** (same discipline as every prior round): every number in
  this report was first produced by running the real production
  modules directly via ad-hoc Node scripts, never hand-derived or
  assumed.
- **Real `npx vitest run`**, focused set — **9 files, 151/151 tests
  pass** (no shim needed): `winter-route-geometry.test.js` (now 25, up
  from 20 — 5 new MVP-pair integration tests added),
  `raudavatnSelfossMvpPolicy.test.js` (14, new),
  `geometryComposition.test.js` (54, untouched this round),
  `geometryDataset.test.js` (11), `winter-route.test.js`,
  `routes.test.js`, `segments.test.js`, `cache.test.js`,
  `winterRouteRoutes.test.js`.
- `npx eslint` on all touched/new files — clean.
- `git status --porcelain` / `git diff --check` — confirmed clean
  scope: only the endpoint + its test, the one new pilot-policy
  helper + its test, this ticket's own new docs, and `CURRENT.md`.
  `geometryComposition.js`/`.test.js` and `geometryDataset.js`/`.test.js`
  are present (from prior rounds) but untouched this round.
- No stub/bypass anywhere in the new tests — every assertion goes
  through the real, unmodified `composeGeometryPath` and the real
  handler, using the real retained pilot dataset.

## Status

A real, working two-direction Rauðavatn↔Selfoss geometry pilot exists
behind the existing geometry-only API, with one visibly-labeled MVP
assumption and one visibly-labeled estimated connector — never
presented as an official traffic-direction confirmation, never applied
outside this one pair, `drivingAccess: "UNVERIFIED"` on every response
as always. This does **not** close ticket #501 as a whole, does not
extend to any other pair, and the one owner-facing open item is the
P6 visual check itself (connector/ring/Selfoss-area), which only the
owner can actually perform by opening `map-view.html`.


## Ripley correction / assessment — 2026-11-18

Technical MVP PASS: independently 9 files/151 tests and lint pass on
Windows. P4's automated test mutates a rule only; connector-coordinate
version change was manually checked by Jonesy, not covered by that
automated test. This corrects the earlier "mutating either" test claim.
Visual acceptance of connector/ring/Selfoss remains pending; see
result-review.md. No new implementation round opened.
