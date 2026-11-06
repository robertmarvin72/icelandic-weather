// src/lib/winterRouteSummary.js
//
// Winter Route Advisor — route-level summary (follow-up to #486/#489;
// ticket #493 moved this from a per-point ETA-resolved hour to one shared
// selected forecast hour, see computeWeatherExtremaSummary below).
// Two independent, pure, client-side-only computations:
//
// 1. computeWeatherExtremaSummary() — the max gust / max precipitation /
//    min temperature AMONG THE FORECAST POINTS, each read at the SAME
//    shared `effectiveHour` (an exact `point.hours.indexOf(effectiveHour)`
//    lookup per point — no distance/ETA model, no per-point time). This is
//    explicitly NOT a continuous-route or daily extreme — only across these
//    points, at the one shared selected hour.
//
// 2. computeActiveNoticeSegmentCount() — the count of unique road segments
//    carrying at least one CURRENTLY ACTIVE point notice (closures/
//    roadworks), independent of the selected hour entirely — a point
//    notice's `status` is computed server-side from `now`. Deliberately NOT
//    a count of general surface condition categories (GREIDFAERT/HALKA/etc.
//    are not "notices") and NOT a notice count (two notices on one segment
//    count once).

const METRICS = [
  { key: "maxGust", seriesKey: "wind_gusts_10m", better: (candidate, best) => candidate > best },
  { key: "maxPrecip", seriesKey: "precipitation", better: (candidate, best) => candidate > best },
  { key: "minTemp", seriesKey: "temperature_2m", better: (candidate, best) => candidate < best },
];

function isUsableNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * `points` is `data.forecast.points` (already in fixed route order) or
 * `[]`/undefined when the forecast itself is unavailable. `effectiveHour`
 * is the page's current valid selected hour (a "YYYY-MM-DDTHH:00" UTC
 * string) or `null` when nothing valid is selected (empty window, an
 * expired/out-of-window selection not yet reconciled, or the first render
 * after a route switch whose new window doesn't contain the old
 * selection — ticket #493's `effectiveHour`, computed at render time by the
 * caller, never derived here). `null` makes every point resolve to no
 * value, producing the same honest "missing" result the cards show — no
 * special-casing needed.
 *
 * Each point is read via an EXACT `point.hours.indexOf(effectiveHour)`
 * lookup — never a nearest-match/fallback lookup, and never a per-point
 * time (no distance, no ETA). A point missing the hour entirely (shouldn't
 * happen per the backend's own contract, which guarantees identical `hours`
 * across every available point of one route, but not assumed here) simply
 * contributes nothing, same as `isMissing`/`isPartial` already express.
 *
 * Returns one entry per metric key:
 * `{ value, point, hourString, validCount, isPartial, isMissing }`.
 * `point`/`hourString` are `null` when `isMissing` is true. A tie keeps
 * the FIRST point in fixed route order (strict-better comparison only,
 * ties never overwrite the existing winner).
 */
export function computeWeatherExtremaSummary(points, effectiveHour) {
  const safePoints = Array.isArray(points) ? points : [];

  const result = {};
  for (const metric of METRICS) {
    let best = null; // { value, point, hourString }
    let validCount = 0;

    for (const point of safePoints) {
      if (!point?.available || effectiveHour == null) continue;
      const hourIndex = point.hours?.indexOf(effectiveHour) ?? -1;
      if (hourIndex < 0) continue;

      const rawValue = point.series?.[metric.seriesKey]?.[hourIndex];
      if (!isUsableNumber(rawValue)) continue; // null/undefined/NaN is a real gap, never 0

      validCount += 1;
      if (best === null || metric.better(rawValue, best.value)) {
        best = { value: rawValue, point, hourString: effectiveHour };
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
