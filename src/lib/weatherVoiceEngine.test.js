// Ticket 405 (#405) — Weather Voice Phase 1 deterministic rule engine.
import { describe, it, expect } from "vitest";
import { evaluateWeatherVoice } from "./weatherVoiceEngine";
import { normalizeDailyToScoreInput } from "./forecastNormalize";
import { scoreSiteDay } from "./scoring";

describe("evaluateWeatherVoice — all nine conditions, exact mood/severity", () => {
  it("extreme_wind -> wrecked, severity 3 (windMax > 15)", () => {
    expect(evaluateWeatherVoice({ tmax: 4, windMax: 17, rain: 5, code: 61 })).toEqual({
      show: true,
      condition: "extreme_wind",
      mood: "wrecked",
      severity: 3,
    });
  });

  it("heavy_rain -> sad, severity 2 (liquid evidence, rain >= 12)", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 5, rain: 15, code: 63 })).toEqual({
      show: true,
      condition: "heavy_rain",
      mood: "sad",
      severity: 2,
    });
  });

  it("strong_wind -> struggling, severity 2 (windMax > 10)", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 12, rain: 0, code: 0 })).toEqual({
      show: true,
      condition: "strong_wind",
      mood: "struggling",
      severity: 2,
    });
  });

  it("cold_wet -> unimpressed, severity 2 (tmax < 6, liquid evidence, rain >= 1)", () => {
    expect(evaluateWeatherVoice({ tmax: 2, windMax: 0, rain: 5, code: 61 })).toEqual({
      show: true,
      condition: "cold_wet",
      mood: "unimpressed",
      severity: 2,
    });
  });

  it("cold -> freezing, severity 1 (tmax < 6)", () => {
    expect(evaluateWeatherVoice({ tmax: 2, windMax: 0, rain: 0, code: 0 })).toEqual({
      show: true,
      condition: "cold",
      mood: "freezing",
      severity: 1,
    });
  });

  it("rain -> unimpressed, severity 1 (liquid evidence, rain >= 1) — tested separately from cold_wet despite sharing the mood", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 5, code: 61 })).toEqual({
      show: true,
      condition: "rain",
      mood: "unimpressed",
      severity: 1,
    });
  });

  it("sun_wind -> suspicious, severity 1 (CLEAR family, windMax > 5, rain < 1)", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 8, rain: 0, code: 0 })).toEqual({
      show: true,
      condition: "sun_wind",
      mood: "suspicious",
      severity: 1,
    });
  });

  it("excellent -> excellent, severity 0 (CLEAR family, tmax > 14, windMax <= 5, rain < 1)", () => {
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code: 0 })).toEqual({
      show: true,
      condition: "excellent",
      mood: "excellent",
      severity: 0,
    });
  });

  it("good -> happy, severity 0 (dry-family evidence, tmax >= 12, windMax <= 5, rain < 1)", () => {
    expect(evaluateWeatherVoice({ tmax: 13, windMax: 0, rain: 0, code: 3 })).toEqual({
      show: true,
      condition: "good",
      mood: "happy",
      severity: 0,
    });
  });
});

