// Ticket 420 (#420) Part B (R8) — the heavy-rain supplement has no share path:
// no catalogue entry, no manifest entry, no Facebook resolution, and no image.
import { describe, it, expect } from "vitest";
import { buildWeatherVoiceShareCatalogue } from "./weatherVoiceShareCatalogue";
import { WEATHER_VOICE_SHARE_MANIFEST } from "./weatherVoiceShareManifest.generated";
import { resolveWeatherVoiceFacebookShare } from "./weatherVoiceFacebookShare";
import { renderWeatherVoiceShareImage } from "./weatherVoiceShareImage";
import { buildWeatherVoiceShareSnapshot } from "./weatherVoiceShareSnapshot";
import { weatherVoiceSupplements } from "../i18n/weatherVoice/supplement";

const SUPPLEMENT_IDS = weatherVoiceSupplements.map((e) => e.id);

describe("R8 — no share path for supplement IDs (#420 Part B)", () => {
  it("the supplement IDs are the three rain_heavy_24/25/29 rows", () => {
    expect([...SUPPLEMENT_IDS].sort()).toEqual(["rain_heavy_24", "rain_heavy_25", "rain_heavy_29"]);
  });

  it("the active share catalogue contains no rain_heavy ID", () => {
    const ids = buildWeatherVoiceShareCatalogue().map((e) => e.voiceId);
    for (const id of SUPPLEMENT_IDS) expect(ids).not.toContain(id);
    expect(ids.some((id) => id.startsWith("rain_heavy_"))).toBe(false);
  });

  it("the generated manifest contains no supplement or rain_heavy key", () => {
    for (const key of Object.keys(WEATHER_VOICE_SHARE_MANIFEST)) {
      expect(key.includes("rain_heavy_")).toBe(false);
    }
  });

  it("the Facebook resolver never resolves a supplement ID (unknown_entry, or not_shareable for a heavy-rain snapshot)", () => {
    for (const id of SUPPLEMENT_IDS) {
      const result = resolveWeatherVoiceFacebookShare({
        voiceId: id,
        condition: "heavy_rain",
        voiceLevel: "cautious",
        language: "is",
        text: "x",
        mood: "sad",
      });
      expect(result.available).toBe(false);
      expect(["not_shareable", "unknown_entry"]).toContain(result.reason);
    }
  });

  it("no share snapshot can be built from a heavy-rain presentation, even one carrying a supplement", () => {
    const presentation = {
      show: true,
      condition: "heavy_rain",
      mood: "sad",
      severity: 2,
      voiceLevel: "cautious",
      comment: { id: "safety_heavy_rain", text: "Mikil rigning er í spánni. Það gæti þurft að endurskoða planið." },
      ctaType: null,
    };
    const snapshot = buildWeatherVoiceShareSnapshot({
      presentation: { ...presentation, supplement: { show: true, supplementId: "rain_heavy_24" } },
      lang: "is",
      site: { name: "Test" },
      todayRow: { tmax: 10, code: 63 },
      todayDate: "2026-10-03",
      episodeKey: "k",
    });
    expect(snapshot).toBeNull();
  });

  it("the image renderer refuses a heavy-rain snapshot before loading any asset", async () => {
    const snapshot = {
      voiceId: "rain_heavy_24",
      text: "Is it time for the ark yet?",
      language: "en",
      mood: "sad",
      condition: "heavy_rain",
      voiceLevel: "cautious",
      severity: 2,
      siteName: "Test",
      date: "2026-10-03",
      tmax: 10,
      code: 63,
      episodeKey: "k",
    };
    await expect(renderWeatherVoiceShareImage(snapshot, { t: (k) => k, moodAssetPath: "/x.png", brandingAssetPath: "/y.png" })).rejects.toThrow(/not shareable/);
  });
});
