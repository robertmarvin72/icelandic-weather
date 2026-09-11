// src/lib/weatherVoicePresentation.js
//
// Ticket 408 (#408) — pure presentation helpers for the Weather Voice UI
// layer: mood -> actual PNG asset path, and CTA metadata -> an
// already-resolved {label, onClick} the renderer can show. Neither
// function interprets weather, calls the Phase 1/2 engine/selector, or
// touches storage/analytics — see src/components/WeatherVoice.jsx (the
// renderer) and src/hooks/useWeatherVoice.js (the data/lifecycle layer).

// Explicit map, never an inferred/derived path — "Never infer mood from
// severity/condition in UI" (approved prompt §3). The owner's actual
// canonical assets are these twelve PNGs (confirmed present in
// public/tjaldur/ during the pre-edit audit); the parent issue's SVG
// references are stale and are not used.
const TJALDUR_MOOD_ASSET_PATHS = Object.freeze({
  happy: "/tjaldur/happy.png",
  excellent: "/tjaldur/excellent.png",
  neutral: "/tjaldur/neutral.png",
  suspicious: "/tjaldur/suspicious.png",
  nervous: "/tjaldur/nervous.png",
  struggling: "/tjaldur/struggling.png",
  sad: "/tjaldur/sad.png",
  freezing: "/tjaldur/freezing.png",
  unimpressed: "/tjaldur/unimpressed.png",
  wrecked: "/tjaldur/wrecked.png",
  amazed: "/tjaldur/amazed.png",
  sleeping: "/tjaldur/sleeping.png",
});

/**
 * getTjaldurMoodAssetPath(mood) -> string | null
 * `null` for any unknown/unsupported/missing mood — the renderer must show
 * nothing rather than a guessed mascot for that case.
 * @param {string} mood
 * @returns {string | null}
 */
export function getTjaldurMoodAssetPath(mood) {
  return TJALDUR_MOOD_ASSET_PATHS[mood] ?? null;
}

// Production MVP content (src/lib/weatherVoiceContent.js) never sets a
// non-null ctaType — this map exists so the OPTIONAL capability #408
// requires is genuinely implemented and testable, without editing #406's
// metadata to manufacture a live CTA. All five map to the same kind of
// underlying action in this codebase today (the existing homepage
// comparison/navigation callback) — only the WORDING differs, describing
// exploration, never promising a specific better site exists.
const CTA_LABEL_KEYS = Object.freeze({
  better_location: "weatherVoiceCtaBetterLocation",
  calmer_location: "weatherVoiceCtaCalmerLocation",
  drier_location: "weatherVoiceCtaDrierLocation",
  warmer_location: "weatherVoiceCtaWarmerLocation",
  best_locations: "weatherVoiceCtaBestLocations",
});

/**
 * resolveWeatherVoiceCta({ ctaType, t, onExplore }) -> { label, onClick } | null
 *
 * Pure. Renders a CTA only when BOTH the ctaType is a known/mapped value
 * AND the caller has supplied a usable action (`onExplore`, a function) —
 * an unavailable action or an unknown ctaType yields `null` (no button),
 * never a guessed destination or an empty container. Labels are new/
 * existing flat EN/IS translation keys resolved through the caller's own
 * `t`, never text baked into the structured comment library.
 *
 * @param {{ ctaType: string|null|undefined, t: Function, onExplore: Function|undefined }} args
 * @returns {{ label: string, onClick: Function } | null}
 */
export function resolveWeatherVoiceCta({ ctaType, t, onExplore }) {
  if (!ctaType) return null;
  const labelKey = CTA_LABEL_KEYS[ctaType];
  if (!labelKey) return null; // unknown CTA type -> no button
  if (typeof onExplore !== "function") return null; // no usable context action -> no button
  if (typeof t !== "function") return null;

  return { label: t(labelKey), onClick: onExplore };
}
