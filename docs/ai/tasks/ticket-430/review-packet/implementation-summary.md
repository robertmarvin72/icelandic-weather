# #430 — implementation summary

Secondary Viator ("book a guided Northern Lights tour") next step, added to the shared `NorthernLightsThreeNight` module (mounted on both `/en/northern-lights` and the homepage `#northern-lights` module). Forecast itself is unchanged: free, independent, no new scoring/ranking logic.

## New files

- `src/config/affiliateOffers.js` — the exact Viator URL (byte-for-byte from the issue) and the event constants (`partner`, `campaign`, `destination`, placement-by-surface map).
- `src/lib/affiliateImpressionHolder.js` — the "once per placement per route visit" dedup contract. A plain mutable object (not React state): a synchronous `tryConsume(visitId, placement)` guard keyed on an opaque visit id its owner mints, so overlapping observers (including a StrictMode double effect) can only win once, and a stale visit id captured before a route change always fails.
- `src/components/AffiliateCta.jsx` — the CTA itself, a separate child component (own hooks) so the parent module never needs a hook after its own `if (!seasonActive) return null`. IntersectionObserver (>=50%) plus `document.visibilityState` re-check, modeled directly on the existing `WeatherVoiceCard.jsx` precedent. Click/auxclick(button 1) send `affiliate_clicked` independent of the impression.
- Six new test files (unit + integration): `affiliateImpressionHolder.test.js`, `AffiliateCta.test.jsx`, `NorthernLightsThreeNight.affiliateCta.test.jsx`, `NorthernLightsThreeNight.affiliateCtaFallback.test.jsx`, `App.affiliateHolder.test.jsx`, `NorthernLightsLanding.affiliateHolder.test.jsx`, plus `analytics.affiliateGA.test.js` (real `analytics.js`, `react-ga4` mocked at the package boundary) and `translations.northernLights.affiliateParity.test.js`.

## Changed files

- `src/components/NorthernLightsThreeNight.jsx` — eligibility predicate keyed on the slot actually displayed (`selectedSlot.date`, which already falls back to `slots[0]`): `multiNight.slots.find(s => s.date === selectedSlot.date)?.usable === true`. No new helper, no re-scoring — `usable` is the same per-slot fact `classifyMultiNightComparison` already computes, so a stale-but-usable result is eligible and an expired one (which `applyClientFreshness` already turns into `domain_unavailable` upstream) is not. The CTA renders last, after the status region and the EN homepage details link, outside the `role="status"` live region. Accepts an optional `affiliateImpressionHolder` prop (absent in existing standalone-mount tests, which keep passing).
- `src/App.jsx` — the affiliate impression holder is owned in `IcelandCampingWeatherApp`, above `showCampsitesGate`, so the gate toggling (campsites loading/error/reload, which unmounts and remounts everything below it) never resets or duplicates an impression within the same route visit. The visit id is derived from `useLocation().pathname` plus a sequence counter, computed synchronously during render.
- `src/pages/NorthernLightsLanding.jsx` — its own holder, a fresh visit id minted once per mount (this page already remounts on every genuine route entry); the `?date` query replace does not remount it, so the same visit (and any already-consumed impression) survives a night selection.
- `src/i18n/translations.northernLights.js` — five new keys (`nlAffiliateTitle/Body/Cta/Disclosure/NewTabSuffix`) in both EN and IS, the exact issue copy.

## Validation (see `commands-results.md` for exact commands)

33 targeted files / 466 tests; full suite 173 files / 2560 tests; lint and build both clean; 8 browser scenarios / 50 assertions on a dummy-GA-id evidence build outside the repo (real scroll-triggered `IntersectionObserver`, GA `window.dataLayer` capture, exact outbound URL interception, hierarchy/disclosure/focus/poor-result-neutrality/error-absence/no-duplicate-on-night-change).

## Scope boundaries respected

No scoring/ranking/freshness/forecast-data/gating/entitlement/payment change. No backend/API/provider integration. No new dependency (lucide-react was already a dependency; the one new `lucide-react` import follows the existing `NorthernLightsThreeNight.jsx`/`NorthernLightsCard.jsx` pattern). No URL change, no extra providers. No commit, push, deploy, or GitHub issue closure. The revenue measurement runbook is `docs/ai/tasks/ticket-430/experiment-note.md`.
