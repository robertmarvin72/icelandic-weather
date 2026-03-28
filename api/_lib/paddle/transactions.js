import crypto from "crypto";
import { mapUser } from "./mapUser.js";

export async function persistTransaction({ sql, normalized }) {
  const { transactionId, customerId, userId, status, currency, amount, occurredAt, raw } =
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

  return {
    ok: true,
    saved: true,
    paddle_transaction_id: transactionId,
    user_id: user?.id || null,
    status: status || "completed",
    amount,
    currency,
    occurred_at: occurredAt,
  };
}
