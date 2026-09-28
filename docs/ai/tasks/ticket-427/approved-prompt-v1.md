# #427 — Approved implementation prompt v1

Date: 2026-09-28. Prepared by Ripley after Jonesy APPROVED Round 2.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/427

## Objective and verified context

Fix English third-night weekday labels in the Icelandic Northern Lights UI. src/lib/auroraNightLabel.js already requests is-IS, but the browser used in #425/#426 silently resolved it to English, producing Wednesday and Wednesdaykvöld. Locale selection alone is insufficient. Use deterministic translation keys instead of Intl.

Both formatNightTabLabel and formatNightWhenLabel share weekdayName. NorthernLightsThreeNight uses them for date buttons, comparison copy and selected-night captions. Both homepage languages use this module; /en/northern-lights intentionally forces English even with saved Icelandic. Preserve these contracts. #426 is CLOSED; #427 is the sole active task.

## Implementation

1. Remove Intl from weekday-name resolution entirely. Use one shared internal helper with a seven-entry list of stable translation keys, indexed by new Date(`${date}T00:00:00Z`).getUTCDay(), Sunday at index 0. Resolve through the existing language-bound t function. Store the seven names for each language in src/i18n/translations.northernLights.js. No duplicate literal weekday tables in production helpers or components.
2. Use this single path unconditionally for tab labels and night phrases. Preserve public helper arguments, valid YYYY-MM-DD caller contract, UTC interpretation and daysAhead 0/1 early returns. Keep lang and t paired at call sites, including forced-English landing. No browser-local timezone or changed date/forecast/scoring inputs.
3. Exact weekday labels, in Sunday-to-Saturday order:
   - IS: sunnudagur, mánudagur, þriðjudagur, miðvikudagur, fimmtudagur, föstudagur, laugardagur.
   - EN: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.
   Preserve Icelandic lowercase and English capitalization.
4. Reuse the existing Icelandic genitive stem transform unchanged. Exact compounds: sunnudagskvöld, mánudagskvöld, þriðjudagskvöld, miðvikudagskvöld, fimmtudagskvöld, föstudagskvöld, laugardagskvöld. English remains the weekday followed by the existing night phrase. Never produce Wednesdaykvöld. Preserve all surrounding copy and nlTabTonight/nlTabTomorrow/nlWhenTonight/nlWhenTomorrowNight. Do not rewrite unrelated Pro caption grammar or other translations.
5. Do not introduce locale requests, resolvedOptions/supportedLocalesOf checks, fallback branches, Intl catches, polyfills or browser-wide locale changes. Update misleading source/test comments about Intl and translation keys. Preserve #425/#426 historical reports; report their locale limitation resolved only after verification.

## Verification

- Table-driven helper tests for seven consecutive known UTC dates, both tab and night outputs, both languages, using real translation dictionaries. Assert the exact strings above and exact day-0/day-1 output.
- Focused regression proving both helpers return real translated day-2 labels when Intl.DateTimeFormat is unavailable or throws. Restore mocks after testing. Do not mock the translator to return expected weekday strings. No locale-request assertion or supported/unsupported locale matrix is needed.
- Cover a host timezone that would otherwise yield the previous day, plus month/year boundary dates.
- Real shared-module integration: appropriate selected third date yields miðvikudagur and miðvikudagskvöld on IS homepage, Wednesday/Wednesday night on EN homepage; landing stays English with saved IS. Exercise language switch retaining selected day 2 and verify no new fetch/selection/analytics behavior on language-only rerender. No raw translation keys or mixed-language compounds. Integration need not repeat an Intl-failure matrix.
- Run affected label, shared-module, homepage and landing tests, changed-file lint and production build.
- Browser-check the previously failing headless runtime with deterministic forecast stubs and a fixed date. Verify IS third-day button/caption, EN homepage and forced-English landing at mobile and desktop. Capture relevant screenshots and record exact date/language evidence. Confirm Wednesday is absent from the IS third-day label and compound. Node-only tests do not close the browser limitation. No live weather/DB/cron needed.

## Boundaries and STOP conditions

Allowed: src/lib/auroraNightLabel.js, existing translations.northernLights.js, focused tests and task docs. A narrowly necessary shared label call-site adaptation is allowed; no duplicate per-surface implementation.

No weather/scoring/candidate/date-window/freshness/entitlement/payment/analytics semantics, new routes, general language-switch behavior, unrelated copy or layout changes. No new libraries, TypeScript or explicit import extensions. If a required change extends beyond this presentation-localization scope, stop and report evidence before implementing it. Preserve existing work and earlier task history. No commit, push, deployment or GitHub issue closure.

## Required workflow

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and docs/ai/CURRENT.md. Verify CURRENT is READY_FOR_CC and references this prompt. Set CC_IN_PROGRESS before implementation. Execute this approved prompt only; prompt-review.md is history, not an execution prompt.

Write docs/ai/tasks/ticket-427/cc-report.md with changes, exact commands/results, browser evidence, screenshots and limitations. Populate that report path in CURRENT and set CC_COMPLETE after writing the report. Jonesy result review path is docs/ai/tasks/ticket-427/result-review.md. Do not close the task yourself.
