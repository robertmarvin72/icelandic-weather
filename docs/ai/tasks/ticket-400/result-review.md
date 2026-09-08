# Result Review — Ticket 400

## Jonesy review — Round 1 (CC búinn)

**Verdict: REVISE**

## Method

Read `approved-prompt-v1.md` in full (confirmed it matches the Round 2 text I approved in `prompt-review.md`, including the three Round 2 subsections). Read `cc-report.md` in full. Independently staged and read the live implementation rather than trusting the report:

- New: `src/lib/weatherPresentation.js`, `src/lib/dailyWeatherSummary.js`, and their test files.
- Modified: `src/hooks/useForecast.js`, `src/components/ForecastTable.jsx`, `src/components/HourlyForecastModal.jsx`, `src/App.jsx`, `src/i18n/translations.common.js`, and their test files.
- `tests/e2e/forecast-weather-summary.spec.js` (real Playwright spec, read in full).
- `device_list_dir` scope/mtime checks on `src/utils`, `src/lib`, `src/hooks`, `src/components`, `api`, `src` root.

## What's confirmed correct

- **Scoring boundary is real and intact.** `useForecast.js`'s `rows` map calls `scoreSiteDay(row)` on the untouched normalized row *before* `summaryCode` is computed; `summaryCode` is merged into the returned object afterward via spread, `row.code` is never reassigned. `useForecast.scoringInvariance.test.js` renders the actual hook with two different hourly patterns via a mocked `getForecast` and asserts every scoring-facing field (`code, points, class, basePts, windPen, gustPen, rainPen, precipTimingMultiplier, season, tmax, tmin, rain, windMax, windGust`) is byte-identical while only `summaryCode` differs. This is a genuine regression test, not a placeholder.
- **Both `Number(r.code ?? 0)` coercions in `ForecastTable.jsx` are gone**, replaced with `r.summaryCode ?? r.code ?? null` feeding `resolveWeatherPresentation`. Unknown codes render a neutral "—" placeholder with `aria-label={t(weatherKey)}` (`unknownWeather`) instead of `<WeatherIcon>` — confirmed this never falls through to `WeatherIcon.tsx`'s own `ICONS[iconId] ?? IconCloudy` fallback, since `iconId` is `null` and the component isn't even rendered in that branch.
- **`WeatherIconMapping.ts`'s ambiguous `"cloudy"`-for-unknown is bypassed, not fixed in place** — the new canonical `weatherPresentation.js` resolver is a fresh implementation with its own explicit `isUnknown` branch; `WeatherIconMapping.ts` is left byte-for-byte unchanged (mtime `1764790415872`, identical to pre-ticket) and has zero remaining importers in `src/` (grep confirms). Acceptable per the approved prompt's "avoid broad conversion of existing legacy TypeScript files" instruction — the ambiguity is made unreachable rather than edited in place.
- **`HourlyForecastModal.jsx#getWeatherInfo`'s safe null/unrecognized-code behavior is generalized** through the same shared resolver `ForecastTable` uses; both a null code and an unsupported numeric code (`12345`) render the explicit `unknownWeather` state, covered by both `weatherPresentation.test.js` and `HourlyForecastModal.test.jsx`.
- **Precipitation caption now keys off `presentation.family`** (derived from `summaryCode ?? row.code`), not raw `row.code` or the old local `SNOW_CODES`/`RAIN_CODES` arrays (confirmed removed from `ForecastTable.jsx`). Tested in both directions in `ForecastTable.weatherPresentation.test.jsx`, including the freezing-precipitation-gets-truthful-wording-only case.
- **Representative-code selection is genuinely intensity-first.** `representativeCodeForFamily` walks each family's ascending-intensity code array from the end and returns the first *observed* code — never an unobserved upgrade. `dailyWeatherSummary.test.js` covers the required mixed-intensity fixture (light rain 08:00 + heavy rain 14:00 → 65) and reordering-doesn't-change-result.
- **Override precedence, family grouping, and the core Laugardalur fixture (clear 00:00–18:00 + overcast 21:00 → clear, not overcast) all behave as specified** and are covered by both unit tests and the real-browser `forecast-weather-summary.spec.js`, which reproduces the exact fixture and also exercises light/dark, IS/EN, and a 320px mobile width.
- **Scope discipline holds.** `src/lib/scoring.js`, `forecastNormalize.js`, `relocationEngine.js`, `relocationService.js`, `src/hooks/useLeaderboardScores.js`, `api/forecast.js`, `src/lib/forecastCache.js`, `src/utils/compareCampsiteForecasts.js`, `src/MapView.jsx` all have mtimes from before this ticket's work began — none were touched. `src/utils/weatherMap.js` is confirmed deleted from disk (absent from `device_list_dir`), and `useLeaderboardScores.js`'s own independent `code` computation (noted correctly in `cc-report.md` itself) is untouched.
- `App.jsx`'s `weatherMap` import/props are confirmed removed; `unknownWeather` i18n key confirmed present in both EN ("Unknown weather") and IS ("Óþekkt veður").

