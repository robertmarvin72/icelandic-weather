# Model v1.0 Baseline
## Eltum Veðrið / CampCast — Weather Scoring & Recommendation System

**Baseline date:** 2026-07-09 (funding agreement date, Tækniþróunarsjóður)
**Audited commit:** 597386c44a27f84428a0b204713de056a2f8e6cc (2026-07-10)
**Document purpose:** Formal technical baseline for the R&D validation work package.
**Audit method:** Read-only static analysis of executable code. No documentation
(including CLAUDE.md and code comments) accepted as authoritative unless confirmed
by running code. Where documentation and code disagree, code is marked authoritative
and the disagreement is recorded.

---

## A. EXECUTIVE SUMMARY

The Eltum Veðrið scoring and recommendation system processes 7-day weather forecasts
from Open-Meteo and produces two classes of output: (1) a ranked leaderboard of
campsites by weather quality, and (2) a Route Planner verdict (STAY / CONSIDER / MOVE)
for a user-selected base campsite.

**Three distinct scoring paths exist in the codebase:**

| Path | Consumer | Data source | Aggregation | Shelter |
|------|----------|-------------|-------------|---------|
| **Leaderboard** | Top 3 / Top 5, InstantComparison | Raw daily API fields | Simple 7-day sum | No (shelter=undefined → bonus 0) |
| **Route Planner** | Ferðaráðgjafi, DecisionBanner | Time-weighted hourly normalization | Decay-weighted avg + worst-day guardrail | Yes (0–10 from site data) |
| **Two-campsite comparison** | CampsiteComparisonSection | Raw daily API fields | Per-day threshold comparison (no score) | No |

CLAUDE.md states "the main recommendation uses time-weighted normalized values
(normalizeDailyToScoreInput)" — this correctly describes the Route Planner path.
It does not describe the leaderboard path, which uses raw daily values and a simple
sum. Both paths call `scoreSiteDay()` but with different inputs; this is confirmed
by code (see sections B and I).

The two-campsite comparison uses no scoring at all — only threshold-based binary
comparisons. This is documented intentional design in CLAUDE.md and confirmed by code.

All scores are computed entirely on the client (browser). No scoring logic exists
in the Vercel serverless API layer. The API layer (`api/forecast.js`) is a thin
proxy to Open-Meteo that adds no scoring or caching of its own.

---

## B. MODEL PIPELINE

### B.1 Data Ingestion

