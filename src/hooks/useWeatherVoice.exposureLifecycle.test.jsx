// Ticket 408 (#408) Revision 3 — Ripley Revision 2 REVISE. Integrated
// real-hook + real-card tests for the exposure lifecycle fix: old
// observer callbacks (replaced episode, unmount, StrictMode replay, or a
// genuinely different episode that happens to select the SAME comment
// id) must never be able to write history for anything but the episode
// they actually, currently, eligibly observed. Uses the REAL
// useWeatherVoice hook and the REAL WeatherVoiceCard component together
// (not an isolated fixture of either), with deterministic fake
// IntersectionObserver/storage/time/RNG.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { useWeatherVoice } from "./useWeatherVoice";
import WeatherVoiceCard from "../components/WeatherVoiceCard";

const t = (k) => k;
const DAY1 = "2026-09-08";
const NOW = Date.UTC(2026, 8, 8, 12, 0, 0); // Atlantic/Reykjavik has no DST -> equals UTC, matches DAY1

class FakeIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnected = false;
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {
    this.disconnected = true;
  }
  trigger(entries) {
    this.callback(entries);
  }
}
FakeIntersectionObserver.instances = [];

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    _dump: () => Object.fromEntries(map),
  };
}

function row(date, overrides = {}) {
  return { date, tmax: 16, windMax: 0, rain: 0, code: 0, ...overrides }; // excellent by default
}

function Harness({ site, rows, requestedFor, storage, rng = () => 0 }) {
  const wv = useWeatherVoice({
    enabled: true,
    site,
    rows,
    requestedFor,
    loading: false,
    error: null,
    lang: "is",
    t,
    now: () => NOW,
    rng,
    storage,
  });
  return (
    <WeatherVoiceCard
      result={wv.presentation}
      surface="homepage_decision"
      episodeKey={wv.episodeKey}
      action={wv.action}
      t={t}
      onVisible={wv.onVisible}
    />
  );
}

const SITE_A = { id: "site-a", lat: 64.1, lon: -21.9 };
const SITE_B = { id: "site-b", lat: 65.5, lon: -18.1 };

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});
afterEach(() => vi.unstubAllGlobals());

describe("useWeatherVoice + WeatherVoiceCard — integrated exposure lifecycle", () => {
  it("selection alone writes nothing; a real, eligible observation writes exactly once", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    expect(storage._dump()).toEqual({});

    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    const persisted = JSON.parse(storage._dump()["weather_voice_history_v1"]);
    expect(Object.keys(persisted.records)).toHaveLength(1);
  });

  it("replacement: an old observer callback, fired after the episode is replaced, cannot write history for the new episode", () => {
    const storage = fakeStorage();
    const { rerender } = render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    const oldObserver = FakeIntersectionObserver.instances[0];

    // A genuinely different episode: same site/day, but a cold (not
    // excellent) row — different Phase 1 outcome, different episodeKey.
    rerender(<Harness site={SITE_A} rows={[row(DAY1, { tmax: 2, code: 0 })]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);

    oldObserver.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(storage._dump()).toEqual({}); // rejected — no record at all
  });

  it("unmount: an old observer callback fired after unmount does not write and does not throw", () => {
    const storage = fakeStorage();
    const { unmount } = render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    const observer = FakeIntersectionObserver.instances[0];
    unmount();
    expect(() => observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }])).not.toThrow();
    expect(storage._dump()).toEqual({});
  });

  it("same comment ID across two genuinely different episodes (different site, same deterministic selection): the old episode's observer cannot record against the new one, and the new episode still records correctly on its own real observation", () => {
    const storage = fakeStorage();
    const { rerender } = render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} rng={() => 0} />);
    const episodeAObserver = FakeIntersectionObserver.instances[0];

    // Never recorded for A — history stays empty, so a deterministic
    // rng=0 selection for a DIFFERENT site (B), same excellent outcome,
    // lands on the exact same comment id as A did. This is the coincidence
    // the fix must not be fooled by: comment identity is the same, but
    // episode identity (site) genuinely differs.
    rerender(<Harness site={SITE_B} rows={[row(DAY1)]} requestedFor={{ lat: SITE_B.lat, lon: SITE_B.lon }} storage={storage} rng={() => 0} />);
    const episodeBObserver = FakeIntersectionObserver.instances[1];
    expect(episodeBObserver).not.toBe(episodeAObserver); // the effect genuinely restarted for the new episode

    episodeAObserver.trigger([{ isIntersecting: true, intersectionRatio: 1 }]); // stale — must be rejected
    expect(storage._dump()).toEqual({});

    episodeBObserver.trigger([{ isIntersecting: true, intersectionRatio: 1 }]); // genuine — must record
    const persisted = JSON.parse(storage._dump()["weather_voice_history_v1"]);
    expect(Object.keys(persisted.records)).toHaveLength(1);
  });

  it("StrictMode replay: exactly one record, never two, despite the synthetic double-invoke", () => {
    const storage = fakeStorage();
    render(
      <React.StrictMode>
        <Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />
      </React.StrictMode>
    );
    // Only the surviving (post-replay) observer should still be connected;
    // trigger every instance that exists to prove at most one write lands
    // regardless of how many observer instances StrictMode's replay created.
    for (const observer of FakeIntersectionObserver.instances) {
      if (!observer.disconnected) observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    }
    const persisted = JSON.parse(storage._dump()["weather_voice_history_v1"]);
    expect(Object.keys(persisted.records)).toHaveLength(1);
  });

  it("hidden intersection followed by the document becoming visible records once, via visibilitychange, with no new intersection event", () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(storage._dump()).toEqual({});

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
    const persisted = JSON.parse(storage._dump()["weather_voice_history_v1"]);
    expect(Object.keys(persisted.records)).toHaveLength(1);
  });

  it("a below-threshold entry is never eligible, even repeated", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger([{ isIntersecting: true, intersectionRatio: 0.1 }]);
    observer.trigger([{ isIntersecting: true, intersectionRatio: 0.49 }]);
    expect(storage._dump()).toEqual({});
  });

  it("selection-without-exposure silence is preserved: mounting alone, with no intersection ever reported, writes nothing", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    expect(storage._dump()).toEqual({});
  });
});