describe("evaluateWeatherVoice — boundary pairs (no score-style rounding)", () => {
  it("wind 5 vs 5.1 m/s (sun_wind boundary, isolated from good/excellent by a mid temperature)", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 5, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 5.1, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "sun_wind",
    });
  });

  it("wind 10 vs 10.1 m/s (strong_wind pre-empts sun_wind once windMax > 10)", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 10, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "sun_wind",
    });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 10.1, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "strong_wind",
    });
  });

  it("wind 15 vs 15.1 m/s (extreme_wind boundary)", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 15, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "strong_wind",
    });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 15.1, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "extreme_wind",
    });
  });

  it("6°C boundary: just below is cold, at/above is silent (dry, calm, mild otherwise)", () => {
    expect(evaluateWeatherVoice({ tmax: 5.9, windMax: 0, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "cold",
    });
    expect(evaluateWeatherVoice({ tmax: 6.0, windMax: 0, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 6.1, windMax: 0, rain: 0, code: 0 })).toEqual({ show: false });
  });

  it("12°C boundary: just below is silent, at/above is good (dry, non-clear, calm, dry-precip)", () => {
    expect(evaluateWeatherVoice({ tmax: 11.9, windMax: 0, rain: 0, code: 3 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 12.0, windMax: 0, rain: 0, code: 3 })).toMatchObject({
      show: true,
      condition: "good",
    });
  });

  it("14°C boundary: good through and including 14.0, excellent only strictly above (CLEAR family)", () => {
    expect(evaluateWeatherVoice({ tmax: 13.9, windMax: 0, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "good",
    });
    expect(evaluateWeatherVoice({ tmax: 14.0, windMax: 0, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "good",
    });
    expect(evaluateWeatherVoice({ tmax: 14.1, windMax: 0, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "excellent",
    });
  });

  it("1mm boundary: just below is silent (liquid present but negligible), at/above is rain", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 0.9, code: 61 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 1.0, code: 61 })).toMatchObject({
      show: true,
      condition: "rain",
    });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 1.1, code: 61 })).toMatchObject({
      show: true,
      condition: "rain",
    });
  });

  it("12mm boundary: just below is plain rain, at/above is heavy_rain", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 11.9, code: 63 })).toMatchObject({
      show: true,
      condition: "rain",
    });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 12.0, code: 63 })).toMatchObject({
      show: true,
      condition: "heavy_rain",
    });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 12.1, code: 63 })).toMatchObject({
      show: true,
      condition: "heavy_rain",
    });
  });

  it("high-precision values prove comparisons use the unrounded input (scoring's round1 would flip these)", () => {
    // scoring.js's round1(15.02) -> 15.0 (Math.round(150.2)/10), which would
    // NOT be > 15 and would wrongly demote this to strong_wind if Weather
    // Voice mistakenly rounded. The unrounded value (15.02) genuinely is
    // > 15, so extreme_wind must win.
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 15.02, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "extreme_wind",
    });

    // scoring.js's round1(11.999) -> 12.0 (Math.round(119.99)/10), which
    // would meet the >=12 heavy-rain threshold if rounded. The unrounded
    // value (11.999) genuinely is < 12, so this must stay plain "rain".
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 11.999, code: 63 })).toMatchObject({
      show: true,
      condition: "rain",
    });
  });
});

describe("evaluateWeatherVoice — priority resolves overlapping conditions to exactly one match", () => {
  it("extreme wind + heavy rain -> extreme_wind only (issue #405's explicit example)", () => {
    expect(evaluateWeatherVoice({ tmax: 5, windMax: 20, rain: 20, code: 65 })).toMatchObject({
      show: true,
      condition: "extreme_wind",
    });
  });

  it("strong wind + cold -> strong_wind (priority 3) wins over cold (priority 5)", () => {
    expect(evaluateWeatherVoice({ tmax: 2, windMax: 12, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "strong_wind",
    });
  });

  it("cold + rain -> cold_wet (priority 4) wins over both plain cold (5) and plain rain (6)", () => {
    const coldWet = evaluateWeatherVoice({ tmax: 2, windMax: 0, rain: 5, code: 61 });
    expect(coldWet).toMatchObject({ show: true, condition: "cold_wet" });
    // Same rain-only evidence without the cold temperature stays "rain", not cold_wet:
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 5, code: 61 })).toMatchObject({ condition: "rain" });
    // Same cold temperature without liquid evidence stays plain "cold":
    expect(evaluateWeatherVoice({ tmax: 2, windMax: 0, rain: 0, code: 0 })).toMatchObject({ condition: "cold" });
  });

  it("excellent warmth + strong wind -> strong_wind (priority 3) wins over excellent (priority 8)", () => {
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 12, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "strong_wind",
    });
  });

  it("sun + strong wind -> strong_wind (priority 3) wins over sun_wind (priority 7)", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 12, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "strong_wind",
    });
  });

  it("heavy rain + strong wind -> heavy_rain (priority 2) wins over strong_wind (priority 3)", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 12, rain: 15, code: 63 })).toMatchObject({
      show: true,
      condition: "heavy_rain",
    });
  });

  it("excellent versus good at the same warm/calm/dry conditions: CLEAR family decides, not temperature alone", () => {
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "excellent",
    });
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code: 3 })).toMatchObject({
      show: true,
      condition: "good",
    });
  });
});

