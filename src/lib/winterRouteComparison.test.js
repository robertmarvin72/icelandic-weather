// #490 — departure-time comparison tests.
import { describe, it, expect } from "vitest";
import {
  offsetHourString,
  computeDepartureOption,
  computeDepartureOptionSet,
  COMPARISON_UNAVAILABLE_REASON,
} from "./winterRouteComparison.js";

describe("offsetHourString", () => {
  it("adds hours with real UTC arithmetic", () => {
    expect(offsetHourString("2026-11-04T10:00", 2)).toBe("2026-11-04T12:00");
    expect(offsetHourString("2026-11-04T10:00", -2)).toBe("2026-11-04T08:00");
  });

  it("crosses a UTC day boundary correctly in both directions", () => {
    expect(offsetHourString("2026-11-04T23:00", 2)).toBe("2026-11-05T01:00");
    expect(offsetHourString("2026-11-04T01:00", -2)).toBe("2026-11-03T23:00");
  });

  it("returns null for a missing/malformed base hour", () => {
    expect(offsetHourString(null, 2)).toBeNull();
    expect(offsetHourString("not-a-date", 2)).toBeNull();
  });
});

// Points window: 24 hours starting at 2026-11-04T10:00.
function hoursFrom(startHour = "2026-11-04T10:00", count = 24) {
  const startMs = Date.parse(`${startHour}:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startMs + i * 3600000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`;
  });
}

function makePoint(id, distanceKm, overrides = {}) {
  const hours = hoursFrom();
  return {
    id,
    labelIs: `Punktur ${id}`,
    labelEn: `Point ${id}`,
    approxDistanceFromStartKm: distanceKm,
    available: true,
    hours,
    series: {
      temperature_2m: hours.map(() => -5),
      wind_speed_10m: hours.map(() => 1),
      wind_gusts_10m: hours.map(() => 1),
      precipitation: hours.map(() => 0),
      weather_code: hours.map(() => 0),
    },
    ...overrides,
  };
}

const SIX_POINTS = [0, 0, 0, 0, 0, 0].map((d, i) => makePoint(`P${i + 1}`, d));
const AVAILABLE_HOURS = hoursFrom();

describe("computeDepartureOption", () => {
  it("is available when all six points resolve and all three metrics have full coverage", () => {
    const result = computeDepartureOption("2026-11-04T10:00", AVAILABLE_HOURS, SIX_POINTS);
    expect(result.available).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.summary.maxGust.validCount).toBe(6);
  });

  it("reason NOT_UPCOMING: departure is null or not in availableHours (past/out of window)", () => {
    expect(computeDepartureOption(null, AVAILABLE_HOURS, SIX_POINTS).reason).toBe(
      COMPARISON_UNAVAILABLE_REASON.NOT_UPCOMING
    );
    expect(computeDepartureOption("2026-11-03T10:00", AVAILABLE_HOURS, SIX_POINTS).reason).toBe(
      COMPARISON_UNAVAILABLE_REASON.NOT_UPCOMING
    );
  });

  it("reason ARRIVAL_OUTSIDE_WINDOW: a point's resolved arrival is outside its fetched hours", () => {
    const points = [...SIX_POINTS.slice(0, 5), makePoint("P6", 24 * 70)]; // ~24h away, out of the 24h window
    const result = computeDepartureOption("2026-11-04T10:00", AVAILABLE_HOURS, points);
    expect(result.available).toBe(false);
    expect(result.reason).toBe(COMPARISON_UNAVAILABLE_REASON.ARRIVAL_OUTSIDE_WINDOW);
  });

  it("reason POINT_UNAVAILABLE: a point itself is unavailable", () => {
    const points = [...SIX_POINTS.slice(0, 5), { ...makePoint("P6", 0), available: false }];
    const result = computeDepartureOption("2026-11-04T10:00", AVAILABLE_HOURS, points);
    expect(result.reason).toBe(COMPARISON_UNAVAILABLE_REASON.POINT_UNAVAILABLE);
  });

  it("priority: ARRIVAL_OUTSIDE_WINDOW wins over POINT_UNAVAILABLE when both occur", () => {
    const points = [
      makePoint("P1", 24 * 70), // outside window
      { ...makePoint("P2", 0), available: false }, // unavailable
      ...SIX_POINTS.slice(2),
    ];
    const result = computeDepartureOption("2026-11-04T10:00", AVAILABLE_HOURS, points);
    expect(result.reason).toBe(COMPARISON_UNAVAILABLE_REASON.ARRIVAL_OUTSIDE_WINDOW);
  });

  it("reason METRIC_GAP: all six points resolve, but a metric has a real gap for one point", () => {
    const points = SIX_POINTS.map((p) => ({ ...p, series: { ...p.series } }));
    points[2].series = { ...points[2].series, temperature_2m: [...points[2].series.temperature_2m] };
    points[2].series.temperature_2m[0] = null;
    const result = computeDepartureOption("2026-11-04T10:00", AVAILABLE_HOURS, points);
    expect(result.reason).toBe(COMPARISON_UNAVAILABLE_REASON.METRIC_GAP);
  });

  it("a real 0 value is valid and never treated as a gap", () => {
    const points = SIX_POINTS.map((p) => ({ ...p, series: { ...p.series, precipitation: p.series.precipitation.map(() => 0) } }));
    const result = computeDepartureOption("2026-11-04T10:00", AVAILABLE_HOURS, points);
    expect(result.available).toBe(true);
    expect(result.summary.maxPrecip.value).toBe(0);
  });

  it("availability requires validCount===6, not merely !isPartial (S1a) — 5 of 6 points is unavailable for the comparison", () => {
    const points = SIX_POINTS.slice(0, 5); // only 5 points at all
    const result = computeDepartureOption("2026-11-04T10:00", AVAILABLE_HOURS, points);
    expect(result.available).toBe(false);
    expect(result.reason).toBe(COMPARISON_UNAVAILABLE_REASON.METRIC_GAP);
  });
});

