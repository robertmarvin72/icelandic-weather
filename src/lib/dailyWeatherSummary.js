// src/lib/dailyWeatherSummary.js
//
// Ticket 400 (#400) — pure daily-condition summarizer. Produces a single
// PRESENTATION-ONLY WMO weather code (`summaryCode`) describing the main
// daytime period of a given date, from that date's own hourly forecast.
//
// This exists because the daily forecast's headline weather label/icon
// previously came straight from Open-Meteo's own `daily.weathercode[i]`,
// which is a single provider-chosen code for the whole 24h day and can
// visibly contradict the hourly forecast for the same date/site (issue
// #400: "Clear sky 00:00-18:00, Overcast 21:00" showed as "Overcast" for
// the whole day). This module never reads or writes anything scoring
// touches — see src/hooks/useForecast.js for the integration boundary,
// which calls scoreSiteDay(row) BEFORE summaryCode is ever computed, and
// src/lib/forecastNormalize.js's own `row.code`, which stays untouched
// Open-Meteo daily.weathercode.

import { WEATHER_FAMILIES, WEATHER_FAMILY_CODES, isSupportedWeatherCode, getWeatherCodeFamily } from "./weatherPresentation";

const PRIMARY_WINDOW_START_HOUR = 6; // inclusive
const PRIMARY_WINDOW_END_HOUR = 22; // exclusive
const PRIMARY_WINDOW_MIDPOINT_HOUR = 14;

// Fixed, input-order-independent final tie-break when two+ families have
// the same observation count AND the same closest-to-midpoint distance.
// Arbitrary but stable — never derived from array/object-key order of the
// hourly payload itself.
const FAMILY_PRIORITY_ORDER = [
  WEATHER_FAMILIES.CLEAR,
  WEATHER_FAMILIES.PARTLY_CLOUDY,
  WEATHER_FAMILIES.OVERCAST,
  WEATHER_FAMILIES.FOG,
  WEATHER_FAMILIES.DRIZZLE,
  WEATHER_FAMILIES.FREEZING_PRECIP,
  WEATHER_FAMILIES.RAIN,
  WEATHER_FAMILIES.SNOW,
  WEATHER_FAMILIES.THUNDER_HAIL,
];

// Precedence when multiple significant-weather families qualify for an
// override simultaneously (approved prompt §3, Round 1: "thunder/hail,
// freezing precipitation, snow, rain/showers, drizzle").
const OVERRIDE_PRECEDENCE = [
  WEATHER_FAMILIES.THUNDER_HAIL,
  WEATHER_FAMILIES.FREEZING_PRECIP,
  WEATHER_FAMILIES.SNOW,
  WEATHER_FAMILIES.RAIN,
  WEATHER_FAMILIES.DRIZZLE,
];

// Families that are significant on a single primary-window observation,
// regardless of amount (thunder/hail, all freezing precipitation, all
// snow — approved prompt §3: "even when brief").
const ALWAYS_SIGNIFICANT_FAMILIES = new Set([
  WEATHER_FAMILIES.THUNDER_HAIL,
  WEATHER_FAMILIES.FREEZING_PRECIP,
  WEATHER_FAMILIES.SNOW,
]);

// Within DRIZZLE/RAIN, these specific codes ("heavy"/"violent"/"dense" in
// Open-Meteo's own WMO documentation) are significant on a single
// observation too; everything else in those two families needs the
// two-observation + 1.0mm evidence rule below.
const HEAVY_TIER_CODES = new Set([55, 65, 82]);

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

// Parses `hourly` into valid, date-matched, interpretable observations.
// A malformed timestamp, a non-finite code, or an unsupported WMO code is
// excluded entirely — it contributes no family vote and does not count as
// a "usable" observation (approved prompt §3: "Ignore malformed timestamps
// and non-finite/unsupported codes safely").
function parseValidObservations(hourly, date) {
  if (!hourly?.time || !Array.isArray(hourly.time)) return [];
  if (typeof date !== "string" || date.length === 0) return [];

  const times = hourly.time;
  const codes = Array.isArray(hourly.weathercode)
    ? hourly.weathercode
    : Array.isArray(hourly.weather_code)
      ? hourly.weather_code
      : null;
  const precipArr = Array.isArray(hourly.precipitation) ? hourly.precipitation : null;

  const out = [];

  for (let i = 0; i < times.length; i++) {
    const ts = times[i];
    if (typeof ts !== "string" || ts.length < 13 || !ts.startsWith(date)) continue;

    const hour = Number(ts.slice(11, 13));
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue;

    const rawCode = codes ? codes[i] : null;
    // Number(null) === 0 (WMO clear sky) — a missing per-hour code must
    // never be coerced into a real observation (Revision 2, #400).
    if (rawCode == null) continue;
    const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
    if (!isSupportedWeatherCode(code)) continue;

    const rawPrecip = precipArr ? precipArr[i] : null;
    const precipMm = isFiniteNumber(rawPrecip) ? rawPrecip : null;

    out.push({ hour, code, precipMm });
  }

  return out;
}

