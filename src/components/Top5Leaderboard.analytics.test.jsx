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

// UX Miði #376 collapsed the ranking card behind a "Sjá fleiri staði"
// disclosure by default — expand it here so existing interaction tests keep
// exercising the table/CTA content unchanged.
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
  fireEvent.click(screen.getByText("weeklyRankingShowDetailsCta"));
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

describe("Top5Leaderboard — Miði 7a: weekly ranking Pro CTA copy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Free, not logged in: CTA uses the context-specific key, not the generic proCtaTitle/proUpgrade", () => {
    renderLeaderboard({ me: null });
    expect(screen.getByText("weeklyRankingUpgradeCta")).toBeDefined();
    expect(screen.queryByText("proCtaTitle")).toBeNull();
    expect(screen.queryByText("proUpgrade")).toBeNull();
  });

  it("Free, logged in (non-pro): CTA still uses the context-specific key", () => {
    renderLeaderboard({ me: { user: { email: "x@example.com" } } });
    expect(screen.getByText("weeklyRankingUpgradeCta")).toBeDefined();
  });

  it("value/body text uses weeklyRankingUpgradeBody, not the generic proCtaSubtitle", () => {
    renderLeaderboard();
    expect(screen.getByText("weeklyRankingUpgradeBody")).toBeDefined();
    expect(screen.queryByText("proCtaSubtitle")).toBeNull();
  });

  it("Pro: no free-CTA copy is rendered at all — Pro status block shown instead, unaffected by the copy change", () => {
    renderLeaderboard({ entitlements: { isPro: true } });
    expect(screen.queryByText("weeklyRankingUpgradeCta")).toBeNull();
    expect(screen.queryByText("weeklyRankingUpgradeBody")).toBeNull();
    expect(screen.getByText("proActive")).toBeDefined();
  });

  it("weekly_ranking source/onUpgrade wiring is unchanged by the copy update", () => {
    const { onUpgrade } = renderLeaderboard({ me: null });
    fireEvent.click(screen.getByText("weeklyRankingUpgradeCta"));
    expect(trackEvent).toHaveBeenCalledWith("weekly_ranking_upgrade_clicked", {
      lang: "is",
      userTier: "free",
      upgradeSource: "weekly_ranking",
    });
    expect(onUpgrade).toHaveBeenCalledWith("weekly_ranking");
  });
});

function renderLeaderboardCollapsed(overrides = {}) {
  render(
    <Top5Leaderboard
      entitlements={entitlements}
      top5={makeTop5(3)}
      scoredCount={10}
      loadingWave1={false}
      loadingBg={false}
      units="metric"
      onSelectSite={vi.fn()}
      me={null}
      onUpgrade={vi.fn()}
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
}

describe("Top5Leaderboard — supporting-detail disclosure (UX Miði #376)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is collapsed by default — no table rows, entrypoint CTA shown with aria-expanded=false", () => {
    renderLeaderboardCollapsed();
    expect(screen.queryByRole("row")).toBeNull();
    const cta = screen.getByText("weeklyRankingShowDetailsCta");
    expect(cta.closest("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("clicking the entrypoint reveals the table and a hide affordance", () => {
    renderLeaderboard();
    expect(screen.getAllByRole("row").length).toBeGreaterThan(0);
    const hideBtn = screen.getByText("weeklyRankingHideDetailsCta");
    expect(hideBtn.closest("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("clicking hide collapses the card again", () => {
    renderLeaderboard();
    fireEvent.click(screen.getByText("weeklyRankingHideDetailsCta"));
    expect(screen.queryByRole("row")).toBeNull();
    expect(screen.getByText("weeklyRankingShowDetailsCta")).toBeDefined();
  });

  it("weekly_ranking_locked_viewed still fires on mount while the card is collapsed — collapse must not defer this analytics event", () => {
    renderLeaderboardCollapsed({ top5: makeTop5(5) });
    // Card is still collapsed (entrypoint never clicked) — the event must
    // already have fired, proving the mount-effect is not gated on resultsOpen.
    expect(screen.getByText("weeklyRankingShowDetailsCta")).toBeDefined();
    expect(trackEvent).toHaveBeenCalledWith(
      "weekly_ranking_locked_viewed",
      expect.objectContaining({ userTier: "free" })
    );
  });
});
