# #434 — Ripley initial prompt, Round 1

Date: 2026-10-06. Discussion for Jonesy; NOT execution authorization.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/434
Title: Bæta „Skrá út“ við Stillingar

## Objective and scope

Add a clear logout action at the bottom of existing Settings for signed-in users, in IS/EN and on mobile/desktop. Reuse existing logout endpoint, preserve all other settings and login/payment behavior. Owner explicitly assigned this session Ripley. #433 is CANCELLED: do not revive manual Pro grants. Preserve existing working-tree changes (CURRENT.md and ticket-433 history).

## Read-only audit findings

- Toolbar.jsx owns settingsOpen and toolbar-settings-panel; current controls are PWA install, units, language, theme and DEV Pro toggle. No auth props or logout action.
- App.jsx owns me/loadingMe/refetchMe and renders PageHeader.jsx, which forwards props to Toolbar. This is the existing UI entrypoint. Keep presentation components driven by props.
- api/logout.js already accepts POST with cc_session, revokes its hashed session and clears the HttpOnly cookie with Path=/, Max-Age=0. On revoke failure it still clears the cookie and returns ok:true with a note. Frontend cannot clear this cookie directly. No frontend logout handler was found.
- useMe.js normalizes user/subscription/entitlements, fetches on mount/refetch and aborts previous requests. Instances are independent. Abort alone is not proof that a late response cannot overwrite logged-out state.
- App derives serverPro from me.entitlements with a separate DEV override. useCampsites reloadKey follows effective isPro; its requests currently lack cancellation. Logout must clear server auth and allow existing gates/list reload to respond, without changing DEV override semantics.
- AppRoutes and some pages use independent useMe instances: inspect actual mount/navigation behavior before deciding how to reset auth. Do not add a separate useMe inside Toolbar.
- useLoginFlow posts /api/login-email, refetches me and navigates to pricing. Preserve this flow and redirect.
- Toolbar.test.jsx uses real IS/EN dictionaries and tests hero copy/events. New keys belong in translations.common.js following existing conventions.

## Implementation contract

1. Repeat the read-only auth/data-flow audit before edits. Trace App -> PageHeader -> Toolbar and all auth-derived UI remaining mounted after logout. Own the client handler in the existing app/hook layer; pass signed-in status, handler and pending state to presentation components. A small hook matching existing patterns is acceptable; no broad auth-store redesign.
2. Show a native button labelled `Skrá út` / `Log out` with decorative 🚪 only when a resolved user exists, never merely because isPro/devPro is true. Place it last, on a full-width bottom row with a subtle separator. Use i18n, accessible name, keyboard operation, visible focus and at least 44px mobile target height. Preserve other settings/disclosure controls.
3. POST /api/logout with credentials:include. Guard rapid duplicate clicks with an actual in-flight guard and disable/show translated pending state. No confirmation dialog. Non-2xx, malformed JSON or ok:false are failure. Existing ok:true including the endpoint note is success.
4. On confirmed success immediately establish normalized anonymous state: user:null, subscription:null, entitlements.pro:false, proUntil:null. Close Settings and stay on `/` or navigate there if necessary. Invalidate pre-logout /api/me requests so late responses cannot restore identity/entitlements. A narrowly scoped useMe reset/invalidation method is allowed; preserve refetchMe/refreshMe compatibility. Reconcile only consumers needed for this flow; no polling or cross-tab redesign.
5. Do not depend solely on successful follow-up me fetch to remove auth UI. Verification failure after successful logout must not restore old auth. Request failure preserves current auth, enables retry and shows translated feedback through existing toast patterns; do not falsely report success or expose raw errors/PII.
6. Verify paid-Pro logout updates existing gates and campsite list in production semantics. If stale campsite requests can retain authenticated results in this flow, fix only narrowly necessary invalidation and test it; broader gating/data changes require STOP. Preserve DEV override and unrelated preferences, campsite choice, language/theme/units, preview counters and checkout attribution. No new analytics event requested.

## Acceptance and validation

Add targeted tests using existing tools:

- IS/EN exact labels with real dictionaries; signed-in Free/Pro visibility; anonymous/unresolved and DEV-override-only absence; action last in Settings.
- Correct endpoint/method/credentials, no confirmation, pending guard and exactly one request for rapid clicks.
- Success clears user/subscription/server entitlements, closes Settings and leaves/navigates home; cover actual App -> PageHeader -> Toolbar wiring rather than callback mocks alone.
- Delayed pre-logout me response cannot restore auth. Any follow-up verification failure leaves anonymous state. Network rejection, non-2xx, malformed and ok:false responses preserve auth, display translated error and allow retry.
- Paid-Pro logout changes feature/list presentation without changing eligibility rules; cover any required campsite request invalidation. Stub the hook's actual parsing contract, not an assumed raw shape.
- Other controls and seasonal hero copy/events remain unchanged; login remains usable after logout.
- Browser-check mobile/desktop in both languages: bottom placement, touch target, no overflow, menu closure and clear signed-out UI. Mock session/cookie behavior to return anonymous after reload and label it mocked verification. Production revocation verification remains owner-controlled unless existing isolated API tests safely exercise it; no real account or production mutation.

