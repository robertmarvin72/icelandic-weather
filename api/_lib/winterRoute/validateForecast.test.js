// @vitest-environment node
//
// Fixture is an explicitly SYNTHETIC reconstruction of the real Open-Meteo
// multi-location list response shape (array of six per-point objects with
// utc_offset_seconds/timezone/hourly_units/hourly) — not a replay of the
// #485 final-probe-sample.json, which is itself a rebuilt/allowlisted
// document, not the raw response shape (S4).
import { describe, it, expect } from "vitest";
import { validateForecastResponse } from "./validateForecast.js";

const REQUESTED_POINTS = [
  { lat: 64.01137995, lon: -21.2507017 },
  { lat: 63.96197548, lon: -21.11948637 },
  { lat: 63.90527541, lon: -20.590946 },
  { lat: 63.82344501, lon: -20.36083533 },
  { lat: 63.5496223, lon: -19.76249937 },
  { lat: 63.41954011, lon: -19.00662528 },
];

function expectedHours() {
  const hours = [];
  for (let h = 0; h < 24; h++) hours.push(`2026-11-04T${String(h).padStart(2, "0")}:00`);
  return hours;
}

function makePoint(point, { hoursOverride, offsetOverride, unitsOverride, valueOverride } = {}) {
  const hours = hoursOverride ?? expectedHours();
  const series = {
    temperature_2m: hours.map(() => -2.5),
    wind_speed_10m: hours.map(() => 5.1),
    wind_gusts_10m: hours.map(() => 8.4),
    precipitation: hours.map(() => 0),
    weather_code: hours.map(() => 3),
  };
  if (valueOverride) Object.assign(series, valueOverride);

  return {
    latitude: point.lat,
    longitude: point.lon,
    elevation: 123,
    utc_offset_seconds: offsetOverride ?? 0,
    timezone: "UTC",
    timezone_abbreviation: "UTC",
    hourly_units: {
      temperature_2m: "°C",
      wind_speed_10m: "m/s",
      wind_gusts_10m: "m/s",
      precipitation: "mm",
      weather_code: "wmo code",
      ...unitsOverride,
    },
    hourly: { time: hours, ...series },
  };
}

function makeValidResponse() {
  return REQUESTED_POINTS.map((p) => makePoint(p));
}

describe("validateForecastResponse", () => {
  it("accepts a fully valid six-point response", () => {
    const result = validateForecastResponse(makeValidResponse(), {
      requestedPoints: REQUESTED_POINTS,
      expectedHours: expectedHours(),
    });
    expect(result.ok).toBe(true);
    expect(result.points).toHaveLength(6);
    for (const p of result.points) expect(p.ok).toBe(true);
  });

  it("fails the whole batch structurally if not exactly six results", () => {
    const result = validateForecastResponse(makeValidResponse().slice(0, 5), {
      requestedPoints: REQUESTED_POINTS,
      expectedHours: expectedHours(),
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("wrong_result_count");
  });

  it("marks a point unusable (not coerced) on wrong request order", () => {
    const data = makeValidResponse();
    // Swap point 0's coordinates to point 5's — now nearest to index 5, not 0.
    data[0].latitude = REQUESTED_POINTS[5].lat;
    data[0].longitude = REQUESTED_POINTS[5].lon;

    const result = validateForecastResponse(data, { requestedPoints: REQUESTED_POINTS, expectedHours: expectedHours() });
    expect(result.ok).toBe(true);
    expect(result.points[0].ok).toBe(false);
    expect(result.points[0].reason).toBe("order_mismatch");
    // Other five points are unaffected by one point's failure.
    expect(result.points[1].ok).toBe(true);
  });

  it("marks a point unusable on a non-zero utc_offset_seconds", () => {
    const data = makeValidResponse();
    data[2] = makePoint(REQUESTED_POINTS[2], { offsetOverride: 3600 });
    const result = validateForecastResponse(data, { requestedPoints: REQUESTED_POINTS, expectedHours: expectedHours() });
    expect(result.points[2].ok).toBe(false);
    expect(result.points[2].reason).toBe("unexpected_utc_offset");
  });

  it("marks a point unusable on a wrong/out-of-order hourly time array", () => {
    const data = makeValidResponse();
    const shuffled = [...expectedHours()];
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    data[1] = makePoint(REQUESTED_POINTS[1], { hoursOverride: shuffled });
    const result = validateForecastResponse(data, { requestedPoints: REQUESTED_POINTS, expectedHours: expectedHours() });
    expect(result.points[1].ok).toBe(false);
    expect(result.points[1].reason).toBe("time_mismatch");
  });

  it("marks a point unusable on a unit mismatch (never silently reinterpreted)", () => {
    const data = makeValidResponse();
    data[3] = makePoint(REQUESTED_POINTS[3], { unitsOverride: { wind_speed_10m: "km/h" } });
    const result = validateForecastResponse(data, { requestedPoints: REQUESTED_POINTS, expectedHours: expectedHours() });
    expect(result.points[3].ok).toBe(false);
    expect(result.points[3].reason).toBe("unit_mismatch:wind_speed_10m");
  });

  it("preserves null as distinct from 0 and does not fail on a null gap", () => {
    const data = makeValidResponse();
    const precip = expectedHours().map((_, i) => (i === 5 ? null : 0));
    data[4] = makePoint(REQUESTED_POINTS[4], { valueOverride: { precipitation: precip } });
    const result = validateForecastResponse(data, { requestedPoints: REQUESTED_POINTS, expectedHours: expectedHours() });
    expect(result.points[4].ok).toBe(true);
    expect(result.points[4].series.precipitation[5]).toBeNull();
    expect(result.points[4].series.precipitation[0]).toBe(0);
  });

  it("marks a point unusable when a required series has a non-numeric, non-null value", () => {
    const data = makeValidResponse();
    const temps = expectedHours().map((_, i) => (i === 10 ? "N/A" : -1));
    data[0] = makePoint(REQUESTED_POINTS[0], { valueOverride: { temperature_2m: temps } });
    const result = validateForecastResponse(data, { requestedPoints: REQUESTED_POINTS, expectedHours: expectedHours() });
    expect(result.points[0].ok).toBe(false);
    expect(result.points[0].reason).toBe("invalid_value:temperature_2m");
  });
});
