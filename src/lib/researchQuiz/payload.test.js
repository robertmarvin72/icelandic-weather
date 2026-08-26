import { describe, it, expect } from "vitest";
import { isCompleteScenarioAnswer, buildResearchQuizPayload } from "./payload";
import { RESEARCH_QUIZ_NOTE_MAX_LENGTH } from "../../config/researchQuiz";

const VALID_ANSWER = {
  interpretation: "stay",
  reason: "weather_similar",
  action: "stay_put",
  firstAction: "none",
  interpretationMs: 4000,
  note: null,
};

describe("isCompleteScenarioAnswer", () => {
  it("accepts a fully valid answer", () => {
    expect(isCompleteScenarioAnswer(VALID_ANSWER)).toBe(true);
  });

  it("rejects a missing/invalid interpretation, reason, or action", () => {
    expect(isCompleteScenarioAnswer({ ...VALID_ANSWER, interpretation: "definitely" })).toBe(false);
    expect(isCompleteScenarioAnswer({ ...VALID_ANSWER, reason: undefined })).toBe(false);
    expect(isCompleteScenarioAnswer({ ...VALID_ANSWER, action: "" })).toBe(false);
  });

  it("rejects a missing/negative interpretationMs", () => {
    expect(isCompleteScenarioAnswer({ ...VALID_ANSWER, interpretationMs: undefined })).toBe(false);
    expect(isCompleteScenarioAnswer({ ...VALID_ANSWER, interpretationMs: -1 })).toBe(false);
  });

  it("rejects an oversize note, accepts one at the boundary", () => {
    expect(isCompleteScenarioAnswer({ ...VALID_ANSWER, note: "x".repeat(RESEARCH_QUIZ_NOTE_MAX_LENGTH + 1) })).toBe(false);
    expect(isCompleteScenarioAnswer({ ...VALID_ANSWER, note: "x".repeat(RESEARCH_QUIZ_NOTE_MAX_LENGTH) })).toBe(true);
  });

  it("rejects null/undefined answers", () => {
    expect(isCompleteScenarioAnswer(null)).toBe(false);
    expect(isCompleteScenarioAnswer(undefined)).toBe(false);
  });
});

describe("buildResearchQuizPayload", () => {
  it("builds the wire payload in scenario_order and includes every required field", () => {
    const payload = buildResearchQuizPayload({
      sessionId: "s-1",
      testVersion: "1",
      fixtureVersion: "1",
      campaign: "camp",
      lang: "is",
      viewportCategory: "mobile",
      clientStartedAt: "2026-08-24T10:00:00.000Z",
      clientCompletedAt: "2026-08-24T10:05:00.000Z",
      scenarioOrder: ["move", "stay"],
      answersByScenarioId: {
        stay: { ...VALID_ANSWER, interpretation: "stay" },
        move: { ...VALID_ANSWER, interpretation: "move" },
      },
    });

    expect(payload.scenario_order).toEqual(["move", "stay"]);
    expect(payload.scenarios.map((s) => s.scenario_id)).toEqual(["move", "stay"]);
    expect(payload.scenarios[0].interpretation).toBe("move");
    expect(payload.session_id).toBe("s-1");
    expect(payload.viewport).toBe("mobile");
  });

  it("does not mutate the caller's scenarioOrder array", () => {
    const order = ["stay", "move"];
    buildResearchQuizPayload({
      sessionId: "s",
      testVersion: "1",
      fixtureVersion: "1",
      campaign: null,
      lang: "en",
      viewportCategory: "desktop",
      clientStartedAt: "a",
      clientCompletedAt: "b",
      scenarioOrder: order,
      answersByScenarioId: {
        stay: VALID_ANSWER,
        move: VALID_ANSWER,
      },
    });
    expect(order).toEqual(["stay", "move"]);
  });
});
