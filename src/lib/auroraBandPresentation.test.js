import { describe, it, expect } from "vitest";
import { auroraBandLabelKey, auroraBandColor, AURORA_BAND_LABEL_KEYS, AURORA_BAND_COLORS } from "./auroraBandPresentation";

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
});
