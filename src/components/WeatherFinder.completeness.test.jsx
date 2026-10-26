// Ticket #444 — WeatherFinder's "warmest" completeness wiring: the
// completeness metadata passed to each card must come from the SAME
// sites/options.days used for ranking, keyed by stable site id (never by
// position — rankWarmest's own output drops forecast rows, so the card
// cannot infer coverage from `result` alone). This also pins J7's required
// retained limitation: the real, unchanged rankWarmest/UI order still uses
// the old zero-coerced mean for incomplete sites — RC-08's A-before-B
// inversion must still reproduce end-to-end through the real component.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WeatherFinder from "./WeatherFinder";
import { rankWarmest } from "../lib/weatherFinderRanking";
import { translations } from "../i18n/translations";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

const t = (k) => translations.en[k] ?? k;
const proEntitlements = { isPro: true };

function day(tmax) {
  return { tmax, tmin: 5, windMax: 0, windGust: 0, rain: 0, hasHazard: false };
}

function renderFinder({ siteList, scoresById, entitlements = proEntitlements, units = "metric" }) {
  render(
    <WeatherFinder
      siteList={siteList}
      scoresById={scoresById}
      userLoc={null}
      entitlements={entitlements}
      units={units}
      t={t}
      onUpgrade={vi.fn()}
      onSelectSite={vi.fn()}
    />
  );
  fireEvent.click(screen.getByText(t("weatherFinderShowDetailsCta")));
  fireEvent.click(screen.getByText(t("weatherFinderWarmest")));
}

function visibleNamesInOrder() {
  return screen
    .getAllByRole("button")
    .map((b) => b.textContent)
    .filter((text) => /^Site [AB0-9]/.test(text))
    .map((text) => text.replace(/→$/, "").trim());
}

beforeEach(() => vi.clearAllMocks());

describe("WeatherFinder — warmest completeness, Pro 3->5->7 window switch", () => {
  const siteList = [{ id: "s1", name: "Site 1", lat: 64, lon: -20 }];
  // 7 full, valid days — complete at every window size 3/5/7.
  const scoresById = { s1: { rows: Array.from({ length: 7 }, () => day(12)) } };

  it("days=3 (default): complete, period line says 3", () => {
    renderFinder({ siteList, scoresById });
    expect(screen.getByText(/12\.0°C — Average daily high/)).toBeInTheDocument();
    expect(screen.getByText("First 3 forecast days, including today")).toBeInTheDocument();
  });

  it("switching to 5d: still complete, period line updates to 5", () => {
    renderFinder({ siteList, scoresById });
    fireEvent.click(screen.getByText("5d"));
    expect(screen.getByText("First 5 forecast days, including today")).toBeInTheDocument();
  });

  it("switching to 7d: still complete, period line updates to 7", () => {
    renderFinder({ siteList, scoresById });
    fireEvent.click(screen.getByText("7d"));
    expect(screen.getByText("First 7 forecast days, including today")).toBeInTheDocument();
  });

  it("Free (forced to 3 regardless of any days state): complete, period line says 3", () => {
    renderFinder({ siteList, scoresById, entitlements: { isPro: false } });
    expect(screen.getByText("First 3 forecast days, including today")).toBeInTheDocument();
  });
});

describe("WeatherFinder — warmest completeness keyed by stable site id, not position", () => {
  // Site A's 7-day window has a hole at index 1 (incomplete at days>=2);
  // Site B is fully valid. rankWarmest's own 0-coercion policy still makes
  // A's avgTemp 0-pulled toward B's in the UNCHANGED engine — but the
  // DISPLAY must show "Insufficient data" for A regardless of where A
  // lands in the sorted list.
  const siteList = [
    { id: "a", name: "Site A", lat: 64, lon: -20 },
    { id: "b", name: "Site B", lat: 64.2, lon: -20.2 },
  ];
  const scoresById = {
    a: { rows: [day(10), day(null), day(10), day(10), day(10), day(10), day(10)] },
    b: { rows: Array.from({ length: 7 }, () => day(8)) },
  };

  it("days=3: A is incomplete (its hole is inside the 3-day window), B is complete", () => {
    renderFinder({ siteList, scoresById });
    const aRow = screen.getByText("Site A").closest("div").parentElement;
    expect(aRow.textContent).toContain("Insufficient data");
    const bRow = screen.getByText("Site B").closest("div").parentElement;
    expect(bRow.textContent).toMatch(/8\.0°C — Average daily high/);
  });

  it("switching to days=7 keeps A incomplete (the hole is still inside the larger window) and B complete — re-keyed by id, not by rank position", () => {
    renderFinder({ siteList, scoresById });
    fireEvent.click(screen.getByText("7d"));
    const aRow = screen.getByText("Site A").closest("div").parentElement;
    expect(aRow.textContent).toContain("Insufficient data");
    const bRow = screen.getByText("Site B").closest("div").parentElement;
    expect(bRow.textContent).toMatch(/8\.0°C — Average daily high/);
  });
});

