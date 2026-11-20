// Task-local, one-off script. Produces map-data.json for this round's own
// map-view.html -- never imported by production code. Reuses the real
// production loader + composer; only the native->WGS84 INVERSE transform
// is implemented here (standard Lambert Conformal Conic 2SP inverse, same
// parameters as every forward transform in this ticket).

import fs from "fs";
import path from "path";
import { loadWestfjordsPatreksfjordurTalknafjordurRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsPatreksfjordurTalknafjordurRegionDataset.js";
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
const rt = forward(-23.827, 65.631);
const back = inverse(rt.x, rt.y);
const rtErr = Math.hypot(back.lon - -23.827, back.lat - 65.631);
if (rtErr > 1e-9) throw new Error(`STOP: inverse transform round-trip error too large: ${rtErr}`);

const region = loadWestfjordsPatreksfjordurTalknafjordurRegionDataset();
const talLines = [...region.lines, region.connector];
const result = composeGeometryPath({
  crs: region.crs, tier: region.tier, lines: talLines,
  from: { placeId: "patreksfjordur", x: region.patreksfjordur.insertedNode.x, y: region.patreksfjordur.insertedNode.y },
  to: { placeId: "talknafjordur", x: region.talknafjordur.endpoint.x, y: region.talknafjordur.endpoint.y },
});
if (result.status !== "geometry_only") throw new Error(`STOP: unexpected composition status ${result.status}`);

const linesById = new Map(talLines.map((l) => [l.sourceId, l]));
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

const patreksfjordurEndpointWgs84 = inverse(region.patreksfjordur.insertedNode.x, region.patreksfjordur.insertedNode.y);
const talknafjordurEndpointWgs84 = inverse(region.talknafjordur.endpoint.x, region.talknafjordur.endpoint.y);

// Real, literal branch-point coordinates. Advisory only (P10): never
// composed into any route, never a confirmed ID connection. No new
// destinations/ferry/Bíldudalur route.
const geojson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson"), "utf8"));
const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));

const line3361 = linesById.get(3361);
const junction6263Wgs84 = inverse(line3361.vertices[0].x, line3361.vertices[0].y);

const f2088 = byId.get(2088);
const halfdanWgs84 = { lon: f2088.geometry.coordinates[0][0], lat: f2088.geometry.coordinates[0][1] };

const BRANCH_POINTS = [
  { label: "63/62 vegamót við tengingu (3361 v0 = 2271 v59)", ...junction6263Wgs84, note: "possible future connection, not confirmed -- same point the estimated connector's own 3361-side vertex sits at" },
  { label: "63 Hálfdán/Bíldudalur (3361 END = 2088 v0)", ...halfdanWgs84, note: "possible future connection, not confirmed -- no Bíldudalur route implemented in this round" },
];

const mapData = {
  route: routeCoordsWgs84,
  connector: connectorWgs84,
  owners: {
    patreksfjordur: { lon: -23.994, lat: 65.597, label: "Patreksfjörður (owner coordinate)" },
    talknafjordur: { lon: -23.827, lat: 65.631, label: "Tálknafjörður (owner coordinate) -- NOT reached by this route" },
  },
  endpoints: {
    patreksfjordur: { ...patreksfjordurEndpointWgs84, label: "Patreksfjörður (reused route endpoint, inserted on 53127)" },
    talknafjordur: { ...talknafjordurEndpointWgs84, label: "Tálknafjörður (route endpoint -- retained vegur 617's own literal end; places.json's own point; town continuation not included)" },
  },
  branchPoints: BRANCH_POINTS,
  lengthM: result.lengthM,
  estimatedConnectorLengthM: result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0),
  talknafjordurOwnerOffsetM: region.talknafjordur.ownerCoordinateOffsetM,
};

fs.writeFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-501/westfjords-talknafjordur-mvp/map-data.json"), JSON.stringify(mapData, null, 2));
console.log("wrote map-data.json, route points:", routeCoordsWgs84.length, "lengthM:", result.lengthM);
