import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ForecastTable from "./ForecastTable";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./LoadingShimmer", () => ({ default: () => null }));
vi.mock("./WeatherIcon", () => ({ WeatherIcon: () => null }));
vi.mock("./ScoreExplanation", () => ({ default: () => null }));
vi.mock("../utils/WeatherIconMapping", () => ({ mapWeatherCodeToIconId: () => null }));
vi.mock("../config/availability", () => ({ getSiteAvailability: () => null }));
vi.mock("../utils/precipitation", () => ({ getPrecipitationLabel: () => null }));

function makeRow(i) {
  return {
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    dayLabel: `Day ${i + 1}`,
    points: 50,
    basePts: 40,
    windPen: 5,
    rainPen: 5,
    class: "Good",
    code: 0,
    tmin: 8,
    tmax: 15,
    windMax: 5,
    windGust: null,
    rain: 0,
  };
}

const ROWS = Array.from({ length: 7 }, (_, i) => makeRow(i));
const t = (k) => k;

// Mirrors the handler logic in App.jsx so we can verify the full event chain.
// UX Miði #376 collapsed the table behind a "Sjá nánari veðurspá" disclosure
// by default, so tests that need day-row buttons must expand it first.
function ForecastWithTracking({ rows, siteId = "site-abc" }) {
  function onSelectDay(dayRow, dayIndex) {
    const props = { dayIndex };
    if (dayRow?.date) props.date = dayRow.date;
    if (siteId) props.siteId = siteId;
    trackEvent("forecast_day_opened", props);
  }
  render(<ForecastTable rows={rows} onSelectDay={onSelectDay} t={t} />);
  fireEvent.click(screen.getByText("forecastShowDetailsCta"));
}

describe("forecast_day_opened analytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires with zero-based dayIndex 0 when the first row is clicked", () => {
    ForecastWithTracking({ rows: ROWS });
    const buttons = screen.getAllByRole("button", { name: /^day Day \d/ });
    fireEvent.click(buttons[0]);
    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith("forecast_day_opened", expect.objectContaining({ dayIndex: 0 }));
  });

  it("fires with dayIndex 3 for the 4th row (first of the extended days)", () => {
    ForecastWithTracking({ rows: ROWS });
    const buttons = screen.getAllByRole("button", { name: /^day Day \d/ });
    fireEvent.click(buttons[3]);
    expect(trackEvent).toHaveBeenCalledWith("forecast_day_opened", expect.objectContaining({ dayIndex: 3 }));
  });

  it("fires with dayIndex 6 for the last row", () => {
    ForecastWithTracking({ rows: ROWS });
    const buttons = screen.getAllByRole("button", { name: /^day Day \d/ });
    fireEvent.click(buttons[6]);
    expect(trackEvent).toHaveBeenCalledWith("forecast_day_opened", expect.objectContaining({ dayIndex: 6 }));
  });

  it("dayIndex 3–6 are distinguishable from dayIndex 0–2", () => {
    ForecastWithTracking({ rows: ROWS });
    const buttons = screen.getAllByRole("button", { name: /^day Day \d/ });
    fireEvent.click(buttons[2]);
    const lastFreeCall = trackEvent.mock.calls.at(-1)[1];
    vi.clearAllMocks();
    fireEvent.click(buttons[3]);
    const firstExtendedCall = trackEvent.mock.calls.at(-1)[1];
    expect(lastFreeCall.dayIndex).toBe(2);
    expect(firstExtendedCall.dayIndex).toBe(3);
    expect(firstExtendedCall.dayIndex).toBeGreaterThan(lastFreeCall.dayIndex);
  });

  it("fires via keyboard Enter activation", () => {
    ForecastWithTracking({ rows: ROWS });
    const buttons = screen.getAllByRole("button", { name: /^day Day \d/ });
    fireEvent.keyDown(buttons[0], { key: "Enter" });
    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith("forecast_day_opened", expect.objectContaining({ dayIndex: 0 }));
  });

  it("fires via keyboard Space activation", () => {
    ForecastWithTracking({ rows: ROWS });
    const buttons = screen.getAllByRole("button", { name: /^day Day \d/ });
    fireEvent.keyDown(buttons[1], { key: " " });
    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith("forecast_day_opened", expect.objectContaining({ dayIndex: 1 }));
  });

  it("includes date and siteId in the event", () => {
    ForecastWithTracking({ rows: ROWS, siteId: "my-site" });
    const buttons = screen.getAllByRole("button", { name: /^day Day \d/ });
    fireEvent.click(buttons[0]);
    expect(trackEvent).toHaveBeenCalledWith(
      "forecast_day_opened",
      expect.objectContaining({ date: "2026-07-01", siteId: "my-site" })
    );
  });

  it("sends no undefined, null, or empty-string properties", () => {
    ForecastWithTracking({ rows: ROWS, siteId: "s1" });
    const buttons = screen.getAllByRole("button", { name: /^day Day \d/ });
    fireEvent.click(buttons[0]);
    const props = trackEvent.mock.calls[0][1];
    for (const [key, val] of Object.entries(props)) {
      expect(val, `property "${key}" must not be undefined`).not.toBeUndefined();
      expect(val, `property "${key}" must not be null`).not.toBeNull();
      expect(val, `property "${key}" must not be empty string`).not.toBe("");
    }
  });
});

describe("ForecastTable — supporting-detail disclosure (UX Miði #376)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is collapsed by default — no day rows, entrypoint CTA shown with aria-expanded=false", () => {
    render(<ForecastTable rows={ROWS} onSelectDay={() => {}} t={t} />);
    expect(screen.queryByRole("button", { name: /^day Day \d/ })).toBeNull();
    const cta = screen.getByText("forecastShowDetailsCta");
    expect(cta.closest("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("clicking the entrypoint reveals the day rows and a hide affordance", () => {
    render(<ForecastTable rows={ROWS} onSelectDay={() => {}} t={t} />);
    fireEvent.click(screen.getByText("forecastShowDetailsCta"));
    expect(screen.getAllByRole("button", { name: /^day Day \d/ })).toHaveLength(7);
    const hideBtn = screen.getByText("forecastHideDetailsCta");
    expect(hideBtn.closest("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("clicking hide collapses the table again", () => {
    render(<ForecastTable rows={ROWS} onSelectDay={() => {}} t={t} />);
    fireEvent.click(screen.getByText("forecastShowDetailsCta"));
    fireEvent.click(screen.getByText("forecastHideDetailsCta"));
    expect(screen.queryByRole("button", { name: /^day Day \d/ })).toBeNull();
    expect(screen.getByText("forecastShowDetailsCta")).toBeDefined();
  });

  it("expanding never fires forecast_day_opened by itself — only a row click does", () => {
    render(<ForecastTable rows={ROWS} onSelectDay={() => trackEvent("forecast_day_opened", {})} t={t} />);
    fireEvent.click(screen.getByText("forecastShowDetailsCta"));
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
