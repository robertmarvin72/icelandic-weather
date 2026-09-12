// src/i18n/weatherVoice/en.js
//
// Weather Voice (#406) Phase 2, filled in by Ticket 412 (#412) — English
// comment library. Natural adaptations of is.js's 27 entries, not literal
// word-for-word translations (docs/weather-voice/character-and-voice-bible.md
// §8: "English is natural adaptation, not obligatory literal translation").
// Same 27 IDs as is.js, same order, same dry/terse/weather-directed voice —
// no new IDs, no joke-concept changes, no intensifying or softening of the
// source's caution level (Bible §3/§5; approved prompt's #413 safety
// boundary). Metadata (condition/mood/severity/cooldown/CTA) is shared
// with is.js via weatherVoiceContent.js's single registry, keyed by the
// same id — never duplicated or re-specified per language here.
//
// getWeatherVoiceLibrary("en") now resolves to this genuinely complete,
// supported library (see weatherVoiceContent.test.js's
// validateWeatherVoiceLanguageCompleteness coverage) — no longer the
// deliberately-empty MVP placeholder this file started as.
export const en = [
  { id: "wind_extreme_01", text: "Wind: Yes." },
  { id: "wind_extreme_02", text: "I take this as a personal attack." },
  { id: "wind_extreme_03", text: "No." },
  { id: "wind_extreme_04", text: "The wind has become a whole thing." },
  { id: "wind_extreme_05", text: "This wasn't in the brochure." },
  { id: "wind_strong_01", text: "Calm is on vacation." },
  { id: "wind_strong_02", text: "The hair has given up." },
  { id: "wind_strong_03", text: "This isn't blowing over." },
  { id: "rain_heavy_01", text: "At least the car gets a wash." },
  { id: "rain_heavy_02", text: "Dry is a relative concept." },
  { id: "rain_heavy_03", text: "This is an excessive interest in water." },
  { id: "cold_wet_01", text: "The wool earns its keep." },
  { id: "cold_wet_02", text: "The weather took the whole package." },
  { id: "cold_wet_03", text: "Not quite shorts weather." },
  { id: "cold_01", text: "The sweater was right." },
  { id: "cold_02", text: "The sweater gets an extension." },
  { id: "cold_03", text: "The coffee cools out of sympathy." },
  { id: "rain_01", text: "Comes with water." },
  { id: "rain_02", text: "Rain jacket, starring role." },
  { id: "sun_wind_01", text: "The sun showed up. The calm didn't." },
  { id: "sun_wind_02", text: "Bright skies. Hair sideways." },
  { id: "excellent_01", text: "This is suspiciously good." },
  { id: "excellent_02", text: "Don't tell anyone." },
  { id: "excellent_03", text: "All that's missing is the coffee." },
  { id: "good_01", text: "This'll do." },
  { id: "good_02", text: "Well. This is just good." },
  { id: "good_03", text: "No complaints for now." },
];
