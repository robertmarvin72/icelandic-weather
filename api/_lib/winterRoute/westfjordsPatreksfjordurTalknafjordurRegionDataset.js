// api/_lib/winterRoute/westfjordsPatreksfjordurTalknafjordurRegionDataset.js
//
// Ticket #501 westfjords-talknafjordur-mvp. Loads a NINTH, independent
// Westfjords region runtime JSON
// (server_data/westfjords-region-patreksfjordur-talknafjordur.json,
// generated offline by
// docs/ai/tasks/ticket-501/westfjords-talknafjordur-mvp/build-westfjords-patreksfjordur-talknafjordur-region.mjs).
// Never reads or depends on any earlier Westfjords region file at request
// time -- all nine stay fully independent. Tier 0, EPSG:3057. No caching,
// same as the sibling loaders.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/westfjords-region-patreksfjordur-talknafjordur.json");

export function loadWestfjordsPatreksfjordurTalknafjordurRegionDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    doc.tier !== 0 ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !doc.connector ||
    typeof doc.connector.sourceId !== "number" ||
    !doc.patreksfjordur?.insertedNode ||
    !doc.talknafjordur?.endpoint ||
    typeof doc.talknafjordur?.routeEndsShortOfOwnerCoordinate !== "boolean"
  ) {
    throw new Error("invalid_westfjords_patreksfjordur_talknafjordur_region_schema");
  }

  const canonical = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    connector: doc.connector,
    patreksfjordur: doc.patreksfjordur,
    talknafjordur: doc.talknafjordur,
  });
  const regionVersion = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    connector: doc.connector,
    patreksfjordur: doc.patreksfjordur,
    talknafjordur: doc.talknafjordur,
    source: doc.source ?? null,
    regionVersion,
  };
}
