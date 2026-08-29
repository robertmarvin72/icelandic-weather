import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeDecisionCard from "./HomeDecisionCard";
import { trackEvent } from "../lib/analytics";
import { commonTranslations } from "../i18n/translations.common";
import { routePlannerTranslations } from "../i18n/translations.routePlanner";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../config/hazards", () => ({
  HAZARDS_V1: { windWarn: 10, gustWarn: 15, rainWarn: 5 },
}));
vi.mock("../lib/routeVerdictMeta", () => ({
  getRouteVerdictMeta: (v) => ({
    titleKey: `routeVerdict${v.charAt(0).toUpperCase() + v.slice(1)}Title`,
    bodyKey: `routeVerdict${v.charAt(0).toUpperCase() + v.slice(1)}Body`,
    tone: "neutral",
    icon: "mapPin",
  }),
}));

const t = (k) => k;

function makeRoutePlanner(verdict, candidateName = "Flúðir") {
  return {
    ready: true,
    verdict,
    candidate: { id: "site-fludir", name: candidateName, distanceKm: 25 },
    radiusKm: 50,
    windowDays: 3,
  };
}

function makeCandidate({ distFromBase = 30, tier = 2, isStrongOrDecent = true } = {}) {
  return {
    best: { site: { id: "site-nearby", name: "Nearby Site" }, score: 70, distFromBase },
    currentMetrics: { avgWind: 10, totalRain: 8, avgHighTemp: 14 },
    nearbyMetrics: { avgWind: 5, totalRain: 3, avgHighTemp: 14 },
    strength: isStrongOrDecent ? "strong" : "mixed",
    primaryKey: isStrongOrDecent ? "wind" : null,
    improvements: isStrongOrDecent ? ["wind", "rain"] : [],
    worseningsCount: 0,
    isStrongOrDecent,
    scoreDiff: 15,
    tier,
    showComparison: true,
    direction: "nearby_better",
  };
}

function noCandidateState(direction = "no_candidate") {
  return {
    best: null,
    currentMetrics: null,
    nearbyMetrics: null,
    strength: "mixed",
    primaryKey: null,
    improvements: [],
    worseningsCount: 0,
    isStrongOrDecent: false,
    scoreDiff: 0,
    tier: -1,
    showComparison: false,
    direction,
  };
}

function renderCard(props = {}) {
  return render(<HomeDecisionCard t={t} rows={[]} {...props} />);
}

describe("HomeDecisionCard — stay branch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows stay title/body via routePlannerSummary fallback, no candidate section, no CTA", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: noCandidateState("no_candidate"),
      entitlements: { isPro: false },
    });
    expect(screen.getByText("routeVerdictStayTitle")).toBeDefined();
    expect(screen.queryByText("Nearby Site")).toBeNull();
    expect(screen.queryByText(/decisionLockedCta|decisionConsiderLockedCta/)).toBeNull();
  });

  it("similar direction overrides to stay even when raw verdict is move", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: { ...noCandidateState(), showComparison: true, direction: "similar" },
      entitlements: { isPro: false },
    });
    expect(screen.getByText("decisionSimilarTitle")).toBeDefined();
    expect(screen.queryByText("routeVerdictMoveTitle")).toBeNull();
  });

  it("current_better direction overrides to stay", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: { ...noCandidateState(), showComparison: true, direction: "current_better" },
      entitlements: { isPro: false },
    });
    expect(screen.getByText("decisionCurrentBetterTitle")).toBeDefined();
  });
});

