// Ticket #428 — regression protection: issue #428 alleged windPen is
// multiplied by precipTimingMultiplier (i.e. that rain can suppress the
// wind component). The investigation (docs/ai/tasks/ticket-428/cc-report.md)
// found this premise is NOT reproducible against current source: windPen
// (src/lib/scoring.js scoreSiteDay, line 330) is computed from windPenRaw
// and cfg.windWeight only — it never reads rain, rainPenBase, or
// precipTimingMultiplier in any form. This file locks that independence
// down as an explicit, targeted regression so a future edit that
// accidentally introduces the coupling fails a test immediately.
import { describe, it, expect } from "vitest";
import { scoreSiteDay } from "./scoring";

const RAIN_VALUES = [0, 0.9, 1, 4]; // dry / sub-1mm / exactly-1mm tier / heavy tier

describe("scoring: wind component is independent of precipitation (Ticket #428)", () => {
  it("dry-windy day at 18 m/s: windPen and components.wind are identical across all rain values, summer", () => {
    const results = RAIN_VALUES.map((rain) =>
      scoreSiteDay({ tmax: 15, windMax: 18, windGust: 18, rain, date: "2026-07-15" })
    );

    for (const r of results) {
      expect(r.windPen).toBe(10); // 18 > 16 summer tier, weight 1.0
      expect(r.components.wind).toBe(-10);
    }

    // rainPen DOES vary with rain — proves the test isn't vacuously true
    // because wind is already saturated/unreachable.
    expect(results.map((r) => r.rainPen)).toEqual([0, 0, 2, 5]);
  });

  it("dry-windy day at 18 m/s: windPen and components.wind are identical across all rain values, winter", () => {
    const results = RAIN_VALUES.map((rain) =>
      scoreSiteDay({ tmax: 15, windMax: 18, windGust: 18, rain, date: "2026-01-15" })
    );

    for (const r of results) {
      expect(r.windPen).toBe(10); // 18 > 15 winter tier, weight 1.0
      expect(r.components.wind).toBe(-10);
    }

    expect(results.map((r) => r.rainPen)).toEqual([0, 0, 2, 5]);
  });

  it("isolates the rain-only delta on the RAW (unclamped) total, so 0..10 clamping cannot hide a wind regression", () => {
    // Both rain=0 and rain=4 clamp to points=0 here (10 base - 10 windPen
    // leaves no room), which is exactly why this asserts totalRaw/pointsRaw,
    // not the clamped total — a wind regression could otherwise hide behind
    // the floor exactly as it does for rain's own effect in this scenario.
    const dry = scoreSiteDay({ tmax: 15, windMax: 18, windGust: 18, rain: 0, date: "2026-07-15" });
    const wet = scoreSiteDay({ tmax: 15, windMax: 18, windGust: 18, rain: 4, date: "2026-07-15" });

    expect(dry.points).toBe(0);
    expect(wet.points).toBe(0); // both clamped — would mask a coupling bug if only `points` were checked

    expect(dry.totalRaw).toBe(0);
    expect(wet.totalRaw).toBe(-5);
    // The entire raw delta is attributable to rainPen (0 -> 5); wind
    // contributes zero of it.
    expect(dry.totalRaw - wet.totalRaw).toBe(wet.rainPen - dry.rainPen);
    expect(dry.windPen).toBe(wet.windPen);
  });

  it("calm control: windPen stays at its own (non-saturated) value across all rain values, summer and winter", () => {
    // windMax=3 is well under every wind-penalty tier in both seasons, so
    // this rules out "independence" being an artifact of wind already being
    // pinned at its own ceiling in the primary case above.
    const summer = RAIN_VALUES.map((rain) =>
      scoreSiteDay({ tmax: 15, windMax: 3, windGust: 3, rain, date: "2026-07-15" })
    );
    const winter = RAIN_VALUES.map((rain) =>
      scoreSiteDay({ tmax: 15, windMax: 3, windGust: 3, rain, date: "2026-01-15" })
    );

    for (const r of [...summer, ...winter]) {
      expect(r.windPen).toBe(0);
      // components.wind is `-windPen`, which yields -0 in JS when windPen
      // is 0 — strict equality (unlike toBe's Object.is) treats -0 === 0.
      expect(r.components.wind === 0).toBe(true);
    }
  });

  it("gust case: gustPen stays constant across all rain values (gustPenaltyPoints never reads rain)", () => {
    // windMax=10, windGust=16 => diff=6 => summer base=2, winter round(2*1.6)=3
    const summer = RAIN_VALUES.map((rain) =>
      scoreSiteDay({ tmax: 15, windMax: 10, windGust: 16, rain, date: "2026-07-15" })
    );
    const winter = RAIN_VALUES.map((rain) =>
      scoreSiteDay({ tmax: 15, windMax: 10, windGust: 16, rain, date: "2026-01-15" })
    );

    for (const r of summer) {
      expect(r.gustPen).toBe(2);
      expect(r.components.gust).toBe(-2);
    }
    for (const r of winter) {
      expect(r.gustPen).toBe(3);
      expect(r.components.gust).toBe(-3);
    }
  });

  it("the 1mm rounding boundary (0.94 vs 0.95) flips rainPen but never touches windPen — existing round1() semantics, unchanged", () => {
    const base = { tmax: 15, windMax: 18, windGust: 18, date: "2026-07-15" };
    const justUnder = scoreSiteDay({ ...base, rain: 0.94 }); // round1 -> 0.9, < 1mm tier
    const justOver = scoreSiteDay({ ...base, rain: 0.95 }); // round1 -> 1.0 (Math.round rounds .5 up), 1mm tier

    expect(justUnder.rainPen).toBe(0);
    expect(justOver.rainPen).toBe(2);

    // The one thing that must NOT move across this boundary: wind.
    expect(justUnder.windPen).toBe(justOver.windPen);
    expect(justUnder.components.wind).toBe(justOver.components.wind);
  });
});
