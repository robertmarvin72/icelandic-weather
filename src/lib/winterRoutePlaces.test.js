// src/lib/winterRoutePlaces.test.js — Ticket #502, P2(a)/P3(a)
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  WINTER_ROUTE_PLACES,
  WINTER_ROUTE_GROUP_RING,
  WINTER_ROUTE_GROUP_WESTFJORDS,
  WINTER_ROUTE_GROUP_OTHER,
  isKnownWinterRoutePlaceId,
  winterRoutePlaceName,
  winterRoutePlacesByGroup,
  normalizeWinterRouteSearchText,
  winterRoutePlaceMatchesSearch,
} from "./winterRoutePlaces";

const EXPECTED_IDS = [
  "reykjavik-raudavatn", "selfoss", "hella", "egilsstadir", "seydisfjordur",
  "budardalur", "flokalundur", "isafjordur", "holmavik", "patreksfjordur", "talknafjordur",
  // Ticket #492, direct-flow, C6 -- the two fixed-route-adapter places.
  "vik", "borgarnes",
];

describe("winterRoutePlaces — frozen 13-id list (P2a, extended by #492 direct-flow C6)", () => {
  it("has exactly these 13 ids, no more, no fewer", () => {
    expect(WINTER_ROUTE_PLACES.map((p) => p.id).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it("every place has a non-empty nameIs/nameEn and a known group", () => {
    for (const place of WINTER_ROUTE_PLACES) {
      expect(place.nameIs.length).toBeGreaterThan(0);
      expect(place.nameEn.length).toBeGreaterThan(0);
      expect([WINTER_ROUTE_GROUP_RING, WINTER_ROUTE_GROUP_WESTFJORDS, WINTER_ROUTE_GROUP_OTHER]).toContain(place.group);
    }
  });

  it("groups are exactly 5 (ring) + 6 (westfjords) + 2 (other) = 13", () => {
    expect(winterRoutePlacesByGroup(WINTER_ROUTE_GROUP_RING)).toHaveLength(5);
    expect(winterRoutePlacesByGroup(WINTER_ROUTE_GROUP_WESTFJORDS)).toHaveLength(6);
    expect(winterRoutePlacesByGroup(WINTER_ROUTE_GROUP_OTHER)).toHaveLength(2);
  });

  it("junction ids and any id outside the frozen list are not known", () => {
    for (const id of ["junction-1-60-baulan", "junction-1-68-stadarskali", "junction-60-61-throskuldar", "kopavogur", "akureyri"]) {
      expect(isKnownWinterRoutePlaceId(id)).toBe(false);
    }
  });

  it("the two direct-flow places ARE known (unlike before #492)", () => {
    expect(isKnownWinterRoutePlaceId("vik")).toBe(true);
    expect(isKnownWinterRoutePlaceId("borgarnes")).toBe(true);
  });

  it("winterRoutePlaceName returns the right language and falls back to the raw id for an unknown id", () => {
    expect(winterRoutePlaceName("isafjordur", "is")).toBe("Ísafjörður");
    expect(winterRoutePlaceName("isafjordur", "en")).toBe("Ísafjörður");
    expect(winterRoutePlaceName("not-a-real-id", "is")).toBe("not-a-real-id");
  });

  // 12 of 13 ids exist in the real winter-route-places.json; `flokalundur`
  // is the one documented exception (ticket #501's own connector-insertion
  // endpoint, never added to that 56-place file). `vik`/`borgarnes` (added
  // by #492 direct-flow C6) ARE in that file too, verified here the same
  // way as the original 11. Read via `fs` here, at test time only — the
  // production module above never imports this JSON.
  it("12 of 13 ids' Icelandic display names match server_data/winter-route-places.json verbatim; flokalundur is the documented exception", () => {
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
    expect(matched).toBe(12);
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

  it("every one of the 13 places is found by its own plain-ASCII (accent-stripped) search term", () => {
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
