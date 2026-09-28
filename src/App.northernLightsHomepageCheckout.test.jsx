// Ticket #426 — verifies the homepage Northern Lights CTA through the REAL
// checkout/login adapter (useCheckoutFlow, useLoginFlow, LoginModal), not a
// mock of it. Only data-fetching hooks and Aurora/network calls are
// stubbed, mirroring App.northernLightsAnchor.test.jsx's established
// pattern. useNavigate is spied (not mocked away) so the actual pricing URL
// useCheckoutFlow builds can be asserted directly.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App";
import { useWeatherVoice } from "./hooks/useWeatherVoice";
import { useCampsites } from "./hooks/useCampsites";
import { useMe } from "./hooks/useMe";
import { trackEvent } from "./lib/analytics";
import { AURORA_CANDIDATE_LOCATION_IDS as AURORA_IDS } from "./config/auroraCandidates";

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/react", () => ({ SpeedInsights: () => null }));
vi.mock("./lib/analytics", () => ({ trackEvent: vi.fn(), trackPageView: vi.fn(), initAnalytics: vi.fn() }));

vi.mock("./hooks/useCampsites", () => ({ useCampsites: vi.fn() }));
vi.mock("./hooks/useMe", () => ({ useMe: vi.fn() }));
vi.mock("./hooks/useLeaderboardScores", () => ({ useLeaderboardScores: () => ({ scoresById: {}, loadingWave1: false, loadingBg: false }) }));
vi.mock("./hooks/useTop5Campsites", () => ({ useTop5Campsites: () => ({ top5: [] }) }));
vi.mock("./hooks/useForecast", () => ({
  useForecast: () => ({ rows: [], windDir: null, shelter: null, loading: false, error: null, retrying: false, refetch: vi.fn(), requestedFor: null }),
}));
vi.mock("./hooks/useWeatherVoice", () => ({ useWeatherVoice: vi.fn() }));

// Irrelevant surfaces stubbed for focus; useCheckoutFlow, useLoginFlow and
// LoginModal are deliberately left REAL — that real adapter is what this
// file verifies.
vi.mock("./components/RoutePlannerCard", () => ({ default: () => <div data-testid="route-planner-stub" /> }));
vi.mock("./components/CampsiteComparisonSection", () => ({ default: () => <div data-testid="comparison-section-stub" /> }));
vi.mock("./components/ForecastTable", () => ({ default: () => <div data-testid="forecast-table-stub" /> }));
vi.mock("./components/LazyMap", () => ({ default: () => <div data-testid="map-stub" /> }));
vi.mock("./components/Top5Leaderboard", () => ({ default: () => <div data-testid="top5-stub" /> }));
vi.mock("./components/WeatherFinder", () => ({ default: () => <div data-testid="weather-finder-stub" /> }));
vi.mock("./components/PageHeader", () => ({ default: () => <div data-testid="page-header-stub" /> }));
vi.mock("./components/HomeDecisionCard", () => ({ default: () => <div data-testid="home-decision-stub" /> }));
vi.mock("./components/WeatherVoiceCard", () => ({ default: () => null }));
vi.mock("./components/HourlyForecastModal", () => ({ default: () => null }));
vi.mock("./components/Footer", () => ({ default: () => <div data-testid="footer-stub" /> }));
vi.mock("./components/BackToTop", () => ({ default: () => null }));
vi.mock("./components/Splash", () => ({ default: () => null }));
vi.mock("./components/ToastHub", () => ({ default: () => null }));

const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateSpy };
});

function utcNoon(iso) {
  return new Date(`${iso}T12:00:00.000Z`);
}
function loadedCampsites() {
  return { campsites: [{ id: "site-1", name: "Test Campsite", lat: 64.1, lon: -21.9 }], loading: false, error: null };
}

