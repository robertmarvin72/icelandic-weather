// Ticket 420 (#420) Part B — pure heavy-rain supplement selection, registry
// validation, and the separate supplement history module. Real modules, no mocks.
import { describe, it, expect } from "vitest";
import { selectWeatherVoiceSupplement, validateWeatherVoiceSupplements } from "./weatherVoiceSupplement";
import { weatherVoiceSupplements } from "../i18n/weatherVoice/supplement";
import { createWeatherVoiceSupplementHistory, WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY } from "./weatherVoiceSupplementHistory";
import { WEATHER_VOICE_LEDGER } from "../test-fixtures/weatherVoiceLedger";

const DAY = 86400000;
const NOW = Date.UTC(2026, 9, 3, 12, 0, 0);
const KNOWN = new Set(weatherVoiceSupplements.map((e) => e.id));

const CAUTIOUS_ENGINE = { show: true, condition: "heavy_rain", mood: "sad", severity: 2, voiceLevel: "cautious" };
const SAFETY_PRESENTATION = {
  show: true,
  condition: "heavy_rain",
  mood: "sad",
  severity: 2,
  voiceLevel: "cautious",
  comment: { id: "safety_heavy_rain", text: "Mikil rigning er í spánni. Það gæti þurft að endurskoða planið." },
  ctaType: null,
};

const hostileRng = () => {
  throw new Error("rng exploded");
};

describe("eligibility is derived, not assumed (#420 R4)", () => {
  it("a heavy_rain cautious result with its visible safety presentation yields a supplement in IS and EN", () => {
    for (const lang of ["is", "en"]) {
      const result = selectWeatherVoiceSupplement({ engineResult: CAUTIOUS_ENGINE, presentation: SAFETY_PRESENTATION, lang, history: new Map(), now: NOW, rng: () => 0 });
      expect(result.show).toBe(true);
      expect(result.parentVoiceId).toBe("safety_heavy_rain");
      expect(result.condition).toBe("heavy_rain");
      expect(KNOWN.has(result.supplementId)).toBe(true);
    }
  });

  it.each([
    ["extreme_wind (serious; windMax above 15 takes precedence)", { ...CAUTIOUS_ENGINE, condition: "extreme_wind", voiceLevel: "serious" }],
    ["strong_wind", { ...CAUTIOUS_ENGINE, condition: "strong_wind" }],
    ["cold_wet", { ...CAUTIOUS_ENGINE, condition: "cold_wet" }],
    ["a sarcastic engine result", { ...CAUTIOUS_ENGINE, voiceLevel: "sarcastic" }],
    ["no voice level at all", { show: true, condition: "heavy_rain", mood: "sad", severity: 2 }],
    ["silence", { show: false }],
  ])("%s never yields a supplement", (_label, engineResult) => {
    expect(selectWeatherVoiceSupplement({ engineResult, presentation: SAFETY_PRESENTATION, lang: "is", history: new Map(), now: NOW, rng: () => 0 })).toEqual({ show: false });
  });

  it("a visible primary with no safety comment, or a joke comment, yields no supplement", () => {
    const joke = { ...SAFETY_PRESENTATION, comment: { id: "good_01", text: "Þetta má alveg." } };
    expect(selectWeatherVoiceSupplement({ engineResult: CAUTIOUS_ENGINE, presentation: joke, lang: "is", history: new Map(), now: NOW, rng: () => 0 })).toEqual({ show: false });
    expect(selectWeatherVoiceSupplement({ engineResult: CAUTIOUS_ENGINE, presentation: { show: false }, lang: "is", history: new Map(), now: NOW, rng: () => 0 })).toEqual({ show: false });
  });

  it("forged presentations are refused: a sarcastic tone claimed for heavy_rain, and a cautious tone with another condition", () => {
    const sarcastic = { ...SAFETY_PRESENTATION, voiceLevel: "sarcastic" };
    const otherCondition = { ...SAFETY_PRESENTATION, condition: "strong_wind" };
    for (const presentation of [sarcastic, otherCondition]) {
      expect(selectWeatherVoiceSupplement({ engineResult: CAUTIOUS_ENGINE, presentation, lang: "is", history: new Map(), now: NOW, rng: () => 0 })).toEqual({ show: false });
    }
  });

  it("an unsupported language, or a missing safety text for that language, yields no supplement", () => {
    expect(selectWeatherSupplementFor({ lang: "fr" })).toEqual({ show: false });
    expect(selectWeatherSupplementFor({ lang: undefined })).toEqual({ show: false });
    expect(selectWeatherSupplementFor({ presentation: { ...SAFETY_PRESENTATION, comment: { id: "safety_heavy_rain", text: "" } } })).toEqual({ show: false });
  });
});

