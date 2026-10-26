# #444 — Ripley initial prompt, Phase A Round 1

2026-10-26. Discussion for Jonesy only, NOT execution authorization.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/444
Title: Skýra hitatölur: lægsti/hæsti hiti og rétt skilgreindur meðalhiti
P1. #460 CLOSED/PASS locally; initial git status clean. No subagents.

## Mandatory staging and provenance

Current live issue explicitly requires audit, a bounded implementation proposal and OWNER approval before any code edits; audit alone does not close the issue. Phase A authorized here is read-only mapping + concrete proposal only. Deliver docs in task444, no app/source/test/config/API/translation edits. Owner then selects exact surfaces/semantics/labels/missing behavior before Phase B goes through normal Jonesy prompt review. No approved Phase B file or execution implied by audit PASS.

Expert Support owner-provided paraphrase2026-10-14 at17:40/34:00: show min/max, midpoint of extrema not automatically period mean, mode distinct from mean. Not a verified transcript/official endorsement. #400/#402 daily summaries related, not proof this issue resolved. No mode implementation or new risk/scoring model.

## Ripley starting findings (not exhaustive)

weatherFinderRanking.js computeMetrics sums day.tmax via toNum(default0) divided by slice.length, exposed as avgTemp; rankWarmest uses it in score. WeatherFinderCard formats metrics.avgTemp then weatherFinderAvgTemp (IS meðalhiti). This is a mean of daily max inputs with missing-to0 defaults, not necessarily mean hourly temperature. Do not change shared metric/ranking to make the label true. Audit actual caller/time selection before final claim.

ForecastTable currently renders r.tmin and r.tmax and temperature hazard logic uses extrema; api/forecast and forecastCache request daily temperature_2m_min/max and hourly temperature_2m, no provider mean in inspected lists. forecastNormalize and comparisonUtils consume tmax; trace shared scoring/recommendation use before any proposal. Existing dailyWeatherSummary/day-range rendering and HourlyForecastModal are starting points. No current bug assumption for all surfaces.

## Audit and proposal contract

1. Read complete relevant functions/callers and inventory all active temperature surfaces in src (forecast/card/map/leaderboard/finder/route/details/comparison/share/landing where temperature rendered), api forecast requests, shared transforms/hooks and i18n labels. Scoped rg in named directories, exclude real .env/.vercel/node_modules/dist/unrelated outputs; no root recursion or secret inspection. Distinguish active UI, demo/static, dormant and unknown. Read-only #400/#402/#444 history via configured gh allowed, no auth/token/account or GitHub mutation.
2. Per-surface stable row: entrypoint/consumer source:line+hash, IS/EN label/unit, provider field/computation, raw vs weighted/display/ranking semantics, actual period/time boundaries/timezone, min/max provider-day vs subwindow, data completeness/missing/coercion behavior, conversions, shared scoring/ranking/recommendation consumers and confidence grade. Do not infer hourly mean from field name or averaging daily extrema. Include all keys with mean/average/hiti/temp variants; grade untraced explicit UNKNOWN.
3. Reference docs only if needed to establish actual provider temporal semantics. Current primary Open-Meteo docs for used fields, date/time/unit contracts; cite exact URL/access date/supporting claim. No live forecast/account probe or new provider choice. Repository alone cannot verify production weather/completeness. No copying legal/medical guidance or presenting meeting as standard.
4. Candidate temperature definitions: provider min/max describe provider calendar day only when that date/timezone verified; subwindow extrema labelled selected period, never whole day from a partial sample. True period mean requires provider mean with confirmed same period OR validated complete regular timestamp coverage and finite values with declared averaging method. Missing/duplicate/irregular timestamps and incomplete day must not yield unsupported full-period mean. Do not prescribe24 without first defining timezone/day and forecast cadence; Reykjavik has no DST but source timestamps still must be traced.0/negative legitimate, no coercion of missing to0. Mode not a substitute.
5. Phase A proposes exact changed surfaces/files, what stays untouched, proposed IS/EN wording, temporal definitions, missing-data presentation and before/after examples. Prefer honest label/isolated presentation for existing metrics when feasible; no gratuitous new mean fetch/provider field/API feature. If mean-of-maxima is retained as such, say so and do not relabel as true mean. Show options/minimal recommendation with product decision points, no implementation yet.
6. Shared ranking/scoring/canonical recommendation must be unchanged for identical inputs. Any discovered scoring-data bug recorded separately, not fixed. New presentation helper must not feed back into engine. Even changing finder avgTemp metric changes rankWarmest: do not propose that as mere UI fix. Clear phaseB parity test plan and STOP for unavoidably changed scores/rank/verdict.

