// @vitest-environment node
import { describe, it, expect } from "vitest";
import { exportFreshness, segmentRegistrationFreshness, pointNoticeStatus } from "./freshness.js";

const NOW = new Date("2026-11-03T18:00:00Z");

describe("exportFreshness", () => {
  it("is fresh within 30 minutes", () => {
    expect(exportFreshness("2026-11-03T17:45:00Z", NOW).isStale).toBe(false);
  });

  it("is stale past 30 minutes", () => {
    expect(exportFreshness("2026-11-03T17:25:00Z", NOW).isStale).toBe(true);
  });

  it("missing/invalid timestamp is treated as stale, never assumed fresh", () => {
    expect(exportFreshness(null, NOW).isStale).toBe(true);
    expect(exportFreshness("not-a-date", NOW).isStale).toBe(true);
  });
});

describe("segmentRegistrationFreshness", () => {
  it("is not old within 24 hours", () => {
    expect(segmentRegistrationFreshness("2026-11-03T06:00:00Z", NOW).isOld).toBe(false);
  });

  it("is old past 24 hours", () => {
    expect(segmentRegistrationFreshness("2026-11-02T06:00:00Z", NOW).isOld).toBe(true);
  });

  it("missing/invalid timestamp is treated as old, never assumed recent", () => {
    expect(segmentRegistrationFreshness(null, NOW).isOld).toBe(true);
  });
});

describe("pointNoticeStatus — driven only by GildirTil, never by DagsSkrad age", () => {
  it("is active when GildirTil is in the future", () => {
    expect(pointNoticeStatus("2029-03-09T23:45:00Z", NOW)).toBe("active");
  });

  it("is expired when GildirTil is in the past", () => {
    expect(pointNoticeStatus("2026-01-01T00:00:00Z", NOW)).toBe("expired");
  });

  it("is unknown when GildirTil is missing/invalid — segments without GildirTil at all must never render 'unknown gildistími' from this alone", () => {
    expect(pointNoticeStatus(null, NOW)).toBe("unknown");
    expect(pointNoticeStatus("not-a-date", NOW)).toBe("unknown");
  });

  it("an old DagsSkrad on a notice with a still-valid GildirTil is NOT expired (S5c)", () => {
    // Real retained-sample shape: DagsSkrad from March, GildirTil in 2029.
    expect(pointNoticeStatus("2029-03-09T23:45:00Z", NOW)).toBe("active");
  });
});
