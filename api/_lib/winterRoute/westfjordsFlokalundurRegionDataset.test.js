// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-budardalur-flokalundur.json
// (westfjords-flokalundur-mvp approved-prompt-v1.md P1/P2/P3/P4/P5). This
// file reads retained owner-provided docs/ data directly (same precedent
// as westfjordsRegionDataset.test.js) -- the PRODUCTION loader never does
// this.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsFlokalundurRegionDataset } from "./westfjordsFlokalundurRegionDataset.js";
import { loadWestfjordsRegionDataset } from "./westfjordsRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-westfjords-flokalundur-dataset-test");
const GEOJSON_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson");

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

// Same standard, publicly documented ISN93/Lambert-1993 parameters,
// re-implemented independently here (not imported from the production
// build script) so this test cannot pass merely by sharing a bug with it.
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

const CHAIN_IDFERILL = [3197, 3247, 3462, 40961, 3460, 3771, 3755, 3754, 3750, 49925, 50566, 3678, 3677, 3675, 3672, 3651, 3869, 3868, 3648];
const FORBIDDEN_DETOUR_SOURCE_IDS = [3718, 2322, 2321, 3418, 3419, 3605, 2077, 3321, 2973, 3009, 3698];

describe("westfjords-region-budardalur-flokalundur.json -- data contract (real retained data)", () => {
  const region = loadWestfjordsFlokalundurRegionDataset();

  it("tier 0, real CRS, 2769 (shared with the entry region) + the 19-line chain, veghluti 1 throughout", () => {
    expect(region.tier).toBe(0);
    expect(region.crs).toBe("EPSG:3057");
    expect(region.lines.map((l) => l.sourceId)).toEqual([2769, ...CHAIN_IDFERILL]);
    expect(region.lines.every((l) => l.tier === 0)).toBe(true);
    expect(region.lines.every((l) => l.veghluti === 1)).toBe(true);
  });

  it("P4: the recorded source file/SHA-256 matches the real retained raw GeoJSON on disk", () => {
    expect(region.source.file).toContain("Vegagerdin-faerdferlar-WGS84.geojson");
    expect(sha256File(GEOJSON_PATH)).toBe(region.source.sha256);
  });

  it("P6: the Búðardalur inserted node is byte-identical to the one already established in the first (entry) region file -- never recomputed differently, never a shared runtime reference between the two region files", () => {
    const entryRegion = loadWestfjordsRegionDataset();
    expect(region.budardalur.insertedNode.x).toBe(entryRegion.budardalur.insertedNode.x);
    expect(region.budardalur.insertedNode.y).toBe(entryRegion.budardalur.insertedNode.y);
  });

  it("P1: every join in the 20-line chain is a real 0 m connection EXCEPT the one permitted 49925<->50566 gap, independently re-verified here from the raw GeoJSON vertices (never the production build script)", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const lines = [2769, ...CHAIN_IDFERILL].map((id) => {
      const feat = byId.get(id);
      return { sourceId: id, vertices: feat.geometry.coordinates.map(([lon, lat]) => forward(lon, lat)) };
    });

    let gapFound = null;
    for (let i = 0; i < lines.length - 1; i++) {
      const a = lines[i].vertices;
      const b = lines[i + 1].vertices;
      const ends = [a[0], a[a.length - 1]];
      const starts = [b[0], b[b.length - 1]];
      let best = Infinity;
      for (const p of ends) for (const q of starts) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
      if (lines[i].sourceId === 49925 && lines[i + 1].sourceId === 50566) {
        gapFound = best;
        expect(best).toBeLessThan(0.01);
      } else {
        expect(best).toBeLessThan(0.001);
      }
    }
    expect(gapFound).toBeCloseTo(0.005023430900293806, 6);
  });

  it("P1: the one estimated connector -- reserved negative sourceId, idbutur null, non-WFS evidenceRef, length <= 0.01 m, distinct from the south-pilot (-1) and north-option (-2/-3) connectors", () => {
    expect(region.connector.sourceId).toBeLessThan(0);
    expect([-1, -2, -3]).not.toContain(region.connector.sourceId);
    expect(region.connector.idbutur).toBeNull();
    expect(region.connector.evidenceRef).not.toMatch(/IDFERILL=/);
    const [p, q] = region.connector.vertices;
    const len = Math.hypot(p.x - q.x, p.y - q.y);
    expect(len).toBeLessThanOrEqual(0.01);
    expect(len).toBeCloseTo(0.005023430900293806, 2);
  });

  it("P4: Flókalundur is a literal inserted vertex ON line 3648's own real geometry (collinear with the segment it was inserted into), never a new sourceId, offset ~51.30 m, and the 60/62 junction (3648's own full end) is recorded separately and is NOT the same point", () => {
    const line3648 = region.lines.find((l) => l.sourceId === 3648);
    const inserted = region.flokalundur.insertedNode;
    const idx = line3648.vertices.findIndex((v) => v.x === inserted.x && v.y === inserted.y);
    expect(idx).toBeGreaterThan(0);
    expect(idx).toBeLessThan(line3648.vertices.length - 1);
    const segStart = line3648.vertices[idx - 1];
    const segEnd = line3648.vertices[idx + 1];
    const d1 = Math.hypot(inserted.x - segStart.x, inserted.y - segStart.y);
    const d2 = Math.hypot(inserted.x - segEnd.x, inserted.y - segEnd.y);
    const segLen = Math.hypot(segEnd.x - segStart.x, segEnd.y - segStart.y);
    expect(d1 + d2).toBeCloseTo(segLen, 6);

    expect(region.flokalundur.offsetM).toBeCloseTo(51.300370295420294, 3);
    expect(region.flokalundur).not.toHaveProperty("lengthM");

    const junction6062 = region.flokalundur.junction6062;
    expect(junction6062.x).not.toBe(inserted.x);
    expect(junction6062.y).not.toBe(inserted.y);
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsFlokalundurRegionDataset();
    const b = loadWestfjordsFlokalundurRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsFlokalundurRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords Búðardalur<->Flókalundur -- real end-to-end composition (production core, unchanged)", () => {
  const region = loadWestfjordsFlokalundurRegionDataset();
  const flkLines = [...region.lines, region.connector];

  function compose(fromPoint, toPoint) {
    return composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: flkLines,
      from: { placeId: "a", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "b", x: toPoint.x, y: toPoint.y },
    });
  }

  it("P2: the literal sourceId chain in order (connector included), both directions, same length, different geometryId, no forbidden-detour sourceId, no double-counted edge", () => {
    const fwd = compose(region.budardalur.insertedNode, region.flokalundur.insertedNode);
    expect(fwd.status).toBe("geometry_only");
    const expectedForward = [2769, 3197, 3247, 3462, 40961, 3460, 3771, 3755, 3754, 3750, 49925, region.connector.sourceId, 50566, 3678, 3677, 3675, 3672, 3651, 3869, 3868, 3648];
    expect(fwd.slices.map((s) => s.sourceId)).toEqual(expectedForward);
    expect(fwd.lengthM).toBeCloseTo(172474.22, 0);
    expect(new Set(fwd.slices.map((s) => s.sourceId)).size).toBe(fwd.slices.length); // 0 double-counted edges
    for (const forbidden of FORBIDDEN_DETOUR_SOURCE_IDS) expect(expectedForward).not.toContain(forbidden);

    const rev = compose(region.flokalundur.insertedNode, region.budardalur.insertedNode);
    expect(rev.status).toBe("geometry_only");
    expect(rev.slices.map((s) => s.sourceId)).toEqual([...expectedForward].reverse());
    expect(rev.lengthM).toBeCloseTo(fwd.lengthM, 2);
    expect(rev.geometryId).not.toBe(fwd.geometryId);

    // coordinate-chain sum matches the reported lengthM (same discipline as every earlier round)
    const coordLen = (() => {
      let total = 0;
      for (let i = 0; i < fwd.slices.length; i++) {
        const line = flkLines.find((l) => l.sourceId === fwd.slices[i].sourceId);
        const lo = Math.min(fwd.slices[i].fromIndex, fwd.slices[i].toIndex);
        const hi = Math.max(fwd.slices[i].fromIndex, fwd.slices[i].toIndex);
        const span = line.vertices.slice(lo, hi + 1);
        for (let j = 0; j < span.length - 1; j++) total += Math.hypot(span[j + 1].x - span[j].x, span[j + 1].y - span[j].y);
      }
      return total;
    })();
    expect(coordLen).toBeCloseTo(fwd.lengthM, 4);
  });

  it("P5: the real route-validated IdButur list (connector's own null skipped) matches exactly, including 905070037 (line 3197 is literally on this chain)", () => {
    const fwd = compose(region.budardalur.insertedNode, region.flokalundur.insertedNode);
    const idButurIds = [];
    for (const s of fwd.slices) {
      if (s.idbutur == null) continue;
      if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
    }
    const expectedIdButur = [805030037, 905070037, 905080037, 805090037, 905110037, 905130037, 560250037, 560260037, 805140037, 905150037, 905160037, 905170037];
    expect(idButurIds).toEqual(expectedIdButur);
    for (const forbidden of [505870037, 905090037, 905100037, 907000037, 905120037, 560800037, 906520037, 660350037, 905180037]) {
      expect(idButurIds).not.toContain(forbidden);
    }
  });

  it("P4: composing to the 60/62 junction (3648's own full end) instead of the Flókalundur insertion point gives a real longer, different result -- confirming it must never be used as this pair's endpoint", () => {
    const toInsertion = compose(region.budardalur.insertedNode, region.flokalundur.insertedNode);
    const toJunction = compose(region.budardalur.insertedNode, region.flokalundur.junction6062);
    expect(toJunction.status).toBe("geometry_only");
    expect(toJunction.lengthM).toBeGreaterThan(toInsertion.lengthM);
    expect(toJunction.lengthM - toInsertion.lengthM).toBeCloseTo(346.77, 1);
  });

  it("P3 (negative, connector-is-necessary): on the full retained national tier-0 graph, removing the one connector makes the real core silently return the WRONG ~204,217 m detour (not a disconnection) -- the exact danger P1 exists to prevent; restoring the connector gives back the correct ~172,474 m chain", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const rawLines = geojson.features.map((feat) => {
      const p = feat.properties;
      return {
        sourceId: p.IDFERILL,
        idbutur: p.IDBUTUR,
        tier: 0,
        veghluti: p.VEGHLUTI,
        name: p.STUTTNAFNLEIDAR,
        vertices: feat.geometry.coordinates.map(([lon, lat, z]) => {
          const { x, y } = forward(lon, lat);
          return { x, y, z: z ?? null };
        }),
      };
    });
    // 2769 and 3648 need the SAME Búðardalur/Flókalundur insertions as the
    // region's own copies -- substitute those two (and, harmlessly, every
    // other already-identical chain line) with the region's own lines.
    const regionLinesById = new Map(region.lines.map((l) => [l.sourceId, l]));
    const patchedLines = rawLines.map((l) => regionLinesById.get(l.sourceId) ?? l);

    const withoutConnector = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: patchedLines,
      from: { placeId: "bd", x: region.budardalur.insertedNode.x, y: region.budardalur.insertedNode.y },
      to: { placeId: "flk", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
    });
    expect(withoutConnector.status).toBe("geometry_only"); // the real danger: a plausible WRONG answer, not an error
    expect(withoutConnector.lengthM).toBeCloseTo(204217.2, 0);
    expect(withoutConnector.slices.map((s) => s.sourceId)).toEqual([2769, 3197, 3247, 3462, 40961, 3460, 3771, 3755, 3754, 3750, 3718, 2322, 2321, 3418, 3419, 3605, 2077, 3672, 3651, 3869, 3868, 3648]);

    const withConnector = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: [...patchedLines, region.connector],
      from: { placeId: "bd", x: region.budardalur.insertedNode.x, y: region.budardalur.insertedNode.y },
      to: { placeId: "flk", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
    });
    expect(withConnector.status).toBe("geometry_only");
    expect(withConnector.lengthM).toBeCloseTo(172474.22, 0);
    expect(withConnector.slices.map((s) => s.sourceId)).toEqual([2769, 3197, 3247, 3462, 40961, 3460, 3771, 3755, 3754, 3750, 49925, region.connector.sourceId, 50566, 3678, 3677, 3675, 3672, 3651, 3869, 3868, 3648]);
  });

  it("P6: entry-slice [0->3] + this round's own new-slice [3->4] on line 2769 sum to the full, unmodified 2769 length, and a hypothetical (offline-only, NOT a new route) junction->Flókalundur combination does not double-count", () => {
    const entryRegion = loadWestfjordsRegionDataset();
    const entryCompose = composeGeometryPath({
      crs: entryRegion.crs, tier: entryRegion.tier, lines: entryRegion.lines,
      from: { placeId: "j", x: entryRegion.junction.x, y: entryRegion.junction.y },
      to: { placeId: "bd", x: entryRegion.budardalur.insertedNode.x, y: entryRegion.budardalur.insertedNode.y },
    });
    const entrySlice2769 = entryCompose.slices.find((s) => s.sourceId === 2769);

    const newLeg = compose(region.budardalur.insertedNode, region.flokalundur.insertedNode);
    const newSlice2769 = newLeg.slices.find((s) => s.sourceId === 2769);

    const line2769 = region.lines.find((l) => l.sourceId === 2769);
    let fullLength = 0;
    for (let i = 0; i < line2769.vertices.length - 1; i++) {
      fullLength += Math.hypot(line2769.vertices[i + 1].x - line2769.vertices[i].x, line2769.vertices[i + 1].y - line2769.vertices[i].y);
    }
    expect(entrySlice2769.lengthM + newSlice2769.lengthM).toBeCloseTo(fullLength, 4);

    const combined = entryCompose.lengthM + newLeg.lengthM;
    expect(combined).toBeCloseTo(214629.426, 1);
  });

  it("P7: drivingAccess/status discipline holds for this pair exactly like every other -- UNVERIFIED, geometry_only, never a legal driving claim", () => {
    const result = compose(region.budardalur.insertedNode, region.flokalundur.insertedNode);
    expect(result.drivingAccess).toBe("UNVERIFIED");
    expect(result.status).toBe("geometry_only");
  });
});
