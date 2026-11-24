// Task-local, read-only script for ticket #503 westfjords-completion
// (approved-prompt-v1.md P1/P2). Independently (re-)derives everything
// this round needs, never trusting the prompt/Jonesy's own cited sandbox
// numbers blindly -- used to cross-check them and to save the required
// evidence/probe-output.json (P1b).
//
// (A) WGS84 for the 6 new points (+ the 12 already-registered points reused
//     unchanged from budardalurHolmavikRoute.js/westfjordsBatchRoute.js)
//     via the same offline Lambert Conformal Conic 2SP inverse used
//     throughout this ticket series.
// (B) Per-pair (8 new pairs, 16 directions) real composed geometry via the
//     real production core, confirming lengths/slices/geometryId/IdButur.
// (C) Per-pair point membership + chainage order, computed DYNAMICALLY
//     (coordinate presence in the composed route, ordered by position in
//     the coordinate chain) -- never a hardcoded per-pair table. Includes
//     the P3(a) throskuldar-guard: those two points only count as "on
//     route" if the route's own IdButur list actually includes 907000037
//     (not merely because their native coordinate happens to be a shared
//     endpoint vertex with other lines).
// (D) The ONE bounded real-network probe this round authorizes before
//     implementation: fetchRoadSegments/fetchRoadPoints for the union of
//     41 IdButur, ONE fetchWinterRouteForecast batch for the 18 unique
//     points, plus the P1(c) ordering-margin check for all 16 directions
//     on PRODUCTION subsets (not the full 18-point union), offline,
//     reusing the same already-fetched forecast response (no second
//     request).
//
// Run with: node --env-file=.env.local --env-file=.env.development.local
//   docs/ai/tasks/ticket-503/westfjords-completion/evidence/probe-and-registry.mjs

import fs from "fs";
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

// 12 already-registered points (reused unchanged) + 6 new (P2(B) decision:
// sudavikurhlid-route = 3535v0, not 3392v2).
const EXISTING_POINTS = [
  { id: "budardalur-route", sourceId: 2769, vertexIndex: 3 },
  { id: "throskuldar-south-route", sourceId: 3321, vertexIndex: 0 },
  { id: "throskuldar-pass-route", sourceId: 3321, vertexIndex: 47 },
  { id: "holmavik-route", sourceId: 3883, vertexIndex: 3 },
  { id: "flokalundur-route", sourceId: 3648, vertexIndex: 50 },
  { id: "patreksfjordur-route", sourceId: 53127, vertexIndex: 7 },
  { id: "talknafjordur-route", sourceId: 2889, vertexIndex: 12 },
  { id: "svinadalur-route", sourceId: 3247, vertexIndex: 28 },
  { id: "gilsfjordur-route", sourceId: 3460, vertexIndex: 7 },
  { id: "klettshals-route", sourceId: 3672, vertexIndex: 36 },
  { id: "kleifaheidi-route", sourceId: 3332, vertexIndex: 31 },
  { id: "miklidalur-route", sourceId: 3361, vertexIndex: 21 },
];
const NEW_POINTS = [
  { id: "isafjordur-route", sourceId: 3834, vertexIndex: 5 },
  { id: "dynjandisheidi-route", sourceId: 3008, vertexIndex: 20 },
  { id: "gemlufallsheidi-route", sourceId: 2993, vertexIndex: 5 },
  { id: "sudavikurhlid-route", sourceId: 3535, vertexIndex: 0 }, // P2(B)
  { id: "vatnsfjardarhals-route", sourceId: 3148, vertexIndex: 14 },
  { id: "steingrimsfjardarheidi-route", sourceId: 3415, vertexIndex: 18 },
];
const THROSKULDAR_IDS = new Set(["throskuldar-south-route", "throskuldar-pass-route"]);

