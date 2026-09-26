import { describe, it, expect } from "vitest";
import { parseNightQueryDate, buildNightDetailPath, withNightQueryDate } from "./auroraNightQuery";

const params = (qs) => new URLSearchParams(qs);

describe("parseNightQueryDate — exactly one valid ISO calendar date, or null", () => {
  it("accepts a single exact valid date", () => {
    expect(parseNightQueryDate(params("date=2026-09-26"))).toBe("2026-09-26");
    expect(parseNightQueryDate(params("utm_source=x&date=2027-01-01"))).toBe("2027-01-01");
    expect(parseNightQueryDate(params("date=2028-02-29"))).toBe("2028-02-29"); // real leap day
  });

  it("missing date -> null", () => {
    expect(parseNightQueryDate(params(""))).toBeNull();
    expect(parseNightQueryDate(params("other=1"))).toBeNull();
  });

  it("rejects duplicate date parameters, even when both are valid or equal", () => {
    expect(parseNightQueryDate(params("date=2026-09-26&date=2026-09-27"))).toBeNull();
    expect(parseNightQueryDate(params("date=2026-09-26&date=2026-09-26"))).toBeNull();
  });

  it("rejects malformed values", () => {
    for (const bad of ["", "tomorrow", "2026-9-26", "26-09-2026", "2026-09-26T00:00:00Z", " 2026-09-26", "2026-09-26 ", "20260926", "2026-09-26abc"]) {
      expect(parseNightQueryDate(params(`date=${encodeURIComponent(bad)}`)), JSON.stringify(bad)).toBeNull();
    }
  });

  it("rejects impossible calendar dates instead of letting them roll over", () => {
    for (const bad of ["2026-02-30", "2026-13-01", "2026-00-10", "2026-09-31", "2026-09-00", "2027-02-29"]) {
      expect(parseNightQueryDate(params(`date=${bad}`)), bad).toBeNull();
    }
  });
});

describe("navigation helpers", () => {
  it("buildNightDetailPath targets the existing English landing route", () => {
    expect(buildNightDetailPath("2026-09-27")).toBe("/en/northern-lights?date=2026-09-27");
  });

  it("withNightQueryDate replaces every date value and preserves unrelated params", () => {
    const next = withNightQueryDate(params("utm_source=news&date=bad&date=worse&ref=a"), "2026-09-26");
    expect(next.getAll("date")).toEqual(["2026-09-26"]);
    expect(next.get("utm_source")).toBe("news");
    expect(next.get("ref")).toBe("a");
  });

  it("does not mutate the input params", () => {
    const original = params("date=2026-09-25");
    withNightQueryDate(original, "2026-09-26");
    expect(original.get("date")).toBe("2026-09-25");
  });
});
