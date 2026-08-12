import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RoutePlannerCard from "./RoutePlannerCard";
import { trackEvent } from "../lib/analytics";
import { deriveRoutePlannerSummary } from "../lib/routePlannerSummary";
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import { useFreeRecommendation } from "../hooks/useFreeRecommendation";
import { isFeatureAvailable } from "../config/features";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../lib/routePlannerSummary", () => ({ deriveRoutePlannerSummary: vi.fn() }));
vi.mock("../hooks/useRoutePlanner", () => ({ useRoutePlanner: vi.fn() }));
vi.mock("../hooks/useFreeRecommendation", () => ({ useFreeRecommendation: vi.fn() }));
vi.mock("./RoutePlannerDetailsModal", () => ({ default: () => null }));
vi.mock("./AnimatedPill", () => ({ default: ({ children }) => children }));
// Real isFeatureAvailable drives every other test (isPro/isPreview derived from
// entitlements, as in production). ProLock only renders when the feature
// resolves to { available: false, preview: false } — which today's
// features.js config (bestRoutePlanner has preview:true) never actually
// produces for a Free user. We override it for a single call, one test only,
// to exercise ProLock's own onUpgrade wiring without inventing a fake feature
// flag path elsewhere.
vi.mock("../config/features", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, isFeatureAvailable: vi.fn(actual.isFeatureAvailable) };
});

const t = (k) => k;

const SITE = { id: "base-site", name: "Base Camp", lat: 64.1, lon: -21.9 };

const CANDIDATE = {
  siteId: "site-fludir",
  siteName: "Flúðir",
  distanceKm: 25,
  betterDays: 1,
  sameDays: 0,
  worseDays: 0,
  windowDays: [],
  reasons: [],
  aggregateType: "better",
  hasWarning: false,
  hasHighWarning: false,
  hazardBlocked: false,
  roughWeatherWindow: null,
  deltaVsBase: 2,
  requiredDelta: 1,
};

function mockSummary(decisionLower, { withCandidate = true } = {}) {
  deriveRoutePlannerSummary.mockReturnValue({
    top3: withCandidate ? [CANDIDATE] : [],
    best: withCandidate ? CANDIDATE : null,
    decisionLower,
    summary: {
      ready: true,
      verdict: decisionLower,
      candidate: withCandidate
        ? { id: CANDIDATE.siteId, name: CANDIDATE.siteName, distanceKm: CANDIDATE.distanceKm }
        : null,
    },
  });
}

function baseProps(overrides = {}) {
  return {
    t,
    lang: "is",
    entitlements: { isPro: false },
    me: { user: { email: "x@example.com" } },
    onUpgrade: vi.fn(),
    sites: [SITE],
    baseSiteId: SITE.id,
    onSummaryChange: () => {},
    onSelectSite: () => {},
    ...overrides,
  };
}

function renderCard({
  isPro = false,
  hasFreeUsed = false,
  decisionLower = "move",
  comparisonState = null,
  withCandidate = true,
  props = {},
} = {}) {
  mockSummary(decisionLower, { withCandidate });

  useRoutePlanner.mockReturnValue({
    loading: false,
    error: "",
    result: { ranked: withCandidate ? [CANDIDATE] : [], recommendation: decisionLower },
    routeRiskData: null,
    routeRiskLoading: false,
  });

  const markFreeUsed = vi.fn();
  useFreeRecommendation.mockReturnValue({ hasFreeUsed, markFreeUsed });

  const finalProps = baseProps({ entitlements: { isPro }, comparisonState, ...props });

  const result = render(<RoutePlannerCard {...finalProps} />);

  return { ...result, onUpgrade: finalProps.onUpgrade, markFreeUsed };
}

