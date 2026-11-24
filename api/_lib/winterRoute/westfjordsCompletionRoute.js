// api/_lib/winterRoute/westfjordsCompletionRoute.js
//
// Ticket #503 westfjords-completion — the last 8 unordered pairs / 16
// directions among the 5 Westfjords places already wired into
// budardalurHolmavikRoute.js/westfjordsBatchRoute.js plus isafjordur:
// budardalur<->isafjordur, flokalundur<->isafjordur, isafjordur<->holmavik,
// isafjordur<->patreksfjordur, isafjordur<->talknafjordur,
// flokalundur<->holmavik, holmavik<->patreksfjordur,
// holmavik<->talknafjordur. Reuses the exact same production core
// (composeGeometryPath/loadWestfjordsCombinedRegionDataset) and reuses the
// existing 9 westfjordsBatch points + 4 B<->H points verbatim (12 unique
// after the shared budardalur-route) — those two files and their own
// pairs/resolvers/cache keys are left COMPLETELY UNTOUCHED by this round.
//
// Six new points (frozen table, approved-prompt-v1.md P2 + the P2(B)
// decision for sudavikurhlid-route = 3535v0, not 3392v2): isafjordur-route,
// dynjandisheidi-route, gemlufallsheidi-route, sudavikurhlid-route,
// vatnsfjardarhals-route, steingrimsfjardarheidi-route. Native x/y/z read
// from server_data/westfjords-region-combined.json via the real loader;
// WGS84 computed offline (same GRS80/Lambert parameters as every prior
// round). Independently re-verified (own inverse, own vertex lookup) in
// westfjordsCompletionRoute.test.js and in this round's own
// docs/ai/tasks/ticket-503/westfjords-completion/evidence/
// probe-and-registry.mjs real run (P1/P2) — all 18 union points, all 16
// directions' geometryId/lengthM/points/unmappedLengthM matched the
// prompt/Jonesy sandbox figures exactly on the first attempt.
//
// P3(a) "ghost point" guard: throskuldar-south-route/throskuldar-pass-route
// share a coordinate with lines used on budardalur<->isafjordur (and the
// other budardalur-anchored pairs) even though that route never actually
// has a real 907000037 (Þröskuldar) IdButur section — so plain coordinate
// membership alone would wrongly attach a Þröskuldar point to those
// routes. Both Þröskuldar points are only counted as on-route when the
// composed route's own IdButur list actually contains 907000037.

import { composeGeometryPath } from "./geometryComposition.js";
import { loadWestfjordsCombinedRegionDataset } from "./westfjordsCombinedRegionDataset.js";
import { EDGE_SEGMENT_FRACTION_THRESHOLD, BUDARDALUR_HOLMAVIK_FORECAST_POINTS } from "./budardalurHolmavikRoute.js";
import { WESTFJORDS_BATCH_POINTS } from "./westfjordsBatchRoute.js";

// Native x/y/z + offline WGS84 for the six new points (approved-prompt-v1.md
// P2 table, P2(B) decision applied).
export const WESTFJORDS_COMPLETION_NEW_POINTS = [
  { id: "isafjordur-route", labelIs: "Ísafjörður — leiðarpunktur", labelEn: "Ísafjörður — route point", lat: 66.07499186, lon: -23.12369279, sourceId: 3834, vertexIndex: 5, nativeX: 313430.1109331023, nativeY: 625946.2219128008, nativeZ: 0 },
  { id: "dynjandisheidi-route", labelIs: "Nærri Dynjandisheiði", labelEn: "Near Dynjandisheiði", lat: 65.65161252, lon: -23.2584075, sourceId: 3008, vertexIndex: 20, nativeX: 304166.459175525, nativeY: 579246.8183946349, nativeZ: 505.449 },
  { id: "gemlufallsheidi-route", labelIs: "Nærri Gemlufallsheiði", labelEn: "Near Gemlufallsheiði", lat: 65.99851778, lon: -23.41778318, sourceId: 2993, vertexIndex: 5, nativeX: 299549.9203076527, nativeY: 618337.7319570705, nativeZ: 2.8441 },
  { id: "sudavikurhlid-route", labelIs: "Nærri Súðavík", labelEn: "Near Súðavík", lat: 66.02459271, lon: -22.9922543, sourceId: 3535, vertexIndex: 0, nativeX: 319014.0974912532, nativeY: 619955.3056787439, nativeZ: 13.306 },
  { id: "vatnsfjardarhals-route", labelIs: "Nærri Vatnsfjarðarhálsi", labelEn: "Near Vatnsfjarðarháls", lat: 65.92586622, lon: -22.52468975, sourceId: 3148, vertexIndex: 14, nativeX: 339573.85004998825, nativeY: 607702.7421201756, nativeZ: 123.8862 },
  { id: "steingrimsfjardarheidi-route", labelIs: "Nærri Steingrímsfjarðarheiði", labelEn: "Near Steingrímsfjarðarheiði", lat: 65.74993838, lon: -22.12307405, sourceId: 3415, vertexIndex: 18, nativeX: 356868.8000422864, nativeY: 587148.2315287166, nativeZ: 439.9446 },
];

