// api/_lib/winterRoute/roadSegmentPresentation.js
//
// Ticket #503, P5(a) — extracted verbatim (not rewritten) from
// api/winter-route.js's own previously-local helpers, so the new
// api/winter-route-data.js (Búðardalur<->Hólmavík) can reuse the exact
// same segment/notice classification logic as the existing Vík/Borgarnes
// flow without a second, drifting copy. winter-route.js now imports these
// three functions instead of defining its own — its own existing tests
// confirm byte-identical output after this move (a relocation, not a
// logic change).

import { categorizePointAstand, categorizePointAstandWithStatus, worstCategory, SEGMENT_CATEGORY } from "./roadConditionCodes.js";
import { exportFreshness } from "./freshness.js";

// Round 2 correction (R1a): closures/roadworks are reported via the point
// feed — if it is down, missing a usable export time, or stale, we cannot
// actually confirm a segment has no closure, so NO segment anywhere may
// render with positive/"good" styling while this is true, regardless of
// what the segment feed itself says. Computed once per request/cache-read,
// not per segment.
export function computePointsFeedUnavailableOrStale(pointsResult, now) {
  if (!pointsResult?.ok) return true;
  return exportFreshness(pointsResult.feedDagsKeyrtUt ?? null, now).isStale;
}

export function buildNoticePayload(notice) {
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

// R2: an ambiguous duplicate's final category is the forced closure (if
// any duplicate confirmed one) escalated further by point notices (N2:
// still respecting expired-only closure notices), or UNKNOWN_UNCLASSIFIED
// (also escalatable by point notices) otherwise.
export function classifySegmentAmbiguous(row, notices) {
  const base = row.forcedCategory ?? SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
  const noticeCategories = notices.map((n) => categorizePointAstandWithStatus(n.astand, n.status));
  return worstCategory([base, ...noticeCategories]);
}
