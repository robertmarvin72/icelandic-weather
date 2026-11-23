// src/lib/winterRoutePlaces.test.js — Ticket #502, P2(a)/P3(a)
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  WINTER_ROUTE_PLACES,
  WINTER_ROUTE_GROUP_RING,
  WINTER_ROUTE_GROUP_WESTFJORDS,
  isKnownWinterRoutePlaceId,
  winterRoutePlaceName,
  winterRoutePlacesByGroup,
  normalizeWinterRouteSearchText,
  winterRoutePlaceMatchesSearch,
} from "./winterRoutePlaces";

const EXPECTED_IDS = [
  "reykjavik-raudavatn", "selfoss", "hella", "egilsstadir", "seydisfjordur",
  "budardalur", "flokalundur", "isafjordur", "holmavik", "patreksfjordur", "talknafjordur",
];

describe("winterRoutePlaces — frozen 11-id list (P2a)", () => {
  it("has exactly these 11 ids, no more, no fewer", () => {
    expect(WINTER_ROUTE_PLACES.map((p) => p.id).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it("every place has a non-empty nameIs/nameEn and a known group", () => {
    for (const place of WINTER_ROUTE_PLACES) {
      expect(place.nameIs.length).toBeGreaterThan(0);
      expect(place.nameEn.length).toBeGreaterThan(0);
      expect([WINTER_ROUTE_GROUP_RING, WINTER_ROUTE_GROUP_WESTFJORDS]).toContain(place.group);
    }
  });

  it("groups are exactly 5 (ring) + 6 (westfjords) = 11, matching ticket #501's own network split", () => {
    expect(winterRoutePlacesByGroup(WINTER_ROUTE_GROUP_RING)).toHaveLength(5);
    expect(winterRoutePlacesByGroup(WINTER_ROUTE_GROUP_WESTFJORDS)).toHaveLength(6);
  });

  it("junction ids and any id outside the frozen list are not known", () => {
    for (const id of ["junction-1-60-baulan", "junction-1-68-stadarskali", "junction-60-61-throskuldar", "kopavogur", "vik"]) {
      expect(isKnownWinterRoutePlaceId(id)).toBe(false);
    }
  });

  it("winterRoutePlaceName returns the right language and falls back to the raw id for an unknown id", () => {
    expect(winterRoutePlaceName("isafjordur", "is")).toBe("Ísafjörður");
    expect(winterRoutePlaceName("isafjordur", "en")).toBe("Ísafjörður");
    expect(winterRoutePlaceName("not-a-real-id", "is")).toBe("not-a-real-id");
  });

  // 10 of 11 ids exist in the real winter-route-places.json; `flokalundur`
  // is the one documented exception (ticket #501's own connector-insertion
  // endpoint, never added to that 56-place file). Read via `fs` here, at
  // test time only — the production module above never imports this JSON.
  it("10 of 11 ids' Icelandic display names match server_data/winter-route-places.json verbatim; flokalundur is the documented exception", () => {
    const placesJsonPath = path.join(process.cwd(), "server_data/winter-route-places.json");
    const placesJson = JSON.parse(fs.readFileSync(placesJsonPath, "utf8"));
    const byId = new Map(placesJson.places.map((p) => [p.id, p]));

    let matched = 0;
    for (const place of WINTER_ROUTE_PLACES) {
      if (place.id === "flokalundur") {
        expect(byId.has("flokalundur")).toBe(false);
        continue;
      }
      const entry = byId.get(place.id);
      expect(entry).toBeTruthy();
      if (place.id === "reykjavik-raudavatn") {
        // Documented UI override (P2b): the JSON's own bare name is
        // "Reykjavík"; the UI adds "(Rauðavatn)" to name the actual chosen
        // access point, not the city centre.
        expect(entry.name).toBe("Reykjavík");
      } else {
        expect(place.nameIs).toBe(entry.name);
      }
      matched += 1;
    }
    expect(matched).toBe(10);
  });
});

describe("winterRoutePlaces — diacritic-insensitive search (P3a)", () => {
  it("normalizes every Icelandic special character per the exact P3(a) table", () => {
    expect(normalizeWinterRouteSearchText("ÁÉÍÓÚÝÖÆÐÞ")).toBe("aeiouyoaedth");
    expect(normalizeWinterRouteSearchText("Þröskuldar")).toBe("throskuldar");
    expect(normalizeWinterRouteSearchText("Ísafjörður")).toBe("isafjordur");
    expect(normalizeWinterRouteSearchText("Seyðisfjörður")).toBe("seydisfjordur");
    expect(normalizeWinterRouteSearchText("Búðardalur")).toBe("budardalur");
  });

  it("every one of the 11 places is found by its own plain-ASCII (accent-stripped) search term", () => {
    for (const place of WINTER_ROUTE_PLACES) {
      const asciiQuery = normalizeWinterRouteSearchText(place.nameIs);
      expect(winterRoutePlaceMatchesSearch(place, "is", asciiQuery)).toBe(true);
    }
  });

  it("search is case-insensitive as well as diacritic-insensitive", () => {
    const isafjordur = WINTER_ROUTE_PLACES.find((p) => p.id === "isafjordur");
    expect(winterRoutePlaceMatchesSearch(isafjordur, "is", "ISAFJORDUR")).toBe(true);
    expect(winterRoutePlaceMatchesSearch(isafjordur, "is", "IsaFJORDUR")).toBe(true);
  });

  it("an empty/whitespace-only query matches every place (no filtering)", () => {
    const anyPlace = WINTER_ROUTE_PLACES[0];
    expect(winterRoutePlaceMatchesSearch(anyPlace, "is", "")).toBe(true);
    expect(winterRoutePlaceMatchesSearch(anyPlace, "is", "   ")).toBe(true);
  });

  it("a query matching no place's name returns false", () => {
    const anyPlace = WINTER_ROUTE_PLACES[0];
    expect(winterRoutePlaceMatchesSearch(anyPlace, "is", "akureyri")).toBe(false);
  });

  it("matches a substring anywhere in the name, not only a prefix", () => {
    const holmavik = WINTER_ROUTE_PLACES.find((p) => p.id === "holmavik");
    expect(winterRoutePlaceMatchesSearch(holmavik, "is", "mavik")).toBe(true);
  });
});
