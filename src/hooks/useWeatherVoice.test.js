// Ticket 408 (#408) — useWeatherVoice.js: today-only daily input, provenance
// gating, stable episode-keyed selection, and visibility-gated exposure
// recording. Uses the REAL Phase 1/2 modules throughout (real
// evaluateWeatherVoice, real IS library, real selector/history) — this is
// deliberately an integration-level suite, not a mocked unit test.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWeatherVoice, getReykjavikDateString, findTodayRow, buildWeatherVoiceEpisodeKey } from "./useWeatherVoice";

const DAY1 = "2026-09-08";
const DAY2 = "2026-09-09";
const NOW_DAY1 = Date.UTC(2026, 8, 8, 12, 0, 0); // Atlantic/Reykjavik has no DST -> equals UTC
const NOW_DAY2 = Date.UTC(2026, 8, 9, 12, 0, 0);

const SITE_A = { id: "site-a", lat: 64.1, lon: -21.9 };
const SITE_B = { id: "site-b", lat: 65.5, lon: -18.1 };

function row(date, overrides = {}) {
  return { date, tmax: 8, windMax: 4, rain: 0, code: 3, ...overrides }; // ordinary/silent by default
}

const EXCELLENT_ROW = (date) => row(date, { tmax: 16, windMax: 0, rain: 0, code: 0 }); // excellent/excellent/0
const COLD_ROW = (date) => row(date, { tmax: 2, windMax: 0, rain: 0, code: 0 }); // cold/freezing/1

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    _dump: () => Object.fromEntries(map),
  };
}

const t = (k) => k;

function baseArgs(overrides = {}) {
  return {
    enabled: true,
    site: SITE_A,
    rows: [EXCELLENT_ROW(DAY1)],
    requestedFor: { lat: SITE_A.lat, lon: SITE_A.lon },
    loading: false,
    error: null,
    lang: "is",
    t,
    now: () => NOW_DAY1,
    rng: () => 0,
    storage: fakeStorage(),
    ...overrides,
  };
}

describe("useWeatherVoice — pure helpers", () => {
  it("getReykjavikDateString formats YYYY-MM-DD for Atlantic/Reykjavik", () => {
    expect(getReykjavikDateString(NOW_DAY1)).toBe(DAY1);
    expect(getReykjavikDateString(NOW_DAY2)).toBe(DAY2);
  });

  it("findTodayRow requires an exact match, never rows[0] or a substitute day", () => {
    const rows = [row(DAY2), row("2026-09-10")];
    expect(findTodayRow(rows, DAY1)).toBeNull(); // today's row missing -> null, not rows[0]
    expect(findTodayRow(rows, DAY2)).toEqual(rows[0]);
  });

  it("buildWeatherVoiceEpisodeKey is null for a silent/malformed engine result", () => {
    expect(buildWeatherVoiceEpisodeKey({ surface: "s", siteId: "a", dateString: DAY1, lang: "is", engineResult: { show: false } })).toBeNull();
  });

  it("buildWeatherVoiceEpisodeKey changes when any component changes", () => {
    const base = { surface: "s", siteId: "a", dateString: DAY1, lang: "is", engineResult: { show: true, condition: "good", mood: "happy", severity: 0 } };
    const key = buildWeatherVoiceEpisodeKey(base);
    expect(buildWeatherVoiceEpisodeKey({ ...base, siteId: "b" })).not.toBe(key);
    expect(buildWeatherVoiceEpisodeKey({ ...base, dateString: DAY2 })).not.toBe(key);
    expect(buildWeatherVoiceEpisodeKey({ ...base, lang: "en" })).not.toBe(key);
    expect(buildWeatherVoiceEpisodeKey({ ...base, engineResult: { ...base.engineResult, severity: 1 } })).not.toBe(key);
  });
});

