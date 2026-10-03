// Ticket 432 (#432) — real hook + real card: cautious/serious exposure emits
// weather_voice_viewed with voice_level, deduplicates per episode, and never
// writes joke-cooldown history. Sarcastic episodes keep their history write.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useWeatherVoice } from "./useWeatherVoice";
import WeatherVoiceCard from "../components/WeatherVoiceCard";
import { trackEvent } from "../lib/analytics";
import { WEATHER_VOICE_LEDGER } from "../test-fixtures/weatherVoiceLedger";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

const t = (k) => k;
const DAY1 = "2026-09-08";
const NOW = Date.UTC(2026, 8, 8, 12, 0, 0);
const SITE = { id: "site-a", lat: 64.1, lon: -21.9 };

class FakeIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {}
  trigger(entries) {
    this.callback(entries);
  }
}
FakeIntersectionObserver.instances = [];

function recordingStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: vi.fn((k, v) => map.set(k, v)),
  };
}

function Harness({ rows, lang, storage }) {
  const wv = useWeatherVoice({
    enabled: true,
    site: SITE,
    rows,
    requestedFor: { lat: SITE.lat, lon: SITE.lon },
    loading: false,
    error: null,
    lang,
    t,
    now: () => NOW,
    rng: () => 0,
    storage,
  });
  return (
    <WeatherVoiceCard
      result={wv.presentation}
      surface="homepage_decision"
      episodeKey={wv.episodeKey}
      action={wv.action}
      t={t}
      lang={lang}
      onVisible={wv.onVisible}
      shareSnapshot={wv.shareSnapshot}
    />
  );
}

function viewedCalls() {
  return trackEvent.mock.calls.filter((c) => c[0] === "weather_voice_viewed");
}

function row(overrides) {
  return { date: DAY1, tmax: 10, windMax: 5, rain: 15, code: 63, ...overrides };
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  trackEvent.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("cautious exposure (heavy rain, IS)", () => {
  it("renders the safety message, emits one viewed event with voice_level, and never writes joke history", () => {
    const storage = recordingStorage();
    render(<Harness rows={[row({})]} lang="is" storage={storage} />);
    expect(screen.getByText(/Mikil rigning er í spánni/)).toBeInTheDocument();

    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    const calls = viewedCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual({
      voice_id: "safety_heavy_rain",
      language: "is",
      severity: 2,
      weather_type: "heavy_rain",
      surface: "homepage_decision",
      voice_level: "cautious",
    });
    // Joke history is never written for cautious text. The supplement writes
    // only its own key, and only after its own exposure (asserted in its suite).
    expect(storage.setItem).not.toHaveBeenCalledWith("weather_voice_history_v1", expect.anything());
  });

  it("shows no share button for a cautious episode", () => {
    render(<Harness rows={[row({})]} lang="is" storage={recordingStorage()} />);
    expect(screen.queryByText("weatherVoiceShareButtonLabel")).toBeNull();
  });
});

describe("serious exposure (extreme wind, EN)", () => {
  it("emits the serious safety ID with voice_level serious and no joke history", () => {
    const storage = recordingStorage();
    render(<Harness rows={[row({ tmax: 4, windMax: 17, rain: 5, code: 61 })]} lang="en" storage={storage} />);
    expect(screen.getByText(/Very strong winds are forecast/)).toBeInTheDocument();

    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    const calls = viewedCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({ voice_id: "safety_extreme_wind", language: "en", severity: 3, weather_type: "extreme_wind", voice_level: "serious" });
    expect(storage.setItem).not.toHaveBeenCalledWith("weather_voice_history_v1", expect.anything());
  });
});

describe("sarcastic control episode keeps its joke history and tags voice_level", () => {
  it("records history and emits voice_level sarcastic for an excellent day", () => {
    const storage = recordingStorage();
    render(<Harness rows={[row({ tmax: 16, windMax: 0, rain: 0, code: 0 })]} lang="is" storage={storage} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);

    const calls = viewedCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][1].voice_level).toBe("sarcastic");
    const activeExcellent = WEATHER_VOICE_LEDGER.filter((r) => r.condition === "excellent" && (r.status === "retained" || r.status === "new")).map((r) => r.id);
    expect(activeExcellent).toContain(calls[0][1].voice_id);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
});
