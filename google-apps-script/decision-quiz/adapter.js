// google-apps-script/decision-quiz/adapter.js
//
// Thin Google-global wiring for the #395 decision-quiz backend. Owns ONLY
// PropertiesService reads, e.postData parsing, LockService, SpreadsheetApp,
// and ContentService — every validation/business-logic decision lives in
// core.js's DecisionQuizCore, loaded into the same Apps Script project's
// shared global scope (both files must be deployed together; do not rename
// either without updating the other).
//
// CRITICAL: doPost/doGet must return ContentService.createTextOutput(...),
// never HtmlService — HtmlService responses are not readable by a browser
// fetch() even for an otherwise-simple, non-preflighted request (verified
// against documented, tested Apps Script CORS behavior — see cc-report.md).
//
// Required Script Properties (Apps Script editor > Project Settings >
// Script Properties — see docs/research/decision-quiz/README.md for full
// setup steps):
//   SPREADSHEET_ID       - the private Google Sheet's ID (never exposed to the frontend)
//   SHEET_TAB_NAME       - target tab name (created with headers if missing)
//   ACTIVE_TEST_VERSION  - must match the frontend's RESEARCH_QUIZ_TEST_VERSION exactly

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: props.getProperty("SPREADSHEET_ID"),
    sheetTabName: props.getProperty("SHEET_TAB_NAME") || "responses",
    activeVersion: props.getProperty("ACTIVE_TEST_VERSION"),
  };
}

function getOrCreateSheet_(spreadsheetId, tabName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(DecisionQuizCore.SHEET_HEADERS);
  }
  return sheet;
}

// Idempotency lookup: session_id is column B, test_version is column C (see
// DecisionQuizCore.SHEET_HEADERS). Scanning both columns together is
// sufficient at this quiz's expected low submission volume — no separate
// auxiliary store is needed, and it can never drift from the Sheet itself.
function findExistingRow_(sheet, idempotencyKey) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues(); // received_at, session_id, test_version
  for (var i = 0; i < values.length; i++) {
    var sessionId = values[i][1];
    var testVersion = values[i][2];
    if (DecisionQuizCore.deriveIdempotencyKey(testVersion, sessionId) === idempotencyKey) {
      return { receivedAt: values[i][0] };
    }
  }
  return null;
}

function doPost(e) {
  var config = getConfig_();
  var rawBody = (e && e.postData && e.postData.contents) || "";
  var lock = LockService.getScriptLock();
  var sheet = null; // resolved lazily, only once the lock is held

  var result = DecisionQuizCore.processSubmission(rawBody, {
    activeVersion: config.activeVersion,
    now: function () {
      return new Date().toISOString();
    },
    lock: {
      tryLock: function (waitMs) {
        return lock.tryLock(waitMs);
      },
      releaseLock: function () {
        lock.releaseLock();
      },
    },
    sheet: {
      findExistingRow: function (idempotencyKey) {
        sheet = sheet || getOrCreateSheet_(config.spreadsheetId, config.sheetTabName);
        return findExistingRow_(sheet, idempotencyKey);
      },
      appendRow: function (row) {
        sheet = sheet || getOrCreateSheet_(config.spreadsheetId, config.sheetTabName);
        sheet.appendRow(row);
      },
    },
  });

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// This endpoint accepts no GET-based submissions or reads — doGet exists
// only so a manual browser visit returns a neutral response instead of Apps
// Script's default error page. No Sheet data is ever readable this way.
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, code: "method_not_supported" })).setMimeType(
    ContentService.MimeType.JSON,
  );
}
