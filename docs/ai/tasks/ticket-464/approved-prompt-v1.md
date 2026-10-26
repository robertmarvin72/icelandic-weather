# #464 — Approved research prompt v1

2026-10-26. Jonesy APPROVED research-only Round 1 with J1–J10. Owner executes by sending Prompt approved to CC with CURRENT READY_FOR_CC referencing this file. No production implementation authorized.

## Binding clarifications

The review-only preamble in the retained Round 1 contract below is superseded by this approval. All J1–J10 reproduced after it are binding. The following resolves conflicts explicitly:
- J1 authorizes task-local real React render tests with mocked getForecast, using existing installed Vitest/Testing Library. This supersedes the initial instruction to avoid rendering hooks: render the actual component with network/cache boundary mocked, never call the real forecastCache/getForecast or write cache. Task-local Vitest config/spec only; no repo source/config/test edit. Inspect setup for side effects. If blocked, record actual blocker and clearly labelled model fallback, never claim it as real component execution.
- J4 synthetic two-payload demonstration uses mocked boundary and real component/state behavior where feasible; no real cache TTL write/fetch experiment. Source trace establishes TTL/coalescing mechanism; distinguish it from experimentally observed behavior. Do not present a mock returning two payloads as proof that actual production cache expired.
- J2 threshold/normalization values and J3 sandbox feasibility are reviewer leads to verify, not established historical inputs or a complete enumeration of every weather code. Retain raw/normalized/rounded and component-by-component evidence. Exhaustiveness claims must state searched domains/assumptions. Missing original gust/code/probability remains UNKNOWN.
- Reviewer text about shelter must be resolved against actual code: distinguish accepted input, computed bonus and contribution to total. Never repeat conflicting prose as a verified result without tracing actual computation.
- Read-only issue fetch/git log are permitted. Initial clean status precedes workflow files; now expected changes include this task folder and CURRENT. Record actual current status, preserve unrelated changes and do not require a clean checkout via reset/stash.
- J7 scoped docs/source/history searches exclude secrets, .git internal traversal, node_modules/dist and generated/binary outputs. Use git log as read-only history command, never broad root recursion.
- Outcome is research deliverables, not implementation or GitHub closure. No new dependencies, subagents, git mutations, live provider/account calls or instruction-file edits.

## Reviewed Round 1 contract

# #464 — Round 1 research prompt for Jonesy review

2026-10-26. Ripley. Not executable: review material only until Jonesy approval, an approved prompt and CURRENT READY_FOR_CC.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/464
Title: Rannsaka ósamræmi milli dagseinkunnar og klukkustundamats: „Slæmt“ en „Góður tími“ allan daginn
Live issue fetched 2026-10-26, OPEN, no comments or labels. Suggested P1 in issue body. Research only. No Project/GitHub mutation authorized here.

## Goal / owner evidence

Explain the daily grade vs hourly badge/best-window discrepancy using actual implementation and reproducible, provenance-labelled evidence. Laugardalur 64.1451,-21.8750, screenshots taken 2026-10-26:
- 2026-10-27: Fair/Sæm, tmin2.9/tmax6.7 C, wind4.8m/s, rain0.2mm; 06/09 Rough, best15–21.
- 2026-10-28: Bad/Slæmt, tmin2.6/tmax5.8 C, wind5.1m/s, rain0.0mm; eight shown points00..21 every3h all Good time, window00–21.
These are owner-reported rounded observations, NOT complete raw API payloads. Named screenshots image(20261026-151416).png, image(20261026-151547).png, image(20261026-151606).png are references in issue text, not attached to GitHub. Initial scoped outputs/docs search found no matching filenames; that is not an exhaustive search of user's computer. Do not invent access or require re-upload to progress source/synthetic research. New forecasts cannot reconstruct historic forecast runs.

## Starting observations to verify, not final cause

Baseline HEAD 24dcd8925287893249d6d5fd70edd6b4ce84158f; initial git status clean. #444 workflow CLOSED/PASS locally, prior pointer preserved here. Read current AGENTS/CLAUDE and relevant #444 audit/result history, but do not assume #444 fixed scoring or authorize follow-up implementation.

useForecast normalizes daily/hourly inputs, invokes scoreSiteDay on raw row, then adds separate summarizeDailyWeather code/text for display. ForecastTable maps row.class to translated label/color; icons/description summarize daily weather separately from score. Trace actual App caller and props, not just imports.

HourlyForecastModal builds date-matched rows then keeps hour%3===0 BEFORE getWindowState and summary calculation. getWindowState inspects wind/gust/rain/precipProbability only; temperature is displayed but absent from this predicate. Good uses <=10/15/1/40 and absent values may pass; Rough uses >=15/20/3/70. Validate exact field aliases, numeric/nonfinite behavior. Summary scans consecutive good array entries, not necessarily continuous hourly coverage; strict-greater bestLength appears to pick first tie; from/to are first/last sampled labels. Trace gaps/duplicates/order rather than assuming a continuous 00–21 forecast window.

