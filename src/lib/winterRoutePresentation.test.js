// Ticket #486, Round 2 correction (N1) — targeted tests for the pure
// hour-of-day extraction helper, and its combination with the existing
// isDaytimeHour() day/night convention at the two hours Jonesy asked for
// (02 UTC, 14 UTC).
import { describe, it, expect, vi } from "vitest";
import { hourOfDayFromHourString, formatDecimal, formatHourLabel, formatTimestamp, formatValidatedUtcTimestamp, cacheAgeMinutesDisplay, flaggedRoadSegments, roadOverviewIsConfirmedClear, staleOldUniformity, shortenWinterRoutePointLabel, formatWinterRouteHourFull, formatWinterRouteHourValueText, winterRouteTimeSliderMarks } from "./winterRoutePresentation";
import { isDaytimeHour } from "./weatherPresentation";

describe("hourOfDayFromHourString", () => {
  it("extracts the hour from a fixed YYYY-MM-DDTHH:00 UTC string", () => {
    expect(hourOfDayFromHourString("2026-11-04T02:00")).toBe(2);
    expect(hourOfDayFromHourString("2026-11-04T14:00")).toBe(14);
    expect(hourOfDayFromHourString("2026-11-04T23:00")).toBe(23);
  });

  it("returns null for malformed/missing input, never a guessed hour", () => {
    expect(hourOfDayFromHourString(null)).toBeNull();
    expect(hourOfDayFromHourString(undefined)).toBeNull();
    expect(hourOfDayFromHourString("")).toBeNull();
    expect(hourOfDayFromHourString("not-a-date")).toBeNull();
  });
});

describe("N1 — day/night icon selection uses the existing isDaytimeHour convention, not a fixed isDay:true", () => {
  it("02:00 UTC is night", () => {
    expect(isDaytimeHour(hourOfDayFromHourString("2026-11-04T02:00"))).toBe(false);
  });

  it("14:00 UTC is day", () => {
    expect(isDaytimeHour(hourOfDayFromHourString("2026-11-04T14:00"))).toBe(true);
  });

  it("a null/unresolved hour never defaults to a fabricated 'day'", () => {
    expect(isDaytimeHour(hourOfDayFromHourString(null))).toBe(false);
  });
});

describe("formatDecimal / formatHourLabel / formatTimestamp (existing, unaffected by Round 2)", () => {
  it("formatDecimal uses a comma for is, a point for en", () => {
    expect(formatDecimal(1.5, "is")).toBe("1,5");
    expect(formatDecimal(1.5, "en")).toBe("1.5");
  });

  it("formatHourLabel and formatTimestamp read the string directly, never through Date", () => {
    expect(formatHourLabel("2026-11-04T15:00")).toBe("04.11 15:00");
    expect(formatTimestamp("2026-11-03T18:00:00.000Z")).toBe("2026-11-03 18:00");
  });

  it("formatTimestamp's own existing '—' fallback for invalid input is unchanged (legacy behavior, not touched by ticket #503 source-time)", () => {
    expect(formatTimestamp("short")).toBe("—");
    expect(formatTimestamp(null)).toBe("—");
  });
});

// Ticket #503 source-time, P6(8) -- formatValidatedUtcTimestamp is the
// NEW line's own validator: unlike formatTimestamp, any garbage string of
// 16+ characters must NOT slice through.
describe("formatValidatedUtcTimestamp (ticket #503 source-time, P4)", () => {
  it("formats a genuinely valid UTC instant the same way formatTimestamp does", () => {
    expect(formatValidatedUtcTimestamp("2026-11-24T09:15:00.000Z")).toBe("2026-11-24 09:15");
  });

  it("rejects a non-string, a too-short string, and a long garbage string that merely happens to be 16+ characters", () => {
    expect(formatValidatedUtcTimestamp(null)).toBeNull();
    expect(formatValidatedUtcTimestamp(undefined)).toBeNull();
    expect(formatValidatedUtcTimestamp(12345)).toBeNull();
    expect(formatValidatedUtcTimestamp("short")).toBeNull();
    expect(formatValidatedUtcTimestamp("not a real timestamp at all")).toBeNull(); // 16+ chars, would slice through formatTimestamp
    expect(formatValidatedUtcTimestamp("9999-99-99T99:99:00.000Z")).toBeNull(); // right shape, not a real date -- Date.parse rejects it
  });

  it("rejects a string with the right length but the wrong shape (no literal T/colon where expected)", () => {
    expect(formatValidatedUtcTimestamp("2026-11-24 09:15:00.000Z")).toBeNull(); // space instead of T
  });
});

