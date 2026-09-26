import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuroraThreeNight } from "./useAuroraThreeNight";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";

beforeEach(() => {
  clearAuroraDecisionCache();
});

afterEach(() => {
  vi.useRealTimers();
});

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => body };
}

function successBodyFor(evening) {
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-25T18:00:00.000Z", ageMinutes: 10 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best: { locationId: AURORA_CANDIDATE_LOCATION_IDS[0], name: "A", lat: 64, lon: -20, score: 70, band: "good", reasons: [], flags: [] },
    alternatives: [],
    excluded: [],
    warnings: [],
  };
}

function routedFetchImpl(overrides = {}) {
  return vi.fn().mockImplementation((url, opts) => {
    const body = JSON.parse(opts.body);
    if (overrides[body.evening]) return overrides[body.evening](body);
    return Promise.resolve(jsonResponse(successBodyFor(body.evening)));
  });
}

describe("useAuroraThreeNight — three fixed evenings", () => {
  it("issues exactly 3 requests for 3 distinct consecutive UTC evenings, identical locationIds regardless of tier context", async () => {
    const fetchImpl = routedFetchImpl();
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
    const evenings = fetchImpl.mock.calls.map((c) => JSON.parse(c[1].body).evening).sort();
    expect(evenings).toEqual(["2026-09-25", "2026-09-26", "2026-09-27"]);

    for (const call of fetchImpl.mock.calls) {
      expect(JSON.parse(call[1].body).locationIds).toEqual([...AURORA_CANDIDATE_LOCATION_IDS].sort());
    }
  });

  it("each slot's classification carries its own requested evening's score/window — never a duplicated/mismatched value", async () => {
    const fetchImpl = routedFetchImpl();
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));

    await waitFor(() => expect(result.current.slots.every((s) => s.status === "resolved")).toBe(true));
    for (const slot of result.current.slots) {
      expect(slot.classification.body.evening).toBe(slot.date);
      expect(slot.classification.body.viewingWindow.start).toContain(slot.date);
    }
  });

  it("selecting a different night (setSelectedDate) issues no fourth request — all three are already fetched up front", async () => {
    const fetchImpl = routedFetchImpl();
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));

    act(() => result.current.setSelectedDate("2026-09-27"));
    expect(result.current.selectedDate).toBe("2026-09-27");
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
  });

  it("Strict Mode double-invoke (mount, unmount, remount) still issues exactly 3 underlying requests via cache reuse", async () => {
    const fetchImpl = routedFetchImpl();
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    const { unmount } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    unmount();
    renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
  });

  it("season disabled: zero requests across all three slots", async () => {
    const fetchImpl = vi.fn();
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: false, fetchImpl, now }));
    expect(result.current.slots.every((s) => s.status === "idle")).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("December 31 -> January 1/2 rollover produces the correct real calendar dates", async () => {
    const fetchImpl = routedFetchImpl();
    const now = () => new Date("2026-12-31T20:00:00.000Z");
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    await waitFor(() => expect(result.current.slots.every((s) => s.status === "resolved")).toBe(true));
    expect(result.current.slots.map((s) => s.date)).toEqual(["2026-12-31", "2027-01-01", "2027-01-02"]);
  });
});

describe("useAuroraThreeNight — retry", () => {
  it("a slot's own retry bypasses reuse and issues exactly one fresh request for that evening only", async () => {
    const fetchImpl = routedFetchImpl();
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));

    act(() => result.current.slots[1].retry());
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(4));
    const lastCall = fetchImpl.mock.calls[3];
    expect(JSON.parse(lastCall[1].body).evening).toBe("2026-09-26");
  });
});

describe("useAuroraThreeNight — identity safety", () => {
  it("a response whose own body.evening does not match the requested date is never surfaced as resolved (defensive guard beyond keyRef)", async () => {
    const fetchImpl = vi.fn().mockImplementation(() => {
      // Deliberately mismatched: server would never really do this, but the
      // guard must hold regardless of why the identity doesn't match.
      return Promise.resolve(jsonResponse(successBodyFor("2099-01-01")));
    });
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
    // Give the resolved-but-mismatched promises a tick to settle.
    await act(async () => {
      await Promise.resolve();
    });
    for (const slot of result.current.slots) {
      expect(slot.status).toBe("loading");
      expect(slot.classification).toBeNull();
    }
  });
});

describe("useAuroraThreeNight — midnight rollover and visibility-return reset", () => {
  it("recomputes slot dates once real UTC midnight passes, and resets a 'tonight' selection to the new tonight", async () => {
    vi.useFakeTimers();
    let mockNow = new Date("2026-09-25T23:50:00.000Z");
    const now = () => mockNow;
    const fetchImpl = routedFetchImpl();

    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
    expect(result.current.slots.map((s) => s.date)).toEqual(["2026-09-25", "2026-09-26", "2026-09-27"]);
    expect(result.current.selectedDate).toBe("2026-09-25");

    // Advance the mocked clock past midnight and let the bounded timer fire.
    mockNow = new Date("2026-09-26T00:05:00.000Z");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11 * 60 * 1000);
    });

    expect(result.current.slots.map((s) => s.date)).toEqual(["2026-09-26", "2026-09-27", "2026-09-28"]);
    // Previously-selected "tonight" (09-25) is no longer in the window -> resets to the new tonight.
    expect(result.current.selectedDate).toBe("2026-09-26");
  });

  it("preserves the selected calendar date across rollover when it is still inside the new 3-night window", async () => {
    vi.useFakeTimers();
    let mockNow = new Date("2026-09-25T23:50:00.000Z");
    const now = () => mockNow;
    const fetchImpl = routedFetchImpl();

    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));

    act(() => result.current.setSelectedDate("2026-09-26")); // "tomorrow night"

    mockNow = new Date("2026-09-26T00:05:00.000Z");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11 * 60 * 1000);
    });

    expect(result.current.slots.map((s) => s.date)).toEqual(["2026-09-26", "2026-09-27", "2026-09-28"]);
    // 09-26 is still in the new window (now as "tonight") -> selection preserved, not reset.
    expect(result.current.selectedDate).toBe("2026-09-26");
  });

  it("a visibility-return recompute on the SAME calendar day issues no extra requests (no periodic polling)", async () => {
    const fetchImpl = routedFetchImpl();
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
  });
});

