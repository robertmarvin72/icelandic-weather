// Ticket 410 (#410) — share-context adapter: snapshot the actually
// displayed episode, never independently reconstruct it.
import { describe, it, expect } from "vitest";
import { buildWeatherVoiceShareSnapshot } from "./weatherVoiceShareSnapshot";

function activePresentation(overrides = {}) {
  return {
    show: true,
    condition: "excellent",
    mood: "excellent",
    severity: 0,
    comment: { id: "excellent_01", text: "Þetta er grunsamlega gott." },
    ...overrides,
  };
}

const SITE = { id: "site-a", name: "Þingvellir", lat: 64.1, lon: -21.9 };
const TODAY_ROW = { date: "2026-09-08", tmax: 16, windMax: 0, rain: 0, code: 0 };

describe("buildWeatherVoiceShareSnapshot — eligible episode", () => {
  it("builds a complete, frozen snapshot from the exact displayed data", () => {
    const snapshot = buildWeatherVoiceShareSnapshot({
      presentation: activePresentation(),
      lang: "is",
      site: SITE,
      todayRow: TODAY_ROW,
      todayDate: TODAY_ROW.date,
      episodeKey: "homepage_decision|site-a|2026-09-08|is|excellent|excellent|0",
    });

    expect(snapshot).toEqual({
      voiceId: "excellent_01",
      text: "Þetta er grunsamlega gott.",
      language: "is",
      mood: "excellent",
      condition: "excellent",
      severity: 0,
      siteName: "Þingvellir",
      date: "2026-09-08",
      tmax: 16,
      code: 0,
      episodeKey: "homepage_decision|site-a|2026-09-08|is|excellent|excellent|0",
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("siteName is null when the site has no usable name, never a placeholder string", () => {
    const snapshot = buildWeatherVoiceShareSnapshot({
      presentation: activePresentation(),
      lang: "is",
      site: { id: "site-a", lat: 64.1, lon: -21.9 },
      todayRow: TODAY_ROW,
      todayDate: TODAY_ROW.date,
      episodeKey: "k",
    });
    expect(snapshot.siteName).toBeNull();
  });
});

describe("buildWeatherVoiceShareSnapshot — universal sharing (Ticket 410 Revision 2, #410): every real condition builds a snapshot", () => {
  it.each(["extreme_wind", "heavy_rain", "strong_wind", "cold_wet", "cold", "rain", "sun_wind", "excellent", "good"])(
    "%s produces a valid, complete snapshot — no condition allowlist remains",
    (condition) => {
      const snapshot = buildWeatherVoiceShareSnapshot({
        presentation: activePresentation({ condition, mood: "wrecked", comment: { id: "wind_extreme_01", text: "Vindur: Já." } }),
        lang: "is",
        site: SITE,
        todayRow: TODAY_ROW,
        todayDate: TODAY_ROW.date,
        episodeKey: "k",
      });
      expect(snapshot).not.toBeNull();
      expect(snapshot.condition).toBe(condition);
      expect(snapshot.text).toBe("Vindur: Já.");
    },
  );
});

describe("buildWeatherVoiceShareSnapshot — ineligible/invalid inputs never produce a snapshot", () => {
  it("a silent (show:false) episode returns null", () => {
    expect(
      buildWeatherVoiceShareSnapshot({ presentation: { show: false }, lang: "is", site: SITE, todayRow: TODAY_ROW, todayDate: TODAY_ROW.date, episodeKey: "k" }),
    ).toBeNull();
  });

  it("missing/invalid todayRow (no valid daily data) returns null even for an otherwise-eligible episode", () => {
    expect(
      buildWeatherVoiceShareSnapshot({ presentation: activePresentation(), lang: "is", site: SITE, todayRow: null, todayDate: TODAY_ROW.date, episodeKey: "k" }),
    ).toBeNull();
    expect(
      buildWeatherVoiceShareSnapshot({
        presentation: activePresentation(),
        lang: "is",
        site: SITE,
        todayRow: { date: "2026-09-08", tmax: NaN, code: 0 },
        todayDate: TODAY_ROW.date,
        episodeKey: "k",
      }),
    ).toBeNull();
  });

  it("missing episodeKey or todayDate returns null", () => {
    expect(
      buildWeatherVoiceShareSnapshot({ presentation: activePresentation(), lang: "is", site: SITE, todayRow: TODAY_ROW, todayDate: TODAY_ROW.date, episodeKey: null }),
    ).toBeNull();
    expect(
      buildWeatherVoiceShareSnapshot({ presentation: activePresentation(), lang: "is", site: SITE, todayRow: TODAY_ROW, todayDate: "", episodeKey: "k" }),
    ).toBeNull();
  });

  it("an unsupported language returns null — retained exactly as before universal sharing", () => {
    expect(
      buildWeatherVoiceShareSnapshot({ presentation: activePresentation(), lang: "fr", site: SITE, todayRow: TODAY_ROW, todayDate: TODAY_ROW.date, episodeKey: "k" }),
    ).toBeNull();
  });
});
