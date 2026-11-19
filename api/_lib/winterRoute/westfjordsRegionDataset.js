// api/_lib/winterRoute/westfjordsRegionDataset.js
//
// Ticket #501 westfjords-entry-mvp. Loads the first Westfjords region
// runtime JSON (server_data/westfjords-region-1-60-budardalur.json,
// generated offline by
// docs/ai/tasks/ticket-501/westfjords-entry-mvp/build-westfjords-region.mjs
// -- this module never touches docs/ or the network, same discipline as
// geometryDataset.js). Tier 0, EPSG:3057 -- never mixed with the main
// tier-2 pilot dataset in a single call. No caching (no perf/cache
// requirement for this one small region, same as geometryDataset.js).

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-1-60-budardalur.json");

export function loadWestfjordsRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    doc.tier !== 0 ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !doc.junction ||
    !doc.budardalur ||
    !doc.budardalur.insertedNode
  ) {
    throw new Error("invalid_westfjords_region_schema");
  }

  const canonical = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    junction: doc.junction,
    budardalur: doc.budardalur,
  });
  const regionVersion = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    junction: doc.junction,
    budardalur: doc.budardalur,
    dalsmynni: doc.dalsmynni ?? null,
    source: doc.source ?? null,
    regionVersion,
  };
}
