// Ticket 409 (#409) — weather_voice_viewed analytics integration tests.
// Uses the REAL useWeatherVoice hook wired to the REAL WeatherVoiceCard
// (not an isolated fixture of either), with a mocked `trackEvent` so no
// real GA4 call is ever attempted, and a deterministic fake
// IntersectionObserver/storage/time/RNG — mirrors
// useWeatherVoice.exposureLifecycle.test.jsx's harness exactly, since the
// analytics call sits at the identical already-validated exposure
// boundary as history recording.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { useWeatherVoice } from "./useWeatherVoice";
import WeatherVoiceCard from "../components/WeatherVoiceCard";
import { trackEvent } from "../lib/analytics";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

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

// Ordinary weather the Phase 1 engine does not classify — legitimate silence.
function silentRow(date) {
  return { date, tmax: 8, windMax: 4, rain: 0, code: 3 };
}

function Harness({ site, rows, requestedFor, storage, rng = () => 0, lang = "is", enabled = true }) {
  const wv = useWeatherVoice({
    enabled,
    site,
    rows,
    requestedFor,
    loading: false,
    error: null,
    lang,
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

function weatherVoiceViewedCalls() {
  return trackEvent.mock.calls.filter((c) => c[0] === "weather_voice_viewed");
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  trackEvent.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("weather_voice_viewed — no event on selection/below-threshold/hidden/invalid/silent", () => {
  it("selection alone (no intersection ever reported) never emits", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    expect(weatherVoiceViewedCalls()).toHaveLength(0);
  });

  it("a below-threshold intersection never emits, even repeated", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger([{ isIntersecting: true, intersectionRatio: 0.1 }]);
    observer.trigger([{ isIntersecting: true, intersectionRatio: 0.49 }]);
    expect(weatherVoiceViewedCalls()).toHaveLength(0);
  });

  it("an eligible intersection while the document is hidden never emits", () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(weatherVoiceViewedCalls()).toHaveLength(0);
  });

  it("mismatched provenance (data not yet valid for the current site) never emits — no card, no observer at all", () => {
    const storage = fakeStorage();
    render(
      <Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_B.lat, lon: SITE_B.lon }} storage={storage} />,
    );
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(weatherVoiceViewedCalls()).toHaveLength(0);
  });

  it("legitimately silent (ordinary, non-comment-worthy) weather never emits — no card, no observer at all", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[silentRow(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(weatherVoiceViewedCalls()).toHaveLength(0);
  });
});

describe("weather_voice_viewed — exact payload on valid exposure", () => {
  it("fires exactly once, with exactly the documented fields and no PII/free-text/site/coordinate/timestamp/episode-key fields", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} lang="is" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    const calls = weatherVoiceViewedCalls();
    expect(calls).toHaveLength(1);
    const [name, payload] = calls[0];
    expect(name).toBe("weather_voice_viewed");

    expect(Object.keys(payload).sort()).toEqual(["language", "severity", "surface", "voice_id", "weather_type"]);
    expect(payload).toEqual({
      voice_id: "excellent_01", // deterministic: rng=()=>0, condition=excellent/mood=excellent, first-by-id ascending
      language: "is",
      severity: 0,
      weather_type: "excellent",
      surface: "homepage_decision",
    });

    // Explicitly confirm the absence of anything the approved prompt forbids.
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("site-a");
    expect(serialized).not.toContain(String(SITE_A.lat));
    expect(serialized).not.toContain(String(SITE_A.lon));
    expect(serialized).not.toContain(DAY1);
    expect(payload.voice_id).not.toMatch(/\|/); // never the full episode key
  });

  it("both history and analytics correspond to the same real observation (never diverge)", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} lang="is" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    const persisted = JSON.parse(storage._dump()["weather_voice_history_v1"]);
    const [, payload] = weatherVoiceViewedCalls()[0];
    expect(Object.keys(persisted.records)).toEqual([payload.voice_id]);
  });
});

