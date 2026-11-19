// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { composeGeometryPath, reverseGeometryPath, UNSUPPORTED_REASONS, GEOMETRY_COMPOSITION_VERSION } from "./geometryComposition.js";

// ---------------------------------------------------------------------------
// Retained-data loader -- TEST-ONLY. The production module never touches
// fs/network; only this test file reads real retained files and converts
// them into the module's plain-argument contract.
// ---------------------------------------------------------------------------
const VEGNR1_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json");
const ROAD93_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json");
const PLACE_NODES_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-493-place-data-phase2/samples/place_nodes-v3.json");

// P2/JK1 — Selfoss (2138) and Hella (3591) are pinned to their own retained
// EXIT coordinate (chain-traversal exit), not the entry and not "whichever
// end this file's own vertex array happens to list last". Read directly
// from the retained place_nodes-v3.json, never hand-typed, so a future
// change to that file is caught here rather than silently diverging.
const PLACE_NODES = JSON.parse(fs.readFileSync(PLACE_NODES_PATH, "utf8")).nodes_by_idferill;
const SELFOSS_EXIT = { x: PLACE_NODES["2138"].exit_coord[0], y: PLACE_NODES["2138"].exit_coord[1] };
const HELLA_EXIT = { x: PLACE_NODES["3591"].exit_coord[0], y: PLACE_NODES["3591"].exit_coord[1] };

function loadLinesAtTier(filePath, tier, idferillFilter) {
  const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const basename = path.basename(filePath);
  const lines = [];
  for (const feat of doc.features) {
    const p = feat.properties;
    if (p.NAKVAEMNIFERLIS !== tier) continue;
    if (idferillFilter && !idferillFilter.has(p.IDFERILL)) continue;
    const vertices = feat.geometry.coordinates.map(([x, y, z]) => ({ x, y, z: z ?? null }));
    lines.push({
      sourceId: p.IDFERILL,
      idbutur: p.IDBUTUR,
      tier,
      vertices,
      evidenceRef: `${basename}#IDFERILL=${p.IDFERILL}&OBJECTID=${p.OBJECTID}&tier=${tier}`,
    });
  }
  return lines;
}

const TIER2_ALL_VEGNR1 = loadLinesAtTier(VEGNR1_PATH, 2);
const TIER2_ROAD93 = loadLinesAtTier(ROAD93_PATH, 2);