describe("RoutePlannerCard — Free preview tone-dependent CTA (Miði 6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
  });

  it("Free preview shows the freeRecommendationBadge key (copy clarified: 1 free RECOMMENDATION per day, not '1 free today')", () => {
    renderCard({ isPro: false, decisionLower: "stay" });
    expect(screen.getByText("freeRecommendationBadge")).toBeDefined();
  });

  it("Pro does not see the free badge", () => {
    renderCard({ isPro: true, decisionLower: "stay" });
    expect(screen.queryByText("freeRecommendationBadge")).toBeNull();
  });

  it("Free STAY: unchanged generic CTA copy", () => {
    renderCard({ isPro: false, decisionLower: "stay" });
    expect(screen.getByText("routePlannerPreviewBody")).toBeDefined();
    expect(screen.getByText("proUpgrade")).toBeDefined();
    expect(screen.queryByText("travelAdvisorMoveCta")).toBeNull();
    expect(screen.queryByText("travelAdvisorConsiderCta")).toBeNull();
  });

  it("Free MOVE: 'found' copy + 'see the better spot' CTA, no destination fields", () => {
    renderCard({ isPro: false, decisionLower: "move" });
    expect(screen.getByText("travelAdvisorMoveCtaBody")).toBeDefined();
    expect(screen.getByText("travelAdvisorMoveCta")).toBeDefined();
    expect(screen.queryByText("Flúðir")).toBeNull();
    expect(screen.queryByText(/25\s*km/)).toBeNull();
  });

  it("Free CONSIDER: hedged copy + neutral CTA, never move-flavoured wording", () => {
    renderCard({ isPro: false, decisionLower: "consider" });
    expect(screen.getByText("travelAdvisorConsiderCtaBody")).toBeDefined();
    expect(screen.getByText("travelAdvisorConsiderCta")).toBeDefined();
    expect(screen.queryByText("travelAdvisorMoveCtaBody")).toBeNull();
    expect(screen.queryByText("travelAdvisorMoveCta")).toBeNull();
    expect(screen.queryByText("Flúðir")).toBeNull();
  });

  it("canonical tone reconciliation: comparisonState downgrade to stay hides the move CTA (same rule as DecisionBanner)", () => {
    renderCard({
      isPro: false,
      decisionLower: "move",
      comparisonState: { showComparison: true, direction: "similar" },
    });
    expect(screen.getByText("routePlannerPreviewBody")).toBeDefined();
    expect(screen.queryByText("travelAdvisorMoveCta")).toBeNull();
    expect(screen.queryByText("travelAdvisorMoveCtaBody")).toBeNull();
  });

  it("Pro: preview CTA block is not rendered at all — full response unaffected", () => {
    renderCard({ isPro: true, decisionLower: "move" });
    expect(screen.queryByText("travelAdvisorMoveCtaBody")).toBeNull();
    expect(screen.queryByText("routePlannerPreviewBody")).toBeNull();
  });
});

describe("RoutePlannerCard — day-count comparison line (Miði 6 follow-up)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
  });

  it("Free MOVE: routeDecisionCounts (day-by-day comparison) is not rendered", () => {
    renderCard({ isPro: false, decisionLower: "move" });
    expect(screen.queryByText("routeDecisionCounts")).toBeNull();
  });

  it("Free CONSIDER: routeDecisionCounts is not rendered", () => {
    renderCard({ isPro: false, decisionLower: "consider" });
    expect(screen.queryByText("routeDecisionCounts")).toBeNull();
  });

  it("Free STAY: routeDecisionCounts remains visible, unchanged (5b: STAY is unrestricted)", () => {
    renderCard({ isPro: false, decisionLower: "stay" });
    expect(screen.getByText("routeDecisionCounts")).toBeDefined();
  });

  it("Pro: routeDecisionCounts remains visible regardless of tone", () => {
    renderCard({ isPro: true, decisionLower: "move" });
    expect(screen.getByText("routeDecisionCounts")).toBeDefined();
  });

  it("does not touch the per-row pill (getVerdictFromDays/primaryLabel family) — unrelated to the bestCounts gate", () => {
    renderCard({ isPro: false, decisionLower: "move" });
    // routeDecisionCounts (the gated line) must be gone...
    expect(screen.queryByText("routeDecisionCounts")).toBeNull();
    // ...while the per-row pill label (CANDIDATE.aggregateType="better",
    // deltaVsBase=2 → getImprovementLabel resolves to "routeImproveBetter")
    // is completely untouched by this diff, exactly as in 5a.
    expect(screen.getByText("routeImproveBetter")).toBeDefined();
  });
});

