// api/_lib/winterRoute/westfjordsFlokalundurPatreksfjordurRegionDataset.js
//
// Ticket #501 westfjords-patreksfjordur-mvp. Loads a SEVENTH, independent
// Westfjords region runtime JSON
// (server_data/westfjords-region-flokalundur-patreksfjordur.json,
// generated offline by
// docs/ai/tasks/ticket-501/westfjords-patreksfjordur-mvp/build-westfjords-flokalundur-patreksfjordur-region.mjs).
// Never reads or depends on any earlier Westfjords region file at request
// time -- all seven stay fully independent. Tier 0, EPSG:3057. No
// caching, same as the sibling loaders.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-flokalundur-patreksfjordur.json");

export function loadWestfjordsFlokalundurPatreksfjordurRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    doc.tier !== 0 ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !doc.connector ||
    typeof doc.connector.sourceId !== "number" ||
    !doc.flokalundur?.insertedNode ||
    !doc.patreksfjordur?.insertedNode ||
    !doc.patreksfjordur?.placesJsonNode
  ) {
    throw new Error("invalid_westfjords_flokalundur_patreksfjordur_region_schema");
  }

  const canonical = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    connector: doc.connector,
    flokalundur: doc.flokalundur,
    patreksfjordur: doc.patreksfjordur,
  });
  const regionVersion = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    connector: doc.connector,
    flokalundur: doc.flokalundur,
    patreksfjordur: doc.patreksfjordur,
    source: doc.source ?? null,
    regionVersion,
  };
}
