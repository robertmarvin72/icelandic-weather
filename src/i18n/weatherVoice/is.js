// src/i18n/weatherVoice/is.js
//
// Weather Voice (#406) Phase 2 — canonical Icelandic comment library.
// Structured content, deliberately separate from the flat UI-microcopy
// `translations.<domain>.js` convention (see src/lib/weatherVoiceContent.js
// for why: this is never imported/spread into src/i18n/translations.js and
// never resolved through useT()). Each entry is only `{ id, text }` — every
// other field (condition, mood, voice level, severityMin/Max,
// repeatCooldownDays, ctaType) lives once, in weatherVoiceContent.js's
// shared metadata registry, keyed by the same `id`.
//
// #432: this list holds only the 13 sarcastic (joke) entries. The 14
// cautious/serious-condition jokes were retired and their IDs are reserved
// (see RETIRED_JOKE_IDS in weatherVoiceContent.js). Cautious and serious
// text lives in src/i18n/weatherVoice/safety.js and never in this file.
export const is = [
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
