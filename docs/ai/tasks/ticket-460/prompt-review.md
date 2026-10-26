# #460 — Ripley initial prompt, Round 1

2026-10-26. Discussion for Jonesy, NOT execution authorization.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/460
P0: Óþekkt leiðarveðurgögn mega ekki skila LOW áhættu.

## Goal / authorized scope

Fix existing campsite Route Planner route-weather missing-data handling, not a new Winter Route Advisor. All failed/unusable point forecasts must produce explicitly unknown/unavailable evaluation, never fabricated calm/LOW. Preserve complete-data thresholds/scoring and existing entitlement/canonical tone. Source437 F04/RC17 synthetic reproduction; Expert Support10:00/19:30/39:40 is owner paraphrase context, not direct report of this bug or institutional endorsement. #463 local PASS, instructions updated;460–462 not implemented. Initial git status clean; CC records own baseline. No subagents/commits/push/deploy/GitHub mutation.

## Read-only findings

routeRisk.js estimates7 interpolated straight-line points, uses daily index1 (tomorrow), initializes wind/gust/rain maxima0, skips missing forecasts, nullish values->0. NaN/string/negative not reliably validated. A thrown getForecast currently aborts whole estimator. classifyRouteRisk compares >=wind14/18 and gust20/24 from HAZARDS_V1; rain not part of category. Do not change interpolation/sample count/date semantics or portray as real road geometry/current driving safety.

useRoutePlanner.js only runs route risk for qualifying candidate/non-stay and coordinates; cancellation guard exists; catch sets null. Trace loading/reset/candidate identities before edits, stale old risk cannot label a new candidate.

Consumers found: RoutePlannerCard.jsx (many HIGH/MED checks, !==LOW branches and ternary fallback LOW); routePlannerDetailsHelpers.getRouteRiskSummary falls through unknown strings to Low; RoutePlannerDetailsModal consumes summary; routePlannerSummary changes raw move->consider for HIGH; routePlannerNarrative adds HIGH/MED sentences. Audit every consumer/analytics/copy use repo-wide. A new string alone is unsafe; no unknown fallback to Low. Preserve #440 focus/scroll behavior and #436 own-assessment/source notes.

## Proposed coverage/data contract — Jonesy reviews before execution

No arbitrary minimum percentage/new meteorological threshold. Treat a point's wind and gust independently as valid only when finite numeric nonnegative;0 is valid, null/undefined/NaN/Infinity/string/negative missing/invalid (do not coerce). Complete route wind evaluation requires both relevant wind and gust values at every actually requested point at existing target index. Rain tracked separately, not used to declare wind coverage missing or to invent wind severity. Missing rain remains null if no valid rain samples. Record requested/returned/valid counts per variable and explicit complete/partial/unavailable status; no fabricated0 for unobserved maxima.

Suggested public result preserves routeRisk LOW/MED/HIGH for complete inputs and adds UNKNOWN for incomplete wind/gust coverage, with nullable observed maxima and coverage metadata. Preserve highest observed wind/gust MED/HIGH as separate observedSeverity/known signal for incomplete coverage, explicitly a lower-bound signal not a complete route assessment. No observations=>no observed severity. Partly-observed subthreshold readings must not produce LOW reassurance. This is a proposed conservative completeness contract, not a new risk threshold; if incompatible with actual consumer behavior, STOP and present options before changing recommendation semantics.

All existing HIGH-driven move->consider behavior must remain for complete inputs, and known HIGH in partial data must not silently lose its existing caution/override. Unknown alone must not invent HIGH or change campsite score/rank/engine decision; it adds visible uncertainty to current route-weather presentation. If preserving known-HIGH behavior while separating overall UNKNOWN requires wider recommendation redesign, STOP for owner scope decision. No automatic claiming safe travel from any category.

## Implementation requirements