// Ticket #503 source-time, P3(d)/P6(8) -- the exact 59999/60000/89999/90000
// ms boundaries Jonesy's own binding review named.
describe("cacheAgeMinutesDisplay (ticket #503 source-time, P3)", () => {
  it("59999ms is 'under a minute'; 60000ms rounds up to 1 minute", () => {
    expect(cacheAgeMinutesDisplay(59999)).toEqual({ underOneMinute: true, minutes: 0 });
    expect(cacheAgeMinutesDisplay(60000)).toEqual({ underOneMinute: false, minutes: 1 });
  });

  it("89999ms rounds down to 1 minute; 90000ms rounds up to 2 minutes (matches Math.round, the same rule the existing stale-line text uses)", () => {
    expect(cacheAgeMinutesDisplay(89999)).toEqual({ underOneMinute: false, minutes: 1 });
    expect(cacheAgeMinutesDisplay(90000)).toEqual({ underOneMinute: false, minutes: 2 });
  });

  it("0ms is 'under a minute', never a separately-coded zero case", () => {
    expect(cacheAgeMinutesDisplay(0)).toEqual({ underOneMinute: true, minutes: 0 });
  });

  it("rejects negative, non-finite, NaN, and non-numeric input -- the caller must then omit the line, never show a fabricated age", () => {
    expect(cacheAgeMinutesDisplay(-1)).toBeNull();
    expect(cacheAgeMinutesDisplay(NaN)).toBeNull();
    expect(cacheAgeMinutesDisplay(Infinity)).toBeNull();
    expect(cacheAgeMinutesDisplay(null)).toBeNull();
    expect(cacheAgeMinutesDisplay(undefined)).toBeNull();
    expect(cacheAgeMinutesDisplay("300000")).toBeNull();
  });
});

// Ticket #492, P4 -- which road sections the overview must surface
// without opening the details, and when "no notices" may honestly be
// stated.
function seg(overrides = {}) {
  return { idButur: 1, category: "passable", segmentDataAvailable: true, notices: [], ...overrides };
}
const CLEAN_ROAD_META = {
  available: true, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false, stale: false,
};

describe("flaggedRoadSegments (ticket #492, P4)", () => {
  it("a plain passable section with no notices and available data is never flagged", () => {
    expect(flaggedRoadSegments([seg()])).toEqual([]);
  });

  it("flags a non-passable category even with no notices", () => {
    const closed = seg({ idButur: 2, category: "closed" });
    expect(flaggedRoadSegments([seg(), closed])).toEqual([closed]);
  });

  it("flags a section whose own data is unavailable, regardless of category", () => {
    const unavailable = seg({ idButur: 3, segmentDataAvailable: false });
    expect(flaggedRoadSegments([unavailable])).toEqual([unavailable]);
  });

  it("flags a passable section that still carries a notice (active, expired, or unknown-validity alike)", () => {
    const withNotice = seg({ idButur: 4, notices: [{ idPunktur: 1, status: "expired" }] });
    expect(flaggedRoadSegments([withNotice])).toEqual([withNotice]);
  });

  it("treats a missing/non-array input as no sections, never a crash", () => {
    expect(flaggedRoadSegments(undefined)).toEqual([]);
    expect(flaggedRoadSegments(null)).toEqual([]);
  });
});