function selectWeatherSupplementFor(overrides) {
  return selectWeatherVoiceSupplement({ engineResult: CAUTIOUS_ENGINE, presentation: SAFETY_PRESENTATION, lang: "is", history: new Map(), now: NOW, rng: () => 0, ...overrides });
}

describe("registry validation: malformed entries are dropped, never crash (#420 R1)", () => {
  const good = weatherVoiceSupplements[0];

  it.each([
    ["blank IS text", { ...good, text_is: "   " }],
    ["blank EN text (wrong language field)", { ...good, text_en: "" }],
    ["missing text_en", { id: "rain_heavy_24", condition: "heavy_rain", repeatCooldownDays: 7, text_is: "x" }],
    ["non-heavy_rain condition", { ...good, condition: "strong_wind" }],
    ["collision with a primary joke", { ...good, id: "good_01" }],
    ["collision with a retired joke", { ...good, id: "cold_02" }],
    ["collision with a safety message", { ...good, id: "safety_heavy_rain" }],
    ["invalid id shape", { ...good, id: "rain heavy 24" }],
    ["negative cooldown", { ...good, repeatCooldownDays: -1 }],
  ])("%s is rejected", (_label, entry) => {
    const { valid, errors } = validateWeatherVoiceSupplements([entry]);
    expect(valid).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("a duplicated ID is dropped entirely, since its identity is ambiguous", () => {
    const { valid, errors } = validateWeatherVoiceSupplements([good, { ...good, text_is: "other" }]);
    expect(valid).toHaveLength(0);
    expect(errors.some((e) => /duplicate/.test(e))).toBe(true);
  });

  it("a non-array registry is an error, not a crash, and selection is silence", () => {
    expect(validateWeatherVoiceSupplements(null).valid).toHaveLength(0);
    expect(selectWeatherSupplementFor({ registry: null })).toEqual({ show: false });
  });

  it("an empty registry (the rollback path) yields silence", () => {
    expect(selectWeatherSupplementFor({ registry: [] })).toEqual({ show: false });
  });

  it("a malformed entry next to a valid one leaves the valid one selectable", () => {
    const result = selectWeatherSupplementFor({ registry: [{ ...good, text_is: "" }, weatherVoiceSupplements[1]] });
    expect(result.show).toBe(true);
    expect(result.supplementId).toBe("rain_heavy_25");
  });
});

describe("rotation uses the same 7-day rules, and a throwing rng falls back deterministically (#420 R2, R6)", () => {
  it("a throwing rng still yields a deterministic supplement (the first sorted ID)", () => {
    const result = selectWeatherSupplementFor({ rng: hostileRng });
    expect(result.show).toBe(true);
    expect(result.supplementId).toBe("rain_heavy_24");
  });

  it("an in-cooldown ID is excluded while another is available", () => {
    const history = new Map([["rain_heavy_24", NOW - DAY]]);
    const result = selectWeatherSupplementFor({ history, rng: () => 0 });
    expect(result.supplementId).not.toBe("rain_heavy_24");
  });

  it("when every ID is in cooldown, the least-recently-shown ID is chosen", () => {
    const history = new Map([
      ["rain_heavy_24", NOW - 1000],
      ["rain_heavy_25", NOW - 5000],
      ["rain_heavy_29", NOW - 3000],
    ]);
    expect(selectWeatherSupplementFor({ history, rng: () => 0 }).supplementId).toBe("rain_heavy_25");
  });

  it("the 7-day boundary: exactly seven days is available again", () => {
    const history = new Map([
      ["rain_heavy_24", NOW - 7 * DAY],
      ["rain_heavy_25", NOW - 1000],
      ["rain_heavy_29", NOW - 1000],
    ]);
    expect(selectWeatherSupplementFor({ history, rng: () => 0 }).supplementId).toBe("rain_heavy_24");
  });

  it("the selected text is the one for the active language", () => {
    expect(selectWeatherSupplementFor({ lang: "en", rng: () => 0 }).text).toBe("Is it time for the ark yet?");
    expect(selectWeatherSupplementFor({ lang: "is", rng: () => 0 }).text).toBe("Er ekki kominn tími á örkina?");
  });
});

describe("supplement registry matches the ledger exactly (#420 R9, R10)", () => {
  it("the three registry entries equal the ledger's active_supplemental rows, both languages", () => {
    const ledger = WEATHER_VOICE_LEDGER.filter((r) => r.status === "active_supplemental");
    expect(ledger.map((r) => r.id).sort()).toEqual(weatherVoiceSupplements.map((e) => e.id).sort());
    for (const row of ledger) {
      const entry = weatherVoiceSupplements.find((e) => e.id === row.id);
      expect(entry.text_is).toBe(row.is);
      expect(entry.text_en).toBe(row.en);
      expect(entry.condition).toBe("heavy_rain");
      expect(entry.repeatCooldownDays).toBe(7);
    }
  });
});

describe("supplement history: its own key, guarded storage, validated IDs (#420 R6)", () => {
  function fakeStorage(initial = null) {
    let value = initial;
    return {
      getItem: (k) => (k === WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY ? value : null),
      setItem: (k, v) => {
        if (k === WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY) value = v;
      },
      raw: () => value,
    };
  }

  it("uses its own storage key, not the primary joke-history key", () => {
    expect(WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY).toBe("weather_voice_supplement_history_v1");
    expect(WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY).not.toBe("weather_voice_history_v1");
  });

  it("records a shown ID and rehydrates it in a fresh instance", () => {
    const storage = fakeStorage();
    createWeatherVoiceSupplementHistory({ storage, knownIds: [...KNOWN] }).recordShown("rain_heavy_25", NOW - 1000);
    expect(JSON.parse(storage.raw()).records).toEqual({ rain_heavy_25: NOW - 1000 });
    const history = createWeatherVoiceSupplementHistory({ storage, knownIds: [...KNOWN] }).getHistory(NOW);
    expect(history.get("rain_heavy_25")).toBe(NOW - 1000);
  });

  it("refuses unknown, joke and safety IDs, and never writes them", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceSupplementHistory({ storage, knownIds: [...KNOWN] });
    for (const bad of ["good_01", "safety_heavy_rain", "cold_02", "rain_heavy_26"]) history.recordShown(bad, NOW);
    expect(storage.raw()).toBeNull();
  });

  it("discards persisted records for IDs that are not supplement IDs, on hydration", () => {
    const storage = fakeStorage(JSON.stringify({ version: 1, records: { good_01: NOW - 5, rain_heavy_24: NOW - 5 } }));
    const history = createWeatherVoiceSupplementHistory({ storage, knownIds: [...KNOWN] }).getHistory(NOW);
    expect([...history.keys()]).toEqual(["rain_heavy_24"]);
  });

  it("a throwing getItem and a throwing setItem are both non-fatal", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    const history = createWeatherVoiceSupplementHistory({ storage: throwing, knownIds: [...KNOWN] });
    expect(() => history.getHistory(NOW)).not.toThrow();
    expect(() => history.recordShown("rain_heavy_24", NOW)).not.toThrow();
    expect(history.getHistory(NOW).get("rain_heavy_24")).toBe(NOW);
  });

  it("an older recording never replaces a newer one, and an idempotent same-time repeat is a no-op", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceSupplementHistory({ storage, knownIds: [...KNOWN] });
    history.recordShown("rain_heavy_24", NOW);
    history.recordShown("rain_heavy_24", NOW - 10);
    history.recordShown("rain_heavy_24", NOW);
    expect(history.getHistory(NOW).get("rain_heavy_24")).toBe(NOW);
  });
});
