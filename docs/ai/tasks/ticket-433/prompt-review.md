# #433 — Ripley initial prompt, Round 1

Date: 2026-10-05. Status: discussion for Jonesy; NOT execution authorization.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/433
Title: Admin: Gefa notanda tímabundinn Pro-aðgang án áskriftar

## Objective and scope

Give an existing registered user expiring, revocable manual Pro access without creating a Paddle subscription, pass purchase, transaction, revenue or conversion. Preserve every existing paid entitlement. User selected #433 after #420 CLOSED. Working tree was clean at preflight.

The issue explicitly requires server-verified access and permits an admin script for MVP. This is the narrow ticket-specific exception to the generic client-only rule: local SQL migration, restricted operator script and the existing backend entitlement resolver. No new public grant endpoint, dashboard, libraries or permission framework. Do not apply production SQL or grant real users access during implementation.

## Read-only audit findings (Ripley)

- api/_lib/getMe.js validates cc_session against user_session, loads user_subscription and user_pass. Active subscriptions require future current_period_end and status active/trialing/past_due/canceled/cancelled. Active passes require status active and future access_end. These existing rules remain unchanged.
- Thus the issue's subscription-only description is stale: paid passes must also keep working, including refund/expiry behavior.
- api/campsites.js already uses getMeFromRequest and returns private/no-store tier-specific lists. App.jsx consumes entitlements.pro, features.js consumes isPro; reuse this path.
- api/me.js returns resolver state but currently lacks explicit no-store headers. src/hooks/useMe.js normalizes away extra entitlement fields and only fetches on mount or explicit refetch; open-tab expiry needs handling.
- src/pages/Success.jsx currently treats any entitlements.pro as checkout success and emits checkout_completed. A manual grant must not trigger this path or false payment UI.
- api/admin.js getProSummary counts subscriptions and paid passes and derives conversionRate; manual grants must not inflate these existing commercial metrics. Revenue queries remain independent.
- src/lib/analytics.js is a small central GA4 wrapper, without an existing access-source property. Add bounded source context, never email/ID/reason.
- docs/payments/sql/user_pass.sql is a checked-in, manually applied schema precedent. Actual DB env is POSTGRES_URL. Do not read or print secrets. user_pass requires Paddle transaction/price fields and is unsuitable for manual grants.
- Read Pricing.jsx, Top5Leaderboard.jsx, Success.jsx, AppRoutes.jsx, useCheckoutFlow.js and billing portal handling before editing to identify subscription claims and paid-flow interactions. Do not mistake old subscription rows for current paid eligibility.

## Proposed implementation contract

### 1. Separate manual grant storage and operator entrypoint

Use a small dedicated user_pro_grant table, not app_user.tier or synthetic user_subscription/user_pass rows. Checked-in SQL should contain FK to existing app_user, UUID grant ID, granted_at and expires_at timestamptz, source constrained to admin, bounded nonempty reason, operator audit identity, revoked_at and revocation actor. Expiry is required and must follow grant time. Preserve revoked/expired rows as audit history. Add an appropriate user/expiry lookup index. No cleanup job required.

Provide a documented Node operator script (existing postgres library) with explicit lookup, grant, list and revoke operations. This is a privileged server-side operation requiring DB credentials; possession of browser state or an email address alone is never authority. No credentials bundled into frontend, no public mutation route. Resolve an existing user by exact normalized email or UUID; reject ambiguous/missing users, malformed UUID/date, past expiry and blank/oversized reason. Never create a user. Require explicit timezone in timestamp; document UTC examples and exclusive expiry. Lookup/list preview identifies target before grant; dry-run is default, explicit apply flag writes. Use tagged parameterized SQL, safely close connections and sanitize errors. Revoke a specific grant id, idempotently, without affecting paid access; list all currently active grants so overlapping grants are visible. Record actor from the trusted operator context/config, not a public request. No secrets or personal data in analytics/logs; operator output may show only information needed to confirm target and audit action.

### 2. One authoritative entitlement resolution

Manual grant is active only when granted_at <= server now < expires_at and revoked_at is null. Pro = existing subscription OR existing paid pass OR active manual grant. Multiple grants resolve to latest active expiry; revoking one must not implicitly revoke others. Determine dates from active sources, avoiding a stale/invalid subscription extending manual-only proUntil.

Expose explicit paid/manual eligibility and their deadlines plus a bounded access source (free, paid, manual, paid_and_manual). Source is derived on server; user.tier is not an override. Existing subscription object remains truthful and unchanged; do not fabricate plan, customer or billing information. Preserve compatibility for existing consumers of pro/proUntil. If correcting inactive-source proUntil, keep it local to access reporting and test the old paid flows.

Ensure /api/me and authenticated entitlement responses cannot serve stale shared-cache grants. Carry metadata through useMe. Automatically refresh/reconcile at relevant expiry and on returning to an open tab; timer cleanup, long delays, request races, errors, logout/account switches and manual revocation must be covered. Server rejects expired/revoked access on next request. For revocation in an already open tab use bounded periodic revalidation (propose 60 seconds while visible) and focus revalidation, document that limit. On expiry do not leave a cached manual-only Pro indefinitely if refresh fails; do not drop a valid paid entitlement because a manual grant expires. Reuse existing campsites reloadKey to update list on effective tier change.

### 3. Honest account UI and commercial measurement

All existing Pro feature gates use the effective entitlement. Manual-only UI uses translated Pro access / Pro-aðgangur and expiry, not subscription/payment success or a billing portal action for a nonexistent Paddle customer. A real paid subscription's controls remain available when manual access coexists. Cover IS/EN and existing entrypoints, no new full account/dashboard page.

