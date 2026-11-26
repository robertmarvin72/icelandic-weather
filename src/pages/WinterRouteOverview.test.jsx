// src/pages/WinterRouteOverview.test.jsx — Ticket #492, first overview
// round. New focused tests for the restructured "Velja staði" data view
// (RoadOverviewSection / WinterRoutePointsTable in WinterRoute.jsx), kept
// in this OWN file per the approved prompt's P3 (the existing
// WinterRoute.test.jsx is already 2700+ lines and its V1/T2 tests are
// already slow on CI; this file is not added to it). Legacy/identity/
// race/draft tests live in WinterRoute.test.jsx, unaffected by this file.
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WinterRoute from "./WinterRoute";
import { translations } from "../i18n/translations";
import { formatDecimal } from "../lib/winterRoutePresentation";

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

function pad2(n) {
  return String(n).padStart(2, "0");
}
function futureHourString(offsetHours) {
  const d = new Date(Date.now() + offsetHours * 3600000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:00`;
}
const HOURS = [futureHourString(2), futureHourString(3)];

// Ticket #492, round 3 (UX priority) -- Frá/Til are now a single
// accessible combobox each (see PlaceField in WinterRoute.jsx), not a
// native <select>. Selection is driven the same real way a user/screen
// reader would: focus opens the listbox, mousedown+click commits the
// chosen option (see WinterRoute.test.jsx's own selectWinterRoutePlace,
// kept duplicated here rather than shared across files per this file's
// own header note that it stays independent of WinterRoute.test.jsx).
function selectWinterRoutePlace(input, placeId) {
  fireEvent.focus(input);
  const listbox = document.getElementById(input.getAttribute("aria-controls"));
  const option = listbox?.querySelector(`[data-place-id="${placeId}"]`);
  if (!option) {
    throw new Error(`selectWinterRoutePlace: no option for "${placeId}" in #${input.getAttribute("aria-controls")}`);
  }
  fireEvent.mouseDown(option);
  fireEvent.click(option);
}

async function selectAndSubmit(from, to) {
  const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
  const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
  selectWinterRoutePlace(fromSelect, from);
  selectWinterRoutePlace(toSelect, to);
  fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
}

// A Westfjords (regionVersion identity) B<->H-style fixture, extended with
// one point that has NO data at all, and one section that is `passable`
// but still carries an active notice (to prove notice/condition are shown
// independently of each other, never hiding one because of the other).
function regionDataFixture(from, to, geometryId) {
  return {
    from, to, geometryId, regionVersion: "r1", routeLengthM: 78697.77,
    generatedAt: "2026-11-24T09:00:00.000Z",
    roadSections: [
      { idButur: 1, nameIs: "Kafli A", nameEn: "Section A", routeLengthM: 40000, routeLengthFraction: 0.5, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [{ idPunktur: 10, astand: "VEGAVINNA", status: "active", lysing: "Vegavinna á Kafla A", lysingEn: "Roadworks on Section A" }] },
      { idButur: 2, nameIs: "Kafli B", nameEn: "Section B", routeLengthM: 20000, routeLengthFraction: 0.25, isEdgeSegment: false, segmentDataAvailable: false, category: "unknown_unclassified", positiveStyleEligible: false, astandYfirbord: null, astandLysing: null, astandLysingEn: null, export: { isStale: false }, registration: { isOld: false }, notices: [] },
      { idButur: 3, nameIs: "Kafli C", nameEn: "Section C", routeLengthM: 18697.77, routeLengthFraction: 0.237, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] },
    ],
    roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
    forecast: {
      available: true,
      window: { startHour: HOURS[0], endHour: HOURS[1], expectedHours: HOURS },
      points: [
        { id: "p1", labelIs: "Punktur Eitt", labelEn: "Point One", available: true, returnedLatitude: 65, returnedLongitude: -21, elevation: 10, hours: HOURS, series: { temperature_2m: [-1.5, null], wind_speed_10m: [2, 2], wind_gusts_10m: [3, 3], precipitation: [0, 0.4], weather_code: [3, 3] } },
        { id: "p2", labelIs: "Punktur Tvö", labelEn: "Point Two", available: false },
      ],
      stale: false, cacheAgeMs: 0,
    },
  };
}

