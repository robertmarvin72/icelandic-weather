import { describe, it, expect } from "vitest";
import { classifyAuroraCache, selectNightForEvening } from "./freshness.js";
import { AURORA_FRESH_MAX_AGE_MINUTES, AURORA_STALE_MAX_AGE_MINUTES } from "./constants.js";

const FETCHED_AT = new Date("2026-08-24T10:00:00.000Z");

function nowAfterMinutes(minutes) {
  return new Date(FETCHED_AT.getTime() + minutes * 60000);
}

describe("classifyAuroraCache", () => {
  it("is 'missing' unavailable when the row is null", () => {
    expect(classifyAuroraCache(null, nowAfterMinutes(0))).toEqual({
      state: "unavailable",
      reason: "missing",
      sourceFetchedAt: null,
      ageMinutes: null,
    });
  });

  it("is 'missing' unavailable when snapshot.nights is not an array", () => {
    const row = { snapshot: {}, source_fetched_at: FETCHED_AT.toISOString() };
    expect(classifyAuroraCache(row, nowAfterMinutes(0)).reason).toBe("missing");
  });

  it("is 'malformed' unavailable when source_fetched_at cannot be parsed", () => {
    const row = { snapshot: { nights: [] }, source_fetched_at: "not-a-date" };
    expect(classifyAuroraCache(row, nowAfterMinutes(0)).reason).toBe("malformed");
  });

  it("is fresh at and below the fresh threshold (inclusive boundary)", () => {
    const row = { snapshot: { nights: [] }, source_fetched_at: FETCHED_AT.toISOString() };
    const result = classifyAuroraCache(row, nowAfterMinutes(AURORA_FRESH_MAX_AGE_MINUTES));
    expect(result.state).toBe("fresh");
    expect(result.ageMinutes).toBe(AURORA_FRESH_MAX_AGE_MINUTES);
  });

  it("is stale just above the fresh threshold", () => {
    const row = { snapshot: { nights: [] }, source_fetched_at: FETCHED_AT.toISOString() };
    const result = classifyAuroraCache(row, nowAfterMinutes(AURORA_FRESH_MAX_AGE_MINUTES + 1));
    expect(result.state).toBe("stale");
  });

  it("is stale at and below the stale threshold (inclusive boundary)", () => {
    const row = { snapshot: { nights: [] }, source_fetched_at: FETCHED_AT.toISOString() };
    const result = classifyAuroraCache(row, nowAfterMinutes(AURORA_STALE_MAX_AGE_MINUTES));
    expect(result.state).toBe("stale");
  });

  it("is unavailable ('too_old') just above the stale threshold", () => {
    const row = { snapshot: { nights: [] }, source_fetched_at: FETCHED_AT.toISOString() };
    const result = classifyAuroraCache(row, nowAfterMinutes(AURORA_STALE_MAX_AGE_MINUTES + 1));
    expect(result).toMatchObject({ state: "unavailable", reason: "too_old" });
  });
});

describe("selectNightForEvening", () => {
  it("finds the night matching the requested evening", () => {
    const nights = [{ eveningDate: "2026-08-24" }, { eveningDate: "2026-08-25" }];
    expect(selectNightForEvening(nights, "2026-08-25")).toEqual({ eveningDate: "2026-08-25" });
  });

  it("returns null (never fabricates) when no night matches", () => {
    const nights = [{ eveningDate: "2026-08-24" }];
    expect(selectNightForEvening(nights, "2026-09-01")).toBeNull();
  });
});