describe("RoutePlannerCard — Miði 6 analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
  });

  it("fires travel_advisor_free_used exactly once after a successful Free run, using the raw verdict", () => {
    renderCard({ isPro: false, decisionLower: "move" });
    const calls = trackEvent.mock.calls.filter(([name]) => name === "travel_advisor_free_used");
    expect(calls.length).toBe(1);
    expect(calls[0][1]).toEqual({ recommendation_type: "move", userTier: "free" });
  });

  it("does not fire travel_advisor_free_used for Pro", () => {
    renderCard({ isPro: true, decisionLower: "move" });
    const calls = trackEvent.mock.calls.filter(([name]) => name === "travel_advisor_free_used");
    expect(calls.length).toBe(0);
  });

  it("fires travel_advisor_destination_locked for move", () => {
    renderCard({ isPro: false, decisionLower: "move" });
    expect(trackEvent).toHaveBeenCalledWith("travel_advisor_destination_locked", {
      recommendation_type: "move",
      userTier: "free",
    });
  });

  it("fires travel_advisor_destination_locked for consider", () => {
    renderCard({ isPro: false, decisionLower: "consider" });
    expect(trackEvent).toHaveBeenCalledWith("travel_advisor_destination_locked", {
      recommendation_type: "consider",
      userTier: "free",
    });
  });

  it("does NOT fire travel_advisor_destination_locked for stay — STAY is unrestricted, nothing is locked", () => {
    renderCard({ isPro: false, decisionLower: "stay" });
    const calls = trackEvent.mock.calls.filter(
      ([name]) => name === "travel_advisor_destination_locked"
    );
    expect(calls.length).toBe(0);
  });

  it("does NOT fire travel_advisor_destination_locked for Pro", () => {
    renderCard({ isPro: true, decisionLower: "move" });
    const calls = trackEvent.mock.calls.filter(
      ([name]) => name === "travel_advisor_destination_locked"
    );
    expect(calls.length).toBe(0);
  });

  it("does not double-fire travel_advisor_destination_locked when the component rerenders with the same tone", () => {
    mockSummary("move");
    useRoutePlanner.mockReturnValue({
      loading: false,
      error: "",
      result: { ranked: [CANDIDATE], recommendation: "move" },
      routeRiskData: null,
      routeRiskLoading: false,
    });
    useFreeRecommendation.mockReturnValue({ hasFreeUsed: false, markFreeUsed: vi.fn() });

    const props = baseProps({ entitlements: { isPro: false } });
    const { rerender } = render(<RoutePlannerCard {...props} />);
    rerender(<RoutePlannerCard {...props} lang="en" />);

    const calls = trackEvent.mock.calls.filter(
      ([name]) => name === "travel_advisor_destination_locked"
    );
    expect(calls.length).toBe(1);
  });

  it("fires travel_advisor_upgrade_clicked with source=preview_cta and recommendation_type on CTA click", () => {
    const { onUpgrade } = renderCard({ isPro: false, decisionLower: "move" });
    fireEvent.click(screen.getByText("travelAdvisorMoveCta"));

    expect(trackEvent).toHaveBeenCalledWith("travel_advisor_upgrade_clicked", {
      source: "preview_cta",
      recommendation_type: "move",
      userTier: "free",
    });
    expect(onUpgrade).toHaveBeenCalledOnce();
  });

  it("fires travel_advisor_upgrade_clicked with source=free_used_lock when Free already used their run", () => {
    const { onUpgrade } = renderCard({ isPro: false, decisionLower: "move", hasFreeUsed: true });
    fireEvent.click(screen.getByText("freeRecommendationCta"));

    expect(trackEvent).toHaveBeenCalledWith("travel_advisor_upgrade_clicked", {
      source: "free_used_lock",
      userTier: "free",
    });
    expect(onUpgrade).toHaveBeenCalledOnce();
  });

  it("never fires travel_advisor_daily_limit_reached — explicitly out of scope for Miði 6", () => {
    renderCard({ isPro: false, decisionLower: "move" });
    fireEvent.click(screen.getByText("travelAdvisorMoveCta"));

    const names = trackEvent.mock.calls.map(([name]) => name);
    expect(names).not.toContain("travel_advisor_daily_limit_reached");
  });

  it("fires travel_advisor_upgrade_clicked with source=pro_lock when the feature is fully locked (no preview), and onUpgrade still runs", () => {
    isFeatureAvailable.mockReturnValueOnce({ available: false, preview: false, reason: "requires_pro" });

    mockSummary("stay");
    useRoutePlanner.mockReturnValue({
      loading: false,
      error: "",
      result: null,
      routeRiskData: null,
      routeRiskLoading: false,
    });
    useFreeRecommendation.mockReturnValue({ hasFreeUsed: false, markFreeUsed: vi.fn() });

    const onUpgrade = vi.fn();
    render(<RoutePlannerCard {...baseProps({ entitlements: { isPro: false }, onUpgrade })} />);

    // ProLock replaces the whole card, so its "proUpgrade" button is the only match.
    fireEvent.click(screen.getByText("proUpgrade"));

    expect(trackEvent).toHaveBeenCalledWith("travel_advisor_upgrade_clicked", {
      source: "pro_lock",
      userTier: "free",
    });
    expect(trackEvent.mock.calls.filter(([name]) => name === "travel_advisor_upgrade_clicked")).toHaveLength(1);
    expect(onUpgrade).toHaveBeenCalledOnce();
  });
});
