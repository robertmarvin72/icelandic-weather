// Ticket 406 (#406) — weatherVoiceContent.js: library assembly, language
// lookup, and validator, tested against the real content plus synthetic
// fixtures for negative validation cases.
import { describe, it, expect } from "vitest";
import { evaluateWeatherVoice } from "./weatherVoiceEngine";
import {
  getWeatherVoiceLibrary,
  validateWeatherVoiceLibrary,
  WEATHER_VOICE_KNOWN_CONDITIONS,
  WEATHER_VOICE_KNOWN_MOODS,
} from "./weatherVoiceContent";

// One real fixture per Phase 1 condition — reused from weatherVoiceEngine.test.js's
// "all nine conditions" fixtures, so canonicalPairs below is genuinely
// derived from real engine output, never hardcoded independently.
const ENGINE_FIXTURES = [
  { tmax: 4, windMax: 17, rain: 5, code: 61 }, // extreme_wind
  { tmax: 10, windMax: 5, rain: 15, code: 63 }, // heavy_rain
  { tmax: 10, windMax: 12, rain: 0, code: 0 }, // strong_wind
  { tmax: 2, windMax: 0, rain: 5, code: 61 }, // cold_wet
  { tmax: 2, windMax: 0, rain: 0, code: 0 }, // cold
  { tmax: 10, windMax: 0, rain: 5, code: 61 }, // rain
  { tmax: 10, windMax: 8, rain: 0, code: 0 }, // sun_wind
  { tmax: 16, windMax: 0, rain: 0, code: 0 }, // excellent
  { tmax: 13, windMax: 0, rain: 0, code: 3 }, // good
];

function realEngineResults() {
  return ENGINE_FIXTURES.map((input) => evaluateWeatherVoice(input));
}

function canonicalPairsFromEngine() {
  const pairs = new Set();
  for (const result of realEngineResults()) {
    expect(result.show).toBe(true); // fixtures must actually be active — guards against a stale fixture
    pairs.add(`${result.condition}|${result.mood}`);
  }
  return pairs;
}

const EXPECTED_IS_TEXT = {
  wind_extreme_01: "Vindur: Já.",
  wind_extreme_02: "Ég tek þetta sem persónulega árás.",
  wind_extreme_03: "Nei.",
  wind_extreme_04: "Vindurinn hefur orðið.",
  wind_extreme_05: "Þetta var ekki í bæklingnum.",
  wind_strong_01: "Lognið á frí.",
  wind_strong_02: "Hárið hefur gefist upp.",
  wind_strong_03: "Það blæs ekki af þessu.",
  rain_heavy_01: "Bíllinn fær allavega þvott.",
  rain_heavy_02: "Þurrt er afstætt hugtak.",
  rain_heavy_03: "Þetta er fullmikill áhugi á vatni.",
  cold_wet_01: "Ullin fær að vinna fyrir kaupinu.",
  cold_wet_02: "Veðrið tók allan pakkann.",
  cold_wet_03: "Ekki alveg stuttbuxnaveður.",
  cold_01: "Lopapeysan hafði rétt fyrir sér.",
  cold_02: "Peysan fær framlengingu.",
  cold_03: "Kaffið kólnar af samúð.",
  rain_01: "Það fylgir vatn með.",
  rain_02: "Regnjakki með aðalhlutverk.",
  sun_wind_01: "Sólin mætir. Lognið ekki.",
  sun_wind_02: "Bjart yfir. Hárið á hlið.",
  excellent_01: "Þetta er grunsamlega gott.",
  excellent_02: "Ekki segja neinum.",
  excellent_03: "Nú vantar bara kaffið.",
  good_01: "Þetta má alveg.",
  good_02: "Jæja. Þetta er bara gott.",
  good_03: "Engin kvörtun að sinni.",
};

