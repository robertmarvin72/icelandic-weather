// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  SEGMENT_CATEGORY,
  categorizeAstandYfirbord,
  categorizeAstandVidbotaruppl,
  categorizePointAstand,
  categorizePointAstandWithStatus,
  classifySegment,
  isEligibleForPositiveStyle,
} from "./roadConditionCodes.js";

function activeNotice(astand) {
  return { astand, status: "active" };
}

const ALL_ASTAND_YFIRBORD = [
  "EKKI_I_THJONUSTU",
  "FAERT_FJALLABILUM",
  "FLUGHALT",
  "GREIDFAERT",
  "HALKA",
  "HALKUBLETTIR",
  "KRAP",
  "LOKAD",
  "OFAERT_ANNAD",
  "OFAERT_VEDUR",
  "OTHEKKT",
  "SNJOTHEKJA",
  "THAEFINGUR",
  "THUNGFAERT",
];

const ALL_ASTAND_VIDBOTARUPPL = [
  "ALLUR_AKSTUR_BANN",
  "ELJAGANGUR",
  "FAERT_FJALLABILUM",
  "MOKSTUR",
  "OSLETTUR_VEGUR",
  "OTHEKKT",
  "OVEDUR",
  "SANDBYLUR",
  "SKAFRENNINGUR",
  "SNJOKOMA",
  "STEINKAST",
  "STORHRID",
  "THOKA",
];

const ALL_POINT_ASTAND = ["VEGAVINNA", "ALLUR_AKSTUR_BANN", "VATNASKEMMDIR", "STEINKAST", "OSLETTUR_VEGUR", "ANNAD"];

describe("roadConditionCodes — every documented code classifies, never silently to 'good'", () => {
  it("every documented AstandYfirbord code resolves to a real category", () => {
    for (const code of ALL_ASTAND_YFIRBORD) {
      expect(categorizeAstandYfirbord(code)).not.toBeNull();
      expect(Object.values(SEGMENT_CATEGORY)).toContain(categorizeAstandYfirbord(code));
    }
  });

  it("GREIDFAERT is the only AstandYfirbord code resolving to PASSABLE", () => {
    const passable = ALL_ASTAND_YFIRBORD.filter((c) => categorizeAstandYfirbord(c) === SEGMENT_CATEGORY.PASSABLE);
    expect(passable).toEqual(["GREIDFAERT"]);
  });

  it("LOKAD resolves to CLOSED; OFAERT_* resolve to IMPASSABLE; EKKI_I_THJONUSTU to OUT_OF_SERVICE", () => {
    expect(categorizeAstandYfirbord("LOKAD")).toBe(SEGMENT_CATEGORY.CLOSED);
    expect(categorizeAstandYfirbord("OFAERT_ANNAD")).toBe(SEGMENT_CATEGORY.IMPASSABLE);
    expect(categorizeAstandYfirbord("OFAERT_VEDUR")).toBe(SEGMENT_CATEGORY.IMPASSABLE);
    expect(categorizeAstandYfirbord("EKKI_I_THJONUSTU")).toBe(SEGMENT_CATEGORY.OUT_OF_SERVICE);
  });

  it("every documented AstandVidbotaruppl code resolves to a real category", () => {
    for (const code of ALL_ASTAND_VIDBOTARUPPL) {
      expect(Object.values(SEGMENT_CATEGORY)).toContain(categorizeAstandVidbotaruppl(code));
    }
  });

  it("an absent AstandVidbotaruppl (null/empty) is not itself an unknown code", () => {
    expect(categorizeAstandVidbotaruppl(null)).toBeNull();
    expect(categorizeAstandVidbotaruppl(undefined)).toBeNull();
    expect(categorizeAstandVidbotaruppl("")).toBeNull();
  });

  it("every documented point Astand code resolves to a real category, none to PASSABLE", () => {
    for (const code of ALL_POINT_ASTAND) {
      const cat = categorizePointAstand(code);
      expect(Object.values(SEGMENT_CATEGORY)).toContain(cat);
      expect(cat).not.toBe(SEGMENT_CATEGORY.PASSABLE);
    }
  });

  it("an undocumented code (real retained-sample examples) is UNKNOWN_UNCLASSIFIED, never GOOD", () => {
    expect(categorizePointAstand("TONN_ALLS")).toBe(SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED);
    expect(categorizePointAstand("HOLUR_I_VEGI")).toBe(SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED);
    expect(categorizeAstandYfirbord("SOME_NEW_CODE")).toBe(SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED);
  });

  it("a missing/null/empty AstandYfirbord is UNKNOWN_UNCLASSIFIED, never PASSABLE", () => {
    expect(categorizeAstandYfirbord(null)).toBe(SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED);
    expect(categorizeAstandYfirbord("")).toBe(SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED);
  });
});

