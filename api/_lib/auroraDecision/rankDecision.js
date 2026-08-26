// api/_lib/auroraDecision/rankDecision.js
//
// Deterministic decision assembly. Imports and calls the canonical Ticket 2
// scorer UNCHANGED — no formula/weights/status reinterpretation happens
// here. Orchestration/ranking metadata (locationId, name, lat, lon) is added
// to a NEW object rather than mutating the scorer's own result object.

import { scoreAuroraVisibility } from "../../../src/lib/auroraScoring.js";

/**
 * Total ordering: score descending, then canonical location ID ascending.
 * The approved prompt permits an audited weather-quality tie-break only if
 * one is reliably available; none was found that could be added without
 * inventing semantics, so canonical ID is used as the sole, stable
 * tie-break per the prompt's own fallback instruction (§7).
 */
function compareRanked(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (a.locationId < b.locationId) return -1;
  if (a.locationId > b.locationId) return 1;
  return 0;
}

/**
 * Runs the Ticket 2 scorer for each location's independently-normalized
 * weather and assembles a ranked decision. Only `status: "scored"` results
 * participate in ranking; every other outcome (weather fetch failure,
 * `insufficient_data`, `not_viewable_tonight`) is preserved in `excluded`
 * with its own status/reasons, never coerced into a low score.
 */
export function buildRankedDecision({ weatherResults, night, viewingWindow }) {
  const scoredEntries = [];
  const excluded = [];

  for (const weatherResult of weatherResults) {
    const loc = weatherResult.location;

    if (!weatherResult.ok) {
      excluded.push({
        locationId: loc.id,
        name: loc.name,
        status: weatherResult.reason,
        reasons: [weatherResult.reason],
      });
      continue;
    }

    const scored = scoreAuroraVisibility({ night, hourlyRows: weatherResult.hourlyRows, viewingWindow });

    if (scored.status !== "scored") {
      excluded.push({
        locationId: loc.id,
        name: loc.name,
        status: scored.status,
        reasons: scored.reasons,
      });
      continue;
    }

    scoredEntries.push({
      locationId: loc.id,
      name: loc.name,
      lat: loc.lat,
      lon: loc.lon,
      score: scored.score,
      band: scored.band,
      reasons: scored.reasons,
      flags: scored.flags,
    });
  }

  scoredEntries.sort(compareRanked);

  const best = scoredEntries[0] || null;
  const alternatives = scoredEntries.slice(1);

  return { best, alternatives, excluded };
}
