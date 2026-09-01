import { describe, it, expect } from "vitest";
import { selectAuroraDisplay } from "./auroraDisplaySelection";

function loc(id, band) {
  return { locationId: id, name: id, lat: 0, lon: 0, score: 50, band, reasons: [], flags: [] };
}

describe("selectAuroraDisplay — qualifying filter, order, and cap", () => {
  it("filters to excellent/good/fair only, preserving canonical order", () => {
    const result = selectAuroraDisplay({
      best: loc("a", "excellent"),
      alternatives: [loc("b", "poor"), loc("c", "good"), loc("d", "very-poor"), loc("e", "fair")],
      isPro: true,
    });
    expect(result.qualifyingLocations.map((l) => l.locationId)).toEqual(["a", "c", "e"]);
  });

  it("caps at six without backfilling with non-qualifying entries", () => {
    const alternatives = [
      loc("b", "good"),
      loc("c", "fair"),
      loc("d", "excellent"),
      loc("e", "good"),
      loc("f", "fair"),
      loc("g", "excellent"), // 7th qualifying — dropped
      loc("h", "poor"), // never used to pad the count
    ];
    const result = selectAuroraDisplay({ best: loc("a", "excellent"), alternatives, isPro: true });
    expect(result.qualifyingLocations).toHaveLength(6);
    expect(result.qualifyingLocations.map((l) => l.locationId)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("never mutates the caller's best/alternatives", () => {
    const best = loc("a", "excellent");
    const alternatives = [loc("b", "good")];
    const bestCopy = { ...best };
    const altCopy = [...alternatives];
    selectAuroraDisplay({ best, alternatives, isPro: true });
    expect(best).toEqual(bestCopy);
    expect(alternatives).toEqual(altCopy);
  });
});

describe("selectAuroraDisplay — hasQualifyingLocations / bestAvailable", () => {
  it("hasQualifyingLocations is true when at least one entry qualifies", () => {
    const result = selectAuroraDisplay({ best: loc("a", "fair"), alternatives: [], isPro: true });
    expect(result.hasQualifyingLocations).toBe(true);
  });

  it("hasQualifyingLocations is false when every entry is poor/very-poor", () => {
    const result = selectAuroraDisplay({ best: loc("a", "poor"), alternatives: [loc("b", "very-poor")], isPro: true });
    expect(result.hasQualifyingLocations).toBe(false);
  });

  it("bestAvailable is always the raw canonical best, regardless of band, for the all-poor fallback", () => {
    const best = loc("a", "poor");
    const result = selectAuroraDisplay({ best, alternatives: [], isPro: true });
    expect(result.bestAvailable).toBe(best);
  });

  it("bestAvailable is null when best is null", () => {
    const result = selectAuroraDisplay({ best: null, alternatives: [], isPro: true });
    expect(result.bestAvailable).toBeNull();
    expect(result.hasQualifyingLocations).toBe(false);
    expect(result.qualifyingLocations).toEqual([]);
  });
});

describe("selectAuroraDisplay — showRanking (presentation-only isPro gate)", () => {
  it("is true only when isPro AND qualifying locations exist", () => {
    expect(selectAuroraDisplay({ best: loc("a", "good"), alternatives: [], isPro: true }).showRanking).toBe(true);
    expect(selectAuroraDisplay({ best: loc("a", "good"), alternatives: [], isPro: false }).showRanking).toBe(false);
    expect(selectAuroraDisplay({ best: loc("a", "poor"), alternatives: [], isPro: true }).showRanking).toBe(false);
  });
});

describe("selectAuroraDisplay — showMap (>=2 qualifying AND >=2 distinct bands)", () => {
  it("false for zero qualifying locations", () => {
    expect(selectAuroraDisplay({ best: loc("a", "poor"), alternatives: [], isPro: true }).showMap).toBe(false);
  });

  it("false for exactly one qualifying location", () => {
    expect(selectAuroraDisplay({ best: loc("a", "good"), alternatives: [loc("b", "poor")], isPro: true }).showMap).toBe(false);
  });

  it("false for two-or-more qualifying locations that share the same band", () => {
    const result = selectAuroraDisplay({ best: loc("a", "good"), alternatives: [loc("b", "good"), loc("c", "good")], isPro: true });
    expect(result.showMap).toBe(false);
  });

  it("true for two-or-more qualifying locations across two distinct bands", () => {
    const result = selectAuroraDisplay({ best: loc("a", "excellent"), alternatives: [loc("b", "fair")], isPro: true });
    expect(result.showMap).toBe(true);
  });

  it("false when isPro is false, even with qualifying multi-band data (map is Pro-only)", () => {
    const result = selectAuroraDisplay({ best: loc("a", "excellent"), alternatives: [loc("b", "fair")], isPro: false });
    expect(result.showMap).toBe(false);
  });
});
