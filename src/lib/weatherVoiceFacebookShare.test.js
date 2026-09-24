// Ticket 417 (#417) — weatherVoiceFacebookShare.js: the runtime resolver
// that decides whether Facebook sharing is offered, verified against the
// REAL generated manifest (not a mocked one) — this is exactly the
// integration point that must never select a different quote or infer
// mood from severity.
import { describe, it, expect } from "vitest";
import { resolveWeatherVoiceFacebookShare } from "./weatherVoiceFacebookShare";
import { WEATHER_VOICE_SHARE_MANIFEST } from "./weatherVoiceShareManifest.generated";
import { buildWeatherVoiceShareCatalogue } from "./weatherVoiceShareCatalogue";

describe("resolveWeatherVoiceFacebookShare — Ticket 417 (#417): exact match required", () => {
  it("every current catalogue entry resolves as available, with the correct manifest-derived URLs", () => {
    const catalogue = buildWeatherVoiceShareCatalogue();
    for (const entry of catalogue) {
      const result = resolveWeatherVoiceFacebookShare({
        voiceId: entry.voiceId,
        language: entry.language,
        text: entry.text,
        mood: entry.mood,
      });
      expect(result.available).toBe(true);
      expect(result.pageUrl).toBe(entry.pageUrl);
      expect(result.facebookUrl).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(entry.pageUrl)}`);
    }
  });

  it("a mismatched text (drifted/edited content) is unavailable, never substituting the manifest's own text", () => {
    const anyKey = Object.keys(WEATHER_VOICE_SHARE_MANIFEST)[0];
    const entry = WEATHER_VOICE_SHARE_MANIFEST[anyKey];
    const result = resolveWeatherVoiceFacebookShare({
      voiceId: entry.voiceId,
      language: entry.language,
      text: "completely different text",
      mood: entry.mood,
    });
    expect(result).toEqual({ available: false, reason: "mismatch" });
  });

  it("a mismatched mood is unavailable, never inferred/overridden", () => {
    const anyKey = Object.keys(WEATHER_VOICE_SHARE_MANIFEST)[0];
    const entry = WEATHER_VOICE_SHARE_MANIFEST[anyKey];
    const result = resolveWeatherVoiceFacebookShare({
      voiceId: entry.voiceId,
      language: entry.language,
      text: entry.text,
      mood: "some_other_mood",
    });
    expect(result).toEqual({ available: false, reason: "mismatch" });
  });

  it("an unknown voiceId is unavailable", () => {
    const result = resolveWeatherVoiceFacebookShare({
      voiceId: "not_a_real_id",
      language: "is",
      text: "anything",
      mood: "happy",
    });
    expect(result).toEqual({ available: false, reason: "unknown_entry" });
  });

  it("a real id under an unsupported/wrong language is unavailable", () => {
    const result = resolveWeatherVoiceFacebookShare({
      voiceId: "rain_02",
      language: "fr",
      text: "anything",
      mood: "unimpressed",
    });
    expect(result).toEqual({ available: false, reason: "unknown_entry" });
  });

  it("a missing snapshot (null/undefined/no voiceId) is unavailable, never throws", () => {
    expect(resolveWeatherVoiceFacebookShare(null)).toEqual({ available: false, reason: "missing_snapshot" });
    expect(resolveWeatherVoiceFacebookShare(undefined)).toEqual({ available: false, reason: "missing_snapshot" });
    expect(resolveWeatherVoiceFacebookShare({ language: "is" })).toEqual({ available: false, reason: "missing_snapshot" });
    expect(resolveWeatherVoiceFacebookShare({ voiceId: "rain_02" })).toEqual({ available: false, reason: "missing_snapshot" });
  });

  it("covers every currently valid mood across both languages via the real catalogue (no mood is silently unmatched)", () => {
    const catalogue = buildWeatherVoiceShareCatalogue();
    const moods = new Set(catalogue.map((e) => e.mood));
    expect(moods.size).toBeGreaterThan(1);
    for (const entry of catalogue) {
      const result = resolveWeatherVoiceFacebookShare({
        voiceId: entry.voiceId,
        language: entry.language,
        text: entry.text,
        mood: entry.mood,
      });
      expect(result.available, `${entry.language}/${entry.voiceId} (mood=${entry.mood}) should resolve`).toBe(true);
    }
  });
});
