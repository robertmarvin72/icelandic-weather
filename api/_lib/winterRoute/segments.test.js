// @vitest-environment node
//
// ETA follow-up (#486) — tests for the new approxDistanceFromStartKm
// derivation. Values are cross-checked against a manual cumulative-sum of
// the same retained route-segments.csv lengths, independent of the
// production code's own loop.
import { describe, it, expect } from "vitest";
import { WINTER_ROUTE_SEGMENTS, WINTER_ROUTE_FORECAST_POINTS } from "./segments.js";

function manualCumulativeStartKm(idButur) {
  let total = 0;
  for (const seg of WINTER_ROUTE_SEGMENTS) {
    if (seg.idButur === idButur) return total;
    total += seg.lengthKm;
  }
  throw new Error(`unknown idButur ${idButur}`);
}

describe("WINTER_ROUTE_FORECAST_POINTS — approxDistanceFromStartKm", () => {
  it("every point has a finite, non-negative, strictly increasing distance in P1..P6 order", () => {
    let previous = -1;
    for (const p of WINTER_ROUTE_FORECAST_POINTS) {
      expect(typeof p.approxDistanceFromStartKm).toBe("number");
      expect(Number.isFinite(p.approxDistanceFromStartKm)).toBe(true);
      expect(p.approxDistanceFromStartKm).toBeGreaterThan(previous);
      previous = p.approxDistanceFromStartKm;
    }
  });

  it("each point's distance equals its own segment's cumulative-start-km plus half that segment's length (midpoint)", () => {
    for (const p of WINTER_ROUTE_FORECAST_POINTS) {
      const segment = WINTER_ROUTE_SEGMENTS.find((s) => s.idButur === p.nearIdButur);
      const expectedMidpoint = manualCumulativeStartKm(p.nearIdButur) + segment.lengthKm / 2;
      expect(p.approxDistanceFromStartKm).toBeCloseTo(expectedMidpoint, 6);
    }
  });

  it("the last point's distance is less than the full corridor length (it is inside its segment, not past the end)", () => {
    const totalKm = WINTER_ROUTE_SEGMENTS.reduce((sum, s) => sum + s.lengthKm, 0);
    const lastPoint = WINTER_ROUTE_FORECAST_POINTS[WINTER_ROUTE_FORECAST_POINTS.length - 1];
    expect(lastPoint.approxDistanceFromStartKm).toBeLessThan(totalKm);
    expect(totalKm).toBeCloseTo(175.64, 2); // matches #483's own independently-verified corridor length
  });
});