console.log("=== (A) WGS84 for all 18 union points ===");
const registry = [];
for (const p of [...EXISTING_POINTS, ...NEW_POINTS]) {
  const line = linesById.get(p.sourceId);
  const vertex = line.vertices[p.vertexIndex];
  const wgs = inverse(vertex.x, vertex.y);
  registry.push({ ...p, x: vertex.x, y: vertex.y, z: vertex.z, lat: wgs.lat, lon: wgs.lon, name: line.name });
  console.log(`${p.id}: sourceId=${p.sourceId} v${p.vertexIndex} x=${vertex.x} y=${vertex.y} z=${vertex.z} lat=${wgs.lat.toFixed(8)} lon=${wgs.lon.toFixed(8)}`);
}
const registryById = new Map(registry.map((p) => [p.id, p]));

console.log("\n=== (B)/(C) eight new pairs, sixteen directions, real composed geometry ===");
const PAIRS = [
  ["budardalur", "isafjordur"], ["flokalundur", "isafjordur"], ["isafjordur", "holmavik"],
  ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"], ["flokalundur", "holmavik"],
  ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"],
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

    const idButurOrder = [];
    const lengthByIdButur = new Map();
    for (const slice of result.slices) {
      if (slice.idbutur == null) continue;
      if (idButurOrder[idButurOrder.length - 1] !== slice.idbutur) idButurOrder.push(slice.idbutur);
      lengthByIdButur.set(slice.idbutur, (lengthByIdButur.get(slice.idbutur) ?? 0) + slice.lengthM);
    }
    const hasThroskuldarSection = idButurOrder.includes(907000037);

    const allCoords = [];
    const cumulativeM = [0];
    result.slices.forEach((slice, i) => {
      const verts = expandSliceVertices(slice);
      for (let j = i === 0 ? 0 : 1; j < verts.length; j++) {
        allCoords.push(verts[j]);
        const prev = allCoords[allCoords.length - 2] ?? verts[j];
        const segLen = Math.hypot(verts[j].x - prev.x, verts[j].y - prev.y);
        cumulativeM.push(cumulativeM[cumulativeM.length - 1] + segLen);
      }
    });

    // Dynamic membership + chainage order, with the P3(a) throskuldar
    // guard: those two points only count if the route has a real
    // 907000037 section, never merely from a shared endpoint vertex.
    const onRoute = [];
    for (const p of registry) {
      if (THROSKULDAR_IDS.has(p.id) && !hasThroskuldarSection) continue;
      const idx = allCoords.findIndex((c) => c.x === p.x && c.y === p.y);
      if (idx !== -1) onRoute.push({ id: p.id, idx });
    }
    onRoute.sort((x, y) => x.idx - y.idx);

    const pointChainageKm = {};
    for (const o of onRoute) pointChainageKm[o.id] = cumulativeM[o.idx + 1] / 1000;

    const unmappedLengthM = result.slices.filter((s) => s.idbutur == null).reduce((sum, s) => sum + s.lengthM, 0);
    const nullIds = [...new Set(result.slices.filter((s) => s.sourceId < 0).map((s) => s.sourceId))];

    pairResults[`${from}|${to}`] = {
      geometryId: result.geometryId, lengthM: result.lengthM, idButurOrder, unmappedLengthM, nullIds,
      points: onRoute.map((o) => o.id), pointChainageKm,
    };
    console.log(`${from}->${to}: geometryId=${result.geometryId} lengthM=${result.lengthM.toFixed(3)} slices=${result.slices.length} idButur=${idButurOrder.length} points=[${onRoute.map((o) => o.id).join(",")}] unmappedLengthM=${unmappedLengthM.toFixed(4)} nullIds=[${nullIds.join(",")}]`);
  }
}
if (!allOk) { console.log("STOP: a pair failed to compose."); process.exit(1); }

console.log("\n=== Union IdButur / union points across all 8 pairs ===");
const unionIdButur = new Set();
const unionPoints = new Set();
for (const [a, b] of PAIRS) {
  for (const id of pairResults[`${a}|${b}`].idButurOrder) unionIdButur.add(id);
  for (const pid of pairResults[`${a}|${b}`].points) unionPoints.add(pid);
}
console.log(`union IdButur size: ${unionIdButur.size}`);
console.log(`union point size: ${unionPoints.size}`, JSON.stringify([...unionPoints]));

