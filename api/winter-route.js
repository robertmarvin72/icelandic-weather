// api/winter-route.js
//
// Ticket #486 — Rauðavatn–Vík winter road + forecast data endpoint. GET
// only, no query parameters are read (all are ignored, per S3a) — the
// route always returns the same fixed 13 segments and 6 forecast points.
//
// Three independent upstream calls: the Vegagerðin segment feed, the
// Vegagerðin point feed, and one six-point Open-Meteo forecast call. Each
// can fail on its own without hiding the other's valid data (approved
// prompt: "sjálfstæð niðurstaða hvers gagnahluta"). The forecast call is
// skipped ENTIRELY (zero fetch) whenever OPEN_METEO_API_KEY is missing/
// blank, in every environment — see forecastFetch.js's own doc-comment for
// why this route's key policy is deliberately narrower than the shared
// api/_lib/openMeteoAuth.js helper used elsewhere.
//
// Caching is a per-warm-invocation module-memory cache only (see cache.js).
// A cold start begins with nothing cached: the very first request after a
// cold start always performs fresh upstream fetches (subject to the normal
// 15s/2MiB bounds) — there is no cross-instance or cross-region sharing,
// and no guarantee a given instance stays warm. This is explicitly not a
// distributed cache or a quota-smoothing mechanism.

import { getRoadData, getForecastData } from "./_lib/winterRoute/cache.js";
import { fetchRoadSegments, fetchRoadPoints } from "./_lib/winterRoute/roadFetch.js";
import { fetchWinterRouteForecast } from "./_lib/winterRoute/forecastFetch.js";
import { WINTER_ROUTE_SEGMENTS, WINTER_ROUTE_FORECAST_POINTS } from "./_lib/winterRoute/segments.js";
import {
  classifySegment,
  categorizePointAstand,
  categorizePointAstandWithStatus,
  isEligibleForPositiveStyle,
  worstCategory,
  SEGMENT_CATEGORY,
} from "./_lib/winterRoute/roadConditionCodes.js";
import { exportFreshness, segmentRegistrationFreshness, pointNoticeStatus } from "./_lib/winterRoute/freshness.js";

const UPSTREAM_FETCH_OPTIONS = { timeoutMs: 15000, maxBytes: 2 * 1024 * 1024 };

async function fetchCombinedRoadData() {
  const [segments, points] = await Promise.all([
    fetchRoadSegments(UPSTREAM_FETCH_OPTIONS),
    fetchRoadPoints(UPSTREAM_FETCH_OPTIONS),
  ]);

  if (!segments.ok && !points.ok) {
    return { ok: false, reason: "both_road_feeds_failed" };
  }
  return { ok: true, segments, points };
}

// Round 2 correction (R1a): closures/roadworks are reported via the point
// feed — if it is down, missing a usable export time, or stale, we cannot
// actually confirm a segment has no closure, so NO segment anywhere may
// render with positive/"good" styling while this is true, regardless of
// what the segment feed itself says. Computed once per request/cache-read,
// not per segment.
function computePointsFeedUnavailableOrStale(pointsResult, now) {
  if (!pointsResult?.ok) return true;
  return exportFreshness(pointsResult.feedDagsKeyrtUt ?? null, now).isStale;
}

