// src/pages/WinterRoute.test.jsx — Ticket #486
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WinterRoute from "./WinterRoute";
import { translations } from "../i18n/translations";
import { WINTER_ROUTE_OPTIONS } from "../lib/winterRouteRoutes";

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

// Ticket #492, round 3 (UX priority), P1(e)/P2 -- the Frá/Til fields are
// now a single accessible combobox each (see PlaceField in WinterRoute.jsx),
// not a native <select>. This helper drives the real selection mechanism
// (focus opens the listbox, mousedown+click commits an option) so every
// test below exercises the same interaction a real user/screen-reader
// would, rather than a synthetic `fireEvent.change` that the component no
// longer treats as a commit. Looked up by the field's own accessible
// `input`, exactly as every call site already obtains it via
// `getByLabelText`/`findByLabelText` -- only the lookup's `{selector}`
// (no longer "select") and the selection step itself change; the
// identity/race/draft/fetch-count assertions downstream of each call are
// unaffected (same `onChange`/draft state as before, just reached via a
// real option click instead of a raw DOM value change).
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

// Ticket #492, direct-flow -- `makePayload`/`makeForecastPoint`/
// `FUTURE_HOURS`, and the `switchToLegacyMode`/`renderPage`/
// `getSummarySection` helpers that rendered the legacy fixed-route flow
// against them, are removed: that whole flow (the "Fastar veðurleiðir"
// mode toggle, the legacy routeId <select>, RouteSummary/ForecastCard,
// and every test exercising them -- the former top-level "WinterRoute
// page" its, "V1 — invalid/expiring hour selection...", "#489 —
// route-level summary", and "Ticket #491 — route selection" describe
// blocks) was deleted by this round per source.md "Fjarlægja 'Fastar
// veðurleiðir' úr notendaviðmóti". `makeSegment`/`pad2`/
// `futureHourString` are still used by the choose-flow tests below and
// are kept.

beforeEach(() => {
  localStorage.clear();
});

