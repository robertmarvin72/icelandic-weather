# Ticket 391 — Ripley prompt draft v1

## Workflow target

Implement GitHub issue #391, **Ticket 3 Northern lights decisions**, as the server-side orchestration layer that combines the cached Aurora snapshot from Ticket 1, Open-Meteo weather, and the unchanged canonical scoring function from Ticket 2.

This document is a draft for Jonesy review. It is not approved for Claude Code execution until the workflow creates an `approved-prompt-vN.md` snapshot and `CURRENT.md` reaches `READY_FOR_CC`.

## Required preflight

1. Read `CLAUDE.md`, `AGENTS.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, and GitHub issue #391 before changing code.
2. Verify that `CURRENT.md` names `ticket-391` and is at `READY_FOR_CC`; then perform the required CC transition to `CC_IN_PROGRESS`.
3. Inspect the current implementations and tests before writing:
   - `api/_lib/aurora/cache.js`
   - `api/cron/refresh-aurora.js`
   - `src/lib/auroraScoring.js`
   - `api/forecast.js`
   - `api/campsites.js`
   - `server_data/campsites.full.json`
4. Confirm the actual database/cache record shape and Open-Meteo normalization contract from code. Do not infer them from this prompt alone.
5. If the implementation would require changing the Ticket 2 scoring formula/status semantics, calling Vedur.is outside the existing refresh job, tier-clipping forecast/scoring inputs, adding a library, building UI/paywall behavior, or persisting derived rankings, stop and report the conflict instead of expanding scope.

## Outcome

Add one canonical server-side Aurora decision API that accepts an explicit evening and a bounded set of selected canonical campsite/location IDs, resolves those IDs from server-owned location data, loads the cached Aurora snapshot, fetches the necessary Open-Meteo forecast data, invokes Ticket 2 scoring unchanged for each usable location, and returns a deterministic ranked decision response.

The API response must be the same for the same request and upstream data regardless of the caller's Free/Pro entitlement. Ticket 4 may later decide how much of this canonical response to present; Ticket 3 must not encode presentation gating.

## API contract

Create a focused Vercel serverless endpoint using the repository's existing JavaScript conventions. Choose and document a stable route and HTTP method after checking nearby API patterns; a JSON request body is appropriate if using `POST`.

The request contract must:

- require an explicit local evening date in `YYYY-MM-DD` form so that “tonight” does not depend on an implicit server clock;
- require a non-empty array of canonical location IDs;
- de-duplicate IDs deterministically;
- impose a named, documented maximum location count before any network fan-out;
- reject malformed dates, malformed bodies, an empty selection, too many locations, and unknown IDs with stable 4xx error codes;
- ignore or reject client-supplied tier/entitlement/ranking fields; they must never influence the result.

Resolve IDs only from the canonical server-side location dataset. Do not call or reuse the entitlement-filtered behavior of `api/campsites.js`, and do not accept client-supplied latitude/longitude/name as authoritative location data.

Document the response shape in code/tests. At minimum it must distinguish:

- a successful decision;
- a partial decision where some locations failed or lacked usable data;
- an unavailable decision where no location can be ranked;
- fresh, stale-but-usable, and unusable/missing Aurora cache states;
- `best`, ordered `alternatives`, excluded/failed locations with structured reasons, and top-level warnings.

Do not expose stack traces, credentials, or raw upstream error bodies.

## Aurora cache and night selection

- Read the last-known-good snapshot through the existing Ticket 1 cache boundary (`readAuroraSnapshot`); this endpoint must never fetch Vedur.is directly and must not refresh or overwrite the snapshot.
- Add named/configurable freshness thresholds at the decision layer. Classify boundary conditions deterministically as fresh, stale-but-usable, or unusable/too-old; a missing or malformed cache is unavailable.
- Use `source_fetched_at` as the source-age basis unless the audited Ticket 1 contract clearly requires otherwise. Do not present DB update time as source forecast time.
- Select the Aurora night matching the explicit requested evening according to the Ticket 1 snapshot schema. Missing/malformed matching-night data must yield a stable unavailable response, not fabricated defaults.
- Use the selected Aurora night's national darkness window as the Ticket 2 viewing window and label it explicitly as a national reference in the response/warnings. Do not claim campsite-specific sunrise/sunset accuracy.

Keep freshness values isolated so they can be tuned later without changing orchestration logic. Do not claim an upstream publication cadence that the repo does not know.

## Weather acquisition and normalization

- Fetch Open-Meteo data server-side for each selected canonical location, requesting every hourly field required by `scoreAuroraVisibility` (including total/layer cloud cover, precipitation, wind and visibility where available).
- Keep timestamps and the national viewing window in an explicit, consistent timezone/ISO contract. Avoid locale-dependent parsing.
- Use bounded concurrency with a named limit and an explicit timeout. One location's timeout, network error, malformed payload, or insufficient forecast coverage must not fail all other locations.
- Normalize and validate each location independently. Missing numeric values must remain missing; never coerce `null`, `undefined`, an empty string, or `NaN` to zero.
- Do not solve this by invoking browser-side leaderboard/Top 5 logic or by making internal HTTP calls to the entitlement-filtered campsite endpoint.
- If a small shared extraction from `api/forecast.js` is clearly safer than duplication, preserve its existing public behavior and tests. Do not broaden that refactor beyond the fields/normalization needed here.

## Scoring and ranking

- Import and call the canonical Ticket 2 `scoreAuroraVisibility` implementation unchanged. Do not copy its formula, fork it into API code, alter its weights, or reinterpret its `scored`, `insufficient_data`, and `not_viewable` statuses.
- Pass the selected night's Aurora data, the independently normalized hourly rows, and the explicit national darkness window using the scorer's existing input contract.
- Only locations with a valid `scored` result may participate in ranking. Preserve non-scored outcomes in the structured excluded list with their scorer status/reasons.
- Separate orchestration/ranking metadata from the scorer result rather than mutating the canonical scorer output.
- Make ordering independent of fetch completion order. Define one documented total ordering: score descending first, then deterministic audited weather-quality tie-break fields if they are reliably available, and finally canonical location ID ascending. Missing tie-break values sort after present values. If weather tie-break metrics cannot be derived without inventing semantics, use canonical ID as the stable tie-break rather than changing the score.
- `best` is the first ranked location; all remaining ranked locations are ordered `alternatives`. Never fabricate a best location when none is scoreable.

## Architecture and scope boundaries

Keep responsibilities separable and unit-testable: request validation/location resolution, Aurora cache freshness/night selection, bounded weather fan-out/normalization, and deterministic decision assembly. Use dependency injection or similarly narrow boundaries where it helps tests avoid real DB/network calls.

Do not add:

- UI, copy, routes, components, or presentation gating;
- Free/Pro response differences;
- browser-side ranking reuse;
- persisted rankings, derived-decision caching, migrations, or new tables;
- direct Vedur.is access;
- new dependencies;
- unrelated cleanup.

## Tests required

Add targeted deterministic tests covering at least:

1. Three valid locations producing one `best` and ordered `alternatives`.
2. Different asynchronous completion orders producing byte-equivalent decision ordering.
3. Equal scores resolving through the documented tie-break chain.
4. One location timing out/failing while the remaining locations still produce a partial decision.
5. Malformed weather and insufficient forecast coverage being excluded without zero coercion.
6. Ticket 2 `insufficient_data` and `not_viewable` results being preserved and excluded from ranking.
7. Fresh, exact freshness-boundary, stale-but-usable, too-old, missing, and malformed Aurora cache cases.
8. Missing matching evening/night and invalid national darkness window.
9. Invalid date/body, duplicate IDs, unknown IDs, empty selection, and maximum-count enforcement before fan-out.
10. Requests with irrelevant tier/entitlement fields not changing the canonical decision result.
11. The canonical Ticket 2 scorer being called through its existing contract, without duplicated or modified scoring math.
12. Upstream/internal failures returning stable sanitized status/error structures.

Keep tests isolated from the real network, database, and wall clock.

## Verification and handoff

Run the new targeted tests, relevant existing Aurora/cache/forecast tests, then the repository's full test suite, lint, and production build. Distinguish pre-existing failures from regressions and do not silently weaken tests or lint rules.

Write `docs/ai/tasks/ticket-391/cc-report.md` with:

- files changed and the endpoint/request/response contract;
- freshness thresholds, concurrency/timeout limits, sorting/tie-break rules, and timezone choices;
- how tier independence and Ticket 2 scorer reuse were verified;
- tests/commands run and exact results;
- any warnings, limitations, or follow-up work;
- confirmation that no UI, entitlement gating, derived persistence, direct Vedur fetch, dependency, commit, or push was added.

Finally update `docs/ai/CURRENT.md` with the CC report path and set the stage to `CC_COMPLETE`. Writing the report without that transition is an incomplete handoff. Do not commit or push.

---

## Round 1 — Jonesy

### Technical review

Verified the factual claims independently, not just against this draft's prose:

- `api/campsites.js` **is** entitlement-filtered exactly as claimed — it calls `getMeFromRequest`, branches on `isPro`, and returns `server_data/campsites.full.json` or `campsites.limited.json` accordingly. The prohibition on reusing its behavior is correct and necessary: importing it here would silently make the "canonical" decision depend on the requester's session.
- `server_data/campsites.full.json` genuinely has the shape this ticket needs (`id`, `name`, `lat`, `lon` per entry) — resolving canonical IDs against it is feasible as described.
- `scoreAuroraVisibility`'s actual exported signature (`{ night, hourlyRows, viewingWindow }`) and `readAuroraSnapshot`'s actual return shape (`{ snapshot: { nights }, source_fetched_at, updated_at }` or `null`) match what this draft assumes. No drift from Ticket 1/2's real contracts.

One material gap, one moderate clarity gap, one minor style note:

1. **The preflight reading list omits the one file that already demonstrates the right pattern for what this ticket actually needs: a per-request Neon connection.** `api/cron/refresh-aurora.js` opens its Postgres client as `postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 })` — a single-connection lease, correct for an infrequent scheduled job but not built for concurrent user requests. `api/checkout.js`, however, is a real request-triggered endpoint already talking to the same Neon database, and it opens its client as `postgres(process.env.POSTGRES_URL, { ssl: "require" })` — no `max: 1` — which is the actual working precedent for what Ticket 391 is: a user-request-triggered read against Neon, potentially under concurrent load. As written, §3's preflight list only points CC at the cron job's connection pattern; nothing tells CC to look at `checkout.js` instead, or to avoid copying the cron job's single-connection lease into a per-request handler where it would throttle concurrent requests to one at a time.
   → Fix: add `api/checkout.js` (and, if relevant, `api/_lib/paddle/subscriptions.js`) to the "Inspect the current implementations and tests before writing" list, specifically for how this codebase already establishes a Postgres connection on a request path, and add one sentence stating that the cron job's `max: 1` single-flight lease is not the right model to copy here.
2. **The response contract is more loosely specified than Ticket 2's precedent.** Ticket 2's approved prompt gave literal example JSON for every output state; this draft describes the required distinctions in prose ("a successful decision; a partial decision...; fresh/stale/unusable cache states...") without a concrete shape. Since Ticket 4 will build against whatever CC produces here, and changing a shipped API contract later is more expensive than changing an internal scoring function, I'd recommend requiring at least one illustrative example object per response state in `cc-report.md`, matching the rigor already established for Ticket 2's output contract. Not blocking — "document the response shape in code/tests" already exists — but worth being explicit that examples, not only prose, are expected.
3. **Minor style note, not a defect:** the real STOP conditions are correctly present but folded into preflight item 5 as one long sentence, rather than given their own heading the way Ticket 1 and Ticket 2's approved prompts did. Purely for scanability/consistency — recommend, don't require, pulling it into its own "STOP conditions" list.

### Verdict

REVISE

---

## Round 2 — Ripley

### Response to Jonesy

All three review points are incorporated below:

1. The request-path database precedent (`api/checkout.js`) is now mandatory preflight reading, and the prompt explicitly prohibits copying the cron-only `max: 1` single-flight connection choice without a justified request-path audit.
2. The completion report must contain illustrative JSON for every response state and thereby lock down the Ticket 4-facing contract more precisely.
3. STOP conditions now have their own scan-friendly section.

### Revised prompt

Implement GitHub issue #391, **Ticket 3 Northern lights decisions**, as the server-side orchestration layer that combines the cached Aurora snapshot from Ticket 1, Open-Meteo weather, and the unchanged canonical scoring function from Ticket 2.

#### 1. Required preflight

1. Read `CLAUDE.md`, `AGENTS.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, and GitHub issue #391 before changing code.
2. Verify that `CURRENT.md` names `ticket-391` and is at `READY_FOR_CC`; then perform the required CC transition to `CC_IN_PROGRESS`.
3. Inspect the current implementations and tests before writing:
   - `api/_lib/aurora/cache.js`
   - `api/cron/refresh-aurora.js`
   - `src/lib/auroraScoring.js`
   - `api/forecast.js`
   - `api/campsites.js`
   - `api/checkout.js`
   - `server_data/campsites.full.json`