1. Repeat audit-first estimator->hook->summary/narrative/card/modal chain and enumerate each branch's UNKNOWN/partial/known-high outcome. Finalize explicit result contract consistent with above before coding. Preserve all full-valid results/thresholds and Free/Pro input/gating rules. No generic scoring/forecastNormalize/hazardWindow cleanup.
2. Per-point fetch failure returns unavailable point and processing continues; reject/invalid/missing handled without whole-route false calm. Do not add retries/new requests/cache/timeout/provider changes. Inspect getForecast contract first. Point coverage counts deterministic and raw forecasts never mutated.
3. Hook distinguishes not-requested/loading/unknown/failed/completed, preserves cancellation and resets per candidate/base/forecast identity. A catch cannot erase an existing valid caution into reassuring state or leave old risk displayed for a new pair. Keep scope narrow, no polling/new analytics.
4. Explicit UI cases, no ternary default Low: unknown message says route-weather data insufficient; partial coverage visible when any wind/gust point missing, known caution labelled as observed incomplete evidence. Exact counts can stay in details/debug if main card would be cluttered. IS/EN translation keys, truthful tomorrow/time context. No official warning identity or safety guarantee. Preserve preview access: do not unlock destination/details for Free; show uncertainty only in legitimate existing route-risk entrypoints with approved entitlement. Existing hazards independent from route-risk remain visible.
5. Narrative and canonical summary must not confuse UNKNOWN with LOW, HIGH or recommendation-confidence proof. Inspect every !==LOW condition, fallback and render gate. Existing source-note single-note/count/icon semantics remain green. No broad copy/meteorological vocabulary changes (#462 separate), weighted wind semantics (#461 separate).

## Tests / browser acceptance

Add focused estimator tests (no current routeRisk test discovered, confirm via rg) for all-failed null/rejection, empty daily/missing index, all missing, one variable only, mixed partial/knownHIGH/MED vs subthreshold, legitimate zeros, NaN/Infinity/string/negative, missing rain, complete calm/windy. Existing wind/gust >= boundaries unchanged; return shape assertions include nullable values/coverage. Reproduce437 RC17 before/after. Real getForecast response shape, not hook-incompatible stub.

Targeted hook tests cover delayed completion/cancellation/new-candidate race and thrown point fetch; actual consumers tests unknown/partial/full statuses and known-high preservation in summary/narrative/card/modal IS/EN. Existing canonical-tone/#436 caution/#440 accessibility tests unchanged unless a new requirement legitimately extends them, never weaken assertions. Demonstrate no new unknown-as-low branch, no LOW fallback on malformed category.

Browser deterministic mocks on fresh production build using actual Route Planner UI/hook chain and legitimate non-preview entitlements: complete calm, total failure, partial calm and partial observed-high. Inspect card+details in IS/EN at320 mobile and desktop; no layout/focus/scroll regressions; loading->new candidate no stale data. Retain reproducible script/screenshots/results under outputs/ticket-460-browser-evidence. Assert displayed uncertainty/caution and absence of Low/false-safe wording, not just screenshot existence. Partial HIGH must retain applicable caution. No live provider/accounts/keys needed.

Run focused estimator/hook/summary/narrative/details/card/canonical/caution/table suites, full npm run test:run, npm run lint and npm run build after final edits. Exact commands/counts, baseline warnings/failures explicit. Browser evidence must correspond to final build; describe mocks/emulation limits, no production claims.

## Report / STOP / lifecycle

Write docs/ai/tasks/ticket-460/cc-report.md: baseline, consumer matrix, finalized coverage policy, per-variable validity/missing semantics, full-data parity and partial-high outcomes, changed files, test/browser commands/results, screenshots and limits. Missing rain independent from wind classification; sampled straight-line/tomorrow limitations explicit. No secret/env inspection/provider/model/threshold/gating/payment changes, no new library/backend/scoring work. STOP if policy conflicts require beyond described scope, route-date/geometry redesign or new risk model. No commit/push/deploy/GitHub mutation.

Jonesy reviews draft and appends APPROVED/REVISE. Ripley resolves conditions before approved prompt/CURRENT READY_FOR_CC. CC on owner Prompt approved verifies pointer, sets CC_IN_PROGRESS, executes approved file only, writes report/populates path and sets CC_COMPLETE. Jonesy result review, Ripley final assessment. prompt-review is discussion only.


---

## Jonesy Round 1 review — 2026-10-26

**Verdict: APPROVED with conditions J1-J12.** Scope, STOP rules and the "no new threshold" stance are right, and the audit-first structure is correct. I verified the prompt's source claims (below) and found them accurate. J1 is a real design improvement that Ripley should decide before the approved prompt is written; J2-J6 close gaps that would otherwise make CC's evidence misleading or break existing tests; J7-J12 are tightenings. No second review round is needed unless J1 is resolved differently from my recommendation in a way that changes the consumer contract.

### Verification basis (read-only, staged snapshots; nothing run on the owner's machine)

Read `routeRisk.js`, `useRoutePlanner.js`, `forecastCache.js`, `routePlannerSummary.js`, `routePlannerNarrative.js`, `routePlannerDetailsHelpers.js`, `RoutePlannerCard.jsx` (route-risk branches), `RoutePlannerDetailsModal.jsx`, `RouteCompareTable.jsx`, `config/hazards.js`, `HazardSourceNote.jsx`, `i18n/translations.routePlanner.js`, the Route Planner card/modal/narrative/helpers tests, and #437 `reference-cases.md` plus `github-followups/missing-data.md`.

**Confirmed true:** 7 interpolated points via the hook; daily index 1; maxima initialised to 0; `?? 0` for nullish; `Math.max(0, NaN)` yields NaN and NaN compares false, so it classifies LOW; numeric strings are coerced by `Math.max`; negatives collapse to 0; a rejected `getForecast` aborts the whole estimator; `classifyRouteRisk` uses `>=` against 14/18 (wind) and 20/24 (gust), rain is returned but unused; `getRouteRiskSummary` falls through to "Low" for any unknown string; the card has `!== "LOW"` gates and a ternary that falls back to "Low"; the narrative and summary only act on HIGH/MED. No `routeRisk` estimator test and no `useRoutePlanner` test exist in the staged tree. RC-17 in #437 is a stub returning `null` for all (4) sampled points.

### Conditions

**J1 - Decide the contract shape before coding; I recommend monotone, not "UNKNOWN plus observedSeverity".** Observed maxima are lower bounds: any observed wind or gust at or above MED/HIGH stays valid when other points are missing. So the simplest safe contract is: `routeRisk` is `HIGH` or `MED` whenever an observed value reaches that threshold (even with partial coverage); `LOW` only when coverage is complete and below MED; `UNKNOWN` when coverage is incomplete and nothing observed reaches MED; plus `coverage` metadata (status complete/partial/unavailable and requested/valid counts per variable). With this shape every existing HIGH/MED consumer (summary override, narrative, about 8 card branches, the source-note gate, the modal) keeps working for partial-high without edits, and only the LOW/UNKNOWN edges need new code. The prompt's variant (UNKNOWN as the overall value plus a separate `observedSeverity`) forces every one of those branches to read two fields and is the higher regression risk. If Ripley keeps the prompt's variant, require one shared "effective level" helper used by all consumers so no branch can check `routeRisk === "HIGH"` directly, and enumerate which consumers change. Either way: partial MED/HIGH must be labelled as a lower bound ("at least", observed on N of M points) in the UI.

**J2 - Name the real failure paths and reproduce both.** Through the real `getForecast`, a failed point fetch is a rejection (non-OK response or invalid payload throws; it never returns `null`), so today an all-failed route does not produce LOW: the estimator throws, the hook catch sets `routeRiskData` to `null`, and the card renders nothing. LOW-from-missing-data happens when `getForecast` resolves with `daily` missing, empty, or containing `null` entries (the RC-17 stub path, and Open-Meteo `null` values). The report's before/after must show both: (a) RC-17 reproduced with a stub (and with 7 points, as the hook uses, not RC-17's 4), and (b) the real-shape paths: rejection, `null` entries in the arrays, array shorter than index 1. Expected "after" for all of them: unavailable/unknown, never LOW, never silent. Also state explicitly that the new visible "unknown" message replaces today's silent `null`.

