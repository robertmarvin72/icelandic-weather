import { describe, it, expect, vi } from "vitest";
import { normalizeOpenMeteoHourly, fetchLocationWeather, buildOpenMeteoUrl } from "./openMeteo.js";

describe("buildOpenMeteoUrl", () => {
  it("requests UTC timezone explicitly and the fixed hourly field set", () => {
    const url = new URL(buildOpenMeteoUrl({ lat: 64.1, lon: -21.9, startDate: "2026-08-24", endDate: "2026-08-25" }));
    expect(url.searchParams.get("timezone")).toBe("UTC");
    expect(url.searchParams.get("start_date")).toBe("2026-08-24");
    expect(url.searchParams.get("end_date")).toBe("2026-08-25");
    expect(url.searchParams.get("hourly")).toContain("cloudcover");
    expect(url.searchParams.get("hourly")).toContain("visibility");
  });
});

describe("normalizeOpenMeteoHourly", () => {
  it("maps parallel arrays into row objects with explicit UTC timestamps", () => {
    const payload = {
      hourly: {
        time: ["2026-08-24T22:00", "2026-08-24T23:00"],
        cloudcover: [10, 90],
        cloudcover_low: [5, 80],
        cloudcover_mid: [3, 5],
        cloudcover_high: [2, 5],
        precipitation: [0, 1.2],
        windspeed_10m: [2, 3],
        visibility: [20000, 5000],
      },
    };
    const rows = normalizeOpenMeteoHourly(payload);
    expect(rows).toEqual([
      {
        time: "2026-08-24T22:00:00Z",
        cloudTotal: 10,
        cloudLow: 5,
        cloudMid: 3,
        cloudHigh: 2,
        precipitation: 0,
        windSpeed: 2,
        visibility: 20000,
      },
      {
        time: "2026-08-24T23:00:00Z",
        cloudTotal: 90,
        cloudLow: 80,
        cloudMid: 5,
        cloudHigh: 5,
        precipitation: 1.2,
        windSpeed: 3,
        visibility: 5000,
      },
    ]);
  });

  it("never coerces null/undefined/NaN to 0 — missing values stay missing", () => {
    const payload = {
      hourly: {
        time: ["2026-08-24T22:00"],
        cloudcover: [null],
        cloudcover_low: [undefined],
        cloudcover_mid: [NaN],
        cloudcover_high: [],
        precipitation: [null],
        windspeed_10m: [null],
        visibility: [null],
      },
    };
    const [row] = normalizeOpenMeteoHourly(payload);
    expect(row.cloudTotal).toBeNull();
    expect(row.cloudLow).toBeNull();
    expect(row.cloudMid).toBeNull();
    expect(row.cloudHigh).toBeNull();
    expect(row.precipitation).toBeNull();
    expect(row.windSpeed).toBeNull();
    expect(row.visibility).toBeNull();
  });

  it("returns an empty array for a missing/malformed hourly payload", () => {
    expect(normalizeOpenMeteoHourly({})).toEqual([]);
    expect(normalizeOpenMeteoHourly(null)).toEqual([]);
    expect(normalizeOpenMeteoHourly({ hourly: { time: "not-an-array" } })).toEqual([]);
  });
});

describe("fetchLocationWeather", () => {
  const args = { lat: 64.1, lon: -21.9, startDate: "2026-08-24", endDate: "2026-08-25" };

  it("returns ok:true with normalized rows on a successful response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hourly: {
          time: ["2026-08-24T22:00"],
          cloudcover: [10],
          cloudcover_low: [5],
          cloudcover_mid: [3],
          cloudcover_high: [2],
          precipitation: [0],
          windspeed_10m: [2],
          visibility: [20000],
        },
      }),
    });
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result.ok).toBe(true);
    expect(result.hourlyRows).toHaveLength(1);
  });

  it("isolates a non-ok upstream response as weather_fetch_failed, without throwing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "weather_fetch_failed" });
  });

  it("isolates a network error as weather_fetch_failed, without throwing", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "weather_fetch_failed" });
  });

  it("isolates an abort/timeout as weather_timeout, without throwing", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    const fetchImpl = vi.fn().mockRejectedValue(abortError);
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "weather_timeout" });
  });

  it("isolates insufficient forecast coverage (empty normalized rows) without throwing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hourly: { time: [] } }) });
    const result = await fetchLocationWeather({ ...args, fetchImpl });
    expect(result).toEqual({ ok: false, reason: "insufficient_forecast_coverage" });
  });
});
