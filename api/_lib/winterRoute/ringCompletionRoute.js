// api/_lib/winterRoute/ringCompletionRoute.js
//
// Ticket #503 ring-completion -- weather/road data for the last 8
// unordered Ring Road pairs, both directions (16 directions): Rauðavatn/
// Selfoss/Hella each paired with Egilsstaðir and Seyðisfjörður, plus
// Selfoss<->Hella and Egilsstaðir<->Seyðisfjörður. Unlike the ring-options
// pairs (Rauðavatn<->Selfoss/Hella), these have **no south/north option**
// at all -- the geometry handler's own plain, undirected
// composeGeometryPath branch already resolves them (same core, same
// geometryDataset, same 5 real endpoints reykjavik-raudavatn/selfoss/
// hella/egilsstadir/seydisfjordur). This module reuses that exact core,
// never a directed/MVP resolver, never a second geometry algorithm.
//
// Point selection is, like ringOptionsRoute.js, a FROZEN explicit ordered
// ID list per direction (VARIANT_POINT_IDS below) -- not coordinate
// membership, and not a runtime sampling engine. All 30 Westfjords/ring-
// option points keep their own native coordinates unchanged; three new
// points are added here (Egilsstaðir, Seyðisfjörður, and a "near
// Fjarðarheiði" mountain-pass marker between them).

import { composeGeometryPath } from "./geometryComposition.js";
import { loadGeometryDataset } from "./geometryDataset.js";
import {
  RING_OPTION_POINTS, TUNNEL_IDBUTUR_IDS, IDBUTUR_NAME_EN, IDBUTUR_NAME_IS_DISPLAY_OVERRIDE,
  RING_EDGE_SEGMENT_LENGTH_THRESHOLD_M,
} from "./ringOptionsRoute.js";

// P1 -- the three new points (frozen table, approved-prompt-v1.md). Native
// x/y/z + independently-verified WGS84 (own offline Lambert/GRS80
// inverse, ≤1e-6° of Jonesy's own cited reference). Egilsstaðir/
// Seyðisfjörður are the real dataset.endpoints (the same Egilsstaðir
// point ring-options' own north-option composition already uses as its
// E1 junction) -- never a free-standing town-centre guess.
export const RING_COMPLETION_NEW_POINTS = [
  { id: "egilsstadir-route", labelIs: "Egilsstaðir", labelEn: "Egilsstaðir", lat: 65.25861762, lon: -14.39028964, sourceId: 2344, vertexIndex: 0, nativeX: 715153.74, nativeY: 536679.93, nativeZ: 56.3606 },
  { id: "seydisfjordur-route", labelIs: "Seyðisfjörður", labelEn: "Seyðisfjörður", lat: 65.26021786, lon: -14.00953135, sourceId: 2894, vertexIndex: 1, nativeX: 732875.674, nativeY: 538207.0762, nativeZ: 3.0279 },
  { id: "fjardarheidi-route", labelIs: "Nærri Fjarðarheiði", labelEn: "Near Fjarðarheiði", lat: 65.25950964, lon: -14.2254024, sourceId: 3409, vertexIndex: 0, nativeX: 722827.8006, nativeY: 537350.2933, nativeZ: 615.7701 },
];

// Reused verbatim from ringOptionsRoute.js's own 30-point registry
// (dedup by id, though none of the three new ids collide with it).
const RING_COMPLETION_POINTS = [...RING_OPTION_POINTS, ...RING_COMPLETION_NEW_POINTS];
const RING_COMPLETION_POINTS_BY_ID = new Map(RING_COMPLETION_POINTS.map((p) => [p.id, p]));

