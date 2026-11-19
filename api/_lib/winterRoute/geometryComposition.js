// api/_lib/winterRoute/geometryComposition.js
//
// Ticket #501 — geometry-composition core (first bounded implementation
// round, approved-prompt-v1.md). A PURE module: takes normalized native
// EPSG:3057 line data and endpoint coordinates as arguments only. No fs,
// no network, no import from docs/ — callers (tests, future API code)
// are responsible for reading retained/production data and handing it
// in. This is a geometry-only composition core, never a driving-
// direction or route-legality authority — see `drivingAccess` below.
//
// -- Contract --
// input = {
//   crs: "EPSG:3057",            // only this CRS is accepted
//   tier: <number>,              // one precision tier for this whole call
//   lines: [
//     {
//       sourceId: <number>,      // stable numeric source-piece ID (IDFERILL)
//       idbutur: <number|string|null>,
//       tier: <number>,          // must equal input.tier for every line
//       vertices: [{ x, y, z }, ...],  // ordered, as digitized, native metres
//       evidenceRef: <string>,   // stable human-readable source pointer
//     }, ...
//   ],
//   from: { placeId: <string>, x: <number>, y: <number> },
//   to:   { placeId: <string>, x: <number>, y: <number> },
// }
//
// result.status is always one of: "geometry_only" | "same_place" | "unsupported".
// NEVER "SUPPORTED"/"ROUTABLE"/"safe" — this module has no authority over
// driving access, legal direction, or whether a place is usable in the
// app. `drivingAccess: "UNVERIFIED"` is always present on a non-error
// result as an explicit, permanent reminder of that boundary.
//
// Matching is by LITERAL XY equality only — no snapping, no epsilon, no
// nearest-vertex fallback. An endpoint that is not an exact vertex of
// some line is `unsupported` with reason "endpoint_not_in_graph".
//
// Shortest path is computed on the UNDIRECTED planar graph (edge weight
// = native-metre Euclidean distance between the two literal endpoints
// of that edge) — this is geometry, not a claim about legal traffic
// direction in either direction of travel.

import crypto from "node:crypto";

export const GEOMETRY_COMPOSITION_VERSION = 1;

const REASON = {
  UNSUPPORTED_CRS: "unsupported_crs",
  MISSING_ENDPOINT: "missing_endpoint",
  MIXED_TIER_INPUT: "mixed_tier_input",
  CONFLICTING_IDENTITY_GEOMETRY: "conflicting_identity_geometry",
  CONFLICTING_ENDPOINT_INPUT: "conflicting_endpoint_input",
  ENDPOINT_NOT_IN_GRAPH: "endpoint_not_in_graph",
  DISCONNECTED_GRAPH: "disconnected_graph",
  // Directed mode (ticket #501 directed-composition) -- see the
  // "Directed traversal mode" section below for the full contract.
  INVALID_MODE: "invalid_mode",
  INVALID_POLICY: "invalid_policy",
  NO_DIRECTED_PATH: "no_directed_path",
  DIRECTED_RESULT_NOT_REVERSIBLE: "directed_result_not_reversible",
};

export const UNSUPPORTED_REASONS = REASON;

function vertexKey(x, y) {
  // Literal equality only. Numbers are used as-is (no rounding) — two
  // vertices are "the same point" iff their x and y are the same IEEE754
  // double, exactly as retained in the source data.
  return `${x}|${y}`;
}

function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function sameGeometryContent(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].x !== b[i].x || a[i].y !== b[i].y) return false;
    // z deliberately not compared here for identity purposes, per spec
    // (z is source metadata, never connectivity) — but kept on the node
    // separately; two re-submissions of the same XY path with different
    // z are not treated as a geometry conflict.
  }
  return true;
}

function unsupported(reason, extra = {}) {
  return { status: "unsupported", reason, drivingAccess: "UNVERIFIED", ...extra };
}

/**
 * Builds the undirected planar graph for one call. Returns either
 * { ok: true, nodes, edgesByNode, lineById } or { ok: false, result }
 * where `result` is a ready-to-return unsupported/error result.
 */
