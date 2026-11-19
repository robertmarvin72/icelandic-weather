# #501 geometry-composition — implementation note

## What this delivers

`api/_lib/winterRoute/geometryComposition.js` — a **pure** function
library with no `fs`/network/import-from-`docs` of its own. It takes
normalized native EPSG:3057 line data and two endpoint coordinates as
plain arguments and returns a geometry-only shortest-path result. It
is not wired into `/api/winter-route`, any route definition, or the UI
— see "Next decision point" below.

## Interface

```js
composeGeometryPath({
  crs: "EPSG:3057",                 // only this CRS accepted
  tier: 2,                          // one numeric precision tier, never mixed
  lines: [
    { sourceId, idbutur, tier, vertices: [{x,y,z}, ...], evidenceRef },
    ...
  ],
  from: { placeId, x, y },          // a LITERAL vertex of some line — no snapping
  to:   { placeId, x, y },
})
// -> { status: "geometry_only" | "same_place" | "unsupported", ... }

reverseGeometryPath(geometryOnlyResult)
// -> the same physical path, slices/indices/direction reversed,
//    a different geometryId, same length.
```

`status` is always one of `geometry_only` / `same_place` /
`unsupported` — **never** `SUPPORTED`/`ROUTABLE`/`safe`. Every non-error
result carries `drivingAccess: "UNVERIFIED"` permanently — this module
has no authority over legal driving direction or whether a place is
usable in the app; it only answers "does a literal, unsnapped
coordinate path exist in the lines I was given, and how long is it."

`unsupported` results carry a `reason` from `UNSUPPORTED_REASONS`:
`unsupported_crs`, `missing_endpoint`, `mixed_tier_input`,
`conflicting_identity_geometry`, `conflicting_endpoint_input`,
`endpoint_not_in_graph`, `disconnected_graph` — chosen specifically so
a missing endpoint, a disconnected graph, and a genuinely conflicting
input are never collapsed into one generic failure.

## What works on real retained pairs (independently verified this round, not copied from any prior prototype)

All five run against real data read in the **test file only**
(`docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` for VEGNR=1,
`docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json`
for VEGNR=93/road93), fixed at tier 2 per the approved prompt (P5 — a
deliberate, documented choice, not "the best tier" or a distance
contract):

| Pair | Result | Note |
|---|---|---|
| B1 (1735↔2071) | **0.234270 m** | The real connection is 1735's own FIRST internal vertex (index 1), not a gap between the two pieces' own starts. |
| B2 (36807 ring, A=2117 end ↔ B=2135 end) | **40.406375 m**, direction `reverse` | The ring is drawn counterclockwise (shoelace-confirmed); the shortest undirected arc runs AGAINST that drawn order. The forward arc (72.549 m) is a real, different, longer path and is never returned here. Neither arc is a driving-direction claim — see P1 below. |
| C1 (3454↔3767, via 3768) | **43.488921 m** | Connects via two of 3454's own ring vertices, not a whole-feature endpoint touch. |
| E1→S2 (road93, VEGNR=93) | **24,148.861 m** | The already-established `CONTINUOUS_EXACT` chain (2344→3410→3409→2894), confirmed again here independently at tier 2. Deliberately excludes 2892/2891/the ferry pier from the input — reaching that point without them in scope correctly returns `endpoint_not_in_graph`, not a snap. |
| R1→Selfoss | **44,984.770378 m** (corrected, v2/JK1) | Real, full tier-2 VEGNR=1 graph (all 249 tier-2 features), to 2138's own pinned `exit_coord`. Merges into 2135 via 36807's own vertex 4 (forward direction), never through point B. |
| R1→Hella | **80,630.947828 m** (corrected, v2/JK1) | Same graph, to 3591's own pinned `exit_coord`. IDFERILL 2138 legitimately occurs in two separate, non-adjacent slices on this path — confirmed never merged, never double-counted (see P3). |

> **v2 correction (JK1, superseded figures below retracted):** the
> figures originally reported here for these two rows (43,101.159 m /
> 79,817.678 m) were **wrong — not "a different, valid, lower-cost
> route"** as v1's own note below claimed. v1's test file used 2138's
> and 3591's `entry_coord` while mislabeling the comment "own exit";
> the approved prompt's P2 always required the pinned `exit_coord`
> from `place_nodes-v3.json`. With the correct endpoint, this same,
> unmodified module reproduces the approved prompt's own prototype
> cross-check (44,984.770378 m / 80,630.947828 m) to the last digit —
> proof the v1 discrepancy was an endpoint bug, not a route-choice
> difference. See `cc-report.md`'s appended v2 section for the full
> correction record.

