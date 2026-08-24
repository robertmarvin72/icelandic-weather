// api/_lib/aurora/cache.js
//
// Neon persistence + single-flight lease for the aurora_forecast_cache
// singleton row (see docs/northern-lights/sql/aurora_forecast_cache.sql,
// pending manual apply).
//
// Two separate guarantees, deliberately not conflated (see Ticket 1 audit):
// 1. Idempotent writes — persistAuroraSnapshot() is a plain UPDATE on the
//    fixed singleton row; safe to call repeatedly.
// 2. Single-flight upstream fetch — claimAuroraRefreshLease() is what
//    actually prevents duplicate Vedur.is calls under concurrency. A plain
//    UPSERT alone does not provide this; the atomic conditional UPDATE does.
//    This mirrors the existing conditional UPDATE ... WHERE ... RETURNING
//    idiom already used by revokePassForTransaction
//    (api/_lib/paddle/transactions.js) — reused, not invented.

// Bounded so a crashed process can never permanently block future refreshes
// — the next claim attempt after expiry succeeds regardless of what
// happened to the process that held it.
const LEASE_DURATION_MINUTES = 2;

/**
 * Atomically claims the refresh lease. Returns true if this call acquired
 * it (no concurrent refresh in progress and no live lease), false if
 * another process already holds it.
 */
export async function claimAuroraRefreshLease(sql) {
  const rows = await sql`
    UPDATE aurora_forecast_cache
    SET refreshing_until = now() + (${LEASE_DURATION_MINUTES} || ' minutes')::interval
    WHERE id = 1
      AND (refreshing_until IS NULL OR refreshing_until < now())
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Releases the lease without touching the snapshot — used on a failed
 * refresh attempt so a bad fetch/parse never blocks the next scheduled
 * attempt, and never overwrites last-known-good with anything.
 */
export async function releaseAuroraRefreshLease(sql) {
  await sql`
    UPDATE aurora_forecast_cache
    SET refreshing_until = NULL
    WHERE id = 1
  `;
}

/**
 * Persists a successfully parsed+validated snapshot and clears the lease in
 * the same atomic UPDATE. Only ever called after the caller has confirmed
 * the parsed result is non-empty — an empty/invalid result must never reach
 * this function, so last-known-good is never overwritten with garbage.
 */
export async function persistAuroraSnapshot(sql, { nights, sourceFetchedAt }) {
  await sql`
    UPDATE aurora_forecast_cache
    SET snapshot = ${sql.json({ nights })},
        source_fetched_at = ${sourceFetchedAt},
        refreshing_until = NULL,
        updated_at = now()
    WHERE id = 1
  `;
}

/**
 * Reads the current cached snapshot (for internal consumers — not part of
 * Ticket 1's public surface, provided so future tickets don't need to
 * reinvent this read). Returns null if the row doesn't exist yet (should
 * not happen once the migration's bootstrap INSERT has run).
 */
export async function readAuroraSnapshot(sql) {
  const rows = await sql`
    SELECT snapshot, source_fetched_at, updated_at
    FROM aurora_forecast_cache
    WHERE id = 1
  `;
  return rows[0] || null;
}