## Deliverables and reference cases

Under docs/ai/tasks/ticket-444: audit.md (surface/contract inventory and evidence), implementation-proposal.md (small owner-readable surface list+exact labels+period/missing policy+options), reference-cases.md, cc-report.md. Proposed unapplied diff artifact optional if enough evidence, never alter real files to produce it. No application test files added in audit.

Reference cases with provenance/hypothetical vs observed: asymmetric2,2,2,10 =>mean4 vs extrema midpoint6 (four-sample period example, not24h); missing hour/value; partial day; midnight exclusive end/date rollover;0/negative; no data; daily-provider mismatch to subperiod; duplicate/irregular times. Read-only real-function synthetic calls only after checking for filesystem/network side effects, scratch script inside task folder, no new dependencies/test setup. Unit handling Celsius/Fahrenheit and rounding labelled versus stored precision. Do not claim evidence proves true daily mean if completeness unresolved.

Validation: HEAD/branch/status, source citation hashes, before/after unchanged application/config/test files, git diff --check, retained exact search/read commands. No npm install/full suite/lint/build/browser/service required for read-only audit. Do not run exporters or mutate generated assets. Uncertainty/uninspected surfaces explicitly reported. Existing unrelated files preserved.

## Acceptance / STOP / lifecycle

Audit phase complete only when surface mapping + exact bounded proposed changes/ISEN labels/missing/period policy and unchanged-ranking rationale are ready for owner decision. Missing provider semantics may remain explicit uncertainty/options, not guessed code. No instruction-file edits, new provider/API calls, thresholds/scoring/ranking/gating/payment changes, new library, commit/push/deploy/GitHub mutation.

Jonesy appends APPROVED/REVISE. Ripley approved PhaseA v1 only after review, CURRENT READY_FOR_CC. CC on owner Prompt approved verifies pointer/sets CC_IN_PROGRESS, performs audit only, writes cc-report/populates path/sets CC_COMPLETE. Jonesy result review; Ripley PhaseA assessment presents proposal to owner. Overall ticket remains incomplete/REVISE until approved PhaseB implementation and final review; do not mark CLOSED on audit alone. Use existing RESULT_REVIEW/PROMPT_REVIEW stages, no new stage. PhaseB draft goes normal Jonesy review before any next approved file.

---

# Jonesy review — #444 Phase A Round 1

Reviewer: Jonesy (Claude, technical peer reviewer). Date: 2026-10-26. Reviewed against live source (staged snapshots) of: `weatherFinderRanking.js`, `WeatherFinderCard.jsx`, `WeatherFinder.jsx`, `forecastCache.js`, `forecastNormalize.js`, `comparisonUtils.js`, `scoring.js`, `ForecastTable.jsx`, `HourlyForecastModal.jsx`, `CampsiteComparisonSection.jsx`, `InstantComparison.jsx`, `HomeDecisionCard.jsx`, `api/forecast.js`, `translations.common.js`.

## Verdict: APPROVED with conditions J1-J9

The prompt is read-only, bounded, keeps ranking/scoring frozen and refuses to relabel a mean-of-maxima as a true mean. Ripley's starting findings are correct (below). The main gap is surface coverage: the live code has at least three more "average temperature" consumers than the prompt names, with three different missing-data policies for the same field. Those must be in the audit before any proposal is credible.

## Source claims verified (VERIFIED SOURCE, staged snapshots)

