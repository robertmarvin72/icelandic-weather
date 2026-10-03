// Ticket 420 (#420) Part B — real useWeatherVoice hook + real WeatherVoiceCard:
// supplement failure isolation (R1), eligibility (R4), separate exposure
// observer and event (R5), separate history key (R6), warning-only rollback.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useWeatherVoice } from "./useWeatherVoice";
import WeatherVoiceCard from "../components/WeatherVoiceCard";
import { trackEvent } from "../lib/analytics";
import { weatherVoiceSupplements } from "../i18n/weatherVoice/supplement";
import { WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY } from "../lib/weatherVoiceSupplementHistory";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

const t = (k) => k;
const DAY1 = "2026-09-08";
const NOW = Date.UTC(2026, 8, 8, 12, 0, 0);
const SITE = { id: "site-a", lat: 64.1, lon: -21.9 };
const SITE_B = { id: "site-b", lat: 65.5, lon: -18.1 };
const ZERO_RNG = () => 0;
const NOW_FN = () => NOW;
const REGISTRY = weatherVoiceSupplements;
const EMPTY = [];

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
  trigger(ratio) {
    this.callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]);
  }
}
FakeIntersectionObserver.instances = [];

function recordingStorage(overrides = {}) {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: vi.fn((k, v) => map.set(k, v)),
    ...overrides,
  };
}

function row(overrides = {}) {
  return { date: DAY1, tmax: 10, windMax: 5, rain: 15, code: 63, ...overrides }; // heavy_rain, cautious
}

function Harness({ rows, lang = "is", storage, supplementRegistry = REGISTRY, rng = ZERO_RNG, site = SITE, onHook }) {
  const wv = useWeatherVoice({
    enabled: true,
    site,
    rows,
    requestedFor: { lat: site.lat, lon: site.lon },
    loading: false,
    error: null,
    lang,
    t,
    now: NOW_FN,
    rng,
    storage,
    supplementRegistry,
  });
  onHook?.(wv);
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
      supplement={wv.supplement}
      onSupplementVisible={wv.onSupplementVisible}
    />
  );
}

function calls(name) {
  return trackEvent.mock.calls.filter((c) => c[0] === name);
}

function cardObserver() {
  return FakeIntersectionObserver.instances[0];
}

function supplementObserver() {
  return FakeIntersectionObserver.instances[1];
}

