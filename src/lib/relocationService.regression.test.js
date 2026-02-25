import { describe, test, expect } from "vitest";
import { getRelocationRecommendation } from "./relocationService";

describe("relocationService – regression: missing base forecast", () => {
  test("throws when base forecast is missing", async () => {
    const campsites = [
      { id: "base", lat: 64, lon: -21 },
      { id: "alt", lat: 64.1, lon: -21.1 },
    ];

    // Mock fetcher that returns forecast only for alt
    const mockFetcher = async ({ lat, lon }) => {
      if (lat === 64 && lon === -21) return null; // base missing
      return {
        daily: {
          time: ["2026-06-01"],
          temperature_2m_max: [15],
          precipitation_sum: [0],
          windspeed_10m_max: [4],
          windgusts_10m_max: [4],
        },
      };
    };

    await expect(
      getRelocationRecommendation("base", campsites, {
        startDateISO: "2026-06-01",
        getForecastFn: mockFetcher,
      })
    ).rejects.toThrow("Base site forecast missing");
  });
});