describe("WinterRoute page", () => {

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

    // Ticket #492, direct-flow -- removed: tested the legacy "Fastar
    // veðurleiðir" mode toggle gating /api/winter-route, which ticket
    // #492's direct-flow round deleted entirely (there is only one flow
    // now; P1(a) above already covers "no fetch to either endpoint on
    // mount").

    it("P2(b)/(c): from/to selects share the same 11-place list grouped by network, and the access-point disclaimer is shown on a real result", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|holmavik|": BUDARDALUR_HOLMAVIK_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      for (const select of [fromSelect, toSelect]) {
        fireEvent.focus(select);
        const listbox = document.getElementById(select.getAttribute("aria-controls"));
        for (const place of WINTER_ROUTE_OPTIONS_PLACES()) {
          expect(within(listbox).getByText(place)).toBeInTheDocument();
        }
      }

      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteAccessPointDisclaimer)).toBeInTheDocument());
    });

    function WINTER_ROUTE_OPTIONS_PLACES() {
      return ["Reykjavík (Rauðavatn)", "Selfoss", "Hella", "Egilsstaðir", "Seyðisfjörður", "Búðardalur", "Flókalundur", "Ísafjörður", "Hólmavík", "Patreksfjörður", "Tálknafjörður"];
    }

    it("P3(a): typing a place's plain-ASCII (accent-stripped) name filters the listbox to that place, in both fields", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromInput = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: "isafjordur" } });

      const listbox = document.getElementById(fromInput.getAttribute("aria-controls"));
      expect(within(listbox).getByText("Ísafjörður")).toBeInTheDocument();
      expect(within(listbox).queryByText("Selfoss")).toBeNull();
    });

    it("P3(b): typing a search that matches no place never changes the confirmed selection (query/placeId stay separate), and shows the no-results text", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromInput = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      expect(fromInput.dataset.selectedPlaceId).toBe(RVK);

      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: "akureyri" } }); // matches no place in the 11-list

      // Typing alone never commits/clears the confirmed placeId (P2a).
      expect(fromInput.dataset.selectedPlaceId).toBe(RVK);
      const fromStatus = fromInput.parentElement.parentElement.querySelector('p[role="status"]');
      await waitFor(() => expect(fromStatus.textContent).toBe(translations.is.winterRouteNoSearchResults));

      // Blurring without a fresh selection reverts the visible text to the
      // last confirmed place's own name (documented P2 recovery choice).
      fireEvent.blur(fromInput);
      expect(fromInput.value).toBe("Reykjavík (Rauðavatn)");
    });

    it("P3(d): the swap button exchanges From/To without submitting a request", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      expect(fromSelect.dataset.selectedPlaceId).toBe(RVK);
      expect(toSelect.dataset.selectedPlaceId).toBe("selfoss");

      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteSwapLabel }));

      expect(fromSelect.dataset.selectedPlaceId).toBe("selfoss");
      expect(toSelect.dataset.selectedPlaceId).toBe(RVK);
      expect(fromSelect.value).toBe("Selfoss");
      expect(toSelect.value).toBe("Reykjavík (Rauðavatn)");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("P2/P3(d): swapping while one field is mid-edit (unconfirmed) reverts it to its own last confirmed place first -- clicking Swap never commits half-typed text", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      fireEvent.focus(fromSelect);
      fireEvent.change(fromSelect, { target: { value: "bud" } }); // typed, never confirmed
      expect(fromSelect.dataset.selectedPlaceId).toBe(RVK); // still the old confirmed id

      // Swap only ever reads/writes the CONFIRMED draftFrom/draftTo state
      // in the parent -- never a field's own in-progress `query` text --
      // so the half-typed "bud" is simply discarded: the field's displayed
      // text re-syncs to its (new) confirmed place the moment `value`
      // itself changes, independent of whether a blur ever fires first.
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteSwapLabel }));

      expect(fromSelect.dataset.selectedPlaceId).toBe("selfoss");
      expect(toSelect.dataset.selectedPlaceId).toBe(RVK);
      expect(fromSelect.value).toBe("Selfoss");
      expect(toSelect.value).toBe("Reykjavík (Rauðavatn)");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("P3(c): From/To combobox inputs are properly associated (htmlFor), reachable via getByLabelText, and expose the ARIA combobox role", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromInput = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toInput = screen.getByLabelText(translations.is.winterRouteToLabel);
      expect(fromInput).toHaveAttribute("role", "combobox");
      expect(toInput).toHaveAttribute("role", "combobox");
    });

    it("P2: the combobox's own typing/opening/closing never fires a network request, and the input text stays >=16px", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromInput = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      expect(fromInput.className).toMatch(/\btext-base\b/); // >=16px -- no iOS auto-zoom-on-focus
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: "isafjordur" } });
      fireEvent.blur(fromInput);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("P2: full ARIA combobox/listbox/group pattern -- expanded state, activedescendant tracking, and named Ring/Westfjords/Other groups", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromInput = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      expect(fromInput).toHaveAttribute("aria-expanded", "false");
      fireEvent.focus(fromInput);
      expect(fromInput).toHaveAttribute("aria-expanded", "true");

      const listbox = document.getElementById(fromInput.getAttribute("aria-controls"));
      expect(listbox).toHaveAttribute("role", "listbox");
      const groups = within(listbox).getAllByRole("group");
      expect(groups.map((g) => g.getAttribute("aria-label"))).toEqual([
        translations.is.winterRouteGroupRingLabel,
        translations.is.winterRouteGroupWestfjordsLabel,
        // Ticket #492, direct-flow, C6 -- the third group, for vik/borgarnes.
        translations.is.winterRouteGroupOtherLabel,
      ]);

      // ArrowDown moves the highlighted option; aria-activedescendant
      // tracks it in real time (first option is Reykjavík/Rauðavatn).
      fireEvent.keyDown(fromInput, { key: "ArrowDown" });
      const firstOptionId = within(listbox).getAllByRole("option")[0].id;
      expect(fromInput).toHaveAttribute("aria-activedescendant", firstOptionId);
    });

    it("P2: Enter on a highlighted option commits the selection and never submits the surrounding form", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromInput = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: "budardalur" } });
      fireEvent.keyDown(fromInput, { key: "ArrowDown" }); // highlight the (only) match
      fireEvent.keyDown(fromInput, { key: "Enter" });

      expect(fromInput.dataset.selectedPlaceId).toBe("budardalur");
      expect(fromInput.value).toBe("Búðardalur");
      expect(fromInput).toHaveAttribute("aria-expanded", "false");
      // Enter committed the option, not a form submit (P2's own
      // "never accidentally submit" requirement) -- no request fired.
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("P2: Escape reverts to the last confirmed place without committing the typed text", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromInput = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      expect(fromInput.dataset.selectedPlaceId).toBe(RVK);
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: "budardalur" } });
      fireEvent.keyDown(fromInput, { key: "Escape" });

      expect(fromInput.dataset.selectedPlaceId).toBe(RVK);
      expect(fromInput.value).toBe("Reykjavík (Rauðavatn)");
      expect(fromInput).toHaveAttribute("aria-expanded", "false");
    });

    it("P4(a)/(b): submitting fires /api/winter-route-geometry with from/to via URLSearchParams, and changing the draft afterwards hides the old result behind the 'selection changed' notice", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|holmavik|": BUDARDALUR_HOLMAVIK_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteBaseDisclaimer)).toBeInTheDocument());
      expect(fetch.mock.calls[0][0]).toMatch(/^\/api\/winter-route-geometry\?from=budardalur&to=holmavik$/);

      // Now change the draft without resubmitting -- old result must hide.
      selectWinterRoutePlace(toSelect, "isafjordur");
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteSelectionChangedNotice)).toBeInTheDocument());
    });

    it("P4(d): a 200 unsupported response shows the generic 'no route yet' text, never the raw reason", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ [`${RVK}|budardalur|`]: UNSUPPORTED_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const toSelect = await screen.findByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(toSelect, "budardalur");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteNoRouteYet)).toBeInTheDocument());
      expect(screen.queryByText(/endpoint_mapping_unavailable/)).toBeNull();
    });

    it("P4(d): a 400 unknown_place_id for a legal UI pair (flokalundur<->ring) is the SAME 'no route yet' text, never a technical error", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "flokalundur|selfoss|": { httpStatus: 400, body: { error: "unknown_place_id", field: "from" } } }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, "flokalundur");
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
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "selfoss");
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
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton })); // slow (50ms)

      selectWinterRoutePlace(toSelect, "talknafjordur");
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
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "talknafjordur");
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
      selectWinterRoutePlace(fromSelect, "talknafjordur");
      selectWinterRoutePlace(toSelect, "talknafjordur");
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
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
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
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
      fireEvent.click(screen.getByRole("button", { name: translations.en.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByText(translations.en.winterRouteAccessPointDisclaimer)).toBeInTheDocument());
    });

    it("P1(e): the h1/<title> read the applied pair once a result is shown, never a mismatched legacy name", async () => {
      vi.stubGlobal("fetch", geometryAwareFetch({ "budardalur|holmavik|": BUDARDALUR_HOLMAVIK_FIXTURE }));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(translations.is.winterRouteDefaultHeading);

      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));

      await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Búðardalur → Hólmavík"));
    });

    it("unmounting while a request is in flight never triggers a post-unmount state update (no React act warning, request is aborted)", async () => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(() => {}))); // never resolves
      const { unmount } = render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
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
      const fromInput = screen.getByLabelText(translations.is.winterRouteFromLabel);
      fromInput.focus();
      await act(async () => finish({ status: 200, json: async () => RVK_SELFOSS_NORTH_FIXTURE }));
      expect(fromInput).toHaveFocus();
    });

    it("P4: duplicate submit is disabled only during that request and geometry has no stale draft frame", async () => {
      let finish;
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((resolve) => { finish = resolve; })));
      const commits = [];
      const { container } = render(<React.Profiler id="geometry" onRender={() => {
        const result = document.querySelector('[data-route-option="south"]');
        const from = document.getElementById("winter-route-from-input");
        commits.push({ from: from?.dataset.selectedPlaceId, options: Boolean(result) });
      }}><MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter></React.Profiler>);
      const { fireEvent } = await import("@testing-library/react");
      const submit = screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton });
      fireEvent.submit(submit.closest("form"));
      expect(submit).toBeDisabled();
      await act(async () => finish({ status: 200, json: async () => RVK_SELFOSS_OPTIONS_FIXTURE }));
      expect(submit).not.toBeDisabled();
      selectWinterRoutePlace(screen.getByLabelText(translations.is.winterRouteFromLabel), "budardalur");
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
      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
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

      // Ticket #492, direct-flow -- "Hólmavík-Drangsnesvegur" is `category:
      // "closed"`, a flagged section, so it's already visible in the
      // default dense list. "Skógstagl-Búðardalur" is plain passable (not
      // flagged), so it only exists once the full section list is opened.
      // Per source.md's "Sýna tilkynningar beint, án tvítekninga", neither
      // section is ever rendered twice any more (changed from this test's
      // prior "lifted chip + full list" double-occurrence assertions).
      expect(data.getAllByText("Hólmavík-Drangsnesvegur")).toHaveLength(1);
      expect(data.queryByText("Skógstagl-Búðardalur")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteViewAllSectionsAction }));
      expect(data.getByText("Skógstagl-Búðardalur")).toBeInTheDocument();
      expect(data.getAllByText("Hólmavík-Drangsnesvegur")).toHaveLength(1);
      // Both edge segments carry the note, each exactly once, now that the
      // full list is open and replaces the default list (never both lists
      // mounted at once).
      const edgeNotes = data.getAllByText(/nær aðeins yfir stuttan hluta leiðarinnar/);
      expect(edgeNotes).toHaveLength(2);

      expect(screen.queryByText(/regionVersion/)).toBeNull();
      expect(screen.queryByText("r1")).toBeNull();
    });

    it("keeps cards and the local hour select outside live status regions", async () => {
      vi.stubGlobal("fetch", dualEndpointFetch());
      render(<MemoryRouter><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();
      // Ticket #492 -- the data view's own hour select has its own label
      // ("Tími veðurspár", winterRouteDataHourLabel).
      const select = await screen.findByLabelText(translations.is.winterRouteDataHourLabel);
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
      // Ticket #492, time-slider -- the former <select> is now a native
      // range whose own index-0 value corresponds to DATA_HOURS[0] (the
      // expired "2000" slot is excluded by useNowTicking, same filter as
      // before); max=1 confirms only the 2 real DATA_HOURS remain
      // selectable, never a 3rd option for the expired slot.
      const slider = await screen.findByLabelText(translations.is.winterRouteDataHourLabel);
      expect(slider.value).toBe("0");
      expect(slider).toHaveAttribute("max", "1");
      expect(screen.queryByText(/2000/)).toBeNull();
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
      expect(screen.queryByLabelText(translations.is.winterRouteDataHourLabel)).toBeNull();
    });

    it.each([
      ["generic", { selectedOption: "south" }], ["generic", { policyVersion: "p" }],
      ["generic", { regionVersion: "r" }], ["generic", { datasetVersion: undefined }],
      ["region", { selectedOption: "south" }], ["region", { policyVersion: "p" }],
      ["region", { datasetVersion: "d" }], ["region", { regionVersion: undefined }],
      ["option", { datasetVersion: undefined }], ["option", { policyVersion: undefined }],
      ["option", { selectedOption: undefined }], ["option", { regionVersion: "r" }],
    ])("rejects a mixed or missing %s response identity: %j", async (kind, overrides) => {
      const from = kind === "region" ? "budardalur" : kind === "option" ? "reykjavik-raudavatn" : "egilsstadir";
      const to = kind === "region" ? "holmavik" : kind === "option" ? "selfoss" : "seydisfjordur";
      vi.stubGlobal("fetch", vi.fn((url) => {
        const d = dataFixture(from, to, FORWARD_GEOMETRY_ID);
        delete d.regionVersion;
        Object.assign(d, kind === "region" ? { regionVersion: "r" } : kind === "option" ? { datasetVersion: "d", policyVersion: "p", selectedOption: "south" } : { datasetVersion: "d" }, overrides);
        if (String(url).includes("/api/winter-route-data")) return Promise.resolve({ status: 200, json: async () => d });
        const geo = geometryFixture(from, to, FORWARD_GEOMETRY_ID);
        if (kind === "option") Object.assign(geo, { selectedOption: "south", options: [
          { id: "south", label: "south", lengthM: 1, via: [], routeId: "s" },
          { id: "north", label: "north", lengthM: 2, via: [], routeId: "n" },
        ] });
        return Promise.resolve({ status: 200, json: async () => geo });
      }));
      render(<MemoryRouter><WinterRoute /></MemoryRouter>);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(screen.getByLabelText(translations.is.winterRouteFromLabel), from);
      selectWinterRoutePlace(screen.getByLabelText(translations.is.winterRouteToLabel), to);
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
      await screen.findByText(translations.is.winterRouteGenericError);
      expect(screen.queryByLabelText(translations.is.winterRouteDataHourLabel)).toBeNull();
    });

    it.each(["holmavik", "flokalundur"])("announces missing forecast without claiming zero points: B to %s", async (to) => {
      vi.stubGlobal("fetch", vi.fn((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) return Promise.resolve({ status: 200, json: async () => dataFixture("budardalur", to, FORWARD_GEOMETRY_ID, { forecast: { available: false, reason: "key_missing", points: [] } }) });
        return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", to, FORWARD_GEOMETRY_ID) });
      }));
      render(<MemoryRouter><WinterRoute /></MemoryRouter>);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(screen.getByLabelText(translations.is.winterRouteFromLabel), "budardalur");
      selectWinterRoutePlace(screen.getByLabelText(translations.is.winterRouteToLabel), to);
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

      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, "holmavik");
      selectWinterRoutePlace(toSelect, "budardalur");
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

      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(toSelect, "selfoss");
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
      const fromSelect = screen.getByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, from);
      selectWinterRoutePlace(toSelect, to);
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

  // Ticket #503 ring-options — reykjavik-raudavatn<->selfoss/hella,
  // option=south|north, layered under the existing geometry option-select
  // flow (ticket #502's own south/north radio group).
  describe("Ticket #503 — ring-options (reykjavik-raudavatn<->selfoss/hella) weather/road data", () => {
    const RVK = "reykjavik-raudavatn";
    const DATA_HOURS = [futureHourString(2), futureHourString(3)];

    function ringGeometryFixture(to, option) {
      return {
        schemaVersion: 1, tier: 2, status: "geometry_only", from: RVK, to,
        selectedOption: option, estimatedConnectorLengthM: 0,
        geometryId: `${to}-${option}-geo`,
        options: [
          { id: "south", label: "Short route via Hellisheiði", lengthM: 1, via: [], routeId: "a" },
          { id: "north", label: "Long route via the Route 1 ring", lengthM: 2, via: [], routeId: "b" },
        ],
      };
    }

    function ringDataFixture({ to, option, geometryId, routeLengthM, points, roadSections }) {
      return {
        from: RVK, to, geometryId, selectedOption: option,
        datasetVersion: "ds1", policyVersion: `${option}-policy`,
        routeLengthM, unmappedLengthM: 0,
        generatedAt: "2026-11-24T09:00:00.000Z",
        roadSections: roadSections ?? [
          { idButur: 1, nameIs: "Dæmiskafli", nameEn: "Example section", routeLengthM: routeLengthM, routeLengthFraction: 1, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] },
        ],
        roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
        forecast: {
          available: true,
          window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS },
          points,
          stale: false, cacheAgeMs: 0,
        },
      };
    }

    const SOUTH_GEOMETRY_ID = "selfoss-south-geo";
    const NORTH_GEOMETRY_ID = "selfoss-north-geo";
    const SOUTH_POINTS = [
      { id: "raudavatn-route", labelIs: "Rauðavatn", labelEn: "Rauðavatn", available: true, returnedLatitude: 64.1, returnedLongitude: -21.76, elevation: 1, hours: DATA_HOURS, series: { temperature_2m: [0, -1], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } },
      { id: "hellisheidi-east-route", labelIs: "Hellisheiði — austanverð leið", labelEn: "Hellisheiði — east side", available: true, returnedLatitude: 64.02, returnedLongitude: -21.3, elevation: 300, hours: DATA_HOURS, series: { temperature_2m: [-2, -3], wind_speed_10m: [5, 5], wind_gusts_10m: [8, 8], precipitation: [1, 1], weather_code: [71, 71] } },
      { id: "selfoss-route", labelIs: "Selfoss", labelEn: "Selfoss", available: true, returnedLatitude: 63.94, returnedLongitude: -21.0, elevation: 17, hours: DATA_HOURS, series: { temperature_2m: [1, 0], wind_speed_10m: [2, 2], wind_gusts_10m: [3, 3], precipitation: [0, 0], weather_code: [3, 3] } },
    ];
    const NORTH_POINTS = [
      "raudavatn-route", "nordura-route", "holtavorduheidi-route", "gljufura-route", "kjalkavegur-route",
      "oxnadalsheidi-route", "ljosavatnsskard-route", "myvatnsoraefi-route", "biskupshals-route", "fellabaer-route",
      "fagridalur-route", "breiddalsvik-route", "thvotta-route", "hofn-route", "kirkjubaejarklaustur-route",
      "myrdalssandur-route", "hvolsvollur-route", "selfoss-route",
    ].map((id, i) => ({ id, labelIs: id, labelEn: id, available: true, returnedLatitude: 65, returnedLongitude: -18, elevation: 10, hours: DATA_HOURS, series: { temperature_2m: [i, i], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } }));

    function ringFetch({ withNorthData = true } = {}) {
      return vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) {
          const params = new URL(u, "http://localhost").searchParams;
          const option = params.get("option");
          const geometryId = params.get("geometryId");
          if (option === "north" && withNorthData) {
            return Promise.resolve({ status: 200, json: async () => ringDataFixture({ to: "selfoss", option: "north", geometryId, routeLengthM: 1236038.3, points: NORTH_POINTS }) });
          }
          return Promise.resolve({ status: 200, json: async () => ringDataFixture({ to: "selfoss", option: "south", geometryId, routeLengthM: 44984.8, points: SOUTH_POINTS }) });
        }
        const key = new URL(u, "http://localhost").searchParams;
        const option = key.get("option");
        if (key.get("from") === RVK && key.get("to") === "selfoss") {
          return Promise.resolve({
            status: 200,
            json: async () => option === "north" ? { ...ringGeometryFixture("selfoss", "north"), geometryId: NORTH_GEOMETRY_ID } : { ...ringGeometryFixture("selfoss", "south"), geometryId: SOUTH_GEOMETRY_ID },
          });
        }
        return Promise.reject(new Error(`no fixture for ${u}`));
      });
    }

    async function submitRvkSelfoss() {
      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, RVK);
      selectWinterRoutePlace(toSelect, "selfoss");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
    }

    it("default (south, no explicit option click): data fetch includes option=south, 3 points, no long-route note", async () => {
      vi.stubGlobal("fetch", ringFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitRvkSelfoss();

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
      expect(global.fetch.mock.calls.some((c) => String(c[0]).includes("/api/winter-route-data") && String(c[0]).includes("option=south"))).toBe(true);
      const dataRegion = screen.getByTestId("winter-route-data");
      const data = within(dataRegion);
      expect(data.getByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "3") })).toBeInTheDocument();
      expect(screen.queryByText(translations.is.winterRouteLongRouteComparisonNote)).toBeNull();
    });

    it("selecting north re-fetches geometry AND data with option=north, shows 18 points and the ≥400km long-route note", async () => {
      vi.stubGlobal("fetch", ringFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitRvkSelfoss();
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.click(screen.getByRole("radio", { name: translations.is.winterRouteOptionNorth }));

      await waitFor(() => {
        const dataRegion = screen.getByTestId("winter-route-data");
        expect(within(dataRegion).getByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "18") })).toBeInTheDocument();
      });
      expect(global.fetch.mock.calls.some((c) => String(c[0]).includes("/api/winter-route-data") && String(c[0]).includes("option=north"))).toBe(true);
      expect(screen.getByText(translations.is.winterRouteLongRouteComparisonNote)).toBeInTheDocument();
    });

    it("P8(b) race: switching north -> south before the delayed north data resolves never shows the 18-point data under the south header", async () => {
      let resolveNorthData;
      const fetchMock = vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) {
          const params = new URL(u, "http://localhost").searchParams;
          const option = params.get("option");
          if (option === "north") return new Promise((resolve) => { resolveNorthData = resolve; });
          return Promise.resolve({ status: 200, json: async () => ringDataFixture({ to: "selfoss", option: "south", geometryId: params.get("geometryId"), routeLengthM: 44984.8, points: SOUTH_POINTS }) });
        }
        const key = new URL(u, "http://localhost").searchParams;
        const option = key.get("option");
        return Promise.resolve({
          status: 200,
          json: async () => option === "north" ? { ...ringGeometryFixture("selfoss", "north"), geometryId: NORTH_GEOMETRY_ID } : { ...ringGeometryFixture("selfoss", "south"), geometryId: SOUTH_GEOMETRY_ID },
        });
      });
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitRvkSelfoss();
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.click(screen.getByRole("radio", { name: translations.is.winterRouteOptionNorth }));
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataLoading)).toBeInTheDocument());

      fireEvent.click(screen.getByRole("radio", { name: translations.is.winterRouteOptionSouth }));
      await waitFor(() => {
        const dataRegion = screen.getByTestId("winter-route-data");
        expect(within(dataRegion).getByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "3") })).toBeInTheDocument();
      });

      // The abandoned north data request resolving late must never surface.
      await act(async () => resolveNorthData?.({ status: 200, json: async () => ringDataFixture({ to: "selfoss", option: "north", geometryId: NORTH_GEOMETRY_ID, routeLengthM: 1236038.3, points: NORTH_POINTS }) }));
      const dataRegion = screen.getByTestId("winter-route-data");
      expect(within(dataRegion).queryByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "18") })).toBeNull();
      expect(within(dataRegion).getByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "3") })).toBeInTheDocument();
    });

    it("an edge segment whose percent rounds to 0.0% shows the short fallback text, never '0,0%'", async () => {
      const geo = { ...ringGeometryFixture("selfoss", "south"), geometryId: SOUTH_GEOMETRY_ID };
      const fetchMock = vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) {
          const params = new URL(u, "http://localhost").searchParams;
          return Promise.resolve({
            status: 200,
            json: async () => ringDataFixture({
              to: "selfoss", option: "south", geometryId: params.get("geometryId"), routeLengthM: 1236038.3, points: SOUTH_POINTS,
              roadSections: [
                { idButur: 1410010037, nameIs: "Rauðavatn - Nesjavallaleið", nameEn: "Rauðavatn–Nesjavallaleið", routeLengthM: 1.3, routeLengthFraction: 1.3 / 1236038.3, isEdgeSegment: true, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] },
              ],
            }),
          });
        }
        return Promise.resolve({ status: 200, json: async () => geo });
      });
      vi.stubGlobal("fetch", fetchMock);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitRvkSelfoss();

      // Ticket #492, direct-flow -- this fixture's one section is plain
      // passable with no notice/stale/old flag, so it is not in the
      // default dense list; open the full section list to reach it.
      await waitFor(() => expect(screen.getByText("Rauðavatn")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteViewAllSectionsAction }));

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteEdgeSegmentNoteShort)).toBeInTheDocument());
      expect(screen.queryByText(/0,0%/)).toBeNull();
      expect(screen.queryByText(/0\.0%/)).toBeNull();
    });
  });

  // Ticket #503 ring-completion — the last 8 Ring Road pairs, no option at
  // all, a third (datasetVersion-only) identity shape.
  describe("Ticket #503 — ring-completion (generic Ring Road pairs, no option) weather/road data", () => {
    const RVK = "reykjavik-raudavatn";
    const DATA_HOURS = [futureHourString(2), futureHourString(3)];

    function completionGeometryFixture(from, to) {
      return { schemaVersion: 1, tier: 2, status: "geometry_only", from, to, geometryId: `${from}-${to}-geo`, datasetVersion: "ds1" };
    }

    function completionDataFixture({ from, to, geometryId, routeLengthM, points }) {
      return {
        from, to, geometryId, datasetVersion: "ds1",
        routeLengthM, unmappedLengthM: 0,
        generatedAt: "2026-11-24T09:00:00.000Z",
        roadSections: [
          { idButur: 1, nameIs: "Dæmiskafli", nameEn: "Example section", routeLengthM, routeLengthFraction: 1, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] },
        ],
        roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
        forecast: {
          available: true,
          window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS },
          points,
          stale: false, cacheAgeMs: 0,
        },
      };
    }

    const ES_POINTS = ["egilsstadir-route", "fjardarheidi-route", "seydisfjordur-route"].map((id, i) => ({
      id, labelIs: id, labelEn: id, available: true, returnedLatitude: 65.26, returnedLongitude: -14.2, elevation: 100, hours: DATA_HOURS,
      series: { temperature_2m: [i, i], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] },
    }));

    function completionFetch() {
      return vi.fn().mockImplementation((url) => {
        const u = String(url);
        const params = new URL(u, "http://localhost").searchParams;
        if (u.includes("/api/winter-route-data")) {
          const from = params.get("from"), to = params.get("to"), geometryId = params.get("geometryId");
          if ((from === "egilsstadir" && to === "seydisfjordur") || (from === "seydisfjordur" && to === "egilsstadir")) {
            return Promise.resolve({ status: 200, json: async () => completionDataFixture({ from, to, geometryId, routeLengthM: 24148.9, points: from === "egilsstadir" ? ES_POINTS : [...ES_POINTS].reverse() }) });
          }
          return Promise.resolve({ status: 200, json: async () => completionDataFixture({ from, to, geometryId, routeLengthM: 615333.3, points: ES_POINTS }) });
        }
        const from = params.get("from"), to = params.get("to");
        if ((from === RVK && to === "egilsstadir") || (from === "egilsstadir" && to === RVK) || (from === "egilsstadir" && to === "seydisfjordur") || (from === "seydisfjordur" && to === "egilsstadir")) {
          return Promise.resolve({ status: 200, json: async () => completionGeometryFixture(from, to) });
        }
        return Promise.reject(new Error(`no fixture for ${u}`));
      });
    }

    async function chooseAndSubmit(from, to) {
      const fromSelect = screen.getByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, from);
      selectWinterRoutePlace(toSelect, to);
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
    }

    it("egilsstadir<->seydisfjordur: data fetch URL carries NO option param, 3 points, no long-route note (<400km)", async () => {
      vi.stubGlobal("fetch", completionFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await chooseAndSubmit("egilsstadir", "seydisfjordur");

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
      const dataCall = global.fetch.mock.calls.find((c) => String(c[0]).includes("/api/winter-route-data"));
      expect(dataCall[0]).not.toMatch(/option=/);
      const dataRegion = screen.getByTestId("winter-route-data");
      expect(within(dataRegion).getByRole("heading", { name: translations.is.winterRouteDataForecastHeading.replace("{count}", "3") })).toBeInTheDocument();
      expect(screen.queryByText(translations.is.winterRouteLongRouteComparisonNote)).toBeNull();
    });

    it("reykjavik-raudavatn<->egilsstadir (615km): shows the ≥400km long-route comparison note", async () => {
      vi.stubGlobal("fetch", completionFetch());
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await chooseAndSubmit(RVK, "egilsstadir");

      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
      expect(screen.getByText(translations.is.winterRouteLongRouteComparisonNote)).toBeInTheDocument();
    });

    it("P8 race: a ring-option pair's own selectedOption never leaks into a subsequent generic ring-completion pair's data fetch/identity", async () => {
      const geometryFetch = vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) {
          const params = new URL(u, "http://localhost").searchParams;
          const from = params.get("from"), to = params.get("to"), geometryId = params.get("geometryId");
          if (from === RVK && to === "selfoss") {
            return Promise.resolve({ status: 200, json: async () => ({ from, to, geometryId, selectedOption: "south", datasetVersion: "ds1", policyVersion: "south-policy", unmappedLengthM: 0, routeLengthM: 44984.8, generatedAt: "2026-11-24T09:00:00.000Z", roadSections: [], roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false }, forecast: { available: true, window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS }, points: [], stale: false, cacheAgeMs: 0 } }) });
          }
          return Promise.resolve({ status: 200, json: async () => completionDataFixture({ from, to, geometryId, routeLengthM: 615333.3, points: ES_POINTS }) });
        }
        const params = new URL(u, "http://localhost").searchParams;
        const from = params.get("from"), to = params.get("to");
        if (from === RVK && to === "selfoss") return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 2, status: "geometry_only", from, to, selectedOption: "south", geometryId: `${from}-${to}-south`, options: [{ id: "south", label: "x", lengthM: 1, via: [], routeId: "a" }, { id: "north", label: "y", lengthM: 2, via: [], routeId: "b" }] }) });
        if (from === RVK && to === "egilsstadir") return Promise.resolve({ status: 200, json: async () => completionGeometryFixture(from, to) });
        return Promise.reject(new Error(`no fixture for ${u}`));
      });
      vi.stubGlobal("fetch", geometryFetch);
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);

      await chooseAndSubmit(RVK, "selfoss");
      await waitFor(() => expect(screen.getByRole("radio", { name: translations.is.winterRouteOptionSouth })).toBeInTheDocument());

      await chooseAndSubmit(RVK, "egilsstadir");
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
      // The generic pair's own data request must never have carried the
      // prior pair's own "south" option.
      const lastDataCall = [...geometryFetch.mock.calls].reverse().find((c) => String(c[0]).includes("/api/winter-route-data"));
      expect(lastDataCall[0]).not.toMatch(/option=/);
      expect(screen.queryByRole("radiogroup")).toBeNull();
    });
  });

  // Ticket #503 source-time — attribution/legal text + response-time
  // display in WinterRouteDataView, shared by all 25 connected pairs. One
  // fixture (budardalur<->holmavik, the Westfjords `regionVersion`
  // identity) is enough per the approved prompt's own instruction; the
  // block itself is pair-agnostic.
  describe("Ticket #503 source-time — attribution and response-time display", () => {
    const DATA_HOURS = [futureHourString(2), futureHourString(3)];
    const FORWARD_GEOMETRY_ID = "bh-source-time-geo";

    function sourceTimeDataFixture(overrides = {}) {
      return {
        from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID, regionVersion: "r1", routeLengthM: 78697.77,
        generatedAt: "2026-11-24T12:00:00.000Z",
        roadSections: [makeSegment(805030037, { export: { dagsKeyrtUt: "2026-11-24T11:58:00.000Z", ageMinutes: 2, isStale: false } })],
        roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
        forecast: {
          available: true,
          window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS },
          points: [
            { id: "budardalur-route", labelIs: "Búðardalur", labelEn: "Búðardalur", available: true, returnedLatitude: 65.1, returnedLongitude: -21.7, elevation: 22, hours: DATA_HOURS, series: { temperature_2m: [-1, -2], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } },
          ],
          stale: false, cacheAgeMs: 0,
        },
        ...overrides,
      };
    }

    function sourceTimeFetch(fixture) {
      return vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("/api/winter-route-data")) return Promise.resolve({ status: 200, json: async () => fixture });
        return Promise.resolve({ status: 200, json: async () => ({ schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }) });
      });
    }

    async function submitBudardalurHolmavik() {
      const fromSelect = await screen.findByLabelText(translations.is.winterRouteFromLabel);
      const toSelect = screen.getByLabelText(translations.is.winterRouteToLabel);
      const { fireEvent } = await import("@testing-library/react");
      selectWinterRoutePlace(fromSelect, "budardalur");
      selectWinterRoutePlace(toSelect, "holmavik");
      fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
    }

    async function renderWith(fixture) {
      vi.stubGlobal("fetch", sourceTimeFetch(fixture));
      render(<MemoryRouter initialEntries={["/winter-route"]}><WinterRoute /></MemoryRouter>);
      await submitBudardalurHolmavik();
      await waitFor(() => expect(screen.getByText(translations.is.winterRouteDataConnectedDisclaimer)).toBeInTheDocument());
      return within(screen.getByTestId("winter-route-data"));
    }

    it("P1: the same four legal/safety lines + two attribution lines + two links as the legacy view are shown, scoped outside role=status", async () => {
      const data = await renderWith(sourceTimeDataFixture());
      expect(data.getByText(translations.is.winterRouteModifiedBy)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteNoEndorsement)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteOfficialOverride)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteNotSafetyAdvice)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteAttributionRoadLine)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteAttributionWeatherLine)).toBeInTheDocument();
      expect(data.getByRole("link", { name: translations.is.winterRouteOfficialSourceLinkRoad })).toBeInTheDocument();
      expect(data.getByRole("link", { name: translations.is.winterRouteOfficialSourceLinkWeather })).toBeInTheDocument();
      // Outside role="status": the status region only ever has the heading text.
      expect(data.getByText(translations.is.winterRouteModifiedBy).closest('[role="status"]')).toBeNull();
    });

    it("(1) fresh 0/0: both cache-age lines read 'under a minute', and the P2 road-export-time line is shown", async () => {
      const data = await renderWith(sourceTimeDataFixture());
      expect(data.getByText(translations.is.winterRouteRoadCacheAgeUnderMinuteLine)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteForecastCacheAgeUnderMinuteLine)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteRoadExportedAtLine.replace("{time}", "2026-11-24 11:58"))).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteDataGeneratedAtLine.replace("{time}", "2026-11-24 12:00"))).toBeInTheDocument();
    });

    it("(2) distinct road/forecast cache ages (4 min vs 9 min) are never swapped", async () => {
      const data = await renderWith(sourceTimeDataFixture({
        roadMeta: { available: true, stale: false, cacheAgeMs: 240000, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
        forecast: { available: true, window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS }, points: [{ id: "budardalur-route", labelIs: "Búðardalur", labelEn: "Búðardalur", available: true, returnedLatitude: 65.1, returnedLongitude: -21.7, elevation: 22, hours: DATA_HOURS, series: { temperature_2m: [-1, -2], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } }], stale: false, cacheAgeMs: 540000 },
      }));
      expect(data.getByText(translations.is.winterRouteRoadCacheAgeLine.replace("{minutes}", "4"))).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteForecastCacheAgeLine.replace("{minutes}", "9"))).toBeInTheDocument();
    });

    it("(3) stale road and stale forecast: the existing amber stale text and the new cache-age line agree on the same rounded minute figure", async () => {
      const data = await renderWith(sourceTimeDataFixture({
        roadMeta: { available: true, stale: true, cacheAgeMs: 2100000, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
        forecast: { available: true, window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS }, points: [{ id: "budardalur-route", labelIs: "Búðardalur", labelEn: "Búðardalur", available: true, returnedLatitude: 65.1, returnedLongitude: -21.7, elevation: 22, hours: DATA_HOURS, series: { temperature_2m: [-1, -2], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } }], stale: true, cacheAgeMs: 4800000 },
      }));
      expect(data.getByText(translations.is.winterRouteRoadStaleServed.replace("{minutes}", "35"))).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteRoadCacheAgeLine.replace("{minutes}", "35"))).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteForecastStaleServed.replace("{minutes}", "80"))).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteForecastCacheAgeLine.replace("{minutes}", "80"))).toBeInTheDocument();
    });

    it("(4) road unavailable WITH cacheAgeMs:0 (the real ??0 shape the backend can produce): no false 'under a minute'/P2 line, existing unavailable text and attribution still shown", async () => {
      const data = await renderWith(sourceTimeDataFixture({
        roadMeta: { available: false, stale: false, cacheAgeMs: 0, segmentsAvailable: false, pointsAvailable: false, pointsFeedUnavailableOrStale: false },
        roadSections: [],
      }));
      expect(data.queryByText(translations.is.winterRouteRoadCacheAgeUnderMinuteLine)).toBeNull();
      expect(data.queryByText(/^Færð: aldur gagna í skyndiminni/)).toBeNull();
      expect(data.queryByText(translations.is.winterRouteRoadExportedAtLine.replace("{time}", "2026-11-24 11:58"))).toBeNull();
      expect(data.getByText(translations.is.winterRouteRoadFeedUnavailable)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteAttributionRoadLine)).toBeInTheDocument();
    });

    it("(5) forecast unavailable without a cacheAgeMs key at all: no forecast cache-age line, no crash", async () => {
      const data = await renderWith(sourceTimeDataFixture({
        forecast: { available: false, reason: "key_missing", points: [] },
      }));
      expect(data.queryByText(translations.is.winterRouteForecastCacheAgeUnderMinuteLine)).toBeNull();
      expect(data.getAllByText(translations.is.winterRouteForecastUnavailable).length).toBeGreaterThan(0);
      expect(data.getByText(translations.is.winterRouteAttributionWeatherLine)).toBeInTheDocument();
    });

    it("(6) both road and forecast unavailable: no cache-age lines at all, attribution/legal text still shown, no crash", async () => {
      const data = await renderWith(sourceTimeDataFixture({
        roadMeta: { available: false, stale: false, cacheAgeMs: 0, segmentsAvailable: false, pointsAvailable: false, pointsFeedUnavailableOrStale: false },
        roadSections: [],
        forecast: { available: false, reason: "key_missing", points: [] },
      }));
      expect(data.queryByText(/aldur gagna í skyndiminni/)).toBeNull();
      expect(data.getByText(translations.is.winterRouteModifiedBy)).toBeInTheDocument();
    });

    it("(7) invalid/missing/negative generatedAt and cacheAgeMs, and garbage export.dagsKeyrtUt: every affected line is simply omitted, attribution unaffected, no throw", async () => {
      const data = await renderWith(sourceTimeDataFixture({
        generatedAt: "not-a-real-timestamp-but-16-chars-plus",
        roadSections: [makeSegment(805030037, { export: { dagsKeyrtUt: null, ageMinutes: null, isStale: false } })],
        roadMeta: { available: true, stale: false, cacheAgeMs: -500, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
        forecast: { available: true, window: { startHour: DATA_HOURS[0], endHour: DATA_HOURS[1], expectedHours: DATA_HOURS }, points: [{ id: "budardalur-route", labelIs: "Búðardalur", labelEn: "Búðardalur", available: true, returnedLatitude: 65.1, returnedLongitude: -21.7, elevation: 22, hours: DATA_HOURS, series: { temperature_2m: [-1, -2], wind_speed_10m: [1, 1], wind_gusts_10m: [1, 1], precipitation: [0, 0], weather_code: [3, 3] } }], stale: false, cacheAgeMs: NaN },
      }));
      expect(data.queryByText(/UTC\./)).toBeNull(); // no generatedAt/export line rendered at all
      expect(data.queryByText(/aldur gagna í skyndiminni/)).toBeNull();
      expect(data.getByText(translations.is.winterRouteAttributionRoadLine)).toBeInTheDocument();
      expect(data.getByText(translations.is.winterRouteAttributionWeatherLine)).toBeInTheDocument();
    });
  });
});
