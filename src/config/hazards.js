// src/config/hazards.js
// CampCast Hazards — V1 (Iceland baseline)

export const HAZARDS_V1 = {
  windWarn: 14,
  windHigh: 18,

  gustWarn: 20,
  gustHigh: 24,

  rainWarn: 12,
  rainHigh: 20,

  // Cold warnings intentionally handled where tmin exists (ForecastTable).
  tempLowWarn: -8,
  tempLowHigh: -15,

  tempHighWarn: 24,
  tempHighHigh: 28,
};

export function getHazardsConfig(overrides) {
  return { ...HAZARDS_V1, ...(overrides || {}) };
}
