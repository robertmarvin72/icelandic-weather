// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── postgres mock (module-level sql) ────────────────────────────────────────

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

// ── env setup ───────────────────────────────────────────────────────────────

const ENV_BASE = {
  POSTGRES_URL: "postgresql://test",
  PADDLE_API_KEY: "sk_test",
  PADDLE_ENV: "sandbox",
  PADDLE_PRICE_ID_MONTHLY: "pri_monthly",
  PADDLE_PRICE_ID_YEARLY: "pri_yearly",
  PADDLE_PRICE_ID_30_DAY_PASS: "pri_pass30",
  PADDLE_PRICE_ID_YEAR_PASS: "pri_passyear",
  APP_URL: "https://campcast.is",
  PAY_URL: "https://pay.campcast.is",
};

// User row returned by session query
const SESSION_USER = {
  id: "user-1",
  email: "camper@example.com",
  tier: "free",
  paddle_customer_id: "cus_existing",
};

// ── fetch mock factory ───────────────────────────────────────────────────────

function makeFetchMock(priceIdAsserted) {
  const calls = [];
  const fn = vi.fn(async (url, opts) => {
    const urlStr = String(url);
    calls.push({ url: urlStr, method: opts?.method || "GET" });

    if (urlStr.includes("/transactions") && opts?.method === "POST") {
      const body = JSON.parse(opts.body);
      // capture for assertion
      fn._lastTransactionBody = body;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: { checkout: { url: "https://sandbox-pay.paddle.com/checkout/test?_ptxn=txn123" } } }),
      };
    }
    return { ok: true, status: 200, text: async () => JSON.stringify({}) };
  });
  fn._calls = calls;
  return fn;
}

// ── minimal req/res builders ─────────────────────────────────────────────────

function makeReq(plan, extra = {}) {
  return {
    method: "POST",
    headers: {
      cookie: "cc_session=tok_valid",
      accept: "application/json",
      "x-forwarded-proto": "https",
      host: "campcast.is",
    },
    url: "/api/checkout",
    body: { plan, ...extra },
  };
}

function makeRes() {
  let code = null;
  const headers = {};
  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    writeHead: (c) => { code = c; },
    end: () => {},
    status(c) { code = c; return this; },
    json(body) { this._body = body; return this; },
    _body: null,
    get statusCode() { return code; },
  };
  return res;
}

// ── import handler after mocks are set up ────────────────────────────────────

import handler from "./checkout.js";

// ── tests ───────────────────────────────────────────────────────────────────

describe("checkout — pass plans", () => {
  beforeEach(() => {
    Object.assign(process.env, ENV_BASE);
    sqlQueue.idx = 0;
    sqlQueue.responses = [
      // session query → user with existing Paddle customer (skips customer creation)
      [SESSION_USER],
    ];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of Object.keys(ENV_BASE)) delete process.env[k];
  });

  it("pass30: returns checkout URL and skips subscription guard", async () => {
    const fetchMock = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const req = makeReq("pass30");
    const res = makeRes();

    await handler(req, res);

    expect(res._body?.ok).toBe(true);
    expect(typeof res._body?.url).toBe("string");
    expect(res._body?.url).toContain("pay.campcast.is");

    // subscription query must NOT have been called — only the session query
    expect(sqlQueue.idx).toBe(1);

    // Paddle transaction must use the pass30 price ID
    expect(fetchMock._lastTransactionBody?.items?.[0]?.price_id).toBe("pri_pass30");
  });

  it("passyear: returns checkout URL with year-pass price ID", async () => {
    const fetchMock = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const req = makeReq("passyear");
    const res = makeRes();

    await handler(req, res);

    expect(res._body?.ok).toBe(true);
    expect(fetchMock._lastTransactionBody?.items?.[0]?.price_id).toBe("pri_passyear");
  });

  it("pass30: custom_data includes plan=pass30 and user_id", async () => {
    const fetchMock = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await handler(makeReq("pass30"), makeRes());

    const cd = fetchMock._lastTransactionBody?.custom_data;
    expect(cd?.plan).toBe("pass30");
    expect(cd?.user_id).toBe("user-1");
  });

  it("pass30 by active subscriber: subscription guard NOT triggered, returns 200", async () => {
    // Even though we inject an active subscription row, the guard is skipped for passes
    sqlQueue.responses = [
      [SESSION_USER],
      // subscription row — should never be read for pass30
      [{ id: "sub-1", status: "active", current_period_end: "2030-01-01", paddle_price_id: "pri_yearly" }],
    ];
    const fetchMock = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const res = makeRes();
    await handler(makeReq("pass30"), res);

    // Guard skipped → only session SQL call
    expect(sqlQueue.idx).toBe(1);
    expect(res._body?.ok).toBe(true);
  });

  it("missing PADDLE_PRICE_ID_30_DAY_PASS → 500", async () => {
    delete process.env.PADDLE_PRICE_ID_30_DAY_PASS;
    vi.stubGlobal("fetch", vi.fn());

    const res = makeRes();
    await handler(makeReq("pass30"), res);

    expect(res.statusCode).toBe(500);
    expect(res._body?.error).toMatch(/PADDLE_PRICE_ID_30_DAY_PASS/);
  });
});

describe("checkout — subscription plans (unchanged behaviour)", () => {
  beforeEach(() => {
    Object.assign(process.env, ENV_BASE);
    sqlQueue.idx = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of Object.keys(ENV_BASE)) delete process.env[k];
  });

  it("monthly with active yearly subscription → 409 SUB_ACTIVE_YEARLY", async () => {
    sqlQueue.responses = [
      [SESSION_USER],
      // subscription query → active yearly
      [{
        id: "sub-1",
        status: "active",
        current_period_end: "2030-01-01T00:00:00Z",
        paddle_subscription_id: "paddle_sub_1",
        paddle_price_id: "pri_yearly",
      }],
    ];
    vi.stubGlobal("fetch", vi.fn());

    const res = makeRes();
    await handler(makeReq("monthly"), res);

    expect(res.statusCode).toBe(409);
    expect(res._body?.code).toBe("SUB_ACTIVE_YEARLY");
  });

  it("monthly with no subscription → subscription query IS made", async () => {
    sqlQueue.responses = [
      [SESSION_USER],
      [], // subscription query → no rows
    ];
    const fetchMock = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const res = makeRes();
    await handler(makeReq("monthly"), res);

    // Both session query AND subscription query were made
    expect(sqlQueue.idx).toBe(2);
    expect(res._body?.ok).toBe(true);
  });

  it("unknown plan → falls through to monthly price (unchanged behaviour)", async () => {
    sqlQueue.responses = [
      [SESSION_USER],
      [],
    ];
    const fetchMock = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const res = makeRes();
    await handler(makeReq("supersecretplan"), res);

    // Falls through to monthly
    expect(fetchMock._lastTransactionBody?.items?.[0]?.price_id).toBe("pri_monthly");
  });
});
