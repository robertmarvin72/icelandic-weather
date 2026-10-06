# #433 — Approved implementation prompt v1

Date: 2026-10-05. Jonesy Round 2 APPROVED including A1–A6. This is the consolidated execution contract; earlier prompt-review rounds are historical discussion, not additional execution instructions.

## Workflow and scope

Read AGENTS.md, CLAUDE.md and docs/ai/README.md. Verify CURRENT is READY_FOR_CC and points here, then set CC_IN_PROGRESS before implementation. Repeat the read-only entitlement/data-flow audit before editing. Implement temporary, revocable manual Pro for registered users without any synthetic purchase, subscription, pass or revenue. Issue: https://github.com/robertmarvin72/icelandic-weather/issues/433.

The issue explicitly authorizes the narrow server-side scope despite the generic client-only rule: dedicated grant schema, privileged operator script, existing resolver and corresponding client consumers. No public grant endpoint, full admin dashboard, dependencies, auth redesign or role system. No production DB access/mutation, real grant, env-file reading, commit, push, deployment or issue closure. Do not inspect or print credentials. Use JS/JSX and existing conventions; preserve server import conventions where required for Node execution.

## Audit baseline

getMeFromRequest validates cc_session then queries subscription and pass sequentially. Existing paid subscription policy: future period end and active/trialing/past_due/canceled/cancelled. Existing pass policy: active status and future access_end. Preserve both exactly. The issue's subscription-only description is stale. getMe also serves requireAdmin, so manual lookup failure must not break paid or admin access.

/api/campsites uses effective pro and private/no-store; App's campsite reloadKey uses effective isPro. /api/me currently lacks cache headers. useMe normalizes away new fields and fetches independently in several routes. Its current loading and abort/body-read behavior is unsuitable for polling. Success currently treats any Pro as checkout completion. Pricing and Top5 derive plan labels from effective Pro plus potentially stale subscription rows. Existing admin commercial summaries include subscriptions/passes only.

App.jsx's home component is NOT the root owner: its hook unmounts on sibling routes. The real App() renders BrowserRouter and AppRoutes. Read that wiring, useMe, Pricing, Top5Leaderboard, AppRoutes, NorthernLightsLanding, Success, Subscribe, useCheckoutFlow, billing portal, analytics, getMe and tests before edits. /api/me has no service-worker runtime cache today; do not add one.

## 1. Schema and operator script

Create docs/payments/sql/user_pro_grant.sql, marked NOT APPLIED: owner applies manually. Use create table/index if not exists; explain that this does not reconcile an existing incompatible schema. Dedicated user_pro_grant: UUID PK default gen_random_uuid(), user_id UUID FK app_user(id) without cascade, granted_at timestamptz default now(), required expires_at, source fixed admin, trimmed reason length 1–500, nonempty bounded created_by, revoked_at and nonempty bounded revoked_by with matching nullness. Check expires_at > granted_at and maximum 366-day grant. Partial index (user_id, expires_at) where revoked_at is null. Preserve expired/revoked audit rows.

No future start scheduling; granted_at is DB insertion time, audit-only. Use the same DB expression `now() + interval '366 days'` for mutation validation and the equivalent `granted_at + interval '366 days'` CHECK, with the same statement/transaction time and session timezone. Do not use a different client millisecond calculation as the authoritative cap. Document this choice.

Provide scripts/proGrant.mjs and injectable scripts/proGrantLib.mjs, tested in scripts/proGrantLib.test.mjs. Operations: lookup, list, grant, revoke. DB credentials (POSTGRES_URL) are authority; required bounded --operator is self-asserted audit metadata, not authenticated identity. Nothing under public api routes. Connection inside main only, closed in finally; lib imports cause no connection. Never read .env files or run against a real environment here.

Default dry-run, explicit --apply to mutate. Resolve registered user by UUID or trimmed case-insensitive email; multiple case variants must refuse with minimal id/email/created_at candidates for UUID disambiguation. Never create a user. Preview target and all active grants. --until requires strict real calendar ISO timestamp with explicit timezone, future expiry within 366-day cap; no --days. Reject rollover dates, malformed UUID, blank/oversized reason/operator. Revalidate target and dates at mutation against DB now(). Parameterized tagged SQL only. No writes to app_user/user_subscription/user_pass/Paddle transaction. Revoke specific grant id idempotently, preserve first revocation time/actor; other grants and paid access untouched. Minimal operator output; sanitized error class/code only, never raw DB parameters/secrets. Do not emit commercial analytics.

## 2. Resolver and API