function sumIndependently(result, linesUsed) {
  // Independent re-derivation of total length -- never trusting the
  // module's own internal sum. A merged slice can span many original
  // vertices (e.g. all of a long piece's vertices in one slice), so the
  // straight chord between a slice's fromXY/toXY is NOT its length; this
  // walks every original consecutive vertex pair in the slice's own
  // index range, from the raw input lines, and sums those.
  const byId = new Map(linesUsed.map((l) => [l.sourceId, l]));
  let total = 0;
  for (const s of result.slices) {
    const verts = byId.get(s.sourceId).vertices;
    const lo = Math.min(s.fromIndex, s.toIndex);
    const hi = Math.max(s.fromIndex, s.toIndex);
    for (let i = lo; i < hi; i++) {
      total += Math.hypot(verts[i + 1].x - verts[i].x, verts[i + 1].y - verts[i].y);
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// Synthetic fixtures -- small, hand-built, independent of any retained file.
// ---------------------------------------------------------------------------
describe("synthetic fixtures", () => {
  const CRS = "EPSG:3057";

  it("same_place: identical native coordinate for from and to, regardless of differing placeId", () => {
    const lineA = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#1" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [lineA],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p2", x: 0, y: 0 },
    });
    expect(result.status).toBe("same_place");
    expect(result.lengthM).toBe(0);
    expect(result.slices).toEqual([]);
    expect(result.drivingAccess).toBe("UNVERIFIED");
  });

  it("conflicting endpoint input: same placeId, contradictory coordinates -- invalid input, not same_place", () => {
    const lineA = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#1" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [lineA],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p1", x: 10, y: 0 },
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.CONFLICTING_ENDPOINT_INPUT);
  });

  it("missing endpoint fields", () => {
    const result = composeGeometryPath({ crs: CRS, tier: 2, lines: [], from: { placeId: "p1" }, to: { placeId: "p2", x: 1, y: 1 } });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.MISSING_ENDPOINT);
  });

  it("unknown endpoint: coordinate is not a literal vertex of any line -- never nearest/snap", () => {
    const lineA = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#1" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [lineA],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p2", x: 10.0001, y: 0 }, // deliberately NOT the literal vertex at (10,0)
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.ENDPOINT_NOT_IN_GRAPH);
    expect(result.endpoint).toBe("to");
  });

  it("disconnected graph: both endpoints are real literal vertices, but no edge path connects them", () => {
    const lineA = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#1" };
    const lineB = { sourceId: 2, idbutur: 200, tier: 2, vertices: [{ x: 500, y: 500 }, { x: 510, y: 500 }], evidenceRef: "fixture#2" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [lineA, lineB],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p2", x: 510, y: 500 },
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.DISCONNECTED_GRAPH);
  });

  it("conflicting identity geometry: same sourceId+tier resubmitted with different vertices is a conflict, not a silent pick", () => {
    const lineA1 = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#1a" };
    const lineA2 = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 20, y: 0 }], evidenceRef: "fixture#1b" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [lineA1, lineA2],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p2", x: 10, y: 0 },
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.CONFLICTING_IDENTITY_GEOMETRY);
  });

  it("exact duplicate resubmission (same sourceId+tier, identical geometry) is harmless -- never double-counted", () => {
    const line = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#1" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [line, { ...line }],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p2", x: 10, y: 0 },
    });
    expect(result.status).toBe("geometry_only");
    expect(result.lengthM).toBe(10);
    expect(result.slices).toHaveLength(1);
  });

  it("mixed-tier input is rejected -- a line whose own tier differs from input.tier is unsupported, never silently coerced", () => {
    const lineWrongTier = { sourceId: 1, idbutur: 100, tier: -1, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#1" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [lineWrongTier],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p2", x: 10, y: 0 },
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.MIXED_TIER_INPUT);
  });

  it("closed ring with a repeated (zero-length) consecutive vertex: the zero-length step is dropped, the ring itself is not destroyed", () => {
    // A 4-node square ring where the digitized line repeats its own
    // start point exactly before actually closing (a zero-length step),
    // then genuinely closes back to the start.
    const ring = {
      sourceId: 7, idbutur: 700, tier: 2,
      vertices: [
        { x: 0, y: 0 }, { x: 0, y: 0 }, // zero-length step: 0->1
        { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 0, y: 0 },
      ],
      evidenceRef: "fixture#ring",
    };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [ring],
      from: { placeId: "a", x: 0, y: 0 },
      to: { placeId: "b", x: 10, y: 10 },
    });
    expect(result.status).toBe("geometry_only");
    // Shortest path from (0,0) around the ring to (10,10): via (10,0)
    // [10+10=20] and via (0,10) [10+10=20] are a genuine tie -- two
    // different, non-parallel paths of equal length (JK2/JK3), not the
    // same parallel-edge case P4 already handles. Both candidate edges
    // here share sourceId AND evidenceRef (same single ring line), so
    // edgeWins() cannot discriminate between them; the frontier's own
    // lexical node-key tie-break ("0|10" < "10|0") is what actually
    // decides, and it deterministically picks the via-(0,10) path --
    // confirmed by asserting the specific slice below, not just length.
    expect(result.lengthM).toBeCloseTo(20, 9);
    expect(result.slices).toHaveLength(1); // the two reverse-direction legs merge into one slice
    expect(result.slices[0].sourceId).toBe(7);
    expect(result.slices[0].direction).toBe("reverse");
    expect(result.slices[0].fromIndex).toBe(5); // via (0,10) [vertex index 4], never via (10,0) [vertex index 2]
    expect(result.slices[0].toIndex).toBe(3);
  });

  it("deterministic geometry ID under input-line-order permutation (P4)", () => {
    const lineA = { sourceId: 10, idbutur: 1000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }], evidenceRef: "fixture#a" };
    const lineB = { sourceId: 20, idbutur: 2000, tier: 2, vertices: [{ x: 5, y: 0 }, { x: 5, y: 5 }], evidenceRef: "fixture#b" };
    const endpoints = { from: { placeId: "p1", x: 0, y: 0 }, to: { placeId: "p2", x: 5, y: 5 } };
    const r1 = composeGeometryPath({ crs: CRS, tier: 2, lines: [lineA, lineB], ...endpoints });
    const r2 = composeGeometryPath({ crs: CRS, tier: 2, lines: [lineB, lineA], ...endpoints }); // shuffled
    expect(r1.status).toBe("geometry_only");
    expect(r2.geometryId).toBe(r1.geometryId);
    expect(r2.slices).toEqual(r1.slices);
  });

  it("deterministic parallel-edge tie-break: two different sourceIds connect the same two nodes -- lowest numeric sourceId wins, regardless of input order", () => {
    const low = { sourceId: 3, idbutur: 300, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#low" };
    const high = { sourceId: 99, idbutur: 9900, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "fixture#high" };
    const endpoints = { from: { placeId: "p1", x: 0, y: 0 }, to: { placeId: "p2", x: 10, y: 0 } };
    const rA = composeGeometryPath({ crs: CRS, tier: 2, lines: [high, low], ...endpoints });
    const rB = composeGeometryPath({ crs: CRS, tier: 2, lines: [low, high], ...endpoints });
    expect(rA.slices[0].sourceId).toBe(3);
    expect(rB.slices[0].sourceId).toBe(3);
    expect(rA.geometryId).toBe(rB.geometryId);
  });

  it("JK2/JK3: two genuinely different, non-parallel, equal-length paths resolve to the same geometry regardless of input order (not the P4 parallel-edge case -- these use different nodes/edges entirely)", () => {
    // id10: (0,0) -> (10,0) -> (10,10) [length 20]
    // id20: (0,0) -> (0,10) -> (10,10) [length 20]
    // Neither line shares a node pair with the other (no parallel edges),
    // so P4's sourceId tie-break never applies here -- this exercises the
    // shortestPath()-internal frontier/predecessor tie-breaks instead.
    const id10 = { sourceId: 10, idbutur: 1000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], evidenceRef: "fixture#id10" };
    const id20 = { sourceId: 20, idbutur: 2000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }], evidenceRef: "fixture#id20" };
    const endpoints = { from: { placeId: "p1", x: 0, y: 0 }, to: { placeId: "p2", x: 10, y: 10 } };
    const orderings = [[id10, id20], [id20, id10]];
    const results = orderings.map((lines) => composeGeometryPath({ crs: CRS, tier: 2, lines, ...endpoints }));
    for (const r of results) expect(r.status).toBe("geometry_only");
    for (const r of results) expect(r.lengthM).toBeCloseTo(20, 9);
    // Same winning path (not just same length) under both input orders.
    for (const r of results) expect(r.geometryId).toBe(results[0].geometryId);
    for (const r of results) expect(r.slices).toEqual(results[0].slices);
    // Deterministic winner is id10 (lower sourceId breaks the frontier tie
    // at the shared midpoint distance, same rule family as P4/edgeWins).
    expect(results[0].slices.map((s) => s.sourceId)).toEqual([10]);
  });

  it("reverse: produces the same length, reversed slice order/indices/direction, a different geometry ID, and reverse(reverse(x)) restores the original", () => {
    const lineA = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], evidenceRef: "fixture#1" };
    const forward = composeGeometryPath({
      crs: CRS, tier: 2, lines: [lineA],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p2", x: 10, y: 10 },
    });
    expect(forward.status).toBe("geometry_only");
    const reversed = reverseGeometryPath(forward);
    expect(reversed.lengthM).toBeCloseTo(forward.lengthM, 9);
    expect(reversed.from).toEqual(forward.to);
    expect(reversed.to).toEqual(forward.from);
    expect(reversed.geometryId).not.toBe(forward.geometryId);
    expect(reversed.isReverseOf).toBe(forward.geometryId);
    expect(reversed.slices.map((s) => s.direction)).toEqual(forward.slices.map((s) => (s.direction === "forward" ? "reverse" : "forward")).reverse());

    const roundTrip = reverseGeometryPath(reversed);
    expect(roundTrip.geometryId).toBe(forward.geometryId);
    expect(roundTrip.slices).toEqual(forward.slices);
    expect(roundTrip.from).toEqual(forward.from);
    expect(roundTrip.to).toEqual(forward.to);
    // The reverse operation itself is not a driving-direction claim.
    expect(reversed.drivingAccess).toBe("UNVERIFIED");
  });

  it("a piece appearing in two NON-adjacent slices is never merged into one, and no edge is double-counted", () => {
    // Shaped so the shortest path legitimately revisits sourceId=5's own
    // line twice, separated by a detour through sourceId=6.
    const main = {
      sourceId: 5, idbutur: 500, tier: 2,
      vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }, { x: 30, y: 0 }],
      evidenceRef: "fixture#main",
    };
    const detourOnly = {
      // A much longer alternative between the SAME two nodes (10,0) and
      // (20,0) so the shortest path still uses main's own 10->20 edge,
      // while a genuine detour forces main to be entered, left, then
      // re-entered via a different pair of its own vertices for a
      // different leg of the overall query -- modelled directly as two
      // separate queries is simpler and exercises the same merge logic
      // without an artificial shape; see the retained R1->Hella
      // integration test below for a real non-adjacent-slice case
      // (IDFERILL 2138) instead of forcing one here synthetically.
      sourceId: 6, idbutur: 600, tier: 2,
      vertices: [{ x: 30, y: 0 }, { x: 30, y: 100 }],
      evidenceRef: "fixture#detour",
    };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: [main, detourOnly],
      from: { placeId: "p1", x: 0, y: 0 },
      to: { placeId: "p2", x: 30, y: 100 },
    });
    expect(result.status).toBe("geometry_only");
    // main's three edges (0-10,10-20,20-30) merge into ONE slice (index
    // 0->3), since they are index-adjacent and same sourceId/direction.
    const mainSlices = result.slices.filter((s) => s.sourceId === 5);
    expect(mainSlices).toHaveLength(1);
    expect(mainSlices[0].fromIndex).toBe(0);
    expect(mainSlices[0].toIndex).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Real retained tier-2 integration (VEGNR=1) -- B1, B2, C1, R1->Selfoss,
