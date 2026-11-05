// src/pages/WinterRoute.test.jsx — Ticket #486
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WinterRoute from "./WinterRoute";
import { translations } from "../i18n/translations";
import { formatDecimal } from "../lib/winterRoutePresentation";
import { WINTER_ROUTE_OPTIONS } from "../lib/winterRouteRoutes";

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

// ETA follow-up (#486): distance 0 resolves (at departure = FUTURE_HOURS[0],
// the auto-selected first available hour) to hour index 0 — i.e. the
// "estimated arrival" lands exactly on the departure hour itself, the
// simplest, most predictable default for tests that aren't specifically
// about per-point ETA resolution. 70 km at the fixed 70 km/h assumption
// resolves to exactly +1h -> hour index 1.
function makeForecastPoint(id, overrides = {}) {
  const hours = FUTURE_HOURS;
  return {
    id,
    labelIs: `Punktur ${id}`,
    labelEn: `Point ${id}`,
    nearIdButur: 252090037,
    approxDistanceFromStartKm: 0,
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
    routeId: "raudavatn-vik",
    expectedPointCount: 6,
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

// #490 added a departure-time comparison area that can render its own copy
// of the same "Mestar hviður"/"Mest úrkoma"/"Lægsti hiti" metric lines (one
// per available option) alongside the #489 route-level summary — scope a
// query to the summary's own <section> (found via its stable heading) when
// a test cares specifically about the summary, not the comparison area.
function getSummarySection() {
  return screen.getByText(translations.is.winterRouteSummaryHeading).closest("section");
}

beforeEach(() => {
  localStorage.clear();
});

describe("WinterRoute page", () => {
  it("renders the title and subtitle from real translations and fetches /api/winter-route exactly once", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() });
    vi.stubGlobal("fetch", fetchMock);

    renderPage();

    // Ticket #491, V1 — h1 comes from the selected WINTER_ROUTE_OPTIONS
    // entry (Vík is the default), not a fixed translation key. Checked via
    // role/level (not getByText) since the route <select>'s own Vík
    // <option> now reads the identical text.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      WINTER_ROUTE_OPTIONS.find((o) => o.routeId === "raudavatn-vik").nameIs
    );
    expect(screen.getByText(translations.is.winterRouteSubtitle)).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // Ticket #491 — the request now also carries an AbortController signal
    // (route-switch isolation); only the URL itself matters for "default
    // Vík request stays exactly /api/winter-route, no query string".
    expect(fetchMock.mock.calls[0][0]).toBe("/api/winter-route");
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

  it("ETA follow-up: each card resolves its OWN forecast hour from its own distance, not a single shared hour", async () => {
    const payload = makePayload();
    // Distinct per-point values keyed by index, so each point's own
    // resolved hour is independently observable. Even-indexed points get
    // distance 0 (resolve to hour index 0 at the departure itself);
    // odd-indexed points get 70 km (resolve to hour index 1, +1h at the
    // fixed 70 km/h assumption) — deliberately NOT uniform, the opposite
    // of #486's original "same hour on every card" design.
    payload.forecast.points.forEach((p, i) => {
      p.approxDistanceFromStartKm = i % 2 === 0 ? 0 : 70;
      p.series.temperature_2m = [i, i + 100];
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    await screen.findByLabelText(translations.is.winterRouteHourLabel);
    // Waited together, not asserted synchronously right after the label
    // appears — the label/select appear on the same render pass `data`
    // itself arrives, one pass BEFORE the follow-up effect that resolves
    // `selectedHour` (the departure) and actually populates these values.
    await waitFor(() => {
      for (let i = 0; i < 6; i++) {
        const expectedTemp = i % 2 === 0 ? i : i + 100;
        expect(screen.getByText(`${formatDecimal(expectedTemp, "is", 1)} °C`)).toBeInTheDocument();
      }
    });
  });

  it("ETA follow-up: a point whose computed arrival falls outside the fetched window shows 'forecast not available', never wraps or guesses", async () => {
    const payload = makePayload();
    // 24h * 70 km/h at departure = FUTURE_HOURS[0] lands far past
    // FUTURE_HOURS[1], the last entry in this fixture's (deliberately
    // short, 2-entry) hours array.
    payload.forecast.points[0].approxDistanceFromStartKm = 24 * 70;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    const dict = translations.is;
    await waitFor(() =>
      expect(screen.getByText(dict.winterRouteForecastNotAvailableAtComputedTime)).toBeInTheDocument()
    );
  });

  it("ETA follow-up: a point with no derivable distance shows 'forecast not available' and no estimated-arrival line, never guessed", async () => {
    const payload = makePayload();
    payload.forecast.points[0].approxDistanceFromStartKm = null;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    const dict = translations.is;
    await waitFor(() =>
      expect(screen.getByText(dict.winterRouteForecastNotAvailableAtComputedTime)).toBeInTheDocument()
    );
    const card = screen.getByText("Punktur P1").closest(".rounded-xl");
    expect(within(card).queryByText(/Áætluð koma/)).toBeNull();
  });

  it("ETA follow-up: shows both the estimated arrival time and the forecast's own valid time on a card", async () => {
    const payload = makePayload();
    // 35 km at 70 km/h = 30 min -> raw arrival is FUTURE_HOURS[0] + 30min
    // (a real, off-the-hour instant), but the forecast shown is for the
    // next whole hour, FUTURE_HOURS[1] — the two lines must show
    // DIFFERENT values when this happens, which is the whole point of
    // showing both.
    payload.forecast.points[0].approxDistanceFromStartKm = 35;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    renderPage();

    await screen.findByLabelText(translations.is.winterRouteHourLabel);
    const expectedArrival = translations.is.winterRouteEstimatedArrival.replace(
      "{time}",
      `${FUTURE_HOURS[0].slice(8, 10)}.${FUTURE_HOURS[0].slice(5, 7)} ${FUTURE_HOURS[0].slice(11, 13)}:30`
    );
    const expectedValidFor = translations.is.winterRouteValidFor.replace(
      "{time}",
      `${FUTURE_HOURS[1].slice(8, 10)}.${FUTURE_HOURS[1].slice(5, 7)} ${FUTURE_HOURS[1].slice(11, 16)}`
    );
    await waitFor(() => {
      expect(screen.getByText(expectedArrival)).toBeInTheDocument();
      expect(screen.getByText(expectedValidFor)).toBeInTheDocument();
    });
  });

  it("the departure-time picker is labeled as a departure time, not a generic time", () => {
    expect(translations.is.winterRouteHourLabel).toBe("Áætlaður brottfarartími");
    expect(translations.en.winterRouteHourLabel).toBe("Estimated departure time");
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
    // The same stale-forecast line now appears three times by design: the
    // #489 route-level summary, the original forecast-section warning
    // (unchanged), and the #490 departure comparison area (S6) — each
    // keeps the existing warning in place rather than removing it.
    expect(screen.getAllByText(expected)).toHaveLength(3);
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

    // Ticket #491, V1 — h1 in English comes from nameEn, not a fixed key.
    // Checked via role/level since the EN <option> text is identical.
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        WINTER_ROUTE_OPTIONS.find((o) => o.routeId === "raudavatn-vik").nameEn
      )
    );
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

  describe("#489 — route-level summary", () => {
    it("renders the three weather extrema with point label and resolved time, and the notice count with its fixed scope wording", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
      renderPage();

      await screen.findByLabelText(translations.is.winterRouteHourLabel);

      // All six points share identical fixture series/distance, so every
      // metric's winner is P1 (first in route order) at the departure
      // hour itself (distance 0 -> hour index 0). Asserted on the stable
      // PARTS (value/point/unit) rather than the whole interpolated
      // string, since the time portion depends on the real clock the
      // suite happens to run at.
      await screen.findByText(translations.is.winterRouteSummaryHeading);
      const summary = within(getSummarySection());

      const gustLine = summary.getByText((text) => text.startsWith("Mestar hviður"));
      expect(gustLine.textContent).toContain(`${formatDecimal(7.1, "is", 1)} m/s`);
      expect(gustLine.textContent).toContain("Punktur P1");

      const precipLine = summary.getByText((text) => text.startsWith("Mest úrkoma"));
      expect(precipLine.textContent).toContain(`${formatDecimal(0, "is", 1)} mm`);

      const tempLine = summary.getByText((text) => text.startsWith("Lægsti hiti"));
      expect(tempLine.textContent).toContain(`${formatDecimal(-1.2, "is", 1)} °C`);

      expect(summary.getByText("Kaflar með gildar tilkynningar: 0")).toBeInTheDocument();
      expect(summary.getByText(translations.is.winterRouteSummaryNoticeScope)).toBeInTheDocument();
    });

    it("S2: the summary's gust/precip lines reuse the exact same period wording as the cards", async () => {
      expect(translations.is.winterRouteSummaryGust).toContain("hámark síðustu klukkustundar");
      expect(translations.is.winterRouteSummaryPrecip).toContain("síðasta klukkustund");
      expect(translations.en.winterRouteSummaryGust).toContain("max, previous hour");
      expect(translations.en.winterRouteSummaryPrecip).toContain("previous hour");
    });

    it("S3: the summary shows the same generatedAt acquisition time as the attribution section, with the existing formatter/key", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
      renderPage();

      const expected = translations.is.winterRouteAcquiredAt.replace("{time}", "2026-11-03 18:00");
      // Appears twice by design — once in the new summary, once (unchanged)
      // in the existing bottom attribution section.
      await waitFor(() => expect(screen.getAllByText(expected)).toHaveLength(2));
    });

    it("changing the departure time updates the summary and the cards together, from the same already-fetched data (no extra fetch)", async () => {
      const payload = makePayload();
      // Distinct per-point values (same pattern as the existing ETA cards
      // test) so each point's own resolved value is independently
      // observable, rather than masked by identical fixture data.
      payload.forecast.points.forEach((p, i) => {
        p.series.temperature_2m = [i - 10, i - 10 + 100];
      });
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
      await waitFor(() => expect(select.value).toBe(FUTURE_HOURS[0]));

      // Hour index 0: min temp across identical-distance points is P1's -10
      // (the lowest of -10, -9, -8, -7, -6, -5).
      await waitFor(() => {
        const tempLine = within(getSummarySection()).getByText((text) => text.startsWith("Lægsti hiti"));
        expect(tempLine.textContent).toContain(`${formatDecimal(-10, "is", 1)} °C`);
        expect(tempLine.textContent).toContain("Punktur P1");
      });

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(select, { target: { value: FUTURE_HOURS[1] } });

      // Hour index 1: every point's own temperature moves to its own +100
      // value together — the summary's new winner is still P1 (90, the
      // lowest of 90..95), and each of the six cards shows its own moved
      // value (not a single shared value).
      await waitFor(() => {
        const tempLine = within(getSummarySection()).getByText((text) => text.startsWith("Lægsti hiti"));
        expect(tempLine.textContent).toContain(`${formatDecimal(90, "is", 1)} °C`);
        expect(tempLine.textContent).toContain("Punktur P1");
        for (let i = 0; i < 6; i++) {
          expect(screen.getByText(`${formatDecimal(i - 10 + 100, "is", 1)} °C`)).toBeInTheDocument();
        }
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("the notice count is independent of the selected departure time", async () => {
      const payload = makePayload();
      payload.segments[0].notices = [{ idPunktur: 1, astand: "VEGAVINNA", status: "active" }];
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
      await waitFor(() => expect(screen.getByText("Kaflar með gildar tilkynningar: 1")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(select, { target: { value: FUTURE_HOURS[1] } });

      expect(screen.getByText("Kaflar með gildar tilkynningar: 1")).toBeInTheDocument();
    });

    it("two active notices on the same segment count once; the same notice on two segments counts twice", async () => {
      const payload = makePayload();
      payload.segments[0].notices = [
        { idPunktur: 1, astand: "VEGAVINNA", status: "active" },
        { idPunktur: 2, astand: "VEGAVINNA", status: "active" },
      ];
      payload.segments[1].notices = [{ idPunktur: 3, astand: "VEGAVINNA", status: "active" }];
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      await waitFor(() => expect(screen.getByText("Kaflar með gildar tilkynningar: 2")).toBeInTheDocument());
    });

    it("expired/unknown-validity notices are excluded from the count, and a general LOKAD surface with no notices is 0 — but the scope wording and no positive style always show", async () => {
      const payload = makePayload();
      payload.segments[0].notices = [{ idPunktur: 1, astand: "ALLUR_AKSTUR_BANN", status: "expired" }];
      payload.segments[1] = makeSegment(100000001, { category: "closed", positiveStyleEligible: false, notices: [] });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      const countLine = await screen.findByText("Kaflar með gildar tilkynningar: 0");
      expect(countLine).toBeInTheDocument();
      expect(countLine.className).not.toMatch(/emerald|green/);
      expect(screen.getByText(translations.is.winterRouteSummaryNoticeScope)).toBeInTheDocument();
    });

    it("an unavailable/stale points feed shows an unconfirmed count, never an unconditional 0", async () => {
      const payload = makePayload();
      payload.roadMeta.pointsFeedUnavailableOrStale = true;
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      await waitFor(() =>
        expect(screen.getByText(translations.is.winterRouteSummaryNoticeCountUnconfirmed)).toBeInTheDocument()
      );
      expect(screen.queryByText(/Kaflar með gildar tilkynningar: 0/)).toBeNull();
      expect(screen.getByText(translations.is.winterRouteSummaryNoticeScope)).toBeInTheDocument();
    });

    it("missing weather data for a metric shows the dedicated missing text, never a guessed 0", async () => {
      const payload = makePayload({ forecast: { available: false, reason: "key_missing", points: [] } });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(translations.is.winterRouteSummaryGustMissing)).toBeInTheDocument();
        expect(screen.getByText(translations.is.winterRouteSummaryPrecipMissing)).toBeInTheDocument();
        expect(screen.getByText(translations.is.winterRouteSummaryMinTempMissing)).toBeInTheDocument();
      });
    });
  });

  describe("#490 — departure-time comparison", () => {
    // A wide (8-hour) window starting well into the future, so a baseline
    // chosen a few hours in gives room for both −2h and +2h to legitimately
    // land inside `availableHours` — the default auto-selected first hour
    // never does (N2: "2h earlier" is always unavailable on first load by
    // design, not tested here since it's already covered by the pure
    // winterRouteComparison.test.js cases).
    function wideHours(startOffset = 1, count = 8) {
      return Array.from({ length: count }, (_, i) => futureHourString(startOffset + i));
    }

    function makeWidePayload(overrides = {}) {
      const hours = wideHours();
      const segments = Array.from({ length: 13 }, (_, i) => makeSegment(100000000 + i));
      const points = ["P1", "P2", "P3", "P4", "P5", "P6"].map((id) =>
        makeForecastPoint(id, {
          hours,
          series: {
            temperature_2m: hours.map(() => -1.2),
            wind_speed_10m: hours.map(() => 4.5),
            wind_gusts_10m: hours.map(() => 7.1),
            precipitation: hours.map(() => 0),
            weather_code: hours.map(() => 3),
          },
        })
      );
      return {
        routeId: "raudavatn-vik",
        expectedPointCount: 6,
        generatedAt: "2026-11-03T18:00:00.000Z",
        segments,
        roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true },
        forecast: { available: true, window: { startHour: hours[0], endHour: hours[hours.length - 1], expectedHours: hours }, points, stale: false, cacheAgeMs: 0 },
        ...overrides,
      };
    }

    function getComparisonSection() {
      return screen.getByText(translations.is.winterRouteComparisonHeading).closest("div");
    }

    it("renders three labeled slots with the correct times once a departure is selected, and the default load has '2h earlier' unavailable with a visible reason (N2)", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makeWidePayload() }));
      renderPage();

      await screen.findByText(translations.is.winterRouteComparisonHeading);
      const comparison = within(getComparisonSection());

      expect(comparison.getByText(translations.is.winterRouteComparisonEarlierLabel)).toBeInTheDocument();
      expect(comparison.getByText(translations.is.winterRouteComparisonBaselineLabel)).toBeInTheDocument();
      expect(comparison.getByText(translations.is.winterRouteComparisonLaterLabel)).toBeInTheDocument();

      // Default departure is the window's first hour, so "2h earlier" is a
      // real, honest data-edge unavailability (N2), with a visible reason
      // — not a crash, not a silently-dropped slot.
      expect(comparison.getByText(translations.is.winterRouteComparisonReasonNotUpcoming)).toBeInTheDocument();
      expect(comparison.getByText(translations.is.winterRouteComparisonRoadNote)).toBeInTheDocument();
    });

    it("no comparison area renders before a departure is selected or when the forecast itself is unavailable (S2), without hiding cards/list", async () => {
      const payload = makeWidePayload({ forecast: { available: false, reason: "key_missing", points: [] } });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteForecastUnavailable)).toBeInTheDocument());
      expect(screen.queryByText(translations.is.winterRouteComparisonHeading)).toBeNull();
      // Road list is still rendered.
      expect(screen.getByText("Kafli 100000000")).toBeInTheDocument();
    });

    it("selecting an available comparison option updates the cards/#489 summary and recenters the comparison around the NEW baseline", async () => {
      const payload = makeWidePayload();
      // Distinct values per hour so each departure's own resolved reading
      // is independently observable.
      payload.forecast.points.forEach((p) => {
        p.series.temperature_2m = wideHours().map((_, h) => -20 + h);
      });
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
      const hours = wideHours();
      const { fireEvent } = await import("@testing-library/react");
      // Move the baseline to hour index 3 so both −2h (index 1) and +2h
      // (index 5) land inside the 8-hour window.
      fireEvent.change(select, { target: { value: hours[3] } });
      await waitFor(() => expect(select.value).toBe(hours[3]));

      const laterButton = await screen.findByRole("button", { name: (name) => name.includes("2 klst. síðar") });
      fireEvent.click(laterButton);

      // The +2h option (hour index 5) becomes the new selectedHour -> cards/select move to it.
      await waitFor(() => expect(select.value).toBe(hours[5]));
      // Comparison recenters: the new baseline is hours[5], so its own
      // "2 klst. fyrr" slot is now hours[3] (the OLD baseline) and "2 klst.
      // síðar" is hours[7] — i.e. a fresh −2/0/+2 window around the new
      // selection, not the original one.
      const comparison = within(getComparisonSection());
      expect(comparison.getByText(`${hours[3].slice(8, 10)}.${hours[3].slice(5, 7)} ${hours[3].slice(11, 16)} UTC`)).toBeInTheDocument();
      expect(comparison.getByText(`${hours[7].slice(8, 10)}.${hours[7].slice(5, 7)} ${hours[7].slice(11, 16)} UTC`)).toBeInTheDocument();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("S3: after a user-driven selection, focus lands on a stable node inside the comparison area and an aria-live region announces the new time", async () => {
      const payload = makeWidePayload();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
      const hours = wideHours();
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(select, { target: { value: hours[3] } });
      await waitFor(() => expect(select.value).toBe(hours[3]));

      const laterButton = screen.getByRole("button", { name: (name) => name.includes("2 klst. síðar") });
      fireEvent.click(laterButton);

      await waitFor(() => {
        expect(document.activeElement).not.toBe(document.body);
        expect(getComparisonSection().contains(document.activeElement)).toBe(true);
      });

      const expectedAnnouncement = translations.is.winterRouteComparisonSelectedAnnouncement.replace(
        "{time}",
        `${hours[5].slice(8, 10)}.${hours[5].slice(5, 7)} ${hours[5].slice(11, 16)}`
      );
      await waitFor(() => expect(screen.getByText(expectedAnnouncement)).toBeInTheDocument());
    });

    it("R1: the hour <select> itself keeps focus when its own onChange fires, even though selectedHour/cards/comparison update (native ArrowDown must not be interrupted)", async () => {
      const payload = makeWidePayload();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
      const hours = wideHours();
      const { fireEvent } = await import("@testing-library/react");

      await waitFor(() => expect(select.value).toBe(hours[0]));
      select.focus();
      expect(document.activeElement).toBe(select);

      fireEvent.change(select, { target: { value: hours[3] } });

      // selectedHour (and therefore the comparison area recentering around
      // it) really did update from this change — not a no-op assertion.
      await waitFor(() => expect(select.value).toBe(hours[3]));
      const comparison = within(getComparisonSection());
      expect(comparison.getByText(translations.is.winterRouteComparisonBaselineLabel)).toBeInTheDocument();

      // The select itself never had focus moved away from it — unlike the
      // comparison-button path above, this is the native <select> keyboard
      // path (real ArrowDown fires `change` on every step; moving focus
      // away after the first step would strand the user — see
      // result-review.md R1).
      expect(document.activeElement).toBe(select);
    });

    it("S3: a disabled comparison option shows its reason as visible text, not only a title attribute", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makeWidePayload() }));
      renderPage();

      await screen.findByText(translations.is.winterRouteComparisonHeading);
      const comparison = within(getComparisonSection());
      const reasonText = comparison.getByText(translations.is.winterRouteComparisonReasonNotUpcoming);
      // A real, disabled <button> — not a plain <div> — carrying the
      // reason as rendered text content.
      const button = reasonText.closest("button");
      expect(button).not.toBeNull();
      expect(button).toBeDisabled();
    });

    it("the comparison area shows the stale-forecast marking when forecast.stale is true, without hiding available options", async () => {
      const payload = makeWidePayload({ forecast: { ...makeWidePayload().forecast, stale: true, cacheAgeMs: 15 * 60 * 1000 } });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      renderPage();

      await screen.findByText(translations.is.winterRouteComparisonHeading);
      const comparison = within(getComparisonSection());
      const expected = translations.is.winterRouteForecastStaleServed.replace("{minutes}", "15");
      expect(comparison.getByText(expected)).toBeInTheDocument();
      // Baseline slot is still shown with real values, not hidden.
      expect(comparison.getByText(translations.is.winterRouteComparisonBaselineLabel)).toBeInTheDocument();
    });
  });

  describe("Ticket #491 — route selection", () => {
    const VIK_OPTION = WINTER_ROUTE_OPTIONS.find((o) => o.routeId === "raudavatn-vik");
    const BORGARNES_OPTION = WINTER_ROUTE_OPTIONS.find((o) => o.routeId === "raudavatn-borgarnes");

    function makeBorgarnesSegment(idButur) {
      return makeSegment(idButur);
    }

    function makeBorgarnesPayload(overrides = {}) {
      const segments = Array.from({ length: 8 }, (_, i) => makeBorgarnesSegment(200000000 + i));
      const points = ["P1", "P2", "P3", "P4"].map((id) => makeForecastPoint(id));
      return {
        routeId: "raudavatn-borgarnes",
        expectedPointCount: 4,
        generatedAt: "2026-11-04T18:00:00.000Z",
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

    function routeAwareFetch({ vik = makePayload(), borgarnes = makeBorgarnesPayload(), delayBorgarnesMs = 0 } = {}) {
      return vi.fn().mockImplementation((url) => {
        const isBorgarnes = String(url).includes("routeId=raudavatn-borgarnes");
        const payload = isBorgarnes ? borgarnes : vik;
        if (isBorgarnes && delayBorgarnesMs > 0) {
          return new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => payload }), delayBorgarnesMs));
        }
        return Promise.resolve({ ok: true, json: async () => payload });
      });
    }

    it("renders the route select with Vík as the default value and both options present, in both languages", async () => {
      vi.stubGlobal("fetch", routeAwareFetch());
      renderPage();

      const select = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      expect(select.value).toBe("raudavatn-vik");
      // Scoped to the <select> itself — the h1 now reads the same text as
      // the Vík <option> (both derive from WINTER_ROUTE_OPTIONS' nameIs).
      expect(within(select).getByText(VIK_OPTION.nameIs)).toBeInTheDocument();
      expect(within(select).getByText(BORGARNES_OPTION.nameIs)).toBeInTheDocument();
    });

    it("the default Vík request stays exactly /api/winter-route, with no query string", async () => {
      const fetchMock = routeAwareFetch();
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(fetchMock.mock.calls[0][0]).toBe("/api/winter-route");
    });

    it("switching to Borgarnes requests ?routeId=raudavatn-borgarnes and renders its own 4 points / 8 segments", async () => {
      const fetchMock = routeAwareFetch();
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

      await waitFor(() => expect(fetchMock.mock.calls.at(-1)[0]).toBe("/api/winter-route?routeId=raudavatn-borgarnes"));
      await waitFor(() => expect(screen.getByText("Kafli 200000000")).toBeInTheDocument());
      expect(screen.queryByText("Kafli 100000000")).toBeNull();
      expect(screen.getByText("Punktur P4")).toBeInTheDocument();
      expect(screen.queryByText("Punktur P5")).toBeNull();
      expect(screen.queryByText("Punktur P6")).toBeNull();
    });

    it("switching routes clears the previous route's cards/segments immediately — never one frame of stale data under the new selection", async () => {
      const fetchMock = routeAwareFetch({ delayBorgarnesMs: 20 });
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

      // Immediately after the switch (before the delayed Borgarnes response
      // resolves), the old route's segments must already be gone.
      await waitFor(() => expect(screen.queryByText("Kafli 100000000")).toBeNull());
      await waitFor(() => expect(screen.getByText("Kafli 200000000")).toBeInTheDocument());
    });

    it("A→B→A: switching back to Vík after Borgarnes re-fetches Vík fresh and shows Vík's own data again, not stale Borgarnes data", async () => {
      const fetchMock = routeAwareFetch();
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });
      await waitFor(() => expect(screen.getByText("Kafli 200000000")).toBeInTheDocument());

      fireEvent.change(routeSelect, { target: { value: "raudavatn-vik" } });
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
      expect(screen.queryByText("Kafli 200000000")).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("a late-arriving response for an abandoned route selection never overwrites the current selection's state (reverse-order resolution)", async () => {
      // Borgarnes's OWN request resolves AFTER the user has already
      // switched back to Vík and Vík's second request has resolved —
      // the stale Borgarnes response must be ignored on arrival.
      const fetchMock = routeAwareFetch({ delayBorgarnesMs: 50 });
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } }); // slow, resolves in 50ms
      fireEvent.change(routeSelect, { target: { value: "raudavatn-vik" } }); // fast, resolves immediately

      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
      // Wait past the slow Borgarnes response's own delay, then confirm it
      // never clobbered the current (Vík) state.
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(screen.getByText("Kafli 100000000")).toBeInTheDocument();
      expect(screen.queryByText("Kafli 200000000")).toBeNull();
    });

    it("a failed fetch after switching routes shows the road-feed-unavailable message, not the previous route's stale data", async () => {
      const fetchMock = vi.fn().mockImplementation((url) => {
        if (String(url).includes("routeId=raudavatn-borgarnes")) return Promise.reject(new Error("network down"));
        return Promise.resolve({ ok: true, json: async () => makePayload() });
      });
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteRoadFeedUnavailable)).toBeInTheDocument());
      expect(screen.queryByText("Kafli 100000000")).toBeNull();
    });

    it("a response whose routeId doesn't match what was requested is a route-scoped contract-mismatch error, not a silently-wrong view", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }); // always Vík's payload
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      // Server keeps replying with Vík's own payload even though Borgarnes was requested.
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteRouteDataMismatch)).toBeInTheDocument());
      expect(screen.queryByText("Kafli 100000000")).toBeNull();
    });

    it("a response whose expectedPointCount doesn't match the UI's own fixed table is a contract-mismatch error", async () => {
      const fetchMock = routeAwareFetch({ borgarnes: makeBorgarnesPayload({ expectedPointCount: 6 }) });
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteRouteDataMismatch)).toBeInTheDocument());
    });

    it("the forecast section title and comparison-unavailable reasons use the route's own point count (4), never a hardcoded 6", async () => {
      vi.stubGlobal("fetch", routeAwareFetch());
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

      await waitFor(() =>
        expect(screen.getByText(translations.is.winterRouteForecastSectionTitle.replace("{count}", "4"))).toBeInTheDocument()
      );
    });

    it("StrictMode double-invoke never drops the real fetch — data still loads", async () => {
      const fetchMock = routeAwareFetch();
      vi.stubGlobal("fetch", fetchMock);
      render(
        <React.StrictMode>
          <MemoryRouter initialEntries={["/winter-route"]}>
            <WinterRoute />
          </MemoryRouter>
        </React.StrictMode>
      );

      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
    });

    it("the route select's own onChange keeps native focus on itself (no focus-stealing side effect, same discipline as the hour select's R1 fix)", async () => {
      vi.stubGlobal("fetch", routeAwareFetch());
      renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
      routeSelect.focus();
      expect(document.activeElement).toBe(routeSelect);

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

      await waitFor(() => expect(screen.getByText("Kafli 200000000")).toBeInTheDocument());
      expect(document.activeElement).toBe(routeSelect);
    });

    it("selecting a departure hour never triggers an extra fetch on the currently-selected route", async () => {
      const fetchMock = routeAwareFetch();
      vi.stubGlobal("fetch", fetchMock);
      renderPage();

      const { fireEvent } = await import("@testing-library/react");
      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });
      await waitFor(() => expect(screen.getByText("Kafli 200000000")).toBeInTheDocument());
      const callsAfterSwitch = fetchMock.mock.calls.length;

      const hourSelect = await screen.findByLabelText(translations.is.winterRouteHourLabel);
      await waitFor(() => expect(hourSelect.value).toBe(FUTURE_HOURS[0]));
      fireEvent.change(hourSelect, { target: { value: FUTURE_HOURS[1] } });

      expect(fetchMock.mock.calls.length).toBe(callsAfterSwitch);
    });

    // V1 (result-review-implementation.md R1) — h1/<title> must come from
    // the SELECTED route, not a fixed "Rauðavatn–Vík" key, and must follow
    // the selection immediately — even while the new route's data is still
    // loading or has failed, not only once it has arrived.
    describe("V1 — h1/title follow the selected route", () => {
      it("Borgarnes h1 reads its own name, in Icelandic, once selected", async () => {
        vi.stubGlobal("fetch", routeAwareFetch());
        renderPage();

        const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
        await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
        expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(VIK_OPTION.nameIs);

        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(BORGARNES_OPTION.nameIs));
      });

      it("Borgarnes h1 reads its own name, in English, once selected", async () => {
        localStorage.setItem("lang", JSON.stringify("en"));
        vi.stubGlobal("fetch", routeAwareFetch());
        renderPage();

        const routeSelect = await screen.findByLabelText(translations.en.winterRouteRouteSelectLabel);
        await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(VIK_OPTION.nameEn));

        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(BORGARNES_OPTION.nameEn));
      });

      it("the h1 switches to the new route's name immediately, before that route's own data has arrived", async () => {
        const fetchMock = routeAwareFetch({ delayBorgarnesMs: 30 });
        vi.stubGlobal("fetch", fetchMock);
        renderPage();

        const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
        await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        // Still loading (the 30ms-delayed Borgarnes response hasn't
        // resolved yet) — the h1 must already read Borgarnes, not Vík.
        expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(BORGARNES_OPTION.nameIs);
        await waitFor(() => expect(screen.getByText("Kafli 200000000")).toBeInTheDocument());
      });

      it("the h1 keeps reading the new route's name even when that route's fetch fails", async () => {
        const fetchMock = vi.fn().mockImplementation((url) => {
          if (String(url).includes("routeId=raudavatn-borgarnes")) return Promise.reject(new Error("network down"));
          return Promise.resolve({ ok: true, json: async () => makePayload() });
        });
        vi.stubGlobal("fetch", fetchMock);
        renderPage();

        const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
        await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        await waitFor(() => expect(screen.getByText(translations.is.winterRouteRoadFeedUnavailable)).toBeInTheDocument());
        expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(BORGARNES_OPTION.nameIs);
      });

      // The document <title> itself (as opposed to the h1, covered above)
      // is intentionally NOT asserted here: React 19 hoists a literal
      // <title> host element straight to `document.head` regardless of
      // this file's `Helmet` mock, and that hoisting does not reliably
      // populate `document.head`/`document.title` under jsdom in this
      // project's test setup (verified via a disposable debug test this
      // round — `document.head.innerHTML` stayed `<title></title>`, empty,
      // no matter the component's own `<title>` content). This is a test-
      // environment limitation, not specific to this change. The real
      // document title is covered in a real browser instead — see
      // `tests/e2e/winter-route-ticket-491.spec.js`'s
      // `page.toHaveTitle(/Rauðavatn – Borgarnes/)` assertion.
    });

    // V2 (result-review-implementation.md R2) — a route switch must never
    // COMMIT a render with the newly selected routeId next to the
    // previous route's stale data/error. Checked at the commit/frame
    // level via React's Profiler onRender callback (fires synchronously
    // after each commit's DOM mutations are applied), not only on the
    // settled state after `act` — the gap a plain waitFor-based assertion
    // cannot see.
    describe("V2 — render-time route-bound view (frame-level)", () => {
      function recordCommit(commits) {
        return () => {
          commits.push({
            h1: screen.queryByRole("heading", { level: 1 })?.textContent ?? null,
            hasVikSegment: !!screen.queryByText("Kafli 100000000"),
            hasBorgarnesSegment: !!screen.queryByText("Kafli 200000000"),
            hasRoadFeedError: !!screen.queryByText(translations.is.winterRouteRoadFeedUnavailable),
          });
        };
      }

      it("switching away from stale DATA never commits the new route's h1 together with the previous route's segments", async () => {
        const fetchMock = routeAwareFetch({ delayBorgarnesMs: 20 });
        vi.stubGlobal("fetch", fetchMock);
        const commits = [];

        render(
          <MemoryRouter initialEntries={["/winter-route"]}>
            <React.Profiler id="probe-data" onRender={recordCommit(commits)}>
              <WinterRoute />
            </React.Profiler>
          </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
        commits.length = 0;

        const routeSelect = screen.getByLabelText(translations.is.winterRouteRouteSelectLabel);
        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        await waitFor(() => expect(screen.getByText("Kafli 200000000")).toBeInTheDocument());

        const badCommit = commits.find((c) => c.h1 === BORGARNES_OPTION.nameIs && c.hasVikSegment);
        expect(badCommit).toBeUndefined();
        // Sanity: the probe actually observed the new h1 at some commit —
        // otherwise the assertion above would pass vacuously.
        expect(commits.some((c) => c.h1 === BORGARNES_OPTION.nameIs)).toBe(true);
      });

      it("switching away from a stale ERROR never commits the new route's h1 together with the previous route's error message", async () => {
        const fetchMock = vi.fn().mockImplementation((url) => {
          if (String(url).includes("routeId=raudavatn-borgarnes")) {
            return new Promise((resolve) =>
              setTimeout(() => resolve({ ok: true, json: async () => makeBorgarnesPayload() }), 20)
            );
          }
          return Promise.reject(new Error("network down"));
        });
        vi.stubGlobal("fetch", fetchMock);
        const commits = [];

        render(
          <MemoryRouter initialEntries={["/winter-route"]}>
            <React.Profiler id="probe-error" onRender={recordCommit(commits)}>
              <WinterRoute />
            </React.Profiler>
          </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText(translations.is.winterRouteRoadFeedUnavailable)).toBeInTheDocument());
        commits.length = 0;

        const routeSelect = screen.getByLabelText(translations.is.winterRouteRouteSelectLabel);
        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        await waitFor(() => expect(screen.getByText("Kafli 200000000")).toBeInTheDocument());

        const badCommit = commits.find((c) => c.h1 === BORGARNES_OPTION.nameIs && c.hasRoadFeedError);
        expect(badCommit).toBeUndefined();
      });

      it("a late-arriving response for a just-abandoned route never commits into view after switching away", async () => {
        const fetchMock = routeAwareFetch({ delayBorgarnesMs: 50 });
        vi.stubGlobal("fetch", fetchMock);
        const commits = [];

        render(
          <MemoryRouter initialEntries={["/winter-route"]}>
            <React.Profiler id="probe-reverse" onRender={recordCommit(commits)}>
              <WinterRoute />
            </React.Profiler>
          </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
        commits.length = 0;

        const routeSelect = screen.getByLabelText(translations.is.winterRouteRouteSelectLabel);
        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } }); // slow (50ms)
        fireEvent.change(routeSelect, { target: { value: "raudavatn-vik" } }); // fast, resolves first

        await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
        // Wait past the slow, now-abandoned Borgarnes response's own delay.
        await new Promise((resolve) => setTimeout(resolve, 80));

        const badCommit = commits.find((c) => c.hasBorgarnesSegment);
        expect(badCommit).toBeUndefined();
      });
    });
  });
});
