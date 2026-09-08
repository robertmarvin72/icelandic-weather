# CC Report — Ticket 401 (Northern Lights: third scheduled refresh + stale-policy alignment)

Executed against: `docs/ai/tasks/ticket-401/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS), including its "Approved Round 2 analytics clarification" section.

## 1. Mandatory preflight audit

Read before editing: GitHub issue #401 context, `vercel.json`, `api/cron/refresh-aurora.js` + its complete test suite, `api/_lib/aurora/cache.js` + its tests, `api/_lib/auroraDecision/constants.js`/`freshness.js`/`orchestrate.js` + their tests, `src/lib/auroraDecisionClassify.js`, `src/hooks/useAuroraDecision.js`, `src/components/NorthernLightsCard.jsx` + its full test file, Northern Lights analytics conventions (including the `lang`-hardening fix already present on `main` from the prior "add language to Northern Lights events" commit), and every remaining consumer of the audited constants (`grep -rln "AURORA_FRESH_MAX_AGE_MINUTES\|AURORA_STALE_MAX_AGE_MINUTES" api/ src/`).

### Confirmed audit findings (verified against live code, not assumed)

- **`vercel.json` had exactly one Aurora cron entry**, `{"path": "/api/cron/refresh-aurora", "schedule": "0 12,20 * * *"}` (two runs/day, worst-case ~16h gap) — confirmed by reading the file directly.
- **`AURORA_FRESH_MAX_AGE_MINUTES` was `360`; `AURORA_STALE_MAX_AGE_MINUTES` was `1440`** (`api/_lib/auroraDecision/constants.js`) — confirmed.
- **`classifyAuroraCache` (`freshness.js`) uses `source_fetched_at` exclusively**, never `updated_at`, with the documented inclusive boundaries: `ageMinutes > AURORA_STALE_MAX` → `unavailable`/`too_old`; `ageMinutes > AURORA_FRESH_MAX` → `stale`; else → `fresh`. Both comparisons use strict `>`, so raising `AURORA_FRESH_MAX_AGE_MINUTES` to `480` needed no logic change — the existing inclusive-at-exactly-480 behavior falls out of the unchanged `>` comparison automatically. Age is clamped via `Math.max(0, ...)`, already defending future clock skew.
- **Successful refresh path** (`api/cron/refresh-aurora.js` → `persistAuroraSnapshot`): parses, requires a non-empty result, then persists `{ nights, sourceFetchedAt: new Date().toISOString() }` in one atomic `UPDATE` that also clears `refreshing_until` (`api/_lib/aurora/cache.js`). **Failed path**: any thrown error (fetch, empty/invalid parse, or persist failure) skips `persistAuroraSnapshot` entirely and calls `releaseAuroraRefreshLease` instead — the snapshot and `source_fetched_at` are never touched. Confirmed exactly as the prompt's "known live findings" stated.
- **Confirmed the Round 2 non-result stale-event mismatch, reachable and real** (traced the full chain, not assumed): `classifyAuroraOutcome` (`src/lib/auroraDecisionClassify.js`) sets `freshness = body.auroraCache?.state ?? null` unconditionally — before branching on `body.status` — so a `status: "unavailable"` response (mapped to `primary: "domain_unavailable"` or `"no_darkness"`) can still carry `freshness: "stale"` whenever the orchestrator's own `auroraCache` metadata is stale. Confirmed server-side too: `api/_lib/auroraDecision/orchestrate.js`'s `unavailableResponse()` passes through the same `auroraCache` object (built once from `classifyAuroraCache`) regardless of the unavailable `reason` (`night_not_found`, `invalid_darkness_window`, `no_locations_scored`). `NorthernLightsCard.jsx` only renders its stale disclosure inside `AuroraResult`, reached solely for `isResultState` (`primary` ∈ `{success, partial}`) — so before this ticket, the analytics effect's bare `if (classification.freshness === "stale")` check (line ~170, pre-fix) could fire `northern_lights_stale_viewed` for a non-result state where no stale notice is ever rendered. Confirmed via a temporary revert-and-rerun of the new regression tests (§4 below) — they genuinely fail without the fix, not merely pass incidentally.
- **No other consumer of the two freshness constants exists** outside `freshness.js`/its test and `constants.js`'s own comments — confirmed by grep. No hidden coupling to update.

No discrepancy was found between the prompt's stated findings and the live tree. No STOP condition was triggered.

## 2. Exact authorized production changes

### Cron schedule

`vercel.json`: `"schedule": "0 12,20 * * *"` → **`"schedule": "0 8,14,20 * * *"`**, same single `/api/cron/refresh-aurora` entry, same path, no new entries. The blog-draft cron (`"0 8 * * 1"`) is untouched.

**Timezone convention, verified explicitly, not assumed**: Vercel Cron Jobs run in UTC — there is no per-cron or per-project timezone field in `vercel.json`'s `crons` schema, and none was added here (the prompt forbids adding runtime timezone conversion). Iceland observes no daylight saving time (UTC+0 year-round). Therefore `0 8,14,20 * * *` (UTC) maps 1:1 to **08:00, 14:00, 20:00 Reykjavík wall-clock time, every day of the year, with no seasonal drift** — this is a stronger, simpler guarantee than most timezones would give, and is recorded here as the verified basis for the schedule, not a silent assumption of "local server time."

### Freshness threshold

`api/_lib/auroraDecision/constants.js`: `AURORA_FRESH_MAX_AGE_MINUTES` `360` → **`480`** (8h). `AURORA_STALE_MAX_AGE_MINUTES` left at `1440` (unchanged). The module comment was rewritten to describe the new three-run cadence and its actual maximum gaps (6h daytime, 12h overnight) instead of the old two-run schedule, and continues to explicitly disclaim any Vedur.is publication-cadence claim, per the prompt's own STOP condition wording.

**The honest overnight tradeoff, documented, not "solved"**: the new schedule has 6h gaps 08→14 and 14→20, but a 12h gap 20→08. An 8h fresh threshold covers both daytime gaps but not the overnight one — a request made in roughly the last 4 hours before 08:00 (i.e., after 00:00), even when all three scheduled runs succeeded exactly on time, will legitimately see a `stale` (not `fresh`) usable result until the 08:00 refresh lands. This is accepted, intentional behavior per the approved prompt ("can still produce a scheduled stale window overnight before 08:00 even when all runs succeed... do not 'solve' it by silently changing the requested threshold, hard cutoff, or schedule") — not a bug, and not something this ticket's scope permits changing further.

## 3. Successful/failed refresh invariants — verified unchanged, not re-implemented

No line in `api/cron/refresh-aurora.js` or `api/_lib/aurora/cache.js` was modified. Re-confirmed via the full existing `refresh-aurora.test.js` suite (still green, see §6) plus one new deterministic-clock test (§4) that the successful path persists the actual fetch-time timestamp and the failed path never does. Auth-before-lease, the atomic single-flight lease (`UPDATE ... WHERE (refreshing_until IS NULL OR refreshing_until < now())`), no retries, and the failure response contract are all byte-for-byte unchanged.

## 4. Local analytics correction (Round 2)

`src/components/NorthernLightsCard.jsx`, the card-view analytics effect — one-line condition change, using the exact `isResultOutcome` boolean already computed earlier in the same effect (no new classifier, no client-side freshness recomputation):

```js
// before
if (classification.freshness === "stale") {
  trackEvent("northern_lights_stale_viewed", { lang, outcome: classification.primary, tier: isPro ? "pro" : "free" });
}

