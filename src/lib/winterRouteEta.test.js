import { describe, it, expect } from "vitest";
import { computeEta, ASSUMED_AVERAGE_SPEED_KMH } from "./winterRouteEta.js";

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
