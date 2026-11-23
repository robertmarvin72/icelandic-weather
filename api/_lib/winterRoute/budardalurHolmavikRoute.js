// api/_lib/winterRoute/budardalurHolmavikRoute.js
//
// Ticket #503 — the first B↔H (Búðardalur↔Hólmavík um Þröskulda) weather/
// road data binding. Small, fixed, reviewed constants (same convention as
// segments.js/routes.js: "Litlar fastar skilgreiningar í kóða eru
// heimilar") — the 4 forecast points' native EPSG:3057 coordinates and
// their offline-computed WGS84 are cross-checked against
// docs/ai/tasks/ticket-503/evidence/probe-and-registry.mjs's own real run
// (see that script's own output/cc-report.md for the independent
// anchor/geometry-membership verification) and api/_lib/winterRoute/
// budardalurHolmavikRoute.test.js's own live re-derivation. The 7 IdButur
// are NEVER hardcoded as a routeLengthM table here — the handler derives
// both the id list AND each one's own routeLengthM dynamically from the
// real composed geometry every request (P3a), exactly like
// api/winter-route-geometry.js's own existing Búðardalur<->Hólmavík
// branch, reusing the same underlying core/dataset, never duplicating its
// via/lengthNote/UI-facing logic.
//
// No forecast point exists in the first ~48 km after Búðardalur — point
// cards must never imply continuous coverage (P3c).

import { composeGeometryPath } from "./geometryComposition.js";
import { loadWestfjordsCombinedRegionDataset } from "./westfjordsCombinedRegionDataset.js";

export const BUDARDALUR_HOLMAVIK_PLACE_IDS = ["budardalur", "holmavik"];

// Fixed order: Búðardalur -> Hólmavík. A request for the reverse direction
// reverses this array for display; the underlying native/WGS84 values are
// never direction-dependent (P2d).
export const BUDARDALUR_HOLMAVIK_FORECAST_POINTS = [
  {
    id: "budardalur-route", labelIs: "Búðardalur", labelEn: "Búðardalur",
    lat: 65.10937097662715, lon: -21.761935218653928,
    sourceId: 2769, vertexIndex: 3, nativeX: 370289.3768328927, nativeY: 515027.06854594796, nativeZ: 24.473128257522806,
  },
  {
    id: "throskuldar-south-route", labelIs: "Þröskuldar — sunnanverð leið", labelEn: "Þröskuldar — south side",
    lat: 65.47846693000001, lon: -21.933629079999996,
    sourceId: 3321, vertexIndex: 0, nativeX: 364140.5366828249, nativeY: 556496.173523623, nativeZ: 42.058,
  },
  {
    id: "throskuldar-pass-route", labelIs: "Þröskuldar", labelEn: "Þröskuldar",
    lat: 65.5523516, lon: -21.83224971,
    sourceId: 3321, vertexIndex: 47, nativeX: 369201.2702005765, nativeY: 564511.5852567125, nativeZ: 368.9358,
  },
  {
    id: "holmavik-route", labelIs: "Hólmavík", labelEn: "Hólmavík",
    lat: 65.70146962, lon: -21.68414766,
    sourceId: 3883, vertexIndex: 3, nativeX: 376742.4201551166, nativeY: 580824.7020691019, nativeZ: 0,
  },
];

// P3b — a segment carrying less than 1% of the total composed route
// length is an "edge segment": a closure/notice on it must read as a
// short-section notice, never as the whole route's own status. Computed
// as a fraction (dynamic), not a hardcoded percentage, so it stays
// correct if the underlying geometry is ever revised.
export const EDGE_SEGMENT_FRACTION_THRESHOLD = 0.01;

// Fixed, reviewed EN translations of the real retained `name` field each
// line carries (same convention as segments.js's own fixed EN labels —
// "a small, fixed CC translation", not a live translation service).
// Extracted from the real B->H composition (docs/ai/tasks/ticket-503/
// evidence/probe-and-registry.mjs), one name per IdButur's own first
// slice occurrence.
const IDBUTUR_NAME_EN = {
  "Skógstagl-Búðardalur": "Skógstagl–Búðardalur",
  "Búðardalur-Laugar": "Búðardalur–Laugar",
  "Svínadalur": "Svínadalur",
  "Gilsfjörður": "Gilsfjörður",
  "Þröskuldar": "Þröskuldar",
  "Hrófá-Hólmavík": "Hrófá–Hólmavík",
  "Hólmavík-Drangsnesvegur": "Hólmavík–Drangsnesvegur",
};

// Resolves the real, composed geometry for an allowlisted B<->H pair by
// reusing the exact same production core/dataset
// api/winter-route-geometry.js's own combined-pair branch uses (never a
// second copy of its via/lengthNote/accessApproach logic, which this
// endpoint does not need). Returns { ok:false } for any pair outside the
// two allowlisted directions.
export function resolveBudardalurHolmavikGeometry(from, to) {
  const validPair =
    (from === "budardalur" && to === "holmavik") || (from === "holmavik" && to === "budardalur");
  if (!validPair) return { ok: false, reason: "unsupported_pair" };

  const region = loadWestfjordsCombinedRegionDataset();
  const allLines = [...region.lines, ...region.connectors];
  const linesById = new Map(allLines.map((l) => [l.sourceId, l]));
  const fromPoint = region.endpoints[from];
  const toPoint = region.endpoints[to];

  const result = composeGeometryPath({
    crs: region.crs,
    tier: region.tier,
    lines: allLines,
    from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
    to: { placeId: to, x: toPoint.x, y: toPoint.y },
  });

  if (result.status !== "geometry_only") {
    return { ok: false, reason: "geometry_unavailable" };
  }

  // P3a — IdButur in real travel order, n:1 (consecutive slices sharing
  // the same idbutur merge into one entry), each carrying the real summed
  // slice length (routeLengthM) and its own share of the total. The
  // display name is the real retained `name` field of that IdButur's own
  // FIRST slice (first-occurrence order) — never handwritten/CSV.
  const idButurOrder = [];
  const lengthByIdButur = new Map();
  const nameIsByIdButur = new Map();
  for (const slice of result.slices) {
    if (slice.idbutur == null) continue;
    if (idButurOrder[idButurOrder.length - 1] !== slice.idbutur) idButurOrder.push(slice.idbutur);
    lengthByIdButur.set(slice.idbutur, (lengthByIdButur.get(slice.idbutur) ?? 0) + slice.lengthM);
    if (!nameIsByIdButur.has(slice.idbutur)) nameIsByIdButur.set(slice.idbutur, linesById.get(slice.sourceId).name);
  }

  const idButurSections = idButurOrder.map((idButur) => {
    const routeLengthM = lengthByIdButur.get(idButur);
    const nameIs = nameIsByIdButur.get(idButur);
    return {
      idButur,
      nameIs,
      nameEn: IDBUTUR_NAME_EN[nameIs] ?? nameIs,
      routeLengthM,
      routeLengthFraction: routeLengthM / result.lengthM,
      isEdgeSegment: routeLengthM / result.lengthM < EDGE_SEGMENT_FRACTION_THRESHOLD,
    };
  });

  return {
    ok: true,
    geometryId: result.geometryId,
    regionVersion: region.regionVersion,
    lengthM: result.lengthM,
    idButurSections,
    idButurList: idButurOrder,
  };
}

// Display order for the 4 fixed forecast points, per request direction.
export function orderedForecastPoints(from) {
  return from === "budardalur"
    ? BUDARDALUR_HOLMAVIK_FORECAST_POINTS
    : [...BUDARDALUR_HOLMAVIK_FORECAST_POINTS].reverse();
}
