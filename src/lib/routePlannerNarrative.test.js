// Ticket #436 F4/F6 — routePlannerNarrative.js had NO test file before this
// ticket. getHazardBlockText's 🚨/⚠️ emoji prefixes were removed; this
// proves that removal was prefix-only — branch selection, the exact
// translated sentence, and the null/fallback paths are all unchanged.
// getRoughWeatherWindowText is untouched by #436 (its translation values
// still carry a baked-in "⚠ " by product decision, out of F9's scope) and
// is covered here only to pin that current, unchanged behavior.
import { describe, it, expect } from "vitest";
import {
  getHazardBlockText,
  getStayReasonText,
  getHazardWindowNarrative,
  getRoughWeatherWindowText,
} from "./routePlannerNarrative";
import { translations } from "../i18n/translations";

const t = (k) => translations.en[k] ?? k;
const tIs = (k) => translations.is[k] ?? k;

describe("getHazardBlockText — emoji removed, branches/text otherwise unchanged (F4)", () => {
  it("returns null when not hazardBlocked", () => {
    expect(getHazardBlockText({ hazardBlocked: false }, t)).toBeNull();
    expect(getHazardBlockText(null, t)).toBeNull();
  });

  it("hazardBlockMode 'stay': exact translated sentence, no emoji prefix", () => {
    const text = getHazardBlockText({ hazardBlocked: true, hazardBlockMode: "stay" }, t);
    expect(text).toBe(translations.en.routeHazardBlockerStay);
    expect(text.startsWith("🚨")).toBe(false);
    expect(text).not.toMatch(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it("hazardBlockMode 'consider': exact translated sentence, no emoji prefix", () => {
    const text = getHazardBlockText({ hazardBlocked: true, hazardBlockMode: "consider" }, t);
    expect(text).toBe(translations.en.routeHazardBlockerConsider);
    expect(text.startsWith("⚠️")).toBe(false);
  });

  it("unrecognized hazardBlockMode falls through to the short fallback sentence, no emoji prefix", () => {
    const text = getHazardBlockText({ hazardBlocked: true, hazardBlockMode: "other" }, t);
    expect(text).toBe(translations.en.routeHazardBlockerShort);
    expect(text.startsWith("⚠️")).toBe(false);
  });

  it("IS dictionary: same branch logic, exact IS sentence, no emoji", () => {
    const text = getHazardBlockText({ hazardBlocked: true, hazardBlockMode: "stay" }, tIs);
    expect(text).toBe(translations.is.routeHazardBlockerStay);
  });
});

describe("getStayReasonText / getHazardWindowNarrative — unaffected by #436, pinned as-is", () => {
  it("non-stay decision returns null", () => {
    expect(getStayReasonText({}, "move", t)).toBeNull();
  });

  it("stay with hazardBlocked candidate returns the hazard-driven reason", () => {
    expect(getStayReasonText({ hazardBlocked: true }, "stay", t)).toBe(
      translations.en.routeStayReasonHazard
    );
  });

  it("hazard window narrative maps type to the matching sentence, null for unknown/missing type", () => {
    expect(getHazardWindowNarrative({ hazardWindow: { type: "passingStorm" } }, t)).toBe(
      translations.en.routeHazardWindowPassingStorm
    );
    expect(getHazardWindowNarrative({ hazardWindow: { type: "unknown" } }, t)).toBeNull();
    expect(getHazardWindowNarrative({}, t)).toBeNull();
  });
});

describe("getRoughWeatherWindowText — untouched by #436, still carries its own baked-in '⚠ ' (out of F9 scope)", () => {
  const formatDate = (d) => d;
  const interpolate = (template, vars) => {
    let out = template;
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    return out;
  };

  it("single-day window uses routeRoughWeatherWindowSingle verbatim, including its leading '⚠ '", () => {
    const text = getRoughWeatherWindowText(
      { roughWeatherWindow: { hasWindow: true, startDate: "2026-10-20", endDate: "2026-10-20", dayCount: 1 } },
      t,
      formatDate,
      interpolate
    );
    expect(text).toBe("⚠ Rough weather may affect 2026-10-20.");
  });

  it("multi-day window uses routeRoughWeatherWindowRange with start/end/days interpolated", () => {
    const text = getRoughWeatherWindowText(
      { roughWeatherWindow: { hasWindow: true, startDate: "2026-10-20", endDate: "2026-10-22", dayCount: 3 } },
      t,
      formatDate,
      interpolate
    );
    expect(text).toBe("⚠ Rough weather window: 2026-10-20 → 2026-10-22 (3 days).");
  });

  it("no window returns null", () => {
    expect(getRoughWeatherWindowText({}, t, formatDate, interpolate)).toBeNull();
  });
});
