// api/_lib/auroraDecision/constants.js
//
// Ticket 3 (issue #391) orchestration-layer constants. Provisional product
// choices, isolated here so they can be tuned without touching orchestration
// logic (see approved prompt §5/§6).

// Aurora cache freshness thresholds. Based on THIS repo's own cron schedule
// (vercel.json: "0 8,14,20 * * *" — three runs/day, 6h gaps 08→14 and
// 14→20, a 12h overnight gap 20→08) — NOT a claim about Vedur.is's own
// upstream publication cadence, which this repo does not know and must not
// guess (approved prompt STOP condition: "Fresh/stale-policy krefst þess að
// giskað sé á óstaðfesta upstream cadence").
//
// Ticket 401 (#401): raised from 360 to 480 minutes. This intentionally
// covers the two 6h daytime gaps but NOT the 12h overnight gap — a request
// made in the last ~4h before 08:00 (after all three runs succeeded on
// schedule) will legitimately see a "stale" (not fresh) usable result. This
// is accepted, documented behavior, not a bug: see cc-report.md for the
// full honest tradeoff.
export const AURORA_FRESH_MAX_AGE_MINUTES = 480; // 8h
export const AURORA_STALE_MAX_AGE_MINUTES = 1440; // 24h — beyond this, treated as too old to use (unchanged by Ticket 401)

// Named cap enforced before any Open-Meteo fan-out (approved prompt §4).
export const MAX_LOCATIONS_PER_REQUEST = 8;

// Bounded concurrency + per-location timeout for the Open-Meteo fan-out.
// Timeout matches api/forecast.js's existing upstream AbortController timeout.
export const WEATHER_FETCH_CONCURRENCY = 4;
export const WEATHER_FETCH_TIMEOUT_MS = 8000;
