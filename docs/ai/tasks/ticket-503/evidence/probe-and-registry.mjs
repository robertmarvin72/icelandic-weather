// Task-local, read-only script for ticket #503 (approved-prompt-v1.md
// P1/P2). Two independent jobs, run in sequence:
//
// (A) Computes WGS84 for the four B<->H forecast points via an OFFLINE
//     Lambert Conformal Conic 2SP inverse (same GRS80/Lambert parameters
//     used throughout this ticket series -- no new dependency, no
//     proj4), verifies each result against the prompt's own cited
//     reference values (<=1e-6 deg) and one independent anchor
//     (winter-route-approach-selections.json's own holmavik WGS84,
//     <=1e-7 deg), and verifies each native coordinate is a literal
//     vertex that exists in the REAL composed Búðardalur<->Hólmavík
//     geometry (ticket #501's own production core/loader, called
//     directly -- never re-implemented here).
//
// (B) Runs the ONE bounded real-network probe the approved prompt
//     authorizes BEFORE any implementation: fetchRoadSegments(7 ids),
//     fetchRoadPoints(7 ids), fetchWinterRouteForecast({forecastPoints:
//     these 4 points}) -- the exact existing production helpers, no new
//     fetch logic, no retries beyond what those helpers already do, no
//     host search. Only resolveWinterRouteForecastAuth()'s own boolean
//     is read for the key -- the key/URL/apikey value is never printed,
//     logged, or embedded in any output of this script.
//
// Run with: node docs/ai/tasks/ticket-503/evidence/probe-and-registry.mjs

import { composeGeometryPath } from "../../../../../api/_lib/winterRoute/geometryComposition.js";
import { loadWestfjordsCombinedRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsCombinedRegionDataset.js";
import { fetchRoadSegments, fetchRoadPoints } from "../../../../../api/_lib/winterRoute/roadFetch.js";
import { fetchWinterRouteForecast, resolveWinterRouteForecastAuth } from "../../../../../api/_lib/winterRoute/forecastFetch.js";
import { exportFreshness } from "../../../../../api/_lib/winterRoute/freshness.js";
import fs from "fs";
import path from "path";

// ---------- (A) WGS84 registry ----------

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

const POINTS = [
  { id: "budardalur-route", labelIs: "Búðardalur", labelEn: "Búðardalur", sourceId: 2769, vertexIndex: 3, x: 370289.3768328927, y: 515027.06854594796, z: 24.473128257522806,
    expected: { lat: 65.10937098, lon: -21.76193522 } },
  { id: "throskuldar-south-route", labelIs: "Þröskuldar — sunnanverð leið", labelEn: "Þröskuldar — south side", sourceId: 3321, vertexIndex: 0, x: 364140.5366828249, y: 556496.173523623, z: 42.058,
    expected: { lat: 65.47846693, lon: -21.93362908 } },
  { id: "throskuldar-pass-route", labelIs: "Þröskuldar", labelEn: "Þröskuldar", sourceId: 3321, vertexIndex: 47, x: 369201.2702005765, y: 564511.5852567125, z: 368.9358,
    expected: { lat: 65.55235160, lon: -21.83224971 } },
  { id: "holmavik-route", labelIs: "Hólmavík", labelEn: "Hólmavík", sourceId: 3883, vertexIndex: 3, x: 376742.4201551166, y: 580824.7020691019, z: 0,
    expected: { lat: 65.70146962, lon: -21.68414766 } },
];

const region = loadWestfjordsCombinedRegionDataset();
const allLines = [...region.lines, ...region.connectors];
const linesById = new Map(allLines.map((l) => [l.sourceId, l]));

console.log("=== (A) WGS84 registry + geometry/anchor cross-check ===");
const registry = [];
let allOk = true;
for (const p of POINTS) {
  const line = linesById.get(p.sourceId);
  const vertex = line.vertices[p.vertexIndex];
  const vertexOk = vertex.x === p.x && vertex.y === p.y;

  const wgs = inverse(p.x, p.y);
  const diffLat = Math.abs(wgs.lat - p.expected.lat);
  const diffLon = Math.abs(wgs.lon - p.expected.lon);
  const withinTolerance = diffLat <= 1e-6 && diffLon <= 1e-6;

  console.log(`${p.id}: vertex match=${vertexOk}, computed=(${wgs.lat.toFixed(8)},${wgs.lon.toFixed(8)}), expected=(${p.expected.lat},${p.expected.lon}), diff=(${diffLat.toExponential(2)},${diffLon.toExponential(2)}), within 1e-6=${withinTolerance}`);
  if (!vertexOk || !withinTolerance) allOk = false;

  registry.push({
    id: p.id, labelIs: p.labelIs, labelEn: p.labelEn,
    sourceId: p.sourceId, vertexIndex: p.vertexIndex,
    native: { x: p.x, y: p.y, z: p.z, crs: region.crs },
    wgs84: { latitude: wgs.lat, longitude: wgs.lon, crs: "EPSG:4326" },
    regionVersion: region.regionVersion,
    method: "offline Lambert Conformal Conic 2SP inverse (GRS80, same parameters as ticket #501's own build scripts), computed in docs/ai/tasks/ticket-503/evidence/probe-and-registry.mjs",
  });
}

// Independent anchor: holmavik-route vs winter-route-approach-selections.json
const approachSelections = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server_data/winter-route-approach-selections.json"), "utf8"));
const holmavikAnchor = approachSelections.selections.holmavik.wgs84;
const holmavikComputed = registry.find((r) => r.id === "holmavik-route").wgs84;
const anchorDiffLat = Math.abs(holmavikComputed.latitude - holmavikAnchor.latitude);
const anchorDiffLon = Math.abs(holmavikComputed.longitude - holmavikAnchor.longitude);
const anchorOk = anchorDiffLat <= 1e-7 && anchorDiffLon <= 1e-7;
console.log(`holmavik-route independent anchor (winter-route-approach-selections.json): diff=(${anchorDiffLat.toExponential(2)},${anchorDiffLon.toExponential(2)}), within 1e-7=${anchorOk}`);
if (!anchorOk) allOk = false;

// Geometry membership: compose the real B->H route and confirm each point's
// own native x/y appears as a literal coordinate.
const budardalur = region.endpoints.budardalur, holmavik = region.endpoints.holmavik;
const result = composeGeometryPath({
  crs: region.crs, tier: region.tier, lines: allLines,
  from: { placeId: "budardalur", x: budardalur.x, y: budardalur.y },
  to: { placeId: "holmavik", x: holmavik.x, y: holmavik.y },
});
console.log(`B->H compose: status=${result.status}, lengthM=${result.lengthM}, slices=${result.slices.length}`);
if (result.status !== "geometry_only") allOk = false;

function expandSliceVertices(slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex), hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}
const allCoords = [];
result.slices.forEach((slice, i) => {
  const verts = expandSliceVertices(slice);
  for (let j = i === 0 ? 0 : 1; j < verts.length; j++) allCoords.push(verts[j]);
});
for (const p of POINTS) {
  const onRoute = allCoords.some((c) => c.x === p.x && c.y === p.y);
  console.log(`${p.id} present in composed B->H coordinates: ${onRoute}`);
  if (!onRoute) allOk = false;
}

