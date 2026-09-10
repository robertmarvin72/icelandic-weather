// src/lib/weatherVoiceHistory.js
//
// Weather Voice (#406) Phase 2 — guarded, explicit-exposure comment
// history. Pre-edit audit (recorded in cc-report.md) ruled out three
// existing candidates before writing this small adapter:
//
// - src/hooks/useLocalStorageState.js: a React hook (useState init,
//   useEffect-on-[key,value] write, including mount). Its persistence is
//   tied to React state lifecycle, not confirmed display — automatic,
//   not explicit-after-shown — so it cannot satisfy "selection is not
//   exposure; record only after actual display" without smuggling a
//   confirmed-shown boolean through component state anyway. Not reused,
//   not modified, not coupled to.
// - src/lib/forecastCache.js / src/lib/attribution.js: both feature-
//   specific guarded localStorage helpers, structurally similar to this
//   one but for unrelated data (forecast payloads, UTM attribution). Per
//   the approved prompt, this is intentionally a THIRD independent small
//   guarded-storage implementation rather than a shared primitive —
//   extracting one now was explicitly out of scope.
//
// This module never reads a clock or storage at import time — only inside
// the factory's returned methods, with an explicit `now`/optional
// injected `storage`. Cross-tab conflict resolution is explicitly out of
// scope; persistence here is best-effort only (see STORAGE fallback
// below) and a concurrent write from another tab can be overwritten.
//
// Revision 2 (#406) — corrects two defects Ripley found in Round 1
// (docs/ai/tasks/ticket-406/result-review.md): (1) recordShown() accepted
// a malformed presentation for a known ID (see isValidActivePresentation
// below); (2) recordShown() as the first call on a fresh instance never
// hydrated from persistence, so writing one ID silently dropped every
// other already-persisted known ID (see the `hydrated` one-time-init flag
// in createWeatherVoiceHistory below). See cc-report.md's Revision 2
// section for the full reproduction and fix.

import { WEATHER_VOICE_KNOWN_IDS, getWeatherVoiceCommentMetadataById } from "./weatherVoiceContent";

export const WEATHER_VOICE_HISTORY_STORAGE_KEY = "weather_voice_history_v1";
export const WEATHER_VOICE_HISTORY_VERSION = 1;

function isFiniteTimestamp(n) {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

function isKnownId(id) {
  return typeof id === "string" && WEATHER_VOICE_KNOWN_IDS.has(id);
}

function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}

// Revision 2 (#406) — Ripley Round 1 found that recordShown validated only
// show/time/known-id, so an otherwise-malformed presentation for a known
// ID (missing condition/mood/severity/text, or a mismatched one) could
// still be persisted and consume that ID's cooldown. This now requires a
// genuinely well-formed active presentation, checked against the SAME
// per-ID metadata every language entry is built from
// (getWeatherVoiceCommentMetadataById) — never a duplicated condition/mood
// table or reconstructed Phase 1 threshold. Text is checked for
// non-blankness only, never for equality to a specific language's string:
// history is language-independent by design.
function isValidActivePresentation(presentation) {
  if (!presentation || presentation.show !== true) return false;

  const id = presentation.comment?.id;
  if (!isKnownId(id)) return false;

  const meta = getWeatherVoiceCommentMetadataById(id);
  if (!meta) return false; // defensive; isKnownId already guarantees a registered entry

  if (presentation.condition !== meta.condition) return false;
  if (presentation.mood !== meta.mood) return false;

  const severity = presentation.severity;
  if (!Number.isInteger(severity) || severity < meta.severityMin || severity > meta.severityMax) return false;

  if (!isNonEmptyString(presentation.comment?.text)) return false;

  const cta = presentation.ctaType ?? null;
  if (cta !== meta.ctaType) return false;

  return true;
}

