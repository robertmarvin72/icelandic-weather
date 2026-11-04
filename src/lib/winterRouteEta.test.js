import { describe, it, expect } from "vitest";
import { computeEta, resolvePointAtDeparture, ASSUMED_AVERAGE_SPEED_KMH } from "./winterRouteEta.js";

describe("computeEta", () => {
  it("computes a correct raw arrival instant from distance and the assumed speed", () => {
    const { rawArrivalMs } = computeEta("2026-11-04T08:00", 70, 70);
    expect(rawArrivalMs).toBe(Date.parse("2026-11-04T09:00:00Z"));
  });

  it("rounds UP to the next whole forecast hour at or after the raw arrival (never floors, never wraps)", () => {
    const { forecastHour } = computeEta("2026-11-04T08:00", 35, 70);
    expect(forecastHour).toBe("2026-11-04T09:00");
  });

  it("an arrival exactly on the hour is not bumped to the next hour", () => {
    const { forecastHour } = computeEta("2026-11-04T08:00", 70, 70);
    expect(forecastHour).toBe("2026-11-04T09:00");
  });

  it("zero distance arrives at the departure hour itself", () => {
    const { forecastHour, rawArrivalMs } = computeEta("2026-11-04T08:00", 0, 70);
    expect(forecastHour).toBe("2026-11-04T08:00");
    expect(rawArrivalMs).toBe(Date.parse("2026-11-04T08:00:00Z"));
  });

  it("a long distance correctly crosses a day boundary", () => {
    const { forecastHour } = computeEta("2026-11-04T23:00", 175, 70);
    expect(forecastHour).toBe("2026-11-05T02:00");
  });

  it("uses ASSUMED_AVERAGE_SPEED_KMH (70) by default", () => {
    const withDefault = computeEta("2026-11-04T08:00", 70);
    const withExplicit = computeEta("2026-11-04T08:00", 70, ASSUMED_AVERAGE_SPEED_KMH);
    expect(ASSUMED_AVERAGE_SPEED_KMH).toBe(70);
    expect(withDefault).toEqual(withExplicit);
  });

  it("returns nulls (never a guessed value) for missing/invalid distance", () => {
    expect(computeEta("2026-11-04T08:00", null)).toEqual({ rawArrivalMs: null, forecastHour: null });
    expect(computeEta("2026-11-04T08:00", undefined)).toEqual({ rawArrivalMs: null, forecastHour: null });
    expect(computeEta("2026-11-04T08:00", NaN)).toEqual({ rawArrivalMs: null, forecastHour: null });
    expect(computeEta("2026-11-04T08:00", -5)).toEqual({ rawArrivalMs: null, forecastHour: null });
  });

  it("returns nulls for a malformed departure hour string", () => {
    expect(computeEta("not-a-date", 70)).toEqual({ rawArrivalMs: null, forecastHour: null });
    expect(computeEta(null, 70)).toEqual({ rawArrivalMs: null, forecastHour: null });
  });

  it("returns nulls for an invalid speed", () => {
    expect(computeEta("2026-11-04T08:00", 70, 0)).toEqual({ rawArrivalMs: null, forecastHour: null });
    expect(computeEta("2026-11-04T08:00", 70, -10)).toEqual({ rawArrivalMs: null, forecastHour: null });
  });
});

// #489 — resolvePointAtDeparture() is the exact logic ForecastCard already
// used inline before #489 factored it out so the new route summary reuses
// it; these tests pin the behavior ForecastCard's own tests already
// exercise indirectly through the rendered UI.
describe("resolvePointAtDeparture", () => {
  const hours = ["2026-11-04T08:00", "2026-11-04T09:00", "2026-11-04T10:00"];

  it("resolves hourIndex/hasHour for an available point with a valid distance", () => {
    const point = { available: true, hours, approxDistanceFromStartKm: 70 };
    const result = resolvePointAtDeparture(point, "2026-11-04T08:00");
    expect(result.hasHour).toBe(true);
    expect(result.forecastHour).toBe("2026-11-04T09:00");
    expect(result.hourIndex).toBe(1);
  });

  it("an unavailable point never attempts a resolution", () => {
    const point = { available: false, hours, approxDistanceFromStartKm: 70 };
    const result = resolvePointAtDeparture(point, "2026-11-04T08:00");
    expect(result).toEqual({ rawArrivalMs: null, forecastHour: null, hourIndex: -1, hasHour: false });
  });

  it("a resolved hour outside point.hours is hasHour:false, not a wrapped/guessed index", () => {
    const point = { available: true, hours, approxDistanceFromStartKm: 24 * 70 };
    const result = resolvePointAtDeparture(point, "2026-11-04T08:00");
    expect(result.hasHour).toBe(false);
    expect(result.hourIndex).toBe(-1);
  });

  it("handles a null point gracefully", () => {
    expect(resolvePointAtDeparture(null, "2026-11-04T08:00")).toEqual({
      rawArrivalMs: null,
      forecastHour: null,
      hourIndex: -1,
      hasHour: false,
    });
  });
});