**J3 - UNKNOWN versus the #436 source note and caution styling.** `verdictBlockHasIndicator` uses `routeRisk !== "LOW"`, so an UNKNOWN value would silently count as a hazard indicator and render `HazardSourceNote`, and the amber Car caution line would also fire. Specify the intended behavior: my recommendation is that UNKNOWN is a neutral information line (not amber, not a caution badge, no source note), while HIGH/MED with partial coverage keep the normal caution presentation plus a "partial data" qualifier. Add tests that pin the "exactly one source note" rule for HIGH, MED, partial-HIGH, UNKNOWN and LOW.

**J4 - Harden `classifyRouteRisk` at its own boundary.** It is exported and returns LOW for `null`, `undefined`, `NaN` and negatives (RC-01 to RC-10). The estimator must not pass such values, but the function should also stop returning LOW for non-finite input (return `UNKNOWN` or equivalent) so a later caller cannot reintroduce the bug. Keep the numeric `>=` behavior byte-identical and add tests for both.

**J5 - Hook API must stay compatible with existing tests.** `RoutePlannerCard.test.jsx` (and the caution and canonical-tone tests) mock `useRoutePlanner` and return only `routeRiskData` and `routeRiskLoading`, and the card test also mocks `deriveRoutePlannerSummary`. A new `routeRiskStatus` field must therefore be optional: absent means "not requested", and those tests must pass unchanged. Prefer one status derived together with the data (a single state object) over separate booleans so there is no frame where `data=null, loading=false` reads as "failed". Define the states and what each renders: not-requested (stay recommendation, preview, missing coordinates) renders nothing as today; loading; unknown/unavailable; failed (estimator threw, same message as unavailable); complete; partial.

**J6 - Browser evidence must neutralize the forecast cache.** `getForecast` caches in memory and in `localStorage` (`forecast:v8:`, 30 min TTL), so scenarios run in one browser context will serve earlier mocked responses and the "total failure" case may never run. Require a fresh browser context (or cleared storage) per scenario, route interception at `/api/forecast`, a Pro session mock for the legitimate non-preview path, and an assertion that the mocked responses were actually requested the expected number of times. Also state that a production build served by `vite preview` has no `/api`, so everything the page needs from `/api` must be mocked.

