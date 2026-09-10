// Ticket 405 (#405) — declaration-completeness coverage for the
// weatherVoiceTypes.js JSDoc contract. This is deliberately a source-text
// check, not a runtime-reachability check: the approved prompt requires
// the twelve-mood vocabulary to be verified "by source review" and
// explicitly forbids adding a rule or runtime vocabulary registry solely
// to make the four reserved moods testable. Reading the typedef text
// itself (rather than importing a mood list to iterate over) satisfies
// "source review" without adding any such registry.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = readFileSync(join(process.cwd(), "src/lib/weatherVoiceTypes.js"), "utf8");

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

const ALL_NINE_CONDITIONS = [
  "extreme_wind",
  "heavy_rain",
  "strong_wind",
  "cold_wet",
  "cold",
  "rain",
  "sun_wind",
  "excellent",
  "good",
];

describe("weatherVoiceTypes.js — declaration completeness (source review)", () => {
  it("declares a TjaldurMood typedef", () => {
    expect(SOURCE).toMatch(/@typedef\s*\{[^}]*\}\s*TjaldurMood/);
  });

  it("the TjaldurMood typedef declares all twelve exact mood strings", () => {
    const match = SOURCE.match(/@typedef\s*\{([^}]*)\}\s*TjaldurMood/);
    expect(match).not.toBeNull();
    const literal = match[1];
    for (const mood of ALL_TWELVE_MOODS) {
      expect(literal).toContain(`"${mood}"`);
    }
    // Exactly twelve quoted strings — no extra invented vocabulary.
    const quoted = literal.match(/"[^"]+"/g) ?? [];
    expect(quoted).toHaveLength(12);
  });

  it("declares a WeatherVoiceCondition typedef with all nine exact condition strings", () => {
    const match = SOURCE.match(/@typedef\s*\{([^}]*)\}\s*WeatherVoiceCondition/);
    expect(match).not.toBeNull();
    const literal = match[1];
    for (const condition of ALL_NINE_CONDITIONS) {
      expect(literal).toContain(`"${condition}"`);
    }
    const quoted = literal.match(/"[^"]+"/g) ?? [];
    expect(quoted).toHaveLength(9);
  });

  it("documents the four reserved (Phase 1 unreachable) moods explicitly", () => {
    for (const reserved of ["neutral", "nervous", "amazed", "sleeping"]) {
      expect(SOURCE).toContain(reserved);
    }
    expect(SOURCE.toLowerCase()).toContain("reserved");
  });

  it("has no runtime exports (JSDoc typedefs only, per project convention)", async () => {
    const mod = await import("./weatherVoiceTypes");
    expect(Object.keys(mod)).toEqual([]);
  });
});

describe("weatherVoiceTypes.js — Ticket 406 (#406) Phase 2 typedefs", () => {
  it("declares the comment/presentation/history contracts, preserving every Phase 1 typedef", () => {
    for (const typedefName of [
      // Phase 1 (#405) — must remain present, unchanged in meaning:
      "WeatherVoiceCondition",
      "TjaldurMood",
      "WeatherVoiceInput",
      "WeatherVoiceResult",
      // Phase 2 (#406) — new:
      "WeatherVoiceCtaType",
      "WeatherVoiceCommentMetadata",
      "WeatherVoiceCommentEntry",
      "WeatherVoicePresentation",
      "WeatherVoiceHistory",
    ]) {
      expect(SOURCE).toMatch(new RegExp(`@typedef[^\\n]*\\}\\s*${typedefName}\\b`));
    }
  });

  it("the WeatherVoiceCtaType typedef declares all five approved CTA strings", () => {
    const match = SOURCE.match(/@typedef\s*\{([^}]*)\}\s*WeatherVoiceCtaType/);
    expect(match).not.toBeNull();
    for (const cta of ["better_location", "calmer_location", "drier_location", "warmer_location", "best_locations"]) {
      expect(match[1]).toContain(`"${cta}"`);
    }
  });
});