describe("roadOverviewIsConfirmedClear (ticket #492, P4)", () => {
  it("is true only when the feeds are confirmed fresh/available AND nothing is flagged", () => {
    expect(roadOverviewIsConfirmedClear([seg()], CLEAN_ROAD_META)).toBe(true);
  });

  it("is false when something is flagged, even with otherwise-clean roadMeta", () => {
    expect(roadOverviewIsConfirmedClear([seg({ category: "closed" })], CLEAN_ROAD_META)).toBe(false);
  });

  it("is false whenever any one of the required roadMeta flags is missing -- an honest 'unconfirmed', never a false all-clear", () => {
    expect(roadOverviewIsConfirmedClear([seg()], { ...CLEAN_ROAD_META, available: false })).toBe(false);
    expect(roadOverviewIsConfirmedClear([seg()], { ...CLEAN_ROAD_META, segmentsAvailable: false })).toBe(false);
    expect(roadOverviewIsConfirmedClear([seg()], { ...CLEAN_ROAD_META, pointsAvailable: false })).toBe(false);
    expect(roadOverviewIsConfirmedClear([seg()], { ...CLEAN_ROAD_META, pointsFeedUnavailableOrStale: true })).toBe(false);
    expect(roadOverviewIsConfirmedClear([seg()], { ...CLEAN_ROAD_META, stale: true })).toBe(false);
  });

  it("is false for a missing/empty roadMeta, never a crash or a false all-clear", () => {
    expect(roadOverviewIsConfirmedClear([seg()], null)).toBe(false);
    expect(roadOverviewIsConfirmedClear([seg()], {})).toBe(false);
  });
});

// Ticket #492, P3 (round 3 UX-priority) -- a passable section with no
// notices but stale/old data must still be flagged (never silently
// counted toward "all clear").
describe("flaggedRoadSegments also flags stale/old passable sections (round 3)", () => {
  it("flags a passable, notice-free section whose export is stale", () => {
    const staleOne = seg({ idButur: 5, export: { isStale: true } });
    expect(flaggedRoadSegments([staleOne])).toEqual([staleOne]);
  });

  it("flags a passable, notice-free section whose registration is old", () => {
    const oldOne = seg({ idButur: 6, registration: { isOld: true } });
    expect(flaggedRoadSegments([oldOne])).toEqual([oldOne]);
  });

  it("a plain fresh passable section (neither stale nor old) is still never flagged", () => {
    expect(flaggedRoadSegments([seg({ export: { isStale: false }, registration: { isOld: false } })])).toEqual([]);
  });

  it("roadOverviewIsConfirmedClear is false when a passable section is stale, even with clean roadMeta", () => {
    expect(roadOverviewIsConfirmedClear([seg({ export: { isStale: true } })], CLEAN_ROAD_META)).toBe(false);
  });
});

describe("staleOldUniformity (ticket #492, P3iv, round 3)", () => {
  it("returns null for an empty list", () => {
    expect(staleOldUniformity([])).toBeNull();
    expect(staleOldUniformity(undefined)).toBeNull();
  });

  it("returns the shared {isStale, isOld} combination when every flagged section is passable, notice-free, and shares the same combination", () => {
    const a = seg({ idButur: 1, export: { isStale: true }, registration: { isOld: false } });
    const b = seg({ idButur: 2, export: { isStale: true }, registration: { isOld: false } });
    expect(staleOldUniformity([a, b])).toEqual({ isStale: true, isOld: false });
  });

  it("returns null when the stale/old combination differs between sections", () => {
    const a = seg({ idButur: 1, export: { isStale: true } });
    const b = seg({ idButur: 2, registration: { isOld: true } });
    expect(staleOldUniformity([a, b])).toBeNull();
  });

  it("returns null when any flagged section is flagged for a DIFFERENT reason (closure/notice/unavailable), even if all are also stale -- never blends a closure into a blanket 'old data' sentence", () => {
    const staleOne = seg({ idButur: 1, export: { isStale: true } });
    const closedOne = seg({ idButur: 2, category: "closed", export: { isStale: true } });
    expect(staleOldUniformity([staleOne, closedOne])).toBeNull();
  });
});

