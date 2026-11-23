// src/lib/winterRouteGeometryResponse.test.js — Ticket #502
//
// Fixtures below are copied verbatim from a real run of
// docs/ai/tasks/ticket-502/evidence/fixtures-gen.mjs (calls the real,
// unmocked api/winter-route-geometry.js handler) -- never hand-invented.
// See that script and cc-report.md for the exact generation command.
import { describe, it, expect } from "vitest";
import {
  WINTER_ROUTE_OUTCOME,
  classifyWinterRouteGeometryResponse,
  winterRouteGeometryOptions,
  winterRouteHasSelectableOptions,
  winterRouteDisplayVia,
  winterRouteShowsEstimatedConnectorNote,
  winterRouteAccessPointShortFlag,
  winterRouteOptionLabelKey,
} from "./winterRouteGeometryResponse";

const BUDARDALUR_PATREKSFJORDUR = {
  schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "patreksfjordur",
  via: ["Gilsfjörður", "Þorskafjörður", "Klettsháls", "Brjánslækur", "Kleifaheiði"],
  estimatedConnectorLengthM: 4.398206058358473,
  accessApproach: { budardalur: { ownerCoordinateOffsetM: 160.1476178502974 }, patreksfjordur: { ownerCoordinateOffsetM: 8.775919534139193 } },
};

const BUDARDALUR_TALKNAFJORDUR = {
  schemaVersion: 1, tier: 0, status: "geometry_only", from: "budardalur", to: "talknafjordur",
  via: ["Gilsfjörður", "Þorskafjörður", "Klettsháls", "Brjánslækur", "Kleifaheiði", "Miklidalur"],
  estimatedConnectorLengthM: 0.0050234308413424035,
  accessApproach: {
    budardalur: { ownerCoordinateOffsetM: 160.1476178502974 },
    talknafjordur: { ownerCoordinateOffsetM: 995.4294251543986, routeEndsShortOfOwnerCoordinate: true },
  },
};

const RVK_SELFOSS_WITH_OPTIONS = {
  schemaVersion: 1, tier: 2, status: "geometry_only", from: "reykjavik-raudavatn", to: "selfoss",
  selectedOption: "south",
  options: [
    { id: "south", label: "Short route via Hellisheiði", lengthM: 44984.77037809235, via: [], routeId: "x" },
    { id: "north", label: "Long route via the Route 1 ring (Vesturland/Norðurland/Austurland)", lengthM: 1236038.3222104264, via: ["Borgarnes", "Akureyri", "Egilsstaðir", "Vík"], routeId: "y" },
  ],
  estimatedConnectorLengthM: 0,
};

const HELLA_SELFOSS_NO_OPTIONS = {
  schemaVersion: 1, tier: 2, status: "geometry_only", from: "hella", to: "selfoss",
};

const RING_SAME_PLACE = { schemaVersion: 1, tier: 2, status: "same_place", from: "selfoss", to: "selfoss" };

const TALKNAFJORDUR_SAME_PLACE = {
  schemaVersion: 1, tier: 0, status: "same_place", from: "talknafjordur", to: "talknafjordur",
  via: [], estimatedConnectorLengthM: 0,
  accessApproach: { talknafjordur: { ownerCoordinateOffsetM: 995.4294251543986, routeEndsShortOfOwnerCoordinate: true } },
};

const UNSUPPORTED = { schemaVersion: 1, tier: 2, status: "unsupported", from: "reykjavik-raudavatn", to: "budardalur", reason: "endpoint_mapping_unavailable" };

