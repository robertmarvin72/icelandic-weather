// src/i18n/weatherVoice/supplement.js
//
// Weather Voice heavy-rain supplement (#420 approved prompt v3, Part B).
// An additive, secondary line shown beneath the unchanged cautious
// `safety_heavy_rain` message. It is not a primary library entry: it is not
// in is.js/en.js, KNOWN_IDS, the share catalogue or the manifest, and it is
// never shareable. Owner-authorised exception to the cautious-tone rules for
// these three lines only (see docs/weather-voice/character-and-voice-bible.md §14).
//
// Removing every row here is the warning-only rollback path: the card then
// shows only the safety message, with no crash.
export const weatherVoiceSupplements = [
  {
    id: "rain_heavy_24",
    condition: "heavy_rain",
    repeatCooldownDays: 7,
    text_is: "Er ekki kominn tími á örkina?",
    text_en: "Is it time for the ark yet?",
  },
  {
    id: "rain_heavy_25",
    condition: "heavy_rain",
    repeatCooldownDays: 7,
    text_is: "Örkin hlýtur að vera í smíðum.",
    text_en: "The ark must be under construction.",
  },
  {
    id: "rain_heavy_29",
    condition: "heavy_rain",
    repeatCooldownDays: 7,
    text_is: "Hvar er Nói þegar maður þarf á honum að halda?",
    text_en: "Where's Noah when you need him?",
  },
];
