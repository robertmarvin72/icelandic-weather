// Ticket 417 (#417) — weatherVoiceShareCatalogue.js
import { describe, it, expect } from "vitest";
import { buildWeatherVoiceShareCatalogue, WEATHER_VOICE_SHARE_LANGUAGES } from "./weatherVoiceShareCatalogue";
import { getWeatherVoiceLibrary, WEATHER_VOICE_KNOWN_IDS } from "./weatherVoiceContent";
import { getTjaldurMoodAssetPath } from "./weatherVoicePresentation";

describe("buildWeatherVoiceShareCatalogue — Ticket 417 (#417): full, canonical coverage", () => {
  it("covers exactly every (language, id) pair from the real getWeatherVoiceLibrary — never a manually duplicated list", () => {
    const catalogue = buildWeatherVoiceShareCatalogue();
    const expectedCount = WEATHER_VOICE_SHARE_LANGUAGES.reduce(
      (sum, lang) => sum + (getWeatherVoiceLibrary(lang)?.length ?? 0),
      0
    );
    expect(catalogue).toHaveLength(expectedCount);
    // Today: 27 ids * 2 languages = 54 — asserted as a concrete sanity
    // check, not the sole source of truth (the length check above is).
    expect(catalogue).toHaveLength(WEATHER_VOICE_KNOWN_IDS.size * 2);
  });

  it("every entry's text/mood/condition matches the real library exactly, never re-typed", () => {
    const catalogue = buildWeatherVoiceShareCatalogue();
    for (const lang of WEATHER_VOICE_SHARE_LANGUAGES) {
      const library = getWeatherVoiceLibrary(lang);
      for (const item of library) {
        const entry = catalogue.find((e) => e.language === lang && e.voiceId === item.id);
        expect(entry).toBeDefined();
        expect(entry.text).toBe(item.text);
        expect(entry.mood).toBe(item.mood);
        expect(entry.condition).toBe(item.condition);
      }
    }
  });

  it("every entry has a real, resolvable mascot asset path", () => {
    const catalogue = buildWeatherVoiceShareCatalogue();
    for (const entry of catalogue) {
      expect(entry.moodAssetPath).toBe(getTjaldurMoodAssetPath(entry.mood));
      expect(entry.moodAssetPath).not.toBeNull();
    }
  });

  it("every entry has absolute https pageUrl/imageUrl and public/-relative output paths", () => {
    const catalogue = buildWeatherVoiceShareCatalogue();
    for (const entry of catalogue) {
      expect(entry.pageUrl).toMatch(/^https:\/\/eltumvedrid\.is\/share\/tjaldur\/v1\//);
      expect(entry.imageUrl).toMatch(/^https:\/\/eltumvedrid\.is\/share\/tjaldur\/v1\//);
      expect(entry.htmlOutputPath).toMatch(/^public\/share\/tjaldur\/v1\//);
      expect(entry.imageOutputPath).toMatch(/^public\/share\/tjaldur\/v1\//);
    }
  });

  it("no duplicate (language, voiceId) pairs", () => {
    const catalogue = buildWeatherVoiceShareCatalogue();
    const keys = catalogue.map((e) => `${e.language}|${e.voiceId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("WEATHER_VOICE_SHARE_LANGUAGES is exactly is/en", () => {
    expect(WEATHER_VOICE_SHARE_LANGUAGES).toEqual(["is", "en"]);
  });
});
