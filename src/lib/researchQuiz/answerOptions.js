// src/lib/researchQuiz/answerOptions.js
//
// Versioned fixed answer choices (approved prompt: "one main reason from
// versioned fixed choices plus unsure", "intended next action from versioned
// fixed choices"). Bumping RESEARCH_QUIZ_TEST_VERSION is required if these
// enums ever change, so old and new rows are never silently mixed.
//
// `first_action` values describe WHICH part of the real HomeDecisionCard the
// participant interacted with first — captured (via intercepted onUpgrade/
// onCtaClick props), not chosen from a picklist. "none" means the
// participant answered without clicking either CTA.

export const INTERPRETATION_OPTIONS = ["stay", "move", "consider", "unsure"];

export const REASON_OPTIONS = [
  "weather_better_elsewhere",
  "weather_similar",
  "weather_worse_elsewhere",
  "not_sure_why",
  "other",
];

export const ACTION_OPTIONS = ["stay_put", "relocate_now", "keep_monitoring", "not_sure", "other"];

export const FIRST_ACTION_OPTIONS = ["primary_cta", "secondary_link", "none"];

export function isValidInterpretation(value) {
  return INTERPRETATION_OPTIONS.includes(value);
}

export function isValidReason(value) {
  return REASON_OPTIONS.includes(value);
}

export function isValidAction(value) {
  return ACTION_OPTIONS.includes(value);
}

export function isValidFirstAction(value) {
  return value == null || FIRST_ACTION_OPTIONS.includes(value);
}
