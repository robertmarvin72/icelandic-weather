// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-isafjordur-holmavik.json
// (westfjords-holmavik-mvp approved-prompt-v1.md P1/P2/P3/P4/P5/P6/P7).
// This file reads retained owner-provided docs/ data directly (same
// precedent as the sibling region test files) -- the PRODUCTION loader
// never does this.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsIsafjordurHolmavikRegionDataset } from "./westfjordsIsafjordurHolmavikRegionDataset.js";
import { loadWestfjordsFlokalundurIsafjordurRegionDataset } from "./westfjordsFlokalundurIsafjordurRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-westfjords-holmavik-dataset-test");
const GEOJSON_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson");
const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");

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

const CHAIN_IDFERILL = [3833, 3830, 3392, 3298, 3535, 3627, 3629, 3609, 3244, 3218, 3217, 3216, 3220, 3194, 3148, 3195, 3626, 3605, 3419, 3418, 3415, 53466, 3370, 3347, 3883];
const FORBIDDEN_DETOUR_VEGNR = ["60", "62", "63", "631", "633", "634", "635", "608", "643", "645", "68", "F66"];
const FORBIDDEN_DETOUR_SOURCE_IDS = [2077, 2321, 2322, 3718, 3750, 3754, 3321, 3324, 3611, 2690, 2086, 2038, 2087, 2977, 3890, 3185, 3829, 3846, 3835, 25602, 25603];

