# Ticket 395 — Ripley prompt draft v1

## Workflow target

Implement GitHub issue #395, **Research: Endurnýtanlegt óstýrt UX-prófunarquiz fyrir #377**, as a small reusable in-project research tool whose first version validates the canonical `stay` / `move` / `consider` decision surface.

This document is a draft for Jonesy review. It is not approved for Claude Code execution until an `approved-prompt-vN.md` snapshot exists and `CURRENT.md` reaches `READY_FOR_CC`.

## Required preflight and architecture audit

1. Read `CLAUDE.md`, `AGENTS.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, GitHub issue #395 and parent validation issue #377 before changing code.
2. Verify that `CURRENT.md` names `ticket-395` and is at `READY_FOR_CC`; then perform the required transition to `CC_IN_PROGRESS`.
3. Inspect at least:
   - `src/AppRoutes.jsx` and its route/security tests;
   - `src/components/HomeDecisionCard.jsx` and `HomeDecisionCard.test.jsx`;
   - `src/lib/analytics.js` and page-view tracking behavior;
   - `src/hooks/usePageRouteProps.js` and the actual i18n mechanism;
   - request validation/error patterns in focused public API handlers;
   - admin authentication/export patterns in `api/admin.js`, `api/_lib/admin.js`, and `api/_lib/getMe.js`;
   - request-path PostgreSQL patterns such as `api/checkout.js`;
   - the repository's existing SQL/migration artifact conventions.
4. Report the audited design in `cc-report.md`: exact routes, access boundary, component injection point, scenario fixture boundary, data model, submission validation, abuse controls, export authorization, analytics isolation, and lifecycle switch.

### Explicit scope decision

`AGENTS.md` contains a generic project rule saying “Keep everything client-side, no backend, no new libraries,” while #395 explicitly requires anonymous cross-device collection and protected export through the existing backend/database. For this ticket only, the owner-approved #395 contract authorizes the smallest focused backend/schema addition necessary for research submission and export. It does **not** authorize a new service, dependency, general backend framework, participant account system, or unrelated API refactor.

If the existing Neon/Vercel/admin architecture cannot support that narrow addition safely, stop and report the concrete conflict instead of falling back to GA4, browser-only storage, or an unprotected export.

## Outcome

Deliver one unlisted, access-controlled research quiz inside the existing application. A participant opens one link, gives lightweight consent, completes deterministic `stay`, `move`, and `consider` scenarios in randomized order, submits anonymous structured responses, and sees a completion state. An authorized admin can export the research dataset as CSV or JSON for the analysis in #377.

The implementation must be reusable through versioned test/scenario configuration, but v1 must remain deliberately small: no dashboard, participant management, generic survey builder, or new dependency.

## Participant route and access boundary

- Register a dedicated route through `AppRoutes.jsx`; use an unambiguous research path such as `/research/decision-quiz` unless the audit identifies an existing convention that is safer.
- Do not add the route to navigation, sitemap, marketing links, or the normal product journey.
- An unlinked route alone is not access control. Use a documented campaign/test access mechanism that works for a shareable participant link and is validated server-side before accepting submissions. Do not expose an admin credential or reusable application secret in the frontend bundle.
- Add a lifecycle switch so this individual test can be disabled without removing the reusable research code. Disabled/invalid access must fail closed with a neutral unavailable state and must not reveal research data.
- Preserve normal routing and link-security behavior. The page must work on desktop and at 390–430 px mobile widths.

## Quiz protocol

The single flow must contain:

1. a concise purpose/privacy introduction and explicit continue/consent action;
2. all three scenarios exactly once, in a randomized order generated once per session and retained across rerenders/retries;
3. the real rendered decision surface for each frozen scenario;
4. structured questions after each scenario:
   - interpreted recommendation: `stay`, `move`, `consider`, or `unsure`;
   - selected main reason from scenario-appropriate fixed choices plus `unsure`;
   - intended next action from fixed choices;
   - optional bounded confusion note;
5. a captured interpretation time using a monotonic browser timer, with the start/end boundary defined and tested;
6. captured first interaction where the rendered decision surface offers a meaningful action, with the action intercepted inside the harness so it cannot enter checkout or another live product flow;
7. review/submit behavior that prevents accidental duplicate records and supports a clear retry after a transient submit failure;
8. a final success state only after the server acknowledges durable submission.

Do not turn the test into a memory test accidentally. The audited implementation must document whether the decision surface remains visible while the participant answers and how the “within 10 seconds” metric is derived. Prefer direct comprehension timing over hiding the stimulus after an arbitrary timeout.

## Frozen scenario architecture

- Render the actual `HomeDecisionCard` with actual i18n and responsive styles. Do not use screenshots, duplicated markup, hardcoded translated component copy, or a fake card.
- Extract or recreate only the smallest runtime-safe semantic fixture boundary needed from `HomeDecisionCard.test.jsx`; never import a test file, Vitest, or Testing Library into runtime code.
- Version the test and fixture set explicitly (for example `decision_quiz_v1`).
- Each scenario definition must deterministically fix raw verdict, `comparisonState.direction`, final canonical tone, readiness, candidate/locked state, Free/Pro state, visible reasons, and CTA behavior.
- Scenario identity and scoring correctness are based on final canonical rendered tone, never raw verdict.
- Include targeted fixture/component tests proving pure `stay`, pure `move`, `consider`, and the diagnostic raw `move` + canonical `stay` override remains representable without changing production recommendation semantics.
- Do not fetch live forecast/campsite data or invoke async scoring in the research route.

## Analytics isolation

Rendering or interacting with `HomeDecisionCard` in the research route must not send production GA4 page views or product events, including raw recommendation events, `canonical_recommendation_viewed`, comparison/locked exposure events, or CTA events.

Implement the smallest explicit, testable isolation boundary that preserves current production defaults. If an optional component prop/context is used, production must remain enabled by default and all existing call sites must retain current behavior. Do not monkey-patch global analytics, mutate the GA measurement ID, add global flags, or weaken normal event tests.

Research responses go only to the research submission API/database. They are not analytics events.

## Data model and migration

Use the existing PostgreSQL stack and raw tagged-template SQL conventions. Add a checked-in, rerunnable SQL migration artifact; do not execute production DDL automatically from a request handler.

Prefer a normalized session/response model unless the audit demonstrates that one bounded JSONB submission row better preserves validation, export, privacy, and versioning with less risk. Whichever model is selected must enforce durable invariants with database constraints where appropriate.

Persist at minimum:

- random client session UUID and server receipt timestamp;
- `test_version` and fixture/build version;
- started/completed timestamps with explicit trust semantics (client-measured fields are not server authority);
- language and coarse viewport category only;
- randomized scenario order;
- for every required scenario: interpreted recommendation, selected reason, intended action, captured first action where applicable, bounded interpretation duration, and optional bounded confusion note.

Do not persist name, email, account/user ID, cookie/session identity, precise location, user agent, exact viewport dimensions, or an IP address as research data. Do not join research rows to product users.

## Public submission contract

Create a focused public Vercel handler following current JavaScript patterns. Define and test the literal request/response contract.

The server must:

- accept only the active known `test_version` and exactly the expected scenarios once each;
- validate UUID, campaign access, scenario permutation, enums, timestamps/durations, string types and strict maximum lengths;
- reject unknown/extra scenario fields where ambiguity would undermine analysis;
- impose a small request-body limit before persistence;
- derive server receipt time itself;
- use a database uniqueness/idempotency boundary so retrying the same completed session cannot create duplicate results;
- return stable sanitized 2xx/4xx/5xx responses without stack traces or database details;
- provide proportionate abuse protection using existing platform/repository capabilities, and document residual limits. Do not retain PII merely to implement rate limiting.

Do not accept participant-supplied “correct/incorrect” grading. Analysis derives correctness from the versioned scenario key and canonical expected tone.

## Protected export

- Reuse the existing admin-session/email authorization boundary; do not invent a second admin identity system.
- Export only research fields in scope, never product-user data or internal secrets.
- Filter/export by explicit `test_version`; use stable documented column names and ordering.
- Support CSV or JSON at minimum; supporting both is desirable only if it remains small. CSV cells derived from participant text must be escaped safely against delimiter/newline breakage and spreadsheet formula injection.
- Unauthorized and unauthenticated requests must fail closed and must not leak record counts or sample data.
- Do not build an admin dashboard in v1. Document the authorized export request/URL.

## Privacy, consent, and copy

- Add all participant-facing IS and EN text through the existing i18n system.
- State concisely what is collected, that the test is anonymous, why it is collected, and that the participant should not enter personal information in the optional note.
- Provide a clear refusal/exit path before submission.
- Do not claim stronger anonymity or deletion guarantees than the implementation actually provides.
- Keep optional text bounded and non-required. Fixed choices are preferred for analyzable core answers.

## Tests required

Add focused deterministic coverage for at least:

1. Route registration, invalid/disabled access, consent gate, complete participant flow, mobile-safe render, and final success only after acknowledged persistence.
2. Each frozen scenario rendering the expected canonical tone through the real `HomeDecisionCard` without live data/scoring.
3. Random order is a true three-item permutation, generated once and stable across rerenders; tests must not be flaky or assert one random order.
4. Timer boundaries and bounded recorded duration using a fake clock/monotonic timing seam.
5. Required questions, fixed-choice values, optional-note length, and inability to submit incomplete/duplicate scenarios.
6. Intercepted first action cannot navigate to checkout/live product flows.
7. No GA4 page view or product event is emitted by research render, rerender, scenario transition, or interaction; normal `HomeDecisionCard` analytics defaults remain unchanged outside the harness.
8. Valid submission, invalid token/access, malformed JSON/body, wrong version, invalid UUID, missing/duplicate/unknown scenario, invalid permutation/enums/durations, extra unsafe data, oversize payload/text, and sanitized DB failure.
9. Idempotent retry produces one durable session/result set, not duplicates.
10. Export rejects non-admin callers and returns stable version-filtered, safely escaped anonymous output for an authorized admin.
11. Migration/schema constraints match the handler's tested assumptions.

Keep API tests isolated from the real database/network and avoid adding a test dependency.

## Acceptance criteria

- One participant link runs the complete anonymous quiz.
- `stay`, `move`, and `consider` are deterministic, randomized in presentation order, and rendered through the real canonical component.
- The recorded data is sufficient to compute per-state interpretation accuracy, within-10-second comprehension, reason understanding, intended next action, first action where applicable, and `consider` misinterpretation rate.
- Every result is versioned and reproducible from stored test/fixture/build metadata.
- No PII is requested or stored; research data is not joined to user data.
- Research traffic sends no production GA4 page views or product events.
- Submission is strictly validated, bounded, idempotent, sanitized, and proportionately abuse-protected.
- Export is admin-protected, version-filtered, anonymous, stable, and spreadsheet-safe when CSV is used.
- The route is unlisted, access-controlled, independently disableable, responsive, and does not alter the production homepage or normal product journey.
- Existing homepage recommendation, scoring, Free/Pro, analytics, checkout, admin, and routing behavior remains unchanged.
- The SQL migration artifact, operating instructions, participant link pattern, lifecycle switch, and export instructions are documented.

## Scope boundaries

Do not add or change:

- `HomeDecisionCard` UX/copy or canonical tone semantics;
- scoring, live forecast acquisition, campsite selection, `comparisonState`, Free/Pro, checkout, or entitlement behavior;
- GA4 taxonomy or product analytics semantics;
- participant accounts, recruitment tooling, email collection, research dashboard, generic form builder, or automated statistical conclusions;
- a new external service, library, ORM, framework, or broad admin/API refactor;
- analysis/recruitment work or the final conclusion for #377;
- unrelated cleanup.

Do not commit or push.

## STOP conditions

Stop and report before implementation or further scope expansion if:

- safe anonymous persistence/export cannot be achieved inside the existing Neon/Vercel/admin architecture;
- a new service/dependency, general rate-limiting platform, participant identity system, or broad schema/admin refactor is required;
- analytics isolation requires changing normal production event semantics rather than adding a narrow explicit boundary with unchanged defaults;
- deterministic scenarios cannot use the real component without changing canonical decision/scoring behavior;
- the shareable access model would expose an admin secret, accept unrestricted anonymous spam with no proportionate control, or make export public;
- production schema reality is unknown in a way that prevents writing a safe rerunnable migration artifact;
- work would reach into #377 result analysis or UX redesign.

## Verification and handoff

Run targeted frontend/component/API/export tests, relevant existing `HomeDecisionCard`, analytics, route, admin-auth tests, then the full test suite, lint, and production build. Perform a manual end-to-end smoke test at desktop and mobile width with mocked/local persistence where production DB access is unavailable; do not claim a live production migration or deployment unless actually performed.

Write `docs/ai/tasks/ticket-395/cc-report.md` with:

- audited architecture and the explicit resolution of the client-only/backend rule;
- files and migration artifacts changed;
- participant route/link/access/lifecycle contract;
- literal submission and export request/response examples;
- scenario fixture matrix and test/build version;
- persisted fields, constraints, retention/privacy limitations, validation limits, idempotency and abuse controls;
- exact analytics-isolation mechanism and proof that production defaults remain unchanged;
- tests/commands run with exact outcomes and the manual smoke-test record;
- migration/application, disablement, participant use, and admin export instructions;
- deviations, residual risks, and follow-ups.

Populate the CC report path in `CURRENT.md` and set the stage to `CC_COMPLETE`. Writing the report without that transition is an incomplete handoff. Do not commit or push.

---

## Owner scope correction before Jonesy review

Róbert clarified that #395 must **not** persist research data in Neon or add an application backend/database migration. The desired collection path is automatic browser submission to an owner-controlled Google Sheet through a narrowly scoped Google Apps Script web app, with CSV export provided by Google Sheets. Draft v1 above is preserved as workflow history but is superseded in full by draft v2 below and must not be approved or executed.

---

# Ticket 395 — Ripley prompt draft v2

## Workflow target

Implement GitHub issue #395 as a small reusable in-project UX quiz whose first test validates whether users understand canonical `stay`, `move`, and `consider`. Quiz results must be submitted automatically to an owner-controlled Google Sheet through Google Apps Script. Do not add Neon persistence, migrations, or a new application API/backend.

This v2 draft is the only active draft for Jonesy review. It is not executable until Jonesy approves it, an immutable `approved-prompt-vN.md` is created, and `CURRENT.md` reaches `READY_FOR_CC`.

## Required preflight and integration audit

1. Read `CLAUDE.md`, `AGENTS.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, GitHub #395 and parent #377.
2. At execution time verify `CURRENT.md` names `ticket-395` at `READY_FOR_CC`, then set it to `CC_IN_PROGRESS` before changing implementation.
3. Inspect `src/AppRoutes.jsx` and routing tests, `src/components/HomeDecisionCard.jsx` and tests, `src/lib/analytics.js`, page-view tracking, `usePageRouteProps`, translations, environment/config patterns, and current CSP/security/deployment configuration.
4. Before building the submission flow, verify the real browser-to-Google Apps Script web-app contract: method, redirect behavior, CORS behavior, readable response/acknowledgment, content type, deployment access setting, and whether a participant without Google login can submit. Do not assume that a `fetch(..., { mode: "no-cors" })` opaque response proves persistence.
5. Record the chosen route, lifecycle/access boundary, fixture boundary, analytics isolation, Sheet schema, Apps Script validation/idempotency model, configuration and verified response contract in `cc-report.md`.

