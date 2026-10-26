// Ticket #444 — Phase A reference-cases script (J7).
//
// Imports ONLY pure modules, exercised through their real exported API
// (never a reimplementation of their logic): weatherFinderRanking.js
// (rankWarmest, which internally calls the unexported computeMetrics),
// comparisonUtils.js (calcMetrics), scoring.js (basePointsFromTemp,
// getColdWindPenalty, getWintryPrecipPenalty, scoreSiteDay), and
// forecastNormalize.js (normalizeDailyToScoreInput). No forecastCache.js,
// no React, no network, no filesystem writes beyond this console log being
// redirected by the caller. Read-only: confirmed by inspection before
// writing this file that none of the four imported modules touch
// localStorage, fetch, or the DOM.
import { rankWarmest } from "../../../../../src/lib/weatherFinderRanking.js";
import { calcMetrics } from "../../../../../src/lib/comparisonUtils.js";
import {
  basePointsFromTemp,
  getColdWindPenalty,
  getWintryPrecipPenalty,
  scoreSiteDay,
} from "../../../../../src/lib/scoring.js";
import { normalizeDailyToScoreInput } from "../../../../../src/lib/forecastNormalize.js";

function log(label, value) {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(value, null, 2));
}

// RC-01 — asymmetric 4-sample period (NOT a 24h day: four forecast DAYS),
// contrasting the real mean-of-maxima computeMetrics produces against the
// midpoint-of-extrema the Expert Support paraphrase distinguishes from a
// true mean. Nothing in this codebase computes a midpoint-of-extrema; it is
// calculated by hand here purely for the side-by-side illustration.
{
  const forecast = [{ tmax: 2 }, { tmax: 2 }, { tmax: 2 }, { tmax: 10 }];
  const result = rankWarmest(
    [{ id: "rc01", name: "RC-01", distanceKm: 0, forecast }],
    { days: 4 }
  );
  const avgTemp = result[0]?.metrics?.avgTemp ?? null;
  const midpointOfExtrema = (Math.min(2, 2, 2, 10) + Math.max(2, 2, 2, 10)) / 2;
  log("RC-01 asymmetric [2,2,2,10] over 4 forecast days", {
    inputs_tmax: [2, 2, 2, 10],
    computeMetrics_avgTemp_via_rankWarmest: avgTemp,
    midpointOfExtrema_handComputed_NOT_in_codebase: midpointOfExtrema,
    note: "mean (4.0) and midpoint-of-extrema (6.0) genuinely differ for this input — exactly the Expert Support paraphrase's point. Mode is not computed by any surface either.",
  });
}

// RC-02 — missing value, partial series [10, null, 10]. Exercises the same
// underlying rows through BOTH real missing-data policies.
{
  const forecast = [{ tmax: 10 }, { tmax: null }, { tmax: 10 }];
  const finderResult = rankWarmest(
    [{ id: "rc02", name: "RC-02", distanceKm: 0, forecast }],
    { days: 3 }
  );
  const calc = calcMetrics(forecast);
  log("RC-02 partial series [10, null, 10] — same rows, two real policies", {
    inputs_tmax: [10, null, 10],
    weatherFinderRanking_avgTemp_missingToZero: finderResult[0]?.metrics?.avgTemp ?? null,
    comparisonUtils_avgHighTemp_missingExcluded: calc?.avgHighTemp ?? null,
  });
}

// RC-03 — all-null tmax for a site (finder's policy renders this as a
// confident 0.0°C, indistinguishable from a genuinely verified 0°C day).
{
  const forecast = [{ tmax: null }, { tmax: null }, { tmax: null }];
  const finderResult = rankWarmest(
    [{ id: "rc03", name: "RC-03", distanceKm: 0, forecast }],
    { days: 3 }
  );
  const calc = calcMetrics(forecast);
  log("RC-03 all-null tmax for a site", {
    inputs_tmax: [null, null, null],
    weatherFinderRanking_avgTemp: finderResult[0]?.metrics?.avgTemp ?? null,
    comparisonUtils_avgHighTemp: calc?.avgHighTemp ?? null,
    note: "finder would rank/label this site as exactly 0.0°C average; comparisonUtils correctly returns null (no data) since ALL three values were excluded.",
  });
}

