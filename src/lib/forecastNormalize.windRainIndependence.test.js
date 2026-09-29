// Ticket #428 — same wind/rain independence guarantee as
// scoring.windRainIndependence.test.js, but exercised through the REAL
// normalizeDailyToScoreInput() -> scoreSiteDay() two-call pipeline that
// useForecast.js and MapView.jsx both use verbatim (confirmed identical
// call pattern in both files during this ticket's audit). Neither function
// is mocked here. Covers both branches normalizeDailyToScoreInput can take:
// hourly-weighted normalization, and the raw-daily fallback when no hourly
// data exists for a date.
import { describe, it, expect } from "vitest";
import { normalizeDailyToScoreInput } from "./forecastNormalize";
import { scoreSiteDay } from "./scoring";

function hourlyDay(date, { wind = 20, gust = 20, rainAtHour12 = 0 } = {}) {
  const time = [];
  const windspeed_10m = [];
  const windgusts_10m = [];
  const precipitation = [];
  for (let h = 0; h < 24; h++) {
    time.push(`${date}T${String(h).padStart(2, "0")}:00`);
    windspeed_10m.push(wind);
    windgusts_10m.push(gust);
    precipitation.push(h === 12 ? rainAtHour12 : 0);
  }
  return { time, windspeed_10m, windgusts_10m, precipitation };
}

describe("forecastNormalize + scoring: wind component is independent of precipitation, hourly-normalized path (Ticket #428)", () => {
  it("same hourly wind/gust series, different hourly rain -> identical windMax/windPen, different rain/rainPen", () => {
    const date = "2026-07-15";
    const daily = {
      time: [date],
      temperature_2m_max: [15],
      temperature_2m_min: [8],
      precipitation_sum: [0], // unused when hourly data exists for the date
      windspeed_10m_max: [20],
      windgusts_10m_max: [20],
      weathercode: [null],
    };

    const dryRows = normalizeDailyToScoreInput(daily, hourlyDay(date, { rainAtHour12: 0 }));
    const wetRows = normalizeDailyToScoreInput(daily, hourlyDay(date, { rainAtHour12: 5 }));

    // Hourly normalization itself: windMax comes from the same weighted-max
    // computation regardless of the separate rain array.
    expect(dryRows[0].windMax).toBe(20); // hour 9-21 daytime weight 1.0 -> 20*1.0
    expect(wetRows[0].windMax).toBe(20);
    expect(dryRows[0].rain).toBe(0);
    expect(wetRows[0].rain).toBe(5); // 5mm at hour 12, weight 1.0

    const dryScore = scoreSiteDay(dryRows[0]);
    const wetScore = scoreSiteDay(wetRows[0]);

    expect(dryScore.windPen).toBe(10); // 20 > 16 summer tier
    expect(wetScore.windPen).toBe(10);
    expect(dryScore.components.wind).toBe(wetScore.components.wind);

    expect(dryScore.rainPen).toBe(0);
    expect(wetScore.rainPen).toBe(5); // >= 4mm tier
  });

  it("daily-fallback path (no hourly data for the date): same wind/gust fields, different rain -> identical windPen, different rainPen", () => {
    const date = "2026-07-16";
    const dailyDry = {
      time: [date],
      temperature_2m_max: [15],
      precipitation_sum: [0],
      windspeed_10m_max: [20],
      windgusts_10m_max: [20],
      weathercode: [null],
    };
    const dailyWet = { ...dailyDry, precipitation_sum: [4] };

    // hourly is entirely absent (null) -> normalizeDailyToScoreInput falls
    // back to the raw daily.* fields for every field on this date.
    const dryRows = normalizeDailyToScoreInput(dailyDry, null);
    const wetRows = normalizeDailyToScoreInput(dailyWet, null);

    expect(dryRows[0].windMax).toBe(20);
    expect(wetRows[0].windMax).toBe(20);
    expect(dryRows[0].rain).toBe(0);
    expect(wetRows[0].rain).toBe(4);

    const dryScore = scoreSiteDay(dryRows[0]);
    const wetScore = scoreSiteDay(wetRows[0]);

    expect(dryScore.windPen).toBe(wetScore.windPen);
    expect(dryScore.components.wind).toBe(wetScore.components.wind);
    expect(dryScore.rainPen).toBe(0);
    expect(wetScore.rainPen).toBe(5);
  });
});
