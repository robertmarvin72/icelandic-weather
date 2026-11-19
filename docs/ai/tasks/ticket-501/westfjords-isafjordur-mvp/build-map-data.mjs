// Task-local, one-off script. Produces map-data.json for this round's own
// map-view.html -- never imported by production code. Reuses the real
// production loader + composer; only the native->WGS84 INVERSE transform
// is implemented here (standard Lambert Conformal Conic 2SP inverse, same
// parameters as every forward transform in this ticket).

import fs from "fs";
import path from "path";
import { loadWestfjordsFlokalundurIsafjordurRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsFlokalundurIsafjordurRegionDataset.js";
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
const rt = forward(-23.121, 66.074);
const back = inverse(rt.x, rt.y);
const rtErr = Math.hypot(back.lon - -23.121, back.lat - 66.074);
if (rtErr > 1e-9) throw new Error(`STOP: inverse transform round-trip error too large: ${rtErr}`);

const region = loadWestfjordsFlokalundurIsafjordurRegionDataset();
const result = composeGeometryPath({
  crs: region.crs, tier: region.tier, lines: region.lines,
  from: { placeId: "flokalundur", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
  to: { placeId: "isafjordur", x: region.isafjordur.endpoint.x, y: region.isafjordur.endpoint.y },
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
const tunnelSegments = { dyrafjardargong: [], vestfjardagong: [] };
result.slices.forEach((slice, i) => {
  const verts = expandSliceVertices(slice);
  const startAt = i === 0 ? 0 : 1;
  const sliceCoords = [];
  for (let j = startAt; j < verts.length; j++) {
    routeCoordsNative.push(verts[j]);
    sliceCoords.push(verts[j]);
  }
  if (slice.sourceId === 38087) tunnelSegments.dyrafjardargong.push(...verts);
  if (slice.sourceId === 2618 || slice.sourceId === 2600) tunnelSegments.vestfjardagong.push(...verts);
});
const routeCoordsWgs84 = routeCoordsNative.map((v) => inverse(v.x, v.y));
const tunnelWgs84 = {
  dyrafjardargong: tunnelSegments.dyrafjardargong.map((v) => inverse(v.x, v.y)),
  vestfjardagong: tunnelSegments.vestfjardagong.map((v) => inverse(v.x, v.y)),
};

const isafjordurEndpointWgs84 = inverse(region.isafjordur.endpoint.x, region.isafjordur.endpoint.y);
const isafjordurPlacesJsonWgs84 = inverse(region.isafjordur.placesJsonNode.x, region.isafjordur.placesJsonNode.y);
const flokalundurInsertedWgs84 = inverse(region.flokalundur.insertedNode.x, region.flokalundur.insertedNode.y);

// Real, literal branch-point coordinates (owner-retained WGS84 GeoJSON,
// found by IDFERILL proximity to this chain's own vertices -- distDeg 0,
// i.e. a shared literal vertex). Advisory only (P8): never composed into
// any route, never a confirmed ID connection.
const BRANCH_POINTS = [
  { label: "Flugvöllur-Dynjandisheiði (63)", lon: -23.24150382, lat: 65.63049043, note: "possible future connection, not confirmed" },
  { label: "Vestfjarðavegur - Hrafnseyri (621/626)", lon: -23.18885319, lat: 65.78379175, note: "possible future connection, not confirmed" },
  { label: "Vestfjarðavegur-Þingeyri (622)", lon: -23.32585617, lat: 65.85249783, note: "possible future connection, not confirmed" },
  { label: "Flateyrarvegur (64)", lon: -23.40286746, lat: 66.01592125, note: "possible future connection, not confirmed" },
  { label: "Botnsdalsleggur - Suðureyri (65)", lon: -23.27653378, lat: 66.05438009, note: "possible future connection, not confirmed" },
  { label: "Súðavík/Djúp (61, við 3835 enda)", lon: -23.17126853, lat: 66.05936295, note: "possible future connection, not confirmed" },
  { label: "Eyrarhlíð (61)", lon: -23.12399231, lat: 66.08035668, note: "possible future connection, not confirmed -- same point as the existing places.json isafjordur coordinate" },
];

const mapData = {
  route: routeCoordsWgs84,
  tunnels: tunnelWgs84,
  owners: {
    isafjordur: { lon: -23.121, lat: 66.074, label: "Ísafjörður (owner coordinate)" },
  },
  inserted: {
    flokalundur: { ...flokalundurInsertedWgs84, label: "Flókalundur (reused route endpoint)" },
    isafjordur: { ...isafjordurEndpointWgs84, label: "Ísafjörður (route endpoint -- 3834's own existing vertex 5)" },
  },
  isafjordurPlacesJson: { ...isafjordurPlacesJsonWgs84, label: "Ísafjörður -- existing winter-route-places.json point (3834's own end, NOT used by this pair)" },
  roundabout25602: null, // filled below
  branchPoints: BRANCH_POINTS,
  lengthM: result.lengthM,
};

// Roundabout marker: midpoint of the coincident 3834[2->4] / 25602[0->2] arc.
const line3834 = linesById.get(3834);
const roundaboutMid = line3834.vertices[3];
mapData.roundabout25602 = { ...inverse(roundaboutMid.x, roundaboutMid.y), label: "Vegamót/hringtorg 25602 (3834[2→4] fellur hér saman, sér merki)" };

fs.writeFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/westfjords-isafjordur-mvp/map-data.json"), JSON.stringify(mapData, null, 2));
console.log("wrote map-data.json, route points:", routeCoordsWgs84.length, "lengthM:", result.lengthM);
