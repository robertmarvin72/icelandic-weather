// src/lib/relocationEngine.test.js
import { describe, it, expect } from "vitest";
import { relocationEngine } from "./relocationEngine";

function makeDailyRange({
  startISO = "2026-07-01",
  days = 10,
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

describe("relocationEngine (Ticket #119)", () => {
  it("throws on missing base site", () => {
    expect(() =>
      relocationEngine({
        baseSiteId: "NOPE",
        radiusKm: 50,
        startDateISO: "2026-07-02",
        days: 3,
        campsites: [{ id: "A", lat: 64.145, lon: -21.875 }],
        forecastMap: {},
      })
    ).toThrow(/Base site not found/);
  });

  it("ranks a better (drier) candidate within radius and ignores far sites", () => {
    const campsites = [
      { id: "A", name: "Base", lat: 64.145, lon: -21.875 }, // base
      { id: "B", name: "Dry", lat: 64.185, lon: -21.85 }, // near
      { id: "FAR", name: "Akureyri", lat: 65.651, lon: -18.121 }, // far away
    ];

    const startDateISO = "2026-07-02";

    // Base: rainy every day (plus streak)
    const forecastA = makeDailyRange({
      startISO: "2026-07-01",
      days: 10,
      tmax: 8,
      rain: 6,
      wind: 5,
      gust: 6,
    });

    // B: dry
    const forecastB = makeDailyRange({
      startISO: "2026-07-01",
      days: 10,
      tmax: 8,
      rain: 0,
      wind: 5,
      gust: 6,
    });

    // FAR: perfect but should be excluded by radius
    const forecastFAR = makeDailyRange({
      startISO: "2026-07-01",
      days: 10,
      tmax: 14,
      rain: 0,
      wind: 0,
      gust: 0,
    });

    const out = relocationEngine({
      baseSiteId: "A",
      radiusKm: 50,
      startDateISO,
      days: 3,
      campsites,
      forecastMap: { A: forecastA, B: forecastB, FAR: forecastFAR },
      config: { wetThresholdMm: 3 },
    });

    expect(out.bestSiteId).toBe("B");
    expect(out.bestTotal).toBeGreaterThanOrEqual(out.baseTotal);
    expect(out.ranked.some((r) => r.siteId === "FAR")).toBe(false); // excluded by distance
    expect(out.explain.base.windowDays.length).toBeGreaterThan(0);
  });

  it("includes structured reasons (e.g., rain) when improvement is meaningful", () => {
    const campsites = [
      { id: "A", name: "Base", lat: 64.145, lon: -21.875 },
      { id: "B", name: "Dry", lat: 64.185, lon: -21.85 },
    ];

    const out = relocationEngine({
      baseSiteId: "A",
      radiusKm: 50,
      startDateISO: "2026-07-02",
      days: 3,
      campsites,
      forecastMap: {
        A: makeDailyRange({ startISO: "2026-07-01", days: 10, tmax: 8, rain: 6, wind: 5, gust: 6 }),
        B: makeDailyRange({ startISO: "2026-07-01", days: 10, tmax: 8, rain: 0, wind: 5, gust: 6 }),
      },
      config: { reasonMinDelta: 0.5 },
    });

    const best = out.ranked[0];
    expect(best.siteId).toBe("B");
    expect(best.reasons.length).toBeGreaterThan(0);
    expect(best.reasons.some((x) => x.type === "rain" || x.type === "rainStreak")).toBe(true);
  });

  it("injects shelter into scoring and exposes shelter + shelterBonus in explain windowDays", () => {
    const campsites = [
      { id: "A", name: "NoShelter", lat: 64.145, lon: -21.875, shelter: 0 },
      { id: "B", name: "Sheltered", lat: 64.185, lon: -21.85, shelter: 10 },
    ];

    // same strong wind weather for both
    const strongWind = makeDailyRange({
      startISO: "2026-07-01",
      days: 10,
      tmax: 12,
      rain: 0,
      wind: 16,
      gust: 22,
    });

    const out = relocationEngine({
      baseSiteId: "A",
      radiusKm: 50,
      startDateISO: "2026-07-02",
      days: 3,
      campsites,
      forecastMap: { A: strongWind, B: strongWind },
      config: { reasonMinDelta: 0.5 },
    });

    expect(out.explain.base.windowDays.length).toBeGreaterThan(0);
    const baseDay0 = out.explain.base.windowDays[0];
    expect(baseDay0.shelter).toBe(0);

    const cand = out.explain.candidates.B;
    expect(cand.windowDays.length).toBeGreaterThan(0);
    const candDay0 = cand.windowDays[0];
    expect(candDay0.shelter).toBe(10);

    // If your scoring.js shelter logic is active, this should be >= 1 under strong wind.
    // If shelter logic is intentionally neutral, change this to >= 0.
    expect(candDay0.shelterBonus).toBeGreaterThanOrEqual(1);

    expect(out.bestSiteId).toBe("B");
  });

  it("clamps and normalizes shelter values (0..10) and accepts numeric strings", () => {
    const campsites = [
      { id: "A", name: "ClampLow", lat: 64.145, lon: -21.875, shelter: -5 },
      { id: "B", name: "ClampHigh", lat: 64.185, lon: -21.85, shelter: 999 },
      { id: "C", name: "String", lat: 64.19, lon: -21.84, shelter: "7" },
    ];

    const calm = makeDailyRange({
      startISO: "2026-07-01",
      days: 10,
      tmax: 12,
      rain: 0,
      wind: 10,
      gust: 12,
    });

    const out = relocationEngine({
      baseSiteId: "A",
      radiusKm: 50,
      startDateISO: "2026-07-02",
      days: 1,
      campsites,
      forecastMap: { A: calm, B: calm, C: calm },
      config: { minDeltaToMove: 0.1, reasonMinDelta: 0.1 },
    });

    expect(out.explain.base.windowDays[0].shelter).toBe(0);
    expect(out.explain.candidates.B.windowDays[0].shelter).toBe(10);
    expect(out.explain.candidates.C.windowDays[0].shelter).toBe(7);
  });
});