// IdButur extraction from real slices (n:1, first-occurrence order).
const idButurIds = [];
for (const s of result.slices) {
  if (s.idbutur == null) continue;
  if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
}
console.log("idButurIds (B->H, from real slices):", JSON.stringify(idButurIds));

const EXPECTED_IDBUTUR = [805030037, 905070037, 905080037, 805090037, 907000037, 707040037, 907040037];
const idButurMatches = JSON.stringify(idButurIds) === JSON.stringify(EXPECTED_IDBUTUR);
console.log("matches prompt's own 7-id list:", idButurMatches);
if (!idButurMatches) allOk = false;

// routeLengthM per IdButur (summed slice lengths).
const lengthByIdButur = new Map();
for (const s of result.slices) {
  if (s.idbutur == null) continue;
  lengthByIdButur.set(s.idbutur, (lengthByIdButur.get(s.idbutur) ?? 0) + s.lengthM);
}
console.log("per-IdButur routeLengthM:", JSON.stringify(Object.fromEntries(lengthByIdButur), null, 2));
const totalLength = [...lengthByIdButur.values()].reduce((a, b) => a + b, 0);
console.log("sum of per-IdButur lengths:", totalLength, "vs result.lengthM:", result.lengthM);

console.log(`\n=== Registry (for a small server-side registry file) ===`);
console.log(JSON.stringify(registry, null, 2));

console.log(`\n=== (A) overall: ${allOk ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED -- STOP"} ===`);

if (!allOk) {
  console.log("STOPPING before (B) network probe -- P2(d)/STOP rule: coordinate/route-binding mismatch found.");
  process.exit(1);
}

// ---------- (B) real bounded network probe ----------

console.log("\n=== (B) real bounded network probe (P1) ===");

const auth = resolveWinterRouteForecastAuth();
console.log("forecast auth available (boolean only, never the key itself):", auth.available);

