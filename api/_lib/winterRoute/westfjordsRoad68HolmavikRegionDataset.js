// api/_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.js
//
// Ticket #501 westfjords-road68-mvp. Loads a FIFTH, independent
// Westfjords region runtime JSON
// (server_data/westfjords-region-1-68-holmavik.json, generated offline by
// docs/ai/tasks/ticket-501/westfjords-road68-mvp/build-westfjords-road68-holmavik-region.mjs).
// Never reads or depends on any earlier Westfjords region file at request
// time -- all five stay fully independent. Tier 0, EPSG:3057. No caching,
// same as the sibling loaders.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-1-68-holmavik.json");

export function loadWestfjordsRoad68HolmavikRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    doc.tier !== 0 ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !doc.junction?.endpoint ||
    !doc.holmavik?.endpoint
  ) {
    throw new Error("invalid_westfjords_road68_holmavik_region_schema");
  }

  const canonical = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    junction: doc.junction,
    holmavik: doc.holmavik,
  });
  const regionVersion = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    junction: doc.junction,
    holmavik: doc.holmavik,
    source: doc.source ?? null,
    regionVersion,
  };
}
