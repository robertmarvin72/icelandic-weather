// src/lib/weatherVoiceContent.js
//
// Weather Voice (#406) Phase 2 — comment library assembly, language
// lookup, and (test-only-invoked) content validation. Combines each
// language's `{id, text}` list (src/i18n/weatherVoice/is.js, en.js) with a
// single shared metadata registry keyed by `id` — condition/mood/severity
// range/cooldown/CTA are authored exactly once per ID here, never
// duplicated per language, so the "equal metadata across languages for a
// shared ID" requirement holds by construction for real content. The
// validator below still compares metadata across languages generically
// (not merely assuming the shared-registry shape), so the rule itself is
// genuinely enforced and testable with synthetic fixtures.
//
// This module never imports/spreads into src/i18n/translations.js and is
// never resolved through useT() — see is.js's header comment for why.
// evaluateWeatherVoice() (src/lib/weatherVoiceEngine.js) is untouched by
// this ticket; nothing here reconstructs its thresholds or classification.

import { is as isEntries } from "../i18n/weatherVoice/is";
import { en as enEntries } from "../i18n/weatherVoice/en";

// Mirrors the exact string vocabulary declared in weatherVoiceTypes.js's
// WeatherVoiceCondition/TjaldurMood JSDoc typedefs. Phase 1 deliberately
// has no runtime export of these strings (JSDoc typedefs only), so this
// content layer necessarily keeps its own copy of the VOCABULARY (which
// strings are valid at all) — this is not "another condition/mood mapping
// into the engine": it never claims which condition maps to which mood,
// only that a given string is drawn from the known sets. The actual
// condition->mood PAIRING is verified elsewhere, from real engine output
// (see weatherVoiceContent.test.js), and injected into validateWeatherVoiceLibrary
// as `canonicalPairs` rather than hardcoded here.
export const WEATHER_VOICE_KNOWN_CONDITIONS = Object.freeze(
  new Set(["extreme_wind", "heavy_rain", "strong_wind", "cold_wet", "cold", "rain", "sun_wind", "excellent", "good"])
);

export const WEATHER_VOICE_KNOWN_MOODS = Object.freeze(
  new Set([
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
  ])
);

export const WEATHER_VOICE_CTA_TYPES = Object.freeze(
  new Set(["better_location", "calmer_location", "drier_location", "warmer_location", "best_locations"])
);

const DEFAULT_SEVERITY_MIN = 0;
const DEFAULT_SEVERITY_MAX = 3;
const DEFAULT_COOLDOWN_DAYS = 7;
const DEFAULT_CTA_TYPE = null;

// Shared metadata registry — the single source of truth for every MVP
// entry's condition/mood/severity-range/cooldown/CTA. All 27 MVP entries
// use every default (severity range 0-3 omitted, 7-day cooldown, no CTA),
// per the approved prompt's copy table.
const WEATHER_VOICE_COMMENT_METADATA = Object.freeze({
  wind_extreme_01: { condition: "extreme_wind", mood: "wrecked" },
  wind_extreme_02: { condition: "extreme_wind", mood: "wrecked" },
  wind_extreme_03: { condition: "extreme_wind", mood: "wrecked" },
  wind_extreme_04: { condition: "extreme_wind", mood: "wrecked" },
  wind_extreme_05: { condition: "extreme_wind", mood: "wrecked" },
  wind_strong_01: { condition: "strong_wind", mood: "struggling" },
  wind_strong_02: { condition: "strong_wind", mood: "struggling" },
  wind_strong_03: { condition: "strong_wind", mood: "struggling" },
  rain_heavy_01: { condition: "heavy_rain", mood: "sad" },
  rain_heavy_02: { condition: "heavy_rain", mood: "sad" },
  rain_heavy_03: { condition: "heavy_rain", mood: "sad" },
  cold_wet_01: { condition: "cold_wet", mood: "unimpressed" },
  cold_wet_02: { condition: "cold_wet", mood: "unimpressed" },
  cold_wet_03: { condition: "cold_wet", mood: "unimpressed" },
  cold_01: { condition: "cold", mood: "freezing" },
  cold_02: { condition: "cold", mood: "freezing" },
  cold_03: { condition: "cold", mood: "freezing" },
  rain_01: { condition: "rain", mood: "unimpressed" },
  rain_02: { condition: "rain", mood: "unimpressed" },
  sun_wind_01: { condition: "sun_wind", mood: "suspicious" },
  sun_wind_02: { condition: "sun_wind", mood: "suspicious" },
  excellent_01: { condition: "excellent", mood: "excellent" },
  excellent_02: { condition: "excellent", mood: "excellent" },
  excellent_03: { condition: "excellent", mood: "excellent" },
  good_01: { condition: "good", mood: "happy" },
  good_02: { condition: "good", mood: "happy" },
  good_03: { condition: "good", mood: "happy" },
});