Success.jsx must not treat manual-only pro as a checkout conversion, display payment confirmation, or endlessly imply a purchase is pending for a known manual-only account. Separate access from paid completion evidence. Preserve paid subscription/pass checkout behavior and deduplication. Audit event emitters for purchase, subscription_started, checkout_completed and affiliate/revenue conversion; never generate these from a grant/revoke/expiry. Paid conversion correctness beyond the new manual-entitlement interaction is not a general payment rewrite.

Keep existing admin commercial summary/MRR/revenue semantics excluding grants; labels/documentation must not misrepresent manual access as paid subscriber counts. Through existing analytics wrapper expose bounded access_source on relevant events/user context, sourced only from resolved server eligibility, including paid_and_manual; reset on logout/expiry/account change, avoid stale identity across mounted useMe consumers. Feature event tier=pro remains an access tier, not proof of payment. No PII/reason/expiry timestamps in GA. No GA admin configuration or live ingestion claim. Document segmentation and mixed-source precedence.

### 4. Rollout/runbook

Document operator commands with fake identifiers, grant/list/revoke example, exact UTC expiry semantics, multiple grants, paid overlap, revalidation limits, schema-first rollout, verification and rollback. Do not grant actual UX reviewers yet. Identify database migration as pending owner-controlled step; no claim that local code is live. Avoid silent missing-table catch that hides an incomplete rollout. Rollback code before removing schema, preserve audit records.

## Validation and acceptance

Add focused tests, not just existing green suites:
- Resolver matrix: anonymous, no grant, future grant, active grant, exact expiry, expired, revoked, multiple grants; subscription/pass only and combined manual; canceled-valid and past_due existing policies; stale inactive subscription date. Paid expiry with manual still active and converse.
- Operator validation, dry-run no-write, explicit mutation, missing/ambiguous target, parameterization, idempotent revoke, no creation of user/subscription/pass/transaction; no unauthenticated client grant surface.
- API/campsite parity for manual Pro vs paid Pro and loss of full-list access after expiry/revoke; no-store responses.
- Hook fake-clock tests for expiry/focus/revalidation and refresh failure, in-flight old response, logout/account switch, mixed sources and cleanup. Test effective gates and list reload, not just response shape.
- IS/EN manual account/access display and true paid controls. Success route manual-only: zero purchase/conversion, no false payment confirmation; paid subscription/pass regression.
- Analytics source for free/paid/manual/mixed, reset paths, no PII and no new commercial events from grant lifecycle; admin commercial count queries exclude manual table.
- Run all relevant entitlement/auth, payment/pass/refund/webhook, pricing/checkout, analytics and UI suites, then lint and production build. Report commands/counts accurately. Browser-check manual-only, paid overlap and expiry in IS/EN using contract-matching mocked responses without real Paddle/GA/DB mutations. If real SQL execution cannot be tested in an isolated test DB, clearly disclose migration/query validation limit rather than claiming DB verification.

## STOP conditions and handoff

Before code edits CC repeats read-only data-flow audit. Stop and return to Ripley if implementation requires changed paid eligibility/status rules, webhook/checkout pricing/fulfilment changes, new dependencies, broad auth redesign, public grant endpoints or unrelated gates/scoring changes. Unrelated security problems are reported, not silently fixed. No production credentials/data mutation, commit, push, deployment or issue closure. Do not request repeated approval for the narrow backend scope explicitly required by #433.

When a future approved prompt is issued: verify CURRENT READY_FOR_CC; move to CC_IN_PROGRESS before implementation; write cc-report.md with scope, exact validation, risks and unapplied SQL, then CURRENT CC_COMPLETE with report path. Jonesy writes result-review.md; Ripley performs final assessment. For now Jonesy should append APPROVED/REVISE to this file only, with particular scrutiny of expiry/revalidation, analytics mixed sources, operator authority and rollout.

---

## Jonesy — Round 1 prompt review (2026-10-05)

Reviewer: Jonesy (technical peer review). Read-only; nothing was implemented, committed, pushed or deployed. I read `docs/ai/README.md`, CURRENT and this file fresh, then the live source (listed below). I did not read `.env*` files or any secret, and I did not touch a database.

**Verdict: REVISE.** The architecture is right (separate grant table, one server resolver, operator script, no public endpoint, paid rules untouched). I have 14 additive corrections that come from the live code, three of which are real defects the contract would otherwise build in (R1, R6/R7, R9), plus one report-only security finding (R14). Nothing needs a scope change, a new dependency, or a change to paid eligibility. Once these are folded into the prompt I expect to approve in Round 2.

### 1. Verified against live source

| Ripley finding | Result |
|---|---|
| `getMe.js` rules | Confirmed: session → sub → pass, sequential. Sub active = future `current_period_end` (JS clock) and status in active/trialing/past_due/canceled/cancelled. Pass active = status `active` and `access_end > now()` (DB clock). `proUntil` = later of sub end and pass end **without checking whether the sub is active**, so a stale sub date already shows in `proUntil` today. |
| `api/campsites.js` | Confirmed: `isPro = !!me?.entitlements?.pro`, `Cache-Control: private, no-store`, `Vary: Cookie`. |
| `api/me.js` | Confirmed: no cache headers on any branch. |
| `useMe.js` | Confirmed: normalizes to `pro`/`proUntil` only, fetches on mount or explicit refetch, sets `loading=true` on every fetch. Details in R9. |
| `Success.jsx` | Confirmed: any `entitlements.pro` becomes `status=active` and fires `checkout_completed` (plan from `subscription.plan`, "unknown" for passes). |
| `admin.js getProSummary` | Confirmed: counts only `user_subscription` and active `user_pass`, exported with an injectable `sql` (testable). |
| `analytics.js` | Confirmed: `trackEvent(name, data)` only; no user-property support. |
| `user_pass.sql` | Confirmed precedent in `docs/payments/sql/` (plain `CREATE TABLE`, manual apply). |
| `useCampsites({ reloadKey: entitlements.isPro })` in `App.jsx` | Confirmed: the list already reloads on an effective tier change. |

