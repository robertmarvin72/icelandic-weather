// Ticket 420 (#420) — the TEST-ONLY ledger is the reference. Runtime raw
// lists, the shared registry, the resolved library, the manifest and the
// on-disk artifacts are reconciled against it independently. Production code
// never imports the ledger (see src/test-fixtures/weatherVoiceLedger.js).
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { WEATHER_VOICE_LEDGER, WEATHER_VOICE_SAFETY_LEDGER } from "../test-fixtures/weatherVoiceLedger";
import { is as rawIs } from "../i18n/weatherVoice/is";
import { en as rawEn } from "../i18n/weatherVoice/en";
import { weatherSafetyMessages } from "../i18n/weatherVoice/safety";
import {
  getWeatherVoiceLibrary,
  getWeatherVoiceCommentMetadataById,
  validateWeatherVoiceLibrary,
  validateWeatherVoiceLanguageCompleteness,
  WEATHER_VOICE_KNOWN_IDS,
  RETIRED_JOKE_IDS,
} from "./weatherVoiceContent";
import { evaluateWeatherVoice } from "./weatherVoiceEngine";
import { buildWeatherVoiceShareCatalogue } from "./weatherVoiceShareCatalogue";
import { WEATHER_VOICE_SHARE_MANIFEST } from "./weatherVoiceShareManifest.generated";
import { validateWeatherSafetyMessages } from "./weatherVoiceSafety";

const byStatus = (s) => WEATHER_VOICE_LEDGER.filter((r) => r.status === s);
const ACTIVE = WEATHER_VOICE_LEDGER.filter((r) => r.status === "retained" || r.status === "new");
const ACTIVE_IDS = new Set(ACTIVE.map((r) => r.id));
const SHARE_ROOT = path.join(process.cwd(), "public", "share", "tjaldur", "v1");
const WEATHER_VOICE_SHARE_MANIFEST_KEYS = Object.keys(WEATHER_VOICE_SHARE_MANIFEST);

const NINE_INPUTS = [
  { tmax: 4, windMax: 17, rain: 5, code: 61 },
  { tmax: 10, windMax: 5, rain: 15, code: 63 },
  { tmax: 10, windMax: 12, rain: 0, code: 0 },
  { tmax: 2, windMax: 0, rain: 5, code: 61 },
  { tmax: 2, windMax: 0, rain: 0, code: 0 },
  { tmax: 10, windMax: 0, rain: 5, code: 61 },
  { tmax: 10, windMax: 8, rain: 0, code: 0 },
  { tmax: 16, windMax: 0, rain: 0, code: 0 },
  { tmax: 13, windMax: 0, rain: 0, code: 3 },
];

describe("ledger — status counts and canonical coverage (#420)", () => {
  it("every canonical ID appears exactly once, with one status", () => {
    const ids = WEATHER_VOICE_LEDGER.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(195);
  });

  it("status totals: retained + new is the primary active set; supplemental, retired, reserve and excluded are separate statuses", () => {
    const retained = byStatus("retained").length;
    const fresh = byStatus("new").length;
    expect(retained).toBe(11);
    expect(fresh).toBe(102);
    expect(ACTIVE).toHaveLength(retained + fresh);
    expect(ACTIVE).toHaveLength(113);
    expect(byStatus("active_supplemental")).toHaveLength(3);
    expect(byStatus("retired")).toHaveLength(16);
    expect(byStatus("reserve")).toHaveLength(0);
    expect(byStatus("excluded")).toHaveLength(63);
  });

  it("primary counts per condition are derived from the ledger ranges, with no cautious or serious primary entry", () => {
    const count = (c) => ACTIVE.filter((r) => r.condition === c).length;
    expect({ good: count("good"), excellent: count("excellent"), rain: count("rain"), cold: count("cold"), sun_wind: count("sun_wind") }).toEqual({
      good: 23,
      excellent: 22,
      rain: 23,
      cold: 23,
      sun_wind: 22,
    });
    for (const c of ["extreme_wind", "heavy_rain", "strong_wind", "cold_wet"]) expect(count(c)).toBe(0);
  });

  it("the 11 retained IDs are exactly the owner-listed set", () => {
    expect(byStatus("retained").map((r) => r.id).sort()).toEqual(
      ["good_01", "good_02", "good_03", "excellent_01", "excellent_03", "rain_01", "rain_02", "cold_01", "cold_03", "sun_wind_01", "sun_wind_02"].sort()
    );
  });

  it("the 22 restored reserves are primary active; the three ark lines are supplemental; the excluded set is unchanged", () => {
    const restored = ["cold_04", "cold_05", "cold_06", "cold_08", "cold_09", "cold_11", "cold_13", "cold_17", "cold_24", "excellent_19", "good_12", "rain_10", "rain_11", "rain_13", "rain_15", "rain_19", "sun_wind_05", "sun_wind_06", "sun_wind_08", "sun_wind_13", "sun_wind_21", "sun_wind_22"];
    for (const id of restored) expect(ACTIVE_IDS.has(id), id).toBe(true);
    expect(byStatus("active_supplemental").map((r) => r.id).sort()).toEqual(["rain_heavy_24", "rain_heavy_25", "rain_heavy_29"]);
    const excluded = byStatus("excluded").map((r) => r.id);
    expect(excluded.filter((id) => id.startsWith("cold_wet_"))).toHaveLength(20);
    expect(excluded.filter((id) => id.startsWith("wind_strong_"))).toHaveLength(20);
    expect(excluded.filter((id) => id.startsWith("rain_heavy_"))).toHaveLength(23);
    expect(excluded).toEqual(expect.arrayContaining(["rain_heavy_26", "rain_heavy_27", "rain_heavy_28"]));
  });
});

