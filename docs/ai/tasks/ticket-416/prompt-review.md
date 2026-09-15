# #416 — Northern Lights information on About and pricing pages

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/416
Title: Vantar að bæta við norðurljósa spá í um og í pricing síður

## Ripley — Initial prompt, Round 1 (2026-09-15)

Status: ready for Jonesy review; discussion only, not execution authorization.

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

### Proposed implementation instructions

1. Before writing code, confirm these findings against current files, the real translation assembly, useLanguage/usePageRouteProps, Aurora classifications/display selection, and existing tests. Record a concise Free/Pro access matrix with source locations in the CC report. Compare local HEAD to the deployed production revision using available read-only deployment evidence. If production cannot be established, report that limitation before claiming production parity; if it differs materially in access, STOP for scope clarification.
2. Use one consistent access description across all three pages, with full detail on PricingInfo and concise summaries elsewhere. Keep every new user-facing string in existing i18n modules and provide IS/EN values. Reuse shared translation keys for identical claims where practical; no new data-driven feature/gating framework.
3. About: add a compact Northern Lights section matching existing typography. Explain activity plus local weather conditions, an assessment for tonight, and that Pro offers reasons and place comparison where available. Include the explicit caveat that good conditions do not guarantee seeing the Northern Lights. Explain shared Free/Pro assessment without implying all users get the detailed place list. Add a localized forecast link.
4. PricingInfo: add a compact Free/Pro explanation within the current structure, not a redesign. Free: evening overview. Pro: named places, reasons and expanded comparison; qualifying-place list and conditional map when results support them. Clearly state the underlying assessment/scoring is the same for both tiers. Include seasonal/data-availability qualification without dumping technical thresholds into customer-facing copy. Do not promise numeric scores, live data, exact timing or a map/list for every result.
5. Pricing: add the same short Aurora Pro-value bullet to all four existing plan feature arrays, e.g. IS `Norðurljós: nánari upplýsingar og samanburður staða`, EN `Northern Lights: details and place comparison`. Add a concise shared-assessment/Free-overview qualification or link to the detailed PricingInfo explanation in the existing design so the bullet does not imply Pro-exclusive basic forecasts. Preserve every price, plan ID, renewal statement, checkout callback and analytics/attribution path.
6. Localized entrypoint proposal for review: EN links use existing `/en/northern-lights`; IS links use `/#northern-lights` targeting the existing Icelandic-capable homepage card. Pass current lang into About with one minimal App.jsx prop change. Add only the necessary stable homepage anchor and minimal reliable hash-scroll handling for asynchronous rendering if required; preserve current language rather than force English. Verify actual navigation from all linked pages, including About-to-home reuse, reload and delayed campsite loading. No new standalone localized page, no forced language-storage mutation, no duplicate Aurora component. Keep an anchor reachable with honest seasonal/unavailable context if the card is absent; do not change its season gate or mount extra requests to satisfy the link. If this cannot be achieved as a narrow presentation/navigation change, STOP and return the specific routing gap before expanding scope.

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

### Jonesy review focus

Confirm the access matrix against rendered code rather than the stale score comment, conditional map/list wording, equivalent coverage of all four Pro plans, and the minimal Icelandic entrypoint proposal. Decide whether the latter fits the ticket's existing link requirement without broader routing work. Return APPROVED or REVISE; do not implement.


## Jonesy — Initial prompt, Round 1 (2026-09-15)

**Verdict: APPROVED**, with three notes to carry into the approved prompt. This is the most factually accurate initial audit I've reviewed in this workflow so far — every single claim checked out against live code with zero discrepancies, including several subtle ones. Ready to go once the notes below are folded in; none of them are unresolved product questions or factual corrections.

### Audit verified line by line against live code

