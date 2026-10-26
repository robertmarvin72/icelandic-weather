# #464 — Approved research correction v2

2026-10-26. Ripley REVISE after Jonesy's research result review R1–R3. Execute only on owner Prompt approved with CURRENT READY_FOR_CC referencing this file. Read immutable v1 and result-review.md. Retain all original research-only safety constraints. Set CC_IN_PROGRESS before work; append cc-report correction and set CC_COMPLETE after verification. No production/source/test/config/i18n/instruction edits, scoring/threshold/provider/cache changes, dependency, subagents, git/GitHub mutation or live forecast/account call.

## R1 — conditional code/gust feasibility, not a historic cause

The original code=1 fixture was an assumption based on a displayed description. That label may be summaryCode derived from hourly data, not raw daily.weathercode used by scoreSiteDay. Raw scoring code is UNKNOWN; do not substitute summaryCode. Label all such numerical breakdowns synthetic actual-function execution, never a reconstruction of the original payload or a uniquely most-parsimonious cause.

Extend the existing pure task-local script and retain exact command/output for Oct-28 baseline tmax5.8/wind5.1/rain0, date2026-10-28, sweeping code null,0,1,2,3,45,51,61,95,66,67,71,77,85 at least. State no-gust definition and searched domain/step/rounding, compare windGust missing vs wind-equal if materially different. Verify first Bad on this grid rather than adopting reviewer numbers: clear0/1 about11.1, common non-clear codes about8.0, wintry codes may already be Bad with no gust. Show components, not just label, and state these are conditional sufficient examples, not exhaustive historic explanations. Add Oct-27 overcast raw code3 with the reported rounded baseline and no gust; verify Fair, if so resolve that formerly missing possibility. Include narrower code3/45 sky penalties vs wintry penalties; never generalize four swept codes to all weather codes.

Correct all current conclusions consistently in research-report (4a/6a/9 and elsewhere), reproduction-cases, next-steps, cc-report and CURRENT. Remove unqualified most-parsimonious gust claims and universal 11.1–14.9 hidden-band claims; state code-dependent bands and no-gust alternatives. Preserve historical outputs/assumptions as clearly superseded evidence. Visible tmax/wind/rain alone are insufficient to identify a daily grade because raw code/gust and other provenance are missing; do not claim Bad is impossible across unknown codes. Historical reconstruction remains NOT HISTORICALLY REPRODUCED.

## R2 — correct local parse/local formatting claim

Correct section6e: a timezone-less local timestamp parsed and formatted in the same local timezone normally retains its wall-clock hour; being outside UTC+0 alone does not shift Oct-28 labels. Use a small retained task-local Node check with child-process TZ or equivalent, no system setting changes: Atlantic/Reykjavik, America/New_York, Asia/Tokyo, midnight and21:00 on2026-10-28, EN/IS locale outputs, Node/ICU versions. Include a spring-forward nonexistent-local-time example (New York2026-03-08T02:00) as a labelled edge counterfactual, not the observed October cause.

Complete J6 separately with real getSeasonForDate on YYYY-MM-DD Oct1/May1 in those process timezones: UTC date parse plus local getMonth can change the season west of UTC. State scope/engine and that this boundary effect does not explain Oct27/28 in Iceland. Use exact actual function/formatting behavior or label any illustrative model explicitly; no production extraction/refactor needed.

## R3 — intent/proposal labelling

Relabel gust>=15 display gate finding from verified bug to verified display gap, product intent UNKNOWN. Gate and its omission can be verified; whether threshold is a defect needs owner/product decision. Correct affected numerical band per R1 and keep any proposed UI change as a separate, unapplied follow-up draft. Check related headings/intro terminology for consistency; do not automatically recategorize unrelated findings without evidence. Add the useful rule-gap example: wind5/gust8 can be hourly Good while winter daily gustiness penalty applies; cite actual-function output if used.

## Validation and handoff

Only task documents/harness and CURRENT edited. Existing real component harness remains valid; rerun it if changed, otherwise attribute its existing results accurately (Ripley independently17/17 on2026-10-26). No full suite/build/browser needed for this research correction. Retain new script outputs/commands and source hashes, verify git status/diff --check and no application changes. Append a corrected owner-facing summary to report, clearly superseding the original CURRENT/CC headline instead of leaving it as current guidance. No claim of official meteorological validation, confirmed historic cause, deployed fix or GitHub closure. Jonesy short re-check then Ripley assessment.