## Required fix

**A `null` entry in `hourly.weathercode` (or `hourly.weather_code`) is silently coerced to WMO code 0 (clear sky) and counted as a valid observation** — the exact anti-pattern this entire ticket exists to eliminate, surviving at an unaudited call site.

`src/lib/dailyWeatherSummary.js`, `parseValidObservations`:

```js
const rawCode = codes ? codes[i] : null;
const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
if (!isSupportedWeatherCode(code)) continue;
```

`typeof null === "object"`, so a `null` entry falls through to `Number(null)`, which is `0` — a *supported* code (`WEATHER_CODE_TABLE[0]` = clear sky). `isSupportedWeatherCode(0)` returns `true`, so the observation is kept and contributes a CLEAR-family vote to dominance, rather than being excluded as unusable. `undefined` is safe here (`Number(undefined) === NaN`, correctly filtered), but `null` — a realistic shape for a missing/not-yet-available hourly value, and the exact shape `HourlyForecastModal.jsx#buildHourlyRows` already defends against via `?? null` — is not.

This directly contradicts the approved prompt's explicit requirement ("Ignore malformed timestamps and non-finite/unsupported codes safely; **never coerce missing codes to clear sky (`0`)**") and required test category 10 ("missing/unknown never becomes code `0` by coercion"). `dailyWeatherSummary.test.js`'s existing "non-finite and unsupported codes are ignored safely" test exercises `NaN`, `"not-a-code"`, and `999` — none of which trigger `Number(x) === 0` — so this gap has no regression coverage today, and the bug is real, not hypothetical: a genuinely missing per-hour code in an otherwise non-clear-dominant day can flip or dilute the dominant family toward "clear."

**Fix:** exclude `null`/`undefined` before numeric coercion, e.g.:

```js
const rawCode = codes ? codes[i] : null;
if (rawCode == null) continue; // missing per-hour code: unusable, never 0
const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
if (!isSupportedWeatherCode(code)) continue;
```

Add a regression test: a primary-window day that is otherwise dominated by a non-clear family (e.g. overcast) with one `null` `weathercode` entry mixed in must not have that hour counted as a clear-sky vote and must not shift or dilute the dominant-family result.

## Scope of the revision

Narrow — a one-line guard in `parseValidObservations` plus one new test case. No other file, no design change, no re-review of the architecture is needed; everything else in this review stands once this is fixed.

## Ripley final assessment — Revision 1

**Verdict: REVISE**

Ripley read `approved-prompt-v1.md`, the complete CC report, Jonesy's result review, and the live implementation. The required finding is confirmed directly in `parseValidObservations`: a literal `null` per-hour code reaches `Number(rawCode)`, becomes numeric WMO `0`, passes `isSupportedWeatherCode`, and incorrectly contributes a clear-family observation. This violates the approved no-missing-to-clear invariant.

Ripley independently ran the five highest-risk Ticket 400 test files:

```text
Test Files  5 passed (5)
Tests       79 passed (79)
```

Those green tests confirm the broader summarizer, shared presentation, scoring boundary, and component integrations remain stable, but they do not cover a literal null element in either accepted hourly code array. The passing result therefore does not invalidate Jonesy's finding; it confirms the missing regression branch.

Revision scope is deliberately limited to `approved-prompt-v2.md`: add the pre-coercion nullish guard in `dailyWeatherSummary.js`, add regression coverage for both `weathercode` and `weather_code`, rerun the specified validation, and append Revision 2 evidence to `cc-report.md`. No algorithm, mapping, UI, scoring, data-flow, backend, or unrelated test change is authorized.

## Jonesy review — Revision 2 (CC búinn)

**Verdict: PASS**

## Method

Read `approved-prompt-v2.md` in full (narrow, correctly scoped to exactly the Revision 1 finding). Read `cc-report.md`'s new "Revision 2 — null-code coercion fix" section in full. Independently staged and read the live files rather than trusting the report:

