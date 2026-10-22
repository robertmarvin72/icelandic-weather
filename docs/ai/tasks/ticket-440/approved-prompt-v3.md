# #440 — Approved correction prompt v3

2026-10-22. Resolve Jonesy K1/K2 from v2 evidence. Prior versions immutable. Execute only on owner Prompt approved with CURRENT READY_FOR_CC referencing here. All prior scope invariants retained.

## Root cause and authorized correction

The v2 saved tab sequences show real Chromium focusable scroll containers absent from FOCUSABLE_SELECTOR. activeIndex===-1 treats these in-panel elements as outside and jumps to the header, skipping advanced toggle/footer Close. Our earlier wording conflated outside the dialog with outside the selector list; this correction supersedes it.

Fix only RoutePlannerDetailsModal.jsx Tab handler: distinguish focus genuinely outside panel from focus inside panel but absent from the selector list. Preserve native forward/backward traversal for browser-native scroll-container stops while still preventing escape at real edges. Retain deliberate initial scroll-region focus and predictable re-entry, first/last wrapping, disabled/hidden exclusion, dynamic advanced content and keyboard scrolling. Do not blindly disable the trap or change tables/card/other modals. If native traversal can escape from an unlisted final scroll stop, address that boundary locally with demonstrated tests. No global focus/lock redesign.

## Tests and meaningful browser checks

Add focused tests to the new a11y file for in-panel focus not in the selector list versus genuinely outside focus, in both directions, confirming no erroneous preventDefault/jump for the former. jsdom cannot prove Chromium implicit scroller focusability; use it for handler decisions only. Existing #436/#441 and unrelated assertions untouched.

Extend the retained capture harness with named failure-producing checks, not merely a tabOrder dump. At mobile320x568 and landscape667x320, advanced collapsed AND expanded, forward Tab must reach the advanced toggle and footer Close without prematurely cycling; reverse Shift+Tab must reach those controls and wrap while staying in dialog. Record actual element identities/order with bounded traversal that fails if missing/repeated prematurely. Include desktop and IS/dark representative coverage from v2, while retaining layout/keyboard-scroll/lock/touch/close/focus-return checks.

Before source fix, run the strengthened harness against the current v2 build and save expected-red named K1/K2 failures. Then implement modal-only fix, build and capture v3-final evidence with source hash/build identity and served assets; preserve v2 historical results. No unsafe production mutation needed: baseline v2 already demonstrates bug. Keep scripts and exact commands. Inspect screenshots; distinguish measured assertions from observations.

Correct report's false v2 statement that no table container became a native stop and that recorded order matched selector list. Data showed otherwise. Explain the 60/60 run lacked tab-order assertions and did not prove traversal. Append dated v3 correction, K1/K2 disposition, expected-red and final green results, scope and limitations. Earlier B1 lock/advanced work remains valid, no need to reinterpret as failure.

## Validation/scope

Run modal/a11y, card/canonical-tone/caution/table targeted suites, full npm run test:run, npm run lint and npm run build after final source/test edits. Run harness against this final build with fresh results. No source changes after capture without rebuilding/recapturing relevant evidence. Report exact counts and any failures, never call missing checks passed.

Only modal, its new a11y tests, retained harness/evidence, cc-report and CURRENT lifecycle. No RoutePlannerCard, RouteCompareTable, other modals, hazard note, helpers, translations, scoring/gating/provider/data/backend/cache/analytics changes or dependencies. STOP if wider changes needed. No live account/provider requests, commit, push, deploy or GitHub action. Mobile Safari/real device remains unverified.

## Lifecycle

Verify pointer, set CC_IN_PROGRESS, implement and validate only this correction, write docs/ai/tasks/ticket-440/cc-report.md, populate report path and set CC_COMPLETE. Owner requests Jonesy narrow review then Ripley final assessment.
