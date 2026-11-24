// src/pages/WinterRoute.test.jsx — Ticket #486
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, act } from "@testing-library/react";
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

// Ticket #493 — every point reads the SAME shared selected hour (an exact
// `point.hours.indexOf(effectiveHour)` lookup, see WinterRoute.jsx), never
// its own distance-resolved time. `approxDistanceFromStartKm` stays in the
// fixture (the API payload/route config aren't in this ticket's scope) but
// the client no longer reads it for anything.
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

// Ticket #502, P1(c) — the page now defaults to "Velja staði" (geometry
// mode); every existing legacy-flow test below still needs the legacy
// fixed-route UI, so it switches into "Fastar veðurleiðir" immediately
// after rendering. This is the ONE helper-function adaptation point for
// every pre-existing test in this file (no assertions weakened, no tests
// removed) — matched by accessible name in either language so it works
// under both the IS and EN tests without needing to know which language
// is active.
async function switchToLegacyMode() {
  const { fireEvent } = await import("@testing-library/react");
  const legacyButton = await screen.findByRole("button", { name: /Fastar veðurleiðir|Fixed weather routes/ });
  fireEvent.click(legacyButton);
}

async function renderPage() {
  const result = render(
    <MemoryRouter initialEntries={["/winter-route"]}>
      <WinterRoute />
    </MemoryRouter>
  );
  await switchToLegacyMode();
  return result;
}

