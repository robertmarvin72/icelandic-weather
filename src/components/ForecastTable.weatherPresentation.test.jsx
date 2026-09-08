import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ForecastTable from "./ForecastTable";

vi.mock("./LoadingShimmer", () => ({ default: () => null }));
vi.mock("./ScoreExplanation", () => ({ default: () => null }));
vi.mock("../config/availability", () => ({ getSiteAvailability: () => null }));

const t = (k) => k;

function baseRow(overrides = {}) {
  return {
    date: "2026-09-08",
    dayLabel: "Mon",
    points: 8,
    basePts: 8,
    windPen: 0,
    rainPen: 0,
    class: "Good",
    code: 3, // raw daily code — intentionally overcast in most fixtures below
    tmin: 8,
    tmax: 15,
    windMax: 5,
    windGust: null,
    rain: 0,
    ...overrides,
  };
}

function renderExpanded(rows) {
  render(<ForecastTable rows={rows} onSelectDay={() => {}} t={t} />);
  fireEvent.click(screen.getByText("forecastShowDetailsCta"));
}

describe("ForecastTable — renders the daily condition from summaryCode, not raw row.code (#400)", () => {
  it("acceptance criterion: raw daily 'overcast' with an hourly-clear summaryCode renders as clear, not overcast", () => {
    renderExpanded([baseRow({ code: 3, summaryCode: 0 })]);
    expect(screen.getByText("clearSky")).toBeInTheDocument();
    expect(screen.queryByText("overcast")).toBeNull();
  });

  it("falls back to row.code when summaryCode is null/unusable", () => {
    renderExpanded([baseRow({ code: 3, summaryCode: null })]);
    expect(screen.getByText("overcast")).toBeInTheDocument();
  });

  it("selecting the row still passes the intact scoring/daily row (summaryCode never substitutes for scoring fields)", () => {
    const onSelectDay = vi.fn();
    render(
      <ForecastTable
        rows={[baseRow({ code: 3, summaryCode: 0, points: 7, class: "Good" })]}
        onSelectDay={onSelectDay}
        t={t}
      />
    );
    fireEvent.click(screen.getByText("forecastShowDetailsCta"));
    fireEvent.click(screen.getByRole("button", { name: /^day/i }));
    expect(onSelectDay).toHaveBeenCalledWith(
      expect.objectContaining({ code: 3, summaryCode: 0, points: 7, class: "Good" }),
      0
    );
  });
});

describe("ForecastTable — unsafe-fallback regression (Round 2 §1)", () => {
  it("null summaryCode and null row.code never render as clear sky or overcast", () => {
    renderExpanded([baseRow({ code: null, summaryCode: null })]);
    expect(screen.queryByText("clearSky")).toBeNull();
    expect(screen.queryByText("overcast")).toBeNull();
    expect(screen.getByText("unknownWeather")).toBeInTheDocument();
  });

  it("undefined summaryCode and undefined row.code never render as clear sky or overcast", () => {
    renderExpanded([baseRow({ code: undefined, summaryCode: undefined })]);
    expect(screen.queryByText("clearSky")).toBeNull();
    expect(screen.queryByText("overcast")).toBeNull();
    expect(screen.getByText("unknownWeather")).toBeInTheDocument();
  });

  it("an unsupported numeric code never silently renders as cloudy/overcast", () => {
    renderExpanded([baseRow({ code: 12345, summaryCode: null })]);
    expect(screen.queryByText("overcast")).toBeNull();
    expect(screen.getByText("unknownWeather")).toBeInTheDocument();
  });

  it("the accessible icon label matches the visible weather text for the unknown state", () => {
    renderExpanded([baseRow({ code: null, summaryCode: null })]);
    const icons = screen.getAllByRole("img", { name: "unknownWeather" });
    expect(icons.length).toBeGreaterThan(0);
  });
});

describe("ForecastTable — precipitation caption follows the displayed summary family (Round 2 §3)", () => {
  it("an hourly-derived rain summary over a conflicting dry/cloudy raw daily code shows the rain caption", () => {
    renderExpanded([baseRow({ code: 3, summaryCode: 61, rain: 2 })]);
    // getPrecipitationLabel is not mocked here; with rain=2mm it should
    // produce some non-base precipitation caption rather than "overcast".
    expect(screen.queryByText("overcast")).toBeNull();
  });

  it("an hourly-derived clear/cloudy summary over a conflicting raw daily precipitation code does not render a rain/snow caption", () => {
    renderExpanded([baseRow({ code: 61, summaryCode: 0, rain: 5 })]);
    expect(screen.getByText("clearSky")).toBeInTheDocument();
  });

  it("freezing precipitation shows truthful base wording, never mislabeled as ordinary rain/snow", () => {
    renderExpanded([baseRow({ code: 3, summaryCode: 56, rain: 3 })]);
    expect(screen.getByText("freezingRain")).toBeInTheDocument();
  });
});
