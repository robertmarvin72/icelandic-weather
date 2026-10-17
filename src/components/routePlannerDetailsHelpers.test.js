// Ticket #436 — routePlannerDetailsHelpers.js had NO test file before this
// ticket (F6(2)). The targeted change here is getWarningBadges(), which
// used to return an emoji icon string ("🚨"/"⚠️") and now returns the raw
// `level` so the caller (the modal's advanced table) picks the Lucide
// CircleAlert/TriangleAlert icon itself.
import { describe, it, expect } from "vitest";
import { getWarningBadges, getWarningTypeLabel } from "./routePlannerDetailsHelpers";
import { translations } from "../i18n/translations";

const t = (k) => translations.en[k] ?? k;

describe("getWarningBadges", () => {
  it("returns [] for undefined/empty input", () => {
    expect(getWarningBadges(undefined, t)).toEqual([]);
    expect(getWarningBadges([], t)).toEqual([]);
  });

  it("returns level (not an emoji icon string) for each warning, high and warn", () => {
    const badges = getWarningBadges(
      [
        { type: "wind", level: "high", value: 20 },
        { type: "rain", level: "warn", value: 13 },
      ],
      t
    );

    expect(badges).toHaveLength(2);
    expect(badges[0].level).toBe("high");
    expect(badges[1].level).toBe("warn");
    // Ticket #436: never an emoji string on the badge object itself.
    expect(badges[0].icon).toBeUndefined();
    expect(badges[1].icon).toBeUndefined();
    expect(JSON.stringify(badges)).not.toContain("🚨");
    expect(JSON.stringify(badges)).not.toContain("⚠️");
  });

  it("uses getWarningTypeLabel for the label and includes it in the title", () => {
    const badges = getWarningBadges([{ type: "gust", level: "high", value: 25 }], t);
    expect(badges[0].label).toBe(getWarningTypeLabel("gust", t));
    expect(badges[0].title).toBe(`${getWarningTypeLabel("gust", t)}: 25`);
  });

  it("gives high and warn distinct className tones", () => {
    const [high] = getWarningBadges([{ type: "wind", level: "high", value: 20 }], t);
    const [warn] = getWarningBadges([{ type: "wind", level: "warn", value: 14 }], t);
    expect(high.className).not.toBe(warn.className);
  });

  it("keys are unique even for repeated types", () => {
    const badges = getWarningBadges(
      [
        { type: "wind", level: "high", value: 20 },
        { type: "wind", level: "warn", value: 14 },
      ],
      t
    );
    expect(new Set(badges.map((b) => b.key)).size).toBe(2);
  });
});

describe("getWarningTypeLabel", () => {
  it.each([
    ["wind", "routeWarnTypeWind"],
    ["gust", "routeWarnTypeGust"],
    ["rain", "routeWarnTypeRain"],
    ["tempLow", "routeWarnTypeTempLow"],
    ["tempHigh", "routeWarnTypeTempHigh"],
  ])("%s -> translations.en.%s", (type, key) => {
    expect(getWarningTypeLabel(type, t)).toBe(translations.en[key]);
  });

  it("falls back to the raw type for an unrecognized type", () => {
    expect(getWarningTypeLabel("fog", t)).toBe("fog");
  });

  it("falls back to an em dash for a falsy type", () => {
    expect(getWarningTypeLabel(undefined, t)).toBe("—");
  });
});
