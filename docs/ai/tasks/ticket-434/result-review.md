# #434 — Jonesy result review

## Round 1 — 2026-10-06

Reviewer: Jonesy (technical peer reviewer; nothing implemented, nothing committed, pushed or deployed).
Inputs: `approved-prompt-v1.md`, `cc-report.md`, CURRENT.md (CC_COMPLETE), and the live files listed below.

**Verdict: REVISE — test-and-report micro-pass only. I found no defect in the production code and expect no production-code change.** The delivered behaviour is correct as far as I can read it; what is missing are tests the approved prompt made mandatory, which CC's own report lists as "not written".

### Limits of this review

- Code reading and staged evidence only. I have no shell: I did **not** run tests, lint or build, and CC's figures (146 tests, 42 browser checks, lint/build exit 0) are unverified by me. I viewed one of the staged screenshots and read `results.json` and `logout-check.mjs`; I did not rerun the browser script.
- Production cookie clearing on campcast.is / eltumvedrid.is is unverified and remains the owner-controlled check. Nothing in this review proves it.
- Git state not inspected (no shell). Scope of change was checked by file mtimes: in `api/` only `logout.js`, `logout.test.js`, `_lib/setCookie.js` changed after the approved prompt; in `src/` only the files named in CC's report (App.jsx, PageHeader, Toolbar, useMe, useCampsites, useLogout, translations.common.js and the five new test files). `scripts/` and the repo root were not scanned.

### What I verified against live source (PASS)

