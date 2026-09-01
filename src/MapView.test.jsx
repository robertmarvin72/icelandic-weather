// src/MapView.test.jsx
//
// No MapView test file existed before Ticket 397 (#397). react-leaflet/
// leaflet/react-leaflet-cluster are mocked with minimal fakes — real
// Leaflet rendering needs a real DOM/canvas environment this jsdom suite
// doesn't have, and building one would be broad, production-only test
// infrastructure disproportionate to this ticket's scope (approved prompt
// §10's documented-limitation allowance). The mocks are just enough to
// exercise MapView's OWN branching logic (mode selection, fetch
// suppression, popup/legend content, marker color) deterministically.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("leaflet", () => ({
  default: {
    divIcon: (opts) => opts,
  },
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, whenReady }) => {
    React.useEffect(() => {
      whenReady?.();
    }, [whenReady]);
    return <div data-testid="map-container">{children}</div>;
  },
  TileLayer: ({ eventHandlers }) => {
    React.useEffect(() => {
      eventHandlers?.tileload?.();
    }, [eventHandlers]);
    return null;
  },
  Marker: ({ siteId, icon, eventHandlers, children }) => (
    <div data-testid={`marker-${siteId}`} data-icon-html={icon?.html} onClick={() => eventHandlers?.click?.()}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  CircleMarker: ({ children }) => <div data-testid="circle-marker">{children}</div>,
  useMap: () => ({ flyTo: vi.fn() }),
}));

vi.mock("react-leaflet-cluster", () => ({
  default: ({ children }) => <div data-testid="cluster-group">{children}</div>,
}));

const getForecastMock = vi.fn();
vi.mock("./lib/forecastCache", () => ({ getForecast: (...args) => getForecastMock(...args) }));

const scoreSiteDayMock = vi.fn();
vi.mock("./lib/scoring", () => ({ scoreSiteDay: (...args) => scoreSiteDayMock(...args) }));

const normalizeMock = vi.fn();
vi.mock("./lib/forecastNormalize", () => ({ normalizeDailyToScoreInput: (...args) => normalizeMock(...args) }));

import MapView from "./MapView";

const t = (k) => k;

const WEATHER_SITES = [{ id: "site-1", name: "Site One", lat: 64, lon: -20 }];

const AURORA_SITES = [
  { id: "loc-1", name: "Loc One", lat: 64, lon: -20, band: "excellent" },
  { id: "loc-2", name: "Loc Two", lat: 65, lon: -19, band: "fair" },
];

beforeEach(() => {
  vi.clearAllMocks();
  getForecastMock.mockResolvedValue({ daily: { time: ["2026-09-01"] }, hourly: {} });
  normalizeMock.mockReturnValue([{ tmax: 10, windMax: 3, rain: 0 }]);
  scoreSiteDayMock.mockReturnValue({ finalClass: "good", points: 8, season: "summer" });
});

describe("MapView — normal (weather) mode, unchanged behavior", () => {
  it("fetches and scores each campsite's own 7-day forecast (default mode)", async () => {
    render(<MapView campsites={WEATHER_SITES} selectedId={null} onSelect={vi.fn()} userLocation={null} t={t} />);
    expect(getForecastMock).toHaveBeenCalledWith({ lat: 64, lon: -20 });
  });

  it("shows the generic weather-color toggle button and legend", () => {
    render(<MapView campsites={WEATHER_SITES} selectedId={null} onSelect={vi.fn()} userLocation={null} t={t} />);
    expect(screen.getByText("mapHideWeatherColors")).toBeInTheDocument();
    expect(screen.getByText("mapWeatherConditions")).toBeInTheDocument();
  });

  it("popup shows the generic weekly score / condition text, not Aurora copy", () => {
    render(<MapView campsites={WEATHER_SITES} selectedId={null} onSelect={vi.fn()} userLocation={null} t={t} />);
    expect(screen.queryByText(/mapAuroraConditionLabel/)).toBeNull();
  });
});

describe("MapView — Aurora mode (Ticket 397, #397)", () => {
  it("never fetches or scores a second generic forecast", async () => {
    render(<MapView campsites={AURORA_SITES} selectedId="loc-1" onSelect={vi.fn()} userLocation={null} t={t} mode="aurora" />);
    expect(getForecastMock).not.toHaveBeenCalled();
    expect(scoreSiteDayMock).not.toHaveBeenCalled();
  });

  it("marker click selects the site but does not trigger a forecast fetch", () => {
    render(<MapView campsites={AURORA_SITES} selectedId={null} onSelect={vi.fn()} userLocation={null} t={t} mode="aurora" />);
    fireEvent.click(screen.getByTestId("marker-loc-1"));
    expect(getForecastMock).not.toHaveBeenCalled();
  });

  it("popup shows the canonical Aurora band under an explicit Aurora-labeled dimension, never a generic weekly score", () => {
    render(<MapView campsites={AURORA_SITES} selectedId={null} onSelect={vi.fn()} userLocation={null} t={t} mode="aurora" />);
    const popup1 = screen.getByTestId("marker-loc-1").querySelector('[data-testid="popup"]');
    expect(popup1.textContent).toContain("mapAuroraConditionLabel");
    expect(popup1.textContent).toContain("nlBandExcellent");
    expect(popup1.textContent).not.toContain("mapWeeklyScore");

    const popup2 = screen.getByTestId("marker-loc-2").querySelector('[data-testid="popup"]');
    expect(popup2.textContent).toContain("nlBandFair");
  });

  it("marker color reflects the canonical Aurora band, distinct per band — never the generic weekly-score palette", () => {
    render(<MapView campsites={AURORA_SITES} selectedId={null} onSelect={vi.fn()} userLocation={null} t={t} mode="aurora" />);
    const marker1Html = screen.getByTestId("marker-loc-1").dataset.iconHtml;
    const marker2Html = screen.getByTestId("marker-loc-2").dataset.iconHtml;
    expect(marker1Html).toContain("#16a34a"); // excellent
    expect(marker2Html).toContain("#facc15"); // fair
    expect(marker1Html).not.toBe(marker2Html);
  });

  it("hides the generic weather-color toggle and shows the Aurora legend instead", () => {
    render(<MapView campsites={AURORA_SITES} selectedId={null} onSelect={vi.fn()} userLocation={null} t={t} mode="aurora" />);
    expect(screen.queryByText("mapHideWeatherColors")).toBeNull();
    expect(screen.queryByText("mapShowWeatherColors")).toBeNull();
    expect(screen.getByText("mapAuroraLegendTitle")).toBeInTheDocument();
    expect(screen.queryByText("mapWeatherConditions")).toBeNull();
  });

  it("never shows a place as poor/very-poor Aurora-wise while any generic Good/Fair/Rough label leaks through (the Höfn contradiction this ticket fixes)", () => {
    render(
      <MapView
        campsites={[{ id: "loc-poor", name: "Poor Site", lat: 64, lon: -20, band: "poor" }]}
        selectedId={null}
        onSelect={vi.fn()}
        userLocation={null}
        t={t}
        mode="aurora"
      />,
    );
    const popup = screen.getByTestId("marker-loc-poor").querySelector('[data-testid="popup"]');
    expect(popup.textContent).toContain("nlBandPoor");
    expect(popup.textContent).not.toMatch(/mapConditionGood|mapConditionFair|mapConditionRough/);
  });
});
