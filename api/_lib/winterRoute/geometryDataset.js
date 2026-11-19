// api/_lib/winterRoute/geometryDataset.js
//
// Ticket #501 geometry-api — loads the pilot geometry runtime JSON
// (server_data/winter-route-geometry-pilot.json, generated offline by
// docs/ai/tasks/ticket-501/geometry-api/build-pilot-dataset.mjs — this
// module never touches docs/ or the network). `datasetVersion` is NOT
// read from the file; it is a canonical-content hash derived here at
// load time over the normalized runtime contract (schema/tier/CRS,
// stable ordered lines, endpoint mapping) — never Date.now()/random,
// never a self-embedded hash (approved-prompt-v1.md P3).

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_DATASET_PATH = path.join(process.cwd(), "server_data/winter-route-geometry-pilot.json");

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Reads and validates the pilot dataset, computing `datasetVersion` fresh
 * each call (no module-level cache — this pilot has no perf/cache
 * requirement, per P6). Throws on a missing file or a schema that fails
 * the checks below; callers (the endpoint handler) turn that into a 500,
 * never a fabricated 200.
 */
export function loadGeometryDataset(datasetPath = DEFAULT_DATASET_PATH) {
  const raw = fs.readFileSync(datasetPath, "utf8");
  const doc = JSON.parse(raw);

  if (
    doc.crs !== "EPSG:3057" ||
    typeof doc.tier !== "number" ||
    !Number.isFinite(doc.schemaVersion) ||
    !Array.isArray(doc.lines) ||
    doc.lines.length === 0 ||
    !isPlainObject(doc.endpoints)
  ) {
    throw new Error("invalid_geometry_dataset_schema");
  }

  const canonicalPayload = JSON.stringify({
    schemaVersion: doc.schemaVersion,
    normalizationVersion: doc.normalizationVersion ?? null,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    endpoints: doc.endpoints,
  });
  const datasetVersion = crypto.createHash("sha256").update(canonicalPayload).digest("hex");

  return {
    schemaVersion: doc.schemaVersion,
    normalizationVersion: doc.normalizationVersion ?? null,
    crs: doc.crs,
    tier: doc.tier,
    lines: doc.lines,
    endpoints: doc.endpoints,
    sources: doc.sources ?? [],
    datasetVersion,
  };
}
