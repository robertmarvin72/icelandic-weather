// src/lib/scoring.js

// ── Season helpers ---------------------------------------------------------

export function getSeasonForDate(date) {
  // Winter = Oct–Apr, Summer = May–Sep
  // If date is missing/invalid => default to summer (keeps old behavior)
  if (!date) return "summer";

  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return "summer";

  const m = dt.getMonth() + 1; // 1–12
  return m >= 10 || m <= 4 ? "winter" : "summer";
}

function getSeasonConfig(season) {
  if (season === "winter") {
    return {
      tempWeight: 0.35,
      windWeight: 1.0,
      rainWeight: 1.0,
      baseFloor: 4,
    };
  }
  return {
    tempWeight: 1,
    windWeight: 1,
    rainWeight: 1,
    baseFloor: 0,
  };
}

// ── Scoring model ----------------------------------------------------------

export function basePointsFromTemp(tmax) {
  const t = tmax ?? -999;
  if (t > 14) return 10;
  if (t >= 12) return 8;
  if (t >= 8) return 5;
  if (t >= 6) return 2;
  return 0;
}

export function windPenaltyPoints(w) {
  const v = w ?? 0;
  if (v <= 5) return 0;
  if (v <= 10) return 2;
  if (v <= 15) return 5;
  return 10;
}

export function rainPenaltyPoints(mm) {
  const r = mm ?? 0;
  if (r < 1) return 0;
  if (r < 4) return 2;
  return 5; // >=4mm
}

// NEW: gust penalty based on “gustiness” = gust - windMax
export function gustPenaltyPoints(gust, windMax, season = "summer") {
  const g = typeof gust === "number" ? gust : null;
  const w = typeof windMax === "number" ? windMax : null;
  if (g == null || w == null) return 0;

  const diff = g - w;
  if (!Number.isFinite(diff) || diff <= 0) return 0;

  // Contract per tests:
  // - diff < 2.9 => 0
  // - diff >= 2.9 => start penalizing
  if (diff < 2.9) return 0;

  // Base penalty (summer scale)
  // 2.9..5.9 => 1
  // 6..9.9  => 2
  // >=10    => 3
  let base;
  if (diff < 6) base = 1;
  else if (diff < 10) base = 2;
  else base = 3;

  // Winter is harsher: weight ~1.6, round, cap at 5
  if (season === "winter") {
    const weighted = Math.round(base * 1.6);
    return Math.min(5, weighted);
  }

  return base;
}

// ── Rain streak (v1) -------------------------------------------------------

export function isWetDay(rainMm, wetThresholdMm = 3) {
  const r = rainMm ?? 0;
  return r >= wetThresholdMm;
}

export function rainStreakPenaltyPoints(streakLen) {
  if (streakLen <= 1) return 0;
  if (streakLen === 2) return 1;
  if (streakLen === 3) return 2;
  if (streakLen === 4) return 3;
  return 4; // 5+ cap
}

/**
 * Scores an array of days using scoreSiteDay(), then applies rain streak penalty.
 * Intended for Route Planner; does not affect existing Top5/Forecast unless used there.
 *
 * @param {Array<{tmax,rain,windMax,windGust,date}>} days
 * @param {{ wetThresholdMm?: number }} opts
 */
export function scoreDaysWithRainStreak(days, opts = {}) {
  const wetThresholdMm = typeof opts.wetThresholdMm === "number" ? opts.wetThresholdMm : 3;

  const scored = (days || []).map((d) => ({
    ...d,
    ...scoreSiteDay(d),
  }));

  let streak = 0;

  return scored.map((row) => {
    const wet = isWetDay(row.rain, wetThresholdMm);
    streak = wet ? streak + 1 : 0;

    const rainStreak = streak;
    const rainStreakPen = rainStreakPenaltyPoints(rainStreak);

    const pointsRaw = typeof row.points === "number" ? row.points : 0;
    const points = Math.max(0, Math.min(10, pointsRaw - rainStreakPen));
    const finalClass = pointsToClass(points);

    // ✅ Keep scoring contract consistent after streak penalty
    const components = {
      ...(row.components || {}),
      rainStreak: -rainStreakPen,
    };

    return {
      ...row,
      wetDay: wet,
      rainStreak,
      rainStreakPen,

      // legacy
      points,
      finalClass,

      // canonical
      total: points,
      components,
    };
  });
}