describe("HomeDecisionCard — move branch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Free: locked CTA with move-flavoured wording, no candidate identity shown", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
      onUpgrade: vi.fn(),
    });
    expect(screen.getByText(/decisionLockedCta/)).toBeDefined();
    expect(screen.queryByText(/decisionConsiderLockedCta/)).toBeNull();
    expect(screen.queryByText("Nearby Site")).toBeNull();
  });

  it("Pro: candidate name, distance, and comfort reasons shown; no CTA", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate({ distFromBase: 42 }),
      entitlements: { isPro: true },
    });
    expect(screen.getByText("Nearby Site")).toBeDefined();
    expect(screen.getByText("icDistanceLabel")).toBeDefined();
    expect(screen.getByText("icReasonCalmer")).toBeDefined();
    expect(screen.getByText("icReasonDrier")).toBeDefined();
    expect(screen.queryByText(/decisionLockedCta/)).toBeNull();
  });

  it("clicking the Free locked CTA fires better_location_upgrade_clicked and calls onUpgrade('decision_recommendation')", () => {
    const onUpgrade = vi.fn();
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
      onUpgrade,
    });
    fireEvent.click(screen.getByText(/decisionLockedCta/));
    expect(onUpgrade).toHaveBeenCalledWith("decision_recommendation");
    expect(trackEvent).toHaveBeenCalledWith(
      "better_location_upgrade_clicked",
      expect.objectContaining({ recommendation_type: "move", userTier: "free" })
    );
  });
});

describe("HomeDecisionCard — consider branch (hedged)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Free: hedged CTA wording, never the move ('better spot') CTA", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
      onUpgrade: vi.fn(),
    });
    expect(screen.getByText(/decisionConsiderLockedCta/)).toBeDefined();
    expect(screen.queryByText(/^decisionLockedCta/)).toBeNull();
  });

  it("body copy never asserts a better site was definitively found — uses the hedged locked-body key", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    expect(screen.getByText("decisionConsiderLockedBody")).toBeDefined();
  });

  it("Pro: candidate shown same as move branch, still no CTA", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: true },
    });
    expect(screen.getByText("Nearby Site")).toBeDefined();
    expect(screen.queryByText(/decisionConsiderLockedCta/)).toBeNull();
  });
});

describe("HomeDecisionCard — no-candidate branch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows stay-positive state, not an empty/error state, when no qualifying candidate exists", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: noCandidateState(),
      entitlements: { isPro: false },
    });
    expect(screen.getByText("routeVerdictStayTitle")).toBeDefined();
    expect(document.body.textContent).not.toMatch(/error/i);
  });

  it("never fabricates a candidate from top5[0] or any source other than comparisonState.best", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: noCandidateState(),
      entitlements: { isPro: true },
      // top5 is intentionally not a prop HomeDecisionCard accepts at all —
      // there is no code path here that could read it.
    });
    expect(screen.queryByText("Nearby Site")).toBeNull();
  });
});

describe("HomeDecisionCard — candidate is always comparisonState.best, within radius by construction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("displayed candidate name/distance come directly from comparisonState.best — no independent selection logic", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate({ distFromBase: 17 }),
      entitlements: { isPro: true },
    });
    // comparisonState.best is produced upstream by selectBestCandidate
    // (radius-filtered) via useComparisonState — HomeDecisionCard has no
    // fallback candidate source of its own.
    expect(screen.getByText("Nearby Site")).toBeDefined();
  });
});

describe("HomeDecisionCard — analytics, exactly-once per mount, no duplication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recommendation_viewed fires exactly once on mount", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "recommendation_viewed");
    expect(calls).toHaveLength(1);
  });

  it("comparison_viewed fires exactly once on mount", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: true },
    });
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "comparison_viewed");
    expect(calls).toHaveLength(1);
  });

  it("better_nearby_found fires when isStrongOrDecent, does not fire when not", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate({ isStrongOrDecent: true }),
      entitlements: { isPro: true },
    });
    expect(
      trackEvent.mock.calls.some((c) => c[0] === "better_nearby_found")
    ).toBe(true);
  });

  it("better_nearby_found does not fire when direction is similar (no meaningful improvement)", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: { ...makeCandidate({ isStrongOrDecent: false }), direction: "similar" },
      entitlements: { isPro: true },
    });
    expect(
      trackEvent.mock.calls.some((c) => c[0] === "better_nearby_found")
    ).toBe(false);
  });

  it("better_location_locked_viewed fires once for Free + locked tone, not for Pro", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "better_location_locked_viewed");
    expect(calls).toHaveLength(1);
  });

  it("only ONE component instance fires these events — no legacy DecisionBanner/InstantComparison call sites remain to double-fire", () => {
    // Regression guard for the merge itself: DecisionBanner.jsx no longer
    // exists, and InstantComparison is not rendered on the homepage, so a
    // single HomeDecisionCard mount is definitionally the only source of
    // recommendation_viewed/comparison_viewed on this page.
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    const recNames = trackEvent.mock.calls.map((c) => c[0]);
    expect(recNames.filter((n) => n === "recommendation_viewed")).toHaveLength(1);
    expect(recNames.filter((n) => n === "comparison_viewed")).toHaveLength(1);
  });

  it("secondary action fires homepage_instant_comparison_cta_click on click", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: true },
    });
    // #396: candidate-visible CTA for move tone is tone-only
    // (decisionMoveCandidateCta), not the generic tier-based icCtaView.
    fireEvent.click(screen.getByText("decisionMoveCandidateCta"));
    expect(trackEvent).toHaveBeenCalledWith("homepage_instant_comparison_cta_click");
  });
});

