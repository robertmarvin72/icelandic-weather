# GA4 Free → Pro Funnel Audit — free-v1-baseline

**Scope:** Read-only audit of the current analytics implementation before any changes.
**Experiment labels:** `free-v1-baseline` (current state) / `free-v2` (post-implementation target).
**All users will migrate to `free-v2` — this is a before/after measurement, not an A/B test.**
**Audit date:** 2026-07-21  
**Branch:** main — commit `6eec37cf93ae92df4e3b191a07434f2067cefa43`

---

## Section 1 — Existing analytics architecture

<!-- Section 1/12 done -->

### Library and initialization

- **Library:** `react-ga4` (wraps GA4 / gtag.js). Initialized via `src/lib/analytics.js`.
- **Measurement ID source:** `import.meta.env.VITE_GA_MEASUREMENT_ID` (Vite env var, must be prefixed `VITE_`).
- **Init call site:** `initAnalytics()` is called in `src/main.jsx` **before** `createRoot`. It runs unconditionally at module load — there is no consent gate anywhere in the codebase.
- **Consent gate:** None. `trackEvent()` fires whenever `gaId` is truthy. No cookie check, no localStorage flag, no GDPR opt-in guard.

### Centralized wrapper

```js
// src/lib/analytics.js
export function trackEvent(name, data = {}) {
  if (gaId) { ReactGA.event(name, data); }
  if (import.meta.env.DEV) { console.log("[event]", name, data); }
}
```

- In DEV mode, events also log to the console **and still fire to GA4** if `gaId` is set in `.env.local`.
- `trackPageView()` calls `ReactGA.send({ hitType: "pageview", page: path })`.

### Page-view tracking

- `src/components/AnalyticsTracker.jsx` listens to `location.pathname + location.search` changes via React Router.
- Uses `useRef(null)` guard to prevent StrictMode double-fire on the first path render.

### StrictMode

- `<StrictMode>` is active in `src/main.jsx`.
- `homepage_loaded` fires in `useEffect(fn, [])` in `App.jsx` with **no guard** → double-fires in development. In production (no StrictMode) this fires exactly once.
- `campsite_selected` has a `useRef(true)` guard that skips the first render → correct in both dev and prod.

### Attribution tracking

- `saveAttributionIfPresent()` (in `src/lib/attribution.js`) runs at **module level** in `src/main.jsx`, before React renders.
- Captures UTM params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) from the landing page URL into `localStorage` key `campcast_attribution`.
- First-touch only: if the key already exists, it is not overwritten.
- `getStoredAttribution()` is passed into the Paddle checkout body by both `Pricing.jsx` and `Subscribe.jsx`.

### Secondary analytics layers

- `@vercel/analytics/react` (`<Analytics />`) is mounted in `App.jsx` — Vercel's own analytics collector, separate from GA4.
- `@vercel/speed-insights/react` (`<SpeedInsights />`) is also mounted.
- Neither of these is relevant to the GA4 funnel being audited.

---

## Section 2 — Event inventory table

<!-- Section 2/12 done -->

All `trackEvent()` calls found in `src/` as of this audit. Ordered by funnel stage.

