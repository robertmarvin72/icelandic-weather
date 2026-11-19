// Task-local, one-off script. Produces map-data.json for this round's own
// map-view.html -- never imported by production code. Reuses the real
// production loader + composer (no re-implementation of routing logic);
// only the native->WGS84 INVERSE transform is implemented here (standard
// Lambert Conformal Conic 2SP inverse, same parameters as every forward
// transform in this ticket), since the production runtime never needs to
// go native->WGS84 itself.

import fs from "fs";
import path from "path";
import { loadWestfjordsFlokalundurRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsFlokalundurRegionDataset.js";
import { composeGeometryPath } from "../../../../../api/_lib/winterRoute/geometryComposition.js";

const A = 6378137.0, F_ELL = 1 / 298.257222101, E2 = F_ELL * (2 - F_ELL), E = Math.sqrt(E2);
const LAT0 = (65 * Math.PI) / 180, LON0 = (-19 * Math.PI) / 180, LAT1 = (64.25 * Math.PI) / 180, LAT2 = (65.75 * Math.PI) / 180;
const X0 = 500000, Y0 = 500000;
function mFunc(phi) { return Math.cos(phi) / Math.sqrt(1 - E2 * Math.sin(phi) ** 2); }
function tFunc(phi) { const s = Math.sin(phi); return Math.tan(Math.PI / 4 - phi / 2) / ((1 - E * s) / (1 + E * s)) ** (E / 2); }
const m1 = mFunc(LAT1), m2 = mFunc(LAT2), t0 = tFunc(LAT0), t1 = tFunc(LAT1), t2 = tFunc(LAT2);
const N = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
const FF = m1 / (N * t1 ** N);
const RHO0 = A * FF * t0 ** N;

function inverse(x, y) {
  const dx = x - X0;
  const dy = RHO0 - (y - Y0);
  const rho = Math.sign(N) * Math.hypot(dx, dy);
  const theta = Math.atan2(dx, dy) / N;
  const t = (rho / (A * FF)) ** (1 / N);
  let phi = Math.PI / 2 - 2 * Math.atan(t);
  for (let i = 0; i < 10; i++) {
    const s = Math.sin(phi);
    phi = Math.PI / 2 - 2 * Math.atan(t * (((1 - E * s) / (1 + E * s)) ** (E / 2)));
  }
  const lon = theta + LON0;
  return { lon: (lon * 180) / Math.PI, lat: (phi * 180) / Math.PI };
}

// Round-trip sanity check against the already-validated forward transform.
function forward(lonDeg, latDeg) {
  const lon = (lonDeg * Math.PI) / 180, lat = (latDeg * Math.PI) / 180;
  const t = tFunc(lat), rho = A * FF * t ** N, theta = N * (lon - LON0);
  return { x: X0 + rho * Math.sin(theta), y: Y0 + RHO0 - rho * Math.cos(theta) };
}
const rt = forward(-23.163, 65.576);
const back = inverse(rt.x, rt.y);
const rtErr = Math.hypot(back.lon - -23.163, back.lat - 65.576);
if (rtErr > 1e-9) throw new Error(`STOP: inverse transform round-trip error too large: ${rtErr}`);

const region = loadWestfjordsFlokalundurRegionDataset();
const flkLines = [...region.lines, region.connector];
const result = composeGeometryPath({
  crs: region.crs, tier: region.tier, lines: flkLines,
  from: { placeId: "budardalur", x: region.budardalur.insertedNode.x, y: region.budardalur.insertedNode.y },
  to: { placeId: "flokalundur", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
});
if (result.status !== "geometry_only") throw new Error(`STOP: unexpected composition status ${result.status}`);

const linesById = new Map(flkLines.map((l) => [l.sourceId, l]));
function expandSliceVertices(slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex);
  const hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}
const routeCoordsNative = [];
result.slices.forEach((slice, i) => {
  const verts = expandSliceVertices(slice);
  const startAt = i === 0 ? 0 : 1;
  for (let j = startAt; j < verts.length; j++) routeCoordsNative.push(verts[j]);
});
const routeCoordsWgs84 = routeCoordsNative.map((v) => inverse(v.x, v.y));

const connectorWgs84 = region.connector.vertices.map((v) => inverse(v.x, v.y));
const flokalundurInsertedWgs84 = inverse(region.flokalundur.insertedNode.x, region.flokalundur.insertedNode.y);
const budardalurInsertedWgs84 = inverse(region.budardalur.insertedNode.x, region.budardalur.insertedNode.y);
const junction6062Wgs84 = inverse(region.flokalundur.junction6062.x, region.flokalundur.junction6062.y);

// Real, literal branch-point coordinates (owner-retained WGS84 GeoJSON,
// found by IDFERILL proximity to this chain's own vertices -- distDeg 0,
// i.e. a shared literal vertex, never an invented tie-in). Advisory only:
// never composed into any route, never a confirmed ID connection (P7).
const BRANCH_POINTS = [
  { label: "Þröskuldar (vegur 61)", lon: -21.93362908, lat: 65.47846693, note: "possible future connection, not confirmed" },
  { label: "Reykhólasveitarvegur (607)", lon: -22.09906388, lat: 65.54775952, note: "possible future connection, not confirmed" },
  { label: "Þorskafjörður A (608)", lon: -22.1366495, lat: 65.56243085, note: "possible future connection, not confirmed" },
  { label: "Kollafjarðarheiði (F66)", lon: -22.54281255, lat: 65.6453941, note: "possible future connection, not confirmed" },
  { label: "Vegamót 60/62", lon: junction6062Wgs84.lon, lat: junction6062Wgs84.lat, note: "possible future connection, not confirmed -- 346.8 m beyond the Flókalundur endpoint used by this pair" },
];

const mapData = {
  route: routeCoordsWgs84,
  connector: connectorWgs84,
  owners: {
    budardalur: { lon: -21.765, lat: 65.11, label: "Búðardalur (owner coordinate)" },
    flokalundur: { lon: -23.163, lat: 65.576, label: "Flókalundur (owner coordinate)" },
  },
  inserted: {
    budardalur: { ...budardalurInsertedWgs84, label: "Búðardalur (route endpoint, inserted on 2769)" },
    flokalundur: { ...flokalundurInsertedWgs84, label: "Flókalundur (route endpoint, inserted on 3648)" },
  },
  branchPoints: BRANCH_POINTS,
  lengthM: result.lengthM,
  estimatedConnectorLengthM: result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0),
};

fs.writeFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/westfjords-flokalundur-mvp/map-data.json"), JSON.stringify(mapData, null, 2));
console.log("wrote map-data.json, route points:", routeCoordsWgs84.length, "lengthM:", result.lengthM);
