// Ticket 406 (#406) — weatherVoiceSelector.js: pure selection, no
// persistence, no clock/storage access of its own.
import { describe, it, expect } from "vitest";
import { selectWeatherVoiceComment } from "./weatherVoiceSelector";

const DAY_MS = 86400000;
const NOW = 1_700_000_000_000; // arbitrary fixed epoch ms

function entry(id, overrides = {}) {
  return {
    id,
    text: `text-${id}`,
    condition: "rain",
    mood: "unimpressed",
    severityMin: 0,
    severityMax: 3,
    repeatCooldownDays: 7,
    ctaType: null,
    ...overrides,
  };
}

const RAIN_RESULT = Object.freeze({ show: true, condition: "rain", mood: "unimpressed", severity: 1 });

function throwingFn(label) {
  return () => {
    throw new Error(`${label} must not be called for this case`);
  };
}

describe("selectWeatherVoiceComment — silent/malformed Phase 1 results bypass selection entirely", () => {
  it("{show:false} returns exact silence without invoking RNG or touching history", () => {
    const result = selectWeatherVoiceComment({
      engineResult: { show: false },
      library: [entry("a")],
      history: { get: throwingFn("history.get") },
      now: NOW,
      rng: throwingFn("rng"),
    });
    expect(result).toEqual({ show: false });
  });

  it.each([
    ["unsupported condition", { show: true, condition: "bogus", mood: "unimpressed", severity: 1 }],
    ["unsupported mood", { show: true, condition: "rain", mood: "bogus", severity: 1 }],
    ["severity above range", { show: true, condition: "rain", mood: "unimpressed", severity: 4 }],
    ["severity below range", { show: true, condition: "rain", mood: "unimpressed", severity: -1 }],
    ["non-integer severity", { show: true, condition: "rain", mood: "unimpressed", severity: 1.5 }],
    ["missing severity", { show: true, condition: "rain", mood: "unimpressed" }],
    ["null", null],
    ["undefined", undefined],
  ])("malformed active result (%s) returns silence", (_label, engineResult) => {
    const result = selectWeatherVoiceComment({
      engineResult,
      library: [entry("a")],
      history: new Map(),
      now: NOW,
      rng: () => 0,
    });
    expect(result).toEqual({ show: false });
  });
});

describe("selectWeatherVoiceComment — content eligibility", () => {
  it("wrong condition/mood/severity entries can never win, even when index 0", () => {
    const library = [
      entry("wrong_condition", { condition: "cold" }),
      entry("wrong_mood", { mood: "sad" }),
      entry("wrong_severity", { severityMin: 2, severityMax: 3 }),
      entry("eligible"),
    ];
    const result = selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history: new Map(), now: NOW, rng: () => 0 });
    expect(result.comment.id).toBe("eligible");
  });

  it("the canonical condition/mood/severity triple is copied verbatim from Phase 1, not from content", () => {
    const engineResult = { show: true, condition: "rain", mood: "unimpressed", severity: 2 };
    const library = [entry("a", { severityMin: 0, severityMax: 3 })];
    const result = selectWeatherVoiceComment({ engineResult, library, history: new Map(), now: NOW, rng: () => 0 });
    expect(result).toMatchObject({ condition: "rain", mood: "unimpressed", severity: 2 });
  });

  it("empty library, null library, and no eligible candidates all return exact silence", () => {
    const base = { engineResult: RAIN_RESULT, history: new Map(), now: NOW, rng: () => 0 };
    expect(selectWeatherVoiceComment({ ...base, library: [] })).toEqual({ show: false });
    expect(selectWeatherVoiceComment({ ...base, library: null })).toEqual({ show: false });
    expect(selectWeatherVoiceComment({ ...base, library: [entry("a", { condition: "cold" })] })).toEqual({ show: false });
  });
});

describe("selectWeatherVoiceComment — RNG-driven uniform choice among available entries", () => {
  const library = [entry("b"), entry("a"), entry("c")]; // deliberately out of ID order

  it("different RNG values select different sorted-by-ID entries", () => {
    expect(selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history: new Map(), now: NOW, rng: () => 0 }).comment.id).toBe("a");
    expect(selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history: new Map(), now: NOW, rng: () => 0.34 }).comment.id).toBe("b");
    expect(selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history: new Map(), now: NOW, rng: () => 0.99 }).comment.id).toBe("c");
  });

  it.each([
    ["NaN", () => NaN],
    ["negative", () => -0.1],
    ["exactly 1", () => 1],
    ["above 1", () => 1.5],
    ["not a function", "not-a-function"],
    ["throws", throwingFn("rng")],
  ])("invalid RNG (%s) falls back deterministically to the first sorted ID, never throwing or indexing out of bounds", (_label, rng) => {
    const result = selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history: new Map(), now: NOW, rng });
    expect(result.comment.id).toBe("a");
  });
});

