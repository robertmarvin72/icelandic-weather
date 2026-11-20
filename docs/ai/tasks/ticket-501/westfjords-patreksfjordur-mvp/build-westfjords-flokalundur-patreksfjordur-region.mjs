// Task-local, one-off build script (not production). Regenerates
// server_data/westfjords-region-flokalundur-patreksfjordur.json from the
// retained owner-provided tier-0 WGS84 GeoJSON -- no network, no new
// acquisition. A SEPARATE file from every earlier Westfjords region file;
// none of those are modified by this script.
//
// Run with: node docs/ai/tasks/ticket-501/westfjords-patreksfjordur-mvp/build-westfjords-flokalundur-patreksfjordur-region.mjs
//
// Literal retained chain (VEGNR 60 on 3648, then 62 throughout; VEGHLUTI
// 1 throughout), confirmed BOKSTAFLEGA connected end-to-end EXCEPT one
// real sub-5m gap between 2271's own end and 53127's own start:
//   3648[50->53] (Flókalundur's own already-inserted node, reused
//   byte-identical from westfjords-region-budardalur-flokalundur.json) ->
//   3698 -> 3339 -> 3334 -> 3332 -> 2271 -> [GAP 4.3932 m] -> 53127[0->7]
//   (Patreksfjörður's own newly-inserted node)
//
// P2 -- the one real gap (2271's own end <-> 53127's own start, 4.3932 m)
// is bridged by exactly ONE explicit estimated connector line (reserved
// negative sourceId -5, idbutur null), same pattern as the earlier
// estimated connectors in this ticket -- but here the connector's own
// two vertices carry the real z VALUES COPIED from the two endpoints
// (both 0 here), never null (fixing the "F1" z:null pattern from
// earlier rounds, per the approved prompt's own P2).

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const GEOJSON_PATH = "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson";
const FLOKALUNDUR_REGION_PATH = "server_data/westfjords-region-budardalur-flokalundur.json";

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

// Reuse the EXISTING Flókalundur-inserted copy of line 3648 byte-identical
// from the already-approved flokalundur region file -- an independent
// copy in THIS file, never a shared runtime reference (P4).
const flkRegion = JSON.parse(fs.readFileSync(path.join(ROOT, FLOKALUNDUR_REGION_PATH), "utf8"));
const line3648 = JSON.parse(JSON.stringify(flkRegion.lines.find((l) => l.sourceId === 3648)));
if (line3648.vertices.length !== 54) throw new Error(`STOP: expected 3648 to have 54 vertices (with the Flókalundur insertion), got ${line3648.vertices.length}`);

const CHAIN_IDFERILL = [3698, 3339, 3334, 3332, 2271];
const chainLines = CHAIN_IDFERILL.map((id) => toNativeLine(byIdferill.get(id)));

// P1 -- verify every join (3648 included) is a real, literal 0 m
// connection. STOP (throw) on any gap > 0.001 m anywhere in this part of
// the chain (the 2271<->53127 gap is handled separately below, with its
// own documented 5 m ceiling).
const full = [line3648, ...chainLines];
for (let i = 0; i < full.length - 1; i++) {
  const a = full[i];
  const b = full[i + 1];
  const aEnds = [a.vertices[0], a.vertices[a.vertices.length - 1]];
  const bEnds = [b.vertices[0], b.vertices[b.vertices.length - 1]];
  let best = Infinity;
  for (const p of aEnds) for (const q of bEnds) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  if (best > 0.001) {
    throw new Error(`STOP: gap of ${best.toFixed(4)} m between IDFERILL ${a.sourceId} and ${b.sourceId} -- no connector is permitted for this join`);
  }
}

// VEGNR check: "62" for the five chain lines and for 53127.
for (const l of chainLines) {
  const feat = byIdferill.get(l.sourceId);
  const vegnr = feat.properties.VEGNR;
  if (String(vegnr) !== "62") throw new Error(`STOP: IDFERILL ${l.sourceId} has VEGNR ${vegnr}, expected 62`);
}

// The one explicit estimated connector (P2) -- reserved negative
// sourceId, distinct from every earlier connector in this ticket
// (-1 south pilot, -2/-3 north option, -4 Búðardalur-Flókalundur).
const CONNECTOR_SOURCE_ID = -5;
const line2271 = chainLines.find((l) => l.sourceId === 2271);
const line53127Feat = byIdferill.get(53127);
if (String(line53127Feat.properties.VEGNR) !== "62") throw new Error(`STOP: 53127 has VEGNR ${line53127Feat.properties.VEGNR}, expected 62`);
const line53127 = toNativeLine(line53127Feat);
if (line53127.vertices.length !== 11) throw new Error(`STOP: expected 53127 to have 11 vertices before insertion, got ${line53127.vertices.length}`);

