// Ticket #460 — useRoutePlanner.js had NO test file before this ticket. The
// hook previously set `routeRiskData` to `null` on any estimator failure
// (silent, indistinguishable from "no risk info"); it must now expose a
// visible UNKNOWN result plus an additive, optional `routeRiskStatus` field
// (J5) without changing the existing cancellation/reset behavior that
// prevents a stale candidate's risk from leaking onto a new one.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useRoutePlanner } from "./useRoutePlanner";
import { getRelocationRecommendation } from "../lib/relocationService";
import { estimateRouteRisk } from "../lib/routeRisk";

vi.mock("../lib/relocationService", () => ({ getRelocationRecommendation: vi.fn() }));
vi.mock("../lib/forecastCache", () => ({ getForecast: vi.fn() }));
vi.mock("../lib/routeRisk", () => ({ estimateRouteRisk: vi.fn() }));

const t = (k) => k;

function baseProps(overrides = {}) {
  return {
    isPro: true,
    isPreview: false,
    baseSiteId: "base-1",
    baseSite: { lat: 64.1, lon: -21.9 },
    sites: [{ id: "dest-1", lat: 64.5, lon: -20.5 }],
    effectiveRadiusKm: 50,
    effectiveWindowDays: 3,
    effectiveLimit: 5,
    t,
    ...overrides,
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

const COMPLETE_COVERAGE = {
  status: "complete",
  wind: { requested: 7, returned: 7, valid: 7 },
  gust: { requested: 7, returned: 7, valid: 7 },
  rain: { requested: 7, returned: 7, valid: 7 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRoutePlanner — route risk status lifecycle (J5)", () => {
  it("not-requested: recommendation is stay, routeRiskStatus stays undefined, no risk call made", async () => {
    getRelocationRecommendation.mockResolvedValue({
      ranked: [{ siteId: "dest-1", recommendation: "stay" }],
      recommendation: "stay",
    });

    const { result } = renderHook((props) => useRoutePlanner(props), { initialProps: baseProps() });
    await waitFor(() => expect(result.current.result).not.toBeNull());

    expect(estimateRouteRisk).not.toHaveBeenCalled();
    expect(result.current.routeRiskStatus).toBeUndefined();
    expect(result.current.routeRiskData).toBeNull();
  });

  it("delayed completion: loading true while awaiting, then populates with status mapped from partial coverage", async () => {
    getRelocationRecommendation.mockResolvedValue({
      ranked: [{ siteId: "dest-1", recommendation: "move" }],
      recommendation: "move",
    });
    const d = deferred();
    estimateRouteRisk.mockReturnValue(d.promise);

    const { result } = renderHook((props) => useRoutePlanner(props), { initialProps: baseProps() });
    await waitFor(() => expect(estimateRouteRisk).toHaveBeenCalledTimes(1));
    expect(result.current.routeRiskLoading).toBe(true);

    await act(async () => {
      d.resolve({
        routeRisk: "MED",
        maxWind: 15,
        maxGust: 10,
        rainMax: 2,
        coverage: {
          status: "partial",
          wind: { requested: 7, returned: 5, valid: 5 },
          gust: { requested: 7, returned: 5, valid: 5 },
          rain: { requested: 7, returned: 5, valid: 5 },
        },
        routeDate: "2026-10-27",
        dateVerified: true,
      });
    });

    await waitFor(() => expect(result.current.routeRiskLoading).toBe(false));
    expect(result.current.routeRiskData.routeRisk).toBe("MED");
    expect(result.current.routeRiskStatus).toBe("partial");
  });

  it("coverage.status complete -> routeRiskStatus 'complete'", async () => {
    getRelocationRecommendation.mockResolvedValue({
      ranked: [{ siteId: "dest-1", recommendation: "move" }],
      recommendation: "move",
    });
    estimateRouteRisk.mockResolvedValue({
      routeRisk: "LOW",
      maxWind: 5,
      maxGust: 5,
      rainMax: 0,
      coverage: COMPLETE_COVERAGE,
      routeDate: null,
      dateVerified: false,
    });

    const { result } = renderHook((props) => useRoutePlanner(props), { initialProps: baseProps() });
    await waitFor(() => expect(result.current.routeRiskData).not.toBeNull());
    expect(result.current.routeRiskStatus).toBe("complete");
  });

  it("coverage.status unavailable -> routeRiskStatus 'unknown' (never silently 'failed')", async () => {
    getRelocationRecommendation.mockResolvedValue({
      ranked: [{ siteId: "dest-1", recommendation: "move" }],
      recommendation: "move",
    });
    estimateRouteRisk.mockResolvedValue({
      routeRisk: "UNKNOWN",
      maxWind: null,
      maxGust: null,
      rainMax: null,
      coverage: {
        status: "unavailable",
        wind: { requested: 7, returned: 0, valid: 0 },
        gust: { requested: 7, returned: 0, valid: 0 },
        rain: { requested: 7, returned: 0, valid: 0 },
      },
      routeDate: null,
      dateVerified: false,
    });

    const { result } = renderHook((props) => useRoutePlanner(props), { initialProps: baseProps() });
    await waitFor(() => expect(result.current.routeRiskData).not.toBeNull());
    expect(result.current.routeRiskData.routeRisk).toBe("UNKNOWN");
    expect(result.current.routeRiskStatus).toBe("unknown");
  });

  it("thrown estimator (failed path): visible UNKNOWN, never the old silent null", async () => {
    getRelocationRecommendation.mockResolvedValue({
      ranked: [{ siteId: "dest-1", recommendation: "move" }],
      recommendation: "move",
    });
    estimateRouteRisk.mockRejectedValue(new Error("boom"));

    const { result } = renderHook((props) => useRoutePlanner(props), { initialProps: baseProps() });
    await waitFor(() => expect(estimateRouteRisk).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.routeRiskData).not.toBeNull());

    expect(result.current.routeRiskData).not.toBeNull();
    expect(result.current.routeRiskData.routeRisk).toBe("UNKNOWN");
    expect(result.current.routeRiskStatus).toBe("failed");
  });

  it("dateVerifiedTomorrow is true only when the estimator's date matches the real calendar tomorrow", async () => {
    getRelocationRecommendation.mockResolvedValue({
      ranked: [{ siteId: "dest-1", recommendation: "move" }],
      recommendation: "move",
    });

    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const tomorrowISO = tomorrow.toISOString().slice(0, 10);

    estimateRouteRisk.mockResolvedValue({
      routeRisk: "LOW",
      maxWind: 5,
      maxGust: 5,
      rainMax: 0,
      coverage: COMPLETE_COVERAGE,
      routeDate: tomorrowISO,
      dateVerified: true,
    });

    const { result } = renderHook((props) => useRoutePlanner(props), { initialProps: baseProps() });
    await waitFor(() => expect(result.current.routeRiskData).not.toBeNull());
    expect(result.current.routeRiskData.dateVerifiedTomorrow).toBe(true);
  });

  it("mismatched/unverified date never claims tomorrow", async () => {
    getRelocationRecommendation.mockResolvedValue({
      ranked: [{ siteId: "dest-1", recommendation: "move" }],
      recommendation: "move",
    });
    estimateRouteRisk.mockResolvedValue({
      routeRisk: "LOW",
      maxWind: 5,
      maxGust: 5,
      rainMax: 0,
      coverage: COMPLETE_COVERAGE,
      routeDate: "1999-01-01",
      dateVerified: true,
    });

    const { result } = renderHook((props) => useRoutePlanner(props), { initialProps: baseProps() });
    await waitFor(() => expect(result.current.routeRiskData).not.toBeNull());
    expect(result.current.routeRiskData.dateVerifiedTomorrow).toBe(false);
  });

  it("cancellation/new-candidate race: a stale resolve after a new candidate is selected must not win", async () => {
    getRelocationRecommendation
      .mockResolvedValueOnce({
        ranked: [{ siteId: "dest-1", recommendation: "move" }],
        recommendation: "move",
      })
      .mockResolvedValueOnce({
        ranked: [{ siteId: "dest-2", recommendation: "move" }],
        recommendation: "move",
      });

    const d1 = deferred();
    const d2 = deferred();
    estimateRouteRisk.mockReturnValueOnce(d1.promise).mockReturnValueOnce(d2.promise);

    const { result, rerender } = renderHook((props) => useRoutePlanner(props), {
      initialProps: baseProps({ sites: [{ id: "dest-1", lat: 64.5, lon: -20.5 }] }),
    });

    await waitFor(() => expect(estimateRouteRisk).toHaveBeenCalledTimes(1));

    // Select a new candidate before the first route-risk call resolves.
    rerender(
      baseProps({
        baseSiteId: "base-2",
        sites: [{ id: "dest-2", lat: 65.0, lon: -19.0 }],
      })
    );

    await waitFor(() => expect(estimateRouteRisk).toHaveBeenCalledTimes(2));

    // Resolve the STALE first call with HIGH after the new candidate's
    // request is already in flight — this must be a no-op.
    await act(async () => {
      d1.resolve({
        routeRisk: "HIGH",
        maxWind: 25,
        maxGust: 25,
        rainMax: 0,
        coverage: COMPLETE_COVERAGE,
        routeDate: null,
        dateVerified: false,
      });
    });

    // Resolve the current (new candidate's) call with LOW.
    await act(async () => {
      d2.resolve({
        routeRisk: "LOW",
        maxWind: 5,
        maxGust: 5,
        rainMax: 0,
        coverage: COMPLETE_COVERAGE,
        routeDate: null,
        dateVerified: false,
      });
    });

    await waitFor(() => expect(result.current.routeRiskLoading).toBe(false));
    // The stale HIGH must never win over the current candidate's LOW.
    expect(result.current.routeRiskData.routeRisk).toBe("LOW");
  });
});