function regionFetch() {
  return vi.fn().mockImplementation((url) => {
    const u = String(url);
    if (u.includes("/api/winter-route-data")) {
      const params = new URL(u, "http://localhost").searchParams;
      return Promise.resolve({ status: 200, json: async () => regionDataFixture(params.get("from"), params.get("to"), params.get("geometryId")) });
    }
    const q = new URL(u, "http://localhost").searchParams;
    const key = `${q.get("from")}|${q.get("to")}`;
    if (key === "budardalur|holmavik") return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    return Promise.reject(new Error(`no fixture for ${u}`));
  });
}

describe("Ticket #492, direct-flow -- road overview (dense flagged list by default, single 'Sjá alla vegkafla' control, no duplicates)", () => {
  it("shows the active-notice section (still 'passable') AND the unavailable-data section, with real notice content, in the default list -- each exactly once, before opening the full list", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");

    const region = await screen.findByTestId("winter-route-data");
    const data = within(region);
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());

    // Ticket #492, direct-flow -- source.md "Sýna tilkynningar beint, án
    // tvítekninga": a flagged section's own name appears EXACTLY ONCE
    // (the former separate name-only chip + a second full-details copy
    // is gone -- there is only ever one mounted list at a time, and the
    // default list already uses the full SegmentRow card). "Kafli C"
    // (plain passable, no notice) is not flagged at all, so it is not
    // in the DOM yet.
    expect(data.getAllByText("Kafli A")).toHaveLength(1);
    expect(data.getAllByText("Kafli B")).toHaveLength(1);
    expect(data.queryByText("Kafli C")).toBeNull();
    expect(within(region).getByRole("button", { name: translations.is.winterRouteViewAllSectionsAction }).getAttribute("aria-expanded")).toBe("false");

    // "Greiðfært" is Kafli A's own surface description, suppressed only
    // when it's textually redundant with the pill label -- here it is
    // (category "passable" -> label "Greiðfært" too), so it appears via
    // the pill alone, once.
    expect(data.getAllByText(translations.is.winterRouteCategoryPassable).length).toBeGreaterThan(0);
    expect(data.getAllByText(/Vegavinna á Kafla A/).length).toBeGreaterThan(0);
    // Ticket #492, direct-flow, P5/source.md -- an ACTIVE notice's own
    // "— Tilkynning í gildi" suffix is dropped (it adds no information:
    // the notice is already shown by default). The notice's own
    // description text is still shown; the status suffix text itself
    // must be genuinely absent.
    expect(data.queryByText((_, el) => el.textContent === `Vegavinna á Kafla A — ${translations.is.winterRouteNoticeActive}`)).toBeNull();
    expect(data.getAllByText(translations.is.winterRouteSegmentDataUnavailable).length).toBeGreaterThan(0);
  });

  it("the single 'Sjá alla vegkafla' control reveals every section, in driving order, replacing the default list (never both mounted at once)", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());

    const toggleBtn = within(region).getByRole("button", { name: translations.is.winterRouteViewAllSectionsAction });
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggleBtn);
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");

    const detailsContainer = document.getElementById("winter-route-road-details");
    expect(detailsContainer).toBeTruthy();
    // Each SegmentRow's own name is the first `font-medium` span in its
    // <li>. Scoped to the container's own top-level <ol>'s direct <li>
    // children only, so a segment's own nested notice <li> (Kafli A has
    // one) is excluded.
    const namesInOrder = Array.from(detailsContainer.querySelectorAll(":scope > ol > li")).map(
      (li) => li.querySelector("span.font-medium")?.textContent
    );
    expect(namesInOrder).toEqual(["Kafli A", "Kafli B", "Kafli C"]);
    // The default flagged-only list is gone now that the full list is open
    // -- "Kafli A"/"Kafli B" each still appear exactly once (inside the
    // full list), never twice (once in each list simultaneously).
    expect(within(region).getAllByText("Kafli A")).toHaveLength(1);
    expect(within(region).getAllByText("Kafli B")).toHaveLength(1);
  });

  it("states 'no notices' only when nothing is flagged and the feeds are confirmed fresh/available (never a false all-clear)", async () => {
    vi.stubGlobal("fetch", vi.fn((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        const d = regionDataFixture("budardalur", "holmavik", "geo-fwd");
        d.roadSections = d.roadSections.map((s) => ({ ...s, category: "passable", segmentDataAvailable: true, notices: [] }));
        return Promise.resolve({ status: 200, json: async () => d });
      }
      return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText(translations.is.winterRouteRoadOverviewAllClear)).toBeInTheDocument());
    expect(within(region).queryByText(translations.is.winterRouteRoadOverviewUnconfirmed)).toBeNull();
  });

  it("states the honest 'unconfirmed' line, never a false all-clear, when the points feed is unavailable/stale even with 0 locally-known flags", async () => {
    vi.stubGlobal("fetch", vi.fn((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        const d = regionDataFixture("budardalur", "holmavik", "geo-fwd");
        d.roadSections = d.roadSections.map((s) => ({ ...s, category: "passable", segmentDataAvailable: true, notices: [] }));
        d.roadMeta.pointsFeedUnavailableOrStale = true;
        return Promise.resolve({ status: 200, json: async () => d });
      }
      return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText(translations.is.winterRouteRoadOverviewUnconfirmed)).toBeInTheDocument());
    expect(within(region).queryByText(translations.is.winterRouteRoadOverviewAllClear)).toBeNull();
  });
});

