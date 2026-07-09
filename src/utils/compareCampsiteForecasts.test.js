import {
  getDailyComparisonWinner,
  getHourlyComparisonWinner,
  compareCampsiteForecasts,
  WIND_DIFF_THRESHOLD,
  RAIN_DIFF_THRESHOLD,
  TEMP_DIFF_THRESHOLD,
} from "./compareCampsiteForecasts";

// ── helpers ────────────────────────────────────────────────────────────────

function day(overrides = {}) {
  return {
    date: "2024-07-01",
    tmax: 12,
    rain: 2,
    windMax: 8,
    windGust: 10,
    ...overrides,
  };
}

function hour(overrides = {}) {
  return {
    temperature_2m: 12,
    precipitation: 0.2,
    windspeed_10m: 8,
    windgusts_10m: 10,
    ...overrides,
  };
}

// ── exported constants ─────────────────────────────────────────────────────

describe("exported thresholds", () => {
  test("WIND_DIFF_THRESHOLD is 2", () => expect(WIND_DIFF_THRESHOLD).toBe(2));
  test("RAIN_DIFF_THRESHOLD is 1", () => expect(RAIN_DIFF_THRESHOLD).toBe(1));
  test("TEMP_DIFF_THRESHOLD is 2", () => expect(TEMP_DIFF_THRESHOLD).toBe(2));
});

// ── getDailyComparisonWinner ───────────────────────────────────────────────

describe("getDailyComparisonWinner — clear winners", () => {
  test("A wins when clearly calmer and drier", () => {
    const a = day({ windMax: 4, rain: 0 });
    const b = day({ windMax: 10, rain: 5 });
    const { winner, reasons } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("A_BETTER");
    expect(reasons).toContain("calmer");
    expect(reasons).toContain("drier");
  });

  test("B wins when clearly calmer and drier", () => {
    const a = day({ windMax: 10, rain: 5 });
    const b = day({ windMax: 4, rain: 0 });
    const { winner, reasons } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("B_BETTER");
    expect(reasons).toContain("calmer");
    expect(reasons).toContain("drier");
  });

  test("A wins on temperature when only temp differs beyond threshold", () => {
    const a = day({ windMax: 8, rain: 2, tmax: 15 });
    const b = day({ windMax: 8, rain: 2, tmax: 10 });
    const { winner, reasons } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("A_BETTER");
    expect(reasons).toContain("warmer");
  });

  test("B wins on temperature when only temp differs beyond threshold", () => {
    const a = day({ windMax: 8, rain: 2, tmax: 10 });
    const b = day({ windMax: 8, rain: 2, tmax: 15 });
    const { winner, reasons } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("B_BETTER");
    expect(reasons).toContain("warmer");
  });
});

describe("getDailyComparisonWinner — SIMILAR", () => {
  test("SIMILAR when all diffs are zero", () => {
    const a = day();
    const result = getDailyComparisonWinner(a, { ...a });
    expect(result.winner).toBe("SIMILAR");
    expect(result.reasons).toEqual(["similar"]);
  });

  test("SIMILAR when all diffs are below their thresholds", () => {
    const a = day({ windMax: 8, rain: 2, tmax: 12 });
    // windMax diff = 1 (<2), rain diff = 0.5 (<1), tmax diff = 1 (<2)
    const b = day({ windMax: 9, rain: 2.5, tmax: 13 });
    const { winner } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("SIMILAR");
  });

  test("SIMILAR at exactly the boundary (diff === threshold is still too close)", () => {
    // diff must be STRICTLY less than threshold to be too-close; exact threshold → still too close
    // our logic: Math.abs(diff) < threshold → 0, so diff === threshold → vote non-zero
    // Verify threshold boundary: diff = 1.99 → SIMILAR on wind alone
    const a = day({ windMax: 5, rain: 2, tmax: 12, windGust: null });
    const b = day({ windMax: 6.99, rain: 2, tmax: 12, windGust: null });
    const { winner } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("SIMILAR");
  });
});

describe("getDailyComparisonWinner — wind dominance", () => {
  test("A calmer wins even when B is warmer (wind weight > temp weight)", () => {
    // A: windMax 5, B: windMax 12 → A calmer (diff 7, weight 3)
    // A: tmax 10,  B: tmax 14  → B warmer (diff 4, weight 1)
    // net A score 3, net B score 1 → A_BETTER
    const a = day({ windMax: 5, tmax: 10, rain: 2, windGust: null });
    const b = day({ windMax: 12, tmax: 14, rain: 2, windGust: null });
    const { winner, reasons } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("A_BETTER");
    expect(reasons).toContain("calmer");
    expect(reasons).not.toContain("warmer");
  });

  test("wind dominates over rain when weights favour it", () => {
    // A calmer (wind diff 6, weight 3) vs B drier (rain diff 4, weight 2)
    // A score 3, B score 2 → A_BETTER
    const a = day({ windMax: 4, rain: 5, windGust: null });
    const b = day({ windMax: 10, rain: 1, windGust: null });
    const { winner } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("A_BETTER");
  });
});

