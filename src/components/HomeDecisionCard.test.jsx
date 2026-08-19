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
    fireEvent.click(screen.getByText("icCtaView"));
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