// after
if (isResultOutcome && classification.freshness === "stale") {
  trackEvent("northern_lights_stale_viewed", { lang, outcome: classification.primary, tier: isPro ? "pro" : "free" });
}
```

Nothing else in the effect changed: the ref-based meaningful-identity guard (`cardViewedRef`, keyed on `${requestKey}:${primary}`), the event name, the exact `{lang, outcome, tier}` payload shape, the effect's dependency array, `northern_lights_card_viewed`, and `northern_lights_unavailable_viewed` are all untouched. No render branch, copy, or UI element changed.

**Verified the fix is both necessary and correct, not just plausible** — I temporarily reverted the one-line guard, reran the six new Round 2 regression tests (§5), and confirmed the four non-result-state tests genuinely failed (asserting `false`, receiving `true` — i.e. the event fired when it shouldn't have) while the two usable-stale-result tests still passed unaffected. Restored the fix and reran — all 51 tests in the file passed. This is a red→green proof, not narrated from memory.

## 5. Required real-shaped regression coverage (Round 2) — added to `NorthernLightsCard.test.jsx`

New describe block, `"NorthernLightsCard — Ticket 401 (#401) Round 2: stale event gated on rendered usable-stale exposure"`, using real Ticket-3-shaped response bodies (not a hand-built `classification` object):

1. `success + stale` → renders the stale notice, emits `northern_lights_stale_viewed` exactly once, with unchanged `{lang, outcome, tier}` payload.
2. `partial + stale` → renders both the partial and stale notices, emits the stale event exactly once.
3. `stale cache + night_not_found` → renders the existing `nl-unavailable` (domain-unavailable) state, no stale notice, no stale event.
4. `stale cache + invalid_darkness_window` → renders the existing `nl-no-darkness` state, no stale notice, no stale event.
5. `stale cache + no_locations_scored`, **both** classification sub-shapes tested separately: (a) unambiguous no-darkness (every excluded location `not_viewable_tonight`) → `nl-no-darkness`, no stale notice/event; (b) ambiguous/generic (mixed exclusion statuses) → `nl-unavailable`, no stale notice/event.
6. Theme + language + an extra ordinary rerender of a usable stale result → the stale event still fires exactly once total, with its original payload unchanged (asserted by re-reading the recorded call after all rerenders).

## 6. Tests, lint, and build actually run

- **New/updated cron-config test** — `npx vitest run api/cron/vercel.cron.test.js` → **3/3 passed** (new file: exactly one `refresh-aurora` entry with the exact new schedule, found by `path` not array index; blog cron unchanged by path; exactly 2 total entries).
- **`freshness.test.js`** — `npx vitest run api/_lib/auroraDecision/freshness.test.js` → **10/10 passed** (8 pre-existing, now exercising the new 480/1440 values automatically since they read the constants rather than hardcoding numbers, + 2 new: the 480min+1ms sub-minute crossing, and the future-clock-skew clamp-to-0/fresh case).
- **`constants.test.js`** (new) — `npx vitest run api/_lib/auroraDecision/constants.test.js` → **2/2 passed** (explicit `480`/`1440` value assertions).
- **`refresh-aurora.test.js`** — `npx vitest run api/cron/refresh-aurora.test.js` → **13/13 passed** (12 pre-existing + 1 new: a `vi.useFakeTimers()`/`vi.setSystemTime()`-frozen clock proving the exact `sourceFetchedAt` string passed into `persistAuroraSnapshot` matches the frozen "now", not a later DB time).
- **`cache.test.js`** — unmodified, re-run for regression → passed (part of the combined run below).
- **Directly relevant orchestration/classifier tests** — `npx vitest run api/_lib/auroraDecision/orchestrate.test.js api/_lib/aurora/cache.test.js api/_lib/auroraDecision/rankDecision.test.js` → **33/33 passed** (one comment-only fix in `orchestrate.test.js` — a stale `360`-minute reference in an inline comment was corrected to `480`; the test's actual fixture, 10h/600min after fetch, was already comfortably stale under both the old and new threshold, so no assertion changed).
- **`NorthernLightsCard.test.jsx`** — `npx vitest run src/components/NorthernLightsCard.test.jsx` → **51/51 passed** (44 pre-existing + 7 new: the six Round 2 cases plus none weakened).
- **Related request-cache/classifier tests** — `npx vitest run src/lib/auroraDecisionClassify.test.js src/hooks/useAuroraDecision.test.js src/lib/auroraDecisionCache.test.js src/lib/auroraSeason.test.js` → **32/32 passed** (none modified; run to confirm no regression).
- **Full suite** — `npx vitest run` → **1063/1063 passed**, 91 files (up from 1048/89 before this ticket — +15 tests, +2 files: `api/cron/vercel.cron.test.js`, `api/_lib/auroraDecision/constants.test.js`).
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded (`✓ built in 6.67s`). Same pre-existing "chunks larger than 500 kB" advisory as every prior run this session, unrelated to this ticket.
- **`git diff --check`** → exit 0. Only pre-existing informational LF→CRLF autocrlf notices on the files this ticket touched; zero actual whitespace errors.

No command was skipped or reported as passing without actually running.

## 7. Files changed

**New:** `api/cron/vercel.cron.test.js`, `api/_lib/auroraDecision/constants.test.js`.

**Modified:** `vercel.json` (schedule), `api/_lib/auroraDecision/constants.js` (threshold value + comment), `src/components/NorthernLightsCard.jsx` (one-line analytics gate), `api/_lib/auroraDecision/freshness.test.js` (+2 tests), `api/cron/refresh-aurora.test.js` (+1 test), `api/_lib/auroraDecision/orchestrate.test.js` (1 comment-only accuracy fix), `src/components/NorthernLightsCard.test.jsx` (+1 describe block, 7 tests).

**Confirmed untouched** (re-diffed after implementation): `api/cron/refresh-aurora.js`, `api/_lib/aurora/cache.js`, `api/_lib/auroraDecision/freshness.js`, `api/_lib/auroraDecision/orchestrate.js` (logic), `src/lib/auroraDecisionClassify.js`, `src/hooks/useAuroraDecision.js`, every other Northern Lights UI/copy/map/scoring/ranking/candidate-roster file, the blog cron, and the entire Ticket 400 deliverable (already committed by the user as `202c9f30` before this ticket began — confirmed via `git log`/`git status` that this ticket's diff contains none of those files).

No dependency was added. No `.tsx`/TypeScript. Not committed. Not pushed.

## 8. Before/after summary

| | Before | After |
|---|---|---|
| Aurora cron schedule | `0 12,20 * * *` (2 runs/day) | `0 8,14,20 * * *` (3 runs/day) |
| Fresh threshold | 360 min (6h) | 480 min (8h) |
| Stale hard cutoff | 1440 min (24h) | 1440 min (24h) — unchanged |
| `northern_lights_stale_viewed` gate | `freshness === "stale"` | `isResultOutcome && freshness === "stale"` |

## 9. Post-deployment verification plan (not performed here — no deployment/GA4 monitoring is authorized in this task)

1. After deploy, confirm Vercel's cron dashboard/logs show successful `/api/cron/refresh-aurora` invocations at all three daily UTC slots (08/14/20) for several consecutive days.
2. Query the `aurora_forecast_cache` row's `source_fetched_at` and confirm it advances only immediately after those successful invocations — never after a failed/skipped one, and never tracking `updated_at` alone.
3. In GA4, monitor `northern_lights_stale_viewed` over several comparable days post-deploy.
4. Compare event rate/exposure **segmented by `lang`, `tier`, and `outcome`** against the pre-change baseline — raw total-count comparisons alone are not meaningful here, since both the schedule and the threshold changed together.
5. Explicitly account for the intentional 20:00→08:00 gap and time-of-day traffic patterns (e.g., disproportionately more early-morning stale exposures is expected and correct, not a signal of a problem) before interpreting any residual stale events.
6. Treat an unexplained stale exposure clustering during an *expected-fresh* window (shortly after a scheduled run, assuming it succeeded) as a possible missed/delayed refresh — worth checking Vercel's cron logs for that specific slot.

This plan is a documented post-deployment owner responsibility, not something this implementation task performed.

## 10. Deviations and residual risks

1. **Clock-skew residual risk — accepted as documented, not fixed**, per the approved prompt's explicit instruction. `formatAgo` in `NorthernLightsCard.jsx` returns `null` when `nowMs - sourceFetchedAt < 0` (client clock behind server-derived fetch time), which would suppress the visible "data is N hours old" stale notice text even for a canonical `success`/`partial + stale` result, while the server-derived `northern_lights_stale_viewed` event still fires correctly. Reaching this requires the client's clock to lag the server's enough that server-old (>8h) stale data appears future-dated locally — an extreme, low-probability clock-skew scenario. No refactor of `formatAgo`, no new wall-clock predicate threaded through analytics/rendering, and no negative-age clamping was made, exactly as instructed. Recorded here as an accepted, out-of-scope residual risk.
2. **`orchestrate.test.js`'s stale comment reference (`360` → `480`) was corrected** as a direct, unavoidable consequence of changing the constant it describes — a one-line comment edit, no assertion changed (the test's actual fixture, 600 minutes after fetch, was already well past both the old and new threshold). Flagged for transparency, not hidden.
3. **The two new `no_locations_scored` regression cases (§5, item 5) required auditing `classifyAuroraOutcome`'s `isUnambiguousNoDarkness` branch logic directly** to construct genuinely representative fixtures for both its unambiguous (no-darkness) and ambiguous (domain-unavailable) sub-shapes — this was preflight-audit work, not a change to that function, which remains untouched.
4. No other risk identified: scoring, ranking, bands, candidate roster, request caching, checkout attribution, UI copy/visual design, single-flight locking, auth, retry behavior, the 24h hard cutoff, and every other cron job are all confirmed unchanged and re-verified green, not merely assumed. The Ticket 400 uncommitted-work concern in the prompt's hard-scope section turned out to be moot — the user committed Ticket 400 before this ticket's work began (confirmed via `git log`), so there was no pre-existing uncommitted state to accidentally disturb; this ticket's diff is cleanly isolated to its own files (confirmed via `git status`).

## 11. Confirmation

Explicitly confirmed: no other cron entry changed; the 24h/1440min hard cutoff and unavailable behavior are unchanged; cache schema/migration/read-write boundary are unchanged; scoring/ranking/bands/reasons/candidate roster/Free-Pro gating are unchanged; UI copy/visual design/map/list behavior are unchanged; the provider access path (single-flight, auth-first, no-retry, server-only Vedur.is access) is unchanged; no dependency was added.

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**