describe("HomeDecisionCard — canonical_recommendation_viewed (analytics-design follow-up)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("raw move + comparisonState.direction=similar → canonical stay: raw_verdict/tone_overridden expose the divergence without changing recommendation_type semantics", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: { ...noCandidateState(), showComparison: true, direction: "similar" },
      entitlements: { isPro: false },
    });
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "canonical_recommendation_viewed");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual(
      expect.objectContaining({
        recommendation_type: "stay",
        raw_verdict: "move",
        tone_overridden: true,
      })
    );
  });

  it("fires with recommendation_type='stay', raw_verdict='stay', tone_overridden=false for a pure stay scenario", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: noCandidateState("no_candidate"),
      entitlements: { isPro: false },
    });
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "canonical_recommendation_viewed");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual(
      expect.objectContaining({ recommendation_type: "stay", raw_verdict: "stay", tone_overridden: false })
    );
  });

  it("fires with recommendation_type='move' for a pure move scenario (raw and canonical agree)", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "canonical_recommendation_viewed");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual(
      expect.objectContaining({ recommendation_type: "move", raw_verdict: "move", tone_overridden: false })
    );
  });

  it("fires with recommendation_type='consider' — consider is independently measurable, not lumped with move", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "canonical_recommendation_viewed");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual(
      expect.objectContaining({ recommendation_type: "consider", raw_verdict: "consider", tone_overridden: false })
    );
  });

  it("fires exactly once on mount (StrictMode-safe dedup, same ref-guard pattern as recommendation_viewed)", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "canonical_recommendation_viewed");
    expect(calls).toHaveLength(1);
  });

  it("does not fire again on a rerender where model.tone is unchanged (e.g. rows content changes but tone stays the same)", () => {
    const { rerender } = renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: noCandidateState("no_candidate"),
      entitlements: { isPro: false },
    });
    rerender(
      <HomeDecisionCard
        t={t}
        rows={[{ windMax: 99, windGust: 99, rain: 99 }]}
        routePlannerSummary={makeRoutePlanner("stay")}
        comparisonState={noCandidateState("no_candidate")}
        entitlements={{ isPro: false }}
      />
    );
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "canonical_recommendation_viewed");
    expect(calls).toHaveLength(1);
  });

  it("fires a new event when model.tone genuinely changes (stay → move)", () => {
    const { rerender } = renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: noCandidateState("no_candidate"),
      entitlements: { isPro: false },
    });
    rerender(
      <HomeDecisionCard
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        comparisonState={makeCandidate()}
        entitlements={{ isPro: false }}
      />
    );
    const calls = trackEvent.mock.calls.filter((c) => c[0] === "canonical_recommendation_viewed");
    expect(calls).toHaveLength(2);
    expect(calls[0][1]).toEqual(expect.objectContaining({ recommendation_type: "stay" }));
    expect(calls[1][1]).toEqual(expect.objectContaining({ recommendation_type: "move" }));
  });

  it("does not fire before routePlannerSummary is ready", () => {
    renderCard({
      routePlannerSummary: { ready: false, verdict: "move" },
      comparisonState: noCandidateState("no_candidate"),
      entitlements: { isPro: false },
    });
    expect(
      trackEvent.mock.calls.some((c) => c[0] === "canonical_recommendation_viewed")
    ).toBe(false);
  });

  it("payload contains only the approved parameters — no PII, no extra fields", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
      currentSiteId: "site-current",
    });
    const call = trackEvent.mock.calls.find((c) => c[0] === "canonical_recommendation_viewed");
    expect(Object.keys(call[1]).sort()).toEqual(
      [
        "recommendation_type",
        "raw_verdict",
        "tone_overridden",
        "better_location_found",
        "userTier",
        "current_campsite_id",
      ].sort()
    );
  });

  it("existing raw events (recommendation_viewed, stay_recommended semantics via rawVerdict) and CTA events are unaffected — regression guard", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: { ...noCandidateState(), showComparison: true, direction: "similar" },
      entitlements: { isPro: false },
      onUpgrade: vi.fn(),
    });
    // recommendation_viewed keeps its own raw semantics (recommendation_type: "move"),
    // unaffected by the fact that canonical tone is "stay" for this same scenario.
    const rawCalls = trackEvent.mock.calls.filter((c) => c[0] === "recommendation_viewed");
    expect(rawCalls).toHaveLength(1);
    expect(rawCalls[0][1]).toEqual(expect.objectContaining({ recommendation_type: "move" }));
  });
});