describe("classifyWinterRouteGeometryResponse (P4c/P4d)", () => {
  it("200 geometry_only with matching from/to -> GEOMETRY_ONLY", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: BUDARDALUR_PATREKSFJORDUR, applied: { from: "budardalur", to: "patreksfjordur", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.GEOMETRY_ONLY);
  });

  it("200 same_place -> SAME_PLACE", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: RING_SAME_PLACE, applied: { from: "selfoss", to: "selfoss", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.SAME_PLACE);
  });

  it("200 unsupported (any reason) -> NO_ROUTE, reason never inspected", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: UNSUPPORTED, applied: { from: "reykjavik-raudavatn", to: "budardalur", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.NO_ROUTE);
  });

  it("400 unknown_place_id (flokalundur<->ring, a legal UI pair) -> NO_ROUTE, not ERROR", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 400, payload: { error: "unknown_place_id", field: "from" }, applied: { from: "flokalundur", to: "selfoss", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.NO_ROUTE);
  });

  it("400 invalid_option -> ERROR, never confused with unknown_place_id's NO_ROUTE", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 400, payload: { error: "invalid_option", field: "option" }, applied: { from: "reykjavik-raudavatn", to: "selfoss", option: "bogus" } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });

  it("405 -> ERROR", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 405, payload: { error: "method_not_allowed" }, applied: { from: "selfoss", to: "hella", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });

  it("5xx -> ERROR", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 500, payload: { error: "geometry_dataset_error" }, applied: { from: "selfoss", to: "hella", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });

  it("network failure (no httpStatus) -> ERROR", () => {
    expect(classifyWinterRouteGeometryResponse({ httpStatus: null, payload: null, applied: { from: "selfoss", to: "hella", option: null } }).outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });

  it("non-JSON / unparsable body -> ERROR", () => {
    expect(classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: null, applied: { from: "selfoss", to: "hella", option: null } }).outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });

  it("a 200 body whose from/to doesn't match what was applied -> ERROR, never shown as the applied pair's own result", () => {
    const wrongPayload = { ...HELLA_SELFOSS_NO_OPTIONS, from: "egilsstadir", to: "seydisfjordur" };
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: wrongPayload, applied: { from: "hella", to: "selfoss", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });

  it("option sent but response's selectedOption doesn't echo it back (silently-ignored option) -> ERROR, never treated as that option applying", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: HELLA_SELFOSS_NO_OPTIONS, applied: { from: "hella", to: "selfoss", option: "north" } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });

  it("option sent and response's selectedOption echoes it back -> GEOMETRY_ONLY (not an error)", () => {
    const northPayload = { ...RVK_SELFOSS_WITH_OPTIONS, selectedOption: "north" };
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: northPayload, applied: { from: "reykjavik-raudavatn", to: "selfoss", option: "north" } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.GEOMETRY_ONLY);
  });

  it("missing schemaVersion/tier on an otherwise-200 body -> ERROR", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: { status: "geometry_only", from: "a", to: "b" }, applied: { from: "a", to: "b", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });

  it("an unknown status string -> ERROR", () => {
    const result = classifyWinterRouteGeometryResponse({ httpStatus: 200, payload: { ...HELLA_SELFOSS_NO_OPTIONS, status: "something_new" }, applied: { from: "hella", to: "selfoss", option: null } });
    expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.ERROR);
  });
});

