// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── postgres mock ─────────────────────────────────────────────────────────────
// The sql object is created once at module level inside getMe.js.
// We use a shared queue so each test can set its own sequential responses.

const sqlQueue = { responses: [], idx: 0 };

vi.mock("postgres", () => ({
  default: () => {
    const fn = async () => {
      const r = sqlQueue.responses[sqlQueue.idx] ?? [];
      sqlQueue.idx++;
      return r;
    };
    fn.json = (v) => v;
    return fn;
  },
}));

import { getMeFromRequest } from "./getMe.js";

// ── fixtures ──────────────────────────────────────────────────────────────────

const SESSION_ROW = {
  user_id: "u1",
  email: "test@example.com",
  tier: "free",
  display_name: null,
  created_at: "2026-01-01T00:00:00Z",
  expires_at: "2060-01-01T00:00:00Z",
  revoked_at: null,
};

// Sub row with active status and future period end
function activeSub(overrides = {}) {
  return {
    id: "sub-1",
    status: "active",
    current_period_end: "2060-01-01T00:00:00Z",
    paddle_subscription_id: "paddle_sub_1",
    paddle_price_id: "pri_monthly",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeReq(sessionToken = "tok_valid") {
  return { headers: { cookie: `cc_session=${sessionToken}` } };
}

function setQueue(...responses) {
  sqlQueue.responses = responses;
  sqlQueue.idx = 0;
}

// getMeFromRequest makes 3 sequential SQL calls:
// 1. session + user lookup
// 2. user_subscription lookup
// 3. user_pass lookup (new)

// ── tests ─────────────────────────────────────────────────────────────────────

describe("getMeFromRequest — pass access", () => {
  beforeEach(() => {
    sqlQueue.idx = 0;
    sqlQueue.responses = [];
    process.env.PADDLE_PRICE_ID_MONTHLY = "pri_monthly";
    process.env.PADDLE_PRICE_ID_YEARLY = "pri_yearly";
  });

  afterEach(() => {
    delete process.env.PADDLE_PRICE_ID_MONTHLY;
    delete process.env.PADDLE_PRICE_ID_YEARLY;
  });

  it("no session cookie → returns null without hitting DB", async () => {
    setQueue();
    const result = await getMeFromRequest(makeReq(""));
    expect(result).toBeNull();
    expect(sqlQueue.idx).toBe(0);
  });

  it("invalid session (no DB row) → returns null", async () => {
    setQueue([]); // session query returns empty
    const result = await getMeFromRequest(makeReq());
    expect(result).toBeNull();
  });

  it("active subscription only → pro=true (unchanged behaviour)", async () => {
    setQueue(
      [SESSION_ROW],               // session
      [activeSub()],               // subscription
      []                           // pass query — no active pass
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.entitlements.pro).toBe(true);
    expect(me?.entitlements.proUntil).toBe("2060-01-01T00:00:00Z");
  });

  it("expired subscription only → pro=false (unchanged behaviour)", async () => {
    setQueue(
      [SESSION_ROW],
      [activeSub({ status: "canceled", current_period_end: "2020-01-01T00:00:00Z" })],
      [] // no pass
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.entitlements.pro).toBe(false);
  });

  it("active pass only (no subscription) → pro=true", async () => {
    setQueue(
      [SESSION_ROW],
      [],                                                        // no subscription
      [{ access_end: "2060-09-01T00:00:00Z" }]                 // active pass
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.entitlements.pro).toBe(true);
    expect(me?.entitlements.proUntil).toBe("2060-09-01T00:00:00Z");
  });

  it("expired pass (pass query returns empty due to access_end filter) → pro=false", async () => {
    setQueue(
      [SESSION_ROW],
      [],  // no subscription
      []   // access_end filter excludes expired pass
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.entitlements.pro).toBe(false);
  });

  it("refunded pass (status filter excludes it) → pro=false", async () => {
    // The query filters status='active', so a refunded pass returns no rows
    setQueue(
      [SESSION_ROW],
      [],
      []
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.entitlements.pro).toBe(false);
  });

  it("expired subscription + active pass → pro=true (pass carries access)", async () => {
    setQueue(
      [SESSION_ROW],
      [activeSub({ status: "canceled", current_period_end: "2020-01-01T00:00:00Z" })],
      [{ access_end: "2060-09-01T00:00:00Z" }]
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.entitlements.pro).toBe(true);
  });

  it("active subscription + active pass → proUntil is the later of the two", async () => {
    setQueue(
      [SESSION_ROW],
      [activeSub({ current_period_end: "2060-06-01T00:00:00Z" })],
      [{ access_end: "2060-09-01T00:00:00Z" }]  // pass ends later
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.entitlements.pro).toBe(true);
    expect(me?.entitlements.proUntil).toBe("2060-09-01T00:00:00Z");
  });

  it("active subscription ends later than pass → proUntil from subscription", async () => {
    setQueue(
      [SESSION_ROW],
      [activeSub({ current_period_end: "2061-01-01T00:00:00Z" })],
      [{ access_end: "2060-09-01T00:00:00Z" }]  // sub ends later
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.entitlements.proUntil).toBe("2061-01-01T00:00:00Z");
  });

  it("subscription shape is still returned for frontend use", async () => {
    setQueue(
      [SESSION_ROW],
      [activeSub()],
      []
    );
    const me = await getMeFromRequest(makeReq());
    expect(me?.subscription).not.toBeNull();
    expect(me?.subscription?.plan).toBe("monthly");
  });
});