4. Use `api/checkout.js` as an existing request-triggered Neon connection precedent and inspect any directly relevant helper it uses. The cron endpoint's `{ max: 1 }` connection is tied to its infrequent single-flight refresh role and must not be copied into a concurrent user-request path merely because that endpoint also reads/writes Aurora data. Choose the request-path connection configuration from audited repository precedent and document it.
5. Confirm the actual database/cache record shape and Open-Meteo normalization contract from code. Do not infer them from this prompt alone.

#### 2. STOP conditions

Stop and report the conflict instead of expanding scope if implementation would require any of the following:

- changing the Ticket 2 scoring formula, input/output contract, or status semantics;
- calling Vedur.is anywhere outside the existing refresh job;
- tier-clipping shared forecast/scoring inputs or making canonical results entitlement-dependent;
- adding UI, paywall/presentation behavior, a dependency, a schema/table, or persisted derived rankings;
- relying on unverified Aurora/cache or Open-Meteo field semantics;
- a broader refactor of existing forecast/campsite/payment behavior than this endpoint needs.

#### 3. Outcome

Add one canonical server-side Aurora decision API that accepts an explicit evening and a bounded set of selected canonical campsite/location IDs, resolves those IDs from server-owned location data, loads the cached Aurora snapshot, fetches the necessary Open-Meteo forecast data, invokes Ticket 2 scoring unchanged for each usable location, and returns a deterministic ranked decision response.

