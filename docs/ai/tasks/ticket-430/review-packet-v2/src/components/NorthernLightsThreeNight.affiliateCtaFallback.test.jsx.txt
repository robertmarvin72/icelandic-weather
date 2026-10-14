// Ticket #430 — C1: "Add a test for selectedDate outside the slot window
// falling back to slots[0]." Isolated in its own file because mocking
// useAuroraThreeNight is file-scoped in Vitest and must not affect the
// real-hook tests in NorthernLightsThreeNight.affiliateCta.test.jsx.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import NorthernLightsThreeNight from "./NorthernLightsThreeNight";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./NorthernLightsMap", () => ({ default: () => <div data-testid="nl-map-container" /> }));
vi.mock("../hooks/useAuroraThreeNight", () => ({ useAuroraThreeNight: vi.fn() }));

import { useAuroraThreeNight } from "../hooks/useAuroraThreeNight";

const t = (k) => k;
const IN_SEASON_NOW = () => new Date("2026-09-25T20:00:00.000Z");

function loc(id, score, band) {
  return { locationId: id, name: id, lat: 64, lon: -20, score, band, reasons: ["meaningful_activity", "clear_sky"], flags: [] };
}

function successBody(evening, entries) {
  const [best, ...alternatives] = entries;
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-25T18:00:00.000Z", ageMinutes: 10 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best,
    alternatives,
    excluded: [],
    warnings: [],
  };
}

beforeEach(() => vi.clearAllMocks());

describe("NorthernLightsThreeNight — selectedDate outside the slot window falls back to slots[0] (C1)", () => {
  it("affiliate CTA uses slots[0] (2026-09-25) when the hook's selectedDate matches no slot", async () => {
    const slots = [
      {
        date: "2026-09-25",
        daysAhead: 0,
        status: "resolved",
        classification: { primary: "success", freshness: "fresh", body: successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 70, "good")]) },
        retry: vi.fn(),
        requestKey: "k0",
      },
      {
        date: "2026-09-26",
        daysAhead: 1,
        status: "resolved",
        classification: { primary: "domain_unavailable", freshness: null, body: null },
        retry: vi.fn(),
        requestKey: "k1",
      },
      {
        date: "2026-09-27",
        daysAhead: 2,
        status: "resolved",
        classification: { primary: "domain_unavailable", freshness: null, body: null },
        retry: vi.fn(),
        requestKey: "k2",
      },
    ];
    useAuroraThreeNight.mockReturnValue({
      slots,
      selectedDate: "2099-01-01", // deliberately outside the window
      setSelectedDate: vi.fn(),
      nowMs: IN_SEASON_NOW().getTime(),
    });

    render(<NorthernLightsThreeNight t={t} lang="en" entitlements={{ isPro: false }} theme="light" now={IN_SEASON_NOW} loadingMe={false} />);

    // selectedSlot fell back to slots[0] (2026-09-25), which is usable -> CTA renders.
    await waitFor(() => expect(screen.getByTestId("affiliate-nl-cta")).toBeInTheDocument());
  });

  it("no slot is usable: CTA absent even with a mismatched selectedDate", async () => {
    const slots = [
      { date: "2026-09-25", daysAhead: 0, status: "resolved", classification: { primary: "domain_unavailable", freshness: null, body: null }, retry: vi.fn(), requestKey: "k0" },
      { date: "2026-09-26", daysAhead: 1, status: "resolved", classification: { primary: "domain_unavailable", freshness: null, body: null }, retry: vi.fn(), requestKey: "k1" },
      { date: "2026-09-27", daysAhead: 2, status: "resolved", classification: { primary: "domain_unavailable", freshness: null, body: null }, retry: vi.fn(), requestKey: "k2" },
    ];
    useAuroraThreeNight.mockReturnValue({
      slots,
      selectedDate: "2099-01-01",
      setSelectedDate: vi.fn(),
      nowMs: IN_SEASON_NOW().getTime(),
    });

    render(<NorthernLightsThreeNight t={t} lang="en" entitlements={{ isPro: false }} theme="light" now={IN_SEASON_NOW} loadingMe={false} />);

    await waitFor(() => expect(screen.getByTestId("nl3-module")).toBeInTheDocument());
    expect(screen.queryByTestId("affiliate-nl-cta")).toBeNull();
  });
});