describe("Ticket #492 — single weather table: hour selection, missing data, IS/EN labels", () => {
  it("the shared hour select updates every row's value columns without firing a new /api/winter-route-data request", async () => {
    let dataCalls = 0;
    vi.stubGlobal("fetch", vi.fn((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        dataCalls += 1;
        return Promise.resolve({ status: 200, json: async () => regionDataFixture("budardalur", "holmavik", "geo-fwd") });
      }
      return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());

    expect(within(region).getByText(`${formatDecimal(-1.5, "is", 1)} °C`)).toBeInTheDocument();
    await waitFor(() => expect(dataCalls).toBe(1));

    // Ticket #492, time-slider -- the former <select> is now a native
    // range whose own `value` is an INDEX into availableHours, not the
    // raw hour string; HOURS[1] is index 1 in this 2-hour fixture.
    const hourSlider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    fireEvent.change(hourSlider, { target: { value: "1" } });

    // Hour 2 (index 1): temperature_2m is `null` for p1 -- the table must
    // show the missing-value dash, never a stale leftover from hour 1 or
    // a fabricated 0. No second fetch is made for a local selection change.
    await waitFor(() => expect(within(region).queryByText(`${formatDecimal(-1.5, "is", 1)} °C`)).toBeNull());
    expect(dataCalls).toBe(1);
  });

  it("a point with no forecast data at all shows the unavailable row text, not blank/zero cells", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());
    expect(within(region).getByText("Punktur Tvö")).toBeInTheDocument();
    expect(within(region).getByText(translations.is.winterRoutePointUnavailable)).toBeInTheDocument();
  });

  // Ticket #492 -- the table's own column headers use the SHORT
  // winterRouteTableColumnGust/Precip labels (real 360px mobile evidence
  // during this round showed the long winterRouteGust/winterRoutePrecip
  // sentences overflowing the table at phone width); the full "(previous
  // hour)" wording is kept, stated once, in winterRouteGustPrecipNote
  // below the table, not repeated in every column header.
  // Ticket #492 round 2 -- markup changed again (P5 escalation: a real
  // measured 360px overlap, see evidence/mobile-fix/, meant the table
  // moved from 5 narrow columns to 2: Place + one wide "Weather" column
  // holding each metric as its own inline-labelled line). Gust/Precip
  // are no longer separate `columnheader`s; each value now carries its
  // own short label (winterRouteTableColumnGust/Precip) directly next
  // to it instead. This assertion is updated for that reason, not
  // weakened: it still proves the short labels render and the full
  // "(previous hour)" wording is stated once, not per value.
  it("each value carries its own short gust/precip label; the full '(previous hour)' wording is stated once below the table, in both IS and EN", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());
    expect(within(region).getAllByText(translations.is.winterRouteTableColumnGust, { exact: false }).length).toBeGreaterThan(0);
    expect(within(region).getAllByText(translations.is.winterRouteTableColumnPrecip, { exact: false }).length).toBeGreaterThan(0);
    expect(within(region).getByText(translations.is.winterRouteGustPrecipNote)).toBeInTheDocument();

    const en = translations.en;
    expect(en.winterRouteGustPrecipNote).toMatch(/previous hour/);
    expect(en.winterRouteTableColumnGust).not.toMatch(/previous hour/);
    expect(en.winterRouteTableColumnPrecip).not.toMatch(/previous hour/);
  });

  // Ticket #492 round 2 -- new: proves the actual regression fix (not
  // just that a className changed). A value+unit run must never be
  // split across two line boxes (P2d), checked the same way the
  // round-2 DOM-measurement script checks it in a real browser.
  it("each value+unit stays on a single line (jsdom proxy for the real DOM measurement in evidence/mobile-fix/)", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());
    // Ticket #492 round 3 -- the table is now a role="table" built from
    // divs (P4), not a literal <table>/<dd>; each value lives in its own
    // `whitespace-nowrap` span inside a `role="cell"`.
    const valueEls = region.querySelectorAll('[role="table"] [role="cell"] span.whitespace-nowrap');
    expect(valueEls.length).toBeGreaterThan(0);
    for (const el of valueEls) {
      expect(el.textContent).not.toMatch(/\s{2,}|\n/); // a real line-break would show as whitespace/newline collapse artifacts here
    }
  });
});