describe("classifySegment — closure/hazard always wins over a positive surface condition", () => {
  it("GREIDFAERT with no additional field and no point notices is PASSABLE", () => {
    expect(classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null }, [])).toBe(
      SEGMENT_CATEGORY.PASSABLE
    );
  });

  it("LOKAD in AstandYfirbord wins over everything else", () => {
    expect(classifySegment({ astandYfirbord: "LOKAD", astandVidbotaruppl: null }, [])).toBe(SEGMENT_CATEGORY.CLOSED);
  });

  it("ALLUR_AKSTUR_BANN in the additional field escalates a GREIDFAERT surface to CLOSED", () => {
    expect(classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: "ALLUR_AKSTUR_BANN" }, [])).toBe(
      SEGMENT_CATEGORY.CLOSED
    );
  });

  it("an active point notice with ALLUR_AKSTUR_BANN escalates an otherwise-GREIDFAERT segment to CLOSED", () => {
    expect(
      classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null }, [activeNotice("ALLUR_AKSTUR_BANN")])
    ).toBe(SEGMENT_CATEGORY.CLOSED);
  });

  it("a real-shaped roadworks (VEGAVINNA) point notice escalates GREIDFAERT to HAZARD_NOTICE, not CLOSED", () => {
    expect(classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null }, [activeNotice("VEGAVINNA")])).toBe(
      SEGMENT_CATEGORY.HAZARD_NOTICE
    );
  });

  it("an undocumented point Astand (TONN_ALLS/HOLUR_I_VEGI) never allows a GOOD result", () => {
    expect(classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null }, [activeNotice("TONN_ALLS")])).toBe(
      SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED
    );
    expect(
      classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null }, [activeNotice("HOLUR_I_VEGI")])
    ).toBe(SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED);
  });

  it("Round 2 (N2): an EXPIRED closure notice alone does not force CLOSED — downgrades to HAZARD_NOTICE", () => {
    expect(
      classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null }, [
        { astand: "ALLUR_AKSTUR_BANN", status: "expired" },
      ])
    ).toBe(SEGMENT_CATEGORY.HAZARD_NOTICE);
  });

  it("Round 2 (N2): an UNKNOWN-validity closure notice still counts as CLOSED (never downgraded just for unconfirmed validity)", () => {
    expect(
      classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null }, [
        { astand: "ALLUR_AKSTUR_BANN", status: "unknown" },
      ])
    ).toBe(SEGMENT_CATEGORY.CLOSED);
  });

  it("Round 2 (N2): an active closure elsewhere still reads CLOSED even if another notice on the same segment is expired", () => {
    expect(
      classifySegment({ astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null }, [
        { astand: "ALLUR_AKSTUR_BANN", status: "expired" },
        { astand: "ALLUR_AKSTUR_BANN", status: "active" },
      ])
    ).toBe(SEGMENT_CATEGORY.CLOSED);
  });

  it("a missing segment entry (never fetched/found) is never classified PASSABLE by default", () => {
    expect(classifySegment({ astandYfirbord: null, astandVidbotaruppl: null }, [])).toBe(
      SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED
    );
  });
});

describe("categorizePointAstandWithStatus (N2)", () => {
  it("an expired ALLUR_AKSTUR_BANN downgrades CLOSED to HAZARD_NOTICE", () => {
    expect(categorizePointAstandWithStatus("ALLUR_AKSTUR_BANN", "expired")).toBe(SEGMENT_CATEGORY.HAZARD_NOTICE);
  });

  it("an active or unknown-validity ALLUR_AKSTUR_BANN stays CLOSED", () => {
    expect(categorizePointAstandWithStatus("ALLUR_AKSTUR_BANN", "active")).toBe(SEGMENT_CATEGORY.CLOSED);
    expect(categorizePointAstandWithStatus("ALLUR_AKSTUR_BANN", "unknown")).toBe(SEGMENT_CATEGORY.CLOSED);
  });

  it("a non-closure code is unaffected by status", () => {
    expect(categorizePointAstandWithStatus("VEGAVINNA", "expired")).toBe(SEGMENT_CATEGORY.HAZARD_NOTICE);
    expect(categorizePointAstandWithStatus("VEGAVINNA", "active")).toBe(SEGMENT_CATEGORY.HAZARD_NOTICE);
  });
});

describe("isEligibleForPositiveStyle", () => {
  it("requires PASSABLE + fresh export + fresh registration", () => {
    expect(
      isEligibleForPositiveStyle(SEGMENT_CATEGORY.PASSABLE, { exportIsStale: false, segmentRegistrationIsOld: false })
    ).toBe(true);
  });

  it("Round 2 (R1a): an unavailable/stale points feed denies positive styling even when PASSABLE and otherwise fresh", () => {
    expect(
      isEligibleForPositiveStyle(SEGMENT_CATEGORY.PASSABLE, {
        exportIsStale: false,
        segmentRegistrationIsOld: false,
        pointsFeedUnavailableOrStale: true,
      })
    ).toBe(false);
  });

  it("omitting pointsFeedUnavailableOrStale defaults to not gating (backward compatible)", () => {
    expect(
      isEligibleForPositiveStyle(SEGMENT_CATEGORY.PASSABLE, { exportIsStale: false, segmentRegistrationIsOld: false })
    ).toBe(true);
  });

  it("a stale export denies positive styling even when PASSABLE", () => {
    expect(
      isEligibleForPositiveStyle(SEGMENT_CATEGORY.PASSABLE, { exportIsStale: true, segmentRegistrationIsOld: false })
    ).toBe(false);
  });

  it("an old per-segment registration denies positive styling even when PASSABLE", () => {
    expect(
      isEligibleForPositiveStyle(SEGMENT_CATEGORY.PASSABLE, { exportIsStale: false, segmentRegistrationIsOld: true })
    ).toBe(false);
  });

  it("any non-PASSABLE category is never eligible, regardless of freshness", () => {
    expect(
      isEligibleForPositiveStyle(SEGMENT_CATEGORY.HAZARD_NOTICE, {
        exportIsStale: false,
        segmentRegistrationIsOld: false,
      })
    ).toBe(false);
  });
});