Run targeted new tests, existing Toolbar and relevant App/auth/login/campsite suites, npm run lint and npm run build. Use bounded npm run test:run with explicit paths. Report exact commands/results, existing failures and browser/API limitations. Existing green tests alone do not prove new branches.

## STOP conditions and handoff

Stop and return to Ripley if implementation needs backend/cookie policy changes, broad shared-auth redesign, paid eligibility or checkout/webhook changes, forecast/scoring changes, new libraries or unrelated routes. Report adjacent security concerns without expanding scope. No production mutations, commit, push, deployment or GitHub closure.

Jonesy: append APPROVED or REVISE with reasoning to this file, without implementing. Scrutinize local reset/races, independent me consumers, campsite reload and error semantics. After approval Ripley creates approved-prompt-v1.md and sets CURRENT READY_FOR_CC. CC then follows README's READY_FOR_CC -> CC_IN_PROGRESS -> report -> CC_COMPLETE lifecycle. This discussion file never authorizes execution.

---

# #434 — Jonesy prompt review, Round 1

Date: 2026-10-06. Reviewer: Jonesy (technical peer reviewer; nothing implemented).
Verdict: **REVISE.** One blocking backend finding (R1) that the prompt's own STOP rule would trip on immediately, plus tightening of the race, consumer and test contract (R2–R11). The UI/handler design is otherwise sound.

## Limits of this review

Code reading only against the staged live files (Toolbar.jsx, PageHeader.jsx, Toolbar.test.jsx, App.jsx, AppRoutes.jsx, useMe.js, useCampsites.js, useLoginFlow.js, useToast.js, ToastHub.jsx, api/logout.js, api/_lib/setCookie.js, api/_lib/getMe.js, api/me.js, api/campsites.js, api/login-email.js, package.json). No shell: I ran no tests, lint or build. I did not observe production cookies or a browser. R1 is derived from code and standard cookie identity rules (name + domain + path), not from a production observation.

## Ripley's audit: what I confirmed

- Toolbar owns `settingsOpen` and `#toolbar-settings-panel`; no auth props (Toolbar.jsx L45, L127-165). Toolbar is imported only by PageHeader; PageHeader only by App.jsx (L349).
- No frontend logout handler or `/api/logout` reference exists anywhere in `src/`.
- `useMe` instances are independent; fetch aborts the previous request; `fetchMe` always sets loading true.
- `useCampsites` has no cancellation and reloads on `reloadKey` (L30-32); App passes `entitlements.isPro` as the key (App.jsx L83).
- `useLoginFlow` posts `/api/login-email`, refetches, navigates to `/pricing?email=...`.
- Toolbar.test.jsx uses the real `translations` dictionary.

## Findings

**R1 (BLOCKING, backend) — logout does not clear the production cookie.**
`setSessionCookie` (setCookie.js L9-15, L31) sets `Domain=.campcast.is` / `.eltumvedrid.is` on those hosts. `clearSessionCookie` in logout.js (L26-40) emits `Path=/; HttpOnly; SameSite=Lax; Max-Age=0` with **no Domain**. A Set-Cookie without Domain addresses a different (host-only) cookie, so on campcast.is / eltumvedrid.is the Domain-scoped `cc_session` stays in the browser. Consequences:
- Revoke succeeded: the session row is dead, so `/api/me` returns anonymous after reload. Harmless but the cookie lingers.
- Revoke failed (the `catch` path, `ok:true` + `note`): the session row is still valid and the cookie is still sent. The UI would show "logged out" and the next reload restores the login. That is a false success on a security action.
- On localhost, unknown hosts and Vercel preview hosts `cookieDomain` returns null, so the mismatch does not exist there. **Previews and local runs cannot detect this bug; it only manifests on the two production domains.**
- Ripley's audit says the endpoint "clears the HttpOnly cookie". That is only true for host-only cookies. Sessions created before the Domain logic may also be host-only, so both variants exist in the wild.
- There is no `api/logout.test.js` (grep: only getMe.test.js touches cookies), so the prompt's "existing isolated API tests" hedge is vacuous.

Recommendation: bring a minimal backend fix **into scope explicitly** and carve it out of the STOP rule, because the ticket's purpose (a working logout) cannot be met without it:
1. Export `clearSessionCookie(res, requestHost)` from setCookie.js, reusing `cookieDomain`, and have logout.js call it with `req.headers.host`.
2. Emit two Set-Cookie headers (array): one with the derived Domain (when non-null) and one host-only, both `Max-Age=0`, same Path/HttpOnly/SameSite as today. No change to cookie name, lifetime or attributes of login. Keep the response shape (`ok:true`, optional `note`) unchanged.
3. Add `api/logout.test.js` using the postgres-mock pattern of getMe.test.js: 405 on non-POST; revoke called with the sha256 of the cookie; Set-Cookie for campcast.is, eltumvedrid.is, localhost and an unknown host; revoke-throws path still clears the cookie and returns the note.
If Ripley or Róbert prefer no backend change, the prompt must say plainly that production logout is only a UI reset plus session revocation, and treat `note` as failure (R2). I would not approve that variant as "logout works".

