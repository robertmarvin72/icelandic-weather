// api/_lib/auroraDecision/orchestrate.js
//
// Ties request validation, Aurora cache freshness/night selection, weather
// fan-out, and ranking together. All I/O (sql, fetchImpl, now, the loaded
// canonical location list) is passed in by the caller so this function is
// fully unit-testable without a real DB, network, or wall clock.
//
// Returns { httpStatus, body } uniformly — the actual Vercel handler
// (api/aurora-decision.js) just forwards this to res.status(...).json(...).

import { readAuroraSnapshot } from "../aurora/cache.js";
import { classifyAuroraCache, selectNightForEvening } from "./freshness.js";
import { computeNationalDarknessWindow } from "./darknessWindow.js";
import { fetchWeatherForLocations } from "./fanout.js";
import { buildRankedDecision } from "./rankDecision.js";
import { resolveLocationIds } from "./resolveLocations.js";
import { validateAuroraDecisionBody } from "./validateRequest.js";

function nextCalendarDate(evening) {
  const ms = Date.parse(`${evening}T00:00:00Z`);
  return new Date(ms + 24 * 3600 * 1000).toISOString().slice(0, 10);
}

function unavailableResponse({ evening, auroraCache, reason }) {
  return {
    httpStatus: 200,
    body: {
      ok: true,
      evening,
      auroraCache,
      viewingWindow: null,
      status: "unavailable",
      reason,
      best: null,
      alternatives: [],
      excluded: [],
      warnings: [],
    },
  };
}

export async function runAuroraDecision({ body, sql, fetchImpl, now, canonicalLocations }) {
  const validated = validateAuroraDecisionBody(body);
  if (!validated.ok) {
    return {
      httpStatus: validated.status,
      body: { ok: false, code: validated.code, error: validated.error },
    };
  }

  const { evening, locationIds } = validated;

  const { resolved, unknownIds } = resolveLocationIds(locationIds, canonicalLocations);
  if (unknownIds.length > 0) {
    return {
      httpStatus: 400,
      body: {
        ok: false,
        code: "unknown_location_ids",
        error: "One or more location IDs are not recognized.",
        details: { unknownIds },
      },
    };
  }

  const cacheRow = await readAuroraSnapshot(sql);
  const auroraCache = classifyAuroraCache(cacheRow, now());

  if (auroraCache.state === "unavailable") {
    return unavailableResponse({ evening, auroraCache, reason: "aurora_cache_unavailable" });
  }

  const night = selectNightForEvening(cacheRow.snapshot.nights, evening);
  if (!night) {
    return unavailableResponse({ evening, auroraCache, reason: "night_not_found" });
  }

  const viewingWindow = computeNationalDarknessWindow(night);
  if (!viewingWindow) {
    return unavailableResponse({ evening, auroraCache, reason: "invalid_darkness_window" });
  }

  const startDate = evening;
  const endDate = nextCalendarDate(evening);

  const weatherResults = await fetchWeatherForLocations({
    locations: resolved,
    startDate,
    endDate,
    fetchImpl,
  });

  const { best, alternatives, excluded } = buildRankedDecision({ weatherResults, night, viewingWindow });

  const warnings = ["national_reference_window"];
  if (auroraCache.state === "stale") warnings.push("aurora_data_stale");
  if (excluded.length > 0) warnings.push("some_locations_excluded");

  if (!best) {
    return {
      httpStatus: 200,
      body: {
        ok: true,
        evening,
        auroraCache,
        viewingWindow,
        status: "unavailable",
        reason: "no_locations_scored",
        best: null,
        alternatives: [],
        excluded,
        warnings,
      },
    };
  }

  return {
    httpStatus: 200,
    body: {
      ok: true,
      evening,
      auroraCache,
      viewingWindow,
      status: excluded.length > 0 ? "partial" : "success",
      best,
      alternatives,
      excluded,
      warnings,
    },
  };
}
