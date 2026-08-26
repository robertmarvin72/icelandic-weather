// src/config/researchQuiz.js
//
// Config/lifecycle switch for the #395 decision-comprehension research quiz
// (unlisted route, see src/pages/DecisionQuizResearch.jsx). Fails closed:
// any missing/invalid/disabled configuration means the quiz cannot render
// its consent gate or submit — never a silent partial state.
//
// Read via import.meta.env (Vite convention, same as src/lib/analytics.js's
// VITE_GA_MEASUREMENT_ID). All three env vars are optional in the sense that
// their ABSENCE is a valid, safe "disabled" state, not a crash.

// Bumped whenever the frozen scenario fixtures (src/lib/researchQuiz/scenarios.js)
// or the answer-enum sets change in a way that would make old and new rows
// incomparable. Sent with every submission so Sheet rows are reproducible
// from fixture/build metadata (approved prompt: "Result payload and Sheet schema").
export const RESEARCH_QUIZ_TEST_VERSION = "1";
export const RESEARCH_QUIZ_FIXTURE_VERSION = "1";

// Apps Script imposes a bounded free-text note length; kept in sync with the
// adapter's own limit (see google-apps-script/decision-quiz/core.js
// MAX_NOTE_LENGTH) — this is the client-side mirror for input UX only, the
// server is the actual authority.
export const RESEARCH_QUIZ_NOTE_MAX_LENGTH = 280;

export const RESEARCH_QUIZ_SUBMIT_TIMEOUT_MS = 10000;

/**
 * Reads and validates the quiz's runtime configuration. Returns
 * { enabled: false } for anything missing/invalid — callers must render a
 * neutral "not available" state and must not attempt to submit.
 */
export function getResearchQuizConfig() {
  const enabledRaw = import.meta.env.VITE_RESEARCH_QUIZ_ENABLED;
  const webAppUrl = import.meta.env.VITE_RESEARCH_QUIZ_WEBAPP_URL;
  const campaign = import.meta.env.VITE_RESEARCH_QUIZ_CAMPAIGN || null;

  const enabled = enabledRaw === "true" || enabledRaw === "1";
  const hasValidUrl = typeof webAppUrl === "string" && /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(webAppUrl);

  if (!enabled || !hasValidUrl) {
    return { enabled: false, webAppUrl: null, campaign: null };
  }

  return { enabled: true, webAppUrl, campaign };
}
