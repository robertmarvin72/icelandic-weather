import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Top5Leaderboard from "./Top5Leaderboard";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./LoadingShimmer", () => ({ default: () => null }));
vi.mock("./ScoreLegend", () => ({ default: () => null }));
vi.mock("./RequireFeature", () => ({ default: ({ children, fallback }) => fallback ?? children }));
vi.mock("../lib/windUtils", () => ({ oppositeCompass: (c) => c }));
vi.mock("../lib/compassUtils", () => ({ translateCompass: (c) => c }));

const t = (k) => k;

function makeTop5(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    site: { id: `site-${i + 1}`, name: `Site ${i + 1}`, lat: 64 + i * 0.1, lon: -20 + i * 0.1 },
    score: 60 - i * 5,
    dist: 10 + i * 5,
  }));
}

const entitlements = { isPro: false };

function renderLeaderboard(overrides = {}) {
  const onSelectSite = vi.fn();
  const onUpgrade = vi.fn();
  render(
    <Top5Leaderboard
      entitlements={entitlements}
      top5={makeTop5(3)}
      scoredCount={10}
      loadingWave1={false}
      loadingBg={false}
      units="metric"
      onSelectSite={onSelectSite}
      me={null}
      onUpgrade={onUpgrade}
      t={t}
      lang="is"
      shelter={null}
      windDir={null}
      proUntil={null}
      subscription={null}
      onManageSubscription={vi.fn()}
      userLocationLabel={null}
      {...overrides}
    />
  );
  return { onSelectSite, onUpgrade };
}

describe("weekly_ranking_site_clicked analytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires weekly_ranking_site_clicked with rank 1 when the top row is clicked", () => {
    const { onSelectSite } = renderLeaderboard();
    const rows = screen.getAllByRole("row");
    // First data row (index 1 — row 0 is the thead)
    fireEvent.click(rows[1]);
    expect(trackEvent).toHaveBeenCalledWith("weekly_ranking_site_clicked", {
      siteId: "site-1",
      siteName: "Site 1",
      rank: 1,
    });
  });

  it("fires with rank 2 for the second row", () => {
    renderLeaderboard();
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[2]);
    expect(trackEvent).toHaveBeenCalledWith("weekly_ranking_site_clicked", expect.objectContaining({ rank: 2 }));
  });

  it("fires with rank 3 for the third row", () => {
    renderLeaderboard();
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[3]);
    expect(trackEvent).toHaveBeenCalledWith("weekly_ranking_site_clicked", expect.objectContaining({ rank: 3 }));
  });

  it("calls onSelectSite exactly once with the site id after the event fires", () => {
    const { onSelectSite } = renderLeaderboard();
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1]);
    expect(trackEvent).toHaveBeenCalledOnce();
    expect(onSelectSite).toHaveBeenCalledOnce();
    expect(onSelectSite).toHaveBeenCalledWith("site-1");
  });

  it("fires weekly_ranking_site_clicked before onSelectSite", () => {
    const order = [];
    vi.mocked(trackEvent).mockImplementation(() => order.push("event"));
    const onSelectSite = vi.fn(() => order.push("select"));
    renderLeaderboard({ onSelectSite });
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1]);
    expect(order).toEqual(["event", "select"]);
  });

  it("sends no undefined, null, or empty-string properties", () => {
    renderLeaderboard();
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[1]);
    const props = trackEvent.mock.calls[0][1];
    for (const [key, val] of Object.entries(props)) {
      expect(val, `property "${key}" must not be undefined`).not.toBeUndefined();
      expect(val, `property "${key}" must not be null`).not.toBeNull();
      expect(val, `property "${key}" must not be empty string`).not.toBe("");
    }
  });
});
