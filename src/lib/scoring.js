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

export function pointsToClass(p) {
  if (p >= 9) return "Best";
  if (p >= 7) return "Good";
  if (p >= 4) return "Ok";
  if (p >= 1) return "Fair";
  return "Bad";
}

export function scoreDay({ tmax, rain, windMax, windGust, date }) {
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

  const points = Math.max(0, Math.min(10, basePts - windPen - rainPen - gustPen));
  const finalClass = pointsToClass(points);

  return {
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