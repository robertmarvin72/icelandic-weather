// src/pages/WinterRouteTimeSlider.test.jsx -- Ticket #492, time-slider.
// Own small file (P7: "ný skrá... ekki fjölga sameiginlega stóra
// testfile óþarflega") for the new native-range time control on the
// "Velja staði" choose-flow data view. Legacy fixed-route view, request
// lifecycle, identity/race/draft/fetch-count logic are untouched and
// stay covered by WinterRoute.test.jsx; nothing here duplicates those.
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WinterRoute from "./WinterRoute";
import { translations } from "../i18n/translations";
import { formatDecimal } from "../lib/winterRoutePresentation";

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

// Same combobox-driving technique as WinterRoute.test.jsx's own
// `selectWinterRoutePlace` (duplicated per-file by this project's own
// established convention, not shared across test files).
function selectWinterRoutePlace(input, placeId) {
  fireEvent.focus(input);
  const listbox = document.getElementById(input.getAttribute("aria-controls"));
  const option = listbox?.querySelector(`[data-place-id="${placeId}"]`);
  if (!option) throw new Error(`no option for "${placeId}"`);
  fireEvent.mouseDown(option);
  fireEvent.click(option);
}

async function selectAndSubmit(from, to) {
  const fromInput = await screen.findByLabelText(translations.is.winterRouteFromLabel);
  const toInput = screen.getByLabelText(translations.is.winterRouteToLabel);
  selectWinterRoutePlace(fromInput, from);
  selectWinterRoutePlace(toInput, to);
  fireEvent.click(screen.getByRole("button", { name: translations.is.winterRouteShowRouteButton }));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
function hourStringAt(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:00`;
}
// Hours starting at the next full UTC hour after "now" + offsetHours, so
// they are always genuinely in the future regardless of when the suite
// runs (same discipline as every other file in this ticket).
function futureHours(offsetHours, count) {
  const base = Math.ceil(Date.now() / 3600000) * 3600000 + offsetHours * 3600000;
  const out = [];
  for (let i = 0; i < count; i++) out.push(hourStringAt(base + i * 3600000));
  return out;
}

function geometryFixture(from, to, geometryId) {
  return { schemaVersion: 1, tier: 0, status: "geometry_only", from, to, geometryId };
}

function dataFixture(from, to, geometryId, hours, overrides = {}) {
  return {
    from, to, geometryId, regionVersion: "r1", routeLengthM: 1000,
    generatedAt: "2026-11-25T09:00:00.000Z",
    roadSections: [
      // Ticket #492, direct-flow -- flagged (export.isStale: true) so this
      // section renders in RoadOverviewSection's own default list without
      // needing to open "Sjá alla vegkafla" first; this file's tests are
      // about the time slider, not about road-section flagging.
      { idButur: 1, nameIs: "Kafli A", nameEn: "Section A", routeLengthM: 1000, routeLengthFraction: 1, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: true }, registration: { isOld: false }, notices: [] },
    ],
    roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
    forecast: {
      available: true,
      window: { startHour: hours[0] ?? null, endHour: hours[hours.length - 1] ?? null, expectedHours: hours },
      points: [
        {
          id: "p1", labelIs: "Punktur Eitt", labelEn: "Point One", available: true,
          returnedLatitude: 65, returnedLongitude: -21, elevation: 10, hours,
          series: {
            temperature_2m: hours.map((_, i) => i),
            wind_speed_10m: hours.map((_, i) => i + 1),
            wind_gusts_10m: hours.map((_, i) => i + 2),
            precipitation: hours.map((_, i) => Math.round(i * 10) / 100),
            weather_code: hours.map(() => 3),
          },
        },
      ],
      stale: false, cacheAgeMs: 0,
      ...overrides.forecast,
    },
    ...overrides,
  };
}

function fetchWith(hours, overrides) {
  return vi.fn().mockImplementation((url) => {
    const u = String(url);
    if (u.includes("/api/winter-route-data")) {
      return Promise.resolve({ status: 200, json: async () => dataFixture("budardalur", "holmavik", "geo-fwd", hours, overrides) });
    }
    return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "holmavik", "geo-fwd") });
  });
}

async function renderWithHours(hours, overrides) {
  vi.stubGlobal("fetch", fetchWith(hours, overrides));
  render(<MemoryRouter><WinterRoute /></MemoryRouter>);
  await selectAndSubmit("budardalur", "holmavik");
  const region = await screen.findByTestId("winter-route-data");
  await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());
  return region;
}

describe("Ticket #492, time-slider -- n=0/1/2/24 control states (P1(iv))", () => {
  it("n=0 (no upcoming hours): no slider, no fake 00:00, data-shortage text shown", async () => {
    const region = await renderWithHours([]);
    expect(within(region).queryByLabelText(translations.is.winterRouteDataHourLabel)).toBeNull();
    expect(within(region).getByText(translations.is.winterRouteForecastUnavailable)).toBeInTheDocument();
    expect(within(region).queryByText("00:00")).toBeNull();
  });

  it("n=1: slider present but disabled, min=max=0, both step buttons disabled, value visible", async () => {
    const region = await renderWithHours(futureHours(1, 1));
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    expect(slider).toBeDisabled();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "0");
    expect(within(region).getByRole("button", { name: translations.is.winterRoutePrevHourButton })).toBeDisabled();
    expect(within(region).getByRole("button", { name: translations.is.winterRouteNextHourButton })).toBeDisabled();
    // The full date/time value is still shown even though the control is disabled.
    expect(within(region).getByText(`${formatDecimal(0, "is", 1)} °C`)).toBeInTheDocument();
  });

  it("n=2: slider enabled, min=0 max=1, next enabled/prev disabled at the start", async () => {
    const region = await renderWithHours(futureHours(1, 2));
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    expect(slider).not.toBeDisabled();
    expect(slider).toHaveAttribute("max", "1");
    expect(within(region).getByRole("button", { name: translations.is.winterRoutePrevHourButton })).toBeDisabled();
    expect(within(region).getByRole("button", { name: translations.is.winterRouteNextHourButton })).not.toBeDisabled();
  });

  it("n=24: slider max=23, a full day's worth of slots", async () => {
    const region = await renderWithHours(futureHours(1, 24));
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    expect(slider).toHaveAttribute("max", "23");
  });
});

describe("Ticket #492, time-slider -- slider change and button steps land on the SAME value (P1(i)/(ii))", () => {
  it("dragging the slider to index 2 shows the same point values as clicking 'next' twice from index 0", async () => {
    const region = await renderWithHours(futureHours(1, 4));
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);

    fireEvent.change(slider, { target: { value: "2" } });
    const viaSlider = within(region).getByText(`${formatDecimal(2, "is", 1)} °C`).closest('[role="row"]').textContent;

    fireEvent.change(slider, { target: { value: "0" } }); // reset
    const next = within(region).getByRole("button", { name: translations.is.winterRouteNextHourButton });
    fireEvent.click(next);
    fireEvent.click(next);
    const viaButtons = within(region).getByText(`${formatDecimal(2, "is", 1)} °C`).closest('[role="row"]').textContent;

    expect(viaButtons).toBe(viaSlider);
  });

  it("step buttons move to the NEXT STACK in availableHours, never a '+1 hour' arithmetic jump", async () => {
    // Build a window with an intentional gap: hours[1] is 2h after hours[0],
    // not 1h -- the step button must land exactly on hours[1], never
    // synthesize an intermediate, non-existent hour.
    const hours = futureHours(1, 1).concat(futureHours(3, 1));
    const region = await renderWithHours(hours);
    const next = within(region).getByRole("button", { name: translations.is.winterRouteNextHourButton });
    fireEvent.click(next);
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    expect(slider.value).toBe("1");
    expect(within(region).getByText(`${formatDecimal(1, "is", 1)} °C`)).toBeInTheDocument();
  });
});

describe("Ticket #492, time-slider -- fast A->B->C selection (no stale intermediate state)", () => {
  it("rapid successive selections leave every value/icon in the row reflecting ONLY the final choice (C)", async () => {
    const region = await renderWithHours(futureHours(1, 3));
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);

    fireEvent.change(slider, { target: { value: "0" } }); // A
    fireEvent.change(slider, { target: { value: "1" } }); // B
    fireEvent.change(slider, { target: { value: "2" } }); // C

    expect(within(region).getByText(`${formatDecimal(2, "is", 1)} °C`)).toBeInTheDocument();
    expect(within(region).getByText(`${formatDecimal(3, "is", 1)} m/s`)).toBeInTheDocument(); // wind at C
    expect(within(region).queryByText(`${formatDecimal(0, "is", 1)} °C`)).toBeNull();
    expect(within(region).queryByText(`${formatDecimal(1, "is", 1)} °C`)).toBeNull();
  });
});

describe("Ticket #492, time-slider -- a point with a missing slot shows the dash, never a guessed 0", () => {
  it("a point whose own hours array does not contain the selected hour shows '—', not 0", async () => {
    const hours = futureHours(1, 2);
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        const d = dataFixture("budardalur", "holmavik", "geo-fwd", hours);
        d.forecast.points[0].hours = [hours[0]]; // only hour 0 has real data
        d.forecast.points[0].series = { temperature_2m: [5], wind_speed_10m: [1], wind_gusts_10m: [1], precipitation: [0], weather_code: [3] };
        return Promise.resolve({ status: 200, json: async () => d });
      }
      return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "holmavik", "geo-fwd") });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText(`${formatDecimal(5, "is", 1)} °C`)).toBeInTheDocument());

    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    fireEvent.change(slider, { target: { value: "1" } });
    expect(within(region).getByText(translations.is.winterRouteForecastNotAvailableAtComputedTime)).toBeInTheDocument();
    expect(within(region).queryByText("0,0 °C")).toBeNull();
  });
});

describe("Ticket #492, time-slider -- minute-tick re-filters without giving a wrong time (P1(v))", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("a tick that ages out the first hour re-points the slider at the new first slot, never an old mismatched time", async () => {
    // Same selective-fake technique as the existing legacy V1/T2 tests
    // above (`toFake: ["setInterval", "Date"]`): only `setInterval`/`Date`
    // are faked, so `waitFor`'s own real-`setTimeout` polling still works
    // during setup -- faking everything from the start deadlocks every
    // `waitFor`/`findByTestId` call against a clock nothing advances.
    vi.useFakeTimers({ toFake: ["setInterval", "Date"] });
    const base = new Date();
    vi.setSystemTime(base);
    const hours = futureHours(1, 2);
    const region = await renderWithHours(hours);
    expect(within(region).getByText(`${formatDecimal(0, "is", 1)} °C`)).toBeInTheDocument();

    // Jump the (faked) system clock past hours[0]'s own cutoff, then
    // advance the (faked) setInterval so useNowTicking's own 60s tick
    // actually fires and re-renders with the new "now".
    vi.setSystemTime(new Date(Date.parse(`${hours[0]}:00Z`) + 1000));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    // hours[0] has aged out; the view must now show hours[1]'s own
    // value (index 1 -> temp 1), never a stale hours[0] value under a
    // shifted index, and never throw.
    await waitFor(() => expect(within(region).queryByText(`${formatDecimal(0, "is", 1)} °C`)).toBeNull());
    expect(within(region).getByText(`${formatDecimal(1, "is", 1)} °C`)).toBeInTheDocument();
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    expect(slider).toHaveAttribute("max", "0");
  });
});

describe("Ticket #492, time-slider -- fallback notice only after the user's OWN pick disappears (P1(iii))", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("an untouched default aging out of availableHours shows NO notice", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "Date"] });
    const base = new Date();
    vi.setSystemTime(base);
    const hours = futureHours(1, 2);
    const region = await renderWithHours(hours);

    vi.setSystemTime(new Date(Date.parse(`${hours[0]}:00Z`) + 1000));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    await waitFor(() => expect(within(region).getByText(`${formatDecimal(1, "is", 1)} °C`)).toBeInTheDocument());
    expect(within(region).queryByText(translations.is.winterRouteTimeNoLongerAvailable)).toBeNull();
  });

  it("picking a time, then having it age out, DOES show the notice and falls back to the new first slot", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "Date"] });
    const base = new Date();
    vi.setSystemTime(base);
    // 3 hours so the user's own pick (index 1) is a genuinely DIFFERENT
    // selection from the index-0 default -- picking index 0 again (the
    // value already shown) would not fire a real React onChange at all
    // (react-dom's own value-tracker suppresses a same-value "change").
    const hours = futureHours(1, 3);
    const region = await renderWithHours(hours);
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    fireEvent.change(slider, { target: { value: "1" } }); // explicit user pick: hours[1]

    // Age out BOTH hours[0] and hours[1] -- only hours[2] remains, so the
    // user's own picked hour (hours[1]) is the one that disappears.
    vi.setSystemTime(new Date(Date.parse(`${hours[1]}:00Z`) + 1000));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    await waitFor(() => expect(within(region).getByText(translations.is.winterRouteTimeNoLongerAvailable)).toBeInTheDocument());
    expect(within(region).getByText(`${formatDecimal(2, "is", 1)} °C`)).toBeInTheDocument();
  });

  it("an empty availableHours list shows the data-shortage text, not the fallback notice", async () => {
    const region = await renderWithHours([]);
    expect(within(region).queryByText(translations.is.winterRouteTimeNoLongerAvailable)).toBeNull();
    expect(within(region).getByText(translations.is.winterRouteForecastUnavailable)).toBeInTheDocument();
  });
});

describe("Ticket #492, time-slider -- disabled states and focus at the boundary (P3(iv))", () => {
  it("prev is disabled at the first slot, next is disabled at the last slot", async () => {
    const region = await renderWithHours(futureHours(1, 3));
    const prev = within(region).getByRole("button", { name: translations.is.winterRoutePrevHourButton });
    const next = within(region).getByRole("button", { name: translations.is.winterRouteNextHourButton });
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    fireEvent.click(next);
    expect(prev).not.toBeDisabled();
    expect(next).toBeDisabled();
  });

  it("stepping to the last slot while focused on 'next' moves focus to the slider once 'next' becomes disabled", async () => {
    const region = await renderWithHours(futureHours(1, 2));
    const next = within(region).getByRole("button", { name: translations.is.winterRouteNextHourButton });
    next.focus();
    expect(document.activeElement).toBe(next);

    fireEvent.click(next); // now at the last slot -- "next" becomes disabled
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    await waitFor(() => expect(document.activeElement).toBe(slider));
  });
});

describe("Ticket #492, time-slider -- DOM order: road overview -> time control -> table (P5(i))", () => {
  it("RoadOverviewSection precedes the time control, which precedes role=table, with nothing else between the control and the table", async () => {
    const region = await renderWithHours(futureHours(1, 2));
    const roadHeading = within(region).getByText(translations.is.winterRouteRoadSectionTitle ?? "Færð og lokanir", { exact: false });
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    const table = within(region).getByRole("table");

    // road -> slider
    expect(roadHeading.compareDocumentPosition(slider) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // slider -> table
    expect(slider.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Nothing but the control's own subtree sits between the slider's
    // container and the table: walk forward from the slider's own
    // top-level wrapper to the table and confirm every sibling in
    // between belongs to the slider block itself (same parent <section>,
    // no intervening heading/notes element reordered incorrectly).
    const controlBlock = slider.closest("div.mt-3");
    let sibling = controlBlock.nextElementSibling;
    expect(sibling).toBe(table);
  });
});

describe("Ticket #492, time-slider -- the road section's own DOM is unaffected by a time change, and no new fetch fires (P5(iii))", () => {
  it("RoadOverviewSection's innerHTML is byte-identical before and after changing the selected hour, with no new data/geometry request", async () => {
    let dataCalls = 0, geometryCalls = 0;
    const hours = futureHours(1, 3);
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/api/winter-route-data")) {
        dataCalls += 1;
        return Promise.resolve({ status: 200, json: async () => dataFixture("budardalur", "holmavik", "geo-fwd", hours) });
      }
      geometryCalls += 1;
      return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", "holmavik", "geo-fwd") });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());

    const roadSectionBefore = within(region).getByText("Kafli A").closest("section, div[class*='mt-6']");
    const htmlBefore = roadSectionBefore.innerHTML;
    const [callsBefore] = [dataCalls];

    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    fireEvent.change(slider, { target: { value: "2" } });

    const roadSectionAfter = within(region).getByText("Kafli A").closest("section, div[class*='mt-6']");
    expect(roadSectionAfter.innerHTML).toBe(htmlBefore);
    expect(dataCalls).toBe(callsBefore);
    expect(geometryCalls).toBe(1);
  });
});

describe("Ticket #492, time-slider -- route switch resets to the first slot (P6, documented interpretation)", () => {
  it("submitting a new pair (fresh WinterRouteDataView mount) starts back at index 0, never carrying over the prior pair's own selected index", async () => {
    const hoursA = futureHours(1, 3);
    const hoursB = futureHours(1, 4);
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
      const u = String(url);
      const params = new URL(u, "http://localhost").searchParams;
      if (u.includes("/api/winter-route-data")) {
        const to = params.get("to");
        const hours = to === "holmavik" ? hoursA : hoursB;
        return Promise.resolve({ status: 200, json: async () => dataFixture("budardalur", to, "geo-fwd", hours) });
      }
      return Promise.resolve({ status: 200, json: async () => geometryFixture("budardalur", params.get("to"), "geo-fwd") });
    }));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);
    await selectAndSubmit("budardalur", "holmavik");
    let region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());

    const sliderA = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    fireEvent.change(sliderA, { target: { value: "2" } }); // last slot of A

    await selectAndSubmit("budardalur", "flokalundur");
    region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Punktur Eitt")).toBeInTheDocument());
    const sliderB = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    expect(sliderB.value).toBe("0");
    expect(within(region).getByText(`${formatDecimal(0, "is", 1)} °C`)).toBeInTheDocument();
  });
});

describe("Ticket #492, time-slider -- exactly one labelled control (P3(i))", () => {
  it("getByLabelText(winterRouteDataHourLabel) returns exactly one element", async () => {
    const region = await renderWithHours(futureHours(1, 2));
    expect(within(region).getByLabelText(translations.is.winterRouteDataHourLabel).tagName).toBe("INPUT");
  });
});

describe("Ticket #492, time-slider -- control stays outside live status regions (existing discipline)", () => {
  it("the slider is not inside role=status/aria-live, but the fallback notice (when shown) is its own status region", async () => {
    const region = await renderWithHours(futureHours(1, 2));
    const slider = within(region).getByLabelText(translations.is.winterRouteDataHourLabel);
    expect(slider.closest('[role="status"], [aria-live]')).toBeNull();
  });
});

// marks-fix round, P4/R3 -- both separation-text lines, each checked
// INSIDE its own real container (not just "appears somewhere on the
// page" -- round-1's own version of these checks let both lines be
// removed without failing, since they only searched the whole page).
describe('Ticket #492, time-slider -- separation texts live in their OWN container, exactly once (P4/R3)', () => {
  it('"Nýjasta færðarstaða, óháð völdum spátíma." is inside the road section itself, exactly once, in both languages', async () => {
    const region = await renderWithHours(futureHours(1, 2));
    const roadHeading = within(region).getByText(translations.is.winterRouteRoadSectionTitle);
    const roadSection = roadHeading.closest("section");
    expect(within(roadSection).getAllByText(translations.is.winterRouteRoadCurrentRegardlessOfTimeNote)).toHaveLength(1);
    expect(within(region).getAllByText(translations.is.winterRouteRoadCurrentRegardlessOfTimeNote)).toHaveLength(1);
  });

  it('"Sami spátími fyrir alla veðurpunkta." is inside the time-slider block itself, exactly once, in both languages', async () => {
    const region = await renderWithHours(futureHours(1, 2));
    const sliderBlock = within(region).getByTestId("winter-route-time-slider");
    expect(within(sliderBlock).getAllByText(translations.is.winterRouteSameForecastTimeNoteChoose)).toHaveLength(1);
    expect(within(region).getAllByText(translations.is.winterRouteSameForecastTimeNoteChoose)).toHaveLength(1);
  });

  it("renders both separation texts in English too, each exactly once in its own container", async () => {
    vi.stubGlobal("fetch", fetchWith(futureHours(1, 2)));
    localStorage.setItem("lang", JSON.stringify("en"));
    render(<MemoryRouter><WinterRoute /></MemoryRouter>);

    const fromInput = await screen.findByLabelText(translations.en.winterRouteFromLabel);
    const toInput = screen.getByLabelText(translations.en.winterRouteToLabel);
    selectWinterRoutePlace(fromInput, "budardalur");
    selectWinterRoutePlace(toInput, "holmavik");
    fireEvent.click(screen.getByRole("button", { name: translations.en.winterRouteShowRouteButton }));

    const region = await screen.findByTestId("winter-route-data");
    await waitFor(() => expect(within(region).getByText("Point One")).toBeInTheDocument());

    const roadHeading = within(region).getByText(translations.en.winterRouteRoadSectionTitle);
    const roadSection = roadHeading.closest("section");
    expect(within(roadSection).getAllByText(translations.en.winterRouteRoadCurrentRegardlessOfTimeNote)).toHaveLength(1);

    const sliderBlock = within(region).getByTestId("winter-route-time-slider");
    expect(within(sliderBlock).getAllByText(translations.en.winterRouteSameForecastTimeNoteChoose)).toHaveLength(1);

    localStorage.removeItem("lang");
  });
});
