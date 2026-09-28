# #426 — Homepage Aurora Pro value — Round 1

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/426
Date: 2026-09-26. Role: Ripley. Discussion/review only, not executable.

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

Jonesy reviews and leaves PROMPT_REVIEW. After approval Ripley creates approved-prompt-v1.md and sets READY_FOR_CC. CC verifies that pointer, sets CC_IN_PROGRESS, executes the approved prompt only, writes docs/ai/tasks/ticket-426/cc-report.md and sets CC_COMPLETE. Jonesy writes docs/ai/tasks/ticket-426/result-review.md for Ripley's final assessment. Preserve previous ticket history.

## Jonesy review — Round 1 (implementation prompt)

**APPROVED, with three required clarifications/additions** — same class as
the #425 Round 1 finding: small, same-file/same-scope items, not reasons for
a full send-back.

### Independent verification of this prompt's preflight claims

All checked directly against the current live source (post-#425-close), not
restated from memory of earlier tickets:

- **"AuroraNightOutlook renders a generic Free hint/CTA only on qualifying
  results; the poor branch returns before that CTA."** Confirmed exactly:
  the `!display.hasQualifyingLocations` (all-poor) branch only ever renders
  Pro's best-of-poor details (`{isPro && bestAvailable && (...)}`) — a Free
  user on a poor night currently sees zero upsell content. The `{!isPro &&
  (...)}` CTA block exists only inside the qualifying branch. This is a real,
  currently-shipped gap, exactly as described.
- **"NorthernLightsThreeNight... currently renders the English detail-page
  Link for both homepage languages."** Confirmed: `{isHomepage && (<Link
  to={buildNightDetailPath(...)}>{t("nlHomeDetailsLink")}</Link>)}` has no
  `lang` condition at all today.
- **The checkout-attribution chain** (`useCheckoutFlow.startCheckout(src)` →
  login modal if logged out, else `/pricing?email=...&src=...` →
  `Pricing.jsx`'s `resolveCheckoutSource()`/`persistCheckoutSource()` →
  `upgrade_source` in the `/api/checkout` body) — read all three files
  directly, confirmed byte-for-byte accurate, including the priority order
  in `checkoutSource.js` (URL `src` → ctaSource arg → route → sessionStorage
  → route fallback).
- **"useLoginFlow's existing success/new-user navigation sends email to
  pricing but does not carry src or selected date."** Confirmed: both the
  successful-login path and the `USER_NOT_FOUND` new-user path call
  `navigate(/pricing?email=${...})` with no `src` param anywhere, and
  nothing persists the homepage CTA's source to sessionStorage before the
  login modal opens. So today, a logged-out user clicking the homepage
  Pro CTA and then logging in would land on Pricing with `resolveCheckoutSource()`
  falling through to the **route** source (`"pricing"`, since path
  `/pricing` isn't the `ROUTE_FALLBACK`), not `northern_lights_homepage`.
  This confirms the prompt's "explicitly document the existing loss of
  continuation source... rather than asserting complete cross-login
  propagation" instruction is grounded in a real, verified gap, and the
  STOP condition around not fixing this protected flow is correctly scoped.

### Required clarification 1 — the `upgrade_source` metadata instruction is ambiguous

§4 says: *"Include upgrade_source=northern_lights_homepage in the homepage
click metadata to make the attribution explicit, without replacing existing
fields."* `northern_lights_upgrade_clicked`'s current payload is exactly
`{lang, source, tier: "free"}` — there's no `upgrade_source` field today.
It's unclear whether this instruction means (a) add a literal new
`upgrade_source` key to that trackEvent payload alongside the existing
`source` key (which itself will *also* now carry `"northern_lights_homepage"`
once the CTA's checkout-attribution string changes), producing a payload
with two fields carrying the same value, or (b) is just loose phrasing for
"the checkout-attribution source becomes `northern_lights_homepage`" with no
new analytics field at all. These produce different, both-plausible
implementations and this is exactly the kind of thing that shouldn't be left
to CC's judgment on an analytics-schema change. **Required addition:** state
explicitly whether `upgrade_source` is a new literal field name to emit on
`northern_lights_upgrade_clicked` (and if so, alongside `source` or replacing
its semantic role), or whether no new field is intended.

### Required clarification 2 — the entitlement-loading flash-guard should cover both Free CTA blocks, not just the new one

§2's "Hide subscription copy while entitlement resolution is unknown, so a
Pro user is not briefly prompted as Free" is stated under the poor-state
section, but `loadingMe` isn't threaded into `AuroraNightOutlook.jsx` at all
today (`NorthernLightsThreeNight.jsx` never passes it down) — so the
*existing, already-shipped* qualifying-branch Free CTA has the exact same
flash risk right now (Aurora classification can resolve before `useMe`
does). Since fixing this properly means threading `loadingMe` through both
components, it will almost certainly gate both `{!isPro && ...}` blocks at
once by construction — worth saying so explicitly rather than leaving it to
read as "only the new poor-state block needs this," so CC doesn't ship an
inconsistent half-fix (poor branch guarded, qualifying branch still
flashing).

### Required clarification 3 — the orphaned IS `nlHomeDetailsLink` translation

Once the IS `nl3-details-link` stops rendering (§3), the `is` block's
`nlHomeDetailsLink: "Sjá nánar á ensku síðunni"` value becomes a
production-orphaned string — no remaining render path uses it (only tests
would still reference it, to assert absence). This is the same category of
issue as `NorthernLightsCard.jsx`'s orphaned default export from #425:
squarely in scope (existing translations, per the prompt's own "Allowed
changes"), cheap, and exactly the kind of thing that should be reported
rather than silently left unaddressed given this project's established
practice. **Required addition:** have CC explicitly report in cc-report.md
whether the IS `nlHomeDetailsLink` value is retained (unused, for
symmetry/possible future reuse) or removed, rather than leaving it
unmentioned either way.

### Everything else

Scope discipline is consistent with #423/#425: no scoring/backend/routing/
payment-plumbing changes, explicit STOP condition if cross-login
attribution persistence is required, exact copy strings given for both
languages and both result states, and the validation section's browser/test
matrix (IS/EN × Free/Pro × qualifying/poor, IS link absence, EN handoff
preserved) tracks directly onto the requirements above with nothing
disconnected. The poor-state Pro behavior boundary ("no map/ranked
alternatives for poor results... no changes to those rules") is correctly
restated and matches the current code exactly.

### Verdict

**APPROVED**, contingent on the three clarifications/additions above being
folded into approved-prompt-v1.md before CC executes — none of them change
the prompt's scope or require a new review round; they're precision fixes
on an otherwise accurate, well-grounded preflight.

## Ripley Round 1 handoff — 2026-09-28

Jonesy APPROVED. Created approved-prompt-v1.md with all three required clarifications: literal upgrade_source added alongside existing fields on both homepage click events; loadingMe threaded into the selected-night view and applied to both homepage Free CTA branches; unused IS nlHomeDetailsLink value retained and explicitly reported. Landing behavior remains unchanged. Set CURRENT to READY_FOR_CC. No production code, commit or push changed.

