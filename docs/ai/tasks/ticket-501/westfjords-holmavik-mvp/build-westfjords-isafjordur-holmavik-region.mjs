// Task-local, one-off build script (not production). Regenerates
// server_data/westfjords-region-isafjordur-holmavik.json from the
// retained owner-provided tier-0 WGS84 GeoJSON -- no network, no new
// acquisition. A SEPARATE file from every earlier Westfjords region file;
// none of those are modified by this script.
//
// Run with: node docs/ai/tasks/ticket-501/westfjords-holmavik-mvp/build-westfjords-isafjordur-holmavik-region.mjs
//
// Literal retained chain (VEGNR 61 except the last line, VEGHLUTI 1
// throughout), confirmed BOKSTAFLEGA connected end-to-end -- 0 m gap at
// every join, no connector needed in this round:
//   3834[5->0] (Ísafjörður's own existing, reused vertex 5, literal reuse
//   -- no insertion) -> 3833 -> 3830 -> 3392 -> 3298 -> 3535 -> 3627 ->
//   3629 -> 3609 -> 3244 -> 3218 -> 3217 -> 3216 -> 3220 -> 3194 -> 3148
//   -> 3195 -> 3626 -> 3605 -> 3419 (these four: "Djúpvegur: Ísafjörður"
//   -- the FJORD, not the town -- never used for via/town-center naming)
//   -> 3418 -> 3415 -> 53466 (Steingrímsfjarðarheiði) -> 3370 -> 3347 ->
//   3883[0->3] (Hólmavík's own existing, literal vertex 3 -- no insertion)
//
// Hólmavík endpoint: 3883's own LITERAL, EXISTING vertex 3 -- byte-
// identical to the EXISTING winter-route-places.json coordinate for
// "holmavik". NOT the junction (3347's own vertex 0).

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const GEOJSON_PATH = "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson";
const FLOKALUNDUR_ISAFJORDUR_REGION_PATH = "server_data/westfjords-region-flokalundur-isafjordur.json";

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

// Reuse the EXISTING literal 3834 (no insertion, same vertex 5 as before)
// byte-identical from the already-approved flokalundur-isafjordur region
// file -- an independent copy in THIS file, never a shared runtime
// reference (P2).
const isaRegion = JSON.parse(fs.readFileSync(path.join(ROOT, FLOKALUNDUR_ISAFJORDUR_REGION_PATH), "utf8"));
const line3834 = JSON.parse(JSON.stringify(isaRegion.lines.find((l) => l.sourceId === 3834)));
if (line3834.vertices.length !== 13) throw new Error(`STOP: expected 3834 to have 13 vertices (unchanged), got ${line3834.vertices.length}`);

const CHAIN_IDFERILL = [3833, 3830, 3392, 3298, 3535, 3627, 3629, 3609, 3244, 3218, 3217, 3216, 3220, 3194, 3148, 3195, 3626, 3605, 3419, 3418, 3415, 53466, 3370, 3347, 3883];
const chainLines = CHAIN_IDFERILL.map((id) => toNativeLine(byIdferill.get(id)));

// P1 -- verify every join is a real, literal 0 m connection. STOP (throw)
// on any gap > 0.001 m anywhere, including the 3834 -> 3833 boundary
// (checked at 3834's own vertex 0, the end this leg's own slice [5->0]
// arrives at). No connector is expected or permitted in this round.
// 3834's own relevant end for this join is vertex 0 (the slice [5->0]
// arrives there); every other line is checked at both of its own ends.
function relevantEnds(line, isFirst) {
  return isFirst ? [line.vertices[0]] : [line.vertices[0], line.vertices[line.vertices.length - 1]];
}
const full = [line3834, ...chainLines];
for (let i = 0; i < full.length - 1; i++) {
  const a = full[i];
  const b = full[i + 1];
  const aEnds = relevantEnds(a, i === 0);
  const bEnds = [b.vertices[0], b.vertices[b.vertices.length - 1]];
  let best = Infinity;
  for (const p of aEnds) for (const q of bEnds) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  if (best > 0.001) {
    throw new Error(`STOP: gap of ${best.toFixed(4)} m between IDFERILL ${a.sourceId} and ${b.sourceId} -- no connector is permitted in this round`);
  }
}

