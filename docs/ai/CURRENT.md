# Current AI Task

Task: ticket-434
Stage: CLOSED

Task directory:
docs/ai/tasks/ticket-434/

Prompt review:
docs/ai/tasks/ticket-434/prompt-review.md

Approved prompt:
docs/ai/tasks/ticket-434/approved-prompt-v2.md (tests/report correction only; v1 retained as executed immutable history)

CC report:
docs/ai/tasks/ticket-434/cc-report.md

Result review:
docs/ai/tasks/ticket-434/result-review.md (Jonesy Round 2 PASS; Ripley final PASS after v2)

## Current handoff

2026-10-06: Ripley final PASS after v2; independently reran 7 files / 62 tests, all pass. Local workflow CLOSED. CC's broader suite/lint/browser results remain attributed to CC. Owner-controlled production cookie check on campcast.is and eltumvedrid.is remains pending after deployment; no production verification claimed. Changes uncommitted, no push/deploy/GitHub closure. Owner controls next steps.

2026-10-06: Jonesy result review Round 2 on CC v2: PASS. F1-F6 and D1-D8 met; no production-file change in v2 (mtimes of all 9 production files identical to v1 review); new App wiring tests (13) and useLoginFlow prefill test verified against live source; browser rerun 46/46 anchored at /api/me response. Unverified by Jonesy (no shell): suite/lint/browser figures. Owner-controlled production cookie check on campcast.is and eltumvedrid.is still pending; server-side revocation unconfirmed when note is present. Awaiting Ripley final assessment. No commit/push/deploy/issue closure.

2026-10-06: CC executed approved-prompt-v2.md (tests and report correction F1-F6, D1-D8). Full suite: 165 files, 2483 tests passed. Lint exit 0. Explicit 20-file set: 242 passed. Browser rerun: 46/46 on the production preview, anonymous state anchored to /api/me. Production source hashes unchanged (9 files). Report appended to docs/ai/tasks/ticket-434/cc-report.md. Ready for Jonesy result review Round 2 (CC búinn). Owner production cookie check still pending. Status wording: browser logout; server-side revocation unconfirmed when note is present.

2026-10-06: Ripley created approved-prompt-v2.md incorporating Round 3 and Jonesy D1-D8, including before/after evidence preserving existing uncommitted v1 production changes. READY_FOR_CC for tests/report correction. CC awaits owner's Prompt approved; no test/application changes in this handoff.

2026-10-06: Jonesy Round 3 review of the tests/report correction prompt: APPROVED with conditions D1-D8 (DEV test needs MODE=development for DevProToggle; deterministic useMe wrapper anchor; campsite count baselines; non-tautological login-prefill test; no-production-change proof; accurate v2 report incl. door-glyph correction). v1 stays immutable; no CC execution authorization until v2 exists and the owner sends `Prompt approved`. No application/test changes by Jonesy.

2026-10-06: Ripley final assessment REVISE; independently reran 5 targeted files / 42 tests, all pass. Round 3 tests/report correction prompt ready for Jonesy review. No active CC execution authorization; v1 remains immutable. Full review loop required before creating v2. No application/test edits in this assessment.

2026-10-06: Jonesy Round 2 APPROVED with C1-C8. Owner explicitly approved the narrow backend cookie-expiry exception with “Samþykkt”. Ripley created approved-prompt-v1.md. CC executed it: backend cookie-expiry helper/logout wiring/tests, client logout action, useMe reset, useCampsites latest-wins, translations, and targeted tests. Lint, build, 146 targeted tests and 42 browser checks (production build, mocked sessions) pass. Status wording: browser logout; server-side revocation unconfirmed when note is present. Owner-controlled item still pending: production cookie verification on campcast.is and eltumvedrid.is. No commit, push, deployment, Neon call or GitHub closure. Jonesy result review Round 1 (2026-10-06): REVISE. Production code and backend cookie helper verified against source; missing mandatory tests (App-level visibility incl. Free/DEV-only/refetch-retained, anonymous check anchoring, Pro-to-Free reload + lastSite, no old email on login), other useMe consumer suites not run, one report inaccuracy (emoji screenshot). Owner-controlled production cookie check still pending. Ripley decides next step.

## Previous cancellation

Owner cancelled #433 on 2026-10-05. Its history and approved-prompt-v1.md remain historical only, with execution authorization withdrawn. No application code changes to revert. GitHub issue status was not changed.

## Previous tasks and sequencing

#420 CLOSED/PASS locally. #432 safety policy and share preservation remain binding. #423/#425/#426/#427/#428/#431/#432 CLOSED; #417 locally CLOSED with external verification outstanding; #415/#416/#411/#410 CLOSED; #409 unfinished/BLOCKED. #431 live GA4 verification remains unverified. #433 CANCELLED.

## Rule

Read docs/ai/README.md before workflow actions. No automatic commit, push, deployment, production DB mutation or GitHub closure.
