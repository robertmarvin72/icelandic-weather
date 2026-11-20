// api/winter-route-geometry.js
//
// Ticket #501 geometry-api — GET /api/winter-route-geometry?from=<id>&to=<id>
//
// A separate, geometry-only backend entry point. It does NOT touch, extend,
// or alias the existing fixed winter-route routeId/forecast/road/cache/UI
// contract (api/winter-route.js) in any way. Every response is machine-
// readable `geometry_only` | `same_place` | `unsupported` with a permanent
// `drivingAccess: "UNVERIFIED"` — never a legal driving route, never "safe",
// never wired into the existing winter-route weather/færð flow.
//
// Only the five previously-pinned native endpoints (reykjavik-raudavatn,
// selfoss, hella, egilsstadir, seydisfjordur) have a real coordinate mapping
// in this pilot round. The other 51 of the 56 known places are still real,
// known, visible places — they simply return `unsupported` /
// `endpoint_mapping_unavailable`, never a 400 and never "place does not
// exist". This is a first backend pilot for 5 endpoints, not an approved
// reduction to 5 places and not a promise the other 51 will ever be mapped.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadGeometryDataset } from "./_lib/winterRoute/geometryDataset.js";
import { composeGeometryPath, GEOMETRY_COMPOSITION_VERSION } from "./_lib/winterRoute/geometryComposition.js";
import { isRaudavatnSelfossPair, buildMvpDirectedInput } from "./_lib/winterRoute/raudavatnSelfossMvpPolicy.js";
import { buildNorthDirectedInput } from "./_lib/winterRoute/raudavatnSelfossNorthOption.js";
import { loadWestfjordsRegionDataset } from "./_lib/winterRoute/westfjordsRegionDataset.js";
import { loadWestfjordsFlokalundurRegionDataset } from "./_lib/winterRoute/westfjordsFlokalundurRegionDataset.js";
import { loadWestfjordsFlokalundurIsafjordurRegionDataset } from "./_lib/winterRoute/westfjordsFlokalundurIsafjordurRegionDataset.js";
import { loadWestfjordsIsafjordurHolmavikRegionDataset } from "./_lib/winterRoute/westfjordsIsafjordurHolmavikRegionDataset.js";
import { loadWestfjordsRoad68HolmavikRegionDataset } from "./_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.js";
import { loadWestfjordsThroskuldarHolmavikRegionDataset } from "./_lib/winterRoute/westfjordsThroskuldarHolmavikRegionDataset.js";
import { loadWestfjordsFlokalundurPatreksfjordurRegionDataset } from "./_lib/winterRoute/westfjordsFlokalundurPatreksfjordurRegionDataset.js";
import { loadWestfjordsPatreksfjordurTalknafjordurRegionDataset } from "./_lib/winterRoute/westfjordsPatreksfjordurTalknafjordurRegionDataset.js";
import { loadWestfjordsCombinedRegionDataset } from "./_lib/winterRoute/westfjordsCombinedRegionDataset.js";

const SCHEMA_VERSION = 1;

const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");
const KNOWN_PLACE_IDS = new Set(JSON.parse(fs.readFileSync(PLACES_PATH, "utf8")).places.map((p) => p.id));

// Ticket #501 ring-options-mvp + hella-ring-options-mvp: `option=south|north`
// is read for exactly these FOUR ordered pairs -- never a 3-place set,
// which would also (wrongly) catch Selfoss<->Hella. Hella-ring-options-mvp
// is a deliberate contract change: Rauðavatn<->Hella previously ignored
// `option` entirely (raudavatn-hella-mvp round); it now reads/validates it
// exactly like Rauðavatn<->Selfoss.
const RING_OPTIONS_PAIRS = new Set([
  "reykjavik-raudavatn|selfoss",
  "selfoss|reykjavik-raudavatn",
  "reykjavik-raudavatn|hella",
  "hella|reykjavik-raudavatn",
]);

// Ticket #501 westfjords-entry-mvp: the real Hringvegur(1)/vegur 60
// junction near Baulan/Norðurá -- a literal geometry node (3544's own
// vertex 0), never added to the general 56-place KNOWN_PLACE_IDS list.
// It is recognized ONLY as one side of this one exact pair with
// `budardalur` (the existing stable 56-list place, whose own entry in
// winter-route-places.json is never touched). Any other combination
// involving this id falls through to the normal known-place-id check
// below and is rejected the same as any other unrecognized string.
const JUNCTION_PLACE_ID = "junction-1-60-baulan";
function isWestfjordsEntryPair(from, to) {
  return (from === JUNCTION_PLACE_ID && to === "budardalur") || (from === "budardalur" && to === JUNCTION_PLACE_ID);
}

// Ticket #501 westfjords-flokalundur-mvp: a SECOND, independent Westfjords
// region/pair, one road segment further (Búðardalur<->Flókalundur). Never
// mixed with the entry region's own dataset/file -- `flokalundur` is
// recognized ONLY as one side of this one exact pair with the existing
// `budardalur` place id. Any other combination falls through to the
// normal known-place-id check below (P8).
const FLOKALUNDUR_PLACE_ID = "flokalundur";
function isWestfjordsFlokalundurPair(from, to) {
  return (from === FLOKALUNDUR_PLACE_ID && to === "budardalur") || (from === "budardalur" && to === FLOKALUNDUR_PLACE_ID);
}

// Ticket #501 westfjords-isafjordur-mvp: a THIRD, independent Westfjords
// region/pair, one road segment further (Flókalundur<->Ísafjörður).
// `isafjordur` IS already a known place id (winter-route-places.json, the
// 56-list) -- unlike `flokalundur`/`junction-1-60-baulan` -- but it has no
// entry in the main tier-2 pilot dataset's own endpoints, so every OTHER
// pair involving it still falls through to the existing
// `endpoint_mapping_unavailable` branch unchanged (P7). This branch is
// checked only for the one exact pair with `flokalundur`.
function isWestfjordsFlokalundurIsafjordurPair(from, to) {
  return (from === FLOKALUNDUR_PLACE_ID && to === "isafjordur") || (from === "isafjordur" && to === FLOKALUNDUR_PLACE_ID);
}

// Ticket #501 westfjords-holmavik-mvp: a FOURTH, independent Westfjords
// region/pair (Ísafjörður<->Hólmavík). `holmavik` is also already a known
// place id (like `isafjordur`), with no entry in the main tier-2 pilot's
// own endpoints, so every OTHER pair involving it keeps the existing
// `endpoint_mapping_unavailable` behavior unchanged. This branch is
// checked only for the one exact pair with `isafjordur`.
function isWestfjordsIsafjordurHolmavikPair(from, to) {
  return (from === "isafjordur" && to === "holmavik") || (from === "holmavik" && to === "isafjordur");
}

