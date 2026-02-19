import { describe, it, expect } from "vitest";
import {
  getSeasonForDate,
  basePointsFromTemp,
  windPenaltyPoints,
  rainPenaltyPoints,
  pointsToClass,
  scoreDay,
  convertTemp,
  convertRain,
  convertWind,
  convertDistanceKm,
  formatNumber,
} from "./scoring";

describe("scoring: basePointsFromTemp()", () => {
  it("returns 10 when tmax > 14", () => {
    expect(basePointsFromTemp(15)).toBe(10);
  });

  it("returns 8 for 12–14 inclusive", () => {
    expect(basePointsFromTemp(12)).toBe(8);
    expect(basePointsFromTemp(14)).toBe(8);
  });

  it("returns 5 for 8–11.999", () => {
    expect(basePointsFromTemp(8)).toBe(5);
    expect(basePointsFromTemp(11.9)).toBe(5);
  });

  it("returns 2 for 6–7.999", () => {
    expect(basePointsFromTemp(6)).toBe(2);
    expect(basePointsFromTemp(7.9)).toBe(2);
  });

  it("returns 0 below 6", () => {
    expect(basePointsFromTemp(5.9)).toBe(0);
    expect(basePointsFromTemp(null)).toBe(0);
  });
});

describe("scoring: windPenaltyPoints()", () => {
  it("returns 0 for <= 5", () => {
    expect(windPenaltyPoints(0)).toBe(0);
    expect(windPenaltyPoints(5)).toBe(0);
    expect(windPenaltyPoints(null)).toBe(0);
  });

  it("returns 2 for 5.0001–10", () => {
    expect(windPenaltyPoints(6)).toBe(2);
    expect(windPenaltyPoints(10)).toBe(2);
  });

  it("returns 5 for 10.0001–15", () => {
    expect(windPenaltyPoints(11)).toBe(5);
    expect(windPenaltyPoints(15)).toBe(5);
  });

  it("returns 10 for > 15", () => {
    expect(windPenaltyPoints(16)).toBe(10);
  });
});

describe("scoring: rainPenaltyPoints()", () => {
  it("returns 0 for < 1mm", () => {
    expect(rainPenaltyPoints(0)).toBe(0);
    expect(rainPenaltyPoints(0.99)).toBe(0);
    expect(rainPenaltyPoints(null)).toBe(0);
  });

  it("returns 2 for 1–3.999mm", () => {
    expect(rainPenaltyPoints(1)).toBe(2);
    expect(rainPenaltyPoints(3.99)).toBe(2);
  });

  it("returns 5 for >= 4mm", () => {
    expect(rainPenaltyPoints(4)).toBe(5);
    expect(rainPenaltyPoints(10)).toBe(5);
  });
});

describe("scoring: pointsToClass()", () => {
  it("maps points to the correct class", () => {
    expect(pointsToClass(10)).toBe("Best");
    expect(pointsToClass(9)).toBe("Best");
    expect(pointsToClass(8)).toBe("Good");
    expect(pointsToClass(7)).toBe("Good");
    expect(pointsToClass(4)).toBe("Ok");
    expect(pointsToClass(1)).toBe("Fair");
    expect(pointsToClass(0)).toBe("Bad");
  });
});

describe("scoring: scoreDay()", () => {
  it("clamps points to 0..10", () => {
    const bad = scoreDay({ tmax: 5, windMax: 30, rain: 50 });
    expect(bad.points).toBe(0);
    expect(bad.finalClass).toBe("Bad");

    const good = scoreDay({ tmax: 20, windMax: 0, rain: 0 });
    expect(good.points).toBe(10);
    expect(good.finalClass).toBe("Best");
  });

  it("computes a realistic summer example", () => {
    // tmax=12 => base 8
    // wind=11 => pen 5
    // rain=1.2 => pen 2
    // => 1 point => Fair
    const r = scoreDay({
      tmax: 12,
      windMax: 11,
      rain: 1.2,
      date: "2026-06-15", // explicit summer
    });

    expect(r.season).toBe("summer");
    expect(r.basePts).toBe(8);
    expect(r.windPen).toBe(5);
    expect(r.rainPen).toBe(2);
    expect(r.points).toBe(1);
    expect(r.finalClass).toBe("Fair");
  });
});

describe("scoring: seasonal behavior", () => {
  it("getSeasonForDate: Oct–Apr => winter, May–Sep => summer", () => {
    expect(getSeasonForDate("2026-01-15")).toBe("winter");
    expect(getSeasonForDate("2026-04-30")).toBe("winter");
    expect(getSeasonForDate("2026-05-01")).toBe("summer");
    expect(getSeasonForDate("2026-09-30")).toBe("summer");
    expect(getSeasonForDate("2026-10-01")).toBe("winter");
  });

  it("defaults to summer if date is missing or invalid", () => {
    expect(getSeasonForDate()).toBe("summer");
    expect(getSeasonForDate(null)).toBe("summer");
    expect(getSeasonForDate("not-a-date")).toBe("summer");
  });

  it("winter reduces temperature impact compared to summer", () => {
    const input = { tmax: 12, rain: 0, windMax: 0 };

    const summer = scoreDay({ ...input, date: "2026-06-15" });
    const winter = scoreDay({ ...input, date: "2026-01-15" });

    expect(summer.season).toBe("summer");
    expect(winter.season).toBe("winter");

    // Temperature matters less in winter
    expect(winter.basePts).toBeLessThanOrEqual(summer.basePts);

    // Wind and rain penalties stay identical
    expect(winter.windPen).toBe(summer.windPen);
    expect(winter.rainPen).toBe(summer.rainPen);
  });
});

describe("units: conversions + formatting", () => {
  it("convertTemp: C <-> F", () => {
    expect(convertTemp(0, "imperial")).toBe(32);
    expect(convertTemp(100, "imperial")).toBe(212);
    expect(convertTemp(10, "metric")).toBe(10);
    expect(convertTemp(null, "imperial")).toBe(null);
  });

  it("convertRain: mm -> inches", () => {
    expect(convertRain(25.4, "imperial")).toBeCloseTo(1, 5);
    expect(convertRain(10, "metric")).toBe(10);
  });

  it("convertWind: m/s -> knots", () => {
    expect(convertWind(10, "imperial")).toBeCloseTo(19.4384, 4);
    expect(convertWind(10, "metric")).toBe(10);
  });

  it("convertDistanceKm: km -> miles", () => {
    expect(convertDistanceKm(1, "imperial")).toBeCloseTo(0.621371, 6);
    expect(convertDistanceKm(10, "metric")).toBe(10);
  });

  it("formatNumber formats and handles missing values", () => {
    expect(formatNumber(1.234, 1)).toBe("1.2");
    expect(formatNumber(1.234, 2)).toBe("1.23");
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(NaN)).toBe("—");
  });
});
