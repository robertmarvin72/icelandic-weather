# #434 — Approved correction prompt v2

2026-10-06. Consolidates Ripley Round 3 and Jonesy APPROVED conditions D1–D8. Execute only this file when CURRENT references it at READY_FOR_CC and owner sends `Prompt approved`. Immutable once started. v1 remains historical and must not be re-executed.

## Scope

Tests and CC report correction only, addressing result-review F1–F6. Existing logout implementation remains unchanged. Read CURRENT, approved-prompt-v1.md, cc-report.md and result-review.md, and confirm wiring/fixture contracts read-only before edits. Existing owner cookie-fix approval stands; no new backend work. If a new test exposes a production defect, STOP and report to Ripley before changing application/backend code.

Allowed edits: tests, dated CC report correction, workflow lifecycle fields, optionally mocked browser harness/evidence. No dependencies/config/product entrypoints, production mutation, Neon calls, live accounts, commit, push, deployment or GitHub closure. No temporary production mutations to check tests; use positive controls below. Preserve unrelated changes and cancelled #433 history.

## Required tests (F1–F4, D1–D4)

Use real App/useMe/useCampsites/PageHeader/Toolbar/useLogout; stub fetch and heavy unrelated children only. The sole useMe wrapper is test instrumentation: vi.mock('./hooks/useMe', ...) uses importActual and calls the real hook, records its return object in a module-level ref and returns that exact object without overrides/state mocking. It lives entirely in the test file.

1. Anonymous resolved me with stored devPro=true must hide logout even with DEV=true. Stub both DEV=true and MODE='development'; use the real toggle (Dev Pro: ON, aria-pressed=true) as positive proof the override is active. Restore env/storage/mocks after each test.
2. Signed-in Free user shows logout; retain Pro positive controls. Pair anonymous absence assertions with signed-in row visibility using the same completion wait. Anchor resolved state to recorded loadingMe=false and me!==null, not merely fetch having been called. Separately test initial unresolved state with a held request and absent row.
3. Retained-user refetch: call recorded real refetchMe inside act; hold second me response open. Assert loadingMe=true, user retained and row visible, then release response. Do not substitute mocked hook state.
4. Production semantics DEV=false: stateful mock session flips on successful logout; campsite responses read that state, returning Pro list before and Free list after. Mount may request campsites before me and again after Pro resolves; record baseline only after Pro state/list settle, with Pro-only site visible. Successful Pro logout adds exactly one campsite request, produces Free list/presentation and removes Pro-only options. Assert rendered selection using actual picker interface (inspect it first) and persisted JSON lastSite: eligible site remains; Pro-only site falls back to first Free site. Do not add product labels for testing or alter fallback.
5. Signed-in Free logout adds no campsite request. Establish a positive success anchor (row gone/panel closed), flush act and one macrotask tick before asserting unchanged count. Preserve hook-level late-Pro-response coverage.
6. No old email on login reopen: prefer reachable real App entrypoint only if it requires no broader replacement of real auth flow. Otherwise use real useLoginFlow hook: signed-in me -> open/prefilled -> close -> rerender with user null -> reopen/empty. Test must NOT call setLoginEmail('') itself. Also test typed unsubmitted text replaced on reopen. Report chosen test form. No new login UI or auth redesign.

## Verification and scope evidence (F5, D5–D6)

Resolve test paths with rg --files. Run all Pricing*.test.jsx, PricingInfo*.test.jsx, NorthernLightsLanding*.test.jsx and Subscribe*.test.jsx suites. After additions run final combined new backend/logout/hook/Toolbar/CampsitePicker tests, all App.*.test.jsx and AppRoutes suites, or full npm run test:run. Report exact commands, per-file counts and totals (full suite may report file/test totals), and any existing failure by name. Run lint covering new tests. Attribute previous build to CC v1 unless rerun; tests-only work does not require another build.

Record every v2 touched file and before/after git status --short and git diff --stat limited to non-test api/src/i18n/config paths. Because v1 changes are already uncommitted, HEAD diff is expected to remain nonempty: compare v2-start and v2-end content/diffs (hashes or equivalent) for every existing non-test changed file and confirm no newly changed production files. Evidence must show no additional production change during v2, rather than claim the v1 working tree is clean. Do not reset v1 changes. No temporary production mutation check is authorized; explicitly say it was not performed.

## Report and browser evidence (F6, D7–D8)

Append dated v2 section to cc-report.md preserving v1 history. Explicitly correct misleading earlier door-glyph sentence after viewing evidence: mobile-320-en-signed-in-panel.png shows the glyph correctly; withdraw the claim or identify the actual failing screenshot. Update limitation status exactly for completed tests/runs. Unmount statement: failure after unmount is tested (no throw/toast); success after unmount still calls stale resetMe, currently untested, no observed defect. Do not present untested behavior as verified.

Either anchor browser anonymous check to /api/me response (page.waitForResponse registered before action), settled render and matching signed-in positive control, then rerun on mocked localhost:4173 preview; or explicitly label previous browser anonymity check unanchored and withdraw its claim of resolved anonymity. Browser rerun optional; unit anchor mandatory. Report whether browser and test:e2e ran, exact results and mock limits. No live production session testing.

Maintain wording “browser logout; server-side revocation unconfirmed when note is present”. Pending owner-controlled post-deploy checks on campcast.is and eltumvedrid.is remain explicit: applicable Domain/host-only cookies gone after logout and anonymous UI after refresh. Mocks/local/preview do not prove production clearing.

## Acceptance and lifecycle

F1–F6 addressed by non-vacuous tests, relevant suites and accurate report, D1–D8 incorporated. No production changes; discovered defect triggers STOP. Do not silently waive missing checks or fix adjacent security/UX concerns.

Verify CURRENT READY_FOR_CC referencing v2, then set CC_IN_PROGRESS before execution. Complete tests/report, keep CC report path docs/ai/tasks/ticket-434/cc-report.md populated and set CC_COMPLETE after report. Jonesy appends result-review Round 2; Ripley reassesses. No automatic git/issue operations.
