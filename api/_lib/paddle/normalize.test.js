// @vitest-environment node
import { describe, it, expect } from "vitest";
import { normalizeEvent, getAllowedPaddleEvents } from "./normalize.js";

// ── helpers ─────────────────────────────────────────────────────────────────

function makeTransactionEvt(overrides = {}) {
  return {
    event_type: "transaction.completed",
    occurred_at: "2026-08-01T10:00:00Z",
    data: {
      id: "txn_abc123",
      status: "completed",
      customer_id: "cus_xyz",
      currency_code: "EUR",
      billed_at: "2026-08-01T09:55:00Z",
      custom_data: { user_id: "user-1" },
      details: { totals: { total: "1990" } },
      items: [{ price: { id: "pri_30day" } }],
      ...overrides,
    },
  };
}

function makeSubscriptionEvt() {
  return {
    event_type: "subscription.created",
    data: {
      id: "sub_abc",
      status: "active",
      customer_id: "cus_xyz",
      custom_data: { user_id: "user-1" },
      items: [{ price: { id: "pri_monthly" } }],
      current_billing_period: { ends_at: "2026-09-01T00:00:00Z" },
    },
  };
}

// ── transaction.completed ────────────────────────────────────────────────────

describe("normalizeEvent — transaction.*", () => {
  it("extracts priceId from items[0].price.id", () => {
    const n = normalizeEvent(makeTransactionEvt());
    expect(n.kind).toBe("transaction");
    expect(n.priceId).toBe("pri_30day");
  });

  it("extracts billedAt from data.billed_at", () => {
    const n = normalizeEvent(makeTransactionEvt());
    expect(n.billedAt).toBe("2026-08-01T09:55:00.000Z");
  });

  it("billedAt is null when data.billed_at is absent", () => {
    const evt = makeTransactionEvt();
    delete evt.data.billed_at;
    const n = normalizeEvent(evt);
    expect(n.billedAt).toBeNull();
  });

  it("priceId is null when items is absent", () => {
    const evt = makeTransactionEvt();
    delete evt.data.items;
    const n = normalizeEvent(evt);
    expect(n.priceId).toBeNull();
  });

  it("priceId is null when items is empty", () => {
    const evt = makeTransactionEvt({ items: [] });
    const n = normalizeEvent(evt);
    expect(n.priceId).toBeNull();
  });

  it("priceId is null when items[0].price.id is absent", () => {
    const evt = makeTransactionEvt({ items: [{ quantity: 1 }] });
    const n = normalizeEvent(evt);
    expect(n.priceId).toBeNull();
  });

  it("still extracts transactionId, customerId, userId, amount, currency, occurredAt", () => {
    const n = normalizeEvent(makeTransactionEvt());
    expect(n.transactionId).toBe("txn_abc123");
    expect(n.customerId).toBe("cus_xyz");
    expect(n.userId).toBe("user-1");
    expect(n.currency).toBe("EUR");
    expect(n.amount).toBe(19.9);
    expect(n.occurredAt).toBeDefined();
  });
});

// ── subscription.* regression ────────────────────────────────────────────────

describe("normalizeEvent — subscription.* regression", () => {
  it("returns kind=subscription with no priceId or billedAt fields on the subscription path", () => {
    const n = normalizeEvent(makeSubscriptionEvt());
    expect(n.kind).toBe("subscription");
    expect(n.priceId).toBe("pri_monthly");
    expect(n).not.toHaveProperty("billedAt");
  });

  it("subscription currentPeriodEnd is extracted", () => {
    const n = normalizeEvent(makeSubscriptionEvt());
    expect(n.currentPeriodEnd).toBe("2026-09-01T00:00:00.000Z");
  });
});

// ── adjustment.created ───────────────────────────────────────────────────────

describe("normalizeEvent — adjustment.*", () => {
  it("returns kind=adjustment for adjustment.created", () => {
    const evt = {
      event_type: "adjustment.created",
      data: {
        id: "adj_001",
        transaction_id: "txn_abc123",
        customer_id: "cus_xyz",
        action: "refund",
      },
    };
    const n = normalizeEvent(evt);
    expect(n.kind).toBe("adjustment");
    expect(n.eventType).toBe("adjustment.created");
    expect(n.transactionId).toBe("txn_abc123");
    expect(n.action).toBe("refund");
    expect(n.customerId).toBe("cus_xyz");
  });

  it("action is null when absent", () => {
    const evt = {
      event_type: "adjustment.created",
      data: { transaction_id: "txn_abc123" },
    };
    const n = normalizeEvent(evt);
    expect(n.action).toBeNull();
  });

  it("transactionId is null when absent", () => {
    const evt = { event_type: "adjustment.created", data: {} };
    const n = normalizeEvent(evt);
    expect(n.transactionId).toBeNull();
  });
});

// ── allowlist ────────────────────────────────────────────────────────────────

describe("getAllowedPaddleEvents", () => {
  it("includes adjustment.created", () => {
    expect(getAllowedPaddleEvents().has("adjustment.created")).toBe(true);
  });

  it("still includes transaction.completed and all subscription events", () => {
    const set = getAllowedPaddleEvents();
    expect(set.has("transaction.completed")).toBe(true);
    expect(set.has("subscription.created")).toBe(true);
    expect(set.has("subscription.updated")).toBe(true);
    expect(set.has("subscription.canceled")).toBe(true);
  });
});
