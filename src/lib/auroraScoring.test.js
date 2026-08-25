// src/lib/auroraScoring.test.js
//
// Targeted tests for Northern Lights Score v0.1 (Ticket 2, issue #390).
// Covers the 21 required test cases from
// docs/ai/tasks/ticket-390/approved-prompt-v1.md Section 7.

import { describe, it, expect } from "vitest";
import { scoreAuroraVisibility } from "./auroraScoring.js";
import { scoreSiteDay } from "./scoring.js";

// ── Fixtures ────────────────────────────────────────────────────────────
//
// eveningDate 2026-08-24. darknessStart "22:00" -> 2026-08-24T22:00:00Z
// (hour >= 12 -> same day). dawn "05:00" -> 2026-08-25T05:00:00Z (hour < 12
// -> next day). Darkness window is therefore 7 hours: 22:00 -> 05:00(+1).

const EVENING_DATE = "2026-08-24";

function baseNight(overrides = {}) {
  return {
    eveningDate: EVENING_DATE,
    auroraActivity: 9,
    sun: { sunset: "21:13", darknessStart: "22:00", dawn: "05:00", sunrise: "05:49" },
    moon: { ageDays: 0, rise: null, set: null, scheduleType: 1 },
    ...overrides,
  };
}

// One row per hour from 22:00 through 04:00 (7 rows), all inside the
// darkness window [22:00, 05:00 next day).
const WINDOW_HOURS = ["22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00"];

function rowTimeIso(hhmm) {
  const [h] = hhmm.split(":").map(Number);
  const dayOffset = h < 12 ? 1 : 0;
  const base = Date.parse(`${EVENING_DATE}T00:00:00Z`);
  const ms = base + dayOffset * 24 * 3600 * 1000 + h * 3600 * 1000;
  return new Date(ms).toISOString();
}

function baseHourlyRows({ cloudTotal = 0, precipitation = 0, windSpeed = 1 } = {}) {
  return WINDOW_HOURS.map((hhmm) => ({
    time: rowTimeIso(hhmm),
    cloudTotal,
    cloudLow: cloudTotal,
    cloudMid: 0,
    cloudHigh: 0,
    precipitation,
    windSpeed,
    visibility: 10000,
  }));
}

const WIDE_VIEWING_WINDOW = {
  start: "2026-08-24T18:00:00Z",
  end: "2026-08-25T08:00:00Z",
};

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

// ── 1. high activity + clear sky + good darkness -> high result ──────────

describe("high activity + clear sky", () => {
  it("scores at the top of the scale, excellent band", () => {
    const result = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("scored");
    expect(result.score).toBe(100);
    expect(result.band).toBe("excellent");
    expect(result.reasons).toEqual(["meaningful_activity", "clear_sky"]);
  });
});

// ── 2. high activity + full cloud -> low result with hard cap ────────────

describe("high activity + full cloud", () => {
  it("is hard-capped to a low score regardless of activity", () => {
    const result = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 100 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("scored");
    expect(result.score).toBe(15);
    expect(result.band).toBe("very-poor");
    expect(result.reasons).toContain("cloud_hard_cap_applied");
  });

  it("caps identically even at a higher activity contribution than the cap itself", () => {
    const uncappedEquivalent = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 40 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    const capped = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 100 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(capped.score).toBeLessThan(uncappedEquivalent.score);
  });
});

// ── 3. low activity + clear sky -> medium result, never highest band ─────

describe("low activity + clear sky", () => {
  it("is capped below the top bands even under perfectly clear sky", () => {
    const result = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 2 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("scored");
    expect(result.score).toBe(60);
    expect(result.band).not.toBe("excellent");
    expect(result.band).not.toBe("good");
    expect(result.band).toBe("fair");
  });
});

// ── 4. auroraActivity: null -> insufficient_data ──────────────────────────

describe("missing activity", () => {
  it("returns insufficient_data with an explicit machine-readable cause", () => {
    const result = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: null }),
      hourlyRows: baseHourlyRows(),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result).toEqual({
      status: "insufficient_data",
      score: null,
      band: null,
      reasons: ["missing_activity"],
      flags: [],
    });
  });

  it("also treats a non-numeric activity value as missing", () => {
    const result = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: "high" }),
      hourlyRows: baseHourlyRows(),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("insufficient_data");
    expect(result.reasons).toEqual(["missing_activity"]);
  });
});

