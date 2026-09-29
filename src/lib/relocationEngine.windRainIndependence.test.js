// Ticket #428 — Route Planner consumer verification. relocationEngine.js
// (confirmed during this ticket's audit) normalizes each candidate's
// forecast, attaches shelter, then calls scoreDaysWithRainStreak() — which
// internally spreads the real scoreSiteDay() per day before applying the
// separate rain-streak penalty. This file distinguishes the underlying,
// per-day wind component (windPen / components.wind, from scoreSiteDay)
// from the streak/aggregate outcome (points / pointsRaw / rainStreakPen,
// which legitimately DOES change day to day as the wet streak grows) — the
// two must not be conflated when reading this test.
import { describe, it, expect } from "vitest";
import { scoreDaysWithRainStreak } from "./scoring";

describe("scoreDaysWithRainStreak (Route Planner path): wind component is fixed while the streak/aggregate outcome legitimately varies (Ticket #428)", () => {
  it("a 3-day wet streak followed by a dry day: windPen/components.wind never move, while points/rainStreakPen do", () => {
    const days = [
      { date: "2026-07-01", tmax: 15, windMax: 8, windGust: 8, rain: 5 }, // wet, streak=1
      { date: "2026-07-02", tmax: 15, windMax: 8, windGust: 8, rain: 5 }, // wet, streak=2
      { date: "2026-07-03", tmax: 15, windMax: 8, windGust: 8, rain: 5 }, // wet, streak=3
      { date: "2026-07-04", tmax: 15, windMax: 8, windGust: 8, rain: 0 }, // dry, streak resets
    ];

    const scored = scoreDaysWithRainStreak(days);

    // The underlying wind component: identical every day. windMax=8 in
    // summer => windPenaltyPoints=1, and nothing about the rain streak can
    // reach it (scoreSiteDay is computed fresh per day from that day's own
    // wind fields only).
    for (const row of scored) {
      expect(row.windPen).toBe(1);
      expect(row.components.wind).toBe(-1);
    }

    // The streak/aggregate outcome: legitimately different every day —
    // this is the rain-streak penalty (a real, intentional route-planner
    // feature) doing its job, NOT a wind regression.
    expect(scored.map((r) => r.rainStreakPen)).toEqual([0, 1, 2, 0]);
    // tmax=15 => basePts=10; windPen=1 fixed; rainPen 5 on wet days, 0 dry;
    // pointsRaw = 10 - 1 - rainPen - rainStreakPen (see scoring.js).
    expect(scored.map((r) => r.pointsRaw)).toEqual([4, 3, 2, 9]);
    expect(scored.map((r) => r.points)).toEqual([4, 3, 2, 9]);
  });

  it("two otherwise-identical wet sequences that differ only in wind: the streak penalty is identical, only the wind-driven points differ", () => {
    const wetDays = (windMax) => [
      { date: "2026-07-01", tmax: 15, windMax, windGust: windMax, rain: 5 },
      { date: "2026-07-02", tmax: 15, windMax, windGust: windMax, rain: 5 },
    ];

    const calm = scoreDaysWithRainStreak(wetDays(3)); // windPenaltyPoints(3,summer)=0
    const windy = scoreDaysWithRainStreak(wetDays(18)); // windPenaltyPoints(18,summer)=10

    // Same rain, same streak progression -> identical rainStreakPen in both.
    expect(calm.map((r) => r.rainStreakPen)).toEqual(windy.map((r) => r.rainStreakPen));
    // The wind component correctly differs by exactly the wind penalty gap
    // (10 - 0 = 10) on every day, and nothing else does.
    for (let i = 0; i < calm.length; i++) {
      expect(calm[i].windPen).toBe(0);
      expect(windy[i].windPen).toBe(10);
      expect(calm[i].pointsRaw - windy[i].pointsRaw).toBe(10);
    }
  });
});
