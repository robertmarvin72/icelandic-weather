import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function parsePaddleSignatureHeader(headerValue) {
  // Example: "ts=1671552777;h1=abcdef..."
  const out = { ts: null, h1: null };
  if (!headerValue) return out;

  const parts = String(headerValue)
    .split(";")
    .map((p) => p.trim());

  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    const v = rest.join("=");
    if (k === "ts") out.ts = v;
    if (k === "h1") out.h1 = v;
  }
  return out;
}

function verifyPaddleSignature({ req, rawBody, secret }) {
  if (!secret) return true; // allow if secret not set (dev), but set it in prod

  const header =
    req.headers["paddle-signature"] ||
    req.headers["Paddle-Signature"] ||
    req.headers["x-paddle-signature"] ||
    req.headers["X-Paddle-Signature"];

  const { ts, h1 } = parsePaddleSignatureHeader(header);
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return safeEqual(h1, computed);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const secret = process.env.PADDLE_WEBHOOK_SECRET || "";

  try {
    const rawBody = await readRawBody(req);

    const sigOk = verifyPaddleSignature({ req, rawBody, secret });
    if (!sigOk && process.env.NODE_ENV === "production") {
      return res.status(401).json({ ok: false, error: "Invalid signature" });
    }

    const evt = JSON.parse(rawBody);
    const eventType = evt?.event_type;
    const data = evt?.data || {};

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

    const firstItem = Array.isArray(data?.items) ? data.items[0] : null;
    const paddlePriceId = firstItem?.price?.id || null;

    const currentPeriodEnd =
      data?.current_billing_period?.ends_at || data?.next_billed_at || null;

    // Try mapping:
    // 1) by paddle_customer_id
    // 2) fallback: by custom_data.user_id (if you pass it via /api/checkout)
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

    if (!user) {
      const userIdFromCustom =
        data?.custom_data?.user_id || evt?.data?.custom_data?.user_id || null;

      if (userIdFromCustom) {
        const rows = await sql`
          select id, email, tier
          from app_user
          where id = ${userIdFromCustom}
          limit 1
        `;
        user = rows[0] || null;

        // If we found user and have paddleCustomerId, store it for future
        if (user && paddleCustomerId) {
          await sql`
            update app_user
            set paddle_customer_id = ${paddleCustomerId}
            where id = ${user.id} and paddle_customer_id is null
          `;
        }
      }
    }

    if (!user) {
      return res.status(200).json({
        ok: true,
        mapped: false,
        event_type: eventType,
        paddle_customer_id: paddleCustomerId,
        paddle_subscription_id: paddleSubscriptionId,
      });
    }

    const shouldBePro =
      eventType !== "subscription.cancelled" &&
      (status === "active" || status === "trialing" || status === "past_due");

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
    // Return 200 so Paddle doesn't retry-spam you while iterating
    return res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}