// Ticket #501 westfjords-road68-mvp: a FIFTH, independent Westfjords
// region/pair (Hólmavík<->the real Hringvegur(1)/vegur 68 junction near
// Staðarskáli). This new junction id is never added to KNOWN_PLACE_IDS
// (same convention as junction-1-60-baulan) -- any other pair involving
// it falls through to the general known-place-id gate below and is
// rejected the same as any other unrecognized string (400).
const JUNCTION_68_PLACE_ID = "junction-1-68-stadarskali";
function isWestfjordsRoad68HolmavikPair(from, to) {
  return (from === "holmavik" && to === JUNCTION_68_PLACE_ID) || (from === JUNCTION_68_PLACE_ID && to === "holmavik");
}

// Ticket #501 westfjords-throskuldar-mvp: a SIXTH, independent Westfjords
// region/pair (Hólmavík<->the real vegamót 60/61 junction at Gilsfjörður,
// near Þröskuldar). This new junction id is never added to
// KNOWN_PLACE_IDS (same convention as the other junction-* ids) -- any
// other pair involving it, including the other junction-* ids, falls
// through to the general known-place-id gate below and is rejected the
// same as any other unrecognized string (400).
const JUNCTION_THROSKULDAR_PLACE_ID = "junction-60-61-throskuldar";
function isWestfjordsThroskuldarHolmavikPair(from, to) {
  return (from === "holmavik" && to === JUNCTION_THROSKULDAR_PLACE_ID) || (from === JUNCTION_THROSKULDAR_PLACE_ID && to === "holmavik");
}

// Ticket #501 westfjords-patreksfjordur-mvp: an EIGHTH, independent
// Westfjords region/pair (Flókalundur<->Patreksfjörður via vegur 62).
// `patreksfjordur` is already a known place id (like `isafjordur`/
// `holmavik`), with no entry in the main tier-2 pilot's own endpoints, so
// every OTHER pair involving it keeps the existing
// `endpoint_mapping_unavailable` behavior unchanged. This branch is
// checked only for the one exact pair with `flokalundur`.
function isWestfjordsFlokalundurPatreksfjordurPair(from, to) {
  return (from === FLOKALUNDUR_PLACE_ID && to === "patreksfjordur") || (from === "patreksfjordur" && to === FLOKALUNDUR_PLACE_ID);
}

// Ticket #501 westfjords-talknafjordur-mvp: a TENTH, independent
// Westfjords region/pair (Patreksfjörður<->Tálknafjörður via Miklidalur).
// `patreksfjordur` and `talknafjordur` are both already known place ids,
// with no entry in the main tier-2 pilot's own endpoints, so every OTHER
// pair involving either one keeps the existing `endpoint_mapping_unavailable`
// behavior unchanged. This branch is checked only for the one exact pair.
function isWestfjordsPatreksfjordurTalknafjordurPair(from, to) {
  return (from === "patreksfjordur" && to === "talknafjordur") || (from === "talknafjordur" && to === "patreksfjordur");
}

// Ticket #501 closure-implementation (step 2): the ten new cross-leg
// Westfjords place pairs, composed from the merged `westfjords-region-combined.json`
// (a sourceId-level merge of the eight region files above -- never a
// replacement for them; each of the five existing direct place-pair
// branches above is checked FIRST and keeps using its own existing
// region file/loader, byte-identical). `budardalur<->flokalundur`,
// `flokalundur<->isafjordur`, `isafjordur<->holmavik`,
// `flokalundur<->patreksfjordur`, and `patreksfjordur<->talknafjordur`
// are deliberately NOT in this allowlist (they already have their own
// branch above). Junction ids (`junction-1-60-baulan`,
// `junction-1-68-stadarskali`, `junction-60-61-throskuldar`) are
// deliberately excluded -- composing a junction-to-junction pair on this
// merged, Ring-Road-line-free network silently returns a plausible but
// wrong long detour (confirmed in the closure-scope round: 219,478 m
// instead of the real 51,571 m), so junction ids are never added here.
const WESTFJORDS_COMBINED_ALLOWLIST = new Set([
  "budardalur|holmavik", "holmavik|budardalur",
  "budardalur|isafjordur", "isafjordur|budardalur",
  "budardalur|patreksfjordur", "patreksfjordur|budardalur",
  "budardalur|talknafjordur", "talknafjordur|budardalur",
  "flokalundur|holmavik", "holmavik|flokalundur",
  "flokalundur|talknafjordur", "talknafjordur|flokalundur",
  "isafjordur|patreksfjordur", "patreksfjordur|isafjordur",
  "isafjordur|talknafjordur", "talknafjordur|isafjordur",
  "holmavik|patreksfjordur", "patreksfjordur|holmavik",
  "holmavik|talknafjordur", "talknafjordur|holmavik",
]);
function isWestfjordsCombinedPair(from, to) {
  return WESTFJORDS_COMBINED_ALLOWLIST.has(`${from}|${to}`);
}

// Ticket #501 closure-implementation (step 2, B1): same_place for the six
// supported Westfjords place endpoints, including `flokalundur` (which is
// still never added to the general 56-list / KNOWN_PLACE_IDS -- only
// `flokalundur->flokalundur` becomes same_place, every other previously-400
// flokalundur pair is unchanged). Junction ids are deliberately excluded
// (`junction-*->junction-*` keeps its own existing behavior, never same_place).
const WESTFJORDS_SAME_PLACE_IDS = new Set(["budardalur", "flokalundur", "isafjordur", "holmavik", "patreksfjordur", "talknafjordur"]);
function isSupportedWestfjordsSamePlace(from, to) {
  return from === to && WESTFJORDS_SAME_PLACE_IDS.has(from);
}

// Own-key, strict-string param read -- never an inherited prototype
// property, never an array (repeated `?from=`), never echoed back on
// failure (same discipline as routes.js's resolveRouteId).
function readRequiredPlaceParam(query, key) {
  if (!query || typeof query !== "object" || !Object.prototype.hasOwnProperty.call(query, key)) {
    return { ok: false, reason: "missing_param" };
  }
  const v = query[key];
  if (typeof v !== "string" || v.length === 0) {
    return { ok: false, reason: "invalid_param" };
  }
  return { ok: true, value: v };
}

// A merged slice can span many original vertices (a bent polyline, not a
// straight chord) -- same technique as the geometry-core test file's own
// sumIndependently() helper, re-walking the original line's own vertex
// range in actual traversal order.
function expandSliceVertices(slice, linesById) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex);
  const hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}

// P5: skip the first vertex of every slice after the first -- it is the
// same XY as the previous slice's own last vertex. This also means a Z
// discrepancy at that shared boundary point is never "corrected": only
// the earlier slice's own recorded Z for that point is ever kept.
function buildCoordinates(slices, linesById) {
  const coords = [];
  slices.forEach((slice, i) => {
    const verts = expandSliceVertices(slice, linesById);
    const startAt = i === 0 ? 0 : 1;
    for (let j = startAt; j < verts.length; j++) {
      coords.push({ x: verts[j].x, y: verts[j].y, z: verts[j].z ?? null });
    }
  });
  return coords;
}

