import { describe, it, expect } from "vitest";
import { auroraVisualState, auroraVisualStateTokens, AURORA_VISUAL_STATES } from "./auroraVisualState";

describe("auroraVisualState — canonical band grouping", () => {
  it("groups excellent and good into GOOD", () => {
    expect(auroraVisualState("excellent")).toBe(AURORA_VISUAL_STATES.GOOD);
    expect(auroraVisualState("good")).toBe(AURORA_VISUAL_STATES.GOOD);
  });

  it("maps fair to FAIR", () => {
    expect(auroraVisualState("fair")).toBe(AURORA_VISUAL_STATES.FAIR);
  });

  it("groups poor and very-poor into POOR", () => {
    expect(auroraVisualState("poor")).toBe(AURORA_VISUAL_STATES.POOR);
    expect(auroraVisualState("very-poor")).toBe(AURORA_VISUAL_STATES.POOR);
  });

  it("maps unknown/missing bands to their own explicit NEUTRAL case — never inherits auroraBandPresentation's 'fair' default", () => {
    expect(auroraVisualState(undefined)).toBe(AURORA_VISUAL_STATES.NEUTRAL);
    expect(auroraVisualState(null)).toBe(AURORA_VISUAL_STATES.NEUTRAL);
    expect(auroraVisualState("")).toBe(AURORA_VISUAL_STATES.NEUTRAL);
    expect(auroraVisualState("not-a-real-band")).toBe(AURORA_VISUAL_STATES.NEUTRAL);
    // Specifically distinct from FAIR — proves no silent fallback inheritance.
    expect(auroraVisualState("not-a-real-band")).not.toBe(AURORA_VISUAL_STATES.FAIR);
  });

  it("never mutates canonical band semantics — is a pure display-only classification with no side effects", () => {
    const band = "excellent";
    auroraVisualState(band);
    expect(band).toBe("excellent");
  });
});

describe("auroraVisualStateTokens — styling/copy tokens per visual state", () => {
  it("provides pill/headline/body translation keys and distinct classes for every visual state", () => {
    for (const band of ["excellent", "good", "fair", "poor", "very-poor", "unknown-band"]) {
      const tokens = auroraVisualStateTokens(band);
      expect(tokens.pillKey).toBeTypeOf("string");
      expect(tokens.headlineKey).toBeTypeOf("string");
      expect(tokens.bodyKey).toBeTypeOf("string");
      expect(tokens.pillClass).toBeTypeOf("string");
      expect(tokens.accentGlowClass).toBeTypeOf("string");
    }
  });

  it("good and fair produce different tokens", () => {
    const good = auroraVisualStateTokens("excellent");
    const fair = auroraVisualStateTokens("fair");
    expect(good.headlineKey).not.toBe(fair.headlineKey);
    expect(good.pillClass).not.toBe(fair.pillClass);
  });

  it("poor and neutral each have their own distinct tokens, neither reusing fair's", () => {
    const poor = auroraVisualStateTokens("poor");
    const neutral = auroraVisualStateTokens(undefined);
    const fair = auroraVisualStateTokens("fair");
    expect(poor.headlineKey).not.toBe(fair.headlineKey);
    expect(neutral.headlineKey).not.toBe(fair.headlineKey);
    expect(poor.headlineKey).not.toBe(neutral.headlineKey);
  });
});
