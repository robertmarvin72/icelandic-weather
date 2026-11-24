// src/lib/winterRoutePresentation.js
//
// Ticket #486 — small, pure presentation helpers for the winter-route page.
// No scoring/classification logic here (that lives server-side, see
// api/_lib/winterRoute/roadConditionCodes.js) — this is formatting only.

export const SEGMENT_CATEGORY_LABEL_KEY = {
  passable: "winterRouteCategoryPassable",
  hazard_notice: "winterRouteCategoryHazardNotice",
  out_of_service: "winterRouteCategoryOutOfService",
  impassable: "winterRouteCategoryImpassable",
  closed: "winterRouteCategoryClosed",
  unknown_unclassified: "winterRouteCategoryUnknownUnclassified",
};

// Icelandic decimal comma vs. English decimal point — same number either
// way, just the separator (CLAUDE.md: "íslenskar kommur").
export function formatDecimal(value, lang, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const fixed = value.toFixed(digits);
  return lang === "is" ? fixed.replace(".", ",") : fixed;
}

// `hourString` is a fixed "YYYY-MM-DDTHH:00" UTC value from the backend's
// expectedHours list — formatted directly from its own characters, never
// parsed through a Date object, so no local-timezone shift can sneak in.
export function formatHourLabel(hourString) {
  if (typeof hourString !== "string" || hourString.length < 16) return hourString ?? "—";
  const day = hourString.slice(8, 10);
  const month = hourString.slice(5, 7);
  const time = hourString.slice(11, 16);
  return `${day}.${month} ${time}`;
}

// `isoString` is a full ISO-8601 UTC instant (e.g. generatedAt).
export function formatTimestamp(isoString) {
  if (typeof isoString !== "string" || isoString.length < 16) return "—";
  return isoString.slice(0, 16).replace("T", " ");
}

// Ticket #503 source-time, P4 -- unlike formatTimestamp's own existing
// "—" fallback (kept unchanged for its current legacy call site),
// formatTimestamp itself does NOT validate the string beyond a length
// check: any garbage string of 16+ characters slices through silently.
// A new line that must be omitted entirely on invalid input (never
// "— UTC") needs an actual validity check first -- this is that check,
// shared by any UTC instant string (generatedAt, roadSections[].export.
// dagsKeyrtUt): real "YYYY-MM-DDTHH:MM" shape AND a real parseable
// instant, not just long enough. Returns the formatted string, or null
// so the caller can skip the line.
export function formatValidatedUtcTimestamp(isoString) {
  if (typeof isoString !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(isoString)) return null;
  if (!Number.isFinite(Date.parse(isoString))) return null;
  return formatTimestamp(isoString);
}

// Ticket #503 source-time, P3(d) -- honest cache-age-in-minutes display:
// under 60s is "under a minute" (a confident "0 min" would misleadingly
// imply precision that doesn't exist), otherwise Math.round(ms/60000) --
// the SAME rounding the existing stale-line text already uses, so two
// minute figures shown together in the same view never disagree (floor
// would read "6 min" on the stale line and "5 min" here at x:30-x:59s).
// Returns null for anything that isn't a valid non-negative finite
// duration -- the caller must then omit the line, never fabricate an age
// (a backend `cacheAgeMs ?? 0` on an unavailable feed is a real risk this
// guards against, not a non-issue).
export function cacheAgeMinutesDisplay(cacheAgeMs) {
  if (!Number.isFinite(cacheAgeMs) || cacheAgeMs < 0) return null;
  if (cacheAgeMs < 60000) return { underOneMinute: true, minutes: 0 };
  return { underOneMinute: false, minutes: Math.round(cacheAgeMs / 60000) };
}

// N1 correction: the selected forecast hour's own "HH" digits, read
// directly from the fixed "YYYY-MM-DDTHH:00" UTC string — never through a
// Date object (which would apply the browser's local timezone) — for
// src/lib/weatherPresentation.js's isDaytimeHour()/day-night icon choice.
// Returns null for anything not shaped like a valid hour string, so the
// caller's day/night check falls back to its own default rather than
// guessing a value.
export function hourOfDayFromHourString(hourString) {
  if (typeof hourString !== "string" || hourString.length < 13) return null;
  const hour = Number(hourString.slice(11, 13));
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}
