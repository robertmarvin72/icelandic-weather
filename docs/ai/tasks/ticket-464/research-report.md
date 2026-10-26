# #464 — Research report

2026-10-26. CC. Research-only, per `approved-prompt-v1.md`, corrected per `approved-prompt-v2.md` (Jonesy result-review R1–R3, accepted by Ripley). No production code, config, test, i18n, or instruction file was changed in either round. All evidence below is read-only source tracing plus execution of the retained real functions/components in a task-local harness under `docs/ai/tasks/ticket-464/harness/` (never the repo's own `vitest.config.js`, never a repo test file).

> **Round 2 correction notice (2026-10-26):** Round 1's headline — "an unreported gust of about 11.1 m/s or more is the most parsimonious sufficient driver of Oct-28's 'Bad'" — assumed the raw `daily.weathercode` was clear/mainly-clear (code 0/1), based on the displayed description "að mestu heiðskírt". That description is possibly (an inference from the code path, not confirmed) the separate, display-only `summaryCode` (derived from hourly data, §2/§3), not necessarily the raw `daily.weathercode` that `scoreSiteDay` actually reads — **the raw code is UNKNOWN**. §4a, §6a, and §9 below are corrected to state the finding conditionally on the (unknown) raw code, with a real, re-executed sweep over 14 candidate codes (§6a). §6e's timezone claim was also wrong and is corrected in place (§6e). Anywhere the superseded "11.1–14.9 m/s" band or "most parsimonious" language still appears below, it is struck through and replaced, never silently deleted, so the correction itself stays visible. The owner-facing bottom line is unchanged: the reported rounded numbers alone do not reach "Bad" for any of the codes checked except the wintry ones (66/67/71/77/85, which reach "Bad" with no gust at all) — an unreported input (gust, and/or the raw code itself) is still required to explain it, but the previously-stated single number was overstated.

Grading convention (same as #444/#437): **VERIFIED SOURCE** (read in this checkout this turn), **VERIFIED EXECUTION** (real retained function/component actually run in the task-local harness, output retained), **INFERRED** (reasoned from verified material, not itself executed), **UNKNOWN** (no evidence either way).

## 0. Baseline

- HEAD at start and end of this round: `24dcd8925287893249d6d5fd70edd6b4ce84158f` (unchanged — no commit made).
- `git status --short` at start and end: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-464/` (only the workflow pointer and this task's own new files; no other path touched). VERIFIED SOURCE.
- Issue #464: fetched via `gh issue view 464`, OPEN, no comments/labels, suggested P1 in the body. VERIFIED SOURCE (live fetch, this session).

## 1. Issue acceptance checklist (copied verbatim from the live issue body, J8)

> Rannsaka ósamræmi milli dagseinkunnar og klukkustundamats: „Slæmt" en „Góður tími" allan daginn

Research task (verbatim, IS):
1. Útskýra nákvæmlega hvernig dagseinkunnin ("Slæmt") er reiknuð fyrir dæmið, og hvernig klukkustundamatið ("Góður tími") er reiknað, með tilvísun í kóða.
2. Bera saman þessar tvær reikniaðferðir — hvaða breytur hvor notar, hvaða þröskuldar, og hvort þær noti sömu gögn.
3. Athuga hvort þetta sé villa (t.d. ósamræmi í þyngdum/þröskuldum) eða hvort þetta sé "by design" vegna þess að reikniaðferðirnar eru einfaldlega ólíkar.
4. Leggja fram raunhæfar næstu skref — hvort breyta þurfi kóða, útskýra notandanum muninn betur, eða hvort þetta krefjist frekari rannsóknar.

Acceptance (verbatim, IS), each answered below:

- [ ] **Útskýrt er nákvæmlega hvernig dagseinkunnin er reiknuð, með tilvísun í kóða (file:line).** → Answered §2, §4.
- [ ] **Útskýrt er nákvæmlega hvernig klukkustundamatið er reiknað, með tilvísun í kóða (file:line).** → Answered §3, §4.
- [ ] **Borið er saman breytur, þröskuldar og gagnanotkun beggja aðferða í töflu.** → Answered §5.
- [ ] **Niðurstaða um hvort um villu er að ræða eða "by design" ólíkar reikniaðferðir, með rökstuðningi.** → Answered §8.
- [ ] **Raunveruleg dæmi (27. og 28. okt) keyrð í gegnum alvöru kóða, ekki bara lesin.** → Answered §4, §6 (real execution, harness output retained).
- [ ] **Hliðstæð/mótdæmi (counterfactuals) sem hjálpa að einangra orsök.** → Answered §6.
- [ ] **Lagt er fram afmarkað, ekki-útfært next-steps plan.** → See `next-steps-proposal.md`.
- [ ] **Staðfest er hvort upprunaleg gögn/skjámyndir eru til eða hvort unnið er út frá nýjum (synthetic) gögnum, með skýrum merkingum.** → Answered §7: **NOT HISTORICALLY REPRODUCED**, synthetic fixtures used throughout, clearly labelled.

Owner evidence (Laugardalur, 64.1451, -21.8750, screenshots taken 2026-10-26, owner-reported ROUNDED values, not raw payloads):
- 2026-10-27: **Fair/Sæm**, tmin 2.9 / tmax 6.7 °C, wind 4.8 m/s, rain 0.2 mm; hours 06/09 shown Rough, best window 15–21.
- 2026-10-28: **Bad/Slæmt**, tmin 2.6 / tmax 5.8 °C, wind 5.1 m/s, rain 0.0 mm; all eight shown points (00,03,…,21) Good, best window 00–21.

## 2. Path 1 — Daily grade + label/color

Entrypoint: `src/App.jsx:277` — `const { rows, windDir, shelter, loading, error, requestedFor } = useForecast(site?.lat, site?.lon, {...})`. `site` comes from `siteList.find(...)` (`App.jsx:276`), gated by `showCampsitesGate`. `rowsWithDay` (`App.jsx:293`, used at `:443` and `:526`) wraps `rows` with a day label; the scoring fields themselves are untouched by that wrapper. VERIFIED SOURCE.

`src/hooks/useForecast.js`:
- `:158` `const baseRows = normalizeDailyToScoreInput(data.daily, data.hourly);`
- `:161-189` `rows = baseRows.map((row) => { const s = scoreSiteDay(row); ...; return { ...row, summaryCode, summaryTextKey, class: s.finalClass, points: s.points, basePts: s.basePts, windPen: s.windPen, gustPen: s.gustPen, rainPen: s.rainPen, precipTimingMultiplier: s.precipTimingMultiplier, season: s.season }; })`
- The code comment at `:162-168` explicitly documents that `scoreSiteDay` reads only the untouched raw daily row and that `summaryCode`/`summaryTextKey` (from `summarizeDailyWeather`, #400/#402) are computed separately and merged in **after** scoring — never fed back into scoring. VERIFIED SOURCE.

`src/lib/scoring.js` (blob `5db18656b020e6bb992525acd2d65f5f9b594b09`):
- `getSeasonForDate` (`:5-15`): date-only string parsed by `new Date(date)` (UTC midnight per spec), `getMonth()` read in local time; months 10–4 → `"winter"`, else `"summer"`. Missing/invalid date → `"summer"`.
- `getSeasonConfig` (`:17-32`, not exported): winter `{tempWeight:0.35, windWeight:1.0, rainWeight:1.0, baseFloor:4}`; summer `{tempWeight:1, windWeight:1, rainWeight:1, baseFloor:0}`.
- `basePointsFromTemp` (`:36-54`): winter ladder `t>14→10, t>=12→8, t>=8→5, t>=6→2, else→0`; summer a different, more granular ladder.
- `windPenaltyPoints` (`:56-70`): winter `v<=5→0, v<=10→2, v<=15→5, else→10`.
- `rainPenaltyPoints` (`:72-77`): `r<1→0, r<4→2, else→5`.
- `getColdWindPenalty` / `getSkyComfortModifier` / `getWintryPrecipPenalty` / `getPleasantnessModifier` (`:81-125`).
- `gustPenaltyPoints` (`:128-157`): `diff = gust - windMax`; `diff<2.9→0`; else base 1/2/3 by `diff<6 / <10 / else`; winter multiplies by 1.6 (rounded), capped at 5.
- `isWetDay` / `rainStreakPenaltyPoints` / `scoreDaysWithRainStreak` (`:161-237`): explicitly commented (`:174-176`) as **Route-Planner-only**, "does not affect existing Top5/Forecast unless used there." `useForecast.js` calls `scoreSiteDay` directly, never `scoreDaysWithRainStreak` — **confirmed the main daily grade never runs the rain-streak path**; `scoreSiteDay` itself hardcodes `rainStreakPen = 0` at `:336`.
- `pointsToClass` (`:239-245`): `p>=9→Best, p>=7→Good, p>=4→Ok, p>=1→Fair, else→Bad`.
- `scoreSiteDay` (`:305-375`), full body read and quoted:
  - Rounds `tmax/rain/windMax/windGust` to 1 decimal (`round1`, `:253-255`) **before** any threshold check (`:308-311`).
  - `season = getSeasonForDate(date)`; `cfg = getSeasonConfig(season)`.
  - `basePts = max(cfg.baseFloor, min(10, max(0, round(basePointsFromTemp(_tmax,season) * cfg.tempWeight))))`.
  - `windPen = round(windPenaltyPoints(_windMax,season) * cfg.windWeight)`.
  - `rainPen = round(rainPenaltyPoints(_rain) * getPrecipTimingMultiplier({rain:_rain}) * cfg.rainWeight)`. `getPrecipTimingMultiplier` (`:292-300`) is `0` below 1 mm, else `1`.
  - `gustPen = gustPenaltyPoints(_windGust,_windMax,season)` (already weighted internally).
  - `shelterBonus = computeShelterBonus({shelter, windMax:_windMax, windGust:_windGust, season})` (`:279-290`; `windSeverity01` at `:263-277`).
  - `pleasantness = getPleasantnessModifier({tmax:_tmax, windMax:_windMax, weatherCode})`.
  - `pointsRaw = basePts - windPen - rainPen - gustPen - 0(rainStreakPen) + shelterBonus + pleasantness`; `points = clamp(pointsRaw,0,10)`; `finalClass = pointsToClass(points)`.
  - `tmin` is accepted in the destructuring but never read inside the function body (confirmed by full-body read — the only other reference is the renamed, unused `_tmin`).

Label/color: `src/components/ForecastTable.jsx`:
- `:417` `<span>{t?.(r.class?.toLowerCase?.()) ?? r.class}</span>` — translated via `t(r.class.toLowerCase())`.
- `src/i18n/translations.common.js:665-677` (IS): `ok: "Ok"`, `fair: "Sæm"`, `bad: "Slæmt"` — **exact match to the owner's screenshots** ("Fair/Sæm", "Bad/Slæmt"). VERIFIED SOURCE.
- `:387-397` colors by class (green/emerald/yellow/amber/red).
- `:379-386` the score's own explanatory tooltip (`title=...`): `"Base {basePts} (Temp {tmax}°C) Wind {windPen} ({windMax} m/s) Rain {rainPen} ({rain} mm) = {points} → {class}"`. **This tooltip omits `gustPen`, `shelterBonus`, and `pleasantness` entirely** — see §9 (copy-accuracy finding).
- `:521-540` the row's own wind/gust display: `r.windMax` is always shown; `r.windGust` is shown **only if `r.windGust >= 15`** (`:527`) — a hardcoded display gate unrelated to the hazard badge thresholds in `src/config/hazards.js:8-9` (`gustWarn:20, gustHigh:24`). This is independent corroboration for the "hidden gust" feasibility finding in §6.

## 3. Path 3 — Hourly badge/best-window construction and rendering

`src/components/HourlyForecastModal.jsx` (blob `d5dbffd6ddde1609d860a3f94343e442e8437d82`), full file read:
- `buildHourlyRows` (`:44-70`): maps every hourly entry to a row (raw `windspeed_10m`/`wind_speed_10m` alias for wind; **no alias for gust**, only `windgusts_10m`; `precipitation`; `precipitation_probability`), then filters to `row.date === selectedDate` (`:68`) **and** `row.hour % 3 === 0` (`:69`). Only 8 of 24 hours ever reach the UI.
- `getWindowState` (`:108-129`), not exported — component-local:
  - `good = (wind==null||wind<=10) && (gust==null||gust<=15) && (rain==null||rain<=1) && (pop==null||pop<=40)` — **vacuously true if every field is null**.
  - `rough = (wind!=null&&wind>=15) || (gust!=null&&gust>=20) || (rain!=null&&rain>=3) || (pop!=null&&pop>=70)`.
  - else `"neutral"` (no badge rendered at all, per `getWindowBadge` `:131-149`).
  - **Temperature never appears in this predicate.**
- `summary` best-window `useMemo` (`:238-276`): scans the already-filtered 8-row array for the longest run of consecutive **array** entries in the `"good"` state (not clock-continuous hours); ties use strict `>` (`:259`), so the **first** qualifying run of the maximum length wins; `from`/`to` are `formatHourLabel` of the first/last row of that run.
- `formatHourLabel` (`:29-42`): `Intl.DateTimeFormat(lang==="is"?"is-IS":"en-GB", {hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(dateTimeStr))`.
- Modal's own fetch (`:177-209`): `getForecast({lat:site.lat, lon:site.lon})` on mount/when `site.lat/site.lon/selectedDate` change — **independent of** whatever hourly data already produced the daily row's own `windMax`/`windGust` in `useForecast`.
- `getWeatherInfo` (`:77-84`) shares `resolveWeatherPresentation`/`isDaytimeHour` with the daily icon/summary logic (#400/#402) — this is a **display-only** path, not the raw `code` used by `scoreSiteDay`; confirmed not to feed back into either scoring function.

All of the above component-local logic was additionally **executed for real** (not just read) via the task-local harness — see §4 and §6.

## 4. Real-function/real-component synthetic breakdown (contract item 4)

### 4a. Daily — Oct-27 and Oct-28, owner-reported rounded values

Executed via `node --import ./docs/ai/tasks/ticket-464/harness/esm-ext-loader.mjs docs/ai/tasks/ticket-464/harness/reference-cases-script.mjs`, importing the real, unmodified `src/lib/scoring.js` and `src/lib/forecastNormalize.js`. Full output retained at `docs/ai/tasks/ticket-464/harness/reference-cases-output.txt`. VERIFIED EXECUTION.

**Oct-27** (`tmax 6.7, windMax 4.8, rain 0.2, weatherCode UNKNOWN→tried null`):
```
season: winter
basePointsFromTemp raw: 2 -> basePts: 4   (winter floor 4 dominates; 6.7 only earns raw 2)
windPenaltyPoints raw: 0 -> windPen: 0    (4.8 <= 5)
rainPenaltyPoints raw: 0 -> rainPen: 0    (0.2 < 1)
gustPen: 0 (no gust supplied)
pleasantness: 0 (weatherCode null -> sky 0, coldWind 0, wintry 0)
pointsRaw = 4-0-0-0-0+0+0 = 4  ->  points 4  ->  finalClass "Ok"
```
This computes to **"Ok"**, not the owner-reported "Fair/Sæm". The owner-reported class is one bucket worse than what the reported rounded numbers alone produce — the same qualitative gap seen on Oct-28, just smaller. UNKNOWN which unobserved input (gust, weatherCode, exact unrounded wind) accounts for the one-bucket difference; not pursued further because the issue's own worked example is Oct-28, and Oct-27 is described as "mixed", not the one needing explanation.

**Oct-28** (`tmax 5.8, windMax 5.1, rain 0.0`, `weatherCode` — ~~tried as 1 "mainly clear" for "að mestu heiðskírt"~~ **correction 2026-10-26 (R1, wording tightened 2026-10-26 v3): the raw `daily.weathercode` fed to `scoreSiteDay` is UNKNOWN. "að mestu heiðskírt" is the owner's displayed description; that it is the separate, display-only `summaryCode` (§2/§3's `summarizeDailyWeather`, #400/#402) rather than the raw scoring input is an INFERENCE from the code path, not confirmed — stated as "possibly", not "most likely". Code 1 below is one synthetic, labelled example among the 14 swept in §6a — not a reconstruction of the original payload.**):
```
season: winter
basePointsFromTemp raw: 0 -> basePts: 4   (winter floor 4; 5.8 < 6 earns raw 0)
windPenaltyPoints raw: 2 -> windPen: 2    (5.1 is in the (5,10] bracket)
rainPenaltyPoints raw: 0 -> rainPen: 0
gustPen: 0 (no gust supplied)
getSkyComfortModifier(1) = 1 (mainly clear)
getColdWindPenalty(5.8,5.1) = 0  (5-8°C band needs w>=12 to penalize; 5.1 does not)
getWintryPrecipPenalty(1,5.8) = 0
pleasantness = 1-0-0 = +1
pointsRaw = 4-2-0-0-0+0+1 = 3  ->  points 3  ->  finalClass "Fair"
```
**With every owner-reported number taken at face value and, for this one example, raw code assumed (not confirmed) to be clear/mainly-clear, the real formula computes "Fair" (3 points), not "Bad".** §6a below shows this same conclusion — reported numbers alone do not reach "Bad" — holds for **9 of the 14** raw codes actually swept (`0,1,2,3,45,51,61,95,null`); the remaining **5 wintry codes** (`66,67,71,77,85`) already compute "Bad" with no gust at all, via the `getWintryPrecipPenalty` term, not via temperature or sky. So the underlying finding is robust to the code assumption for the 9 non-wintry codes even though the original single-code framing was not; it does not hold at all for the 5 wintry codes. See §6a for the full, code-conditional feasibility sweep.

### 4b. Hourly — Oct-28 owner scenario (all eight sampled hours "Good", window 00–21)

Real-rendered via the task-local RTL harness (`HourlyForecastModal.ticket464.spec.jsx`, test "renders 8 cards … from synthetic all-calm hourly input"): a synthetic payload with calm wind/gust/rain/pop at all 8 sampled hours (00,03,…,21) renders 8 `badgeGood` badges, no `badgeRough`, and the best-window text `"Best window 00:00-21:00"`. This reproduces the **shape** of the owner's screenshot (all-Good, 00–21 window) under purely synthetic calm inputs — it does not prove the owner's real hourly values were this calm, only that the modal's own logic is capable of producing exactly this rendered shape from calm inputs, consistent with (not proof of) the owner's hourly screenshot. VERIFIED EXECUTION; full test output at `docs/ai/tasks/ticket-464/harness/vitest-output.txt` (17/17 passed).

## 5. Path/field/threshold comparison table (contract item 2)

| | Daily grade (`scoreSiteDay`) | Hourly badge/window (`getWindowState`/`summary`) |
|---|---|---|
| Entry fields | `tmax, rain, windMax, windGust, weatherCode/code, shelter, date` (tmin accepted, unused) | `wind, gust, rain, precipProbability` (temperature read but not used in the predicate) |
| Field provenance (J2) | When hourly data exists, `windMax/windGust/rain` are **time-weighted hourly maxima/sum** from `normalizeDailyToScoreInput` (`forecastNormalize.js:16-21,46-76,108-132`) — **not** Open-Meteo's own `daily.windspeed_10m_max`/`windgusts_10m_max`. Weights: 0–6h×0.45, 6–9h×0.75, 9–22h×1.0, else×0.75; severe floor 0.85 if raw wind≥22 or gust≥28. Confirmed by real execution (§6, normalizeDailyToScoreInput block) that the fed-in `windMax` can differ from both the provider's own daily max and from anything the 3-hourly modal ever samples. | Raw, **unweighted** per-hour Open-Meteo `windspeed_10m`/`windgusts_10m`/`precipitation`/`precipitation_probability`, sampled only at `hour % 3 === 0` (8 of 24 hours). |
| Units | m/s, mm, °C (same provider units throughout) | m/s, mm, % |
| Period/timezone | One row per calendar day, Atlantic/Reykjavik-labelled strings from the API (`forecastCache.js:61`); `getSeasonForDate` parses the date-only string as UTC then reads `getMonth()` in local time (J6, §6). | Per-hour, same Reykjavik-labelled strings; displayed via `formatHourLabel`'s `new Date(dateTimeStr)`, which (unlike the date-only path) parses a bare `"...T00:00"` string as **local time of the viewing device**, not necessarily Iceland time (see §6). |
| Sampling | Every hour in range contributes to the daily max/sum (no skipped hours). | Only every 3rd hour; a peak at an unsampled hour is invisible to both the badge and the best-window scan (demonstrated in §6). |
| Rounding order | `tmax/rain/windMax/windGust` rounded to 1 decimal **before** any threshold check (`scoring.js:308-311`) — a raw value that rounds back down to a boundary does not cross it. | No rounding step; raw provider floats compared directly against thresholds. |
| Defaults/null | `windPenaltyPoints`/`rainPenaltyPoints` use `?? 0` only (no `typeof`/`isFinite` guard) — `NaN`/`Infinity` are **not** caught by `?? 0` and fall through to the comparisons, often landing in the worst bucket. `getColdWindPenalty`/`gustPenaltyPoints` use strict `typeof === "number"` guards, so a numeric string is treated as absent/default there. `getPrecipTimingMultiplier` has its **own** `isFinite` guard, stricter than `rainPenaltyPoints` — the two disagree on `NaN` (demonstrated in §6). | `getWindowState` uses strict `typeof === "number"` for all four fields; `null`/non-number (including numeric strings) are treated as absent (pass the Good AND-clause vacuously, never trigger Rough); `NaN` passes the `typeof` check but fails every comparison, landing in neither Good nor Rough; `Infinity` passes `typeof` and satisfies the Rough `>=` comparisons. |
| Thresholds (winter) | wind ≤5/≤10/≤15/>15 → 0/2/5/10; gust `diff=gust-windMax`: <2.9→0, else 1/2/3 ×1.6 (winter) capped at 5; rain <1/<4/≥4 → 0/2/5; temp ladder per §2; cold-wind/sky/wintry modifiers per §2. | Good: wind≤10, gust≤15, rain≤1, pop≤40 (all, including nulls). Rough: wind≥15 OR gust≥20 OR rain≥3 OR pop≥70 (any). No season variant. |
| Season | Winter (Oct–Apr) vs summer config, different weights/ladders/floor. | None — identical thresholds year-round. |
| Shelter | `computeShelterBonus` (0–3 in winter, 0–2 summer), scaled by wind/gust severity and a normalized 0–10 shelter input; **accepted and does contribute** to `pointsRaw` (not merely "accepted but inert" — confirmed non-zero in the counterfactual in §6 when wind/gust severity and shelter are both non-trivial, though it rounds to 0 at the owner's reported low wind values with shelter unknown). | Not used at all. |
| User-facing explanation | `ForecastTable.jsx:379-386` tooltip — shows Base/Wind/Rain only; **omits gust, shelter, pleasantness** (see §9). Translated class label `t(r.class.toLowerCase())`, IS `bad→"Slæmt"`, `fair→"Sæm"` (exact match to the screenshots). | Badge text `badgeGood`/`badgeRough` (i18n keys, no numeric breakdown shown); best-window line `bestWeatherWindow` template. No tooltip/explanation of the predicate at all. |
| Provenance (cache/request) | From `useForecast`'s own fetch via `getForecast` (`forecastCache.js`), held in React state until the next fetch (site change or `refetch()`). | Modal calls `getForecast` **again**, independently, on every open (`HourlyForecastModal.jsx:190`). Same cache key (`forecast:v8:{lat.toFixed(4)},{lon.toFixed(4)}`, `forecastCache.js:6-10`), 30-minute TTL (`:2`), memory→localStorage→in-flight-coalescing→fetch (`:106-138`). Within the TTL both reads return byte-identical payloads; after it, the modal's read can be a newer provider run than whatever is still displayed in the already-rendered daily row (J4, demonstrated in §6). |

## 6. Counterfactuals and feasibility sweep (contract item 5, J3, J5, J6)

All of the following are **VERIFIED EXECUTION** (real `scoreSiteDay`/`basePointsFromTemp`/etc. or real `HourlyForecastModal` render); full raw output in `docs/ai/tasks/ticket-464/harness/reference-cases-output.txt` and `vitest-output.txt`.

### 6a. J3 — hidden-input (gust and/or raw code) feasibility for Oct-28

> **Correction 2026-10-26 (R1 — Jonesy result-review, independently re-executed by CC, not merely adopted):** the original version of this section held `weatherCode=1` fixed and reported a single "~11.1 m/s" gust band as the "most parsimonious" explanation. ~~That framing is retracted.~~ The raw `daily.weathercode` is UNKNOWN (see the §4a correction note), and the first-Bad gust depends materially on which code is assumed. Below is a full, code-conditional sweep, re-run by CC against the real, retained `scoring.js` (`docs/ai/tasks/ticket-464/harness/reference-cases-script-v2.mjs`, output retained verbatim in `reference-cases-output-v2.txt`) — this independently reproduces, rather than simply trusts, Jonesy's reviewer sandbox numbers.

Holding `tmax=5.8, windMax=5.1, rain=0.0, shelter=0` fixed (the owner's own reported values) and sweeping both the **unreported raw `weatherCode`** (14 candidate codes) and the **unreported `windGust`** for each:

| raw `weatherCode` | class with NO gust | first gust that reaches "Bad" |
|---|---|---|
| `0`, `1` (clear, mainly clear) | Fair (3 pts) | **11.1 m/s** (`diff = gust−windMax ≥ 6`) |
| `null`, `2`, `3`, `45`, `51`, `61`, `95` (partly cloudy / overcast / fog / drizzle / rain / thunder) | Fair (1–2 pts) | **8.0 m/s** (`diff ≥ 2.9`, the first non-zero gust bucket) |
| `66`, `67` (freezing rain), `71`, `77`, `85` (snow) | **Bad (0 pts), no gust needed at all** | n/a |

(Full per-code component breakdown — `sky`/`coldWind`/`wintry`/`pleasantness`/`points`/`class` for all 14 codes, plus the full 0–20 m/s gust sweep per code — is in `reference-cases-output-v2.txt`.)

**Corrected finding:** reaching "Bad" from the owner's reported tmax/wind/rain is **conditional on the unknown raw code**: for a clear-sky code, a gust of about 11.1 m/s or more is needed, matching the original (now-corrected) framing's number but only for that one code family; for every other non-wintry code checked, a smaller gust of about 8.0 m/s (`diff ≥ 2.9`) is already enough — this is exactly the threshold Jonesy's own original J3 sandbox lead cited, and it turns out to be the *more generally applicable* number across the codes swept, not merely a first-penalty-step waypoint as the original report's §6a framed it. For the wintry codes, no gust is needed at all — "Bad" is already reached via the wintry-precipitation penalty. **"Most parsimonious" is retracted**: there is no single most-parsimonious number; the correct statement is "consistent with a gust ≥ wind + 2.9 (≈8.0 m/s) together with a non-clear, non-wintry raw code, OR a gust ≥ wind + 6 (≈11.1 m/s) with a clear raw code, OR a wintry raw code with no gust at all" — three structurally different, code-dependent explanations, none individually confirmed.

An explicit no-gust-vs-gust-equal-to-windMax comparison (code=1): `windGust: null` and `windGust: 5.1` (exactly equal to `windMax`) both yield `gustPen=0` and "Fair" — not materially different for this input, though they reach zero via two different early-return branches of `gustPenaltyPoints` (`g==null` short-circuit at `scoring.js:131` vs. `diff<=0` short-circuit at `:134`). VERIFIED EXECUTION.

**Oct-27 is now also explained**, closing a gap the original report left open: with the owner's reported rounded Oct-27 baseline (`tmax=6.7, windMax=4.8, rain=0.2`) and raw code assumed to be `3` (overcast, matching "mixed" conditions plausibly), **and no gust at all**, the real formula computes exactly **"Fair" (3 points)** — matching the owner's reported "Fair/Sæm" with no unreported input required at all for this one date/code combination. VERIFIED EXECUTION (`reference-cases-output-v2.txt`).

This remains **consistent with**, not proof of, the owner's actual Oct-28/Oct-27 raw codes and gust values, both of which remain UNKNOWN — the owner's screenshots never reported either figure, and `ForecastTable.jsx:525-527` only ever displays `windGust` when it is **≥15 m/s**, which would hide a gust anywhere in the ~~11.1–14.9~~ **corrected: ~8.0–14.9 m/s (for most codes) or ~11.1–14.9 m/s (for clear codes)** range identified above. A gust in either band would be real, would be sufficient (for the matching code family) to drive the daily grade to "Bad", and would never appear anywhere in the daily UI.

### 6b. Winter wind boundary (`<=5` vs `>5..10`)

```
windMax=4.9    windPen=0  points=5  Ok
windMax=5.0    windPen=0  points=5  Ok
windMax=5.0001 windPenaltyPoints(raw)=2, but scoreSiteDay's windPen=0, points=5, Ok
               (round1() rounds 5.0001 -> 5.0 *before* the threshold check,
               so the boundary is only crossed by rounded, not raw, wind)
windMax=5.1    windPen=2  points=3  Fair
windMax=10.0   windPen=2  points=3  Fair
windMax=10.1   windPen=5  points=0  Bad
```

### 6c. Legitimate zero/negative and missing/non-finite/type-mismatched inputs

```
all nulls                     -> basePts 4, points 4, Ok        (winter floor, no penalties fire)
negative wind/rain (-3,-1,-2) -> points 5, Ok                   (no lower bound anywhere; negative reads as "calm/dry")
NaN tmax/wind/rain            -> windPen 10, rainPen 0(!), points 0, Bad
Infinity windMax              -> windPen 10, coldWind 1, points 0, Bad
numeric-string windMax "5.1"  -> windPen 2 (relational '<=' coerces the string), points 3, Fair — SAME as the real number 5.1
missing date                  -> season defaults to "summer", basePts 3 (different ladder), points 4, Ok
```

The `NaN` row surfaces a genuine **internal inconsistency** between sibling functions: `rainPenaltyPoints(NaN)` has no `isFinite` guard (`mm = NaN ?? 0` leaves it `NaN`, then `NaN<1` and `NaN<4` are both false, falling through to the `>=4mm` bucket, `rainPenBase=5`), but `getPrecipTimingMultiplier` **does** guard with `isFinite` (`scoring.js:293`) and returns `0` for non-finite rain, which zeroes the would-be rainPen back out (`rainPen = round(5*0*1) = 0`). So a `NaN` rain value is silently neutralized by one function but would not have been by the other alone — the two sibling "rain" functions disagree on how to treat the same invalid input. `windPenaltyPoints`, by contrast, has no equivalent guard anywhere in its call chain, so `NaN`/`Infinity` wind values fall through to the worst (10-point) bucket.

The numeric-string case shows the inverse asymmetry already named in the approved prompt: `windPenaltyPoints`/`rainPenaltyPoints` only do `?? 0` and then rely on JS's implicit string→number coercion in `<=`/`>=`, which happens to work for a simple numeric string; `getColdWindPenalty`/`gustPenaltyPoints`/`getWindowState` all gate on strict `typeof === "number"`, which does **not** coerce a string and silently treats it as absent/default. In this specific combination the two behaviors happened to agree on the final class (both land on "Fair"), but they are not the same rule, and a different combination of inputs could make them disagree.

### 6d. Hourly predicate edge cases (real component render, J5)

All 17 of the following were executed as real React renders of the unmodified `HourlyForecastModal`, not inferred from reading the source (`docs/ai/tasks/ticket-464/harness/HourlyForecastModal.ticket464.spec.jsx`, 17/17 passed, full log in `vitest-output.txt`):

- All four fields null/absent → `"good"` (vacuous AND), badge **Good**.
- `wind: NaN` (other fields finite) → **no badge at all** (`typeof NaN === "number"` is true, so NaN is not treated as absent, but it fails every `<=`/`>=` comparison — neither Good's nor Rough's clause involving wind can fire from it) — exactly the "neither good nor rough" case named in the approved prompt, now confirmed by real render rather than asserted from reading the code.
- `wind: Infinity` → badge **Rough** (`wind >= 15` is true for `Infinity`).
- `wind: "20"` (string) → badge **Good**, even though `20` as a real number would be Rough — the strict `typeof` check in `getWindowState` treats the string as absent.
- Negative wind/gust/rain → badge **Good** (no lower bound anywhere in the predicate).
- `precipitation_probability` array removed entirely from the payload → `pop` is `null` for every row → does not block Good.
- A real spike at an unsampled hour (hour 1, wind 25/gust 30/rain 5/pop 90) between two calm sampled hours (0 and 3) → **never rendered as a card**, does not affect either sampled hour's badge, and the best-window text still reports `"00:00-03:00"` as if the day were continuously calm — the spike is fully invisible to the user and to the summary logic.
- Mixed good/rough run (00 good, 03 good, 06 rough, 09 good) → best window is the first, longer run (`00:00-03:00`), not the later single-hour run, per strict `>` tie-breaking.
- A genuine tie between two equal-length runs (00 good; 03 rough; 06 good) → the **first** run wins (`00:00-00:00`), confirming strict `>` (not `>=`) at `HourlyForecastModal.jsx:259`.
- Duplicate timestamps for the same hour (two `2026-10-28T00:00` entries) → React itself emits a real duplicate-key warning (`"Encountered two children with the same key, 2026-10-28T00:00... behavior is unsupported and could change in a future version"` — captured verbatim in `vitest-output.txt`) but both rows are still rendered and both still feed the best-window scan as if continuous. This is explicitly unsupported/undefined React behaviour, not a guaranteed contract — reported, not relied upon.
- Out-of-order timestamps (09:00 good listed before 00:00 rough, which is clock-earlier) → the best-window scan runs over **array order**, not chronological order; the reported window (`09:00-09:00`) reflects array position, not time-of-day.
- An hour belonging to the next calendar day, present in the same payload → correctly filtered out by the `row.date === selectedDate` check; never rendered.

### 6e. `formatHourLabel` midnight rendering (J5, real engine output)

Executed for real (Node v24.11.0, Vitest 4.1.10, jsdom): under `lang="en"` (`en-GB`) **and** `lang="is"` (`is-IS`), both with `hour12:false`, the real `Intl.DateTimeFormat` in this environment renders midnight as **`"00:00"`**, not `"24:00"`. (The approved prompt correctly flagged that some ICU builds render `hour12:false` midnight as `"24:00"`; this Node/V8/ICU build does not. Browser engines are UNKNOWN/unverified — this result is specific to Node v24.11.0's bundled ICU and is not claimed to generalize to every browser.)

> **Correction 2026-10-26 (R2 — Jonesy result-review, independently re-executed by CC):** ~~A separate, real timezone-parsing issue was found: `formatHourLabel`'s `new Date(dateTimeStr)` receives a timezone-less string..., which the ECMAScript spec parses as local time of the JS environment, not as Iceland time... for a viewer in any other timezone, the displayed hour label can silently diverge from the hour Open-Meteo actually meant. This is a real, verified, general finding...~~ **This claim was wrong and is retracted.** `new Date(dateTimeStr)` parses a timezone-less string as local time, but `Intl.DateTimeFormat(...).format(...)` (with no explicit `timeZone` option) **also formats in that same local time** — the same offset is used for both the implicit parse and the implicit format, so the wall-clock hour is mathematically preserved regardless of what "local" happens to be, as long as that local offset does not change between the two instants being compared (i.e. no DST transition sits between them). There is no silent divergence for a plain, non-ambiguous local time.
>
> Re-executed for real, three separate Node processes (same Node v24.11.0 build, `TZ` env var set at process start — Windows requires a native PowerShell/`cmd` process-env set; Git Bash's inline/`export` `TZ=` prefix did not propagate to `node.exe` on this machine and was abandoned in favour of PowerShell's `$env:TZ`, itself a minor real finding about this specific Windows/Git-Bash combination, not about Node or Iceland data):
>
> | `TZ` | `"2026-10-28T00:00"` (en-GB / is-IS) | `"2026-10-28T21:00"` (en-GB / is-IS) |
> |---|---|---|
> | `Atlantic/Reykjavik` | 00:00 / 00:00 | 21:00 / 21:00 |
> | `America/New_York` | 00:00 / 00:00 | 21:00 / 21:00 |
> | `Asia/Tokyo` | 00:00 / 00:00 | 21:00 / 21:00 |
>
> All nine renderings are identical across all three timezones — confirming the corrected claim, not the original one. Full output in `docs/ai/tasks/ticket-464/harness/tz-check-output.txt`. VERIFIED EXECUTION.
>
> **Labelled edge counterfactual (not an October observation):** a DST spring-forward *nonexistent* local time does shift. US clocks spring forward on 2026-03-08 at 02:00 local (jumping straight to 03:00; the 02:00–02:59 wall-clock hour does not exist that day in `America/New_York`). Real execution, **identical input `"2026-03-08T02:00"` fed to both locales** (corrected 2026-10-26, v3 — the harness script originally passed is-IS a different input, `"...T02:30"`, so an earlier version of this output showed differing minutes between locales that were an input artifact, not a locale-formatting difference; both locales are now confirmed to behave identically): under `TZ=America/New_York` → **`"03:00"`** in both en-GB and is-IS (pushed forward past the gap by the engine), while under `TZ=Atlantic/Reykjavik` or `TZ=Asia/Tokyo` (neither observes this DST transition) both locales stay `"02:00"` as literally written. This is a genuine edge case in how `new Date()` resolves a nonexistent local time, but it requires (a) a DST-observing viewer timezone and (b) a date sitting inside that specific transition gap — neither applies to Iceland (no DST) or to late October, so it does not explain the Oct 27/28 screenshots and is not claimed to.

### 6f. J6 — season/date boundary (secondary counterfactual, explicitly not the screenshot cause)

> **Completed 2026-10-26 (R2):** the original round left this as a source-level claim, not independently executed under an altered `TZ`. Now re-run for real, same three-timezone harness as §6e, against the real, retained `getSeasonForDate`:

```
TZ=Atlantic/Reykjavik:  2026-10-01 -> winter (month=10)   2026-05-01 -> summer (month=5)   2026-10-27 -> winter   2026-10-28 -> winter
TZ=America/New_York:    2026-10-01 -> summer (month=9)    2026-05-01 -> winter (month=4)   2026-10-27 -> winter   2026-10-28 -> winter
TZ=Asia/Tokyo:          2026-10-01 -> winter (month=10)   2026-05-01 -> summer (month=5)   2026-10-27 -> winter   2026-10-28 -> winter
```
(Full output in `docs/ai/tasks/ticket-464/harness/tz-check-output.txt`. VERIFIED EXECUTION.)

**Confirmed for real:** `getSeasonForDate` parses the date-only string as UTC midnight, then reads `getMonth()` in the process's local time. Under `America/New_York` (west of UTC), `new Date("2026-10-01")`'s UTC midnight shifts back into the evening of **September 30 local**, so `getMonth()` returns `9` (September) instead of `10` — the season bucket flips from the intended "winter" to **"summer"**. Symmetrically, `"2026-05-01"` flips from the intended "summer" to **"winter"**. `Asia/Tokyo` (east of UTC) and `Atlantic/Reykjavik` (UTC+0) both resolve correctly in both cases — the bug is specific to timezones west of UTC, exactly as the approved prompt's own hypothesis stated.

This **has no effect on Oct 27/28 specifically** under any of the three timezones tested — both dates are deep enough into October that even the multi-hour UTC/local shift keeps `getMonth()` at October (`winter`) in Reykjavik, New York, and Tokyo alike. This confirms, rather than merely asserts, that the real month-boundary bug does not explain the Oct 27/28 screenshots; it is a genuine, separate, now-executed-and-confirmed finding about dates near October 1 / May 1 for viewers in western timezones, included only because J6 asked for it as a labelled secondary counterfactual.

### 6g. `normalizeDailyToScoreInput` provenance proof

```
provider daily windspeed_10m_max: 9   windgusts_10m_max: 20
normalized row fed into scoreSiteDay: windMax=11, windGust=14 (date 2026-10-28)
```
Constructed so that the provider's own daily maxima (9/20) differ from the time-weighted hourly maxima (11/14, driven by a single spike at hour 13, weight 1.0, invisible to the 3-hourly modal). `scoreSiteDay` on the real normalized row returns **"Bad"** (0 points). This directly demonstrates, with real executed code, that: (a) the number scoring actually uses is not the provider's own daily field, and (b) the specific hour responsible for a "Bad" daily grade can be a real hour that the 3-hourly modal structurally never samples and therefore never shows — a second, independent (and compounding) way the two UI surfaces can legitimately diverge beyond the gust-magnitude finding in §6a.

## 7. Preserved fixture/evidence search (contract item 3)

Searched (read-only, scoped as the approved prompt allows): `src/**` (no `src/tests` directory exists; individual `*.test.js(x)` files live beside their modules), `tests/**`, `docs/ai/**`, `outputs/**`, for the three screenshot filenames named in the issue (`image(20261026-151416).png`, `image(20261026-151547).png`, `image(20261026-151606).png`) and for `"Laugardalur"` and `"151416"/"151547"/"151606"` substrings.

- The three filenames appear **only** inside this ticket's own `approved-prompt-v1.md`/`prompt-review.md` (quoting the issue text) — no actual image file, fixture, or captured payload with those names exists anywhere in the scoped paths.
- `outputs/` contains 28 other tickets' evidence folders (e.g. `outputs/ticket-444-browser-evidence`) but no `ticket-464-*` folder.
- `"Laugardalur"` appears only as a generic test-fixture/comment site name in `useForecast.scoringInvariance.test.js`, `dailyWeatherSummary.test.js`, `translations.landing.js`, and an e2e spec — none of these use the owner's specific Oct 27/28 numbers or date; they predate this issue and are unrelated fixtures that happen to reuse a recognizable Icelandic place name.

**Conclusion: NOT HISTORICALLY REPRODUCED.** No original raw payload, screenshot, or captured evidence for the owner's exact Oct 27/28 observation exists in this repository. This is not an exhaustive search of the owner's own computer (the screenshots may still exist there), and a fresh forecast fetch today cannot reconstruct a historic forecast run for a past date — Open-Meteo's historical/archive behaviour for this exact case was not probed (would require a live provider call, out of scope). All breakdowns in §4 and §6 are therefore synthetic reconstructions from the owner's own rounded, reported numbers, explicitly labelled as such throughout.

## 8. Explicit answers (contract item 6, J7)

**What each rating actually asks.** The daily grade asks "how good is this whole day, taking temperature, wind, rain, gustiness, sky and (for winter) a floor into account, each weighted by season" — a single synthesized comfort score. The hourly badge asks a narrower, temperature-blind question per 3-hour sample: "is wind/gust/rain/precip-probability individually below a calm threshold, or does any one of them cross a rough threshold" — never a synthesis, never seasonal, never informed by temperature or sky.

**Does cold contribute to each?** Yes to the daily grade, in three separate ways (`basePointsFromTemp`'s season ladder, `getColdWindPenalty`'s cold+wind interaction, and the winter floor/weight configuration). No to the hourly predicate at all — confirmed by full-body source read and by the real executions in §6d, where varying only wind/gust/rain/pop (never temperature) fully determines every badge.

**Intentionality.** The *code behaviour* is now fully verified (this report). *Product intent* — whether the hourly view was deliberately designed to ignore temperature, or simply never updated after the daily formula grew season/temperature/sky logic — remains **UNKNOWN**. `git log` on both files (read-only, J7) shows `scoring.js` has had 15+ feature commits since its origin (seasonal logic #115, gust penalty #106, summer-too-harsh fix #237, score tweaking #248, precision alignment #232, time-aware rain #174, ...), while `HourlyForecastModal.jsx` has had only 4 commits total, none touching `getWindowState`'s thresholds or adding temperature to the predicate, and none with a commit body explaining the omission. No match for `badgeGood`/`badgeRough`/`bestWeatherWindow` or the window logic in `AGENTS.md`, `CLAUDE.md`, or any `docs/` file beyond this and other tickets' own task folders (grepped, scoped). **No documentation anywhere states that the hourly view's temperature-blindness is deliberate.** The most defensible reading of the evidence is that the two surfaces evolved independently over many commits and were never reconciled, not that someone decided hourly should ignore temperature on purpose — but this is an inference from absence of documentation, not a confirmed fact.

**Agreement/disagreement type**, using the prompt's own categories plus J7's (a)/(b)/(c) split:
- **(a) Different aggregation** — yes: one is a single per-day synthesis, the other is a per-3-hour independent check with no season/weighting at all.
- **(b) Different features and thresholds** — yes, and the dominant factor here: the hourly predicate structurally cannot see temperature, sky, season, or gustiness-relative-to-wind (it only sees gust in absolute terms, `gust>=20`, never `gust-wind`); the daily grade uses all of these, several of them (gustiness-as-diff, cold+wind interaction, sky) specifically on days with low absolute wind, which is exactly the Oct-28 profile.
- **(c) Label semantics** — no evidence of a label-only problem: "Slæmt"/"Bad" and "Góður tími"/"Good" are accurately translating two genuinely different, correctly-computed underlying numbers; the words are not the issue, the underlying disjoint formulas are.
- Not an **implementation defect** in the sense of a coding mistake that contradicts its own design — every individual function computes exactly what its own code says it should (verified by real execution throughout). It is a **data/feature mismatch between two independently-evolved rule sets answering different questions**, compounded by (i) an unreported, UI-hidden gust value being the most probable sufcient driver of "Bad" from the owner's otherwise-Fair-producing baseline (§6a), and (ii) a genuine sampling gap where a scoring-relevant hour can be real and never shown (§6g).

**"00–21" / unsampled hours, from the user's point of view.** The modal's own best-window label implies (without saying so) that the labelled span is calm throughout; a user reading "00–21 Good" has no way to know that hours 22–23 were never evaluated at all (not Good, not Rough, not shown — simply absent), nor that any hour strictly between two displayed samples (e.g. 01, 02, 04, 05, …) could have been materially different from its neighbors. This is a genuine UX gap in what the label visually promises versus what was actually checked, independent of whether the specific Oct-28 numbers involved an unsampled spike.

## 9. Secondary, incidental findings worth separate note

- The `ForecastTable.jsx:379-386` score-explanation tooltip omits gust, shelter, and pleasantness contributions, so a user who tries to manually verify "Base + Wind + Rain = Points" from the tooltip's own numbers will not get the real total whenever gust/shelter/pleasantness are non-zero (as in the real Oct-28 breakdown in §4a, where the tooltip's visible terms sum to 2 but the actual total is 3). This item is a copy-accuracy finding (verified: the tooltip's own displayed arithmetic can fail to reconcile with the shown points); see `next-steps-proposal.md` item 2.
- `ForecastTable.jsx:525-527` only displays `windGust` at all when it is `>=15 m/s`, independent of the `gustWarn`/`gustHigh` hazard thresholds (20/24) in `src/config/hazards.js:8-9` — a gust in the ~~11.1–14.9 m/s~~ **corrected 2026-10-26 (R1/R3): ~8.0–14.9 m/s for most raw codes, ~11.1–14.9 m/s for clear codes (§6a)** range is both scoring-relevant (for the matching code family) and completely invisible in the daily UI. **Relabelled 2026-10-26 (R3):** this is a **verified display gap**, not a "verified bug" — the gate's existence and its effect are both confirmed by source and execution; whether a `>=15` cutoff is a *defect* is a product-intent question with no documentation either way, and is explicitly left **UNKNOWN**. See `next-steps-proposal.md` item 4 for the corrected framing.
- `windPenaltyPoints`/`rainPenaltyPoints` and `getPrecipTimingMultiplier` disagree on how to treat `NaN` (§6c) — not user-visible under normal provider data (Open-Meteo is not expected to return `NaN`), but a real internal inconsistency between sibling functions.
- **Added 2026-10-26 (R3 note from Jonesy's result-review, independently re-executed by CC):** the harness's own "all-calm" hourly fixture (`wind=5, gust=8`) is badged hourly **"Good"** (`wind<=10` and `gust<=15`, both satisfied), yet `gust-wind = 3.0 >= 2.9`, which **is** penalized by the winter daily formula: real execution confirms `gustPenaltyPoints(8,5,"winter") = 2` (a non-zero penalty), and a full `scoreSiteDay` call with these exact wind/gust values on a winter date returns `components.gust = -2` (output retained in `docs/ai/tasks/ticket-464/harness/rule-gap-check-output.txt`). This is a concrete, real, numbers-backed instance of the §5/§8 "different features and thresholds" gap: the same two raw numbers are simultaneously "calm enough" for the hourly badge and "gusty enough" to cost 2 points on the daily score.