**Provider:** Open-Meteo (https://api.open-meteo.com/v1/forecast or
https://customer-api.open-meteo.com/v1/forecast when OPEN_METEO_API_KEY is set).

**Proxy route:** `api/forecast.js` — Vercel serverless function. Accepts lat/lon,
rounds to 4 decimal places, constructs Open-Meteo URL, proxies response verbatim.
Adds no caching, no scoring. Sets `Cache-Control: no-store`.

**Horizon:** 7 days (`forecast_days=7`).

**Daily fields requested** (from `api/forecast.js` lines 51–59 and
`src/lib/forecastCache.js` lines 64–82):
- `weathercode`
- `temperature_2m_max`
- `temperature_2m_min`
- `precipitation_sum`
- `windspeed_10m_max`
- `windgusts_10m_max`
- `winddirection_10m_dominant`

**Hourly fields requested:**
- `temperature_2m`
- `weathercode`
- `precipitation`
- `precipitation_probability`
- `windspeed_10m`
- `windgusts_10m`

**Units (always requested as):**
- Temperature: Celsius (`temperature_unit=celsius`)
- Wind speed: metres per second (`windspeed_unit=ms`)
- Precipitation: millimetres (`precipitation_unit=mm`)
- Timezone: `Atlantic/Reykjavik`

### B.2 Client-side Cache

**File:** `src/lib/forecastCache.js`

Two-tier cache:
1. In-memory (`Map`): per tab, no TTL check on initial population (TTL checked on read).
2. `localStorage`: keyed `forecast:v8:{lat4dp},{lon4dp}`, TTL 30 minutes.

In-flight coalescing: duplicate requests for the same key return the same Promise.

Cache version: `v8` (comment notes: "Bump version when forecast shape changes").

Scores cache (leaderboard only): `localStorage` key `campcast:scoresById:v5`,
TTL 6 hours. Cached at the scored-rows level (after `scoreSiteDay` is applied).
Source: `src/hooks/useLeaderboardScores.js` lines 18–19.

### B.3 Path 1 — Leaderboard Scoring

**Entry point:** `src/hooks/useLeaderboardScores.js`, function `computeScoreFromData()`
(lines 65–84).

**Input mapping** (raw daily API → per-day record, lines 68–77):
```
date    ← daily.time[i]
tmax    ← daily.temperature_2m_max[i]
tmin    ← daily.temperature_2m_min[i]
rain    ← daily.precipitation_sum[i]
windMax ← daily.windspeed_10m_max[i]  (fallback: daily.wind_speed_10m_max[i])
windGust← daily.windgusts_10m_max[i]
code    ← daily.weathercode[i]
```
No `shelter` field. No `weatherCode` field (but `scoreSiteDay` accepts `code` as alias).
**No time-of-day weighting is applied. Hourly data is not used.**

**Scoring:** `scoreSiteDay(r)` called per day (line 78). See Section C for rules.

**Aggregation:** Simple arithmetic sum of `points` (clamped 0–10) over all 7 days.
Maximum possible leaderboard score = 70.

```js
const score = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);  // line 82
```

**Ranking:** `useLeaderboardScores` returns `scoresById` map; Top 5 component
sorts descending by `score`. Top 3 shown to free users, Top 5 to Pro users
(feature gate: `topSitesCount`, `src/config/features.js` line 9).

**Prioritisation (fetch order):** `prioritizedSites()` in `src/lib/leaderboardUtils.js`:
selected site first, then nearest 8 by user location (or unsorted if no location),
then remainder. Up to 80 sites scored without user location; up to 250 with.

### B.4 Path 2 — Route Planner Scoring

**Entry point:** `src/lib/relocationService.js` → `relocationEngine.js`

**Step 1 — Normalization:** `normalizeDailyToScoreInput(daily, hourly)` in
`src/lib/forecastNormalize.js`.

For each calendar day, iterates over all hourly slots that fall on that date.
Applies time-of-day weights to wind speed, wind gust, and precipitation:

| Hour (local) | Weight |
|---|---|
| 00:00–05:59 | 0.45 |
| 06:00–08:59 | 0.75 |
| 09:00–21:59 | 1.00 |
| 22:00–23:59 | 0.75 |

Severe weather override (line 59): if `rawWind >= 22 m/s` OR `rawGust >= 28 m/s`,
weight is raised to at least 0.85 for that hour.

Wind normalization: `windMax = max(weighted_hourly_wind)` per day.
Gust normalization: `windGust = max(weighted_hourly_gust)` per day.
Rain normalization: `rain = sum(weighted_hourly_rain)` per day.

Fallback: if no hourly data is available for a date, falls back to raw daily
API values (`precipitation_sum[i]`, `windspeed_10m_max[i]`, `windgusts_10m_max[i]`).

Output fields per day: `{date, tmax, tmin, rain, windMax, windGust, windDir, code,
precipStartHour, precipEndHour, precipDurationHours, precipActiveHours,
precipTimingBucket, precipType}`.

**Step 2 — Shelter injection:** `pickSiteShelter(site)` reads from site object
(priority: `site.shelter` → `site.shelterScore` → `site.shelter_rating`, all
clamped to 0–10). Default 0 if all missing. Injected as `shelter` field into
each normalized day row.

**Step 3 — Per-day scoring with rain streak:**
`scoreDaysWithRainStreak(daysWithShelter, {wetThresholdMm: 3})` in `src/lib/scoring.js`.
Calls `scoreSiteDay()` per day (see Section C), then applies rain streak penalty
(see Section C.7) in chronological order.

**Step 4 — Window slice:** `sliceWindow()` finds the start date in the scored
array, returns `days` (default 3) consecutive rows.

**Step 5 — Aggregation:** `aggregateSiteWindow(windowDays, weights, cfg)`.
Decay weights: `w[i] = 0.85^i` (day 0 = 1.0, day 1 = 0.85, day 2 = 0.7225).
Weighted average of clamped `points` (0–10).
Worst-day guardrail: if `min(points) < 2`, clamps `total = min(weightedAvg, worstDay)`.

**Step 6 — Delta vs base:** `deltaVsBase = candidate.totalRaw - base.totalRaw`
(uses raw unclamped scores to avoid false ties when both sites clamp to 0).

**Step 7 — Decision:** `decideCandidate()` — see Section D.

**Step 8 — Ranking (candidates):** Sort by `recommendationRank` desc → `hazardImproved`
desc → `deltaVsBase` desc → `totalRaw` desc → `total` desc → `distanceKm` asc →
`siteId` lexicographic.

**Step 9 — Top-level verdict:** Best candidate's recommendation becomes the
overall verdict: STAY / CONSIDER / MOVE.

**Adaptive radius:** `getRelocationRecommendation()` starts at 50 km and escalates
(50 → 100 → 200 → 300 → ...) up to `maxRadiusKm`, stopping as soon as
`bestDelta >= minDeltaToConsider (1.0)`.

### B.5 Path 3 — Two-Campsite Comparison

**Entry point:** `src/components/CampsiteComparisonSection.jsx`

Input to `compareCampsiteForecasts()`: daily rows built directly from raw API
fields per date index:
```
windMax ← daily.windspeed_10m_max[i]
windGust← daily.windgusts_10m_max[i]    (nullable)
rain    ← daily.precipitation_sum[i]
tmax    ← daily.temperature_2m_max[i]
```
No time weighting. No `scoreSiteDay`. No shelter. No rain streak.

Output: per-day winner (`A_BETTER | B_BETTER | SIMILAR`) and reasons
(`calmer | drier | warmer | similar`). See Section E.

### B.6 InstantComparison (Homepage Widget)

Uses leaderboard `scoresById` (Path 1) for candidate selection.
Falls back to `routePlannerSummary` candidate when Route Planner has a result.
Displays raw metric averages over first 3 forecast rows (not scored).
See Section E.2.

---

## C. SCORING RULES

All scoring logic resides in `src/lib/scoring.js`.

### C.1 Season Classification

**Function:** `getSeasonForDate(date)` — lines 5–15.

| Month | Season |
|---|---|
| May–September (5–9) | `"summer"` |
| October–April (10–4, wrapping) | `"winter"` |

If `date` is null, undefined, or unparseable → defaults to `"summer"` (line 8–11).

**Season config** (`getSeasonConfig()`, lines 17–32):

| Parameter | Summer | Winter |
|---|---|---|
| `tempWeight` | 1.0 | 0.35 |
| `windWeight` | 1.0 | 1.0 |
| `rainWeight` | 1.0 | 1.0 |
| `baseFloor`  | 0   | 4    |

### C.2 Base Temperature Points

**Function:** `basePointsFromTemp(tmax, season)` — lines 36–54.

**Summer:**

| tmax (°C) | Points |
|---|---|
| ≥ 15 | 10 |
| ≥ 12 | 8 |
| ≥ 9  | 6 |
| ≥ 7  | 4 |
| ≥ 5  | 3 |
| ≥ 3  | 2 |
| ≥ 0  | 1 |
| < 0  | 0 |

**Winter:**

| tmax (°C) | Points |
|---|---|
| > 14 | 10 |
| ≥ 12 | 8 |
| ≥ 8  | 5 |
| ≥ 6  | 2 |
| < 6  | 0 |

Applied in `scoreSiteDay()` as:
```
baseScaled = round(baseRaw × cfg.tempWeight)
basePts = clamp(max(baseScaled, 0), cfg.baseFloor, 10)
```
Winter `baseFloor = 4` means winter days with any temperature earn at least 4 points.

**Null handling:** `tmax ?? -999` — null tmax → -999 → 0 points in both seasons.

### C.3 Wind Penalty Points

**Function:** `windPenaltyPoints(w, season)` — lines 56–70.

**Summer:**

| windMax (m/s) | Penalty |
|---|---|
| ≤ 7   | 0 |
| ≤ 10  | 1 |
| ≤ 13  | 3 |
| ≤ 16  | 6 |
| > 16  | 10 |

**Winter:**

| windMax (m/s) | Penalty |
|---|---|
| ≤ 5   | 0 |
| ≤ 10  | 2 |
| ≤ 15  | 5 |
| > 15  | 10 |

**Null handling:** `w ?? 0` — null windMax treated as 0 m/s (no penalty).

Applied in `scoreSiteDay()` as: `windPen = round(windPenRaw × cfg.windWeight)`.
Winter `windWeight = 1.0` — same scale both seasons.

### C.4 Rain Penalty Points

**Function:** `rainPenaltyPoints(mm)` — lines 72–77.

| rain (mm/day) | Penalty |
|---|---|
| < 1  | 0 |
| < 4  | 2 |
| ≥ 4  | 5 |

**Null handling:** `mm ?? 0` — null treated as 0 mm (no penalty).

Applied as: `rainPen = round(rainPenBase × precipTimingMultiplier × cfg.rainWeight)`.

`getPrecipTimingMultiplier()` (lines 292–300): returns 0 if `rain < 1 mm`, else 1.
This is **redundant** with the 0-penalty tier in `rainPenaltyPoints` (both produce 0
for rain < 1mm). Result is always the same; the multiplier field exists for future
extension.

### C.5 Gust Penalty Points

**Function:** `gustPenaltyPoints(gust, windMax, season)` — lines 128–157.

`diff = gust - windMax`. Returns 0 if either value is null, or diff ≤ 0.

**Summer:**

| diff (m/s) | Penalty |
|---|---|
| < 2.9  | 0 |
| < 6    | 1 |
| < 10   | 2 |
| ≥ 10   | 3 |

**Winter:** `penalty = min(5, round(summer_penalty × 1.6))`.

Examples: diff 3 → summer 1, winter 2; diff 7 → summer 2, winter 3; diff 11 → summer 3, winter 5.

**Null handling:** if `gust == null` OR `windMax == null` → returns 0.

`gustPen` is NOT multiplied by `cfg.windWeight` (comment: "already weighted in function").
Winter weighting is internal to this function (the 1.6× multiplier).

### C.6 Pleasantness Modifier

**Function:** `getPleasantnessModifier({tmax, windMax, weatherCode})` — lines 120–125.

Composed of three sub-functions:

**Sky comfort** (`getSkyComfortModifier`, lines 100–107):

| weatherCode | Modifier |
|---|---|
| 0 (clear) or 1 (mainly clear) | +1 |
| 3 (overcast) | −1 |
| 45 or 48 (fog) | −1 |
| All others | 0 |

**Cold wind penalty** (`getColdWindPenalty`, lines 81–98):
Active only when `tmax ≤ 8°C` AND `windMax ≥ 5 m/s`. Penalty 0–3 points.

| tmax (°C) | windMax (m/s) | Penalty |
|---|---|---|
| ≤ 0 | ≥ 10 | 3 |
| ≤ 0 | ≥ 7  | 2 |
| ≤ 0 | ≥ 5  | 1 |
| ≤ 4 | ≥ 10 | 2 |
| ≤ 4 | ≥ 8  | 1 |
| ≤ 4 | otherwise | 0 |
| 5–8 | ≥ 12 | 1 |
| 5–8 | < 12 | 0 |

**Wintry precip penalty** (`getWintryPrecipPenalty`, lines 109–118):
Active for snow codes (71–77, 85, 86) and freezing rain (66, 67).

| condition | tmax (°C) | Penalty |
|---|---|---|
| Snow code | ≤ 2 | 3 |
| Snow code | > 2 | 2 |
| Freezing rain | any | 2 |
| Other | any | 0 |

**Combined:** `pleasantness = sky - coldWind - wintry`. Can be negative.

### C.7 Rain Streak Penalty

**Function:** `rainStreakPenaltyPoints(streakLen)` — lines 166–172.

| streak (consecutive wet days) | Penalty |
|---|---|
| ≤ 1 | 0 |
| 2   | 1 |
| 3   | 2 |
| 4   | 3 |
| ≥ 5 | 4 (cap) |

**Wet day threshold:** `isWetDay(rainMm, wetThresholdMm=3)` — line 161–163.
`rain >= 3mm` is wet by default. Route Planner uses default 3mm.

Applied in `scoreDaysWithRainStreak()` (lines 181–237): streak accumulated in
chronological order. Streak resets to 0 on any non-wet day.

**Applied to:** `pointsRaw` (unclamped). Then re-clamped to 0–10 for display.

### C.8 Shelter Bonus

**Function:** `computeShelterBonus({shelter, windMax, windGust, season})` —
lines 279–289.

Requires shelter as 0–10 value (`normalizeShelter` clamps/normalises).

`windSeverity01` (lines 263–277):
- Wind component: `clamp((windMax - 4) / (18 - 4), 0, 1)` — 0 at 4 m/s, 1 at 18 m/s.
- Gust component: `clamp((gust - windMax) / 12, 0, 1)` — 0 at 0 gustiness, 1 at 12 m/s above mean.
- Blend: `wind01 × 0.75 + gust01 × 0.25`.

`shelterCurve = shelter01^1.2` (slight non-linear favour to high shelter).

`maxBonus = 2` (summer) or `3` (winter).

`shelterBonus = round(shelterCurve × windSeverity01 × maxBonus)`.

**Only applied in Route Planner path.** Leaderboard does not pass `shelter` to
`scoreSiteDay`, so this bonus is always 0 for leaderboard scores.

### C.9 Full Day Score Formula

**Function:** `scoreSiteDay()` — lines 302–372.

```
pointsRaw = basePts - windPen - rainPen - gustPen - rainStreakPen + shelterBonus + pleasantness
points    = clamp(pointsRaw, 0, 10)
finalClass = pointsToClass(points)
```

**Input precision:** All inputs rounded to 1 decimal (`round1()`, line 253)
before scoring. This aligns engine precision with the 1-decimal UI display.

**Output classes** (`pointsToClass`, lines 239–245):

| points | class |
|---|---|
| ≥ 9 | "Best" |
| ≥ 7 | "Good" |
| ≥ 4 | "Ok" |
| ≥ 1 | "Fair" |
| < 1 | "Bad" |

Note: `finalClass` is determined from the clamped `points` (0–10), not `pointsRaw`.
Two sites with `pointsRaw = -2` and `pointsRaw = -5` both display "Bad" and both
score 0 for leaderboard, but `pointsRaw` remains distinct for route planner delta.

---

## D. DECISION RULES

### D.1 Route Planner Verdict (per candidate)

**Function:** `decideCandidate({windowDays, deltaVsBase, distanceKm})` —
`src/lib/relocationEngine.js` lines 478–606.

**Step 1 — Per-day delta classification** (threshold 0.75 points):
- `betterDays`: candidate day delta > +0.75
- `worseDays`: candidate day delta < −0.75
- `sameDays`: within ±0.75

Day delta is computed by `getExplainDayDelta()` (lines 252–281): uses clamped
points unless both sites are clamped to the same value (at 0 or 10) — in that
case uses raw unclamped points to break ties.

**Step 2 — Required delta by distance** (`requiredDeltaForDistance`, lines 244–250):

| distanceKm | Required delta |
|---|---|
| ≤ 25 | 0.5 |
| ≤ 75 | 1.5 |
| ≤ 150| 3.0 |
| > 150| 5.0 |

**Step 3 — Base recommendation** (lines 492–522):

| Condition | Recommendation |
|---|---|
| worseDays > betterDays | STAY |
| allDaysSame AND hasPositiveDelta | STAY (aggregateType: "slight") |
| allDaysSame AND NOT hasPositiveDelta | STAY (aggregateType: "same") |
| hazardImproved AND betterDays ≥ 2 AND hasPositiveDelta | MOVE |
| hazardImproved (otherwise) | CONSIDER |
| NOT hasPositiveDelta OR deltaVsBase < requiredDelta | STAY |
| betterDays ≥ 2 AND betterDays > worseDays | MOVE |
| betterDays > worseDays | CONSIDER |

**Step 4 — Hazard blocker** (lines 524–537):

| Hazard condition | Effect |
|---|---|
| Candidate has high-hazard day that base does NOT have | Force STAY |
| Candidate has high-hazard day (both have it) AND was MOVE | Downgrade to CONSIDER |
| Candidate has bad-score day (≤ 4.5 pts) without same-or-worse base AND was MOVE | Downgrade to CONSIDER |

**Step 5 — Rough-weather window veto** (lines 540–575, "Ticket #168"):
Applied only when recommendation == MOVE:
- If candidate's rough-weather window starts immediately AND has ≥ 2 days AND more than base's immediate window → Force STAY.
- If candidate has ≥ 3 rough-weather days AND more than base's total → Force STAY.
- If candidate has ≥ 2 rough-weather days AND more than base's total → Downgrade to CONSIDER.

**Recommendation rank** (for sorting candidates):
- MOVE → 3, CONSIDER → 2, STAY/slight → 1, STAY/same → 0.

### D.2 Hazard Thresholds

**Source:** `src/config/hazards.js` (HAZARDS_V1, lines 4–20).

| Hazard | Warn threshold | High threshold |
|---|---|---|
| Wind (windMax) | 14 m/s | 18 m/s |
| Gust (windGust) | 20 m/s | 24 m/s |
| Rain (daily) | 12 mm | 20 mm |
| Temp cold | −8°C (tmin) | −15°C (tmin) |
| Temp heat | 24°C (tmax) | 28°C (tmax) |

Cold warnings: code comment in both `src/config/hazards.js` (line 14) and
`src/lib/relocationEngine.js` (line 174) notes that cold warnings require `tmin`
and are intentionally skipped in the Route Planner because `tmin` is not in the
engine day objects at present. The cold thresholds are defined but not used in
practice in the Route Planner.

### D.3 DecisionBanner (homepage)

**File:** `src/components/DecisionBanner.jsx`

Reads `routePlannerSummary.verdict` (from Route Planner, Path 2). Displays
STAY / CONSIDER / MOVE tone.

For STAY, also checks `hasRoughWeather(rows)` to choose body copy: scans raw
forecast rows (daily) against `HAZARDS_V1.windWarn`, `gustWarn`, `rainWarn`.
This is a **separate, independent rough-weather check** from the Route Planner
hazard logic — it uses raw rows (not normalized values) and thresholds from
`HAZARDS_V1` directly. Outcome affects copy only, not the verdict.

### D.4 InstantComparison Recommendation Logic

**File:** `src/components/InstantComparison.jsx`

When no Route Planner result is available, `selectBestCandidate()` (lines 104–134):
- Requires `scored.score - currentScore >= MIN_SCORE_DIFF (5)`.
- Requires `distFromBase <= radiusKm` (haversine distance).
- Among qualifying candidates, selects the one with the highest score.

**Score tier** for badge display (lines 144–149):

| scoreDiff | tier |
|---|---|
| ≥ 15 | 3 ("much-better") |
| ≥ 8  | 2 ("better") |
| ≥ 5  | 1 ("slightly-better") |
| < 5  | 0 ("similar") — never shown (threshold blocks entry) |

**Metric classification** (`classifyMetrics`, lines 31–63): compares 3-day averages
of windMax, totalRain, avgHighTemp between current and candidate:
- Wind improvement: current.avgWind − candidate.avgWind ≥ 1.5 m/s.
- Rain improvement: current.totalRain − candidate.totalRain ≥ 2 mm.
- Temp improvement: candidate.avgHighTemp − current.avgHighTemp ≥ 1.5°C.

**Strength** from metric count:
- 2+ improvements, 0 worsenings → "strong"
- 1 improvement, 0 worsenings → "decent"
- 1+ improvement, 1+ worsening → "weak"
- 0 improvements → "mixed"

**Display tier cap** (line 286): `tier = min(scoreTier(scoreDiff), metricCap(strength))`.
A high score diff can be downgraded if metric classification is weak/mixed.

---

## E. COMPARISON LOGIC

### E.1 Two-Campsite Comparison (CampsiteComparisonSection)

**Helper file:** `src/utils/compareCampsiteForecasts.js`

**Exported threshold constants** (lines 6–8):
```
WIND_DIFF_THRESHOLD = 2   (m/s)
RAIN_DIFF_THRESHOLD = 1   (mm/day)
TEMP_DIFF_THRESHOLD = 2   (°C)
```

**Per-day winner logic** (`getDailyComparisonWinner`, lines 52–75):
Calls `buildResult()` with four factor votes:

| Factor | Input fields | Threshold | Weight | Higher is better |
|---|---|---|---|---|
| Wind (mean) | `windMax` | 2 m/s | 3 | No |
| Wind (gust) | `windGust` | 2 m/s | 1 | No |
| Rain | `rain` | 1 mm | 2 | No |
| Temp | `tmax` | 2°C | 1 | Yes |

`compareMetric()` (lines 18–27): if `|a - b| < threshold` → vote 0 (tie).
Otherwise vote +1 for winner, -1 for loser.

**Score aggregation:** `aScore += weight × (vote == +1)`, `bScore += weight × (vote == -1)`.
If `aScore > bScore` → `A_BETTER`; if `bScore > aScore` → `B_BETTER`; else `SIMILAR`.

**Maximum possible aScore = 7** (wind 3 + gust 1 + rain 2 + temp 1).

**Winner determination is binary** — no numeric score produced, only `A_BETTER |
B_BETTER | SIMILAR` and a `reasons` array of factor labels.

**Input source** (confirmed in `CampsiteComparisonSection.jsx`):
```js
windMax ← dataA.daily.windspeed_10m_max?.[i]
windGust← dataA.daily.windgusts_10m_max?.[i]
rain    ← dataA.daily.precipitation_sum?.[i]
tmax    ← dataA.daily.temperature_2m_max?.[i]
```
No normalization. No time weighting. No shelter. No rain streak.

This is confirmed intentional design (CLAUDE.md, section "Campsite comparison (Pro feature)"):
"The comparison deliberately uses raw values so the displayed factor rows always
match the verdict." Code confirms this; `normalizeDailyToScoreInput` is NOT imported
in `CampsiteComparisonSection.jsx`.

**Hourly comparison** (`getHourlyComparisonWinner`, lines 81–103): same thresholds
and weights, but uses raw Open-Meteo hourly field names:
`windspeed_10m`, `windgusts_10m`, `precipitation`, `temperature_2m`.

### E.2 Two Scoring Paths — Intentional Divergence

The CLAUDE.md documents two paths: "the main recommendation uses time-weighted
normalized values (normalizeDailyToScoreInput), while the two-campsite comparison
feature deliberately uses raw daily API values."

**Code verification confirms this is correct for those two paths**, but there is a
**third path** not explicitly documented in CLAUDE.md: the leaderboard
(`useLeaderboardScores`) also uses raw daily API values (not time-weighted).

Summary of divergence:

| | Leaderboard | Route Planner | 2-Site Comparison |
|---|---|---|---|
| Wind input | `windspeed_10m_max` (raw) | Time-weighted hourly max | `windspeed_10m_max` (raw) |
| Rain input | `precipitation_sum` (raw) | Time-weighted hourly sum | `precipitation_sum` (raw) |
| Shelter bonus | No | Yes | No |
| Rain streak | No | Yes | No |
| Aggregation | Simple sum | Decay-weighted avg | Per-day threshold vote |
| Scope | 7 days | 3 days (configurable) | 7 days |

A campsite that experiences its worst wind at 3am will score identically to one
with the same wind at noon in the leaderboard and comparison paths, but score
significantly better in the Route Planner (because night hours carry only 0.45 weight).

### E.3 InstantComparison vs Route Planner Candidate

`InstantComparison` uses its own `selectBestCandidate()` when `routePlannerSummary`
is not ready, but defers to `routePlannerSummary.candidate` when Route Planner
has a result (lines 231–249). A DEV-mode console warning fires if these disagree.

The two selections can diverge because:
1. Different scoring paths (leaderboard sum vs Route Planner decay-weighted avg).
2. Different distance functions (geo.js `haversine` vs distance.js `distanceKm`
   — both haversine with R=6371, mathematically equivalent but different code).
3. Different threshold: leaderboard needs `MIN_SCORE_DIFF = 5` over 7-day sum;
   Route Planner needs `deltaVsBase >= requiredDelta (0.5–5.0)` on 3-day window.

---

## F. SHELTER MODEL

Two separate shelter concepts exist in the codebase and must not be conflated.

### F.1 Site Shelter (Route Planner scoring, 0–10 scale)

**Source:** `relocationEngine.js`, `pickSiteShelter()` (lines 27–35).

Reads from site data object:
```
candidates = [site.shelter, site.shelterScore, site.shelter_rating]
```
First non-null numeric value, clamped to 0–10. Defaults to 0 if all missing.

Used in `computeShelterBonus()` in `scoring.js` to provide up to +2 (summer) or
+3 (winter) bonus points, scaled by wind severity (Section C.8).

**Where it comes from:** Site data in `server_data/campsites.*.json`. Leaderboard
scoring does NOT use this value.

### F.2 Weekly Shelter Score Display (0–100 scale, UI feature)

**File:** `src/lib/shelterUtils.js`

**Function:** `getWeeklyShelterScore(daily)` (lines 69–103).

Inputs: `windspeed_10m_max` array and `winddirection_10m_dominant` array.

Formula:
```
avgWind    = arithmetic mean of windspeed_10m_max values
windPenalty = clamp(avgWind / 15, 0, 1) × 70     (0 if calm, 70 if ≥ 15 m/s)
dirStd     = circularStdDeg(dirs)
stability  = 1 - clamp(dirStd / 90, 0, 1)
stabilityBonus = stability × 30                   (0 if shifting, 30 if stable)
score      = round(clamp(100 - windPenalty + stabilityBonus, 0, 100))
```

Labels: ≥ 75 → "High"; ≥ 50 → "Medium"; < 50 → "Low".

This score is a **display-only metric** shown in the Top 5 leaderboard (Pro feature).
It is **not used in scoring** or recommendation logic. It is computed from the
forecast week's wind data, not from static site attributes.

**Directional compass logic ("shelteredFrom"):** The translation key `shelteredFrom`
exists in `src/i18n/translations.common.js` and is used in `Top5Leaderboard.jsx`
line 72 as a `title` attribute. There is **no code that calculates which compass
direction a site is sheltered from** in the scoring pipeline. `getWeeklyShelterScore`
uses circular standard deviation (direction stability) but does not determine a
specific sheltered direction. The "shelteredFrom" label is decorative UI only.

### F.3 Shelter — Key Finding

The site-level shelter value (0–10) is a static attribute from campsite data. Its
actual values in `server_data/campsites.*.json` are outside the scope of this code
audit. Any validation of shelter scoring should verify that shelter values in the
data files are populated and represent sensible real-world measurements.

---

## G. DISTANCE AND RADIUS

### G.1 Haversine Implementations

Three independent implementations exist. All use Earth radius R = 6371 km.

| File | Function | Formula form |
|---|---|---|
| `src/lib/geo.js` (line 3) | `haversine(a1,o1,a2,o2)` | `2R × arcsin(√m)` |
| `src/utils/distance.js` (line 9) | `haversineKm(lat1,lon1,lat2,lon2)` | `2R × arctan2(√a, √(1-a))` |
| `src/lib/leaderboardUtils.js` (line 43) | inline `dist(a,b)` | `2R × arcsin(√h)` |

The `arcsin` and `arctan2` forms of haversine are mathematically equivalent and
will produce identical results for the distances relevant to Iceland (< 400 km).
They are three separate implementations with no shared ancestor, but all produce
the same values.

**Uses:**
- `geo.js haversine`: used by `InstantComparison.selectBestCandidate()` for radius
  filtering of the local fallback candidate selection.
- `distance.js distanceKm`: used by `relocationEngine.js` for all Route Planner
  radius filtering and candidate sorting.
- `leaderboardUtils.js dist`: used by `prioritizedSites()` to order fetch priority
  by user location. Not used for filtering or recommendations.

### G.2 Radius Filtering

**Route Planner:** Hard filter — candidates beyond `radiusKm` are excluded before
scoring. Source: `relocationEngine.js` line 692: `.filter(({d}) => d <= radiusKm)`.

**Adaptive escalation:** If `bestDelta < minDeltaToConsider (1.0)`, radius is
increased: 50 → 100 → 200 → 300 → 400... → maxRadiusKm. Source: `relocationService.js`
lines 10–27. User-set radius is the cap, not the fixed search radius.

**InstantComparison:** Uses `radiusKm` prop (default 50) as radius for candidate
selection. Must use the same radius as Route Planner. CLAUDE.md documents:
"InstantComparison must ONLY compare campsites within the active Route Planner radius."

**Required delta by distance:** Longer travel distances require larger weather
improvements (see D.2). A site 160 km away requires deltaVsBase ≥ 5.0 for MOVE.

### G.3 Distance Display

CLAUDE.md: "Distance values use geographic/haversine distance, not driving distance."
UI displays approximate straight-line distances. All code distances are haversine.

---

## H. EDGE CASES

### H.1 Temperature Boundary Discontinuities (Summer)

The `basePointsFromTemp` summer table has sharp steps:
- tmax = 14.9°C → 8 points; tmax = 15.0°C → 10 points (+2 jump).
- tmax = 11.9°C → 6 points; tmax = 12.0°C → 8 points (+2 jump).
- tmax = 8.9°C → 4 points; tmax = 9.0°C → 6 points (+2 jump).

A site at 14.9°C could classify as "Good" (8 pts) while a 15.0°C site classifies
as "Best" (10 pts) after the same wind and rain. Two sites with identical weather
except 0.1°C may receive different leaderboard ranks.

The `round1()` call in `scoreSiteDay()` means inputs are evaluated at 1 decimal
precision: `14.95°C` rounds to `15.0°C` and gets 10 points; `14.94°C` rounds to
`14.9°C` and gets 8 points.

### H.2 Wind Boundary (Summer)

- windMax = 7.0 m/s → 0 penalty; windMax = 7.1 m/s → 1 penalty.
- windMax = 10.0 m/s → 1 penalty; windMax = 10.1 m/s → 3 penalty (+2 jump).
- windMax = 16.0 m/s → 6 penalty; windMax = 16.1 m/s → 10 penalty (+4 jump).

### H.3 Rain Boundary

- rain = 0.99mm → 0 penalty; rain = 1.00mm → 2 penalty (+2 jump).
- rain = 3.99mm → 2 penalty; rain = 4.00mm → 5 penalty (+3 jump).

The leaderboard and two-campsite comparison use `precipitation_sum` (daily total)
directly. The Route Planner uses time-weighted hourly rain, which sums hourly
values × time weight. The Route Planner rain total for the same day can differ
from the daily `precipitation_sum` field when rain is concentrated in low-weight
night hours (0–5AM).

### H.4 Gust Boundary

- gustDiff = 2.89 m/s → 0 penalty; gustDiff = 2.90 m/s → 1 penalty.
- gustDiff = 5.99 m/s → 1 penalty; gustDiff = 6.00 m/s → 2 penalty.

If `windGust` is null → gustPenalty = 0 regardless of windMax.

### H.5 Season Boundary

Season flips at month boundary:
- April 30 → "winter" (m=4 ≤ 4, line 14); May 1 → "summer".
- September 30 → "summer" (m=9 ≤ 9); October 1 → "winter".

Same tmax = 10°C, same wind, same rain:
- April 30: baseFloor=4, tempWeight=0.35 → basePts=max(4, round(5 × 0.35))=max(4,2)=4.
- May 1: baseFloor=0, tempWeight=1.0 → basePts=max(0, round(6 × 1.0))=6.

Two consecutive days can produce a 2-point swing purely from the season calendar.

### H.6 Worst-Day Guardrail

If any day in the window has clamped `points < 2`, the candidate's aggregate score
is capped at `worstDay`. Example: window [8, 6, 1.5] with decay weights [1, 0.85, 0.7225]:
- weightedAvg ≈ (8 + 5.1 + 1.08) / 2.57 ≈ 5.51
- worstDay = 1.5 < 2 → total = min(5.51, 1.5) = 1.5.

A single very bad day in the window can collapse the entire score below what
would otherwise be a CONSIDER or MOVE recommendation.

### H.7 Null/Missing Forecast Fields

If a daily field is null/undefined:
- tmax → scored as 0 points (lowest tier) in both summer and winter.
- rain → 0 mm (no penalty).
- windMax → 0 m/s (no penalty).
- windGust → 0 penalty (gust-penalty function returns 0 for null gust).
- weatherCode → no pleasantness modifier (getSkyComfortModifier returns 0 for null).
- date → season defaults to "summer" (getSeasonForDate returns "summer" for null).

**Bias:** Missing weather data is treated optimistically (except temperature, which
gets penalised as 0°C or negative). Sites with incomplete data will appear to have
light wind, no rain, and mild temperature in the leaderboard, which inflates their
apparent score. This is not documented as intentional behavior.

### H.8 Time-weighting and Late Night Storms

In the Route Planner path, severe weather (wind ≥ 22 m/s OR gust ≥ 28 m/s) at
night raises the hour's weight to at least 0.85 (from 0.45). However, moderate
storms (e.g., 18 m/s wind at 3am) still carry only 0.45 weight. A campsite with
14 m/s wind (just above warn threshold) from midnight to 6am will have those hours
weighted at 0.45, potentially scoring better than a site with 10 m/s wind all day
even though the absolute wind strength is higher.

---

## I. DUPLICATED OR CONFLICTING LOGIC

### I.1 Three Haversine Implementations — Redundant but Equivalent

`geo.js`, `distance.js`, and `leaderboardUtils.js` all independently implement
haversine. Mathematically equivalent (confirmed). Risk: if a bug were introduced in
one copy, the others would not be updated. Classification: **accidental duplication**.

### I.2 Three Scoring Paths — Partially Documented, Partially Accidental

CLAUDE.md documents the intentional divergence between Route Planner (normalized)
and Two-Campsite Comparison (raw). It does not explicitly document that the
leaderboard also uses raw daily values.

The leaderboard and comparison sharing "raw daily" inputs appears to be a separate,
undocumented coincidence — they serve different purposes (total score ranking vs.
threshold-based comparison) and there is no code comment indicating the leaderboard
intentionally avoids normalization. The lack of normalization in the leaderboard
likely reflects evolutionary history rather than explicit design.

**Consequence:** A campsite can rank in the Top 5 leaderboard but not appear as
the Route Planner's best candidate (or vice versa) because the two paths weight
time-of-day differently. This is observable but not surfaced to users.

### I.3 InstantComparison Dual Candidate Selection — Designed Handoff

`InstantComparison` has its own `selectBestCandidate()` AND accepts the Route
Planner result via `routePlannerSummary`. When both are available, Route Planner
wins. A DEV-only warning fires on mismatch. This is **intentional design** —
the local fallback supports pages without a Route Planner card.

### I.4 DecisionBanner Rough-Weather Check vs Route Planner

`DecisionBanner.hasRoughWeather(rows)` applies `HAZARDS_V1.windWarn/gustWarn/rainWarn`
thresholds to raw daily rows (passed from the current site's forecast) to choose
between two body copy variants. This is a separate, simpler check from the Route
Planner's per-candidate hazard blocker system. They share the same threshold
constants (`HAZARDS_V1`) but operate on different data sets (raw rows vs.
time-weighted normalized values). The DecisionBanner check only affects copy
selection, not the STAY/CONSIDER/MOVE verdict. Classification: **intentional
functional separation**.

### I.5 Gust Penalty Calculation Comment vs Code

`scoring.js` line 329: `const gustPen = gustPenRaw; // already weighted in function`.
The `gustPenaltyPoints` function applies winter weighting internally (×1.6, capped
at 5). The `windPen` is separately scaled by `cfg.windWeight`, but `gustPen` is not.
For winter: `cfg.windWeight = 1.0`, so this distinction is numerically irrelevant —
but the architecture is inconsistent. **Cosmetic inconsistency only; no behavioral
impact at current weight values.**

---

## J. NON-DETERMINISM

### J.1 Time-of-Day Weighting

The Route Planner normalization step applies weights based on the hour values in
the hourly forecast array (UTC timestamps interpreted per `Atlantic/Reykjavik`
timezone). The same geographic coordinates queried at different wall-clock times
will receive different forecast arrays (different starting hour for "today"),
producing different normalized scores even if the raw data has not changed.

Practically: scores computed at 8pm and scores computed at 8am the same day will
weight the same storm hours differently if the window includes today's earlier hours.

### J.2 Cache TTL

- Forecast data: 30 minutes. A forecast fetched at T=0 and re-scored at T=29m
  uses identical data; at T=31m it may use updated Open-Meteo data.
- Leaderboard scores: 6 hours. Scores survive browser restarts for up to 6 hours.
  If the model is updated (scoring.js changed) without bumping the cache key
  (`campcast:scoresById:v5`), stale scores could persist for up to 6 hours.

### J.3 Timezone Boundary

All hour comparisons use string prefix matching against date `YYYY-MM-DD`
(`ts.startsWith(date)`, `forecastNormalize.js` line 47). The Open-Meteo request
specifies `timezone=Atlantic/Reykjavik`. Iceland uses UTC year-round (no DST).
Boundary behavior on day transitions is well-defined for Iceland but would need
re-verification if the timezone parameter were ever changed.

### J.4 Open-Meteo Forecast Updates

Open-Meteo updates NWP forecasts every ~6 hours (not confirmed in client code).
Because the client cache is 30 minutes, the same coordinates can receive materially
different raw forecast values within a single browsing session if a model update
occurs. This is expected behavior for any live-data weather application.

### J.5 Adaptive Radius State

The Route Planner's adaptive radius escalation means that the same user query can
produce different search radii on different calls, depending on whether any
candidate within 50 km scores above `minDeltaToConsider (1.0)`. If the closest
good site is just barely below threshold, small forecast fluctuations can flip
between a 50 km radius result and a 100 km radius result.

---

## K. MODEL V1.0 CONFIG

The following JSON block is machine-readable and represents confirmed current
values from executable code. All values verified against source files.

```json
{
  "model_version": "1.0",
  "baseline_date": "2026-07-09",
  "audited_commit": "597386c44a27f84428a0b204713de056a2f8e6cc",

  "seasons": {
    "summer_months": [5, 6, 7, 8, 9],
    "winter_months": [10, 11, 12, 1, 2, 3, 4],
    "null_date_default": "summer"
  },

  "season_config": {
    "summer": { "tempWeight": 1.0, "windWeight": 1.0, "rainWeight": 1.0, "baseFloor": 0 },
    "winter": { "tempWeight": 0.35, "windWeight": 1.0, "rainWeight": 1.0, "baseFloor": 4 }
  },

  "temperature_points": {
    "summer": [
      { "gte": 15, "points": 10 },
      { "gte": 12, "points": 8 },
      { "gte": 9,  "points": 6 },
      { "gte": 7,  "points": 4 },
      { "gte": 5,  "points": 3 },
      { "gte": 3,  "points": 2 },
      { "gte": 0,  "points": 1 },
      { "lt": 0,   "points": 0 }
    ],
    "winter": [
      { "gt": 14, "points": 10 },
      { "gte": 12, "points": 8 },
      { "gte": 8,  "points": 5 },
      { "gte": 6,  "points": 2 },
      { "lt": 6,   "points": 0 }
    ],
    "null_tmax_treatment": "scored_as_minus_999C_giving_0_points"
  },

  "wind_penalty_points": {
    "summer": [
      { "lte": 7,  "penalty": 0 },
      { "lte": 10, "penalty": 1 },
      { "lte": 13, "penalty": 3 },
      { "lte": 16, "penalty": 6 },
      { "gt": 16,  "penalty": 10 }
    ],
    "winter": [
      { "lte": 5,  "penalty": 0 },
      { "lte": 10, "penalty": 2 },
      { "lte": 15, "penalty": 5 },
      { "gt": 15,  "penalty": 10 }
    ],
    "null_wind_treatment": "treated_as_0_ms_no_penalty"
  },

  "rain_penalty_points": [
    { "lt": 1,  "penalty": 0 },
    { "lt": 4,  "penalty": 2 },
    { "gte": 4, "penalty": 5 }
  ],

  "gust_penalty_points": {
    "diff_threshold_ms": 2.9,
    "summer": [
      { "lt": 2.9,  "penalty": 0 },
      { "lt": 6,    "penalty": 1 },
      { "lt": 10,   "penalty": 2 },
      { "gte": 10,  "penalty": 3 }
    ],
    "winter_multiplier": 1.6,
    "winter_cap": 5,
    "null_gust_treatment": "penalty_0"
  },

  "pleasantness_modifier": {
    "sky_comfort": {
      "clear_or_mainly_clear": 1,
      "overcast": -1,
      "fog": -1,
      "other": 0
    },
    "cold_wind_penalty": {
      "active_when": "tmax <= 8 AND windMax >= 5",
      "tmax_le_0_wind_ge10": 3,
      "tmax_le_0_wind_ge7": 2,
      "tmax_le_0_wind_ge5": 1,
      "tmax_le_4_wind_ge10": 2,
      "tmax_le_4_wind_ge8": 1,
      "tmax_5to8_wind_ge12": 1
    },
    "wintry_precip_penalty": {
      "snow_codes": [71, 73, 75, 77, 85, 86],
      "freezing_rain_codes": [66, 67],
      "snow_tmax_le_2": 3,
      "snow_tmax_gt_2": 2,
      "freezing_rain": 2
    }
  },

  "rain_streak_penalty": {
    "wet_day_threshold_mm": 3,
    "streak_penalties": [
      { "streak_len": 1, "penalty": 0 },
      { "streak_len": 2, "penalty": 1 },
      { "streak_len": 3, "penalty": 2 },
      { "streak_len": 4, "penalty": 3 },
      { "streak_len_gte5": true, "penalty": 4 }
    ],
    "applied_to": "pointsRaw_before_clamping",
    "applied_in": "route_planner_path_only"
  },

  "shelter_bonus": {
    "shelter_scale": "0_to_10_from_site_data",
    "wind_severity_formula": "clamp((windMax-4)/14, 0,1)*0.75 + clamp((gust-windMax)/12, 0,1)*0.25",
    "shelter_curve_exponent": 1.2,
    "max_bonus_summer": 2,
    "max_bonus_winter": 3,
    "applied_in": "route_planner_path_only"
  },

  "score_classes": {
    "Best": { "gte": 9 },
    "Good": { "gte": 7 },
    "Ok":   { "gte": 4 },
    "Fair": { "gte": 1 },
    "Bad":  { "lt": 1 }
  },

  "time_weighting_normalization": {
    "hours_00_05": 0.45,
    "hours_06_08": 0.75,
    "hours_09_21": 1.00,
    "hours_22_23": 0.75,
    "severe_weather_override_weight": 0.85,
    "severe_wind_threshold_ms": 22,
    "severe_gust_threshold_ms": 28,
    "applied_in": "route_planner_path_only"
  },

  "route_planner": {
    "default_window_days": 3,
    "decay_weight_base": 0.85,
    "worst_day_guardrail_threshold": 2.0,
    "day_delta_threshold_for_classification": 0.75,
    "required_delta_by_distance_km": {
      "lte_25":  0.5,
      "lte_75":  1.5,
      "lte_150": 3.0,
      "gt_150":  5.0
    },
    "adaptive_radius_start_km": 50,
    "min_delta_to_stop_escalation": 1.0,
    "default_max_radius_km": 50
  },

  "hazards_v1": {
    "wind_warn_ms": 14,
    "wind_high_ms": 18,
    "gust_warn_ms": 20,
    "gust_high_ms": 24,
    "rain_warn_mm": 12,
    "rain_high_mm": 20,
    "temp_cold_warn_c": -8,
    "temp_cold_high_c": -15,
    "temp_heat_warn_c": 24,
    "temp_heat_high_c": 28,
    "note_cold": "cold warnings require tmin; intentionally not triggered in route planner (tmin not in engine day objects)"
  },

  "two_campsite_comparison": {
    "wind_diff_threshold_ms": 2,
    "rain_diff_threshold_mm": 1,
    "temp_diff_threshold_c": 2,
    "factor_weights": {
      "wind_mean": 3,
      "wind_gust": 1,
      "rain": 2,
      "temp": 1
    },
    "input_source": "raw_daily_api_fields_no_normalization"
  },

  "instant_comparison": {
    "min_score_diff_to_show": 5,
    "score_diff_tiers": {
      "tier3_gte": 15,
      "tier2_gte": 8,
      "tier1_gte": 5
    },
    "metric_thresholds": {
      "wind_improvement_ms": 1.5,
      "rain_improvement_mm": 2.0,
      "temp_improvement_c": 1.5
    }
  },

  "weekly_shelter_score": {
    "wind_ref_ms": 15,
    "wind_penalty_weight": 70,
    "direction_spread_ref_deg": 90,
    "stability_bonus_weight": 30,
    "labels": { "high_gte": 75, "medium_gte": 50, "low": 0 },
    "used_in": "display_only_not_scoring"
  },

  "cache_ttls": {
    "forecast_memory_and_localstorage_ms": 1800000,
    "scores_localstorage_ms": 21600000,
    "forecast_cache_key_version": "v8",
    "scores_cache_key": "campcast:scoresById:v5"
  }
}
```

---

## L. TEST CASE RECOMMENDATIONS

The following test cases are recommended to establish a deterministic baseline
around threshold boundaries. They should be implemented as unit tests against
`scoreSiteDay`, `getDailyComparisonWinner`, `decideCandidate`, etc.

### Temperature boundary (summer)
1. tmax=14.9°C, no wind, no rain → expect basePts=8
2. tmax=15.0°C, no wind, no rain → expect basePts=10
3. tmax=14.95°C (rounds to 15.0) → expect basePts=10
4. tmax=14.94°C (rounds to 14.9) → expect basePts=8

### Temperature boundary (winter)
5. tmax=14.0°C, winter → expect basePts=max(4, round(8×0.35))=max(4,3)=4
6. tmax=14.1°C, winter (>14) → expect basePts=max(4, round(10×0.35))=max(4,4)=4
7. Confirm winter baseFloor=4 applies even when baseScaled < 4

### Wind boundary (summer)
8. windMax=7.0 m/s → penalty=0
9. windMax=7.1 m/s → penalty=1
10. windMax=10.0 m/s → penalty=1
11. windMax=10.1 m/s → penalty=3
12. windMax=16.0 m/s → penalty=6
13. windMax=16.1 m/s → penalty=10

### Rain boundary
14. rain=0.99mm → penalty=0
15. rain=1.00mm → penalty=2
16. rain=3.99mm → penalty=2
17. rain=4.00mm → penalty=5
18. rain=null → penalty=0

### Gust penalty
19. gust=windMax (diff=0) → penalty=0
20. gust=windMax+2.89 (diff=2.89) → penalty=0
21. gust=windMax+2.90 (diff=2.90) → penalty=1 (summer) or 2 (winter)
22. gust=windMax+10 → penalty=3 (summer), min(5, round(3×1.6))=5 (winter)
23. gust=null → penalty=0

### Season boundary
24. date=2026-04-30 (April, winter), tmax=10°C → basePts=max(4, round(5×0.35))=4
25. date=2026-05-01 (May, summer), tmax=10°C → basePts=6

### Rain streak
26. 4 consecutive wet days (>= 3mm each) → streakPen on day 4 = 3
27. Streak of 5+ → penalty cap = 4
28. Non-wet day resets streak: days [wet, wet, dry, wet] → penalties [0, 1, 0, 0]

### Worst-day guardrail
29. Window [8, 7, 1.8] decay [1, 0.85, 0.7225]: worstDay=1.8 < 2 → total=1.8
30. Window [8, 7, 2.0] decay [1, 0.85, 0.7225]: worstDay=2.0 (not < 2) → total=weightedAvg

### Required delta
31. candidate 20 km away, deltaVsBase=0.49 → requiredDelta=0.5 → not triggered → STAY
32. candidate 20 km away, deltaVsBase=0.51 → requiredDelta=0.5 → may CONSIDER or MOVE

### Two-campsite comparison thresholds
33. windMax A=8, B=5 (diff=3 > threshold=2) → A calmer? No, B calmer. B BETTER.
34. windMax A=8, B=6.1 (diff=1.9 < threshold=2) → tie → SIMILAR on wind factor.
35. rain A=5mm, B=3.5mm (diff=1.5 > threshold=1) → A wetter, so B drier.
36. tmax A=12, B=14.5 (diff=2.5 > threshold=2) → B warmer.

### InstantComparison eligibility
37. scoreDiff=4.9 → candidate not shown (below MIN_SCORE_DIFF=5)
38. scoreDiff=5.0 → candidate shown at tier 1

### Null date → summer season
39. date=null → getSeasonForDate returns "summer", no exception

---

## M. BASELINE FREEZE RECOMMENDATION

### M.1 Files Constituting the Model v1.0 Scoring System

The following files are the complete executable specification of scoring, comparison,
and recommendation logic at baseline. Changes to any of these files alter the model.

**Core scoring:**
- `src/lib/scoring.js` — all scoring functions, weights, thresholds, classes
- `src/lib/forecastNormalize.js` — time-of-day weighting, hourly normalization

**Route Planner engine:**
- `src/lib/relocationEngine.js` — aggregation, decision, ranking, hazard logic
- `src/lib/relocationService.js` — adaptive radius, forecast map assembly

**Comparison:**
- `src/utils/compareCampsiteForecasts.js` — threshold constants, binary comparison

**Shelter:**
- `src/lib/shelterUtils.js` — weekly shelter score (display only)
- `src/config/hazards.js` — hazard threshold definitions

**Distance:**
- `src/utils/distance.js` — Route Planner haversine
- `src/lib/geo.js` — InstantComparison haversine

**Data pipeline:**
- `src/hooks/useLeaderboardScores.js` — leaderboard scoring entry point
- `src/lib/forecastCache.js` — caching layer and Open-Meteo field set
- `api/forecast.js` — proxy; defines Open-Meteo fields requested

**Consumers (UI logic, not scoring):**
- `src/components/InstantComparison.jsx` — candidate selection logic
- `src/components/DecisionBanner.jsx` — rough weather copy selector
- `src/lib/routeVerdictMeta.js` — verdict display mapping

### M.2 Git Tag Recommendation

Recommended tag: `model-v1.0-baseline`
Recommended tag message: "Model v1.0 Baseline — scoring system at funding agreement date 2026-07-09. Audited commit 597386c. See model-baseline-v1.0.md."

Do not tag the current HEAD without verifying the working tree is clean (`git status`).
The working tree was clean at audit time (no uncommitted changes confirmed by git status).

**Do not create tags via this audit document.** Tag creation is a manual step for
the repository owner.

---

## N. ENVIRONMENT SNAPSHOT

### N.1 Commit Information

| Field | Value |
|---|---|
| Commit hash | `597386c44a27f84428a0b204713de056a2f8e6cc` |
| Commit date | 2026-07-10 18:47:41 UTC |
| Commit message | "Fix: #338 Add Tækniþróunarsjóður as supporter" |
| Baseline date | **2026-07-09** (funding agreement date — predates this commit by 1 day) |
| Audited branch | main |

The baseline date of 2026-07-09 is the Tækniþróunarsjóður funding agreement date.
The latest commit at audit time is dated 2026-07-10. The commit adds a supporter
acknowledgement (UI/content only) and does not modify any scoring, comparison, or
recommendation logic. The scoring system is therefore functionally identical to
the 2026-07-09 state.

Existing Git tags at audit time: `v0.9.3-route-planner-hazards`, `v0.9.4`,
`v0.9.5`, `v0.9.6`.

### N.2 Test Suite Result

Command: `npx vitest run` (non-watch mode)

```
Test Files   12 passed (12)
Tests        168 passed (168)
Start at     19:04:57
Duration     1.99s

Test files:
✓ src/utils/compareCampsiteForecasts.test.js  (32 tests)
✓ src/lib/weatherFinderRanking.test.js        (23 tests)
✓ src/utils/distance.test.js                   (7 tests)
✓ src/lib/scoring.rainStreak.test.js           (3 tests)
✓ src/lib/scoring.test.js                     (82 tests)
✓ src/lib/relocationEngine.badDayVeto.test.js  (2 tests)
✓ src/lib/relocationEngine.roughWindow.test.js (2 tests)
✓ src/lib/relocationService.regression.test.js (1 test)
✓ src/lib/relocationEngine.test.js             (8 tests)
✓ src/lib/relocationEngine.regression.test.js  (1 test)
✓ src/lib/relocationEngine.timeWeight.test.js  (4 tests)
✓ src/pages/BlogPostPage.test.jsx              (3 tests)
```

Note: `relocationService.regression.test.js` emits a `console.error` line
("Invalid forecast payload for site: base") which is expected behavior for that
test — it tests the error path. The test itself passes.

### N.3 Runtime Environment

| Component | Version |
|---|---|
| Node.js | v24.11.0 |
| React | ^19.1.1 |
| React DOM | ^19.1.1 |
| React Router | ^7.12.0 |
| Vite | ^7.x (devDependency) |
| Vitest | ^4.0.16 |

### N.4 Open-Meteo Fields and Units (as consumed at audit time)

**Confirmed from `api/forecast.js` lines 51–72 and `src/lib/forecastCache.js`
lines 64–82. Both files request identical field sets.**

**Daily fields:**
| Field | Unit | Used for |
|---|---|---|
| `weathercode` | WMO code | Pleasantness modifier, precip type classification |
| `temperature_2m_max` | °C | Temperature scoring (tmax) |
| `temperature_2m_min` | °C | Stored but not used in scoring (tmin) |
| `precipitation_sum` | mm | Rain penalty (leaderboard + comparison paths) |
| `windspeed_10m_max` | m/s | Wind penalty (leaderboard + comparison paths) |
| `windgusts_10m_max` | m/s | Gust penalty (leaderboard + comparison paths) |
| `winddirection_10m_dominant` | degrees | Direction stability (shelter score display) |

**Hourly fields:**
| Field | Unit | Used for |
|---|---|---|
| `temperature_2m` | °C | Stored (not consumed in current scoring logic) |
| `weathercode` | WMO code | Precip type classification in normalization |
| `precipitation` | mm | Time-weighted rain (Route Planner path) |
| `precipitation_probability` | % | Fetched, not currently used in scoring |
| `windspeed_10m` | m/s | Time-weighted wind max (Route Planner path) |
| `windgusts_10m` | m/s | Time-weighted gust max (Route Planner path) |

**Unit parameters sent:**
- `temperature_unit=celsius`
- `windspeed_unit=ms`
- `precipitation_unit=mm`
- `timezone=Atlantic/Reykjavik`
- `forecast_days=7`

Note: `precipitation_probability` is fetched but not consumed by any scoring
function at audit time. It is available in the raw hourly data if future scoring
logic uses it.

---

*End of Model v1.0 Baseline document.*
*Generated: 2026-07-10. Audited commit: 597386c44a27f84428a0b204713de056a2f8e6cc.*
*Baseline date: 2026-07-09 (Tækniþróunarsjóður funding agreement).*
