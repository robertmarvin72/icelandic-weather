// src/lib/relocationEngine.badDayVeto.test.js
import { describe, it, expect } from "vitest";
import { getCandidateHazardBlocker } from "./relocationEngine";

describe("getCandidateHazardBlocker - bad score veto", () => {
  it("triggers consider veto when candidate has a worse bad-score day than base on the same date", () => {
    const windowDays = [
      {
        date: "2026-03-20",
        points: 1.5,
        baseSitePoints: 4.4,
        warnings: [],
        baseSiteWarnings: [],
      },
    ];

    const result = getCandidateHazardBlocker(windowDays, 4.5);

    expect(result.triggered).toBe(true);
    expect(result.blockerMode).toBe("consider");
    expect(result.candidateHasBadScoreDay).toBe(true);
    expect(result.baseHasSameOrWorseBadScoreSameDay).toBe(false);
    expect(result.candidateOnlyBadScoreDay).toBe(true);
  });

  it("does not trigger bad-score veto when base is equally bad or worse on the same day", () => {
    const windowDays = [
      {
        date: "2026-03-20",
        points: 4.2,
        baseSitePoints: 3.8,
        warnings: [],
        baseSiteWarnings: [],
      },
    ];

    const result = getCandidateHazardBlocker(windowDays, 4.5);

    expect(result.candidateHasBadScoreDay).toBe(true);
    expect(result.baseHasSameOrWorseBadScoreSameDay).toBe(true);
    expect(result.candidateOnlyBadScoreDay).toBe(false);
    expect(result.triggered).toBe(false);
    expect(result.blockerMode).toBe(null);
  });
});
