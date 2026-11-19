// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-1-60-budardalur.json (westfjords-entry-mvp
// approved-prompt-v1.md P1/P2/P4). This file reads retained owner-provided
// docs/ data directly (precedent: acquiredGeometry.test.js /
// geometryDataset.test.js) -- the PRODUCTION loader never does this.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsRegionDataset } from "./westfjordsRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-westfjords-dataset-test");
const GEOJSON_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson");
const PILOT_PATH = path.join(process.cwd(), "server_data/winter-route-geometry-pilot.json");

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

// Standard, publicly documented ISN93/Lambert-1993 parameters -- the exact
// forward direction of the already-validated inverse transform used in
// every earlier map this ticket. Re-implemented independently here (not
// imported from the production build script) so this test cannot pass
// merely by sharing a bug with that script.
const A = 6378137.0, F_ELL = 1 / 298.257222101, E2 = F_ELL * (2 - F_ELL), E = Math.sqrt(E2);
const LAT0 = (65 * Math.PI) / 180, LON0 = (-19 * Math.PI) / 180, LAT1 = (64.25 * Math.PI) / 180, LAT2 = (65.75 * Math.PI) / 180;
const X0 = 500000, Y0 = 500000;
function mFunc(phi) { return Math.cos(phi) / Math.sqrt(1 - E2 * Math.sin(phi) ** 2); }
function tFunc(phi) { const s = Math.sin(phi); return Math.tan(Math.PI / 4 - phi / 2) / ((1 - E * s) / (1 + E * s)) ** (E / 2); }
const m1 = mFunc(LAT1), m2 = mFunc(LAT2), t0 = tFunc(LAT0), t1 = tFunc(LAT1), t2 = tFunc(LAT2);
const N = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
const FF = m1 / (N * t1 ** N);
const RHO0 = A * FF * t0 ** N;
function forward(lonDeg, latDeg) {
  const lon = (lonDeg * Math.PI) / 180, lat = (latDeg * Math.PI) / 180;
  const t = tFunc(lat), rho = A * FF * t ** N, theta = N * (lon - LON0);
  return { x: X0 + rho * Math.sin(theta), y: Y0 + RHO0 - rho * Math.cos(theta) };
}

