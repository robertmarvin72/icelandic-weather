# #444 — Phase A audit: temperature surfaces (lowest/highest/"average")

Read-only. No application/source/test/config/API/translation file was edited to produce this document. All blob hashes below were taken at `git rev-parse HEAD` = see `cc-report.md`'s baseline section; every hash is re-verifiable with `git hash-object <path>`.

Evidence grades used throughout, per J9: **VERIFIED SOURCE** (read the function/caller directly this session), **VERIFIED SAMPLE** (partial/staged check), **INFERRED** (reasoned from adjacent evidence, not executed), **UNKNOWN** (not established this session).

**v2 correction notice (2026-10-26, Jonesy R1/R2)**: §1.4's RC-06 claim below was season-dependent and originally stated without that qualification — corrected in place below, not silently. New §1.4a (extrema-only/hazard consumers) and the directory-wide search records in §3 were added in this round; they did not exist in v1. See `cc-report.md`'s "v2 Correction" section for the full command/output trail.

---

## 1. Per-surface inventory

### 1.1 `src/lib/weatherFinderRanking.js` — `computeMetrics`/`rankWarmest` → Weather Finder's "avg temp"/"meðalhiti"

- **Hash**: `5538db26dc7acfd82e664f6bcadb898b5ecefe77`.
- **Entrypoint/consumer**: `computeMetrics` (not exported; lines 37-67) is called from `rankCalmest`/`rankWarmest`/`rankDriest` (lines 81-116). `rankWarmest` is the one that exposes `avgTemp` meaningfully (its score formula uses it, line 99). Rendered by `src/components/WeatherFinderCard.jsx:17-21` (hash `aba1cf577ee2f4b62517362c62dbdc127a78cfe5`), mounted on the homepage by `src/components/WeatherFinder.jsx` (hash `e636f485a855c0a6441fa1553e59b3e3c4c79f99`), itself mounted in `src/App.jsx` — **active UI surface**, not demo/dormant.
- **IS/EN label**: `t("weatherFinderAvgTemp")` → EN `"avg temp"` (`src/i18n/translations.common.js:461`), IS `"meðalhiti"` (line 1054; hash `2026d441a8b2c84ec0892d42ab6a6f27936a1bca`). "meðalhiti" is the literal Icelandic word for "average temperature" — a stronger, more literal claim of a true mean than the EN "avg temp."
- **Provider field / computation**: `tempSum += toNum(day.tmax)` (line 51) summed over `slice = forecast.slice(0, days)` (lines 32-38), divided by `slice.length` (`avgTemp: tempSum / n`, line 62). `day.tmax` here is `scoresById[site.id].rows[].tmax`, itself `data.daily.temperature_2m_max?.[i] ?? null` — see §1.8. **This is a mean of daily provider-MAX values, not a mean of any intra-day or hourly temperature.**
- **Raw vs. display/ranking semantics**: the SAME `avgTemp` number is both displayed (`WeatherFinderCard.jsx:21`) and fed into `rankWarmest`'s score (`weatherFinderRanking.js:99`, `score = avgTemp * 0.7 - rainDays * 0.2 - avgWind * 0.1`) — **display and ranking are the same computation, not separable without changing rank order.**
- **Period/time boundaries**: `days` = `effectiveDays` from `WeatherFinder.jsx:61` (`isPro ? days : 3`; Pro users can pick via a button row, `WeatherFinder.jsx:185-192`, default state `3`, `line 33`). The card DOES show the period, but only once, at the card-header level (`· {effectiveDays} {t("days")}`, `WeatherFinder.jsx:143`) — not restated next to each site's own "X.X°C avg temp" row. Timezone: see §2 (provider semantics) — `tmax` is the provider's own daily-max field for whatever day-boundary the request's `timezone` produced.
- **Min/max provider-day vs. subwindow**: each `day.tmax` is one provider calendar day's own max (not a subwindow); `computeMetrics` means these daily maxima together, it does not take a min/max across the window itself.
- **Data completeness / missing / coercion behavior**: `toNum(v, fallback = 0)` (line 13-15) — **a missing/non-numeric `tmax` is coerced to `0` and counted in the denominator (`n = slice.length`, unconditional).** This is NOT excluded; see RC-02/RC-03 in `reference-cases.md` for observed, executed proof. `0` is indistinguishable in the output from a genuinely-verified `0.0°C` day.
- **Conversions**: `WeatherFinderCard.jsx:17-21` — metric (°C) `toFixed(1)`; imperial (°F, `(avgTemp*9/5+32)`) `toFixed(0)`. **Precision differs by unit** (1 decimal vs. 0).
- **Shared scoring/ranking consumers**: `rankWarmest`'s own score directly (see above) — **changing the `toNum` default changes `rankWarmest`'s site ordering for identical inputs** (a different site could become "warmest #1"). This is exactly J2/J6(b)'s flagged STOP; not touched here.
- **Confidence**: VERIFIED SOURCE (function bodies read directly; behavior independently re-executed in `reference-cases.md` RC-01/RC-02/RC-03/RC-04).

