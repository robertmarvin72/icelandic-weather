// @vitest-environment node
// google-apps-script/decision-quiz/core.test.js
//
// Exercises the ACTUAL deployed core.js source (via loadCore.js's vm-based
// loader) — not a reimplementation. Fake sheet/lock/clock boundaries only;
// no real network, database, Google API, or wall clock (approved prompt §9,
// tests #9/#10).

import { describe, it, expect } from "vitest";
import { loadDecisionQuizCore } from "./loadCore.js";

const DecisionQuizCore = loadDecisionQuizCore();

const VALID_PAYLOAD = {
  campaign: "camp-a",
  test_version: "1",
  fixture_version: "1",
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  lang: "is",
  viewport: "mobile",
  client_started_at: "2026-08-24T10:00:00.000Z",
  client_completed_at: "2026-08-24T10:05:00.000Z",
  scenario_order: ["stay", "move", "consider"],
  scenarios: [
    { scenario_id: "stay", interpretation: "stay", reason: "weather_similar", action: "stay_put", first_action: "none", interpretation_ms: 4000, note: null },
    { scenario_id: "move", interpretation: "move", reason: "weather_better_elsewhere", action: "relocate_now", first_action: "primary_cta", interpretation_ms: 5000, note: "clear skies" },
    { scenario_id: "consider", interpretation: "consider", reason: "not_sure_why", action: "keep_monitoring", first_action: "secondary_link", interpretation_ms: 6000, note: null },
  ],
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

describe("DecisionQuizCore is loaded from the real deployed file", () => {
  it("exposes the expected public API", () => {
    expect(typeof DecisionQuizCore.validatePayload).toBe("function");
    expect(typeof DecisionQuizCore.processSubmission).toBe("function");
    expect(DecisionQuizCore.KNOWN_SCENARIO_IDS).toEqual(["stay", "move", "consider"]);
  });
});

describe("validatePayload — valid payload", () => {
  it("accepts a fully valid payload", () => {
    const result = DecisionQuizCore.validatePayload(VALID_PAYLOAD, "1");
    expect(result.ok).toBe(true);
  });
});

describe("validatePayload — schema/enum/type/length/version/UUID/permutation rejections", () => {
  it("rejects a non-object body", () => {
    expect(DecisionQuizCore.validatePayload(null, "1").code).toBe("invalid_body");
    expect(DecisionQuizCore.validatePayload("x", "1").code).toBe("invalid_body");
    expect(DecisionQuizCore.validatePayload([1, 2], "1").code).toBe("invalid_body");
  });

  it("rejects unexpected top-level keys", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.extra_field = "nope";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("unexpected_keys");
  });

  it("rejects the wrong test_version (bad version)", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.test_version = "2";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_version");
  });

  it("rejects a malformed campaign (bad campaign)", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.campaign = "x".repeat(200);
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_campaign");
  });

  it("rejects a malformed session_id (bad UUID)", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.session_id = "not-a-uuid";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_session_id");
  });

  it("rejects an invalid permutation: wrong length", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenario_order = ["stay", "move"];
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_permutation");
  });

  it("rejects an invalid permutation: repeated id", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenario_order = ["stay", "stay", "move"];
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_permutation");
  });

  it("rejects an invalid permutation: unknown id", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenario_order = ["stay", "move", "ghost"];
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_permutation");
  });

  it("rejects a missing scenario (wrong count)", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenarios = bad.scenarios.slice(0, 2);
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_scenarios");
  });

  it("rejects a duplicate scenario_id", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenarios[2].scenario_id = "stay";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("duplicate_scenario");
  });

  it("rejects an unknown scenario_id", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenarios[0].scenario_id = "ghost";
    // scenario_order/scenario-set mismatch also trips here; the scenario's
    // own validation catches it first via unknown_scenario.
    expect(["unknown_scenario", "scenario_order_mismatch"]).toContain(
      DecisionQuizCore.validatePayload(bad, "1").code,
    );
  });

  it("rejects a scenario_order/scenarios mismatch even with valid individual scenarios", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenario_order = ["stay", "move", "consider"];
    bad.scenarios[2].scenario_id = "move"; // now duplicate move, no consider at all
    const result = DecisionQuizCore.validatePayload(bad, "1");
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid enum value (interpretation)", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenarios[0].interpretation = "definitely_move";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_interpretation");
  });

  it("rejects an invalid enum value (reason)", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenarios[0].reason = "vibes";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_reason");
  });

  it("rejects an invalid type for interpretation_ms (duration)", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenarios[0].interpretation_ms = "fast";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_interpretation_ms");
  });

  it("rejects a negative or absurdly large duration", () => {
    const negative = clone(VALID_PAYLOAD);
    negative.scenarios[0].interpretation_ms = -1;
    expect(DecisionQuizCore.validatePayload(negative, "1").code).toBe("invalid_interpretation_ms");

    const huge = clone(VALID_PAYLOAD);
    huge.scenarios[0].interpretation_ms = 999999999;
    expect(DecisionQuizCore.validatePayload(huge, "1").code).toBe("invalid_interpretation_ms");
  });

  it("rejects extra keys on a scenario record", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenarios[0].extra = "nope";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("unexpected_scenario_keys");
  });

  it("rejects an oversize note", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.scenarios[0].note = "x".repeat(DecisionQuizCore.MAX_NOTE_LENGTH + 1);
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("note_too_long");
  });

  it("accepts a note exactly at the length boundary", () => {
    const ok = clone(VALID_PAYLOAD);
    ok.scenarios[0].note = "x".repeat(DecisionQuizCore.MAX_NOTE_LENGTH);
    expect(DecisionQuizCore.validatePayload(ok, "1").ok).toBe(true);
  });

  it("rejects an invalid lang/viewport", () => {
    const badLang = clone(VALID_PAYLOAD);
    badLang.lang = "de";
    expect(DecisionQuizCore.validatePayload(badLang, "1").code).toBe("invalid_lang");

    const badViewport = clone(VALID_PAYLOAD);
    badViewport.viewport = "tablet";
    expect(DecisionQuizCore.validatePayload(badViewport, "1").code).toBe("invalid_viewport");
  });

  it("rejects malformed timestamps", () => {
    const bad = clone(VALID_PAYLOAD);
    bad.client_started_at = "yesterday";
    expect(DecisionQuizCore.validatePayload(bad, "1").code).toBe("invalid_client_started_at");
  });
});

