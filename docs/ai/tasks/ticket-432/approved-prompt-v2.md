# #432 — Approved corrective prompt v2

Date: 2026-10-03. Ripley final assessment follow-up to Jonesy's F1.

## Workflow

Read docs/ai/README.md and CURRENT.md. Verify READY_FOR_CC points here, then set CC_IN_PROGRESS. This narrowly addresses an unmet documentation requirement in approved-prompt-v1.md; all v1 runtime behavior and boundaries remain unchanged. Preserve v1 and prior report/review history.

## Required correction

Update JSDoc only to describe the implemented runtime contract:

1. In src/lib/weatherVoiceTypes.js, add WeatherVoiceVoiceLevel = "sarcastic" | "cautious" | "serious". Add required voiceLevel properties to WeatherVoiceActiveResult and WeatherVoiceActivePresentation using that typedef. Add the required sarcastic voiceLevel to WeatherVoiceCommentMetadata and WeatherVoiceCommentEntry, accurately reflecting the joke-only registry. Explain that tone is determined by condition, separate from severity/mood, and that safety presentations share the presentation contract but bypass joke history. Update the presentation-result description to include the dispatcher/safety path rather than implying only the joke selector produces it.
2. In src/lib/weatherVoiceShareSnapshot.js, add voiceLevel to the presentation input and returned snapshot JSDoc, accurately describing the sarcastic-only output and null for ineligible tone. Reuse shared JSDoc types where practical; no TypeScript syntax or runtime changes.

Do not change runtime behavior, copy, assets, generated manifest, released public/share files, thresholds, scoring or tests merely to accommodate documentation. No new tests are required for this comment-only correction. Do not expand into Jonesy's optional F2-F4 notes or redesign the serious mascot.

## Validation and reporting

Review the final diff to ensure only comments and workflow/report files changed in this correction. Run existing weatherVoiceTypes and weatherVoiceShareSnapshot tests and npm run lint. No need to regenerate exports, rerun browser matrix or repeat the full suite for JSDoc-only edits. If runtime edits become necessary, stop and report the reason.

Append a v2 section to docs/ai/tasks/ticket-432/cc-report.md recording exact files, commands/results and comment-only scope. Correctly attribute previous results: Ripley independently ran 26 Weather Voice suites / 534 tests successfully; the full suite/build/export/browser matrix remain CC's v1 evidence. Browser evidence event strings do not prove voice_level emission; the exact-payload hook tests do.

Populate the report path and set CURRENT to CC_COMPLETE after writing the report. Result review stays docs/ai/tasks/ticket-432/result-review.md. No commit, push, deploy or issue closure.
