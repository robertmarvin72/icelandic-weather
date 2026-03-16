// src/lib/relocationEngine.roughWindow.test.js
import { describe, it, expect } from "vitest";
import { decideCandidate } from "./relocationEngine";

describe("decideCandidate - rough weather window veto (Ticket #168)", () => {
  it("downgrades MOVE to CONSIDER when candidate has a later 2-day rough weather window that base does not have", () => {
    const windowDays = [
      {
        date: "2026-03-20",
        points: 8.4,
        baseSitePoints: 5.5,
        warnings: [],
        baseSiteWarnings: [],
      },
      {
        date: "2026-03-21",
        points: 8.1,
        baseSitePoints: 5.3,
        warnings: [],
        baseSiteWarnings: [],
      },
      {
        date: "2026-03-22",
        points: 4.8,
        baseSitePoints: 4.3,
        warnings: [{ type: "wind", level: "warn", value: 15 }],
        baseSiteWarnings: [],
      },
      {
        date: "2026-03-23",
        points: 4.7,
        baseSitePoints: 4.2,
        warnings: [{ type: "gust", level: "warn", value: 21 }],
        baseSiteWarnings: [],
      },
    ];

    const result = decideCandidate({
      windowDays,
      deltaVsBase: 1.8,
      distanceKm: 20,
    });

    expect(result.recommendation).toBe("consider");
    expect(result.aggregateType).toBe("slight");
    expect(result.aggregateKey).toBe("routeAggregateSlight");
    expect(result.roughWeatherWindow.dayCount).toBe(2);
    expect(result.roughWeatherWindow.startDate).toBe("2026-03-22");
  });

  it("downgrades MOVE to STAY when candidate rough weather starts immediately and lasts 2+ days", () => {
    const windowDays = [
      {
        date: "2026-03-20",
        points: 3.9,
        baseSitePoints: 5.5,
        warnings: [{ type: "wind", level: "warn", value: 15 }],
        baseSiteWarnings: [],
      },
      {
        date: "2026-03-21",
        points: 3.7,
        baseSitePoints: 5.2,
        warnings: [{ type: "gust", level: "warn", value: 20 }],
        baseSiteWarnings: [],
      },
      {
        date: "2026-03-22",
        points: 8.4,
        baseSitePoints: 5.0,
        warnings: [],
        baseSiteWarnings: [],
      },
    ];

    const result = decideCandidate({
      windowDays,
      deltaVsBase: 1.1,
      distanceKm: 20,
    });

    expect(result.recommendation).toBe("stay");
    expect(result.aggregateType).toBe("same");
    expect(result.aggregateKey).toBe("routeDaySame");
    expect(result.roughWeatherWindow.dayCount).toBe(2);
    expect(result.roughWeatherWindow.startDate).toBe("2026-03-20");
  });
});
