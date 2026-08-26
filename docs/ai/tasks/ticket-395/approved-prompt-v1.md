# Ticket 395 — Approved implementation prompt v1

## Workflow target

Implement GitHub issue #395 as a small reusable in-project UX quiz whose first test validates whether users understand canonical `stay`, `move`, and `consider`. Quiz results must be submitted automatically to an owner-controlled Google Sheet through Google Apps Script. Do not add Neon persistence, migrations, or a new application API/backend.

This is the approved prompt. Execute only when `docs/ai/CURRENT.md` names `ticket-395`, references this file, and is at `READY_FOR_CC`.

## Required preflight and workflow

1. Read `CLAUDE.md`, `AGENTS.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, GitHub #395 and parent #377.
2. Verify `CURRENT.md` is `READY_FOR_CC`, then set it to `CC_IN_PROGRESS` before changing implementation.
3. Inspect `src/AppRoutes.jsx` and routing tests, `src/components/HomeDecisionCard.jsx` and tests, `src/lib/analytics.js`, page-view tracking, `usePageRouteProps`, translations, environment/config patterns, and current CSP/security/deployment configuration.
4. Treat this as a known platform constraint: Apps Script web apps expose `doGet`/`doPost` but cannot answer a browser `OPTIONS` preflight. Participant submission must therefore be a CORS simple request: `POST`, `Content-Type: text/plain;charset=utf-8`, no custom headers, serialized JSON string body. `doPost(e)` must parse `e.postData.contents`. Do not use `application/json`, authorization/custom headers, or another preflight-triggering shape.
5. Audit the real deployed redirect/response behavior for `script.google.com` and the resulting `script.googleusercontent.com` origin. Verify whether a normal production browser can read a sanitized acknowledgment after the simple POST. Local proxies, disabled browser security, Postman/curl, Apps Script editor execution, an opaque response, or `mode: "no-cors"` are not evidence of durable browser-confirmed persistence.
6. Record the chosen route, lifecycle/access boundary, pure-core/adapter boundary, Sheet schema, validation/idempotency model, exact request/acknowledgment contract, CSP change, configuration and residual quota limitations in `cc-report.md`.

If direct browser submission cannot provide truthful confirmed/unconfirmed delivery semantics without a new app backend, stop and report the exact limitation and smallest safe alternatives. Do not silently add infrastructure or ship misleading confirmation.

## Outcome

One unlisted research route provides a complete anonymous quiz. The participant gives lightweight consent, sees deterministic `stay`, `move`, and `consider` scenarios in randomized order, answers structured questions, presses one submit button, and—only when the audited integration verifies it—receives confirmation that the result was appended to the private owner-controlled Google Sheet. The participant must not download/send a file or sign into Google.

Keep v1 reusable through versioned test/scenario configuration, but deliberately small: no dashboard, participant management, generic survey builder, new dependency, database, or app backend.

## Participant route, access and lifecycle

- Register one dedicated route in `AppRoutes.jsx`, using `/research/decision-quiz` unless the audit identifies a safer existing convention.
- Do not add it to navigation, sitemap, marketing surfaces, or the normal product journey.
- Add a documented enabled/lifecycle config switch so this quiz can be disabled independently. Missing, invalid or disabled configuration fails closed with neutral UI and cannot submit.
- An unlisted URL reduces discoverability; it is not authentication. Do not place admin credentials, Spreadsheet ID, Google credentials or Apps Script owner secrets in the frontend.
- A distributed campaign token, if used, is not secret and must never grant Sheet read/export/admin access.
- Preserve normal route/link behavior and support desktop plus 390–430 px mobile widths.

For #395 only, the owner authorizes the smallest CSP/security-header change required to connect to the audited Apps Script origins. Restrict `connect-src` to exact required `script.google.com` and audited redirect/`script.googleusercontent.com` origins. Do not add broad Google wildcards, unrelated origins, weakened `default-src`, `unsafe-*`, or changes to unrelated directives. Verify the production configuration emits the intended policy and add a targeted configuration/security regression test where testable.

If the real redirect host cannot be expressed safely without an overbroad wildcard, stop and report the concrete CSP trade-off.

## Quiz protocol

The flow must include:

1. concise purpose/privacy copy and explicit consent/continue;
2. `stay`, `move`, and `consider` exactly once;
3. an unbiased Fisher–Yates-equivalent permutation generated once per session and stable across rerenders/retries;
4. the real decision surface for each frozen scenario;
5. after each scenario:
   - interpreted recommendation: `stay`, `move`, `consider`, `unsure`;
   - one main reason from versioned fixed choices plus `unsure`;
   - intended next action from versioned fixed choices;
   - optional bounded confusion note;
6. interpretation timing from a precisely documented monotonic start/end boundary;
7. first interaction capture where meaningful, with actions intercepted so no participant enters checkout or another live flow;
8. incomplete-answer prevention, submit-in-progress protection, clear failure/unconfirmed retry and duplicate-click safety;
9. final saved state only when supported by the verified acknowledgment contract.

Do not turn comprehension testing into memory testing. Keep the stimulus visible while answering unless #377 explicitly requires otherwise. Derive the within-ten-second metric from the captured interpretation boundary rather than hiding the card after ten seconds.

## Frozen scenario architecture

- Render the actual `HomeDecisionCard` with actual i18n and responsive styling; no screenshot, fake/duplicated card, or hardcoded component copy.
- Never import `HomeDecisionCard.test.jsx`, Vitest or Testing Library into runtime. Extract only the smallest runtime-safe versioned fixture/config boundary justified by audit.
- Freeze raw verdict, `comparisonState.direction`, final canonical tone, readiness, candidate/locked state, Free/Pro state, visible reasons and CTA behavior for each scenario.
- Scenario identity and answer key follow final canonical rendered tone, never raw verdict.
- Include the raw `move` + comparison `similar` → canonical `stay` diagnostic fixture in tests, even if it is not a fourth participant scenario.
- Do not fetch live weather/campsites or run async scoring from the research route.

## Analytics isolation

Research rendering and interaction must emit no production GA4 page view or product event, including raw/canonical recommendation, comparison, locked and CTA events.

Add the smallest explicit testable isolation seam while keeping normal production defaults unchanged. A narrow optional `HomeDecisionCard` prop/context is acceptable if analytics remains enabled by default and existing production call sites retain behavior. Do not mutate global GA configuration, monkey-patch analytics, introduce ad-hoc global flags, or weaken existing event tests.

Quiz answers go only to Apps Script/Google Sheets, never GA4.

## Result payload and Sheet schema

Use one versioned bounded payload per completed quiz and one normalized Sheet row per accepted payload unless audited Sheet constraints clearly justify another stable layout.

Include only:

- random session UUID;
- `test_version` and fixture/build version;
- client start/completion timestamps, with server receipt time authoritative only for receipt;
- language and coarse `mobile`/`desktop` viewport category;
- scenario order;
- per scenario: interpretation, selected reason, intended action, captured first action where applicable, bounded interpretation milliseconds, and optional bounded confusion note.

Do not include name, email, Google identity, app user/account/session ID, cookie, IP, user-agent, exact viewport, precise location or free-form demographics. Do not accept participant-supplied trusted `correct`/`incorrect`; derive correctness later from versioned scenario identity.

Define stable Sheet headers/order in a checked-in schema/example. CSV exported from Sheets must remain directly analyzable.

## Google Apps Script artifact and testable core

Check in the actual deployable Apps Script source/template and owner setup documentation. Split it into:

1. a plain-JavaScript core with no direct dependency on `SpreadsheetApp`, `LockService`, `PropertiesService`, `ContentService` or other Apps Script globals; and
2. a thin `doPost(e)` adapter that reads owner properties, parses `e.postData.contents`, invokes the core, acquires/releases the real lock, reads/writes the real Sheet and creates the sanitized response.

The core owns:

- allowed-key/schema validation;
- UUID, version, permutation, enum, type, duration and length validation;
- canonicalization/normalization;
- idempotency-key derivation;
- Sheet row/header construction;
- formula-injection neutralization;
- stable sanitized success/error construction.

The adapter owns only Google-global wiring and side effects. Inject/wrap sheet lookup, duplicate lookup/append, lock and clock boundaries for deterministic fakes. The same source of truth for validation/sanitization must be exercised by Vitest and deployed with Apps Script. Do not maintain a Node-only validator and separate drifting `.gs` validator.

Choose the smallest no-new-dependency mechanism that makes the deployable core testable—for example a runtime-neutral global/IIFE core loaded by a Vitest harness. Prefer that simple approach unless audit shows a genuine reason for a deterministic checked-in packaging step using already-present tooling.

The script must also:

- keep Spreadsheet ID, target tab, active version and any owner-side configuration in Apps Script properties; only the deployed web-app URL and explicitly shareable campaign value may reach the public frontend;
- accept only the known active version and exactly three known scenario records once each;
- enforce strict allowed keys, enum/type/numeric/string/body limits;
- generate server receipt time itself;
- neutralize spreadsheet formula injection for every participant-controlled string;
- implement idempotency on `(test_version, session_id)`;
- protect duplicate-check plus append inside one bounded `LockService` critical section;
- use a named bounded lock wait and return a stable retryable busy response if not acquired;
- return minimal sanitized results without Sheet IDs, rows, stack traces or owner details;
- apply proportionate low-volume abuse controls without collecting PII;
- expose no read/export endpoint.

Document Apps Script execution/concurrency/runtime and Sheet quotas relevant to the expected low-volume quiz, the lock timeout and volume assumption. Treat readable quota/lock exhaustion as failed/retryable, never confirmed success.

Róbert will create/control the private Sheet and deploy/configure the script. CC must not create Google resources or deploy on his behalf.

## Browser submission

- Submit serialized JSON with `POST`, `Content-Type: text/plain;charset=utf-8`, and no custom headers. Apps Script parses `e.postData.contents`.
- Never use `application/json`, `Authorization`, `X-*`, or another preflight trigger.
- Read web-app URL and enabled/version settings from project-appropriate environment config; fail closed when absent.
- Use a timeout and explicit idle → submitting → confirmed/failed/unconfirmed state machine matching verified cross-origin behavior.
- Never use `mode: "no-cors"` as a success mechanism or label an opaque response confirmed.
- Keep the same session UUID and byte-equivalent semantic payload across retries; server idempotency prevents duplicates.
- Test the exact simple-request shape and absence of preflight-triggering options.

## Privacy and copy

- Put participant-facing IS/EN text in existing i18n.
- State what is collected, its purpose, that no identifying fields are requested, that results go to an owner-controlled Google Sheet, and that personal information must not be entered in the optional note.
- Provide refusal/exit before submission.
- Do not promise anonymity, deletion, security or retention guarantees beyond the real setup.
- Document owner responsibility for Sheet access and retention.

## Tests required

Add deterministic coverage for at least:

1. Route registration, missing/disabled config, consent gate, full flow, responsive shell and confirmation only after tested acknowledgment.
2. Actual `HomeDecisionCard` renders each frozen canonical state without live inputs/scoring.
3. Scenario order is a real permutation, generated once and stable across rerender/retry, without flaky fixed-order assertions.
4. Timer boundaries and bounded duration using fake time/a monotonic seam.
5. Required answers, allowed values, optional-note limit, incomplete-submit prevention and stable retry payload/session ID.
6. First action capture/interception without checkout or live navigation.
7. Zero product page-view/event calls across research render, transition, rerender and interaction, with unchanged normal analytics defaults.
8. Client serialization and confirmed/failed/timeout/unconfirmed states against mocked exact Apps Script responses; opaque/no-CORS never confirms.
9. Vitest executes the actual runtime-neutral deployed core. With fake sheet/lock/clock boundaries cover valid payload, bad campaign/version/UUID/permutation, missing/duplicate/unknown scenarios, invalid enums/durations/types, extra keys, oversize note/body, normalized row and sanitized internal failure.
10. Formula neutralization for strings beginning with `=`, `+`, `-`, `@` and relevant leading whitespace; stable idempotency key; sequential retry/double click; locked duplicate-check+append ordering with deterministic interleaving fakes.
11. Existing route, `HomeDecisionCard` and analytics tests remain green.
12. Request contract asserts `POST`, `text/plain;charset=utf-8`, serialized body, no custom/preflight-triggering options, and no opaque-response confirmation.
13. CSP/security config permits only audited required origins without broad wildcard or weakened unrelated directives, where current config is testable.

No real participant data or production Sheet in automated tests.

## Acceptance criteria

- One participant link runs the full quiz; no Google login, download or manual sending.
- Deterministic `stay`, `move`, `consider` are randomized and rendered through the real canonical component.
- Data supports per-state accuracy, within-ten-second comprehension, reason understanding, next/first action and `consider` misinterpretation analysis.
- Results are versioned/reproducible from fixture/build metadata.
- No identifying fields or app identity/IP/user-agent/precise location in payloads.
- No research page view or product event reaches production GA4.
- Apps Script strictly validates, bounds, formula-sanitizes and idempotently appends one complete quiz row.
- Browser submission is a tested simple `text/plain;charset=utf-8` POST with no custom headers.
- Confirmation semantics exactly match verified response behavior and never treat opaque delivery as persistence.
- The deployed adapter calls the same runtime-neutral core exercised by Vitest; no duplicate validator.
- Idempotency is inside a bounded lock; lock/quota limitations are documented.
- Production CSP permits only exact audited Apps Script origins.
- Quiz is unlisted, independently disableable, responsive and isolated from normal product flow.
- No Neon/migration, application API/backend, new library/service, dashboard or participant system.
- Documentation includes Sheet headers, Apps Script source, setup/deploy/disable/config, participant link, smoke checklist and Google Sheets CSV-export steps.

## Scope boundaries

Do not change canonical decision/scoring semantics, production `HomeDecisionCard` UX/copy, live weather/campsite behavior, Free/Pro, checkout, entitlement, product analytics taxonomy or normal navigation. Do not add Neon/schema, Vercel API proxy, Google service-account credentials, Google login, npm dependencies, dashboard, generic survey builder, recruitment/result analysis, automatic #377 conclusions or unrelated cleanup. Do not commit or push.

## STOP conditions

Stop and report if:

- a participant without Google login cannot submit through the audited deployment;
- direct browser→Apps Script cannot provide safe truthful acknowledgment without a new app backend;
- CORS/redirect behavior would require `no-cors` to be misrepresented as confirmed;
- required CSP access cannot be expressed without broad Google wildcard or weakening unrelated directives;
- deployment would expose Sheet read access, Spreadsheet ID/owner credentials or admin-grade secret;
- the deployable core cannot be tested deterministically in Vitest without duplicated validation/sanitization;
- adequate validation, idempotency/locking or formula protection cannot fit the small script;
- quotas/locking/cross-origin behavior make expected low-volume collection unreliable without new infrastructure;
- analytics isolation requires changing normal production semantics;
- frozen scenarios require canonical tone/scoring changes;
- work requires database, application API, new service/library or broader architecture than approved.

## Verification and handoff

Run targeted quiz/component/analytics/core tests, relevant route and `HomeDecisionCard` suites, full test suite, lint and production build. Perform manual browser→test-Sheet smoke only if Róbert supplies/configures a non-production Sheet/web-app deployment; otherwise document it as an explicit owner setup/verification step and do not claim it passed.

Write `docs/ai/tasks/ticket-395/cc-report.md` with:

- audited Google integration and CSP facts;
- files changed and scenario matrix;
- Sheet headers and literal request/response contract;
- deployable core/adapter architecture, validation, formula safety, idempotency and locking;
- config/access/lifecycle and quota/abuse/privacy limitations;
- analytics-isolation proof;
- exact test results and smoke-test status;
- setup/deploy/disable/export instructions;
- deviations, residual risks and follow-ups.

Then populate the CC report path in `CURRENT.md` and set it to `CC_COMPLETE`. Writing the report without that transition is incomplete. Do not commit or push.