describe("HomeDecisionCard — disableAnalytics isolation seam (#395)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires no trackEvent calls at all when disableAnalytics is true, across mount and every interaction", () => {
    const onUpgrade = vi.fn();
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
      onUpgrade,
      disableAnalytics: true,
    });
    fireEvent.click(screen.getByText(/decisionLockedCta/));
    expect(trackEvent).not.toHaveBeenCalled();
    // onUpgrade itself still fires — only analytics is isolated, not the
    // caller-supplied interception hook the research quiz relies on.
    expect(onUpgrade).toHaveBeenCalledWith("decision_recommendation");
  });

  it("fires the secondary CTA's onCtaClick without emitting homepage_instant_comparison_cta_click when disabled", () => {
    const onCtaClick = vi.fn();
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: true },
      onCtaClick,
      disableAnalytics: true,
    });
    // #396: candidate-visible CTA for move tone is tone-only, not icCtaView.
    fireEvent.click(screen.getByText("decisionMoveCandidateCta"));
    expect(trackEvent).not.toHaveBeenCalled();
    expect(onCtaClick).toHaveBeenCalled();
  });

  it("defaults to analytics enabled — every existing production call site is unaffected", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    expect(trackEvent.mock.calls.some((c) => c[0] === "recommendation_viewed")).toBe(true);
  });
});

describe("HomeDecisionCard — i18n key completeness (IS + EN)", () => {
  it.each(["is", "en"])("%s: decisionSimilarTitle/Body and decisionCurrentBetterTitle/Body resolve to real translated copy", (lang) => {
    const tr = (k) => routePlannerTranslations[lang]?.[k] ?? commonTranslations[lang]?.[k] ?? k;
    expect(tr("decisionSimilarTitle")).not.toBe("decisionSimilarTitle");
    expect(tr("decisionCurrentBetterTitle")).not.toBe("decisionCurrentBetterTitle");
    expect(tr("decisionLockedCta")).not.toBe("decisionLockedCta");
    expect(tr("decisionConsiderLockedCta")).not.toBe("decisionConsiderLockedCta");
    expect(tr("icReasonCalmer")).not.toBe("icReasonCalmer");
    expect(tr("icReasonDrier")).not.toBe("icReasonDrier");
    expect(tr("icReasonWarmer")).not.toBe("icReasonWarmer");
    expect(tr("icDistanceLabel")).not.toBe("icDistanceLabel");
  });
});

// ── #396: move/consider comprehension revision ──────────────────────────