describe("neutralizeFormula — formula-injection neutralization", () => {
  it.each(["=SUM(A1:A9)", "+1+1", "-1+1", "@SUM(1)"])("prefixes a leading apostrophe for %s", (value) => {
    expect(DecisionQuizCore.neutralizeFormula(value)).toBe("'" + value);
  });

  it("catches formula characters after leading whitespace", () => {
    expect(DecisionQuizCore.neutralizeFormula("   =SUM(A1:A9)")).toBe("'   =SUM(A1:A9)");
  });

  it("leaves ordinary text untouched", () => {
    expect(DecisionQuizCore.neutralizeFormula("it was unclear")).toBe("it was unclear");
    expect(DecisionQuizCore.neutralizeFormula("")).toBe("");
  });

  it("passes through non-string values unchanged", () => {
    expect(DecisionQuizCore.neutralizeFormula(5)).toBe(5);
    expect(DecisionQuizCore.neutralizeFormula(null)).toBeNull();
  });
});

describe("buildRow — normalized Sheet row", () => {
  it("builds a header-ordered row with formula-neutralized participant strings", () => {
    const withFormula = clone(VALID_PAYLOAD);
    withFormula.campaign = "=EVIL()";
    withFormula.scenarios[1].note = "=EVIL()";

    const row = DecisionQuizCore.buildRow(withFormula, "2026-08-24T12:00:00.000Z");
    expect(row.length).toBe(DecisionQuizCore.SHEET_HEADERS.length);
    expect(row[0]).toBe("2026-08-24T12:00:00.000Z"); // received_at
    expect(row[1]).toBe(withFormula.session_id);
    expect(row[4]).toBe("'=EVIL()"); // campaign, neutralized
    // scenario_order determines column order — stay, move, consider here
    expect(row[10]).toBe("stay"); // scenario_1_id
    expect(row[17]).toBe("move"); // scenario_2_id
    expect(row[17 + 6]).toBe("'=EVIL()"); // scenario_2_note, neutralized
  });

  it("orders scenario columns by scenario_order, not by input array order", () => {
    const reordered = clone(VALID_PAYLOAD);
    reordered.scenario_order = ["consider", "stay", "move"];
    const row = DecisionQuizCore.buildRow(reordered, "2026-08-24T12:00:00.000Z");
    expect(row[10]).toBe("consider");
    expect(row[17]).toBe("stay");
    expect(row[24]).toBe("move");
  });
});

describe("deriveIdempotencyKey — stable idempotency key", () => {
  it("is a pure function of (test_version, session_id)", () => {
    const a = DecisionQuizCore.deriveIdempotencyKey("1", "abc");
    const b = DecisionQuizCore.deriveIdempotencyKey("1", "abc");
    expect(a).toBe(b);
    expect(DecisionQuizCore.deriveIdempotencyKey("2", "abc")).not.toBe(a);
    expect(DecisionQuizCore.deriveIdempotencyKey("1", "xyz")).not.toBe(a);
  });
});

