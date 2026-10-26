// Ticket #444 — CampsiteComparisonSection's daily temperature factor row
// label, relabelled from bare "Temp"/"Hiti" to "High temperature"/
// "Hámarkshiti" (comparisonFactorTemp — confirmed this ticket's sole
// consumer). The row's own data source (raw temperature_2m_max, read
// directly from cached daily data) and verdict threshold are unchanged.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CampsiteComparisonSection from "./CampsiteComparisonSection";
import { getForecast } from "../lib/forecastCache";
import { translations } from "../i18n/translations";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../lib/forecastCache", () => ({ getForecast: vi.fn() }));
vi.mock("../config/availability", () => ({
  getSiteAvailability: () => ({ status: "open" }),
}));

const siteList = [
  { id: "site-current", name: "Þórsmörk", lat: 63.68, lon: -19.5 },
  { id: "site-other", name: "Skaftafell", lat: 64.02, lon: -16.97 },
];

function forecastFixture(tmax) {
  return {
    daily: {
      time: ["2026-07-01"],
      windspeed_10m_max: [5],
      windgusts_10m_max: [8],
      precipitation_sum: [0],
      temperature_2m_max: [tmax],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe("CampsiteComparisonSection — temperature factor label (#444)", () => {
  it("EN: renders 'High temperature' once both sites are selected and forecasts resolve, never bare 'Temp'", async () => {
    getForecast.mockImplementation(({ lat }) =>
      Promise.resolve(lat === 63.68 ? forecastFixture(12) : forecastFixture(16))
    );
    const t = (k) => translations.en[k] ?? k;

    render(
      <CampsiteComparisonSection
        siteList={siteList}
        t={t}
        lang="en"
        currentSiteId="site-current"
        entitlements={{ isPro: true }}
        onUpgrade={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(t("selectCampsite")));
    fireEvent.click(screen.getByText("Skaftafell"));

    await waitFor(() => expect(screen.getByText("High temperature")).toBeInTheDocument());
    expect(screen.queryByText("Temp")).toBeNull();
  });

  it("IS: renders 'Hámarkshiti', never bare 'Hiti'", async () => {
    getForecast.mockImplementation(({ lat }) =>
      Promise.resolve(lat === 63.68 ? forecastFixture(12) : forecastFixture(16))
    );
    const t = (k) => translations.is[k] ?? k;

    render(
      <CampsiteComparisonSection
        siteList={siteList}
        t={t}
        lang="is"
        currentSiteId="site-current"
        entitlements={{ isPro: true }}
        onUpgrade={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(t("selectCampsite")));
    fireEvent.click(screen.getByText("Skaftafell"));

    await waitFor(() => expect(screen.getByText("Hámarkshiti")).toBeInTheDocument());
    expect(screen.queryByText("Hiti")).toBeNull();
  });

  it("the row's own value is still the raw daily temperature_2m_max, unaffected by the relabel", async () => {
    getForecast.mockImplementation(({ lat }) =>
      Promise.resolve(lat === 63.68 ? forecastFixture(12) : forecastFixture(16))
    );
    const t = (k) => translations.en[k] ?? k;

    render(
      <CampsiteComparisonSection
        siteList={siteList}
        t={t}
        lang="en"
        currentSiteId="site-current"
        entitlements={{ isPro: true }}
        onUpgrade={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(t("selectCampsite")));
    fireEvent.click(screen.getByText("Skaftafell"));

    await waitFor(() => expect(screen.getByText("High temperature")).toBeInTheDocument());
    expect(screen.getByText(/12\.0 vs 16\.0/)).toBeInTheDocument();
  });
});
