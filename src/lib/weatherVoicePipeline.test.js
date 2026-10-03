// Ticket 420 (#420) — real engine -> content -> selector, for all nine
// conditions in both languages. Sarcastic conditions draw only from the
// personality pool; cautious and serious conditions draw only from the four
// safety messages, and never from personality text.
import { describe, it, expect } from "vitest";
import { evaluateWeatherVoice } from "./weatherVoiceEngine";
import { getWeatherVoiceLibrary } from "./weatherVoiceContent";
import { selectWeatherVoicePresentation } from "./weatherVoiceSelector";
import { weatherSafetyMessages } from "../i18n/weatherVoice/safety";
import { WEATHER_VOICE_LEDGER } from "../test-fixtures/weatherVoiceLedger";

const INPUTS = {
  extreme_wind: { tmax: 4, windMax: 17, rain: 5, code: 61 },
  heavy_rain: { tmax: 10, windMax: 5, rain: 15, code: 63 },
  strong_wind: { tmax: 10, windMax: 12, rain: 0, code: 0 },
  cold_wet: { tmax: 2, windMax: 0, rain: 5, code: 61 },
  cold: { tmax: 2, windMax: 0, rain: 0, code: 0 },
  rain: { tmax: 10, windMax: 0, rain: 5, code: 61 },
  sun_wind: { tmax: 10, windMax: 8, rain: 0, code: 0 },
  excellent: { tmax: 16, windMax: 0, rain: 0, code: 0 },
  good: { tmax: 13, windMax: 0, rain: 0, code: 3 },
};
const SARCASTIC = ["cold", "rain", "sun_wind", "excellent", "good"];
const CAUTIOUS_OR_SERIOUS = ["extreme_wind", "heavy_rain", "strong_wind", "cold_wet"];
const ACTIVE_IDS = new Set(WEATHER_VOICE_LEDGER.filter((r) => r.status === "retained" || r.status === "new").map((r) => r.id));
const SAFETY_IDS = new Set(weatherSafetyMessages.map((m) => m.message_id));
const now = Date.UTC(2026, 9, 3, 12, 0, 0);

describe("pipeline: sarcastic conditions draw only from the active personality pool (#420)", () => {
  for (const lang of ["is", "en"]) {
    it.each(SARCASTIC)(`%s in ${lang}: presentation id is an active personality ID with the engine's condition and mood`, (condition) => {
      const engineResult = evaluateWeatherVoice(INPUTS[condition]);
      expect(engineResult.voiceLevel).toBe("sarcastic");
      const presentation = selectWeatherVoicePresentation({
        engineResult,
        lang,
        library: getWeatherVoiceLibrary(lang),
        history: new Map(),
        now,
        rng: () => 0.42,
      });
      expect(presentation.show).toBe(true);
      expect(presentation.voiceLevel).toBe("sarcastic");
      expect(presentation.condition).toBe(condition);
      expect(presentation.mood).toBe(engineResult.mood);
      expect(ACTIVE_IDS.has(presentation.comment.id)).toBe(true);
      expect(SAFETY_IDS.has(presentation.comment.id)).toBe(false);
      expect(presentation.comment.text.length).toBeGreaterThan(0);
    });
  }
});

describe("pipeline: the primary presentation for cautious and serious conditions is a safety message (#420)", () => {
  // The heavy-rain supplement is a separate output (weatherVoiceSupplement.js). It
  // is never part of the primary presentation and is covered in its own suite.
  for (const lang of ["is", "en"]) {
    it.each(CAUTIOUS_OR_SERIOUS)(`%s in ${lang}: the primary presentation is a safety message, never a primary personality line`, (condition) => {
      const engineResult = evaluateWeatherVoice(INPUTS[condition]);
      expect(engineResult.voiceLevel).not.toBe("sarcastic");
      const presentation = selectWeatherVoicePresentation({
        engineResult,
        lang,
        library: getWeatherVoiceLibrary(lang),
        history: new Map(),
        now,
        rng: () => 0.42,
      });
      expect(presentation.show).toBe(true);
      expect(SAFETY_IDS.has(presentation.comment.id)).toBe(true);
      expect(ACTIVE_IDS.has(presentation.comment.id)).toBe(false);
      expect(presentation.ctaType).toBeNull();
    });
  }

  it("the four safety messages are unchanged in IS and EN and have no personality collision", () => {
    expect(weatherSafetyMessages.map((m) => m.message_id).sort()).toEqual(
      ["safety_cold_wet", "safety_extreme_wind", "safety_heavy_rain", "safety_strong_wind"]
    );
    for (const m of weatherSafetyMessages) expect(ACTIVE_IDS.has(m.message_id)).toBe(false);
  });
});

describe("pipeline: non-sarcastic or invalid tone never produces personality output (#420)", () => {
  it("a cautious result with a sarcastic-tagged personality pool is still silent or safety-only", () => {
    const presentation = selectWeatherVoicePresentation({
      engineResult: { show: true, condition: "strong_wind", mood: "struggling", severity: 2, voiceLevel: "cautious" },
      lang: "en",
      library: getWeatherVoiceLibrary("en"),
      history: new Map(),
      now,
      rng: () => 0,
    });
    expect(SAFETY_IDS.has(presentation.comment.id)).toBe(true);
  });

  it("a result with no voice level is silence, never a personality line", () => {
    const { voiceLevel, ...legacy } = evaluateWeatherVoice(INPUTS.good);
    expect(voiceLevel).toBe("sarcastic");
    const presentation = selectWeatherVoicePresentation({
      engineResult: legacy,
      lang: "is",
      library: getWeatherVoiceLibrary("is"),
      history: new Map(),
      now,
      rng: () => 0,
    });
    expect(presentation).toEqual({ show: false });
  });

  it("a sarcastic tone claimed for a serious condition is silence, never a personality line", () => {
    const presentation = selectWeatherVoicePresentation({
      engineResult: { show: true, condition: "extreme_wind", mood: "wrecked", severity: 3, voiceLevel: "sarcastic" },
      lang: "is",
      library: getWeatherVoiceLibrary("is"),
      history: new Map(),
      now,
      rng: () => 0,
    });
    expect(presentation).toEqual({ show: false });
  });
});
