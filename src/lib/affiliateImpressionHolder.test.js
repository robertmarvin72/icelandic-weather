import { describe, it, expect } from "vitest";
import { createAffiliateImpressionHolder } from "./affiliateImpressionHolder";

describe("createAffiliateImpressionHolder", () => {
  it("consumes exactly once for a given visit+placement pair", () => {
    const holder = createAffiliateImpressionHolder();
    holder.startVisit("v1");
    expect(holder.tryConsume("v1", "homepage_northern_lights")).toBe(true);
    expect(holder.tryConsume("v1", "homepage_northern_lights")).toBe(false);
  });

  it("tracks placements independently within the same visit", () => {
    const holder = createAffiliateImpressionHolder();
    holder.startVisit("v1");
    expect(holder.tryConsume("v1", "homepage_northern_lights")).toBe(true);
    expect(holder.tryConsume("v1", "northern_lights_forecast")).toBe(true);
    expect(holder.tryConsume("v1", "homepage_northern_lights")).toBe(false);
    expect(holder.tryConsume("v1", "northern_lights_forecast")).toBe(false);
  });

  it("rejects a stale visitId captured before startVisit moved on", () => {
    const holder = createAffiliateImpressionHolder();
    holder.startVisit("v1");
    holder.startVisit("v2");
    // v1 was never consumed, but it is no longer the current visit.
    expect(holder.tryConsume("v1", "homepage_northern_lights")).toBe(false);
    expect(holder.tryConsume("v2", "homepage_northern_lights")).toBe(true);
  });

  it("a new visit opens a fresh opportunity for the same placement", () => {
    const holder = createAffiliateImpressionHolder();
    holder.startVisit("v1");
    expect(holder.tryConsume("v1", "homepage_northern_lights")).toBe(true);
    holder.startVisit("v2");
    expect(holder.tryConsume("v2", "homepage_northern_lights")).toBe(true);
  });

  it("startVisit with the same id is a no-op (does not reopen a consumed opportunity)", () => {
    const holder = createAffiliateImpressionHolder();
    holder.startVisit("v1");
    expect(holder.tryConsume("v1", "homepage_northern_lights")).toBe(true);
    holder.startVisit("v1");
    expect(holder.tryConsume("v1", "homepage_northern_lights")).toBe(false);
  });

  it("rejects null/undefined visitId and before any startVisit call", () => {
    const holder = createAffiliateImpressionHolder();
    expect(holder.tryConsume(null, "homepage_northern_lights")).toBe(false);
    expect(holder.tryConsume(undefined, "homepage_northern_lights")).toBe(false);
    expect(holder.currentVisit()).toBe(null);
  });

  it("two overlapping callers for the same visit+placement: only the first wins (synchronous guard)", () => {
    const holder = createAffiliateImpressionHolder();
    holder.startVisit("v1");
    const results = [holder.tryConsume("v1", "homepage_northern_lights"), holder.tryConsume("v1", "homepage_northern_lights")];
    expect(results).toEqual([true, false]);
  });

  it("currentVisit() reports the visit most recently started", () => {
    const holder = createAffiliateImpressionHolder();
    expect(holder.currentVisit()).toBe(null);
    holder.startVisit("v1");
    expect(holder.currentVisit()).toBe("v1");
    holder.startVisit("v2");
    expect(holder.currentVisit()).toBe("v2");
  });
});
