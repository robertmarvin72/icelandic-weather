// Ticket 406 (#406) — weatherVoiceHistory.js: guarded persistence and
// explicit shown-recording. All tests inject storage/time; none touch the
// real browser localStorage or Date.now().
//
// Revision 2 (#406) — rewrites the positive-fixture helper (the old one
// hardcoded rain/unimpressed metadata for every ID, including wind IDs,
// which is no longer a valid positive fixture now that recordShown
// validates a presentation's condition/mood/severity/CTA against that
// ID's real metadata) and adds regression coverage for the two defects
// Ripley found in Round 1: malformed-but-known-ID presentations being
// persisted, and record-first use of a fresh adapter dropping other
// already-persisted known IDs.
import { describe, it, expect, vi, afterEach } from "vitest";
import { createWeatherVoiceHistory, WEATHER_VOICE_HISTORY_STORAGE_KEY, WEATHER_VOICE_HISTORY_VERSION } from "./weatherVoiceHistory";
import { WEATHER_VOICE_KNOWN_IDS, getWeatherVoiceCommentMetadataById, getWeatherVoiceLibrary } from "./weatherVoiceContent";
import { evaluateWeatherVoice } from "./weatherVoiceEngine";
import { selectWeatherVoiceComment } from "./weatherVoiceSelector";

const NOW = 1_700_000_000_000;
const KNOWN_IDS = [...WEATHER_VOICE_KNOWN_IDS];

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => map.delete(k),
    _raw: () => map.get(WEATHER_VOICE_HISTORY_STORAGE_KEY) ?? null,
  };
}

// A genuinely valid positive fixture: builds a presentation whose
// condition/mood/severity/CTA actually match `id`'s real registered
// metadata (src/lib/weatherVoiceContent.js), the way a real
// selectWeatherVoiceComment() result would.
function realPresentation(id, overrides = {}) {
  const meta = getWeatherVoiceCommentMetadataById(id);
  return {
    show: true,
    condition: meta.condition,
    mood: meta.mood,
    severity: meta.severityMin,
    comment: { id, text: `text-${id}` },
    ctaType: meta.ctaType,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createWeatherVoiceHistory — getHistory reads without writing", () => {
  it("fresh storage returns an empty Map", () => {
    const history = createWeatherVoiceHistory({ storage: fakeStorage() });
    expect(history.getHistory(NOW)).toEqual(new Map());
  });

  it("getHistory never calls setItem", () => {
    const storage = fakeStorage();
    let wrote = false;
    storage.setItem = () => {
      wrote = true;
    };
    const history = createWeatherVoiceHistory({ storage });
    history.getHistory(NOW);
    expect(wrote).toBe(false);
  });
});