describe("useWeatherVoice — real Phase 1/2 outputs and today-only scope", () => {
  it("a real excellent-producing row selects a real active presentation from the real IS library", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs()));
    expect(result.current.presentation).toMatchObject({ show: true, condition: "excellent", mood: "excellent", severity: 0 });
    expect(typeof result.current.presentation.comment.text).toBe("string");
    expect(result.current.presentation.comment.text.length).toBeGreaterThan(0);
  });

  // Revision 2 (#408, Jonesy Round 1 BLOCKED): an earlier pass auto-supplied
  // a nine-condition "supportingText" from this hook without review. That
  // hookup is removed; the hook never returns a supportingText value —
  // WeatherVoiceCard.jsx's supportingText prop is a seam for a future,
  // deliberately-reviewed content source, not something this hook produces.
  it("never returns a supportingText value — the seam exists only in the renderer, not auto-populated here", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs()));
    expect(result.current.presentation.show).toBe(true);
    expect(result.current.supportingText).toBeUndefined();
    expect(Object.keys(result.current).sort()).toEqual(["action", "episodeKey", "onVisible", "presentation"]);
  });

  it("ordinary weather stays silent (real Phase 1 silence, not a content-availability failure)", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ rows: [row(DAY1)] })));
    expect(result.current.presentation).toEqual({ show: false });
  });

  // Ticket 412 (#412): EN is no longer the deliberately-empty MVP
  // placeholder — a real excellent-producing row now selects a real
  // active EN presentation too, mirroring the IS test above exactly.
  it("a real excellent-producing row selects a real active presentation from the real EN library too", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ lang: "en" })));
    expect(result.current.presentation).toMatchObject({ show: true, condition: "excellent", mood: "excellent", severity: 0 });
    expect(typeof result.current.presentation.comment.text).toBe("string");
    expect(result.current.presentation.comment.text.length).toBeGreaterThan(0);
  });

  it("an unsupported language never falls back to IS — a genuinely active Phase 1 result stays silent for lang=fr (real getWeatherVoiceLibrary behavior, not a content fixture)", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ lang: "fr" })));
    expect(result.current.presentation).toEqual({ show: false });
  });

  it("missing today's row (present for other days) stays silent, never substitutes another day", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ rows: [EXCELLENT_ROW(DAY2)] })));
    expect(result.current.presentation).toEqual({ show: false });
  });

  it("loading=true suppresses selection/exposure even with an otherwise-valid row", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ loading: true })));
    expect(result.current.presentation).toEqual({ show: false });
  });

  it("a non-null error suppresses selection/exposure", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ error: new Error("boom") })));
    expect(result.current.presentation).toEqual({ show: false });
  });

  it("stale provenance (requestedFor doesn't match the current site) suppresses selection even with matching rows present", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ requestedFor: { lat: 999, lon: 999 } })));
    expect(result.current.presentation).toEqual({ show: false });
  });

  it("enabled=false (suppressed route) never selects, regardless of otherwise-valid data", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ enabled: false })));
    expect(result.current.presentation).toEqual({ show: false });
  });
});

describe("useWeatherVoice — site-change safety (no wrong-site content/exposure)", () => {
  it("the first render after a site change — before requestedFor/rows catch up — synchronously hides the old site's content", () => {
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: baseArgs() });
    expect(result.current.presentation.show).toBe(true); // site A active

    // Simulate the exact hazard: `site` has changed to B, but `requestedFor`
    // and `rows` are still A's (the render before useForecast's effect resolves).
    rerender(baseArgs({ site: SITE_B }));
    expect(result.current.presentation).toEqual({ show: false });
  });

  it("switching to a new site with genuinely matching provenance/rows starts a new episode", () => {
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: baseArgs() });
    expect(result.current.presentation.show).toBe(true);

    rerender(baseArgs({ site: SITE_B, requestedFor: { lat: SITE_B.lat, lon: SITE_B.lon }, rows: [COLD_ROW(DAY1)] }));
    expect(result.current.presentation).toMatchObject({ show: true, condition: "cold", mood: "freezing", severity: 1 });
  });

  it("rapid A->B->C switching never shows a mismatched site's content at any point", () => {
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: baseArgs() });
    expect(result.current.presentation.show).toBe(true);

    // B: site changes, provenance/rows lag (still A's) -> must hide.
    rerender(baseArgs({ site: SITE_B }));
    expect(result.current.presentation).toEqual({ show: false });

    // C: a third site, still nothing caught up -> must still hide.
    const SITE_C = { id: "site-c", lat: 1, lon: 1 };
    rerender(baseArgs({ site: SITE_C }));
    expect(result.current.presentation).toEqual({ show: false });

    // Finally C's own data catches up -> genuinely active for C only.
    rerender(baseArgs({ site: SITE_C, requestedFor: { lat: 1, lon: 1 }, rows: [EXCELLENT_ROW(DAY1)] }));
    expect(result.current.presentation.show).toBe(true);
  });
});