function buildGraph(input) {
  if (!input || input.crs !== "EPSG:3057") {
    return { ok: false, result: unsupported(REASON.UNSUPPORTED_CRS) };
  }
  if (!isFiniteNumber(input.tier)) {
    return { ok: false, result: unsupported(REASON.MIXED_TIER_INPUT, { detail: "input.tier missing or not numeric" }) };
  }
  const tier = input.tier;
  const lines = Array.isArray(input.lines) ? input.lines : [];

  // nodes: vertexKey -> { x, y, id, zValues: Set }
  const nodes = new Map();
  let nextNodeId = 0;
  function getOrCreateNode(x, y, z) {
    const key = vertexKey(x, y);
    let node = nodes.get(key);
    if (!node) {
      node = { id: nextNodeId++, x, y, zValues: new Set() };
      nodes.set(key, node);
    }
    if (isFiniteNumber(z)) node.zValues.add(z);
    return node;
  }

  const lineById = new Map(); // sourceId -> { sourceId, idbutur, tier, vertices, evidenceRef, nodeSeq }
  // edgesByNode: nodeId -> array of raw edge candidates (both directions recorded)
  const rawEdgesByNode = new Map();
  function addRawEdge(fromNode, toNode, info) {
    if (!rawEdgesByNode.has(fromNode.id)) rawEdgesByNode.set(fromNode.id, []);
    rawEdgesByNode.get(fromNode.id).push({ toNodeId: toNode.id, ...info });
  }

  for (const line of lines) {
    if (!line || !isFiniteNumber(line.sourceId) || !Array.isArray(line.vertices) || line.vertices.length < 2) {
      return { ok: false, result: unsupported(REASON.MIXED_TIER_INPUT, { detail: "malformed line entry" }) };
    }
    if (line.tier !== tier) {
      return { ok: false, result: unsupported(REASON.MIXED_TIER_INPUT, { detail: `line ${line.sourceId} tier ${line.tier} != input.tier ${tier}` }) };
    }
    const existing = lineById.get(line.sourceId);
    if (existing) {
      if (!sameGeometryContent(existing.vertices, line.vertices)) {
        return {
          ok: false,
          result: unsupported(REASON.CONFLICTING_IDENTITY_GEOMETRY, { detail: `sourceId ${line.sourceId} resubmitted with different geometry at tier ${tier}` }),
        };
      }
      continue; // exact duplicate resubmission -- already processed, never double-count edges
    }

    const nodeSeq = [];
    for (let i = 0; i < line.vertices.length; i++) {
      const v = line.vertices[i];
      if (!isFiniteNumber(v.x) || !isFiniteNumber(v.y)) {
        return { ok: false, result: unsupported(REASON.MIXED_TIER_INPUT, { detail: `line ${line.sourceId} vertex ${i} missing x/y` }) };
      }
      nodeSeq.push(getOrCreateNode(v.x, v.y, v.z));
    }

    for (let i = 0; i < nodeSeq.length - 1; i++) {
      const a = nodeSeq[i];
      const b = nodeSeq[i + 1];
      if (a.id === b.id) continue; // zero-length consecutive step -- skipped, ring (shared node identity) untouched
      const len = distance(a.x, a.y, b.x, b.y);
      addRawEdge(a, b, { length: len, sourceId: line.sourceId, idbutur: line.idbutur ?? null, tier, fromIndex: i, toIndex: i + 1, direction: 1, evidenceRef: line.evidenceRef ?? null });
      addRawEdge(b, a, { length: len, sourceId: line.sourceId, idbutur: line.idbutur ?? null, tier, fromIndex: i + 1, toIndex: i, direction: -1, evidenceRef: line.evidenceRef ?? null });
    }

    lineById.set(line.sourceId, { sourceId: line.sourceId, idbutur: line.idbutur ?? null, tier, vertices: line.vertices, evidenceRef: line.evidenceRef ?? null, nodeSeq });
  }

  // P4 — deterministic parallel-edge tie-break: for every (nodeA,nodeB)
  // UNDIRECTED pair, among all raw edge candidates connecting them, keep
  // only the one whose sourceId is numerically lowest (ties broken by
  // evidenceRef lexical order) as the SINGLE canonical edge used by
  // Dijkstra. This is resolved once, up front, so traversal/iteration
  // order can never affect which source is attributed to that edge.
  // byte-identical to the pre-directed-mode logic -- same function used
  // by the directed branch below, just with a different (ORDERED) key.
  const edgesByNode = resolveParallelEdges(rawEdgesByNode, undirectedPairKey);

  return { ok: true, nodes, rawEdgesByNode, edgesByNode, lineById, tier };
}

