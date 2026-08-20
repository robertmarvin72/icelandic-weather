import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CampsiteComparisonSection from "./CampsiteComparisonSection";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../lib/forecastCache", () => ({ getForecast: vi.fn() }));
vi.mock("../config/availability", () => ({
  getSiteAvailability: () => ({ status: "open" }),
}));

const t = (k) => k;

const siteList = [
  { id: "site-current", name: "Þórsmörk", lat: 63.68, lon: -19.5 },
  { id: "site-other", name: "Skaftafell", lat: 64.02, lon: -16.97 },
];

describe("CampsiteComparisonSection — upgrade_source threading (Miði 7b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("Free (already used their one preview): locked-card CTA calls onUpgrade('comparison')", () => {
    // Matches the sessionStorage key from useComparisonPreview.js — reaching
    // the locked state (post-5b) is what actually renders LockedComparisonCard.
    sessionStorage.setItem("campcastComparisonPreviewUsed", "1");

    const onUpgrade = vi.fn();
    render(
      <CampsiteComparisonSection
        siteList={[]}
        t={t}
        lang="is"
        currentSiteId={null}
        entitlements={{ isPro: false }}
        onUpgrade={onUpgrade}
      />
    );

    fireEvent.click(screen.getByText("comparisonLockedCta"));

    expect(trackEvent).toHaveBeenCalledWith("comparison_upgrade_clicked", {
      lang: "is",
      source: "comparison",
    });
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onUpgrade).toHaveBeenCalledWith("comparison");
  });
});

describe("CampsiteComparisonSection — initial-state UX fix (siteIdA inherits currentSiteId, siteIdB starts unselected)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("A shows the real current campsite, B shows the placeholder — not a second real campsite name", () => {
    render(
      <CampsiteComparisonSection
        siteList={siteList}
        t={t}
        lang="is"
        currentSiteId="site-current"
        entitlements={{ isPro: true }}
        onUpgrade={vi.fn()}
      />
    );
    expect(screen.getByText("Þórsmörk")).toBeDefined();
    expect(screen.getByText("selectCampsite")).toBeDefined();
    expect(screen.queryByText("Skaftafell")).toBeNull();
  });

  it("comparisonEmpty helper is still shown — the existing 'choose two campsites' guidance is untouched", () => {
    render(
      <CampsiteComparisonSection
        siteList={siteList}
        t={t}
        lang="is"
        currentSiteId="site-current"
        entitlements={{ isPro: true }}
        onUpgrade={vi.fn()}
      />
    );
    expect(screen.getByText("comparisonEmpty")).toBeDefined();
  });

  it("comparison does not run and no comparison analytics fire while B is unselected — execution guard already reads real state, unaffected by the display fix", () => {
    render(
      <CampsiteComparisonSection
        siteList={siteList}
        t={t}
        lang="is"
        currentSiteId="site-current"
        entitlements={{ isPro: true }}
        onUpgrade={vi.fn()}
      />
    );
    expect(
      trackEvent.mock.calls.some((c) => c[0] === "comparison_campsites_selected")
    ).toBe(false);
    expect(screen.queryByText("comparisonLoading")).toBeNull();
  });
});