// VEGNR check: "61" throughout except the last line (3883 = "67").
for (const l of chainLines) {
  const feat = byIdferill.get(l.sourceId);
  const vegnr = feat.properties.VEGNR;
  const expected = l.sourceId === 3883 ? "67" : "61";
  if (String(vegnr) !== expected) throw new Error(`STOP: IDFERILL ${l.sourceId} has VEGNR ${vegnr}, expected ${expected}`);
}

// Hólmavík endpoint: 3883's own LITERAL vertex 3 -- no insertion.
const line3883 = chainLines.find((l) => l.sourceId === 3883);
if (line3883.vertices.length !== 4) throw new Error(`STOP: expected 3883 to have 4 vertices (unchanged), got ${line3883.vertices.length}`);
const holmavikEndpoint = line3883.vertices[3];
const ownerHolmavik = forward(-21.680, 65.705);
const offsetM = Math.hypot(ownerHolmavik.x - holmavikEndpoint.x, ownerHolmavik.y - holmavikEndpoint.y);

// Cross-check against the existing places.json coordinate -- must be
// byte-identical to this endpoint (documented, never modified).
const placesPath = path.join(ROOT, "server_data/winter-route-places.json");
const places = JSON.parse(fs.readFileSync(placesPath, "utf8"));
const holmavikPlace = places.places.find((p) => p.id === "holmavik");
const placesNative = forward(holmavikPlace.coordinates.longitude, holmavikPlace.coordinates.latitude);
const placesDiff = Math.hypot(placesNative.x - holmavikEndpoint.x, placesNative.y - holmavikEndpoint.y);
if (placesDiff > 0.001) throw new Error(`STOP: holmavik endpoint diverges from the existing places.json coordinate by ${placesDiff} m`);

// The junction J (3347's own vertex 0) -- recorded for transparency only,
// never used as this pair's endpoint.
const line3347 = chainLines.find((l) => l.sourceId === 3347);
const junctionJ = line3347.vertices[0];

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: { file: GEOJSON_PATH, sha256: sha256File(geojsonAbsPath) },
  lines: [line3834, ...chainLines],
  isafjordur: { endpoint: { x: line3834.vertices[5].x, y: line3834.vertices[5].y, z: line3834.vertices[5].z }, note: "the SAME literal, existing vertex 5 of 3834 as westfjords-region-flokalundur-isafjordur.json's own Ísafjörður endpoint -- an independent copy, never a shared runtime reference" },
  holmavik: {
    endpoint: { ...holmavikEndpoint, note: "3883's own literal, EXISTING vertex 3 -- byte-identical to the existing winter-route-places.json coordinate for holmavik -- no insertion" },
    offsetM,
    junctionJ: { ...junctionJ, note: "3347's own vertex 0 (the real Djúpvegur/Drangsnesvegur junction) -- recorded for transparency, deliberately NOT used as this pair's endpoint" },
  },
  roundaboutCaveat: {
    sourceId: 3834,
    fromIndex: 2,
    toIndex: 4,
    coincidesWithSourceId: 25602,
    note: "Same roundabout coincidence as westfjords-region-flokalundur-isafjordur.json (3834[2->4] literally coincides with 25602[0->2], ~39.18 m). In THIS pair, isafjordur->holmavik traverses the arc AGAINST 3834's own forward direction (fromIndex 5 -> toIndex 0 means the arc segment is walked 4->3->2); holmavik->isafjordur follows it. Documented transparently, not corrected.",
  },
};

const outPath = path.join(ROOT, "server_data/westfjords-region-isafjordur-holmavik.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${dataset.lines.length}, Hólmavík offset: ${offsetM.toFixed(3)} m`);
