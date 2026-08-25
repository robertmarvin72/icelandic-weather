// src/lib/auroraScoring.js
//
// Northern Lights Score v0.1 — Ticket 2 (issue #390).
//
// One pure, deterministic canonical Aurora-visibility scoring function for a
// single location and night. Same input -> always the same output. This
// module has NO knowledge of tier/entitlement/user identity — the public
// function's input contract contains no such argument, by design (see
// scoreAuroraVisibility below and the "Scoring-rock" requirement recorded in
// the Northern Lights epic audit: one canonical score, Free/Pro differ only
// in presentation, never in inputs or math).
//
// Deliberately isolated from src/lib/scoring.js (campsite weather scoring) —
// no shared state, no shared constants, no coupling. Only the general code
// style (plain named exports, small pure helpers, documented threshold
// tables) is intentionally consistent with that file.
//
// ─────────────────────────────────────────────────────────────────────────
// IMPORTANT LIMITATION — read before using this module downstream:
//
// The Vedur.is aurora feed (see api/_lib/aurora/parseAurora.js) has NO
// location metadata. `night.sun.*` (sunset/darknessStart/dawn/sunrise) and
// `night.moon.rise`/`night.moon.set` are a single NATIONAL reference time
// set (very likely Reykjavík-referenced; not confirmed by the feed itself),
// not location-specific astronomical calculations. This module uses those
// values as-is and does not attempt to correct them for the caller's actual
// location. Every scored/flagged output that used sun/moon reconstructed
// times carries the `national_reference_times` flag as a standing,
// machine-readable reminder of this — callers/UI must not present the
// result as location-precise astronomy.
// ─────────────────────────────────────────────────────────────────────────

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// ── Provisional v0.1 constants — product-model choices, not scientific
// precision. Isolated here so they're easy to find and revise later. ──────

// auroraActivity is treated as an unbounded-but-typically-small non-negative
// integer (the feed declares no explicit scale/units — see Ticket 1 audit,
// this module never calls it "kp"). Values are clamped into this range for
// scoring purposes only; the raw value is still surfaced in reasons/flags
// data where useful.
const ACTIVITY_SCALE_MIN = 0;
const ACTIVITY_SCALE_MAX = 9;

// Score = activityComponent + cloudComponent (each an independent, bounded
// contribution), then secondary modifiers/caps are applied on top. The two
// weights sum to SCORE_MAX so a perfect night (max activity, 0% cloud) hits
// exactly 100. Cloud is weighted slightly above activity because relevant
// local cloud cover is the principal *local* visibility signal (activity is
// a national-reference input — see module header), matching requirement 5.
const ACTIVITY_WEIGHT_POINTS = 45; // activityComponent max, at auroraActivity = ACTIVITY_SCALE_MAX
const CLOUD_WEIGHT_POINTS = 55; // cloudComponent max, at 0% relevant total cloud cover

const CLOUD_HARD_CAP_THRESHOLD = 90; // total cloud % at/above which the hard cap applies
const CLOUD_HARD_CAP_SCORE = 15; // score ceiling once the hard cap applies — "cannot overcome"

const LOW_ACTIVITY_THRESHOLD = 2; // auroraActivity at/below this can never reach the top band
const LOW_ACTIVITY_SCORE_CAP = 60; // ceiling applied in that case — below CLOUD_HARD_CAP's own
// natural output range and comfortably below the "excellent" band (81..100), so low activity can
// at most reach "fair", never "good" or "excellent", regardless of how clear the sky is.

const PRECIPITATION_MAX_ATTENUATION = 0.25; // precipitation's own extra reduction, capped so it
// never stacks a second full obstruction penalty on top of an already-heavy cloud penalty —
// see applyPrecipitationAttenuation()
const PRECIPITATION_MM_FOR_MAX_EFFECT = 3; // mm accumulated over the window for full attenuation effect

const HIGH_WIND_MS_THRESHOLD = 12; // m/s — comfort/safety flag only, never changes the score