export const WEATHER_VOICE_KNOWN_IDS = Object.freeze(new Set(Object.keys(WEATHER_VOICE_COMMENT_METADATA)));

function normalizeMetadata(meta) {
  return {
    condition: meta.condition,
    mood: meta.mood,
    severityMin: meta.severityMin ?? DEFAULT_SEVERITY_MIN,
    severityMax: meta.severityMax ?? DEFAULT_SEVERITY_MAX,
    repeatCooldownDays: meta.repeatCooldownDays ?? DEFAULT_COOLDOWN_DAYS,
    ctaType: meta.ctaType ?? DEFAULT_CTA_TYPE,
  };
}

const LANGUAGE_TEXT_ENTRIES = { is: isEntries, en: enEntries };

/**
 * getWeatherVoiceLibrary(lang) -> WeatherVoiceCommentEntry[] | null
 *
 * Pure. `lang` must be exactly "is" or "en"; any other value (including
 * missing/unsupported languages) returns `null` — never a silent fallback
 * to Icelandic. `"en"` is a genuine, supported, currently-empty array, a
 * different outcome from `null`.
 *
 * @param {string} lang
 * @returns {import("./weatherVoiceTypes").WeatherVoiceCommentEntry[] | null}
 */
export function getWeatherVoiceLibrary(lang) {
  const textEntries = LANGUAGE_TEXT_ENTRIES[lang];
  if (!Array.isArray(textEntries)) return null;

  const out = [];
  for (const { id, text } of textEntries) {
    const meta = WEATHER_VOICE_COMMENT_METADATA[id];
    if (!meta) continue; // defensive: content without registered metadata is never surfaced
    out.push({ id, text, ...normalizeMetadata(meta) });
  }
  return out;
}

/**
 * getWeatherVoiceCommentMetadataById(id) -> WeatherVoiceCommentMetadata | null
 *
 * Pure, read-only, language-independent lookup — Revision 2 (#406): added
 * so weatherVoiceHistory.js can validate a shown presentation's
 * condition/mood/severity-range/CTA against the SAME single metadata
 * registry every language entry is built from, rather than duplicating a
 * second condition/mood table or reconstructing Phase 1 thresholds.
 * Returns `null` for any id not in the canonical registry.
 *
 * @param {string} id
 * @returns {import("./weatherVoiceTypes").WeatherVoiceCommentMetadata | null}
 */
export function getWeatherVoiceCommentMetadataById(id) {
  if (typeof id !== "string") return null;
  const meta = WEATHER_VOICE_COMMENT_METADATA[id];
  if (!meta) return null;
  return normalizeMetadata(meta);
}

function isNonEmptyAsciiId(id) {
  return typeof id === "string" && /^[A-Za-z0-9_]+$/.test(id);
}

function pairKey(condition, mood) {
  return `${condition}|${mood}`;
}

