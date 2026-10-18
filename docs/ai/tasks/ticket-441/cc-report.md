# Ticket #441 — CC report (approved-prompt-v1.md, option A)

Executed from `docs/ai/tasks/ticket-441/approved-prompt-v1.md` (Ripley Round 1 + Jonesy conditions G1–G8, both copied verbatim into that file). `CURRENT.md` moved `READY_FOR_CC → CC_IN_PROGRESS` before any edit. Baseline `git status --short` at start: `docs/ai/CURRENT.md` (pointer, modified) and `docs/ai/tasks/ticket-441/` (new, untracked) only — no other pending changes, no conflicting work found.

## Root cause (recap, already established in the owner's investigation report)

`src/components/RoutePlannerCard.jsx`'s details-modal prop call (previously line 1621) called `getEscapeSuggestion(detailsCandidate)` with no second argument, so `toneLower` defaulted to the **raw** engine verdict (`decisionLower`) instead of the card's canonical, `comparisonState`-overridden tone (`displayDecisionLower`, L330-336). When `comparisonState.direction` downgrades a raw `move`/`consider` verdict to `stay` (showComparison=true, direction similar/current_better — #353's own mechanism), the card headline correctly read "Stay", but opening a candidate's details modal could still show a "🚐 Escape the storm" relocation suggestion for that same site — a visible contradiction. The main verdict block's own call (L948, now unchanged) already passed `displayDecisionLower` explicitly; only the modal's default-parameter call site missed it. #353 introduced the override mechanism this bug partially escapes; #428 is unrelated (a separate wind/rain scoring-independence investigation). Neither is being re-fixed here.

## Fix (option A — shared canonical gate, not a per-candidate tone model)

`src/components/RoutePlannerCard.jsx`:

```diff
-        escapeSuggestion={detailsCandidate ? getEscapeSuggestion(detailsCandidate) : null}
+        escapeSuggestion={
+          detailsCandidate ? getEscapeSuggestion(detailsCandidate, displayDecisionLower) : null
+        }
```

The comment above `getEscapeSuggestion` (previously claiming the modal "intentionally uses raw tone") was corrected to state that both callers now pass `displayDecisionLower` explicitly, that this is a shared gate (not a per-candidate recommendation model — `candidateRow`'s own fields still describe whichever candidate's modal is open, even when it isn't `best`), and that the default parameter is kept only as a fallback for a future caller that forgets to pass it explicitly (per G8 — changing it to a required parameter was rejected as a signature change, which the prompt forbids).

**Caller inventory (repo-wide, `grep -rn "getEscapeSuggestion" src/`):** exactly two call sites, both in `RoutePlannerCard.jsx` — L948 (main verdict block, already passed `displayDecisionLower` before this ticket) and the fixed modal call site above. No other raw caller exists anywhere in `src/`; the STOP condition for "another raw caller exists" did not trigger.

## New test file: `src/components/RoutePlannerCard.canonicalTone.test.jsx` (15 tests)

Uses the real `RoutePlannerCard` and real `RoutePlannerDetailsModal`; only `useRoutePlanner`, `deriveRoutePlannerSummary`, and `useFreeRecommendation` are mocked (to inject explicit, controlled fixtures — the hooks/summary-deriver injection point the prompt allows). No mocked escape-suggestion output, no modal bypass.

**Shared eligible fixture (G5):** `result.explain.base.windowDays` (3 entries) carries a `warn`-level wind warning on day 1 → `baseRank = 1`. The eligible candidate has `hasWarning:false, hasHighWarning:false` → `candidateRank = 0 < baseRank`; `deltaVsBase: 10 >= requiredDelta: 1`; `aggregateType: "better"` (never `"worse"`). Every `getEscapeSuggestion` guard is satisfied independently of `toneLower`, so the positive control (A) is non-vacuous and every negative case (B/D-stay) is a genuine "tone suppressed it" result, not an accidentally-ineligible fixture.

| Group | Covers | Tests |
|---|---|---|
| A | Positive controls: raw move / raw consider, `showComparison:false` — modal opens, shows `🚐 Escape the storm` + the calmer-nearby sentence (G1's actual render, not body/destination) | 2 |
| B | Regression matrix: raw move/consider × direction similar/current_better, `showComparison:true` (4 cases) — card shows canonical stay, modal has no escape block; plus one IS-literal variant | 5 |
| C | Red/green sanity test (the formal red/green proof is the manual revert documented below, not an in-suite assertion) | 1 |
| D | Non-best alternative: (i) opening a second candidate shows *its own* name, not best's; (ii) a discriminating eligibility case — best eligible, second ineligible via its own `hasWarning` rank (not toneLower) — under raw move; (iii) under canonical stay, neither shows the block | 2 |
| E | Boundaries: raw stay (otherwise-eligible candidate, no block); no comparison/no candidate (no crash, nothing fabricated); missing-data candidate (`deltaVsBase:null`) under raw move shows no suggestion while a separate eligible control in the same render still does | 3 |
| G6 | Gate controls: (a) `showComparison:false` + `direction:"similar"` still shows the block (override needs `showComparison`); (b) `showComparison:true` + a non-downgrading direction (`"nearby_better"`, a real value from `comparisonUtils.js`/`useComparisonState.js`, not invented) still shows it | 2 |

**Modal scoping (G2):** no `role="dialog"` exists on the real modal (a bare `createPortal` into `document.body`), so every test scopes to the `document.body` child that contains the `aria-label="Close modal"` button — never a CSS class selector, and `queryByLabelText("Close modal")` is asserted `null` before the click (unopened) in the representative control tests.

**Reaching the trigger (G3):** Pro entitlement set; the card's `travelAdvisorShowDetails` expand control is clicked first (alternatives are behind `resultsExpanded`); every row's "Open details" button shares the same aria-label suffix (`routeDetailsOpenHint`), so the click is scoped to the named candidate's own `<li>` via `within(screen.getByText(siteName).closest("li"))`.

**Candidate-identity collision fix:** the candidate's own site name legitimately appears twice inside an opened modal (the heading, and `RouteCompareTable`'s column header) — identity assertions use the first DOM-order occurrence (the heading), not a bare `getByText` that would throw on multiple matches.

## Red/green proof (G6/C)

1. Ran the new suite against the **fixed** code first: **15/15 passed.**
2. Temporarily reverted *only* the behavioral line (`getEscapeSuggestion(detailsCandidate, displayDecisionLower)` → `getEscapeSuggestion(detailsCandidate)`), leaving the corrected comment in place, and reran:
   **7 failed / 8 passed** — exactly the predicted set: the four B cases, the added IS-literal B case, the C sanity test, and D's canonical-stay case all failed; A, E, D's raw-move case, and both G6 controls stayed green, matching G6's own prediction exactly ("Expected red: the four B cases and the canonical-stay cases of D. Expected green pre-fix: A, E, the raw-move cases of D, and the controls.").
   Inspected one failure directly: `expected <div>🚐 Escape the storm</div> to be null` — a genuine logical failure (the bug's own symptom), not a setup/crash failure. Not an invalid red stage.
3. Restored the fix and reran: back to **15/15 passed**, plus `RoutePlannerCard.test.jsx` (unchanged) + `RoutePlannerCard.caution.test.jsx` (unchanged) + `RoutePlannerDetailsModal.test.jsx` together: **4 files, 77 tests, all passing.**

## Validation (after the final edit)

```
npm run test:run   → 182 test files, 2676 tests — all passing (181→182, 2661→2676, exactly +15/+1 file, nothing deleted; no App.affiliateHolder flake this run)
npm run lint       → clean, zero errors/warnings
npm run build      → succeeded (same pre-existing >500kB chunk-size advisory, unrelated)
```

## Scope audit

`git status --short`: `docs/ai/CURRENT.md` (pointer), `src/components/RoutePlannerCard.jsx` (the fix), `src/components/RoutePlannerCard.canonicalTone.test.jsx` (new, the only new file), `docs/ai/tasks/ticket-441/` and `outputs/ticket-441-browser-evidence/` (workflow/evidence artifacts). `git diff --stat` shows **zero** changes to `RoutePlannerCard.test.jsx`, `RoutePlannerCard.caution.test.jsx` (both byte-identical, G7), `comparisonUtils.js`, `useComparisonState.js`, `routePlannerSummary.js`, `relocationEngine.js`, `relocationService.js`, `scoring.js`, `RoutePlannerDetailsModal.jsx`, `translations.routePlanner.js`, `package.json`, `package-lock.json`. No new dependency. No scoring, threshold, route-risk, ranking, selection, entitlement, analytics-semantics, Weather Voice, or translation change.

## Browser evidence (live, production preview build)

`outputs/ticket-441-browser-evidence/` — 2 screenshots (`positive-control-{1280,320}.png`), mocked `/api/forecast`/`/api/campsites`/`/api/me` (same recipe proven in ticket-436), **real, unmocked `useComparisonState`/`comparisonUtils` wiring from `App.jsx`** (unlike the component-test suite, `comparisonState` here is not injected — it's computed live from the mocked forecast data). Confirmed live: the modal opens, and — matching G1 exactly — shows only the title (`🚐 Escape the storm`), the conditional base-window line, and the calmer-nearby sentence; never a body or destination line. Both screenshots visually inspected.

**Limitation, reported honestly per the prompt's own instruction:** I did not attempt the canonical-stay-**override** scenario (comparisonState downgrading a raw move/consider to stay) live. Reliably engineering a live dataset where the real scoring engine (`relocationEngine.js`, weighted, shelter/season-aware) favors "move" while the real raw-metric comparison (`comparisonUtils.js`, independently thresholded on wind/rain/temp against *different*, unweighted fields) simultaneously disagrees requires precise numeric calibration against two separately-tuned formulas — attempting it inside this narrow ticket's scope risked turning a regression check into an open-ended data-engineering exercise. The override scenario is instead covered by the component-test suite (group B, D-stay, G6), which renders the real `RoutePlannerCard`/`RoutePlannerDetailsModal` with `comparisonState` passed exactly as `App.jsx` passes it (same prop, same shape) — **not** claimed as live production evidence, consistent with the prompt's explicit instruction not to conflate the two.

## Residual scope limitation (Jonesy N2 — restated as required)

Option A removes only the escape-suggestion block when the canonical card tone is stay. The modal's **other** candidate-driven content — day counts, the "Overall result" verdict pill (`getOverallVerdict`, driven by that candidate's own `aggregateType`/day counts), hazard-block text — is unchanged and may still read positively for a candidate whose card-level tone is stay. This report does not claim the October 14 meeting example was reproduced, nor that this narrow fix resolves every possible cause of #441. No candidate-specific tone model, copy rewrite, follow-up issue, or GitHub closure is proposed or authorized here.

## Deviations

None. Implementation matches the approved prompt and all of G1–G8 exactly; no STOP condition triggered.

## Lifecycle

No commit, push, deployment, production mutation, or GitHub issue/comment/closure/Project change was performed. `CURRENT.md` set to `CC_COMPLETE`. Per the workflow: owner sends "CC búinn" to Jonesy next for result review, then Ripley's final assessment; owner controls any subsequent commit/push and explicit post-push closure decision.
