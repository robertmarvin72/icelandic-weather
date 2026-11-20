// Task-local, one-off build script (not production). Regenerates
// server_data/westfjords-region-throskuldar-holmavik.json from the
// retained owner-provided tier-0 WGS84 GeoJSON -- no network, no new
// acquisition. A SEPARATE file from every earlier Westfjords region file;
// none of those are modified by this script.
//
// Run with: node docs/ai/tasks/ticket-501/westfjords-throskuldar-mvp/build-westfjords-throskuldar-holmavik-region.mjs
//
// Literal retained chain (VEGNR 61 x3, then 67; VEGHLUTI 1 throughout),
// confirmed BOKSTAFLEGA connected end-to-end -- 0 m gap at every join, no
// connector needed in this round:
//   3321[0->47] (Hringvegur(60)/61 junction at Gilsfjörður, own vertex 0)
//   -> 3324[0->63] -> 3611[0->26] -> 3883[0->3] (Hólmavík's own existing,
//   literal vertex 3 -- reused byte-identical from
//   westfjords-region-isafjordur-holmavik.json)
//
// Junction endpoint: 3321's own LITERAL vertex 0 -- the same WGS84 point
// as road 60 lines 3754 (own start) and 3755 (own end), which are NEITHER
// inserted NOR included as lines in this region file (P2: they are not on
// this route). Native z (42.058, from 3321) is preserved -- NOT 3754's
// own differing z (41.9942) for the same XY.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const GEOJSON_PATH = "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson";
const ISAFJORDUR_HOLMAVIK_REGION_PATH = "server_data/westfjords-region-isafjordur-holmavik.json";

const A = 6378137.0;
const F_ELL = 1 / 298.257222101;
const E2 = F_ELL * (2 - F_ELL);
const E = Math.sqrt(E2);
const LAT0 = (65.0 * Math.PI) / 180;
const LON0 = (-19.0 * Math.PI) / 180;
const LAT1 = (64.25 * Math.PI) / 180;
const LAT2 = (65.75 * Math.PI) / 180;
const X0 = 500000.0;
const Y0 = 500000.0;

function mFunc(phi) {
  return Math.cos(phi) / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
}
function tFunc(phi) {
  const s = Math.sin(phi);
  return Math.tan(Math.PI / 4 - phi / 2) / ((1 - E * s) / (1 + E * s)) ** (E / 2);
}
const m1 = mFunc(LAT1);
const m2 = mFunc(LAT2);
const t0 = tFunc(LAT0);
const t1 = tFunc(LAT1);
const t2 = tFunc(LAT2);
const N = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
const FF = m1 / (N * t1 ** N);
const RHO0 = A * FF * t0 ** N;

function forward(lonDeg, latDeg) {
  const lon = (lonDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;
  const t = tFunc(lat);
  const rho = A * FF * t ** N;
  const theta = N * (lon - LON0);
  return { x: X0 + rho * Math.sin(theta), y: Y0 + RHO0 - rho * Math.cos(theta) };
}

function sha256File(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

function pointSegmentProjection(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const segLen2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / segLen2));
  return { x: ax + t * dx, y: ay + t * dy, t };
}

const geojsonAbsPath = path.join(ROOT, GEOJSON_PATH);
const geojson = JSON.parse(fs.readFileSync(geojsonAbsPath, "utf8"));
const byIdferill = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));

function toNativeLine(feat) {
  const p = feat.properties;
  const vertices = feat.geometry.coordinates.map(([lon, lat, z]) => {
    const { x, y } = forward(lon, lat);
    return { x, y, z: z ?? null };
  });
  return {
    sourceId: p.IDFERILL,
    idbutur: p.IDBUTUR,
    tier: 0,
    veghluti: p.VEGHLUTI,
    name: p.STUTTNAFNLEIDAR,
    vertices,
    evidenceRef: `Vegagerdin-faerdferlar-WGS84.geojson#IDFERILL=${p.IDFERILL}&OBJECTID=${p.OBJECTID}&tier=0`,
  };
}