Run existing getMe.test.js unchanged before editing; preserve legacy cases/queue. New grant query is fourth and sequential after session/sub/pass, not Promise.all. Query only expires_at for user-scoped unrevoked future rows. Wrap only that new query in isolated catch: fixed sanitized error tag, manual=false, paid and authenticated/admin identity unchanged. Original auth/paid errors keep existing handling. Operator list fails visibly on missing schema; no silent rollout success.

Implement pure resolveManualAccess(rows, now), injectable clock, exclusive expiry, malformed dates ignored, latest valid expiry. Query predicates handle user/revocation; test captured SQL separately from pure clock cases. Capture one response serverTime reference for resolver. Mock SQL does not prove database execution.

Add fields to entitlements: paid, paidUntil, manual, manualUntil, subscriptionActive, accessSource, serverTime, keeping pro/proUntil. paid = original subProActive || passProActive; subscriptionActive = original subProActive. paidUntil is latest active paid end. With no active manual grant preserve original pro/proUntil behavior, including stale inactive-sub end quirk. Characterize old outputs. With active grant, pro true and proUntil latest ACTIVE sub/pass/manual end only. Never fabricate subscription/customer/plan. Do not return grant id/reason/operator/revoker.

Authenticated accessSource: free|paid|manual|paid_and_manual. Anonymous response: user/subscription null, pro/paid/manual/subscriptionActive false, proUntil/paidUntil/manualUntil null, accessSource anonymous, serverTime ISO. /api/me sets Cache-Control private, no-store and Vary Cookie on every branch including anonymous/errors. Error state must not masquerade as successful resolved anonymous state. Add response key-whitelist tests. Campsites inherits effective pro with existing cache discipline.

## 3. Single shared client session owner

Create small MeProvider inside real App()'s BrowserRouter wrapping AppRoutes. It owns eager initial /api/me, refresh/timers and analytics source for ALL routes. Document extra initial request on blog/static routes; no cookie returns before DB, authenticated request incurs queries. useMe keeps me/loadingMe/meError/refetchMe/refreshMe shape; reads provider when present, standalone one-shot behavior without provider for isolated/tests. No duplicate fetch/timer fallback running beneath provider. All production consumers subscribe; none may keep stale independent snapshots or stale me props.

Consumer mount after route change requests silent revalidation, coalesced/throttled to at most once per 10 seconds. Success detecting paid explicitly refreshes provider without waiting for throttle. Initial/explicit behavior stays compatible; background refresh must not toggle loading/error or replace equivalent data. Check request generation/controller after EVERY await, including body read; superseded/aborted responses never write state or reset loading for newer requests.

Visible active-manual users: one 60-second revocation poll; focus/visibility/pageshow revalidation. Free/paid-only: no periodic polling. Initial/route/explicit refresh still applies. One shared owner, cleanup and coalescing. 60-second revocation bound requires network success; offline revocation cannot be instantly known.

Use serverTime plus elapsed monotonic time, conservatively accounting for request time, for remaining deadlines rather than client absolute clock. Clamp timeout slices <=24h with positive floor, subtract elapsed time and re-arm (no renewed duration); no 2^31 overflow for long grants. Expiry handling independent of visible polling. Reconcile wake/focus/sleep before retaining expired manual UI. Test client skew, hidden resume and >25-day duration. Refresh failure must drop expired manual access locally, retain paid only within known paidUntil; do not manufacture logout or revive a grant via late response. Preserve paid rules; no general paid-only polling redesign. Effective tier change drives existing campsite list reload.

Normalize flags/deadlines strictly. New fields are authoritative when supplied; `paid ?? pro` fallback only for old responses lacking paid. Source whitelist includes anonymous/free/paid/manual/paid_and_manual; unknown maps to free only for resolved authenticated state, never loading. Identity/account switches clear old state/requests and analytics correctly.

## 4. Honest UI and purchase path

Manual-only can buy. Change both useCheckoutFlow and PricingInfoRoute existing Pro purchase guards to paid ?? pro. Paid/mixed restrictions stay unchanged. Pricing manual-only shows purchase CTAs and translated Pro access/expiry where appropriate, no active-subscription claim. Use server subscriptionActive for monthly/yearly plan banners, upgrade hint and Top5 plan labels, never duplicate server status/date rule in React. For older response compatibility preserve old display behavior only when field absent. Active pass with stale subscription row now gets honest non-subscription labels; this is scoped display correction, not paid eligibility change.

Top5 manual-only: translated Pro access plus until date, no subscription/invoice claim or Manage button. Paid/mixed (including pass) retain existing Manage behavior. All Pro feature gates continue consuming effective entitlement; no feature limits, forecast inputs or scoring changes. IS and EN strings in translations.