- **The "stale score comment" claim, confirmed precisely.** `src/config/features.js`'s `northernLights` entry comment says Pro sees "the exact best location, score, reasons, ranked alternatives and map" — but reading the actual rendered output in `NorthernLightsCard.jsx`'s `AuroraResult`, Pro genuinely never renders a raw numeric score anywhere: it shows the named location (`nlBestTonight`), a band label (`auroraBandLabelKey`), reason-summary tiles, the qualifying list (name + band label per row), and a conditional map — no number. Ripley's instruction not to promise a visible score just because a comment mentions one is exactly right, and the "rendered UI is the authority" framing is the correct principle here.
- **Free vs. Pro qualifying-result path, confirmed exactly.** Free gets `visualTokens.bodyKey` (coarse band/guidance text) plus applicable high-wind/stale/partial notices, no name, no reasons, no list, no map, no expand control — just `nlFreeHint` and an upgrade CTA. Pro gets the named location (`t("nlBestTonight").replace("{name}", best.name)`), reason-summary tiles when `selectAuroraReasonSummaries` returns any (correctly hedged "when available" in the audit — the code is a genuine conditional, not always populated), and an expand toggle revealing full reasons, a viewing-window/national-reference caveat, and the qualifying-places list — with the map appearing only inside that same expanded panel, and only when `display.showMap` is true.
- **All-poor path, confirmed exactly**, down to the code's own comments: both tiers get the same cautious headline/body and stale/partial notices; Free gets nothing further ("nothing here would honestly entice an upgrade when no place qualifies" is a literal comment in `AllPoorResult`); Pro can expand to see exactly one best-available poor location plus its reasons, explicitly commented as "never phrased/styled as a recommendation" — no ranked list or map ever appears in this branch, structurally (there's no code path that could render either here).
- **`auroraDisplaySelection.js`, confirmed exactly**: `QUALIFYING_BANDS = {excellent, good, fair}`, capped at six with no backfill, map requires Pro *and* ≥2 qualifying locations *and* ≥2 distinct bands, and is only ever rendered inside the expanded-details panel.
- **`useAuroraDecision.js`, confirmed exactly**: the POST body is only `{evening, locationIds}` — no tier argument anywhere, so "identical request for Free and Pro" is literally true, not just presentationally true.
- **Page/route claims, all confirmed exactly**: `About.jsx` takes only `{t}` and is rendered as `<About t={t} />` inside `App.jsx` (not a dedicated route component) — and `App.jsx` already holds `lang` in scope one line above that call (`const { lang } = useLanguage()`), which is exactly why the proposed prop addition really is minimal. `PricingInfo.jsx` already receives `lang` and has exactly four feature tiles followed by four plan cards (pass30/monthly/passYear/yearly). `Pricing.jsx` has exactly four feature arrays (`featuresYearly`, `featuresMonthly`, `featuresPass30`, `featuresPassYear`), each rendered into its own plan card. `AppRoutes.jsx` confirms only `/en/northern-lights` exists as a standalone Aurora route (no `/is/northern-lights` anywhere in the route list), and `NorthernLightsLanding.jsx`'s own header comment states the forced-English contract explicitly and deliberately ("NOT usePageRouteProps().t... nothing on this route can silently fall back to Icelandic"). The homepage's `<NorthernLightsCard>` render in `App.jsx` has no wrapping element or id around it today — there is genuinely no existing Icelandic anchor to reuse, confirming the "no existing Aurora anchor was found" claim.

### The minimal Icelandic entrypoint proposal (my specific review focus)

This is the right shape for the constraint the ticket sets ("no new standalone localized page"): building a second, Icelandic `NorthernLightsLanding`-equivalent route would duplicate real surface area (forced-language wiring, its own Helmet/canonical setup, login/checkout wiring) just to satisfy a homepage link, when the homepage already has a working, season-gated, Icelandic-capable Aurora card. Anchoring to it is proportionate to what the ticket actually needs.

Three notes on this specific piece, all implementation-clarity rather than scope problems:

1. **The off-season fallback needs its own acceptance-criteria line, not just an implementation instruction.** §6 correctly requires "Keep an anchor reachable with honest seasonal/unavailable context if the card is absent" — I confirmed this is a real scenario, not theoretical: `NorthernLightsCard` returns `null` outright when `!seasonActive` (line 232), so an anchor wrapper with nothing else around it would be an empty, unexplained gap in the page for anyone following the link April-August. The acceptance/verification section's routing-test bullet (§Acceptance point 3) covers scroll/destination/route correctness but never explicitly calls out testing this off-season content state. Please add one: verify the anchor target renders honest "Aurora forecasts return in September" (or equivalent) copy, not a blank div, when the card doesn't mount.
2. **This fallback content should live outside `NorthernLightsCard.jsx`.** Since §6 says "do not change its season gate," the honest unavailable-copy block should be new markup added where the anchor wrapper itself lives (`App.jsx`, alongside the existing `<NorthernLightsCard>` render) rather than by giving the card itself a new prop/branch for its own `!seasonActive` return. Worth stating explicitly so CC doesn't reach for the more tempting one-file edit.
3. **Pin the exact anchor id.** The proposal doesn't say what the DOM element's literal `id` attribute should be. It needs to be exactly `northern-lights` to match `/#northern-lights`, and I'd ask for a test that asserts the literal id string, not just a visual/scroll-behavior check — a mismatched id is an easy, silent way for this whole feature to quietly stop working.

### Everything else

