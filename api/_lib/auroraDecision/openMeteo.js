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
import { resolveOpenMeteoAuth, OPEN_METEO_PUBLIC_HOST } from "../openMeteoAuth.js";

const HOURLY_FIELDS = [
  "cloudcover",
  "cloudcover_low",
  "cloudcover_mid",
  "cloudcover_high",
  "precipitation",
  "windspeed_10m",
  "visibility",
];

// Ticket #452: Open-Meteo's own documented default for this endpoint is
// windspeed_10m in km/h, not m/s (https://open-meteo.com/en/docs, read
// 2026-10-20); HIGH_WIND_MS_THRESHOLD in src/lib/auroraScoring.js is an m/s
// comparator, so without this explicit, canonical parameter the comparison
// was silently comparing km/h values against an m/s threshold.
const WIND_SPEED_UNIT = "ms";

// Ticket #453: `host`/`apiKey` are optional so every existing caller/test
// that omits them keeps building the exact same public, keyless URL as
// before (backward-compatible signature, per Q4) — only `fetchLocationWeather`
// passes a resolved host/apiKey, from `resolveOpenMeteoAuth`.
export function buildOpenMeteoUrl({ lat, lon, startDate, endDate, host = OPEN_METEO_PUBLIC_HOST, apiKey = null }) {
  const url = new URL(`${host}/v1/forecast`);
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("hourly", HOURLY_FIELDS.join(","));
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("wind_speed_unit", WIND_SPEED_UNIT);
  if (apiKey) url.searchParams.set("apikey", apiKey);
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

// Ticket #452 (N2): a defensive runtime check on the provider's OWN reported
// unit, not a converter. If hourly_units.windspeed_10m is present and is not
// exactly "m/s", the request/response contract disagrees with what we asked
// for (WIND_SPEED_UNIT above) — rather than silently scoring a wrong-unit
// value against auroraScoring.js's m/s threshold, every row's windSpeed is
// nulled (flag lost, never a fabricated conversion, never a thrown error).
// Missing unit metadata (hourly_units absent, or absent on this one field)
// is NOT treated as suspect — existing fixtures that omit hourly_units
// entirely (e.g. api/aurora-decision.test.js) must keep passing unchanged.
function windUnitIsSuspect(payload) {
  const unit = payload?.hourly_units?.windspeed_10m;
  return unit !== undefined && unit !== "m/s";
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

  const windSuspect = windUnitIsSuspect(payload);

  return hourly.time
    .map((rawTime, i) => ({
      time: toIsoUtc(rawTime),
      cloudTotal: numOrNull(hourly.cloudcover?.[i]),
      cloudLow: numOrNull(hourly.cloudcover_low?.[i]),
      cloudMid: numOrNull(hourly.cloudcover_mid?.[i]),
      cloudHigh: numOrNull(hourly.cloudcover_high?.[i]),
      precipitation: numOrNull(hourly.precipitation?.[i]),
      windSpeed: windSuspect ? null : numOrNull(hourly.windspeed_10m?.[i]),
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEATHER_FETCH_TIMEOUT_MS);

  try {
    // Ticket #453 (Q3): resolved and checked INSIDE the try block — unlike
    // the old URL build, which ran before this block — so a config failure
    // is a structured per-location result, never an exception escaping
    // fanout. `resolveOpenMeteoAuth` itself never throws.
    const auth = resolveOpenMeteoAuth();
    if (auth.failClosed) {
      console.error("open-meteo: api key missing; failing closed for aurora weather fetch (environment: production)");
      return { ok: false, reason: "weather_fetch_failed" };
    }

    const url = buildOpenMeteoUrl({ lat, lon, startDate, endDate, host: auth.host, apiKey: auth.apiKey });
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) {
      // Ticket #453 (Q5): status code only, never the body/URL — lets an
      // operator tell 401/403/429 (keyed host) apart from any other failure.
      console.error("open-meteo: aurora weather fetch failed", { status: res.status });
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