describe("createWeatherVoiceHistory — explicit shown-recording", () => {
  const [KNOWN_ID_A, KNOWN_ID_B] = KNOWN_IDS;

  it("persists only id/timestamp — no coordinates, identity, weather, or text", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(realPresentation(KNOWN_ID_A), NOW);

    const persisted = JSON.parse(storage._raw());
    expect(persisted).toEqual({ version: WEATHER_VOICE_HISTORY_VERSION, records: { [KNOWN_ID_A]: NOW } });
  });

  it("a silent {show:false} presentation creates no record", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown({ show: false }, NOW);
    expect(storage._raw()).toBeNull();
    expect(history.getHistory(NOW).size).toBe(0);
  });

  it("reload: a new instance sharing the same storage reads the persisted record", () => {
    const storage = fakeStorage();
    const first = createWeatherVoiceHistory({ storage });
    first.recordShown(realPresentation(KNOWN_ID_A), NOW);

    const second = createWeatherVoiceHistory({ storage }); // simulates a page reload
    expect(second.getHistory(NOW + 1000).get(KNOWN_ID_A)).toBe(NOW);
  });

  it("a repeat call at the same timestamp is idempotent", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(realPresentation(KNOWN_ID_A), NOW);
    history.recordShown(realPresentation(KNOWN_ID_A), NOW);
    expect(history.getHistory(NOW).get(KNOWN_ID_A)).toBe(NOW);
  });

  it("an older recording can never replace a newer already-recorded timestamp", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(realPresentation(KNOWN_ID_A), NOW);
    history.recordShown(realPresentation(KNOWN_ID_A), NOW - 5000); // older write arrives later
    expect(history.getHistory(NOW).get(KNOWN_ID_A)).toBe(NOW);
  });

  it("a genuinely newer recording does replace an older one", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(realPresentation(KNOWN_ID_A), NOW);
    history.recordShown(realPresentation(KNOWN_ID_A), NOW + 5000);
    expect(history.getHistory(NOW + 5000).get(KNOWN_ID_A)).toBe(NOW + 5000);
  });

  it("IDs share history without ever storing a language or site field", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(realPresentation(KNOWN_ID_A), NOW);
    history.recordShown(realPresentation(KNOWN_ID_B), NOW);
    const persisted = JSON.parse(storage._raw());
    for (const value of Object.values(persisted.records)) {
      expect(typeof value).toBe("number"); // a bare timestamp, nothing else
    }
    expect(Object.keys(persisted)).toEqual(["version", "records"]);
  });

  it("a real engine -> IS library -> selector presentation records correctly end to end", () => {
    const engineResult = evaluateWeatherVoice({ tmax: 13, windMax: 0, rain: 0, code: 3 }); // "good"
    const library = getWeatherVoiceLibrary("is");
    const presentation = selectWeatherVoiceComment({ engineResult, library, history: new Map(), now: NOW, rng: () => 0 });
    expect(presentation.show).toBe(true);

    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(presentation, NOW);

    expect(history.getHistory(NOW).get(presentation.comment.id)).toBe(NOW);
  });

  it("valid non-IS text with identical metadata records correctly without storing text or language", () => {
    const id = KNOWN_ID_A;
    const enStylePresentation = realPresentation(id, { comment: { id, text: "A different-language sentence entirely." } });
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(enStylePresentation, NOW);

    const persisted = JSON.parse(storage._raw());
    expect(persisted.records).toEqual({ [id]: NOW });
    expect(JSON.stringify(persisted)).not.toContain("different-language");
  });
});

