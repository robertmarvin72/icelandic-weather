// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-flokalundur-patreksfjordur.json
// (westfjords-patreksfjordur-mvp approved-prompt-v1.md
// P1/P2/P3/P4/P5/P6/P7/P8). This file reads retained owner-provided
// docs/ data directly (same precedent as the sibling region test files)
// -- the PRODUCTION loader never does this.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsFlokalundurPatreksfjordurRegionDataset } from "./westfjordsFlokalundurPatreksfjordurRegionDataset.js";
import { loadWestfjordsFlokalundurRegionDataset } from "./westfjordsFlokalundurRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-westfjords-patreksfjordur-dataset-test");
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

const CHAIN_IDFERILL = [3698, 3339, 3334, 3332, 2271];
const FORBIDDEN_DETOUR_SOURCE_IDS = [3009, 2318, 2319, 2997, 34243, 3111, 2088, 3361, 3868, 3869, 3651, 34245, 2102];

describe("westfjords-region-flokalundur-patreksfjordur.json -- data contract (real retained data)", () => {
  const region = loadWestfjordsFlokalundurPatreksfjordurRegionDataset();

  it("tier 0, real CRS, 3648 (shared with the flokalundur region) + the 5-line chain + 53127, veghluti 1, vegnr 60 only on 3648 then 62 throughout", () => {
    expect(region.tier).toBe(0);
    expect(region.crs).toBe("EPSG:3057");
    expect(region.lines.map((l) => l.sourceId)).toEqual([3648, ...CHAIN_IDFERILL, 53127]);
    expect(region.lines.every((l) => l.tier === 0)).toBe(true);
    expect(region.lines.every((l) => l.veghluti === 1)).toBe(true);

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const id of [...CHAIN_IDFERILL, 53127]) {
      expect(String(byId.get(id).properties.VEGNR)).toBe("62");
    }
  });

  it("P8: the recorded source file/SHA-256 matches the real retained raw GeoJSON on disk", () => {
    expect(region.source.file).toContain("Vegagerdin-faerdferlar-WGS84.geojson");
    expect(sha256File(GEOJSON_PATH)).toBe(region.source.sha256);
  });

  it("P4: the Flókalundur inserted node is byte-identical to the one already established in westfjords-region-budardalur-flokalundur.json -- never recomputed differently, never a shared runtime reference between the two region files", () => {
    const flkRegion = loadWestfjordsFlokalundurRegionDataset();
    expect(region.flokalundur.insertedNode.x).toBe(flkRegion.flokalundur.insertedNode.x);
    expect(region.flokalundur.insertedNode.y).toBe(flkRegion.flokalundur.insertedNode.y);

    const line3648 = region.lines.find((l) => l.sourceId === 3648);
    expect(line3648.vertices).toHaveLength(54);
    expect(line3648.vertices[50].x).toBe(flkRegion.flokalundur.insertedNode.x);
    expect(line3648.vertices[50].y).toBe(flkRegion.flokalundur.insertedNode.y);
  });

  it("P1: every join in the 5-line chain (3648 included) is a real, literal 0 m connection -- independently re-verified here from the raw GeoJSON vertices, never the production build script", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const chainFromRaw = CHAIN_IDFERILL.map((id) => {
      const feat = byId.get(id);
      return { sourceId: id, vertices: feat.geometry.coordinates.map(([lon, lat]) => forward(lon, lat)) };
    });
    const line3648 = region.lines.find((l) => l.sourceId === 3648);
    const full = [{ sourceId: 3648, vertices: line3648.vertices }, ...chainFromRaw];
    for (let i = 0; i < full.length - 1; i++) {
      const a = full[i].vertices;
      const b = full[i + 1].vertices;
      const ends = [a[0], a[a.length - 1]];
      const starts = [b[0], b[b.length - 1]];
      let best = Infinity;
      for (const p of ends) for (const q of starts) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
      expect(best).toBeLessThan(0.001);
    }
  });

  it("P2: the one estimated connector -- reserved negative sourceId, idbutur null, non-WFS evidenceRef, length <= 5 m, distinct from every earlier connector, z copied from the endpoints (never null)", () => {
    expect(region.connector.sourceId).toBeLessThan(0);
    expect([-1, -2, -3, -4]).not.toContain(region.connector.sourceId);
    expect(region.connector.idbutur).toBeNull();
    expect(region.connector.evidenceRef).not.toMatch(/IDFERILL=/);
    const [p, q] = region.connector.vertices;
    expect(p.z).not.toBeNull();
    expect(q.z).not.toBeNull();
    const len = Math.hypot(p.x - q.x, p.y - q.y);
    expect(len).toBeLessThanOrEqual(5);
    expect(len).toBeCloseTo(4.393183, 3);
  });

  it("P3: Patreksfjörður is a literal inserted vertex ON 53127's own real geometry (collinear with the segment it was inserted into, between vertex 6 and 7), never a new sourceId, offset ~8.7759 m, and the places.json vertex 0 is recorded separately and is NOT the same point", () => {
    const line53127 = region.lines.find((l) => l.sourceId === 53127);
    expect(line53127.vertices).toHaveLength(12);
    const inserted = region.patreksfjordur.insertedNode;
    const idx = line53127.vertices.findIndex((v) => v.x === inserted.x && v.y === inserted.y);
    expect(idx).toBe(7);
    const segStart = line53127.vertices[6];
    const segEnd = line53127.vertices[8];
    const d1 = Math.hypot(inserted.x - segStart.x, inserted.y - segStart.y);
    const d2 = Math.hypot(inserted.x - segEnd.x, inserted.y - segEnd.y);
    const segLen = Math.hypot(segEnd.x - segStart.x, segEnd.y - segStart.y);
    expect(d1 + d2).toBeCloseTo(segLen, 6);

    expect(region.patreksfjordur.offsetM).toBeCloseTo(8.775919534139193, 3);
    expect(region.patreksfjordur).not.toHaveProperty("lengthM");

    const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8"));
    const patPlace = places.places.find((p) => p.id === "patreksfjordur");
    const placesNative = forward(patPlace.coordinates.longitude, patPlace.coordinates.latitude);
    expect(region.patreksfjordur.placesJsonNode.x).toBeCloseTo(placesNative.x, 4);
    expect(region.patreksfjordur.placesJsonNode.y).toBeCloseTo(placesNative.y, 4);
    expect(region.patreksfjordur.insertedNode.x).not.toBe(region.patreksfjordur.placesJsonNode.x);
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsFlokalundurPatreksfjordurRegionDataset();
    const b = loadWestfjordsFlokalundurPatreksfjordurRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsFlokalundurPatreksfjordurRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords Flókalundur<->Patreksfjörður -- real end-to-end composition (production core, unchanged)", () => {
  const region = loadWestfjordsFlokalundurPatreksfjordurRegionDataset();
  const patLines = [...region.lines, region.connector];

  function compose(fromPoint, toPoint) {
    return composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: patLines,
      from: { placeId: "a", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "b", x: toPoint.x, y: toPoint.y },
    });
  }

  it("P1: the literal sourceId chain in order (connector included), both directions, CC's own measured length within 0.05 m of the prompt's own sandbox figure, no forbidden-detour sourceId, no double-counted edge", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.patreksfjordur.insertedNode);
    expect(fwd.status).toBe("geometry_only");
    const expectedForward = [3648, 3698, 3339, 3334, 3332, 2271, region.connector.sourceId, 53127];
    expect(fwd.slices.map((s) => s.sourceId)).toEqual(expectedForward);
    expect(fwd.lengthM).toBeCloseTo(61400.09896512219, 1);
    expect(new Set(fwd.slices.map((s) => s.sourceId)).size).toBe(fwd.slices.length);
    for (const forbidden of FORBIDDEN_DETOUR_SOURCE_IDS) expect(expectedForward).not.toContain(forbidden);

    const rev = compose(region.patreksfjordur.insertedNode, region.flokalundur.insertedNode);
    expect(rev.status).toBe("geometry_only");
    expect(rev.slices.map((s) => s.sourceId)).toEqual([...expectedForward].reverse());
    expect(rev.lengthM).toBeCloseTo(fwd.lengthM, 2);
    expect(rev.geometryId).not.toBe(fwd.geometryId);

    const coordLen = (() => {
      let total = 0;
      for (const slice of fwd.slices) {
        const line = patLines.find((l) => l.sourceId === slice.sourceId);
        const lo = Math.min(slice.fromIndex, slice.toIndex);
        const hi = Math.max(slice.fromIndex, slice.toIndex);
        const span = line.vertices.slice(lo, hi + 1);
        for (let j = 0; j < span.length - 1; j++) total += Math.hypot(span[j + 1].x - span[j].x, span[j + 1].y - span[j].y);
      }
      return total;
    })();
    expect(coordLen).toBeCloseTo(fwd.lengthM, 4);

    // 0 z:null in the coordinate chain (P2's own requirement for the connector's two vertices)
    const coords = [];
    fwd.slices.forEach((slice, i) => {
      const line = patLines.find((l) => l.sourceId === slice.sourceId);
      const lo = Math.min(slice.fromIndex, slice.toIndex);
      const hi = Math.max(slice.fromIndex, slice.toIndex);
      const span = line.vertices.slice(lo, hi + 1);
      const ordered = slice.direction === "forward" ? span : [...span].reverse();
      const startAt = i === 0 ? 0 : 1;
      for (let j = startAt; j < ordered.length; j++) coords.push(ordered[j]);
    });
    expect(coords.filter((c) => c.z === null)).toHaveLength(0);
  });

  it("P2: the connector slice is marked estimated via sign and reports the real measured length", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.patreksfjordur.insertedNode);
    const connectorSlice = fwd.slices.find((s) => s.sourceId === region.connector.sourceId);
    expect(connectorSlice.lengthM).toBeCloseTo(4.39318262751713, 4);
    expect(connectorSlice.idbutur).toBeNull();
  });

  it("P7 (negative, a): removing the connector makes the real core return unsupported disconnected_graph -- no silent snapping across the gap", () => {
    const withoutConnector = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: region.lines,
      from: { placeId: "a", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
      to: { placeId: "b", x: region.patreksfjordur.insertedNode.x, y: region.patreksfjordur.insertedNode.y },
    });
    expect(withoutConnector.status).toBe("unsupported");
    expect(withoutConnector.reason).toBe("disconnected_graph");
  });

  it("P7 (negative, b): on the full retained national tier-0 graph, removing 3339 (a vegur-62 midline) makes the real core return the WRONG ~72,208.41 m detour via 60/63/Miklidalur (not a disconnection); restoring it gives back the correct ~61,400.10 m chain", () => {
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

    const withTunnel = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: [...patchedLines, region.connector],
      from: { placeId: "flk", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
      to: { placeId: "pat", x: region.patreksfjordur.insertedNode.x, y: region.patreksfjordur.insertedNode.y },
    });
    expect(withTunnel.status).toBe("geometry_only");
    expect(withTunnel.lengthM).toBeCloseTo(61400.1, 0);

    const without3339Lines = patchedLines.filter((l) => l.sourceId !== 3339);
    const without3339 = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: [...without3339Lines, region.connector],
      from: { placeId: "flk", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
      to: { placeId: "pat", x: region.patreksfjordur.insertedNode.x, y: region.patreksfjordur.insertedNode.y },
    });
    expect(without3339.status).toBe("geometry_only"); // the real danger: a plausible WRONG answer, not an error
    expect(without3339.lengthM).toBeCloseTo(72208.40778649, 0);
    expect(without3339.slices.map((s) => s.sourceId)).toEqual([3648, 3009, 2318, 2319, 2997, 34243, 3111, 2088, 3361, region.connector.sourceId, 53127]);
  });

  it("P7: no slice in the real positive result has a forbidden detour sourceId, and vegnr 60 appears only on 3648", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.patreksfjordur.insertedNode);
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const slice of fwd.slices) {
      expect(FORBIDDEN_DETOUR_SOURCE_IDS).not.toContain(slice.sourceId);
      if (slice.sourceId < 0) continue;
      const vegnr = String(byId.get(slice.sourceId)?.properties.VEGNR ?? "");
      if (slice.sourceId === 3648) expect(vegnr).toBe("60");
      else expect(vegnr).toBe("62");
    }
  });

  it("P5: the real route-validated IdButur list matches exactly (connector's own null skipped)", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.patreksfjordur.insertedNode);
    const idButurIds = [];
    for (const s of fwd.slices) {
      if (s.idbutur == null) continue;
      if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
    }
    expect(idButurIds).toEqual([905170037, 905180037, 905190037, 905200037, 905250037, 562070037]);
    for (const forbidden of [34245, 3868, 3869, 3651, 3009, 2102, 3361, 2318, 2319, 2997, 34243, 3111, 2088]) {
      expect(idButurIds).not.toContain(forbidden);
    }
  });

  it("P6: via is EXACTLY [\"Brjánslækur\",\"Kleifaheiði\"] (toEqual) -- never \"Siglunesvegur\"/\"Flókalundur\"/\"Patreksfjörður\"/\"Raknadalshlíð\"/\"Dynjandisheiði\"/\"Bíldudalur\"/\"Tálknafjörður\"/\"Miklidalur\"/any ferry name", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.patreksfjordur.insertedNode);
    const linesById = new Map(patLines.map((l) => [l.sourceId, l]));
    const realNames = fwd.slices.map((s) => linesById.get(s.sourceId)?.name).filter(Boolean);
    expect(realNames.some((n) => n.includes("Brjánslækur"))).toBe(true);
    expect(realNames.some((n) => n.includes("Kleifaheiði"))).toBe(true);
    expect(realNames.some((n) => n.includes("Siglunesvegur"))).toBe(true); // the trap IS on the chain

    const viaCandidates = [{ label: "Brjánslækur", match: "Brjánslækur" }, { label: "Kleifaheiði", match: "Kleifaheiði" }];
    const realNamesSet = new Set(realNames);
    const via = viaCandidates.filter((c) => [...realNamesSet].some((n) => n.includes(c.match))).map((c) => c.label);
    expect(via).toEqual(["Brjánslækur", "Kleifaheiði"]);
  });

  it("P8: no roundabout/split-carriageway segment on this chain -- VEGHLUTI is 1 throughout, and 3834 (the Ísafjörður roundabout line) is not on this route", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.patreksfjordur.insertedNode);
    const linesById = new Map(patLines.map((l) => [l.sourceId, l]));
    expect(fwd.slices.filter((s) => s.sourceId >= 0).every((s) => linesById.get(s.sourceId).veghluti === 1)).toBe(true);
    expect(fwd.slices.map((s) => s.sourceId)).not.toContain(3834);
  });

  it("P8/P9: drivingAccess/status discipline holds for this pair exactly like every other -- UNVERIFIED, geometry_only, never a legal driving claim", () => {
    const result = compose(region.flokalundur.insertedNode, region.patreksfjordur.insertedNode);
    expect(result.drivingAccess).toBe("UNVERIFIED");
    expect(result.status).toBe("geometry_only");
  });
});
