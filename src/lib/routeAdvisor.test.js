// src/lib/routeAdvisor.test.js
import { describe, it, expect } from "vitest";
import { getTomorrowRecommendation } from "./routeAdvisor";

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
    // Best will be first within radius with score 0; B or C depending on distance tie-breaking
    expect(r.currentScore).toBe(0);
    expect(r.bestScore).toBe(0);
    expect(r.delta).toBe(0);
    expect(r.verdict).toBe("stay");
  });
});
