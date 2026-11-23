// api/winter-route-data.js
//
// Ticket #503 — the first weather/road-closure binding for a new (ticket
// #501/#502) geometry-based Frá/Til pair: Búðardalur<->Hólmavík um
// Þröskulda, both directions. GET only.
//
// A NEW, thin handler rather than two more allowlist rows in
// api/winter-route.js's own ROUTE_DEFS (P5a) -- the response CONTRACT
// genuinely differs (route identity is from/to/geometryId/regionVersion,
// not a fixed routeId string; each road section carries its own real
// routeLengthM share; the request itself is validated against ticket
// #501's own live geometry resolution, something ROUTE_DEFS has no
// concept of at all), not merely a smaller addition. The underlying
// per-segment/notice classification logic is reused byte-for-byte via
// api/_lib/winterRoute/roadSegmentPresentation.js (extracted FROM
// winter-route.js this round, not duplicated) and the real geometry
// resolution is reused via api/_lib/winterRoute/budardalurHolmavikRoute.js
// (which itself calls the same composeGeometryPath/combined-region-
// dataset core api/winter-route-geometry.js's own B<->H branch uses --
// neither that file nor server_data/*.json is modified here).
//
// Cache sharing (P5c): both directions key the SAME fixed bucket pair
// (cache.js's own routeId parameter, here always the fixed string below
// regardless of which direction was requested) -- so a cold B->H request
// and a concurrent cold H->B request share one single-flight fetch for
// each of the two upstream buckets (segment+point feed together as one
// "road" bucket, forecast as the other), never doubling calls per
// direction.

import { getRoadData, getForecastData } from "./_lib/winterRoute/cache.js";
import { fetchRoadSegments, fetchRoadPoints } from "./_lib/winterRoute/roadFetch.js";
import { fetchWinterRouteForecast } from "./_lib/winterRoute/forecastFetch.js";
import {
  classifySegment,
  isEligibleForPositiveStyle,
} from "./_lib/winterRoute/roadConditionCodes.js";
import { exportFreshness, segmentRegistrationFreshness, pointNoticeStatus } from "./_lib/winterRoute/freshness.js";
import { computePointsFeedUnavailableOrStale, buildNoticePayload, classifySegmentAmbiguous } from "./_lib/winterRoute/roadSegmentPresentation.js";
import {
  BUDARDALUR_HOLMAVIK_FORECAST_POINTS,
  resolveBudardalurHolmavikGeometry,
  orderedForecastPoints,
} from "./_lib/winterRoute/budardalurHolmavikRoute.js";

const UPSTREAM_FETCH_OPTIONS = { timeoutMs: 15000, maxBytes: 2 * 1024 * 1024 };

// Fixed, direction-independent cache key (P5c) -- never built from
// client-supplied from/to, so it can never be redirected into an
// unrelated bucket.
const CACHE_ROUTE_KEY = "winter-route-data:budardalur-holmavik";

async function fetchCombinedRoadData(idButurList) {
  const [segments, points] = await Promise.all([
    fetchRoadSegments(idButurList, UPSTREAM_FETCH_OPTIONS),
    fetchRoadPoints(idButurList, UPSTREAM_FETCH_OPTIONS),
  ]);
  if (!segments.ok && !points.ok) return { ok: false, reason: "both_road_feeds_failed" };
  return { ok: true, segments, points };
}

function buildRoadSectionPayload(idButurSection, roadData, now, pointsFeedUnavailableOrStale) {
  const segmentsResult = roadData?.segments;
  const pointsResult = roadData?.points;

  const row = segmentsResult?.ok ? segmentsResult.rows.find((r) => r.idButur === idButurSection.idButur) : null;
  const rawNotices = pointsResult?.ok ? pointsResult.points.filter((p) => p.idButur === idButurSection.idButur) : [];
  const notices = rawNotices.map((n) => ({ ...n, status: pointNoticeStatus(n.gildirTil, now) }));

  const exp = exportFreshness(segmentsResult?.feedDagsKeyrtUt ?? null, now);

  const base = {
    idButur: idButurSection.idButur,
    nameIs: idButurSection.nameIs,
    nameEn: idButurSection.nameEn,
    routeLengthM: idButurSection.routeLengthM,
    routeLengthFraction: idButurSection.routeLengthFraction,
    isEdgeSegment: idButurSection.isEdgeSegment,
  };

  if (!row || !row.found) {
    const category = classifySegment({ astandYfirbord: null, astandVidbotaruppl: null }, notices);
    return {
      ...base,
      segmentDataAvailable: false,
      category,
      positiveStyleEligible: false,
      notices: notices.map(buildNoticePayload),
      export: { dagsKeyrtUt: segmentsResult?.feedDagsKeyrtUt ?? null, ageMinutes: exp.ageMinutes, isStale: exp.isStale },
    };
  }

  const reg = segmentRegistrationFreshness(row.dagsSkrad, now);
  const category = row.ambiguous
    ? classifySegmentAmbiguous(row, notices)
    : classifySegment({ astandYfirbord: row.astandYfirbord, astandVidbotaruppl: row.astandVidbotaruppl }, notices);
  const positiveStyleEligible = isEligibleForPositiveStyle(category, {
    exportIsStale: exp.isStale,
    segmentRegistrationIsOld: reg.isOld,
    pointsFeedUnavailableOrStale,
  });

  return {
    ...base,
    segmentDataAvailable: true,
    ambiguous: !!row.ambiguous,
    category,
    positiveStyleEligible,
    astandYfirbord: row.astandYfirbord,
    astandVidbotaruppl: row.astandVidbotaruppl,
    astandLysing: row.astandLysing,
    astandLysingEn: row.astandLysingEn,
    export: { dagsKeyrtUt: row.dagsKeyrtUt, ageMinutes: exp.ageMinutes, isStale: exp.isStale },
    registration: { dagsSkrad: row.dagsSkrad, ageHours: reg.ageHours, isOld: reg.isOld },
    notices: notices.map(buildNoticePayload),
  };
}