describe("useAuroraThreeNight — client-side freshness re-derivation (Round 5)", () => {
  const MIN = 60000;

  function bodyWithFetchedAt(evening, sourceFetchedAt) {
    return { ...successBodyFor(evening), auroraCache: { state: "fresh", sourceFetchedAt, ageMinutes: 0 } };
  }

  function fetchWith(sourceFetchedAt) {
    return vi.fn().mockImplementation((url, opts) => {
      const { evening } = JSON.parse(opts.body);
      return Promise.resolve(jsonResponse(bodyWithFetchedAt(evening, sourceFetchedAt)));
    });
  }

  it("a fresh result becomes stale exactly past 480 minutes via the bounded boundary timer (no extra request)", async () => {
    vi.useFakeTimers();
    const fetchedAt = "2026-09-25T10:00:00.000Z";
    let mockNow = new Date("2026-09-25T12:00:00.000Z");
    vi.setSystemTime(mockNow);
    const fetchImpl = fetchWith(fetchedAt);
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now: () => mockNow }));
    await vi.waitFor(() => expect(result.current.slots.every((s) => s.status === "resolved")).toBe(true));
    expect(result.current.slots[0].classification.freshness).toBe("fresh");

    // Exactly at the inclusive boundary (age == 480m) it is still fresh.
    mockNow = new Date(Date.parse(fetchedAt) + 480 * MIN);
    vi.setSystemTime(mockNow);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.slots[0].classification.freshness).toBe("fresh");

    // One millisecond later the boundary timer fires and it is stale.
    mockNow = new Date(Date.parse(fetchedAt) + 480 * MIN + 1);
    vi.setSystemTime(mockNow);
    await act(async () => {
      // The boundary timer was armed ~6h out (12:00 -> 18:00:00.001); fake
      // timers' own clock is independent of setSystemTime, so advance it.
      await vi.advanceTimersByTimeAsync(6 * 60 * MIN + 1000);
    });
    expect(result.current.slots[0].classification.freshness).toBe("stale");
    expect(result.current.slots[0].classification.primary).toBe("success"); // still usable
    expect(fetchImpl).toHaveBeenCalledTimes(3); // no refresh loop
  });

  it("past 1440 minutes the result becomes an expired unavailable state with no body, until explicitly retried", async () => {
    vi.useFakeTimers();
    const fetchedAt = "2026-09-24T10:00:00.000Z";
    let mockNow = new Date("2026-09-25T09:00:00.000Z"); // 23h old -> stale
    vi.setSystemTime(mockNow);
    const fetchImpl = fetchWith(fetchedAt);
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now: () => mockNow }));
    await vi.waitFor(() => expect(result.current.slots.every((s) => s.status === "resolved")).toBe(true));
    expect(result.current.slots[0].classification.freshness).toBe("stale");

    mockNow = new Date(Date.parse(fetchedAt) + 1440 * MIN + 1);
    vi.setSystemTime(mockNow);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * MIN); // let the boundary timer fire
    });
    const slot = result.current.slots[0];
    expect(slot.classification.expired).toBe(true);
    expect(slot.classification.body).toBeNull();
    expect(typeof slot.retry).toBe("function");
  });

  it("same-day visibility return re-derives age with no extra request", async () => {
    vi.useFakeTimers();
    const fetchedAt = "2026-09-25T10:00:00.000Z";
    let mockNow = new Date("2026-09-25T12:00:00.000Z");
    vi.setSystemTime(mockNow);
    const fetchImpl = fetchWith(fetchedAt);
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now: () => mockNow }));
    await vi.waitFor(() => expect(result.current.slots.every((s) => s.status === "resolved")).toBe(true));
    expect(result.current.slots[0].classification.freshness).toBe("fresh");

    // Tab was backgrounded (timer throttled): clock jumps past the boundary, no timer has fired.
    mockNow = new Date("2026-09-25T20:00:00.000Z");
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    expect(result.current.slots[0].classification.freshness).toBe("stale");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("a usable result with a malformed timestamp is never fresh", async () => {
    const fetchImpl = fetchWith("not-a-timestamp");
    const now = () => new Date("2026-09-25T20:00:00.000Z");
    const { result } = renderHook(() => useAuroraThreeNight({ enabled: true, fetchImpl, now }));
    await waitFor(() => expect(result.current.slots.every((s) => s.status === "resolved")).toBe(true));
    for (const slot of result.current.slots) {
      expect(slot.classification.expired).toBe(true);
    }
  });
});