Daily winter windPenalty has boundary <=5 vs >5..10; date maps Oct–Apr to winter. 4.8 vs5.1 could cross it, but not enough to prove historic cause: gustiness, raw daily WMO code, normalization/time weighting, rounding and other components also matter. scoreSiteDay uses base, wind/rain/gust, pleasantness (sky/coldWind/wintry), clamps and pointsToClass. tmin accepted but unused. Read full functions before stating influence; shelter/rainStreak inputs do not imply active score contribution. Distinguish automatic date season from UI winter mode.

## Read-only investigation contract

1. Map three paths with file:line and commit SHA/blob provenance: daily grade + label/color; hourly badge + color; best-window construction/rendering. Include real entrypoint, feature gating, App/useForecast/normalization, modal's own getForecast, cache/server paths. Do not conflate daily icon/summaryCode from #400/#402 with raw daily code used in scoring.
2. Table per path: actual fields/aliases, units, period/timezone, sampling, precision/rounding order, defaults/null/type/nonfinite behavior, thresholds/weights, summer/winter, shelter, provider/cache/request provenance. Read forecastCache and api read-only; never import cache/network modules into analysis scripts. Determine what identical cache key can guarantee and what expiry/refetch can change; historic run/model identity UNKNOWN without captured evidence. No live forecast/account call, .env/.vercel/secret inspection, cache write or provider change.
3. Try preserved fixture/evidence discovery only in scoped repo paths (src tests, tests, docs/ai and outputs); record exact searches and limitations. If originals unavailable, say NOT HISTORICALLY REPRODUCED and proceed with synthetic fixtures, never infer unobserved hourly wind/gust/probability/code from daily totals/maxima.
4. Produce actual-function synthetic breakdown on each example date. Daily: raw/normalized/rounded values, season config, every component including sky/cold/wintry, raw/clamped points and final class. Hourly: all relevant predicate booleans, selected timestamps/states, best-window run/tie/end semantics. Full24h payload vs eight displayed samples side by side. No generic 'because cold' explanation unsupported by computed contribution.
5. Counterfactuals around relevant exact boundaries (including wind5 daily, hourly10/15 etc and active cold thresholds), legitimate zero/negative, missing/nonfinite/type values, unsampled hourly peak, mixed good/rough, gaps/out-of-order/duplicate rows, midnight/date filtering. Pick compact cases to distinguish causes; label synthetic and avoid asserting suspected behavior is desirable. Preserve outputs/commands, no production tests pinning unapproved policy.
6. Answer explicitly: what each rating actually asks; whether cold contributes to each; intentionality (code behavior can be verified, product intent UNKNOWN unless documented); actual agreement/disagreement type (implementation defect/data mismatch/label ambiguity/distinct rules) with evidence and uncertainty. Source-level plausible discrepancy is not proof of the screenshot's exact cause. Include user meaning of 00–21 and unsampled times.
7. Propose bounded next steps, no implementation: root-cause bug candidate as separate issue draft if confirmed, or IS/EN explanatory copy grounded in computed semantics, or separate model research with impact on scores/rank/recommendation. Distinguish verified bugs from proposals and retain own-vs-official-weather assessment policy. Do not create GitHub issues or change labels/Project/status externally.

## Execution safety / deliverables

Only docs/ai/tasks/ticket-464 and CURRENT workflow edits. No application/source/test/config/i18n/instruction/backend changes, new dependencies, thresholds, scoring/ranking/gating/recommendation/provider changes or automatic fixes. No subagents, commit/push/deploy/GitHub mutation. Initial stage is review only.

After authorization CC first reads CURRENT and sets CC_IN_PROGRESS. Deliver research-report.md (mapping, formulas/provenance, verified vs hypotheses), reproduction-cases.md (retained fixtures/scripts/outputs and exact commands, sample vs original distinction), next-steps-proposal.md (bounded choices/ISEN copy/impact), cc-report.md (scope/status/source hashes/limitations). Preserve prior task history.

Use pure real scoring/normalization functions after side-effect audit. Hourly helpers are component-local: do not refactor/export production code merely to test research. Prefer an existing Vitest/SSR transform or a narrowly documented task-local harness evaluating exact retained source functions; inspect imports, avoid rendering/invoking network hooks. If unavoidable manual transcription is used, explicitly label it a model, not real-function execution, and cross-check source branches; report evidence limit. No global source rewrites, browser globals stubs to hide side effects, or arbitrary cache/provider calls. Keep scripts and source extraction method transparent; no app build/browser/full suite required for this read-only research. Relevant existing tests may be read/run if useful; clearly separate their evidence from new synthetic cases.

Record baseline/after status, HEAD, unchanged app/config/test diffs and git diff --check. No test addition outside task folder; fixtures must be synthetic and no credentials/PII. Public primary documentation only if needed; cited provider semantics not guaranteed by field names. No need to verify general service recommendations or change providers.

STOP before any production implementation, new dependencies, network/account/cache mutation, scope beyond research or unsupported conclusion that must guess missing originals. Missing originals alone does not block source/synthetic research. At completion populate CC report path and set CC_COMPLETE. Jonesy result review then Ripley final assessment; PASS means research delivered, not fixes deployed or issue closed.

## Acceptance

