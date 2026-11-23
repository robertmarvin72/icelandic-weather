// api/_lib/winterRoute/westfjordsBatchRoute.js
//
// Ticket #503 westfjords-batch — six new pairs: budardalur<->flokalundur,
// budardalur<->patreksfjordur, budardalur<->talknafjordur,
// flokalundur<->patreksfjordur, flokalundur<->talknafjordur,
// patreksfjordur<->talknafjordur (12 directions). Reuses the exact same
// production core (composeGeometryPath/loadWestfjordsCombinedRegionDataset)
// as api/_lib/winterRoute/budardalurHolmavikRoute.js's own B<->H resolver
// — that file and its own 4-point registry/resolver are left COMPLETELY
// UNTOUCHED by this round (own tests/contract unchanged); Þröskuldar/
// Hólmavík points never appear on these six pairs.
//
// Point membership + chainage order are computed DYNAMICALLY every
// request (real coordinate presence in the composed route's own
// coordinate chain, ordered by first-appearance position) — never a
// hardcoded per-pair table. This was independently verified against the
// approved prompt's own cited sandbox figures via
// docs/ai/tasks/ticket-503/westfjords-batch/evidence/probe-and-registry.mjs's
// own real run (5/7/8/3/4/3 points per pair; 12/17/18/6/7/3 IdButur) and
// this file's own test suite's own independent re-derivation.

import { composeGeometryPath } from "./geometryComposition.js";
import { loadWestfjordsCombinedRegionDataset } from "./westfjordsCombinedRegionDataset.js";
import { BUDARDALUR_HOLMAVIK_FORECAST_POINTS, EDGE_SEGMENT_FRACTION_THRESHOLD } from "./budardalurHolmavikRoute.js";

// Reused verbatim, never a second/possibly-drifting copy of the same point.
const BUDARDALUR_POINT = BUDARDALUR_HOLMAVIK_FORECAST_POINTS.find((p) => p.id === "budardalur-route");

// Native x/y/z read from server_data/westfjords-region-combined.json
// (sourceId/vertexIndex frozen in the approved prompt's own table); WGS84
// computed offline (same GRS80/Lambert parameters as every prior round).
// Cross-checked (membership/order/transform) in
// westfjordsBatchRoute.test.js and the task-local probe script above.
export const WESTFJORDS_BATCH_NEW_POINTS = [
  { id: "flokalundur-route", labelIs: "Flókalundur", labelEn: "Flókalundur", lat: 65.57639536074798, lon: -23.163568514574283, sourceId: 3648, vertexIndex: 50, nativeX: 307969.53266107786, nativeY: 570587.8678268795, nativeZ: 0 },
  { id: "patreksfjordur-route", labelIs: "Patreksfjörður", labelEn: "Patreksfjörður", lat: 65.59707817329726, lon: -23.993977831985745, sourceId: 53127, vertexIndex: 7, nativeX: 269924.76731277065, nativeY: 575660.3516744098, nativeZ: 0 },
  { id: "talknafjordur-route", labelIs: "Tálknafjörður — leiðarpunktur", labelEn: "Tálknafjörður — route point", lat: 65.62399622999999, lon: -23.81359943, sourceId: 2889, vertexIndex: 12, nativeX: 278446.8401528689, nativeY: 578008.3317371742, nativeZ: 0 },
  { id: "svinadalur-route", labelIs: "Svínadalur", labelEn: "Svínadalur", lat: 65.30638704, lon: -21.740307590000004, sourceId: 3247, vertexIndex: 28, nativeX: 372256.2702906452, nativeY: 536926.9539096388, nativeZ: 223.3447 },
  { id: "gilsfjordur-route", labelIs: "Gilsfjörður", labelEn: "Gilsfjörður", lat: 65.40683145999999, lon: -21.879936050000005, sourceId: 3460, vertexIndex: 7, nativeX: 366261.65560996975, nativeY: 548403.271468082, nativeZ: 48.7551 },
  { id: "klettshals-route", labelIs: "Klettsháls — leiðarpunktur", labelEn: "Klettsháls — route point", lat: 65.65937983, lon: -22.6046178, sourceId: 3672, vertexIndex: 36, nativeX: 334246.4202972641, nativeY: 578241.4318694496, nativeZ: 0 },
  { id: "kleifaheidi-route", labelIs: "Kleifaheiði — leiðarpunktur", labelEn: "Kleifaheiði — route point", lat: 65.51876214, lon: -23.728489359999998, sourceId: 3332, vertexIndex: 31, nativeX: 281479.98014571297, nativeY: 566012.1921332232, nativeZ: 0 },
  { id: "miklidalur-route", labelIs: "Miklidalur — leiðarpunktur", labelEn: "Miklidalur — route point", lat: 65.58121574, lon: -23.85469532, sourceId: 3361, vertexIndex: 21, nativeX: 276193.10028054705, nativeY: 573397.0822966988, nativeZ: 0 },
];