If direct browser submission cannot give an honest success/unconfirmed result without a new app backend, stop and report the exact limitation and smallest safe alternatives. Do not silently add a Vercel proxy, database, Google credential, Google login, or false “saved” confirmation.

## Outcome

One unlisted research route provides a complete anonymous quiz. The participant gives lightweight consent, sees deterministic `stay`, `move`, and `consider` scenarios in randomized order, answers structured questions, presses one submit button, and—when the audited integration can verify it—receives confirmation that the result was appended to the private owner-controlled Google Sheet. The participant must not download/send a file or sign into Google.

Keep v1 reusable through a versioned test/scenario configuration, but do not build a dashboard, participant system, generic survey builder, or new dependency.

## Participant route, access and lifecycle

- Register one dedicated route in `AppRoutes.jsx`, using `/research/decision-quiz` unless the audit identifies a safer existing convention.
- Do not add it to navigation, sitemap, marketing surfaces, or the normal product journey.
- Add a documented test-enabled lifecycle/config switch so this quiz can be disabled independently. Invalid/disabled configuration must fail closed with neutral UI and must not submit.
- Treat an unlisted URL as discoverability reduction, not authentication. Do not place admin credentials, Spreadsheet ID, Google credentials, or Apps Script owner secrets in the frontend.
- If a share token is used, be explicit that it is a campaign access token, not a secret once distributed. It must not grant Sheet read/export/admin access.
- Preserve normal route/link behavior and support desktop plus 390–430 px mobile widths.