describe("ledger — text overrides and issue wording (#420)", () => {
  it("exactly three EN overrides, on the owner-named retained IDs, and nowhere else", () => {
    const overridden = WEATHER_VOICE_LEDGER.filter((r) => r.enOverride).map((r) => r.id).sort();
    expect(overridden).toEqual(["cold_01", "cold_03", "excellent_03"]);
    for (const row of WEATHER_VOICE_LEDGER.filter((r) => r.enOverride)) expect(row.en).not.toBe(row.issueEn);
    for (const row of ACTIVE.concat(byStatus("reserve"), byStatus("excluded")).filter((r) => !r.enOverride && r.issueEn)) {
      expect(row.en, row.id).toBe(row.issueEn);
    }
  });

  it("the owner-approved override wording is exact", () => {
    const byId = Object.fromEntries(WEATHER_VOICE_LEDGER.map((r) => [r.id, r]));
    expect(byId.cold_01.en).toBe("The sweater was right.");
    expect(byId.cold_03.en).toBe("The coffee cools out of sympathy.");
    expect(byId.excellent_03.en).toBe("All that's missing is the coffee.");
  });

  it("owner-confirmed unchanged lines keep their canonical IS and EN", () => {
    const byId = Object.fromEntries(WEATHER_VOICE_LEDGER.map((r) => [r.id, r]));
    expect(byId.sun_wind_04.is).toBe("Bjart og blásið.");
    expect(byId.sun_wind_04.en).toBe("Bright and breezy.");
    expect(byId.good_16.is).toBe("Þetta verður ekki mikið betra án þess að verða grunsamlegt.");
    expect(byId.good_16.en).toBe("Much better than this would be suspicious.");
    expect(byId.good_21.is).toBe("Allt í lagi. Þú vinnur.");
  });
});

