import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ForecastTable from "./ForecastTable";
import { translations } from "../i18n/translations";

vi.mock("./LoadingShimmer", () => ({ default: () => null }));
vi.mock("./ScoreExplanation", () => ({ default: () => null }));
vi.mock("../config/availability", () => ({ getSiteAvailability: () => null }));

const t = (k) => k;

function baseRow(overrides = {}) {
  return {
    date: "2026-09-14",
    dayLabel: "Mon",
    points: 8,
    basePts: 8,
    windPen: 0,
    rainPen: 0,
    class: "Good",
    code: 61, // raw daily code — deliberately conflicting with the temporal narrative
    tmin: 7,
    tmax: 10,
    windMax: 4.5,
    windGust: null,
    rain: 3.3,
    ...overrides,
  };
}

function renderExpanded(rows, props = {}) {
  render(<ForecastTable rows={rows} onSelectDay={() => {}} t={t} {...props} />);
  fireEvent.click(screen.getByText("forecastShowDetailsCta"));
}

describe("ForecastTable — Ticket 402 (#402): renders the temporal narrative when present", () => {
  it("shows the semantic temporal key, not the raw WMO-family text, and a coherent (non-clear) icon", () => {
    renderExpanded([baseRow({ code: 61, summaryCode: 55, summaryTextKey: "dailySummaryRainEarlyDryLater" })]);
    expect(screen.getByText("dailySummaryRainEarlyDryLater")).toBeInTheDocument();
    // The WMO-family fallback text ("lightRain", from raw code 61) must not
    // also appear — the temporal key fully replaces it, not supplements it.
    expect(screen.queryByText("lightRain")).toBeNull();
    // Accessible icon label matches the same text — no contradictory labels.
    expect(screen.getByRole("img", { name: "dailySummaryRainEarlyDryLater" })).toBeInTheDocument();
  });

  it("getPrecipitationLabel never overwrites a present temporal narrative with a generic amount caption", () => {
    // rain=3.3mm would normally produce a getPrecipitationLabel amount
    // caption for a rain/drizzle family code — but summaryTextKey must win.
    renderExpanded([baseRow({ code: 61, summaryCode: 55, summaryTextKey: "dailySummaryRainEarlyDryLater", rain: 3.3 })]);
    expect(screen.getByText("dailySummaryRainEarlyDryLater")).toBeInTheDocument();
  });

  it("falls back to the existing WMO-family presentation when summaryTextKey is absent (no regression)", () => {
    renderExpanded([baseRow({ code: 3, summaryCode: 0, summaryTextKey: undefined })]);
    expect(screen.getByText("clearSky")).toBeInTheDocument();
    expect(screen.queryByText(/dailySummary/)).toBeNull();
  });

  it("falls back to the existing WMO-family presentation when summaryTextKey is null", () => {
    renderExpanded([baseRow({ code: 3, summaryCode: 0, summaryTextKey: null })]);
    expect(screen.getByText("clearSky")).toBeInTheDocument();
  });

  it("renders the dry-early/rain-later narrative", () => {
    renderExpanded([baseRow({ code: 63, summaryCode: 63, summaryTextKey: "dailySummaryDryEarlyRainLater" })]);
    expect(screen.getByText("dailySummaryDryEarlyRainLater")).toBeInTheDocument();
  });

  it("renders the brief-showers narrative", () => {
    renderExpanded([baseRow({ code: 65, summaryCode: 65, summaryTextKey: "dailySummaryBriefShowers" })]);
    expect(screen.getByText("dailySummaryBriefShowers")).toBeInTheDocument();
  });
});

describe("ForecastTable — Ticket 402: exact EN and IS rendering, no untranslated key leakage", () => {
  it.each(["en", "is"])("%s: all three temporal keys resolve to real translated text", (lang) => {
    const dict = translations[lang];
    const realT = (k) => dict[k] ?? k;

    for (const key of ["dailySummaryRainEarlyDryLater", "dailySummaryDryEarlyRainLater", "dailySummaryBriefShowers"]) {
      const { unmount } = render(
        <ForecastTable
          rows={[baseRow({ code: 61, summaryCode: 55, summaryTextKey: key })]}
          onSelectDay={() => {}}
          t={realT}
          lang={lang}
        />,
      );
      fireEvent.click(screen.getByText(dict.forecastShowDetailsCta));

      expect(dict[key]).toBeTypeOf("string");
      expect(dict[key].length).toBeGreaterThan(0);
      expect(dict[key]).not.toBe(key); // real copy, not a leaked raw key
      expect(screen.getByText(dict[key])).toBeInTheDocument();

      unmount();
    }
  });
});
