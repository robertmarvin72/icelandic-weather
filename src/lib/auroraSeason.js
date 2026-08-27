// src/lib/auroraSeason.js
//
// Deterministic, timezone-explicit Northern Lights season rule. Iceland does
// not observe DST and its standard time is UTC+0 year-round, so reading the
// UTC calendar month IS Icelandic local time here — no timezone conversion
// is needed, and adding one would be incorrect, not merely redundant.
//
// Season: September through March (inclusive) — the months when
// astronomically meaningful darkness reliably exists in Iceland. This is
// deliberately distinct from "is Aurora activity high" or "is data
// available" (see auroraDecisionClassify.js) — this rule only controls
// whether the feature mounts/requests at all.

const SEASON_START_MONTH = 9; // September
const SEASON_END_MONTH = 3; // March

export function isAuroraSeason(date = new Date()) {
  const month = date.getUTCMonth() + 1; // 1-12
  return month >= SEASON_START_MONTH || month <= SEASON_END_MONTH;
}

// "Evening" in Ticket 3's YYYY-MM-DD contract, read as the current UTC
// calendar date — see module header for why UTC is correct here, not a
// simplification.
export function todayEveningUtc(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