export const WESTFJORDS_BATCH_POINTS = [BUDARDALUR_POINT, ...WESTFJORDS_BATCH_NEW_POINTS];

const WESTFJORDS_BATCH_PAIRS = [
  ["budardalur", "flokalundur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"],
  ["flokalundur", "patreksfjordur"], ["flokalundur", "talknafjordur"], ["patreksfjordur", "talknafjordur"],
];
const WESTFJORDS_BATCH_PAIR_KEYS = new Set();
for (const [a, b] of WESTFJORDS_BATCH_PAIRS) {
  WESTFJORDS_BATCH_PAIR_KEYS.add(`${a}|${b}`);
  WESTFJORDS_BATCH_PAIR_KEYS.add(`${b}|${a}`);
}

export function isWestfjordsBatchPair(from, to) {
  return WESTFJORDS_BATCH_PAIR_KEYS.has(`${from}|${to}`);
}

// P5b(i) — fixed, direction-independent cache key per UNORDERED pair
// (never built from client input beyond the already-validated from/to):
// both directions of the same pair share one bucket/single-flight.
export function westfjordsBatchCacheKey(from, to) {
  return `winter-route-data:${[from, to].sort().join("-")}`;
}

// Fixed, reviewed EN translations of the real retained `name` field
// (same convention as budardalurHolmavikRoute.js's own IDBUTUR_NAME_EN
// and segments.js before it) for the union of names seen across all six
// new pairs' own real composed geometry (verified via the probe script
// above). Sérnöfn (place/feature names) are kept unchanged, never
// machine-translated; a descriptive non-proper name gets a reviewed EN
// phrase.
const IDBUTUR_NAME_EN = {
  "Skógstagl-Búðardalur": "Skógstagl–Búðardalur",
  "Búðardalur-Laugar": "Búðardalur–Laugar",
  "Svínadalur": "Svínadalur",
  "Gilsfjörður": "Gilsfjörður",
  "Djúpvegur-Reykhólasveitarv.": "Djúpvegur–Reykhólasveit",
  "Gröf - Hallsteinsnes": "Gröf–Hallsteinsnes",
  "Djúpifjörður": "Djúpifjörður",
  "Ódrjúgsháls": "Ódrjúgsháls",
  "Gufudalur-Kollafjörður": "Gufudalur–Kollafjörður",
  "Klettsháls": "Klettsháls",
  "Skálmardalsá-Flókalundur": "Skálmardalsá–Flókalundur",
  "Flókalundur-Brjánslækur": "Flókalundur–Brjánslækur",
  "Brjánslækur-Siglunesvegur": "Brjánslækur–Siglunesvegur",
  "Kleifaheiði": "Kleifaheiði",
  "Raknadalshlíð": "Raknadalshlíð",
  "Patreksfjörður": "Patreksfjörður",
  "Miklidalur": "Miklidalur",
  "Tálknafjarðarvegur": "Tálknafjarðarvegur",
};

function expandSliceVertices(linesById, slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex), hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}

// Resolves the real composed geometry for an allowlisted westfjords-batch
// pair. Returns { ok:false } for any pair outside the six allowlisted
// (12-directed) combinations — including B<->H, which keeps using its own
// separate, untouched resolver in budardalurHolmavikRoute.js.
export function resolveWestfjordsBatchGeometry(from, to) {
  if (!isWestfjordsBatchPair(from, to)) return { ok: false, reason: "unsupported_pair" };

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

  // P2b/4b — point membership + chainage order, computed dynamically:
  // which of the 9 registry points' own native x/y appear as a literal
  // coordinate on THIS specific composed route, ordered by first
  // appearance in the real coordinate chain (never a hardcoded table).
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
  for (const p of WESTFJORDS_BATCH_POINTS) {
    const idx = allCoords.findIndex((c) => c.x === p.nativeX && c.y === p.nativeY);
    if (idx !== -1) onRoute.push({ id: p.id, idx });
  }
  onRoute.sort((a, b) => a.idx - b.idx);

  // P4(c) — each on-route point's own real planar chainage (cumulative
  // distance from THIS request's own `from`), so the UI can compute the
  // largest gap between consecutive points generically for any pair,
  // never a hardcoded per-pair gap table. cumulativeM[idx+1] is used
  // because allCoords[0] (the very first vertex) has no own entry in
  // cumulativeM besides the seeded 0.
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
export function westfjordsBatchForecastPoints(pointIds) {
  const byId = new Map(WESTFJORDS_BATCH_POINTS.map((p) => [p.id, p]));
  return pointIds.map((id) => byId.get(id));
}