// Guards the ACQUISITION of a storage object, not just getItem/setItem —
// some sandboxed/embedded contexts throw on merely reading
// `window.localStorage` (SecurityError), not only on using it.
function resolveStorage(injectedStorage) {
  if (injectedStorage) return injectedStorage;
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function safeRead(storage, key) {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(storage, key, value) {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Quota exceeded, read-only storage, private-mode restrictions, etc. —
    // best effort only; the in-memory fallback below still works for the
    // lifetime of this adapter instance.
  }
}

// Parses and sanitizes a raw persisted string into a `Map<id, epochMs>`,
// rejecting anything that doesn't match the expected shape. Known-ID
// records are preserved even when their cooldown has long since expired
// (expiry is a SELECTION-time concept, computed by weatherVoiceSelector.js
// from the returned timestamp — not something this module prunes), so
// least-recently-shown tie-breaking in the selector stays meaningful.
function parseStoredHistory(raw, now) {
  const out = new Map();
  if (typeof raw !== "string") return out;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return out;
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    parsed.version !== WEATHER_VOICE_HISTORY_VERSION ||
    !parsed.records ||
    typeof parsed.records !== "object" ||
    Array.isArray(parsed.records)
  ) {
    return out;
  }

  for (const [id, ts] of Object.entries(parsed.records)) {
    if (!isKnownId(id)) continue; // discard unknown IDs — bounds storage to canonical content
    if (!isFiniteTimestamp(ts)) continue; // reject non-finite/negative
    if (ts > now) continue; // reject future timestamps relative to the injected clock
    out.set(id, ts);
  }

  return out;
}

function serializeHistory(map) {
  const records = {};
  for (const [id, ts] of map) records[id] = ts;
  return JSON.stringify({ version: WEATHER_VOICE_HISTORY_VERSION, records });
}

/**
 * createWeatherVoiceHistory({ storage } = {}) -> {
 *   getHistory(now: number) -> Map<string, number>,
 *   recordShown(presentation, now: number) -> void,
 * }
 *
 * Factory, not a singleton — each instance owns its own best-effort
 * in-memory map (used whenever storage is unavailable/throws) for its
 * lifetime. `storage` may be injected (tests always inject a fake); when
 * omitted, `window.localStorage` is resolved lazily and guarded, never
 * required.
 *
 * Example:
 *   const history = createWeatherVoiceHistory(); // production: real localStorage when available
 *   const now = Date.now();
 *   const seen = history.getHistory(now); // Map<id, epochMs> to pass into selectWeatherVoiceComment
 *   // ... only after the selected comment is actually rendered:
 *   history.recordShown(presentation, Date.now());
 *
 * @param {{ storage?: { getItem: Function, setItem: Function } }} [opts]
 */
export function createWeatherVoiceHistory({ storage: injectedStorage } = {}) {
  const memory = new Map();
  // Revision 2 (#406) — Ripley Round 1 found that recordShown(), called as
  // the very first operation on a fresh instance, never merged persisted
  // state into `memory` at all (only getHistory() did), so serializing
  // that still-empty memory back out silently dropped every other
  // already-persisted known ID. `hydrated` makes the merge a one-time,
  // sequential per-instance initialization step shared by BOTH methods —
  // whichever is called first performs it — never a repeated re-sync
  // (explicitly not cross-tab synchronization; see file header).
  let hydrated = false;

  function ensureHydrated(now) {
    if (hydrated) return;
    hydrated = true; // attempt exactly once per instance, success or failure
    const storage = resolveStorage(injectedStorage);
    const raw = safeRead(storage, WEATHER_VOICE_HISTORY_STORAGE_KEY);
    if (raw == null) return;

    const persisted = parseStoredHistory(raw, now);
    for (const [id, ts] of persisted) {
      const existing = memory.get(id);
      if (existing == null || ts > existing) memory.set(id, ts);
    }
  }

  return {
    /**
     * getHistory(now) -> Map<string, number>
     * Read-only, sanitized snapshot ready to pass to
     * selectWeatherVoiceComment's `history` argument. A fresh defensive
     * copy every call — the caller can never mutate this instance's state.
     */
    getHistory(now) {
      if (isFiniteTimestamp(now)) ensureHydrated(now);
      return new Map(memory);
    },

    /**
     * recordShown(presentation, now) -> void
     * No-op — no memory change, no storage access at all — for `{show:false}`
     * or any presentation that isn't a genuinely well-formed active result
     * for a known ID (see isValidActivePresentation above). Only once a
     * presentation passes that check does this hydrate from persistence
     * (if this instance hasn't already, e.g. via a prior getHistory() call)
     * and then apply the existing idempotent-same-timestamp /
     * never-let-older-replace-newer upsert rule.
     */
    recordShown(presentation, now) {
      if (!isValidActivePresentation(presentation)) return;
      if (!isFiniteTimestamp(now)) return;

      ensureHydrated(now);

      const id = presentation.comment.id;
      const existing = memory.get(id);
      if (existing != null && now <= existing) return; // idempotent same-timestamp / reject older-than-existing

      memory.set(id, now);

      const storage = resolveStorage(injectedStorage);
      safeWrite(storage, WEATHER_VOICE_HISTORY_STORAGE_KEY, serializeHistory(memory));
    },
  };
}
