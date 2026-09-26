import { describe, it, expect } from "vitest";
import { classifyMultiNightComparison, AURORA_NEAR_TIE_TOLERANCE } from "./auroraMultiNightPolicy";
import { classifyAuroraOutcome } from "./auroraDecisionClassify";

const IDS = ["A", "B", "C"];
const TS = "2026-09-25T18:00:00.000Z";
const TS2 = "2026-09-25T20:00:00.000Z"; // a later, distinct refresh

function loc(id, score, band) {
  return { locationId: id, name: id, lat: 64, lon: -20, score, band, reasons: [], flags: [] };
}

function successBody({ evening, entries, sourceFetchedAt = TS, excluded = [] }) {
  const [best, ...alternatives] = entries;
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt, ageMinutes: 10 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: excluded.length > 0 ? "partial" : "success",
    best,
    alternatives,
    excluded,
    warnings: [],
  };
}

function unavailableBody({ evening, reason }) {
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: TS, ageMinutes: 10 },
    viewingWindow: null,
    status: "unavailable",
    reason,
    best: null,
    alternatives: [],
    excluded: [],
    warnings: [],
  };
}

function scored(body) {
  return classifyAuroraOutcome({ httpOk: true, body });
}

function resolvedSlot(date, daysAhead, classification) {
  return { date, daysAhead, status: "resolved", classification };
}

function pendingSlot(date, daysAhead) {
  return { date, daysAhead, status: "loading", classification: null };
}

function allComplete(evening, entries, sourceFetchedAt = TS) {
  return scored(successBody({ evening, entries, sourceFetchedAt }));
}

describe("classifyMultiNightComparison — accepted Phase 1 audit examples", () => {
  it("example 1: all pending", () => {
    const result = classifyMultiNightComparison({
      slots: [pendingSlot("2026-09-25", 0), pendingSlot("2026-09-26", 1), pendingSlot("2026-09-27", 2)],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("pending");
    expect(result.comparison).toBeNull();
  });

  it("example 2: zero scored (all unavailable)", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, scored(unavailableBody({ evening: "2026-09-25", reason: "night_not_found" }))),
        resolvedSlot("2026-09-26", 1, scored(unavailableBody({ evening: "2026-09-26", reason: "aurora_cache_unavailable" }))),
        resolvedSlot("2026-09-27", 2, scored(unavailableBody({ evening: "2026-09-27", reason: "invalid_darkness_window" }))),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("zero_usable");
    expect(result.comparison).toBeNull();
  });

  it("example 3: one poor + two missing", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 15, "very-poor"), loc("B", 10, "very-poor"), loc("C", 5, "very-poor")])),
        resolvedSlot("2026-09-26", 1, scored(unavailableBody({ evening: "2026-09-26", reason: "night_not_found" }))),
        resolvedSlot("2026-09-27", 2, scored(unavailableBody({ evening: "2026-09-27", reason: "night_not_found" }))),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("sole_available");
    expect(result.comparison).toEqual({ soleDate: "2026-09-25", soleDaysAhead: 0 });
  });

  it("example 4: two scored + one pending -> pending wins overall", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 50, "fair")])),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 70, "good")])),
        pendingSlot("2026-09-27", 2),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("pending");
  });

  it("example 5: three poor, complete comparable data -> all-three low chance", () => {
    const entries = [loc("A", 15, "very-poor"), loc("B", 10, "very-poor"), loc("C", 5, "very-poor")];
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", entries)),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", entries)),
        resolvedSlot("2026-09-27", 2, allComplete("2026-09-27", entries)),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("eligible");
    expect(result.comparison.kind).toBe("all_three_low_chance");
    expect(result.comparison.dates).toHaveLength(3);
  });

  it("example 6: a missing candidate on one night -> ineligible (incomplete_candidates)", () => {
    const entries = [loc("A", 50, "fair"), loc("B", 40, "poor")];
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, scored(successBody({ evening: "2026-09-25", entries, excluded: [{ locationId: "C", status: "weather_fetch_failed", reasons: ["weather_fetch_failed"] }] }))),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 50, "fair"), loc("B", 40, "poor"), loc("C", 30, "poor")])),
        resolvedSlot("2026-09-27", 2, allComplete("2026-09-27", [loc("A", 50, "fair"), loc("B", 40, "poor"), loc("C", 30, "poor")])),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("ineligible");
    expect(result.comparison.reason).toBe("incomplete_candidates");
  });

  it("example 7: identical incomplete candidate sets -> still ineligible (complete != merely identical)", () => {
    const entries = [loc("A", 50, "fair"), loc("B", 40, "poor")]; // same 1 (C) excluded on every night
    const excluded = [{ locationId: "C", status: "weather_fetch_failed", reasons: ["weather_fetch_failed"] }];
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, scored(successBody({ evening: "2026-09-25", entries, excluded }))),
        resolvedSlot("2026-09-26", 1, scored(successBody({ evening: "2026-09-26", entries, excluded }))),
        resolvedSlot("2026-09-27", 2, scored(successBody({ evening: "2026-09-27", entries, excluded }))),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("ineligible");
    expect(result.comparison.reason).toBe("incomplete_candidates");
  });

  it("example 8: refresh-straddling timestamps -> ineligible (timestamp_mismatch)", () => {
    const entries = [loc("A", 50, "fair"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", entries, TS)),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", entries, TS2)),
        resolvedSlot("2026-09-27", 2, allComplete("2026-09-27", entries, TS2)),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("ineligible");
    expect(result.comparison.reason).toBe("timestamp_mismatch");
  });

  it("example 9: comparable but stale -> eligible, comparison proceeds", () => {
    const entries = [loc("A", 70, "good"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    function staleBody(evening) {
      return {
        ...successBody({ evening, entries, sourceFetchedAt: TS }),
        auroraCache: { state: "stale", sourceFetchedAt: TS, ageMinutes: 600 },
      };
    }
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, scored(staleBody("2026-09-25"))),
        resolvedSlot("2026-09-26", 1, scored(staleBody("2026-09-26"))),
        resolvedSlot("2026-09-27", 2, scored(staleBody("2026-09-27"))),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("eligible");
    // Identical entries on all 3 nights -> an exact tie is the CORRECT
    // outcome here; the point of this example is that eligibility itself
    // is unaffected by staleness, not that a unique winner exists.
    expect(result.comparison.kind).toBe("similar");
    expect(result.comparison.isExactTie).toBe(true);
    expect(result.slots.every((s) => s.usable)).toBe(true);
  });
});

