# #452 — Ripley initial prompt, Round 1

2026-10-20. Discussion for Jonesy; NOT execution authorization.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/452
Title: Laga vindeiningu og vindviðvörun í norðurljósaspá

## Objective and authorized scope

Fix the Northern Lights wind-unit mismatch without changing numeric scoring, threshold/comparator, provider/account access or general UI. The issue explicitly requests the narrow server-side Open-Meteo request correction plus normalization/cache/UI verification; this is the ticket-specific exception to the generic client-only rule, not authority for a backend redesign. Owner selected #452 in established Ripley session. #450 CLOSED; preserve its research and archives. Initial tree already has modified CURRENT and untracked ticket-450 history, no application changes: preserve them, do not infer production deployment from this checkout.

User entrypoints already exist: NorthernLightsThreeNight on homepage and /en/northern-lights, rendering AuroraNightOutlook. No new page/control. Legacy NorthernLightsCard is unmounted and not a new feature target, but its shared helper regressions should remain green.

## Independent read-only audit findings

- api/_lib/auroraDecision/openMeteo.js buildOpenMeteoUrl requests public /v1/forecast, UTC, cloud/precipitation/windspeed_10m/visibility but no wind-unit parameter. normalizeOpenMeteoHourly maps numeric windspeed_10m unchanged to windSpeed; null/nonfinite stays null. No conversion here today.
- src/lib/auroraScoring.js HIGH_WIND_MS_THRESHOLD=12, actual comparison **maxWind != null && maxWind >= 12**. It pushes high_wind only; comment explicitly excludes wind from numeric score. Preserve scorer byte-for-byte if possible, no threshold edit.
- AuroraNightOutlook selects displayed qualifying best, reads flags.includes('high_wind') and renders nlHighWindNote in nl3-result. Trace all-poor/other branches and ranking/display selection before promising every flagged location has the same visible text. Do not add new UI merely to display flags in branches that do not do so today.
- api/aurora-decision POST returns Cache-Control no-store. Orchestrate reads existing aurora snapshot through aurora/cache then fetches weather/fanout and computes decision; CC must trace all cache writes/fields before deciding whether wind is persisted. Do not assume aurora_forecast_cache contains scored weather simply because it is named cache.
- src/lib/auroraDecisionCache is in-memory promise reuse per evening/locations for 5 minutes, retry invalidates; no persisted wind cache identified in that module. Inspect useAuroraDecision/useAuroraThreeNight and service worker runtime rules end-to-end. Workbox Open-Meteo GET caching is a separate known research finding and not authorized for general changes here.
- Current Open-Meteo forecast documentation lists canonical `wind_speed_unit=ms` (default kmh), source https://open-meteo.com/en/docs?latitude=47.8&longitude=-101.5 read 2026-10-20. Keep existing hourly variable names; supported query parameter does not imply rename of windspeed_10m response field. CC verifies documented response contract rather than assuming modern field aliases.

## Implementation contract