// RC-04 — no data at all (empty forecast array). Confirms both functions'
// documented null-for-empty-input behavior, not a silent zero.
{
  const emptyFinder = rankWarmest(
    [{ id: "rc04", name: "RC-04", distanceKm: 0, forecast: [] }],
    { days: 3 }
  );
  const emptyCalc = calcMetrics([]);
  log("RC-04 no data (empty forecast array)", {
    weatherFinderRanking_result_length: emptyFinder.length,
    note_finder: "computeMetrics returns null for an empty slice; filterSites already excludes sites with forecast.length===0, so this site never even reaches rankWarmest's output array.",
    comparisonUtils_calcMetrics_result: emptyCalc,
  });
}

// RC-05 — legitimate 0 and negative values must NOT be confused with any
// missing-data sentinel (scoring.js uses -999/10 as its own sentinels).
{
  const base0 = basePointsFromTemp(0, "summer");
  const baseNeg5 = basePointsFromTemp(-5, "summer");
  const baseMissing = basePointsFromTemp(null, "summer");
  const coldWind0 = getColdWindPenalty(0, 10);
  const coldWindMissing = getColdWindPenalty(undefined, 10);
  const wintry0 = getWintryPrecipPenalty(71, 0);
  const wintryMissing = getWintryPrecipPenalty(71, undefined);
  log("RC-05 legitimate 0/negative vs scoring.js's own missing-data sentinels", {
    "basePointsFromTemp(0)": base0,
    "basePointsFromTemp(-5)": baseNeg5,
    "basePointsFromTemp(null) [missing -> internal -999 sentinel]": baseMissing,
    "getColdWindPenalty(0, windMax=10)": coldWind0,
    "getColdWindPenalty(undefined, windMax=10) [missing -> internal 10 sentinel]": coldWindMissing,
    "getWintryPrecipPenalty(code=71/snow, tmax=0)": wintry0,
    "getWintryPrecipPenalty(code=71/snow, tmax=undefined) [missing -> internal 10 sentinel]": wintryMissing,
    note: "0 and -5 are both treated as real, finite temperatures throughout scoring.js — no collision with the -999/10 sentinels, which are far outside any realistic Icelandic air temperature.",
  });
}

// RC-06 — full scoreSiteDay() call with a missing tmax, to see the combined
// real-world effect of BOTH scoring.js sentinels (-999 in basePointsFromTemp,
// 10 in getColdWindPenalty/getWintryPrecipPenalty) acting together on one
// day. Correction v2 (Jonesy R1): the original single-date (2026-06-15,
// summer) run is NOT representative of winter — getSeasonForDate(date)
// selects a season config (getSeasonConfig) whose winter baseFloor (4) can
// swamp the entire basePointsFromTemp signal regardless of whether tmax is
// present or missing. Run on all three Ripley-specified dates so the season
// dependence is shown directly, not asserted.
{
  const DATES = ["2026-06-15", "2026-10-27", "2027-01-10"];
  const results = {};
  for (const date of DATES) {
    const complete = scoreSiteDay({
      tmax: 12,
      rain: 0,
      windMax: 5,
      windGust: 8,
      date,
      shelter: 0,
      weatherCode: 1,
    });
    const missing = scoreSiteDay({
      tmax: null,
      rain: 0,
      windMax: 5,
      windGust: 8,
      date,
      shelter: 0,
      weatherCode: 1,
    });
    results[date] = {
      season: complete.season,
      tempWeight: complete.tempWeight,
      complete_day_points: complete.points,
      complete_day_class: complete.finalClass,
      complete_day_basePts: complete.basePts,
      missing_tmax_day_points: missing.points,
      missing_tmax_day_class: missing.finalClass,
      missing_tmax_day_basePts: missing.basePts,
      points_differ: complete.points !== missing.points,
    };
  }
  log("RC-06 scoreSiteDay — same complete/missing-tmax pair, run on 3 real dates (season dependence)", results);
}