const MOON_BRIGHT_WINDOW_DAYS = 5; // days from exact full moon (age ~14.75) that still count as
// "bright enough to matter" for the crude v0.1 illumination proxy
const MOON_PENALTY_POINTS = 8;

const SCORE_MIN = 0;
const SCORE_MAX = 100;

const BANDS = [
  { max: 20, id: "very-poor" },
  { max: 40, id: "poor" },
  { max: 60, id: "fair" },
  { max: 80, id: "good" },
  { max: 100, id: "excellent" },
];

// ── Time reconstruction (host-timezone-independent) ────────────────────────
//
// The feed only gives "HH:MM" strings tied to one `eveningDate`, but a full
// night genuinely crosses midnight (e.g. darkness starts ~22:00 on
// eveningDate, dawn is ~05:00 on eveningDate+1). Rule, applied uniformly to
// every sun/moon HH:MM field, never per-field special-cased: an hour before
// 12 belongs to eveningDate+1 (post-midnight), an hour at/after 12 belongs
// to eveningDate itself. This matches every field in the confirmed live
// feed sample (sunset 21:13, darkness 22:10 -> same day; dawn 04:52,
// sunrise 05:49 -> next day; moonrise 21:39 -> same day; moonset 00:41 ->
// next day) without needing per-field knowledge or scheduleType semantics.
// All arithmetic is done in UTC epoch milliseconds — no host Date-timezone
// methods (getHours() etc.) are ever used.
function reconstructTimestampMs(eveningDate, hhmm) {
  if (typeof eveningDate !== "string" || typeof hhmm !== "string") return null;

  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!timeMatch) return null;

  const baseMs = Date.parse(`${eveningDate}T00:00:00Z`);
  if (Number.isNaN(baseMs)) return null;

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const dayOffset = hour < 12 ? 1 : 0;

  return baseMs + dayOffset * MS_PER_DAY + hour * MS_PER_HOUR + minute * MS_PER_MINUTE;
}

// Darkness window = darknessStart..dawn (true astronomical darkness, not the
// broader sunset..sunrise civil range twilight already washes out most
// aurora visibility within).
function computeDarknessWindowMs(night) {
  const start = reconstructTimestampMs(night?.eveningDate, night?.sun?.darknessStart);
  const end = reconstructTimestampMs(night?.eveningDate, night?.sun?.dawn);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
}

// Moon-above-horizon window. Deliberately conservative: only applied when
// BOTH moonrise and moonset are present and reconstructible. This
// intentionally avoids interpreting scheduleType at all — a night where
// either field is empty (e.g. scheduleType=1, "moon does not set", whose
// real meaning between "always up" and "never up" this module does not
// attempt to resolve) simply gets no moon modifier, per "moon age alone has
// no effect when the moon is not visible" applied to the unprovable case.
function computeMoonWindowMs(night) {
  const rise = reconstructTimestampMs(night?.eveningDate, night?.moon?.rise);
  const set = reconstructTimestampMs(night?.eveningDate, night?.moon?.set);
  if (rise == null || set == null || set <= rise) return null;
  return { start: rise, end: set };
}

function intersectWindows(a, b) {
  if (!a || !b) return null;
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  if (end <= start) return null;
  return { start, end };
}

// ── Hourly row aggregation ──────────────────────────────────────────────

function parseRowTimeMs(row) {
  if (!row || typeof row.time !== "string") return null;
  const ms = Date.parse(row.time);
  return Number.isNaN(ms) ? null : ms;
}

// Never mutates the caller's array — copies before sorting, so callers
// passing the same rows in any order get identical results.
function rowsWithinWindow(hourlyRows, window) {
  if (!Array.isArray(hourlyRows) || !window) return [];

  return hourlyRows
    .map((row) => ({ row, ms: parseRowTimeMs(row) }))
    .filter((entry) => entry.ms != null && entry.ms >= window.start && entry.ms < window.end)
    .sort((a, b) => a.ms - b.ms)
    .map((entry) => entry.row);
}

