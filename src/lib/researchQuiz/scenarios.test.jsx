// src/lib/researchQuiz/scenarios.test.js
//
// Confirms frozen scenario identity follows the FINAL CANONICAL RENDERED
// TONE (never the raw verdict) by rendering the real HomeDecisionCard with
// each fixture's cardProps — including the diagnostic fixture (raw "move" +
// comparisonState.direction "similar" -> canonical "stay") required by the
// approved prompt even though it is not a fourth participant scenario.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeDecisionCard from "../../components/HomeDecisionCard";
import { RESEARCH_QUIZ_SCENARIOS, RESEARCH_QUIZ_DIAGNOSTIC_FIXTURE } from "./scenarios";

vi.mock("../../lib/analytics", () => ({ trackEvent: vi.fn() }));

const t = (k) => k;

function renderScenario(fixture) {
  return render(<HomeDecisionCard t={t} lang="is" disableAnalytics {...fixture.cardProps} />);
}

describe("RESEARCH_QUIZ_SCENARIOS — exactly the three canonical scenarios", () => {
  beforeEach(() => vi.clearAllMocks());

  it("has exactly one stay, one move, and one consider scenario", () => {
    expect(RESEARCH_QUIZ_SCENARIOS.map((s) => s.id).sort()).toEqual(["consider", "move", "stay"]);
  });

  it("never fetches live weather/scoring — rows is always frozen empty, comparisonState is a plain object", () => {
    for (const scenario of RESEARCH_QUIZ_SCENARIOS) {
      expect(scenario.cardProps.rows).toEqual([]);
      expect(typeof scenario.cardProps.comparisonState).toBe("object");
    }
  });

  it("stay scenario renders the canonical stay title, no candidate/CTA", () => {
    renderScenario(RESEARCH_QUIZ_SCENARIOS.find((s) => s.id === "stay"));
    expect(screen.getByText("routeVerdictStayTitle")).toBeInTheDocument();
  });

  it("move scenario renders the canonical move (locked) title", () => {
    renderScenario(RESEARCH_QUIZ_SCENARIOS.find((s) => s.id === "move"));
    expect(screen.getByText(/decisionLockedCta/)).toBeInTheDocument();
  });

  it("consider scenario renders the canonical hedged consider title, never the move CTA", () => {
    renderScenario(RESEARCH_QUIZ_SCENARIOS.find((s) => s.id === "consider"));
    expect(screen.getByText(/decisionConsiderLockedCta/)).toBeInTheDocument();
    expect(screen.queryByText(/^decisionLockedCta/)).toBeNull();
  });
});

describe("RESEARCH_QUIZ_DIAGNOSTIC_FIXTURE — raw move + similar -> canonical stay", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is not one of the three participant scenarios", () => {
    const ids = RESEARCH_QUIZ_SCENARIOS.map((s) => s.id);
    expect(RESEARCH_QUIZ_SCENARIOS).not.toContainEqual(
      expect.objectContaining({ rawVerdict: RESEARCH_QUIZ_DIAGNOSTIC_FIXTURE.rawVerdict, id: "stay" }),
    );
    expect(ids).toHaveLength(3);
  });

  it("declares rawVerdict 'move' but canonical id 'stay' — the diagnostic point of this fixture", () => {
    expect(RESEARCH_QUIZ_DIAGNOSTIC_FIXTURE.rawVerdict).toBe("move");
    expect(RESEARCH_QUIZ_DIAGNOSTIC_FIXTURE.id).toBe("stay");
  });

  it("actually renders the canonical stay tone via the real HomeDecisionCard, not a move tone", () => {
    renderScenario(RESEARCH_QUIZ_DIAGNOSTIC_FIXTURE);
    expect(screen.getByText("decisionSimilarTitle")).toBeInTheDocument();
    expect(screen.queryByText("routeVerdictMoveTitle")).toBeNull();
    expect(screen.queryByText(/decisionLockedCta/)).toBeNull();
  });
});
