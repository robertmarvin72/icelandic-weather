# #437 — Reference cases

**v2 correction (2026-10-23, Jonesy R4/R5)**: RC-18 rebuilt on a real scored-branch fixture (previously never reached `"scored"`, see that section). F-02-related wording elsewhere in this file is unaffected by the B1/B2 corrections (those live in research-report.md/inventory.md); RC-19–RC-21's raw observed data is unchanged and was independently reproduced byte-for-byte by Jonesy's own sandbox re-run.

All cases below were produced by running `docs/ai/tasks/ticket-437/reference-cases-script.mjs` against the real, unmodified repo functions (`classifyRouteRisk`, `estimateRouteRisk`, `detectHazardWindow`, `scoreAuroraVisibility`, `normalizeDailyToScoreInput`, `evaluateWeatherVoice`) — **OBSERVED**, not hypothetical, unless explicitly labelled HYPOTHETICAL. Full raw output: `docs/ai/tasks/ticket-437/reference-cases-output.txt`. Run command:

```
node --experimental-loader=./docs/ai/tasks/ticket-437/esm-ext-loader.mjs docs/ai/tasks/ticket-437/reference-cases-script.mjs
```

(`esm-ext-loader.mjs` is a scratch-only ESM loader that appends `.js` to extensionless relative imports so plain Node can import the app's Vite-style extensionless imports; it is not part of the application and is not imported by it.)

No application file was modified to produce these cases.

## RC-01–RC-10 — `classifyRouteRisk` boundary sweep (app thresholds windWarn=14/windHigh=18/gustWarn=20/gustHigh=24)

| RC | maxWind | maxGust | Result (OBSERVED) |
|---|---|---|---|
| RC-01 | 0 | 0 | LOW |
| RC-02 | 13.9 | 0 | LOW |
| RC-03 | 14 (windWarn) | 0 | MED |
| RC-04 | 17.9 | 0 | MED |
| RC-05 | 18 (windHigh) | 0 | HIGH |
| RC-06 | NaN | 0 | LOW |
| RC-07 | -5 | 0 | LOW |
| RC-08 | null / undefined | 0 | LOW |
| RC-09 | 0 | 19.9 / 20 (gustWarn) / 23.9 / 24 (gustHigh) | LOW / MED / MED / HIGH |
| RC-10 | 0 | null | LOW |

NaN/negative/null/undefined all silently resolve to LOW via JavaScript's own comparison semantics (`NaN >= 18` and `null >= 18` are both `false`), not via any explicit guard in `classifyRouteRisk` itself — there is no distinct "unknown" outcome; missing and confirmed-calm are indistinguishable at this function's boundary alone (the actual zero-defaulting happens one layer up, in `estimateRouteRisk` — see RC-16).

## RC-11–RC-14 — App thresholds vs. official simplified (5/10/20/30) and Beaufort term boundaries (20.8/24.5/28.5/32.7), run through the APP's own classifier

These are the OFFICIAL boundary values (SRC-01) fed through the app's OWN `classifyRouteRisk` purely to show what the app's current thresholds say about them — the official table is not an app input anywhere; this is a comparison, not a claim that the app implements the official scale.

| RC | Input m/s | Official meaning (SRC-01) | App's `classifyRouteRisk` result (OBSERVED) |
|---|---|---|---|
| RC-11 | 4.99 / 5 | official simplified boundary "<5" | LOW |
| RC-12 | 9.99 / 10 | official simplified boundary "5-10" | LOW |
| RC-13 | 19.99 / 20 / 29.99 / 30 | official simplified boundaries "10-20"/"20-30"/">30" | all HIGH (≥ windHigh=18) |
| RC-14 | 20.8 / 24.5 / 28.5 / 32.7 | Beaufort 9 Stormur / 10 Rok / 11 Ofsaveður / 12 Fárviðri lower bounds | all HIGH |

Observation: because the app's own `windHigh=18` sits BELOW every one of the official simplified/Beaufort boundaries at or above 18 m/s, the app's "HIGH" band is reached well before any of the official terms' own lower bounds — the app's "HIGH" is not calibrated to, and should not be read as implying, any specific official term.

## RC-15 — `detectHazardWindow`: duration, not magnitude, drives the "storm" family label

| RC | Scenario | Result (OBSERVED) |
|---|---|---|
| RC-15a | 6 consecutive hours at wind=14 (app windWarn; Beaufort-7 "Allhvass vindur", NOT Beaufort-9 "Stormur" 20.8) | `{"type":"stormyPeriod","hours":6,"factor":1.6}` |
| RC-15b | 6 consecutive hours of **rain=12 only, wind=0, gust=0** | `{"type":"stormyPeriod","hours":6,"factor":1.6}` — **identical output to RC-15a** |
| RC-15c | 2 consecutive hours at wind=20.8 (actual Beaufort-9 "Stormur" magnitude) | `{"type":"passingStorm","hours":2,"factor":1.1}` — the MILDEST label, despite true Beaufort-Stormur-grade wind |

RC-15a vs RC-15b, both OBSERVED: a pure-rain event with zero wind produces the exact same `"stormyPeriod"` type/factor as a sustained-wind event at the app's own (sub-Beaufort-Stormur) windWarn threshold. RC-15c, OBSERVED: real Beaufort-Stormur-magnitude wind (20.8 m/s) sustained for only 2 hours produces the mildest of the three labels, because `detectHazardWindow` tiers purely on consecutive-hour count, never on how far above threshold the value is. See F-03 in research-report.md.

## RC-16 — Missing/non-numeric hourly data in `detectHazardWindow`

Input: `windspeed_10m: [null, "x"]`, `windgusts_10m: [undefined, NaN]`, `precipitation: [0, 0]`. Result (OBSERVED): `null` (no hazard window detected) — every non-number value silently became `0` via the `typeof x === "number" ? x : 0` pattern, so two genuinely-missing/malformed hourly readings are indistinguishable from two genuinely-calm hours.

## RC-17 — `estimateRouteRisk`: every sampled route point's forecast fetch fails

Input: `getForecast` returns `null` for all 4 sampled points. Result (OBSERVED): `{"routeRisk":"LOW","maxWind":0,"maxGust":0,"rainMax":0}` — total forecast-fetch failure across an entire route is reported as the same "LOW" risk as a genuinely confirmed-calm route; nothing in the return value distinguishes "we don't know" from "we checked and it's calm." See F-04.

## RC-18 — `scoreAuroraVisibility`: `HIGH_WIND_MS_THRESHOLD=12` boundary and missing wind

**Corrected in v2 (R4)**: v1's hand-built night/viewingWindow fixture never reached the `"scored"` branch (every case fell into `not_viewable_tonight`/`no_observation_data`), so the `>=12` flag comparator was never actually observed live — only confirmed by direct code read. Fixed by reusing, read-only and unmodified, the exact known-good scored-branch fixture shape from `src/lib/auroraScoring.test.js`'s "high activity + clear sky" case (`baseNight()`, `baseHourlyRows()`, `WIDE_VIEWING_WINDOW`, `EVENING_DATE="2026-08-24"`) and varying only `windSpeed`.

| RC | windSpeed | Reached `"scored"` branch? (OBSERVED) | `flags` includes `high_wind`? (OBSERVED) |
|---|---|---|---|
| RC-18a | 11.9 | **true** | **false** |
| RC-18b | 12 | **true** | **true** |
| RC-18c | null | **true** | **false** |

All three OBSERVED results now explicitly assert `status === "scored"` before drawing any conclusion about the flag, per the correction prompt's requirement. The `>=12` comparator is now independently confirmed LIVE, not only by code read: 11.9 does not set `high_wind`, exactly 12 does, and a missing (`null`) wind reading is treated the same as "not windy" (no flag) rather than as "unknown" — consistent with F-05's missing-data theme, though here the missing value never changes the numeric score either way (`score: 100` in all three cases), since the wind flag is comfort-only by design (`auroraScoring.js:332-337`).

## RC-19–RC-21 — The same 18 m/s event as daily-max / hourly-raw / time-weighted (J9 required case)

All OBSERVED from the real functions, same underlying "18 m/s" wind event, three different code paths:

| RC | Code path | Quantity basis | Result (OBSERVED) |
|---|---|---|---|
| RC-19 | `routeRisk.classifyRouteRisk` | raw provider **daily max** field, always, regardless of what hour the peak occurred | `"HIGH"` (18 ≥ windHigh=18) |
| RC-20a | `hazardWindow.detectHazardWindow` | raw **hourly** value, unweighted, single hour at 14:00 (daytime) | `{"type":"passingStorm","hours":1}` |
| RC-20b | `hazardWindow.detectHazardWindow` | raw **hourly** value, unweighted, single hour at 02:00 (nighttime) | `{"type":"passingStorm","hours":1}` — **identical to RC-20a**; hazardWindow never time-weights |
| RC-21a | `forecastNormalize.normalizeDailyToScoreInput` → `weatherVoiceEngine.evaluateWeatherVoice` | **time-weighted** `windMax`, raw 18 m/s peak at 14:00 (daytime, weight 1.0) | time-weighted `windMax = 18`; voice: `condition:"extreme_wind", mood:"wrecked", severity:3, voiceLevel:"serious"` |
| RC-21b | same chain | **time-weighted** `windMax`, raw 18 m/s peak at 02:00 (nighttime, weight 0.45) | time-weighted `windMax = 8.1`; voice: `condition:"sun_wind", mood:"suspicious", severity:1, voiceLevel:"sarcastic"` |
| RC-21c | same chain, **no hourly data supplied** (fallback to raw daily max) | raw **daily max** fallback, `windMax = 18` (same number `routeRisk` sees in RC-19) | voice: `condition:"extreme_wind", mood:"wrecked", severity:3, voiceLevel:"serious"` (same as RC-21a) |

RC-21a vs RC-21b, OBSERVED: the identical raw 18 m/s hourly gust produces the app's single most severe voice tone ("wrecked"/"serious") when it happens to occur at a daytime hour, but the mildest active voice tone ("suspicious"/"sarcastic") when it occurs at night — purely from the 0.45 time-of-day weight in `forecastNormalize.js`, nothing to do with any official wind-speed definition. RC-19/RC-20/RC-21 together OBSERVED: three different app surfaces reach three structurally different conclusions (route risk HIGH; hazard-window label unaffected by exact magnitude once above its own per-hour threshold; voice tone swinging from worst-to-mildest by hour-of-day) from what is, in the real world, one single wind event.

## Not run this round (explicit gaps, not silently omitted)

- Live reference cases for `weatherVoiceRules.js`'s other non-wind branches (temperature/rain conditions) — out of scope for this wind-focused research.
- No case was run against a REAL Open-Meteo response (no live provider probe, per STOP rule) — all hourly/daily inputs above are synthetic, shaped to match the documented/coded field contracts (SRC-04, inventory.md), not captured live traffic.
