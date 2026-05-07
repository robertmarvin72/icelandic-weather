// src/lib/scoring.test.js
import { describe, it, expect } from "vitest";
import {
  basePointsFromTemp,
  windPenaltyPoints,
  rainPenaltyPoints,
  pointsToClass,
  scoreDay,
  scoreSiteDay,
  scoreDaysWithRainStreak,
  gustPenaltyPoints,
  getSeasonForDate,
  getColdWindPenalty,
  getSkyComfortModifier,
  getWintryPrecipPenalty,
  getPleasantnessModifier,
  convertTemp,
  convertRain,
  convertWind,
  convertDistanceKm,
  formatNumber,
} from "./scoring";

describe("scoring: basePointsFromTemp() — summer (default)", () => {
  it("returns 10 for >= 15", () => {
    expect(basePointsFromTemp(15)).toBe(10);
    expect(basePointsFromTemp(20)).toBe(10);
  });

  it("returns 8 for 12–14.999", () => {
    expect(basePointsFromTemp(12)).toBe(8);
    expect(basePointsFromTemp(14)).toBe(8);
  });

  it("returns 6 for 9–11.999", () => {
    expect(basePointsFromTemp(9)).toBe(6);
    expect(basePointsFromTemp(11.9)).toBe(6);
  });

  it("returns 4 for 7–8.999", () => {
    expect(basePointsFromTemp(7)).toBe(4);
    expect(basePointsFromTemp(8)).toBe(4);
  });

  it("returns 3 for 5–6.999", () => {
    expect(basePointsFromTemp(5)).toBe(3);
    expect(basePointsFromTemp(6)).toBe(3);
  });

  it("returns 2 for 3–4.999", () => {
    expect(basePointsFromTemp(3)).toBe(2);
    expect(basePointsFromTemp(4.9)).toBe(2);
  });

  it("returns 1 for 0–2.999", () => {
    expect(basePointsFromTemp(0)).toBe(1);
    expect(basePointsFromTemp(2.9)).toBe(1);
  });

  it("returns 0 below 0", () => {
    expect(basePointsFromTemp(-1)).toBe(0);
    expect(basePointsFromTemp(null)).toBe(0);
  });
});

describe("scoring: basePointsFromTemp() — winter", () => {
  it("returns 10 for > 14", () => {
    expect(basePointsFromTemp(15, "winter")).toBe(10);
  });

  it("returns 8 for 12–14", () => {
    expect(basePointsFromTemp(12, "winter")).toBe(8);
    expect(basePointsFromTemp(14, "winter")).toBe(8);
  });

  it("returns 5 for 8–11.999", () => {
    expect(basePointsFromTemp(8, "winter")).toBe(5);
    expect(basePointsFromTemp(11.9, "winter")).toBe(5);
  });

  it("returns 2 for 6–7.999", () => {
    expect(basePointsFromTemp(6, "winter")).toBe(2);
    expect(basePointsFromTemp(7.9, "winter")).toBe(2);
  });

  it("returns 0 below 6", () => {
    expect(basePointsFromTemp(5.9, "winter")).toBe(0);
    expect(basePointsFromTemp(null, "winter")).toBe(0);
  });
});

describe("scoring: windPenaltyPoints() — summer (default)", () => {
  it("returns 0 for <= 7", () => {
    expect(windPenaltyPoints(0)).toBe(0);
    expect(windPenaltyPoints(7)).toBe(0);
    expect(windPenaltyPoints(null)).toBe(0);
  });

  it("returns 1 for 7.001–10", () => {
    expect(windPenaltyPoints(8)).toBe(1);
    expect(windPenaltyPoints(10)).toBe(1);
  });

  it("returns 3 for 10.001–13", () => {
    expect(windPenaltyPoints(11)).toBe(3);
    expect(windPenaltyPoints(13)).toBe(3);
  });

  it("returns 6 for 13.001–16", () => {
    expect(windPenaltyPoints(14)).toBe(6);
    expect(windPenaltyPoints(16)).toBe(6);
  });

  it("returns 10 for > 16", () => {
    expect(windPenaltyPoints(17)).toBe(10);
  });
});