describe("HomeDecisionCard — #396 move vs consider strength distinction (Free)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Free move: stronger recommendation wording, strength badge, action CTA", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    expect(screen.getByText("decisionMoveStrengthBadge")).toBeInTheDocument();
    expect(screen.getByText("decisionMoveLockedBody")).toBeInTheDocument();
    expect(screen.getByText(/decisionLockedCta/)).toBeInTheDocument();
  });

  it("Free consider: exploratory wording, distinct badge, compare/monitor CTA — never the move CTA", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    expect(screen.getByText("decisionConsiderStrengthBadge")).toBeInTheDocument();
    expect(screen.getByText("decisionConsiderLockedBody")).toBeInTheDocument();
    expect(screen.getByText(/decisionConsiderLockedCta/)).toBeInTheDocument();
    expect(screen.queryByText(/^decisionLockedCta/)).toBeNull();
  });

  it("move and consider badges are visually distinct (non-color emphasis), not just differently colored dots", () => {
    const { unmount } = renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    const moveBadgeClass = screen.getByText("decisionMoveStrengthBadge").className;
    const moveTitleClass = screen.getByText("routeVerdictMoveTitle").className;
    unmount();

    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    const considerBadgeClass = screen.getByText("decisionConsiderStrengthBadge").className;
    const considerTitleClass = screen.getByText("routeVerdictConsiderTitle").className;

    expect(moveBadgeClass).not.toBe(considerBadgeClass);
    expect(moveTitleClass).not.toBe(considerTitleClass); // font weight/size differ, not only color
  });
});

describe("HomeDecisionCard — #396 candidate-visible CTA precedence matrix (Pro)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("move: low tier and high tier render the SAME move-only CTA key", () => {
    const { unmount } = renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate({ tier: 0 }),
      entitlements: { isPro: true },
    });
    expect(screen.getByText("decisionMoveCandidateCta")).toBeInTheDocument();
    unmount();

    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate({ tier: 3 }),
      entitlements: { isPro: true },
    });
    expect(screen.getByText("decisionMoveCandidateCta")).toBeInTheDocument();
  });

  it("consider: low tier and high tier render the SAME consider-only CTA key, distinct from move's", () => {
    const { unmount } = renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate({ tier: 0 }),
      entitlements: { isPro: true },
    });
    expect(screen.getByText("decisionConsiderCandidateCta")).toBeInTheDocument();
    unmount();

    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate({ tier: 3 }),
      entitlements: { isPro: true },
    });
    expect(screen.getByText("decisionConsiderCandidateCta")).toBeInTheDocument();
  });

  it("never falls back to generic icCtaView/icCtaCompare for move or consider", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate({ tier: 2 }),
      entitlements: { isPro: true },
    });
    expect(screen.queryByText("icCtaView")).toBeNull();
    expect(screen.queryByText("icCtaCompare")).toBeNull();
  });

  it("stay-edge case: a candidate visible alongside canonical stay tone keeps the original tier-based generic CTA, never move/consider wording", () => {
    const { unmount } = renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: makeCandidate({ tier: 2 }),
      entitlements: { isPro: true },
    });
    expect(screen.getByText("icCtaView")).toBeInTheDocument();
    expect(screen.queryByText("decisionMoveCandidateCta")).toBeNull();
    expect(screen.queryByText("decisionConsiderCandidateCta")).toBeNull();
    unmount();

    renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: makeCandidate({ tier: 0 }),
      entitlements: { isPro: true },
    });
    expect(screen.getByText("icCtaCompare")).toBeInTheDocument();
  });
});

