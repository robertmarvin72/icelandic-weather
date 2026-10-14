// Ticket #430 v2 — F4/D4: whether App.jsx's pathname-reset branch is
// actually REACHABLE by real in-place (no full remount) router navigation.
// Navigates inside ONE mounted <App/> via window.history.pushState +
// a dispatched popstate event (how BrowserRouter detects back/forward),
// never by unmounting/remounting <App/> — that is the EXISTING, separate
// "/ -> /about -> /" test in App.affiliateHolder.test.jsx, left unchanged.
//
// Proof is the holder's own identity: createAffiliateImpressionHolder is
// wrapped (importActual) so every call to it, and every startVisit id it
// receives, is recorded. If IcelandCampingWeatherApp truly stays mounted
// across the navigation, the factory is called exactly once and that one
// instance receives three ids (pathname-prefixed, increasing sequence). If
// it is called more than once, the component remounted and the branch is
// unreachable this way — reported as a finding per D4(c), not papered over.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
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
vi.mock("./lib/auroraSeason", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, isAuroraSeason: () => true };
});

// The holder-identity spy (D4(b)): wraps the REAL factory/instance so the
// module's own dedup semantics still apply; only records calls.
const holderRecords = vi.hoisted(() => []);
vi.mock("./lib/affiliateImpressionHolder", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    createAffiliateImpressionHolder: () => {
      const real = actual.createAffiliateImpressionHolder();
      const record = { startVisitCalls: [] };
      holderRecords.push(record);
      return {
        startVisit: (id) => {
          record.startVisitCalls.push(id);
          return real.startVisit(id);
        },
        currentVisit: () => real.currentVisit(),
        tryConsume: (visitId, placement) => real.tryConsume(visitId, placement),
      };
    },
  };
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

function auroraSuccessBody(evening) {
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

function impressionCalls() {
  return trackEvent.mock.calls.filter(([name]) => name === "affiliate_offer_viewed");
}

async function waitForHomeCta() {
  await waitFor(() => expect(screen.getAllByTestId("affiliate-nl-cta").length).toBeGreaterThan(0));
  return FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
}

// Real BrowserRouter navigation, inside the one mounted <App/> — pushState
// then a dispatched popstate (how `history`/react-router detect back/
// forward), never a second render(<App/>) call.
async function navigateInPlace(path) {
  await act(async () => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
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
  holderRecords.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App — in-place router navigation (/ -> /about -> /), one mounted App instance (F4/D4)", () => {
  it("reports whether the pathname-reset branch is reachable by real in-place navigation, and behaves correctly either way", async () => {
    render(<App />);
    let inst = await waitForHomeCta();
    inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(impressionCalls()).toHaveLength(1);

    await navigateInPlace("/about");
    // Capture a callback from BEFORE the next navigation, to prove a stale
    // one cannot consume the new visit if the branch is reachable.
    const staleInst = inst;

    await navigateInPlace("/");
    inst = await waitForHomeCta();

    if (holderRecords.length === 1) {
      // Reachable: the same IcelandCampingWeatherApp instance stayed
      // mounted across both navigations — exactly one holder was ever
      // created, and it received three ids.
      const ids = holderRecords[0].startVisitCalls;
      expect(ids.length).toBeGreaterThanOrEqual(3);
      expect(ids[0]).toMatch(/^\/#\d+$/);
      expect(ids[1]).toMatch(/^\/about#\d+$/);
      expect(ids[ids.length - 1]).toMatch(/^\/#\d+$/);
      expect(new Set(ids).size).toBe(ids.length); // strictly increasing/distinct

      // A callback captured before the navigation away cannot consume the
      // new visit's opportunity.
      staleInst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
      inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
      expect(impressionCalls()).toHaveLength(2); // one per visit; the stale callback contributed nothing
      console.log("[#430 F4] in-place navigation REACHED the pathname-reset branch:", ids);
    } else {
      // Unreachable: in-place pushState+popstate navigation between the "/"
      // and "/about" <Route> matches remounted IcelandCampingWeatherApp
      // (a fresh holder was created for each). This matches the existing
      // "/about's link home is a plain <a>" precedent (full page navigation
      // in real production use) — reported as a finding, not fixed here.
      expect(holderRecords.length).toBeGreaterThan(1);
      console.log(
        `[#430 F4] in-place navigation did NOT reach the pathname-reset branch: ${holderRecords.length} separate holder instances were created (component remounted on each navigation). The branch may be unreachable via router navigation in this app; see cc-report.md.`
      );
    }
  });
});
