// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./forecast.js";

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
