// src/lib/weatherVoiceSupplement.js
//
// Weather Voice heavy-rain supplement selection (#420 approved prompt v3,
// Part B). Pure: no storage, no clock, no globals. The hook supplies the
// registry, the supplement history, `now` and `rng`, and calls this inside
// its own try/catch so that no failure here can reach the primary warning.
//
// Eligibility is derived, not assumed: a heavy_rain cautious engine result,
// with a visible primary `safety_heavy_rain` presentation, in is or en.
// Primary selection (weatherVoiceSelector.js) never reads this module.

import { pickUniform, pickLeastRecentlyShown, isAvailable } from "./weatherVoiceSelector";
import { WEATHER_VOICE_KNOWN_IDS, RETIRED_JOKE_IDS } from "./weatherVoiceContent";
import { weatherSafetyMessages } from "../i18n/weatherVoice/safety";
import { weatherVoiceSupplements as defaultRegistry } from "../i18n/weatherVoice/supplement";

const PARENT_VOICE_ID = "safety_heavy_rain";
const SUPPLEMENT_ID_PATTERN = /^[A-Za-z0-9_]+$/;
const TEXT_FIELD_BY_LANGUAGE = Object.freeze({ is: "text_is", en: "text_en" });
const NONE = Object.freeze({ show: false });

function isNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * validateWeatherVoiceSupplements(entries) -> { valid: Entry[], errors: string[] }
 *
 * Keeps only well-formed supplement entries. A duplicated ID is dropped
 * entirely, since its identity is ambiguous. An ID that collides with a
 * primary joke, a retired joke, or a safety message is rejected.
 */
export function validateWeatherVoiceSupplements(entries) {
  const errors = [];
  if (!Array.isArray(entries)) return { valid: [], errors: ["registry must be an array"] };

  const safetyIds = new Set(weatherSafetyMessages.map((m) => m.message_id));
  const counts = new Map();
  for (const entry of entries) {
    if (typeof entry?.id === "string") counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
  }

  const valid = [];
  for (const entry of entries) {
    const id = entry?.id;
    if (typeof id !== "string" || !SUPPLEMENT_ID_PATTERN.test(id)) {
      errors.push(`invalid id ${JSON.stringify(id)}`);
      continue;
    }
    if ((counts.get(id) ?? 0) > 1) {
      errors.push(`${id}: duplicate id dropped`);
      continue;
    }
    if (WEATHER_VOICE_KNOWN_IDS.has(id)) errors.push(`${id}: collides with a primary joke id`);
    else if (RETIRED_JOKE_IDS.has(id)) errors.push(`${id}: collides with a retired joke id`);
    else if (safetyIds.has(id)) errors.push(`${id}: collides with a safety message id`);
    else if (entry.condition !== "heavy_rain") errors.push(`${id}: supplement condition must be heavy_rain`);
    else if (!isNonEmptyText(entry.text_is)) errors.push(`${id}: text_is is missing or blank`);
    else if (!isNonEmptyText(entry.text_en)) errors.push(`${id}: text_en is missing or blank`);
    else if (!Number.isFinite(entry.repeatCooldownDays) || entry.repeatCooldownDays < 0) {
      errors.push(`${id}: invalid repeatCooldownDays`);
    } else {
      valid.push(entry);
      continue;
    }
  }
  return { valid, errors };
}

function isEligible({ engineResult, presentation, lang }) {
  if (lang !== "is" && lang !== "en") return false;
  if (engineResult?.show !== true) return false;
  if (engineResult.condition !== "heavy_rain" || engineResult.voiceLevel !== "cautious") return false;
  if (presentation?.show !== true) return false;
  if (presentation.comment?.id !== PARENT_VOICE_ID) return false;
  if (presentation.condition !== "heavy_rain" || presentation.voiceLevel !== "cautious") return false;
  if (!isNonEmptyText(presentation.comment?.text)) return false;
  const parent = weatherSafetyMessages.find((m) => m.message_id === PARENT_VOICE_ID);
  return !!parent && isNonEmptyText(parent[TEXT_FIELD_BY_LANGUAGE[lang]]);
}

/**
 * selectWeatherVoiceSupplement({ engineResult, presentation, lang, registry, history, now, rng })
 * -> { show: false } | { show: true, supplementId, parentVoiceId, condition, text }
 *
 * Uses the same 7-day cooldown rules as the primary pool (isAvailable), a
 * uniform choice among available sorted IDs (pickUniform, which falls back
 * deterministically on a throwing or invalid rng), and the least-recently-shown
 * fallback (pickLeastRecentlyShown) when every entry is in cooldown.
 */
export function selectWeatherVoiceSupplement({ engineResult, presentation, lang, registry = defaultRegistry, history, now, rng } = {}) {
  if (!isEligible({ engineResult, presentation, lang })) return NONE;

  const field = TEXT_FIELD_BY_LANGUAGE[lang];
  const { valid } = validateWeatherVoiceSupplements(registry);
  const pool = valid.filter((e) => isNonEmptyText(e[field])).sort(byId);
  if (pool.length === 0) return NONE;

  const available = pool.filter((entry) => isAvailable(entry, history, now));
  const chosen = available.length > 0 ? pickUniform(available, rng) : pickLeastRecentlyShown(pool, history);
  return Object.freeze({
    show: true,
    supplementId: chosen.id,
    parentVoiceId: PARENT_VOICE_ID,
    condition: "heavy_rain",
    text: chosen[field],
  });
}
