// Ticket #436 — ForecastTable's own-assessment caution presentation: exact
// HAZARDS_V1 threshold boundaries, chosen Lucide SVG identity (never the old
// 🚨/⚠️ emoji), visible reason line, row aria-label (D5: byte-identical for
// a row with no caution), and the source note's F2 show/hide rule.
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ForecastTable from "./ForecastTable";
import { translations } from "../i18n/translations";

const t = (k) => translations.en[k] ?? k;

function makeRow(i, overrides = {}) {
  return {
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    dayLabel: `Day ${i + 1}`,
    points: 50,
    basePts: 40,
    windPen: 0,
    rainPen: 0,
    class: "Good",
    code: 0,
    tmin: 8,
    tmax: 15,
    windMax: 5,
    windGust: null,
    rain: 0,
    ...overrides,
  };
}

function renderOpen(rows) {
  const result = render(<ForecastTable rows={rows} onSelectDay={() => {}} t={t} />);
  fireEvent.click(screen.getByText(t("forecastShowDetailsCta")));
  return result;
}

function row(dateIdx) {
  return screen.getAllByRole("button", { name: new RegExp(`^${t("day")} Day ${dateIdx + 1}`) })[0];
}

describe("ForecastTable — HAZARDS_V1 threshold boundaries (wind)", () => {
  it.each([
    [13.9, "none"],
    [14, "warn"],
    [17.9, "warn"],
    [18, "high"],
  ])("windMax=%s -> %s", (windMax, expected) => {
    const rows = [makeRow(0, { windMax })];
    renderOpen(rows);
    const tr = row(0);
    if (expected === "none") {
      expect(tr.getAttribute("aria-label")).toBe(`${t("day")} Day 1`);
      expect(tr.querySelector("svg.lucide-circle-alert")).toBeNull();
      expect(tr.querySelector("svg.lucide-triangle-alert")).toBeNull();
    } else {
      expect(tr.getAttribute("aria-label")).not.toBe(`${t("day")} Day 1`);
      expect(tr.getAttribute("aria-label")).toContain(t("routeWarnTypeWind"));
      const selector = expected === "high" ? "svg.lucide-triangle-alert" : "svg.lucide-circle-alert";
      expect(tr.querySelectorAll(selector).length).toBeGreaterThan(0);
    }
  });
});

describe("ForecastTable — HAZARDS_V1 threshold boundaries (gust/rain/cold/heat)", () => {
  it.each([
    [{ windGust: 19.9 }, "none"],
    [{ windGust: 20 }, "warn"],
    [{ windGust: 23.9 }, "warn"],
    [{ windGust: 24 }, "high"],
    [{ rain: 11.9 }, "none"],
    [{ rain: 12 }, "warn"],
    [{ rain: 19.9 }, "warn"],
    [{ rain: 20 }, "high"],
    [{ tmin: -7.9 }, "none"],
    [{ tmin: -8 }, "warn"],
    [{ tmin: -14.9 }, "warn"],
    [{ tmin: -15 }, "high"],
    [{ tmax: 23.9 }, "none"],
    [{ tmax: 24 }, "warn"],
    [{ tmax: 27.9 }, "warn"],
    [{ tmax: 28 }, "high"],
  ])("%j -> %s", (overrides, expected) => {
    const rows = [makeRow(0, overrides)];
    renderOpen(rows);
    const tr = row(0);
    const hasHigh = tr.querySelectorAll("svg.lucide-triangle-alert").length > 0;
    const hasWarn = tr.querySelectorAll("svg.lucide-circle-alert").length > 0;
    if (expected === "none") {
      expect(hasHigh || hasWarn).toBe(false);
      expect(tr.getAttribute("aria-label")).toBe(`${t("day")} Day 1`);
    } else if (expected === "warn") {
      expect(hasWarn).toBe(true);
      expect(hasHigh).toBe(false);
    } else {
      expect(hasHigh).toBe(true);
    }
  });
});

