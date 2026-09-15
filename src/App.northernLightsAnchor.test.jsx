// Ticket 416 (#416) — the homepage `/#northern-lights` anchor, its
// off-season fallback (outside NorthernLightsCard.jsx), and the minimal
// hash-scroll handling for asynchronous rendering (reload, delayed
// campsite loading, About-to-home navigation). Renders the REAL App (real
// BrowserRouter/AppRoutes/IcelandCampingWeatherApp) with data-fetching
// hooks mocked and NorthernLightsCard left REAL, so the actual season gate
// (isAuroraSeason, unmocked) genuinely drives the anchor's content —
// mirroring the established pattern in App.weatherVoiceIntegration.test.jsx.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { useWeatherVoice } from "./hooks/useWeatherVoice";
import { useCampsites } from "./hooks/useCampsites";
import { trackEvent } from "./lib/analytics";
import { translations } from "./i18n/translations";

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/react", () => ({ SpeedInsights: () => null }));
vi.mock("./lib/analytics", () => ({ trackEvent: vi.fn(), trackPageView: vi.fn(), initAnalytics: vi.fn() }));

const SITE = { id: "site-1", name: "Test Campsite", lat: 64.1, lon: -21.9 };

vi.mock("./hooks/useCampsites", () => ({ useCampsites: vi.fn() }));
vi.mock("./hooks/useMe", () => ({ useMe: () => ({ me: null, refetchMe: vi.fn() }) }));
const startCheckout = vi.fn();
vi.mock("./hooks/useCheckoutFlow", () => ({
  useCheckoutFlow: () => ({ startCheckout, openBillingPortal: vi.fn() }),
}));
vi.mock("./hooks/useLeaderboardScores", () => ({
  useLeaderboardScores: () => ({ scoresById: {}, loadingWave1: false, loadingBg: false }),
}));
vi.mock("./hooks/useTop5Campsites", () => ({ useTop5Campsites: () => ({ top5: [] }) }));
vi.mock("./hooks/useForecast", () => ({
  useForecast: () => ({
    rows: [],
    windDir: null,
    shelter: null,
    loading: false,
    error: null,
    retrying: false,
    refetch: vi.fn(),
    requestedFor: null,
  }),
}));
vi.mock("./hooks/useWeatherVoice", () => ({ useWeatherVoice: vi.fn() }));

// Irrelevant to this ticket's scope — stubbed so this file stays focused
// and independent of their own data dependencies. NorthernLightsCard and
// About are intentionally left REAL.
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

function utcNoon(iso) {
  return new Date(`${iso}T12:00:00.000Z`);
}

function loadedCampsites() {
  return { campsites: [SITE], loading: false, error: null };
}

function loadingCampsites() {
  return { campsites: [], loading: true, error: null };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  window.history.pushState({}, "", "/");
  Element.prototype.scrollIntoView = vi.fn();
  global.fetch = vi.fn(() => Promise.reject(new Error("no network in tests")));
  useWeatherVoice.mockReturnValue({
    presentation: { show: false },
    action: null,
    onVisible: vi.fn(),
    episodeKey: null,
    shareSnapshot: null,
  });
  useCampsites.mockReturnValue(loadedCampsites());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App — Ticket 416 (#416): the /#northern-lights anchor's literal id", () => {
  it('the wrapping element\'s DOM id is exactly "northern-lights"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15")); // in season
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    expect(anchor).not.toBeNull();
  });
});

describe("App — in season (September): the real card is the destination, no off-season message", () => {
  it("September: real NorthernLightsCard shell renders inside the anchor, off-season fallback absent", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-09-15"));
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    expect(anchor.querySelector('[data-testid="nl-card"]')).not.toBeNull();
    expect(screen.queryByTestId("nl-off-season-fallback")).toBeNull();
  });
});

