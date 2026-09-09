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
//
// Ticket 402 (#402) — added a temporal layer on top of the Ticket 400
// override/dominance pipeline below (both unchanged). A single significant
// precipitation observation could still "win" the whole day's headline even
// when the rest of the usable window was clearly dry (issue #402: heavy
// drizzle at 06:00 followed by dry 09:00-21:00 rendered as bare "Heavy
// drizzle"). `summarizeDailyWeather()` now additionally recognizes three
// chronological shapes — wet-then-substantially-dry, substantially-dry-
// then-wet, and a brief wet episode surrounded by substantial dry — and
// returns an optional `textKey` alongside `code` describing the shape in
// words, while `code` itself still comes from the SAME existing
// override/dominance logic (scoped to just the wet run), so the icon and
// headline always describe the same underlying evidence. When no such
// shape is detected, behavior is 100% identical to Ticket 400/401 — see
// cc-report.md for a full trace proving every existing test fixture keeps
// its original result.
//
// Revision 2 (#402) — buildChronologicalRuns() below is continuity-aware:
// a run's span only counts genuinely contiguous, observed hours. Sparse or
// gapped same-classification data (e.g. dry readings at 09:00 and 21:00
// with nothing observed between them) can no longer be merged into one
// long run — see cc-report.md's Revision 2 section for the original
// fabricated-span defect and the fix.
//
// Revision 3 (#402) — normalizeObservationsByHour() below resolves same-
// hour duplicates before any run is built, so the result no longer depends
// on which of two same-hour observations happened to appear first in the
// source array. A same-hour wet/dry conflict now disables the temporal
// layer for the whole day rather than letting array order silently pick a
// winner — see cc-report.md's Revision 3 section.

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

// Ticket 402 (#402) temporal-narrative constants — recommended thresholds
// from the approved prompt §2, documented here and in cc-report.md.
const MIN_SUBSTANTIAL_DRY_SPAN_HOURS = 6; // "at least six covered hours"
const MAX_BRIEF_EPISODE_SPAN_HOURS = 3;

const WET_FAMILIES = new Set([
  WEATHER_FAMILIES.DRIZZLE,
  WEATHER_FAMILIES.FREEZING_PRECIP,
  WEATHER_FAMILIES.RAIN,
  WEATHER_FAMILIES.SNOW,
  WEATHER_FAMILIES.THUNDER_HAIL,
]);

// Thunder/hail, freezing precipitation, and snow are safety-significant
// (approved prompt §2: "Do not hide a sustained or meaningful episode
// behind a generic dry narrative"). Any hazard-family observation anywhere
// in the window disables the temporal layer entirely for that day — the
// unchanged override/dominance pipeline below already surfaces these
// truthfully and unconditionally, exactly as Ticket 400/401 established.
const HAZARD_FAMILIES = new Set([
  WEATHER_FAMILIES.FREEZING_PRECIP,
  WEATHER_FAMILIES.SNOW,
  WEATHER_FAMILIES.THUNDER_HAIL,
]);

const TEMPORAL_TEXT_KEYS = {
  rainEarlyDryLater: "dailySummaryRainEarlyDryLater",
  dryEarlyRainLater: "dailySummaryDryEarlyRainLater",
  briefShowers: "dailySummaryBriefShowers",
};

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

function wetDryClassification(code) {
  return WET_FAMILIES.has(getWeatherCodeFamily(code)) ? "wet" : "dry";
}

// Revision 3 (#402) — resolves same-hour duplicates into at most one
// observation per hour, independent of source array order, BEFORE any run
// construction happens. This is what makes duplicate-hour handling
// genuinely order-independent: Revision 2 sorted by hour and relied on
// JavaScript's stable sort to decide which of two same-hour observations
// was "first," so reversing them in the source array could change the
// result. Grouping by hour first removes "which one came first" from the
// decision entirely — the same group produces the same outcome regardless
// of how its members were ordered in the input.
//
// - A group with both wet and dry codes at the same hour is genuinely
//   ambiguous: neither observation is allowed to win by array order, and
//   the hour must not be interpolated around either. `hasAmbiguousHour`
//   signals the caller to disable the temporal layer for the whole day —
//   the unchanged override/dominance fallback still runs on the raw
//   (non-normalized) window, exactly as it always has.
// - A group that agrees on wet-vs-dry collapses to one observation: one
//   hour of duration, one chronological data point for significance (a
//   duplicated light-rain reading must not count as two observations
//   toward the two-observation significance threshold).
function normalizeObservationsByHour(obs) {
  const byHour = new Map();
  for (const o of obs) {
    if (!byHour.has(o.hour)) byHour.set(o.hour, []);
    byHour.get(o.hour).push(o);
  }

  const normalized = [];
  let hasAmbiguousHour = false;

  for (const group of byHour.values()) {
    if (group.length === 1) {
      normalized.push(group[0]);
      continue;
    }

    const classifications = new Set(group.map((o) => wetDryClassification(o.code)));
    if (classifications.size > 1) {
      hasAmbiguousHour = true;
      continue;
    }

    normalized.push(collapseSameHourDuplicates(group));
  }

  normalized.sort((a, b) => a.hour - b.hour);
  return { normalized, hasAmbiguousHour };
}

