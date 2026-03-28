import { mapUser } from "./mapUser.js";

function normalizeStatus(v) {
  return (
    String(v || "")
      .trim()
      .toLowerCase() || null
  );
}

function inFuture(iso) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

export function computeTier({ status, currentPeriodEnd }) {
  const s = normalizeStatus(status);
  const proStatuses = new Set(["active", "trialing", "past_due"]);

  if (proStatuses.has(s)) return "pro";

  if (s === "canceled" || s === "cancelled") {
    return inFuture(currentPeriodEnd) ? "pro" : "free";
  }

  return "free";
}

export async function mapCustomerToUser({ sql, customerId, userId }) {
  if (!customerId || !userId) {
    return {
      ok: true,
      mapped: false,
      reason: "Missing customerId or custom_data.user_id",
    };
  }

  const rows = await sql`
    update app_user
    set paddle_customer_id = coalesce(paddle_customer_id, ${customerId})
    where id = ${userId}
    returning id, email, paddle_customer_id
  `;

  return {
    ok: true,
    mapped: !!rows[0],
    user_id: rows?.[0]?.id || null,
    paddle_customer_id: rows?.[0]?.paddle_customer_id || null,
  };
}

export async function persistSubscription({ sql, normalized }) {
  const { subscriptionId, customerId, userId, status, priceId, currentPeriodEnd } = normalized;

  const user = await mapUser({ sql, customerId, userId });

  if (!user) {
    return {
      ok: true,
      mapped: false,
      paddle_customer_id: customerId,
      paddle_subscription_id: subscriptionId,
    };
  }

  await sql`
    insert into user_subscription (
      user_id,
      paddle_subscription_id,
      paddle_price_id,
      status,
      current_period_end
    )
    values (
      ${user.id},
      ${subscriptionId},
      ${priceId},
      ${status || "inactive"},
      ${currentPeriodEnd}
    )
    on conflict (user_id)
    do update set
      paddle_subscription_id = excluded.paddle_subscription_id,
      paddle_price_id = excluded.paddle_price_id,
      status = excluded.status,
      current_period_end = coalesce(excluded.current_period_end, user_subscription.current_period_end),
      updated_at = now()
  `;

  const tier = computeTier({ status, currentPeriodEnd });

  await sql`
    update app_user
    set tier = ${tier}
    where id = ${user.id}
  `;

  return {
    ok: true,
    mapped: true,
    user_id: user.id,
    tier,
    status,
    paddle_customer_id: customerId || user.paddle_customer_id || null,
    paddle_subscription_id: subscriptionId,
    paddle_price_id: priceId,
    current_period_end: currentPeriodEnd,
  };
}