// P1 -- 16 FROZEN, explicit, ordered point-id sequences (one per
// direction), read directly by the resolver -- never coordinate
// membership, which (per the Westfjords modules' own earlier
// experience) would attach ghost points from unrelated directions.
const VARIANT_POINT_IDS = {
  "reykjavik-raudavatn|egilsstadir": ["raudavatn-route", "grundartangi-route", "nordura-route", "holtavorduheidi-route", "gljufura-route", "langidalur-route", "kjalkavegur-route", "oxnadalsheidi-route", "ljosavatnsskard-route", "myvatnsheidi-route", "myvatnsoraefi-route", "biskupshals-route", "haereksstadir-route", "egilsstadir-route"],
  "egilsstadir|reykjavik-raudavatn": ["egilsstadir-route", "haereksstadir-route", "biskupshals-route", "myvatnsoraefi-route", "myvatnsheidi-route", "ljosavatnsskard-route", "oxnadalsheidi-route", "kjalkavegur-route", "langidalur-route", "gljufura-route", "holtavorduheidi-route", "nordura-route", "grundartangi-route", "raudavatn-route"],
  "reykjavik-raudavatn|seydisfjordur": ["raudavatn-route", "grundartangi-route", "nordura-route", "holtavorduheidi-route", "gljufura-route", "langidalur-route", "kjalkavegur-route", "oxnadalsheidi-route", "ljosavatnsskard-route", "myvatnsheidi-route", "myvatnsoraefi-route", "biskupshals-route", "haereksstadir-route", "fellabaer-route", "fjardarheidi-route", "seydisfjordur-route"],
  "seydisfjordur|reykjavik-raudavatn": ["seydisfjordur-route", "fjardarheidi-route", "fellabaer-route", "haereksstadir-route", "biskupshals-route", "myvatnsoraefi-route", "myvatnsheidi-route", "ljosavatnsskard-route", "oxnadalsheidi-route", "kjalkavegur-route", "langidalur-route", "gljufura-route", "holtavorduheidi-route", "nordura-route", "grundartangi-route", "raudavatn-route"],
  "selfoss|hella": ["selfoss-route", "hella-route"],
  "hella|selfoss": ["hella-route", "selfoss-route"],
  "selfoss|egilsstadir": ["selfoss-route", "hvolsvollur-route", "steinar-route", "myrdalssandur-route", "nupsstadur-route", "kirkjubaejarklaustur-route", "fagurholsmyri-route", "hofn-route", "hvalnes-route", "thvotta-route", "djupivogur-route", "breiddalsvik-route", "fagridalur-route", "egilsstadir-route"],
  "egilsstadir|selfoss": ["egilsstadir-route", "fagridalur-route", "breiddalsvik-route", "djupivogur-route", "thvotta-route", "hvalnes-route", "hofn-route", "fagurholsmyri-route", "kirkjubaejarklaustur-route", "nupsstadur-route", "myrdalssandur-route", "steinar-route", "hvolsvollur-route", "selfoss-route"],
  "selfoss|seydisfjordur": ["selfoss-route", "hvolsvollur-route", "steinar-route", "myrdalssandur-route", "nupsstadur-route", "kirkjubaejarklaustur-route", "fagurholsmyri-route", "hofn-route", "hvalnes-route", "thvotta-route", "djupivogur-route", "breiddalsvik-route", "fagridalur-route", "fjardarheidi-route", "seydisfjordur-route"],
  "seydisfjordur|selfoss": ["seydisfjordur-route", "fjardarheidi-route", "fagridalur-route", "breiddalsvik-route", "djupivogur-route", "thvotta-route", "hvalnes-route", "hofn-route", "fagurholsmyri-route", "kirkjubaejarklaustur-route", "nupsstadur-route", "myrdalssandur-route", "steinar-route", "hvolsvollur-route", "selfoss-route"],
  "hella|egilsstadir": ["hella-route", "steinar-route", "myrdalssandur-route", "nupsstadur-route", "kirkjubaejarklaustur-route", "fagurholsmyri-route", "hofn-route", "hvalnes-route", "thvotta-route", "djupivogur-route", "breiddalsvik-route", "fagridalur-route", "egilsstadir-route"],
  "egilsstadir|hella": ["egilsstadir-route", "fagridalur-route", "breiddalsvik-route", "djupivogur-route", "thvotta-route", "hvalnes-route", "hofn-route", "fagurholsmyri-route", "kirkjubaejarklaustur-route", "nupsstadur-route", "myrdalssandur-route", "steinar-route", "hella-route"],
  "hella|seydisfjordur": ["hella-route", "steinar-route", "myrdalssandur-route", "nupsstadur-route", "kirkjubaejarklaustur-route", "fagurholsmyri-route", "hofn-route", "hvalnes-route", "thvotta-route", "djupivogur-route", "breiddalsvik-route", "fagridalur-route", "fjardarheidi-route", "seydisfjordur-route"],
  "seydisfjordur|hella": ["seydisfjordur-route", "fjardarheidi-route", "fagridalur-route", "breiddalsvik-route", "djupivogur-route", "thvotta-route", "hvalnes-route", "hofn-route", "fagurholsmyri-route", "kirkjubaejarklaustur-route", "nupsstadur-route", "myrdalssandur-route", "steinar-route", "hella-route"],
  "egilsstadir|seydisfjordur": ["egilsstadir-route", "fjardarheidi-route", "seydisfjordur-route"],
  "seydisfjordur|egilsstadir": ["seydisfjordur-route", "fjardarheidi-route", "egilsstadir-route"],
};

const RING_COMPLETION_PAIR_KEYS = new Set(Object.keys(VARIANT_POINT_IDS));

export function isRingCompletionPair(from, to) {
  return RING_COMPLETION_PAIR_KEYS.has(`${from}|${to}`);
}

// P4 -- a distinct cache-key prefix (neither "winter-route-data:ring:"
// nor the Westfjords modules' own `winter-route-data:<sorted-pair>`
// convention), direction-specific (no reverse-sharing, same convention
// ring-options established), keyed by the server-recomputed geometryId +
// datasetVersion.
export function ringCompletionCacheKey(from, to, geometryId, datasetVersion) {
  return `winter-route-data:ring-completion:${from}|${to}|${geometryId}|${datasetVersion}`;
}

