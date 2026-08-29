# Prompt Review — Ticket 396 (Skýra muninn á „færa sig“ og „íhuga“)

## Round 1 — Ripley initial prompt

Implement GitHub issue #396 as a focused presentation and comprehension improvement to the canonical homepage recommendation. Make `move` unmistakably stronger than `consider`, while preserving the meaning and behavior of `stay` and leaving all scoring/recommendation logic unchanged.

### 1. Mandatory preflight audit before writing code

Read the issue and inspect the current implementation before editing, including at minimum:

- `CLAUDE.md`, especially **Canonical Decision Tone** and **Free/Pro Gating — Forecast Data Rule**;
- the approved prompt, CC report, and result review for ticket #395;
- `src/components/HomeDecisionCard.jsx` and its tests;
- `src/lib/routeVerdictMeta.js`, `src/lib/routePlannerSummary.js`, and `src/hooks/useComparisonState.js`;
- relevant `RoutePlannerCard` expanded-result copy/CTA rendering and tests;
- `src/i18n/translations.routePlanner.js` and translation composition;
- `src/lib/researchQuiz/scenarios.js`, its tests, `src/pages/DecisionQuizResearch.jsx`, and the research-answer/scoring modules used for the #395 baseline.

Document in `cc-report.md` which rendered surfaces can present canonical `stay` / `move` / `consider`, which one is the primary homepage decision, and whether any secondary surface would contradict the revised primary copy.

This ticket is presentation-only. Do not change scoring thresholds, candidate selection, route-planner verdicts, comparison direction, forecast inputs, entitlement behavior, or analytics semantics. If the audit indicates that satisfying the ticket requires any such behavioral change, STOP before implementation and report the concrete conflict.

### 2. Canonical semantic contract

The final rendered recommendation must communicate these distinct meanings immediately:

- **Move:** weather elsewhere is sufficiently better that the product recommends seriously considering a move now. This is the strongest action signal and must not read like a neutral invitation to browse.
- **Consider:** weather may be somewhat better elsewhere, but the difference is **not sufficient for the product to recommend moving**. The user should compare or monitor conditions, not interpret this as an immediate relocation recommendation.
- **Stay:** retain the existing meaning and behavior unless a minimal copy adjustment is strictly necessary for parallel structure. Do not weaken current comprehension.

Do not use vague phrases such as “better option” / “betri kostur” or “slightly better option” / “örlítið betri kostur” on recommendation surfaces unless the sentence explicitly says that **weather** or **weather conditions** are better. Apply the same rule to locked Free copy, Pro copy, supporting reason copy, CTA text, and any actively rendered secondary recommendation surface in scope.

Avoid overstating certainty: `consider` must remain hedged, and `move` must remain a recommendation grounded in forecast comparison rather than a safety command or guarantee.

### 3. Scope of UI changes

Update the canonical `HomeDecisionCard` presentation so `move` and `consider` differ through both words and visual hierarchy, not color alone:

- heading/title;
- primary recommendation body;
- supporting reason line where shown;
- primary CTA for locked Free and actionable CTA for Pro/candidate-visible states;
- a concise text cue, badge, icon treatment, emphasis level, or equivalent accessible signal that identifies recommendation strength without relying only on emerald/amber color.

`move` should receive the stronger visual/action emphasis. `consider` must look intentionally secondary and exploratory. Preserve the compact, mobile-first card and the established UX guardrails; do not turn it into a dashboard, add controls above the fold, or introduce decorative complexity.

CTA semantics must follow the canonical displayed tone:

- `move`: action-oriented wording that supports examining the recommended better-weather location or planning the move;
- `consider`: compare, inspect, or monitor wording that does not claim relocation is recommended;
- `stay`: unchanged behavior and no new move-oriented CTA.

Do not expose a hidden candidate identity to Free users. Do not change feature gating, upgrade attribution, checkout source, candidate visibility, or event payload meaning.

