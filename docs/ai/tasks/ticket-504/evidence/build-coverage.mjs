// Ticket #504 — task-local, read-only coverage builder. Offline only: pure
// local geometry composition via the real resolver modules (no network
// call, no counted upstream request). Never reads
// server_data/winter-route-places.json for routable status (P3c) — place
// list comes from src/lib/winterRoutePlaces.js, pair families from
// src/pages/winterRoutePairClassification.js, per-pair geometry from the
// real api/_lib/winterRoute/*Route.js resolvers.
import { writeFileSync, readFileSync } from "node:fs";
import { WINTER_ROUTE_PLACES } from "../../../../../src/lib/winterRoutePlaces.js";
import {
  isBudardalurHolmavikPair,
  isWestfjordsBatchPair,
  isWestfjordsCompletionPair,
  isRingOptionPair,
  isRingCompletionPair,
} from "../../../../../src/pages/winterRoutePairClassification.js";

import { resolveBudardalurHolmavikGeometry, orderedForecastPoints } from "../../../../../api/_lib/winterRoute/budardalurHolmavikRoute.js";
import { resolveWestfjordsBatchGeometry } from "../../../../../api/_lib/winterRoute/westfjordsBatchRoute.js";
import { resolveWestfjordsCompletionGeometry } from "../../../../../api/_lib/winterRoute/westfjordsCompletionRoute.js";
import { resolveRingOptionGeometry } from "../../../../../api/_lib/winterRoute/ringOptionsRoute.js";
import { resolveRingCompletionGeometry } from "../../../../../api/_lib/winterRoute/ringCompletionRoute.js";

const ids = WINTER_ROUTE_PLACES.map((p) => p.id);
const pairs = [];
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]]);
}

function familyOf(a, b) {
  if (isBudardalurHolmavikPair(a, b)) return "budardalur-holmavik";
  if (isWestfjordsBatchPair(a, b)) return "westfjords-batch";
  if (isWestfjordsCompletionPair(a, b)) return "westfjords-completion";
  if (isRingOptionPair(a, b)) return "ring-option";
  if (isRingCompletionPair(a, b)) return "ring-completion";
  return "unsupported-mixed";
}

const connected = [];
const unsupported = [];

for (const [a, b] of pairs) {
  const family = familyOf(a, b);
  if (family === "unsupported-mixed") {
    unsupported.push({ pair: [a, b] });
    continue;
  }

  if (family === "budardalur-holmavik") {
    const geo = resolveBudardalurHolmavikGeometry(a, b);
    const pts = orderedForecastPoints(a);
    connected.push({
      pair: [a, b], family, identityKind: "region",
      geometryId: geo.geometryId, regionVersion: geo.regionVersion,
      lengthM: geo.lengthM, idButurCount: geo.idButurList.length, idButurList: geo.idButurList,
      pointCount: pts.length, pointIds: pts.map((p) => p.id),
    });
  } else if (family === "westfjords-batch") {
    const geo = resolveWestfjordsBatchGeometry(a, b);
    connected.push({
      pair: [a, b], family, identityKind: "region",
      geometryId: geo.geometryId, regionVersion: geo.regionVersion,
      lengthM: geo.lengthM, idButurCount: geo.idButurList.length, idButurList: geo.idButurList,
      pointCount: geo.pointIds.length, pointIds: geo.pointIds, unmappedLengthM: geo.unmappedLengthM,
    });
  } else if (family === "westfjords-completion") {
    const geo = resolveWestfjordsCompletionGeometry(a, b);
    connected.push({
      pair: [a, b], family, identityKind: "region",
      geometryId: geo.geometryId, regionVersion: geo.regionVersion,
      lengthM: geo.lengthM, idButurCount: geo.idButurList.length, idButurList: geo.idButurList,
      pointCount: geo.pointIds.length, pointIds: geo.pointIds, unmappedLengthM: geo.unmappedLengthM,
    });
  } else if (family === "ring-option") {
    const variants = {};
    for (const option of ["south", "north"]) {
      const geo = resolveRingOptionGeometry(a, b, option);
      if (geo.ok) {
        variants[option] = {
          geometryId: geo.geometryId, lengthM: geo.lengthM,
          idButurCount: geo.idButurList.length, idButurList: geo.idButurList,
          pointCount: geo.pointIds.length, pointIds: geo.pointIds,
        };
      } else {
        variants[option] = { ok: false, reason: geo.reason };
      }
    }
    connected.push({ pair: [a, b], family, identityKind: "option", variants });
  } else if (family === "ring-completion") {
    const geo = resolveRingCompletionGeometry(a, b);
    connected.push({
      pair: [a, b], family, identityKind: "generic",
      geometryId: geo.geometryId, datasetVersion: geo.datasetVersion,
      lengthM: geo.lengthM, idButurCount: geo.idButurList.length, idButurList: geo.idButurList,
      pointCount: geo.pointIds.length, pointIds: geo.pointIds,
    });
  }
}

// P3(b)/(c) -- cross-check against the 56-place file BY ID, documenting
// the discrepancy, never reading its connectionStatus as a routable
// source. Read-only; the file itself is not modified anywhere in #504.
const placesJsonRaw = JSON.parse(readFileSync(new URL("../../../../../server_data/winter-route-places.json", import.meta.url)));
const sixtySixIds = new Set(placesJsonRaw.places ? placesJsonRaw.places.map((p) => p.id) : Object.keys(placesJsonRaw));
// Fallback probe of shape, logged either way below.
const placesArray = Array.isArray(placesJsonRaw) ? placesJsonRaw : placesJsonRaw.places || [];
const sixtySixIdSet = new Set(placesArray.map((p) => p.id));
const uiIdsIn56 = ids.filter((id) => sixtySixIdSet.has(id));
const uiIdsNotIn56 = ids.filter((id) => !sixtySixIdSet.has(id));

const coverage = {
  generatedBy: "docs/ai/tasks/ticket-504/evidence/build-coverage.mjs (offline, read-only, no network call)",
  generatedAtNote: "timestamps intentionally omitted -- this is a structural coverage snapshot, not a live-fetch artifact",
  uiPlaces: WINTER_ROUTE_PLACES,
  totalUiPlaces: ids.length,
  totalPossiblePairs: pairs.length,
  connectedPairs: connected,
  totalConnectedPairs: connected.length,
  unsupportedMixedPairs: unsupported,
  totalUnsupportedMixedPairs: unsupported.length,
  sixtySixPlaceFile: {
    path: "server_data/winter-route-places.json",
    totalEntries: placesArray.length,
    uiIdsPresentInFile: uiIdsIn56,
    uiIdsPresentCount: uiIdsIn56.length,
    uiIdsMissingFromFile: uiIdsNotIn56,
    note: "Matched by id only, never by connectionStatus (P3c) -- that field is an access-point provenance status in the 56-place file, not a routable/coverage source for this project's 11-place UI list. Not modified here.",
  },
};

const outPath = new URL("./coverage.json", import.meta.url);
writeFileSync(outPath, JSON.stringify(coverage, null, 2));
console.log("wrote", outPath.pathname);
console.log("connected:", connected.length, "unsupported:", unsupported.length, "total pairs:", pairs.length);
console.log("UI ids in 56-file:", uiIdsIn56.length, "of", ids.length, "-- missing:", uiIdsNotIn56);
