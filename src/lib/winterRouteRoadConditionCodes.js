// src/lib/winterRouteRoadConditionCodes.js
//
// Ticket #492, direct-flow, P6 -- a small, separately-maintained frontend
// copy of ONLY the two segment-level surface code tables from
// api/_lib/winterRoute/roadConditionCodes.js (astandYfirbord/
// astandVidbotaruppl) -- NOT the point/notice table, which the frontend
// never needs: every notice already carries its own precomputed
// `category` from the backend (buildNoticePayload in
// api/_lib/winterRoute/roadSegmentPresentation.js). Cross-checked against
// the real backend module by winterRouteRoadConditionCodes.test.js (a
// repo-read parity test, not hand-copied and left to drift -- P6(c)).
//
// Root-cause context for why this module exists: the backend's own
// composite `segment.category` is the WORST of (surface codes, point
// notices). That means a single unclassified point notice on an otherwise
// perfectly well-known road surface drives the WHOLE segment to
// "unknown_unclassified", which then renders as if the road SURFACE
// itself were unknown ("Óþekkt ástand" shown right next to a concrete
// surface description like "Hálkublettir" -- the literal mislabeling bug
// this fixes). This module lets the frontend recompute the SURFACE-ONLY
// category (astandYfirbord + astandVidbotaruppl, deliberately excluding
// point notices) so the pill can show it instead -- but only in the one
// case where that's actually what happened; see
// winterRouteSurfaceDisplayCategory below for the three-way split.

export const WINTER_ROUTE_SEGMENT_CATEGORY = {
  CLOSED: "closed",
  IMPASSABLE: "impassable",
  OUT_OF_SERVICE: "out_of_service",
  HAZARD_NOTICE: "hazard_notice",
  UNKNOWN_UNCLASSIFIED: "unknown_unclassified",
  PASSABLE: "passable",
};

export const ASTAND_YFIRBORD_CATEGORY = {
  GREIDFAERT: WINTER_ROUTE_SEGMENT_CATEGORY.PASSABLE,
  HALKA: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  HALKUBLETTIR: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  KRAP: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  SNJOTHEKJA: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  THAEFINGUR: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  THUNGFAERT: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  FAERT_FJALLABILUM: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  FLUGHALT: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  EKKI_I_THJONUSTU: WINTER_ROUTE_SEGMENT_CATEGORY.OUT_OF_SERVICE,
  OFAERT_ANNAD: WINTER_ROUTE_SEGMENT_CATEGORY.IMPASSABLE,
  OFAERT_VEDUR: WINTER_ROUTE_SEGMENT_CATEGORY.IMPASSABLE,
  LOKAD: WINTER_ROUTE_SEGMENT_CATEGORY.CLOSED,
  OTHEKKT: WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED,
};

export const ASTAND_VIDBOTARUPPL_CATEGORY = {
  ALLUR_AKSTUR_BANN: WINTER_ROUTE_SEGMENT_CATEGORY.CLOSED,
  OTHEKKT: WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED,
  ELJAGANGUR: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  FAERT_FJALLABILUM: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  MOKSTUR: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  OSLETTUR_VEGUR: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  OVEDUR: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  SANDBYLUR: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  SKAFRENNINGUR: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  SNJOKOMA: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  STEINKAST: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  STORHRID: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
  THOKA: WINTER_ROUTE_SEGMENT_CATEGORY.HAZARD_NOTICE,
};

export function categorizeAstandYfirbord(code) {
  if (typeof code !== "string" || !code) return WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
  return ASTAND_YFIRBORD_CATEGORY[code] ?? WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
}

// Mirrors the backend's own null-vs-unknown distinction exactly: a
// genuinely absent field is not itself an unknown code.
export function categorizeAstandVidbotaruppl(code) {
  if (code == null || code === "") return null;
  if (typeof code !== "string") return WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
  return ASTAND_VIDBOTARUPPL_CATEGORY[code] ?? WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED;
}

// P6(a)/(b)/(d), refined by direct-flow round 2, R4(2)/V4(2) -- the
// category to actually DISPLAY on a segment's pill. `segment.category`
// (the backend's own composite, worst-of-everything category) being
// "unknown_unclassified" has three independent possible causes; two of
// them must NOT be swapped, because they are genuinely unknown and
// swapping would misrepresent them as known:
//   - ambiguous:true (conflicting duplicate IDBUTUR rows -- P6(a), path B)
//   - the surface's own AstandYfirbord code is itself unclassified
//     (path C, including the "no segment data at all" case)
// The swap condition is deliberately narrow and based ONLY on
// AstandYfirbord -- never on AstandVidbotaruppl or on point notices:
// "pilla færist í yfirborðsflokk aðeins þegar ambiguous er ósatt og
// astandYfirbord þekkt" (Ripley, R4/V4(2)). This covers BOTH path A (an
// unrelated unclassified point notice pulled the composite to unknown)
// and path D (a known surface with its own unclassified
// AstandVidbotaruppl, round-2 correction -- round 1 wrongly left this
// case unswapped by folding AstandVidbotaruppl into the swap decision
// itself; see winterRouteUnknownAdditionCode below for how that
// unclassified addition is still surfaced, separately, never hidden).
// Every other composite category (closed/hazard/etc, however reached)
// is returned completely unchanged -- this never downgrades, hides, or
// invents a closure or hazard (P6(d)/V4(1)): a real closure's own
// category is never "unknown_unclassified" to begin with, so this
// function is never even called for it.
export function winterRouteSurfaceDisplayCategory(segment) {
  if (!segment || segment.category !== WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED) {
    return segment?.category;
  }
  if (segment.ambiguous) return segment.category;
  const yfirbord = categorizeAstandYfirbord(segment.astandYfirbord);
  if (yfirbord === WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED) return segment.category;
  return yfirbord;
}

// V4(2) -- the segment's own AstandVidbotaruppl code, but ONLY when it
// is present and itself unclassified (never for a missing/blank field,
// and never for an ambiguous segment -- there is no single real
// AstandVidbotaruppl value to name for a duplicate/contradictory row).
// Used to render "Óþekktar viðbótarupplýsingar: {code}" visibly by
// default, as plain text, alongside (never instead of) a real known
// surface category -- the information is surfaced, not swallowed by a
// generic "unknown" pill.
export function winterRouteUnknownAdditionCode(segment) {
  if (!segment || segment.ambiguous) return null;
  const code = segment.astandVidbotaruppl;
  if (typeof code !== "string" || code === "") return null;
  return categorizeAstandVidbotaruppl(code) === WINTER_ROUTE_SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED ? code : null;
}