### 1.2 `src/lib/comparisonUtils.js` — `calcMetrics` → `avgHighTemp`

- **Hash**: `0ccf3b6ce121126508b92c1fe5060c097e00ea92`.
- **Entrypoint/consumer(s)**: `calcMetrics` (lines 9-22). Two real call paths, confirmed this session:
  1. `src/hooks/useComparisonState.js:51,56` (hash `0f9924abd2305d5b0d1072c72b1767a176f4de5d`) — the shared hook CLAUDE.md names as "the single source of truth for the metric-based comparison," consumed by `src/components/HomeDecisionCard.jsx` (hash `f6d52623aacc0917ccb5bd196d1de2ba09bd6d7b`) — **confirmed this session, superseding J1's own "UNKNOWN until traced": `HomeDecisionCard.jsx` does not import `comparisonUtils` directly, but DOES consume `avgHighTemp` indirectly via `useComparisonState`'s `classifyMetrics`/`improvements` → `comparisonState.improvements` → `reasonLabels.temp` → `t("icReasonWarmer")` (`HomeDecisionCard.jsx:152-164`). This exposure is qualitative only ("warmer"/"hlýrra") — the homepage canonical card never shows the raw `avgHighTemp` number itself.**
  2. `src/components/InstantComparison.jsx` (hash `864198a1905fa14d29389cc73a638c82c51cf752`) — imports and calls `calcMetrics` directly (lines 4-10, 198, 203) when no `externalState` prop is supplied. Per CLAUDE.md ("Homepage Canonical Decision Surface"), `InstantComparison.jsx` is **not rendered on the homepage** — it is used standalone only on `src/pages/Brochure.jsx` (marketing demo). On Brochure, it DOES show the raw numeric `avgHighTemp` value (icon-only row, see below) — the live homepage never does.
