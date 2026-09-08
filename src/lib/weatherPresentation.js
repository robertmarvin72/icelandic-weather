// src/lib/weatherPresentation.js
//
// Ticket 400 (#400) — single canonical WMO weather-code -> presentation
// table, shared by the daily forecast table and the hourly forecast modal
// so both surfaces describe the same code the same way. Before this ticket
// each surface had its own partial mapping (ForecastTable: WEATHER_MAP
// text + a separate WeatherIconMapping.ts icon lookup; HourlyForecastModal:
// WEATHER_MAP text + emoji) and neither one covered every WMO code Open-
// Meteo can return (56/57 freezing drizzle and 85/86 snow showers were
// missing from WEATHER_MAP, so they silently rendered as "unknown"/raw key
// text). This module is presentation-only: it never feeds scoring, hazards,
// or recommendation logic (see src/lib/dailyWeatherSummary.js for the
// pure daily-condition summarizer that produces the code passed in here).
//
// Family grouping doubles as the dominance/override vocabulary used by
// dailyWeatherSummary.js — exporting it from here (rather than duplicating
// it) keeps "which family is code X in" defined in exactly one place.

// Icon bases mirror src/utils/WeatherIconMapping.ts's existing code->icon
// assignments exactly, so no currently-supported code's rendered icon
// changes as a result of this consolidation. Only "clear" and
// "partly-cloudy" have day/night variants in WeatherIcon.tsx's icon set.
const ICON_BASE = {
  CLEAR: "clear",
  PARTLY_CLOUDY: "partly-cloudy",
  CLOUDY: "cloudy",
  FOG: "fog",
  RAIN: "rain",
  HEAVY_RAIN: "heavy-rain",
  SLEET: "sleet",
  SNOW: "snow",
  THUNDERSTORM: "thunderstorm",
  HAIL: "hail",
};

const DAY_NIGHT_ICON_BASES = new Set([ICON_BASE.CLEAR, ICON_BASE.PARTLY_CLOUDY]);

export const WEATHER_FAMILIES = {
  CLEAR: "clear",
  PARTLY_CLOUDY: "partlyCloudy",
  OVERCAST: "overcast",
  FOG: "fog",
  DRIZZLE: "drizzle",
  FREEZING_PRECIP: "freezingPrecip",
  RAIN: "rain",
  SNOW: "snow",
  THUNDER_HAIL: "thunderHail",
  UNKNOWN: "unknown",
};

// Every code array is written in ascending real-world intensity, grounded in
// Open-Meteo's own WMO code documentation (each family's codes are already
// numbered light-to-heavy/slight-to-violent within Open-Meteo's table,
// e.g. 61 "slight" < 63 "moderate" < 65 "heavy"). Used both to enumerate
// family membership and, by dailyWeatherSummary.js, to pick the
// highest-observed-intensity representative code within a winning family.
export const WEATHER_FAMILY_CODES = {
  [WEATHER_FAMILIES.CLEAR]: [0, 1],
  [WEATHER_FAMILIES.PARTLY_CLOUDY]: [2],
  [WEATHER_FAMILIES.OVERCAST]: [3],
  [WEATHER_FAMILIES.FOG]: [45, 48],
  [WEATHER_FAMILIES.DRIZZLE]: [51, 53, 55],
  [WEATHER_FAMILIES.FREEZING_PRECIP]: [56, 57, 66, 67],
  [WEATHER_FAMILIES.RAIN]: [61, 63, 65, 80, 81, 82],
  [WEATHER_FAMILIES.SNOW]: [71, 73, 75, 77, 85, 86],
  [WEATHER_FAMILIES.THUNDER_HAIL]: [95, 96, 99],
};

