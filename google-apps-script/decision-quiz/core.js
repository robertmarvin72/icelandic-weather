// google-apps-script/decision-quiz/core.js
//
// Deployable Apps Script source for the #395 decision-comprehension research
// quiz backend. Deliberately runtime-neutral: NO reference to SpreadsheetApp,
// LockService, PropertiesService, ContentService, or any other Apps
// Script/browser/Node global. Plain ES5-ish syntax, no `import`/`export`
// (Apps Script does not support ES modules — every file in a project shares
// one global scope) — an IIFE assigns the public API to one global,
// `DecisionQuizCore`, which both the Apps Script adapter (adapter.js, same
// deployed project) and the Vitest harness (see core.test.js / loadCore.js)
// load and exercise identically. This is the literal file uploaded to Apps
// Script — do not add a separate, drifting Node-only validator.
//
// The core owns: schema/enum/type/length/permutation validation,
// canonicalization, idempotency-key derivation, Sheet row/header
// construction, formula-injection neutralization, and stable sanitized
// success/error responses — plus processSubmission(), the orchestration
// sequence (validate -> duplicate-check -> lock -> append -> respond) with
// every Google-global side effect received as an INJECTED boundary function,
// never referenced directly. This is what makes the same file both the real
// deployed logic and a deterministically Vitest-testable unit.