// ---------- (D) real bounded network probe ----------
console.log("\n=== (D) real bounded network probe (P1) ===");
const probeOutput = { generatedAt: new Date().toISOString(), calls: [] };

const auth = resolveWinterRouteForecastAuth();
console.log("forecast auth available (boolean only):", auth.available);
probeOutput.forecastAuthAvailable = auth.available;

const UPSTREAM_FETCH_OPTIONS = { timeoutMs: 15000, maxBytes: 2 * 1024 * 1024 };
const unionIdButurList = [...unionIdButur];
console.log("union IdButur count:", unionIdButurList.length);

const now = new Date();
const [segmentsResult, pointsResult] = await Promise.all([
  fetchRoadSegments(unionIdButurList, UPSTREAM_FETCH_OPTIONS),
  fetchRoadPoints(unionIdButurList, UPSTREAM_FETCH_OPTIONS),
]);

console.log("segments ok:", segmentsResult.ok, segmentsResult.ok ? "" : segmentsResult.reason);
const segmentsCall = { call: "fetchRoadSegments", ok: segmentsResult.ok, timestamp: now.toISOString() };
if (segmentsResult.ok) {
  const exp = exportFreshness(segmentsResult.feedDagsKeyrtUt, now);
  const found = segmentsResult.rows.filter((r) => r.found).length;
  const ambiguous = segmentsResult.rows.filter((r) => r.ambiguous).length;
  const missing = segmentsResult.rows.filter((r) => !r.found).map((r) => r.idButur);
  console.log(`  feedDagsKeyrtUt=${segmentsResult.feedDagsKeyrtUt} ageMinutes=${exp.ageMinutes?.toFixed(1)} isStale=${exp.isStale} found=${found}/${unionIdButurList.length} ambiguous=${ambiguous}`);
  for (const id of missing) console.log(`  MISSING idButur=${id}`);
  Object.assign(segmentsCall, {
    feedDagsKeyrtUt: segmentsResult.feedDagsKeyrtUt, ageMinutes: exp.ageMinutes, isStale: exp.isStale,
    totalRequested: unionIdButurList.length, found, ambiguous, missing,
  });
} else {
  segmentsCall.reason = segmentsResult.reason;
}
probeOutput.calls.push(segmentsCall);

console.log("points ok:", pointsResult.ok, pointsResult.ok ? "" : pointsResult.reason);
const pointsCall = { call: "fetchRoadPoints", ok: pointsResult.ok, timestamp: now.toISOString() };
if (pointsResult.ok) {
  const exp = exportFreshness(pointsResult.feedDagsKeyrtUt, now);
  const relevant = pointsResult.points.filter((p) => unionIdButurList.includes(p.idButur));
  console.log(`  feedDagsKeyrtUt=${pointsResult.feedDagsKeyrtUt} ageMinutes=${exp.ageMinutes?.toFixed(1)} isStale=${exp.isStale} notices=${relevant.length}`);
  for (const n of relevant) console.log(`  idButur=${n.idButur} astand=${n.astand} gildirTil=${n.gildirTil ?? "(none)"}`);
  Object.assign(pointsCall, {
    feedDagsKeyrtUt: pointsResult.feedDagsKeyrtUt, ageMinutes: exp.ageMinutes, isStale: exp.isStale,
    noticeCount: relevant.length,
    notices: relevant.map((n) => ({ idButur: n.idButur, astand: n.astand, gildirTilKnown: n.gildirTil != null })),
  });
} else {
  pointsCall.reason = pointsResult.reason;
}
probeOutput.calls.push(pointsCall);

if (!auth.available) {
  console.log("\nkey_missing -- STOP on forecast portion per P1. Road portion above still real/complete.");
  probeOutput.forecastCall = { call: "fetchWinterRouteForecast", ok: false, reason: "key_missing" };
  fs.writeFileSync(new URL("./probe-output.json", import.meta.url), JSON.stringify(probeOutput, null, 2));
  process.exit(0);
}

