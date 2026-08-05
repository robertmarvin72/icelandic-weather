# One-time pass audit — Paddle checkout & Pro access

**Date:** 2026-08-04  
**Scope:** Main repo only. Checkout UI lives at pay.eltumvedrid.is (separate repo) and is marked where relevant.

---

## A. Current flow

```
Pricing page
  → POST /api/checkout (plan: "monthly"|"yearly")
      → ensurePaddleCustomer → POST /customers (Paddle API)
      → POST /transactions (Paddle API) with price_id + custom_data
      → returns checkout URL
        → [pay.eltumvedrid.is — Not available in this repo]
          → user pays → Paddle fires webhook
            → POST /api/paddle-webhook
                → verifyPaddleSignature (HMAC-SHA256)
                → normalizeEvent → kind: "subscription" | "transaction" | "customer"
                    → kind=subscription → persistSubscription()
                        → upsert user_subscription (status, current_period_end, paddle_price_id)
                        → computeTier() → update app_user.tier
                    → kind=transaction → persistTransaction()
                        → insert paddle_transaction (log only — no access granted)
                    → kind=customer → mapCustomerToUser()
            → GET /api/me (on next page load)
                → getMeFromRequest() → runtime check:
                    endsInFuture(current_period_end) && status ∈ {active, trialing, past_due, canceled, cancelled}
                    → entitlements.pro = true/false
                → frontend RequireFeature → isFeatureAvailable() → isPro check
```

---

## B. Findings

| Area | Current implementation | File / function | Risk or limitation |
|---|---|---|---|
| Price ID mapping | Two env vars: `PADDLE_PRICE_ID_MONTHLY`, `PADDLE_PRICE_ID_YEARLY`. Plan string `"monthly"\|"yearly"` selects one. | `api/checkout.js:198–204` | No path for a third Price ID. A one-time pass plan string is unrecognised. |
| Checkout guard | Blocks re-subscribe if subscription exists and `current_period_end` is in future. Allows monthly→yearly upgrade via PATCH. | `api/checkout.js:209–289` | Guard is subscription-only. Pass purchase by an existing subscriber has no defined path. |
| `custom_data` sent to Paddle | `{ app, user_id, email, plan, attribution, qr_source }` | `api/checkout.js:321–329` | `plan` field only carries "monthly"/"yearly" — not a pass type. `user_id` is the link back to the DB row. |
| Webhook allowlist | `customer.created/updated`, `subscription.created/updated/canceled/cancelled`, `transaction.completed` | `api/_lib/paddle/normalize.js:118–128` | `transaction.completed` IS allowed. |
| `transaction.completed` handler | `persistTransaction()`: inserts/upserts into `paddle_transaction` (log). **Does not update `user_subscription` or `app_user.tier`.** | `api/_lib/paddle/transactions.js:4–68` | A one-time purchase fires `transaction.completed` — it is received and logged, but access is NOT granted. This is the primary gap. |
| Subscription webhook handler | `persistSubscription()`: upserts `user_subscription` (1 row per user), calls `computeTier()`, updates `app_user.tier`. | `api/_lib/paddle/subscriptions.js:55–114` | One row per user (unique constraint on `user_id`). Subscription and pass cannot coexist in this table independently. |
| Pro computation | Runtime: `endsInFuture(current_period_end) && status ∈ allowed`. No cron, no scheduled expiry. | `api/_lib/getMe.js:101–111` | Passive expiry works correctly for subscriptions. Would also work for a pass if `current_period_end` and a suitable `status` are written. |
| `app_user.tier` field | Written by `computeTier()` on subscription events. **Not read by `/api/me` for Pro gating** — that uses `user_subscription` runtime check. | `api/_lib/paddle/subscriptions.js:95–101`, `api/_lib/getMe.js` | `tier` is computed but redundant for entitlement decisions. Safe to extend. |
| `paddle_transaction` table | Columns: `id`, `paddle_transaction_id` (unique), `user_id`, `status`, `amount`, `currency`, `occurred_at`, `raw`. Idempotent. | `api/_lib/paddle/transactions.js` | Good audit log. Does not carry `price_id` or `pass_type`. No link to Pro access. |
| Expiration / cancellation | `subscription.canceled` → status saved, Pro continues until `current_period_end` via runtime check. No background job. | `api/_lib/paddle/subscriptions.js:18–28` | Correct for subscriptions. No equivalent event for one-time pass expiry — expiry is purely time-based and passive. |
| Idempotency | Transactions: `ON CONFLICT (paddle_transaction_id) DO UPDATE`. Subscriptions: `ON CONFLICT (user_id) DO UPDATE`. | `transactions.js:48`, `subscriptions.js:86` | Duplicate webhooks are handled safely. |
| `user_subscription` schema | `user_id` (unique), `paddle_subscription_id`, `paddle_price_id`, `status`, `current_period_end`, `qr_source`, timestamps. | `subscriptions.js:70–93` | No `access_source`, `pass_type`, `access_start`, or Paddle `transaction_id`. One row per user is a structural limit. |