describe("westfjords-region-1-60-budardalur.json -- data contract (real retained data)", () => {
  const region = loadWestfjordsRegionDataset();

  it("tier 0, real CRS, exactly the 7-line literal chain", () => {
    expect(region.tier).toBe(0);
    expect(region.crs).toBe("EPSG:3057");
    expect(region.lines.map((l) => l.sourceId)).toEqual([3544, 3590, 2649, 3753, 2648, 2647, 2769]);
    expect(region.lines.every((l) => l.tier === 0)).toBe(true);
    expect(region.lines.every((l) => l.veghluti === 1)).toBe(true);
  });

  it("P4: the recorded source file/SHA-256 matches the real retained raw GeoJSON on disk", () => {
    expect(region.source.file).toContain("Vegagerdin-faerdferlar-WGS84.geojson");
    expect(sha256File(GEOJSON_PATH)).toBe(region.source.sha256);
  });

  it("P4: the offline WGS84->EPSG:3057 adapter is independently re-validated here against the real tier-2 pilot dataset's own matching IDFERILL vertices -- max discrepancy well under 0.01 m", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const pilot = JSON.parse(fs.readFileSync(PILOT_PATH, "utf8"));

    let pairs = 0;
    let maxErr = 0;
    for (const line of pilot.lines) {
      if (line.sourceId < 0) continue;
      const feat = byId.get(line.sourceId);
      if (!feat) continue;
      const tier0Points = feat.geometry.coordinates.map(([lon, lat]) => forward(lon, lat));
      for (const v of line.vertices) {
        let best = Infinity;
        for (const p of tier0Points) best = Math.min(best, Math.hypot(p.x - v.x, p.y - v.y));
        if (best < 1) {
          pairs++;
          maxErr = Math.max(maxErr, best);
        }
      }
    }
    expect(pairs).toBe(927);
    expect(maxErr).toBeLessThan(0.01);
    expect(maxErr).toBeCloseTo(0.0028215915068940667, 6);
  });

  it("P1: the literal junction (3544's own vertex 0) matches 2753's own end and 3103's own start in the raw retained tier-0 data, independently re-derived here", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const f3544 = byId.get(3544);
    const f2753 = byId.get(2753);
    const f3103 = byId.get(3103);
    const [lon0, lat0] = f3544.geometry.coordinates[0];
    const [lonEnd2753, latEnd2753] = f2753.geometry.coordinates[f2753.geometry.coordinates.length - 1];
    const [lonStart3103, latStart3103] = f3103.geometry.coordinates[0];
    expect(lon0).toBe(lonEnd2753);
    expect(lat0).toBe(latEnd2753);
    expect(lon0).toBe(lonStart3103);
    expect(lat0).toBe(latStart3103);

    const native = forward(lon0, lat0);
    expect(native.x).toBeCloseTo(region.junction.x, 4);
    expect(native.y).toBeCloseTo(region.junction.y, 4);
  });

  it("P1: the 7-line chain is literally connected end-to-end (0 m gap at every junction), independently re-verified here from the raw vertices", () => {
    for (let i = 0; i < region.lines.length - 1; i++) {
      const a = region.lines[i].vertices;
      const b = region.lines[i + 1].vertices;
      const ends = [a[0], a[a.length - 1]];
      const starts = [b[0], b[b.length - 1]];
      let best = Infinity;
      for (const p of ends) for (const q of starts) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
      expect(best).toBeLessThan(0.001);
    }
  });

  it("P2: the inserted Búðardalur node lies exactly ON line 2769's own real geometry (distance 0 to the original segment), carries sourceId 2769 (never a new IDFERILL), and the old (unchanged) node is still 2769's own literal vertex 0", () => {
    const line2769 = region.lines.find((l) => l.sourceId === 2769);
    expect(line2769.vertices).toHaveLength(5); // 4 original + 1 inserted
    expect(line2769.idbutur).toBe(805030037);

    const inserted = region.budardalur.insertedNode;
    // The inserted vertex must be collinear with (lie on) the segment it was inserted into.
    const segStart = line2769.vertices[2];
    const segEnd = line2769.vertices[4];
    const d1 = Math.hypot(inserted.x - segStart.x, inserted.y - segStart.y);
    const d2 = Math.hypot(inserted.x - segEnd.x, inserted.y - segEnd.y);
    const segLen = Math.hypot(segEnd.x - segStart.x, segEnd.y - segStart.y);
    expect(d1 + d2).toBeCloseTo(segLen, 6); // on the segment, not off to the side

    expect(region.budardalur.oldNode.x).toBe(line2769.vertices[0].x);
    expect(region.budardalur.oldNode.y).toBe(line2769.vertices[0].y);
  });

  it("P2: the owner-coordinate offset is the real measured distance (160.148 m), shown separately, never counted as part of a route length by this loader", () => {
    expect(region.budardalur.offsetM).toBeCloseTo(160.147617850274, 3);
    expect(region.budardalur).not.toHaveProperty("lengthM");
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsRegionDataset();
    const b = loadWestfjordsRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords region -- real end-to-end composition (production core, unchanged)", () => {
  const region = loadWestfjordsRegionDataset();

  function compose(fromPoint, toPoint) {
    return composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: region.lines,
      from: { placeId: "a", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "b", x: toPoint.x, y: toPoint.y },
    });
  }

  it("P1: the literal sourceId chain in order, both directions, same length, different geometryId, lengths within 0.01 m of the independently re-derived reference", () => {
    const forwardResult = compose(region.junction, region.budardalur.insertedNode);
    expect(forwardResult.status).toBe("geometry_only");
    expect(forwardResult.slices.map((s) => s.sourceId)).toEqual([3544, 3590, 2649, 3753, 2648, 2647, 2769]);
    expect(forwardResult.lengthM).toBeCloseTo(42155.20284701861, 2);

    const reverseResult = compose(region.budardalur.insertedNode, region.junction);
    expect(reverseResult.status).toBe("geometry_only");
    expect(reverseResult.slices.map((s) => s.sourceId)).toEqual([2769, 2647, 2648, 3753, 2649, 3590, 3544]);
    expect(reverseResult.lengthM).toBeCloseTo(forwardResult.lengthM, 2);
    expect(reverseResult.geometryId).not.toBe(forwardResult.geometryId);
  });

  it("P2: option (a), the pre-existing unchanged budardalur node, gives the real shorter reference length with one fewer slice (no 2769 portion needed)", () => {
    const result = compose(region.junction, region.budardalur.oldNode);
    expect(result.status).toBe("geometry_only");
    expect(result.lengthM).toBeCloseTo(41738.85738447651, 2);
    expect(result.slices).toHaveLength(6);
    expect(result.slices.some((s) => s.sourceId === 2769)).toBe(false);
  });

  it("P3 (Dalsmynni trap, real negative case): the owner's own Dalsmynni coordinate is NOT a literal vertex of any line in this region -- composing from/to it returns endpoint_not_in_graph, never silently snapped to the junction", () => {
    const result = compose(region.dalsmynni, region.budardalur.insertedNode);
    expect(result.status).toBe("unsupported");
    expect(result.reason).toBe("endpoint_not_in_graph");

    // Independently re-confirm the real distances that make this a trap, not a bug.
    const dJunction = Math.hypot(region.dalsmynni.x - region.junction.x, region.dalsmynni.y - region.junction.y);
    expect(dJunction).toBeCloseTo(7806.529395480617, 1);
  });

  it("P5: route-validated IdButur only from the actually-traversed slices, in order -- the suggested-but-unused IdButur (905070037, 505870037) never appear", () => {
    const result = compose(region.junction, region.budardalur.insertedNode);
    const idButurIds = [];
    for (const s of result.slices) {
      if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
    }
    expect(idButurIds).toEqual([904070037, 905030037, 805030037]);
    expect(idButurIds).not.toContain(905070037);
    expect(idButurIds).not.toContain(505870037);
  });

  it("P7: drivingAccess/status discipline holds for this region exactly like every other pair -- UNVERIFIED, geometry_only, never a legal driving claim", () => {
    const result = compose(region.junction, region.budardalur.insertedNode);
    expect(result.drivingAccess).toBe("UNVERIFIED");
    expect(result.status).toBe("geometry_only");
  });
});
