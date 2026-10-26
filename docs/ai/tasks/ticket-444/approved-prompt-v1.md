# #444 — Approved Phase A audit prompt v1

2026-10-26. Jonesy APPROVED with J1–J9 incorporated below. Execute only on owner Prompt approved with CURRENT READY_FOR_CC referencing here.
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

## Binding clarifications

Accept J1–J9 in full. Their source observations are leads to independently trace, not permission to omit other surfaces or assume undocumented production behavior. Record exact negative-search scope/counts and explicit uninspected UNKNOWNs. Include scoring/finder/comparison missing policies separately, without changing them.

J6 hourly-mean option: potential cache-key change is a cost to evaluate, not assumed mandatory when only deriving display from unchanged raw data. Separate extra provider fields/API whitelist/cache shape changes from pure presentation computation; no API/cache changes in Phase A. Existing API/public dev bypass and timezone semantics must be distinguished; no live calls.

All proposals list exact IS/EN labels, period/coverage and unit treatment, side effects on scores/rank/comparison strength separately. Relabel-only cannot truthfully promise to fix missing-to-zero values. No option may silently modify rankWarmest/scoring to repair a label. Owner approval required before Phase B code.

No new tests/app/instruction/config files, npm/build/lint/browser/services/subagents or external-data probes. Pure read-only reference script under task444 may be retained with exact command/output and inspected side effects; never import forecastCache/React or stub browser globals. Complete daily/sample claims require validation, no 4-sample example represented as a24hour day.

## Jonesy conditions (verbatim)

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


## Execution lifecycle

On owner Prompt approved verify CURRENT READY_FOR_CC points here and set CC_IN_PROGRESS; execute audit/proposal only, write docs/ai/tasks/ticket-444/cc-report.md, populate report path and set CC_COMPLETE. Jonesy Phase A result review then Ripley owner-facing proposal. Overall444 remains incomplete until owner-approved implementation and normal Phase B prompt/result review; no audit-only CLOSED, no new stages. No commit/push/deploy/GitHub mutation.
