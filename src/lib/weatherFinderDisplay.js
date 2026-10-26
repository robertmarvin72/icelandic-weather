// src/lib/weatherFinderDisplay.js
//
// Ticket #444 — presentation-only completeness metadata for Weather
// Finder's "warmest" metric. This does NOT compute a replacement mean: a
// complete window still displays the existing engine metrics.avgTemp
// (weatherFinderRanking.js's computeMetrics, unchanged). This only answers
// "is the window this value is drawn from actually complete and finite?"
// so the card can show "Insufficient data" instead of a 0-coerced number.
//
// Mirrors weatherFinderRanking.js's sliceForecast integer-days rule for
// what counts as a valid selected window — but where the engine falls back
// to the whole forecast array for an invalid/missing `days`, this
// deliberately fails closed to "incomplete, no stated period" instead:
// without a trustworthy explicit day count, there is no period we can
// honestly state in the UI.

function isValidTmax(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * getTmaxWindowCompleteness(forecastRows, days)
 * -> { complete: boolean, windowLength: number|null }
 *
 * `forecastRows` is the same per-site forecast array passed into
 * rankWarmest (site.forecast / scoresById[id].rows) — never mutated here.
 * `windowLength` is the valid positive-integer day count actually checked,
 * or `null` when `days` itself isn't a valid positive integer (deliberately
 * conservative — never invents a period for the UI to state).
 */
export function getTmaxWindowCompleteness(forecastRows, days) {
  const windowLength = Number.isInteger(days) && days > 0 ? days : null;

  if (windowLength == null) {
    return { complete: false, windowLength: null };
  }

  if (!Array.isArray(forecastRows) || forecastRows.length < windowLength) {
    return { complete: false, windowLength };
  }

  // Index-based, not .every() on a sliced array — a sparse/holey array's
  // `.every()` silently skips holes rather than visiting them, which would
  // let a missing row through undetected.
  for (let i = 0; i < windowLength; i++) {
    if (!isValidTmax(forecastRows[i]?.tmax)) {
      return { complete: false, windowLength };
    }
  }

  return { complete: true, windowLength };
}
