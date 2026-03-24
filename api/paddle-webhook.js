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

function normalizeStatus(v) {
  return (
    String(v || "")
      .trim()
      .toLowerCase() || null
  );
}

function parseAmountToMajor(value) {
  if (value == null) return null;

  // Already numeric
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const s = String(value).trim();
  if (!s) return null;

  // Decimal-looking string => assume already major units
  if (s.includes(".")) {
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  // Integer-looking string => assume minor units (e.g. cents)
  if (/^-?\d+$/.test(s)) {
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n / 100 : null;
  }

  return null;
}

function extractTransactionAmount(data) {
  // Prefer details totals if present.
  const candidates = [
    data?.details?.totals?.total,
    data?.details?.totals?.grand_total,
    data?.totals?.total,
    data?.totals?.grand_total,
    data?.payments?.[0]?.amount,
    data?.payments?.[0]?.total,
  ];

  for (const candidate of candidates) {
    const parsed = parseAmountToMajor(candidate);
    if (parsed != null) return parsed;
  }

  return null;
}

function normalizeEvent(evt) {
  const eventType = evt?.event_type || "";
  const data = evt?.data || {};

  // Transaction events
  if (eventType.startsWith("transaction.")) {
    const transactionId = data?.id || null;
    const status = normalizeStatus(data?.status);
    const customerId = data?.customer_id || data?.customer?.id || null;
    const userId = data?.custom_data?.user_id || evt?.data?.custom_data?.user_id || null;
    const currency = data?.currency_code || null;
    const amount = extractTransactionAmount(data);
    const occurredAt = toIsoDateOrNull(evt?.occurred_at || data?.billed_at || data?.updated_at);

    return {
      kind: "transaction",
      eventType,
      transactionId,
      customerId,
      userId,
      status,
      currency,
      amount,
      occurredAt,
      raw: evt,
    };
  }

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
  const status = normalizeStatus(data?.status);

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
      return { ...u, paddle_customer_id: u.paddle_customer_id || customerId };
    }

    return u;
  }

  return null;
}

function computeTier({ status, currentPeriodEnd }) {
  const s = normalizeStatus(status);

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
    return res.status(500).json({ ok: false, error: "Missing PADDLE_WEBHOOK_SECRET" });
  }

  let rawBody = "";
  try {
    rawBody = await readRawBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: "Could not read body" });
  }

  if (secret) {
    const sigOk = verifyPaddleSignature({ req, rawBody, secret });
    if (!sigOk) {
      return res.status(403).json({ ok: false, error: "invalid_webhook_signature" });
    }
  }

  if (!secret && !isProdLike()) {
    console.warn(
      "PADDLE_WEBHOOK_SECRET missing - signature verification skipped in non-production"
    );
  }

  let evt;
  try {
    evt = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  const eventType = evt?.event_type || "";

  const allowed = new Set([
    // Customer mapping
    "customer.created",
    "customer.updated",

    // Subscription lifecycle
    "subscription.created",
    "subscription.updated",
    "subscription.canceled",
    "subscription.cancelled",

    // Revenue source of truth
    "transaction.completed",
  ]);

  if (!allowed.has(eventType)) {
    return res.status(200).json({ ok: true, ignored: true, event_type: eventType });
  }

  const normalized = normalizeEvent(evt);

  try {
    // ───────────────────────────────────────────────────────────
    // Transaction events: upsert revenue row
    // ───────────────────────────────────────────────────────────
    if (normalized.kind === "transaction") {
      const { transactionId, customerId, userId, status, currency, amount, occurredAt, raw } =
        normalized;

      if (!transactionId) {
        return res.status(200).json({
          ok: true,
          saved: false,
          event_type: eventType,
          reason: "Missing transaction id",
        });
      }

      if (!currency || amount == null || !occurredAt) {
        return res.status(200).json({
          ok: true,
          saved: false,
          event_type: eventType,
          paddle_transaction_id: transactionId,
          reason: "Missing amount, currency, or occurredAt in payload",
        });
      }

      const user = await mapUser({ customerId, userId });

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

      return res.status(200).json({
        ok: true,
        saved: true,
        event_type: eventType,
        paddle_transaction_id: transactionId,
        user_id: user?.id || null,
        status: status || "completed",
        amount,
        currency,
        occurred_at: occurredAt,
      });
    }

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