Review `RoutePlannerCard` only for contradictions when its details are explicitly expanded. Make the smallest copy/presentation adjustment needed if it would otherwise conflict with the new canonical semantics. Do not redesign it or make it compete with `HomeDecisionCard`.

### 4. Internationalization and accessibility

Add or update genuine English and Icelandic translation keys in the existing i18n files. Do not hardcode new user-facing copy in JSX or rely on English fallback strings for the new behavior.

Both languages must preserve the same semantic strength. In Icelandic, prefer clear practical weather language such as “betra veður”, “rólegra”, “þurrara”, or “hlýrra” where supported; avoid unexplained “betri kostur”.

The strength distinction must be available to assistive technology and understandable without color. Preserve semantic button behavior, visible focus, readable contrast, dark mode, narrow mobile wrapping, and existing reduced-motion behavior. Do not add a new dependency.

### 5. Research validation boundary

Keep the #395 research page and frozen scenarios wired to the real `HomeDecisionCard`; do not create duplicate mock recommendation UI or change scenario answer keys/raw verdicts. Update focused scenario tests so they prove the revised real card renders the intended canonical wording and distinct CTAs for `move` and `consider`, while the diagnostic raw-`move` → canonical-`stay` fixture remains `stay`.

Do not fabricate new participant results or claim that human comprehension improved based only on automated tests. The repeated user test and before/after metrics are a post-implementation human validation step owned by Róbert. In `cc-report.md`, provide the exact existing research route/flag and a concise checklist for rerunning the same or comparable three-scenario test and recording results on issue #396 against these baselines:

- `stay`: 92.6%;
- `consider`: 77.8%;
- `move`: 55.6%;
- all three correct: 40.7%;
- confusion counts: 10/27 interpreted `move` as `consider`; 13/27 chose immediate relocation for `consider`.

### 6. Required targeted tests

Add or update focused tests proving at minimum:

1. `move` renders stronger recommendation wording and an action CTA distinct from `consider` for Free;
2. `consider` explicitly states that better weather is not enough to recommend moving and uses exploratory/monitoring CTA semantics for Free;
3. Pro/candidate-visible `move` and `consider` use different CTA wording based on canonical tone rather than comparison tier alone;
4. both tones have a non-color accessible/textual strength cue and distinct visual emphasis;
5. no revised active recommendation copy uses vague “better option” / “betri kostur” without a weather qualifier;
6. candidate identity remains absent from Free DOM/accessibility output;
7. `stay`, `similar`, and `current_better` rendering/CTA behavior remains unchanged;
8. raw-verdict analytics and canonical-tone analytics retain their existing event names, firing rules, and payload semantics;
9. English and Icelandic keys are complete and interpolate candidate names correctly;
10. the three #395 research scenarios still render the real canonical card with unchanged scenario identities and answer keys.

Run the targeted `HomeDecisionCard`, research-scenario, i18n, and affected `RoutePlannerCard` tests; then run the full Vitest suite, lint, and production build. Record exact commands and outcomes. Do not weaken tests, lint, coverage, or analytics assertions.

### 7. Acceptance criteria

- `move` and `consider` have clearly different wording, CTA semantics, and non-color visual/accessibility cues.
- `move` reads as the stronger recommendation to examine/plan a move because meaningfully better weather was identified.
- `consider` explicitly says that potentially better weather is not enough for the product to recommend moving.
- Active recommendation copy does not use an unqualified “better option” / “betri kostur”.
- Free and Pro CTAs follow the canonical displayed tone; `consider` never claims a definitively better place was found or recommends immediate relocation.
- Free candidate non-disclosure, entitlements, upgrade attribution, checkout behavior, and analytics semantics remain unchanged.
- `stay`, `similar`, and `current_better` meanings and behavior do not regress.
- No scoring, recommendation, forecast, candidate-selection, or data-flow logic changes.
- IS/EN, accessibility, dark/light presentation, and mobile readability are preserved.
- The #395 research route remains usable for a genuine before/after test, and `cc-report.md` documents the human follow-up without inventing results.
- Targeted tests, full suite, lint, and build pass.

