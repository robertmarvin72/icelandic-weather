import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DecisionBanner from "./DecisionBanner";

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

// t returns the key itself so we can assert on key usage
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

function makeComparison(direction) {
  return { showComparison: true, direction };
}

describe("DecisionBanner — shared comparison state gates verdict", () => {
  beforeEach(() => vi.clearAllMocks());

  // Requirement 1 & 10: nearby_better + move verdict → move title visible
  it("shows move title when direction=nearby_better and verdict=move", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        comparisonState={makeComparison("nearby_better")}
      />
    );
    expect(screen.getByText("routeVerdictMoveTitle")).toBeDefined();
  });

  // Requirement 1 & 10: nearby_better + consider verdict → consider title visible
  it("shows consider title when direction=nearby_better and verdict=consider", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("consider")}
        comparisonState={makeComparison("nearby_better")}
      />
    );
    expect(screen.getByText("routeVerdictConsiderTitle")).toBeDefined();
  });

  // Requirements 2, 3, 8: similar → decisionSimilarTitle, no move/consider
  it("shows similar title when direction=similar (even if verdict=consider)", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("consider")}
        comparisonState={makeComparison("similar")}
      />
    );
    expect(screen.getByText("decisionSimilarTitle")).toBeDefined();
    expect(screen.queryByText("routeVerdictConsiderTitle")).toBeNull();
    expect(screen.queryByText("routeVerdictMoveTitle")).toBeNull();
  });

  // Requirement 8: IS similar title key matches spec
  it("decisionSimilarTitle key is rendered — IS translation must read 'Engin skýr ástæða til að færa sig'", () => {
    // With t=(k)=>k the key itself appears; consumer verifies IS string from translations
    const { container } = render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("consider")}
        comparisonState={makeComparison("similar")}
      />
    );
    expect(container.textContent).toContain("decisionSimilarTitle");
    expect(container.textContent).toContain("decisionSimilarBody");
  });

  // Requirement 4 & 9: current_better → decisionCurrentBetterTitle
  it("shows current-better title when direction=current_better", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("consider")}
        comparisonState={makeComparison("current_better")}
      />
    );
    expect(screen.getByText("decisionCurrentBetterTitle")).toBeDefined();
    expect(screen.queryByText("routeVerdictConsiderTitle")).toBeNull();
  });

  // Requirement 9: IS current-better title key matches spec
  it("decisionCurrentBetterTitle key is rendered — IS translation must read 'Haltu þig þar sem þú ert'", () => {
    const { container } = render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        comparisonState={makeComparison("current_better")}
      />
    );
    expect(container.textContent).toContain("decisionCurrentBetterTitle");
    expect(container.textContent).toContain("decisionCurrentBetterBody");
  });

  // Requirement 6: when comparisonState is absent, verdict-based logic is preserved (backward compat)
  it("falls back to verdict-based logic when comparisonState is not provided", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("consider")}
      />
    );
    // No comparisonState → falls through to verdict = "consider" branch
    expect(screen.getByText("routeVerdictConsiderTitle")).toBeDefined();
  });

  // Requirement 6: no_candidate direction → falls through to verdict (no false gate)
  it("falls through to verdict-based logic when showComparison=false (no candidate)", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        comparisonState={{ showComparison: false, direction: "no_candidate" }}
      />
    );
    expect(screen.getByText("routeVerdictMoveTitle")).toBeDefined();
  });

  // Requirement 7: mixed metrics (similar) must not show move recommendation
  it("similar direction never shows move title even when verdict=move", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        comparisonState={makeComparison("similar")}
      />
    );
    expect(screen.queryByText("routeVerdictMoveTitle")).toBeNull();
    expect(screen.getByText("decisionSimilarTitle")).toBeDefined();
  });
});

describe("DecisionBanner — Miði 7a: canonical-tone CTA (move vs consider)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Free MOVE: CTA uses decisionLockedCta ('better spot' wording allowed for move)", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        entitlements={{ isPro: false }}
        onUpgrade={vi.fn()}
      />
    );
    expect(screen.getByText(/decisionLockedCta/)).toBeDefined();
    expect(screen.queryByText(/decisionConsiderLockedCta/)).toBeNull();
  });

  it("Free CONSIDER: CTA uses decisionConsiderLockedCta, never the move ('better spot') CTA", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("consider")}
        entitlements={{ isPro: false }}
        onUpgrade={vi.fn()}
      />
    );
    expect(screen.getByText(/decisionConsiderLockedCta/)).toBeDefined();
    expect(screen.queryByText(/decisionLockedCta/)).toBeNull();
  });

  it("canonical override: raw verdict=move but comparisonState.direction=similar downgrades to stay — no locked CTA at all (CTA follows canonical tone, not raw verdict)", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        comparisonState={makeComparison("similar")}
        entitlements={{ isPro: false }}
        onUpgrade={vi.fn()}
      />
    );
    expect(screen.queryByText(/decisionLockedCta/)).toBeNull();
    expect(screen.queryByText(/decisionConsiderLockedCta/)).toBeNull();
  });

  it("Pro: no locked CTA is rendered regardless of tone", () => {
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        entitlements={{ isPro: true }}
        onUpgrade={vi.fn()}
      />
    );
    expect(screen.queryByText(/decisionLockedCta/)).toBeNull();
    expect(screen.queryByText(/decisionConsiderLockedCta/)).toBeNull();
  });

  it("clicking the move CTA fires better_location_upgrade_clicked and calls onUpgrade('decision_recommendation') — unchanged wiring", () => {
    const onUpgrade = vi.fn();
    render(
      <DecisionBanner
        t={t}
        rows={[]}
        routePlannerSummary={makeRoutePlanner("move")}
        entitlements={{ isPro: false }}
        onUpgrade={onUpgrade}
      />
    );
    fireEvent.click(screen.getByText(/decisionLockedCta/));
    expect(onUpgrade).toHaveBeenCalledWith("decision_recommendation");
  });
});
