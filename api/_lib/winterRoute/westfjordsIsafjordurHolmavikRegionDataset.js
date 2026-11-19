// api/_lib/winterRoute/westfjordsIsafjordurHolmavikRegionDataset.js
//
// Ticket #501 westfjords-holmavik-mvp. Loads a FOURTH, independent
// Westfjords region runtime JSON
// (server_data/westfjords-region-isafjordur-holmavik.json, generated
// offline by
// docs/ai/tasks/ticket-501/westfjords-holmavik-mvp/build-westfjords-isafjordur-holmavik-region.mjs).
// Never reads or depends on any earlier Westfjords region file at request
// time -- all four stay fully independent. Tier 0, EPSG:3057. No caching,
// same as the sibling loaders.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-isafjordur-holmavik.json");

export function loadWestfjordsIsafjordurHolmavikRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    doc.tier !== 0 ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !doc.isafjordur?.endpoint ||
    !doc.holmavik?.endpoint ||
    !doc.holmavik?.junctionJ ||
    !doc.roundaboutCaveat
  ) {
    throw new Error("invalid_westfjords_isafjordur_holmavik_region_schema");
  }

  const canonical = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    isafjordur: doc.isafjordur,
    holmavik: doc.holmavik,
    roundaboutCaveat: doc.roundaboutCaveat,
  });
  const regionVersion = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    isafjordur: doc.isafjordur,
    holmavik: doc.holmavik,
    roundaboutCaveat: doc.roundaboutCaveat,
    source: doc.source ?? null,
    regionVersion,
  };
}
