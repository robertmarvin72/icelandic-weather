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
  expand = true,
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

  // UX Miði — RoutePlannerCard's own verdict/CTA content is now collapsed by
  // default behind "Sjá nánar" (travelAdvisorShowDetails). Existing tests in
  // this file assert on that content, so expand by default here; pass
  // expand:false to inspect the collapsed teaser itself.
  if (expand) {
    fireEvent.click(result.getByText("travelAdvisorShowDetails"));
  }

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

  it("canonical tone reconciliation: comparisonState downgrade to stay hides the move CTA (same rule as HomeDecisionCard)", () => {
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
    const { rerender, getByText } = render(<RoutePlannerCard {...props} />);
    fireEvent.click(getByText("travelAdvisorShowDetails"));
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
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onUpgrade).toHaveBeenCalledWith("travel_advisor");
  });

  it("fires travel_advisor_upgrade_clicked with source=free_used_lock when Free already used their run", () => {
    const { onUpgrade } = renderCard({ isPro: false, decisionLower: "move", hasFreeUsed: true });
    fireEvent.click(screen.getByText("freeRecommendationCta"));

    expect(trackEvent).toHaveBeenCalledWith("travel_advisor_upgrade_clicked", {
      source: "free_used_lock",
      userTier: "free",
    });
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onUpgrade).toHaveBeenCalledWith("travel_advisor");
  });

  it("never fires travel_advisor_daily_limit_reached — explicitly out of scope for Miði 6", () => {
    renderCard({ isPro: false, decisionLower: "move" });
    fireEvent.click(screen.getByText("travelAdvisorMoveCta"));

    const names = trackEvent.mock.calls.map(([name]) => name);
    expect(names).not.toContain("travel_advisor_daily_limit_reached");
  });

  it("fires travel_advisor_upgrade_clicked with source=pro_lock when the feature is fully locked (no preview), and onUpgrade still runs", () => {
    // Two mockReturnValueOnce calls, not a persistent mockReturnValue: the
    // "Sjá nánar" click below triggers a rerender, and isFeatureAvailable is
    // called on every render (before the collapse-state early return), so the
    // initial collapsed render and the post-click expanded render each need
    // their own queued value. A persistent mockReturnValue would otherwise
    // leak into later tests, since vi.clearAllMocks() clears call history but
    // not configured return values.
    isFeatureAvailable.mockReturnValueOnce({ available: false, preview: false, reason: "requires_pro" });
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

    // ProLock is itself behind the "Sjá nánar" disclosure now — expand first.
    fireEvent.click(screen.getByText("travelAdvisorShowDetails"));

    // ProLock replaces the whole card, so its "proUpgrade" button is the only match.
    fireEvent.click(screen.getByText("proUpgrade"));

    expect(trackEvent).toHaveBeenCalledWith("travel_advisor_upgrade_clicked", {
      source: "pro_lock",
      userTier: "free",
    });
    expect(trackEvent.mock.calls.filter(([name]) => name === "travel_advisor_upgrade_clicked")).toHaveLength(1);
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onUpgrade).toHaveBeenCalledWith("travel_advisor");
  });
});

