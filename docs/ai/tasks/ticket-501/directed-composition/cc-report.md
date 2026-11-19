# #501 directed-composition — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/directed-composition/approved-prompt-v1.md`
  (Jonesy APPROVED without blockers; Round1 + Jonesy's binding P1–P6
  incorporated verbatim).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-18.
- Scope: `api/_lib/winterRoute/geometryComposition.js` and `.test.js`
  only, plus this ticket's own `directed-composition/` docs and
  `CURRENT.md`. No change to `geometryDataset.js`, the endpoint, the
  runtime JSON, any UI, or any other file.

## Git state

- `git status --porcelain`: `docs/ai/CURRENT.md` (modified) plus the
  already-untracked carried-over files from prior rounds. Only
  `api/_lib/winterRoute/geometryComposition.js`/`.test.js` were actually
  edited this round — every other new file (geometry-api's endpoint/
  dataset/runtime JSON) is present but **untouched** (confirmed by
  mtime/no diff).
- `git diff --check`: clean.

## What was built

A single opt-in extension to the pure core, with **no change at all**
to its behavior when `mode`/`policy` are absent:

- New `REASON` codes: `invalid_mode`, `invalid_policy`,
  `no_directed_path`, `directed_result_not_reversible` (added to the
  existing `REASON`/`UNSUPPORTED_REASONS` object, nothing removed or
  renamed).
- `validateDirectedPolicy(policy, tier)` — validates the **whole**
  policy up front (P3): `policyVersion` present; every rule has a
  numeric `sourceId`, a `tier` matching `input.tier`, a `direction` in
  the fixed enum, and a non-empty `directionBasis` for
  `forward`/`reverse`/`both` (not required for `unknown`/`blocked`).
  Exact duplicate rules for the same `sourceId` are harmless; a
  conflicting rule (different `direction` or `directionBasis`) is
  always `invalid_policy`, never last-wins. A rule for a `sourceId`
  outside `lines` is validated identically, then has zero effect later.
- `buildGraph()` refactored (behavior-preserving) to also expose
  `rawEdgesByNode` (the raw bidirectional edge candidates before any
  dedup) alongside the already-deduped undirected `edgesByNode`. The
  undirected parallel-edge tie-break itself was extracted into a shared
  `resolveParallelEdges(candidateEdgesByNode, pairKeyFn)` helper, called
  with the SAME unordered-pair key as before for the undirected path —
  this is a literal extraction, not a logic change, and is verified
  byte-identical by the full existing 23-test regression (see
  Verification below).
- `filterEdgesByDirectedPolicy(rawEdgesByNode, permissionBySourceId)` —
  **filters by permitted direction FIRST** (P1): a line with no rule,
  or `unknown`/`blocked`, contributes no edges; `forward`/`reverse`
  keep only the matching raw-edge direction; `both` keeps both. Only
  AFTER this filter does `resolveParallelEdges()` run again, this time
  with an **ordered** `directedPairKey` (`"${fromId}->${toId}"`, never
  normalized) — so a source permitted only `A->B` and a different
  source permitted only `B->A` both survive, each in its own direction,
  and the dedup can never discard an edge before direction is even
  considered.
