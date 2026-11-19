// @vitest-environment node
//
// JSON data-contract validation for server_data/winter-route-geometry-pilot.json
// (approved-prompt-v1.md P3/P6). This file reads retained raw docs/ data
// directly (precedent: acquiredGeometry.test.js) -- the PRODUCTION loader
// (geometryDataset.js) never does this; only this test file does.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadGeometryDataset } from "./geometryDataset.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-geometry-dataset-test");

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function loadRawTierLines(relPath, tier) {
  const absPath = path.join(process.cwd(), relPath);
  const doc = JSON.parse(fs.readFileSync(absPath, "utf8"));
  const lines = [];
  for (const feat of doc.features) {
    if (feat.properties.NAKVAEMNIFERLIS !== tier) continue;
    lines.push({ sourceId: feat.properties.IDFERILL, vertexCount: feat.geometry.coordinates.length });
  }
  return lines;
}

describe("winter-route-geometry-pilot.json -- data contract (real retained data)", () => {
  const dataset = loadGeometryDataset();

  it("one fixed tier (2), real CRS, non-empty line set", () => {
    expect(dataset.tier).toBe(2);
    expect(dataset.crs).toBe("EPSG:3057");
    expect(Array.isArray(dataset.lines)).toBe(true);
    expect(dataset.lines.length).toBeGreaterThan(0);
  });

  it("255 lines / 946 vertices total (249 VEGNR=1 tier2 + 6 VEGNR=93 tier2), matching the independently reviewed count", () => {
    expect(dataset.lines).toHaveLength(255);
    const totalVertices = dataset.lines.reduce((n, l) => n + l.vertices.length, 0);
    expect(totalVertices).toBe(946);
  });

  it("every line's sourceId (IDFERILL) is unique -- no silent duplicate/overwrite across the two source files", () => {
    const ids = dataset.lines.map((l) => l.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("regenerating the line set directly from retained raw matches the dataset exactly (count + IDFERILL set + vertex counts)", () => {
    const rawVegnr1 = loadRawTierLines("docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json", 2);
    const rawRoad93 = loadRawTierLines("docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json", 2);
    const rawCombined = [...rawVegnr1, ...rawRoad93];

    expect(rawCombined.length).toBe(dataset.lines.length);

    const rawById = new Map(rawCombined.map((l) => [l.sourceId, l]));
    const datasetIds = new Set(dataset.lines.map((l) => l.sourceId));
    expect(new Set(rawCombined.map((l) => l.sourceId))).toEqual(datasetIds);

    for (const line of dataset.lines) {
      expect(rawById.get(line.sourceId).vertexCount).toBe(line.vertices.length);
    }
  });

  it("source hashes recorded in the dataset match the real retained raw files on disk", () => {
    expect(dataset.sources.length).toBe(2);
    for (const src of dataset.sources) {
      const actual = sha256File(path.join(process.cwd(), src.file));
      expect(actual).toBe(src.sha256);
    }
  });

  it("all five pilot endpoints are literal, independently-pinned native vertices (not fabricated/approximated)", () => {
    // Independently pinned here, not copied from the dataset's own build
    // script -- same literal values established and cross-checked in
    // geometryComposition.test.js.
    expect(dataset.endpoints["reykjavik-raudavatn"]).toMatchObject({ x: 365522.0175, y: 402772.762, sourceId: 1436 });
    expect(dataset.endpoints.selfoss).toMatchObject({ x: 401739.85, y: 383119.047, sourceId: 2138 });
    expect(dataset.endpoints.hella).toMatchObject({ x: 430972.1263, y: 370845.6043, sourceId: 3591 });
    expect(dataset.endpoints.egilsstadir).toMatchObject({ x: 715153.74, y: 536679.93, sourceId: 2344 });
    expect(dataset.endpoints.seydisfjordur).toMatchObject({ x: 732875.674, y: 538207.0762, sourceId: 2894 });
  });

  it("exactly the 5 pilot endpoints are mapped -- no silent extra/missing mapping", () => {
    expect(Object.keys(dataset.endpoints).sort()).toEqual(
      ["egilsstadir", "hella", "reykjavik-raudavatn", "selfoss", "seydisfjordur"].sort()
    );
  });
});

describe("datasetVersion -- derived at load time, never self-embedded, never Date.now/random", () => {
  it("is stable across repeated loads of the same unchanged file", () => {
    const a = loadGeometryDataset();
    const b = loadGeometryDataset();
    expect(a.datasetVersion).toBe(b.datasetVersion);
    expect(typeof a.datasetVersion).toBe("string");
    expect(a.datasetVersion.length).toBeGreaterThan(0);
  });

  it("changes when an unrelated line's content changes, but does NOT change geometryId for a path that never used that line", async () => {
    const { composeGeometryPath } = await import("./geometryComposition.js");
    const original = loadGeometryDataset();

    // Mutate one vertex of a line that the Selfoss<->Hella path never
    // touches (a VEGNR=93 line, far from the VEGNR=1 corridor) and write
    // a synthetic scratch copy -- never the real server_data file.
    const mutated = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "server_data/winter-route-geometry-pilot.json"), "utf8")
    );
    const untouchedLine = mutated.lines.find((l) => l.sourceId === 2892) ?? mutated.lines[mutated.lines.length - 1];
    untouchedLine.vertices[0] = { ...untouchedLine.vertices[0], x: untouchedLine.vertices[0].x + 1 };

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const scratchPath = path.join(SCRATCH_DIR, "mutated-unrelated-line.json");
    fs.writeFileSync(scratchPath, JSON.stringify(mutated), "utf8");

    const mutatedLoaded = loadGeometryDataset(scratchPath);
    expect(mutatedLoaded.datasetVersion).not.toBe(original.datasetVersion);

    const pathOriginal = composeGeometryPath({
      crs: original.crs, tier: original.tier, lines: original.lines,
      from: { placeId: "selfoss", ...original.endpoints.selfoss },
      to: { placeId: "hella", ...original.endpoints.hella },
    });
    const pathMutated = composeGeometryPath({
      crs: mutatedLoaded.crs, tier: mutatedLoaded.tier, lines: mutatedLoaded.lines,
      from: { placeId: "selfoss", ...mutatedLoaded.endpoints.selfoss },
      to: { placeId: "hella", ...mutatedLoaded.endpoints.hella },
    });
    expect(pathMutated.geometryId).toBe(pathOriginal.geometryId);
    expect(pathMutated.lengthM).toBeCloseTo(pathOriginal.lengthM, 9);

    fs.rmSync(scratchPath, { force: true });
  });

  it("throws on a synthetic schema-invalid fixture (injected, never the real JSON file)", () => {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 2, lines: [], endpoints: {} }), "utf8");
    expect(() => loadGeometryDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });

  it("throws when the dataset file is missing entirely", () => {
    expect(() => loadGeometryDataset(path.join(SCRATCH_DIR, "does-not-exist.json"))).toThrow();
  });
});
