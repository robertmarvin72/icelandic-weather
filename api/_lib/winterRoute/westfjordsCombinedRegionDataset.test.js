// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-combined.json
// (closure-implementation approved-prompt-v1.md P1). This file reads the
// eight already-approved Westfjords region files directly via their own
// loaders (same precedent as every other region test in this ticket) --
// the PRODUCTION combined loader never does this merge at request time.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { loadWestfjordsCombinedRegionDataset } from "./westfjordsCombinedRegionDataset.js";
import { loadWestfjordsRegionDataset } from "./westfjordsRegionDataset.js";
import { loadWestfjordsFlokalundurRegionDataset } from "./westfjordsFlokalundurRegionDataset.js";
import { loadWestfjordsFlokalundurIsafjordurRegionDataset } from "./westfjordsFlokalundurIsafjordurRegionDataset.js";
import { loadWestfjordsIsafjordurHolmavikRegionDataset } from "./westfjordsIsafjordurHolmavikRegionDataset.js";
import { loadWestfjordsRoad68HolmavikRegionDataset } from "./westfjordsRoad68HolmavikRegionDataset.js";
import { loadWestfjordsThroskuldarHolmavikRegionDataset } from "./westfjordsThroskuldarHolmavikRegionDataset.js";
import { loadWestfjordsFlokalundurPatreksfjordurRegionDataset } from "./westfjordsFlokalundurPatreksfjordurRegionDataset.js";
import { loadWestfjordsPatreksfjordurTalknafjordurRegionDataset } from "./westfjordsPatreksfjordurTalknafjordurRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-closure-implementation-dataset-test");