The API response must be the same for the same request and upstream data regardless of the caller's Free/Pro entitlement. Ticket 4 may later decide how much of this canonical response to present; Ticket 3 must not encode presentation gating.

#### 4. API contract

Create a focused Vercel serverless endpoint using the repository's existing JavaScript conventions. Choose and document a stable route and HTTP method after checking nearby API patterns; a JSON request body is appropriate if using `POST`.

The request contract must:

- require an explicit local evening date in `YYYY-MM-DD` form so that “tonight” does not depend on an implicit server clock;
- require a non-empty array of canonical location IDs;
- de-duplicate IDs deterministically;
- impose a named, documented maximum location count before any network fan-out;
- reject malformed dates, malformed bodies, an empty selection, too many locations, and unknown IDs with stable 4xx error codes;
- ignore or reject client-supplied tier/entitlement/ranking fields; they must never influence the result.

Resolve IDs only from the canonical server-side location dataset. Do not call or reuse the entitlement-filtered behavior of `api/campsites.js`, and do not accept client-supplied latitude/longitude/name as authoritative location data.

Document a stable machine-readable response shape in code and tests. It must distinguish:

- a successful decision;
- a partial decision where some locations failed or lacked usable data;
- an unavailable decision where no location can be ranked;
- fresh, stale-but-usable, and unusable/missing Aurora cache states;
- `best`, ordered `alternatives`, excluded/failed locations with structured reasons, and top-level warnings.

