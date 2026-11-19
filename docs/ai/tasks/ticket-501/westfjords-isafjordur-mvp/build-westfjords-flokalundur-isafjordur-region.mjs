// Task-local, one-off build script (not production). Regenerates
// server_data/westfjords-region-flokalundur-isafjordur.json from the
// retained owner-provided tier-0 WGS84 GeoJSON -- no network, no new
// acquisition. A SEPARATE file from every earlier Westfjords region file;
// none of those are modified by this script.
//
// Run with: node docs/ai/tasks/ticket-501/westfjords-isafjordur-mvp/build-westfjords-flokalundur-isafjordur-region.mjs
//
// Literal retained chain (VEGNR 60 except the last two, VEGHLUTI 1
// throughout), confirmed BOKSTAFLEGA connected end-to-end -- 0 m gap at
// every join, no connector needed in this round:
//   3648[50->53] (Flókalundur's own already-inserted node, reused
//   byte-identical from westfjords-region-budardalur-flokalundur.json) ->
//   3009 -> 3008 -> 2870 -> 38085 -> 38087 (Dýrafjarðargöng) -> 38088 ->
//   2994 -> 3003 -> 2767 -> 2993 -> 2297 -> 2890 -> 2618 -> 2600
//   (Vestfjarðagöng) -> 3835 -> 3833 (VEGNR 61) -> 3834 (VEGNR 61)
//
// Ísafjörður endpoint: 3834's own LITERAL, EXISTING vertex 5 (no
// insertion, no new vertex, 3834 stays unchanged at 13 vertices). Vertex
// 12 (3834's own end) is byte-identical to the EXISTING
// winter-route-places.json coordinate for "isafjordur" -- deliberately
// NOT used as this pair's endpoint.

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
// copy in THIS file, never a shared runtime reference (P2).
const flokalundurRegion = JSON.parse(fs.readFileSync(path.join(ROOT, FLOKALUNDUR_REGION_PATH), "utf8"));
const line3648 = JSON.parse(JSON.stringify(flokalundurRegion.lines.find((l) => l.sourceId === 3648)));
if (line3648.vertices.length !== 54) throw new Error(`STOP: expected 3648 to have 54 vertices (with the Flókalundur insertion), got ${line3648.vertices.length}`);

const CHAIN_IDFERILL = [3009, 3008, 2870, 38085, 38087, 38088, 2994, 3003, 2767, 2993, 2297, 2890, 2618, 2600, 3835, 3833, 3834];
const chainLines = CHAIN_IDFERILL.map((id) => toNativeLine(byIdferill.get(id)));

// P1 -- verify every join is a real, literal 0 m connection. STOP (throw)
// on any gap > 0.001 m anywhere, including the 3648 -> 3009 boundary.
// No connector is expected or permitted in this round.
const fullOrderedForCheck = [line3648, ...chainLines];
for (let i = 0; i < fullOrderedForCheck.length - 1; i++) {
  const a = fullOrderedForCheck[i];
  const b = fullOrderedForCheck[i + 1];
  const aEnds = [a.vertices[0], a.vertices[a.vertices.length - 1]];
  const bEnds = [b.vertices[0], b.vertices[b.vertices.length - 1]];
  let best = Infinity;
  for (const p of aEnds) for (const q of bEnds) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  if (best > 0.001) {
    throw new Error(`STOP: gap of ${best.toFixed(4)} m between IDFERILL ${a.sourceId} and ${b.sourceId} -- no connector is permitted in this round`);
  }
}

// VEGNR check: "60" throughout except the last two lines (3833/3834 = "61").
for (const l of chainLines) {
  const feat = byIdferill.get(l.sourceId);
  const vegnr = feat.properties.VEGNR;
  const expected = l.sourceId === 3833 || l.sourceId === 3834 ? "61" : "60";
  if (String(vegnr) !== expected) throw new Error(`STOP: IDFERILL ${l.sourceId} has VEGNR ${vegnr}, expected ${expected}`);
}

// Ísafjörður endpoint: 3834's own LITERAL vertex 5 -- no insertion, 3834
// stays exactly as retained (13 vertices, unchanged).
const line3834 = chainLines.find((l) => l.sourceId === 3834);
if (line3834.vertices.length !== 13) throw new Error(`STOP: expected 3834 to have 13 vertices (unchanged), got ${line3834.vertices.length}`);
const isafjordurEndpoint = line3834.vertices[5];
const ownerIsafjordur = forward(-23.121, 66.074);
const offsetM = Math.hypot(ownerIsafjordur.x - isafjordurEndpoint.x, ownerIsafjordur.y - isafjordurEndpoint.y);

// P4 -- the roundabout caveat: 3834[2->4] is literally coincident with
// 25602[0->2] (the roundabout geometry), traversed FLK->ISA in the
// "forward" direction of 3834 and ISA->FLK against it. Recorded here as
// data, never "fixed" with a new line/node.
const line25602 = toNativeLine(byIdferill.get(25602));
for (let i = 0; i < 3; i++) {
  const a = line3834.vertices[2 + i];
  const b = line25602.vertices[i];
  if (a.x !== b.x || a.y !== b.y) throw new Error(`STOP: 3834 vertex ${2 + i} does not literally coincide with 25602 vertex ${i} as expected`);
}
let roundaboutArcLengthM = 0;
for (let i = 2; i < 4; i++) roundaboutArcLengthM += Math.hypot(line3834.vertices[i + 1].x - line3834.vertices[i].x, line3834.vertices[i + 1].y - line3834.vertices[i].y);

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: { file: GEOJSON_PATH, sha256: sha256File(geojsonAbsPath) },
  lines: [line3648, ...chainLines],
  flokalundur: { insertedNode: { x: flokalundurRegion.flokalundur.insertedNode.x, y: flokalundurRegion.flokalundur.insertedNode.y }, note: "the SAME inserted node as westfjords-region-budardalur-flokalundur.json's own Flókalundur endpoint -- an independent copy, never a shared runtime reference" },
  isafjordur: {
    endpoint: { ...isafjordurEndpoint, note: "3834's own literal, EXISTING vertex 5 -- no insertion, never a new vertex" },
    offsetM,
    placesJsonNode: { x: line3834.vertices[12].x, y: line3834.vertices[12].y, note: "3834's own full end (vertex 12) -- byte-identical to the EXISTING winter-route-places.json coordinate for isafjordur, deliberately NOT used as this pair's endpoint" },
  },
  roundaboutCaveat: {
    sourceId: 3834,
    fromIndex: 2,
    toIndex: 4,
    lengthM: roundaboutArcLengthM,
    coincidesWithSourceId: 25602,
    note: "3834[2->4] is a roundabout arc, literally coincident with 25602[0->2]. flokalundur->isafjordur traverses it in 3834's own forward direction; isafjordur->flokalundur traverses it AGAINST that direction. The core does not split a line into direction-dependent portions, so no directed policy rule is applied -- the correct-direction arc would be longer (approximately 62.45 m, about 23 m more); this is a visible MVP caveat, not corrected in this round.",
  },
};

const outPath = path.join(ROOT, "server_data/westfjords-region-flokalundur-isafjordur.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${dataset.lines.length}, Ísafjörður offset: ${offsetM.toFixed(3)} m, roundabout arc: ${roundaboutArcLengthM.toFixed(3)} m`);