describe("selectWeatherVoiceComment — cooldown-based availability", () => {
  it("a never-recorded entry is immediately eligible", () => {
    const result = selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library: [entry("a")], history: new Map(), now: NOW, rng: () => 0 });
    expect(result.comment.id).toBe("a");
  });

  it("a recently-shown entry is excluded while another eligible entry is available", () => {
    const library = [entry("a"), entry("b")];
    const history = new Map([["a", NOW - 3600000]]); // shown 1 hour ago, 7-day cooldown
    const result = selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history, now: NOW, rng: () => 0 });
    expect(result.comment.id).toBe("b"); // the only available one, regardless of rng
  });

  it("exactly at the 7-day cooldown boundary is available; one millisecond short is not", () => {
    const library = [entry("a")];
    const atBoundary = selectWeatherVoiceComment({
      engineResult: RAIN_RESULT,
      library,
      history: new Map([["a", NOW - 7 * DAY_MS]]),
      now: NOW,
      rng: () => 0,
    });
    expect(atBoundary).toMatchObject({ show: true, comment: { id: "a" } });

    const oneMsShort = selectWeatherVoiceComment({
      engineResult: RAIN_RESULT,
      library,
      history: new Map([["a", NOW - 7 * DAY_MS + 1]]),
      now: NOW,
      rng: () => 0,
    });
    // Still eligible content-wise, but the sole entry is in cooldown -> the
    // all-in-cooldown fallback still returns it (never silence here).
    expect(oneMsShort).toMatchObject({ show: true, comment: { id: "a" } });
  });

  it("a per-entry cooldown override is respected, and a zero-day cooldown is immediately available", () => {
    const library = [entry("short", { repeatCooldownDays: 2 }), entry("zero", { repeatCooldownDays: 0 })];
    const history = new Map([
      ["short", NOW - 2 * DAY_MS], // exactly at its own 2-day boundary
      ["zero", NOW], // shown literally now
    ]);
    const shortResult = selectWeatherVoiceComment({
      engineResult: RAIN_RESULT,
      library: [library[0]],
      history,
      now: NOW,
      rng: () => 0,
    });
    expect(shortResult.comment.id).toBe("short");

    const zeroResult = selectWeatherVoiceComment({
      engineResult: RAIN_RESULT,
      library: [library[1]],
      history,
      now: NOW,
      rng: () => 0,
    });
    expect(zeroResult.comment.id).toBe("zero");
  });
});

describe("selectWeatherVoiceComment — all-in-cooldown fallback", () => {
  it("chooses the least recently shown eligible entry when every eligible entry is in cooldown", () => {
    const library = [entry("a"), entry("b")];
    const history = new Map([
      ["a", NOW - 1000], // shown 1s ago (very recent)
      ["b", NOW - 5000], // shown 5s ago (older -> least recently shown)
    ]);
    const result = selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history, now: NOW, rng: () => 0.99 });
    expect(result.comment.id).toBe("b");
  });

  it("breaks an exact timestamp tie lexicographically by ID", () => {
    const library = [entry("z"), entry("a")];
    const history = new Map([
      ["z", NOW - 1000],
      ["a", NOW - 1000],
    ]);
    const result = selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history, now: NOW, rng: () => 0.99 });
    expect(result.comment.id).toBe("a");
  });

  it("always returns a comment even with a single eligible entry stuck in cooldown", () => {
    const library = [entry("only")];
    const history = new Map([["only", NOW - 1000]]);
    const result = selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history, now: NOW, rng: () => 0 });
    expect(result).toMatchObject({ show: true, comment: { id: "only" } });
  });
});

describe("selectWeatherVoiceComment — purity: no mutation, no persistence", () => {
  it("never mutates the library array/entries or the history map", () => {
    const library = [entry("a"), entry("b")];
    const librarySnapshot = JSON.parse(JSON.stringify(library));
    const history = new Map([["a", NOW - 1000]]);
    const historySnapshot = [...history.entries()];

    selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library, history, now: NOW, rng: () => 0.5 });

    expect(library).toEqual(librarySnapshot);
    expect([...history.entries()]).toEqual(historySnapshot);
  });

  it("selection alone performs no persistence — result has no storage side effect to observe, and history is read-only", () => {
    const history = new Map();
    const originalGet = history.get.bind(history);
    let readCount = 0;
    history.get = (id) => {
      readCount += 1;
      return originalGet(id);
    };
    selectWeatherVoiceComment({ engineResult: RAIN_RESULT, library: [entry("a")], history, now: NOW, rng: () => 0 });
    expect(readCount).toBeGreaterThan(0); // it does read history...
    expect(history.size).toBe(0); // ...but never writes to it
  });
});
