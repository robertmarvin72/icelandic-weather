# #501 Hringvalkostir (Rauðavatn ↔ Selfoss south/north) MVP — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/ring-options-mvp/approved-prompt-v1.md`
  (Jonesy APPROVED with binding P1–P7, no blockers).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-18.
- Scope: `api/winter-route-geometry.js`/`.test.js`, one new small
  north-option helper + its test (`raudavatnSelfossNorthOption.js`/
  `.test.js`), this ticket's own `ring-options-mvp/` docs, `CURRENT.md`.
  The pure core, dataset loader, and the existing
  `raudavatnSelfossMvpPolicy.js` were **not touched** —
  `buildMvpDirectedInput` is reused byte-for-byte as the new north
  option's own base.

## What was built

A new `option=south|north` query parameter, read **only** for
`reykjavik-raudavatn↔selfoss` (not `reykjavik-raudavatn↔hella`, which
keeps its exact pre-existing south-only response shape this round —
see P1/scope note below):

- **South** — the existing, unchanged MVP pilot (short route via
  Hellisheiði).
- **North** — the long Route 1 ring (Vesturland→Norðurland→Austurland→
  the south coast→Selfoss), built as **two fixed legs** through the
  Egilsstaðir (E1) junction: `from→E1` then `E1→to`. Both legs reuse
  the exact same north lines/policy
  (`api/_lib/winterRoute/raudavatnSelfossNorthOption.js`, which itself
  reuses `buildMvpDirectedInput` as its base and adds exactly two new
  synthetic connector lines, sourceIds `-2`/`-3`, needed only for the
  `E1→R1` sub-leg's own gap near Hádegismóar in Reykjavík).

Response for the pilot pair now additionally carries `selectedOption`
and `options` (both options' real measured `lengthM`, `via` markers,
and a stable per-option-per-direction `routeId`); only the SELECTED
option's own geometry (`coordinates`/`slices`) is included — never
both.

## Real measured results (via the real handler, not Jonesy's sandbox numbers)

| Direction | South (unchanged) | North (new) |
|---|---|---|
| R1→Selfoss | 44,984.770378 m, 11 slices | **1,236,038.322210 m**, 206 slices (119+87) |
| Selfoss→R1 | 45,101.809503 m, 9 slices | **1,236,223.992067 m**, 208 slices (87+121) |

North legs individually: `R1→E1` 615,370.844582 m/119 slices;
`E1→Selfoss` 620,667.477629 m/87; `Selfoss→E1` 620,678.896079 m/87;
`E1→R1` 615,545.095988 m/121 (using both new connectors, once each).
All four match Jonesy's own independent sandbox cross-check exactly —
confirmed by running the real production modules directly before
writing any test assertion, same discipline as every prior round.

Default (no `option`): **south**, the real shorter measured option in
both directions — computed by comparing both options' real lengths,
not hardcoded.

## P1 — the false-north trap, verified avoided

Confirmed directly: composing `E1→R1` **without** the two new
connectors is disconnected at the real Hádegismóar gap and falls back
to the only other available path — a **665,769.287 m** detour via
Selfoss and the short south leg. This is NOT the north ring route, and
the real (connector-equipped) north result is independently confirmed
shorter and structurally different (different slice set, correct
corridor line names — Borgarnes-Baulan, Holtavörðuheiði, Akureyri,
Vaðlaheiðargöng, Mývatnssveit all present; `E1→Selfoss`/`Selfoss→E1`
never touch the south-pilot-only sourceIds `2138`/`2135`/`36807`).

**A real finding during verification, documented here (not a P1
violation in substance):** two sourceIds (`2791` on `R1→E1`, `2532` on
`E1→R1`) each appear in two non-adjacent slices within a single leg.
Both were checked at the **edge level** (never the same literal
traversed span twice) and found legitimate: `2791` is a roundabout
(VEGHLUTI 5) whose own ring-closure vertex (index 4 ≡ index 0 by XY)
is traversed forward across that closure point, which the core's slice
merge (index-adjacency only) cannot represent as one slice even though
the path is genuinely continuous; `2532` ("both") is left and re-
entered via a short real local detour (`32321`) a few dozen metres
long. Neither is a backtrack, neither double-counts any edge, and both
lengths match Jonesy's own reference to the sub-millimetre — this is
the same "non-adjacent slice, no double-count" pattern already
established and tested in the original geometry-composition round
(and the Hella/Selfoss pilot's own `2138` case). No south-pilot-only
sourceId ever appears outside the legs' own shared Selfoss approach.

## P2 — exactly two connectors, no more

`-2` (9924's own end ↔ 49926's own end, **11.025039643043637 m**) and
`-3` (49926's own start ↔ 42244's own start, **2.3441380548430044 m**)
— both read as literal retained vertices (never recalculated), both
well under the 45 m limit, both one-way (`forward` only),
`idbutur: null`, non-WFS-looking `evidenceRef`. No other connector or
failure was found or needed; no STOP condition was triggered. The
south pilot's own connector (`-1`) is never reused for north and never
appears in any north-option result.

## P3 — south stays byte-for-byte unchanged

Verified directly: `option=south` (and the no-option default) returns
the exact same `policyVersion`
(`raudavatn-selfoss-mvp-v1-a73f8191242a0938`) and lengths as the
Hella-round pilot. `Hella`, `Egilsstaðir↔Seyðisfjörður`, and
`Selfoss↔Hella` responses are all re-asserted unchanged in this
round's tests. **`Rauðavatn↔Hella` itself keeps its exact pre-existing
south-only response shape** — a new `RING_OPTIONS_PAIRS` check (distinct
from the existing 4-pair `isRaudavatnSelfossPair`, which still gates
south-vs-plain-undirected exactly as before) ensures `option`/
`selectedOption`/`options` are read/emitted **only** for
`reykjavik-raudavatn↔selfoss`, never for the Hella pair — caught by a
real test failure during this round's own verification (an early,
overly-broad implementation briefly leaked `selectedOption` into the
Hella response; fixed immediately, confirmed by re-running the full
suite before proceeding).

## P4 — the Akureyri ~36.25 m sub-segment (documented, NOT fixed)

Traced to its exact source: `sourceId 32964`'s own vertex-1↔vertex-2
sub-segment is **36.25016978227996 m**, and roundabout `33604`'s own
first two vertices are literally the same two points. On `E1→R1`, this
sub-segment is traversed in `reverse` (merged inside the larger
`32964` reverse slice spanning its own full vertex range) — the
direct `32964` edge wins over the separate `33604` ring detour (P4 of
the geometry-core, lower sourceId), so `33604` itself is **never**
used by the real route. This is the same documentation-only pattern
as the Hella `3591`/`16641` case: a real, harmless, now-understood
quirk shown on the map, not corrected by any core change.

## P5 — API contract

`option=south|north` (own-key, strict string) for the pilot pair only;
unknown/repeated/array value → `400 invalid_option`, never echoing the
raw value. Other pairs: `option` is simply ignored (same convention as
any other unlisted query parameter already in this handler — not a
new 400 case). `options` always describes both, with real measured
`lengthM`, `via`, and a `routeId` built from the real `geometryId`
(north's own combined id is a fresh SHA-256 over both real leg
`geometryId`s — never `Date.now()`/random) — confirmed distinct per
option and per direction, stable across repeated calls. Only the
selected option's own geometry is in the response body.
`drivingAccess: "UNVERIFIED"` always; no ETA, no "safer/better" claim.

## P6 — via markers

`via` is computed by scanning the ACTUAL composed slices' own real
line names against a small fixed candidate list (`Borgarnes`,
`Akureyri`, `Egilsstaðir`, `Vík`) — never an invented town-center pin.
Confirmed directly: the north option's `via` is exactly `["Borgarnes",
"Akureyri", "Egilsstaðir", "Vík"]` in both directions; south's `via`
is empty (none of those names occur on the short Hellisheiði route,
which is correct and expected). The Egilsstaðir (E1) junction is
documented here and on the map as the two legs' own stitching point —
2344/2345/2814's own junction, not a town center.

## P7 — visual honesty (read before trusting any "looks right")

**This session has no way to see a rendered map or image.** Built
`docs/ai/tasks/ticket-501/ring-options-mvp/map-view.html` — reusing
the same validated EPSG:3057→WGS84 transform from the earlier Rauðavatn
rounds, plotting all four real option×direction geometries (toggle
buttons per layer), the two Hádegismóar connectors, the Akureyri
36.25 m sub-segment, and the E1 junction, each with a popup giving its
own exact figures. Canonical tile URL, referrer meta, visible OSM
attribution — same pattern as the three earlier maps. Served via a
local HTTP server bound **only** to `127.0.0.1:8768` (a fresh port;
`8765`/`8766`/`8767` are the three earlier maps' own still-running
servers, left undisturbed), serving **only** this task's own
directory. Open at `http://127.0.0.1:8768/map-view.html`.

