// src/lib/weatherVoiceSharePolicy.js
//
// Ticket 410 (#410) Revision 2 — "Every displayed Tjaldur is shareable"
// (owner-authorized universal sharing override, approved-prompt-v2.md §1,
// Jonesy Round 2 APPROVED). REDUCED from Revision 1: the condition
// allowlist (`WEATHER_VOICE_SHARE_ELIGIBLE_CONDITIONS = {good, excellent}`)
// and the hazard-veto seam (`getWeatherVoiceHazardSignal`) are both
// REMOVED — not merely disabled. Both were confirmed dead: the hazard
// signal never had a real source to plug into (no per-site/day hazard
// result exists anywhere in the Weather Voice data path — see Ticket 410
// Revision 1's own audit, unchanged), and the condition allowlist is the
// exact thing the owner explicitly overrode. Keeping either as inert code
// would be "dead policy that could suppress the entrypoint" — the
// approved prompt explicitly says to remove that, not leave it disabled.
//
// What remains is STRUCTURAL VALIDITY only: a presentation must be a
// genuine show:true result in a supported language (is/en). This is not,
// and never was, a safety classifier — removing the condition allowlist
// does not resolve #413's safety gap. It means the in-app secondary share
// entrypoint no longer distinguishes by weather condition/severity/mood,
// which is now the owner's explicit, safety-guarded product decision
// (serious messages still use the same neutral action, exporting the
// actual displayed text faithfully, with no celebratory encouragement or
// minimization added anywhere in the image/dialog copy) — not a
// determination CC is making about what is safe to promote.
//
// Universal in-app user sharing does NOT authorize automated posting or
// editorial Facebook promotion during hazardous conditions — see
// docs/analytics/weather-voice-share-pilot.md, which keeps the manual
// Facebook pilot itself conservative and separately reviewed.

/**
 * evaluateWeatherVoiceShareEligibility({ presentation, lang })
 * -> { eligible: boolean, reason: string | null }
 *
 * Pure. The ONLY two rejection reasons remaining: the presentation isn't
 * a genuine active result, or the language isn't one of the two Weather
 * Voice actually supports. No condition, mood, or severity check exists
 * here anymore — every real, active, supported-language episode is
 * eligible.
 *
 * @param {{ presentation: {show:boolean} | null | undefined, lang: string }} args
 * @returns {{ eligible: boolean, reason: string | null }}
 */
export function evaluateWeatherVoiceShareEligibility({ presentation, lang } = {}) {
  if (!presentation?.show) {
    return { eligible: false, reason: "not_active" };
  }
  if (lang !== "is" && lang !== "en") {
    return { eligible: false, reason: "unsupported_language" };
  }
  return { eligible: true, reason: null };
}
