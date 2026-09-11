// Ticket 408 (#408) — pure mood-asset and CTA-resolution helpers.
import { describe, it, expect, vi } from "vitest";
import { getTjaldurMoodAssetPath, resolveWeatherVoiceCta } from "./weatherVoicePresentation";

const ALL_TWELVE_MOODS = [
  "happy",
  "excellent",
  "neutral",
  "suspicious",
  "nervous",
  "struggling",
  "sad",
  "freezing",
  "unimpressed",
  "wrecked",
  "amazed",
  "sleeping",
];

describe("getTjaldurMoodAssetPath", () => {
  it("maps every one of the twelve canonical moods to its actual /tjaldur/<mood>.png path", () => {
    for (const mood of ALL_TWELVE_MOODS) {
      expect(getTjaldurMoodAssetPath(mood)).toBe(`/tjaldur/${mood}.png`);
    }
  });

  it("the wrecked path is exactly correct (explicitly required)", () => {
    expect(getTjaldurMoodAssetPath("wrecked")).toBe("/tjaldur/wrecked.png");
  });

  it("an unknown/unsupported/missing mood returns null, never a guessed path", () => {
    expect(getTjaldurMoodAssetPath("bogus")).toBeNull();
    expect(getTjaldurMoodAssetPath(undefined)).toBeNull();
    expect(getTjaldurMoodAssetPath(null)).toBeNull();
    expect(getTjaldurMoodAssetPath("")).toBeNull();
  });
});

describe("resolveWeatherVoiceCta", () => {
  const t = (k) => `translated:${k}`;

  it("renders a CTA only when both a known ctaType and a usable action exist", () => {
    const onExplore = vi.fn();
    const result = resolveWeatherVoiceCta({ ctaType: "better_location", t, onExplore });
    expect(result).toEqual({ label: "translated:weatherVoiceCtaBetterLocation", onClick: onExplore });
  });

  it("maps all five approved CTA types to distinct label keys", () => {
    const onExplore = vi.fn();
    const seen = new Set();
    for (const ctaType of ["better_location", "calmer_location", "drier_location", "warmer_location", "best_locations"]) {
      const result = resolveWeatherVoiceCta({ ctaType, t, onExplore });
      expect(result).not.toBeNull();
      expect(result.onClick).toBe(onExplore);
      seen.add(result.label);
    }
    expect(seen.size).toBe(5); // every type gets distinct wording
  });

  it("null/undefined ctaType yields no button", () => {
    const onExplore = vi.fn();
    expect(resolveWeatherVoiceCta({ ctaType: null, t, onExplore })).toBeNull();
    expect(resolveWeatherVoiceCta({ ctaType: undefined, t, onExplore })).toBeNull();
  });

  it("an unknown ctaType yields no button, never a guessed destination", () => {
    const onExplore = vi.fn();
    expect(resolveWeatherVoiceCta({ ctaType: "teleport_home", t, onExplore })).toBeNull();
  });

  it("a known ctaType with no usable action (undefined/non-function) yields no button", () => {
    expect(resolveWeatherVoiceCta({ ctaType: "better_location", t, onExplore: undefined })).toBeNull();
    expect(resolveWeatherVoiceCta({ ctaType: "better_location", t, onExplore: "not-a-function" })).toBeNull();
  });

  it("never calls the action itself — only returns it for the caller to attach", () => {
    const onExplore = vi.fn();
    resolveWeatherVoiceCta({ ctaType: "better_location", t, onExplore });
    expect(onExplore).not.toHaveBeenCalled();
  });
});