function viewPrimary() {
  cardObserver().trigger(1);
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  trackEvent.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("R1 — supplement failure never reaches the primary warning", () => {
  it("a throwing registry leaves the warning visible, the primary event unchanged, and no supplement", () => {
    const throwingRegistry = new Proxy([], {
      get() {
        throw new Error("registry exploded");
      },
    });
    render(<Harness rows={[row()]} storage={recordingStorage()} supplementRegistry={throwingRegistry} />);
    expect(screen.getByText(/Mikil rigning er í spánni/)).toBeInTheDocument();
    expect(document.querySelector("[data-weather-voice-supplement]")).toBeNull();
    viewPrimary();
    expect(calls("weather_voice_viewed")).toHaveLength(1);
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(0);
  });

  it("a throwing rng leaves the warning visible and the primary event unchanged", () => {
    const throwingRng = () => {
      throw new Error("rng exploded");
    };
    render(<Harness rows={[row()]} storage={recordingStorage()} rng={throwingRng} />);
    expect(screen.getByText(/Mikil rigning er í spánni/)).toBeInTheDocument();
    viewPrimary();
    expect(calls("weather_voice_viewed")).toHaveLength(1);
    expect(calls("weather_voice_viewed")[0][1].voice_id).toBe("safety_heavy_rain");
  });

  it("a throwing getItem and setItem leave the warning visible, and the primary event fires once", () => {
    const throwing = recordingStorage({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    });
    render(<Harness rows={[row()]} storage={throwing} />);
    expect(screen.getByText(/Mikil rigning er í spánni/)).toBeInTheDocument();
    viewPrimary();
    supplementObserver()?.trigger(1);
    expect(calls("weather_voice_viewed")).toHaveLength(1);
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(1);
    expect(screen.getByText(/Mikil rigning er í spánni/)).toBeInTheDocument();
  });

  it.each([
    ["blank IS text", [{ ...REGISTRY[0], text_is: "   " }]],
    ["blank EN text (wrong language field)", [{ ...REGISTRY[0], text_en: "" }]],
    ["duplicate ID", [REGISTRY[0], { ...REGISTRY[0], text_is: "other" }]],
    ["collision with a joke ID", [{ ...REGISTRY[0], id: "good_01" }]],
    ["collision with a retired ID", [{ ...REGISTRY[0], id: "cold_02" }]],
    ["collision with the safety ID", [{ ...REGISTRY[0], id: "safety_heavy_rain" }]],
  ])("a malformed supplement entry (%s) leaves the warning visible and the primary event unchanged", (_label, registry) => {
    render(<Harness rows={[row()]} storage={recordingStorage()} supplementRegistry={registry} />);
    expect(screen.getByText(/Mikil rigning er í spánni/)).toBeInTheDocument();
    viewPrimary();
    expect(calls("weather_voice_viewed")).toHaveLength(1);
  });

  it("an empty registry (the rollback path) produces a warning-only card with no supplement observer", () => {
    render(<Harness rows={[row()]} storage={recordingStorage()} supplementRegistry={EMPTY} />);
    expect(screen.getByText(/Mikil rigning er í spánni/)).toBeInTheDocument();
    expect(document.querySelector("[data-weather-voice-supplement]")).toBeNull();
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    viewPrimary();
    expect(calls("weather_voice_viewed")).toHaveLength(1);
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(0);
  });
});

describe("R4 — eligibility is derived; the negatives get no supplement", () => {
  it.each([
    ["extreme_wind (windMax above 15 takes precedence)", row({ tmax: 4, windMax: 17, rain: 5, code: 61 }), "safety_extreme_wind"],
    ["strong_wind", row({ tmax: 10, windMax: 12, rain: 0, code: 0 }), "safety_strong_wind"],
    ["cold_wet", row({ tmax: 2, windMax: 0, rain: 5, code: 61 }), "safety_cold_wet"],
  ])("%s shows its own safety message and no supplement", (_label, weather, safetyId) => {
    render(<Harness rows={[weather]} storage={recordingStorage()} />);
    expect(document.querySelector("[data-weather-voice-supplement]")).toBeNull();
    viewPrimary();
    expect(calls("weather_voice_viewed")[0][1].voice_id).toBe(safetyId);
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(0);
  });

  it("a heavy-rain episode in EN shows the supplement under the English warning", () => {
    render(<Harness rows={[row()]} lang="en" storage={recordingStorage()} />);
    expect(screen.getByText(/Heavy rain is forecast/)).toBeInTheDocument();
    expect(document.querySelector("[data-weather-voice-supplement]")?.textContent).toBe("Is it time for the ark yet?");
  });
});

describe("R5 — separate supplement observer at ratio 0.9, with the primary observer first", () => {
  it("the small-viewport case: a half-visible line is not an exposure, and it writes nothing", () => {
    const storage = recordingStorage();
    render(<Harness rows={[row()]} storage={storage} />);
    viewPrimary();
    expect(calls("weather_voice_viewed")).toHaveLength(1);
    supplementObserver().trigger(0.5);
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(0);
    expect(storage.setItem).not.toHaveBeenCalledWith(WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY, expect.anything());
  });

  it("then fully visible: one supplement event and one supplement history write, both on the supplement key", () => {
    const storage = recordingStorage();
    render(<Harness rows={[row()]} storage={storage} />);
    viewPrimary();
    supplementObserver().trigger(0.5);
    supplementObserver().trigger(1);
    supplementObserver().trigger(1);
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(1);
    expect(storage.setItem).toHaveBeenCalledWith(WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY, expect.any(String));
    const writes = storage.setItem.mock.calls.filter((c) => c[0] === WEATHER_VOICE_SUPPLEMENT_HISTORY_STORAGE_KEY);
    expect(writes).toHaveLength(1);
    expect(storage.setItem.mock.calls.some((c) => c[0] === "weather_voice_history_v1")).toBe(false);
  });

  it("the supplement observer is the second instance and the card observer stays first", () => {
    render(<Harness rows={[row()]} storage={recordingStorage()} />);
    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    expect(cardObserver().callback).toBeTypeOf("function");
  });

  it("the exact supplement payload carries exactly the documented fields, and no primary event is repeated", () => {
    render(<Harness rows={[row()]} storage={recordingStorage()} />);
    viewPrimary();
    supplementObserver().trigger(1);
    const supp = calls("weather_voice_supplement_viewed");
    expect(supp).toHaveLength(1);
    expect(Object.keys(supp[0][1]).sort()).toEqual(["language", "parent_voice_id", "supplement_id", "surface", "weather_type"]);
    expect(supp[0][1]).toEqual({
      supplement_id: "rain_heavy_24",
      parent_voice_id: "safety_heavy_rain",
      language: "is",
      weather_type: "heavy_rain",
      surface: "homepage_decision",
    });
    expect(calls("weather_voice_viewed")).toHaveLength(1);
  });

  it("the hook rejects a mismatched episode key, a mismatched supplement ID, and a repeat for the same episode", () => {
    let hook = null;
    render(<Harness rows={[row()]} storage={recordingStorage()} onHook={(wv) => (hook = wv)} />);
    hook.onSupplementVisible("not-the-episode", "rain_heavy_24");
    hook.onSupplementVisible(hook.episodeKey, "rain_heavy_25");
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(0);
    hook.onSupplementVisible(hook.episodeKey, "rain_heavy_24");
    hook.onSupplementVisible(hook.episodeKey, "rain_heavy_24");
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(1);
  });

  it("a stale observer from a torn-down episode cannot notify after a site change", () => {
    const { rerender } = render(<Harness rows={[row()]} storage={recordingStorage()} />);
    const stale = supplementObserver();
    rerender(<Harness rows={[row()]} storage={recordingStorage()} site={SITE_B} />);
    expect(stale.disconnected).toBe(true);
    stale.trigger(1);
    expect(calls("weather_voice_supplement_viewed")).toHaveLength(0);
  });
});

describe("R8 — no share path for a heavy-rain episode with a supplement", () => {
  it("the share snapshot is null, no share button is rendered, and the supplement is not in the snapshot", () => {
    let hook = null;
    render(<Harness rows={[row()]} storage={recordingStorage()} onHook={(wv) => (hook = wv)} />);
    expect(hook.shareSnapshot).toBeNull();
    expect(screen.queryByText("weatherVoiceShareButtonLabel")).toBeNull();
    expect(hook.presentation).not.toHaveProperty("supplement");
    expect(hook.presentation.comment.id).toBe("safety_heavy_rain");
  });
});
