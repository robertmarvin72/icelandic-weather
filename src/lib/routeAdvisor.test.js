// src/lib/routeAdvisor.test.js
import { describe, it, expect } from "vitest";
import { getTomorrowRecommendation, getRouteRecommendationV2 } from "./routeAdvisor";

describe("getTomorrowRecommendation", () => {
  const sites = [
    { id: "A", lat: 64.145, lon: -21.875 }, // base
    { id: "B", lat: 64.185, lon: -21.85 },  // nearby
    { id: "C", lat: 64.25, lon: -21.9 },    // still ~within 50km-ish
    { id: "FAR", lat: 65.651, lon: -18.121 } // Akureyri far away
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
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function makeDaily({ startISO, tmaxs, rains, winds, gusts }) {
    const time = tmaxs.map((_, i) => {
      const d = new Date(`${startISO}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });

    return {
      daily: {
        time,
        temperature_2m_max: tmaxs,
        precipitation_sum: rains,
        windspeed_10m_max: winds,
        windgusts_10m_max: gusts,
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
      { id: "B", lat: 64.185, lon: -21.85 },  // candidate
      { id: "FAR", lat: 65.651, lon: -18.121 } // far away
    ];

    const start = todayISO();

    // Base: wet tomorrow and onwards => should be penalized by rain + streak
    const forecastA = makeDaily({
      startISO: start,
      tmaxs: [8, 8, 8, 8],
      rains: [0, 6, 6, 6],
      winds: [5, 5, 5, 5],
      gusts: [6, 6, 6, 6],
    });

    // B: dry => higher windowAvg
    const forecastB = makeDaily({
      startISO: start,
      tmaxs: [8, 8, 8, 8],
      rains: [0, 0, 0, 0],
      winds: [5, 5, 5, 5],
      gusts: [6, 6, 6, 6],
    });

    // FAR won't be considered due to distance (even if great)
    const forecastFAR = makeDaily({
      startISO: start,
      tmaxs: [14, 14, 14, 14],
      rains: [0, 0, 0, 0],
      winds: [0, 0, 0, 0],
      gusts: [0, 0, 0, 0],
    });

    const byId = { A: forecastA, B: forecastB, FAR: forecastFAR };

    const getForecastFn = async ({ lat, lon }) => {
      const s = sites.find((x) => x.lat === lat && x.lon === lon);
      return byId[s.id];
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
  });

  it("preselects at most limit candidates", async () => {
    const start = todayISO();

    const trivial = makeDaily({
      startISO: start,
      tmaxs: [8, 8, 8, 8],
      rains: [0, 0, 0, 0],
      winds: [5, 5, 5, 5],
      gusts: [6, 6, 6, 6],
    });

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
});