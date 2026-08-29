# Approved Prompt v1 — Ticket 396 (Skýra muninn á „færa sig“ og „íhuga“)

Implement GitHub issue #396 as a focused presentation and comprehension improvement to the canonical homepage recommendation. Make `move` unmistakably stronger than `consider`, preserve the meaning and behavior of `stay`, and leave all scoring/recommendation logic unchanged.

## 1. Mandatory preflight audit

Before editing, read the issue and inspect at minimum:

- `CLAUDE.md`, especially **Canonical Decision Tone**, **Homepage Canonical Decision Surface**, and **Free/Pro Gating — Forecast Data Rule**;
- ticket #395's approved prompt, CC report, and result review;
- `src/components/HomeDecisionCard.jsx` and its tests;
- `src/lib/routeVerdictMeta.js`, `src/lib/routePlannerSummary.js`, `src/hooks/useComparisonState.js`, and `src/lib/comparisonUtils.js`;
- relevant `RoutePlannerCard` expanded-result copy/CTA rendering and tests;
- `src/i18n/translations.routePlanner.js` and translation composition;
- `src/lib/researchQuiz/scenarios.js`, its tests, `src/pages/DecisionQuizResearch.jsx`, and the research answer/scoring modules used for the #395 baseline.

Document in `cc-report.md` which rendered surfaces can present canonical `stay` / `move` / `consider`, which is the primary homepage decision, whether any secondary surface would contradict the revision, and the interpretation of the candidate-visible `stay` edge case described below.

This ticket is presentation-only. Do not change scoring thresholds, candidate selection, route-planner verdicts, comparison direction, forecast inputs, entitlement behavior, or analytics semantics. If satisfying the ticket requires such a behavioral change, STOP before implementation and report the concrete conflict.

## 2. Canonical semantic contract

The final rendered recommendation must immediately communicate:

- **Move:** weather elsewhere is sufficiently better that the product recommends seriously considering a move now. This is the strongest action signal and must not read like a neutral invitation to browse.
- **Consider:** weather may be somewhat better elsewhere, but the difference is **not sufficient for the product to recommend moving**. The user should compare or monitor conditions, not interpret this as an immediate relocation recommendation.
- **Stay:** retain the existing meaning and behavior unless a minimal copy adjustment is strictly necessary for parallel structure. Do not weaken current comprehension.

Do not use vague phrases such as “better option” / “betri kostur” or “slightly better option” / “örlítið betri kostur” on active recommendation surfaces unless the sentence explicitly says that **weather** or **weather conditions** are better. Apply this to locked Free copy, Pro copy, supporting reason copy, CTA text, and any actively rendered secondary recommendation surface in scope.

Avoid overstating certainty: `consider` must remain hedged, and `move` must remain a forecast-grounded recommendation rather than a safety command or guarantee.

## 3. UI scope and hierarchy

Update the canonical `HomeDecisionCard` so `move` and `consider` differ through words and visual hierarchy, not color alone:

- heading/title;
- primary recommendation body;
- supporting reason line where shown;
- locked Free primary CTA and candidate-visible Pro CTA;
- a concise text cue, badge, icon treatment, emphasis level, or equivalent accessible signal identifying recommendation strength without relying only on emerald/amber color.

`move` receives stronger visual/action emphasis. `consider` looks intentionally secondary and exploratory. Preserve the compact mobile-first card and UX guardrails; do not create a dashboard, add above-fold controls, or introduce decorative complexity.

CTA semantics follow the final canonical displayed tone:

- `move`: action-oriented wording supporting inspection of why moving is recommended or examination of the recommended better-weather location;
- `consider`: compare, inspect, or monitor wording that does not claim relocation is recommended;
- `stay`: unchanged behavior and no new move-oriented CTA.

Do not expose hidden candidate identity to Free users. Do not change gating, upgrade attribution, checkout source, candidate visibility, or event payload meaning.

Review `RoutePlannerCard` only for contradictions when details are explicitly expanded. Make the smallest copy/presentation adjustment needed if it would otherwise conflict. Do not redesign it or make it compete with `HomeDecisionCard`.

### Candidate-visible CTA precedence

For the candidate-visible secondary CTA in `HomeDecisionCard`, the final canonical displayed `model.tone` fully controls copy for `move` and `consider`. Drop the existing `comparisonState.tier`-based `icCtaView` / `icCtaCompare` selection for those two tones only. Do not combine tone and tier into one string or allow tier to alter the canonical recommendation.

- `move` + any candidate-visible tier: the same move-specific CTA;
- `consider` + any candidate-visible tier: the same consider-specific CTA;
- `stay`, including `similar` and `current_better` overrides: preserve existing behavior and introduce no candidate/move CTA. If the pre-existing fallback can render a generic candidate comparison CTA while canonical tone is `stay`, retain its existing tier-based `icCtaView` / `icCtaCompare` behavior; do not convert it into move/consider wording. Restate the audited interpretation in `cc-report.md`;
- tier may continue driving existing details, reason availability, and analytics fields, but not move/consider CTA semantics.

Introduce dedicated IS/EN keys for the two candidate-visible tone meanings, such as `decisionMoveCandidateCta` and `decisionConsiderCandidateCta`, in the route-planner translation module. Do not repurpose generic `icCtaView` / `icCtaCompare` keys and do not add fallback literals in JSX. The button keeps its existing comparison-section behavior; this authorizes copy selection only, not a new route/action.