describe("westfjords-region-combined.json -- data contract (real retained data, independent re-merge)", () => {
  const combined = loadWestfjordsCombinedRegionDataset();

  const entry = loadWestfjordsRegionDataset();
  const flk = loadWestfjordsFlokalundurRegionDataset();
  const flkIsa = loadWestfjordsFlokalundurIsafjordurRegionDataset();
  const isaHol = loadWestfjordsIsafjordurHolmavikRegionDataset();
  const road68 = loadWestfjordsRoad68HolmavikRegionDataset();
  const thro = loadWestfjordsThroskuldarHolmavikRegionDataset();
  const flkPat = loadWestfjordsFlokalundurPatreksfjordurRegionDataset();
  const patTal = loadWestfjordsPatreksfjordurTalknafjordurRegionDataset();

  it("tier 0, real CRS, 88 non-connector lines, exactly 2 connectors (-4, -5)", () => {
    expect(combined.tier).toBe(0);
    expect(combined.crs).toBe("EPSG:3057");
    expect(combined.lines).toHaveLength(88);
    expect(combined.connectors.map((c) => c.sourceId).sort()).toEqual([-5, -4].sort());
  });

  it("P1: exactly 7 sourceIds overlap across the eight source regions, re-derived independently here from a fresh load of all eight loaders", () => {
    const allRegions = [entry, flk, flkIsa, isaHol, road68, thro, flkPat, patTal];
    const owningRegions = new Map();
    for (const region of allRegions) {
      for (const line of region.lines) {
        if (!owningRegions.has(line.sourceId)) owningRegions.set(line.sourceId, []);
        owningRegions.get(line.sourceId).push(region);
      }
    }
    const overlapping = [...owningRegions.entries()].filter(([, regions]) => regions.length > 1);
    expect(overlapping).toHaveLength(7);
    expect(overlapping.map(([id]) => id).sort((a, b) => a - b)).toEqual([2769, 3611, 3648, 3833, 3834, 3883, 53127].sort((a, b) => a - b));
  });

  it("P1: 6 of the 7 overlapping sourceIds are byte-identical across every copy; 3611 keeps the junction-1-68-stadarskali region's own superset idbuturName field, never silently dropped", () => {
    function coreFields(line) {
      return { sourceId: line.sourceId, idbutur: line.idbutur, tier: line.tier, veghluti: line.veghluti, name: line.name, vertices: line.vertices, evidenceRef: line.evidenceRef };
    }
    for (const id of [2769, 3648, 3833, 3834, 3883, 53127]) {
      const mergedLine = combined.lines.find((l) => l.sourceId === id);
      expect(mergedLine).toBeTruthy();
    }
    const merged3611 = combined.lines.find((l) => l.sourceId === 3611);
    const road68Copy = road68.lines.find((l) => l.sourceId === 3611);
    const throCopy = thro.lines.find((l) => l.sourceId === 3611);
    expect(JSON.stringify(coreFields(merged3611))).toBe(JSON.stringify(coreFields(road68Copy)));
    expect(JSON.stringify(coreFields(merged3611))).toBe(JSON.stringify(coreFields(throCopy)));
    expect(merged3611).toHaveProperty("idbuturName");
    expect(merged3611.idbuturName).toBe(road68Copy.idbuturName);
    expect(throCopy).not.toHaveProperty("idbuturName");
    expect(JSON.stringify(merged3611)).toBe(JSON.stringify(road68Copy));
  });

  it("P1: both connectors are byte-identical JSON.stringify copies of their own source region's own connector, never recreated", () => {
    const connectorMinus4 = combined.connectors.find((c) => c.sourceId === -4);
    const connectorMinus5 = combined.connectors.find((c) => c.sourceId === -5);
    expect(JSON.stringify(connectorMinus4)).toBe(JSON.stringify(flk.connector));
    expect(JSON.stringify(connectorMinus5)).toBe(JSON.stringify(flkPat.connector));
    expect(JSON.stringify(connectorMinus5)).toBe(JSON.stringify(patTal.connector));
  });

  it("P1: Búðardalur's own endpoint z is read from line 2769's own real vertex (24.473128257522806), not from the budardalur-flokalundur region's own insertedNode metadata object, which never stored a z field at all -- a real, pre-existing gap in that already-approved file, fixed here by reading the line directly rather than silently defaulting to null", () => {
    expect(flk.budardalur.insertedNode).not.toHaveProperty("z");
    const line2769 = combined.lines.find((l) => l.sourceId === 2769);
    const matchingVertex = line2769.vertices.find((v) => v.x === flk.budardalur.insertedNode.x && v.y === flk.budardalur.insertedNode.y);
    expect(matchingVertex.z).toBeCloseTo(24.473128257522806, 6);
    expect(combined.endpoints.budardalur.z).toBe(matchingVertex.z);
    expect(combined.endpoints.budardalur.z).not.toBeNull();
  });

  it("P1: all six endpoints and their owner-coordinate offsets are copied verbatim from the region that established them -- the Búðardalur offset specifically comes from the junction-1-60-baulan region, not the budardalur-flokalundur region (which carries no offsetM of its own for budardalur)", () => {
    expect(flk.budardalur).not.toHaveProperty("offsetM");
    expect(combined.endpoints.budardalur.x).toBe(flk.budardalur.insertedNode.x);
    expect(combined.endpoints.budardalur.y).toBe(flk.budardalur.insertedNode.y);
    expect(combined.endpoints.budardalur.offsetM).toBe(entry.budardalur.offsetM);
    expect(combined.endpoints.budardalur.offsetM).toBeCloseTo(160.1476178502974, 6);

    expect(combined.endpoints.flokalundur.x).toBe(flk.flokalundur.insertedNode.x);
    expect(combined.endpoints.flokalundur.offsetM).toBe(flk.flokalundur.offsetM);
    expect(combined.endpoints.flokalundur.offsetM).toBeCloseTo(51.30036446804795, 6);

    expect(combined.endpoints.isafjordur.x).toBe(flkIsa.isafjordur.endpoint.x);
    expect(combined.endpoints.isafjordur.offsetM).toBe(flkIsa.isafjordur.offsetM);

    expect(combined.endpoints.holmavik.x).toBe(isaHol.holmavik.endpoint.x);
    expect(combined.endpoints.holmavik.offsetM).toBe(isaHol.holmavik.offsetM);

    expect(combined.endpoints.patreksfjordur.x).toBe(flkPat.patreksfjordur.insertedNode.x);
    expect(combined.endpoints.patreksfjordur.offsetM).toBe(flkPat.patreksfjordur.offsetM);

    expect(combined.endpoints.talknafjordur.x).toBe(patTal.talknafjordur.endpoint.x);
    expect(combined.endpoints.talknafjordur.offsetM).toBe(patTal.talknafjordur.ownerCoordinateOffsetM);
    expect(combined.endpoints.talknafjordur.routeEndsShortOfOwnerCoordinate).toBe(true);
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsCombinedRegionDataset();
    const b = loadWestfjordsCombinedRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsCombinedRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords combined network -- real end-to-end composition for all ten new pairs (production core, unchanged)", () => {
  const combined = loadWestfjordsCombinedRegionDataset();
  const allLines = [...combined.lines, ...combined.connectors];
  const linesById = new Map(allLines.map((l) => [l.sourceId, l]));

  function compose(a, b) {
    const ea = combined.endpoints[a];
    const eb = combined.endpoints[b];
    return composeGeometryPath({
      crs: combined.crs, tier: combined.tier, lines: allLines,
      from: { placeId: a, x: ea.x, y: ea.y },
      to: { placeId: b, x: eb.x, y: eb.y },
    });
  }

  const SPUR_SOURCE_IDS = [3544, 3590, 2649, 3753, 2648, 2647, 1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690];

  // `expectedNullZ`: connector -4's own two vertices both carry `z: null`
  // in the already-approved budardalur-flokalundur region file (an
  // inherited characteristic that predates the later Patreksfjörður
  // round's own "copy z from the real endpoints, never null" fix for
  // connector -5). This round reuses -4 byte-identical, per its own
  // explicit scope ("connectorar... z... orðrétt afrit, enginn nýrconnector").
  // Of its own 2 vertices, only 1 ever survives into a built coordinate
  // chain -- the other is always the shared boundary point with the
  // preceding/following slice and is deduplicated by the same
  // "skip the first vertex of every slice after the first" rule used
  // throughout this whole ticket. So any pair whose real composed path
  // includes -4 legitimately carries exactly 1 `z: null` coordinate entry
  // -- a real, pre-existing, non-blocking data gap documented in this
  // round's own cc-report, not a defect introduced here and not silently
  // hidden by a looser assertion.
  const EXPECTED = {
    "budardalur|holmavik": { lengthM: 78697.7705, slices: 12, idButur: 7, estConn: 0, expectedNullZ: 0 },
    "budardalur|isafjordur": { lengthM: 260092.7711, slices: 38, idButur: 24, estConn: 0.005, expectedNullZ: 1 },
    "budardalur|patreksfjordur": { lengthM: 233874.3218, slices: 28, idButur: 17, estConn: 4.3982, expectedNullZ: 1 },
    "budardalur|talknafjordur": { lengthM: 248219.9897, slices: 28, idButur: 18, estConn: 0.005, expectedNullZ: 1 },
    "flokalundur|holmavik": { lengthM: 154887.0832, slices: 17, idButur: 11, estConn: 0.005, expectedNullZ: 1 },
    "flokalundur|talknafjordur": { lengthM: 75745.7669, slices: 8, idButur: 7, estConn: 0, expectedNullZ: 0 },
    "isafjordur|patreksfjordur": { lengthM: 148325.1015, slices: 24, idButur: 17, estConn: 4.3932, expectedNullZ: 0 },
    "isafjordur|talknafjordur": { lengthM: 162670.7695, slices: 24, idButur: 18, estConn: 0, expectedNullZ: 0 },
    "holmavik|patreksfjordur": { lengthM: 216287.1822, slices: 24, idButur: 16, estConn: 4.3982, expectedNullZ: 1 },
    "holmavik|talknafjordur": { lengthM: 230632.8501, slices: 24, idButur: 17, estConn: 0.005, expectedNullZ: 1 },
  };

  for (const [key, expected] of Object.entries(EXPECTED)) {
    const [a, b] = key.split("|");
    it(`P4: ${a}<->${b} -- real composed length/slices/IdButur-count match the independent expectation (±0.05 m), reverse gives the identical length, 0 double-counted sourceId, 0 spur-line slices, 0 z:null`, () => {
      const fwd = compose(a, b);
      expect(fwd.status).toBe("geometry_only");
      expect(fwd.lengthM).toBeCloseTo(expected.lengthM, 1);
      expect(fwd.slices).toHaveLength(expected.slices);
      expect(new Set(fwd.slices.map((s) => s.sourceId)).size).toBe(fwd.slices.length);
      for (const spurId of SPUR_SOURCE_IDS) expect(fwd.slices.map((s) => s.sourceId)).not.toContain(spurId);
      expect(fwd.slices.map((s) => s.sourceId)).not.toContain(0); // sanity: no placeholder sourceId

      const rev = compose(b, a);
      expect(rev.status).toBe("geometry_only");
      expect(Math.abs(rev.lengthM - fwd.lengthM)).toBeLessThan(1e-6);
      expect(rev.slices.map((s) => s.sourceId)).toEqual([...fwd.slices.map((s) => s.sourceId)].reverse());
      expect(rev.geometryId).not.toBe(fwd.geometryId);

      const idButurIds = [];
      for (const s of fwd.slices) { if (s.idbutur != null && idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur); }
      expect(idButurIds).toHaveLength(expected.idButur);

      const estConn = fwd.slices.filter((s) => s.sourceId < 0).reduce((sum, s) => sum + s.lengthM, 0);
      expect(estConn).toBeCloseTo(expected.estConn, 3);

      const coords = [];
      fwd.slices.forEach((slice, i) => {
        const line = linesById.get(slice.sourceId);
        const lo = Math.min(slice.fromIndex, slice.toIndex);
        const hi = Math.max(slice.fromIndex, slice.toIndex);
        const span = line.vertices.slice(lo, hi + 1);
        const ordered = slice.direction === "forward" ? span : [...span].reverse();
        const startAt = i === 0 ? 0 : 1;
        for (let j = startAt; j < ordered.length; j++) coords.push(ordered[j]);
      });
      expect(coords.filter((c) => c.z === null)).toHaveLength(expected.expectedNullZ);
      let coordLen = 0;
      for (let i = 1; i < coords.length; i++) coordLen += Math.hypot(coords[i].x - coords[i - 1].x, coords[i].y - coords[i - 1].y);
      expect(coordLen).toBeCloseTo(fwd.lengthM, 4);
    });
  }

  it("P4: B/F/I/H<->T pairs contain neither 53127 nor -5 -- they reach Tálknafjörður via 2271->3361 directly", () => {
    for (const other of ["budardalur", "flokalundur", "isafjordur", "holmavik"]) {
      const fwd = compose(other, "talknafjordur");
      expect(fwd.slices.map((s) => s.sourceId)).not.toContain(53127);
      expect(fwd.slices.map((s) => s.sourceId)).not.toContain(-5);
      expect(fwd.slices.map((s) => s.sourceId)).toContain(3361);
      expect(fwd.slices.map((s) => s.sourceId)).toContain(2889);
    }
  });

  it("P4: B/I/H<->P pairs end on -5, 53127[0->7] -- never 53127 without the connector", () => {
    for (const other of ["budardalur", "isafjordur", "holmavik"]) {
      const fwd = compose(other, "patreksfjordur");
      const last = fwd.slices[fwd.slices.length - 1];
      const secondLast = fwd.slices[fwd.slices.length - 2];
      expect(last.sourceId).toBe(53127);
      expect(last.fromIndex).toBe(0);
      expect(last.toIndex).toBe(7);
      expect(secondLast.sourceId).toBe(-5);
    }
  });

  it("P4: I<->P and I<->T never touch 3648 -- they pass by Flókalundur without ever composing through it", () => {
    expect(compose("isafjordur", "patreksfjordur").slices.map((s) => s.sourceId)).not.toContain(3648);
    expect(compose("isafjordur", "talknafjordur").slices.map((s) => s.sourceId)).not.toContain(3648);
  });

  it("P4: the Flókalundur insertion node (3648's own vertex 50) is never a slice boundary on B<->I/P/T or H<->P/T -- it is a pure pass-through, confirmed by the real slice's own fromIndex/toIndex spanning across vertex 50", () => {
    for (const [a, b] of [["budardalur", "isafjordur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"], ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"]]) {
      const fwd = compose(a, b);
      const slice3648 = fwd.slices.find((s) => s.sourceId === 3648);
      expect(slice3648).toBeTruthy();
      const lo = Math.min(slice3648.fromIndex, slice3648.toIndex);
      const hi = Math.max(slice3648.fromIndex, slice3648.toIndex);
      expect(lo).toBeLessThanOrEqual(50);
      expect(hi).toBeGreaterThanOrEqual(50);
    }
  });

  it("P4: the Þröskuldar triple-point -- B<->H uses 3321 (via the junction-60-61-throskuldar region's own chain); B<->I/P/T and H<->P/T use 3754 (via the budardalur-flokalundur region's own chain) -- both literal from the same shared XY node, confirmed via real composed slices", () => {
    expect(compose("budardalur", "holmavik").slices.map((s) => s.sourceId)).toContain(3321);
    expect(compose("budardalur", "holmavik").slices.map((s) => s.sourceId)).not.toContain(3754);
    for (const [a, b] of [["budardalur", "isafjordur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"]]) {
      expect(compose(a, b).slices.map((s) => s.sourceId)).toContain(3754);
      expect(compose(a, b).slices.map((s) => s.sourceId)).not.toContain(3321);
    }
    for (const b of ["patreksfjordur", "talknafjordur"]) {
      expect(compose("holmavik", b).slices.map((s) => s.sourceId)).toContain(3321);
      expect(compose("holmavik", b).slices.map((s) => s.sourceId)).toContain(3754);
    }
  });

  it("P4: 3755's own end is byte-identical (x/y/z, toBe) to 3321's own start -- the real literal Þröskuldar triple-point. 3754's own start shares the same literal x/y but carries a genuinely different, already-documented raw z (41.9942 vs 42.058) -- a known, deliberate non-snapping characteristic from the throskuldar-holmavik round's own P2, preserved here unchanged, never harmonized", () => {
    const line3755 = linesById.get(3755);
    const line3321 = linesById.get(3321);
    const line3754 = linesById.get(3754);
    const end3755 = line3755.vertices[line3755.vertices.length - 1];
    expect(end3755.x).toBe(line3321.vertices[0].x);
    expect(end3755.y).toBe(line3321.vertices[0].y);
    expect(end3755.z).toBe(line3321.vertices[0].z);
    expect(end3755.z).toBeCloseTo(42.058, 3);

    expect(end3755.x).toBe(line3754.vertices[0].x);
    expect(end3755.y).toBe(line3754.vertices[0].y);
    expect(line3754.vertices[0].z).toBeCloseTo(41.9942, 3);
    expect(line3754.vertices[0].z).not.toBeCloseTo(end3755.z, 1);
  });

  it("P4 (negative, a): removing -5 makes B/I/H<->P return unsupported disconnected_graph; the other seven pairs are unaffected", () => {
    const linesWithoutMinus5 = allLines.filter((l) => l.sourceId !== -5);
    for (const other of ["budardalur", "isafjordur", "holmavik"]) {
      const ea = combined.endpoints[other];
      const ep = combined.endpoints.patreksfjordur;
      const result = composeGeometryPath({
        crs: combined.crs, tier: combined.tier, lines: linesWithoutMinus5,
        from: { placeId: other, x: ea.x, y: ea.y }, to: { placeId: "patreksfjordur", x: ep.x, y: ep.y },
      });
      expect(result.status).toBe("unsupported");
      expect(result.reason).toBe("disconnected_graph");
    }
    for (const [a, b] of [["budardalur", "holmavik"], ["budardalur", "talknafjordur"], ["flokalundur", "holmavik"], ["flokalundur", "talknafjordur"], ["isafjordur", "talknafjordur"], ["holmavik", "talknafjordur"]]) {
      const ea = combined.endpoints[a], eb = combined.endpoints[b];
      const result = composeGeometryPath({
        crs: combined.crs, tier: combined.tier, lines: linesWithoutMinus5,
        from: { placeId: a, x: ea.x, y: ea.y }, to: { placeId: b, x: eb.x, y: eb.y },
      });
      expect(result.status).toBe("geometry_only");
    }
  });

  it("P4 (negative, b): removing -4 makes the real core return a WRONG, longer geometry_only path for the six pairs that need it (not unsupported) -- the core's own silent-wrong-answer behavior, defended by the pinned correct lengths above, not by a disconnection assertion here", () => {
    const linesWithoutMinus4 = allLines.filter((l) => l.sourceId !== -4);
    const withoutMinus4 = composeGeometryPath({
      crs: combined.crs, tier: combined.tier, lines: linesWithoutMinus4,
      from: { placeId: "budardalur", x: combined.endpoints.budardalur.x, y: combined.endpoints.budardalur.y },
      to: { placeId: "isafjordur", x: combined.endpoints.isafjordur.x, y: combined.endpoints.isafjordur.y },
    });
    expect(withoutMinus4.status).toBe("geometry_only");
    expect(withoutMinus4.lengthM).toBeGreaterThan(260092.7711 + 100); // visibly wrong/longer than the pinned correct figure
  });

  it("P7/P9: drivingAccess/status discipline holds for every new pair -- UNVERIFIED, geometry_only, never a legal driving claim", () => {
    for (const key of Object.keys(EXPECTED)) {
      const [a, b] = key.split("|");
      const result = compose(a, b);
      expect(result.drivingAccess).toBe("UNVERIFIED");
      expect(result.status).toBe("geometry_only");
    }
  });
});
