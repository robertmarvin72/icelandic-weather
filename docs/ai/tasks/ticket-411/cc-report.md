# #411 — CC execution report

Executed against `docs/ai/tasks/ticket-411/approved-prompt-v1.md` (Jonesy APPROVED Round 2). Read `docs/ai/README.md` and `docs/ai/CURRENT.md` fresh before starting; confirmed `CURRENT.md` referenced this prompt at `READY_FOR_CC` and set `Stage: CC_IN_PROGRESS` before any edit.

## Objective, restated

Adapt the homepage hero (Toolbar.jsx) to three owner-approved seasonal presentation variants — `winter_weather_aurora` (Sept-March, weather + aurora mention), `winter_weather` (April, weather only), `summer_camping` (May-Aug, unchanged existing copy) — without touching the decision flow, scoring, Aurora feature gate, or any protected data path. Add one new analytics event, `homepage_primary_cta_clicked`, alongside the existing unchanged `homepage_hero_cta_click`.

## Read-only audit performed before implementation

- `src/components/Toolbar.jsx` — confirmed the hero (title/subtitle/CTA) is entirely owned here; `scrollToComparison()` scrolls to `#comparison-section` with `{behavior:"smooth", block:"start"}` then calls `trackEvent("homepage_hero_cta_click")` with no metadata; a separate `season = getSeasonForDate(new Date())` (browser-local Oct-April) drives only the small ❄ hint/badge beneath the hero, unrelated to the hero copy itself.
- `src/components/PageHeader.jsx` — a "dumb" prop-forwarding wrapper around `Header` + `Toolbar`; not touched.
- `src/i18n/translations.common.js` — confirmed all six existing `heroStayMoveTitle`/`heroStayMoveSubtitle`/`heroCta` (IS+EN) strings, preserved byte-identical.
- `src/lib/scoring.js`'s `getSeasonForDate` — confirmed October-April, `new Date(date).getMonth()+1` (browser-local); this also feeds actual scoring elsewhere in the file and must stay untouched — confirmed untouched by diff.
- `src/lib/auroraSeason.js` — confirmed `isAuroraSeason` gates September-March using `date.getUTCMonth()+1` with an explicit code comment that Iceland's UTC+0/no-DST standard time makes UTC-month-reading equivalent to Atlantic/Reykjavik local time; `SEASON_START_MONTH`/`SEASON_END_MONTH` are private, unexported constants. Confirmed untouched by diff.
- `src/lib/analytics.js` — confirmed `trackEvent(name, data={})` is the sole GA4 entrypoint (via `react-ga4`), and confirmed no `homepage_primary_cta_clicked` event existed anywhere in the codebase before this ticket.
- `src/hooks/useT.js` / `src/i18n/translations.js` — confirmed `useT(lang)` resolves `translations[lang]?.[key] ?? key`, and `translations` is the real assembled dictionary (`commonTranslations` merged with five other translation modules) — used directly (not an identity/hand-built stub) in the copy-acceptance tests below, per the prompt's explicit requirement.

## Implementation

### 1. `src/config/homepageHero.js` (new)

Centralizes date→variant selection and variant→translation-key mapping, keeping month conditions out of `Toolbar.jsx` entirely.