## Quiz protocol

The single participant flow must include:

1. concise purpose/privacy copy and an explicit consent/continue action;
2. each of `stay`, `move`, and `consider` exactly once;
3. a Fisher–Yates-equivalent unbiased random permutation generated once per session and stable across rerenders/retries;
4. the real decision surface for each frozen scenario;
5. after each scenario:
   - interpreted recommendation: `stay`, `move`, `consider`, `unsure`;
   - one main reason from versioned fixed choices plus `unsure`;
   - intended next action from versioned fixed choices;
   - an optional bounded confusion note;
6. interpretation timing from a precisely documented monotonic start/end boundary;
7. first interaction capture where meaningful, with CTA behavior intercepted so no participant enters checkout or another live flow;
8. incomplete-answer prevention, submit-in-progress protection, clear failure/unconfirmed retry, and duplicate-click safety;
9. a final saved state only when supported by the audited Apps Script acknowledgment contract.

Do not accidentally convert comprehension testing into memory testing. Keep the stimulus visible while answering unless #377 explicitly requires otherwise, and derive the within-10-second metric from the captured interpretation action/time boundary rather than hiding the card after ten seconds.

## Frozen scenario architecture

- Render the actual `HomeDecisionCard` with actual i18n and responsive styling; no screenshot, duplicated fake card, or hardcoded component copy.
- Never import `HomeDecisionCard.test.jsx`, Vitest, or Testing Library into runtime. Extract only the smallest runtime-safe versioned fixture/config boundary justified by the audit.
- Freeze raw verdict, `comparisonState.direction`, final canonical tone, readiness, candidate/locked state, Free/Pro state, visible reasons and CTA behavior for every scenario.
- Scenario identity and answer key follow final canonical rendered tone, never raw verdict.
- Include the raw `move` + comparison `similar` → canonical `stay` diagnostic fixture in tests to protect the semantic boundary, even if it is not a fourth participant scenario.
- Do not fetch live weather/campsites or run async scoring from the research route.

