import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCampsites } from "./useCampsites";

const PRO_LIST = [
  { id: "pro-only", name: "Pro Camp" },
  { id: "free-a", name: "Free Camp" },
];
const FREE_LIST = [{ id: "free-a", name: "Free Camp" }];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

describe("useCampsites latest-wins", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("discards a late Pro response after a newer Free reload", async () => {
    const proRequest = deferred();
    fetchMock.mockReturnValueOnce(proRequest.promise);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, tier: "free", campsites: FREE_LIST }));

    const { result, rerender } = renderHook(({ reloadKey }) => useCampsites({ reloadKey }), {
      initialProps: { reloadKey: true },
    });

    rerender({ reloadKey: false });
    await waitFor(() => expect(result.current.campsites).toEqual(FREE_LIST));
    expect(result.current.tier).toBe("free");
    expect(result.current.loading).toBe(false);

    await act(async () => {
      proRequest.resolve(jsonResponse({ ok: true, tier: "pro", campsites: PRO_LIST }));
      await proRequest.promise;
    });

    expect(result.current.campsites).toEqual(FREE_LIST);
    expect(result.current.tier).toBe("free");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("discards a late failure from an earlier request", async () => {
    const staleRequest = deferred();
    fetchMock.mockReturnValueOnce(staleRequest.promise);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, tier: "free", campsites: FREE_LIST }));

    const { result, rerender } = renderHook(({ reloadKey }) => useCampsites({ reloadKey }), {
      initialProps: { reloadKey: true },
    });
    rerender({ reloadKey: false });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      staleRequest.reject(new Error("boom"));
      await staleRequest.promise.catch(() => {});
    });

    expect(result.current.error).toBe(null);
    expect(result.current.campsites).toEqual(FREE_LIST);
  });

  it("ignores a response that arrives after unmount without throwing", async () => {
    const pending = deferred();
    fetchMock.mockReturnValueOnce(pending.promise);

    const { unmount } = renderHook(() => useCampsites({ reloadKey: true }));
    unmount();

    await act(async () => {
      pending.resolve(jsonResponse({ ok: true, tier: "pro", campsites: PRO_LIST }));
      await pending.promise;
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
