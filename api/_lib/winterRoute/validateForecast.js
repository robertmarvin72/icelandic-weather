// api/_lib/winterRoute/validateForecast.js
//
// Ticket #486, S4 — strict validation of the real Open-Meteo multi-location
// response: a JSON array of exactly six per-point objects (the real list
// shape, NOT the #485 final-probe-sample.json's rebuilt/nested document
// shape — that file is a reconstructed, allowlisted sample, never a raw
// response). Any unit/order/time mismatch makes the affected point's data
// UNUSABLE (reported with a reason), never silently repaired, rounded, or
// shifted. `null` is always distinct from `0`.

const REQUIRED_HOURLY_FIELDS = ["temperature_2m", "wind_speed_10m", "wind_gusts_10m", "precipitation", "weather_code"];
const REQUIRED_UNITS = {
  temperature_2m: "°C",
  wind_speed_10m: "m/s",
  wind_gusts_10m: "m/s",
  precipitation: "mm",
  weather_code: "wmo code",
};

function haversineKm(a, b) {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Confirms result[i] is at least as near requested point i as it is to any
// other requested point (ties allowed — a genuine tie is not a failure).
function isInRequestOrder(resultIndex, returnedCoord, requestedPoints) {
  const distances = requestedPoints.map((p, j) => ({ j, km: haversineKm(returnedCoord, { lat: p.lat, lon: p.lon }) }));
  const ownDistance = distances.find((d) => d.j === resultIndex).km;
  const nearest = Math.min(...distances.map((d) => d.km));
  return Math.abs(ownDistance - nearest) < 1e-9;
}

function isFiniteOrNull(v) {
  return v === null || (typeof v === "number" && Number.isFinite(v));
}

function validateOnePoint(result, resultIndex, requestedPoints, expectedHours) {
  if (!result || typeof result !== "object") {
    return { ok: false, reason: "malformed_point" };
  }

  const lat = result.latitude;
  const lon = result.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") {
    return { ok: false, reason: "malformed_coordinates" };
  }

  if (!isInRequestOrder(resultIndex, { lat, lon }, requestedPoints)) {
    return { ok: false, reason: "order_mismatch" };
  }

  if (result.utc_offset_seconds !== 0) {
    return { ok: false, reason: "unexpected_utc_offset" };
  }

  const hourly = result.hourly;
  const units = result.hourly_units;
  if (!hourly || !Array.isArray(hourly.time) || !units) {
    return { ok: false, reason: "missing_hourly_block" };
  }

  if (hourly.time.length !== expectedHours.length || hourly.time.some((t, i) => t !== expectedHours[i])) {
    return { ok: false, reason: "time_mismatch" };
  }

  const series = {};
  for (const field of REQUIRED_HOURLY_FIELDS) {
    const arr = hourly[field];
    if (!Array.isArray(arr) || arr.length !== expectedHours.length) {
      return { ok: false, reason: `missing_series:${field}` };
    }
    if (!arr.every(isFiniteOrNull)) {
      return { ok: false, reason: `invalid_value:${field}` };
    }
    if (units[field] !== REQUIRED_UNITS[field]) {
      return { ok: false, reason: `unit_mismatch:${field}` };
    }
    series[field] = arr;
  }

  return {
    ok: true,
    latitude: lat,
    longitude: lon,
    elevation: typeof result.elevation === "number" ? result.elevation : null,
    hours: expectedHours,
    series,
  };
}

/**
 * `requestedPoints` — array of six `{ lat, lon }` in the exact order they
 * were requested (WINTER_ROUTE_FORECAST_POINTS). `expectedHours` — the 24
 * exact "YYYY-MM-DDTHH:00" strings the window requires.
 *
 * Returns `{ ok: true, points }` where `points` has exactly six entries,
 * each either a validated point object or `{ ok: false, reason }` for that
 * one point (a per-point failure, not a whole-batch one) — or
 * `{ ok: false, reason }` for a whole-batch structural failure (wrong
 * length / not an array at all).
 */
export function validateForecastResponse(data, { requestedPoints, expectedHours }) {
  if (!Array.isArray(data) || data.length !== requestedPoints.length) {
    return { ok: false, reason: "wrong_result_count" };
  }

  const points = data.map((result, i) => validateOnePoint(result, i, requestedPoints, expectedHours));
  return { ok: true, points };
}
