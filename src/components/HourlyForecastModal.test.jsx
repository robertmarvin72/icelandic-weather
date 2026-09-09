import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HourlyForecastModal from "./HourlyForecastModal";

vi.mock("../lib/forecastCache", () => ({ getForecast: vi.fn() }));
import { getForecast } from "../lib/forecastCache";

const t = (k) => k;
const site = { name: "Test Campsite", lat: 64.1, lon: -21.9 };
const day = { date: "2026-09-08", dayLabel: "Mon" };

function hourlyFixture(entries) {
  return {
    hourly: {
      time: entries.map((e) => `2026-09-08T${String(e.hour).padStart(2, "0")}:00`),
      weathercode: entries.map((e) => e.code),
      temperature_2m: entries.map(() => 10),
      windspeed_10m: entries.map(() => 5),
      windgusts_10m: entries.map(() => 8),
      precipitation: entries.map(() => 0),
      precipitation_probability: entries.map(() => 10),
    },
  };
}

beforeEach(() => vi.clearAllMocks());

describe("HourlyForecastModal — Ticket 402 (#402): unaffected by the daily temporal-narrative layer", () => {
  it("the #402 motivating hourly pattern still shows each real per-hour code, never the daily card's temporal narrative text", async () => {
    getForecast.mockResolvedValue(
      hourlyFixture([
        { hour: 6, code: 55 },
        { hour: 9, code: 0 },
        { hour: 12, code: 0 },
        { hour: 15, code: 0 },
        { hour: 18, code: 0 },
        { hour: 21, code: 0 },
      ]),
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-09-08", dayLabel: "Mon" }} lang="en" t={t} onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText("heavyDrizzle")).toBeInTheDocument());
    // The dry hours still resolve to their own real per-hour text — the
    // modal has no concept of "dry later" at all, by design (approved
    // prompt §3: "does not authorize redesigning or extracting the modal's
    // ... algorithm").
    expect(screen.getAllByText("clearSky").length).toBeGreaterThan(0);
    expect(screen.queryByText("dailySummaryRainEarlyDryLater")).toBeNull();
  });
});

describe("HourlyForecastModal — shared canonical weather presentation (#400)", () => {
  it("resolves a daytime clear-sky hour through the shared mapping (real translated text, real icon)", async () => {
    getForecast.mockResolvedValue(hourlyFixture([{ hour: 12, code: 0 }]));
    render(<HourlyForecastModal site={site} day={day} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("clearSky")).toBeInTheDocument());
    expect(screen.getByRole("img", { name: "clearSky" })).toBeInTheDocument();
  });

  it("resolves a night-hour clear code to the night icon variant, still the same base textKey as the day variant", async () => {
    getForecast.mockResolvedValue(hourlyFixture([{ hour: 0, code: 0 }]));
    render(<HourlyForecastModal site={site} day={day} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("clearSky")).toBeInTheDocument());
    // Label/category is identical to the daytime case above; only the icon
    // variant differs internally (not independently observable via text).
    expect(screen.getByRole("img", { name: "clearSky" })).toBeInTheDocument();
  });

  it("resolves representative rain, snow, fog, and thunder/hail hours through the same table ForecastTable uses", async () => {
    getForecast.mockResolvedValue(
      hourlyFixture([
        { hour: 9, code: 61 },
        { hour: 12, code: 71 },
        { hour: 15, code: 45 },
        { hour: 18, code: 95 },
      ])
    );
    render(<HourlyForecastModal site={site} day={day} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("lightRain")).toBeInTheDocument());
    expect(screen.getByText("lightSnow")).toBeInTheDocument();
    expect(screen.getByText("fog")).toBeInTheDocument();
    expect(screen.getByText("thunderstorm")).toBeInTheDocument();
  });

  it("a null hourly weather code is explicitly unknown, never silently clear sky", async () => {
    getForecast.mockResolvedValue(hourlyFixture([{ hour: 12, code: null }]));
    render(<HourlyForecastModal site={site} day={day} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("unknownWeather")).toBeInTheDocument());
    expect(screen.queryByText("clearSky")).toBeNull();
  });

  it("an unrecognized present code is explicitly unknown, never assigned a real weather meaning", async () => {
    getForecast.mockResolvedValue(hourlyFixture([{ hour: 12, code: 12345 }]));
    render(<HourlyForecastModal site={site} day={day} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("unknownWeather")).toBeInTheDocument());
    expect(screen.queryByText("overcast")).toBeNull();
  });
});

describe("HourlyForecastModal — existing loading/error/empty states unaffected", () => {
  it("shows a loading state before data resolves", () => {
    getForecast.mockReturnValue(new Promise(() => {}));
    render(<HourlyForecastModal site={site} day={day} lang="en" t={t} onClose={() => {}} />);
    expect(screen.getByText(/loading|hleð/i)).toBeInTheDocument();
  });

  it("shows an error state when the forecast fetch fails", async () => {
    getForecast.mockRejectedValue(new Error("network down"));
    render(<HourlyForecastModal site={site} day={day} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("forecastLoadFailed")).toBeInTheDocument());
  });

  it("shows an empty state when there is no hourly data for the selected day", async () => {
    getForecast.mockResolvedValue({ hourly: { time: [] } });
    render(<HourlyForecastModal site={site} day={day} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("noHourlyData")).toBeInTheDocument());
  });

  it("renders nothing when day or site is missing", () => {
    const { container } = render(<HourlyForecastModal site={null} day={day} lang="en" t={t} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
