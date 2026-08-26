# CC Report — Ticket 391 (Ticket 3: Northern Lights decisions)

Executed against: `docs/ai/tasks/ticket-391/approved-prompt-v1.md` (v1, Jonesy: APPROVED).

## 1. Preflight and repository audit

Read before writing any code: `CLAUDE.md`, `AGENTS.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, and GitHub issue #391 (`gh issue view 391`).

`CURRENT.md` named `ticket-391` at `READY_FOR_CC`. Transitioned it to `CC_IN_PROGRESS` before writing any code, per approved prompt §1.2 (this ticket's prompt explicitly assigns CC that transition, unlike Ticket 2's).

Inspected before implementation:

- `api/_lib/aurora/cache.js` — confirmed `readAuroraSnapshot(sql)` returns `{ snapshot: { nights: [...] }, source_fetched_at, updated_at }` or `null`; this endpoint calls it read-only and never calls `claimAuroraRefreshLease`/`persistAuroraSnapshot`/`releaseAuroraRefreshLease`.
- `api/cron/refresh-aurora.js` — confirmed it is the only code path allowed to call Vedur.is, and confirmed its `postgres(..., { max: 1 })` connection is tied specifically to its single-flight refresh role.
- `src/lib/auroraScoring.js` — confirmed the exact input/output contract (`{ night, hourlyRows, viewingWindow }` → `scored | insufficient_data | not_viewable_tonight`) and imported it unchanged; no edits made to this file.
- `api/forecast.js` — confirmed its existing single-location Open-Meteo passthrough shape, its 8s `AbortController` timeout precedent (reused here), and its hourly field list (already includes `cloudcover*`/`visibility` groundwork from Ticket 1).
- `api/campsites.js` — confirmed it is entitlement-filtered (`isPro` branches between `campsites.limited.json`/`campsites.full.json`); this endpoint deliberately does not call or reuse it.
- `api/checkout.js` and `api/_lib/getMe.js` — confirmed both use `postgres(process.env.POSTGRES_URL, { ssl: "require" })` **without** `max: 1` for request-triggered, potentially concurrent paths. This is the precedent followed here (§1.4).
- `server_data/campsites.full.json` — confirmed the canonical shape: a flat array of `{ id, name, lat, lon }` (242 entries at time of writing). This is the only location data source used; client-supplied lat/lon/name are never trusted.

**Database connection choice:** `postgres(process.env.POSTGRES_URL, { ssl: "require" })`, no `max`, matching `checkout.js`/`getMe.js` — not the cron endpoint's `{ max: 1 }`, which would throttle concurrent user requests for an unrelated reason (single-flight upstream protection, not applicable to a read-only request path).

No STOP condition was triggered: no Ticket 2 formula/contract/status change was made; Vedur.is is never called by this endpoint; no tier-clipping of shared inputs; no UI/paywall/dependency/schema/persisted-ranking was added; no unverified field semantics were relied upon; no broader refactor of existing forecast/campsite/payment code was made.

## 2. Files changed

New:

- `api/aurora-decision.js` — the Vercel handler (`POST /api/aurora-decision`).
- `api/_lib/auroraDecision/constants.js` — freshness thresholds, max locations, concurrency/timeout.
- `api/_lib/auroraDecision/validateRequest.js` — pure request-body validation.
- `api/_lib/auroraDecision/resolveLocations.js` — canonical location loading + ID resolution.
- `api/_lib/auroraDecision/freshness.js` — Aurora cache freshness classification + night selection.
- `api/_lib/auroraDecision/darknessWindow.js` — national darkness window reconstruction (see §7, deviation 1).
- `api/_lib/auroraDecision/openMeteo.js` — Open-Meteo fetch + normalization for this endpoint.
- `api/_lib/auroraDecision/fanout.js` — bounded-concurrency multi-location fetch.
- `api/_lib/auroraDecision/rankDecision.js` — calls the Ticket 2 scorer and assembles ranked output.
- `api/_lib/auroraDecision/orchestrate.js` — ties the above together; fully dependency-injected (`sql`, `fetchImpl`, `now`, `canonicalLocations`) for testability.
- Matching `*.test.js` for every module above, plus `api/aurora-decision.test.js` (handler-level, mocked `postgres`/`fetch`).

No existing file was modified. No dependency was added.

## 3. API contract

`POST /api/aurora-decision` (JSON body — chosen over GET/query string per §4, matching the existing `api/checkout.js` POST+JSON precedent).

**Request:**

```json
{ "evening": "2026-08-24", "locationIds": ["osm_relation_12561703", "osm_way_823821729"] }
```

- `evening`: required, `YYYY-MM-DD`, calendar-validated (round-trip check, same technique as `api/_lib/aurora/parseAurora.js`'s date validation).
- `locationIds`: required, non-empty array of non-empty strings, deduplicated (order-preserving), capped at `MAX_LOCATIONS_PER_REQUEST = 8` (checked **after** deduplication, **before** any network fan-out).
- Unknown IDs (not present in `server_data/campsites.full.json`) reject the **whole** request with `400 unknown_location_ids` and the offending IDs listed — resolution never partially proceeds with only the known subset.
- Any `tier`/`isPro`/`ranking`/similar field is simply never read anywhere in the validation or orchestration code — ignored by construction, not merely rejected (proven by a dedicated test asserting identical output with/without such fields present).

**Validation error responses** (400, before any DB/network access):

```json
{ "ok": false, "code": "invalid_body", "error": "Request body must be a JSON object." }
{ "ok": false, "code": "invalid_evening", "error": "evening must be a valid YYYY-MM-DD date." }
{ "ok": false, "code": "empty_selection", "error": "locationIds must be a non-empty array of strings." }
{ "ok": false, "code": "too_many_locations", "error": "A maximum of 8 locations may be requested at once." }
{ "ok": false, "code": "unknown_location_ids", "error": "One or more location IDs are not recognized.", "details": { "unknownIds": ["loc-ghost"] } }
```

Non-POST methods → `405` with `Allow: POST`. Unexpected internal errors → `500 { ok: false, code: "internal_error", error: "Internal error" }` — no stack trace, upstream body, or credential ever reaches the response (verified by a test that throws an error containing a deliberately sensitive string and asserts it never appears in the serialized response).

## 4. Illustrative decision responses (matching actual tests)

All values below are taken directly from real test runs (`api/_lib/auroraDecision/orchestrate.test.js`), not hand-written — see `1. ranks three valid locations...` and neighboring tests for the exact fixtures.

**Success** (all requested locations scored — three real locations, clear/partial/full cloud, same activity=9, same night):

```json
{
  "ok": true,
  "evening": "2026-08-24",
  "auroraCache": { "state": "fresh", "sourceFetchedAt": "2026-08-24T10:00:00.000Z", "ageMinutes": 120 },
  "viewingWindow": { "start": "2026-08-24T22:00:00.000Z", "end": "2026-08-25T05:00:00.000Z" },
  "status": "success",
  "best": {
    "locationId": "loc-clear", "name": "Clear Site", "lat": 64.1, "lon": -21.9,
    "score": 100, "band": "excellent",
    "reasons": ["meaningful_activity", "clear_sky"],
    "flags": ["national_reference_times"]
  },
  "alternatives": [
    { "locationId": "loc-partial", "name": "Partial Site", "lat": 65.2, "lon": -18.5, "score": 73, "band": "good", "reasons": ["meaningful_activity", "partial_cloud"], "flags": ["national_reference_times"] },
    { "locationId": "loc-cloudy", "name": "Cloudy Site", "lat": 66.3, "lon": -15.0, "score": 15, "band": "very-poor", "reasons": ["meaningful_activity", "heavy_cloud", "cloud_hard_cap_applied"], "flags": ["national_reference_times"] }
  ],
  "excluded": [],
  "warnings": ["national_reference_window"]
}
```

**Partial** (one location's weather fetch failed):

```json
{
  "ok": true,
  "evening": "2026-08-24",
  "auroraCache": { "state": "fresh", "sourceFetchedAt": "2026-08-24T10:00:00.000Z", "ageMinutes": 120 },
  "viewingWindow": { "start": "2026-08-24T22:00:00.000Z", "end": "2026-08-25T05:00:00.000Z" },
  "status": "partial",
  "best": { "locationId": "loc-clear", "name": "Clear Site", "lat": 64.1, "lon": -21.9, "score": 100, "band": "excellent", "reasons": ["meaningful_activity", "clear_sky"], "flags": ["national_reference_times"] },
  "alternatives": [
    { "locationId": "loc-cloudy", "name": "Cloudy Site", "lat": 66.3, "lon": -15.0, "score": 15, "band": "very-poor", "reasons": ["meaningful_activity", "heavy_cloud", "cloud_hard_cap_applied"], "flags": ["national_reference_times"] }
  ],
  "excluded": [
    { "locationId": "loc-partial", "name": "Partial Site", "status": "weather_fetch_failed", "reasons": ["weather_fetch_failed"] }
  ],
  "warnings": ["national_reference_window", "some_locations_excluded"]
}
```

**Unavailable — Aurora cache too old:**

```json
{
  "ok": true,
  "evening": "2026-08-24",
  "auroraCache": { "state": "unavailable", "reason": "too_old", "sourceFetchedAt": "2026-08-24T10:00:00.000Z", "ageMinutes": 1560 },
  "viewingWindow": null,
  "status": "unavailable",
  "reason": "aurora_cache_unavailable",
  "best": null, "alternatives": [], "excluded": [], "warnings": []
}
```

**Unavailable — Aurora cache missing** (`auroraCache: { state: "unavailable", reason: "missing", sourceFetchedAt: null, ageMinutes: null }`) and **malformed** (`reason: "malformed"`) follow the identical shape, differing only in `auroraCache.reason`.

**Unavailable — requested evening not in the snapshot:**

```json
{
  "ok": true, "evening": "2026-09-01",
  "auroraCache": { "state": "fresh", "sourceFetchedAt": "2026-08-24T10:00:00.000Z", "ageMinutes": 120 },
  "viewingWindow": null, "status": "unavailable", "reason": "night_not_found",
  "best": null, "alternatives": [], "excluded": [], "warnings": []
}
```

**Unavailable — no location produced a scored result** (e.g. the night's `auroraActivity` is `null`):

```json
{
  "ok": true, "evening": "2026-08-24",
  "auroraCache": { "state": "fresh", "sourceFetchedAt": "2026-08-24T10:00:00.000Z", "ageMinutes": 120 },
  "viewingWindow": { "start": "2026-08-24T22:00:00.000Z", "end": "2026-08-25T05:00:00.000Z" },
  "status": "unavailable", "reason": "no_locations_scored",
  "best": null, "alternatives": [],
  "excluded": [ { "locationId": "loc-clear", "name": "Clear Site", "status": "insufficient_data", "reasons": ["missing_activity"] } ],
  "warnings": ["national_reference_window", "some_locations_excluded"]
}
```

**Stale-but-usable cache** (decision still produced, explicitly flagged):

```json
{ "auroraCache": { "state": "stale", "sourceFetchedAt": "2026-08-24T10:00:00.000Z", "ageMinutes": 600 }, "status": "success", "warnings": ["national_reference_window", "aurora_data_stale"], "...": "best/alternatives populated as in the success example" }
```

## 5. Freshness thresholds, concurrency/timeout, connection, sorting, timezone

- **Freshness** (`api/_lib/auroraDecision/constants.js`): `AURORA_FRESH_MAX_AGE_MINUTES = 360` (6h), `AURORA_STALE_MAX_AGE_MINUTES = 1440` (24h). Basis: this repo's **own** cron schedule (`vercel.json`: `"0 12,20 * * *"`, worst-case ~16h gap) — not a claim about Vedur.is's own publication cadence, which is unknown (explicit STOP-avoidance per §5/#7). Boundary is inclusive on both sides: age `<= 360` → fresh; `360 < age <= 1440` → stale; `age > 1440` → unavailable (`too_old`). `source_fetched_at` (not `updated_at`) is the sole age basis.
- **Max locations per request**: `8`, enforced after deduplication, before any Open-Meteo call.
- **Concurrency/timeout**: `WEATHER_FETCH_CONCURRENCY = 4`, `WEATHER_FETCH_TIMEOUT_MS = 8000` (matches `api/forecast.js`'s existing upstream timeout). The fan-out (`fanout.js`) writes each location's result into a pre-sized array by index, so output order is identical regardless of completion order — proven by a dedicated test with artificial per-location delays.
- **Database connection**: `postgres(process.env.POSTGRES_URL, { ssl: "require" })`, no `max` — the `checkout.js`/`getMe.js` request-path precedent, explicitly not the cron job's `{ max: 1 }`.
- **Sorting/tie-break**: score descending, then canonical location ID ascending. No "audited weather-quality" secondary metric was added — the approved prompt's own fallback instruction (§7) explicitly permits ID as the tie-break when no such metric can be derived "without inventing semantics"; inventing one was judged out of scope and risky, so ID-only was chosen and documented in `rankDecision.js`.
- **Timezone**: Open-Meteo is queried with `timezone=UTC` explicitly; all internal timestamps are explicit-UTC ISO 8601 strings, reconstructed via epoch-millisecond arithmetic — never host-timezone `Date` methods, matching Ticket 2's own convention.

## 6. Tier independence and Ticket 2 scorer reuse — how verified

- **Tier independence**: `validateAuroraDecisionBody` and `orchestrate.js` never read any `tier`/`isPro`/`subscription`/ranking-like field from the request body anywhere in the code. A dedicated test (`orchestrate.test.js`, "10. produces the identical canonical result regardless of client-supplied tier/entitlement fields") calls the orchestrator twice with and without such fields and asserts byte-identical response bodies.
- **Scorer reuse**: `rankDecision.js` imports `scoreAuroraVisibility` from `src/lib/auroraScoring.js` directly and calls it unmodified — no forked copy, no reimplemented weights. Its `score`/`band`/`reasons`/`flags` fields are copied verbatim into a **new** ranking-entry object (never mutated in place). `rankDecision.test.js` uses the **real** scorer (not a mock) so the tests themselves prove genuine reuse, including that `insufficient_data`/`not_viewable_tonight` statuses pass through unchanged into `excluded`.

## 7. Deviations from the approved prompt

1. **Duplicated the ~15-line HH:MM→calendar-day time-reconstruction rule** (`api/_lib/auroraDecision/darknessWindow.js`) instead of exporting it from `src/lib/auroraScoring.js`. The approved prompt requires importing and calling the Ticket 2 scorer "unchanged"; to honor a strict reading of that (no edits to that file at all, not even an additive export), this endpoint reimplements the identical, already-tested date-math rule locally rather than modifying Ticket 2's file. This duplicates pure date arithmetic only — no scoring weight, threshold, or formula is duplicated. Flagging this as a judgment call for result review, since a stricter reading of "reuse before invent" could instead prefer exporting the helper from `auroraScoring.js`.
2. **Did not extract shared code from `api/forecast.js`**; wrote an independent Open-Meteo client (`openMeteo.js`) instead. Rationale in §6 of the prompt allows extraction only "if clearly safer" and explicitly warns against broadening the refactor — `forecast.js` is a monolithic single-location handler with no exported reusable pieces, so extracting from it would have meant refactoring an existing, tested, unrelated endpoint. Duplicating ~10 lines of field-list/URL construction was judged safer.
3. **Unknown location IDs reject the whole request** rather than proceeding with the known subset — this is the more literal reading of §4 ("reject ... unknown IDs with stable 4xx error codes"), and is stricter/safer than silently dropping unrecognized IDs.

No STOP condition was triggered.

## 8. Tests, lint, and build actually run

- **New targeted tests** — `npx vitest run api/_lib/auroraDecision api/aurora-decision.test.js` → **62/62 passed** across 9 files (one test's hand-picked "now" timestamp was corrected after the first real run showed it landed in the wrong freshness bucket — arithmetic error in the test fixture, not the source).
- **Relevant existing Aurora/cache/forecast/scoring tests** — `npx vitest run api/_lib/aurora api/forecast.test.js src/lib/auroraScoring.test.js` → **122/122 passed**.
- **Full test suite** — `npx vitest run` → **717/717 passed**, 64 files (655 prior + 62 new = 717, exact match; no other test count moved). Pre-existing, unrelated `Not implemented: navigation to another Document` jsdom warnings appeared, as in prior runs — not failures.
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded (`✓ built in 9.21s`). Same pre-existing "chunks larger than 500 kB" notice as before this change, unrelated — this is server-side `api/` code, not part of the client bundle.

No command was skipped or reported as passing without actually running.

## 9. Determinism and failure-isolation evidence

- Different async completion orders (artificial per-location delays) produce byte-identical response bodies (`orchestrate.test.js`, "2/3. different completion orders and equal scores...").
- Equal scores resolve through the documented ID tie-break, tested both in isolation (`rankDecision.test.js`) and end-to-end (`orchestrate.test.js`).
- One location's network failure/timeout never affects the others (`fanout.test.js`, `orchestrate.test.js` §4) and never coerces a missing value to `0` (`openMeteo.test.js`, explicit null-preservation test).
- Aurora cache unavailability, a too-old cache, a missing night, and an invalid darkness window all short-circuit to a structured `unavailable` response **before** any Open-Meteo call — verified with a `fetchImpl` that throws if invoked, and (separately) a `sql` spy proving the cache is never read when validation already failed.

## 10. Warnings, limitations, follow-up

- The Vedur.is aurora feed carries **no location metadata**. Both `night.sun.*` (used here for the darkness window) **and** `night.moon.rise`/`night.moon.set` (used inside the unmodified Ticket 2 scorer) are national reference times, not location-specific astronomical calculations. Every decision response's `warnings` includes `"national_reference_window"` as a standing, machine-readable reminder; this must not be presented to end users as campsite-specific sunrise/darkness accuracy (carried forward from Ticket 1/2's own limitation notes).
- Freshness thresholds (6h/24h) are provisional, isolated, and explicitly not a claim about Vedur.is's real update cadence — they should be revisited once real cron-run history exists (per issue #391's own instruction: "Ekki skal fullyrða að mörkin endurspegli upstream cadence fyrr en raunverulegar cron-keyrslur hafa staðfest hegðunina").
- The tie-break is canonical-ID-only; no weather-quality secondary tie-break was added (§7, deviation 3-adjacent — see §5).
- No derived/ranking data is persisted anywhere (confirmed — `orchestrate.js` never writes to Neon; only `readAuroraSnapshot` is called).
- This ticket adds no UI, no paywall/presentation gating, and does not touch `api/campsites.js`'s entitlement filtering — Ticket 4 is expected to decide how much of this canonical response to surface to Free vs. Pro users.

## 11. Confirmation

No UI, no entitlement gating, no derived/persisted ranking or score tables, no direct Vedur.is fetch, and no new dependency were added. `src/lib/auroraScoring.js` and `api/_lib/aurora/*` (Ticket 1/2 files) are unmodified. **Not committed. Not pushed.**

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`, per approved prompt §10 ("Writing the report without that transition is an incomplete handoff").
