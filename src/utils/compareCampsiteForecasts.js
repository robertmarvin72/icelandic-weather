// src/utils/compareCampsiteForecasts.js
// Pure comparison logic for two campsite forecasts.
// Inputs use field names from normalizeDailyToScoreInput() for daily
// and raw Open-Meteo hourly field names for hourly.

export const WIND_DIFF_THRESHOLD = 2; // m/s — primary strongest factor
export const RAIN_DIFF_THRESHOLD = 1; // mm/day (or mm/hour for hourly)
export const TEMP_DIFF_THRESHOLD = 2; // °C — lowest-weight factor

// Internal weights — wind outweighs rain, rain outweighs temp
const WIND_WEIGHT = 3;
const GUST_WEIGHT = 1; // secondary wind signal when gust data exists
const RAIN_WEIGHT = 2;
const TEMP_WEIGHT = 1;

// Returns 1 if A clearly wins this metric, -1 if B wins, 0 if too close to call.
// higherIsBetter: true for temperature, false for wind and rain.
function compareMetric(valA, valB, threshold, higherIsBetter) {
  const a = typeof valA === "number" && Number.isFinite(valA) ? valA : null;
  const b = typeof valB === "number" && Number.isFinite(valB) ? valB : null;
  if (a === null || b === null) return 0;

  const diff = a - b;
  if (Math.abs(diff) < threshold) return 0;

  return (higherIsBetter ? diff > 0 : diff < 0) ? 1 : -1;
}

function buildResult(factors) {
  let aScore = 0;
  let bScore = 0;
  for (const { vote, weight } of factors) {
    if (vote === 1) aScore += weight;
    else if (vote === -1) bScore += weight;
  }

  if (aScore > bScore) {
    const reasons = [...new Set(factors.filter((f) => f.vote === 1).map((f) => f.label))];
    return { winner: "A_BETTER", reasons };
  }
  if (bScore > aScore) {
    const reasons = [...new Set(factors.filter((f) => f.vote === -1).map((f) => f.label))];
    return { winner: "B_BETTER", reasons };
  }
  return { winner: "SIMILAR", reasons: ["similar"] };
}

/**
 * Compare two normalized daily forecast rows.
 * Fields: windMax, windGust (optional), rain, tmax — from normalizeDailyToScoreInput().
 */
export function getDailyComparisonWinner(dayA, dayB) {
  return buildResult([
    {
      vote: compareMetric(dayA?.windMax, dayB?.windMax, WIND_DIFF_THRESHOLD, false),
      weight: WIND_WEIGHT,
      label: "calmer",
    },
    {
      vote: compareMetric(dayA?.windGust, dayB?.windGust, WIND_DIFF_THRESHOLD, false),
      weight: GUST_WEIGHT,
      label: "calmer",
    },
    {
      vote: compareMetric(dayA?.rain, dayB?.rain, RAIN_DIFF_THRESHOLD, false),
      weight: RAIN_WEIGHT,
      label: "drier",
    },
    {
      vote: compareMetric(dayA?.tmax, dayB?.tmax, TEMP_DIFF_THRESHOLD, true),
      weight: TEMP_WEIGHT,
      label: "warmer",
    },
  ]);
}

/**
 * Compare two single-hour slices using raw Open-Meteo hourly field names:
 * windspeed_10m, windgusts_10m, precipitation, temperature_2m.
 */
export function getHourlyComparisonWinner(hourA, hourB) {
  return buildResult([
    {
      vote: compareMetric(hourA?.windspeed_10m, hourB?.windspeed_10m, WIND_DIFF_THRESHOLD, false),
      weight: WIND_WEIGHT,
      label: "calmer",
    },
    {
      vote: compareMetric(hourA?.windgusts_10m, hourB?.windgusts_10m, WIND_DIFF_THRESHOLD, false),
      weight: GUST_WEIGHT,
      label: "calmer",
    },
    {
      vote: compareMetric(hourA?.precipitation, hourB?.precipitation, RAIN_DIFF_THRESHOLD, false),
      weight: RAIN_WEIGHT,
      label: "drier",
    },
    {
      vote: compareMetric(hourA?.temperature_2m, hourB?.temperature_2m, TEMP_DIFF_THRESHOLD, true),
      weight: TEMP_WEIGHT,
      label: "warmer",
    },
  ]);
}

/**
 * Compare two arrays of normalized daily rows (output of normalizeDailyToScoreInput).
 * Pairs rows by array index. Returns one result per shared day.
 */
export function compareCampsiteForecasts(forecastA, forecastB) {
  const a = Array.isArray(forecastA) ? forecastA : [];
  const b = Array.isArray(forecastB) ? forecastB : [];

  const len = Math.min(a.length, b.length);
  const results = [];
  for (let i = 0; i < len; i++) {
    results.push({
      date: a[i]?.date ?? null,
      ...getDailyComparisonWinner(a[i], b[i]),
    });
  }
  return results;
}
