// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const EVIDENCE_PATH = path.join(process.cwd(), "server_data/winter-route-place-evidence.json");
const evidence = JSON.parse(fs.readFileSync(EVIDENCE_PATH, "utf8"));

const COV_PATH = path.join(process.cwd(), "server_data/winter-route-remaining-coverage.json");
const cov = JSON.parse(fs.readFileSync(COV_PATH, "utf8"));

const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");
const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8")).places;

const ALLOWED_STATUSES = new Set([
  "CONFIRMED_AUTHORITY_NO_GEOMETRY_BINDING", "LEAD_NOT_INDEPENDENTLY_VERIFIED",
  "SEARCHED_INCONCLUSIVE", "ATTEMPTED_BLOCKED_TOOL_OBSTACLE",
  "PARTIAL_AREA_LEVEL", "NOT_CHECKED_THIS_RUN",
]);

function validEvidence(entry) {
  return ALLOWED_STATUSES.has(entry.status) && entry.candidate === null &&
    (entry.status !== "CONFIRMED_AUTHORITY_NO_GEOMETRY_BINDING" ||
      entry.sources.some((source) => /^https:\/\//.test(source.url || "") &&
        source.method === "WebFetch (directly verified)"));
}

function isWronglyPromoted(connectionStatus) {
  const value = (connectionStatus && (connectionStatus.state || connectionStatus.status)) || "";
  return /supported|routable|owner_selected/i.test(value);
}

const EXPECTED_TARGETS = [
  "akranes", "blonduos", "budardalur", "dalvik", "djupivogur", "drangsnes", "eskifjordur", "fludir",
  "hafnarfjordur", "hofn", "holmavik", "husavik", "hvammstangi", "isafjordur", "kopasker", "kopavogur",
  "laugarvatn", "mosfellsbaer", "neskaupstadur", "raufarhofn", "reykholar", "skagastrond",
  "stykkisholmur", "sudavik", "thorlakshofn", "keflavik", "skaftafell", "thorshofn", "kirkjubaejarklaustur",
];

describe("winter-route-place-evidence.json -- exactly the 29 target places", () => {
  it("has exactly 29 place_results, matching an independently-listed target set (not derived from the file itself)", () => {
    const ids = Object.keys(evidence.place_results);
    expect(ids.length).toBe(29);
    expect(new Set(ids)).toEqual(new Set(EXPECTED_TARGETS));
  });

  it("stayed within the approved search/open budget (12 searches, 24 opens)", () => {
    expect(evidence.search_budget.searches_used).toBeLessThanOrEqual(12);
    expect(evidence.search_budget.opens_used).toBeLessThanOrEqual(24);
  });

  it("all entries use an allowed evidence level, with opened URLs for confirmed facts and no unsupported candidates", () => {
    for (const [id, entry] of Object.entries(evidence.place_results)) {
      expect(validEvidence(entry), id).toBe(true);
    }
  });

  it("rejects snippet-only promotion, invalid status and the withdrawn Hafnarfjörður candidate", () => {
    const lead = evidence.place_results.hafnarfjordur;
    expect(lead.status).toBe("LEAD_NOT_INDEPENDENTLY_VERIFIED");
    expect(validEvidence({ ...lead, status: "CONFIRMED_AUTHORITY_NO_GEOMETRY_BINDING" })).toBe(false);
    expect(validEvidence({ ...lead, status: "INVENTED" })).toBe(false);
    expect(validEvidence({ ...lead, candidate: { idferill: 2807 } })).toBe(false);
    expect(validEvidence({ ...lead, candidate: { idferill: 3567 } })).toBe(false);
  });

  it("NOT_CHECKED_THIS_RUN entries carry no fact and no sources (an honest budget boundary, not a disguised negative finding)", () => {
    for (const entry of Object.values(evidence.place_results)) {
      if (entry.status !== "NOT_CHECKED_THIS_RUN") continue;
      expect(entry.new_fact).toBeNull();
      expect(entry.sources).toEqual([]);
    }
  });

  it("every place with a new_fact also carries at least one source entry", () => {
    for (const [id, entry] of Object.entries(evidence.place_results)) {
      if (entry.new_fact === null) continue;
      expect(entry.sources.length, `${id}: has a new_fact but no sources`).toBeGreaterThan(0);
    }
  });

  it("reference fields resolve to the correct place_results entry for the same place id, in coverage and places files", () => {
    for (const id of Object.keys(evidence.place_results)) {
      const place = places.find((p) => p.id === id);
      expect(place.placeEvidenceReference).toBe(`server_data/winter-route-place-evidence.json#place_results.${id}`);
      if (cov.coverage[id]) {
        expect(cov.coverage[id].place_evidence_reference).toBe(`server_data/winter-route-place-evidence.json#place_results.${id}`);
      }
    }
  });

  // remaining-map-selection round: 27 of these 29 target places were later fixed as a
  // selected product approach (server_data/winter-route-approach-selections.json) --
  // an explicit, documented exception, not a regression. Only Keflavík (town) and
  // Þórshöfn -- which have no retained source geometry at all -- remain null.
  const SELECTED_PRODUCT_APPROACH_IDS = new Set([
    "kopavogur", "hafnarfjordur", "mosfellsbaer", "akranes", "stykkisholmur",
    "budardalur", "reykholar", "isafjordur", "sudavik", "holmavik", "drangsnes",
    "hvammstangi", "blonduos", "skagastrond", "dalvik", "husavik", "kopasker",
    "raufarhofn", "neskaupstadur", "eskifjordur", "djupivogur", "hofn",
    "skaftafell", "kirkjubaejarklaustur", "thorlakshofn", "fludir", "laugarvatn",
  ]);

  it("no place anywhere is SUPPORTED/ROUTABLE/OWNER_SELECTED as a result of this round; coordinates/approach stay null only for Keflavík (town) and Þórshöfn, the 2 of 29 with no source geometry", () => {
    expect(isWronglyPromoted({ status: evidence.driving_access_and_direction.status })).toBe(false);
    for (const id of Object.keys(evidence.place_results)) {
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

  it("real mutation: forcing a place's evidence status to OWNER_SELECTED is caught by the same promotion guard", () => {
    const mutated = { state: "OWNER_SELECTED" };
    expect(isWronglyPromoted(mutated)).toBe(true);
  });

  it("Keflavík (the town) and Keflavíkurflugvöllur (KEF) remain two separate places -- this round never merges them", () => {
    const keflavik = places.find((p) => p.id === "keflavik");
    const kef = places.find((p) => p.id === "keflavikurflugvollur-kef");
    expect(keflavik).toBeTruthy();
    expect(kef).toBeTruthy();
    expect(keflavik.id).not.toBe(kef.id);
    // KEF itself was out of this round's own target set (already has a 39-acquisition disposition).
    expect(evidence.place_results.keflavik).toBeTruthy();
    expect(evidence.place_results["keflavikurflugvollur-kef"]).toBeUndefined();
  });

  it("all 56 places are unchanged in count/ids; the other 27 (outside this round's 29) are untouched", () => {
    expect(places.length).toBe(56);
    const untouched = places.filter((p) => !evidence.place_results[p.id]);
    expect(untouched.length).toBe(27);
    for (const p of untouched) {
      expect(p.placeEvidenceReference).toBeUndefined();
    }
  });
});