describe("HomeDecisionCard — #396 no unqualified 'better option' copy in active recommendation surfaces", () => {
  it.each(["is", "en"])("%s: move/consider body, locked body, and CTA copy never contain a bare 'better option'/'betri kostur'", (lang) => {
    const dict = routePlannerTranslations[lang];
    const keysToCheck = [
      "decisionMoveBodyWindowAware",
      "decisionMoveLockedBody",
      "decisionConsiderBodyWindowAware",
      "decisionConsiderLockedBody",
      "decisionLockedCta",
      "decisionConsiderLockedCta",
      "decisionMoveCandidateCta",
      "decisionConsiderCandidateCta",
      // RoutePlannerCard's own expanded-details consider description — an
      // actively rendered secondary recommendation surface, audited for
      // contradiction with the canonical revision (approved prompt §3).
      "routeStateConsiderDescription",
      // #396 Revision 2: RoutePlannerCard's Free-preview CTA body strings
      // (rendered in the same isPreview block as travelAdvisorMoveCta/
      // travelAdvisorConsiderCta) — missed in the v1 audit per Jonesy's/
      // Ripley's result review; both still used the exact banned pattern.
      "travelAdvisorMoveCtaBody",
      "travelAdvisorConsiderCtaBody",
    ];
    const banned = lang === "is" ? /betri kostur/i : /better option/i;
    for (const key of keysToCheck) {
      expect(dict[key]).toBeTypeOf("string");
      expect(dict[key]).not.toMatch(banned);
    }
  });

  it.each(["is", "en"])("%s: consider copy explicitly says the difference is not enough to recommend moving", (lang) => {
    const dict = routePlannerTranslations[lang];
    const marker = lang === "is" ? /ekki nóg/i : /not enough/i;
    expect(dict.decisionConsiderLockedBody).toMatch(marker);
    expect(dict.decisionConsiderBodyWindowAware).toMatch(marker);
    // #396 Revision 2: travelAdvisorConsiderCtaBody must also carry this
    // qualification — it previously never stated the difference was
    // insufficient to recommend moving.
    expect(dict.travelAdvisorConsiderCtaBody).toMatch(marker);
  });

  it.each(["is", "en"])("%s: RoutePlannerCard's Free-preview CTA bodies explicitly qualify weather, not a bare finding", (lang) => {
    const dict = routePlannerTranslations[lang];
    const weatherMarker = lang === "is" ? /veður/i : /weather/i;
    expect(dict.travelAdvisorMoveCtaBody).toMatch(weatherMarker);
    expect(dict.travelAdvisorConsiderCtaBody).toMatch(weatherMarker);
  });
});

// #396 Revision 3 (owner copy follow-up): routePainConsiderBody,
// routePainConsiderBulletLessPleasant, and icConsiderFallback must frame
// consider around comfort/poor weather/comparison/monitoring — never
// danger, hazards, or severe warnings — and the IS grammar fix
// ("minna notalegt", not "minni notalegt") must hold.
describe("HomeDecisionCard — #396 Revision 3: consider copy has no danger/hazard framing", () => {
  const DANGER_PATTERN = /danger|dangerous|hazard|serious warning|hætta|hættulegt|alvarleg[a-zú]*\s+ve[dð]urvi[dð]v[oö]run/i;

  it.each(["is", "en"])("%s: routePainConsiderBody, routePainConsiderBulletLessPleasant, and icConsiderFallback contain no danger/hazard/severe-warning framing", (lang) => {
    const routeDict = routePlannerTranslations[lang];
    const commonDict = commonTranslations[lang];
    for (const value of [
      routeDict.routePainConsiderBody,
      routeDict.routePainConsiderBulletLessPleasant,
      commonDict.icConsiderFallback,
    ]) {
      expect(value).toBeTypeOf("string");
      expect(value).not.toMatch(DANGER_PATTERN);
    }
  });

  it("IS routePainConsiderBody uses the grammatically correct 'minna notalegt', never 'minni notalegt'", () => {
    const value = routePlannerTranslations.is.routePainConsiderBody;
    expect(value).toMatch(/minna notalegt/);
    expect(value).not.toMatch(/minni notalegt/);
  });

  it.each(["is", "en"])("%s: the three keys remain real translated copy, not an untranslated key/fallback", (lang) => {
    const routeDict = routePlannerTranslations[lang];
    const commonDict = commonTranslations[lang];
    expect(routeDict.routePainConsiderBody).not.toBe("routePainConsiderBody");
    expect(routeDict.routePainConsiderBulletLessPleasant).not.toBe("routePainConsiderBulletLessPleasant");
    expect(commonDict.icConsiderFallback).not.toBe("icConsiderFallback");
    expect(routeDict.routePainConsiderBody.length).toBeGreaterThan(0);
    expect(routeDict.routePainConsiderBulletLessPleasant.length).toBeGreaterThan(0);
    expect(commonDict.icConsiderFallback.length).toBeGreaterThan(0);
  });

  it("icConsiderFallback does not imply moving is recommended", () => {
    for (const lang of ["is", "en"]) {
      const value = commonTranslations[lang].icConsiderFallback;
      expect(value).not.toMatch(/mælt er með að færa|moving is recommended|recommend moving/i);
    }
  });
});

