// @vitest-environment node
//
// Ticket #492, direct-flow, P6(c) — parity test between the backend's own
// surface-code tables (api/_lib/winterRoute/roadConditionCodes.js) and
// this frontend's own separately-maintained copy
// (winterRouteRoadConditionCodes.js). Runs under Node/Vitest only, never
// bundled into the shipped frontend — same convention as
// winterRouteRoutes.test.js's own backend-import parity test.
import { describe, it, expect } from "vitest";
import {
  WINTER_ROUTE_SEGMENT_CATEGORY,
  ASTAND_YFIRBORD_CATEGORY,
  ASTAND_VIDBOTARUPPL_CATEGORY,
  categorizeAstandYfirbord,
  categorizeAstandVidbotaruppl,
  winterRouteSurfaceDisplayCategory,
  winterRouteUnknownAdditionCode,
} from "./winterRouteRoadConditionCodes.js";
import {
  SEGMENT_CATEGORY,
  categorizeAstandYfirbord as backendCategorizeAstandYfirbord,
  categorizeAstandVidbotaruppl as backendCategorizeAstandVidbotaruppl,
} from "../../api/_lib/winterRoute/roadConditionCodes.js";

describe("Ticket #492, direct-flow, P6(c) — surface code table parity", () => {
  it("has the exact same SEGMENT_CATEGORY values on both sides", () => {
    expect(WINTER_ROUTE_SEGMENT_CATEGORY).toEqual(SEGMENT_CATEGORY);
  });

  it("has the exact same ASTAND_YFIRBORD keys/values as the backend", () => {
    for (const code of Object.keys(ASTAND_YFIRBORD_CATEGORY)) {
      expect(categorizeAstandYfirbord(code)).toBe(backendCategorizeAstandYfirbord(code));
    }
    // and the backend has no documented code this copy is missing
    const backendTable = Object.fromEntries(
      ["GREIDFAERT", "HALKA", "HALKUBLETTIR", "KRAP", "SNJOTHEKJA", "THAEFINGUR", "THUNGFAERT",
        "FAERT_FJALLABILUM", "FLUGHALT", "EKKI_I_THJONUSTU", "OFAERT_ANNAD", "OFAERT_VEDUR", "LOKAD", "OTHEKKT",
      ].map((code) => [code, backendCategorizeAstandYfirbord(code)])
    );
    expect(ASTAND_YFIRBORD_CATEGORY).toEqual(backendTable);
  });

  it("has the exact same ASTAND_VIDBOTARUPPL keys/values as the backend", () => {
    for (const code of Object.keys(ASTAND_VIDBOTARUPPL_CATEGORY)) {
      expect(categorizeAstandVidbotaruppl(code)).toBe(backendCategorizeAstandVidbotaruppl(code));
    }
    expect(categorizeAstandVidbotaruppl(null)).toBe(backendCategorizeAstandVidbotaruppl(null));
    expect(categorizeAstandVidbotaruppl("")).toBe(backendCategorizeAstandVidbotaruppl(""));
    expect(categorizeAstandVidbotaruppl("SOME_UNDOCUMENTED_CODE")).toBe(
      backendCategorizeAstandVidbotaruppl("SOME_UNDOCUMENTED_CODE")
    );
  });

  it("an unrecognized code maps to UNKNOWN_UNCLASSIFIED on both sides", () => {
    expect(categorizeAstandYfirbord("TONN_ALLS")).toBe(backendCategorizeAstandYfirbord("TONN_ALLS"));
    expect(categorizeAstandYfirbord("HOLUR_I_VEGI")).toBe(backendCategorizeAstandYfirbord("HOLUR_I_VEGI"));
  });
});

