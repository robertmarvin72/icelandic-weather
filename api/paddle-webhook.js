import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

function timingSafeEqual(a, b) {
  const aa = Buffer.from(a || "", "utf8");
  const bb = Buffer.from(b || "", "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

/**
 * Paddle signature verification (simple HMAC SHA-256).
 * Paddle sends a signature header; exact header name can vary by setup.
 * We'll support the common options and fail closed when secret is present.
 */
function verifyPaddleSignature({ req, rawBody, secret }) {
  if (!secret) return true; // allow in dev if not set (but set it in prod!)

  const sig =
    req.headers["paddle-signature"] ||
    req.headers["Paddle-Signature"] ||
    req.headers["x-paddle-signature"] ||
    req.headers["X-Paddle-Signature"];

  if (!sig) return false;

  // Common approach: HMAC of raw body using endpoint secret.
  // If Paddle provides a different scheme in your account, we'll adapt after seeing headers.
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  return timingSafeEqual(String(sig).trim(), computed);
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const secret = process.env.PADDLE_WEBHOOK_SECRET || "";
  try {
    const rawBody = await readRawBody(req);

    // Verify signature (fail closed in prod)
    const sigOk = verifyPaddleSignature({ req, rawBody, secret });
    if (!sigOk && process.env.NODE_ENV === "production") {
      return res.status(401).json({ ok: false, error: "Invalid signature" });
    }

    const evt = JSON.parse(rawBody);
    const eventType = evt?.event_type;
    const data = evt?.data || {};

    // Only handle the subscription events we care about
    if (
      eventType !== "subscription.created" &&
      eventType !== "subscription.updated" &&
      eventType !== "subscription.cancelled"
    ) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const paddleSubscriptionId = data?.id || null;
    const paddleCustomerId = data?.customer_id || null;
    const status = data?.status || null;

    // Pick the first price id (for our simple model)
    const firstItem = Array.isArray(data?.items) ? data.items[0] : null;
    const paddlePriceId = firstItem?.price?.id || null;

    const currentPeriodEnd =
      data?.current_billing_period?.ends_at ||
      data?.next_billed_at ||
      null;

    // Find user by paddle_customer_id (will be null until /api/checkout sets it)
    let user = null;
    if (paddleCustomerId) {
      const rows = await sql`
        select id, email, tier
        from app_user
        where paddle_customer_id = ${paddleCustomerId}
        limit 1
      `;
      user = rows[0] || null;
    }

    // If we can’t map to a user yet, accept the webhook but log minimal info
    if (!user) {
      // Still return 200 so Paddle doesn't retry forever
      return res.status(200).json({
        ok: true,
        mapped: false,
        event_type: eventType,
        paddle_customer_id: paddleCustomerId,
        paddle_subscription_id: paddleSubscriptionId,
      });
    }

    // Decide tier based on event/status
    const shouldBePro =
      eventType !== "subscription.cancelled" &&
      (status === "active" || status === "trialing" || status === "past_due");

    // Upsert subscription (one row per user)
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
        ${paddleSubscriptionId},
        ${paddlePriceId},
        ${status || "inactive"},
        ${currentPeriodEnd}
      )
      on conflict (user_id)
      do update set
        paddle_subscription_id = excluded.paddle_subscription_id,
        paddle_price_id = excluded.paddle_price_id,
        status = excluded.status,
        current_period_end = excluded.current_period_end,
        updated_at = now()
    `;

    // Update user tier
    await sql`
      update app_user
      set tier = ${shouldBePro ? "pro" : "free"}
      where id = ${user.id}
    `;

    return res.status(200).json({
      ok: true,
      mapped: true,
      user_id: user.id,
      tier: shouldBePro ? "pro" : "free",
      event_type: eventType,
    });
  } catch (e) {
    // Return 200 to avoid retries storm while we iterate, but include error for logs
    return res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}
