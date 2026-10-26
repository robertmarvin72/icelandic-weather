// Ticket #436 — routePlannerDetailsHelpers.js had NO test file before this
// ticket (F6(2)). The targeted change here is getWarningBadges(), which
// used to return an emoji icon string ("🚨"/"⚠️") and now returns the raw
// `level` so the caller (the modal's advanced table) picks the Lucide
// CircleAlert/TriangleAlert icon itself.
import { describe, it, expect } from "vitest";
import {
  getWarningBadges,
  getWarningTypeLabel,
  getRouteRiskSummary,
} from "./routePlannerDetailsHelpers";
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

// Ticket #460 — getRouteRiskSummary used to fall through any routeRisk
// value other than "HIGH"/"MED" (including a future "UNKNOWN") to the "Low"
// label with no tooltip. Every branch of the closed {LOW, MED, HIGH,
// UNKNOWN} set is asserted explicitly below so none of them can silently
// read as reassuring.
describe("getRouteRiskSummary", () => {
  it("returns null for no data", () => {
    expect(getRouteRiskSummary(null, t)).toBeNull();
    expect(getRouteRiskSummary(undefined, t)).toBeNull();
  });

  it("returns null for LOW (no caution to show)", () => {
    expect(getRouteRiskSummary({ routeRisk: "LOW" }, t)).toBeNull();
  });

  it("HIGH: level/tooltip text, unknown false, partial false by default", () => {
    const summary = getRouteRiskSummary({ routeRisk: "HIGH" }, t);
    expect(summary.level).toBe(t("routeRiskHigh"));
    expect(summary.tooltip).toBe(t("routeRiskHighTooltip"));
    expect(summary.unknown).toBe(false);
    expect(summary.partial).toBe(false);
  });

  it("MED: level/tooltip text", () => {
    const summary = getRouteRiskSummary({ routeRisk: "MED" }, t);
    expect(summary.level).toBe(t("routeRiskMed"));
    expect(summary.tooltip).toBe(t("routeRiskMedTooltip"));
  });

  it("UNKNOWN: unknown true, no tooltip, label is NOT the Low word", () => {
    const summary = getRouteRiskSummary({ routeRisk: "UNKNOWN" }, t);
    expect(summary.unknown).toBe(true);
    expect(summary.tooltip).toBeNull();
    expect(summary.level).toBe(t("routeRiskUnknown"));
    expect(summary.level).not.toBe(t("routeRiskLow"));
  });

  it("partial coverage HIGH/MED surfaces partial: true", () => {
    const high = getRouteRiskSummary(
      { routeRisk: "HIGH", coverage: { status: "partial" } },
      t
    );
    const med = getRouteRiskSummary({ routeRisk: "MED", coverage: { status: "partial" } }, t);
    expect(high.partial).toBe(true);
    expect(med.partial).toBe(true);
  });

  it("complete coverage HIGH/MED surfaces partial: false", () => {
    const summary = getRouteRiskSummary(
      { routeRisk: "HIGH", coverage: { status: "complete" } },
      t
    );
    expect(summary.partial).toBe(false);
  });

  // Correction v2, R1 (Jonesy) — the MED branch used to be an unconditional
  // fallthrough, not a real `=== "MED"` check: any non-null routeRiskData
  // whose routeRisk was undefined/null/a malformed string silently rendered
  // as MED. These three cases must now all read identically to UNKNOWN.
  it("routeRisk undefined on non-null data: neutral unknown shape, never MED/LOW", () => {
    const summary = getRouteRiskSummary({}, t);
    expect(summary).not.toBeNull();
    expect(summary.unknown).toBe(true);
    expect(summary.level).toBe(t("routeRiskUnknown"));
    expect(summary.level).not.toBe(t("routeRiskMed"));
    expect(summary.level).not.toBe(t("routeRiskLow"));
    expect(summary.tooltip).toBeNull();
  });

  it("routeRisk explicitly null on non-null data: neutral unknown shape, never MED/LOW", () => {
    const summary = getRouteRiskSummary({ routeRisk: null }, t);
    expect(summary.unknown).toBe(true);
    expect(summary.level).toBe(t("routeRiskUnknown"));
  });

  it("routeRisk is a malformed/unrecognised string ('FOO'): neutral unknown shape, never MED/LOW", () => {
    const summary = getRouteRiskSummary({ routeRisk: "FOO" }, t);
    expect(summary.unknown).toBe(true);
    expect(summary.level).toBe(t("routeRiskUnknown"));
    expect(summary.tooltip).toBeNull();
  });

  it("does not mutate the routeRiskData object it was given", () => {
    const input = Object.freeze({ routeRisk: "HIGH", coverage: Object.freeze({ status: "partial" }) });
    expect(() => getRouteRiskSummary(input, t)).not.toThrow();
    expect(input.routeRisk).toBe("HIGH");
    expect(input.coverage.status).toBe("partial");
  });
});
