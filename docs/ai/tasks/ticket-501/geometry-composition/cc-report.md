# #501 geometry-composition — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/geometry-composition/approved-prompt-v1.md`
  (Jonesy APPROVED without blockers; P1–P6 incorporated as binding
  execution notes, not optional hardening).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-17.
- Scope: one pure backend JS module + its own test file (geometry
  composition core only). No endpoint/UI/fixed-route/cache/fetch/
  frontend/data change, no new dependency, no network, no GitHub
  action, no commit/push/deploy.

## Git state

- HEAD before and after: unchanged (no commits this round).
- `git diff --check` after finishing: clean.
- `git status --porcelain` after finishing: only `docs/ai/CURRENT.md`,
  the two new files under `api/_lib/winterRoute/`
  (`geometryComposition.js`, `geometryComposition.test.js`), and the
  new docs under `docs/ai/tasks/ticket-501/geometry-composition/`. mtime
  check confirms every pre-existing `api/_lib/winterRoute/*` file
  (`routes.js`, `segments.js`, `cache.js`, `roadFetch.js`,
  `forecastFetch.js`, and all their own tests) is untouched.

## What was built

- `api/_lib/winterRoute/geometryComposition.js` — pure module, no
  `fs`/network/`docs` import. Exports `composeGeometryPath`,
  `reverseGeometryPath`, `UNSUPPORTED_REASONS`,
  `GEOMETRY_COMPOSITION_VERSION`. Full interface/behaviour described
  in `implementation-note.md` — not repeated here.
- `api/_lib/winterRoute/geometryComposition.test.js` — the sole test
  file, reading real retained data itself (never inside the
  production module): `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json`
  (VEGNR=1, tier 2) and `docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json`
  (VEGNR=93/road93, tier 2). No task-local adapter file was needed —
  the loader is ~15 lines, kept inline in the test file itself.

## Independent data verification performed before writing any test assertion

Before encoding a single expected number, every pair's real retained
geometry was independently re-extracted and, for B1/B2/C1/E1→S2,
hand-verified against a from-scratch Python Dijkstra mirror (not the
JS module, not the prototype) run directly against the raw JSON:

- Confirmed B1's real contact is `1735`'s own vertex 1 (not its vertex
  0), by literal float equality on the actual coordinates.
- Confirmed `36807`'s shoelace orientation (CCW, sum ≈ 1704.26) and
  both of its real arc lengths (40.40637511981366 / 72.54928752266883)
  independently — matching the approved prompt's own cited cross-check
  numbers for B2 exactly.
- Confirmed C1's real path (43.488920509692846) via a 3-line Python
  Dijkstra (3454/3767/3768) — matching the cross-check exactly.
- Confirmed E1→S2's real tier-2 chain length (24148.860880942146) —
  matching the cross-check exactly.
- Computed R1→Selfoss (43101.15854556007) and R1→Hella
  (79817.67750446162) on the full real 249-feature tier-2 VEGNR=1 graph
  — these differ from the approved prompt's own prototype cross-check
  (44,984.77 / 80,630.95), which the prompt itself says must never be
  treated as golden; reported as an honest, explained difference in
  `implementation-note.md`, not hidden or forced to match.
  > **SUPERSEDED by the v2 correction below (JK1): this "different,
  > valid, lower-cost route" explanation was wrong.** The real cause
  > was a wrong endpoint in this round's own test file (`entry_coord`
  > used instead of the required `exit_coord`), not a route-choice
  > difference. See "v2 correction" at the end of this report.

This verification is what gave confidence the JS implementation's own
graph-construction logic was sound before trusting its test output.

## Two real bugs found and fixed this round

