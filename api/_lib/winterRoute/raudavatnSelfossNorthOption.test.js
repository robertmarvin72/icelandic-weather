// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { composeGeometryPath } from "./geometryComposition.js";
import { buildMvpDirectedInput } from "./raudavatnSelfossMvpPolicy.js";
import { buildNorthDirectedInput, NORTH_CONNECTOR_SOURCE_IDS } from "./raudavatnSelfossNorthOption.js";

const DATASET_PATH = path.join(process.cwd(), "server_data/winter-route-geometry-pilot.json");
const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
const { lines, endpoints, crs, tier } = dataset;

function composeNorthLeg(fromId, toId) {
  const { lines: northLines, policy } = buildNorthDirectedInput({ lines, tier });
  return composeGeometryPath({
    crs, tier, mode: "directed", policy, lines: northLines,
    from: { placeId: fromId, x: endpoints[fromId].x, y: endpoints[fromId].y },
    to: { placeId: toId, x: endpoints[toId].x, y: endpoints[toId].y },
  });
}

describe("buildNorthDirectedInput", () => {
  it("reuses the south base (buildMvpDirectedInput) byte-for-byte, adding exactly the two north connectors on top", () => {
    const south = buildMvpDirectedInput({ lines, tier });
    const north = buildNorthDirectedInput({ lines, tier });
    expect(north.lines).toHaveLength(south.lines.length + 2);
    expect(north.policy.rules).toHaveLength(south.policy.rules.length + 2);
    expect(NORTH_CONNECTOR_SOURCE_IDS).toEqual([-2, -3]);
    for (const id of NORTH_CONNECTOR_SOURCE_IDS) {
      expect(north.lines.some((l) => l.sourceId === id)).toBe(true);
      expect(lines.some((l) => l.sourceId === id)).toBe(false); // never collides with a real line
    }
  });

  it("the two connectors' own literal lengths match the real retained gap (11.025 m and 2.344 m), both under 45 m", () => {
    const { lines: northLines } = buildNorthDirectedInput({ lines, tier });
    const [a, b] = NORTH_CONNECTOR_SOURCE_IDS.map((id) => northLines.find((l) => l.sourceId === id));
    const lenA = Math.hypot(a.vertices[0].x - a.vertices[1].x, a.vertices[0].y - a.vertices[1].y);
    const lenB = Math.hypot(b.vertices[0].x - b.vertices[1].x, b.vertices[0].y - b.vertices[1].y);
    expect(lenA).toBeCloseTo(11.025039643043637, 6);
    expect(lenB).toBeCloseTo(2.3441380548430044, 6);
    expect(lenA).toBeLessThan(45);
    expect(lenB).toBeLessThan(45);
    expect(a.idbutur).toBeNull();
    expect(b.idbutur).toBeNull();
  });

  it("policyVersion is distinct from the south policyVersion and stable across repeated calls", () => {
    const south = buildMvpDirectedInput({ lines, tier });
    const north1 = buildNorthDirectedInput({ lines, tier });
    const north2 = buildNorthDirectedInput({ lines, tier });
    expect(north1.policy.policyVersion).not.toBe(south.policy.policyVersion);
    expect(north1.policy.policyVersion).toBe(north2.policy.policyVersion);
  });
});

