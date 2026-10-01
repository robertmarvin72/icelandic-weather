// Ticket #426 — originally verified the homepage Northern Lights CTA through
// the real checkout/login adapter (useCheckoutFlow, useLoginFlow, LoginModal).
//
// Ticket #431 — that CTA (and the purchase lock it served) is removed: full
// Northern Lights access is open to every tier via the
// "northern_lights_free_v1" experiment, so this file now verifies the
// opposite: the real "see the best spots" details toggle opens details
// directly, for a logged-in Free user AND a logged-out visitor alike, with
// no login modal and no navigation to checkout ever triggered from it.
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
// LoginModal are deliberately left REAL — this file proves none of them are
// ever reached from the Northern Lights module any more.
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

// Ticket #431: details (including the map) now open for Free too — the real
// NorthernLightsMap needs an IntersectionObserver this jsdom environment
// doesn't provide, so it's mocked here the same way every other Northern
// Lights test file already does.
vi.mock("./components/NorthernLightsMap", () => ({
  default: ({ locations }) => <div data-testid="nl-map-container">{locations.map((l) => l.id).join(",")}</div>,
}));

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
  sessionStorage.clear();
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

describe("App — Ticket #431: Northern Lights needs no checkout/login any more, logged-in Free", () => {
  it("clicking the real details toggle opens details directly — no navigation, no dialog, no purchase-click event", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: { email: "camper@example.com" }, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl3-result"]')).not.toBeNull());

    expect(within(anchor).queryByRole("button", { name: /með Pro/ })).toBeNull();
    fireEvent.click(within(anchor).getByRole("button", { name: "Sjá bestu staðina" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
    for (const name of ["northern_lights_upgrade_clicked", "northern_lights_multi_day_upgrade_clicked", "northern_lights_landing_cta_clicked"]) {
      expect(trackEvent.mock.calls.some((c) => c[0] === name)).toBe(false);
    }
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl-map-container"]')).not.toBeNull());
  });
});

describe("App — Ticket #431: Northern Lights needs no checkout/login any more, logged-out visitor", () => {
  it("clicking the real details toggle opens details directly — no login modal appears", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl3-result"]')).not.toBeNull());

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(within(anchor).getByRole("button", { name: "Sjá bestu staðina" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl-map-container"]')).not.toBeNull());
  });

  it("opening details preserves the selected night and issues no extra Aurora request", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    render(<App />);
    const anchor = document.getElementById("northern-lights");
    await waitFor(() => expect(anchor.querySelector('[data-testid="nl3-result"]')).not.toBeNull());

    const tabs = () => within(anchor).getByRole("group").querySelectorAll("button");
    fireEvent.click(tabs()[1]); // "tomorrow night"
    const auroraCallCount = () => global.fetch.mock.calls.filter((c) => String(c[0]).includes("/api/aurora-decision")).length;
    const before = auroraCallCount();
    const selectedBefore = Array.from(tabs()).find((b) => b.getAttribute("aria-pressed") === "true").textContent;

    fireEvent.click(within(anchor).getByRole("button", { name: /Sjá bestu staðina|Gæti sést/ }));

    const selectedAfter = Array.from(tabs()).find((b) => b.getAttribute("aria-pressed") === "true").textContent;
    expect(selectedAfter).toBe(selectedBefore);
    expect(auroraCallCount()).toBe(before);
  });
});