describe("createWeatherVoiceHistory — Revision 2: strict presentation validation before any side effect", () => {
  const id = KNOWN_IDS[0]; // whatever this id's real metadata is, used consistently below
  const meta = getWeatherVoiceCommentMetadataById(id);

  function expectRejectedWithNoSideEffects(presentation, storage, history) {
    history.recordShown(presentation, NOW);
    expect(storage._raw()).toBeNull();
    expect(history.getHistory(NOW).size).toBe(0);
  }

  it("a known ID with only {show:true, comment:{id}} performs no storage access and creates no record", () => {
    const storage = fakeStorage();
    let getItemCalls = 0;
    const originalGetItem = storage.getItem;
    storage.getItem = (...args) => {
      getItemCalls += 1;
      return originalGetItem(...args);
    };
    const history = createWeatherVoiceHistory({ storage });

    history.recordShown({ show: true, comment: { id } }, NOW);

    expect(getItemCalls).toBe(0); // rejected before hydration/storage was ever touched
    expect(storage._raw()).toBeNull();
    expect(history.getHistory(NOW).size).toBe(0);
  });

  it("null, undefined, and an unknown id are rejected", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(null, NOW);
    history.recordShown(undefined, NOW);
    history.recordShown({ show: true, comment: { id: "totally_made_up_id" } }, NOW);
    expect(storage._raw()).toBeNull();
  });

  it("each missing required field is rejected", () => {
    const base = realPresentation(id);
    for (const field of ["condition", "mood", "severity"]) {
      const storage = fakeStorage();
      const history = createWeatherVoiceHistory({ storage });
      const broken = { ...base };
      delete broken[field];
      expectRejectedWithNoSideEffects(broken, storage, history);
    }
    // Missing comment.text specifically:
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    expectRejectedWithNoSideEffects({ ...base, comment: { id } }, storage, history);
  });

  it("wrong field types are rejected", () => {
    const base = realPresentation(id);
    const cases = [
      { ...base, severity: String(meta.severityMin) },
      { ...base, condition: 123 },
      { ...base, mood: null },
      { ...base, comment: { id, text: 42 } },
    ];
    for (const broken of cases) {
      const storage = fakeStorage();
      const history = createWeatherVoiceHistory({ storage });
      expectRejectedWithNoSideEffects(broken, storage, history);
    }
  });

  it("out-of-range and non-integer severity are rejected", () => {
    const base = realPresentation(id);
    for (const severity of [meta.severityMin - 1, meta.severityMax + 1, meta.severityMin + 0.5]) {
      const storage = fakeStorage();
      const history = createWeatherVoiceHistory({ storage });
      expectRejectedWithNoSideEffects({ ...base, severity }, storage, history);
    }
  });

  it("blank text (empty or whitespace-only) is rejected", () => {
    const base = realPresentation(id);
    for (const text of ["", "   "]) {
      const storage = fakeStorage();
      const history = createWeatherVoiceHistory({ storage });
      expectRejectedWithNoSideEffects({ ...base, comment: { id, text } }, storage, history);
    }
  });

  it("a mismatched condition, mood, or CTA for this ID is rejected even though the ID itself is known", () => {
    const base = realPresentation(id);
    const otherId = KNOWN_IDS.find((candidate) => {
      const otherMeta = getWeatherVoiceCommentMetadataById(candidate);
      return otherMeta.condition !== meta.condition || otherMeta.mood !== meta.mood;
    });
    const otherMeta = getWeatherVoiceCommentMetadataById(otherId);

    const cases = [
      { ...base, condition: otherMeta.condition },
      { ...base, mood: otherMeta.mood },
      { ...base, ctaType: "better_location" }, // this MVP id's real ctaType is null
    ];
    for (const broken of cases) {
      const storage = fakeStorage();
      const history = createWeatherVoiceHistory({ storage });
      expectRejectedWithNoSideEffects(broken, storage, history);
    }
  });
});

