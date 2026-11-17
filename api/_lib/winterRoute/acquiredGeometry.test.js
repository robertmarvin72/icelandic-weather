// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ACQ_PATH = path.join(process.cwd(), "server_data/winter-route-acquired-geometry.json");
const acq = JSON.parse(fs.readFileSync(ACQ_PATH, "utf8"));

const COV_PATH = path.join(process.cwd(), "server_data/winter-route-remaining-coverage.json");
const cov = JSON.parse(fs.readFileSync(COV_PATH, "utf8"));

const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");
const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8")).places;

const LEDGER_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-500/acquisition/samples/exchange-ledger.jsonl");
const ledgerLines = fs
  .readFileSync(LEDGER_PATH, "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

const RAW_DIR = path.join(process.cwd(), "docs/ai/tasks/ticket-500/acquisition/samples");

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

// Real integrity check: every raw response file this product data cites
// must exist on disk and match its recorded SHA-256.
function checkRawFileIntegrity(raw_response_files, rawDir) {
  const problems = [];
  for (const [fname, recordedSha] of Object.entries(raw_response_files)) {
    const fpath = path.join(rawDir, fname);
    if (!fs.existsSync(fpath)) {
      problems.push({ file: fname, reason: "MISSING" });
      continue;
    }
    const actual = sha256File(fpath);
    if (actual !== recordedSha) {
      problems.push({ file: fname, reason: "SHA_MISMATCH", actual, recorded: recordedSha });
    }
  }
  return problems;
}

function isWronglyPromoted(connectionStatus) {
  const value = (connectionStatus && (connectionStatus.state || connectionStatus.status)) || "";
  return /supported|routable/i.test(value);
}

describe("winter-route-acquired-geometry.json — real acquisition run (8/8 calls)", () => {
  // 7 of these 39 places were later fixed as a selected product approach
  // (server_data/winter-route-approach-selections.json) -- their
  // connectionStatus.state is now ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED,
  // an explicit, documented exception, not a regression.
  const SELECTED_PRODUCT_APPROACH_IDS = new Set([
    "thingeyri", "bildudalur", "saudarkrokur", "varmahlid", "patreksfjordur",
    "talknafjordur", "keflavikurflugvollur-kef",
    // retained-selection round (7 more within this file's own 39-place scope):
    "grindavik", "bolungarvik", "siglufjordur", "olafsfjordur", "vopnafjordur",
    "grundarfjordur", "olafsvik",
    // remaining-map-selection round (25 more within this file's own 39-place scope --
    // Skaftafell/Kirkjubæjarklaustur are native-only places, never part of this
    // acquisition's 39-place scope, so they are correctly NOT listed here):
    "kopavogur", "hafnarfjordur", "mosfellsbaer", "akranes", "stykkisholmur",
    "budardalur", "reykholar", "isafjordur", "sudavik", "holmavik", "drangsnes",
    "hvammstangi", "blonduos", "skagastrond", "dalvik", "husavik", "kopasker",
    "raufarhofn", "neskaupstadur", "eskifjordur", "djupivogur", "hofn",
    "thorlakshofn", "fludir", "laugarvatn",
  ]);

  it("every emitted piece, candidate and reference matches the raw tier-minus-one source", () => {
    const rawFeatures = Object.entries(acq.acquisition_run.raw_response_files).flatMap(([file, sha]) =>
      JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), "utf8")).features.map((feature) => ({ file, sha, feature }))
    );
    for (const [id, entry] of Object.entries(acq.place_results)) {
      const coverage = cov.coverage[id];
      const expectedReference = `server_data/winter-route-acquired-geometry.json#place_results.${id}`;
      expect(coverage.acquired_geometry_reference).toBe(expectedReference);
      const place = places.find((p) => p.id === id);
      expect(place.acquiredGeometryReference).toBe(expectedReference);
      expect(coverage.status).toBe(entry.status);
      if (SELECTED_PRODUCT_APPROACH_IDS.has(id)) {
        expect(place.connectionStatus.state).toBe("ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED");
      } else {
        expect(place.connectionStatus.state).toBe(entry.status === "CANDIDATE_FROM_ACQUIRED_GEOMETRY"
          ? `${entry.status}_ACCESS_UNCONFIRMED` : entry.status);
      }
      const wantedIds = new Set(coverage.road_condition_refs.map((ref) => ref.idbutur));
      const expected = rawFeatures.filter(({ feature }) =>
        wantedIds.has(feature.properties.IDBUTUR) && feature.properties.NAKVAEMNIFERLIS === -1
      );
      expect(entry.pieces_count).toBe(entry.pieces.length);
      expect(entry.pieces.map((p) => p.objectid).sort((a, b) => a - b)).toEqual(
        expected.map(({ feature }) => feature.properties.OBJECTID).sort((a, b) => a - b)
      );
      for (const piece of entry.pieces) {
        const source = expected.find(({ feature }) => feature.properties.OBJECTID === piece.objectid);
        expect(source, `${id}/${piece.objectid}`).toBeTruthy();
        const props = source.feature.properties;
        const coords = source.feature.geometry.coordinates;
        expect([piece.idferill, piece.idbutur, piece.veghluti, piece.name]).toEqual(
          [props.IDFERILL, props.IDBUTUR, props.VEGHLUTI, props.STUTTNAFNLEIDAR]
        );
        expect(piece.raw_source_file).toBe(source.file);
        expect(piece.raw_source_sha256).toBe(source.sha);
        expect(piece.wgs84_start).toEqual(coords[0].slice(0, 2));
        expect(piece.wgs84_end).toEqual(coords.at(-1).slice(0, 2));
        expect(piece.n_vertices).toBe(coords.length);
      }
      if (entry.candidate) {
        const c = entry.candidate;
        const piece = entry.pieces.find((p) => p.objectid === c.objectid);
        expect(piece).toBeTruthy();
        expect([c.idferill, c.idbutur]).toEqual([piece.idferill, piece.idbutur]);
        expect(["START", "END"]).toContain(c.stored_field);
        expect([c.wgs84.longitude, c.wgs84.latitude]).toEqual(
          c.stored_field === "START" ? piece.wgs84_start : piece.wgs84_end
        );
      }
    }
    expect(new Set(rawFeatures.map(({ feature }) => feature.properties.IDBUTUR))).toEqual(
      new Set(acq.acquisition_run.distinct_idbutur_covered)
    );
  });
  it("the ledger shows exactly 8 real calls, all status 200, no stop reasons, matching PROBE + BATCH-1..7", () => {
    expect(ledgerLines.length).toBe(8);
    const ids = ledgerLines.map((l) => l.request_id);
    expect(ids).toEqual(["PROBE-KEF", "BATCH-1", "BATCH-2", "BATCH-3", "BATCH-4", "BATCH-5", "BATCH-6", "BATCH-7"]);
    for (const line of ledgerLines) {
      expect(line.status).toBe(200);
      expect(line.stop_reasons).toEqual([]);
      expect(line.refused).toBeFalsy();
    }
  });

  it("raw response files match their recorded SHA-256 (real file integrity, not a self-comparison)", () => {
    const problems = checkRawFileIntegrity(acq.acquisition_run.raw_response_files, RAW_DIR);
    expect(problems).toEqual([]);
  });

  it("real mutation: a corrupted/truncated raw file is caught by the same integrity check", () => {
    const fixtureDir = path.join(process.cwd(), ".tmp-acquired-geometry-fixture");
    fs.mkdirSync(fixtureDir, { recursive: true });
    const fixturePath = path.join(fixtureDir, "raw-PROBE-KEF.json");
    fs.writeFileSync(fixturePath, "{ corrupted and truncat");
    try {
      const fakeManifest = { "raw-PROBE-KEF.json": acq.acquisition_run.raw_response_files["raw-PROBE-KEF.json"] };
      const problems = checkRawFileIntegrity(fakeManifest, fixtureDir);
      expect(problems.length).toBe(1);
      expect(problems[0].reason).toBe("SHA_MISMATCH");
    } finally {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  it("the acquisition_run's own total_bytes_received matches the real sum of the raw files on disk", () => {
    let total = 0;
    for (const fname of Object.keys(acq.acquisition_run.raw_response_files)) {
      total += fs.statSync(path.join(RAW_DIR, fname)).size;
    }
    expect(total).toBe(acq.acquisition_run.total_bytes_received);
  });

  it("every one of the 39 target places has a place_results entry with a non-negative pieces_count", () => {
    const ids = Object.keys(acq.place_results);
    expect(ids.length).toBe(39);
    for (const id of ids) {
      expect(acq.place_results[id].pieces_count).toBeGreaterThanOrEqual(0);
    }
  });

  it("the two CANDIDATE_FROM_ACQUIRED_GEOMETRY places have a real WGS84 point inside Iceland's bbox", () => {
    const candidates = Object.values(acq.place_results).filter((r) => r.status === "CANDIDATE_FROM_ACQUIRED_GEOMETRY");
    expect(candidates.length).toBe(2);
    for (const c of candidates) {
      const { latitude, longitude } = c.candidate.wgs84;
      expect(longitude).toBeGreaterThanOrEqual(-25);
      expect(longitude).toBeLessThanOrEqual(-13);
      expect(latitude).toBeGreaterThanOrEqual(63);
      expect(latitude).toBeLessThanOrEqual(67);
    }
  });

  it("new geometry alone never promotes a place to SUPPORTED/ROUTABLE in acquired-geometry.json, coverage, or places.json; coordinates stay null except the 7 now-selected", () => {
    for (const [id, entry] of Object.entries(acq.place_results)) {
      expect(isWronglyPromoted({ state: entry.status })).toBe(false);
      expect(isWronglyPromoted({ status: acq.driving_access_and_direction.status })).toBe(false);
      const covEntry = cov.coverage[id];
      expect(isWronglyPromoted({ state: covEntry.status })).toBe(false);
      const place = places.find((p) => p.id === id);
      expect(isWronglyPromoted(place.connectionStatus)).toBe(false);
      if (SELECTED_PRODUCT_APPROACH_IDS.has(id)) {
        expect(place.coordinates, `${id} should have selected coordinates`).not.toBeNull();
        continue;
      }
      expect(place.coordinates).toBeNull();
      expect(place.approach).toBeNull();
    }
  });

  it("real mutation: forcing the acquisition's own access status to SUPPORTED is caught by the same promotion guard", () => {
    const mutated = { ...acq.driving_access_and_direction, status: "SUPPORTED" };
    expect(isWronglyPromoted({ status: mutated.status })).toBe(true);
  });

  it("requested-vs-returned consistency: all 82 manifest IDBUTUR appear in the acquired pieces", () => {
    const manifestPath = path.join(process.cwd(), "docs/ai/tasks/ticket-500/acquisition/request-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const requestedIdButur = new Set();
    for (const r of manifest.requests) for (const ib of r.idbutur) requestedIdButur.add(ib);
    expect(requestedIdButur.size).toBe(82);
    expect(acq.acquisition_run.distinct_idbutur_count).toBe(82);
    expect(acq.acquisition_run.distinct_idbutur_covered.length).toBe(82);
    for (const ib of requestedIdButur) {
      expect(acq.acquisition_run.distinct_idbutur_covered).toContain(ib);
    }
  });
});
