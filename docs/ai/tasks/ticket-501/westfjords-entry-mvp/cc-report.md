# #501 Vestfjarðatenging 1/60 ↔ Búðardalur — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/westfjords-entry-mvp/approved-prompt-v1.md`
  (Jonesy APPROVED with binding P1–P8, no blockers).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-19.
- Scope: one new small loader (`westfjordsRegionDataset.js`/`.test.js`),
  one task-local offline build script, one new small `server_data`
  runtime JSON, one new branch in `api/winter-route-geometry.js`/
  `.test.js`, this ticket's own docs, `CURRENT.md`. The pure core, the
  main tier-2 pilot dataset/loader, `winter-route-places.json`, and
  every existing MVP policy/north-option module are **not touched**.

## What was built — the first real Westfjords connection

`GET /api/winter-route-geometry?from=junction-1-60-baulan&to=budardalur`
(and the reverse) — a real, literal, tier-0 geometry route from the
Hringvegur(1)/vegur 60 junction near Baulan/Norðurá to Búðardalur, built
entirely from retained owner-provided data, with **zero** synthetic
road connections anywhere.

- **The junction** is a literal geometry node, never a nearness guess:
  IDFERILL `3544`'s own vertex 0 = `2753`'s own end = `3103`'s own
  start, confirmed identical in the raw WGS84 source
  (`-21.46502232, 64.80100774`) and independently re-derived in native
  EPSG:3057 (`382885.8765, 480099.5872`).
- **The chain** is the literal retained sequence `3544 → 3590 → 2649 →
  3753 → 2648 → 2647 → 2769` — confirmed end-to-end connected (0 m gap
  at every join, re-verified directly from the raw vertices, not
  assumed).
- **Búðardalur's own endpoint** (P2, option (b) — Ripley's own
  recommendation, taken): the owner's NEW coordinate (65.110°N,
  -21.765°W) is projected onto line `2769`'s own real geometry
  (between its own vertex 2 and vertex 3), and that literal projected
  point is **inserted as a new vertex into `2769`'s own existing
  vertex array** — never a new `sourceId`/`IDFERILL`, never a separate
  synthetic connector line. The offset (160.148 m, owner point ↔
  inserted node) is reported separately in the response's own
  `accessApproach` field and is **never** counted in `lengthM`.
  `winter-route-places.json`'s own `budardalur` entry (stable ID,
  coordinates) is **completely unchanged** — confirmed by `git diff`.

## Real measured results (via the real handler, not Jonesy's sandbox numbers)