function undirectedPairKey(idA, idB) {
  return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
}

// Shared parallel-edge tie-break, reused by both the undirected graph
// (pairKeyFn = undirectedPairKey, normalizing A-B and B-A to one slot)
// and the directed graph (pairKeyFn = an ORDERED key -- see
// "Directed traversal mode" below, where A->B and B->A are deliberately
// tracked as separate groups, never merged).
function resolveParallelEdges(candidateEdgesByNode, pairKeyFn) {
  const edgesByNode = new Map();
  const bestForPair = new Map(); // pairKey -> { sourceId, evidenceRef }
  for (const [fromId, list] of candidateEdgesByNode) {
    for (const e of list) {
      const key = pairKeyFn(fromId, e.toNodeId);
      const current = bestForPair.get(key);
      if (
        !current ||
        e.sourceId < current.sourceId ||
        (e.sourceId === current.sourceId && String(e.evidenceRef) < String(current.evidenceRef))
      ) {
        bestForPair.set(key, { sourceId: e.sourceId, evidenceRef: e.evidenceRef });
      }
    }
  }
  for (const [fromId, list] of candidateEdgesByNode) {
    for (const e of list) {
      const key = pairKeyFn(fromId, e.toNodeId);
      const winner = bestForPair.get(key);
      if (e.sourceId === winner.sourceId && e.evidenceRef === winner.evidenceRef) {
        if (!edgesByNode.has(fromId)) edgesByNode.set(fromId, []);
        edgesByNode.get(fromId).push(e);
      }
    }
  }
  return edgesByNode;
}

// ---------------------------------------------------------------------
// Directed traversal mode (ticket #501 directed-composition)
//
// Opt-in only: input.mode/input.policy absent -> the undirected path
// above runs completely unchanged (same object shape, same IDs). This
// section adds an explicit per-source-piece traversal policy, never an
// inferred driving direction -- see the module's top-of-file comment
// for the full "what this is not" boundary.
//
// policy = {
//   policyVersion: <any defined value>,         // becomes part of the directed geometryId
//   rules: [
//     { sourceId: <number>, tier: <number>,     // tier must equal input.tier
//       direction: "forward"|"reverse"|"both"|"unknown"|"blocked",
//       directionBasis: <non-empty string>,     // required for forward/reverse/both
//     }, ...
//   ],
// }
//
// forward/reverse are relative to the ORIGINAL source vertex order
// (vertex i -> i+1 is "forward"), never a compass direction. A line
// with no rule, or rule direction "unknown"/"blocked", contributes NO
// traversable edges. "both" contributes both directions, same as the
// undirected graph would for that one line.
// ---------------------------------------------------------------------

const DIRECTED_DIRECTIONS = new Set(["forward", "reverse", "both", "unknown", "blocked"]);
const DIRECTIONS_REQUIRING_BASIS = new Set(["forward", "reverse", "both"]);

/**
 * Validates the whole policy up front, independently of which rules end
 * up actually used (P3). Returns { ok:false } on ANY malformed/
 * conflicting rule -- never a partial/last-wins acceptance. A rule for a
 * sourceId that never appears in `lines` is still validated like every
 * other rule, then simply has no effect later (it can never add an edge
 * or affect the geometryId -- only policyVersion itself does that).
 */
function validateDirectedPolicy(policy, tier) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) return { ok: false };
  if (policy.policyVersion === undefined || policy.policyVersion === null) return { ok: false };

  let rawRules;
  if (policy.rules === undefined) {
    rawRules = [];
  } else if (Array.isArray(policy.rules)) {
    rawRules = policy.rules;
  } else {
    return { ok: false };
  }

  const permissionBySourceId = new Map(); // sourceId -> { direction, directionBasis }
  for (const rule of rawRules) {
    if (!rule || typeof rule !== "object") return { ok: false };
    if (!isFiniteNumber(rule.sourceId)) return { ok: false };
    if (rule.tier !== tier) return { ok: false };
    if (!DIRECTED_DIRECTIONS.has(rule.direction)) return { ok: false };
    const needsBasis = DIRECTIONS_REQUIRING_BASIS.has(rule.direction);
    if (needsBasis && (typeof rule.directionBasis !== "string" || rule.directionBasis.length === 0)) {
      return { ok: false };
    }
    const directionBasis = needsBasis ? rule.directionBasis : null;
    const existing = permissionBySourceId.get(rule.sourceId);
    if (existing) {
      // Exact duplicate resubmission is harmless; a genuine conflict
      // (different direction or basis for the same sourceId+tier) is
      // always invalid_policy, never silently last-wins.
      if (existing.direction !== rule.direction || existing.directionBasis !== directionBasis) {
        return { ok: false };
      }
      continue;
    }
    permissionBySourceId.set(rule.sourceId, { direction: rule.direction, directionBasis });
  }

  return { ok: true, policyVersion: policy.policyVersion, permissionBySourceId };
}

