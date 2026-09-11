// Ticket 408 (#408) — useForecast's additive request-provenance field
// (`requestedFor`): proves it always identifies exactly which requested
// coordinates the CURRENT data/rows came from, including under rapid
// site-switching, a stale/late response, retry/failure, and a fast
// (cache-like) resolution. Nothing here changes payload shape,
// normalization, scoring, retries, or caching behavior.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useForecast } from "./useForecast";

vi.mock("../lib/forecastCache", () => ({ getForecast: vi.fn() }));

import { getForecast } from "../lib/forecastCache";

function dailyFixture(tmax = 10) {
  return {
    daily: {
      time: ["2026-09-08"],
      temperature_2m_max: [tmax],
      temperature_2m_min: [5],
      precipitation_sum: [0],
      windspeed_10m_max: [3],
      windgusts_10m_max: [5],
      winddirection_10m_dominant: [180],
      weathercode: [0],
    },
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useForecast — requestedFor provenance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is null before any request resolves", () => {
    getForecast.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useForecast(64.1, -21.9));
    expect(result.current.requestedFor).toBeNull();
  });

  it("matches the requested coordinates once the fetch resolves — not the provider's own response coordinates", async () => {
    getForecast.mockResolvedValue({ ...dailyFixture(), latitude: 64.099, longitude: -21.85 }); // provider's own (rounded) echo fields, if any
    const { result } = renderHook(() => useForecast(64.1, -21.9));
    await waitFor(() => expect(result.current.rows.length).toBe(1));
    expect(result.current.requestedFor).toEqual({ lat: 64.1, lon: -21.9 });
  });

  it("rapid A->B->C switching: requestedFor always matches the most recently resolved site's coordinates", async () => {
    getForecast.mockResolvedValueOnce(dailyFixture(10)).mockResolvedValueOnce(dailyFixture(11)).mockResolvedValueOnce(dailyFixture(12));

    const { result, rerender } = renderHook(({ lat, lon }) => useForecast(lat, lon), { initialProps: { lat: 1, lon: 1 } });
    await waitFor(() => expect(result.current.requestedFor).toEqual({ lat: 1, lon: 1 }));

    rerender({ lat: 2, lon: 2 });
    await waitFor(() => expect(result.current.requestedFor).toEqual({ lat: 2, lon: 2 }));

    rerender({ lat: 3, lon: 3 });
    await waitFor(() => expect(result.current.requestedFor).toEqual({ lat: 3, lon: 3 }));
  });

  it("the render immediately after a site change still reflects the OLD requestedFor, not null and not the new one", async () => {
    getForecast.mockResolvedValueOnce(dailyFixture(10)).mockReturnValueOnce(new Promise(() => {})); // second request never resolves in this test

    const { result, rerender } = renderHook(({ lat, lon }) => useForecast(lat, lon), { initialProps: { lat: 1, lon: 1 } });
    await waitFor(() => expect(result.current.requestedFor).toEqual({ lat: 1, lon: 1 }));

    rerender({ lat: 2, lon: 2 });
    // Synchronously right after the coordinate change — before the new
    // effect's fetch has any chance to resolve — requestedFor must still
    // show the OLD site, exactly like `rows` still does, so a consumer
    // comparing requestedFor against the new site correctly detects the
    // mismatch instead of trusting stale content.
    expect(result.current.requestedFor).toEqual({ lat: 1, lon: 1 });
    expect(result.current.rows[0].tmax).toBe(10); // still the old site's row too
  });

  it("a stale response that resolves AFTER a newer one never regresses requestedFor back to the older coordinates", async () => {
    const older = deferred();
    const newer = deferred();
    getForecast.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

    const { result, rerender } = renderHook(({ lat, lon }) => useForecast(lat, lon), { initialProps: { lat: 1, lon: 1 } });
    rerender({ lat: 2, lon: 2 }); // switch away before the older request resolves — its effect is now cleaned up (aborted)

    newer.resolve(dailyFixture(20));
    await waitFor(() => expect(result.current.requestedFor).toEqual({ lat: 2, lon: 2 }));

    older.resolve(dailyFixture(10)); // late/stale resolution for the abandoned request
    await new Promise((r) => setTimeout(r, 0)); // flush any pending microtask

    expect(result.current.requestedFor).toEqual({ lat: 2, lon: 2 }); // unchanged — never regressed to the stale site
    expect(result.current.rows[0].tmax).toBe(20);
  });

  it("a fast (cache-like) resolution still sets requestedFor through the same code path", async () => {
    getForecast.mockImplementation(() => Promise.resolve(dailyFixture(15)));
    const { result } = renderHook(() => useForecast(9, 9));
    await waitFor(() => expect(result.current.requestedFor).toEqual({ lat: 9, lon: 9 }));
  });

  it("requestedFor is never set for a request that ultimately fails after retries", async () => {
    getForecast.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useForecast(5, 5, { retries: 0 }));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.requestedFor).toBeNull();
  });

  it("a request that fails after retrying leaves requestedFor at whatever the LAST successful site was, not the failed one", async () => {
    getForecast.mockResolvedValueOnce(dailyFixture(7));
    const { result, rerender } = renderHook(({ lat, lon }) => useForecast(lat, lon, { retries: 0 }), { initialProps: { lat: 1, lon: 1 } });
    await waitFor(() => expect(result.current.requestedFor).toEqual({ lat: 1, lon: 1 }));

    getForecast.mockRejectedValueOnce(new Error("boom"));
    rerender({ lat: 2, lon: 2 });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.requestedFor).toEqual({ lat: 1, lon: 1 }); // untouched by the failed request for site 2
  });

  it("preserves all existing returned fields and their shapes — purely additive", async () => {
    getForecast.mockResolvedValue(dailyFixture());
    const { result } = renderHook(() => useForecast(1, 1));
    await waitFor(() => expect(result.current.rows.length).toBe(1));
    for (const key of ["data", "rows", "windDir", "shelter", "loading", "error", "retrying", "refetch", "requestedFor"]) {
      expect(Object.prototype.hasOwnProperty.call(result.current, key)).toBe(true);
    }
  });
});