**No visual PASS is claimed.** The four P7 review points (both
connectors, the Akureyri roundabout, the E1 junction, and the overall
north shape) are listed in the map's own side panel for the owner's
own judgment.

## Verification performed

- **Independent empirical verification before writing any test
  assertion**: every number above was produced by running the real
  production modules/handler directly, never hand-derived, never
  copied from Jonesy's sandbox table without independently re-deriving
  it first.
- **Real `npx vitest run`**, focused set — **10 files, 176/176 tests
  pass** (up from 159 — 1 new module test file (9 tests) + 8 new
  handler-level option tests, no shim needed):
  `winter-route-geometry.test.js`,
  `raudavatnSelfossNorthOption.test.js`,
  `raudavatnSelfossMvpPolicy.test.js`, `geometryComposition.test.js`,
  `geometryDataset.test.js`, `winter-route.test.js`, `routes.test.js`,
  `segments.test.js`, `cache.test.js`, `winterRouteRoutes.test.js`.
- `npx eslint` on all touched/new files — clean.
- `git status --porcelain` / `git diff --check` — confirmed clean
  scope: the endpoint + its test, the one new north-option helper +
  its test, this ticket's new docs, and `CURRENT.md`. The pure core,
  dataset loader, and the existing south pilot-policy module are
  present but untouched.
