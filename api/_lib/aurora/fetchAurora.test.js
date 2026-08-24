// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAuroraXml } from "./fetchAurora.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchAuroraXml", () => {
  it("calls the Icelandic aurora endpoint exactly once — no retry loop", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => "<aurora></aurora>" });

    const xml = await fetchAuroraXml();

    expect(global.fetch).toHaveBeenCalledOnce();
    expect(global.fetch.mock.calls[0][0]).toBe("https://xmlweather.vedur.is/aurora?op=xml&type=index");
    expect(xml).toBe("<aurora></aurora>");
  });

  it("throws (does not retry) on a non-2xx upstream status", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "" });

    await expect(fetchAuroraXml()).rejects.toThrow(/503/);
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("throws a clear timeout error and does not retry when the request aborts", async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        opts.signal.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const promise = fetchAuroraXml();
    const assertion = expect(promise).rejects.toThrow(/timeout/i);
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;

    expect(global.fetch).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("propagates a plain network failure without retrying", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    await expect(fetchAuroraXml()).rejects.toThrow("fetch failed");
    expect(global.fetch).toHaveBeenCalledOnce();
  });
});
