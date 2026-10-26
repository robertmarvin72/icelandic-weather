# #444 — Approved Phase B correction v5

2026-10-26. Ripley REVISE on Jonesy's v4 re-check R3. Execute only after owner Prompt approved and CURRENT READY_FOR_CC references this file. Read approved-prompt-v4.md and latest result-review.md. Earlier versions/history immutable. All original scope constraints persist: no strings, ranking/scoring/provider/API/gating changes, dependencies, subagents, commit/push/deploy or GitHub mutations.

## Single production correction

In WeatherFinderCard warmest JSX, the name wrapper currently has `flex items-center gap-3` without desktop growth. Add `min-w-0 sm:flex-1` to that wrapper so the metric block aligns to the right edge at sm+ again. Do not redesign, touch mobile stacking/calmest/driest, or alter wording/data. Verify actual source first. R1/R2/J4 from v4 are already resolved, preserve them.

## Validation and evidence

Add a meaningful desktop browser geometry assertion: all warmest metric blocks have equal right edges within 1px across the displayed rows; identify the metric block explicitly rather than measuring text width. Capture and inspect a desktop screenshot showing that alignment. Rerun current 320/375 name-span geometry assertions in EN/IS, preserving readable short fixture names, documented long-name fallback and real selection buttons. Existing toast dismissal/missing-day response accounting and imperial evidence must remain valid. Rerun existing ticket browser spec rather than a weakened subset, targeted card/parent/helper tests, lint/build as necessary to serve current production preview. No new tool installs or live provider/account calls. Show empty production engine/App/hooks diff as in v4.

## C1 — record uncertainty honestly

Ripley independently ran `npx vitest run src/App.affiliateHolder.test.jsx src/components/WeatherFinderCard.test.jsx src/components/WeatherFinder.completeness.test.jsx src/lib/weatherFinderDisplay.test.js`: 4 files/46 tests passed. Immediately ran affiliateHolder alone: 4/4 passed. These were local checkout runs outside sandbox (known Vitest EPERM temp-file issue). Therefore the v4 failure was not reproduced; its cause remains UNKNOWN. Do not claim it is conclusively pre-existing or resolved, and do not ask owner to repeat these already-performed checks as a prerequisite. No unrelated affiliate fix authorized. Preserve the earlier observed full-suite failure as historical evidence and append these new results; do not call the entire full suite green based on targeted passes. No clean-checkout or full-suite verification by Ripley is implied.

## Lifecycle

Set CURRENT CC_IN_PROGRESS before work. Append v5 cc-report with the exact production change, alignment screenshot/assertion results, targeted/browser commands and C1 clarification. Keep earlier reports intact and correct inaccurate 'desktop unchanged' claims via an appended correction. Set CC_COMPLETE for Jonesy's short re-check. No automatic issue closure. Remaining zero-coercion/scoring limitations remain separate follow-up candidates.
