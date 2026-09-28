# #426 — Approved implementation prompt v1

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/426
Consolidated: 2026-09-28. Jonesy APPROVED Round 1 with the three required clarifications incorporated below. This is the sole execution prompt when CURRENT references it at READY_FOR_CC.

## Read-only preflight and scope

#425 is CLOSED/PASS; working tree clean before workflow edits. Read AGENTS.md, CLAUDE.md and docs/ai/README.md/CURRENT before acting. Source inspection confirms the existing user entrypoint is App.jsx's shared NorthernLightsThreeNight at #northern-lights, surface=homepage. AuroraNightOutlook renders a generic Free hint/CTA only on qualifying results; the poor branch returns before that CTA. Landing uses its separate LockedValue block. NorthernLightsThreeNight owns upgrade events and the onUpgrade callback, and currently renders the English detail-page Link for both homepage languages.

Protected-flow audit: isFeatureAvailable/selectAuroraDisplay gate presentation; no tier-dependent input changes are needed. useCheckoutFlow.startCheckout(src) opens the existing login modal for logged-out users, otherwise navigates a non-Pro user to /pricing?email=...&src=.... Pricing resolves/persists the source through checkoutSource.js and sends upgrade_source to /api/checkout. useLoginFlow's existing success/new-user navigation sends email to pricing but does not carry src or selected date. Therefore logged-in attribution can use the existing src chain, while cross-login source continuation/date-through-purchase are NOT currently guaranteed. Do not claim otherwise or change login/payment plumbing in this UX ticket. At the CTA itself, attribution is always available to existing trackEvent calls.

Implement only the requested homepage conversion presentation and removal of the IS detail link. EN homepage detail link remains; landing page copy/CTAs, selected-date URL support and both language routes remain unchanged. No new forecast logic, entitlement, backend, payment flow, libraries or scoring changes. Do not revisit #423/#425 completed architecture.

## 1. Homepage Free value block

Replace the qualifying homepage Free hint/CTA with one compact block, no second CTA. Use these exact issue strings in translations.northernLights.js:

IS heading: Hvar eru aðstæður bestar?
IS body: Með Pro sérðu hvaða staðir koma best út, aðra valkosti og kort.
IS button: Sjá bestu staðina með Pro
EN heading: Where are conditions best?
EN body: With Pro, see the top locations, ranked alternatives and a map.
EN button: See the best locations with Pro

Scope to surface=homepage and resolved Free entitlement. Reuse the existing gate; do not infer Pro from copy. Pro sees no subscription encouragement and retains existing details, ranking, map and night controls. Free must not receive names/coordinates/reasons/ranked items via hidden DOM or accessibility text. Keep the dark card style, date selector and actual update/stale notices intact. Do not change existing landing translation keys to accomplish the homepage wording change.

The block must describe the SELECTED night, not tonight or the recommended date by default. Show a concise selected-night label using the existing date helper where needed for clarity. No automatic selection reset on CTA click, login modal open/close, entitlement-loading transition or rerender. Preserve selected-night hook state within the mounted module. Existing flow has no date-through-pricing/checkout contract: do not add new return URLs, storage protocols, checkout metadata or auto-resume purchasing. Report this exact supported boundary.

## 2. Poor and unavailable states

For a resolved usable selected night with poor/very-poor canonical outlook, Free still receives a truthful comparison-oriented Pro block, rather than promoting the least bad site as good. Keep the poor headline/band and use separate localized wording, for example:

IS heading: Berðu saman staðina með Pro
IS body: Með Pro sérðu hvaða staðir koma best út af þeim sem voru skoðaðir. Aðstæður eru þó óhagstæðar og enginn staður er ráðlagður núna.
IS button: Bera saman staði með Pro
EN heading: Compare locations with Pro
EN body: With Pro, see which of the checked locations comes out best. Conditions are still unfavorable, and no location is recommended right now.
EN button: Compare locations with Pro

Do not promise a map/ranked alternatives for poor results: the existing poor Pro state intentionally shows only best-of-poor details, not a qualifying ranking/map. No changes to those rules. Stale-but-usable results may show the appropriate block with existing stale disclosure; partial usable results keep partial/scoped wording and must not imply full coverage. Loading, transport errors, unavailable/expired/no-darkness results retain their status/retry treatment without a result-backed upgrade claim. Off-season remains unchanged. Hide subscription copy while entitlement resolution is unknown, so a Pro user is not briefly prompted as Free.

## 3. Remove only the IS homepage detail link

Do not render nl3-details-link when surface=homepage and lang=is, regardless of Free/Pro, selected date or disclosure state. Do not replace it with another language link. Keep the EN homepage selected-date Link and the landing route/query behavior intact. Keep general language switching, anchors and off-season fallback. Update tests previously asserting the IS link; preserve EN date-handoff tests rather than deleting that functionality's coverage.

## 4. Existing upgrade flow and analytics

