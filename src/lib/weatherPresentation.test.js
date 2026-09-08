import { describe, it, expect } from "vitest";
import {
  resolveWeatherPresentation,
  getWeatherCodeFamily,
  isSupportedWeatherCode,
  isDaytimeHour,
  WEATHER_FAMILIES,
  WEATHER_FAMILY_CODES,
} from "./weatherPresentation";

describe("resolveWeatherPresentation — representative codes across every required family", () => {
  it.each([
    [0, "clear", "clear-day"],
    [1, "clear", "partly-cloudy-day"],
    [2, "partlyCloudy", "partly-cloudy-day"],
    [3, "overcast", "cloudy"],
    [45, "fog", "fog"],
    [48, "fog", "fog"],
    [61, "rain", "rain"],
    [65, "rain", "heavy-rain"],
    [56, "freezingPrecip", "sleet"],
    [66, "freezingPrecip", "sleet"],
    [71, "snow", "snow"],
    [95, "thunderHail", "thunderstorm"],
    [96, "thunderHail", "hail"],
  ])("code %i resolves to family %s / iconId %s (daytime)", (code, family, iconId) => {
    const result = resolveWeatherPresentation(code, { isDay: true });
    expect(result.family).toBe(family);
    expect(result.iconId).toBe(iconId);
    expect(result.isUnknown).toBe(false);
    expect(typeof result.textKey).toBe("string");
  });

  it("clear (0) and partly-cloudy-family codes (1,2) swap to night icon variants when isDay=false", () => {
    expect(resolveWeatherPresentation(0, { isDay: false }).iconId).toBe("clear-night");
    expect(resolveWeatherPresentation(1, { isDay: false }).iconId).toBe("partly-cloudy-night");
    expect(resolveWeatherPresentation(2, { isDay: false }).iconId).toBe("partly-cloudy-night");
  });

  it("codes without a day/night icon variant are unaffected by isDay", () => {
    expect(resolveWeatherPresentation(3, { isDay: true }).iconId).toBe("cloudy");
    expect(resolveWeatherPresentation(3, { isDay: false }).iconId).toBe("cloudy");
    expect(resolveWeatherPresentation(95, { isDay: true }).iconId).toBe("thunderstorm");
    expect(resolveWeatherPresentation(95, { isDay: false }).iconId).toBe("thunderstorm");
  });
});

describe("resolveWeatherPresentation — explicit neutral unknown, never a coerced real condition", () => {
  it.each([null, undefined, NaN, "not-a-code", 999, -1, 3.5])(
    "code %p resolves to the explicit unknown presentation",
    (code) => {
      const result = resolveWeatherPresentation(code);
      expect(result.isUnknown).toBe(true);
      expect(result.family).toBe(WEATHER_FAMILIES.UNKNOWN);
      expect(result.textKey).toBe("unknownWeather");
      expect(result.iconId).toBeNull();
      // Never silently the clear-sky or overcast presentation.
      expect(result.textKey).not.toBe("clearSky");
      expect(result.textKey).not.toBe("overcast");
    }
  );
});

describe("getWeatherCodeFamily / isSupportedWeatherCode", () => {
  it("returns 'unknown' family for unsupported input without throwing", () => {
    expect(getWeatherCodeFamily(null)).toBe(WEATHER_FAMILIES.UNKNOWN);
    expect(getWeatherCodeFamily(12345)).toBe(WEATHER_FAMILIES.UNKNOWN);
  });

  it("isSupportedWeatherCode is false for non-finite/non-numeric/unsupported input", () => {
    expect(isSupportedWeatherCode(null)).toBe(false);
    expect(isSupportedWeatherCode(undefined)).toBe(false);
    expect(isSupportedWeatherCode(NaN)).toBe(false);
    expect(isSupportedWeatherCode("0")).toBe(false);
    expect(isSupportedWeatherCode(4)).toBe(false);
  });

  it("every code in WEATHER_FAMILY_CODES belongs to exactly one family (no drift between the two tables)", () => {
    const seen = new Map();
    for (const [family, codes] of Object.entries(WEATHER_FAMILY_CODES)) {
      for (const code of codes) {
        expect(seen.has(code)).toBe(false);
        seen.set(code, family);
        expect(getWeatherCodeFamily(code)).toBe(family);
      }
    }
  });
});

describe("isDaytimeHour", () => {
  it("treats 07:00-20:59 as daytime and everything else as night", () => {
    expect(isDaytimeHour(7)).toBe(true);
    expect(isDaytimeHour(13)).toBe(true);
    expect(isDaytimeHour(20)).toBe(true);
    expect(isDaytimeHour(21)).toBe(false);
    expect(isDaytimeHour(6)).toBe(false);
    expect(isDaytimeHour(0)).toBe(false);
  });

  it("handles missing/invalid hour safely", () => {
    expect(isDaytimeHour(null)).toBe(false);
    expect(isDaytimeHour(undefined)).toBe(false);
    expect(isDaytimeHour(NaN)).toBe(false);
  });
});
