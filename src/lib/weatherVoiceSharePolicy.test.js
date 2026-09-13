// Ticket 410 (#410) Revision 2 — "Every displayed Tjaldur is shareable."
// The condition allowlist and hazard-veto tests from Revision 1 are
// removed along with the code they tested (see weatherVoiceSharePolicy.js's
// own header) — the owner explicitly overrode condition-based eligibility;
// keeping tests for removed policy would assert behavior that no longer
// exists. Only structural validity remains: active + supported language.
import { describe, it, expect } from "vitest";
import { evaluateWeatherVoiceShareEligibility } from "./weatherVoiceSharePolicy";

function active(overrides = {}) {
  return { show: true, condition: "good", mood: "happy", severity: 0, comment: { id: "x", text: "x" }, ...overrides };
}

describe("evaluateWeatherVoiceShareEligibility — universal sharing (Ticket 410 Revision 2, #410)", () => {
  it("every real, active condition is eligible — not just good/excellent", () => {
    for (const condition of ["extreme_wind", "heavy_rain", "strong_wind", "cold_wet", "cold", "rain", "sun_wind", "excellent", "good"]) {
      const result = evaluateWeatherVoiceShareEligibility({ presentation: active({ condition }), lang: "is" });
      expect(result).toEqual({ eligible: true, reason: null });
    }
  });

  it("severity and mood are never consulted — the same result at severity 0 and severity 3", () => {
    const low = evaluateWeatherVoiceShareEligibility({ presentation: active({ severity: 0, mood: "happy" }), lang: "is" });
    const high = evaluateWeatherVoiceShareEligibility({ presentation: active({ severity: 3, mood: "wrecked", condition: "extreme_wind" }), lang: "is" });
    expect(low).toEqual({ eligible: true, reason: null });
    expect(high).toEqual({ eligible: true, reason: null });
  });

  it("an unrecognized/malformed condition string is still eligible — there is no allowlist left to reject it", () => {
    const result = evaluateWeatherVoiceShareEligibility({ presentation: active({ condition: "not-a-real-condition" }), lang: "is" });
    expect(result).toEqual({ eligible: true, reason: null });
  });

  it("a non-show presentation (silence) is rejected — Weather Voice's own conditional visibility is preserved", () => {
    expect(evaluateWeatherVoiceShareEligibility({ presentation: { show: false }, lang: "is" })).toEqual({ eligible: false, reason: "not_active" });
    expect(evaluateWeatherVoiceShareEligibility({ presentation: null, lang: "is" }).eligible).toBe(false);
    expect(evaluateWeatherVoiceShareEligibility({ presentation: undefined, lang: "is" }).eligible).toBe(false);
  });

  it("an unsupported language is rejected even for an otherwise-eligible episode — retained exactly as before", () => {
    for (const lang of ["fr", "", undefined, "IS", "EN"]) {
      const result = evaluateWeatherVoiceShareEligibility({ presentation: active(), lang });
      expect(result).toEqual({ eligible: false, reason: "unsupported_language" });
    }
  });
});
