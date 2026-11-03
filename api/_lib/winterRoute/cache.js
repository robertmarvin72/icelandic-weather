// api/_lib/winterRoute/cache.js
//
// Ticket #486, S3 — two fixed module-memory cache entries (road, forecast),
// each with a fixed TTL and a bounded "last known good" fallback window
// when a fresh fetch fails. Deliberately NOT a distributed/shared cache:
// this lives in one warm serverless function instance's memory only. A
// cold start starts with nothing cached — see winter-route.js's own
// doc-comment for what that means in production. All query parameters are
// ignored by the route handler itself (not by this module) — there is
// nothing parameter-dependent to key on here, by design (S3a).

export const ROAD_TTL_MS = 5 * 60 * 1000;
export const FORECAST_TTL_MS = 15 * 60 * 1000;
export const ROAD_MAX_STALE_MS = 30 * 60 * 1000;
export const FORECAST_MAX_STALE_MS = 60 * 60 * 1000;

const buckets = {
  road: { entry: null, inflight: null },
  forecast: { entry: null, inflight: null },
};

async function getOrFetch(bucketName, ttlMs, maxStaleMs, fetcher, nowFn) {
  const bucket = buckets[bucketName];
  const now = nowFn();

  if (bucket.entry && now - bucket.entry.fetchedAt < ttlMs) {
    return { ...bucket.entry.value, stale: false, cacheAgeMs: now - bucket.entry.fetchedAt };
  }

  // Single-flight: concurrent callers past TTL expiry share one upstream
  // fetch instead of each issuing their own (S3b).
  if (bucket.inflight) return bucket.inflight;

  const promise = (async () => {
    try {
      const result = await fetcher();
      const fetchedAt = nowFn();

      if (result.ok) {
        bucket.entry = { value: result, fetchedAt };
        return { ...result, stale: false, cacheAgeMs: 0 };
      }

      if (bucket.entry && fetchedAt - bucket.entry.fetchedAt <= maxStaleMs) {
        return { ...bucket.entry.value, stale: true, cacheAgeMs: fetchedAt - bucket.entry.fetchedAt, lastError: result };
      }

      return { ok: false, reason: result.reason, stale: false };
    } finally {
      bucket.inflight = null;
    }
  })();

  bucket.inflight = promise;
  return promise;
}

export function getRoadData(fetcher, { now = () => Date.now() } = {}) {
  return getOrFetch("road", ROAD_TTL_MS, ROAD_MAX_STALE_MS, fetcher, now);
}

export function getForecastData(fetcher, { now = () => Date.now() } = {}) {
  return getOrFetch("forecast", FORECAST_TTL_MS, FORECAST_MAX_STALE_MS, fetcher, now);
}

// Test-only reset — not used by the handler itself.
export function __resetWinterRouteCacheForTests() {
  buckets.road = { entry: null, inflight: null };
  buckets.forecast = { entry: null, inflight: null };
}