// RC-08 — Jonesy's suggested hypothetical rankWarmest comparison: candidate
// A has a missing middle day, candidate B is fully valid but genuinely
// cooler on average. Shows the 0-coercion policy can invert a ranking
// relative to what calcMetrics (missing-excluded) would conclude for the
// same inputs — a concrete rank-distortion example, not asserted abstractly.
{
  const siteA = { id: "A", name: "A", distanceKm: 0, forecast: [{ tmax: 10 }, { tmax: null }, { tmax: 10 }] };
  const siteB = { id: "B", name: "B", distanceKm: 0, forecast: [{ tmax: 8 }, { tmax: 8 }, { tmax: 8 }] };
  const ranked = rankWarmest([siteA, siteB], { days: 3 });
  const calcA = calcMetrics(siteA.forecast);
  const calcB = calcMetrics(siteB.forecast);
  log("RC-08 rankWarmest A[10,null,10] vs B[8,8,8] — hypothetical, no rain/wind", {
    rankWarmest_order_by_id: ranked.map((r) => r.id),
    rankWarmest_avgTemp_A: ranked.find((r) => r.id === "A")?.metrics?.avgTemp ?? null,
    rankWarmest_avgTemp_B: ranked.find((r) => r.id === "B")?.metrics?.avgTemp ?? null,
    calcMetrics_avgHighTemp_A_missingExcluded: calcA?.avgHighTemp ?? null,
    calcMetrics_avgHighTemp_B: calcB?.avgHighTemp ?? null,
    note: "if calcMetrics's exclude-missing policy were used instead, A (10.0) would be warmer than B (8.0); rankWarmest's 0-coercion policy instead scores A at 6.67, making B (8.0) rank warmest. This is a hypothetical 3-day example, not a claim about production frequency.",
  });
}

// RC-07 — tmax/tmin pass through forecastNormalize.js UNCHANGED by the
// hourly time-of-day weighting that rain/windMax/windGust receive; and
// tmax's own value is unaffected by hourly data being entirely absent
// ("partial day" / no hourly coverage for that date).
{
  const daily = {
    time: ["2026-06-15", "2026-06-16"],
    temperature_2m_max: [12, 14],
    temperature_2m_min: [6, 7],
    precipitation_sum: [0, 2],
    windspeed_10m_max: [5, 6],
    windgusts_10m_max: [8, 9],
    winddirection_10m_dominant: [180, 190],
    weathercode: [1, 61],
  };
  const withoutHourly = normalizeDailyToScoreInput(daily, null);
  const withPartialHourlyDay2Only = normalizeDailyToScoreInput(daily, {
    time: ["2026-06-16T00:00", "2026-06-16T06:00", "2026-06-16T12:00", "2026-06-16T18:00"],
    windspeed_10m: [1, 2, 3, 4],
    windgusts_10m: [2, 3, 4, 5],
    precipitation: [0, 0, 1, 1],
  });
  log("RC-07 tmax through forecastNormalize — no hourly coverage at all vs. partial (day 1 has none, day 2 has some)", {
    tmax_withoutHourly: withoutHourly.map((d) => d.tmax),
    tmax_withPartialHourly: withPartialHourlyDay2Only.map((d) => d.tmax),
    windMax_withoutHourly_fallsBackToRawDaily: withoutHourly.map((d) => d.windMax),
    windMax_day1_noHourlyForThatDate_fallsBackToRawDaily: withPartialHourlyDay2Only[0].windMax,
    windMax_day2_hasHourly_isTimeWeighted: withPartialHourlyDay2Only[1].windMax,
    note: "tmax is identical in both runs (12, 14) — it never depends on hourly presence/completeness. windMax DOES change: day 1 (no hourly rows for its date) falls back to the raw daily max (5); day 2 (has hourly rows) uses the time-weighted max instead (6 * weight, weight depends on each row's hour-of-day).",
  });
}

console.log("\n(script complete — no files written, no network/localStorage touched)");
