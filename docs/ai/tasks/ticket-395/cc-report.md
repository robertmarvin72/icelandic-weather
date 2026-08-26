# CC Report — Ticket 395 (Research: reusable UX comprehension quiz for #377)

Executed against: `docs/ai/tasks/ticket-395/approved-prompt-v1.md` (v1, Jonesy: APPROVED).

## 1. Preflight

Read `CLAUDE.md`, `AGENTS.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, GitHub #395, and parent #377 before writing any code. `CURRENT.md` was confirmed at `ticket-395` / `READY_FOR_CC`, then set to `CC_IN_PROGRESS` per this ticket's own explicit preflight instruction (§"Required preflight" #2).

Inspected before implementation: `src/AppRoutes.jsx` + `src/AppRoutes.test.jsx`, `src/components/HomeDecisionCard.jsx` + `HomeDecisionCard.test.jsx`, `src/lib/analytics.js`, `src/components/AnalyticsTracker.jsx` (page-view tracking call site), `src/hooks/usePageRouteProps.js`, `src/hooks/useT.js` / `src/i18n/translations.js` (i18n merge pattern), `src/config/features.js` (config-switch style), `src/main.jsx` (confirmed `initAnalytics()` runs unconditionally at bootstrap, independent of route), `server_data/campsites.full.json`-style env patterns, and the repository for any existing CSP/security-header configuration.

## 2. Audited Google integration facts (critical STOP-relevant research)

**Question**: can a normal production browser's `fetch()` (default `'cors'` mode, never `'no-cors'`) actually *read* a genuine acknowledgment (status + JSON body) after POSTing to a Google Apps Script web app, given the mandatory 302 redirect to `script.googleusercontent.com`?

Researched via web search and a detailed third-party technical reference (`tanaikech/taking-advantage-of-Web-Apps-with-google-apps-script`, a widely-cited, rigorously-tested Apps Script CORS reference) rather than assumed. Key finding, quoted from that reference's own experiments:

- When `doGet`/`doPost` return `HtmlService.createHtmlOutput()`, **both GET and POST produce a genuine CORS error** ("No 'Access-Control-Allow-Origin' header is present") — the response is not readable.
- When `doGet`/`doPost` return `ContentService.createTextOutput()` instead, **both GET and POST return 200 with no CORS error** — the response *is* readable by a normal `fetch()`.
- Separately, sending a stringified (not raw-object) POST body, with `Content-Type: text/plain` if needed, avoids the OPTIONS-preflight problem entirely (Apps Script has no `doOptions`).

**Conclusion**: the approach specified in the approved prompt (§"Required preflight" #4, §"Browser submission") is technically viable **provided the adapter's `doPost`/`doGet` return `ContentService.createTextOutput(...)`, never `HtmlService`** — a fact now written directly into `google-apps-script/decision-quiz/adapter.js` as a `CRITICAL` code comment so it cannot be silently reintroduced. No STOP condition was triggered on this ground.

Apps Script always returns HTTP 200 at the transport level regardless of application outcome (it cannot set arbitrary HTTP status codes from `doPost`); application-level success/failure is therefore encoded entirely in the JSON body (`{ok: true, ...}` / `{ok: false, code, error}`), and the frontend branches on the **parsed body**, never on `response.status` alone. This is implemented in `src/lib/researchQuiz/submit.js`.

**Sources**:
- [tanaikech/taking-advantage-of-Web-Apps-with-google-apps-script — CORS in Web Apps](https://github.com/tanaikech/taking-advantage-of-Web-Apps-with-google-apps-script/blob/master/README.md)
- [Struggling with CORS in Google Apps Script? Here's the Fix (Medium)](https://diyavijay.medium.com/struggling-with-cors-in-google-apps-script-heres-the-fix-e3eec09f07dd)
- [Fixing CORS Errors in Google Apps Script (Lambda IITH)](https://iith.dev/blog/app-script-cors/)

## 3. CSP audit finding and decision

**Finding**: this repository has **no Content-Security-Policy header anywhere** — `vercel.json` had no `headers` block at all before this change, and no `<meta http-equiv="Content-Security-Policy">` exists in `index.html`. The approved prompt's CSP language ("Restrict `connect-src` to exact required origins... do not add... changes to unrelated directives") implicitly assumes an existing policy to narrowly extend; that assumption did not hold.

**Decision** (documented here per the prompt's own instruction to record such findings, not a STOP — a safe narrow path existed): added a `headers` rule in `vercel.json` scoped to **exactly** `/research/decision-quiz`, setting **only** `Content-Security-Policy: connect-src 'self' https://script.google.com https://script.googleusercontent.com`. Rationale:
- Per the CSP spec, a policy naming only `connect-src` restricts *only* outbound fetch/XHR/WebSocket on that one route — it does not touch script/style/image/font loading anywhere, on this page or any other.
- Scoping to one unlisted, low-traffic route bounds the blast radius of any origin-list mistake to that page alone.
- Deliberately **excluding** GA4 and Sentry origins from this route's `connect-src` is intentional, not an oversight: GA4 is explicitly not wanted on this route anyway (Analytics Isolation requirement) — this reinforces that at the network layer, not just in application code. Sentry error reporting will also be blocked on this one page as a result; this is an accepted, documented, low-impact trade-off (loss of error visibility on one unlisted research page), not a functional regression — the quiz's own submission path never depends on Sentry.
- A regression test (`src/config/researchQuizCsp.test.js`) asserts exactly one headers rule, scoped to this path, with exactly one directive (`connect-src`) and exactly three sources (`'self'` + the two audited Apps Script origins) — no wildcard, no unrelated origin.

