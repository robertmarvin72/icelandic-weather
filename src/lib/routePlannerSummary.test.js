// Ticket #460 — deriveRoutePlannerSummary.js had NO test file before this
// ticket. The move->consider safety override uses a strict `=== "HIGH"`
// check (not a `!== "LOW"` fallback), so it already behaves correctly for
// UNKNOWN and for partial-coverage HIGH without any code change here — this
// file pins that behavior so a future edit can't silently regress it to a
// `!== "LOW"`-style check.
import { describe, it, expect } from "vitest";
import { deriveRoutePlannerSummary } from "./routePlannerSummary";

const RANKED = [{ siteId: "site-a", siteName: "Site A", recommendation: "move", distanceKm: 20 }];

function run(routeRiskData) {
  return deriveRoutePlannerSummary({
    result: { ranked: RANKED, recommendation: "move" },
    sites: [{ id: "site-a", name: "Site A" }],
    effectiveRadiusKm: 50,
    effectiveWindowDays: 3,
    routeRiskData,
    isPreview: false,
    isPro: true,
  });
}

describe("deriveRoutePlannerSummary — route-risk safety override", () => {
  it("HIGH (complete) overrides move -> consider", () => {
    expect(run({ routeRisk: "HIGH" }).decisionLower).toBe("consider");
  });

  it("HIGH with partial coverage STILL overrides move -> consider (lower-bound caution preserved)", () => {
    expect(run({ routeRisk: "HIGH", coverage: { status: "partial" } }).decisionLower).toBe("consider");
  });

  it("MED does not override (unchanged existing behavior)", () => {
    expect(run({ routeRisk: "MED" }).decisionLower).toBe("move");
  });

  it("UNKNOWN does not override and does not invent a HIGH-style caution", () => {
    expect(run({ routeRisk: "UNKNOWN" }).decisionLower).toBe("move");
  });

  it("LOW does not override", () => {
    expect(run({ routeRisk: "LOW" }).decisionLower).toBe("move");
  });

  it("no routeRiskData (null) does not override", () => {
    expect(run(null).decisionLower).toBe("move");
  });
});