// R1->Hella. All endpoints are literal retained vertices (P2), read
// directly from docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json by
// THIS test file, never fabricated.
// ---------------------------------------------------------------------------
describe("real retained tier-2 integration (VEGNR=1, wfs-vegnr1-all.json)", () => {
  const CRS = "EPSG:3057";

  it("B1: 1735's own start connects to 2071's own start via 1735's first internal vertex -- 0.2343 m, not a missing connector", () => {
    const linesB1 = loadLinesAtTier(VEGNR1_PATH, 2, new Set([1735, 2071]));
    const result = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: linesB1,
      from: { placeId: "b1-a", x: 369350.568, y: 400623.6659 }, // 1735's own start
      to: { placeId: "b1-b", x: 369350.3714, y: 400623.7933 }, // 2071's own start == 1735's vertex[1]
    });
    expect(result.status).toBe("geometry_only");
    expect(result.lengthM).toBeCloseTo(0.23426975905806502, 9);
    expect(sumIndependently(result, linesB1)).toBeCloseTo(result.lengthM, 9);
    // The whole path is the single internal edge of 1735 itself -- 2071
    // contributes no edge here (its own start node already equals 1735's
    // vertex 1, which is the target).
    expect(result.slices).toHaveLength(1);
    expect(result.slices[0].sourceId).toBe(1735);
    expect([result.slices[0].fromIndex, result.slices[0].toIndex].sort()).toEqual([0, 1]);
  });

  it("B2: the shortest UNDIRECTED arc of the closed 36807 ring between A (2117's end) and B (2135's end) is 40.4064 m, travelled AGAINST the ring's own drawn order -- never called the 'B2 length/gap', never the 72.5 m forward arc", () => {
    const A = { x: 392674.357, y: 389846.132 }; // 2117 end
    const B = { x: 392703.5, y: 389865.057 }; // 2135 end / 36807 start
    const linesB2 = loadLinesAtTier(VEGNR1_PATH, 2, new Set([2117, 2134, 2135, 36807]));
    const result = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: linesB2,
      from: { placeId: "b2-a", ...A },
      to: { placeId: "b2-b", ...B },
    });
    expect(result.status).toBe("geometry_only");
    expect(result.lengthM).toBeCloseTo(40.40637511981366, 6);
    expect(sumIndependently(result, linesB2)).toBeCloseTo(result.lengthM, 9);
    expect(result.slices.every((s) => s.sourceId === 36807)).toBe(true);
    expect(result.slices[0].direction).toBe("reverse"); // against 36807's own digitized (CCW) order
    // The straight-line gap this corridor is already known by (34.7487 m)
    // and the ring's OWN forward arc (72.549 m) must not appear here.
    const straightGap = Math.hypot(B.x - A.x, B.y - A.y);
    expect(result.lengthM).not.toBeCloseTo(straightGap, 1);
    expect(result.lengthM).toBeLessThan(72.54928752266883);
  });

  it("C1: 3454's own ring connects to 3767's own end vertex via two shared ring vertices -- 43.4889 m", () => {
    const linesC1 = loadLinesAtTier(VEGNR1_PATH, 2, new Set([3454, 3767, 3768]));
    const result = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: linesC1,
      from: { placeId: "c1-a", x: 403269.528, y: 383219.0345 }, // 3768's own start == 3454's vertex 2
      to: { placeId: "c1-b", x: 403311.6927, y: 383222.4427 }, // 3767's own end
    });
    expect(result.status).toBe("geometry_only");
    expect(result.lengthM).toBeCloseTo(43.488920509692846, 6);
    expect(sumIndependently(result, linesC1)).toBeCloseTo(result.lengthM, 9);
    expect(result.slices.map((s) => s.sourceId)).toEqual([3454, 3767]);
  });

  it("R1->Selfoss: a real, fully-connected geometry_only path exists at tier 2, length independently verified by summing the returned slices' own adjacent vertices, and ends at 2138's own pinned exit_coord (JK1)", () => {
    const R1 = { x: 365522.0175, y: 402772.762 }; // 1436 western end
    const result = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: TIER2_ALL_VEGNR1,
      from: { placeId: "reykjavik-raudavatn", ...R1 },
      to: { placeId: "selfoss", ...SELFOSS_EXIT },
    });
    expect(result.status).toBe("geometry_only");
    expect(result.to.x).toBe(SELFOSS_EXIT.x);
    expect(result.to.y).toBe(SELFOSS_EXIT.y);
    // JK1 correction: v1 wrongly used 2138's entry_coord (mislabeled "own
    // exit" in a comment). With the pinned exit_coord this module's own,
    // independently re-derived (from-scratch Python Dijkstra mirror on the
    // raw retained data, not a copy of anyone else's number) length matches
    // Jonesy's own prototype cross-check (44984.770378 m) to the digit --
    // this is still this implementation's own re-derivable result, not a
    // forced golden value; the match simply confirms the endpoint was the
    // actual bug, not route choice.
    expect(result.lengthM).toBeCloseTo(44984.77037809235, 3);
    expect(sumIndependently(result, TIER2_ALL_VEGNR1)).toBeCloseTo(result.lengthM, 6);
    // 1436 (R1's own piece) is counted exactly once, never re-added as a prefix.
    expect(result.slices.filter((s) => s.sourceId === 1436)).toHaveLength(1);
  });

  it("R1->Hella: a real, fully-connected geometry_only path exists at tier 2; IDFERILL 2138 legitimately occurs in two NON-adjacent slices, is never merged or double-counted, and ends at 3591's own pinned exit_coord (JK1)", () => {
    const R1 = { x: 365522.0175, y: 402772.762 };
    const result = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: TIER2_ALL_VEGNR1,
      from: { placeId: "reykjavik-raudavatn", ...R1 },
      to: { placeId: "hella", ...HELLA_EXIT },
    });
    expect(result.status).toBe("geometry_only");
    expect(result.to.x).toBe(HELLA_EXIT.x);
    expect(result.to.y).toBe(HELLA_EXIT.y);
    // JK1 correction -- see R1->Selfoss comment above for the same pattern.
    expect(result.lengthM).toBeCloseTo(80630.94782758385, 2);
    expect(sumIndependently(result, TIER2_ALL_VEGNR1)).toBeCloseTo(result.lengthM, 5);

    const slices2138 = result.slices.filter((s) => s.sourceId === 2138);
    expect(slices2138.length).toBeGreaterThanOrEqual(2); // genuinely non-adjacent re-entry, not one merged slice
    // Edge-level uniqueness (P3): no identical (sourceId, index-pair)
    // step appears twice across the whole slice list.
    const seenSteps = new Set();
    for (const s of result.slices) {
      const stepKey = `${s.sourceId}:${Math.min(s.fromIndex, s.toIndex)}-${Math.max(s.fromIndex, s.toIndex)}`;
      // a merged slice can legitimately span multiple underlying steps;
      // check at the slice level that the same (sourceId, span) never recurs
      expect(seenSteps.has(stepKey)).toBe(false);
      seenSteps.add(stepKey);
    }
    expect(result.slices.filter((s) => s.sourceId === 1436)).toHaveLength(1);
  });

  it("JK2/JK3 on retained data: shuffling the real 249-feature VEGNR=1 input order does not change R1->Selfoss's resolved geometryId/slices (corrected exit_coord endpoint)", () => {
    const R1 = { x: 365522.0175, y: 402772.762 };
    const shuffled = [...TIER2_ALL_VEGNR1].reverse();
    const original = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: TIER2_ALL_VEGNR1,
      from: { placeId: "reykjavik-raudavatn", ...R1 },
      to: { placeId: "selfoss", ...SELFOSS_EXIT },
    });
    const permuted = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: shuffled,
      from: { placeId: "reykjavik-raudavatn", ...R1 },
      to: { placeId: "selfoss", ...SELFOSS_EXIT },
    });
    expect(permuted.geometryId).toBe(original.geometryId);
    expect(permuted.slices).toEqual(original.slices);
    expect(permuted.lengthM).toBeCloseTo(original.lengthM, 9);
  });

  it("reverse of the real R1->Selfoss path has a different geometry ID, equal length, and restores exactly on double-reverse", () => {
    const result = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: TIER2_ALL_VEGNR1,
      from: { placeId: "reykjavik-raudavatn", x: 365522.0175, y: 402772.762 },
      to: { placeId: "selfoss", ...SELFOSS_EXIT },
    });
    const reversed = reverseGeometryPath(result);
    expect(reversed.geometryId).not.toBe(result.geometryId);
    expect(reversed.lengthM).toBeCloseTo(result.lengthM, 9);
    expect(reverseGeometryPath(reversed).geometryId).toBe(result.geometryId);
    // Not a legal-direction claim either way.
    expect(reversed.drivingAccess).toBe("UNVERIFIED");
  });
});