describe("evaluateWeatherVoice — ordinary weather is silent", () => {
  it("the issue's explicit example: 8°C / 4 m/s / overcast / dry -> show:false", () => {
    expect(evaluateWeatherVoice({ tmax: 8, windMax: 4, rain: 0, code: 3 })).toEqual({ show: false });
  });

  it("mild, breezy, dry, non-clear (partly cloudy) day stays silent", () => {
    expect(evaluateWeatherVoice({ tmax: 9, windMax: 7, rain: 0, code: 2 })).toEqual({ show: false });
  });

  it("negligible light rain under the 1mm floor stays silent even with liquid evidence", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 3, rain: 0.5, code: 61 })).toEqual({ show: false });
  });
});

describe("evaluateWeatherVoice — WMO family boundaries", () => {
  it("WMO 0 and 1 (CLEAR) both reach excellent; WMO 2 (partly cloudy) cannot", () => {
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code: 0 })).toMatchObject({ condition: "excellent" });
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code: 1 })).toMatchObject({ condition: "excellent" });
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code: 2 })).toMatchObject({ condition: "good" });
  });

  it("supported rain (63) and drizzle (53) both count as liquid evidence for the rain condition", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 2, code: 63 })).toMatchObject({ condition: "rain" });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 2, code: 53 })).toMatchObject({ condition: "rain" });
  });

  it("snow, freezing precipitation, thunder/hail, and fog can never produce good/excellent, even with warm/calm/dry-looking inputs", () => {
    for (const code of [71, 56, 95, 45]) {
      expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code })).toEqual({ show: false });
    }
  });

  it("a heavy WMO rain code (65) with under 1mm accumulated does not produce heavy_rain or even plain rain", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 0.5, code: 65 })).toEqual({ show: false });
  });

  it("a large accumulated amount alongside a snow code does not trigger any rain condition", () => {
    // Cold + huge "rain" amount, but the code is snow (no liquid evidence) —
    // must resolve to plain "cold", never cold_wet/rain/heavy_rain.
    expect(evaluateWeatherVoice({ tmax: 2, windMax: 0, rain: 15, code: 73 })).toMatchObject({
      show: true,
      condition: "cold",
    });
  });

  it("a supported but internally inconsistent fixture (clear sky code alongside a real rain amount) follows the table conservatively to silence", () => {
    // Clear isn't liquid evidence, so no rain-gated rule can fire regardless
    // of the amount; the same rain amount also fails the good/excellent
    // rain<1 requirement. No rule matches — the conservative, honest result.
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 5, code: 0 })).toEqual({ show: false });
  });
});

