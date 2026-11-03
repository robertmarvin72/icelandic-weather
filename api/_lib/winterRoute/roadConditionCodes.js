// api/_lib/winterRoute/roadConditionCodes.js
//
// Ticket #486, S1 — fixed code -> category table for Vegagerðin's road-
// condition feeds, sourced from the owner-provided data-dictionary text
// (docs/ai/tasks/ticket-483/owner-overview-source-2026-10-28/
// faerd-gagnasnid-owner-text.txt) and cross-checked against the live
// retained samples (docs/ai/tasks/ticket-485/samples/legacy-faerd-https.json,
// legacy-faerdpunktar-https.json). A closure can come from three different
// fields (segment AstandYfirbord, segment AstandVidbotaruppl, or a
// point-feed Astand sharing the segment's IDBUTUR) — this module is the
// single place that reconciles all three into one category, never left to
// free-text inference.
//
// Any code not in these fixed tables (the retained point sample itself
// contains two real undocumented examples, TONN_ALLS and HOLUR_I_VEGI) maps
// to UNKNOWN_UNCLASSIFIED — never PASSABLE/"good".

export const SEGMENT_CATEGORY = {
  CLOSED: "closed",
  IMPASSABLE: "impassable",
  OUT_OF_SERVICE: "out_of_service",
  HAZARD_NOTICE: "hazard_notice",
  UNKNOWN_UNCLASSIFIED: "unknown_unclassified",
  PASSABLE: "passable",
};

// Ascending severity — last entry wins when combining multiple codes.
const SEVERITY_RANK = [
  SEGMENT_CATEGORY.PASSABLE,
  SEGMENT_CATEGORY.HAZARD_NOTICE,
  SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED,
  SEGMENT_CATEGORY.OUT_OF_SERVICE,
  SEGMENT_CATEGORY.IMPASSABLE,
  SEGMENT_CATEGORY.CLOSED,
];

function rankOf(category) {
  const i = SEVERITY_RANK.indexOf(category);
  return i === -1 ? SEVERITY_RANK.indexOf(SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED) : i;
}

// AstandYfirbord — always present on every segment row (documented "never
// NULL"). 14 documented values.
const ASTAND_YFIRBORD_CATEGORY = {
  GREIDFAERT: SEGMENT_CATEGORY.PASSABLE,
  HALKA: SEGMENT_CATEGORY.HAZARD_NOTICE,
  HALKUBLETTIR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  KRAP: SEGMENT_CATEGORY.HAZARD_NOTICE,
  SNJOTHEKJA: SEGMENT_CATEGORY.HAZARD_NOTICE,
  THAEFINGUR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  THUNGFAERT: SEGMENT_CATEGORY.HAZARD_NOTICE,
  FAERT_FJALLABILUM: SEGMENT_CATEGORY.HAZARD_NOTICE,
  FLUGHALT: SEGMENT_CATEGORY.HAZARD_NOTICE,
  EKKI_I_THJONUSTU: SEGMENT_CATEGORY.OUT_OF_SERVICE,
  OFAERT_ANNAD: SEGMENT_CATEGORY.IMPASSABLE,
  OFAERT_VEDUR: SEGMENT_CATEGORY.IMPASSABLE,
  LOKAD: SEGMENT_CATEGORY.CLOSED,
  OTHEKKT: SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED,
};

// AstandVidbotaruppl — optional ("J" nullable). 13 documented values. An
// absent/blank value is not itself an unknown code (S1) — handled by the
// caller returning null below, never looked up as "".
const ASTAND_VIDBOTARUPPL_CATEGORY = {
  ALLUR_AKSTUR_BANN: SEGMENT_CATEGORY.CLOSED,
  OTHEKKT: SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED,
  ELJAGANGUR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  FAERT_FJALLABILUM: SEGMENT_CATEGORY.HAZARD_NOTICE,
  MOKSTUR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  OSLETTUR_VEGUR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  OVEDUR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  SANDBYLUR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  SKAFRENNINGUR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  SNJOKOMA: SEGMENT_CATEGORY.HAZARD_NOTICE,
  STEINKAST: SEGMENT_CATEGORY.HAZARD_NOTICE,
  STORHRID: SEGMENT_CATEGORY.HAZARD_NOTICE,
  THOKA: SEGMENT_CATEGORY.HAZARD_NOTICE,
};