## Analytics isolation

Research route rendering and interaction must emit no production GA4 page view or product events, including raw/canonical recommendation, comparison, locked and CTA events.

Create the smallest explicit testable isolation seam while keeping normal production defaults unchanged. A narrowly scoped optional `HomeDecisionCard` prop/context is acceptable if it defaults to analytics enabled and every existing production call site preserves current behavior. Do not mutate global GA configuration, monkey-patch analytics, use ad-hoc global flags, or weaken existing analytics tests.

Quiz answers go only to Apps Script/Google Sheets, never GA4.

## Result payload and Sheet schema

Use one versioned, bounded payload per completed quiz and one normalized Sheet row per accepted payload unless the audited Google/Sheet constraints clearly justify another stable layout.

Include only:

- random session UUID;
- `test_version` and fixture/build version;
- client start/completion timestamps plus a clear note that server receipt time is authoritative for receipt only;
- language and coarse `mobile`/`desktop` viewport category;
- scenario order;
- per scenario: interpretation, selected reason, intended action, captured first action where applicable, bounded interpretation milliseconds, and optional bounded confusion note.

Do not include name, email, Google identity, app user/account/session ID, cookie, IP address, user-agent, exact viewport, precise location, or free-form demographic data. Do not let the client submit a trusted `correct`/`incorrect` value; correctness is derived later from versioned scenario identity.

Define stable Sheet headers/order in a checked-in schema/example file. Ensure CSV export from Sheets remains directly analyzable.

## Google Apps Script artifact

Check in a small versioned Apps Script source/template plus owner setup documentation. The owner will create/control the private Sheet and deploy/configure the script; do not attempt to create Google resources or deploy on the owner's behalf during CC execution.

The script must:

- use owner-side properties/config for Spreadsheet ID, target tab, active test version and any write/access token; none belongs in the public app bundle except the deployed web-app URL and any explicitly shareable campaign value;
- accept only the known active version and exactly three known scenario records once each;
- validate UUID, scenario permutation, enums, numeric bounds, timestamp/string types, allowed keys and strict note/body lengths;
- reject unknown/extra fields that would undermine analysis;
- generate server receipt time itself;
- neutralize spreadsheet formula injection for every participant-controlled string before `appendRow`/range write;
- implement idempotency on `(test_version, session_id)` so retry/double click cannot create a duplicate row;
- serialize the duplicate-check/write critical section using Apps Script locking or an equivalent documented atomic pattern;
- return a minimal sanitized status contract without Sheet IDs, row contents, stack traces or owner details;
- include proportionate abuse controls possible within Apps Script and document residual limitations without collecting PII.

