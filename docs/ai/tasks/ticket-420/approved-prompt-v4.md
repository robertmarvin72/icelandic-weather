# #420 — Approved corrective prompt v4

Date: 2026-10-03. Ripley final-assessment REVISE. Narrow completion of v3 documentation requirements.

Read docs/ai/README.md and CURRENT. Verify READY_FOR_CC points here, then set CC_IN_PROGRESS. Preserve v1–v3 and prior report/review history. Runtime remains 113 primary + 3 supplemental bilingual IDs, 226 share pairs, 516 share files. No new editorial decision is pending.

## Owner authority resolved

The user directly saw the complete 25-row list and said "Þessir textar mega allir vera virkir", then chose "Auk varúðartextans (ráðlagt)" for the three ark lines. This includes all 12 previously flagged HOLD lines: cold_04/05/06/13/17/24, good_12, rain_10/15, sun_wind_06/21/22. Ripley confirms these IDs are a subset of that explicit approval, not an inferred new permission. Do not ask again. sun_wind_04 and good_16 were explicitly approved unchanged earlier. Record that status accurately in current docs, retaining residual editorial caveats.

## Required micro-fixes

1. docs/analytics/weather-voice-production-validation.md section 13 Interpretation: remove obsolete 'now spans 92 IDs instead of 13'; say the full active primary set instead of the original 13, or state 113 accurately. Keep supplemental event semantics separate.
2. src/lib/weatherVoiceShareCatalogue.test.js comments currently '92 active ids * 2 languages = 184': use count-independent ledger-based wording. Do not alter assertions.
3. src/lib/weatherVoiceContent.test.js comment 'genuinely 27 entries now': distinguish historical #412 context from the current expanded library with count-independent wording. Do not alter assertions.
4. content-validation.md section 3: replace the unresolved 'blásið needs an Icelandic-reader check' wording with the actual owner confirmation. Check Bible section 14 and current validation text for 'HOLD override requires confirmation' wording and mark the 12-ID subset explicitly approved as recorded above; keep the factual caveats and scope to these IDs only.
5. Append a correction to cc-report.md acknowledging that the earlier claim of completed count-label cleanup was premature and specifying these exact remaining fixes. Preserve earlier report text as history; do not imply it was already correct. Briefly scan current #420 doc addenda and affected test comments for the same stale counts; do not rewrite historical snapshots or old report counts.

Comments/test labels/docs/workflow only. No runtime, text library, ledger status, test assertions, generated manifest, share artifacts, safety/selector/history or UI changes. No regeneration/build/browser rerun for this micro-pass. No commit, push, deployment or GitHub closure.

## Validation and handoff

Run existing weatherVoiceContent and weatherVoiceShareCatalogue suites and npm run lint. Inspect the correction diff to confirm the narrow scope. No new tests needed. Report exact commands/results and source searches showing F1/F2/F4 corrected; do not claim every occurrence of historic counts is an error.

Ripley independently verified v3: 33 Weather Voice suites / 874 tests and lint passed; all 428 pre-v3 public/share SHA-256 hashes match; 516 files exist; git diff shows no tracked share or primary weatherVoiceHistory.js change. Broader suite/build/export/browser evidence remains CC's v3 evidence. Midnight browser transition remains an explicitly unverified limit, not a new requirement in this comment-only pass.

Append v4 section to docs/ai/tasks/ticket-420/cc-report.md, populate CURRENT report path and set CC_COMPLETE after writing it. Result review remains docs/ai/tasks/ticket-420/result-review.md.
