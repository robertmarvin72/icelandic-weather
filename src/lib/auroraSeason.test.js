import { describe, it, expect } from "vitest";
import { isAuroraSeason, todayEveningUtc } from "./auroraSeason";

describe("isAuroraSeason — exact boundary dates", () => {
  it("is false on August 31 (last day out of season)", () => {
    expect(isAuroraSeason(new Date("2026-08-31T23:59:59Z"))).toBe(false);
  });

  it("is true on September 1 (first day of season)", () => {
    expect(isAuroraSeason(new Date("2026-09-01T00:00:00Z"))).toBe(true);
  });

  it("is true on March 31 (last day of season)", () => {
    expect(isAuroraSeason(new Date("2027-03-31T23:59:59Z"))).toBe(true);
  });

  it("is false on April 1 (first day out of season)", () => {
    expect(isAuroraSeason(new Date("2027-04-01T00:00:00Z"))).toBe(false);
  });

  it("is true across the whole winter, including the year turnover", () => {
    expect(isAuroraSeason(new Date("2026-12-31T12:00:00Z"))).toBe(true);
    expect(isAuroraSeason(new Date("2027-01-01T00:00:00Z"))).toBe(true);
  });

  it("is false throughout the summer months", () => {
    for (const m of ["2027-05-15", "2027-06-15", "2027-07-15"]) {
      expect(isAuroraSeason(new Date(`${m}T12:00:00Z`))).toBe(false);
    }
  });

  it("uses UTC month directly, matching Iceland's year-round UTC+0 standard time", () => {
    // 23:30 UTC on Aug 31 must NOT be treated as Sept 1 by any local-time shift.
    expect(isAuroraSeason(new Date("2026-08-31T23:30:00Z"))).toBe(false);
  });
});

describe("todayEveningUtc", () => {
  it("formats as YYYY-MM-DD from the UTC calendar date", () => {
    expect(todayEveningUtc(new Date("2026-09-01T23:30:00Z"))).toBe("2026-09-01");
  });
});