- `getHomepageHeroVariant(date = new Date())` reads `date.getUTCMonth()+1` as the Atlantic/Reykjavik calendar month (same technique/reasoning as `auroraSeason.js`, documented in the module header) and returns one of `winter_weather_aurora` (month ≥9 or ≤3), `winter_weather` (month ===4), `summer_camping` (otherwise, May-Aug).
- Deterministic invalid-date fallback: a non-`Date` value or a `Date` with `NaN` time returns `summer_camping` — the same non-alarming default precedent `scoring.js`'s `getSeasonForDate` already uses ("summer" on missing/invalid input).
- `getHomepageHeroCopyKeys(variant)` maps each variant ID to `{titleKey, subtitleKey, ctaKey}`; unrecognized variant IDs fall back to the summer mapping. The two winter variants intentionally share one `ctaKey` (`heroWinterCta`) — they render the same button label.
- **Independent-configuration disposition (Jonesy's optional suggestion, addressed explicitly per the prompt):** `auroraSeason.js`'s `SEASON_START_MONTH`/`SEASON_END_MONTH` were **not** imported or exported for reuse here — the module header explains why: they are deliberately private, and importing them would couple a marketing-copy calendar to a feature gate, so that a future change to either would silently affect the other. The Sept-March boundary is re-stated as this module's own literal, independently-owned decision; it agrees with `auroraSeason.js`'s gate today because the owner explicitly chose to align them (per Ripley's Round 2 disposition in `prompt-review.md`), not because they share code. `auroraSeason.js` itself was not modified to export anything.

### 2. Copy and integration — `Toolbar.jsx`

- Imports `getHomepageHeroVariant`/`getHomepageHeroCopyKeys`. Computes `heroVariant`/`heroCopyKeys`/`heroCtaLabel` once per render, from `new Date()` — variant selection happens during render, so copy and any subsequent click's analytics payload always agree for that render (no separate state, no drift possible between what's shown and what a click reports).
- Title/subtitle/CTA text now resolve via `t?.(heroCopyKeys.titleKey)` / `.subtitleKey` / `.ctaKey` instead of the hardcoded `"heroStayMoveTitle"`/`"heroStayMoveSubtitle"`/`"heroCta"` keys. For `summer_camping` these resolve to the exact same three keys as before — copy is byte-identical, not just visually similar (confirmed by test, see below).
- The scroll target id (`comparison-section`) and `scrollIntoView` options are unchanged; the decorative `→` arrow and button styling are unchanged; the pre-existing `season`/winter-hint block (Oct-April, browser-local) is completely untouched, both in code and in position.
- **Documented, in-code, the two independent "winter" concepts** (per Jonesy's second explicit note) via a comment directly above both `season` and `heroVariant` in `Toolbar.jsx`, explaining that `season` (scoring.js, Oct-April, browser-local, drives only the ❄ hint) and `heroVariant` (homepageHero.js, Reykjavik-calendar, drives hero copy) are deliberately separate and must not be unified.

### 3. New translation keys — `translations.common.js`

Added, byte-exact to the approved prompt's text, in both `en` and `is` blocks: `heroWinterAuroraTitle`, `heroWinterAuroraSubtitle`, `heroAprilTitle`, `heroAprilSubtitle`, `heroWinterCta`. The pre-existing `heroStayMoveTitle`/`heroStayMoveSubtitle`/`heroCta` (both languages) were not edited.

### 4. Analytics

`scrollToComparison()` in `Toolbar.jsx` now fires, in order, on every actual click:
1. `trackEvent("homepage_hero_cta_click")` — unchanged, no metadata, exactly as before.
2. `trackEvent("homepage_primary_cta_clicked", {hero_variant, cta_label, language})` — `hero_variant` from the resolved config (never inferred from the label text), `cta_label` the just-resolved translated button text (identical string used for both rendering and this payload — resolved once), `language` the current `lang` prop (`is`/`en`).

No event fires on mount, plain rerender, theme/language/unit toggles, or any other Toolbar control — `scrollToComparison` is the only call site for either event. April emits `hero_variant: "winter_weather"` even though its `cta_label` is identical to the Sept-March variant's shared CTA text — verified by test.

## CLAUDE.md documentation update

Added `homepage_primary_cta_clicked` to the "Key events" list and a new explanatory paragraph under "Primary homepage funnel" (alongside the existing `travel_advisor_destination_locked` / canonical-exposure callouts, matching their style) describing the three variants, the independent-calendar disposition, the event's exact payload, and the April/shared-label distinction.

## Scope confirmation — nothing outside the approved prompt was touched

Confirmed via `git status`/diff review: no changes to `scoring.js`, `relocationEngine.js`/`relocationService.js`, `comparisonUtils.js`/`useComparisonState`, `HomeDecisionCard.jsx`, `auroraSeason.js`, `NorthernLightsCard.jsx`, any entitlement/checkout/Paddle file, any API route, `package.json`, or any routing file. Only `src/config/homepageHero.js` (new), `src/components/Toolbar.jsx`, `src/i18n/translations.common.js`, and this ticket's own test/doc/evidence files were changed.

## Tests

### New/targeted suites

- `src/config/homepageHero.test.js` (new) — all 12 months; year rollover (Dec 2025→Jan 2026); exact boundaries at Mar 31 23:59:59/Apr 1 00:00:00, Apr 30 23:59:59/May 1 00:00:00, Aug 31 23:59:59/Sep 1 00:00:00; three offset-bearing timestamps deliberately straddling UTC midnight (`+05:00`/`-05:00` offsets) to prove UTC-calendar extraction is genuinely used, not the host's local time; invalid-date (`NaN` Date, `null`, non-Date value) and no-argument fallback; full `getHomepageHeroCopyKeys` mapping including the unrecognized-variant fallback.
- `src/components/Toolbar.test.jsx` (new) — renders all three variants × both languages using the real assembled `translations` dictionary from `src/i18n/translations.js` (not an identity/hand-built stub), asserting exact title/subtitle/CTA text and that no raw translation key ever leaks onto the page; explicitly asserts May-Aug copy is byte-identical to the original `heroStayMoveTitle`/`Subtitle`/`heroCta` strings; asserts both winter variants render the identical CTA label text. Separately: exact `homepage_primary_cta_clicked` payload on click including April's distinct `hero_variant` despite the shared label; unchanged `homepage_hero_cta_click` call; no event on mount, plain rerender, or unrelated controls (settings, units, theme, language, my-location — clicked individually); repeated clicks each produce one matching pair; a click after a language switch reflects the new language/label immediately, with no event firing from the switch itself; copy+event metadata agreement rerendered across all three seasonal boundaries; preserved `scrollIntoView` target/options; and an explicit pair of tests proving the pre-existing Oct-April browser-local winter hint is unaffected — visible in October, not in September, while the hero copy itself stays on `winter_weather_aurora` for both months.
- Existing regressions re-run unmodified: `src/lib/scoring.test.js` (90 tests combined with `auroraSeason.test.js`) and `src/components/NorthernLightsCard.test.jsx` (53 tests) — all pass, confirming the unchanged April Aurora out-of-season boundary and unchanged scoring behavior.

### Commands and results

```
npx vitest run src/config/homepageHero.test.js src/components/Toolbar.test.jsx
  → 2 files, 52 tests passed

npx vitest run src/lib/scoring.test.js src/lib/auroraSeason.test.js
  → 2 files, 90 tests passed

npx vitest run src/components/NorthernLightsCard.test.jsx
  → 1 file, 53 tests passed

npm test -- --run   (full suite)
  → 117 files, 1601 tests passed (up from 115 files / 1549 tests before this
    ticket — the two new test files add 52 tests net)

npm run lint
  → exit 0, no output

npm run build
  → succeeded; same pre-existing chunk-size advisory (index chunk >500kB),
    no new errors or warnings

git diff --check
  → exit 0; only pre-existing informational LF→CRLF autocrlf notices on
    files this ticket did not touch (CURRENT.md, ticket-410's
    result-review.md)
```

No pre-existing failures encountered in any of the above.

## Real-browser verification

Script: `outputs/ticket-411-homepage-hero-evidence/verify-homepage-hero.cjs`, run against a local Vite dev server (port 5175, started fresh for this turn and stopped afterward — the pre-existing unrelated process on port 5173 was left alone). Used Playwright's `page.clock.install({time})` to fix the in-page `Date` to a controlled noon-UTC instant per scenario (unaffected by host timezone), and `page.route("**/api/**", ...)` stubs matching `useForecast.js`'s actual daily-array response contract (read the hook's parsing code before stubbing, per repository convention) plus a 401 `/api/me` and a single free-tier test campsite.

**Matrix:** 3 seasons (`winter_weather_aurora` = Jan 15, `winter_weather` = Apr 15, `summer_camping` = Jul 4) × 2 languages (is/en) × 2 themes (light/dark) × 2 viewports (375×800 mobile, 1280×900 desktop) = 24 runs, plus one scroll-behavior spot check. All 24 runs are recorded in `outputs/ticket-411-homepage-hero-evidence/results.json` with the exact rendered title/subtitle/CTA text, a `noHorizontalOverflow` check (`document.documentElement.scrollWidth <= clientWidth`), CTA reachability (non-zero bounding box), and a screenshot per combination.

**Results:** all 24 combinations rendered the exact expected title/subtitle/CTA text for their variant+language (matching the real dictionary strings exactly — spot-checked programmatically against `translations.is`/`translations.en` inside the script's assertions), `noHorizontalOverflow: true` and `ctaReachable: true` in every case, and the hero's own bounding box stayed within the viewport width in every case. The scroll-behavior check confirmed `window.scrollY` changed and `#comparison-section` became visible after the click, with no changes to the button's own scroll call.

**Screenshots inspected directly (via the Read tool, not just existence-checked):**
- `winter-weather-aurora-en-light-mobile.png` — the longest English winter+aurora title wraps cleanly across three lines at 375px width, no clipping, no horizontal scroll, CTA and the pre-existing "❄ Winter mode" hint both fully visible below it.
- `winter-weather-aurora-is-dark-mobile.png` — same check in dark theme, Icelandic ("Vetrarhamur" hint visible, confirming the unrelated Oct-April hint still renders correctly alongside the new hero copy in January).
- `winter-weather-april-en-light-desktop.png` — confirms the April hero shows only "Find the best weather" / "Compare weather across Iceland and find a better destination." with **no aurora wording anywhere** in the hero, CTA reads "Explore the weather," and the rest of the page (comparison card, leaderboard) renders normally and unaffected.

## Known limitations / what this does not prove

- `trackEvent`'s real GA4/DebugView receipt in production is not established by this evidence — `analytics.js` only calls `ReactGA.event()` when `VITE_GA_MEASUREMENT_ID` is set; this dev-server verification and the jsdom tests both confirm correct trigger/payload *emission*, not live GA4 receipt. Do not report this event as "verified in GA4" without a real post-deployment DebugView check (same caveat as prior tickets' analytics work).
- No idle-page midnight timer exists or was added — a page left open across a variant boundary will not re-render the hero on its own; the approved prompt explicitly says this is not required ("No idle-page midnight timer or background scheduler is required"). A fresh navigation/reload after the boundary picks up the new variant correctly (this is what the boundary-rerender tests and evidence both actually exercise — a forced rerender, standing in for a real navigation).
- Real native-device rendering (actual iOS/Android browsers, real font metrics) was not tested — only Chromium via Playwright, consistent with this repository's existing verification pattern for prior tickets.

## Confirmation

`docs/ai/CURRENT.md` will be updated to `Stage: CC_COMPLETE` immediately after this report is written, with the `CC report` path populated. Preserved: `prompt-review.md`, `approved-prompt-v1.md`, and all prior tasks' history — nothing was rewritten or deleted. **Not committed. Not pushed. Not deployed. No GitHub issue closed or follow-up issue created. No message sent to anyone.**