// Deterministically reduces same-classification duplicates at one hour to
// a single observation, reusing the family-precedence/intensity semantics
// already established elsewhere in this module (no new WMO mapping):
// FAMILY_PRIORITY_ORDER's existing ordering picks the more significant
// family present (later entries are more severe), then
// representativeCodeForFamily picks that family's highest-intensity
// observed code. The amount uses a conservative finite-amount rule: the
// larger of any finite readings, so a duplicate can never silently
// understate precipitation evidence; if none are finite, the amount stays
// unavailable (never assumed to be zero).
function collapseSameHourDuplicates(group) {
  let winningFamily = null;
  for (const family of FAMILY_PRIORITY_ORDER) {
    if (group.some((o) => getWeatherCodeFamily(o.code) === family)) winningFamily = family;
  }

  const inWinningFamily = group.filter((o) => getWeatherCodeFamily(o.code) === winningFamily);
  const code = representativeCodeForFamily(winningFamily, inWinningFamily);

  const finiteAmounts = group.map((o) => o.precipMm).filter(isFiniteNumber);
  const precipMm = finiteAmounts.length > 0 ? Math.max(...finiteAmounts) : null;

  return { hour: group[0].hour, code, precipMm };
}

// Ticket 402 (#402), corrected by Revision 2 — chronological wet/dry runs
// within `obs`, which Revision 3's normalizeObservationsByHour() guarantees
// contains at most one observation per hour by the time it reaches here.
// Sorts by hour first, so a reordered INPUT array can never change the
// runs. Continuity-aware (approved-prompt-v2.md §1): an observation only
// extends the active run when it shares the run's classification AND
// lands on the very next hour after the run's current end — a missing
// intervening hour always breaks the run, even when the classification on
// both sides matches, so it can never count as covered duration.
// Production input is Open-Meteo's full-resolution hourly payload, so a
// plain one-hour-contiguity rule is sufficient; this deliberately does not
// derive continuity from HourlyForecastModal's three-hour sampling.
function buildChronologicalRuns(obs) {
  const sorted = [...obs].sort((a, b) => a.hour - b.hour);
  const runs = [];

  for (const o of sorted) {
    const classification = wetDryClassification(o.code);
    const last = runs[runs.length - 1];

    if (last && o.hour === last.endHour + 1 && classification === last.classification) {
      last.obs.push(o);
      last.endHour = o.hour;
      continue;
    }

    // Either the first observation, an unobserved gap (o.hour >
    // last.endHour + 1), or a genuine hour-to-hour classification change —
    // all three start a new run. A gap must break continuity even when the
    // classification matches on both sides of it.
    runs.push({ classification, startHour: o.hour, endHour: o.hour, obs: [o] });
  }

  return runs.map((r) => ({ ...r, span: r.endHour - r.startHour + 1 }));
}

// A wet run only counts as meaningful temporal-narrative evidence when it
// would already be significant under the existing override rules above
// (heavy-tier single observation, or 2+ light/moderate observations with
// qualifying evidence) — reusing evaluateOverrideFamily exactly, scoped to
// just this run's own observations. This is what keeps every pre-existing
// "an isolated trivial observation must not dominate" test byte-for-byte
// unchanged: a single light/non-qualifying blip was never meaningful
// evidence for the old override rule and is not meaningful evidence for a
// directional story either (approved prompt §2: "A transition phrase
// requires meaningful evidence on both sides").
function isMeaningfulWetRun(run) {
  return evaluateOverrideFamily(run.obs) != null;
}

function representativeCodeForRun(run) {
  const family = evaluateOverrideFamily(run.obs) ?? pickDominantFamily(run.obs);
  return representativeCodeForFamily(family, run.obs);
}