| Event name | File | Trigger | Properties sent | Notes |
|---|---|---|---|---|
| `homepage_loaded` | `App.jsx:249` | `useEffect(fn, [])` on mount | `lang`, `isPro`, `mobile` | No StrictMode guard; double-fires in dev |
| `homepage_hero_cta_click` | `Toolbar.jsx:40` | Button click | _(none)_ | No properties |
| `comparison_viewed` | `InstantComparison.jsx:304` | `useEffect` when `showComparison && best` | `comparisonTier`, `distanceBucket`, `recommendation` | `comparisonFiredRef` dedup per `siteId:tier` pair |
| `better_nearby_found` | `InstantComparison.jsx:311` | Same effect, when `isStrongOrDecent` | `recommendation`, `comparisonTier`, `radiusKm` | Conditional; only fires when improvement is ≥ "decent" |
| `homepage_instant_comparison_cta_click` | `InstantComparison.jsx:323` | Scroll-to-top5 button click | _(none)_ | No properties |
| `stay_recommended` | `RoutePlannerCard.jsx:257` | Effect when verdict changes | (unknown — not read in full) | Fires when route planner verdict is "stay" |
| `move_recommended` | `RoutePlannerCard.jsx:263` | Effect when verdict changes | (unknown — not read in full) | Fires when route planner verdict is "move" |
| `campsite_selected` | `App.jsx:263` | `useEffect` on `siteId` change | `siteId`, `siteName` | `initialSiteRef` guard skips first render |
| `comparison_feature_viewed` | `CampsiteComparisonSection.jsx:359` | Effect on mount | `lang`, `isPro`, `source:"homepage"` | Pro feature card |
| `comparison_campsites_selected` | `CampsiteComparisonSection.jsx:369` | Effect when both sites selected | `lang`, `siteA`, `siteB` | |
| `comparison_day_expanded` | `CampsiteComparisonSection.jsx:519` | Click | _(unknown — not read in full)_ | |
| `comparison_upgrade_clicked` | `CampsiteComparisonSection.jsx:115` | Click on paywall CTA | `lang`, `source:"comparison"` | Free → Pro paywall touchpoint |
| `brochure_comparison_cta_click` | `Brochure.jsx:79` | Click on brochure CTA | `lang`, `source:"brochure_comparison"` | |
| `pricing_page_viewed` | `Pricing.jsx:48` | `useEffect(fn, [])` on mount | `source`, `lang`, `isPro` | `viewFiredRef` guard; fires once |
| `subscription_cta_clicked` | `Pricing.jsx:108` + `Subscribe.jsx:110` | Button click (before terms guard in Pricing) | `plan`, `billingCycle`, `source`, `lang` | Two call sites; Pricing fires before terms check would block |
| `upgrade_started` | `Pricing.jsx:126` | Inside `startCheckout`, when monthly→yearly upgrade | `fromTier:"monthly"`, `toTier:"yearly"`, `billingCycle:"yearly"` | |
| `checkout_started` | `Pricing.jsx:216` + `Subscribe.jsx:162` | After successful `/api/checkout` call, before redirect | `plan`, `billingCycle`, `priceIdType:"paddle"`, `source` | Two call sites |
| `upgrade_completed` | `Pricing.jsx:202` | After API returns `{ ok:true, upgraded:true }` | `fromTier`, `toTier`, `billingCycle` | Monthly→yearly in-place upgrade path only |
| `checkout_completed` | `Success.jsx:20` | `useEffect` when `status === "active"` | `plan`, `billingCycle`, `status:"active"`, `source` | `checkoutFiredRef` guard; fires once per mount |
| `cancellation_started` | `useCheckoutFlow.js:34` + `Success.jsx:106` | `openBillingPortal()` call | `source`, `currentTier` | Two call sites |

**Total distinct event names found: 20**

---

## Section 3 — Paddle audit

<!-- Section 3/12 done -->

### Stop condition evaluation

**Question:** Can `checkout_completed` or `purchase` already be sent from multiple paths?

**Findings:**

1. `checkout_completed` fires in **one location only**: `Success.jsx:20`, inside a `useEffect` that guards with `checkoutFiredRef.current`. It fires when `/api/me` returns `entitlements.pro === true` after the Paddle redirect back to `/?checkout=success`.

2. `purchase` is **not fired anywhere** in the codebase. No such event exists.

3. The `?checkout=success` query param is handled in **two places**:
   - `useCheckoutFlow.js`: checks `?checkout=success|cancel` on mount, fires a toast, calls `refetchMe()` — but fires **no analytics events**.
   - `Success.jsx`: the dedicated success page, which polls `/api/me` and fires `checkout_completed` once Pro is confirmed.

4. **These two paths are mutually exclusive** by routing: `/?checkout=success` triggers the `useCheckoutFlow` toast (homepage), while `/success` (if routed there) would show `Success.jsx`. The actual Paddle success URL is configured in `api/checkout.js` as `${appBase}/?checkout=success` — so the Paddle return goes to the **homepage**, not `Success.jsx`. This means **`checkout_completed` currently never fires for the normal checkout path**, because `Success.jsx` is not the Paddle return destination.