- **Backend (approved exception).** `clearSessionCookie(res, requestHost)` is exported from `setCookie.js`, uses the unchanged `cookieDomain`, and always calls `res.setHeader("Set-Cookie", array)` once: Domain-scoped plus host-only variants on the two production domains, host-only on localhost/unknown/missing host. Attributes are `Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, `Secure` only when `NODE_ENV === "production"`, exactly as before. `setSessionCookie`, `cookieDomain`, the revocation SQL, the 405 path and both response shapes are unchanged. `logout.js` imports `./_lib/setCookie.js` with the explicit extension and calls the helper in both the success and the catch path. The `req.headers?.host` optional chaining (disclosed deviation 1) is harmless.
- **`api/logout.test.js`** covers 405 with no DB or cookie touch, SHA-256 revocation, URL-decoded token, no-cookie success, SQL-throw note path, single `setHeader` call with an array, the host matrix (apex/www both domains, port, uppercase, localhost, 127.0.0.1, unrelated host, missing host) and Secure on/off with `vi.stubEnv` restored in `afterEach`. This meets C2 in full.
- **`useMe`.** Epoch ref bumped by `resetMe`; every fetch captures the epoch and discards stale data, error and loading after the body, in the catch and in the `finally`; `resetMe` aborts the in-flight request and sets exactly `{ok:true,user:null,subscription:null,entitlements:{pro:false,proUntil:null}}`, `loadingMe:false`, `meError:null`. It is a stable `useCallback`; `refetchMe`/`refreshMe` identities are unchanged; post-reset requests apply normally. The tests use a fetch that ignores the signal, a deferred body and a stale rejection (C6 and the Round 1 R4 requirement met).
- **`useCampsites`.** Request-id latest-wins guard around data, error and loading, plus unmount invalidation (also correct under StrictMode's double effect run). No API or AbortController change. Hook-level tests cover a late Pro response, a late failure and unmount.
- **`useLogout`.** In-flight ref guard released in `finally`; success needs HTTP 2xx and parsed `ok:true`; the `note` variant is success; every failure returns false with a translated `message` and no raw error text; no confirmation and no success toast; no toast after unmount. The tests cover each failure type, retry sending a second request, single request while pending, and `note` success (C5 met at hook level).
- **Toolbar / PageHeader / App wiring.** New props default to absent/false; the logout row is the last child of the panel, after the DEV toggle, in a `basis-full w-full ... border-t` wrapper; native button, `aria-hidden` door icon, `focus-ring`, `min-h-[44px]`. The panel closes and focus returns to the Settings toggle only when the panel was still open at resolution, tracked with a ref (C4 met; unit-tested). `settingsOpen` stays local. `App` passes `isSignedIn={!!me?.user}`, never `isPro`, `devPro` or `loadingMe`. `resetMe` is not called at render. No navigation and no verification fetch. `handleLogout` clears `loginEmail` on success. `/about` retention is tested (C3: the wiring test uses real `useMe`, `useCampsites`, `PageHeader`, `Toolbar` and `useLogout` and does not reuse the old auth mocks).
- **Translations.** `logoutLabel`, `loggingOutLabel`, `logoutFailed` exist in both dictionaries (EN L550-552, IS L1130-1132); IS "Skrá út", EN "Log out".
- **Browser evidence.** `results.json` has 42 entries, all `pass:true`: 9 per viewport-language scenario across mobile-320 and desktop-1280 in IS and EN, plus 3 failure-path checks per desktop language. Placement, 44 px target, 0 px overflow, one POST, panel closure, focus return, anonymous after logout and no `/api/me` refetch are covered. The script mocks `/api/*`, aborts external requests and states that it ran against the production build, as the report says.
- **Report wording.** "Browser logout; server-side revocation unconfirmed when note is present" and the pending owner-controlled production cookie check are both stated, and the report does not claim production cookie clearing (C7 met).

### Findings (REVISE items)

**F1 — App-level visibility derivation is untested (approved prompt tests 4 and 5).**
The "never because of isPro/devPro" rule lives in one line of `App.jsx` (`isSignedIn={!!me?.user}`). The Toolbar tests only pass `isSignedIn` directly, so a regression such as `|| entitlements.isPro` or `|| devPro` would pass every new test. Add, through the real App wiring: (a) anonymous `/api/me` with `DEV` stubbed true and `devPro` stored true → no logout row; (b) signed-in **Free** user (user present, `entitlements.pro:false`) → row shown; (c) retained user during a pending refetch → row stays visible (a second `/api/me` held open, user retained). Pro is already covered. Restore the env and storage after each test.

**F2 — The "anonymous" absence checks can pass before `/api/me` has resolved.**
In `App.logoutWiring.test.jsx` (anonymous case, L140-148) the Settings panel is opened immediately and absence is asserted at once; an unresolved user also hides the row, so this check cannot fail for the bug it names. The browser script has the same shape (anonymous scenario in `logout-check.mjs`). Anchor both to a resolved state: wait until `/api/me` has been answered and rendering has settled, or use the signed-in render as a positive control in the same test (same wait, row present for a user, absent for anonymous). The unit test is required; the browser script fix is optional and may be reported rather than rerun if CC does not repeat the browser run.

**F3 — Pro-to-Free reload, tier and `lastSite` are not covered at App level (approved prompt test 6).**
CC discloses this. The wiring fixture always returns the Pro list with both sites (`installFetch`, L56-66), so nothing observes the effect of logout on the list. Add a wiring test whose `/api/campsites` response depends on the cookie state (Pro list before logout, Free list after): after logout the list and tier become Free (one extra `/api/campsites` request); a **free-eligible** `lastSite` is kept; a **Pro-only** `lastSite` falls back to the first Free site and is persisted (existing App fallback, not to be changed); and a signed-in **Free** user's logout sends no second `/api/campsites` request. Production semantics with `DEV` stubbed false and restored.

**F4 — "No old email on login after logout" is untested (approved prompt test 4).**
The logic is in place (`setLoginEmail("")` on success; `openLoginModal` prefills from `me.user`), but no test opens the login modal after logout. Add one at App level if a real trigger is reachable, otherwise a `useLoginFlow` hook test that opens the modal with a user (prefilled), then with `me.user` null and `setLoginEmail("")` as `handleLogout` does (empty). State in the report which of the two was done.

**F5 — Other `useMe` consumers' suites were not run.**
`useMe` changed (additive, but it is shared). `Pricing.jsx` and `NorthernLightsLanding.jsx` consume it, and `AppRoutes.jsx` too; only the AppRoutes suites are in CC's run list. Run `src/pages/Pricing*.test.jsx`, `src/pages/PricingInfo*.test.jsx`, `src/pages/NorthernLightsLanding*.test.jsx` and `src/pages/Subscribe*.test.jsx`, and rerun the final combined set after the new tests are added (the reported 146-test combined run predates the `/about` case, as the report itself notes). Report exact commands and results. A single unbounded `npm run test:run` is an acceptable substitute if CC prefers it.

**F6 — Report inaccuracy about the door glyph.**
The report says the 🚪 renders as a box in the screenshots because the headless browser has no emoji font. The staged `mobile-320-en-signed-in-panel.png` shows the door glyph rendered correctly next to "Log out" (the row is full width with its top border, as intended). Correct the sentence or name the screenshot where the glyph really fails.

### Notes (not required for PASS)

- `disabled={loggingOut}` on the focused button can drop keyboard focus in some browsers while the request is pending; `aria-disabled` would avoid it. Not a scope item; optional.
- C8 asked CC to report unmount behaviour. The tests cover a failure after unmount (no throw, no toast). A success after unmount still calls the stale instance's `resetMe`, which is harmless. One sentence in the report is enough.
- `outputs/ticket-434-browser-evidence/` is new, untracked evidence: whether it is committed is the owner's decision.
- Still report-only and unchanged, as the approved prompt says: unverified email login and admin identity, substring matching in `cookieDomain`, other tabs' stale UI.

### Required for PASS

1. Tests F1–F4 added (test files only; a production-code change is out of scope unless a new test exposes a real defect, in which case CC stops and reports before changing it).
2. F5 suites run and reported, with exact commands.
3. F6 sentence corrected; report updated with the new tests, commands and results.
4. Same boundaries as before: no commit, push, deployment, Neon call, production mutation or GitHub closure; owner-controlled production cookie check still pending.

Stage: RESULT_REVIEW. Ripley decides the final assessment after the revision.

---

## Ripley final assessment — 2026-10-06

Verdict: **REVISE**, limited to tests and report. I read approved-prompt-v1.md, CC's report, Jonesy's review, the relevant cookie/hook/Toolbar diffs and App.logoutWiring.test.jsx. I independently ran `npx vitest run api/logout.test.js src/hooks/useMe.reset.test.jsx src/hooks/useCampsites.latestWins.test.jsx src/hooks/useLogout.test.jsx src/App.logoutWiring.test.jsx`: **5 files, 42 tests passed**, exit 0. The first sandbox attempt failed loading Vitest config because esbuild lacked directory access; the authorized retry outside the sandbox passed. I did not independently run lint/build/browser checks; those results remain attributed to CC.

Jonesy's F1-F4 match mandatory gaps visible in the wiring fixture/tests and disclosed in CC's report. Existing passing tests do not establish those branches. F5 broadens verification appropriately for the changed shared useMe hook; F6 requires accurate evidence wording. No production-code defect is established by this assessment. Production cookie verification remains pending and owner-controlled.

Round 3 correction prompt is appended to prompt-review.md for Jonesy review. approved-prompt-v1.md remains immutable; no CC re-execution authorization yet. CURRENT moves to PROMPT_REVIEW for the mandatory full review loop before approved-prompt-v2.md can be created, rather than pointing READY_FOR_CC at the already-executed v1. No application/test code changed in this assessment, no commit/push/deployment/production mutation/issue closure.

---

## Round 2 — 2026-10-06 (after approved-prompt-v2.md)

Reviewer: Jonesy (technical peer reviewer; nothing implemented, nothing committed, pushed or deployed).
Inputs: `approved-prompt-v2.md`, the v2 section of `cc-report.md`, CURRENT.md (CC_COMPLETE), and the live files listed below.

**Verdict: PASS.** F1–F6 and D1–D8 are met. I found no production-code change in v2 and no defect in the new tests that would make them pass without proving their claim.

### Limits of this review

- Code reading and staged evidence only. I have no shell: I did **not** run the tests, lint, build or the browser script. CC's figures (full suite 165 files / 2483 tests, 20-file explicit set 242 tests, 13 wiring tests, lint exit 0, browser 46/46) are unverified by me; Ripley's earlier 42-test run was for the v1 test set, not v2.
- No mutation check was run (v2 forbids it), so "these tests would fail if the guarded line broke" is my reading of the code, not an observed failure.
- Production cookie clearing on campcast.is and eltumvedrid.is is unverified and remains the owner-controlled check.
- The git state was not inspected; scope was checked by file modification times and file contents.

### Verification against the live files

**No production change during v2 (D6).** I did not have hashes; I compared device modification times with the values I recorded when I reviewed v1. All nine production files are unchanged since then: `api/_lib/setCookie.js` (1791305860437), `api/logout.js` (1791305872402), `src/hooks/useMe.js` (1791305957650), `src/hooks/useCampsites.js` (1791305962122), `src/hooks/useLogout.js` (1791305982302), `src/components/Toolbar.jsx` (1791306006939), `src/components/PageHeader.jsx` (1791306012286), `src/App.jsx` (1791306025157), `src/i18n/translations.common.js` (1791305990009). `useLoginFlow.js` and `CampsitePicker.jsx` are also untouched. The v1 test files (`api/logout.test.js`, `useMe.reset`, `useCampsites.latestWins`, `useLogout`, `Toolbar.logout`) keep their v1 mtimes; only `App.logoutWiring.test.jsx` (rewritten) and `useLoginFlow.prefill.test.jsx` (new) changed in `src/`. This corroborates CC's hash claim and its statement that no temporary production mutation was made. Modification times are weaker evidence than hashes; they are consistent, not a proof.

**F1 / D1 / D2 (`App.logoutWiring.test.jsx`, 13 tests).**
- The instrumentation is exactly what v2 allows: `vi.mock("./hooks/useMe")` calls `importActual`, calls the real hook, records the returned object in a `vi.hoisted` ref and returns that same object. No state or override mocking.
- Anonymous + stored `devPro=true` + `DEV=true` + `MODE=development`: the real toggle is found as "Dev Pro: ON" with `aria-pressed="true"` (positive proof that the override is active), after `waitResolved()` (recorded `loadingMe===false` and `me!==null`), and the logout row is absent. I read the production line (`isSignedIn={!!me?.user}`) against this test: a regression to `|| devPro` or `|| isPro` would show the row here and fail it.
- Signed-in Free user shows the row under the same wait; the signed-in Pro test is the paired positive control for the anonymous absence test; a held `/api/me` gives a separate unresolved-state test.
- Retained user: the recorded real `refetchMe` is called inside `act` with the second `/api/me` held open; `loadingMe` is true, the user is retained and the row stays visible before and after release.
- `DEV` and `MODE` are stubbed in `beforeEach`/the DEV test and restored with `vi.unstubAllEnvs()` in `afterEach`; storage is cleared in `beforeEach`.

**F3 / D3 (Pro-to-Free).** The fake server is stateful: `/api/logout` flips the session and `/api/campsites` answers from it. The baseline is taken after `waitResolved`, the Pro-only site is visible and one macrotask tick has passed; after logout the test waits for the panel to close and the Alpha trigger, flushes, and asserts exactly baseline + 1, persisted `lastSite` `"site-a"` and no "Beta Camp" option. The eligible `lastSite` case stays `"site-a"`. The Free-user case asserts no extra campsite request after the panel-closed anchor, a flush and a macrotask tick. I checked the picker interface: `CampsitePicker` renders the selected name in a trigger button and the options as buttons in a dialog, so the role-based queries are meaningful.

**F4 / D4 (`useLoginFlow.prefill.test.jsx`).** Hook-level form, as v2 allows. The real hook is rendered with a signed-in `me`, opened (prefilled), closed, rerendered with `me.user` null and reopened (empty). The test never calls `setLoginEmail("")`; the typed-unsent case is replaced on reopen. This guards the stale-`me` path in `openLoginModal` as intended.

**F6 / D7 (report).** The door-glyph claim is withdrawn with the correct reason (the glyph renders in `mobile-320-en-signed-in-panel.png`, which I had viewed). The v2 section preserves the v1 history, states what ran, records that no temporary production mutation check was performed, and describes unmount accurately (failure after unmount tested; success after unmount calls the stale `resetMe`, untested, no defect observed). The status wording "browser logout; server-side revocation unconfirmed when note is present" and the pending production-cookie check are both explicit.

**F5 / D5 (verification list).** The explicit 20-file list covers all of `Subscribe.renewal`, `PricingInfo` (2), `Pricing.*` (5), `NorthernLightsLanding.*` (4) plus the logout/hook/Toolbar/wiring files, matching the files on disk; the full-suite run covers `AppRoutes`, every `App.*` suite and `CampsitePicker`. Commands, per-file scope and totals are reported, and the single lint failure (an unused parameter in CC's own test) and its fix are disclosed.

**F2 / D8 (browser).** `results.json` has 46 entries, all `pass:true`: the 42 from v1 plus four "anonymous anchor: /api/me answered anonymous" checks. The script registers `page.waitForResponse` for `/api/me` before navigation and records whether the answer was anonymous or signed in. The report says the v1 anonymous check was unanchored and does not rely on it.

### Minor notes (not required for PASS)

1. The browser anchor is at the network response, not at the rendered state; the unit anchor (`loadingMe===false` and `me!==null`) is the decisive one and is in place.
2. The "no Pro-only options after logout" assertion has no matching pre-logout check that the Beta option exists in the open dialog. The persisted `lastSite` assertion and the selected trigger carry the real proof, so I do not require it.
3. The full-suite and 20-file runs appear to predate the one-parameter lint fix in the wiring test, which was then rerun alone (13/13). The change is trivial, so I consider it covered.
4. F4 is hook-level only; no App-level login trigger was exercised. Allowed by v2.

### Still open (not blockers, not CC's to close)

- **Owner-controlled production check:** on campcast.is and eltumvedrid.is, confirm the Domain-scoped `cc_session` exists before logout and that the Domain and host-only variants are gone after it, then reload and confirm the anonymous UI. Local, preview and mocked checks cannot show this (Vercel preview hosts do not receive a Domain attribute at all).
- **Server-side revocation** is unconfirmed whenever the response carries `note` (revocation SQL failed); by design the endpoint still returns ok.
- **Report-only observations, unchanged:** unverified email login and admin identity, substring matching in `cookieDomain`, other tabs' stale UI.
- **Commit is Róbert's decision.** Everything from v1 and v2 is uncommitted: nine production files (the eight modified plus the new `src/hooks/useLogout.js`), the seven test files (`api/logout.test.js`, `useMe.reset`, `useCampsites.latestWins`, `useLogout`, `Toolbar.logout`, `App.logoutWiring`, `useLoginFlow.prefill`), the `docs/ai/tasks/ticket-434/` files, and the untracked `outputs/ticket-434-browser-evidence/` evidence directory (whether to commit the evidence is also his call). I run no git actions.

Stage: RESULT_REVIEW. Ripley makes the final assessment and closure decision.

---

## Ripley final assessment after v2 — 2026-10-06

Verdict: **PASS** for the local implementation and required correction. I reviewed CURRENT, the v2 execution report, Jonesy's Round 2 PASS, the revised App wiring cases and the real useLoginFlow prefill tests against approved v2. The previously missing resolved-user/DEV/refetch, Pro-to-Free/list/lastSite and login-prefill tests are now present with meaningful completion anchors and positive controls. The screenshot claim is explicitly withdrawn; production/browser limits remain stated. No further local implementation work is required by the approved prompt.

Independent validation: `npx vitest run api/logout.test.js src/hooks/useMe.reset.test.jsx src/hooks/useCampsites.latestWins.test.jsx src/hooks/useLogout.test.jsx src/hooks/useLoginFlow.prefill.test.jsx src/components/Toolbar.logout.test.jsx src/App.logoutWiring.test.jsx` — **7 files, 62 tests passed**, exit 0. Authorized outside-sandbox execution used because the earlier sandbox attempt could not load Vitest through esbuild. This run includes the revised App tests and login-prefill tests as well as backend cookie, stale-request, failure/retry and Toolbar checks.

CC reports full suite **165 files / 2483 tests**, explicit set **20 files / 242 tests**, lint success, and mocked production-preview browser checks **46/46**. I did not independently rerun those broader commands or the v1 build; they remain attributed to CC. CC's v2 unchanged-source hashes and Jonesy's unchanged-mtime comparison support tests/report-only scope; I checked current git status but did not reconstruct the historical start snapshot. All changes remain uncommitted.

Owner-controlled production cookie verification on campcast.is and eltumvedrid.is remains pending after deployment. Local PASS does not prove deployed cookie behavior. Browser logout; server-side revocation unconfirmed when note is present. The other stated report-only observations remain outside scope.

CURRENT.md set CLOSED. No commit, push, deployment, live-account/Neon/production mutation or GitHub issue closure. Owner controls review, commit/push, production verification and any later explicit issue-closure instruction.
