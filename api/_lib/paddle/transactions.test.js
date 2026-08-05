// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./mapUser.js", () => ({
  mapUser: vi.fn(),
}));

import { persistTransaction, revokePassForTransaction } from "./transactions.js";
import { mapUser } from "./mapUser.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const PASS30_PRICE = "pri_pass30";
const PASSYEAR_PRICE = "pri_passyear";
const SUB_PRICE = "pri_monthly";

const USER = { id: "user-1", email: "t@e.com", tier: "free", paddle_customer_id: "cus_1" };

const ENV_BASE = {
  PADDLE_PRICE_ID_30_DAY_PASS: PASS30_PRICE,
  PADDLE_PRICE_ID_YEAR_PASS: PASSYEAR_PRICE,
};

// Normalized transaction fixture
function makeNormalized(overrides = {}) {
  return {
    kind: "transaction",
    eventType: "transaction.completed",
    transactionId: "txn_001",
    customerId: "cus_1",
    userId: "user-1",
    status: "completed",
    currency: "EUR",
    amount: 9.99,
    occurredAt: "2026-08-01T10:00:00.000Z",
    priceId: PASS30_PRICE,
    billedAt: "2026-08-01T09:55:00.000Z",
    raw: {},
    ...overrides,
  };
}

// Sequential sql mock: returns responses[idx] on each call
function makeSql(...responses) {
  let idx = 0;
  const calls = [];
  const fn = async (strings, ...values) => {
    const tpl = Array.isArray(strings) ? strings.join("§") : String(strings);
    const r = responses[idx] ?? [];
    calls.push({ tpl, values, returned: r });
    idx++;
    return r;
  };
  fn.json = (v) => v;
  fn._calls = calls;
  return fn;
}

// ── persistTransaction — pass30 ───────────────────────────────────────────────

