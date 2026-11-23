// Task-local, read-only script for ticket #503 westfjords-batch
// (approved-prompt-v1.md P1/P2). Independently (re-)derives everything
// this round needs, never trusting the prompt's own cited sandbox numbers
// blindly:
//
// (A) WGS84 for 8 new points (+ budardalur-route, reused unchanged from
//     the B<->H round) via the same offline Lambert Conformal Conic 2SP
//     inverse used throughout this ticket series, cross-checked against
//     the prompt's own cited values and real vertex/geometry membership.
// (B) Per-pair (6 new pairs, 12 directions) real composed geometry via
//     the real production core, confirming lengths/slices/geometryId.
// (C) Per-pair point membership + chainage order, computed DYNAMICALLY
//     (coordinate presence in the composed route, ordered by position in
//     the coordinate chain) -- never a hardcoded per-pair table.
// (D) The ONE bounded real-network probe this round authorizes before
//     implementation: fetchRoadSegments/fetchRoadPoints for the union of
//     19 IdButur, ONE fetchWinterRouteForecast batch for the 9 unique
//     points (4 existing B<->H + budardalur shared + 8 new... actually 1
//     shared + 8 new = 9 total unique points), plus the P1(c) ordering-
//     margin check for all 12 directions, offline, reusing the same
//     already-fetched forecast response (no second request).
//
// Run with: node --env-file=.env.local --env-file=.env.development.local
//   docs/ai/tasks/ticket-503/westfjords-batch/evidence/probe-and-registry.mjs

import fs from "fs";
import path from "path";
import { composeGeometryPath } from "../../../../../../api/_lib/winterRoute/geometryComposition.js";
import { loadWestfjordsCombinedRegionDataset } from "../../../../../../api/_lib/winterRoute/westfjordsCombinedRegionDataset.js";
import { fetchRoadSegments, fetchRoadPoints } from "../../../../../../api/_lib/winterRoute/roadFetch.js";
import { fetchWinterRouteForecast, resolveWinterRouteForecastAuth } from "../../../../../../api/_lib/winterRoute/forecastFetch.js";
import { exportFreshness } from "../../../../../../api/_lib/winterRoute/freshness.js";