const CHAIN_IDFERILL = [3321, 3324, 3611];
const chainLines = CHAIN_IDFERILL.map((id) => toNativeLine(byIdferill.get(id)));

// Reuse the EXISTING literal 3883 (no insertion, same vertex 3 as before)
// byte-identical from the already-approved isafjordur-holmavik region
// file -- an independent copy in THIS file, never a shared runtime
// reference (P3).
const holRegion = JSON.parse(fs.readFileSync(path.join(ROOT, ISAFJORDUR_HOLMAVIK_REGION_PATH), "utf8"));
const line3883 = JSON.parse(JSON.stringify(holRegion.lines.find((l) => l.sourceId === 3883)));
if (line3883.vertices.length !== 4) throw new Error(`STOP: expected 3883 to have 4 vertices (unchanged), got ${line3883.vertices.length}`);

// P1 -- verify every join is a real, literal 0 m connection. STOP (throw)
// on any gap > 0.001 m anywhere. No connector is expected or permitted.
const full = [...chainLines, line3883];
for (let i = 0; i < full.length - 1; i++) {
  const a = full[i];
  const b = full[i + 1];
  const aEnds = [a.vertices[0], a.vertices[a.vertices.length - 1]];
  const bEnds = [b.vertices[0], b.vertices[b.vertices.length - 1]];
  let best = Infinity;
  for (const p of aEnds) for (const q of bEnds) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  if (best > 0.001) {
    throw new Error(`STOP: gap of ${best.toFixed(4)} m between IDFERILL ${a.sourceId} and ${b.sourceId} -- no connector is permitted in this round`);
  }
}

// VEGNR check: "61" for the first three.
for (const l of chainLines) {
  const feat = byIdferill.get(l.sourceId);
  const vegnr = feat.properties.VEGNR;
  if (String(vegnr) !== "61") throw new Error(`STOP: IDFERILL ${l.sourceId} has VEGNR ${vegnr}, expected 61`);
}

// Junction endpoint: 3321's own LITERAL vertex 0 -- no insertion, 3321
// stays exactly as retained (48 vertices).
const line3321 = chainLines.find((l) => l.sourceId === 3321);
if (line3321.vertices.length !== 48) throw new Error(`STOP: expected 3321 to have 48 vertices (unchanged), got ${line3321.vertices.length}`);
const junctionEndpoint = line3321.vertices[0];

// Cross-check: 3754's own start and 3755's own end share this exact XY
// (map-only context -- neither line is included in this region's lines).
// z is preserved from 3321 (42.058), NOT 3754's own differing z (41.9942)
// for the same XY.
const f3754 = byIdferill.get(3754);
const f3755 = byIdferill.get(3755);
const l3754Start = (() => {
  const c = f3754.geometry.coordinates[0];
  return forward(c[0], c[1]);
})();
const l3755End = (() => {
  const c = f3755.geometry.coordinates[f3755.geometry.coordinates.length - 1];
  return forward(c[0], c[1]);
})();
const d3754 = Math.hypot(junctionEndpoint.x - l3754Start.x, junctionEndpoint.y - l3754Start.y);
const d3755 = Math.hypot(junctionEndpoint.x - l3755End.x, junctionEndpoint.y - l3755End.y);
if (d3754 > 0.001 || d3755 > 0.001) throw new Error(`STOP: 3321 vertex 0 diverges from 3754's own start (${d3754} m) or 3755's own end (${d3755} m)`);

// Owner reference point (Þröskuldar, from the retained 164-place CSV:
// "Áætlaður staðarpunktur", 65.592/-21.785) -- map-only context, never
// the endpoint, never counted in lengthM. Offset is the real projected
// distance onto the nearest point of the literal route (3321+3324
// combined), not merely the nearest vertex.
const ownerThroskuldar = forward(-21.785, 65.592);
const line3324 = chainLines.find((l) => l.sourceId === 3324);
let nearestProjection = null;
function scanForNearest(line) {
  for (let i = 0; i < line.vertices.length - 1; i++) {
    const a = line.vertices[i];
    const b = line.vertices[i + 1];
    const proj = pointSegmentProjection(ownerThroskuldar.x, ownerThroskuldar.y, a.x, a.y, b.x, b.y);
    const d = Math.hypot(ownerThroskuldar.x - proj.x, ownerThroskuldar.y - proj.y);
    if (nearestProjection === null || d < nearestProjection.d) nearestProjection = { ...proj, d, sourceId: line.sourceId, segmentIndex: i };
  }
}
scanForNearest(line3321);
scanForNearest(line3324);

