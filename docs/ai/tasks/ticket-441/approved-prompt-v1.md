# Ticket #441 — Approved implementation prompt v1

Created by Ripley: 2026-10-18.
Owner approved option A; Jonesy APPROVED Round 1 with conditions G1–G8.

## Execution authority and precedence

This is the reviewed execution specification. CC may execute it only after the owner sends `Prompt approved` and CURRENT.md identifies this file at READY_FOR_CC. Verify state, set CC_IN_PROGRESS before work, then populate cc-report.md and set CC_COMPLETE after execution. No commit/push/deploy or GitHub/Project mutations are authorized.

The Round 1 scope below is included intact for auditability. Its historical statements about awaiting review are superseded by this header. Jonesy's G1–G8, copied verbatim below, override every conflicting Round 1 assertion: the modal renders title and calmer-nearby sentence, not suggestion body/destination; use the actual portal container, not role=dialog; preserve selected-candidate identity through modal heading and discriminating eligibility tests; use result.explain.base.windowDays and fresh baseline counts. All remaining Round 1 boundaries and STOP rules apply. Do not execute the prompt-review discussion file independently.

## Residual scope limitation (Jonesy N2)

Option A removes only the escape-suggestion block when the canonical card tone is stay. Candidate-driven modal day counts and overall verdict pill remain unchanged and may still read positively. Document that residual in cc-report.md. Do not claim this proves the meeting example reproduced or the entire issue resolved; any post-push GitHub closure decision belongs to the owner after review. No candidate-specific tone model, copy rewrite, new follow-up issue or closure is authorized here. The other non-blocking notes remain: injected hooks/summary are controlled tests rather than live production evidence; preview cannot open the modal; the existing title emoji is unchanged.

## Reviewed Round 1 specification (historical review-status clauses superseded)

## Round 1 — Ripley — 2026-10-18

Status: ready for Jonesy prompt review; discussion material only, not an execution prompt.

### Owner decision and evidence

Róbert explicitly approved option A in the Ripley chat on 2026-10-18 ("Ok ég samþykki þetta"). This clears the reported investigation STOP boundary for this narrow proposed correction, not for scoring changes or immediate CC execution. Jonesy must review this prompt; Ripley then creates an approved-prompt-vN.md and sets READY_FOR_CC before CC may execute.

Live issue #441 was read with its complete body and comments (none) on 2026-10-18: "Rannsaka mótsögn „betri aðstæður“ og lakara mat". It requests reproduction and root-cause documentation, canonical tone/data-flow, stay/consider/move/similar coverage in the same time window, and prohibits unapproved scoring, meteorological threshold or provider/model changes. The meeting observation is paraphrased, not formal endorsement by Veðurstofa Íslands.

The owner supplied an investigation report: a constructed reproduction identifies a remaining raw-tone call in RoutePlannerCard's details modal; #353 introduced canonical comparison handling but missed this call, while #428 investigated a separate wind/rain scoring question. These historical conclusions and the deleted temporary reproduction test are investigator-reported evidence, not tests independently rerun by Ripley. Do not claim to reproduce the actual October 14 meeting example: its exact inputs are unavailable. Do not reimplement #353 or alter scoring to address #428.

Ripley independently inspected current source: displayDecisionLower downgrades raw move/consider to stay for showComparison=true with direction similar/current_better; the main suggestion already explicitly passes this display tone; the details-modal prop calls getEscapeSuggestion(detailsCandidate) and the helper defaults to raw decisionLower. The helper additionally requires base warnings, a lower candidate warning rank, qualifying delta and no aggregateType=worse. CLAUDE.md's Canonical Decision Tone rule requires recommendation surfaces to use canonical display tone. Initial git status was clean; ticket-441 did not exist. Prior task #436 is CLOSED/PASS locally; its history must remain intact.

### Goal and accepted tradeoff