describe("ledger — raw runtime lists reconcile with the ledger (#420)", () => {
  const rawIsIds = rawIs.map((e) => e.id);
  const rawEnIds = rawEn.map((e) => e.id);

  it("raw IS and raw EN contain exactly the ledger-active IDs: no missing, extra, or orphan entries", () => {
    expect(new Set(rawIsIds)).toEqual(ACTIVE_IDS);
    expect(new Set(rawEnIds)).toEqual(ACTIVE_IDS);
    expect(rawIsIds).toHaveLength(ACTIVE_IDS.size);
    expect(rawEnIds).toHaveLength(ACTIVE_IDS.size);
  });

  it("no duplicate IDs in either raw list", () => {
    expect(new Set(rawIsIds).size).toBe(rawIsIds.length);
    expect(new Set(rawEnIds).size).toBe(rawEnIds.length);
  });

  it("raw text matches the ledger text for every active ID, both languages", () => {
    const isById = Object.fromEntries(rawIs.map((e) => [e.id, e.text]));
    const enById = Object.fromEntries(rawEn.map((e) => [e.id, e.text]));
    for (const row of ACTIVE) {
      expect(isById[row.id], `is ${row.id}`).toBe(row.is);
      expect(enById[row.id], `en ${row.id}`).toBe(row.en);
    }
  });

  it("every ID is ASCII-shaped and no text is blank", () => {
    for (const e of [...rawIs, ...rawEn]) {
      expect(e.id).toMatch(/^[A-Za-z0-9_]+$/);
      expect(e.text.trim().length).toBeGreaterThan(0);
    }
  });

  it("no exact duplicate text within either language", () => {
    for (const list of [rawIs, rawEn]) {
      const texts = list.map((e) => e.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  it("the raw-list structural validator reports zero errors for both languages", () => {
    expect(validateWeatherVoiceLanguageCompleteness({ languages: { is: rawIs, en: rawEn } })).toEqual({ valid: true, errors: [] });
  });
});

describe("ledger — shared registry and resolved library reconcile (#420)", () => {
  it("the registry's known IDs are exactly the ledger-active IDs (no retired, reserved or excluded ID is known)", () => {
    expect(new Set(WEATHER_VOICE_KNOWN_IDS)).toEqual(ACTIVE_IDS);
  });

  it("every active ID has registry metadata matching the ledger: condition, sarcastic voice level, 7-day cooldown, no CTA, full severity range", () => {
    for (const row of ACTIVE) {
      const meta = getWeatherVoiceCommentMetadataById(row.id);
      expect(meta, row.id).not.toBeNull();
      expect(meta.condition).toBe(row.condition);
      expect(meta.voiceLevel).toBe("sarcastic");
      expect(meta.repeatCooldownDays).toBe(7);
      expect(meta.ctaType).toBeNull();
      expect(meta.severityMin).toBe(0);
      expect(meta.severityMax).toBe(3);
    }
  });

  it("the resolved IS and EN libraries contain exactly the ledger-active IDs with ledger text", () => {
    for (const lang of ["is", "en"]) {
      const lib = getWeatherVoiceLibrary(lang);
      expect(new Set(lib.map((e) => e.id))).toEqual(ACTIVE_IDS);
      const field = lang === "is" ? "is" : "en";
      const byId = Object.fromEntries(lib.map((e) => [e.id, e.text]));
      for (const row of ACTIVE) expect(byId[row.id]).toBe(row[field]);
    }
  });

  it("the resolved libraries pass the cross-language validator with the real engine pairs", () => {
    const canonicalPairs = new Set(NINE_INPUTS.map((i) => evaluateWeatherVoice(i)).map((r) => `${r.condition}|${r.mood}`));
    const result = validateWeatherVoiceLibrary({
      languages: { is: getWeatherVoiceLibrary("is"), en: getWeatherVoiceLibrary("en") },
      canonicalPairs,
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("retired IDs: the constant equals the ledger's retired set, none is active, known, or in a raw list", () => {
    expect([...RETIRED_JOKE_IDS].sort()).toEqual(byStatus("retired").map((r) => r.id).sort());
    expect(RETIRED_JOKE_IDS.size).toBe(16);
    for (const id of RETIRED_JOKE_IDS) {
      expect(WEATHER_VOICE_KNOWN_IDS.has(id)).toBe(false);
      expect(rawIs.some((e) => e.id === id)).toBe(false);
      expect(rawEn.some((e) => e.id === id)).toBe(false);
    }
  });

  it("excluded and supplemental IDs are absent from the primary registry, raw lists, resolved libraries, and catalogue", () => {
    const inactive = WEATHER_VOICE_LEDGER.filter((r) => r.status === "excluded" || r.status === "active_supplemental").map((r) => r.id);
    const catalogueIds = new Set(buildWeatherVoiceShareCatalogue().map((e) => e.voiceId));
    for (const id of inactive) {
      expect(WEATHER_VOICE_KNOWN_IDS.has(id), id).toBe(false);
      expect(rawIs.some((e) => e.id === id), id).toBe(false);
      expect(rawEn.some((e) => e.id === id), id).toBe(false);
      expect(catalogueIds.has(id), id).toBe(false);
    }
  });
});

describe("ledger — active share catalogue, manifest and artifacts (#420)", () => {
  it("the catalogue has one pair per primary active ID in both languages", () => {
    const pairs = buildWeatherVoiceShareCatalogue().map((e) => `${e.language}|${e.voiceId}`).sort();
    const expected = [];
    for (const row of ACTIVE) {
      expected.push(`is|${row.id}`, `en|${row.id}`);
    }
    expect(pairs).toEqual(expected.sort());
  });

  it("the generated manifest has exactly the active pairs, and nothing else", () => {
    const keys = Object.keys(WEATHER_VOICE_SHARE_MANIFEST).sort();
    const expected = [];
    for (const row of ACTIVE) expected.push(`is|${row.id}`, `en|${row.id}`);
    expect(keys).toEqual(expected.sort());
    expect(keys).toHaveLength(ACTIVE.length * 2);
  });

  it("the manifest text matches the ledger text for every active pair", () => {
    for (const row of ACTIVE) {
      expect(WEATHER_VOICE_SHARE_MANIFEST[`is|${row.id}`].text).toBe(row.is);
      expect(WEATHER_VOICE_SHARE_MANIFEST[`en|${row.id}`].text).toBe(row.en);
    }
  });

  it("every active pair has an HTML and a PNG on disk", () => {
    for (const row of ACTIVE) {
      for (const lang of ["is", "en"]) {
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${row.id}.html`)), `${lang}/${row.id}.html`).toBe(true);
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${row.id}.png`)), `${lang}/${row.id}.png`).toBe(true);
      }
    }
  });

  it("no excluded or supplemental ID has any generated page or image (retired legacy files are not touched)", () => {
    const inactive = WEATHER_VOICE_LEDGER.filter((r) => r.status === "excluded" || r.status === "active_supplemental").map((r) => r.id);
    for (const id of inactive) {
      for (const lang of ["is", "en"]) {
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${id}.html`)), `${lang}/${id}.html`).toBe(false);
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${id}.png`)), `${lang}/${id}.png`).toBe(false);
      }
    }
  });

  it("the 32 retired legacy pages and 32 PNGs for the 16 retired IDs still exist", () => {
    for (const row of byStatus("retired")) {
      for (const lang of ["is", "en"]) {
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${row.id}.html`)), `${lang}/${row.id}.html`).toBe(true);
        expect(fs.existsSync(path.join(SHARE_ROOT, lang, `${row.id}.png`)), `${lang}/${row.id}.png`).toBe(true);
      }
    }
  });
});

describe("ledger — safety counts kept separate (#420, #432)", () => {
  it("four bilingual safety messages, unchanged from the ledger, and valid", () => {
    expect(WEATHER_VOICE_SAFETY_LEDGER).toHaveLength(4);
    expect(weatherSafetyMessages).toHaveLength(4);
    for (const expected of WEATHER_VOICE_SAFETY_LEDGER) {
      const runtime = weatherSafetyMessages.find((m) => m.message_id === expected.message_id);
      expect(runtime).toBeDefined();
      expect(runtime.text_is).toBe(expected.text_is);
      expect(runtime.text_en).toBe(expected.text_en);
      expect(runtime.condition).toBe(expected.condition);
      expect(runtime.voice_level).toBe(expected.voice_level);
    }
    expect(validateWeatherSafetyMessages({ messages: weatherSafetyMessages })).toEqual({ valid: true, errors: [] });
  });

  it("zero cautious or serious entries in the primary ledger, registry, KNOWN_IDS, catalogue and manifest; exactly three supplemental entries, all heavy_rain", () => {
    for (const cond of ["extreme_wind", "heavy_rain", "strong_wind", "cold_wet"]) {
      expect(ACTIVE.filter((r) => r.condition === cond)).toHaveLength(0);
    }
    const supplemental = byStatus("active_supplemental");
    expect(supplemental).toHaveLength(3);
    expect(supplemental.every((r) => r.condition === "heavy_rain")).toBe(true);
    for (const r of supplemental) {
      expect(WEATHER_VOICE_KNOWN_IDS.has(r.id), r.id).toBe(false);
      expect(buildWeatherVoiceShareCatalogue().some((e) => e.voiceId === r.id), r.id).toBe(false);
      expect(WEATHER_VOICE_SHARE_MANIFEST_KEYS.some((k) => k.endsWith(`|${r.id}`)), r.id).toBe(false);
    }
  });
});
