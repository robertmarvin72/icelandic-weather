// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-1-68-holmavik.json
// (westfjords-road68-mvp approved-prompt-v1.md P1/P2/P3/P4/P5/P6/P7). This
// file reads retained owner-provided docs/ data directly (same precedent
// as the sibling region test files) -- the PRODUCTION loader never does
// this.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsRoad68HolmavikRegionDataset } from "./westfjordsRoad68HolmavikRegionDataset.js";
import { loadWestfjordsIsafjordurHolmavikRegionDataset } from "./westfjordsIsafjordurHolmavikRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-westfjords-road68-dataset-test");
const GEOJSON_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson");
const FAERDARKAFLAR_708_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdarkaflar-708.csv");

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

const CHAIN_IDFERILL = [1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690, 3611, 3883];
const FORBIDDEN_DETOUR_VEGNR = ["1", "59", "60"];
const FORBIDDEN_DETOUR_SOURCE_IDS = [3324, 3321, 3347, 3370, 53466, 3415, 2321, 2322, 2744, 1481, 3828, 2109, 3755, 3771];

describe("westfjords-region-1-68-holmavik.json -- data contract (real retained data)", () => {
  const region = loadWestfjordsRoad68HolmavikRegionDataset();

  it("tier 0, real CRS, the 12-line chain, veghluti 1, vegnr 68 x10 then 61 then 67", () => {
    expect(region.tier).toBe(0);
    expect(region.crs).toBe("EPSG:3057");
    expect(region.lines.map((l) => l.sourceId)).toEqual(CHAIN_IDFERILL);
    expect(region.lines.every((l) => l.tier === 0)).toBe(true);
    expect(region.lines.every((l) => l.veghluti === 1)).toBe(true);

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const id of CHAIN_IDFERILL) {
      const expected = id === 3611 ? "61" : id === 3883 ? "67" : "68";
      expect(String(byId.get(id).properties.VEGNR)).toBe(expected);
    }
  });

  it("P8: the recorded source files/SHA-256 match the real retained raw files on disk", () => {
    expect(region.source.file).toContain("Vegagerdin-faerdferlar-WGS84.geojson");
    expect(sha256File(GEOJSON_PATH)).toBe(region.source.sha256);
    expect(sha256File(FAERDARKAFLAR_708_PATH)).toBe(region.source.faerdarkaflar708Sha256);
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

  it("P1: every join in the 12-line chain is a real, literal 0 m connection -- independently re-verified here from the raw GeoJSON vertices, never the production build script", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const chainFromRaw = CHAIN_IDFERILL.map((id) => {
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

  it("P2: junction endpoint is 1796's own literal, EXISTING vertex 0 -- 1796 stays unchanged at 31 vertices, never a new/inserted point; shares its exact XY with 1481's own end and 3828's own start, neither of which is a line in this region; no ownerCoordinateOffsetM for this end since the owner's own Hrútafjörður point is not the endpoint", () => {
    const line1796 = region.lines.find((l) => l.sourceId === 1796);
    expect(line1796.vertices).toHaveLength(31);
    expect(region.junction.endpoint.x).toBe(line1796.vertices[0].x);
    expect(region.junction.endpoint.y).toBe(line1796.vertices[0].y);
    expect(region.junction.endpoint.z).toBeCloseTo(4.585, 3);
    expect(region.lines.map((l) => l.sourceId)).not.toContain(1481);
    expect(region.lines.map((l) => l.sourceId)).not.toContain(3828);

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const f1481 = byId.get(1481);
    const f3828 = byId.get(3828);
    const l1481End = forward(...f1481.geometry.coordinates[f1481.geometry.coordinates.length - 1]);
    const l3828Start = forward(...f3828.geometry.coordinates[0]);
    expect(Math.hypot(region.junction.endpoint.x - l1481End.x, region.junction.endpoint.y - l1481End.y)).toBeLessThan(0.001);
    expect(Math.hypot(region.junction.endpoint.x - l3828Start.x, region.junction.endpoint.y - l3828Start.y)).toBeLessThan(0.001);

    expect(region.junction).not.toHaveProperty("ownerCoordinateOffsetM");
    expect(region.junction.ownerReference.offsetFromEndpointM).toBeCloseTo(1097.7223678800865, 2);
  });

  it("P4: the IdButur FulltNafnButs name ('Innstrandavegur') is attached from the retained 708 table for the road-68 segments, independently re-derived here from the raw CSV", () => {
    const text = fs.readFileSync(FAERDARKAFLAR_708_PATH, "utf8").replace(/^\uFEFF/, "");
    const rows = text.split(/\r?\n/).filter(Boolean).slice(1).map((l) => l.split(","));
    const byIdbutur = new Map(rows.map((c) => [Number(c[0]), c[1]]));

    const line1796 = region.lines.find((l) => l.sourceId === 1796);
    expect(line1796.idbuturName).toBe(byIdbutur.get(line1796.idbutur));
    expect(line1796.idbuturName).toContain("Innstrandavegur");

    const line3611 = region.lines.find((l) => l.sourceId === 3611);
    expect(line3611.idbuturName).toContain("Djúpvegur");
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsRoad68HolmavikRegionDataset();
    const b = loadWestfjordsRoad68HolmavikRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsRoad68HolmavikRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords Hólmavík<->junction-1-68-stadarskali -- real end-to-end composition (production core, unchanged)", () => {
  const region = loadWestfjordsRoad68HolmavikRegionDataset();

  function compose(fromPoint, toPoint) {
    return composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: region.lines,
      from: { placeId: "a", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "b", x: toPoint.x, y: toPoint.y },
    });
  }

  it("P1: the literal sourceId chain in order (no connector), both directions, same length (CC's own real measurement, within 0.05 m of the prompt's own sandbox figure), no forbidden-detour sourceId, no double-counted edge", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    expect(fwd.status).toBe("geometry_only");
    expect(fwd.slices.map((s) => s.sourceId)).toEqual(CHAIN_IDFERILL);
    expect(fwd.lengthM).toBeCloseTo(110073.97484053829, 1); // within 0.05 m of the prompt's own cited sandbox figure
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

  it("P3: J (3611's own end = 3883's own vertex 0 = 3347's own vertex 0) is an internal node of the route, never the endpoint; the final slice is pinned to sourceId 3883, fromIndex 0, toIndex 3, ~517.4 m -- the wrong 3347-as-endpoint result (109,556.57 m) must not occur", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const finalSlice = fwd.slices[fwd.slices.length - 1];
    expect(finalSlice.sourceId).toBe(3883);
    expect(finalSlice.fromIndex).toBe(0);
    expect(finalSlice.toIndex).toBe(3);
    expect(finalSlice.lengthM).toBeCloseTo(517.4229774386502, 3);
    expect(fwd.lengthM).not.toBeCloseTo(109556.57, 0);
  });

  it("P6 (negative, road-68-chain-is-necessary): on the full retained national tier-0 graph, removing 3411 makes the real core return the WRONG ~126,491.12 m detour via Þröskuldar/60 (not a disconnection); removing 3611 instead gives the optional ~168,331.07 m detour; restoring either gives back the correct ~110,073.97 m chain", () => {
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
    expect(withAll.lengthM).toBeCloseTo(110073.97, 0);
    expect(withAll.slices.map((s) => s.sourceId)).toEqual(CHAIN_IDFERILL);

    const without3411 = runOn(patchedLines.filter((l) => l.sourceId !== 3411));
    expect(without3411.status).toBe("geometry_only"); // the real danger: a plausible WRONG answer, not an error
    expect(without3411.lengthM).toBeCloseTo(126491.12, 0);
    expect(without3411.slices).toHaveLength(20);
    const detourSourceIds = without3411.slices.map((s) => s.sourceId);
    expect(detourSourceIds.some((id) => FORBIDDEN_DETOUR_SOURCE_IDS.includes(id))).toBe(true);

    const without3611 = runOn(patchedLines.filter((l) => l.sourceId !== 3611));
    expect(without3611.status).toBe("geometry_only");
    expect(without3611.lengthM).toBeCloseTo(168331.07, 0);
    expect(without3611.slices).toHaveLength(25);
  });

  it("P6: no slice in the real positive result has a forbidden detour vegnr or sourceId", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const slice of fwd.slices) {
      expect(FORBIDDEN_DETOUR_SOURCE_IDS).not.toContain(slice.sourceId);
      const vegnr = String(byId.get(slice.sourceId)?.properties.VEGNR ?? "");
      expect(FORBIDDEN_DETOUR_VEGNR).not.toContain(vegnr);
      expect(["61", "67", "68"]).toContain(vegnr);
    }
  });

  it("P4: the real route-validated IdButur list matches exactly, including 707040037 (3611 is literally on this chain, unlike the prior round's own exclusion list)", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const idButurIds = [];
    for (const s of fwd.slices) {
      if (s.idbutur == null) continue;
      if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
    }
    const expectedIdButur = [907350037, 907010037, 907020037, 907030037, 707040037, 907040037];
    expect(idButurIds).toEqual(expectedIdButur);
    for (const forbidden of [904060037, 907150037, 905050037, 907000037, 907060037, 906120037, 907070037, 907050037, 761220037, 806110037]) {
      expect(idButurIds).not.toContain(forbidden);
    }
  });

  it("P5: real line/IdButur names are used for via, and via never derives the excluded names from substrings present on the real chain", () => {
    const fwd = compose(region.junction.endpoint, region.holmavik.endpoint);
    const linesById = new Map(region.lines.map((l) => [l.sourceId, l]));
    const realNames = fwd.slices.flatMap((s) => {
      const line = linesById.get(s.sourceId);
      return [line.name, line.idbuturName].filter(Boolean);
    });
    expect(realNames.some((n) => n.includes("Innstrandavegur"))).toBe(true);
    expect(realNames.some((n) => n.includes("Broddanes"))).toBe(true);
    // These excluded substrings ARE literally present in the real retained
    // names on this chain -- the trap P5 warns about -- but must never be
    // used as via candidates by the handler.
    expect(realNames.some((n) => n.includes("Laxárdalsheiði"))).toBe(true);
    expect(realNames.some((n) => n.includes("Djúpvegur"))).toBe(true);
    expect(realNames.some((n) => n.includes("Hólmavík"))).toBe(true);
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
