# #460 — Approved correction prompt v2

2026-10-26. Narrow Jonesy R1/R2 correction, v1 immutable. Execute only on owner Prompt approved with CURRENT READY_FOR_CC referencing here. Preserve monotone risk/coverage policy, thresholds, entitlements, canonical tone and no-subagent/no-git-mutation boundaries.

## R1 safe helper fallback

In getRouteRiskSummary (routePlannerDetailsHelpers.js), make MED explicit. Non-null data with unrecognised/missing/null routeRisk returns the same neutral unknown shape as UNKNOWN, never MED/LOW wording. Preserve null data = absent and LOW existing suppression. Add tests undefined/null/FOO categories, non-mutation and normal MED/HIGH/LOW behavior. Correct the closed-set comment. No card/narrative/scoring redesign.

## R2 meaningful browser evidence

Add explicit request-response accounting to retained tests/e2e/route-risk-ticket-460.spec.js. Fresh context per scenario. For partial-unknown and partial-high record exact coordinates/cache keys, successful base/candidate fetches, failed interior route-point responses, count expected actual mocked HTTP requests/500 responses and prove relevant responses were delivered before UI assertion. Distinguish seven estimator sample attempts from cache-deduped endpoint requests. No cache policy change merely to manufacture a test. Test must fail if handler returns success instead of the intended failed-interior fixtures. Keep self-contained spec/config/evidence copies current and rerun on a fresh final production build; inspect screenshots and dismiss optional PWA toast where feasible without app changes. Exact commands/results/browser version/build identity in report.

Ripley waiver, narrowly scoped: 7-of-7 NETWORK REJECTION in a successful real-app recommendation need not be fabricated by bypassing endpoint cache/base-candidate wiring; existing estimator7point/rejection and hook visibleUNKNOWN tests are accepted for that case. This is not a waiver for null/short-array inputs: ensure real estimator tests cover all-null and short wind/gust arrays and explicit UNKNOWN/no invented maxima; add focused tests if absent. Distinguish actual tested scenarios and reachability claims from provider missing-data behavior, which is unknown.

Stale-candidate race browser scenario waived on basis of deterministic hook delayed/cancel tests only after CC identifies exact test and asserts old result cannot label new pair. Do not claim browser coverage for it. If hook tests do not establish it, extend focused hook test rather than silently accepting. No changes to hook behavior outside already-approved safeguards without evidence.

## Other review notes

Retain partial qualifier 'based on partial route data' as accepted lower-bound context for this correction; no new translation/copy redesign required. UNKNOWN with Move remains neutral uncertainty on unchanged recommendation (as approved), not an instruction to drive safely. dateVerified partial-date caveat and lack of timeout remain documented. Source-note exactly-one rules unchanged. N2 date semantics not expanded here.

## Scope / validation / report

Only helper+focused tests, browser spec/config if required for evidence, saved artifacts and task report/CURRENT. No provider/threshold/scoring/gating/payment/other-null-default/instruction changes. Existing new Playwright config may be retained; no new package or service beyond preview harness. No live provider/account/secret access, commit/push/deploy/GitHub mutation. STOP on broader reach.

Run helper/estimator/hook/summary/modal/card/caution/canonical targeted suites, full npm run test:run, npm run lint and npm run build after final edits, then final browser test on that build. Report fresh counts and retained waivers accurately; no historical tests represented as fresh. git diff --check and scoped status. Append v2 R1/R2 correction in docs/ai/tasks/ticket-460/cc-report.md, visibly supersede inaccurate claims and record exact network evidence and explicitly waived scenarios.

## Lifecycle

Verify CURRENT, set CC_IN_PROGRESS, implement/test only this correction, write report/populate path, set CC_COMPLETE. Owner requests Jonesy narrow review then Ripley final assessment. No automatic CLOSED.
