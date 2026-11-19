// api/_lib/winterRoute/westfjordsFlokalundurIsafjordurRegionDataset.js
//
// Ticket #501 westfjords-isafjordur-mvp. Loads a THIRD, independent
// Westfjords region runtime JSON
// (server_data/westfjords-region-flokalundur-isafjordur.json, generated
// offline by
// docs/ai/tasks/ticket-501/westfjords-isafjordur-mvp/build-westfjords-flokalundur-isafjordur-region.mjs).
// Never reads or depends on either earlier Westfjords region file at
// request time -- all three stay fully independent. Tier 0, EPSG:3057.
// No caching, same as the sibling loaders.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-flokalundur-isafjordur.json");

export function loadWestfjordsFlokalundurIsafjordurRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    doc.tier !== 0 ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !doc.flokalundur?.insertedNode ||
    !doc.isafjordur?.endpoint ||
    !doc.isafjordur?.placesJsonNode ||
    !doc.roundaboutCaveat
  ) {
    throw new Error("invalid_westfjords_flokalundur_isafjordur_region_schema");
  }

  const canonical = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    flokalundur: doc.flokalundur,
    isafjordur: doc.isafjordur,
    roundaboutCaveat: doc.roundaboutCaveat,
  });
  const regionVersion = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    flokalundur: doc.flokalundur,
    isafjordur: doc.isafjordur,
    roundaboutCaveat: doc.roundaboutCaveat,
    source: doc.source ?? null,
    regionVersion,
  };
}
