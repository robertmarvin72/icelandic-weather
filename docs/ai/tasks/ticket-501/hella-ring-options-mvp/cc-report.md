# #501 Hella hringvalkostir (Rauðavatn ↔ Hella south/north) MVP — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/hella-ring-options-mvp/approved-prompt-v1.md`
  (Jonesy APPROVED with binding P1–P6, no blockers).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-19.
- Scope: **only** `api/winter-route-geometry.js`/`.test.js`. The pure
  core, dataset loader, `raudavatnSelfossMvpPolicy.js`, and
  `raudavatnSelfossNorthOption.js` (south/north builders, connectors)
  were **not touched** — both are reused byte-for-byte for the Hella
  pair exactly as they already were for Selfoss.

## What changed in code (exactly two small changes, as scoped)

1. `RING_OPTIONS_PAIRS` now has **four** ordered pairs (was two):
   `reykjavik-raudavatn↔selfoss` and `reykjavik-raudavatn↔hella`. This
   is now identical to `isRaudavatnSelfossPair`'s own four-pair set, so
   the separate "MVP pair without options" branch that previously gave
   Hella its old south-only response shape is now unreachable dead
   code — removed (behavior-neutral: it was never going to execute
   again, confirmed by the full test suite passing unchanged before
   and after removing it).
2. `describeOption`'s `routeId` prefix, previously hardcoded to
   `raudavatn-selfoss-`, now takes a `routeIdPrefix` parameter
   (`raudavatn-selfoss` or `raudavatn-hella`, chosen by which place is
   in the query). The Selfoss pair's own four full `routeId` values
   are preserved **verbatim** (verified below).

**This is a deliberate contract change for Rauðavatn↔Hella** (P2): it
previously ignored `option` entirely; it now validates and reads it
exactly like Rauðavatn↔Selfoss.

## Real measured results (via the real handler, not Jonesy's sandbox numbers)

| Direction | South (unchanged from raudavatn-hella-mvp) | North (now selectable) |
|---|---|---|
| R1→Hella | 80,681.311934 m, 21 slices | **1,200,394.650766 m**, 197 slices (R1→E1 119 + E1→Hella 78) |
| Hella→R1 | 80,747.986952 m, 19 slices | **1,200,533.828237 m**, 199 slices (Hella→E1 78 + E1→R1 121) |

All four north-related numbers match Jonesy's own independent sandbox
cross-check exactly, confirmed by running the real production modules
directly before writing any test assertion (same discipline as every
prior round). South's own lengths, slice counts, and `geometryId`s
(`a7137730003351c3d1b81cd43755b632` / `e77ac0a9b47bd56d804a038da72878e3`)
are unchanged from the raudavatn-hella-mvp round, since
`composeSouthOption`/`buildMvpDirectedInput` were not touched.

## P1 — exact pair list, not a set