Success: paid ?? pro alone can activate current completion path. Manual-only keeps normal bounded polling because payment may be awaiting webhook. After timeout show neutral access/expiry and payment-confirmation-not-yet-received wording, no false payment confirmation, no Manage, zero checkout_completed. Manual-to-paid during poll emits once and refreshes provider; navigating home immediately after success shows Pro/full campsites without reload. Preserve paid/pass completion/dedupe. Existing paid status still does not prove a NEW transaction; disclose this pre-existing limit, no payment rewrite. Audit all commercial emitters: no purchase/subscription_started/checkout conversion/affiliate revenue event from grant/revoke/expiry.

## 5. Analytics and commercial metrics

Add setAccessSource using existing react-ga4 to set GA4 user property access_source. Provider is sole owner after resolved state; dedupe unchanged value, reset on logout/expiry/account switch, no loading Free guess. Values exactly anonymous/free/paid/manual/paid_and_manual. No email, ID, reason, deadline or timestamp. Existing trackEvent payloads remain unchanged, particularly weather_voice and Northern Lights contracts. Mock GA in tests. No GA configuration/live ingestion claim; custom dimension registration remains owner step.

Feature tier=pro means access, not paid customer. Events before auth resolution cannot be classified retroactively; route-transition events before revalidation use last resolved state. Disclose both. Keep getProSummary/revenue queries unchanged, excluding manual grants; query-capture regression proves no user_pro_grant reference. No new admin count/dashboard.

## 6. Tests and verification

- Existing resolver characterization before edits: sub/pass/both, canceled-valid, past_due, stale inactive-sub proUntil; fourth query behavior. Matrix manual absent/active/exact expiry/expired/revoked/multiple/malformed; expiry−1ms/exact/+1ms; paid/manual overlap ending in either order. No scheduled future start support.
- New query rejects for paid-only/manual-only/admin session: paid and admin survive, manual fails closed. Key whitelist/no grant metadata, anonymous defaults and every cache branch. SQL predicate capture, explicit mocked-SQL limitation.
- Operator malformed input, ambiguous case email, target not found, dry-run no-write, exactly one apply insert, idempotent revoke preserving first audit, cap/DB-time validation, parameterization and no prohibited table writes. Migration shape reviewed; do not claim SQL executed without isolated test evidence.
- Fake-clock useMe/provider tests: silent loading behavior, aborted body read, stale responses, failures, logout/account switches, long timer rearm, sleep/focus, client skew, mixed paid deadlines, standalone no polling. StrictMode must leave exactly one live timer set/poll, clean on unmount, no duplicate unchanged GA property. Multiple consumers share one request per poll interval.
- Route consumers home/Pricing/PricingInfo/NorthernLights/Success, including open pricing and aurora across expiry/revoke. Successful paid poll then navigate home: Pro/list refresh. Test effective gates and list reload, not merely JSON.
- Entry guards free/manual/paid/mixed. Pricing/Top5 IS+EN manual with no sub and stale monthly/yearly row, paid-pass stale row labels, paid controls. Success manual timeout zero conversion, manual-to-paid once, paid/pass regressions.
- GA bounded source/reset/dedupe, no loading emission/PII/payload changes; admin metrics exclude grant table.
- Relevant auth/entitlement/payment/pass/refund/webhook/pricing/checkout/analytics/UI regression suites, lint, production build. No real Paddle/GA/DB writes. Browser mock contracts match consumers: manual-only, paid overlap, expiry/revoke IS/EN and route transitions. Record exact commands/results, blockers and attribution accurately.

## 7. Runbook, security limit and STOP

Runbook: fake target command examples, UTC --until with exclusive expiry, 366-day DB cap, actor self-assertion, overlapping grants/revoke semantics, revalidation/network limits, schema-first deployment and list verification, failure fallback, rollback code before schema removal, preserve/export audit records. Migration remains unapplied and real reviewer grants unperformed. No claims of live behavior.

Separate security-followup.md: login-email currently issues session from unverified email, live UI calls it; admin authorization relies on session email. Code finding verified, production exposure/upstream controls not verified. Manual grants inherit this identity weakness; short expiry does not fix it. Grant mutation requires DB authority but mailbox-owner exclusivity is NOT established. Repeat in report/runbook; owner triages separately. Do not test exploit, alter auth or create external issue here.

STOP and return to Ripley if scope requires changed paid eligibility/status rules, checkout/webhook/fulfilment/pricing changes, dependencies, public grant endpoint, broad auth redesign or unrelated scoring/gating. Report unrelated security findings without fixing. Do not ask again for narrow server scope already inherent in #433.

Write docs/ai/tasks/ticket-433/cc-report.md with implementation, source audit, tests, SQL limits, unapplied migration, security/analytics/network limitations. Populate CURRENT report path and set CC_COMPLETE AFTER report. Result review path: docs/ai/tasks/ticket-433/result-review.md. No commit/push/deploy/production grant/GitHub closure.
