// Task-local, one-off script. Produces map-data.json for this round's own
// map-view.html -- never imported by production code. Reuses the real
// production loader + composer; only the native->WGS84 INVERSE transform
// is implemented here (standard Lambert Conformal Conic 2SP inverse, same
// parameters as every forward transform in this ticket).

import fs from "fs";
import path from "path";
import { loadWestfjordsFlokalundurPatreksfjordurRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsFlokalundurPatreksfjordurRegionDataset.js";
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
const rt = forward(-23.994, 65.597);
const back = inverse(rt.x, rt.y);
const rtErr = Math.hypot(back.lon - -23.994, back.lat - 65.597);
if (rtErr > 1e-9) throw new Error(`STOP: inverse transform round-trip error too large: ${rtErr}`);

const region = loadWestfjordsFlokalundurPatreksfjordurRegionDataset();
const patLines = [...region.lines, region.connector];
const result = composeGeometryPath({
  crs: region.crs, tier: region.tier, lines: patLines,
  from: { placeId: "flokalundur", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
  to: { placeId: "patreksfjordur", x: region.patreksfjordur.insertedNode.x, y: region.patreksfjordur.insertedNode.y },
});
if (result.status !== "geometry_only") throw new Error(`STOP: unexpected composition status ${result.status}`);

const linesById = new Map(patLines.map((l) => [l.sourceId, l]));
function expandSliceVertices(slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex);
  const hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}
const routeCoordsNative = [];
const connectorNative = [];
result.slices.forEach((slice, i) => {
  const verts = expandSliceVertices(slice);
  const startAt = i === 0 ? 0 : 1;
  for (let j = startAt; j < verts.length; j++) routeCoordsNative.push(verts[j]);
  if (slice.sourceId === region.connector.sourceId) connectorNative.push(...verts);
});
const routeCoordsWgs84 = routeCoordsNative.map((v) => inverse(v.x, v.y));
const connectorWgs84 = connectorNative.map((v) => inverse(v.x, v.y));

const flokalundurEndpointWgs84 = inverse(region.flokalundur.insertedNode.x, region.flokalundur.insertedNode.y);
const patreksfjordurEndpointWgs84 = inverse(region.patreksfjordur.insertedNode.x, region.patreksfjordur.insertedNode.y);
const patreksfjordurPlacesJsonWgs84 = inverse(region.patreksfjordur.placesJsonNode.x, region.patreksfjordur.placesJsonNode.y);

const line3648 = linesById.get(3648);
const junction6062Native = line3648.vertices[53];
const junction6062Wgs84 = inverse(junction6062Native.x, junction6062Native.y);

// Real, literal branch-point coordinates. Advisory only (P10): never
// composed into any route, never a confirmed ID connection. No new
// destinations/ferry legs.
const geojson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson"), "utf8"));
const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));

const f3009 = byId.get(3009);
const road60Wgs84 = { lon: f3009.geometry.coordinates[0][0], lat: f3009.geometry.coordinates[0][1] };

const line3698 = linesById.get(3698);
const brjanslaekurWgs84 = inverse(line3698.vertices[22].x, line3698.vertices[22].y);

const line3332 = linesById.get(3332);
const road612Wgs84 = inverse(line3332.vertices[69].x, line3332.vertices[69].y);

const line2271 = linesById.get(2271);
const miklidalurNative = line2271.vertices[line2271.vertices.length - 1];
const miklidalurWgs84 = inverse(miklidalurNative.x, miklidalurNative.y);

const BRANCH_POINTS = [
  { label: "60 (3698 v0 / 3009 v0, 60/62 vegamót)", ...road60Wgs84, note: "possible future connection, not confirmed -- distinct from the Flókalundur endpoint itself" },
  { label: "610 Brjánslækur (3698 v22)", ...brjanslaekurWgs84, note: "possible future connection, not confirmed -- the Baldur ferry from Brjánslækur is out of scope and never implied by this road route" },
  { label: "612 (3332 v69)", ...road612Wgs84, note: "possible future connection, not confirmed" },
  { label: "63 Miklidalur (2271 END / 3361 START)", ...miklidalurWgs84, note: "possible future connection, not confirmed -- real end of the estimated connector's own 2271-side vertex" },
];

const mapData = {
  route: routeCoordsWgs84,
  connector: connectorWgs84,
  owners: {
    flokalundur: { lon: -23.163, lat: 65.576, label: "Flókalundur (owner coordinate)" },
    patreksfjordur: { lon: -23.994, lat: 65.597, label: "Patreksfjörður (owner coordinate)" },
  },
  endpoints: {
    flokalundur: { ...flokalundurEndpointWgs84, label: "Flókalundur (reused route endpoint, 3648's own insertion)" },
    patreksfjordur: { ...patreksfjordurEndpointWgs84, label: "Patreksfjörður (route endpoint -- inserted on 53127 between vertex 6 and 7)" },
  },
  junction6062: { ...junction6062Wgs84, label: "60/62 vegamót (3648's own vertex 53) -- internal node of this route, distinct from the Flókalundur endpoint" },
  patreksfjordurPlacesJson: { ...patreksfjordurPlacesJsonWgs84, label: "Patreksfjörður -- existing winter-route-places.json point (53127's own vertex 0, NOT used by this pair)" },
  branchPoints: BRANCH_POINTS,
  lengthM: result.lengthM,
  estimatedConnectorLengthM: result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0),
};

fs.writeFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/westfjords-patreksfjordur-mvp/map-data.json"), JSON.stringify(mapData, null, 2));
console.log("wrote map-data.json, route points:", routeCoordsWgs84.length, "lengthM:", result.lengthM);
