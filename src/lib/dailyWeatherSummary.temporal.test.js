// Ticket 402 (#402) — the new temporal-narrative layer on top of Ticket
// 400/401's unchanged override/dominance pipeline. See
// dailyWeatherSummary.test.js for the full pre-existing coverage of the
// backward-compatible summarizeDailyWeatherCode() wrapper, all still green
// and unmodified (confirmed by a full manual trace in cc-report.md).
import { describe, it, expect } from "vitest";
import { summarizeDailyWeather, summarizeDailyWeatherCode } from "./dailyWeatherSummary";

const DATE = "2026-09-14"; // Mon 14 Sept — the issue #402 motivating date

function ts(hour) {
  return `${DATE}T${String(hour).padStart(2, "0")}:00`;
}

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

function dryRun(startHour, endHour, code = 0) {
  const out = [];
  for (let h = startHour; h <= endHour; h++) out.push({ hour: h, code });
  return out;
}

describe("summarizeDailyWeather — issue #402 motivating fixture", () => {
  it("light rain/drizzle/heavy drizzle at 00:00/03:00/06:00, dry 09:00-21:00 -> dry-later narrative, never plain 'Heavy drizzle'", () => {
    const entries = [
      { hour: 0, code: 61 }, // light rain — outside the primary window, not part of the decision
      { hour: 3, code: 53 }, // drizzle — outside the primary window
      { hour: 6, code: 55 }, // heavy drizzle — the single in-window wet observation
      ...dryRun(9, 21),
    ];

    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });

    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
    // The icon/representative code still truthfully reflects that
    // precipitation occurred (heavy drizzle), coherent with the headline —
    // it must not silently become a plain clear-sky code.
    expect(result.code).toBe(55);

    // Direct proof this is not simply "Heavy drizzle" bare — the
    // backward-compatible wrapper alone is insufficient to tell this story;
    // the textKey is what changes the presented narrative.
    expect(summarizeDailyWeatherCode({ hourly: buildHourly(entries), date: DATE })).toBe(55);
  });

  it("red -> green proof: the pre-Ticket-402 behavior really did resolve this fixture to bare heavy drizzle with no narrative", () => {
    // Reimplements just enough of the OLD (Ticket 400/401) decision to prove
    // the fixture genuinely changed behavior, not merely that today's code
    // happens to already handle it. The old summarizeDailyWeatherCode
    // contract had no textKey at all — confirming the win is the *narrative*
    // recognizizing "early vs. later", not the numeric code (which is
    // unchanged: 55 either way).
    const entries = [{ hour: 6, code: 55 }, ...dryRun(9, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).not.toBeNull();
    expect(result.textKey).not.toBe("overcast");
  });
});

describe("summarizeDailyWeather — inverse pattern: dry early, rain later", () => {
  it("a substantial dry morning followed by rain in the afternoon/evening", () => {
    const entries = [...dryRun(6, 15), { hour: 18, code: 63, precip: 4 }, { hour: 19, code: 63, precip: 3 }];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBe("dailySummaryDryEarlyRainLater");
    expect(result.code).toBe(63);
  });
});

describe("summarizeDailyWeather — precipitation through most/all of the usable day stays precipitation-led", () => {
  it("continuous rain across the whole window never gets a dry-transition phrase", () => {
    const entries = [
      { hour: 6, code: 61, precip: 1 },
      { hour: 9, code: 63, precip: 3 },
      { hour: 12, code: 63, precip: 3 },
      { hour: 15, code: 65, precip: 6 },
      { hour: 18, code: 63, precip: 3 },
      { hour: 21, code: 61, precip: 1 },
    ];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(65); // unchanged existing override/dominance behavior
  });
});

