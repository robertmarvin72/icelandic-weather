// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { composeGeometryPath } from "./geometryComposition.js";
import {
  isRaudavatnSelfossPair,
  buildMvpConnectorLine,
  buildMvpDirectedInput,
  CONNECTOR_SOURCE_ID,
  MVP_ASSUMPTION_BASIS,
} from "./raudavatnSelfossMvpPolicy.js";

const DATASET_PATH = path.join(process.cwd(), "server_data/winter-route-geometry-pilot.json");
const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
const { lines, endpoints, crs, tier } = dataset;

function composeMvp(fromId, toId) {
  const { lines: mvpLines, policy } = buildMvpDirectedInput({ lines, tier });
  return composeGeometryPath({
    crs, tier, mode: "directed", policy, lines: mvpLines,
    from: { placeId: fromId, x: endpoints[fromId].x, y: endpoints[fromId].y },
    to: { placeId: toId, x: endpoints[toId].x, y: endpoints[toId].y },
  });
}

describe("isRaudavatnSelfossPair", () => {
  it("true for exactly the four ordered pilot pairs (raudavatn-hella-mvp P1)", () => {
    expect(isRaudavatnSelfossPair("reykjavik-raudavatn", "selfoss")).toBe(true);
    expect(isRaudavatnSelfossPair("selfoss", "reykjavik-raudavatn")).toBe(true);
    expect(isRaudavatnSelfossPair("reykjavik-raudavatn", "hella")).toBe(true);
    expect(isRaudavatnSelfossPair("hella", "reykjavik-raudavatn")).toBe(true);
  });
  it("false for Selfoss<->Hella -- a 3-place set would wrongly catch this pair (P1); it must stay on the plain undirected API contract", () => {
    expect(isRaudavatnSelfossPair("selfoss", "hella")).toBe(false);
    expect(isRaudavatnSelfossPair("hella", "selfoss")).toBe(false);
  });
  it("false for same-id (any of the three places) and for unrelated pairs", () => {
    expect(isRaudavatnSelfossPair("reykjavik-raudavatn", "reykjavik-raudavatn")).toBe(false);
    expect(isRaudavatnSelfossPair("selfoss", "selfoss")).toBe(false);
    expect(isRaudavatnSelfossPair("hella", "hella")).toBe(false);
    expect(isRaudavatnSelfossPair("hella", "egilsstadir")).toBe(false);
    expect(isRaudavatnSelfossPair("egilsstadir", "seydisfjordur")).toBe(false);
    expect(isRaudavatnSelfossPair("reykjavik-raudavatn", "egilsstadir")).toBe(false);
  });
});

describe("buildMvpConnectorLine", () => {
  it("is the one literal, estimated connector -- reserved negative sourceId, no fabricated idbutur/evidence", () => {
    const line = buildMvpConnectorLine(2);
    expect(line.sourceId).toBe(CONNECTOR_SOURCE_ID);
    expect(line.sourceId).toBeLessThan(0);
    expect(line.idbutur).toBeNull();
    expect(line.evidenceRef).toBe("pilot-connector:estimated");
    expect(line.vertices).toEqual([
      { x: 369314.313, y: 400649.381, z: null },
      { x: 369350.3714, y: 400623.7933, z: null },
    ]);
  });

  it("the connector's own literal length is under the 45 m limit (independently re-derived, not trusted blind)", () => {
    const [a, b] = buildMvpConnectorLine(2).vertices;
    const length = Math.hypot(a.x - b.x, a.y - b.y);
    expect(length).toBeCloseTo(44.214687625802, 6);
    expect(length).toBeLessThan(45);
  });

  it("the connector's reserved sourceId never collides with any real line in the shared dataset", () => {
    expect(lines.some((l) => l.sourceId === CONNECTOR_SOURCE_ID)).toBe(false);
  });
});

