// api/_lib/getMe.js
import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

const SESSION_COOKIE = "cc_session";

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getCookie(req, name) {
  const header = req.headers?.cookie || "";
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx);
    const v = part.slice(idx + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

/**
 * Shared "me" resolver:
 * - validates cc_session cookie -> token_hash -> user_session -> app_user
 * - loads user_subscription (0..1)
 * - derives plan from env price IDs
 * - computes entitlements.pro and proUntil
 *
 * Returns null if not logged in / invalid session.
 * Otherwise returns:
 * { user, subscription, entitlements }
 */
export async function getMeFromRequest(req) {
  const rawToken = getCookie(req, SESSION_COOKIE);
  if (!rawToken) return null;

  const tokenHash = sha256Hex(rawToken);

  const rows = await sql`
    select
      u.id as user_id,
      u.email,
      u.tier,
      u.display_name,
      u.created_at,

      s.expires_at,
      s.revoked_at
    from user_session s
    join app_user u on u.id = s.user_id
    where s.token_hash = ${tokenHash}
      and s.revoked_at is null
      and s.expires_at > now()
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  const user = {
    id: row.user_id,
    email: row.email,
    tier: row.tier,
    display_name: row.display_name,
    created_at: row.created_at,
  };

  const subs = await sql`
    select
      id,
      status,
      current_period_end,
      paddle_subscription_id,
      paddle_price_id,
      created_at,
      updated_at
    from user_subscription
    where user_id = ${user.id}
    limit 1
  `;

  const sub = subs[0] || null;

  // Plan derivation (keep exactly as you had it)
  const priceMonthly = process.env.PADDLE_PRICE_ID_MONTHLY;
  const priceYearly = process.env.PADDLE_PRICE_ID_YEARLY;
  const plan =
    sub?.paddle_price_id && priceYearly && sub.paddle_price_id === priceYearly
      ? "yearly"
      : sub?.paddle_price_id && priceMonthly && sub.paddle_price_id === priceMonthly
      ? "monthly"
      : sub
      ? "unknown"
      : null;

  const endsInFuture = !!(
    sub?.current_period_end && new Date(sub.current_period_end) > new Date()
  );

  const status = (sub?.status || "").toLowerCase();

  // Keep your “soft statuses allowed” behavior
  const proActive =
    endsInFuture &&
    ["active", "trialing", "past_due", "canceled", "cancelled"].includes(status);

  return {
    user,
    subscription: sub ? { ...sub, plan } : null,
    entitlements: {
      pro: !!proActive,
      proUntil: sub?.current_period_end || null,
    },
  };
}