function average(values) {
  const usable = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (usable.length === 0) return null;
  return usable.reduce((sum, v) => sum + v, 0) / usable.length;
}

function sum(values) {
  const usable = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (usable.length === 0) return null;
  return usable.reduce((s, v) => s + v, 0);
}

function max(values) {
  const usable = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (usable.length === 0) return null;
  return Math.max(...usable);
}

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

function bandForScore(score) {
  const found = BANDS.find((b) => score <= b.max);
  return (found ?? BANDS[BANDS.length - 1]).id;
}

// Applies precipitation as a bounded, secondary attenuation on top of
// whatever headroom remains after the cloud penalty — never a second full
// obstruction penalty stacked onto severe cloud. `remainingScore` is the
// score after the cloud penalty has already been applied; precipitation can
// only take away a further PRECIPITATION_MAX_ATTENUATION fraction of THAT
// remaining value, so on an already near-zero score it has almost nothing
// left to remove.
function applyPrecipitationAttenuation(remainingScore, totalPrecipitationMm) {
  if (totalPrecipitationMm == null) return remainingScore;
  const severity = clamp(totalPrecipitationMm / PRECIPITATION_MM_FOR_MAX_EFFECT, 0, 1);
  const attenuation = severity * PRECIPITATION_MAX_ATTENUATION;
  return remainingScore * (1 - attenuation);
}

function moonDistanceFromFullDays(ageDays) {
  // Synodic month ~29.5 days; full moon ~day 14.75. Distance wraps around
  // the cycle boundary (age 0 and age ~29.5 are both "new moon", adjacent).
  const synodicMonth = 29.5;
  const fullDay = 14.75;
  const raw = Math.abs(ageDays - fullDay);
  return Math.min(raw, Math.abs(raw - synodicMonth));
}

/**
 * Northern Lights Score v0.1 — canonical, deterministic, tier-independent.
 *
 * @param {object} input
 * @param {object} input.night - one normalized Ticket 1 Aurora night:
 *   { eveningDate, auroraActivity, sun: { sunset, darknessStart, dawn, sunrise },
 *     moon: { ageDays, rise, set, scheduleType } }
 * @param {Array<object>} input.hourlyRows - location-specific hourly rows,
 *   normalized by the CALLER (not raw Open-Meteo) into:
 *   { time: "2026-08-24T22:00:00Z" (ISO 8601, explicit UTC offset — never
 *     host-timezone-parsed), cloudTotal, cloudLow, cloudMid, cloudHigh,
 *     precipitation, windSpeed, visibility }
 *   Every field beyond `time` is independently nullable. `cloudLow/Mid/High`
 *   are supporting evidence only — never summed into an artificial total;
 *   `cloudTotal` is the canonical cloud signal. `visibility` is accepted
 *   defensively but is not a v0.1 scoring input (see module-level notes).
 * @param {object} input.viewingWindow - explicit range to intersect against
 *   darkness and observations: { start: ISO8601, end: ISO8601 }.
 * @returns {object} one of three structurally stable states — "scored",
 *   "insufficient_data", or "not_viewable_tonight" (see module tests for
 *   exact shapes).
 */