describe("display helpers (P5/P6)", () => {
  it("winterRouteHasSelectableOptions is true only when options.length > 1", () => {
    expect(winterRouteHasSelectableOptions(RVK_SELFOSS_WITH_OPTIONS)).toBe(true);
    expect(winterRouteHasSelectableOptions(HELLA_SELFOSS_NO_OPTIONS)).toBe(false);
    expect(winterRouteGeometryOptions(HELLA_SELFOSS_NO_OPTIONS)).toEqual([]);
  });

  it("winterRouteDisplayVia reads the selected option's own via when options exist", () => {
    expect(winterRouteDisplayVia(RVK_SELFOSS_WITH_OPTIONS)).toEqual([]);
    const northPayload = { ...RVK_SELFOSS_WITH_OPTIONS, selectedOption: "north" };
    expect(winterRouteDisplayVia(northPayload)).toEqual(["Borgarnes", "Akureyri", "Egilsstaðir", "Vík"]);
  });

  it("winterRouteDisplayVia falls back to the top-level via when there are no options, and tolerates its total absence", () => {
    expect(winterRouteDisplayVia(BUDARDALUR_PATREKSFJORDUR)).toEqual(BUDARDALUR_PATREKSFJORDUR.via);
    expect(winterRouteDisplayVia(HELLA_SELFOSS_NO_OPTIONS)).toEqual([]);
  });

  it("winterRouteShowsEstimatedConnectorNote is true only when estimatedConnectorLengthM > 0, and tolerates the key's absence", () => {
    expect(winterRouteShowsEstimatedConnectorNote(BUDARDALUR_PATREKSFJORDUR)).toBe(true);
    expect(winterRouteShowsEstimatedConnectorNote(BUDARDALUR_TALKNAFJORDUR)).toBe(true);
    expect(winterRouteShowsEstimatedConnectorNote(RVK_SELFOSS_WITH_OPTIONS)).toBe(false);
    expect(winterRouteShowsEstimatedConnectorNote(HELLA_SELFOSS_NO_OPTIONS)).toBe(false);
  });

  it("winterRouteAccessPointShortFlag reads generically by place id, not hardcoded to talknafjordur", () => {
    expect(winterRouteAccessPointShortFlag(BUDARDALUR_TALKNAFJORDUR, "talknafjordur")).toBe(true);
    expect(winterRouteAccessPointShortFlag(BUDARDALUR_TALKNAFJORDUR, "budardalur")).toBe(false);
    expect(winterRouteAccessPointShortFlag(TALKNAFJORDUR_SAME_PLACE, "talknafjordur")).toBe(true);
    expect(winterRouteAccessPointShortFlag(HELLA_SELFOSS_NO_OPTIONS, "hella")).toBe(false);
  });

  it("winterRouteOptionLabelKey maps known ids and falls back to a generic key for anything else", () => {
    expect(winterRouteOptionLabelKey("south")).toBe("winterRouteOptionSouth");
    expect(winterRouteOptionLabelKey("north")).toBe("winterRouteOptionNorth");
    expect(winterRouteOptionLabelKey("something-else")).toBe("winterRouteOptionGeneric");
  });
});