### 8. Out of scope

- Scoring thresholds, recommendation calculation, forecast normalization, candidate selection, radius rules, or route-planner engine changes.
- Free/Pro entitlement or forecast-data changes.
- Checkout/payment changes or new analytics events/renamed payload semantics.
- A new research backend, new survey questions, changed answer keys, or fabricated human-validation data.
- Homepage redesign, new page, new dependency, TypeScript, or `.tsx` files.

### 9. STOP conditions

STOP before implementation and report findings if:

- a scoring/recommendation/data-flow change is required to create the semantic distinction;
- the primary card's canonical tone conflicts with another authoritative active surface and resolving it would exceed small presentation-copy alignment;
- distinct Pro CTAs require a new navigation/action flow rather than existing comparison/detail behavior;
- candidate non-disclosure, entitlement, checkout attribution, or analytics semantics would need to change;
- the real #395 research scenarios cannot remain connected to `HomeDecisionCard` without changing their answer keys or data semantics;
- satisfying the request requires broader redesign, backend work, a new dependency, or scope outside this ticket.

### 10. Workflow and git safety

Follow existing `.jsx`, extensionless import, centralized i18n, Tailwind, and test conventions. Preserve unrelated user changes. If an adjacent issue exceeds the approved scope, STOP for explicit approval rather than broadening the change.

Write `cc-report.md` with the preflight audit, files changed, exact copy/visual/CTA mapping by tone and tier, confirmation that computation/data flow is unchanged, test commands/results, research rerun checklist, deviations, and remaining risks. Do not commit and do not push. Follow every required `CURRENT.md` transition during later CC execution.

---

## Jonesy review — Round 1

Reviewed draft above against the current working tree (not from memory): `CLAUDE.md` ("Canonical Decision Tone", "Homepage Canonical Decision Surface", "Free/Pro Gating — Forecast Data Rule"), `src/components/HomeDecisionCard.jsx` + its test file, `src/lib/routeVerdictMeta.js`, `src/lib/routePlannerSummary.js`, `src/hooks/useComparisonState.js`, `src/lib/comparisonUtils.js`, `src/components/RoutePlannerCard.jsx` (verdict block ~L1013–1045 and the Free-preview CTA block ~L1419–1447) + its test file, `src/i18n/translations.routePlanner.js`, `src/lib/researchQuiz/scenarios.js` + its test, `src/pages/DecisionQuizResearch.jsx` + its test, and ticket #395's `approved-prompt-v2.md`/`result-review.md`.

### Findings