// P3(c) -- only one name is new to the union of all 72 existing names:
// 911170037 "Fjarðarheiði", a proper name with no separate EN form.
const RING_COMPLETION_NAME_EN = { ...IDBUTUR_NAME_EN, "Fjarðarheiði": "Fjarðarheiði" };

function expandSliceVertices(linesById, slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex), hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}

// Resolves the real composed geometry for an allowlisted ring-completion
// direction, using the SAME plain/undirected composeGeometryPath +
// geometryDataset the geometry handler's own generic branch uses for
// every place pair outside the MVP/ring-options four. Returns
// { ok:false } for any pair outside the 16 allowlisted directions.
export function resolveRingCompletionGeometry(from, to) {
  if (!isRingCompletionPair(from, to)) return { ok: false, reason: "unsupported_pair" };

  const dataset = loadGeometryDataset();
  const fromMapped = dataset.endpoints[from];
  const toMapped = dataset.endpoints[to];
  const result = composeGeometryPath({
    crs: dataset.crs,
    tier: dataset.tier,
    lines: dataset.lines,
    from: { placeId: from, x: fromMapped.x, y: fromMapped.y },
    to: { placeId: to, x: toMapped.x, y: toMapped.y },
  });
  if (result.status !== "geometry_only") return { ok: false, reason: result.reason ?? "geometry_unavailable" };

  const linesById = new Map(dataset.lines.map((l) => [l.sourceId, l]));

  // P5(a) -- aggregate per IdButur in FIRST-COME-ORDER globally (same
  // helper pattern as ringOptionsRoute.js's own), not just consecutive
  // slices -- the real 16 directions here show no actual non-adjacent
  // repeat, but the same defensive aggregation is reused rather than a
  // narrower consecutive-only collapse.
  const idButurOrder = [];
  const seenIdButur = new Set();
  const lengthByIdButur = new Map();
  const nameIsByIdButur = new Map();
  for (const slice of result.slices) {
    if (slice.idbutur == null) continue;
    if (!seenIdButur.has(slice.idbutur)) {
      seenIdButur.add(slice.idbutur);
      idButurOrder.push(slice.idbutur);
    }
    lengthByIdButur.set(slice.idbutur, (lengthByIdButur.get(slice.idbutur) ?? 0) + slice.lengthM);
    if (!nameIsByIdButur.has(slice.idbutur)) nameIsByIdButur.set(slice.idbutur, linesById.get(slice.sourceId).name);
  }

  const idButurSections = idButurOrder.map((idButur) => {
    const routeLengthM = lengthByIdButur.get(idButur);
    const rawNameIs = nameIsByIdButur.get(idButur);
    return {
      idButur,
      nameIs: IDBUTUR_NAME_IS_DISPLAY_OVERRIDE[rawNameIs] ?? rawNameIs,
      nameEn: RING_COMPLETION_NAME_EN[rawNameIs] ?? rawNameIs,
      routeLengthM,
      routeLengthFraction: routeLengthM / result.lengthM,
      isEdgeSegment: routeLengthM < RING_EDGE_SEGMENT_LENGTH_THRESHOLD_M,
    };
  });

  const unmappedLengthM = result.slices.filter((s) => s.idbutur == null).reduce((sum, s) => sum + s.lengthM, 0);

  const pointIds = VARIANT_POINT_IDS[`${from}|${to}`];
  if (!pointIds) return { ok: false, reason: "unsupported_pair" }; // unreachable given the checks above; defensive only

  // P2/P3(b) tunnel-binding STOP guard -- defensive invariant; none of the
  // frozen points here actually bind to a tunnel line.
  for (const pid of pointIds) {
    const p = RING_COMPLETION_POINTS_BY_ID.get(pid);
    const onTunnel = result.slices.some((s) => s.sourceId === p.sourceId && TUNNEL_IDBUTUR_IDS.has(s.idbutur));
    if (onTunnel) return { ok: false, reason: "point_binding_invalid_tunnel" };
  }

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
  const pointChainageKm = {};
  for (const pid of pointIds) {
    const p = RING_COMPLETION_POINTS_BY_ID.get(pid);
    const idx = allCoords.findIndex((c) => c.x === p.nativeX && c.y === p.nativeY);
    if (idx !== -1) pointChainageKm[pid] = cumulativeM[idx + 1] / 1000;
  }

  return {
    ok: true,
    geometryId: result.geometryId,
    datasetVersion: dataset.datasetVersion,
    lengthM: result.lengthM,
    idButurSections,
    idButurList: idButurOrder,
    unmappedLengthM,
    pointIds,
    pointChainageKm,
  };
}

// Resolves the ordered forecast-point DEFINITIONS (full objects, not just
// ids) for a given direction's own frozen `pointIds`.
export function ringCompletionForecastPoints(pointIds) {
  return pointIds.map((id) => RING_COMPLETION_POINTS_BY_ID.get(id));
}
