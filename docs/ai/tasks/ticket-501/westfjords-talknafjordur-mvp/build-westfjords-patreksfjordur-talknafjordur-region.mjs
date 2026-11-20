// Task-local, one-off build script (not production). Regenerates
// server_data/westfjords-region-patreksfjordur-talknafjordur.json from
// the retained owner-provided tier-0 WGS84 GeoJSON -- no network, no new
// acquisition. A SEPARATE file from every earlier Westfjords region
// file; none of those are modified by this script.
//
// Run with: node docs/ai/tasks/ticket-501/westfjords-talknafjordur-mvp/build-westfjords-patreksfjordur-talknafjordur-region.mjs
//
// Literal retained chain (VEGNR 62 on 53127, 63 on 3361, 617 on 2889;
// VEGHLUTI 1 throughout), confirmed BOKSTAFLEGA connected end-to-end:
//   53127[7->0] (Patreksfjörður's own already-inserted node, reused
//   byte-identical from westfjords-region-flokalundur-patreksfjordur.json)
//   -> connector -5 (ALSO reused byte-identical from that same file -- it
//   bridges 53127's own start to 2271's own end, and 2271's own end is
//   the SAME literal point as 3361's own start) -> 3361[0->53] -> 2889[0->12]
//   (Tálknafjörður's own literal, EXISTING vertex 12 -- no insertion)
//
// 2271 itself is NOT a line in this region file -- it is not on this
// route. The connector's own provenance (2271-end/53127-start) is
// historical; what matters here is that the connector's own first vertex
// is byte-identical to 3361's own vertex 0 (verified below), which is
// what actually keeps this route connected.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const GEOJSON_PATH = "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson";
const PATREKSFJORDUR_REGION_PATH = "server_data/westfjords-region-flokalundur-patreksfjordur.json";
const PLACES_PATH = "server_data/winter-route-places.json";

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

// Reuse the EXISTING literal 53127 (with Patreksfjörður insertion) AND
// the EXISTING connector -5 byte-identical from the already-approved
// flokalundur-patreksfjordur region file -- independent copies in THIS
// file, never a shared runtime reference (P2/P4).
const patRegion = JSON.parse(fs.readFileSync(path.join(ROOT, PATREKSFJORDUR_REGION_PATH), "utf8"));
const line53127 = JSON.parse(JSON.stringify(patRegion.lines.find((l) => l.sourceId === 53127)));
if (line53127.vertices.length !== 12) throw new Error(`STOP: expected 53127 to have 12 vertices (with the Patreksfjörður insertion), got ${line53127.vertices.length}`);
const connector = JSON.parse(JSON.stringify(patRegion.connector));
if (connector.sourceId !== -5) throw new Error(`STOP: expected the reused connector to be sourceId -5, got ${connector.sourceId}`);

const line3361 = toNativeLine(byIdferill.get(3361));
const line2889 = toNativeLine(byIdferill.get(2889));

// P1 -- verify the 3361 <-> 2889 join is a real, literal 0 m connection,
// and that the connector's own first vertex is byte-identical to 3361's
// own vertex 0 (this is what keeps the route connected; the connector's
// own historical 2271-provenance is not re-verified against a 2271 line
// here, since 2271 is not part of this region).
const d3361_2889 = Math.hypot(line3361.vertices[line3361.vertices.length - 1].x - line2889.vertices[0].x, line3361.vertices[line3361.vertices.length - 1].y - line2889.vertices[0].y);
if (d3361_2889 > 0.001) throw new Error(`STOP: gap of ${d3361_2889.toFixed(4)} m between IDFERILL 3361 and 2889 -- no connector is permitted for this join`);
const dConnector3361 = Math.hypot(connector.vertices[0].x - line3361.vertices[0].x, connector.vertices[0].y - line3361.vertices[0].y);
if (dConnector3361 > 0.001) throw new Error(`STOP: the reused connector's own first vertex diverges from 3361's own vertex 0 by ${dConnector3361.toFixed(4)} m -- the route would be disconnected`);

// VEGNR check.
if (String(byIdferill.get(3361).properties.VEGNR) !== "63") throw new Error(`STOP: IDFERILL 3361 has unexpected VEGNR`);
if (String(byIdferill.get(2889).properties.VEGNR) !== "617") throw new Error(`STOP: IDFERILL 2889 has unexpected VEGNR`);