---

## C. One-time pass gaps

**Required**

1. **`transaction.completed` must grant access.** `persistTransaction()` currently logs only. It must also upsert a pass-access record with a computed `access_end` date and activate Pro.
2. **Price ID → pass type mapping.** New env vars needed (`PADDLE_PRICE_ID_PASS_30D`, `PADDLE_PRICE_ID_PASS_YEAR`). Webhook handler must read `price_id` from the transaction line items (currently not extracted in `normalizeEvent` for transactions) and map it to a duration.
3. **`normalizeEvent` must extract `price_id` for transactions.** Currently `normalize.js` does not parse line items for `transaction.*` events; it only does so for `subscription.*` events.
4. **`checkout.js` must accept `plan: "pass30" | "passyear"`.** The plan-to-Price-ID map must include pass plans.
5. **Storage for pass access.** Either a new `user_pass` table or additional columns on `user_subscription`. The unique constraint on `user_id` in `user_subscription` blocks concurrent subscription + pass without schema changes.
6. **`getMeFromRequest()` must consider pass access.** If a separate table is used, `proActive` must OR together subscription and pass validity.

**Recommended**

7. **Processed-event deduplication for pass grants.** Store the `paddle_transaction_id` in the pass record as a unique key so re-delivered webhooks do not extend the pass a second time.
8. **Admin panel visibility.** `admin.js` `getRevenueSummary()` already reads `paddle_transaction`; pass revenue is captured. Pass access count should be surfaced in `getProSummary()`.

**Optional**

9. **Pass stacking policy enforcement.** If a user buys two passes, decide server-side whether to extend from `now()` or from current `access_end`. Enforce in the webhook handler.
10. **Refund webhook handling.** `transaction.updated` with `status: "refunded"` could revoke access. Currently no handler.

---

## D. Recommended access model

**Recommendation: one `pro_access_until` field on `app_user`, plus a separate `user_pass` table.**

Rationale from the current code:

- `getMeFromRequest()` already does a runtime check (`endsInFuture && status`). The simplest change would be to add a single `app_user.pro_access_until` column and OR it into that check. This handles the "pass overrides everything" case in one place.
- `user_subscription` has a unique-per-user constraint and subscription-specific fields (`paddle_subscription_id`, `status`). Cramming pass data into it creates a conflict: the upsert would overwrite the subscription's `paddle_subscription_id` and `status` with `NULL`/`"completed"` if a subscriber buys a pass.
- A separate `user_pass` table with columns `(id, user_id, paddle_transaction_id UNIQUE, price_id, pass_type, access_start, access_end, status, raw_event)` is clean, append-only, and stacking-safe.
- `app_user.pro_access_until` can be a derived/cached value recomputed when subscriptions or passes change, or it can be computed on the fly in `getMeFromRequest()` by taking `MAX(user_subscription.current_period_end, MAX(user_pass.access_end))`.

Do **not** extend `user_subscription` for passes. The unique constraint and subscription-specific fields make it the wrong table.

---

## E. Implementation plan

**Step 1 — Add `user_pass` table**
- Goal: persistent record for each one-time pass purchase.
- Migration: `CREATE TABLE user_pass (id uuid primary key, user_id uuid references app_user(id), paddle_transaction_id text unique, price_id text, pass_type text, access_start timestamptz, access_end timestamptz, status text, raw jsonb, created_at timestamptz default now())`.
- Risk: none (additive).
- Test: insert a row manually; verify unique constraint on `paddle_transaction_id`.

**Step 2 — Extend `normalizeEvent` to extract `price_id` for transactions**
- Goal: `normalized.priceId` is available in `persistTransaction()`.
- File: `api/_lib/paddle/normalize.js` — parse `data.items[0].price.id` in the `transaction.*` branch.
- Risk: low; normalize is well-tested.
- Test: unit-test `normalizeEvent` with a `transaction.completed` fixture containing line items.

**Step 3 — Add pass Price ID env vars and plan mapping in checkout**
- Goal: `plan: "pass30" | "passyear"` produces the correct one-time Paddle Price ID.
- Files: `api/checkout.js` (plan→priceId map), `.env` / Vercel env config.
- DB change: none.
- Risk: must not break existing monthly/yearly guard logic; add pass plans to an `else` branch that bypasses the subscription duplicate check.
- Test: POST `/api/checkout` with `plan: "pass30"` and verify checkout URL is returned.

