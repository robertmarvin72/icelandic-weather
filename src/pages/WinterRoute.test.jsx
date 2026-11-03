// src/pages/WinterRoute.test.jsx — Ticket #486
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WinterRoute from "./WinterRoute";
import { translations } from "../i18n/translations";
import { formatDecimal } from "../lib/winterRoutePresentation";

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

function makeSegment(idButur, overrides = {}) {
  return {
    idButur,
    nameIs: `Kafli ${idButur}`,
    nameEn: `Section ${idButur}`,
    segmentDataAvailable: true,
    category: "passable",
    positiveStyleEligible: true,
    astandYfirbord: "GREIDFAERT",
    astandVidbotaruppl: null,
    astandLysing: "Greiðfært",
    astandLysingEn: "Easily passable",
    export: { dagsKeyrtUt: "2026-11-03T17:59:00Z", ageMinutes: 1, isStale: false },
    registration: { dagsSkrad: "2026-11-03T17:55:00Z", ageHours: 0.1, isOld: false },
    notices: [],
    ...overrides,
  };
}

// Computed from the real clock at test-run time (not a fixed calendar
// date) so these fixtures stay "in the future" regardless of when the
// suite actually runs.
function pad2(n) {
  return String(n).padStart(2, "0");
}
function futureHourString(offsetHours) {
  const d = new Date(Date.now() + offsetHours * 3600000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:00`;
}
const FUTURE_HOURS = [futureHourString(2), futureHourString(3)];

function makeForecastPoint(id, overrides = {}) {
  const hours = FUTURE_HOURS;
  return {
    id,
    labelIs: `Punktur ${id}`,
    labelEn: `Point ${id}`,
    nearIdButur: 252090037,
    available: true,
    requestedLat: 64,
    requestedLon: -21,
    returnedLatitude: 64,
    returnedLongitude: -21,
    elevation: 100,
    hours,
    series: {
      temperature_2m: [-1.2, -0.8],
      wind_speed_10m: [4.5, 5.1],
      wind_gusts_10m: [7.1, 7.9],
      precipitation: [0, 0.4],
      weather_code: [3, 71],
    },
    ...overrides,
  };
}

function makePayload(overrides = {}) {
  const segments = Array.from({ length: 13 }, (_, i) => makeSegment(100000000 + i));
  const points = ["P1", "P2", "P3", "P4", "P5", "P6"].map((id) => makeForecastPoint(id));
  return {
    generatedAt: "2026-11-03T18:00:00.000Z",
    segments,
    roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true },
    forecast: {
      available: true,
      window: { startHour: FUTURE_HOURS[0], endHour: FUTURE_HOURS[1], expectedHours: FUTURE_HOURS },
      points,
      stale: false,
      cacheAgeMs: 0,
    },
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/winter-route"]}>
      <WinterRoute />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("WinterRoute page", () => {
  it("renders the title and subtitle from real translations and fetches /api/winter-route exactly once", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() });
    vi.stubGlobal("fetch", fetchMock);

    renderPage();

    expect(screen.getByText(translations.is.winterRouteTitle)).toBeInTheDocument();
    expect(screen.getByText(translations.is.winterRouteSubtitle)).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/winter-route");
  });

  it("renders all 13 segments once loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
    renderPage();

    await waitFor(() => expect(screen.getAllByText(/Kafli 1/).length).toBeGreaterThan(0));
    for (let i = 0; i < 13; i++) {
      expect(screen.getByText(`Kafli ${100000000 + i}`)).toBeInTheDocument();
    }
  });

  it("a closed segment shows the closed label regardless of the other passable segments", async () => {
    const payload = makePayload();
    payload.segments[3] = makeSegment(999, { category: "closed", positiveStyleEligible: false });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    await waitFor(() => expect(screen.getByText("Kafli 999")).toBeInTheDocument());
    const row = screen.getByText("Kafli 999").closest("li");
    expect(within(row).getByText(translations.is.winterRouteCategoryClosed)).toBeInTheDocument();
  });

  it("selecting a different hour in the picker does not trigger a second fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() });
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
    // Wait for the auto-select-first-hour effect to actually settle (one
    // render pass after the label/select themselves appear) before
    // interacting with it, so this test's own fireEvent isn't racing that
    // effect's own pending setSelectedHour() call.
    await waitFor(() => expect(select.value).toBe(FUTURE_HOURS[0]));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(select, { target: { value: FUTURE_HOURS[1] } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the forecast-unavailable message and no hour picker when forecast.available is false", async () => {
    const payload = makePayload({ forecast: { available: false, reason: "key_missing", points: [] } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    await waitFor(() => expect(screen.getByText(translations.is.winterRouteForecastUnavailable)).toBeInTheDocument());
    expect(screen.queryByLabelText(translations.is.winterRouteHourLabel)).toBeNull();
  });

  it("shows the same selected hour's data on all six forecast cards, and switching hours updates all six together", async () => {
    const payload = makePayload();
    // Distinct per-point values keyed by index, so a shared hourIndex is
    // actually observable (not masked by identical fixture data).
    payload.forecast.points.forEach((p, i) => {
      p.series.temperature_2m = [i, i + 100];
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
    // Hour index 0: each card's temperature equals its own point index.
    // Waited together (not a bare synchronous assertion right after
    // finding the label) — the label/select appear on the same render
    // pass `data` itself arrives, one pass BEFORE the follow-up effect
    // that resolves `selectedHour`/`hourIndex` and actually populates
    // these per-hour values, so asserting immediately races that effect.
    await waitFor(() => {
      for (let i = 0; i < 6; i++) {
        expect(screen.getByText(`${formatDecimal(i, "is", 1)} °C`)).toBeInTheDocument();
      }
    });

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(select, { target: { value: FUTURE_HOURS[1] } });

    // Hour index 1: every card moves to its +100 value together.
    await waitFor(() => {
      for (let i = 0; i < 6; i++) {
        expect(screen.getByText(`${formatDecimal(i + 100, "is", 1)} °C`)).toBeInTheDocument();
      }
    });
  });

  it("Round 2 (R1b): shows a visible warning when the points feed is unavailable/stale, without hiding segment data", async () => {
    const payload = makePayload();
    payload.roadMeta.pointsFeedUnavailableOrStale = true;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(translations.is.winterRoutePointsFeedUnavailable)).toBeInTheDocument()
    );
    // Segment rows are still rendered, not hidden by the warning.
    expect(screen.getByText("Kafli 100000000")).toBeInTheDocument();
  });

  it("does not show the points-feed warning when the points feed is fine", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
    renderPage();

    await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
    expect(screen.queryByText(translations.is.winterRoutePointsFeedUnavailable)).toBeNull();
  });

  it("Round 2 (R3): shows a 'last known forecast' line with the real age when forecast.stale is true", async () => {
    const payload = makePayload();
    payload.forecast.stale = true;
    payload.forecast.cacheAgeMs = 20 * 60 * 1000;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    // Wait for the state that settles LAST (the hour-select effect, one
    // render pass after `data` itself arrives) rather than the stale
    // message alone — the message renders on the very first pass once
    // `data` loads, before the follow-up effect that resolves
    // `selectedHour`/`hourIndex` and populates the per-hour card values;
    // asserting on the earlier-settling text alone raced the later one.
    await waitFor(() => expect(screen.getAllByText(`${formatDecimal(-1.2, "is", 1)} °C`)).toHaveLength(6));
    const expected = translations.is.winterRouteForecastStaleServed.replace("{minutes}", "20");
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("does not show the stale-forecast line when forecast.stale is false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
    renderPage();

    await screen.findByLabelText(translations.is.winterRouteHourLabel);
    expect(screen.queryByText(/winterRouteForecastStaleServed/)).toBeNull();
  });

  it("Round 2 (R4): the gust label states it is the maximum of the previous hour, on both IS and EN", () => {
    expect(translations.is.winterRouteGust).toMatch(/hámark síðustu klukkustundar/);
    expect(translations.en.winterRouteGust).toMatch(/max, previous hour/i);
  });

  it("renders in English when lang is set to en", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
    renderPage();

    expect(await screen.findByText(translations.en.winterRouteTitle)).toBeInTheDocument();
    expect(screen.getByText(translations.en.winterRouteSubtitle)).toBeInTheDocument();
  });

  it("Round 3 (R5-1): a lone expired closure notice shows the prominent dedicated text, on IS and EN", async () => {
    for (const lang of ["is", "en"]) {
      localStorage.clear();
      if (lang === "en") localStorage.setItem("lang", JSON.stringify("en"));
      const payload = makePayload();
      payload.segments[0] = makeSegment(100000000, {
        category: "hazard_notice",
        positiveStyleEligible: false,
        notices: [
          {
            idPunktur: 1,
            astand: "ALLUR_AKSTUR_BANN",
            category: "closed",
            lysing: "Lokað",
            lysingEn: "Closed",
            dagsSkrad: "2026-01-01T00:00:00Z",
            gildirTil: "2026-01-02T00:00:00Z",
            status: "expired",
          },
        ],
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      const { unmount } = renderPage();

      const dict = translations[lang];
      await waitFor(() => expect(screen.getByText(dict.winterRouteExpiredClosureNoticeProminent)).toBeInTheDocument());
      expect(screen.queryByText(dict.winterRouteNoticeExpired)).toBeNull();
      unmount();
    }
  });

  it("Round 3 (R5-1): an expired notice alongside a currently-closed segment keeps the closed label prominent, without losing the expired marker", async () => {
    const payload = makePayload();
    payload.segments[0] = makeSegment(100000000, {
      category: "closed",
      positiveStyleEligible: false,
      notices: [
        {
          idPunktur: 1,
          astand: "ALLUR_AKSTUR_BANN",
          category: "closed",
          lysing: "Lokað (eldra)",
          lysingEn: "Closed (older)",
          dagsSkrad: "2026-01-01T00:00:00Z",
          gildirTil: "2026-01-02T00:00:00Z",
          status: "expired",
        },
      ],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    const row = await screen.findByText("Kafli 100000000").then((el) => el.closest("li"));
    expect(within(row).getByText(translations.is.winterRouteCategoryClosed)).toBeInTheDocument();
    // The individual notice is still marked expired (not hidden), just
    // without the extra prominence — the status text is appended inline
    // after an em dash, so it's checked via textContent rather than
    // getByText (which only matches a single text node).
    expect(row.textContent).toContain(translations.is.winterRouteNoticeExpired);
    expect(within(row).queryByText(translations.is.winterRouteExpiredClosureNoticeProminent)).toBeNull();
  });

  it("Round 3 (R5-2): the points-feed warning includes the official Vegagerðin link", async () => {
    const payload = makePayload();
    payload.roadMeta.pointsFeedUnavailableOrStale = true;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    const warningText = await screen.findByText(translations.is.winterRoutePointsFeedUnavailable);
    const warningBox = warningText.closest("div");
    const link = within(warningBox).getByText(translations.is.winterRouteOfficialSourceLinkRoad);
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/"
    );
  });
});