describe("scoring: windPenaltyPoints() — winter", () => {
  it("returns 0 for <= 5", () => {
    expect(windPenaltyPoints(0, "winter")).toBe(0);
    expect(windPenaltyPoints(5, "winter")).toBe(0);
    expect(windPenaltyPoints(null, "winter")).toBe(0);
  });

  it("returns 2 for 5.001–10", () => {
    expect(windPenaltyPoints(6, "winter")).toBe(2);
    expect(windPenaltyPoints(10, "winter")).toBe(2);
  });

  it("returns 5 for 10.001–15", () => {
    expect(windPenaltyPoints(11, "winter")).toBe(5);
    expect(windPenaltyPoints(15, "winter")).toBe(5);
  });

  it("returns 10 for > 15", () => {
    expect(windPenaltyPoints(16, "winter")).toBe(10);
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
    // extremely bad conditions
    const bad = scoreDay({ tmax: 5, windMax: 30, windGust: 40, rain: 50 });
    expect(bad.points).toBe(0);
    expect(bad.finalClass).toBe("Bad");

    // extremely good (base 10 - 0 - 0)
    const good = scoreDay({ tmax: 20, windMax: 0, windGust: 0, rain: 0 });
    expect(good.points).toBe(10);
    expect(good.finalClass).toBe("Best");
  });

  it("computes a realistic example", () => {
    // tmax=12 => base 8
    // wind=11 => pen 5
    // rain=1.2 => pen 2
    // gust=0 => pen 0
    // => 3 points => Fair
    const r = scoreDay({ tmax: 12, windMax: 11, windGust: 0, rain: 1.2 });
    expect(r.basePts).toBe(8);
    expect(r.windPen).toBe(3);
    expect(r.rainPen).toBe(2);
    expect(r.gustPen).toBe(0);
    expect(r.points).toBe(3);
    expect(r.finalClass).toBe("Fair");
  });
});

describe("scoring: season helpers", () => {
  it("getSeasonForDate: winter is Oct–Apr, summer otherwise", () => {
    expect(getSeasonForDate("2026-01-15")).toBe("winter"); // Jan
    expect(getSeasonForDate("2026-10-01")).toBe("winter"); // Oct
    expect(getSeasonForDate("2026-04-30")).toBe("winter"); // Apr
    expect(getSeasonForDate("2026-05-01")).toBe("summer"); // May
    expect(getSeasonForDate("2026-07-10")).toBe("summer"); // Jul
  });

  it("getSeasonForDate defaults to summer on missing/invalid date", () => {
    expect(getSeasonForDate(null)).toBe("summer");
    expect(getSeasonForDate("not-a-date")).toBe("summer");
  });
});

describe("scoring: gustPenaltyPoints()", () => {
  it("returns 0 when gust or windMax is missing/invalid", () => {
    expect(gustPenaltyPoints(null, 10, "summer")).toBe(0);
    expect(gustPenaltyPoints(15, null, "summer")).toBe(0);
    expect(gustPenaltyPoints("15", 10, "summer")).toBe(0);
    expect(gustPenaltyPoints(15, "10", "summer")).toBe(0);
  });

  it("returns 0 when gustiness (gust - windMax) is small (< 2.9)", () => {
    expect(gustPenaltyPoints(12.8, 10, "summer")).toBe(0); // diff 2.8
  });

  it("starts penalizing at threshold (>= 2.9)", () => {
    expect(gustPenaltyPoints(12.9, 10, "summer")).toBe(1); // diff 2.9
  });

  it("penalizes by gustiness in summer (diff 2.9..5.9 => 1, 6..9.9 => 2, >=10 => 3)", () => {
    expect(gustPenaltyPoints(14, 10, "summer")).toBe(1); // diff 4
    expect(gustPenaltyPoints(16, 10, "summer")).toBe(2); // diff 6
    expect(gustPenaltyPoints(22, 10, "summer")).toBe(3); // diff 12
  });

  it("applies higher penalty in winter for the same gustiness (rounded, capped)", () => {
    // diff 6 => base 2
    // winter weight ~1.6 => round(3.2) = 3
    expect(gustPenaltyPoints(16, 10, "winter")).toBe(3);
  });

  it("caps gust penalty at 5", () => {
    // diff >= 10 => base 3, winter => round(4.8)=5 (cap 5)
    expect(gustPenaltyPoints(22, 10, "winter")).toBe(5);
  });
});