Do not publish read/export endpoints from Apps Script. The Sheet remains private and CSV export happens through the owner's authenticated Google Sheets UI.

## Browser submission

- Read the Apps Script web-app URL and enabled/version settings from existing project-appropriate environment configuration; fail closed when absent.
- Keep the request payload/content type compatible with the verified Apps Script/CORS contract. Do not weaken validation merely to avoid preflight.
- Use a timeout and a clear state machine: idle → submitting → confirmed, failed, or unconfirmed if the platform contract genuinely cannot expose acknowledgment.
- Keep the same session UUID/payload across a retry; Apps Script idempotency handles a repeated accepted submission.
- Never label an opaque `no-cors` completion as confirmed. If only opaque delivery is feasible, trigger the STOP condition instead of shipping misleading UX.

## Privacy and copy

- Put all participant-facing IS/EN text in the existing i18n system.
- State what is collected, the purpose, that no identifying fields are requested, that results go to an owner-controlled Google Sheet, and that personal information must not be entered in the optional note.
- Provide a refusal/exit path before submission.
- Do not promise anonymity, deletion, security or retention guarantees stronger than the setup actually provides.
- Document Sheet access/retention responsibility for the owner.

## Tests required

Add targeted deterministic coverage for at least:

1. Route registration, disabled/missing config, consent gate, full flow, responsive shell and confirmation only after the tested acknowledgment state.
2. Real `HomeDecisionCard` renders each frozen canonical state without live inputs/scoring.
3. Scenario order is a true permutation, created once and stable across rerender/retry without flaky fixed-order tests.
4. Timer boundaries and bounded duration using fake timers/a monotonic seam.
5. Required answers, allowed values, optional-note limit, incomplete-submit prevention and stable retry payload/session ID.
6. First action is captured and intercepted without checkout/live navigation.
7. Zero product page-view/event calls across research render, transition, rerender and interaction, plus unchanged normal analytics defaults outside research.
8. Client request serialization and confirmed/failed/timeout behavior against mocked exact Apps Script responses; opaque/no-CORS delivery is never considered confirmed.
9. Apps Script-side validation tests or a checked-in deterministic test harness covering valid payload, bad token/version/UUID/permutation, missing/duplicate/unknown scenario, invalid enums/durations/types, extra fields, oversize note/body and sanitized internal failure.
10. Formula-injection neutralization for values beginning with `=`, `+`, `-`, `@` (and relevant leading whitespace), idempotent retry and duplicate concurrent submission logic.
11. Existing route, `HomeDecisionCard` and analytics behavior remains green.

No real participant data or production Sheet is used in automated tests.

## Acceptance criteria

- One participant link runs the complete quiz; no Google login, download or manual file sending is required.
- `stay`, `move`, and `consider` are deterministic, randomized in order and rendered through the real canonical component.
- Data supports per-state interpretation accuracy, within-10-second comprehension, reason understanding, next action, first action where applicable, and `consider` misinterpretation analysis.
- Every response is versioned and reproducible from fixture/build metadata.
- No identifying fields are requested; research payloads do not include app identity, IP, user-agent or precise location.
- Research emits no production GA4 page views/events.
- Apps Script strictly validates, bounds, formula-sanitizes and idempotently appends one complete quiz row to the configured private Sheet.
- Frontend confirmation semantics exactly match the verified request/response contract and never treat opaque delivery as durable acknowledgment.
- The quiz is unlisted, independently disableable, responsive and isolated from the normal product flow.
- No Neon table/migration, application API/backend, new library/service, dashboard or participant system is added.
- Repo documentation contains the Sheet header schema, Apps Script source, exact manual setup/deploy/disable steps, frontend configuration, participant link pattern, smoke-test checklist and Google Sheets CSV-export steps.

## Scope boundaries

Do not change canonical decision/scoring semantics, production `HomeDecisionCard` UX/copy, live weather/campsite behavior, Free/Pro, checkout, entitlement, product analytics taxonomy, or normal navigation. Do not add Neon/schema work, Vercel API proxy, Google service-account credentials, Google login, new npm dependencies, a dashboard, generic survey builder, recruitment/result analysis, automatic #377 conclusions, unrelated cleanup, commit or push.

## STOP conditions

Stop and report if:

- a participant without Google login cannot submit through the audited deployment setting;
- direct browser→Apps Script cannot provide safe truthful delivery/acknowledgment semantics without a new application backend;
- CORS/redirect/content-type behavior would require `no-cors` to be misrepresented as confirmed persistence;
- Apps Script deployment would expose Sheet read access, Spreadsheet ID/owner credentials, or an admin-grade secret to participants;
- robust enough schema validation, idempotency/concurrency control or formula-injection protection cannot be implemented in the small script;
- analytics isolation requires altering normal production semantics instead of a narrow default-preserving seam;
- frozen scenarios require changing canonical tone/scoring logic;
- the work requires a database, application API, new service/library or broader architecture than approved.

## Verification and handoff

