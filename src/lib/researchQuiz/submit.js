// src/lib/researchQuiz/submit.js
//
// Browser submission — a tested CORS "simple request": POST,
// Content-Type: text/plain;charset=utf-8, no custom/preflight-triggering
// headers, a serialized JSON string body. This is the only shape a Google
// Apps Script web app (doGet/doPost only, no OPTIONS handling) can answer
// without a browser preflight (approved prompt §"Required preflight" #4).
//
// Verified integration fact (see cc-report.md for sources): an Apps Script
// doPost that responds via ContentService.createTextOutput(...) — NOT
// HtmlService — returns a response a normal browser fetch() (default 'cors'
// mode) CAN read (status + body), for exactly this simple-request shape.
// mode: "no-cors" is never used here — an opaque response can never be
// labeled confirmed.

import { RESEARCH_QUIZ_SUBMIT_TIMEOUT_MS } from "../../config/researchQuiz.js";

export const SUBMIT_STATUS = {
  CONFIRMED: "confirmed",
  FAILED: "failed",
  UNCONFIRMED: "unconfirmed",
};

/**
 * Submits payload and returns a stable, structured outcome — never throws.
 * The SAME sessionId/payload is always safe to resend: the Apps Script core
 * deduplicates on (test_version, session_id), so callers may retry any
 * "failed"/"unconfirmed" result with byte-identical input.
 */
export async function submitResearchQuizPayload({
  webAppUrl,
  payload,
  fetchImpl = fetch,
  timeoutMs = RESEARCH_QUIZ_SUBMIT_TIMEOUT_MS,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetchImpl(webAppUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      return { status: SUBMIT_STATUS.UNCONFIRMED, reason: "timeout" };
    }
    return { status: SUBMIT_STATUS.UNCONFIRMED, reason: "network_error" };
  }
  clearTimeout(timer);

  let body;
  try {
    body = await response.json();
  } catch {
    return { status: SUBMIT_STATUS.UNCONFIRMED, reason: "unreadable_response" };
  }

  if (body && body.ok === true) {
    return { status: SUBMIT_STATUS.CONFIRMED, receivedAt: body.receivedAt ?? null };
  }

  if (body && body.ok === false) {
    return {
      status: SUBMIT_STATUS.FAILED,
      retryable: body.code === "busy",
      code: body.code ?? "unknown_error",
      error: body.error ?? null,
    };
  }

  return { status: SUBMIT_STATUS.UNCONFIRMED, reason: "unexpected_response_shape" };
}
