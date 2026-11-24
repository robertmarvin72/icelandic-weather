// Ticket #504, P4/section-3 -- "runtime max 18 points" is a fact about the
// CURRENT frozen route geometry, not a code-enforced limit: neither
// winter-route-data.js nor forecastFetch.js has a max-points constant or
// chunking guard. This test demonstrates the actual max across every
// supported direction (and, for the two option pairs, every south/north
// variant) using the real resolver modules -- offline, no network call --
// and asserts each response carries exactly one of the three identity
// shapes, never a blend. It intentionally does not assert a production
// guard exists, because none does.
import { describe, it, expect } from "vitest";
import { WINTER_ROUTE_PLACES } from "../../../src/lib/winterRoutePlaces.js";
import {
  isBudardalurHolmavikPair,
  isWestfjordsBatchPair,
  isWestfjordsCompletionPair,
  isRingOptionPair,
  isRingCompletionPair,
} from "../../../src/pages/winterRoutePairClassification.js";
import { resolveBudardalurHolmavikGeometry, orderedForecastPoints } from "./budardalurHolmavikRoute.js";
import { resolveWestfjordsBatchGeometry } from "./westfjordsBatchRoute.js";
import { resolveWestfjordsCompletionGeometry } from "./westfjordsCompletionRoute.js";
import { resolveRingOptionGeometry } from "./ringOptionsRoute.js";
import { resolveRingCompletionGeometry } from "./ringCompletionRoute.js";

const ids = WINTER_ROUTE_PLACES.map((p) => p.id);
const directedPairs = [];
for (const a of ids) for (const b of ids) if (a !== b) directedPairs.push([a, b]);

function casesFor(from, to) {
  if (isBudardalurHolmavikPair(from, to)) {
    const geo = resolveBudardalurHolmavikGeometry(from, to);
    const pts = orderedForecastPoints(from);
    return [{ label: `${from}->${to}`, ok: geo.ok, pointCount: pts.length, identity: { regionVersion: geo.regionVersion } }];
  }
  if (isWestfjordsBatchPair(from, to)) {
    const geo = resolveWestfjordsBatchGeometry(from, to);
    return [{ label: `${from}->${to}`, ok: geo.ok, pointCount: geo.ok ? geo.pointIds.length : 0, identity: { regionVersion: geo.regionVersion } }];
  }
  if (isWestfjordsCompletionPair(from, to)) {
    const geo = resolveWestfjordsCompletionGeometry(from, to);
    return [{ label: `${from}->${to}`, ok: geo.ok, pointCount: geo.ok ? geo.pointIds.length : 0, identity: { regionVersion: geo.regionVersion } }];
  }
  if (isRingOptionPair(from, to)) {
    return ["south", "north"].map((option) => {
      const geo = resolveRingOptionGeometry(from, to, option);
      return {
        label: `${from}->${to}(${option})`, ok: geo.ok,
        pointCount: geo.ok ? geo.pointIds.length : 0,
        identity: geo.ok ? { selectedOption: option, policyVersion: geo.policyVersion, datasetVersion: geo.datasetVersion } : {},
      };
    });
  }
  if (isRingCompletionPair(from, to)) {
    const geo = resolveRingCompletionGeometry(from, to);
    return [{ label: `${from}->${to}`, ok: geo.ok, pointCount: geo.ok ? geo.pointIds.length : 0, identity: { datasetVersion: geo.datasetVersion } }];
  }
  return [];
}

const allCases = directedPairs.flatMap(([a, b]) => casesFor(a, b));

describe("Ticket #504 -- runtime max points across all supported directions (offline, no network)", () => {
  it("produces 54 cases: 50 directions, +4 for the 2 ring-option pairs' own south/north variant on both directions", () => {
    expect(allCases.length).toBe(54);
  });

  it("every case resolves ok", () => {
    for (const c of allCases) expect(c.ok, c.label).toBe(true);
  });

  it("max(pointCount) is exactly 18 (Rauðavatn->Selfoss north), not merely <= 18 -- the current frozen-data fact, not a guaranteed/enforced ceiling", () => {
    const max = Math.max(...allCases.map((c) => c.pointCount));
    expect(max).toBe(18);
    const atMax = allCases.filter((c) => c.pointCount === max).map((c) => c.label);
    expect(atMax).toEqual(["reykjavik-raudavatn->selfoss(north)"]);
  });

  it("no case exceeds 18 points", () => {
    for (const c of allCases) expect(c.pointCount, c.label).toBeLessThanOrEqual(18);
  });

  it("every case carries exactly one of the three identity shapes, never blended", () => {
    for (const c of allCases) {
      const keys = Object.keys(c.identity).filter((k) => c.identity[k] !== undefined);
      const hasRegion = keys.includes("regionVersion");
      const hasOption = keys.includes("selectedOption");
      const hasGeneric = keys.includes("datasetVersion") && !hasOption;
      const shapeCount = [hasRegion, hasOption, hasGeneric].filter(Boolean).length;
      expect(shapeCount, c.label).toBe(1);
    }
  });
});