describe("computeDepartureOptionSet", () => {
  it("returns three options in fixed −2/0/+2 order, baseline available, others may legitimately be unavailable at the window edge", () => {
    const options = computeDepartureOptionSet("2026-11-04T10:00", AVAILABLE_HOURS, SIX_POINTS);
    expect(options.map((o) => o.offsetHours)).toEqual([-2, 0, 2]);
    expect(options[0].departureHour).toBe("2026-11-04T08:00");
    expect(options[1].departureHour).toBe("2026-11-04T10:00");
    expect(options[2].departureHour).toBe("2026-11-04T12:00");
  });

  it("the −2h option is unavailable (NOT_UPCOMING) when the baseline is the very first available hour — a real, honest data-edge result, not a bug", () => {
    const options = computeDepartureOptionSet(AVAILABLE_HOURS[0], AVAILABLE_HOURS, SIX_POINTS);
    expect(options[0].available).toBe(false);
    expect(options[0].reason).toBe(COMPARISON_UNAVAILABLE_REASON.NOT_UPCOMING);
    expect(options[1].available).toBe(true); // baseline itself still fine
  });

  it("an unavailable baseline does not prevent −2h/+2h from being evaluated independently", () => {
    const points = [...SIX_POINTS.slice(0, 5), { ...makePoint("P6", 0), available: false }];
    // Baseline away from the window edge so −2h/+2h both stay within
    // availableHours and are genuinely evaluated (not short-circuited by
    // their own NOT_UPCOMING edge case).
    const options = computeDepartureOptionSet("2026-11-04T12:00", AVAILABLE_HOURS, points);
    expect(options[1].available).toBe(false); // baseline itself unavailable
    // -2h/+2h independently computed with the same (still-broken) points fixture — also unavailable here, but via their own evaluation, not short-circuited.
    expect(options[0].reason).toBe(COMPARISON_UNAVAILABLE_REASON.POINT_UNAVAILABLE);
    expect(options[2].reason).toBe(COMPARISON_UNAVAILABLE_REASON.POINT_UNAVAILABLE);
  });

  it("returns three null-departure, unavailable options when selectedHour itself is null (no baseline chosen yet)", () => {
    const options = computeDepartureOptionSet(null, AVAILABLE_HOURS, SIX_POINTS);
    expect(options.every((o) => o.available === false)).toBe(true);
    expect(options.every((o) => o.departureHour === null)).toBe(true);
  });

  it("each available option's extrema use the points' OWN arrival times for THAT departure, never one shared time", () => {
    // P1 has distance 0 so its resolved hour always equals the departure
    // itself; give it a distinctive value per hour to prove each option
    // reads its own departure's slot.
    const hours = hoursFrom();
    const distinctP1 = {
      ...makePoint("P1", 0),
      series: { ...makePoint("P1", 0).series, temperature_2m: hours.map((_, i) => -100 + i) },
    };
    const points = [distinctP1, ...SIX_POINTS.slice(1)];
    const options = computeDepartureOptionSet("2026-11-04T10:00", AVAILABLE_HOURS, points);
    // Baseline departure is index 0 of hours -> P1 temp = -100.
    // +2h departure is index 2 -> P1 temp = -98. Both are the overall min
    // (other points fixed at -5), so the summary winner differs per option.
    expect(options[1].summary.minTemp.value).toBe(-100);
    expect(options[2].summary.minTemp.value).toBe(-98);
  });
});
