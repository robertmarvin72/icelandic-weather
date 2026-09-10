// src/lib/weatherVoiceRules.js
//
// Weather Voice (#405) Phase 1 — deterministic condition thresholds and
// family-evidence predicates, with their policy provenance documented
// beside each one, per the approved prompt. These are Weather Voice's own
// reviewed expressive-voice policy choices, not a claim that a universal
// canonical classifier already exists elsewhere — see cc-report.md for the
// full audit these are grounded in. weatherVoiceEngine.js consumes these
// to produce a single ordered result; nothing here calls scoring, copies a
// seasonal scoring table, or is exported as shared weather classification.

import { WEATHER_FAMILIES, getWeatherCodeFamily } from "./weatherPresentation";
import { HAZARDS_V1 } from "../config/hazards";

// ── Wind thresholds (m/s) ---------------------------------------------------
//
// 5 / 10 / 15 reuse src/lib/scoring.js's WINTER windPenaltyPoints bands
// (<=5 -> 0, <=10 -> 2, <=15 -> 5, else 10) exactly, confirmed against live
// source during the pre-edit audit. This is a deliberate choice to reuse
// today's winter voice bands as season-independent expressive thresholds —
// NOT the summer bands (7/10/13/16), NOT a new scoring system, and NOT the
// hazard wind thresholds (HAZARDS_V1.windWarn=14/windHigh=18).
export const WIND_SUN_MS = 5; // sun_wind / good / excellent "calm" boundary
export const WIND_STRONG_MS = 10; // strong_wind: windMax > 10
export const WIND_EXTREME_MS = 15; // extreme_wind: windMax > 15

// ── Temperature thresholds (°C) ---------------------------------------------
//
// <6 / >=12 / >14 reuse scoring.js's winter basePointsFromTemp band edges
// (t>14->10, t>=12->8, ... , t>=6->2, else 0) exactly. Same rationale as
// wind above: an intentional reuse of the ticket's explicit voice bands,
// not a claim that these are universal current scoring (summer's bands are
// 15/12/9/7/5/3/0, genuinely different).
export const TEMP_COLD_MAX_C = 6; // cold / cold_wet: tmax < 6
export const TEMP_GOOD_MIN_C = 12; // good: tmax >= 12
export const TEMP_EXCELLENT_MIN_C = 14; // excellent: tmax > 14

// ── Precipitation thresholds (mm, normalized daily amount) ------------------
//
// 1mm follows scoring.js's own negligible-precipitation boundary
// (rainPenaltyPoints' `<1 -> 0` tier and getPrecipTimingMultiplier's
// `<1 -> 0` cutoff) — the dry/rain line, not a new invention.
export const RAIN_NEGLIGIBLE_MM = 1;

// Heavy rain reuses the EXISTING hazard warning amount (imported directly
// from src/config/hazards.js, never copied/hardcoded) rather than
// scoring.js's 4mm rain-penalty ceiling or WMO code intensity alone. This
// is Weather Voice's own policy decision to align "heavy" with the hazard
// system's own "meaningful rain" amount; it is applied here only to the
// normalized daily `rain` amount and does not replace or call hazard
// evaluation itself. A single brief heavy-intensity WMO observation is
// never, on its own, treated as an all-day heavy-rain assessment — amount
// evidence (this threshold) is required in addition to family evidence.
export const RAIN_HEAVY_MM = HAZARDS_V1.rainWarn;

// ── Weather-code family evidence ---------------------------------------------
//
// Reuses the canonical family table (weatherPresentation.js) — no WMO code
// list is duplicated here.

// Liquid-family evidence for rain / cold_wet / heavy_rain: RAIN or DRIZZLE
// only. Snow, freezing precipitation, thunder/hail, and fog can never
// count as liquid, however warm or however much accumulated amount is
// reported — a snow day's precipitation amount must never trigger a rain
// condition.
const LIQUID_FAMILIES = new Set([WEATHER_FAMILIES.RAIN, WEATHER_FAMILIES.DRIZZLE]);

// Dry-family evidence for `good`: CLEAR, PARTLY_CLOUDY, or OVERCAST.
// Fog and every precipitation family are excluded even though overcast
// might otherwise look comparably mild — this is the approved table's
// explicit choice, not an oversight.
const DRY_FAMILIES = new Set([WEATHER_FAMILIES.CLEAR, WEATHER_FAMILIES.PARTLY_CLOUDY, WEATHER_FAMILIES.OVERCAST]);

export function hasLiquidEvidence(code) {
  return LIQUID_FAMILIES.has(getWeatherCodeFamily(code));
}

export function hasDryEvidence(code) {
  return DRY_FAMILIES.has(getWeatherCodeFamily(code));
}

// `excellent` and `sun_wind` require CLEAR specifically (codes 0/1), not
// merely dry-family membership — code 2 (partly cloudy) can only ever
// reach `good`, never `excellent`/`sun_wind`. No arbitrary `sunny` boolean
// is introduced; this reuses the canonical CLEAR family directly.
export function isClearFamily(code) {
  return getWeatherCodeFamily(code) === WEATHER_FAMILIES.CLEAR;
}
