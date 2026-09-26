import { describe, it, expect } from "vitest";
import { formatNightWhenLabel, formatNightTabLabel } from "./auroraNightLabel";

// Identity translator, except nlWhenWeekdayNight needs a real "{weekday}"
// placeholder to prove interpolation actually happens (an identity mapping
// alone has nothing to substitute into, since the raw key name itself
// contains no "{weekday}" token) — same technique NorthernLightsCard.test.jsx
// already uses for nlBestTonight's "{name}" placeholder.
const t = (k) => (k === "nlWhenWeekdayNight" ? "nlWhenWeekdayNight:{weekday}" : k);

describe("formatNightWhenLabel", () => {
  it("daysAhead 0 -> tonight key, untouched by date/lang", () => {
    expect(formatNightWhenLabel({ date: "2026-09-25", daysAhead: 0, lang: "en", t })).toBe("nlWhenTonight");
    expect(formatNightWhenLabel({ date: "2026-09-25", daysAhead: 0, lang: "is", t })).toBe("nlWhenTonight");
  });

  it("daysAhead 1 -> tomorrow-night key", () => {
    expect(formatNightWhenLabel({ date: "2026-09-26", daysAhead: 1, lang: "en", t })).toBe("nlWhenTomorrowNight");
  });

  it("daysAhead 2 -> weekday-night template interpolated with the real EN weekday name", () => {
    // 2026-09-27 is a Sunday (UTC).
    const result = formatNightWhenLabel({ date: "2026-09-27", daysAhead: 2, lang: "en", t });
    expect(result).toBe("nlWhenWeekdayNight:Sunday");
  });

  it("daysAhead 2, Icelandic: weekday name transformed to its genitive compound stem (sunnudagur -> sunnudags)", () => {
    const result = formatNightWhenLabel({ date: "2026-09-27", daysAhead: 2, lang: "is", t });
    expect(result).toBe("nlWhenWeekdayNight:sunnudags");
  });

  it("Icelandic weekday genitive transform holds for a Friday (föstudagur -> föstudags)", () => {
    // 2026-10-02 is a Friday (UTC).
    const result = formatNightWhenLabel({ date: "2026-10-02", daysAhead: 2, lang: "is", t });
    expect(result).toBe("nlWhenWeekdayNight:föstudags");
  });

  it("is timezone-independent: always reads the UTC calendar date, never the host clock's local date", () => {
    // A date string alone, parsed as UTC midnight — must not shift to the
    // previous/next day if the test runner's local TZ isn't UTC.
    const result = formatNightWhenLabel({ date: "2026-09-27", daysAhead: 2, lang: "en", t });
    expect(result).toContain("Sunday");
  });
});

describe("formatNightTabLabel", () => {
  it("daysAhead 0/1 use the short tab keys", () => {
    expect(formatNightTabLabel({ date: "2026-09-25", daysAhead: 0, lang: "en", t })).toBe("nlTabTonight");
    expect(formatNightTabLabel({ date: "2026-09-26", daysAhead: 1, lang: "en", t })).toBe("nlTabTomorrow");
  });

  it("daysAhead 2 -> plain weekday name, no 'night' suffix, no translation key needed", () => {
    expect(formatNightTabLabel({ date: "2026-09-27", daysAhead: 2, lang: "en", t })).toBe("Sunday");
  });

  it("daysAhead 2 in Icelandic -> nominative weekday name (no genitive transform for a plain tab label)", () => {
    const result = formatNightTabLabel({ date: "2026-09-27", daysAhead: 2, lang: "is", t });
    expect(result).toBe("sunnudagur");
  });
});