const UPSTREAM_FETCH_OPTIONS = { timeoutMs: 15000, maxBytes: 2 * 1024 * 1024 };
const now = new Date();

const [segmentsResult, pointsResult] = await Promise.all([
  fetchRoadSegments(EXPECTED_IDBUTUR, UPSTREAM_FETCH_OPTIONS),
  fetchRoadPoints(EXPECTED_IDBUTUR, UPSTREAM_FETCH_OPTIONS),
]);

console.log("segments fetch ok:", segmentsResult.ok, segmentsResult.ok ? "" : `reason=${segmentsResult.reason}`);
if (segmentsResult.ok) {
  const exp = exportFreshness(segmentsResult.feedDagsKeyrtUt, now);
  const found = segmentsResult.rows.filter((r) => r.found).length;
  const ambiguous = segmentsResult.rows.filter((r) => r.ambiguous).length;
  console.log(`  feedDagsKeyrtUt=${segmentsResult.feedDagsKeyrtUt} ageMinutes=${exp.ageMinutes?.toFixed(1)} isStale=${exp.isStale}`);
  console.log(`  found=${found}/${EXPECTED_IDBUTUR.length} ambiguous=${ambiguous}`);
  for (const row of segmentsResult.rows) {
    console.log(`  idButur=${row.idButur} found=${row.found} ambiguous=${!!row.ambiguous} astandYfirbord=${row.astandYfirbord ?? "(n/a)"}`);
  }
}

console.log("points fetch ok:", pointsResult.ok, pointsResult.ok ? "" : `reason=${pointsResult.reason}`);
if (pointsResult.ok) {
  const exp = exportFreshness(pointsResult.feedDagsKeyrtUt, now);
  const relevantNotices = pointsResult.points.filter((p) => EXPECTED_IDBUTUR.includes(p.idButur));
  console.log(`  feedDagsKeyrtUt=${pointsResult.feedDagsKeyrtUt} ageMinutes=${exp.ageMinutes?.toFixed(1)} isStale=${exp.isStale}`);
  console.log(`  notices for our 7 IdButur: ${relevantNotices.length}`);
  for (const n of relevantNotices) {
    const until = n.gildirTil;
    console.log(`  idButur=${n.idButur} astand=${n.astand} gildirTil=${until ?? "(none)"}`);
  }
}

if (!auth.available) {
  console.log("\nkey_missing -- STOP on forecast portion per P1(c). Road portion above still real/complete.");
} else {
  const forecastPoints = registry.map((r) => ({ id: r.id, lat: r.wgs84.latitude, lon: r.wgs84.longitude, labelIs: r.labelIs, labelEn: r.labelEn, nearIdButur: null, approxDistanceFromStartKm: null }));
  const forecastResult = await fetchWinterRouteForecast({ now, fetchOptions: UPSTREAM_FETCH_OPTIONS, forecastPoints });
  console.log("forecast fetch ok:", forecastResult.ok, forecastResult.ok ? "" : `reason=${forecastResult.reason}`);
  if (forecastResult.ok) {
    console.log(`  window startHour=${forecastResult.window.startHour} endHour=${forecastResult.window.endHour} hours=${forecastResult.window.expectedHours.length}`);
    forecastResult.points.forEach((pt, i) => {
      if (!pt.ok) {
        console.log(`  point[${i}]=${forecastPoints[i].id} FAILED reason=${pt.reason}`);
      } else {
        const zForPoint = POINTS[i].z;
        const elevDiff = Math.abs(pt.elevation - zForPoint);
        console.log(`  point[${i}]=${forecastPoints[i].id} returnedLat=${pt.latitude} returnedLon=${pt.longitude} elevation=${pt.elevation} routeZ=${zForPoint} diff=${elevDiff.toFixed(1)}m`);
      }
    });
  }

  // Reverse-order validation (H->B), per P1(d): reuse the SAME already-
  // fetched/parsed result, reversed offline -- no second upstream request.
  if (forecastResult.ok) {
    const reversedRequested = [...forecastPoints].reverse();
    const reversedResultPoints = [...forecastResult.points].reverse();
    console.log("\n  reverse-order (H->B) cross-check, using the SAME already-fetched data, offline:");
    reversedResultPoints.forEach((pt, i) => {
      const expectedId = reversedRequested[i].id;
      console.log(`  reversed[${i}] expectedId=${expectedId} ok=${pt.ok}`);
    });
  }
}

console.log("\n=== Probe complete. No URLs, keys, or raw feed snapshots were printed above. ===");