Do not expose stack traces, credentials, or raw upstream error bodies. The completion report must include one illustrative JSON response object for every success/partial/unavailable state and every materially different cache-state branch so Ticket 4 has a concrete integration contract rather than prose alone.

#### 5. Aurora cache and night selection

- Read the last-known-good snapshot through the existing Ticket 1 cache boundary (`readAuroraSnapshot`); this endpoint must never fetch Vedur.is directly and must not refresh or overwrite the snapshot.
- Add named/configurable freshness thresholds at the decision layer. Classify boundary conditions deterministically as fresh, stale-but-usable, or unusable/too-old; a missing or malformed cache is unavailable.
- Use `source_fetched_at` as the source-age basis unless the audited Ticket 1 contract clearly requires otherwise. Do not present DB update time as source forecast time.
- Select the Aurora night matching the explicit requested evening according to the Ticket 1 snapshot schema. Missing/malformed matching-night data must yield a stable unavailable response, not fabricated defaults.
- Use the selected Aurora night's national darkness window as the Ticket 2 viewing window and label it explicitly as a national reference in the response/warnings. Do not claim campsite-specific sunrise/sunset accuracy.

Keep freshness values isolated so they can be tuned later without changing orchestration logic. Do not claim an upstream publication cadence that the repo does not know.

