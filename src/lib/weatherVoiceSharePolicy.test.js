// Ticket 410 (#410) Revision 2 superseded by Ticket 432 (#432): sharing is an
// allowlist of sarcastic, policy-consistent episodes. Cautious and serious
// episodes, missing or unknown tone, and mismatched tone are all refused.
import { describe, it, expect } from "vitest";
import { evaluateWeatherVoiceShareEligibility, evaluateWeatherVoiceSnapshotEligibility } from "./weatherVoiceSharePolicy";

const SARCASTIC_CONDITIONS = ["cold", "rain", "sun_wind", "excellent", "good"];
const NON_SARCASTIC = [
  ["extreme_wind", "serious"],
  ["heavy_rain", "cautious"],
  ["strong_wind", "cautious"],
  ["cold_wet", "cautious"],
];

function active(overrides = {}) {
  return { show: true, condition: "good", voiceLevel: "sarcastic", mood: "happy", severity: 0, comment: { id: "x", text: "x" }, ...overrides };
}

function snapshot(overrides = {}) {
  return { voiceId: "good_01", language: "is", condition: "good", voiceLevel: "sarcastic", mood: "happy", severity: 0, text: "x", ...overrides };
}

describe("evaluateWeatherVoiceShareEligibility — sarcastic-only sharing (#432)", () => {
  it("every sarcastic, policy-consistent condition is eligible", () => {
    for (const condition of SARCASTIC_CONDITIONS) {
      const result = evaluateWeatherVoiceShareEligibility({ presentation: active({ condition }), lang: "is" });
      expect(result).toEqual({ eligible: true, reason: null });
    }
  });

  it("every cautious and serious condition is refused, at the presentation level", () => {
    for (const [condition, voiceLevel] of NON_SARCASTIC) {
      const result = evaluateWeatherVoiceShareEligibility({ presentation: active({ condition, voiceLevel }), lang: "is" });
      expect(result).toEqual({ eligible: false, reason: "tone_not_sarcastic" });
    }
  });

  it("a missing, unknown, non-string or mismatched voiceLevel is refused — never defaulted to sarcastic", () => {
    for (const voiceLevel of [undefined, null, "", "Sarcastic", "playful", 1, true]) {
      const result = evaluateWeatherVoiceShareEligibility({ presentation: active({ voiceLevel }), lang: "is" });
      expect(result).toEqual({ eligible: false, reason: "tone_not_sarcastic" });
    }
  });

  it("a sarcastic voiceLevel on a non-sarcastic condition is refused as a tone mismatch", () => {
    const result = evaluateWeatherVoiceShareEligibility({ presentation: active({ condition: "extreme_wind" }), lang: "is" });
    expect(result).toEqual({ eligible: false, reason: "tone_condition_mismatch" });
  });

  it("an unrecognized condition string is refused, never treated as sarcastic", () => {
    const result = evaluateWeatherVoiceShareEligibility({ presentation: active({ condition: "not-a-real-condition" }), lang: "is" });
    expect(result.eligible).toBe(false);
  });

  it("severity and mood are never consulted for sarcastic episodes", () => {
    const low = evaluateWeatherVoiceShareEligibility({ presentation: active({ severity: 0, mood: "happy" }), lang: "is" });
    const high = evaluateWeatherVoiceShareEligibility({ presentation: active({ severity: 3, mood: "wrecked" }), lang: "is" });
    expect(low).toEqual({ eligible: true, reason: null });
    expect(high).toEqual({ eligible: true, reason: null });
  });

  it("a non-show presentation (silence) is rejected", () => {
    expect(evaluateWeatherVoiceShareEligibility({ presentation: { show: false }, lang: "is" })).toEqual({ eligible: false, reason: "not_active" });
    expect(evaluateWeatherVoiceShareEligibility({ presentation: null, lang: "is" }).eligible).toBe(false);
    expect(evaluateWeatherVoiceShareEligibility({ presentation: undefined, lang: "is" }).eligible).toBe(false);
  });

  it("an unsupported language is rejected even for an otherwise-eligible episode", () => {
    for (const lang of ["fr", "", undefined, "IS", "EN"]) {
      const result = evaluateWeatherVoiceShareEligibility({ presentation: active(), lang });
      expect(result).toEqual({ eligible: false, reason: "unsupported_language" });
    }
  });
});

describe("evaluateWeatherVoiceSnapshotEligibility — re-checked at every later entrypoint (#432)", () => {
  it("a sarcastic, policy-consistent frozen snapshot is eligible", () => {
    expect(evaluateWeatherVoiceSnapshotEligibility(snapshot())).toEqual({ eligible: true, reason: null });
  });

  it("a snapshot with a cautious or serious tone is refused", () => {
    for (const [condition, voiceLevel] of NON_SARCASTIC) {
      expect(evaluateWeatherVoiceSnapshotEligibility(snapshot({ condition, voiceLevel })).eligible).toBe(false);
    }
  });

  it("a snapshot without voiceId, language, or a valid tone is refused", () => {
    expect(evaluateWeatherVoiceSnapshotEligibility(null).eligible).toBe(false);
    expect(evaluateWeatherVoiceSnapshotEligibility(snapshot({ voiceId: "" })).eligible).toBe(false);
    expect(evaluateWeatherVoiceSnapshotEligibility(snapshot({ language: "fr" })).eligible).toBe(false);
    expect(evaluateWeatherVoiceSnapshotEligibility(snapshot({ voiceLevel: undefined })).eligible).toBe(false);
  });
});
