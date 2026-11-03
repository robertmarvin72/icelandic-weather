// api/_lib/winterRoute/freshness.js
//
// Ticket #486, S5 — time semantics for the two road-condition feeds.
// `GildirTil` (valid-until) exists ONLY on the point feed (faerdpunktar
// 2017_1) — the segment feed (faerd2017_1) has no such field at all, so
// "missing valid-until" must never be rendered as "unknown" on all 13
// segments; it simply does not apply there. Export/registration staleness
// (DagsKeyrtUt / DagsSkrad) is a separate, conservative DISPLAY judgement —
// explicitly not an SLA or a meteorological threshold (approved prompt).

export const EXPORT_STALE_AFTER_MINUTES = 30;
export const SEGMENT_REGISTRATION_OLD_AFTER_HOURS = 24;

function parseIso(value) {
  if (typeof value !== "string" || !value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

// Returns { ageMinutes, isStale }. Missing/invalid timestamp is treated as
// unknown freshness -> isStale true (never assumed fresh).
export function exportFreshness(dagsKeyrtUt, now = new Date()) {
  const ms = parseIso(dagsKeyrtUt);
  if (ms == null) return { ageMinutes: null, isStale: true };
  const ageMinutes = (now.getTime() - ms) / 60000;
  return { ageMinutes, isStale: !(ageMinutes >= 0 && ageMinutes <= EXPORT_STALE_AFTER_MINUTES) };
}

// Per-segment DagsSkrad age — display-only "old" badge on the segment's own
// base condition. Missing/invalid timestamp -> unknown -> treated as old
// (never assumed recently registered).
export function segmentRegistrationFreshness(dagsSkrad, now = new Date()) {
  const ms = parseIso(dagsSkrad);
  if (ms == null) return { ageHours: null, isOld: true };
  const ageHours = (now.getTime() - ms) / 3600000;
  return { ageHours, isOld: !(ageHours >= 0 && ageHours <= SEGMENT_REGISTRATION_OLD_AFTER_HOURS) };
}

// Point-notice validity status, driven ONLY by GildirTil (never by the
// point's own DagsSkrad age — an old registration on a still-valid roadwork
// notice must not be mislabeled expired, S5c). Missing/invalid GildirTil is
// its own explicit "unknown" status, not folded into "active" or "expired".
export function pointNoticeStatus(gildirTil, now = new Date()) {
  const ms = parseIso(gildirTil);
  if (ms == null) return "unknown";
  return now.getTime() > ms ? "expired" : "active";
}
