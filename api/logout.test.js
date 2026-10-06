// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

// ── postgres mock (module-level sql) ────────────────────────────────────────

const sqlState = { calls: [], shouldThrow: false };

vi.mock("postgres", () => ({
  default: () => {
    const fn = async (strings, ...values) => {
      sqlState.calls.push({ text: strings.join("?"), values });
      if (sqlState.shouldThrow) throw new Error("db down");
      return [];
    };
    fn.json = (v) => v;
    return fn;
  },
}));

const { default: handler } = await import("./logout.js");

// ── helpers ─────────────────────────────────────────────────────────────────

const SESSION_TOKEN = "tok_valid";
const sha256 = (v) => crypto.createHash("sha256").update(v).digest("hex");

function makeReq({ method = "POST", cookie, host } = {}) {
  const headers = {};
  if (cookie !== undefined) headers.cookie = cookie;
  if (host !== undefined) headers.host = host;
  return { method, headers };
}

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    setHeader: vi.fn((name, value) => {
      res.headers[name] = value;
    }),
    status: vi.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((body) => {
      res.body = body;
      return res;
    }),
  };
  return res;
}

// Expected attribute strings. Secure appears only when NODE_ENV is production.
function expireVariant({ domain = null, secure = false } = {}) {
  return [
    "cc_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : null,
    domain ? `Domain=${domain}` : null,
  ]
    .filter(Boolean)
    .join("; ");
}

async function runHandler(reqOpts) {
  const res = makeRes();
  await handler(makeReq(reqOpts), res);
  return res;
}

// ── tests ───────────────────────────────────────────────────────────────────

describe("api/logout", () => {
  beforeEach(() => {
    sqlState.calls = [];
    sqlState.shouldThrow = false;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects non-POST methods with 405 and does not touch the DB or cookies", async () => {
    const res = await runHandler({ method: "GET", cookie: `cc_session=${SESSION_TOKEN}`, host: "campcast.is" });

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({ ok: false, error: "Method not allowed" });
    expect(sqlState.calls).toHaveLength(0);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it("revokes the session by SHA256 hash of the raw cookie token", async () => {
    const res = await runHandler({ cookie: `cc_session=${SESSION_TOKEN}`, host: "campcast.is" });

    expect(sqlState.calls).toHaveLength(1);
    expect(sqlState.calls[0].text).toContain("update user_session");
    expect(sqlState.calls[0].text).toContain("revoked_at is null");
    expect(sqlState.calls[0].values).toEqual([sha256(SESSION_TOKEN)]);
    expect(sqlState.calls[0].values).not.toContain(SESSION_TOKEN);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("decodes URL-encoded cookie values before hashing", async () => {
    await runHandler({ cookie: "other=1; cc_session=a%2Bb", host: "campcast.is" });

    expect(sqlState.calls[0].values).toEqual([sha256("a+b")]);
  });

  it("succeeds without touching the DB when no session cookie is present, and still expires the cookie", async () => {
    const res = await runHandler({ cookie: "theme=dark", host: "campcast.is" });

    expect(sqlState.calls).toHaveLength(0);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.setHeader).toHaveBeenCalledTimes(1);
    expect(res.setHeader.mock.calls[0][0]).toBe("Set-Cookie");
    expect(Array.isArray(res.setHeader.mock.calls[0][1])).toBe(true);
  });

  it("returns ok with a note and still expires the cookie when the revocation query throws", async () => {
    sqlState.shouldThrow = true;

    const res = await runHandler({ cookie: `cc_session=${SESSION_TOKEN}`, host: "campcast.is" });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({ ok: true, note: "Cookie cleared; revoke may have failed" });
    expect(res.setHeader).toHaveBeenCalledTimes(1);
    expect(res.setHeader.mock.calls[0][1]).toEqual([
      expireVariant({ domain: ".campcast.is" }),
      expireVariant(),
    ]);
  });

  it("calls setHeader exactly once with an array on the success path", async () => {
    const res = await runHandler({ cookie: `cc_session=${SESSION_TOKEN}`, host: "eltumvedrid.is" });

    expect(res.setHeader).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith("Set-Cookie", [
      expireVariant({ domain: ".eltumvedrid.is" }),
      expireVariant(),
    ]);
  });

  describe("Set-Cookie host matrix (helper via handler)", () => {
    const cases = [
      ["campcast.is", [".campcast.is"]],
      ["www.campcast.is", [".campcast.is"]],
      ["eltumvedrid.is", [".eltumvedrid.is"]],
      ["www.eltumvedrid.is", [".eltumvedrid.is"]],
      ["campcast.is:443", [".campcast.is"]],
      ["ELTUMVEDRID.IS", [".eltumvedrid.is"]],
      ["localhost:3000", []],
      ["127.0.0.1:3000", []],
      ["evil.example", []],
    ];

    for (const [host, domains] of cases) {
      it(`host ${JSON.stringify(host)} expires ${domains.length ? `Domain=${domains[0]} plus host-only` : "host-only"}`, async () => {
        const res = await runHandler({ cookie: `cc_session=${SESSION_TOKEN}`, host });

        const expected = domains.length
          ? [expireVariant({ domain: domains[0] }), expireVariant()]
          : [expireVariant()];
        expect(res.setHeader.mock.calls[0][1]).toEqual(expected);
      });
    }

    it("missing host header falls back to a single host-only expiry without throwing", async () => {
      const res = await runHandler({ cookie: `cc_session=${SESSION_TOKEN}` });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader.mock.calls[0][1]).toEqual([expireVariant()]);
    });
  });

  describe("Secure attribute follows NODE_ENV", () => {
    it("adds Secure to every variant in production", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const res = await runHandler({ cookie: `cc_session=${SESSION_TOKEN}`, host: "campcast.is" });

      expect(res.setHeader.mock.calls[0][1]).toEqual([
        expireVariant({ domain: ".campcast.is", secure: true }),
        expireVariant({ secure: true }),
      ]);
    });

    it("omits Secure outside production", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const res = await runHandler({ cookie: `cc_session=${SESSION_TOKEN}`, host: "campcast.is" });

      expect(res.setHeader.mock.calls[0][1]).toEqual([
        expireVariant({ domain: ".campcast.is" }),
        expireVariant(),
      ]);
      expect(res.setHeader.mock.calls[0][1].every((v) => !v.includes("Secure"))).toBe(true);
    });
  });
});
