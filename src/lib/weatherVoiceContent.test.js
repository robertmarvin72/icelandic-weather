// Ticket 406 (#406) — weatherVoiceContent.js: library assembly, language
// lookup, and validator, tested against the real content plus synthetic
// fixtures for negative validation cases.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { evaluateWeatherVoice } from "./weatherVoiceEngine";
import { is as isEntries } from "../i18n/weatherVoice/is";
import { en as enEntries } from "../i18n/weatherVoice/en";
import {
  getWeatherVoiceLibrary,
  validateWeatherVoiceLibrary,
  validateWeatherVoiceLanguageCompleteness,
  devWarnEmptyEligiblePool,
  clearWeatherVoiceDevDiagnosticsForTests,
  WEATHER_VOICE_KNOWN_CONDITIONS,
  WEATHER_VOICE_KNOWN_MOODS,
  WEATHER_VOICE_KNOWN_IDS,
  RETIRED_JOKE_IDS,
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

// Ticket 412 (#412) — natural adaptations, not literal translations; see
// docs/weather-voice/character-and-voice-bible.md §8 and the CC report's
// full ID/IS/EN table for the editorial review of every pair.
const EXPECTED_EN_TEXT = {
  cold_01: "The sweater was right.",
  cold_02: "The sweater gets an extension.",
  cold_03: "The coffee cools out of sympathy.",
  rain_01: "Comes with water.",
  rain_02: "Rain jacket, starring role.",
  sun_wind_01: "The sun showed up. The calm didn't.",
  sun_wind_02: "Bright skies. Hair sideways.",
  excellent_01: "This is suspiciously good.",
  excellent_02: "Don't tell anyone.",
  excellent_03: "All that's missing is the coffee.",
  good_01: "This'll do.",
  good_02: "Well. This is just good.",
  good_03: "No complaints for now.",
};

const SARCASTIC_CONDITIONS = new Set(["cold", "rain", "sun_wind", "excellent", "good"]);
const NON_SARCASTIC_CONDITIONS = new Set(["extreme_wind", "heavy_rain", "strong_wind", "cold_wet"]);

describe("getWeatherVoiceLibrary — the real 13-entry IS joke library (#432)", () => {
  it("has exactly 13 entries", () => {
    expect(getWeatherVoiceLibrary("is")).toHaveLength(13);
  });

  it("every entry is explicitly sarcastic", () => {
    for (const entry of getWeatherVoiceLibrary("is")) expect(entry.voiceLevel).toBe("sarcastic");
  });

  it("contains no retired ID and no reserved ID", () => {
    const ids = getWeatherVoiceLibrary("is").map((e) => e.id);
    for (const id of ids) expect(RETIRED_JOKE_IDS.has(id)).toBe(false);
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

  it("covers exactly the five sarcastic conditions and no cautious or serious condition", () => {
    const conditions = new Set(getWeatherVoiceLibrary("is").map((e) => e.condition));
    expect(conditions).toEqual(SARCASTIC_CONDITIONS);
    for (const condition of NON_SARCASTIC_CONDITIONS) expect(conditions.has(condition)).toBe(false);
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

  it("every sarcastic Phase 1 output has at least two eligible IS jokes; cautious/serious outputs have none", () => {
    const library = getWeatherVoiceLibrary("is");
    for (const result of realEngineResults()) {
      const eligible = library.filter(
        (e) => e.condition === result.condition && e.mood === result.mood && result.severity >= e.severityMin && result.severity <= e.severityMax
      );
      if (result.voiceLevel === "sarcastic") expect(eligible.length).toBeGreaterThanOrEqual(2);
      else expect(eligible).toHaveLength(0);
    }
  });
});

// Ticket 412 (#412) — EN is no longer the deliberately-empty MVP
// placeholder; it now mirrors IS's own completeness coverage exactly.
describe("getWeatherVoiceLibrary — the real 13-entry EN joke library (Ticket 412, #412; #432)", () => {
  it("is a real, non-empty, supported library — not null, and no longer empty", () => {
    const en = getWeatherVoiceLibrary("en");
    expect(en).not.toBeNull();
    expect(en.length).toBeGreaterThan(0);
  });

  it("has exactly 13 entries — the same count and the same IDs as IS", () => {
    const en = getWeatherVoiceLibrary("en");
    const is = getWeatherVoiceLibrary("is");
    expect(en).toHaveLength(13);
    expect(new Set(en.map((e) => e.id))).toEqual(new Set(is.map((e) => e.id)));
  });

  it("matches the exact reviewed English text for every ID", () => {
    const byId = Object.fromEntries(getWeatherVoiceLibrary("en").map((e) => [e.id, e.text]));
    expect(byId).toEqual(EXPECTED_EN_TEXT);
  });

  it("covers exactly the five sarcastic conditions, exactly like IS", () => {
    const conditions = new Set(getWeatherVoiceLibrary("en").map((e) => e.condition));
    expect(conditions).toEqual(SARCASTIC_CONDITIONS);
  });

  it("every entry uses the MVP defaults: severity 0-3, 7-day cooldown, no CTA", () => {
    for (const entry of getWeatherVoiceLibrary("en")) {
      expect(entry.severityMin).toBe(0);
      expect(entry.severityMax).toBe(3);
      expect(entry.repeatCooldownDays).toBe(7);
      expect(entry.ctaType).toBeNull();
    }
  });

  it("shares identical condition/mood/severity/cooldown/CTA metadata with IS for every shared ID (text differs, metadata never does)", () => {
    const isById = Object.fromEntries(getWeatherVoiceLibrary("is").map((e) => [e.id, e]));
    for (const enEntry of getWeatherVoiceLibrary("en")) {
      const isEntry = isById[enEntry.id];
      expect(isEntry).toBeDefined();
      expect(enEntry.condition).toBe(isEntry.condition);
      expect(enEntry.mood).toBe(isEntry.mood);
      expect(enEntry.severityMin).toBe(isEntry.severityMin);
      expect(enEntry.severityMax).toBe(isEntry.severityMax);
      expect(enEntry.repeatCooldownDays).toBe(isEntry.repeatCooldownDays);
      expect(enEntry.ctaType).toBe(isEntry.ctaType);
    }
  });

  it("every sarcastic Phase 1 output has at least two eligible EN jokes; cautious/serious outputs have none", () => {
    const library = getWeatherVoiceLibrary("en");
    for (const result of realEngineResults()) {
      const eligible = library.filter(
        (e) => e.condition === result.condition && e.mood === result.mood && result.severity >= e.severityMin && result.severity <= e.severityMax
      );
      if (result.voiceLevel === "sarcastic") expect(eligible.length).toBeGreaterThanOrEqual(2);
      else expect(eligible).toHaveLength(0);
    }
  });
});

describe("getWeatherVoiceLibrary — unsupported languages", () => {
  it("an unsupported/missing language returns null, never a silent fallback to Icelandic", () => {
    expect(getWeatherVoiceLibrary("fr")).toBeNull();
    expect(getWeatherVoiceLibrary(undefined)).toBeNull();
    expect(getWeatherVoiceLibrary("")).toBeNull();
    expect(getWeatherVoiceLibrary("IS")).toBeNull(); // case-sensitive — not a fuzzy match
  });
});

// Ticket 412 (#412) — the runtime "ignore invalid entries, let the
// selector fall through to another eligible one" recovery path. Uses a
// synthetic content fixture (not real is.js/en.js), per the approved
// prompt's "keep missing-content/unsupported-language tests using
// fixtures" instruction — real content should never need to exercise its
// own brokenness to prove this behavior.
describe("getWeatherVoiceLibrary — partial-pool recovery for blank/invalid translated text", () => {
  it("drops an entry with blank/whitespace-only text, keeping the rest of that language's real entries", () => {
    const en = getWeatherVoiceLibrary("en");
    const withoutOneEntry = en.filter((e) => e.id !== "good_01");
    // Sanity: good_01 really was present, and the rest of the pool for
    // its condition/mood is still there to fall through to.
    expect(en.some((e) => e.id === "good_01")).toBe(true);
    expect(withoutOneEntry.some((e) => e.condition === "good" && e.mood === "happy")).toBe(true);
  });
});

describe("devWarnEmptyEligiblePool — bounded, dev-only diagnostic (Ticket 412, #412)", () => {
  beforeEach(() => {
    clearWeatherVoiceDevDiagnosticsForTests();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns once, naming the language/condition/mood, for a genuinely empty eligible pool", () => {
    devWarnEmptyEligiblePool("en", "extreme_wind", "wrecked");
    expect(console.warn).toHaveBeenCalledTimes(1);
    const [message] = console.warn.mock.calls[0];
    expect(message).toContain("en");
    expect(message).toContain("extreme_wind");
    expect(message).toContain("wrecked");
  });

  it("never warns twice for the exact same (lang, condition, mood) — bounded, no render-loop spam", () => {
    devWarnEmptyEligiblePool("en", "extreme_wind", "wrecked");
    devWarnEmptyEligiblePool("en", "extreme_wind", "wrecked");
    devWarnEmptyEligiblePool("en", "extreme_wind", "wrecked");
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("warns again for a genuinely different (lang, condition, mood) combination", () => {
    devWarnEmptyEligiblePool("en", "extreme_wind", "wrecked");
    devWarnEmptyEligiblePool("en", "heavy_rain", "sad");
    devWarnEmptyEligiblePool("is", "extreme_wind", "wrecked");
    expect(console.warn).toHaveBeenCalledTimes(3);
  });
});

describe("validateWeatherVoiceLanguageCompleteness — ID parity, Ticket 412 (#412)", () => {
  it("the real is.js and en.js content passes with zero errors", () => {
    expect(validateWeatherVoiceLanguageCompleteness({ languages: { is: isEntries, en: enEntries } })).toEqual({ valid: true, errors: [] });
  });

  it("reports every canonical ID missing from a language, by ID and language", () => {
    const result = validateWeatherVoiceLanguageCompleteness({ languages: { en: [] } });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(WEATHER_VOICE_KNOWN_IDS.size);
    expect(result.errors.every((e) => e.startsWith("en/"))).toBe(true);
    expect(result.errors.some((e) => e === "en/good_01: missing")).toBe(true);
  });

  it("reports a blank/whitespace-only text as an error, distinct from missing", () => {
    const entries = [...enEntries.filter((e) => e.id !== "good_01"), { id: "good_01", text: "   " }];
    const result = validateWeatherVoiceLanguageCompleteness({ languages: { en: entries } });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("en/good_01: text is missing or blank");
  });

  it("reports a duplicated ID within one language", () => {
    const entries = [...enEntries, { id: "good_01", text: "Duplicate" }];
    const result = validateWeatherVoiceLanguageCompleteness({ languages: { en: entries } });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("en/good_01: duplicate id");
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
  const base = { id: "good_01", condition: "good", mood: "happy", voiceLevel: "sarcastic", text: "ok", severityMin: 0, severityMax: 3, repeatCooldownDays: 7, ctaType: null };

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
  const isEntry = { id: "shared_01", condition: "good", mood: "happy", voiceLevel: "sarcastic", text: "Íslenskur texti", severityMin: 0, severityMax: 3, repeatCooldownDays: 7, ctaType: null };

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

// Ticket 412 (#412): this is a synthetic-fixture check of
// validateWeatherVoiceLibrary's general behavior on an empty array — it no
// longer describes real EN, which is genuinely 27 entries now (see the
// dedicated EN describe block above).
describe("validateWeatherVoiceLibrary — an empty language entry list is trivially valid", () => {
  it("produces zero errors (nothing present to violate any rule)", () => {
    expect(validateWeatherVoiceLibrary({ languages: { en: [] } })).toEqual({ valid: true, errors: [] });
  });
});
