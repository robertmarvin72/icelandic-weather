// Ticket #464 — task-local, read-only research harness (J1/J9). Renders the
// REAL, retained src/components/HourlyForecastModal.jsx (no copy, no
// refactor, no export added) via React Testing Library, mocking only the
// network/cache boundary (../../../../../src/lib/forecastCache's
// getForecast), exactly as the repo's own HourlyForecastModal.test.jsx
// already does. Never calls the real forecastCache/getForecast, never
// writes to localStorage, never makes a network request.
//
// Run with:
//   npx vitest run --config docs/ai/tasks/ticket-464/harness/vitest.config.ticket464.mjs
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import HourlyForecastModal from "../../../../../src/components/HourlyForecastModal";

vi.mock("../../../../../src/lib/forecastCache", () => ({ getForecast: vi.fn() }));
import { getForecast } from "../../../../../src/lib/forecastCache";

// "bestWeatherWindow" is special-cased to the app's own real fallback
// template (HourlyForecastModal.jsx:355, used verbatim when no i18n catalog
// is wired in) so the rendered best-window text actually interpolates
// {from}/{to}; every other key is left as the bare key, which is enough to
// assert on (badgeGood/badgeRough/labelWind/etc. are never substrings of
// each other).
const t = (k) => (k === "bestWeatherWindow" ? "Best window {from}-{to}" : k);
const site = { name: "Laugardalur (synthetic)", lat: 64.1451, lon: -21.875 };

beforeEach(() => vi.clearAllMocks());

function hourly(date, entries) {
  // entries: [{hour, wind, gust, rain, pop, code, temp}] — only the hours
  // present are included (buildHourlyRows still re-filters by hour % 3 ===
  // 0 internally; tests that want to probe "unsampled" hours include them
  // here and assert they never appear in the rendered list).
  return {
    hourly: {
      time: entries.map((e) => `${date}T${String(e.hour).padStart(2, "0")}:00`),
      weathercode: entries.map((e) => (e.code ?? 1)),
      temperature_2m: entries.map((e) => (e.temp ?? 5)),
      windspeed_10m: entries.map((e) => e.wind),
      windgusts_10m: entries.map((e) => e.gust),
      precipitation: entries.map((e) => e.rain),
      precipitation_probability: entries.map((e) => (e.pop === undefined ? 10 : e.pop)),
    },
  };
}

describe("#464 J1/contract-item-1&4 — real render, Oct-28 owner scenario (all 00..21 sampled hours reported 'Good time')", () => {
  it("renders 8 cards (00,03,...,21), all badged Good, with a single best window 00-21, from synthetic all-calm hourly input", async () => {
    const entries = Array.from({ length: 8 }, (_, k) => ({ hour: k * 3, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }));
    getForecast.mockResolvedValue(hourly("2026-10-28", entries));

    render(
      <HourlyForecastModal
        site={site}
        day={{ date: "2026-10-28", dayLabel: "Wed" }}
        lang="en"
        t={t}
        onClose={() => {}}
      />
    );

    await waitFor(() => expect(screen.getAllByText("badgeGood").length).toBe(8));
    expect(screen.queryByText("badgeRough")).toBeNull();
    expect(screen.getAllByText(/00:00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/21:00/).length).toBeGreaterThan(0);
    // bestWeatherWindow template: "Best window {from}-{to}"
    expect(screen.getByText(/Best window 00:00-21:00/)).toBeInTheDocument();
  });
});