- V1: `computeMetrics` sums `toNum(day.tmax)` (non-finite/null -> 0) and divides by `slice.length`; exposed as `avgTemp`. So a missing daily max is counted as 0 degC and still counts in the denominator.
- V2: `rankWarmest` score = `avgTemp * 0.7 - rainDays * 0.2 - avgWind * 0.1`; the finder card shows `avgTemp` (`toFixed(1)` degC, or `toFixed(0)` degF) followed by `weatherFinderAvgTemp` ("avg temp" / "meðalhiti"). Display and ranking share one number.
- V3: `forecastNormalize` sets `tmax: temperature_2m_max?.[i] ?? null` and `tmin` likewise, i.e. raw provider-day values, while `rain`/`windMax`/`windGust` come from `getDayHourlyMetrics` (hour-weighted via `getTimeWeight`, with `Number(x ?? 0)` coercion). One row therefore mixes two time definitions.
- V4: `forecastCache.js` requests `daily` temperature_2m_max/min and `hourly` temperature_2m with `timezone: Atlantic/Reykjavik`, `forecast_days: 7`; no daily mean field is in that list. `api/forecast.js` whitelists the same temperature fields, but defaults `timezone` to `"auto"` when the caller omits it.
- V5: `WeatherFinder.jsx` ranks `scoresById[site.id].rows`, slice = first `days` (3/5/7; non-Pro forced to 3) starting at index 0 (today).
- V6: `ForecastTable` already has `tempMin`/`tempMax` columns (and a short mobile variant), and hazard logic uses `tmin`/`tmax` guarded by `typeof === "number"`.
- V7: Prompt arithmetic (2,2,2,10 -> mean 4, extrema midpoint 6) is correct.

## Conditions

**J1 - Add the surfaces the prompt does not name (inventory must include these, each with the per-surface row):**
- `src/lib/comparisonUtils.js` `calcMetrics` -> `avgHighTemp` = mean of `tmax` over the first 3 rows with missing values EXCLUDED (not zero). Rendered by `InstantComparison` as an icon-only "thermometer N.N degC" row with no "avg"/"high" wording, and `icTempDelta` ("{diff}degC warmer" / "hlýrra") plus the `diff >= 1.5` -> "temp" improvement classification feed recommendation strength/primaryKey. The file's comment says `HomeDecisionCard` also uses it, but I found no import of it in the staged `HomeDecisionCard.jsx` -> record as UNKNOWN until traced.
- `CampsiteComparisonSection.jsx`: reads `temperature_2m_max` directly from raw daily data (`?? null`), builds its own `tmax` rows (around lines 54 and 418), uses `TEMP_DIFF_THRESHOLD` for a "better" verdict, and shows hourly `temperature_2m` filtered to `hour % 3 === 0` (a 3-hourly subsample - a third time definition).
- `scoring.js`: `basePointsFromTemp(tmax ?? -999)`, `getColdWindPenalty`/`getWintryPrecipPenalty` default a missing `tmax` to 10, `scoreSiteDay` rounds with `round1`. These consume `tmax` as a single-day extreme (not a mean) but are the third missing-data policy.
- `ForecastTable` title tooltip (`Base N (Temp X)` using `r.tmax`), `HourlyForecastModal` (`row.temp`, 0-decimal), and the share/voice label keys `weatherVoiceShareHighTempLabel` ("High"/"Hámark"): trace what each is bound to.
- Negative results must be recorded with the exact command: I saw no temperature/tmax hits in `Top5Leaderboard.jsx`, `MapView.jsx`, `RouteCompareTable.jsx` (hazard type labels only) or `weatherVoiceContent.js`; `src/pages`, `src/hooks`, `src/data`, landing static demo content and blog were not inspected by me, so they stay UNKNOWN until CC covers them.

**J2 - Record the three missing-data policies as separate findings (not fixed):** finder `toNum(...)=0` counted in the denominator; `calcMetrics` excludes missing; scoring `?? -999` (base points) and `10` (penalties); plus `Number(x ?? 0)` for hourly wind/rain. Reference cases must include: all-null `tmax` for a site (finder would show "0.0 degC meðalhiti" and rank it as 0 degC) and a partial series such as `[10, null, 10]` (finder 6.7 vs `calcMetrics` 10.0). Label these hypothetical unless a real payload is observed; do not claim they occur in production. Changing the finder coercion changes `rankWarmest` output, so it is a STOP/owner decision, as the prompt already says.

**J3 - Time definitions per row and per surface:** state explicitly which fields are provider-day raw (`tmax`/`tmin`), which are hour-weighted (`rain`, `windMax`, `windGust`) and which are 3-hourly subsamples (comparison hourly view); that index 0 is today's full provider day regardless of the current hour; and what each card calls the period ("next N days", "3 days", etc.). A proposal must not label "avg temp" for a number whose period the card does not state.