const forecastPoints = registry.map((r) => ({ id: r.id, lat: r.lat, lon: r.lon, labelIs: r.id, labelEn: r.id }));
const forecastResult = await fetchWinterRouteForecast({ now, fetchOptions: UPSTREAM_FETCH_OPTIONS, forecastPoints });
console.log("forecast ok:", forecastResult.ok, forecastResult.ok ? "" : forecastResult.reason);
const forecastCall = { call: "fetchWinterRouteForecast", ok: forecastResult.ok, timestamp: now.toISOString(), requestedPointCount: forecastPoints.length };
if (forecastResult.ok) {
  console.log(`  window startHour=${forecastResult.window.startHour} endHour=${forecastResult.window.endHour} hours=${forecastResult.window.expectedHours.length}`);
  forecastCall.window = forecastResult.window;
  forecastCall.points = [];
  forecastResult.points.forEach((pt, i) => {
    const p = registry[i];
    if (!pt.ok) {
      console.log(`  point[${i}]=${p.id} FAILED reason=${pt.reason}`);
      forecastCall.points.push({ id: p.id, ok: false, reason: pt.reason });
      return;
    }
    const snapKm = haversineKm({ lat: p.lat, lon: p.lon }, { lat: pt.latitude, lon: pt.longitude });
    console.log(`  point[${i}]=${p.id} returnedLat=${pt.latitude} returnedLon=${pt.longitude} snapKm=${snapKm.toFixed(3)} elevation=${pt.elevation} nativeZ=${p.z}`);
    forecastCall.points.push({
      id: p.id, ok: true,
      requestedLat: p.lat, requestedLon: p.lon,
      returnedLat: pt.latitude, returnedLon: pt.longitude,
      snapKm, returnedElevation: pt.elevation, nativeZ: p.z,
    });
  });
} else {
  forecastCall.reason = forecastResult.reason;
}
probeOutput.forecastCall = forecastCall;

// ---------- P1(c): ordering margin for all 16 directions on PRODUCTION subsets ----------
if (forecastResult.ok) {
  console.log("\n=== P1(c) ordering margin (offline, same already-fetched response, production subsets) ===");
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
  const orderResults = [];
  for (const [a, b] of PAIRS) {
    for (const [from, to] of [[a, b], [b, a]]) {
      const pts = pairResults[`${from}|${to}`].points;
      for (const pid of pts) {
        const idx = registry.findIndex((r) => r.id === pid);
        if (returnedPoints[idx] == null) continue;
        const check = isInRequestOrder(idx, returnedPoints[idx], requestedPoints);
        orderResults.push({ from, to, point: pid, ...check });
        if (!check.ok) { console.log(`  ORDER_MISMATCH ${from}->${to} point=${pid}`); orderOk = false; }
      }
    }
  }
  console.log(orderOk ? "ORDER CHECK (production subsets): all pass" : "ORDER CHECK: FAILURE -- STOP");
  probeOutput.orderCheck = { ok: orderOk, results: orderResults };

  // Tightest margins specifically called out in the prompt.
  const isafjordurIdx = registry.findIndex((r) => r.id === "isafjordur-route");
  const sudavikurhlidIdx = registry.findIndex((r) => r.id === "sudavikurhlid-route");
  if (returnedPoints[isafjordurIdx] && returnedPoints[sudavikurhlidIdx]) {
    const check = isInRequestOrder(isafjordurIdx, returnedPoints[isafjordurIdx], requestedPoints);
    console.log("  isafjordur<->sudavikurhlid check (isafjordur's own margin):", JSON.stringify(check));
    probeOutput.tightestMarginCheck = check;
  }
}

fs.writeFileSync(new URL("./probe-output.json", import.meta.url), JSON.stringify(probeOutput, null, 2));
console.log("\nSaved evidence/probe-output.json.");
console.log("=== Probe complete. No URLs, keys, or raw feed snapshots were printed above. ===");
