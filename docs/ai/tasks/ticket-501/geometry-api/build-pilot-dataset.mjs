// Task-local, one-off build script (not production, not an ETL framework).
// Regenerates server_data/winter-route-geometry-pilot.json from the retained
// raw WFS files already on disk -- no network, no new data acquisition.
//
// Run with: node docs/ai/tasks/ticket-501/geometry-api/build-pilot-dataset.mjs
//
// Inputs (retained, read-only):
//   docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json        (VEGNR=1)
//   docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json (VEGNR=93)
//   docs/ai/tasks/ticket-493-place-data-phase2/samples/place_nodes-v3.json
//     (only for Selfoss/Hella's own retained exit_coord -- no cum-km
//     recomputation, no entry/exit re-derivation)
//
// Output: server_data/winter-route-geometry-pilot.json -- one fixed tier
// (2), 255 normalized lines (249 VEGNR=1 + 6 VEGNR=93), 5 pinned endpoints.
// The file does NOT store its own datasetVersion -- that is derived at
// load time by api/_lib/winterRoute/geometryDataset.js from the canonical
// line/endpoint content (see approved-prompt-v1.md P3).

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const TIER = 2;

const SOURCES = [
  { path: "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json", label: "vegnr1" },
  { path: "docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json", label: "road93" },
];

function sha256File(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

function loadTierLines(relPath, tier) {
  const absPath = path.join(ROOT, relPath);
  const doc = JSON.parse(fs.readFileSync(absPath, "utf8"));
  const basename = path.basename(relPath);
  const lines = [];
  for (const feat of doc.features) {
    const p = feat.properties;
    if (p.NAKVAEMNIFERLIS !== tier) continue;
    const vertices = feat.geometry.coordinates.map(([x, y, z]) => ({ x, y, z: z ?? null }));
    lines.push({
      sourceId: p.IDFERILL,
      idbutur: p.IDBUTUR,
      tier,
      veghluti: p.VEGHLUTI,
      name: p.STUTTNAFNLEIDAR ?? null,
      vertices,
      evidenceRef: `${basename}#IDFERILL=${p.IDFERILL}&OBJECTID=${p.OBJECTID}&tier=${tier}`,
    });
  }
  return lines;
}

function findLine(lines, sourceId) {
  const found = lines.find((l) => l.sourceId === sourceId);
  if (!found) throw new Error(`sourceId ${sourceId} not found at tier ${TIER}`);
  return found;
}

const linesVegnr1 = loadTierLines(SOURCES[0].path, TIER);
const linesRoad93 = loadTierLines(SOURCES[1].path, TIER);
const lines = [...linesVegnr1, ...linesRoad93];

// place_nodes-v3.json -- read ONLY for Selfoss (2138) / Hella (3591)'s own
// retained exit_coord. No recomputation of cum-km or entry/exit here.
const placeNodes = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "docs/ai/tasks/ticket-493-place-data-phase2/samples/place_nodes-v3.json"),
    "utf8"
  )
).nodes_by_idferill;

const r1Line = findLine(lines, 1436);
const e1Line = findLine(lines, 2344);
const s2Line = findLine(lines, 2894);

const endpoints = {
  "reykjavik-raudavatn": {
    x: r1Line.vertices[r1Line.vertices.length - 1].x,
    y: r1Line.vertices[r1Line.vertices.length - 1].y,
    sourceId: 1436,
    note: "1436's own western end (last raw vertex)",
  },
  selfoss: {
    x: placeNodes["2138"].exit_coord[0],
    y: placeNodes["2138"].exit_coord[1],
    sourceId: 2138,
    note: "2138's own retained exit_coord (place_nodes-v3.json)",
  },
  hella: {
    x: placeNodes["3591"].exit_coord[0],
    y: placeNodes["3591"].exit_coord[1],
    sourceId: 3591,
    note: "3591's own retained exit_coord (place_nodes-v3.json)",
  },
  egilsstadir: {
    x: e1Line.vertices[0].x,
    y: e1Line.vertices[0].y,
    sourceId: 2344,
    note: "2344's own start (first raw vertex)",
  },
  seydisfjordur: {
    x: s2Line.vertices[s2Line.vertices.length - 1].x,
    y: s2Line.vertices[s2Line.vertices.length - 1].y,
    sourceId: 2894,
    note: "2894's own end (last raw vertex)",
  },
};

const dataset = {
  schemaVersion: 1,
  normalizationVersion: 1,
  crs: "EPSG:3057",
  tier: TIER,
  sources: SOURCES.map((s) => ({
    file: s.path,
    sha256: sha256File(path.join(ROOT, s.path)),
  })),
  lines,
  endpoints,
};

const outPath = path.join(ROOT, "server_data/winter-route-geometry-pilot.json");
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n", "utf8");

console.log(`Wrote ${outPath}`);
console.log(`lines: ${lines.length}, vertices: ${lines.reduce((n, l) => n + l.vertices.length, 0)}`);
console.log("endpoints:", Object.keys(endpoints).join(", "));