| | Length | Slices | Note |
|---|---|---|---|
| junction → budardalur (option b, this round's route) | **42,155.202847 m** | 7 (`3544,3590,2649,3753,2648,2647,2769`) | Matches Jonesy's own sandbox cross-check exactly |
| budardalur → junction (reverse) | **42,155.202847 m** | 7, reversed order/direction | Different `geometryId` |
| junction → old budardalur node (option a, for comparison only, not the route this round delivers) | 41,738.857384 m | 6 (no `2769` portion needed) | Confirms the inserted node adds exactly `2769`'s own partial length |

All match Jonesy's own independent sandbox cross-check exactly,
confirmed by running the real production modules directly before
writing any test assertion — same discipline as every prior round in
this ticket.

## P1 — literal junction and chain, no synthetic connection

The build script itself throws (`STOP`) if any consecutive pair in the
chain is not literally connected (checked before writing the runtime
file) — it never silently adds a connector. Re-verified independently
in the test file, from the raw retained GeoJSON directly (not just
trusting the generated runtime JSON): `3544`'s own vertex 0 equals
`2753`'s own end and `3103`'s own start exactly (same WGS84 lon/lat in
the raw source), and every one of the 6 internal chain joins is a
literal 0 m gap.

## P2 — one documented, tested endpoint choice; `budardalur` untouched

Option (b) chosen and implemented exactly as specified: the inserted
node lies mathematically ON line `2769`'s own real segment (re-
verified via collinearity: distance-to-start + distance-to-end equals
the segment's own length, to 6 decimal places) — never off to the
side, never a straight line to the owner's own point. `2769` keeps its
own `sourceId`/`idbutur` throughout; only one new vertex was inserted
into its own array (5 vertices instead of 4). `winter-route-places.json`
itself was not opened for writing in this round — confirmed via
`git status`.

## P3 — the "Dalsmynni" trap, proven as a real negative case

The owner's own CSV labels Dalsmynni (64.847°N, -21.589°W) as
"Tenging 60 við þjóðveg 1" — the *concept* of this junction, but an
**estimated** point ("Áætlaður staðarpunktur"), not its literal
location. Independently re-measured here: **7,806.529 m** from the
real junction, **3,707.177 m** from the nearest point on line `3544`
— both matching Jonesy's own cross-check. Composing a path from this
literal coordinate (never snapped, never treated as a candidate) in
the real test suite returns `unsupported/endpoint_not_in_graph` —
proving the core correctly refuses to treat it as a valid endpoint
rather than silently resolving to the junction by nearness.

## P4 — the tier-0 adapter, proven, never mixed with tier 2

The WGS84→EPSG:3057 forward transform (standard, publicly documented
ISN93/Lambert-1993 parameters — the same family already validated in
the earlier Rauðavatn/road93 map rounds, implemented independently a
second time, offline only, inside the one-off build script — never
added to the live core or the main dataset loader) is validated
**twice**: once in the build script's own connectivity checks, and
again independently in the test file (re-implemented a third time
there, so the test cannot pass merely by sharing a bug with the build
script) against the existing tier-2 pilot dataset's own 255 lines, via
their shared `IDFERILL` values in this same tier-0 package: **927
matched vertex pairs, max discrepancy 2.8 mm** — well under the
required 0.01 m, and matching Jonesy's own sandbox figure exactly.
Every response for this pair reports `tier: 0` honestly (never
relabeled as tier 2), and the main tier-2 pilot responses are
unaffected — confirmed by re-running the existing Rauðavatn/Selfoss/
Hella/road93 tests unchanged.

## P5 — route-validated IdButur, no nearby-candidate leakage

The response's own `idButurIds` field is built directly from the
actually-traversed slices, in travel order:
`[904070037, 905030037, 805030037]` — confirmed to **never** include
the two suggested-but-unused candidates the owner's own ID package
flags for this corridor (`905070037`, Búðardalur–Laugar, 260 m from
the owner coordinate; `505870037`, Hjarðarholtsvegur, 925 m) — both
real, both geographically near, both correctly absent because they
were never part of the selected geometry chain. Nothing here reads
from or writes to `roadConditionIds`/`routes.js`/any live `færð` call.

## P6 — contract: known 56-list untouched, junction recognized only for this one pair

`winter-route-places.json` is unmodified (confirmed by `git status`).
The new junction id (`junction-1-60-baulan`) is checked **before** the
general `KNOWN_PLACE_IDS` gate, and only ever accepted when paired
exactly with `budardalur` (either order) — any other combination
(junction + any other place, or junction with itself) falls through
to the existing gate and gets the plain `400 unknown_place_id`, same
as any other unrecognized string. Every other pair's own contract
(Rauðavatn↔Selfoss/Hella with `option`, Selfoss↔Hella, road 93,
`same_place`, the 51/56 unsupported places) is re-asserted unchanged
in this round's own tests.

## P7 — direction and honesty

Every line in this chain is `VEGHLUTI 1` — undirected, same pattern as
road 93; "two-way" is this round's own MVP reading assumption for the
map/report, never written into the API response as a confirmed fact.
`drivingAccess: "UNVERIFIED"` on every outcome. `lengthNote` says
"Tier-0 planar geometry length... reprojected offline from WGS84" —
never the tier-2 pilot's own wording. `via` is matched only against
the real retained line names (`Brattabrekka`, `Breiðabólstaður` — both
literally present); the colloquial name "Miðdalir" the approved
prompt also mentions does not appear literally anywhere in the
retained geometry, so it is **not** used as a separate `via` label
here (documented, not silently substituted).

## P8 — map and visual honesty

**This session still has no way to see a rendered map or image — no
visual PASS is claimed.** Built
`docs/ai/tasks/ticket-501/westfjords-entry-mvp/map-view.html` from the
real handler's own response coordinates (never hand-built), using the
same validated transform family as every earlier map. The junction,
both Búðardalur nodes (old/inserted), and the Dalsmynni point (shown
as a plain reference marker, explicitly labeled rejected-as-junction,
never drawn as a road) are each their own marker with a popup giving
the real figures. Canonical tile URL, referrer meta, visible OSM
attribution. Served via a local HTTP server bound **only** to
`127.0.0.1:8770` (a fresh port; `8765`–`8769` are the five earlier
maps' own still-running servers, left undisturbed), serving **only**
this task's own directory. Open at
`http://127.0.0.1:8770/map-view.html`. The four P8 review points are
listed in the map's own side panel.

## Verification performed

- **Independent empirical verification before writing any production
  code or test assertion**: the junction, the full chain, the
  insertion node, the Dalsmynni distances, and the tier-0 adapter's
  own accuracy were all computed from the real retained raw data via
  ad-hoc scripts first, then re-verified a second and third time
  (once in the build script, once independently in the test file)
  before being trusted — never copied from Jonesy's sandbox table
  without independently re-deriving the value first.
- **Real `npx vitest run`**, focused set — **11 files, 200/200 tests
  pass** (up from 183 — 1 new dataset test file (13 tests) + 4 new
  handler tests, no shim needed): `winter-route-geometry.test.js`,
  `westfjordsRegionDataset.test.js`,
  `raudavatnSelfossNorthOption.test.js`,
  `raudavatnSelfossMvpPolicy.test.js`, `geometryComposition.test.js`,
  `geometryDataset.test.js`, `winter-route.test.js`, `routes.test.js`,
  `segments.test.js`, `cache.test.js`, `winterRouteRoutes.test.js`.
- `npx eslint` on all touched/new files — clean.
- `git status --porcelain` / `git diff --check` — confirmed clean
  scope: the endpoint + its test, the one new loader + its test, the
  one new task-local build script, the one new `server_data` runtime
  JSON, this ticket's new docs, and `CURRENT.md`. The pure core, main
  dataset, `winter-route-places.json`, and every existing policy
  module are present but untouched.
- No stub/bypass anywhere in the new tests — every assertion goes
  through the real, unmodified `composeGeometryPath` and the real
  handler, using the real retained owner data.

## Status

The first real Westfjords connection (Hringvegur/60 junction ↔
Búðardalur) now works in both directions behind the existing geometry
API, built entirely from literal retained geometry with one documented,
tested, non-synthetic vertex insertion — no new road connection
anywhere, no live `færð` tie-in, no change to the existing 56-place
list or any other pair's contract. This does **not** close ticket #501
and does not extend to the rest of the Westfjords network (stock
60/61, Þröskuldar 61, Innstrandavegur 68, or the remaining 163 places)
— all remain in `remaining-mvp-plan.md` for later, separately scoped
rounds. The one owner-facing open item is the P8 visual check itself,
which only the owner can perform by opening `map-view.html`.


## Ripley clarification — 2026-11-19

Technical assessment independently 11 files/200 tests PASS and lint
clean on Windows. Map additionally marks the unchanged owner Búðardalur
point (purple) separately from the road approach; no inferred road
between them. The tier0 junction is reprojected EPSG3057, not a native
tier2 vertex: tier2's y differs by ~2.5mm. They identify the same
physical junction but remain distinct mappings, not mixed-tier graph
nodes. Inserted z is interpolated, not a measured source elevation.
"Remaining163" is not a counted coverage result (several places are
already implemented); the164-point base is regional planning context.