1. **Production bug**: the slice-merge step compared an already-
   stringified `direction` (`"forward"`/`"reverse"`) against a raw
   numeric `+1`/`-1` value from the edge objects — an always-false
   comparison, so contiguous same-piece edges were never merged.
   Caught because the real R1→Selfoss/Hella tests expected piece 1436
   (R1's own line) to appear exactly once; a first run showed it
   appearing three times. Fixed in `geometryComposition.js` by keeping
   the raw numeric direction through the whole merge pass.
2. **Test-helper bug**: the independent length-verification helper
   computed the straight chord between a slice's endpoints, which is
   wrong once a slice has been merged across many original vertices
   (a bent polyline). Fixed to walk the original line's own consecutive
   vertices across the slice's real index range.

Both were caught by real test failures against real data, not by
inspection — full detail in `implementation-note.md`.

## Verification performed

- **`npx vitest run` fails in this environment for every test file**,
  confirmed by reproducing the identical `TypeError: Cannot read
  properties of undefined (reading 'config')` on an untouched,
  pre-existing file (`api/_lib/winterRoute/routes.test.js`) — this is a
  pre-existing environment issue, not caused by this round's two new
  files, and is the same failure mode seen (and worked around the same
  way) in earlier rounds of this same ticket.
- In its place: wrote a small `vitest`-compatible shim
  (`describe`/`it`/`expect`, covering exactly the matcher methods the
  real test file uses — `toBe`, `toEqual`, `toBeCloseTo`,
  `toHaveLength`, `toBeTruthy`, `toContain`, `toBeGreaterThanOrEqual`,
  `toBeLessThan`, and their `.not` forms) and ran the **real,
  unmodified** `geometryComposition.test.js` content directly under
  plain Node (only the `import ... from "vitest"` line swapped for the
  shim import, and the one relative module import made absolute for
  the copy's new location — no assertion, fixture, or expected value
  was changed). **21/21 real assertions pass.**
- `npx eslint` on both new files: one real finding (a transcribed
  numeric literal with one extra digit, tripping `no-loss-of-precision`)
  caught and fixed; clean afterward.
- Could not run the existing `winterRoute routes/segments/cache` or
  frontend route-contract test suites in this environment either (same
  vitest failure) — confirmed instead via `git status`/mtime that none
  of those files were touched, so their behaviour is unchanged by
  construction, not merely asserted.
- `git diff --check` — clean.
- `git status --porcelain` — only the files listed above.

## Status

A working, independently-verified geometry-composition core is
delivered: real `geometry_only` results for B1, B2 (with P1's
direction caveat explicitly tested), C1, E1→S2, R1→Selfoss, and
R1→Hella, each length re-derivable from the returned slices alone.
Two real bugs were found and fixed via the round's own real-data
tests. The pre-existing broken `vitest` environment is documented
honestly, with a real-content Node-shim run substituted as evidence
rather than an untested claim. This is **not** a #501 implementation,
not wired to any endpoint/UI/fixed route, and does not promote any
place to `SUPPORTED`/`ROUTABLE`. The next-decision points in
`implementation-note.md` are not started here. No GitHub issue closed/
edited; no commit/push/deploy.

---

## v2 correction (2026-11-18) — JK1/JK2/JK3, per `approved-prompt-v2.md`

Authorization: Jonesy's result-review of v1 found JK1 (wrong endpoint)
and JK2/JK3 (a real determinism gap); Ripley's final assessment was
REVISE; owner approved `approved-prompt-v2.md` as a single narrow
correction round, no new prompt-review cycle. Scope: only
`geometryComposition.js`/`.test.js` and this ticket's own docs/
`CURRENT.md`.

### JK1 — wrong endpoint, not a route-choice difference (RETRACTED finding)

v1's test file read `place_nodes-v3.json`'s `entry_coord` for IDFERILL
2138 (Selfoss) and 3591 (Hella) while mislabeling the code comment
"own exit" — the approved prompt's own P2 always required the pinned
`exit_coord`. This produced the wrong literal target coordinate, which
this round's own independent from-scratch Python Dijkstra mirror
(run against the raw retained `wfs-vegnr1-all.json`, not the JS module,
not anyone else's prototype) confirms: with the corrected `exit_coord`
endpoint, the length is **44984.77037809235 m** (Selfoss) /
**80630.94782758385 m** (Hella) — matching Jonesy's own independent
cross-check (44984.770378 / 80630.947828) to the last digit.

**This retracts v1's "different, also-valid, lower-cost route choice"
explanation outright — it was factually wrong.** The real cause was
always the wrong endpoint, not an alternate path through a graph with
many parallel/alternative edges.

Fix: `geometryComposition.test.js` now reads `SELFOSS_EXIT`/
`HELLA_EXIT` directly from `place_nodes-v3.json`'s own `exit_coord`
field (never hand-typed), asserts `result.to.x`/`result.to.y` equal
those pinned values exactly, and asserts the corrected lengths above.
`implementation-note.md`'s table and "next decision point" #3 (which
was predicated on the now-retracted explanation) were corrected/
removed. **No production code change was required for JK1** — the
unmodified v1 `geometryComposition.js` already produced the correct
answer once given the correct input.

### JK2/JK3 — deterministic equal-cost paths (real production fix)

Distinct from P4 (same two nodes, parallel edges, already correct in
v1): two genuinely *different* paths — not sharing both endpoints,
not from the same parallel-edge pool — can coincidentally have equal
total length, and v1's `shortestPath()` resolved the tie based on
Dijkstra's own internal traversal/insertion order, not on any stable
rule. Fixed with two new deterministic tie-breaks inside
`shortestPath()`'s relaxation loop:

- **Frontier selection**: when two unvisited nodes share the current
  minimum distance, the lexically-smaller `"x|y"` node key is
  processed first.
- **Predecessor replacement**: when relaxing an edge produces a
  distance exactly equal to (not better than) a node's current best,
  a new `edgeWins()` helper (same rule family as P4: lower numeric
  `sourceId`, then lexical `evidenceRef`) decides whether to switch
  predecessors.

No change to numeric length, geometry topology, tier, or the existing
P4 parallel-edge rule; no epsilon introduced.

Verified with:
- A new synthetic symmetric fixture (`id10`: (0,0)→(10,0)→(10,10),
  `id20`: (0,0)→(0,10)→(10,10) — genuinely different, non-parallel,
  equal-length paths) run under both input orders: identical
  `geometryId` and `slices`, not just equal length. Confirmed by
  direct execution of the production module that the deterministic
  winner is `id10` (lower `sourceId` breaks the predecessor tie at the
  shared midpoint).
- A retained-data permutation test: the real 249-feature tier-2
  VEGNR=1 line array reversed, re-run against the corrected
  R1→Selfoss endpoint — identical `geometryId`/`slices` to the
  unshuffled run.
- The pre-existing closed-ring zero-length-step test (a genuine JK2-
  style tie between two non-parallel arcs of the same ring) now has
  its comment corrected and gains explicit assertions on the specific
  resolved slice (`sourceId: 7`, `direction: "reverse"`,
  `fromIndex: 5`, `toIndex: 3` — via (0,10), never via (10,0)), proven
  by direct execution of the production module, not asserted blind.

### Verification (v2)

- **Real `npx vitest run`** (the exact command in
  `approved-prompt-v2.md`) was attempted first, per its own explicit
  instruction not to assume the prior shim is still needed. It
  **passed for real** — the environment issue from v1/earlier ticket-
  500/501 rounds did not reproduce this time:
  `api/_lib/winterRoute/geometryComposition.test.js`,
  `routes.test.js`, `segments.test.js`, `cache.test.js`,
  `src/lib/winterRouteRoutes.test.js` — **5 files, 50/50 tests pass**
  (the pre-correction baseline was 48; this round added 2 new tests
  for JK2/JK3). No shim was used or needed for v2.
- `npx eslint api/_lib/winterRoute/geometryComposition.js
  api/_lib/winterRoute/geometryComposition.test.js` — clean.
- `git status --porcelain` — only `docs/ai/CURRENT.md`,
  `geometryComposition.js`/`.test.js`, and this ticket's own docs
  touched; `git diff --check` — clean.

### Disposition summary

- **JK1**: CONFIRMED and fixed (test-file endpoint only; no production
  change). v1's explanation is retracted as factually wrong, not
  merely softened.
- **JK2/JK3**: CONFIRMED and fixed (real production gap in
  `shortestPath()`'s tie-break logic, now deterministic).

Still not a #501 implementation; not wired to any endpoint/UI/fixed
route; does not promote any place to `SUPPORTED`/`ROUTABLE`. No
GitHub issue closed/edited; no commit/push/deploy.