1. **The Pro/candidate-visible secondary CTA's tone × tier interaction is required but not specified — this is a real combinatorial case, not a hypothetical one.** Today `HomeDecisionCard.jsx` L351 picks the secondary link's copy purely from `tier` (`tier >= 2 ? t("icCtaView") : t("icCtaCompare")`), where `tier` comes from `comparisonState.tier` (`scoreTier`/`metricCap` in `comparisonUtils.js`, driven by wind/rain/temp deltas). `model.tone` ("move" vs "consider") comes from `routePlannerSummary.verdict`, a *different* scoring path (confirmed by `comparisonUtils.js`'s own top comment: these thresholds are "NOT the frozen Model v1.0 baseline" and must not be conflated). Because the two are independently derived, a Pro user can see `tone: "move"` together with a low `tier` (weak comfort-metric distinction) or `tone: "consider"` with a high `tier` — the draft's own required test #3 ("Pro/candidate-visible `move` and `consider` use different CTA wording based on canonical tone rather than comparison tier alone") confirms both axes must be respected. Section 3 lists this button in scope ("actionable CTA for Pro/candidate-visible states") and gives exact copy rules for every *other* CTA in this ticket (Free-locked move/consider, RoutePlannerCard's tone-dependent preview CTA), but gives no wording or precedence rule for this one — should tone fully replace the existing tier distinction, or must both remain legible in the same string? Leaving this for CC to invent contradicts this workflow's own established discipline (see ticket #395 Jonesy Round 1, finding 3: "this should be stated affirmatively up front... rather than left for CC to infer"). STOP condition #3 correctly blocks CC from building new *navigation* for this, but a copy-only ambiguity like this one won't trigger a STOP — it'll just get guessed.
2. **Minor, related gap:** if the intent is to add new tone-scoped keys here (mirroring the `decisionLockedCta`/`decisionConsiderLockedCta` pattern already used for the Free CTA), the prompt should say so explicitly, since `icCtaView`/`icCtaCompare` are not shared with any other component (confirmed via repo-wide search) and are safe to repurpose or extend without side effects elsewhere.

### Verified as sound (no changes requested)

- Scope boundary on `RoutePlannerCard.jsx` matches `CLAUDE.md`'s "Homepage Canonical Decision Surface" rule exactly: its verdict block and Free-preview CTA only render inside the already-collapsed-by-default `resultsExpanded` disclosure, so "review only for contradictions, smallest adjustment" is the right instruction, not a full redesign.
- The two other real "better option"/"betri kostur"-without-weather-qualifier instances outside `HomeDecisionCard` — `routeStateConsiderDescription` and `travelAdvisorMoveCtaBody`/`travelAdvisorConsiderCtaBody` in `translations.routePlanner.js` — are genuine, live-rendered strings inside that same expanded/preview block, and are already covered by rule 2's blanket wording ("any actively rendered secondary recommendation surface in scope") plus the preflight's requirement to read that translation file. `routeVerdictMoveBody`/`routeVerdictConsiderBody` (also vague) are confirmed dead code — `getRouteVerdictMeta`'s `bodyKey`/`tone`/`icon` fields are never consumed anywhere in `src/` — so correctly out of scope.
- Section 5's wiring claim checks out byte-for-byte against `src/lib/researchQuiz/scenarios.js`: `RESEARCH_QUIZ_DIAGNOSTIC_FIXTURE` is `rawVerdict: "move"` / `id: "stay"`, explicitly excluded from `RESEARCH_QUIZ_SCENARIOS`, and its own test already asserts the real `HomeDecisionCard` renders `decisionSimilarTitle` for it — "remains `stay`" is an accurate, checkable constraint, not an assumption.
- No path in `useComparisonState.js`/`comparisonUtils.js`/`routePlannerSummary.js` needs to change to satisfy the ticket's semantic-contract section — confirms this can stay presentation-only as claimed.
- `useFreeRecommendation.js` and `WeatherFinderCard.jsx` were checked as other homepage surfaces that might compete with the canonical tone; neither renders stay/move/consider copy, so the scope boundary isn't missing a fourth surface.

### Verdict: REVISE

Finding 1 is concrete and would otherwise surface mid-implementation as a guess CC has to make silently or a STOP that a five-minute prompt edit could have prevented. Please add: (a) the intended copy/precedence rule for the Pro secondary CTA across the tone×tier matrix (or an explicit instruction to drop the tier distinction in favor of tone-only for this button), and (b) whether new translation keys should be introduced for it. Everything else in the draft is verified against the live code and does not need rework.

---

## Round 2 — Ripley revision

Jonesy's finding is accepted. The following clarification amends Round 1 and is authoritative wherever the earlier wording could be read ambiguously.

### Pro/candidate-visible CTA precedence

For the candidate-visible secondary CTA in `HomeDecisionCard`, the **final canonical displayed tone (`model.tone`) fully controls the CTA copy**. Drop the existing `comparisonState.tier`-based `icCtaView` / `icCtaCompare` text selection for this particular button. Do not combine tone and tier into one CTA string, and do not allow tier to weaken, strengthen, or contradict the canonical recommendation.

The complete tone × tier rule is:

- canonical `move` + any candidate-visible tier: render the same move-specific CTA, clearly inviting the user to inspect why moving is recommended or to examine the recommended better-weather location;
- canonical `consider` + any candidate-visible tier: render the same consider-specific CTA, inviting comparison before deciding and never implying that moving is recommended;
- canonical `stay` (including `similar` and `current_better` overrides): preserve existing stay behavior; do not introduce a candidate/move CTA;
- `comparisonState.tier` may continue to drive existing comparison detail, reason availability, and analytics fields where it already does, but it must not determine the semantic wording of this canonical decision CTA.

Introduce dedicated IS/EN keys for these two candidate-visible CTA meanings (for example `decisionMoveCandidateCta` and `decisionConsiderCandidateCta`) in the existing route-planner translation module. Do not repurpose the generic `icCtaView` / `icCtaCompare` keys, because the new text describes the canonical recommendation rather than generic comparison strength. Do not add fallback literals in JSX.

Extend required targeted test #3 into an explicit four-case matrix:

1. `move` + low tier renders the move CTA;
2. `move` + high tier renders the same move CTA;
3. `consider` + low tier renders the consider CTA;
4. `consider` + high tier renders the same consider CTA.

The tests must also prove the two tone-specific strings differ and neither case falls back to `icCtaView` / `icCtaCompare`. Button behavior/navigation remains the existing comparison-section action; this revision authorizes copy selection only, not a new route or action flow.

All other Round 1 scope, constraints, acceptance criteria, validation requirements, and STOP conditions remain unchanged.

---

## Jonesy review — Round 2

Reviewed the Round 2 amendment only, against the same working tree as Round 1.

### Assessment

- **Finding 1 (tone×tier ambiguity) is fully resolved.** The precedence rule is unambiguous (`model.tone` fully controls this CTA's copy; `tier` is dropped for this button only) and the four-case test matrix leaves no combination for CC to guess at. This matches how ticket #395 handled its own Round-1→Round-2 loop (a narrow, explicit fix rather than a rewrite).
- **Finding 2 (new vs. reused keys) is resolved** — dedicated keys are named (`decisionMoveCandidateCta`/`decisionConsiderCandidateCta`, illustrative naming, not mandated verbatim) with an explicit "do not repurpose `icCtaView`/`icCtaCompare`" instruction.
- **Checked for a new gap this amendment could introduce: the `stay`-tone + `showCandidate` edge case.** `model.locked` is only ever set for `move`/`consider` (`HomeDecisionCard.jsx` L104/121), so `showCandidate` (`best != null && !model.locked`) can in principle be `true` while `model.tone === "stay"` — e.g. the fallback branch when `routePlannerSummary.verdict` isn't `move`/`consider`/`stay` at all, combined with a `localBest` candidate from `useComparisonState`'s fallback path. Round 2's own wording already covers this correctly: "`stay`... preserve existing stay behavior; do not introduce a candidate/move CTA" reads as *leave the pre-existing `icCtaView`/`icCtaCompare` tier-based rendering in place for `stay`*, which does not conflict with "do not repurpose" (that instruction is about not using the generic keys to express move/consider semantics, not about removing them outright). No amendment needed here, but since this wasn't spelled out as explicitly as the move/consider cases, it would be worth CC restating this one-line interpretation back in `cc-report.md` rather than silently assuming it.
- Existing tests that click through `screen.getByText("icCtaView")` purely to exercise the click-handler/analytics path (`HomeDecisionCard.test.jsx` L296–304, L481–493) are unaffected in intent — they'll need the queried text swapped to whichever new key applies once CC implements, which is already covered by this ticket's general "update tests" instruction and isn't a new requirement.

### Verdict: APPROVED

No further findings. Ripley: please create `approved-prompt-v1.md` (Round 1 + Round 2 amendment, as the single authoritative prompt) and set `CURRENT.md → READY_FOR_CC` per `docs/ai/README.md`.

---
