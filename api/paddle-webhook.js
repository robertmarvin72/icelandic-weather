import postgres from "postgres";
import { readRawBody, verifyPaddleSignature, isProdLike } from "./_lib/paddle/verify.js";
import { normalizeEvent, getAllowedPaddleEvents } from "./_lib/paddle/normalize.js";
import { mapCustomerToUser, persistSubscription } from "./_lib/paddle/subscriptions.js";
import { persistTransaction } from "./_lib/paddle/transactions.js";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

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
  const allowed = getAllowedPaddleEvents();

  if (!allowed.has(eventType)) {
    return res.status(200).json({ ok: true, ignored: true, event_type: eventType });
  }

  const normalized = normalizeEvent(evt);

  try {
    if (normalized.kind === "transaction") {
      const result = await persistTransaction({ sql, normalized });
      return res.status(200).json({
        ...result,
        event_type: eventType,
      });
    }

    if (normalized.kind === "customer") {
      const result = await mapCustomerToUser({
        sql,
        customerId: normalized.customerId,
        userId: normalized.userId,
      });

      return res.status(200).json({
        ...result,
        event_type: eventType,
      });
    }

    const result = await persistSubscription({ sql, normalized });

    return res.status(200).json({
      ...result,
      event_type: eventType,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
