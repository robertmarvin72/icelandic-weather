// src/pages/winterRoutePairParity.test.js
// Ticket #503 ring-completion, P7 -- "Paritetspróf í repo (lokar S1 úr
// ring-options)": a checked-in test that reads the pair allowlist from
// the FRONTEND (winterRoutePairClassification.js's exported pair-classification
// functions) and from the BACKEND (every resolver module's own exported
// pair-check), and fails if either list changes without the other.
//
// Pure function imports only (no render) -- this file never mounts
// WinterRoute, so it can run in the default (node) vitest environment
// used by api/** tests, not jsdom.
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { WINTER_ROUTE_PLACES } from "../lib/winterRoutePlaces";
import { isWinterRouteDataPair, isRingOptionPair as frontendIsRingOptionPair, isRingCompletionPair as frontendIsRingCompletionPair } from "./winterRoutePairClassification.js";
import { BUDARDALUR_HOLMAVIK_PLACE_IDS } from "../../api/_lib/winterRoute/budardalurHolmavikRoute.js";
import { isWestfjordsBatchPair } from "../../api/_lib/winterRoute/westfjordsBatchRoute.js";
import { isWestfjordsCompletionPair } from "../../api/_lib/winterRoute/westfjordsCompletionRoute.js";
import { isRingOptionPair as backendIsRingOptionPair } from "../../api/_lib/winterRoute/ringOptionsRoute.js";
import { isRingCompletionPair as backendIsRingCompletionPair } from "../../api/_lib/winterRoute/ringCompletionRoute.js";

// The 11 UI-selectable places (same list winterRoutePlaces.js offers),
// matching "11 staðir ⇒ 55 pör" from the approved prompt's own sandbox.
const PLACES = WINTER_ROUTE_PLACES.map((place) => place.id);

function isBudardalurHolmavikPair(from, to) {
  return from !== to && BUDARDALUR_HOLMAVIK_PLACE_IDS.includes(from) && BUDARDALUR_HOLMAVIK_PLACE_IDS.includes(to);
}

function backendEligible(from, to) {
  return (
    isBudardalurHolmavikPair(from, to) ||
    isWestfjordsBatchPair(from, to) ||
    isWestfjordsCompletionPair(from, to) ||
    backendIsRingOptionPair(from, to) ||
    backendIsRingCompletionPair(from, to)
  );
}

function frontendEligible(from, to) {
  return isWinterRouteDataPair(from, to) || frontendIsRingOptionPair(from, to) || frontendIsRingCompletionPair(from, to);
}

describe("WinterRoute.jsx pair list vs. backend resolvers' own pair lists (P7 parity)", () => {
  it("agree on every one of the 55 unordered pairs (110 ordered directions) among the 11 UI places", () => {
    const mismatches = [];
    let connectedOrdered = 0;
    for (const from of PLACES) {
      for (const to of PLACES) {
        if (from === to) continue;
        const fe = frontendEligible(from, to);
        const be = backendEligible(from, to);
        if (fe !== be) mismatches.push(`${from}->${to}: frontend=${fe} backend=${be}`);
        if (fe && be) connectedOrdered += 1;
      }
    }
    expect(mismatches).toEqual([]);
    // 25 connected unordered pairs = 50 ordered directions.
    expect(connectedOrdered).toBe(50);
  });

  it("exactly 25 of the 55 unordered pairs are connected; the other 30 (mixed Ring<->Westfjords, plus any other combination) are not", () => {
    const seen = new Set();
    let connectedUnordered = 0;
    let totalUnordered = 0;
    for (let i = 0; i < PLACES.length; i++) {
      for (let j = i + 1; j < PLACES.length; j++) {
        const a = PLACES[i], b = PLACES[j];
        const key = [a, b].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        totalUnordered += 1;
        if (backendEligible(a, b)) connectedUnordered += 1;
      }
    }
    expect(totalUnordered).toBe(55);
    expect(connectedUnordered).toBe(25);
  });

  it("a same-place request is never classified as data-eligible by either side", () => {
    for (const p of PLACES) {
      expect(frontendEligible(p, p)).toBe(false);
      expect(backendEligible(p, p)).toBe(false);
    }
  });

  it("a representative mixed Ring<->Westfjords pair is unsupported on both sides (e.g. selfoss<->isafjordur, reykjavik-raudavatn<->budardalur)", () => {
    for (const [a, b] of [["selfoss", "isafjordur"], ["reykjavik-raudavatn", "budardalur"], ["egilsstadir", "holmavik"]]) {
      expect(frontendEligible(a, b)).toBe(false);
      expect(backendEligible(a, b)).toBe(false);
    }
  });

  it("exactly one of the four backend resolver branches ever claims a given connected pair -- never two at once", () => {
    for (const from of PLACES) {
      for (const to of PLACES) {
        if (from === to) continue;
        const claims = [
          isBudardalurHolmavikPair(from, to),
          isWestfjordsBatchPair(from, to),
          isWestfjordsCompletionPair(from, to),
          backendIsRingOptionPair(from, to),
          backendIsRingCompletionPair(from, to),
        ].filter(Boolean).length;
        expect(claims).toBeLessThanOrEqual(1);
      }
    }
  });
});
