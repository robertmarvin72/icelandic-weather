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

function getPaddleSignatureHeader(req) {
  return (
    req.headers["paddle-signature"] ||
    req.headers["Paddle-Signature"] ||
    req.headers["x-paddle-signature"] ||
    req.headers["X-Paddle-Signature"]
  );
}

function verifyPaddleSignature({ req, rawBody, secret }) {
  const header = getPaddleSignatureHeader(req);
  const { ts, h1 } = parsePaddleSignatureHeader(header);
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const computed = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return safeEqual(h1, computed);
}

function isProdLike() {
  // Treat production deploys as "must verify"
  // Vercel sets VERCEL_ENV=production for prod deployments
  const vercelEnv = String(process.env.VERCEL_ENV || "").toLowerCase();
  const nodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
  return vercelEnv === "production" || nodeEnv === "production";
}

function toIsoDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function inFuture(iso) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

function normalizeEvent(evt) {
  const eventType = evt?.event_type || "";
  const data = evt?.data || {};

  // Customer events
  if (eventType.startsWith("customer.")) {
    const customerId = data?.id || null;
    const userId = data?.custom_data?.user_id || evt?.data?.custom_data?.user_id || null;

    return {
      kind: "customer",
      eventType,
      customerId,
      userId,
    };
  }

  // Subscription events
  const subscriptionId = data?.id || null;
  const status = (data?.status || "").toLowerCase() || null;

  const customerId = data?.customer_id || data?.customer?.id || null;

  const userId = data?.custom_data?.user_id || evt?.data?.custom_data?.user_id || null;

  const firstItem = Array.isArray(data?.items) ? data.items[0] : null;
  const priceId = firstItem?.price?.id || null;

  const currentPeriodEnd = data?.current_billing_period?.ends_at || data?.next_billed_at || null;

  return {
    kind: "subscription",
    eventType,
    subscriptionId,
    customerId,
    userId,
    status,
    priceId,
    currentPeriodEnd: toIsoDateOrNull(currentPeriodEnd),
  };
}

async function mapUser({ customerId, userId }) {
  // 1) Map by paddle_customer_id
  if (customerId) {
    const rows = await sql`
      select id, email, tier, paddle_customer_id
      from app_user
      where paddle_customer_id = ${customerId}
      limit 1
    `;
    if (rows[0]) return rows[0];
  }

  // 2) Fallback by custom_data.user_id
  if (userId) {
    const rows = await sql`
      select id, email, tier, paddle_customer_id
      from app_user
      where id = ${userId}
      limit 1
    `;
    const u = rows[0] || null;

    // If found and we have customerId, store it (only if empty)
    if (u && customerId) {
      await sql`
        update app_user
        set paddle_customer_id = ${customerId}
        where id = ${u.id} and paddle_customer_id is null
      `;
      // return updated view
      return { ...u, paddle_customer_id: u.paddle_customer_id || customerId };
    }

    return u;
  }

  return null;
}

function computeTier({ status, currentPeriodEnd }) {
  // Paddle statuses can vary; keep this conservative.
  // "active" / "trialing" / "past_due" => pro
  // "canceled" / "cancelled" => pro UNTIL current_period_end (if in future), else free
  // other => free
  const s = (status || "").toLowerCase();

  const proStatuses = new Set(["active", "trialing", "past_due"]);

  if (proStatuses.has(s)) return "pro";

  if (s === "canceled" || s === "cancelled") {
    return inFuture(currentPeriodEnd) ? "pro" : "free";
  }

  return "free";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const secret = String(process.env.PADDLE_WEBHOOK_SECRET || "");
  if (!secret && isProdLike()) {
    // Fail hard in production if signature verification can't happen
    return res.status(500).json({ ok: false, error: "Missing PADDLE_WEBHOOK_SECRET" });
  }

  let rawBody = "";
  try {
    rawBody = await readRawBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: "Could not read body" });
  }

  // Verify signature (strict if secret exists)
  if (secret) {
    const sigOk = verifyPaddleSignature({ req, rawBody, secret });
    if (!sigOk) {
      return res.status(401).json({ ok: false, error: "Invalid signature" });
    }
  }

  let evt;
  try {
    evt = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  const eventType = evt?.event_type || "";

  const allowed = new Set([
    // Customer mapping (helps avoid null paddle_customer_id)
    "customer.created",
    "customer.updated",

    // Subscription lifecycle
    "subscription.created",
    "subscription.updated",
    "subscription.canceled",
    "subscription.cancelled",
  ]);

  if (!allowed.has(eventType)) {
    return res.status(200).json({ ok: true, ignored: true, event_type: eventType });
  }

  const normalized = normalizeEvent(evt);

  try {
    // ───────────────────────────────────────────────────────────
    // Customer events: write paddle_customer_id onto app_user
    // ───────────────────────────────────────────────────────────
    if (normalized.kind === "customer") {
      const { customerId, userId } = normalized;

      if (!customerId || !userId) {
        return res.status(200).json({
          ok: true,
          mapped: false,
          event_type: eventType,
          reason: "Missing customerId or custom_data.user_id",
        });
      }

      const rows = await sql`
        update app_user
        set paddle_customer_id = coalesce(paddle_customer_id, ${customerId})
        where id = ${userId}
        returning id, email, paddle_customer_id
      `;

      return res.status(200).json({
        ok: true,
        mapped: !!rows[0],
        event_type: eventType,
        user_id: rows?.[0]?.id || null,
        paddle_customer_id: rows?.[0]?.paddle_customer_id || null,
      });
    }

    // ───────────────────────────────────────────────────────────
    // Subscription events: upsert user_subscription + update cached tier
    // ───────────────────────────────────────────────────────────
    const { subscriptionId, customerId, userId, status, priceId, currentPeriodEnd } = normalized;

    const user = await mapUser({ customerId, userId });

    if (!user) {
      return res.status(200).json({
        ok: true,
        mapped: false,
        event_type: eventType,
        paddle_customer_id: customerId,
        paddle_subscription_id: subscriptionId,
      });
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

    // Cached convenience
    await sql`
      update app_user
      set tier = ${tier}
      where id = ${user.id}
    `;

    return res.status(200).json({
      ok: true,
      mapped: true,
      event_type: eventType,
      user_id: user.id,
      tier,
      status,
      paddle_customer_id: customerId || user.paddle_customer_id || null,
      paddle_subscription_id: subscriptionId,
      paddle_price_id: priceId,
      current_period_end: currentPeriodEnd,
    });
  } catch (e) {
    // Internal error => return 500 so Paddle retries.
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