// P1 -- filter by permitted direction BEFORE any parallel-edge dedup, so
// a lower sourceId with no/blocked/wrong-direction permission can never
// shadow a higher sourceId that IS permitted on the same node pair (the
// old undirected dedup, which resolves by sourceId alone before knowing
// about direction, must never be reused here).
function filterEdgesByDirectedPolicy(rawEdgesByNode, permissionBySourceId) {
  const filtered = new Map();
  for (const [fromId, list] of rawEdgesByNode) {
    for (const e of list) {
      const perm = permissionBySourceId.get(e.sourceId);
      if (!perm) continue; // missing from policy entirely -> no edges
      if (perm.direction === "blocked" || perm.direction === "unknown") continue;
      if (perm.direction === "forward" && e.direction !== 1) continue;
      if (perm.direction === "reverse" && e.direction !== -1) continue;
      // "both" (or forward/reverse matching e.direction above): permitted.
      if (!filtered.has(fromId)) filtered.set(fromId, []);
      filtered.get(fromId).push({ ...e, appliedRule: perm.direction, directionBasis: perm.directionBasis });
    }
  }
  return filtered;
}

// Ordered (fromId -> toId) key, deliberately NOT normalized like
// undirectedPairKey -- A->B and B->A are tracked as separate groups, so
// one source permitted only A->B and another permitted only B->A can
// both survive (P1). Two edges that ARE both permitted in the exact
// same ordered direction still use the existing stable numeric-sourceId
// tie-break, via the same resolveParallelEdges() helper.
function directedPairKey(fromId, toId) {
  return `${fromId}->${toId}`;
}

function tagDirected(result, directed) {
  return directed ? { ...result, mode: "directed", policyVersion: directed.policyVersion } : result;
}

function findNode(nodes, x, y) {
  return nodes.get(vertexKey(x, y)) ?? null;
}

// Deterministic tie-break between two candidate edges arriving at the
// SAME node with the SAME resulting total distance -- lower numeric
// sourceId wins, evidenceRef lexical order as a secondary tie-break.
// Same rule family as the parallel-edge resolution in buildGraph (P4),
// reused here for the broader case JK2/JK3 cover: two genuinely
// DIFFERENT paths (not a parallel edge between the same two nodes)
// that happen to sum to the exact same total length.
function edgeWins(candidateEdge, incumbentEdge) {
  if (candidateEdge.sourceId !== incumbentEdge.sourceId) {
    return candidateEdge.sourceId < incumbentEdge.sourceId;
  }
  return String(candidateEdge.evidenceRef) < String(incumbentEdge.evidenceRef);
}

/**
 * Deterministic Dijkstra over the undirected, tie-resolved graph.
 * Returns an ordered array of single-vertex-step edges from `fromNode`
 * to `toNode`, or null if disconnected. `nodeKeyById` (nodeId -> its
 * own stable "x|y" string) makes BOTH tie-break points below
 * independent of node-creation/input-processing order:
 *   (a) frontier selection, when two unvisited nodes share the current
 *       minimum distance -- the lexically-smaller node key is processed
 *       first (this can only affect visitation order among already-
 *       equal-cost nodes, never which final distance is computed);
 *   (b) predecessor selection, when relaxing an edge produces a
 *       distance EQUAL to (not just better than) a node's current best
 *       -- edgeWins() decides whether to switch to the new predecessor,
 *       so two different, equal-length paths to the same destination
 *       always resolve to the same one regardless of input order
 *       (JK2/JK3; see the symmetric equal-cost fixture in the test
 *       file).
 */
