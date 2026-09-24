// src/lib/weatherVoiceShareUrl.js
//
// Ticket 417 (#417) — pure URL builders for the static Weather Voice share
// pages/images and the Facebook sharer link. No fetch, no state — every
// value is derived directly from its inputs. Canonical/image URLs are
// always absolute HTTPS on the real production domain, never localhost,
// the current host, or a blob/data/session URL — this module is the single
// place that constructs them, so every caller (export script, runtime
// Facebook resolver, tests) gets byte-identical URLs.

export const WEATHER_VOICE_SHARE_ORIGIN = "https://eltumvedrid.is";
export const WEATHER_VOICE_SHARE_VERSION = "v1";
export const WEATHER_VOICE_SHARE_BASE_PATH = `/share/tjaldur/${WEATHER_VOICE_SHARE_VERSION}`;

const VOICE_ID_PATTERN = /^[A-Za-z0-9_]+$/;
const SUPPORTED_LANGUAGES = new Set(["is", "en"]);

function assertValid(language, voiceId) {
  if (!SUPPORTED_LANGUAGES.has(language)) {
    throw new Error(`weatherVoiceShareUrl: unsupported language ${JSON.stringify(language)}`);
  }
  if (typeof voiceId !== "string" || !VOICE_ID_PATTERN.test(voiceId)) {
    throw new Error(`weatherVoiceShareUrl: invalid voiceId ${JSON.stringify(voiceId)}`);
  }
}

/**
 * buildWeatherVoiceSharePageUrl(language, voiceId) -> absolute HTTPS URL of
 * the immutable static share HTML page for this exact comment/language.
 */
export function buildWeatherVoiceSharePageUrl(language, voiceId) {
  assertValid(language, voiceId);
  return `${WEATHER_VOICE_SHARE_ORIGIN}${WEATHER_VOICE_SHARE_BASE_PATH}/${language}/${voiceId}.html`;
}

/**
 * buildWeatherVoiceShareImageUrl(language, voiceId) -> absolute HTTPS URL of
 * the immutable static 1200x630 PNG for this exact comment/language.
 */
export function buildWeatherVoiceShareImageUrl(language, voiceId) {
  assertValid(language, voiceId);
  return `${WEATHER_VOICE_SHARE_ORIGIN}${WEATHER_VOICE_SHARE_BASE_PATH}/${language}/${voiceId}.png`;
}

/**
 * buildFacebookSharerUrl(pageUrl) -> the standard Facebook sharer.php link.
 * No PNG upload, no SDK, no app secret — just the documented URL-only
 * sharer endpoint, given the already-absolute page URL.
 */
export function buildFacebookSharerUrl(pageUrl) {
  if (typeof pageUrl !== "string" || !pageUrl.startsWith("https://")) {
    throw new Error(`weatherVoiceShareUrl: pageUrl must be an absolute https URL, got ${JSON.stringify(pageUrl)}`);
  }
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}

/**
 * buildWeatherVoiceShareRelativePaths(language, voiceId) -> the on-disk
 * output paths (relative to the repo root) the export script writes to,
 * under public/ so Vite/Vercel serve them as plain static files.
 */
export function buildWeatherVoiceShareOutputPaths(language, voiceId) {
  assertValid(language, voiceId);
  const dir = `public/share/tjaldur/${WEATHER_VOICE_SHARE_VERSION}/${language}`;
  return { htmlPath: `${dir}/${voiceId}.html`, imagePath: `${dir}/${voiceId}.png` };
}
