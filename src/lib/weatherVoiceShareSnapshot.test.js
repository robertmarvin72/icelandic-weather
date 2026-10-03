// Ticket 410 (#410) — share-context adapter: snapshot the actually
// displayed episode, never independently reconstruct it.
import { describe, it, expect } from "vitest";
import { buildWeatherVoiceShareSnapshot } from "./weatherVoiceShareSnapshot";

function activePresentation(overrides = {}) {
  return {
    show: true,
    condition: "excellent",
    voiceLevel: "sarcastic",
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
      voiceLevel: "sarcastic",
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

describe("buildWeatherVoiceShareSnapshot — sarcastic-only sharing (#432)", () => {
  it.each(["cold", "rain", "sun_wind", "excellent", "good"])("%s (sarcastic) produces a valid, complete snapshot", (condition) => {
    const snapshot = buildWeatherVoiceShareSnapshot({
      presentation: activePresentation({ condition, mood: "happy", comment: { id: "good_01", text: "Þetta má alveg." } }),
      lang: "is",
      site: SITE,
      todayRow: TODAY_ROW,
      todayDate: TODAY_ROW.date,
      episodeKey: "k",
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot.condition).toBe(condition);
    expect(snapshot.voiceLevel).toBe("sarcastic");
  });

  it.each([
    ["extreme_wind", "serious"],
    ["heavy_rain", "cautious"],
    ["strong_wind", "cautious"],
    ["cold_wet", "cautious"],
  ])("%s (%s) never produces a snapshot, even with otherwise valid data", (condition, voiceLevel) => {
    const snapshot = buildWeatherVoiceShareSnapshot({
      presentation: activePresentation({ condition, voiceLevel, mood: "wrecked", comment: { id: "safety_extreme_wind", text: "x" } }),
      lang: "is",
      site: SITE,
      todayRow: TODAY_ROW,
      todayDate: TODAY_ROW.date,
      episodeKey: "k",
    });
    expect(snapshot).toBeNull();
  });

  it("a presentation without a voiceLevel never produces a snapshot — never defaulted to sarcastic", () => {
    const withoutTone = activePresentation();
    delete withoutTone.voiceLevel;
    expect(
      buildWeatherVoiceShareSnapshot({ presentation: withoutTone, lang: "is", site: SITE, todayRow: TODAY_ROW, todayDate: TODAY_ROW.date, episodeKey: "k" }),
    ).toBeNull();
  });
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