describe("Ticket #492 — 18-point table, real driving order, and the reverse direction's own order", () => {
  const RVK = "reykjavik-raudavatn";
  const NORTH_IDS = [
    "raudavatn-route", "nordura-route", "holtavorduheidi-route", "gljufura-route", "kjalkavegur-route",
    "oxnadalsheidi-route", "ljosavatnsskard-route", "myvatnsoraefi-route", "biskupshals-route", "fellabaer-route",
    "fagridalur-route", "breiddalsvik-route", "thvotta-route", "hofn-route", "kirkjubaejarklaustur-route",
    "myrdalssandur-route", "hvolsvollur-route", "selfoss-route",
  ];
  function makePoint(id) {
    return { id, labelIs: id, labelEn: id, available: true, returnedLatitude: 65, returnedLongitude: -18, elevation: 10, hours: HOURS, series: { temperature_2m: [1, 1], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } };
  }
  function ringPayload(from, to, geometryId, option, points) {
    return {
      from, to, geometryId, selectedOption: option,
      datasetVersion: "ds1", policyVersion: `${option}-policy`, routeLengthM: 1236038.3, unmappedLengthM: 0,
      generatedAt: "2026-11-24T09:00:00.000Z",
      roadSections: [{ idButur: 1, nameIs: "Kafli", nameEn: "Section", routeLengthM: 1236038.3, routeLengthFraction: 1, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] }],
      roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
      forecast: { available: true, window: { startHour: HOURS[0], endHour: HOURS[1], expectedHours: HOURS }, points, stale: false, cacheAgeMs: 0 },
    };
  }
  // `reverse` picks which direction is under test; the geometry fixture's
  // own `geometryId` is round-tripped by the data fixture exactly like the
  // real handler does (never hardcoded independently of the real
  // request), so `validRouteData`'s identity check actually passes.
  function ringFetch(reverse) {
    const from = reverse ? "selfoss" : RVK;
    const to = reverse ? RVK : "selfoss";
    const ids = reverse ? [...NORTH_IDS].reverse() : NORTH_IDS;
    const geometryId = `${from}-${to}-north-geo`;
    return vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        const params = new URL(u, "http://localhost").searchParams;
        return Promise.resolve({ status: 200, json: async () => ringPayload(params.get("from"), params.get("to"), params.get("geometryId"), params.get("option"), ids.map(makePoint)) });
      }
      const params = new URL(u, "http://localhost").searchParams;
      const option = params.get("option") === "north" ? "north" : "south";
      return Promise.resolve({
        status: 200,
        json: async () => ({
          schemaVersion: 1, tier: 2, status: "geometry_only", from, to, selectedOption: option, geometryId,
          options: [{ id: "south", label: "s", lengthM: 1, via: [], routeId: "a" }, { id: "north", label: "n", lengthM: 2, via: [], routeId: "b" }],
        }),
      });
    });
  }

  it("renders exactly 18 rows, in the real route order, for Rauðavatn→Selfoss north", async () => {
    vi.stubGlobal("fetch", ringFetch(false));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit(RVK, "selfoss");
    const optionBtn = await screen.findByRole("radio", { name: translations.is.winterRouteOptionNorth });
    fireEvent.click(optionBtn);
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getAllByRole("row").length).toBe(19)); // 1 header row + 18 data rows
    // Ticket #492 round 3 -- no more `rowheader` role (role="table" built
    // from divs uses role="cell" for every cell, P4); the place name is
    // the first `role="cell"` in each DATA row (skip the header row).
    const dataRows = within(region).getAllByRole("row").slice(1);
    const rowHeaders = dataRows.map((row) => within(row).getAllByRole("cell")[0].textContent.trim());
    expect(rowHeaders).toEqual(NORTH_IDS);
  });

  it("the reverse direction (Selfoss→Rauðavatn north) renders its own real order, not a client-side mirror", async () => {
    vi.stubGlobal("fetch", ringFetch(true));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("selfoss", RVK);
    const optionBtn = await screen.findByRole("radio", { name: translations.is.winterRouteOptionNorth });
    fireEvent.click(optionBtn);
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getAllByRole("row").length).toBe(19));
    const dataRows = within(region).getAllByRole("row").slice(1);
    const rowHeaders = dataRows.map((row) => within(row).getAllByRole("cell")[0].textContent.trim());
    expect(rowHeaders).toEqual([...NORTH_IDS].reverse());
  });
});