describe("createWeatherVoiceHistory — Revision 2: hydrate before the first valid write", () => {
  const [ID_A, ID_B, ID_C] = KNOWN_IDS;

  function seededStorage(records) {
    return fakeStorage({ [WEATHER_VOICE_HISTORY_STORAGE_KEY]: JSON.stringify({ version: WEATHER_VOICE_HISTORY_VERSION, records }) });
  }

  it("record-first on a fresh adapter preserves the OTHER already-persisted known ID", () => {
    const storage = seededStorage({ [ID_A]: 900, [ID_B]: 950 });
    const history = createWeatherVoiceHistory({ storage }); // recordShown is the very first call — no prior getHistory()

    history.recordShown(realPresentation(ID_A), 1000);

    const persisted = JSON.parse(storage._raw());
    expect(persisted.records).toEqual({ [ID_A]: 1000, [ID_B]: 950 });
  });

  it("adding a third ID on the same fresh instance keeps all three correct", () => {
    const storage = seededStorage({ [ID_A]: 900, [ID_B]: 950 });
    const history = createWeatherVoiceHistory({ storage });

    history.recordShown(realPresentation(ID_A), 1000);
    history.recordShown(realPresentation(ID_C), 1010);

    const persisted = JSON.parse(storage._raw());
    expect(persisted.records).toEqual({ [ID_A]: 1000, [ID_B]: 950, [ID_C]: 1010 });
  });

  it("an expired-but-known seeded entry is preserved through record-first hydration", () => {
    const longAgo = NOW - 30 * 86400000; // 30 days ago — well past any MVP cooldown
    const storage = seededStorage({ [ID_B]: longAgo });
    const history = createWeatherVoiceHistory({ storage });

    history.recordShown(realPresentation(ID_A), NOW); // ID_A first, not ID_B

    expect(history.getHistory(NOW).get(ID_B)).toBe(longAgo); // still preserved, not dropped
    expect(history.getHistory(NOW).get(ID_A)).toBe(NOW);
  });

  it("same-timestamp idempotence holds even on initial hydration", () => {
    const storage = seededStorage({ [ID_A]: 1000 });
    const history = createWeatherVoiceHistory({ storage });

    history.recordShown(realPresentation(ID_A), 1000); // recordShown is the first call, hydrates to {ID_A: 1000}, then idempotent no-op

    expect(history.getHistory(1000).get(ID_A)).toBe(1000);
    const persisted = JSON.parse(storage._raw());
    expect(persisted.records).toEqual({ [ID_A]: 1000 });
  });

  it("hydration only happens once per instance — a second recordShown does not re-read storage", () => {
    const storage = seededStorage({ [ID_A]: 900 });
    let getItemCalls = 0;
    const originalGetItem = storage.getItem;
    storage.getItem = (...args) => {
      getItemCalls += 1;
      return originalGetItem(...args);
    };
    const history = createWeatherVoiceHistory({ storage });

    history.recordShown(realPresentation(ID_B), 1000);
    expect(getItemCalls).toBe(1);
    history.recordShown(realPresentation(ID_C), 1010);
    expect(getItemCalls).toBe(1); // still 1 — no repeated re-sync
  });

  it("an invalid presentation never triggers hydration or a write", () => {
    const storage = seededStorage({ [ID_A]: 900 });
    let getItemCalls = 0;
    const originalGetItem = storage.getItem;
    storage.getItem = (...args) => {
      getItemCalls += 1;
      return originalGetItem(...args);
    };
    const history = createWeatherVoiceHistory({ storage });

    history.recordShown({ show: true, comment: { id: ID_B } }, 1000); // malformed
    expect(getItemCalls).toBe(0);
    expect(storage._raw()).toBe(JSON.stringify({ version: WEATHER_VOICE_HISTORY_VERSION, records: { [ID_A]: 900 } })); // untouched
  });
});

