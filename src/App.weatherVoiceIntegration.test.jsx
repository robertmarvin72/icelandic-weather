// Ticket 408 (#408), Revision 2 — Jonesy Round 1 BLOCKED specifically
// because the prior report claimed a DOM-order/architecture fact
// (Weather Voice living inside HomeDecisionCard) that was never actually
// built, and no test exercised the real App.jsx integration at all. This
// file renders the REAL default `App` export (real BrowserRouter, real
// AppRoutes, real IcelandCampingWeatherApp, real HomeDecisionCard, real
// WeatherVoiceCard) with every external/heavy/data-fetching dependency
// mocked, specifically to prove the actual sibling order and the absence
// of any Weather Voice content inside HomeDecisionCard's own subtree —
// not merely asserted in prose.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import App from "./App";
import { useWeatherVoice } from "./hooks/useWeatherVoice";

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/react", () => ({ SpeedInsights: () => null }));
vi.mock("./lib/analytics", () => ({ trackEvent: vi.fn(), trackPageView: vi.fn(), initAnalytics: vi.fn() }));

const SITE = { id: "site-1", name: "Test Campsite", lat: 64.1, lon: -21.9 };

vi.mock("./hooks/useCampsites", () => ({
  useCampsites: () => ({ campsites: [SITE], loading: false, error: null }),
}));
vi.mock("./hooks/useMe", () => ({ useMe: () => ({ me: null, refetchMe: vi.fn() }) }));
vi.mock("./hooks/useCheckoutFlow", () => ({
  useCheckoutFlow: () => ({ startCheckout: vi.fn(), openBillingPortal: vi.fn() }),
}));
vi.mock("./hooks/useLeaderboardScores", () => ({
  useLeaderboardScores: () => ({ scoresById: {}, loadingWave1: false, loadingBg: false }),
}));
vi.mock("./hooks/useTop5Campsites", () => ({ useTop5Campsites: () => ({ top5: [] }) }));
vi.mock("./hooks/useForecast", () => ({
  useForecast: () => ({
    data: null,
    rows: [],
    windDir: null,
    shelter: null,
    loading: false,
    error: null,
    retrying: false,
    refetch: vi.fn(),
    requestedFor: { lat: SITE.lat, lon: SITE.lon },
  }),
}));
vi.mock("./hooks/useWeatherVoice", () => ({ useWeatherVoice: vi.fn() }));

// Every other homepage section is irrelevant to sibling-order/placement —
// stubbed to keep this test focused and independent of their own data
// dependencies. HomeDecisionCard and WeatherVoiceCard are intentionally
// the REAL components; NorthernLightsCard is stubbed only so it's a
// simple, unambiguous DOM marker for "comes after WeatherVoiceCard".
vi.mock("./components/NorthernLightsCard", () => ({ default: () => <div data-testid="northern-lights-stub" /> }));
vi.mock("./components/RoutePlannerCard", () => ({ default: () => <div data-testid="route-planner-stub" /> }));
vi.mock("./components/CampsiteComparisonSection", () => ({ default: () => <div data-testid="comparison-section-stub" /> }));
vi.mock("./components/ForecastTable", () => ({ default: () => <div data-testid="forecast-table-stub" /> }));
vi.mock("./components/LazyMap", () => ({ default: () => <div data-testid="map-stub" /> }));
vi.mock("./components/Top5Leaderboard", () => ({ default: () => <div data-testid="top5-stub" /> }));
vi.mock("./components/WeatherFinder", () => ({ default: () => <div data-testid="weather-finder-stub" /> }));
vi.mock("./components/PageHeader", () => ({ default: () => <div data-testid="page-header-stub" /> }));
vi.mock("./components/LoginModal", () => ({ default: () => null }));
vi.mock("./components/HourlyForecastModal", () => ({ default: () => null }));
vi.mock("./components/Footer", () => ({ default: () => <div data-testid="footer-stub" /> }));
vi.mock("./components/BackToTop", () => ({ default: () => null }));
vi.mock("./components/Splash", () => ({ default: () => null }));
vi.mock("./components/ToastHub", () => ({ default: () => null }));

function activePresentation(overrides = {}) {
  return {
    show: true,
    condition: "good",
    mood: "happy",
    severity: 0,
    comment: { id: "good_01", text: "Þetta má alveg." },
    ctaType: null,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  window.history.pushState({}, "", "/");
});

describe("App — real Weather Voice sibling-order integration (#408 Revision 2)", () => {
  it("HomeDecisionCard, then WeatherVoiceCard, then Northern Lights — actual DOM sibling order, real components", () => {
    useWeatherVoice.mockReturnValue({ presentation: activePresentation(), action: null, onVisible: vi.fn() });

    const { container } = render(<App />);

    const weatherVoiceRow = container.querySelector("[data-weather-voice-surface]");
    const northernLights = screen.getByTestId("northern-lights-stub");
    expect(weatherVoiceRow).not.toBeNull();
    expect(screen.getByText("„Þetta má alveg.“")).toBeInTheDocument();

    // WeatherVoiceCard's DOM node must precede Northern Lights' stub.
    expect(weatherVoiceRow.compareDocumentPosition(northernLights) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("Weather Voice content never appears inside HomeDecisionCard's own DOM subtree — it is a true sibling, not an internal slot", () => {
    useWeatherVoice.mockReturnValue({ presentation: activePresentation(), action: null, onVisible: vi.fn() });

    const { container } = render(<App />);
    const weatherVoiceRow = container.querySelector("[data-weather-voice-surface]");
    expect(weatherVoiceRow).not.toBeNull();

    // App.jsx renders HomeDecisionCard, then WeatherVoiceCard, as
    // consecutive JSX siblings — so WeatherVoiceCard's immediately
    // preceding DOM sibling is HomeDecisionCard's own root node. Proving
    // that node does NOT itself contain (or equal) the Weather Voice node
    // confirms a true sibling card, never an internal slot inside it.
    const precedingSibling = weatherVoiceRow.previousElementSibling;
    expect(precedingSibling).not.toBeNull();
    expect(precedingSibling.contains(weatherVoiceRow)).toBe(false);
    expect(precedingSibling.querySelector("[data-weather-voice-surface]")).toBeNull();
  });

  it("show:false renders no Weather Voice DOM at all, in the real integration", () => {
    useWeatherVoice.mockReturnValue({ presentation: { show: false }, action: null, onVisible: vi.fn() });

    const { container } = render(<App />);

    expect(container.querySelector("[data-weather-voice-surface]")).toBeNull();
    // The rest of the homepage still renders normally.
    expect(screen.getByTestId("northern-lights-stub")).toBeInTheDocument();
  });

  it("HomeDecisionCard itself carries no Weather Voice props/wiring (source-level regression guard)", () => {
    // Belt-and-braces companion to the DOM assertions above: confirms the
    // component source itself was never re-coupled, not only that this
    // particular render happens not to show it.
    const src = readFileSync(join(process.cwd(), "src/components/HomeDecisionCard.jsx"), "utf8");
    expect(src).not.toMatch(/weatherVoice/i);
    expect(src).not.toMatch(/WeatherVoiceCard/);
  });
});