1. Repeat read-only trace request -> provider response units -> normalization -> scorer flags -> ranking/display -> both UI hosts, and every relevant cache/store before editing. Record actual units and ownership in report. No changes to weather data flow outside this dedicated aurora path.
2. Add explicit canonical wind_speed_unit=ms to buildOpenMeteoUrl. Preserve origin, all locations/dates/UTC/timeouts/fanout/other fields and error handling. No customer-api/key/access-plan fix, model-selection or provider switch. Do not send both conflicting unit parameters. Tests parse searchParams and check exact ms, unrelated params preserved.
3. Provider ms numbers pass unchanged through normalization (no /3.6 after requesting ms). Missing/null/undefined/NaN/invalid wind remains null; never zero/logn. If endpoint response metadata explicitly disagrees with requested unit, stop/report the evidence before inventing a broad compatibility converter; no double conversion or assumption that all historical payloads now mean ms.
4. Preserve >=12 m/s exactly and numeric scoring/bands/rank behavior for equivalent non-wind inputs. Before/after example: default 18 km/h used to be passed as 18, triggering high_wind; physically equivalent ms response 5 must not. 11.9 no flag,12 flag,12.1 flag (or more precise epsilon), relevant window max drives existing rule. Existing cloud/activity/etc unchanged.
5. Cache disposition required, not optional: inventory snapshot schema/content, raw-weather/decision caches, client promise cache and service-worker POST behavior. If no wind-bearing persisted cache exists, prove with write/read paths and document no DB invalidation needed; do not mutate aurora astronomical snapshot or source freshness. New provider URL includes ms and is a different GET cache key; server fetch vs browser cache boundaries documented. Only introduce a narrowly required units/version boundary if a real reused wind-bearing store is found, with tests; if it requires schema/global worker/cache/account changes, STOP for scope review.
6. Do not claim deployment instantly fixes old tabs. In-memory old decisions may survive up to existing 5-minute TTL or explicit retry/reload. Document bounded old-client behavior and test retry/refetch obtains corrected response. If the issue demands immediate existing-tab purge beyond current lifecycle, stop and report options rather than add global polling/cache purge. No production DB/cache purge or deploy during implementation.
7. UI verification uses existing nlHighWindNote and same rendered candidate/date. No wording redesign/official-warning service; #436 caution-source decisions remain binding. Report whether visible wind note is attached to selected best only and whether all-poor has a note; preserve existing semantics. No affiliate event/eligibility or free/pro changes.

## Targeted tests and acceptance

- buildOpenMeteoUrl and fetchLocationWeather tests: explicit documented ms request, legacy hourly fields/UTC/dates unchanged, realistic hourly_units metadata ms; normalization 5 remains5, >=12 stays unchanged, no double conversion; missing invalid values nullable.
- Integration through real fetch/normalize/scorer (network mocked, actual functions): 18km/h/5m/s equivalence example, >=12 boundary and non-wind numeric-score parity. Do not prove this solely by feeding hand-written scorer rows or bypassing URL/normalization. Existing multi-location isolation/timeouts remain green.
- Scorer tests below/at/above12, missing wind, max across valid time window, otherwise-identical cloud/activity scores and bands. Keep scorer implementation unchanged; add tests to existing file or new focused file as appropriate.
- Actual shared module/landing/homepage fixtures show note absent for corrected5, present at/above12 when selected displayed result is qualifying; real dictionary IS/EN, forced EN landing despite saved IS. Verify selected other night/current best metadata, loading/error not false reassurance. Trace lower-ranked flagged candidate does not falsely label displayed unflagged best. Existing all-poor behavior observed, not arbitrarily redesigned.
- Cache tests prove actual no-store/promise TTL/retry behavior relevant to correction. Mock old decision before refresh and corrected after explicit retry/reload; stale/missing state must not fabricate calm. If no persisted wind cache, report exact code paths not merely a green suite. Do not change TTL/freshness to hide flags.

Run existing api/_lib/auroraDecision openMeteo/fanout/orchestrate/rankDecision tests and api/aurora-decision tests, auroraScoring, auroraDecisionCache/useAuroraDecision/useAuroraThreeNight, NorthernLightsThreeNight, landing and App NL integration suites plus new focused tests. Resolve names using rg --files. Final full npm run test:run, npm run lint, normal npm run build after final edits; exact commands/fresh counts and limitations, do not copy prior figures.

Browser evidence using fresh production build and deterministic API mocks: homepage IS/EN and forced-EN landing, mobile320 and desktop, note present vs absent physical-equivalence fixtures and selected-night changes. Inspect screenshots and accessible text; native unit/query integration established by server tests, not browser mocks. No live accounts/Neon/payment/GA/provider probes required for acceptance; primary docs sufficient unless response contract remains uncertain. Label mocked/real checks accurately. Evidence outputs/ticket-452-browser-evidence, preserve prior artifacts and source research. Show status implemented/reviewed only, never production without owner deployment evidence.

## Report, STOP rules and workflow

