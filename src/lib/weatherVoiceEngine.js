// src/lib/weatherVoiceEngine.js
//
// Weather Voice (#405) Phase 1 — deterministic rule engine. Pure function:
// no fetch, normalization, date/site selection, hourly aggregation, hook,
// or UI wiring (all of that is explicitly out of scope for this ticket —
// see the approved prompt's STOP conditions). Evaluates one normalized
// daily row's four-field subset against weatherVoiceRules.js's reviewed
// thresholds/predicates, in the fixed priority order below, and returns
// at most one match.
//
// This module never calls scoring.js, never mutates its input, and never
// shares mutable state between calls — see weatherVoiceEngine.test.js's
// "purity and determinism" coverage.

import { isSupportedWeatherCode } from "./weatherPresentation";
import {
  WIND_SUN_MS,
  WIND_STRONG_MS,
  WIND_EXTREME_MS,
  TEMP_COLD_MAX_C,
  TEMP_GOOD_MIN_C,
  TEMP_EXCELLENT_MIN_C,
  RAIN_NEGLIGIBLE_MM,
  RAIN_HEAVY_MM,
  hasLiquidEvidence,
  hasDryEvidence,
  isClearFamily,
} from "./weatherVoiceRules";

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

// Strict validation (approved prompt: "Missing/malformed input returns
// exactly { show: false }; no coercion of null, strings, booleans, NaN or
// Infinity to real conditions"). For MVP the whole four-field input is
// required even for rules that only read one or two fields (e.g.
// extreme_wind only needs windMax) — an incomplete row is conservatively
// silent rather than partially evaluated.
function isValidInput(input) {
  if (input == null || typeof input !== "object") return false;

  const { tmax, windMax, rain, code } = input;

  if (!isFiniteNumber(tmax)) return false;
  if (!isFiniteNumber(windMax) || windMax < 0) return false;
  if (!isFiniteNumber(rain) || rain < 0) return false;
  if (!isSupportedWeatherCode(code)) return false;

  return true;
}

function silent() {
  return Object.freeze({ show: false });
}

function active(condition, mood, severity) {
  return Object.freeze({ show: true, condition, mood, severity });
}

/**
 * evaluateWeatherVoice(input) -> WeatherVoiceResult
 *
 * Pure, presentation-adjacent (not presentation itself — no comment text,
 * translation, or asset rendering; see weatherVoiceTypes.js). Reads only
 * `tmax` (°C), `windMax` (m/s), `rain` (normalized daily mm), and `code`
 * (raw provider daily WMO code) from `input`; every other field is
 * ignored, including `points`/`season`/`tier`/`summaryCode`/
 * `summaryTextKey`. Comparisons use the unrounded input values — this
 * engine does not apply scoring's one-decimal quantization.
 *
 * Evaluated in exactly this priority order; returns the FIRST match only:
 *
 *   1. extreme_wind -> wrecked,      severity 3   windMax > 15
 *   2. heavy_rain   -> sad,          severity 2   liquid evidence, rain >= 12
 *   3. strong_wind  -> struggling,   severity 2   windMax > 10
 *   4. cold_wet     -> unimpressed,  severity 2   tmax < 6, liquid evidence, rain >= 1
 *   5. cold         -> freezing,     severity 1   tmax < 6
 *   6. rain         -> unimpressed,  severity 1   liquid evidence, rain >= 1
 *   7. sun_wind     -> suspicious,   severity 1   CLEAR family, windMax > 5, rain < 1
 *   8. excellent    -> excellent,    severity 0   CLEAR family, tmax > 14, windMax <= 5, rain < 1
 *   9. good         -> happy,        severity 0   dry-family evidence, tmax >= 12, windMax <= 5, rain < 1
 *
 * Otherwise returns exactly `{ show: false }` — ordinary weather (e.g.
 * 8°C / 4 m/s / overcast / dry) is silent by design, not an omission.
 *
 * @param {import("./weatherVoiceTypes").WeatherVoiceInput} input
 * @returns {import("./weatherVoiceTypes").WeatherVoiceResult}
 */
export function evaluateWeatherVoice(input) {
  if (!isValidInput(input)) return silent();

  const { tmax, windMax, rain, code } = input;
  const liquid = hasLiquidEvidence(code);
  const dry = hasDryEvidence(code);
  const clear = isClearFamily(code);

  if (windMax > WIND_EXTREME_MS) {
    return active("extreme_wind", "wrecked", 3);
  }

  if (liquid && rain >= RAIN_HEAVY_MM) {
    return active("heavy_rain", "sad", 2);
  }

  if (windMax > WIND_STRONG_MS) {
    return active("strong_wind", "struggling", 2);
  }

  if (tmax < TEMP_COLD_MAX_C && liquid && rain >= RAIN_NEGLIGIBLE_MM) {
    return active("cold_wet", "unimpressed", 2);
  }

  if (tmax < TEMP_COLD_MAX_C) {
    return active("cold", "freezing", 1);
  }

  if (liquid && rain >= RAIN_NEGLIGIBLE_MM) {
    return active("rain", "unimpressed", 1);
  }

  if (clear && windMax > WIND_SUN_MS && rain < RAIN_NEGLIGIBLE_MM) {
    return active("sun_wind", "suspicious", 1);
  }

  if (clear && tmax > TEMP_EXCELLENT_MIN_C && windMax <= WIND_SUN_MS && rain < RAIN_NEGLIGIBLE_MM) {
    return active("excellent", "excellent", 0);
  }

  if (dry && tmax >= TEMP_GOOD_MIN_C && windMax <= WIND_SUN_MS && rain < RAIN_NEGLIGIBLE_MM) {
    return active("good", "happy", 0);
  }

  return silent();
}
