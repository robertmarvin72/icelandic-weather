# #486 — CC report

Executed `approved-prompt-v1.md` in full. Real application code added (new page, new backend endpoint, Footer entry, i18n), scoped exactly to the approved prompt. No commit/push/GitHub action, no subagents, no new dependency, no DB/config change, no provider/key network request of any kind during this execution (all backend tests use retained/synthetic fixtures and mocked `fetch`, per the prompt's own "Markviss sannprófun" requirement).

## Read-only audit (before any code)

Read `AGENTS.md`, `CLAUDE.md` ("Umfang og aukaverkefni"), `docs/ai/README.md`, `CURRENT.md`, `approved-prompt-v1.md`, `prompt-review.md`; ticket-485's `final-bounded-plan.md`, `final-bounded-report.md`, `cc-report-final-probe.md`, `final-probe-sample.json`, `final-probe-validate.mjs`; ticket-483's `route-segments.csv`, `source-register.md`, `owner-overview-source-2026-10-28/faerd-gagnasnid-owner-text.txt` (the owner's own data-dictionary — this is where the S1 code table came from); `docs/open-meteo-auth.md`; `api/_lib/openMeteoAuth.js`, `api/forecast.js`, `vite.config.js`, `vercel.json`, `src/AppRoutes.jsx`, `src/components/Footer.jsx`, `src/hooks/usePageRouteProps.js`, `src/pages/About.jsx`, `src/pages/NorthernLightsLanding.jsx` (template for a standalone, Footer-owning route), `src/lib/weatherPresentation.js` (reused unchanged for the weather-code icon/text), `api/_lib/auroraDecision/openMeteo.js` and `api/_lib/aurora/cache.js` (precedent for fetch/auth/cache patterns), `src/i18n/translations.js` / `translations.common.js`.

Independently re-verified against the live retained samples (not just trusted from prior write-ups) via a one-off Node read of `docs/ai/tasks/ticket-485/samples/legacy-faerd-https.json` / `legacy-faerdpunktar-https.json`: all 13 fixed IDBUTUR are `GREIDFAERT` with no `AstandVidbotaruppl`; three real `VEGAVINNA` point notices exist on our corridor (`901230037`, `902030037`, `902040037`); the retained point sample really does contain the undocumented codes `TONN_ALLS`/`HOLUR_I_VEGI` (not on our corridor, used as the S1 unknown-code test case); confirmed the real segment-feed field shape (`AstandYfirbord`, `AstandVidbotaruppl`, `AstandLysing(En)`, `DagsSkrad`, `DagsKeyrtUt`, …) and point-feed field shape (`Astand`, `Lysing(En)`, `Aths(En)`, `GildirTil`, …) directly from one real record of each.

`resolveOpenMeteoAuth`/`api/forecast.js`/`vite.config.js`/`vercel.json` confirmed unchanged by this ticket — this route reuses the shared `OPEN_METEO_CUSTOMER_HOST` constant only, never the shared fallback behavior (see S6 below), and needs no new Vite/Vercel config (`vite.config.js`'s generic `/api` → `vercel dev` proxy and `vercel.json`'s generic `/api/(.*)` rewrite already cover a new `api/winter-route.js` file with zero changes).

## What was built

**Backend** (`api/_lib/winterRoute/`, all new):
- `segments.js` — the fixed 13 IDBUTUR (1410010037…801100037, verbatim order from `route-segments.csv`) with small hardcoded IS/EN display names (S5f), and the fixed 6 forecast points reused verbatim from `final-bounded-plan.md`.
- `roadConditionCodes.js` (S1) — one fixed code table (`AstandYfirbord` 14 codes, `AstandVidbotaruppl` 13 codes, point `Astand` 6 codes → `passable | hazard_notice | out_of_service | impassable | closed | unknown_unclassified`), worst-wins combination across all three fields, `isEligibleForPositiveStyle()` gating "good" styling on freshness. Any undocumented code (including the real `TONN_ALLS`/`HOLUR_I_VEGI` examples) → `unknown_unclassified`, never passable.
- `freshness.js` (S5) — export staleness (30 min), per-segment registration age (24 h), and point-notice validity (`active`/`expired`/`unknown`, driven only by `GildirTil`, never by the notice's own `DagsSkrad` age).
- `boundedFetch.js` — one shared 15s-timeout / 2 MiB-streamed-cap / no-redirect fetch primitive (S3c), used by every upstream call.
- `roadFetch.js` — fetches+filters both Vegagerðin feeds to our 13 IDBUTUR, normalizes the real `.0`-suffixed numeric IDs (S5d), and never carries `Aths`/`AthsEn` into the internal shape at all (S2 decision (a)).
- `forecastFetch.js` (S6a) — its own, narrower key policy: a missing/blank `OPEN_METEO_API_KEY` means **zero** forecast fetches in every environment (dev/preview/production/undefined), never a public-host fallback — deliberately not reusing `resolveOpenMeteoAuth`'s own Preview/Development fallback, which exists for other routes only. Computes the 24-hour window (next full UTC hour strictly after "now" → +23h) and builds the 6-point request.
- `validateForecast.js` (S4) — strict per-point validation against the real list-shaped response: exact result count, haversine request-order check (reusing the #485 S2 technique), `utc_offset_seconds === 0`, exact 24 UTC timestamps, exact units, `null` kept distinct from `0`. A failing point is marked unusable with a reason; it never silently coerces, and one point's failure doesn't affect the other five.
- `cache.js` (S3) — two fixed module-memory entries (road 5 min TTL / forecast 15 min TTL), single-flight coalescing of concurrent misses, last-known-good fallback bounded to 30 min (road) / 60 min (forecast), documented as per-warm-invocation only.
- `api/winter-route.js` — the handler: ignores all query params, fetches road (both feeds, independent outcomes) and forecast in parallel through the cache, classifies every segment, attaches its point notices, and returns one JSON payload. `Cache-Control: no-store` always set. Never logs a raw error/URL (same discipline as `api/forecast.js`'s own D2 decision — a fetch failure can embed a keyed URL in some runtimes).

**Frontend:**
- `src/pages/WinterRoute.jsx` (new) — standalone page (own `Footer`, no login/paywall), modeled on `NorthernLightsLanding.jsx`'s structure. Fetches `/api/winter-route` exactly once on mount; hour selection is a plain `<select>` (native keyboard/focus support) that only filters/reindexes already-fetched data — no new network request per selection, and passed-hours drop out of the list automatically (checked once a minute via a local tick, never a refetch). Mobile-first: forecast cards and the road-section list are both single-column by default (`grid-cols-1`, `sm:/md:` widen only the forecast grid); no map.
- `src/lib/winterRoutePresentation.js` (new) — pure formatting helpers (decimal comma for `is`, decimal point for `en`; always a space before the unit; hour/timestamp label formatting straight from the fixed string, never through a `Date` object that could apply a local-timezone shift).
- `src/i18n/translations.winterRoute.js` (new) — all user-facing strings, IS/EN, wired into `src/i18n/translations.js`.
- `src/AppRoutes.jsx` — added `<Route path="/winter-route" element={<WinterRoute />} />`.
- `src/components/Footer.jsx` — added one `/winter-route` link (`footerWinterRoute` key), same visual pattern as the existing links.

## Decisions taken inside the approved prompt's own stated options

- **S2:** option (a) — `Aths`/`AthsEn` are not fetched into the internal shape at all, let alone rendered. Point notices show only the fixed category, the official `Lysing`/`LysingEn` (≤300 chars, plain React text, never `dangerouslySetInnerHTML`), and the validity status.
- **S3(e):** last-known-good max age set to 30 min (road) / 60 min (forecast) — already fixed by Ripley in the approved prompt text; implemented exactly as stated.
- **S6(c):** attribution reads "Breytt/túlkað af Eltum Veðrið" / "Modified/interpreted by Chase the Weather" — current branding, not the legacy "CampCast" wording `final-bounded-plan.md` had used, per CLAUDE.md's branding rule.
- Road-feed partial failure: if one of the two Vegagerðin feeds fails but the other succeeds, the bucket is still cached as a success (TTL applies) with the failed feed's own `*Available: false` flag surfaced — a genuinely-down single feed gets retried every TTL window rather than only every 30 min; a **total** road outage (both feeds failing) is what triggers the 30-minute last-known-good fallback. This reading of "tvö feed með sjálfstæðri niðurstöðu" is the simplest one that satisfies "ekki fela gild gögn hinnar veitunnar" without a second independent cache per feed — flagged here in case the owner reads it differently.

## Tests run

`npx vitest run` — **200/200 test files, 2935/2935 tests pass** (whole suite, not just the new files — no regression). New test files: `api/_lib/winterRoute/{roadConditionCodes,freshness,validateForecast,cache,roadFetch,forecastFetch}.test.js` (65 tests: every documented code classifies correctly and no undocumented code ever reaches "passable"; closure-wins-over-positive from all three source fields; the two real retained-sample unknown codes; export/registration/notice-validity freshness incl. "old registration on a still-valid notice is not expired" S5c; strict forecast validation incl. order-mismatch/unit-mismatch/time-mismatch/null-vs-0, each as an isolated per-point failure; cache TTL, single-flight coalescing, and bounded stale-fallback with fake clocks; fixed-order segment extraction regardless of feed order, `.0`-suffix normalization, `Aths`/`AthsEn` never present in the mapped shape); `api/winter-route.test.js` (method guard, `no-store` header, forecast correctly unavailable + road still rendered when the key is missing, one feed failing not hiding the other's data, a closed segment's category). `src/pages/WinterRoute.test.jsx` (7 tests, real translations dictionary, real routing): title/subtitle render, exactly one fetch, all 13 segments render, a closed segment's label, selecting a different hour triggers **no** second fetch, forecast-unavailable state hides the picker, **all six forecast cards reflect the same selected hour and move together when the hour changes**, English-language rendering. `src/components/Footer.test.jsx` — added one assertion for the new `/winter-route` link.

`npm run lint` — clean. `npm run build` — succeeds (pre-existing >500kB main-chunk warning, unrelated to this ticket — confirmed by grepping `dist/assets/*.js` for `customer-api`/`OPEN_METEO_API_KEY`/`gagnaveita.vegagerdin`: zero matches, confirming the credential/upstream-host boundary holds for this new route exactly as `docs/ai/tasks/ticket-453/cc-report.md` verified for the existing ones).

## What was NOT tested (disclosed, not hidden)

- **No real-browser visual/manual pass.** This session has no browser-automation tool available (no Chrome extension / computer-use / built-in-browser tool was loaded for this run) — the approved prompt's "UI-yfirferð í raunvafra með stubbum á síma- og skjáborðsbreidd, lyklaborði, dökkum/ljósum ham og villustöðum" could not literally be performed. What *was* verified: component-level rendering/interaction/accessibility (native `<select>` with a real `<label>`, i18n, hour-switch-no-refetch, mobile-first `grid-cols-1` defaults by source inspection) via jsdom + Testing Library, which is a real but partial substitute — it does not confirm actual visual layout, true keyboard-focus rendering, or dark/light theme appearance in a real browser. Flagged as an open item, not quietly skipped.
- **No real `vercel dev` run and no real upstream request of any kind** — correctly out of scope: the approved prompt's own verification section requires retained/synthetic fixtures with zero real key/network use in tests, and nothing in the prompt authorizes a new live provider/key request for this ticket (that authority was scoped narrowly to #485's single already-closed probe). `docs/open-meteo-auth.md`'s own note that `npm run dev` alone never reaches a new `/api/*` route (needs `vercel dev`) is documented above and in the module doc-comments, not independently re-demonstrated by running it.
- Real Production/Preview Vercel runtime behavior (cold starts, actual egress/quota, whether the Vegagerðin feeds are reachable from Vercel's network) remains UNKNOWN, as it was before this ticket — nothing here changes that.

## Scope guard

Every file above traces to one approved-prompt section (UI/route/Footer in "UI og aðgangur"; segments/points in "Fast gögn"; backend/key policy in "Lágmarks bakendi"; forecast window/validation in "Spá"; classification/closures in "Færð og lokanir"; timestamps/cache in "Gagnatímar og einfalt cache"; attribution in "Heimildir/tónn"). No route-engine, ETA, ni analytics event, homepage change, or new paywall/category was added. No adjacent refactor was made to `api/forecast.js`, `api/_lib/openMeteoAuth.js`, `vite.config.js`, or `vercel.json` — all three were confirmed compatible as-is and left untouched. No audit finding required a wider change or a new dependency, so no scope-escalation decision point arose for the owner.

## Status (Round 1)

- Baseline HEAD at start of this round: `24fa3d31` ("docs: complete bounded Winter Route Advisor research (#485)"). HEAD at end: **unchanged** — no commit made by CC.
- `git status --short`: `docs/ai/CURRENT.md`, `src/AppRoutes.jsx`, `src/components/Footer.jsx`, `src/components/Footer.test.jsx`, `src/i18n/translations.js` modified; `api/_lib/winterRoute/`, `api/winter-route.js`, `api/winter-route.test.js`, `docs/ai/tasks/ticket-486/`, `src/i18n/translations.winterRoute.js`, `src/lib/winterRoutePresentation.js`, `src/pages/WinterRoute.jsx`, `src/pages/WinterRoute.test.jsx` new. No other file touched. No commit, no push, no GitHub action.
- Next: owner → Jonesy "CC búinn" (result review), then owner → Ripley "Jonesy búinn að reviewa CC" (final assessment).

---

## Round 2 addendum, 2026-11-03 — correction per `approved-prompt-v2.md` (Jonesy's R1–R4, Ripley's N1/N2/N4/N5 decisions)

Executed `approved-prompt-v2.md` in full: a narrow repair of Round 1's four REVISE findings plus the N1/N2/N4 presentation fixes Ripley accepted, **and** the previously-outstanding N3 real-browser review, now actually completed. No new dependency, no provider/key request, no change to any shared route/auth file, no commit/push/GitHub action. Round 1's own text above is preserved unchanged.

### R1 — partial point-feed failure no longer yields silent "green"

- `api/_lib/winterRoute/roadConditionCodes.js`: `isEligibleForPositiveStyle()` gained a third gate, `pointsFeedUnavailableOrStale` (default `false`, so existing callers are unaffected) — a segment can only render positive/"good" styling when the **point feed itself** is available **and** fresh, not just the segment feed. `classifySegment()`'s notice parameter is now `{ astand, status }` objects (was bare strings) so status-aware classification (see N2 below) is possible everywhere it's called.
- `api/winter-route.js`: `computePointsFeedUnavailableOrStale()` (new) is computed once per request from the points-feed's own `ok`/`feedDagsKeyrtUt` freshness and threaded into every segment's eligibility check — so **no segment anywhere** gets positive styling while the point feed (where closures/roadworks are actually reported) is down or stale, even though the segment feed alone would still say "GREIDFAERT". Also fixed: a segment **missing from the segment feed entirely** (the old `!row` branch) now runs through the same `classifySegment()` path instead of a hardcoded `unknown_unclassified` — so a real active closure notice on a segment the segment feed doesn't report now correctly reads `closed`, not stuck at "unknown" (R1c).
- `src/pages/WinterRoute.jsx` / `translations.winterRoute.js`: new visible IS/EN warning (`winterRoutePointsFeedUnavailable`) rendered in the road section whenever `roadMeta.pointsFeedUnavailableOrStale` is true, without hiding the (still-rendered) segment rows.
- Tests: `roadConditionCodes.test.js` (new `isEligibleForPositiveStyle` case), `api/winter-route.test.js` (two new handler tests: points feed down → zero segments get positive styling though categories stay "passable"; points feed technically `ok` but with no usable export time → same result; a segment missing from the feed with a real active closure notice → `closed`), `WinterRoute.test.jsx` (warning renders without hiding segment rows; warning absent when the feed is fine).

### R2 — duplicate/contradictory IDBUTUR no longer resolves to whichever row came first

- `api/_lib/winterRoute/roadFetch.js`: `fetchRoadSegments()` now groups **all** rows per IDBUTUR before resolving one (previously: first-seen row won, later ones silently ignored). Rows that genuinely disagree (different `AstandYfirbord`/`AstandVidbotaruppl`) are marked `ambiguous: true`; if **any** of the contradictory rows is itself a closure (`LOKAD`/`ALLUR_AKSTUR_BANN`), that closure is preserved/forced (`forcedCategory: "closed"`) regardless of row order — Ripley's explicit decision that a known closure must never be hidden under "unknown" just because the feed also contained a conflicting row. A contradiction with no closure present becomes `unknown_unclassified`, never positive. Two genuinely identical duplicate rows are *not* treated as ambiguous.
- `normalizeIdButur()`: switched from `Math.round()` to `Number.isInteger()` — a real `.0`-suffixed value (e.g. `252090037.0`) is still accepted (it already *is* an integer value in JS), but a genuine fraction (e.g. `252090037.4`, Jonesy's attack sample) is now rejected outright instead of being rounded into silently colliding with a real segment.
- `api/winter-route.js`: new `classifySegmentAmbiguous()` combines the forced/base category with point notices (status-aware, so N2 applies here too) the same way the normal path does.
- Tests: `roadFetch.test.js` (duplicate-order-independence, no-closure-among-duplicates, identical-duplicates-not-ambiguous, plus updated `normalizeIdButur` fraction-rejection cases), `api/winter-route.test.js` (end-to-end: a contradictory `GREIDFAERT`+`LOKAD` duplicate is never passable and the closure is preserved through the full handler).

### R3 — stale forecast is now visibly marked in the UI

- `src/pages/WinterRoute.jsx`: new line in the forecast section, shown whenever `data.forecast.stale` is true, giving the real age from `cacheAgeMs` (mirrors the road section's pre-existing stale-road line) — the forecast values themselves stay visible, never hidden by the marker.
- `translations.winterRoute.js`: new `winterRouteForecastStaleServed` key, IS/EN.
- No backend change needed — `forecast.stale`/`cacheAgeMs` were already in the response (Round 1 oversight was frontend-only).
- Test: `WinterRoute.test.jsx` (stale line renders with the correct minute count; forecast values remain visible; absent when not stale).

### R4 — gust label now states "previous hour"

- `translations.winterRoute.js`: `winterRouteGust` is now "Hviður (hámark síðustu klukkustundar)" / "Gusts (max, previous hour)" (precipitation's existing "(previous hour)" wording was already correct and is unchanged; temperature/wind stay unlabeled as instantaneous values, per the approved prompt).
- Test: `WinterRoute.test.jsx` asserts both language strings contain the required wording.

### N1 — day/night weather icon no longer fixed to "day"

- `resolveWeatherPresentation(code, { isDay: true })` (a hardcoded constant) is now `resolveWeatherPresentation(code, { isDay: isDaytimeHour(hourOfDay) })`, reusing the exact `isDaytimeHour()` convention `ForecastTable`/`HourlyForecastModal` already use (07–20 UTC = day) — no new sunrise/sunset lookup, no new weather variable. `hourOfDay` is read directly from the selected forecast hour's own fixed `"YYYY-MM-DDTHH:00"` string (new `hourOfDayFromHourString()` in `winterRoutePresentation.js`), never through a `Date` object that could apply a local-timezone shift.
- Tests: `winterRoutePresentation.test.js` (new) — targeted cases at 02 UTC (night) and 14 UTC (day), per Jonesy's own request, plus the extraction helper's malformed-input handling.

### N2 — an expired-only closure notice no longer reads as a live "Lokað"

- `api/_lib/winterRoute/roadConditionCodes.js`: new `categorizePointAstandWithStatus(astand, status)` — an `ALLUR_AKSTUR_BANN` point notice whose own `GildirTil` has expired (status `"expired"`, from `freshness.js`'s `pointNoticeStatus()`) downgrades to `HAZARD_NOTICE` instead of forcing `CLOSED`; an `"active"` or `"unknown"`-validity closure notice is unaffected (unconfirmed validity is never grounds to downgrade — only a *confirmed-expired* one is). `classifySegment()` and the Round 2 ambiguous-duplicate path both route through this.
- The existing per-notice UI text ("Útrunnin tilkynning – staðfestu hjá Vegagerðinni") already covered the notice's own display; this fix is about the **segment's own category/pill**, which previously still said "Lokað" even when the only underlying evidence had expired.
- Tests: `roadConditionCodes.test.js` (expired-alone → `HAZARD_NOTICE`; unknown-validity → still `CLOSED`; an active closure elsewhere on the same segment still reads `CLOSED` despite another expired notice present).

### N4 — Helmet title now follows the active language

- `src/pages/WinterRoute.jsx`: `<title>` now reads `{t("winterRouteTitle")} · {lang === "en" ? "Chase the Weather" : "Eltum Veðrið"}` (same inline convention `Brand.jsx` already uses for its alt text), instead of a hardcoded Icelandic brand suffix on the English route too.

### N5 — cache design unchanged, as instructed

No change. R1's new warning makes the existing 5-minute partial-failure caching window visible to the user instead of silent, which is the mitigation Ripley accepted in place of a cache redesign.

### N3 — real-browser review completed (was previously disclosed as not possible; it was possible)

Round 1 disclosed no real-browser pass had been done, citing no available browser-automation tool in that session. That was an incomplete audit on my part — **this project already has Playwright with Chromium installed** (`CLAUDE.md`'s own `Dev Setup` section: `npx playwright install chromium`; `playwright.config.js` exists; five prior `tests/e2e/*.spec.js` files already establish the exact pattern needed: `page.route()` stubbing a backend endpoint against plain `npm run dev`, no real network). This round used that existing setup — no new dependency or install step.

New file: `tests/e2e/winter-route-ticket-486.spec.js`, five tests, all passing against a stubbed `/api/winter-route` (never a real upstream/key request):

1. **Desktop (1280×900), light, Icelandic** — title, hour picker, all 13 road sections, all six forecast cards showing the same selected hour's value. Screenshot: `test-results/ticket-486/desktop-light-is.png`.
2. **Mobile (375×800), light, English** — confirmed single-column stacked layout, no map/canvas element present. Screenshot: `mobile-light-en.png`.
3. **Desktop, dark mode** (`prefers-color-scheme: dark` + `theme=dark`) — confirmed the `<html>` `dark` class and legible rendering. Screenshot: `desktop-dark-is.png`.
4. **Keyboard** — the hour `<select>` is reachable via `.focus()`/tab order (native element, no custom widget), operable via `ArrowDown`, and confirmed **zero additional network requests** fire on a hour change (a real network-level count, not a mock-call count).
5. **Partial failure / stale state** — points-feed-unavailable warning and the new R3 stale-forecast line both visible simultaneously, with segment data still rendered underneath. Screenshot: `partial-failure-stale.png`.

All four screenshots were visually reviewed (not just asserted on) before closing this round — layout, pills, icons, and text all render as intended on both themes and both viewport widths. `test-results/` is git-ignored (same as the existing Ticket 398 precedent); the screenshots are local evidence only, not committed.

**A real, production-relevant bug was found and fixed as a direct result of this real-browser pass — it was invisible to every jsdom/Testing-Library test in this round and Round 1:** `WinterRoute.jsx`'s data-fetch `useEffect` used a `fetchedRef` guard (to survive React 18 StrictMode's dev-only synthetic double-invoke) *combined with* a separate per-invocation `cancelled` flag set by that same effect's cleanup. Under StrictMode (`src/main.jsx` wraps the app in `<StrictMode>`, confirmed), the sequence was: effect runs → starts the one real `fetch()` → StrictMode immediately fires the synthetic cleanup → `cancelled` flips to `true` → the effect re-runs → guard skips a second fetch (correct) → the *original* fetch eventually resolves → `if (cancelled) return` discards the result — so `setData()` was **never called in dev** (`npm run dev`, which every local engineer and this review both actually use), while production builds (StrictMode's double-invoke is dev-only) would have worked fine. jsdom/RTL's `render()` does not wrap in `<StrictMode>`, which is exactly why every prior component test passed while the real page silently never loaded past its loading placeholder. Confirmed via a disposable debug Playwright spec (console/network logging, not kept) before and after; fixed by removing the now-redundant `cancelled` flag entirely (`fetchedRef` alone already guarantees at most one real fetch per mount, StrictMode-safe) — this is the same class of StrictMode double-invoke issue this codebase already has multiple existing guards/tests for elsewhere (`AnalyticsTracker.jsx`, `useWeatherVoice.js`, `affiliateImpressionHolder.js`), which I failed to apply to this new effect in Round 1. Full regression and new-test suite re-run clean after the fix (below).

This is the concrete justification for N3's existing-rule phrasing ("ekki kalla jsdom raunvafrasönnun ... annars er það áfram ólokið samþykkisskilyrði") — in this instance the real browser caught a defect the jsdom suite could not have caught by construction.

### Tests run (Round 2)

- `npx vitest run` — **201/201 test files, 2963/2963 tests pass** (full suite, re-run twice for confidence; one pre-existing, unrelated flake in `NorthernLightsCard.test.jsx` was observed once under full-suite load and confirmed to pass cleanly in isolation and in both full-suite re-runs — not touched by this round, disclosed not hidden).
- New/changed test files this round: `api/_lib/winterRoute/roadConditionCodes.test.js` (+10 cases: N2 status-aware categorization, R1a eligibility gate), `api/_lib/winterRoute/roadFetch.test.js` (+5 cases: R2 duplicate handling, fraction rejection), `api/winter-route.test.js` (+4 end-to-end handler cases: R1a/R1c/R2), `src/pages/WinterRoute.test.jsx` (+6 cases: R1b/R3/R4 UI, plus two tests tightened from a synchronous assertion to a proper `waitFor` after a **real, reproducible test-only race** was found — see below), `src/lib/winterRoutePresentation.test.js` (new file, N1).
- `npm run lint` — clean. `npm run build` — succeeds (same pre-existing >500kB chunk warning as Round 1, unrelated). Re-confirmed `dist/assets/*.js` contains zero occurrences of `customer-api`/`OPEN_METEO_API_KEY`/`gagnaveita.vegagerdin`.
- **A second, test-only defect was found and fixed** (not a product bug): two `WinterRoute.test.jsx` cases asserted on the per-hour forecast-card values immediately after `findByLabelText` resolved for the hour `<select>` — but the label/select appear on the *same* render pass `data` itself arrives, one pass *before* the follow-up effect that resolves `selectedHour`/`hourIndex` and actually populates those values. This is a genuine async race (reproduced intermittently, ~1 in 5 runs, via 10+ repeated isolated runs before the fix, 0 failures in 10+ repeated runs after), not a flaky-infra artifact — fixed by wrapping the value assertions in `waitFor` instead of asserting synchronously right after the label appears, in both affected tests and the new R3 test (which inherited the same shape).

### Scope guard (Round 2)

Every change above maps to exactly one of R1–R4/N1/N2/N4/N3 from `approved-prompt-v2.md`; N5 was explicitly "no change". No route-engine, ETA, new paywall, analytics event, or homepage change was touched. `api/forecast.js`, `api/_lib/openMeteoAuth.js`, `vite.config.js`, `vercel.json` remain untouched. The one adjacent fix outside the named R/N items — removing the StrictMode fetch-race — is the direct, minimal cause of N3's own real-browser finding and is documented here in full per the "small adjacent change must be documented" rule; it is inside this ticket's existing scope (the page's own data-loading correctness), not a new feature.

### Status (Round 2)

- Baseline HEAD at start of this round: unchanged, `24fa3d31` — still no commit made by CC.
- New files this round: `tests/e2e/winter-route-ticket-486.spec.js`, `src/lib/winterRoutePresentation.test.js`. Modified: `api/_lib/winterRoute/roadConditionCodes.js`, `api/_lib/winterRoute/roadFetch.js`, `api/winter-route.js`, `api/_lib/winterRoute/roadConditionCodes.test.js`, `api/_lib/winterRoute/roadFetch.test.js`, `api/winter-route.test.js`, `src/pages/WinterRoute.jsx`, `src/pages/WinterRoute.test.jsx`, `src/lib/winterRoutePresentation.js`, `src/i18n/translations.winterRoute.js`, `docs/ai/CURRENT.md`, this report. No commit, no push, no GitHub action.
- Next: owner → Jonesy "CC búinn" (result review), then owner → Ripley "Jonesy búinn að reviewa CC" (final assessment).

---

## Round 3 addendum, 2026-11-03 — correction per `approved-prompt-v3.md` (Jonesy's R5 only, result review umferð 2)

Executed `approved-prompt-v3.md` in full: one narrow, two-part UI/text fix. R1–R4 and N1–N4 from prior rounds are unchanged and not re-verified here (Jonesy's umferð-2 review already independently confirmed them against 96 backend tests + 24 of her own attack tests; v3 explicitly says not to re-touch that ground). N6–N9 accepted as non-blocking per Ripley's decision — no action.

### R5(1) — a lone expired closure notice now reads with dedicated, prominent wording

- `src/pages/WinterRoute.jsx` (`SegmentRow`): a point notice where `astand === "ALLUR_AKSTUR_BANN"` and `status === "expired"` **and the segment's own category is not already `"closed"`** (i.e. nothing else currently confirms a live closure) now renders as its own amber-bordered, bold block reading the new `winterRouteExpiredClosureNoticeProminent` string — "Útrunnin lokunartilkynning — staðfestu hjá Vegagerðinni" / "Expired closure notice — confirm with Vegagerðin" — instead of the generic small `"<Lysing> — Útrunnin tilkynning"` line. No backend/classification change (this was always a display-only gap, per Round 2's own N2 fix already correctly classifying this case as `hazard_notice`, never `closed` or positive).
- When the segment **is** `"closed"` via some other source, the notice keeps the ordinary, smaller "expired" line (still visibly marked expired, not hidden) — the segment-level `"Lokað"` pill is what should read as prominent/current in that case, not a second competing prominent block for one of potentially several notices.
- `translations.winterRoute.js`: new `winterRouteExpiredClosureNoticeProminent` key, IS/EN.

### R5(2) — the points-feed warning now includes the official source link

- `src/pages/WinterRoute.jsx`: the existing `pointsFeedUnavailableOrStale` warning box now also renders an accessible, translated link using the **same already-retained `VEGAGERDIN_LINKS[lang]`** constant the page's bottom attribution section already uses (no new URL), labelled with the existing `winterRouteOfficialSourceLinkRoad` string (already defined, reused as-is — no new link-text key needed).

### Tests run (Round 3)

Scope matched the prompt's own instruction — changed-file tests and lint only, full suite/backend tests/unchanged-layout browser review not repeated without reason (nothing outside `src/pages/WinterRoute.jsx`, `src/i18n/translations.winterRoute.js`, their test files, and the e2e spec was touched this round):

- `npx vitest run src/pages/WinterRoute.test.jsx` — **15/15 pass** (3 new cases: a lone expired closure shows the prominent text on both IS and EN and the generic expired line is absent; an expired notice alongside an independently-`closed` segment keeps the `"Lokað"` pill prominent while the notice itself still shows the ordinary expired marker, not the prominent one; the points-feed warning contains the correct official link with the exact retained URL). Re-run 5× in a row, stable each time.
- `npm run lint` — clean.
- One small, optional real-browser legibility check (Playwright, reusing the existing `tests/e2e/winter-route-ticket-486.spec.js` — no new tool/setup): a new case renders the lone-expired-closure state at 1280×900/light/IS and asserts the prominent text is visible; the existing partial-failure/stale case was extended to also assert the official link renders inside the warning (a Playwright strict-mode duplicate-match was hit and fixed with `.first()`, since the same link text legitimately also appears in the page's own bottom attribution block). Both screenshots (`test-results/ticket-486/expired-closure-prominent.png`, updated `partial-failure-stale.png`) were visually reviewed — the amber prominent block reads clearly against the surrounding segment list, distinct from the ordinary green/amber/red category pills. 6/6 e2e tests pass.
- Not re-run this round (no reason to suspect regression, no file in these areas touched): full `vitest` suite, all `api/_lib/winterRoute/*` backend tests, `api/winter-route.test.js`, `npm run build`, the other four e2e scenarios' screenshots (desktop-light/mobile/dark/keyboard) — all re-confirmed passing as a side effect of the one full e2e-file run above, but not independently re-inspected visually since their layout is unchanged.

### Scope guard (Round 3)

Both changes map directly to R5(1)/R5(2) from `approved-prompt-v3.md`. No classification/cache/fetch-lifecycle/shared-system change, per the prompt's explicit "ekki breyta cache, bakenda, dag/nótt, fetch-lífsferli eða sameiginlegum kerfum." No new dependency, no provider/key network request, no commit/push/GitHub/deploy.

### Status (Round 3)

- Baseline HEAD: unchanged, `24fa3d31` — still no commit made by CC.
- Modified this round: `src/pages/WinterRoute.jsx`, `src/i18n/translations.winterRoute.js`, `src/pages/WinterRoute.test.jsx`, `tests/e2e/winter-route-ticket-486.spec.js`, `docs/ai/CURRENT.md`, this report. No other file touched. No commit, no push, no GitHub action.
- Next: owner → Jonesy "CC búinn" (result review), then owner → Ripley "Jonesy búinn að reviewa CC" (final assessment).
