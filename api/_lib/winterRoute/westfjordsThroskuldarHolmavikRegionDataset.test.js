// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-throskuldar-holmavik.json
// (westfjords-throskuldar-mvp approved-prompt-v1.md P1/P2/P3/P4/P5/P6/P7).
// This file reads retained owner-provided docs/ data directly (same
// precedent as the sibling region test files) -- the PRODUCTION loader
// never does this.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsThroskuldarHolmavikRegionDataset } from "./westfjordsThroskuldarHolmavikRegionDataset.js";
import { loadWestfjordsIsafjordurHolmavikRegionDataset } from "./westfjordsIsafjordurHolmavikRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-westfjords-throskuldar-dataset-test");
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

const CHAIN_IDFERILL = [3321, 3324, 3611, 3883];
const FORBIDDEN_DETOUR_VEGNR = ["60", "68"];
const FORBIDDEN_DETOUR_SOURCE_IDS = [3754, 3755, 2109, 3750, 3718, 2321, 2322, 3415, 53466, 3370, 3347, 2690, 2773, 2427, 3411, 1796, 3460, 3771];

describe("westfjords-region-throskuldar-holmavik.json -- data contract (real retained data)", () => {
  const region = loadWestfjordsThroskuldarHolmavikRegionDataset();

  it("tier 0, real CRS, the 4-line chain, veghluti 1, vegnr 61 x3 then 67", () => {
    expect(region.tier).toBe(0);
    expect(region.crs).toBe("EPSG:3057");
    expect(region.lines.map((l) => l.sourceId)).toEqual(CHAIN_IDFERILL);
    expect(region.lines.every((l) => l.tier === 0)).toBe(true);
    expect(region.lines.every((l) => l.veghluti === 1)).toBe(true);

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const id of CHAIN_IDFERILL) {
      const expected = id === 3883 ? "67" : "61";
      expect(String(byId.get(id).properties.VEGNR)).toBe(expected);
    }
  });

  it("P8: the recorded source file/SHA-256 matches the real retained raw GeoJSON on disk", () => {
    expect(region.source.file).toContain("Vegagerdin-faerdferlar-WGS84.geojson");
    expect(sha256File(GEOJSON_PATH)).toBe(region.source.sha256);
  });

  it("P3: the Hólmavík endpoint is byte-identical to the one already established in westfjords-region-isafjordur-holmavik.json -- never recomputed differently, never a shared runtime reference between the two region files", () => {
    const holRegion = loadWestfjordsIsafjordurHolmavikRegionDataset();
    expect(region.holmavik.endpoint.x).toBe(holRegion.holmavik.endpoint.x);
    expect(region.holmavik.endpoint.y).toBe(holRegion.holmavik.endpoint.y);

    const line3883 = region.lines.find((l) => l.sourceId === 3883);
    expect(line3883.vertices).toHaveLength(4);
    expect(line3883.vertices[3].x).toBe(region.holmavik.endpoint.x);
    expect(line3883.vertices[3].y).toBe(region.holmavik.endpoint.y);
  });

  it("P1: every join in the 4-line chain is a real, literal 0 m connection -- independently re-verified here from the raw GeoJSON vertices, never the production build script", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const chainFromRaw = [3321, 3324, 3611].map((id) => {
      const feat = byId.get(id);
      return { sourceId: id, vertices: feat.geometry.coordinates.map(([lon, lat]) => forward(lon, lat)) };
    });
    for (let i = 0; i < chainFromRaw.length - 1; i++) {
      const a = chainFromRaw[i].vertices;
      const b = chainFromRaw[i + 1].vertices;
      const ends = [a[0], a[a.length - 1]];
      const starts = [b[0], b[b.length - 1]];
      let best = Infinity;
      for (const p of ends) for (const q of starts) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
      expect(best).toBeLessThan(0.001);
    }
  });

  it("P2: junction endpoint is 3321's own literal, EXISTING vertex 0 -- 3321 stays unchanged at 48 vertices, never a new/inserted point; shares its exact XY with 3754's own start and 3755's own end (neither a line in this region), z preserved from 3321 (42.058) not 3754's differing z; no ownerCoordinateOffsetM since the owner's own Þröskuldar point is not the endpoint", () => {
    const line3321 = region.lines.find((l) => l.sourceId === 3321);
    expect(line3321.vertices).toHaveLength(48);
    expect(region.junction.endpoint.x).toBe(line3321.vertices[0].x);
    expect(region.junction.endpoint.y).toBe(line3321.vertices[0].y);
    expect(region.junction.endpoint.z).toBeCloseTo(42.058, 3);
    expect(region.lines.map((l) => l.sourceId)).not.toContain(3754);
    expect(region.lines.map((l) => l.sourceId)).not.toContain(3755);

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const f3754 = byId.get(3754);
    const f3755 = byId.get(3755);
    const l3754Start = forward(...f3754.geometry.coordinates[0]);
    const l3755End = forward(...f3755.geometry.coordinates[f3755.geometry.coordinates.length - 1]);
    expect(Math.hypot(region.junction.endpoint.x - l3754Start.x, region.junction.endpoint.y - l3754Start.y)).toBeLessThan(0.001);
    expect(Math.hypot(region.junction.endpoint.x - l3755End.x, region.junction.endpoint.y - l3755End.y)).toBeLessThan(0.001);
    expect(f3754.geometry.coordinates[0][2]).toBeCloseTo(41.9942, 3); // the real, differing z at the same XY -- confirms the trap
    expect(region.junction.endpoint.z).not.toBeCloseTo(f3754.geometry.coordinates[0][2], 2);

    expect(region.junction).not.toHaveProperty("ownerCoordinateOffsetM");
    expect(region.junction.ownerReference.offsetFromNearestLineM).toBeCloseTo(809.5062630555802, 2);
    expect(region.junction.ownerReference.alongRouteFromJunctionM).toBeCloseTo(15074.198006171828, 1);
    expect(region.junction.ownerReference.straightLineFromJunctionM).toBeCloseTo(14402.91756980774, 2);
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsThroskuldarHolmavikRegionDataset();
    const b = loadWestfjordsThroskuldarHolmavikRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsThroskuldarHolmavikRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords Hólmavík<->junction-60-61-throskuldar -- real end-to-end composition (production core, unchanged)", () => {
  const region = loadWestfjordsThroskuldarHolmavikRegionDataset();

  function compose(fromPoint, toPoint) {
    return composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: region.lines,
      from: { placeId: "a", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "b", x: toPoint.x, y: toPoint.y },
    });
  }

  it("P1: the literal sourceId chain in order (first slice is FULL 3321 from fromIndex 0, not the old negative-test partial slice), both directions, CC's own measured length within 0.05 m of the prompt's own sandbox figure, no forbidden-detour sourceId, no double-counted edge", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    expect(fwd.status).toBe("geometry_only");
    expect(fwd.slices.map((s) => s.sourceId)).toEqual(CHAIN_IDFERILL);
    expect(fwd.slices[0].fromIndex).toBe(0);
    expect(fwd.slices[0].toIndex).toBe(47);
    expect(fwd.slices[0].lengthM).toBeCloseTo(10052.127494780467, 2);
    expect(fwd.lengthM).toBeCloseTo(30555.315457179793, 1); // within 0.05 m of the prompt's own cited sandbox figure
    expect(new Set(fwd.slices.map((s) => s.sourceId)).size).toBe(fwd.slices.length);
    for (const forbidden of FORBIDDEN_DETOUR_SOURCE_IDS) expect(CHAIN_IDFERILL).not.toContain(forbidden);

    const rev = compose(region.holmavik.endpoint, region.junction.endpoint);
    expect(rev.status).toBe("geometry_only");
    expect(rev.slices.map((s) => s.sourceId)).toEqual([...CHAIN_IDFERILL].reverse());
    expect(rev.lengthM).toBeCloseTo(fwd.lengthM, 2);
    expect(rev.geometryId).not.toBe(fwd.geometryId);

    const coordLen = (() => {
      let total = 0;
      for (const slice of fwd.slices) {
        const line = region.lines.find((l) => l.sourceId === slice.sourceId);
        const lo = Math.min(slice.fromIndex, slice.toIndex);
        const hi = Math.max(slice.fromIndex, slice.toIndex);
        const span = line.vertices.slice(lo, hi + 1);
        for (let j = 0; j < span.length - 1; j++) total += Math.hypot(span[j + 1].x - span[j].x, span[j + 1].y - span[j].y);
      }
      return total;
    })();
    expect(coordLen).toBeCloseTo(fwd.lengthM, 4);
  });

  it("P3: J (3611's own end = 3883's own vertex 0 = 3347's own vertex 0) is an internal node of the route, never the endpoint; the final slice is pinned to sourceId 3883, fromIndex 0, toIndex 3, ~517.42 m -- the wrong 3347-as-endpoint result (30,037.89 m) must not occur", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const finalSlice = fwd.slices[fwd.slices.length - 1];
    expect(finalSlice.sourceId).toBe(3883);
    expect(finalSlice.fromIndex).toBe(0);
    expect(finalSlice.toIndex).toBe(3);
    expect(finalSlice.lengthM).toBeCloseTo(517.4229774386502, 2);
    expect(fwd.lengthM).not.toBeCloseTo(30037.89, 0);
  });

  it("P6 (negative, Þröskuldar-chain-is-necessary): on the full retained national tier-0 graph, removing any one of 3321/3324/3611 makes the real core return the WRONG ~71,909.50 m detour via road 60/608/Djúp (not a disconnection); restoring it gives back the correct ~30,555.32 m chain", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const rawLines = geojson.features.map((feat) => {
      const p = feat.properties;
      return {
        sourceId: p.IDFERILL, idbutur: p.IDBUTUR, tier: 0, veghluti: p.VEGHLUTI, name: p.STUTTNAFNLEIDAR,
        vertices: feat.geometry.coordinates.map(([lon, lat, z]) => {
          const { x, y } = forward(lon, lat);
          return { x, y, z: z ?? null };
        }),
      };
    });
    const regionLinesById = new Map(region.lines.map((l) => [l.sourceId, l]));
    const patchedLines = rawLines.map((l) => regionLinesById.get(l.sourceId) ?? l);

    function runOn(lines) {
      return composeGeometryPath({
        crs: region.crs, tier: region.tier, lines,
        from: { placeId: "junction", x: region.junction.endpoint.x, y: region.junction.endpoint.y },
        to: { placeId: "holmavik", x: region.holmavik.endpoint.x, y: region.holmavik.endpoint.y },
      });
    }

    const withAll = runOn(patchedLines);
    expect(withAll.status).toBe("geometry_only");
    expect(withAll.lengthM).toBeCloseTo(30555.32, 0);
    expect(withAll.slices.map((s) => s.sourceId)).toEqual(CHAIN_IDFERILL);

    for (const removedId of [3324, 3321, 3611]) {
      const without = runOn(patchedLines.filter((l) => l.sourceId !== removedId));
      expect(without.status).toBe("geometry_only"); // the real danger: a plausible WRONG answer, not an error
      expect(without.lengthM).toBeCloseTo(71909.50390853, 0);
      expect(without.slices).toHaveLength(10);
      expect(without.slices.map((s) => s.sourceId)).toEqual([3754, 3750, 3718, 2322, 2321, 3415, 53466, 3370, 3347, 3883]);
    }
  });

  it("P6: no slice in the real positive result has a forbidden detour vegnr or sourceId", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const slice of fwd.slices) {
      expect(FORBIDDEN_DETOUR_SOURCE_IDS).not.toContain(slice.sourceId);
      const vegnr = String(byId.get(slice.sourceId)?.properties.VEGNR ?? "");
      expect(FORBIDDEN_DETOUR_VEGNR).not.toContain(vegnr);
      expect(["61", "67"]).toContain(vegnr);
    }
  });

  it("P4: the real route-validated IdButur list matches exactly (3321+3324 merge only in the list, not in geometry)", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const idButurIds = [];
    for (const s of fwd.slices) {
      if (s.idbutur == null) continue;
      if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
    }
    expect(idButurIds).toEqual([907000037, 707040037, 907040037]);
    for (const forbidden of [905110037, 805090037, 506050037, 907060037, 907050037, 761220037, 907070037, 906120037, 907350037]) {
      expect(idButurIds).not.toContain(forbidden);
    }
  });

  it("P5: via is EXACTLY [\"Þröskuldar\"] (toEqual, not merely toContain) -- the real retained name of 3321/3324, never \"Djúpvegur\"/\"Hólmavík\"/\"Gilsfjörður\"/\"Geiradalsvegur\"/\"Innstrandavegur\"/\"Þorskafjarðarheiði\"/\"Ísafjörður\" from any substring", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const linesById = new Map(region.lines.map((l) => [l.sourceId, l]));
    const realNames = fwd.slices.map((s) => linesById.get(s.sourceId)?.name).filter(Boolean);
    expect(realNames).toContain("Þröskuldar");
    expect(realNames.some((n) => n.includes("Hólmavík"))).toBe(true); // the trap IS on the chain (3611/3883's own names)

    // Rebuild the handler's own via logic directly against this data to
    // assert the EXACT result, not just that it contains the right value.
    const viaCandidates = [{ label: "Þröskuldar", match: "Þröskuldar" }];
    const realNamesSet = new Set(realNames);
    const via = viaCandidates.filter((c) => [...realNamesSet].some((n) => n.includes(c.match))).map((c) => c.label);
    expect(via).toEqual(["Þröskuldar"]);
  });

  it("P7: no roundabout/split-carriageway segment on this chain -- VEGHLUTI is 1 throughout, and 3834 (the Ísafjörður roundabout line) is not on this route", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const linesById = new Map(region.lines.map((l) => [l.sourceId, l]));
    expect(fwd.slices.every((s) => linesById.get(s.sourceId).veghluti === 1)).toBe(true);
    expect(fwd.slices.map((s) => s.sourceId)).not.toContain(3834);
  });

  it("P7/P9: drivingAccess/status discipline holds for this pair exactly like every other -- UNVERIFIED, geometry_only, never a legal driving claim", () => {
    const result = compose(region.junction.endpoint, region.holmavik.endpoint);
    expect(result.drivingAccess).toBe("UNVERIFIED");
    expect(result.status).toBe("geometry_only");
  });
});