describe("classifyMultiNightComparison — additional required cases (approved-prompt-v4.md §7)", () => {
  it("two usable + one unavailable: eligible comparison among the two, scoped to available", () => {
    const entries = [loc("A", 70, "good"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", entries)),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", entries)),
        resolvedSlot("2026-09-27", 2, scored(unavailableBody({ evening: "2026-09-27", reason: "night_not_found" }))),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("eligible");
    expect(result.comparison.scopedToAvailable).toBe(true);
  });

  it("invalid/missing timestamp -> ineligible", () => {
    const entries = [loc("A", 70, "good"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    const badBody = { ...successBody({ evening: "2026-09-25", entries }), auroraCache: { state: "fresh", sourceFetchedAt: "not-a-date", ageMinutes: 10 } };
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, scored(badBody)),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", entries)),
        resolvedSlot("2026-09-27", 2, allComplete("2026-09-27", entries)),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("ineligible");
  });

  it("duplicate/missing candidate IDs in configured set never crash and correctly fail completeness", () => {
    const entries = [loc("A", 70, "good"), loc("B", 40, "poor")]; // only 2 of the 3 configured IDs scored
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", entries)),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", entries)),
      ],
      configuredLocationIds: ["A", "A", "B", "C"], // duplicate "A"
    });
    expect(result.state).toBe("ineligible");
    expect(result.comparison.reason).toBe("incomplete_candidates");
  });

  it("timestamp refresh boundary: identical timestamps ARE eligible (not just 'close')", () => {
    const entries = [loc("A", 70, "good"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    const result = classifyMultiNightComparison({
      slots: [resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", entries, TS)), resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", entries, TS))],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("eligible");
  });

  it("no-favorable: poor + very-poor combination (not all very-poor) -> no_favorable, not all_three_low_chance", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 35, "poor"), loc("B", 20, "very-poor"), loc("C", 10, "very-poor")])),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 18, "very-poor"), loc("B", 15, "very-poor"), loc("C", 10, "very-poor")])),
        resolvedSlot("2026-09-27", 2, allComplete("2026-09-27", [loc("A", 18, "very-poor"), loc("B", 15, "very-poor"), loc("C", 10, "very-poor")])),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("eligible");
    expect(result.comparison.kind).toBe("no_favorable");
  });

  it("score gap of exactly 0 -> exact tie", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 70, "good")])),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 70, "good")])),
      ],
      configuredLocationIds: ["A"],
    });
    expect(result.comparison.kind).toBe("similar");
    expect(result.comparison.isExactTie).toBe(true);
  });

  it("score gap of exactly 5 (the tolerance) -> included in the similar group, not an exact tie", () => {
    expect(AURORA_NEAR_TIE_TOLERANCE).toBe(5);
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 70, "good")])),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 65, "good")])),
      ],
      configuredLocationIds: ["A"],
    });
    expect(result.comparison.kind).toBe("similar");
    expect(result.comparison.isExactTie).toBe(false);
    expect(result.comparison.group).toHaveLength(2);
  });

  it("score gap of more than 5 -> sole top night, not similar", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 70, "good")])),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 64, "good")])),
      ],
      configuredLocationIds: ["A"],
    });
    expect(result.comparison.kind).toBe("best_night");
    expect(result.comparison.date).toBe("2026-09-25");
  });

  it("near-tie across canonical bands: a poor night within 5 points of a fair max is included, but bands themselves stay unchanged", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 44, "fair")])),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 39, "poor")])),
      ],
      configuredLocationIds: ["A"],
    });
    expect(result.comparison.kind).toBe("similar");
    const bands = result.comparison.group.map((g) => g.band);
    expect(bands).toContain("fair");
    expect(bands).toContain("poor"); // included in the group, band never rewritten to "fair"
  });

  it("non-transitive grouping: only members within 5 of the MAXIMUM qualify, not chained pairwise", () => {
    // A=80, B=76 (diff 4, in), C=72 (diff from A = 8, out; diff from B = 4, would be "close" pairwise but must NOT be included)
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 80, "good")])),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 76, "good")])),
        resolvedSlot("2026-09-27", 2, allComplete("2026-09-27", [loc("A", 72, "good")])),
      ],
      configuredLocationIds: ["A"],
    });
    expect(result.comparison.kind).toBe("similar");
    expect(result.comparison.group.map((g) => g.date).sort()).toEqual(["2026-09-25", "2026-09-26"]);
  });

  it("sole available night: no winner claimed, other nights stay unknown, never implied worse", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 90, "excellent")])),
        resolvedSlot("2026-09-26", 1, scored(unavailableBody({ evening: "2026-09-26", reason: "night_not_found" }))),
        resolvedSlot("2026-09-27", 2, scored(unavailableBody({ evening: "2026-09-27", reason: "night_not_found" }))),
      ],
      configuredLocationIds: ["A"],
    });
    expect(result.state).toBe("sole_available");
    expect(result.comparison.soleDate).toBe("2026-09-25");
  });

  it("pending overrides every final result, even when the other two are eligible and would otherwise produce a winner", () => {
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", [loc("A", 90, "excellent")])),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", [loc("A", 20, "very-poor")])),
        pendingSlot("2026-09-27", 2),
      ],
      configuredLocationIds: ["A"],
    });
    expect(result.state).toBe("pending");
    expect(result.comparison).toBeNull();
  });
});