describe("summarizeDailyWeather — one short intense episode surrounded by a long dry span", () => {
  it("heavy rain for 2 hours between two substantial dry runs -> brief narrative, not an all-day heavy headline", () => {
    const entries = [...dryRun(6, 11), { hour: 12, code: 65, precip: 6 }, { hour: 13, code: 65, precip: 5 }, ...dryRun(14, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBe("dailySummaryBriefShowers");
    expect(result.code).toBe(65);
  });

  it("a single heavy-drizzle hour surrounded by dry on both sides also reads as brief, not all-day", () => {
    const entries = [...dryRun(6, 12), { hour: 13, code: 55, precip: 3 }, ...dryRun(14, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBe("dailySummaryBriefShowers");
    expect(result.code).toBe(55);
  });
});

describe("summarizeDailyWeather — persistent dry/clear or dry/cloudy conditions", () => {
  it("a fully dry day retains the existing dominant clear/cloud presentation, no narrative", () => {
    const entries = dryRun(6, 21);
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(0);
  });

  it("a persistently overcast/cloudy day retains the existing dominant presentation, no narrative", () => {
    const entries = dryRun(6, 21, 3);
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(3);
  });
});

describe("summarizeDailyWeather — intermittent wet/dry/wet input has no honest directional narrative", () => {
  it("wet, dry, wet, dry alternating pattern retains the neutral existing fallback", () => {
    const entries = [
      { hour: 6, code: 61, precip: 1 },
      { hour: 7, code: 61, precip: 1 },
      ...dryRun(9, 11),
      { hour: 13, code: 61, precip: 1 },
      { hour: 14, code: 61, precip: 1 },
      ...dryRun(16, 21),
    ];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
  });

  it("a genuinely trivial isolated blip (no qualifying evidence) never triggers a directional narrative either", () => {
    // Mirrors the existing Ticket 400 "one isolated light-rain observation
    // does not override" fixture shape — proves the new temporal layer
    // requires the SAME meaningful-evidence bar as the old override rule,
    // not merely "any wet hour at all".
    const entries = [...dryRun(6, 9), { hour: 10, code: 61, precip: 0.5 }, ...dryRun(11, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(0);
  });
});

describe("summarizeDailyWeather — snow, freezing precipitation, and thunder/hail always bypass the temporal layer", () => {
  it("brief single-hour snow surrounded by long dry spans is never softened into a dry-narrative or a brief-showers phrase", () => {
    const entries = [...dryRun(6, 12), { hour: 13, code: 73, precip: 1 }, ...dryRun(14, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(73);
  });

  it("brief freezing rain surrounded by dry spans is never softened", () => {
    const entries = [...dryRun(6, 12), { hour: 13, code: 66, precip: 0.3 }, ...dryRun(14, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(66);
  });

  it("brief thunderstorm surrounded by dry spans is never softened", () => {
    const entries = [...dryRun(6, 12), { hour: 13, code: 95, precip: 2 }, ...dryRun(14, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(95);
  });

  it("sustained snow across the window is unaffected by the temporal layer (existing dominance/override behavior)", () => {
    const entries = [
      { hour: 6, code: 73, precip: 1 },
      { hour: 9, code: 73, precip: 1 },
      { hour: 12, code: 75, precip: 3 },
      { hour: 15, code: 73, precip: 1 },
      ...dryRun(18, 21),
    ];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(75);
  });
});

describe("summarizeDailyWeather — boundary hours around 06:00 and 22:00", () => {
  it("a wet observation exactly at 06:00 (the first in-window hour) still counts toward the dry-later narrative", () => {
    const entries = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
  });

  it("a wet observation at 21:00 (the last in-window hour, 22:00 itself excluded) still counts toward the rain-later narrative", () => {
    const entries = [...dryRun(6, 15), { hour: 21, code: 63, precip: 4 }, { hour: 20, code: 63, precip: 3 }];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBe("dailySummaryDryEarlyRainLater");
  });

  it("an observation at 22:00 itself is outside the primary window and does not participate", () => {
    const entries = [...dryRun(6, 21), { hour: 22, code: 65, precip: 6 }];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
    expect(result.code).toBe(0);
  });
});

describe("summarizeDailyWeather — reordered hourly arrays produce the same result after chronological normalization", () => {
  it("shuffled input order does not change the detected narrative or code", () => {
    const entries = [...dryRun(6, 11), { hour: 12, code: 65, precip: 6 }, { hour: 13, code: 65, precip: 5 }, ...dryRun(14, 21)];
    const shuffled = [...entries].reverse();

    const a = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    const b = summarizeDailyWeather({ hourly: buildHourly(shuffled), date: DATE });

    expect(b).toEqual(a);
    expect(a.textKey).toBe("dailySummaryBriefShowers");
  });
});

describe("summarizeDailyWeather — Revision 2 (#402): sparse/gapped data must not fabricate continuous duration", () => {
  it("sparse 3-hourly data {06:00 wet, 09:00 dry, 21:00 dry} does NOT produce a dry-later narrative — the gaps are not covered hours", () => {
    // Only 3 real data points, each 3+ hours apart. The old (defective)
    // implementation treated 09:00-21:00 as one continuous 13-hour dry run;
    // in reality only 2 discrete dry hours were ever observed, nowhere near
    // the 6-hour substantial-dry threshold.
    const entries = [{ hour: 6, code: 55, precip: 3 }, { hour: 9, code: 0 }, { hour: 21, code: 0 }];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
  });

  it("a single missing hour inside an otherwise same-classification dry sequence breaks continuity and cannot fabricate the six-hour minimum", () => {
    // dry 9-13 (span 5) then a gap at hour 14, then dry 15-21 (span 7).
    // Real elapsed coverage (9-21) would wrongly read as one 13-hour dry
    // run under the old span formula (21-9+1), qualifying it as
    // substantial. With the gap respected, these are two separate dry runs
    // flanking the wet run at 6:00 (wet, dry, dry — not a recognized
    // shape), so no narrative is produced.
    const entries = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 13), ...dryRun(15, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
  });

  it("truly contiguous full-resolution dry observations still satisfy the threshold and preserve the motivating #402 result", () => {
    // The exact issue #402 motivating shape, but explicitly re-asserted here
    // under the Revision 2 heading: every hour 9-21 is genuinely present, so
    // the 13-hour dry run is real coverage, not a fabricated one.
    const entries = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
    expect(result.code).toBe(55);
  });

  it("a duplicate timestamp with the same classification does not add duration", () => {
    // Hour 21 appears twice (e.g. a duplicated payload row) — must not
    // extend the dry run's span beyond its genuine 13-hour coverage (9-21),
    // and must not change the result at all.
    const entries = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const hourly = buildHourly(entries);
    hourly.time.push(ts(21));
    hourly.weathercode.push(0);
    hourly.precipitation.push(0);
    const result = summarizeDailyWeather({ hourly, date: DATE });
    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
    expect(result.code).toBe(55);
  });

});

describe("summarizeDailyWeather — Revision 3 (#402): same-hour duplicates are resolved order-independently before run construction", () => {
  // Superseded by Revision 3: a same-hour wet/dry conflict is no longer
  // resolved by "the dry reading wins, the duplicate is dropped" (that was
  // itself order-dependent — see below). It now conservatively disables
  // the temporal narrative for the whole day.
  it.each([
    ["dry reading first, conflicting wet duplicate appended after", (entries) => [...entries, { hour: 9, code: 61, precip: 1 }]],
    ["conflicting wet duplicate first, dry reading appended after", (entries) => [{ hour: 9, code: 61, precip: 1 }, ...entries]],
  ])("a same-hour wet/dry conflict at 09:00 suppresses the narrative regardless of order (%s)", (_label, arrange) => {
    const base = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const entries = arrange(base);
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
  });

  it("reversing the conflicting duplicate order never changes the result", () => {
    const base = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const forward = summarizeDailyWeather({ hourly: buildHourly([...base, { hour: 9, code: 61, precip: 1 }]), date: DATE });
    const reversed = summarizeDailyWeather({ hourly: buildHourly([{ hour: 9, code: 61, precip: 1 }, ...base]), date: DATE });
    expect(reversed).toEqual(forward);
    expect(forward.textKey).toBeNull();
  });

  it.each([
    ["original order", (entries) => [...entries, { hour: 21, code: 0 }]],
    ["duplicate appended first", (entries) => [{ hour: 21, code: 0 }, ...entries]],
  ])("a same-classification duplicate never extends run duration, in either order (%s)", (_label, arrange) => {
    const base = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const entries = arrange(base);
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
    expect(result.code).toBe(55);
  });

  it("two duplicate light-rain rows for the same hour do not qualify as two distinct observations", () => {
    // Without hour-normalization, Revision 2's duplicate-hour branch still
    // pushed both readings into the run's own obs list (only endHour was
    // held back), so a single hour of light rain reported twice could
    // wrongly satisfy evaluateLightModerateFamily's "2+ observations"
    // significance rule. Two code-61 readings at hour 10, each under the
    // 1.0mm single-observation floor, must still read as ONE hour of
    // light rain — not significant on its own — so the surrounding dry
    // spans keep their neutral, non-narrative fallback.
    const entries = [...dryRun(6, 9), { hour: 10, code: 61, precip: 0.6 }, { hour: 10, code: 61, precip: 0.6 }, ...dryRun(11, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
  });

  it("Revision 2's missing-hour gap fix still holds after hour-normalization", () => {
    const entries = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 13), ...dryRun(15, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBeNull();
  });

  it("the full-resolution motivating #402 fixture is unaffected by hour-normalization", () => {
    const entries = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
    expect(result.code).toBe(55);
  });

  it("a reordered non-duplicate fixture is unaffected by hour-normalization", () => {
    const entries = [...dryRun(6, 11), { hour: 12, code: 65, precip: 6 }, { hour: 13, code: 65, precip: 5 }, ...dryRun(14, 21)];
    const shuffled = [...entries].reverse();
    const a = summarizeDailyWeather({ hourly: buildHourly(entries), date: DATE });
    const b = summarizeDailyWeather({ hourly: buildHourly(shuffled), date: DATE });
    expect(b).toEqual(a);
    expect(a.textKey).toBe("dailySummaryBriefShowers");
  });
});

describe("summarizeDailyWeather — sparse/uneven/missing/malformed inputs remain safe", () => {
  it("missing precipitation array does not break temporal detection (code-count evidence still usable for the override gate)", () => {
    const entries = [{ hour: 6, code: 55 }, ...dryRun(9, 21)];
    const hourly = buildHourly(entries, { omitPrecipitation: true });
    const result = summarizeDailyWeather({ hourly, date: DATE });
    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
  });

  it("malformed timestamps and unsupported codes mixed into an otherwise valid pattern are ignored, not fabricated", () => {
    const hourly = buildHourly([{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)]);
    hourly.time.push("not-a-timestamp", `${DATE}T99:00`);
    hourly.weathercode.push(65, 999);
    hourly.precipitation.push(10, 10);
    const result = summarizeDailyWeather({ hourly, date: DATE });
    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
  });

  it("a literal null code mixed into the dry run does not corrupt the span or the narrative", () => {
    const entries = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const hourly = buildHourly(entries);
    hourly.time.push(ts(15));
    hourly.weathercode.push(null);
    hourly.precipitation.push(0);
    const result = summarizeDailyWeather({ hourly, date: DATE });
    expect(result.textKey).toBe("dailySummaryRainEarlyDryLater");
  });

  it("does not mutate the hourly input", () => {
    const entries = [{ hour: 6, code: 55, precip: 3 }, ...dryRun(9, 21)];
    const hourly = buildHourly(entries);
    const before = JSON.parse(JSON.stringify(hourly));
    summarizeDailyWeather({ hourly, date: DATE });
    expect(hourly).toEqual(before);
  });
});

describe("summarizeDailyWeather — no same-date usable hourly observations preserves the existing safe fallback", () => {
  it("no hourly data at all falls back to the raw fallbackCode, textKey null", () => {
    const result = summarizeDailyWeather({ hourly: null, date: DATE, fallbackCode: 3 });
    expect(result).toEqual({ code: 3, textKey: null });
  });

  it("no usable same-date observations falls back to the raw fallbackCode, textKey null", () => {
    const entries = dryRun(6, 21);
    const result = summarizeDailyWeather({ hourly: buildHourly(entries), date: "2099-01-01", fallbackCode: 61 });
    expect(result).toEqual({ code: 61, textKey: null });
  });

  it("never coerces a missing/invalid result to code 0 (clear sky) by default", () => {
    const result = summarizeDailyWeather({});
    expect(result).toEqual({ code: null, textKey: null });
  });
});