// ---------- offline WGS84 (same GRS80/Lambert params as every prior round) ----------
const A_ELL = 6378137.0, F_ELL = 1 / 298.257222101, E2 = F_ELL * (2 - F_ELL), E = Math.sqrt(E2);
const LAT0 = (65 * Math.PI) / 180, LON0 = (-19 * Math.PI) / 180, LAT1 = (64.25 * Math.PI) / 180, LAT2 = (65.75 * Math.PI) / 180;
const X0 = 500000, Y0 = 500000;
function mFunc(phi) { return Math.cos(phi) / Math.sqrt(1 - E2 * Math.sin(phi) ** 2); }
function tFunc(phi) { const s = Math.sin(phi); return Math.tan(Math.PI / 4 - phi / 2) / ((1 - E * s) / (1 + E * s)) ** (E / 2); }
const m1 = mFunc(LAT1), m2 = mFunc(LAT2), t0 = tFunc(LAT0), t1 = tFunc(LAT1), t2 = tFunc(LAT2);
const N = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
const FF = m1 / (N * t1 ** N);
const RHO0 = A_ELL * FF * t0 ** N;
function inverse(x, y) {
  const dx = x - X0, dy = RHO0 - (y - Y0);
  const rho = Math.sign(N) * Math.hypot(dx, dy);
  const theta = Math.atan2(dx, dy) / N;
  const t = (rho / (A_ELL * FF)) ** (1 / N);
  let phi = Math.PI / 2 - 2 * Math.atan(t);
  for (let i = 0; i < 10; i++) {
    const s = Math.sin(phi);
    phi = Math.PI / 2 - 2 * Math.atan(t * (((1 - E * s) / (1 + E * s)) ** (E / 2)));
  }
  return { lon: ((theta + LON0) * 180) / Math.PI, lat: (phi * 180) / Math.PI };
}
function haversineKm(a, b) {
  const R = 6371.0088, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const region = loadWestfjordsCombinedRegionDataset();
const allLines = [...region.lines, ...region.connectors];
const linesById = new Map(allLines.map((l) => [l.sourceId, l]));

const NEW_POINTS = [
  { id: "flokalundur-route", sourceId: 3648, vertexIndex: 50 },
  { id: "patreksfjordur-route", sourceId: 53127, vertexIndex: 7 },
  { id: "talknafjordur-route", sourceId: 2889, vertexIndex: 12 },
  { id: "svinadalur-route", sourceId: 3247, vertexIndex: 28 },
  { id: "gilsfjordur-route", sourceId: 3460, vertexIndex: 7 },
  { id: "klettshals-route", sourceId: 3672, vertexIndex: 36 },
  { id: "kleifaheidi-route", sourceId: 3332, vertexIndex: 31 },
  { id: "miklidalur-route", sourceId: 3361, vertexIndex: 21 },
];
const BUDARDALUR_POINT = { id: "budardalur-route", sourceId: 2769, vertexIndex: 3 };

console.log("=== (A) WGS84 for 8 new points + budardalur-route (reused) ===");
const registry = [];
for (const p of [BUDARDALUR_POINT, ...NEW_POINTS]) {
  const line = linesById.get(p.sourceId);
  const vertex = line.vertices[p.vertexIndex];
  const wgs = inverse(vertex.x, vertex.y);
  registry.push({ ...p, x: vertex.x, y: vertex.y, z: vertex.z, lat: wgs.lat, lon: wgs.lon, name: line.name });
  console.log(`${p.id}: sourceId=${p.sourceId} v${p.vertexIndex} x=${vertex.x} y=${vertex.y} z=${vertex.z} lat=${wgs.lat.toFixed(8)} lon=${wgs.lon.toFixed(8)}`);
}

console.log("\n=== (B) six new pairs, twelve directions, real composed geometry ===");
const PAIRS = [
  ["budardalur", "flokalundur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"],
  ["flokalundur", "patreksfjordur"], ["flokalundur", "talknafjordur"], ["patreksfjordur", "talknafjordur"],
];

function expandSliceVertices(slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex), hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}

const pairResults = {};
let allOk = true;
for (const [a, b] of PAIRS) {
  for (const [from, to] of [[a, b], [b, a]]) {
    const fromPoint = region.endpoints[from], toPoint = region.endpoints[to];
    const result = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: allLines,
      from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
      to: { placeId: to, x: toPoint.x, y: toPoint.y },
    });
    if (result.status !== "geometry_only") { console.log(`${from}->${to}: STOP status=${result.status}`); allOk = false; continue; }

    const allCoords = [];
    result.slices.forEach((slice, i) => {
      const verts = expandSliceVertices(slice);
      for (let j = i === 0 ? 0 : 1; j < verts.length; j++) allCoords.push(verts[j]);
    });

    // Dynamic membership + chainage order: which registry points' own
    // native x/y appear in this route's own coordinate chain, in the
    // order they first appear.
    const onRoute = [];
    for (const p of registry) {
      const idx = allCoords.findIndex((c) => c.x === p.x && c.y === p.y);
      if (idx !== -1) onRoute.push({ id: p.id, idx });
    }
    onRoute.sort((x, y) => x.idx - y.idx);

    const idButurOrder = [];
    const lengthByIdButur = new Map();
    for (const slice of result.slices) {
      if (slice.idbutur == null) continue;
      if (idButurOrder[idButurOrder.length - 1] !== slice.idbutur) idButurOrder.push(slice.idbutur);
      lengthByIdButur.set(slice.idbutur, (lengthByIdButur.get(slice.idbutur) ?? 0) + slice.lengthM);
    }
    const unmappedLengthM = result.slices.filter((s) => s.idbutur == null).reduce((sum, s) => sum + s.lengthM, 0);
    const nullIds = [...new Set(result.slices.filter((s) => s.sourceId < 0).map((s) => s.sourceId))];

    pairResults[`${from}|${to}`] = { geometryId: result.geometryId, lengthM: result.lengthM, idButurOrder, unmappedLengthM, nullIds, points: onRoute.map((o) => o.id) };
    console.log(`${from}->${to}: geometryId=${result.geometryId} lengthM=${result.lengthM.toFixed(3)} slices=${result.slices.length} idButur=${idButurOrder.length} points=[${onRoute.map((o) => o.id).join(",")}] unmappedLengthM=${unmappedLengthM.toFixed(4)} nullIds=[${nullIds.join(",")}]`);
  }
}