## 4. Files changed

**Frontend:**
- `src/pages/DecisionQuizResearch.jsx` (new) — the unlisted route's page component.
- `src/hooks/useResearchQuizFlow.js` (new) — state machine (consent → quiz → ready → submitting → confirmed/failed/unconfirmed), fully dependency-injected (`fetchImpl`, `randomFn`, `nowFn`, `wallClockIso`, `getViewportCategory`) for deterministic testing.
- `src/lib/researchQuiz/scenarios.js` (new) — the 3 frozen participant scenarios + the diagnostic (non-participant) fixture.
- `src/lib/researchQuiz/permutation.js`, `session.js`, `timing.js`, `answerOptions.js`, `payload.js`, `submit.js`, `viewport.js` (new) — pure, independently-tested building blocks.
- `src/config/researchQuiz.js` (new) — fail-closed config/lifecycle switch, versions, note-length bound, submit timeout.
- `src/i18n/translations.researchQuiz.js` (new) + registered in `src/i18n/translations.js`.
- `src/components/HomeDecisionCard.jsx` (modified) — added the narrow `disableAnalytics` prop (default `false`); gated all 7 `trackEvent` call sites behind it. No other behavior changed.
- `src/AppRoutes.jsx` (modified) — registered `/research/decision-quiz`, not added to any nav/sitemap.
- `vercel.json` (modified) — added the scoped CSP header (§3).
- `vitest.config.js` (modified) — added `google-apps-script/**/*.test.js` to the test `include` list.
- `eslint.config.js` (modified) — added scoped overrides so the deployed Apps Script files' platform globals (`PropertiesService`, `SpreadsheetApp`, `LockService`, `ContentService`, `DecisionQuizCore`) and entry points (`doGet`/`doPost`) lint cleanly, and the Node-only test loader gets `node` globals.
- `.env.example` (modified) — documented the three new `VITE_RESEARCH_QUIZ_*` variables.

**Google Apps Script artifact (checked in, NOT deployed by CC):**
- `google-apps-script/decision-quiz/core.js` — runtime-neutral `DecisionQuizCore` (IIFE global, no Apps Script/Node/browser reference).
- `google-apps-script/decision-quiz/adapter.js` — thin `doPost`/`doGet`, owns only `PropertiesService`/`LockService`/`SpreadsheetApp`/`ContentService`.
- `google-apps-script/decision-quiz/appsscript.json` — manifest.
- `google-apps-script/decision-quiz/loadCore.js` (test-support only, never deployed) — `vm`-based loader that executes `core.js`'s literal source for Vitest.

