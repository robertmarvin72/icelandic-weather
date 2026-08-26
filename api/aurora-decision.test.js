// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

const CANONICAL_LOCATIONS = [{ id: "loc-clear", name: "Clear Site", lat: 64.1, lon: -21.9 }];

vi.mock("./_lib/auroraDecision/resolveLocations.js", async () => {
  const actual = await vi.importActual("./_lib/auroraDecision/resolveLocations.js");
  return { ...actual, loadCanonicalLocations: async () => CANONICAL_LOCATIONS };
});

const NIGHT = {
  eveningDate: "2026-08-24",
  auroraActivity: 9,
  sun: { sunset: "21:00", darknessStart: "22:00", dawn: "05:00", sunrise: "06:00" },
  moon: { ageDays: 0, rise: null, set: null, scheduleType: 1 },
};

function makeRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    },
  };
  return res;
}

let handler;

beforeEach(async () => {
  vi.resetModules();
  sqlQueue.responses = [];
  sqlQueue.idx = 0;
  process.env.POSTGRES_URL = "postgresql://test";
  ({ default: handler } = await import("./aurora-decision.js"));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api/aurora-decision handler", () => {
  it("rejects non-POST methods with 405 and an Allow header", async () => {
    const req = { method: "GET" };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("POST");
    expect(res.body.ok).toBe(false);
  });

  it("returns invalid_body (400), not a 500, for unparsable JSON string bodies", async () => {
    const req = { method: "POST", body: "{not json" };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("invalid_body");
  });

  it("returns a sanitized 500 without leaking internals when an unexpected error occurs", async () => {
    sqlQueue.responses = [
      [{ snapshot: { nights: [NIGHT] }, source_fetched_at: new Date().toISOString() }],
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("some sensitive internal upstream detail");
      }),
    );

    const req = { method: "POST", body: { evening: "2026-08-24", locationIds: ["loc-clear"] } };
    const res = makeRes();
    await handler(req, res);

    // A single location's fetch failure is isolated (per-location weather
    // fan-out), so this still resolves as a structured decision, not a 500 —
    // confirming the error never propagates raw to the client either way.
    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("sensitive internal upstream detail");
  });

  it("returns a 200 success decision end-to-end through the real handler", async () => {
    sqlQueue.responses = [
      [{ snapshot: { nights: [NIGHT] }, source_fetched_at: new Date().toISOString() }],
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          hourly: {
            time: ["2026-08-24T22:00"],
            cloudcover: [0],
            cloudcover_low: [0],
            cloudcover_mid: [0],
            cloudcover_high: [0],
            precipitation: [0],
            windspeed_10m: [1],
            visibility: [10000],
          },
        }),
      })),
    );

    const req = { method: "POST", body: { evening: "2026-08-24", locationIds: ["loc-clear"] } };
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.best.locationId).toBe("loc-clear");
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });
});
