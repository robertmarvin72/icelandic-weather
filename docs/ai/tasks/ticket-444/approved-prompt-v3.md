# #444 — Approved Phase B implementation prompt v3

2026-10-26. Jonesy APPROVED Phase B Round 1 with J1-J10; all conditions included below. Owner approved this presentation-only implementation scope. Execute only when CURRENT is READY_FOR_CC referencing this file and owner sends Prompt approved. The review-only preamble quoted in the original round below is superseded by this authorization; all prior approved versions remain immutable Phase A history.

## Binding resolutions of review conditions

J1 exact visible text, built from translated fragments with the existing interpolation convention:
- Complete Finder metric: EN `{value} — Average daily high` followed by `First {n} forecast days, including today`; IS `{value} — Meðaltal hámarkshita` followed by `Fyrstu {n} spádagar, dagurinn í dag meðtalinn`.
- Incomplete Finder metric: EN `Insufficient data` followed by the same period line; IS `Ófullnægjandi gögn` followed by the same period line. No numeric temperature or unit in the incomplete state.
- Repeat this period with each warmest card, rather than relying only on the existing list title. Two stacked lines are allowed/expected; do not force a single long line. {value} preserves the existing unit/precision formatting. These describe full provider forecast days starting at row index 0; never next N*24 hours.
- IS label and unavailable text were explicitly owner-approved; the period sentence above is Ripley's concrete rendering of the approved semantics, not a claim of separate verbatim owner review.
- Brochure qualifier and comparison label remain the exact EN/IS text specified in the owner-approved outcome below.

J2 helper contract: completeness metadata only, plus selected-window length; do NOT compute a replacement mean. Complete cards continue formatting the existing engine metrics.avgTemp. The asymmetric four-row test must assert helper completeness and separately assert real rankWarmest avgTemp=4, not demand a helper-returned mean.

J3 valid positive integer days uses the engine's same first-N window, but insufficient row count is incomplete. Invalid/missing/non-integer/nonpositive days fails closed as incomplete: document this deliberate conservative display behavior even though the engine itself falls back to its whole array. Test via real rankWarmest for valid window parity and invalid-days contrast. Index checks handle holes/missing rows safely.

J4 absent/malformed metadata in warmest mode => incomplete. If no usable positive integer period is available, omit the period line rather than invent an N; never expose a numeric mean. Real parent always passes valid effectiveDays. Preserve calmest/driest rendered behavior and events.

J5 same sites and options.days dependencies as ranked, keyed by stable site id; no positional association. Tests cover real parent Pro 3->5->7 with 7-row fixtures and reorder after scoresById changes.

J6/J10 verify readable/clickable names and no horizontal overflow at 320/375px and desktop, both languages and incomplete state; scoped wrapping/stacking only. Follow all browser scenarios in J10 below, including both Brochure cards, Pro comparison and actual toast dismissal.

J7 unchanged ranking is a material retained limitation: incomplete sites remain positioned/scored using the old zero-coerced mean. State it in report/follow-ups; actual parent UI order must match direct real rankWarmest for RC-08 and missing/negative cases. Display honesty does not certify ranking correctness.

J8 new semantically named i18n keys for Finder daily-high label, period and missing state. Before removing obsolete keys, run scoped repository-wide tracked-source/document/test searches (including blog/landing/pricing, excluding secrets, .git, node_modules, dist and generated/binary output); retain commands. Keep EN/IS parity. Verify comparisonFactorTemp consumers before changing it, and leave hourly labelTemp untouched.

J9 retain existing assertions/events, use seven rows for complete Pro-window tests; do not turn a genuine missing-data case into a complete case to hide a regression.

N4 isolation: show empty production diff/baseline hash equality for weatherFinderRanking, scoring, comparisonUtils, forecast normalization/cache, compareCampsiteForecasts, useLeaderboardScores, useComparisonState, HomeDecisionCard and App. No unrelated term unification or unit fixes. Existing report history is retained with appended Phase B results.

## Reviewed implementation contract (binding except superseded preamble)


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

## Jonesy J1-J10 — accepted in full


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

