// api/_lib/winterRoute/forecastFetch.js
//
// Ticket #486 — six-point forecast fetch for the winter route. Deliberately
// its own, narrower key policy (see resolveWinterRouteForecastAuth below):
// unlike api/_lib/openMeteoAuth.js's shared helper (which falls back to the
// public host outside Production), THIS route must never fall back to the
// public host in ANY environment — a missing/blank key means zero forecast
// requests, full stop (approved prompt: "lykilvöntun verður að stöðva
// spásókn í ÖLLUM umhverfum"). The shared helper's behavior for every other
// route (api/forecast.js, the Aurora fetch) is untouched.

import { OPEN_METEO_CUSTOMER_HOST } from "../openMeteoAuth.js";
import { fetchJsonBounded } from "./boundedFetch.js";
import { WINTER_ROUTE_FORECAST_POINTS } from "./segments.js";
import { validateForecastResponse } from "./validateForecast.js";

const HOURLY_FIELDS = ["temperature_2m", "wind_speed_10m", "wind_gusts_10m", "precipitation", "weather_code"];

// S6(a): blank/whitespace-only counts as missing, same rule as the shared
// helper's own trim check — but no environment-based fallback exists here.
export function resolveWinterRouteForecastAuth(env = process.env) {
  const rawKey = env?.OPEN_METEO_API_KEY;
  const trimmedKey = typeof rawKey === "string" ? rawKey.trim() : "";
  if (!trimmedKey) return { available: false, apiKey: null, host: null };
  return { available: true, apiKey: trimmedKey, host: OPEN_METEO_CUSTOMER_HOST };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toHourString(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:00`;
}

// 24 hourly values starting at the first full UTC hour STRICTLY after
// `now`, ending 23 hours later — matches the already-executed #485
// RESEARCH GO window shape exactly (different instant, same construction).
export function computeForecastWindow(now = new Date()) {
  const startMs = Math.floor(now.getTime() / 3600000) * 3600000 + 3600000;
  const start = new Date(startMs);
  const end = new Date(startMs + 23 * 3600000);
  const expectedHours = [];
  for (let h = 0; h < 24; h++) expectedHours.push(toHourString(new Date(startMs + h * 3600000)));
  return { startHour: toHourString(start), endHour: toHourString(end), expectedHours };
}

export function buildForecastUrl({ host, apiKey, startHour, endHour }) {
  const url = new URL(`${host}/v1/forecast`);
  url.searchParams.set("latitude", WINTER_ROUTE_FORECAST_POINTS.map((p) => p.lat).join(","));
  url.searchParams.set("longitude", WINTER_ROUTE_FORECAST_POINTS.map((p) => p.lon).join(","));
  url.searchParams.set("hourly", HOURLY_FIELDS.join(","));
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "ms");
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("start_hour", startHour);
  url.searchParams.set("end_hour", endHour);
  if (apiKey) url.searchParams.set("apikey", apiKey);
  return url.toString();
}

/**
 * Fetches and strictly validates the six-point forecast. Never retries,
 * never falls back to the public host. Returns a structured result —
 * never throws.
 */
export async function fetchWinterRouteForecast({ now = new Date(), fetchOptions, env = process.env } = {}) {
  const auth = resolveWinterRouteForecastAuth(env);
  if (!auth.available) {
    return { ok: false, reason: "key_missing" };
  }

  const window = computeForecastWindow(now);
  const url = buildForecastUrl({
    host: auth.host,
    apiKey: auth.apiKey,
    startHour: window.startHour,
    endHour: window.endHour,
  });

  // Ticket #453's own D2 discipline, reused here: never log the raw error,
  // which for a fetch failure can embed the request URL (and therefore the
  // keyed apikey) in some runtimes. fetchJsonBounded already returns only a
  // structured { ok:false, reason } on any failure, never the URL/err.
  const result = await fetchJsonBounded(url, fetchOptions);
  if (!result.ok) return result;

  const validation = validateForecastResponse(result.data, {
    requestedPoints: WINTER_ROUTE_FORECAST_POINTS,
    expectedHours: window.expectedHours,
  });
  if (!validation.ok) return validation;

  return { ok: true, points: validation.points, window };
}
