// Ticket 432 (#432) — explicit voice levels, the separate cautious/serious
// safety library, retired/reserved joke IDs, and sarcastic-only sharing.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { evaluateWeatherVoice } from "./weatherVoiceEngine";
import { voiceLevelForCondition } from "./weatherVoiceRules";
import { selectWeatherVoicePresentation, selectWeatherVoiceComment } from "./weatherVoiceSelector";
import { getWeatherVoiceLibrary, RETIRED_JOKE_IDS, WEATHER_VOICE_KNOWN_IDS, WEATHER_VOICE_KNOWN_CONDITIONS } from "./weatherVoiceContent";
import { getWeatherSafetyMessage, selectWeatherSafetyPresentation, validateWeatherSafetyMessages } from "./weatherVoiceSafety";
import { weatherSafetyMessages } from "../i18n/weatherVoice/safety";
import { buildWeatherVoiceShareCatalogue } from "./weatherVoiceShareCatalogue";
import { evaluateWeatherVoiceToneEligibility } from "./weatherVoiceSharePolicy";
import { WEATHER_VOICE_LEDGER } from "../test-fixtures/weatherVoiceLedger";

const NINE_CONDITION_INPUTS = {
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

const EXPECTED_TONE = {
  extreme_wind: "serious",
  heavy_rain: "cautious",
  strong_wind: "cautious",
  cold_wet: "cautious",
  cold: "sarcastic",
  rain: "sarcastic",
  sun_wind: "sarcastic",
  excellent: "sarcastic",
  good: "sarcastic",
};

const RETIRED_EXPECTED = [
  "wind_extreme_01", "wind_extreme_02", "wind_extreme_03", "wind_extreme_04", "wind_extreme_05",
  "wind_strong_01", "wind_strong_02", "wind_strong_03",
  "rain_heavy_01", "rain_heavy_02", "rain_heavy_03",
  "cold_wet_01", "cold_wet_02", "cold_wet_03",
  "cold_02", "excellent_02",
];
const LEDGER_RETIRED = WEATHER_VOICE_LEDGER.filter((r) => r.status === "retired").map((r) => r.id);
const LEDGER_ACTIVE = WEATHER_VOICE_LEDGER.filter((r) => r.status === "retained" || r.status === "new");

const APPROVED_SAFETY = {
  safety_extreme_wind: {
    condition: "extreme_wind",
    voice_level: "serious",
    text_is: "Mjög hvassviðri er í spánni. Aðstæður geta verið varasamar. Athugaðu opinberar veðurviðvaranir áður en þú leggur af stað.",
    text_en: "Very strong winds are forecast. Conditions may be hazardous. Check official weather warnings before setting out.",
  },
  safety_strong_wind: {
    condition: "strong_wind",
    voice_level: "cautious",
    text_is: "Hvassviðri er í spánni. Skoðaðu aðstæður vel áður en þú ákveður næsta áfangastað.",
    text_en: "Strong winds are forecast. Check conditions carefully before choosing your next destination.",
  },
  safety_heavy_rain: {
    condition: "heavy_rain",
    voice_level: "cautious",
    text_is: "Mikil rigning er í spánni. Það gæti þurft að endurskoða planið.",
    text_en: "Heavy rain is forecast. You may need to reconsider your plans.",
  },
  safety_cold_wet: {
    condition: "cold_wet",
    voice_level: "cautious",
    text_is: "Kalt og blautt er í spánni. Taktu mið af því þegar þú skipuleggur daginn.",
    text_en: "Cold and wet conditions are forecast. Take this into account when planning your day.",
  },
};

const hostileRng = () => {
  throw new Error("rng must not be consulted for safety selection");
};

function engineFor(condition) {
  return evaluateWeatherVoice(NINE_CONDITION_INPUTS[condition]);
}

describe("voice level policy — exhaustive over the nine conditions (#432)", () => {
  it("the nine conditions are exactly the engine's known conditions", () => {
    expect(new Set(Object.keys(EXPECTED_TONE))).toEqual(WEATHER_VOICE_KNOWN_CONDITIONS);
  });

  it.each(Object.entries(EXPECTED_TONE))("%s maps to %s", (condition, tone) => {
    expect(voiceLevelForCondition(condition)).toBe(tone);
  });

  it("returns null for any unknown or non-string condition — never a default tone", () => {
    for (const bad of ["not_a_condition", "", undefined, null, 7, "__proto__", "constructor"]) {
      expect(voiceLevelForCondition(bad)).toBeNull();
    }
  });

  it("the engine attaches the policy voice level to every active result, independent of severity and mood", () => {
    for (const [condition, input] of Object.entries(NINE_CONDITION_INPUTS)) {
      const result = evaluateWeatherVoice(input);
      expect(result.show).toBe(true);
      expect(result.condition).toBe(condition);
      expect(result.voiceLevel).toBe(EXPECTED_TONE[condition]);
    }
  });

  it("silence carries no voice level", () => {
    expect(evaluateWeatherVoice({ tmax: 8, windMax: 4, rain: 0, code: 3 })).toEqual({ show: false });
  });
});

describe("safety library content (#432)", () => {
  it("contains exactly four messages with the approved shared IDs and copy", () => {
    expect(weatherSafetyMessages).toHaveLength(4);
    const byId = Object.fromEntries(weatherSafetyMessages.map((m) => [m.message_id, m]));
    expect(Object.keys(byId).sort()).toEqual(Object.keys(APPROVED_SAFETY).sort());
    for (const [id, expected] of Object.entries(APPROVED_SAFETY)) {
      expect(byId[id]).toMatchObject(expected);
      expect(byId[id].ctaType).toBeUndefined();
    }
  });

  it("passes the collision, policy and text validator with zero errors", () => {
    expect(validateWeatherSafetyMessages({ messages: weatherSafetyMessages })).toEqual({ valid: true, errors: [] });
  });

  it("every safety ID matches the ASCII pattern and collides with no active or retired joke ID", () => {
    for (const message of weatherSafetyMessages) {
      expect(message.message_id).toMatch(/^[A-Za-z0-9_]+$/);
      expect(WEATHER_VOICE_KNOWN_IDS.has(message.message_id)).toBe(false);
      expect(RETIRED_JOKE_IDS.has(message.message_id)).toBe(false);
    }
  });

  it("the validator rejects a collision with an active joke ID, a retired ID, a sarcastic level, and a policy mismatch", () => {
    const bad = [
      { ...weatherSafetyMessages[0], message_id: "good_01" },
      { ...weatherSafetyMessages[0], message_id: "wind_extreme_01" },
      { ...weatherSafetyMessages[0], voice_level: "sarcastic" },
      { ...weatherSafetyMessages[0], voice_level: "cautious" },
      { ...weatherSafetyMessages[0], text_en: "" },
      { ...weatherSafetyMessages[0], message_id: "bad id!" },
    ];
    for (const message of bad) {
      expect(validateWeatherSafetyMessages({ messages: [message] }).valid).toBe(false);
    }
  });
});

describe("retired and reserved joke IDs (#432, #420)", () => {
  it("retires exactly the 16 ledger-retired IDs (14 by #432, cold_02 and excellent_02 by #420)", () => {
    expect([...RETIRED_JOKE_IDS].sort()).toEqual([...RETIRED_EXPECTED].sort());
    expect([...RETIRED_JOKE_IDS].sort()).toEqual([...LEDGER_RETIRED].sort());
    expect(RETIRED_JOKE_IDS.size).toBe(16);
  });

  it("no retired ID is active in either language", () => {
    for (const lang of ["is", "en"]) {
      const ids = getWeatherVoiceLibrary(lang).map((e) => e.id);
      for (const id of RETIRED_EXPECTED) expect(ids).not.toContain(id);
    }
    for (const id of RETIRED_EXPECTED) expect(WEATHER_VOICE_KNOWN_IDS.has(id)).toBe(false);
  });

  it("every active primary personality entry is explicitly sarcastic in both languages", () => {
    for (const lang of ["is", "en"]) {
      const library = getWeatherVoiceLibrary(lang);
      expect(library).toHaveLength(LEDGER_ACTIVE.length);
      for (const entry of library) expect(entry.voiceLevel).toBe("sarcastic");
    }
  });
});

describe("cautious and serious episodes select only safety text (#432)", () => {
  it.each(Object.keys(APPROVED_SAFETY).map((id) => [id, APPROVED_SAFETY[id].condition]))(
    "%s: IS and EN return the approved text, with the same ID and no joke",
    (id, condition) => {
      for (const lang of ["is", "en"]) {
        const presentation = selectWeatherVoicePresentation({
          engineResult: engineFor(condition),
          lang,
          library: getWeatherVoiceLibrary(lang),
          history: new Map(),
          now: 0,
          rng: hostileRng,
        });
        expect(presentation.show).toBe(true);
        expect(presentation.comment.id).toBe(id);
        expect(presentation.comment.text).toBe(lang === "is" ? APPROVED_SAFETY[id].text_is : APPROVED_SAFETY[id].text_en);
        expect(presentation.voiceLevel).toBe(EXPECTED_TONE[condition]);
        expect(presentation.ctaType).toBeNull();
      }
    }
  );

  it("is independent of cooldown and history: every safety ID shown just now still yields the same valid text", () => {
    const now = 1_000_000_000_000;
    const history = new Map(
      [...WEATHER_VOICE_KNOWN_IDS, ...Object.keys(APPROVED_SAFETY)].map((id) => [id, now])
    );
    const first = selectWeatherSafetyPresentation({ engineResult: engineFor("cold_wet"), lang: "en" });
    const again = selectWeatherVoicePresentation({ engineResult: engineFor("cold_wet"), lang: "en", library: [], history, now, rng: hostileRng });
    expect(again).toEqual(first);
    expect(again.comment.id).toBe("safety_cold_wet");
  });

  it("never reaches the joke pool, even when a joke matches the same condition and mood", () => {
    const presentation = selectWeatherVoicePresentation({
      engineResult: { show: true, condition: "strong_wind", mood: "struggling", severity: 2, voiceLevel: "cautious" },
      lang: "is",
      library: [{ id: "wind_strong_01", text: "Lognið á frí.", condition: "strong_wind", mood: "struggling", voiceLevel: "sarcastic", severityMin: 0, severityMax: 3, repeatCooldownDays: 7, ctaType: null }],
      history: new Map(),
      now: 0,
      rng: () => 0,
    });
    expect(presentation.comment.id).toBe("safety_strong_wind");
  });

  it("the joke selector refuses cautious and serious results outright", () => {
    for (const condition of ["extreme_wind", "heavy_rain", "strong_wind", "cold_wet"]) {
      const result = selectWeatherVoiceComment({
        engineResult: engineFor(condition),
        library: getWeatherVoiceLibrary("is"),
        history: new Map(),
        now: 0,
        rng: () => 0,
      });
      expect(result).toEqual({ show: false });
    }
  });
});

describe("fail-closed safety selection (#432)", () => {
  const cautiousResult = { show: true, condition: "heavy_rain", mood: "sad", severity: 2, voiceLevel: "cautious" };

  it("an empty, missing or non-array pool is silence", () => {
    expect(selectWeatherSafetyPresentation({ engineResult: cautiousResult, lang: "en", messages: [] })).toEqual({ show: false });
    expect(selectWeatherSafetyPresentation({ engineResult: cautiousResult, lang: "en", messages: null })).toEqual({ show: false });
    expect(selectWeatherSafetyPresentation({ engineResult: cautiousResult, lang: "en", messages: "nope" })).toEqual({ show: false });
  });

  it("a missing language text, a blank language text, or an unsupported locale is silence — never Icelandic-for-English and never a joke", () => {
    const noEn = weatherSafetyMessages.map((m) => ({ ...m, text_en: "" }));
    expect(selectWeatherSafetyPresentation({ engineResult: cautiousResult, lang: "en", messages: noEn })).toEqual({ show: false });
    expect(selectWeatherSafetyPresentation({ engineResult: cautiousResult, lang: "fr" })).toEqual({ show: false });
    expect(selectWeatherSafetyPresentation({ engineResult: cautiousResult, lang: undefined })).toEqual({ show: false });
  });

  it("a wrong-level message for the condition is never selected", () => {
    const wrongLevel = [{ ...weatherSafetyMessages[1], voice_level: "serious" }];
    expect(selectWeatherSafetyPresentation({ engineResult: cautiousResult, lang: "is", messages: wrongLevel })).toEqual({ show: false });
  });

  it("a legacy or injected engine result with no voiceLevel is silence — never defaulted to sarcastic or to a safety tone", () => {
    const legacy = { show: true, condition: "heavy_rain", mood: "sad", severity: 2 };
    expect(selectWeatherSafetyPresentation({ engineResult: legacy, lang: "en" })).toEqual({ show: false });
    expect(selectWeatherVoicePresentation({ engineResult: legacy, lang: "en", library: getWeatherVoiceLibrary("en"), history: new Map(), now: 0, rng: () => 0 })).toEqual({ show: false });
  });

  it("a sarcastic tone claimed for a cautious condition is silence, not a joke", () => {
    const mismatched = { ...cautiousResult, voiceLevel: "sarcastic" };
    expect(selectWeatherSafetyPresentation({ engineResult: mismatched, lang: "en" })).toEqual({ show: false });
  });

  it("a malformed severity or unknown mood is silence", () => {
    expect(selectWeatherSafetyPresentation({ engineResult: { ...cautiousResult, severity: 9 }, lang: "en" })).toEqual({ show: false });
    expect(selectWeatherSafetyPresentation({ engineResult: { ...cautiousResult, mood: "bogus" }, lang: "en" })).toEqual({ show: false });
  });

  it("getWeatherSafetyMessage picks the lowest message_id deterministically, regardless of array order", () => {
    const shuffled = [...weatherSafetyMessages].reverse();
    expect(getWeatherSafetyMessage({ condition: "heavy_rain", voiceLevel: "cautious", lang: "is", messages: shuffled })?.id).toBe("safety_heavy_rain");
  });
});

describe("sarcastic-only sharing tone check (#432)", () => {
  it("only a sarcastic, policy-consistent tone passes", () => {
    expect(evaluateWeatherVoiceToneEligibility({ voiceLevel: "sarcastic", condition: "good" })).toEqual({ eligible: true, reason: null });
    expect(evaluateWeatherVoiceToneEligibility({ voiceLevel: "cautious", condition: "heavy_rain" }).eligible).toBe(false);
    expect(evaluateWeatherVoiceToneEligibility({ voiceLevel: "serious", condition: "extreme_wind" }).eligible).toBe(false);
    expect(evaluateWeatherVoiceToneEligibility({ condition: "good" }).eligible).toBe(false);
  });
});

describe("active share catalogue after #420", () => {
  it("has one entry per ledger-active primary ID in each language, all sarcastic, with no retired, excluded, supplemental or safety ID", () => {
    const catalogue = buildWeatherVoiceShareCatalogue();
    expect(catalogue).toHaveLength(LEDGER_ACTIVE.length * 2);
    for (const entry of catalogue) {
      expect(RETIRED_JOKE_IDS.has(entry.voiceId)).toBe(false);
      expect(entry.voiceId.startsWith("safety_")).toBe(false);
      expect(EXPECTED_TONE[entry.condition]).toBe("sarcastic");
    }
  });
});

describe("released public artifacts are preserved on disk (#432)", () => {
  const SHARE_ROOT = path.join(process.cwd(), "public", "share", "tjaldur", "v1");

  it("all 32 retired language-specific HTML pages and 32 PNGs (16 IDs x 2 languages) still exist, untouched", () => {
    for (const lang of ["is", "en"]) {
      for (const id of RETIRED_EXPECTED) {
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${id}.html`)), `${lang}/${id}.html`).toBe(true);
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${id}.png`)), `${lang}/${id}.png`).toBe(true);
      }
    }
    expect(RETIRED_EXPECTED).toHaveLength(16);
  });

  it("the 22 retained pairs' pages and images still exist (the other released legacy files are not re-verified here)", () => {
    const retained = LEDGER_ACTIVE.filter((r) => r.status === "retained");
    expect(retained).toHaveLength(11);
    for (const row of retained) {
      for (const lang of ["is", "en"]) {
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${row.id}.html`)), `${lang}/${row.id}.html`).toBe(true);
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${row.id}.png`)), `${lang}/${row.id}.png`).toBe(true);
      }
    }
  });
});
