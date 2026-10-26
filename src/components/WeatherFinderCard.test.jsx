// Ticket #444 — WeatherFinderCard's "warmest" mode had no dedicated test
// file before this ticket. The old metric (a single number, labelled
// "avg temp"/"meðalhiti") is replaced with a completeness-gated display:
// complete window -> the existing engine value + an honest label + a
// stated period; incomplete window -> "Insufficient data"/"Ófullnægjandi
// gögn", never a number. calmest/driest modes are untouched (asserted
// below using the exact pre-existing rendered text).
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WeatherFinderCard from "./WeatherFinderCard";
import { translations } from "../i18n/translations";

function baseResult(overrides = {}) {
  return {
    id: "site-7",
    name: "Þingvellir",
    metrics: { avgWind: 3.4, avgTemp: 12.1, rainDays: 1 },
    ...overrides,
  };
}

describe("WeatherFinderCard — warmest mode, complete window (EN)", () => {
  const t = (k) => translations.en[k] ?? k;

  it("shows the engine's unchanged avgTemp value with the honest label, plus the period line", () => {
    render(
      <WeatherFinderCard
        result={baseResult()}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
        completeness={{ complete: true, windowLength: 3 }}
      />
    );
    expect(screen.getByText(/12\.1°C — Average daily high/)).toBeInTheDocument();
    expect(screen.getByText("First 3 forecast days, including today")).toBeInTheDocument();
    expect(screen.queryByText("Insufficient data")).toBeNull();
  });

  it("imperial mode still converts the same real value (unchanged conversion formula)", () => {
    render(
      <WeatherFinderCard
        result={baseResult()}
        rank={1}
        mode="warmest"
        units="imperial"
        t={t}
        completeness={{ complete: true, windowLength: 5 }}
      />
    );
    expect(screen.getByText(/54°F — Average daily high/)).toBeInTheDocument();
    expect(screen.getByText("First 5 forecast days, including today")).toBeInTheDocument();
  });
});

describe("WeatherFinderCard — warmest mode, incomplete window (EN)", () => {
  const t = (k) => translations.en[k] ?? k;

  it("shows 'Insufficient data', never the 0-coerced engine avgTemp", () => {
    render(
      <WeatherFinderCard
        result={baseResult({ metrics: { avgWind: 3.4, avgTemp: 0, rainDays: 1 } })}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
        completeness={{ complete: false, windowLength: 3 }}
      />
    );
    expect(screen.getByText("Insufficient data")).toBeInTheDocument();
    expect(screen.queryByText(/°C/)).toBeNull();
    expect(screen.getByText("First 3 forecast days, including today")).toBeInTheDocument();
  });

  it("absent completeness prop fails closed to incomplete (J4) — never reads result.metrics.avgTemp at all", () => {
    render(
      <WeatherFinderCard
        result={baseResult({ metrics: { avgWind: 3.4, avgTemp: 99, rainDays: 1 } })}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
      />
    );
    expect(screen.getByText("Insufficient data")).toBeInTheDocument();
    expect(screen.queryByText(/99/)).toBeNull();
  });

  // Correction v4 (J4 compliance, Jonesy's binding correction) — v3 wrongly
  // rendered the numeric value here. `complete: true` with no valid
  // `windowLength` is itself malformed metadata (a number with no period
  // we can honestly state) and must fail closed to "Insufficient data",
  // same as fully-absent metadata — never the engine's avgTemp.
  it("malformed completeness (complete true but no valid windowLength) fails closed to Insufficient data, never a number", () => {
    render(
      <WeatherFinderCard
        result={baseResult({ metrics: { avgWind: 3.4, avgTemp: 12.1, rainDays: 1 } })}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
        completeness={{ complete: true, windowLength: null }}
      />
    );
    expect(screen.getByText("Insufficient data")).toBeInTheDocument();
    expect(screen.queryByText(/12\.1/)).toBeNull();
    expect(screen.queryByText(/forecast days/)).toBeNull();
  });

  it("malformed completeness (a truthy but non-boolean-true complete flag) fails closed to Insufficient data", () => {
    render(
      <WeatherFinderCard
        result={baseResult({ metrics: { avgWind: 3.4, avgTemp: 12.1, rainDays: 1 } })}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
        completeness={{ complete: "yes", windowLength: 3 }}
      />
    );
    expect(screen.getByText("Insufficient data")).toBeInTheDocument();
    expect(screen.queryByText(/12\.1/)).toBeNull();
    // windowLength itself is still valid here, so the period line IS shown
    // (only the numeric value is gated on complete === true specifically).
    expect(screen.getByText("First 3 forecast days, including today")).toBeInTheDocument();
  });

  it("windowLength present but non-integer (e.g. 3.5) is itself invalid -> Insufficient data, no period line, even with complete: true", () => {
    render(
      <WeatherFinderCard
        result={baseResult({ metrics: { avgWind: 3.4, avgTemp: 12.1, rainDays: 1 } })}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
        completeness={{ complete: true, windowLength: 3.5 }}
      />
    );
    expect(screen.getByText("Insufficient data")).toBeInTheDocument();
    expect(screen.queryByText(/forecast days/)).toBeNull();
  });

  it("incomplete with a valid windowLength still shows the period line (states the attempted window honestly)", () => {
    render(
      <WeatherFinderCard
        result={baseResult()}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
        completeness={{ complete: false, windowLength: 7 }}
      />
    );
    expect(screen.getByText("Insufficient data")).toBeInTheDocument();
    expect(screen.getByText("First 7 forecast days, including today")).toBeInTheDocument();
  });
});

describe("WeatherFinderCard — warmest mode (IS)", () => {
  const t = (k) => translations.is[k] ?? k;

  it("complete window: Icelandic label and period line", () => {
    render(
      <WeatherFinderCard
        result={baseResult()}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
        completeness={{ complete: true, windowLength: 3 }}
      />
    );
    expect(screen.getByText(/12\.1°C — Meðaltal hámarkshita/)).toBeInTheDocument();
    expect(screen.getByText("Fyrstu 3 spádagar, dagurinn í dag meðtalinn")).toBeInTheDocument();
  });

  it("incomplete window: 'Ófullnægjandi gögn', never a number", () => {
    render(
      <WeatherFinderCard
        result={baseResult()}
        rank={1}
        mode="warmest"
        units="metric"
        t={t}
        completeness={{ complete: false, windowLength: 3 }}
      />
    );
    expect(screen.getByText("Ófullnægjandi gögn")).toBeInTheDocument();
  });
});

describe("WeatherFinderCard — calmest/driest modes are unaffected by the #444 change", () => {
  const t = (k) => translations.en[k] ?? k;

  it("calmest: exact pre-existing rendered text, no period line, regardless of a completeness prop being passed", () => {
    render(
      <WeatherFinderCard
        result={baseResult()}
        rank={1}
        mode="calmest"
        units="metric"
        t={t}
        completeness={{ complete: false, windowLength: 3 }}
      />
    );
    expect(screen.getByText(/3\.4 m\/s avg wind/)).toBeInTheDocument();
    expect(screen.queryByText(/forecast days/)).toBeNull();
    expect(screen.queryByText("Insufficient data")).toBeNull();
  });

  it("driest: exact pre-existing rendered text, unaffected", () => {
    render(
      <WeatherFinderCard
        result={baseResult({ metrics: { avgWind: 3.4, avgTemp: 12.1, rainDays: 2 } })}
        rank={1}
        mode="driest"
        units="metric"
        t={t}
      />
    );
    expect(screen.getByText(/2 rain days/)).toBeInTheDocument();
  });
});
