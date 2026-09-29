# #428 — Approved investigation prompt v1

Date: 2026-09-29. Consolidated by Ripley after Jonesy APPROVED Round 1 with no required clarifications. Execution prompt only while referenced by CURRENT at READY_FOR_CC.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/428

## Preflight findings

#427 is CLOSED; working tree clean at preflight. The issue alleges windPen is multiplied by precipTimingMultiplier. Current source contradicts that premise: scoring.js computes windPen = Math.round(windPenRaw * cfg.windWeight), and applies precipTimingMultiplier only to rainPen. docs/model-baseline-v1.0.md sections C.3/C.4 already document this separation.

Read-only Node reproduction with tmax=15, windMax=18, windGust=18, rain=[0,0.9,1,4], dates 2026-07-15 and 2026-01-15 yields windPen=10 in every case. rainPen is respectively 0,0,2,5. This confirms repository behavior, not which revision is deployed live.

Git blame traces the independent wind formula to 4e72d4927 (2026-02-19). Commit dfe7ac17ba0de7e5e0801a2b9d2afa4d26e079c9 (#174, 2026-03-18) introduced the timing multiplier on rain only; inspected diff does not couple wind to rain. An exact-string git-log search found no windPenRaw * precipTimingMultiplier occurrence; absence from this narrow search is not proof across all historical spellings or deployed versions.

Initial consumer map: useForecast and MapView normalize daily/hourly via forecastNormalize before scoreSiteDay; useLeaderboardScores constructs raw daily rows and sums clamped points; relocationEngine normalizes, adds shelter and invokes scoreDaysWithRainStreak, which wraps scoreSiteDay. scoreDay is a legacy wrapper. Intentional hourly weighting can change wind inputs; do not confuse that with rain coupling or require equal scores across raw/weighted paths.

## Required task — evidence and regression protection first

1. Independently audit scoreSiteDay, windPenaltyPoints, rainPenaltyPoints, getPrecipTimingMultiplier, rounding and all direct/indirect consumers before writing code. Record exact revision and a source-to-UI matrix for campsite detail/forecast, map, Top 5 and route planner, including input field names, normalization, aggregation, shelter/rain streak and relevant caches. Follow actual callers and aliases, not just this initial map. Existing UI entrypoints already exist; no new UI needed.
2. Inspect relevant git history (including multiplier introduction and later edits) to distinguish an actual defect, already-fixed defect, or unsupported audit premise. Cite inspected hashes and formulas; do not invent intent or claim production deployment parity without evidence. If deployment revision is unavailable, explicitly limit the conclusion to the checked repository revision.
3. If current separation is confirmed, leave production scoring and normalization untouched. Add focused regression tests proving rain cannot suppress the wind component: dry windy day at 18 m/s, summer/winter, rain 0/sub-1/1/4 with fixed other inputs. Assert windPen and components.wind as well as raw/clamped score contracts; isolate rain-only score deltas so clamping cannot hide a failure. Cover the existing one-decimal rounding boundary near 1 mm (0.94/0.95) without changing its semantics. Include appropriate calm/control and gust cases, preserving season thresholds, pleasantness and shelter behavior.
4. Verify each named consumer's real path with deterministic input fixtures and actual scorer, not a mocked scorer that returns expected values. Reuse focused existing tests/harnesses where possible; cover raw daily and hourly-normalized inputs plus daily fallback. Demonstrate unchanged wind contribution when only precipitation changes while retaining intentional normalization differences. For route planner distinguish underlying wind component from streak/aggregate outcomes. Keep tests proportional; do not force identical final rankings across different inputs.
5. Write an evidence-backed task investigation report with the verdict, reproductions, consumer matrix and history. If no model change is required, explain that existing model documentation is already accurate and do not manufacture a formula change. If documentation contains a related factual error, correct only that error with evidence.

## Boundaries / STOP

Default expected deliverable: targeted tests and investigation documentation, no production model change. If a real coupling is found despite preflight, document the exact source and reproduction and stop for a revised fix prompt before changing scoring. Stop for owner approval if the required fix reaches beyond this issue's wind/rain coupling scope. Do not fix adjacent normalization/missing-data/cache/model issues in this ticket; record them separately.

No changed wind thresholds, weights, rain thresholds, season behavior, rounding, hourly weighting, shelter, gust, pleasantness, streak, gating, recommendation policy or cache behavior. No backend, new libraries, TypeScript, explicit import extensions, new UI or unrelated refactor. Preserve shared Free/Pro forecast inputs. Do not remove the currently redundant rain multiplier as cleanup. No commit, push, deploy or issue closure.

## Validation and handoff

Run scoring and edge-case suites plus affected forecast/map/leaderboard/relocation tests, changed-file lint and build if executable files change. Identify actual suite paths from repo. Record exact commands/results and any test gaps; existing green tests alone are not evidence of the new invariant. No live weather dependency needed for deterministic regression tests.

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT. Verify CURRENT is READY_FOR_CC and references this approved-prompt-v1.md. Set CC_IN_PROGRESS before work. Execute this prompt only; prompt-review.md is discussion history. Write docs/ai/tasks/ticket-428/cc-report.md with investigation findings, exact commands/results and limitations; populate that path in CURRENT and set CC_COMPLETE after the report exists. Jonesy review path: docs/ai/tasks/ticket-428/result-review.md. Preserve earlier history. Do not close the task yourself.
