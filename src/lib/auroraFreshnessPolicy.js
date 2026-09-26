// src/lib/auroraFreshnessPolicy.js
//
// Ticket #423 Phase 2 Round 5 — client-side mirror of the server's Aurora
// freshness policy (api/_lib/auroraDecision/freshness.js's classifyAuroraCache
// + constants.js), so a result that was fresh when fetched is never
// presented as fresh (or used in a comparison) after the browser has stayed
// open past the same inclusive boundaries. The server module is deliberately
// NOT imported here (it lives under api/ next to DB code); a parity test
// (auroraFreshnessPolicy.test.js) pins these constants and this function to
// the server's own so they cannot silently diverge.
//
// Boundary rule (inclusive, identical to the server): age <= FRESH_MAX ->
// "fresh"; FRESH_MAX < age <= STALE_MAX -> "stale"; age > STALE_MAX or a
// missing/malformed timestamp -> "unavailable". Never mutates the response.

export const AURORA_CLIENT_FRESH_MAX_AGE_MINUTES = 480;
export const AURORA_CLIENT_STALE_MAX_AGE_MINUTES = 1440;

const MINUTE_MS = 60000;

export function classifyAuroraAge(sourceFetchedAt, nowMs) {
  const fetchedMs = typeof sourceFetchedAt === "string" ? Date.parse(sourceFetchedAt) : NaN;
  if (!Number.isFinite(fetchedMs)) return { state: "unavailable", reason: "malformed", ageMinutes: null };

  const ageMinutes = Math.max(0, (nowMs - fetchedMs) / MINUTE_MS);
  if (ageMinutes > AURORA_CLIENT_STALE_MAX_AGE_MINUTES) return { state: "unavailable", reason: "too_old", ageMinutes };
  if (ageMinutes > AURORA_CLIENT_FRESH_MAX_AGE_MINUTES) return { state: "stale", ageMinutes };
  return { state: "fresh", ageMinutes };
}

/**
 * Re-derives a usable (success/partial) classification's freshness from its
 * actual current age. Fresh/stale keep the response body intact (only the
 * presentation `freshness` is corrected); expired or untimestamped results
 * become an explicit `expired` domain_unavailable so they can never reach
 * ranking, the map, or a cross-night comparison until refreshed via the
 * existing retry. Non-result classifications are returned unchanged.
 */
export function applyClientFreshness(classification, nowMs) {
  const primary = classification?.primary;
  if (primary !== "success" && primary !== "partial") return classification;

  const sourceFetchedAt = classification.body?.auroraCache?.sourceFetchedAt ?? null;
  const age = classifyAuroraAge(sourceFetchedAt, nowMs);

  if (age.state === "unavailable") {
    return { primary: "domain_unavailable", freshness: "unavailable", body: null, expired: true, expiredReason: age.reason, sourceFetchedAt };
  }
  return { ...classification, freshness: age.state };
}

/** Absolute ms timestamps (> nowMs) at which a result's freshness state next changes. */
export function nextFreshnessBoundaries(sourceFetchedAt, nowMs) {
  const fetchedMs = typeof sourceFetchedAt === "string" ? Date.parse(sourceFetchedAt) : NaN;
  if (!Number.isFinite(fetchedMs)) return [];
  return [AURORA_CLIENT_FRESH_MAX_AGE_MINUTES, AURORA_CLIENT_STALE_MAX_AGE_MINUTES]
    .map((minutes) => fetchedMs + minutes * MINUTE_MS + 1) // strictly beyond the inclusive boundary
    .filter((boundary) => boundary > nowMs);
}