### 2. Required changes to the prompt

**R1 — Isolate the grant lookup from paid resolution and from every other `getMeFromRequest` caller (blocker).** `getMeFromRequest` is used by `/api/me`, `/api/campsites` and `requireAdmin` in `api/admin.js` (every admin endpoint, including blog admin). If the new query throws (table not migrated, DB error), today's code would 500 all of them for every logged-in user; `useMe` then turns a failed `/api/me` into `pro: false`, so **paying users would lose Pro and the owner would lose admin access** during a partial rollout. Required: the grant query sits in its own try/catch. On failure paid resolution is unchanged, manual access is false, and the server logs one fixed-tag error line (no row data, no user ID, no connection string). This is not a silent catch: the rollout step "run `list` before granting anyone" fails loudly on a missing table. Test: rejecting grant query with a paid-only user, a manual-only user, and an admin session. This replaces "avoid silent missing-table catch" in the draft.

**R2 — Query order and the existing mock harness.** `getMe.test.js` mocks `postgres` with a sequential response queue (calls 1–3 = session, sub, pass; missing entries return `[]`). The grant query must be the **fourth, sequential** call (not in a `Promise.all`, not before the pass query), so the existing tests stay green unchanged. Require CC to run the existing `getMe.test.js` untouched before adding anything, and extend the queue only in new tests.

**R3 — Evaluate activity in a pure function with an injectable clock.** The sql mock never runs SQL, so a predicate such as `granted_at <= now() and now() < expires_at` inside the query is **untested** and "exact expiry" cannot be proven. Required: the query returns only `expires_at` for the user's rows with `revoked_at is null and expires_at > now()` (a coarse prefilter), and a pure `resolveManualAccess(rows, now)` in `api/_lib` makes the decision (exclusive expiry, latest of several, malformed row ignored). The matrix is then tested with a fake `now` at expiry−1 ms, expiry, expiry+1 ms. Drop `granted_at` from the activity predicate: there is no future-dated grant in this design (start = DB `now()` at insert), `granted_at` is audit only, and keeping it would add a clock-skew edge between the operator DB default and the JS clock. State "no future start" in the prompt. Do not select `reason`, operator or grant ID in the resolver query.

**R4 — Date fields and backward compatibility.** Keep the existing `pro` and `proUntil` computation byte-identical when no active manual grant exists (characterization-test the old outputs first: sub-only, pass-only, both, canceled-valid, past_due, stale inactive sub date). When an active manual grant exists, compute `proUntil` from **active** sources only (active sub end, active pass end, manual end), so a stale sub date cannot extend a manual-only period. Proposed additive shape: `entitlements { pro, proUntil, paid, paidUntil, manual, manualUntil, accessSource, serverTime }`, where `paid` equals the existing `subProActive || passProActive` exactly, `paidUntil` is the latest active paid end (or null), `accessSource` is one of `free|paid|manual|paid_and_manual`, and `serverTime` is the server's ISO time (used by R9). The me response must never include grant ID, reason, operator or revoker. Test that explicitly (key whitelist on the response).

**R5 — `/api/me` cache headers on every branch.** `Cache-Control: private, no-store` and `Vary: Cookie` on the logged-in, logged-out and 500 branches. Add a test.

**R6 — Do not strand manual-only users who want to buy.** `useCheckoutFlow.startCheckout` and `AppRoutes` `PricingInfoRoute.startCheckout` both say "you already have Pro" and refuse to open `/pricing` when `entitlements.pro` is true. For a manual-only user (for example near expiry) that blocks the purchase path from every in-app entrypoint, although `Pricing.jsx` and the server `checkout.js` would allow it (the server only blocks on an existing `user_subscription`). Required: those two guards use paid eligibility (`paid ?? pro`, falling back to `pro` if an older server omits `paid`), and manual-only goes on to `/pricing`. Test both entrypoints for free, manual-only, paid, paid+manual. `Pricing.jsx` keeps keying its plan banners on `subscription.plan`, which is null for manual-only; add a test that manual-only sees all purchase CTAs and no "subscription active" banner. This is a product decision I recommend; I list it in the owner questions below.

**R7 — Top5Leaderboard Pro card, honest manual state.** The `isPro` branch always shows "Manage your subscription and invoices" and a Manage button that calls `/api/billing-portal`, which returns 409 `MISSING_PADDLE_CUSTOMER` for an account without a Paddle customer; a manual-only user would hit an error toast. Required: manual-only shows translated "Pro access" plus "until <date>" (IS and EN, reusing the existing date formatting) and **no** Manage button; paid and paid+manual keep Manage. `getProLabel` and `showProUntil` (currently only for canceled subscriptions) need the same split. All other Pro gates read `entitlements.isPro` from `App.jsx`, or `me.entitlements.pro` in `NorthernLightsLanding.jsx`, and inherit the effective value with no change; list them in the CC audit and test one of each.

**R8 — Success page: separate access from payment evidence.** Completion (`status=active`, `checkout_completed`) must key on `paid` (`paid ?? pro`), never on manual access. Two cases to specify: (a) manual-only visitor with no purchase, and (b) a manual-only user who has just paid and is waiting for the webhook. They look identical until the webhook lands, so keep the normal polling window in both. After polling stops with no `paid`, a manual-only account shows neutral text ("Pro access is active until <date>; no payment has been recorded yet"), not "Payment received", no "Manage" button, and **no** `checkout_completed`. Paid, paid+manual and pass buyers keep today's behavior and the one-event deduplication. Minimal translated strings only.

