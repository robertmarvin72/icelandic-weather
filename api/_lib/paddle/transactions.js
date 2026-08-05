import crypto from "crypto";
import { mapUser } from "./mapUser.js";

export async function persistTransaction({ sql, normalized }) {
  const { transactionId, customerId, userId, status, currency, amount, occurredAt, priceId, billedAt, raw } =
    normalized;

  if (!transactionId) {
    return {
      ok: true,
      saved: false,
      reason: "Missing transaction id",
    };
  }

  if (!currency || amount == null || !occurredAt) {
    return {
      ok: true,
      saved: false,
      paddle_transaction_id: transactionId,
      reason: "Missing amount, currency, or occurredAt in payload",
    };
  }

  const user = await mapUser({ sql, customerId, userId });

  await sql`
    insert into paddle_transaction (
      id,
      paddle_transaction_id,
      user_id,
      status,
      amount,
      currency,
      occurred_at,
      raw
    )
    values (
      ${crypto.randomUUID()},
      ${transactionId},
      ${user?.id || null},
      ${status || "completed"},
      ${amount},
      ${currency},
      ${occurredAt},
      ${sql.json(raw)}
    )
    on conflict (paddle_transaction_id)
    do update set
      user_id = coalesce(excluded.user_id, paddle_transaction.user_id),
      status = excluded.status,
      amount = excluded.amount,
      currency = excluded.currency,
      occurred_at = excluded.occurred_at,
      raw = excluded.raw
  `;

  const baseResult = {
    ok: true,
    saved: true,
    paddle_transaction_id: transactionId,
    user_id: user?.id || null,
    status: status || "completed",
    amount,
    currency,
    occurred_at: occurredAt,
  };

  // ── Pass grant ────────────────────────────────────────────────────────────
  // Only triggered when the transaction's price_id matches a known one-time
  // pass price. Subscription transactions pass straight through.

  const passPrice30 = process.env.PADDLE_PRICE_ID_30_DAY_PASS;
  const passYearPrice = process.env.PADDLE_PRICE_ID_YEAR_PASS;
  const isPass30 = !!(passPrice30 && priceId === passPrice30);
  const isPassYear = !!(passYearPrice && priceId === passYearPrice);

  if (isPass30 || isPassYear) {
    if (!user) {
      console.error(
        `[persistTransaction] Pass purchase for unknown user — no user_pass row created. txn=${transactionId}`
      );
      return { ...baseResult, pass_granted: false, reason: "user_not_found" };
    }

    // Use billed_at as the authoritative timestamp. Fall back to occurred_at
    // if missing. Never fall back to now() — per product rule.
    const billedMs = billedAt
      ? new Date(billedAt).getTime()
      : occurredAt
      ? new Date(occurredAt).getTime()
      : null;

    if (!billedMs || isNaN(billedMs)) {
      console.error(
        `[persistTransaction] Missing billed_at and occurred_at for pass — no user_pass row. txn=${transactionId}`
      );
      return { ...baseResult, pass_granted: false, reason: "missing_billed_at" };
    }

    const passType = isPass30 ? "pass30" : "passyear";
    const durationMs = (isPass30 ? 30 : 365) * 24 * 60 * 60 * 1000;

    // Stacking rule: new pass starts when the current latest active pass ends
    // (if that end is later than billed_at), otherwise starts at billed_at.
    const existingRows = await sql`
      select access_end
      from user_pass
      where user_id = ${user.id}
        and status = 'active'
        and access_end > ${new Date(billedMs).toISOString()}
      order by access_end desc
      limit 1
    `;

    const stackAfterMs = existingRows[0]?.access_end
      ? new Date(existingRows[0].access_end).getTime()
      : null;

    const accessStartMs = stackAfterMs && stackAfterMs > billedMs ? stackAfterMs : billedMs;
    const accessEndMs = accessStartMs + durationMs;

    const accessStart = new Date(accessStartMs).toISOString();
    const accessEnd = new Date(accessEndMs).toISOString();

    await sql`
      insert into user_pass (
        user_id,
        paddle_transaction_id,
        price_id,
        pass_type,
        access_start,
        access_end,
        status,
        raw
      ) values (
        ${user.id},
        ${transactionId},
        ${priceId},
        ${passType},
        ${accessStart},
        ${accessEnd},
        'active',
        ${sql.json(raw)}
      )
      on conflict (paddle_transaction_id) do nothing
    `;

    return {
      ...baseResult,
      pass_granted: true,
      pass_type: passType,
      access_start: accessStart,
      access_end: accessEnd,
    };
  }

  return baseResult;
}

// Revokes the user_pass linked to a Paddle transaction when a refund adjustment
// arrives. Safe for subscription transactions — no user_pass row exists, so
// the UPDATE simply touches 0 rows.
export async function revokePassForTransaction({ sql, normalized }) {
  const { transactionId, action } = normalized;

  if (action !== "refund") {
    return { ok: true, revoked: false, reason: `Skipped non-refund adjustment: ${action}` };
  }

  if (!transactionId) {
    return { ok: true, revoked: false, reason: "Missing transaction_id in adjustment payload" };
  }

  const result = await sql`
    update user_pass
    set status = 'refunded'
    where paddle_transaction_id = ${transactionId}
      and status = 'active'
    returning id
  `;

  return {
    ok: true,
    revoked: result.length > 0,
    paddle_transaction_id: transactionId,
    rows_updated: result.length,
  };
}
