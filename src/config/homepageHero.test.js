// Ticket 411 (#411) — src/config/homepageHero.js
import { describe, it, expect } from "vitest";
import {
  HOMEPAGE_HERO_VARIANTS,
  getHomepageHeroVariant,
  getHomepageHeroCopyKeys,
} from "./homepageHero";

// All dates below are constructed with explicit UTC components
// (Date.UTC / a "Z"-suffixed ISO string) so the test is unaffected by the
// host machine's own timezone — the module itself reads UTC calendar
// months as Atlantic/Reykjavik calendar months (see module header).
function utcDate(y, m, d, hh = 12, mm = 0, ss = 0) {
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
}

describe("getHomepageHeroVariant — all 12 months", () => {
  const cases = [
    [1, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA], // January
    [2, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA], // February
    [3, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA], // March
    [4, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER], // April
    [5, HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING], // May
    [6, HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING], // June
    [7, HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING], // July
    [8, HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING], // August
    [9, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA], // September
    [10, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA], // October
    [11, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA], // November
    [12, HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA], // December
  ];

  it.each(cases)("month %i resolves to %s", (month, expected) => {
    expect(getHomepageHeroVariant(utcDate(2026, month, 15))).toBe(expected);
  });
});

describe("getHomepageHeroVariant — year rollover", () => {
  it("December of one year and January of the next both resolve to winter_weather_aurora", () => {
    expect(getHomepageHeroVariant(utcDate(2025, 12, 31))).toBe(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA);
    expect(getHomepageHeroVariant(utcDate(2026, 1, 1))).toBe(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA);
  });
});

describe("getHomepageHeroVariant — exact boundaries", () => {
  it("March 31 23:59:59 UTC is winter_weather_aurora; April 1 00:00:00 UTC is winter_weather", () => {
    expect(getHomepageHeroVariant(utcDate(2026, 3, 31, 23, 59, 59))).toBe(
      HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA
    );
    expect(getHomepageHeroVariant(utcDate(2026, 4, 1, 0, 0, 0))).toBe(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER);
  });

  it("April 30 23:59:59 UTC is winter_weather; May 1 00:00:00 UTC is summer_camping", () => {
    expect(getHomepageHeroVariant(utcDate(2026, 4, 30, 23, 59, 59))).toBe(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER);
    expect(getHomepageHeroVariant(utcDate(2026, 5, 1, 0, 0, 0))).toBe(HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING);
  });

  it("August 31 23:59:59 UTC is summer_camping; September 1 00:00:00 UTC is winter_weather_aurora", () => {
    expect(getHomepageHeroVariant(utcDate(2026, 8, 31, 23, 59, 59))).toBe(HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING);
    expect(getHomepageHeroVariant(utcDate(2026, 9, 1, 0, 0, 0))).toBe(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA);
  });
});

describe("getHomepageHeroVariant — offset-bearing timestamps straddling UTC midnight", () => {
  it("a timestamp with a positive offset that lands on Sept 1 in its own local time but Aug 31 in UTC resolves by UTC (summer_camping)", () => {
    // 2026-09-01T02:00:00+05:00 === 2026-08-31T21:00:00Z
    const d = new Date("2026-09-01T02:00:00+05:00");
    expect(d.getUTCMonth() + 1).toBe(8); // sanity: UTC month is August
    expect(getHomepageHeroVariant(d)).toBe(HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING);
  });

  it("a timestamp with a negative offset that lands on Aug 31 in its own local time but Sept 1 in UTC resolves by UTC (winter_weather_aurora)", () => {
    // 2026-08-31T22:00:00-05:00 === 2026-09-01T03:00:00Z
    const d = new Date("2026-08-31T22:00:00-05:00");
    expect(d.getUTCMonth() + 1).toBe(9); // sanity: UTC month is September
    expect(getHomepageHeroVariant(d)).toBe(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA);
  });

  it("a timestamp with a negative offset that lands on Apr 1 in its own local time but Mar 31 in UTC resolves by UTC (winter_weather_aurora)", () => {
    // 2026-04-01T03:00:00-05:00 === 2026-04-01T08:00:00Z -- pick one that actually straddles
    // Use: 2026-04-01T02:00:00+05:00 === 2026-03-31T21:00:00Z
    const d = new Date("2026-04-01T02:00:00+05:00");
    expect(d.getUTCMonth() + 1).toBe(3); // sanity: UTC month is March
    expect(getHomepageHeroVariant(d)).toBe(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA);
  });
});

describe("getHomepageHeroVariant — invalid/missing date fallback", () => {
  it("returns the deterministic summer_camping fallback for an invalid Date", () => {
    expect(getHomepageHeroVariant(new Date("not-a-date"))).toBe(HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING);
  });

  it("returns the deterministic summer_camping fallback for null", () => {
    expect(getHomepageHeroVariant(null)).toBe(HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING);
  });

  it("returns the deterministic summer_camping fallback for a non-Date value", () => {
    expect(getHomepageHeroVariant("2026-01-01")).toBe(HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING);
  });

  it("defaults to the current date when called with no argument (does not throw)", () => {
    expect(Object.values(HOMEPAGE_HERO_VARIANTS)).toContain(getHomepageHeroVariant());
  });
});

describe("getHomepageHeroCopyKeys", () => {
  it("maps winter_weather_aurora to its own title/subtitle and the shared winter CTA", () => {
    const keys = getHomepageHeroCopyKeys(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER_AURORA);
    expect(keys).toEqual({
      titleKey: "heroWinterAuroraTitle",
      subtitleKey: "heroWinterAuroraSubtitle",
      ctaKey: "heroWinterCta",
    });
  });

  it("maps winter_weather to its own title/subtitle and the SAME shared winter CTA key", () => {
    const keys = getHomepageHeroCopyKeys(HOMEPAGE_HERO_VARIANTS.WINTER_WEATHER);
    expect(keys).toEqual({
      titleKey: "heroAprilTitle",
      subtitleKey: "heroAprilSubtitle",
      ctaKey: "heroWinterCta",
    });
  });

  it("maps summer_camping to the pre-existing, unchanged hero keys", () => {
    const keys = getHomepageHeroCopyKeys(HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING);
    expect(keys).toEqual({
      titleKey: "heroStayMoveTitle",
      subtitleKey: "heroStayMoveSubtitle",
      ctaKey: "heroCta",
    });
  });

  it("falls back to summer_camping's keys for an unrecognized variant id", () => {
    expect(getHomepageHeroCopyKeys("not_a_real_variant")).toEqual(
      getHomepageHeroCopyKeys(HOMEPAGE_HERO_VARIANTS.SUMMER_CAMPING)
    );
  });
});
