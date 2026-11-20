# CC report -- closure-scope (ticket #501)

Executed against `approved-prompt-v1.md` P1-P8. **Documents-only round: no
production code, runtime JSON, or prior approved-prompt/result-review file
was created, modified, or deleted.** Every figure in `scope-and-blockers.md`
is from a real call to the production handler/core in this session, via
temporary scratchpad scripts that are not part of this repository and were
not committed -- never copied from `prompt-review.md`'s own sandbox
citations without independent re-verification.

## What was actually run

- **P1 support list**: one scratchpad script called the real
  `api/winter-route-geometry.js` handler for all 3,600 ordered pairs among
  the 60 relevant ids (56 place ids + `flokalundur` + 3 junction ids).
  Reproduced the approved prompt's own cited 36-directional/18-unordered
  `geometry_only` split and the 5-id `same_place` split exactly.
- **P2 criteria table**: built from the existing, already-closed test/round
  history plus three fresh real calls confirming the `idButurIds` vs.
  `slices[].idbutur` vs. `FORECAST_POINTS` contract difference (criterion
  1) by inspecting each surface's own real response shape.
- **P3 real calls**: `budardalur→holmavik`, `holmavik→budardalur`,
  `seydisfjordur→egilsstadir` (reversed existing pair), and `same_place`
  checks for all 5 ring-pilot ids plus `holmavik→holmavik` -- all real,
  live handler calls in this session.
- **P3/P4 Experiment A**: a scratchpad script merged all 8 existing
  Westfjords region loaders' own `lines` by `sourceId`, found and
  precisely diagnosed one cosmetic (non-geometric) field difference at
  `sourceId 3611`, then composed `budardalur↔holmavik` on the real merged
  2-region subgraph (exact match to the cited 78,697.77054505677 m). A
  first attempt at the full 8-region merge under-collected connectors
  (missed `-4`), produced a visibly wrong ~383 km figure for an already-known
  172,474 m pair, was diagnosed to the missing connector, and was fixed
  before any of the ten new-pair figures were treated as final. All ten
  corrected figures match the approved prompt's own cited sandbox numbers
  exactly (section 3 of `scope-and-blockers.md`).
- **Ring Road danger**: independently re-verified both of the approved
  prompt's own cited figures (`junction-1-60-baulan↔junction-1-68-stadarskali`
  = 219,478.02 m on the Westfjords-only merged network; 51,570.88 m on the
  full retained national tier-0 graph, which does carry the real Ring
  Road lines) and the `budardalur↔junction-1-68-stadarskali` figure
  (177,322.81 m) -- all three exact matches, via real `composeGeometryPath`
  calls, not assumed from the citation.
- **P6 follow-up table**: a scratchpad script computed the real
  point-to-segment projection of all 31 CSV rows (34-64) against the real
  merged 88-line network, for every line in that network (not merely the
  nearest vertex). This surfaced one genuine correction to
  `prompt-review.md`'s own unverified hypothesis (Súðavík measures 284.4 m
  from an existing leg, not a distant branch as hypothesized) and one
  unresolved real data gap (the CSV's own "Dýrafjarðargöng" coordinate
  measures several kilometers from both the real tunnel lines and the
  current leg).

## What was NOT run

- No full test suite, mutation run, or build was run (per the approved
  prompt's own scope: "ekki fullsuite/mutation/build nema sýnd ástæða" --
  no reason was shown to deviate from that). The prior 813/813 full-suite
  result is attributed to the `westfjords-talknafjordur-mvp` round's own
  result review, not re-claimed as a fresh run here.
- No visual map review (none was requested or needed for a documents-only
  round).
- No new data acquisition, network call, or GitHub action of any kind.
- Step 2 itself was not started, and no code toward it was written,
  sketched, or scaffolded beyond the read-only scratchpad scripts used to
  verify the figures above (which are not part of this repository).

## Files

New:
- `docs/ai/tasks/ticket-501/closure-scope/scope-and-blockers.md`
- `docs/ai/tasks/ticket-501/closure-scope/cc-report.md` (this file)

Modified: `docs/ai/CURRENT.md` (workflow stage only).

Nothing else. `git status --porcelain` and `git diff --check` were run
to confirm this before writing this report; no other file is touched by
this round.

## Honesty checks (P8)

- No claim is made anywhere in `scope-and-blockers.md` that the merged
  Westfjords network is a finished or shipped feature -- it is explicitly
  described as a verified, read-only experiment supporting a step-2
  proposal, not an implementation.
- Step 2 was not started. No code, runtime JSON, or prior approved
  prompt/result-review file was touched.
- Every existing limitation stays visible and is restated, not softened:
  `drivingAccess: "UNVERIFIED"` on every pair; the two estimated
  connectors (5 mm and 4.39 m, now shown to compound to up to 4.40 m on a
  two-connector pair); the owner-coordinate offsets at every endpoint; the
  tier-0 planar (not driving) length convention; the Ísafjörður roundabout
  caveat; the Tálknafjörður 995 m coverage gap. None of these were
  resolved, hidden, or re-litigated in this round.
- No visual PASS is claimed anywhere in this round -- none was required.
- The one unresolved real data gap found during this round's own P6 work
  (Dýrafjarðargöng's own CSV coordinate vs. the real tunnel lines) is
  reported plainly as a gap, not papered over with an invented fix.

## Scope notes

This round delivered exactly the two documents named in the approved
prompt's own "Afhending" section, nothing more. No new review loop, no new
place pairs, no optional hardening, and no step-2 implementation were
started. `closure-scope/scope-and-blockers.md` section 4's own "fixed
proposal for step 2" is offered as a verified, CC-owned recommendation for
Ripley/the owner's own next decision -- it is not an execution authorization
for this or any future round to act on unilaterally.
