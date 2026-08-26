// api/_lib/auroraDecision/validateRequest.js
//
// Pure request-body validation — no DB/network/clock access, so it can be
// unit-tested directly. Mirrors api/_lib/aurora/parseAurora.js's calendar
// round-trip validation approach (small, independent, deliberately not
// imported cross-ticket — see darknessWindow.js header for the same
// reasoning).

import { MAX_LOCATIONS_PER_REQUEST } from "./constants.js";

const EVENING_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidEvening(str) {
  if (typeof str !== "string" || !EVENING_RE.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === str;
}

/**
 * Validates the request body only. Does not resolve location IDs against
 * the canonical dataset (that happens separately in orchestrate.js, since it
 * needs the loaded dataset). Client-supplied tier/entitlement/ranking
 * fields (e.g. `isPro`, `tier`) are simply never read anywhere in this
 * module or its caller — ignored, not merely rejected, so they cannot
 * influence the result by construction.
 */
export function validateAuroraDecisionBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, code: "invalid_body", error: "Request body must be a JSON object." };
  }

  if (!isValidEvening(body.evening)) {
    return { ok: false, status: 400, code: "invalid_evening", error: "evening must be a valid YYYY-MM-DD date." };
  }

  const rawIds = body.locationIds;
  const isStringArray = Array.isArray(rawIds) && rawIds.every((id) => typeof id === "string" && id.length > 0);

  if (!isStringArray || rawIds.length === 0) {
    return {
      ok: false,
      status: 400,
      code: "empty_selection",
      error: "locationIds must be a non-empty array of strings.",
    };
  }

  const locationIds = [...new Set(rawIds)];

  if (locationIds.length > MAX_LOCATIONS_PER_REQUEST) {
    return {
      ok: false,
      status: 400,
      code: "too_many_locations",
      error: `A maximum of ${MAX_LOCATIONS_PER_REQUEST} locations may be requested at once.`,
    };
  }

  return { ok: true, evening: body.evening, locationIds };
}
