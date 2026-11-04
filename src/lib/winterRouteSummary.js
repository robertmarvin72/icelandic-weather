// src/lib/winterRouteSummary.js
//
// Winter Route Advisor — route-level summary (follow-up to #486/#489).
// Two independent, pure, client-side-only computations:
//
// 1. computeWeatherExtremaSummary() — the max gust / max precipitation /
//    min temperature AMONG THE SIX FORECAST POINTS, each read at that
//    point's own already-resolved ETA forecast hour (resolvePointAtDeparture
//    — the exact same time ForecastCard shows, never a second ETA model).
//    This is explicitly NOT a continuous-route or daily extreme — only
//    across these six points, at their own individually-resolved times.
//
// 2. computeActiveNoticeSegmentCount() — the count of unique road segments
//    carrying at least one CURRENTLY ACTIVE point notice (closures/
//    roadworks), independent of departure time entirely — a point notice's
//    `status` is computed server-side from `now`, not from the selected
//    ETA. Deliberately NOT a count of general surface condition categories
//    (GREIDFAERT/HALKA/etc. are not "notices") and NOT a notice count (two
//    notices on one segment count once).

import { resolvePointAtDeparture } from "./winterRouteEta";

const METRICS = [
  { key: "maxGust", seriesKey: "wind_gusts_10m", better: (candidate, best) => candidate > best },
  { key: "maxPrecip", seriesKey: "precipitation", better: (candidate, best) => candidate > best },
  { key: "minTemp", seriesKey: "temperature_2m", better: (candidate, best) => candidate < best },
];

function isUsableNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * `points` is `data.forecast.points` (already in fixed P1..P6 route
 * order) or `[]`/undefined when the forecast itself is unavailable.
 * `departureHourString` is the page's selected departure hour (may be
 * `null` before the first auto-selection settles — every point then
 * resolves to `hasHour: false`, which this function already treats as "no
 * valid value for that point", producing the same honest "missing" result
 * the cards show before a departure is chosen — no special-casing needed).
 *
 * Returns one entry per metric key:
 * `{ value, point, hourString, validCount, isPartial, isMissing }`.
 * `point`/`hourString` are `null` when `isMissing` is true. A tie keeps
 * the FIRST point in fixed route order (strict-better comparison only,
 * ties never overwrite the existing winner).
 */
export function computeWeatherExtremaSummary(points, departureHourString) {
  const safePoints = Array.isArray(points) ? points : [];

  const result = {};
  for (const metric of METRICS) {
    let best = null; // { value, point, hourString }
    let validCount = 0;

    for (const point of safePoints) {
      const { hourIndex, hasHour, forecastHour } = resolvePointAtDeparture(point, departureHourString);
      if (!hasHour) continue;

      const rawValue = point.series?.[metric.seriesKey]?.[hourIndex];
      if (!isUsableNumber(rawValue)) continue; // null/undefined/NaN is a real gap, never 0

      validCount += 1;
      if (best === null || metric.better(rawValue, best.value)) {
        best = { value: rawValue, point, hourString: forecastHour };
      }
    }

    result[metric.key] = {
      value: best ? best.value : null,
      point: best ? best.point : null,
      hourString: best ? best.hourString : null,
      validCount,
      isMissing: validCount === 0,
      isPartial: validCount > 0 && validCount < safePoints.length,
    };
  }

  return result;
}

/**
 * `segments` is `data.segments` (13 fixed road sections, each carrying its
 * own `notices[]` regardless of whether `segmentDataAvailable` is true —
 * #486 confirmed point notices still attach to a segment even when the
 * segment feed itself has no row for it). `roadMeta` is `data.roadMeta`.
 *
 * The count is only reported when the point feed is both available and
 * fresh — if `roadMeta.pointsFeedUnavailableOrStale`, `!roadMeta
 * .pointsAvailable`, or `roadMeta.stale` is true, the count cannot be
 * trusted (closures/roadworks come from the point feed), so this returns
 * `{ count: null, confirmed: false }` — an explicit "unconfirmed", never a
 * silently-wrong "0 notices".
 */
export function computeActiveNoticeSegmentCount(segments, roadMeta) {
  const confirmed = !!roadMeta?.pointsAvailable && !roadMeta?.pointsFeedUnavailableOrStale && !roadMeta?.stale;
  if (!confirmed) {
    return { count: null, confirmed: false };
  }

  const safeSegments = Array.isArray(segments) ? segments : [];
  const count = safeSegments.filter((s) => (s.notices ?? []).some((n) => n.status === "active")).length;
  return { count, confirmed: true };
}
