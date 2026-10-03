// src/lib/weatherVoiceSafety.js
//
// Weather Voice (#432) — deterministic selection from the cautious/serious
// safety library (src/i18n/weatherVoice/safety.js). Pure: no RNG, no
// cooldown, no history, no clock. The same engine result and language always
// yield the same message, and a joke can never be returned from here.
//
// Every failure (unsupported locale, empty or malformed pool, missing
// language text, wrong voice level for the condition, invalid engine result)
// yields silence, never a personality-joke fallback.

import { weatherSafetyMessages as defaultMessages } from "../i18n/weatherVoice/safety";
import { voiceLevelForCondition } from "./weatherVoiceRules";
import { WEATHER_VOICE_KNOWN_CONDITIONS, WEATHER_VOICE_KNOWN_MOODS, WEATHER_VOICE_KNOWN_IDS, RETIRED_JOKE_IDS } from "./weatherVoiceContent";

const SAFETY_ID_PATTERN = /^[A-Za-z0-9_]+$/;
const TEXT_FIELD_BY_LANGUAGE = Object.freeze({ is: "text_is", en: "text_en" });
const SILENT = Object.freeze({ show: false });

function isNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafetyTone(voiceLevel) {
  return voiceLevel === "cautious" || voiceLevel === "serious";
}

function isUsableMessage(message) {
  return (
    !!message &&
    typeof message.message_id === "string" &&
    SAFETY_ID_PATTERN.test(message.message_id) &&
    !WEATHER_VOICE_KNOWN_IDS.has(message.message_id) &&
    !RETIRED_JOKE_IDS.has(message.message_id) &&
    WEATHER_VOICE_KNOWN_CONDITIONS.has(message.condition) &&
    isSafetyTone(message.voice_level) &&
    voiceLevelForCondition(message.condition) === message.voice_level
  );
}

/**
 * getWeatherSafetyMessage({ condition, voiceLevel, lang, messages }) -> { id, text } | null
 *
 * Lowest message_id wins when several usable messages match, so the choice
 * never depends on array order, RNG, or history.
 */
export function getWeatherSafetyMessage({ condition, voiceLevel, lang, messages = defaultMessages } = {}) {
  const textField = TEXT_FIELD_BY_LANGUAGE[lang];
  if (!textField || !Array.isArray(messages)) return null;

  const candidates = messages.filter(
    (message) =>
      isUsableMessage(message) &&
      message.condition === condition &&
      message.voice_level === voiceLevel &&
      isNonEmptyText(message[textField])
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => (a.message_id < b.message_id ? -1 : a.message_id > b.message_id ? 1 : 0));
  const [chosen] = candidates;
  return { id: chosen.message_id, text: chosen[textField] };
}

/**
 * selectWeatherSafetyPresentation({ engineResult, lang, messages })
 * -> WeatherVoicePresentation (same shape as a joke presentation)
 *
 * Tone comes only from the engine result's voiceLevel, checked against the
 * condition policy. Mood, severity and selected text never determine it.
 */
export function selectWeatherSafetyPresentation({ engineResult, lang, messages } = {}) {
  if (!engineResult || engineResult.show !== true) return SILENT;

  const { condition, mood, severity, voiceLevel } = engineResult;
  if (!WEATHER_VOICE_KNOWN_CONDITIONS.has(condition) || !WEATHER_VOICE_KNOWN_MOODS.has(mood)) return SILENT;
  if (!Number.isInteger(severity) || severity < 0 || severity > 3) return SILENT;
  if (!isSafetyTone(voiceLevel) || voiceLevelForCondition(condition) !== voiceLevel) return SILENT;

  const message = getWeatherSafetyMessage({ condition, voiceLevel, lang, messages });
  if (!message) return SILENT;

  return Object.freeze({
    show: true,
    condition,
    mood,
    severity,
    voiceLevel,
    comment: Object.freeze({ id: message.id, text: message.text }),
    ctaType: null,
  });
}

/**
 * validateWeatherSafetyMessages({ messages }) -> { valid, errors }
 *
 * Test/build-tooling only. Checks ID shape, collisions with active and
 * retired joke IDs, condition/voice-level policy, and non-blank text in both
 * languages.
 */
export function validateWeatherSafetyMessages({ messages = defaultMessages } = {}) {
  const errors = [];
  const seen = new Set();

  if (!Array.isArray(messages)) return { valid: false, errors: ["messages must be an array"] };

  for (const message of messages) {
    const id = message?.message_id;
    if (typeof id !== "string" || !SAFETY_ID_PATTERN.test(id)) {
      errors.push(`invalid message_id ${JSON.stringify(id)}`);
      continue;
    }
    if (seen.has(id)) errors.push(`duplicate message_id ${id}`);
    seen.add(id);

    if (WEATHER_VOICE_KNOWN_IDS.has(id)) errors.push(`${id}: collides with an active joke id`);
    if (RETIRED_JOKE_IDS.has(id)) errors.push(`${id}: collides with a retired joke id`);
    if (!WEATHER_VOICE_KNOWN_CONDITIONS.has(message.condition)) errors.push(`${id}: unsupported condition ${JSON.stringify(message.condition)}`);
    if (!isSafetyTone(message.voice_level)) errors.push(`${id}: voice_level must be cautious or serious, got ${JSON.stringify(message.voice_level)}`);
    else if (voiceLevelForCondition(message.condition) !== message.voice_level) {
      errors.push(`${id}: voice_level ${message.voice_level} does not match condition ${message.condition}`);
    }
    if (!isNonEmptyText(message.text_is)) errors.push(`${id}: text_is is missing or blank`);
    if (!isNonEmptyText(message.text_en)) errors.push(`${id}: text_en is missing or blank`);
    if (message.ctaType !== undefined && message.ctaType !== null) errors.push(`${id}: ctaType must be null`);
  }

  return { valid: errors.length === 0, errors };
}
