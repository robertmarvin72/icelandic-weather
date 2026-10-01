// Ticket #431 — feature registry tests for the "northern_lights_free_v1"
// business-model experiment: northernLights must be available to
// anonymous/Free/Pro alike, via a narrow, named freeDuringExperiment flag on
// that single feature only, while every other feature's gating (limit-type
// and tier-type alike) stays exactly as it was.
import { describe, it, expect } from "vitest";
import { FEATURES, NL_FREE_EXPERIMENT_ID, TIERS, getUserTier, isFeatureAvailable, getFeatureLimit } from "./features";

describe("features.js — northernLights is open to every tier during the experiment", () => {
  it("anonymous (no entitlements at all) gets access", () => {
    const gate = isFeatureAvailable("northernLights", undefined);
    expect(gate.available).toBe(true);
    expect(gate.reason).toBe("experiment_free");
    expect(gate.experimentId).toBe(NL_FREE_EXPERIMENT_ID);
  });

  it("Free (resolved, non-Pro entitlements) gets access", () => {
    const gate = isFeatureAvailable("northernLights", { isPro: false });
    expect(gate.available).toBe(true);
    expect(gate.reason).toBe("experiment_free");
    expect(gate.experimentId).toBe(NL_FREE_EXPERIMENT_ID);
  });

  it("Pro gets access via the normal (non-experiment) path", () => {
    const gate = isFeatureAvailable("northernLights", { isPro: true });
    expect(gate.available).toBe(true);
    expect(gate.reason).toBe("ok");
  });

  it("the feature definition still records tier:\"pro\" as the real entitlement model, for rollback", () => {
    expect(FEATURES.northernLights.tier).toBe("pro");
    expect(FEATURES.northernLights.freeDuringExperiment).toBe(true);
    expect(FEATURES.northernLights.experimentId).toBe(NL_FREE_EXPERIMENT_ID);
  });

  it("getUserTier itself is never affected by the experiment — it still reports the genuine account tier", () => {
    expect(getUserTier(undefined)).toBe(TIERS.FREE);
    expect(getUserTier({ isPro: false })).toBe(TIERS.FREE);
    expect(getUserTier({ isPro: true })).toBe(TIERS.PRO);
  });
});

describe("features.js — unrelated tier-gated features are exactly unchanged", () => {
  it.each(["windDirection", "shelterIndex", "campsiteComparison", "bestRoutePlanner"])(
    "%s: still requires Pro, with no freeDuringExperiment escape",
    (key) => {
      expect(FEATURES[key].freeDuringExperiment).toBeUndefined();
      expect(isFeatureAvailable(key, { isPro: false })).toEqual({
        available: false,
        preview: !!FEATURES[key].preview,
        reason: "requires_pro",
      });
      expect(isFeatureAvailable(key, { isPro: true })).toEqual({ available: true, preview: false, reason: "ok" });
    },
  );
});

describe("features.js — unrelated limit-type features are exactly unchanged", () => {
  it("topSitesCount: Free sees 3, Pro sees 5, both always available", () => {
    expect(isFeatureAvailable("topSitesCount", { isPro: false })).toEqual({ available: true, preview: false, reason: "limit_feature" });
    expect(getFeatureLimit("topSitesCount", { isPro: false })).toBe(3);
    expect(getFeatureLimit("topSitesCount", { isPro: true })).toBe(5);
  });

  it("forecastDays and weatherFinderResultsCount limits are unchanged", () => {
    expect(getFeatureLimit("forecastDays", { isPro: false })).toBe(7);
    expect(getFeatureLimit("forecastDays", { isPro: true })).toBe(7);
    expect(getFeatureLimit("weatherFinderResultsCount", { isPro: false })).toBe(3);
    expect(getFeatureLimit("weatherFinderResultsCount", { isPro: true })).toBe(999);
  });
});

describe("features.js — unknown feature key", () => {
  it("returns unavailable with reason unknown_feature, regardless of entitlements", () => {
    expect(isFeatureAvailable("notARealFeature", { isPro: true })).toEqual({ available: false, preview: false, reason: "unknown_feature" });
  });
});