// P6 — the three root causes of a composite "unknown_unclassified"
// segment category, plus the two additional required cases (P6(e)).
describe("Ticket #492, direct-flow, P6 — winterRouteSurfaceDisplayCategory", () => {
  it("path A: known surface + an unclassified notice -- swaps to the real surface category", () => {
    const segment = {
      category: "unknown_unclassified",
      ambiguous: false,
      astandYfirbord: "HALKUBLETTIR",
      astandVidbotaruppl: null,
      notices: [{ astand: "SOME_UNDOCUMENTED_NOTICE_CODE", category: "unknown_unclassified" }],
    };
    expect(winterRouteSurfaceDisplayCategory(segment)).toBe("hazard_notice");
  });

  it("path B: ambiguous -- never swapped, stays unknown_unclassified", () => {
    const segment = { category: "unknown_unclassified", ambiguous: true, astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null };
    expect(winterRouteSurfaceDisplayCategory(segment)).toBe("unknown_unclassified");
  });

  it("path C: the surface's own astandYfirbord code is itself unclassified -- never swapped", () => {
    const segment = { category: "unknown_unclassified", ambiguous: false, astandYfirbord: "HOLUR_I_VEGI", astandVidbotaruppl: null };
    expect(winterRouteSurfaceDisplayCategory(segment)).toBe("unknown_unclassified");
  });

  // Ticket #492, direct-flow round 2, R4(2)/V4(2) -- CHANGED from round
  // 1. Round 1 folded AstandVidbotaruppl into the swap decision itself,
  // so this case stayed "unknown_unclassified" (wrongly hiding the known
  // GREIDFAERT surface). Ripley's round-2 decision: the swap depends
  // ONLY on AstandYfirbord being known and the segment not being
  // ambiguous -- so this now DOES swap to the real surface category,
  // with the unclassified addition surfaced separately (never hidden)
  // via winterRouteUnknownAdditionCode below, not by blocking the pill.
  it("known surface + unknown astandVidbotaruppl, round 2 -- swaps to the real surface category (the unknown addition is surfaced separately, not by blocking the pill)", () => {
    const segment = { category: "unknown_unclassified", ambiguous: false, astandYfirbord: "GREIDFAERT", astandVidbotaruppl: "TONN_ALLS" };
    expect(winterRouteSurfaceDisplayCategory(segment)).toBe("passable");
  });

  it("known road, no unknowns anywhere -- category is already real, left completely unchanged", () => {
    const segment = { category: "hazard_notice", ambiguous: false, astandYfirbord: "HALKA", astandVidbotaruppl: null };
    expect(winterRouteSurfaceDisplayCategory(segment)).toBe("hazard_notice");
  });

  it("missing segment data (astandYfirbord/astandVidbotaruppl both null) -- stays unknown, never swapped", () => {
    const segment = { category: "unknown_unclassified", ambiguous: false, astandYfirbord: null, astandVidbotaruppl: null };
    expect(winterRouteSurfaceDisplayCategory(segment)).toBe("unknown_unclassified");
  });

  it("never swaps a real closure/hazard composite category, however it was reached", () => {
    const segment = { category: "closed", ambiguous: false, astandYfirbord: "LOKAD", astandVidbotaruppl: null };
    expect(winterRouteSurfaceDisplayCategory(segment)).toBe("closed");
  });

  // Ticket #492, direct-flow round 2, V4(1) -- ambiguous + a REAL closure
  // (a closedCandidate won the ambiguous resolution server-side, so
  // `category` is "closed", never "unknown_unclassified") must never lose
  // its closure pill -- confirmed here since this function is never even
  // invoked to swap anything for a non-"unknown_unclassified" composite.
  it("ambiguous + a real closure -- the closure is never touched (this function only ever acts on unknown_unclassified)", () => {
    const segment = { category: "closed", ambiguous: true, astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null };
    expect(winterRouteSurfaceDisplayCategory(segment)).toBe("closed");
  });
});

// V4(2) -- the separate, always-surfaced "unknown addition code" line.
describe("Ticket #492, direct-flow round 2, V4(2) -- winterRouteUnknownAdditionCode", () => {
  it("returns the code when astandVidbotaruppl is present and itself unclassified", () => {
    const segment = { ambiguous: false, astandVidbotaruppl: "TONN_ALLS" };
    expect(winterRouteUnknownAdditionCode(segment)).toBe("TONN_ALLS");
  });

  it("returns null when astandVidbotaruppl is a known code", () => {
    const segment = { ambiguous: false, astandVidbotaruppl: "MOKSTUR" };
    expect(winterRouteUnknownAdditionCode(segment)).toBeNull();
  });

  it("returns null when astandVidbotaruppl is missing/blank", () => {
    expect(winterRouteUnknownAdditionCode({ ambiguous: false, astandVidbotaruppl: null })).toBeNull();
    expect(winterRouteUnknownAdditionCode({ ambiguous: false, astandVidbotaruppl: "" })).toBeNull();
  });

  it("returns null for an ambiguous segment, even with an unclassified astandVidbotaruppl (no single real value to name)", () => {
    const segment = { ambiguous: true, astandVidbotaruppl: "TONN_ALLS" };
    expect(winterRouteUnknownAdditionCode(segment)).toBeNull();
  });
});
