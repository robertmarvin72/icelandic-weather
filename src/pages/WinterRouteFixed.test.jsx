// src/pages/WinterRouteFixed.test.jsx -- Ticket #492, direct-flow round
// 2, R3/V3. Own small file for the fixed-route-adapter flow (Rauðavatn
// <-> Vík/Borgarnes via /api/winter-route?routeId=...), per this
// ticket's own established convention of NOT folding everything into
// the already-large WinterRoute.test.jsx/WinterRouteOverview.test.jsx.
// Nothing here duplicates those files' own geometry-pair coverage.
//
// Jonesy's result-review (round 1) found this flow had ZERO component
// tests at all -- disabling the entire fixed-dispatch, every identity
// guard, the client same-place guard, the C4 registration fix, the
// requestId guard, the Borgarnes caveat, and the notice-counter
// semantics all left the existing suite 283/283 green. Every test below
// is written to fail on its own named mutation (see cc-report for the
// mutation-proof log).
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WinterRoute from "./WinterRoute";
import { translations } from "../i18n/translations";
import { WINTER_ROUTE_OPTIONS } from "../lib/winterRouteRoutes";
import c4Fixtures from "../../docs/ai/tasks/ticket-492/direct-flow/evidence/followup/c4-fixtures.json";

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

// localStorage persists across tests within this file (jsdom does not
// reset it automatically); an EN test's own `localStorage.setItem("lang",
// ...)` would otherwise leak into every later test, which defaults to IS.
beforeEach(() => {
  localStorage.clear();
});

function selectWinterRoutePlace(input, placeId) {
  fireEvent.focus(input);
  const listbox = document.getElementById(input.getAttribute("aria-controls"));
  const option = listbox?.querySelector(`[data-place-id="${placeId}"]`);
  if (!option) throw new Error(`selectWinterRoutePlace: no option for "${placeId}"`);
  fireEvent.mouseDown(option);
  fireEvent.click(option);
}

