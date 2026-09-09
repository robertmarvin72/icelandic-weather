// Ticket 400 (#400) — proves the integration boundary in useForecast.js:
// scoreSiteDay(row) runs on the untouched raw daily row BEFORE summaryCode
// is ever computed/merged in, so changing only the hourly weather-code
// pattern changes summaryCode and nothing scoring-facing.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useForecast } from "./useForecast";

vi.mock("../lib/forecastCache", () => ({ getForecast: vi.fn() }));

import { getForecast } from "../lib/forecastCache";

const DAILY = {
  time: ["2026-09-08", "2026-09-09"],
  temperature_2m_max: [15, 14],
  temperature_2m_min: [8, 7],
  precipitation_sum: [0, 0],
  windspeed_10m_max: [5, 6],
  windgusts_10m_max: [8, 9],
  winddirection_10m_dominant: [180, 190],
  weathercode: [3, 3], // raw daily code — deliberately "overcast" both days
};

function hourlyClearWithLateOvercast() {
  const time = [];
  const weathercode = [];
  const windspeed_10m = [];
  const windgusts_10m = [];
  const precipitation = [];

  for (const date of DAILY.time) {
    for (let h = 0; h <= 21; h++) {
      time.push(`${date}T${String(h).padStart(2, "0")}:00`);
      weathercode.push(h === 21 ? 3 : 0);
      windspeed_10m.push(4);
      windgusts_10m.push(6);
      precipitation.push(0);
    }
  }
  return { time, weathercode, windspeed_10m, windgusts_10m, precipitation };
}

function hourlyAllOvercast() {
  const time = [];
  const weathercode = [];
  const windspeed_10m = [];
  const windgusts_10m = [];
  const precipitation = [];

  for (const date of DAILY.time) {
    for (let h = 0; h <= 21; h++) {
      time.push(`${date}T${String(h).padStart(2, "0")}:00`);
      weathercode.push(3);
      windspeed_10m.push(4);
      windgusts_10m.push(6);
      precipitation.push(0);
    }
  }
  return { time, weathercode, windspeed_10m, windgusts_10m, precipitation };
}

beforeEach(() => vi.clearAllMocks());