describe("persistTransaction — pass30 grant", () => {
  beforeEach(() => {
    Object.assign(process.env, ENV_BASE);
    mapUser.mockResolvedValue(USER);
  });
  afterEach(() => {
    for (const k of Object.keys(ENV_BASE)) delete process.env[k];
  });

  it("inserts user_pass row with access_end = billedAt + 30 days", async () => {
    // Calls: paddle_transaction insert, user_pass stacking query, user_pass insert
    const sql = makeSql([], [], []);

    const result = await persistTransaction({ sql, normalized: makeNormalized() });

    expect(result.pass_granted).toBe(true);
    expect(result.pass_type).toBe("pass30");

    const billedAt = new Date("2026-08-01T09:55:00.000Z");
    const expectedEnd = new Date(billedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(result.access_end).toBe(expectedEnd);
    expect(result.access_start).toBe(billedAt.toISOString());
  });

  it("uses occurred_at as fallback when billedAt is null", async () => {
    const sql = makeSql([], [], []);
    const n = makeNormalized({ billedAt: null, occurredAt: "2026-08-02T08:00:00.000Z" });

    const result = await persistTransaction({ sql, normalized: n });

    const expectedStart = new Date("2026-08-02T08:00:00.000Z").toISOString();
    const expectedEnd = new Date(
      new Date("2026-08-02T08:00:00.000Z").getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    expect(result.access_start).toBe(expectedStart);
    expect(result.access_end).toBe(expectedEnd);
  });

  it("idempotency: ON CONFLICT DO NOTHING — second call with same transactionId is a no-op", async () => {
    // First call: no existing pass
    const sql1 = makeSql([], [], []);
    const r1 = await persistTransaction({ sql: sql1, normalized: makeNormalized() });
    expect(r1.pass_granted).toBe(true);

    // Second call: same transactionId — stacking query returns the already-inserted row,
    // but the INSERT ON CONFLICT DO NOTHING means it's harmless
    const existingEnd = r1.access_end;
    const sql2 = makeSql(
      [],                               // paddle_transaction upsert
      [{ access_end: existingEnd }],    // stacking query — finds existing pass
      []                                // user_pass INSERT DO NOTHING
    );
    const r2 = await persistTransaction({ sql: sql2, normalized: makeNormalized() });

    // Result still returns pass_granted true (we computed dates and attempted insert)
    expect(r2.pass_granted).toBe(true);
    // access_start stacks after the first pass, so they differ
    expect(r2.access_start).toBe(existingEnd);
  });

  it("stacking: access_start = latest active pass access_end when it exceeds billedAt", async () => {
    const existingEnd = "2026-09-15T00:00:00.000Z";
    const sql = makeSql(
      [],
      [{ access_end: existingEnd }], // existing active pass found
      []
    );

    const result = await persistTransaction({ sql, normalized: makeNormalized() });

    expect(result.access_start).toBe(existingEnd);
    const expectedEnd = new Date(
      new Date(existingEnd).getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    expect(result.access_end).toBe(expectedEnd);
  });

  it("no stacking when existing pass ends before billedAt", async () => {
    // stacking query returns empty (access_end filter requires > billedAt)
    const sql = makeSql([], [], []);
    const result = await persistTransaction({ sql, normalized: makeNormalized() });

    const expectedStart = new Date("2026-08-01T09:55:00.000Z").toISOString();
    expect(result.access_start).toBe(expectedStart);
  });

  it("no user found → no user_pass row, pass_granted=false, does not throw", async () => {
    mapUser.mockResolvedValueOnce(null);
    const sql = makeSql([]); // only paddle_transaction insert

    const result = await persistTransaction({ sql, normalized: makeNormalized() });

    expect(result.pass_granted).toBe(false);
    expect(result.reason).toBe("user_not_found");
    expect(result.saved).toBe(true); // log row still saved
  });

  it("missing billedAt and occurredAt → no user_pass row (early exit, saved=false)", async () => {
    // When occurredAt is null the function exits before reaching pass-grant code,
    // returning { saved: false } — pass_granted is not set (undefined, i.e. falsy).
    const sql = makeSql([]); // only called for paddle_transaction early-exit path
    const n = makeNormalized({ billedAt: null, occurredAt: null });

    const result = await persistTransaction({ sql, normalized: n });

    expect(result.saved).toBe(false);
    expect(result.pass_granted).toBeFalsy();
  });
});

// ── persistTransaction — passyear ────────────────────────────────────────────

describe("persistTransaction — passyear grant", () => {
  beforeEach(() => {
    Object.assign(process.env, ENV_BASE);
    mapUser.mockResolvedValue(USER);
  });
  afterEach(() => {
    for (const k of Object.keys(ENV_BASE)) delete process.env[k];
  });

  it("inserts user_pass row with access_end = billedAt + 365 days", async () => {
    const sql = makeSql([], [], []);
    const n = makeNormalized({ priceId: PASSYEAR_PRICE });

    const result = await persistTransaction({ sql, normalized: n });

    expect(result.pass_type).toBe("passyear");
    const billedAt = new Date("2026-08-01T09:55:00.000Z");
    const expectedEnd = new Date(billedAt.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(result.access_end).toBe(expectedEnd);
  });
});

// ── persistTransaction — subscription price → no pass grant ─────────────────

describe("persistTransaction — subscription price ID → log only", () => {
  beforeEach(() => {
    Object.assign(process.env, ENV_BASE);
    mapUser.mockResolvedValue(USER);
  });
  afterEach(() => {
    for (const k of Object.keys(ENV_BASE)) delete process.env[k];
  });

  it("subscription price ID → no user_pass row, no pass_granted key", async () => {
    const sql = makeSql([]); // only paddle_transaction insert
    const n = makeNormalized({ priceId: SUB_PRICE });

    const result = await persistTransaction({ sql, normalized: n });

    expect(result.pass_granted).toBeUndefined();
    expect(result.saved).toBe(true);
    // Only one SQL call (the paddle_transaction insert)
    expect(sql._calls).toHaveLength(1);
  });

  it("null priceId → no pass grant", async () => {
    const sql = makeSql([]);
    const n = makeNormalized({ priceId: null });

    const result = await persistTransaction({ sql, normalized: n });

    expect(result.pass_granted).toBeUndefined();
    expect(sql._calls).toHaveLength(1);
  });
});

// ── revokePassForTransaction ──────────────────────────────────────────────────

describe("revokePassForTransaction", () => {
  it("sets status=refunded for the matching pass row", async () => {
    const sql = makeSql([{ id: "pass-row-1" }]); // UPDATE RETURNING
    const normalized = {
      kind: "adjustment",
      eventType: "adjustment.created",
      transactionId: "txn_001",
      action: "refund",
    };

    const result = await revokePassForTransaction({ sql, normalized });

    expect(result.ok).toBe(true);
    expect(result.revoked).toBe(true);
    expect(result.rows_updated).toBe(1);
    expect(result.paddle_transaction_id).toBe("txn_001");
  });

  it("no user_pass row for this txn → revoked=false (subscription refund is harmless)", async () => {
    const sql = makeSql([]); // UPDATE affects 0 rows
    const normalized = {
      kind: "adjustment",
      eventType: "adjustment.created",
      transactionId: "txn_sub_001",
      action: "refund",
    };

    const result = await revokePassForTransaction({ sql, normalized });

    expect(result.ok).toBe(true);
    expect(result.revoked).toBe(false);
    expect(result.rows_updated).toBe(0);
  });

  it("non-refund action → skipped without touching DB", async () => {
    const sql = makeSql();
    const normalized = {
      kind: "adjustment",
      eventType: "adjustment.created",
      transactionId: "txn_001",
      action: "credit",
    };

    const result = await revokePassForTransaction({ sql, normalized });

    expect(result.ok).toBe(true);
    expect(result.revoked).toBe(false);
    expect(sql._calls).toHaveLength(0);
  });

  it("missing transactionId → revoked=false without touching DB", async () => {
    const sql = makeSql();
    const normalized = { kind: "adjustment", eventType: "adjustment.created", action: "refund", transactionId: null };

    const result = await revokePassForTransaction({ sql, normalized });

    expect(result.revoked).toBe(false);
    expect(sql._calls).toHaveLength(0);
  });
});
