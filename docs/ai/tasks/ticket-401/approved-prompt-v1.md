# Approved Prompt v1 — Ticket 401

Implement GitHub issue #401, **Northern Lights — bæta við þriðja scheduled refresh og samræma stale policy**, as a narrow Aurora-cache scheduling and freshness-policy correction.

The outcome must schedule the existing authenticated Aurora refresh job at 08:00, 14:00, and 20:00 under the repository/platform's existing cron timezone convention; classify data as fresh through exactly eight hours after the last successful upstream fetch; preserve the current 24-hour usable-stale hard cutoff and last-known-good behavior; and verify that stale analytics continues to represent the stale state actually rendered by the Northern Lights UI.

### 1. Mandatory preflight audit

Before editing, read and inspect:

- GitHub issue #401 and its production-observation context;
- `vercel.json`, every configured cron entry, and any tests that read deployment config;
- `api/cron/refresh-aurora.js` and its complete test suite;
- `api/_lib/aurora/cache.js`, its SQL migration/schema documentation, and tests;
- `api/_lib/auroraDecision/constants.js`, `freshness.js`, `orchestrate.js`, and their tests;
- the Ticket 1/Ticket 3 approved prompts, CC reports, and result reviews where the cron, `source_fetched_at`, last-known-good, stale and hard-cutoff contracts were established;
- `src/lib/auroraDecisionClassify.js`, `useAuroraDecision`, `NorthernLightsCard.jsx`, and their tests;
- Northern Lights analytics implementation/conventions, including the Ticket 4 `lang` hardening and exact-once behavior;
- any other Aurora cache consumer or constant importer found by repository search.

In `cc-report.md`, record the audited before/after schedule, timezone convention, freshness boundaries, hard cutoff, successful/failed refresh behavior, and the exact UI→analytics stale-state data flow.

Known live findings to verify, not assume:

- `vercel.json` currently has one Aurora cron entry with schedule `0 12,20 * * *`.
- `AURORA_FRESH_MAX_AGE_MINUTES` is currently `360` (6h); `AURORA_STALE_MAX_AGE_MINUTES` is `1440` (24h).
- `classifyAuroraCache` uses `source_fetched_at`, not DB `updated_at`; its comparisons are inclusive (`age <= fresh max` is fresh, `fresh max < age <= stale max` is stale, above the stale max is `too_old`/unavailable).
- A successful refresh persists a newly generated `sourceFetchedAt`; a failed fetch/parse/persist does not call the successful snapshot-persistence path and releases the lease without overwriting the existing snapshot.
- `northern_lights_stale_viewed` currently fires inside the same resolved-card effect only when `classification.freshness === "stale"`, and the visible stale notice is driven by that same canonical classification value; the ref guard prevents rerender duplication for the same request/result identity.

If the live tree contradicts any of these findings, reconcile scope from code before implementation and document the discrepancy. Because this touches shared Aurora freshness/data flow, **STOP before writing** if the audit shows the requested change requires edits beyond the bounded cron/freshness/verification scope below.

### 2. Exact authorized production changes

#### Aurora schedule

Update only the existing `/api/cron/refresh-aurora` entry in `vercel.json` so it runs daily at:

- 08:00;
- 14:00;
- 20:00.

Use the same cron expression/timezone convention the project and deployment platform already use; do not add runtime timezone conversion, separate duplicate endpoint entries, application timers, queues, or client-triggered refreshes. Record explicitly whether the convention is UTC and how that maps to Reykjavík for this project rather than silently assuming local server time.

Do not change the blog cron or any other scheduled job.

#### Freshness threshold

Set the named Aurora fresh maximum to exactly `480` minutes (8 hours).

- Age exactly 480 minutes is `fresh`.
- Any representable age greater than 480 minutes is `stale`, provided it remains within the existing usable-stale maximum.
- Keep `AURORA_STALE_MAX_AGE_MINUTES` exactly `1440` minutes unless audit proves the current hard cutoff differs. Do not extend, shorten, rename, reinterpret, or otherwise change the hard cutoff under this ticket.
- Preserve missing/malformed/too-old unavailable reasons and response shape.
- Continue using the actual successful upstream fetch time, `source_fetched_at`, as the canonical age basis. Never substitute DB `updated_at`, cron invocation time after a failed fetch, or client time.
- Update stale schedule comments in `constants.js` so they describe the new three-run cadence and actual maximum scheduled gap accurately. Do not make claims about Vedur.is publication cadence that the repository cannot verify.