// Reused verbatim from the other two modules, never duplicated/redrawn.
// Dedupe by id: budardalur-route is shared between BUDARDALUR_HOLMAVIK_
// FORECAST_POINTS and WESTFJORDS_BATCH_POINTS.
const REUSED_POINTS = [...new Map(
  [...BUDARDALUR_HOLMAVIK_FORECAST_POINTS, ...WESTFJORDS_BATCH_POINTS].map((p) => [p.id, p])
).values()];

export const WESTFJORDS_COMPLETION_POINTS = [...REUSED_POINTS, ...WESTFJORDS_COMPLETION_NEW_POINTS];

const THROSKULDAR_IDS = new Set(["throskuldar-south-route", "throskuldar-pass-route"]);
const THROSKULDAR_IDBUTUR = 907000037;

const WESTFJORDS_COMPLETION_PAIRS = [
  ["budardalur", "isafjordur"], ["flokalundur", "isafjordur"], ["isafjordur", "holmavik"],
  ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"], ["flokalundur", "holmavik"],
  ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"],
];
const WESTFJORDS_COMPLETION_PAIR_KEYS = new Set();
for (const [a, b] of WESTFJORDS_COMPLETION_PAIRS) {
  WESTFJORDS_COMPLETION_PAIR_KEYS.add(`${a}|${b}`);
  WESTFJORDS_COMPLETION_PAIR_KEYS.add(`${b}|${a}`);
}

export function isWestfjordsCompletionPair(from, to) {
  return WESTFJORDS_COMPLETION_PAIR_KEYS.has(`${from}|${to}`);
}

// P5b(i) — same fixed, direction-independent cache-key convention as
// westfjordsBatchRoute.js's own (unaffected) key: both directions of the
// same pair share one bucket/single-flight. Disjoint pair set from the
// other two modules, so no cross-round cache collision is possible.
export function westfjordsCompletionCacheKey(from, to) {
  return `winter-route-data:${[from, to].sort().join("-")}`;
}

// Fixed, reviewed EN translations of the real retained `name` field for
// the full 41-IdButur union this round's 8 pairs touch (superset,
// including names already translated in the other two modules' own
// tables — same duplication convention those two files already use
// between each other). Sérnöfn (place/feature names) are kept unchanged,
// never machine-translated; "Flugvöllur" (a descriptive word, not a
// proper name) is translated to "Airport" per the approved prompt; "Djúpvegur:
// Ísafjörður" is kept unchanged per the approved prompt.
const IDBUTUR_NAME_EN = {
  "Tálknafjarðarvegur": "Tálknafjarðarvegur",
  "Gröf - Hallsteinsnes": "Gröf–Hallsteinsnes",
  "Djúpifjörður": "Djúpifjörður",
  "Patreksfjörður": "Patreksfjörður",
  "Helluskarð": "Helluskarð",
  "Breiðadalsleggur": "Breiðadalsleggur",
  "Hrófá-Hólmavík": "Hrófá–Hólmavík",
  "Staðardalur": "Staðardalur",
  "Skógstagl-Búðardalur": "Skógstagl–Búðardalur",
  "Gilsfjörður": "Gilsfjörður",
  "Ódrjúgsháls": "Ódrjúgsháls",
  "Dýrafjarðargöng-Þingeyrarvegur": "Dýrafjarðargöng–Þingeyrarvegur",
  "Tungudalur": "Tungudalur",
  "Búðardalur-Laugar": "Búðardalur–Laugar",
  "Svínadalur": "Svínadalur",
  "Djúpvegur-Reykhólasveitarv.": "Djúpvegur–Reykhólasveit",
  "Þorskafjörður": "Þorskafjörður",
  "Gufudalur-Kollafjörður": "Gufudalur–Kollafjörður",
  "Klettsháls": "Klettsháls",
  "Skálmardalsá-Flókalundur": "Skálmardalsá–Flókalundur",
  "Flókalundur-Brjánslækur": "Flókalundur–Brjánslækur",
  "Brjánslækur-Siglunesvegur": "Brjánslækur–Siglunesvegur",
  "Kleifaheiði": "Kleifaheiði",
  "Raknadalshlíð": "Raknadalshlíð",
  "Miklidalur": "Miklidalur",
  "Dynjandisheiði": "Dynjandisheiði",
  "Dynjandavegur-Dýrafjarðargöng": "Dynjandavegur–Dýrafjarðargöng",
  "Kjaransstaðir-Gemlufall": "Kjaransstaðir–Gemlufall",
  "Gemlufallsheiði": "Gemlufallsheiði",
  "Önundarfjörður": "Önundarfjörður",
  "Flugvöllur-Ísafjörður": "Airport–Ísafjörður",
  "Súðavíkurhlíð": "Súðavíkurhlíð",
  "Súðavík-Hjallar": "Súðavík–Hjallar",
  "Hjallar-Skálavík": "Hjallar–Skálavík",
  "Vatnsfjarðarháls": "Vatnsfjarðarháls",
  "Tungudalsleggur": "Tungudalsleggur",
  "Dýrafjarðargöng": "Dýrafjarðargöng",
  "Þröskuldar": "Þröskuldar",
  "Hólmavík-Drangsnesvegur": "Hólmavík–Drangsnesvegur",
  "Steingrímsfjarðarheiði": "Steingrímsfjarðarheiði",
  "Djúpvegur: Ísafjörður": "Djúpvegur: Ísafjörður",
};