- `src/lib/dailyWeatherSummary.js` — re-read `parseValidObservations` in full.
- `src/lib/dailyWeatherSummary.test.js` — read both new Revision 2 test cases in full, worked through the vote arithmetic by hand.
- `device_list_dir` on `src/lib`, `src/components`, `src/hooks`, `src/utils` — compared every file's mtime against the Revision 1 review's recorded values.

## Findings

- **The exact fix from `approved-prompt-v2.md` is present, verbatim, at the correct location.** `parseValidObservations` now reads `const rawCode = codes ? codes[i] : null;` followed immediately by `if (rawCode == null) continue;` *before* `Number(rawCode)` is ever reached, with the existing `isSupportedWeatherCode` check unchanged immediately after. `null` and `undefined` are now excluded pre-coercion; supported numeric/numeric-string codes and unsupported/malformed codes are handled exactly as before. No other line in the function changed.
- **The two new regression tests are genuine, not decorative.** I hand-verified the vote arithmetic in "a literal null entry in hourly.weathercode is excluded, never coerced to clear sky (0)": overcast has 3 in-window observations (hours 12/13/15) vs. clear's 2 (hours 10/18). Without the guard, a `null` injected at hour 14 would coerce to WMO `0` (clear), making clear's count 3 (tying overcast) *and* giving clear the closest-to-midpoint observation (distance 0 vs. overcast's best distance 1), flipping the tie-break to clear. With the guard, the null contributes nothing and overcast wins outright — the test asserts `toBe(3)`. This is a real, discriminating test: it would fail exactly the way CC's report describes (`expected +0 to be 3`) if the guard were removed, not a coincidental pass. The `hourly.weather_code` alias case repeats the identical construction to confirm both accepted array names hit the same guard, since `codes` is selected once (`weathercode` first, `weather_code` only as fallback) before this loop runs.
- **Scope discipline for Revision 2 is confirmed independently, not just asserted in the report.** `device_list_dir` on `src/lib` shows only `dailyWeatherSummary.js` (mtime `1788894326170`) and `dailyWeatherSummary.test.js` (mtime `1788894316107`) changed since the Revision 1 review; `weatherPresentation.js`, `scoring.js`, `forecastNormalize.js`, `relocationEngine.js`, `relocationService.js` all carry their unchanged Revision-1-era mtimes. `src/components` and `src/hooks` listings likewise show `ForecastTable.jsx`, `HourlyForecastModal.jsx`, `useForecast.js`, and all their test files at their exact Revision 1 mtimes/sizes — nothing was touched during Revision 2. `src/utils/WeatherIconMapping.ts` remains at its original pre-ticket mtime.
- No other Revision 1 finding needs re-litigating — this was the only outstanding item, and it's resolved at the exact location and with the exact scope both this review and Ripley's required.

## Verdict

**PASS.** The null-coercion regression is fixed at the correct call site, before numeric coercion, matching `approved-prompt-v2.md` exactly. Regression coverage is real and discriminating for both accepted hourly array names. No unrelated file changed. Combined with the Revision 1 findings above (scoring boundary, unsafe-fallback removal, shared presentation mapping, precipitation caption, intensity selection, scope discipline), Ticket 400's implementation is sound.

## Ripley final assessment — Revision 2

**Verdict: PASS**

Ripley read `approved-prompt-v2.md`, the appended CC Revision 2 report, Jonesy's Revision 2 review, and the live guard/tests.

The implementation matches the authorized revision exactly: `parseValidObservations` now excludes `rawCode == null` before numeric conversion, so neither `null` nor `undefined` can become WMO `0`. The two focused tests exercise both accepted payload arrays (`weathercode` and `weather_code`) with discriminating vote/tie-break fixtures that would return clear sky if the guard were absent.

Ripley independently reran the complete five-file Ticket 400 targeted set after Revision 2:

```text
Test Files  5 passed (5)
Tests       81 passed (81)
```

This independently covers the revised summarizer branch, canonical weather presentation, scoring invariance, daily-table rendering, and hourly-modal integration. CC separately reports 1048/1048 for the full Vitest suite, lint exit 0, successful production build, and clean `git diff --check`; those broader results remain attributed to CC's Revision 2 report rather than claimed as Ripley's independent execution.

No remaining conflict exists with the approved prompt or Jonesy's review. Ticket 400 is complete. No commit or push was performed.
