// api/_lib/winterRoute/westfjordsThroskuldarHolmavikRegionDataset.js
//
// Ticket #501 westfjords-throskuldar-mvp. Loads a SIXTH, independent
// Westfjords region runtime JSON
// (server_data/westfjords-region-throskuldar-holmavik.json, generated
// offline by
// docs/ai/tasks/ticket-501/westfjords-throskuldar-mvp/build-westfjords-throskuldar-holmavik-region.mjs).
// Never reads or depends on any earlier Westfjords region file at request
// time -- all six stay fully independent. Tier 0, EPSG:3057. No caching,
// same as the sibling loaders.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-throskuldar-holmavik.json");

export function loadWestfjordsThroskuldarHolmavikRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
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
    throw new Error("invalid_westfjords_throskuldar_holmavik_region_schema");
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