describe("shortenWinterRoutePointLabel (ticket #492, P5, round 3)", () => {
  it("strips the 'Leiðarpunktur nærri ' prefix down to 'Nærri ' in Icelandic", () => {
    expect(shortenWinterRoutePointLabel("Leiðarpunktur nærri Hvolsvelli", "is")).toBe("Nærri Hvolsvelli");
  });

  it("strips the 'Route point near ' prefix down to 'Near ' in English", () => {
    expect(shortenWinterRoutePointLabel("Route point near Hvolsvöllur", "en")).toBe("Near Hvolsvöllur");
  });

  it("leaves an already-short 'Nærri X'/'Near X' label unchanged", () => {
    expect(shortenWinterRoutePointLabel("Nærri Öxnadalsheiði", "is")).toBe("Nærri Öxnadalsheiði");
    expect(shortenWinterRoutePointLabel("Near Öxnadalsheiði", "en")).toBe("Near Öxnadalsheiði");
  });

  it("leaves the Westfjords 'X — leiðarpunktur'/'X — route point' form unchanged", () => {
    expect(shortenWinterRoutePointLabel("Þröskuldar — leiðarpunktur", "is")).toBe("Þröskuldar — leiðarpunktur");
    expect(shortenWinterRoutePointLabel("Þröskuldar — route point", "en")).toBe("Þröskuldar — route point");
  });

  it("leaves a plain place name unchanged", () => {
    expect(shortenWinterRoutePointLabel("Selfoss", "is")).toBe("Selfoss");
  });

  it("passes non-string input through unchanged, never throws", () => {
    expect(shortenWinterRoutePointLabel(null, "is")).toBeNull();
    expect(shortenWinterRoutePointLabel(undefined, "is")).toBeUndefined();
  });
});

// Ticket #492, time-slider, P2 -- the slider's own full date/time
// formatter, separate from formatHourLabel/legacy keys.
describe("formatWinterRouteHourFull / formatWinterRouteHourValueText", () => {
  it("formats a real UTC hour with weekday/day/month/hour in both languages, explicitly in UTC (never the machine's own timezone)", () => {
    const is = formatWinterRouteHourFull("2026-11-25T23:00", "is");
    const en = formatWinterRouteHourFull("2026-11-25T23:00", "en");
    // Not hardcoding the exact ICU punctuation/casing (P2's own warning) --
    // just that the real weekday/day/month/hour digits are all present.
    expect(is).toMatch(/25/);
    expect(is).toMatch(/23:00/);
    expect(is.toLowerCase()).toMatch(/nóvember/);
    expect(en).toMatch(/25/);
    expect(en).toMatch(/23:00/);
    expect(en.toLowerCase()).toMatch(/november/);
  });

  it("midnight rollover crosses to the next day's weekday, in both languages", () => {
    const before = formatWinterRouteHourFull("2026-11-25T23:00", "en");
    const after = formatWinterRouteHourFull("2026-11-26T00:00", "en");
    expect(before.toLowerCase()).toMatch(/wednesday/);
    expect(after.toLowerCase()).toMatch(/thursday/);
    expect(after).toMatch(/00:00/);
  });

  it("a year boundary crosses month AND year correctly", () => {
    const before = formatWinterRouteHourFull("2026-12-31T23:00", "en");
    const after = formatWinterRouteHourFull("2027-01-01T00:00", "en");
    expect(before.toLowerCase()).toMatch(/december/);
    expect(after.toLowerCase()).toMatch(/january/);
  });

  it("never throws and never shows 'Invalid Date' for garbage/missing input -- returns the original value or em dash", () => {
    expect(formatWinterRouteHourFull("not-a-real-hour", "is")).toBe("not-a-real-hour");
    expect(formatWinterRouteHourFull(null, "is")).toBe("—");
    expect(formatWinterRouteHourFull(undefined, "en")).toBe("—");
    expect(formatWinterRouteHourFull("not-a-real-hour", "is")).not.toMatch(/Invalid/i);
  });

  it("formatWinterRouteHourValueText appends UTC to a real value, but never fabricates '— UTC' for invalid input", () => {
    expect(formatWinterRouteHourValueText("2026-11-25T23:00", "is")).toMatch(/UTC$/);
    expect(formatWinterRouteHourValueText(null, "is")).toBe("—");
    expect(formatWinterRouteHourValueText("garbage", "is")).toBe("garbage");
  });

  // P8 live-browser evidence found that Chromium's own ICU build has NO
  // Icelandic locale data at all (supportedLocalesOf(["is-IS","is"])
  // returns [] -- verified in both a real installed Chrome and
  // Playwright's own Chromium), so `new Intl.DateTimeFormat("is-IS", ...)`
  // never throws there -- it silently formats in English. Node's own
  // ICU (used by this test run) DOES support Icelandic, so this branch
  // is exercised by stubbing the exact same detection call the function
  // itself uses, simulating the real Chromium gap directly rather than
  // trusting that the test machine's own ICU happens to lack it too.
  it("falls back to an own Icelandic weekday/month table when Intl itself has no Icelandic locale data (the real Chromium gap)", () => {
    const spy = vi.spyOn(Intl.DateTimeFormat, "supportedLocalesOf").mockReturnValue([]);
    try {
      expect(formatWinterRouteHourFull("2026-11-25T23:00", "is")).toBe("miðvikudagur, 25. nóvember kl. 23:00");
      expect(formatWinterRouteHourFull("2026-11-25T23:00", "is")).not.toMatch(/Wednesday|November/);
      // English is unaffected -- en-GB is always supported, no fallback path for it.
      expect(formatWinterRouteHourFull("2026-11-25T23:00", "en")).toMatch(/Wednesday/);
    } finally {
      spy.mockRestore();
    }
  });

  it("the Icelandic fallback table handles a midnight/month rollover the same way the real Intl path does", () => {
    const spy = vi.spyOn(Intl.DateTimeFormat, "supportedLocalesOf").mockReturnValue([]);
    try {
      expect(formatWinterRouteHourFull("2026-11-30T23:00", "is")).toBe("mánudagur, 30. nóvember kl. 23:00");
      expect(formatWinterRouteHourFull("2026-12-01T00:00", "is")).toBe("þriðjudagur, 1. desember kl. 00:00");
    } finally {
      spy.mockRestore();
    }
  });
});

