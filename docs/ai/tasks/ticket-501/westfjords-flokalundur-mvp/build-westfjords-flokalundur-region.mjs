// Task-local, one-off build script (not production, not an ETL framework;
// same pattern as build-pilot-dataset.mjs / build-westfjords-region.mjs).
// Regenerates server_data/westfjords-region-budardalur-flokalundur.json
// from the retained owner-provided tier-0 WGS84 GeoJSON -- no network, no
// new acquisition. A SEPARATE file from westfjords-region-1-60-budardalur.json
// (P8): that file's own bytes are never touched by this script.
//
// Run with: node docs/ai/tasks/ticket-501/westfjords-flokalundur-mvp/build-westfjords-flokalundur-region.mjs
//
// Literal retained chain (VEGNR 60, VEGHLUTI 1 throughout), confirmed
// connected end-to-end except ONE real sub-centimetre gap:
//   2769[3->4] (same Búðardalur insertion as the first region) -> 3197 ->
//   3247 -> 3462 -> 40961 -> 3460 -> 3771 -> 3755 -> 3754 -> 3750 -> 49925
//   -> [GAP 0.005 m] -> 50566 -> 3678 -> 3677 -> 3675 -> 3672 -> 3651 ->
//   3869 -> 3868 -> 3648
//
// P1 -- the one real gap (49925's own end <-> 50566's own start, 0.005 m)
// is bridged by exactly ONE explicit estimated connector line (reserved
// negative sourceId, idbutur null, non-WFS evidenceRef) -- same pattern
// as the Hádegismóar connectors in the Rauðavatn-Selfoss north option.
// Never snapped in the core, never a longer/different connection: this
// script throws if any OTHER gap >0.01 m is found anywhere in the chain.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const GEOJSON_PATH = "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson";

// -- WGS84 -> EPSG:3057 (ISN93/Lambert 1993), standard parameters --
// (identical formula to build-westfjords-region.mjs -- duplicated here
// deliberately, same one-off-script convention as every earlier build
// script in this ticket; never imported by production code at request time.)
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

// Same literal Búðardalur insertion as westfjords-region-1-60-budardalur.json
// (2769, between its own vertex 2 and 3) -- a fresh, independent copy in
// THIS file, never shared/imported from the other region's own runtime
// JSON at request time (P8: the two regions stay fully independent).
const line2769 = toNativeLine(byIdferill.get(2769));
const ownerBudardalur = forward(-21.765, 65.11);

function pointSegmentProjection(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const segLen2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / segLen2));
  return { x: ax + t * dx, y: ay + t * dy, t };
}

let bdProjection = null;
let bdSegmentIndex = -1;
for (let i = 0; i < line2769.vertices.length - 1; i++) {
  const a = line2769.vertices[i];
  const b = line2769.vertices[i + 1];
  const proj = pointSegmentProjection(ownerBudardalur.x, ownerBudardalur.y, a.x, a.y, b.x, b.y);
  const d = Math.hypot(ownerBudardalur.x - proj.x, ownerBudardalur.y - proj.y);
  if (bdProjection === null || d < bdProjection.d) bdProjection = { ...proj, d }, bdSegmentIndex = i;
}
const bdZ = (() => {
  const a = line2769.vertices[bdSegmentIndex];
  const b = line2769.vertices[bdSegmentIndex + 1];
  if (a.z == null || b.z == null) return null;
  return a.z + bdProjection.t * (b.z - a.z);
})();
const bdInserted = { x: bdProjection.x, y: bdProjection.y, z: bdZ };
line2769.vertices = [...line2769.vertices.slice(0, bdSegmentIndex + 1), bdInserted, ...line2769.vertices.slice(bdSegmentIndex + 1)];

// The 19-line Búðardalur -> Flókalundur corridor (VEGNR 60 throughout).
const CHAIN_IDFERILL = [3197, 3247, 3462, 40961, 3460, 3771, 3755, 3754, 3750, 49925, 50566, 3678, 3677, 3675, 3672, 3651, 3869, 3868, 3648];
const chainLines = CHAIN_IDFERILL.map((id) => toNativeLine(byIdferill.get(id)));

