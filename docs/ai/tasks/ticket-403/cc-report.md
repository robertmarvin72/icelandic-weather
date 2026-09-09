# CC Report — Ticket 403 (Northern Lights landing page: sell real Pro value)

Executed against: `docs/ai/tasks/ticket-403/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS).

## 1. Mandatory preflight audit

Read before editing: `AGENTS.md` (confirmed a condensed pointer/summary of `CLAUDE.md`, no Northern-Lights/landing-specific guidance of its own — `grep -n "northern\|landing" AGENTS.md` returned nothing; one factual difference noted, `AGENTS.md` correctly names `/api/login-email` where `CLAUDE.md` has the stale `/api/login`, matching what `useLoginFlow.js` actually calls), `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, this approved prompt, `src/pages/NorthernLightsLanding.jsx` (re-read fresh — Ticket 399's final Revision 3 state, `Brand size="full" hideTagline` header), `src/components/NorthernLightsCard.jsx` (re-read fresh — Ticket 401's final state, the `isResultOutcome`-gated stale event), `src/i18n/translations.landing.js` and `translations.northernLights.js`, `src/lib/analytics.js`, `src/lib/checkoutSource.js`, `src/hooks/useCheckoutFlow.js`, and `src/App.jsx`'s homepage `NorthernLightsCard` usage (confirmed unchanged call site: `<NorthernLightsCard t={t} lang={lang} entitlements={entitlements} onUpgrade={startCheckout} theme={theme} />` — no `variant` prop, so it will use this ticket's new `variant="default"` fallback).

### Confirmed audit findings

- `NorthernLightsCard.jsx`'s Free/qualifying branch (`AuroraResult`, `!isPro`) was the single, correct insertion point for the locked-value treatment — confirmed it renders only when `display.hasQualifyingLocations` is true (the `AllPoorResult` branch is structurally separate and untouched) and only for the canonical `success`/`partial` outcomes (`isResultState`).
- `NorthernLightsCard.jsx`'s `handleUpgrade(source)` was the correct single choke-point for the new analytics event — every existing upgrade path (there is exactly one, the Free qualifying CTA) already funnels through it.
- `useCheckoutFlow.js`'s `startCheckout(src)` already accepts and forwards an arbitrary `source` string unchanged into `/pricing?src=...` — no change needed there to support a second, distinct source string for the page-level CTA.
- No existing test file needed to be reverted or its assertions weakened; the only pre-existing test affected was the hero-copy assertion in `NorthernLightsLanding.test.jsx`, which the approved prompt explicitly requires changing (new exact H1/subtitle).

No STOP condition was triggered: no scoring/classification/forecast/candidate change was needed; no entitlement/payment/backend contract changed; no Pro-only data was exposed; the homepage/default card path required no change; `aurora_landing_viewed` was not touched; the existing darkness-reference disclosure (`nlViewingWindowLabel`/`nlNationalReferenceCaveat`) was not touched or removed on any surface; no new dependency was added (only new named imports, `Lock` alongside the already-used `Sparkles`, from the already-installed `lucide-react`).

## 2. Files changed

**New:**
- `src/components/NorthernLightsCard.landingVariant.test.jsx` — 14 tests covering the new `variant="landing"` behavior end-to-end.