// Ticket #492, time-slider, P4 -- sparse tick-mark selection.
describe("winterRouteTimeSliderMarks", () => {
  function hoursFrom(startIso, count) {
    const start = new Date(startIso).getTime();
    const out = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(start + i * 3600000);
      out.push(d.toISOString().slice(0, 13) + ":00");
    }
    return out;
  }
  function minIndexGapFor(n) {
    return Math.max(1, Math.ceil(0.23 * (n - 1)));
  }

  it("returns [] for an empty list", () => {
    expect(winterRouteTimeSliderMarks([])).toEqual([]);
  });

  it("a single hour returns exactly one primary mark at index 0", () => {
    const marks = winterRouteTimeSliderMarks(["2026-11-25T23:00"]);
    expect(marks).toEqual([{ index: 0, label: "25.11", primary: true }]);
  });

  it("always includes the first and last index as primary marks when no date-break sits too close to either", () => {
    const hours = hoursFrom("2026-11-25T09:00:00Z", 24); // date-break at index 15, far from both edges
    const marks = winterRouteTimeSliderMarks(hours);
    expect(marks[0]).toMatchObject({ index: 0, primary: true });
    expect(marks[marks.length - 1]).toMatchObject({ index: 23, primary: true });
  });

  it("marks every real UTC date-boundary crossing as a primary date label, never a fixed +6h offset", () => {
    // Crosses midnight once, at local index 15 (09:00 + 15h = 00:00 next day).
    const hours = hoursFrom("2026-11-25T09:00:00Z", 24);
    const marks = winterRouteTimeSliderMarks(hours);
    const dateBreak = marks.find((m) => m.index === 15);
    expect(dateBreak).toMatchObject({ label: "26.11", primary: true });
  });

  it("never returns more than a small, bounded number of marks even for a long window", () => {
    const hours = hoursFrom("2026-11-25T09:00:00Z", 24);
    const marks = winterRouteTimeSliderMarks(hours);
    expect(marks.length).toBeLessThanOrEqual(8);
    expect(marks.length).toBeGreaterThanOrEqual(3);
  });

  it("secondary (non-edge, non-date-break) marks are flagged non-primary", () => {
    const hours = hoursFrom("2026-11-25T09:00:00Z", 24);
    const marks = winterRouteTimeSliderMarks(hours);
    expect(marks.some((m) => m.primary === false)).toBe(true);
  });

  // marks-fix round, P1(ii)/(iv) -- the exact regression a 24-slot window
  // starting near midnight used to trigger: an edge mark (index 0 or 23)
  // landing only 1-2 slots from the real date-break, close enough to
  // visually overlap it on a narrow mobile track. The fix must DROP the
  // colliding edge, never the date-break.
  it.each([22, 23, 0, 2, 3, 4])(
    "a 24-slot window starting at %d:00 UTC never keeps an edge mark within minIndexGap of the real date-break",
    (startHour) => {
      const hours = hoursFrom(`2026-11-25T${String(startHour).padStart(2, "0")}:00:00Z`, 24);
      const marks = winterRouteTimeSliderMarks(hours);
      const gap = minIndexGapFor(24);
      for (let i = 1; i < marks.length; i++) {
        expect(marks[i].index - marks[i - 1].index).toBeGreaterThanOrEqual(gap);
      }
      // The date-break itself (wherever it falls in this 24-slot window)
      // is never missing -- only an edge that would have collided with
      // it is dropped, per P1(ii)'s own "dagskil hafa forgang".
      const breakIndex = hours.findIndex((h, i) => i > 0 && h.slice(0, 10) !== hours[i - 1].slice(0, 10));
      if (breakIndex > 0) expect(marks.some((m) => m.index === breakIndex)).toBe(true);
    }
  );

  // P1(iv) -- the full cheap pure matrix: n = 2..24 x all 24 real UTC
  // start hours (552 combinations). Never asserts PIXELS (jsdom has no
  // layout engine) -- it asserts the INDEX-DISTANCE contract the real
  // pixel gap is built on, which the browser evidence (P2) then confirms
  // against real measured widths.
  describe("full n=2..24 x 24-start-hour matrix (552 combinations)", () => {
    const allStartHours = Array.from({ length: 24 }, (_, h) => h);
    const allN = Array.from({ length: 23 }, (_, i) => i + 2); // 2..24

    it("(a) no two marks are ever closer than minIndexGap(n), at every n and every real start hour", () => {
      for (const startHour of allStartHours) {
        const full = hoursFrom(`2026-11-25T${String(startHour).padStart(2, "0")}:00:00Z`, 24);
        for (const n of allN) {
          const hours = full.slice(0, n);
          const marks = winterRouteTimeSliderMarks(hours);
          const gap = minIndexGapFor(n);
          for (let i = 1; i < marks.length; i++) {
            expect(marks[i].index - marks[i - 1].index).toBeGreaterThanOrEqual(gap);
          }
        }
      }
    });

    it("(b) every mark's index is within [0, n-1], unique, and sorted ascending", () => {
      for (const startHour of allStartHours) {
        const full = hoursFrom(`2026-11-25T${String(startHour).padStart(2, "0")}:00:00Z`, 24);
        for (const n of allN) {
          const hours = full.slice(0, n);
          const marks = winterRouteTimeSliderMarks(hours);
          const indices = marks.map((m) => m.index);
          expect(new Set(indices).size).toBe(indices.length);
          expect([...indices].sort((a, b) => a - b)).toEqual(indices);
          for (const idx of indices) {
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThanOrEqual(n - 1);
          }
        }
      }
    });

    it("(c) every mark's label is derived from availableHours at its OWN index, never a mismatched one", () => {
      for (const startHour of [0, 11, 23]) {
        const full = hoursFrom(`2026-11-25T${String(startHour).padStart(2, "0")}:00:00Z`, 24);
        for (const n of [2, 5, 12, 24]) {
          const hours = full.slice(0, n);
          const marks = winterRouteTimeSliderMarks(hours);
          for (const m of marks) {
            const h = hours[m.index];
            const expectedDate = `${h.slice(8, 10)}.${h.slice(5, 7)}`;
            const expectedTime = h.slice(11, 16);
            expect([expectedDate, expectedTime]).toContain(m.label);
          }
        }
      }
    });

    it("(d) a real date-break is never missing from the marks, for every n/start-hour combination it appears in", () => {
      for (const startHour of allStartHours) {
        const full = hoursFrom(`2026-11-25T${String(startHour).padStart(2, "0")}:00:00Z`, 24);
        for (const n of allN) {
          const hours = full.slice(0, n);
          const breakIndex = hours.findIndex((h, i) => i > 0 && h.slice(0, 10) !== hours[i - 1].slice(0, 10));
          if (breakIndex <= 0) continue; // no date-break within this slice
          const marks = winterRouteTimeSliderMarks(hours);
          expect(marks.some((m) => m.index === breakIndex)).toBe(true);
        }
      }
    });

    it("(e) n=0/1/2 return exactly the expected number of marks", () => {
      expect(winterRouteTimeSliderMarks([]).length).toBe(0);
      expect(winterRouteTimeSliderMarks(["2026-11-25T23:00"]).length).toBe(1);
      expect(winterRouteTimeSliderMarks(["2026-11-25T23:00", "2026-11-26T00:00"]).length).toBe(2);
    });
  });
});
