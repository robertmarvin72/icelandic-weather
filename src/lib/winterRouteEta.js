// src/lib/winterRouteEta.js
//
// Winter Route Advisor — ETA-aware forecast selection (follow-up to #486).
// Deliberately client-side only, matching the page's existing design (hour
// selection never triggers a new network request — the backend already
// returns all 24 hourly slots per point; this module only decides WHICH
// already-fetched slot each point's card should read). A fixed assumed
// average speed turns the selected departure hour + a point's approximate
// distance-from-start into "which fetched hourly forecast slot to show" —
// NOT a traffic/road-condition-aware calculation, NOT a recommended
// driving speed, NOT a safety estimate (see WinterRoute.jsx's existing
// disclaimer copy, unchanged by this feature).
//
// This is a small, deliberate duplicate of the same pure arithmetic that
// would live in api/_lib/ if this were a backend concern — it isn't: the
// project's own api/<->src boundary (api/_lib/* is server-only, never
// imported from src/, see CLAUDE.md/openMeteoAuth.js's own doc-comment)
// means a ~20-line pure function is copied rather than shared, not a new
// cross-boundary import.

// Owner-approved constant — a conservative placeholder for computing which
// forecast hour to show, explicitly NOT advice on how fast to actually
// drive. Changing this is a product decision, not a code change elsewhere.
export const ASSUMED_AVERAGE_SPEED_KMH = 70;

const HOUR_STRING_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:00$/;

function parseHourStringToMs(hourString) {
  // Strict shape check first — Date.parse() is lenient enough to coerce
  // some malformed strings into a plausible-looking instant instead of
  // NaN, which would otherwise silently fabricate an arrival time.
  if (typeof hourString !== "string" || !HOUR_STRING_RE.test(hourString)) return null;
  const ms = Date.parse(`${hourString}:00Z`);
  return Number.isFinite(ms) ? ms : null;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toHourString(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:00`;
}

/**
 * `departureHourString` is one of the already-fetched 24 hourly slots
 * (a "YYYY-MM-DDTHH:00" UTC string, always already exactly on the hour).
 * `distanceKm` is the point's approximate distance from the corridor's
 * start (from the API response's `approxDistanceFromStartKm`); `null`/
 * invalid distance is an explicit "cannot estimate", never coerced to 0.
 *
 * Returns `{ rawArrivalMs, forecastHour }`:
 * - `rawArrivalMs` — the precise estimated arrival instant (for display
 *   with minutes), or `null` if it cannot be computed.
 * - `forecastHour` — the next whole hourly forecast slot AT OR AFTER the
 *   raw arrival instant (ceiling, never floor/round-down, never a modulo-
 *   wrapped index — real date arithmetic, so a value past the end of the
 *   fetched window is a genuine, honest "no forecast at the computed
 *   time" outcome for the caller to handle, not an error here).
 */
export function computeEta(departureHourString, distanceKm, speedKmh = ASSUMED_AVERAGE_SPEED_KMH) {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return { rawArrivalMs: null, forecastHour: null };
  }
  if (typeof speedKmh !== "number" || !Number.isFinite(speedKmh) || speedKmh <= 0) {
    return { rawArrivalMs: null, forecastHour: null };
  }

  const departureMs = parseHourStringToMs(departureHourString);
  if (departureMs == null) {
    return { rawArrivalMs: null, forecastHour: null };
  }

  const travelHours = distanceKm / speedKmh;
  const rawArrivalMs = departureMs + travelHours * 3600000;
  const forecastHour = toHourString(new Date(Math.ceil(rawArrivalMs / 3600000) * 3600000));

  return { rawArrivalMs, forecastHour };
}

/**
 * #489 follow-up — the exact same per-point "which fetched hourly slot"
 * resolution `ForecastCard` already does, pulled into one shared function
 * so the new route-level summary reads the identical card/summary time
 * for each point rather than a second parallel computation. `point` is one
 * entry of the API response's `forecast.points[]` (so `point.available`,
 * `point.hours`, `point.approxDistanceFromStartKm` are already present);
 * an unavailable point or an unresolvable/out-of-window arrival both
 * produce `hasHour: false` — the same "not available" outcome `ForecastCard`
 * already renders, never a 0/guessed index.
 */
export function resolvePointAtDeparture(point, departureHourString) {
  if (!point || !point.available) {
    return { rawArrivalMs: null, forecastHour: null, hourIndex: -1, hasHour: false };
  }
  const { rawArrivalMs, forecastHour } = computeEta(departureHourString, point.approxDistanceFromStartKm);
  const hourIndex = forecastHour != null ? point.hours.indexOf(forecastHour) : -1;
  return { rawArrivalMs, forecastHour, hourIndex, hasHour: hourIndex >= 0 };
}
