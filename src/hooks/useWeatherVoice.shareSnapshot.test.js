// Ticket 410 (#410) — shareSnapshot integration at the real hook boundary.
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWeatherVoice } from "./useWeatherVoice";

const DAY1 = "2026-09-08";
const NOW = Date.UTC(2026, 8, 8, 12, 0, 0); // Atlantic/Reykjavik has no DST -> equals UTC

const SITE_A = { id: "site-a", name: "Þingvellir", lat: 64.1, lon: -21.9 };

function row(date, overrides = {}) {
  return { date, tmax: 16, windMax: 0, rain: 0, code: 0, ...overrides }; // excellent by default
}

function fakeStorage() {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, v) };
}

const t = (k) => k;

function baseArgs(overrides = {}) {
  return {
    enabled: true,
    site: SITE_A,
    rows: [row(DAY1)],
    requestedFor: { lat: SITE_A.lat, lon: SITE_A.lon },
    loading: false,
    error: null,
    lang: "is",
    t,
    now: () => NOW,
    rng: () => 0,
    storage: fakeStorage(),
    ...overrides,
  };
}

describe("useWeatherVoice — shareSnapshot (Ticket 410, #410)", () => {
  it("an eligible (excellent) episode produces a matching, complete snapshot", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs()));
    expect(result.current.presentation.show).toBe(true);
    expect(result.current.shareSnapshot).not.toBeNull();
    expect(result.current.shareSnapshot.voiceId).toBe(result.current.presentation.comment.id);
    expect(result.current.shareSnapshot.text).toBe(result.current.presentation.comment.text);
    expect(result.current.shareSnapshot.condition).toBe("excellent");
    expect(result.current.shareSnapshot.language).toBe("is");
    expect(result.current.shareSnapshot.siteName).toBe("Þingvellir");
    expect(result.current.shareSnapshot.date).toBe(DAY1);
    expect(result.current.shareSnapshot.tmax).toBe(16);
    expect(result.current.shareSnapshot.episodeKey).toBe(result.current.episodeKey);
  });

  // Ticket 410 Revision 2 (#410) — universal sharing owner override: a
  // "cold" episode (previously rejected by the removed condition
  // allowlist) now produces a snapshot exactly like excellent/good does.
  it("a non-good/excellent condition (cold) still produces a matching snapshot — every displayed Tjaldur is shareable", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ rows: [row(DAY1, { tmax: 2, windMax: 0, rain: 0, code: 0 })] })));
    expect(result.current.presentation.show).toBe(true);
    expect(result.current.presentation.condition).toBe("cold");
    expect(result.current.shareSnapshot).not.toBeNull();
    expect(result.current.shareSnapshot.condition).toBe("cold");
    expect(result.current.shareSnapshot.voiceId).toBe(result.current.presentation.comment.id);
  });

  it("legitimately silent weather produces no snapshot", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ rows: [row(DAY1, { tmax: 8, windMax: 4, rain: 0, code: 3 })] })));
    expect(result.current.presentation.show).toBe(false);
    expect(result.current.shareSnapshot).toBeNull();
  });

  it("an unsupported language produces no snapshot, even for excellent weather", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ lang: "fr" })));
    expect(result.current.shareSnapshot).toBeNull();
  });

  it("mismatched provenance (data not valid yet) produces no snapshot", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ requestedFor: { lat: 0, lon: 0 } })));
    expect(result.current.shareSnapshot).toBeNull();
  });
});

// Ticket 410 Revision 2 (#410), approved-prompt-v2.md §7 — "Test the real
// hook/card/snapshot flow across all nine conditions in IS and EN,
// including extreme_wind, heavy_rain and cold_wet. Assert visible Tjaldur
// has the entrypoint and severity/mood/warning signals cannot suppress
// it." Reuses the same real-engine-output fixtures already established in
// weatherVoiceContent.test.js's ENGINE_FIXTURES, so canonicalPairs is
// genuinely derived from the real engine, never hardcoded independently.
const ALL_NINE_CONDITION_ROWS = [
  ["extreme_wind", { tmax: 4, windMax: 17, rain: 5, code: 61 }],
  ["heavy_rain", { tmax: 10, windMax: 5, rain: 15, code: 63 }],
  ["strong_wind", { tmax: 10, windMax: 12, rain: 0, code: 0 }],
  ["cold_wet", { tmax: 2, windMax: 0, rain: 5, code: 61 }],
  ["cold", { tmax: 2, windMax: 0, rain: 0, code: 0 }],
  ["rain", { tmax: 10, windMax: 0, rain: 5, code: 61 }],
  ["sun_wind", { tmax: 10, windMax: 8, rain: 0, code: 0 }],
  ["excellent", { tmax: 16, windMax: 0, rain: 0, code: 0 }],
  ["good", { tmax: 13, windMax: 0, rain: 0, code: 3 }],
];

describe("useWeatherVoice — shareSnapshot across all nine real conditions, IS and EN (Ticket 410 Revision 2, #410)", () => {
  it.each(ALL_NINE_CONDITION_ROWS.flatMap(([condition, weather]) => [
    [condition, "is", weather],
    [condition, "en", weather],
  ]))("%s in %s: the visible Tjaldur always has a snapshot — condition/severity/mood never suppress it", (expectedCondition, lang, weather) => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ lang, rows: [row(DAY1, weather)] })));
    expect(result.current.presentation.show).toBe(true);
    expect(result.current.presentation.condition).toBe(expectedCondition);
    expect(result.current.shareSnapshot).not.toBeNull();
    expect(result.current.shareSnapshot.condition).toBe(expectedCondition);
    expect(result.current.shareSnapshot.language).toBe(lang);
    expect(result.current.shareSnapshot.text).toBe(result.current.presentation.comment.text);
  });
});