Use the existing onUpgrade -> startCheckout callback, once per click. For the homepage CTA use a bounded attribution source `northern_lights_homepage` to explicitly identify this surface as the issue requests. Landing continues `northern_lights_card` and its existing events/copy unchanged. This is a CTA attribution-label change only; do not change resolver priority, sessionStorage rules, prices/entitlements or backend behavior.

Keep northern_lights_upgrade_clicked and northern_lights_multi_day_upgrade_clicked; source=homepage remains the latter's analytics surface. Include upgrade_source=northern_lights_homepage in the homepage click metadata to make the attribution explicit, without replacing existing fields. Preserve selected_date/days_ahead/forecast_status/user_tier for the selected night. No new event name/system, no events on render or duplicate firing, no landing-only CTA event from homepage. On logged-in Free flow verify src reaches pricing and its existing upgrade_source mapping; on logged-out flow verify modal and click attribution, explicitly document the existing loss of continuation source on subsequent login navigation rather than asserting complete cross-login propagation. If the issue is interpreted as requiring cross-login payment attribution persistence, STOP and request a separate scope decision before changing that protected flow.

## 5. Validation

Add targeted real-component tests for EN/IS exact qualifying copy, truthful poor branch, selected tomorrow/day-2 copy and click metadata, no Free detailed-data leak, no Pro/loading-entitlement upsell, partial/stale/expired/unavailable states, one CTA and one callback. Test modal open/close preserves selection and no extra forecast request occurs. Verify logged-in pricing navigation source through the actual existing adapter (stub network; do not call a live payment API), and logged-out modal behavior. Keep existing checkout-source regression tests passing without changing their semantics.

Test IS link absence for both tiers and disclosure states, EN link presence/handoff unchanged, general language switch unaffected and landing text/CTA/source unchanged. Run affected shared Aurora/component/homepage/landing/handoff suites, changed-file lint and production build. Use browser fixtures at 375px and desktop for IS/EN, Free/Pro, qualifying/poor states: inspect the actual text, selected night, single upgrade button, wrapping, focus and absence of the IS link. Keep screenshots and reproducible steps; no live provider/DB/cron/checkout needed. Report exact tests/commands and limitations, not old #425 counts.

## 6. Boundaries and workflow

Allowed production changes are narrow shared Aurora presentation/controller wiring and existing EN/IS translations; adjust tests/documentation accordingly. No new Pro behavior, scoring, forecast/cache/candidate model changes, backend/XML/Open-Meteo, general language routing, payment/login/checkout hook changes or redesign. If a requirement cannot fit that boundary, state evidence and smallest proposed scope change before writing protected code. No commit/push/deploy/GitHub closure.

Jonesy has approved this prompt. Verify CURRENT references this approved-prompt-v1.md at READY_FOR_CC before execution. CC verifies that pointer, sets CC_IN_PROGRESS, executes the approved prompt only, writes docs/ai/tasks/ticket-426/cc-report.md and sets CC_COMPLETE. Jonesy writes docs/ai/tasks/ticket-426/result-review.md for Ripley's final assessment. Preserve previous ticket history.
## Consolidated Jonesy requirements (authoritative clarifications)

1. **Exact analytics schema.** Add the literal `upgrade_source` field to BOTH existing homepage click events, without removing or repurposing existing fields:
   - northern_lights_upgrade_clicked: `{ lang, source: "northern_lights_homepage", tier: "free", upgrade_source: "northern_lights_homepage" }`.
   - northern_lights_multi_day_upgrade_clicked: retain `{ selected_date, days_ahead, forecast_status, user_tier, source: "homepage" }` and add `upgrade_source: "northern_lights_homepage"`.
   The first event intentionally carries identical attribution values in its legacy source and the explicit new upgrade_source field. The second keeps source as the surface identifier. Forward `onUpgrade("northern_lights_homepage")` once. Landing event payloads and callback source remain unchanged, with no new upgrade_source field added there. Assert exact payloads in tests; this metadata must never influence entitlement, plan or price.

2. **Entitlement-loading guard.** Thread the existing loadingMe value from NorthernLightsThreeNight into AuroraNightOutlook. Apply the homepage subscription-visibility guard to BOTH the qualifying Free block and the new poor Free block: render only when entitlement loading is finished and the user is Free. Do not hide the general forecast while entitlement is loading. Preserve landing's existing copy/CTA behavior; keep this homepage-specific guard explicitly scoped so the issue does not change landing presentation. Test both homepage branches during loading and after resolution to Free and Pro, including preservation of selected night.

3. **Unused IS translation disposition.** Retain the IS nlHomeDetailsLink translation value for dictionary symmetry in this bounded change; it must have no production IS-homepage render path after link removal. Keep the EN value and EN link unchanged. Explicitly report the unused IS value in cc-report.md and verify its absence from the rendered IS homepage for both tiers. Do not remove unrelated language-switching links or keys.
