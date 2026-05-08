// src/lib/weatherFinderRanking.js
//
// Standalone ranking module for the Weather Finder feature.
// All functions are pure — no side effects, no API calls, no UI imports.
//
// Forecast field names match normalizeDailyToScoreInput output:
//   windMax   — daily max wind speed (m/s)
//   windGust  — daily max gust speed (m/s)
//   rain      — daily precipitation total (mm)
//   tmax      — daily max temperature (°C)
//   hasHazard — optional boolean; treated as false when absent

function toNum(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function hasForecast(site) {
  return Array.isArray(site?.forecast) && site.forecast.length > 0;
}

function withinDistance(site, maxDistanceKm) {
  if (maxDistanceKm == null) return true;
  return toNum(site.distanceKm, Infinity) <= maxDistanceKm;
}

function filterSites(campsites, options) {
  return (Array.isArray(campsites) ? campsites : []).filter(
    (site) => hasForecast(site) && withinDistance(site, options.maxDistanceKm ?? null)
  );
}

function sliceForecast(forecast, days) {
  const n = Number.isInteger(days) && days > 0 ? days : forecast.length;
  return forecast.slice(0, n);
}

function computeMetrics(forecast, days) {
  const slice = sliceForecast(forecast, days);
  if (!slice.length) return null;

  let windSum = 0;
  let gustSum = 0;
  let tempSum = 0;
  let precipTotal = 0;
  let rainDays = 0;
  let hazardDays = 0;

  for (const day of slice) {
    windSum += toNum(day.windMax);
    gustSum += toNum(day.windGust);
    tempSum += toNum(day.tmax);
    const precip = toNum(day.rain);
    precipTotal += precip;
    if (precip >= 1) rainDays += 1;
    if (day.hasHazard === true) hazardDays += 1;
  }

  const n = slice.length;
  return {
    avgWind: windSum / n,
    avgGust: gustSum / n,
    avgTemp: tempSum / n,
    precipTotal,
    rainDays,
    hazardDays,
  };
}

function buildResult(site, score, metrics) {
  return {
    id: site.id,
    name: site.name,
    distanceKm: site.distanceKm,
    score,
    metrics,
  };
}

// Lower score = calmer conditions.
// score = avgWind * 0.7 + avgGust * 0.2 + hazardDays * 0.1
export function rankCalmest(campsites, options = {}) {
  const results = [];
  for (const site of filterSites(campsites, options)) {
    const m = computeMetrics(site.forecast, options.days);
    if (!m) continue;
    const score = m.avgWind * 0.7 + m.avgGust * 0.2 + m.hazardDays * 0.1;
    results.push(buildResult(site, score, m));
  }
  return results.sort((a, b) => a.score - b.score);
}

// Higher score = warmer conditions.
// score = avgTemp * 0.7 - precipDays * 0.2 - avgWind * 0.1
export function rankWarmest(campsites, options = {}) {
  const results = [];
  for (const site of filterSites(campsites, options)) {
    const m = computeMetrics(site.forecast, options.days);
    if (!m) continue;
    const score = m.avgTemp * 0.7 - m.rainDays * 0.2 - m.avgWind * 0.1;
    results.push(buildResult(site, score, m));
  }
  return results.sort((a, b) => b.score - a.score);
}

// Lower score = drier conditions.
// score = precipTotal * 0.6 + rainDays * 0.3 + avgWind * 0.1
export function rankDriest(campsites, options = {}) {
  const results = [];
  for (const site of filterSites(campsites, options)) {
    const m = computeMetrics(site.forecast, options.days);
    if (!m) continue;
    const score = m.precipTotal * 0.6 + m.rainDays * 0.3 + m.avgWind * 0.1;
    results.push(buildResult(site, score, m));
  }
  return results.sort((a, b) => a.score - b.score);
}