describe("north option real legs (production core, real pilot dataset) -- P1: the north option must never be the false 'detour via Selfoss' path", () => {
  it("R1->E1: the real long north leg, matches the independently re-run reference length/slice-count exactly, and includes real north-corridor line names", () => {
    const result = composeNorthLeg("reykjavik-raudavatn", "egilsstadir");
    expect(result.status).toBe("geometry_only");
    expect(result.lengthM).toBeCloseTo(615370.8445819074, 6);
    expect(result.slices).toHaveLength(119);
  });

  it("E1->Selfoss and Selfoss->E1: the south-coast leg via Vík, never touching any Hellisheiði-only south-pilot sourceId (2138/2135/36807)", () => {
    const east = composeNorthLeg("egilsstadir", "selfoss");
    expect(east.status).toBe("geometry_only");
    expect(east.lengthM).toBeCloseTo(620667.4776285192, 6);
    expect(east.slices).toHaveLength(87);
    expect(east.slices.some((s) => [2138, 2135, 36807].includes(s.sourceId))).toBe(false);

    const west = composeNorthLeg("selfoss", "egilsstadir");
    expect(west.status).toBe("geometry_only");
    expect(west.lengthM).toBeCloseTo(620678.8960793203, 6);
    expect(west.slices).toHaveLength(87);
    expect(west.slices.some((s) => [2138, 2135, 36807].includes(s.sourceId))).toBe(false);
  });

  it("E1->R1 WITHOUT the two connectors is the false-north trap: disconnected at the real gap, so the only available path detours via Selfoss (~665.8 km) -- never to be presented as 'north'", () => {
    const { lines: northLines, policy } = buildNorthDirectedInput({ lines, tier });
    const rulesWithoutConnectors = { policyVersion: policy.policyVersion, rules: policy.rules.filter((r) => !NORTH_CONNECTOR_SOURCE_IDS.includes(r.sourceId)) };
    const linesWithoutConnectors = northLines.filter((l) => !NORTH_CONNECTOR_SOURCE_IDS.includes(l.sourceId));
    const trapResult = composeGeometryPath({
      crs, tier, mode: "directed", policy: rulesWithoutConnectors, lines: linesWithoutConnectors,
      from: { placeId: "egilsstadir", ...endpoints.egilsstadir },
      to: { placeId: "reykjavik-raudavatn", ...endpoints["reykjavik-raudavatn"] },
    });
    expect(trapResult.status).toBe("geometry_only");
    expect(trapResult.lengthM).toBeCloseTo(665769.287131122, 3);
    // The real north result is a genuinely shorter, different path -- proving the
    // "without connectors" result above really is the wrong, false-north detour.
    const realResult = composeNorthLeg("egilsstadir", "reykjavik-raudavatn");
    expect(realResult.lengthM).toBeLessThan(trapResult.lengthM);
  });

  it("E1->R1 WITH the two connectors: the real ~615.5 km ring route, each connector used exactly once, forward, estimated", () => {
    const result = composeNorthLeg("egilsstadir", "reykjavik-raudavatn");
    expect(result.status).toBe("geometry_only");
    expect(result.lengthM).toBeCloseTo(615545.095988132, 6);
    expect(result.slices).toHaveLength(121);
    for (const id of NORTH_CONNECTOR_SOURCE_IDS) {
      const connectorSlices = result.slices.filter((s) => s.sourceId === id);
      expect(connectorSlices).toHaveLength(1);
      expect(connectorSlices[0].direction).toBe("forward");
      expect(connectorSlices[0].appliedRule).toBe("forward");
    }
  });

  it("P1: no TRUE edge-level double-count anywhere in any of the four legs (a piece may legitimately recur in two non-adjacent slices, e.g. a roundabout touched at two different access points, but never the exact same traversed span twice)", () => {
    function hasEdgeLevelDuplicate(slices) {
      const seen = new Set();
      for (const s of slices) {
        const key = `${s.sourceId}:${Math.min(s.fromIndex, s.toIndex)}-${Math.max(s.fromIndex, s.toIndex)}`;
        if (seen.has(key)) return key;
        seen.add(key);
      }
      return null;
    }
    const r1e1 = composeNorthLeg("reykjavik-raudavatn", "egilsstadir");
    const e1selfoss = composeNorthLeg("egilsstadir", "selfoss");
    const selfosse1 = composeNorthLeg("selfoss", "egilsstadir");
    const e1r1 = composeNorthLeg("egilsstadir", "reykjavik-raudavatn");
    expect(hasEdgeLevelDuplicate(r1e1.slices)).toBeNull();
    expect(hasEdgeLevelDuplicate(e1selfoss.slices)).toBeNull();
    expect(hasEdgeLevelDuplicate(selfosse1.slices)).toBeNull();
    expect(hasEdgeLevelDuplicate(e1r1.slices)).toBeNull();
  });

  it("P4 (documented, not fixed): sourceId 32964's own vertex1<->vertex2 sub-segment (36.25017 m) is the exact point two retained features meet -- 32964 (the direct 'both' connector) and roundabout 33604 (which connects the SAME two literal points via its own separate ring). On E1->R1 this sub-segment is merged inside a larger reverse slice; its own drawn connection via 33604 runs the opposite way. This is an Akureyri-area quirk, same family as the Hella/16641 case -- not corrected here.", () => {
    const { lines: northLines } = buildNorthDirectedInput({ lines, tier });
    const line32964 = northLines.find((l) => l.sourceId === 32964);
    const line33604 = northLines.find((l) => l.sourceId === 33604);
    const subSegmentLength = Math.hypot(line32964.vertices[1].x - line32964.vertices[2].x, line32964.vertices[1].y - line32964.vertices[2].y);
    expect(subSegmentLength).toBeCloseTo(36.25016978227996, 6);
    // Confirms 33604 connects the exact same two literal points as 32964's own vertex1/vertex2.
    expect(line33604.vertices[0]).toEqual(line32964.vertices[1]);
    expect(line33604.vertices[1]).toEqual(line32964.vertices[2]);

    const e1r1 = composeNorthLeg("egilsstadir", "reykjavik-raudavatn");
    const slice32964 = e1r1.slices.find((s) => s.sourceId === 32964);
    expect(slice32964).toMatchObject({ fromIndex: 3, toIndex: 0, direction: "reverse" });
    // The real route never uses 33604 itself here -- the direct 32964 edge wins (P4 tie-break).
    expect(e1r1.slices.some((s) => s.sourceId === 33604)).toBe(false);
  });
});