**Critical finding:** `checkout_completed` is implemented in `Success.jsx` but the Paddle success redirect goes to `/?checkout=success` (the homepage), not to `/success`. The `Success.jsx` page would only be reached if the user manually navigates to `/success` or if a separate route entry point triggers it. The `useCheckoutFlow.js` handler for `?checkout=success` does not fire any analytics event. **`checkout_completed` is a gap in the current funnel for normal checkouts.**

### Upgrade path (monthly → yearly)

- When the API returns `{ ok: true, upgraded: true }`, `Pricing.jsx` fires `upgrade_completed` then redirects to `/?checkout=success&upgrade=1`. No separate `checkout_completed` fires for this path either.

### Webhook side

- `api/paddle-webhook.js` processes subscription and transaction events server-side. It does not emit any GA4 events (server-side GA4 hits are not implemented). This is expected — GA4 events are client-side only.

---

## Section 4 — Attribution model

<!-- Section 4/12 done -->

### UTM capture

- `saveAttributionIfPresent()` runs at module load before React, capturing UTM params from the first landing URL into `localStorage["campcast_attribution"]`.
- First-touch: once saved, it is never overwritten by subsequent visits.
- No last-touch or multi-touch model is implemented.

### Checkout source tracking

- `src/lib/checkoutSource.js` provides a separate "checkout source" mechanism stored in `sessionStorage["checkout_source"]`.
- Resolution priority: `?src=` URL param → `ctaSource` arg → sessionStorage → route fallback (`routeSource(pathname)`).
- Possible route source values: `pricing`, `subscribe`, `brochure`, `blog_*`, `homepage`.
- `persistCheckoutSource(source)` is called from both `Pricing.jsx` and `Subscribe.jsx` before the checkout API call.
- `readCheckoutSource()` is called in `Success.jsx` to populate the `source` field of `checkout_completed`.

### Attribution in Paddle checkout body

- Both `Pricing.jsx` and `Subscribe.jsx` pass `getStoredAttribution()` in the checkout request body. The checkout API embeds it in the Paddle transaction's `custom_data`.
- **Gap:** The Paddle success URL (`/?checkout=success`) does not carry `?src=` or UTM params back, so `readCheckoutSource()` in `Success.jsx` relies entirely on sessionStorage surviving the Paddle redirect (which it does in the same browser tab).

### QR source tracking

- `sessionStorage["qr_source"]` is a separate channel for QR code attribution, saved if `?qr=` is in the URL. Also embedded in the Paddle checkout body and pre-written to `user_subscription.qr_source` in the DB before the Paddle redirect (because Paddle does not propagate transaction `custom_data` to subscription webhooks).

---

## Section 5 — Consent and data governance

<!-- Section 5/12 done -->

### Current state

- **No consent gate exists** in the codebase. `initAnalytics()` fires at app boot without any opt-in check. `trackEvent()` has no guard beyond `if (gaId)`.
- No cookie consent banner, no localStorage opt-in flag, no GDPR opt-out mechanism was found in `src/`.
- Vercel Analytics (`<Analytics />`) also fires without a consent gate.

### PII in events

All events audited were checked for PII:

- `email` is **not** sent in any `trackEvent()` call.
- `siteId` and `siteName` are campsite identifiers, not personal data.
- `lang`, `isPro`, `plan`, `billingCycle`, `source`, `mobile` are non-PII metadata.
- `comparisonTier`, `distanceBucket`, `recommendation`, `radiusKm` are non-PII.
- `siteA`, `siteB` in `comparison_campsites_selected` are campsite IDs, not PII.

### Risk note

Firing GA4 without consent may violate GDPR/ePrivacy for EU users. Iceland is EEA and subject to GDPR. This is a legal/compliance consideration, not addressed by this audit — flagged for awareness only.

---

## Section 6 — Canonical state sources

<!-- Section 6/12 done -->