**R2 — `ok:true` with `note` must be defined, not assumed success.**
The prompt says `ok:true` including the note is success. With R1 fixed, `note` means: cookie cleared in this browser, server-side row possibly still valid. Treating it as success is defensible (the token lives only in this HttpOnly cookie), but CC must not report it as "session revoked", and the report must list it as a known limitation. Without the R1 fix `note` is a still-logged-in state and must count as failure. State the choice in the prompt.

**R3 — Anonymous reset shape must match the real anonymous `/api/me`.**
api/me.js returns `ok:true, user:null, subscription:null, entitlements:{pro:false, proUntil:null}` for logged-out. useMe's own error path uses `ok:false`. The prompt's list omits `ok`. Specify `ok:true` for the reset (it is a resolved state, not an error), `loadingMe:false`, `meError:null`, and test deep-equality against the shape the hook parses from a mocked anonymous `/api/me` response, so the two cannot drift.

**R4 — Race design for `useMe` needs a concrete mechanism, and the tests must not rely on abort.**
Abort alone is insufficient (Ripley is right) and test mocks of `fetch` usually ignore `signal`. Require an epoch/generation ref bumped by the reset; every `fetchMe` captures the epoch at start and discards its `setData`, `setError` and `setLoading` if stale; the reset also aborts the current controller. Requirements:
- A request started **after** the reset (for example login then `refetchMe`) must apply normally; only pre-reset requests are invalidated.
- Tests: a deferred pre-logout `/api/me` resolving with a Pro payload after logout success leaves anonymous state; one whose body (`res.json()`) resolves late; a mocked fetch that ignores the signal; and login after logout works.
- Do not add a post-logout `/api/me` verification fetch. I recommend dropping it entirely: the reset is the source of truth, and a verification fetch can only add a path where a failed revoke flips the UI back. If Ripley keeps it, R3/R4 tests for "verification failure/mismatch leaves anonymous" are mandatory.
- Existing quirks (superseded fetch's `finally` setting loading false; aborted body parse writing the anonymous shape) are not to be fixed beyond what the epoch guard covers.

**R5 — Consumer scope can be narrowed; remove the navigation language.**
Toolbar is rendered only through App.jsx's home component, which AppRoutes mounts at `/` and `/about` (AppRoutes.jsx L178-179). The other `useMe` instances (PricingInfoRoute, Pricing, NorthernLightsLanding) live on other routes and mount fresh on navigation, so none is co-mounted with the Settings panel. Only App's single `useMe` needs the reset. Therefore: no navigation after logout (stay on `/` or `/about`; neither is auth-protected); delete "navigate there if necessary". Add a test that after logout `openLoginModal` does not prefill the previous email (`useLoginFlow` L9-11 reads `me?.user?.email` at open time). CC should grep for any localStorage keys derived from user id or email and report none or list them (I did not check).

**R6 — `useCampsites`: confirm and approve a narrow fix.**
The stale-response race is real: a Pro load in flight when `reloadKey` flips true to false can resolve after the free load and leave the Pro list (`load` has no latest-wins guard). Approve a request-id ref (latest wins) in `useCampsites`, not AbortController plumbing and nothing in `api/campsites.js`. Note `reloadKey` is a boolean: a logged-in Free user's logout does not change it, so no reload happens, correctly (both tiers receive the same limited list). The reload test therefore applies to Pro only. During the reload App's `showCampsitesGate` (App.jsx L85) briefly replaces the comparison section with "Loading campsites…"; that is existing behaviour and the browser check must not file it as a bug.

**R7 — "Preserve campsite choice" is not achievable for Pro-only sites.**
App.jsx L224-231 replaces a `siteId` missing from the list with `siteList[0].id` and persists it to `lastSite`. After a Pro logout a Pro-only `lastSite` falls back to the first free site, and re-login does not restore it. Do not change this (it is eligibility behaviour). Reword the contract to "preserved where still eligible", and add tests for both a Pro-only and a free-eligible `lastSite`.

**R8 — Test environment: DEV is true under Vitest.**
App computes `isPro = import.meta.env.DEV ? devPro || serverPro : serverPro` (App.jsx L75) and Toolbar renders `DevProToggle` only under DEV (L163). The repo's tests do not use `stubEnv` today (grep), Vitest is ^4.1.10, which supports `vi.stubEnv('DEV', false)`. Require: "production semantics" tests run with DEV stubbed false and CC reports how DEV was controlled; the DEV-override test runs with DEV true. Existing Toolbar tests mock `DevProToggle` to null, so "logout is last in Settings" would be vacuous there: the new order test must use a sentinel DevProToggle mock and assert the logout row follows it.

**R9 — Make the Toolbar/handler contract explicit.**
- Toolbar's header says "Pure UI". Handler stays out of Toolbar: new `useLogout({ resetMe, pushToast, t })` in the hook layer returns `{ logout, loggingOut }`; `logout` returns `Promise<boolean>` with an in-flight `useRef` guard (state alone allows double-fire).
- Props through PageHeader to Toolbar: `isSignedIn` (`!!me?.user`), `onLogout`, `loggingOut`. All default to absent/false so existing Toolbar and PageHeader tests, which render without them, still pass and show no button.
- Settings closure: Toolbar closes its own panel when `await onLogout()` resolves true; do not lift `settingsOpen`. State that mechanism, since the prompt only says "close Settings".
- After closure the logout button unmounts and focus drops to `body`; require focus to move to the Settings toggle button on success.

**R10 — Error and toast semantics.**
`ToastHub` renders only `toast.message`; `useToast` does not read `title` (ToastHub.jsx L24, useToast.js L18-24). Put the translated error in `message` and do not rely on `title`. Do not copy `useLoginFlow`'s `String(err?.message || err)` pattern: no raw errors. Add the translation keys to **both** dictionaries in translations.common.js (EN around L243/L549, IS around L836/L1126); keys such as label, pending and failure text. Success toast is optional; the UI change itself is the confirmation, and I suggest none. Ripley decides.

**R11 — Layout details.**
The panel is `flex flex-wrap items-center justify-end` inside a right-aligned column (Toolbar.jsx L100, L130). "Full-width bottom row" means a `basis-full`/`w-full` wrapper with `border-t` inside that panel; verify at 320px with no overflow. Use `min-h-[44px]` and the existing `focus-ring` class from index.css for visible focus. Visibility is strictly `!!me?.user`: it stays visible during `refetchMe` (data is kept while `loading` is true) and is absent when `/api/me` fails (500 returns `ok:false`, user null; existing behaviour).

## Adjacent concerns (report only, outside scope)

- Unverified email login (`/api/login-email` creates a session for any typed email, no verification) and admin identification by session email (see #433 R14): production exposure unverified. Logout is correct but does not prevent re-login as any email. CC reports it, does not fix it.
- Other open tabs keep their old state until reload; no cross-tab work (already out of scope).

## Validation additions

- The validation section's "existing isolated API tests" does not exist; the logout API test is new if R1 is in scope.
- Browser checks: Vercel preview hosts omit the Domain attribute, so a preview check cannot prove R1. Production cookie clearing remains **owner-controlled**: after deploy, on campcast.is and eltumvedrid.is, DevTools > Application > Cookies shows `cc_session` for the `.campcast.is` / `.eltumvedrid.is` domain before logout and gone after, and a reload shows the anonymous UI. CC labels any mocked check as mocked.
- The repo has `test:e2e` (Playwright); using it is optional and CC must say whether it ran.

## Required revisions before APPROVED

1. Decide R1 (recommended: minimal `clearSessionCookie` with Domain + host-only, plus `api/logout.test.js`, explicitly carved out of the STOP rule) and R2.
2. Fold R3, R4, R5 (drop navigation and verification fetch), R6, R7 into the Implementation contract.
3. Fold R8, R9, R10, R11 into the contract and test list.
4. Add the owner-controlled production cookie check to Validation.

Stage stays PROMPT_REVIEW. No execution authorization. Nothing was committed, pushed or deployed.

---

# #434 — Ripley revised prompt, Round 2

Date: 2026-10-06. Status: draft pending owner approval of the narrow backend scope below, then Jonesy review. NOT execution authorization. This round supersedes Round 1's conflicting scope/contract clauses; history above remains intact.

## Scope decision requiring owner approval

Ripley independently read api/_lib/setCookie.js and api/logout.js and confirmed R1: login supplies Domain=.campcast.is/.eltumvedrid.is while logout omits Domain. This is code evidence, not observed production behavior. The prior claim that logout clears all applicable cookies was incomplete.

Proposed explicit exception to the client-only and backend STOP rules: add exported clearSessionCookie(res, requestHost) to api/_lib/setCookie.js using its existing cookieDomain helper; call it from both success and catch paths in api/logout.js with req.headers.host. On recognized production domains emit a Set-Cookie array expiring both Domain-scoped and host-only cc_session cookies. On localhost/unknown hosts expire the host-only variant. Preserve existing logout Path=/, HttpOnly, SameSite=Lax, Max-Age=0 and existing Secure behavior, response shape and revocation SQL. Do not alter login's setter, cookie lifetime, host matching policy or other auth/payment behavior. Add isolated mocked API tests. No production DB operation or real user logout during implementation.

With that cookie fix, existing ok:true plus note counts as browser logout success, but must not be reported as successful server-side revocation. The possibly unrevoked server session remains an explicit limitation; do not redesign endpoint failure policy. Without owner approval of this exception, do not issue an approved implementation prompt claiming working production logout.

## Revised client contract (R3–R11)

- Keep handler in a new small useLogout({ resetMe, pushToast, t }) hook returning logout and loggingOut. logout returns Promise<boolean>, uses an in-flight ref guard, POST /api/logout with credentials:include, and accepts only HTTP success with parsed ok:true. Return false and show translated toast.message on network/non-2xx/malformed/ok:false failure; preserve auth and permit retry. No raw error text, confirmation or success toast.
- Wire App -> PageHeader -> Toolbar props isSignedIn=!!me?.user, onLogout, loggingOut, with absent/false defaults. Keep settingsOpen local to Toolbar. Await onLogout; on true close panel and focus the Settings toggle via ref. No navigation: the existing entrypoint is on / and /about, both public. No post-logout verification fetch, polling, cross-tab sync or global auth store.
- Add narrow resetMe to App's useMe instance. Reset exactly to {ok:true,user:null,subscription:null,entitlements:{pro:false,proUntil:null}}, loadingMe:false, meError:null. Keep refreshMe/refetchMe compatible. Use a generation/epoch ref incremented on reset plus abort; each fetch captures its generation, and stale responses/body parsing/catch/finally must not set data/error/loading. Requests after reset, including re-login refetch, apply normally. Do not broaden unrelated hook cleanup beyond this guard.
- Other useMe consumers mount on other routes, outside this Settings flow; no shared-consumer redesign. Verify this mounting assumption during CC audit. Opening login after logout must not prefill the prior email. Search for user/email-derived storage and report findings without indiscriminate clearing.
- Explicitly permit latest-wins request-id guarding in useCampsites so a stale Pro response cannot overwrite the post-logout Free load. Guard data/error/loading writes and unmount effects as necessary for this change; no API campsite changes or new AbortController plumbing. Free logout need not reload: effective tier remains Free. Existing loading gate during Pro-to-Free reload is expected behavior.
- Keep DEV override semantics. Production entitlement tests use vi.stubEnv('DEV', false) and restore env after tests; the separate DEV-only visibility test uses DEV true. Button visibility depends on user existence even while refetch is pending, not loadingMe or isPro. Initial unresolved/anonymous states hide it.
- Preserve preferences, preview counters and attribution. Preserve campsite choice where still eligible: existing App fallback replaces a Pro-only site with the first available Free site and persists lastSite. Do not change that fallback or promise to restore the old site on re-login.
- Add label/pending/failure keys to both translations.common.js dictionaries. Native logout button has decorative aria-hidden door icon, visible focus-ring and min-h-[44px]. Place its wrapper basis-full/w-full with border-t last in flex-wrap Settings, after DEV toggle. Confirm 320px layout without overflow. Preserve existing controls and hero analytics/copy.

## Required targeted tests and validation

Retain Round 1 tests and validation with these replacements/additions:

- New api/logout.test.js using existing postgres-mock patterns: non-POST 405, SHA256 token revocation, missing-cookie success, both production domains (including relevant subdomain hosts), localhost/unknown-host host-only expiry, and SQL throw path expiring cookies plus note. Assert Set-Cookie array contents and unchanged attributes/response. Do not contact Neon.
- Deep-equal resetMe state to normalized successful anonymous /api/me shape. Deferred fetch ignoring AbortSignal and deferred res.json resolving after reset must not restore Pro; stale rejection/finally cannot alter reset error/loading. A post-reset fetch works, including login after logout.
- Actual App/PageHeader/Toolbar success wiring, double-click guard, pending label, failure/retry toast.message with real IS/EN translations, menu closure and focus return. No verification fetch or navigation assertion expecting a redirect; confirm /about remains /about.
- Test order using a sentinel DevProToggle mock rather than the existing null mock. Cover signed-in Free/Pro, unresolved/anonymous, refetch with retained user, and DEV override without user.
- Pro-to-Free campsite reload with late Pro response discarded, Free logout unchanged tier, free-eligible lastSite preserved and Pro-only lastSite following existing fallback. Verify production DEV control is explicit and restored.
- Browser checks on mobile (including 320px) and desktop, both languages, mocked cookie/session state including anonymous after refresh. Report mock limits, exact commands and whether test:e2e ran. Run new targeted suites, existing Toolbar/relevant App/auth/login/campsite tests, lint and build. No live accounts/production mutation.
- Owner-controlled post-deploy check remains pending: on both campcast.is and eltumvedrid.is inspect Domain-scoped cc_session before logout, confirm applicable Domain and host-only cookies gone afterward, then reload and confirm anonymous UI. Localhost/Vercel previews cannot prove production Domain clearing. Mocked API/header tests do not prove a production deployment.

## Revised STOP and handoff

Only the specifically approved cookie-expiry helper/endpoint wiring/tests and narrow client request invalidation are exceptions. Stop for broader backend/cookie policy changes, shared auth architecture, paid eligibility/payment/checkout/webhook changes, forecast/scoring, dependencies or unrelated routes. Unverified email login/admin identity and other tabs' stale UI are report-only concerns. No commit, push, deployment, issue closure or production data changes.

Owner approval of the backend exception is pending. After approval Jonesy must review Round 2 and append APPROVED/REVISE here. Ripley creates approved-prompt-v1.md and sets READY_FOR_CC only after Jonesy APPROVED. CC then follows the canonical lifecycle. No implementation is currently authorized.

---

# #434 — Jonesy prompt review, Round 2

Date: 2026-10-06. Reviewer: Jonesy (technical peer reviewer; nothing implemented).
Verdict: **APPROVED with conditions C1–C8**, on the technical content only. The approval does not substitute for the owner's decision on the backend exception (C1).

## Limits

Code reading only against the live files re-checked this round (api/logout.js, api/_lib/setCookie.js, api/login-email.js, useMe.js, useCampsites.js, Toolbar.jsx, App.jsx, App.weatherFinderSelection.test.jsx, package.json). No shell: I ran no tests, lint or build. R1 remains code evidence, not an observed production cookie. Whether Róbert has approved the backend exception is not recorded in CURRENT.md or this file, and I did not treat "Review uppfært" as that approval.

## Round 1 findings: disposition

- R1 (cookie Domain): accepted into scope by Round 2 with the right shape (shared helper, both Domain and host-only expiry, login policy untouched). Adequate.
- R2 (`note`): resolved. `ok:true` + `note` is browser-logout success, never reported as server revocation. Adequate; C5 adds a test.
- R3, R4 (anonymous shape, epoch guard, no verification fetch): resolved as I specified, including post-reset requests applying normally and fetch mocks that ignore the signal.
- R5 (no navigation, narrowed consumers, no email prefill, storage search): resolved.
- R6, R7 (`useCampsites` latest-wins, Pro-only `lastSite` fallback): resolved and correctly scoped.
- R8–R11 (DEV stub, sentinel `DevProToggle`, hook/Toolbar contract, `message` not `title`, both dictionaries, 44px, 320px): resolved.

## Conditions (to be folded into approved-prompt-v1.md)

**C1 — Owner gate.** The approved prompt must record Róbert's explicit approval of the narrow backend exception (date and wording) before READY_FOR_CC. Without it the prompt may not claim working production logout (Round 2 already says this).

**C2 — `clearSessionCookie` and its tests, exact.**
- Always return a `Set-Cookie` **array**, including the single host-only variant on localhost/unknown hosts, so tests assert one type. Call `res.setHeader("Set-Cookie", [...])` once; a second `setHeader` call overwrites the first.
- Import with the explicit extension, `./_lib/setCookie.js`, as `login-email.js` does.
- Domain variants use exactly `.campcast.is` / `.eltumvedrid.is` from the existing `cookieDomain`; the host-only variant has no Domain attribute; every other attribute (Path=/, HttpOnly, SameSite=Lax, Max-Age=0, Secure rule) is identical to today's logout cookie.
- Host cases: apex and `www.` hosts for both domains, a host with a port, `localhost:3000`, uppercase host, missing `req.headers.host`, an unrelated host. Secure on and off by stubbing `NODE_ENV`, restored afterwards. Success path, missing-cookie path and SQL-throw path all use the helper.
- Do not touch `cookieDomain`'s matching (it uses substring `includes`). That is a report-only observation, not part of this ticket.

**C3 — Existing App tests mock `useMe` without `resetMe`.** App.weatherFinderSelection.test.jsx (L16-19, L64) mocks `useCampsites`, `useMe` (returns only `me` and `refetchMe`) and `PageHeader`. The new wiring tests must **not** reuse those three mocks: use real `useMe`, `useCampsites`, `PageHeader`, `Toolbar` and `useLogout`, stub `fetch`, and stub only heavy children as that file does. `App` must not throw when `resetMe` is absent from a mocked `useMe` (no call at render time). Run all `src/App.*.test.jsx` plus `AppRoutes` suites and report results.

**C4 — Focus.** Move focus to the Settings toggle after a successful logout only if the panel was still open when the promise resolved, so a user who has moved on is not pulled back.

**C5 — `note` and guard tests.** Add: `ok:true` + `note` follows the success path (anonymous state, no error toast); the in-flight ref is released in `finally`, so after a failure a second click sends a second request; during pending, repeated clicks send exactly one request.

**C6 — `resetMe` stability.** `resetMe` is a stable `useCallback` with `refetchMe`/`refreshMe` identities unchanged, so existing effect dependencies (`useLoginFlow`, App) do not re-fire.

**C7 — Report wording.** CC's report states "browser logout; server-side revocation unconfirmed when `note` is present" and lists the pending owner-controlled production cookie check. It does not claim production cookie clearing from mocked tests, previews or localhost.

**C8 — Unmount during pending.** If the user navigates away while the request is pending, the hook must not throw or toast on an unmounted App; CC checks and notes the behaviour. No new architecture for it.

## Result

Round 2 is technically approved once C1–C8 are in approved-prompt-v1.md. Stage stays PROMPT_REVIEW until Ripley creates the approved prompt and sets READY_FOR_CC. No execution authorization from this file. Nothing was committed, pushed or deployed.

---

## Ripley — owner approval and approved handoff

2026-10-06: Róbert explicitly replied **“Samþykkt”** after explanation and recommendation of the narrow cookie-expiry backend fix plus tests. C1 satisfied. Ripley consolidated Round 2 and all Jonesy conditions C1–C8 into approved-prompt-v1.md and set CURRENT.md to READY_FOR_CC. Historical pending-approval wording above describes earlier stages only. No application code changed; CC execution awaits owner's `Prompt approved` command.

---

# #434 — Ripley correction prompt, Round 3

2026-10-06. Discussion for Jonesy; NOT execution authorization. Following CC v1 and Jonesy result-review F1-F6, Ripley returns REVISE. This proposes a tests/report-only v2, preserving implemented behavior and immutable v1. Owner's existing narrow backend authorization is unchanged; no new backend work proposed.

## Scope and required work

Read CURRENT, approved-prompt-v1, cc-report and result-review before editing. Confirm actual wiring and fixture contracts read-only. Edit test files and CC report only (browser harness optional as below). Do not implement logout again or change production code. If new tests reveal a real defect, STOP and report it to Ripley before changing application/backend code.

1. F1: real App/useMe/useCampsites/PageHeader/Toolbar/useLogout wiring tests, stub only fetch/heavy unrelated children. Anonymous resolved me + DEV true + stored devPro true must hide logout; signed-in Free must show it; retained signed-in user during a held-open refetch must retain it. For the refetch case a minimal test-only hook harness may expose the real callback from the same App useMe instance; do not mock its state or add product entrypoints. Restore env/storage/mocks. Preserve Pro positive controls.
2. F2: anchor anonymous absence to completed me response and settled render, with an explicit deferred request or deterministic completion observation. Test unresolved absence separately if useful. An absence assertion made before response completion is insufficient. Browser anonymous check may be corrected/rerun or explicitly reported as an unanchored prior check; do not retain a claim that it proves resolved anonymity.
3. F3: production semantics (DEV false), stateful mocked session with Pro campsite list before success and Free list after. Assert exactly one additional campsite fetch for Pro logout, Free presentation/list and both lastSite outcomes: eligible selection persists, Pro-only selection falls back to first Free site and persists. Free-user logout has no additional campsite fetch. Use real App/hook flow and observable rendered picker/selection/storage; do not invent a product tier label solely for tests. Existing late-response hook tests remain required; no change to fallback behavior.
4. F4: drive reachable real App login entrypoint after logout and assert no previous email, if available; otherwise add useLoginFlow test for prefilled signed-in user then anonymous reopen with clearing as App performs. Report which was tested. No new product login entrypoint or auth rewrite.
5. F5: run all Pricing*.test.jsx, PricingInfo*.test.jsx, NorthernLightsLanding*.test.jsx and Subscribe*.test.jsx suites. Run final combined new logout/backend/hook/Toolbar/CampsitePicker tests plus all App.*.test.jsx and AppRoutes suites after additions, or full npm run test:run. Resolve paths with rg --files; report exact commands/file/test counts accurately. Run lint (test changes), and report prior build as CC v1 evidence unless rerun; no application change requires another build by itself.
6. F6: correct screenshot/door-glyph claim after inspecting the referenced evidence, or identify the actual screenshot with failure. Append a dated v2 section to cc-report preserving execution history; correct misleading original wording explicitly. Update coverage limitations to reflect exactly what ran. Describe pending-unmount behavior based on code/tests without unsupported claims.

## Acceptance, boundaries and lifecycle

All F1-F6 addressed with non-vacuous tests and accurate report; new tests plus relevant shared-hook consumer suites pass. Disclose failures/limits, no fabricated production/browser verification. Pending owner production-cookie check on both domains and “browser logout; server-side revocation unconfirmed when note is present” remain explicit. No commit, push, deployment, Neon/live-user mutation, issue closure, libraries or unrelated work. No production-code changes without returning to Ripley after a discovered defect.

Jonesy reviews this Round 3 and appends APPROVED/REVISE. After APPROVED Ripley creates approved-prompt-v2.md; CURRENT READY_FOR_CC points to v2. CC starts only on owner's Prompt approved, sets CC_IN_PROGRESS, completes correction/report, populates report path and sets CC_COMPLETE. Jonesy then appends result-review Round 2; Ripley reassesses. Do not execute this discussion file or silently overwrite v1/history.

---

# #434 — Jonesy prompt review, Round 3 (tests/report correction, for v2)

Date: 2026-10-06. Reviewer: Jonesy (technical peer reviewer; nothing implemented).
Verdict: **APPROVED with conditions D1–D8.** The Round 3 scope is right: tests and report only, v1 immutable, STOP-and-return if a new test exposes a real defect. The conditions below close places where a test could still pass without proving anything.

## Limits

Code reading only (App.jsx, Toolbar.jsx, DevProToggle.jsx, useLoginFlow.js, useMe.js, useCampsites.js, the v1 wiring test and the staged evidence). No shell: I ran no tests, lint or build and did not rerun Ripley's 5-file/42-test run. I did not read `CampsitePicker.jsx` or `useLocalStorageState.js` this round.

## Conditions (to be folded into approved-prompt-v2.md)

**D1 — The DEV-override test needs `MODE`, not only `DEV`.**
`DevProToggle` returns null unless `import.meta.env.MODE === "development"` (DevProToggle.jsx L5), and Vitest's mode is `"test"`. With only `vi.stubEnv("DEV", true)` the toggle never renders and nothing shows that the stored `devPro` is effective. For F1's "anonymous + DEV true + stored `devPro` true → no logout row", stub **both** `DEV` true and `MODE` `"development"` (restored in `afterEach`, together with the stored `devPro`), and use the real toggle (`aria-pressed="true"`, "Dev Pro: ON") as the positive control that the override is active. The absence assertion then also needs D2's anchor.

**D2 — Deterministic anchor for "resolved anonymous" and for the held refetch.**
The harness Round 3 allows is the right tool. Specify it: `vi.mock("./hooks/useMe", ...)` wraps the real `useMe` through `importActual`, returns the **exact** object the real hook returned (no overrides, no state mocking), and records it in a module-level ref. Use it for two things:
- F1 retained-user case: call the recorded real `refetchMe` inside `act` with a second `/api/me` held open; assert `loadingMe` is true, `me.user` is still present and the logout row is visible; then release it.
- F2 anchor: assert the anonymous absence only after the recorded state shows `loadingMe === false` and `me !== null`. Also keep an unresolved-state check (held request, row absent) as a separate test.
Pair every absence assertion with a positive control that uses the same wait on a signed-in session (row present), so the wait is proven sufficient.

**D3 — F3 counting baseline and negative assertions.**
App fetches `/api/campsites` at mount (`reloadKey` false), again when Pro resolves (`reloadKey` true) and again at logout (false). Record the count only after the Pro state has settled (Pro-only site visible), then assert exactly **+1** after logout has settled. For the Free user, assert **no** additional call, but only after a positive anchor (row gone / panel closed, then a flush such as `await act(async () => {})` plus one macrotask tick); a negative count taken before the anchor is vacuous. The stateful mock flips its session when `/api/logout` succeeds and the campsites handler reads it. `DEV` false. `lastSite`: assert the persisted JSON value in storage (eligible stays, Pro-only becomes the first Free site) and the rendered selection through whatever the existing picker exposes (CC confirms what that is; do not add a product label for the test).

**D4 — F4: the hook-level test must not be tautological.**
`openLoginModal` re-derives the email from `me?.user?.email || ""` on every open (useLoginFlow.js L8-11), so the App's `setLoginEmail("")` after logout is belt-and-braces. The regression the test guards is a stale `me` in `openLoginModal`. Required form: render `useLoginFlow` with a signed-in `me` (open → prefilled), close it, rerender with `me.user` null, reopen → empty, **without** the test calling `setLoginEmail("")` itself. Add a case where typed, unsubmitted text is replaced on reopen. An App-level version is acceptable only if a real entrypoint is reachable with no broader un-mocking than fetch (the v1 wiring test mocks `useCheckoutFlow`, and `?upgrade=1` is consumed on mount); the report states which form was used.

**D5 — F5 reporting.**
Exact commands, per-file test counts and totals; list any pre-existing failure by name. If the full `npm run test:run` is used instead of bounded paths, report its file/test totals. Lint covers the new test files. The v1 build result stays attributed to CC v1 unless rerun.

**D6 — Prove "no production change" in v2.**
CC lists every file touched in v2 and shows, with `git status --short` and a `git diff --stat` limited to non-test paths, that no file under `api/`, `src/` (non-test), `src/i18n/` or config changed. The recording wrapper in D2 lives inside the test file. A temporary mutation check (for example breaking `isSignedIn` to confirm F1 fails) touches a production file, so it is allowed only if v2 says so explicitly, and then the revert must be verified by an empty diff and reported; otherwise CC states that it was not done and relies on D2/D3 positive controls.

**D7 — Report v2 section.**
Append a dated v2 section and keep the v1 text. Correct the door-glyph claim after viewing the evidence: `mobile-320-en-signed-in-panel.png` shows the glyph rendered correctly (I viewed it), so either name the screenshot where it actually fails or delete the claim. Update the coverage limitations to match exactly what ran. For unmount, describe what the code and tests show: failure after unmount is tested (no throw, no toast); success after unmount still calls the stale instance's `resetMe`, which is untested and harmless.

**D8 — Browser anonymous check.**
Either anchor it (wait for the `/api/me` response with `page.waitForResponse`, let rendering settle, and keep the signed-in positive control) and rerun, or report the prior check as unanchored and withdraw any claim that it proves resolved anonymity. Rerunning needs a preview server on `localhost:4173` and stays mocked and labelled as such.

## Result

Round 3 is technically approved once D1–D8 are in approved-prompt-v2.md. Stage stays PROMPT_REVIEW until Ripley creates v2 and sets READY_FOR_CC; CC starts only on the owner's `Prompt approved`. No execution authorization from this file. Nothing was committed, pushed or deployed; the owner-controlled production cookie check on campcast.is and eltumvedrid.is remains pending.

---

## Ripley — approved correction handoff

2026-10-06: Created approved-prompt-v2.md consolidating Round 3 and D1–D8; CURRENT set READY_FOR_CC. D6 evidence explicitly compares v2 start/end because v1 implementation is uncommitted and an empty HEAD diff would erase existing work, not prove preservation. No temporary production mutation check authorized. v1 remains immutable; no test/application changes in this handoff. CC awaits owner's Prompt approved.
