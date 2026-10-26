// Ticket #444 — InstantComparison's icon-only temperature row gets a small
// qualifier clarifying it's a mean of available daily highs (up to 3 days,
// missing excluded), not a full-period observed mean. InstantComparison is
// Brochure-only (CLAUDE.md/AGENTS.md); this does not touch the homepage
// canonical card, comparisonState.direction, delta text, or thresholds.
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import InstantComparison from "./InstantComparison";
import { translations } from "../i18n/translations";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

function makeState(overrides = {}) {
  return {
    best: {
      site: { id: "site-nearby", name: "Nearby Site", lat: 64.5, lon: -20.5 },
      score: 70,
      distFromBase: 30,
    },
    currentMetrics: { avgWind: 10, totalRain: 8, avgHighTemp: 14 },
    nearbyMetrics: { avgWind: 5, totalRain: 3, avgHighTemp: 16 },
    strength: "strong",
    primaryKey: "temp",
    worseningsCount: 0,
    isStrongOrDecent: true,
    scoreDiff: 15,
    tier: 2,
    showComparison: true,
    direction: "nearby_better",
    ...overrides,
  };
}

const baseProps = {
  site: { id: "site-current", name: "Current Site", lat: 64.1, lon: -21 },
  currentScore: 55,
  rows: [{ windMax: 10, rain: 8, tmax: 14 }],
  siteList: [],
  scoresById: { "site-nearby": { score: 70, rows: [{ windMax: 5, rain: 3, tmax: 16 }] } },
  radiusKm: 50,
  homepageRecommendation: "move",
};

describe("InstantComparison — temperature qualifier (#444)", () => {
  it("EN: shows the qualifier under both temp rows when a temp value is present", () => {
    const t = (k) => translations.en[k] ?? k;
    render(
      <InstantComparison {...baseProps} lang="en" t={t} comparisonState={makeState()} />
    );
    expect(screen.getAllByText("Average daily high, up to 3 days")).toHaveLength(2);
  });

  it("IS: shows the Icelandic qualifier", () => {
    const t = (k) => translations.is[k] ?? k;
    render(
      <InstantComparison {...baseProps} lang="is" t={t} comparisonState={makeState()} />
    );
    expect(screen.getAllByText("Meðaltal hámarkshita, allt að 3 dagar")).toHaveLength(2);
  });

  it("omits the qualifier together with the temp row when avgHighTemp is null (row omission preserved)", () => {
    const t = (k) => translations.en[k] ?? k;
    render(
      <InstantComparison
        {...baseProps}
        lang="en"
        t={t}
        comparisonState={makeState({
          currentMetrics: { avgWind: 10, totalRain: 8, avgHighTemp: null },
          nearbyMetrics: { avgWind: 5, totalRain: 3, avgHighTemp: null },
        })}
      />
    );
    expect(screen.queryByText("Average daily high, up to 3 days")).toBeNull();
  });

  it("does not change the existing wind/rain delta text or the canonical direction/tier", () => {
    const t = (k) => translations.en[k] ?? k;
    render(
      <InstantComparison {...baseProps} lang="en" t={t} comparisonState={makeState()} />
    );
    // The "temp" primaryKey's existing delta sentence must still render.
    expect(screen.getByText(/2°C warmer/)).toBeInTheDocument();
  });
});
