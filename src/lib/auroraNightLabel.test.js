import { describe, it, expect, vi, afterEach } from "vitest";
import { formatNightWhenLabel, formatNightTabLabel } from "./auroraNightLabel";
import { northernLightsTranslations } from "../i18n/translations.northernLights";

// Real dictionaries, not a synthetic/identity translator — #427 explicitly
// requires assertions against the real translated weekday strings, not a
// mock standing in for them.
const tEn = (k) => northernLightsTranslations.en[k];
const tIs = (k) => northernLightsTranslations.is[k];

// A real, consecutive Sunday-to-Saturday UTC week (independently verified
// this session via a direct Date computation, not assumed).
const WEEK = [
  { date: "2026-09-27", en: "Sunday", is: "sunnudagur", isGenitive: "sunnudags" },
  { date: "2026-09-28", en: "Monday", is: "mánudagur", isGenitive: "mánudags" },
  { date: "2026-09-29", en: "Tuesday", is: "þriðjudagur", isGenitive: "þriðjudags" },
  { date: "2026-09-30", en: "Wednesday", is: "miðvikudagur", isGenitive: "miðvikudags" },
  { date: "2026-10-01", en: "Thursday", is: "fimmtudagur", isGenitive: "fimmtudags" },
  { date: "2026-10-02", en: "Friday", is: "föstudagur", isGenitive: "föstudags" },
  { date: "2026-10-03", en: "Saturday", is: "laugardagur", isGenitive: "laugardags" },
];

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TZ;
});

describe("formatNightWhenLabel — daysAhead 0/1 (unaffected by the weekday table)", () => {
  it("daysAhead 0 -> tonight key, untouched by date/lang", () => {
    expect(formatNightWhenLabel({ date: "2026-09-25", daysAhead: 0, lang: "en", t: tEn })).toBe("tonight");
    expect(formatNightWhenLabel({ date: "2026-09-25", daysAhead: 0, lang: "is", t: tIs })).toBe("í kvöld");
  });

  it("daysAhead 1 -> tomorrow-night key", () => {
    expect(formatNightWhenLabel({ date: "2026-09-26", daysAhead: 1, lang: "en", t: tEn })).toBe("tomorrow night");
    expect(formatNightWhenLabel({ date: "2026-09-26", daysAhead: 1, lang: "is", t: tIs })).toBe("annað kvöld");
  });
});

describe("formatNightWhenLabel — daysAhead 2, table-driven over a real consecutive week, both languages", () => {
  it.each(WEEK)("$date ($en): EN reads '{weekday} night', IS reads the exact genitive compound", ({ date, en, isGenitive }) => {
    expect(formatNightWhenLabel({ date, daysAhead: 2, lang: "en", t: tEn })).toBe(`${en} night`);
    expect(formatNightWhenLabel({ date, daysAhead: 2, lang: "is", t: tIs })).toBe(`${isGenitive}kvöld`);
  });

  it("never produces the historical bug output 'Wednesdaykvöld' (an English weekday inside the Icelandic compound)", () => {
    const result = formatNightWhenLabel({ date: "2026-09-30", daysAhead: 2, lang: "is", t: tIs });
    expect(result).toBe("miðvikudagskvöld");
    expect(result).not.toContain("Wednesday");
  });
});

describe("formatNightTabLabel — daysAhead 0/1/2, table-driven, both languages", () => {
  it("daysAhead 0/1 use the short tab keys", () => {
    expect(formatNightTabLabel({ date: "2026-09-25", daysAhead: 0, lang: "en", t: tEn })).toBe("Tonight");
    expect(formatNightTabLabel({ date: "2026-09-26", daysAhead: 1, lang: "en", t: tEn })).toBe("Tomorrow night");
    expect(formatNightTabLabel({ date: "2026-09-25", daysAhead: 0, lang: "is", t: tIs })).toBe("Í kvöld");
    expect(formatNightTabLabel({ date: "2026-09-26", daysAhead: 1, lang: "is", t: tIs })).toBe("Annað kvöld");
  });

  it.each(WEEK)("$date ($en): daysAhead 2 -> plain nominative weekday name, EN capitalized, IS lowercase, no 'night' suffix", ({ date, en, is }) => {
    expect(formatNightTabLabel({ date, daysAhead: 2, lang: "en", t: tEn })).toBe(en);
    expect(formatNightTabLabel({ date, daysAhead: 2, lang: "is", t: tIs })).toBe(is);
  });
});