#### 6. Weather acquisition and normalization

- Fetch Open-Meteo data server-side for each selected canonical location, requesting every hourly field required by `scoreAuroraVisibility` (including total/layer cloud cover, precipitation, wind and visibility where available).
- Keep timestamps and the national viewing window in an explicit, consistent timezone/ISO contract. Avoid locale-dependent parsing.
- Use bounded concurrency with a named limit and an explicit timeout. One location's timeout, network error, malformed payload, or insufficient forecast coverage must not fail all other locations.
- Normalize and validate each location independently. Missing numeric values must remain missing; never coerce `null`, `undefined`, an empty string, or `NaN` to zero.
- Do not solve this by invoking browser-side leaderboard/Top 5 logic or by making internal HTTP calls to the entitlement-filtered campsite endpoint.
- If a small shared extraction from `api/forecast.js` is clearly safer than duplication, preserve its existing public behavior and tests. Do not broaden that refactor beyond the fields/normalization needed here.

#### 7. Scoring and ranking

- Import and call the canonical Ticket 2 `scoreAuroraVisibility` implementation unchanged. Do not copy its formula, fork it into API code, alter its weights, or reinterpret its `scored`, `insufficient_data`, and `not_viewable` statuses.
- Pass the selected night's Aurora data, the independently normalized hourly rows, and the explicit national darkness window using the scorer's existing input contract.
- Only locations with a valid `scored` result may participate in ranking. Preserve non-scored outcomes in the structured excluded list with their scorer status/reasons.
- Separate orchestration/ranking metadata from the scorer result rather than mutating the canonical scorer output.
- Make ordering independent of fetch completion order. Define one documented total ordering: score descending first, then deterministic audited weather-quality tie-break fields if they are reliably available, and finally canonical location ID ascending. Missing tie-break values sort after present values. If weather tie-break metrics cannot be derived without inventing semantics, use canonical ID as the stable tie-break rather than changing the score.
- `best` is the first ranked location; all remaining ranked locations are ordered `alternatives`. Never fabricate a best location when none is scoreable.

#### 8. Architecture and scope boundaries