// P1 -- verify every join except the one known gap; STOP (throw) if any
// OTHER gap > 0.01 m is found anywhere, including around line2769.
const fullOrderedForCheck = [line2769, ...chainLines];
const KNOWN_GAP_PAIR = new Set(["49925|50566"]);
for (let i = 0; i < fullOrderedForCheck.length - 1; i++) {
  const a = fullOrderedForCheck[i];
  const b = fullOrderedForCheck[i + 1];
  const aEnds = [a.vertices[0], a.vertices[a.vertices.length - 1]];
  const bEnds = [b.vertices[0], b.vertices[b.vertices.length - 1]];
  let best = Infinity;
  for (const p of aEnds) for (const q of bEnds) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  const isKnownGap = KNOWN_GAP_PAIR.has(`${a.sourceId}|${b.sourceId}`);
  const limit = isKnownGap ? 0.01 : 0.001;
  if (best > limit) {
    throw new Error(`STOP: gap of ${best.toFixed(4)} m between IDFERILL ${a.sourceId} and ${b.sourceId} -- exceeds the ${isKnownGap ? "0.01 m connector" : "literal-connectivity"} limit`);
  }
}

// The one explicit estimated connector (P1) -- reserved negative sourceId,
// distinct from both the south-pilot (-1) and north-option (-2/-3)
// connectors, idbutur null, non-WFS evidenceRef.
const CONNECTOR_SOURCE_ID = -4;
const line49925 = chainLines.find((l) => l.sourceId === 49925);
const line50566 = chainLines.find((l) => l.sourceId === 50566);
const connectorVertices = [
  { x: line49925.vertices[line49925.vertices.length - 1].x, y: line49925.vertices[line49925.vertices.length - 1].y, z: null },
  { x: line50566.vertices[0].x, y: line50566.vertices[0].y, z: null },
];
const connectorLengthM = Math.hypot(connectorVertices[0].x - connectorVertices[1].x, connectorVertices[0].y - connectorVertices[1].y);
if (connectorLengthM > 0.01) throw new Error(`STOP: connector length ${connectorLengthM} m exceeds the 0.01 m limit`);
const connector = {
  sourceId: CONNECTOR_SOURCE_ID,
  idbutur: null,
  tier: 0,
  vertices: connectorVertices,
  evidenceRef: "pilot-connector:estimated-westfjords-49925-50566",
};

// Flókalundur endpoint: project the owner's coordinate onto line 3648's
// own real geometry and insert that literal point as a new vertex --
// never a new sourceId, never the 60/62 junction (3648's own full end,
// kept separately below as a branch-point marker only).
const line3648 = chainLines.find((l) => l.sourceId === 3648);
const ownerFlokalundur = forward(-23.163, 65.576);
let flkProjection = null;
let flkSegmentIndex = -1;
for (let i = 0; i < line3648.vertices.length - 1; i++) {
  const a = line3648.vertices[i];
  const b = line3648.vertices[i + 1];
  const proj = pointSegmentProjection(ownerFlokalundur.x, ownerFlokalundur.y, a.x, a.y, b.x, b.y);
  const d = Math.hypot(ownerFlokalundur.x - proj.x, ownerFlokalundur.y - proj.y);
  if (flkProjection === null || d < flkProjection.d) flkProjection = { ...proj, d }, flkSegmentIndex = i;
}
const junction6062 = { x: line3648.vertices[line3648.vertices.length - 1].x, y: line3648.vertices[line3648.vertices.length - 1].y };
const flkZ = (() => {
  const a = line3648.vertices[flkSegmentIndex];
  const b = line3648.vertices[flkSegmentIndex + 1];
  if (a.z == null || b.z == null) return null;
  return a.z + flkProjection.t * (b.z - a.z);
})();
const flkInserted = { x: flkProjection.x, y: flkProjection.y, z: flkZ };
line3648.vertices = [...line3648.vertices.slice(0, flkSegmentIndex + 1), flkInserted, ...line3648.vertices.slice(flkSegmentIndex + 1)];

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: { file: GEOJSON_PATH, sha256: sha256File(geojsonAbsPath) },
  lines: [line2769, ...chainLines],
  connector,
  budardalur: { insertedNode: { x: bdInserted.x, y: bdInserted.y }, note: "the SAME inserted node as westfjords-region-1-60-budardalur.json's own Búðardalur endpoint -- an independent copy of line 2769's own insertion, never a shared runtime reference" },
  flokalundur: {
    insertedNode: { ...flkInserted, note: "literal projection of the owner's Flókalundur coordinate onto 3648's own real geometry" },
    offsetM: flkProjection.d,
    junction6062: { ...junction6062, note: "3648's own full end -- the real 60/62 branch point, NOT Flókalundur, never the route endpoint" },
  },
};

const outPath = path.join(ROOT, "server_data/westfjords-region-budardalur-flokalundur.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${dataset.lines.length} + 1 connector, Flókalundur offset: ${flkProjection.d.toFixed(3)} m`);