describe("scoring: scoreSiteDay() contract", () => {
  it("returns total + components with stable keys (and legacy fields for compatibility)", () => {
    const r = scoreSiteDay({
      tmax: 12,
      windMax: 11,
      windGust: 0,
      rain: 1.2,
      date: "2026-07-01",
    });

    expect(typeof r.total).toBe("number");
    expect(r.components).toBeTruthy();
    expect(Object.keys(r.components)).toEqual(
      expect.arrayContaining(["temp", "wind", "rain", "gust", "rainStreak", "shelter"])
    );

    // Legacy fields that existing UI may rely on
    expect(typeof r.points).toBe("number");
    expect(typeof r.finalClass).toBe("string");
    expect(typeof r.basePts).toBe("number");
    expect(typeof r.windPen).toBe("number");
    expect(typeof r.rainPen).toBe("number");
    expect(typeof r.gustPen).toBe("number");
  });
});

describe("scoring: scoreDaysWithRainStreak()", () => {
  it("applies penalty on consecutive wet days and resets streak on dry day", () => {
    const days = [
      { date: "2026-07-01", tmax: 12, windMax: 0, windGust: 0, rain: 5 }, // wet
      { date: "2026-07-02", tmax: 12, windMax: 0, windGust: 0, rain: 5 }, // wet (streak=2 => pen 1)
      { date: "2026-07-03", tmax: 12, windMax: 0, windGust: 0, rain: 0 }, // dry (reset)
    ];

    const out = scoreDaysWithRainStreak(days);

    expect(out[0].wetDay).toBe(true);
    expect(out[0].rainStreak).toBe(1);
    expect(out[0].rainStreakPen).toBe(0);

    expect(out[1].wetDay).toBe(true);
    expect(out[1].rainStreak).toBe(2);
    expect(out[1].rainStreakPen).toBe(1);
    expect(out[1].points).toBe(out[0].points - 1);

    expect(out[2].wetDay).toBe(false);
    expect(out[2].rainStreak).toBe(0);
    expect(out[2].rainStreakPen).toBe(0);
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
    expect(convertRain(null, "imperial")).toBe(null);
  });

  it("convertWind: m/s -> knots", () => {
    expect(convertWind(10, "imperial")).toBeCloseTo(19.4384, 4);
    expect(convertWind(10, "metric")).toBe(10);
    expect(convertWind(null, "imperial")).toBe(null);
  });

  it("convertDistanceKm: km -> miles", () => {
    expect(convertDistanceKm(1, "imperial")).toBeCloseTo(0.621371, 6);
    expect(convertDistanceKm(10, "metric")).toBe(10);
    expect(convertDistanceKm(null, "imperial")).toBe(null);
  });

  it("formatNumber formats and handles missing values", () => {
    expect(formatNumber(1.234, 1)).toBe("1.2");
    expect(formatNumber(1.234, 2)).toBe("1.23");
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(NaN)).toBe("—");
  });
});