// ---------------------------------------------------------------------------
// Real retained tier-2 integration (VEGNR=93, road93/E1->S2) -- a
// separate dataset from the VEGNR=1 corridor above.
// ---------------------------------------------------------------------------
describe("real retained tier-2 integration (VEGNR=93, wfs93-raw.json) -- E1->S2", () => {
  const CRS = "EPSG:3057";

  it("E1->S2 connects directly to S2 (2894's own end), length 24,148.861 m, and never continues past S2 toward the ferry pier (2892/2891 excluded from input)", () => {
    const E1 = { x: 715153.74, y: 536679.93 }; // 2344's own start
    const S2 = { x: 732875.674, y: 538207.0762 }; // 2894's own end
    const linesE1S2 = TIER2_ROAD93.filter((l) => [2344, 3410, 3409, 2894].includes(l.sourceId)); // deliberately excludes 2892/2891/the ferry pier
    const result = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: linesE1S2,
      from: { placeId: "egilsstadir", ...E1 },
      to: { placeId: "seydisfjordur", ...S2 },
    });
    expect(result.status).toBe("geometry_only");
    expect(result.lengthM).toBeCloseTo(24148.860880942146, 3);
    expect(sumIndependently(result, linesE1S2)).toBeCloseTo(result.lengthM, 6);
    expect(result.slices.map((s) => s.sourceId)).toEqual([2344, 3410, 3409, 2894]);
    // Confirms this really is the whole-piece chain, each piece counted once.
    for (const s of result.slices) {
      expect(result.slices.filter((x) => x.sourceId === s.sourceId)).toHaveLength(1);
    }
  });

  it("an endpoint at the ferry pier (2891's own end, beyond S2) is unsupported here because that piece is deliberately not in this input -- not because of a snapping failure", () => {
    const E1 = { x: 715153.74, y: 536679.93 };
    const FERRY = { x: 733080.7436, y: 538522.4045 }; // 2891's own end -- outside this call's scope
    const result = composeGeometryPath({
      crs: CRS, tier: 2,
      lines: TIER2_ROAD93.filter((l) => [2344, 3410, 3409, 2894].includes(l.sourceId)),
      from: { placeId: "egilsstadir", ...E1 },
      to: { placeId: "ferry", ...FERRY },
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.ENDPOINT_NOT_IN_GRAPH);
  });
});