- `composeGeometryPath()` — a mode/policy gate runs before any graph is
  built (P2, see `contract-note.md`'s table). When directed, the
  directed edge set above is used for `shortestPath()` instead of the
  undirected `edgesByNode` — `shortestPath()` itself was **not
  touched**, it is generic over whatever adjacency map it's given.
  Endpoint existence (`endpoint_not_in_graph`) still uses the full
  `nodes` map built from every line (P5) regardless of policy. Every
  directed-mode result (`geometry_only`, `same_place`,
  `no_directed_path`, `endpoint_not_in_graph`) is tagged with
  `mode`/`policyVersion` via a small `tagDirected()` helper; the
  undirected path never calls it, so its result objects get no new
  keys.
- `computeGeometryId()` — now takes an optional `directedMeta`. When
  absent (the undirected call), the descriptor is byte-identical to
  before (`v`, `tier`, `from`, `to`, `slices` with the same 4 keys) —
  old IDs are preserved exactly. When present, it adds `mode`/
  `policyVersion` at the top level and `appliedRule` per slice, so a
  directed result can never collide with its own undirected ID.
- `buildSlices()` — passes through `appliedRule`/`directionBasis` when
  present on the input steps (directed only); untouched for the
  undirected path, which never sets those fields.
- `reverseGeometryPath()` — rejects any `result.mode === "directed"`
  input with `unsupported/directed_result_not_reversible`, no
  `isReverseOf`. The undirected branch is completely unchanged.

## P1–P6 disposition

- **P1**: confirmed with both a synthetic fixture (lower-sourceId
  blocked/missing never shadows a permitted higher sourceId; two
  sources each permitted only in their own opposite direction both
  survive; two same-direction permitted sources still use the existing
  stable tie-break) AND the real fixture from the prompt
  (`lines: [2117, 2134, 2135, 36807]`, policy permits only `36807
  forward`) — `geometry_only`, `72.54928752266883 m`, one slice
  (`36807 forward 2→5`). Independently re-run directly against the
  production module before writing the assertion (see Verification).
- **P2**: all five gating rows verified directly (no mode/policy →
  unchanged; bad mode → `invalid_mode`; policy without `mode:"directed"`
  → `invalid_mode`; `mode:"directed"` with no policy → `invalid_policy`;
  empty valid policy → `no_directed_path`, not `invalid_policy`).
- **P3**: every malformed-rule case tested individually (bad
  `sourceId`, mismatched `tier`, bad `direction` enum, missing/empty
  `directionBasis` for `forward`/`both`, `unknown`/`blocked` needing no
  basis) plus exact-duplicate-allowed, conflicting-rule-rejected (both
  by direction and by basis), out-of-scope-rule-ignored-once-valid
  (same `geometryId` with or without it), and out-of-scope-rule-still-
  validated (a malformed out-of-scope rule still fails).
- **P4**: `GEOMETRY_COMPOSITION_VERSION` asserted `=== 1`. A real fixed
  regression pins the EXACT Selfoss→Hella undirected `geometryId`
  (`1e5ec24e068b90156c1c9b0ec1c00d39`) reported from the real
  geometry-api round — unchanged. A directed `"both"` policy covering
  every real sourceId on that path gives identical slices/length but a
  different `geometryId`. Permutation test (shuffled lines AND shuffled
  policy rules order) gives the identical directed `geometryId`.
  Directed `same_place` has its own distinct ID from the undirected
  `same_place` ID for the same point.
- **P5**: `no_directed_path` asserted never `disconnected_graph` in
  directed mode; `endpoint_not_in_graph` confirmed to still fire for a
  genuinely absent vertex regardless of policy, tagged with
  `mode`/`policyVersion`; the real retained R1→Selfoss pair with an
  empty (valid) policy gives `no_directed_path`, never
  `endpoint_not_in_graph` and never a filled-in "real direction".
- **P6**: the real B2/36807 ring fixture proves the exact scenario the
  prompt itself specifies: reversing the forward `72.549288 m` result
  is rejected (`directed_result_not_reversible`, no `isReverseOf`); an
  independent new compose for B→A gives `40.406375 m` forward (the
  OTHER ring arc) — explicitly NOT a mirror of the forward result. A
  simple one-way chain fixture additionally shows `A→B` success /
  `B→A` → `no_directed_path`. The undirected `reverseGeometryPath` path
  is asserted unchanged (`isReverseOf` still set, same shape as before).

## Verification performed

- **Independent empirical verification before writing any test
  assertion** (same discipline as every prior round this ticket): every
  directed-mode scenario above was first run directly against the
  production module via ad-hoc Node scripts, with the printed real
  output used to write the test expectations — never a hand-derived or
  assumed number. This is how the exact fixed values above
  (`72.54928752266883`, `40.40637511981366`,
  `1e5ec24e068b90156c1c9b0ec1c00d39`, etc.) were confirmed.
- **Real `npx vitest run`**, focused set — **8 files, 132/132 tests
  pass** (no shim needed): `geometryComposition.test.js` (54, up from
  23 — all 23 original undirected tests pass completely unchanged,
  plus 31 new directed-mode tests), `winter-route-geometry.test.js`
  (20), `geometryDataset.test.js` (11), `winter-route.test.js`,
  `routes.test.js`, `segments.test.js`, `cache.test.js`,
  `winterRouteRoutes.test.js`.
- `npx eslint api/_lib/winterRoute/geometryComposition.js
  api/_lib/winterRoute/geometryComposition.test.js` — clean.
- `git status --porcelain` / `git diff --check` — confirmed clean scope;
  only the two permitted production files were edited.
- No stub/bypass of the production compose function anywhere in the new
  tests — every directed assertion goes through the real, exported
  `composeGeometryPath`/`reverseGeometryPath`, including the retained
  real tier-2 B2/36807 and R1→Selfoss data.

## Limits / not done here (unchanged from contract-note.md)

No runtime direction policy for any real place/corridor exists or is
proposed — every policy used in this round's tests is synthetic or
explicitly `TEST_FIXTURE_HYPOTHETICAL`. No endpoint/UI/dataset wiring.
This does not close ticket #501 and is not "directed functionality"
delivered to any user — a mechanical core capability only, awaiting a
separate, explicitly reviewable runtime-policy decision before any
real use.


## Ripley leiðrétting við lokamat — 2026-11-18

PASS með óhindrandi CF1: fullyrðing um BYTE-IDENTICAL undirected-niðurstöður er of víð. detail-texti disconnected_graph breyttist úr 'given lines' í 'given lines/policy'; status/reason og staðfest eldri geometry-ID eru óbreytt. Sjá result-review.md, Ripley lokamat. Sjálfstætt Windows: focused 8 skrár/132 próf PASS, lint hreint og approachSelections 50/50 PASS (OP5 endurtekur sig ekki hér). Engin runtime-akstursheimild eða directed endpoint/UI afhent.