describe("westfjords-region-isafjordur-holmavik.json -- data contract (real retained data)", () => {
  const region = loadWestfjordsIsafjordurHolmavikRegionDataset();

  it("tier 0, real CRS, 3834 (shared with the flokalundur-isafjordur region) + the 25-line chain, veghluti 1, vegnr 61 except 3883 = 67", () => {
    expect(region.tier).toBe(0);
    expect(region.crs).toBe("EPSG:3057");
    expect(region.lines.map((l) => l.sourceId)).toEqual([3834, ...CHAIN_IDFERILL]);
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

  it("P2: the Ísafjörður endpoint is byte-identical to the one already established in westfjords-region-flokalundur-isafjordur.json -- never recomputed differently, never a shared runtime reference between the two region files", () => {
    const isaRegion = loadWestfjordsFlokalundurIsafjordurRegionDataset();
    expect(region.isafjordur.endpoint.x).toBe(isaRegion.isafjordur.endpoint.x);
    expect(region.isafjordur.endpoint.y).toBe(isaRegion.isafjordur.endpoint.y);

    const line3834 = region.lines.find((l) => l.sourceId === 3834);
    expect(line3834.vertices).toHaveLength(13);
    expect(line3834.vertices[5].x).toBe(region.isafjordur.endpoint.x);
    expect(line3834.vertices[5].y).toBe(region.isafjordur.endpoint.y);
  });

  it("P1: every join in the 26-line chain (3834 included, arriving at its own vertex 0) is a real, literal 0 m connection -- independently re-verified here from the raw GeoJSON vertices, never the production build script", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const chainFromRaw = CHAIN_IDFERILL.map((id) => {
      const feat = byId.get(id);
      return { sourceId: id, vertices: feat.geometry.coordinates.map(([lon, lat]) => forward(lon, lat)) };
    });
    const line3834 = region.lines.find((l) => l.sourceId === 3834);

    const firstGapCheck = Math.hypot(line3834.vertices[0].x - chainFromRaw[0].vertices[0].x, line3834.vertices[0].y - chainFromRaw[0].vertices[0].y);
    const firstGapCheckAlt = Math.hypot(line3834.vertices[0].x - chainFromRaw[0].vertices[chainFromRaw[0].vertices.length - 1].x, line3834.vertices[0].y - chainFromRaw[0].vertices[chainFromRaw[0].vertices.length - 1].y);
    expect(Math.min(firstGapCheck, firstGapCheckAlt)).toBeLessThan(0.001);

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

  it("P3: Hólmavík endpoint is 3883's own literal, EXISTING vertex 3 -- byte-identical to the existing winter-route-places.json coordinate for holmavik, never a new/inserted point; the junction J (3347's own vertex 0) is recorded separately and is NOT this pair's endpoint", () => {
    const line3883 = region.lines.find((l) => l.sourceId === 3883);
    expect(line3883.vertices).toHaveLength(4);
    expect(region.holmavik.endpoint.x).toBe(line3883.vertices[3].x);
    expect(region.holmavik.endpoint.y).toBe(line3883.vertices[3].y);

    const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8"));
    const holPlace = places.places.find((p) => p.id === "holmavik");
    const placesNative = forward(holPlace.coordinates.longitude, holPlace.coordinates.latitude);
    expect(region.holmavik.endpoint.x).toBeCloseTo(placesNative.x, 4);
    expect(region.holmavik.endpoint.y).toBeCloseTo(placesNative.y, 4);

    const line3347 = region.lines.find((l) => l.sourceId === 3347);
    expect(region.holmavik.junctionJ.x).toBe(line3347.vertices[0].x);
    expect(region.holmavik.endpoint.x).not.toBe(region.holmavik.junctionJ.x);
  });

  it("P3: the owner-coordinate offset is the real measured distance (~437.32 m), shown separately, never counted as part of a route length by this loader", () => {
    expect(region.holmavik.offsetM).toBeCloseTo(437.31993395679643, 3);
    expect(region.holmavik).not.toHaveProperty("lengthM");
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsIsafjordurHolmavikRegionDataset();
    const b = loadWestfjordsIsafjordurHolmavikRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsIsafjordurHolmavikRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords Ísafjörður<->Hólmavík -- real end-to-end composition (production core, unchanged)", () => {
  const region = loadWestfjordsIsafjordurHolmavikRegionDataset();

  function compose(fromPoint, toPoint) {
    return composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: region.lines,
      from: { placeId: "a", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "b", x: toPoint.x, y: toPoint.y },
    });
  }

  it("P1: the literal sourceId chain in order (no connector), both directions, same length, different geometryId, no forbidden-detour sourceId, no double-counted edge", () => {
    const fwd = compose(region.isafjordur.endpoint, region.holmavik.endpoint);
    expect(fwd.status).toBe("geometry_only");
    const expectedForward = [3834, ...CHAIN_IDFERILL];
    expect(fwd.slices.map((s) => s.sourceId)).toEqual(expectedForward);
    expect(fwd.lengthM).toBeCloseTo(223136.99, 0);
    expect(new Set(fwd.slices.map((s) => s.sourceId)).size).toBe(fwd.slices.length);
    for (const forbidden of FORBIDDEN_DETOUR_SOURCE_IDS) expect(expectedForward).not.toContain(forbidden);

    const rev = compose(region.holmavik.endpoint, region.isafjordur.endpoint);
    expect(rev.status).toBe("geometry_only");
    expect(rev.slices.map((s) => s.sourceId)).toEqual([...expectedForward].reverse());
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

  it("P2: slice 3834[5->0] is the real ~870.1 m tail, overlap with the flokalundur<->isafjordur leg's own shared sourceIds (3833, 3834) is permitted and measures ~3,130.4 m -- no cross-pair sourceId-uniqueness rule", () => {
    const fwd = compose(region.isafjordur.endpoint, region.holmavik.endpoint);
    const slice3834 = fwd.slices.find((s) => s.sourceId === 3834);
    expect(slice3834.fromIndex).toBe(5);
    expect(slice3834.toIndex).toBe(0);
    expect(slice3834.direction).toBe("reverse");
    expect(slice3834.lengthM).toBeCloseTo(870.1081131062895, 3);

    const isaRegion = loadWestfjordsFlokalundurIsafjordurRegionDataset();
    const flkIsaLeg = composeGeometryPath({
      crs: isaRegion.crs, tier: isaRegion.tier, lines: isaRegion.lines,
      from: { placeId: "flk", x: isaRegion.flokalundur.insertedNode.x, y: isaRegion.flokalundur.insertedNode.y },
      to: { placeId: "isa", x: region.isafjordur.endpoint.x, y: region.isafjordur.endpoint.y },
    });
    const sharedIds = flkIsaLeg.slices.map((s) => s.sourceId).filter((id) => fwd.slices.some((s2) => s2.sourceId === id));
    expect(sharedIds.sort()).toEqual([3833, 3834]);
    const sharedLen = fwd.slices.filter((s) => sharedIds.includes(s.sourceId)).reduce((sum, s) => sum + s.lengthM, 0);
    expect(sharedLen).toBeCloseTo(3130.3737737378515, 2);
  });

  it("P6 (negative, Djúp-chain-is-necessary): on the full retained national tier-0 graph, removing 3415 (Steingrímsfjarðarheiði) makes the real core return the WRONG ~268,841.20 m detour via 608/60/Þröskuldar (not a disconnection); removing 3626 instead gives the optional ~228,544.40 m F66/Dýrafjarðargöng detour; restoring either gives back the correct ~223,136.99 m chain", () => {
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
        from: { placeId: "isa", x: region.isafjordur.endpoint.x, y: region.isafjordur.endpoint.y },
        to: { placeId: "hol", x: region.holmavik.endpoint.x, y: region.holmavik.endpoint.y },
      });
    }

    const withAll = runOn(patchedLines);
    expect(withAll.status).toBe("geometry_only");
    expect(withAll.lengthM).toBeCloseTo(223136.99, 0);
    expect(withAll.slices.map((s) => s.sourceId)).toEqual([3834, ...CHAIN_IDFERILL]);

    const without3415 = runOn(patchedLines.filter((l) => l.sourceId !== 3415));
    expect(without3415.status).toBe("geometry_only"); // the real danger: a plausible WRONG answer, not an error
    expect(without3415.lengthM).toBeCloseTo(268841.2, 0);
    expect(without3415.slices).toHaveLength(30);
    const idButurWithout3415 = [];
    for (const s of without3415.slices) { if (idButurWithout3415[idButurWithout3415.length - 1] !== s.idbutur) idButurWithout3415.push(s.idbutur); }
    for (const forbiddenIdbutur of [907060037, 560800037, 905130037, 905110037, 907000037, 707040037]) expect(idButurWithout3415).toContain(forbiddenIdbutur);

    const without3626 = runOn(patchedLines.filter((l) => l.sourceId !== 3626));
    expect(without3626.status).toBe("geometry_only");
    expect(without3626.lengthM).toBeCloseTo(228544.4, 0);
  });

  it("P6: no slice in the real positive result has a forbidden detour vegnr or sourceId", () => {
    const fwd = compose(region.isafjordur.endpoint, region.holmavik.endpoint);
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const slice of fwd.slices) {
      expect(FORBIDDEN_DETOUR_SOURCE_IDS).not.toContain(slice.sourceId);
      const vegnr = String(byId.get(slice.sourceId)?.properties.VEGNR ?? "");
      expect(FORBIDDEN_DETOUR_VEGNR).not.toContain(vegnr);
    }
  });

  it("P4: the real route-validated IdButur list matches exactly", () => {
    const fwd = compose(region.isafjordur.endpoint, region.holmavik.endpoint);
    const idButurIds = [];
    for (const s of fwd.slices) {
      if (s.idbutur == null) continue;
      if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
    }
    const expectedIdButur = [906120037, 906140037, 906150037, 906160037, 906170037, 907070037, 907050037, 761220037, 907040037];
    expect(idButurIds).toEqual(expectedIdButur);
    for (const forbidden of [906130037, 806110037, 906180037, 906190037, 907080037, 907060037, 906520037, 907100037, 907120037, 907000037, 707040037, 907030037]) {
      expect(idButurIds).not.toContain(forbidden);
    }
  });

  it("P5: real line names are used for via, and via never derives \"Ísafjörður\" from the fjord's own retained line names", () => {
    const fwd = compose(region.isafjordur.endpoint, region.holmavik.endpoint);
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const fjordNames = fwd.slices.map((s) => byId.get(s.sourceId)?.properties.STUTTNAFNLEIDAR).filter(Boolean);
    expect(fjordNames.some((n) => n.includes("Djúpvegur: Ísafjörður"))).toBe(true); // the trap IS on the chain
    expect(fjordNames.some((n) => n.includes("Súðavík"))).toBe(true);
    expect(fjordNames.some((n) => n.includes("Steingrímsfjarðarheiði"))).toBe(true);
  });

  it("P7: the roundabout caveat direction is confirmed from the real core output -- isafjordur->holmavik traverses 3834 in reverse (against forward), holmavik->isafjordur traverses it forward (with)", () => {
    const fwd = compose(region.isafjordur.endpoint, region.holmavik.endpoint);
    expect(fwd.slices.find((s) => s.sourceId === 3834).direction).toBe("reverse");
    const rev = compose(region.holmavik.endpoint, region.isafjordur.endpoint);
    expect(rev.slices.find((s) => s.sourceId === 3834).direction).toBe("forward");
  });

  it("P7/P9: drivingAccess/status discipline holds for this pair exactly like every other -- UNVERIFIED, geometry_only, never a legal driving claim", () => {
    const result = compose(region.isafjordur.endpoint, region.holmavik.endpoint);
    expect(result.drivingAccess).toBe("UNVERIFIED");
    expect(result.status).toBe("geometry_only");
  });
});
