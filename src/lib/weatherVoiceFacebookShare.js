// src/lib/weatherVoiceFacebookShare.js
//
// Ticket 417 (#417) — pure runtime resolver deciding whether Facebook
// sharing is available for the CURRENT frozen snapshot. Never selects a
// different quote and never infers mood from severity: the snapshot's own
// voiceId/language must have a generated manifest entry, AND that entry's
// text and mood must match the snapshot's own text/mood exactly. Any
// mismatch (missing id, wrong language, edited/drifted text or mood)
// yields `available:false` — the caller must show a localized
// Facebook-unavailable state and keep image sharing working, never
// substitute another quote's share link.

import { WEATHER_VOICE_SHARE_MANIFEST } from "./weatherVoiceShareManifest.generated";
import { buildFacebookSharerUrl } from "./weatherVoiceShareUrl";

function manifestKey(language, voiceId) {
  return `${language}|${voiceId}`;
}

/**
 * resolveWeatherVoiceFacebookShare(snapshot) -> {available:boolean, reason?:string, pageUrl?:string, facebookUrl?:string}
 *
 * @param {{voiceId?:string, language?:string, text?:string, mood?:string}} snapshot
 */
export function resolveWeatherVoiceFacebookShare(snapshot) {
  if (!snapshot || typeof snapshot.voiceId !== "string" || typeof snapshot.language !== "string") {
    return { available: false, reason: "missing_snapshot" };
  }

  const entry = WEATHER_VOICE_SHARE_MANIFEST[manifestKey(snapshot.language, snapshot.voiceId)];
  if (!entry) {
    return { available: false, reason: "unknown_entry" };
  }
  if (entry.text !== snapshot.text || entry.mood !== snapshot.mood) {
    return { available: false, reason: "mismatch" };
  }

  return {
    available: true,
    pageUrl: entry.pageUrl,
    facebookUrl: buildFacebookSharerUrl(entry.pageUrl),
  };
}
