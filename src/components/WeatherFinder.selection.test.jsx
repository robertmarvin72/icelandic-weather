// Ticket 415 (#415) — WeatherFinder's result-selection wiring:
// recommendation_destination_clicked + onSelectSite(result.id). Renders the
// REAL WeatherFinderCard (not the existing analytics suite's inert mock),
// per the approved prompt's explicit requirement.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WeatherFinder from "./WeatherFinder";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

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

// 12 sites so Pro's hasMore (ranked.length > 10) is genuinely true.
const SITE_COUNT = 12;
const siteList = Array.from({ length: SITE_COUNT }, (_, i) => makeSite(i));
const scoresById = Object.fromEntries(
  siteList.map((s, i) => [
    s.id,
    { rows: Array.from({ length: 3 }, (_, d) => ({ ...makeDay(d), windMax: 2 + i })) },
  ])
);

const proEntitlements = { isPro: true };
const freeEntitlements = { isPro: false };

function renderFinder({ entitlements = proEntitlements, onUpgrade = vi.fn(), onSelectSite = vi.fn() } = {}) {
  render(
    <WeatherFinder
      siteList={siteList}
      scoresById={scoresById}
      userLoc={null}
      entitlements={entitlements}
      units="metric"
      t={t}
      onUpgrade={onUpgrade}
      onSelectSite={onSelectSite}
    />
  );
  fireEvent.click(screen.getByText("weatherFinderShowDetailsCta"));
  return { onUpgrade, onSelectSite };
}

function nameButton(name) {
  return screen.getByRole("button", { name: new RegExp(name) });
}

describe("WeatherFinder — Ticket 415 (#415): recommendation_destination_clicked + onSelectSite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("selecting a non-first row fires the exact event payload, once, before onSelectSite, and calls onSelectSite with the exact id", () => {
    const order = [];
    const onSelectSite = vi.fn(() => order.push("select"));
    vi.mocked(trackEvent).mockImplementation((name) => {
      if (name === "recommendation_destination_clicked") order.push("event");
    });
    renderFinder({ onSelectSite });

    // Row order is calmest ascending windMax — site with index i has
    // windMax base 2+i, so the ranked order is Site 0 (calmest) ... Site 11.
    // Select a NON-first row: "Site 3".
    fireEvent.click(nameButton("Site 3"));

    expect(trackEvent).toHaveBeenCalledWith("recommendation_destination_clicked", {
      destination_id: "site-3",
      destination_name: "Site 3",
      recommendation_type: "weather_finder",
      reason: "calmest",
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(onSelectSite).toHaveBeenCalledTimes(1);
    expect(onSelectSite).toHaveBeenCalledWith("site-3");
    expect(order).toEqual(["event", "select"]);
  });

  it.each(["calmest", "warmest", "driest"])("%s mode: reason reflects the active mode at click time", (mode) => {
    const modeLabelKey = { calmest: "weatherFinderCalmest", warmest: "weatherFinderWarmest", driest: "weatherFinderDriest" }[mode];
    const { onSelectSite } = renderFinder();
    if (mode !== "calmest") fireEvent.click(screen.getByText(modeLabelKey));
    // Any visible row — grab the first result's button by role, generic name match.
    const buttons = screen.getAllByRole("button").filter((b) => /^Site \d+/.test(b.textContent));
    fireEvent.click(buttons[0]);
    expect(trackEvent).toHaveBeenCalledWith(
      "recommendation_destination_clicked",
      expect.objectContaining({ recommendation_type: "weather_finder", reason: mode })
    );
    expect(onSelectSite).toHaveBeenCalledTimes(1);
  });

  it("repeated intentional activations each count once", () => {
    const { onSelectSite } = renderFinder();
    const btn = nameButton("Site 0");
    fireEvent.click(btn);
    fireEvent.click(btn);
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "recommendation_destination_clicked");
    expect(calls).toHaveLength(2);
    expect(onSelectSite).toHaveBeenCalledTimes(2);
  });

  it("no event fires on render, mode change, filter change, or expand/collapse", () => {
    renderFinder({ entitlements: proEntitlements });
    expect(trackEvent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("weatherFinderWarmest"));
    fireEvent.click(screen.getByText("100 km"));
    const expandBtn = screen.getByText("weatherFinderShowFull");
    fireEvent.click(expandBtn);

    const destinationCalls = trackEvent.mock.calls.filter((c) => c[0] === "recommendation_destination_clicked");
    expect(destinationCalls).toHaveLength(0);
  });

  it("no event fires on the Free upgrade CTA — a genuinely different action", () => {
    renderFinder({ entitlements: freeEntitlements });
    fireEvent.click(screen.getByText("weatherFinderUpgradeForMore"));
    const destinationCalls = trackEvent.mock.calls.filter((c) => c[0] === "recommendation_destination_clicked");
    expect(destinationCalls).toHaveLength(0);
  });

  it("never emits weekly_ranking_site_clicked — that belongs to a different surface (Top5Leaderboard)", () => {
    renderFinder();
    fireEvent.click(nameButton("Site 0"));
    const wrongEvent = trackEvent.mock.calls.filter((c) => c[0] === "weekly_ranking_site_clicked");
    expect(wrongEvent).toHaveLength(0);
  });

  it("sends no undefined, null, or empty-string properties", () => {
    renderFinder();
    fireEvent.click(nameButton("Site 0"));
    const call = trackEvent.mock.calls.find((c) => c[0] === "recommendation_destination_clicked");
    for (const [key, val] of Object.entries(call[1])) {
      expect(val, `property "${key}" must not be undefined`).not.toBeUndefined();
      expect(val, `property "${key}" must not be null`).not.toBeNull();
      expect(val, `property "${key}" must not be empty string`).not.toBe("");
    }
  });
});