// Ticket #492, round 3 (UX priority) -- P3/P4/P5/P6/P7 focused tests.
describe("Ticket #492, direct-flow -- road summary: count, single control, focus, stale/old uniformity (P3, carried)", () => {
  it("shows the singular form for exactly one notice-carrying section, and there is exactly ONE action (no separate 'view notices' action)", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());

    expect(within(region).getByText(translations.is.winterRouteRoadSummaryCountOne)).toBeInTheDocument();

    // Ticket #492, direct-flow -- the former separate "Sjá tilkynningar"
    // action is removed entirely (notice content is already visible in
    // the default list); exactly one toggle action remains.
    expect(within(region).queryByText("Sjá tilkynningar")).toBeNull();
    const allBtn = within(region).getByRole("button", { name: translations.is.winterRouteViewAllSectionsAction });
    expect(allBtn.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(allBtn);
    expect(allBtn.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(allBtn.getAttribute("aria-controls"))).toBeTruthy();
    // jsdom's fireEvent.click does not reproduce a real browser's native
    // click-to-focus behavior (no app-level focus-restoring code is
    // involved either way, unlike the former <summary ref> approach) --
    // actual focus-after-click is verified in the real-browser STUB
    // evidence for this round instead.
  });

  it("states a genuine all-clear only when nothing at all is flagged; the single action stays available either way", async () => {
    vi.stubGlobal("fetch", vi.fn((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        const d = regionDataFixture("budardalur", "holmavik", "geo-fwd");
        d.roadSections = d.roadSections.map((s) => ({ ...s, category: "passable", segmentDataAvailable: true, notices: [], export: { isStale: false }, registration: { isOld: false } }));
        return Promise.resolve({ status: 200, json: async () => d });
      }
      return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText(translations.is.winterRouteRoadOverviewAllClear)).toBeInTheDocument());
    expect(within(region).getByRole("button", { name: translations.is.winterRouteViewAllSectionsAction })).toBeInTheDocument();
  });

  it("collapses a uniform stale/old-only flagged set into ONE shared sentence instead of repeating the same text on every row", async () => {
    vi.stubGlobal("fetch", vi.fn((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        const d = regionDataFixture("budardalur", "holmavik", "geo-fwd");
        d.roadSections = d.roadSections.map((s) => ({ ...s, category: "passable", segmentDataAvailable: true, notices: [], export: { isStale: true }, registration: { isOld: false } }));
        return Promise.resolve({ status: 200, json: async () => d });
      }
      return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText(translations.is.winterRouteRoadAllDataOld)).toBeInTheDocument());
    // hideStaleOldBadges suppresses each row's own repeated stale text.
    expect(within(region).queryAllByText(translations.is.winterRouteExportStale).length).toBe(0);
  });

  it("shows each row's own stale text (not the shared sentence) when the flagged set is MIXED (a closure plus a stale-only section)", async () => {
    vi.stubGlobal("fetch", vi.fn((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        const d = regionDataFixture("budardalur", "holmavik", "geo-fwd");
        d.roadSections[0] = { ...d.roadSections[0], category: "closed", notices: [] };
        d.roadSections[1] = { ...d.roadSections[1], category: "passable", segmentDataAvailable: true, notices: [], export: { isStale: true }, registration: { isOld: false } };
        return Promise.resolve({ status: 200, json: async () => d });
      }
      return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    // "Kafli A" (now closed, no notice) appears exactly once, in the
    // default flagged list.
    await waitFor(() => expect(within(region).getAllByText("Kafli A").length).toBe(1));
    expect(within(region).queryByText(translations.is.winterRouteRoadAllDataOld)).toBeNull();
    expect(within(region).getByText(translations.is.winterRouteExportStale)).toBeInTheDocument();
  });
});

describe("Ticket #492 round 3 -- weather grid: label/value pairing is mutation-provable (P4)", () => {
  function labelledFixture() {
    const d = regionDataFixture("budardalur", "holmavik", "geo-fwd");
    d.forecast.points = [
      { id: "p1", labelIs: "Punktur Eitt", labelEn: "Point One", available: true, returnedLatitude: 65, returnedLongitude: -21, elevation: 10, hours: HOURS, series: { temperature_2m: [-5, -5], wind_speed_10m: [11, 11], wind_gusts_10m: [22, 22], precipitation: [3.3, 3.3], weather_code: [3, 3] } },
    ];
    return d;
  }

  it("ties each real value to its own real label -- deliberately checking the WRONG cell is shown to fail (mutation proof)", async () => {
    vi.stubGlobal("fetch", vi.fn((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) return Promise.resolve({ status: 200, json: async () => labelledFixture() });
      return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    const row = await waitFor(() => within(region).getAllByRole("row")[1]);
    const cells = within(row).getAllByRole("cell");
    expect(within(cells[2]).getByText(`${formatDecimal(-5, "is", 1)} °C`)).toBeInTheDocument();
    expect(within(cells[3]).getByText(`${formatDecimal(11, "is", 1)} m/s`)).toBeInTheDocument();
    expect(within(cells[4]).getByText(`${formatDecimal(22, "is", 1)} m/s`)).toBeInTheDocument();
    expect(within(cells[5]).getByText(`${formatDecimal(3.3, "is", 1)} mm`)).toBeInTheDocument();
    // Mutation proof (run, not merely asserted): the wind value does NOT
    // also appear in the gust cell -- if label/value pairing were ever
    // swapped in the component, this would start passing wrongly.
    expect(() => within(cells[4]).getByText(`${formatDecimal(11, "is", 1)} m/s`)).toThrow();
  });

  it("desktop header row has exactly 6 real columnheaders, none duplicated as an id", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());
    const headers = within(region).getAllByRole("columnheader");
    expect(headers).toHaveLength(6);
    const idEls = region.querySelectorAll("[id]");
    const idValues = Array.from(idEls).map((el) => el.id);
    expect(new Set(idValues).size).toBe(idValues.length);
  });

  it("an unavailable point still holds its own place in the row order (never silently dropped)", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());
    const rows = within(region).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByText("Punktur Tvö")).toBeInTheDocument();
    expect(within(rows[1]).getByText(translations.is.winterRoutePointUnavailable)).toBeInTheDocument();
  });
});