describe("buildMvpDirectedInput", () => {
  it("covers every line in the dataset (this corridor's VEGHLUTI values are all in {1,3,4,5,6,7,8}) plus the connector rule", () => {
    const { policy } = buildMvpDirectedInput({ lines, tier });
    // +1 for the connector's own rule.
    expect(policy.rules).toHaveLength(lines.length + 1);
    expect(policy.rules.every((r) => r.directionBasis === MVP_ASSUMPTION_BASIS || r.direction === "both" || r.direction === "forward")).toBe(true);
  });

  it("assigns 'both' to VEGHLUTI 1/8 and 'forward' to 3/4/5/6/7, never silently authorizing any other category", () => {
    const { policy } = buildMvpDirectedInput({ lines, tier });
    const bySourceId = new Map(policy.rules.map((r) => [r.sourceId, r]));
    for (const line of lines) {
      const rule = bySourceId.get(line.sourceId);
      if (line.veghluti === 1 || line.veghluti === 8) {
        expect(rule.direction).toBe("both");
      } else if ([3, 4, 5, 6, 7].includes(line.veghluti)) {
        expect(rule.direction).toBe("forward");
      } else {
        expect(rule).toBeUndefined();
      }
    }
  });

  it("appends the connector line to the returned lines array without mutating the shared dataset's own lines array", () => {
    const before = lines.length;
    const { lines: mvpLines } = buildMvpDirectedInput({ lines, tier });
    expect(mvpLines).toHaveLength(before + 1);
    expect(lines).toHaveLength(before); // unmutated
    expect(mvpLines[mvpLines.length - 1].sourceId).toBe(CONNECTOR_SOURCE_ID);
  });

  it("P4: policyVersion changes if a rule OR the connector's own coordinates change, and is otherwise stable", () => {
    const a = buildMvpDirectedInput({ lines, tier });
    const b = buildMvpDirectedInput({ lines, tier });
    expect(a.policy.policyVersion).toBe(b.policy.policyVersion); // stable for unchanged input

    const mutatedLines = lines.map((l) => (l.sourceId === lines[0].sourceId ? { ...l, veghluti: 999 } : l));
    const c = buildMvpDirectedInput({ lines: mutatedLines, tier });
    expect(c.policy.policyVersion).not.toBe(a.policy.policyVersion);
  });
});