The provenance-checking requirement in step 1 (compare local HEAD to deployed production, STOP if it can't be established or differs materially) is the right call given neither CC nor I have a reliable way to independently verify the live production revision in this workflow — consistent with the standing GitHub/WebFetch limitation already noted in prior tickets. The STOP-rule boundaries correctly wall off scoring, entitlements, Aurora requests, ranking, bands, map eligibility, season, checkout and analytics attribution. The proposed Pricing bullet text (IS `Norðurljós: nánari upplýsingar og samanburður staða` / EN `Northern Lights: details and place comparison`) is appropriately conservative — it doesn't promise a map or a guaranteed list, matching what Pro actually and conditionally gets. Test/evidence requirements (real assembled translations, both languages, all four plans, routing including delayed-load and About-to-home navigation, real-browser matrix) are thorough and consistent with this workflow's established standards.

## Ripley — Approval consolidation (2026-09-15)

Jonesy's verdict is APPROVED and explicitly identifies no unresolved product questions. Created approved-prompt-v1.md with the reviewed scope and all three mandatory clarifications: exact northern-lights id plus assertion, localized off-season content outside NorthernLightsCard in App.jsx, and explicit off-season navigation/content/request tests. CURRENT.md is READY_FOR_CC.

The prior CURRENT.md wording requested an extra owner sign-off for these notes. That additional gate is unnecessary under README.md: Jonesy's approval suffices for creating the approved execution prompt. No application code was changed.

Provenance wording retains the reviewed base distinction: unknown deployed revision is an explicitly reported limitation, while an observed material access mismatch requires STOP. No production parity is inferred from local source.

## Ripley — Correction prompt, Round 2 (2026-09-15)

Status: for Jonesy review only. Final assessment found one semantic defect despite 145 independently passing tests. Preserve the completed v1 implementation except for this bounded correction.

### Problem and evidence

`aboutAuroraBody` in both languages promises chances at the user's campsite. NorthernLightsCard instead requests the fixed AURORA_CANDIDATE_LOCATION_IDS roster, independent of the selected site (see src/config/auroraCandidates.js and the useAuroraDecision call in NorthernLightsCard.jsx). The marketing copy must describe the actual product.

### Proposed exact correction

Change only aboutAuroraBody in the real EN/IS translation blocks:

- EN: `We assess Northern Lights activity together with local weather conditions to evaluate tonight's viewing conditions at the places we check.`
- IS: `Við metum norðurljósavirkni ásamt staðbundnum veðurskilyrðum til að meta aðstæður til norðurljósaskoðunar í kvöld á þeim stöðum sem við skoðum.`

These descriptions do not promise personalized campsite coverage, exhaustive coverage, exact probabilities or guaranteed sightings. Do not expose the technical roster implementation in customer copy.

Add targeted About tests using the real assembled translations: assert both corrected literal strings render and reject the former personalized claims (`at your campsite` / `á þínu tjaldsvæði`) in the Aurora body. Keep existing bilingual links and all other content unchanged.

### Validation and scope

Reread the fixed-roster call path read-only. No changes to candidate sets, selected-site wiring, gating, scoring, requests, pages/layout, price or checkout. Run About and the three other new #416 suites, lint and git diff --check. Inspect refreshed About IS/EN mobile browser screenshots to ensure the longer neutral sentence wraps correctly; no need to repeat the entire unchanged pricing/browser matrix. Append correction commands/results and screenshot paths to cc-report.md, retaining v1 history. Follow the normal approved-v2 execution transitions; no commit/push/deployment.

Jonesy: return APPROVED or REVISE on this narrow correction. No further owner product decision is needed to remove an unsupported claim.


## Jonesy — Correction prompt review, Round 2 (2026-09-15)

**Verdict: APPROVED.** Ripley's finding is real and I missed it in my Round 1 PASS — owning that plainly before the review itself.

### Where I missed it

I checked `aboutAuroraBody`'s existence, its i18n-key correctness, and its rendered layout (via the `about-is-light-mobile.png`/`about-en-dark-desktop.png` screenshots), but I never cross-checked its actual product claim ("at your campsite") against the Aurora request's real candidate-selection mechanism. I had read `useAuroraDecision.js` and `NorthernLightsCard.jsx` during the Round 1 prompt review and confirmed the POST body is `{evening, locationIds}` with no tier argument — but I never opened `src/config/auroraCandidates.js` itself, so I never registered that `locationIds` is a hardcoded six-site roster with zero relationship to whatever campsite the user has selected. That's a straightforward miss on my part, not a hallucinated-file type of error — the defect was sitting in plain text the whole time.

### Independently verified this round

- **The underlying technical claim, confirmed exactly.** `src/config/auroraCandidates.js`: `AURORA_CANDIDATE_LOCATION_IDS` is a fixed array of six specific site IDs (Reykjavík, Vík, Höfn, Egilsstaðir, Þórshöfn, Breiðavík) with an explicit code comment stating they're "used IDENTICALLY for every request regardless of tier or the user's currently selected site." `NorthernLightsCard.jsx` line 112 passes `locationIds: AURORA_CANDIDATE_LOCATION_IDS` straight into `useAuroraDecision` — no `siteId`, no selected-site prop, no derivation from the homepage's chosen campsite anywhere in the component. Ripley's technical claim is exactly right.
- **The defective copy, confirmed exactly.** Re-staged `translations.common.js` (unchanged mtime — no application edits have happened since my Round 1 PASS, consistent with the correction being prompt-only so far) and read the live strings: EN `"...to give you tonight's chances at your campsite."`, IS `"...á líkum kvöldsins á þínu tjaldsvæði."` — both literally claim a personalized assessment of the site the user actually selected, which nothing in the request path can produce.
- **Scope of the defect, confirmed isolated.** Grepped `translations.pricing.js` and `translations.northernLights.js` for `campsite`/`tjaldsvæði` — the only matches are pre-existing, unrelated feature copy (Route Planner, Top 5, comparisons) never touched by this ticket. The new PricingInfo Aurora copy (`pricingInfoAuroraFreeBody`/`ProBody`) makes no site-specific claim at all. This confirms Ripley's correction is correctly scoped to the one string it names — not a partial fix leaving a sibling instance of the same defect elsewhere.
- **The proposed replacement text**, EN "at the places we check" / IS "á þeim stöðum sem við skoðum," accurately describes what the feature does (evaluates a fixed set of places) without exposing the technical roster mechanism and without overcorrecting into a vaguer or less useful claim. It doesn't conflict with the neighboring shared lines (`auroraInfoSameAssessment`, `auroraInfoNoGuarantee`, `auroraInfoSeasonalNote`), none of which make a site-specific claim either.
- **Scope/STOP boundaries**: the correction is explicitly one translation pair plus a negative-assertion test — no touch to `auroraCandidates.js`, gating, scoring, requests, layout, price or checkout, matching every prior STOP condition.

### One addition, non-blocking

The proposed test description says "reject the former personalized claims" — worth being explicit in the approved correction that this should assert the corrected string's exact new text (not just a substring non-match for the old phrase), so a future edit can't silently reintroduce an equivalent site-specific claim phrased differently. Ripley's plan already implies this ("assert both corrected literal strings render"), so this is a one-line emphasis, not a gap — approving without requiring a Round 3 for it.

Ready for the approved-prompt-v2 correction and CC execution.
