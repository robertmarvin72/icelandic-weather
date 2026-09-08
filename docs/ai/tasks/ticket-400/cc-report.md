# CC Report — Ticket 400 (Bug: Daily weather summary conflicts with hourly forecast)

Executed against: `docs/ai/tasks/ticket-400/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS).

## 1. Mandatory preflight audit

Read before editing: GitHub issue #400 (`gh issue view 400`), `src/hooks/useForecast.js`, `src/lib/forecastNormalize.js` (+ `relocationEngine.timeWeight.test.js`, its consumer test), `src/components/ForecastTable.jsx` (+ `ForecastTable.analytics.test.jsx`), `src/components/HourlyForecastModal.jsx` (no prior test file existed), `src/App.jsx`, `src/utils/weatherMap.js`, `src/utils/WeatherIconMapping.ts`, `src/components/WeatherIcon.tsx`, `src/components/icons/weather/*.tsx`, `api/forecast.js`, `src/lib/forecastCache.js`, `src/lib/scoring.js` (`scoreSiteDay`, `getSkyComfortModifier`, `getWintryPrecipPenalty`, `getPleasantnessModifier`), `src/hooks/useLeaderboardScores.js`, `src/utils/precipitation.js`, `src/i18n/translations.common.js`.

### Confirmed audit findings (verified, not assumed)

- **`row.code` genuinely feeds scoring.** `scoreSiteDay({ ..., weatherCode, code })` computes `_weatherCode = weatherCode ?? code ?? null` and passes it into `getPleasantnessModifier` → `getSkyComfortModifier`/`getWintryPrecipPenalty`, which contribute directly to `pointsRaw`/`points`/`finalClass`. This confirms the prompt's own stated finding exactly: replacing `row.code` would change scoring. `row.code` is never touched by this ticket.
- **Two independent, incomplete presentation paths existed.** `ForecastTable.jsx` used `WEATHER_MAP[code].textKey` (text) plus a fully separate `mapWeatherCodeToIconId(code, true)` (SVG icon) — two different tables that could drift. `HourlyForecastModal.jsx` used `WEATHER_MAP[code].icon` (emoji) + `.textKey`, ignoring `WeatherIconMapping.ts` entirely. Neither surface shared one canonical source, exactly as the prompt described.
- **`WEATHER_MAP` (`src/utils/weatherMap.js`) was missing WMO codes 56, 57 (freezing drizzle) and 85, 86 (snow showers) entirely** — these silently rendered as an unlabeled raw `"unknown"` i18n-key leak in `ForecastTable` and as `"Weather 56"/"Veður 85"` in `HourlyForecastModal`. Consolidating onto one canonical table naturally fixes this (documented as a deliberate reuse decision below, not new scope).
- **`useLeaderboardScores.js` (Top 5 leaderboard) has its own, fully independent scoring path** — it builds its own row directly from raw `data.daily` (including its own `code: data.daily.weathercode?.[i] ?? null`) and calls `scoreSiteDay` itself, never touching `useForecast.js`, `normalizeDailyToScoreInput`, or anything this ticket adds. Confirmed unaffected by this ticket by construction (not modified, and it never imports any new module this ticket introduces).
- **`api/forecast.js` already requests `hourly.weathercode`** (`timezone=auto`, so both `daily.time` and `hourly.time` are timezone-local strings) — no backend change was needed. `forecastNormalize.js` already matches hourly rows to a daily date via `ts.startsWith(date)` (string-prefix, no UTC parsing) — the new summarizer reuses this exact same precedent.
- **Icon fallback ambiguity confirmed**: `WeatherIconMapping.ts`'s `mapWeatherCodeToIconId` falls through unsupported codes to `"cloudy"` — the same icon used for the real WMO code 3 (overcast). `WeatherIcon.tsx`'s own `ICONS[iconId] ?? IconCloudy` internal fallback repeats the same ambiguity a second time. Per the Round 2 clarification, this ticket's new resolver never calls into that fallback path for an unsupported code (it validates supportedness itself, first) — `WeatherIconMapping.ts`/`WeatherIcon.tsx` were deliberately left unmodified (legacy `.tsx`, out of scope beyond the narrow mapping responsibility).

No discrepancy was found between the prompt's stated findings and the live tree. No STOP condition was triggered.

## 2. Scope confirmation

Confirmed unmodified after implementation (re-diffed against pre-ticket state): `src/lib/scoring.js`, `src/lib/forecastNormalize.js`, `src/hooks/useLeaderboardScores.js`, `src/MapView.jsx`, `src/lib/relocationEngine.js`, `src/lib/relocationService.js`, `api/forecast.js`, `src/lib/forecastCache.js`'s query-building, `src/utils/compareCampsiteForecasts.js`. `row.code` remains exactly `daily.weathercode[i]`, computed and passed to `scoreSiteDay` before any new code runs. No new backend route, dependency, feature gate, or analytics event was added. No `.tsx`/TypeScript file was created; the two touched legacy `.ts`/`.tsx` files (`WeatherIconMapping.ts`, `WeatherIcon.tsx`) were left byte-for-byte unchanged.

## 3. Files changed

**New:**
- `src/lib/weatherPresentation.js` — the single canonical WMO code → `{family, textKey, iconId}` presentation table, shared by `ForecastTable.jsx` and `HourlyForecastModal.jsx`. Exports `resolveWeatherPresentation(code, {isDay})`, `getWeatherCodeFamily(code)`, `isSupportedWeatherCode(code)`, `isDaytimeHour(hour)`, and the `WEATHER_FAMILY_CODES` table (ascending-intensity code arrays per family) reused by the summarizer below. Icon assignments for every currently-supported code exactly mirror `WeatherIconMapping.ts`'s existing behavior (verified code-by-code), so no existing icon changes. Unknown/unsupported/missing codes resolve to an explicit `{family:"unknown", textKey:"unknownWeather", iconId:null, isUnknown:true}` — never a numeric-coercion fallback to a real condition.
- `src/lib/dailyWeatherSummary.js` — the pure daily-condition summarizer, `summarizeDailyWeatherCode({hourly, date, fallbackCode})`. Implements the primary 06:00–22:00 window, family-grouped dominance voting with a deterministic (count → closest-to-14:00 → fixed family-priority) tie-break, the significant-precipitation/storm override with the documented precedence (thunder/hail → freezing precipitation → snow → rain/showers → drizzle), and observed-intensity-first representative-code selection within the winning family. Never reads/writes anything scoring-facing.
- `src/lib/weatherPresentation.test.js` (27 tests), `src/lib/dailyWeatherSummary.test.js` (31 tests), `src/hooks/useForecast.scoringInvariance.test.js` (2 tests), `src/components/ForecastTable.weatherPresentation.test.jsx` (10 tests), `src/components/HourlyForecastModal.test.jsx` (9 tests, first-ever test file for this component), `tests/e2e/forecast-weather-summary.spec.js` (3 tests).

**Modified:**
- `src/hooks/useForecast.js` — inside the existing `rows` `useMemo`, `scoreSiteDay(row)` still runs first on the untouched `row`; a new `summaryCode = summarizeDailyWeatherCode({ hourly: data?.hourly, date: row.date, fallbackCode: row.code })` is computed separately and merged into the returned row object only afterward. `row.code` itself is never reassigned.
- `src/components/ForecastTable.jsx` — removed both `Number(r.code ?? 0)` coercions (Round 2 §1). The display code is now `r.summaryCode ?? r.code ?? null` (null-preserving), resolved through `resolveWeatherPresentation`. When `isUnknown`, renders a small neutral "—" placeholder with an accessible `unknownWeather` label instead of `<WeatherIcon>` (no new icon asset). The precipitation-duration caption now checks `presentation.family` (derived from the *displayed* code) instead of the old local `SNOW_CODES`/`RAIN_CODES` arrays keyed off raw `row.code` (Round 2 §3) — removed those duplicated arrays. `weatherMap` prop removed (superseded, see below).
- `src/components/HourlyForecastModal.jsx` — `getWeatherInfo` now calls the shared `resolveWeatherPresentation` (day/night resolved via the new `isDaytimeHour(row.hour)` rule, 07:00–20:59 = day) instead of its own `weatherMap`-lookup + emoji logic; renders the shared `<WeatherIcon>` SVG component instead of an emoji, generalizing its own pre-existing safe null-handling to also cover unrecognized-but-present codes (previously those showed `"Weather ${code}"`; now they correctly share the same explicit unknown treatment as null). `weatherMap` prop removed.
- `src/App.jsx` — removed the now-unused `import { WEATHER_MAP } from "./utils/weatherMap"` and both `weatherMap={WEATHER_MAP}` prop-passes into `ForecastTable`/`HourlyForecastModal`.
- `src/i18n/translations.common.js` — added one new key, `unknownWeather` (EN "Unknown weather", IS "Óþekkt veður") — reusing the exact wording `HourlyForecastModal` already hardcoded for its null-code case, now centralized and translated for both components' explicit unknown state. No other new user-facing strings were added.

**Deleted:**
- `src/utils/weatherMap.js` — confirmed via `grep -rln "weatherMap|WEATHER_MAP" src/` to have zero remaining consumers (application or test) after the above changes; fully superseded by `weatherPresentation.js`, consistent with the ticket's "remove duplicated local WMO code lists where the shared source supersedes them."

## 4. Weather-code presentation design

**Aggregation window**: primary = `06:00 <= local hour < 22:00` (matched via `Open-Meteo` timezone-local timestamp string prefix, no UTC parsing — same technique `forecastNormalize.js` already used). If the primary window has zero usable observations but same-date data exists outside it, that same-date data is used instead. If there is no usable same-date hourly data at all, the raw daily `fallbackCode` is returned unchanged (finite-number check only; `null`/`undefined`/non-numeric → `null`, never coerced to `0`).

**Family table** (`WEATHER_FAMILY_CODES`, ascending intensity, shared with `weatherPresentation.js`):
| Family | Codes (light → heavy) |
|---|---|
| clear | 0, 1 |
| partlyCloudy | 2 |
| overcast | 3 |
| fog | 45, 48 |
| drizzle | 51, 53, 55 |
| freezingPrecip | 56, 57, 66, 67 |
| rain | 61, 63, 65, 80, 81, 82 |
| snow | 71, 73, 75, 77, 85, 86 |
| thunderHail | 95, 96, 99 |

**Dominance tie-break** (only reached when two+ families have equal in-window vote counts): (1) the family with an observation closer to 14:00 (the primary window's midpoint) wins; (2) if still tied, a fixed, input-order-independent `FAMILY_PRIORITY_ORDER` array breaks the tie. Neither step ever reads array/object-key order of the hourly payload itself.

**Representative-code rule**: within the winning family, the highest-intensity code actually observed wins (never an unobserved code); same-code ties at different hours trivially return the same code regardless of order, so no further tie-break changes the output.

**Significant-precipitation/storm override** (evaluated independently of dominance, and can win even when its family has fewer raw votes): thunder/hail (95/96/99), all freezing precipitation (56/57/66/67), and all snow codes (71/73/75/77/85/86) are significant on a single primary-window observation. Within drizzle/rain, a single heavy-tier observation (55, 65, or 82) is significant alone; otherwise at least two same-family observations are required, and — only when a finite precipitation amount is available for *every* qualifying observation — their sum must reach ≥1.0mm; if any amount is missing, the two-observation code-count evidence alone qualifies (missing is never treated as zero). When multiple families qualify simultaneously, precedence is thunder/hail → freezing precipitation → snow → rain/showers → drizzle, exactly as specified.

## 5. Before/after data flow

**Before**: `useForecast.js`'s `rows` = `normalizeDailyToScoreInput(daily, hourly).map(row => ({...row, ...scoreSiteDay(row)}))`; `row.code` (raw `daily.weathercode[i]`) was the ONLY weather-code field, read both by `scoreSiteDay` (scoring) and directly by `ForecastTable`/`HourlyForecastModal` (presentation) — the same value serving two purposes, with no separation.

**After**: `scoreSiteDay(row)` still runs first, on the exact same untouched `row` object (unchanged call, unchanged inputs, unchanged outputs — verified by a dedicated scoring-invariance test, §7). Only afterward is `summaryCode = summarizeDailyWeatherCode({hourly: data.hourly, date: row.date, fallbackCode: row.code})` computed and merged into the row that's returned to the component tree. `row.code` is never reassigned, never fed `summaryCode`, and remains available unchanged to every existing consumer (`useLeaderboardScores` doesn't even go through this hook). `ForecastTable` reads `r.summaryCode ?? r.code ?? null` for display only; the row object passed to `onSelectDay`/the hourly modal is otherwise identical to before.

## 6. Required tests — status (approved prompt §6, 15 categories + Round 2 additions)

All covered:

1. Ticket fixture (clear 00–18 + overcast@21 → not overcast) — `dailyWeatherSummary.test.js`, `ForecastTable.weatherPresentation.test.jsx` (render-level), `tests/e2e/forecast-weather-summary.spec.js` (real browser).
2. Isolated early/late observation doesn't define the day — `dailyWeatherSummary.test.js` (both the "excluded from window" and "window empty, whole-day fallback" shapes).
3. Dominant partly-cloudy/overcast/fog from mixed inputs — `dailyWeatherSummary.test.js`.
4. Related codes grouped before dominance (clear+mainly-clear vs. isolated overcast) — `dailyWeatherSummary.test.js`.
5. One isolated light-rain code does not override a dry/clear day — `dailyWeatherSummary.test.js`.
6. Two coherent light/moderate observations with qualifying amount override; below-threshold does not — `dailyWeatherSummary.test.js` (both directions), plus missing-amounts-still-qualify.
7. One heavy/freezing/snow/thunder-hail observation follows the significant rule — `dailyWeatherSummary.test.js` (all four family cases).
8. Multiple qualifying overrides follow deterministic precedence — `dailyWeatherSummary.test.js` (four precedence-pair cases).
9. Order-independence + input immutability — `dailyWeatherSummary.test.js`.
10. Malformed timestamps/codes, sparse/no primary-window data, missing precipitation array, missing hourly, missing/invalid fallback — `dailyWeatherSummary.test.js` (caught a real bug here, see §9.1).
11. Scoring-invariance regression — `useForecast.scoringInvariance.test.js`, at the real integration boundary (renders the actual hook with mocked `getForecast`, two different hourly patterns, asserts every scoring-facing field is byte-identical while `summaryCode` differs).
12. `ForecastTable` renders label/icon from `summaryCode`; row selection still passes the intact row — `ForecastTable.weatherPresentation.test.jsx`.
13. Daily and hourly resolve clear/cloudy/fog/rain/sleet/snow/thunder-hail/unknown through the same table — `weatherPresentation.test.js` (13 representative codes + day/night variants) and `HourlyForecastModal.test.jsx` (component-level, same codes).
14. The Laugardalur-style contradiction is impossible in rendered output — `ForecastTable.weatherPresentation.test.jsx` (unit-level) and `tests/e2e/forecast-weather-summary.spec.js` (real browser, real DOM).
15. Existing forecast-day-click analytics, table disclosure, hourly modal loading/error/empty states, precipitation text, hazards, accessibility unchanged — `ForecastTable.analytics.test.jsx` re-run unmodified (12/12 green), `HourlyForecastModal.test.jsx`'s dedicated loading/error/empty-state block.

Round 2 additions: unsafe-fallback regression (`ForecastTable.weatherPresentation.test.jsx`'s dedicated describe block: null, undefined, and unsupported-numeric code never render clear-sky or overcast, at both the component and pure-resolver level); mixed-intensity representative selection with reordering (`dailyWeatherSummary.test.js`); precipitation-caption-follows-displayed-family in both directions (`ForecastTable.weatherPresentation.test.jsx`).

No existing scoring, time-weight, weather-icon, forecast-table, hourly-modal, map, relocation, analytics, or non-disclosure test was weakened or deleted.

## 7. Tests, lint, and build actually run

- **New pure-module tests** — `npx vitest run src/lib/weatherPresentation.test.js src/lib/dailyWeatherSummary.test.js` → **58/58 passed**, 2 files.
- **Scoring-invariance integration test** — `npx vitest run src/hooks/useForecast.scoringInvariance.test.js` → **2/2 passed**.
- **`ForecastTable` (new + existing) and `HourlyForecastModal` (new)** — `npx vitest run src/components/ForecastTable.weatherPresentation.test.jsx src/components/ForecastTable.analytics.test.jsx src/components/HourlyForecastModal.test.jsx` → **31/31 passed**, 3 files.
- **Scoring/leaderboard/MapView/comparison/relocation regression** — `npx vitest run src/lib/scoring.test.js src/lib/relocationEngine.timeWeight.test.js src/MapView.test.jsx src/utils/compareCampsiteForecasts.test.js src/lib/relocationEngine.regression.test.js src/lib/relocationService.regression.test.js src/lib/relocationEngine.test.js src/lib/relocationEngine.badDayVeto.test.js src/lib/relocationEngine.roughWindow.test.js` → **141/141 passed**, 9 files — none of these files were modified; run to prove no decision/scoring regression.
- **Full suite** — `npx vitest run` → **1046/1046 passed**, 89 files (up from 967/84 before this ticket — +79 tests, +5 files).
- **Lint** — `npm run lint` → exit 0, no output (project files and the new Playwright spec both checked).
- **Build** — `npm run build` → succeeded (`✓ built in 7.22s`). Same pre-existing "chunks larger than 500 kB" advisory as every prior run this session, unrelated to this ticket.
- **`git diff --check`** → exit 0. Only an informational LF→CRLF autocrlf notice on `docs/ai/CURRENT.md` (pre-existing repo behavior); zero actual whitespace errors, and none of this ticket's own new/modified source files triggered even the informational notice.

No command was skipped or reported as passing without actually running.

## 8. Mandatory rendered-fixture inspection (approved prompt §8)

Deterministic browser injection was feasible without any production hook — the same Playwright `webServer`(`npm run dev`)/`page.route()` stubbing pattern already established in `tests/e2e/footer-blog-link.spec.js` (and reused for Ticket 398) covers `/api/campsites` and `/api/forecast` cleanly. A new spec, `tests/e2e/forecast-weather-summary.spec.js`, was written and **actually run**:

```
npx playwright test tests/e2e/forecast-weather-summary.spec.js --reporter=list
```
Result: **3/3 passed** (one assertion was corrected on the first real run — see §9.2).

One 7-day forecast fixture was built containing BOTH required cases simultaneously: day 0 (2026-09-08) is the exact issue #400 fixture (raw daily code = overcast, hourly clear 00:00–18:00 + one overcast observation at 21:00); day 1 (2026-09-09) is a meaningful-precipitation case (raw daily code = clear, but two 08:00/14:00-window moderate-rain observations totaling 1.6mm qualify the significant-precipitation override). Every other day is uniform/clear filler.

Inspected, with screenshots saved to `test-results/ticket-400/` (gitignored, not committed):

| Case | Lang | Theme | Viewport | Screenshot |
|---|---|---|---|---|
| Table (both fixture days) | IS | light | 1280×900 | `table-is-light-desktop.png` |
| Table (both fixture days) | EN | dark | 1280×900 | `table-en-dark-desktop.png` |
| Table (both fixture days) | IS | light | 320×720 | `table-is-light-mobile320.png` |
| Hourly modal (day 0, showing real per-hour codes incl. 21:00 Overcast) | EN | dark | 1280×900 | `hourly-modal-en-dark-desktop.png` |
| Hourly modal | IS | light | 320×720 | `hourly-modal-is-light-mobile320.png` |

I directly inspected `table-is-light-desktop.png` and `hourly-modal-en-dark-desktop.png` via the Read tool. The desktop IS/light screenshot confirms day 0 renders "Heiðskírt" (clear, sun icon) — never "Alskýjað" (overcast) — and day 1 renders "Skúrir" (showers, rain-cloud icon) with its 1.6mm correctly shown, while the other five filler days correctly show "Heiðskírt"; the whole page (hero, other cards, map) renders normally around it, confirming no layout regression. The hourly modal screenshot confirms the day/night icon rule works in real rendering: 00:00/03:00/06:00 show a crescent-moon "Clear sky" icon while 09:00/12:00 show a sun "Clear sky" icon — same label, correct icon variant. The spec's own assertion (not just the static screenshot, which didn't need to scroll) independently confirmed 21:00 still shows "Overcast" in the hourly list — proving the daily summary is the only thing being summarized; the hourly view still shows the real per-hour codes.

## 9. Deviations and residual risks

1. **`src/utils/weatherMap.js` was deleted, not merely stopped-using.** Confirmed zero remaining references (app or test) before deletion via `grep -rln`. This directly implements the prompt's "remove duplicated local WMO code lists where the shared source supersedes them" rather than leaving a fully dead file behind. `src/utils/WeatherIconMapping.ts` was deliberately left in place despite also having zero remaining application consumers (only a now-inert `vi.mock` in the pre-existing analytics test file references it) — out of caution around the prompt's explicit "avoid broad conversion of existing legacy TypeScript files," a `.ts` file was treated more conservatively than a plain `.js` data object even though both are equally dead. Flagged as a candidate for a future cleanup ticket, not addressed here.
2. **Test-authoring bug caught and fixed during the mandatory e2e run**: the mobile-viewport spec originally asserted `document.documentElement.scrollWidth <= 321`, which failed — not because of a regression, but because `ForecastTable`'s pre-existing (untouched by this ticket) `overflow-x-auto` table wrapper legitimately allows its many metric columns to scroll internally on narrow viewports, which is by design. The assertion was corrected to check that the weather-condition cell itself (the actual element this ticket touches) stays within the viewport, which is the accurate and relevant check; the wide-table's own internal scroll behavior is untouched, out of scope, and confirmed via screenshot to render sensibly.
3. **Real implementation bug caught by the new tests, fixed before completion**: `summarizeDailyWeatherCode`'s fallback validation initially used `Number(fallbackCode)` unconditionally, and `Number(null) === 0` — meaning a genuinely missing fallback would have silently resolved to WMO code 0 (clear sky), exactly the kind of coercion this ticket explicitly forbids. Fixed by explicitly short-circuiting `null`/`undefined` to `null` before any numeric coercion. Caught by `dailyWeatherSummary.test.js`'s own safe-fallback tests on the first real run, not discovered later.
4. **56/57 (freezing drizzle) and 85/86 (snow showers) reuse existing textKeys** (`freezingRain`/`heavyFreezingRain` and `lightSnow`/`heavySnow` respectively) rather than gaining brand-new IS/EN copy, since `WEATHER_MAP` had no entries for them at all before this ticket (they rendered as a broken raw-key/`"Weather 56"` leak). This was a deliberate minimal choice to avoid expanding i18n scope; flagged here as a judgment call, not hidden.
5. **`isDaytimeHour`'s 07:00–20:59 day/night boundary is a small fixed rule**, not real sunrise/sunset data, exactly as the prompt anticipated ("a small deterministic rule or existing precedent" — no existing precedent was found in the codebase). Documented in the module; only affects which icon variant (not label/category) is shown for clear/partly-cloudy hourly rows.
6. No other risk identified: `scoreSiteDay`, `normalizeDailyToScoreInput`, the leaderboard's independent scoring path, `MapView`, relocation/route-planning, and every existing test suite named in the prompt were all confirmed unmodified and re-verified green, not merely assumed. The one pre-existing, unrelated e2e failure (`blog-draft-preview.spec.js`) observed during the full Playwright run was independently reproduced in isolation and confirmed to predate and have no relationship to this ticket's diff.

## 10. Confirmation

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**

---

# Revision 2 — null-code coercion fix

Executed against: `docs/ai/tasks/ticket-400/approved-prompt-v2.md`, following Jonesy's `REVISE` finding and Ripley's `REVISE` confirmation in `result-review.md` (Revision 1).

## R2.1 Finding being fixed

`src/lib/dailyWeatherSummary.js`'s `parseValidObservations` coerced a literal `null` entry in `hourly.weathercode` (or the `hourly.weather_code` alias) through `Number(rawCode)`. `typeof null === "object"`, so `null` fell through to the `Number(rawCode)` branch, and `Number(null) === 0` — WMO clear sky, a *supported* code. The observation was therefore kept and counted as a genuine clear-sky vote in dominance, contradicting the approved prompt's explicit "never coerce missing codes to clear sky (0)" requirement and required test category 10. `undefined` was already safe (`Number(undefined) === NaN`, correctly filtered by the existing `isSupportedWeatherCode` check) — only `null` was affected.

## R2.2 Fix applied

`src/lib/dailyWeatherSummary.js`, `parseValidObservations` — added a single guard immediately after reading `rawCode`, before any numeric coercion:

```js
const rawCode = codes ? codes[i] : null;
// Number(null) === 0 (WMO clear sky) — a missing per-hour code must
// never be coerced into a real observation (Revision 2, #400).
if (rawCode == null) continue;
const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
if (!isSupportedWeatherCode(code)) continue;
```

`codes` is already selected as either `hourly.weathercode` or (only when the former isn't an array) `hourly.weather_code`, so this single guard covers both accepted arrays uniformly — whichever one is actually in use. No other line in this function, no family/dominance/tie-break/intensity/override logic, no shared presentation module, no component, and no other file was touched. Exactly matches the fix specified in `approved-prompt-v2.md`.

## R2.3 Regression test added

Two focused cases added to `src/lib/dailyWeatherSummary.test.js` (in the existing "safe fallback behavior" describe block, immediately before the pre-existing "sparse primary-window data" case):

- **`a literal null entry in hourly.weathercode is excluded, never coerced to clear sky (0) (Revision 2)`** — a fixture where overcast (3 votes, closest-to-14:00 distance 1) genuinely beats clear (2 votes, closest-to-14:00 distance 4) on raw count. A `null` is injected at exactly hour 14 (the tie-break midpoint). If wrongly coerced to WMO 0, clear would jump to 3 votes (tying overcast's count) *and* gain the closest-to-midpoint observation, flipping the result to clear via the tie-break; with the guard, the null contributes no vote and overcast wins outright as expected (`toBe(3)`).
- **`the hourly.weather_code alias enforces the same missing-value rule (Revision 2)`** — the identical hour/vote construction, but using `weather_code` instead of `weathercode` as the only code array present, proving the alias path is covered by the same guard.

**Verified the tests actually catch the regression, not just pass incidentally**: I temporarily reverted the guard (removed the `if (rawCode == null) continue;` line only, via a direct edit, no git operations), re-ran the two new tests, and confirmed both failed exactly as expected (`expected +0 to be 3`, i.e. the null was miscounted as clear and flipped the tie-break). I then restored the guard and re-ran — both passed. This is a red→green proof, not narrated from memory.

No existing test was weakened, and no other production or test file needed touching to cover this — the existing five-file Ticket 400 test suite already exercises the same helper contract sufficiently that no STOP condition was triggered.

## R2.4 Validation — exact commands and results

- **`dailyWeatherSummary.test.js` alone** — `npx vitest run src/lib/dailyWeatherSummary.test.js` → **33/33 passed** (31 from Revision 1 + 2 new).
- **Five-file Ticket 400 targeted set** — `npx vitest run src/lib/dailyWeatherSummary.test.js src/lib/weatherPresentation.test.js src/hooks/useForecast.scoringInvariance.test.js src/components/ForecastTable.weatherPresentation.test.jsx src/components/HourlyForecastModal.test.jsx` → **81/81 passed**, 5 files (up from 79 in Revision 1's Ripley-run baseline).
- **Full suite** — `npx vitest run` → **1048/1048 passed**, 89 files (up from 1046/89 after Revision 1 — +2 tests, 0 new files).
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded (`✓ built in 4.11s`). Same pre-existing "chunks larger than 500 kB" advisory as every prior run, unrelated to this ticket.
- **`git diff --check`** → exit 0. Only the same pre-existing informational `docs/ai/CURRENT.md` LF→CRLF autocrlf notice; zero actual whitespace errors; `dailyWeatherSummary.js`/`dailyWeatherSummary.test.js` triggered no notice at all.

No command was skipped or reported as passing without actually running.

## R2.5 Confirmation no unrelated file changed

`git status --short` after Revision 2 shows exactly the same file set as after Revision 1 (nothing was ever committed, so both revisions' changes sit in the same untracked/modified working tree) with two exceptions: `src/lib/dailyWeatherSummary.js` (the guard) and `src/lib/dailyWeatherSummary.test.js` (the two new tests) are the only files whose content changed during Revision 2 itself. `src/lib/weatherPresentation.js`, `useForecast.js`, `ForecastTable.jsx`, `HourlyForecastModal.jsx`, `App.jsx`, `translations.common.js`, `weatherMap.js`'s deletion, and every Revision 1 test file are unchanged since Revision 1 — confirmed by re-reading each against its Revision 1 content before editing anything.

## R2.6 Deviations and residual risks

None. This revision is exactly the narrow guard specified in `approved-prompt-v2.md`, plus the required regression coverage for both accepted array names, plus the red→green verification that the new tests genuinely detect the fixed bug. No STOP condition was encountered.

## R2.7 Final confirmation

`docs/ai/CURRENT.md` has been updated: stage set to `CC_COMPLETE`, CC report path unchanged (still this file). **Not committed. Not pushed.**
