# #434 — Approved implementation prompt v1

Date: 2026-10-06. Ripley consolidated Round 2 and Jonesy's APPROVED conditions C1–C8. Execute this file only when the owner sends `Prompt approved` to CC and CURRENT.md references it at READY_FOR_CC. Do not execute prompt-review.md. Immutable once execution begins.

## Authorization and objective

Róbert explicitly approved the narrow backend exception on 2026-10-06 with the wording **“Samþykkt”**, after the explanation and recommendation to include cookie deletion and tests in #434. This authorizes only the cookie-expiry helper/logout wiring/tests below, alongside the client logout action. No broader backend changes.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/434 — Bæta „Skrá út“ við Stillingar.

Add `🚪 Skrá út` / `🚪 Log out` at the bottom of existing Settings for signed-in Free and Pro users on desktop/mobile. Reuse existing session revocation and preserve other settings, login/payment behavior and DEV override. No confirmation, profile page or new library. #433 is CANCELLED: preserve its history and do not implement manual grants. Preserve unrelated working-tree changes; no commit or push.

## Mandatory pre-edit audit

Read repository instructions and confirm the actual App -> PageHeader -> Toolbar prop chain, useMe lifecycle, useCampsites reload and cookie setter/logout contract before editing. Toolbar owns settingsOpen; no frontend logout exists. App owns the relevant me instance. Independent useMe consumers on other routes mount fresh; verify none remains mounted with Settings. App renders this UI at / and /about, both public.

Login sets Domain=.campcast.is/.eltumvedrid.is through api/_lib/setCookie.js; current logout omits Domain. Cookie mismatch is source evidence, not production observation. useMe aborts previous fetches but lacks reset invalidation; useCampsites lacks latest-wins guards. App's effective isPro includes DEV override and drives campsite reloadKey. Search for user/email-derived storage, report findings without indiscriminate clearing.

## Backend: narrow approved exception

Export clearSessionCookie(res, requestHost) from api/_lib/setCookie.js using existing cookieDomain. Import in api/logout.js as `./_lib/setCookie.js`, matching Node serverless conventions (this narrow backend import follows existing runtime pattern despite frontend extensionless conventions). Both logout success and catch paths pass req.headers.host to the helper.

Call res.setHeader('Set-Cookie', array) once: always an array, including single host-only expiration on localhost/unknown hosts. Recognized domains expire both Domain-scoped and host-only cc_session variants. Domain values come unchanged from existing cookieDomain. Every variant preserves today's logout attributes: Path=/, HttpOnly, SameSite=Lax, Max-Age=0 and Secure only when NODE_ENV is production. Host-only has no Domain. Do not modify login setter/lifetime, host substring matching, revocation SQL or response shape. Broader cookie/security policy is outside scope.

Existing ok:true with note is browser-logout success after this fix, but server revocation is unconfirmed. Preserve that contract; do not redesign failure policy. No Neon calls or real-user/production mutations during implementation.

## Client contract

- Add small useLogout({ resetMe, pushToast, t }) hook returning logout and loggingOut. logout returns Promise<boolean>, POSTs /api/logout with credentials:include and uses an in-flight ref guard (state alone is insufficient). Release guard in finally. Require HTTP success and parsed ok:true; note still succeeds. Network/non-2xx/malformed/ok:false failures return false, preserve auth, show translated toast.message and allow retry. No raw error/PII, confirmation or success toast. Handle navigation/unmount while pending without throwing or toasting on unmounted App; no new architecture.
- Pass isSignedIn=!!me?.user, onLogout, loggingOut through App -> PageHeader -> Toolbar with absent/false defaults. Do not call resetMe at render time: existing tests mock useMe without it. Real wiring must supply it. Keep settingsOpen local. Await onLogout; on true close panel, and return focus to Settings toggle only if panel remained open when the promise resolved. Track current openness rather than relying on a captured stale value. No navigation: stay on / or /about.
- Add stable useCallback resetMe to App's useMe instance. Reset to {ok:true,user:null,subscription:null,entitlements:{pro:false,proUntil:null}}, loadingMe:false, meError:null. Preserve refetchMe/refreshMe identities and compatibility. Increment a generation/epoch ref on reset and abort current request. Every fetch captures its epoch; stale response/body/catch/finally must not write data/error/loading. Post-reset requests, including re-login, apply normally. Do not broaden unrelated hook behavior beyond the necessary guard. No post-logout verification fetch, polling, global auth store or cross-tab work.
- Add narrowly scoped latest-wins request-id guarding to useCampsites, including data/error/loading and necessary unmount invalidation, so late Pro results cannot overwrite Free reload. No API campsite changes or new AbortController plumbing. Logged-in Free logout does not change effective tier and need not reload. Existing campsite loading gate during Pro-to-Free reload is expected.
- Preserve eligibility rules and DEV override. Production-semantics tests stub DEV false; separate DEV test uses true. Visibility uses user existence, not isPro/loadingMe: retained signed-in user still sees logout during refetch; initial unresolved/anonymous does not.
- Preserve language/theme/units, preview counters, checkout attribution and campsite choice where eligible. Existing fallback replaces a Pro-only site with first Free site and persists lastSite; leave it unchanged. Do not promise restoration on re-login. Login after logout must not prefill previous email.
- Add label/pending/failure translation keys to both dictionaries in translations.common.js. Native button, decorative aria-hidden door icon, focus-ring, min-h-[44px]. Last row after all controls including DEV toggle, basis-full/w-full wrapper with subtle border-t. Verify at 320px without overflow. Preserve other controls, seasonal hero copy/events and analytics. No new logout event.