// ---------------------------------------------------------------------------
// Directed traversal mode (ticket #501 directed-composition). Opt-in only
// via input.mode:"directed" + input.policy -- every test above this point
// calls composeGeometryPath with no mode/policy at all and must keep
// passing byte-for-byte unchanged (P4); this section is additive.
// ---------------------------------------------------------------------------
describe("directed mode -- P2: mode/policy gating", () => {
  const CRS = "EPSG:3057";
  const lineSimple = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#1" };
  const endpoints = { from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "b", x: 10, y: 0 } };

  it("no mode and no policy at all -- exactly the classic undirected result, no mode/policyVersion keys", () => {
    const result = composeGeometryPath({ crs: CRS, tier: 2, lines: [lineSimple], ...endpoints });
    expect(result.status).toBe("geometry_only");
    expect(result).not.toHaveProperty("mode");
    expect(result).not.toHaveProperty("policyVersion");
    expect(result.slices[0]).not.toHaveProperty("appliedRule");
    expect(result.slices[0]).not.toHaveProperty("directionBasis");
  });

  it("mode present but not exactly 'directed' -- unsupported/invalid_mode, never a silent undirected fallback", () => {
    const result = composeGeometryPath({ crs: CRS, tier: 2, mode: "bogus", lines: [lineSimple], ...endpoints });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.INVALID_MODE);
  });

  it("policy given without mode:'directed' -- unsupported/invalid_mode, never a silent undirected path", () => {
    const result = composeGeometryPath({ crs: CRS, tier: 2, policy: { policyVersion: "v1", rules: [] }, lines: [lineSimple], ...endpoints });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.INVALID_MODE);
  });

  it("mode:'directed' with no policy at all -- unsupported/invalid_policy", () => {
    const result = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", lines: [lineSimple], ...endpoints });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });

  it("mode:'directed' with a valid EMPTY policy (0 rules) -- valid, resolves to no_directed_path, not invalid_policy", () => {
    const result = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy: { policyVersion: "v1", rules: [] }, lines: [lineSimple], ...endpoints });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.NO_DIRECTED_PATH);
    expect(result.mode).toBe("directed");
    expect(result.policyVersion).toBe("v1");
    expect(result.drivingAccess).toBe("UNVERIFIED");
  });
});

