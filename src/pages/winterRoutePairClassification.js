// src/pages/winterRoutePairClassification.js
//
// Ticket #503 — frontend-only pair classification, duplicated from the
// backend's own resolver pair-allowlists (src/ must not import api/ code
// directly, the bundler boundary already used for winterRoutePlaces.js/
// winterRouteRoutes.js). Pulled out of WinterRoute.jsx into its own module
// (rather than exported alongside the page component) so the repo-checked
// front/back parity test (ticket #503 ring-completion, P7) can import it
// without tripping the "a component file may only export components"
// fast-refresh lint rule.
export const BUDARDALUR_HOLMAVIK_PLACE_IDS = new Set(["budardalur", "holmavik"]);
export function isBudardalurHolmavikPair(from, to) {
  return from !== to && BUDARDALUR_HOLMAVIK_PLACE_IDS.has(from) && BUDARDALUR_HOLMAVIK_PLACE_IDS.has(to);
}

// Ticket #503 westfjords-batch (api/_lib/winterRoute/westfjordsBatchRoute.js).
const WESTFJORDS_BATCH_PAIRS = [
  ["budardalur", "flokalundur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"],
  ["flokalundur", "patreksfjordur"], ["flokalundur", "talknafjordur"], ["patreksfjordur", "talknafjordur"],
];
const WESTFJORDS_BATCH_PAIR_KEYS = new Set(WESTFJORDS_BATCH_PAIRS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
export function isWestfjordsBatchPair(from, to) {
  return from !== to && WESTFJORDS_BATCH_PAIR_KEYS.has(`${from}|${to}`);
}

// Ticket #503 westfjords-completion (api/_lib/winterRoute/westfjordsCompletionRoute.js).
const WESTFJORDS_COMPLETION_PAIRS = [
  ["budardalur", "isafjordur"], ["flokalundur", "isafjordur"], ["isafjordur", "holmavik"],
  ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"], ["flokalundur", "holmavik"],
  ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"],
];
const WESTFJORDS_COMPLETION_PAIR_KEYS = new Set(WESTFJORDS_COMPLETION_PAIRS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
export function isWestfjordsCompletionPair(from, to) {
  return from !== to && WESTFJORDS_COMPLETION_PAIR_KEYS.has(`${from}|${to}`);
}

export function isWinterRouteDataPair(from, to) {
  return isBudardalurHolmavikPair(from, to) || isWestfjordsBatchPair(from, to) || isWestfjordsCompletionPair(from, to);
}

// Ticket #503 ring-options (api/_lib/winterRoute/ringOptionsRoute.js).
// Unlike the Westfjords pairs, these two ALSO require a valid `option`
// (south|north) taken from the geometry response's own `selectedOption`
// -- never hardcoded, never re-derived client-side (P8a).
const RING_OPTION_PAIR_KEYS = new Set([
  "reykjavik-raudavatn|selfoss", "selfoss|reykjavik-raudavatn",
  "reykjavik-raudavatn|hella", "hella|reykjavik-raudavatn",
]);
export function isRingOptionPair(from, to) {
  return from !== to && RING_OPTION_PAIR_KEYS.has(`${from}|${to}`);
}

// Ticket #503 ring-completion (api/_lib/winterRoute/ringCompletionRoute.js).
// No option at all for these eight pairs.
const RING_COMPLETION_PAIR_KEYS = new Set([
  "reykjavik-raudavatn|egilsstadir", "egilsstadir|reykjavik-raudavatn",
  "reykjavik-raudavatn|seydisfjordur", "seydisfjordur|reykjavik-raudavatn",
  "selfoss|hella", "hella|selfoss",
  "selfoss|egilsstadir", "egilsstadir|selfoss",
  "selfoss|seydisfjordur", "seydisfjordur|selfoss",
  "hella|egilsstadir", "egilsstadir|hella",
  "hella|seydisfjordur", "seydisfjordur|hella",
  "egilsstadir|seydisfjordur", "seydisfjordur|egilsstadir",
]);
export function isRingCompletionPair(from, to) {
  return from !== to && RING_COMPLETION_PAIR_KEYS.has(`${from}|${to}`);
}

// P3 -- which of the three mutually-exclusive response identity shapes a
// pair is allowed to carry: Westfjords `regionVersion`; the two option
// pairs `selectedOption`+`policyVersion`(+`datasetVersion`); the eight
// generic ring-completion pairs `datasetVersion` only. Used so the UI can
// reject a malformed/blended response, not just a missing one.
export function identityKindFor(from, to) {
  if (isWinterRouteDataPair(from, to)) return "region";
  if (isRingOptionPair(from, to)) return "option";
  if (isRingCompletionPair(from, to)) return "generic";
  return null;
}
