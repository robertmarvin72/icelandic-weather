// Ticket 405 (#405) — weatherVoiceRules.js's thresholds and family-evidence
// predicates, tested in isolation from engine priority/ordering (that's
// weatherVoiceEngine.test.js's job).
import { describe, it, expect } from "vitest";
import { HAZARDS_V1 } from "../config/hazards";
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

describe("weatherVoiceRules — documented threshold provenance", () => {
  it("wind thresholds match scoring.js's winter windPenaltyPoints bands exactly (5/10/15)", () => {
    expect(WIND_SUN_MS).toBe(5);
    expect(WIND_STRONG_MS).toBe(10);
    expect(WIND_EXTREME_MS).toBe(15);
  });

  it("temperature thresholds match scoring.js's winter basePointsFromTemp bands exactly (6/12/14)", () => {
    expect(TEMP_COLD_MAX_C).toBe(6);
    expect(TEMP_GOOD_MIN_C).toBe(12);
    expect(TEMP_EXCELLENT_MIN_C).toBe(14);
  });

  it("the dry/rain boundary matches scoring.js's negligible-precipitation boundary (1mm)", () => {
    expect(RAIN_NEGLIGIBLE_MM).toBe(1);
  });

  it("heavy-rain reuses the existing HAZARDS_V1.rainWarn constant directly, not a new/copied number", () => {
    expect(RAIN_HEAVY_MM).toBe(HAZARDS_V1.rainWarn);
    expect(RAIN_HEAVY_MM).toBe(12);
  });
});

describe("weatherVoiceRules — liquid-family evidence (RAIN or DRIZZLE only)", () => {
  it("rain and drizzle family codes count as liquid evidence", () => {
    expect(hasLiquidEvidence(61)).toBe(true); // light rain
    expect(hasLiquidEvidence(65)).toBe(true); // heavy rain
    expect(hasLiquidEvidence(51)).toBe(true); // light drizzle
    expect(hasLiquidEvidence(55)).toBe(true); // heavy drizzle
  });

  it("snow, freezing precipitation, thunder/hail, fog, and dry codes never count as liquid evidence", () => {
    expect(hasLiquidEvidence(71)).toBe(false); // snow
    expect(hasLiquidEvidence(56)).toBe(false); // freezing drizzle
    expect(hasLiquidEvidence(66)).toBe(false); // freezing rain
    expect(hasLiquidEvidence(95)).toBe(false); // thunderstorm
    expect(hasLiquidEvidence(45)).toBe(false); // fog
    expect(hasLiquidEvidence(0)).toBe(false); // clear
    expect(hasLiquidEvidence(3)).toBe(false); // overcast
  });

  it("an unsupported/missing code has no liquid evidence", () => {
    expect(hasLiquidEvidence(9999)).toBe(false);
    expect(hasLiquidEvidence(null)).toBe(false);
  });
});

describe("weatherVoiceRules — dry-family evidence (CLEAR, PARTLY_CLOUDY, or OVERCAST)", () => {
  it("clear, mainly clear, partly cloudy, and overcast all count as dry evidence", () => {
    expect(hasDryEvidence(0)).toBe(true);
    expect(hasDryEvidence(1)).toBe(true);
    expect(hasDryEvidence(2)).toBe(true);
    expect(hasDryEvidence(3)).toBe(true);
  });

  it("fog and every precipitation family are excluded from dry evidence", () => {
    expect(hasDryEvidence(45)).toBe(false);
    expect(hasDryEvidence(61)).toBe(false);
    expect(hasDryEvidence(71)).toBe(false);
    expect(hasDryEvidence(56)).toBe(false);
    expect(hasDryEvidence(95)).toBe(false);
  });
});

describe("weatherVoiceRules — CLEAR-family evidence (stricter than dry evidence)", () => {
  it("only WMO 0 and 1 are CLEAR family", () => {
    expect(isClearFamily(0)).toBe(true);
    expect(isClearFamily(1)).toBe(true);
  });

  it("partly cloudy (2) and overcast (3) are dry but NOT clear — the good-vs-excellent distinction", () => {
    expect(hasDryEvidence(2)).toBe(true);
    expect(isClearFamily(2)).toBe(false);
    expect(hasDryEvidence(3)).toBe(true);
    expect(isClearFamily(3)).toBe(false);
  });
});