describe("WeatherFinder — RC-08 parity: real UI order must match direct real rankWarmest (J7)", () => {
  // A[10,null,10] vs B[8,8,8], no rain/wind — the same hypothetical fixture
  // from reference-cases.md RC-08. The retained zero-coercion bug makes the
  // real engine rank B ahead of A; this ticket's display fix must NOT
  // change that order — it only changes A's own card text to "Insufficient
  // data" instead of a fabricated number.
  const siteList = [
    { id: "a", name: "Site A", lat: 64, lon: -20 },
    { id: "b", name: "Site B", lat: 64.2, lon: -20.2 },
  ];
  const forecastA = [day(10), day(null), day(10)];
  const forecastB = [day(8), day(8), day(8)];
  const scoresById = { a: { rows: forecastA }, b: { rows: forecastB } };

  it("direct rankWarmest (sanity, re-executed here, not assumed): B ranks ahead of A", () => {
    const sites = [
      { id: "a", name: "Site A", distanceKm: 0, forecast: forecastA },
      { id: "b", name: "Site B", distanceKm: 0, forecast: forecastB },
    ];
    const ranked = rankWarmest(sites, { days: 3 });
    expect(ranked.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("the real rendered UI preserves that exact order: Site B before Site A", () => {
    renderFinder({ siteList, scoresById });
    const order = visibleNamesInOrder();
    expect(order.indexOf("Site B")).toBeLessThan(order.indexOf("Site A"));
  });

  it("Site A's card shows 'Insufficient data' (display fix) while still ranked second (ranking fix is out of #444's scope)", () => {
    renderFinder({ siteList, scoresById });
    const aRow = screen.getByText("Site A").closest("div").parentElement;
    expect(aRow.textContent).toContain("Insufficient data");
  });

  it("negative and zero tmax values remain valid/complete, not treated as missing", () => {
    const siteListNeg = [{ id: "c", name: "Site C", lat: 64, lon: -20 }];
    const scoresByIdNeg = { c: { rows: [day(0), day(-5), day(2)] } };
    renderFinder({ siteList: siteListNeg, scoresById: scoresByIdNeg });
    expect(screen.getByText(/-1\.0°C — Average daily high/)).toBeInTheDocument();
  });
});

// Correction v4, R2 — "a real-parent imperial integration case proving
// complete Fahrenheit display and no numeric fallback in the incomplete
// card." Through the real WeatherFinder parent (not the card in isolation).
describe("WeatherFinder — imperial units, real parent integration (#444 correction v4 R2)", () => {
  const siteList = [
    { id: "a", name: "Site A", lat: 64, lon: -20 },
    { id: "b", name: "Site B", lat: 64.2, lon: -20.2 },
  ];
  // A: complete, 18°C -> (18*9/5+32) = 64.4 -> toFixed(0) = "64°F".
  // B: incomplete (a hole inside the 3-day window).
  const scoresById = {
    a: { rows: Array.from({ length: 7 }, () => day(18)) },
    b: { rows: [day(10), day(null), day(10), day(10), day(10), day(10), day(10)] },
  };

  it("complete site: real Fahrenheit conversion of the real engine avgTemp, through the real parent", () => {
    renderFinder({ siteList, scoresById, units: "imperial" });
    expect(screen.getByText(/64°F — Average daily high/)).toBeInTheDocument();
  });

  it("incomplete site: 'Insufficient data' in imperial mode too — never a Fahrenheit number, never a 0°F fallback", () => {
    renderFinder({ siteList, scoresById, units: "imperial" });
    expect(screen.getByText("Insufficient data")).toBeInTheDocument();
    const finderPanel = document.getElementById("weather-finder-panel");
    expect(finderPanel.textContent).not.toMatch(/0°F/);
  });
});