Every one of the above length is independently re-derived in the test
file by walking the ORIGINAL line vertices the result's own slices
point at (not by trusting the module's own internal sum) — and every
test passed when run (see Verification below).

B1/B2/C1/E1→S2 — the shorter, hand-verifiable pairs — match the
approved prompt's own prototype cross-check to 6+ significant figures
exactly, and with the v2/JK1 endpoint correction above, R1→Selfoss/
Hella now match it too, to the last digit. Per the approved prompt's
own instruction, that cross-check is still "an independent check,
never a golden value this implementation must reproduce" — it simply
turned out, once the endpoint bug was fixed, to be the same answer.

## Two real bugs found and fixed during this round's own verification

1. **Slice-merge type mismatch** (production code): the merge
   comparison checked a slice's already-stringified `"forward"`/`"reverse"`
   against a raw numeric `+1`/`-1` direction value — always false, so
   contiguous same-piece edges were never merged. Caught because the
   real R1→Selfoss/Hella integration tests expected piece 1436 to
   appear exactly once; it appeared three times until fixed. Fixed by
   keeping the raw numeric direction throughout the merge pass and
   converting to the string form only in the final output mapping.
2. **Chord-vs-polyline test bug** (test code, not production): the
   independent length-verification helper summed the straight chord
   between a slice's `fromXY`/`toXY`, which is wrong for a MERGED slice
   spanning many original vertices (a bent polyline, not a straight
   line). Fixed to walk every original consecutive vertex pair in the
   slice's own index range from the raw input lines.

Both were caught by this round's own real-data tests failing, not by
code review alone — see Verification.

## P1–P6 compliance, stated plainly

- **P1**: B2's test explicitly asserts the returned arc is the 40.406 m
  `reverse` one, explicitly checks it is NOT close to the 72.549 m
  forward arc or the 34.749 m straight gap, and is never called "the
  B2 length/gap" anywhere in code or this note.
- **P2**: endpoints pinned exactly as specified — R1 = 1436's western
  end, Selfoss = 2138's own `exit_coord`, Hella = 3591's own
  `exit_coord`, E1 = 2344's own start, S2 = 2894's own end. As of v2/
  JK1, Selfoss/Hella are read directly from `place_nodes-v3.json`'s own
  `exit_coord` field in the test file (not hand-typed) — v1 had instead
  hand-typed `entry_coord`'s values while mislabeling the comment "own
  exit"; see the v2 correction note above and `cc-report.md`.
- **P3**: slice `fromIndex`/`toIndex` always reflect the actual
  traversed vertex indices (not a normalized 0/N), and the R1→Hella
  test confirms 2138 appears in genuinely separate, non-adjacent
  slices with edge-level (not piece-level) uniqueness checked.
- **P4**: parallel-edge tie-break resolved once, up front, by lowest
  numeric `sourceId` (lexical `evidenceRef` as secondary tie-break);
  proven deterministic under input-order shuffling in a synthetic test.
  **v2/JK2-JK3**: a separate gap existed inside `shortestPath()` itself
  for two genuinely *different*, non-parallel, equal-length paths
  (not the same two nodes, so P4's own rule never applied) — fixed by
  adding two tie-breaks to the Dijkstra relaxation itself (frontier
  selection by lexical node key; predecessor replacement on exact-tie
  candidate distance via the same sourceId/evidenceRef rule as P4, see
  `edgeWins()`). Proven with a dedicated symmetric fixture
  (`id10`/`id20`) and a retained-data R1→Selfoss permutation test —
  both resolve to the same `geometryId`/`slices` regardless of input
  order. No change to numeric length, topology, tier, or the P4 rule
  itself; no epsilon introduced.
- **P5**: tier 2 used throughout this round's integration tests,
  explicitly documented above as a choice, not a distance contract;
  mixed-tier input is rejected outright.
- **P6**: `z` is preserved per-vertex as source metadata on each
  slice's `fromXY`/`toXY` and never used for connectivity (matching is
  XY-only); `reverseGeometryPath` is tested for `reverse(reverse(x)) === x`
  and never asserts anything about legal driving direction.

## Verification performed

- **v1**: the real `npx vitest run` failed in this environment for
  every test file (confirmed on an untouched, pre-existing file —
  `api/_lib/winterRoute/routes.test.js` — identical `TypeError: Cannot
  read properties of undefined (reading 'config')`). Worked around
  with a small `vitest`-compatible shim running the real, unmodified
  test content under plain Node — 21/21 assertions passed.
- **v2 (this correction round)**: the real `npx vitest run` command
  specified in `approved-prompt-v2.md` was attempted first, per its own
  explicit instruction not to assume the shim is still needed — it
  **passed for real this time** (environment issue no longer
  reproduces): `geometryComposition.test.js`,
  `routes.test.js`, `segments.test.js`, `cache.test.js`,
  `winterRouteRoutes.test.js` — **5 files, 50/50 tests pass** (48 from
  v1 plus this round's 2 new JK2/JK3 tests). No shim was needed for v2.
- `npx eslint` on both files — clean, both v1 and v2.
- `git status --porcelain` / mtime check — confirms zero existing
  `winterRoute` file (routes.js/segments.js/cache.js and their own
  tests, or any frontend route-contract file) was touched.
- `git diff --check` — clean.

## Next runtime/contract decision point (not decided or started here)

This round delivers a working, tested geometry core — nothing more.
Before any of this could reach `/api/winter-route`, a new UI entrypoint,
or a third fixed `routeId`, the owner needs to decide, as a separate,
explicitly scoped next prompt:

1. Whether B2's two arc choices (40.4 m reverse vs. 72.5 m forward)
   should ever both be exposed, or whether only the forward (drawn-
   direction) arc may ever be used in a real route, specifically to
   avoid "selling" the short reverse arc as a legal roundabout
   movement by accident (the risk P1 exists to flag).
2. What driving-direction/legal-access authority (if any) will ever
   upgrade `drivingAccess` away from `"UNVERIFIED"` — this module
   deliberately has no opinion and no mechanism to do so itself.
3. Whether/how `tier` becomes a product decision (e.g. always tier 2,
   or selected per corridor) rather than a per-call test parameter.

(v2 note: the former decision point 3 here — "whether the R1→Selfoss/
Hella length discrepancy warrants investigation" — is retracted. It
was based on the v1 endpoint bug (JK1); there is no discrepancy once
the correct `exit_coord` endpoint is used, so no owner decision is
needed on it.)

No endpoint, UI, or fixed-route change is proposed or started by this
round.