// Highest-intensity code from `family` actually present in `obs` — see
// weatherPresentation.js's WEATHER_FAMILY_CODES for why ascending array
// order already represents ascending intensity. Ties on the exact same
// code at different hours return that same code regardless of row order,
// so no separate midpoint tie-break is needed for this step.
function representativeCodeForFamily(family, obs) {
  const observedCodes = new Set(obs.map((o) => o.code));
  const orderedCodes = WEATHER_FAMILY_CODES[family] || [];
  for (let i = orderedCodes.length - 1; i >= 0; i--) {
    if (observedCodes.has(orderedCodes[i])) return orderedCodes[i];
  }
  return null;
}

function pickDominantFamily(windowObs) {
  const counts = new Map();
  const closestMidpointDistance = new Map();

  for (const o of windowObs) {
    const family = getWeatherCodeFamily(o.code);
    counts.set(family, (counts.get(family) || 0) + 1);

    const dist = Math.abs(o.hour - PRIMARY_WINDOW_MIDPOINT_HOUR);
    if (!closestMidpointDistance.has(family) || dist < closestMidpointDistance.get(family)) {
      closestMidpointDistance.set(family, dist);
    }
  }

  const maxCount = Math.max(...counts.values());
  let candidates = [...counts.keys()].filter((f) => counts.get(f) === maxCount);
  if (candidates.length === 1) return candidates[0];

  const minDist = Math.min(...candidates.map((f) => closestMidpointDistance.get(f)));
  candidates = candidates.filter((f) => closestMidpointDistance.get(f) === minDist);
  if (candidates.length === 1) return candidates[0];

  return FAMILY_PRIORITY_ORDER.find((f) => candidates.includes(f)) ?? candidates[0];
}

// Amounts are considered available for the 1.0mm threshold only when EVERY
// qualifying observation has a finite precip value — if even one is
// missing, treat amounts as unavailable for this check rather than
// assuming 0 for it (approved prompt §3: "missing amount data must not be
// treated as zero"), and fall back to the two-observation code-count rule
// alone.
function evaluateLightModerateFamily(obsInFamily) {
  if (obsInFamily.length < 2) return false;

  const allHaveAmounts = obsInFamily.every((o) => isFiniteNumber(o.precipMm));
  if (!allHaveAmounts) return true; // code-count evidence alone qualifies

  const total = obsInFamily.reduce((sum, o) => sum + o.precipMm, 0);
  return total >= 1.0;
}

function evaluateOverrideFamily(windowObs) {
  for (const family of OVERRIDE_PRECEDENCE) {
    const obsInFamily = windowObs.filter((o) => getWeatherCodeFamily(o.code) === family);
    if (obsInFamily.length === 0) continue;

    if (ALWAYS_SIGNIFICANT_FAMILIES.has(family)) return family;

    // DRIZZLE / RAIN: a single heavy-tier observation is significant on
    // its own; otherwise need >=2 same-family observations (+ amount
    // evidence when available).
    const hasHeavyTier = obsInFamily.some((o) => HEAVY_TIER_CODES.has(o.code));
    if (hasHeavyTier) return family;

    if (evaluateLightModerateFamily(obsInFamily)) return family;
  }

  return null;
}

function validateFallback(fallbackCode) {
  // Number(null) === 0 and Number(undefined) === NaN would otherwise let a
  // genuinely missing fallback silently coerce to WMO 0 (clear sky) or slip
  // through — both explicitly forbidden (approved prompt §3).
  if (fallbackCode == null) return null;
  const n = typeof fallbackCode === "number" ? fallbackCode : Number(fallbackCode);
  return Number.isFinite(n) ? n : null;
}

/**
 * summarizeDailyWeatherCode({ hourly, date, fallbackCode }) -> WMO code | null
 *
 * Pure, presentation-only. Never mutates its inputs. The returned code is
 * meant only for src/lib/weatherPresentation.js's resolver / display — it
 * must never be passed to scoreSiteDay or any scoring/recommendation path.
 */
export function summarizeDailyWeatherCode({ hourly, date, fallbackCode = null } = {}) {
  const allValidObs = parseValidObservations(hourly, date);
  if (allValidObs.length === 0) return validateFallback(fallbackCode);

  const primaryWindowObs = allValidObs.filter(
    (o) => o.hour >= PRIMARY_WINDOW_START_HOUR && o.hour < PRIMARY_WINDOW_END_HOUR
  );
  const windowObs = primaryWindowObs.length > 0 ? primaryWindowObs : allValidObs;

  const overrideFamily = evaluateOverrideFamily(windowObs);
  const winningFamily = overrideFamily ?? pickDominantFamily(windowObs);

  return representativeCodeForFamily(winningFamily, windowObs);
}