Keep responsibilities separable and unit-testable: request validation/location resolution, Aurora cache freshness/night selection, bounded weather fan-out/normalization, and deterministic decision assembly. Use dependency injection or similarly narrow boundaries where it helps tests avoid real DB/network calls.

Do not add UI/copy/routes/components, presentation gating, Free/Pro response differences, browser-side ranking reuse, persisted rankings, derived-decision caching, migrations/tables, direct Vedur.is access, dependencies, or unrelated cleanup.

#### 9. Tests required

Add targeted deterministic tests covering at least:

1. Three valid locations producing one `best` and ordered `alternatives`.
2. Different asynchronous completion orders producing byte-equivalent decision ordering.
3. Equal scores resolving through the documented tie-break chain.
4. One location timing out/failing while the remaining locations still produce a partial decision.
5. Malformed weather and insufficient forecast coverage being excluded without zero coercion.
6. Ticket 2 `insufficient_data` and `not_viewable` results being preserved and excluded from ranking.
7. Fresh, exact freshness-boundary, stale-but-usable, too-old, missing, and malformed Aurora cache cases.
8. Missing matching evening/night and invalid national darkness window.
9. Invalid date/body, duplicate IDs, unknown IDs, empty selection, and maximum-count enforcement before fan-out.
10. Requests with irrelevant tier/entitlement fields not changing the canonical decision result.
11. The canonical Ticket 2 scorer being called through its existing contract, without duplicated or modified scoring math.
12. Upstream/internal failures returning stable sanitized status/error structures.
13. Each documented success/partial/unavailable example matching the actual tested response schema.

Keep tests isolated from the real network, database, and wall clock.

#### 10. Verification and handoff

Run the new targeted tests, relevant existing Aurora/cache/forecast tests, then the repository's full test suite, lint, and production build. Distinguish pre-existing failures from regressions and do not silently weaken tests or lint rules.

Write `docs/ai/tasks/ticket-391/cc-report.md` with:

- files changed and the endpoint/request/response contract;
- illustrative JSON response objects for every success/partial/unavailable state and materially different cache-state branch, matching tests;
- freshness thresholds, concurrency/timeout limits, database connection choice, sorting/tie-break rules, and timezone choices;
- how tier independence and Ticket 2 scorer reuse were verified;
- tests/commands run and exact results;
- warnings, limitations, or follow-up work;
- confirmation that no UI, entitlement gating, derived persistence, direct Vedur fetch, dependency, commit, or push was added.

Finally update `docs/ai/CURRENT.md` with the CC report path and set the stage to `CC_COMPLETE`. Writing the report without that transition is an incomplete handoff. Do not commit or push.

---

## Round 2 — Jonesy

### Technical review

All three points resolved, each better than the minimum I asked for:

1. `api/checkout.js` is now mandatory preflight reading (§1.3) and §1.4 explicitly names the cron job's `{ max: 1 }` connection as the wrong model to copy "merely because that endpoint also reads/writes Aurora data" — that's a sharper, more specific warning than my original note, since it heads off the most likely rationalization for copying the wrong precedent.
2. The response contract now requires one illustrative JSON object per success/partial/unavailable state and per materially different cache-state branch, in both §4 and §10, and it's backed by a new test (#13) that ties the documented examples to the actually-tested schema rather than letting them drift from real behavior. Stronger than what I asked for.
3. STOP conditions have their own clean section (§2), six bullets, matching the original scope concerns with nothing dropped or loosened.

Re-read the full revised prompt fresh, not only the diff — no regressions. Sections 3, 5, 6, 7, 8, and 9 are otherwise unchanged from Round 1 and were already verified against the real `scoreAuroraVisibility`, `readAuroraSnapshot`, and `campsites.full.json` contracts in Round 1; nothing in the revision touches those in a way that would invalidate that verification. The new preflight items are read-only inspection, not scope creep — `api/checkout.js` is not listed among files this ticket changes.

### Verdict

APPROVED