**Step 4 — `persistTransaction()` grants pass access**
- Goal: on `transaction.completed` with a known pass Price ID, upsert a `user_pass` row and set `access_end = now() + 30 days` (or 365 days).
- File: `api/_lib/paddle/transactions.js` — add pass-price detection after saving the raw record.
- Risk: must be idempotent (`ON CONFLICT (paddle_transaction_id) DO UPDATE`). Must not affect subscription rows.
- Test: send a mock `transaction.completed` webhook with pass Price ID; verify `user_pass` row created and `access_end` set.

**Step 5 — Update `getMeFromRequest()` to include pass access**
- Goal: `proActive = true` if either subscription OR any active pass covers now.
- File: `api/_lib/getMe.js` — add a second query: `SELECT access_end FROM user_pass WHERE user_id = $1 AND access_end > now() LIMIT 1`. OR the result into `proActive`.
- Risk: adds one DB query per `/api/me` call. Index `user_pass(user_id, access_end)`.
- Test: create a `user_pass` row for a user with no subscription; call `/api/me` and verify `entitlements.pro = true`.

**Step 6 — Update `checkout.js` subscription guard for pass holders**
- Goal: a pass holder should be able to buy a subscription (or vice versa) without getting a 409.
- File: `api/checkout.js` — the duplicate-subscription guard must not block a pass purchase, and a subscription checkout for a pass holder must proceed.
- Risk: moderate; guard logic is non-trivial. Add explicit `plan.startsWith("pass")` early-exit that skips all subscription checks.
- Test: authenticated user with active subscription POSTs `pass30` checkout; must return checkout URL, not 409.

**Step 7 — Admin visibility for pass access**
- Goal: `getProSummary()` includes pass holders in the active count.
- File: `api/admin.js` — extend the CTE to LEFT JOIN `user_pass` and OR in `access_end > now()`.
- Risk: low; read-only query change.
- Test: create a pass user; admin summary must reflect them in active count.

**Step 8 — Smoke test end-to-end in sandbox**
- Goal: full flow from checkout to Pro access.
- Steps: sandbox Paddle one-time price → checkout → webhook → verify `user_pass` row → verify `/api/me` returns `pro: true` → wait for `access_end` (or set it to past manually) → verify `/api/me` returns `pro: false`.

---

## F. Open decisions

1. **Pass stacking:** If a user with an active pass buys another pass, does `access_end` extend from `now()` or from the current `access_end`? Extending from current end is fairer but more complex to implement.
2. **Subscription + active pass:** If a subscriber's subscription lapses but they have an active pass, does pass coverage kick in? (Recommended: yes — `getMeFromRequest()` ORs them.)
3. **Active subscriber buys a pass:** Should this be blocked, or should both be stored independently? (Recommendation: allow; a pass is an independent purchase and should not conflict with a subscription.)
4. **Refund handling:** Does a refunded transaction revoke pass access immediately? Requires handling `transaction.updated` with `status: "refunded"`. Currently no such handler exists.
5. **Annual pass duration:** 365 calendar days from purchase, or until end of the same calendar month next year?
6. **Email mismatch at checkout:** Paddle customer is looked up by `paddle_customer_id` or `user_id` in `custom_data`. If a user completes checkout with a different email, `mapUser()` falls back to `user_id` — this is already handled. Confirm that checkout always sends `user_id` in `custom_data` for passes (it does currently for subscriptions).
7. **`past_due` passes:** For passes there is no billing retry, so `status` from `transaction.completed` will always be `"completed"`. The `past_due` status concept does not apply. Confirm `user_pass.status` can be simply `"active"` / `"refunded"`.

---

## G. Manual verification checklist

- [ ] **Paddle dashboard:** Confirm which webhook events are currently enabled. Specifically verify `transaction.completed` is checked. Check if `transaction.updated` (for refunds) is enabled.
- [ ] **Paddle dashboard:** Confirm whether one-time Price IDs for a 30-day pass and an annual pass have been created, or need to be created in sandbox first.
- [ ] **Checkout repo (pay.eltumvedrid.is):** Verify whether the checkout UI hardcodes `plan: "monthly"|"yearly"` or reads the plan from a query parameter. A one-time pass flow needs to pass `plan: "pass30"` or equivalent.
- [ ] **Checkout repo:** Confirm `custom_data.user_id` is sent for all checkout types, not just subscriptions.
- [ ] **Paddle dashboard:** Verify that `transaction.completed` fires for one-time purchases in sandbox (some Paddle plans only fire `subscription.*` events).
- [ ] **Neon DB:** Confirm current `user_subscription` column list matches what `subscriptions.js` inserts (especially `qr_source` — check if migration has been applied to prod).
- [ ] **Neon DB:** Confirm `paddle_transaction` table exists in production (created at some point — no migration file was found in this repo).
- [ ] **Vercel:** Confirm `PADDLE_PRICE_ID_MONTHLY` and `PADDLE_PRICE_ID_YEARLY` are set correctly in both preview and production environments before adding new price env vars.
