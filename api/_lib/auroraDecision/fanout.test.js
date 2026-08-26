import { describe, it, expect, vi } from "vitest";
import { fetchWeatherForLocations } from "./fanout.js";

const LOCATIONS = [
  { id: "loc-a", name: "A", lat: 64.1, lon: -21.9 },
  { id: "loc-b", name: "B", lat: 65.2, lon: -18.5 },
  { id: "loc-c", name: "C", lat: 66.3, lon: -15.0 },
];

function payloadWithCloud(cloud) {
  return {
    hourly: {
      time: ["2026-08-24T22:00"],
      cloudcover: [cloud],
      cloudcover_low: [cloud],
      cloudcover_mid: [0],
      cloudcover_high: [0],
      precipitation: [0],
      windspeed_10m: [1],
      visibility: [10000],
    },
  };
}

describe("fetchWeatherForLocations", () => {
  it("returns results in the same order as the input locations regardless of completion order", async () => {
    // Location A resolves last, C resolves first — output order must still
    // match input order (index-addressed, not push-on-completion).
    const delayByLat = { "64.1000": 30, "65.2000": 15, "66.3000": 0 };
    const fetchImpl = vi.fn(async (url) => {
      const lat = new URL(url).searchParams.get("latitude");
      await new Promise((resolve) => setTimeout(resolve, delayByLat[lat] ?? 0));
      return { ok: true, json: async () => payloadWithCloud(50) };
    });

    const results = await fetchWeatherForLocations({
      locations: LOCATIONS,
      startDate: "2026-08-24",
      endDate: "2026-08-25",
      fetchImpl,
      concurrency: 4,
    });

    expect(results.map((r) => r.location.id)).toEqual(["loc-a", "loc-b", "loc-c"]);
  });

  it("isolates one location's failure without affecting the others", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const lat = new URL(url).searchParams.get("latitude");
      if (lat === "65.2000") throw new Error("boom");
      return { ok: true, json: async () => payloadWithCloud(20) };
    });

    const results = await fetchWeatherForLocations({
      locations: LOCATIONS,
      startDate: "2026-08-24",
      endDate: "2026-08-25",
      fetchImpl,
    });

    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
    expect(results[1].reason).toBe("weather_fetch_failed");
    expect(results[2].ok).toBe(true);
  });

  it("respects a concurrency limit lower than the location count", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const fetchImpl = vi.fn(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return { ok: true, json: async () => payloadWithCloud(0) };
    });

    await fetchWeatherForLocations({
      locations: LOCATIONS,
      startDate: "2026-08-24",
      endDate: "2026-08-25",
      fetchImpl,
      concurrency: 2,
    });

    expect(maxInFlight).toBeLessThanOrEqual(2);
  });
});
