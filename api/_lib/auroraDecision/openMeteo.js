// api/_lib/auroraDecision/openMeteo.js
//
// Dedicated, independent Open-Meteo fetch + normalization for the Aurora
// decision endpoint. Deliberately NOT extracted from/routed through
// api/forecast.js: that endpoint is a single-location passthrough bound to
// req/res, its request/response shape and tests are unrelated to
// server-side multi-location fan-out, and this endpoint only needs a small,
// fixed hourly field subset. Duplicating ~10 lines of field list/URL
// construction here is safer than refactoring an existing, tested,
// unrelated endpoint for this ticket's scope (approved prompt §6: "Do not
// broaden that refactor beyond the fields/normalization needed here").
//
// `timezone=UTC` is requested explicitly so Open-Meteo's hourly timestamps
// are plain UTC instants, matching the UTC-epoch-ms contract used
// throughout Ticket 1/2/3 — never locale/host-timezone dependent.

import { WEATHER_FETCH_TIMEOUT_MS } from "./constants.js";

const HOURLY_FIELDS = [
  "cloudcover",
  "cloudcover_low",
  "cloudcover_mid",
  "cloudcover_high",
  "precipitation",
  "windspeed_10m",
  "visibility",
];

export function buildOpenMeteoUrl({ lat, lon, startDate, endDate }) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("hourly", HOURLY_FIELDS.join(","));
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "UTC");
  return url.toString();
}

// Open-Meteo hourly times look like "2026-08-24T22:00" (no seconds, no
// offset) when timezone=UTC. Converts to an explicit-UTC ISO string matching
// src/lib/auroraScoring.js's row contract. Returns null (never fabricates)
// for anything unrecognized.
function toIsoUtc(rawTime) {
  if (typeof rawTime !== "string") return null;
  if (/Z$/.test(rawTime)) return rawTime;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawTime)) return `${rawTime}:00Z`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(rawTime)) return `${rawTime}Z`;
  return null;
}

// Never coerces null/undefined/NaN to 0 — missing stays missing.
function numOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Maps Open-Meteo's parallel-array hourly response into the row shape
 * src/lib/auroraScoring.js expects. Rows with an unparsable timestamp are
 * dropped (there is nothing usable to aggregate them by); every other field
 * is independently nullable.
 */
export function normalizeOpenMeteoHourly(payload) {
  const hourly = payload?.hourly;
  if (!hourly || !Array.isArray(hourly.time)) return [];

  return hourly.time
    .map((rawTime, i) => ({
      time: toIsoUtc(rawTime),
      cloudTotal: numOrNull(hourly.cloudcover?.[i]),
      cloudLow: numOrNull(hourly.cloudcover_low?.[i]),
      cloudMid: numOrNull(hourly.cloudcover_mid?.[i]),
      cloudHigh: numOrNull(hourly.cloudcover_high?.[i]),
      precipitation: numOrNull(hourly.precipitation?.[i]),
      windSpeed: numOrNull(hourly.windspeed_10m?.[i]),
      visibility: numOrNull(hourly.visibility?.[i]),
    }))
    .filter((row) => row.time != null);
}

/**
 * Fetches and normalizes weather for one location. Isolated per location:
 * returns a structured failure instead of throwing, so one location's
 * timeout/network error/malformed payload never propagates to others.
 */
export async function fetchLocationWeather({ lat, lon, startDate, endDate, fetchImpl }) {
  const url = buildOpenMeteoUrl({ lat, lon, startDate, endDate });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEATHER_FETCH_TIMEOUT_MS);

  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) {
      return { ok: false, reason: "weather_fetch_failed" };
    }

    const payload = await res.json();
    const hourlyRows = normalizeOpenMeteoHourly(payload);

    if (hourlyRows.length === 0) {
      return { ok: false, reason: "insufficient_forecast_coverage" };
    }

    return { ok: true, hourlyRows };
  } catch (err) {
    if (err?.name === "AbortError") {
      return { ok: false, reason: "weather_timeout" };
    }
    return { ok: false, reason: "weather_fetch_failed" };
  } finally {
    clearTimeout(timer);
  }
}