// `forecastResult.points` is indexed to the FIXED canonical (B->H) fetch
// order (so both directions share one cache bucket); this maps it to the
// requested direction's own DISPLAY order without a second fetch.
function buildForecastPayload(forecastResult, from) {
  if (!forecastResult.ok) {
    return { available: false, reason: forecastResult.reason, points: [] };
  }

  const displayPoints = orderedForecastPoints(from);
  const canonicalIndexById = new Map(BUDARDALUR_HOLMAVIK_FORECAST_POINTS.map((p, i) => [p.id, i]));

  const points = displayPoints.map((def) => {
    const i = canonicalIndexById.get(def.id);
    const validated = forecastResult.points[i];
    if (!validated || !validated.ok) {
      return {
        id: def.id, labelIs: def.labelIs, labelEn: def.labelEn,
        available: false, reason: validated?.reason ?? "missing_point",
      };
    }
    return {
      id: def.id, labelIs: def.labelIs, labelEn: def.labelEn,
      available: true,
      requestedLat: def.lat, requestedLon: def.lon,
      returnedLatitude: validated.latitude, returnedLongitude: validated.longitude,
      elevation: validated.elevation,
      routeZ: def.nativeZ,
      hours: validated.hours,
      series: validated.series,
    };
  });

  return {
    available: true,
    window: forecastResult.window,
    points,
    stale: !!forecastResult.stale,
    cacheAgeMs: forecastResult.cacheAgeMs ?? 0,
  };
}

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

    const query = req.query && typeof req.query === "object" ? req.query : {};
    const from = typeof query.from === "string" ? query.from : null;
    const to = typeof query.to === "string" ? query.to : null;
    const clientGeometryId = typeof query.geometryId === "string" ? query.geometryId : null;

    if (!from || !to) {
      return res.status(400).json({ error: "missing_param", field: !from ? "from" : "to" });
    }
    if (!clientGeometryId) {
      return res.status(400).json({ error: "missing_param", field: "geometryId" });
    }

    const geo = resolveBudardalurHolmavikGeometry(from, to);
    if (!geo.ok) {
      return res.status(400).json({ error: "unsupported", reason: geo.reason });
    }

    // P5(d) — never trust a client-supplied geometryId blindly: it must
    // match what this handler independently (re-)computes from the real
    // geometry core, every request.
    if (geo.geometryId !== clientGeometryId) {
      return res.status(400).json({ error: "geometry_mismatch" });
    }

    const now = new Date();

    const [roadData, forecastResult] = await Promise.all([
      getRoadData(() => fetchCombinedRoadData(geo.idButurList), { routeId: CACHE_ROUTE_KEY }),
      getForecastData(
        () => fetchWinterRouteForecast({ now, fetchOptions: UPSTREAM_FETCH_OPTIONS, forecastPoints: BUDARDALUR_HOLMAVIK_FORECAST_POINTS }),
        { routeId: CACHE_ROUTE_KEY }
      ),
    ]);

    const pointsFeedUnavailableOrStale = computePointsFeedUnavailableOrStale(roadData.ok ? roadData.points : null, now);

    const roadSections = geo.idButurSections.map((section) =>
      buildRoadSectionPayload(section, roadData.ok ? roadData : null, now, pointsFeedUnavailableOrStale)
    );

    return res.status(200).json({
      from,
      to,
      geometryId: geo.geometryId,
      regionVersion: geo.regionVersion,
      routeLengthM: geo.lengthM,
      generatedAt: now.toISOString(),
      roadSections,
      roadMeta: {
        available: !!roadData.ok,
        stale: !!roadData.stale,
        cacheAgeMs: roadData.cacheAgeMs ?? 0,
        segmentsAvailable: !!roadData?.segments?.ok,
        pointsAvailable: !!roadData?.points?.ok,
        pointsFeedUnavailableOrStale,
      },
      forecast: buildForecastPayload(forecastResult, from),
    });
  } catch {
    // Never the raw error/message/stack — same discipline as
    // api/winter-route.js's own catch-all.
    console.error("winter-route-data: handler error");
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "winter_route_error" });
  }
}
