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
});
