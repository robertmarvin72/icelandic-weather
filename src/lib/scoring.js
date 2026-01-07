// src/lib/scoring.js

// ── Scoring model
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

export function pointsToClass(p) {
  if (p >= 9) return "Best";
  if (p >= 7) return "Good";
  if (p >= 4) return "Ok";
  if (p >= 1) return "Fair";
  return "Bad";
}

export function scoreDay({ tmax, rain, windMax }) {
  const basePts = basePointsFromTemp(tmax);
  const windPen = windPenaltyPoints(windMax);
  const rainPen = rainPenaltyPoints(rain);
  const points = Math.max(0, Math.min(10, basePts - windPen - rainPen));
  const finalClass = pointsToClass(points);
  return { basePts, windPen, rainPen, points, finalClass };
}

// ── Units (display only; underlying stays metric)
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