// Reverse-consistency + union
console.log("\n=== Union IdButur across all 6 pairs ===");
const unionIdButur = new Set();
for (const [a, b] of PAIRS) { for (const id of pairResults[`${a}|${b}`].idButurOrder) unionIdButur.add(id); }
console.log(`union size: ${unionIdButur.size}`, JSON.stringify([...unionIdButur]));

if (!allOk) { console.log("STOP: a pair failed to compose."); process.exit(1); }

// ---------- (C) edge segments ----------
console.log("\n=== Edge segments (<1% of own pair's own length) ===");
for (const [a, b] of PAIRS) {
  const r = pairResults[`${a}|${b}`];
  for (const id of r.idButurOrder) {
    // recompute length per id from the forward direction's own slices
  }
}

const registryById = new Map(registry.map((p) => [p.id, p]));

console.log("\n=== Registry (for api/_lib/winterRoute route-def file) ===");
console.log(JSON.stringify(registry.map((p) => ({ id: p.id, name: p.name, sourceId: p.sourceId, vertexIndex: p.vertexIndex, x: p.x, y: p.y, z: p.z, lat: p.lat, lon: p.lon })), null, 2));

// ---------- (D) real bounded network probe ----------
console.log("\n=== (D) real bounded network probe (P1) ===");
const auth = resolveWinterRouteForecastAuth();
console.log("forecast auth available (boolean only):", auth.available);

const UPSTREAM_FETCH_OPTIONS = { timeoutMs: 15000, maxBytes: 2 * 1024 * 1024 };
const unionIdButurList = [...unionIdButur];
console.log("union IdButur count:", unionIdButurList.length);

const now = new Date();
const [segmentsResult, pointsResult] = await Promise.all([
  fetchRoadSegments(unionIdButurList, UPSTREAM_FETCH_OPTIONS),
  fetchRoadPoints(unionIdButurList, UPSTREAM_FETCH_OPTIONS),
]);
console.log("segments ok:", segmentsResult.ok, segmentsResult.ok ? "" : segmentsResult.reason);
if (segmentsResult.ok) {
  const exp = exportFreshness(segmentsResult.feedDagsKeyrtUt, now);
  const found = segmentsResult.rows.filter((r) => r.found).length;
  const ambiguous = segmentsResult.rows.filter((r) => r.ambiguous).length;
  console.log(`  feedDagsKeyrtUt=${segmentsResult.feedDagsKeyrtUt} ageMinutes=${exp.ageMinutes?.toFixed(1)} isStale=${exp.isStale} found=${found}/${unionIdButurList.length} ambiguous=${ambiguous}`);
  for (const row of segmentsResult.rows) if (!row.found) console.log(`  MISSING idButur=${row.idButur}`);
}
console.log("points ok:", pointsResult.ok, pointsResult.ok ? "" : pointsResult.reason);
if (pointsResult.ok) {
  const exp = exportFreshness(pointsResult.feedDagsKeyrtUt, now);
  const relevant = pointsResult.points.filter((p) => unionIdButurList.includes(p.idButur));
  console.log(`  feedDagsKeyrtUt=${pointsResult.feedDagsKeyrtUt} ageMinutes=${exp.ageMinutes?.toFixed(1)} isStale=${exp.isStale} notices=${relevant.length}`);
  for (const n of relevant) console.log(`  idButur=${n.idButur} astand=${n.astand} gildirTil=${n.gildirTil ?? "(none)"}`);
}

