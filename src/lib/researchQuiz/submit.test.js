import { describe, it, expect, vi } from "vitest";
import { submitResearchQuizPayload, SUBMIT_STATUS } from "./submit";

const PAYLOAD = { session_id: "s-1", test_version: "1" };

describe("submitResearchQuizPayload — request contract", () => {
  it("sends a CORS simple request: POST, text/plain;charset=utf-8, serialized body, no custom headers, no no-cors mode", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, receivedAt: "x" }) });
    await submitResearchQuizPayload({ webAppUrl: "https://script.google.com/x/exec", payload: PAYLOAD, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://script.google.com/x/exec");
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify(PAYLOAD));
    expect(typeof options.body).toBe("string");
    expect(options.headers).toEqual({ "Content-Type": "text/plain;charset=utf-8" });
    expect(Object.keys(options.headers)).toEqual(["Content-Type"]);
    expect(options.mode).not.toBe("no-cors");
  });
});

describe("submitResearchQuizPayload — outcomes", () => {
  it("confirms only when the parsed body says ok: true", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, receivedAt: "2026-08-24T12:00:00Z" }) });
    const result = await submitResearchQuizPayload({ webAppUrl: "https://x", payload: PAYLOAD, fetchImpl });
    expect(result).toEqual({ status: SUBMIT_STATUS.CONFIRMED, receivedAt: "2026-08-24T12:00:00Z" });
  });

  it("reports failed for a readable ok:false response, retryable only for 'busy'", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ json: async () => ({ ok: false, code: "invalid_version", error: "invalid_version" }) });
    const result = await submitResearchQuizPayload({ webAppUrl: "https://x", payload: PAYLOAD, fetchImpl });
    expect(result).toEqual({ status: SUBMIT_STATUS.FAILED, retryable: false, code: "invalid_version", error: "invalid_version" });

    const busyFetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: false, code: "busy", error: "busy" }) });
    const busyResult = await submitResearchQuizPayload({ webAppUrl: "https://x", payload: PAYLOAD, fetchImpl: busyFetch });
    expect(busyResult.retryable).toBe(true);
  });

  it("reports unconfirmed on a network error, never throwing", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await submitResearchQuizPayload({ webAppUrl: "https://x", payload: PAYLOAD, fetchImpl });
    expect(result).toEqual({ status: SUBMIT_STATUS.UNCONFIRMED, reason: "network_error" });
  });

  it("reports unconfirmed on a timeout (AbortError)", async () => {
    const fetchImpl = vi.fn(() => new Promise((_, reject) => {
      const err = new Error("aborted");
      err.name = "AbortError";
      reject(err);
    }));
    const result = await submitResearchQuizPayload({ webAppUrl: "https://x", payload: PAYLOAD, fetchImpl, timeoutMs: 5 });
    expect(result).toEqual({ status: SUBMIT_STATUS.UNCONFIRMED, reason: "timeout" });
  });

  it("reports unconfirmed for an unreadable/opaque response body — never labels an opaque response confirmed", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      json: async () => {
        throw new Error("body is opaque/unreadable");
      },
    });
    const result = await submitResearchQuizPayload({ webAppUrl: "https://x", payload: PAYLOAD, fetchImpl });
    expect(result.status).toBe(SUBMIT_STATUS.UNCONFIRMED);
  });

  it("reports unconfirmed for a response body with an unexpected shape (no ok field)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ json: async () => ({ somethingElse: true }) });
    const result = await submitResearchQuizPayload({ webAppUrl: "https://x", payload: PAYLOAD, fetchImpl });
    expect(result).toEqual({ status: SUBMIT_STATUS.UNCONFIRMED, reason: "unexpected_response_shape" });
  });
});