async function selectAndSubmit(from, to, lang = "is") {
  const fromLabel = lang === "en" ? translations.en.winterRouteFromLabel : translations.is.winterRouteFromLabel;
  const toLabel = lang === "en" ? translations.en.winterRouteToLabel : translations.is.winterRouteToLabel;
  const showLabel = lang === "en" ? translations.en.winterRouteShowRouteButton : translations.is.winterRouteShowRouteButton;
  const fromInput = await screen.findByLabelText(fromLabel);
  const toInput = screen.getByLabelText(toLabel);
  selectWinterRoutePlace(fromInput, from);
  selectWinterRoutePlace(toInput, to);
  fireEvent.click(screen.getByRole("button", { name: showLabel }));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
function futureHourString(offsetHours) {
  const d = new Date(Date.now() + offsetHours * 3600000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:00`;
}
const HOURS = [futureHourString(2), futureHourString(3)];

const VIK_ROUTE = WINTER_ROUTE_OPTIONS.find((r) => r.routeId === "raudavatn-vik");
const BORGARNES_ROUTE = WINTER_ROUTE_OPTIONS.find((r) => r.routeId === "raudavatn-borgarnes");

// A controllable, hand-built, real-shape-matching fixed-route payload
// (fresh/non-stale, unlike the realistic-timestamp evidence fixtures --
// deliberately controllable here the same way every other component
// test file in this ticket builds its own small fixtures; the SEPARATE
// real-handler-shaped c4Fixtures import above is used only for the C4
// tests, which specifically need to prove the real response shape, not
// a hand-made one).
function plainSegment(idButur, overrides = {}) {
  return {
    idButur, nameIs: `Kafli ${idButur}`, nameEn: `Section ${idButur}`,
    segmentDataAvailable: true, ambiguous: false, category: "passable", positiveStyleEligible: true,
    astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null, astandLysing: "Greiðfært", astandLysingEn: "Easily passable",
    export: { dagsKeyrtUt: "2026-11-25T08:00:00Z", ageMinutes: 1, isStale: false },
    registration: { dagsSkrad: "2026-11-25T08:00:00Z", ageHours: 1, isOld: false },
    notices: [],
    ...overrides,
  };
}
function fixedPayload(route, { segmentOverrides = {}, forecastAvailable = true } = {}) {
  return {
    routeId: route.routeId,
    expectedPointCount: route.expectedPointCount,
    generatedAt: "2026-11-25T09:00:00.000Z",
    segments: route.idButurOrder.map((id) => {
      const overrides = segmentOverrides[id] ?? {};
      return plainSegment(id, overrides);
    }),
    roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
    forecast: forecastAvailable
      ? {
          available: true,
          window: { startHour: HOURS[0], endHour: HOURS[1], expectedHours: HOURS },
          points: route.pointIdOrder.map((id, i) => ({
            id, labelIs: `Punktur ${id}`, labelEn: `Point ${id}`, available: true,
            returnedLatitude: 65, returnedLongitude: -21, elevation: 10 + i, hours: HOURS,
            series: { temperature_2m: [1, 1], wind_speed_10m: [2, 2], wind_gusts_10m: [3, 3], precipitation: [0, 0], weather_code: [3, 3] },
          })),
          stale: false, cacheAgeMs: 0,
        }
      : { available: false, reason: "both_feeds_failed", points: [] },
  };
}

function unsupportedGeometryPayload(from, to) {
  return { schemaVersion: 1, tier: 0, status: "unsupported", from, to, geometryId: null };
}

function fixedFetchMock({ vik, borgarnes, onCall } = {}) {
  let callCount = 0;
  const calls = [];
  return vi.fn().mockImplementation((url) => {
    callCount += 1;
    const u = String(url);
    calls.push(u);
    onCall?.(u, callCount);
    if (u.includes("/api/winter-route?")) {
      const params = new URL(u, "http://localhost").searchParams;
      const routeId = params.get("routeId");
      const payload = routeId === "raudavatn-vik" ? vik : routeId === "raudavatn-borgarnes" ? borgarnes : null;
      if (!payload) return Promise.resolve({ status: 404, json: async () => ({}) });
      return Promise.resolve({ status: 200, json: async () => payload });
    }
    if (u.includes("/api/winter-route-geometry")) {
      const params = new URL(u, "http://localhost").searchParams;
      return Promise.resolve({ status: 200, json: async () => unsupportedGeometryPayload(params.get("from"), params.get("to")) });
    }
    return Promise.reject(new Error(`no fixture for ${u}`));
  });
}

describe("Ticket #492, direct-flow round 2 -- fetch count: exactly 1 fixed request, 0 geometry, 0 extra on hour-step/language", () => {
  it("Rauðavatn -> Vík: exactly 1 /api/winter-route?routeId=raudavatn-vik call, 0 geometry calls", async () => {
    const fetchMock = fixedFetchMock({ vik: fixedPayload(VIK_ROUTE) });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await screen.findByTestId("winter-route-data");
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.includes("/api/winter-route?"))).toHaveLength(1);
    expect(urls.filter((u) => u.includes("geometry"))).toHaveLength(0);
  });

  it("Rauðavatn -> Borgarnes: exactly 1 fixed request, 0 geometry", async () => {
    const fetchMock = fixedFetchMock({ borgarnes: fixedPayload(BORGARNES_ROUTE) });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "borgarnes");
    await screen.findByTestId("winter-route-data");
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.includes("/api/winter-route?"))).toHaveLength(1);
    expect(urls.filter((u) => u.includes("geometry"))).toHaveLength(0);
  });

  it("stepping the time slider never fires a new fetch on the fixed flow", async () => {
    const fetchMock = fixedFetchMock({ vik: fixedPayload(VIK_ROUTE) });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    const region = await screen.findByTestId("winter-route-data");
    const countBefore = fetchMock.mock.calls.length;
    const slider = within(region).getByRole("slider");
    fireEvent.change(slider, { target: { value: "1" } });
    expect(fetchMock.mock.calls.length).toBe(countBefore);
  });
});

describe("Ticket #492, direct-flow round 2, R1/V1 -- retry re-runs the FIXED request, never geometry", () => {
  it("a transient network error on Vík: retry re-sends /api/winter-route?routeId=raudavatn-vik, never geometry; data appears after", async () => {
    let attempt = 0;
    const fetchMock = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route?")) {
        attempt += 1;
        if (attempt === 1) return Promise.reject(new Error("network down"));
        return Promise.resolve({ status: 200, json: async () => fixedPayload(VIK_ROUTE) });
      }
      return Promise.reject(new Error(`unexpected ${u}`));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteGenericError)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteRetryButton }));
    await screen.findByTestId("winter-route-data");

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.includes("/api/winter-route?"))).toHaveLength(2);
    expect(urls.filter((u) => u.includes("geometry"))).toHaveLength(0);
    expect(screen.queryByText(translations.is.winterRouteNoRouteYet)).toBeNull();
  });

  it("a 200 response that fails validFixedRouteData (invalid shape) on Borgarnes: retry re-sends the fixed request and succeeds", async () => {
    let attempt = 0;
    const fetchMock = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route?")) {
        attempt += 1;
        if (attempt === 1) return Promise.resolve({ status: 200, json: async () => ({ routeId: "raudavatn-borgarnes", expectedPointCount: 999 }) });
        return Promise.resolve({ status: 200, json: async () => fixedPayload(BORGARNES_ROUTE) });
      }
      return Promise.reject(new Error(`unexpected ${u}`));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "borgarnes");
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteGenericError)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteRetryButton }));
    await screen.findByTestId("winter-route-data");
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.includes("geometry"))).toHaveLength(0);
    expect(screen.queryByText(translations.is.winterRouteNoRouteYet)).toBeNull();
  });
});

describe("Ticket #492, direct-flow round 2, R3/V3(c) -- the 4th identity kind rejects every blended/wrong-generation response", () => {
  const cases = [
    ["wrong routeId in the payload", (p) => ({ ...p, routeId: "raudavatn-borgarnes" })],
    ["wrong expectedPointCount", (p) => ({ ...p, expectedPointCount: 999 })],
    ["carries a geometryId (blended identity)", (p) => ({ ...p, geometryId: "geo-1" })],
    ["carries a datasetVersion (blended identity)", (p) => ({ ...p, datasetVersion: "ds1" })],
    ["carries a regionVersion (blended identity)", (p) => ({ ...p, regionVersion: "r1" })],
    ["missing one segment", (p) => ({ ...p, segments: p.segments.slice(1) })],
    ["one extra segment", (p) => ({ ...p, segments: [...p.segments, plainSegment(999999999)] })],
    ["segments in swapped order", (p) => ({ ...p, segments: [p.segments[1], p.segments[0], ...p.segments.slice(2)] })],
    ["missing one forecast point", (p) => ({ ...p, forecast: { ...p.forecast, points: p.forecast.points.slice(1) } })],
    ["forecast points in swapped order", (p) => ({ ...p, forecast: { ...p.forecast, points: [p.forecast.points[1], p.forecast.points[0], ...p.forecast.points.slice(2)] } })],
  ];

  for (const [label, mutate] of cases) {
    it(`rejects: ${label}`, async () => {
      const bad = mutate(fixedPayload(VIK_ROUTE));
      vi.stubGlobal("fetch", fixedFetchMock({ vik: bad }));
      render(<MemoryRouter><WinterRoute /></MemoryRouter>);
      await selectAndSubmit("reykjavik-raudavatn", "vik");
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteGenericError)).toBeInTheDocument());
      expect(screen.queryByTestId("winter-route-data")).toBeNull();
    });
  }

  it("a Borgarnes-shaped response is rejected for a Vík request (and vice versa)", async () => {
    vi.stubGlobal("fetch", fixedFetchMock({ vik: fixedPayload(BORGARNES_ROUTE) }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteGenericError)).toBeInTheDocument());
  });
});

describe("Ticket #492, direct-flow round 2, R3/V3(b) -- C4: real-handler-shaped fixtures (never hand-made with a fabricated registration)", () => {
  it("fixed route (Vík): road feed down + forecast ok -- shows weather AND 'road not available', never a generic error", async () => {
    vi.stubGlobal("fetch", fixedFetchMock({ vik: c4Fixtures.fixedVik_roadDown_forecastOk }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText(translations.is.winterRouteRoadFeedUnavailable)).toBeInTheDocument());
    // Weather is still shown -- the segments' own missing `registration`
    // (the real C4 shape) must not fail the whole response as "generic error".
    expect(screen.queryByText(translations.is.winterRouteGenericError)).toBeNull();
  });

  it("fixed route (Vík): forecast down + road ok -- road visible, weather unavailable", async () => {
    vi.stubGlobal("fetch", fixedFetchMock({ vik: c4Fixtures.fixedVik_forecastDown_roadOk }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getAllByText(translations.is.winterRouteForecastUnavailable).length).toBeGreaterThan(0));
    expect(screen.queryByText(translations.is.winterRouteGenericError)).toBeNull();
  });

  it("old pair (Búðardalur<->Hólmavík): road feed down + forecast ok -- same real-shape fix applies (shared helper)", async () => {
    const fx = c4Fixtures.oldPairBH_roadDown_forecastOk;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) return Promise.resolve({ status: 200, json: async () => fx.data });
      return Promise.resolve({ status: 200, json: async () => fx.geometry });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText(translations.is.winterRouteRoadFeedUnavailable)).toBeInTheDocument());
    expect(screen.queryByText(translations.is.winterRouteGenericError)).toBeNull();
  });

  it("old pair (Búðardalur<->Hólmavík): forecast down + road ok", async () => {
    const fx = c4Fixtures.oldPairBH_forecastDown_roadOk;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) return Promise.resolve({ status: 200, json: async () => fx.data });
      return Promise.resolve({ status: 200, json: async () => fx.geometry });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getAllByText(translations.is.winterRouteForecastUnavailable).length).toBeGreaterThan(0));
    expect(screen.queryByText(translations.is.winterRouteGenericError)).toBeNull();
  });
});

describe("Ticket #492, direct-flow round 2, R3/V3 -- client same-place guard (vik/borgarnes only), reverse direction, swap cycle", () => {
  it("vik -> vik: 0 fetch, same-place message", async () => {
    const fetchMock = fixedFetchMock({});
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("vik", "vik");
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteSamePlaceMessage)).toBeInTheDocument());
    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  it("borgarnes -> borgarnes: 0 fetch, same-place message", async () => {
    const fetchMock = fixedFetchMock({});
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("borgarnes", "borgarnes");
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteSamePlaceMessage)).toBeInTheDocument());
    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  it("vik -> reykjavik-raudavatn (reverse), hella -> vik, vik <-> borgarnes: all 'no route yet', via geometry's own real unsupported response", async () => {
    const fetchMock = fixedFetchMock({});
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    for (const [from, to] of [["vik", "reykjavik-raudavatn"], ["hella", "vik"], ["vik", "borgarnes"], ["borgarnes", "vik"]]) {
      await selectAndSubmit(from, to);
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteNoRouteYet)).toBeInTheDocument());
    }
  });

  it("swap cycle: supported fixed pair -> swap -> unsupported -> swap back -> supported again, re-fetching correctly", async () => {
    const fetchMock = fixedFetchMock({ vik: fixedPayload(VIK_ROUTE) });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await screen.findByTestId("winter-route-data");

    fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteSwapLabel }));
    fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteNoRouteYet)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteSwapLabel }));
    fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
    await screen.findByTestId("winter-route-data");

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.includes("/api/winter-route?"))).toHaveLength(2);
    expect(urls.filter((u) => u.includes("geometry"))).toHaveLength(1);
  });
});

describe("Ticket #492, direct-flow round 2, R3/V3(d)/M8 -- a stale response race never overwrites a newer applied pair", () => {
  it("SAME pair (Vík) requested, abandoned for Borgarnes, then requested again: the FIRST Vík request's response arriving LAST (after the SECOND Vík request already resolved) never overwrites it -- both share the identical requestState `key`, so only the requestId guard (not the key-match check) can tell them apart", async () => {
    let resolveFirstVik;
    const firstVikPromise = new Promise((res) => { resolveFirstVik = res; });
    let vikCall = 0;
    const secondVikPayload = fixedPayload(VIK_ROUTE, {
      segmentOverrides: { [VIK_ROUTE.idButurOrder[0]]: { notices: [{ idPunktur: 1, astand: "VEGAVINNA", status: "active", lysing: "Seinni-vik-vegavinna", lysingEn: "Second-vik-roadworks" }] } },
    });
    const fetchMock = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("routeId=raudavatn-vik")) {
        vikCall += 1;
        if (vikCall === 1) return firstVikPromise;
        return Promise.resolve({ status: 200, json: async () => secondVikPayload });
      }
      if (u.includes("routeId=raudavatn-borgarnes")) return Promise.resolve({ status: 200, json: async () => fixedPayload(BORGARNES_ROUTE) });
      return Promise.reject(new Error(`unexpected ${u}`));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik"); // request #1 (held pending)
    await selectAndSubmit("reykjavik-raudavatn", "borgarnes"); // unrelated pair, resolves immediately
    await screen.findByTestId("winter-route-data");
    await selectAndSubmit("reykjavik-raudavatn", "vik"); // request #2, SAME key as #1, resolves immediately
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText(/Seinni-vik-vegavinna/)).toBeInTheDocument());

    // Request #1 (stale, same key as #2) now resolves, with DIFFERENT notice text.
    resolveFirstVik({
      status: 200,
      json: async () => fixedPayload(VIK_ROUTE, {
        segmentOverrides: { [VIK_ROUTE.idButurOrder[0]]: { notices: [{ idPunktur: 2, astand: "VEGAVINNA", status: "active", lysing: "FYRSTA-vik-STALE", lysingEn: "First-vik-STALE" }] } },
      }),
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(within(region).getByText(/Seinni-vik-vegavinna/)).toBeInTheDocument();
    expect(screen.queryByText(/FYRSTA-vik-STALE/)).toBeNull();
  });

  it("fixed <-> fixed: submitting Vík then quickly Borgarnes, with Vík's response arriving LAST, shows Borgarnes (never the stale Vík data)", async () => {
    let resolveVik;
    const vikPromise = new Promise((res) => { resolveVik = res; });
    const fetchMock = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("routeId=raudavatn-vik")) return vikPromise;
      if (u.includes("routeId=raudavatn-borgarnes")) return Promise.resolve({ status: 200, json: async () => fixedPayload(BORGARNES_ROUTE) });
      return Promise.reject(new Error(`unexpected ${u}`));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await selectAndSubmit("reykjavik-raudavatn", "borgarnes");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getAllByText(translations.is.winterRouteDataForecastHeading.replace("{count}", "4")).length).toBeGreaterThan(0));

    resolveVik({ status: 200, json: async () => fixedPayload(VIK_ROUTE) });
    // give the late Vík response a tick to (wrongly) apply, if it were going to
    await new Promise((r) => setTimeout(r, 0));
    expect(within(region).getAllByText(translations.is.winterRouteDataForecastHeading.replace("{count}", "4")).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(translations.is.winterRouteDataForecastHeading.replace("{count}", "6")).length).toBe(0);
  });

  it("fixed <-> geometry: submitting Vík then quickly a geometry pair, with Vík's response arriving LAST, shows the geometry pair (never stale Vík data)", async () => {
    let resolveVik;
    const vikPromise = new Promise((res) => { resolveVik = res; });
    const fetchMock = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("routeId=raudavatn-vik")) return vikPromise;
      if (u.includes("/api/winter-route-geometry")) {
        const params = new URL(u, "http://localhost").searchParams;
        return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: params.get("from"), to: params.get("to"), geometryId: "geo-fwd" }) });
      }
      return Promise.reject(new Error(`unexpected ${u}`));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await selectAndSubmit("budardalur", "holmavik");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Búðardalur"));

    resolveVik({ status: 200, json: async () => fixedPayload(VIK_ROUTE) });
    await new Promise((r) => setTimeout(r, 0));
    // Still showing the geometry pair's own title, never a fixed-route view.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Búðardalur");
  });
});

describe("Ticket #492, direct-flow round 2, R3/C5 -- Borgarnes shows its own section-coverage note, Vík does not", () => {
  it("Borgarnes shows winterRouteSectionCoverageNote", async () => {
    vi.stubGlobal("fetch", fixedFetchMock({ borgarnes: fixedPayload(BORGARNES_ROUTE) }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "borgarnes");
    await screen.findByTestId("winter-route-data");
    expect(screen.getByText(translations.is.winterRouteSectionCoverageNote)).toBeInTheDocument();
  });

  it("Vík does NOT show winterRouteSectionCoverageNote", async () => {
    vi.stubGlobal("fetch", fixedFetchMock({ vik: fixedPayload(VIK_ROUTE) }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await screen.findByTestId("winter-route-data");
    expect(screen.queryByText(translations.is.winterRouteSectionCoverageNote)).toBeNull();
  });
});

describe("Ticket #492, direct-flow round 2, R3/P5(iv) -- notice counter semantics on the fixed flow", () => {
  it("0 notices -- all-clear, never a false count", async () => {
    vi.stubGlobal("fetch", fixedFetchMock({ vik: fixedPayload(VIK_ROUTE) }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await screen.findByTestId("winter-route-data");
    expect(screen.getByText(translations.is.winterRouteRoadOverviewAllClear)).toBeInTheDocument();
  });

  it("exactly 1 notice-carrying segment -- singular form", async () => {
    const first = VIK_ROUTE.idButurOrder[0];
    const payload = fixedPayload(VIK_ROUTE, {
      segmentOverrides: { [first]: { notices: [{ idPunktur: 1, astand: "VEGAVINNA", status: "active", lysing: "Vegavinna", lysingEn: "Roadworks" }] } },
    });
    vi.stubGlobal("fetch", fixedFetchMock({ vik: payload }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await screen.findByTestId("winter-route-data");
    expect(screen.getByText(translations.is.winterRouteRoadSummaryCountOne)).toBeInTheDocument();
  });

  it("2 notices on the SAME segment count as 1, not 2; a 3rd notice on a different segment makes it 2", async () => {
    const [first, second] = VIK_ROUTE.idButurOrder;
    const payload = fixedPayload(VIK_ROUTE, {
      segmentOverrides: {
        [first]: { notices: [
          { idPunktur: 1, astand: "VEGAVINNA", status: "active", lysing: "Vegavinna", lysingEn: "Roadworks" },
          { idPunktur: 2, astand: "STEINKAST", status: "active", lysing: "Grjóthrun", lysingEn: "Rockfall" },
        ] },
        [second]: { notices: [{ idPunktur: 3, astand: "MOKSTUR", status: "expired", lysing: "Mokstur", lysingEn: "Snow clearing", gildirTil: "2020-01-01T00:00:00Z" }] },
      },
    });
    vi.stubGlobal("fetch", fixedFetchMock({ vik: payload }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await screen.findByTestId("winter-route-data");
    // 2 distinct segments with >=1 notice => plural "2 kaflar..."
    expect(screen.getByText(translations.is.winterRouteRoadSummaryCount.replace("{count}", "2"))).toBeInTheDocument();
  });

  it("an expired notice still counts its own segment; an unknown_unclassified segment with ZERO real notices does not count", async () => {
    const [first, second] = VIK_ROUTE.idButurOrder;
    const payload = fixedPayload(VIK_ROUTE, {
      segmentOverrides: {
        [first]: { notices: [{ idPunktur: 1, astand: "ALLUR_AKSTUR_BANN", status: "expired", lysing: "Lokun", lysingEn: "Closure", gildirTil: "2020-01-01T00:00:00Z" }] },
        // unknown_unclassified with NO notices (e.g. missing segment data) -- never counted as a "notice" segment.
        [second]: { segmentDataAvailable: false, category: "unknown_unclassified", astandYfirbord: null, astandLysing: null, astandLysingEn: null, notices: [] },
      },
    });
    vi.stubGlobal("fetch", fixedFetchMock({ vik: payload }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik");
    await screen.findByTestId("winter-route-data");
    expect(screen.getByText(translations.is.winterRouteRoadSummaryCountOne)).toBeInTheDocument();
  });

  it("IS/EN plural forms render their own distinct strings for 2 notice-carrying segments", async () => {
    const [first, second] = VIK_ROUTE.idButurOrder;
    const payload = fixedPayload(VIK_ROUTE, {
      segmentOverrides: {
        [first]: { notices: [{ idPunktur: 1, astand: "VEGAVINNA", status: "active", lysing: "Vegavinna", lysingEn: "Roadworks" }] },
        [second]: { notices: [{ idPunktur: 2, astand: "STEINKAST", status: "active", lysing: "Grjóthrun", lysingEn: "Rockfall" }] },
      },
    });
    vi.stubGlobal("fetch", fixedFetchMock({ vik: payload }));
    localStorage.setItem("lang", JSON.stringify("en"));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik", "en");
    await screen.findByTestId("winter-route-data");
    expect(screen.getByText(translations.en.winterRouteRoadSummaryCount.replace("{count}", "2"))).toBeInTheDocument();
  });
});

// Ticket #492, direct-flow round 2, R4/V4 -- SegmentRow rendering for
// A/B/C/D + the closure-protection case, in an ACTUAL rendered
// component (not just the pure winterRouteSurfaceDisplayCategory/
// winterRouteUnknownAdditionCode unit tests in
// winterRouteRoadConditionCodes.test.js), IS and EN. Each of these is
// also the named test that a specific mutation (M6/M10, see cc-report)
// must fail.
describe("Ticket #492, direct-flow round 2, R4/V4(5) -- SegmentRow A/B/C/D + closure, rendered, IS and EN", () => {
  const first = VIK_ROUTE.idButurOrder[0];

  function caseFixture(overrides) {
    return fixedPayload(VIK_ROUTE, { segmentOverrides: { [first]: overrides } });
  }

  async function renderCase(overrides, lang = "is") {
    if (lang === "en") localStorage.setItem("lang", JSON.stringify("en"));
    vi.stubGlobal("fetch", fixedFetchMock({ vik: caseFixture(overrides) }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("reykjavik-raudavatn", "vik", lang);
    return screen.findByTestId("winter-route-data");
  }

  it("path A (known surface + unclassified notice) -- pill shows the real surface, both notices shown directly, IS", async () => {
    const region = await renderCase({
      category: "unknown_unclassified", ambiguous: false, astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null,
      notices: [{ idPunktur: 1, astand: "TONN_ALLS", status: "active", lysing: "Tonn alls á dag: 8", lysingEn: "Total tonnes per day: 8" }],
    });
    const row = within(region).getByText("Kafli " + first).closest("li");
    expect(within(row).getByText(translations.is.winterRouteCategoryPassable)).toBeInTheDocument();
    expect(within(row).queryByText(translations.is.winterRouteCategoryUnknownUnclassified)).toBeNull();
    expect(within(row).getByText(/Tonn alls á dag: 8/)).toBeInTheDocument();
  });

  it("path B (ambiguous) -- pill stays unknown, no astandLysing line presented as a known surface, IS", async () => {
    const region = await renderCase({
      category: "unknown_unclassified", ambiguous: true, astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null,
      astandLysing: "Greiðfært", astandLysingEn: "Easily passable", notices: [],
    });
    const row = within(region).getByText("Kafli " + first).closest("li");
    expect(within(row).getByText(translations.is.winterRouteCategoryUnknownUnclassified)).toBeInTheDocument();
    expect(within(row).queryByText("Greiðfært")).toBeNull();
    expect(within(row).getByText(translations.is.winterRouteConflictingRoadData)).toBeInTheDocument();
  });

  it("path B (ambiguous), EN -- same, in English", async () => {
    const region = await renderCase({
      category: "unknown_unclassified", ambiguous: true, astandYfirbord: "GREIDFAERT", astandVidbotaruppl: null,
      astandLysing: "Greiðfært", astandLysingEn: "Easily passable", notices: [],
    }, "en");
    const row = within(region).getByText("Section " + first).closest("li");
    expect(within(row).getByText(translations.en.winterRouteCategoryUnknownUnclassified)).toBeInTheDocument();
    expect(within(row).queryByText("Easily passable")).toBeNull();
    expect(within(row).getByText(translations.en.winterRouteConflictingRoadData)).toBeInTheDocument();
  });

  it("path C (surface itself unclassified) -- stays unknown, shows the provider's own description text, IS", async () => {
    const region = await renderCase({
      category: "unknown_unclassified", ambiguous: false, astandYfirbord: "HOLUR_I_VEGI", astandVidbotaruppl: null,
      astandLysing: "Holur í vegi", astandLysingEn: "Potholes", notices: [],
    });
    const row = within(region).getByText("Kafli " + first).closest("li");
    expect(within(row).getByText(translations.is.winterRouteCategoryUnknownUnclassified)).toBeInTheDocument();
    expect(within(row).getByText("Holur í vegi")).toBeInTheDocument();
  });

  it("path D (known surface + unclassified addition, not ambiguous) -- pill shows the real surface AND the unknown-addition code line, default visible, IS", async () => {
    const region = await renderCase({
      category: "unknown_unclassified", ambiguous: false, astandYfirbord: "GREIDFAERT", astandVidbotaruppl: "TONN_ALLS",
      astandLysing: "Greiðfært", astandLysingEn: "Easily passable", notices: [],
    });
    const row = within(region).getByText("Kafli " + first).closest("li");
    expect(within(row).getByText(translations.is.winterRouteCategoryPassable)).toBeInTheDocument();
    expect(within(row).queryByText(translations.is.winterRouteCategoryUnknownUnclassified)).toBeNull();
    expect(within(row).getByText(translations.is.winterRouteUnknownAdditionCode.replace("{code}", "TONN_ALLS"))).toBeInTheDocument();
  });

  it("path D, EN -- same, in English, code shown as safe plain text", async () => {
    const region = await renderCase({
      category: "unknown_unclassified", ambiguous: false, astandYfirbord: "GREIDFAERT", astandVidbotaruppl: "TONN_ALLS",
      astandLysing: "Greiðfært", astandLysingEn: "Easily passable", notices: [],
    }, "en");
    const row = within(region).getByText("Section " + first).closest("li");
    expect(within(row).getByText(translations.en.winterRouteCategoryPassable)).toBeInTheDocument();
    expect(within(row).getByText(translations.en.winterRouteUnknownAdditionCode.replace("{code}", "TONN_ALLS"))).toBeInTheDocument();
  });

  it("closure case: ambiguous + a REAL closure -- the closure pill is never lost; only the description line is replaced, IS", async () => {
    const region = await renderCase({
      category: "closed", ambiguous: true, astandYfirbord: "LOKAD", astandVidbotaruppl: null,
      astandLysing: "Lokað", astandLysingEn: "Closed", notices: [],
    });
    const row = within(region).getByText("Kafli " + first).closest("li");
    expect(within(row).getByText(translations.is.winterRouteCategoryClosed)).toBeInTheDocument();
    expect(within(row).getByText(translations.is.winterRouteConflictingRoadData)).toBeInTheDocument();
  });

  it("missing segment data -- stays unknown/unavailable, unaffected", async () => {
    const region = await renderCase({
      category: "unknown_unclassified", ambiguous: false, segmentDataAvailable: false,
      astandYfirbord: null, astandVidbotaruppl: null, astandLysing: null, astandLysingEn: null, notices: [],
    });
    const row = within(region).getByText("Kafli " + first).closest("li");
    expect(within(row).getByText(translations.is.winterRouteCategoryUnknownUnclassified)).toBeInTheDocument();
    expect(within(row).getByText(translations.is.winterRouteSegmentDataUnavailable)).toBeInTheDocument();
  });
});
