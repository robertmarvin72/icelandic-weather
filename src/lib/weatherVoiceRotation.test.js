// Ticket 420 (#420) — rotation over the expanded real pools. Deterministic
// history cases only: no probabilistic distribution assertions. The selector
// logic itself is unchanged (7-day cooldown, uniform choice among available
// sorted IDs, least-recently-shown fallback, lexical tie-break).
import { describe, it, expect } from "vitest";
import { selectWeatherVoiceComment, selectWeatherVoicePresentation } from "./weatherVoiceSelector";
import { getWeatherVoiceLibrary, RETIRED_JOKE_IDS } from "./weatherVoiceContent";
import { createWeatherVoiceHistory, WEATHER_VOICE_HISTORY_STORAGE_KEY } from "./weatherVoiceHistory";

const DAY = 86400000;
const NOW = Date.UTC(2026, 9, 3, 12, 0, 0);
const hostileRng = () => {
  throw new Error("rng must not be consulted for safety selection");
};

function engine(condition, mood, severity) {
  return { show: true, condition, mood, severity, voiceLevel: "sarcastic" };
}

function pool(condition) {
  return getWeatherVoiceLibrary("is").filter((e) => e.condition === condition);
}

function pick({ condition, history, rng = () => 0, now = NOW }) {
  const mood = pool(condition)[0].mood;
  const severity = pool(condition)[0].severityMin;
  return selectWeatherVoiceComment({ engineResult: engine(condition, mood, severity), library: getWeatherVoiceLibrary("is"), history, now, rng });
}

function shownAll(ids, at) {
  return new Map(ids.map((id) => [id, at]));
}

describe("expanded pools — real sizes (#420)", () => {
  it.each([
    ["good", 23],
    ["excellent", 22],
    ["rain", 23],
    ["cold", 23],
    ["sun_wind", 22],
  ])("%s pool holds %i active IDs", (condition, size) => {
    expect(pool(condition)).toHaveLength(size);
    expect(pool(condition).every((e) => e.voiceLevel === "sarcastic")).toBe(true);
  });
});

describe("all but one eligible ID recently exposed forces the remaining choice (#420)", () => {
  it.each(["good", "excellent", "rain", "cold", "sun_wind"])("%s: the only available ID is chosen for every RNG value", (condition) => {
    const ids = pool(condition).map((e) => e.id).sort();
    const remaining = ids[ids.length - 1];
    const history = shownAll(
      ids.filter((id) => id !== remaining),
      NOW - DAY
    );
    for (const rng of [() => 0, () => 0.5, () => 0.999, () => NaN]) {
      const result = pick({ condition, history, rng });
      expect(result.comment.id).toBe(remaining);
    }
  });
});

describe("cooldown boundary (#420)", () => {
  it("exactly 7 days after shown is available again (the only available ID is chosen)", () => {
    const ids = pool("cold").map((e) => e.id).sort();
    const target = ids[0];
    const others = ids.slice(1);
    const history = new Map([...shownAll(others, NOW - 1000), [target, NOW - 7 * DAY]]);
    expect(pick({ condition: "cold", history, rng: () => 0 }).comment.id).toBe(target);
  });

  it("one millisecond short of 7 days is still in cooldown: an unshown ID is chosen instead", () => {
    const ids = pool("cold").map((e) => e.id).sort();
    const target = ids[0];
    const unshown = ids[1];
    const others = ids.slice(2);
    const history = new Map([...shownAll(others, NOW - 1000), [target, NOW - 7 * DAY + 1]]);
    for (const rng of [() => 0, () => 0.99]) {
      expect(pick({ condition: "cold", history, rng }).comment.id).toBe(unshown);
    }
  });
});

describe("all-in-cooldown fallback is least-recently-shown, with lexical tie-break (#420)", () => {
  it("chooses the oldest timestamp when the whole rain pool is in cooldown", () => {
    const ids = pool("rain").map((e) => e.id).sort();
    const history = new Map(ids.map((id, i) => [id, NOW - (i + 1) * 1000]));
    const oldest = ids[ids.length - 1];
    expect(pick({ condition: "rain", history, rng: () => 0.7 }).comment.id).toBe(oldest);
  });

  it("breaks an exact timestamp tie by the lexicographically smallest ID", () => {
    const ids = pool("sun_wind").map((e) => e.id).sort();
    const history = shownAll(ids, NOW - 1000);
    expect(pick({ condition: "sun_wind", history, rng: () => 0.9 }).comment.id).toBe(ids[0]);
  });
});

describe("persistence and rehydration across instances (#420)", () => {
  function fakeStorage(initial = null) {
    let value = initial;
    return {
      getItem: (k) => (k === WEATHER_VOICE_HISTORY_STORAGE_KEY ? value : null),
      setItem: (k, v) => {
        if (k === WEATHER_VOICE_HISTORY_STORAGE_KEY) value = v;
      },
      raw: () => value,
    };
  }

  it("a shown comment is excluded after a fresh instance rehydrates from storage", () => {
    const storage = fakeStorage();
    const first = createWeatherVoiceHistory({ storage });
    const ids = pool("good").map((e) => e.id).sort();
    const shown = ids[0];
    const presentation = { show: true, condition: "good", mood: "happy", severity: 0, voiceLevel: "sarcastic", comment: { id: shown, text: "x" }, ctaType: null };
    first.recordShown(presentation, NOW - 1000);

    const second = createWeatherVoiceHistory({ storage });
    const history = second.getHistory(NOW);
    expect(history.get(shown)).toBe(NOW - 1000);
    const result = pick({ condition: "good", history, rng: () => 0 });
    expect(result.comment.id).not.toBe(shown);
  });

  it("retired IDs in persisted storage are discarded on hydration, with no migration", () => {
    const retired = [...RETIRED_JOKE_IDS];
    const records = Object.fromEntries([...retired.map((id) => [id, NOW - 1000]), ["good_01", NOW - 2000]]);
    const storage = fakeStorage(JSON.stringify({ version: 1, records }));
    const history = createWeatherVoiceHistory({ storage }).getHistory(NOW);
    expect([...history.keys()]).toEqual(["good_01"]);
    for (const id of retired) expect(history.has(id)).toBe(false);
  });
});

describe("safety history bypass is unchanged (#420)", () => {
  it("cautious selection ignores joke history that marks every active joke as shown", () => {
    const history = shownAll(getWeatherVoiceLibrary("is").map((e) => e.id), NOW);
    const result = selectWeatherVoicePresentation({
      engineResult: { show: true, condition: "heavy_rain", mood: "sad", severity: 2, voiceLevel: "cautious" },
      lang: "is",
      library: getWeatherVoiceLibrary("is"),
      history,
      now: NOW,
      rng: hostileRng,
    });
    expect(result.comment.id).toBe("safety_heavy_rain");
    expect(result.voiceLevel).toBe("cautious");
  });
});