**R9 — `useMe`: four defects the revalidation plan would otherwise amplify.**
1. `fetchMe` always calls `setLoading(true)`. A 60 s background poll would flip `loadingMe` in `App.jsx` every minute; the code comment there says exposure analytics rely on `loadingMe` to avoid recording a premature Free guess. Background revalidation must be silent: no `loading` change, no `error` change, data replaced only if something changed.
2. Existing stale-response race: `const json = await res.json().catch(() => null)` swallows an `AbortError` raised while the body is being read, and the function then **writes the logged-out shape** (`ok:false`, `pro:false`) into state. With polling and focus refetches this window gets hit, causing a brief free flash, a `reloadKey` toggle and two campsite reloads. Required: after every await, apply the result only if its controller is still the current one and not aborted (token or `signal.aborted`).
3. `useMe` is instantiated independently in `App.jsx`, `PricingInfoRoute`, `Pricing.jsx`, `NorthernLightsLanding.jsx` and elsewhere. Put timers and polling behind an opt-in (`useMe({ revalidate: true })`) used by the `App.jsx` instance only; other instances stay one-shot.
4. Scope the polling: every poll runs four SQL queries, so poll only while **manual access is currently active and the tab is visible** (to catch revocation), plus a refetch on focus/`visibilitychange`/`pageshow`. Free and paid-only users get no timer and no polling. Say so in the prompt and document the up-to-60 s revocation lag.

Expiry timer: compute the delay as `manualUntil − serverTime` from the same response (immune to client clock skew), not from `Date.now()`. `setTimeout` overflows at 2^31−1 ms (about 24.8 days) and then fires immediately; grants of 25 days or more would hammer `/api/me` in a loop. Clamp each timer to at most 24 h and re-arm, with a minimum delay floor. If the refetch at expiry fails, keep any `paid` entitlement and drop manual-only access locally, using `serverTime` plus elapsed `performance.now()` as the clock; never leave manual-only Pro cached indefinitely. Normalize new fields strictly (known `accessSource` values only; anything else becomes `free`) so an unexpected string can never reach analytics. The first-load error behavior stays as it is today (not broadened).

