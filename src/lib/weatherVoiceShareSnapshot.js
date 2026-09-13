// src/lib/weatherVoiceShareSnapshot.js
//
// Ticket 410 (#410) — pure share-context adapter. Freezes exactly the
// already-displayed episode's own data into a small, stable snapshot the
// share image renderer and dialog can use without ever re-deriving,
// re-fetching, or drifting from what the user actually saw. Never fetches
// independent weather, never selects a new comment, and never combines an
// old comment's text with a newly-selected site/day's forecast — every
// field here comes from the SAME `presentation`/`todayRow`/`site` triple
// the card itself is rendering at the moment this is built.
//
// `tmax`/`code` are the same DAILY, provenance-checked values
// useWeatherVoice.js already reads from the normalized row — never an
// hourly/live reading. Rendering code (weatherVoiceShareImage.js) is
// responsible for labeling these as daily context, never as "now."
//
// Revision 2 (#410, owner-authorized universal sharing) — this adapter no
// longer applies any condition/severity-based eligibility narrowing; see
// weatherVoiceSharePolicy.js's own header for what was removed and why.
// Every genuinely active, supported-language, structurally-valid episode
// now produces a snapshot, including extreme_wind/heavy_rain/etc.

import { evaluateWeatherVoiceShareEligibility } from "./weatherVoiceSharePolicy";

/**
 * buildWeatherVoiceShareSnapshot({ presentation, lang, site, todayRow, todayDate, episodeKey })
 * -> WeatherVoiceShareSnapshot | null
 *
 * Pure. Returns `null` whenever the episode isn't structurally valid (not
 * active, unsupported language — see weatherVoiceSharePolicy.js) or the
 * underlying daily row is missing/malformed — a snapshot is only ever
 * built from genuinely valid, already-displayed data.
 *
 * @param {{
 *   presentation: {show:boolean, condition?:string, mood?:string, severity?:number, comment?:{id:string,text:string}} | null | undefined,
 *   lang: string,
 *   site: {name?: string} | null | undefined,
 *   todayRow: {tmax?: number, code?: number} | null | undefined,
 *   todayDate: string | null | undefined,
 *   episodeKey: string | null | undefined,
 * }} args
 * @returns {{
 *   voiceId: string, text: string, language: string, mood: string,
 *   condition: string, severity: number, siteName: string | null,
 *   date: string, tmax: number, code: number, episodeKey: string,
 * } | null}
 */
export function buildWeatherVoiceShareSnapshot({ presentation, lang, site, todayRow, todayDate, episodeKey } = {}) {
  const eligibility = evaluateWeatherVoiceShareEligibility({ presentation, lang });
  if (!eligibility.eligible) return null;

  if (
    !todayRow ||
    typeof todayRow.tmax !== "number" ||
    !Number.isFinite(todayRow.tmax) ||
    typeof todayRow.code !== "number" ||
    !Number.isFinite(todayRow.code) ||
    typeof todayDate !== "string" ||
    todayDate.length === 0 ||
    !episodeKey ||
    typeof presentation.comment?.id !== "string" ||
    typeof presentation.comment?.text !== "string"
  ) {
    return null;
  }

  return Object.freeze({
    voiceId: presentation.comment.id,
    text: presentation.comment.text,
    language: lang,
    mood: presentation.mood,
    condition: presentation.condition,
    severity: presentation.severity,
    // Only ever the fixed-list campsite's own display name — never a
    // freeform/user-entered or inferred location label. Verified in the
    // #410 audit: today's site model has no "private site" concept (tier
    // gates which LIST is available, not whether a name is public), so
    // this is effectively always non-null for a real selected site; still
    // guarded here rather than assumed.
    siteName: typeof site?.name === "string" && site.name.length > 0 ? site.name : null,
    date: todayDate,
    tmax: todayRow.tmax,
    code: todayRow.code,
    // Internal only — episodeKey identifies which episode this snapshot
    // belongs to (for invalidation matching) and must never be rendered
    // into the image or sent to analytics.
    episodeKey,
  });
}