const connectorLengthM = Math.hypot(
  line2271.vertices[line2271.vertices.length - 1].x - line53127.vertices[0].x,
  line2271.vertices[line2271.vertices.length - 1].y - line53127.vertices[0].y
);
if (connectorLengthM > 5) throw new Error(`STOP: connector length ${connectorLengthM} m exceeds the 5 m limit approved for this round`);
const connector = {
  sourceId: CONNECTOR_SOURCE_ID,
  idbutur: null,
  tier: 0,
  // Literal copies of the two real endpoints -- z copied from the
  // endpoints themselves (both 0 here), never null.
  vertices: [
    { x: line2271.vertices[line2271.vertices.length - 1].x, y: line2271.vertices[line2271.vertices.length - 1].y, z: line2271.vertices[line2271.vertices.length - 1].z },
    { x: line53127.vertices[0].x, y: line53127.vertices[0].y, z: line53127.vertices[0].z },
  ],
  evidenceRef: "pilot-connector:estimated-westfjords-2271-53127",
};

// Patreksfjörður endpoint: project the owner's coordinate onto 53127's
// own real geometry and insert that literal point as a new vertex --
// never a new sourceId, never the places.json vertex 0 (kept separately
// below as reference only).
const ownerPatreksfjordur = forward(-23.994, 65.597);
let best = null;
let bestSegIdx = -1;
for (let i = 0; i < line53127.vertices.length - 1; i++) {
  const a = line53127.vertices[i];
  const b = line53127.vertices[i + 1];
  const proj = pointSegmentProjection(ownerPatreksfjordur.x, ownerPatreksfjordur.y, a.x, a.y, b.x, b.y);
  const d = Math.hypot(ownerPatreksfjordur.x - proj.x, ownerPatreksfjordur.y - proj.y);
  if (best === null || d < best.d) best = { ...proj, d }, bestSegIdx = i;
}
if (bestSegIdx !== 6) throw new Error(`STOP: expected the nearest segment to be index 6, got ${bestSegIdx}`);
const insertedZ = (() => {
  const a = line53127.vertices[bestSegIdx];
  const b = line53127.vertices[bestSegIdx + 1];
  if (a.z == null || b.z == null) return null;
  return a.z + best.t * (b.z - a.z);
})();
const patreksfjordurInserted = { x: best.x, y: best.y, z: insertedZ };
line53127.vertices = [...line53127.vertices.slice(0, bestSegIdx + 1), patreksfjordurInserted, ...line53127.vertices.slice(bestSegIdx + 1)];
if (line53127.vertices.length !== 12) throw new Error(`STOP: expected 53127 to have 12 vertices after insertion, got ${line53127.vertices.length}`);

const placesJsonNode = { x: line53127.vertices[0].x, y: line53127.vertices[0].y, z: line53127.vertices[0].z };

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: { file: GEOJSON_PATH, sha256: sha256File(geojsonAbsPath) },
  lines: [line3648, ...chainLines, line53127],
  connector,
  flokalundur: { insertedNode: { x: flkRegion.flokalundur.insertedNode.x, y: flkRegion.flokalundur.insertedNode.y }, offsetM: flkRegion.flokalundur.offsetM, note: "the SAME inserted node as westfjords-region-budardalur-flokalundur.json's own Flókalundur endpoint -- an independent copy, never a shared runtime reference" },
  patreksfjordur: {
    insertedNode: { ...patreksfjordurInserted, note: "literal projection of the owner's Patreksfjörður coordinate onto 53127's own real geometry, between its own vertex 6 and 7" },
    offsetM: best.d,
    placesJsonNode: { ...placesJsonNode, note: "53127's own original vertex 0 -- byte-identical to the existing winter-route-places.json coordinate for patreksfjordur, deliberately NOT used as this pair's endpoint" },
  },
};

const outPath = path.join(ROOT, "server_data/westfjords-region-flokalundur-patreksfjordur.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${dataset.lines.length} + 1 connector, connector length: ${connectorLengthM.toFixed(4)} m, Patreksfjörður offset: ${best.d.toFixed(4)} m`);