describe("RoutePlannerCard — supporting-detail disclosure (UX Miði)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
  });

  it("is collapsed by default: shows only the neutral teaser copy, no verdict/CTA content", () => {
    renderCard({ isPro: false, decisionLower: "move", expand: false });
    expect(screen.getByText("travelAdvisorTeaserTitle")).toBeDefined();
    expect(screen.getByText("travelAdvisorTeaserSubtitle")).toBeDefined();
    expect(screen.getByText("travelAdvisorShowDetails")).toBeDefined();
    expect(screen.queryByText("travelAdvisorMoveCta")).toBeNull();
    expect(screen.queryByText("travelAdvisorMoveCtaBody")).toBeNull();
  });

  it("collapsed teaser copy is tone-neutral — never renders the weather-claim title/subtitle used elsewhere in the card, regardless of tone", () => {
    renderCard({ isPro: false, decisionLower: "move", expand: false });
    expect(screen.queryByText("travelAdvisorTitle")).toBeNull();
    expect(screen.queryByText("travelAdvisorSubtitle")).toBeNull();
  });

  it("expanding the teaser reveals the (unchanged) expanded header copy, not the teaser copy", () => {
    renderCard({ isPro: false, decisionLower: "move", expand: false });
    fireEvent.click(screen.getByText("travelAdvisorShowDetails"));
    expect(screen.getByText("travelAdvisorTitle")).toBeDefined();
    expect(screen.getByText("travelAdvisorSubtitle")).toBeDefined();
    expect(screen.queryByText("travelAdvisorTeaserTitle")).toBeNull();
    expect(screen.queryByText("travelAdvisorTeaserSubtitle")).toBeNull();
  });

  it("Pro is also collapsed by default — the full verdict block does not compete with HomeDecisionCard unprompted", () => {
    renderCard({ isPro: true, decisionLower: "move", expand: false });
    expect(screen.getByText("travelAdvisorShowDetails")).toBeDefined();
    expect(screen.queryByText("routeStateMove")).toBeNull();
  });

  it("ProLock is collapsed by default — no Upgrade CTA visible before 'Sjá nánar' is opened", () => {
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

    render(<RoutePlannerCard {...baseProps({ entitlements: { isPro: false } })} />);

    expect(screen.getByText("travelAdvisorShowDetails")).toBeDefined();
    expect(screen.queryByText("proUpgrade")).toBeNull();
  });

  it("clicking 'Sjá nánar' reveals the verdict content", () => {
    renderCard({ isPro: false, decisionLower: "move", expand: false });
    fireEvent.click(screen.getByText("travelAdvisorShowDetails"));
    expect(screen.getByText("travelAdvisorMoveCta")).toBeDefined();
  });

  it("clicking 'Fela nánar' collapses the card back", () => {
    renderCard({ isPro: false, decisionLower: "move" });
    expect(screen.getByText("travelAdvisorMoveCta")).toBeDefined();
    fireEvent.click(screen.getByText("travelAdvisorHideDetails"));
    expect(screen.queryByText("travelAdvisorMoveCta")).toBeNull();
    expect(screen.getByText("travelAdvisorShowDetails")).toBeDefined();
  });

  it("instrumentation semantic change: travel_advisor_destination_locked does NOT fire while collapsed", () => {
    renderCard({ isPro: false, decisionLower: "move", expand: false });
    const calls = trackEvent.mock.calls.filter(
      ([name]) => name === "travel_advisor_destination_locked"
    );
    expect(calls.length).toBe(0);
  });

  it("instrumentation semantic change: travel_advisor_destination_locked fires once the locked state is actually shown (after expanding)", () => {
    renderCard({ isPro: false, decisionLower: "move", expand: false });
    fireEvent.click(screen.getByText("travelAdvisorShowDetails"));
    expect(trackEvent).toHaveBeenCalledWith("travel_advisor_destination_locked", {
      recommendation_type: "move",
      userTier: "free",
    });
  });

  it("stay_recommended fires on mount regardless of collapse state — semantics preserved, not gated on disclosure", () => {
    renderCard({ isPro: false, decisionLower: "stay", expand: false });
    const calls = trackEvent.mock.calls.filter(([name]) => name === "stay_recommended");
    expect(calls.length).toBe(1);
  });

  it("move_recommended fires on mount regardless of collapse state — semantics preserved, not gated on disclosure", () => {
    renderCard({ isPro: false, decisionLower: "move", expand: false });
    const calls = trackEvent.mock.calls.filter(([name]) => name === "move_recommended");
    expect(calls.length).toBe(1);
  });

  it("travel_advisor_free_used fires on mount regardless of collapse state — entitlement consumption is not gated on disclosure", () => {
    renderCard({ isPro: false, decisionLower: "move", expand: false });
    const calls = trackEvent.mock.calls.filter(([name]) => name === "travel_advisor_free_used");
    expect(calls.length).toBe(1);
  });
});
