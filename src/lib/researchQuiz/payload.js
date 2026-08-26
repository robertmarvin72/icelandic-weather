// src/lib/researchQuiz/payload.js
//
// Builds and validates the bounded quiz-result payload sent to Apps Script.
// This is the CLIENT-side mirror of validation — the Apps Script core
// (google-apps-script/decision-quiz/core.js) is the actual authority and
// re-validates everything independently; this module only prevents an
// obviously-incomplete submission from being attempted at all.

import { RESEARCH_QUIZ_NOTE_MAX_LENGTH } from "../../config/researchQuiz.js";
import { isValidInterpretation, isValidReason, isValidAction, isValidFirstAction } from "./answerOptions.js";

export function isCompleteScenarioAnswer(answer) {
  if (!answer) return false;
  return (
    isValidInterpretation(answer.interpretation) &&
    isValidReason(answer.reason) &&
    isValidAction(answer.action) &&
    isValidFirstAction(answer.firstAction ?? null) &&
    Number.isFinite(answer.interpretationMs) &&
    answer.interpretationMs >= 0 &&
    (answer.note == null || (typeof answer.note === "string" && answer.note.length <= RESEARCH_QUIZ_NOTE_MAX_LENGTH))
  );
}

/**
 * Builds the exact wire payload. Callers must have already confirmed every
 * scenario answer is complete (isCompleteScenarioAnswer) — this function
 * does not silently drop or default missing fields.
 */
export function buildResearchQuizPayload({
  sessionId,
  testVersion,
  fixtureVersion,
  campaign,
  lang,
  viewportCategory,
  clientStartedAt,
  clientCompletedAt,
  scenarioOrder,
  answersByScenarioId,
}) {
  return {
    session_id: sessionId,
    test_version: testVersion,
    fixture_version: fixtureVersion,
    campaign: campaign || null,
    lang,
    viewport: viewportCategory,
    client_started_at: clientStartedAt,
    client_completed_at: clientCompletedAt,
    scenario_order: [...scenarioOrder],
    scenarios: scenarioOrder.map((scenarioId) => {
      const a = answersByScenarioId[scenarioId];
      return {
        scenario_id: scenarioId,
        interpretation: a.interpretation,
        reason: a.reason,
        action: a.action,
        first_action: a.firstAction ?? null,
        interpretation_ms: a.interpretationMs,
        note: a.note || null,
      };
    }),
  };
}