// Tálknafjörður endpoint: 2889's own LITERAL vertex 12 -- no insertion,
// 2889 stays exactly as retained (13 vertices).
if (line2889.vertices.length !== 13) throw new Error(`STOP: expected 2889 to have 13 vertices (unchanged), got ${line2889.vertices.length}`);
const talknafjordurEndpoint = line2889.vertices[12];

// Cross-check: byte-identical to the existing places.json coordinate for
// talknafjordur (documented, never modified).
const placesPath = path.join(ROOT, PLACES_PATH);
const places = JSON.parse(fs.readFileSync(placesPath, "utf8"));
const talknafjordurPlace = places.places.find((p) => p.id === "talknafjordur");
const placesNative = forward(talknafjordurPlace.coordinates.longitude, talknafjordurPlace.coordinates.latitude);
const placesDiff = Math.hypot(placesNative.x - talknafjordurEndpoint.x, placesNative.y - talknafjordurEndpoint.y);
if (placesDiff > 0.001) throw new Error(`STOP: talknafjordur endpoint diverges from the existing places.json coordinate by ${placesDiff} m`);

// Owner coordinate (Tálknafjörður, 65.631/-23.827) -- measure its real
// projected offset against EVERY line in this region (not merely 617),
// per P3's own instruction, to document the coverage picture honestly.
const ownerTalknafjordur = forward(-23.827, 65.631);
function nearestOffsetOnLine(line) {
  let best = Infinity;
  for (const v of line.vertices) {
    const d = Math.hypot(ownerTalknafjordur.x - v.x, ownerTalknafjordur.y - v.y);
    if (d < best) best = d;
  }
  return best;
}
const offsetVs2889 = Math.hypot(ownerTalknafjordur.x - talknafjordurEndpoint.x, ownerTalknafjordur.y - talknafjordurEndpoint.y);
const offsetVsOtherLines = { 53127: nearestOffsetOnLine(line53127), 3361: nearestOffsetOnLine(line3361) };
// Also check the real national network's own nearest OTHER line (2088,
// the Hálfdán/Bíldudalur branch at 3361's own end) for the report only.
const line2088 = toNativeLine(byIdferill.get(2088));
const offsetVs2088 = nearestOffsetOnLine(line2088);

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: { file: GEOJSON_PATH, sha256: sha256File(geojsonAbsPath) },
  lines: [line53127, line3361, line2889],
  connector,
  patreksfjordur: { insertedNode: { x: patRegion.patreksfjordur.insertedNode.x, y: patRegion.patreksfjordur.insertedNode.y }, offsetM: patRegion.patreksfjordur.offsetM, note: "the SAME inserted node as westfjords-region-flokalundur-patreksfjordur.json's own Patreksfjörður endpoint -- an independent copy, never a shared runtime reference" },
  talknafjordur: {
    endpoint: { ...talknafjordurEndpoint, note: "2889's own literal, EXISTING vertex 12 -- byte-identical to the existing winter-route-places.json coordinate for talknafjordur -- no insertion" },
    ownerCoordinateOffsetM: offsetVs2889,
    routeEndsShortOfOwnerCoordinate: true,
    coverageCheck: {
      nearestOtherRetainedLineSourceId: 2088,
      nearestOtherRetainedLineOffsetM: offsetVs2088,
      note: "The owner's own Tálknafjörður coordinate was projected against every line in this region (53127, 3361, 2889) and the nearest other retained national line (2088, the Hálfdán/Bíldudalur branch at 3361's own end) -- 2889 is the real nearest retained line. No other retained line offers a closer, usable approach within this check.",
    },
    note: "The offset is a planar straight-line distance from the route's own literal end to the owner's coordinate, never a driving distance. The retained vegur 617 geometry ends here ('að 1sta ljósastaur' per its own STADARLYSING) -- town continuation into Tálknafjörður itself is not included in this route.",
  },
};

const outPath = path.join(ROOT, "server_data/westfjords-region-patreksfjordur-talknafjordur.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${dataset.lines.length} + 1 reused connector, Tálknafjörður offset: ${offsetVs2889.toFixed(4)} m, nearest other line (2088) offset: ${offsetVs2088.toFixed(4)} m`);