// ── processSubmission — full orchestration with fake sheet/lock/clock ─────

function makeFakeBoundaries({ activeVersion = "1", lockAlwaysBusy = false, throwOnAppend = false } = {}) {
  const store = [];
  const appendRowCalls = [];
  const tryLockCalls = [];
  let lockHeld = false;

  return {
    activeVersion,
    now: () => "2026-08-24T12:00:00.000Z",
    lock: {
      tryLock: (waitMs) => {
        tryLockCalls.push(waitMs);
        if (lockAlwaysBusy) return false;
        lockHeld = true;
        return true;
      },
      releaseLock: () => {
        lockHeld = false;
      },
    },
    sheet: {
      findExistingRow: (key) => store.find((r) => r.key === key) || null,
      appendRow: (row, key) => {
        if (throwOnAppend) throw new Error("sheet write failed");
        appendRowCalls.push(row);
        store.push({ key, receivedAt: row[0] });
      },
    },
    _debug: { appendRowCalls, tryLockCalls, isLockHeld: () => lockHeld },
  };
}

describe("processSubmission — orchestration", () => {
  it("accepts a valid payload, appends exactly one row, releases the lock", () => {
    const boundaries = makeFakeBoundaries();
    const result = DecisionQuizCore.processSubmission(JSON.stringify(VALID_PAYLOAD), boundaries);
    expect(result).toEqual({ ok: true, receivedAt: "2026-08-24T12:00:00.000Z" });
    expect(boundaries._debug.appendRowCalls).toHaveLength(1);
    expect(boundaries._debug.isLockHeld()).toBe(false);
  });

  it("returns a sanitized error for invalid JSON, never throwing", () => {
    const boundaries = makeFakeBoundaries();
    const result = DecisionQuizCore.processSubmission("{not json", boundaries);
    expect(result).toEqual({ ok: false, code: "invalid_json", error: "invalid_json" });
    expect(boundaries._debug.appendRowCalls).toHaveLength(0);
  });

  it("returns a sanitized validation error without ever acquiring the lock", () => {
    const boundaries = makeFakeBoundaries();
    const bad = clone(VALID_PAYLOAD);
    bad.session_id = "nope";
    const result = DecisionQuizCore.processSubmission(JSON.stringify(bad), boundaries);
    expect(result.code).toBe("invalid_session_id");
    expect(boundaries._debug.tryLockCalls).toHaveLength(0);
  });

  it("returns a stable retryable 'busy' response when the lock cannot be acquired", () => {
    const boundaries = makeFakeBoundaries({ lockAlwaysBusy: true });
    const result = DecisionQuizCore.processSubmission(JSON.stringify(VALID_PAYLOAD), boundaries);
    expect(result).toEqual({ ok: false, code: "busy", error: "busy" });
    expect(boundaries._debug.appendRowCalls).toHaveLength(0);
  });

  it("returns a sanitized internal_error (no stack trace/detail) when the sheet write throws, and still releases the lock", () => {
    const boundaries = makeFakeBoundaries({ throwOnAppend: true });
    const result = DecisionQuizCore.processSubmission(JSON.stringify(VALID_PAYLOAD), boundaries);
    expect(result).toEqual({ ok: false, code: "internal_error", error: "internal_error" });
    expect(JSON.stringify(result)).not.toMatch(/sheet write failed|stack trace|at Object\.|\.js:\d+/i);
    expect(boundaries._debug.isLockHeld()).toBe(false);
  });

  it("locked duplicate-check+append ordering: a sequential retry with the same session/version appends only once and both calls succeed", () => {
    const boundaries = makeFakeBoundaries();
    const first = DecisionQuizCore.processSubmission(JSON.stringify(VALID_PAYLOAD), boundaries);
    const second = DecisionQuizCore.processSubmission(JSON.stringify(VALID_PAYLOAD), boundaries); // double-click / retry
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(boundaries._debug.appendRowCalls).toHaveLength(1);
    expect(boundaries._debug.tryLockCalls).toHaveLength(2); // lock taken and released cleanly both times
  });

  it("a different session_id under the same test_version is treated as a distinct submission", () => {
    const boundaries = makeFakeBoundaries();
    const other = clone(VALID_PAYLOAD);
    other.session_id = "00000000-0000-4000-8000-000000000000";

    DecisionQuizCore.processSubmission(JSON.stringify(VALID_PAYLOAD), boundaries);
    DecisionQuizCore.processSubmission(JSON.stringify(other), boundaries);

    expect(boundaries._debug.appendRowCalls).toHaveLength(2);
  });
});