describe("useWeatherVoice — stability: no reselection/duplicate exposure across unrelated changes", () => {
  it("StrictMode selects exactly once per episode (RNG called once, not twice)", () => {
    const rng = vi.fn(() => 0);
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ rng })), { wrapper: React.StrictMode });
    expect(result.current.presentation.show).toBe(true);
    expect(rng).toHaveBeenCalledTimes(1);
  });

  it("a same-valued NEW rows array/object reference does not trigger reselection", () => {
    const rng = vi.fn(() => 0);
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: baseArgs({ rng }) });
    const firstId = result.current.presentation.comment.id;

    rerender(baseArgs({ rng, rows: [EXCELLENT_ROW(DAY1)] })); // new array + new row object, same values
    expect(result.current.presentation.comment.id).toBe(firstId);
    expect(rng).toHaveBeenCalledTimes(1);
  });

  it("an unrelated rerender with identical props does not rotate or duplicate", () => {
    const rng = vi.fn(() => 0);
    const args = baseArgs({ rng });
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: args });
    const firstId = result.current.presentation.comment.id;
    rerender(args);
    rerender(args);
    expect(result.current.presentation.comment.id).toBe(firstId);
    expect(rng).toHaveBeenCalledTimes(1);
  });

  it("a temporary loading state hides the row but does not rotate the same episode when it returns", () => {
    const rng = vi.fn(() => 0);
    const args = baseArgs({ rng });
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: args });
    const firstId = result.current.presentation.comment.id;

    rerender({ ...args, loading: true });
    expect(result.current.presentation).toEqual({ show: false });

    rerender(args); // loading resolves, same underlying episode
    expect(result.current.presentation.comment.id).toBe(firstId);
    expect(rng).toHaveBeenCalledTimes(1); // never reselected
  });

  it("a genuine outcome change (different weather) starts a NEW episode and may select again", () => {
    const rng = vi.fn(() => 0);
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: baseArgs({ rng }) });
    expect(result.current.presentation.condition).toBe("excellent");

    rerender(baseArgs({ rng, rows: [COLD_ROW(DAY1)] }));
    expect(result.current.presentation).toMatchObject({ condition: "cold" });
    expect(rng).toHaveBeenCalledTimes(2); // one call per distinct episode
  });
});

