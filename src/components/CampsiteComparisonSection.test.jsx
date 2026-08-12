import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CampsiteComparisonSection from "./CampsiteComparisonSection";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../lib/forecastCache", () => ({ getForecast: vi.fn() }));

const t = (k) => k;

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
