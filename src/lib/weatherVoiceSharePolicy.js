// src/lib/weatherVoiceSharePolicy.js
//
// Ticket 410 (#410) Revision 2 — universal sharing for displayed Tjaldur
// (owner-authorized override). Ticket 432 (#432) supersedes that for
// cautious and serious content: only an affirmatively sarcastic,
// policy-consistent episode may be shared.
//
// A presentation or snapshot is shareable only when all of these hold:
//   - it is a genuine active result in a supported language (is/en),
//   - its voiceLevel is exactly "sarcastic", and
//   - its condition's policy voice level is also "sarcastic".
// A missing, unknown, non-string or mismatched tone is ineligible. This is
// an allowlist on purpose, not a denylist of serious/cautious values.
//
// This is still not a safety classifier. Universal sharing for sarcastic
// episodes does not authorize automated posting or editorial Facebook
// promotion; see docs/analytics/weather-voice-share-pilot.md.

import { voiceLevelForCondition } from "./weatherVoiceRules";

const SUPPORTED_LANGUAGES = new Set(["is", "en"]);

function toneRejection({ voiceLevel, condition }) {
  if (voiceLevel !== "sarcastic") return "tone_not_sarcastic";
  if (voiceLevelForCondition(condition) !== "sarcastic") return "tone_condition_mismatch";
  return null;
}

/**
 * evaluateWeatherVoiceShareEligibility({ presentation, lang })
 * -> { eligible: boolean, reason: string | null }
 *
 * Pure. Used by the snapshot builder, which is the first share entrypoint.
 *
 * @param {{ presentation: {show:boolean, condition?:string, voiceLevel?:string} | null | undefined, lang: string }} args
 * @returns {{ eligible: boolean, reason: string | null }}
 */
export function evaluateWeatherVoiceShareEligibility({ presentation, lang } = {}) {
  if (!presentation?.show) {
    return { eligible: false, reason: "not_active" };
  }
  if (!SUPPORTED_LANGUAGES.has(lang)) {
    return { eligible: false, reason: "unsupported_language" };
  }
  const reason = toneRejection(presentation);
  if (reason) return { eligible: false, reason };
  return { eligible: true, reason: null };
}

/**
 * evaluateWeatherVoiceToneEligibility({ voiceLevel, condition }) -> { eligible, reason }
 *
 * Tone only. Used by the Facebook resolver, which keeps its own language and
 * manifest checks (unsupported language -> unknown_entry).
 */
export function evaluateWeatherVoiceToneEligibility({ voiceLevel, condition } = {}) {
  const reason = toneRejection({ voiceLevel, condition });
  if (reason) return { eligible: false, reason };
  return { eligible: true, reason: null };
}

/**
 * evaluateWeatherVoiceSnapshotEligibility(snapshot) -> { eligible, reason }
 *
 * Re-checks a frozen snapshot at each later entrypoint (dialog, image
 * renderer), so a snapshot that was not built through the policy path is
 * still refused.
 */
export function evaluateWeatherVoiceSnapshotEligibility(snapshot) {
  if (!snapshot || typeof snapshot.voiceId !== "string" || snapshot.voiceId.length === 0) {
    return { eligible: false, reason: "missing_snapshot" };
  }
  if (!SUPPORTED_LANGUAGES.has(snapshot.language)) {
    return { eligible: false, reason: "unsupported_language" };
  }
  return evaluateWeatherVoiceToneEligibility(snapshot);
}
