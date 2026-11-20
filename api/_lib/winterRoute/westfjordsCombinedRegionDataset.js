// api/_lib/winterRoute/westfjordsCombinedRegionDataset.js
//
// Ticket #501 closure-implementation. Loads the merged Westfjords region
// runtime JSON (server_data/westfjords-region-combined.json, generated
// offline by
// docs/ai/tasks/ticket-501/closure-implementation/build-westfjords-combined-region.mjs)
// -- a sourceId-level merge of the eight already-approved Westfjords
// region files, used ONLY for the ten new cross-leg place pairs. The
// eight existing region files and their own loaders are never read by
// this loader and are never modified by this ticket's own work; their
// own existing API branches keep using their own existing loaders
// unchanged. Tier 0, EPSG:3057. No caching, same as every sibling loader.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-combined.json");

export function loadWestfjordsCombinedRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    doc.tier !== 0 ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !Array.isArray(doc.connectors) ||
    doc.connectors.length !== 2 ||
    !doc.endpoints ||
    !["budardalur", "flokalundur", "isafjordur", "holmavik", "patreksfjordur", "talknafjordur"].every((id) => doc.endpoints[id])
  ) {
    throw new Error("invalid_westfjords_combined_region_schema");
  }

  const canonical = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    connectors: doc.connectors,
    endpoints: doc.endpoints,
  });
  const regionVersion = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    connectors: doc.connectors,
    endpoints: doc.endpoints,
    source: doc.source ?? null,
    regionVersion,
  };
}