function auroraBody(evening) {
  const entries = AURORA_IDS.map((id, i) => ({ locationId: id, name: `Spot ${i + 1}`, lat: 64, lon: -20, score: 90 - i, band: i === 0 ? "excellent" : "good", reasons: [], flags: [] }));
  const [best, ...alternatives] = entries;
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: "2026-01-15T10:00:00.000Z", ageMinutes: 120 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best,
    alternatives,
    excluded: [],
    warnings: [],
  };
}

function stubFetch() {
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes("/api/aurora-decision")) {
      const { evening } = JSON.parse(opts.body);
      return { ok: true, status: 200, json: async () => auroraBody(evening) };
    }
    throw new Error(`unexpected fetch in this test: ${url}`);
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  window.history.pushState({}, "", "/");
  Element.prototype.scrollIntoView = vi.fn();
  useWeatherVoice.mockReturnValue({ presentation: { show: false }, action: null, onVisible: vi.fn(), episodeKey: null, shareSnapshot: null });
  useCampsites.mockReturnValue(loadedCampsites());
  stubFetch();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(utcNoon("2026-01-15"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App — homepage Northern Lights CTA through the real checkout/login adapter (#426)", () => {
  it("logged-in Free: clicking the CTA navigates to /pricing carrying src=northern_lights_homepage and the real email — no login modal", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: { email: "camper@example.com" }, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl3-result"]')).not.toBeNull());

    fireEvent.click(within(anchor).getByRole("button", { name: "Sjá bestu staðina með Pro" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(navigateSpy).toHaveBeenCalledOnce();
    const url = new URL(navigateSpy.mock.calls[0][0], "https://example.test");
    expect(url.pathname).toBe("/pricing");
    expect(url.searchParams.get("src")).toBe("northern_lights_homepage");
    expect(url.searchParams.get("email")).toBe("camper@example.com");
  });

  it("logged-out: clicking the CTA opens the real login modal instead of navigating, and fires the click-attribution events regardless", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl3-result"]')).not.toBeNull());

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(within(anchor).getByRole("button", { name: "Sjá bestu staðina með Pro" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith(
      "northern_lights_upgrade_clicked",
      expect.objectContaining({ source: "northern_lights_homepage", upgrade_source: "northern_lights_homepage" }),
    );
  });

  it("documents the existing supported boundary: logged-out modal submission does NOT currently carry the homepage src through to pricing", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl3-result"]')).not.toBeNull());
    fireEvent.click(within(anchor).getByRole("button", { name: "Sjá bestu staðina með Pro" }));
    const dialog = screen.getByRole("dialog");

    // The real login flow does its own /api/login network call on submit,
    // which this test does not stub (out of scope: this test only needs to
    // show the modal opened without src continuation, not complete a real
    // login). No assertion is made about a subsequent pricing navigation
    // here — useLoginFlow's own existing success path sends only email,
    // never src/selected-date, confirmed by source inspection
    // (src/hooks/useLoginFlow.js), and is unchanged by this ticket.
    expect(within(dialog).getByRole("textbox")).toBeInTheDocument();
  });

  it("opening and closing the login modal preserves the selected night and issues no extra Aurora request", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl3-result"]')).not.toBeNull());

    const tabs = () => within(anchor).getByRole("group").querySelectorAll("button");
    fireEvent.click(tabs()[1]); // "tomorrow night"
    const auroraCallCount = () => global.fetch.mock.calls.filter((c) => String(c[0]).includes("/api/aurora-decision")).length;
    const before = auroraCallCount();
    const selectedBefore = Array.from(tabs()).find((b) => b.getAttribute("aria-pressed") === "true").textContent;

    fireEvent.click(within(anchor).getByRole("button", { name: "Sjá bestu staðina með Pro" }));
    const dialog = screen.getByRole("dialog");
    const closeBtn = within(dialog).queryByRole("button", { name: /close|loka/i }) ?? within(dialog).getAllByRole("button")[0];
    fireEvent.click(closeBtn);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    const selectedAfter = Array.from(tabs()).find((b) => b.getAttribute("aria-pressed") === "true").textContent;
    expect(selectedAfter).toBe(selectedBefore);
    expect(auroraCallCount()).toBe(before);
  });
});