**J4 - Units and rounding:** `InstantComparison` hard-codes "degC" (no units prop in the staged file) and `fmt` is `toFixed(1)`; finder uses degC `toFixed(1)` vs degF `toFixed(0)` (precision differs by unit); `ForecastTable`/`HourlyForecastModal` use `convertTemp`/`formatNumber`. Record per surface; do not fix. Proposed labels must say whether they apply in imperial mode.

**J5 - Timezone/provider semantics:** list every caller of `/api/forecast` and `fetchOpenMeteo` and whether `timezone` is passed (client currently passes `Atlantic/Reykjavik`; the API falls back to `"auto"`). Cite the Open-Meteo doc URL + access date for what `temperature_2m_max/min` cover and for whether a daily mean variable exists (I have not verified either). If a provider mean exists, record it as an option only - no request, no field added, no live probe (as the prompt already restricts).

**J6 - Options must be separated by what they change:** (a) relabel only (honest wording, e.g. "average daily high"; leaves the 0-coercion and the ranking untouched); (b) fix the finder's coercion (changes `rankWarmest` -> owner decision); (c) add a separate min/max presentation helper that never feeds ranking; (d) true mean from hourly (needs completeness rules, new computation, probably a cache-key bump `forecast:v8` -> next and an API whitelist check - mention as Phase B cost only); (e) leave as is. For each option list which of the surfaces in J1 it touches and whether `rankWarmest`, `calcMetrics` strength/primaryKey, or `scoring` outputs can change for identical inputs.

**J7 - Scratch execution safety:** the "real-function synthetic calls" must import only pure modules (`weatherFinderRanking`, `comparisonUtils`, `scoring`, `forecastNormalize`) - not `forecastCache.js` (localStorage/fetch) or any React component. Keep the scratch script and its output under the task folder, list it in the report (retain or delete, say which), and show `git status` before/after. If a module needs a browser global, STOP and report instead of stubbing.

**J8 - IS/EN wording is a proposal for the owner:** present IS and EN side by side, mark IS as needing Róbert's approval, check key parity impact (`weatherFinderAvgTemp` exists in both languages in `translations.common.js`) and any tests asserting these strings. I do not assess Icelandic quality.

**J9 - Evidence discipline:** keep the Expert Support paraphrase as owner-provided, unverified, never cited as a standard; grade every surface row VERIFIED SOURCE / VERIFIED SAMPLE / INFERRED / UNKNOWN; "audit PASS" does not authorise Phase B and the ticket stays open until an approved Phase B and its review.

## Notes (non-blocking)

