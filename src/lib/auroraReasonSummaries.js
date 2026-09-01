// src/lib/auroraReasonSummaries.js
//
// Ticket 398 (#398) — deterministic selection of at most two Pro-only
// reason-summary tiles from the canonical `reasons` array Ticket 2 already
// produces (src/lib/auroraScoring.js). Never fabricates or infers a reason
// beyond what the canonical result actually contains; never reinterprets
// raw weather data.
//
// "Supported" reason codes for tile purposes are deliberately narrower than
// the full canonical reasons vocabulary: activity and sky/cloud visibility,
// per approved prompt §5 ("preferably activity and sky/cloud visibility").
// precipitation/moonlight reasons remain available in the existing expanded
// detailed list (NorthernLightsCard.jsx) but are not summarized into tiles.

const ACTIVITY_REASON_PRIORITY = ["meaningful_activity", "low_activity"];
const SKY_REASON_PRIORITY = ["clear_sky", "partial_cloud", "heavy_cloud", "cloud_hard_cap_applied"];

/**
 * @param {Array<string>} reasons - canonical reasons array (any order).
 * @returns {Array<string>} 0-2 reason codes, deterministic priority order:
 *   the first matching activity reason (if any), then the first matching
 *   sky reason (if any). Never more than one of each category, never more
 *   than two total.
 */
export function selectAuroraReasonSummaries(reasons) {
  const list = Array.isArray(reasons) ? reasons : [];
  const summaries = [];

  const activity = ACTIVITY_REASON_PRIORITY.find((code) => list.includes(code));
  if (activity) summaries.push(activity);

  const sky = SKY_REASON_PRIORITY.find((code) => list.includes(code));
  if (sky) summaries.push(sky);

  return summaries;
}
