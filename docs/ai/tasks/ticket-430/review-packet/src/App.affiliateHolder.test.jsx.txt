// Ticket #430 — F2/C2: the affiliate impression dedup holder, owned in
// IcelandCampingWeatherApp ABOVE showCampsitesGate. Real App/router, real
// NorthernLightsThreeNight/AffiliateCta; only data-fetching hooks and heavy
// unrelated children are mocked (same established pattern as
// App.northernLightsAnchor.test.jsx).
//
// This app's actual About<->home navigation is a full page reload (About's
// link home is a plain <a>, confirmed in App.northernLightsAnchor.test.jsx);
// a fresh `render(<App/>)` per pathname mirrors that real behavior and is
// the established pattern this file follows for the "/ -> /about -> /"
// case. The campsites-gate test below is the one that actually exercises
// the holder surviving a remount WITHOUT any navigation.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { useWeatherVoice } from "./hooks/useWeatherVoice";
import { useCampsites } from "./hooks/useCampsites";
import { trackEvent } from "./lib/analytics";
import { clearAuroraDecisionCache } from "./lib/auroraDecisionCache";
import { AURORA_CANDIDATE_LOCATION_IDS as AURORA_IDS } from "./config/auroraCandidates";

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/react", () => ({ SpeedInsights: () => null }));
vi.mock("./lib/analytics", () => ({ trackEvent: vi.fn(), trackPageView: vi.fn(), initAnalytics: vi.fn() }));

const SITE = { id: "site-1", name: "Test Campsite", lat: 64.1, lon: -21.9 };

vi.mock("./hooks/useCampsites", () => ({ useCampsites: vi.fn() }));
const meState = vi.hoisted(() => ({ loadingMe: false }));
vi.mock("./hooks/useMe", () => ({ useMe: () => ({ me: null, loadingMe: meState.loadingMe, refetchMe: () => {}, resetMe: () => {} }) }));
vi.mock("./hooks/useLogout", () => ({ useLogout: () => ({ logout: vi.fn(), loggingOut: false }) }));
vi.mock("./hooks/useCheckoutFlow", () => ({
  useCheckoutFlow: () => ({ startCheckout: vi.fn(), openBillingPortal: vi.fn() }),
}));
vi.mock("./hooks/useLeaderboardScores", () => ({
  useLeaderboardScores: () => ({ scoresById: {}, loadingWave1: false, loadingBg: false }),
}));
vi.mock("./hooks/useTop5Campsites", () => ({ useTop5Campsites: () => ({ top5: [] }) }));
vi.mock("./hooks/useForecast", () => ({
  useForecast: () => ({ rows: [], windDir: null, shelter: null, loading: false, error: null, retrying: false, refetch: vi.fn(), requestedFor: null }),
}));
vi.mock("./hooks/useWeatherVoice", () => ({ useWeatherVoice: vi.fn() }));
// Avoids combining vi.useFakeTimers() (needed nowhere else here) with async
// effect flushing across this real App tree — pin season on directly instead.
// Partial mock: todayEveningUtc (used by auroraNightSlots.js) stays real.
vi.mock("./lib/auroraSeason", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, isAuroraSeason: () => true };
});

vi.mock("./components/RoutePlannerCard", () => ({ default: () => <div data-testid="route-planner-stub" /> }));
vi.mock("./components/CampsiteComparisonSection", () => ({ default: () => <div data-testid="comparison-section-stub" /> }));
vi.mock("./components/ForecastTable", () => ({ default: () => <div data-testid="forecast-table-stub" /> }));
vi.mock("./components/LazyMap", () => ({ default: () => <div data-testid="map-stub" /> }));
vi.mock("./components/Top5Leaderboard", () => ({ default: () => <div data-testid="top5-stub" /> }));
vi.mock("./components/WeatherFinder", () => ({ default: () => <div data-testid="weather-finder-stub" /> }));
vi.mock("./components/PageHeader", () => ({ default: () => <div data-testid="page-header-stub" /> }));
vi.mock("./components/HomeDecisionCard", () => ({ default: () => <div data-testid="home-decision-stub" /> }));
vi.mock("./components/WeatherVoiceCard", () => ({ default: () => null }));
vi.mock("./components/LoginModal", () => ({ default: () => null }));
vi.mock("./components/HourlyForecastModal", () => ({ default: () => null }));
vi.mock("./components/Footer", () => ({ default: () => <div data-testid="footer-stub" /> }));
vi.mock("./components/BackToTop", () => ({ default: () => null }));
vi.mock("./components/Splash", () => ({ default: () => null }));
vi.mock("./components/ToastHub", () => ({ default: () => null }));

class FakeIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {
    this.disconnected = true;
  }
  trigger(entries) {
    this.callback(entries);
  }
}
FakeIntersectionObserver.instances = [];

function loadedCampsites() {
  return { campsites: [SITE], loading: false, error: null };
}

function loadingCampsites() {
  return { campsites: [], loading: true, error: null };
}

function auroraSuccessBody(evening) {
  // Always "10 minutes ago" relative to the real wall clock (no fake timers
  // in this file — see the isAuroraSeason mock note above), so the result
  // stays fresh/usable regardless of when the suite actually runs.
  const sourceFetchedAt = new Date(Date.now() - 10 * 60000).toISOString();
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt, ageMinutes: 10 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best: { locationId: AURORA_IDS[0], name: "Tonight Place", lat: 64, lon: -20, score: 70, band: "good", reasons: ["meaningful_activity", "clear_sky"], flags: [] },
    alternatives: [],
    excluded: [],
    warnings: [],
  };
}

function installAuroraFetch() {
  global.fetch = vi.fn((url, opts) => {
    if (url === "/api/aurora-decision") {
      const body = JSON.parse(opts.body);
      return Promise.resolve({ ok: true, status: 200, json: async () => auroraSuccessBody(body.evening) });
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

async function mountAtHomeAndGetLatestCtaObserver() {
  const renderResult = render(<App />);
  await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta").length).toBeGreaterThan(0));
  return { ...renderResult, inst: FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1] };
}

function impressionCalls() {
  return trackEvent.mock.calls.filter(([name]) => name === "affiliate_offer_viewed");
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  meState.loadingMe = false;
  window.history.pushState({}, "", "/");
  Element.prototype.scrollIntoView = vi.fn();
  installAuroraFetch();
  useWeatherVoice.mockReturnValue({ presentation: { show: false }, action: null, onVisible: vi.fn(), episodeKey: null, shareSnapshot: null });
  useCampsites.mockReturnValue(loadedCampsites());
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App — affiliate impression holder survives a campsites-gate remount without a navigation", () => {
  it("one impression through a real campsites reload/remount (loading -> loaded) of the same visit", async () => {
    const { rerender } = render(<App />);
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta").length).toBeGreaterThan(0));
    let inst = FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
    inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(impressionCalls()).toHaveLength(1);

    // Campsites gate flips to loading (unmounts the "home" content branch,
    // including NorthernLightsThreeNight/AffiliateCta), then back to loaded
    // (remounts it) — all within the SAME route visit, no navigation.
    useCampsites.mockReturnValue(loadingCampsites());
    rerender(<App />);
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();

    useCampsites.mockReturnValue(loadedCampsites());
    rerender(<App />);
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta").length).toBeGreaterThan(0));

    inst = FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
    inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    // The holder (owned above the gate) survived the remount: still exactly one impression.
    expect(impressionCalls()).toHaveLength(1);
  });

  it("campsites error -> recovered also does not duplicate the impression", async () => {
    const { rerender } = render(<App />);
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta").length).toBeGreaterThan(0));
    let inst = FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
    inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(impressionCalls()).toHaveLength(1);

    useCampsites.mockReturnValue({ campsites: [], loading: false, error: new Error("boom") });
    rerender(<App />);
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();

    useCampsites.mockReturnValue(loadedCampsites());
    rerender(<App />);
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta").length).toBeGreaterThan(0));
    inst = FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
    inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    expect(impressionCalls()).toHaveLength(1);
  });

  it("StrictMode double effect invocation does not duplicate the impression", async () => {
    render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta").length).toBeGreaterThan(0));
    const inst = FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
    inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    expect(impressionCalls()).toHaveLength(1);
  });
});

describe("App — a genuine navigation away from / and back yields a new opportunity", () => {
  it("/ -> /about -> / : each fresh mount at / gets its own impression opportunity", async () => {
    // First visit to /.
    const first = await mountAtHomeAndGetLatestCtaObserver();
    first.inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(impressionCalls()).toHaveLength(1);
    first.unmount();

    // Navigate to /about (this app's real home<->about navigation is a full
    // page load — see file header — modeled here as a fresh mount).
    window.history.pushState({}, "", "/about");
    const about = render(<App />);
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull(); // About page, no NL module
    about.unmount();

    // Back to / — a genuinely new visit.
    window.history.pushState({}, "", "/");
    const second = await mountAtHomeAndGetLatestCtaObserver();
    second.inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    expect(impressionCalls()).toHaveLength(2); // one per visit, never summed/blocked across visits
  });
});
