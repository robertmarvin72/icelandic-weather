// src/lib/windUtils.js

// 16-point compass (N, NNE, NE, ...)
// 0° = North, 90° = East, 180° = South, 270° = West
const COMPASS_16 = [
  "N",  "NNE", "NE",  "ENE",
  "E",  "ESE", "SE",  "SSE",
  "S",  "SSW", "SW",  "WSW",
  "W",  "WNW", "NW",  "NNW",
];

export function degreesToCompass(deg) {
  const d = Number(deg);
  if (!Number.isFinite(d)) return null;

  // normalize 0..360
  const normalized = ((d % 360) + 360) % 360;

  // 360 / 16 = 22.5 degrees per sector
  const idx = Math.round(normalized / 22.5) % 16;
  return COMPASS_16[idx];
}

// Simple arrow you can show in UI (optional)
export function degreesToArrow(deg) {
  const d = Number(deg);
  if (!Number.isFinite(d)) return "•";

  const normalized = ((d % 360) + 360) % 360;
  // 8 arrows (every 45 degrees)
  const arrows = ["↑","↗","→","↘","↓","↙","←","↖"];
  const idx = Math.round(normalized / 45) % 8;
  return arrows[idx];
}

/**
 * Pick a "dominant" weekly wind direction from daily arrays.
 * Option A: simple average (works fine).
 * Option B: weighted by wind speed (recommended).
 */

export function oppositeCompass(compass) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  const i = dirs.indexOf(compass);
  if (i === -1) return null;
  return dirs[(i + 4) % 8];
}


export function getWeeklyDominantWindDeg(daily) {
  const dirs = daily?.winddirection_10m_dominant;
  const speeds = daily?.windspeed_10m_max ?? daily?.wind_speed_10m_max;

  if (!Array.isArray(dirs) || dirs.length === 0) return null;

  // Weighted circular mean (robust)
  let sumSin = 0;
  let sumCos = 0;

  for (let i = 0; i < dirs.length; i++) {
    const deg = Number(dirs[i]);
    if (!Number.isFinite(deg)) continue;

    const w = Array.isArray(speeds) ? Number(speeds[i]) : 1;
    const weight = Number.isFinite(w) && w > 0 ? w : 1;

    const rad = (deg * Math.PI) / 180;
    sumSin += Math.sin(rad) * weight;
    sumCos += Math.cos(rad) * weight;
  }

  if (sumSin === 0 && sumCos === 0) return null;

  let mean = Math.atan2(sumSin, sumCos) * (180 / Math.PI);
  if (mean < 0) mean += 360;
  return mean;
}