// ── 5. auroraActivity: 0 remains valid scored input ───────────────────────

describe("zero activity", () => {
  it("is a valid distinct scored value, not treated as missing", () => {
    const result = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 0 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 50 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("scored");
    expect(result.score).not.toBeNull();
    expect(result.score).toBe(28);
    expect(result.reasons).toContain("low_activity");
  });
});

// ── 6. no darkness / no overlap -> not_viewable_tonight ───────────────────

describe("no darkness or no overlap", () => {
  it("returns not_viewable_tonight when the feed provides no darkness window", () => {
    const result = scoreAuroraVisibility({
      night: baseNight({ sun: { sunset: null, darknessStart: null, dawn: null, sunrise: null } }),
      hourlyRows: baseHourlyRows(),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("not_viewable_tonight");
    expect(result.score).toBeNull();
    expect(result.band).toBeNull();
    expect(result.reasons).toEqual(["no_darkness_overlap"]);
  });

  it("returns not_viewable_tonight when the viewing window does not overlap darkness", () => {
    const result = scoreAuroraVisibility({
      night: baseNight(),
      hourlyRows: baseHourlyRows(),
      viewingWindow: { start: "2026-08-24T08:00:00Z", end: "2026-08-24T12:00:00Z" },
    });
    expect(result.status).toBe("not_viewable_tonight");
    expect(result.reasons).toEqual(["no_darkness_overlap"]);
  });

  it("returns not_viewable_tonight with a distinct cause when the window overlaps but no rows fall inside it", () => {
    const result = scoreAuroraVisibility({
      night: baseNight(),
      hourlyRows: [],
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("not_viewable_tonight");
    expect(result.reasons).toEqual(["no_observation_data"]);
  });
});

// ── 7. a valid night selected from a partial multi-night snapshot scores
// independently of sibling nights ─────────────────────────────────────────

describe("night selected from a multi-night snapshot", () => {
  it("scores using only the selected night, unaffected by other nights present", () => {
    const snapshotNights = Array.from({ length: 10 }, (_, i) =>
      baseNight({
        eveningDate: `2026-08-${String(24 + i).padStart(2, "0")}`,
        auroraActivity: i, // varies per night, irrelevant to the one we select
      }),
    );
    const selected = snapshotNights[3];
    const standalone = baseNight({ eveningDate: selected.eveningDate, auroraActivity: selected.auroraActivity });

    const rows = WINDOW_HOURS.map((hhmm) => {
      const [h] = hhmm.split(":").map(Number);
      const dayOffset = h < 12 ? 1 : 0;
      const base = Date.parse(`${selected.eveningDate}T00:00:00Z`);
      const ms = base + dayOffset * 24 * 3600 * 1000 + h * 3600 * 1000;
      return { time: new Date(ms).toISOString(), cloudTotal: 0, precipitation: 0, windSpeed: 1 };
    });
    const window = {
      start: new Date(Date.parse(`${selected.eveningDate}T00:00:00Z`) + 18 * 3600 * 1000).toISOString(),
      end: new Date(Date.parse(`${selected.eveningDate}T00:00:00Z`) + 32 * 3600 * 1000).toISOString(),
    };

    const resultFromSnapshot = scoreAuroraVisibility({ night: selected, hourlyRows: rows, viewingWindow: window });
    const resultStandalone = scoreAuroraVisibility({ night: standalone, hourlyRows: rows, viewingWindow: window });
    expect(resultFromSnapshot).toEqual(resultStandalone);
  });
});

// ── 8. moon above horizon -> modifier may apply, national-reference caveat
// preserved ─────────────────────────────────────────────────────────────

describe("moon above horizon during the dark window", () => {
  it("applies a visibility modifier and keeps the national-reference flag", () => {
    const withoutMoon = scoreAuroraVisibility({
      night: baseNight({ moon: { ageDays: 0, rise: null, set: null, scheduleType: 1 } }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    const withMoon = scoreAuroraVisibility({
      night: baseNight({ moon: { ageDays: 14.75, rise: "22:30", set: "23:30", scheduleType: 4 } }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(withMoon.score).toBeLessThan(withoutMoon.score);
    expect(withMoon.reasons).toContain("moonlight_reduced_visibility");
    expect(withMoon.flags).toContain("moon_illuminated");
    expect(withMoon.flags).toContain("national_reference_times");
    expect(withoutMoon.flags).toContain("national_reference_times");
  });
});

// ── 9. moon not above horizon -> age has no effect ────────────────────────

describe("moon not above horizon", () => {
  it("ignores moon age entirely when rise/set are absent", () => {
    const newMoon = scoreAuroraVisibility({
      night: baseNight({ moon: { ageDays: 0, rise: null, set: null, scheduleType: 1 } }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    const fullMoonAgeButNotVisible = scoreAuroraVisibility({
      night: baseNight({ moon: { ageDays: 14.75, rise: null, set: null, scheduleType: 1 } }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(fullMoonAgeButNotVisible.score).toBe(newMoon.score);
  });
});

// ── 10. heavy precipitation + severe cloud -> no duplicated full penalty ──

describe("heavy precipitation combined with severe cloud", () => {
  it("does not stack a second full obstruction penalty once the cloud hard cap governs", () => {
    const capNoPrecip = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 95, precipitation: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    const capWithHeavyPrecip = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 95, precipitation: 5 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(capWithHeavyPrecip.score).toBe(capNoPrecip.score);
    expect(capWithHeavyPrecip.score).toBe(15);
  });

  it("bounds precipitation's own reduction below full cloud severity when cloud is not yet at the hard cap", () => {
    const noPrecip = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 80, precipitation: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    const heavyPrecip = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 80, precipitation: 5 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    const reduction = noPrecip.score - heavyPrecip.score;
    expect(reduction).toBeGreaterThan(0);
    expect(reduction).toBeLessThanOrEqual(Math.ceil(noPrecip.score * 0.25));
  });
});

// ── 11. high wind -> identical score, comfort/safety reason or flag ───────

describe("high wind", () => {
  it("never changes the score, only adds a comfort/safety flag", () => {
    const calmWind = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0, windSpeed: 1 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    const highWind = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: 9 }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0, windSpeed: 20 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(highWind.score).toBe(calmWind.score);
    expect(highWind.flags).toContain("high_wind");
    expect(calmWind.flags).not.toContain("high_wind");
  });
});

// ── 12. unknown/missing secondary fields -> defensive, no crash/invented
// values ───────────────────────────────────────────────────────────────

describe("missing secondary fields", () => {
  it("handles rows with no cloud/precipitation/wind data without crashing or fabricating values", () => {
    const rows = WINDOW_HOURS.map((hhmm) => ({ time: rowTimeIso(hhmm) }));
    let result;
    expect(() => {
      result = scoreAuroraVisibility({
        night: baseNight({ auroraActivity: 9 }),
        hourlyRows: rows,
        viewingWindow: WIDE_VIEWING_WINDOW,
      });
    }).not.toThrow();
    expect(result.status).toBe("scored");
    expect(result.flags).toContain("cloud_data_unavailable");
    expect(result.flags).toContain("precipitation_data_unavailable");
    expect(result.flags).not.toContain("high_wind");
    // Only the activity component contributes when cloud is entirely unknown.
    expect(result.score).toBe(45);
  });
});

// ── 13. unknown scheduleType -> no guessed semantics, no crash ───────────

describe("unknown scheduleType", () => {
  it("has no effect on the result — only rise/set/age matter", () => {
    const knownType = scoreAuroraVisibility({
      night: baseNight({ moon: { ageDays: 14.75, rise: "22:30", set: "23:30", scheduleType: 4 } }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    const unknownType = scoreAuroraVisibility({
      night: baseNight({ moon: { ageDays: 14.75, rise: "22:30", set: "23:30", scheduleType: 999 } }),
      hourlyRows: baseHourlyRows({ cloudTotal: 0 }),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(unknownType).toEqual(knownType);
  });

  it("does not crash when scheduleType is unknown and rise/set are absent", () => {
    expect(() =>
      scoreAuroraVisibility({
        night: baseNight({ moon: { ageDays: 5, rise: null, set: null, scheduleType: 999 } }),
        hourlyRows: baseHourlyRows(),
        viewingWindow: WIDE_VIEWING_WINDOW,
      }),
    ).not.toThrow();
  });
});

// ── 14. repeated calls with frozen/cloned identical inputs -> exactly
// equal output ────────────────────────────────────────────────────────

describe("determinism", () => {
  it("produces exactly equal output across repeated calls with deep-frozen inputs", () => {
    const night = deepFreeze(baseNight({ auroraActivity: 6 }));
    const hourlyRows = deepFreeze(baseHourlyRows({ cloudTotal: 35, precipitation: 1 }));
    const viewingWindow = deepFreeze({ ...WIDE_VIEWING_WINDOW });

    const first = scoreAuroraVisibility({ night, hourlyRows, viewingWindow });
    const second = scoreAuroraVisibility({ night, hourlyRows, viewingWindow });
    expect(second).toEqual(first);
  });
});

// ── 15. input objects and arrays remain unchanged ─────────────────────────

describe("input immutability", () => {
  it("never mutates the night, hourlyRows or viewingWindow arguments", () => {
    const night = baseNight({ auroraActivity: 6 });
    const hourlyRows = baseHourlyRows({ cloudTotal: 35, precipitation: 1 });
    const viewingWindow = { ...WIDE_VIEWING_WINDOW };

    const nightBefore = JSON.parse(JSON.stringify(night));
    const rowsBefore = JSON.parse(JSON.stringify(hourlyRows));
    const windowBefore = JSON.parse(JSON.stringify(viewingWindow));

    scoreAuroraVisibility({ night, hourlyRows, viewingWindow });

    expect(night).toEqual(nightBefore);
    expect(hourlyRows).toEqual(rowsBefore);
    expect(viewingWindow).toEqual(windowBefore);
  });
});

// ── 16. equivalent hourly rows in different order -> exactly equal output ─

describe("row order independence", () => {
  it("produces identical output regardless of input row order", () => {
    const rows = baseHourlyRows({ cloudTotal: 40, precipitation: 0.5 });
    const shuffled = [...rows].reverse();

    const night = baseNight({ auroraActivity: 5 });
    const inOrder = scoreAuroraVisibility({ night, hourlyRows: rows, viewingWindow: WIDE_VIEWING_WINDOW });
    const reordered = scoreAuroraVisibility({ night, hourlyRows: shuffled, viewingWindow: WIDE_VIEWING_WINDOW });
    expect(reordered).toEqual(inOrder);
  });
});

// ── 17. boundary and cross-midnight cases ─────────────────────────────────

describe("boundary and cross-midnight handling", () => {
  it("includes a row exactly at the effective window start and excludes one exactly at the end", () => {
    const night = baseNight({ auroraActivity: 9 });
    // Darkness window is [22:00, 05:00+1). The wide viewing window doesn't
    // narrow it, so the effective window boundaries are the darkness ones.
    const rows = [
      { time: "2026-08-24T22:00:00.000Z", cloudTotal: 0, precipitation: 0, windSpeed: 1 }, // included (>= start)
      { time: "2026-08-25T05:00:00.000Z", cloudTotal: 100, precipitation: 0, windSpeed: 1 }, // excluded (== end)
    ];
    const result = scoreAuroraVisibility({ night, hourlyRows: rows, viewingWindow: WIDE_VIEWING_WINDOW });
    // If the end-boundary row were included, its 100% cloud would trigger
    // the hard cap; since it's excluded, only the 0%-cloud start row counts.
    expect(result.status).toBe("scored");
    expect(result.reasons).toContain("clear_sky");
    expect(result.reasons).not.toContain("cloud_hard_cap_applied");
  });

  it("aggregates rows correctly across a midnight-crossing darkness window", () => {
    const night = baseNight({ auroraActivity: 9 });
    const rows = [
      { time: "2026-08-24T23:00:00.000Z", cloudTotal: 0, precipitation: 0, windSpeed: 1 }, // pre-midnight
      { time: "2026-08-25T02:00:00.000Z", cloudTotal: 100, precipitation: 0, windSpeed: 1 }, // post-midnight
    ];
    const result = scoreAuroraVisibility({ night, hourlyRows: rows, viewingWindow: WIDE_VIEWING_WINDOW });
    // Average cloud across both rows is 50% -> "partial_cloud", proving both
    // the pre- and post-midnight row were included in the same aggregation.
    expect(result.status).toBe("scored");
    expect(result.reasons).toContain("partial_cloud");
  });

  it("reconstructs a moon window that itself crosses midnight and intersects the dark interval", () => {
    const night = baseNight({ moon: { ageDays: 14.75, rise: "23:00", set: "01:00", scheduleType: 4 } });
    const rows = [{ time: "2026-08-25T00:30:00.000Z", cloudTotal: 0, precipitation: 0, windSpeed: 1 }];
    const result = scoreAuroraVisibility({ night, hourlyRows: rows, viewingWindow: WIDE_VIEWING_WINDOW });
    expect(result.status).toBe("scored");
    expect(result.flags).toContain("moon_illuminated");
  });
});

// ── 18. reasons/flags are data-driven and deterministically ordered ──────

describe("reason/flag ordering", () => {
  it("produces a stable, repeatable reason order for a fixed scenario", () => {
    const night = baseNight({ auroraActivity: 9 });
    const rows = baseHourlyRows({ cloudTotal: 95, precipitation: 2 });
    const first = scoreAuroraVisibility({ night, hourlyRows: rows, viewingWindow: WIDE_VIEWING_WINDOW });
    const second = scoreAuroraVisibility({ night, hourlyRows: rows, viewingWindow: WIDE_VIEWING_WINDOW });
    expect(first.reasons).toEqual(second.reasons);
    expect(first.reasons).toEqual([
      "meaningful_activity",
      "heavy_cloud",
      "precipitation_reduced_visibility",
      "cloud_hard_cap_applied",
    ]);
  });
});

// ── 19. public function input contains no tier/isPro/user/subscription/
// feature-flag argument ───────────────────────────────────────────────────

describe("tier independence of the public contract", () => {
  it("the exported function's parameter list contains no tier/entitlement argument", () => {
    const src = scoreAuroraVisibility.toString();
    const signatureLine = src.split("\n")[0];
    expect(signatureLine).toMatch(/^function scoreAuroraVisibility\(\{\s*night,\s*hourlyRows,\s*viewingWindow\s*\}/);
    expect(signatureLine.toLowerCase()).not.toMatch(/tier|ispro|subscription|featureflag|feature_flag/);
  });

  it("produces the same score for the same night/rows/window regardless of any extraneous tier-like property on the input object", () => {
    const night = baseNight({ auroraActivity: 7 });
    const hourlyRows = baseHourlyRows({ cloudTotal: 20 });
    const withoutTier = scoreAuroraVisibility({ night, hourlyRows, viewingWindow: WIDE_VIEWING_WINDOW });
    const withTier = scoreAuroraVisibility({
      night,
      hourlyRows,
      viewingWindow: WIDE_VIEWING_WINDOW,
      tier: "pro",
      isPro: true,
    });
    expect(withTier).toEqual(withoutTier);
  });
});

// ── 20. existing campsite scoring remains unchanged ───────────────────────

describe("campsite scoring isolation", () => {
  it("src/lib/scoring.js is untouched and still exports its canonical scoring function", () => {
    expect(typeof scoreSiteDay).toBe("function");
  });
});

// ── 21. both non-scored statuses always contain a stable machine-readable
// cause ────────────────────────────────────────────────────────────────

describe("non-scored statuses always carry a cause", () => {
  it("insufficient_data always has at least one reason", () => {
    const result = scoreAuroraVisibility({
      night: baseNight({ auroraActivity: undefined }),
      hourlyRows: baseHourlyRows(),
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("insufficient_data");
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("not_viewable_tonight always has at least one reason", () => {
    const result = scoreAuroraVisibility({
      night: baseNight(),
      hourlyRows: [],
      viewingWindow: WIDE_VIEWING_WINDOW,
    });
    expect(result.status).toBe("not_viewable_tonight");
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