describe("WeatherFinder — Ticket 415 (#415): Free/Pro visible-result and expansion coverage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Free: selecting a result within the Free-visible limit (resultsLimit=3) works", () => {
    const { onSelectSite } = renderFinder({ entitlements: freeEntitlements });
    // Free resultsLimit=3 — only 3 rows are ranked/visible at all.
    expect(screen.queryByRole("button", { name: /Site 3/ })).toBeNull();
    fireEvent.click(nameButton("Site 2"));
    expect(onSelectSite).toHaveBeenCalledWith("site-2");
  });

  it("Free: the hidden-result limit is unchanged — still only 3 results ranked, none beyond it selectable", () => {
    renderFinder({ entitlements: freeEntitlements });
    const buttons = screen.getAllByRole("button").filter((b) => /^Site \d+/.test(b.textContent));
    expect(buttons).toHaveLength(3);
  });

  it("Pro: selecting a result beyond the initial 10 after expanding the full ranking works", () => {
    const { onSelectSite } = renderFinder({ entitlements: proEntitlements });
    expect(screen.queryByRole("button", { name: /Site 11/ })).toBeNull();
    fireEvent.click(screen.getByText("weatherFinderShowFull"));
    fireEvent.click(nameButton("Site 11"));
    expect(onSelectSite).toHaveBeenCalledWith("site-11");
  });

  it("Pro: ranking/filter/day behavior is unchanged by this ticket (radius/day controls still present and functional)", () => {
    renderFinder({ entitlements: proEntitlements });
    expect(screen.getByText("weatherFinderRadius")).toBeInTheDocument();
    expect(screen.getByText("weatherFinderDays")).toBeInTheDocument();
    fireEvent.click(screen.getByText("5d"));
    expect(screen.getByText(/· 5 days/i)).toBeInTheDocument();
  });
});

describe("WeatherFinder — Ticket 415 (#415): no onSelectSite prop supplied at all", () => {
  it("renders plain non-interactive names, no crash, no event on click attempts", () => {
    render(
      <WeatherFinder
        siteList={siteList}
        scoresById={scoresById}
        userLoc={null}
        entitlements={proEntitlements}
        units="metric"
        t={t}
        onUpgrade={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("weatherFinderShowDetailsCta"));
    expect(screen.queryByRole("button", { name: /Site 0/ })).toBeNull();
    expect(screen.getByText("Site 0")).toBeInTheDocument();
    expect(trackEvent).not.toHaveBeenCalledWith("recommendation_destination_clicked", expect.anything());
  });
});
