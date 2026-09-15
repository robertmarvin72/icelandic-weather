# #416 — Approved execution prompt v1

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/416

Jonesy APPROVED Round 1 on 2026-09-15. Ripley consolidated the reviewed scope with all three implementation-clarity notes below. This is the sole execution prompt. Do not execute prompt-review.md.

## Workflow

Read docs/ai/README.md and CURRENT.md. Verify READY_FOR_CC and that this file is the referenced approved prompt. Set CC_IN_PROGRESS before implementation. After validation, write docs/ai/tasks/ticket-416/cc-report.md, populate that path in CURRENT.md and set CC_COMPLETE. Do not commit or push.
### Goal

Add consistent, truthful bilingual Northern Lights information to About, PricingInfo and Pricing, preserving page design, prices, plans, checkout, attribution and all feature/scoring behavior. Explain that Free and Pro use the same underlying result and scoring; Pro reveals more information and comparison rather than a better prediction.

### Read-only audit findings

Current checkout at audit: `0e807b65` (#411). No application edits made. These are current local implementation findings, not independent proof of the deployed production revision. CC must confirm production-code provenance before claiming parity with production; do not derive access promises from old ticket descriptions or comments alone.

- `src/config/features.js`: northernLights is a Pro presentation gate with Free preview. Its comment mentions score, but the rendered UI is the authority: do not promise a visible numeric score just because a comment mentions it.
- `src/hooks/useAuroraDecision.js`: same POST `/api/aurora-decision` request with evening/locationIds; no tier argument. `NorthernLightsCard.jsx` derives isPro for presentation; it does not recalculate scores by tier.
- Qualifying-result path: Free sees overall band/guidance and applicable high-wind/stale/partial notices, not the best location name, Pro reason summaries, detailed reasons, ranked list or map. Pro sees the named best qualifying location and reason summaries when available. Expanded Pro details reveal reasons, viewing-window/reference context and qualifying places.
- `src/lib/auroraDisplaySelection.js`: canonical order retained, only excellent/good/fair locations qualify, at most six. Map requires Pro, at least two qualifying locations and at least two distinct bands; it is inside expanded details. Do not promise a map or six places every evening, or all checked places.
- All-poor path: both tiers get cautious guidance. Pro can expand details for one best-available poor location and reasons; it is not a recommendation. No ranked qualifying list or map appears. Unavailable, stale, partial and no-darkness states must not be marketed as guaranteed results.
- `auroraSeason.js`: September-March season. Keep seasonal availability and non-guaranteed sighting language honest. No real-time or exact best-hour promise.
- `About.jsx` currently receives only t, via `<About t={t} />` in App.jsx. It has existing feature/Pro lists and simple headings/paragraphs. PricingInfo has four feature tiles followed by existing plan cards. Pricing has four feature arrays (yearly, monthly, 30-day pass, annual pass), each unlocking Pro; do not list Aurora only under one plan.
- Routes: `/about`, `/pricing-info`, `/pricing` use saved UI language. Only `/en/northern-lights` exists as a standalone Aurora route, and NorthernLightsLanding explicitly forces English. Icelandic Aurora is on the homepage in NorthernLightsCard. No Icelandic standalone route or existing Aurora anchor was found. Do not invent `/is/northern-lights` or link Icelandic readers to the English-only page.

### Approved implementation instructions

1. Before writing code, confirm these findings against current files, the real translation assembly, useLanguage/usePageRouteProps, Aurora classifications/display selection, and existing tests. Record a concise Free/Pro access matrix with source locations in the CC report. Compare local HEAD to the deployed production revision using available read-only deployment evidence. If production cannot be established, report that limitation before claiming production parity; if it differs materially in access, STOP for scope clarification.
2. Use one consistent access description across all three pages, with full detail on PricingInfo and concise summaries elsewhere. Keep every new user-facing string in existing i18n modules and provide IS/EN values. Reuse shared translation keys for identical claims where practical; no new data-driven feature/gating framework.
3. About: add a compact Northern Lights section matching existing typography. Explain activity plus local weather conditions, an assessment for tonight, and that Pro offers reasons and place comparison where available. Include the explicit caveat that good conditions do not guarantee seeing the Northern Lights. Explain shared Free/Pro assessment without implying all users get the detailed place list. Add a localized forecast link.
4. PricingInfo: add a compact Free/Pro explanation within the current structure, not a redesign. Free: evening overview. Pro: named places, reasons and expanded comparison; qualifying-place list and conditional map when results support them. Clearly state the underlying assessment/scoring is the same for both tiers. Include seasonal/data-availability qualification without dumping technical thresholds into customer-facing copy. Do not promise numeric scores, live data, exact timing or a map/list for every result.
5. Pricing: add the same short Aurora Pro-value bullet to all four existing plan feature arrays, e.g. IS `Norðurljós: nánari upplýsingar og samanburður staða`, EN `Northern Lights: details and place comparison`. Add a concise shared-assessment/Free-overview qualification or link to the detailed PricingInfo explanation in the existing design so the bullet does not imply Pro-exclusive basic forecasts. Preserve every price, plan ID, renewal statement, checkout callback and analytics/attribution path.
6. Approved localized entrypoint: EN links use existing `/en/northern-lights`; IS links use `/#northern-lights` targeting the existing Icelandic-capable homepage card. Pass current lang into About with one minimal App.jsx prop change. Add only the necessary stable homepage anchor and minimal reliable hash-scroll handling for asynchronous rendering if required; preserve current language rather than force English. Verify actual navigation from all linked pages, including About-to-home reuse, reload and delayed campsite loading. No new standalone localized page, no forced language-storage mutation, no duplicate Aurora component. Keep an anchor reachable with honest seasonal/unavailable context if the card is absent; do not change its season gate or mount extra requests to satisfy the link. If this cannot be achieved as a narrow presentation/navigation change, STOP and return the specific routing gap before expanding scope.

### Scope and STOP conditions

- Allowed: About/PricingInfo/Pricing presentation, existing translation modules, minimal lang/anchor wiring for the existing homepage Aurora entrypoint, focused tests and evidence. No redesign, new dependencies, backend, new subscription plan or new feature.
- No changes to Free/Pro gates, entitlements, Aurora requests/candidate sets, scoring, ranking, bands, map eligibility, season, recommendation flow, price config, checkout or analytics attribution. Read-only audit must precede any edits near these paths; STOP if actual implementation would reach beyond this scope.
- Preserve existing CTAs, handlers and analytics. New informational links must not initiate checkout, stamp checkout_source, or invent analytics events.
- Preserve unrelated work and previous workflow history. No commit, push, deployment or GitHub issue closure. No production purchase or checkout transaction for testing.

### Acceptance and verification

- All three pages explain Aurora consistently in IS/EN. About explains inputs/tonight/non-guarantee and links to the actual language-appropriate forecast. PricingInfo explicitly distinguishes overview/details/list/map access and same-result/scoring semantics. All four Pro purchase options include the same concise truthful feature claim.
- Use real assembled translations in new page tests, asserting meaningful copy/links and absence of raw missing keys. Preserve existing arrays and other feature descriptions. Verify both language variants, not an identity translator.
- Routing tests must confirm IS destination remains Icelandic and lands at the actual Aurora section, EN uses the forced-English route even with saved IS language, and no dead route/hash or unintended checkout/attribution mutation occurs. Include delayed loading and About-to-home navigation.
- Re-run relevant NorthernLightsCard, landing, display-selection and season tests to establish unchanged presentation gates; use actual Free/Pro qualifying, all-poor and unavailable paths as the access reference. Do not alter those tests to make copy true.
- Re-run PricingInfo and Pricing pass/renewal/upgradeSource/staleSource regressions, relevant AppRoutes/App integration tests, new copy/link tests, lint, build and git diff --check. Run the full test suite once after focused checks. Report pre-existing failures separately.
- Real-browser check all three pages x IS/EN at mobile (~375px) and desktop (~1280px), with light/dark checks. Verify text wrapping, list/card fit, localized navigation, and existing purchase controls. Retain concise labeled screenshots/results. Read hook contracts before fixtures. No live purchase required.
- Report changed files, access audit/provenance, final IS/EN copy, link behavior, commands/results, screenshots and limitations. Do not call local fixtures production verification. Follow README.md transitions: approved prompt only, READY_FOR_CC -> CC_IN_PROGRESS before implementation, then report path + CC_COMPLETE.


## Incorporated Jonesy implementation clarifications (mandatory)

1. The homepage anchor's literal DOM id must be exactly `northern-lights`, matching `/#northern-lights`. Add an assertion on that literal id, as well as actual navigation/scroll checks.
2. Outside the September-March season, the anchor must contain honest localized explanatory content, not an empty div. Suggested IS: `Norðurljósaspáin kemur aftur í september.` EN: `Northern Lights forecasts return in September.` Store the copy in both real translation dictionaries.
3. Place that fallback markup in App.jsx alongside the anchor and existing NorthernLightsCard, outside NorthernLightsCard.jsx. Reuse the existing season predicate read-only for display; do not modify its rule, change the card's null return, introduce a new card prop/branch, mount a duplicate card or cause additional requests.
4. Explicit acceptance test: follow the Icelandic link outside the season (April and August fixtures), assert the exact target id, non-empty correctly localized fallback, successful navigation to that target, and no Aurora request caused by the fallback. In September, assert the original card remains the destination with no off-season message. Preserve delayed-load, reload and About-to-home checks already required above.

## Provenance and report precision

Use available read-only evidence to compare the checkout with production. As in the approved base instructions, inability to establish the deployed revision must be documented and must not be described as verified production parity. A material observed access mismatch requires STOP before proceeding beyond the reviewed scope. Do not treat a stale comment, old ticket or local fixture as production evidence, and do not change live state to obtain verification.

In the final report include the literal anchor id, off-season fixture outcomes, placement of fallback outside the card, and any production-provenance limitation. All original restrictions on prices, entitlement, analytics attribution, checkout and Aurora computations remain in force.
