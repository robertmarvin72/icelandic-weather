# Approved Prompt v1 — Ticket 400

Implement GitHub issue #400, **Bug: Daily weather summary conflicts with hourly forecast**, as a focused correction to the daily forecast's presentation condition.

The daily weather label/icon must become a truthful summary of the same location/date's hourly WMO weather codes, emphasizing the main daytime period and allowing genuinely meaningful precipitation or storm conditions to override a simple dominant-condition result. The scoring model and every existing scoring input/output must remain unchanged.

### 1. Mandatory preflight audit

Before editing, inspect and document in `cc-report.md`:

- GitHub issue #400 and its exact acceptance criteria;
- `src/hooks/useForecast.js`, including where `normalizeDailyToScoreInput` and `scoreSiteDay` consume `row.code`;
- `src/lib/forecastNormalize.js`, its time-weight tests, and every other consumer of `normalizeDailyToScoreInput`;
- `src/components/ForecastTable.jsx`, `HourlyForecastModal.jsx`, `App.jsx`, and their relevant tests;
- `src/utils/weatherMap.js`, `src/utils/WeatherIconMapping.ts`, `WeatherIcon`, and all existing weather-code label/icon fallbacks;
- `api/forecast.js`, `src/lib/forecastCache.js`, and the real daily/hourly Open-Meteo response shape and timezone behavior;
- `src/lib/scoring.js`, `useLeaderboardScores`, `MapView`, relocation/route-planner consumers, and any other path where changing a normalized weather code could alter a score, recommendation, or ranking;
- applicable i18n, accessibility, import, `.jsx`, no-new-library, and test conventions.

Known findings to verify rather than assume:

- `normalizeDailyToScoreInput` currently copies `daily.weathercode[i]` into `row.code`, and `useForecast` passes that row into `scoreSiteDay`. Replacing `row.code` with a new summary would therefore change scoring and violate this ticket.
- The daily table currently gets its text key from `weatherMap`, its SVG icon ID from `WeatherIconMapping`, and may replace precipitation text locally; the hourly modal separately gets emoji/text from `weatherMap`. There is not currently one canonical weather-code → base label/icon presentation path shared by both surfaces.
- The forecast endpoint already returns the hourly `time`, `weathercode`, and `precipitation` arrays needed for a client-side presentation summary. No backend or provider-field addition should be necessary.

If these findings do not match the live tree, reconcile the prompt against the real data-flow before implementation and record the discrepancy. If the fix would require changing scoring, the provider request, backend behavior, or a recommendation contract, **STOP before implementation**.

### 2. Hard scope and invariants

This ticket changes only the condition summarized and displayed in the daily forecast row, plus the shared weather-code presentation mapping needed to keep daily and hourly views consistent.

- Preserve the raw normalized/scoring field `row.code` exactly as today: it remains `daily.weathercode[i]` and continues to be the value passed to `scoreSiteDay` and other existing score/ranking consumers.
- Add a clearly separate presentation field such as `summaryCode` or `displayCode`, derived from hourly data for the matching date. `ForecastTable` uses that field for the displayed daily condition, with an explicit safe fallback described below.
- Do not change temperature, rain, wind, gust, precipitation timing/type, hazards, score points/classes, pleasantness modifiers, leaderboard ordering, stay/move/consider outcomes, comparison logic, route planning, or Free/Pro behavior.
- Do not mutate the raw daily/hourly response or caller-owned arrays.
- Do not change `/api/forecast`, Open-Meteo query fields, cache keys, fetch frequency, retries, timezones, or add a second fetch.
- No backend, new API, dependency, feature gate, analytics event, broad forecast redesign, commit, or push.

### 3. Pure deterministic daily-condition summarizer

Create a small pure JavaScript helper with an explicit input/output contract, for example:

```js
summarizeDailyWeatherCode({ hourly, date, fallbackCode }) -> WMO code | null
```

The exact public name/file may follow existing project patterns, but the logic must not live inside JSX or scoring code.

#### Input handling

- Match hourly rows to the requested local calendar date using the date portion of Open-Meteo's timezone-local timestamp strings. Do not parse them through UTC in a way that shifts the date/hour.
- Accept `hourly.weathercode` and the defensive `hourly.weather_code` alias only if existing payload conventions justify it.
- Ignore malformed timestamps and non-finite/unsupported codes safely; never coerce missing codes to clear sky (`0`).
- Primary summary window: `06:00 <= local hour < 22:00`. This represents the main waking/daytime period and includes evening conditions without allowing an isolated overnight value to define the day.
- If no valid observations exist in that window but valid same-date hourly observations exist, summarize those same-date observations rather than inventing a result.
- If there are no usable same-date hourly codes at all, return the supplied raw daily `fallbackCode` unchanged (or `null` if it is also unusable). This is resilience only, not the normal calculation path.