Run targeted quiz/component/analytics tests, any deterministic Apps Script validator harness, relevant route and `HomeDecisionCard` suites, then the full suite, lint and production build. Perform a manual browser→test-Sheet smoke test only if Róbert supplies or configures a non-production Sheet/web-app deployment; otherwise document it as an explicit owner setup/verification step and do not claim it passed.

Write `docs/ai/tasks/ticket-395/cc-report.md` with audited Google integration facts, files changed, scenario matrix, Sheet headers, literal request/response contract, Apps Script validation/idempotency/locking/formula-safety, config/access/lifecycle model, analytics proof, exact test results, setup/deploy/disable/export instructions, smoke-test status, residual abuse/privacy/CORS risks and deviations.

Populate the CC report path in `CURRENT.md` and set `CURRENT.md` to `CC_COMPLETE`. Do not commit or push.

---

## Jonesy review — Round 1 (targeting draft v2 only)

Reviewed: draft v2 above. Draft v1 is correctly marked superseded and was not reviewed for approval.

### Findings

1. **Google Apps Script does not answer CORS preflight (OPTIONS) requests — this is a hard constraint, not an implementation detail to discover by trial.** A `fetch()` `POST` with `Content-Type: application/json` (or any custom header) is a "non-simple" request and forces the browser to send an `OPTIONS` preflight first. Apps Script web apps only implement `doGet`/`doPost` and have no way to answer an `OPTIONS` request, so the preflight fails and the real `POST` never reaches the script — regardless of deployment access settings. The only reliable way to submit JSON to an Apps Script web app from a browser is to keep the request a CORS "simple request": `Content-Type: text/plain;charset=utf-8` (or `text/plain` / omit content-type so it defaults to one of the simple-request types), no custom headers, and parse the JSON payload server-side from `e.postData.contents` inside `doPost(e)`. §"Required preflight and integration audit" step 4 already tells CC to audit "content type" and "CORS behavior," but leaves this as something to be discovered experimentally. Given it is a well-established, deterministic constraint of the platform (not something that varies by deployment), state it directly in "Browser submission" and "Google Apps Script artifact" so CC does not burn implementation time rediscovering it, or worse, ship a version that silently fails CORS in production because a manual smoke test used a permissive local proxy.

2. **The Apps Script test requirement ("Apps Script-side validation tests or a checked-in deterministic test harness," Tests item 9) is satisfiable in name only unless the architecture is specified.** Apps Script `.gs` code runs against Google's own globals (`SpreadsheetApp`, `LockService`, `PropertiesService`, `ContentService`) that do not exist under Node/Vitest, so a `.gs` file cannot be unit-tested as-is, and "or a checked-in deterministic test harness" is vague enough that CC could satisfy it with something that never actually exercises the real validation logic. This repo already has an established pattern for exactly this problem: `api/_lib/auroraDecision/orchestrate.js` (Ticket 3) takes `sql`/`fetchImpl`/`now` as injected parameters specifically so the orchestration logic is unit-testable without the real DB/network/clock. The prompt should require the same split here: extract validation, permutation/enum/UUID checks, idempotency-key derivation, and formula-injection sanitization into one plain-JS module with no Apps Script globals, unit-tested under Vitest with injected fakes for the sheet/lock/clock; keep the actual `.gs` entry point as a thin adapter that only wires Apps Script's real `SpreadsheetApp`/`LockService` calls to that module's pure functions. Without this, "tests required" item 9 and item 10 (formula-injection neutralization, idempotent retry/concurrent submission logic) have no way to actually run in CI.

3. **CSP scope is audited but not decided.** Preflight step 3 correctly requires auditing "current CSP/security/deployment configuration," but nothing in "Explicit scope decision"-equivalent text or the STOP conditions says whether loosening the site's CSP (e.g. `connect-src`) to permit `script.google.com`/`script.googleusercontent.com` is authorized. Since the entire ticket depends on the browser being able to reach that origin, this should be stated affirmatively up front — mirroring how v1 had to explicitly carve out the "no backend" rule for its scope — rather than left for CC to infer. Suggested addition: CSP may be loosened by the smallest change needed to permit `connect-src` to the specific Apps Script exec/googleusercontent origins, and to no other new origin.

### Minor / non-blocking

- Consider naming Apps Script's own execution/lock quotas (concurrent execution limits, `LockService` wait timeout) as one of the "residual limitations" the cc-report is already required to document (Verification and handoff), so this isn't left implicit. Very unlikely to matter for this quiz's expected traffic, but cheap to state.
- Process note, not a defect in the prompt itself: `CURRENT.md`'s `Result review:` field for this task already names `docs/ai/tasks/ticket-395/result-review.md`, but that file does not exist yet (confirmed via directory listing — only `prompt-review.md` exists). The other not-yet-created fields correctly read "Not created yet." Recommend Ripley/Róbert correct that field to "Not created yet" until the file is actually written, since `docs/ai/README.md`'s new "Locating result-review.md" rule now tells future sessions to treat the `CURRENT.md` field as the authoritative path without re-verifying existence.

### Verdict: REVISE

Findings 1 and 2 are substantive enough to revise before this goes to Claude Code — both are concrete, avoidable sources of wasted implementation time or a silently broken submission path. Finding 3 is a scope-authorization gap in the same spirit as the "Explicit scope decision" already used in v1. Please fold fixes into a new draft round for Jonesy re-review.

---

## Ripley revision — draft v3