export function scoreAuroraVisibility({ night, hourlyRows, viewingWindow } = {}) {
  const activity = night?.auroraActivity;
  const hasValidActivity = typeof activity === "number" && Number.isFinite(activity);

  if (!hasValidActivity) {
    return {
      status: "insufficient_data",
      score: null,
      band: null,
      reasons: ["missing_activity"],
      flags: [],
    };
  }

  const darknessWindow = computeDarknessWindowMs(night);
  const requestedWindow = toWindowMs(viewingWindow);
  const effectiveWindow = intersectWindows(darknessWindow, requestedWindow);

  if (!effectiveWindow) {
    return {
      status: "not_viewable_tonight",
      score: null,
      band: null,
      reasons: ["no_darkness_overlap"],
      flags: [],
    };
  }

  const relevantRows = rowsWithinWindow(hourlyRows, effectiveWindow);

  if (relevantRows.length === 0) {
    return {
      status: "not_viewable_tonight",
      score: null,
      band: null,
      reasons: ["no_observation_data"],
      flags: [],
    };
  }

  const reasons = [];
  const flags = ["national_reference_times"];

  // ── Activity contribution — independent, bounded component ──
  const clampedActivity = clamp(activity, ACTIVITY_SCALE_MIN, ACTIVITY_SCALE_MAX);
  let score = (clampedActivity / ACTIVITY_SCALE_MAX) * ACTIVITY_WEIGHT_POINTS;
  reasons.push(clampedActivity <= LOW_ACTIVITY_THRESHOLD ? "low_activity" : "meaningful_activity");

  // ── Cloud (principal local signal) — independent, bounded component.
  // Missing cloud data deliberately adds nothing (neither the "clear" nor
  // the "overcast" extreme is assumed) rather than fabricating a default —
  // the score simply stays at the activity-only component in that case.
  const cloudTotalAvg = average(relevantRows.map((r) => r.cloudTotal));
  let cloudHardCapApplied = false;

  if (cloudTotalAvg == null) {
    flags.push("cloud_data_unavailable");
  } else {
    const cloudFraction = clamp(cloudTotalAvg / 100, 0, 1);
    score += (1 - cloudFraction) * CLOUD_WEIGHT_POINTS;
    reasons.push(cloudFraction < 0.3 ? "clear_sky" : cloudFraction < 0.7 ? "partial_cloud" : "heavy_cloud");

    if (cloudTotalAvg >= CLOUD_HARD_CAP_THRESHOLD) {
      cloudHardCapApplied = true;
    }
  }

  // ── Precipitation (secondary, bounded, never a second full penalty) ──
  const totalPrecipitation = sum(relevantRows.map((r) => r.precipitation));
  if (totalPrecipitation == null) {
    flags.push("precipitation_data_unavailable");
  } else {
    const before = score;
    score = applyPrecipitationAttenuation(score, totalPrecipitation);
    if (score < before) reasons.push("precipitation_reduced_visibility");
  }

  // ── Moon (secondary, only when concretely above horizon in the window) ──
  const moonWindow = computeMoonWindowMs(night);
  const moonOverlap = intersectWindows(moonWindow, effectiveWindow);
  if (moonOverlap) {
    const ageDays = night?.moon?.ageDays;
    if (typeof ageDays === "number" && Number.isFinite(ageDays)) {
      const distance = moonDistanceFromFullDays(ageDays);
      if (distance <= MOON_BRIGHT_WINDOW_DAYS) {
        score -= MOON_PENALTY_POINTS;
        reasons.push("moonlight_reduced_visibility");
        flags.push("moon_illuminated");
      }
    }
  }

  // ── Wind: comfort/safety flag only. Deliberately never reassigns `score` —
  // wind must never change the numeric result, only add a stable flag.
  const maxWind = max(relevantRows.map((r) => r.windSpeed));
  if (maxWind != null && maxWind >= HIGH_WIND_MS_THRESHOLD) {
    flags.push("high_wind");
  }

  // ── Clamp, hard caps, round ──
  score = clamp(score, SCORE_MIN, SCORE_MAX);

  if (cloudHardCapApplied) {
    score = Math.min(score, CLOUD_HARD_CAP_SCORE);
    reasons.push("cloud_hard_cap_applied");
  }

  if (clampedActivity <= LOW_ACTIVITY_THRESHOLD) {
    score = Math.min(score, LOW_ACTIVITY_SCORE_CAP);
  }

  score = Math.round(clamp(score, SCORE_MIN, SCORE_MAX));

  return {
    status: "scored",
    score,
    band: bandForScore(score),
    reasons,
    flags,
  };
}

function toWindowMs(window) {
  if (!window || typeof window.start !== "string" || typeof window.end !== "string") return null;
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return { start, end };
}
