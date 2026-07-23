import { describe, it, expect } from "vitest";
import { calcMetrics, classifyMetrics, classifyDirection } from "./comparisonUtils";

// --- calcMetrics -------------------------------------------------------

describe("calcMetrics", () => {
  it("returns null for empty rows", () => {
    expect(calcMetrics([])).toBeNull();
    expect(calcMetrics(null)).toBeNull();
  });

  it("averages wind and temp, sums rain over first 3 days", () => {
    const rows = [
      { windMax: 4, rain: 1, tmax: 14 },
      { windMax: 6, rain: 3, tmax: 16 },
      { windMax: 8, rain: 2, tmax: 12 },
      { windMax: 99, rain: 99, tmax: 99 }, // 4th day must be ignored
    ];
    const m = calcMetrics(rows);
    expect(m.avgWind).toBeCloseTo(6);
    expect(m.totalRain).toBeCloseTo(6);
    expect(m.avgHighTemp).toBeCloseTo(14);
  });
});

// --- classifyMetrics ---------------------------------------------------

function m(avgWind, totalRain, avgHighTemp) {
  return { avgWind, totalRain, avgHighTemp };
}

describe("classifyMetrics", () => {
  it("returns strength='mixed', worseningsCount=0 when null metrics", () => {
    const r = classifyMetrics(null, null);
    expect(r.strength).toBe("weak"); // null guard default
    expect(r.worseningsCount).toBe(0);
  });

  it("strong: 2+ improvements, 0 worsenings", () => {
    // nearby: calmer wind AND less rain
    const r = classifyMetrics(m(10, 8, 15), m(5, 4, 15));
    expect(r.strength).toBe("strong");
    expect(r.primaryKey).toBe("wind");
    expect(r.worseningsCount).toBe(0);
  });

  it("decent: 1 improvement, 0 worsenings", () => {
    const r = classifyMetrics(m(10, 3, 15), m(5, 3, 15));
    expect(r.strength).toBe("decent");
    expect(r.primaryKey).toBe("wind");
    expect(r.worseningsCount).toBe(0);
  });

  it("weak: 1 improvement AND 1 worsening", () => {
    // nearby: calmer wind but more rain
    const r = classifyMetrics(m(10, 1, 15), m(5, 5, 15));
    expect(r.strength).toBe("weak");
    expect(r.worseningsCount).toBe(1);
  });

  it("mixed: no improvements above threshold", () => {
    const r = classifyMetrics(m(6, 2, 15), m(6.1, 2.1, 14.9));
    expect(r.strength).toBe("mixed");
    expect(r.primaryKey).toBeNull();
  });

  it("mixed with worsenings when nearby is clearly worse on ≥1 metric", () => {
    // nearby wind much higher than current
    const r = classifyMetrics(m(6, 2, 15), m(9, 2, 15));
    expect(r.strength).toBe("mixed");
    expect(r.worseningsCount).toBeGreaterThanOrEqual(1);
  });
});

// --- classifyDirection -----------------------------------------------

describe("classifyDirection", () => {
  // Requirements 1 & 10: strong/decent → nearby_better → allow move recommendation
  it("returns nearby_better for strength=strong", () => {
    expect(classifyDirection("strong", 0)).toBe("nearby_better");
  });

  it("returns nearby_better for strength=decent", () => {
    expect(classifyDirection("decent", 0)).toBe("nearby_better");
  });

  // Requirement 2: Örlítið betra → no move recommendation
  it("returns similar for strength=weak (mixed improvement — Örlítið betra)", () => {
    expect(classifyDirection("weak", 0)).toBe("similar");
    expect(classifyDirection("weak", 1)).toBe("similar");
  });

  // Requirement 3 & 7: similar/mixed with no clear winner → no move recommendation
  it("returns similar for strength=mixed with no worsenings (within thresholds)", () => {
    expect(classifyDirection("mixed", 0)).toBe("similar");
  });

  // Requirement 4: current campsite better → stay recommendation
  it("returns current_better for strength=mixed with worsenings", () => {
    expect(classifyDirection("mixed", 1)).toBe("current_better");
    expect(classifyDirection("mixed", 2)).toBe("current_better");
  });
});

// --- Laugarvatn–Flúðir regression (Requirement 5) --------------------

describe("Laugarvatn–Flúðir regression", () => {
  const laugarvatn = m(6.5, 0.8, 15.7);
  const fludir = m(6.7, 2.4, 14.6);

  it("classifyMetrics returns mixed with 0 worsenings (all differences below threshold)", () => {
    // Wind diff:  6.5 - 6.7 = -0.2  (threshold ±1.5 — not met either way)
    // Rain diff:  0.8 - 2.4 = -1.6  (threshold ±2 — not met either way)
    // Temp diff:  14.6 - 15.7 = -1.1 (threshold ±1.5 — not met either way)
    const r = classifyMetrics(laugarvatn, fludir);
    expect(r.strength).toBe("mixed");
    expect(r.worseningsCount).toBe(0);
  });

  it("direction resolves to similar — must NOT recommend moving", () => {
    const { strength, worseningsCount } = classifyMetrics(laugarvatn, fludir);
    expect(classifyDirection(strength, worseningsCount)).toBe("similar");
  });
});
