-- aurora_forecast_cache: singleton row holding the latest normalized Vedur.is
-- aurora snapshot (multi-night). Refreshed only by the authenticated
-- /api/cron/refresh-aurora job (CRON_SECRET-gated) — never by user/browser
-- requests. refreshing_until is a bounded lease used to guarantee only one
-- concurrent refresh calls Vedur.is (see api/_lib/aurora/cache.js).
--
-- Singleton by design: there is exactly one current national aurora snapshot,
-- not one per user/location. The CHECK constraint enforces this at the DB
-- level so application code can always assume id=1 exists and is unique.
--
-- pending manual apply — not yet run against Neon production.

CREATE TABLE aurora_forecast_cache (
  id                  smallint     PRIMARY KEY DEFAULT 1,
  snapshot            jsonb,                                -- { "nights": [...] }, normalized (see api/_lib/aurora/parseAurora.js)
  source_fetched_at   timestamptz,                           -- when this snapshot was actually fetched from Vedur.is
  upstream_updated_at timestamptz,                           -- reserved: no upstream-declared update time is exposed by the feed today (confirmed via live fetch — no freshness metadata in the response)
  refreshing_until    timestamptz,                           -- single-flight lease; NULL when no refresh is in progress
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT aurora_forecast_cache_singleton CHECK (id = 1)
);

-- Bootstrap the one singleton row so the claim UPDATE (WHERE id = 1) always
-- has a row to act on, even before the first successful refresh.
INSERT INTO aurora_forecast_cache (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
