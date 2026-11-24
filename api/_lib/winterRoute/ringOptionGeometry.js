// api/_lib/winterRoute/ringOptionGeometry.js
//
// Ticket #503 ring-options, P5(b) -- a PURE extraction of
// composeSouthOption/composeNorthOption out of api/winter-route-geometry.js
// (where they lived at roughly lines 274-331), so the new
// api/winter-route-data.js ring-pair branch can reuse the exact same
// production geometry-composition logic without a second, possibly
// drifting copy and without an HTTP self-call to the geometry API.
//
// Byte-for-byte unchanged behavior: no logic was altered, only moved.
// winter-route-geometry.js's own 8-variant JSON responses (south/north x
// Selfoss/Hella x both directions) are verified identical before/after
// this move in api/winter-route-geometry.test.js's own regression suite
// and in ringOptionGeometry.test.js's own snapshot comparison against the
// real handler.

import crypto from "crypto";
import { composeGeometryPath } from "./geometryComposition.js";
import { buildMvpDirectedInput } from "./raudavatnSelfossMvpPolicy.js";
import { buildNorthDirectedInput } from "./raudavatnSelfossNorthOption.js";

// South option: the existing, unchanged MVP pilot (buildMvpDirectedInput,
// south connector sourceId -1) -- byte-for-byte the same input as before
// ring-options-mvp existed (P3).
export function composeSouthOption(from, to, dataset) {
  const { lines: southLines, policy } = buildMvpDirectedInput({ lines: dataset.lines, tier: dataset.tier });
  const fromMapped = dataset.endpoints[from];
  const toMapped = dataset.endpoints[to];
  const result = composeGeometryPath({
    crs: dataset.crs,
    tier: dataset.tier,
    mode: "directed",
    policy,
    lines: southLines,
    from: { placeId: from, x: fromMapped.x, y: fromMapped.y },
    to: { placeId: to, x: toMapped.x, y: toMapped.y },
  });
  return { ...result, policyVersion: policy.policyVersion, linesById: new Map(southLines.map((l) => [l.sourceId, l])) };
}

// North option: two FIXED legs through the Egilsstaðir (E1) junction --
// from/to -> E1, then E1 -> to/from's own counterpart, using the SAME
// north lines/policy for both legs (P1/P2). Direction and option are
// independent: Selfoss->R1 north composes Selfoss->E1 then E1->R1 (which
// needs the two Hádegismóar connectors) -- never a mechanical reversal of
// the R1->Selfoss north result.
export function composeNorthOption(from, to, dataset) {
  const { lines: northLines, policy } = buildNorthDirectedInput({ lines: dataset.lines, tier: dataset.tier });
  const fromMapped = dataset.endpoints[from];
  const toMapped = dataset.endpoints[to];
  const e1 = dataset.endpoints.egilsstadir;
  const fromPoint = { placeId: from, x: fromMapped.x, y: fromMapped.y };
  const toPoint = { placeId: to, x: toMapped.x, y: toMapped.y };
  const e1Point = { placeId: "egilsstadir", x: e1.x, y: e1.y };
  const linesById = new Map(northLines.map((l) => [l.sourceId, l]));

  const composeLeg = (a, b) =>
    composeGeometryPath({ crs: dataset.crs, tier: dataset.tier, mode: "directed", policy, lines: northLines, from: a, to: b });

  const leg1 = composeLeg(fromPoint, e1Point);
  if (leg1.status !== "geometry_only") {
    return { status: "unsupported", reason: leg1.reason ?? "no_directed_path", policyVersion: policy.policyVersion, linesById };
  }
  const leg2 = composeLeg(e1Point, toPoint);
  if (leg2.status !== "geometry_only") {
    return { status: "unsupported", reason: leg2.reason ?? "no_directed_path", policyVersion: policy.policyVersion, linesById };
  }

  const slices = [...leg1.slices, ...leg2.slices];
  const lengthM = leg1.lengthM + leg2.lengthM;
  // A single combined id for the two-leg route -- derived from both real
  // leg geometryIds, never Date.now()/random, never reusing either leg's
  // own id alone (P5: stable per input, distinct per option/direction).
  const geometryId = crypto.createHash("sha256").update(`${leg1.geometryId}|${leg2.geometryId}`).digest("hex").slice(0, 32);

  return { status: "geometry_only", geometryId, lengthM, slices, policyVersion: policy.policyVersion, linesById };
}