**Docs:**
- `docs/research/decision-quiz/README.md` (new) — owner setup/deploy/disable/participant-link/CSV-export instructions, Sheet schema.

**Tests (new):** `core.test.js` (40), `permutation.test.js` (4), `session`/`timing`/`viewport` covered transitively via other tests (see §9 for the decision not to add trivial standalone files for these three one-liner-adjacent modules — flagged as a scope note in §11), `payload.test.js` (9), `submit.test.js` (7), `scenarios.test.jsx` (8), `useResearchQuizFlow.test.js` (13), `DecisionQuizResearch.test.jsx` (7), `researchQuizCsp.test.js` (3). **Tests (extended):** `HomeDecisionCard.test.jsx` (+3 for `disableAnalytics`).

## 5. Scenario matrix

| id (canonical tone) | rawVerdict | comparisonState.direction | Free/Pro | Notes |
|---|---|---|---|---|
| `stay` | `stay` | n/a (`no_candidate`) | Free | No candidate/CTA shown |
| `move` | `move` | `nearby_better` | Free | Locked CTA, hedge-free "move" wording |
| `consider` | `consider` | `nearby_better` | Free | Hedged locked CTA, never claims a better site was found |
| *(diagnostic, not a participant scenario)* | `move` | `similar` | Free | Canonical tone overridden to `stay` — proves scenario identity follows rendered tone, not raw verdict |

All three participant scenarios use Free tier deliberately (documented choice — the majority real-world homepage experience); `readiness` (`routePlannerSummary.ready: true`) and `rows: []` (no live weather) are frozen identically across all four fixtures.

## 6. Sheet schema and literal request/response contract