**Modified:**
- `src/components/NorthernLightsCard.jsx` — added `variant = "default"` prop (additive, backward-compatible); `handleUpgrade` now also fires `northern_lights_landing_cta_clicked` (placement: `"card"`) when `variant === "landing"`, before the unchanged `northern_lights_upgrade_clicked`; new local `LandingLockedValue` component (receives only `t`/`onUpgrade`, no location data at all); `AuroraResult`'s Free/qualifying branch now branches on `variant` between the new locked-value block and the untouched original `nlFreeHint`/`nlUpgradeCta` block. No other branch, state, or Pro-facing render path was touched.
- `src/pages/NorthernLightsLanding.jsx` — new exact H1/subtitle (via updated translation values, no JSX change needed there); `<NorthernLightsCard>` now passes `variant="landing"`; new Free-only conversion section inserted between the card and "How it works"; new `handleValueSectionCta` firing the same new event (placement: `"value_section"`) then `startCheckout(source)` with the distinct source `"northern_lights_landing_value_section"`.
- `src/i18n/translations.northernLights.js` — added `nlLandingLockedHeading`, `nlLandingLockedBestLocation`, `nlLandingLockedAlternatives`, `nlLandingLockedReasons`, `nlLandingLockedMap`, `nlLandingCtaPrimary`, `nlLandingCtaNote` (EN + IS). These live here (not `translations.landing.js`) because `NorthernLightsCard.jsx` itself needs them for the card-internal locked-value block, and only imports from this file; the page reuses the exact same keys for its own conversion section (one source of truth for the CTA/benefit copy used in both placements, per the approved prompt's explicit "use the same copy in both entry points" instruction).
- `src/i18n/translations.landing.js` — `auroraLandingHeroTitle`/`auroraLandingHeroSubtitle` updated to the prompt's exact required text; `auroraLandingMetaTitle`/`auroraLandingMetaDescription` revised to the WHERE-focused value proposition with no timing claim; new `auroraLandingValueSectionHeading` = "Know where to go tonight" (also the prompt's exact required text). EN + IS.
- `src/pages/NorthernLightsLanding.test.jsx` — hero-copy assertion updated to the new exact text; page-order check extended to include the new conversion section between card and "How it works"; new tests for absence of forbidden timing phrases and the conversion section's content/Free-only-visibility/result-state-independence.
- `src/pages/NorthernLightsLanding.metadata.test.jsx` — description-match regex loosened to match the revised copy's real wording; new test asserting title/description never contain "best viewing time"/"viewing window"/"peak time" and that the title contains "where".
- `src/pages/NorthernLightsLanding.cardWiring.test.jsx` — added a `variant` prop assertion to the existing prop-capture test; new describe block for the value-section CTA (event payload + checkout-source forwarding + non-duplication of the card's own event).

**Confirmed untouched**: `src/App.jsx`'s homepage card usage; `src/lib/auroraDisplaySelection.js`, `auroraDecisionClassify.js`, `auroraVisualState.js`, `auroraBandPresentation.js`, `auroraReasonSummaries.js` (no scoring/classification/verdict logic touched); `src/config/features.js` (entitlement computation); `src/hooks/useCheckoutFlow.js`, `useLoginFlow.js`, `useMe.js`; `src/lib/checkoutSource.js`; `src/components/NorthernLightsMap.jsx`; `AppRoutes.jsx`; every backend/API file; `src/components/Brand.jsx`/`CampaignLandingPage.jsx` (Ticket 399's header fix left as-is). No dependency added. No `.tsx`/TypeScript. Not committed. Not pushed.

## 3. Landing-page hierarchy — exact new copy and order