**R10 — Analytics: do not touch existing event payloads.** The weather-voice (#420/#432) and Northern Lights (#431) docs and exact-payload tests pin their event fields; auto-attaching `access_source` inside `trackEvent` would change every one of them. Preferred design: one `setAccessSource(source)` in `analytics.js` that sets a GA4 **user property** (`gtag("set", "user_properties", …)`), called from the single revalidating `App.jsx` instance, never while `loadingMe` is true, with a bounded set `anonymous|free|paid|manual|paid_and_manual`, reset on logout, expiry and account change. If Ripley prefers event parameters instead, use an explicit allow-list of event names (`pricing_page_viewed`, `subscription_cta_clicked`, `checkout_started`, `checkout_completed`, `homepage_loaded`) and never `weather_voice_*`. Either way: no email, ID, reason or timestamp, no GA admin configuration, no live-ingestion claim, and custom-dimension registration stays a pending owner step. `trackEvent` is a no-op without `VITE_GA_MEASUREMENT_ID`, so tests mock `react-ga4`. The `tier=pro` and `isPro` fields on existing events keep meaning "access tier", as the draft says.

**R11 — Operator script details.**
- Location: `scripts/proGrant.mjs` plus an importable `scripts/proGrantLib.mjs` and `scripts/proGrantLib.test.mjs` (the vitest config already includes `scripts/**/*.test.mjs`). Nothing under `api/` outside `_lib`: every other file in `api/` is a public Vercel function through the `/api/(.*)` rewrite, which would create the public mutation surface the issue forbids.
- Email lookup: `login-email.js` inserts the email exactly as typed and uses `on conflict (email)`, so `Foo@x.com` and `foo@x.com` can be two different users. Match with `lower(email) = lower($1)`, and if more than one row matches, refuse and list the candidates (id, email, created_at) so the operator can pass the UUID.
- Audit identity: a required `--operator` (or a config variable) is a **self-asserted label**, not an authenticated identity. Real authority is possession of `POSTGRES_URL`. Say so in the runbook; do not call it "trusted".
- Duration: reject an expiry beyond a cap (I suggest 366 days) and reject a past or non-timezone timestamp; start time is the DB `now()`.
- Connection: created inside `main()` only, closed in `finally`, never at import time; the lib receives `sql` by injection so tests need no database. Sanitized errors print the class/code only (postgres errors can carry parameters).
- Dry-run is the default and shows the resolved target (email, ID, created_at) and any existing active grants; `--apply` writes. Revoke takes a grant ID, shows the target in dry-run, is idempotent, and sets `revoked_at/revoked_by` only where `revoked_at is null`.
- Tests with an injected tagged-template `sql`: capture the strings arrays to prove parameterization (no string concatenation), no `insert into app_user`/`user_subscription`/`user_pass`, dry-run issues no write, apply issues exactly one insert, revoke twice issues one effective update. State plainly that mocked SQL does not validate the SQL itself.
- CC must not run the script against any real environment and must not read `.env*`.

**R12 — Migration file.** `docs/payments/sql/user_pro_grant.sql`, header "NOT APPLIED: owner applies manually", idempotent (`create table if not exists`, `create index if not exists`), `id uuid pk default gen_random_uuid()` (same function as `user_pass`), `user_id uuid not null references app_user(id)`, `granted_at/expires_at timestamptz not null`, `check (expires_at > granted_at)`, `source text not null default 'admin' check (source = 'admin')`, `reason text not null check (char_length(btrim(reason)) between 1 and 500)`, `created_by text not null`, `revoked_at/revoked_by` with `check ((revoked_at is null) = (revoked_by is null))`, partial index on `(user_id, expires_at) where revoked_at is null`. No cascade delete; audit rows are preserved. Include the rollback note: roll code back first, export the table if audit history matters, then drop.

**R13 — Admin summary.** Leave `getProSummary` and the revenue query untouched. Add a test with the injected `testSql` that the captured query text does not mention `user_pro_grant`. A manual-grant count on the admin dashboard is out of scope.

**R14 — Report-only security finding (not part of #433, do not fix here).** `api/login-email.js` creates a session for any email address without verification (no code, no link, no secret), and `useLoginFlow.js` calls it from the live login UI; `requireAdmin` then decides admin by the session's email against `ADMIN_EMAILS`. As far as the files I read show, anyone who types a registered email gets that account's session, including its paid or manual Pro and, for the admin email, the admin endpoints. I cannot see production configuration or any layer in front of this route, so this needs the owner's validation. Why it matters for #433: a manual grant attaches to an email, so it is only as private as the login. Recommendation for the prompt: record this as an unrelated finding that CC reports and does not fix; keep grants short (the cap in R11); document that a grant to an email is claimable by whoever can log in as that email. Ripley should decide whether to open a separate issue.

### 3. Questions for Ripley and the owner (answer in the prompt, so CC does not guess)

1. **R6:** may a manual-only user purchase a plan? I recommend yes (paid access then sits beside the manual grant, `paid_and_manual`).
2. **R11:** is 366 days the right maximum for a grant, and is `--until` (ISO with offset) the only way to give an expiry, or do you also want `--days N`?
3. **R10:** GA4 user property (recommended) or an allow-list of event parameters?
4. **R14:** separate issue, now or later?

### 4. Additions to the validation list (beyond Ripley's)

- Existing `getMe.test.js` and the old `proUntil` outputs pass unchanged before any edit (R2, R4).
- Grant query rejecting: paid, manual-only and admin sessions (R1).
- Fake-clock boundary at expiry−1 ms, expiry, expiry+1 ms in the pure function (R3).
- Response key whitelist: no grant ID, reason or operator in `/api/me` (R4).
- Timer clamp and re-arm for a grant longer than 25 days, with no immediate-fire loop (R9).
- Superseded and aborted responses never write state, including an abort during body read (R9).
- `useMe` instances without `revalidate` start no timer and no poll (R9).
- `loadingMe` stays false across a background revalidation (R9).
- Entry points: `startCheckout` in both places, `Pricing.jsx`, `Top5Leaderboard` Pro card, `NorthernLightsLanding` gate, for free, manual-only, paid, paid+manual (R6, R7).
- `setAccessSource` called with each bounded value and never with an unknown string, none while loading (R10).

### 5. Limits of this review

I read: `api/_lib/getMe.js` and its test, `api/me.js`, `api/campsites.js`, `api/admin.js` (summary and `requireAdmin`), `api/checkout.js` (existing-subscription guard), `api/billing-portal.js`, `api/login-email.js`, `api/logout.js`, `api/paddle-webhook.js`, `docs/payments/sql/user_pass.sql`, `src/hooks/useMe.js`, `useCheckoutFlow.js`, `useCampsites.js`, `useLoginFlow.js`, `src/lib/analytics.js`, `src/config/features.js`, `src/pages/Success.jsx`, `Pricing.jsx`, `src/components/Top5Leaderboard.jsx`, `src/AppRoutes.jsx`, `src/App.jsx` (entitlement and campsite wiring), `vitest.config.js`, `vercel.json`. I did not read the Paddle subscription/transaction persistence code in detail, `Subscribe` page, the test suites outside `getMe.test.js`, or any production configuration, and I did not execute anything. The Neon schema of `app_user` (column types, whether `email` is `citext`) is inferred from `login-email.js` and `user_pass.sql`, not from the database. The 24.8-day `setTimeout` limit is a general JavaScript fact I did not test here.

### 6. Verdict

**REVISE.** Fold R1–R14 and the four answers into a v1 prompt and re-issue; I expect to approve in Round 2. No code, commit, push, deployment, production data change or GitHub closure by Jonesy. CURRENT stays PROMPT_REVIEW; canonical state changes are Ripley's call.

---

## Ripley — Round 2 revision (2026-10-05)

Status: PROMPT_REVIEW, NOT execution authorization. Round 1 remains history. This revision incorporates Jonesy's R1–R14 subject to the explicit resolutions below; where wording conflicts, this section supersedes Round 1 and the review recommendation. Jonesy: review this combined contract and append APPROVED/REVISE. No implementation yet.

### Decisions resolved

- R6: manual-only users may buy through the existing purchase entrypoints. Paid and manual access may coexist. This preserves the issue's independent access sources; it does not introduce a new payment product.
- R11: use explicit `--until` ISO timestamp with timezone only, maximum 366 days from DB grant time; no `--days` option in MVP. This is a proposed implementation limit for this review, not a previously stated owner preference.
- R10: GA4 user property `access_source`, not automatic event payload enrichment. Existing event payload contracts stay unchanged.
- R14: record a separate local security follow-up below; do not open a GitHub issue or fix login as part of #433. No live deployment or real grants are performed by this workflow. The finding needs owner follow-up before relying on email-specific access privacy.

### R1–R5: resolver and failure behavior

Accept the isolated fourth sequential grant query after session/sub/pass. Test existing getMe suite before changes and preserve legacy expectations; new cases extend the mock queue. Only the new grant query is caught: fixed sanitized diagnostic tag, no email/ID/parameters/connection data, manual=false on failure, existing paid eligibility and authenticated/admin identity intact. Do not mask errors from the original auth/paid queries. Operator list must fail clearly when schema is missing. This explicitly replaces Round 1's potentially blocking missing-table rule.

Create a pure injectable-clock manual resolver. No future start scheduling: granted_at is DB now() at insertion, audit-only. Query unrevoked rows with future expiry and select expires_at only; helper rejects invalid dates, compares exclusive expiry and selects latest valid expiry. Pure tests prove expiry boundaries, SQL-capture tests prove revoked/user/prefilter predicates; mocked SQL alone does not prove the database executes them. No reason/operator/grant ID in /api/me.

Use additive fields pro, proUntil, paid, paidUntil, manual, manualUntil, accessSource, serverTime. paid preserves existing subscription/pass eligibility. paidUntil includes only active paid sources. Preserve legacy pro/proUntil behavior with no active grant, including the stale inactive-subscription proUntil quirk, and characterize it in tests. With active manual access proUntil uses active sources only. serverTime is a single captured ISO reference for the response/helper. New API responses always expose the additive fields consistently (including anonymous defaults); client fallback paid ?? pro is only compatibility with an older response. Do not synthesize missing paid evidence in new responses.

Set private, no-store and Vary: Cookie for every /api/me branch, including errors. Test response key whitelist, query failure for paid/manual-only/admin callers, and all combined expiry cases.

### R6–R8: purchase entrypoints and truthful UI

Use paid ?? pro in the two existing purchase guards (useCheckoutFlow and PricingInfoRoute); manual-only reaches pricing. Free/manual/paid/mixed coverage is required. Preserve existing paid restrictions. Top5 manual-only card uses translated Pro access plus expiry and no subscription/invoice/Manage claim; paid/mixed retain current controls.

Correction to R6: Pricing cannot keep using effective pro AND subscription.plan blindly. An expired subscription row may retain its plan while manual access is active. Do not show an active subscription banner or disable purchasing on that basis. Derive subscription-display activity from the existing subscription status/date policy, distinct from paid-pass and manual eligibility; preserve existing paid behavior. Test manual plus stale monthly/yearly row as well as no subscription. Do not alter the server checkout eligibility rule.

Success keeps normal bounded polling for manual-only because a genuine new purchase can be awaiting webhook. Only paid ?? pro activates the existing completion/event path, preserving paid/pass behavior. At timeout without paid access, manual-only gets neutral access text and no Manage button or conversion. Wording must say payment confirmation has not arrived here, rather than asserting no payment occurred. Manual-to-paid during polling emits exactly one completion. Existing paid status is not proof of a new transaction; this pre-existing attribution limit must be disclosed, not described as newly verified purchase evidence or expanded into a checkout rewrite.

### R9: revalidation, shared consumers and clocks

Accept silent background refresh, request-generation/abort guards after every await including body parsing, first-load behavior unchanged, no repeated loading exposure flips, and data equality suppression. Active manual users only: visible 60-second polling, focus/visibility/pageshow refresh; ordinary free/paid users have no periodic timer. Clear on logout/unmount; coalesce overlapping triggers. 60-second revocation lag assumes successful network responses, not an unconditional offline guarantee.

Accept one revalidating App useMe owner, but NOT stale one-shot route consumers. App is the root; nested Pricing, PricingInfoRoute and NorthernLightsLanding currently create independent hooks. Propagate the owner's updated me/loading/refetch state through existing props or a small React context; subscribed consumers must update at expiry/revoke/logout. Standalone useMe defaults may stay one-shot for tests/isolated use, but mounted production consumers must not use stale snapshots. No new state library and no duplicate polling/analytics owners. Audit route wiring before choosing props versus context and document the choice. Test open Northern Lights/pricing routes across expiry, not only homepage.

Compute remaining validity using serverTime and elapsed monotonic time, accounting conservatively for request time. Keep expiry scheduling independent from visible-only polling. Clamp timeout slices to at most 24 hours with a minimum floor; recheck remaining time and re-arm, never grant a fresh full duration on each slice. Reconcile on wake/focus before retaining expired manual UI; account for sleep/time passage and test skewed client clocks, long grants and hidden-tab resume. Failed refresh may retain paid access only until its known paidUntil; an expired manual grant must disappear even if networking fails. Do not resurrect grants from late responses. Normalize booleans/deadlines/source strictly; unknown source never reaches analytics. Failures must not manufacture anonymous/free identity for a still-authenticated paid session.

### R10–R13: analytics, operator and migration

Accept setAccessSource in analytics.js using the existing react-ga4 integration for a GA4 user property, bounded anonymous/free/paid/manual/paid_and_manual. Only the App-owned resolved session sets it, never a loading Free guess; dedupe unchanged values and reset on account/logout/expiry. Existing trackEvent payloads remain untouched. Verify timing with route events and disclose that events before initial auth resolution cannot be retrospectively classified; do not claim complete attribution for unresolved initial pageviews. Mock GA calls, no live analytics changes; custom dimension registration remains an owner step.

Use scripts/proGrant.mjs, injectable scripts/proGrantLib.mjs and scripts/proGrantLib.test.mjs. Connect only inside main and close in finally. No public mutation route or env-file reads. Case-insensitive email match must reject multiple rows with minimal candidate details so UUID can disambiguate. Require nonempty bounded operator label; it is self-asserted audit metadata, while DB credentials are the actual authority. Dry-run default; apply must revalidate expiry and target at mutation time, against DB now(), including the 366-day cap. Parse real calendar timestamps strictly (reject invalid dates that JavaScript normalizes). Parameterized writes; no user/sub/pass/transaction insert; idempotent revoke preserves first revocation actor/time. Grant/list output reveals only operator-needed target/grant details. Sanitize failures, not raw postgres errors. Tests inspect SQL structure plus bound values and state the limits of mocks.

Migration: docs/payments/sql/user_pro_grant.sql, NOT APPLIED header; idempotent table/index creation; FK/no cascade; UUID default; granted_at default now(); expires_at > granted_at and <= granted_at + interval '366 days'; source admin; reason trimmed 1–500 chars; created_by and any revoked_by nonempty/bounded; revoked_at/by null consistency; partial user/expiry index for unrevoked rows. IF NOT EXISTS is not schema reconciliation: runbook must require checking existing shape if table already exists. Code-first rollback; preserve/export audit records before any owner-authorized table removal. No SQL application here.

Leave admin getProSummary and revenue queries unchanged. Add query-capture assertion excluding user_pro_grant, no manual dashboard count. Retain all Round 1 regression/browser/report requirements plus Jonesy's targeted additions, and the route propagation/stale-subscription cases above. No new paid policy or payment plumbing changes.

### R14: separate security follow-up (local record)

Ripley independently read api/login-email.js and useLoginFlow.js: the live UI calls an endpoint that creates a session from an email without checking email ownership. Jonesy also traced admin authorization to that session email. This is a code-level finding; production exposure, upstream controls and exploitability have not been verified. Manual grants inherit this existing identity boundary and cannot be represented as private to the mailbox owner. A short expiry does not fix authentication. Track as separate authentication/security work for owner triage; no exploit, production request, new GitHub issue or auth changes under #433. CC must repeat this limitation in its report/runbook. Do not claim the issue's security criterion is fully met merely because the new grant command requires DB credentials; distinguish grant mutation security from existing login identity assurance.

CURRENT remains PROMPT_REVIEW. No approved execution file until Jonesy approves this revision.

---

## Jonesy — Round 2 prompt review (2026-10-05)

Reviewer: Jonesy (technical peer review). Read-only; nothing was implemented, committed, pushed or deployed. I read CURRENT and this file fresh, then re-checked Ripley's Round 2 against the live source (`main.jsx`, `App.jsx`, `AppRoutes.jsx`, `Pricing.jsx`, `NorthernLightsLanding.jsx`, `Success.jsx`, `Top5Leaderboard.jsx`, `useMe.js`, `vite.config.js`) in addition to the files listed in Round 1. No `.env*` file was read.

**Verdict: APPROVED, on condition that amendments A1–A6 below are folded into the approved prompt.** R1–R14 are incorporated faithfully, and the extra tightenings (strict timestamp parsing, mutation-time revalidation against DB `now()`, first-revocation preservation, request-time-conservative clocks, `paid ?? pro` compatibility only) are correct. Two statements in the revision are wrong about the live code (A1, A2) and one correction needs a different mechanism (A3). They are specified below so CC does not have to rediscover them; none changes scope, adds a dependency, or touches paid eligibility.

### 1. Verified in the Round 2 text

- Route-state claim: "nested Pricing, PricingInfoRoute and NorthernLightsLanding currently create independent hooks." **Confirmed** (`useMe()` in `Pricing.jsx:16`, `AppRoutes.jsx:60`, `NorthernLightsLanding.jsx:83`; `PricingRoute` passes no `me`, so `Pricing` always uses its own hook).
- "App is the root." **Not correct**, see A1.
- Stale-subscription correction for Pricing: **correct and necessary** (`Pricing.jsx` derives `isYearly`/`isMonthly` from `proActive && subscription.plan`, so an expired row with a retained plan would show an active banner for a manual-only user). The mechanism needs A3.
- Everything in R1–R5, R7–R13 as restated: consistent with Round 1 and with the code. The existing `getMe.test.js` queue harness, the `requireAdmin` caller and `me.js` branches are all covered.
- `/api/me` is not cached by the service worker: `vite.config.js` runtime caching covers only Open-Meteo and OSM tiles, and `navigateFallbackDenylist` excludes `/api/`. No change needed there; CC should not add a runtime-cache rule for `/api`.

### 2. Mandatory amendments

**A1 — The revalidation owner cannot be the `App.jsx` `useMe`, because it is not a root.** `useMe()` at `App.jsx:67` lives inside `IcelandCampingWeatherApp`, which `AppRoutes` mounts only for `/` and `/about` (`HomeComponent`). The real root `App()` renders `BrowserRouter`, `AnalyticsTracker`, `AppRoutes`; it has no `useMe`. `/pricing`, `/pricing-info`, `/success`, `/en/northern-lights` and the rest are siblings, so navigating from the homepage unmounts the "owner" together with its timer, poll and analytics call, and the other routes have nothing. Required design: a small `MeProvider` context mounted in `App()` inside `BrowserRouter`, wrapping `AppRoutes`. Revalidation, the expiry timer, the silent refresh and `setAccessSource` live in the provider (one owner for all routes). `useMe()` keeps its return shape (`me`, `loadingMe`, `meError`, `refetchMe`, `refreshMe`) and reads the context when a provider exists; without one (existing tests, isolated use) it stays the current standalone one-shot hook. Record the choice in the report, as Ripley asked. Consequences to disclose, not to hide: the provider fetches `/api/me` once per full page load on every route, including blog and static pages that do not fetch it today (a request without a session cookie returns before any database query; a logged-in user costs the usual queries). I recommend the eager fetch, since the analytics property is only correct if the owner exists on every route; if Ripley prefers fetching only when the first consumer mounts, say so in the prompt.

**A2 — A shared provider removes today's implicit "fresh fetch on every page mount".** Today each page mount calls `/api/me` anew. With one provider, the client-side route change from `/success` to home (the "Back to home" link) would reuse state fetched when the Success page loaded, before the webhook, and show Free with the limited campsite list until a refresh. Required: (a) a consumer mount after a route change triggers a silent background revalidation, throttled (suggest not more often than every 10 s), without touching `loadingMe`, and (b) `Success.jsx` calls the provider's refetch when it detects paid access. Test: free state, Success detects `paid`, navigate home without a reload: homepage shows Pro and the campsite list reloads. Disclose that exposure events fired between a route change and the revalidation use the last resolved state (the existing recorded-at-fire-time behavior), as the weather-voice and homepage events already do.

**A3 — Do not re-derive subscription activity on the client; add one server field.** Ripley's correction says to derive "subscription-display activity from the existing subscription status/date policy". Re-implementing `active/trialing/past_due/canceled + future period end` in React duplicates a server rule and will drift. Required: add an additive `subscriptionActive` boolean to `entitlements`, equal to the existing `subProActive` (no new rule), and use it in `Pricing.jsx` (`isYearly`/`isMonthly`, banners, upgrade hint) and `Top5Leaderboard.jsx` (`isMonthly`/`isYearly`/labels). The Top5 Pro card keeps the Manage button when `paid` is true (so pass-only users keep today's behavior) and drops it when `paid` is false (manual-only, including manual plus a stale subscription row). State in the prompt that this is a display correction: for a user with an active pass and a stale subscription row, banners and plan labels now follow `subscriptionActive` instead of the stale row. Add `subscriptionActive` to the response key whitelist and the characterization tests. Test manual plus stale monthly row and manual plus stale yearly row, in IS and EN.

**A4 — Pin the anonymous defaults.** Round 2 says new responses expose the additive fields "including anonymous defaults" but does not name them. Required: logged-out `/api/me` returns `paid:false`, `paidUntil:null`, `manual:false`, `manualUntil:null`, `subscriptionActive:false`, `accessSource:"anonymous"` and a `serverTime`; the logged-in `accessSource` is `free|paid|manual|paid_and_manual`; the client whitelist (and therefore `setAccessSource`) accepts exactly those five values and maps anything else to `free` only for a resolved logged-in session, never to a loading guess.

**A5 — StrictMode and provider lifecycle tests.** `main.jsx` renders under `StrictMode`, which double-runs effects in development. Required tests: the provider under `<StrictMode>` starts exactly one timer set and one poll, cleans both on unmount, and does not double-call `setAccessSource` for an unchanged value; with several mounted consumers (home, Pricing, Northern Lights, PricingInfo, Success in turn) there is exactly one `/api/me` per poll interval. Plus the Round 1 and Round 2 cases for open `/pricing` and `/en/northern-lights` across expiry and revocation.

**A6 — Migration cap expression.** `expires_at <= granted_at + interval '366 days'` on a `timestamptz` is a session-timezone-dependent (stable) expression, not an immutable one; Postgres allows it in a `CHECK`, but under a non-UTC session the cap can differ by an hour from what the script computed. Required: either compute the cap in the script with the same DB expression (`now() + interval '366 days'`, evaluated in the same statement as the insert) and keep the `CHECK` as a looser sanity bound, or state that both use the same expression. CC picks one and documents it. Everything else in the migration spec stands.

### 3. Notes (no change to the prompt required)

- R14: I suggest the follow-up lives in its own file in the task folder (for example `security-followup.md`) rather than only inside this review file, so the owner can find it. Ripley's call; CC repeats the limitation in the report and the runbook as already specified.
- The 60-second revocation lag, the unresolved initial pageviews and the pre-existing "paid status is not proof of a new transaction" attribution limit are all correctly worded as disclosed limits.
- All validation remains CC's to run; the SQL and the migration cannot be proven against a real database here, and the prompt already says so.

### 4. Limits of this review

Same as Round 1, plus: I read `AppRoutes.jsx`, `main.jsx`, `vite.config.js` in full and `App.jsx` only for its structure and the `useMe`/entitlement wiring. I did not read the other route pages (Subscribe, PricingInfo) beyond how they consume `me`, and I did not run anything. Neon schema facts are inferred as before.

### 5. Verdict

**APPROVED** with A1–A6 and Ripley's Round 2 resolutions as the contract. Ripley issues `approved-prompt-v1.md` folding these in and moves CURRENT to READY_FOR_CC. No code, commit, push, deployment, production data change or GitHub closure by Jonesy. Stage stays PROMPT_REVIEW until Ripley moves it.

---

## Ripley — approved prompt issued (2026-10-05)

Jonesy Round 2 APPROVED accepted. Issued consolidated approved-prompt-v1.md incorporating R1–R14, Round 2 resolutions and A1–A6: eager root MeProvider, mount/Success refresh, server subscriptionActive, anonymous defaults, StrictMode tests and matching DB cap expression. CURRENT is READY_FOR_CC. No implementation or production operation performed.

---

## Owner cancellation — 2026-10-05

Róbert cancelled #433 and requested CURRENT.md reset, choosing existing paid access for the review instead. Stage CANCELLED; no active task. The approved prompt is historical only and must not be executed. Implementation had not started in this workflow; working-tree changes were workflow documentation only. Preserve review history. No application changes reverted, GitHub issue change, commit, push or deployment performed.