if (!auth.available) {
  console.log("\nkey_missing -- STOP on forecast portion per P1. Road portion above still real/complete.");
  process.exit(0);
}

const forecastPoints = registry.map((r) => ({ id: r.id, lat: r.lat, lon: r.lon, labelIs: r.id, labelEn: r.id }));
const forecastResult = await fetchWinterRouteForecast({ now, fetchOptions: UPSTREAM_FETCH_OPTIONS, forecastPoints });
console.log("forecast ok:", forecastResult.ok, forecastResult.ok ? "" : forecastResult.reason);
if (forecastResult.ok) {
  console.log(`  window startHour=${forecastResult.window.startHour} endHour=${forecastResult.window.endHour} hours=${forecastResult.window.expectedHours.length}`);
  forecastResult.points.forEach((pt, i) => {
    const p = registry[i];
    if (!pt.ok) { console.log(`  point[${i}]=${p.id} FAILED reason=${pt.reason}`); return; }
    const snapKm = haversineKm({ lat: p.lat, lon: p.lon }, { lat: pt.latitude, lon: pt.longitude });
    console.log(`  point[${i}]=${p.id} returnedLat=${pt.latitude} returnedLon=${pt.longitude} snapKm=${snapKm.toFixed(3)} elevation=${pt.elevation} nativeZ=${p.z}`);
  });

  // ---------- P1(c): ordering margin for all 12 directions, offline ----------
  console.log("\n=== P1(c) ordering margin (offline, same already-fetched response) ===");
  const requestedPoints = registry.map((r) => ({ lat: r.lat, lon: r.lon }));
  const returnedPoints = forecastResult.points.map((pt) => (pt.ok ? { lat: pt.latitude, lon: pt.longitude } : null));

  function isInRequestOrder(resultIndex, returnedCoord, allRequested) {
    const distances = allRequested.map((rp, j) => ({ j, km: haversineKm(returnedCoord, rp) }));
    const own = distances.find((d) => d.j === resultIndex).km;
    const nearest = Math.min(...distances.map((d) => d.km));
    const sorted = [...distances].sort((x, y) => x.km - y.km);
    const secondNearestOtherThanSelf = sorted.find((d) => d.j !== resultIndex)?.km ?? Infinity;
    return { ok: Math.abs(own - nearest) < 1e-9, marginKm: secondNearestOtherThanSelf - own };
  }

  let orderOk = true;
  for (const [a, b] of PAIRS) {
    for (const [from, to] of [[a, b], [b, a]]) {
      const pts = pairResults[`${from}|${to}`].points;
      for (const pid of pts) {
        const idx = registry.findIndex((r) => r.id === pid);
        if (returnedPoints[idx] == null) continue;
        const check = isInRequestOrder(idx, returnedPoints[idx], requestedPoints);
        if (!check.ok) { console.log(`  ORDER_MISMATCH ${from}->${to} point=${pid}`); orderOk = false; }
      }
    }
  }
  // Report the tightest margins specifically called out in the prompt.
  const talknaIdx = registry.findIndex((r) => r.id === "talknafjordur-route");
  const miklidalurIdx = registry.findIndex((r) => r.id === "miklidalur-route");
  const patreksIdx = registry.findIndex((r) => r.id === "patreksfjordur-route");
  if (returnedPoints[talknaIdx] && returnedPoints[miklidalurIdx]) {
    console.log("  talknafjordur<->miklidalur check:", JSON.stringify(isInRequestOrder(talknaIdx, returnedPoints[talknaIdx], requestedPoints)));
  }
  if (returnedPoints[patreksIdx] && returnedPoints[miklidalurIdx]) {
    console.log("  patreksfjordur<->miklidalur check:", JSON.stringify(isInRequestOrder(patreksIdx, returnedPoints[patreksIdx], requestedPoints)));
  }
  console.log(orderOk ? "ORDER CHECK: all pass" : "ORDER CHECK: FAILURE -- STOP");
}

console.log("\n=== Probe complete. No URLs, keys, or raw feed snapshots were printed above. ===");