- N1: The prompt's "do not prescribe 24" is right; Reykjavik has no DST but hourly timestamps are strings from the provider and the existing code compares them with `startsWith(date)`. Record that this is string-prefix day matching, not timezone arithmetic.
- N2: The existing `dailyWeatherSummary` and `weatherPresentation` modules (#400/#402) were not read by me beyond a grep for temperature terms; treat them as starting points, not as proof of the temperature semantics.
- N3: `README`/instruction files untouched; no Phase B file implied.

## Limits of this review

- Staged snapshots only; I did not run tests, git, lint, build or a browser on the owner's machine and did not run any code.
- My consumer greps cover only the files listed at the top; `src/pages`, `src/hooks`, `src/data`, `api/cron`, `api/_lib`, landing/blog content, and any other temperature renderer are UNKNOWN to me.
- Open-Meteo daily/hourly semantics and whether a daily mean variable exists are UNKNOWN to me (not checked).
- Production data completeness (how often `temperature_2m_max` is null/short) is UNKNOWN.
- I did not read `docs/ai/tasks/ticket-444/` beyond `prompt-review.md`, nor the live GitHub issue or #400/#402 history.
- Icelandic wording quality not assessed. No commit, push, deploy or GitHub mutation is implied.

## Next

Ripley: fold J1-J9 into `approved-prompt-v1.md` (Phase A, audit-only), set CURRENT READY_FOR_CC; owner sends "Prompt approved" to CC. No execution before that.


## Ripley Phase A approval handoff — 2026-10-26

Accepted J1–J9 and copied into approved-prompt-v1.md, with expanded surface/time/unit/missing-policy inventory and bounded pure-script reference cases. Cache-key bump in hourly-mean option is conditional cost, not assumed requirement for display-only derivation. Owner labels/period/coverage decision before code; no scoring/ranking changes. CURRENT -> READY_FOR_CC for audit only. No application edits. Owner sends Prompt approved to CC.


# Phase B — Round 1 implementation prompt for Jonesy review

2026-10-26. Ripley. Owner explicitly approved the presentation-only scope after Phase A PASS. This section supersedes Phase A execution scope for review purposes only; it is NOT executable until Jonesy approval and a new approved-prompt-v3.md referenced by CURRENT READY_FOR_CC. Preserve all earlier rounds/artifacts.

## Owner-approved outcome

1. Weather Finder warmest temperature metric: IS `Meðaltal hámarkshita`, EN `Average daily high`, with the selected period made explicit.
2. When that selected window lacks complete finite daily maxima, display IS `Ófullnægjandi gögn`, EN `Insufficient data`, instead of its zero-coerced numeric metric. Presentation only: keep results, score, ordering and selection exactly as before.
3. Brochure's InstantComparison temperature row: clarify that the existing number is the mean of available daily highs over up to three days. Keep the canonical homepage chip, comparison tone, delta and thresholds unchanged.
4. CampsiteComparisonSection daily temperature factor label: IS `Hámarkshiti`, EN `High temperature`.
5. No scoring/ranking bug fix or provider change. Record separate follow-up candidates only, no GitHub issue creation.

Meeting provenance: owner-supplied Expert Support paraphrase 2026-10-14, 17:40/34:00, not official validation or a meteorological standard. Phase A files are evidence; the approved owner scope above governs implementation. Provider daily mean and new min/max rows are not selected.

## First read-only check, before edits

Read AGENTS.md, CLAUDE.md relevant Free/Pro/canonical decision/comparison contracts, audit.md and Phase A result review. Confirm actual UI entrypoints and data flow in WeatherFinder -> rank functions -> WeatherFinderCard, Brochure -> InstantComparison and CampsiteComparisonSection. The observed rank result discards forecast rows, so the card cannot infer coverage from metrics.avgTemp alone. Trace effectiveDays (Free 3, Pro selected 3/5/7), result identity and selected row window first. Confirm translations' other consumers before changing a shared key. Report/STOP if implementation would require changed shared forecast/scoring, recommendations, gating, new API fields/dependencies or unrelated surfaces.

## Implementation boundary

Prefer a small pure presentation helper plus parent-to-card display metadata, derived downstream from unchanged site forecast rows and effectiveDays. Do not alter weatherFinderRanking.js production code/result shape, scoring.js, comparisonUtils.js, forecast normalization/cache, comparison engine, candidate/radius selection, recommendation code or data requests. Tests may import these real modules for parity. Keep display metadata separate from engine objects; do not mutate rows/results or rerank/filter candidates.

Finder completeness: inspect the same first effectiveDays rows used for ranking, with an explicit expected selected-window length. Require enough rows to cover that selected window and numeric finite tmax for every selected row. null/undefined/NaN/Infinity/non-numeric strings are missing; 0 and negative temperatures are valid. Any missing/invalid row or shorter window yields Insufficient data, never a substitute zero or a partial-window observed mean. Extra later rows outside the selected window do not affect it. Avoid sparse-array every() silently passing holes. Do not add hourly coverage requirements to provider daily highs or recompute a true daily temperature mean. Preserve existing valid-window displayed value, Celsius/Fahrenheit conversion and rounding. Do not expose zero-coerced metric in title/accessible text for incomplete windows. Changing selection updates display metadata immediately. Period text describes selected provider forecast days including index 0 (today), not a trailing historical mean or next N*24 hours. Retain existing controls/gating; no clipping of shared data.

Brochure qualifier should read IS `Meðaltal hámarkshita, allt að 3 dagar`, EN `Average daily high, up to 3 days` (or equivalent compact layout using translated fragments). calcMetrics excludes missing; do not promise all three samples exist or change its result. Only temperature row needs this qualifier; preserve row omission for unavailable metric and existing deltas/analytics. No homepage copy change is authorized. Audit shows InstantComparison standalone is Brochure-only; re-check before edits.

Use existing i18n conventions for new period/incomplete/qualifier keys, EN/IS parity and interpolation. For campsite comparison inspect comparisonFactorTemp usage: if shared beyond approved row, introduce a dedicated scoped key rather than relabeling unrelated consumers. Do not fix unrelated imperial support, icons, precipitation wording, decimal formatting or hazards. Keep long labels readable in narrow layout; a small scoped wrapping/layout adjustment is authorized, no redesign.

Expected source files: WeatherFinder.jsx, WeatherFinderCard.jsx, InstantComparison.jsx, CampsiteComparisonSection.jsx, affected i18n files, optional small presentation helper under existing utils/lib pattern and targeted tests. No instruction files/backend/config/dependency/generated data edits. .jsx/.js only, extensionless src imports. Existing unrelated changes preserved. No subagents, commit, push, deploy or GitHub changes.

## Acceptance and meaningful validation

- Complete daily maxima [2,2,2,10] over 4 helper input rows => 4, never extrema midpoint 6; the UI still exposes only existing 3/5/7 controls. No true daily-mean claim.
- Missing middle [10,null,10], all missing, short window, missing/undefined row, sparse row, NaN/Infinity/string => incomplete UI and no numeric fallback. [0,-5,2] remains valid. Later out-of-window invalid rows ignored.
- Test integration from real parent rows through card, including changed selected period, differing site identities/order, Free effective 3 vs Pro selection, and metric/imperial valid and incomplete cases. A test that only invents a new card prop cannot establish wiring correctness.
- Characterize unchanged real ranking scores/order/metrics with complete and missing data (RC-08 A[10,null,10] vs B[8,8,8] must retain B-before-A), and no input mutation. Existing comparison/scoring/normalization regression tests remain green. Never fix the ranking inversion here.
- EN/IS rendered labels and period qualifier, unavailable state accessible, Brochure up-to-3-day qualifier, omitted unavailable row, comparison High temperature factor label; targeted assertions for new branches and copy semantics. Preserve relevant analytics/select interactions.
- Run relevant Vitest suites and new targeted tests, lint and production build. Full suite once if feasible as established repo practice, without redundant repeats after green. Report failures honestly and distinguish pre-existing issues. Verify git diff --check and inspect production diff for any engine change.
- Real Chromium browser verification with deterministic fixtures: narrow mobile (~375px) and desktop, IS/EN, complete/incomplete finder, Pro period switch and Free display, Brochure qualifier and comparison factor row. Reuse existing Playwright tooling, no dependency install or live provider/account probe. Stub according to actual hook contracts. Record exact commands/scenarios/screenshots under task folder; browser assertions should check the approved text/value actually rendered. No unsupported cross-engine/device claims. If unable, report actual blocker rather than claiming full visual verification.

## Handoff and STOP

Preserve approved v1/v2 and Phase A reports/reviews. On later authorized CC execution set CURRENT CC_IN_PROGRESS first; append clearly labelled Phase B cc-report with changed files, exact tests/browser evidence, parity findings, remaining separate scoring/ranking follow-ups and limitations. Set CC_COMPLETE afterward; Jonesy appends Phase B result review. Issue closure never automatic. STOP for any unavoidable changed ranking/score/tone/provider/gating behavior, uncertain scope expansion or dependencies, and return the concrete conflict. Do not silently broaden the owner-approved scope.

Jonesy: review this Phase B Round 1 for missing-data wiring, period honesty, isolation/parity, i18n and mobile test sufficiency. Append APPROVED or REVISE; do not implement.

---

# Jonesy review — #444 Phase B Round 1

Reviewer: Jonesy (Claude, technical peer reviewer). Date: 2026-10-26. Reviewed against live source (staged snapshots): `weatherFinderRanking.js`, `WeatherFinder.jsx`, `WeatherFinderCard.jsx`, `InstantComparison.jsx`, `Brochure.jsx`, `CampsiteComparisonSection.jsx`, `translations.common.js`, and the existing `WeatherFinder*`, `InstantComparison.analytics`, `CampsiteComparisonSection` and `App.weatherFinderSelection` tests.

## Verdict: APPROVED with conditions J1-J10

The scope is presentation-only, derived downstream of unchanged rows, with the engine, scoring, comparison tone and provider untouched. The prompt's key premise is correct and the wiring approach is feasible. The conditions below fix points where the prompt is internally inconsistent or leaves a user-visible string or a regression trap open.

## Source claims verified (VERIFIED SOURCE)

- V1: `buildResult` returns `{id, name, distanceKm, score, metrics}`; the forecast rows are discarded, so the card cannot judge coverage from `metrics.avgTemp`. The parent holds `sites[].forecast` (= `scoresById[site.id].rows`) and `effectiveDays` (Free 3; Pro 3/5/7 via `days`), so metadata must be built in `WeatherFinder.jsx` from those.
- V2: `computeMetrics` slices `forecast.slice(0, n)` with `n = days` when it is a positive integer, otherwise the whole array, and divides by `slice.length`. A site with fewer rows than `days` therefore shows a partial-window mean today, and a missing `tmax` counts as 0. Both cases are what the new "Insufficient data" state must catch.
- V3: `weatherFinderAvgTemp` is consumed only by `WeatherFinderCard.jsx` (my greps over staged `src`). `comparisonFactorTemp` is used only by the temp row in `CampsiteComparisonSection.jsx`.
- V4: `WeatherFinder.jsx` already shows `· {effectiveDays} days` in the result title, for the list as a whole. `WeatherFinder.jsx` has no analytics payload that includes `avgTemp`.
- V5: `InstantComparison` is imported only by `Brochure.jsx` (route `/brochure`); the temp row is an icon-only `MetricRow` and `°C` is hard-coded.
- V6: Existing Finder tests use fixtures with 3 rows (`WeatherFinder.selection.test.jsx`) and `WeatherFinderCard.select.test.jsx` renders the card in `calmest` mode with no new props; none assert temperature text.

## Conditions

**J1 - Pin the exact card strings in approved-prompt-v3, do not leave them to CC.** The period wording is the user-visible honesty claim, and it must match what the code does (first N provider days from index 0, i.e. today's full provider day included). Fix, in EN and IS, the complete card string for (a) a complete window, including the period, and (b) the incomplete state. Avoid "next N days" / "N x 24 hours" phrasing. Mark IS as owner-approved text. The title already says "· N days"; the prompt must say whether the card repeats the period or relies on the title plus the label (the owner request says the period must be explicit "with the metric").

**J2 - Value source and helper contract (internal inconsistency).** The acceptance example "complete daily maxima [2,2,2,10] over 4 helper input rows => 4" implies the helper computes a mean, but the prompt also says to preserve the existing displayed value. Decide one contract: the helper only returns completeness (and the expected window length), and a complete window continues to display the engine's own `result.metrics.avgTemp`. If the helper does compute a mean, a parity test must prove it is exactly equal to `result.metrics.avgTemp` for every complete fixture. The 4-row case is a helper unit test only (the UI exposes 3/5/7).

**J3 - Mirror the engine's window rule exactly.** `sliceForecast` falls back to the whole array when `days` is not a positive integer. The helper must take the same `effectiveDays`, state what it does for a non-integer or missing `days` (recommend: incomplete), and be tested against `computeMetrics` behaviour through `rankWarmest` rather than a copy of the rule. Use index-based checks so sparse arrays, holes, `undefined` rows and rows without `tmax` are all missing (as the prompt says), and `0` and negative values are valid.

**J4 - Fail closed when metadata is absent.** `WeatherFinderCard` is rendered directly by existing tests and could be by other callers without the new prop. In `warmest` mode, absent or malformed display metadata must render "Insufficient data", never the zero-coerced number. Add a test. Other modes (`calmest`, `driest`) must stay byte-identical.

**J5 - Build the metadata from the same inputs as `ranked`.** Derive it in the same `useMemo` (or from the same `sites` array and the same `options.days`) that feeds `rankFn`, keyed by `result.id`, so a mode, days, radius or site-list change cannot show stale metadata for a different window. Do not memoize it with different dependencies. Tests: Pro 3 -> 5 -> 7 switching in the real `WeatherFinder`, and a re-order caused by a changed `scoresById`.

**J6 - Mobile layout is a real risk, test at 320 px as well as ~375 px.** The card's metric block is `shrink-0 text-right` while the place name is `min-w-0 flex-1 truncate`; a longer metric plus period string will squeeze the place name toward zero width. The small wrapping/stacking adjustment is authorized, but acceptance must assert that the place name remains visibly readable (non-trivial width, still a clickable button) and that there is no horizontal overflow at 320 and 375 in both IS and EN, including the incomplete state. The repo already used a 320 px check in the #460 browser spec.

**J7 - Honesty limit that must be stated, not fixed.** For a site shown as "Insufficient data" the rank position and score are still computed from the zero-coerced mean (RC-08: A `[10,null,10]` ranks below B `[8,8,8]`; with negative temperatures a missing day can even make a site look warmer). The owner chose not to change ranking; the cc-report must say this plainly in "remaining follow-ups" and must not describe the display as making the ranking trustworthy. The parity tests must compare the order shown in the real `WeatherFinder` UI with a direct `rankWarmest(sites, options)` call, not with a snapshot generated from the new code.

**J8 - i18n hygiene.** Add new keys instead of renaming meaning inside `weatherFinderAvgTemp` (a key named AvgTemp holding "average daily high" will mislead future readers). Remove the old key only after a repo-wide grep (including blog, landing and pricing copy and tests) shows no consumer; my grep only covers the staged subset of `src`. Keep EN/IS parity and interpolation (`{n}`) conventions, and add a quick parity assertion or script result to the report. `comparisonFactorTemp` has a single consumer (the daily temp row), so a dedicated key is not needed unless CC finds another consumer; say which. Do not touch the hourly `labelTemp` ("Temp"/"Hiti").

**J9 - Existing fixtures and Pro days.** Existing Finder tests use 3-row fixtures. Any test (existing or new) that selects 5d or 7d in `warmest` mode with a 3-row fixture will now correctly show "Insufficient data"; new tests must use 7-row fixtures for Pro period switching, and CC must not weaken existing assertions to accommodate the new state. Keep the existing `trackEvent` payloads unchanged (they carry no temperature).

**J10 - Browser verification scope.** Reuse the #460 approach (production `vite preview`, mocked `/api`, Pro entitlement stub, fresh context per scenario, request/response accounting where an incomplete window depends on mocked nulls). Cover: Finder warmest complete and incomplete in EN and IS (the finder sits behind the "supporting detail" disclosure, which must be opened), Free 3 days vs Pro 3/5/7 with 7 mocked rows per site, metric and imperial where the units toggle is reachable, `/brochure` qualifier on both site cards and unchanged delta text, and the comparison "High temperature" row (needs a Pro comparison run with two mocked sites). Desktop plus 375 and 320 px. Save commands, scenarios and screenshots under the task folder and inspect them; if any scenario cannot be driven, report that blocker instead of claiming coverage. The #460 PWA toast overlapped screenshots; dismiss it with the actual close control if it appears.

## Notes (non-blocking)

- N1: Terminology across surfaces will now be: IS "Hæsti hiti" (forecast table), "Hámark" (share image), "Hámarkshiti" (comparison), "Meðaltal hámarkshita" (finder); EN "Temp max", "High", "High temperature", "Average daily high". Owner-approved, but three IS terms for the same quantity is worth a one-line owner note; no change required.
- N2: In production every site normally has 7 rows, so the incomplete state should appear only for null/missing provider values; the visible change for most users is the relabel and period text. Production frequency of nulls is UNKNOWN.
- N3: Brochure fixtures have no `date` field and only 3 rows; the "up to 3 days" qualifier matches `calcMetrics`' `slice(0, 3)`. The per-card qualifier will appear on both site cards; keep the analytics test fixtures green.
- N4: Acceptance should include an empty `git diff` for the engine files named in the prompt plus `useLeaderboardScores.js`, `useComparisonState.js`, `HomeDecisionCard.jsx` and `App.jsx` (blob hash of `weatherFinderRanking.js` at Phase A was `5538db26dc7acfd82e664f6bcadb898b5ecefe77`, CC-attributed).

## Limits of this review

- Staged snapshots only; I ran no tests, git, lint, build or browser on the owner's machine and no code.
- My greps cover the staged subset of `src` only; other consumers of the touched i18n keys are UNKNOWN until CC's repo-wide search.
- I did not read AGENTS.md or CLAUDE.md in this round, nor the live GitHub issue; the "Free/Pro/canonical decision/comparison contracts" are as quoted in the prompt.
- Icelandic wording quality not assessed. No commit, push, deploy or GitHub mutation is implied.

## Next

Ripley: fold J1-J10 into `approved-prompt-v3.md` (Phase B, presentation-only), set CURRENT READY_FOR_CC referencing it; owner sends "Prompt approved" to CC. No execution before that.

## Ripley Phase B approval handoff — 2026-10-26

Accepted J1-J10 in full and created approved-prompt-v3.md. Pinned exact bilingual card/period strings, completeness-only helper with engine value retained, invalid-days/missing metadata fail-closed policy, id-keyed same-input wiring, unchanged ranking disclosure, i18n hygiene and 320/375px browser verification. CURRENT READY_FOR_CC. Owner sends Prompt approved to CC. No application changes performed.
