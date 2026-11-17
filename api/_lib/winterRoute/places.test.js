// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");
const data = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8"));
const places = data.places;

// Independent expected list transcribed directly from
// docs/ai/tasks/ticket-500/nationwide-owner-scope.md, "Lokaður listi veljanlegra
// staða" — not derived from the file under test. [name, region] pairs, in order.
const EXPECTED = [
  ["Reykjavík", "Höfuðborgarsvæði"],
  ["Kópavogur", "Höfuðborgarsvæði"],
  ["Hafnarfjörður", "Höfuðborgarsvæði"],
  ["Mosfellsbær", "Höfuðborgarsvæði"],
  ["Keflavík", "Reykjanes"],
  ["Keflavíkurflugvöllur (KEF)", "Reykjanes"],
  ["Grindavík", "Reykjanes"],
  ["Akranes", "Vesturland og Snæfellsnes"],
  ["Borgarnes", "Vesturland og Snæfellsnes"],
  ["Stykkishólmur", "Vesturland og Snæfellsnes"],
  ["Grundarfjörður", "Vesturland og Snæfellsnes"],
  ["Ólafsvík", "Vesturland og Snæfellsnes"],
  ["Búðardalur", "Vesturland og Snæfellsnes"],
  ["Reykhólar", "Vestfirðir"],
  ["Patreksfjörður", "Vestfirðir"],
  ["Tálknafjörður", "Vestfirðir"],
  ["Bíldudalur", "Vestfirðir"],
  ["Þingeyri", "Vestfirðir"],
  ["Ísafjörður", "Vestfirðir"],
  ["Bolungarvík", "Vestfirðir"],
  ["Súðavík", "Vestfirðir"],
  ["Hólmavík", "Vestfirðir"],
  ["Drangsnes", "Vestfirðir"],
  ["Hvammstangi", "Norðurland vestra"],
  ["Blönduós", "Norðurland vestra"],
  ["Skagaströnd", "Norðurland vestra"],
  ["Sauðárkrókur", "Norðurland vestra"],
  ["Varmahlíð", "Norðurland vestra"],
  ["Siglufjörður", "Norðurland vestra"],
  ["Ólafsfjörður", "Norðurland eystra"],
  ["Dalvík", "Norðurland eystra"],
  ["Akureyri", "Norðurland eystra"],
  ["Húsavík", "Norðurland eystra"],
  ["Reykjahlíð (Mývatn)", "Norðurland eystra"],
  ["Kópasker", "Norðurland eystra"],
  ["Raufarhöfn", "Norðurland eystra"],
  ["Þórshöfn", "Norðurland eystra"],
  ["Vopnafjörður", "Austurland"],
  ["Egilsstaðir", "Austurland"],
  ["Seyðisfjörður", "Austurland"],
  ["Neskaupstaður", "Austurland"],
  ["Eskifjörður", "Austurland"],
  ["Reyðarfjörður", "Austurland"],
  ["Fáskrúðsfjörður", "Austurland"],
  ["Djúpivogur", "Austurland"],
  ["Höfn", "Suðurland"],
  ["Skaftafell", "Suðurland"],
  ["Kirkjubæjarklaustur", "Suðurland"],
  ["Vík", "Suðurland"],
  ["Hvolsvöllur", "Suðurland"],
  ["Hella", "Suðurland"],
  ["Selfoss", "Suðurland"],
  ["Hveragerði", "Suðurland"],
  ["Þorlákshöfn", "Suðurland"],
  ["Flúðir", "Suðurland"],
  ["Laugarvatn", "Suðurland"],
];

const RETAINED_IDS = {
  "reykjavik-raudavatn": { latitude: 64.10152894, longitude: -21.75906405 },
  egilsstadir: { latitude: 65.25861764, longitude: -14.39028964 },
  seydisfjordur: { latitude: 65.26021788, longitude: -14.00953135 },
  akureyri: { latitude: 65.69570405, longitude: -18.12371406 },
};

