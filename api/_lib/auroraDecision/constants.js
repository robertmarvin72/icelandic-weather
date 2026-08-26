// api/_lib/auroraDecision/constants.js
//
// Ticket 3 (issue #391) orchestration-layer constants. Provisional product
// choices, isolated here so they can be tuned without touching orchestration
// logic (see approved prompt §5/§6).

// Aurora cache freshness thresholds. Based on THIS repo's own cron schedule
// (vercel.json: "0 12,20 * * *" -> worst-case gap ~16h between refresh
// attempts) — NOT a claim about Vedur.is's own upstream publication cadence,
// which this repo does not know and must not guess (approved prompt STOP
// condition: "Fresh/stale-policy krefst þess að giskað sé á óstaðfesta
// upstream cadence").
export const AURORA_FRESH_MAX_AGE_MINUTES = 360; // 6h — comfortably below the ~8h typical cron gap
export const AURORA_STALE_MAX_AGE_MINUTES = 1440; // 24h — beyond this, treated as too old to use

// Named cap enforced before any Open-Meteo fan-out (approved prompt §4).
export const MAX_LOCATIONS_PER_REQUEST = 8;

// Bounded concurrency + per-location timeout for the Open-Meteo fan-out.
// Timeout matches api/forecast.js's existing upstream AbortController timeout.
export const WEATHER_FETCH_CONCURRENCY = 4;
export const WEATHER_FETCH_TIMEOUT_MS = 8000;