describe("useForecast — scoring invariance across differing hourly weather-code patterns", () => {
  it("row.code stays the raw daily.weathercode regardless of hourly pattern", async () => {
    getForecast.mockResolvedValue({ daily: DAILY, hourly: hourlyClearWithLateOvercast() });
    const { result } = renderHook(() => useForecast(64.1, -21.9));
    await waitFor(() => expect(result.current.rows.length).toBe(2));

    expect(result.current.rows[0].code).toBe(3);
    expect(result.current.rows[1].code).toBe(3);
  });

  it("summaryCode differs from row.code when hourly data disagrees, without changing score/points/class", async () => {
    getForecast.mockResolvedValue({ daily: DAILY, hourly: hourlyClearWithLateOvercast() });
    const clearHook = renderHook(() => useForecast(64.1, -21.9));
    await waitFor(() => expect(clearHook.result.current.rows.length).toBe(2));
    const clearRows = clearHook.result.current.rows;

    expect(clearRows[0].code).toBe(3);
    expect(clearRows[0].summaryCode).toBe(0); // Laugardalur-style: clear dominates, not overcast

    getForecast.mockResolvedValue({ daily: DAILY, hourly: hourlyAllOvercast() });
    const overcastHook = renderHook(() => useForecast(64.2, -22.0));
    await waitFor(() => expect(overcastHook.result.current.rows.length).toBe(2));
    const overcastRows = overcastHook.result.current.rows;

    expect(overcastRows[0].summaryCode).toBe(3);

    // The scoring-facing fields must be byte-identical between the two
    // hourly variants: same raw code, same wind/rain inputs (unaffected by
    // weathercode), same scoreSiteDay output.
    for (const field of ["code", "points", "class", "basePts", "windPen", "gustPen", "rainPen", "precipTimingMultiplier", "season", "tmax", "tmin", "rain", "windMax", "windGust"]) {
      expect(overcastRows[0][field]).toEqual(clearRows[0][field]);
      expect(overcastRows[1][field]).toEqual(clearRows[1][field]);
    }
  });

  // Ticket 402 (#402): the richer summaryTextKey field goes through the
  // exact same integration boundary — computed after scoreSiteDay(row) has
  // already run on the untouched row, merged in alongside (not instead of)
  // every scoring/ranking-facing field. Proven here with the real issue
  // #402 motivating hourly pattern, through the real useForecast hook.
  it("summaryTextKey is populated for the #402 motivating pattern without changing any scoring-facing field", async () => {
    const dailyHeavyDrizzle = {
      ...DAILY,
      time: ["2026-09-14", "2026-09-15"],
      weathercode: [55, 55], // raw daily code — deliberately "heavy drizzle" both days
    };

    function hourlyRainEarlyDryLater() {
      const time = [];
      const weathercode = [];
      const windspeed_10m = [];
      const windgusts_10m = [];
      const precipitation = [];
      // Precipitation held at 0 throughout — code 55 is heavy-tier and
      // qualifies as override-significant regardless of amount, so this
      // isolates the variable under test (the weathercode pattern) exactly
      // like the clear/overcast comparison above isolates its own.
      for (const date of dailyHeavyDrizzle.time) {
        for (let h = 0; h <= 21; h++) {
          time.push(`${date}T${String(h).padStart(2, "0")}:00`);
          weathercode.push(h === 6 ? 55 : 0);
          windspeed_10m.push(4.5);
          windgusts_10m.push(6);
          precipitation.push(0);
        }
      }
      return { time, weathercode, windspeed_10m, windgusts_10m, precipitation };
    }

    function hourlyAllHeavyDrizzle() {
      const time = [];
      const weathercode = [];
      const windspeed_10m = [];
      const windgusts_10m = [];
      const precipitation = [];
      for (const date of dailyHeavyDrizzle.time) {
        for (let h = 0; h <= 21; h++) {
          time.push(`${date}T${String(h).padStart(2, "0")}:00`);
          weathercode.push(55);
          windspeed_10m.push(4.5);
          windgusts_10m.push(6);
          precipitation.push(0);
        }
      }
      return { time, weathercode, windspeed_10m, windgusts_10m, precipitation };
    }

    getForecast.mockResolvedValue({ daily: dailyHeavyDrizzle, hourly: hourlyRainEarlyDryLater() });
    const narrativeHook = renderHook(() => useForecast(64.1, -21.9));
    await waitFor(() => expect(narrativeHook.result.current.rows.length).toBe(2));
    const narrativeRows = narrativeHook.result.current.rows;

    expect(narrativeRows[0].code).toBe(55); // raw daily code, untouched
    expect(narrativeRows[0].summaryTextKey).toBe("dailySummaryRainEarlyDryLater");

    getForecast.mockResolvedValue({ daily: dailyHeavyDrizzle, hourly: hourlyAllHeavyDrizzle() });
    const allDayHook = renderHook(() => useForecast(64.2, -22.0));
    await waitFor(() => expect(allDayHook.result.current.rows.length).toBe(2));
    const allDayRows = allDayHook.result.current.rows;

    expect(allDayRows[0].summaryTextKey).toBeNull();

    // Different summaryTextKey (and, incidentally, different summaryCode),
    // but every scoring/ranking-facing field is still byte-identical.
    for (const field of ["code", "points", "class", "basePts", "windPen", "gustPen", "rainPen", "precipTimingMultiplier", "season", "tmax", "tmin", "rain", "windMax", "windGust"]) {
      expect(allDayRows[0][field]).toEqual(narrativeRows[0][field]);
      expect(allDayRows[1][field]).toEqual(narrativeRows[1][field]);
    }
  });
});