describe("getWeatherVoiceLibrary — the real 27-entry IS library", () => {
  it("has exactly 27 entries", () => {
    expect(getWeatherVoiceLibrary("is")).toHaveLength(27);
  });

  it("has unique stable ASCII IDs", () => {
    const ids = getWeatherVoiceLibrary("is").map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9_]+$/);
  });

  it("matches the exact reviewed text for every ID", () => {
    const byId = Object.fromEntries(getWeatherVoiceLibrary("is").map((e) => [e.id, e.text]));
    expect(byId).toEqual(EXPECTED_IS_TEXT);
  });

  it("covers all nine Phase 1 conditions", () => {
    const conditions = new Set(getWeatherVoiceLibrary("is").map((e) => e.condition));
    expect(conditions).toEqual(WEATHER_VOICE_KNOWN_CONDITIONS);
  });

  it("every entry uses the MVP defaults: severity 0-3, 7-day cooldown, no CTA", () => {
    for (const entry of getWeatherVoiceLibrary("is")) {
      expect(entry.severityMin).toBe(0);
      expect(entry.severityMax).toBe(3);
      expect(entry.repeatCooldownDays).toBe(7);
      expect(entry.ctaType).toBeNull();
    }
  });

  it("every entry's condition/mood pair matches real Phase 1 engine output (not hardcoded here)", () => {
    const canonicalPairs = canonicalPairsFromEngine();
    for (const entry of getWeatherVoiceLibrary("is")) {
      expect(canonicalPairs.has(`${entry.condition}|${entry.mood}`)).toBe(true);
    }
  });

  it("every one of the nine actual Phase 1 outputs has at least two eligible IS comments at its actual severity", () => {
    const library = getWeatherVoiceLibrary("is");
    for (const result of realEngineResults()) {
      const eligible = library.filter(
        (e) => e.condition === result.condition && e.mood === result.mood && result.severity >= e.severityMin && result.severity <= e.severityMax
      );
      expect(eligible.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("getWeatherVoiceLibrary — EN and unsupported languages", () => {
  it("EN is a real, empty, supported library — not null", () => {
    const en = getWeatherVoiceLibrary("en");
    expect(en).toEqual([]);
    expect(en).not.toBeNull();
  });

  it("an unsupported/missing language returns null, never a silent fallback to Icelandic", () => {
    expect(getWeatherVoiceLibrary("fr")).toBeNull();
    expect(getWeatherVoiceLibrary(undefined)).toBeNull();
    expect(getWeatherVoiceLibrary("")).toBeNull();
    expect(getWeatherVoiceLibrary("IS")).toBeNull(); // case-sensitive — not a fuzzy match
  });
});

describe("validateWeatherVoiceLibrary — the real content passes with a real canonicalPairs set", () => {
  it("is valid with zero errors", () => {
    const canonicalPairs = canonicalPairsFromEngine();
    const result = validateWeatherVoiceLibrary({
      languages: { is: getWeatherVoiceLibrary("is"), en: getWeatherVoiceLibrary("en") },
      canonicalPairs,
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });
});

describe("validateWeatherVoiceLibrary — negative fixtures, one per rule", () => {
  const base = { id: "good_01", condition: "good", mood: "happy", text: "ok", severityMin: 0, severityMax: 3, repeatCooldownDays: 7, ctaType: null };

  it("rejects a duplicate ID within one language", () => {
    const result = validateWeatherVoiceLibrary({ languages: { is: [base, { ...base }] } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("duplicate id"))).toBe(true);
  });

  it("rejects an unsupported condition", () => {
    const result = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, condition: "bogus" }] } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("unsupported condition"))).toBe(true);
  });

  it("rejects an unsupported mood", () => {
    const result = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, mood: "bogus" }] } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("unsupported mood"))).toBe(true);
  });

  it("rejects a condition/mood pair absent from the injected canonicalPairs", () => {
    const result = validateWeatherVoiceLibrary({
      languages: { is: [{ ...base, condition: "cold", mood: "happy" }] }, // real strings, wrong pairing
      canonicalPairs: new Set(["good|happy"]),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("not a canonical Phase 1 pairing"))).toBe(true);
  });

  it("rejects empty and whitespace-only text", () => {
    for (const text of ["", "   "]) {
      const result = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, text }] } });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("nonempty"))).toBe(true);
    }
  });

  it("rejects an inverted severity range and an out-of-range bound", () => {
    const inverted = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, severityMin: 3, severityMax: 1 }] } });
    expect(inverted.valid).toBe(false);
    const outOfRange = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, severityMax: 4 }] } });
    expect(outOfRange.valid).toBe(false);
    const nonInteger = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, severityMin: 0.5 }] } });
    expect(nonInteger.valid).toBe(false);
  });

  it("rejects an invalid repeatCooldownDays", () => {
    const negative = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, repeatCooldownDays: -1 }] } });
    expect(negative.valid).toBe(false);
    const nonFinite = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, repeatCooldownDays: Infinity }] } });
    expect(nonFinite.valid).toBe(false);
  });

  it("rejects an invalid ctaType", () => {
    const result = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, ctaType: "teleport_home" }] } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("invalid ctaType"))).toBe(true);
  });

  it("accepts a valid, non-null ctaType", () => {
    const result = validateWeatherVoiceLibrary({ languages: { is: [{ ...base, ctaType: "better_location" }] } });
    expect(result.valid).toBe(true);
  });
});

describe("validateWeatherVoiceLibrary — bilingual ID sharing (synthetic fixtures)", () => {
  const isEntry = { id: "shared_01", condition: "good", mood: "happy", text: "Íslenskur texti", severityMin: 0, severityMax: 3, repeatCooldownDays: 7, ctaType: null };

  it("allows the same ID in two languages when metadata matches exactly (text may differ)", () => {
    const enEntry = { ...isEntry, text: "English text" };
    const result = validateWeatherVoiceLibrary({ languages: { is: [isEntry], en: [enEntry] } });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("rejects the same ID in two languages when any metadata field differs", () => {
    const mismatchedSeverity = { ...isEntry, text: "English text", severityMin: 1 };
    const result = validateWeatherVoiceLibrary({ languages: { is: [isEntry], en: [mismatchedSeverity] } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("metadata mismatch"))).toBe(true);
  });

  it("rejects a mismatch in cooldown, condition, mood, or CTA individually", () => {
    for (const override of [{ repeatCooldownDays: 3 }, { condition: "cold" }, { mood: "freezing" }, { ctaType: "better_location" }]) {
      const conflicting = { ...isEntry, text: "English text", ...override };
      const result = validateWeatherVoiceLibrary({ languages: { is: [isEntry], en: [conflicting] } });
      expect(result.valid).toBe(false);
    }
  });
});

describe("validateWeatherVoiceLibrary — empty EN is a valid library", () => {
  it("an empty language entry list produces zero errors", () => {
    expect(validateWeatherVoiceLibrary({ languages: { en: [] } })).toEqual({ valid: true, errors: [] });
  });
});