Report docs/ai/tasks/ticket-452/cc-report.md: baseline/git scope, changed files, supported-unit source, before/after flags and SAME numeric scores, exact tests, UI trace, cache/store matrix and old-tab limit, screenshots, unresolved assumptions. No secrets/env/account inspection. Protect src/lib/auroraScoring.js thresholds/math, shared forecast data/provider/access, gates/analytics, db/cache schema, API not related to aurora units. Narrow request/contract/cache version changes only if demonstrated necessary; STOP on broader reach. Do not implement #450's weathercode/Workbox/account findings or #437 wind taxonomy.

No commit/push/deploy/GitHub issue closure or production mutation. Jonesy reviews Round1 and appends APPROVED/REVISE here without implementation. After approval Ripley creates approved-prompt-v1 and sets READY_FOR_CC. CC on owner Prompt approved verifies pointer, sets CC_IN_PROGRESS, executes approved scope, writes report/populates path and sets CC_COMPLETE; Jonesy result review and Ripley final assessment follow. No Qwen experiment requirement for #452. This discussion file never authorizes execution.

---

# Jonesy Round 1 review — 2026-10-20

Reviewer: Jonesy (technical peer reviewer; no implementation). Reviewed against the live source snapshot staged this session, not against Ripley's description alone.

## Verdict: APPROVED with conditions N1–N10

Scope, ordering and STOP rules are sound. Ripley's audit matches the source: no wind-unit parameter in `buildOpenMeteoUrl`; `windspeed_10m` passes unchanged to `windSpeed`; scorer compares `maxWind >= 12` (`HIGH_WIND_MS_THRESHOLD`, comment says m/s) and pushes only the `high_wind` flag (numeric score/band unaffected); `/api/aurora-decision` is POST-only with `Cache-Control: no-store`. The fix is genuinely one request parameter plus verification. Conditions below must be copied into approved-prompt-v1.md.

Severity summary: 0 BLOCKING; 1 MEDIUM (N1/N2, silent no-op risk); the rest LOW/clarity.

## Independently confirmed (from source)

- **Flag-only exposure.** `rankDecision` passes `flags: scored.flags`; no wind value leaves the server. The only user-visible consequence of the unit bug is `nlHighWindNote`.
- **Visible-note scope.** `AuroraNightOutlook.jsx` (~lines 237–248) takes `best = display.qualifyingLocations[0]`, reads `best.flags.includes("high_wind")` and renders the note under that one best. The all-poor branch (`data-testid="nl3-all-poor"`) renders no wind note. A flagged lower-ranked location does not label the displayed best. Legacy `NorthernLightsCard.jsx` (~393) has the same note but is unmounted.
- **No wind-bearing persisted store found.** `persistAuroraSnapshot` stores only `{nights}` in the `aurora_forecast_cache` singleton (id 1); `api/cron/refresh-aurora.js` persists only `nights` + `sourceFetchedAt`. Weather is fetched per request in `orchestrate` → `fanout` → `fetchLocationWeather` and not written anywhere I read. Client cache `auroraDecisionCache.js` is an in-memory `Map`, TTL 5 min; `useAuroraDecision` retry calls `load(..., {forceFresh:true})` which invalidates first. `sessionStorage` use found only for the details toggle.
- **Service worker.** `vite.config.js` Workbox `runtimeCaching` has only a GET rule for `https://api.open-meteo.com/v1/forecast` (browser-originated) and OSM tiles. `/api/` is in `navigateFallbackDenylist`; no rule matches POST `/api/aurora-decision`. The aurora Open-Meteo call is made server-side, so that rule is not on the aurora path.
- **Repo precedent for the other spelling.** `src/lib/forecastCache.js` (line ~63) and `api/forecast.js` (lines ~35, 90) use the legacy `windspeed_unit=ms`. The #450 retained sample (`samples/openmeteo-baseline-4point.json`) was fetched with `windspeed_unit=ms` and returned `hourly_units.windspeed_10m: "m/s"` — VERIFIED SAMPLE for the legacy name only.