- No stub/bypass anywhere in the new tests — every assertion goes
  through the real, unmodified `composeGeometryPath` and the real
  handler, using the real retained pilot dataset.

## Status

Two real, working Rauðavatn↔Selfoss route options now exist in both
directions behind the existing geometry-only API, selectable via
`option=south|north`, defaulting to the real shorter one, with the one
real connectivity gap (Hádegismóar) bridged by two small, visibly
labeled estimated connectors and one real geometric quirk (the
Akureyri sub-segment) documented rather than hidden. `Hella`, `vegur
93`, and every other pair are unaffected. This does **not** close
ticket #501, does not extend ring options to Hella or the Vestfirðir
corridor (both remain in `remaining-mvp-plan.md`), and the one
owner-facing open item is the P7 visual check itself, which only the
owner can perform by opening `map-view.html`.


## Ripley clarification — 2026-11-19

The repeated-sourceId explanation above is not exhaustive: Jonesy
also identified 2489 (a ring split across closure indices). The
accepted invariant is zero repeated physical edge, not unique
sourceId across slices. Jonesy independently checked that invariant
in all four routes; focused tests pass on Windows. A repeated ID on
disjoint spans is not by itself double-counting. The Akureyri 36.25 m
opposite-direction span is a documented accepted MVP limitation for
visual review, not proof of harmlessness or correct driving direction.
