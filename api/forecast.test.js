// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { format } from "node:util";
import handler from "./forecast.js";

// Ticket #453 v2 (T1): captures every console.* argument through
// `util.format`, not `JSON.stringify`. `JSON.stringify(someError)` renders
// as `{}` (Error objects don't serialize their own message/stack via
// JSON.stringify), so a redaction test built on it would pass even if the
// implementation logged a raw Error containing a secret. `util.format`
// inspects a non-string argument (including an Error, or a plain thrown
// object) the same way `console.error` itself effectively does, so it
// actually exposes what a real log line would contain. See the "capture
// formatter sanity check" test below for a direct demonstration of this gap.
function formatConsoleCalls(spy) {
  return spy.mock.calls.map((call) => format(...call)).join(" ");
}

function makeReq(url) {
  return { method: "GET", url, headers: { host: "localhost:3000" } };
}

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

const VALID_UPSTREAM_BODY = {
  daily: { time: ["2026-08-24"], temperature_2m_max: [15] },
  hourly: { time: ["2026-08-24T00:00"], temperature_2m: [10] },
};

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify(VALID_UPSTREAM_BODY),
  });
});

describe("/api/forecast — Open-Meteo cloud/visibility field additions (Ticket 1 groundwork)", () => {
  it("requests cloudcover, cloudcover_low/mid/high, and visibility alongside every pre-existing hourly field", async () => {
    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    expect(global.fetch).toHaveBeenCalledOnce();
    const requestedUrl = new URL(global.fetch.mock.calls[0][0]);
    const hourly = requestedUrl.searchParams.get("hourly").split(",");

    // Pre-existing fields must still all be present — additive change only.
    expect(hourly).toEqual(
      expect.arrayContaining([
        "temperature_2m",
        "weathercode",
        "precipitation",
        "precipitation_probability",
        "windspeed_10m",
        "windgusts_10m",
      ])
    );
    // New Ticket 1 groundwork fields.
    expect(hourly).toEqual(
      expect.arrayContaining(["cloudcover", "cloudcover_low", "cloudcover_mid", "cloudcover_high", "visibility"])
    );

    expect(res.statusCode).toBe(200);
  });

  it("daily field list is unchanged (cloud groundwork is hourly-only, matching Open-Meteo's own field granularity)", async () => {
    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    const requestedUrl = new URL(global.fetch.mock.calls[0][0]);
    const daily = requestedUrl.searchParams.get("daily").split(",");
    expect(daily).toEqual([
      "weathercode",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "windspeed_10m_max",
      "windgusts_10m_max",
      "winddirection_10m_dominant",
    ]);
  });

  it("existing consumers are unaffected — the response body is still passed through unchanged (pure passthrough, no per-field processing)", async () => {
    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    expect(res.body).toEqual(VALID_UPSTREAM_BODY);
  });

  it("regression: still rejects a missing lat/lon exactly as before", async () => {
    const res = makeRes();
    await handler(makeReq("/api/forecast"), res);
    expect(res.statusCode).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("regression: still returns 502 on invalid upstream payload shape", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ notDaily: true }) });
    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);
    expect(res.statusCode).toBe(502);
  });
});

