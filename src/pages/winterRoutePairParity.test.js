// src/pages/winterRoutePairParity.test.js
// Ticket #503 ring-completion, P7 -- "Paritetspróf í repo (lokar S1 úr
// ring-options)": a checked-in test that reads the pair allowlist from
// the FRONTEND (winterRoutePairClassification.js's exported pair-classification
// functions) and from the BACKEND (every resolver module's own exported
// pair-check), and fails if either list changes without the other.
//
// Ticket #492, direct-flow, R2 -- updated for the 13-place list (the
// original 11 UI places + the two fixed-route-adapter places `vik`/
// `borgarnes`, added by direct-flow C6). This file deliberately keeps
// TWO SEPARATE layers rather than blending them (V2's own "ekki blandað"
// requirement):
//   - the OLD classification layer (isWinterRouteDataPair/ring-option/
//     ring-completion) -- unchanged, still exactly the original 11
//     places / 25 unordered pairs / 50 ordered directions;
//   - the NEW fixed-pair layer (WINTER_ROUTE_DIRECT_PAIRS/
//     resolveDirectPairRouteId) -- exactly the 2 new directions, which
//     are NOT known to the old classifiers at all (by design: the
//     geometry/data endpoints have no data for these two routes).
// The combined total (156 directional pairs among all 13 places, 52
// supported = 50 + 2, 104 unsupported) is computed FROM WINTER_ROUTE_PLACES
// itself, not hardcoded, so it stays correct if the place list ever
// changes again.
//
// Pure function imports only (no render) -- this file never mounts
// WinterRoute, so it can run in the default (node) vitest environment
// used by api/** tests, not jsdom.
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { WINTER_ROUTE_PLACES, WINTER_ROUTE_GROUP_OTHER } from "../lib/winterRoutePlaces";
import { WINTER_ROUTE_DIRECT_PAIRS, resolveDirectPairRouteId } from "../lib/winterRouteRoutes";
import { isWinterRouteDataPair, isRingOptionPair as frontendIsRingOptionPair, isRingCompletionPair as frontendIsRingCompletionPair } from "./winterRoutePairClassification.js";
import { BUDARDALUR_HOLMAVIK_PLACE_IDS } from "../../api/_lib/winterRoute/budardalurHolmavikRoute.js";
import { isWestfjordsBatchPair } from "../../api/_lib/winterRoute/westfjordsBatchRoute.js";
import { isWestfjordsCompletionPair } from "../../api/_lib/winterRoute/westfjordsCompletionRoute.js";
import { isRingOptionPair as backendIsRingOptionPair } from "../../api/_lib/winterRoute/ringOptionsRoute.js";
import { isRingCompletionPair as backendIsRingCompletionPair } from "../../api/_lib/winterRoute/ringCompletionRoute.js";

// All 13 UI places (same list winterRoutePlaces.js offers).
const ALL_PLACES = WINTER_ROUTE_PLACES.map((place) => place.id);
// The original 11, derived from group membership (not hardcoded) -- the
// two direct-flow places are the only ones in WINTER_ROUTE_GROUP_OTHER.
const OLD_PLACES = WINTER_ROUTE_PLACES.filter((p) => p.group !== WINTER_ROUTE_GROUP_OTHER).map((p) => p.id);

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

// Ticket #492, direct-flow -- supported under EITHER layer: the old
// geometry/data classification, or the new fixed-route-adapter pair map.
// This is the function a combined "is this direction supported at all"
// check would use; the two layers never both claim the same pair (tested
// below).
function supportedAnyLayer(from, to) {
  return frontendEligible(from, to) || resolveDirectPairRouteId(from, to) != null;
}

