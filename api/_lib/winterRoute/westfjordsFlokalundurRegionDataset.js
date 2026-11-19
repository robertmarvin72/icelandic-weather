// api/_lib/winterRoute/westfjordsFlokalundurRegionDataset.js
//
// Ticket #501 westfjords-flokalundur-mvp. Loads the SECOND, independent
// Westfjords region runtime JSON
// (server_data/westfjords-region-budardalur-flokalundur.json, generated
// offline by
// docs/ai/tasks/ticket-501/westfjords-flokalundur-mvp/build-westfjords-flokalundur-region.mjs).
// Never reads or depends on westfjords-region-1-60-budardalur.json at
// request time -- the two regions stay fully independent (P8). Tier 0,
// EPSG:3057. No caching, same as westfjordsRegionDataset.js.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-budardalur-flokalundur.json");

export function loadWestfjordsFlokalundurRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    doc.tier !== 0 ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !doc.connector ||
    typeof doc.connector.sourceId !== "number" ||
    !doc.budardalur?.insertedNode ||
    !doc.flokalundur?.insertedNode ||
    !doc.flokalundur?.junction6062
  ) {
    throw new Error("invalid_westfjords_flokalundur_region_schema");
  }

  const canonical = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    connector: doc.connector,
    budardalur: doc.budardalur,
    flokalundur: doc.flokalundur,
  });
  const regionVersion = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    connector: doc.connector,
    budardalur: doc.budardalur,
    flokalundur: doc.flokalundur,
    source: doc.source ?? null,
    regionVersion,
  };
}
