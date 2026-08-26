// src/lib/researchQuiz/timing.js
//
// Monotonic timing boundary for the within-ten-second comprehension metric.
// Uses performance.now() (monotonic, immune to system clock changes) rather
// than Date.now() deltas. The metric is DERIVED from this captured boundary
// — the stimulus is never hidden after ten seconds (approved prompt: "Derive
// the within-ten-second metric from the captured interpretation boundary
// rather than hiding the card after ten seconds").

export function monotonicNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

const MIN_DURATION_MS = 0;
const MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes — a generous bound against a stalled/abandoned tab

/**
 * Bounded, rounded duration in ms between two monotonicNow() readings.
 * Clamped so a suspended tab / clock anomaly can never produce a negative or
 * absurdly large value in the stored payload.
 */
export function boundedDurationMs(startMs, endMs) {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  const raw = endMs - startMs;
  return Math.max(MIN_DURATION_MS, Math.min(MAX_DURATION_MS, Math.round(raw)));
}