**Sheet headers** — see `docs/research/decision-quiz/README.md` for the full column list (31 columns: 10 top-level, including `scenario_order` itself, + 3×7 per-scenario, scenario columns ordered by that row's own `scenario_order`, not a fixed stay/move/consider order). Single source of truth: `DecisionQuizCore.SHEET_HEADERS`.

**Request** (`POST <web app URL>`, `Content-Type: text/plain;charset=utf-8`, no other headers):
```json
{
  "campaign": "optional-label-or-null",
  "test_version": "1",
  "fixture_version": "1",
  "session_id": "3b1e2c9a-....-....-....-............",
  "lang": "is",
  "viewport": "mobile",
  "client_started_at": "2026-08-24T10:00:00.000Z",
  "client_completed_at": "2026-08-24T10:05:00.000Z",
  "scenario_order": ["move", "stay", "consider"],
  "scenarios": [
    { "scenario_id": "move", "interpretation": "move", "reason": "weather_better_elsewhere", "action": "relocate_now", "first_action": "primary_cta", "interpretation_ms": 4230, "note": null }
  ]
}
```

**Response** (always HTTP 200 from Apps Script; application outcome is in the body):
```json
{ "ok": true, "receivedAt": "2026-08-24T12:00:03.000Z" }
{ "ok": false, "code": "invalid_version", "error": "invalid_version" }
{ "ok": false, "code": "busy", "error": "busy" }
{ "ok": false, "code": "internal_error", "error": "internal_error" }
```

## 7. Deployable core/adapter architecture

`google-apps-script/decision-quiz/core.js` exports one global, `DecisionQuizCore`, with **no reference to any Apps Script, Node, or browser global** — plain ES5-ish functions in an IIFE, no `import`/`export` (Apps Script does not support ES modules). It owns:

- schema/enum/type/length/permutation validation (`validatePayload`);
- formula-injection neutralization (`neutralizeFormula` — leading-apostrophe escape for values starting with `=`, `+`, `-`, `@`, after stripping leading whitespace);
- idempotency-key derivation (`deriveIdempotencyKey(testVersion, sessionId)` — pure string concat);
- Sheet row/header construction (`buildRow`, `SHEET_HEADERS`);
- stable sanitized success/error construction (`successResponse`, `errorResponse` — never includes Sheet IDs, row data, or stack traces);
- **the full orchestration** (`processSubmission(rawBody, boundaries)`): parse → validate → acquire lock → duplicate-check+append (inside the SAME lock) → respond, with every Google-global side effect received as an **injected boundary** (`boundaries.lock`, `boundaries.sheet`, `boundaries.now`).

`google-apps-script/decision-quiz/adapter.js` is the only file that references `PropertiesService`/`SpreadsheetApp`/`LockService`/`ContentService`. Its `doPost(e)` reads Script Properties, builds the real boundary implementations, and calls `DecisionQuizCore.processSubmission` — it contains no validation/business logic of its own. **This is the same literal file uploaded to Apps Script and loaded by Vitest** (`loadCore.js` executes `core.js`'s raw source text via Node's `vm` module) — there is no separate, drifting Node-only validator.

**Idempotency & locking**: `LockService.getScriptLock().tryLock(3000ms)` (named, bounded — `DEFAULT_LOCK_WAIT_MS`); if not acquired, returns a stable `{ok:false, code:"busy"}` (client-retryable). Inside the lock, duplicate-check (`(test_version, session_id)` scan of columns B/C) and append happen together, so two "simultaneous" submissions can never race past each other. A duplicate (idempotent retry) returns `ok:true` with the *original* row's receipt time — never a second append, and never surfaced to the client as an error.

## 8. Config, access, lifecycle, and limitations

- **Lifecycle switch**: `VITE_RESEARCH_QUIZ_ENABLED` + `VITE_RESEARCH_QUIZ_WEBAPP_URL` (regex-validated shape). Missing/invalid/disabled → the route renders a neutral "not available" message and the flow hook is never even reached with a usable URL — fails closed (`src/config/researchQuiz.js`, tested in `DecisionQuizResearch.test.jsx`).
- **Access**: unlisted route only, not authentication — documented as such in the README. No admin/Google credentials or Spreadsheet ID ever reach the frontend; only the deployed web-app URL and an optional, non-secret campaign label do.
- **Quota/abuse**: bounded payload size (20,000-char raw-body ceiling before `JSON.parse`), strict schema/enum/length validation, and Apps Script's own inherent per-account execution/quota ceilings are the abuse control — no IP-based or bot-detection throttling was added (would require collecting IP, which is explicitly disallowed). Documented as a proportionate, low-volume-appropriate trade-off in the README.
- **Privacy**: no name/email/account ID/cookie/IP/user-agent/exact viewport/precise location is ever read or sent — confirmed by the payload/Sheet-schema audit in §6 and the field-level docs in `src/lib/researchQuiz/payload.js`/`session.js`/`viewport.js`.

## 9. Analytics-isolation proof

`HomeDecisionCard.jsx`'s `disableAnalytics` prop (default `false`, so every existing production call site is unaffected — verified by the pre-existing `HomeDecisionCard.test.jsx` suite still passing unmodified plus a new explicit "defaults to enabled" test) gates all 7 `trackEvent` call sites. `DecisionQuizResearch.test.jsx`'s "emits zero production analytics calls" test renders the full consent → 3-scenario → submit → confirmed flow with `trackEvent`/`trackPageView` mocked and asserts **zero** calls to either across the entire interaction. No global GA config is mutated, no monkey-patching of `trackEvent` occurs, and no ad-hoc global flag was introduced — the seam is a plain, explicit React prop.

## 10. Tests, lint, and build actually run

- **Targeted quiz/component/analytics/core tests** (10 files most directly touched by this ticket) — `npx vitest run src/lib/researchQuiz src/hooks/useResearchQuizFlow.test.js src/pages/DecisionQuizResearch.test.jsx src/components/HomeDecisionCard.test.jsx src/config/researchQuizCsp.test.js google-apps-script/decision-quiz/core.test.js src/AppRoutes.test.jsx` → **131/131 passed**.
- **Full test suite** — `npx vitest run` → **809/809 passed**, 72 files (up from 717/64 files before this ticket — net +92 tests, +8 files; no pre-existing test was modified in a way that changed its assertions except the 3 additive `HomeDecisionCard.test.jsx` cases). Pre-existing, unrelated `Not implemented: navigation to another Document` jsdom console warnings appeared, as in every prior run this session — not failures.
- **Lint** — `npm run lint` → exit 0, no output, after adding scoped ESLint overrides for the Apps Script platform globals/entry points and the Node-only test loader (§4).
- **Build** — `npm run build` → succeeded. Same pre-existing "chunks larger than 500 kB" notice as every prior run, unrelated to this change.

No command was skipped or reported as passing without actually running.

## 11. Deviations, scope notes, and residual risks

1. **`session.js`, `timing.js`, `viewport.js` have no dedicated standalone test files.** Each is a small (5–15 line), single-purpose pure helper; their behavior is exercised indirectly and repeatedly through `useResearchQuizFlow.test.js` (timing boundary, session-id stability) and `DecisionQuizResearch.test.jsx` (viewport category is asserted only implicitly via successful payload construction). This is a genuine, honest scope trade-off given this ticket's very large surface area — flagging it explicitly rather than silently omitting it. If closer, isolated coverage of these three files is wanted, it is cheap to add as a follow-up.
2. **Formula neutralization is applied to `campaign`, `scenario_order`, and `note` only** (the three genuinely free-form/participant-influenced string fields that reach the Sheet) — `session_id`/`lang`/`viewport`/timestamps/enum fields are not neutralized because they are already constrained to a fixed enum or a validated format before `buildRow` ever runs, so they cannot carry a formula-injection payload; neutralizing them anyway would be dead code.
3. **No live Google Sheet/Apps Script deployment exists in this environment.** Per the approved prompt's own instruction ("Perform manual browser→test-Sheet smoke only if Róbert supplies/configures a non-production Sheet/web-app deployment; otherwise document it as an explicit owner setup/verification step and do not claim it passed") — **the manual browser→Sheet smoke test has NOT been run and is NOT claimed to have passed.** It is documented as an explicit required owner step in `docs/research/decision-quiz/README.md` and must be completed by Róbert before sharing the participant link with real users.
4. **CSP scoping decision** (§3) is a documented judgment call, not literally dictated by the prompt (which assumed an existing baseline policy) — flagging for result review in case a different scoping (e.g. including Sentry) is preferred.
5. **Remaining risk**: if Google ever changes Apps Script's CORS/redirect behavior for `ContentService` responses, the frontend's "unconfirmed" (not fabricated-success) fallback is the safety net — verified this is reachable and never shown as "confirmed" (`submit.test.js`, `DecisionQuizResearch.test.jsx`'s "never shows confirmed on an opaque/failed acknowledgment").
6. **No UI/paywall/scoring/entitlement/Model v1.0 change was made.** `src/lib/scoring.js`, `src/lib/auroraScoring.js`, checkout/entitlement code, and normal homepage navigation are untouched — confirmed by the full suite remaining green with zero pre-existing test files' assertions changed (only additive tests).

## 12. Confirmation

No Neon/database/migration, no new application API/backend, no npm dependency, no Google service-account credential, and no admin-grade secret was added or exposed to the frontend. **Not committed. Not pushed.**

---

## Revision 2 (approved-prompt-v2.md)

### Reason

Jonesy's result review found the live smoke test (performed for real by Róbert against a deployed Apps Script + Sheet) closed the one gap this report originally flagged as outstanding — but Ripley's independent rerun of the targeted suite, in an environment where `.env.local` now legitimately holds real `VITE_RESEARCH_QUIZ_ENABLED`/`VITE_RESEARCH_QUIZ_WEBAPP_URL` values (from that same real deployment), found `src/pages/DecisionQuizResearch.test.jsx`'s "missing/disabled configuration" test false-failing: it asserted `quiz-unavailable` but got `quiz-consent`, because the test never stubbed those env vars to an absent/invalid state and instead silently relied on the host machine having none set. Jonesy also found this report's §6 undercounted the Sheet schema by one column (30/9 instead of the correct 31/10, omitting `scenario_order` from the top-level count).

### Audit of `getResearchQuizConfig()` (per v2 prompt: fix production code only if the audit reveals a real bug)

Re-read `src/config/researchQuiz.js`. The function is correctly fail-closed: `enabled` requires an exact `"true"`/`"1"` match, `hasValidUrl` requires the exact Apps Script exec-URL shape, and the function returns `{ enabled: false, ... }` whenever either check fails. **No production defect was found** — the bug was entirely in the test's lack of env isolation, confirmed by reproducing it: this session's own `.env.local` now contains a real `VITE_RESEARCH_QUIZ_ENABLED=true` and a valid webapp URL (from Róbert's smoke-test deployment), and running the unfixed test against that real ambient environment reproduced Ripley's exact failure before the fix below was applied.

### Change made (test-only, as authorized)

`src/pages/DecisionQuizResearch.test.jsx` — the "missing/disabled configuration fails closed" describe block now:
- explicitly stubs `VITE_RESEARCH_QUIZ_ENABLED`, `VITE_RESEARCH_QUIZ_WEBAPP_URL`, and `VITE_RESEARCH_QUIZ_CAMPAIGN` to empty-string values in its own `beforeEach`, and calls `vi.unstubAllEnvs()` in its own `afterEach` — so it can never inherit real values from `.env.local`/`.env.development.local`/CI secrets/shell env, and can never leak stubs into the sibling "enabled" describe block (which already had, and keeps, its own independent stub/unstub lifecycle);
- adds two further deterministic cases proving the fail-closed switch's other branches: explicitly disabled despite an otherwise-valid URL, and enabled with an invalid URL shape — both distinct, non-redundant proofs of `getResearchQuizConfig()`'s two independent conditions, not the same case restated.

No other file was changed. No quiz behavior, UI/copy, scenario, payload/Sheet schema, Apps Script core/adapter, submission/CORS contract, CSP, analytics isolation, `HomeDecisionCard`, routing, dependency, or config name was touched.

### Verification — exact commands and results

1. `npx vitest run src/pages/DecisionQuizResearch.test.jsx` (run against this session's real `.env.local`, which contains the same kind of valid research-quiz values that caused Ripley's failure) → **9/9 passed** (was 7; +2 for the new disabled/invalid-URL cases). A transient, unrelated Vitest crash on the very first invocation (`TypeError: Cannot read properties of undefined (reading 'config')`, thrown from Vitest's own internals before any test ran) was resolved by re-running the identical command, which then passed cleanly — recorded here rather than silently discarded, per this workflow's "do not claim an unrun/failed command passed" discipline; it was not a test failure and did not recur.
2. The exact 10-file targeted command Ripley independently ran — `npx vitest run src/lib/researchQuiz src/hooks/useResearchQuizFlow.test.js src/pages/DecisionQuizResearch.test.jsx src/components/HomeDecisionCard.test.jsx src/config/researchQuizCsp.test.js google-apps-script/decision-quiz/core.test.js src/AppRoutes.test.jsx` → **133/133 passed** across 10 files (was 130 passed/1 failed per Ripley's run; 131/131 per this report's original Revision 1 figure obtained in a clean environment without the real env vars present).
3. Full suite — `npx vitest run` → **811/811 passed**, 72 files (up from 809/72 in Revision 1 — +2 tests, same file count).
4. `npm run lint` → exit 0, no output.
5. `npm run build` → succeeded, same pre-existing unrelated chunk-size notice as every prior run.

The manual browser→deployed Apps Script→live Google Sheet smoke test is **not re-claimed as CC's own execution** here — that was performed for real by Róbert and independently verified by Jonesy/Ripley, as recorded in `result-review.md`.

### Handoff

`docs/ai/CURRENT.md` CC report path set to this file; stage set to `CC_COMPLETE`. **Not committed. Not pushed.**
