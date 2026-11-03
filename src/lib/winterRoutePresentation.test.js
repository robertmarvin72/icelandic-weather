// Ticket #486, Round 2 correction (N1) — targeted tests for the pure
// hour-of-day extraction helper, and its combination with the existing
// isDaytimeHour() day/night convention at the two hours Jonesy asked for
// (02 UTC, 14 UTC).
import { describe, it, expect } from "vitest";
import { hourOfDayFromHourString, formatDecimal, formatHourLabel, formatTimestamp } from "./winterRoutePresentation";
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
});
