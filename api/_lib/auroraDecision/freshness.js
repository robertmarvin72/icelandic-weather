// api/_lib/auroraDecision/freshness.js
//
// Aurora cache freshness classification and night selection. Reads only
// through the existing Ticket 1 cache boundary (readAuroraSnapshot) — never
// calls Vedur.is, never refreshes/overwrites the snapshot (approved prompt §5).

import { AURORA_FRESH_MAX_AGE_MINUTES, AURORA_STALE_MAX_AGE_MINUTES } from "./constants.js";

/**
 * Classifies the cache row's usability. `source_fetched_at` (the actual
 * Vedur.is fetch time) is the canonical age basis — never `updated_at` (DB
 * write time) — per approved prompt §5: "Do not present DB update time as
 * source forecast time."
 *
 * Boundary rule (inclusive): age <= FRESH_MAX -> "fresh";
 * FRESH_MAX < age <= STALE_MAX -> "stale"; age > STALE_MAX -> "unavailable".
 */
export function classifyAuroraCache(cacheRow, now) {
  if (!cacheRow || !cacheRow.snapshot || !Array.isArray(cacheRow.snapshot.nights) || !cacheRow.source_fetched_at) {
    return { state: "unavailable", reason: "missing", sourceFetchedAt: null, ageMinutes: null };
  }

  const fetchedMs = new Date(cacheRow.source_fetched_at).getTime();
  if (!Number.isFinite(fetchedMs)) {
    return { state: "unavailable", reason: "malformed", sourceFetchedAt: null, ageMinutes: null };
  }

  const sourceFetchedAt = new Date(fetchedMs).toISOString();
  const ageMinutes = Math.max(0, (now.getTime() - fetchedMs) / 60000);

  if (ageMinutes > AURORA_STALE_MAX_AGE_MINUTES) {
    return { state: "unavailable", reason: "too_old", sourceFetchedAt, ageMinutes };
  }
  if (ageMinutes > AURORA_FRESH_MAX_AGE_MINUTES) {
    return { state: "stale", sourceFetchedAt, ageMinutes };
  }
  return { state: "fresh", sourceFetchedAt, ageMinutes };
}

/**
 * Selects the night matching the requested evening from the snapshot.
 * Returns null (never fabricates) if no matching night exists.
 */
export function selectNightForEvening(nights, evening) {
  if (!Array.isArray(nights)) return null;
  return nights.find((n) => n?.eveningDate === evening) || null;
}