Jonesy's Round 1 verdict is accepted. Draft v3 consists of draft v2 with the following authoritative replacements and additions. Where these amendments conflict with draft v2, draft v3 controls; all other draft-v2 requirements remain unchanged. Draft v1 remains superseded.

### 1. Required preflight and known Apps Script transport constraint

Replace draft v2 preflight items 4–5 with:

4. Treat this as a known platform constraint: Google Apps Script web apps expose `doGet`/`doPost` but cannot implement the browser's `OPTIONS` preflight. Therefore the participant submission must remain a CORS **simple request**. Use `POST` with `Content-Type: text/plain;charset=utf-8` (or another audited safelisted text/plain form), no custom request headers, and send the serialized JSON string as the body. The Apps Script `doPost(e)` adapter must parse JSON from `e.postData.contents`. Do not use `application/json`, authorization/custom headers, or any request shape that triggers preflight.
5. Audit the real deployed redirect/response behavior for both `script.google.com` and the resulting `script.googleusercontent.com` origin. Verify whether the browser can read a sanitized acknowledgment response after the simple POST. Local dev proxies, disabled browser security, Postman/curl, or Apps Script editor execution are not evidence of production browser behavior. An opaque response or a request that merely resolves under `mode: "no-cors"` is never proof of durable persistence.
6. Record the chosen route, lifecycle/access boundary, pure-core/adapter boundary, Sheet schema, Apps Script validation/idempotency model, exact simple-request and acknowledgment contract, CSP change, configuration and residual quota limitations in `cc-report.md`.

The original STOP condition remains: if a normal production browser cannot obtain truthful confirmed/unconfirmed delivery semantics directly from Apps Script without a new app backend, stop and report rather than shipping a misleading confirmation or silently adding infrastructure.

### 2. Authoritative browser submission contract

Replace draft v2's **Browser submission** section with:

## Browser submission — draft v3

- Submit serialized JSON through a CORS-simple `POST` using `Content-Type: text/plain;charset=utf-8` and no custom headers. Apps Script parses `e.postData.contents` explicitly.
- Never switch to `application/json`, `Authorization`, `X-*`, or another non-safelisted header: Apps Script cannot answer the resulting `OPTIONS` preflight, so the real POST would not run.
- Read the web-app URL and enabled/version setting from existing project-appropriate environment configuration; fail closed when absent.
- Use a timeout and an explicit state machine: idle → submitting → confirmed, failed, or unconfirmed. Exact state transitions must match the verified cross-origin redirect/response behavior.
- Never use `mode: "no-cors"` as a success mechanism and never label an opaque response as confirmed persistence.
- Keep the same session UUID and byte-equivalent semantic payload across retries. The pure core derives the same idempotency key and Apps Script prevents duplicate append.
- Automated tests must assert the exact simple-request shape and that no custom header/preflight-triggering option is introduced.

### 3. Testable Apps Script architecture; no untested duplicate validator

Replace the opening of draft v2's **Google Apps Script artifact** section and its validation implementation requirement with:

## Google Apps Script artifact and testable core — draft v3

Check in the actual deployable Apps Script source/template plus owner setup documentation. Split it into:

1. a plain-JavaScript core with **no** direct dependency on `SpreadsheetApp`, `LockService`, `PropertiesService`, `ContentService`, or other Apps Script globals; and
2. a thin Apps Script `doPost(e)` adapter that reads owner properties, parses `e.postData.contents`, calls the core, acquires/releases the real lock, reads/writes the real Sheet and creates the sanitized response.

The core owns the canonical logic for:

- allowed-key/schema validation;
- UUID, version, permutation, enum, type, duration and length validation;
- canonicalization/normalization;
- idempotency-key derivation;
- Sheet row/header construction;
- formula-injection neutralization;
- stable sanitized success/error result construction.

The adapter owns only Google-global wiring and side effects. Inject or wrap sheet lookup, duplicate lookup/append, lock and clock boundaries so deterministic Vitest tests can use fakes. The **same source of truth** for core validation/sanitization must be exercised by Vitest and deployed with the Apps Script artifact; do not maintain a Node-only validator and a separately copied `.gs` validator that can drift.

Choose and document the smallest no-new-dependency mechanism that makes the deployable core testable in this repo—for example a runtime-neutral global/IIFE core loaded by a Vitest harness, or a deterministic checked-in packaging step. Do not claim coverage based on a reimplementation that the deployed adapter does not call.

The owner will create/control the private Sheet and deploy/configure the script; CC must not create Google resources or deploy on the owner's behalf.

All remaining draft-v2 Apps Script requirements continue to apply: owner-side properties, active version and exact three-scenario validation, strict limits, server receipt time, formula protection, `(test_version, session_id)` idempotency, locked duplicate-check+append critical section, sanitized response, no read/export endpoint, and documented abuse limitations.

### 4. Apps Script test requirements

Replace draft v2 Tests items 9–10 with:

9. Vitest must execute the actual runtime-neutral core source that the deployed Apps Script adapter calls. With injected/fake sheet/lock/clock boundaries, cover valid payload, invalid campaign/version/UUID/permutation, missing/duplicate/unknown scenarios, invalid enums/durations/types, extra keys, oversize note/body, stable normalized row construction and sanitized internal failure.
10. Test formula-injection neutralization for participant-controlled strings beginning with `=`, `+`, `-`, `@` and relevant leading whitespace. Test stable idempotency-key derivation, sequential retry, duplicate-click behavior, and the adapter's locked duplicate-check+append ordering with deterministic concurrent/interleaved fakes. The deployable core—not a test-only reimplementation—must produce the values under assertion.

