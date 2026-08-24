// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseAuroraSnapshot } from "./parseAurora.js";

function night({
  date = "2026-08-24",
  activity = "2",
  sunset = "21:13",
  darkness = "22:10",
  dawn = "04:52",
  sunrise = "05:49",
  age = "12",
  scheduleType = "4",
  scheduleDescription = "Tungl rís og sest",
  moonrise = "21:39",
  moonset = "00:41",
} = {}) {
  return `<night_data><evening_date>${date}</evening_date><activity_forecast>${activity}</activity_forecast><sun><sunset>${sunset}</sunset><darkness>${darkness}</darkness><dawn>${dawn}</dawn><sunrise>${sunrise}</sunrise></sun><moon><age>${age}</age><schedule_type>${scheduleType}</schedule_type><schedule_description>${scheduleDescription}</schedule_description><moonrise>${moonrise}</moonrise><moonset>${moonset}</moonset></moon></night_data>`;
}

function doc(nights) {
  return `<?xml version="1.0" encoding="UTF-8"?><aurora>${nights.join("")}</aurora>`;
}

describe("parseAuroraSnapshot — valid input", () => {
  it("parses a valid full XML document with one night", () => {
    const result = parseAuroraSnapshot(doc([night()]));
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      eveningDate: "2026-08-24",
      auroraActivity: 2,
      sun: { sunset: "21:13", darknessStart: "22:10", dawn: "04:52", sunrise: "05:49" },
      moon: { ageDays: 12, rise: "21:39", set: "00:41", scheduleType: 4 },
    });
  });

  it("parses a multi-night response (matches the confirmed live 10-night shape)", () => {
    const nights = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 7, 24 + i)); // Aug 24 .. Sep 2, real rollover
      return night({ date: d.toISOString().slice(0, 10) });
    });
    const result = parseAuroraSnapshot(doc(nights));
    expect(result).toHaveLength(10);
    expect(result[0].eveningDate).toBe("2026-08-24");
    expect(result[9].eveningDate).toBe("2026-09-02");
  });
});

describe("parseAuroraSnapshot — empty fields are valid contract, not errors", () => {
  it("normalizes empty activity_forecast (self-closing) to null", () => {
    const xml = doc([
      night().replace("<activity_forecast>2</activity_forecast>", "<activity_forecast/>"),
    ]);
    expect(parseAuroraSnapshot(xml)[0].auroraActivity).toBeNull();
  });

  it("normalizes empty activity_forecast (open/close, no content) to null", () => {
    const xml = doc([
      night().replace("<activity_forecast>2</activity_forecast>", "<activity_forecast></activity_forecast>"),
    ]);
    expect(parseAuroraSnapshot(xml)[0].auroraActivity).toBeNull();
  });

  it("normalizes empty moonrise/moonset to null (schedule_type=1, 'moon does not set', confirmed live shape)", () => {
    const xml = doc([
      night({
        scheduleType: "1",
        scheduleDescription: "Tungl sest ekki",
        moonrise: "",
        moonset: "",
      }),
    ]);
    const result = parseAuroraSnapshot(xml)[0];
    expect(result.moon.rise).toBeNull();
    expect(result.moon.set).toBeNull();
    expect(result.moon.scheduleType).toBe(1);
  });

  it("activity_forecast value 0 stays 0, not null — 0 is a real, distinct value", () => {
    const xml = doc([night({ activity: "0" })]);
    expect(parseAuroraSnapshot(xml)[0].auroraActivity).toBe(0);
  });

  it("moon.age value 0 stays 0, not null", () => {
    const xml = doc([night({ age: "0" })]);
    expect(parseAuroraSnapshot(xml)[0].moon.ageDays).toBe(0);
  });
});

describe("parseAuroraSnapshot — invalid fields degrade to null without discarding siblings", () => {
  it("an invalid single time field becomes null while the rest of the night is kept", () => {
    const xml = doc([night({ sunset: "25:99" })]);
    const result = parseAuroraSnapshot(xml)[0];
    expect(result.sun.sunset).toBeNull();
    expect(result.sun.dawn).toBe("04:52");
    expect(result.eveningDate).toBe("2026-08-24");
  });

  it("an invalid date drops only that night entry, keeping valid siblings", () => {
    const xml = doc([
      night({ date: "2026-99-99" }),
      night({ date: "2026-08-25" }),
    ]);
    const result = parseAuroraSnapshot(xml);
    expect(result).toHaveLength(1);
    expect(result[0].eveningDate).toBe("2026-08-25");
  });

  it("rejects a calendar-invalid date (Feb 30) rather than silently rolling it over", () => {
    const xml = doc([night({ date: "2026-02-30" }), night({ date: "2026-08-25" })]);
    const result = parseAuroraSnapshot(xml);
    expect(result).toHaveLength(1);
    expect(result[0].eveningDate).toBe("2026-08-25");
  });

  it("preserves an unknown schedule_type value without crashing or guessing semantics", () => {
    const xml = doc([night({ scheduleType: "99" })]);
    const result = parseAuroraSnapshot(xml)[0];
    expect(result.moon.scheduleType).toBe(99);
  });

  it("an unknown extra XML tag anywhere is ignored, not fatal (forward compatibility)", () => {
    const xml = doc([
      night().replace("</night_data>", "<future_field>surprise</future_field></night_data>"),
    ]);
    const result = parseAuroraSnapshot(xml);
    expect(result).toHaveLength(1);
    expect(result[0].eveningDate).toBe("2026-08-24");
  });

  it("a fully malformed XML document returns an empty array, never throws", () => {
    expect(() => parseAuroraSnapshot("<not><valid")).not.toThrow();
    expect(parseAuroraSnapshot("<not><valid")).toEqual([]);
  });

  it("a non-string/null/undefined input returns an empty array, never throws", () => {
    expect(parseAuroraSnapshot(null)).toEqual([]);
    expect(parseAuroraSnapshot(undefined)).toEqual([]);
    expect(parseAuroraSnapshot(42)).toEqual([]);
  });

  it("an empty response body returns an empty array", () => {
    expect(parseAuroraSnapshot("")).toEqual([]);
  });

  it("a partially valid snapshot keeps only the valid nights (mixed valid/invalid siblings)", () => {
    const xml = doc([
      night({ date: "2026-08-24" }),
      night({ date: "not-a-date" }),
      night({ date: "2026-08-26" }),
    ]);
    const result = parseAuroraSnapshot(xml);
    expect(result.map((n) => n.eveningDate)).toEqual(["2026-08-24", "2026-08-26"]);
  });
});
