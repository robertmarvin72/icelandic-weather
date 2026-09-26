// src/lib/auroraFreshnessFormat.js
//
// Shared "X hours ago" formatter for Aurora sourceFetchedAt staleness
// display, used by both NorthernLightsCard.jsx (single-night) and
// AuroraNightOutlook.jsx (Ticket #423 Phase 2 multi-night). Pure and
// injectable-clock-friendly: takes `nowMs` explicitly rather than reading
// Date.now() itself.

export function formatAuroraDataAge(iso, t, nowMs) {
  if (!iso) return null;
  const ms = nowMs - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const hours = Math.round(ms / 3600000);
  if (hours <= 0) return t("nlAgeLessThanHour");
  if (hours === 1) return t("nlAgeOneHour");
  return t("nlAgeHours").replace("{hours}", String(hours));
}