var DecisionQuizCore = (function () {
  "use strict";

  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

  var LANG_VALUES = ["is", "en"];
  var VIEWPORT_VALUES = ["mobile", "desktop"];
  var INTERPRETATION_VALUES = ["stay", "move", "consider", "unsure"];
  var REASON_VALUES = ["weather_better_elsewhere", "weather_similar", "weather_worse_elsewhere", "not_sure_why", "other"];
  var ACTION_VALUES = ["stay_put", "relocate_now", "keep_monitoring", "not_sure", "other"];
  var FIRST_ACTION_VALUES = ["primary_cta", "secondary_link", "none"];
  var KNOWN_SCENARIO_IDS = ["stay", "move", "consider"];

  var MAX_NOTE_LENGTH = 280;
  var MAX_DURATION_MS = 10 * 60 * 1000;
  var MAX_STRING_LENGTH = 100;
  var MAX_BODY_LENGTH = 20000; // generous bound for a 3-scenario JSON payload — rejects abuse-sized bodies before JSON.parse
  var DEFAULT_LOCK_WAIT_MS = 3000;

  var TOP_LEVEL_ALLOWED_KEYS = [
    "campaign", "test_version", "fixture_version", "session_id", "lang", "viewport",
    "client_started_at", "client_completed_at", "scenario_order", "scenarios",
  ];
  var SCENARIO_ALLOWED_KEYS = [
    "scenario_id", "interpretation", "reason", "action", "first_action", "interpretation_ms", "note",
  ];

  var SHEET_HEADERS = [
    "received_at", "session_id", "test_version", "fixture_version", "campaign", "lang", "viewport",
    "client_started_at", "client_completed_at", "scenario_order",
    "scenario_1_id", "scenario_1_interpretation", "scenario_1_reason", "scenario_1_action",
    "scenario_1_first_action", "scenario_1_interpretation_ms", "scenario_1_note",
    "scenario_2_id", "scenario_2_interpretation", "scenario_2_reason", "scenario_2_action",
    "scenario_2_first_action", "scenario_2_interpretation_ms", "scenario_2_note",
    "scenario_3_id", "scenario_3_interpretation", "scenario_3_reason", "scenario_3_action",
    "scenario_3_first_action", "scenario_3_interpretation_ms", "scenario_3_note",
  ];

  function isPlainObject(v) {
    return v !== null && typeof v === "object" && Object.prototype.toString.call(v) === "[object Object]";
  }

  function hasOnlyAllowedKeys(obj, allowed) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      if (allowed.indexOf(keys[i]) === -1) return false;
    }
    return true;
  }

  function isNonEmptyString(v, maxLen) {
    return typeof v === "string" && v.length > 0 && v.length <= (maxLen || MAX_STRING_LENGTH);
  }

  function isValidUuid(v) {
    return typeof v === "string" && UUID_RE.test(v);
  }

  function isValidIso(v) {
    return typeof v === "string" && ISO_RE.test(v) && !isNaN(Date.parse(v));
  }

  function isOneOf(v, list) {
    return list.indexOf(v) !== -1;
  }

  function isValidDurationMs(v) {
    return typeof v === "number" && isFinite(v) && v >= 0 && v <= MAX_DURATION_MS;
  }

  function isValidPermutation(order) {
    if (!Array.isArray(order) || order.length !== KNOWN_SCENARIO_IDS.length) return false;
    var seen = {};
    for (var i = 0; i < order.length; i++) {
      var id = order[i];
      if (KNOWN_SCENARIO_IDS.indexOf(id) === -1) return false;
      if (seen[id]) return false;
      seen[id] = true;
    }
    return true;
  }

  function validateScenario(s) {
    if (!isPlainObject(s)) return "invalid_scenario_shape";
    if (!hasOnlyAllowedKeys(s, SCENARIO_ALLOWED_KEYS)) return "unexpected_scenario_keys";
    if (!isOneOf(s.scenario_id, KNOWN_SCENARIO_IDS)) return "unknown_scenario";
    if (!isOneOf(s.interpretation, INTERPRETATION_VALUES)) return "invalid_interpretation";
    if (!isOneOf(s.reason, REASON_VALUES)) return "invalid_reason";
    if (!isOneOf(s.action, ACTION_VALUES)) return "invalid_action";
    if (!(s.first_action === null || isOneOf(s.first_action, FIRST_ACTION_VALUES))) return "invalid_first_action";
    if (!isValidDurationMs(s.interpretation_ms)) return "invalid_interpretation_ms";
    if (s.note != null && !(typeof s.note === "string" && s.note.length <= MAX_NOTE_LENGTH)) return "note_too_long";
    return null;
  }

  /**
   * Validates a parsed request body against schema/enum/version/permutation
   * rules. `activeVersion` is owner-configured (Apps Script Properties),
   * injected by the caller — this function never reads it itself. Returns
   * { ok: true, payload } or { ok: false, code }. Never throws.
   */
  function validatePayload(body, activeVersion) {
    if (!isPlainObject(body)) return { ok: false, code: "invalid_body" };
    if (!hasOnlyAllowedKeys(body, TOP_LEVEL_ALLOWED_KEYS)) return { ok: false, code: "unexpected_keys" };
    if (!isNonEmptyString(body.test_version, 40) || body.test_version !== activeVersion) {
      return { ok: false, code: "invalid_version" };
    }
    if (!isNonEmptyString(body.fixture_version, 40)) return { ok: false, code: "invalid_fixture_version" };
    if (!isValidUuid(body.session_id)) return { ok: false, code: "invalid_session_id" };
    if (!isOneOf(body.lang, LANG_VALUES)) return { ok: false, code: "invalid_lang" };
    if (!isOneOf(body.viewport, VIEWPORT_VALUES)) return { ok: false, code: "invalid_viewport" };
    if (!isValidIso(body.client_started_at)) return { ok: false, code: "invalid_client_started_at" };
    if (!isValidIso(body.client_completed_at)) return { ok: false, code: "invalid_client_completed_at" };
    if (body.campaign != null && !isNonEmptyString(body.campaign, 100)) return { ok: false, code: "invalid_campaign" };
    if (!isValidPermutation(body.scenario_order)) return { ok: false, code: "invalid_permutation" };
    if (!Array.isArray(body.scenarios) || body.scenarios.length !== KNOWN_SCENARIO_IDS.length) {
      return { ok: false, code: "invalid_scenarios" };
    }

    var seenScenarioIds = {};
    for (var i = 0; i < body.scenarios.length; i++) {
      var err = validateScenario(body.scenarios[i]);
      if (err) return { ok: false, code: err };
      var sid = body.scenarios[i].scenario_id;
      if (seenScenarioIds[sid]) return { ok: false, code: "duplicate_scenario" };
      seenScenarioIds[sid] = true;
    }
    for (var j = 0; j < body.scenario_order.length; j++) {
      if (!seenScenarioIds[body.scenario_order[j]]) return { ok: false, code: "scenario_order_mismatch" };
    }

    return { ok: true, payload: body };
  }

  // Google Sheets treats a cell starting with =, +, -, or @ as a formula.
  // Prefixing with a leading apostrophe (Sheets' own literal-text escape)
  // neutralizes it while preserving the visible text. Leading whitespace is
  // stripped before the check so "  =SUM(...)" cannot bypass it.
  function neutralizeFormula(value) {
    if (typeof value !== "string") return value;
    var trimmed = value.replace(/^\s+/, "");
    if (/^[=+\-@]/.test(trimmed)) return "'" + value;
    return value;
  }

  function deriveIdempotencyKey(testVersion, sessionId) {
    return testVersion + ":" + sessionId;
  }

  /**
   * Builds one flat, header-ordered Sheet row from an already-validated
   * payload. Every participant-controlled string is formula-neutralized.
   * `receivedAtIso` must come from the adapter's own clock, never the
   * client's — server receipt time is authoritative only for receipt.
   */
  function buildRow(payload, receivedAtIso) {
    var byId = {};
    for (var i = 0; i < payload.scenarios.length; i++) {
      byId[payload.scenarios[i].scenario_id] = payload.scenarios[i];
    }

    var row = [
      receivedAtIso,
      payload.session_id,
      payload.test_version,
      payload.fixture_version,
      neutralizeFormula(payload.campaign || ""),
      payload.lang,
      payload.viewport,
      payload.client_started_at,
      payload.client_completed_at,
      neutralizeFormula(payload.scenario_order.join(",")),
    ];

    for (var s = 0; s < payload.scenario_order.length; s++) {
      var sc = byId[payload.scenario_order[s]];
      row.push(
        sc.scenario_id,
        sc.interpretation,
        sc.reason,
        sc.action,
        sc.first_action || "none",
        sc.interpretation_ms,
        neutralizeFormula(sc.note || ""),
      );
    }

    return row;
  }

  function successResponse(receivedAtIso) {
    return { ok: true, receivedAt: receivedAtIso };
  }

  // Deliberately minimal — never includes Sheet IDs, row data, stack traces,
  // or owner details.
  function errorResponse(code) {
    return { ok: false, code: code, error: code };
  }

  /**
   * Full orchestration: parse -> validate -> duplicate-check+append inside
   * one bounded lock -> respond. Every Google-global effect is an injected
   * boundary function on `boundaries`:
   *   - activeVersion: string
   *   - now(): ISO string (server clock)
   *   - lock: { tryLock(waitMs): boolean, releaseLock(): void }
   *   - sheet: { findExistingRow(idempotencyKey): rowOrNull, appendRow(row): void }
   *   - lockWaitMs?: number (default DEFAULT_LOCK_WAIT_MS)
   *
   * Never throws — always returns a stable, sanitized response object. The
   * adapter's doPost(e) is the ONLY place these boundaries are given real
   * SpreadsheetApp/LockService implementations; Vitest supplies fakes.
   */
  function processSubmission(rawBody, boundaries) {
    if (typeof rawBody !== "string" || rawBody.length === 0) {
      return errorResponse("invalid_body");
    }
    if (rawBody.length > MAX_BODY_LENGTH) {
      return errorResponse("payload_too_large");
    }

    var body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse("invalid_json");
    }

    var validation = validatePayload(body, boundaries.activeVersion);
    if (!validation.ok) return errorResponse(validation.code);

    var payload = validation.payload;
    var idempotencyKey = deriveIdempotencyKey(payload.test_version, payload.session_id);
    var lockWaitMs = boundaries.lockWaitMs || DEFAULT_LOCK_WAIT_MS;

    var acquired;
    try {
      acquired = boundaries.lock.tryLock(lockWaitMs);
    } catch {
      return errorResponse("internal_error");
    }
    if (!acquired) return errorResponse("busy");

    try {
      var existing = boundaries.sheet.findExistingRow(idempotencyKey);
      if (existing) {
        // Idempotent retry: data is already saved — this is a genuine
        // success from the client's point of view, not a duplicate error.
        return successResponse(existing.receivedAt || boundaries.now());
      }

      var receivedAt = boundaries.now();
      var row = buildRow(payload, receivedAt);
      boundaries.sheet.appendRow(row, idempotencyKey);
      return successResponse(receivedAt);
    } catch {
      return errorResponse("internal_error");
    } finally {
      try {
        boundaries.lock.releaseLock();
      } catch {
        // Releasing a lock we hold should not throw in practice; swallow
        // defensively so a release failure never masks the real response.
      }
    }
  }

  return {
    SHEET_HEADERS: SHEET_HEADERS,
    KNOWN_SCENARIO_IDS: KNOWN_SCENARIO_IDS,
    MAX_NOTE_LENGTH: MAX_NOTE_LENGTH,
    DEFAULT_LOCK_WAIT_MS: DEFAULT_LOCK_WAIT_MS,
    validatePayload: validatePayload,
    neutralizeFormula: neutralizeFormula,
    deriveIdempotencyKey: deriveIdempotencyKey,
    buildRow: buildRow,
    successResponse: successResponse,
    errorResponse: errorResponse,
    processSubmission: processSubmission,
  };
})();