// Returns { textKey, wetRun } for one of the three recognized shapes, or
// null when none applies (including: any hazard-family observation present
// anywhere in the window, or any genuinely ambiguous same-hour wet/dry
// conflict (Revision 3) — in either case the temporal layer is disabled
// entirely and the caller falls through to the unchanged override/
// dominance pipeline below, which still evaluates the raw, non-normalized
// window exactly as it always has).
function detectTemporalPattern(windowObs) {
  if (windowObs.some((o) => HAZARD_FAMILIES.has(getWeatherCodeFamily(o.code)))) return null;

  const { normalized, hasAmbiguousHour } = normalizeObservationsByHour(windowObs);
  if (hasAmbiguousHour) return null;

  const runs = buildChronologicalRuns(normalized);

  if (runs.length === 2) {
    const [first, second] = runs;

    if (
      first.classification === "wet" &&
      second.classification === "dry" &&
      second.span >= MIN_SUBSTANTIAL_DRY_SPAN_HOURS &&
      isMeaningfulWetRun(first)
    ) {
      return { textKey: TEMPORAL_TEXT_KEYS.rainEarlyDryLater, wetRun: first };
    }

    if (
      first.classification === "dry" &&
      second.classification === "wet" &&
      first.span >= MIN_SUBSTANTIAL_DRY_SPAN_HOURS &&
      isMeaningfulWetRun(second)
    ) {
      return { textKey: TEMPORAL_TEXT_KEYS.dryEarlyRainLater, wetRun: second };
    }

    return null;
  }

  if (runs.length === 3) {
    const [first, middle, last] = runs;

    if (
      first.classification === "dry" &&
      middle.classification === "wet" &&
      last.classification === "dry" &&
      middle.span <= MAX_BRIEF_EPISODE_SPAN_HOURS &&
      first.span + last.span >= MIN_SUBSTANTIAL_DRY_SPAN_HOURS &&
      isMeaningfulWetRun(middle)
    ) {
      return { textKey: TEMPORAL_TEXT_KEYS.briefShowers, wetRun: middle };
    }

    return null;
  }

  // 1 run (uniformly wet or dry) or 4+ runs (genuinely intermittent, no
  // honest single directional story) both retain the existing conservative
  // fallback — approved prompt §2: "retain a neutral truthful existing/
  // fallback presentation rather than inventing a false story."
  return null;
}

/**
 * summarizeDailyWeather({ hourly, date, fallbackCode }) -> { code, textKey }
 *
 * Pure, presentation-only. Never mutates its inputs. `code` is meant only
 * for src/lib/weatherPresentation.js's resolver / display and must never be
 * passed to scoreSiteDay or any scoring/recommendation path. `textKey` is
 * an optional semantic translation key (see TEMPORAL_TEXT_KEYS) describing
 * a meaningful wet/dry transition or brief episode; null when no such
 * shape was detected, in which case `code` alone (the unchanged Ticket
 * 400/401 override/dominance result) is the complete presentation.
 */
export function summarizeDailyWeather({ hourly, date, fallbackCode = null } = {}) {
  const allValidObs = parseValidObservations(hourly, date);
  if (allValidObs.length === 0) return { code: validateFallback(fallbackCode), textKey: null };

  const primaryWindowObs = allValidObs.filter(
    (o) => o.hour >= PRIMARY_WINDOW_START_HOUR && o.hour < PRIMARY_WINDOW_END_HOUR
  );
  const windowObs = primaryWindowObs.length > 0 ? primaryWindowObs : allValidObs;

  const pattern = detectTemporalPattern(windowObs);
  if (pattern) {
    return { code: representativeCodeForRun(pattern.wetRun), textKey: pattern.textKey };
  }

  const overrideFamily = evaluateOverrideFamily(windowObs);
  const winningFamily = overrideFamily ?? pickDominantFamily(windowObs);

  return { code: representativeCodeForFamily(winningFamily, windowObs), textKey: null };
}

/**
 * summarizeDailyWeatherCode({ hourly, date, fallbackCode }) -> WMO code | null
 *
 * Backward-compatible wrapper around summarizeDailyWeather() for consumers
 * that only need the representative code (Ticket 400's original contract,
 * kept unchanged so existing/unrelated call sites and tests are unaffected).
 */
export function summarizeDailyWeatherCode(args) {
  return summarizeDailyWeather(args).code;
}
