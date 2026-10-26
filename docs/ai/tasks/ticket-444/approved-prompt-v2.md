# #444 — Approved Phase A correction v2

2026-10-26. Ripley final assessment: REVISE. Implements Jonesy's reviewed R1/R2 correction request; no Phase B authorization. Read approved-prompt-v1.md and result-review.md for the original contract and evidence. All original safety/scope constraints remain binding.

## Scope and lifecycle

Execute only after owner sends Prompt approved with CURRENT READY_FOR_CC referencing this file. Set CC_IN_PROGRESS first. Correct task-local audit/proposal/reference/report artifacts only. No application/source/test/config/API/i18n/instruction edits, dependencies, new provider calls, scoring/ranking changes, git mutations, GitHub changes or subagents. No full suite/lint/build/browser required. Preserve v1 and prior review history; clearly distinguish superseded findings from current conclusions. At completion append a v2 report, record commands/output and scope checks, then set CURRENT CC_COMPLETE. Jonesy re-reviews before Ripley presents the corrected owner proposal.

## R1 — season-specific scoring evidence

Read getSeasonForDate and actual scoring configuration. Extend the existing side-effect-free scratch reference script with the same RC-06 fixture on summer and winter dates (at least 2026-06-15, 2026-10-27 and 2027-01-10). Retain exact command and output; verify no application files changed. Do not modify imported production modules or loader behavior beyond existing safe resolution.

Correct audit section 1.4, RC-06, proposal Surface 4/owner decision wording, and report headline: Good/8 -> Bad/0 was a synthetic summer result; Jonesy's winter runs yielded Fair/3 for both valid and missing tmax. Confirm and report actual local outputs. Explain relevant season/config dependence without generalizing this fixture into proof that missing tmax never affects winter scoring. Production frequency/completeness remains UNKNOWN. Remove unqualified highest-impact/any-day claims throughout the current conclusions.

## R2 — inventory and units completeness

Run scoped directory-wide rg searches in src/lib and src/components, excluding tests; retain exact regex/globs, matched-line and file counts, and distinguish search coverage from fully traced coverage. Review relevant hits rather than claiming that a keyword search proves completeness.

Add an extrema-only/hazard consumers (no mean) subsection with source:line citations: relocationEngine heat tempHigh from tmax (24/28 thresholds), missing-tmin cold limitation/comment, copied day values; weatherVoiceRules temperature thresholds and useWeatherVoice path. Verify actual source before stating values. Add CampsiteComparisonSection hardcoded Celsius and m/s to the unit/rounding inventory. Record whether options change; do not alter thresholds or turn these findings into new implementation scope.

## Proposal accuracy and scope

Keep Open-Meteo mean-field availability attributed to CC's prior public-doc fetch, with exact period/completeness semantics UNKNOWN. Do not claim verified correct/cheapest aggregation or provider completeness handling. D1 uses already requested hourly data, but a valid period/cadence/completeness contract is still future design; no unconditional 24-sample prescription or mandatory cache bump for unchanged raw data.

Explicitly place finder missing-to-zero/rank changes and scoring sentinel fixes outside #444 implementation scope, as separately scoped follow-up candidates; owner selection in this proposal alone does not authorize them. #444 Phase B must preserve scores/ranks/verdicts for identical inputs. A relabel alone does not make missing-to-zero a valid observed mean; expose that limitation. Window min/max of tmax is extrema of daily highs, not the period's true minimum temperature. Note the homepage warmer chip's mean-of-daily-highs semantics for the owner's decision without changing it.

If inexpensive within the same pure script, add Jonesy's suggested hypothetical RC-08 actual rankWarmest comparison A [10,null,10] vs B [8,8,8], no rain/wind; record actual results and do not present synthetic frequency as production evidence. Tidy the garbled search entry/report sentence without inventing past commands; rerun any command needed to substantiate a corrected claim.

## Acceptance

R1/R2 are reflected consistently in audit, references, proposal and appended report. Evidence remains graded SOURCE/SAMPLE/INFERRED/UNKNOWN with local execution distinguished from Jonesy's sandbox and CC's prior fetch. The owner menu is bounded, labels are proposals, and scoring bugs are separate follow-ups. No implementation approved, no issue closure: #444 remains incomplete until an explicitly approved Phase B passes normal prompt/result review.
