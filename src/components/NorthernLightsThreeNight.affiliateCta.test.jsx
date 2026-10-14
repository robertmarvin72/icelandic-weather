// Ticket #430 — affiliate CTA eligibility and wiring inside the REAL shared
// module (not a mocked CTA): F1/C1 predicate (keyed on the slot actually
// displayed), exactly-one-CTA on both placements, forecast_verdict/
// selected_night sourcing, and the 1440-minute expiry-crossing removal.
// Reuses the same fetchImpl fixture contract as NorthernLightsThreeNight.test.jsx
// — never a manufactured endpoint shape.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NorthernLightsThreeNight from "./NorthernLightsThreeNight";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./NorthernLightsMap", () => ({ default: () => <div data-testid="nl-map-container" /> }));

const t = (k) => k;
const IN_SEASON_NOW = () => new Date("2026-09-25T20:00:00.000Z");

function loc(id, score, band, name = id) {
  return { locationId: id, name, lat: 64, lon: -20, score, band, reasons: ["meaningful_activity", "clear_sky"], flags: [] };
}

function successBody(evening, entries, overrides = {}) {
  const [best, ...alternatives] = entries;
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-25T18:00:00.000Z", ageMinutes: 10 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best,
    alternatives,
    excluded: [],
    warnings: [],
    ...overrides,
  };
}

function unavailableBody(evening, reason = "night_not_found") {
  return { ok: true, evening, auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-25T18:00:00.000Z", ageMinutes: 10 }, viewingWindow: null, status: "unavailable", reason, best: null, alternatives: [], excluded: [], warnings: [] };
}

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => body };
}

function routedFetchImpl(byEvening) {
  return vi.fn().mockImplementation((url, opts) => {
    const body = JSON.parse(opts.body);
    const entry = byEvening[body.evening];
    return Promise.resolve(jsonResponse(entry ?? unavailableBody(body.evening)));
  });
}

function allGoodFetchImpl() {
  return routedFetchImpl({
    "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 70, "good", "Tonight Place")]),
    "2026-09-26": successBody("2026-09-26", [loc(AURORA_CANDIDATE_LOCATION_IDS[1], 30, "poor", "Tomorrow Place")]),
    "2026-09-27": successBody("2026-09-27", [loc(AURORA_CANDIDATE_LOCATION_IDS[2], 25, "very-poor", "Day2 Place")]),
  });
}

function renderModule(props = {}) {
  return render(
    <NorthernLightsThreeNight
      t={t}
      lang="en"
      entitlements={{ isPro: false }}
      theme="light"
      now={IN_SEASON_NOW}
      loadingMe={false}
      fetchImpl={allGoodFetchImpl()}
      {...props}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  sessionStorage.clear();
});

