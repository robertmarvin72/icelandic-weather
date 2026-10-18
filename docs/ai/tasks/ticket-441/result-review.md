# Ticket #441 — Result review (Jonesy)

Date: 2026-10-18
Reviewer: Jonesy (technical peer reviewer; did not implement, did not edit application or test files)
Reviewed against: `approved-prompt-v1.md` (Ripley Round 1 + G1–G8), `cc-report.md`, and the staged live source (`RoutePlannerCard.jsx` 66,634 B, `RoutePlannerCard.canonicalTone.test.jsx` 14,550 B, `RoutePlannerDetailsModal.jsx`, the two existing RoutePlannerCard test files, `comparisonUtils.js`, `useComparisonState.js`).

## Verdict: PASS (no required fixes; non-blocking notes R1–R6)

Option A is implemented exactly as approved, the new suite is non-vacuous and matches the real modal's DOM, and the scope is clean. Nothing blocks Ripley's final assessment. The fix removes one confirmed contradiction (an escape-suggestion block in the modal while the card headline says stay); it does not remove all candidate-driven content that can read positive in that modal (see R5).

## Production change (verified)
- `RoutePlannerCard.jsx` modal prop now reads `detailsCandidate ? getEscapeSuggestion(detailsCandidate, displayDecisionLower) : null` (L1628–1630). The main-verdict call stays `getEscapeSuggestion(best, displayDecisionLower)` (L955). The helper signature and default (`toneLower = decisionLower`, L859) and the whole helper body are unchanged; the only other change is the rewritten comment above it (L848–858), which now states the shared-gate semantics and that any new caller must pass `displayDecisionLower`.
- Method: I reverted exactly those two edits in memory (new comment → the old four-line comment, new three-line prop → the old one-liner, preserving CRLF) and obtained 66,103 bytes, which is exactly the size of the post-#436 copy I staged earlier; nothing else in the file differs in length. This is a size match, not a hash or git diff.
- `getEscapeSuggestion` occurs only as the definition (L859) and the two calls (L955, L1629) in my staged `RoutePlannerCard.jsx`.
- Scope by mtimes/sizes in `src/components` and `src/i18n`: only `RoutePlannerCard.jsx` and the new `RoutePlannerCard.canonicalTone.test.jsx` changed; `RoutePlannerDetailsModal.jsx`, `RoutePlannerCard.test.jsx` (1787160883356) and `RoutePlannerCard.caution.test.jsx` (1792265731421) are unchanged, `translations.routePlanner.js` unchanged (1792250890499); `comparisonUtils.js`/`useComparisonState.js`/`useRoutePlanner.js` have old mtimes. Not checked by me: `package.json`/lock, `api/`, `git status`/`git diff`.

## G1–G8 compliance (read in the new test file)
| Condition | Result |
|---|---|
| G1 literal anchors, not body/destination | Met. Constants `🚐 Escape the storm` / `Calmer conditions may be available nearby.` and the IS pair (`🚐 Forðastu óveðrið` / `Rólegra veður gæti verið í nágrenninu.`) are hard-coded and match the dictionary values; no body/destination assertions. |
| G2 modal scoping | Met. `modalContainer()` finds the `document.body` child containing the `Close modal` button; every presence/absence assertion is `within(modal)`; unopened state asserted `null` before the click in the first positive control and the no-candidate test. |
| G3 reaching the trigger | Met. Pro entitlement, expand CTA first, click scoped to the named candidate's `<li>`. |
| G4 non-best | Met. Heading identity asserted for the second candidate; discriminating case (eligible best shows the block, ineligible second with `hasWarning:true` → candidateRank = baseRank does not); canonical stay with two eligible candidates shows it for neither. |
| G5 fixture wiring | Met. `result.explain.base.windowDays` with a `warn` wind warning on day 1 inside the card's default 3-day slice → baseRank 1; candidate flags false, `deltaVsBase 10 ≥ requiredDelta 1`, `aggregateType "better"`. I traced each `getEscapeSuggestion` guard against this fixture. |
| G6 red/green and controls | Met on paper. The recorded red set (7 failed: B×4, the IS case, C, D-stay) equals the set I derived from the code (all escape-block-present results under display-stay with the old default). Both gate controls exist: `showComparison:false` + `similar`, and `showComparison:true` + `nearby_better`. `nearby_better` is a real value (`comparisonUtils.js` L80); `useComparisonState` returns `direction` (L87). The red/green run itself is CC's, not mine. |
| G7 counts / protected tests | Arithmetic checks: 15 tests (A2, B5, C1, D2, E3, G6 2 — I counted the `it.each` as 4) = 181→182 files, 2661→2676 tests. Protected test files unchanged (mtimes). Counts themselves are CC's. |
| G8 comment / inventory | Met (comment corrected, default kept as accepted, two callers). The repo-wide grep is CC's; mine covers the staged file only. |

Also verified: `routeStayGoodSpot` renders only under `displayDecisionLower === "stay"` (L1253), so using it as the card-level stay proof in group B is a valid discriminator; the real `App.jsx` passes the same `comparisonState` prop (L446/L507) the tests inject.

## Browser evidence
`outputs/ticket-441-browser-evidence/` holds two positive-control screenshots (1280, 320). I viewed the 320 px one at reduced size: the modal shows the title block, a base-window sentence and the calmer-nearby sentence, no body or destination line, consistent with G1. CC says the stay-override scenario was not reproduced live and relies on component tests; that limitation is stated honestly and I accept it. I did not view the 1280 px image.