describe("createWeatherVoiceHistory — nonfatal guards", () => {
  const [KNOWN_ID_A] = KNOWN_IDS;

  it("corrupt JSON is ignored, not thrown", () => {
    const storage = fakeStorage({ [WEATHER_VOICE_HISTORY_STORAGE_KEY]: "{not valid json" });
    const history = createWeatherVoiceHistory({ storage });
    expect(() => history.getHistory(NOW)).not.toThrow();
    expect(history.getHistory(NOW).size).toBe(0);
  });

  it("wrong version is ignored", () => {
    const storage = fakeStorage({ [WEATHER_VOICE_HISTORY_STORAGE_KEY]: JSON.stringify({ version: 999, records: { [KNOWN_ID_A]: NOW } }) });
    const history = createWeatherVoiceHistory({ storage });
    expect(history.getHistory(NOW).size).toBe(0);
  });

  it("wrong shape (records as an array, or missing) is ignored", () => {
    const arrayShape = fakeStorage({ [WEATHER_VOICE_HISTORY_STORAGE_KEY]: JSON.stringify({ version: WEATHER_VOICE_HISTORY_VERSION, records: [1, 2, 3] }) });
    expect(createWeatherVoiceHistory({ storage: arrayShape }).getHistory(NOW).size).toBe(0);

    const missingRecords = fakeStorage({ [WEATHER_VOICE_HISTORY_STORAGE_KEY]: JSON.stringify({ version: WEATHER_VOICE_HISTORY_VERSION }) });
    expect(createWeatherVoiceHistory({ storage: missingRecords }).getHistory(NOW).size).toBe(0);
  });

  it("unknown IDs are discarded while known IDs in the same record set are kept", () => {
    const storage = fakeStorage({
      [WEATHER_VOICE_HISTORY_STORAGE_KEY]: JSON.stringify({
        version: WEATHER_VOICE_HISTORY_VERSION,
        records: { unknown_made_up_id: NOW - 1000, [KNOWN_ID_A]: NOW - 1000 },
      }),
    });
    const history = createWeatherVoiceHistory({ storage });
    const result = history.getHistory(NOW);
    expect(result.has("unknown_made_up_id")).toBe(false);
    expect(result.get(KNOWN_ID_A)).toBe(NOW - 1000);
  });

  it("invalid timestamps (negative, non-finite, future relative to now) are discarded", () => {
    const storage = fakeStorage({
      [WEATHER_VOICE_HISTORY_STORAGE_KEY]: JSON.stringify({
        version: WEATHER_VOICE_HISTORY_VERSION,
        records: { [KNOWN_ID_A]: -5, [KNOWN_IDS[1]]: NaN, [KNOWN_IDS[2]]: NOW + 999999 },
      }),
    });
    const history = createWeatherVoiceHistory({ storage });
    expect(history.getHistory(NOW).size).toBe(0);
  });

  it("a throwing getItem is nonfatal and yields an empty history", () => {
    const storage = fakeStorage();
    storage.getItem = () => {
      throw new Error("boom");
    };
    const history = createWeatherVoiceHistory({ storage });
    expect(() => history.getHistory(NOW)).not.toThrow();
    expect(history.getHistory(NOW).size).toBe(0);
  });

  it("a throwing setItem (quota failure) is nonfatal, and the in-memory fallback still works within this instance", () => {
    const storage = fakeStorage();
    storage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    const history = createWeatherVoiceHistory({ storage });
    expect(() => history.recordShown(realPresentation(KNOWN_ID_A), NOW)).not.toThrow();
    // Persistence failed, but this instance's own memory still reflects it:
    expect(history.getHistory(NOW).get(KNOWN_ID_A)).toBe(NOW);
  });

  it("a storage whose getItem AND setItem both throw still supports selection via in-memory fallback for this instance's lifetime", () => {
    const storage = {
      getItem: () => {
        throw new Error("boom");
      },
      setItem: () => {
        throw new Error("boom");
      },
    };
    const history = createWeatherVoiceHistory({ storage });
    history.recordShown(realPresentation(KNOWN_ID_A), NOW);
    expect(history.getHistory(NOW + 1).get(KNOWN_ID_A)).toBe(NOW);
  });

  it("no window (SSR-like environment) does not throw when no storage is injected", () => {
    vi.stubGlobal("window", undefined);
    const history = createWeatherVoiceHistory();
    expect(() => history.getHistory(NOW)).not.toThrow();
    expect(() => history.recordShown(realPresentation(KNOWN_ID_A), NOW)).not.toThrow();
    expect(history.getHistory(NOW).get(KNOWN_ID_A)).toBe(NOW); // in-memory still works
  });

  it("a throwing window.localStorage PROPERTY GETTER (not just getItem) is nonfatal", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError: localStorage access denied");
      },
    });
    try {
      const history = createWeatherVoiceHistory(); // no injected storage -> falls through to window.localStorage
      expect(() => history.getHistory(NOW)).not.toThrow();
      expect(() => history.recordShown(realPresentation(KNOWN_ID_A), NOW)).not.toThrow();
      expect(history.getHistory(NOW).get(KNOWN_ID_A)).toBe(NOW); // in-memory still works
    } finally {
      if (originalDescriptor) Object.defineProperty(window, "localStorage", originalDescriptor);
    }
  });

  it("serialized history stays bounded to known canonical IDs even after recording every known ID", () => {
    const storage = fakeStorage();
    const history = createWeatherVoiceHistory({ storage });
    let t = NOW;
    for (const id of WEATHER_VOICE_KNOWN_IDS) {
      history.recordShown(realPresentation(id), t);
      t += 1;
    }
    const persisted = JSON.parse(storage._raw());
    expect(Object.keys(persisted.records)).toHaveLength(WEATHER_VOICE_KNOWN_IDS.size);
  });
});
