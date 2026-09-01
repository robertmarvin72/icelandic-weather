// src/lib/auroraDisplaySelection.js
//
// Ticket 397 (issue #397) — pure presentation-selection helper. Consumes
// Ticket 3's canonical `best`/`alternatives` order unchanged: never
// re-scores, re-ranks, or mutates. Derives display eligibility only from
// each entry's existing canonical `band` (approved prompt §2/§3).

export const QUALIFYING_BANDS = new Set(["excellent", "good", "fair"]);
export const MAX_QUALIFYING_LOCATIONS = 6;
export const MIN_LOCATIONS_FOR_MAP = 2;
export const MIN_DISTINCT_BANDS_FOR_MAP = 2;

/**
 * @param {object} params
 * @param {object|null} params.best - Ticket 3's canonical best (or null).
 * @param {Array<object>} params.alternatives - Ticket 3's canonical alternatives, in order.
 * @param {boolean} params.isPro - presentation-only gate; never affects which
 *   locations qualify, only whether the ranking/list is actually rendered.
 * @returns {{
 *   qualifyingLocations: Array<object>,
 *   hasQualifyingLocations: boolean,
 *   bestAvailable: object|null,
 *   showRanking: boolean,
 *   showMap: boolean,
 * }}
 */
export function selectAuroraDisplay({ best, alternatives, isPro }) {
  const ranked = best ? [best, ...(Array.isArray(alternatives) ? alternatives : [])] : [];

  // Stable filter, canonical order preserved, capped at six — never
  // backfilled with non-qualifying entries to reach six.
  const qualifyingLocations = ranked.filter((loc) => QUALIFYING_BANDS.has(loc?.band)).slice(0, MAX_QUALIFYING_LOCATIONS);

  const hasQualifyingLocations = qualifyingLocations.length > 0;
  const showRanking = !!isPro && hasQualifyingLocations;

  const distinctBands = new Set(qualifyingLocations.map((loc) => loc.band));
  const showMap =
    showRanking &&
    qualifyingLocations.length >= MIN_LOCATIONS_FOR_MAP &&
    distinctBands.size >= MIN_DISTINCT_BANDS_FOR_MAP;

  return {
    qualifyingLocations,
    hasQualifyingLocations,
    bestAvailable: best ?? null,
    showRanking,
    showMap,
  };
}
