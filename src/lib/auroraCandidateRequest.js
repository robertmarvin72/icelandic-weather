// src/lib/auroraCandidateRequest.js
//
// Deterministic normalization of the canonical location-ID set into the
// audited order used both for the request body and for the cache/reuse
// identity key (approved prompt §3: "normalizes IDs into the audited
// deterministic canonical order before request-body/key creation").

export function normalizeLocationIds(locationIds) {
  return [...new Set(locationIds)].sort();
}

// Stable identity for (evening, locationIds) — same context always produces
// the same key, regardless of caller-supplied array order/duplicates.
export function buildAuroraRequestKey(evening, locationIds) {
  return `${evening}|${normalizeLocationIds(locationIds).join(",")}`;
}
