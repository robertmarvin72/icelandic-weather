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
    // #489: the same stale-forecast line now appears twice by design — once
    // in the new route-level summary, once in the original forecast
    // section (the prompt explicitly keeps the existing warning in place).
    expect(screen.getAllByText(expected)).toHaveLength(2);
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
      const gustLine = await screen.findByText((text) => text.startsWith("Mestar hviður"));
      expect(gustLine.textContent).toContain(`${formatDecimal(7.1, "is", 1)} m/s`);
      expect(gustLine.textContent).toContain("Punktur P1");

      const precipLine = screen.getByText((text) => text.startsWith("Mest úrkoma"));
      expect(precipLine.textContent).toContain(`${formatDecimal(0, "is", 1)} mm`);

      const tempLine = screen.getByText((text) => text.startsWith("Lægsti hiti"));
      expect(tempLine.textContent).toContain(`${formatDecimal(-1.2, "is", 1)} °C`);

      expect(screen.getByText("Kaflar með gildar tilkynningar: 0")).toBeInTheDocument();
      expect(screen.getByText(translations.is.winterRouteSummaryNoticeScope)).toBeInTheDocument();
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
        const tempLine = screen.getByText((text) => text.startsWith("Lægsti hiti"));
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
        const tempLine = screen.getByText((text) => text.startsWith("Lægsti hiti"));
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
});
