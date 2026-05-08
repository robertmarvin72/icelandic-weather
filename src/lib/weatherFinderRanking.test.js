// src/lib/weatherFinderRanking.test.js
import { describe, it, expect } from "vitest";
import { rankCalmest, rankWarmest, rankDriest } from "./weatherFinderRanking";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDays({ count = 3, windMax = 5, windGust = 8, rain = 0, tmax = 10, hasHazard = false } = {}) {
  return Array.from({ length: count }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    tmax,
    tmin: tmax - 4,
    windMax,
    windGust,
    rain,
    hasHazard,
  }));
}

function makeSite({ id = "A", name = "Site A", distanceKm = 10, forecast } = {}) {
  return { id, name, distanceKm, forecast: forecast ?? makeDays() };
}

// ── rankCalmest ───────────────────────────────────────────────────────────────

describe("rankCalmest", () => {
  it("returns empty array for empty input", () => {
    expect(rankCalmest([], {})).toEqual([]);
  });

  it("sorts ascending by wind score — calmer site first", () => {
    const calm = makeSite({ id: "calm", forecast: makeDays({ windMax: 3, windGust: 4 }) });
    const windy = makeSite({ id: "windy", forecast: makeDays({ windMax: 15, windGust: 20 }) });
    const result = rankCalmest([windy, calm], { days: 3 });
    expect(result[0].id).toBe("calm");
    expect(result[1].id).toBe("windy");
    expect(result[0].score).toBeLessThan(result[1].score);
  });

  it("excludes campsites beyond maxDistanceKm", () => {
    const near = makeSite({ id: "near", distanceKm: 10 });
    const far = makeSite({ id: "far", distanceKm: 100, forecast: makeDays({ windMax: 1 }) });
    const result = rankCalmest([near, far], { days: 3, maxDistanceKm: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("near");
  });

  it("includes site exactly at maxDistanceKm boundary", () => {
    const edge = makeSite({ id: "edge", distanceKm: 50 });
    const result = rankCalmest([edge], { maxDistanceKm: 50 });
    expect(result).toHaveLength(1);
  });

  it("excludes campsite with empty forecast array", () => {
    const good = makeSite({ id: "good" });
    const empty = { id: "empty", name: "Empty", distanceKm: 5, forecast: [] };
    const result = rankCalmest([good, empty], {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("good");
  });

  it("excludes campsite with missing forecast field", () => {
    const good = makeSite({ id: "good" });
    const noForecast = { id: "no", name: "No forecast", distanceKm: 5 };
    const result = rankCalmest([good, noForecast], {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("good");
  });

  it("hazard days raise the score (worse rank)", () => {
    const safe = makeSite({ id: "safe", forecast: makeDays({ windMax: 5, windGust: 5, hasHazard: false }) });
    const hazardous = makeSite({ id: "hazardous", forecast: makeDays({ windMax: 5, windGust: 5, hasHazard: true }) });
    const result = rankCalmest([hazardous, safe], { days: 3 });
    expect(result[0].id).toBe("safe");
    expect(result[1].id).toBe("hazardous");
  });

  it("result objects have the full expected shape", () => {
    const [r] = rankCalmest([makeSite()], { days: 3 });
    expect(r).toHaveProperty("id");
    expect(r).toHaveProperty("name");
    expect(r).toHaveProperty("distanceKm");
    expect(r).toHaveProperty("score");
    expect(r.metrics).toHaveProperty("avgWind");
    expect(r.metrics).toHaveProperty("avgGust");
    expect(r.metrics).toHaveProperty("avgTemp");
    expect(r.metrics).toHaveProperty("precipTotal");
    expect(r.metrics).toHaveProperty("rainDays");
    expect(r.metrics).toHaveProperty("hazardDays");
  });
});

// ── rankWarmest ───────────────────────────────────────────────────────────────

describe("rankWarmest", () => {
  it("returns empty array for empty input", () => {
    expect(rankWarmest([], {})).toEqual([]);
  });

  it("sorts descending by temp score — warmest site first", () => {
    const warm = makeSite({ id: "warm", forecast: makeDays({ tmax: 18, windMax: 3, rain: 0 }) });
    const cold = makeSite({ id: "cold", forecast: makeDays({ tmax: 5, windMax: 3, rain: 0 }) });
    const result = rankWarmest([cold, warm], { days: 3 });
    expect(result[0].id).toBe("warm");
    expect(result[1].id).toBe("cold");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("excludes campsites beyond maxDistanceKm", () => {
    const near = makeSite({ id: "near", distanceKm: 20, forecast: makeDays({ tmax: 15 }) });
    const far = makeSite({ id: "far", distanceKm: 200, forecast: makeDays({ tmax: 20 }) });
    const result = rankWarmest([near, far], { days: 3, maxDistanceKm: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("near");
  });

  it("excludes campsite with empty forecast array", () => {
    const good = makeSite({ id: "good" });
    const empty = { id: "empty", name: "Empty", distanceKm: 5, forecast: [] };
    const result = rankWarmest([good, empty], {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("good");
  });

  it("excludes campsite with null forecast", () => {
    const good = makeSite({ id: "good" });
    const nullFc = { id: "null", name: "Null", distanceKm: 5, forecast: null };
    const result = rankWarmest([good, nullFc], {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("good");
  });

  it("rain days penalize the score", () => {
    const dry = makeSite({ id: "dry", forecast: makeDays({ tmax: 12, rain: 0 }) });
    const rainy = makeSite({ id: "rainy", forecast: makeDays({ tmax: 12, rain: 5 }) });
    const result = rankWarmest([rainy, dry], { days: 3 });
    expect(result[0].id).toBe("dry");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });
});

// ── rankDriest ────────────────────────────────────────────────────────────────

describe("rankDriest", () => {
  it("returns empty array for empty input", () => {
    expect(rankDriest([], {})).toEqual([]);
  });

  it("sorts ascending by precip score — driest site first", () => {
    const dry = makeSite({ id: "dry", forecast: makeDays({ rain: 0, windMax: 3 }) });
    const wet = makeSite({ id: "wet", forecast: makeDays({ rain: 10, windMax: 3 }) });
    const result = rankDriest([wet, dry], { days: 3 });
    expect(result[0].id).toBe("dry");
    expect(result[1].id).toBe("wet");
    expect(result[0].score).toBeLessThan(result[1].score);
  });

  it("excludes campsites beyond maxDistanceKm", () => {
    const near = makeSite({ id: "near", distanceKm: 15 });
    const far = makeSite({ id: "far", distanceKm: 150, forecast: makeDays({ rain: 0 }) });
    const result = rankDriest([near, far], { days: 3, maxDistanceKm: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("near");
  });

  it("excludes campsite with empty forecast array", () => {
    const good = makeSite({ id: "good" });
    const empty = { id: "empty", name: "Empty", distanceKm: 5, forecast: [] };
    const result = rankDriest([good, empty], {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("good");
  });

  it("excludes campsite with no forecast property", () => {
    const good = makeSite({ id: "good" });
    const noField = { id: "no", name: "No field", distanceKm: 5 };
    const result = rankDriest([good, noField], {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("good");
  });
});

// ── Shared behavior ───────────────────────────────────────────────────────────

describe("weatherFinderRanking — shared behavior", () => {
  it("options.days limits which forecast days are included in metrics", () => {
    // 7-day forecast: first 3 days very windy (20 m/s), last 4 calm (2 m/s)
    const forecast = [
      ...Array.from({ length: 3 }, (_, i) => ({
        date: `2026-07-${String(i + 1).padStart(2, "0")}`,
        tmax: 10, tmin: 6, windMax: 20, windGust: 25, rain: 0, hasHazard: false,
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        date: `2026-07-${String(i + 4).padStart(2, "0")}`,
        tmax: 10, tmin: 6, windMax: 2, windGust: 3, rain: 0, hasHazard: false,
      })),
    ];
    const site = makeSite({ id: "mixed", forecast });

    const [r3] = rankCalmest([site], { days: 3 });
    const [r7] = rankCalmest([site], { days: 7 });

    // First 3 days only: avgWind = 20
    expect(r3.metrics.avgWind).toBeCloseTo(20, 5);
    // All 7 days: avgWind = (3 * 20 + 4 * 2) / 7 = 68 / 7 ≈ 9.71
    expect(r7.metrics.avgWind).toBeCloseTo(68 / 7, 5);
    expect(r3.score).toBeGreaterThan(r7.score);
  });

  it("null/undefined entries in the campsites array are safely skipped", () => {
    const site = makeSite({ id: "ok" });
    expect(() => rankCalmest([null, site, undefined], {})).not.toThrow();
    const result = rankCalmest([null, site, undefined], {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ok");
  });

  it("does not mutate the input campsites array", () => {
    const sites = [makeSite({ id: "a" }), makeSite({ id: "b" })];
    const original = [...sites];
    rankCalmest(sites, { days: 3 });
    rankWarmest(sites, { days: 3 });
    rankDriest(sites, { days: 3 });
    expect(sites).toEqual(original);
  });

  it("maxDistanceKm: null means no distance filter", () => {
    const farSite = makeSite({ id: "far", distanceKm: 9999 });
    const result = rankCalmest([farSite], { maxDistanceKm: null });
    expect(result).toHaveLength(1);
  });
});