export function pointsToClass(p) {
  if (p >= 9) return "Best";
  if (p >= 7) return "Good";
  if (p >= 4) return "Ok";
  if (p >= 1) return "Fair";
  return "Bad";
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function normalizeShelter(shelter) {
  if (typeof shelter !== "number" || !Number.isFinite(shelter)) return 0;
  // assume 0..10
  return clamp(shelter / 10, 0, 1);
}

function windSeverity01(windMax, windGust) {
  const w = typeof windMax === "number" && Number.isFinite(windMax) ? windMax : 0;
  const g = typeof windGust === "number" && Number.isFinite(windGust) ? windGust : null;

  // main wind severity: 0 at 4 m/s, 1 at 18 m/s
  const wind01 = clamp((w - 4) / (18 - 4), 0, 1);

  // gustiness severity: bonus severity if gusts spike above mean wind
  const gustiness = g == null ? 0 : Math.max(0, g - w);
  // 0 at 0, 1 at 12 m/s gustiness
  const gust01 = clamp(gustiness / 12, 0, 1);

  // blend: mostly wind, some gustiness
  return clamp(wind01 * 0.75 + gust01 * 0.25, 0, 1);
}

function computeShelterBonus({ shelter, windMax, windGust, season }) {
  const s01 = normalizeShelter(shelter);
  const sev01 = windSeverity01(windMax, windGust);

  // max bonus depends slightly on season (winter harsher -> a bit more value from shelter)
  const maxBonus = season === "winter" ? 3 : 2;

  // small non-linear curve so mid shelter doesn’t overperform
  const shelterCurve = Math.pow(s01, 1.2);

  return Math.round(shelterCurve * sev01 * maxBonus);
}

export function scoreSiteDay({ tmax, rain, windMax, windGust, date, shelter }) {
  const season = getSeasonForDate(date);
  const cfg = getSeasonConfig(season);

  const baseRaw = basePointsFromTemp(tmax);

  // Keep deterministic ints, but allow winter floor for "nice winter conditions"
  const baseScaled = Math.round(baseRaw * cfg.tempWeight);
  const basePts = Math.max(cfg.baseFloor, Math.min(10, Math.max(0, baseScaled)));

  const windPenRaw = windPenaltyPoints(windMax);
  const rainPenRaw = rainPenaltyPoints(rain);
  const gustPenRaw = gustPenaltyPoints(windGust, windMax, season);

  const windPen = Math.round(windPenRaw * cfg.windWeight);
  const rainPen = Math.round(rainPenRaw * cfg.rainWeight);
  const gustPen = gustPenRaw; // already weighted in function

  // NOTE: shelter + rainStreak are part of the contract but are applied elsewhere for now.
  // They are kept here so Route Planner + Leaderboard can share a single "score shape".
  const shelterBonus = computeShelterBonus({ shelter, windMax, windGust, season });
  const rainStreakPen = 0;

  const points = Math.max(
    0,
    Math.min(10, basePts - windPen - rainPen - gustPen - rainStreakPen + shelterBonus)
  );
  const finalClass = pointsToClass(points);

  return {
    // canonical
    total: points,
    components: {
      temp: basePts,
      wind: -windPen,
      rain: -rainPen,
      gust: -gustPen,
      rainStreak: -rainStreakPen,
      shelter: shelterBonus,
    },
    flags: {},

    // legacy / debug fields (kept so existing UI doesn't break)
    basePts,
    windPen,
    rainPen,
    gustPen,
    points,
    finalClass,
    season,
    tempWeight: cfg.tempWeight,
  };
}

// Legacy alias (backward compatible). Prefer scoreSiteDay() for new work.
export function scoreDay({ tmax, rain, windMax, windGust, date }) {
  // Backward-compatible wrapper. Prefer scoreSiteDay() for new work.
  return scoreSiteDay({ tmax, rain, windMax, windGust, date });
}

// ── Units (display only; underlying stays metric) --------------------------

export const TEMP_UNIT_LABEL = { metric: "°C", imperial: "°F" };
export const RAIN_UNIT_LABEL = { metric: "mm", imperial: "in" };
export const WIND_UNIT_LABEL = { metric: "m/s", imperial: "kn" };
export const DIST_UNIT_LABEL = { metric: "km", imperial: "mi" };

export function convertTemp(value, units) {
  if (value == null) return null;
  return units === "imperial" ? (value * 9) / 5 + 32 : value;
}

export function convertRain(value, units) {
  if (value == null) return null;
  return units === "imperial" ? value / 25.4 : value;
}

export function convertWind(value, units) {
  if (value == null) return null;
  return units === "imperial" ? value * 1.94384 : value;
}

export function convertDistanceKm(valueKm, units) {
  if (valueKm == null) return null;
  return units === "imperial" ? valueKm * 0.621371 : valueKm;
}

export function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return Number(value).toFixed(digits);
}
