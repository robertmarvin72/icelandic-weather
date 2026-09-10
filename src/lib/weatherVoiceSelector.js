// src/lib/weatherVoiceSelector.js
//
// Weather Voice (#406) Phase 2 — pure comment selection. Reads only its
// arguments (engine result, an explicit already-language-resolved
// library, sanitized history, injected `now`, injected `rng`); never
// reads a clock, storage, or browser global itself, at import time or
// inside the function. Never mutates `library` or `history`.
//
// Selection is not exposure: this module performs no persistence — see
// weatherVoiceHistory.js's explicit recordWeatherVoiceShown-style API,
// which a future UI ticket calls only after the comment has actually been
// displayed.

import { WEATHER_VOICE_KNOWN_CONDITIONS, WEATHER_VOICE_KNOWN_MOODS } from "./weatherVoiceContent";

const MS_PER_DAY = 86400000;

function isActiveEngineResult(result) {
  if (!result || result.show !== true) return false;
  if (typeof result.condition !== "string" || !WEATHER_VOICE_KNOWN_CONDITIONS.has(result.condition)) return false;
  if (typeof result.mood !== "string" || !WEATHER_VOICE_KNOWN_MOODS.has(result.mood)) return false;
  if (!Number.isInteger(result.severity) || result.severity < 0 || result.severity > 3) return false;
  return true;
}

function isEligible(entry, condition, mood, severity) {
  return entry.condition === condition && entry.mood === mood && severity >= entry.severityMin && severity <= entry.severityMax;
}

function isAvailable(entry, history, now) {
  const shownAt = history instanceof Map ? history.get(entry.id) : undefined;
  if (shownAt == null) return true; // never recorded -> immediately eligible
  const cooldownMs = entry.repeatCooldownDays * MS_PER_DAY;
  return now - shownAt >= cooldownMs; // exactly-at-expiry counts as available; 0-day cooldown is always true
}

// `pool` must already be sorted by ID ascending — the deterministic
// fallback and the RNG-index mapping both depend on that fixed order.
function pickUniform(pool, rng) {
  let value;
  try {
    value = typeof rng === "function" ? rng() : NaN;
  } catch {
    value = NaN;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 1) {
    return pool[0]; // deterministic first-by-ID fallback — never throws, never indexes out of bounds
  }

  const index = Math.min(pool.length - 1, Math.floor(value * pool.length));
  return pool[index];
}

// Called only once every eligible entry is confirmed in cooldown. `pool`
// is sorted by ID ascending, so iterating in order and only replacing on a
// STRICTLY smaller timestamp naturally keeps the lexicographically
// smallest ID on ties, without a separate tie-break comparison.
function pickLeastRecentlyShown(pool, history) {
  let best = null;
  let bestShownAt = null;
  for (const entry of pool) {
    const shownAt = history instanceof Map ? history.get(entry.id) : undefined;
    const at = shownAt ?? -Infinity;
    if (best === null || at < bestShownAt) {
      best = entry;
      bestShownAt = at;
    }
  }
  return best;
}

/**
 * selectWeatherVoiceComment({ engineResult, library, history, now, rng })
 * -> import("./weatherVoiceTypes").WeatherVoicePresentation
 *
 * Pure. `library` is `getWeatherVoiceLibrary(lang)`'s return value for an
 * explicitly chosen language — `null`/empty means silence, with no
 * fallback to a different language. `history` is a `Map<id, epochMs>`
 * (weatherVoiceHistory.js's `getHistory()` shape); `now` is epoch ms;
 * `rng` is a zero-arg function returning a number (production callers may
 * pass `Math.random`).
 *
 * Example:
 *   const engineResult = evaluateWeatherVoice(row);
 *   const library = getWeatherVoiceLibrary("is");
 *   const history = historyAdapter.getHistory(Date.now());
 *   const presentation = selectWeatherVoiceComment({
 *     engineResult, library, history, now: Date.now(), rng: Math.random,
 *   });
 *   // ... only after presentation is actually rendered:
 *   if (presentation.show) historyAdapter.recordShown(presentation, Date.now());
 *
 * @param {{ engineResult: import("./weatherVoiceTypes").WeatherVoiceResult, library: import("./weatherVoiceTypes").WeatherVoiceCommentEntry[] | null, history: Map<string, number> | null | undefined, now: number, rng: () => number }} args
 * @returns {import("./weatherVoiceTypes").WeatherVoicePresentation}
 */
export function selectWeatherVoiceComment({ engineResult, library, history, now, rng }) {
  if (!isActiveEngineResult(engineResult)) return Object.freeze({ show: false });

  const { condition, mood, severity } = engineResult;

  if (!Array.isArray(library) || library.length === 0) return Object.freeze({ show: false });

  const eligible = library.filter((entry) => isEligible(entry, condition, mood, severity));
  if (eligible.length === 0) return Object.freeze({ show: false });

  const sortedEligible = [...eligible].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const available = sortedEligible.filter((entry) => isAvailable(entry, history, now));

  const chosen = available.length > 0 ? pickUniform(available, rng) : pickLeastRecentlyShown(sortedEligible, history);

  return Object.freeze({
    show: true,
    condition,
    mood,
    severity,
    comment: Object.freeze({ id: chosen.id, text: chosen.text }),
    ctaType: chosen.ctaType ?? null,
  });
}
