import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import InstantComparison from "./InstantComparison";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../hooks/useT", () => ({ useT: () => (k) => k }));

// comparisonState shapes for the three directions
function makeState(direction, tier = 2) {
  const isStrongOrDecent = direction === "nearby_better";
  return {
    best: {
      site: { id: "site-nearby", name: "Nearby Site", lat: 64.5, lon: -20.5 },
      score: 70,
      distFromBase: 30,
    },
    currentMetrics: { avgWind: 10, totalRain: 8, avgHighTemp: 14 },
    nearbyMetrics: { avgWind: 5, totalRain: 3, avgHighTemp: 14 },
    strength: isStrongOrDecent ? "strong" : "mixed",
    primaryKey: isStrongOrDecent ? "wind" : null,
    worseningsCount: direction === "current_better" ? 1 : 0,
    isStrongOrDecent,
    scoreDiff: 15,
    tier: isStrongOrDecent ? tier : 0,
    showComparison: true,
    direction,
  };
}

const baseProps = {
  site: { id: "site-current", name: "Current Site", lat: 64.1, lon: -21 },
  currentScore: 55,
  rows: [{ windMax: 10, rain: 8, tmax: 14 }],
  siteList: [],
  scoresById: {
    "site-nearby": { score: 70, rows: [{ windMax: 5, rain: 3, tmax: 14 }] },
  },
  radiusKm: 50,
  homepageRecommendation: "move",
  lang: "is",
};

describe("InstantComparison — analytics preservation", () => {
  beforeEach(() => vi.clearAllMocks());

  // Requirement 10 & 12: better_nearby_found fires when nearby is meaningfully better
  it("fires better_nearby_found when direction=nearby_better (isStrongOrDecent=true)", () => {
    render(<InstantComparison {...baseProps} comparisonState={makeState("nearby_better", 2)} />);
    const found = trackEvent.mock.calls.find((c) => c[0] === "better_nearby_found");
    expect(found).toBeDefined();
  });

  // Requirement 11: better_nearby_found must NOT fire for similar
  it("does not fire better_nearby_found when direction=similar", () => {
    render(<InstantComparison {...baseProps} comparisonState={makeState("similar")} />);
    const found = trackEvent.mock.calls.find((c) => c[0] === "better_nearby_found");
    expect(found).toBeUndefined();
  });

  // Requirement 11: better_nearby_found must NOT fire for current_better
  it("does not fire better_nearby_found when direction=current_better", () => {
    render(<InstantComparison {...baseProps} comparisonState={makeState("current_better")} />);
    const found = trackEvent.mock.calls.find((c) => c[0] === "better_nearby_found");
    expect(found).toBeUndefined();
  });

  // Requirement 13: comparison_viewed fires exactly once per render (no duplicate)
  it("fires comparison_viewed exactly once on mount", () => {
    render(<InstantComparison {...baseProps} comparisonState={makeState("nearby_better", 2)} />);
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "comparison_viewed");
    expect(calls).toHaveLength(1);
  });

  // Requirement 12: stay_recommended behavior unchanged — comparison_viewed always fires
  it("fires comparison_viewed even when direction=similar (comparison card visible)", () => {
    render(<InstantComparison {...baseProps} comparisonState={makeState("similar")} />);
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "comparison_viewed");
    expect(calls).toHaveLength(1);
  });
});