// P7(c): every one of the 121 ordered pairs of the UI's own 11-id list is
// classified into one of the four UI statuses. This table is pasted
// verbatim from fixtures-gen.mjs's own real-handler run (never hand-typed
// support-table copying) -- [from, to, httpStatus, status-or-error].
const CONTRACT_121 = [
  ["reykjavik-raudavatn","reykjavik-raudavatn",200,"same_place"],
  ["reykjavik-raudavatn","selfoss",200,"geometry_only"],
  ["reykjavik-raudavatn","hella",200,"geometry_only"],
  ["reykjavik-raudavatn","egilsstadir",200,"geometry_only"],
  ["reykjavik-raudavatn","seydisfjordur",200,"geometry_only"],
  ["reykjavik-raudavatn","budardalur",200,"unsupported"],
  ["reykjavik-raudavatn","flokalundur",400,"unknown_place_id"],
  ["reykjavik-raudavatn","isafjordur",200,"unsupported"],
  ["reykjavik-raudavatn","holmavik",200,"unsupported"],
  ["reykjavik-raudavatn","patreksfjordur",200,"unsupported"],
  ["reykjavik-raudavatn","talknafjordur",200,"unsupported"],
  ["selfoss","reykjavik-raudavatn",200,"geometry_only"],
  ["selfoss","selfoss",200,"same_place"],
  ["selfoss","hella",200,"geometry_only"],
  ["selfoss","egilsstadir",200,"geometry_only"],
  ["selfoss","seydisfjordur",200,"geometry_only"],
  ["selfoss","budardalur",200,"unsupported"],
  ["selfoss","flokalundur",400,"unknown_place_id"],
  ["selfoss","isafjordur",200,"unsupported"],
  ["selfoss","holmavik",200,"unsupported"],
  ["selfoss","patreksfjordur",200,"unsupported"],
  ["selfoss","talknafjordur",200,"unsupported"],
  ["hella","reykjavik-raudavatn",200,"geometry_only"],
  ["hella","selfoss",200,"geometry_only"],
  ["hella","hella",200,"same_place"],
  ["hella","egilsstadir",200,"geometry_only"],
  ["hella","seydisfjordur",200,"geometry_only"],
  ["hella","budardalur",200,"unsupported"],
  ["hella","flokalundur",400,"unknown_place_id"],
  ["hella","isafjordur",200,"unsupported"],
  ["hella","holmavik",200,"unsupported"],
  ["hella","patreksfjordur",200,"unsupported"],
  ["hella","talknafjordur",200,"unsupported"],
  ["egilsstadir","reykjavik-raudavatn",200,"geometry_only"],
  ["egilsstadir","selfoss",200,"geometry_only"],
  ["egilsstadir","hella",200,"geometry_only"],
  ["egilsstadir","egilsstadir",200,"same_place"],
  ["egilsstadir","seydisfjordur",200,"geometry_only"],
  ["egilsstadir","budardalur",200,"unsupported"],
  ["egilsstadir","flokalundur",400,"unknown_place_id"],
  ["egilsstadir","isafjordur",200,"unsupported"],
  ["egilsstadir","holmavik",200,"unsupported"],
  ["egilsstadir","patreksfjordur",200,"unsupported"],
  ["egilsstadir","talknafjordur",200,"unsupported"],
  ["seydisfjordur","reykjavik-raudavatn",200,"geometry_only"],
  ["seydisfjordur","selfoss",200,"geometry_only"],
  ["seydisfjordur","hella",200,"geometry_only"],
  ["seydisfjordur","egilsstadir",200,"geometry_only"],
  ["seydisfjordur","seydisfjordur",200,"same_place"],
  ["seydisfjordur","budardalur",200,"unsupported"],
  ["seydisfjordur","flokalundur",400,"unknown_place_id"],
  ["seydisfjordur","isafjordur",200,"unsupported"],
  ["seydisfjordur","holmavik",200,"unsupported"],
  ["seydisfjordur","patreksfjordur",200,"unsupported"],
  ["seydisfjordur","talknafjordur",200,"unsupported"],
  ["budardalur","reykjavik-raudavatn",200,"unsupported"],
  ["budardalur","selfoss",200,"unsupported"],
  ["budardalur","hella",200,"unsupported"],
  ["budardalur","egilsstadir",200,"unsupported"],
  ["budardalur","seydisfjordur",200,"unsupported"],
  ["budardalur","budardalur",200,"same_place"],
  ["budardalur","flokalundur",200,"geometry_only"],
  ["budardalur","isafjordur",200,"geometry_only"],
  ["budardalur","holmavik",200,"geometry_only"],
  ["budardalur","patreksfjordur",200,"geometry_only"],
  ["budardalur","talknafjordur",200,"geometry_only"],
  ["flokalundur","reykjavik-raudavatn",400,"unknown_place_id"],
  ["flokalundur","selfoss",400,"unknown_place_id"],
  ["flokalundur","hella",400,"unknown_place_id"],
  ["flokalundur","egilsstadir",400,"unknown_place_id"],
  ["flokalundur","seydisfjordur",400,"unknown_place_id"],
  ["flokalundur","budardalur",200,"geometry_only"],
  ["flokalundur","flokalundur",200,"same_place"],
  ["flokalundur","isafjordur",200,"geometry_only"],
  ["flokalundur","holmavik",200,"geometry_only"],
  ["flokalundur","patreksfjordur",200,"geometry_only"],
  ["flokalundur","talknafjordur",200,"geometry_only"],
  ["isafjordur","reykjavik-raudavatn",200,"unsupported"],
  ["isafjordur","selfoss",200,"unsupported"],
  ["isafjordur","hella",200,"unsupported"],
  ["isafjordur","egilsstadir",200,"unsupported"],
  ["isafjordur","seydisfjordur",200,"unsupported"],
  ["isafjordur","budardalur",200,"geometry_only"],
  ["isafjordur","flokalundur",200,"geometry_only"],
  ["isafjordur","isafjordur",200,"same_place"],
  ["isafjordur","holmavik",200,"geometry_only"],
  ["isafjordur","patreksfjordur",200,"geometry_only"],
  ["isafjordur","talknafjordur",200,"geometry_only"],
  ["holmavik","reykjavik-raudavatn",200,"unsupported"],
  ["holmavik","selfoss",200,"unsupported"],
  ["holmavik","hella",200,"unsupported"],
  ["holmavik","egilsstadir",200,"unsupported"],
  ["holmavik","seydisfjordur",200,"unsupported"],
  ["holmavik","budardalur",200,"geometry_only"],
  ["holmavik","flokalundur",200,"geometry_only"],
  ["holmavik","isafjordur",200,"geometry_only"],
  ["holmavik","holmavik",200,"same_place"],
  ["holmavik","patreksfjordur",200,"geometry_only"],
  ["holmavik","talknafjordur",200,"geometry_only"],
  ["patreksfjordur","reykjavik-raudavatn",200,"unsupported"],
  ["patreksfjordur","selfoss",200,"unsupported"],
  ["patreksfjordur","hella",200,"unsupported"],
  ["patreksfjordur","egilsstadir",200,"unsupported"],
  ["patreksfjordur","seydisfjordur",200,"unsupported"],
  ["patreksfjordur","budardalur",200,"geometry_only"],
  ["patreksfjordur","flokalundur",200,"geometry_only"],
  ["patreksfjordur","isafjordur",200,"geometry_only"],
  ["patreksfjordur","holmavik",200,"geometry_only"],
  ["patreksfjordur","patreksfjordur",200,"same_place"],
  ["patreksfjordur","talknafjordur",200,"geometry_only"],
  ["talknafjordur","reykjavik-raudavatn",200,"unsupported"],
  ["talknafjordur","selfoss",200,"unsupported"],
  ["talknafjordur","hella",200,"unsupported"],
  ["talknafjordur","egilsstadir",200,"unsupported"],
  ["talknafjordur","seydisfjordur",200,"unsupported"],
  ["talknafjordur","budardalur",200,"geometry_only"],
  ["talknafjordur","flokalundur",200,"geometry_only"],
  ["talknafjordur","isafjordur",200,"geometry_only"],
  ["talknafjordur","holmavik",200,"geometry_only"],
  ["talknafjordur","patreksfjordur",200,"geometry_only"],
  ["talknafjordur","talknafjordur",200,"same_place"],
];

