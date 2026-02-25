import { describe, test, expect } from "vitest";
import { relocationEngine } from "./relocationEngine";

// Fake minimal forecast that yields identical scores
function makeForecast() {
  return {
    daily: {
      time: ["2026-06-01"],
      temperature_2m_max: [15],
      precipitation_sum: [0],
      windspeed_10m_max: [4],
      windgusts_10m_max: [4],
    },
  };
}

describe("relocationEngine – regression: stable ranked order", () => {
  test("same inputs -> deterministic ranked order (tie-breaker by siteId)", () => {
    const campsites = [
      { id: "base", lat: 64, lon: -21 },
      { id: "b-site", lat: 64.1, lon: -21.1 },
      { id: "a-site", lat: 64.1, lon: -21.1 }, // same coords = same distance
    ];

    const forecastMap = {
      base: makeForecast(),
      "a-site": makeForecast(),
      "b-site": makeForecast(),
    };

    const out = relocationEngine({
      baseSiteId: "base",
      radiusKm: 200,
      startDateISO: "2026-06-01",
      days: 1,
      campsites,
      forecastMap,
    });

    const rankedIds = out.ranked.map((r) => r.siteId);

    // Should sort by total desc (equal), distance asc (equal),
    // then siteId asc
    expect(rankedIds).toEqual(["a-site", "b-site"]);
  });
});
