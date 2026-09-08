import { describe, it, expect } from "vitest";
import { summarizeDailyWeatherCode } from "./dailyWeatherSummary";

const DATE = "2026-09-08";

function ts(hour) {
  return `${DATE}T${String(hour).padStart(2, "0")}:00`;
}

// entries: [{ hour, code, precip }] — precip omitted -> 0 unless
// `omitPrecipitation` requests a missing precipitation array entirely.
function buildHourly(entries, { omitPrecipitation = false } = {}) {
  const hourly = {
    time: entries.map((e) => ts(e.hour)),
    weathercode: entries.map((e) => e.code),
  };
  if (!omitPrecipitation) {
    hourly.precipitation = entries.map((e) => (e.precip === undefined ? 0 : e.precip));
  }
  return hourly;
}

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

describe("summarizeDailyWeatherCode — ticket fixture (issue #400 / Laugardalur)", () => {
  it("clear/mainly-clear 00:00-18:00 plus one overcast at 21:00 does not summarize as overcast", () => {
    const entries = [];
    for (let h = 0; h <= 18; h++) entries.push({ hour: h, code: 0 });
    entries.push({ hour: 21, code: 3 });

    const result = summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE, fallbackCode: 3 });

    expect(result).not.toBe(3);
    expect(result).toBe(0);
  });
});

describe("summarizeDailyWeatherCode — isolated early/late observations never define the day", () => {
  it("an out-of-window anomaly (hour 23) is excluded from voting when in-window data dominates", () => {
    const entries = [
      { hour: 8, code: 0 },
      { hour: 10, code: 0 },
      { hour: 12, code: 0 },
      { hour: 14, code: 0 },
      { hour: 16, code: 0 },
      { hour: 23, code: 3 }, // outside primary window entirely
    ];
    const result = summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE, fallbackCode: null });
    expect(result).toBe(0);
  });

  it("falls back to whole-day observations (not a fabricated result) when the primary window is entirely empty", () => {
    const entries = [
      { hour: 1, code: 0 },
      { hour: 2, code: 0 },
      { hour: 3, code: 0 },
      { hour: 23, code: 3 },
    ];
    // Primary window [6,22) has zero observations here; whole-day fallback
    // votes 3x clear vs 1x overcast -> clear wins.
    const result = summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE, fallbackCode: null });
    expect(result).toBe(0);
  });
});