function expandSliceVertices(linesById, slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex), hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}

// Resolves the real composed geometry for an allowlisted westfjords-
// completion pair. Returns { ok:false } for any pair outside the eight
// allowlisted (16-directed) combinations — including B<->H and the six
// westfjords-batch pairs, which keep using their own separate, untouched
// resolvers.
export function resolveWestfjordsCompletionGeometry(from, to) {
  if (!isWestfjordsCompletionPair(from, to)) return { ok: false, reason: "unsupported_pair" };

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
  if (result.status !== "geometry_only") return { ok: false, reason: "geometry_unavailable" };

  // IdButur, n:1, real travel order, each with its own real summed slice
  // length and the real retained `name` of its own first slice (P3a/d).
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
      idButur, nameIs, nameEn: IDBUTUR_NAME_EN[nameIs] ?? nameIs,
      routeLengthM, routeLengthFraction: routeLengthM / result.lengthM,
      isEdgeSegment: routeLengthM / result.lengthM < EDGE_SEGMENT_FRACTION_THRESHOLD,
    };
  });

  // P3b — null-ID (estimated connector) slices are never folded into an
  // adjacent IdButur; their own summed length is reported separately.
  const unmappedLengthM = result.slices.filter((s) => s.idbutur == null).reduce((sum, s) => sum + s.lengthM, 0);

  // P3(a) ghost-point guard: Þröskuldar points only count as on-route when
  // the route's own IdButur list actually has a real 907000037 section.
  const hasThroskuldarSection = idButurOrder.includes(THROSKULDAR_IDBUTUR);

  // P2b/P4b — point membership + chainage order, computed dynamically:
  // which registry points' own native x/y appear as a literal coordinate
  // on THIS specific composed route, ordered by first appearance in the
  // real coordinate chain (never a hardcoded table).
  const allCoords = [];
  const cumulativeM = [0];
  result.slices.forEach((slice, i) => {
    const verts = expandSliceVertices(linesById, slice);
    for (let j = i === 0 ? 0 : 1; j < verts.length; j++) {
      allCoords.push(verts[j]);
      const prev = allCoords[allCoords.length - 2] ?? verts[j];
      const segLen = Math.hypot(verts[j].x - prev.x, verts[j].y - prev.y);
      cumulativeM.push(cumulativeM[cumulativeM.length - 1] + segLen);
    }
  });
  const onRoute = [];
  for (const p of WESTFJORDS_COMPLETION_POINTS) {
    if (THROSKULDAR_IDS.has(p.id) && !hasThroskuldarSection) continue;
    const idx = allCoords.findIndex((c) => c.x === p.nativeX && c.y === p.nativeY);
    if (idx !== -1) onRoute.push({ id: p.id, idx });
  }
  onRoute.sort((a, b) => a.idx - b.idx);

  // P4(c) — each on-route point's own real planar chainage (cumulative
  // distance from THIS request's own `from`), so the UI can compute the
  // largest gap between consecutive points generically for any pair.
  const pointChainageKm = {};
  for (const o of onRoute) pointChainageKm[o.id] = cumulativeM[o.idx + 1] / 1000;

  return {
    ok: true,
    geometryId: result.geometryId,
    regionVersion: region.regionVersion,
    lengthM: result.lengthM,
    idButurSections,
    idButurList: idButurOrder,
    unmappedLengthM,
    pointIds: onRoute.map((o) => o.id),
    pointChainageKm,
  };
}

// Resolves the ordered forecast-point DEFINITIONS (full objects, not just
// ids) for a given direction, from a resolver result's own `pointIds`.
export function westfjordsCompletionForecastPoints(pointIds) {
  const byId = new Map(WESTFJORDS_COMPLETION_POINTS.map((p) => [p.id, p]));
  return pointIds.map((id) => byId.get(id));
}