describe("#464 J4 — daily-state vs modal-refetch asymmetry (two synthetic payloads behind the same getForecast mock)", () => {
  it("the modal shows whatever its OWN getForecast call resolves to, independent of any daily-row data the caller already held — demonstrating the mechanism only, not evidence about the real screenshots", async () => {
    // First payload: calm (what a hypothetical earlier fetch, feeding the
    // already-rendered daily grade, might have looked like).
    const calmPayload = hourly("2026-10-28", [
      { hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 },
      { hour: 3, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 },
    ]);
    // Second payload: a different (later) run with a rough early hour —
    // what the SAME cache key could return after the 30-minute TTL
    // (forecastCache.js:2,106-138) expires and getForecast fetches again.
    const laterPayload = hourly("2026-10-28", [
      { hour: 0, wind: 20, gust: 25, rain: 0, pop: 10, code: 1 },
      { hour: 3, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 },
    ]);

    getForecast.mockResolvedValueOnce(calmPayload);
    const { unmount } = render(
      <HourlyForecastModal site={site} day={{ date: "2026-10-28", dayLabel: "Wed" }} lang="en" t={t} onClose={() => {}} />
    );
    await waitFor(() => expect(screen.getAllByText("badgeGood").length).toBe(2));
    unmount();

    getForecast.mockResolvedValueOnce(laterPayload);
    render(
      <HourlyForecastModal site={site} day={{ date: "2026-10-28", dayLabel: "Wed" }} lang="en" t={t} onClose={() => {}} />
    );
    await waitFor(() => expect(screen.getAllByText("badgeRough").length).toBe(1));
    // Mechanism demonstrated: the modal is not reading the daily row's own
    // already-fetched hourly data at all — it re-resolves getForecast on
    // every open, so two opens can legitimately see two different runs.
  });
});

describe("#464 J5 — hourly predicate edge semantics (getWindowState, via real rendered badges)", () => {
  it("all four fields null/absent is vacuously Good (AND of null-or-threshold clauses, no OR clause fires)", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [{ hour: 0, wind: null, gust: null, rain: null, pop: null, code: 1 }])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("badgeGood")).toBeInTheDocument());
  });

  it("NaN wind is neither Good nor Rough (typeof NaN === 'number' so it is not treated as absent, but it fails every <= and >= comparison) -> no badge rendered", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [{ hour: 0, wind: NaN, gust: null, rain: 0, pop: 10, code: 1 }])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("labelWind:")).toBeInTheDocument());
    expect(screen.queryByText("badgeGood")).toBeNull();
    expect(screen.queryByText("badgeRough")).toBeNull();
  });

  it("Infinity wind is Rough (wind >= 15 is true for Infinity)", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [{ hour: 0, wind: Infinity, gust: null, rain: 0, pop: 10, code: 1 }])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("badgeRough")).toBeInTheDocument());
  });

  it("a numeric string wind ('5') is treated as absent (typeof !== 'number'), so it never blocks Good and never triggers Rough, even at a value that would be Rough as a real number", async () => {
    getForecast.mockResolvedValue(
      // "20" as a string would be Rough (wind>=15) if it were a real number;
      // as a string it is excluded from both the good and rough predicates.
      hourly("2026-10-28", [{ hour: 0, wind: "20", gust: null, rain: 0, pop: 10, code: 1 }])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("badgeGood")).toBeInTheDocument());
  });

  it("zero and negative wind/rain are Good (no lower bound in the predicate)", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [{ hour: 0, wind: -5, gust: -2, rain: -1, pop: 0, code: 1 }])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("badgeGood")).toBeInTheDocument());
  });

  it("missing precipitation_probability array entirely -> pop is null for every row -> does not block Good", async () => {
    const payload = hourly("2026-10-28", [{ hour: 0, wind: 5, gust: 8, rain: 0, code: 1 }]);
    delete payload.hourly.precipitation_probability;
    getForecast.mockResolvedValue(payload);
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("badgeGood")).toBeInTheDocument());
  });

  it("an unsampled peak between 3-hourly samples never appears as a card or affects the badges/best window shown", async () => {
    // Real hours 0,1,2,3 exist in the payload; only hour%3===0 survives the
    // modal's own filter (HourlyForecastModal.jsx:69), so hour=1's spike is
    // invisible both as a card and to getWindowState/summary.
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [
        { hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 },
        { hour: 1, wind: 25, gust: 30, rain: 5, pop: 90, code: 1 }, // the "peak", unsampled
        { hour: 2, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 },
        { hour: 3, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 },
      ])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("badgeGood").length).toBe(2)); // hour 0 and hour 3 only
    expect(screen.queryByText("badgeRough")).toBeNull();
    expect(screen.getByText(/00:00-03:00/)).toBeInTheDocument(); // best window spans across the invisible spike
  });

  it("a mixed good/rough run breaks the best-window streak at the first rough sample and restarts after it", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [
        { hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }, // good (run#1, len1)
        { hour: 3, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }, // good (run#1, len2)
        { hour: 6, wind: 20, gust: 25, rain: 0, pop: 10, code: 1 }, // rough, breaks streak
        { hour: 9, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }, // good (run#2, len1)
      ])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("badgeGood").length).toBe(3));
    expect(screen.getByText("badgeRough")).toBeInTheDocument();
    // run#1 (00-03, length 2) is strictly longer than run#2 (09-09, length
    // 1), so the best window is the FIRST run, per strict `>` tie-breaking
    // at HourlyForecastModal.jsx:259.
    expect(screen.getByText(/00:00-03:00/)).toBeInTheDocument();
  });

  it("a tie between two equal-length good runs keeps the FIRST run (strict greater-than, not greater-or-equal)", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [
        { hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }, // run#1 len1
        { hour: 3, wind: 20, gust: 8, rain: 0, pop: 10, code: 1 }, // rough, breaks
        { hour: 6, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }, // run#2 len1 (tie with run#1)
      ])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/00:00-00:00/)).toBeInTheDocument());
  });

  it("duplicate timestamps for the same hour are both kept as separate cards (no de-duplication) and both feed the best-window scan as if continuous", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [
        { hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 },
        { hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 3 }, // duplicate hour, different code
      ])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("badgeGood").length).toBe(2));
    expect(screen.getByText(/00:00-00:00/)).toBeInTheDocument();
  });

  it("out-of-order source timestamps are not re-sorted; the best-window scan runs over array order, not chronological order", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [
        { hour: 9, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }, // appears first in the array
        { hour: 0, wind: 20, gust: 8, rain: 0, pop: 10, code: 1 }, // appears second, but is clock-earlier
        { hour: 3, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 },
      ])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("badgeGood").length).toBe(2));
    // array order is [09:00(good), 00:00(rough), 03:00(good)]; best run is
    // the single-length run starting at array index 0 (09:00), since the
    // 00:00 entry breaks it immediately after — not a continuous 00-09 run.
    expect(screen.getByText(/09:00-09:00/)).toBeInTheDocument();
  });

  it("only this day's own date-prefixed rows are included; an adjacent day's hours in the same payload are filtered out", async () => {
    const payload = hourly("2026-10-28", [{ hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }]);
    // splice in an hour from the next day, same payload
    payload.hourly.time.push("2026-10-29T00:00");
    payload.hourly.weathercode.push(1);
    payload.hourly.temperature_2m.push(5);
    payload.hourly.windspeed_10m.push(99);
    payload.hourly.windgusts_10m.push(99);
    payload.hourly.precipitation.push(0);
    payload.hourly.precipitation_probability.push(10);
    getForecast.mockResolvedValue(payload);
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("badgeGood").length).toBe(1));
  });
});

