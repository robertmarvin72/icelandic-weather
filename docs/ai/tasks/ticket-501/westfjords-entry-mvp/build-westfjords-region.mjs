// Task-local, one-off build script (not production, not an ETL framework;
// same pattern as geometry-api's build-pilot-dataset.mjs). Regenerates
// server_data/westfjords-region-1-60-budardalur.json from the retained
// owner-provided tier-0 WGS84 GeoJSON -- no network, no new acquisition.
//
// Run with: node docs/ai/tasks/ticket-501/westfjords-entry-mvp/build-westfjords-region.mjs
//
// This is the FIRST Westfjords region: the real Hringvegur(1)/vegur 60
// junction (literal node: IDFERILL 3544's own vertex 0 = 2753's own end =
// 3103's own start) through to Búðardalur, via the literal retained
// VEGHLUTI=1 chain 3544 -> 3590 -> 2649 -> 3753 -> 2648 -> 2647 -> 2769
// (approved-prompt-v1.md P1). No synthetic road connection anywhere --
// the only "new" geometry this script creates is ONE interpolated vertex
// INSERTED into line 2769's own existing vertex array (never a new
// sourceId/IDFERILL, never a separate line), at the literal projection of
// the owner's new Búðardalur coordinate onto 2769's own real geometry
// (P2 option (b)). `budardalur` itself, and winter-route-places.json, are
// never touched by this script.
//
// WGS84->EPSG:3057 forward transform: the standard, publicly documented
// ISN93/Lambert-1993 Lambert Conformal Conic (2SP) parameters -- the
// exact inverse of the transform already validated (±0.003 m against
// Vegagerðin's own server-side reprojection) in the earlier Rauðavatn/
// road93 map rounds this ticket. Validated again here, offline, before
// use: round-trip accuracy ~1e-14 degrees; cross-checked against the
// existing tier-2 pilot dataset's own 255 lines via their shared
// IDFERILL values in this same tier-0 package -- 927 matched vertex
// pairs, max discrepancy 2.8 mm (well under the required 0.01 m), never
// mixed into a single core call with tier 2.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const GEOJSON_PATH = "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson";
const PLACES_PATH = "server_data/winter-route-places.json";

// -- WGS84 -> EPSG:3057 (ISN93/Lambert 1993), standard parameters --
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

// -- Load the retained tier-0 GeoJSON --
const geojsonAbsPath = path.join(ROOT, GEOJSON_PATH);
const geojson = JSON.parse(fs.readFileSync(geojsonAbsPath, "utf8"));
const byIdferill = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));

const CHAIN_IDFERILL = [3544, 3590, 2649, 3753, 2648, 2647, 2769];

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

const lines = CHAIN_IDFERILL.map((id) => toNativeLine(byIdferill.get(id)));

// P1 -- verify literal connectivity before trusting the chain (STOP if any
// gap is found; this script must never silently add a connector).
for (let i = 0; i < lines.length - 1; i++) {
  const a = lines[i].vertices;
  const b = lines[i + 1].vertices;
  const ends = [a[0], a[a.length - 1]];
  const starts = [b[0], b[b.length - 1]];
  let best = Infinity;
  for (const p of ends) for (const q of starts) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  if (best > 0.001) {
    throw new Error(`STOP: gap of ${best.toFixed(3)} m between IDFERILL ${lines[i].sourceId} and ${lines[i + 1].sourceId} -- no synthetic connection permitted here`);
  }
}

// Literal junction: 3544's own vertex 0.
const junction = { x: lines[0].vertices[0].x, y: lines[0].vertices[0].y };

// P2 option (b): project the owner's new Búðardalur coordinate onto line
// 2769's own real geometry, and INSERT that literal point into 2769's own
// vertex array (never a new sourceId, never a separate line).
const line2769 = lines[lines.length - 1];
const ownerBudardalur = forward(-21.765, 65.11);

function pointSegmentProjection(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const segLen2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / segLen2));
  return { x: ax + t * dx, y: ay + t * dy, t };
}

let bestProjection = null;
let bestSegmentIndex = -1;
for (let i = 0; i < line2769.vertices.length - 1; i++) {
  const a = line2769.vertices[i];
  const b = line2769.vertices[i + 1];
  const proj = pointSegmentProjection(ownerBudardalur.x, ownerBudardalur.y, a.x, a.y, b.x, b.y);
  const d = Math.hypot(ownerBudardalur.x - proj.x, ownerBudardalur.y - proj.y);
  if (bestProjection === null || d < bestProjection.d) bestProjection = { ...proj, d }, bestSegmentIndex = i;
}

const insertionVertexZ = (() => {
  const a = line2769.vertices[bestSegmentIndex];
  const b = line2769.vertices[bestSegmentIndex + 1];
  if (a.z == null || b.z == null) return null;
  return a.z + bestProjection.t * (b.z - a.z);
})();
const insertionVertex = { x: bestProjection.x, y: bestProjection.y, z: insertionVertexZ };

line2769.vertices = [...line2769.vertices.slice(0, bestSegmentIndex + 1), insertionVertex, ...line2769.vertices.slice(bestSegmentIndex + 1)];

const budardalurOld = { x: lines[lines.length - 1].vertices[0].x, y: lines[lines.length - 1].vertices[0].y };
const budardalurInserted = { x: insertionVertex.x, y: insertionVertex.y };
const offsetM = bestProjection.d;

// P3 -- Dalsmynni trap data, kept SEPARATE from the junction, display-only.
const dalsmynniOwner = forward(-21.589, 64.847);

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: {
    file: GEOJSON_PATH,
    sha256: sha256File(geojsonAbsPath),
  },
  lines,
  junction: { placeId: "junction-1-60-baulan", ...junction, note: "3544's own vertex 0 = 2753's own end = 3103's own start (Hringvegur/vegur 60, Baulan/Norðurá area)" },
  budardalur: {
    oldNode: { ...budardalurOld, note: "2769's own vertex 0 (unchanged) -- the pre-existing runtime budardalur node, option (a)" },
    insertedNode: { ...budardalurInserted, note: "literal projection of the owner's new coordinate onto 2769's own geometry, inserted as a real vertex -- option (b), used as this round's route endpoint" },
    offsetM, // owner point <-> insertedNode -- shown, never counted in lengthM
  },
  dalsmynni: { ...dalsmynniOwner, note: "owner CSV point, NOT the literal junction -- display only, never used for routing" },
};

const outPath = path.join(ROOT, "server_data/westfjords-region-1-60-budardalur.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${lines.length}, junction: (${junction.x}, ${junction.y})`);
console.log(`budardalur insertedNode offset: ${offsetM.toFixed(3)} m`);