## Conditions

**N1 (MEDIUM) — silent no-op risk on the parameter name.** Open-Meteo ignores query parameters it does not recognise. If `wind_speed_unit` were misspelled, unsupported on this endpoint/plan, or shadowed, the response silently stays in km/h, the bug persists, and a test that only parses `searchParams` still passes. Evidence today: `wind_speed_unit` = VERIFIED DOCUMENTATION (Ripley, 2026-10-20; I did not fetch it independently); `windspeed_unit` = VERIFIED SAMPLE (#450) plus in-repo precedent. Ripley's choice of the canonical name is acceptable, but the report must (a) name which spelling was used and its evidence grade, (b) state plainly that tests with mocked fetch prove our request/normalization code, not provider behavior, and (c) never send both spellings. Switching to the legacy spelling instead is also acceptable if Ripley prefers sample-backed evidence; if so, state that decision in approved-prompt-v1.md. Do not unify the spelling across the repo and do not touch `forecastCache.js` / `api/forecast.js`.

**N2 (Ripley decision needed before READY_FOR_CC) — runtime unit guard.** Contract item 3 says "stop and report" if response metadata disagrees; that is a dev-time instruction and has no defined runtime behaviour. Recommendation: add a small, tested check in `normalizeOpenMeteoHourly` (or its caller) on `hourly_units.windspeed_10m`: if present and not `"m/s"` → treat `windSpeed` as `null` for all rows (flag lost, score unaffected, no 500, no conversion, no /3.6); if `hourly_units` is absent → pass values through unchanged (existing fixtures such as `api/aurora-decision.test.js`, which omits `hourly_units` and uses `windspeed_10m: [1]`, must stay valid). This turns a silent km/h regression into a visible, tested null-wind outcome instead of false "windy" notes. If Ripley declines the guard, the prompt must say so explicitly and the report must record that production unit correctness is docs/sample-backed only and unverified until the first post-deploy response (an owner-side, separately approved check; CC does no provider probe). Either way: no broad converter, no double conversion.

**N3 — test through the real pipeline.** The fetch mock should honour the requested spelling (return km/h-scaled values when the unit parameter is absent, m/s values when present) so that the test fails if the parameter is dropped or misnamed in code; also assert the captured URL via `new URL(...).searchParams` (exact `ms`, other params and UTC/dates unchanged, no second unit parameter). Drive `fetchLocationWeather` → `rankDecision`/scorer with actual functions, not hand-built scorer rows. Label results as "simulated provider contract (mocked fetch)".

**N4 — before/after with identical scores.** Report must show, for the same fixture: old behaviour (no parameter, 18 returned) → `high_wind`; new (5 returned) → no flag; and that `score`, `band`, and rank order are identical in both. Boundaries 11.9 / 12 / 12.1 at the scorer; null/missing/NaN stays null (the "zero/logn" wording in contract item 3 reads as a typo — intent: never coerce to zero).

**N5 — cache matrix from code paths.** The report table must cite, per store, the write path and read path (file:line): `aurora_forecast_cache` (nights only), cron persistence, per-request weather (not persisted), `auroraDecisionCache` (5 min, retry invalidates), POST no-store, SW rules (GET api.open-meteo.com browser rule not on aurora path; no POST/`/api` rule). CC must run a repo-wide grep for any other writer of weather/decision data (I only read the files listed above) and for any HTTP/CDN caching of the server-side fetch; anything not seen is INFERRED or UNKNOWN, not asserted. Conclusion "no invalidation needed" stands only if that grep supports it. Do not mutate the snapshot or `source_fetched_at`.

**N6 — old-tab limit and hook coverage.** Read `useAuroraThreeNight.js` fully (I did not) and confirm it adds no persistence beyond `useAuroraDecision`. Document: after deployment an open tab can show the old (over-flagged) decision for up to the 5-minute TTL or until retry/reload; do not claim instant correction; no polling, no TTL change, no purge. A test should show retry/refetch after a mocked old response yields the corrected response.

**N7 — UI claims limited to what is traced.** Report: note attaches to selected qualifying best only; all-poor shows none; selected-night changes re-evaluate against that night's best. No UI source, translation or wording edits expected; if any seem necessary, STOP. Expected and intended visible effect: the wind note will appear far less often (old behaviour flagged ≥12 km/h ≈ 3.3 m/s, new flags ≥12 m/s ≈ 43 km/h). State that in the report so the owner is not surprised. Whether 12 m/s is the right caution level is out of scope (#437).

**N8 — scorer untouched.** `src/lib/auroraScoring.js` must show zero diff (CC reports `git diff --stat` for it); new scorer tests go in test files only.

**N9 — test discovery.** I could stage only a subset of the tree: of the files named in the contract I saw `api/_lib/auroraDecision/openMeteo.test.js` and `api/aurora-decision.test.js`; I did not see fanout/orchestrate/rankDecision/scorer test files, but that does not prove they do not exist. CC resolves names with `rg --files`, lists which of Ripley's named suites exist, and reports missing ones explicitly rather than dropping them silently. If no scorer test file exists, create a focused one.

**N10 — evidence labelling and report hygiene.** Browser evidence uses mocked API responses and must say so; native request/unit behaviour is established only by the server-side tests (N3) and docs (N1). Status vocabulary: implemented/reviewed, never "fixed in production". Report lists exact commands with fresh counts for the targeted suites, full `npm run test:run`, `npm run lint`, `npm run build`, git baseline, changed-file list, and an explicit "files not changed" list (`auroraScoring.js`, `AuroraNightOutlook.jsx`, translations, `forecastCache.js`, `api/forecast.js`, vite/Workbox config, cache schema).

**Additional STOP triggers** (add to Ripley's list): the guard (N2) needs changes outside `openMeteo.js` and its tests; a wind-bearing persisted store is found; any change to the other `windspeed_unit` call sites seems required; any UI or scorer edit seems required; CC is tempted to run a live provider probe.

## Non-blocking notes

- Contract text says Initial tree has "modified CURRENT and untracked ticket-450 history": CC should record the baseline from its own `git status`, not copy that sentence.
- The existing aurora-decision end-to-end test fixture (`windspeed_10m: [1]`) is far below 12 under either unit and proves nothing about the fix; do not cite it as coverage.

## Limits of this review

- I have no shell, git, test, lint, build or browser access on the owner's machine and ran none; all findings are from reading staged file snapshots (line numbers approximate).
- I did not fetch Open-Meteo documentation or probe the provider; `wind_speed_unit` support is relied on from Ripley's 2026-10-20 reading and the #450 sample covers only the legacy spelling.
- Not read or only partly read: `useAuroraThreeNight.js`, `auroraDecisionClassify.js`, `auroraCandidateRequest.js`, `freshness.js`, `constants.js`, most test files, deployment/CDN configuration beyond `vercel.json` and `vite.config.js`. Absence of other wind-bearing caches is established only for the files I read (N5 asks CC to close this).
- This review is not execution authorization; Ripley creates approved-prompt-v1.md and the owner's "Prompt approved" starts execution.


---

## Ripley approval handoff — 2026-10-20

Jonesy APPROVED Round 1 conditions N1–N10 incorporated verbatim into approved-prompt-v1.md. N1 decision: canonical wind_speed_unit=ms, documentation-backed; no live provider verification claim. N2 decision: accept the narrow runtime metadata guard, unknown wind on explicit non-m/s metadata, compatibility pass-through when metadata is missing. No scorer/UI changes. A wind-bearing persisted store is a STOP, superseding the initial cache-version allowance. TTL bounds reuse; it does not promise automatic refresh of rendered state. Approved prompt records these binding clarifications. CURRENT advanced to READY_FOR_CC; no application changes or execution performed by Ripley. Owner handoff to CC: Prompt approved.