// { family, textKey, iconBase } per supported WMO code.
//
// 56/57 (freezing drizzle) reuse the existing freezingRain/heavyFreezingRain
// i18n keys — WEATHER_MAP previously had no entry for them at all, so they
// rendered as an unlabeled "unknown" key leak; freezing drizzle and freezing
// rain already share the same "sleet" icon in WeatherIconMapping.ts, so
// reusing the closest existing wording (rather than inventing new IS/EN
// copy) is the minimal fix. 85/86 (snow showers) similarly had no WEATHER_MAP
// entry and now reuse lightSnow/heavySnow. No new i18n strings were added
// for either — only the genuinely new "unknown code" case below needed one.
const WEATHER_CODE_TABLE = {
  0: { family: WEATHER_FAMILIES.CLEAR, textKey: "clearSky", iconBase: ICON_BASE.CLEAR },
  1: { family: WEATHER_FAMILIES.CLEAR, textKey: "mainlyClear", iconBase: ICON_BASE.PARTLY_CLOUDY },
  2: { family: WEATHER_FAMILIES.PARTLY_CLOUDY, textKey: "partlyCloudy", iconBase: ICON_BASE.PARTLY_CLOUDY },
  3: { family: WEATHER_FAMILIES.OVERCAST, textKey: "overcast", iconBase: ICON_BASE.CLOUDY },

  45: { family: WEATHER_FAMILIES.FOG, textKey: "fog", iconBase: ICON_BASE.FOG },
  48: { family: WEATHER_FAMILIES.FOG, textKey: "rimeFog", iconBase: ICON_BASE.FOG },

  51: { family: WEATHER_FAMILIES.DRIZZLE, textKey: "lightDrizzle", iconBase: ICON_BASE.RAIN },
  53: { family: WEATHER_FAMILIES.DRIZZLE, textKey: "drizzle", iconBase: ICON_BASE.RAIN },
  55: { family: WEATHER_FAMILIES.DRIZZLE, textKey: "heavyDrizzle", iconBase: ICON_BASE.RAIN },

  56: { family: WEATHER_FAMILIES.FREEZING_PRECIP, textKey: "freezingRain", iconBase: ICON_BASE.SLEET },
  57: { family: WEATHER_FAMILIES.FREEZING_PRECIP, textKey: "heavyFreezingRain", iconBase: ICON_BASE.SLEET },

  61: { family: WEATHER_FAMILIES.RAIN, textKey: "lightRain", iconBase: ICON_BASE.RAIN },
  63: { family: WEATHER_FAMILIES.RAIN, textKey: "rain", iconBase: ICON_BASE.RAIN },
  65: { family: WEATHER_FAMILIES.RAIN, textKey: "heavyRain", iconBase: ICON_BASE.HEAVY_RAIN },

  66: { family: WEATHER_FAMILIES.FREEZING_PRECIP, textKey: "freezingRain", iconBase: ICON_BASE.SLEET },
  67: { family: WEATHER_FAMILIES.FREEZING_PRECIP, textKey: "heavyFreezingRain", iconBase: ICON_BASE.SLEET },

  71: { family: WEATHER_FAMILIES.SNOW, textKey: "lightSnow", iconBase: ICON_BASE.SNOW },
  73: { family: WEATHER_FAMILIES.SNOW, textKey: "snow", iconBase: ICON_BASE.SNOW },
  75: { family: WEATHER_FAMILIES.SNOW, textKey: "heavySnow", iconBase: ICON_BASE.SNOW },
  77: { family: WEATHER_FAMILIES.SNOW, textKey: "snowGrains", iconBase: ICON_BASE.SNOW },

  80: { family: WEATHER_FAMILIES.RAIN, textKey: "showers", iconBase: ICON_BASE.RAIN },
  81: { family: WEATHER_FAMILIES.RAIN, textKey: "heavyShowers", iconBase: ICON_BASE.RAIN },
  82: { family: WEATHER_FAMILIES.RAIN, textKey: "violentShowers", iconBase: ICON_BASE.HEAVY_RAIN },

  85: { family: WEATHER_FAMILIES.SNOW, textKey: "lightSnow", iconBase: ICON_BASE.SNOW },
  86: { family: WEATHER_FAMILIES.SNOW, textKey: "heavySnow", iconBase: ICON_BASE.SNOW },

  95: { family: WEATHER_FAMILIES.THUNDER_HAIL, textKey: "thunderstorm", iconBase: ICON_BASE.THUNDERSTORM },
  96: { family: WEATHER_FAMILIES.THUNDER_HAIL, textKey: "thunderHail", iconBase: ICON_BASE.HAIL },
  99: { family: WEATHER_FAMILIES.THUNDER_HAIL, textKey: "severeThunderHail", iconBase: ICON_BASE.HAIL },
};

export function isSupportedWeatherCode(code) {
  return typeof code === "number" && Number.isFinite(code) && Object.prototype.hasOwnProperty.call(WEATHER_CODE_TABLE, code);
}

export function getWeatherCodeFamily(code) {
  if (!isSupportedWeatherCode(code)) return WEATHER_FAMILIES.UNKNOWN;
  return WEATHER_CODE_TABLE[code].family;
}

// The single canonical resolver. `code` may be null/undefined/NaN/an
// unsupported number — all resolve to the explicit neutral "unknown"
// presentation (isUnknown: true, iconBase: null), never to a real family's
// textKey/icon by numeric-coercion fallback. Callers must not render
// <WeatherIcon> when isUnknown is true (there is no truthful icon to show);
// use `t(textKey)` for both the accessible icon label and the visible text.
export function resolveWeatherPresentation(code, { isDay = true } = {}) {
  if (!isSupportedWeatherCode(code)) {
    return { family: WEATHER_FAMILIES.UNKNOWN, textKey: "unknownWeather", iconId: null, isUnknown: true };
  }

  const entry = WEATHER_CODE_TABLE[code];
  const iconId = DAY_NIGHT_ICON_BASES.has(entry.iconBase)
    ? `${entry.iconBase}-${isDay ? "day" : "night"}`
    : entry.iconBase;

  return { family: entry.family, textKey: entry.textKey, iconId, isUnknown: false };
}

// Small deterministic day/night rule for the hourly modal (no sunrise/
// sunset data is fetched for this ticket — see approved prompt §4).
export function isDaytimeHour(hour) {
  return typeof hour === "number" && Number.isFinite(hour) && hour >= 7 && hour < 21;
}
