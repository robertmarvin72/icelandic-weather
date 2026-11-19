// Task-local, one-off script. Produces map-data.json for this round's own
// map-view.html -- never imported by production code. Reuses the real
// production loader + composer; only the native->WGS84 INVERSE transform
// is implemented here (standard Lambert Conformal Conic 2SP inverse, same
// parameters as every forward transform in this ticket).

import fs from "fs";
import path from "path";
import { loadWestfjordsRoad68HolmavikRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.js";
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

function forward(lonDeg, latDeg) {
  const lon = (lonDeg * Math.PI) / 180, lat = (latDeg * Math.PI) / 180;
  const t = tFunc(lat), rho = A * FF * t ** N, theta = N * (lon - LON0);
  return { x: X0 + rho * Math.sin(theta), y: Y0 + RHO0 - rho * Math.cos(theta) };
}
const rt = forward(-21.094, 65.153);
const back = inverse(rt.x, rt.y);
const rtErr = Math.hypot(back.lon - -21.094, back.lat - 65.153);
if (rtErr > 1e-9) throw new Error(`STOP: inverse transform round-trip error too large: ${rtErr}`);

const region = loadWestfjordsRoad68HolmavikRegionDataset();
const result = composeGeometryPath({
  crs: region.crs, tier: region.tier, lines: region.lines,
  from: { placeId: "junction", x: region.junction.endpoint.x, y: region.junction.endpoint.y },
  to: { placeId: "holmavik", x: region.holmavik.endpoint.x, y: region.holmavik.endpoint.y },
});
if (result.status !== "geometry_only") throw new Error(`STOP: unexpected composition status ${result.status}`);

const linesById = new Map(region.lines.map((l) => [l.sourceId, l]));
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

const junctionEndpointWgs84 = inverse(region.junction.endpoint.x, region.junction.endpoint.y);
const holmavikEndpointWgs84 = inverse(region.holmavik.endpoint.x, region.holmavik.endpoint.y);
const ownerHrutafjordurWgs84 = inverse(region.junction.ownerReference.x, region.junction.ownerReference.y);

// Real, literal branch-point coordinates (owner-retained WGS84 GeoJSON).
// Advisory only (P9): never composed into any route, never a confirmed ID
// connection.
const geojson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson"), "utf8"));
const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));

const line1720 = linesById.get(1720);
const laxardalsheidiWgs84 = inverse(line1720.vertices[9].x, line1720.vertices[9].y);

const f3324 = byId.get(3324);
const threskuldarPoint = f3324.geometry.coordinates[f3324.geometry.coordinates.length - 1];

const f3347 = byId.get(3347);
const jPoint = f3347.geometry.coordinates[0];

const BRANCH_POINTS = [
  { label: "Hringvegur 1 (1481/3828, við vegamótin)", lon: junctionEndpointWgs84.lon, lat: junctionEndpointWgs84.lat, note: "possible future connection, not confirmed -- same point as this pair's own junction endpoint, shown here only as the Hringvegur context" },
  { label: "Laxárdalsheiði (59, við 1720 hnút 9)", ...laxardalsheidiWgs84, note: "possible future connection, not confirmed -- the heiði itself is on vegur 59, not travelled by this pair" },
  { label: "Þröskuldar (3324, við 2690 hnút 74)", lon: threskuldarPoint[0], lat: threskuldarPoint[1], note: "possible future connection, not confirmed" },
  { label: "Djúpvegur 3347 (J, við 3611/3883 vegamót)", lon: jPoint[0], lat: jPoint[1], note: "possible future connection, not confirmed -- J is an internal node of THIS pair's own route (3611->3883), not a separate endpoint" },
];

const mapData = {
  route: routeCoordsWgs84,
  owners: {
    holmavik: { lon: -21.68, lat: 65.705, label: "Hólmavík (owner coordinate)" },
    hrutafjordur: { ...ownerHrutafjordurWgs84, label: "Hrútafjörður (owner reference point, map-only, never this pair's endpoint)" },
  },
  endpoints: {
    junction: { ...junctionEndpointWgs84, label: "junction-1-68-stadarskali (1796's own vertex 0 -- the real Hringvegur(1)/vegur 68 junction)" },
    holmavik: { ...holmavikEndpointWgs84, label: "Hólmavík (route endpoint -- 3883's own existing vertex 3, byte-identical to places.json)" },
  },
  branchPoints: BRANCH_POINTS,
  lengthM: result.lengthM,
};

fs.writeFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/westfjords-road68-mvp/map-data.json"), JSON.stringify(mapData, null, 2));
console.log("wrote map-data.json, route points:", routeCoordsWgs84.length, "lengthM:", result.lengthM);
