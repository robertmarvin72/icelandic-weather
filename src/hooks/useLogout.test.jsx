import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogout } from "./useLogout";

const t = (key) => `T:${key}`;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function setup() {
  const resetMe = vi.fn();
  const pushToast = vi.fn();
  const { result, unmount } = renderHook(() => useLogout({ resetMe, pushToast, t }));
  return { result, resetMe, pushToast, unmount };
}

describe("useLogout", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs /api/logout with credentials, resets me, resolves true and shows no toast", async () => {
    fetchMock.mockResolvedValueOnce(response(200, { ok: true }));
    const { result, resetMe, pushToast } = setup();

    let outcome;
    await act(async () => {
      outcome = await result.current.logout();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/logout");
    expect(opts.method).toBe("POST");
    expect(opts.credentials).toBe("include");
    expect(outcome).toBe(true);
    expect(resetMe).toHaveBeenCalledTimes(1);
    expect(pushToast).not.toHaveBeenCalled();
    expect(result.current.loggingOut).toBe(false);
  });

  it("treats the revoke-failed note as success for the browser", async () => {
    fetchMock.mockResolvedValueOnce(response(200, { ok: true, note: "Cookie cleared; revoke may have failed" }));
    const { result, resetMe, pushToast } = setup();

    let outcome;
    await act(async () => {
      outcome = await result.current.logout();
    });

    expect(outcome).toBe(true);
    expect(resetMe).toHaveBeenCalledTimes(1);
    expect(pushToast).not.toHaveBeenCalled();
  });

  const failureCases = [
    ["non-2xx with ok:false", () => Promise.resolve(response(500, { ok: false, error: "x" }))],
    ["200 with ok:false", () => Promise.resolve(response(200, { ok: false }))],
    ["200 with malformed body", () => Promise.resolve({ ok: true, status: 200, json: async () => { throw new SyntaxError("bad"); } })],
    ["200 with empty body", () => Promise.resolve(response(200, null))],
    ["network rejection", () => Promise.reject(new TypeError("Failed to fetch"))],
  ];

  for (const [label, makeResult] of failureCases) {
    it(`${label} resolves false, keeps state, and shows a translated toast`, async () => {
      fetchMock.mockImplementationOnce(makeResult);
      const { result, resetMe, pushToast } = setup();

      let outcome;
      await act(async () => {
        outcome = await result.current.logout();
      });

      expect(outcome).toBe(false);
      expect(resetMe).not.toHaveBeenCalled();
      expect(pushToast).toHaveBeenCalledTimes(1);
      expect(pushToast.mock.calls[0][0]).toMatchObject({
        type: "error",
        message: "T:logoutFailed",
      });
      expect(result.current.loggingOut).toBe(false);
    });
  }

  it("allows retry after a failure by sending a second request", async () => {
    fetchMock.mockResolvedValueOnce(response(500, { ok: false }));
    fetchMock.mockResolvedValueOnce(response(200, { ok: true }));
    const { result, resetMe } = setup();

    await act(async () => {
      await result.current.logout();
    });
    let outcome;
    await act(async () => {
      outcome = await result.current.logout();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(outcome).toBe(true);
    expect(resetMe).toHaveBeenCalledTimes(1);
  });

  it("sends only one request while pending, even for a repeated call", async () => {
    const pending = deferred();
    fetchMock.mockReturnValueOnce(pending.promise);
    const { result, resetMe } = setup();

    let first;
    let second;
    await act(async () => {
      first = result.current.logout();
      second = await result.current.logout();
    });

    expect(result.current.loggingOut).toBe(true);
    expect(second).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve(response(200, { ok: true }));
      await first;
    });

    expect(await first).toBe(true);
    expect(resetMe).toHaveBeenCalledTimes(1);
    expect(result.current.loggingOut).toBe(false);
  });

  it("releases the in-flight guard in finally so a later call sends again", async () => {
    fetchMock.mockResolvedValueOnce(response(200, { ok: true }));
    fetchMock.mockResolvedValueOnce(response(200, { ok: true }));
    const { result } = setup();

    await act(async () => {
      await result.current.logout();
    });
    await act(async () => {
      await result.current.logout();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not throw or toast when the request fails after unmount", async () => {
    const pending = deferred();
    fetchMock.mockReturnValueOnce(pending.promise);
    const { result, pushToast, unmount } = setup();

    let outcomePromise;
    act(() => {
      outcomePromise = result.current.logout();
    });
    unmount();

    await act(async () => {
      pending.reject(new TypeError("Failed to fetch"));
    });

    await expect(outcomePromise).resolves.toBe(false);
    expect(pushToast).not.toHaveBeenCalled();
  });
});