| State | Canonical source | Notes |
|---|---|---|
| User tier (free/pro) | `/api/me` → `entitlements.pro` | Fetched by `useMe()` hook; normalized to `{ pro: boolean, proUntil: string\|null }` |
| Subscription plan | `/api/me` → `subscription.plan` | `"monthly" \| "yearly" \| "unknown" \| null` |
| User email | `/api/me` → `user.email` | Trusted server value; querystring `?email=` is used as fallback only |
| Language | `localStorage["lang"]` | Managed by `useLanguage()` hook |
| Theme | `localStorage["theme"]` | `"light" \| "dark"` |
| UTM attribution | `localStorage["campcast_attribution"]` | First-touch; see Section 4 |
| Checkout source | `sessionStorage["checkout_source"]` | Session-scoped; see Section 4 |
| QR source | `sessionStorage["qr_source"]` | Session-scoped |
| Dev Pro override | `localStorage["devPro"]` | DEV mode only; `entitlements.isPro` uses OR with `serverPro` in dev |
| Brochure A/B variant | `localStorage["brochure_variant"]` | Random assignment; A or B |
| Feature entitlements | `src/config/features.js` + `useMe()` | Computed: `isFeatureAvailable(key, entitlements)` |

---

## Section 7 — Duplicate-event risk

<!-- Section 7/12 done -->

| Event | Risk level | Reason |
|---|---|---|
| `homepage_loaded` | **Medium (dev only)** | `useEffect(fn, [])` with no guard fires twice in StrictMode dev. Production: fires once. |
| `pricing_page_viewed` | **Low** | `viewFiredRef.current` guard; fires exactly once per Pricing mount. |
| `checkout_completed` | **Low** | `checkoutFiredRef.current` guard; fires once per Success mount when status becomes "active". |
| `comparison_viewed` | **Low** | `comparisonFiredRef.current` keyed by `siteId:tier`; deduped per pair. |
| `better_nearby_found` | **Low** | Same guard as `comparison_viewed`. |
| `subscription_cta_clicked` | **Low** | Click handler; no double-click guard beyond `busyPlan` state in Pricing. |
| `checkout_started` | **Low** | Fires after successful API call; API call is guarded by `busy` state. |
| `campsite_selected` | **Low** | `initialSiteRef` guard; skips first render, fires once per subsequent change. |
| `cancellation_started` | **Low** | Click handler only. |
| `comparison_feature_viewed` | **Medium (dev only)** | `useEffect` on mount in `CampsiteComparisonSection` — not audited for StrictMode guard. |

**StrictMode double-fire summary:** Only `homepage_loaded` and potentially `comparison_feature_viewed` are at risk. Both affect dev only. In production, StrictMode is not active and each fires once.

---

## Section 8 — Guardrail events

<!-- Section 8/12 done -->

Guardrail events are events that should fire under controlled conditions and whose unexpected absence or presence signals a funnel break.

| Guardrail | Current state | Stop-if condition |
|---|---|---|
| `pricing_page_viewed` fires before any CTA click | Implemented — `viewFiredRef` guard ensures it fires on mount | Stop if this fires 0 times while `subscription_cta_clicked` fires > 0 |
| `checkout_started` fires only after `subscription_cta_clicked` | Implemented — `checkout_started` is inside the async success path, which can only be reached after the CTA click | Stop if `checkout_started` fires more than `subscription_cta_clicked` |
| `checkout_completed` fires only after Paddle redirect | **Gap** — currently never fires for normal checkout (see Section 3) | N/A until gap is fixed |
| `homepage_loaded` fires once per session | Implemented in prod; double-fires in dev | Monitor for ratio > 1 per session_id |
| `subscription_cta_clicked` fires for both Pricing and Subscribe paths | Implemented at both call sites | |

---

## Section 9 — Funnel coverage (current vs. required)

<!-- Section 9/12 done -->

### Primary monetization funnel — event-by-event status

| Step | Event | Status | File | Gap / note |
|---|---|---|---|---|
| 1 | `pricing_page_viewed` | ✅ Implemented | `Pricing.jsx:48` | `source`, `lang`, `isPro` properties present |
| 2 | `subscription_cta_clicked` | ✅ Implemented | `Pricing.jsx:108`, `Subscribe.jsx:110` | Both checkout paths covered. **Fires before** terms checkbox check in Pricing (line 108 fires before `if (!acceptedTerms) return` on line 116). |
| 3 | `checkout_started` | ✅ Implemented | `Pricing.jsx:216`, `Subscribe.jsx:162` | Fires after successful `/api/checkout` response, before Paddle redirect |
| 4 | `checkout_completed` | ❌ Gap | `Success.jsx:20` | Only fires if user navigates to the `/success` route. The Paddle success URL redirects to `/?checkout=success` (homepage), not `/success`. Event never fires for normal purchase flow. |
| 5 | `purchase` | ❌ Not implemented | — | GA4 recommended event for revenue; not present |

