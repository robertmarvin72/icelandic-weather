import { describe, it, expect } from "vitest";
import {
  rainStreakPenaltyPoints,
  scoreDaysWithRainStreak,
} from "./scoring";

describe("Rain streak logic v1 (safe curve)", () => {
  it("rainStreakPenaltyPoints uses safe curve and caps at 4", () => {
    expect(rainStreakPenaltyPoints(0)).toBe(0);
    expect(rainStreakPenaltyPoints(1)).toBe(0);
    expect(rainStreakPenaltyPoints(2)).toBe(1);
    expect(rainStreakPenaltyPoints(3)).toBe(2);
    expect(rainStreakPenaltyPoints(4)).toBe(3);
    expect(rainStreakPenaltyPoints(5)).toBe(4);
    expect(rainStreakPenaltyPoints(10)).toBe(4);
  });

  it("scoreDaysWithRainStreak increments streak on wet days and resets on dry day", () => {
    const days = [
      { date: "2026-01-01", tmax: 12, rain: 0, windMax: 4, windGust: 4 }, // dry
      { date: "2026-01-02", tmax: 12, rain: 3, windMax: 4, windGust: 4 }, // wet (1)
      { date: "2026-01-03", tmax: 12, rain: 5, windMax: 4, windGust: 4 }, // wet (2)
      { date: "2026-01-04", tmax: 12, rain: 0, windMax: 4, windGust: 4 }, // dry reset
      { date: "2026-01-05", tmax: 12, rain: 4, windMax: 4, windGust: 4 }, // wet (1)
    ];

    const out = scoreDaysWithRainStreak(days, { wetThresholdMm: 3 });

    expect(out.map((d) => d.wetDay)).toEqual([false, true, true, false, true]);
    expect(out.map((d) => d.rainStreak)).toEqual([0, 1, 2, 0, 1]);
    expect(out.map((d) => d.rainStreakPen)).toEqual([0, 0, 1, 0, 0]);
  });

  it("scoreDaysWithRainStreak applies penalty to points (never below 0)", () => {
    const days = [
      { date: "2026-01-01", tmax: 6, rain: 3, windMax: 4, windGust: 4 },  // base about 2
      { date: "2026-01-02", tmax: 6, rain: 3, windMax: 4, windGust: 4 },  // streak 2 => -1
      { date: "2026-01-03", tmax: 6, rain: 3, windMax: 4, windGust: 4 },  // streak 3 => -2
      { date: "2026-01-04", tmax: 6, rain: 3, windMax: 4, windGust: 4 },  // streak 4 => -3
      { date: "2026-01-05", tmax: 6, rain: 3, windMax: 4, windGust: 4 },  // streak 5 => -4 cap
    ];

    const out = scoreDaysWithRainStreak(days, { wetThresholdMm: 3 });

    // points should be non-increasing and clamped [0..10]
    for (let i = 0; i < out.length; i++) {
      expect(out[i].points).toBeGreaterThanOrEqual(0);
      expect(out[i].points).toBeLessThanOrEqual(10);
      if (i > 0) expect(out[i].points).toBeLessThanOrEqual(out[i - 1].points);
    }

    // explicitly confirm cap kicks in at day 5+
    expect(out[4].rainStreakPen).toBe(4);
  });
});