describe("useWeatherVoice — midnight refresh with fake time", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("crossing midnight (Reykjavik) re-evaluates today's row and may start a new episode", () => {
    let currentTime = NOW_DAY1;
    const now = () => currentTime;
    const rng = vi.fn(() => 0);

    const { result, rerender } = renderHook((props) => useWeatherVoice(props), {
      initialProps: baseArgs({ now, rng, rows: [EXCELLENT_ROW(DAY1), COLD_ROW(DAY2)] }),
    });
    expect(result.current.presentation).toMatchObject({ condition: "excellent" });

    currentTime = NOW_DAY2;
    act(() => {
      vi.advanceTimersByTime(60000); // the hook's own midnight-eligibility poll interval
    });
    // rerender with the same props (rows now genuinely contain tomorrow's
    // day too, as a real caller's data would) so the new todayDate is used.
    rerender(baseArgs({ now, rng, rows: [EXCELLENT_ROW(DAY1), COLD_ROW(DAY2)] }));

    expect(result.current.presentation).toMatchObject({ condition: "cold" });
  });

  it("the midnight timer is cleaned up on unmount (no leaked interval)", () => {
    const clearSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = renderHook(() => useWeatherVoice(baseArgs()));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});

describe("useWeatherVoice — visibility-gated exposure recording", () => {
  it("selection alone (without calling onVisible) never writes to storage", () => {
    const storage = fakeStorage();
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ storage })));
    expect(result.current.presentation.show).toBe(true);
    expect(storage._dump()).toEqual({});
  });

  it("a suppressed (enabled=false) episode never writes even if onVisible is called with its own episodeKey", () => {
    const storage = fakeStorage();
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ enabled: false, storage })));
    act(() => result.current.onVisible(result.current.episodeKey));
    expect(storage._dump()).toEqual({});
  });

  it("show:false (ordinary weather) never writes even if onVisible is called with its own episodeKey", () => {
    const storage = fakeStorage();
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ rows: [row(DAY1)], storage })));
    act(() => result.current.onVisible(result.current.episodeKey));
    expect(storage._dump()).toEqual({});
  });

  it("onVisible with no argument, or a bare/unrelated string, is rejected — a bare signal is not evidence of the current episode", () => {
    const storage = fakeStorage();
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ storage })));
    expect(result.current.presentation.show).toBe(true);
    act(() => result.current.onVisible());
    act(() => result.current.onVisible("totally-unrelated-key"));
    expect(storage._dump()).toEqual({});
  });

  it("onVisible(episodeKey) for a genuinely visible, committed episode writes exactly once", () => {
    const storage = fakeStorage();
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ storage })));
    const id = result.current.presentation.comment.id;
    const key = result.current.episodeKey;

    act(() => result.current.onVisible(key));
    act(() => result.current.onVisible(key)); // repeated call (e.g. re-intersection) — still exactly one record

    const dump = storage._dump();
    const persisted = JSON.parse(dump["weather_voice_history_v1"]);
    expect(Object.keys(persisted.records)).toEqual([id]);
  });

  // Revision 3 (#408, Ripley Revision 2 REVISE) — the contract changed: a
  // stale onVisible call must now be identified by the STALE episodeKey it
  // captured, not merely be "a function reference called late". Calling
  // the OLD reference WITH the OLD episodeKey after the episode has moved
  // on must be rejected outright — it must never retroactively record
  // against whatever is current now, and it must never record its own
  // (no-longer-current) episode either, since that episode was never
  // actually confirmed visible under the NEW contract.
  it("a stale onVisible call, reporting the OLD episodeKey after switching to a new episode, is rejected entirely", () => {
    const storage = fakeStorage();
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: baseArgs({ storage }) });
    const staleOnVisible = result.current.onVisible; // captured while episode A (excellent) is active
    const staleKey = result.current.episodeKey; // captured at the same time — what a real observer would report

    rerender(baseArgs({ storage, rows: [COLD_ROW(DAY1)] })); // new episode (cold)
    const newKey = result.current.episodeKey;
    expect(newKey).not.toBe(staleKey);

    act(() => staleOnVisible(staleKey)); // the OLD reference, reporting the OLD (now-stale) episode identity

    expect(storage._dump()).toEqual({}); // rejected — neither episode gets a record from this stale call
  });

  it("onVisible(currentKey) still works correctly after a stale call was rejected — the new episode can still be recorded on its own genuine observation", () => {
    const storage = fakeStorage();
    const { result, rerender } = renderHook((props) => useWeatherVoice(props), { initialProps: baseArgs({ storage }) });
    const staleOnVisible = result.current.onVisible;
    const staleKey = result.current.episodeKey;

    rerender(baseArgs({ storage, rows: [COLD_ROW(DAY1)] }));
    const newId = result.current.presentation.comment.id;
    const newKey = result.current.episodeKey;

    act(() => staleOnVisible(staleKey)); // rejected, as above
    act(() => result.current.onVisible(newKey)); // a genuine observation of the NEW episode

    const persisted = JSON.parse(storage._dump()["weather_voice_history_v1"]);
    expect(Object.keys(persisted.records)).toEqual([newId]);
  });

  it("storage getter/read/write failure remains nonfatal — selection and exposure still complete", () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error("boom");
      },
      setItem: () => {
        throw new Error("boom");
      },
    };
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ storage: throwingStorage })));
    expect(() => act(() => result.current.onVisible(result.current.episodeKey))).not.toThrow();
    expect(result.current.presentation.show).toBe(true);
  });
});

describe("useWeatherVoice — optional CTA seam", () => {
  it("null-CTA production content (real IS library) never produces an action", () => {
    const { result } = renderHook(() => useWeatherVoice(baseArgs({ onExplore: vi.fn() })));
    expect(result.current.presentation.show).toBe(true);
    expect(result.current.presentation.ctaType).toBeNull();
    expect(result.current.action).toBeNull();
  });
});
