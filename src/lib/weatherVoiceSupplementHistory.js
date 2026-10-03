// src/lib/weatherVoiceSupplementHistory.js
//
// Weather Voice heavy-rain supplement history (#420 approved prompt v3,
// Part B). A separate module with its own storage key and ID set, so the
// primary joke history in weatherVoiceHistory.js stays byte-unchanged. It keeps
// its own guarded storage helpers, the third independent implementation of
// that pattern in this codebase (see weatherVoiceHistory.js's header).
//
// Records only supplement IDs from the supplement registry, and only when
// exposure has actually happened (the hook calls recordShown from its
// exposure boundary). Storage failures are isolated: nothing here throws.

export const WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY = "weather_voice_supplement_history_v1";
const VERSION = 1;

function isFiniteTimestamp(n) {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

function resolveStorage(injected) {
  if (injected) return injected;
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * createWeatherVoiceSupplementHistory({ storage, knownIds }) -> { getHistory, recordShown }
 *
 * `knownIds` is the set of supplement IDs this instance accepts. Persisted
 * records for any other ID are discarded on hydration.
 */
export function createWeatherVoiceSupplementHistory({ storage: injected, knownIds = [] } = {}) {
  const known = new Set(knownIds);
  const memory = new Map();
  let hydrated = false;

  function ensureHydrated(now) {
    if (hydrated) return;
    hydrated = true;
    let raw = null;
    try {
      const storage = resolveStorage(injected);
      raw = storage ? storage.getItem(WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY) : null;
    } catch {
      raw = null;
    }
    if (typeof raw !== "string") return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!parsed || typeof parsed !== "object" || parsed.version !== VERSION || !parsed.records || typeof parsed.records !== "object") return;
    for (const [id, ts] of Object.entries(parsed.records)) {
      if (!known.has(id) || !isFiniteTimestamp(ts) || ts > now) continue;
      memory.set(id, ts);
    }
  }

  return {
    getHistory(now) {
      if (isFiniteTimestamp(now)) ensureHydrated(now);
      return new Map(memory);
    },

    recordShown(supplementId, now) {
      if (typeof supplementId !== "string" || !known.has(supplementId) || !isFiniteTimestamp(now)) return;
      ensureHydrated(now);
      const existing = memory.get(supplementId);
      if (existing != null && now <= existing) return;
      memory.set(supplementId, now);
      try {
        const storage = resolveStorage(injected);
        if (storage) {
          storage.setItem(
            WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY,
            JSON.stringify({ version: VERSION, records: Object.fromEntries(memory) })
          );
        }
      } catch {
        // Quota, read-only or blocked storage: the in-memory record still holds for this instance.
      }
    },
  };
}
