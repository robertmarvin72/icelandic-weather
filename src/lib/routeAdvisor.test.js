// src/lib/routeAdvisor.test.js
import { describe, it, expect } from "vitest";
import { getTomorrowRecommendation, getRouteRecommendationV2 } from "./routeAdvisor";

describe("getTomorrowRecommendation", () => {
  const sites = [
    { id: "A", lat: 64.145, lon: -21.875 }, // base
    { id: "B", lat: 64.185, lon: -21.85 }, // nearby
    { id: "C", lat: 64.25, lon: -21.9 }, // still ~within 50km-ish
    { id: "FAR", lat: 65.651, lon: -18.121 }, // Akureyri far away
  ];

  it("throws if base site is missing", () => {
    expect(() => getTomorrowRecommendation("NOPE", {}, sites)).toThrow(/Base site not found/);
  });

  it("stays if no candidates within 50km", () => {
    const onlyBaseAndFar = [sites[0], sites[3]];
    const scores = { A: 4, FAR: 9 };
    const r = getTomorrowRecommendation("A", scores, onlyBaseAndFar);
    expect(r.verdict).toBe("stay");
    expect(r.bestSiteId).toBe(null);
    expect(r.delta).toBe(0);
    expect(r.currentScore).toBe(4);
    expect(r.radiusKmUsed).toBe(50);
    expect(r.candidatesConsidered).toBe(0);
  });

  it("picks best site within 50km by tomorrow score", () => {
    const scores = { A: 4, B: 6, C: 5, FAR: 10 };
    const r = getTomorrowRecommendation("A", scores, sites);
    expect(r.bestSiteId).toBe("B");
    expect(r.bestScore).toBe(6);
    expect(r.currentScore).toBe(4);
    expect(r.delta).toBe(2);
    expect(r.verdict).toBe("move");
  });

  it('verdict "consider" when delta is +1', () => {
    const scores = { A: 4, B: 5, C: 3 };
    const r = getTomorrowRecommendation("A", scores, sites);
    expect(r.bestSiteId).toBe("B");
    expect(r.delta).toBe(1);
    expect(r.verdict).toBe("consider");
  });

  it('verdict "stay" when best is not better', () => {
    const scores = { A: 6, B: 6, C: 5 };
    const r = getTomorrowRecommendation("A", scores, sites);
    expect(r.bestSiteId).toBe("B");
    expect(r.delta).toBe(0);
    expect(r.verdict).toBe("stay");
  });

  it("supports object-shaped score maps (tomorrow / tomorrowScore / score)", () => {
    const scores = {
      A: { tomorrow: 4 },
      B: { tomorrowScore: 6 },
      C: { score: 5 },
    };
    const r = getTomorrowRecommendation("A", scores, sites);
    expect(r.bestSiteId).toBe("B");
    expect(r.bestScore).toBe(6);
    expect(r.verdict).toBe("move");
  });

  it("treats missing/invalid scores as 0 (deterministic)", () => {
    const scores = { A: null, B: undefined, C: "nope" };
    const r = getTomorrowRecommendation("A", scores, sites);
    expect(r.currentScore).toBe(0);
    expect(r.bestScore).toBe(0);
    expect(r.delta).toBe(0);
    expect(r.verdict).toBe("stay");
  });
});