Add:

12. A request-contract test asserts `POST`, `text/plain;charset=utf-8`, serialized JSON body and absence of custom headers/other preflight triggers. It also proves opaque/no-CORS completion never enters the confirmed state.

### 5. Explicitly authorized CSP scope

Add to draft v2's scope decision and route/access requirements:

For #395 only, the owner authorizes the smallest CSP/security-header change required for browser submission to the audited Google Apps Script web-app origins. Limit `connect-src` to the exact required `script.google.com` and audited redirect/`script.googleusercontent.com` origins; do not add broad Google wildcards, unrelated origins, weakened `default-src`, `unsafe-*`, or changes to other directives. Verify the production build/deployment configuration actually emits the intended policy and add a targeted configuration/security regression test where the current configuration is testable.

If the actual deployment uses a more specific googleusercontent host that cannot safely be expressed without an overbroad wildcard, trigger the STOP condition and report the concrete CSP trade-off for owner decision.

### 6. Quotas, locking and residual limits

Add to the Apps Script implementation/report requirements:

- Use a named bounded `LockService` wait timeout and return a stable retryable busy response when the lock cannot be acquired; never wait indefinitely.
- Document Apps Script execution, concurrent execution, request/runtime and Sheet quotas relevant to this low-volume quiz, plus the chosen lock timeout and expected participant-volume assumption. Do not claim the endpoint is suitable for traffic beyond those audited limits.
- Treat quota/lock exhaustion as an explicit failed or retryable response when readable; never convert it to confirmed success.

### 7. Acceptance and STOP additions

Add to acceptance criteria:

- Browser submission is a tested CORS-simple `text/plain;charset=utf-8` POST with no custom headers; production CSP permits only the exact audited Apps Script connection origins.
- The deployed Apps Script adapter calls the same runtime-neutral core validation/sanitization logic exercised by Vitest; no untested duplicate implementation exists.
- Idempotency is protected inside a bounded locked critical section, and lock/quota limitations are documented.

Add to STOP conditions:

- required CSP access cannot be expressed without a broad Google wildcard or weakening unrelated policy directives;
- the actual deployable core cannot be exercised deterministically in Vitest without duplicating its validation/sanitization logic;
- Apps Script quotas/locking or cross-origin redirect behavior make the expected low-volume collection unreliable without new infrastructure.

### 8. Workflow pointer correction

Jonesy's process note is accepted. `docs/ai/CURRENT.md` now records `Result review: Not created yet`; the authoritative `docs/ai/tasks/ticket-395/result-review.md` path will be populated only when that artifact is created during result review.

### Revision verdict request

Jonesy: review draft v3 as draft v2 plus these authoritative amendments. Return `APPROVED` or `REVISE`. Do not implement.

---

## Jonesy review — Round 2 (targeting draft v3 = v2 + amendments)

All three Round 1 findings are correctly and substantively addressed:

1. **CORS preflight constraint** — now stated as a known platform fact (preflight item 4), carried into the authoritative "Browser submission — draft v3" section, and locked in with a dedicated request-contract test (Tests item 12) asserting the exact simple-request shape and that opaque/no-CORS completion never counts as confirmed. `text/plain;charset=utf-8` is in fact one of the three CORS-safelisted content types, so this is technically correct, not just plausible-sounding.
2. **Testable core** — the plain-JS-core / thin-adapter split, with the explicit rule that "the same source of truth... must be exercised by Vitest and deployed with the Apps Script artifact; do not maintain a Node-only validator and a separately copied `.gs` validator that can drift," closes the exact loophole flagged in Round 1. Test items 9–10 now require the deployed core itself to be under test, not a reimplementation.
3. **CSP authorization** — explicitly and narrowly authorized (§5), with a stated non-goal list (no wildcard, no `unsafe-*`, no weakening other directives) and its own STOP condition if a safe expression isn't possible. This mirrors the "Explicit scope decision" precedent well.

The quota/locking addition (§6) and the workflow-pointer correction (§8) are also good — §6 in particular goes further than my "minor/non-blocking" note by adding a dedicated STOP condition for quota/locking reliability, which is appropriately conservative for something touching a third-party platform's execution limits.

### One non-blocking clarification (does not require another revision round)

§3 ("Google Apps Script artifact and testable core") offers two example packaging mechanisms: a "runtime-neutral global/IIFE core" or "a deterministic checked-in packaging step." The unchanged v2 scope boundary still says "Do not add... new npm dependencies." A hand-authored single-file UMD-style core (`typeof module !== "undefined" ? module.exports = ... : globalThis.X = ...`) needs no bundler and trivially satisfies both requirements at once — Apps Script projects already share one global scope across files with no ES-module support, so this is also the simplest correct answer, not just the dependency-safe one. Worth CC treating that as the default rather than reaching for a build/packaging step, but this is a preference for the obvious solution, not a gap that blocks approval — if CC's audit finds a genuine reason a packaging step is required, the existing "no new npm dependencies" boundary already constrains it to already-present tooling without needing new prompt language.

### Verdict: APPROVED

Draft v3 (draft v2 + the eight amendments above) is approved for execution. Ripley: create `approved-prompt-v1.md` from draft v3's effective content (v2 as amended) and set `CURRENT.md → READY_FOR_CC`.