Make the modal's escape-suggestion eligibility obey the same canonical card tone, while retaining its selected candidate's destination, warning ranks, delta qualification and weather window. When canonical tone is stay, the modal must not urge relocation even if raw engine verdict is move/consider.

Owner-approved option A uses the card-level displayDecisionLower for every details candidate, including a non-best alternative. This is deliberately a shared recommendation gate, not a candidate-specific recommendation model. Do not introduce option B (new per-candidate tone calculation) or infer that all modal data describes the best candidate.

### Allowed implementation

1. In src/components/RoutePlannerCard.jsx, pass the canonical tone explicitly:
   `escapeSuggestion={detailsCandidate ? getEscapeSuggestion(detailsCandidate, displayDecisionLower) : null}`
2. Update the adjacent helper comment that currently says the modal intentionally uses raw tone: explain the approved common gate and continued candidate-specific eligibility/data. Keep the helper signature/default and all body calculations unchanged. All current callers should pass displayDecisionLower explicitly; report the call-site inventory. If another raw caller exists, stop and report rather than silently widen scope.
3. Add focused regression coverage in a new src/components/RoutePlannerCard.canonicalTone.test.jsx. Existing suites can be read and reused as patterns, but do not rewrite their coverage or weaken expectations. Keep the real RoutePlannerCard, real RoutePlannerDetailsModal and real relevant helper logic; hooks/summary may be mocked to inject explicit data. No mocked escape-suggestion output or mocked modal that bypasses its visible content.
4. Write cc-report.md and maintain CURRENT.md according to docs/ai/README.md. Allowed production change is only the prop call and adjacent comment in RoutePlannerCard.jsx; allowed new test is the file above. Workflow artifacts for ticket-441 and CURRENT are allowed. No other application changes.

### Required non-vacuous tests

