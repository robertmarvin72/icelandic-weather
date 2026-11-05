// api/_lib/winterRoute/cache.js
//
// Ticket #486, S3 — fixed module-memory cache entries (road, forecast),
// each with a fixed TTL and a bounded "last known good" fallback window
// when a fresh fetch fails. Deliberately NOT a distributed/shared cache:
// this lives in one warm serverless function instance's memory only. A
// cold start starts with nothing cached — see winter-route.js's own
// doc-comment for what that means in production. All query parameters
// other than `routeId` are ignored by the route handler itself (not by
// this module) — there is nothing else parameter-dependent to key on here,
// by design (S3a).
//
// Ticket #491, B4 — ONE independent bounded road+forecast bucket pair per
// allowlisted routeId (never a shared nationwide-feed cache layer): a
// caller that never passes `routeId` (every existing call site/test) keeps
// hitting the single implicit bucket pair that existed before this ticket
// — unchanged Vík behaviour. A caller that does pass `routeId` gets its
// own separate pair, lazily created on first use, so A-route data can
// never leak into a B-route response (fallback/partial/stale included).
// This can double upstream call volume once both routes are in regular
// use (each route keeps its own TTL) — an accepted, owner-handed-off
// cost (B4), not a new quota/shared-cache system.

export const ROAD_TTL_MS = 5 * 60 * 1000;
export const FORECAST_TTL_MS = 15 * 60 * 1000;
export const ROAD_MAX_STALE_MS = 30 * 60 * 1000;
export const FORECAST_MAX_STALE_MS = 60 * 60 * 1000;

const DEFAULT_BUCKET_KEY = "__default__";
const routeBuckets = new Map();

function getBucketsForRoute(routeId) {
  const key = routeId ?? DEFAULT_BUCKET_KEY;
  let buckets = routeBuckets.get(key);
  if (!buckets) {
    buckets = {
      road: { entry: null, inflight: null },
      forecast: { entry: null, inflight: null },
    };
    routeBuckets.set(key, buckets);
  }
  return buckets;
}

async function getOrFetch(routeId, bucketName, ttlMs, maxStaleMs, fetcher, nowFn) {
  const bucket = getBucketsForRoute(routeId)[bucketName];
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

export function getRoadData(fetcher, { now = () => Date.now(), routeId } = {}) {
  return getOrFetch(routeId, "road", ROAD_TTL_MS, ROAD_MAX_STALE_MS, fetcher, now);
}

export function getForecastData(fetcher, { now = () => Date.now(), routeId } = {}) {
  return getOrFetch(routeId, "forecast", FORECAST_TTL_MS, FORECAST_MAX_STALE_MS, fetcher, now);
}

// Test-only reset — not used by the handler itself. Clears every route's
// buckets (including any lazily-created per-routeId pairs).
export function __resetWinterRouteCacheForTests() {
  routeBuckets.clear();
}
