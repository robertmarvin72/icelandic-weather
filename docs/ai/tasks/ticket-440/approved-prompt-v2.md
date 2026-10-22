# #440 — Approved correction prompt v2

2026-10-22. Jonesy result-review R1–R7 correction. V1 immutable. Execute only on owner Prompt approved with CURRENT READY_FOR_CC referencing here. All v1 scope invariants remain binding.

## Objective

Close missing/incorrect browser evidence and reporting. Layout source looks correct; do not redesign it. A failed explicit acceptance criterion cannot be relabelled out of scope. Application scope remains RoutePlannerDetailsModal.jsx only, and only if a subsequent approved fix becomes necessary. No RoutePlannerCard/other-modal/helper/scoring/gating/data/provider/copy/analytics changes.

## Required corrections

R1: retain a reproducible Playwright harness under outputs/ticket-440-browser-evidence/ with exact run command and deterministic fixtures matching real hook contracts. Reuse legitimate non-preview UI state, actual working card opener, no debug entrypoint. Preserve original before/after artifacts as historical, including failed checks; produce new versioned final evidence. Use a fresh final production build and record source/build identity/timing. Do not delete the harness.

R2: actually expand advanced content. Assert toggle label changes, advanced table exists and is visible/reachable, content height grows and nested table scrollWidth > clientWidth on narrow viewport; prove horizontal scrollLeft changes. Distinct collapsed/expanded screenshots and measurements required; no identical image presented as separate coverage. If fixture cannot produce overflow, adjust mocked valid data, not application content or entitlement rules.

R3: measure lock after opener click/automatic scroll/focus settles. Record window.scrollY before interaction separately from immediately-after-open baseline; compare wheel over content at middle/top/bottom, wheel on backdrop and supported touch emulation against that post-open baseline. Record computed html/body overflow and activeElement. Record close and focus-return scrollY. If actual page lock fails after controlled measurements, STOP and report cause/evidence/options to Ripley; do not call it pre-existing or change html lock/global ownership/other modals. This prompt does not preauthorize a lock-mechanism change.

R4: real browser evidence for keyboard scroll immediately after opening (ArrowDown/PageDown/Space and scrollTop), Tab/Shift+Tab sequence collapsed and expanded, focus stays in dialog, Escape closes once, header/footer/backdrop close independently, panel click stays open, reopening and focus return to actual enabled opener with preventScroll. Real touch gesture via supported Chromium automation where available, accurately labelled emulation, not mouse-wheel-as-touch. Record boundary chaining and underlying page position. Include mobile320x568, short landscape667x320, desktop1280x900, IS/EN and light/dark representative checks including short landscape IS/dark. No real Safari/device claims.

R5: visibly correct report claims: baseline desktop also clipped (panel763/scrollHeight1140), advanced scenario previously unproven, body-lock explanation unsupported, deleted harness was contrary to prompt, original after artifacts preceded final source edit. Correct new test file's nonexistent round6-browser-evidence reference and misleading both-real-openers test title/comment (only one actual opener works). Existing generic opener test can remain, accurately named. No existing #436/#441 assertions modified.

R6: identify specific element(s) causing panel.scrollHeight > clientHeight on mobile/landscape with computed styles and bounding boxes, including position/containing block and scroller boundaries. Establish whether anything visible/focusable is clipped or unreachable. Do not merely speculate. If a real remaining clipping/accessibility defect requires code changes beyond minor modal-only correction, STOP with evidence/options first.

R7: after final edits run targeted modal/card/canonical-tone/caution/table suites, full npm run test:run, npm run lint and npm run build. Run final harness against that final build; no application/test edit after capture without rebuilding/recapturing if relevant. Inspect screenshots; exact fresh counts/commands, no unqualified PASS with failing acceptance checks. Browser script evidence must fail meaningfully when required interactions/measurements fail.

## Ripley decisions and limits

The 116px landscape scroller appears tight but potentially usable, not by itself a reason to redesign header/footer. Demonstrate actual scrolling and access before judging usability; STOP if unusable. Programmatic initial container focus without an outline is accepted provisionally only if keyboard scrolling works immediately and subsequent interactive focus is visible; record the actual tab order including browser-native horizontal-scroll-region tab stops. Do not silently claim browser order equals the JavaScript focusable selector.

Do not expand production code scope to fix optional findings. Primary deliverables are retained harness/evidence, accurate test naming and report. New source edits if any must be disclosed and justified within existing approved modal scope; actual lock failure invokes R3 STOP before fixing. No new package, live service/account request, commit, push, deploy or GitHub mutation.

## Report/lifecycle

Append dated v2 section to docs/ai/tasks/ticket-440/cc-report.md, correct current false claims visibly and retain historical raw results. Include B1–B7/R1–R7 disposition, pre/post tables, exact scenarios/working opener, missing evidence and any STOP. Mocked/emulated vs real-device clearly separated. Status implemented/reviewed only.

On owner Prompt approved verify CURRENT, set CC_IN_PROGRESS; execute this correction. Write report, populate its path and set CC_COMPLETE (even an evidence STOP must be plainly reported, not passed). Jonesy review then Ripley final assessment.