## Tests and validation

Add targeted new behavior tests; existing green suites alone are insufficient.

1. New api/logout.test.js using existing postgres-mock patterns: non-POST 405, SHA256 token revocation, no-cookie success and SQL-throw note path. Assert one Set-Cookie header call with array, exact Domain vs host-only variants and unchanged attributes. Host matrix: apex/www for both production domains, host with port, localhost:3000, uppercase, missing host and unrelated host. Stub NODE_ENV for Secure on/off and restore afterward. All success/no-cookie/throw paths use helper. No DB connection.
2. useMe reset deep-equals successful normalized anonymous API result; loading false/error null. Deferred fetch ignoring signal, deferred body, stale rejection/finally cannot restore Pro or change reset state. Post-reset request/re-login applies normally. Verify reset callback stability and existing refetch/refresh identities.
3. useLogout correct endpoint/method/credentials, pending/repeated-click single request, note-success anonymous/no error toast, all failure cases and retry sending a second request. Guard released in finally. Check unmount during pending and report behavior.
4. Real App wiring tests use real useMe, useCampsites, PageHeader, Toolbar and useLogout with fetch stubs; only heavy unrelated children may be stubbed. Do not reuse existing App tests' mocked auth/campsite/header wiring. Verify identity/subscription/entitlements reset, closed panel/focus, no focus pullback if already closed, no verification fetch, /about retained and no old email on login. IS/EN real dictionary labels/pending/error in toast.message.
5. Signed-in Free/Pro visibility, anonymous/unresolved absence, retained-user refetch visibility, DEV override alone absent. Sentinel DevProToggle mock verifies logout follows it (existing null mock cannot prove ordering). Other settings callbacks and hero analytics/copy unaffected.
6. Pro-to-Free reload discards late Pro response, Free logout unchanged tier, free-eligible lastSite preserved and Pro-only site follows existing fallback. Production tests use vi.stubEnv('DEV', false), DEV test true, then restore env. Report how DEV was controlled.
7. Browser checks mobile including 320px and desktop, both languages: placement, touch target, no overflow, menu closure and clear anonymous state. Mock session behavior for anonymous after refresh, label checks mocked. No live accounts. Report whether test:e2e ran and any unavailable checks accurately.

Run targeted new suites, existing Toolbar, relevant hook/login/campsite tests, all src/App.*.test.jsx and AppRoutes suites, npm run lint and npm run build. Use bounded npm run test:run paths and report exact commands/results, pre-existing failures and limitations.

Owner-controlled post-deploy verification remains pending: on both campcast.is and eltumvedrid.is inspect Domain-scoped cc_session before logout, confirm relevant Domain and host-only cookies gone after, then reload and confirm anonymous UI. Localhost/previews/mocked header tests cannot prove production cookie clearing or deployment.

## STOP, report and lifecycle

Stop and return to Ripley if scope requires broader backend/cookie policy, shared auth redesign, paid eligibility, payment/checkout/webhook changes, forecast/scoring, new dependencies or unrelated routes. The cookie-expiry helper/wiring/tests and narrow client request invalidation above are the only exceptions. Unverified email login/admin identity, substring domain matching and other tabs' stale UI are report-only observations; no adjacent security redesign. No production mutation, commit, push, deployment or issue closure.

Before implementation verify CURRENT READY_FOR_CC and set CC_IN_PROGRESS. Execute only this prompt. Write docs/ai/tasks/ticket-434/cc-report.md with audit, scope, exact tests/validation, deviations and limits. State **“browser logout; server-side revocation unconfirmed when note is present”** and list pending owner production-cookie check; never claim production clearing from mocks/previews/localhost. Populate CC report field in CURRENT and set CC_COMPLETE after writing report. Jonesy then reviews result; Ripley performs final assessment. No automatic git actions.
