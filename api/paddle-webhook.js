// api/paddle-webhook.js
import postgres from "postgres";
import crypto from "crypto";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

// Paddle-Signature: "ts=...;h1=...;h1=..."
function parsePaddleSignature(headerValue = "") {
  const parts = String(headerValue)
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);

  const out = { ts: null, h1: [] };

  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k || !v) continue;
    if (k === "ts") out.ts = v;
    if (k === "h1") out.h1.push(v);
  }
  return out;
}

function timingSafeEqualHex(a, b) {
  const aa = Buffer.from(String(a || ""), "hex");
  const bb = Buffer.from(String(b || ""), "hex");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function getSignatureHeader(req) {
  // Node lowercases header names
  return req.headers["paddle-signature"] || req.headers["x-paddle-signature"] || "";
}

function verifyPaddleSignature({ req, rawBody, secret }) {
  if (!secret) return true; // allow only if you truly didn't set the secret

  const sigHeader = getSignatureHeader(req);
  if (!sigHeader) return false;

  const { ts, h1 } = parsePaddleSignature(sigHeader);
  if (!ts || !h1?.length) return false;

  // Paddle Billing v2: HMAC_SHA256(secret, `${ts}:${rawBody}`)
  const signedPayload = `${ts}:${rawBody}`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return h1.some((candidate) => timingSafeEqualHex(candidate, expected));
}

function shouldBePro({ eventType, status }) {
  if (eventType === "subscription.cancelled") return false;
  return status === "active" || status === "trialing" || status === "past_due";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const secret = process.env.PADDLE_WEBHOOK_SECRET || "";

  try {
    const rawBody = await readRawBody(req);

    // Verify signature (fail closed if secret is set)
    const sigOk = verifyPaddleSignature({ req, rawBody, secret });
    if (!sigOk) {
      return res.status(401).json({ ok: false, error: "Invalid signature" });
    }

    const evt = JSON.parse(rawBody);
    const eventType = evt?.event_type;
    const data = evt?.data || {};

    // We only care about these events
    if (
      eventType !== "subscription.created" &&
      eventType !== "subscription.updated" &&
      eventType !== "subscription.cancelled"
    ) {
      return res.status(200).json({ ok: true, ignored: true, event_type: eventType });
    }

    const paddleSubscriptionId = data?.id || null;
    const paddleCustomerId = data?.customer_id || null;
    const status = data?.status || "inactive";

    // first item price id (simple model)
    const firstItem = Array.isArray(data?.items) ? data.items[0] : null;
    const paddlePriceId = firstItem?.price?.id || null;

    const currentPeriodEnd =
      data?.current_billing_period?.ends_at ||
      data?.next_billed_at ||
      null;

    // Map to user by paddle_customer_id (you will set this during checkout)
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

    // If we can’t map yet, return 200 so Paddle doesn't retry forever.
    if (!user) {
      return res.status(200).json({
        ok: true,
        mapped: false,
        event_type: eventType,
        paddle_customer_id: paddleCustomerId,
        paddle_subscription_id: paddleSubscriptionId,
      });
    }

    const pro = shouldBePro({ eventType, status });

    // Upsert one subscription row per user (requires UNIQUE(user_id) in user_subscription)
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
        ${status},
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
      set tier = ${pro ? "pro" : "free"}
      where id = ${user.id}
    `;

    return res.status(200).json({
      ok: true,
      mapped: true,
      user_id: user.id,
      tier: pro ? "pro" : "free",
      event_type: eventType,
    });
  } catch (e) {
    // Prefer 500 so þú sérð villuna strax í logs (Paddle mun retry-a, sem er gott í raun)
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
