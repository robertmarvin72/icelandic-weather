// src/lib/weatherVoiceShareCatalogue.js
//
// Ticket 417 (#417) — the single, canonical list of every (language,
// comment) pair the static share export covers. Built directly from
// getWeatherVoiceLibrary() (src/lib/weatherVoiceContent.js, the same
// source the live app reads) and getTjaldurMoodAssetPath()
// (weatherVoicePresentation.js) — never a manually re-typed duplicate
// catalogue, so this can never silently drift from the real content/mood
// registry. Both the export script and any runtime consumer must build
// this list from here, not from their own copy.

import { getWeatherVoiceLibrary } from "./weatherVoiceContent";
import { getTjaldurMoodAssetPath } from "./weatherVoicePresentation";
import { buildWeatherVoiceSharePageUrl, buildWeatherVoiceShareImageUrl, buildWeatherVoiceShareOutputPaths } from "./weatherVoiceShareUrl";

export const WEATHER_VOICE_SHARE_LANGUAGES = Object.freeze(["is", "en"]);

/**
 * buildWeatherVoiceShareCatalogue() -> WeatherVoiceShareCatalogueEntry[]
 *
 * Pure. One entry per (language, comment id) pair in getWeatherVoiceLibrary()
 * whose voice level is sarcastic (#432). Retired and safety content is never
 * included. The count is not hardcoded; it reflects the active library
 * (every active primary ID in both languages).
 *
 * @returns {Array<{
 *   voiceId: string, language: string, text: string, mood: string,
 *   condition: string, moodAssetPath: string|null,
 *   pageUrl: string, imageUrl: string,
 *   htmlOutputPath: string, imageOutputPath: string,
 * }>}
 */
export function buildWeatherVoiceShareCatalogue() {
  const entries = [];
  for (const language of WEATHER_VOICE_SHARE_LANGUAGES) {
    const library = getWeatherVoiceLibrary(language) || [];
    for (const item of library) {
      if (item.voiceLevel !== "sarcastic") continue;
      const { htmlPath, imagePath } = buildWeatherVoiceShareOutputPaths(language, item.id);
      entries.push({
        voiceId: item.id,
        language,
        text: item.text,
        mood: item.mood,
        condition: item.condition,
        moodAssetPath: getTjaldurMoodAssetPath(item.mood),
        pageUrl: buildWeatherVoiceSharePageUrl(language, item.id),
        imageUrl: buildWeatherVoiceShareImageUrl(language, item.id),
        htmlOutputPath: htmlPath,
        imageOutputPath: imagePath,
      });
    }
  }
  return entries;
}