The new schedule has 6-hour gaps from 08→14 and 14→20 and a 12-hour overnight gap from 20→08. An 8-hour fresh threshold therefore intentionally prioritizes active usage but can still produce a scheduled stale window overnight before 08:00 even when all runs succeed. Document this honestly; do not "solve" it by silently changing the requested threshold, hard cutoff, or schedule.

### 3. Successful and failed refresh invariants

Preserve the existing refresh architecture and prove its behavior:

- The authenticated cron endpoint remains the only Vedur.is caller.
- Authorization happens before lease, DB, parse, or upstream work.
- The atomic bounded single-flight lease remains unchanged.
- A successful non-empty parse persists the snapshot and sets `source_fetched_at` to the successful fetch's current timestamp, then clears the lease atomically through the existing persistence boundary.
- A failed upstream fetch, empty/invalid parse, or persistence failure must not write a replacement snapshot or advance `source_fetched_at`. It must retain last-known-good data and release the lease through the existing failure path.
- Do not add retries. Do not allow failure to make old data look fresh.
- Do not alter schema, SQL table shape, lease duration, provider endpoint, parsing, request authentication, response contract, or connection configuration.

If exact timestamp verification needs a deterministic clock seam, prefer the existing test runner's fake system time around the handler. Do not introduce a general clock abstraction or refactor the endpoint merely for testing unless the current code cannot be tested safely otherwise.

### 4. Stale UI and analytics truthfulness

Do not rename, add, or reinterpret Northern Lights analytics events.

- `northern_lights_stale_viewed` must fire only when a stale disclosure is actually rendered for a usable resolved result.
- Its stale decision must remain grounded in the canonical server freshness classification, not a new client-side age threshold or recomputation.
- The visible stale notice and stale event must use the same effective stale predicate. Do not create a state where the event fires without the notice or the notice appears without the event for a usable result.
- Preserve exact-once semantics for the same meaningful request/result identity across ordinary rerenders, theme changes, language changes, and unrelated parent renders.
- Preserve `lang`, `outcome`, and `tier` payload fields and the semantics of every other Northern Lights event.
- Preserve stale + partial composition and Free/Pro parity of the stale disclosure.
- Do not "fix" unmount/remount exposure behavior without evidence of production double-counting; a genuine new exposure after navigation may remain valid.

Prefer verification/tests over frontend production changes if the audited implementation already satisfies these requirements. If a code change is genuinely required to align event firing with rendered exposure, keep it local and explain the exact demonstrated mismatch first. **STOP** if fixing it would require changing request identity/cache semantics, result classification, UI copy, or broader analytics architecture.

### 5. Hard scope boundaries

Do not change:

- Aurora provider URL, fetch/parse behavior, snapshot schema, database migration, or cache record shape;
- request-time or frontend network behavior—there must be no request-time/frontend Vedur.is call;
- single-flight locking, lease duration, auth, retry behavior, or failure response semantics;
- the 24-hour hard cutoff/unavailable behavior;
- Open-Meteo fan-out, Aurora scoring, weights, ranking, bands, reasons, flags, candidate roster, decision response, seasonality, or Free/Pro computation/gating;
- Northern Lights UI copy, visual design, map/list behavior, request caching, checkout attribution, or unrelated analytics;
- any other cron job;
- dependencies, backend routes, schema, TypeScript/`.tsx`, commit, or push.

The working tree may contain the completed but uncommitted Ticket 400 implementation and workflow history. Treat every pre-existing modification/untracked/deleted file as user-owned: do not overwrite, revert, reformat, stage, or include it as Ticket 401 work. Record the Ticket 401 delta separately and preserve the existing worktree state.

### 6. Required targeted tests

Add or update focused deterministic tests for at least:

1. Deployment config contains exactly one `/api/cron/refresh-aurora` entry and its schedule is exactly the approved 08/14/20 cadence.
2. The blog cron and every other cron entry remain byte-equivalent in meaning; the config test must not depend on array order alone.
3. `AURORA_FRESH_MAX_AGE_MINUTES === 480` and `AURORA_STALE_MAX_AGE_MINUTES === 1440` explicitly, preventing accidental coupled threshold changes.
4. A valid snapshot at age 479 minutes is fresh.
5. Exact age 480 minutes is fresh (inclusive boundary).
6. The smallest practical value above the boundary is stale. Because age is computed continuously in minutes, include a sub-minute crossing such as 480 minutes + 1 millisecond rather than testing only whole-minute 481.
7. A valid snapshot remains stale at exactly 1440 minutes and becomes `too_old`/unavailable immediately above 1440 minutes.
8. Future clock skew remains clamped to age zero/fresh as currently implemented; do not let threshold changes regress it.
9. Successful refresh passes the deterministic successful-fetch timestamp into `persistAuroraSnapshot`, persists once, and does not use `updated_at` as freshness input.
10. Upstream fetch failure, invalid/empty parse, and persistence failure never replace the snapshot or advance `source_fetched_at`; lease-release behavior stays correct.
11. Concurrent invocations still yield exactly one Vedur.is fetch/persist through the lease guard, and a failed attempt does not permanently lock later runs.
12. A usable fresh result renders no stale disclosure and emits no `northern_lights_stale_viewed` event.
13. A usable stale result renders the human-readable stale disclosure and emits exactly one stale event with unchanged `{ lang, outcome, tier }` semantics.
14. Rerender, theme change, and language change do not duplicate the stale event for the same meaningful identity; stale + partial still renders both truths and emits only the one stale exposure event.
15. Unavailable/too-old, transport, no-darkness, and contract-defect states do not masquerade as usable stale exposure; preserve their established UI/event semantics.

Use injected/fake wall clock and isolated filesystem/config reads where needed. Do not call real Vedur.is, Vercel, Neon, Open-Meteo, or analytics services in tests. Do not weaken existing tests or assertions.

### 7. Validation and report

Run and record exact results for:

- the new/updated cron-config test;
- `api/_lib/auroraDecision/freshness.test.js`;
- `api/cron/refresh-aurora.test.js`;
- `api/_lib/aurora/cache.test.js`;
- directly relevant orchestration/classifier tests;
- `src/components/NorthernLightsCard.test.jsx` and related request-cache analytics tests;
- all tests changed or added for Ticket 401;
- the full Vitest suite;
- `npm run lint`;
- `npm run build`;
- `git diff --check`.

No deployment or GA4 production monitoring is authorized in this implementation task. Instead, include a post-deployment verification plan in `cc-report.md`:

- verify Vercel records successful invocations for all three daily slots;
- confirm `source_fetched_at` advances only after successful refreshes;
- monitor `northern_lights_stale_viewed` in GA4 for several comparable days;
- compare event rate/exposures by `lang`, `tier`, and `outcome` against the pre-change baseline rather than comparing raw counts alone;
- account for the intentional 20:00→08:00 gap and time-of-day traffic before interpreting residual stale events;
- treat any unexplained stale exposure during expected-fresh windows as a possible missed/delayed refresh signal.

The CC report must distinguish code inspection, independently executed validation, and deferred production monitoring. List exact files changed, before/after values, test commands/results, deviations, and residual risks. Explicitly confirm no other cron, hard cutoff, cache preservation, scoring/ranking, UI copy, provider access path, dependency, commit, or push changed.

### 8. Acceptance criteria

- The existing Aurora refresh job is scheduled at 08:00, 14:00, and 20:00 under the verified existing timezone convention.
- No other cron changes.
- Aurora data is fresh through exactly 8 hours/480 minutes after the last successful fetch and stale immediately after that boundary while still usable.
- The 24-hour/1440-minute hard cutoff and unavailable behavior remain unchanged.
- Successful refresh advances `source_fetched_at`; failed refresh preserves the last-known-good snapshot and its source timestamp.
- Single-flight, auth-first, no-retry, server-only Vedur.is access remain intact.
- `northern_lights_stale_viewed` corresponds to a genuinely rendered usable-stale state and remains exact-once across rerenders, with existing payload semantics.
- Scoring, ranking, verdict bands, UI copy, gating, other cron jobs, and unrelated behavior are unchanged.
- Targeted/relevant/full tests, lint, build, and diff check pass; production monitoring remains a documented post-deployment owner step.

### 9. STOP conditions

STOP and report before implementation if:

- Vercel/project cron timezone behavior cannot be verified well enough to express the requested three times safely;
- the three daily times require separate jobs, a plan/platform capability change, or changes outside the existing `vercel.json` entry;
- making 8-hour freshness truthful would require changing `source_fetched_at` semantics, the 24-hour hard cutoff, schema, cache write/read boundary, or upstream cadence assumptions;
- failed refresh currently overwrites last-known-good data and correcting it would require a broader cache redesign rather than the bounded existing path;
- analytics truthfulness requires changing client-side freshness computation, request identity/cache, event names, UI copy, or non-Aurora analytics;
- the change would touch scoring, ranking, bands, verdicts, candidate selection, entitlement, checkout/payment, another cron, provider access architecture, or Ticket 400's uncommitted files.

Default git safety applies: do not commit and do not push.

---

## Approved Round 2 analytics clarification

### Confirmed pre-existing non-result stale-event mismatch

The preflight must record and verify this exact reachable chain:

1. `classifyAuroraCache` may correctly classify a present, usable cache as `stale`.
2. Orchestration can then independently return top-level `status: "unavailable"` for `night_not_found`, `invalid_darkness_window`, or `no_locations_scored`, while retaining that stale `auroraCache` metadata in the response.
3. `classifyAuroraOutcome` preserves `freshness: "stale"` when mapping those responses to `primary: "domain_unavailable"` or `primary: "no_darkness"`.
4. `NorthernLightsCard` renders its stale disclosure only inside `AuroraResult`, which is reached solely for usable `primary: "success"` or `primary: "partial"` results.
5. The current analytics effect checks only `classification.freshness === "stale"`, so those non-result states can emit `northern_lights_stale_viewed` even though the user sees the existing unavailable/no-darkness UI and no stale disclosure.

This is a confirmed analytics-truthfulness bug within Ticket 401, not a hypothetical observation. It is also independent of the cron/freshness threshold change: the schedule may make stale cache metadata more or less frequent, but must not determine whether a non-result UI counts as a stale exposure.

### Required local analytics correction

Gate `northern_lights_stale_viewed` on both conditions:

- freshness is canonically `"stale"`; and
- the primary outcome is a usable result: `"success"` or `"partial"`.

Use the same `isResultOutcome`/equivalent boolean already computed in the card-view effect; do not introduce a second result classifier or client-side freshness calculation. The effective rule must be equivalent to:

```js
if (isResultOutcome && classification.freshness === "stale") {
  trackEvent("northern_lights_stale_viewed", ...);
}
```

This change is limited to the existing event condition. Preserve the ref-based meaningful-identity guard, event name, exact payload (`lang`, `outcome`, `tier`), effect dependencies, card-view event, unavailable event, and every other analytics semantic. Do not change any render branch or copy merely to make an analytics event fire.

### Required real-shaped regression coverage

Extend the Round 1 analytics tests with real Ticket 3-shaped fixtures proving:

1. `success + stale` renders the human-readable stale notice and emits `northern_lights_stale_viewed` exactly once.
2. `partial + stale` renders both partial and stale notices and emits the stale event exactly once.
3. `stale cache + night_not_found` maps/renders as the existing domain-unavailable state, renders no stale notice, and emits no `northern_lights_stale_viewed`.
4. `stale cache + invalid_darkness_window` maps/renders as the existing no-darkness state, renders no stale notice, and emits no stale event.
5. `stale cache + no_locations_scored`—including the established domain-unavailable and unambiguous no-darkness classification shapes where applicable—renders its existing non-result UI without a stale notice and emits no stale event.
6. Theme/language/ordinary rerenders of a usable stale result do not duplicate the event and do not lose the original payload semantics.

Where practical, exercise the card with response bodies matching orchestration's actual output instead of directly inventing a `classification` object. Do not change server response shape or classifier behavior to satisfy these tests.

### Clock-skew residual risk decision

Jonesy's secondary note is accepted as a documented residual risk, not an authorized production change in this ticket.

`formatAgo` returns `null` when the client clock makes `sourceFetchedAt` appear to be in the future, so an extreme client/server clock skew could theoretically suppress the stale notice even for a canonical `success`/`partial + stale` result while the server-derived stale event still fires. Reaching this requires the client clock to lag the server far enough that server-old stale data appears future-dated locally (more than the stale age, ordinarily over eight hours after this ticket).

Do not refactor `formatAgo`, thread a new wall-clock predicate through analytics/rendering, clamp negative UI age, or add client freshness logic under Ticket 401. Record the mismatch and its reachability condition in `cc-report.md` as an accepted low-probability residual risk. **STOP** if implementation of the required non-result gate unexpectedly depends on resolving this clock-skew behavior or requires a broader time/render architecture change.

---