describe("WinterRoute.jsx pair list vs. backend resolvers' own pair lists (P7 parity) -- OLD 11-place classification layer, unchanged by #492", () => {
  it("agree on every one of the 55 unordered pairs (110 ordered directions) among the 11 original UI places", () => {
    expect(OLD_PLACES).toHaveLength(11);
    const mismatches = [];
    let connectedOrdered = 0;
    for (const from of OLD_PLACES) {
      for (const to of OLD_PLACES) {
        if (from === to) continue;
        const fe = frontendEligible(from, to);
        const be = backendEligible(from, to);
        if (fe !== be) mismatches.push(`${from}->${to}: frontend=${fe} backend=${be}`);
        if (fe && be) connectedOrdered += 1;
      }
    }
    expect(mismatches).toEqual([]);
    // 25 connected unordered pairs = 50 ordered directions -- unchanged
    // by #492 (the two new places are not part of this classification
    // layer at all; see the separate fixed-pair layer below).
    expect(connectedOrdered).toBe(50);
  });

  it("exactly 25 of the 55 unordered pairs are connected; the other 30 (mixed Ring<->Westfjords, plus any other combination) are not", () => {
    const seen = new Set();
    let connectedUnordered = 0;
    let totalUnordered = 0;
    for (let i = 0; i < OLD_PLACES.length; i++) {
      for (let j = i + 1; j < OLD_PLACES.length; j++) {
        const a = OLD_PLACES[i], b = OLD_PLACES[j];
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
    for (const p of OLD_PLACES) {
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
    for (const from of OLD_PLACES) {
      for (const to of OLD_PLACES) {
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

// Ticket #492, direct-flow, R2/V2 -- the NEW fixed-pair layer, tested
// entirely separately from the old classification layer above.
describe("Ticket #492, direct-flow -- the two new fixed-route-adapter directions, a separate layer", () => {
  it("has exactly two directions, both reykjavik-raudavatn -> {vik, borgarnes}", () => {
    expect(Object.keys(WINTER_ROUTE_DIRECT_PAIRS)).toHaveLength(2);
    expect(resolveDirectPairRouteId("reykjavik-raudavatn", "vik")).toBe("raudavatn-vik");
    expect(resolveDirectPairRouteId("reykjavik-raudavatn", "borgarnes")).toBe("raudavatn-borgarnes");
  });

  it("neither fixed direction is ALSO claimed by the old geometry/data classification layer (no double-layer overlap)", () => {
    expect(frontendEligible("reykjavik-raudavatn", "vik")).toBe(false);
    expect(frontendEligible("reykjavik-raudavatn", "borgarnes")).toBe(false);
    expect(backendEligible("reykjavik-raudavatn", "vik")).toBe(false);
    expect(backendEligible("reykjavik-raudavatn", "borgarnes")).toBe(false);
  });

  it("the reverse direction and every other combination involving vik/borgarnes resolve to null (never an invented reversal or wildcard)", () => {
    const negatives = [
      ["vik", "reykjavik-raudavatn"],
      ["borgarnes", "reykjavik-raudavatn"],
      ["vik", "borgarnes"],
      ["borgarnes", "vik"],
      ["hella", "vik"],
      ["selfoss", "vik"],
      ["borgarnes", "hella"],
      ["budardalur", "vik"],
      ["vik", "vik"],
      ["borgarnes", "borgarnes"],
    ];
    for (const [a, b] of negatives) {
      expect(resolveDirectPairRouteId(a, b)).toBeNull();
      // and not accidentally picked up by the old layer either.
      expect(frontendEligible(a, b)).toBe(false);
    }
  });
});

// Ticket #492, direct-flow, R2/V2 -- the combined total across all 13
// places, computed FROM WINTER_ROUTE_PLACES (not a hardcoded constant),
// so this test documents the real current numbers rather than asserting
// an unrelated fixed figure. "156 directional pairs, 52 supported, 104
// unsupported" per V2 -- never stated as "78 unordered pairs" (that
// count describes something else: UNORDERED pairs among 13 places,
// which conflates the two different-cardinality layers above and is not
// used as a claim about connectivity here).
describe("Ticket #492, direct-flow -- combined total across all 13 places (derived, not hardcoded)", () => {
  it("has exactly 13 places", () => {
    expect(ALL_PLACES).toHaveLength(13);
  });

  it("156 directional pairs total, exactly 52 supported (the old 50 + the 2 new fixed directions), 104 unsupported", () => {
    let total = 0;
    let supported = 0;
    for (const from of ALL_PLACES) {
      for (const to of ALL_PLACES) {
        if (from === to) continue;
        total += 1;
        if (supportedAnyLayer(from, to)) supported += 1;
      }
    }
    expect(total).toBe(156);
    expect(supported).toBe(52);
    expect(total - supported).toBe(104);
  });
});