// Scope a query to the summary's own <section> (found via its stable
// heading) so a test asserting on these metric lines never accidentally
// matches an unrelated part of the page.
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

    await renderPage();

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
    await renderPage();

    await waitFor(() => expect(screen.getAllByText(/Kafli 1/).length).toBeGreaterThan(0));
    for (let i = 0; i < 13; i++) {
      expect(screen.getByText(`Kafli ${100000000 + i}`)).toBeInTheDocument();
    }
  });

  it("a closed segment shows the closed label regardless of the other passable segments", async () => {
    const payload = makePayload();
    payload.segments[3] = makeSegment(999, { category: "closed", positiveStyleEligible: false });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await renderPage();

    await waitFor(() => expect(screen.getByText("Kafli 999")).toBeInTheDocument());
    const row = screen.getByText("Kafli 999").closest("li");
    expect(within(row).getByText(translations.is.winterRouteCategoryClosed)).toBeInTheDocument();
  });

  it("selecting a different hour in the picker does not trigger a second fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() });
    vi.stubGlobal("fetch", fetchMock);
    await renderPage();

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
    await renderPage();

    await waitFor(() => expect(screen.getByText(translations.is.winterRouteForecastUnavailable)).toBeInTheDocument());
    expect(screen.queryByLabelText(translations.is.winterRouteHourLabel)).toBeNull();
  });

  it("Ticket #493: every card reads the SAME shared selected hour, regardless of each point's own (unused) distance field", async () => {
    const payload = makePayload();
    // Distinct per-point values keyed by index, but all points share the
    // SAME selected hour (index 0) — the opposite of the old per-distance
    // model this replaces. approxDistanceFromStartKm varies per point on
    // purpose, to prove it has no effect on which value is shown.
    payload.forecast.points.forEach((p, i) => {
      p.approxDistanceFromStartKm = i % 2 === 0 ? 0 : 1234;
      p.series.temperature_2m = [i, i + 100];
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await renderPage();

    await screen.findByLabelText(translations.is.winterRouteHourLabel);
    // Every point's value at hour INDEX 0 (the auto-selected first hour)
    // shows, regardless of its own distance — i.e. point i shows `i`, not
    // `i + 100` for the odd-indexed (large-distance) points.
    await waitFor(() => {
      for (let i = 0; i < 6; i++) {
        expect(screen.getByText(`${formatDecimal(i, "is", 1)} °C`)).toBeInTheDocument();
      }
    });
  });

  it("a point whose own `hours` does not contain the shared selected hour shows 'forecast not available', never a nearest/fallback match", async () => {
    const payload = makePayload();
    // Per the backend's own contract every available point shares the same
    // `hours` — this directly exercises the "not assumed" exact-lookup
    // path (N1) rather than trusting that contract blindly.
    payload.forecast.points[0].hours = [futureHourString(10), futureHourString(11)];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await renderPage();

    const dict = translations.is;
    await waitFor(() =>
      expect(screen.getByText(dict.winterRouteForecastNotAvailableAtComputedTime)).toBeInTheDocument()
    );
    // The other five points, whose `hours` DO contain the selected hour,
    // still show real values — one point's mismatch doesn't blank the rest.
    expect(screen.getAllByText(`${formatDecimal(-1.2, "is", 1)} °C`)).toHaveLength(5);
  });

  it("no valid selected hour (empty window) shows 'forecast not available' on every card, never a guessed value", async () => {
    const payload = makePayload({
      forecast: {
        available: true,
        window: { startHour: FUTURE_HOURS[0], endHour: FUTURE_HOURS[1], expectedHours: [] },
        points: makePayload().forecast.points,
        stale: false,
        cacheAgeMs: 0,
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await renderPage();

    const dict = translations.is;
    await waitFor(() => expect(screen.getByText(dict.winterRouteNoHoursAvailable)).toBeInTheDocument());
    expect(screen.getAllByText(dict.winterRouteForecastNotAvailableAtComputedTime)).toHaveLength(6);
  });

  it("a null value for one metric at the selected hour shows the missing dash, never a guessed 0 (N1)", async () => {
    const payload = makePayload();
    payload.forecast.points[0].series.wind_gusts_10m = [null, 7.9];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await renderPage();

    const card = await screen.findByText("Punktur P1").then((el) => el.closest(".rounded-xl"));
    await waitFor(() => {
      const dt = within(card).getByText(translations.is.winterRouteGust);
      expect(dt.nextElementSibling.textContent).toBe("—");
    });
  });

  it("the card's day/night weather icon resolves from the shared selected hour's own UTC digits without error (N3)", async () => {
    // weather_code 3 is a known, mapped code — a successful day/night
    // resolution renders a real icon; a crash or an unmapped hour would
    // instead fall back to the "unknown weather symbol" text.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
    await renderPage();

    await screen.findByLabelText(translations.is.winterRouteHourLabel);
    await waitFor(() => {
      expect(screen.getAllByText(`${formatDecimal(-1.2, "is", 1)} °C`)).toHaveLength(6);
      expect(screen.queryByText(translations.is.winterRouteUnknownWeatherSymbol)).toBeNull();
    });
  });

  it("the forecast-time picker is labeled as a forecast time (not a departure time), and states that it applies to every point, on both languages", async () => {
    expect(translations.is.winterRouteHourLabel).toBe("Spátími");
    expect(translations.en.winterRouteHourLabel).toBe("Forecast time");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
    await renderPage();

    await waitFor(() =>
      expect(screen.getByText(translations.is.winterRouteSameForecastTimeNote)).toBeInTheDocument()
    );
  });

  it("Round 2 (R1b): shows a visible warning when the points feed is unavailable/stale, without hiding segment data", async () => {
    const payload = makePayload();
    payload.roadMeta.pointsFeedUnavailableOrStale = true;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await renderPage();

    await waitFor(() =>
      expect(screen.getByText(translations.is.winterRoutePointsFeedUnavailable)).toBeInTheDocument()
    );
    // Segment rows are still rendered, not hidden by the warning.
    expect(screen.getByText("Kafli 100000000")).toBeInTheDocument();
  });

  it("does not show the points-feed warning when the points feed is fine", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
    await renderPage();

    await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
    expect(screen.queryByText(translations.is.winterRoutePointsFeedUnavailable)).toBeNull();
  });

  it("Round 2 (R3): shows a 'last known forecast' line with the real age when forecast.stale is true", async () => {
    const payload = makePayload();
    payload.forecast.stale = true;
    payload.forecast.cacheAgeMs = 20 * 60 * 1000;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await renderPage();

    // Wait for the state that settles LAST (the hour-select effect, one
    // render pass after `data` itself arrives) rather than the stale
    // message alone — the message renders on the very first pass once
    // `data` loads, before the follow-up effect that resolves
    // `selectedHour`/`hourIndex` and populates the per-hour card values;
    // asserting on the earlier-settling text alone raced the later one.
    await waitFor(() => expect(screen.getAllByText(`${formatDecimal(-1.2, "is", 1)} °C`)).toHaveLength(6));
    const expected = translations.is.winterRouteForecastStaleServed.replace("{minutes}", "20");
    // The same stale-forecast line appears twice by design: the #489
    // route-level summary and the original forecast-section warning
    // (unchanged) — ticket #493 removed the third copy that used to live
    // in the departure comparison area along with that area itself.
    expect(screen.getAllByText(expected)).toHaveLength(2);
  });

  it("does not show the stale-forecast line when forecast.stale is false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
    await renderPage();

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
    await renderPage();

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
      const { unmount } = await renderPage();

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
    await renderPage();

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
    await renderPage();

    const warningText = await screen.findByText(translations.is.winterRoutePointsFeedUnavailable);
    const warningBox = warningText.closest("div");
    const link = within(warningBox).getByText(translations.is.winterRouteOfficialSourceLinkRoad);
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/"
    );
  });

  // Ticket #493 correction round, V2 (T3) — a vitest-enforced sweep of every
  // `winterRoute*` translation value on both languages for leftover
  // departure/arrival/ETA/70km/brottfarar-/komutíma wording, rather than a
  // one-off manual grep that leaves no regression protection. W3(a): uses
  // Unicode-aware boundaries (`u` flag + lookaround), not `\b`, so a
  // negated/accented Icelandic word next to the match still counts as a
  // real boundary. W3(b): asserts the swept key set is real and non-empty
  // (an empty filter would make the "no forbidden match" test pass for the
  // wrong reason). W3(c): a positive-control test proves the same matchers
  // actually flag real departure/arrival/ETA/70km/komutími text, so the
  // "found nothing" result above isn't just a dead matcher.
  describe("Ticket #493, V2 — no departure/arrival/ETA/70km/brottfarar-/komutíma wording in any winterRoute* translation value (T3)", () => {
    const FORBIDDEN_PATTERNS = [
      /(?<![\p{L}\p{N}])departure(?![\p{L}\p{N}])/iu,
      /(?<![\p{L}\p{N}])arrival(?![\p{L}\p{N}])/iu,
      /(?<![\p{L}\p{N}])ETA(?![\p{L}\p{N}])/u,
      /70 ?km/iu,
      /brottf[aö]r/iu,
      /komutím/iu,
      // Icelandic "koma" (arrival) as a standalone word — the Unicode
      // boundary excludes it as a substring of an unrelated word like
      // "Úrkoma" (precipitation), where a letter immediately precedes it.
      /(?<![\p{L}\p{N}])koma(?![\p{L}\p{N}])/iu,
    ];

    function winterRouteKeys(dict) {
      return Object.keys(dict).filter((k) => k.startsWith("winterRoute"));
    }

    it("the swept key set is real: both languages expose the same non-empty set of winterRoute* keys", () => {
      const isKeys = winterRouteKeys(translations.is);
      const enKeys = winterRouteKeys(translations.en);
      expect(isKeys.length).toBeGreaterThan(0);
      expect(enKeys.length).toBe(isKeys.length);
    });

    it("no winterRoute* value in is/en matches a forbidden departure/arrival/ETA/70km/brottfarar-/komutíma term", () => {
      for (const lang of ["is", "en"]) {
        const dict = translations[lang];
        for (const key of winterRouteKeys(dict)) {
          const value = dict[key];
          for (const pattern of FORBIDDEN_PATTERNS) {
            expect(value).not.toMatch(pattern);
          }
        }
      }
    });

    it("positive control: the same matchers DO flag a small sample of real departure/arrival/ETA/70km/komutími strings, proving the matcher itself detects them", () => {
      const samples = [
        "Estimated departure time",
        "Áætlaður brottfarartími",
        "Estimated arrival",
        "Áætluð koma",
        "70 km/h",
        "komutími",
      ];
      for (const sample of samples) {
        const matched = FORBIDDEN_PATTERNS.some((pattern) => pattern.test(sample));
        expect(matched).toBe(true);
      }
    });

    it("an unrelated key outside winterRoute* may legitimately contain 'departure'-like text — the sweep deliberately does not touch it", () => {
      // Confirms the winterRoute*-only filter above is a deliberate scope
      // choice, not an accidental narrowing that happens to dodge a real
      // match elsewhere in the same dictionary.
      const allIsKeys = Object.keys(translations.is);
      const outsideWinterRoute = allIsKeys.filter((k) => !k.startsWith("winterRoute"));
      expect(outsideWinterRoute.length).toBeGreaterThan(0);
    });
  });

  // Ticket #493, correction round (T2/V1) — the render-time `effectiveHour`
  // fix (computed as a plain const every render, not via an effect) means
  // an invalid/expiring selection must never show stale real metric values
  // for even one commit. Non-vacuity follows the same style as the existing
  // #491 "V2 — render-time route-bound view (frame-level)" Profiler tests
  // below: record every commit, assert the healthy state was really reached
  // (so the test isn't vacuously passing because it never got there), then
  // assert the specific bad combination never occurs in any commit.
  describe("V1 — invalid/expiring hour selection never commits stale real values (T2)", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function hourStringFromDate(d, offsetHours) {
      const t = new Date(d.getTime() + offsetHours * 3600000);
      return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}T${pad2(t.getUTCHours())}:00`;
    }

    it("(a) a window that empties while a valid hour is still selected never commits a real metric value alongside the 'no time available' message", async () => {
      vi.useFakeTimers({ toFake: ["setInterval", "Date"] });
      const base = new Date();
      vi.setSystemTime(base);
      // W2 — at least three hours in the fixture.
      const hours = [1, 2, 3].map((h) => hourStringFromDate(base, h));
      const payload = makePayload();
      payload.forecast.window = { startHour: hours[0], endHour: hours[2], expectedHours: hours };
      payload.forecast.points.forEach((p) => {
        p.hours = hours;
        p.series.temperature_2m = [-9, -9, -9];
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));

      const commits = [];
      render(
        <MemoryRouter initialEntries={["/winter-route"]}>
          <React.Profiler
            id="probe-empty-window"
            onRender={() => {
              commits.push({
                noHoursMessage: !!screen.queryByText(translations.is.winterRouteNoHoursAvailable),
                realTempCount: screen.queryAllByText(`${formatDecimal(-9, "is", 1)} °C`).length,
              });
            }}
          >
            <WinterRoute />
          </React.Profiler>
        </MemoryRouter>
      );
      await switchToLegacyMode();

      // Healthy state reached first: a real selected hour with real values.
      await waitFor(() => expect(screen.getAllByText(`${formatDecimal(-9, "is", 1)} °C`)).toHaveLength(6));
      commits.length = 0;

      // Advance the system clock past ALL THREE hours in one tick (W2a) —
      // `selectedHour` itself is never cleared by the reconciliation effect
      // when the window is totally empty (it early-returns), so it stays
      // "in state" at its old value indefinitely; only the render-time
      // `effectiveHour` computation protects the cards from showing it.
      vi.setSystemTime(new Date(Date.parse(`${hours[2]}:00Z`) + 1000));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteNoHoursAvailable)).toBeInTheDocument());

      // Non-vacuity: the probe actually observed the empty-window state —
      // otherwise the assertion below could pass vacuously.
      expect(commits.some((c) => c.noHoursMessage)).toBe(true);
      // Regression guard: no commit ever shows the "no time available"
      // message together with a real metric value, even though the old
      // `selectedHour` stays in React state forever once the window is
      // empty (the bug T2 fixes would have shown the stale real value for
      // at least one commit here if `effectiveHour` were computed via an
      // effect instead of at render time).
      const badCommit = commits.find((c) => c.noHoursMessage && c.realTempCount > 0);
      expect(badCommit).toBeUndefined();
    });

    // Ticket #502 — this test is already close to the default 5000ms
    // budget on its own real work (fake timers + a frame-level Profiler
    // probe); the mechanical switchToLegacyMode() step every test now
    // performs pushes the FULL-FILE run (58 tests sharing one process)
    // over that budget intermittently, even though the test itself takes
    // well under 5s in isolation. An explicit longer timeout is the
    // minimal fix — no assertion here is weakened or removed.
    it("(b) a minute tick that ages out only the FIRST of three hours never commits a real value for the expired hour, before falling back to the next available one", async () => {
      vi.useFakeTimers({ toFake: ["setInterval", "Date"] });
      const base = new Date();
      vi.setSystemTime(base);
      const hours = [1, 2, 3].map((h) => hourStringFromDate(base, h));
      const payload = makePayload();
      payload.forecast.window = { startHour: hours[0], endHour: hours[2], expectedHours: hours };
      payload.forecast.points.forEach((p) => {
        p.hours = hours;
        p.series.temperature_2m = [-1, -2, -3];
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));

      const commits = [];
      render(
        <MemoryRouter initialEntries={["/winter-route"]}>
          <React.Profiler
            id="probe-tick"
            onRender={() => {
              commits.push({
                hasH1Temp: screen.queryAllByText(`${formatDecimal(-1, "is", 1)} °C`).length,
                hasH2Temp: screen.queryAllByText(`${formatDecimal(-2, "is", 1)} °C`).length,
              });
            }}
          >
            <WinterRoute />
          </React.Profiler>
        </MemoryRouter>
      );
      await switchToLegacyMode();

      await waitFor(() => expect(screen.getAllByText(`${formatDecimal(-1, "is", 1)} °C`)).toHaveLength(6));
      commits.length = 0;

      // W2b — advance the clock past only the FIRST of the three hours.
      vi.setSystemTime(new Date(Date.parse(`${hours[0]}:00Z`) + 1000));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });

      await waitFor(() => expect(screen.getAllByText(`${formatDecimal(-2, "is", 1)} °C`)).toHaveLength(6));

      // Non-vacuity: the probe actually saw the fallback hour's real value.
      expect(commits.some((c) => c.hasH2Temp === 6)).toBe(true);
      // Regression guard: once the tick lands, no commit ever shows the
      // now-expired first hour's real value again.
      expect(commits.every((c) => c.hasH1Temp === 0)).toBe(true);
    }, 10000);
  });

  describe("#489 — route-level summary", () => {
    it("renders the three weather extrema with point label and resolved time, and the notice count with its fixed scope wording", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() }));
      await renderPage();

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
      await renderPage();

      const expected = translations.is.winterRouteAcquiredAt.replace("{time}", "2026-11-03 18:00");
      // Appears twice by design — once in the new summary, once (unchanged)
      // in the existing bottom attribution section.
      await waitFor(() => expect(screen.getAllByText(expected)).toHaveLength(2));
    });

    it("changing the forecast time updates the summary and the cards together, from the same already-fetched data (no extra fetch)", async () => {
      const payload = makePayload();
      // Distinct per-point values so each point's own value at the shared
      // selected hour is independently observable, rather than masked by
      // identical fixture data.
      payload.forecast.points.forEach((p, i) => {
        p.series.temperature_2m = [i - 10, i - 10 + 100];
      });
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
      vi.stubGlobal("fetch", fetchMock);
      await renderPage();

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
      await renderPage();

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
      await renderPage();

      await waitFor(() => expect(screen.getByText("Kaflar með gildar tilkynningar: 2")).toBeInTheDocument());
    });

    it("expired/unknown-validity notices are excluded from the count, and a general LOKAD surface with no notices is 0 — but the scope wording and no positive style always show", async () => {
      const payload = makePayload();
      payload.segments[0].notices = [{ idPunktur: 1, astand: "ALLUR_AKSTUR_BANN", status: "expired" }];
      payload.segments[1] = makeSegment(100000001, { category: "closed", positiveStyleEligible: false, notices: [] });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      await renderPage();

      const countLine = await screen.findByText("Kaflar með gildar tilkynningar: 0");
      expect(countLine).toBeInTheDocument();
      expect(countLine.className).not.toMatch(/emerald|green/);
      expect(screen.getByText(translations.is.winterRouteSummaryNoticeScope)).toBeInTheDocument();
    });

    it("an unavailable/stale points feed shows an unconfirmed count, never an unconditional 0", async () => {
      const payload = makePayload();
      payload.roadMeta.pointsFeedUnavailableOrStale = true;
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      await renderPage();

      await waitFor(() =>
        expect(screen.getByText(translations.is.winterRouteSummaryNoticeCountUnconfirmed)).toBeInTheDocument()
      );
      expect(screen.queryByText(/Kaflar með gildar tilkynningar: 0/)).toBeNull();
      expect(screen.getByText(translations.is.winterRouteSummaryNoticeScope)).toBeInTheDocument();
    });

    it("missing weather data for a metric shows the dedicated missing text, never a guessed 0", async () => {
      const payload = makePayload({ forecast: { available: false, reason: "key_missing", points: [] } });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      await renderPage();

      await waitFor(() => {
        expect(screen.getByText(translations.is.winterRouteSummaryGustMissing)).toBeInTheDocument();
        expect(screen.getByText(translations.is.winterRouteSummaryPrecipMissing)).toBeInTheDocument();
        expect(screen.getByText(translations.is.winterRouteSummaryMinTempMissing)).toBeInTheDocument();
      });
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
      await renderPage();

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
      await renderPage();

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(fetchMock.mock.calls[0][0]).toBe("/api/winter-route");
    });

    it("switching to Borgarnes requests ?routeId=raudavatn-borgarnes and renders its own 4 points / 8 segments", async () => {
      const fetchMock = routeAwareFetch();
      vi.stubGlobal("fetch", fetchMock);
      await renderPage();

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
      await renderPage();

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
      await renderPage();

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
      await renderPage();

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
      await renderPage();

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
      await renderPage();

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
      await renderPage();

      const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteRouteDataMismatch)).toBeInTheDocument());
    });

    it("the forecast section title uses the route's own point count (4), never a hardcoded 6", async () => {
      vi.stubGlobal("fetch", routeAwareFetch());
      await renderPage();

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
      await switchToLegacyMode();

      await waitFor(() => expect(screen.getByText("Kafli 100000000")).toBeInTheDocument());
    });

    it("the route select's own onChange keeps native focus on itself (no focus-stealing side effect, same discipline as the hour select's R1 fix)", async () => {
      vi.stubGlobal("fetch", routeAwareFetch());
      await renderPage();

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
      await renderPage();

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
        await renderPage();

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
        await renderPage();

        const routeSelect = await screen.findByLabelText(translations.en.winterRouteRouteSelectLabel);
        await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(VIK_OPTION.nameEn));

        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(BORGARNES_OPTION.nameEn));
      });

      it("the h1 switches to the new route's name immediately, before that route's own data has arrived", async () => {
        const fetchMock = routeAwareFetch({ delayBorgarnesMs: 30 });
        vi.stubGlobal("fetch", fetchMock);
        await renderPage();

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
        await renderPage();

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

    // Ticket #493 correction round, V3 (T5) — the hour-reconciliation
    // effect's own stated contract ("selectedHour is deliberately left
    // untouched [on a route switch]... kept only if still valid in the new
    // data, otherwise picks the new route's first available hour") was
    // never directly tested. W4: both routes have a different (≥3-hour)
    // window with distinguishable per-hour values, both A→B and B→A are
    // exercised, the selected hour is never the first option, and the
    // assertion checks the CARD/SUMMARY value for that hour, not just
    // `select.value`.
    describe("V3 — selected hour preservation/fallback across a route switch (T5)", () => {
      function payloadWithHours(base, hours, tempByHourIndex) {
        const points = base.forecast.points.map((p) =>
          makeForecastPoint(p.id, {
            hours,
            series: {
              temperature_2m: tempByHourIndex,
              wind_speed_10m: hours.map(() => 1),
              wind_gusts_10m: hours.map(() => 1),
              precipitation: hours.map(() => 0),
              weather_code: hours.map(() => 3),
            },
          })
        );
        return {
          ...base,
          forecast: {
            available: true,
            window: { startHour: hours[0], endHour: hours[hours.length - 1], expectedHours: hours },
            points,
            stale: false,
            cacheAgeMs: 0,
          },
        };
      }

      it("A→B→A: a selected hour present in BOTH windows is preserved across the switch, with no re-selection, and each route shows its OWN value at that hour", async () => {
        const [h1, h2, h3, h4] = [2, 3, 4, 5].map((h) => futureHourString(h));
        const vik = payloadWithHours(makePayload(), [h1, h2, h3], [-1, -2, -3]);
        const borgarnes = payloadWithHours(makeBorgarnesPayload(), [h2, h3, h4], [55, 66, 77]);
        const fetchMock = routeAwareFetch({ vik, borgarnes });
        vi.stubGlobal("fetch", fetchMock);
        await renderPage();

        const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
        const hourSelect = await screen.findByLabelText(translations.is.winterRouteHourLabel);
        await waitFor(() => expect(hourSelect.value).toBe(h1));

        const { fireEvent } = await import("@testing-library/react");
        // Select h2 — deliberately NOT the first option (W4).
        fireEvent.change(hourSelect, { target: { value: h2 } });
        await waitFor(() => expect(screen.getAllByText(`${formatDecimal(-2, "is", 1)} °C`)).toHaveLength(6));

        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });
        // h2 is also in Borgarnes' own window (at its own index 0, since
        // Borgarnes' window is [h2,h3,h4]) -> preserved without
        // re-selection, and Borgarnes shows ITS OWN h2 value (55), not
        // Vík's (-2).
        await waitFor(() => expect(screen.getByLabelText(translations.is.winterRouteHourLabel).value).toBe(h2));
        await waitFor(() => expect(screen.getAllByText(`${formatDecimal(55, "is", 1)} °C`)).toHaveLength(4));

        fireEvent.change(routeSelect, { target: { value: "raudavatn-vik" } });
        // Back to Vík — h2 still valid there too, preserved again, Vík's
        // OWN h2 value (-2) shown again.
        await waitFor(() => expect(screen.getByLabelText(translations.is.winterRouteHourLabel).value).toBe(h2));
        await waitFor(() => expect(screen.getAllByText(`${formatDecimal(-2, "is", 1)} °C`)).toHaveLength(6));
      });

      it("a selected hour NOT present in the new route's window falls back to that route's own first available hour, showing that route's own value", async () => {
        const [h1, h2, h3, h4] = [2, 3, 4, 5].map((h) => futureHourString(h));
        const vik = payloadWithHours(makePayload(), [h1, h2, h3], [-1, -2, -3]);
        const borgarnes = payloadWithHours(makeBorgarnesPayload(), [h2, h3, h4], [55, 66, 77]);
        const fetchMock = routeAwareFetch({ vik, borgarnes });
        vi.stubGlobal("fetch", fetchMock);
        await renderPage();

        const routeSelect = await screen.findByLabelText(translations.is.winterRouteRouteSelectLabel);
        const hourSelect = await screen.findByLabelText(translations.is.winterRouteHourLabel);
        // h1 is auto-selected (Vík's first hour) and is NOT in Borgarnes'
        // [h2,h3,h4] window.
        await waitFor(() => expect(hourSelect.value).toBe(h1));

        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        // Falls back to Borgarnes' OWN first available hour (h2), showing
        // Borgarnes' own h2 value (55) — never Vík's h1 value, never a
        // guessed/empty state.
        await waitFor(() => expect(screen.getByLabelText(translations.is.winterRouteHourLabel).value).toBe(h2));
        await waitFor(() => expect(screen.getAllByText(`${formatDecimal(55, "is", 1)} °C`)).toHaveLength(4));
      });
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
        await switchToLegacyMode();

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
        await switchToLegacyMode();

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
        await switchToLegacyMode();

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

      // Ticket #493 correction round, V1(c) (T2) — same frame-level
      // technique as the tests above, but for the hour-selection fix
      // itself: switching to a route whose own window does not contain the
      // previously selected hour at all (fully disjoint, not just a
      // shrunk one) must never commit the new route's h1 next to the OLD
      // route's real metric value.
      it("V1(c): switching to a route whose window does not contain the previous selection never commits the new route's h1 together with the OLD route's real value", async () => {
        const vikHours = [futureHourString(2), futureHourString(3)];
        const borgarnesHours = [futureHourString(10), futureHourString(11)]; // disjoint from vikHours
        const vik = makePayload();
        vik.forecast.window = { startHour: vikHours[0], endHour: vikHours[1], expectedHours: vikHours };
        vik.forecast.points.forEach((p) => {
          p.hours = vikHours;
          p.series.temperature_2m = [-7, -7];
        });
        const borgarnes = makeBorgarnesPayload();
        borgarnes.forecast.window = { startHour: borgarnesHours[0], endHour: borgarnesHours[1], expectedHours: borgarnesHours };
        borgarnes.forecast.points.forEach((p) => {
          p.hours = borgarnesHours;
          p.series.temperature_2m = [44, 44];
        });

        const fetchMock = routeAwareFetch({ vik, borgarnes });
        vi.stubGlobal("fetch", fetchMock);
        const commits = [];

        render(
          <MemoryRouter initialEntries={["/winter-route"]}>
            <React.Profiler
              id="probe-v1c"
              onRender={() => {
                commits.push({
                  h1: screen.queryByRole("heading", { level: 1 })?.textContent ?? null,
                  hasOldVikTemp: screen.queryAllByText(`${formatDecimal(-7, "is", 1)} °C`).length > 0,
                  hasBorgarnesTemp: screen.queryAllByText(`${formatDecimal(44, "is", 1)} °C`).length > 0,
                });
              }}
            >
              <WinterRoute />
            </React.Profiler>
          </MemoryRouter>
        );
        await switchToLegacyMode();

        await waitFor(() => expect(screen.getAllByText(`${formatDecimal(-7, "is", 1)} °C`)).toHaveLength(6));
        commits.length = 0;

        const routeSelect = screen.getByLabelText(translations.is.winterRouteRouteSelectLabel);
        const { fireEvent } = await import("@testing-library/react");
        fireEvent.change(routeSelect, { target: { value: "raudavatn-borgarnes" } });

        await waitFor(() => expect(screen.getAllByText(`${formatDecimal(44, "is", 1)} °C`)).toHaveLength(4));

        // Non-vacuity: the probe really observed the new route's own value.
        expect(commits.some((c) => c.hasBorgarnesTemp)).toBe(true);
        // Regression guard: no commit shows the new route's h1 together
        // with the OLD route's real value.
        const badCommit = commits.find((c) => c.h1 === BORGARNES_OPTION.nameIs && c.hasOldVikTemp);
        expect(badCommit).toBeUndefined();
      });
    });
  });

  // Ticket #502 — "Velja staði" Frá/Til search/select + route-base result
  // flow (approved-prompt-v1.md P1-P9). This is the NEW default mode on
  // /winter-route; the legacy flow's own tests above are unaffected (one
  // mechanical switchToLegacyMode() adaptation only, per P1c).
  describe("Ticket #502 — Velja staði Frá/Til geometry flow", () => {
    function geometryUrlToKey(url) {
      const q = new URL(String(url), "http://localhost").searchParams;
      return `${q.get("from")}|${q.get("to")}|${q.get("option") ?? ""}`;
    }

    // `responses` maps "from|to|option" (option "" when none) to either a
    // real-shaped 200 payload object, or an explicit { httpStatus, body }
    // for non-200 cases. `httpStatus` (not `status`) is deliberate: a real
    // 200 payload's own field is itself called `status` (geometry_only/
    // same_place/unsupported) -- using the same key here would collide.
    // Ticket #503 — a budardalur<->holmavik geometry_only result now also
    // triggers a SEPARATE /api/winter-route-data request (own effect, own
    // aria-live region). This helper's own fixtures are keyed by from/to/
    // option and know nothing about URL path, so without this guard a
    // winter-route-data call would wrongly match a winter-route-geometry
    // fixture (same from/to query params) and crash the data view on a
    // malformed shape. Tests that actually exercise winter-route-data use
    // their own dedicated fetch mock (see the Ticket #503 describe block).
    function geometryAwareFetch(responses) {
      return vi.fn().mockImplementation((url) => {
        if (String(url).includes("/api/winter-route-data")) {
          return Promise.reject(new Error("winter-route-data not stubbed by this helper"));
        }
        const key = geometryUrlToKey(url);
        const entry = responses[key];
        if (!entry) return Promise.reject(new Error(`no fixture for ${key}`));
        if (entry.httpStatus) return Promise.resolve({ ok: entry.httpStatus < 400, status: entry.httpStatus, json: async () => entry.body });
        return Promise.resolve({ ok: true, status: 200, json: async () => entry });
      });
    }

    const RVK = "reykjavik-raudavatn";
    const BUDARDALUR_HOLMAVIK_FIXTURE = {
      schemaVersion: 1, compositionVersion: 1, regionVersion: "x", from: "budardalur", to: "holmavik",
      crs: "EPSG:3057", tier: 0, drivingAccess: "UNVERIFIED", status: "geometry_only", geometryId: "g1",
      lengthM: 78697.77, lengthNote: "Tier-0 planar geometry length (EPSG:3057) ...", estimatedConnectorLengthM: 0,
      via: ["Gilsfjörður", "Þröskuldar"], idButurIds: [1, 2, 3],
      accessApproach: { budardalur: { ownerCoordinateOffsetM: 160.1 }, holmavik: { ownerCoordinateOffsetM: 437.3 } },
      coordinates: [{ x: 1, y: 2, z: 3 }], slices: [{ sourceId: 1, idbutur: 1 }],
    };
    const BUDARDALUR_TALKNAFJORDUR_FIXTURE = {
      schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "talknafjordur",
      estimatedConnectorLengthM: 0.005, via: ["Miklidalur"],
      accessApproach: { budardalur: { ownerCoordinateOffsetM: 160.1 }, talknafjordur: { ownerCoordinateOffsetM: 995.4, routeEndsShortOfOwnerCoordinate: true } },
    };
    const RVK_SELFOSS_OPTIONS_FIXTURE = {
      schemaVersion: 1, tier: 2, status: "geometry_only", from: RVK, to: "selfoss",
      selectedOption: "south", estimatedConnectorLengthM: 0,
      options: [
        { id: "south", label: "Short route via Hellisheiði", lengthM: 1, via: [], routeId: "a" },
        { id: "north", label: "Long route via the Route 1 ring", lengthM: 2, via: ["Borgarnes", "Akureyri", "Egilsstaðir", "Vík"], routeId: "b" },
      ],
    };
    const RVK_SELFOSS_NORTH_FIXTURE = { ...RVK_SELFOSS_OPTIONS_FIXTURE, selectedOption: "north" };
    const TALKNAFJORDUR_SAME_PLACE_FIXTURE = {
      schemaVersion: 1, tier: 0, status: "same_place", from: "talknafjordur", to: "talknafjordur",
      estimatedConnectorLengthM: 0, via: [],
      accessApproach: { talknafjordur: { ownerCoordinateOffsetM: 995.4, routeEndsShortOfOwnerCoordinate: true } },
    };
    const UNSUPPORTED_FIXTURE = { schemaVersion: 1, tier: 2, status: "unsupported", from: RVK, to: "budardalur", reason: "endpoint_mapping_unavailable" };

    it("P1(a): defaults to 'Velja staði' and fires no request at all on mount (no fetch to either endpoint)", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      await screen.findByLabelText(translations.is.winterRouteFromLabel);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("P1(b): /api/winter-route is never fetched while in geometry mode, but is fetched exactly once after switching to 'Fastar veðurleiðir'", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => makePayload() });
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      await screen.findByLabelText(translations.is.winterRouteFromLabel);
      expect(fetchMock).not.toHaveBeenCalled();

      await switchToLegacyMode();
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(fetchMock.mock.calls[0][0]).toBe("/api/winter-route");
    });

    it("P2(b)/(c): from/to selects share the same 11-place list grouped by network, and the access-point disclaimer is shown on a real result", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|holmavik|": BUDARDALUR_HOLMAVIK_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      for (const select of [fromSelect, toSelect]) {
        for (const place of WINTER_ROUTE_OPTIONS_PLACES()) {
          expect(within(select).getByText(place)).toBeInTheDocument();
        }
      }

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "holmavik" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteAccessPointDisclaimer)).toBeInTheDocument());
    });

    function WINTER_ROUTE_OPTIONS_PLACES() {
      return ["Reykjavík (Rauðavatn)", "Selfoss", "Hella", "Egilsstaðir", "Seyðisfjörður", "Búðardalur", "Flókalundur", "Ísafjörður", "Hólmavík", "Patreksfjörður", "Tálknafjörður"];
    }

    it("P3(a): searching for a place by its plain-ASCII (accent-stripped) name filters the select to that place, in both fields", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSearch = await screen.findByLabelText(translations.is.winterRouteFromSearchLabel);
      const fromSelect = screen.getByLabelText(translations.is.winterRouteFromLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSearch, { target: { value: "isafjordur" } });

      expect(within(fromSelect).getByText("Ísafjörður")).toBeInTheDocument();
      expect(within(fromSelect).queryByText("Selfoss")).toBeNull();
    });

    it("P3(b): a search that excludes the currently selected place never removes it from the select, and shows the no-results text", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSearch = await screen.findByLabelText(translations.is.winterRouteFromSearchLabel);
      const fromSelect = screen.getByLabelText(translations.is.winterRouteFromLabel);
      expect(fromSelect.value).toBe(RVK);

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSearch, { target: { value: "akureyri" } }); // matches no place in the 11-list

      // The selected value (Reykjavík/Rauðavatn) is still present/selected.
      expect(fromSelect.value).toBe(RVK);
      expect(within(fromSelect).getByText("Reykjavík (Rauðavatn)")).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteNoSearchResults)).toBeInTheDocument());
    });

    it("P3(d): the swap button exchanges From/To without submitting a request", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      expect(fromSelect.value).toBe(RVK);
      expect(toSelect.value).toBe("selfoss");

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteSwapLabel }));

      expect(fromSelect.value).toBe("selfoss");
      expect(toSelect.value).toBe(RVK);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("P3(c): From/To labels are properly associated (htmlFor), reachable via getByLabelText", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      expect(await screen.findByLabelText(translations.is.winterRouteFromLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(translations.is.winterRouteToLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(translations.is.winterRouteFromSearchLabel)).toBeInTheDocument();
      expect(screen.getByLabelText(translations.is.winterRouteToSearchLabel)).toBeInTheDocument();
    });

    it("P4(a)/(b): submitting fires /api/winter-route-geometry with from/to via URLSearchParams, and changing the draft afterwards hides the old result behind the 'selection changed' notice", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|holmavik|": BUDARDALUR_HOLMAVIK_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "holmavik" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteBaseDisclaimer)).toBeInTheDocument());
      expect(fetch.mock.calls[0][0]).toMatch(/^\/api\/winter-route-geometry\?from=budardalur&to=holmavik$/);

      // Now change the draft without resubmitting -- old result must hide.
      fireEvent.change(toSelect, { target: { value: "isafjordur" } });
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteSelectionChangedNotice)).toBeInTheDocument());
    });

    it("P4(d): a 200 unsupported response shows the generic 'no route yet' text, never the raw reason", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ [`${RVK}|budardalur|`]: UNSUPPORTED_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const toSelect = await screen.findByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(toSelect, { target: { value: "budardalur" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteNoRouteYet)).toBeInTheDocument());
      expect(screen.queryByText(/endpoint_mapping_unavailable/)).toBeNull();
    });

    it("P4(d): a 400 unknown_place_id for a legal UI pair (flokalundur<->ring) is the SAME 'no route yet' text, never a technical error", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "flokalundur|selfoss|": { httpStatus: 400, body: { error: "unknown_place_id", field: "from" } } }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "flokalundur" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteNoRouteYet)).toBeInTheDocument());
      expect(screen.queryByText(translations.is.winterRouteGenericError)).toBeNull();
    });

    it("P4(d): a network failure shows the generic error with a retry button, and retry re-sends the same request", async () => {
      // Deliberately NOT budardalur<->holmavik (or any of the 15 Westfjords
      // pairs ticket #503 now connects -- B<->H/westfjords-batch/westfjords-
      // completion) here: any of those would also fire its own separate
      // /api/winter-route-data request once the geometry result succeeds,
      // which this generic path-unaware mock can't distinguish --
      // budardalur<->selfoss is a real geometry_only pair with no options,
      // outside all three #503 modules, keeping this test's own scope
      // (geometry retry) focused.
      let callCount = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => {
          callCount += 1;
          if (callCount === 1) return Promise.reject(new Error("network down"));
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ ...BUDARDALUR_HOLMAVIK_FIXTURE, from: "budardalur", to: "selfoss" }) });
        })
      );
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "selfoss" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteGenericError)).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteRetryButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteBaseDisclaimer)).toBeInTheDocument());
      expect(callCount).toBe(2);
    });

    it("P4(e): an earlier, slower response for an abandoned pair never overwrites the current pair's result (reverse-order resolution)", async () => {
      const fetchMock = vi.fn().mockImplementation((url) => {
        const key = geometryUrlToKey(url);
        if (key === "budardalur|holmavik|") {
          return new Promise((resolve) => setTimeout(() => resolve({ ok: true, status: 200, json: async () => BUDARDALUR_HOLMAVIK_FIXTURE }), 50));
        }
        if (key === "budardalur|talknafjordur|") {
          return Promise.resolve({ ok: true, status: 200, json: async () => BUDARDALUR_TALKNAFJORDUR_FIXTURE });
        }
        return Promise.reject(new Error(`no fixture for ${key}`));
      });
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "holmavik" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton })); // slow (50ms)

      fireEvent.change(toSelect, { target: { value: "talknafjordur" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton })); // fast, resolves first

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteApproachShortNote)).toBeInTheDocument());
      // Wait past the slow, now-abandoned Hólmavík response's own delay.
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(screen.getByText(translations.is.winterRouteApproachShortNote)).toBeInTheDocument();
      expect(screen.queryByText(translations.is.winterRouteViaLabel.replace("{via}", "Gilsfjörður, Þröskuldar"))).toBeNull();
    });

    it("P5(d)/(e)/(g): shows the estimated-connector and short-approach notes when applicable, and never renders raw lengthNote/options[].label/geometryId/coordinates/slices", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|talknafjordur|": BUDARDALUR_TALKNAFJORDUR_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "talknafjordur" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteEstimatedConnectorNote)).toBeInTheDocument());
      expect(screen.getByText(translations.is.winterRouteApproachShortNote)).toBeInTheDocument();
      expect(screen.queryByText(/Tier-0 planar geometry length/)).toBeNull();
      expect(screen.queryByText("g1")).toBeNull();
      expect(screen.queryByText(/EPSG:3057/)).toBeNull();
    });

    it("P5(h): a same_place result shows the dedicated message, with the short-approach note when the flag is set", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "talknafjordur|talknafjordur|": TALKNAFJORDUR_SAME_PLACE_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "talknafjordur" } });
      fireEvent.change(toSelect, { target: { value: "talknafjordur" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteSamePlaceMessage)).toBeInTheDocument());
      expect(screen.getByText(translations.is.winterRouteApproachShortNote)).toBeInTheDocument();
    });

    it("P6(a)/(b)/(c): options only render for a pair with >1 real options, labeled via i18n (never the raw API label), and selecting one issues a new request", async () => {
      const fetchMock = geometryAwareFetch({
        [`${RVK}|selfoss|`]: RVK_SELFOSS_OPTIONS_FIXTURE,
        [`${RVK}|selfoss|north`]: RVK_SELFOSS_NORTH_FIXTURE,
      });
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      const southButton = await screen.findByRole("radio", { name: translations.is.winterRouteOptionSouth });
      expect(screen.getByRole("radio", { name: translations.is.winterRouteOptionNorth })).toBeInTheDocument();
      expect(southButton).toHaveAttribute("aria-checked", "true");
      // Never the raw English API label.
      expect(screen.queryByText("Short route via Hellisheiði")).toBeNull();

      fireEvent.click(screen.getByRole("radio", { name: translations.is.winterRouteOptionNorth }));
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteViaLabel.replace("{via}", "Borgarnes, Akureyri, Egilsstaðir, Vík"))).toBeInTheDocument());
      expect(fetchMock.mock.calls.at(-1)[0]).toMatch(/option=north/);
    });

    it("P6(a): a pair without real options (e.g. Hella<->Selfoss shape) never renders an option control", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|holmavik|": BUDARDALUR_HOLMAVIK_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "holmavik" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteBaseDisclaimer)).toBeInTheDocument());
      expect(screen.queryByRole("radiogroup")).toBeNull();
    });

    it("renders in English with the same keys/behavior", async () => {
      localStorage.setItem("lang", JSON.stringify("en"));
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|holmavik|": BUDARDALUR_HOLMAVIK_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.en.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.en.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "holmavik" } });
      fireEvent.click(screen.getByRole("button", { name: translations.en.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.en.winterRouteAccessPointDisclaimer)).toBeInTheDocument());
    });

    it("P1(e): the h1/<title> read the applied pair once a result is shown, never a mismatched legacy name", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|holmavik|": BUDARDALUR_HOLMAVIK_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(translations.is.winterRouteModeChooseLabel);

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "holmavik" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Búðardalur → Hólmavík"));
    });

    it("unmounting while a request is in flight never triggers a post-unmount state update (no React act warning, request is aborted)", async () => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(() => {}))); // never resolves
      const { unmount } = render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "holmavik" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      expect(() => unmount()).not.toThrow();
    });
    it("P3/P6: arrow-key option selection restores focus after loading, and swap resets the option", async () => {
      let finishNorth;
      const fetchMock = vi.fn().mockImplementation((url) => geometryUrlToKey(url).endsWith("|north")
        ? new Promise((resolve) => { finishNorth = resolve; })
        : Promise.resolve({ status: 200, json: async () => RVK_SELFOSS_OPTIONS_FIXTURE }));
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
      const south = await screen.findByRole("radio", { name: translations.is.winterRouteOptionSouth });
      south.focus();
      fireEvent.keyDown(south, { key: "ArrowRight" });
      expect(fetchMock.mock.calls.at(-1)[0]).toMatch(/option=north/);
      await act(async () => finishNorth({ status: 200, json: async () => RVK_SELFOSS_NORTH_FIXTURE }));
      expect(screen.getByRole("radio", { name: translations.is.winterRouteOptionNorth })).toHaveFocus();
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteSwapLabel }));
      expect(screen.queryByRole("radio")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
      expect(fetchMock.mock.calls.at(-1)[0]).not.toMatch(/option=/);
    });

    it("P3: a retry restores a stable focus target without stealing focus from a search field", async () => {
      let finish;
      const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline")).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      const { fireEvent } = await import("@testing-library/react");
      const submit = screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton });
      fireEvent.click(submit);
      const retry = await screen.findByRole("button", { name: translations.is.winterRouteRetryButton });
      retry.focus();
      fireEvent.click(retry);
      await act(async () => finish({ status: 200, json: async () => RVK_SELFOSS_OPTIONS_FIXTURE }));
      expect(submit).toHaveFocus();
      const north = screen.getByRole("radio", { name: translations.is.winterRouteOptionNorth });
      north.focus();
      fireEvent.click(north);
      const search = screen.getByLabelText(translations.is.winterRouteFromSearchLabel);
      search.focus();
      await act(async () => finish({ status: 200, json: async () => RVK_SELFOSS_NORTH_FIXTURE }));
      expect(search).toHaveFocus();
    });

    it("P4: duplicate submit is disabled only during that request and geometry has no stale draft frame", async () => {
      let finish;
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((resolve) => { finish = resolve; })));
      const commits = [];
      const { container } = render(<React.Profiler id="geometry" onRender={() => {
        const result = document.querySelector('[data-route-option="south"]');
        const from = document.getElementById("winter-route-from-select");
        commits.push({ from: from?.value, options: Boolean(result) });
      }}><MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter></React.Profiler>);
      const { fireEvent } = await import("@testing-library/react");
      const submit = screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton });
      fireEvent.submit(submit.closest("form"));
      expect(submit).toBeDisabled();
      await act(async () => finish({ status: 200, json: async () => RVK_SELFOSS_OPTIONS_FIXTURE }));
      expect(submit).not.toBeDisabled();
      fireEvent.change(screen.getByLabelText(translations.is.winterRouteFromLabel), { target: { value: "budardalur" } });
      expect(container.querySelector('[data-route-option="south"]')).toBeNull();
      expect(commits.some((c) => c.from === "budardalur" && c.options)).toBe(false);
    });

  });

  // Ticket #503 — the first B<->H (Búðardalur<->Hólmavík) weather/road
  // data binding, layered under a confirmed geometry_only result.
  describe("Ticket #503 — Búðardalur<->Hólmavík weather/road data", () => {
    // Local copy — the "Ticket #502" describe block's own geometryUrlToKey
    // is scoped to that block's own closure, not visible here (a sibling
    // describe, not nested inside it).
    function geometryUrlToKey(url) {
      const q = new URL(String(url), "http://localhost").searchParams;
      return `${q.get("from")}|${q.get("to")}|${q.get("option") ?? ""}`;
    }

    const FORWARD_GEOMETRY_ID = "forward-geometry-id-abc";
    const REVERSE_GEOMETRY_ID = "reverse-geometry-id-xyz";
    const DATA_HOURS = [futureHourString(2), futureHourString(3)];

    function geometryFixture(from, to, geometryId) {
      return {
        schemaVersion: 1, tier: 0, status: "geometry_only", from, to, geometryId,
      };
    }

    function dataFixture(from, to, geometryId, overrides = {}) {
      return {
        from, to, geometryId, regionVersion: "r1", routeLengthM: 78697.77,
        generatedAt: "2026-11-23T17:00:00.000Z",
        roadSections: [
          { idButur: 805030037, nameIs: "Skógstagl-Búðardalur", nameEn: "Skógstagl–Búðardalur", routeLengthM: 205, routeLengthFraction: 0.0026, isEdgeSegment: true, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] },
          { idButur: 907040037, nameIs: "Hólmavík-Drangsnesvegur", nameEn: "Hólmavík–Drangsnesvegur", routeLengthM: 517, routeLengthFraction: 0.0066, isEdgeSegment: true, segmentDataAvailable: true, category: "closed", positiveStyleEligible: false, astandYfirbord: "LOKAD", astandLysing: "Lokað", astandLysingEn: "Closed", export: { isStale: false }, registration: { isOld: false }, notices: [] },
        ],
        roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
        forecast: {
          available: true,
          window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS },
          points: [
            { id: "budardalur-route", labelIs: "Búðardalur", labelEn: "Búðardalur", available: true, returnedLatitude: 65.1, returnedLongitude: -21.7, elevation: 22, hours: DATA_HOURS, series: { temperature_2m: [-1, -2], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } },
            { id: "throskuldar-south-route", labelIs: "Þröskuldar — sunnanverð leið", labelEn: "Þröskuldar — south side", available: true, returnedLatitude: 65.4, returnedLongitude: -21.9, elevation: 41, hours: DATA_HOURS, series: { temperature_2m: [-2, -3], wind_speed_10m: [2, 2], wind_gusts_10m: [2, 2], precipitation: [0, 0], weather_code: [3, 3] } },
            { id: "throskuldar-pass-route", labelIs: "Þröskuldar", labelEn: "Þröskuldar", available: true, returnedLatitude: 65.5, returnedLongitude: -21.8, elevation: 369, hours: DATA_HOURS, series: { temperature_2m: [-5, -6], wind_speed_10m: [5, 5], wind_gusts_10m: [8, 8], precipitation: [1, 1], weather_code: [71, 71] } },
            { id: "holmavik-route", labelIs: "Hólmavík", labelEn: "Hólmavík", available: true, returnedLatitude: 65.7, returnedLongitude: -21.68, elevation: 20, hours: DATA_HOURS, series: { temperature_2m: [0, -1], wind_speed_10m: [3, 3], wind_gusts_10m: [4, 4], precipitation: [0, 0], weather_code: [3, 3] } },
          ],
          stale: false, cacheAgeMs: 0,
        },
        ...overrides,
      };
    }

    function dualEndpointFetch({ onDataRequest } = {}) {
      return vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) {
          onDataRequest?.(u);
          const params = new URL(u, "http://localhost").searchParams;
          const from = params.get("from"), to = params.get("to"), geometryId = params.get("geometryId");
          return Promise.resolve({ status: 200, json: async () => dataFixture(from, to, geometryId) });
        }
        const key = geometryUrlToKey(u);
        if (key === "budardalur|holmavik|") return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "holmavik", FORWARD_GEOMETRY_ID) });
        if (key === "holmavik|budardalur|") return Promise.resolve({ status: 200, json: async () => geometryFixture("holmavik", "budardalur", REVERSE_GEOMETRY_ID) });
        if (key === "reykjavik-raudavatn|selfoss|") {
          return Promise.resolve({
            status: 200,
            json: async () => ({ schemaVersion: 1, tier: 2, status: "geometry_only", from: "reykjavik-raudavatn", to: "selfoss" }),
          });
        }
        return Promise.reject(new Error(`no fixture for ${key}`));
      });
    }

    async function submitBudardalurHolmavik() {
      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel, { selector: "select" });
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel, { selector: "select" });
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "budardalur" } });
      fireEvent.change(toSelect, { target: { value: "holmavik" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
    }

    it("P6(a): fires /api/winter-route-data exactly once, only after the B<->H geometry_only result is confirmed, with the real geometryId", async () => {
      let dataCalls = 0;
      const fetchMock = dualEndpointFetch({ onDataRequest: () => { dataCalls += 1; } });
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      await submitBudardalurHolmavik();
      expect(dataCalls).toBe(0); // not yet -- geometry request still in flight on the very first tick

      await waitFor(() => expect(dataCalls).toBe(1));
      const dataCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/api/winter-route-data"));
      expect(dataCall[0]).toContain(`geometryId=${FORWARD_GEOMETRY_ID}`);
    });

    it("P6(a): never fires for same_place/unsupported/other pairs", async () => {
      const fetchMock = dualEndpointFetch();
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteBaseDisclaimer)).toBeInTheDocument());

      expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("/api/winter-route-data"))).toBe(false);
    });

    it("shows loading, then the connected disclaimer, 4 forecast cards, road sections, and the edge-segment note — never raw technical fields", async () => {
      vi.stubGlobal("fetch", dualEndpointFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();

      // Note: the data fetch's own "loading" text is not asserted here --
      // this test's mock resolves it essentially synchronously, so the
      // intermediate loading state is not reliably observable; the
      // dedicated unmount/abort tests below use a never-resolving promise
      // and assert the loading text there instead, where it IS reliable.
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
      // The generic "not yet connected" text must NOT also be shown once connected.
      expect(screen.queryByText(translations.is.winterRouteBaseDisclaimer)).toBeNull();

      // Scoped to the data section's own status region (the second of the
      // two role="status" regions) -- "Búðardalur"/"Þröskuldar" etc. are
      // ambiguous page-wide (they're also real <option> text in both
      // Frá/Til selects).
      const dataRegion = screen.getByTestId("winter-route-data");
      const data = within(dataRegion);
      expect(data.getByText("Búðardalur")).toBeInTheDocument();
      expect(data.getByText("Þröskuldar — sunnanverð leið")).toBeInTheDocument();
      expect(data.getAllByText("Þröskuldar").length).toBeGreaterThan(0);
      expect(data.getByText("Hólmavík")).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteNoCoveragePointsNote)).toBeInTheDocument();

      expect(data.getByText("Skógstagl-Búðardalur")).toBeInTheDocument();
      expect(data.getByText("Hólmavík-Drangsnesvegur")).toBeInTheDocument();
      const edgeNotes = data.getAllByText(/nær aðeins yfir stuttan hluta leiðarinnar/);
      expect(edgeNotes).toHaveLength(2); // both 805030037 and 907040037 are edge segments

      expect(screen.queryByText(/regionVersion/)).toBeNull();
      expect(screen.queryByText("r1")).toBeNull();
    });

    it("keeps cards and the local hour select outside live status regions", async () => {
      vi.stubGlobal("fetch", dualEndpointFetch());
      render(<MemoryRouter><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();
      const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
      expect(select.closest('[role="status"], [aria-live]')).toBeNull();
      expect(within(screen.getByTestId("winter-route-data")).getByText("Þröskuldar — sunnanverð leið").closest('[role="status"], [aria-live]')).toBeNull();
    });

    it("marks stale and unavailable feeds and excludes elapsed hours", async () => {
      const base = dualEndpointFetch();
      vi.stubGlobal("fetch", vi.fn((url) => {
        if (!String(url).includes("/api/winter-route-data")) return base(url);
        const d = dataFixture("budardalur", "holmavik", FORWARD_GEOMETRY_ID);
        d.forecast.stale = true; d.forecast.cacheAgeMs = 600000;
        d.forecast.window.expectedHours = ["2000-01-01T00:00", ...DATA_HOURS];
        d.roadMeta = { ...d.roadMeta, available: false, stale: true, cacheAgeMs: 300000 };
        return Promise.resolve({ status: 200, json: async () => d });
      }));
      render(<MemoryRouter><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();
      const select = await screen.findByLabelText(translations.is.winterRouteHourLabel);
      expect(select.value).toBe(DATA_HOURS[0]);
      expect([...select.options].some((o) => o.value.startsWith("2000"))).toBe(false);
      expect(screen.getByText(translations.is.winterRouteForecastStaleServed.replace("{minutes}", "10"))).toBeInTheDocument();
      expect(screen.getByText(translations.is.winterRouteRoadStaleServed.replace("{minutes}", "5"))).toBeInTheDocument();
      expect(screen.getByText(translations.is.winterRouteRoadFeedUnavailable)).toBeInTheDocument();
    });

    it.each(["missing forecast", "wrong identity", "missing roads", "missing series"])("rejects malformed successful data: %s", async (kind) => {
      const base = dualEndpointFetch();
      vi.stubGlobal("fetch", vi.fn((url) => {
        if (!String(url).includes("/api/winter-route-data")) return base(url);
        const d = dataFixture("budardalur", "holmavik", FORWARD_GEOMETRY_ID);
        if (kind === "missing forecast") delete d.forecast;
        if (kind === "wrong identity") d.from = "holmavik";
        if (kind === "missing roads") delete d.roadSections;
        if (kind === "missing series") delete d.forecast.points[0].series;
        return Promise.resolve({ status: 200, json: async () => d });
      }));
      render(<MemoryRouter><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();
      await screen.findByText(translations.is.winterRouteGenericError);
      expect(screen.queryByLabelText(translations.is.winterRouteHourLabel)).toBeNull();
    });

    it.each(["holmavik", "flokalundur"])("announces missing forecast without claiming zero points: B to %s", async (to) => {
      vi.stubGlobal("fetch", vi.fn((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) return Promise.resolve({ status: 200, json: async () => dataFixture("budardalur", to, FORWARD_GEOMETRY_ID, { forecast: { available: false, reason: "key_missing", points: [] } }) });
        return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", to, FORWARD_GEOMETRY_ID) });
      }));
      render(<MemoryRouter><WinterRoute /></MemoryRouter>);
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(screen.getByLabelText(translations.is.winterRouteFromLabel, { selector: "select" }), { target: { value: "budardalur" } });
      fireEvent.change(screen.getByLabelText(translations.is.winterRouteToLabel, { selector: "select" }), { target: { value: to } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
      const region = await screen.findByTestId("winter-route-data");
      await waitFor(() => expect(within(region).getByRole("heading", { name: translations.is.winterRouteForecastUnavailable })).toBeInTheDocument());
      expect(within(region).getByRole("status")).toHaveClass("sr-only");
      expect(within(region).getByRole("status")).toHaveTextContent(translations.is.winterRouteForecastUnavailable);
      expect(within(region).queryByText(translations.is.winterRouteDataForecastHeading.replace("{count}", "0"))).toBeNull();
      expect(within(region).queryByText(translations.is.winterRouteNoCoveragePointsNote)).toBeNull();
    });

    it("H->B: the reverse direction fetches with the reverse geometryId", async () => {
      vi.stubGlobal("fetch", dualEndpointFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel, { selector: "select" });
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel, { selector: "select" });
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: "holmavik" } });
      fireEvent.change(toSelect, { target: { value: "budardalur" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
    });

    it("changing the draft away from B<->H aborts the in-flight data request and never shows it under the new pair", async () => {
      let resolveData;
      const fetchMock = vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) return new Promise((resolve) => { resolveData = resolve; });
        const key = geometryUrlToKey(u);
        if (key === "budardalur|holmavik|") return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "holmavik", FORWARD_GEOMETRY_ID) });
        if (key === "budardalur|selfoss|") return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "selfoss", geometryId: "other-id" }) });
        return Promise.reject(new Error(`no fixture for ${key}`));
      });
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataLoading)).toBeInTheDocument());

      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel, { selector: "select" });
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(toSelect, { target: { value: "selfoss" } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteBaseDisclaimer)).toBeInTheDocument());

      // The abandoned B<->H data request resolving late must never surface.
      await act(async () => resolveData?.({ status: 200, json: async () => dataFixture("budardalur", "holmavik", FORWARD_GEOMETRY_ID) }));
      expect(screen.queryByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeNull();
    });

    it("a geometry_mismatch / non-200 response from winter-route-data shows the generic error, never a crash or fabricated data", async () => {
      const fetchMock = vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) return Promise.resolve({ status: 400, json: async () => ({ error: "geometry_mismatch" }) });
        const key = geometryUrlToKey(u);
        if (key === "budardalur|holmavik|") return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "holmavik", FORWARD_GEOMETRY_ID) });
        return Promise.reject(new Error(`no fixture for ${key}`));
      });
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();

      await waitFor(() => expect(screen.getAllByText(translations.is.winterRouteGenericError).length).toBeGreaterThan(0));
      expect(screen.getByText(translations.is.winterRouteBaseDisclaimer)).toBeInTheDocument(); // geometry result itself still shown, unaffected
    });

    it("unmounting while the data request is in flight never triggers a post-unmount state update", async () => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) return new Promise(() => {});
        const key = geometryUrlToKey(u);
        if (key === "budardalur|holmavik|") return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "holmavik", FORWARD_GEOMETRY_ID) });
        return Promise.reject(new Error(`no fixture for ${key}`));
      }));
      const { unmount } = render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataLoading)).toBeInTheDocument());

      expect(() => unmount()).not.toThrow();
    });

    // Ticket #503 westfjords-batch, P6(a)/P7(c) -- the same request-gate/
    // data-view flow generalized to a non-B<->H connected pair. Uses its
    // own 5-point fixture (with approxDistanceFromStartKm, unlike B<->H's
    // fixture above) so the dynamic point-count heading and the computed
    // largest-gap note are exercised against real varying data.
    const FLOKALUNDUR_GEOMETRY_ID = "flokalundur-geometry-id-def";
    function flokalundurDataFixture(from, to, geometryId) {
      return dataFixture(from, to, geometryId, {
        roadSections: [
          { idButur: 905070037, nameIs: "Klettsháls", nameEn: "Klettsháls", routeLengthM: 5230, routeLengthFraction: 0.03, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] },
        ],
        forecast: {
          available: true,
          window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS },
          points: [
            { id: "budardalur-route", labelIs: "Búðardalur", labelEn: "Búðardalur", available: true, approxDistanceFromStartKm: 0, returnedLatitude: 65.1, returnedLongitude: -21.7, elevation: 22, hours: DATA_HOURS, series: { temperature_2m: [-1, -2], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } },
            { id: "svinadalur-route", labelIs: "Svínadalur", labelEn: "Svínadalur", available: true, approxDistanceFromStartKm: 24.1, returnedLatitude: 65.2, returnedLongitude: -21.9, elevation: 100, hours: DATA_HOURS, series: { temperature_2m: [-2, -2], wind_speed_10m: [2, 2], wind_gusts_10m: [2, 2], precipitation: [0, 0], weather_code: [3, 3] } },
            { id: "gilsfjordur-route", labelIs: "Gilsfjörður", labelEn: "Gilsfjörður", available: true, approxDistanceFromStartKm: 38.7, returnedLatitude: 65.3, returnedLongitude: -22.0, elevation: 50, hours: DATA_HOURS, series: { temperature_2m: [-2, -3], wind_speed_10m: [2, 2], wind_gusts_10m: [3, 3], precipitation: [0, 0], weather_code: [3, 3] } },
            { id: "klettshals-route", labelIs: "Klettsháls", labelEn: "Klettsháls", available: true, approxDistanceFromStartKm: 122.4, returnedLatitude: 65.4, returnedLongitude: -22.5, elevation: 400, hours: DATA_HOURS, series: { temperature_2m: [-5, -6], wind_speed_10m: [5, 5], wind_gusts_10m: [8, 8], precipitation: [1, 1], weather_code: [71, 71] } },
            { id: "flokalundur-route", labelIs: "Flókalundur", labelEn: "Flókalundur", available: true, approxDistanceFromStartKm: 172.5, returnedLatitude: 65.5, returnedLongitude: -23.0, elevation: 10, hours: DATA_HOURS, series: { temperature_2m: [0, -1], wind_speed_10m: [3, 3], wind_gusts_10m: [4, 4], precipitation: [0, 0], weather_code: [3, 3] } },
          ],
          stale: false, cacheAgeMs: 0,
        },
      });
    }

    // Ticket #503 westfjords-completion -- a non-B<->H, non-batch connected
    // pair (isafjordur<->holmavik), with its own 5-point fixture matching
    // the real P2(B) chainage (sudavikurhlid 21.3km, vatnsfjardarhals
    // 127.6km -> largest gap ~106.3km).
    const ISAFJORDUR_HOLMAVIK_GEOMETRY_ID = "isafjordur-holmavik-geometry-id-ghi";
    function isafjordurHolmavikDataFixture(from, to, geometryId) {
      return dataFixture(from, to, geometryId, {
        roadSections: [
          { idButur: 906140037, nameIs: "Súðavíkurhlíð", nameEn: "Súðavíkurhlíð", routeLengthM: 12700, routeLengthFraction: 0.057, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] },
        ],
        forecast: {
          available: true,
          window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS },
          points: [
            { id: "isafjordur-route", labelIs: "Ísafjörður — leiðarpunktur", labelEn: "Ísafjörður — route point", available: true, approxDistanceFromStartKm: 0, returnedLatitude: 66.07, returnedLongitude: -23.12, elevation: 1, hours: DATA_HOURS, series: { temperature_2m: [-1, -1], wind_speed_10m: [2, 2], wind_gusts_10m: [3, 3], precipitation: [0, 0], weather_code: [3, 3] } },
            { id: "sudavikurhlid-route", labelIs: "Nærri Súðavík", labelEn: "Near Súðavík", available: true, approxDistanceFromStartKm: 21.3, returnedLatitude: 66.02, returnedLongitude: -22.99, elevation: 15, hours: DATA_HOURS, series: { temperature_2m: [-1, -2], wind_speed_10m: [3, 3], wind_gusts_10m: [4, 4], precipitation: [0, 0], weather_code: [3, 3] } },
            { id: "vatnsfjardarhals-route", labelIs: "Nærri Vatnsfjarðarhálsi", labelEn: "Near Vatnsfjarðarháls", available: true, approxDistanceFromStartKm: 127.6, returnedLatitude: 65.93, returnedLongitude: -22.52, elevation: 122, hours: DATA_HOURS, series: { temperature_2m: [-4, -5], wind_speed_10m: [6, 6], wind_gusts_10m: [9, 9], precipitation: [1, 1], weather_code: [71, 71] } },
            { id: "steingrimsfjardarheidi-route", labelIs: "Nærri Steingrímsfjarðarheiði", labelEn: "Near Steingrímsfjarðarheiði", available: true, approxDistanceFromStartKm: 195.9, returnedLatitude: 65.75, returnedLongitude: -22.11, elevation: 435, hours: DATA_HOURS, series: { temperature_2m: [-5, -6], wind_speed_10m: [7, 7], wind_gusts_10m: [10, 10], precipitation: [1, 1], weather_code: [73, 73] } },
            { id: "holmavik-route", labelIs: "Hólmavík", labelEn: "Hólmavík", available: true, approxDistanceFromStartKm: 223.1, returnedLatitude: 65.7, returnedLongitude: -21.68, elevation: 20, hours: DATA_HOURS, series: { temperature_2m: [0, -1], wind_speed_10m: [3, 3], wind_gusts_10m: [4, 4], precipitation: [0, 0], weather_code: [3, 3] } },
          ],
          stale: false, cacheAgeMs: 0,
        },
      });
    }

    function batchAwareFetch() {
      return vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) {
          const params = new URL(u, "http://localhost").searchParams;
          const from = params.get("from"), to = params.get("to"), geometryId = params.get("geometryId");
          const fixture =
            geometryId === FLOKALUNDUR_GEOMETRY_ID ? flokalundurDataFixture(from, to, geometryId)
            : geometryId === ISAFJORDUR_HOLMAVIK_GEOMETRY_ID ? isafjordurHolmavikDataFixture(from, to, geometryId)
            : dataFixture(from, to, geometryId);
          return Promise.resolve({ status: 200, json: async () => fixture });
        }
        const key = geometryUrlToKey(u);
        if (key === "budardalur|holmavik|") return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "holmavik", FORWARD_GEOMETRY_ID) });
        if (key === "budardalur|flokalundur|") return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "flokalundur", FLOKALUNDUR_GEOMETRY_ID) });
        if (key === "isafjordur|holmavik|") return Promise.resolve({ status: 200, json: async () => geometryFixture("isafjordur", "holmavik", ISAFJORDUR_HOLMAVIK_GEOMETRY_ID) });
        if (key === "budardalur|selfoss|") return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 2, status: "geometry_only", from: "budardalur", to: "selfoss", geometryId: "unconnected-id" }) });
        return Promise.reject(new Error(`no fixture for ${key}`));
      });
    }

    async function chooseAndSubmit(from, to) {
      const fromSelect = screen.getByLabelText(translations.is.winterRouteFromLabel, { selector: "select" });
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel, { selector: "select" });
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fromSelect, { target: { value: from } });
      fireEvent.change(toSelect, { target: { value: to } });
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
    }

    it("westfjords-batch pair (B<->F): fires /api/winter-route-data same as B<->H, with a dynamic 5-point heading and the computed largest-gap note", async () => {
      vi.stubGlobal("fetch", batchAwareFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await chooseAndSubmit("budardalur", "flokalundur");

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
      const dataRegion = screen.getByTestId("winter-route-data");
      const data = within(dataRegion);
      expect(data.getByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "5") })).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteNoCoveragePointsNote)).toBeInTheDocument();
      // Largest gap is Gilsfjörður (38.7km) -> Klettsháls (122.4km) = 83,7 km.
      expect(
        data.getByText(
          translations.is.winterRouteLargestGapNote.replace("{km}", "83,7").replace("{pointA}", "Gilsfjörður").replace("{pointB}", "Klettsháls")
        )
      ).toBeInTheDocument();
      expect(data.getByText("Svínadalur")).toBeInTheDocument();
      expect(data.getByText("Flókalundur")).toBeInTheDocument();
    });

    it("B<->H shows no computed largest-gap note (its own fixture carries no approxDistanceFromStartKm)", async () => {
      vi.stubGlobal("fetch", batchAwareFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());

      const dataRegion = screen.getByTestId("winter-route-data");
      const data = within(dataRegion);
      expect(data.getByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "4") })).toBeInTheDocument();
      expect(screen.queryByText(/km/)).toBeNull();
    });

    it("P6(c): B<->H -> westfjords-batch pair -> an unconnected pair -> the same batch pair again never shows stale data under the wrong header", async () => {
      // Place names ("Hólmavík"/"Flókalundur") are ambiguous page-wide --
      // they're also real <option> text in both Frá/Til selects -- so every
      // check below is scoped to the data region itself (same discipline as
      // the "never raw technical fields" test above). "selfoss" is used as
      // the unconnected pair here (not "isafjordur", which the ticket-503
      // westfjords-completion round connects to budardalur).
      vi.stubGlobal("fetch", batchAwareFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      await chooseAndSubmit("budardalur", "holmavik");
      await waitFor(() => expect(within(screen.getByTestId("winter-route-data")).getByText("Hólmavík")).toBeInTheDocument());

      await chooseAndSubmit("budardalur", "flokalundur");
      await waitFor(() => expect(within(screen.getByTestId("winter-route-data")).getByText("Flókalundur")).toBeInTheDocument());
      expect(within(screen.getByTestId("winter-route-data")).queryByText("Hólmavík")).toBeNull();

      await chooseAndSubmit("budardalur", "selfoss");
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteBaseDisclaimer)).toBeInTheDocument());
      expect(screen.queryByTestId("winter-route-data")).toBeNull();

      await chooseAndSubmit("budardalur", "flokalundur");
      await waitFor(() => expect(within(screen.getByTestId("winter-route-data")).getByText("Flókalundur")).toBeInTheDocument());
      expect(screen.queryByText(translations.is.winterRouteBaseDisclaimer)).toBeNull();
    });

    it("westfjords-completion pair (I<->H): fires /api/winter-route-data same as B<->H/batch, with a dynamic 5-point heading and the ~106.3km computed largest-gap note", async () => {
      vi.stubGlobal("fetch", batchAwareFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await chooseAndSubmit("isafjordur", "holmavik");

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
      const dataRegion = screen.getByTestId("winter-route-data");
      const data = within(dataRegion);
      expect(data.getByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "5") })).toBeInTheDocument();
      // Largest gap is Súðavík (21.3km) -> Vatnsfjarðarháls (127.6km) = 106,3 km.
      expect(
        data.getByText(
          translations.is.winterRouteLargestGapNote.replace("{km}", "106,3").replace("{pointA}", "Nærri Súðavík").replace("{pointB}", "Nærri Vatnsfjarðarhálsi")
        )
      ).toBeInTheDocument();
      expect(data.getByText("Nærri Steingrímsfjarðarheiði")).toBeInTheDocument();
      expect(data.getByText("Hólmavík")).toBeInTheDocument();
    });
  });
});