## Non-blocking notes
- R1: The D tests open the second candidate without closing the first modal, so the same modal instance re-renders with a new `detailsCandidate`; a real user cannot click the card behind the overlay. It still shows the suggestion is recomputed per candidate, but closing between opens would model the real path.
- R2: Test "C" is a duplicate smoke test of the `current_better` case, not a red/green assertion; the real sensitivity proof is the manual revert in the report (which I could not re-run). The suite count (15) includes it.
- R3: Group B proves canonical stay through the dictionary key `routeStayGoodSpot` rather than the literal headline text; valid as a stay-only discriminator, no test asserts it is absent in the non-stay controls.
- R4: Identity assertions check that the opened modal contains the second candidate's name, not that the best's name is absent from the modal heading; with the eligibility difference this is adequately pinned.
- R5 (residual, not a defect of this change): the modal keeps candidate-driven content that can read positive under a stay headline. In CC's own positive-control screenshot the modal shows "Overall result … Better (next 3 days)" and a "3 better days" line. Option A never touched these; CC's report says so. Ripley/owner should decide whether the post-push GitHub step may call #441 resolved or only "one confirmed cause fixed".
- R6: The `toneLower` default still silently falls back to the raw verdict for a future caller; mitigated by the comment and by G8's decision not to change the signature. Also the test file header cites `RoutePlannerCard.jsx:~1626`; the call is at L1628–1630 (comment only).

## CC claims I did not verify
`npm run test:run` 182 files / 2,676 tests, lint, build; the red/green run (7 failed / 8 passed); the 77-test focused run; the repo-wide caller grep; `git status`/`git diff --stat` results; the 1280 px screenshot; absence of the `App.affiliateHolder` flake.

## Limits of this review
No shell: I ran no tests, lint, build or browser. I have no `git diff`; the production-change check is the byte-size reconstruction above against my own earlier staged copy. GitHub issue #441, the owner's investigation report, `CLAUDE.md`/`AGENTS.md`, `api/`, `package.json` and `node_modules` were not read by me. Test fixtures inject `useRoutePlanner`, `deriveRoutePlannerSummary` and `comparisonState`, so the suite is not live production evidence. Accessible/visible text was checked by reading the tests, not by screen-reader testing.

## Next
Ripley final assessment of #441. Owner then decides commit/push and the explicit post-push GitHub step (wording per R5). I recommend the owner runs `npm run test:run`, lint and build once locally before committing, since I could not. No commit, push, deploy or closure was done or authorized by me.


# Ticket #441 — Ripley final assessment — 2026-10-18

**Verdict: PASS for approved option A.** No further implementation round is required for this bounded correction.

Read CURRENT, approved-prompt-v1.md (Round 1 and G1–G8), CC's report, Jonesy's PASS and the new test file. Independently inspected the actual git diff: RoutePlannerCard.jsx changes only the explanatory helper comment and the modal call to getEscapeSuggestion(detailsCandidate, displayDecisionLower). Helper signature/default, eligibility calculations, candidate data and the existing main call remain unchanged. Repo-wide src search confirms exactly two production callers, both explicitly passing displayDecisionLower.

Independently ran:

`npx vitest run src/components/RoutePlannerCard.canonicalTone.test.jsx src/components/RoutePlannerCard.test.jsx src/components/RoutePlannerCard.caution.test.jsx src/components/RoutePlannerDetailsModal.test.jsx`

**4 files / 77 tests passed, exit 0.** The new suite includes eligible move/consider positive controls; four override regressions plus Icelandic coverage; real modal rendering and scoped assertions; second-candidate eligibility discrimination; missing-data/stay boundaries; and both comparison-gate controls. Fixtures correctly supply result.explain.base.windowDays and qualifying candidate fields, so negative assertions are supported by meaningful positive controls.

`git diff --exit-code` independently confirms no tracked changes in the two protected existing card tests, modal, hazards, scoring, routeRisk, relocationEngine/service, useRoutePlanner/useComparisonState, comparisonUtils, routePlannerSummary, translations.routePlanner, package.json or package-lock.json. The application diff contains no scoring, provider, entitlement, analytics or selection change. No application/test file was edited during this final assessment.

Jonesy R1–R4 and R6 are accepted as non-blocking: switching candidate while the modal remains open tests state recomputation rather than the exact user navigation path; the duplicate smoke test adds no distinct coverage; the stay-only translation key is a valid discriminator; identity assertions are one-sided but supported by the discriminating candidate-eligibility case; the raw default is deliberately retained under G8. None requires widening this correction or rewriting tests now.

CC reports the sensitivity check (temporarily restoring the old call produced 7 failures / 8 passes, restoring the fix yielded 15 passes), full validation at **182 files / 2676 tests**, clean lint and successful build. These are attributed to CC; Ripley independently reran only the four targeted suites and did not mutate production code to repeat the red stage. The reported red-stage order was fixed→temporary old call→fixed, rather than tests-before-first-edit; the genuine old-call assertion failures provide the requested sensitivity evidence and this sequencing difference is non-blocking. CC's mobile/desktop browser evidence covers a positive control only; canonical-stay override is verified by controlled component tests, not claimed as live production proof. Ripley did not rerun browser validation or screen-reader testing.

**Residual / GitHub disposition:** Jonesy R5 remains explicit. Candidate-driven day counts and the overall verdict pill can still read positively under a card-level stay. Option A fixes one confirmed escape-suggestion contradiction; it does not establish that the actual October 14 observation was reproduced or that all of #441 is resolved. Recommended post-push wording is “one confirmed cause fixed”; do not mark the whole issue resolved without the owner's assessment of the remaining scope. No follow-up issue or GitHub mutation is created here.

CURRENT is set to **CLOSED for the local AI task**. The owner next reviews the implementation and history and decides commit/push. Any GitHub closure remains a separate explicit post-push instruction; no Project Done change is made. No commit, push, deploy, GitHub comment or closure occurred.
