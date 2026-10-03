// src/i18n/weatherVoice/safety.js
//
// Weather Voice (#432) — separate bilingual safety library for cautious and
// serious conditions. Deliberately NOT part of the joke library in is.js /
// en.js: nothing here is ever a punchline, and nothing in the joke library
// may be selected for a cautious or serious condition.
//
// These messages describe forecasts, not official warnings. They do not
// claim an official warning has been issued and do not certify that travel
// is safe. Selection lives in src/lib/weatherVoiceSafety.js.
export const weatherSafetyMessages = [
  {
    message_id: "safety_extreme_wind",
    condition: "extreme_wind",
    voice_level: "serious",
    text_is: "Mjög hvassviðri er í spánni. Aðstæður geta verið varasamar. Athugaðu opinberar veðurviðvaranir áður en þú leggur af stað.",
    text_en: "Very strong winds are forecast. Conditions may be hazardous. Check official weather warnings before setting out.",
  },
  {
    message_id: "safety_strong_wind",
    condition: "strong_wind",
    voice_level: "cautious",
    text_is: "Hvassviðri er í spánni. Skoðaðu aðstæður vel áður en þú ákveður næsta áfangastað.",
    text_en: "Strong winds are forecast. Check conditions carefully before choosing your next destination.",
  },
  {
    message_id: "safety_heavy_rain",
    condition: "heavy_rain",
    voice_level: "cautious",
    text_is: "Mikil rigning er í spánni. Það gæti þurft að endurskoða planið.",
    text_en: "Heavy rain is forecast. You may need to reconsider your plans.",
  },
  {
    message_id: "safety_cold_wet",
    condition: "cold_wet",
    voice_level: "cautious",
    text_is: "Kalt og blautt er í spánni. Taktu mið af því þegar þú skipuleggur daginn.",
    text_en: "Cold and wet conditions are forecast. Take this into account when planning your day.",
  },
];
