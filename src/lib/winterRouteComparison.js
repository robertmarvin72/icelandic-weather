// src/lib/winterRouteComparison.js
//
// Winter Route Advisor — departure-time comparison (follow-up to #489).
// Three labeled departure options around the current selection (−2h,
// baseline, +2h), each reusing #489's own weather-extrema computation
// unchanged — this module adds no new ETA model, no new upstream data, no
// new rounding/speed rule. An option is only "available" for the
// comparison when ALL SIX fixed points individually resolve AND all three
// #489 metrics have full six-point coverage at that departure — a
// strictly stricter bar than the cards/#489 summary use for their own
// (legitimately partial) display, by design (see WinterRoute.jsx).

import { resolvePointAtDeparture } from "./winterRouteEta";
import { computeWeatherExtremaSummary } from "./winterRouteSummary";

const HOUR_STRING_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:00$/;

function parseHourStringToMs(hourString) {
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

// Real UTC date arithmetic (never a string-slice or local-timezone Date
// read), so a −2h/+2h offset crosses a UTC day boundary correctly.
// Returns null for an unparsable/missing base hour.
export function offsetHourString(hourString, offsetHours) {
  const ms = parseHourStringToMs(hourString);
  if (ms == null) return null;
  return toHourString(new Date(ms + offsetHours * 3600000));
}

// S1(b) — a fixed, closed, already-translated-elsewhere reason list; the
// UI maps each of these to its own IS/EN string, never an internal/English
// keyword leaking into the Icelandic UI. Checked in this exact 1->2->3->4
// priority so exactly one stable reason is shown when more than one would
// apply (S1's own explicit ordering).
export const COMPARISON_UNAVAILABLE_REASON = {
  NOT_UPCOMING: "not_upcoming", // 1: past, or not one of the current selectable departure hours
  ARRIVAL_OUTSIDE_WINDOW: "arrival_outside_window", // 2: a point's resolved arrival falls outside its fetched hours
  POINT_UNAVAILABLE: "point_unavailable", // 3: a point itself is unavailable/missing
  METRIC_GAP: "metric_gap", // 4: a data gap in at least one of the three summary metrics
};

/**
 * `departureHour` — the candidate departure ("YYYY-MM-DDTHH:00" UTC) or
 * `null`. `availableHours` — the page's own already-computed list of
 * future, in-window hours (same list the existing `<select>` offers).
 * `points` — `data.forecast.points` (or `[]`).
 *
 * Returns `{ departureHour, available, reason, summary }`. `summary` is
 * #489's own `computeWeatherExtremaSummary()` result for this departure,
 * present only when `available` is true. A real `0` value is valid and
 * never treated as a gap (inherited unchanged from #489's own rules).
 */
export function computeDepartureOption(departureHour, availableHours, points) {
  const safeAvailableHours = Array.isArray(availableHours) ? availableHours : [];
  const safePoints = Array.isArray(points) ? points : [];

  if (departureHour == null || !safeAvailableHours.includes(departureHour)) {
    return { departureHour, available: false, reason: COMPARISON_UNAVAILABLE_REASON.NOT_UPCOMING, summary: null };
  }

  let arrivalOutsideWindow = false;
  let pointUnavailable = false;
  for (const point of safePoints) {
    if (!point?.available) {
      pointUnavailable = true;
      continue;
    }
    const { hasHour } = resolvePointAtDeparture(point, departureHour);
    if (!hasHour) arrivalOutsideWindow = true;
  }

  if (arrivalOutsideWindow) {
    return {
      departureHour,
      available: false,
      reason: COMPARISON_UNAVAILABLE_REASON.ARRIVAL_OUTSIDE_WINDOW,
      summary: null,
    };
  }
  if (pointUnavailable) {
    return { departureHour, available: false, reason: COMPARISON_UNAVAILABLE_REASON.POINT_UNAVAILABLE, summary: null };
  }

  const summary = computeWeatherExtremaSummary(safePoints, departureHour);
  const fullSixPointCoverage = [summary.maxGust, summary.maxPrecip, summary.minTemp].every(
    (metric) => metric.validCount === 6
  );
  if (!fullSixPointCoverage) {
    return { departureHour, available: false, reason: COMPARISON_UNAVAILABLE_REASON.METRIC_GAP, summary: null };
  }

  return { departureHour, available: true, reason: null, summary };
}

// The three labeled options around `selectedHour`: −2h, the selection
// itself (offsetHours: 0), +2h — in this fixed left-to-right order.
export function computeDepartureOptionSet(selectedHour, availableHours, points) {
  return [-2, 0, 2].map((offsetHours) => {
    const departureHour = selectedHour != null ? offsetHourString(selectedHour, offsetHours) : null;
    return { offsetHours, ...computeDepartureOption(departureHour, availableHours, points) };
  });
}
