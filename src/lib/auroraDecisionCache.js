// src/lib/auroraDecisionCache.js
//
// Module-level (survives remounts, Strict Mode's deliberate double-invoke,
// and unrelated rerenders within the same page load) reuse cache for
// in-flight AND recently-resolved /api/aurora-decision requests, keyed by
// the normalized (evening, locationIds) identity from
// auroraCandidateRequest.js.
//
// A single mechanism handles both reuse cases: getOrCreate() returns the
// SAME promise for a given key whether it is still pending (in-flight
// reuse) or already resolved within TTL_MS (bounded recently-resolved
// reuse) — awaiting an already-settled promise resolves on the next
// microtask with no extra network work either way.

const TTL_MS = 5 * 60 * 1000; // 5 minutes — bounded, documented reuse lifetime

const entries = new Map(); // key -> { promise, createdAt }

export function getOrCreateAuroraDecision(key, createPromise) {
  const existing = entries.get(key);
  if (existing && Date.now() - existing.createdAt < TTL_MS) {
    return existing.promise;
  }

  const promise = createPromise();
  entries.set(key, { promise, createdAt: Date.now() });
  // A rejected fetch must not poison future attempts for this key.
  promise.catch(() => {
    if (entries.get(key)?.promise === promise) entries.delete(key);
  });
  return promise;
}

// Explicit retry bypasses reuse — the caller (useAuroraDecision) removes the
// entry first, so getOrCreateAuroraDecision's next call always issues a
// genuinely fresh request.
export function invalidateAuroraDecision(key) {
  entries.delete(key);
}

// Test-only reset — no production caller needs this.
export function clearAuroraDecisionCache() {
  entries.clear();
}