#### Dominant-condition rule

- Aggregate codes into documented presentation families before selecting the dominant condition so closely related clear/precipitation codes do not split their vote and let one isolated unrelated code win.
- At minimum distinguish: clear/mainly clear, partly cloudy, overcast, fog, drizzle, rain/showers, freezing precipitation/sleet, snow, and thunder/hail.
- Select the family represented by the greatest number of valid observations in the primary window. Select a deterministic representative WMO code within the winning family, preserving meaningful intensity when supported by the observations.
- Define and test a stable tie-break independent of input order. Prefer a representative condition near the center of the active daytime window over an arbitrary first/last array entry; never let array order or object-key order decide the result.
- A lone early/late observation must not defeat a clearly dominant daytime family. Required fixture: clear/mainly-clear from `00:00` through `18:00`, then overcast at `21:00`, must not summarize as overcast.

#### Significant precipitation/storm override

Dominance may be overridden only by evidence that would be materially misleading to omit:

- Any supported thunderstorm/hail observation in the primary window is significant and may override the dominant sky condition.
- A supported heavy precipitation/freezing-precipitation/snow code in the primary window is significant and may override it even when brief.
- Light or moderate precipitation must not override merely because of one isolated code. Require at least two valid primary-window observations in the same precipitation family and, when numeric hourly precipitation data is available for those observations, at least `1.0 mm` total in the primary window before overriding.
- If precipitation amounts are missing but at least two coherent precipitation-code observations exist, the code evidence may still qualify; missing amount data must not be treated as zero.
- When multiple override families qualify, use a documented deterministic safety-oriented precedence based on the existing WMO categories (thunder/hail, freezing precipitation, snow, rain/showers, drizzle). Do not invent a new danger score.

These thresholds are presentation-summary rules only. They must not be reused by or fed into `scoreSiteDay`, hazards, recommendation logic, or route planning.

### 4. Shared weather-code presentation source

Daily and hourly views must resolve the same WMO code through one canonical base mapping for both label key and icon ID.

- Introduce or consolidate a pure JavaScript presentation helper/table that returns at least `{ textKey, iconId }` for a weather code and day/night context.
- Reuse the existing `WeatherIcon` component and existing icon IDs/assets; do not create new artwork or dependencies.
- Both `ForecastTable` and `HourlyForecastModal` must consume this shared mapping rather than maintaining separate code-category logic or using an emoji in one surface and a different category mapping in the other.
- Preserve day/night icon differences where they are real: the daily summary is daytime; hourly rows derive day/night from the local hour using a small deterministic rule or existing precedent. Label/category mapping must remain the same for the same WMO code.
- Unknown/missing codes receive an explicit neutral unknown presentation and must never silently display as clear sky or overcast due to numeric coercion/fallback.
- Existing localized weather strings remain in i18n. Do not hardcode new user-facing IS/EN strings in components.
- If the daily precipitation-duration wording remains, it must be a clearly separate enrichment layered on the shared base mapping and must not cause daily/hourly to assign different base meanings to the same WMO code. Remove duplicated local WMO code lists where the shared source supersedes them.
- Do not create new `.ts`/`.tsx` files or add TypeScript annotations. Avoid broad conversion of existing legacy TypeScript files; migrate only the narrow mapping responsibility needed for this ticket.

### 5. Integration boundary and scoring proof

Integrate the summarizer where the already-fetched raw `data.hourly` and each normalized daily row/date are both available, preferably in `useForecast` after normalization and without altering the object passed to scoring:

1. obtain the existing normalized row with its untouched raw daily `code`;
2. call `scoreSiteDay(row)` exactly as before;
3. derive/add `summaryCode` from `data.hourly`, `row.date`, and `row.code` solely for presentation;
4. render the daily label/icon from `summaryCode`, falling back safely to `row.code` only when hourly data is unusable;
5. keep `row.code` available unchanged to all downstream consumers and modal selection.

An equivalent arrangement is acceptable only if tests make it structurally clear that `summaryCode` cannot flow into scoring, ranking, hazards, or recommendations.

Do not place the summary code into `normalizeDailyToScoreInput` if doing so would make presentation semantics part of a shared scoring-normalization contract or affect `MapView`/relocation consumers.

### 6. Required tests

Add focused tests with explicit hourly fixtures for at least:

1. Ticket fixture: clear/mainly clear `00:00–18:00` plus one overcast observation at `21:00` → result is not overcast and resolves to the dominant clear family.
2. An isolated early or late non-dominant condition does not define the whole day.
3. Dominant partly-cloudy/overcast/fog families are selected correctly from mixed inputs.
4. Related codes are grouped before dominance (for example, clear + mainly-clear cannot be split into losing buckets against one isolated overcast code).
5. One isolated light-rain code does not override an otherwise dominant dry/clear day.
6. Two coherent light/moderate precipitation observations with qualifying precipitation evidence can override; below-threshold numeric precipitation cannot.
7. One heavy precipitation, freezing-precipitation, snow, or thunder/hail observation follows the documented significant-weather rule.
8. Multiple qualifying overrides follow deterministic precedence.
9. Equivalent rows in different input order produce the same result and inputs remain unchanged.
10. Malformed timestamps/codes, sparse primary-window data, no primary-window data, missing precipitation arrays, missing hourly data, and missing fallback code behave safely; missing/unknown never becomes code `0` by coercion.
11. A scoring-invariance regression proves that changing hourly condition patterns changes only `summaryCode`: the raw `row.code`, `scoreSiteDay` input, points, class, and relevant leaderboard/recommendation-facing values remain identical.
12. `ForecastTable` renders its condition label and icon from `summaryCode`, while selecting the row still passes the intact scoring/daily data.
13. Daily and hourly components resolve representative clear, cloudy, fog, rain, sleet/freezing rain, snow, thunder/hail, and unknown codes through the same shared text-key/icon-ID mapping.
14. The actual Laugardalur-style daily-overcast/hourly-clear contradiction is impossible in rendered output.
15. Existing forecast-day click analytics, table disclosure, hourly modal loading/error/empty states, precipitation text, hazards, and accessibility remain unchanged.

Do not weaken or delete existing scoring/time-weight, weather icon, forecast table, hourly modal, map, relocation, analytics, or non-disclosure tests.

### 7. Accessibility and UX requirements

- The icon's accessible label and adjacent weather text must describe the same resolved summary condition; avoid duplicate or contradictory spoken labels.
- Preserve row keyboard activation, focus behavior, semantic table structure, modal behavior, and localized output.
- Do not add controls or visual noise. This is a correction to the small “first forecast” line, not a forecast-table redesign.
- Verify both Icelandic and English and light/dark themes at a narrow mobile width and representative desktop width.

### 8. Validation and report

Run and record exact commands/results for:

- the new pure summarizer and shared-presentation tests;
- affected `useForecast`, `ForecastTable`, `HourlyForecastModal`, weather mapping/icon, and forecast-normalization tests;
- scoring, leaderboard, `MapView`, comparison, and relocation tests needed to prove no decision/scoring regression;
- the full Vitest suite;
- `npm run lint`;
- `npm run build`;
- `git diff --check`.

Inspect deterministic rendered fixtures for the ticket's clear-day/late-overcast case plus one meaningful-precipitation case in IS/EN, light/dark, mobile/desktop. Record exactly what was inspected. If deterministic browser injection would require production hooks or broad infrastructure, document that limitation and perform the strongest existing component/render verification without expanding scope.

The report must include:

- the final aggregation window, family table, tie-break, representative-code rule, and precipitation/storm override behavior;
- before/after data-flow showing `row.code` remains scoring-only/raw-daily while `summaryCode` is presentation-only/hourly-derived;
- the canonical shared mapping used by both daily and hourly views;
- changed files, exact validation outcomes, deviations, and residual risks.

### 9. Acceptance criteria

- Daily weather condition is normally calculated from matching hourly weather data, not copied from Open-Meteo's daily summary code.
- The required clear-through-18:00 plus isolated 21:00-overcast fixture does not display Overcast for the day.
- Main daytime conditions determine the label unless a deterministic, tested significant precipitation/storm rule applies.
- Daily and hourly views use one canonical WMO weather-code → base label/icon mapping.
- Missing or malformed hourly data falls back safely without presenting unknown data as clear weather.
- Raw daily `row.code`, scoring inputs/results, rankings, recommendations, hazards, route planning, analytics, data fetching, caching, and Free/Pro behavior are unchanged.
- IS/EN, accessibility, responsive rendering, targeted/relevant/full tests, lint, build, and diff check pass.

### 10. Out of scope and STOP conditions

Out of scope: scoring or weight changes; changes to `normalizeDailyToScoreInput`'s scoring semantics; leaderboard/comparison/route-planner/recommendation changes; hazard thresholds; provider/backend/API/cache changes; new weather data; new dependencies; forecast-page redesign; new controls; analytics changes; feature gating; new TypeScript/`.tsx`; commit; push.

STOP and report before implementation if:

- the presentation summary cannot be kept structurally separate from `row.code` and all scoring/recommendation paths;
- required hourly fields are absent from the real cached/API payload;
- one shared label/icon mapping would require a broad icon-system rewrite or break unrelated consumers;
- date matching cannot be performed from the provider's timezone-local timestamps without changing API/timezone behavior;
- the work would alter scores, recommendation verdicts, rankings, entitlements, backend behavior, or another ticket's unresolved architecture;
- a truthful solution requires product thresholds materially beyond the explicit rules in this prompt.