function polylineLength(verts, loIdx, hiIdx) {
  let total = 0;
  for (let i = loIdx; i < hiIdx; i++) total += Math.hypot(verts[i + 1].x - verts[i].x, verts[i + 1].y - verts[i].y);
  return total;
}
const fullLength3321 = polylineLength(line3321.vertices, 0, line3321.vertices.length - 1);
let alongRouteM;
if (nearestProjection.sourceId === 3321) {
  alongRouteM = polylineLength(line3321.vertices, 0, nearestProjection.segmentIndex) + nearestProjection.t * Math.hypot(
    line3321.vertices[nearestProjection.segmentIndex + 1].x - line3321.vertices[nearestProjection.segmentIndex].x,
    line3321.vertices[nearestProjection.segmentIndex + 1].y - line3321.vertices[nearestProjection.segmentIndex].y
  );
} else {
  const partial3324 = polylineLength(line3324.vertices, 0, nearestProjection.segmentIndex) + nearestProjection.t * Math.hypot(
    line3324.vertices[nearestProjection.segmentIndex + 1].x - line3324.vertices[nearestProjection.segmentIndex].x,
    line3324.vertices[nearestProjection.segmentIndex + 1].y - line3324.vertices[nearestProjection.segmentIndex].y
  );
  alongRouteM = fullLength3321 + partial3324;
}
const straightLineM = Math.hypot(ownerThroskuldar.x - junctionEndpoint.x, ownerThroskuldar.y - junctionEndpoint.y);

// Hólmavík endpoint check -- must be byte-identical to the existing region.
const holVertex3 = line3883.vertices[3];
const ownerHolmavik = forward(-21.680, 65.705);
const holmavikOffsetM = Math.hypot(ownerHolmavik.x - holVertex3.x, ownerHolmavik.y - holVertex3.y);

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: { file: GEOJSON_PATH, sha256: sha256File(geojsonAbsPath) },
  lines: [...chainLines, line3883],
  junction: {
    endpoint: { x: junctionEndpoint.x, y: junctionEndpoint.y, z: junctionEndpoint.z },
    note: "3321's own literal vertex 0 -- the real vegamót 60/61 junction at Gilsfjörður, shared XY with 3754's own start and 3755's own end (neither line is included in this region's own lines; they are not on this route). z preserved from 3321 (42.058), not 3754's differing z for the same XY.",
    ownerReference: {
      x: ownerThroskuldar.x,
      y: ownerThroskuldar.y,
      offsetFromNearestLineM: nearestProjection.d,
      alongRouteFromJunctionM: alongRouteM,
      straightLineFromJunctionM: straightLineM,
      note: "Þröskuldar -- a map-only reference point ('Áætlaður staðarpunktur' in the retained 164-place CSV), never this pair's endpoint, never counted in lengthM.",
    },
  },
  holmavik: { endpoint: { x: holVertex3.x, y: holVertex3.y, z: holVertex3.z }, offsetM: holmavikOffsetM, note: "the SAME literal, existing vertex 3 of 3883 as westfjords-region-isafjordur-holmavik.json's own Hólmavík endpoint -- an independent copy, never a shared runtime reference" },
};

const outPath = path.join(ROOT, "server_data/westfjords-region-throskuldar-holmavik.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${dataset.lines.length}, owner Þröskuldar offset from nearest line: ${nearestProjection.d.toFixed(3)} m, along-route: ${alongRouteM.toFixed(3)} m, straight-line: ${straightLineM.toFixed(3)} m`);