function fixturePayloadFor(from, to, httpStatus, marker) {
  if (httpStatus === 400) return { error: marker, field: "from" };
  return { schemaVersion: 1, tier: 0, status: marker, from, to };
}

describe("P7(c) — all 121 ordered pairs classify to exactly one of the four UI statuses", () => {
  it("counts match the approved contract exactly: 50 geometry_only, 11 same_place, 50 unsupported(200), 10 unknown_place_id(400)", () => {
    expect(CONTRACT_121).toHaveLength(121);
    const counts = { geometry_only: 0, same_place: 0, unsupported: 0, unknown_place_id: 0 };
    for (const [, , , marker] of CONTRACT_121) counts[marker] += 1;
    expect(counts).toEqual({ geometry_only: 50, same_place: 11, unsupported: 50, unknown_place_id: 10 });
  });

  it("every pair classifies to exactly one of GEOMETRY_ONLY/SAME_PLACE/NO_ROUTE, never ERROR, for a well-formed response", () => {
    for (const [from, to, httpStatus, marker] of CONTRACT_121) {
      const payload = fixturePayloadFor(from, to, httpStatus, marker);
      const result = classifyWinterRouteGeometryResponse({ httpStatus, payload, applied: { from, to, option: null } });
      if (marker === "geometry_only") expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.GEOMETRY_ONLY);
      else if (marker === "same_place") expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.SAME_PLACE);
      else expect(result.outcome).toBe(WINTER_ROUTE_OUTCOME.NO_ROUTE); // unsupported or unknown_place_id
      expect(result.outcome).not.toBe(WINTER_ROUTE_OUTCOME.ERROR);
    }
  });
});
