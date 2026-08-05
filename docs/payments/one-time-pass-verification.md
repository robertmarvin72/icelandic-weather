# One-time pass — production smoke-test plan

Run after deploying the backend changes to Vercel production.

---

## Pre-conditions

- `PADDLE_PRICE_ID_30_DAY_PASS` and `PADDLE_PRICE_ID_YEAR_PASS` are set in Vercel env (production).
- `user_pass` table exists in Neon production (schema: `docs/payments/sql/user_pass.sql`).
- `adjustment.created` is enabled in Paddle dashboard webhook settings.
- Test user account created at campcast.is / eltumvedrid.is with a verified email.

---

## Step 1 — 30-day pass: purchase

1. Log in as the test user.
2. Initiate a 30-day pass checkout (POST `/api/checkout` with `plan: "pass30"` via the pricing UI or curl).
3. Complete payment in Paddle checkout.
4. Expected webhook: `transaction.completed` arrives at `/api/paddle-webhook`.
5. Verify in Neon:
   ```sql
   SELECT * FROM user_pass WHERE user_id = '<test-user-id>' ORDER BY created_at DESC LIMIT 1;
   ```
   - `status = 'active'`
   - `pass_type = 'pass30'`
   - `access_start` ≈ transaction `billed_at` (not `now()`)
   - `access_end` = `access_start + 30 days`
   - `paddle_transaction_id` matches Paddle transaction ID
6. Call `GET /api/me` — verify `entitlements.pro = true` and `proUntil` = `access_end`.
7. Verify Pro features are accessible in the app.

---

## Step 2 — 30-day pass: pass-holder buys a subscription

1. As the same test user (active pass), initiate a monthly subscription checkout.
2. Expected: checkout proceeds normally (no 409 from subscription guard).
3. Complete payment.
4. Verify both rows exist:
   - `user_pass` row: unchanged, still `status = 'active'`
   - `user_subscription` row: new or updated with `status = 'active'`
5. Call `GET /api/me` — verify `pro = true`, `proUntil` = latest of the two access ends.

---

## Step 3 — Refund

1. In Paddle dashboard, refund the 30-day pass transaction from Step 1.
2. Expected webhook: `adjustment.created` with `action = 'refund'` arrives.
3. Verify in Neon:
   ```sql
   SELECT status FROM user_pass WHERE paddle_transaction_id = '<txn-id>';
   ```
   - `status = 'refunded'`
4. Call `GET /api/me` — if the user's only Pro source was this pass, `entitlements.pro = false`.
   - If the user also has an active subscription (Step 2), `pro` remains `true`.

---

## Step 4 — Pass stacking

1. As a test user with an active pass (e.g. `access_end = 2026-09-03`), purchase a second 30-day pass.
2. Verify in Neon: the new `user_pass` row has:
   - `access_start` = previous `access_end` (2026-09-03), not the new `billed_at`
   - `access_end` = `access_start + 30 days`

---

## Step 5 — Expiry (passive)

1. Find or create a `user_pass` row with `access_end` in the past.
2. Call `GET /api/me` — verify `entitlements.pro = false` (no active subscription either).
3. No webhook needed — expiry is purely time-based.

---

## Step 6 — Admin summary

1. Call `GET /api/admin?action=summary` as an admin user.
2. Verify the `pro.active` count includes pass-only users.
3. Verify a user with both a subscription and a pass is counted once.

---

## Webhook events to verify are enabled in Paddle dashboard

- [ ] `transaction.completed` ✓ (already enabled before this change)
- [ ] `adjustment.created` — **must be enabled manually** (new event added in this implementation)
- [ ] `subscription.created` / `subscription.updated` / `subscription.canceled` ✓

---

## Notes

- Do not simulate purchases in sandbox — the one-time pass Price IDs only exist in production.
- After verifying Step 3 (refund), recreate the test pass before running Step 4/5.
- The `raw` column in `user_pass` stores the full Paddle webhook payload for debugging.