### Primary homepage funnel — event-by-event status

| Step | Event | Status | File |
|---|---|---|---|
| 1 | `homepage_loaded` | ✅ Implemented | `App.jsx:249` |
| 2 | `homepage_hero_cta_click` | ✅ Implemented | `Toolbar.jsx:40` |
| 3 | `comparison_viewed` | ✅ Implemented | `InstantComparison.jsx:304` |
| 4 | `better_nearby_found` | ✅ Implemented | `InstantComparison.jsx:311` |
| 5 | `stay_recommended` | ✅ Implemented | `RoutePlannerCard.jsx:257` |
| 6 | `move_recommended` | ✅ Implemented (assumed) | `RoutePlannerCard.jsx:263` |
| 7 | `homepage_instant_comparison_cta_click` | ✅ Implemented | `InstantComparison.jsx:323` |

---

## Section 10 — Gap and risk summary

<!-- Section 10/12 done -->

### Critical gaps

**GAP-1: `checkout_completed` never fires for normal Paddle checkout**
- Severity: Critical — this is the primary conversion signal for the funnel.
- Root cause: `Success.jsx` is not the Paddle success redirect destination. The checkout API sets `success_url = ${appBase}/?checkout=success`, which goes to the homepage. `useCheckoutFlow.js` handles `?checkout=success` on homepage mount but fires **no analytics event**.
- `Success.jsx` exists as a page but is either not in the route config for the Paddle return, or is a separate URL (`/success`) that Paddle is not configured to redirect to.
- Impact: The entire bottom of the funnel (`checkout_completed`) is dark. Revenue attribution, ROAS, conversion rate — all untracked.

**GAP-2: `purchase` GA4 recommended event not implemented**
- Severity: Medium — GA4 reports and Google Ads integration rely on this event for revenue tracking with `value` and `currency` fields.
- Root cause: Not implemented anywhere.

**GAP-3: `subscription_cta_clicked` fires before terms checkbox gate**
- Severity: Low-Medium — inflates CTA click counts vs. actual checkout attempts. In `Pricing.jsx`, `trackEvent("subscription_cta_clicked")` fires at line 108, then `if (!acceptedTerms) return` at line 116. A user can spam the button before accepting terms and generate multiple `subscription_cta_clicked` events without any corresponding `checkout_started`.
- Impact: `subscription_cta_clicked → checkout_started` ratio will appear worse than actual intent.

### Risks

**RISK-1: No consent gate**
- GDPR/ePrivacy concern for EU/EEA users. GA4 fires unconditionally.

**RISK-2: `homepage_loaded` double-fires in dev**
- StrictMode causes the `useEffect(fn, [])` to fire twice in dev. No guard. Not a production issue but can mislead during local testing.

**RISK-3: `subscription_cta_clicked` from Subscribe page does not include `lang` from `useT`**
- In `Subscribe.jsx`, `lang` is read from `localStorage.getItem("lang")` inline (line 114), rather than from the shared `useLanguage()` hook. Slight divergence from `Pricing.jsx` which receives `lang` as a prop.

**RISK-4: `readCheckoutSource()` in `Success.jsx` is fragile**
- Relies on sessionStorage surviving the Paddle redirect. This works in the same browser tab (cross-origin redirect preserves sessionStorage). However, if Paddle opens a new tab or the user returns to the site via a bookmark after checkout, sessionStorage is empty → `source` reports `"unknown"`.

**RISK-5: Attribution not propagated through Paddle success URL**
- The `success_url` (`/?checkout=success`) does not carry `?src=` or UTM params. The `TODO` comment in `checkoutSource.js:52` acknowledges this. Source attribution for `checkout_completed` depends entirely on sessionStorage.

---

## Section 11 — Implementation plan for free-v2

<!-- Section 11/12 done -->

The following changes are required to close the gaps identified above. Changes are ordered by priority.

### P0 — Fix `checkout_completed` black hole