function buildSegmentPayload(def, roadData, now, pointsFeedUnavailableOrStale) {
  const segmentsResult = roadData?.segments;
  const pointsResult = roadData?.points;

  const row = segmentsResult?.ok ? segmentsResult.rows.find((r) => r.idButur === def.idButur) : null;
  const rawNotices = pointsResult?.ok ? pointsResult.points.filter((p) => p.idButur === def.idButur) : [];
  const notices = rawNotices.map((n) => ({ ...n, status: pointNoticeStatus(n.gildirTil, now) }));

  const exp = exportFreshness(segmentsResult?.feedDagsKeyrtUt ?? null, now);

  // R1c: a segment with no matched feed row still classifies from its
  // point notices (e.g. a real active closure on a segment the segment
  // feed happens not to report) — categorizeAstandYfirbord(null) resolves
  // to UNKNOWN_UNCLASSIFIED, which notices can still escalate past, via
  // the same classifySegment() call used for a found row.
  if (!row || !row.found) {
    const category = classifySegment({ astandYfirbord: null, astandVidbotaruppl: null }, notices);
    return {
      idButur: def.idButur,
      nameIs: def.nameIs,
      nameEn: def.nameEn,
      segmentDataAvailable: false,
      category,
      positiveStyleEligible: false,
      notices: notices.map(buildNoticePayload),
      export: { dagsKeyrtUt: segmentsResult?.feedDagsKeyrtUt ?? null, ageMinutes: exp.ageMinutes, isStale: exp.isStale },
    };
  }

  const reg = segmentRegistrationFreshness(row.dagsSkrad, now);

  // R2: an ambiguous/contradictory duplicate IDBUTUR entry never derives
  // its base category from the (unreliable) representative row's own
  // fields — only from the forced closure (if any duplicate confirmed one)
  // plus whatever the point notices add.
  const category = row.ambiguous
    ? classifySegmentAmbiguous(row, notices)
    : classifySegment({ astandYfirbord: row.astandYfirbord, astandVidbotaruppl: row.astandVidbotaruppl }, notices);

  const positiveStyleEligible = isEligibleForPositiveStyle(category, {
    exportIsStale: exp.isStale,
    segmentRegistrationIsOld: reg.isOld,
    pointsFeedUnavailableOrStale,
  });

  return {
    idButur: def.idButur,
    nameIs: def.nameIs,
    nameEn: def.nameEn,
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

// R2: an ambiguous duplicate's final category is the forced closure (if
// any duplicate confirmed one) escalated further by point notices (N2:
// still respecting expired-only closure notices), or UNKNOWN_UNCLASSIFIED
// (also escalatable by point notices) otherwise.
function classifySegmentAmbiguous(row, notices) {
  const base = row.forcedCategory ?? SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
  const noticeCategories = notices.map((n) => categorizePointAstandWithStatus(n.astand, n.status));
  return worstCategory([base, ...noticeCategories]);
}

function buildNoticePayload(notice) {
  return {
    idPunktur: notice.idPunktur,
    astand: notice.astand,
    category: categorizePointAstand(notice.astand),
    lysing: notice.lysing,
    lysingEn: notice.lysingEn,
    dagsSkrad: notice.dagsSkrad,
    gildirTil: notice.gildirTil,
    status: notice.status,
  };
}

function buildForecastPayload(forecastResult) {
  if (!forecastResult.ok) {
    return { available: false, reason: forecastResult.reason, points: [] };
  }

  const points = WINTER_ROUTE_FORECAST_POINTS.map((def, i) => {
    const validated = forecastResult.points[i];
    if (!validated || !validated.ok) {
      return {
        id: def.id,
        labelIs: def.labelIs,
        labelEn: def.labelEn,
        nearIdButur: def.nearIdButur,
        available: false,
        reason: validated?.reason ?? "missing_point",
      };
    }
    return {
      id: def.id,
      labelIs: def.labelIs,
      labelEn: def.labelEn,
      nearIdButur: def.nearIdButur,
      available: true,
      requestedLat: def.lat,
      requestedLon: def.lon,
      returnedLatitude: validated.latitude,
      returnedLongitude: validated.longitude,
      elevation: validated.elevation,
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

    const now = new Date();

    const [roadData, forecastResult] = await Promise.all([
      getRoadData(fetchCombinedRoadData),
      getForecastData(() => fetchWinterRouteForecast({ now, fetchOptions: UPSTREAM_FETCH_OPTIONS })),
    ]);

    const pointsFeedUnavailableOrStale = computePointsFeedUnavailableOrStale(roadData.ok ? roadData.points : null, now);

    const segments = WINTER_ROUTE_SEGMENTS.map((def) =>
      buildSegmentPayload(def, roadData.ok ? roadData : null, now, pointsFeedUnavailableOrStale)
    );

    return res.status(200).json({
      generatedAt: now.toISOString(),
      segments,
      roadMeta: {
        available: !!roadData.ok,
        stale: !!roadData.stale,
        cacheAgeMs: roadData.cacheAgeMs ?? 0,
        segmentsAvailable: !!roadData?.segments?.ok,
        pointsAvailable: !!roadData?.points?.ok,
        pointsFeedUnavailableOrStale,
      },
      forecast: buildForecastPayload(forecastResult),
    });
  } catch {
    // Never the raw error/message/stack — a fetch-path failure could embed
    // a keyed upstream URL in some runtimes (same discipline as
    // api/forecast.js's own catch-all).
    console.error("winter-route: handler error");
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "winter_route_error" });
  }
}
