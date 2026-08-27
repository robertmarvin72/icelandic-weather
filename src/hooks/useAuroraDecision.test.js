import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuroraDecision } from "./useAuroraDecision";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";

beforeEach(() => clearAuroraDecisionCache());

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => body };
}

describe("useAuroraDecision — seasonal suppression", () => {
  it("never fetches and stays idle when disabled", () => {
    const fetchImpl = vi.fn();
    const { result } = renderHook(() =>
      useAuroraDecision({ enabled: false, evening: "2026-09-01", locationIds: ["a"], fetchImpl }),
    );
    expect(result.current.status).toBe("idle");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("useAuroraDecision — request shape and canonical order", () => {
  it("sends normalized (deduped, sorted) locationIds regardless of input order", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true, status: "success" }));
    renderHook(() =>
      useAuroraDecision({ enabled: true, evening: "2026-09-01", locationIds: ["b", "a", "a"], fetchImpl }),
    );
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    const [, options] = fetchImpl.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ evening: "2026-09-01", locationIds: ["a", "b"] });
  });

  it("identical context (Free or Pro alike) shares the SAME single request via cache reuse, never two divergent calls", async () => {
    // Two independent hook instances (standing in for Free/Pro rendering the
    // same context) resolve to the exact same underlying request — the
    // strongest possible form of "identical request for identical context":
    // there is only ever one.
    const fetchA = vi.fn().mockResolvedValue(jsonResponse({ ok: true, status: "success" }));
    const fetchB = vi.fn().mockResolvedValue(jsonResponse({ ok: true, status: "success" }));
    const { result: resultA } = renderHook(() =>
      useAuroraDecision({ enabled: true, evening: "2026-09-01", locationIds: ["a", "b"], fetchImpl: fetchA }),
    );
    const { result: resultB } = renderHook(() =>
      useAuroraDecision({ enabled: true, evening: "2026-09-01", locationIds: ["a", "b"], fetchImpl: fetchB }),
    );
    await waitFor(() => expect(resultA.current.status).toBe("resolved"));
    await waitFor(() => expect(resultB.current.status).toBe("resolved"));

    expect(fetchA.mock.calls.length + fetchB.mock.calls.length).toBe(1);
    expect(resultA.current.outcome).toEqual(resultB.current.outcome);
  });
});

describe("useAuroraDecision — in-flight/recent reuse across rerenders and Strict Mode replay", () => {
  it("issues exactly one fetch across a rerender with the same identity", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true, status: "success" }));
    const { rerender } = renderHook(
      ({ evening }) => useAuroraDecision({ enabled: true, evening, locationIds: ["a"], fetchImpl }),
      { initialProps: { evening: "2026-09-01" } },
    );
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    rerender({ evening: "2026-09-01" });
    rerender({ evening: "2026-09-01" });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
  });

  it("simulates Strict Mode's double-invoke (mount, unmount, remount) with a single underlying request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true, status: "success" }));
    const { unmount } = renderHook(() =>
      useAuroraDecision({ enabled: true, evening: "2026-09-01", locationIds: ["a"], fetchImpl }),
    );
    unmount();
    renderHook(() => useAuroraDecision({ enabled: true, evening: "2026-09-01", locationIds: ["a"], fetchImpl }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
  });
});

describe("useAuroraDecision — obsolete completion protection", () => {
  it("never applies a stale response after the identity has changed", async () => {
    let resolveFirst;
    const fetchImpl = vi.fn().mockImplementation((url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.evening === "2026-09-01") {
        return new Promise((resolve) => { resolveFirst = resolve; });
      }
      return Promise.resolve(jsonResponse({ ok: true, status: "success", tag: "second" }));
    });

    const { result, rerender } = renderHook(
      ({ evening }) => useAuroraDecision({ enabled: true, evening, locationIds: ["a"], fetchImpl }),
      { initialProps: { evening: "2026-09-01" } },
    );

    rerender({ evening: "2026-09-02" });
    await waitFor(() => expect(result.current.status).toBe("resolved"));
    expect(result.current.outcome.body.tag).toBe("second");

    // The first (obsolete) request now resolves late — must not overwrite.
    await act(async () => {
      resolveFirst(jsonResponse({ ok: true, status: "success", tag: "first-obsolete" }));
      await Promise.resolve();
    });
    expect(result.current.outcome.body.tag).toBe("second");
  });
});

describe("useAuroraDecision — retry", () => {
  it("bypasses reuse and issues exactly one fresh request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true, status: "success" }));
    const { result } = renderHook(() =>
      useAuroraDecision({ enabled: true, evening: "2026-09-01", locationIds: ["a"], fetchImpl }),
    );
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));

    act(() => result.current.retry());
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  });
});