All issue investigation/acceptance points answered or explicit evidence-bounded UNKNOWN. Three calculation/rendering paths traced, actual period/sampling/defaults/precision contracts documented, synthetic component breakdown and meaningful counterfactuals retained, historic reproducibility stated accurately, next steps bounded. No production behavior changed.

Jonesy: append APPROVED or REVISE; focus on research harness validity, date/normalization/cache paths, completeness of score breakdown and sampled-window semantics. Do not implement.


## Jonesy J1–J10 — accepted in full


**J1 — Harness validity (real code vs model).** `scoring.js` and `forecastNormalize.js` can be imported as real modules after a side-effect audit. The hourly state function is component-local and the best-window logic is a `useMemo` inside the component, so extraction by function text is not enough for the window. Required: execute badge and best-window behaviour through the real `HourlyForecastModal` render (React Testing Library with a mocked `getForecast`, as `HourlyForecastModal.test.jsx` already does), using a task-local spec or a task-local Vitest config under `docs/ai/tasks/ticket-464/` that points at the repo root; no repo config or test edits. If the default include globs block this, report it and use a clearly labelled model instead, with the cross-check against source branches the prompt already requires. Record the source blob hash of each executed file and state in the report which results come from real execution and which from a model.

**J2 — Daily inputs are not the provider's daily fields.** When hourly data is present, `normalizeDailyToScoreInput` replaces daily wind max, gust and rain with time-of-day-weighted hourly values (0–6h × 0.45, 6–9h × 0.75, 9–22h × 1.0, else 0.75, severe floor 0.85; rain as a weighted sum; absent hourly values become 0). The research must separate, per example date, provider daily fields, normalized row values, what `ForecastTable` shows (`r.windMax` and the title/tooltip text near line 383), and what the modal shows (raw hourly values every third hour). Include how the UI explains the grade to users (class labels, any `scoreExplanation_*` strings).

**J3 — Hidden-input feasibility analysis.** For each example date, compute which unobserved inputs (gust, weather code, rounding of wind within the displayed value's rounding interval, weighted rain) are consistent with the owner's reported class and rounded numbers, and which are not. Label as "consistent with", never as the cause, and never infer hourly gust, wind or probability from daily numbers. Use my sandbox lead only as a starting hypothesis; re-derive it with the retained harness.

**J4 — Daily/hourly data-run asymmetry.** The daily rows live in `useForecast` state from the last fetch, while the modal calls `getForecast` again on open; the two can read the same cached entry within the 30-minute TTL or different runs after it expires (memory and localStorage, in-flight coalescing). Trace and demonstrate with two synthetic payloads that a long-open tab can show a daily grade from one run and hourly badges from another. State that this is a possible mechanism, not evidence about the screenshots.

**J5 — Hourly edge semantics.** Cover: all four hourly fields absent or null (vacuously "good"), `NaN` (neither good nor rough), `Infinity`, numeric strings (not `typeof number`, so treated as absent and passing), `0` and negative values, missing `precipitation_probability`, unsampled peak between 3-hourly samples, mixed good/rough runs, gaps, duplicates, out-of-order timestamps, and the midnight and date filter. State what "00–21" means to a user given 8 samples and no coverage of 22–23. Check `formatHourLabel` output for midnight under `en-GB` and `is-IS` (`hour12: false` can yield "24:00" in some engines) and say which ICU/engine produced your result.

**J6 — Season and date boundaries.** `getSeasonForDate` parses `YYYY-MM-DD` as UTC and reads `getMonth()` in local time. Include a labelled secondary counterfactual for 1 Oct and 1 May with `TZ` set west of UTC; it does not apply to Oct 27/28 for an Iceland-timezone browser, so do not present it as the screenshot cause.

**J7 — Intent and provenance.** Product intent stays UNKNOWN unless documented. Search `AGENTS.md`, `CLAUDE.md`, `docs/`, test names, i18n copy (`badgeGood`/`badgeRough`/`bestWeatherWindow`) and read-only `git log` for the modal and `scoring.js` origins; cite what you find, quote nothing you did not read. Classify the disagreement with the prompt's own categories and add the distinction between (a) different aggregation, (b) different features and thresholds (hourly ignores temperature, sky, gustiness-vs-wind; daily uses them), and (c) label semantics ("Slæmt" vs "Góður tími").

**J8 — Issue checklist.** I have not seen the live issue text. CC reads issue #464 read-only (or Ripley pastes it) and copies its acceptance points verbatim into `research-report.md` as a checklist, each answered or marked UNKNOWN with the reason. Verify HEAD and clean status yourself before starting and record them.

**J9 — Scope and safety (unchanged, restated).** Edits only under `docs/ai/tasks/ticket-464/` plus CURRENT lifecycle fields. No change to application, test, config, i18n or instruction files; no live forecast or provider call, no `.env`/`.vercel` access; no cache write, no new dependency, no GitHub mutation. If the real-render harness would need any repo edit, STOP and report.

**J10 — Next steps.** Keep proposals bounded and label each as verified bug, copy proposal, or model research. Any scoring or threshold change must name its impact on scores, rankings and recommendations and stay a separate issue draft. No production tests that pin unapproved policy.