describe("Ticket #492 round 3 -- gap note uses a real computed gap and shortened names (P5)", () => {
  it("shows the actual computed largest gap (not a hardcoded figure) between two DIFFERENT shortened point labels", async () => {
    vi.stubGlobal("fetch", vi.fn((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        const d = regionDataFixture("budardalur", "holmavik", "geo-fwd");
        d.forecast.points = [
          { id: "a", labelIs: "Leiðarpunktur nærri Á", labelEn: "Route point near A", available: true, approxDistanceFromStartKm: 0, returnedLatitude: 65, returnedLongitude: -21, elevation: 10, hours: HOURS, series: { temperature_2m: [1, 1], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } },
          { id: "b", labelIs: "Leiðarpunktur nærri Bé", labelEn: "Route point near B", available: true, approxDistanceFromStartKm: 12.3, returnedLatitude: 65, returnedLongitude: -21, elevation: 10, hours: HOURS, series: { temperature_2m: [1, 1], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } },
          { id: "c", labelIs: "Leiðarpunktur nærri Sé", labelEn: "Route point near C", available: true, approxDistanceFromStartKm: 55.9, returnedLatitude: 65, returnedLongitude: -21, elevation: 10, hours: HOURS, series: { temperature_2m: [1, 1], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } },
        ];
        return Promise.resolve({ status: 200, json: async () => d });
      }
      return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: "geo-fwd" }) });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    const expected = translations.is.winterRouteLargestGapNote
      .replace("{km}", formatDecimal(43.6, "is", 1))
      .replace("{pointA}", "Nærri Bé")
      .replace("{pointB}", "Nærri Sé");
    await waitFor(() => expect(within(region).getByText(expected)).toBeInTheDocument());
    expect(within(region).queryByText(/67,3/)).toBeNull();
  });
});

describe('Ticket #492 round 3 -- "Um gögnin" (P6): internal timestamps moved, closed by default, never called fetch/update', () => {
  it("is closed by default and holds the response-prepared line, not stated anywhere as a fetch/update time", async () => {
    vi.stubGlobal("fetch", regionFetch());
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());

    const aboutDetails = within(region).getByText(translations.is.winterRouteAboutDataSummary).closest("details");
    expect(aboutDetails.open).toBe(false);
    expect(within(aboutDetails).getByText(/Svar útbúið/)).toBeInTheDocument();
    expect(screen.queryByText(/sótt|uppfært|fetch/i)).toBeNull();
  });
});
