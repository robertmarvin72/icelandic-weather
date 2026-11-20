// Task-local, one-off script. Produces map-data.json for this round's own
// map-view.html -- never imported by production code. Reuses the real
// production loader + composer for all 10 new cross-leg pairs; only the
// native->WGS84 INVERSE transform is implemented here (standard Lambert
// Conformal Conic 2SP inverse, same parameters as every forward transform
// used elsewhere in this ticket).

import fs from "fs";
import path from "path";
import { loadWestfjordsCombinedRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsCombinedRegionDataset.js";
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

const region = loadWestfjordsCombinedRegionDataset();
const allLines = [...region.lines, ...region.connectors];
const linesById = new Map(allLines.map((l) => [l.sourceId, l]));

function expandSliceVertices(slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex);
  const hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}

const PAIRS = [
  ["budardalur", "holmavik"], ["budardalur", "isafjordur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"],
  ["flokalundur", "holmavik"], ["flokalundur", "talknafjordur"],
  ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"],
  ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"],
];

const OWNERS = {
  budardalur: { lon: -21.765, lat: 65.11, label: "Búðardalur (owner coordinate)" },
  flokalundur: { lon: -23.163, lat: 65.576, label: "Flókalundur (owner coordinate)" },
  isafjordur: { lon: -23.121, lat: 66.074, label: "Ísafjörður (owner coordinate)" },
  holmavik: { lon: -21.68, lat: 65.705, label: "Hólmavík (owner coordinate)" },
  patreksfjordur: { lon: -23.994, lat: 65.597, label: "Patreksfjörður (owner coordinate)" },
  talknafjordur: { lon: -23.827, lat: 65.631, label: "Tálknafjörður (owner coordinate) -- NOT reached by this route" },
};

const endpoints = {};
for (const id of Object.keys(OWNERS)) {
  const e = region.endpoints[id];
  endpoints[id] = { ...inverse(e.x, e.y), label: id, offsetM: e.offsetM, routeEndsShortOfOwnerCoordinate: e.routeEndsShortOfOwnerCoordinate === true };
}

const routes = {};
for (const [a, b] of PAIRS.flatMap(([a, b]) => [[a, b], [b, a]])) {
  const ea = region.endpoints[a], eb = region.endpoints[b];
  const result = composeGeometryPath({
    crs: region.crs, tier: region.tier, lines: allLines,
    from: { placeId: a, x: ea.x, y: ea.y },
    to: { placeId: b, x: eb.x, y: eb.y },
  });
  if (result.status !== "geometry_only") throw new Error(`STOP: unexpected composition status ${result.status} for ${a}-${b}`);

  const routeCoordsNative = [];
  const connectorNative = [];
  result.slices.forEach((slice, i) => {
    const verts = expandSliceVertices(slice);
    const startAt = i === 0 ? 0 : 1;
    for (let j = startAt; j < verts.length; j++) routeCoordsNative.push(verts[j]);
    if (slice.sourceId < 0) connectorNative.push({ sourceId: slice.sourceId, lengthM: slice.lengthM, points: verts.map((v) => inverse(v.x, v.y)) });
  });

  routes[`${a}|${b}`] = {
    from: a,
    to: b,
    route: routeCoordsNative.map((v) => inverse(v.x, v.y)),
    connectors: connectorNative,
    lengthM: result.lengthM,
    estimatedConnectorLengthM: result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0),
    sliceSourceIds: result.slices.map((s) => s.sourceId),
  };
}

const mapData = { routes, owners: OWNERS, endpoints };

const outPath = path.join(process.cwd(), "docs/ai/tasks/ticket-501/closure-implementation/map-data.json");
fs.writeFileSync(outPath, JSON.stringify(mapData));
console.log(`Wrote ${outPath}, ${Object.keys(routes).length} routes`);