describe("no Intl dependency — both helpers work identically when Intl.DateTimeFormat is unavailable or throws", () => {
  it("formatNightWhenLabel and formatNightTabLabel are unaffected when Intl.DateTimeFormat throws on construction", () => {
    const RealIntl = globalThis.Intl;
    vi.stubGlobal("Intl", {
      ...RealIntl,
      DateTimeFormat: function ThrowingDateTimeFormat() {
        throw new Error("no locale data available in this runtime");
      },
    });

    expect(formatNightWhenLabel({ date: "2026-09-30", daysAhead: 2, lang: "en", t: tEn })).toBe("Wednesday night");
    expect(formatNightWhenLabel({ date: "2026-09-30", daysAhead: 2, lang: "is", t: tIs })).toBe("miðvikudagskvöld");
    expect(formatNightTabLabel({ date: "2026-09-30", daysAhead: 2, lang: "en", t: tEn })).toBe("Wednesday");
    expect(formatNightTabLabel({ date: "2026-09-30", daysAhead: 2, lang: "is", t: tIs })).toBe("miðvikudagur");
  });

  it("is unaffected when Intl itself is entirely undefined in the runtime", () => {
    vi.stubGlobal("Intl", undefined);
    expect(formatNightTabLabel({ date: "2026-10-02", daysAhead: 2, lang: "is", t: tIs })).toBe("föstudagur");
    expect(formatNightWhenLabel({ date: "2026-10-02", daysAhead: 2, lang: "is", t: tIs })).toBe("föstudagskvöld");
  });
});

describe("UTC-only date interpretation — a host timezone that would otherwise yield the previous day", () => {
  it("a negative host UTC offset (which would locally read the previous calendar day) does not shift the resolved weekday", () => {
    // 2026-09-27T00:00:00Z is a Sunday. Under a UTC-10 host timezone, the
    // LOCAL calendar date/day-of-week for that exact instant would be
    // Saturday (14:00 the previous day) if local getters were ever used —
    // confirmed here against this real Date/TZ behavior, not assumed.
    process.env.TZ = "Pacific/Honolulu"; // UTC-10, no DST
    const localDayOfWeek = new Date("2026-09-27T00:00:00Z").getDay();
    expect(localDayOfWeek).toBe(6); // Saturday locally — the exact trap getUTCDay() avoids

    expect(formatNightTabLabel({ date: "2026-09-27", daysAhead: 2, lang: "en", t: tEn })).toBe("Sunday");
    expect(formatNightWhenLabel({ date: "2026-09-27", daysAhead: 2, lang: "is", t: tIs })).toBe("sunnudagskvöld");
  });

  it("is timezone-independent under a positive host UTC offset too", () => {
    process.env.TZ = "Pacific/Kiritimati"; // UTC+14
    expect(formatNightTabLabel({ date: "2026-09-27", daysAhead: 2, lang: "en", t: tEn })).toBe("Sunday");
  });
});

describe("month and year boundary dates", () => {
  it("year boundary: Dec 31 (Thursday) -> Jan 1 (Friday), both UTC", () => {
    expect(formatNightTabLabel({ date: "2026-12-31", daysAhead: 2, lang: "en", t: tEn })).toBe("Thursday");
    expect(formatNightTabLabel({ date: "2027-01-01", daysAhead: 2, lang: "en", t: tEn })).toBe("Friday");
    expect(formatNightWhenLabel({ date: "2027-01-01", daysAhead: 2, lang: "is", t: tIs })).toBe("föstudagskvöld");
  });

  it("month boundary: Jan 31 (Saturday) -> Feb 1 (Sunday) 2026", () => {
    expect(formatNightTabLabel({ date: "2026-01-31", daysAhead: 2, lang: "is", t: tIs })).toBe("laugardagur");
    expect(formatNightTabLabel({ date: "2026-02-01", daysAhead: 2, lang: "is", t: tIs })).toBe("sunnudagur");
  });

  it("leap-day boundary: Feb 28 (Mon) -> Feb 29 (Tue) -> Mar 1 (Wed) 2028", () => {
    expect(formatNightTabLabel({ date: "2028-02-28", daysAhead: 2, lang: "en", t: tEn })).toBe("Monday");
    expect(formatNightTabLabel({ date: "2028-02-29", daysAhead: 2, lang: "en", t: tEn })).toBe("Tuesday");
    expect(formatNightTabLabel({ date: "2028-03-01", daysAhead: 2, lang: "en", t: tEn })).toBe("Wednesday");
  });
});
