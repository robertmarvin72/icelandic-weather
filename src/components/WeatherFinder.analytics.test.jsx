import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WeatherFinder from "./WeatherFinder";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./WeatherFinderCard", () => ({
  default: ({ result, rank }) => <div data-testid={`card-${rank}`}>{result.name}</div>,
}));

const t = (k) => k;

function makeDay(i) {
  return {
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    tmax: 15,
    tmin: 8,
    windMax: 5 + i * 0.5,
    windGust: 8,
    rain: 0.1,
    hasHazard: false,
  };
}

function makeSite(i) {
  const id = `site-${i}`;
  return { id, name: `Site ${i}`, lat: 64 + i * 0.1, lon: -20 + i * 0.1 };
}

// Build 12 sites so hasMore (ranked.length > 10) is true for Pro users.
const SITE_COUNT = 12;
const siteList = Array.from({ length: SITE_COUNT }, (_, i) => makeSite(i));
const scoresById = Object.fromEntries(
  siteList.map((s) => [s.id, { rows: Array.from({ length: 3 }, (_, i) => makeDay(i)) }])
);

const proEntitlements = { isPro: true };
const freeEntitlements = { isPro: false };

function renderFinder({ entitlements = proEntitlements, onUpgrade = vi.fn() } = {}) {
  render(
    <WeatherFinder
      siteList={siteList}
      scoresById={scoresById}
      userLoc={null}
      entitlements={entitlements}
      units="metric"
      t={t}
      onUpgrade={onUpgrade}
    />
  );
  return { onUpgrade };
}

describe("weather_finder_mode_changed analytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires when switching from calmest to warmest", () => {
    renderFinder();
    // Mode buttons use t(MODE_KEY[m]) — with t=(k)=>k, the text is the key itself.
    fireEvent.click(screen.getByText("weatherFinderWarmest"));
    expect(trackEvent).toHaveBeenCalledWith("weather_finder_mode_changed", {
      mode: "warmest",
      previousMode: "calmest",
      isPro: true,
    });
  });

  it("fires when switching from calmest to driest", () => {
    renderFinder();
    fireEvent.click(screen.getByText("weatherFinderDriest"));
    expect(trackEvent).toHaveBeenCalledWith("weather_finder_mode_changed", {
      mode: "driest",
      previousMode: "calmest",
      isPro: true,
    });
  });

  it("does not fire when clicking the already-active mode", () => {
    renderFinder();
    // Initial mode is "calmest" — clicking calmest again must not fire the event.
    fireEvent.click(screen.getByText("weatherFinderCalmest"));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("fires only once per mode change", () => {
    renderFinder();
    fireEvent.click(screen.getByText("weatherFinderWarmest"));
    expect(trackEvent).toHaveBeenCalledOnce();
  });

  it("reflects the actual MODES values (calmest / warmest / driest)", () => {
    renderFinder();
    fireEvent.click(screen.getByText("weatherFinderWarmest"));
    const { mode, previousMode } = trackEvent.mock.calls[0][1];
    expect(["calmest", "warmest", "driest"]).toContain(mode);
    expect(["calmest", "warmest", "driest"]).toContain(previousMode);
  });

  it("sends no undefined, null, or empty-string properties", () => {
    renderFinder();
    fireEvent.click(screen.getByText("weatherFinderWarmest"));
    const props = trackEvent.mock.calls[0][1];
    for (const [key, val] of Object.entries(props)) {
      expect(val, `property "${key}" must not be undefined`).not.toBeUndefined();
      expect(val, `property "${key}" must not be null`).not.toBeNull();
      expect(val, `property "${key}" must not be empty string`).not.toBe("");
    }
  });
});

describe("weather_finder_expanded analytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires when expanding the full ranking", () => {
    renderFinder({ entitlements: proEntitlements });
    // With 12 Pro sites and resultsLimit=999, ranked.length=12 > INITIAL_VISIBLE_COUNT=10
    const expandBtn = screen.getByText("weatherFinderShowFull");
    fireEvent.click(expandBtn);
    expect(trackEvent).toHaveBeenCalledWith("weather_finder_expanded", {
      mode: "calmest",
      isPro: true,
      resultsLimit: expect.any(Number),
    });
  });

  it("does not fire when collapsing", () => {
    renderFinder({ entitlements: proEntitlements });
    const expandBtn = screen.getByText("weatherFinderShowFull");
    fireEvent.click(expandBtn); // expand — fires
    vi.clearAllMocks();
    // After expanding, the button shows "weatherFinderShowTop10"
    const collapseBtn = screen.getByText("weatherFinderShowTop10");
    fireEvent.click(collapseBtn); // collapse — must NOT fire
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("fires only once per expand action", () => {
    renderFinder({ entitlements: proEntitlements });
    fireEvent.click(screen.getByText("weatherFinderShowFull"));
    expect(trackEvent).toHaveBeenCalledOnce();
  });

  it("sends no undefined, null, or empty-string properties in expand event", () => {
    renderFinder({ entitlements: proEntitlements });
    fireEvent.click(screen.getByText("weatherFinderShowFull"));
    // There may be zero or one calls — if mode_changed was also tested, clear first.
    const expandCall = trackEvent.mock.calls.find((c) => c[0] === "weather_finder_expanded");
    expect(expandCall).toBeDefined();
    for (const [key, val] of Object.entries(expandCall[1])) {
      expect(val, `property "${key}" must not be undefined`).not.toBeUndefined();
      expect(val, `property "${key}" must not be null`).not.toBeNull();
      expect(val, `property "${key}" must not be empty string`).not.toBe("");
    }
  });
});
