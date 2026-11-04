// #489 — route-level summary tests. Fixtures build the forecast points in
// the same shape api/winter-route.js's buildForecastPayload() produces.
import { describe, it, expect } from "vitest";
import { computeWeatherExtremaSummary, computeActiveNoticeSegmentCount } from "./winterRouteSummary.js";

const DEPARTURE = "2026-11-04T08:00";

function hoursFrom(offset, count = 24) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.parse(`${DEPARTURE}:00Z`) + (offset + i) * 3600000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`;
  });
}

// distanceKm chosen so each point resolves to a distinct, predictable hour
// at 70 km/h: 0km -> +0h, 70km -> +1h, 140km -> +2h, etc.
function makePoint(id, distanceKm, overrides = {}) {
  const hours = hoursFrom(0, 6); // a short, deterministic 6-hour window
  return {
    id,
    labelIs: `Punktur ${id}`,
    labelEn: `Point ${id}`,
    nearIdButur: 1,
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

describe("computeWeatherExtremaSummary", () => {
  it("picks the max gust/precip and min temp across six points, each at its OWN resolved hour", () => {
    const p1 = makePoint("P1", 0);
    p1.series.wind_gusts_10m[0] = 20; // hour index 0 (distance 0 -> +0h)
    const p2 = makePoint("P2", 70);
    p2.series.precipitation[1] = 5.5; // hour index 1 (distance 70 -> +1h)
    const p3 = makePoint("P3", 140);
    p3.series.temperature_2m[2] = -20; // hour index 2 (distance 140 -> +2h)
    const p4 = makePoint("P4", 0);
    const p5 = makePoint("P5", 0);
    const p6 = makePoint("P6", 0);

    const summary = computeWeatherExtremaSummary([p1, p2, p3, p4, p5, p6], DEPARTURE);

    expect(summary.maxGust.value).toBe(20);
    expect(summary.maxGust.point.id).toBe("P1");
    expect(summary.maxGust.isMissing).toBe(false);

    expect(summary.maxPrecip.value).toBe(5.5);
    expect(summary.maxPrecip.point.id).toBe("P2");

    expect(summary.minTemp.value).toBe(-20);
    expect(summary.minTemp.point.id).toBe("P3");
  });

  it("a tie keeps the FIRST point in fixed route order", () => {
    const p1 = makePoint("P1", 0);
    p1.series.wind_gusts_10m[0] = 15;
    const p2 = makePoint("P2", 0);
    p2.series.wind_gusts_10m[0] = 15; // exact tie with P1
    const points = [p1, p2, makePoint("P3", 0), makePoint("P4", 0), makePoint("P5", 0), makePoint("P6", 0)];

    const summary = computeWeatherExtremaSummary(points, DEPARTURE);
    expect(summary.maxGust.value).toBe(15);
    expect(summary.maxGust.point.id).toBe("P1");
  });

  it("null/undefined/NaN values are real gaps, never treated as 0", () => {
    const p1 = makePoint("P1", 0);
    p1.series.precipitation[0] = null;
    const p2 = makePoint("P2", 0);
    p2.series.precipitation[0] = undefined;
    const p3 = makePoint("P3", 0);
    p3.series.precipitation[0] = NaN;
    const p4 = makePoint("P4", 0);
    p4.series.precipitation[0] = 0; // a real zero, must still count
    const points = [p1, p2, p3, p4, makePoint("P5", 0), makePoint("P6", 0)];
    points[4].series.precipitation[0] = null;
    points[5].series.precipitation[0] = null;

    const summary = computeWeatherExtremaSummary(points, DEPARTURE);
    expect(summary.maxPrecip.isMissing).toBe(false);
    expect(summary.maxPrecip.value).toBe(0);
    expect(summary.maxPrecip.point.id).toBe("P4");
    expect(summary.maxPrecip.validCount).toBe(1);
    expect(summary.maxPrecip.isPartial).toBe(true);
  });

  it("fewer than six valid points is marked partial, with the real valid count", () => {
    const points = [makePoint("P1", 0), makePoint("P2", 0), { ...makePoint("P3", 0), available: false }];
    const summary = computeWeatherExtremaSummary(points, DEPARTURE);
    expect(summary.minTemp.isPartial).toBe(true);
    expect(summary.minTemp.validCount).toBe(2);
  });

  it("zero valid points across all six is missing, not a guessed/zero value", () => {
    const points = [1, 2, 3, 4, 5, 6].map((n) => ({ ...makePoint(`P${n}`, 0), available: false }));
    const summary = computeWeatherExtremaSummary(points, DEPARTURE);
    expect(summary.maxGust.isMissing).toBe(true);
    expect(summary.maxGust.value).toBeNull();
    expect(summary.maxGust.point).toBeNull();
  });

  it("an ETA that resolves outside the point's fetched window contributes no value for that point", () => {
    const farPoint = makePoint("P1", 24 * 70); // ~24h away, outside the 6-hour fixture window
    const points = [farPoint, makePoint("P2", 0), makePoint("P3", 0), makePoint("P4", 0), makePoint("P5", 0), makePoint("P6", 0)];
    const summary = computeWeatherExtremaSummary(points, DEPARTURE);
    expect(summary.minTemp.validCount).toBe(5);
    expect(summary.minTemp.isPartial).toBe(true);
  });

  it("a missing/null distance contributes no value for that point, never a guess", () => {
    const points = [makePoint("P1", null), makePoint("P2", 0), makePoint("P3", 0), makePoint("P4", 0), makePoint("P5", 0), makePoint("P6", 0)];
    const summary = computeWeatherExtremaSummary(points, DEPARTURE);
    expect(summary.minTemp.validCount).toBe(5);
  });

  it("handles a UTC day boundary correctly (no wrap, real date arithmetic)", () => {
    const lateDeparture = "2026-11-04T23:00";
    const hours = [
      "2026-11-04T23:00",
      "2026-11-05T00:00",
      "2026-11-05T01:00",
      "2026-11-05T02:00",
      "2026-11-05T03:00",
      "2026-11-05T04:00",
    ];
    const point = {
      id: "P1",
      labelIs: "P1",
      labelEn: "P1",
      approxDistanceFromStartKm: 140, // +2h -> 2026-11-05T01:00
      available: true,
      hours,
      series: {
        temperature_2m: [0, 0, -9, 0, 0, 0],
        wind_speed_10m: hours.map(() => 1),
        wind_gusts_10m: hours.map(() => 1),
        precipitation: hours.map(() => 0),
        weather_code: hours.map(() => 0),
      },
    };
    const summary = computeWeatherExtremaSummary([point], lateDeparture);
    expect(summary.minTemp.value).toBe(-9);
    expect(summary.minTemp.hourString).toBe("2026-11-05T01:00");
  });

  it("no departure selected yet (null) resolves every point to missing, matching the cards' own loading state", () => {
    const points = [1, 2, 3, 4, 5, 6].map((n) => makePoint(`P${n}`, 0));
    const summary = computeWeatherExtremaSummary(points, null);
    expect(summary.maxGust.isMissing).toBe(true);
    expect(summary.maxPrecip.isMissing).toBe(true);
    expect(summary.minTemp.isMissing).toBe(true);
  });

  it("an empty/undefined points array is a clean missing result, not a crash", () => {
    expect(computeWeatherExtremaSummary([], DEPARTURE).maxGust.isMissing).toBe(true);
    expect(computeWeatherExtremaSummary(undefined, DEPARTURE).maxGust.isMissing).toBe(true);
  });
});

function makeSegment(idButur, notices = []) {
  return { idButur, notices };
}

const OK_ROAD_META = { pointsAvailable: true, pointsFeedUnavailableOrStale: false, stale: false };

describe("computeActiveNoticeSegmentCount", () => {
  it("counts unique segments with at least one ACTIVE notice", () => {
    const segments = [
      makeSegment(1, [{ status: "active" }]),
      makeSegment(2, [{ status: "expired" }]),
      makeSegment(3, [{ status: "active" }, { status: "expired" }]),
      makeSegment(4, []),
    ];
    expect(computeActiveNoticeSegmentCount(segments, OK_ROAD_META)).toEqual({ count: 2, confirmed: true });
  });

  it("two active notices on the SAME segment count once", () => {
    const segments = [makeSegment(1, [{ status: "active" }, { status: "active" }])];
    expect(computeActiveNoticeSegmentCount(segments, OK_ROAD_META)).toEqual({ count: 1, confirmed: true });
  });

  it("the same notice text on TWO different segments counts twice", () => {
    const segments = [makeSegment(1, [{ status: "active" }]), makeSegment(2, [{ status: "active" }])];
    expect(computeActiveNoticeSegmentCount(segments, OK_ROAD_META)).toEqual({ count: 2, confirmed: true });
  });

  it("expired and unknown-validity notices are excluded from the count", () => {
    const segments = [makeSegment(1, [{ status: "expired" }]), makeSegment(2, [{ status: "unknown" }])];
    expect(computeActiveNoticeSegmentCount(segments, OK_ROAD_META)).toEqual({ count: 0, confirmed: true });
  });

  it("a segment's general surface closure (category) is never counted — only point notices matter", () => {
    const segments = [{ idButur: 1, category: "closed", notices: [] }];
    expect(computeActiveNoticeSegmentCount(segments, OK_ROAD_META)).toEqual({ count: 0, confirmed: true });
  });

  it("an unavailable or stale points feed returns an unconfirmed result, never a silent 0", () => {
    const segments = [makeSegment(1, [{ status: "active" }])];
    expect(computeActiveNoticeSegmentCount(segments, { ...OK_ROAD_META, pointsFeedUnavailableOrStale: true })).toEqual({
      count: null,
      confirmed: false,
    });
    expect(computeActiveNoticeSegmentCount(segments, { ...OK_ROAD_META, pointsAvailable: false })).toEqual({
      count: null,
      confirmed: false,
    });
    expect(computeActiveNoticeSegmentCount(segments, { ...OK_ROAD_META, stale: true })).toEqual({
      count: null,
      confirmed: false,
    });
  });

  it("general road status (no notices at all) legitimately yields a confirmed 0, not unconfirmed", () => {
    const segments = [makeSegment(1, []), makeSegment(2, [])];
    expect(computeActiveNoticeSegmentCount(segments, OK_ROAD_META)).toEqual({ count: 0, confirmed: true });
  });
});