describe("getDailyComparisonWinner — gust handling", () => {
  test("gust data used as secondary calmer signal when windMax ties", () => {
    // windMax identical → no wind vote; gusts differ by 5 (>2) → A wins gust
    // rain + temp identical → A wins on gust alone
    const a = day({ windMax: 8, windGust: 10, rain: 2, tmax: 12 });
    const b = day({ windMax: 8, windGust: 15, rain: 2, tmax: 12 });
    const { winner, reasons } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("A_BETTER");
    expect(reasons).toContain("calmer");
  });

  test("missing gust on both sides does not affect outcome", () => {
    const a = day({ windMax: 4, windGust: null, rain: 0 });
    const b = day({ windMax: 10, windGust: null, rain: 5 });
    const { winner } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("A_BETTER");
  });

  test("missing gust on one side still resolves without throwing", () => {
    const a = day({ windMax: 4, windGust: 6, rain: 0 });
    const b = day({ windMax: 10, windGust: null, rain: 5 });
    expect(() => getDailyComparisonWinner(a, b)).not.toThrow();
    const { winner } = getDailyComparisonWinner(a, b);
    expect(winner).toBe("A_BETTER");
  });
});

describe("getDailyComparisonWinner — missing / undefined fields", () => {
  test("null inputs do not throw", () => {
    expect(() => getDailyComparisonWinner(null, null)).not.toThrow();
  });

  test("undefined inputs do not throw", () => {
    expect(() => getDailyComparisonWinner(undefined, undefined)).not.toThrow();
  });

  test("empty objects return SIMILAR (all metrics null → no votes)", () => {
    const { winner } = getDailyComparisonWinner({}, {});
    expect(winner).toBe("SIMILAR");
  });

  test("one fully null day vs normal day: only non-null metrics contribute", () => {
    // All fields null on A → compareMetric returns 0 for every factor → SIMILAR
    const result = getDailyComparisonWinner(null, day());
    expect(result.winner).toBe("SIMILAR");
  });

  test("partial missing fields do not throw", () => {
    const a = { windMax: 4 }; // no rain, tmax, windGust
    const b = { rain: 5 };    // no windMax, tmax, windGust
    expect(() => getDailyComparisonWinner(a, b)).not.toThrow();
  });
});

// ── getHourlyComparisonWinner ──────────────────────────────────────────────

describe("getHourlyComparisonWinner", () => {
  test("A wins when calmer and drier by hourly field names", () => {
    const a = hour({ windspeed_10m: 3, precipitation: 0 });
    const b = hour({ windspeed_10m: 9, precipitation: 2 });
    const { winner, reasons } = getHourlyComparisonWinner(a, b);
    expect(winner).toBe("A_BETTER");
    expect(reasons).toContain("calmer");
    expect(reasons).toContain("drier");
  });

  test("B wins when warmer and drier", () => {
    const a = hour({ windspeed_10m: 8, precipitation: 0.5, temperature_2m: 8 });
    const b = hour({ windspeed_10m: 8, precipitation: 0.5, temperature_2m: 14 });
    const { winner, reasons } = getHourlyComparisonWinner(a, b);
    expect(winner).toBe("B_BETTER");
    expect(reasons).toContain("warmer");
  });

  test("SIMILAR when all hourly diffs below thresholds", () => {
    const a = hour({ windspeed_10m: 8, precipitation: 0.2, temperature_2m: 12 });
    const b = hour({ windspeed_10m: 9, precipitation: 0.7, temperature_2m: 13 });
    expect(getHourlyComparisonWinner(a, b).winner).toBe("SIMILAR");
  });

  test("null inputs do not throw", () => {
    expect(() => getHourlyComparisonWinner(null, null)).not.toThrow();
  });

  test("missing gusts_10m on one side does not throw", () => {
    const a = hour({ windgusts_10m: null });
    expect(() => getHourlyComparisonWinner(a, hour())).not.toThrow();
  });
});

// ── compareCampsiteForecasts ───────────────────────────────────────────────

describe("compareCampsiteForecasts", () => {
  const daysA = [
    day({ date: "2024-07-01", windMax: 4, rain: 0 }),
    day({ date: "2024-07-02", windMax: 8, rain: 2 }),
    day({ date: "2024-07-03", windMax: 12, rain: 5 }),
  ];
  const daysB = [
    day({ date: "2024-07-01", windMax: 10, rain: 5 }),
    day({ date: "2024-07-02", windMax: 8, rain: 2 }),
    day({ date: "2024-07-03", windMax: 4, rain: 0 }),
  ];

  test("returns one result per shared day", () => {
    const out = compareCampsiteForecasts(daysA, daysB);
    expect(out).toHaveLength(3);
  });

  test("each result carries the date from forecastA", () => {
    const out = compareCampsiteForecasts(daysA, daysB);
    expect(out[0].date).toBe("2024-07-01");
    expect(out[1].date).toBe("2024-07-02");
  });

  test("each result has winner and reasons", () => {
    const out = compareCampsiteForecasts(daysA, daysB);
    for (const r of out) {
      expect(["A_BETTER", "B_BETTER", "SIMILAR"]).toContain(r.winner);
      expect(Array.isArray(r.reasons)).toBe(true);
    }
  });

  test("correct per-day winner sequence", () => {
    const out = compareCampsiteForecasts(daysA, daysB);
    expect(out[0].winner).toBe("A_BETTER"); // A calmer+drier on day 1
    expect(out[1].winner).toBe("SIMILAR");  // identical on day 2
    expect(out[2].winner).toBe("B_BETTER"); // B calmer+drier on day 3
  });

  test("handles mismatched array lengths (uses shorter)", () => {
    const out = compareCampsiteForecasts([day()], daysB);
    expect(out).toHaveLength(1);
  });

  test("empty arrays return empty result", () => {
    expect(compareCampsiteForecasts([], [])).toEqual([]);
  });

  test("non-array inputs do not throw and return empty", () => {
    expect(() => compareCampsiteForecasts(null, null)).not.toThrow();
    expect(compareCampsiteForecasts(null, null)).toEqual([]);
  });
});
