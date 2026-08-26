// api/_lib/auroraDecision/darknessWindow.js
//
// Deliberately duplicates the small, host-timezone-independent HH:MM ->
// calendar-day reconstruction rule already proven and tested in
// src/lib/auroraScoring.js (private there). The approved Ticket 3 prompt
// requires importing and calling scoreAuroraVisibility "unchanged" — so
// rather than modifying that file's export surface, this pure date-math
// helper (no weights, no scoring formula) is reimplemented here. It is
// intentionally identical to Ticket 2's rule for consistency: an hour before
// 12 belongs to eveningDate+1, an hour at/after 12 belongs to eveningDate.
//
// This is the "national darkness window" — see module-level limitation
// notes in src/lib/auroraScoring.js: the Vedur.is feed carries no location
// metadata, so this window is a national reference, not campsite-specific.

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function reconstructTimestampMs(eveningDate, hhmm) {
  if (typeof eveningDate !== "string" || typeof hhmm !== "string") return null;

  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!timeMatch) return null;

  const baseMs = Date.parse(`${eveningDate}T00:00:00Z`);
  if (Number.isNaN(baseMs)) return null;

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const dayOffset = hour < 12 ? 1 : 0;

  return baseMs + dayOffset * MS_PER_DAY + hour * MS_PER_HOUR + minute * MS_PER_MINUTE;
}

/**
 * Returns { start, end } as ISO 8601 UTC strings, or null if the night's
 * sun.darknessStart/sun.dawn are missing, malformed, or non-chronological.
 * Never fabricates a window from partial data.
 */
export function computeNationalDarknessWindow(night) {
  const start = reconstructTimestampMs(night?.eveningDate, night?.sun?.darknessStart);
  const end = reconstructTimestampMs(night?.eveningDate, night?.sun?.dawn);
  if (start == null || end == null || end <= start) return null;
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}
