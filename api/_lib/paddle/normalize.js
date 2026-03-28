function toIsoDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
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

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const s = String(value).trim();
  if (!s) return null;

  if (s.includes(".")) {
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  if (/^-?\d+$/.test(s)) {
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n / 100 : null;
  }

  return null;
}

function extractTransactionAmount(data) {
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

export function normalizeEvent(evt) {
  const eventType = evt?.event_type || "";
  const data = evt?.data || {};

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

export function getAllowedPaddleEvents() {
  return new Set([
    "customer.created",
    "customer.updated",
    "subscription.created",
    "subscription.updated",
    "subscription.canceled",
    "subscription.cancelled",
    "transaction.completed",
  ]);
}
