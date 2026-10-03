# #420 — Approved corrective prompt v2

Date: 2026-10-03. Ripley final-assessment correction.

## Workflow and confirmed owner decision

Read docs/ai/README.md and CURRENT.md. Verify READY_FOR_CC points here and set CC_IN_PROGRESS before edits. Preserve approved-prompt-v1.md and previous reports/review history.

Róbert directly confirmed in the Ripley chat: **"Já samþykkt"**, answering whether rain_13 ("Þetta er mjög íslenskt.") should remain inactive as currently implemented. N1 is resolved. Keep excellent_17 active, rain_13 reserved and the current 91 active entries per language (good 22, excellent 21, rain 18, cold 14, sun_wind 16). This explicitly amends v1's 92-entry ledger; all other approved content and boundaries remain unchanged. Current totals are 11 retained + 80 new active, 25 reserve, 16 retired, 63 excluded, four separate safety messages, 182 active share pairs, 320 new share files and 108 unchanged pre-existing released files.

## Correction scope: documentation and test labels only

1. docs/analytics/weather-voice-production-validation.md section 13: fix the Interpretation bullet from 92 to 91 active IDs. Preserve historical pre-amendment report sections; do not globally replace old numbers.
2. src/lib/weatherVoiceVoiceLevel.test.js: fix the test title mentioning 92 active entries (91, or count-independent wording).
3. src/lib/weatherVoiceShareCatalogue.test.js: correct the comment currently saying 92 active IDs / 184 pairs to 91 / 182, or use accurate count-independent wording. Jonesy's review mentioned 27/54, but Ripley verified the live comment is 92/184. Do not change assertions.
4. src/lib/weatherVoiceContent.test.js: correct the comment saying real EN is 'genuinely 27 entries now'; distinguish historical #412 context from the current expanded pool, preferably without another fragile current-count claim.
5. docs/ai/tasks/ticket-420/content-validation.md section 4: quote rain_04 accurately as `Já já. Rigning.` versus rain_21 `Rigning. Klassískt.`. Describe the shared rain-label framing and distinct resignation/classic beats accurately. Remove the unexplained similarity figures for this pair rather than presenting unverified precision. Keep both IDs active; no editorial change.
6. In the same validation document, distinguish accepted caveats from unresolved owner decisions. sun_wind_04 and good_16 wording were explicitly approved unchanged in this chat; no Icelandic-reader approval or trimming decision remains required. good_21's exception was also already approved. Record the rain_13 confirmation above. Future optional rewording or legacy-URL decisions are not blockers in this ticket. Do not remove genuine residual limitations or rewrite prior task history.

No runtime, ledger text/status, assertions, generated manifest, public/share artifact, asset, scoring, safety or selector changes. If a runtime change appears necessary, stop and report it instead of expanding this micro-pass.

## Validation and reporting

Inspect the correction diff for comments/test titles/docs/workflow only. Run existing weatherVoiceContent, weatherVoiceVoiceLevel and weatherVoiceShareCatalogue suites, plus npm run lint. No new tests, full build, exporter or browser rerun is needed for these label/documentation edits. Do not regenerate artifacts unnecessarily.

Append v2 execution evidence to docs/ai/tasks/ticket-420/cc-report.md: exact edits and commands/results, no runtime changes, and direct owner confirmation now recorded by Ripley. Keep prior evidence attributed correctly: Ripley independently passed 30 Weather Voice suites / 765 tests and lint; full-suite/build/export/browser evidence remains CC's previous evidence. Confirm no pre-existing released file was modified or deleted.

Populate CURRENT's report path and set CC_COMPLETE after the report. Result review remains docs/ai/tasks/ticket-420/result-review.md. No commit, push, deployment, automated post or GitHub closure.
