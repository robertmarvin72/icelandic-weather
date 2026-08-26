import { describe, it, expect } from "vitest";
import { buildRankedDecision } from "./rankDecision.js";

const NIGHT = {
  eveningDate: "2026-08-24",
  auroraActivity: 9,
  sun: { sunset: "21:00", darknessStart: "22:00", dawn: "05:00", sunrise: "06:00" },
  moon: { ageDays: 0, rise: null, set: null, scheduleType: 1 },
};

const VIEWING_WINDOW = { start: "2026-08-24T22:00:00Z", end: "2026-08-25T05:00:00Z" };

const HOURS = ["22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00"];

function rowsWithCloud(cloud) {
  return HOURS.map((hhmm) => {
    const [h] = hhmm.split(":").map(Number);
    const dayOffset = h < 12 ? 1 : 0;
    const base = Date.parse("2026-08-24T00:00:00Z");
    const ms = base + dayOffset * 24 * 3600 * 1000 + h * 3600 * 1000;
    return { time: new Date(ms).toISOString(), cloudTotal: cloud, precipitation: 0, windSpeed: 1 };
  });
}

function loc(id, name = id) {
  return { id, name, lat: 64, lon: -20 };
}

describe("buildRankedDecision", () => {
  it("ranks three locations (clear/partial/full cloud) by their local weather, best first", () => {
    const weatherResults = [
      { location: loc("cloudy"), ok: true, hourlyRows: rowsWithCloud(100) },
      { location: loc("clear"), ok: true, hourlyRows: rowsWithCloud(0) },
      { location: loc("partial"), ok: true, hourlyRows: rowsWithCloud(50) },
    ];
    const { best, alternatives, excluded } = buildRankedDecision({ weatherResults, night: NIGHT, viewingWindow: VIEWING_WINDOW });

    expect(best.locationId).toBe("clear");
    expect(alternatives.map((a) => a.locationId)).toEqual(["partial", "cloudy"]);
    expect(excluded).toEqual([]);
    // Real Ticket 2 scorer output shape is preserved untouched, only extended.
    expect(best).toHaveProperty("score");
    expect(best).toHaveProperty("band");
    expect(best).toHaveProperty("reasons");
    expect(best).toHaveProperty("flags");
  });

  it("resolves equal scores through the canonical-ID tie-break", () => {
    const weatherResults = [
      { location: loc("zzz-site"), ok: true, hourlyRows: rowsWithCloud(0) },
      { location: loc("aaa-site"), ok: true, hourlyRows: rowsWithCloud(0) },
    ];
    const { best, alternatives } = buildRankedDecision({ weatherResults, night: NIGHT, viewingWindow: VIEWING_WINDOW });
    expect(best.score).toBe(alternatives[0].score);
    expect(best.locationId).toBe("aaa-site");
    expect(alternatives[0].locationId).toBe("zzz-site");
  });

  it("is independent of input array order (order-independent ranking)", () => {
    const a = { location: loc("a"), ok: true, hourlyRows: rowsWithCloud(20) };
    const b = { location: loc("b"), ok: true, hourlyRows: rowsWithCloud(80) };
    const forward = buildRankedDecision({ weatherResults: [a, b], night: NIGHT, viewingWindow: VIEWING_WINDOW });
    const reversed = buildRankedDecision({ weatherResults: [b, a], night: NIGHT, viewingWindow: VIEWING_WINDOW });
    expect(forward).toEqual(reversed);
  });

  it("excludes a failed weather fetch with a structured reason, preserved separately from scoring", () => {
    const weatherResults = [
      { location: loc("ok-site"), ok: true, hourlyRows: rowsWithCloud(0) },
      { location: loc("failed-site"), ok: false, reason: "weather_timeout" },
    ];
    const { best, excluded } = buildRankedDecision({ weatherResults, night: NIGHT, viewingWindow: VIEWING_WINDOW });
    expect(best.locationId).toBe("ok-site");
    expect(excluded).toEqual([{ locationId: "failed-site", name: "failed-site", status: "weather_timeout", reasons: ["weather_timeout"] }]);
  });

  it("preserves the Ticket 2 scorer's insufficient_data status/reasons in excluded, unmodified", () => {
    const nightMissingActivity = { ...NIGHT, auroraActivity: null };
    const weatherResults = [{ location: loc("site"), ok: true, hourlyRows: rowsWithCloud(0) }];
    const { best, excluded } = buildRankedDecision({
      weatherResults,
      night: nightMissingActivity,
      viewingWindow: VIEWING_WINDOW,
    });
    expect(best).toBeNull();
    expect(excluded).toEqual([{ locationId: "site", name: "site", status: "insufficient_data", reasons: ["missing_activity"] }]);
  });

  it("preserves not_viewable_tonight when the observation window has no usable rows", () => {
    const weatherResults = [{ location: loc("site"), ok: true, hourlyRows: [] }];
    const { best, excluded } = buildRankedDecision({ weatherResults, night: NIGHT, viewingWindow: VIEWING_WINDOW });
    expect(best).toBeNull();
    expect(excluded[0]).toMatchObject({ locationId: "site", status: "not_viewable_tonight" });
    expect(excluded[0].reasons.length).toBeGreaterThan(0);
  });

  it("returns best: null (never fabricated) when nothing is scoreable", () => {
    const weatherResults = [{ location: loc("site"), ok: false, reason: "weather_fetch_failed" }];
    const { best, alternatives } = buildRankedDecision({ weatherResults, night: NIGHT, viewingWindow: VIEWING_WINDOW });
    expect(best).toBeNull();
    expect(alternatives).toEqual([]);
  });
});
