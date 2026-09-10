// src/i18n/weatherVoice/is.js
//
// Weather Voice (#406) Phase 2 — canonical Icelandic MVP comment library.
// Structured content, deliberately separate from the flat UI-microcopy
// `translations.<domain>.js` convention (see src/lib/weatherVoiceContent.js
// for why: this is never imported/spread into src/i18n/translations.js and
// never resolved through useT()). Each entry is only `{ id, text }` — every
// other field (condition, mood, severityMin/Max, repeatCooldownDays,
// ctaType) lives once, in weatherVoiceContent.js's shared metadata
// registry, keyed by the same `id`, so per-language authoring can never
// silently drift the metadata between languages.
//
// IDs are stable ASCII strings, never derived from array position,
// translated text, date, or randomness — see approved-prompt-v1.md for the
// full 27-entry table this file transcribes verbatim (Jonesy Round 2
// approved tone and exact copy; do not silently rewrite).
export const is = [
  { id: "wind_extreme_01", text: "Vindur: Já." },
  { id: "wind_extreme_02", text: "Ég tek þetta sem persónulega árás." },
  { id: "wind_extreme_03", text: "Nei." },
  { id: "wind_extreme_04", text: "Vindurinn hefur orðið." },
  { id: "wind_extreme_05", text: "Þetta var ekki í bæklingnum." },
  { id: "wind_strong_01", text: "Lognið á frí." },
  { id: "wind_strong_02", text: "Hárið hefur gefist upp." },
  { id: "wind_strong_03", text: "Það blæs ekki af þessu." },
  { id: "rain_heavy_01", text: "Bíllinn fær allavega þvott." },
  { id: "rain_heavy_02", text: "Þurrt er afstætt hugtak." },
  { id: "rain_heavy_03", text: "Þetta er fullmikill áhugi á vatni." },
  { id: "cold_wet_01", text: "Ullin fær að vinna fyrir kaupinu." },
  { id: "cold_wet_02", text: "Veðrið tók allan pakkann." },
  { id: "cold_wet_03", text: "Ekki alveg stuttbuxnaveður." },
  { id: "cold_01", text: "Lopapeysan hafði rétt fyrir sér." },
  { id: "cold_02", text: "Peysan fær framlengingu." },
  { id: "cold_03", text: "Kaffið kólnar af samúð." },
  { id: "rain_01", text: "Það fylgir vatn með." },
  { id: "rain_02", text: "Regnjakki með aðalhlutverk." },
  { id: "sun_wind_01", text: "Sólin mætir. Lognið ekki." },
  { id: "sun_wind_02", text: "Bjart yfir. Hárið á hlið." },
  { id: "excellent_01", text: "Þetta er grunsamlega gott." },
  { id: "excellent_02", text: "Ekki segja neinum." },
  { id: "excellent_03", text: "Nú vantar bara kaffið." },
  { id: "good_01", text: "Þetta má alveg." },
  { id: "good_02", text: "Jæja. Þetta er bara gott." },
  { id: "good_03", text: "Engin kvörtun að sinni." },
];