describe("evaluateWeatherVoice — strict invalid-input handling", () => {
  it("missing input entirely", () => {
    expect(evaluateWeatherVoice(undefined)).toEqual({ show: false });
    expect(evaluateWeatherVoice(null)).toEqual({ show: false });
    expect(evaluateWeatherVoice({})).toEqual({ show: false });
  });

  it("missing individual fields", () => {
    expect(evaluateWeatherVoice({ windMax: 0, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 0 })).toEqual({ show: false });
  });

  it("null/undefined individual fields", () => {
    expect(evaluateWeatherVoice({ tmax: null, windMax: 0, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: undefined, rain: 0, code: 0 })).toEqual({ show: false });
  });

  it("string, boolean, and non-finite values are never coerced to real conditions", () => {
    expect(evaluateWeatherVoice({ tmax: "10", windMax: 0, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: true, windMax: 0, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: NaN, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: Infinity, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: -Infinity, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: 0, code: "0" })).toEqual({ show: false });
  });

  it("unsupported WMO codes never resolve, and are never assumed to mean sunny", () => {
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code: 9999 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 16, windMax: 0, rain: 0, code: null })).toEqual({ show: false });
  });

  it("negative wind or rain is rejected (physically impossible), but negative temperature is valid", () => {
    expect(evaluateWeatherVoice({ tmax: 10, windMax: -1, rain: 0, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: 10, windMax: 0, rain: -1, code: 0 })).toEqual({ show: false });
    expect(evaluateWeatherVoice({ tmax: -10, windMax: 0, rain: 0, code: 0 })).toMatchObject({
      show: true,
      condition: "cold",
    });
  });
});

describe("evaluateWeatherVoice — purity, determinism, and ignoring unrelated fields", () => {
  it("does not mutate its input and returns the same result on repeated calls", () => {
    const input = Object.freeze({ tmax: 16, windMax: 0, rain: 0, code: 0 });
    const before = { ...input };

    const first = evaluateWeatherVoice(input);
    const second = evaluateWeatherVoice(input);

    expect(input).toEqual(before); // frozen input untouched
    expect(second).toEqual(first);
  });

  it("extra tier/season/score/summary fields never alter the result", () => {
    const plain = evaluateWeatherVoice({ tmax: 13, windMax: 0, rain: 0, code: 3 });
    const withExtras = evaluateWeatherVoice({
      tmax: 13,
      windMax: 0,
      rain: 0,
      code: 3,
      points: 2,
      season: "winter",
      tier: "pro",
      summaryCode: 65,
      summaryTextKey: "dailySummaryRainEarlyDryLater",
    });
    expect(withExtras).toEqual(plain);
  });

  it("a fixture built from the actual normalizer proves the four-field contract and the weighted-vs-daily fallback", () => {
    const daily = {
      time: ["2026-07-01"],
      temperature_2m_max: [16],
      temperature_2m_min: [9],
      precipitation_sum: [0],
      windspeed_10m_max: [2],
      windgusts_10m_max: [3],
      winddirection_10m_dominant: [180],
      weathercode: [0],
    };

    // With hourly data present, wind/rain are time-weighted, not the raw daily fields.
    const hourly = {
      time: ["2026-07-01T00:00", "2026-07-01T12:00"],
      windspeed_10m: [1, 1],
      windgusts_10m: [2, 2],
      precipitation: [0, 0],
    };
    const [weightedRow] = normalizeDailyToScoreInput(daily, hourly);
    expect(evaluateWeatherVoice(weightedRow)).toMatchObject({ show: true, condition: "excellent" });

    // With no hourly data, the row falls back to the provider's own daily
    // max/sum fields — evaluateWeatherVoice reads whatever ended up in
    // `windMax`/`rain` either way, with no special-casing of its own.
    const [dailyFallbackRow] = normalizeDailyToScoreInput(daily, null);
    expect(dailyFallbackRow.windMax).toBe(2); // provider's windspeed_10m_max, unweighted
    expect(evaluateWeatherVoice(dailyFallbackRow)).toMatchObject({ show: true, condition: "excellent" });

    // Only the four documented fields matter — the row's many other
    // normalizer-only fields (precipStartHour, precipType, tmin, ...) are
    // present but genuinely ignored.
    expect(weightedRow).toHaveProperty("precipStartHour");
    expect(weightedRow).toHaveProperty("tmin");
  });

  it("calling evaluateWeatherVoice does not change scoreSiteDay's result for the same row", () => {
    const row = { tmax: 2, rain: 5, windMax: 0, windGust: 0, date: "2026-01-15", code: 61 };

    const before = scoreSiteDay(row);
    evaluateWeatherVoice(row);
    const after = scoreSiteDay(row);

    expect(after).toEqual(before);
  });
});
