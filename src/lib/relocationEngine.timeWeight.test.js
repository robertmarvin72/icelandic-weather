// src/lib/forecastNormalize.timeWeight.test.js
import { describe, it, expect } from "vitest";
import { normalizeDailyToScoreInput } from "./forecastNormalize";

function makeDaily() {
  return {
    time: ["2026-03-20"],
    temperature_2m_max: [10],
    temperature_2m_min: [4],
    precipitation_sum: [0],
    windspeed_10m_max: [0],
    windgusts_10m_max: [0],
    winddirection_10m_dominant: [180],
    weathercode: [3],
  };
}

function makeHourly(entries) {
  return {
    time: entries.map((e) => `2026-03-20T${String(e.hour).padStart(2, "0")}:00`),
    windspeed_10m: entries.map((e) => e.wind ?? 0),
    windgusts_10m: entries.map((e) => e.gust ?? 0),
    precipitation: entries.map((e) => e.rain ?? 0),
  };
}

describe("normalizeDailyToScoreInput - time-of-day weighting (Ticket #166)", () => {
  it("reduces overnight wind impact compared with daytime wind", () => {
    const daily = makeDaily();

    const overnight = makeHourly([
      { hour: 2, wind: 16, gust: 20, rain: 0 },
      { hour: 3, wind: 16, gust: 20, rain: 0 },
      { hour: 4, wind: 15, gust: 19, rain: 0 },
    ]);

    const daytime = makeHourly([
      { hour: 13, wind: 16, gust: 20, rain: 0 },
      { hour: 14, wind: 16, gust: 20, rain: 0 },
      { hour: 15, wind: 15, gust: 19, rain: 0 },
    ]);

    const overnightNorm = normalizeDailyToScoreInput(daily, overnight);
    const daytimeNorm = normalizeDailyToScoreInput(daily, daytime);

    expect(overnightNorm).toHaveLength(1);
    expect(daytimeNorm).toHaveLength(1);

    expect(overnightNorm[0].windMax).toBeLessThan(daytimeNorm[0].windMax);
    expect(overnightNorm[0].windGust).toBeLessThan(daytimeNorm[0].windGust);
  });

  it("reduces overnight rain impact compared with daytime rain", () => {
    const daily = makeDaily();

    const overnight = makeHourly([
      { hour: 1, rain: 3 },
      { hour: 2, rain: 3 },
      { hour: 3, rain: 2 },
    ]);

    const daytime = makeHourly([
      { hour: 12, rain: 3 },
      { hour: 13, rain: 3 },
      { hour: 14, rain: 2 },
    ]);

    const overnightNorm = normalizeDailyToScoreInput(daily, overnight);
    const daytimeNorm = normalizeDailyToScoreInput(daily, daytime);

    expect(overnightNorm).toHaveLength(1);
    expect(daytimeNorm).toHaveLength(1);

    expect(overnightNorm[0].rain).toBeLessThan(daytimeNorm[0].rain);
  });

  it("does not heavily down-weight severe overnight gusts", () => {
    const daily = makeDaily();

    const severeNight = makeHourly([{ hour: 3, wind: 20, gust: 30, rain: 0 }]);

    const norm = normalizeDailyToScoreInput(daily, severeNight);

    expect(norm).toHaveLength(1);

    // Assumes severe-night floor of 0.85:
    // 30 * 0.85 = 25.5
    expect(norm[0].windGust).toBeGreaterThanOrEqual(25);
  });

  it("falls back to daily values when hourly data is missing", () => {
    const daily = {
      time: ["2026-03-20"],
      temperature_2m_max: [11],
      temperature_2m_min: [5],
      precipitation_sum: [7],
      windspeed_10m_max: [14],
      windgusts_10m_max: [21],
      winddirection_10m_dominant: [200],
      weathercode: [61],
    };

    const norm = normalizeDailyToScoreInput(daily);

    expect(norm).toHaveLength(1);
    expect(norm[0].rain).toBe(7);
    expect(norm[0].windMax).toBe(14);
    expect(norm[0].windGust).toBe(21);
    expect(norm[0].tmax).toBe(11);
    expect(norm[0].tmin).toBe(5);
    expect(norm[0].windDir).toBe(200);
    expect(norm[0].code).toBe(61);
  });
});