## 4. Internationalization and accessibility

Add or update genuine English and Icelandic translation keys in existing i18n files. Do not hardcode new user-facing copy in JSX or rely on English fallback strings for new behavior.

Both languages preserve equal semantic strength. In Icelandic, prefer clear practical weather language such as “betra veður”, “rólegra”, “þurrara”, or “hlýrra” where supported; avoid unexplained “betri kostur”.

Make strength available to assistive technology and understandable without color. Preserve semantic buttons, visible focus, contrast, dark mode, narrow-mobile wrapping, and reduced-motion behavior. Add no dependency.

## 5. Research validation boundary

Keep the #395 research page and frozen scenarios wired to the real `HomeDecisionCard`; do not create duplicate mock UI or change scenario answer keys/raw verdicts. Update focused scenario tests to prove the revised real card renders intended wording and distinct CTAs, while the diagnostic raw-`move` → canonical-`stay` fixture remains `stay`.

Do not fabricate participant results or claim human comprehension improved from automated tests. Repeated user testing is a post-implementation human validation step owned by Róbert. In `cc-report.md`, give the exact existing research route/flag and a concise checklist for rerunning the same/comparable three-scenario test and recording issue #396 results against:

- `stay`: 92.6%;
- `consider`: 77.8%;
- `move`: 55.6%;
- all three correct: 40.7%;
- 10/27 interpreted `move` as `consider`;
- 13/27 chose immediate relocation for `consider`.

## 6. Required targeted tests

Prove at minimum:

1. Free `move` renders stronger recommendation wording and an action CTA distinct from `consider`;
2. Free `consider` explicitly states that better weather is not enough to recommend moving and uses exploratory/monitoring CTA semantics;
3. candidate-visible CTA matrix: `move` + low tier and `move` + high tier render the same move key; `consider` + low tier and `consider` + high tier render the same consider key; the two tone keys differ and none falls back to `icCtaView` / `icCtaCompare`;
4. both tones have non-color accessible/text strength cues and distinct visual emphasis;
5. revised active copy has no vague “better option” / “betri kostur” without a weather qualifier;
6. candidate identity remains absent from Free DOM/accessibility output;
7. `stay`, `similar`, and `current_better` rendering/CTA behavior remains unchanged, including any audited generic fallback comparison CTA;
8. raw-verdict and canonical-tone analytics retain event names, firing rules, and payload semantics;
9. EN/IS keys are complete and candidate-name interpolation remains correct;
10. all #395 research scenarios render the real canonical card with unchanged identities and answer keys.

Run targeted `HomeDecisionCard`, research-scenario, i18n, and affected `RoutePlannerCard` tests; then the full Vitest suite, lint, and production build. Record exact commands/outcomes. Do not weaken tests, lint, coverage, or analytics assertions.

## 7. Acceptance criteria

- `move` and `consider` have clearly different wording, CTA semantics, and non-color visual/accessibility cues.
- `move` reads as the stronger recommendation because meaningfully better weather was identified.
- `consider` explicitly says potentially better weather is not enough for the product to recommend moving.
- Active recommendation copy has no unqualified “better option” / “betri kostur”.
- Free and Pro CTAs follow displayed tone; `consider` never claims a definitively better place was found or recommends immediate relocation.
- Candidate-visible move/consider CTA copy is tone-only across all tiers; generic stay fallback behavior remains intact.
- Free candidate non-disclosure, entitlements, upgrade attribution, checkout, and analytics semantics remain unchanged.
- `stay`, `similar`, and `current_better` do not regress.
- No scoring, recommendation, forecast, candidate-selection, or data-flow changes.
- IS/EN, accessibility, themes, and mobile readability are preserved.
- The #395 research route remains usable and `cc-report.md` documents the human follow-up without inventing results.
- Targeted tests, full suite, lint, and build pass.

## 8. Out of scope

- Scoring thresholds, recommendation calculation, normalization, candidate selection, radius rules, or engine changes.
- Free/Pro entitlement or forecast-data changes.
- Checkout/payment changes or new analytics events/renamed payload semantics.
- New research backend/questions, changed answer keys, or fabricated results.
- Homepage redesign, new page/dependency, TypeScript, or `.tsx`.

## 9. STOP conditions

STOP before implementation and report if:

- a scoring/recommendation/data-flow change is required;
- the primary tone conflicts with another authoritative active surface and resolution exceeds small copy alignment;
- distinct Pro CTAs require a new navigation/action flow;
- candidate non-disclosure, entitlement, checkout attribution, or analytics semantics must change;
- the real #395 scenarios cannot remain connected to `HomeDecisionCard` without changed answer keys/data semantics;
- the solution requires broader redesign, backend work, a dependency, or other out-of-scope work.

## 10. Workflow and git safety

Follow `.jsx`, extensionless import, centralized i18n, Tailwind, and existing test conventions. Preserve unrelated changes. STOP for approval rather than broaden scope.

Write `cc-report.md` with the audit, changed files, exact copy/visual/CTA mapping by tone and tier, confirmation computation/data flow is unchanged, stay-edge interpretation, exact test results, research rerun checklist, deviations, and remaining risks. Do not commit or push. Follow all required `CURRENT.md` transitions during CC execution.
