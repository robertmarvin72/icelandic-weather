// src/lib/shelterUtils.js

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function clamp01(n) {
  return clamp(n, 0, 1);
}

function mean(nums) {
  const arr = (nums ?? []).filter((n) => Number.isFinite(n));
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Circular mean (degrees) for wind direction
export function circularMeanDeg(degs) {
  const arr = (degs ?? []).filter((d) => Number.isFinite(d));
  if (!arr.length) return null;

  let sinSum = 0;
  let cosSum = 0;

  for (const d of arr) {
    const r = (d * Math.PI) / 180;
    sinSum += Math.sin(r);
    cosSum += Math.cos(r);
  }

  const ang = Math.atan2(sinSum / arr.length, cosSum / arr.length);
  const deg = (ang * 180) / Math.PI;
  return (deg + 360) % 360;
}

// Circular "spread" (rough std dev) in degrees
export function circularStdDeg(degs) {
  const arr = (degs ?? []).filter((d) => Number.isFinite(d));
  if (!arr.length) return null;

  let sinSum = 0;
  let cosSum = 0;

  for (const d of arr) {
    const r = (d * Math.PI) / 180;
    sinSum += Math.sin(r);
    cosSum += Math.cos(r);
  }

  const n = arr.length;
  const R = Math.sqrt((sinSum / n) ** 2 + (cosSum / n) ** 2);

  // Guard: if R is 0, spread is maximal
  if (!Number.isFinite(R) || R <= 0) return 180;

  // Approx circular std (in radians), then to degrees
  const stdRad = Math.sqrt(-2 * Math.log(R));
  const stdDeg = (stdRad * 180) / Math.PI;

  return clamp(stdDeg, 0, 180);
}

/**
 * Weekly shelter score (0..100).
 * v1: Based on average wind speed + direction stability.
 * - lower wind => higher score
 * - more stable direction => higher score (you can pick sheltered side)
 */
export function getWeeklyShelterScore(daily) {
  const speeds =
    daily?.windspeed_10m_max ??
    daily?.wind_speed_10m_max ??
    [];

  const dirs = daily?.winddirection_10m_dominant ?? [];

  const avgWind = mean(speeds);
  const dirStd = circularStdDeg(dirs);

  if (avgWind == null) return null;

  // Tune these as you like (they feel good for Icelandic camping)
  const WIND_REF = 15; // m/s where we treat it as "very windy"
  const windPenalty = clamp01(avgWind / WIND_REF) * 70; // 0..70

  // If direction spread is 0° => perfect stability => full bonus
  // If spread is ~90° or more => basically shifting => low bonus
  const spreadRef = 90;
  const stability = 1 - clamp01((dirStd ?? spreadRef) / spreadRef); // 1..0
  const stabilityBonus = stability * 30; // 0..30

  const score = Math.round(clamp(100 - windPenalty + stabilityBonus, 0, 100));

  let label = "Low";
  if (score >= 75) label = "High";
  else if (score >= 50) label = "Medium";

  return {
    score,
    label,
    avgWind: Number(avgWind.toFixed(1)),
    dirStd: dirStd == null ? null : Number(dirStd.toFixed(1)),
  };
}