describe("classifyMultiNightComparison — duplicate successful location IDs (Round 5)", () => {
  it("duplicate-plus-complete: every expected ID present AND one repeated -> ineligible (Set equality alone would accept it)", () => {
    // 4 scored entries for 3 configured IDs: A, B, C, plus a duplicated B.
    const dupEntries = [loc("A", 50, "fair"), loc("B", 40, "poor"), loc("C", 30, "poor"), loc("B", 39, "poor")];
    const okEntries = [loc("A", 50, "fair"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", dupEntries)),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", okEntries)),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("ineligible");
    expect(result.comparison.reason).toBe("incomplete_candidates");
    // Per-night usability is unaffected: the duplicated night still has its own outlook.
    expect(result.slots[0].usable).toBe(true);
    expect(result.slots[0].complete).toBe(false);
  });

  it("duplicate-replacing-missing: a repeated ID standing in for a missing one -> ineligible", () => {
    const dupReplacing = [loc("A", 50, "fair"), loc("B", 40, "poor"), loc("B", 39, "poor")]; // C missing, B doubled
    const okEntries = [loc("A", 50, "fair"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    const result = classifyMultiNightComparison({
      slots: [
        resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", dupReplacing)),
        resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", okEntries)),
      ],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("ineligible");
    expect(result.slots[0].complete).toBe(false);
  });

  it("a duplicated best ID inside alternatives is caught too", () => {
    const entries = [loc("A", 50, "fair"), loc("A", 49, "fair"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    const okEntries = [loc("A", 50, "fair"), loc("B", 40, "poor"), loc("C", 30, "poor")];
    const result = classifyMultiNightComparison({
      slots: [resolvedSlot("2026-09-25", 0, allComplete("2026-09-25", entries)), resolvedSlot("2026-09-26", 1, allComplete("2026-09-26", okEntries))],
      configuredLocationIds: IDS,
    });
    expect(result.state).toBe("ineligible");
  });
});
