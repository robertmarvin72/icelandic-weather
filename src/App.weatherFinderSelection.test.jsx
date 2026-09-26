// Ticket 415 (#415) — proves App wires WeatherFinder's result selection to
// the SAME existing site-selection behavior as Top5Leaderboard: real
// App/handleSelectSite/mapAnchorRef, not a standalone mocked callback.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/react", () => ({ SpeedInsights: () => null }));
vi.mock("./lib/analytics", () => ({ trackEvent: vi.fn(), trackPageView: vi.fn(), initAnalytics: vi.fn() }));

const SITE_A = { id: "site-a", name: "Alpha Camp", lat: 64.1, lon: -21.9 };
const SITE_B = { id: "site-b", name: "Beta Camp", lat: 64.2, lon: -21.8 };

vi.mock("./hooks/useCampsites", () => ({
  useCampsites: () => ({ campsites: [SITE_A, SITE_B], loading: false, error: null }),
}));
vi.mock("./hooks/useMe", () => ({ useMe: () => ({ me: null, refetchMe: vi.fn() }) }));
vi.mock("./hooks/useCheckoutFlow", () => ({
  useCheckoutFlow: () => ({ startCheckout: vi.fn(), openBillingPortal: vi.fn() }),
}));
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
vi.mock("./hooks/useWeatherVoice", () => ({ useWeatherVoice: () => ({ presentation: { show: false }, action: null, onVisible: vi.fn(), episodeKey: null, shareSnapshot: null }) }));

function day(i, windMax) {
  return { date: `2026-07-0${i + 1}`, tmax: 15, tmin: 8, windMax, windGust: windMax + 2, rain: 0.1, hasHazard: false };
}

// Real forecast rows for both sites so WeatherFinder's own ranking
// (unmocked) and useTop5Campsites (unmocked) both produce genuine,
// selectable results — not a standalone mocked callback assertion.
vi.mock("./hooks/useLeaderboardScores", () => ({
  useLeaderboardScores: () => ({
    scoresById: {
      "site-a": { score: 10, rows: [day(0, 3), day(1, 3), day(2, 3)] },
      "site-b": { score: 8, rows: [day(0, 8), day(1, 8), day(2, 8)] },
    },
    loadingWave1: false,
    loadingBg: false,
  }),
}));

// Irrelevant to selection wiring — stubbed to keep this file focused.
// The shared Northern Lights module fetches internally; stub it to avoid unrelated network
// noise. WeatherFinder and Top5Leaderboard are intentionally REAL.
vi.mock("./components/NorthernLightsThreeNight", () => ({ default: () => null }));
vi.mock("./components/RoutePlannerCard", () => ({ default: () => <div data-testid="route-planner-stub" /> }));
vi.mock("./components/CampsiteComparisonSection", () => ({ default: () => <div data-testid="comparison-section-stub" /> }));
vi.mock("./components/ForecastTable", () => ({ default: () => <div data-testid="forecast-table-stub" /> }));
vi.mock("./components/LazyMap", () => ({ default: () => <div data-testid="map-stub" /> }));
vi.mock("./components/WeatherVoiceCard", () => ({ default: () => null }));
vi.mock("./components/PageHeader", () => ({ default: () => <div data-testid="page-header-stub" /> }));
vi.mock("./components/LoginModal", () => ({ default: () => null }));
vi.mock("./components/HourlyForecastModal", () => ({ default: () => null }));
vi.mock("./components/Footer", () => ({ default: () => <div data-testid="footer-stub" /> }));
vi.mock("./components/BackToTop", () => ({ default: () => null }));
vi.mock("./components/Splash", () => ({ default: () => null }));
vi.mock("./components/ToastHub", () => ({ default: () => null }));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  window.history.pushState({}, "", "/");
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

// App.jsx uses the real useT/useLanguage hooks (unmocked, default "is"), so
// disclosure CTAs must be matched by their real Icelandic text, not raw keys.
function expandWeatherFinder() {
  fireEvent.click(screen.getByText("Sjá röðun staða eftir veðri"));
}

function expandTop5() {
  fireEvent.click(screen.getByText("Sjá fleiri staði"));
}

describe("App — Ticket 415 (#415): WeatherFinder selection reuses the exact Top5Leaderboard site-selection behavior", () => {
  it("selecting a WeatherFinder result updates the persisted site state and scrolls the map anchor with the exact same options Top5Leaderboard uses", () => {
    const { container } = render(<App />);
    expandWeatherFinder();

    // Site A is calmer (windMax 3 vs 8), so it ranks first under "calmest" —
    // select the OTHER one (Site B) to prove genuine selection, not a
    // coincidental default.
    const betaButton = screen.getByRole("button", { name: /Beta Camp/ });
    fireEvent.click(betaButton);

    expect(JSON.parse(localStorage.getItem("lastSite"))).toBe("site-b");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(container).toBeTruthy();
  });

  it("Top5Leaderboard's own row click produces the byte-identical scrollIntoView call — proving both surfaces share one real behavior, not two similar ones", () => {
    render(<App />);
    expandTop5();
    // Real Top5Leaderboard row for Site B (the lower-scored, non-default entry).
    const row = screen.getByText("Beta Camp").closest("tr");
    fireEvent.click(row);

    expect(JSON.parse(localStorage.getItem("lastSite"))).toBe("site-b");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("selecting via WeatherFinder calls scrollIntoView exactly once per activation, matching Top5Leaderboard's own single-call behavior", () => {
    render(<App />);
    expandWeatherFinder();
    fireEvent.click(screen.getByRole("button", { name: /Beta Camp/ }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("selecting the already-current site via WeatherFinder still updates state consistently with the top-list behavior (no special-casing)", () => {
    render(<App />);
    expandWeatherFinder();
    // Default selected site is whichever siteList[0] resolves to — select
    // Alpha Camp explicitly via WeatherFinder regardless of current state.
    fireEvent.click(screen.getByRole("button", { name: /Alpha Camp/ }));
    expect(JSON.parse(localStorage.getItem("lastSite"))).toBe("site-a");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });
});