describe("App — off season (April, August fixtures): honest localized fallback, no card, no Aurora request", () => {
  it.each([
    ["2026-04-15", "April"],
    ["2026-08-15", "August"],
  ])("%s (%s): target id present, non-empty correctly-localized fallback, card absent, fetch never called", (iso) => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon(iso));
    render(<App />);

    const anchor = document.getElementById("northern-lights");
    expect(anchor).not.toBeNull();

    const fallback = screen.getByTestId("nl-off-season-fallback");
    expect(fallback).toBeInTheDocument();
    expect(fallback.textContent).toBe(translations.is.nlOffSeasonFallback);
    expect(fallback.textContent.length).toBeGreaterThan(0);

    expect(anchor.querySelector('[data-testid="nl-card"]')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("English fallback text is correctly localized", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-04-15"));
    localStorage.setItem("lang", JSON.stringify("en"));
    render(<App />);
    expect(screen.getByTestId("nl-off-season-fallback").textContent).toBe(translations.en.nlOffSeasonFallback);
  });
});

describe("App — hash-scroll handling for asynchronous rendering", () => {
  it("no hash in URL: never scrolls", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15"));
    render(<App />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("reload with #northern-lights already in the URL and campsites already loaded: scrolls to the anchor on mount", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15"));
    window.history.pushState({}, "", "/#northern-lights");
    render(<App />);
    // render() flushes effects synchronously (via RTL's act()) — the scroll
    // effect has no async delay of its own, so no waitFor is needed.
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("delayed campsite loading: does not scroll while the gate is active, then scrolls once campsites load", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15"));
    window.history.pushState({}, "", "/#northern-lights");
    useCampsites.mockReturnValue(loadingCampsites());

    const { rerender } = render(<App />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    useCampsites.mockReturnValue(loadedCampsites());
    rerender(<App />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("off-season + hash present: still scrolls to the anchor (which now holds the fallback message)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-04-15"));
    window.history.pushState({}, "", "/#northern-lights");
    render(<App />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.getByTestId("nl-off-season-fallback")).toBeInTheDocument();
  });

  it("a hash for a different, unrelated target never triggers a scroll here", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15"));
    window.history.pushState({}, "", "/#some-other-section");
    render(<App />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("App — About-to-home navigation reuses the same anchor/scroll path", () => {
  it("About page's real generated link, Icelandic: targets /#northern-lights, not a new standalone route", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15"));
    window.history.pushState({}, "", "/about");
    render(<App />);
    const link = document.querySelector('a[href="/#northern-lights"]');
    expect(link).not.toBeNull();
  });

  it("About page's real generated link, English (saved lang=en): targets the forced-English standalone route", () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15"));
    window.history.pushState({}, "", "/about");
    render(<App />);
    const link = document.querySelector('a[href="/en/northern-lights"]');
    expect(link).not.toBeNull();
    expect(document.querySelector('a[href="/is/northern-lights"]')).toBeNull();
  });

  it("following that Icelandic link (fresh mount at the destination) lands on the anchor and scrolls to it — About-to-home reuse", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15"));
    // Simulates the actual full-page navigation a plain <a href="/#northern-lights">
    // performs from /about (this app renders that link as a plain anchor,
    // matching PricingInfo's own existing back-link convention) — a fresh
    // mount of the destination with the hash already in the URL.
    window.history.pushState({}, "", "/#northern-lights");
    render(<App />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.getElementById("northern-lights").querySelector('[data-testid="nl-card"]')).not.toBeNull();
  });

  it("no dead route: /about always renders real About content, never a 404", () => {
    window.history.pushState({}, "", "/about");
    render(<App />);
    expect(screen.getByText(translations.is.aboutTitle)).toBeInTheDocument();
  });

  it("visiting or following these links never starts checkout or fires a checkout/attribution event", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcNoon("2026-01-15"));
    window.history.pushState({}, "", "/#northern-lights");
    render(<App />);
    expect(startCheckout).not.toHaveBeenCalled();
    const checkoutEvents = trackEvent.mock.calls.filter(([name]) => /checkout|attribution/i.test(name));
    expect(checkoutEvents).toHaveLength(0);
  });
});
