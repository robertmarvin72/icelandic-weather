import { describe, it, expect } from "vitest";
import {
  auroraBandLabelKey,
  auroraBandShortLabelKey,
  auroraBandColor,
  AURORA_BAND_LABEL_KEYS,
  AURORA_BAND_SHORT_LABEL_KEYS,
  AURORA_BAND_COLORS,
} from "./auroraBandPresentation";

const BANDS = ["excellent", "good", "fair", "poor", "very-poor"];

describe("auroraBandPresentation — single source of truth", () => {
  it("defines a label key and a color for every canonical band", () => {
    for (const band of BANDS) {
      expect(AURORA_BAND_LABEL_KEYS[band]).toBeTypeOf("string");
      expect(AURORA_BAND_COLORS[band]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("every band has a distinct color (never two bands sharing a marker color)", () => {
    const colors = BANDS.map((b) => AURORA_BAND_COLORS[b]);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("auroraBandLabelKey/auroraBandColor return the exact table entries", () => {
    for (const band of BANDS) {
      expect(auroraBandLabelKey(band)).toBe(AURORA_BAND_LABEL_KEYS[band]);
      expect(auroraBandColor(band)).toBe(AURORA_BAND_COLORS[band]);
    }
  });

  it("falls back to the fair band for an unknown/missing value, without throwing", () => {
    expect(() => auroraBandLabelKey(undefined)).not.toThrow();
    expect(auroraBandLabelKey("not-a-band")).toBe(AURORA_BAND_LABEL_KEYS.fair);
    expect(auroraBandColor("not-a-band")).toBe(AURORA_BAND_COLORS.fair);
  });

  // Ticket 414 (#414): excellent must be a clearly distinct hue from good —
  // not merely "a different hex," but visibly a different color family
  // (purple vs. green) so it can never be mistaken for good on sight.
  it("excellent is purple, visibly distinct from good's green", () => {
    expect(AURORA_BAND_COLORS.excellent).toBe("#a855f7");
    expect(AURORA_BAND_COLORS.good).toBe("#22c55e");
    expect(AURORA_BAND_COLORS.excellent).not.toBe(AURORA_BAND_COLORS.good);
  });

  it("good and fair keep their pre-existing colors unchanged", () => {
    expect(AURORA_BAND_COLORS.good).toBe("#22c55e");
    expect(AURORA_BAND_COLORS.fair).toBe("#facc15");
  });
});

describe("auroraBandShortLabelKey — legend-only short labels (Ticket 414, #414)", () => {
  it("excellent/good/fair each have a dedicated short label key, distinct from the descriptive long key", () => {
    for (const band of ["excellent", "good", "fair"]) {
      expect(AURORA_BAND_SHORT_LABEL_KEYS[band]).toBeTypeOf("string");
      expect(auroraBandShortLabelKey(band)).toBe(AURORA_BAND_SHORT_LABEL_KEYS[band]);
      expect(auroraBandShortLabelKey(band)).not.toBe(auroraBandLabelKey(band));
    }
  });

  it("falls back to the descriptive long label for bands the legend doesn't show (poor/very-poor/unknown) — no invented copy", () => {
    for (const band of ["poor", "very-poor", "not-a-band", undefined]) {
      expect(auroraBandShortLabelKey(band)).toBe(auroraBandLabelKey(band));
    }
  });
});
