// src/pages/DecisionQuizResearch.jsx
//
// Unlisted route (/research/decision-quiz) for the #395 decision-
// comprehension research quiz. Not linked from navigation, sitemap, or any
// normal product journey (see src/AppRoutes.jsx). Renders the REAL
// HomeDecisionCard with frozen fixtures — no live weather/scoring, no
// production analytics (disableAnalytics prop) — and submits results
// directly to an owner-controlled Google Apps Script web app.

import React, { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useT } from "../hooks/useT";
import HomeDecisionCard from "../components/HomeDecisionCard";
import { getResearchQuizConfig, RESEARCH_QUIZ_TEST_VERSION, RESEARCH_QUIZ_FIXTURE_VERSION, RESEARCH_QUIZ_NOTE_MAX_LENGTH } from "../config/researchQuiz";
import { RESEARCH_QUIZ_SCENARIOS } from "../lib/researchQuiz/scenarios";
import { INTERPRETATION_OPTIONS, REASON_OPTIONS, ACTION_OPTIONS } from "../lib/researchQuiz/answerOptions";
import { useResearchQuizFlow, STAGE } from "../hooks/useResearchQuizFlow";

function toPascalCase(snake) {
  return snake
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function interpolate(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

const EMPTY_DRAFT = { interpretation: "", reason: "", action: "", note: "" };

export default function DecisionQuizResearch() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const config = getResearchQuizConfig();

  const flow = useResearchQuizFlow({
    scenarios: RESEARCH_QUIZ_SCENARIOS,
    webAppUrl: config.webAppUrl,
    campaign: config.campaign,
    testVersion: RESEARCH_QUIZ_TEST_VERSION,
    fixtureVersion: RESEARCH_QUIZ_FIXTURE_VERSION,
    lang,
  });

  const [draft, setDraft] = useState(EMPTY_DRAFT);

  if (!config.enabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center" data-testid="quiz-unavailable">
        <h1 className="text-lg font-semibold">{t("quizUnavailableTitle")}</h1>
        <p className="mt-2 text-sm opacity-75">{t("quizUnavailableBody")}</p>
      </div>
    );
  }

  const canAnswer = draft.interpretation && draft.reason && draft.action;

  function handleAnswerSubmit(e) {
    e.preventDefault();
    if (!canAnswer) return;
    flow.answerScenario(draft);
    setDraft(EMPTY_DRAFT);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      {flow.stage === STAGE.CONSENT && (
        <div data-testid="quiz-consent">
          <h1 className="text-lg font-semibold">{t("quizConsentTitle")}</h1>
          <p className="mt-2 text-sm opacity-90">{t("quizConsentBody")}</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={flow.consent}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {t("quizConsentContinue")}
            </button>
          </div>
        </div>
      )}

      {flow.stage === STAGE.QUIZ && flow.currentScenario && (
        <div data-testid="quiz-scenario">
          <div className="mb-2 text-xs opacity-60">
            {interpolate(t("quizStepLabel"), { current: flow.currentIndex + 1, total: flow.totalScenarios })}
          </div>

          <HomeDecisionCard
            key={flow.currentScenario.id}
            t={t}
            lang={lang}
            disableAnalytics
            onUpgrade={() => flow.recordFirstAction("primary_cta")}
            onCtaClick={() => flow.recordFirstAction("secondary_link")}
            {...flow.currentScenario.cardProps}
          />

          <form onSubmit={handleAnswerSubmit} className="mt-4 space-y-4">
            <fieldset>
              <legend className="text-sm font-semibold">{t("quizQuestionInterpretation")}</legend>
              {INTERPRETATION_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="interpretation"
                    value={opt}
                    checked={draft.interpretation === opt}
                    onChange={() => setDraft((d) => ({ ...d, interpretation: opt }))}
                  />
                  {t(`quizInterpretation${toPascalCase(opt)}`)}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold">{t("quizQuestionReason")}</legend>
              {REASON_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reason"
                    value={opt}
                    checked={draft.reason === opt}
                    onChange={() => setDraft((d) => ({ ...d, reason: opt }))}
                  />
                  {t(`quizReason${toPascalCase(opt)}`)}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold">{t("quizQuestionAction")}</legend>
              {ACTION_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="action"
                    value={opt}
                    checked={draft.action === opt}
                    onChange={() => setDraft((d) => ({ ...d, action: opt }))}
                  />
                  {t(`quizAction${toPascalCase(opt)}`)}
                </label>
              ))}
            </fieldset>

            <label className="block text-sm">
              {t("quizQuestionNote")}
              <textarea
                value={draft.note}
                maxLength={RESEARCH_QUIZ_NOTE_MAX_LENGTH}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                rows={2}
              />
            </label>

            <button
              type="submit"
              disabled={!canAnswer}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {t("quizNext")}
            </button>
          </form>
        </div>
      )}

      {flow.stage === STAGE.READY && (
        <div data-testid="quiz-ready">
          <button
            type="button"
            onClick={flow.submit}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {t("quizSubmit")}
          </button>
        </div>
      )}

      {flow.stage === STAGE.SUBMITTING && <p data-testid="quiz-submitting">{t("quizSubmittingLabel")}</p>}

      {flow.stage === STAGE.CONFIRMED && (
        <div data-testid="quiz-confirmed">
          <h1 className="text-lg font-semibold">{t("quizConfirmedTitle")}</h1>
          <p className="mt-2 text-sm opacity-90">{t("quizConfirmedBody")}</p>
        </div>
      )}

      {flow.stage === STAGE.FAILED && (
        <div data-testid="quiz-failed">
          <h1 className="text-lg font-semibold">{t("quizFailedTitle")}</h1>
          <p className="mt-2 text-sm opacity-90">{t("quizFailedBody")}</p>
          <button type="button" onClick={flow.retry} className="mt-3 text-sm font-semibold underline">
            {t("quizRetry")}
          </button>
        </div>
      )}

      {flow.stage === STAGE.UNCONFIRMED && (
        <div data-testid="quiz-unconfirmed">
          <h1 className="text-lg font-semibold">{t("quizUnconfirmedTitle")}</h1>
          <p className="mt-2 text-sm opacity-90">{t("quizUnconfirmedBody")}</p>
          <button type="button" onClick={flow.retry} className="mt-3 text-sm font-semibold underline">
            {t("quizRetry")}
          </button>
        </div>
      )}
    </div>
  );
}
