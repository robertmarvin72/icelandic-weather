# Result Review — Ticket 391 (Northern Lights Ticket 3: Aurora Decision Endpoint)

Reviewer: Jonesy
Input: `approved-prompt-v1.md`, `cc-report.md`, and the actual files in the working tree (read directly, not taken from CC's report).

## Compliance with approved prompt

All ten sections of the approved prompt were checked against the real files, not just against CC's narrative.

- **Preflight / DB connection precedent (§ the item this review's Round 1 flagged).** The approved prompt required `api/aurora-decision.js` to follow the request-path pattern (`postgres(url, { ssl: "require" })`, no `max: 1`) established by `api/checkout.js`, not the cron single-flight pattern (`max: 1`) used in `api/cron/refresh-aurora.js`. Confirmed directly in `api/aurora-decision.js`: `const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });` — no `max`. This is exactly the fix required in Round 1 of the prompt review, and it landed correctly in the implementation, not just in the report text.
- **Location list source.** `resolveLocations.js` reads `server_data/campsites.full.json` directly via `loadCanonicalLocations()`, memoized, and does not go through `api/campsites.js` (which is entitlement-filtered by design — confirmed separately that `api/campsites.js` gates on `me?.entitlements?.pro`). Using the endpoint here would have silently tier-filtered locations, violating the scoring-rock invariant one layer up the stack. Correctly avoided.
- **Scorer reuse, unchanged.** `rankDecision.js` imports `scoreAuroraVisibility` from `src/lib/auroraScoring.js` and calls it with `{ night, hourlyRows, viewingWindow }` — no wrapping, no reinterpretation of its output beyond copying fields into a new ranking object. `auroraScoring.js` itself is untouched (mtime unchanged from Ticket 2).
- **Darkness window duplication.** `darknessWindow.js` reimplements the HH:MM → calendar-day reconstruction rule from `auroraScoring.js` rather than modifying that file's export surface, as the approved prompt required ("call `scoreAuroraVisibility` unchanged"). The duplicated logic is pure date math (no scoring weights/formula), and is intentionally identical to Ticket 2's rule byte-for-byte in behavior. Verified by tracing both implementations: same `dayOffset = hour < 12 ? 1 : 0` boundary.
- **Order independence / deterministic ranking.** `fanout.js` pre-sizes `results = new Array(locations.length)` and writes by index (`results[i] = ...`) inside a worker-pool loop, so output order matches input order regardless of network completion order. `rankDecision.js`'s `compareRanked` then sorts by score descending, canonical `locationId` ascending as a stable tie-break. Together these guarantee the required determinism independent of network timing.
- **Tier/entitlement exclusion (scoring-rock invariant, one layer up).** Grepped `validateRequest.js`, `resolveLocations.js`, `orchestrate.js`, `rankDecision.js`, `fanout.js` — no reference to `tier`, `isPro`, `entitlements`, or `subscription` anywhere in the aurora-decision request path. The endpoint computes one canonical decision per `{evening, locationIds}` regardless of caller tier.
- **Unknown location IDs.** `resolveLocationIds` returns `{ resolved, unknownIds }`; `orchestrate.js` rejects the *whole* request with `400 unknown_location_ids` if `unknownIds.length > 0`, rather than silently dropping the unrecognized ones. This matches the approved prompt's explicit choice (documented as CC's deviation #3, but it is not actually a deviation from the approved prompt — the approved prompt left this open and CC's choice is the more defensible one; this is a documentation nit, not a functional problem, see below).
- **Freshness thresholds.** `constants.js` sets `AURORA_FRESH_MAX_AGE_MINUTES = 360`, `AURORA_STALE_MAX_AGE_MINUTES = 1440`, with comments correctly citing the real `vercel.json` cron schedule (`"0 12,20 * * *"`, i.e. every 8 hours, so 360/1440 minutes give one full missed-cycle margin before "stale" and two before "unavailable"). `freshness.js`'s `classifyAuroraCache` implements this with `age > STALE → unavailable`, `age > FRESH → stale`, else `fresh` — hand-traced boundary cases (age=360 → fresh, age=361 → stale, age=1440 → stale, age=1441 → unavailable): no off-by-one error.
- **Response contract / warnings.** `orchestrate.js` always includes `"national_reference_window"` in `warnings` whenever a window was actually computed and used (success/partial/no-locations-scored paths), and correctly omits it from `unavailableResponse()` (cache-unavailable, night-not-found, invalid-window paths), since no window exists in those cases. `aurora_data_stale` and `some_locations_excluded` are appended conditionally as specified.
- **Per-location failure isolation.** `openMeteo.js`'s `fetchLocationWeather` never throws; it returns `{ ok: false, reason }` for fetch failure, timeout (via `AbortController`), or empty/unparsable payload, and `numOrNull()` never coerces a missing numeric field to `0` (would silently distort scoring input). One location's failure cannot corrupt or block another's result or the overall response.

## Technical assessment

No material defect found. The three documented deviations in `cc-report.md` (duplicating darkness-window date math instead of touching `auroraScoring.js`'s exports; an independent Open-Meteo client instead of extracting one from `api/forecast.js`; rejecting the whole request on any unknown location ID) are all reasonable, narrowly-scoped, and consistent with the approved prompt's own boundaries and stated priorities (§6, §7). None of them expands scope, touches unrelated files, or reintroduces a tier/entitlement dependency.

One non-blocking observation: `orchestrate.js`'s `unavailableResponse()` always returns `httpStatus: 200` with `ok: true` even for `aurora_cache_unavailable` / `night_not_found` / `invalid_darkness_window`. This is a reasonable modeling choice (the request itself was valid; the *domain* answer is "no decision available") and is internally consistent with the `status: "unavailable"` field callers are expected to check — not a defect, just worth flagging so front-end integration doesn't assume a non-200 status for these cases.

## Test and validation assessment

`cc-report.md` claims 62/62 new tests across 9 new test files, 122/122 related tests, and 717/717 full suite (655 prior + 62 new), plus passing lint and build. As with the Ticket 390 review, this session has no shell access to the user's machine (no `device_bash` tool has been available at any point), so these numbers are CC's self-report and were not independently re-executed here. What was independently verified instead: all 19 files claimed to be new actually exist at the claimed paths; every pre-existing file CC claims not to have touched (`api/checkout.js`, `api/forecast.js`, `api/campsites.js`, `api/aurora/*`, `api/getMe.js`, `src/lib/auroraScoring.js`) shows an unchanged modification time; and the substantive logic in all 10 new source modules (`aurora-decision.js`, `orchestrate.js`, `fanout.js`, `freshness.js`, `rankDecision.js`, `validateRequest.js`, `resolveLocations.js`, `constants.js`, `darknessWindow.js`, `openMeteo.js`) was read in full and hand-traced against the approved prompt's requirements, including the specific DB-connection-pattern fix this review required in Round 1. Recommend Róbert (or a session with shell access) run `npx vitest run` and `npm run lint`/`npm run build` before this ticket is treated as fully closed, exactly as with Ticket 390.

## Outstanding material issues

None.

## Verdict

**PASS.**

Ticket 391 is ready to move to `CLOSED` pending Róbert's own sign-off and the human-controlled commit/push/issue-close procedure documented in `docs/ai/README.md`. No code changes are requested from this review.

---

## Ripley Final Assessment

Assessor: Ripley
Date: 2026-08-26

### Independent validation

- `npx vitest run api/_lib/auroraDecision api/aurora-decision.test.js api/_lib/aurora api/forecast.test.js src/lib/auroraScoring.test.js` — **126/126 passed** across 14 test files.
- `npm run lint` — **passed**.
- `npm run build` — **passed**. The existing large-chunk warning remains non-blocking and unrelated to this server-side ticket.

### Assessment

Jonesy's review found no material implementation defect or scope violation. The approved prompt's core invariants are satisfied: the canonical Ticket 2 scorer is reused unchanged; the request path is entitlement-independent; canonical server-owned locations are used; Aurora data is cache-only; fan-out is bounded and failure-isolated; and ranking is deterministic. The independently rerun high-risk and related tests, lint, and production build all pass.

The non-blocking `200` response modeling for domain-level `unavailable` states is internally consistent with the documented response contract and does not require revision. Ticket 4 must continue to branch on the response `status`, not HTTP status alone.

### Final verdict

**PASS.**

Ticket 391 is complete and may move to `CLOSED`. No code changes are requested. Commit, push, and GitHub issue closure remain human-controlled per `docs/ai/README.md`.