describe("ForecastTable — high wins exactly as before, reason labels, visible line", () => {
  it("wind=high AND rain=warn on the same day: corner badge is TriangleAlert (high wins), visible line names both reasons at the high level only", () => {
    // High wins per-row overall, but the reason set shown is the TYPES at
    // that winning level only (wind here) — rain is a lower-level warning
    // on this same row and must not be listed as if it were also "high".
    const rows = [makeRow(0, { windMax: 20, rain: 15 })];
    renderOpen(rows);
    const tr = row(0);
    expect(tr.querySelectorAll("svg.lucide-triangle-alert").length).toBeGreaterThan(0);
    expect(tr.querySelectorAll("svg.lucide-circle-alert").length).toBe(0);
    expect(tr.getAttribute("aria-label")).toContain(t("routeWarnTypeWind"));
    expect(tr.getAttribute("aria-label")).not.toContain(t("routeWarnTypeRain"));
    expect(within(tr).getByText(new RegExp(t("routeWarnTypeWind")))).toBeInTheDocument();
  });

  it("two reasons at the same level both appear in the visible line and the aria-label", () => {
    const rows = [makeRow(0, { windMax: 15, rain: 13 })]; // both warn-level
    renderOpen(rows);
    const tr = row(0);
    expect(tr.getAttribute("aria-label")).toContain(t("routeWarnTypeWind"));
    expect(tr.getAttribute("aria-label")).toContain(t("routeWarnTypeRain"));
  });

  it("row with NO caution keeps the byte-identical original aria-label (D5)", () => {
    const rows = [makeRow(0)];
    renderOpen(rows);
    expect(row(0).getAttribute("aria-label")).toBe(`${t("day")} Day 1`);
  });

  it("row interaction still fires exactly once per click, no nested buttons/links inside a row", () => {
    let clicks = 0;
    const rows = [makeRow(0, { windMax: 20 })];
    render(<ForecastTable rows={rows} onSelectDay={() => (clicks += 1)} t={t} />);
    fireEvent.click(screen.getByText(t("forecastShowDetailsCta")));
    const tr = row(0);
    expect(tr.querySelectorAll("button, a").length).toBe(0); // no nested interactive elements
    fireEvent.click(tr);
    expect(clicks).toBe(1);
  });
});

describe("ForecastTable — source note (F2)", () => {
  it("no note while collapsed (details panel not open)", () => {
    render(<ForecastTable rows={[makeRow(0, { windMax: 20 })]} onSelectDay={() => {}} t={t} />);
    expect(screen.queryByText(t("hazardSourceNoteHeading"))).toBeNull();
  });

  it("open panel, at least one row has a caution: note renders once with the exact issue copy and a vedur.is link", () => {
    renderOpen([makeRow(0, { windMax: 20 }), makeRow(1)]);
    expect(screen.getAllByText(t("hazardSourceNoteHeading"))).toHaveLength(1);
    const link = screen.getByRole("link", { name: "vedur.is" });
    expect(link.getAttribute("href")).toBe("https://www.vedur.is/");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("open panel, no row has a caution: no note", () => {
    renderOpen([makeRow(0), makeRow(1)]);
    expect(screen.queryByText(t("hazardSourceNoteHeading"))).toBeNull();
  });

  it("no note while loading or in an error state, even with onSelectDay wired", () => {
    const { rerender } = render(
      <ForecastTable rows={[]} loading onSelectDay={() => {}} t={t} />
    );
    fireEvent.click(screen.getByText(t("forecastShowDetailsCta")));
    expect(screen.queryByText(t("hazardSourceNoteHeading"))).toBeNull();

    rerender(<ForecastTable rows={[]} error={new Error("x")} onSelectDay={() => {}} t={t} />);
    expect(screen.queryByText(t("hazardSourceNoteHeading"))).toBeNull();
  });
});

describe("ForecastTable — IS dictionary exact labels", () => {
  it("renders the IS caution label and type name", () => {
    const tIs = (k) => translations.is[k] ?? k;
    const rows = [makeRow(0, { windMax: 20 })];
    render(<ForecastTable rows={rows} onSelectDay={() => {}} t={tIs} />);
    fireEvent.click(screen.getByText(tIs("forecastShowDetailsCta")));
    const tr = screen.getAllByRole("button", { name: new RegExp(`^${tIs("day")} Day 1`) })[0];
    expect(tr.getAttribute("aria-label")).toContain(translations.is.routeWarningHigh);
    expect(tr.getAttribute("aria-label")).toContain(translations.is.routeWarnTypeWind);
  });
});