function shortestPath(edgesByNode, fromNode, toNode, nodeKeyById) {
  const dist = new Map([[fromNode.id, 0]]);
  const prevEdge = new Map(); // nodeId -> edge used to reach it
  const visited = new Set();
  // Simple array-based priority queue -- tier-2 scale (a few hundred
  // nodes) makes an O(V^2) selection perfectly adequate; no new
  // dependency for a binary heap is needed here.
  const frontier = new Set([fromNode.id]);

  while (frontier.size > 0) {
    let currentId = null;
    let currentDist = Infinity;
    for (const id of frontier) {
      const d = dist.get(id);
      if (d < currentDist || (d === currentDist && nodeKeyById.get(id) < nodeKeyById.get(currentId))) {
        currentDist = d;
        currentId = id;
      }
    }
    frontier.delete(currentId);
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    if (currentId === toNode.id) break;

    const edges = edgesByNode.get(currentId) ?? [];
    for (const e of edges) {
      if (visited.has(e.toNodeId)) continue;
      const candidate = currentDist + e.length;
      const known = dist.has(e.toNodeId) ? dist.get(e.toNodeId) : Infinity;
      if (candidate < known) {
        dist.set(e.toNodeId, candidate);
        prevEdge.set(e.toNodeId, { fromNodeId: currentId, edge: e });
        frontier.add(e.toNodeId);
      } else if (candidate === known && dist.has(e.toNodeId)) {
        const incumbent = prevEdge.get(e.toNodeId);
        if (incumbent && edgeWins(e, incumbent.edge)) {
          prevEdge.set(e.toNodeId, { fromNodeId: currentId, edge: e });
        }
      }
    }
  }

  if (!dist.has(toNode.id)) return null;

  const stepsReversed = [];
  let cursor = toNode.id;
  while (cursor !== fromNode.id) {
    const step = prevEdge.get(cursor);
    if (!step) return null; // should not happen if dist.has(toNode.id)
    stepsReversed.push(step.edge);
    cursor = step.fromNodeId;
  }
  return stepsReversed.reverse();
}

/**
 * Merges consecutive single-vertex-step edges that belong to the same
 * sourceId AND are index-adjacent (edge[i].toIndex === edge[i+1].fromIndex)
 * into one slice. A sourceId reappearing later, non-adjacently, becomes
 * a SEPARATE slice entry — never merged with an earlier one, and the
 * edge itself is never double-counted (each step edge is consumed
 * exactly once, in path order).
 */
function buildSlices(steps, lineById) {
  // Merge pass keeps `direction` as the RAW numeric +1/-1 (matching the
  // edge objects from shortestPath) for the whole pass -- comparing a
  // stringified "forward"/"reverse" against the raw numeric value here
  // would silently never match, which is exactly the bug a real run
  // against R1->Selfoss/Hella caught (1436's 3 contiguous same-direction
  // steps were never merged). The forward/reverse string is produced
  // only in the final mapping below, once merging is already decided.
  const merged = [];
  for (const step of steps) {
    const last = merged[merged.length - 1];
    if (last && last.sourceId === step.sourceId && last.toIndex === step.fromIndex && last.direction === step.direction) {
      last.toIndex = step.toIndex;
      last.lengthM += step.length;
    } else {
      merged.push({
        sourceId: step.sourceId,
        idbutur: step.idbutur,
        tier: step.tier,
        fromIndex: step.fromIndex,
        toIndex: step.toIndex,
        direction: step.direction, // raw +1/-1 during merge
        evidenceRef: step.evidenceRef,
        lengthM: step.length,
        // Directed-mode-only fields (undefined for the undirected path,
        // so they never appear as keys on an undirected slice below).
        ...(step.appliedRule !== undefined ? { appliedRule: step.appliedRule, directionBasis: step.directionBasis } : {}),
      });
    }
  }
  // Attach resolved XY for from/to of each (possibly merged) slice, from
  // the original line's own vertex array -- independent of the merge --
  // and convert direction to its final "forward"/"reverse" string form.
  return merged.map((slice) => {
    const line = lineById.get(slice.sourceId);
    const fromV = line.vertices[slice.fromIndex];
    const toV = line.vertices[slice.toIndex];
    return {
      ...slice,
      direction: slice.direction === 1 ? "forward" : "reverse",
      fromXY: { x: fromV.x, y: fromV.y, z: fromV.z ?? null },
      toXY: { x: toV.x, y: toV.y, z: toV.z ?? null },
    };
  });
}