- **H1 (exact)**: "Find where to see the Northern Lights in Iceland tonight"
- **Supporting sentence (exact)**: "We compare aurora activity and cloud conditions across locations in Iceland to help you decide where to go."
- **Order**: header → hero → live `NorthernLightsCard` (`variant="landing"`) → Free-only conversion section ("Know where to go tonight") → "How it works" → disclaimer → footer. Verified via `compareDocumentPosition` in `NorthernLightsLanding.test.jsx` and directly inspected in the real-browser screenshots (§8).
- **Metadata**: title "Where to See the Northern Lights in Iceland Tonight", description "Compare aurora activity and cloud conditions across locations in Iceland to find out where to go for the Northern Lights tonight." Neither contains "best viewing time," "viewing window," or "peak time" — asserted directly in tests. The shared card's own pre-existing technical darkness-reference disclosure (`nlViewingWindowLabel`/`nlNationalReferenceCaveat`, shown only inside Pro's expanded details) is unchanged on every surface and was not touched by this metadata revision — the metadata prohibition is about *marketing claims*, not that internal technical disclosure, and the two are structurally unrelated (the disclosure isn't in Helmet output at all).

## 4. The locked-value treatment — exact behavior and Pro-data-leak proof

Renders only when `!isPro && variant === "landing" && display.hasQualifyingLocations` (i.e., a genuine `success`/`partial` result with at least one qualifying location) — never in all-poor, no-darkness, unavailable, transport-error, contract-error, or loading states, and never for Pro. The block itself (`LandingLockedValue`) receives **only** `t` and a click callback as props — no `best`, `alternatives`, `display`, or `classification` data reaches it at all, so it is structurally incapable of rendering a Pro-only name, band, reason, coordinate, or map marker, regardless of what the canonical result actually contains. Verified directly: a dedicated test (`NorthernLightsCard.landingVariant.test.jsx`) sweeps `document.body.innerHTML` after rendering a real qualifying fixture and asserts the fixture's location names, coordinates, and reason codes are absent, and that no `role="list"` named `nlQualifyingHeading` (the Pro ranked-list) or map container exists.

The existing headline/body (`nlHeadlineGood`/`nlBodyGood` etc., from the pre-existing shared `auroraVisualState` tokens) is left completely unchanged above the new block — this is the "connect the verdict to the offer using only an already-existing canonical state" the prompt permits; no new state, score, or band was invented.

## 5. Analytics — exact event definitions

`northern_lights_landing_cta_clicked` — fires once per deliberate click, before forwarding to checkout, with `{lang: "en", tier, placement: "card"|"value_section", source}`:
- **Card placement** (`NorthernLightsCard.jsx`'s `handleUpgrade`, only when `variant === "landing"`): `placement: "card"`, `source: "northern_lights_card"` — the same click also still fires the pre-existing `northern_lights_upgrade_clicked` with its established source, unchanged, intentionally (two semantic layers from one click, per the approved prompt).
- **Value-section placement** (`NorthernLightsLanding.jsx`'s `handleValueSectionCta`): `placement: "value_section"`, `source: "northern_lights_landing_value_section"` — this placement never fires the card's own `northern_lights_upgrade_clicked` (it isn't the card's CTA), verified directly.

Both placements forward their exact `source` string unchanged into the existing `startCheckout(source)` → `/pricing?src=...` path — no new entitlement/price/plan/attribution semantics. `aurora_landing_viewed` (name, `{lang, tier}` payload, `loadingMe`-gated timing, exact-once-per-mount ref guard) is completely unchanged — confirmed via the pre-existing test suite re-run unmodified in content (only the file's other, unrelated tests were extended).

## 6. Default (homepage) behavior — proof of zero change

`variant` defaults to `"default"` on both `NorthernLightsCard` and the internal `AuroraResult`. With no `variant` prop supplied (`App.jsx`'s exact homepage call), the Free/qualifying branch renders the pre-existing `nlFreeHint`/`nlUpgradeCta` block verbatim, and `handleUpgrade` never evaluates the new `if (variant === "landing")` branch, so `northern_lights_landing_cta_clicked` never fires. Verified with a red→green proof: I temporarily forced the landing-block branch to always render (`{true ? (...landing...) : (...default...)}`) and reran the "default variant" describe block — all 3 tests failed exactly as expected (missing `nlFreeHint`/`nlUpgradeCta`, present locked-value copy instead). Reverted and reran — all 65 tests across both `NorthernLightsCard.test.jsx` and the new `landingVariant` file passed. This is a real regression-catching proof, not a narrated claim.

## 7. Required tests — status (approved prompt's 10 categories)

All 10 covered:

1. Exact hero copy/order/metadata/no-forbidden-timing-claims — `NorthernLightsLanding.test.jsx` (page-order + forbidden-phrase tests), `NorthernLightsLanding.metadata.test.jsx` (title/description content + forbidden-phrase test).
2. Free qualifying → locked four-part value + CTA + inclusion note — `NorthernLightsCard.landingVariant.test.jsx`.
3. Real fixture names/rankings/reasons/coordinates/map absent from Free locked output — same file, full-HTML sweep test.
4. Pro retains canonical detailed experience, no landing locks/CTAs — same file, Pro describe block (qualifying + all-poor).
5. All-poor/no-darkness/unavailable/transport-error/loading → no misleading conversion claims — same file, dedicated describe block, one test per state.
6. Lower conversion section is Free-only, four truthful value points — `NorthernLightsLanding.test.jsx`'s new conversion-section describe block (Free-visible, Pro-hidden, state-independent).
7. Default/homepage rendering and existing CTA unchanged when variant omitted — `NorthernLightsCard.landingVariant.test.jsx`'s "default variant" describe block, red→green-verified (§6).
8. `aurora_landing_viewed` unchanged, exact-once after resolution including rerenders — pre-existing tests in `NorthernLightsLanding.test.jsx`, re-run unmodified and still green.
9. Each CTA placement emits exactly one `northern_lights_landing_cta_clicked` with the expected payload and forwards the matching source to checkout — `NorthernLightsCard.landingVariant.test.jsx` (card placement) + `NorthernLightsLanding.cardWiring.test.jsx` (value-section placement, both red→green-verified, §"validation" below).
10. Existing card CTA still emits `northern_lights_upgrade_clicked` without a duplicate landing event — `NorthernLightsCard.landingVariant.test.jsx`'s default-variant CTA-click test; and conversely the value-section CTA never fires `northern_lights_upgrade_clicked` — `NorthernLightsLanding.cardWiring.test.jsx`.

Two real test-authoring bugs were caught and fixed while writing the Pro-experience test (not app bugs): (a) `screen.getByText(BEST.name)` failed on the ranked-list `<li>` because React splits `{idx+1}. {loc.name}` into sibling text nodes with no single element whose full text equals just the name — fixed with a `document.body.textContent` substring check; (b) an over-broad `screen.queryByRole("list")` assertion incorrectly flagged the new *generic* 4-bullet `<ul>` (which contains no location data and is fine) as if it were the Pro-only ranked list — fixed by scoping the query to `{ name: "nlQualifyingHeading" }`, the actual Pro list's accessible name.

## 8. Validation — exact commands and results, in the required order

1. **Focused landing/card/analytics tests changed or added** — `npx vitest run src/components/NorthernLightsCard.test.jsx src/components/NorthernLightsCard.landingVariant.test.jsx src/pages/NorthernLightsLanding.test.jsx src/pages/NorthernLightsLanding.cardWiring.test.jsx src/pages/NorthernLightsLanding.metadata.test.jsx src/AppRoutes.test.jsx src/lib/checkoutSource.test.js src/hooks/useCheckoutFlow.analytics.test.js` → **120/120 passed**, 8 files.
2. **Relevant existing NL/routing/checkout-source/analytics tests** — included in the same run above (`NorthernLightsCard.test.jsx`, `AppRoutes.test.jsx`, `checkoutSource.test.js`, `useCheckoutFlow.analytics.test.js`), all unmodified, all green — confirms no regression in shared plumbing.
3. **`npm test -- --run`** → **1110/1110 passed**, 95 files (up from 1089/94 before this ticket — +21 tests, +1 file).
4. **`npm run lint`** → exit 0, no output.
5. **`npm run build`** → succeeded (`✓ built in 7.44s`). Same pre-existing "chunks larger than 500 kB" advisory as every prior run this session, unrelated to this ticket.
6. **Final-diff inspection** — `git status --short` shows exactly the file set in §2, nothing else; manually re-read the full diffs of `NorthernLightsCard.jsx` and `NorthernLightsLanding.jsx` line-by-line (§ above) confirming: no hardcoded user-facing string (every new string goes through `t("...")`), no Pro-only data reachable from the locked-value block, no duplicate/renamed analytics event, no change to any Aurora logic/entitlement/checkout file.
7. **Real-browser visual verification, 390px, light and dark** — started `npm run dev`, stubbed `/api/campsites` and `/api/aurora-decision` via a throwaway Playwright script (same established `page.route()` pattern used throughout this project's e2e specs and prior tickets' verification passes; deleted afterward, nothing added to the repo) with a genuinely qualifying fixture (two locations, `excellent`/`good` bands) at viewport 390×1200, `localStorage.lang="is"` (to also reconfirm forced-English survives). Both themes: `document.documentElement.scrollWidth` measured **390** (no horizontal overflow); both CTA buttons ("card" and "value section", exact text "Show me where to go tonight") present and correctly labeled; keyboard-focusing the card CTA produced a real 2px `box-shadow` ring (`focus-visible:ring-2 focus-visible:ring-emerald-300` applying correctly — `outline-style: none` is expected/intentional, since this app's established pattern removes the native outline in favor of the ring). I directly inspected both screenshots: light theme shows the full intended hierarchy (header logo → new H1/subtitle → dark evening-sky card with lock icon, "Pro shows you:" heading, four bullets, CTA, note → light-surfaced conversion section repeating the same four points and CTA → "How it works" → disclaimer → footer) with no clipping or overlap; dark theme shows the same structure correctly re-themed (page background dark, conversion-section surface adapts, all text remains readable, card's own dark-evening-sky identity is visually distinct from the page background in both themes as established in Ticket 398).

Red→green proofs performed during implementation (not narrated from memory): the default-variant-unchanged guarantee (§6) and the value-section CTA analytics event (temporarily removed the `trackEvent` call in `handleValueSectionCta`, confirmed the new test failed with the exact expected assertion failure, restored, confirmed green).

No command was skipped or reported as passing without actually running.

## 9. Acceptance criteria — confirmed

- `/en/northern-lights` presents the exact new H1/supporting sentence, then the live preview, conversion section, "How it works," and disclaimer, in that order.
- Free qualifying results show the canonical verdict plus the generic locked Pro value block and outcome-led CTA/note, with zero Pro-data leakage (DOM-swept, not just visible-query-checked).
- Pro results retain the current full experience and contain no purchase lock/CTA, in both the qualifying and all-poor cases.
- All-poor/no-darkness/unavailable/transport-error/loading states remain honest and acquire no false result-level claims under the landing variant.
- The lower Free conversion section lists the four real Pro benefits with the approved outcome-led CTA, is Free-only, and never implies a favorable result (renders identically regardless of the card's own state).
- Landing-owned copy and metadata contain no best-viewing-time/window/peak-time claim.
- Homepage and every other `NorthernLightsCard` consumer are behaviorally and visually unchanged by default (red→green-proven, not merely asserted).
- `aurora_landing_viewed` remains the sole canonical landing-view event, unchanged, still exact-once after entitlement resolution.
- Each landing CTA placement emits exactly one correctly-payloaded `northern_lights_landing_cta_clicked` and starts checkout with the matching source.
- `northern_lights_upgrade_clicked` behavior is intact for the card CTA in both variants, and the value-section CTA never emits it.
- New UI uses only existing design primitives/icon dependencies (Tailwind classes and `lucide-react`'s `Lock`, already installed), has visible keyboard focus rings, and was verified readable/non-clipping in both themes at 390px.

## 10. Deviations and residual risks

1. **The four benefit strings are defined once in `translations.northernLights.js`** (not duplicated into `translations.landing.js`) and reused verbatim by both the card's internal block and the page's own conversion section — a deliberate single-source-of-truth choice, not an oversight, directly serving the approved prompt's "restate the same four Pro capabilities" and "use the same CTA copy for both entry points" instructions.
2. **The value-section CTA's `tier` is computed as `entitlements.isPro ? "pro" : "free"`** even though that section only ever renders when `!entitlements.isPro` — kept for correctness/consistency with how every other tier-bearing event in this codebase derives the field, rather than hardcoding `"free"`; in practice always resolves to `"free"` since the section is Free-only.
3. **Two pre-existing, unrelated test-authoring gotchas were hit and fixed while writing new tests** (§7) — both were test-code issues (split text nodes, an over-broad role query), not application defects; documented for transparency, not hidden.
4. No other risk identified: scoring/classification/candidate/freshness logic, entitlement computation, checkout/payment plumbing, the homepage's card usage, and every other route are all confirmed unchanged and (where a relevant existing suite exists) re-verified green, not merely assumed.

## 11. Confirmation

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**