describe("NorthernLightsThreeNight — affiliate CTA eligibility (F1/C1)", () => {
  it("fresh usable (success, good band): CTA renders exactly once with forecast_verdict/selected_night from the displayed slot", async () => {
    renderModule();
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta")).toHaveLength(1));
  });

  it("usable but very-poor (all-poor parity with favorable): CTA still renders", async () => {
    renderModule({
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 10, "very-poor")]),
        "2026-09-26": unavailableBody("2026-09-26"),
        "2026-09-27": unavailableBody("2026-09-27"),
      }),
    });
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta")).toHaveLength(1));
  });

  it("partial status is eligible", async () => {
    renderModule({
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 55, "fair")], { status: "partial", excluded: [{ locationId: AURORA_CANDIDATE_LOCATION_IDS[1], reason: "upstream_error" }] }),
        "2026-09-26": unavailableBody("2026-09-26"),
        "2026-09-27": unavailableBody("2026-09-27"),
      }),
    });
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta")).toHaveLength(1));
  });

  it("usable-stale result: CTA still renders alongside the existing stale notice (freshness labeling is untouched)", async () => {
    renderModule({
      // sourceFetchedAt 500 minutes before "now" -> stale (between 480 and 1440).
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 70, "good")], {
          auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-25T11:40:00.000Z", ageMinutes: 500 },
        }),
        "2026-09-26": unavailableBody("2026-09-26"),
        "2026-09-27": unavailableBody("2026-09-27"),
      }),
    });
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta")).toHaveLength(1));
    expect(screen.getByTestId("nl3-result")).toBeInTheDocument();
  });

  it("unavailable/no-darkness/error primaries: no CTA", async () => {
    renderModule({
      fetchImpl: routedFetchImpl({
        "2026-09-25": unavailableBody("2026-09-25"),
        "2026-09-26": unavailableBody("2026-09-26"),
        "2026-09-27": unavailableBody("2026-09-27"),
      }),
    });
    await waitFor(() => expect(screen.getByTestId("nl3-module")).toBeInTheDocument());
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();
  });

  it("malformed best (unknown band): ineligible, no CTA", async () => {
    renderModule({
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 70, "mediocre")]), // not a known band
        "2026-09-26": unavailableBody("2026-09-26"),
        "2026-09-27": unavailableBody("2026-09-27"),
      }),
    });
    await waitFor(() => expect(screen.getByTestId("nl3-module")).toBeInTheDocument());
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();
  });

  it("malformed best (non-finite score): ineligible, no CTA", async () => {
    renderModule({
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [{ ...loc(AURORA_CANDIDATE_LOCATION_IDS[0], 70, "good"), score: NaN }]),
        "2026-09-26": unavailableBody("2026-09-26"),
        "2026-09-27": unavailableBody("2026-09-27"),
      }),
    });
    await waitFor(() => expect(screen.getByTestId("nl3-module")).toBeInTheDocument());
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();
  });

  it("loading (never resolved): no CTA", async () => {
    const fetchImpl = vi.fn(() => new Promise(() => {})); // never resolves
    renderModule({ fetchImpl });
    await waitFor(() => expect(screen.getByTestId("nl3-module")).toBeInTheDocument());
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();
  });

  it("out of season: module renders nothing, including no CTA", () => {
    renderModule({ now: () => new Date("2026-06-01T20:00:00.000Z"), fetchImpl: vi.fn() });
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();
  });

  it("both placements render exactly one CTA each (landing default, homepage surface)", async () => {
    const { unmount } = renderModule({ surface: "landing" });
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta")).toHaveLength(1));
    unmount();
    clearAuroraDecisionCache();

    render(
      <MemoryRouter>
        <NorthernLightsThreeNight t={t} lang="en" entitlements={{ isPro: false }} theme="light" now={IN_SEASON_NOW} loadingMe={false} fetchImpl={allGoodFetchImpl()} surface="homepage" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta")).toHaveLength(1));
  });

  it("1440-minute expiry crossing while mounted: CTA is removed (without the module itself touching any impression holder)", async () => {
    let currentTime = new Date("2026-09-25T20:00:00.000Z");
    const now = () => currentTime;
    vi.useFakeTimers();
    vi.setSystemTime(currentTime);

    // sourceFetchedAt exactly 1430 minutes before "now" -> still usable/stale (< 1440).
    const fetchedAt = new Date(currentTime.getTime() - 1430 * 60000).toISOString();
    render(
      <NorthernLightsThreeNight
        t={t}
        lang="en"
        entitlements={{ isPro: false }}
        theme="light"
        now={now}
        loadingMe={false}
        fetchImpl={routedFetchImpl({
          "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 70, "good")], {
            auroraCache: { state: "fresh", sourceFetchedAt: fetchedAt, ageMinutes: 1430 },
          }),
          "2026-09-26": unavailableBody("2026-09-26"),
          "2026-09-27": unavailableBody("2026-09-27"),
        })}
      />
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByTestId("affiliate-nl-cta")).toBeInTheDocument();

    // Cross the 1440-minute boundary: advance both the mutable clock and the
    // fake timers so the module's own boundary timer fires and re-derives
    // freshness (same mechanism the existing stale/expired UI already relies
    // on — not a new expiry rule).
    currentTime = new Date(currentTime.getTime() + 20 * 60000 + 2000);
    vi.setSystemTime(currentTime);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20 * 60000 + 2000);
    });

    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();
    vi.useRealTimers();
  });

  it("works without an affiliateImpressionHolder prop at all (standalone mount, matches existing test pattern)", async () => {
    renderModule(); // no affiliateImpressionHolder passed
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta")).toHaveLength(1));
  });

  it("forecast_verdict reflects the canonical best.band even for very-poor, not classification.primary", async () => {
    const holder = { visitId: "v1", tryConsume: () => true };
    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb) {
        this.cb = cb;
      }
      observe() {
        this.cb([{ isIntersecting: true, intersectionRatio: 1 }]);
      }
      disconnect() {}
    });
    renderModule({
      affiliateImpressionHolder: holder,
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 5, "very-poor")]),
        "2026-09-26": unavailableBody("2026-09-26"),
        "2026-09-27": unavailableBody("2026-09-27"),
      }),
    });
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith("affiliate_offer_viewed", expect.objectContaining({ forecast_verdict: "very-poor", selected_night: "2026-09-25" })));
    vi.unstubAllGlobals();
  });
});