Use fixed dates and the same base/candidate window for each paired scenario. Set a Pro entitlement so the actual modal is reachable without changing Free/Pro rules. Supply real base warning data as consumed by baseSliceDays, a candidate with lower warning rank, deltaVsBase >= requiredDelta, and aggregateType not worse. Document fixture values and why each helper guard passes. Use real translations for visible modal assertions (scope with within(dialog) or the actual modal's existing accessible container).

A. Positive controls first: with raw move and raw consider and no overriding comparison (showComparison=false), open the candidate through the actual UI and assert the modal is mounted, its candidate-specific heading/destination is correct, and the escape title/body/destination are present. Use the same eligible fixture as the negative cases. Preserve current consider copy; broader wording changes are outside this correction.

B. Regression matrix: raw move/consider × direction similar/current_better with showComparison=true (four cases). Assert card displays canonical stay; click the named candidate's details trigger; positively assert dialog/container and selected candidate content exist; then assert the escape block's literal translated title and relocation body are absent within that mounted modal. Do not use absence checks on an unopened modal or empty render. Where possible compare against A by changing only comparisonState.

C. Show regression sensitivity before the fix: run the new suite against unchanged production code and record the expected failure of the four negative cases because the escape title is present. Positive controls must pass. Then apply the minimal fix and rerun; all pass. An unrelated setup failure is not a valid red stage. Leave permanent tests in the repository, do not delete the reproduction.

D. Non-best alternative: provide at least two distinct, eligible candidates in top3; explicitly open the second candidate. Under canonical stay, its dialog is mounted with its own name and no escape block. Under unoverridden move, its escape destination refers to that second candidate, not best. This pins option A's accepted gate/data distinction.

E. Boundaries: raw stay with an otherwise eligible candidate remains without escape; no comparison/no candidate path renders without crashing and does not fabricate a modal/suggestion. Include missing-data candidate (no qualifying delta or absent warning data) under raw move: modal positively opens but no suggestion; its separate fully eligible positive control must still show the suggestion. No new fallback causes or data synthesis. Do not alter direction classification or missing-data policy to make tests pass.

Assertions must establish the actual selected candidate and opened modal, not merely existence somewhere on the page. Avoid dictionary-only tautologies for the recommendation outcome: assert expected literal visible title/copy for the chosen test language and the canonical stay headline; translation lookup for setup is fine.

### Validation and report

- Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT and the eventual approved prompt before execution. Preserve unrelated work if the checkout has changed.
- Capture baseline git status and changed paths; do not require deleting or reverting another actor's work. Stop on conflicting changes to the target call or active workflow.
- Record red/green commands and counts for the new suite. Then run the new suite plus RoutePlannerCard.test.jsx, RoutePlannerCard.caution.test.jsx and RoutePlannerDetailsModal.test.jsx.
- After the final edit run npm run test:run, npm run lint and npm run build. Record exact counts/exit results, distinguish a pre-existing flake from new failures with evidence, and do not change unrelated tests/app code to get green.
- Inspect the actual UI at a mobile and desktop width with an eligible control and canonical-stay override if a controllable browser setup is available. If not, report the limitation honestly; do not call mocked-hook tests live production evidence. No need for a new browser harness or broad screenshot matrix.
- In cc-report.md record root cause, the constructed reproduction's limits, A's accepted tradeoff, selected-candidate identity checks, caller inventory, changed files, protected-file diff check and all validation/remaining risks. Do not claim the meeting observation or all of #441's possible causes are exhaustively proven by this narrow fix.

### Protected boundaries and STOP conditions

No changes to scoring, thresholds, route-risk computation, ranking, selection, comparisonUtils/useComparisonState, routePlannerSummary, relocationEngine/service, weather data/time windows/providers, analytics event semantics, Weather Voice, translations, Free/Pro entitlements, or other #436–#450 work. Preserve raw diagnostic events and all existing data calculations. No dependency additions, refactors, alternate recommendation model or copy rewrite.

STOP and report if reproduction fails under an eligible fixture, the suspected call is already fixed, a passing result requires changing candidate/window/scoring data in production, a different cause is found, option A cannot preserve selected-candidate identity, or implementation requires additional production files. Do not broaden the task automatically. New unrelated issues go into the report only.

No commit, push, deploy, GitHub comment/closure or Project changes. CURRENT CLOSED is local workflow state only. After CC execution: Jonesy result review, then Ripley final assessment; owner controls subsequent commit/push and explicit post-push closure.

### Jonesy review request

Review this Round 1 against live code, especially: real baseSliceDays fixture wiring; reachable details triggers under canonical stay; a genuinely opened real modal; a positive control that prevents vacuous absence assertions; red-stage sensitivity; non-best candidate data remaining specific; strict option A boundaries and approved tradeoff. Append APPROVED or REVISE here. Do not implement.


## Binding Jonesy conditions — copied verbatim; precedence as above

### Conditions

- **G1 (what the modal actually renders for the escape block).** `RoutePlannerDetailsModal.jsx` L254–273 renders only: `escapeSuggestion.title`; a base-window line (`routeEscapeStormBaseWindow`) **only if** `baseWindow.hasWindow`; and the `routeEscapeStormCalmerNearby` sentence. It does **not** render `escapeSuggestion.body` or `destinationLine`. All "title/body/destination" assertions in A, B and D must therefore target the literal title and the calmer-nearby sentence: EN `🚐 Escape the storm` and `Calmer conditions may be available nearby.`; IS `🚐 Forðastu óveðrið` and `Rólegra veður gæti verið í nágrenninu.` (the emoji in the title is pre-existing and out of scope). Use the sentence as the primary anchor, the title as the second. Do not assert `routeEscapeStormBody` or the destination line inside the modal.
- **G2 (scoping the real modal).** The modal is a `createPortal` into `document.body` with no `role="dialog"`, no `aria-modal`, no accessible name. `within(dialog)` by role is impossible and production must not be edited to add one. Scope instead to the direct child of `document.body` that contains the button `aria-label="Close modal"` (e.g. `Array.from(document.body.children).find((el) => el.contains(screen.getByLabelText("Close modal")))`). Assert before the click that `queryByLabelText("Close modal")` is null (unopened), and after the click that it is present and that candidate-specific content is inside that scope. Do not use CSS class selectors. The card also renders its own escape block under raw `move`, so every presence/absence assertion about the modal must be scoped to this container.
- **G3 (reaching the trigger).** Set a Pro entitlement and first click the card's expand control (`travelAdvisorShowDetails`, as `expandVerdict()` does in `RoutePlannerCard.caution.test.jsx`) because the alternatives list is behind `resultsExpanded`. Every row's details button has the same label, so scope the click to the named candidate's `<li>` (e.g. `within(screen.getByText(<siteName>).closest("li"))`) and assert which row was used.
- **G4 (non-best candidate: replace the destination claim).** Because the modal renders no destination (G1), D cannot assert "escape destination refers to the second candidate". Replace with: (i) the opened modal's own heading/name content belongs to the second candidate and not to `best` (CC determines how the modal's `title` is composed and asserts accordingly, inside the G2 scope); (ii) a discriminating eligibility case under raw `move`: best is eligible, the second candidate is ineligible through its own fields (e.g. `deltaVsBase < requiredDelta`, or `hasHighWarning`/`hasWarning` rank not below the base rank) — opening the second shows no escape block while opening the best does; (iii) under canonical stay neither shows it. This pins the accepted gate/data distinction of option A.
- **G5 (fixture wiring, avoiding vacuous absence).** The card derives `baseSliceDays` from `result.explain.base.windowDays` sliced by the card's `windowDays` state (default `windowDaysDefault` = 3), not from `candidate.windowDays`; `candidateRank` comes from the candidate's `hasHighWarning`/`hasWarning` flags. The mock `result` in `RoutePlannerCard.caution.test.jsx` has no `explain`, which gives `baseRank = 0` and a null suggestion, so absence assertions built on it would pass vacuously. The shared eligible fixture must: put at least one base day with a `warnings` entry (`level: "high"` or `"warn"`) inside the first 3 days of `result.explain.base.windowDays`; use a candidate whose flags give a lower rank than the base; have `deltaVsBase >= requiredDelta` (both numbers); and use `aggregateType` other than `"worse"`. Document each value and the guard it satisfies. Positive control A (modal shows the G1 anchors) must pass before any negative case is considered meaningful. Optionally assert the base-window line when the fixture produces `hasWindow`; CC verifies `getRoughWeatherWindowFromDays` before relying on it.
- **G6 (red/green precision and gate controls).** Record per test the expected pre-fix result. Expected red against unchanged production: the four B cases and the canonical-stay cases of D. Expected green pre-fix: A, E, the raw-move cases of D, and the controls below. Add two controls that show the gate keys on `showComparison && direction in {similar, current_better}`: (a) `showComparison: false` with `direction: "similar"` still shows the block; (b) `showComparison: true` with a direction that does not downgrade still shows it (CC reads the real direction values from `HomeDecisionCard.jsx`/the comparison source; do not invent one). A red stage that fails for setup reasons (missing `explain`, modal not mounted, wrong scope) is invalid.
- **G7 (counts and protected tests).** Capture the fresh baseline `npm run test:run` counts before editing (last known from #436: 181 files / 2,661 tests, attributed to CC) and report the final delta as exactly the new file's tests plus one file, with nothing removed. `RoutePlannerCard.test.jsx` and `RoutePlannerCard.caution.test.jsx` must remain byte-identical; report the diff check.
- **G8 (comment and caller inventory).** The comment above `getEscapeSuggestion` (L848–851: "toneLower defaults to the raw engine verdict (used by the details modal…)") becomes false and must be corrected as Ripley states. Keeping the default parameter is accepted (a required parameter would be safer against a future raw caller but changes the signature, which the prompt forbids); the report lists every call site found by a repo-wide search of `src/` (my staged copy shows exactly L948 and L1621), and CC stops if another raw caller exists, as the prompt already says.

