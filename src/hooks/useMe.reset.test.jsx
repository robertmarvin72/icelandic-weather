import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMe } from "./useMe";

const ANONYMOUS = {
  ok: true,
  user: null,
  subscription: null,
  entitlements: { pro: false, proUntil: null },
};

const PRO_BODY = {
  ok: true,
  user: { id: "u1", email: "camper@example.com" },
  subscription: { status: "active" },
  entitlements: { pro: true, proUntil: "2030-01-01T00:00:00.000Z" },
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function okResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

describe("useMe resetMe", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resets to the normalized anonymous state without fetching", async () => {
    fetchMock.mockResolvedValueOnce(okResponse(PRO_BODY));
    const { result } = renderHook(() => useMe());
    await waitFor(() => expect(result.current.me?.user?.email).toBe("camper@example.com"));

    act(() => result.current.resetMe());

    expect(result.current.me).toEqual(ANONYMOUS);
    expect(result.current.loadingMe).toBe(false);
    expect(result.current.meError).toBe(null);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("discards a response still in flight from before the reset", async () => {
    const body = deferred();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: () => body.promise });
    const { result } = renderHook(() => useMe());

    act(() => result.current.resetMe());
    await act(async () => {
      body.resolve(PRO_BODY);
      await body.promise;
    });

    expect(result.current.me).toEqual(ANONYMOUS);
    expect(result.current.me.entitlements.pro).toBe(false);
    expect(result.current.loadingMe).toBe(false);
  });

  it("ignores a stale rejection and stale finally after the reset", async () => {
    const pending = deferred();
    fetchMock.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useMe());

    act(() => result.current.resetMe());
    await act(async () => {
      pending.reject(new Error("network down"));
      await pending.promise.catch(() => {});
    });

    expect(result.current.meError).toBe(null);
    expect(result.current.me).toEqual(ANONYMOUS);
    expect(result.current.loadingMe).toBe(false);
  });

  it("applies a request made after the reset normally, such as re-login", async () => {
    fetchMock.mockResolvedValueOnce(okResponse(ANONYMOUS));
    fetchMock.mockResolvedValueOnce(okResponse(PRO_BODY));
    const { result } = renderHook(() => useMe());
    await waitFor(() => expect(result.current.loadingMe).toBe(false));

    act(() => result.current.resetMe());
    await act(async () => {
      await result.current.refetchMe();
    });

    expect(result.current.me.user.email).toBe("camper@example.com");
    expect(result.current.me.entitlements.pro).toBe(true);
    expect(result.current.loadingMe).toBe(false);
  });

  it("keeps refetch/refresh/reset identities stable across renders", async () => {
    fetchMock.mockResolvedValue(okResponse(ANONYMOUS));
    const { result, rerender } = renderHook(() => useMe());
    await waitFor(() => expect(result.current.loadingMe).toBe(false));

    const first = {
      refetchMe: result.current.refetchMe,
      refreshMe: result.current.refreshMe,
      resetMe: result.current.resetMe,
    };
    rerender();

    expect(result.current.refetchMe).toBe(first.refetchMe);
    expect(result.current.refreshMe).toBe(first.refreshMe);
    expect(result.current.resetMe).toBe(first.resetMe);
    expect(result.current.refetchMe).toBe(result.current.refreshMe);
  });
});