**Option A (recommended): Fire `checkout_completed` in the `?checkout=success` handler**

In `src/hooks/useCheckoutFlow.js`, the `useEffect` that handles `?checkout=success` already calls `refetchMe()`. After `refetchMe()` confirms `entitlements.pro === true`, fire `checkout_completed`.

This approach requires no route changes and handles the actual Paddle return path.

Pseudocode:
```js
// In useCheckoutFlow.js, after checkout=success detected:
const result = await refetchMe();
if (result?.entitlements?.pro) {
  const plan = result?.subscription?.plan || "unknown";
  const source = readCheckoutSource();
  trackEvent("checkout_completed", { plan, billingCycle: plan, status: "active", source });
  trackEvent("purchase", { currency: "EUR", value: plan === "yearly" ? 24.99 : 4.99, plan });
}
```

**Option B:** Reconfigure Paddle success URL to point to `/success` route and ensure the route is registered in `AppRoutes.jsx`. Higher effort; requires Paddle dashboard change.

### P1 — Add `purchase` GA4 recommended event

Fire immediately after `checkout_completed`. Requires knowing the plan price. Both monthly (€4.99) and yearly (€24.99) prices are in `src/config/pricing.js` (or a prices config) — use those constants rather than hardcoding.

```js
trackEvent("purchase", {
  currency: "EUR",
  value: plan === "yearly" ? 24.99 : 4.99,
  transaction_id: /* not available client-side — omit or use sessionStorage from checkout body */,
  items: [{ item_name: `campcast_pro_${plan}`, price: plan === "yearly" ? 24.99 : 4.99, quantity: 1 }],
});
```

### P2 — Move `subscription_cta_clicked` after terms check in Pricing.jsx

Move the `trackEvent("subscription_cta_clicked", ...)` call in `Pricing.jsx:startCheckout` to after the `if (!acceptedTerms) return` guard (line 116), so it only fires when the user has actually accepted terms and intent is real.

### P3 — Propagate source through success URL

Add `?src=${encodeURIComponent(source)}` to the `success_url` in `api/checkout.js` when building the Paddle transaction. This makes `readCheckoutSource()` reliable even if sessionStorage is unavailable.

### P4 — Standardize `lang` sourcing in Subscribe.jsx

Replace `localStorage.getItem("lang")` inline with a prop or the `useLanguage()` hook to match Pricing.jsx and avoid staleness.

---

## Section 12 — Stop conditions

<!-- Section 12/12 done -->

The following conditions should stop or pause the implementation of free-v2 changes:

### Hard stops

1. **`checkout_completed` fires more times than `checkout_started`** — indicates a loop, duplicate fire, or the event is being fired outside the actual purchase flow. Stop and investigate before shipping.

2. **`purchase` event carries PII** — if `transaction_id` or any field includes user email or personal identifiers. Do not ship until confirmed clean.

3. **Consent gate is required** — if legal determines that GDPR consent is required before GA4 firing, all analytics changes must be blocked until a consent mechanism is in place. Implement consent gate first.

4. **`subscription_cta_clicked` drops significantly after P2 move** — a >30% drop suggests users were clicking the button without accepting terms more than expected. Validate the UX before shipping to avoid misreading the drop as a regression.

### Paddle stop condition (from task spec)

**Multiple paths sending `checkout_completed`?**
Current answer: **No** — `checkout_completed` is implemented in `Success.jsx` only (one call site, one guard). It does not fire from the normal checkout path at all (GAP-1). There is no risk of duplicate `checkout_completed` events from multiple paths in the current implementation. After P0 fix, there will be one call site (`useCheckoutFlow.js`) and one guard (check that `entitlements.pro` is true before firing). Ensure `Success.jsx` is not also reachable from the Paddle return URL after the fix, or it will duplicate.

### Measurement baseline (capture before any free-v2 change)

Before shipping any free-v2 change, capture 7-day baseline counts for:
- `pricing_page_viewed`
- `subscription_cta_clicked`
- `checkout_started`
- `checkout_completed` (expected: 0 or near-0 for normal flow)
- Session count and unique user count

After free-v2: compare `checkout_started → checkout_completed` ratio. Target: ≥ 80% (accounting for payment failures, user abandonment, and Paddle errors).
