// Task-local, one-off script. Produces map-data.json for this round's own
// map-view.html -- never imported by production code. Reuses the real
// production loader + composer; only the native->WGS84 INVERSE transform
// is implemented here (standard Lambert Conformal Conic 2SP inverse, same
// parameters as every forward transform in this ticket).

import fs from "fs";
import path from "path";
import { loadWestfjordsIsafjordurHolmavikRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsIsafjordurHolmavikRegionDataset.js";
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
const rt = forward(-21.68, 65.705);
const back = inverse(rt.x, rt.y);
const rtErr = Math.hypot(back.lon - -21.68, back.lat - 65.705);
if (rtErr > 1e-9) throw new Error(`STOP: inverse transform round-trip error too large: ${rtErr}`);

const region = loadWestfjordsIsafjordurHolmavikRegionDataset();
const result = composeGeometryPath({
  crs: region.crs, tier: region.tier, lines: region.lines,
  from: { placeId: "isafjordur", x: region.isafjordur.endpoint.x, y: region.isafjordur.endpoint.y },
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

const isafjordurEndpointWgs84 = inverse(region.isafjordur.endpoint.x, region.isafjordur.endpoint.y);
const holmavikEndpointWgs84 = inverse(region.holmavik.endpoint.x, region.holmavik.endpoint.y);
const junctionJWgs84 = inverse(region.holmavik.junctionJ.x, region.holmavik.junctionJ.y);

const line3834 = linesById.get(3834);
const roundaboutMid = line3834.vertices[3];
const roundabout25602Wgs84 = inverse(roundaboutMid.x, roundaboutMid.y);

// Real, literal branch-point coordinates (owner-retained WGS84 GeoJSON,
// found by IDFERILL proximity to this chain's own vertices -- distDeg 0,
// i.e. a shared literal vertex). Advisory only (P9): never composed into
// any route, never a confirmed ID connection.
const BRANCH_POINTS = [
  { label: "Þorskafjarðarheiði (608)", lon: -22.14576269, lat: 65.75362939, note: "possible future connection, not confirmed" },
  { label: "Kollafjarðarheiði (F66)", lon: -22.43794116, lat: 65.82952371, note: "possible future connection, not confirmed" },
  { label: "Djúpvegur-Skjaldfönn (635)", lon: -22.31209055, lat: 65.89038911, note: "possible future connection, not confirmed" },
  { label: "Vestanverður Mjóifjörður (633)", lon: -22.58144263, lat: 65.93125312, note: "possible future connection, not confirmed" },
  { label: "Vatnsfjarðarnes (633)", lon: -22.48085914, lat: 65.93792167, note: "possible future connection, not confirmed" },
  { label: "634 (fjord name, not the town)", lon: -22.43319768, lat: 65.92462294, note: "possible future connection, not confirmed -- real name is also \"Djúpvegur: Ísafjörður\", the fjord, not the town" },
  { label: "Djúpvegur-Drangsnes (643)", lon: -21.78075697, lat: 65.76410683, note: "possible future connection, not confirmed" },
  { label: "Hrófá-Hólmavík (61, við J)", lon: -21.6952318, lat: 65.70152976, note: "possible future connection, not confirmed -- alternate approach near the Djúpvegur/Drangsnesvegur junction, not this pair's endpoint" },
  { label: "Tungudalur (60, Vestfjarðagöng)", lon: -23.17126853, lat: 66.05936295, note: "possible future connection, not confirmed" },
  { label: "Eyrarhlíð (61)", lon: -23.12399231, lat: 66.08035668, note: "possible future connection, not confirmed" },
];

const mapData = {
  route: routeCoordsWgs84,
  owners: {
    holmavik: { lon: -21.68, lat: 65.705, label: "Hólmavík (owner coordinate)" },
  },
  endpoints: {
    isafjordur: { ...isafjordurEndpointWgs84, label: "Ísafjörður (reused route endpoint -- 3834's own existing vertex 5)" },
    holmavik: { ...holmavikEndpointWgs84, label: "Hólmavík (route endpoint -- 3883's own existing vertex 3, byte-identical to places.json)" },
  },
  junctionJ: { ...junctionJWgs84, label: "Vegamót J (3347's own vertex 0) -- Djúpvegur/Drangsnesvegur junction, NOT this pair's endpoint" },
  roundabout25602: { ...roundabout25602Wgs84, label: "Vegamót/hringtorg 25602 (3834[2→4] fellur hér saman, sér merki)" },
  branchPoints: BRANCH_POINTS,
  lengthM: result.lengthM,
};

fs.writeFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/westfjords-holmavik-mvp/map-data.json"), JSON.stringify(mapData, null, 2));
console.log("wrote map-data.json, route points:", routeCoordsWgs84.length, "lengthM:", result.lengthM);
