// Ticket #486, Round 2 correction (N1) — targeted tests for the pure
// hour-of-day extraction helper, and its combination with the existing
// isDaytimeHour() day/night convention at the two hours Jonesy asked for
// (02 UTC, 14 UTC).
import { describe, it, expect } from "vitest";
import { hourOfDayFromHourString, formatDecimal, formatHourLabel, formatTimestamp, formatValidatedUtcTimestamp, cacheAgeMinutesDisplay } from "./winterRoutePresentation";
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