describe("#464 J5 — formatHourLabel midnight rendering (real Intl.DateTimeFormat via the real component, not a model)", () => {
  it("renders the midnight hour label under en (en-GB, hour12:false) and records the exact engine output", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [{ hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("badgeGood")).toBeInTheDocument());
    const label = document.querySelector(".text-4xl")?.textContent;
    // Recorded (not asserted as "the only possible" value) so the report can
    // quote the exact string this Node/ICU build actually produced.
    console.log("MIDNIGHT_LABEL_EN=", JSON.stringify(label));
    expect(label).toBeTruthy();
  });

  it("renders the midnight hour label under is (is-IS, hour12:false) and records the exact engine output", async () => {
    getForecast.mockResolvedValue(
      hourly("2026-10-28", [{ hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }])
    );
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="is" t={t} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("badgeGood")).toBeInTheDocument());
    const label = document.querySelector(".text-4xl")?.textContent;
    console.log("MIDNIGHT_LABEL_IS=", JSON.stringify(label));
    expect(label).toBeTruthy();
  });
});

describe("#464 contract item 2 — modal's own independent getForecast call (not the already-fetched daily data)", () => {
  it("is invoked with the site's lat/lon on open, once per (site, date) mount, regardless of what the caller's own daily rows contain", async () => {
    getForecast.mockResolvedValue(hourly("2026-10-28", [{ hour: 0, wind: 5, gust: 8, rain: 0, pop: 10, code: 1 }]));
    render(<HourlyForecastModal site={site} day={{ date: "2026-10-28" }} lang="en" t={t} onClose={() => {}} />);
    await waitFor(() => expect(getForecast).toHaveBeenCalledTimes(1));
    expect(getForecast).toHaveBeenCalledWith({ lat: site.lat, lon: site.lon });
  });
});