// P2: veghluti/name are source provenance pass-through, joined by sourceId
// -- never used in path selection, never a traversal-direction constraint.
// For a directed (e.g. the Rauðavatn<->Selfoss MVP pilot) result, the
// core's own `appliedRule`/`directionBasis` are passed through too. Every
// synthetic pilot connector (south: -1; north: -2, -3 -- all reserved
// negative sourceIds, never a real IDFERILL) is marked `estimated: true`,
// generically by sign, never for any other, real, retained source piece.
function buildResponseSlices(slices, linesById) {
  return slices.map((s) => {
    const line = linesById.get(s.sourceId);
    return {
      sourceId: s.sourceId,
      idbutur: s.idbutur,
      veghluti: line?.veghluti ?? null,
      name: line?.name ?? null,
      direction: s.direction,
      fromIndex: s.fromIndex,
      toIndex: s.toIndex,
      lengthM: s.lengthM,
      evidenceRef: s.evidenceRef,
      ...(s.appliedRule !== undefined ? { appliedRule: s.appliedRule, directionBasis: s.directionBasis } : {}),
      ...(s.sourceId < 0 ? { estimated: true } : {}),
    };
  });
}

// Ticket #501 ring-options-mvp -- real line names present in a result's
// own slices, matched against a small fixed candidate list (P6: a via
// marker is only ever applied when the matching name is actually found
// in the real composed slices, never a invented town-center pin; the
// dataset only has 5 pinned endpoints, no general place mapping).
const VIA_CANDIDATES = [
  { label: "Borgarnes", match: "Borgarnes" },
  { label: "Akureyri", match: "Akureyri" },
  { label: "Egilsstaðir", match: "Egilsstaðir" },
  { label: "Vík", match: "Vík" },
];
function computeVia(slices, linesById) {
  const names = new Set(slices.map((s) => linesById.get(s.sourceId)?.name).filter(Boolean));
  return VIA_CANDIDATES.filter((c) => [...names].some((n) => n.includes(c.match))).map((c) => c.label);
}

