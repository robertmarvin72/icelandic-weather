# Free-Tier Measurement Readiness Audit

**Audit date:** 2026-07-23  
**Branch:** main — commit `6eec37cf93ae92df4e3b191a07434f2067cefa43`  
**Audit type:** Read-only. No files modified.  
**Prior audit (reused):** `docs/analytics/free-to-pro-ga4-audit.md`

---

## Section 1 — Executive Conclusion

Three of the four planned Free-tier restrictions (#343, #344, #346) currently have **no usable GA4 baseline**. The fourth (#345 Best places this week) has only a partial baseline: `campsite_selected` fires when a user selects a site from the weekly ranking, but carries no property identifying the weekly ranking as the source, making it indistinguishable from any other site-selection interaction.

Tickets #343–#346 **should not be deployed** until analytics-only tracking changes are shipped and allowed to collect data for a minimum window (see Section 2).

---

## Section 2 — Deployment Readiness Decision

**C. Partial baseline only.**

| Ticket | Feature | Baseline status |
|---|---|---|
| #343 | Move hourly forecasts to Pro | ❌ No baseline event exists |
| #344 | Limit Free forecast to 3 days | ❌ No baseline event exists |
| #345 | Restrict "Best places this week" | ⚠️ Partial — `campsite_selected` fires but source is not identifiable |
| #346 | Restrict "Calmest places nearby" | ❌ No baseline event exists |

**What can be compared historically (without new tracking):**
- `pricing_page_viewed` — already fires with `source` (but `source` will be `"direct"` for Free-restriction upgrade flows since no `?src=` is set from these components)
- `subscription_cta_clicked` — already fires on the pricing page
- `checkout_started` — already fires
- `campsite_selected` — fires on all site changes but cannot isolate Top5Leaderboard as source

**What cannot be compared without new tracking:**
- Whether users currently open hourly forecasts (#343)
- Which forecast day index users interact with, and whether days 4–7 are used (#344)
- Whether site selections originate from the Top5Leaderboard vs other surfaces (#345)
- Whether users interact with WeatherFinder calmest results (#346)

**Recommendation:** Deploy a tracking-only release (analytics events only, no UI or feature changes) before deploying tickets #343–#346. Collect baseline data for a **minimum of 14 days** before deploying the restrictions, to capture both weekday and weekend camping traffic cycles.

---

## Section 3 — Current Analytics Architecture (Reused + Spot-Verified)

*Reused from Section 1 of `free-to-pro-ga4-audit.md`. Spot-verified below.*

**Primary helper:** `src/lib/analytics.js` — `trackEvent(name, data = {})`. All application events route through this function. Guard: `if (gaId)` only. No consent check.

**Spot-verification: no direct gtag or dataLayer.push calls bypass the helper.**
Search of `src/` for `gtag`, `dataLayer`, `window.plausible`, `sendBeacon` found only the `ReactGA` import inside `analytics.js` itself. No component bypasses `trackEvent()`.

**Route-view tracking:** `AnalyticsTracker.jsx` — listens to `location.pathname + location.search`, has `useRef(null)` StrictMode guard.

**Consent:** None. Confirmed still true (no new consent code found in any component audited for this report).

**Event-name constants:** None. Event names are string literals scattered across component files. No shared constants or property builder functions exist.

**Analytics mocks / test utilities:** None found. The test suite (`src/**/*.test.js`) does not include any analytics helper tests, event-emission tests, or mocks for `trackEvent`.

**Environment check:** In DEV, events also log to `console.log` AND still fire to GA4 if `VITE_GA_MEASUREMENT_ID` is set in `.env.local`. No DEV-only analytics guard.

---

Sections 1–3 written. Writing Ticket #343 findings.

---

## Section 4 — Ticket #343: Move Hourly Forecasts to Pro

### Feature description

Clicking any row in `ForecastTable` opens `HourlyForecastModal` with 3-hourly data for the selected day. This is currently available to all (Free) users.

### Interaction path

1. User clicks a forecast row in `ForecastTable` ([ForecastTable.jsx:243](src/components/ForecastTable.jsx#L243))  
   `onClick={() => onSelectDay?.(r)}`  
   Also: keyboard Enter/Space at line 245–248.

2. The `onSelectDay` prop maps to `handleOpenHourlyForecast` in [App.jsx:150](src/App.jsx#L150):
   ```js
   const handleOpenHourlyForecast = useCallback((dayRow) => {
     setSelectedHourlyDay(dayRow);
     setHourlyModalOpen(true);
   }, []);
   ```

3. `HourlyForecastModal` mounts with `day={selectedHourlyDay}`.

4. The modal fetches hourly data on mount (via `getForecast`) and renders 3-hourly rows.

### Current tracking

**None.** Neither `handleOpenHourlyForecast` nor `onSelectDay` nor `HourlyForecastModal` call `trackEvent` at any point. There is no GA4 event for:
- opening the hourly forecast modal
- selecting a specific day for hourly detail
- closing the modal
- viewing the "best weather window" summary

### Trigger quality

The `onSelectDay` handler fires on deliberate click only (not on render or visibility). Keyboard activation is also handled. No double-fire risk. The absence of tracking here is a clean gap, not a timing or duplicate issue.

### Mobile vs desktop

`ForecastTable` uses a single responsive `<table>` layout with `sm:hidden` / `hidden sm:inline` for column header variants. The click handler and `onSelectDay` callback are the same on both. There is no separate mobile interaction path.

### Day distinguishability

Each row in ForecastTable carries the full `r` object (including `r.date`, `r.dayLabel`, `r.points`, etc.). If a `forecast_day_opened` event were added at the `handleOpenHourlyForecast` callsite, `dayRow.date` and a day-index (computed from position in `rows`) could both be included as properties. Today there is no such event.

### Baseline usability

No historical GA4 data can serve as a pre-change baseline for hourly forecast usage.

### Classification: **C — Not tracked**

---

Ticket #343 done.

---

## Section 5 — Ticket #344: Limit Free Forecast to Three Days

### Feature description

`ForecastTable` renders all 7 forecast days as clickable rows. The planned change will limit Free users to the first 3 days, locking or hiding days 4–7.

### Interaction path

ForecastTable receives `rows` (the full `rowsWithDay` array from App.jsx, derived from the 7-day Open-Meteo forecast). Each row triggers `onSelectDay?.(r)` on click. There is no day-count guard in `ForecastTable` itself — it renders every row it receives.

The row data object (`r`) contains `r.date`, `r.dayLabel`, and all forecast fields. Day index (0–6) is not explicitly present in the row object but can be derived as the row's array index.

### Current tracking

**None.** No `trackEvent` exists in `ForecastTable`, in `handleOpenHourlyForecast`, or in any row-click path.

There is no existing event for:
- selecting any forecast day
- viewing forecast content for days 4–7
- hovering or scrolling to days 4–7

The `campsite_selected` event fires when `siteId` changes (via `useEffect` on `siteId`), but changing the day within the forecast table does not change `siteId`. Day selection and site selection are entirely separate interactions.

### Day 1–3 vs day 4–7 distinguishability

Currently: **not distinguishable**. There is no event for clicking any forecast row, so historical data provides no signal for demand on days 4–7.

### Keyboard / accessibility

`ForecastTable` rows have `onKeyDown` handlers for Enter and Space at lines 244–249 (same `onSelectDay` callback). No separate analytics for keyboard vs mouse.

### Baseline usability

No historical GA4 data can measure demand for extended-forecast days.

### Classification: **C — Not tracked**

---

Ticket #344 done.

---

## Section 6 — Ticket #345: Restrict "Best Places This Week"

### Feature description

`Top5Leaderboard` renders the top-ranked campsites by weekly weather score. Free users currently see ranks 1–3 (with ranks 4–5 shown as locked `🔒` placeholders). The title `top5Title` translates to "Bestu staðirnir þessa vikuna" (IS) = "Best places this week." The planned restriction will further limit Free access.

### Interaction path — site selection from ranking

1. User clicks a visible row in Top5Leaderboard ([Top5Leaderboard.jsx:203](src/components/Top5Leaderboard.jsx#L203)):  
   `onClick={() => onSelectSite(item.site.id)}`

2. `onSelectSite` maps to `handleSelectSite` in [App.jsx:142](src/App.jsx#L142):
   ```js
   const handleSelectSite = useCallback((id) => {
     setSiteId(id);
     mapAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
   }, [setSiteId]);
   ```

3. This changes `siteId` state, which triggers the `useEffect` at [App.jsx:257–264](src/App.jsx#L257):
   ```js
   useEffect(() => {
     if (initialSiteRef.current) { initialSiteRef.current = false; return; }
     if (!siteId || !site) return;
     trackEvent("campsite_selected", { siteId, siteName: site.name });
   }, [siteId, site]);
   ```

`campsite_selected` fires with `{ siteId, siteName }` — **no `source` property** indicating that the selection came from the weekly ranking.

### Source ambiguity of campsite_selected

`handleSelectSite` is called from **multiple independent surfaces**:

| Surface | File | Trigger |
|---|---|---|
| `Top5Leaderboard` | Top5Leaderboard.jsx:203 | Click on ranked site row |
| `PageHeader > CampsitePicker` | CampsitePicker.jsx:69 | Dropdown selection |
| `RoutePlannerCard` | RoutePlannerCard.jsx:1189 | Click on route result |
| `LazyMap` | App.jsx:453 | Map marker click (`setSiteId(id)` directly) |
| `useMyLocationNearestSite` | useMyLocationNearestSite.js:48 | GPS nearest site |

All paths share the same `handleSelectSite` → `setSiteId` → `campsite_selected` chain. The event cannot be attributed to any particular surface.

### Interaction path — upgrade CTA

Free users see an upgrade button at the bottom of Top5Leaderboard (when not Pro):
```jsx
<button onClick={handleCtaClick} ...>
```
`handleCtaClick` ([Top5Leaderboard.jsx:129–146](src/components/Top5Leaderboard.jsx#L129)) calls `onUpgrade()` → `startCheckout()` in [useCheckoutFlow.js:5–26](src/hooks/useCheckoutFlow.js#L5).

`startCheckout()` navigates to `/pricing?email=...` but does **not** call `trackEvent` at any point. No `?src=` parameter is set in the URL. On the pricing page, `pricing_page_viewed` fires with `source: params.get("src") || "direct"` — so upgrading from Top5Leaderboard appears as `source: "direct"` in GA4.

### Rank position tracking

No rank position is sent with any event. There is no `{ rank: idx + 1 }` or `{ feature: "weekly_ranking" }` property anywhere.

### Distinguishability from other site selections

`campsite_selected` is not distinguishable as originating from the weekly ranking. It would require a `source` property added at the Top5Leaderboard click site.

### Baseline usability

- `campsite_selected` events exist but **cannot isolate** Top5Leaderboard selections.
- No upgrade-click event from this surface.

### Classification: **B — Partially tracked**

`campsite_selected` fires on click, but carries no source property distinguishing it from other site-selection surfaces. The weekly ranking's contribution to site selections is unmeasurable with current data.

---

Ticket #345 done.

---

## Section 7 — Ticket #346: Restrict "Calmest Places Nearby"

### Feature description

`WeatherFinder` renders a ranked list of campsites filtered by mode (calmest / warmest / driest) and radius. The "calmest" mode title is `weatherFinderResultTitleCalmest: "Calmest nearby campsites"` (EN) / `"Rólegustu staðirnir í nágrenninu"` (IS). This is the "Calmest places nearby" feature referenced in ticket #346.

Free users currently see:
- Top 3 results only (`resultsLimit = getFeatureLimit("weatherFinderResultsCount", entitlements) ?? 3`)
- No radius or days controls (controls are shown only for Pro: lines 99–132 in WeatherFinder.jsx)
- An upgrade CTA button at the bottom

### Interaction paths

**Mode switching (calmest / warmest / driest):**  
Three buttons at [WeatherFinder.jsx:87–95](src/components/WeatherFinder.jsx#L87).  
`onClick={() => setMode(m)}` — no `trackEvent`. No analytics.

**Result items (WeatherFinderCard):**  
[WeatherFinderCard.jsx:25–35](src/components/WeatherFinderCard.jsx#L25). This is a **display-only card** with no `onClick` handler, no navigation, and no trackEvent. Clicking a campsite name in WeatherFinder does nothing — the card is not interactive.

**"Show full ranking" expand button:**  
[WeatherFinder.jsx:156–162](src/components/WeatherFinder.jsx#L156).  
`onClick={() => setShowAll((v) => !v)}` — no `trackEvent`. No analytics.

**Upgrade CTA (Free users):**  
[WeatherFinder.jsx:172–176](src/components/WeatherFinder.jsx#L172).  
`onClick={() => typeof onUpgrade === "function" && onUpgrade()}`  
→ `startCheckout()` in `useCheckoutFlow.js` → `navigate('/pricing?email=...')` — no `trackEvent` at any point in this chain. Source: `"direct"` on pricing page.

### Current tracking

**None.** No `trackEvent` exists anywhere in `WeatherFinder.jsx` or `WeatherFinderCard.jsx`. There is no GA4 event for:
- Viewing the WeatherFinder component
- Switching between calmest/warmest/driest modes
- Expanding to full ranking
- Clicking the upgrade CTA from WeatherFinder
- Any interaction with result items (which are not interactive anyway)

### Mobile vs desktop

`WeatherFinder` uses a single responsive layout. No separate mobile interaction path exists.

### Relation to InstantComparison

`InstantComparison` also shows "nearby" data (`comparison_viewed`, `better_nearby_found` events exist there), but it is a head-to-head comparison panel for the current site vs one nearby candidate — it is a separate component and separate feature from WeatherFinder's ranked list. The `comparison_viewed` event does not reflect WeatherFinder usage.

### Baseline usability

No historical GA4 data can measure any WeatherFinder interaction.

### Classification: **C — Not tracked**

---

Ticket #346 done.

---

## Section 8 — Free Interaction Coverage Matrix

| Ticket | Current Free interaction | Route/component | Current event | Current properties | Baseline usable? | Classification | Confirmed issue | Minimum analytics change |
|---|---|---|---|---|---|---|---|---|
| #343 | Click forecast row → opens HourlyForecastModal | `/` / `ForecastTable.jsx:243` + `App.jsx:150` | None | — | ❌ No | C — Not tracked | No event exists for opening hourly forecast | Add `forecast_day_opened` in `handleOpenHourlyForecast` (App.jsx:150) with `{ dayIndex, date, siteId }` |
| #344 | Click forecast row days 1–7 | `/` / `ForecastTable.jsx:243` | None | — | ❌ No | C — Not tracked | No event for any day click; days 4–7 not isolable | Same as #343 event (add `dayIndex` so days 4–7 can be filtered); add separate `extended_forecast_day_clicked` if hourly-open and day-select semantics differ |
| #345 | Click site in Top5Leaderboard | `/` / `Top5Leaderboard.jsx:203` | `campsite_selected` (via App.jsx useEffect) | `siteId`, `siteName` | ⚠️ Partial | B — Partially tracked | `source` property absent; not isolable from other site-selection surfaces | Add `source: "weekly_ranking"` to `campsite_selected` at the Top5Leaderboard click callsite, OR add `weekly_ranking_site_clicked` with `{ siteId, siteName, rank }` in Top5Leaderboard |
| #346 | View/interact with WeatherFinder | `/` / `WeatherFinder.jsx` | None | — | ❌ No | C — Not tracked | No event for any WeatherFinder interaction; result items have no onClick | Add `weather_finder_viewed` on mount (with StrictMode guard), `weather_finder_mode_changed` on mode switch |
| — | Pricing page viewed | `/pricing` / `Pricing.jsx:48` | `pricing_page_viewed` | `source`, `lang`, `isPro` | ✅ Yes | A — Fully tracked | `source` = `"direct"` for all Free-restriction upgrade paths (no `?src=` passed) | Add `?src=weekly_ranking`, `?src=weather_finder`, etc. to upgrade navigations from restricted components |
| — | Monthly subscription CTA | `/pricing` / `Pricing.jsx:108` | `subscription_cta_clicked` | `plan:"monthly"`, `billingCycle`, `source`, `lang` | ✅ Yes | A — Fully tracked | Fires before terms gate (prior audit GAP-3) | — |
| — | Annual subscription CTA | `/pricing` / `Pricing.jsx:108` | `subscription_cta_clicked` | `plan:"yearly"`, `billingCycle`, `source`, `lang` | ✅ Yes | A — Fully tracked | Fires before terms gate (prior audit GAP-3) | — |

---

Coverage matrix done.

---

## Section 9 — Pricing-Page Coverage

*Reused from the prior audit (Sections 3 and 9). Spot-verified.*

**`pricing_page_viewed`** fires at [Pricing.jsx:48](src/pages/Pricing.jsx#L48) via `useEffect(fn, [])` guarded by `viewFiredRef.current`. Fires exactly once per Pricing page mount.

**Source value for Free-restriction upgrade flows:**  
`startCheckout()` in `useCheckoutFlow.js` navigates to `/pricing?email=...` with no `?src=` param. `pricing_page_viewed` will record `source: "direct"` for users arriving via any Free-restriction upgrade CTA (Top5Leaderboard, WeatherFinder, or future locked-feature CTAs). This means upgrade-driven pricing visits are indistinguishable from direct `/pricing` navigation in current GA4 data.

**Icelandic and English routes:**  
`/pricing` is a single route (AppRoutes.jsx:159). The `lang` property on `pricing_page_viewed` captures the active language. Both IS and EN users fire the same event with `lang` distinguishing them.

**Both CTAs emit `subscription_cta_clicked`:**  
Both the monthly and yearly buttons in Pricing.jsx call `startCheckout(chosenPlan)` which fires `trackEvent("subscription_cta_clicked", { plan, billingCycle, source, lang })` at line 108. Both plans are covered. One click → one event (no double-fire; `busy` state guards re-entry).

**Direct visits vs upgrade-driven visits:**  
Currently not distinguishable (see source finding above). Adding `?src=` to upgrade navigations from restricted components would fix this.

---

## Section 10 — Existing Relevant GA4 Events and Properties

All events confirmed to exist in `src/` as of audit date:

| Event name | File | Trigger | Properties |
|---|---|---|---|
| `homepage_loaded` | App.jsx:249 | `useEffect(fn,[])` on mount | `lang`, `isPro`, `mobile` |
| `homepage_hero_cta_click` | Toolbar.jsx:40 | Click "Find better place" button | _(none)_ |
| `comparison_viewed` | InstantComparison.jsx:304 | Effect when nearby comparison shown | `comparisonTier`, `distanceBucket`, `recommendation` |
| `better_nearby_found` | InstantComparison.jsx:311 | Same effect, when improvement ≥ "decent" | `recommendation`, `comparisonTier`, `radiusKm` |
| `homepage_instant_comparison_cta_click` | InstantComparison.jsx:323 | Scroll CTA click | _(none)_ |
| `stay_recommended` | RoutePlannerCard.jsx:257 | Effect when verdict = "stay" | `recommendation`, `radiusKm`, `windowDays` |
| `move_recommended` | RoutePlannerCard.jsx:263 | Effect when verdict = "move" | `recommendation`, `radiusKm`, `windowDays` |
| `campsite_selected` | App.jsx:263 | Effect on `siteId` change | `siteId`, `siteName` |
| `comparison_feature_viewed` | CampsiteComparisonSection.jsx:359 | Effect on mount | `lang`, `isPro`, `source:"homepage"` |
| `comparison_campsites_selected` | CampsiteComparisonSection.jsx:369 | Effect when both sites chosen | `lang`, `siteA`, `siteB` |
| `comparison_day_expanded` | CampsiteComparisonSection.jsx:519 | Click to expand day row | (not fully read) |
| `comparison_upgrade_clicked` | CampsiteComparisonSection.jsx:115 | Click paywall CTA in comparison | `lang`, `source:"comparison"` |
| `brochure_comparison_cta_click` | Brochure.jsx:79 | Click brochure CTA | `lang`, `source:"brochure_comparison"` |
| `pricing_page_viewed` | Pricing.jsx:48 | Effect on Pricing mount | `source`, `lang`, `isPro` |
| `subscription_cta_clicked` | Pricing.jsx:108, Subscribe.jsx:110 | Button click | `plan`, `billingCycle`, `source`, `lang` |
| `upgrade_started` | Pricing.jsx:126 | Inside startCheckout (monthly→yearly) | `fromTier`, `toTier`, `billingCycle` |
| `checkout_started` | Pricing.jsx:216, Subscribe.jsx:162 | After /api/checkout success | `plan`, `billingCycle`, `priceIdType`, `source` |
| `upgrade_completed` | Pricing.jsx:202 | Monthly→yearly upgrade confirmed | `fromTier`, `toTier`, `billingCycle` |
| `checkout_completed` | Success.jsx:20 | Effect when status="active" | `plan`, `billingCycle`, `status`, `source` |
| `cancellation_started` | useCheckoutFlow.js:34, Success.jsx:106 | Billing portal click | `source`, `currentTier` |

**Events checked that do NOT exist:**
- `hourly_forecast_locked_clicked` — does not exist
- `extended_forecast_upgrade_clicked` — does not exist
- `weekly_ranking_upgrade_clicked` — does not exist
- `nearby_results_upgrade_clicked` — does not exist
- `better_location_upgrade_clicked` — does not exist
- `travel_advisor_upgrade_clicked` — does not exist
- `forecast_day_opened` — does not exist
- `weather_finder_viewed` — does not exist
- `weather_finder_mode_changed` — does not exist

---

## Section 11 — Existing Attribution

*Reused from prior audit Section 4. New findings below.*

**UTM attribution** captured at landing via `saveAttributionIfPresent()` → `localStorage["campcast_attribution"]`. First-touch only. Passed to Paddle checkout body.

**Checkout source** captured via `resolveCheckoutSource()` → `sessionStorage["checkout_source"]`.

**Free-restriction upgrade flows and source:**  
`startCheckout()` in `useCheckoutFlow.js` navigates to `/pricing?email=...` with no `?src=` parameter. `resolveCheckoutSource()` priority is: `?src=` → sessionStorage → route fallback. With no `?src=` and no stored value, it falls back to `routeSource(pathname)`, which for `/pricing` returns `"pricing"`. So the `source` on `subscription_cta_clicked` from the pricing page will be `"pricing"`, not the originating feature (weekly ranking, weather finder, etc.).

**Monthly and annual CTA source consistency:**  
Both CTAs in Pricing.jsx call `resolveCheckoutSource()` at the start of `startCheckout(chosenPlan)` (line 105). The same source value is used for both plans. Source consistency is guaranteed between the two CTAs on the same pricing page visit.

**Stale source values:**  
`sessionStorage["checkout_source"]` is cleared when the session ends (tab close). A user who visits from the brochure (`source: "brochure"`), then later navigates to pricing directly, will retain `source: "brochure"` in sessionStorage until the tab closes. The stored value can persist across page navigations within the same session, potentially misattributing a later direct pricing visit as brochure-sourced. This is a pre-existing behavior, not introduced by this audit's findings.

**Attribution survival through new events:**  
Adding new `trackEvent()` calls inside existing component click handlers would not affect localStorage or sessionStorage. No attribution mechanism would be lost or corrupted by adding new events through the existing helper.

---

## Section 12 — Duplicate or Trigger-Quality Risks

*Events not previously assessed in the prior audit:*

**`stay_recommended` and `move_recommended` (RoutePlannerCard.jsx:253–269):**  
Both are guarded by `lastDecisionRef.current` (a ref that stores the last verdict). They fire only when `decisionLower` changes and differs from the last-recorded value. This prevents re-firing on re-renders. Trigger is correct — fires on deliberate route-planner result change, not on render. **Quality: Good.**

**`campsite_selected` (App.jsx:257–264):**  
Guarded by `initialSiteRef.current` to skip the first render. Fires once per `siteId` change. Not on render. No duplicate risk. BUT: does not carry `source` property — see Section 6 for impact on #345. **Trigger quality: Good. Property quality: Insufficient for #345.**

**`comparison_feature_viewed` (CampsiteComparisonSection.jsx:359):**  
Noted in prior audit as potentially at risk for StrictMode double-fire. Not re-audited here — not relevant to tickets #343–#346.

**New events that will need StrictMode guards:**  
Any new event fired from a `useEffect` in a newly tracked component should use a `useRef` guard pattern (as used by `viewFiredRef` in Pricing.jsx, `comparisonFiredRef` in InstantComparison.jsx, `checkoutFiredRef` in Success.jsx). Specifically:  
- If `weather_finder_viewed` is implemented in a `useEffect`, it needs a ref guard.
- Events fired from click handlers do not need StrictMode guards.

---

## Section 13 — Consent Observations

*Reused from prior audit Section 5.*

No consent gate exists. `trackEvent()` fires whenever `gaId` is set, unconditionally. **Confirmed still true** — no new consent code found in any component audited.

Adding new events through the existing `trackEvent()` helper **preserves current behavior exactly** — no change to the consent posture. New events would not make the situation meaningfully different (better or worse) from a consent-compliance standpoint.

No analytics code bypasses the `trackEvent()` helper in any component audited here.

---

## Section 14 — Existing Test Coverage

**Analytics helper (`src/lib/analytics.js`):** No test file exists.

**Event emission in components:** No tests assert that `trackEvent` is called in any component. There are no mock implementations of `trackEvent` in the test suite.

**Free-feature component tests:**
- `ForecastTable.jsx`: No test file.
- `HourlyForecastModal.jsx`: No test file.
- `Top5Leaderboard.jsx`: No test file.
- `WeatherFinder.jsx`: No test file.
- `WeatherFinderCard.jsx`: No test file.

**Existing test files (from glob):**
- `src/utils/distance.test.js` — geometry utility, not analytics
- `src/lib/scoring.*.test.js` — scoring engine, not analytics
- `src/lib/relocationEngine.*.test.js` — route planner engine, not analytics
- `src/lib/weatherFinderRanking.test.js` — ranking algorithm, not analytics
- `src/utils/compareCampsiteForecasts.test.js` — comparison helper, not analytics
- `src/pages/BlogPostPage.test.jsx` — blog page rendering, not analytics

**Summary:** Zero tests cover analytics event emission, event properties, duplicate-prevention, mobile/desktop variants, or navigation-event ordering for any of the features affected by tickets #343–#346.

---

## Section 15 — Confirmed Missing Baseline Tracking

The following events do not exist in the current codebase and are required to establish pre-restriction baselines:

| Missing event | Ticket | What it would measure | Required before restriction? |
|---|---|---|---|
| `forecast_day_opened` | #343 + #344 | User opening hourly modal for any day | ✅ Yes |
| `forecast_day_index` property on `forecast_day_opened` | #344 | Whether user selected day 0–2 vs 3–6 | ✅ Yes |
| `source: "weekly_ranking"` on `campsite_selected` OR a distinct `weekly_ranking_site_clicked` event | #345 | Site clicks originating from Top5Leaderboard | ✅ Yes |
| `weather_finder_viewed` | #346 | Whether Free users reach the WeatherFinder section | ✅ Yes |
| `weather_finder_mode_changed` | #346 | Whether Free users switch to calmest/warmest/driest | ✅ Yes (demand signal) |

---

## Section 16 — Confirmed Missing Post-Restriction Tracking

These events do not exist and will be needed after the restrictions are deployed to measure the locked-feature experience:

| Missing event | Ticket | What it would measure | Add before or after restriction? |
|---|---|---|---|
| `hourly_forecast_locked_clicked` | #343 | Locked hourly CTA clicks from Free users | After restriction (not needed for baseline) |
| `extended_forecast_upgrade_clicked` | #344 | Clicks on the "Upgrade for days 4–7" CTA | After restriction |
| `weekly_ranking_upgrade_clicked` | #345 | Clicks on the Top5Leaderboard upgrade button | After restriction (but `source` fix to pricing needed now) |
| `weather_finder_upgrade_clicked` | #346 | Clicks on the WeatherFinder upgrade button | After restriction (but `source` fix to pricing needed now) |

**Note on upgrade CTAs:** The Top5Leaderboard and WeatherFinder upgrade buttons currently produce no event and navigate to `/pricing` with `source:"direct"`. Even without a dedicated `*_upgrade_clicked` event, adding `?src=weekly_ranking` or `?src=weather_finder` to the navigation URL would make `pricing_page_viewed` (`source:"weekly_ranking"`) a usable proxy for upgrade intent from those surfaces — both before and after the restriction. This is the highest-value, lowest-effort fix.

---

## Section 17 — Minimum Recommended Implementation

**Analytics-only changes only. No Paddle, checkout, entitlement, or UI changes.**

Listed in implementation priority order:

### PR-ANALYTICS-1: Add `forecast_day_opened` event (covers #343 and #344)

**File to modify:** `src/App.jsx`  
**Where:** `handleOpenHourlyForecast` callback ([App.jsx:150](src/App.jsx#L150))  
**Change:** Add `trackEvent("forecast_day_opened", { dayIndex, date, siteId })` immediately before `setHourlyModalOpen(true)`.

```js
// Approximate location — do not implement during this audit
const handleOpenHourlyForecast = useCallback((dayRow, dayIndex) => {
  trackEvent("forecast_day_opened", {
    dayIndex,      // 0–6; allows filtering days 4–7
    date: dayRow?.date,
    siteId,
  });
  setSelectedHourlyDay(dayRow);
  setHourlyModalOpen(true);
}, [siteId]);
```

`ForecastTable.jsx` would need to pass the row index to `onSelectDay`. This is an analytics-only change — no UI change, no gating change.

**Why existing tracking is insufficient:** No event exists at all.  
**Needed for pre-change baseline:** ✅ Yes.  
**Test to add:** Verify `trackEvent` called with correct `dayIndex` when `handleOpenHourlyForecast` invoked; verify `dayIndex >= 3` for days 4–7.

### PR-ANALYTICS-2: Add `source` property to campsite selections from Top5Leaderboard (covers #345)

**Two options — choose one:**

**Option A (preferred):** Add a `source: "weekly_ranking"` and `rank: idx + 1` property by calling a separate `trackEvent("weekly_ranking_site_clicked", { siteId: item.site.id, siteName: item.site.name, rank: idx + 1 })` inside `Top5Leaderboard.jsx` at the click site (line 203), before calling `onSelectSite`.  
**File to modify:** `src/components/Top5Leaderboard.jsx`

**Option B:** Lift source context up and thread it through `onSelectSite` → `handleSelectSite` and into `campsite_selected`. Higher refactor surface, not preferred.

**Why existing tracking is insufficient:** `campsite_selected` fires but cannot isolate Top5Leaderboard as source.  
**Needed for pre-change baseline:** ✅ Yes.  
**Test to add:** Verify `weekly_ranking_site_clicked` fires with `rank` on row click; verify `campsite_selected` still fires (not replaced).

### PR-ANALYTICS-3: Add `?src=` to upgrade navigations from Top5Leaderboard and WeatherFinder (covers #345 and #346 upgrade attribution)

**Files to modify:** `src/hooks/useCheckoutFlow.js` (or pass `src` param through `onUpgrade`)  
**Change:** Accept an optional `src` parameter in `startCheckout()` and append it to the navigation URL:  
`navigate('/pricing?email=...&src=weekly_ranking')` or `?src=weather_finder`

This makes `pricing_page_viewed { source: "weekly_ranking" }` a usable upgrade-intent proxy for both before and after the restriction.

**Why existing tracking is insufficient:** All upgrade paths from restricted components record `source:"direct"` on the pricing page.  
**Needed for pre-change baseline:** ✅ Yes (to distinguish organic vs upgrade-driven pricing visits).  
**Test to add:** Verify navigation URL includes `?src=` with correct value.

### PR-ANALYTICS-4: Add `weather_finder_viewed` event (covers #346 baseline)

**File to modify:** `src/components/WeatherFinder.jsx`  
**Where:** `useEffect(fn, [])` on mount, with StrictMode guard (`useRef(false)`)  
**Properties:** `{ mode, isPro, resultsLimit }`

**Why existing tracking is insufficient:** No event exists for any WeatherFinder interaction.  
**Needed for pre-change baseline:** ✅ Yes — without this, there is no signal that Free users even see WeatherFinder results.  
**Test to add:** Verify event fires once on mount; verify guard prevents double-fire.

### PR-ANALYTICS-5 (optional, lower priority): Add `weather_finder_mode_changed` event (covers #346 demand measurement)

**File to modify:** `src/components/WeatherFinder.jsx`  
**Where:** Mode button `onClick` handler (line 92)  
**Properties:** `{ mode, previousMode, isPro }`

**Why useful:** Signals whether Free users actively interact with WeatherFinder or only see the default calmest view.  
**Needed for pre-change baseline:** Useful but not strictly required if `weather_finder_viewed` alone is sufficient for the before/after comparison.

---

## Section 18 — Files Likely to Require Changes

| File | Change required | Ticket(s) |
|---|---|---|
| `src/App.jsx` | Add `trackEvent("forecast_day_opened", ...)` in `handleOpenHourlyForecast` | #343, #344 |
| `src/components/ForecastTable.jsx` | Pass row index to `onSelectDay` callback | #343, #344 |
| `src/components/Top5Leaderboard.jsx` | Add `weekly_ranking_site_clicked` event on row click | #345 |
| `src/hooks/useCheckoutFlow.js` | Accept optional `src` param and pass to navigation URL | #345, #346 |
| `src/components/WeatherFinder.jsx` | Add `weather_finder_viewed` (and optionally `weather_finder_mode_changed`) | #346 |

All changes are confined to adding `trackEvent()` calls and wiring a `src` parameter. No logic changes, no gating changes, no checkout changes.

---

## Section 19 — Files That Must Remain Untouched

As required by the task constraints, the following must not be modified as part of the analytics implementation:

- `api/checkout.js` — Paddle checkout
- `api/paddle-webhook.js` — webhook handler
- `api/billing-portal.js` — billing portal
- `src/lib/attribution.js` — UTM attribution (no changes needed)
- `src/config/features.js` — feature gating (do not implement restrictions)
- `src/hooks/useMe.js` — user/entitlements hook
- `src/pages/Pricing.jsx` — unless only adding `?src=` navigation (see PR-ANALYTICS-3)
- `src/pages/Subscribe.jsx`
- `src/pages/Success.jsx`
- `src/lib/scoring.js`
- Any relocation engine or scoring files

---

## Section 20 — Open Questions or Blockers

1. **Does "Restrict Calmest places nearby" (#346) mean locking WeatherFinder entirely for Free users, or reducing results further?** The current behavior already limits Free users to 3 results. The analytics plan above covers both scenarios (WeatherFinder viewed by Free users = baseline regardless of restriction depth).

2. **Does "Restrict Best places this week" (#345) mean removing all visible rows from Top5Leaderboard for Free users (not just 4–5), or something else?** The analytics plan covers site-click baseline regardless of how deeply the restriction is applied.

3. **What constitutes a meaningful "before" period?** 14 days is the recommended minimum for camping traffic patterns. If the restriction deploys during peak season (July–August), a shorter window (7 days) may be acceptable given higher traffic volume, but weekend vs weekday ratio should be verified in GA4.

4. **Are there any additional entry points to hourly forecast or weekly ranking outside of the main App.jsx homepage?** A quick search found no other routes rendering `ForecastTable` or `Top5Leaderboard` outside the main homepage component. The map view (`MapView.jsx`) was not audited in detail.

5. **`checkout_completed` remains broken for normal checkout** (prior audit GAP-1). This does not block the Free-tier measurement work but remains an open defect.

---

## Section 21 — Final Decision Summary

**Deployment readiness: C — Partial baseline only.**

### Events that already work and should not be changed

- `pricing_page_viewed` — fires correctly on Pricing mount with `source`, `lang`, `isPro`
- `subscription_cta_clicked` — fires for both monthly and annual CTAs on Pricing and Subscribe
- `checkout_started` — fires after successful /api/checkout response
- `comparison_viewed`, `better_nearby_found`, `homepage_instant_comparison_cta_click` — all correct for InstantComparison (not affected by #343–#346)
- `stay_recommended`, `move_recommended` — correct for RoutePlannerCard
- `homepage_loaded`, `homepage_hero_cta_click` — correct for homepage funnel
- `campsite_selected` — fires correctly; needs a `source` property added at Top5Leaderboard specifically

### Partially implemented events

- `campsite_selected` — fires on all site changes but has no `source` property distinguishing Top5Leaderboard from other selection surfaces. **Partial** for #345 purposes.

### Missing current Free baseline events (must be added before restrictions deploy)

1. `forecast_day_opened` with `dayIndex` property — for #343 and #344
2. `weekly_ranking_site_clicked` with `rank` property — for #345 (or `source: "weekly_ranking"` on `campsite_selected`)
3. `weather_finder_viewed` — for #346
4. `?src=weekly_ranking` and `?src=weather_finder` on upgrade navigations — for attribution of pricing visits from restricted surfaces

### Missing future locked-feature events (only needed after restrictions deploy)

- `hourly_forecast_locked_clicked` (#343)
- `extended_forecast_upgrade_clicked` (#344)
- `weekly_ranking_upgrade_clicked` (#345)
- `weather_finder_upgrade_clicked` (#346)

These are **not** blocking the baseline collection window.

### Minimum files requiring later changes

1. `src/App.jsx` — add `forecast_day_opened` event
2. `src/components/ForecastTable.jsx` — pass row index to `onSelectDay`
3. `src/components/Top5Leaderboard.jsx` — add `weekly_ranking_site_clicked` event
4. `src/hooks/useCheckoutFlow.js` — accept and pass `src` param
5. `src/components/WeatherFinder.jsx` — add `weather_finder_viewed` event

### Whether the later implementation can be limited to analytics calls and tests

**Yes.** All required baseline events can be added through `trackEvent()` calls in existing component click handlers and effect hooks. No Paddle, checkout, webhook, entitlement, or UI logic changes are required. All changes are additions — no existing behavior is modified.

### Whether tickets #343–#346 should remain blocked pending tracking deployment

**Yes. All four tickets should remain blocked** until:
1. The analytics changes (PR-ANALYTICS-1 through PR-ANALYTICS-4) are deployed
2. A minimum 14-day collection window has elapsed
3. The baseline event counts are manually verified in GA4 (see Section 2)

The 14-day window should begin on the day the analytics-only deployment goes live, not retroactively from any prior date.

---

## Implementation Notes

**Implemented:** 2026-07-23

The following baseline events have been added in a single analytics-only PR (no gating changes, no UI changes, no checkout changes):

| Event | File | Callsite | Properties |
|---|---|---|---|
| `forecast_day_opened` | `src/App.jsx` | `handleOpenHourlyForecast` | `dayIndex` (0-based), `date`, `siteId` |
| `weekly_ranking_site_clicked` | `src/components/Top5Leaderboard.jsx` | row `onClick`, before `onSelectSite` | `siteId`, `siteName`, `rank` (1-based) |
| `weather_finder_mode_changed` | `src/components/WeatherFinder.jsx` | mode button `onClick`, guard: `m !== mode` | `mode`, `previousMode`, `isPro` |
| `weather_finder_expanded` | `src/components/WeatherFinder.jsx` | expand button `onClick`, guard: `!showAll` | `mode`, `isPro`, `resultsLimit` |

**src attribution wired:** `startCheckout(src)` in `src/hooks/useCheckoutFlow.js` now accepts an optional `src` string and appends it to the `/pricing` URL via `URLSearchParams`. `Top5Leaderboard` passes `"weekly_ranking"` and `WeatherFinder` passes `"weather_finder"` — making `pricing_page_viewed { source }` distinguishable for upgrade flows from those two surfaces.

**`weather_finder_viewed` not implemented:** Decided against a mount-time event on a homepage component; it measures rendering, not usage. The mode-changed and expanded events are stronger usage signals.

**`campsite_selected` unchanged:** The existing event in `App.jsx` fires exactly as before. `weekly_ranking_site_clicked` is an additional event, not a replacement.

**ForecastTable callback updated:** `onSelectDay(row, idx)` now passes the zero-based row index as the second argument. All three call sites (click + Enter + Space) were updated. The `handleOpenHourlyForecast` dependency array includes `siteId` to capture the current site at the time of the click.

**14-day collection window:** Starts on the date this PR is deployed to production. Tickets #343–#346 remain blocked until 14 days of baseline data have been collected and verified in GA4.

**Test coverage:** 32 new test cases across 4 new test files. All 200 tests pass. Lint clean, build clean.

This change preserves the application's existing analytics and consent behavior. It does not introduce a new consent mechanism and does not resolve the known consent limitation. All new events use the existing analytics helper and must not include personally identifiable information.