Default git safety applies: do not commit and do not push.

## Approved Round 2 clarifications

Jonesy's required finding and both non-blocking notes are accepted. The following clarifications amend Round 1 and are authoritative wherever the earlier wording could be read ambiguously. All other Round 1 scope, constraints, acceptance criteria, tests, validation requirements, and STOP conditions remain unchanged.

### Unsafe weather-code fallbacks that must be removed

The shared-presentation work must audit and correct the actual pre-lookup coercion/default call sites, not merely create a safe helper that callers can bypass:

- In `src/components/ForecastTable.jsx`, remove both instances of `Number(r.code ?? 0)` (currently near the row-level condition lookup and the precipitation-text block). A null/missing `summaryCode` and `row.code` must reach the shared presentation resolver as unknown; neither may be converted to WMO code `0`/clear sky. When choosing the display code, use null-preserving semantics equivalent to `r.summaryCode ?? r.code ?? null`, then validate it in the shared resolver.
- In `src/utils/WeatherIconMapping.ts`, an unsupported/malformed code currently falls through to the same `"cloudy"` icon used explicitly for WMO code `3`. The new canonical resolver must not preserve that ambiguity. Unknown input must resolve to a deliberately neutral unknown presentation, including a distinct neutral icon treatment already supported by the repository if one exists. If the existing icon set has no truthful neutral icon ID and adding one would require a broad icon-system change, use a small accessible neutral fallback at the component boundary and document it; do not label or depict unknown as clear, overcast, or any other real condition.
- Generalize the safe behavior already present in `HourlyForecastModal.jsx#getWeatherInfo`: null is explicitly unknown and an unrecognized present value is not silently assigned a known weather meaning. Once the shared resolver replaces that local function, both daily and hourly callers must preserve this behavior.
- Search affected weather presentation paths for equivalent `?? 0`, `Number(null)`, generic `cloudy`, or other silent known-condition fallbacks. Correct only call sites used by the daily/hourly views in this ticket; report unrelated instances without broadening scope.

Required regression coverage must prove separately that `null`, `undefined`, a nonnumeric value, and an unsupported numeric WMO code never produce the clear-sky label/icon and never produce the explicit overcast label/icon. Tests must exercise the component call sites as well as the pure resolver so unsafe coercion cannot survive upstream of a correct helper.

### Representative intensity within the winning family

Within the family selected by dominance or significant-weather override, choose the representative WMO code by **observed intensity first**, then use temporal centrality only as a tie-break among observations of the same intensity:

1. Use an explicit per-family intensity ordering grounded only in the existing WMO codes (for example light < moderate < heavy).
2. Select the highest intensity that actually occurred in the relevant summary window; never upgrade to an unobserved code.
3. If that exact code/intensity occurs more than once, choose the observation closest to the midpoint of the `06:00–22:00` primary window only as an internal deterministic tie-break. Since the returned value is the code, equal-code temporal ties yield the same result regardless of row order.
4. Family-level dominance and override qualification still happen before this representative-code selection. A high-intensity representative does not allow a non-winning family to bypass the explicit override thresholds.

Add a targeted mixed-intensity test such as light rain at `08:00` and heavy rain at `14:00`: once the rain family qualifies/wins, the returned representative is the observed heavy-rain code. Reordering identical observations must not change it.

### Precipitation caption must follow the displayed summary family

`ForecastTable`'s precipitation-duration enrichment must not remain keyed from raw `row.code` after the visible headline/icon switch to `summaryCode`; that would recreate an internal contradiction within the same daily row.

- Determine whether precipitation enrichment applies from the shared resolver's family/category for the final display code (`summaryCode ?? row.code`), not from the duplicated local `SNOW_CODES` / `RAIN_CODES` arrays and not from raw `row.code` alone.
- Use the already normalized `row.precipType`, amount, timing, duration, and temperatures only to enrich wording after the displayed summary family has established that precipitation is the presented condition.
- Do not change how those normalized precipitation fields are calculated and do not feed the display family back into scoring.
- Freezing precipitation/sleet and other supported precipitation families must either receive truthful existing localized base wording or omit incompatible duration enrichment; they must never be mislabeled as ordinary rain/snow merely to reuse the caption helper.
- If the displayed summary is non-precipitation, do not render a precipitation-condition caption based solely on a conflicting raw daily WMO code. Numeric rain remains visible in its existing metric column and hazard handling remains unchanged.

Extend component tests to cover both directions: hourly-derived precipitation summary over a conflicting dry/cloudy raw daily code yields matching icon/base condition/caption, while an hourly-derived clear/cloudy summary over a conflicting raw daily precipitation code does not render a rain/snow condition caption. In both cases raw `row.code` and all score/hazard fields remain intact.

---