describe("scoring: scoreSiteDay() precision alignment (round1)", () => {
  it("rain 3.96 and rain 4.04 score identically (both round to 4.0 mm)", () => {
    const base = { tmax: 12, windMax: 4, windGust: 4, date: "2026-07-01" };
    const siteA = scoreSiteDay({ ...base, rain: 3.96 });
    const siteB = scoreSiteDay({ ...base, rain: 4.04 });
    expect(siteA.rainPen).toBe(siteB.rainPen);
    expect(siteA.total).toBe(siteB.total);
  });

  it("rain 0.95 and rain 1.04 score identically (both round to 1.0 mm)", () => {
    const base = { tmax: 12, windMax: 4, windGust: 4, date: "2026-07-01" };
    const siteA = scoreSiteDay({ ...base, rain: 0.95 });
    const siteB = scoreSiteDay({ ...base, rain: 1.04 });
    expect(siteA.rainPen).toBe(siteB.rainPen);
    expect(siteA.total).toBe(siteB.total);
  });

  it("windMax 4.96 and windMax 5.04 score identically (both round to 5.0 m/s)", () => {
    const base = { tmax: 12, windGust: 0, rain: 0, date: "2026-07-01" };
    const siteA = scoreSiteDay({ ...base, windMax: 4.96 });
    const siteB = scoreSiteDay({ ...base, windMax: 5.04 });
    expect(siteA.windPen).toBe(siteB.windPen);
  });

  it("windMax 9.96 and windMax 10.04 score identically (both round to 10.0 m/s)", () => {
    const base = { tmax: 12, windGust: 0, rain: 0, date: "2026-07-01" };
    const siteA = scoreSiteDay({ ...base, windMax: 9.96 });
    const siteB = scoreSiteDay({ ...base, windMax: 10.04 });
    expect(siteA.windPen).toBe(siteB.windPen);
  });

  it("windMax 14.96 and windMax 15.04 score identically (both round to 15.0 m/s)", () => {
    const base = { tmax: 12, windGust: 0, rain: 0, date: "2026-07-01" };
    const siteA = scoreSiteDay({ ...base, windMax: 14.96 });
    const siteB = scoreSiteDay({ ...base, windMax: 15.04 });
    expect(siteA.windPen).toBe(siteB.windPen);
  });

  it("tmax 13.96 and tmax 14.04 score identically (both round to 14.0°C)", () => {
    const base = { windMax: 4, windGust: 0, rain: 0, date: "2026-07-01" };
    const siteA = scoreSiteDay({ ...base, tmax: 13.96 });
    const siteB = scoreSiteDay({ ...base, tmax: 14.04 });
    expect(siteA.basePts).toBe(siteB.basePts);
  });

  it("null/undefined inputs do not throw", () => {
    expect(() =>
      scoreSiteDay({ tmax: null, rain: null, windMax: null, windGust: null })
    ).not.toThrow();
    const r = scoreSiteDay({ tmax: null, rain: null, windMax: null, windGust: null });
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it("clean 1-decimal inputs are unaffected (no regression)", () => {
    const r = scoreSiteDay({ tmax: 12, windMax: 11, windGust: 0, rain: 1.2, date: "2026-07-01" });
    expect(r.basePts).toBe(8);
    expect(r.windPen).toBe(3);
    expect(r.rainPen).toBe(2);
    expect(r.gustPen).toBe(0);
    expect(r.points).toBe(3);
  });
});

describe("scoring: shelter bonus", () => {
  it("gives little/no bonus in calm wind even with high shelter", () => {
    const r = scoreSiteDay({
      tmax: 12,
      windMax: 2,
      windGust: 2,
      rain: 0,
      shelter: 10,
      date: "2026-07-01",
    });
    expect(r.components.shelter).toBe(0);
  });

  it("gives higher bonus in strong wind when shelter is high", () => {
    const r = scoreSiteDay({
      tmax: 12,
      windMax: 16,
      windGust: 22,
      rain: 0,
      shelter: 10,
      date: "2026-07-01",
    });
    expect(r.components.shelter).toBeGreaterThanOrEqual(1);
  });

  it("gives less bonus when shelter is low, even in strong wind", () => {
    const hi = scoreSiteDay({
      tmax: 12,
      windMax: 16,
      windGust: 22,
      rain: 0,
      shelter: 10,
      date: "2026-07-01",
    });
    const lo = scoreSiteDay({
      tmax: 12,
      windMax: 16,
      windGust: 22,
      rain: 0,
      shelter: 2,
      date: "2026-07-01",
    });
    expect(hi.components.shelter).toBeGreaterThan(lo.components.shelter);
  });

  it("handles missing shelter safely", () => {
    const r = scoreSiteDay({
      tmax: 12,
      windMax: 16,
      windGust: 22,
      rain: 0,
      shelter: null,
      date: "2026-07-01",
    });
    expect(r.components.shelter).toBe(0);
  });
});

describe("scoring: getColdWindPenalty()", () => {
  it("returns 0 when temp > 8 regardless of wind", () => {
    expect(getColdWindPenalty(9, 20)).toBe(0);
  });

  it("returns 0 when wind < 5 regardless of temp", () => {
    expect(getColdWindPenalty(-5, 4)).toBe(0);
  });

  it("freezing temp (<=0) with strong wind => 3", () => {
    expect(getColdWindPenalty(0, 10)).toBe(3);
    expect(getColdWindPenalty(-3, 12)).toBe(3);
  });

  it("freezing temp (<=0) with moderate wind (7-9) => 2", () => {
    expect(getColdWindPenalty(0, 7)).toBe(2);
  });

  it("freezing temp (<=0) with light wind (5-6) => 1", () => {
    expect(getColdWindPenalty(0, 5)).toBe(1);
  });

  it("cold temp (1-4) with wind >= 10 => 2", () => {
    expect(getColdWindPenalty(2, 10)).toBe(2);
    expect(getColdWindPenalty(4, 11)).toBe(2);
  });

  it("cold temp (1-4) with wind 8-9 => 1", () => {
    expect(getColdWindPenalty(3, 8)).toBe(1);
  });

  it("cold temp (1-4) with wind 5-7 => 0", () => {
    expect(getColdWindPenalty(3, 6)).toBe(0);
  });

  it("cool temp (5-8) with wind >= 12 => 1", () => {
    expect(getColdWindPenalty(6, 12)).toBe(1);
  });

  it("cool temp (5-8) with wind < 12 => 0", () => {
    expect(getColdWindPenalty(6, 11)).toBe(0);
  });
});

describe("scoring: getSkyComfortModifier()", () => {
  it("returns +1 for clear (0) and mainly clear (1)", () => {
    expect(getSkyComfortModifier(0)).toBe(1);
    expect(getSkyComfortModifier(1)).toBe(1);
  });

  it("returns -1 for overcast (3)", () => {
    expect(getSkyComfortModifier(3)).toBe(-1);
  });

  it("returns -1 for fog (45, 48)", () => {
    expect(getSkyComfortModifier(45)).toBe(-1);
    expect(getSkyComfortModifier(48)).toBe(-1);
  });

  it("returns 0 for partly cloudy (2) and other codes", () => {
    expect(getSkyComfortModifier(2)).toBe(0);
    expect(getSkyComfortModifier(61)).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(getSkyComfortModifier(null)).toBe(0);
  });
});

describe("scoring: getWintryPrecipPenalty()", () => {
  it("returns 3 for snow codes when tmax <= 2", () => {
    expect(getWintryPrecipPenalty(71, 1)).toBe(3);
    expect(getWintryPrecipPenalty(77, 0)).toBe(3);
    expect(getWintryPrecipPenalty(85, 2)).toBe(3);
    expect(getWintryPrecipPenalty(86, -1)).toBe(3);
  });

  it("returns 2 for snow codes when tmax > 2", () => {
    expect(getWintryPrecipPenalty(71, 3)).toBe(2);
    expect(getWintryPrecipPenalty(73, 5)).toBe(2);
  });

  it("returns 2 for freezing rain (66, 67)", () => {
    expect(getWintryPrecipPenalty(66, 0)).toBe(2);
    expect(getWintryPrecipPenalty(67, 1)).toBe(2);
  });

  it("returns 0 for non-wintry codes", () => {
    expect(getWintryPrecipPenalty(61, 5)).toBe(0);
    expect(getWintryPrecipPenalty(0, 0)).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(getWintryPrecipPenalty(null, 0)).toBe(0);
  });
});

describe("scoring: pleasantness — scoreSiteDay() integration scenarios", () => {
  it("S1: sunny summer day (code=0) => +1 pleasantness, total clamped at 10", () => {
    // base=10(>=15), wind=0, rain=0 => raw=10+1=11 => clamped 10
    const r = scoreSiteDay({ tmax: 18, rain: 0, windMax: 3, windGust: 3, date: "2026-07-15", weatherCode: 0 });
    expect(r.components.pleasantness).toBe(1);
    expect(r.total).toBe(10);
    expect(r.finalClass).toBe("Best");
  });

  it("S2: overcast mild day (code=3) => -1 pleasantness, Good", () => {
    // base=8(12), wind=0, rain=0 => raw=8-1=7
    const r = scoreSiteDay({ tmax: 12, rain: 0, windMax: 5, windGust: 5, date: "2026-07-15", weatherCode: 3 });
    expect(r.components.pleasantness).toBe(-1);
    expect(r.total).toBe(7);
    expect(r.finalClass).toBe("Good");
  });

  it("S3: cold + windy (code=2) => coldWind penalty, Bad", () => {
    // base=1(t=2), windPen=3(12m/s summer), pleasantness=0-2-0=-2 => raw=1-3-2=-4 => 0
    const r = scoreSiteDay({ tmax: 2, rain: 0, windMax: 12, windGust: 12, date: "2026-07-15", weatherCode: 2 });
    expect(r.components.pleasantness).toBe(-2);
    expect(r.total).toBe(0);
    expect(r.finalClass).toBe("Bad");
  });

  it("S4: snowy winter day (code=71, tmax=1) => wintryPrecip=3, Bad", () => {
    // winter: basePts=max(4,0)=4, windPen=0(5m/s), rainPen=2, pleasantness=0-0-3=-3 => 4-0-2-3=-1 => 0
    const r = scoreSiteDay({ tmax: 1, rain: 2, windMax: 5, windGust: 5, date: "2026-01-15", weatherCode: 71 });
    expect(r.components.pleasantness).toBe(-3);
    expect(r.total).toBe(0);
    expect(r.finalClass).toBe("Bad");
  });

  it("S5: foggy mild day (code=45) => -1 pleasantness, Ok", () => {
    // base=6(t=10), windPen=0, rainPen=0, pleasantness=-1 => raw=5
    const r = scoreSiteDay({ tmax: 10, rain: 0, windMax: 4, windGust: 4, date: "2026-07-15", weatherCode: 45 });
    expect(r.components.pleasantness).toBe(-1);
    expect(r.total).toBe(5);
    expect(r.finalClass).toBe("Ok");
  });

  it("S6: no weatherCode (backward compat) => pleasantness=0, unchanged score", () => {
    // base=8, windPen=0(6m/s), rainPen=0, pleasantness=0 => raw=8
    const r = scoreSiteDay({ tmax: 12, rain: 0, windMax: 6, windGust: 6, date: "2026-07-15" });
    expect(r.components.pleasantness).toBe(0);
    expect(r.total).toBe(8);
    expect(r.finalClass).toBe("Good");
  });

  it("accepts code as alias for weatherCode", () => {
    const withCode = scoreSiteDay({ tmax: 18, rain: 0, windMax: 3, windGust: 3, date: "2026-07-15", code: 0 });
    const withWeatherCode = scoreSiteDay({ tmax: 18, rain: 0, windMax: 3, windGust: 3, date: "2026-07-15", weatherCode: 0 });
    expect(withCode.components.pleasantness).toBe(withWeatherCode.components.pleasantness);
  });
});