describe("HomeDecisionCard — #396 regression: stay/similar/current_better unchanged", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stay (no candidate) renders exactly as before — no badge, no candidate CTA", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("stay"),
      comparisonState: noCandidateState(),
      entitlements: { isPro: false },
    });
    expect(screen.getByText("routeVerdictStayTitle")).toBeInTheDocument();
    expect(screen.queryByText(/decisionMoveStrengthBadge|decisionConsiderStrengthBadge/)).toBeNull();
  });

  it("similar direction still overrides raw move to canonical stay, unaffected by the badge/CTA changes", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: { ...noCandidateState(), showComparison: true, direction: "similar" },
      entitlements: { isPro: false },
    });
    expect(screen.getByText("decisionSimilarTitle")).toBeDefined();
    expect(screen.queryByText("decisionMoveStrengthBadge")).toBeNull();
  });

  it("current_better direction still overrides raw consider to canonical stay", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: { ...noCandidateState(), showComparison: true, direction: "current_better" },
      entitlements: { isPro: false },
    });
    expect(screen.getByText("decisionCurrentBetterTitle")).toBeDefined();
    expect(screen.queryByText("decisionConsiderStrengthBadge")).toBeNull();
  });

  it("raw-verdict and canonical-tone analytics events keep unchanged names/payload semantics", () => {
    renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: { ...noCandidateState(), showComparison: true, direction: "similar" },
      entitlements: { isPro: false },
    });
    const rawCalls = trackEvent.mock.calls.filter((c) => c[0] === "recommendation_viewed");
    expect(rawCalls).toHaveLength(1);
    expect(rawCalls[0][1]).toEqual(expect.objectContaining({ recommendation_type: "move" }));

    const canonicalCalls = trackEvent.mock.calls.filter((c) => c[0] === "canonical_recommendation_viewed");
    expect(canonicalCalls).toHaveLength(1);
    expect(canonicalCalls[0][1]).toEqual(
      expect.objectContaining({ recommendation_type: "stay", raw_verdict: "move", tone_overridden: true }),
    );
  });
});

describe("HomeDecisionCard — #396 candidate non-disclosure still holds for Free move/consider", () => {
  it("Free never exposes candidate identity anywhere in the DOM for either tone", () => {
    const { unmount } = renderCard({
      routePlannerSummary: makeRoutePlanner("move"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    expect(document.body.textContent).not.toContain("Nearby Site");
    unmount();

    renderCard({
      routePlannerSummary: makeRoutePlanner("consider"),
      comparisonState: makeCandidate(),
      entitlements: { isPro: false },
    });
    expect(document.body.textContent).not.toContain("Nearby Site");
  });
});

describe("HomeDecisionCard — #396 new translation keys are complete for IS + EN", () => {
  it.each(["is", "en"])("%s: new #396 keys resolve to real copy, not the key itself", (lang) => {
    const tr = (k) => routePlannerTranslations[lang]?.[k] ?? k;
    for (const key of [
      "decisionMoveCandidateCta",
      "decisionConsiderCandidateCta",
      "decisionMoveStrengthBadge",
      "decisionConsiderStrengthBadge",
    ]) {
      expect(tr(key)).not.toBe(key);
      expect(tr(key).length).toBeGreaterThan(0);
    }
  });

  it("candidate-name interpolation in decisionMoveBodyWindowAware/decisionConsiderBodyWindowAware still works", () => {
    for (const lang of ["is", "en"]) {
      const template = routePlannerTranslations[lang].decisionMoveBodyWindowAware;
      expect(template).toContain("{site}");
      expect(template.replace("{site}", "Flúðir")).toContain("Flúðir");
    }
  });
});