describe("getRouteRecommendationV2", () => {
  // Build a "safe" daily dataset that ALWAYS contains whatever targetDateISO is,
  // even if other tests left fake timers on or system time is weird.
  function makeDailyLong({
    startISO = "1960-01-01",
    days = 30000,
    tmax = 8,
    rain = 0,
    wind = 5,
    gust = 6,
  }) {
    const start = new Date(`${startISO}T00:00:00.000Z`);
    const time = new Array(days);

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      time[i] = d.toISOString().slice(0, 10);
    }

    // Must match src/lib/forecastNormalize.js keys exactly:
    return {
      daily: {
        time,
        temperature_2m_max: new Array(days).fill(tmax),
        precipitation_sum: new Array(days).fill(rain),
        windspeed_10m_max: new Array(days).fill(wind),
        windgusts_10m_max: new Array(days).fill(gust),
      },
    };
  }

  it("returns stay when base forecast fails (resilient)", async () => {
    const sites = [
      { id: "A", lat: 64.145, lon: -21.875 },
      { id: "B", lat: 64.185, lon: -21.85 },
    ];

    const getForecastFn = async () => {
      throw new Error("network");
    };

    const r = await getRouteRecommendationV2("A", sites, {
      radiusKm: 50,
      limit: 30,
      windowDays: 3,
      wetThresholdMm: 3,
      getForecastFn,
    });

    expect(r.verdict).toBe("stay");
    expect(r.currentScore).toBe(0);
    expect(r.bestSiteId).toBe(null);
    expect(r.candidatesConsidered).toBe(0);
  });

  it("picks best site based on tomorrow windowAvg (with rain streak applied)", async () => {
    const sites = [
      { id: "A", lat: 64.145, lon: -21.875 }, // base
      { id: "B", lat: 64.185, lon: -21.85 }, // candidate
      { id: "FAR", lat: 65.651, lon: -18.121 }, // far away
    ];

    // Base: always wet => should be penalized (rain + streak)
    const forecastA = makeDailyLong({ tmax: 8, rain: 6, wind: 5, gust: 6 });

    // B: always dry => better windowAvg
    const forecastB = makeDailyLong({ tmax: 8, rain: 0, wind: 5, gust: 6 });

    // FAR is great, but should not be considered due to distance
    const forecastFAR = makeDailyLong({ tmax: 14, rain: 0, wind: 0, gust: 0 });

    const getForecastFn = async ({ lat, lon }) => {
      // IMPORTANT: do NOT use strict float matching via find().
      // Just route based on known coordinates directly:
      if (lat === 64.145 && lon === -21.875) return forecastA;
      if (lat === 64.185 && lon === -21.85) return forecastB;
      if (lat === 65.651 && lon === -18.121) return forecastFAR;
      return forecastA;
    };

    const r = await getRouteRecommendationV2("A", sites, {
      radiusKm: 50,
      limit: 30,
      windowDays: 3,
      wetThresholdMm: 3,
      getForecastFn,
    });

    expect(r.bestSiteId).toBe("B");
    expect(r.bestScore).toBeGreaterThanOrEqual(r.currentScore);
    expect(r.candidatesConsidered).toBeGreaterThan(0);
  });

  it("preselects at most limit candidates", async () => {
    const trivial = makeDailyLong({ tmax: 8, rain: 0, wind: 5, gust: 6 });

    const base = { id: "A", lat: 64.145, lon: -21.875 };
    const many = [base];
    for (let i = 0; i < 100; i++) {
      many.push({
        id: `S${i}`,
        lat: base.lat + i * 0.0001,
        lon: base.lon - i * 0.0001,
      });
    }

    const getForecastFn = async () => trivial;

    const r = await getRouteRecommendationV2("A", many, {
      radiusKm: 50,
      limit: 30,
      windowDays: 3,
      getForecastFn,
    });

    expect(r.candidatesPreselected).toBeLessThanOrEqual(30);
  });

  it("injects site.shelter into scoring and exposes shelter + shelterBonus in explain windowDays", async () => {
    const sites = [
      { id: "A", lat: 64.145, lon: -21.875, shelter: 0 }, // base no shelter
      { id: "B", lat: 64.185, lon: -21.85, shelter: 10 }, // high shelter
    ];

    // Same weather (strong wind) for both sites — difference should come from shelter.
    const strongWind = makeDailyLong({ tmax: 12, rain: 0, wind: 16, gust: 22 });

    const getForecastFn = async ({ lat, lon }) => {
      if (lat === 64.145 && lon === -21.875) return strongWind;
      if (lat === 64.185 && lon === -21.85) return strongWind;
      return strongWind;
    };

    const r = await getRouteRecommendationV2("A", sites, {
      radiusKm: 50,
      limit: 30,
      windowDays: 3,
      wetThresholdMm: 3,
      topN: 1,
      getForecastFn,
    });

    // Base explain must exist
    expect(r.explain?.base?.windowDays?.length).toBeGreaterThan(0);

    const baseDay0 = r.explain.base.windowDays[0];

    // These two require your pickDayExplain() to include shelter fields (per Ticket #108)
    expect(baseDay0.shelter).toBe(0);
    expect(baseDay0.shelterBonus).toBe(0);

    const cand = r.explain.candidates?.B;
    expect(cand?.windowDays?.length).toBeGreaterThan(0);

    const candDay0 = cand.windowDays[0];
    expect(candDay0.shelter).toBe(10);

    // With strong wind + high shelter, shelterBonus should be >= 1
    expect(candDay0.shelterBonus).toBeGreaterThanOrEqual(1);
  });

  it("clamps and normalizes shelter values (0..10, accepts numeric strings)", async () => {
    const sites = [
      { id: "A", lat: 64.145, lon: -21.875, shelter: -5 }, // clamp -> 0
      { id: "B", lat: 64.185, lon: -21.85, shelter: 999 }, // clamp -> 10
      { id: "C", lat: 64.19, lon: -21.84, shelter: "7" }, // string -> 7
    ];

    const weather = makeDailyLong({ tmax: 12, rain: 0, wind: 16, gust: 22 });

    const getForecastFn = async ({ lat, lon }) => {
      if (lat === 64.145 && lon === -21.875) return weather;
      if (lat === 64.185 && lon === -21.85) return weather;
      if (lat === 64.19 && lon === -21.84) return weather;
      return weather;
    };

    const r = await getRouteRecommendationV2("A", sites, {
      radiusKm: 50,
      limit: 30,
      windowDays: 1,
      wetThresholdMm: 3,
      topN: 3,
      getForecastFn,
    });

    // Base (A) should be clamped to 0
    expect(r.explain.base.windowDays[0].shelter).toBe(0);

    // B should be clamped to 10
    expect(r.explain.candidates.B.windowDays[0].shelter).toBe(10);

    // C should parse string "7"
    expect(r.explain.candidates.C.windowDays[0].shelter).toBe(7);
  });
});