/**
 * validateWeatherVoiceLibrary({ languages, canonicalPairs }) -> { valid, errors }
 *
 * Pure, generic validator — test/build-tooling use only (approved prompt:
 * "should run in tests/build tooling, not repeatedly scan all content in
 * production render paths"). `languages` is `{ [lang]: WeatherVoiceCommentEntry[] }`
 * (real output of getWeatherVoiceLibrary(), or a synthetic fixture built
 * the same shape for negative tests). `canonicalPairs` is an optional
 * `Set<"condition|mood">` of pairs actually reachable from real Phase 1
 * engine output — inject it from real evaluateWeatherVoice() fixtures in
 * the caller/test; this module never hardcodes its own copy of that
 * pairing (it would risk drifting from the engine's real behavior).
 *
 * @param {{ languages: Record<string, import("./weatherVoiceTypes").WeatherVoiceCommentEntry[]>, canonicalPairs?: Set<string> }} args
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateWeatherVoiceLibrary({ languages, canonicalPairs } = {}) {
  const errors = [];
  const occurrencesById = new Map();

  for (const [lang, entries] of Object.entries(languages || {})) {
    if (!Array.isArray(entries)) {
      errors.push(`${lang}: entries must be an array`);
      continue;
    }

    const seenInLanguage = new Set();

    for (const entry of entries) {
      const id = entry?.id;

      if (!isNonEmptyAsciiId(id)) {
        errors.push(`${lang}: invalid id ${JSON.stringify(id)}`);
        continue;
      }
      if (seenInLanguage.has(id)) {
        errors.push(`${lang}: duplicate id within language: ${id}`);
      }
      seenInLanguage.add(id);

      if (!WEATHER_VOICE_KNOWN_CONDITIONS.has(entry.condition)) {
        errors.push(`${lang}/${id}: unsupported condition ${JSON.stringify(entry.condition)}`);
      }
      if (!WEATHER_VOICE_KNOWN_MOODS.has(entry.mood)) {
        errors.push(`${lang}/${id}: unsupported mood ${JSON.stringify(entry.mood)}`);
      }
      if (
        canonicalPairs &&
        WEATHER_VOICE_KNOWN_CONDITIONS.has(entry.condition) &&
        WEATHER_VOICE_KNOWN_MOODS.has(entry.mood) &&
        !canonicalPairs.has(pairKey(entry.condition, entry.mood))
      ) {
        errors.push(`${lang}/${id}: condition/mood pair ${entry.condition}/${entry.mood} is not a canonical Phase 1 pairing`);
      }

      if (typeof entry.text !== "string" || entry.text.trim().length === 0) {
        errors.push(`${lang}/${id}: text must be a nonempty, non-whitespace-only string`);
      }

      const { severityMin, severityMax } = entry;
      if (
        !Number.isInteger(severityMin) ||
        !Number.isInteger(severityMax) ||
        severityMin < 0 ||
        severityMax > 3 ||
        severityMin > severityMax
      ) {
        errors.push(`${lang}/${id}: invalid severity range [${severityMin}, ${severityMax}]`);
      }

      if (!Number.isFinite(entry.repeatCooldownDays) || entry.repeatCooldownDays < 0) {
        errors.push(`${lang}/${id}: invalid repeatCooldownDays ${JSON.stringify(entry.repeatCooldownDays)}`);
      }

      if (entry.ctaType !== null && entry.ctaType !== undefined && !WEATHER_VOICE_CTA_TYPES.has(entry.ctaType)) {
        errors.push(`${lang}/${id}: invalid ctaType ${JSON.stringify(entry.ctaType)}`);
      }

      if (!occurrencesById.has(id)) occurrencesById.set(id, []);
      occurrencesById.get(id).push({ lang, entry });
    }
  }

  for (const [id, occurrences] of occurrencesById) {
    if (occurrences.length < 2) continue;
    const [first, ...rest] = occurrences;
    for (const { lang, entry } of rest) {
      const same =
        entry.condition === first.entry.condition &&
        entry.mood === first.entry.mood &&
        entry.severityMin === first.entry.severityMin &&
        entry.severityMax === first.entry.severityMax &&
        entry.repeatCooldownDays === first.entry.repeatCooldownDays &&
        entry.ctaType === first.entry.ctaType;
      if (!same) {
        errors.push(`${id}: metadata mismatch between languages "${first.lang}" and "${lang}" (text may differ, metadata must not)`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