// Point-feed Astand — 6 documented values. Always present (documented
// "never NULL" on the point feed).
const POINT_ASTAND_CATEGORY = {
  ALLUR_AKSTUR_BANN: SEGMENT_CATEGORY.CLOSED,
  VEGAVINNA: SEGMENT_CATEGORY.HAZARD_NOTICE,
  VATNASKEMMDIR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  STEINKAST: SEGMENT_CATEGORY.HAZARD_NOTICE,
  OSLETTUR_VEGUR: SEGMENT_CATEGORY.HAZARD_NOTICE,
  ANNAD: SEGMENT_CATEGORY.HAZARD_NOTICE,
};

export function categorizeAstandYfirbord(code) {
  if (typeof code !== "string" || !code) return SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
  return ASTAND_YFIRBORD_CATEGORY[code] ?? SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
}

// Returns null for "field genuinely absent" (not itself an unknown code),
// and UNKNOWN_UNCLASSIFIED only for a real, non-blank, undocumented value.
export function categorizeAstandVidbotaruppl(code) {
  if (code == null || code === "") return null;
  if (typeof code !== "string") return SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
  return ASTAND_VIDBOTARUPPL_CATEGORY[code] ?? SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
}

export function categorizePointAstand(code) {
  if (typeof code !== "string" || !code) return SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
  return POINT_ASTAND_CATEGORY[code] ?? SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
}

// Round 2 correction (N2): an EXPIRED point closure (ALLUR_AKSTUR_BANN past
// its own GildirTil) must not drive the segment's current-state category to
// CLOSED on its own — that reads as a live "Lokað" when the only evidence
// is a notice that has itself expired. It still counts as a real hazard
// (never positive/good), just not the literal closed label, unless some
// OTHER source (segment fields, or another active/unknown-validity notice)
// independently confirms a current closure. `status` is one of
// freshness.js's pointNoticeStatus() values ("active"/"expired"/"unknown");
// "unknown" validity is deliberately treated like "active" here — an
// unconfirmed validity period is never grounds to downgrade a closure.
export function categorizePointAstandWithStatus(code, status) {
  const base = categorizePointAstand(code);
  if (base === SEGMENT_CATEGORY.CLOSED && status === "expired") {
    return SEGMENT_CATEGORY.HAZARD_NOTICE;
  }
  return base;
}

// Worst-wins combination across however many category inputs are given
// (null entries — e.g. an absent AstandVidbotaruppl — are ignored, not
// treated as PASSABLE votes).
export function worstCategory(categories) {
  let best = SEGMENT_CATEGORY.PASSABLE;
  let bestRank = 0;
  for (const c of categories) {
    if (c == null) continue;
    const r = rankOf(c);
    if (r > bestRank) {
      bestRank = r;
      best = c;
    }
  }
  return best;
}

/**
 * Combines a segment's own two condition fields with every point notice
 * sharing its IDBUTUR into one final category. `pointNotices` is an array
 * of `{ astand, status }` — `status` is freshness.js's pointNoticeStatus()
 * result for that notice (see categorizePointAstandWithStatus above). A
 * segment with no matched row at all should call this with
 * `{ astandYfirbord: null, astandVidbotaruppl: null }` — both resolve to
 * UNKNOWN_UNCLASSIFIED, which notices can still escalate (R1c: a missing
 * segment entry with a real active closure notice must still read CLOSED,
 * never silently stuck at "unknown").
 */
export function classifySegment({ astandYfirbord, astandVidbotaruppl }, pointNotices = []) {
  return worstCategory([
    categorizeAstandYfirbord(astandYfirbord),
    categorizeAstandVidbotaruppl(astandVidbotaruppl),
    ...pointNotices.map((n) => categorizePointAstandWithStatus(n.astand, n.status)),
  ]);
}

// Only a PASSABLE category with a fresh export, fresh per-segment
// registration, AND a point feed that is itself available and fresh may
// render with positive/"good" styling (S1/S3 — a stale GREIDFAERT must not
// look like a confirmed-good current state; R1a: closures/roadworks come
// from the point feed, so an unavailable/stale point feed means we cannot
// actually confirm there is no closure, regardless of what the segment
// feed itself says).
export function isEligibleForPositiveStyle(
  category,
  { exportIsStale, segmentRegistrationIsOld, pointsFeedUnavailableOrStale = false }
) {
  if (category !== SEGMENT_CATEGORY.PASSABLE) return false;
  if (exportIsStale) return false;
  if (segmentRegistrationIsOld) return false;
  if (pointsFeedUnavailableOrStale) return false;
  return true;
}