Confirmed: `RING_OPTIONS_PAIRS` is a literal 4-pair list, not a
3-place set — `selfoss↔hella` (both directions) still returns the
plain, unaffected, undirected contract, **even when queried with
`option=north` or an invalid `option=bogus`** — both 200, never 400,
exactly as before (`lengthM: 35,646.177449 m`, `geometryId`
`1e5ec24e068b90156c1c9b0ec1c00d39` / `6c8979a3345eb95c1a582277835834c1`
re-verified here, the second value taken from a real handler call, not
copied from the approved prompt's own truncated citation). This
regression moved from the earlier (now-incorrect) "Hella is
unaffected" test to this pair, plus `egilsstadir↔seydisfjordur` and
`same_place`, per P5 — no protection deleted without a substitute.

## P2 — south unaffected, contract change documented

`option=south` and the no-option default both return byte-identical
lengths/slices/`geometryId`s to the pre-existing Hella pilot in both
directions — the only addition is `selectedOption`/`options` in the
envelope, exactly as scoped. The default is the real shorter measured
option (south, by ~15x), computed the same way as for Selfoss — not a
hardcoded preference.

## P3 — north is a genuine ring, not a south detour

Independently re-run before pinning: `R1→E1` 615,370.844582 m/119
(reused from the Selfoss round's own north leg — identical, since it's
the same leg), `E1→Hella` 585,023.806184 m/78, `Hella→E1`
584,988.732249 m/78, `E1→R1` 615,545.095988 m/121 (using both
Hádegismóar connectors, same as the Selfoss round). Confirmed: the
north route's real line names include `Borgarnes-Baulan`,
`Holtavörðuheiði`, `Akureyri`, `Vaðlaheiðargöng`, `Mývatnssveit`,
`Fagridalur`, `Skeiðarársandur`, `Vík`; no `2138`/`2135`/`36807`
(south-pilot-only sourceIds) appear. Connector usage confirmed exactly
as specified: **zero** on `R1→Hella` north, **both** `-2`/`-3` exactly
once each (13.369178 m total) on `Hella→R1` north — no `-1` ever used
by north. No edge-level double-count anywhere (checked directly; a
sourceId may legitimately recur in non-adjacent slices, same
established pattern as the Selfoss round — not re-litigated here).

## P4 — `routeId` pair-specific, Selfoss preserved verbatim

All eight real values (2 pairs × 2 options × 2 directions), confirmed
directly against the real handler before writing the test:

| Pair | Direction | South routeId | North routeId |
|---|---|---|---|
| Selfoss | R1→Selfoss | `raudavatn-selfoss-south-215a1805457eb42ad937c6d8217f10aa` | `raudavatn-selfoss-north-d0e0996e7500b868364007e1cad20046` |
| Selfoss | Selfoss→R1 | `raudavatn-selfoss-south-d657c07e56020a367aa54f240ae42ad7` | `raudavatn-selfoss-north-323c5b6f4a97b6a7ecc468964142e10c` |
| Hella | R1→Hella | `raudavatn-hella-south-a7137730003351c3d1b81cd43755b632` | `raudavatn-hella-north-a8704618cc1a4325e9933b9079c841d9` |
| Hella | Hella→R1 | `raudavatn-hella-south-e77ac0a9b47bd56d804a038da72878e3` | `raudavatn-hella-north-fc32a8502ed9efb56bbed33cd07da20c` |

The four Selfoss values are **byte-identical** to the approved
prompt's own cited prefixes — confirmed, not assumed. All eight are
distinct, each stable across repeated calls. `via`: `[]` for south on
both pairs, `["Borgarnes", "Akureyri", "Egilsstaðir", "Vík"]` for
north on both pairs (re-verified directly, not copied from the Selfoss
round without checking).

## P5 — the two known frávik, exactly where expected and nowhere else

Both traced to their exact literal source before writing any
assertion (never assumed to recur identically):

- **Hella-endpoint stub (~3.19 m reverse, against ring `16641`)**:
  occurs **only** on **south** `R1→Hella` (`3591` slice
  `fromIndex 3→0`, reverse, the full merged span including the
  documented 1.936 m anti-ring edge). On **north** `R1→Hella`, the
  final approach to the same pinned endpoint is a genuinely different,
  shorter sub-span (`3591` slice `fromIndex 1→0` only, 1.253 m) that
  never includes the specific anti-ring edge — confirmed **zero**
  occurrence, exactly as the approved prompt expected, not assumed.
- **Akureyri `32964` sub-segment (36.25 m)**: occurs **only** on
  **north `Hella→R1`** (`fromIndex 3→0`, reverse — the same direction
  that already showed this on the Selfoss round's own `E1→R1` leg,
  since it's the identical leg reused). On north `R1→Hella`, the same
  sourceId is traversed `forward` — confirmed to never include the
  reverse-against-ring characteristic there.

No new, undocumented deviation was found on any of the four real
Hella legs/options.

## P6 — map and visual honesty

**This session still has no way to see a rendered map or image — no
visual PASS is claimed.** Built
`docs/ai/tasks/ticket-501/hella-ring-options-mvp/map-view.html` from
the real handler's own four response coordinate sets (never hand-
built), using the same validated EPSG:3057→WGS84 transform as every
earlier map. Canonical tile URL, referrer meta, visible OSM
attribution — same pattern as the three earlier maps. Served via a
local HTTP server bound **only** to `127.0.0.1:8769` (a fresh port;
`8765`–`8768` are the four earlier maps' own still-running servers,
left undisturbed), serving **only** this task's own directory. Open
at `http://127.0.0.1:8769/map-view.html`. The four P6 review points
(north-ring shape, Hella's own roundabout approach from each
direction, the Hádegismóar connectors, the Akureyri sub-segment) are
listed in the map's own side panel. The earlier Selfoss-ring approval
does not automatically cover this new Hella content, per the approved
prompt's own instruction.

## Verification performed

- **Independent empirical verification before writing any test
  assertion**: every number above was produced by running the real
  production modules/handler directly, never hand-derived, never
  copied from Jonesy's sandbox table or from the approved prompt's own
  truncated citations without independently re-deriving the full value
  first (caught and corrected one such case: the prompt's own
  truncated `6c8979a3345e…` citation for `hella→selfoss`'s reverse
  `geometryId` was completed from a real handler call, not guessed).
- **Real `npx vitest run`**, focused set — **10 files, 183/183 tests
  pass** (up from 176 — one stale pre-existing test from the
  ring-options-mvp round, which wrongly assumed Hella stayed
  unaffected, was caught by a real test failure and moved/replaced per
  P1/P5; a new Hella describe block adds the four real path cases,
  frávik checks, and the full 8-value `routeId` pin, no shim needed):
  `winter-route-geometry.test.js`,
  `raudavatnSelfossNorthOption.test.js`,
  `raudavatnSelfossMvpPolicy.test.js`, `geometryComposition.test.js`,
  `geometryDataset.test.js`, `winter-route.test.js`, `routes.test.js`,
  `segments.test.js`, `cache.test.js`, `winterRouteRoutes.test.js`.
- `npx eslint` on both touched files — clean.
- `git status --porcelain` / `git diff --check` — confirmed clean
  scope: only `winter-route-geometry.js`/`.test.js`, this ticket's new
  docs, and `CURRENT.md`. The pure core, dataset loader, south policy,
  and north-option module are present but untouched.
- No stub/bypass anywhere in the new/changed tests — every assertion
  goes through the real, unmodified `composeGeometryPath` and the real
  handler, using the real retained pilot dataset.

## Status

Rauðavatn↔Hella now has the same real, working south/north option
selection as Rauðavatn↔Selfoss, with both known geometric quirks
(Hella's own endpoint-on-roundabout stub, the Akureyri sub-segment)
confirmed present exactly where expected and absent exactly where
expected — not corrected, not hidden. `Selfoss↔Hella`, `vegur 93`, and
every other pair remain fully unaffected. This does **not** close
ticket #501 and does not extend ring options to Vestfirðir or the
remaining 51 places (all remain in `remaining-mvp-plan.md`). The one
owner-facing open item is the P6 visual check itself, which only the
owner can perform by opening `map-view.html`.


## Ripley context clarification — 2026-11-19

Technical assessment PASS (independent Windows 10 files/183 tests and
lint); owner visual acceptance pending. The closing reference to
"remaining 51 places" is historical runtime pilot coverage only, not
the current final product scope. The owner supplied a164-place base
table and Westfjords source packages; see owner-packages-2026-11-19/
source-note.md. Those are for the NEXT regional task and do not expand
this approved Hella execution. No Ring Road restart is required.