// Ticket #453 — unified Open-Meteo host/key selection.
describe("/api/forecast — Ticket #453: host/key selection and no-fallback behavior", () => {
  const ORIGINAL_KEY = process.env.OPEN_METEO_API_KEY;
  const ORIGINAL_VERCEL_ENV = process.env.VERCEL_ENV;

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.OPEN_METEO_API_KEY;
    else process.env.OPEN_METEO_API_KEY = ORIGINAL_KEY;
    if (ORIGINAL_VERCEL_ENV === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = ORIGINAL_VERCEL_ENV;
  });

  it("with a configured (fake) key: requests the customer host with exactly one apikey param, every other param unchanged", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9&timezone=UTC"), res);

    expect(global.fetch).toHaveBeenCalledOnce();
    const requestedUrl = new URL(global.fetch.mock.calls[0][0]);
    expect(requestedUrl.origin).toBe("https://customer-api.open-meteo.com");
    expect(requestedUrl.pathname).toBe("/v1/forecast");
    expect(requestedUrl.searchParams.getAll("apikey")).toEqual(["sentinel-fake-key"]);
    expect(requestedUrl.searchParams.get("latitude")).toBe("64.1000");
    expect(requestedUrl.searchParams.get("timezone")).toBe("UTC");
    expect(res.statusCode).toBe(200);
  });

  it("without a key, VERCEL_ENV undefined (plain local/test): requests the public host, no apikey param, 200 as before", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    delete process.env.VERCEL_ENV;

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    const requestedUrl = new URL(global.fetch.mock.calls[0][0]);
    expect(requestedUrl.origin).toBe("https://api.open-meteo.com");
    expect(requestedUrl.searchParams.has("apikey")).toBe(false);
    expect(res.statusCode).toBe(200);
  });

  it("without a key, VERCEL_ENV='preview': still requests the public host (owner's Q1 policy), no apikey param", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    process.env.VERCEL_ENV = "preview";

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    const requestedUrl = new URL(global.fetch.mock.calls[0][0]);
    expect(requestedUrl.origin).toBe("https://api.open-meteo.com");
    expect(res.statusCode).toBe(200);
  });

  it("without a key, VERCEL_ENV='production': fails closed — 502 forecast_error, no-store, NO upstream fetch attempted (no public fallback)", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    process.env.VERCEL_ENV = "production";

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: "forecast_error" });
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("a whitespace-only key is treated as missing, not as a valid credential", async () => {
    process.env.OPEN_METEO_API_KEY = "   ";
    process.env.VERCEL_ENV = "production";

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(502);
  });

  it("client-supplied apikey/host/url query parameters are ignored and never forwarded (Q7)", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;

    const res = makeRes();
    await handler(
      makeReq("/api/forecast?lat=64.1&lon=-21.9&apikey=attacker-key&host=https://evil.example&url=https://evil.example"),
      res,
    );

    const requestedUrl = new URL(global.fetch.mock.calls[0][0]);
    expect(requestedUrl.origin).toBe("https://customer-api.open-meteo.com");
    expect(requestedUrl.searchParams.getAll("apikey")).toEqual(["sentinel-fake-key"]); // exactly one, ours
    expect(requestedUrl.searchParams.has("host")).toBe(false);
    expect(requestedUrl.searchParams.has("url")).toBe(false);
  });

  it("a 401 from the keyed host is NOT retried on the public host (no fallback after a keyed-request failure)", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized: key=sentinel-fake-key" });

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    expect(global.fetch).toHaveBeenCalledOnce(); // never a second, fallback request
    expect(res.statusCode).toBe(502);
  });

  it("Q5: a fake key/keyed URL echoed in the upstream error body never reaches console output", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "unauthorized for https://customer-api.open-meteo.com/v1/forecast?apikey=sentinel-fake-key",
    });

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    expect(formatConsoleCalls(errorSpy)).not.toContain("sentinel-fake-key");
    expect(res.statusCode).toBe(502);
    errorSpy.mockRestore();
  });

  // Ticket #453 v2 (T1): strengthened with util.format (see formatConsoleCalls
  // above) instead of JSON.stringify, and extended to also cover name/stack,
  // not just message — a thrown value is caller-controlled and could put the
  // sentinel in any of those fields.
  it("Q5/T1: a thrown fetch error whose message, name, AND stack all embed the keyed URL/sentinel never reaches console output", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const keyedUrlError = new Error(
      "fetch failed: request to https://customer-api.open-meteo.com/v1/forecast?apikey=sentinel-fake-key failed",
    );
    keyedUrlError.name = "sentinel-fake-key-in-name";
    keyedUrlError.stack = "sentinel-fake-key-in-stack\n" + keyedUrlError.stack;
    global.fetch = vi.fn().mockRejectedValue(keyedUrlError);

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    expect(formatConsoleCalls(errorSpy)).not.toContain("sentinel-fake-key");
    expect(res.statusCode).toBe(502);
    errorSpy.mockRestore();
  });

  // Ticket #453 v2 (D2): a thrown value need not even be an Error — its
  // `name` property is entirely caller-controlled, so it must never be
  // treated as a trustworthy classification label or logged at all.
  it("Q5/D2: a thrown plain object (not an Error) with an attacker-controlled name/message is never logged", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const thrownObject = { name: "sentinel-fake-key-name", message: "sentinel-fake-key-message", stack: "sentinel-fake-key-stack" };
    global.fetch = vi.fn().mockRejectedValue(thrownObject);

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    expect(formatConsoleCalls(errorSpy)).not.toContain("sentinel-fake-key");
    expect(res.statusCode).toBe(502);
    errorSpy.mockRestore();
  });

  // Ticket #453 v2 (D1): the invalid-JSON branch's parse-error log site.
  // Ticket #453 v3 (Z1): the original version of this test asserted only
  // that the formatted console output didn't contain the sentinel string —
  // but V8's JSON.parse SyntaxError quotes just a short, truncated prefix of
  // the parsed input (confirmed directly: parsing this exact malformed body
  // throws `Unexpected token 'o', "not json at"... is not valid JSON` — the
  // sentinel, which sits later in the string, is never even IN the error's
  // own message). That made the old assertion pass regardless of whether the
  // implementation logged the raw parse error or not — it never actually
  // exercised the unsafe path. Fixed here with two STRUCTURAL assertions
  // that are independent of any JS engine's truncation behavior: (1) no
  // logged argument is ever an Error instance at all (an unsafe raw
  // `console.error(..., parseErr)` fails this regardless of what
  // `parseErr.message` happens to contain on whatever engine runs it), and
  // (2) the exact safe call shape (static message + the real numeric
  // status) was made, via `toHaveBeenCalledWith`, which fails on any extra
  // or different argument. The substring check against the sentinel is kept
  // only as a non-load-bearing supplement, not the guarantee itself.
  it("D1/Z1: the invalid-JSON branch never logs a raw Error instance, and logs the exact safe structural call — independent of JSON.parse's engine-specific message truncation", async () => {
    process.env.OPEN_METEO_API_KEY = "sentinel-fake-key";
    delete process.env.VERCEL_ENV;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200, // explicit, so the expected { status: 200 } below is meaningful, not an accidental undefined match
      text: async () => "not json at all, apikey=sentinel-fake-key {{{",
    });

    const res = makeRes();
    await handler(makeReq("/api/forecast?lat=64.1&lon=-21.9"), res);

    // Primary guarantee 1: no logged argument is ever an Error instance.
    for (const call of errorSpy.mock.calls) {
      for (const arg of call) {
        expect(arg instanceof Error).toBe(false);
      }
    }
    // Primary guarantee 2: the exact, fully-static safe call shape.
    expect(errorSpy).toHaveBeenCalledWith("Forecast upstream returned invalid JSON", { status: 200 });

    // Supplementary only (not load-bearing on its own — see comment above).
    expect(formatConsoleCalls(errorSpy)).not.toContain("sentinel-fake-key");

    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: "forecast_invalid_json" }); // existing contract unchanged
    expect(JSON.stringify(res.body)).not.toContain("sentinel-fake-key");
    errorSpy.mockRestore();
  });

  // Ticket #453 v2 (T1): proves the capture method itself is sound — this is
  // the exact gap the strengthened tests above close. Without this, a
  // regression where the real code logs a raw Error could still pass every
  // "not.toContain" assertion above for the wrong reason (a blind formatter),
  // not because the implementation is actually safe.
  it("capture formatter sanity check: util.format exposes a sentinel embedded in a raw Error, where JSON.stringify would hide it", () => {
    const err = new Error("boom containing sentinel-fake-key");
    const viaJsonStringify = JSON.stringify(["label", err]);
    const viaUtilFormat = format("label", err);

    expect(viaJsonStringify).not.toContain("sentinel-fake-key"); // demonstrates why JSON.stringify was inadequate (T1)
    expect(viaUtilFormat).toContain("sentinel-fake-key"); // demonstrates the strengthened formatter actually catches it
  });
});
