// Ticket #428 — leaderboard consumer verification, through the REAL
// useLeaderboardScores hook and its internal (unexported) computeScoreFromData,
// which calls the real scoreSiteDay() directly on raw daily.* fields (no
// forecastNormalize step on this path — confirmed during this ticket's
// audit). Only getForecast is mocked; the scorer itself is never mocked,
// per this ticket's explicit "real scorer, not a mocked scorer" requirement.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLeaderboardScores } from "./useLeaderboardScores";

vi.mock("../lib/forecastCache", () => ({ getForecast: vi.fn() }));
import { getForecast } from "../lib/forecastCache";

function dailyFixture(rain) {
  return {
    daily: {
      time: ["2026-07-15"],
      temperature_2m_max: [12],
      temperature_2m_min: [6],
      precipitation_sum: [rain],
      windspeed_10m_max: [8],
      windgusts_10m_max: [8], // gustiness 0 -> gustPen 0, isolates wind/rain only
      weathercode: [null],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("useLeaderboardScores — wind component unaffected by rain, real scoreSiteDay (Ticket #428)", () => {
  it("dry site (rain=0) and wet site (rain=4mm), same wind: the leaderboard score reflects ONLY the rain delta, not a wind regression", async () => {
    // Hand-derived expectation (tmax=12 => basePts=8; windMax=8,summer =>
    // windPen=1; rain=0 => rainPen=0; rain=4 => rainPen=5):
    //   dry:  8 - 1 - 0 = 7 points
    //   wet:  8 - 1 - 5 = 2 points
    // If windPen were coupled to rain (issue #428's alleged
    // windPen*precipTimingMultiplier), rain=0 would zero out the wind
    // penalty too and the dry site would score 8, not 7 — this test would
    // fail with a visibly wrong number, not silently pass.
    getForecast.mockResolvedValueOnce(dailyFixture(0));
    const dry = renderHook(() => useLeaderboardScores([{ id: "dry-site", lat: 64, lon: -21 }], "dry-site", null));
    await waitFor(() => expect(dry.result.current.scoresById["dry-site"]).toBeTruthy());
    expect(dry.result.current.scoresById["dry-site"].rows[0].points).toBe(7);
    expect(dry.result.current.scoresById["dry-site"].score).toBe(7);

    getForecast.mockResolvedValueOnce(dailyFixture(4));
    const wet = renderHook(() => useLeaderboardScores([{ id: "wet-site", lat: 64, lon: -21 }], "wet-site", null));
    await waitFor(() => expect(wet.result.current.scoresById["wet-site"]).toBeTruthy());
    expect(wet.result.current.scoresById["wet-site"].rows[0].points).toBe(2);
    expect(wet.result.current.scoresById["wet-site"].score).toBe(2);

    // The full delta (5) is attributable to rain alone.
    const dryPoints = dry.result.current.scoresById["dry-site"].rows[0].points;
    const wetPoints = wet.result.current.scoresById["wet-site"].rows[0].points;
    expect(dryPoints - wetPoints).toBe(5);
  });
});