**J7 - Two narrative implementations.** `RoutePlannerCard.jsx` defines its own local `buildRouteNarrative` (translated strings) in addition to `lib/routePlannerNarrative.js` (hard-coded Icelandic). Both read `routeRisk` HIGH/MED. The consumer matrix and tests must cover both, and the prompt should say whether the duplicate is touched or left, without refactoring it away.

**J8 - Repo-wide audit is CC's job, with exclusions.** My grep covered only the staged `src` files. CC must repeat the `routeRisk`/`routeRiskData`/`estimateRouteRisk`/`classifyRouteRisk` search across `src`, `api`, `tests`, `scripts` using named directories and excludes (no unscoped root recursion; `.env.local`, `.env.development.local` and `.vercel/` exist at the root), including analytics event payloads and `docs/`. The report must list each file, branch and outcome.

**J9 - "Tomorrow" truthfulness.** The estimator reads daily index 1 and the forecast cache is up to 30 minutes old, so index 1 is "tomorrow" only if `daily.time[0]` is today. Do not change date semantics, but record `daily.time[1]` (the date actually used) in the result metadata, and use it for the UI context text (the unused `routeRiskTomorrow` / `routeRiskBasedOn` keys already exist in IS/EN and can be reused). If `daily.time` is absent, treat the point's date as unverified and say so in the report.

**J10 - Validity rules: keep to what was approved.** "Finite, numeric, nonnegative" is fine; strings are invalid and not coerced. Do not add an upper plausibility bound or any new threshold. Wind and gust are m/s (`windspeed_unit=ms`), consistent with `HAZARDS_V1`; do not touch units. Complete wind coverage per point requires both wind and gust valid, as the prompt says; because classification is an OR of wind and gust, a lone valid value that reaches a threshold still yields MED/HIGH under J1.

**J11 - Known limitation to state, not fix.** Requests are sequential with no timeout, so a hanging fetch keeps the state in loading; the prompt forbids timeouts and retries, so the report should record this as an accepted limitation. Per-point `try/catch` must not change the number or order of requests.

**J12 - Copy and scope guardrails.** UNKNOWN copy must not contain "low", "safe", "fine" or a recommendation, must be IS and EN with parity (run whichever translation-key parity check the repo has), and must not name an official body (#436). `#463` rules apply: report any adjacent fix found rather than including it unless it is inside this scope; no `docs/ai/README.md` or instruction-file edits. #461/#462 and the other `?? 0` defaults (F-05) stay out of scope.

### Checked and fine

Out-of-scope list (no new library/backend/provider/threshold/gating/payment change); no-subagent, no-commit/push/deploy/GitHub rules; preserving preview access (the hook already returns before requesting risk when `isPreview`); preserving `#440` modal behavior and `#436` source-note tests unchanged unless extended; test inventory (estimator, hook race/cancel, consumers IS/EN, malformed category) is the right set; full `test:run`, `lint`, `build` after final edits; retaining browser evidence under `outputs/ticket-460-browser-evidence`; the STOP condition when preserving known-HIGH would require recommendation redesign (J1 makes this unlikely).

### Limits of this review

Staged snapshots only; I ran no tests, lint, build, git, browser or repository script, and read no `.env*`. Consumer enumeration covers only the staged part of `src`, so absence claims (analytics, other pages) are not verified by me. Open-Meteo's actual response behavior for missing values (`null` in arrays versus shorter arrays) is not derivable from the repo; the prompt should treat both as possible. UI wording quality in IS is not assessed.

### Ripley handoff

Please resolve J1 (decision) and fold J2-J12 into the approved prompt (new `approved-prompt-v1.md` for this ticket), set the CURRENT "Approved prompt" field to its path and `READY_FOR_CC`. If J1 stays as the prompt's variant, add the shared effective-level helper requirement and the consumer list.


## Ripley approval handoff — 2026-10-26

Accepted Jonesy J1 monotone contract: partial observedMED/HIGH retained with qualifier, LOW complete-only, UNKNOWN otherwise. J2 real rejection vs null-stub paths corrected; J3 neutral unknown/source-note behavior pinned; J4 independent classifier validity and J5 compatibility retained. J9 actual date metadata/no assumed tomorrow; J6 cache-isolated browser scenarios with meaningful call accounting. ConditionsJ1–J12 copied into approved-prompt-v1.md with binding clarifications. CURRENT -> READY_FOR_CC. No application edits. Owner sends Prompt approved to CC.
