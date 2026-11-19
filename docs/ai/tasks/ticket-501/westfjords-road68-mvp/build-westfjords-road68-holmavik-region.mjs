// Task-local, one-off build script (not production). Regenerates
// server_data/westfjords-region-1-68-holmavik.json from the retained
// owner-provided tier-0 WGS84 GeoJSON (plus the retained 708 IdButur CSV,
// for the "Innstrandavegur" FulltNafnButs name used by via-matching only)
// -- no network, no new acquisition. A SEPARATE file from every earlier
// Westfjords region file; none of those are modified by this script.
//
// Run with: node docs/ai/tasks/ticket-501/westfjords-road68-mvp/build-westfjords-road68-holmavik-region.mjs
//
// Literal retained chain (VEGNR 68 x10, then 61, then 67; VEGHLUTI 1
// throughout), confirmed BOKSTAFLEGA connected end-to-end -- 0 m gap at
// every join, no connector needed in this round:
//   1796[0->...] (Hringvegur/68 junction, own vertex 0) -> 1720 -> 1717 ->
//   1444 -> 3278 -> 24002 -> 3411 -> 2427 -> 2773 -> 2690 -> 3611 (VEGNR
//   61) -> 3883 (VEGNR 67, Hólmavík's own existing, literal vertex 3 --
//   reused byte-identical from westfjords-region-isafjordur-holmavik.json)
//
// Junction endpoint: 1796's own LITERAL vertex 0 -- the same WGS84 point
// as Hringvegur lines 1481 (own end) and 3828 (own start), which are
// NEITHER inserted NOR included as lines in this region file (P2: they
// are not on this route).

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const GEOJSON_PATH = "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson";
const FAERDARKAFLAR_708_PATH = "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdarkaflar-708.csv";
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

// Minimal CSV parse -- the 708 file has no quoted commas in the columns
// we read (IdButur, FulltNafnButs, StuttNafnButs, ...).
function parseFaerdarkaflar708(absPath) {
  const text = fs.readFileSync(absPath, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const byIdbutur = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const idbutur = Number(cols[0]);
    const fulltNafnButs = cols[1];
    byIdbutur.set(idbutur, fulltNafnButs);
  }
  return byIdbutur;
}

const geojsonAbsPath = path.join(ROOT, GEOJSON_PATH);
const geojson = JSON.parse(fs.readFileSync(geojsonAbsPath, "utf8"));
const byIdferill = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
const faerdarkaflarAbsPath = path.join(ROOT, FAERDARKAFLAR_708_PATH);
const idbuturNames = parseFaerdarkaflar708(faerdarkaflarAbsPath);

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
    // FulltNafnButs from the retained 708 IdButur table -- used ONLY for
    // via-name matching (e.g. "Innstrandavegur"); never a route-selection
    // input, never shown as a confirmed færð/#503 source.
    idbuturName: idbuturNames.get(p.IDBUTUR) ?? null,
    vertices,
    evidenceRef: `Vegagerdin-faerdferlar-WGS84.geojson#IDFERILL=${p.IDFERILL}&OBJECTID=${p.OBJECTID}&tier=0`,
  };
}

const CHAIN_IDFERILL = [1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690, 3611];
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

// VEGNR check: "68" for the first ten, "61" for 3611.
for (const l of chainLines) {
  const feat = byIdferill.get(l.sourceId);
  const vegnr = feat.properties.VEGNR;
  const expected = l.sourceId === 3611 ? "61" : "68";
  if (String(vegnr) !== expected) throw new Error(`STOP: IDFERILL ${l.sourceId} has VEGNR ${vegnr}, expected ${expected}`);
}

// Junction endpoint: 1796's own LITERAL vertex 0 -- no insertion, 1796
// stays exactly as retained (31 vertices).
const line1796 = chainLines.find((l) => l.sourceId === 1796);
if (line1796.vertices.length !== 31) throw new Error(`STOP: expected 1796 to have 31 vertices (unchanged), got ${line1796.vertices.length}`);
const junctionEndpoint = line1796.vertices[0];

// Cross-check: 1481's own end and 3828's own start share this exact XY
// (map-only context -- neither line is included in this region's lines).
const f1481 = byIdferill.get(1481);
const f3828 = byIdferill.get(3828);
const l1481End = (() => {
  const c = f1481.geometry.coordinates[f1481.geometry.coordinates.length - 1];
  return forward(c[0], c[1]);
})();
const l3828Start = (() => {
  const c = f3828.geometry.coordinates[0];
  return forward(c[0], c[1]);
})();
const d1481 = Math.hypot(junctionEndpoint.x - l1481End.x, junctionEndpoint.y - l1481End.y);
const d3828 = Math.hypot(junctionEndpoint.x - l3828Start.x, junctionEndpoint.y - l3828Start.y);
if (d1481 > 0.001 || d3828 > 0.001) throw new Error(`STOP: 1796 vertex 0 diverges from 1481's own end (${d1481} m) or 3828's own start (${d3828} m)`);

// Owner reference point (Hrútafjörður) -- map-only context, never the
// endpoint, never counted in lengthM.
const ownerHrutafjordur = forward(-21.094, 65.153);
const ownerOffsetFromJunctionM = Math.hypot(ownerHrutafjordur.x - junctionEndpoint.x, ownerHrutafjordur.y - junctionEndpoint.y);

// Hólmavík endpoint check -- must be byte-identical to the existing region.
const holVertex3 = line3883.vertices[3];
const ownerHolmavik = forward(-21.680, 65.705);
const holmavikOffsetM = Math.hypot(ownerHolmavik.x - holVertex3.x, ownerHolmavik.y - holVertex3.y);

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: { file: GEOJSON_PATH, sha256: sha256File(geojsonAbsPath), faerdarkaflar708File: FAERDARKAFLAR_708_PATH, faerdarkaflar708Sha256: sha256File(faerdarkaflarAbsPath) },
  lines: [...chainLines, line3883],
  junction: {
    endpoint: { x: junctionEndpoint.x, y: junctionEndpoint.y, z: junctionEndpoint.z },
    note: "1796's own literal vertex 0 -- the real Hringvegur(1)/vegur 68 junction, shared XY with 1481's own end and 3828's own start (neither line is included in this region's own lines; they are not on this route).",
    ownerReference: { x: ownerHrutafjordur.x, y: ownerHrutafjordur.y, offsetFromEndpointM: ownerOffsetFromJunctionM, note: "Hrútafjörður -- a map-only reference point, never this pair's endpoint, never counted in lengthM." },
  },
  holmavik: { endpoint: { x: holVertex3.x, y: holVertex3.y, z: holVertex3.z }, offsetM: holmavikOffsetM, note: "the SAME literal, existing vertex 3 of 3883 as westfjords-region-isafjordur-holmavik.json's own Hólmavík endpoint -- an independent copy, never a shared runtime reference" },
};

const outPath = path.join(ROOT, "server_data/westfjords-region-1-68-holmavik.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${dataset.lines.length}, owner Hrútafjörður offset from junction: ${ownerOffsetFromJunctionM.toFixed(3)} m`);