- **IS/EN label**: none specific to this metric — `InstantComparison.jsx`'s `SiteCard`/`MetricRow` (lines 68-78, 106-108) renders an **icon-only row**: `"🌡"` + `{tempFmt}` + `"°C"` (hardcoded unit string, no "avg"/"high" wording at all, no `units` prop in this file). The numeric delta between sites uses `t("icTempDelta")` ("{diff}°C warmer"/"hlýrra" family — exact translated string not independently re-checked this session beyond confirming the key is called with `Math.round(diff)`, line 50).
- **Provider field / computation**: `temps = slice.map(r => r?.tmax).filter(v => typeof v === "number" && isFinite(v)); avgHighTemp: temps.length ? temps.reduce(...)/temps.length : null` (lines 15, 20). **Missing values are EXCLUDED from both the sum and the denominator** — the opposite missing-data policy from §1.1.
- **Period**: first 3 rows of whatever `rows` array is passed (`slice(0, 3)`, line 10) — fixed at 3, not user-adjustable, and NOT captioned anywhere in `InstantComparison.jsx`'s rendered output (no "3 days" text found near the metric rows).
- **Min/max provider-day vs. subwindow**: same as §1.1 — each row's `tmax` is one provider day's own max; `avgHighTemp` means 1-3 of those together depending on how many are valid.
- **Completeness/coercion**: excludes missing (see above) — returns `null` for a fully-missing window (not `0`); the comparison then degrades gracefully (`classifyMetrics`, lines 49-53, skips the temp comparison entirely when either side's `avgHighTemp` is `null`).
- **Shared scoring/ranking consumers**: feeds `classifyMetrics`'s `improvements`/`strength`/`primaryKey` (lines 31-67), which feeds `classifyDirection` (lines 79-83) — this is the **canonical display tone** input (`comparisonState.direction`), consumed by both `HomeDecisionCard.jsx` and `RoutePlannerCard.jsx` per existing, already-approved "Canonical Decision Tone" rules (CLAUDE.md). It does **not** feed `scoring.js`'s point totals or `rankWarmest`.
- **Confidence**: VERIFIED SOURCE (both call sites read directly; `avgHighTemp` exclude-missing behavior independently re-executed in RC-02/RC-03/RC-04).

### 1.3 `src/components/CampsiteComparisonSection.jsx` — Pro campsite-comparison "Temp"/"Hiti" factor row + hourly 3-hourly subsample

- **Hash**: `be071f3dadfd29484b4d83ff4cdc86d06aa0bcf4`.
- **Entrypoint**: `buildFactorRows` (lines 41-98) — one of 3 factor rows per compared day (wind/gust, rain, temp). `extractHourlyForDate` (lines 20-37) — the hourly drill-down.
- **IS/EN label**: `labelKey: "comparisonFactorTemp"` → EN `"Temp"`, IS `"Hiti"` (`translations.common.js:583,1163`). Neutral — does not claim "average" — but also does not say "max"/"hámark", so a reader could still mistake it for a current/mean reading rather than the day's maximum.
- **Provider field**: `tmaxA = dailyA.temperature_2m_max?.[idxA] ?? null` (line 54), same for B (line 55) — **raw provider daily max, read directly from the raw cached forecast object** (the file's own header comment, lines 17-19, explicitly says "these are RAW cache values," distinguishing this from the normalized `rows` used elsewhere). Separately, `temperature_2m_max?.[i] ?? null` is read again at lines 418/425 to build the full multi-day comparison rows (`compareCampsiteForecasts`'s input) — same raw field, same null-safe read, no divergence found between the two usages in this file.
- **Threshold/verdict**: `higherIsBetter(tmaxA, tmaxB, TEMP_DIFF_THRESHOLD)` (line 95) — `TEMP_DIFF_THRESHOLD` imported from `src/utils/compareCampsiteForecasts.js` (not re-read in full this session — its value and the "Model v1.0 baseline" framing is `CLAUDE.md`-documented pre-existing, taken as given per the project's own "do not modify" note on that file).
- **Hourly subsample**: `extractHourlyForDate` filters to `row.hour % 3 === 0` (line 35) — **a third, distinct time definition**: not a daily max, not a 3-day mean, but a 3-hourly subsample of the raw instantaneous `temperature_2m` readings (line 29, `rawHourly.temperature_2m?.[i] ?? null`). Each displayed row carries its own explicit timestamp (`timeLabel`, line 156) — no averaging or aggregation is implied or computed for this view; each number is one specific hour's own reading.
- **Completeness/coercion**: both the daily (`?? null`) and hourly (`?? null`) reads are null-safe, no coercion to 0/sentinel found.
- **Units — added this round, v2 R2 (Jonesy)**: `buildFactorRows`'s returned rows hardcode `unit: "°C"` (line 94), `unit: "m/s"` (line 76), `unit: "mm"` (line 87) — confirmed via a direct grep for `units|imperial|convertTemp|convertWind` in this file: **zero matches**. This file has no imperial-mode handling at all, for any of its three factors, not just temperature — cross-referenced into `reference-cases.md`'s unit/rounding table this round.
- **Shared consumers**: none beyond this file's own comparison UI — `compareCampsiteForecasts` is explicitly a separate, frozen "Model v1.0" scoring path per CLAUDE.md, deliberately not sharing `normalizeDailyToScoreInput`; not touched here.
- **Confidence**: VERIFIED SOURCE (both the daily factor-row and hourly-subsample code paths read directly).

### 1.4 `src/lib/scoring.js` — three sentinel/floor missing-`tmax` behaviors, feeding every score/rank/leaderboard point

- **Hash**: `5db18656b020e6bb992525acd2d65f5f9b594b09`.
- **`basePointsFromTemp(tmax, season)`** (lines 36-54): `const t = tmax ?? -999;` then season-specific threshold ladder. **Correction to the prompt's own framing**: the `-999` sentinel's exact magnitude is not itself what causes the effect — in BOTH seasons the ladder's lowest bucket is `return 0` for any `t` below its lowest threshold (summer: `t < 0`; winter: `t < 6`), so a missing `tmax` (`-999`) and a genuinely cold real `tmax` (e.g. `-5`°C in summer) **produce the identical `0` base points** — confirmed by direct execution, `reference-cases.md` RC-05. There is no accidental collision risk (`-999` is nowhere near any real Icelandic air temperature), but the practical effect is that **missing data is scored as "colder than any realistic input," not merely "unknown."**
- **`getColdWindPenalty(tmax, windMax)`** (lines 81-?) and **`getWintryPrecipPenalty(weatherCode, tmax)`** (lines 109-?): `typeof tmax === 'number' ? tmax : 10` — a **different, second sentinel (10°C, a mild/neutral value)**, deliberately NOT `-999`, presumably to avoid compounding the cold-floor effect from `basePointsFromTemp` with an additional cold-wind/wintry-precipitation penalty on top of it. Confirmed via direct execution (RC-05): `getWintryPrecipPenalty(71, 0)` → `3`, `getWintryPrecipPenalty(71, undefined)` → `2` — genuinely different outputs, confirming the two sentinels (`-999` vs `10`) are NOT the same missing-data policy even within this one file.
- **`scoreSiteDay`** (line 305 onward): calls `basePointsFromTemp` with the rounded `_tmax` (line 316), then clamps the result through `getSeasonConfig`'s per-season `baseFloor`/`tempWeight` (lines 319-320). ~~**Observed, executed, concrete impact (RC-06)**: an otherwise-identical day... scores `8` points / `"Good"` with `tmax: 12`, but `0` points / `"Bad"` with `tmax: null`... **This is the clearest, most concrete missing-data finding in this audit.**~~ **Corrected, v2 (Jonesy R1)**: that result is **season-dependent, not universal**, and the v1 wording above overstated it as the audit's clearest/highest-impact finding without that qualification. Re-run this round on 3 real dates (`reference-cases.md` RC-06, same wind/rain/weatherCode, only `date` and `tmax`-presence varied):
  - **2026-06-15 (summer, `tempWeight: 1`, `baseFloor: 0`)**: complete day `tmax=12` → `8` points / `"Good"`; missing `tmax` → `0` points / `"Bad"`. **Differs.**
  - **2026-10-27 (winter, `tempWeight: 0.35`, `baseFloor: 4`)**: complete day → `3` points / `"Fair"` (`basePts` clamped to the floor, `4`); missing `tmax` → `3` points / `"Fair"` (`basePts` ALSO clamped to the same floor, `4`). **Identical — missing `tmax` changes nothing on this date.**
  - **2027-01-10 (winter)**: same as 2026-10-27 — identical, `3`/`"Fair"` both ways.
  - **Why**: in winter, `baseScaled = round(baseRaw * 0.35)` can reach at most `round(10 * 0.35) = 4` (the maximum `basePointsFromTemp` can return is `10`), and `basePts = max(4, min(10, max(0, baseScaled)))` — so the winter floor (`4`) equals or exceeds whatever `baseScaled` could be for ANY valid winter `tmax`, meaning **`basePts` is pinned at exactly `4` in winter regardless of `tmax`'s value OR presence.** This is a structural consequence of the existing winter floor design, confirmed by direct execution, not a claim that it was designed to mask missing data.
  - **This does not mean missing `tmax` "never matters in winter" for every possible input** — only that it does not matter for THIS fixture's wind/rain/weatherCode combination, on these 3 dates, via `basePts` specifically. Production frequency of missing `tmax`, and whether some other winter input combination could still show a difference through a different code path, remain **UNKNOWN** — not generalized into a broader claim here.
- **`tmin`**: `scoreSiteDay`'s destructured `tmin: _tmin` is explicitly unused (line 302 comment: "tmin (unused, like shelter/rainStreak — accepted here because callers pass it)"). **`tmin` plays no role in scoring/ranking at all** — it is a pure display value elsewhere (§1.5/1.6).
- **`round1`** (line 253): rounds to 1 decimal place before scoring; does not affect the missing-data behavior above (rounding `null` or `-999` doesn't change which threshold bucket it lands in).
- **Confidence**: VERIFIED SOURCE for all of the above; all three executed and confirmed in `reference-cases.md` (RC-05, RC-06).

### 1.4a Extrema-only / hazard consumers (no mean at all) — new this round, v2 R2 (Jonesy)

Two further consumers use `tmax` as a single-day extremum for hazard/voice thresholds, never as any kind of average. Neither was in v1's inventory; added per J2's directory-wide search (§3) surfacing them.

- **`src/lib/relocationEngine.js`'s `computeDayWarnings`** (lines 165-204): heat warning thresholds `tempHighHigh ?? 28` / `tempHighWarn ?? 24` applied directly to `tmax` (lines 198-200) — "Heat warnings (tmax is appropriate for heat risk)," the function's own comment. **Deliberately skips cold/`tempLow` warnings entirely** — lines 173-175's own comment: "relocationEngine day objects currently have tmax, but not tmin. Cold warnings should be based on tmin (night temps). Until we have tmin in the engine pipeline, we intentionally SKIP tempLow warnings here to avoid inconsistency." This is a stated, deliberate limitation, not an oversight to fix. `pickExplainDay` (lines 206-229) copies `d?.tmax ?? null` straight through into the engine's explain/day output (line 225) — a passthrough, not a new computation.
- **`src/lib/weatherVoiceRules.js`** (lines 27-36): `TEMP_COLD_MAX_C = 6`, `TEMP_GOOD_MIN_C = 12`, `TEMP_EXCELLENT_MIN_C = 14` — the file's own comment states these deliberately reuse `scoring.js`'s WINTER `basePointsFromTemp` band edges as season-INDEPENDENT expressive-voice thresholds (explicitly not the summer bands, not a new scoring system). Consumed by **`src/lib/weatherVoiceEngine.js`** (lines 44-134): `isFiniteNumber(tmax)` guard (line 46, returns `false`/no match if `tmax` isn't a finite number — null-safe, no coercion to any sentinel), then direct threshold comparisons (`tmax < TEMP_COLD_MAX_C`, `tmax > TEMP_EXCELLENT_MIN_C`, `tmax >= TEMP_GOOD_MIN_C`, lines 114-134) against `input.tmax` — a single day's own value, per **`src/hooks/useWeatherVoice.js:170`**'s `todayRow.tmax`. **`src/lib/weatherVoiceShareSnapshot.js`** (lines 54-55, 83) additionally requires `todayRow.tmax` to be a finite number before building a share snapshot at all — rejects rather than coerces.
- **Do these options change if touched?** No option in `implementation-proposal.md` proposes changing either of these two consumers' thresholds or null-handling — both are recorded here as inventory completeness only, per J2's explicit instruction not to turn this into new implementation scope.

### 1.5 `src/hooks/useLeaderboardScores.js` — raw per-site `rows` feeding Top5/Weather Finder/comparison "nearby" metrics

- **Hash**: `e81233f65988f6cb1ca055f575f408b6ce13f963`.
- **`computeScoreFromData`** (lines 65-84): builds `rows` directly from `data.daily.temperature_2m_max?.[i] ?? null` (line 71) and `temperature_2m_min?.[i] ?? null` (line 72) — **a SEPARATE, independent implementation from `forecastNormalize.js` (§1.8), not a shared call** — but for `tmax`/`tmin` specifically, the formula is byte-identical (`field?.[i] ?? null`), so there is no cross-path VALUE discrepancy for temperature between "current site" rows (built via `forecastNormalize.js`, used by `useForecast.js`) and "nearby/every site" rows (built here, used by `scoresById`, feeding `weatherFinderRanking.js`'s `site.forecast` — confirmed via `src/components/WeatherFinder.jsx:57`, `forecast: scoresById[site.id].rows` — and `comparisonUtils.js`'s `nearbyMetrics` via `useComparisonState.js:55-56`).
- **Shared consumers**: `scoreSiteDay(r)` is called per row (line 78) — same scoring policy as §1.4 applies to every site's own leaderboard points, not just the currently-selected one.
- **Confidence**: VERIFIED SOURCE.

### 1.6 `ForecastTable.jsx` / `HourlyForecastModal.jsx` — min/max and per-hour display (confirmed already correct, no bug assumption)

- **Hashes**: `ForecastTable.jsx` `e60d5b47764510098aca03dce2dcbebef3e6215d`; `HourlyForecastModal.jsx` `d5dbffd6ddde1609d860a3f94343e442e8437d82`.
- **`ForecastTable.jsx`**: renders `r.tmin`/`r.tmax` directly as the day's own min/max (lines 512, 516), labelled `t("tempMin")`/`t("tempMax")` → EN **"Temp min"/"Temp max"**, IS **"Minnsti hiti"/"Hæsti hiti"** (`translations.common.js:37-38,642-643`; short mobile forms `"Min"/"Max"` and `"Lágm."/"Hám."`, lines 42-43,647-648). **These labels already correctly and unambiguously describe "lowest"/"highest" temperature — this is the part of issue #444's title this surface already gets right, and the proposal below does not touch it.** Null-safe (`typeof r?.tmin === "number" ? r.tmin : null`, lines 35-36) and used for the temp-hazard check (lines 56-66, guarded by `!= null`, no coercion). A tooltip (`line 380-381`) shows the single day's own `tmax` next to its `basePts`, labelled bare `"Temp"` (not translated/localized in that specific string — an English-only internal tooltip, lower priority) — no average claim.
- **`HourlyForecastModal.jsx`**: `temp: hourly?.temperature_2m?.[i] ?? null` (line 60) — raw instantaneous per-hour reading, null-safe, formatted `toFixed(0)` via `formatNumber(..., 0)` (line 91) — 0 decimal places (vs. `ForecastTable`'s 1-decimal default for min/max). Each row is its own hour, labelled `t("labelTemp")` → EN "Temp", IS "Hiti" (`translations.common.js:389,983`) alongside its own visible timestamp — no average claim, no missing-data coercion found.
- **Confidence**: VERIFIED SOURCE for both files; this is a "confirmed correct, do not disturb" finding, not a problem to fix.

### 1.7 `src/lib/weatherVoiceShareImage.js` — share-image "High {tmax}°C" label (already correctly scoped, prior ticket)

- **Hash**: `3b5c3a568c159a43fa58028fa47b980ddfc06071`.
- **`buildDailyContextLabel`** (lines 277-287): `` `${highTempLabel} ${Math.round(tmax)}°C` `` where `highTempLabel = t("weatherVoiceShareHighTempLabel")` → EN **"High"**, IS **"Hámark"** (`translations.common.js:518,1103`) — explicitly the single day's own max, explicitly labelled "High," never "average." The function's own doc comment (lines 264-276) states this was a deliberate prior-ticket fix (cites "Ripley Round 1 finding #1") to avoid an unqualified reading. **Confirmed correct; no change proposed.**
- **Confidence**: VERIFIED SOURCE.

### 1.8 `src/lib/forecastNormalize.js` — `normalizeDailyToScoreInput`, the "current site" rows source

- **Hash**: `0372916c87e82d067fdcd7eefc70f0a2b93806a6`.
- **`tmax`/`tmin`** (lines 118-119): `temperature_2m_max?.[i] ?? null` / `temperature_2m_min?.[i] ?? null` — **pure passthrough, confirmed by full-function read and by direct execution (`reference-cases.md` RC-07) that `tmax` is numerically IDENTICAL whether or not any `hourly` data is supplied at all.** Unlike `windMax`/`windGust`/`rain`, which DO receive the file's documented time-of-day weighting (`getTimeWeight`, lines 16-21, applied inside `getDayHourlyMetrics`, lines 23-106) when hourly coverage exists for that date, and fall back to the raw daily max/sum when it does not (confirmed, RC-07: day 1 with no matching hourly rows falls back to raw `windspeed_10m_max`; day 2 with hourly rows uses the time-weighted value instead). **Temperature is never time-weighted anywhere in this file.**
- **Consumer**: `src/hooks/useForecast.js:158` (hash `263e58244216dcb5eb6df55cc183421e0d4f0e3d`) — `const baseRows = normalizeDailyToScoreInput(data.daily, data.hourly);` — this is the "current/selected site" `rows` array consumed by `ForecastTable`, `useComparisonState`'s `currentMetrics`, and `useWeatherVoice.js:170` (hash not separately re-verified this session beyond the single grep hit; `todayRow.tmax` consumed for a single day's own voice-line selection, not an average — out of scope for this ticket's "average" question but included here per J1's "all keys with mean/average/hiti/temp variants" instruction).
- **Confidence**: VERIFIED SOURCE (function read in full; behavior independently executed, RC-07).

---

## 2. Timezone / provider semantics (J5)

- **Every caller of `/api/forecast` in `src/`**: exactly one — `src/lib/forecastCache.js`'s `fetchOpenMeteo` (not separately hashed this session; confirmed via `grep -rn "api/forecast|fetchOpenMeteo" src --include="*.js" --include="*.jsx"` excluding test files → single hit). It passes `timezone: "Atlantic/Reykjavik"` explicitly (confirmed in a prior session's read of this file, re-confirmed present as a request param this session via `api/forecast.js`'s own handling of the forwarded `timezone` query param). **No caller in `src/` relies on the API's own `"auto"` fallback.**
- **`api/forecast.js`** (hash `d0307cf7f80befc4c613b91e13e5d57166a599b0`): `const timezone = q.get("timezone") || "auto";` (line 35) — this fallback exists only for a request that omits the `timezone` query param; since the sole real caller always supplies one, **this fallback is dead in normal app traffic**, a defensive default only. The `daily`/`hourly` field lists (lines 56-67, 76-91) are **hardcoded server-side** — the API does not accept a client-chosen field whitelist; a new daily field (e.g. a mean-temperature field, see below) would require editing this literal array.
- **Open-Meteo provider documentation** — fetched this session via `WebFetch` against `https://open-meteo.com/en/docs`, accessed 2026-10-26:
  - `temperature_2m_max`/`temperature_2m_min` are documented together with `temperature_2m_mean` under the daily-variables table, described as "Maximum and minimum daily air temperature at 2 meters above ground." The general daily section states aggregations are "a simple 24 hour aggregation from hourly values."
  - **The docs do not explicitly state the day boundary is calendar midnight-to-midnight** — the clearest statement is that the `timezone` parameter's resolved UTC offset "is used for ISO 8601 timestamps and daily boundaries throughout the response," combined with the 24-hour-aggregation wording. Taken together this STRONGLY IMPLIES a midnight-to-midnight day in the requested timezone, but this is an inference from the documentation, not a verbatim statement — graded **INFERRED**, not VERIFIED, per the contract's explicit instruction not to assume "24" without first defining the day boundary.
  - The docs state that daylight-saving-time changes within the requested range are ignored by the resolved offset — not directly relevant to Iceland (no DST), but the general mechanism (one fixed offset per request, not per-timestamp) is worth recording.
  - **The docs state the `timezone` parameter is required whenever daily variables are requested** (its own default would otherwise be GMT) — this app's sole caller already always supplies one (`Atlantic/Reykjavik`), so this app is already compliant; recorded for completeness, not as a finding requiring a change.
  - **`auto` resolves the timezone from the request's own coordinates** (not used by this app's real caller).
  - **A true provider-computed daily mean variable EXISTS: `temperature_2m_mean`** ("Mean Temperature (2 m)," listed under "Additional Daily Variables"). **This app does not currently request it.** The documentation does not give a separate formula for this field beyond the general 24-hour-aggregation-from-hourly-values statement, so the exact averaging method (e.g. whether it is a simple arithmetic mean of hourly readings, and what happens to a partial/incomplete day) is itself **UNKNOWN** — not verified by the documentation text retrieved, and this repository alone cannot verify live provider completeness behavior (per the contract's own instruction).
- **Confidence**: VERIFIED SOURCE for the caller/field-list facts (read directly); VERIFIED SAMPLE for the Open-Meteo documentation content (one page fetched, one access date, not cross-checked against a second source or a live response); explicitly INFERRED for the midnight-to-midnight day-boundary claim; explicitly UNKNOWN for `temperature_2m_mean`'s exact averaging/completeness method and for whether production forecast responses are ever incomplete in practice.
- **v2 note (Jonesy R2/N1)**: the `temperature_2m_mean` field's existence is attributed solely to **CC's own `WebFetch` fetch** above — Jonesy's own attempt to independently re-fetch the same documentation page in their review sandbox was refused (network access not available there), so this fact is **single-sourced, not cross-verified by a second reviewer**. Its exact period/completeness semantics remain UNKNOWN as stated above; this audit does not claim the field is "verified correct" or "the cheapest" option for any computation — only that it exists in the documentation and is not currently requested (see `implementation-proposal.md`'s Option D2 for the same caveat).

---

## 3. Negative-search results (surfaces with NO temperature exposure found)

**v2 addition (Jonesy R2)**: v1's searches above were targeted at specific files the prompt or Ripley's own leads named, not a directory-wide sweep — a keyword search's absence of a hit in a NAMED file is not the same claim as "searched this whole directory and found nothing else." Two scoped, directory-wide searches were run this round to close that gap, excluding test files, with exact regex/globs and counts retained (match counts are a search-coverage metric, not a claim that every matched line was individually read — all were, in fact, read and triaged this round; see §1.4a for the two previously-missing consumers these searches surfaced):

```
rg "tmax|tmin|temperature_2m" src/lib --glob '!*.test.js'
→ 64 occurrences across 11 files: weatherVoiceShareSnapshot.js (6), weatherVoiceEngine.js (12),
  scoring.js (17), weatherVoiceRules.js (3), weatherFinderRanking.js (2), weatherVoiceTypes.js (1),
  forecastNormalize.js (7), weatherVoiceShareImage.js (4), comparisonUtils.js (1), forecastCache.js (3),
  relocationEngine.js (8).
  Of these, weatherVoiceShareSnapshot.js, weatherVoiceEngine.js, weatherVoiceTypes.js (a JSDoc-only
  hit), relocationEngine.js and forecastCache.js (field-name list only, already covered via
  api/forecast.js in §2) were NOT in the v1 inventory — all five reviewed this round; relocationEngine.js
  and weatherVoiceRules.js/weatherVoiceEngine.js/weatherVoiceShareSnapshot.js's shared single-day,
  extrema-only consumption is now §1.4a. The other 6 files were already covered in §1.1-§1.2/§1.4/§1.8.
```

```
rg "tmax|tmin|temperature_2m" src/components --glob '!*.test.jsx'
→ 28 occurrences across exactly 3 files: ForecastTable.jsx (16), HourlyForecastModal.jsx (1),
  CampsiteComparisonSection.jsx (11) — all three already fully covered in §1.3/§1.6. No new
  src/components consumer found by the directory-wide sweep.
```

Each of the file-targeted v1 searches below was ALSO re-executed independently this session (not copied from the prompt's own leads), exact command shown:

```
grep -n "tmax\|tmin\|temperature_2m\|meðalhiti\|avgTemp" src/components/Top5Leaderboard.jsx src/MapView.jsx src/components/RouteCompareTable.jsx src/lib/weatherVoiceContent.js
→ zero matches in all four files (confirmed: Top5Leaderboard.jsx shows points/class only, not raw temperature; MapView.jsx is at src/MapView.jsx, not src/components/MapView.jsx — located and checked at its real path; RouteCompareTable.jsx shows hazard-type labels only; weatherVoiceContent.js has no temperature text)
```

```
grep -rn "tmax|tmin|temperature_2m|meðalhiti|avgTemp" src/pages src/hooks src/data
→ the only hits: src/pages/Brochure.jsx (static demo fixture data for the marketing page, not live weather data — see §4); and the already-covered src/hooks/useLeaderboardScores.js, useForecast.provenance.test.js/scoringInvariance.test.js (test files, not consumer surfaces), useWeatherVoice.js and its test files (§1.8, single-day consumption, not an average claim), useLeaderboardScores.windRainIndependence.test.js (test file). src/data has no hits at all.
```

```
grep -rln "tmax|tmin|temperature_2m|meðalhiti|avgTemp" src/components/Blog* src/components/blog*
→ zero matches (no blog UI component touches temperature data)
```

```
grep -rln "tmax|tmin|temperature_2m" api
→ api/forecast.js (§2, already covered), api/forecast.test.js (test file), api/_lib/auroraDecision/openMeteo.test.js (confirmed incidental — tests hourly_units shape for the Aurora feature, not a temperature display surface; line 154 only)
```

```
grep -rln "tmax|tmin|temperature_2m|meðalhiti|avgTemp" src/i18n/translations.landing.js src/config api/_lib
→ src/config/hazards.js (tempLowWarn/tempLowHigh/tempHighWarn/tempHighHigh — hazard thresholds, not averaging, already covered via ForecastTable's hazard check in §1.6); api/_lib/auroraDecision/openMeteo.test.js (above). translations.landing.js: zero matches.
```

---

## 4. Active vs. demo/static vs. dormant vs. unknown

| Surface | Category |
|---|---|
| `weatherFinderRanking.js`/`WeatherFinderCard.jsx`/`WeatherFinder.jsx` | **Active** — mounted on homepage via `App.jsx` |
| `comparisonUtils.js` via `useComparisonState.js` → `HomeDecisionCard.jsx` | **Active** — the canonical homepage decision surface |
| `comparisonUtils.js` via `InstantComparison.jsx` (direct) | **Active, but only on `src/pages/Brochure.jsx`** (marketing demo page) — not the homepage |
| `CampsiteComparisonSection.jsx` | **Active** — Pro campsite-comparison feature |
| `scoring.js` | **Active** — feeds every site's points/class everywhere (Top5Leaderboard, Weather Finder, ForecastTable's own day classes) |
| `ForecastTable.jsx` / `HourlyForecastModal.jsx` | **Active** — confirmed-correct baseline |
| `weatherVoiceShareImage.js` | **Active** — Weather Voice share-image feature, confirmed-correct baseline |
| `src/pages/Brochure.jsx`'s own hardcoded `tmax` arrays (lines 13-20) | **Demo/static** — fixed marketing-copy numbers, not live provider data, not a bug/consistency surface |
| `useWeatherVoice.js`'s `todayRow.tmax` | **Active**, but single-day only, not an "average" surface — out of this ticket's main question, included for completeness |
| `src/data`, blog components, `translations.landing.js` | **No temperature exposure found** (negative search, §3) |

---

## 5. Uninspected / explicit UNKNOWNs

- Live Open-Meteo production response completeness (missing days, irregular timestamps, actual null patterns) — **UNKNOWN**, repository-only audit cannot verify this; no live probe performed (forbidden by the contract).
- `temperature_2m_mean`'s exact averaging method/completeness handling by the provider — **UNKNOWN** beyond the general 24-hour-aggregation statement in the documentation (§2).
- `src/utils/compareCampsiteForecasts.js`'s exact `TEMP_DIFF_THRESHOLD` value and its own internal logic — **not re-read in full this session** (deliberately, per CLAUDE.md's "do not modify without updating all 32 unit tests" note taken as a signal this file's internals are a separately-governed, frozen contract; its *consumption* by `CampsiteComparisonSection.jsx` was read and reported in §1.3).
- Whether any A/B test, feature flag, or server-side experiment changes which of these surfaces a given user sees — **UNKNOWN**, not inspected.
- `gh issue view` for #444's own comment thread beyond the issue body already quoted in `approved-prompt-v1.md` — not independently re-fetched this session (the approved prompt already contains the issue title/number and the Expert Support paraphrase verbatim; re-fetching would not change any source-code finding above). If Ripley or the owner need the live thread re-checked, that is a one-line `gh issue view 444` away but was not run here to keep this round read-only and in scope.