describe("summarizeDailyWeatherCode — dominant family selection from mixed inputs", () => {
  it("selects partly-cloudy when it has the most in-window votes", () => {
    const entries = [
      { hour: 7, code: 2 },
      { hour: 9, code: 2 },
      { hour: 11, code: 2 },
      { hour: 13, code: 2 },
      { hour: 15, code: 0 },
      { hour: 17, code: 3 },
      { hour: 19, code: 3 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(2);
  });

  it("selects overcast when it dominates", () => {
    const entries = [
      { hour: 7, code: 3 },
      { hour: 9, code: 3 },
      { hour: 11, code: 3 },
      { hour: 13, code: 3 },
      { hour: 15, code: 3 },
      { hour: 17, code: 2 },
      { hour: 19, code: 2 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(3);
  });

  it("selects fog when it dominates", () => {
    const entries = [
      { hour: 7, code: 45 },
      { hour: 9, code: 45 },
      { hour: 11, code: 45 },
      { hour: 13, code: 0 },
      { hour: 15, code: 0 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(45);
  });
});

describe("summarizeDailyWeatherCode — related codes are grouped before dominance", () => {
  it("clear (0) and mainly-clear (1) combine to outvote a larger isolated overcast count", () => {
    const entries = [
      { hour: 7, code: 0 },
      { hour: 9, code: 0 },
      { hour: 11, code: 1 },
      { hour: 13, code: 1 },
      { hour: 15, code: 3 },
      { hour: 16, code: 3 },
      { hour: 17, code: 3 },
      { hour: 18, code: 3 },
    ];
    // Overcast alone has 4 votes; clear-family (0+1) combined has 4 votes
    // too but let's make the split-vote failure mode explicit: without
    // family grouping, code 0 (2 votes) and code 1 (2 votes) would each
    // individually lose to code 3 (4 votes). With grouping, the clear
    // family (4 votes) ties overcast (4 votes) - bump one more clear vote
    // so the grouped family wins outright.
    entries.push({ hour: 19, code: 1 });
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).not.toBe(3);
  });
});

describe("summarizeDailyWeatherCode — light/moderate precipitation override thresholds", () => {
  it("one isolated light-rain observation does not override an otherwise dominant clear day", () => {
    const entries = [
      { hour: 7, code: 0 },
      { hour: 9, code: 0 },
      { hour: 11, code: 0 },
      { hour: 13, code: 0 },
      { hour: 15, code: 0 },
      { hour: 17, code: 0 },
      { hour: 19, code: 0 },
      { hour: 21, code: 0 },
      { hour: 10, code: 61, precip: 0.5 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(0);
  });

  it("two coherent light-rain observations with >=1.0mm total override the dominant family, even outvoted", () => {
    const entries = [
      { hour: 7, code: 0 },
      { hour: 9, code: 0 },
      { hour: 11, code: 0 },
      { hour: 13, code: 0 },
      { hour: 15, code: 0 },
      { hour: 10, code: 61, precip: 0.6 },
      { hour: 12, code: 61, precip: 0.6 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(61);
  });

  it("two light-rain observations below the 1.0mm total do NOT override", () => {
    const entries = [
      { hour: 7, code: 0 },
      { hour: 9, code: 0 },
      { hour: 11, code: 0 },
      { hour: 13, code: 0 },
      { hour: 15, code: 0 },
      { hour: 10, code: 61, precip: 0.3 },
      { hour: 12, code: 61, precip: 0.3 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(0);
  });

  it("missing precipitation amounts are not treated as zero: code-count evidence alone still qualifies", () => {
    const entries = [
      { hour: 7, code: 0 },
      { hour: 9, code: 0 },
      { hour: 11, code: 0 },
      { hour: 13, code: 0 },
      { hour: 15, code: 0 },
      { hour: 10, code: 61 },
      { hour: 12, code: 61 },
    ];
    const hourly = buildHourly(entries, { omitPrecipitation: true });
    expect(summarizeDailyWeatherCode({ hourly, date: DATE })).toBe(61);
  });
});

describe("summarizeDailyWeatherCode — significant-weather single-observation overrides", () => {
  it("heavy rain (65) overrides on a single observation", () => {
    const entries = Array.from({ length: 8 }, (_, i) => ({ hour: 7 + i, code: 0 }));
    entries.push({ hour: 14, code: 65, precip: 6 });
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(65);
  });

  it("freezing rain (56) overrides on a single observation", () => {
    const entries = Array.from({ length: 8 }, (_, i) => ({ hour: 7 + i, code: 0 }));
    entries.push({ hour: 14, code: 56, precip: 0.2 });
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(56);
  });

  it("snow (73) overrides on a single observation", () => {
    const entries = Array.from({ length: 8 }, (_, i) => ({ hour: 7 + i, code: 0 }));
    entries.push({ hour: 14, code: 73, precip: 1 });
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(73);
  });

  it("thunderstorm (95) overrides on a single observation", () => {
    const entries = Array.from({ length: 8 }, (_, i) => ({ hour: 7 + i, code: 0 }));
    entries.push({ hour: 14, code: 95, precip: 2 });
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(95);
  });
});

describe("summarizeDailyWeatherCode — deterministic precedence when multiple overrides qualify", () => {
  it("snow outranks heavy rain", () => {
    const entries = [
      { hour: 10, code: 65, precip: 6 },
      { hour: 14, code: 73, precip: 1 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(73);
  });

  it("freezing precipitation outranks snow", () => {
    const entries = [
      { hour: 10, code: 73, precip: 1 },
      { hour: 14, code: 66, precip: 0.2 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(66);
  });

  it("thunder/hail outranks freezing precipitation", () => {
    const entries = [
      { hour: 10, code: 66, precip: 0.2 },
      { hour: 14, code: 95, precip: 2 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(95);
  });

  it("rain outranks drizzle", () => {
    const entries = [
      { hour: 10, code: 55, precip: 3 }, // heavy drizzle, single-obs qualifies
      { hour: 14, code: 65, precip: 6 }, // heavy rain, single-obs qualifies
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(65);
  });
});

describe("summarizeDailyWeatherCode — representative-code intensity selection", () => {
  it("picks the highest observed intensity within the winning family, never an unobserved code", () => {
    const entries = [
      { hour: 8, code: 61, precip: 0.4 },
      { hour: 14, code: 65, precip: 6 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(65);
  });

  it("reordering the same observations does not change the representative code", () => {
    const entries = [
      { hour: 14, code: 65, precip: 6 },
      { hour: 8, code: 61, precip: 0.4 },
    ];
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(65);
  });

  it("never upgrades to a code that was not actually observed", () => {
    const entries = [
      { hour: 8, code: 61, precip: 0.4 },
      { hour: 9, code: 61, precip: 0.4 },
    ];
    // Only 61 observed within the rain family -> must return 61, not 63/65.
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(61);
  });
});

describe("summarizeDailyWeatherCode — order independence and purity", () => {
  it("equivalent rows in different input order produce the same result", () => {
    const entriesA = [
      { hour: 7, code: 2 },
      { hour: 9, code: 3 },
      { hour: 11, code: 2 },
      { hour: 13, code: 3 },
      { hour: 15, code: 2 },
    ];
    const entriesB = [...entriesA].reverse();

    const resultA = summarizeDailyWeatherCode({ hourly: buildHourly(entriesA), date: DATE });
    const resultB = summarizeDailyWeatherCode({ hourly: buildHourly(entriesB), date: DATE });
    expect(resultA).toBe(resultB);
  });

  it("does not mutate the hourly input", () => {
    const entries = [
      { hour: 7, code: 0 },
      { hour: 14, code: 65, precip: 6 },
    ];
    const hourly = buildHourly(entries);
    const before = deepClone(hourly);

    summarizeDailyWeatherCode({ hourly, date: DATE });

    expect(hourly).toEqual(before);
  });
});

describe("summarizeDailyWeatherCode — safe fallback behavior", () => {
  it("malformed timestamps are ignored safely and do not crash", () => {
    const hourly = {
      time: ["not-a-timestamp", `${DATE}T0a:00`, ts(9)],
      weathercode: [0, 0, 0],
      precipitation: [0, 0, 0],
    };
    expect(summarizeDailyWeatherCode({ hourly, date: DATE, fallbackCode: 3 })).toBe(0);
  });

  it("non-finite and unsupported codes are ignored safely", () => {
    const hourly = {
      time: [ts(8), ts(9), ts(10)],
      weathercode: [NaN, "not-a-code", 999],
      precipitation: [0, 0, 0],
    };
    // Every observation is unusable -> falls back to fallbackCode unchanged.
    expect(summarizeDailyWeatherCode({ hourly, date: DATE, fallbackCode: 2 })).toBe(2);
  });

  it("a literal null entry in hourly.weathercode is excluded, never coerced to clear sky (0) (Revision 2)", () => {
    // Overcast (3 votes, closest-to-14:00 distance 1) genuinely beats clear
    // (2 votes, closest-to-14:00 distance 4) outright on count. A null
    // entry is injected exactly at hour 14 (distance 0 from the tie-break
    // midpoint) — if it were wrongly coerced to WMO 0 (clear sky) via
    // Number(null), clear would jump to 3 votes (tying overcast's count)
    // AND gain the closest-to-midpoint observation, flipping the result to
    // clear via the tie-break. With the guard, the null contributes no
    // vote at all and overcast wins outright as expected.
    const entries = [
      { hour: 12, code: 3 },
      { hour: 13, code: 3 },
      { hour: 15, code: 3 },
      { hour: 10, code: 0 },
      { hour: 18, code: 0 },
    ];
    const hourly = buildHourly(entries);
    hourly.time.push(ts(14));
    hourly.weathercode.push(null);
    hourly.precipitation.push(0);

    expect(summarizeDailyWeatherCode({ hourly, date: DATE })).toBe(3);
  });

  it("the hourly.weather_code alias enforces the same missing-value rule (Revision 2)", () => {
    const hourly = {
      time: [ts(12), ts(13), ts(15), ts(10), ts(18), ts(14)],
      weather_code: [3, 3, 3, 0, 0, null],
      precipitation: [0, 0, 0, 0, 0, 0],
    };
    expect(summarizeDailyWeatherCode({ hourly, date: DATE })).toBe(3);
  });

  it("sparse primary-window data (a single valid observation) still resolves deterministically", () => {
    const hourly = buildHourly([{ hour: 10, code: 45 }]);
    expect(summarizeDailyWeatherCode({ hourly, date: DATE })).toBe(45);
  });

  it("no usable same-date hourly data at all falls back to the raw fallbackCode unchanged", () => {
    const hourly = buildHourly([{ hour: 10, code: 0 }]);
    expect(summarizeDailyWeatherCode({ hourly, date: "2099-01-01", fallbackCode: 61 })).toBe(61);
  });

  it("missing hourly data entirely falls back to fallbackCode", () => {
    expect(summarizeDailyWeatherCode({ hourly: null, date: DATE, fallbackCode: 3 })).toBe(3);
    expect(summarizeDailyWeatherCode({ hourly: undefined, date: DATE, fallbackCode: 1 })).toBe(1);
  });

  it("an unusable fallbackCode resolves to null, never to clear sky (0)", () => {
    expect(summarizeDailyWeatherCode({ hourly: null, date: DATE, fallbackCode: null })).toBeNull();
    expect(summarizeDailyWeatherCode({ hourly: null, date: DATE, fallbackCode: undefined })).toBeNull();
    expect(summarizeDailyWeatherCode({ hourly: null, date: DATE, fallbackCode: "not-a-number" })).toBeNull();
  });

  it("never coerces a missing/invalid result to code 0 (clear sky) by default", () => {
    const result = summarizeDailyWeatherCode({});
    expect(result).not.toBe(0);
    expect(result).toBeNull();
  });
});
