// Task-local, one-off build script (not production). Regenerates
// server_data/westfjords-region-combined.json by merging the eight
// already-approved Westfjords region files by sourceId -- no network, no
// new acquisition, no forward WGS84->EPSG3057 transform (every vertex is
// already native EPSG:3057 in the source files). None of the eight
// source region files is modified by this script.
//
// Run with: node docs/ai/tasks/ticket-501/closure-implementation/build-westfjords-combined-region.mjs
//
// Merge contract (ticket #501 closure-implementation P1):
// - 7 sourceIds overlap across the 8 regions: 2769, 3648, 3833, 3834,
//   3883, 53127 (6 of them JSON-identical across every copy) and 3611
//   (identical core geometry/idbutur/name/veghluti/evidenceRef, but the
//   junction-1-68-stadarskali region's own copy carries an extra
//   `idbuturName` field that the junction-60-61-throskuldar region's own
//   copy lacks). The merged copy of 3611 KEEPS that extra field (a
//   superset, never a silent drop) -- confirmed closure-scope P1.
// - Any other, unexpected mismatch on an overlapping sourceId is a STOP,
//   never a silent snapping/epsilon/overwrite.
// - Both existing connectors (-4, -5) are reused byte-identical, never
//   recreated.
// - The six place endpoints (B/F/I/H/P/T) and their owner-coordinate
//   offsets are copied verbatim from whichever existing region file
//   established them -- the Búðardalur offset in particular exists ONLY
//   in the junction-1-60-baulan<->budardalur region's own file (the
//   budardalur<->flokalundur region's own copy of the same node carries
//   no offsetM of its own), so it must come from there, not be
//   recomputed.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsRegionDataset.js";
import { loadWestfjordsFlokalundurRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsFlokalundurRegionDataset.js";
import { loadWestfjordsFlokalundurIsafjordurRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsFlokalundurIsafjordurRegionDataset.js";
import { loadWestfjordsIsafjordurHolmavikRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsIsafjordurHolmavikRegionDataset.js";
import { loadWestfjordsRoad68HolmavikRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.js";
import { loadWestfjordsThroskuldarHolmavikRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsThroskuldarHolmavikRegionDataset.js";
import { loadWestfjordsFlokalundurPatreksfjordurRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsFlokalundurPatreksfjordurRegionDataset.js";
import { loadWestfjordsPatreksfjordurTalknafjordurRegionDataset } from "../../../../../api/_lib/winterRoute/westfjordsPatreksfjordurTalknafjordurRegionDataset.js";

const ROOT = process.cwd();

const entry = loadWestfjordsRegionDataset(); // junction-1-60-baulan <-> budardalur
const flk = loadWestfjordsFlokalundurRegionDataset(); // budardalur <-> flokalundur
const flkIsa = loadWestfjordsFlokalundurIsafjordurRegionDataset(); // flokalundur <-> isafjordur
const isaHol = loadWestfjordsIsafjordurHolmavikRegionDataset(); // isafjordur <-> holmavik
const road68 = loadWestfjordsRoad68HolmavikRegionDataset(); // junction-1-68-stadarskali <-> holmavik
const thro = loadWestfjordsThroskuldarHolmavikRegionDataset(); // junction-60-61-throskuldar <-> holmavik
const flkPat = loadWestfjordsFlokalundurPatreksfjordurRegionDataset(); // flokalundur <-> patreksfjordur
const patTal = loadWestfjordsPatreksfjordurTalknafjordurRegionDataset(); // patreksfjordur <-> talknafjordur

const allRegions = [
  { name: "entry", region: entry },
  { name: "flk", region: flk },
  { name: "flkIsa", region: flkIsa },
  { name: "isaHol", region: isaHol },
  { name: "road68", region: road68 },
  { name: "thro", region: thro },
  { name: "flkPat", region: flkPat },
  { name: "patTal", region: patTal },
];

function coreFields(line) {
  return { sourceId: line.sourceId, idbutur: line.idbutur, tier: line.tier, veghluti: line.veghluti, name: line.name, vertices: line.vertices, evidenceRef: line.evidenceRef };
}

const bySourceId = new Map();
const owningRegionBySourceId = new Map();
for (const { name, region } of allRegions) {
  for (const line of region.lines) {
    if (!bySourceId.has(line.sourceId)) {
      bySourceId.set(line.sourceId, line);
      owningRegionBySourceId.set(line.sourceId, [name]);
      continue;
    }
    owningRegionBySourceId.get(line.sourceId).push(name);
    const existing = bySourceId.get(line.sourceId);
    const coreExisting = JSON.stringify(coreFields(existing));
    const coreNew = JSON.stringify(coreFields(line));
    if (coreExisting !== coreNew) {
      throw new Error(`STOP: sourceId ${line.sourceId} has mismatched core fields between regions ${owningRegionBySourceId.get(line.sourceId).join(",")} -- expected identical geometry/idbutur/tier/veghluti/name/evidenceRef`);
    }
    // Core fields match. If one copy carries extra metadata (e.g. 3611's
    // own idbuturName in road68), keep the superset -- never drop it.
    if (Object.keys(line).length > Object.keys(existing).length) {
      bySourceId.set(line.sourceId, line);
    }
  }
}

const overlapping = [...owningRegionBySourceId.entries()].filter(([, names]) => names.length > 1);
console.log("overlapping sourceIds:", overlapping.map(([id, names]) => `${id}(${names.join("+")})`).join(", "));
if (overlapping.length !== 7) throw new Error(`STOP: expected exactly 7 overlapping sourceIds, got ${overlapping.length}`);

const line3611 = bySourceId.get(3611);
if (!("idbuturName" in line3611)) throw new Error("STOP: merged 3611 lost its own idbuturName metadata");
if (JSON.stringify(line3611) !== JSON.stringify(road68.lines.find((l) => l.sourceId === 3611))) {
  throw new Error("STOP: merged 3611 does not match the junction-1-68-stadarskali region's own full copy (the superset)");
}

const mergedLines = [...bySourceId.values()];
console.log("merged non-connector line count:", mergedLines.length);

// Both existing connectors, reused byte-identical -- never recreated.
const connectorsBySourceId = new Map();
for (const { name, region } of allRegions) {
  if (!region.connector) continue;
  if (connectorsBySourceId.has(region.connector.sourceId)) {
    const existingConnector = connectorsBySourceId.get(region.connector.sourceId);
    if (JSON.stringify(existingConnector) !== JSON.stringify(region.connector)) {
      throw new Error(`STOP: connector sourceId ${region.connector.sourceId} differs between regions`);
    }
    continue;
  }
  connectorsBySourceId.set(region.connector.sourceId, region.connector);
}
const connectors = [...connectorsBySourceId.values()];
console.log("connectors:", connectors.map((c) => c.sourceId).join(","));
if (connectors.length !== 2) throw new Error(`STOP: expected exactly 2 connectors (-4, -5), got ${connectors.length}`);

// Look up a vertex's own real z by matching x/y on a known line -- used
// for budardalur below, whose own `insertedNode` metadata object (in
// every region file that carries one) never stored a z field, even
// though the real line's own vertex does. Reading it directly from the
// line avoids silently defaulting to null for a point that genuinely has
// a real z (24.473128257522806, confirmed against line 2769's own
// vertex 3 -- the exact value this round's own approved prompt cites).
function findVertexZ(line, x, y) {
  const vertex = line.vertices.find((v) => v.x === x && v.y === y);
  if (!vertex) throw new Error(`STOP: no vertex matching (${x}, ${y}) found on sourceId ${line.sourceId}`);
  return vertex.z;
}

// The six place endpoints -- copied verbatim from whichever region
// already established them. The Búðardalur offset exists ONLY in the
// entry region's own file.
const line2769 = bySourceId.get(2769);
const endpoints = {
  budardalur: {
    x: flk.budardalur.insertedNode.x,
    y: flk.budardalur.insertedNode.y,
    z: findVertexZ(line2769, flk.budardalur.insertedNode.x, flk.budardalur.insertedNode.y),
    offsetM: entry.budardalur.offsetM,
  },
  flokalundur: {
    x: flk.flokalundur.insertedNode.x,
    y: flk.flokalundur.insertedNode.y,
    z: flk.flokalundur.insertedNode.z ?? 0,
    offsetM: flk.flokalundur.offsetM,
  },
  isafjordur: {
    x: flkIsa.isafjordur.endpoint.x,
    y: flkIsa.isafjordur.endpoint.y,
    z: flkIsa.isafjordur.endpoint.z ?? 0,
    offsetM: flkIsa.isafjordur.offsetM,
  },
  holmavik: {
    x: isaHol.holmavik.endpoint.x,
    y: isaHol.holmavik.endpoint.y,
    z: isaHol.holmavik.endpoint.z ?? 0,
    offsetM: isaHol.holmavik.offsetM,
  },
  patreksfjordur: {
    x: flkPat.patreksfjordur.insertedNode.x,
    y: flkPat.patreksfjordur.insertedNode.y,
    z: flkPat.patreksfjordur.insertedNode.z ?? 0,
    offsetM: flkPat.patreksfjordur.offsetM,
  },
  talknafjordur: {
    x: patTal.talknafjordur.endpoint.x,
    y: patTal.talknafjordur.endpoint.y,
    z: patTal.talknafjordur.endpoint.z ?? 0,
    offsetM: patTal.talknafjordur.ownerCoordinateOffsetM,
    routeEndsShortOfOwnerCoordinate: true,
  },
};

// Cross-check every endpoint x/y against a fresh independent load of its
// own owning region (never trust a single read) before writing.
if (endpoints.budardalur.x !== flk.budardalur.insertedNode.x) throw new Error("STOP: budardalur x mismatch");
if (endpoints.talknafjordur.offsetM !== patTal.talknafjordur.ownerCoordinateOffsetM) throw new Error("STOP: talknafjordur offset mismatch");

const dataset = {
  schemaVersion: 1,
  crs: "EPSG:3057",
  tier: 0,
  source: {
    note: "Merged by sourceId from the eight already-approved Westfjords region files; no new WGS84 transform, no new acquisition.",
    mergedFrom: [
      "server_data/westfjords-region-1-60-budardalur.json",
      "server_data/westfjords-region-budardalur-flokalundur.json",
      "server_data/westfjords-region-flokalundur-isafjordur.json",
      "server_data/westfjords-region-isafjordur-holmavik.json",
      "server_data/westfjords-region-1-68-holmavik.json",
      "server_data/westfjords-region-throskuldar-holmavik.json",
      "server_data/westfjords-region-flokalundur-patreksfjordur.json",
      "server_data/westfjords-region-patreksfjordur-talknafjordur.json",
    ],
  },
  lines: mergedLines,
  connectors,
  endpoints,
};

const outPath = path.join(ROOT, "server_data/westfjords-region-combined.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`lines: ${dataset.lines.length}, connectors: ${dataset.connectors.length}, endpoints: ${Object.keys(dataset.endpoints).join(",")}`);
