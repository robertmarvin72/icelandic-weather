// src/hooks/useResearchQuizFlow.js
//
// State machine for the #395 decision-comprehension research quiz. Kept
// separate from the page component so the flow logic (permutation
// stability, timing capture, incomplete-answer prevention, submit
// idle -> submitting -> confirmed/failed/unconfirmed) is independently
// testable without mounting the full HomeDecisionCard tree per case.

import { useMemo, useRef, useState, useCallback } from "react";
import { fisherYatesShuffle } from "../lib/researchQuiz/permutation";
import { createSessionId } from "../lib/researchQuiz/session";
import { monotonicNow, boundedDurationMs } from "../lib/researchQuiz/timing";
import { isCompleteScenarioAnswer, buildResearchQuizPayload } from "../lib/researchQuiz/payload";
import { submitResearchQuizPayload, SUBMIT_STATUS } from "../lib/researchQuiz/submit";
import { getCoarseViewportCategory } from "../lib/researchQuiz/viewport";

export const STAGE = {
  CONSENT: "consent",
  QUIZ: "quiz",
  READY: "ready",
  SUBMITTING: "submitting",
  CONFIRMED: "confirmed",
  FAILED: "failed",
  UNCONFIRMED: "unconfirmed",
};

export function useResearchQuizFlow({
  scenarios,
  webAppUrl,
  campaign,
  testVersion,
  fixtureVersion,
  lang,
  fetchImpl,
  randomFn,
  nowFn = monotonicNow,
  wallClockIso = () => new Date().toISOString(),
  getViewportCategory = getCoarseViewportCategory,
}) {
  const [stage, setStage] = useState(STAGE.CONSENT);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitOutcome, setSubmitOutcome] = useState(null);

  // Generated exactly once per mount (lazy initializer) and never
  // recomputed on rerender — stable across rerenders/retries.
  const [scenarioOrder] = useState(() => fisherYatesShuffle(scenarios.map((s) => s.id), randomFn));
  const sessionIdRef = useRef(null);
  if (sessionIdRef.current == null) sessionIdRef.current = createSessionId();

  const startedAtRef = useRef(null);
  const scenarioStartRef = useRef(null);
  const firstActionRef = useRef({});
  // Synchronous in-flight guard — React state updates from setStage() are
  // not visible until the next render, so a rapid double-click could
  // otherwise invoke submit() twice while both closures still see the
  // pre-click "ready" stage. A ref is checked/set synchronously, so the
  // second call is rejected immediately regardless of render timing.
  const submitInFlightRef = useRef(false);

  const scenariosById = useMemo(() => Object.fromEntries(scenarios.map((s) => [s.id, s])), [scenarios]);
  const currentScenarioId = scenarioOrder[currentIndex] ?? null;
  const currentScenario = currentScenarioId ? scenariosById[currentScenarioId] : null;

  const consent = useCallback(() => {
    startedAtRef.current = wallClockIso();
    scenarioStartRef.current = nowFn();
    setStage(STAGE.QUIZ);
  }, [nowFn, wallClockIso]);

  // Records the FIRST qualifying interaction only — later calls for the same
  // scenario are no-ops (approved prompt: "first interaction capture").
  const recordFirstAction = useCallback(
    (actionKey) => {
      if (!currentScenarioId) return;
      if (firstActionRef.current[currentScenarioId] != null) return;
      firstActionRef.current[currentScenarioId] = actionKey;
    },
    [currentScenarioId],
  );

  const answerScenario = useCallback(
    ({ interpretation, reason, action, note }) => {
      if (!currentScenarioId) return;
      const interpretationMs = boundedDurationMs(scenarioStartRef.current, nowFn());
      const answer = {
        interpretation,
        reason,
        action,
        note: note || null,
        firstAction: firstActionRef.current[currentScenarioId] ?? null,
        interpretationMs,
      };
      if (!isCompleteScenarioAnswer(answer)) return; // incomplete-answer prevention

      setAnswers((prev) => ({ ...prev, [currentScenarioId]: answer }));

      const nextIndex = currentIndex + 1;
      scenarioStartRef.current = nowFn();
      if (nextIndex >= scenarioOrder.length) {
        setStage(STAGE.READY);
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [currentScenarioId, currentIndex, nowFn, scenarioOrder.length],
  );

  const buildPayload = useCallback(() => {
    return buildResearchQuizPayload({
      sessionId: sessionIdRef.current,
      testVersion,
      fixtureVersion,
      campaign,
      lang,
      viewportCategory: getViewportCategory(),
      clientStartedAt: startedAtRef.current,
      clientCompletedAt: wallClockIso(),
      scenarioOrder,
      answersByScenarioId: answers,
    });
  }, [answers, campaign, fixtureVersion, getViewportCategory, lang, scenarioOrder, testVersion, wallClockIso]);

  const submit = useCallback(async () => {
    if (submitInFlightRef.current) return; // synchronous duplicate-click/submit-in-progress guard
    if (scenarioOrder.some((id) => !isCompleteScenarioAnswer(answers[id]))) return;

    submitInFlightRef.current = true;
    setStage(STAGE.SUBMITTING);
    try {
      const payload = buildPayload();
      // Byte-equivalent payload across retries: same sessionId, same
      // answers, only client_completed_at may differ — server idempotency
      // is keyed on (test_version, session_id), not on this timestamp.
      const result = await submitResearchQuizPayload({ webAppUrl, payload, fetchImpl });
      setSubmitOutcome(result);

      if (result.status === SUBMIT_STATUS.CONFIRMED) {
        setStage(STAGE.CONFIRMED);
      } else if (result.status === SUBMIT_STATUS.FAILED) {
        setStage(STAGE.FAILED);
      } else {
        setStage(STAGE.UNCONFIRMED);
      }
    } finally {
      submitInFlightRef.current = false;
    }
  }, [answers, buildPayload, fetchImpl, scenarioOrder, webAppUrl]);

  const retry = useCallback(() => {
    if (stage !== STAGE.FAILED && stage !== STAGE.UNCONFIRMED) return;
    setStage(STAGE.READY);
  }, [stage]);

  return {
    stage,
    scenarioOrder,
    currentIndex,
    currentScenario,
    totalScenarios: scenarioOrder.length,
    sessionId: sessionIdRef.current,
    answers,
    submitOutcome,
    consent,
    recordFirstAction,
    answerScenario,
    submit,
    retry,
  };
}