describe("real end-to-end MVP composition (production core, real pilot dataset)", () => {
  it("P1/P5(c): WITHOUT the connector, eastbound R1->Selfoss already works (same length as the plain undirected path), but westbound Selfoss->R1 is no_directed_path -- the connector is the only reason the reverse direction succeeds", () => {
    const rulesOnly = []; // rebuild without connector, same veghluti logic
    for (const line of lines) {
      if (line.veghluti === 1 || line.veghluti === 8) rulesOnly.push({ sourceId: line.sourceId, tier, direction: "both", directionBasis: MVP_ASSUMPTION_BASIS });
      else if ([3, 4, 5, 6, 7].includes(line.veghluti)) rulesOnly.push({ sourceId: line.sourceId, tier, direction: "forward", directionBasis: MVP_ASSUMPTION_BASIS });
    }
    const policy = { policyVersion: "test-no-connector", rules: rulesOnly };
    const eastbound = composeGeometryPath({
      crs, tier, mode: "directed", policy, lines,
      from: { placeId: "reykjavik-raudavatn", ...endpoints["reykjavik-raudavatn"] },
      to: { placeId: "selfoss", ...endpoints.selfoss },
    });
    expect(eastbound.status).toBe("geometry_only");
    expect(eastbound.lengthM).toBeCloseTo(44984.77037809235, 6);

    const westbound = composeGeometryPath({
      crs, tier, mode: "directed", policy, lines,
      from: { placeId: "selfoss", ...endpoints.selfoss },
      to: { placeId: "reykjavik-raudavatn", ...endpoints["reykjavik-raudavatn"] },
    });
    expect(westbound.status).toBe("unsupported");
    expect(westbound.reason).toBe("no_directed_path");
  });

  it("P5(a,b,d): eastbound WITH connector -- same length as undirected (connector unused), passes through 2071/2024/2117, ring 36807 forward", () => {
    const result = composeMvp("reykjavik-raudavatn", "selfoss");
    expect(result.status).toBe("geometry_only");
    expect(result.mode).toBe("directed");
    expect(result.lengthM).toBeCloseTo(44984.77037809235, 6);
    const sourceIds = result.slices.map((s) => s.sourceId);
    expect(sourceIds).toEqual(expect.arrayContaining([2071, 2024, 2117]));
    expect(sourceIds).not.toContain(CONNECTOR_SOURCE_ID); // not needed eastbound
    const ring = result.slices.find((s) => s.sourceId === 36807);
    expect(ring.direction).toBe("forward");
    expect([ring.fromIndex, ring.toIndex]).toEqual([2, 4]);
  });

  it("P5(a,b,d,e): westbound WITH connector -- succeeds, passes through 2134/2116/2021, uses the connector exactly once, ring 36807 forward 0->1", () => {
    const result = composeMvp("selfoss", "reykjavik-raudavatn");
    expect(result.status).toBe("geometry_only");
    expect(result.mode).toBe("directed");
    // Jonesy's own sandbox cross-check: 45,101.810 m, 9 slices.
    expect(result.lengthM).toBeCloseTo(45101.80950260295, 3);
    expect(result.slices).toHaveLength(9);
    const sourceIds = result.slices.map((s) => s.sourceId);
    expect(sourceIds).toEqual(expect.arrayContaining([2134, 2116, 2021]));
    const connectorSlices = result.slices.filter((s) => s.sourceId === CONNECTOR_SOURCE_ID);
    expect(connectorSlices).toHaveLength(1);
    expect(connectorSlices[0].direction).toBe("forward");
    expect(connectorSlices[0].lengthM).toBeCloseTo(44.214687625802, 6);
    const ring = result.slices.find((s) => s.sourceId === 36807);
    expect(ring.direction).toBe("forward");
    expect([ring.fromIndex, ring.toIndex]).toEqual([0, 1]);
  });

  it("both real endpoints are continuous and endpoint-pinned, length independently re-summable from the slices alone", () => {
    for (const [fromId, toId] of [["reykjavik-raudavatn", "selfoss"], ["selfoss", "reykjavik-raudavatn"]]) {
      const result = composeMvp(fromId, toId);
      const linesById = new Map([...lines, buildMvpConnectorLine(tier)].map((l) => [l.sourceId, l]));
      let independentSum = 0;
      for (const s of result.slices) {
        const line = linesById.get(s.sourceId);
        const lo = Math.min(s.fromIndex, s.toIndex);
        const hi = Math.max(s.fromIndex, s.toIndex);
        for (let i = lo; i < hi; i++) {
          independentSum += Math.hypot(line.vertices[i + 1].x - line.vertices[i].x, line.vertices[i + 1].y - line.vertices[i].y);
        }
      }
      expect(independentSum).toBeCloseTo(result.lengthM, 6);
    }
  });

  it("P1/P4/P5 (raudavatn-hella-mvp): R1<->Hella is now a genuine pilot pair -- directed matches the undirected length exactly in BOTH directions (no connector used eastbound, used once westbound), 21/19 slices, eastbound uses rings 8676/3454 forward 2->4, westbound uses 3454 forward 0->2 and 8676 forward 1->2", () => {
    const eastbound = composeMvp("reykjavik-raudavatn", "hella");
    expect(eastbound.status).toBe("geometry_only");
    expect(eastbound.lengthM).toBeCloseTo(80681.31193354058, 6);
    expect(eastbound.slices).toHaveLength(21);
    expect(eastbound.slices.filter((s) => s.sourceId === CONNECTOR_SOURCE_ID)).toHaveLength(0);
    expect(eastbound.slices.find((s) => s.sourceId === 8676)).toMatchObject({ fromIndex: 2, toIndex: 4, direction: "forward" });
    expect(eastbound.slices.find((s) => s.sourceId === 3454)).toMatchObject({ fromIndex: 2, toIndex: 4, direction: "forward" });

    const westbound = composeMvp("hella", "reykjavik-raudavatn");
    expect(westbound.status).toBe("geometry_only");
    expect(westbound.lengthM).toBeCloseTo(80747.98695209449, 6);
    expect(westbound.slices).toHaveLength(19);
    const connectorSlices = westbound.slices.filter((s) => s.sourceId === CONNECTOR_SOURCE_ID);
    expect(connectorSlices).toHaveLength(1);
    expect(connectorSlices[0].lengthM).toBeCloseTo(44.214687625802, 6);
    expect(westbound.slices.find((s) => s.sourceId === 3454)).toMatchObject({ fromIndex: 0, toIndex: 2, direction: "forward" });
    expect(westbound.slices.find((s) => s.sourceId === 8676)).toMatchObject({ fromIndex: 1, toIndex: 2, direction: "forward" });
  });

  it("P3 (raudavatn-hella-mvp, documented not fixed): the eastbound 3591 slice runs ~3.2 m against ring 16641's own drawn direction right at the pinned Hella endpoint -- 3591 itself is veghluti 'both', so this is permitted; the endpoint/policy/connector are NOT adjusted to hide it", () => {
    const eastbound = composeMvp("reykjavik-raudavatn", "hella");
    const slice3591 = eastbound.slices.find((s) => s.sourceId === 3591);
    expect(slice3591).toMatchObject({ fromIndex: 3, toIndex: 0, direction: "reverse", appliedRule: "both" });
    // The final ~3.2 m of this slice (vertices 2->1->0) runs against ring
    // 16641's own drawn order -- independently re-derived here from the
    // same literal retained vertices, not trusted blind.
    const v = lines.find((l) => l.sourceId === 3591).vertices;
    const against = Math.hypot(v[1].x - v[2].x, v[1].y - v[2].y) + Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y);
    expect(against).toBeCloseTo(3.189, 2);
  });

  it("P1/P4 (raudavatn-hella-mvp): Selfoss<->Hella under the SAME MVP policy+connector gives a DIFFERENT length than the plain undirected call -- this is exactly why it must NOT be in the pilot pair set", () => {
    const undirected = composeGeometryPath({
      crs, tier, lines,
      from: { placeId: "selfoss", ...endpoints.selfoss },
      to: { placeId: "hella", ...endpoints.hella },
    });
    const { lines: mvpLines, policy } = buildMvpDirectedInput({ lines, tier });
    const directed = composeGeometryPath({
      crs, tier, mode: "directed", policy, lines: mvpLines,
      from: { placeId: "selfoss", ...endpoints.selfoss },
      to: { placeId: "hella", ...endpoints.hella },
    });
    expect(undirected.lengthM).toBeCloseTo(35646.17744949154, 6);
    expect(undirected.geometryId).toBe("1e5ec24e068b90156c1c9b0ec1c00d39");
    expect(directed.lengthM).toBeCloseTo(35696.54155544823, 6);
    expect(directed.lengthM).not.toBeCloseTo(undirected.lengthM, 1);
  });

  it("P5: a genuinely unrelated pair (egilsstadir<->seydisfjordur) and same_place are untouched by the MVP policy existing", () => {
    const es = composeGeometryPath({
      crs, tier, lines,
      from: { placeId: "egilsstadir", ...endpoints.egilsstadir },
      to: { placeId: "seydisfjordur", ...endpoints.seydisfjordur },
    });
    expect(es.status).toBe("geometry_only");
    expect(es.lengthM).toBeCloseTo(24148.860880942146, 6);
    expect(es).not.toHaveProperty("mode");

    const samePlace = composeGeometryPath({
      crs, tier, lines,
      from: { placeId: "hella", ...endpoints.hella },
      to: { placeId: "hella", ...endpoints.hella },
    });
    expect(samePlace.status).toBe("same_place");
    expect(samePlace.lengthM).toBe(0);
  });
});
