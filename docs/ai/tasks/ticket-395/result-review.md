# Result Review — Ticket 395 (Research: reusable UX comprehension quiz for #377)

Reviewer: Jonesy
Input: `approved-prompt-v1.md` (confirmed to be draft v3 = v2 + all eight Round-2 amendments, verbatim), `cc-report.md`, the actual files in the working tree, and a real, owner-performed end-to-end smoke test (browser → deployed Apps Script → live Google Sheet) — the strongest evidence this workflow has had on any ticket so far, since it's not just code-reading but an actual production-shaped run.

## Compliance with approved prompt

- **CORS simple-request constraint (§"Required preflight" #4, "Browser submission").** `google-apps-script/decision-quiz/adapter.js` returns `ContentService.createTextOutput(...)` (confirmed by reading the file — never `HtmlService`, with a `CRITICAL` comment at the top of the file reinforcing why). The live smoke test proves this end-to-end: a real browser `fetch()` from `localhost:5173` reached the deployed script and the frontend correctly reported success, which is only possible if the simple-request/`ContentService` combination actually works as designed — this isn't a claim taken on faith, it's now observed behavior.
- **CSP scope (§"Participant route, access and lifecycle").** Read `vercel.json` directly: the `headers` block is scoped to exactly `/research/decision-quiz`, with exactly one directive (`connect-src`) and exactly three sources (`'self'`, `script.google.com`, `script.googleusercontent.com`) — no wildcard, no unrelated directive touched. Matches the approved prompt's authorization exactly.
- **Testable core/adapter split (§"Google Apps Script artifact and testable core").** Read `core.js`: a single `DecisionQuizCore` IIFE global with no Apps Script/Node/browser reference, owning validation, formula-neutralization, idempotency-key derivation, row construction, and the full `processSubmission` orchestration with injected `boundaries` (lock/sheet/now). Read `adapter.js`: the only file referencing `PropertiesService`/`SpreadsheetApp`/`LockService`/`ContentService`, contains no validation logic of its own. Per the cc-report, this is the same literal file uploaded to Apps Script and loaded by Vitest via a `vm`-based loader — and this claim is now independently corroborated, since the file Róbert pasted into the live Apps Script editor (verified against the repo file, byte-for-byte, during setup) is what actually produced the correct row in the Sheet.
- **Analytics isolation (§"Analytics isolation").** Read `HomeDecisionCard.jsx` directly: `disableAnalytics = false` by default (line 55), and all 7 `trackEvent` call sites are gated behind it (`if (disableAnalytics) return;` for the four effect-driven events, `if (!disableAnalytics) trackEvent(...)` for the two click handlers) — count and gating pattern match the cc-report's claim exactly, verified against source, not narrative.
- **Route registration (§"Participant route, access and lifecycle").** Read `AppRoutes.jsx`: `/research/decision-quiz` is registered once, explicitly commented as unlisted, placed immediately before the catch-all `*` route. Grepped the whole repo for `research/decision-quiz` — it appears only in the route file, the Apps Script adapter's own doc comment, docs, config, and this task's own workflow files. No sitemap, nav, or marketing surface references it.
- **`api/` untouched.** Directory listing of `api/` confirms `campsites.js`, `_lib/getMe.js`, and every other pre-existing file under `api/` has an unchanged modification time from before this ticket. No Neon table, migration, or application API/backend was added — matches the ticket's central constraint.
- **Sheet schema and scenario-order-relative columns (§"Result payload and Sheet schema").** The live Sheet row Róbert produced has exactly the 31 columns `docs/research/decision-quiz/README.md` documents (10 top-level including `scenario_order`, plus 3×7 per-scenario), and `scenario_1_*`/`scenario_2_*`/`scenario_3_*` correctly followed that row's own `scenario_order` (`consider,stay,move`) rather than a fixed order — this is exact, observed confirmation of a specific, easy-to-get-wrong requirement.
- **No PII, no participant-supplied correctness.** Confirmed in the live row: no name/email/account/cookie/IP/user-agent/precise-location field exists in any column, and `interpretation`/`reason`/`action` are the only participant-supplied scenario fields — no `correct`/`incorrect` value.

## Technical assessment

No material defect found. The three-way cross-check this ticket got — approved prompt → source code → a real deployed artifact producing a real Sheet row — is stronger evidence than either Ticket 390 or 391 had, since those relied on code-reading and CC's self-report alone (no live execution was possible in this session for those). Here, an actual production-shaped path was exercised by the ticket owner himself.

## Test and validation assessment

`cc-report.md` claims 131/131 targeted tests, 809/809 full suite (up from 717/64 files, net +92 tests/+8 files), lint exit 0, and a successful production build. As before, this session has no shell access to Róbert's machine, so these figures are CC's self-report and were not independently re-executed here. What *was* independently verified beyond code-reading this time: the actual manual browser→Sheet smoke test the approved prompt required (§"Verification and handoff") — which CC's own report explicitly flagged as *not yet run* (deviation #3) — has now been performed for real by Róbert, with a correct row landing in the Sheet. That closes the one concrete gap CC itself flagged as outstanding.

## Outstanding material issues

None blocking. One cosmetic inaccuracy for the record: `cc-report.md` §6 describes the Sheet schema as "30 columns: 9 top-level + 3×7 per-scenario." The actual schema (confirmed against both `docs/research/decision-quiz/README.md` and the live Sheet row) is 31 columns: 10 top-level (the report's own count omits `scenario_order`) + 21. The implementation and the README are correct and agree with each other and with reality — only that one summary sentence in the report undercounts by one. Worth a one-line fix in `cc-report.md` for accuracy, not worth another revision cycle.

## Verdict

**PASS.**

Ticket 395 is ready to move to `CLOSED` pending Róbert's own sign-off and the human-controlled commit/push/issue-close procedure documented in `docs/ai/README.md`. No code changes are requested from this review. Recommend fixing the §6 column-count sentence in `cc-report.md` whenever convenient, since that file is meant to be part of the permanent audit trail.

---

## Ripley final assessment — Revision required

Ripley independently inspected the implementation and reran the approved prompt's most relevant targeted suite.

### Independent evidence

- Source/diff inspection agrees with Jonesy's findings on the narrow `disableAnalytics` seam, unlisted route, route-scoped CSP and lack of application API/database changes.
- Jonesy/Róbert's live browser → deployed Apps Script → Google Sheet smoke test remains strong external evidence and is not restated as Ripley's own execution.
- Ripley's first test attempt inside the restricted sandbox did not start because esbuild could not read the repository path; this is an environment/tooling failure, not product evidence.
- Ripley reran the exact targeted suite outside that restriction. Result: **130 passed, 1 failed** across 10 files.

The failing test is:

`DecisionQuizResearch — missing/disabled configuration fails closed > shows the neutral unavailable state when config env vars are absent`

It expected `quiz-unavailable` but rendered `quiz-consent`. Inspection shows the machine has valid research quiz environment configuration and this test does not explicitly clear/stub `VITE_RESEARCH_QUIZ_ENABLED`, `VITE_RESEARCH_QUIZ_WEBAPP_URL`, or campaign configuration for its stated missing-config case. `getResearchQuizConfig()` reads those values at render time, so the test is dependent on the developer/CI environment and is not deterministic.

This does not presently demonstrate a production fail-closed defect: with valid enabled configuration, showing consent is correct. It does demonstrate that the required targeted suite is not green or isolated under a realistic configured environment, contrary to the approved prompt and CC report's 131/131 claim.

Jonesy's separate cosmetic finding is also accepted: `cc-report.md` undercounts the real schema. The correct count is **31 columns: 10 top-level + 3×7**, with `scenario_order` included at top level.

### Verdict

**REVISE.** Create and execute the narrow `approved-prompt-v2.md`: isolate the config test from host env values, correct the report's column count, rerun targeted/full tests, lint and build, and append Revision 2 evidence. No feature or production-code change is authorized unless audit proves an independent production bug.

---

## Jonesy review — Revision 2 (approved-prompt-v2.md, cc-report.md "Revision 2" section)

Reviewed against `approved-prompt-v2.md`'s narrow scope, independently of the report's own narrative.

### Verified directly against source

- **The actual fix.** Read `src/pages/DecisionQuizResearch.test.jsx` in full. The "missing/disabled configuration" `describe` block now has its own `beforeEach` stubbing `VITE_RESEARCH_QUIZ_ENABLED`/`VITE_RESEARCH_QUIZ_WEBAPP_URL`/`VITE_RESEARCH_QUIZ_CAMPAIGN` to `""`, and its own `afterEach` calling `vi.unstubAllEnvs()` — this is exactly the fix required, correctly scoped to that one `describe` block so it can't leak into or inherit from the sibling "enabled" block (which already had its own independent stub lifecycle, unchanged). Two new cases were added — explicitly-disabled-with-valid-URL, and enabled-with-invalid-URL-shape — and both are genuinely distinct assertions of `getResearchQuizConfig()`'s two independent failure conditions, not padding.
- **No production code was touched.** Re-read `src/config/researchQuiz.js` (unchanged, same file as originally reviewed) — the report's claim that the bug was test-only, not a real fail-closed defect, holds up: the function's logic was already correct, only the test's environment isolation was missing.
- **Scope discipline.** Directory-listed all of `src/` and checked every file's modification time against `approved-prompt-v2.md`'s creation. Only one file changed after that point: `src/pages/DecisionQuizResearch.test.jsx`. `HomeDecisionCard.jsx`, `AppRoutes.jsx`, `config/researchQuiz.js`, every `lib/researchQuiz/*` file, `vercel.json`, `core.js`, `adapter.js` — all unchanged. This matches the v2 prompt's scope boundary exactly: test-only, nothing else.
- **The report correction.** `cc-report.md` §6 now reads "31 columns: 10 top-level, including `scenario_order` itself, + 3×7 per-scenario" — correct, matches the README and the live Sheet. Prior report sections (§1–12) were left untouched; the "Revision 2" section was appended, not spliced in-place — consistent with this workflow's audit-trail conventions.

### Test and validation assessment

The Revision 2 section reports 9/9 for the fixed file (was 7, +2 new cases), 133/133 for the 10-file targeted set Ripley itself ran and found failing, 811/811 full suite (+2 over Revision 1's 809), lint exit 0, build success. As throughout this task, this session has no shell access to re-execute these, but the specific failure Ripley reported (`quiz-consent` instead of `quiz-unavailable`) is now structurally impossible given the stubbing added — that's verified by reading the test's actual mechanics, not by trusting the reported pass count alone. Notably, this report is unusually candid about a transient, unrelated Vitest internals crash on first run and explicitly says so rather than omitting it — consistent with this workflow's "do not claim an unrun/failed command passed" discipline.

### Verdict

**PASS.** The env-isolation defect Ripley found is genuinely fixed, verified by reading the fix itself rather than the narrative around it; scope stayed test-only as required; the report's one factual error is corrected. Ready to return to Ripley for final assessment (`Jonesy búinn að reviewa CC`).

---

## Ripley final assessment — Revision 2

Ripley read `approved-prompt-v2.md`, the appended CC Revision 2 report, Jonesy's Revision 2 review and the actual test change.

### Independent verification

The previously failing test was rerun in the same development environment containing valid local `VITE_RESEARCH_QUIZ_*` values:

```text
npx vitest run src/pages/DecisionQuizResearch.test.jsx
Test Files  1 passed (1)
Tests       9 passed (9)
```

Ripley then reran the exact targeted Ticket 395 command:

```text
npx vitest run src/lib/researchQuiz src/hooks/useResearchQuizFlow.test.js src/pages/DecisionQuizResearch.test.jsx src/components/HomeDecisionCard.test.jsx src/config/researchQuizCsp.test.js google-apps-script/decision-quiz/core.test.js src/AppRoutes.test.jsx
Test Files  10 passed (10)
Tests       133 passed (133)
```

The env-isolation defect is therefore fixed under the condition that originally exposed it. Inspection confirms the revision stayed test-only, production fail-closed logic was unchanged, and `cc-report.md` now correctly records 31 Sheet columns (10 top-level including `scenario_order`, plus 3×7 scenario columns).

CC reports 811/811 for the full suite, lint exit 0 and successful build; those broader commands remain attributed to CC's Revision 2 report rather than claimed as Ripley's independent execution. Róbert/Jonesy's live browser → Apps Script → Google Sheet smoke test remains separately recorded owner/reviewer evidence.

### Verdict

**PASS.** Ticket 395 satisfies approved prompts v1 and v2. No required work remains in the AI workflow. The task is ready for Róbert's human-controlled review, commit and push. GitHub issue closure remains a separate explicit owner action after push.