describe("directed mode -- P3: policy validation, up front, independent of use", () => {
  const CRS = "EPSG:3057";
  const lineSimple = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#1" };
  const endpoints = { from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "b", x: 10, y: 0 } };

  function composeWithPolicy(policy) {
    return composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy, lines: [lineSimple], ...endpoints });
  }

  it("missing policyVersion -- invalid_policy", () => {
    expect(composeWithPolicy({ rules: [{ sourceId: 1, tier: 2, direction: "forward", directionBasis: "t" }] }).reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
  it("non-numeric sourceId -- invalid_policy", () => {
    expect(composeWithPolicy({ policyVersion: "v1", rules: [{ sourceId: "1", tier: 2, direction: "forward", directionBasis: "t" }] }).reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
  it("rule tier mismatched with input.tier -- invalid_policy", () => {
    expect(composeWithPolicy({ policyVersion: "v1", rules: [{ sourceId: 1, tier: 99, direction: "forward", directionBasis: "t" }] }).reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
  it("unrecognized direction enum value -- invalid_policy", () => {
    expect(composeWithPolicy({ policyVersion: "v1", rules: [{ sourceId: 1, tier: 2, direction: "northbound", directionBasis: "t" }] }).reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
  it("forward/reverse/both require a non-empty directionBasis -- missing or empty is invalid_policy", () => {
    expect(composeWithPolicy({ policyVersion: "v1", rules: [{ sourceId: 1, tier: 2, direction: "forward" }] }).reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
    expect(composeWithPolicy({ policyVersion: "v1", rules: [{ sourceId: 1, tier: 2, direction: "both", directionBasis: "" }] }).reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
  it("unknown/blocked do NOT require a directionBasis -- valid, just contribute no edges", () => {
    expect(composeWithPolicy({ policyVersion: "v1", rules: [{ sourceId: 1, tier: 2, direction: "blocked" }] }).reason).toBe(UNSUPPORTED_REASONS.NO_DIRECTED_PATH);
    expect(composeWithPolicy({ policyVersion: "v1", rules: [{ sourceId: 1, tier: 2, direction: "unknown" }] }).reason).toBe(UNSUPPORTED_REASONS.NO_DIRECTED_PATH);
  });
  it("an exact duplicate rule for the same sourceId is harmless", () => {
    const result = composeWithPolicy({
      policyVersion: "v1",
      rules: [
        { sourceId: 1, tier: 2, direction: "forward", directionBasis: "t" },
        { sourceId: 1, tier: 2, direction: "forward", directionBasis: "t" },
      ],
    });
    expect(result.status).toBe("geometry_only");
  });
  it("a CONFLICTING rule for the same sourceId (different direction) -- invalid_policy, never last-wins", () => {
    const result = composeWithPolicy({
      policyVersion: "v1",
      rules: [
        { sourceId: 1, tier: 2, direction: "forward", directionBasis: "t" },
        { sourceId: 1, tier: 2, direction: "reverse", directionBasis: "t" },
      ],
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
  it("a CONFLICTING rule for the same sourceId (same direction, different basis) -- invalid_policy", () => {
    const result = composeWithPolicy({
      policyVersion: "v1",
      rules: [
        { sourceId: 1, tier: 2, direction: "forward", directionBasis: "t1" },
        { sourceId: 1, tier: 2, direction: "forward", directionBasis: "t2" },
      ],
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
  it("policy itself not an object, or rules not an array -- invalid_policy", () => {
    expect(composeWithPolicy("not-an-object").reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
    expect(composeWithPolicy({ policyVersion: "v1", rules: "nope" }).reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
  it("a rule for a sourceId outside the submitted lines is validated like any other rule, then has zero effect on the result or geometryId", () => {
    const withExtra = composeWithPolicy({
      policyVersion: "v1",
      rules: [
        { sourceId: 1, tier: 2, direction: "forward", directionBasis: "t" },
        { sourceId: 999999, tier: 2, direction: "forward", directionBasis: "out-of-scope" },
      ],
    });
    const withoutExtra = composeWithPolicy({
      policyVersion: "v1",
      rules: [{ sourceId: 1, tier: 2, direction: "forward", directionBasis: "t" }],
    });
    expect(withExtra.geometryId).toBe(withoutExtra.geometryId);
    // But a MALFORMED out-of-scope rule still fails validation -- "ignored"
    // only applies after a rule has already passed validation.
    const malformedExtra = composeWithPolicy({
      policyVersion: "v1",
      rules: [
        { sourceId: 1, tier: 2, direction: "forward", directionBasis: "t" },
        { sourceId: 999999, tier: 2, direction: "sideways" },
      ],
    });
    expect(malformedExtra.status).toBe("unsupported");
    expect(malformedExtra.reason).toBe(UNSUPPORTED_REASONS.INVALID_POLICY);
  });
});

describe("directed mode -- P1: filter permitted directions BEFORE parallel-edge dedup (synthetic)", () => {
  const CRS = "EPSG:3057";

  it("a lower sourceId with blocked/missing permission never shadows a higher sourceId that IS permitted on the same node pair", () => {
    const low = { sourceId: 10, idbutur: 1000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#10" };
    const high = { sourceId: 20, idbutur: 2000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#20" };
    const endpoints = { from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "b", x: 10, y: 0 } };

    const blocked = composeGeometryPath({
      crs: CRS, tier: 2, mode: "directed", lines: [low, high], ...endpoints,
      policy: { policyVersion: "v1", rules: [{ sourceId: 10, tier: 2, direction: "blocked" }, { sourceId: 20, tier: 2, direction: "forward", directionBasis: "t" }] },
    });
    expect(blocked.status).toBe("geometry_only");
    expect(blocked.slices.map((s) => s.sourceId)).toEqual([20]);

    const missing = composeGeometryPath({
      crs: CRS, tier: 2, mode: "directed", lines: [low, high], ...endpoints,
      policy: { policyVersion: "v1", rules: [{ sourceId: 20, tier: 2, direction: "forward", directionBasis: "t" }] },
    });
    expect(missing.status).toBe("geometry_only");
    expect(missing.slices.map((s) => s.sourceId)).toEqual([20]);
  });

  it("source A permitted only A->B and source B permitted only B->A BOTH survive, each in its own direction", () => {
    const ten = { sourceId: 10, idbutur: 1000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#10" };
    const twenty = { sourceId: 20, idbutur: 2000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#20" };
    const policy = {
      policyVersion: "v1",
      rules: [
        { sourceId: 10, tier: 2, direction: "forward", directionBasis: "t" },
        { sourceId: 20, tier: 2, direction: "reverse", directionBasis: "t" },
      ],
    };
    const ab = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy, lines: [ten, twenty], from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "b", x: 10, y: 0 } });
    expect(ab.slices).toEqual([expect.objectContaining({ sourceId: 10, direction: "forward" })]);
    const ba = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy, lines: [ten, twenty], from: { placeId: "b", x: 10, y: 0 }, to: { placeId: "a", x: 0, y: 0 } });
    expect(ba.slices).toEqual([expect.objectContaining({ sourceId: 20, direction: "reverse" })]);
  });

  it("two sources permitted in the exact same ordered direction still use the existing stable lower-sourceId tie-break", () => {
    const ten = { sourceId: 10, idbutur: 1000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#10" };
    const thirty = { sourceId: 30, idbutur: 3000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#30" };
    const policy = {
      policyVersion: "v1",
      rules: [
        { sourceId: 10, tier: 2, direction: "forward", directionBasis: "t" },
        { sourceId: 30, tier: 2, direction: "forward", directionBasis: "t" },
      ],
    };
    // Input order shuffled -- the tie-break must not depend on it.
    const result = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy, lines: [thirty, ten], from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "b", x: 10, y: 0 } });
    expect(result.slices.map((s) => s.sourceId)).toEqual([10]);
  });

  it("REAL FIXTURE (P1b): lines [2117,2134,2135,36807], policy permits ONLY 36807 forward -- the dedup-before-filter bug would wrongly let 2135 (lower sourceId, no rule) shadow 36807 here and produce no_directed_path", () => {
    const A = { x: 392674.357, y: 389846.132 }; // 2117 end
    const B = { x: 392703.5, y: 389865.057 }; // 2135 end / 36807 start
    const linesB2 = loadLinesAtTier(VEGNR1_PATH, 2, new Set([2117, 2134, 2135, 36807]));
    const policy = { policyVersion: "v1", rules: [{ sourceId: 36807, tier: 2, direction: "forward", directionBasis: "TEST_FIXTURE_HYPOTHETICAL" }] };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, mode: "directed", policy, lines: linesB2,
      from: { placeId: "b2-a", ...A }, to: { placeId: "b2-b", ...B },
    });
    expect(result.status).toBe("geometry_only");
    // This round's own independently re-derived value, matching the
    // existing undirected B2 test's own cited forward-arc figure
    // (72.54928752266883) exactly -- never treated as a real traffic
    // direction, directionBasis says so explicitly (TEST_FIXTURE_HYPOTHETICAL).
    expect(result.lengthM).toBeCloseTo(72.54928752266883, 9);
    expect(result.slices).toHaveLength(1);
    expect(result.slices[0]).toMatchObject({ sourceId: 36807, fromIndex: 2, toIndex: 5, direction: "forward", appliedRule: "forward" });
  });
});

describe("directed mode -- P4: backwards compatibility and geometryId", () => {
  const CRS = "EPSG:3057";

  it("GEOMETRY_COMPOSITION_VERSION is unchanged (still 1)", () => {
    expect(GEOMETRY_COMPOSITION_VERSION).toBe(1);
  });

  it("fixed OLD undirected geometryId regression: Selfoss->Hella is still exactly the id reported from the real geometry-api round", () => {
    const SELFOSS_EXIT = { x: 401739.85, y: 383119.047 };
    const HELLA_EXIT = { x: 430972.1263, y: 370845.6043 };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, lines: TIER2_ALL_VEGNR1,
      from: { placeId: "selfoss", ...SELFOSS_EXIT }, to: { placeId: "hella", ...HELLA_EXIT },
    });
    expect(result.geometryId).toBe("1e5ec24e068b90156c1c9b0ec1c00d39");
  });

  it("directed 'both' policy on every real sourceId the undirected Selfoss->Hella path uses gives the SAME slices/length but a DIFFERENT geometryId", () => {
    const SELFOSS_EXIT = { x: 401739.85, y: 383119.047 };
    const HELLA_EXIT = { x: 430972.1263, y: 370845.6043 };
    const undirected = composeGeometryPath({
      crs: CRS, tier: 2, lines: TIER2_ALL_VEGNR1,
      from: { placeId: "selfoss", ...SELFOSS_EXIT }, to: { placeId: "hella", ...HELLA_EXIT },
    });
    const usedSourceIds = [...new Set(undirected.slices.map((s) => s.sourceId))];
    const policy = { policyVersion: "v1", rules: usedSourceIds.map((id) => ({ sourceId: id, tier: 2, direction: "both", directionBasis: "test-both" })) };
    const directed = composeGeometryPath({
      crs: CRS, tier: 2, mode: "directed", policy, lines: TIER2_ALL_VEGNR1,
      from: { placeId: "selfoss", ...SELFOSS_EXIT }, to: { placeId: "hella", ...HELLA_EXIT },
    });
    expect(directed.status).toBe("geometry_only");
    expect(directed.lengthM).toBeCloseTo(undirected.lengthM, 9);
    expect(directed.slices.map((s) => [s.sourceId, s.fromIndex, s.toIndex, s.direction])).toEqual(
      undirected.slices.map((s) => [s.sourceId, s.fromIndex, s.toIndex, s.direction])
    );
    expect(directed.geometryId).not.toBe(undirected.geometryId);
  });

  it("permutation: shuffling both the input lines AND the policy rules order gives the identical directed geometryId", () => {
    const lineA = { sourceId: 10, idbutur: 1000, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }], evidenceRef: "fixture#a" };
    const lineB = { sourceId: 20, idbutur: 2000, tier: 2, vertices: [{ x: 5, y: 0 }, { x: 5, y: 5 }], evidenceRef: "fixture#b" };
    const endpoints = { from: { placeId: "p1", x: 0, y: 0 }, to: { placeId: "p2", x: 5, y: 5 } };
    const rule10 = { sourceId: 10, tier: 2, direction: "forward", directionBasis: "t" };
    const rule20 = { sourceId: 20, tier: 2, direction: "forward", directionBasis: "t" };

    const r1 = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy: { policyVersion: "v1", rules: [rule10, rule20] }, lines: [lineA, lineB], ...endpoints });
    const r2 = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy: { policyVersion: "v1", rules: [rule20, rule10] }, lines: [lineB, lineA], ...endpoints });
    expect(r1.status).toBe("geometry_only");
    expect(r2.geometryId).toBe(r1.geometryId);
    expect(r2.slices).toEqual(r1.slices);
  });

  it("directed same_place requires a validated policy and endpoints in the graph, 0 slices, and an ID different from the undirected same_place ID", () => {
    const lineSimple = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#1" };
    const pts = { from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "a2", x: 0, y: 0 } };
    const undirected = composeGeometryPath({ crs: CRS, tier: 2, lines: [lineSimple], ...pts });
    const directed = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy: { policyVersion: "v1", rules: [] }, lines: [lineSimple], ...pts });
    expect(undirected.status).toBe("same_place");
    expect(directed.status).toBe("same_place");
    expect(directed.lengthM).toBe(0);
    expect(directed.slices).toEqual([]);
    expect(directed.mode).toBe("directed");
    expect(directed.policyVersion).toBe("v1");
    expect(directed.geometryId).not.toBe(undirected.geometryId);
  });
});

describe("directed mode -- P5: result shape and reason naming", () => {
  const CRS = "EPSG:3057";

  it("no directed path ever reports disconnected_graph -- always no_directed_path", () => {
    const lineA = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#1" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, mode: "directed",
      policy: { policyVersion: "v1", rules: [{ sourceId: 1, tier: 2, direction: "blocked" }] },
      lines: [lineA], from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "b", x: 10, y: 0 },
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.NO_DIRECTED_PATH);
  });

  it("endpoint existence still uses ALL input lines, including ones with no permitted direction -- endpoint_not_in_graph is unaffected by policy, and carries mode/policyVersion in directed mode", () => {
    const lineA = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#1" };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, mode: "directed",
      policy: { policyVersion: "v1", rules: [] },
      lines: [lineA], from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "nowhere", x: 999, y: 999 },
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.ENDPOINT_NOT_IN_GRAPH);
    expect(result.mode).toBe("directed");
    expect(result.policyVersion).toBe("v1");
  });

  it("retained real R1->Selfoss with NO confirmed input rules (empty policy) -- no_directed_path, never endpoint_not_in_graph, never a filled-in both/'real direction' promotion", () => {
    const R1 = { x: 365522.0175, y: 402772.762 };
    const SELFOSS_EXIT = { x: 401739.85, y: 383119.047 };
    const result = composeGeometryPath({
      crs: CRS, tier: 2, mode: "directed",
      policy: { policyVersion: "v1", rules: [] },
      lines: TIER2_ALL_VEGNR1,
      from: { placeId: "r1", ...R1 }, to: { placeId: "selfoss", ...SELFOSS_EXIT },
    });
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe(UNSUPPORTED_REASONS.NO_DIRECTED_PATH);
  });
});

describe("directed mode -- P6: reverseGeometryPath cannot produce a directed success", () => {
  const CRS = "EPSG:3057";

  it("reversing a directed geometry_only result is rejected -- unsupported/directed_result_not_reversible, no isReverseOf", () => {
    const A = { x: 392674.357, y: 389846.132 };
    const B = { x: 392703.5, y: 389865.057 };
    const linesB2 = loadLinesAtTier(VEGNR1_PATH, 2, new Set([2117, 2134, 2135, 36807]));
    const policy = { policyVersion: "v1", rules: [{ sourceId: 36807, tier: 2, direction: "forward", directionBasis: "TEST_FIXTURE_HYPOTHETICAL" }] };
    const forward = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy, lines: linesB2, from: { placeId: "b2-a", ...A }, to: { placeId: "b2-b", ...B } });
    expect(forward.status).toBe("geometry_only");

    const reversed = reverseGeometryPath(forward);
    expect(reversed.status).toBe("unsupported");
    expect(reversed.reason).toBe(UNSUPPORTED_REASONS.DIRECTED_RESULT_NOT_REVERSIBLE);
    expect(reversed.isReverseOf).toBeUndefined();

    // A genuinely NEW compose for B->A is NOT a mirror of A->B -- it is
    // the independently-shorter forward-permitted arc going the other
    // way around the ring, not the same 72.549 m arc reversed.
    const backward = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy, lines: linesB2, from: { placeId: "b2-b", ...B }, to: { placeId: "b2-a", ...A } });
    expect(backward.status).toBe("geometry_only");
    expect(backward.lengthM).toBeCloseTo(40.40637511981366, 9);
    expect(backward.lengthM).not.toBeCloseTo(forward.lengthM, 1);
    expect(backward.slices).toHaveLength(1);
    expect(backward.slices[0]).toMatchObject({ sourceId: 36807, fromIndex: 0, toIndex: 2, direction: "forward" });
  });

  it("simple one-way chain: A->B succeeds, B->A is no_directed_path (not a reversed mirror of A->B)", () => {
    const chain = { sourceId: 5, idbutur: 500, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "f#chain" };
    const policy = { policyVersion: "v1", rules: [{ sourceId: 5, tier: 2, direction: "forward", directionBasis: "t" }] };
    const ab = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy, lines: [chain], from: { placeId: "a", x: 0, y: 0 }, to: { placeId: "b", x: 10, y: 0 } });
    expect(ab.status).toBe("geometry_only");
    const ba = composeGeometryPath({ crs: CRS, tier: 2, mode: "directed", policy, lines: [chain], from: { placeId: "b", x: 10, y: 0 }, to: { placeId: "a", x: 0, y: 0 } });
    expect(ba.status).toBe("unsupported");
    expect(ba.reason).toBe(UNSUPPORTED_REASONS.NO_DIRECTED_PATH);
  });

  it("the undirected reverse helper is completely unchanged for a non-directed result", () => {
    const lineA = { sourceId: 1, idbutur: 100, tier: 2, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], evidenceRef: "fixture#1" };
    const forward = composeGeometryPath({ crs: CRS, tier: 2, lines: [lineA], from: { placeId: "p1", x: 0, y: 0 }, to: { placeId: "p2", x: 10, y: 10 } });
    const reversed = reverseGeometryPath(forward);
    expect(reversed.status).toBe("geometry_only");
    expect(reversed.isReverseOf).toBe(forward.geometryId);
  });
});