describe("winter-route-places.json — exactly the 56 owner-approved places, in order", () => {
  it("has exactly 56 entries", () => {
    expect(places.length).toBe(56);
    expect(EXPECTED.length).toBe(56);
  });

  it("names + regions match the independent owner-scope list, in the same order", () => {
    const actual = places.map((p) => [p.name, p.region]);
    expect(actual).toEqual(EXPECTED);
  });

  it("all 56 ids are unique", () => {
    const ids = places.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no id is a Hagstofa-style merged-municipality id (sanity: ids are simple ascii slugs)", () => {
    for (const p of places) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("Keflavík vs Keflavíkurflugvöllur (KEF) — two entries, alias scoped to the airport only", () => {
  it("are two separate place entries with distinct ids", () => {
    const keflavik = places.find((p) => p.name === "Keflavík");
    const kef = places.find((p) => p.name === "Keflavíkurflugvöllur (KEF)");
    expect(keflavik).toBeTruthy();
    expect(kef).toBeTruthy();
    expect(keflavik.id).not.toBe(kef.id);
  });

  it("'KEF' is an alias of the airport entry only, never of Keflavík", () => {
    const keflavik = places.find((p) => p.name === "Keflavík");
    const kef = places.find((p) => p.name === "Keflavíkurflugvöllur (KEF)");
    expect(kef.aliases).toContain("KEF");
    expect(keflavik.aliases).not.toContain("KEF");
  });

  it("aliases never introduce a 57th selectable place", () => {
    expect(places.length).toBe(56);
    const idsFromAliases = places.flatMap((p) => p.aliases || []);
    const realIds = new Set(places.map((p) => p.id));
    for (const alias of idsFromAliases) {
      expect(realIds.has(alias)).toBe(false); // an alias string is not itself a place id
    }
  });
});

describe("Retained four access points reused exactly; the other 52 are honestly pending", () => {
  it("retains the four existing ids with their exact prior coordinates", () => {
    for (const [id, coords] of Object.entries(RETAINED_IDS)) {
      const place = places.find((p) => p.id === id);
      expect(place, `missing retained id ${id}`).toBeTruthy();
      expect(place.coordinates.latitude).toBe(coords.latitude);
      expect(place.coordinates.longitude).toBe(coords.longitude);
    }
  });

  it("Reykjavík's approach names Rauðavatn/R1 explicitly and does not invent a city-core coordinate", () => {
    const reykjavik = places.find((p) => p.id === "reykjavik-raudavatn");
    expect(reykjavik.name).toBe("Reykjavík");
    expect(reykjavik.approach.toLowerCase()).toContain("rauðavatn");
    // The coordinate must be the retained Rauðavatn point, not a distinct city-core value.
    expect(reykjavik.coordinates.latitude).toBe(64.10152894);
    expect(reykjavik.coordinates.longitude).toBe(-21.75906405);
  });

  // The 11 places fixed as a selected product approach in the approach-selection
  // round (server_data/winter-route-approach-selections.json) are a distinct,
  // explicit exception to the "null until selected" rule below -- they are no
  // longer PENDING/candidate-only, by design, not a regression.
  const SELECTED_PRODUCT_APPROACH_IDS = new Set([
    "thingeyri", "bildudalur", "saudarkrokur", "varmahlid", "patreksfjordur",
    "talknafjordur", "keflavikurflugvollur-kef", "selfoss", "hella", "hvolsvollur",
    "reykjahlid-myvatn",
    // retained-selection round (10 more, same exception, selection_basis RETAINED_CANDIDATE_APPROVED_VIA_PROMPT):
    "grindavik", "bolungarvik", "siglufjordur", "olafsfjordur", "vopnafjordur",
    "grundarfjordur", "olafsvik", "hveragerdi", "vik", "borgarnes",
    // east-selection round (2 more, selection_basis MAP_JUNCTION_APPROVED_VIA_PROMPT):
    "reydarfjordur", "faskrudsfjordur",
    // remaining-map-selection round (27 more, selection_basis MAP_PRODUCT_APPROVED_VIA_PROMPT):
    "kopavogur", "hafnarfjordur", "mosfellsbaer", "akranes", "stykkisholmur",
    "budardalur", "reykholar", "isafjordur", "sudavik", "holmavik", "drangsnes",
    "hvammstangi", "blonduos", "skagastrond", "dalvik", "husavik", "kopasker",
    "raufarhofn", "neskaupstadur", "eskifjordur", "djupivogur", "hofn",
    "skaftafell", "kirkjubaejarklaustur", "thorlakshofn", "fludir", "laugarvatn",
  ]);

  it("the 52 non-retained places have null coordinates and approach, with an explicit non-'no data'/'closed' reason -- except the 11 now SELECTED_PRODUCT_APPROACH places, which must have real coordinates/approach instead", () => {
    const retained = new Set(Object.keys(RETAINED_IDS));
    const pending = places.filter((p) => !retained.has(p.id));
    expect(pending.length).toBe(52);
    for (const p of pending) {
      if (SELECTED_PRODUCT_APPROACH_IDS.has(p.id)) {
        expect(p.coordinates, `${p.id} should have selected coordinates`).not.toBeNull();
        expect(p.approach, `${p.id} should have selected approach text`).not.toBeNull();
        expect(p.connectionStatus.state).toBe("ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED");
        continue;
      }
      expect(p.coordinates).toBeNull();
      expect(p.approach).toBeNull();
      expect(p.connectionStatus.reason.length).toBeGreaterThan(0);
      expect(p.connectionStatus.reason.toLowerCase()).not.toContain("engin gögn til");
      expect(p.connectionStatus.reason.toLowerCase()).not.toContain("vegur lokaður");
    }
  });

  it("the 5 south-corridor places carry a proposed-candidate status with a candidateReference -- except Selfoss/Hella/Hvolsvöllur, now SELECTED_PRODUCT_APPROACH", () => {
    const SOUTH_CANDIDATE_IDS = ["hveragerdi", "selfoss", "hella", "hvolsvollur", "vik"];
    for (const id of SOUTH_CANDIDATE_IDS) {
      const p = places.find((pl) => pl.id === id);
      if (SELECTED_PRODUCT_APPROACH_IDS.has(id)) {
        expect(p.connectionStatus.state).toBe("ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED");
        expect(p.selectionReference).toBe(`server_data/winter-route-approach-selections.json#selections.${id}`);
        continue;
      }
      expect(p.connectionStatus.state).toBe("APPROACH_CANDIDATE_PROPOSED_ACCESS_UNCONFIRMED");
      expect(p.candidateReference).toBe(
        `server_data/winter-route-south-connections.json#approach_candidates.${p.id}`
      );
    }
  });

  it("no place is strictly PENDING any more; the remaining 47 each carry one of the reviewed-coverage states with a coverageReference, or the new SELECTED_PRODUCT_APPROACH state for the 7 now-selected among them", () => {
    const retained = new Set(Object.keys(RETAINED_IDS));
    const SOUTH_CANDIDATE_IDS = new Set(["hveragerdi", "selfoss", "hella", "hvolsvollur", "vik"]);
    const reviewed = places.filter((p) => !retained.has(p.id) && !SOUTH_CANDIDATE_IDS.has(p.id));
    expect(reviewed.length).toBe(47);
    const ALLOWED_STATES = new Set([
      "RETAINED_CANDIDATE_NAME_MATCH_INFERRED_ACCESS_UNCONFIRMED",
      "NAME_MENTION_ONLY_NO_GEOMETRY",
      "NO_RETAINED_MATCH_CHECKED",
      // Acquisition-round states (the 39 places that were ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY
      // now have real acquired geometry, see winter-route-acquired-geometry.json):
      "CANDIDATE_FROM_ACQUIRED_GEOMETRY_ACCESS_UNCONFIRMED",
      "ACQUIRED_GEOMETRY_MULTIPLE_PIECES_NO_SINGLE_CANDIDATE",
      "ACQUIRED_GEOMETRY_NO_CLEAN_NAME_MATCH",
      // Approach-selection round: a place from the 47 that was fixed as a
      // selected product approach (see SELECTED_PRODUCT_APPROACH_IDS above).
      "ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED",
    ]);
    for (const p of reviewed) {
      expect(p.connectionStatus.state).not.toBe("PENDING");
      expect(p.connectionStatus.state).not.toBe("ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY");
      expect(ALLOWED_STATES.has(p.connectionStatus.state), `unexpected state for ${p.id}: ${p.connectionStatus.state}`).toBe(true);
      if (SELECTED_PRODUCT_APPROACH_IDS.has(p.id)) {
        expect(p.selectionReference).toBe(`server_data/winter-route-approach-selections.json#selections.${p.id}`);
        continue;
      }
      expect(p.coverageReference).toBe(`server_data/winter-route-remaining-coverage.json#coverage.${p.id}`);
      if (p.acquiredGeometryReference) {
        expect(p.acquiredGeometryReference).toBe(`server_data/winter-route-acquired-geometry.json#place_results.${p.id}`);
      }
    }
  });

  it("no place is marked route-supported/routable merely by being in this list", () => {
    for (const p of places) {
      const state = p.connectionStatus.state;
      expect(state).not.toBe("SUPPORTED");
      expect(state).not.toBe("ROUTABLE");
      expect(state.toLowerCase()).not.toContain("supported");
      expect(state.toLowerCase()).not.toContain("routable");
    }
  });
});