describe("weather_voice_viewed — at-most-once semantics per observed episode within one mount", () => {
  it("repeated intersection/visibilitychange triggers never duplicate", () => {
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(weatherVoiceViewedCalls()).toHaveLength(1);
  });

  it("StrictMode's synthetic double-invoke never duplicates", () => {
    const storage = fakeStorage();
    render(
      <React.StrictMode>
        <Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />
      </React.StrictMode>,
    );
    for (const observer of FakeIntersectionObserver.instances) {
      if (!observer.disconnected) observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    }
    expect(weatherVoiceViewedCalls()).toHaveLength(1);
  });

  it("a rerender with unchanged props/episode does not re-arm a second emission", () => {
    const storage = fakeStorage();
    const { rerender } = render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    rerender(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    for (const observer of FakeIntersectionObserver.instances) {
      if (!observer.disconnected) observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    }
    expect(weatherVoiceViewedCalls()).toHaveLength(1);
  });
});

describe("weather_voice_viewed — stale callbacks after episode change or unmount are rejected", () => {
  it("site change: a stale observer from the old episode cannot emit for the new one", () => {
    const storage = fakeStorage();
    const { rerender } = render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    const oldObserver = FakeIntersectionObserver.instances[0];

    rerender(<Harness site={SITE_A} rows={[row(DAY1, { tmax: 2, code: 0 })]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    oldObserver.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(weatherVoiceViewedCalls()).toHaveLength(0);
  });

  it("locale change: a stale IS observer cannot emit for the new EN episode, and the new one still fires correctly with the right language", () => {
    const storage = fakeStorage();
    const { rerender } = render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} lang="is" />);
    const oldObserver = FakeIntersectionObserver.instances[0];

    rerender(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} lang="en" />);
    oldObserver.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(weatherVoiceViewedCalls()).toHaveLength(0); // stale IS observer rejected

    const newObserver = FakeIntersectionObserver.instances.at(-1);
    newObserver.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    const calls = weatherVoiceViewedCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][1].language).toBe("en");
  });

  it("unmount: a stale callback fired after unmount neither emits nor throws", () => {
    const storage = fakeStorage();
    const { unmount } = render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    const observer = FakeIntersectionObserver.instances[0];
    unmount();
    expect(() => observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }])).not.toThrow();
    expect(weatherVoiceViewedCalls()).toHaveLength(0);
  });
});

describe("weather_voice_viewed — a new observed episode gets its own correct language/voice_id", () => {
  it("switching to a genuinely different episode (different site, same excellent outcome) fires a second, independent event", () => {
    const storage = fakeStorage();
    const { rerender } = render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} rng={() => 0} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    rerender(<Harness site={SITE_B} rows={[row(DAY1)]} requestedFor={{ lat: SITE_B.lat, lon: SITE_B.lon }} storage={storage} rng={() => 0} />);
    FakeIntersectionObserver.instances.at(-1).trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    const calls = weatherVoiceViewedCalls();
    expect(calls).toHaveLength(2);
    // Same deterministic rng/condition/mood -> same voice_id both times is
    // expected and fine (that's the "shared comment id across genuinely
    // different episodes" case #408 already handles at the history layer);
    // what matters here is that BOTH episodes independently got their own
    // real, correctly-attributed event, not a fabricated de-duplication.
    expect(calls[0][1].weather_type).toBe("excellent");
    expect(calls[1][1].weather_type).toBe("excellent");
  });
});

describe("weather_voice_viewed — revisiting an already-recorded episode follows the documented dedup policy", () => {
  it("IS -> EN -> IS for identical weather: exactly two events (the final IS step revisits the SAME episodeKey as step 1, which is documented as deduplicated, not a fresh impression)", () => {
    const storage = fakeStorage();
    const props = { site: SITE_A, rows: [row(DAY1)], requestedFor: { lat: SITE_A.lat, lon: SITE_A.lon }, storage };

    const { rerender } = render(<Harness {...props} lang="is" />);
    FakeIntersectionObserver.instances.at(-1).trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    rerender(<Harness {...props} lang="en" />);
    FakeIntersectionObserver.instances.at(-1).trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    rerender(<Harness {...props} lang="is" />);
    FakeIntersectionObserver.instances.at(-1).trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    const calls = weatherVoiceViewedCalls();
    expect(calls).toHaveLength(2);
    expect(calls.map((c) => c[1].language)).toEqual(["is", "en"]);
  });
});

describe("weather_voice_viewed — analytics-helper-throw isolation", () => {
  it("a throwing trackEvent does not prevent history recording, does not throw out of the observer callback, and does not retry", () => {
    trackEvent.mockImplementationOnce(() => {
      throw new Error("analytics transport exploded");
    });
    const storage = fakeStorage();
    render(<Harness site={SITE_A} rows={[row(DAY1)]} requestedFor={{ lat: SITE_A.lat, lon: SITE_A.lon }} storage={storage} />);
    const observer = FakeIntersectionObserver.instances[0];

    expect(() => observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }])).not.toThrow();

    // History still recorded despite the analytics throw.
    const persisted = JSON.parse(storage._dump()["weather_voice_history_v1"]);
    expect(Object.keys(persisted.records)).toHaveLength(1);

    // The one attempted call is recorded (it fired and threw internally,
    // caught by the hook's own try/catch) — exactly one attempt.
    expect(weatherVoiceViewedCalls()).toHaveLength(1);

    // No retry: triggering again does not attempt a second call for this
    // same, already-recorded episode (the dedup guard runs before the
    // analytics call, regardless of whether the prior attempt threw).
    observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(weatherVoiceViewedCalls()).toHaveLength(1);
  });
});