// `directedMeta` ({ policyVersion }) is omitted entirely for the
// undirected path, so the descriptor's keys/order are byte-identical to
// before directed mode existed -- old geometryIds are preserved exactly
// (P4). When present, it adds `mode`/`policyVersion` at the top level
// and `appliedRule` per slice, so a directed result can never collide
// with its own undirected ID (same slices, different policy outcome --
// e.g. "both" vs "forward" -- always get different IDs).
function computeGeometryId({ tier, fromKey, toKey, slices, directedMeta }) {
  const descriptor = {
    v: GEOMETRY_COMPOSITION_VERSION,
    tier,
    from: fromKey,
    to: toKey,
    slices: slices.map((s) => {
      const base = { sourceId: s.sourceId, fromIndex: s.fromIndex, toIndex: s.toIndex, direction: s.direction };
      return directedMeta ? { ...base, appliedRule: s.appliedRule } : base;
    }),
    ...(directedMeta ? { mode: "directed", policyVersion: directedMeta.policyVersion } : {}),
  };
  const canonical = JSON.stringify(descriptor);
  return crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

/**
 * The one exported entry point. Never throws for ordinary invalid/
 * unsupported input -- always returns a result object with a `status`
 * in {"geometry_only","same_place","unsupported"}.
 */
export function composeGeometryPath(input) {
  if (!input || typeof input !== "object") {
    return unsupported(REASON.MISSING_ENDPOINT, { detail: "no input" });
  }
  const { from, to } = input;
  if (!from || !to || !isFiniteNumber(from.x) || !isFiniteNumber(from.y) || !isFiniteNumber(to.x) || !isFiniteNumber(to.y)) {
    return unsupported(REASON.MISSING_ENDPOINT);
  }
  if (from.placeId != null && to.placeId != null && from.placeId === to.placeId && (from.x !== to.x || from.y !== to.y)) {
    // Same declared place-ID, contradictory coordinates -- a real input
    // error, never silently treated as same_place.
    return unsupported(REASON.CONFLICTING_ENDPOINT_INPUT, { detail: `placeId ${from.placeId} given two different native coordinates` });
  }

  // P2 -- mode/policy gate, resolved before any graph is built. No
  // `mode` and no `policy` key at all: `directed` stays null and every
  // line below behaves exactly as it did before directed mode existed.
  const hasModeKey = Object.prototype.hasOwnProperty.call(input, "mode") && input.mode !== undefined;
  const hasPolicyKey = Object.prototype.hasOwnProperty.call(input, "policy") && input.policy !== undefined;

  let directed = null;
  if (hasModeKey || hasPolicyKey) {
    // Any mode value other than exactly "directed" (including a policy
    // given without mode:"directed" at all) is rejected -- never a
    // silent fall-through to the undirected path.
    if (!hasModeKey || input.mode !== "directed") {
      return unsupported(REASON.INVALID_MODE);
    }
    if (!hasPolicyKey) {
      return unsupported(REASON.INVALID_POLICY);
    }
    const validated = validateDirectedPolicy(input.policy, input.tier);
    if (!validated.ok) {
      return unsupported(REASON.INVALID_POLICY);
    }
    directed = validated;
  }

  const built = buildGraph(input);
  if (!built.ok) return built.result;
  const { nodes, rawEdgesByNode, edgesByNode, lineById, tier } = built;

  const fromNode = findNode(nodes, from.x, from.y);
  const toNode = findNode(nodes, to.x, to.y);
  // Endpoint existence uses ALL input lines' vertices regardless of mode
  // or policy (P5) -- `nodes` above is built from every line, whether or
  // not that line has any permitted direction.
  if (!fromNode) {
    return tagDirected(
      unsupported(REASON.ENDPOINT_NOT_IN_GRAPH, { detail: "from endpoint is not a literal vertex of any input line", endpoint: "from" }),
      directed
    );
  }
  if (!toNode) {
    return tagDirected(
      unsupported(REASON.ENDPOINT_NOT_IN_GRAPH, { detail: "to endpoint is not a literal vertex of any input line", endpoint: "to" }),
      directed
    );
  }

  const fromKey = vertexKey(from.x, from.y);
  const toKey = vertexKey(to.x, to.y);

  if (fromNode.id === toNode.id) {
    const geometryId = computeGeometryId({ tier, fromKey, toKey, slices: [], directedMeta: directed });
    return tagDirected(
      {
        status: "same_place",
        tier,
        from: { placeId: from.placeId ?? null, x: from.x, y: from.y },
        to: { placeId: to.placeId ?? null, x: to.x, y: to.y },
        lengthM: 0,
        slices: [],
        geometryId,
        drivingAccess: "UNVERIFIED",
      },
      directed
    );
  }

  const nodeKeyById = new Map();
  for (const [key, node] of nodes) nodeKeyById.set(node.id, key);

  // Directed mode never reuses the undirected edgesByNode -- it filters
  // by permitted direction FIRST (P1), then resolves parallel edges on
  // the ORDERED pair, so a lower sourceId with no/wrong-direction
  // permission can never shadow a higher sourceId that IS permitted.
  const edgesForTraversal = directed
    ? resolveParallelEdges(filterEdgesByDirectedPolicy(rawEdgesByNode, directed.permissionBySourceId), directedPairKey)
    : edgesByNode;

  const steps = shortestPath(edgesForTraversal, fromNode, toNode, nodeKeyById);
  if (!steps) {
    const reason = directed ? REASON.NO_DIRECTED_PATH : REASON.DISCONNECTED_GRAPH;
    return tagDirected(
      unsupported(reason, { detail: "from/to are both valid literal vertices, but no edge-connected path exists in the given lines/policy" }),
      directed
    );
  }

  const slices = buildSlices(steps, lineById);
  const lengthM = slices.reduce((sum, s) => sum + s.lengthM, 0);
  const geometryId = computeGeometryId({ tier, fromKey, toKey, slices, directedMeta: directed });

  return tagDirected(
    {
      status: "geometry_only",
      tier,
      from: { placeId: from.placeId ?? null, x: from.x, y: from.y },
      to: { placeId: to.placeId ?? null, x: to.x, y: to.y },
      lengthM,
      slices,
      geometryId,
      drivingAccess: "UNVERIFIED",
      isReverseOf: null,
    },
    directed
  );
}

/**
 * Returns a new result object describing the SAME physical geometry
 * traversed in the opposite direction: slice order reversed, each
 * slice's fromIndex/toIndex and direction swapped, from/to swapped.
 * Length is unchanged (same edges). The geometry ID differs from the
 * forward result's (from/to swapped is part of its own content) --
 * this is NOT a claim that the reverse direction is legally driveable;
 * the underlying graph is undirected geometry only.
 */
export function reverseGeometryPath(result) {
  if (!result || result.status !== "geometry_only") {
    throw new Error("reverseGeometryPath only accepts a geometry_only result");
  }
  // P6 -- a directed result can never be mechanically mirrored into a
  // "reverse" success: the permitted directions for B->A are not
  // necessarily the same as A->B (e.g. a one-way-only policy). The
  // caller must compose again with from/to swapped, so the real policy
  // is re-evaluated in that direction rather than assumed.
  if (result.mode === "directed") {
    return unsupported(REASON.DIRECTED_RESULT_NOT_REVERSIBLE, {
      detail: "directed geometry_only results cannot be mechanically reversed -- compose again with from/to swapped",
    });
  }
  const reversedSlices = result.slices
    .slice()
    .reverse()
    .map((s) => ({
      ...s,
      fromIndex: s.toIndex,
      toIndex: s.fromIndex,
      direction: s.direction === "forward" ? "reverse" : "forward",
      fromXY: s.toXY,
      toXY: s.fromXY,
    }));
  const fromKey = vertexKey(result.to.x, result.to.y);
  const toKey = vertexKey(result.from.x, result.from.y);
  const geometryId = computeGeometryId({ tier: result.tier, fromKey, toKey, slices: reversedSlices });
  return {
    status: "geometry_only",
    tier: result.tier,
    from: result.to,
    to: result.from,
    lengthM: result.lengthM,
    slices: reversedSlices,
    geometryId,
    drivingAccess: "UNVERIFIED",
    isReverseOf: result.geometryId,
  };
}
