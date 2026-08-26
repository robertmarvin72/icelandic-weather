# Ticket 395 — Approved revision prompt v2

## Reason for revision

Ripley's independent final-assessment run found that the targeted Ticket 395 suite is not environment-independent:

```text
DecisionQuizResearch.test.jsx
"shows the neutral unavailable state when config env vars are absent"
Expected: quiz-unavailable
Actual: quiz-consent

Test Files: 1 failed | 9 passed
Tests: 1 failed | 130 passed
```

The configured local environment contains valid `VITE_RESEARCH_QUIZ_*` values. The test does not explicitly clear/stub those values, so it tests the machine environment instead of its stated missing-config condition. This is a test-isolation defect; available evidence does not currently show a production fail-closed defect.

Jonesy's review also found one audit-text error: `cc-report.md` §6 says 30 columns / 9 top-level, while the implementation, README and live Sheet correctly use 31 columns / 10 top-level, including `scenario_order`.

## Workflow preflight

1. Read `AGENTS.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, `approved-prompt-v1.md`, `cc-report.md`, and `result-review.md`.
2. Verify `CURRENT.md` names `ticket-395`, references this v2 prompt, and is `READY_FOR_CC`; set it to `CC_IN_PROGRESS` before editing.
3. Do not alter or overwrite `approved-prompt-v1.md`, `approved-prompt-v2.md`, prior prompt-review history, prior CC-report facts, or prior review text.

## Required change

Make the missing/disabled configuration test in `src/pages/DecisionQuizResearch.test.jsx` deterministic regardless of `.env.local`, `.env.development.local`, CI secrets, shell environment, or test order:

- explicitly stub/clear every `VITE_RESEARCH_QUIZ_*` value relevant to `getResearchQuizConfig()` before rendering the missing-config case;
- restore stubs after the case/describe so it cannot contaminate enabled-flow tests;
- preserve explicit enabled-flow setup;
- ensure the test genuinely proves missing/disabled config renders `quiz-unavailable` and not consent;
- add or retain a distinct disabled-with-valid-URL assertion if needed to prove the lifecycle switch, but do not add redundant low-value cases.

Audit `getResearchQuizConfig()` first. Change production code only if the audit reveals a real fail-closed bug independent of test environment. Otherwise this revision is test-only.

Correct only the inaccurate `cc-report.md` §6 summary to say **31 columns: 10 top-level + 3×7 per-scenario**, noting that `scenario_order` is the tenth top-level column. Do not rewrite other factual report history. Append a short "Revision 2" section with the files changed and exact verification outcomes.

## Scope boundaries

Do not change quiz behavior, UI/copy, scenarios, payload/Sheet schema, Apps Script core/adapter, submission/CORS contract, CSP, analytics isolation, `HomeDecisionCard`, routing, dependencies, config names, or documentation except the one CC-report count correction. Do not commit or push.

If fixing the failure requires production behavior changes or reveals another failing Ticket 395 test, stop and report the evidence rather than expanding scope.

## Verification

Run at minimum:

1. `src/pages/DecisionQuizResearch.test.jsx` while valid research env values are present;
2. the exact 10-file targeted command recorded in `cc-report.md` and independently rerun by Ripley;
3. full `npx vitest run`;
4. `npm run lint`;
5. `npm run build`.

Report exact commands/results. Attribute the already completed live browser→Apps Script→Sheet smoke test to Róbert/Jonesy's prior evidence; do not claim to have rerun it.

## Handoff

Append the Revision 2 report to `docs/ai/tasks/ticket-395/cc-report.md`, preserve prior content, ensure the corrected 31-column sentence is accurate, set `CURRENT.md`'s CC report path to that file, and set `CURRENT.md` to `CC_COMPLETE`. Do not commit or push.