// South option: the existing, unchanged MVP pilot (buildMvpDirectedInput,
// south connector sourceId -1) -- byte-for-byte the same input as before
// ring-options-mvp existed (P3).
function composeSouthOption(from, to, dataset) {
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
function composeNorthOption(from, to, dataset) {
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

// routeIdPrefix is pair-specific ("raudavatn-selfoss" / "raudavatn-hella")
// -- hella-ring-options-mvp: the prefix used to be hardcoded to
// "raudavatn-selfoss", which would have given the Hella pair a
// misleading routeId. The Selfoss pair's own existing full routeId
// values are preserved verbatim (same prefix as before).
function describeOption(id, label, result, routeIdPrefix) {
  if (result.status !== "geometry_only") {
    return { id, label, unsupported: true, reason: result.reason ?? "unknown" };
  }
  return {
    id,
    label,
    lengthM: result.lengthM, // real measured length, never an assumed/copied estimate
    via: computeVia(result.slices, result.linesById),
    routeId: `${routeIdPrefix}-${id}-${result.geometryId}`,
  };
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
      return res.status(405).json({ error: "method_not_allowed" });
    }

    const fromParam = readRequiredPlaceParam(req.query, "from");
    if (!fromParam.ok) return res.status(400).json({ error: fromParam.reason, field: "from" });
    const toParam = readRequiredPlaceParam(req.query, "to");
    if (!toParam.ok) return res.status(400).json({ error: toParam.reason, field: "to" });

    const from = fromParam.value;
    const to = toParam.value;

    // Ticket #501 westfjords-entry-mvp: checked before the general
    // known-place-id gate, since the junction id is never part of that
    // list. Tier 0, a completely separate small region dataset -- never
    // mixed with the main tier-2 pilot dataset in one call (P4).
    if (isWestfjordsEntryPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = from === JUNCTION_PLACE_ID ? region.junction : region.budardalur.insertedNode;
      const toPoint = to === JUNCTION_PLACE_ID ? region.junction : region.budardalur.insertedNode;
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: region.lines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const westfjordsEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...westfjordsEnvelope, status: result.status, reason: result.reason ?? null });
      }

      const regionLinesById = new Map(region.lines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, regionLinesById);

      // P5: route-validated IdButur, in travel order, collapsed only when
      // consecutive slices already share the same value -- a stable basis
      // for #503, never a live færð tie-in, never a nearby candidate.
      const idButurIds = [];
      for (const s of result.slices) {
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P6: real line names only (never the owner CSV's own place names).
      // "Breiðabólstaður" is this chain's own real STUTTNAFNLEIDAR value --
      // the colloquial "Miðdalir" name the approved prompt also mentions
      // never appears literally in the retained geometry, so it is not
      // used as a separate via label here.
      const viaCandidates = [{ label: "Brattabrekka", match: "Brattabrekk" }, { label: "Breiðabólstaður", match: "Breiðabólstað" }];
      const realNames = new Set(result.slices.map((s) => regionLinesById.get(s.sourceId)?.name).filter(Boolean));
      const via = viaCandidates.filter((c) => [...realNames].some((n) => n.includes(c.match))).map((c) => c.label);

      return res.status(200).json({
        ...westfjordsEnvelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote: "Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract.",
        via,
        idButurIds,
        // Both sides of this pair are fixed (the junction and budardalur),
        // so this note always applies -- never conditional on which side
        // was `from` vs `to`.
        accessApproach: {
          ownerCoordinateOffsetM: region.budardalur.offsetM,
          note: "The owner's own Búðardalur coordinate sits this far from the literal route endpoint (a real point inserted into the retained road geometry, never a straight line to the owner point) -- shown for transparency, never counted in lengthM.",
        },
        coordinates,
        slices: buildResponseSlices(result.slices, regionLinesById),
      });
    }

    // Ticket #501 westfjords-flokalundur-mvp: checked before the general
    // known-place-id gate, same reasoning as the entry branch above --
    // `flokalundur` is never part of KNOWN_PLACE_IDS. A completely separate
    // tier-0 region dataset/file from the entry branch's own (P8); the one
    // real sub-centimetre gap in this chain (49925<->50566) is bridged by
    // exactly one reserved-negative-sourceId estimated connector line,
    // included directly in the composed `lines` array (P1).
    if (isWestfjordsFlokalundurPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsFlokalundurRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords flokalundur region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = from === FLOKALUNDUR_PLACE_ID ? region.flokalundur.insertedNode : region.budardalur.insertedNode;
      const toPoint = to === FLOKALUNDUR_PLACE_ID ? region.flokalundur.insertedNode : region.budardalur.insertedNode;
      const flkLines = [...region.lines, region.connector];
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: flkLines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const flkEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...flkEnvelope, status: result.status, reason: result.reason ?? null });
      }

      const flkLinesById = new Map(flkLines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, flkLinesById);
      const estimatedConnectorLengthM = result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0);

      // P5: route-validated IdButur, in travel order, collapsed only when
      // consecutive slices already share the same value. The one estimated
      // connector slice (idbutur: null) is skipped entirely -- it is not a
      // real IdButur and must never appear as a stray entry in this list.
      const idButurIds = [];
      for (const s of result.slices) {
        if (s.idbutur == null) continue;
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P6/P7: real line names only, same established pattern as the
      // entry branch's own `via` -- never the owner CSV's own place names,
      // never a branch-point candidate presented as a confirmed via stop.
      const viaCandidates = [
        { label: "Gilsfjörður", match: "Gilsfjörður" },
        { label: "Þorskafjörður", match: "Þorskafjörður" },
        { label: "Klettsháls", match: "Klettsháls" },
      ];
      const realNames = new Set(result.slices.map((s) => flkLinesById.get(s.sourceId)?.name).filter(Boolean));
      const via = viaCandidates.filter((c) => [...realNames].some((n) => n.includes(c.match))).map((c) => c.label);

      return res.status(200).json({
        ...flkEnvelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote: "Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract.",
        estimatedConnectorLengthM,
        via,
        idButurIds,
        // Only Flókalundur's own owner-coordinate offset is new in this
        // round -- Búðardalur reuses the same inserted node already
        // reported by the junction-1-60-baulan<->budardalur pair.
        accessApproach: {
          ownerCoordinateOffsetM: region.flokalundur.offsetM,
          note: "The owner's own Flókalundur coordinate sits this far from the literal route endpoint (a real point inserted into the retained road geometry, never a straight line to the owner point) -- shown for transparency, never counted in lengthM. The Búðardalur endpoint reuses the same inserted node already established for the junction-1-60-baulan<->budardalur pair.",
        },
        coordinates,
        slices: buildResponseSlices(result.slices, flkLinesById),
      });
    }

    // Ticket #501 westfjords-isafjordur-mvp: checked before the general
    // known-place-id gate, same reasoning as the other westfjords
    // branches above. A completely separate tier-0 region dataset/file
    // (P7); no connector is used or permitted in this round -- the
    // 18-line chain is literally connected end-to-end.
    if (isWestfjordsFlokalundurIsafjordurPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsFlokalundurIsafjordurRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords flokalundur-isafjordur region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = from === FLOKALUNDUR_PLACE_ID ? region.flokalundur.insertedNode : region.isafjordur.endpoint;
      const toPoint = to === FLOKALUNDUR_PLACE_ID ? region.flokalundur.insertedNode : region.isafjordur.endpoint;
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: region.lines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const isaEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...isaEnvelope, status: result.status, reason: result.reason ?? null });
      }

      const isaLinesById = new Map(region.lines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, isaLinesById);

      const idButurIds = [];
      for (const s of result.slices) {
        if (s.idbutur == null) continue;
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P7: real line names only -- "Dýrafjarðargöng" is this chain's own
      // real STUTTNAFNLEIDAR value for 38087. The colloquial "Vestfjarðagöng"
      // name (2618+2600) is used only as a map label (P8), never here,
      // since it never appears literally as a retained line name.
      const viaCandidates = [{ label: "Dýrafjarðargöng", match: "Dýrafjarðargöng" }];
      const realNames = new Set(result.slices.map((s) => isaLinesById.get(s.sourceId)?.name).filter(Boolean));
      const via = viaCandidates.filter((c) => [...realNames].some((n) => n.includes(c.match))).map((c) => c.label);

      return res.status(200).json({
        ...isaEnvelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote:
          "Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract. This chain passes through a roundabout (3834, VEGHLUTI 1, undirected): flokalundur->isafjordur traverses its arc in the line's own forward direction, isafjordur->flokalundur traverses the same arc against that direction (the core does not split a line into direction-dependent portions) -- a visible MVP caveat, not corrected in this round.",
        via,
        idButurIds,
        accessApproach: {
          ownerCoordinateOffsetM: region.isafjordur.offsetM,
          note: "The owner's own Ísafjörður coordinate sits this far from the literal route endpoint (3834's own existing vertex 5, never a new or inserted point, never a straight line to the owner point) -- shown for transparency, never counted in lengthM. This endpoint is deliberately NOT 3834's own full end, which is the existing winter-route-places.json coordinate for isafjordur, left byte-identical and unused by this pair.",
        },
        coordinates,
        slices: buildResponseSlices(result.slices, isaLinesById),
      });
    }

    // Ticket #501 westfjords-holmavik-mvp: checked before the general
    // known-place-id gate, same reasoning as the other westfjords
    // branches above. A completely separate tier-0 region dataset/file
    // (P8); no connector is used or permitted in this round -- the
    // 26-line chain is literally connected end-to-end.
    if (isWestfjordsIsafjordurHolmavikPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsIsafjordurHolmavikRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords isafjordur-holmavik region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = from === "isafjordur" ? region.isafjordur.endpoint : region.holmavik.endpoint;
      const toPoint = to === "isafjordur" ? region.isafjordur.endpoint : region.holmavik.endpoint;
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: region.lines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const holEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...holEnvelope, status: result.status, reason: result.reason ?? null });
      }

      const holLinesById = new Map(region.lines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, holLinesById);

      const idButurIds = [];
      for (const s of result.slices) {
        if (s.idbutur == null) continue;
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P5: real line names only, deliberately EXCLUDING "Ísafjörður" --
      // the retained line names "Djúpvegur: Ísafjörður" (3195/3626/3605/
      // 3419) name the FJORD at the head of Djúp, not the town, so
      // "Ísafjörður" is never a via candidate here. "Súðavík" matches the
      // real retained "Súðavíkurhlíð"/"Súðavík-Hjallar" names.
      const viaCandidates = [{ label: "Súðavík", match: "Súðavík" }, { label: "Steingrímsfjarðarheiði", match: "Steingrímsfjarðarheiði" }];
      const realNames = new Set(result.slices.map((s) => holLinesById.get(s.sourceId)?.name).filter(Boolean));
      const via = viaCandidates.filter((c) => [...realNames].some((n) => n.includes(c.match))).map((c) => c.label);

      return res.status(200).json({
        ...holEnvelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote:
          "Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract. This chain passes through a roundabout (3834, VEGHLUTI 1, undirected): isafjordur->holmavik traverses its arc against the line's own forward direction, holmavik->isafjordur follows that direction (the core does not split a line into direction-dependent portions) -- a visible MVP caveat, not corrected in this round.",
        via,
        idButurIds,
        accessApproach: {
          ownerCoordinateOffsetM: region.holmavik.offsetM,
          note: "The owner's own Hólmavík coordinate sits this far from the literal route endpoint (3883's own existing vertex 3, never a new or inserted point, never a straight line to the owner point) -- shown for transparency, never counted in lengthM. This endpoint is byte-identical to the existing winter-route-places.json coordinate for holmavik, left unchanged. It is deliberately NOT the Djúpvegur/Drangsnesvegur junction (3347's own vertex 0), which is further from the owner coordinate and is not this town's own approach.",
        },
        coordinates,
        slices: buildResponseSlices(result.slices, holLinesById),
      });
    }

    // Ticket #501 westfjords-road68-mvp: checked before the general
    // known-place-id gate, same reasoning as the other westfjords
    // branches above. A completely separate tier-0 region dataset/file
    // (P8); no connector is used or permitted in this round -- the
    // 12-line chain is literally connected end-to-end.
    if (isWestfjordsRoad68HolmavikPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsRoad68HolmavikRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords road68-holmavik region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = from === JUNCTION_68_PLACE_ID ? region.junction.endpoint : region.holmavik.endpoint;
      const toPoint = to === JUNCTION_68_PLACE_ID ? region.junction.endpoint : region.holmavik.endpoint;
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: region.lines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const road68Envelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...road68Envelope, status: result.status, reason: result.reason ?? null });
      }

      const road68LinesById = new Map(region.lines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, road68LinesById);

      const idButurIds = [];
      for (const s of result.slices) {
        if (s.idbutur == null) continue;
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P5: real line/IdButur names only, deliberately EXCLUDING
      // "Laxárdalsheiði" (the retained 68-segment names themselves
      // contain it, but the heiði itself is on vegur 59, never traveled
      // here), "Þröskuldar", "Djúpvegur" (ambiguous -- also names the
      // Hrófá-Hólmavík and Hólmavík-Drangsnesvegur IdButur entries), and
      // "Ísafjörður"/"Hólmavík"/"Staðarskáli" (never inferred from a
      // substring). "Innstrandavegur" comes from the retained IdButur
      // FulltNafnButs name (708 table), never from STUTTNAFNLEIDAR alone.
      const viaCandidates = [{ label: "Innstrandavegur", match: "Innstrandavegur" }, { label: "Broddanes", match: "Broddanes" }];
      const realNames = new Set(
        result.slices.flatMap((s) => {
          const line = road68LinesById.get(s.sourceId);
          return [line?.name, line?.idbuturName].filter(Boolean);
        })
      );
      const via = viaCandidates.filter((c) => [...realNames].some((n) => n.includes(c.match))).map((c) => c.label);

      // P2: no ownerCoordinateOffsetM for the junction end (the owner
      // point is never this endpoint); only Hólmavík's own, pre-existing
      // offset is reported, exactly like every earlier Hólmavík pair.
      const accessApproach = {
        ownerCoordinateOffsetM: region.holmavik.offsetM,
        note: "The owner's own Hólmavík coordinate sits this far from the literal route endpoint (3883's own existing vertex 3, byte-identical to the existing winter-route-places.json coordinate) -- shown for transparency, never counted in lengthM. The junction end has no owner-coordinate offset of its own: it represents the real Hringvegur(1)/vegur 68 junction (1796's own literal vertex 0), not the owner's separate Hrútafjörður reference point or the Staðarskáli town center.",
      };

      return res.status(200).json({
        ...road68Envelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote: "Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract. No roundabout or split-carriageway segment on this chain (VEGHLUTI 1 throughout); the Ísafjörður roundabout caveat from the isafjordur<->holmavik pair does not apply here (3834 is not on this route).",
        via,
        idButurIds,
        accessApproach,
        coordinates,
        slices: buildResponseSlices(result.slices, road68LinesById),
      });
    }

    // Ticket #501 westfjords-throskuldar-mvp: checked before the general
    // known-place-id gate, same reasoning as the other westfjords
    // branches above. A completely separate tier-0 region dataset/file
    // (P8); no connector is used or permitted in this round -- the
    // 4-line chain is literally connected end-to-end.
    if (isWestfjordsThroskuldarHolmavikPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsThroskuldarHolmavikRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords throskuldar-holmavik region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = from === JUNCTION_THROSKULDAR_PLACE_ID ? region.junction.endpoint : region.holmavik.endpoint;
      const toPoint = to === JUNCTION_THROSKULDAR_PLACE_ID ? region.junction.endpoint : region.holmavik.endpoint;
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: region.lines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const throskuldarEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...throskuldarEnvelope, status: result.status, reason: result.reason ?? null });
      }

      const throskuldarLinesById = new Map(region.lines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, throskuldarLinesById);

      const idButurIds = [];
      for (const s of result.slices) {
        if (s.idbutur == null) continue;
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P5: via fixed to exactly ["Þröskuldar"] -- the real retained name
      // of 3321/3324. Deliberately EXCLUDES "Djúpvegur" (ambiguous --
      // also names the Ísafjörður approach), "Hólmavík", "Gilsfjörður",
      // "Geiradalsvegur", "Innstrandavegur", "Þorskafjarðarheiði", and
      // "Ísafjörður" -- none of these are ever via candidates here.
      const viaCandidates = [{ label: "Þröskuldar", match: "Þröskuldar" }];
      const realNames = new Set(result.slices.map((s) => throskuldarLinesById.get(s.sourceId)?.name).filter(Boolean));
      const via = viaCandidates.filter((c) => [...realNames].some((n) => n.includes(c.match))).map((c) => c.label);

      // P2: no ownerCoordinateOffsetM for the junction end (the owner's
      // own Þröskuldar reference point is never this endpoint); only
      // Hólmavík's own, pre-existing offset is reported.
      const accessApproach = {
        ownerCoordinateOffsetM: region.holmavik.offsetM,
        note: "The owner's own Hólmavík coordinate sits this far from the literal route endpoint (3883's own existing vertex 3, byte-identical to the existing winter-route-places.json coordinate) -- shown for transparency, never counted in lengthM. The junction end has no owner-coordinate offset of its own: it represents the real vegamót 60/61 junction at Gilsfjörður (3321's own literal vertex 0), not the owner's separate Þröskuldar reference point on the mountain pass itself.",
      };

      return res.status(200).json({
        ...throskuldarEnvelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote: "Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract. No roundabout or split-carriageway segment on this chain (VEGHLUTI 1 throughout); the Ísafjörður roundabout caveat from the isafjordur<->holmavik pair does not apply here (3834 is not on this route). Þröskuldar is a mountain pass -- this response makes no claim about winter closure, driving conditions, or current access.",
        via,
        idButurIds,
        accessApproach,
        coordinates,
        slices: buildResponseSlices(result.slices, throskuldarLinesById),
      });
    }

    // Ticket #501 westfjords-patreksfjordur-mvp: checked before the
    // general known-place-id gate, same reasoning as the other
    // westfjords branches above. A completely separate tier-0 region
    // dataset/file (P9); the one real ~4.39 m gap in this chain
    // (2271<->53127) is bridged by exactly one reserved-negative-
    // sourceId estimated connector line, included directly in the
    // composed `lines` array (P2).
    if (isWestfjordsFlokalundurPatreksfjordurPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsFlokalundurPatreksfjordurRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords flokalundur-patreksfjordur region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = from === FLOKALUNDUR_PLACE_ID ? region.flokalundur.insertedNode : region.patreksfjordur.insertedNode;
      const toPoint = to === FLOKALUNDUR_PLACE_ID ? region.flokalundur.insertedNode : region.patreksfjordur.insertedNode;
      const patLines = [...region.lines, region.connector];
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: patLines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const patEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...patEnvelope, status: result.status, reason: result.reason ?? null });
      }

      const patLinesById = new Map(patLines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, patLinesById);
      const estimatedConnectorLengthM = result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0);

      const idButurIds = [];
      for (const s of result.slices) {
        if (s.idbutur == null) continue;
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P6: via fixed to exactly ["Brjánslækur", "Kleifaheiði"] -- real
      // retained names on the chain ("Flókalundur-Brjánslækur",
      // "Brjánslækur-Siglunesvegur", "Kleifaheiði"). Deliberately
      // EXCLUDES "Siglunesvegur", "Flókalundur", "Patreksfjörður" (the
      // endpoints themselves), "Raknadalshlíð", "Dynjandisheiði",
      // "Bíldudalur", "Tálknafjörður", "Miklidalur", and any ferry name
      // (Flatey/Baldur) -- the road via Brjánslækur is distinct from the
      // Baldur ferry, never implied here.
      const viaCandidates = [{ label: "Brjánslækur", match: "Brjánslækur" }, { label: "Kleifaheiði", match: "Kleifaheiði" }];
      const realNames = new Set(result.slices.map((s) => patLinesById.get(s.sourceId)?.name).filter(Boolean));
      const via = viaCandidates.filter((c) => [...realNames].some((n) => n.includes(c.match))).map((c) => c.label);

      return res.status(200).json({
        ...patEnvelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote:
          "Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract. This chain includes one real ~4.39 m gap (between the retained lines 2271 and 53127) bridged by a single estimated connector, surfaced separately as estimatedConnectorLengthM -- not a confirmed WFS/driving connection. Kleifaheiði is a mountain pass; this response makes no claim about winter closure, driving conditions, or current access. The Baldur ferry from Brjánslækur is out of scope and never implied by this road route.",
        estimatedConnectorLengthM,
        via,
        idButurIds,
        accessApproach: {
          ownerCoordinateOffsetM: region.patreksfjordur.offsetM,
          note: "The owner's own Patreksfjörður coordinate sits this far from the literal route endpoint (a real point inserted into 53127's own retained geometry, never a straight line to the owner point) -- shown for transparency, never counted in lengthM. The Flókalundur endpoint reuses the same inserted node already established for the budardalur<->flokalundur pair.",
        },
        coordinates,
        slices: buildResponseSlices(result.slices, patLinesById),
      });
    }

    // Ticket #501 westfjords-talknafjordur-mvp: checked before the
    // general known-place-id gate, same reasoning as the other
    // westfjords branches above. A completely separate tier-0 region
    // dataset/file (P4); reuses 53127 and the existing -5 connector
    // byte-identical from the flokalundur-patreksfjordur region (P2),
    // included directly in the composed `lines` array.
    if (isWestfjordsPatreksfjordurTalknafjordurPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsPatreksfjordurTalknafjordurRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords patreksfjordur-talknafjordur region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = from === "patreksfjordur" ? region.patreksfjordur.insertedNode : region.talknafjordur.endpoint;
      const toPoint = to === "patreksfjordur" ? region.patreksfjordur.insertedNode : region.talknafjordur.endpoint;
      const talLines = [...region.lines, region.connector];
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: talLines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const talEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...talEnvelope, status: result.status, reason: result.reason ?? null });
      }

      const talLinesById = new Map(talLines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, talLinesById);
      const estimatedConnectorLengthM = result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0);

      const idButurIds = [];
      for (const s of result.slices) {
        if (s.idbutur == null) continue;
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P6: via fixed to exactly ["Miklidalur"] -- the real retained name
      // of 3361. Deliberately EXCLUDES "Bíldudalur" (only ever appears in
      // 3361's own STADARLYSING, never a via candidate), "Hálfdán",
      // "Kleifaheiði", "Raknadalshlíð", and the endpoints themselves
      // ("Patreksfjörður"/"Tálknafjörður"/"Tálknafjarðarvegur").
      const viaCandidates = [{ label: "Miklidalur", match: "Miklidalur" }];
      const realNames = new Set(result.slices.map((s) => talLinesById.get(s.sourceId)?.name).filter(Boolean));
      const via = viaCandidates.filter((c) => [...realNames].some((n) => n.includes(c.match))).map((c) => c.label);

      return res.status(200).json({
        ...talEnvelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote:
          "Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract. This chain reuses the ~4.39 m estimated connector between the start of 3361 (same coordinates as the end of 2271) and 53127, surfaced separately as estimatedConnectorLengthM. The route ends at the end of the retained vegur 617 (Tálknafjarðarvegur) geometry and does not reach the owner's own Tálknafjörður coordinate -- town continuation into Tálknafjörður itself is not included. Bíldudalur, the Hálfdán branch, and any ferry connection are out of scope. This response makes no claim about winter closure, driving conditions, current access, or whether any road or service is open.",
        estimatedConnectorLengthM,
        via,
        idButurIds,
        accessApproach: {
          patreksfjordur: { ownerCoordinateOffsetM: region.patreksfjordur.offsetM },
          talknafjordur: { ownerCoordinateOffsetM: region.talknafjordur.ownerCoordinateOffsetM, routeEndsShortOfOwnerCoordinate: region.talknafjordur.routeEndsShortOfOwnerCoordinate },
          note: "Both offsets are planar straight-line distances from each route endpoint to that place's own owner coordinate, never driving distances, never counted in lengthM. The Patreksfjörður endpoint is a real inserted point on retained road geometry; the Tálknafjörður endpoint is the retained vegur 617 geometry's own literal end, which does not reach the owner's own coordinate -- routeEndsShortOfOwnerCoordinate is true for that reason, not an error.",
        },
        coordinates,
        slices: buildResponseSlices(result.slices, talLinesById),
      });
    }

    // Ticket #501 closure-implementation (step 2, B1): same_place for the
    // six supported Westfjords endpoints, checked before the general
    // known-place-id gate (so it also catches `flokalundur`, which is
    // never in that gate's own list). Every other id's own same_place
    // behavior (the five ring-pilot ids) and every other pair's own
    // existing contract is unaffected.
    if (isSupportedWestfjordsSamePlace(from, to)) {
      let region;
      try {
        region = loadWestfjordsCombinedRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords combined region dataset load error (same_place)");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }
      const endpoint = region.endpoints[from];
      const geometryId = crypto.createHash("sha256").update(`same_place:${from}:${endpoint.x}:${endpoint.y}:${endpoint.z ?? "null"}`).digest("hex").slice(0, 32);
      const accessApproach = {
        [from]: {
          ownerCoordinateOffsetM: endpoint.offsetM,
          ...(from === "talknafjordur" ? { routeEndsShortOfOwnerCoordinate: true } : {}),
        },
        note:
          from === "talknafjordur"
            ? "This is the same vegur 617 approach point used by every other Tálknafjörður pair (2889's own vertex 12), not the owner's own town coordinate -- town continuation into Tálknafjörður itself is not included. Never counted in lengthM (lengthM is 0 here because from and to are the same literal point)."
            : "The owner's own coordinate offset for this endpoint, shown for transparency, never counted in lengthM (lengthM is 0 here because from and to are the same literal point).",
      };
      return res.status(200).json({
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
        status: "same_place",
        geometryId,
        lengthM: 0,
        lengthNote: "Tier-0 planar geometry (EPSG:3057) -- from and to are the same literal point, so lengthM is 0. This is not a new claim about town access, driving conditions, or current road status.",
        via: [],
        idButurIds: [],
        estimatedConnectorLengthM: 0,
        coordinates: [{ x: endpoint.x, y: endpoint.y, z: endpoint.z ?? null }],
        slices: [],
        accessApproach,
      });
    }

    // Ticket #501 closure-implementation (step 2, B2): the ten new
    // cross-leg Westfjords pairs, composed on the merged
    // westfjords-region-combined.json. Checked after every existing
    // specific Westfjords branch (so those five pairs keep using their
    // own existing, byte-identical branch above) and before the general
    // known-place-id gate.
    if (isWestfjordsCombinedPair(from, to)) {
      let region;
      try {
        region = loadWestfjordsCombinedRegionDataset();
      } catch {
        console.error("winter-route-geometry: westfjords combined region dataset load error");
        return res.status(500).json({ error: "geometry_dataset_error" });
      }

      const fromPoint = region.endpoints[from];
      const toPoint = region.endpoints[to];
      const combinedLines = [...region.lines, ...region.connectors];
      const result = composeGeometryPath({
        crs: region.crs,
        tier: region.tier,
        lines: combinedLines,
        from: { placeId: from, x: fromPoint.x, y: fromPoint.y },
        to: { placeId: to, x: toPoint.x, y: toPoint.y },
      });

      const combinedEnvelope = {
        schemaVersion: SCHEMA_VERSION,
        compositionVersion: GEOMETRY_COMPOSITION_VERSION,
        regionVersion: region.regionVersion,
        from,
        to,
        crs: region.crs,
        tier: region.tier,
        drivingAccess: "UNVERIFIED",
      };

      if (result.status !== "geometry_only") {
        return res.status(200).json({ ...combinedEnvelope, status: result.status, reason: result.reason ?? null });
      }

      const combinedLinesById = new Map(combinedLines.map((l) => [l.sourceId, l]));
      const coordinates = buildCoordinates(result.slices, combinedLinesById);
      const estimatedConnectorLengthM = result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0);

      const idButurIds = [];
      for (const s of result.slices) {
        if (s.idbutur == null) continue;
        if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
      }

      // P5: via from exactly these eight real retained names, substring
      // match in real travel order, first occurrence only -- the same
      // established pattern as every earlier branch, just with a longer
      // candidate list (this corridor spans every earlier round's own
      // via vocabulary). Deliberately EXCLUDES "Bíldudalur"/"Hálfdán"/
      // "Súðavík"/"Steingrímsfjarðarheiði"/"Innstrandavegur"/"Broddanes"/
      // "Djúpvegur" (ambiguous) and every endpoint's own town name.
      // 3611's own extra `idbuturName` metadata field is never read here
      // -- only the real `name` field drives via, exactly as before.
      const viaCandidates = [
        { label: "Gilsfjörður", match: "Gilsfjörður" },
        { label: "Þorskafjörður", match: "Þorskafjörður" },
        { label: "Klettsháls", match: "Klettsháls" },
        { label: "Þröskuldar", match: "Þröskuldar" },
        { label: "Brjánslækur", match: "Brjánslækur" },
        { label: "Kleifaheiði", match: "Kleifaheiði" },
        { label: "Dýrafjarðargöng", match: "Dýrafjarðargöng" },
        { label: "Miklidalur", match: "Miklidalur" },
      ];
      const via = [];
      for (const slice of result.slices) {
        const name = combinedLinesById.get(slice.sourceId)?.name;
        if (!name) continue;
        for (const candidate of viaCandidates) {
          if (name.includes(candidate.match) && !via.includes(candidate.label)) via.push(candidate.label);
        }
      }

      // P6: lengthNote assembled from the real slices actually on THIS
      // result -- never reused from another pair. Each connector that is
      // actually present contributes its own sentence; the Ísafjörður
      // roundabout caveat appears only when isafjordur is an endpoint,
      // with the direction read from the real 3834 slice; the
      // Tálknafjörður coverage-gap caveat appears only when talknafjordur
      // is an endpoint; the Kleifaheiði/Brjánslækur corridor caveat
      // appears only when the real result actually uses one of those
      // corridor's own lines.
      const noteParts = ["Tier-0 planar geometry length (EPSG:3057), reprojected offline from WGS84 -- not a driving-distance contract."];
      if (result.slices.some((s) => s.sourceId === -4)) noteParts.push("This chain includes the ~5 mm estimated connector (sourceId -4) bridging the Búðardalur<->Flókalundur gap, surfaced separately in estimatedConnectorLengthM.");
      if (result.slices.some((s) => s.sourceId === -5)) noteParts.push("This chain includes the ~4.39 m estimated connector (sourceId -5) bridging the Patreksfjörður approach gap, surfaced separately in estimatedConnectorLengthM.");
      const slice3834 = result.slices.find((s) => s.sourceId === 3834);
      if (slice3834) {
        noteParts.push(
          `This chain passes through a roundabout (3834, VEGHLUTI 1, undirected): this direction traverses its own arc ${slice3834.direction === "reverse" ? "against" : "in"} the line's own forward direction (the core does not split a line into direction-dependent portions) -- a visible MVP caveat, not corrected here.`
        );
      }
      if (from === "talknafjordur" || to === "talknafjordur") {
        noteParts.push("The route ends at the retained vegur 617 (Tálknafjarðarvegur) geometry's own literal end and does not reach the owner's own Tálknafjörður coordinate -- town continuation into Tálknafjörður itself is not included.");
      }
      const ROAD_62_CORRIDOR_SOURCE_IDS = new Set([3698, 3339, 3334, 3332, 2271, 3361, 2889, 53127, -5]);
      if (result.slices.some((s) => ROAD_62_CORRIDOR_SOURCE_IDS.has(s.sourceId))) {
        noteParts.push("Kleifaheiði is a mountain pass; the Baldur ferry from Brjánslækur is out of scope and never implied by this road route.");
      }
      noteParts.push("This response makes no claim about winter closure, driving conditions, current access, or whether any road or service is open.");

      const accessApproachEntry = (placeId) => ({
        ownerCoordinateOffsetM: region.endpoints[placeId].offsetM,
        ...(placeId === "talknafjordur" ? { routeEndsShortOfOwnerCoordinate: true } : {}),
      });

      return res.status(200).json({
        ...combinedEnvelope,
        status: result.status,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote: noteParts.join(" "),
        estimatedConnectorLengthM,
        via,
        idButurIds,
        accessApproach: {
          [from]: accessApproachEntry(from),
          [to]: accessApproachEntry(to),
          note: "Each offset is a planar straight-line distance from that endpoint's own route point to that place's own owner coordinate, never a driving distance, never counted in lengthM.",
        },
        coordinates,
        slices: buildResponseSlices(result.slices, combinedLinesById),
      });
    }

    if (!KNOWN_PLACE_IDS.has(from)) return res.status(400).json({ error: "unknown_place_id", field: "from" });
    if (!KNOWN_PLACE_IDS.has(to)) return res.status(400).json({ error: "unknown_place_id", field: "to" });

    let dataset;
    try {
      dataset = loadGeometryDataset();
    } catch {
      console.error("winter-route-geometry: dataset load error");
      return res.status(500).json({ error: "geometry_dataset_error" });
    }

    const envelope = {
      schemaVersion: SCHEMA_VERSION,
      datasetVersion: dataset.datasetVersion,
      compositionVersion: GEOMETRY_COMPOSITION_VERSION,
      from,
      to,
      crs: dataset.crs,
      tier: dataset.tier,
      drivingAccess: "UNVERIFIED",
    };

    const fromMapped = dataset.endpoints[from];
    const toMapped = dataset.endpoints[to];
    if (!fromMapped || !toMapped) {
      // Known place, no native endpoint mapping in this pilot -- never a
      // fabricated same_place, even when from === to (P6).
      return res.status(200).json({ ...envelope, status: "unsupported", reason: "endpoint_mapping_unavailable" });
    }

    // Ticket #501 Rauðavatn<->Selfoss/Hella MVP pilot (owner-approved): all
    // four ordered pairs run through the directed south core. Ticket #501
    // ring-options-mvp + hella-ring-options-mvp add `option=south|north`
    // for all four of them -- a deliberate contract change for
    // Rauðavatn<->Hella, which previously ignored `option` entirely
    // (raudavatn-hella-mvp round) and now validates/reads it exactly like
    // Rauðavatn<->Selfoss. Every pair outside the four-pair pilot keeps
    // calling the plain undirected core exactly as before -- unchanged
    // request, same old response shape, and any `option` query value is
    // simply ignored for them (same as any other unlisted query parameter
    // already is here, never a new 400 case).
    const isMvpPair = isRaudavatnSelfossPair(from, to);
    const isRingOptionsPair = RING_OPTIONS_PAIRS.has(`${from}|${to}`);

    let result;
    let linesById;

    if (isMvpPair && isRingOptionsPair) {
      const optionQuery = req.query && typeof req.query === "object" && Object.prototype.hasOwnProperty.call(req.query, "option") ? req.query.option : undefined;
      let requestedOption = null;
      if (optionQuery !== undefined) {
        if (typeof optionQuery !== "string" || (optionQuery !== "south" && optionQuery !== "north")) {
          return res.status(400).json({ error: "invalid_option", field: "option" });
        }
        requestedOption = optionQuery;
      }

      const south = composeSouthOption(from, to, dataset);
      const north = composeNorthOption(from, to, dataset);
      const routeIdPrefix = (from === "hella" || to === "hella") ? "raudavatn-hella" : "raudavatn-selfoss";
      const options = [
        describeOption("south", "Short route via Hellisheiði", south, routeIdPrefix),
        describeOption("north", "Long route via the Route 1 ring (Vesturland/Norðurland/Austurland)", north, routeIdPrefix),
      ];

      let selectedOption = requestedOption;
      if (!selectedOption) {
        // Default: the shorter REAL measured supported option (P5) -- not
        // a hardcoded preference, even though south is always shorter in
        // practice for this pair.
        const southOk = south.status === "geometry_only";
        const northOk = north.status === "geometry_only";
        selectedOption = southOk && northOk ? (south.lengthM <= north.lengthM ? "south" : "north") : southOk ? "south" : "north";
      }

      result = selectedOption === "south" ? south : north;
      linesById = result.linesById;

      if (result.status === "unsupported") {
        return res.status(200).json({ ...envelope, status: "unsupported", reason: result.reason, selectedOption, options });
      }

      const coordinates = buildCoordinates(result.slices, linesById);
      const estimatedConnectorLengthM = result.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0);

      return res.status(200).json({
        ...envelope,
        status: result.status,
        mode: "directed",
        policyVersion: result.policyVersion,
        selectedOption,
        options,
        geometryId: result.geometryId,
        lengthM: result.lengthM,
        lengthNote: "Tier-2 planar geometry length (EPSG:3057) -- not a driving-distance contract.",
        estimatedConnectorLengthM,
        coordinates,
        slices: buildResponseSlices(result.slices, linesById),
      });
    }

    // isRaudavatnSelfossPair's own four ordered pairs and RING_OPTIONS_PAIRS
    // are now (hella-ring-options-mvp) exactly the same four pairs, so the
    // branch above always runs whenever `isMvpPair` is true -- no separate
    // "MVP pair without options" case remains to handle here.

    result = composeGeometryPath({
      crs: dataset.crs,
      tier: dataset.tier,
      lines: dataset.lines,
      from: { placeId: from, x: fromMapped.x, y: fromMapped.y },
      to: { placeId: to, x: toMapped.x, y: toMapped.y },
    });

    if (result.status === "unsupported") {
      return res.status(200).json({ ...envelope, status: "unsupported", reason: result.reason });
    }

    linesById = new Map(dataset.lines.map((l) => [l.sourceId, l]));
    const coordinates =
      result.status === "same_place"
        ? [{ x: fromMapped.x, y: fromMapped.y, z: null }]
        : buildCoordinates(result.slices, linesById);

    return res.status(200).json({
      ...envelope,
      status: result.status, // "geometry_only" | "same_place"
      geometryId: result.geometryId,
      lengthM: result.lengthM,
      lengthNote: "Tier-2 planar geometry length (EPSG:3057) -- not a driving-distance contract.",
      coordinates,
      slices: buildResponseSlices(result.slices, linesById),
    });
  } catch {
    console.error("winter-route-geometry: handler error");
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "winter_route_geometry_error" });
  }
}
