// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Scoped dependency mock (approved-prompt-v1.md): wraps the REAL
// loadGeometryDataset in a spy that calls through by default, so every
// "real" test below still exercises the real runtime JSON end-to-end.
// Only the one loader-failure test overrides it, for that single call.
vi.mock("./_lib/winterRoute/geometryDataset.js", async () => {
  const actual = await vi.importActual("./_lib/winterRoute/geometryDataset.js");
  return { ...actual, loadGeometryDataset: vi.fn(actual.loadGeometryDataset) };
});

import handler from "./winter-route-geometry.js";
import { loadGeometryDataset } from "./_lib/winterRoute/geometryDataset.js";

function makeReq(method, query) {
  const req = { method, url: "/api/winter-route-geometry" };
  if (query !== undefined) req.query = query;
  return req;
}

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

beforeEach(() => {
  // clearAllMocks only resets recorded calls/results, not the default
  // implementation set in the vi.mock() factory above (the real
  // loadGeometryDataset) -- so every test still calls through to the real
  // dataset unless it queues its own mockImplementationOnce.
  vi.clearAllMocks();
});

// Independent re-derivation of total length from the response's own
// `coordinates` -- never trusting the handler's own reported lengthM.
function sumCoordinates(coordinates) {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += Math.hypot(coordinates[i].x - coordinates[i - 1].x, coordinates[i].y - coordinates[i - 1].y);
  }
  return total;
}

describe("GET /api/winter-route-geometry -- method/param validation", () => {
  it("rejects non-GET methods with 405", async () => {
    const res = makeRes();
    await handler(makeReq("POST", { from: "selfoss", to: "hella" }), res);
    expect(res.statusCode).toBe(405);
  });

  it("always sets Cache-Control: no-store", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), res);
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("400 on missing from/to (no req.query at all)", async () => {
    const res = makeRes();
    await handler(makeReq("GET"), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("missing_param");
  });

  it("400 on empty from", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "", to: "hella" }), res);
    expect(res.statusCode).toBe(400);
  });

  it("400 on repeated param (array) for to", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: ["hella", "selfoss"] }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("to");
  });

  it("400 on a totally unknown/prototype-name place id, never reflecting the input", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "atlantis" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("unknown_place_id");
    expect(JSON.stringify(res.body)).not.toContain("atlantis");
  });

  it("a value reachable only via the prototype chain (not an own key) is treated as missing, not as a valid param", async () => {
    const res = makeRes();
    // "to" is readable as query.to (inherited), but is NOT query's own
    // property -- the own-key guard must reject it as missing, never
    // silently accept an inherited/polluted value.
    const query = Object.create({ to: "hella" });
    query.from = "selfoss";
    expect(query.to).toBe("hella"); // sanity: it IS readable via normal property access
    await handler(makeReq("GET", query), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe("to");
    expect(res.body.error).toBe("missing_param");
  });
});

describe("GET /api/winter-route-geometry -- known-but-unmapped places (51/56)", () => {
  it("200 unsupported/endpoint_mapping_unavailable for a known place outside the 5-pilot mapping", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("unsupported");
    expect(res.body.reason).toBe("endpoint_mapping_unavailable");
    expect(res.body.drivingAccess).toBe("UNVERIFIED");
    expect(res.body.from).toBe("selfoss");
    expect(res.body.to).toBe("keflavik");
  });

  it("thorshofn (the other coordinate-gap place) is also unsupported/endpoint_mapping_unavailable, not a 400", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "thorshofn", to: "selfoss" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("unsupported");
    expect(res.body.reason).toBe("endpoint_mapping_unavailable");
  });

  it("P6: same known-but-unmapped id (keflavik->keflavik) is unsupported, never a fabricated same_place", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "keflavik", to: "keflavik" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("unsupported");
    expect(res.body.reason).toBe("endpoint_mapping_unavailable");
  });
});

describe("GET /api/winter-route-geometry -- real end-to-end integration (real handler + real loader/runtime JSON + real composer)", () => {
  it("R1->Selfoss: geometry_only, pinned endpoints, literal continuous coordinates independently re-summable", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body.crs).toBe("EPSG:3057");
    expect(body.tier).toBe(2);
    expect(body.lengthM).toBeCloseTo(44984.77037809235, 3);
    expect(body.coordinates[0]).toEqual({ x: 365522.0175, y: 402772.762, z: 0 });
    expect(body.coordinates[body.coordinates.length - 1]).toEqual({ x: 401739.85, y: 383119.047, z: 16.877 });
    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 6);
    expect(typeof body.geometryId).toBe("string");
    expect(body.lengthNote).toMatch(/tier-2/i);
  });

  it("R1->Hella: geometry_only with the same literal-coordinate contract (now a directed MVP pilot pair, raudavatn-hella-mvp -- no longer the plain undirected 80,630.948 m)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("geometry_only");
    expect(res.body.mode).toBe("directed");
    expect(res.body.lengthM).toBeCloseTo(80681.31193354058, 6);
    expect(sumCoordinates(res.body.coordinates)).toBeCloseTo(res.body.lengthM, 6);
  });

  it("E1->S2 (road93): geometry_only, never continues past S2 toward the ferry pier even though the pilot dataset includes it", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("geometry_only");
    expect(res.body.lengthM).toBeCloseTo(24148.860880942146, 6);
    expect(res.body.slices.every((s) => ![2892, 2891].includes(s.sourceId))).toBe(true);
    expect(sumCoordinates(res.body.coordinates)).toBeCloseTo(res.body.lengthM, 6);
  });

  it("S2->E1 (road93 mvp, reverse direction): same real undirected chain reversed -- same length, no 2892/2891, no mode/policyVersion/estimatedConnectorLengthM, stable geometryId that differs from the eastbound one", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "seydisfjordur", to: "egilsstadir" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("policyVersion");
    expect(body).not.toHaveProperty("estimatedConnectorLengthM");
    expect(body.lengthM).toBeCloseTo(24148.860880942146, 6);
    expect(body.slices.map((s) => `${s.sourceId}${s.direction === "reverse" ? " r" : ""}`)).toEqual(["2894 r", "3409 r", "3410 r", "2344 r"]);
    expect(body.slices.every((s) => ![2892, 2891].includes(s.sourceId))).toBe(true);
    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 6);
    expect(body.coordinates[0]).toMatchObject({ x: 732875.674, y: 538207.0762 });
    expect(body.coordinates[body.coordinates.length - 1]).toMatchObject({ x: 715153.74, y: 536679.93 });
    expect(body.geometryId).toBe("3f67cfaa1ab61fd70a7dccfaf0ebbac0");

    // Stable at the same input, different from the forward direction.
    const res2 = makeRes();
    await handler(makeReq("GET", { from: "seydisfjordur", to: "egilsstadir" }), res2);
    expect(res2.body.geometryId).toBe(body.geometryId);

    const forward = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur" }), forward);
    expect(forward.body.geometryId).toBe("e79c0f7e8237d6c2ecd910771b8b8bda");
    expect(forward.body.geometryId).not.toBe(body.geometryId);
    expect(forward.body.lengthM).toBeCloseTo(body.lengthM, 9);
  });

  it("R1->E1: the real long cross-corridor pair (~615 km, ~120 slices) -- P1: all 5 endpoints share one connected component, so this is geometry_only, not disconnected_graph", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "egilsstadir" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("geometry_only");
    expect(res.body.lengthM).toBeCloseTo(615333.3403813917, 3);
    expect(res.body.slices.length).toBeGreaterThan(100);
    expect(sumCoordinates(res.body.coordinates)).toBeCloseTo(res.body.lengthM, 3);
    // P2: veghluti/name pass-through present on every slice, never used for routing.
    for (const s of res.body.slices) {
      expect(s).toHaveProperty("veghluti");
      expect(s).toHaveProperty("name");
    }
  });

  it("same_place for a mapped id queried against itself", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "selfoss" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("same_place");
    expect(res.body.lengthM).toBe(0);
    expect(res.body.slices).toEqual([]);
    expect(res.body.coordinates).toEqual([{ x: 401739.85, y: 383119.047, z: null }]);
  });

  it("reverse query (to/from swapped) is an equal-length, independently-recomputed mirror path", async () => {
    const forwardRes = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), forwardRes);
    const reverseRes = makeRes();
    await handler(makeReq("GET", { from: "hella", to: "selfoss" }), reverseRes);
    expect(reverseRes.body.status).toBe("geometry_only");
    expect(reverseRes.body.lengthM).toBeCloseTo(forwardRes.body.lengthM, 9);
    expect(reverseRes.body.from).toBe("hella");
    expect(reverseRes.body.to).toBe("selfoss");
    expect(reverseRes.body.coordinates[0]).toEqual(forwardRes.body.coordinates[forwardRes.body.coordinates.length - 1]);
  });

  it("running the identical query twice returns the identical geometryId (stable identity, not a per-call random/timestamp id)", async () => {
    const res1 = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), res1);
    const res2 = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), res2);
    expect(res2.body.geometryId).toBe(res1.body.geometryId);
    expect(res2.body.datasetVersion).toBe(res1.body.datasetVersion);
  });

  it("line-order permutation of the real dataset does not change the resolved geometryId", async () => {
    const real = actualLoadRealDataset();
    const shuffled = { ...real, lines: [...real.lines].reverse() };

    const res1 = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), res1);

    loadGeometryDataset.mockImplementationOnce(() => shuffled);
    const res2 = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), res2);

    expect(res2.body.geometryId).toBe(res1.body.geometryId);
    expect(res2.body.lengthM).toBeCloseTo(res1.body.lengthM, 9);
  });
});

describe("GET /api/winter-route-geometry -- Rauðavatn<->Selfoss/Hella MVP pilot (real handler, real pilot policy+connector)", () => {
  it("eastbound (reykjavik-raudavatn -> selfoss): geometry_only, directed, same length as the plain undirected path, connector not needed", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.mode).toBe("directed");
    expect(typeof body.policyVersion).toBe("string");
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body.lengthM).toBeCloseTo(44984.77037809235, 6);
    expect(body.estimatedConnectorLengthM).toBe(0);
    expect(body.slices.some((s) => s.estimated)).toBe(false);
    expect(body.slices.every((s) => s.directionBasis === "OWNER_APPROVED_MVP_ASSUMPTION")).toBe(true);
  });

  it("westbound (selfoss -> reykjavik-raudavatn): geometry_only, uses the one estimated connector exactly once, length matches the independent sandbox cross-check (45,101.810 m / 9 slices)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "reykjavik-raudavatn" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.mode).toBe("directed");
    expect(body.lengthM).toBeCloseTo(45101.80950260295, 3);
    expect(body.slices).toHaveLength(9);
    const connectorSlices = body.slices.filter((s) => s.estimated === true);
    expect(connectorSlices).toHaveLength(1);
    expect(connectorSlices[0].lengthM).toBeCloseTo(44.214687625802, 6);
    expect(body.estimatedConnectorLengthM).toBeCloseTo(44.214687625802, 6);
    // Only the one real connector slice is ever marked estimated.
    expect(body.slices.filter((s) => s.estimated).length).toBe(1);
  });

  it("both pilot directions return a continuous coordinate chain pinned at the real endpoints, independently re-summable to the reported lengthM", async () => {
    for (const [from, to] of [["reykjavik-raudavatn", "selfoss"], ["selfoss", "reykjavik-raudavatn"]]) {
      const res = makeRes();
      await handler(makeReq("GET", { from, to }), res);
      const body = res.body;
      expect(body.coordinates[0]).toMatchObject(
        from === "reykjavik-raudavatn" ? { x: 365522.0175, y: 402772.762 } : { x: 401739.85, y: 383119.047 }
      );
      let total = 0;
      for (let i = 1; i < body.coordinates.length; i++) {
        total += Math.hypot(body.coordinates[i].x - body.coordinates[i - 1].x, body.coordinates[i].y - body.coordinates[i - 1].y);
      }
      expect(total).toBeCloseTo(body.lengthM, 3);
    }
  });

  it("eastbound (reykjavik-raudavatn -> hella): geometry_only, directed, same length as the plain undirected path, connector not needed (raudavatn-hella-mvp)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.mode).toBe("directed");
    expect(body.lengthM).toBeCloseTo(80681.31193354058, 6);
    expect(body.slices).toHaveLength(21);
    expect(body.estimatedConnectorLengthM).toBe(0);
    expect(body.slices.some((s) => s.estimated)).toBe(false);
  });

  it("westbound (hella -> reykjavik-raudavatn): geometry_only, uses the one estimated connector exactly once, length matches the independent sandbox cross-check (80,747.986952 m / 19 slices)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "hella", to: "reykjavik-raudavatn" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.mode).toBe("directed");
    expect(body.lengthM).toBeCloseTo(80747.98695209449, 6);
    expect(body.slices).toHaveLength(19);
    const connectorSlices = body.slices.filter((s) => s.estimated === true);
    expect(connectorSlices).toHaveLength(1);
    expect(body.estimatedConnectorLengthM).toBeCloseTo(44.214687625802, 6);
  });

  it("P3 (documented, not fixed): the eastbound Hella result's final 3591 slice runs ~3.2 m against ring 16641's own drawn direction right at the pinned endpoint -- real, visible, not corrected by moving the endpoint/policy/connector", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella" }), res);
    const slice3591 = res.body.slices.find((s) => s.sourceId === 3591);
    expect(slice3591).toMatchObject({ fromIndex: 3, toIndex: 0, direction: "reverse" });
  });

  it("P1/P4: an unrelated pair (Selfoss<->Hella) stays on the plain OLD undirected contract -- no mode/policyVersion/estimatedConnectorLengthM, unchanged length/geometryId, NOT the 35,696.542 m the same MVP policy would give it if wrongly included", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("policyVersion");
    expect(body).not.toHaveProperty("estimatedConnectorLengthM");
    expect(body.slices.every((s) => !("estimated" in s))).toBe(true);
    expect(body.lengthM).toBeCloseTo(35646.17744949154, 6);
    expect(body.geometryId).toBe("1e5ec24e068b90156c1c9b0ec1c00d39");
  });

  it("P5: a genuinely unrelated pair (egilsstadir<->seydisfjordur) is untouched by this MVP policy existing", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur" }), res);
    expect(res.body).not.toHaveProperty("mode");
    expect(res.body.lengthM).toBeCloseTo(24148.860880942146, 6);
  });
});

describe("GET /api/winter-route-geometry -- Rauðavatn<->Selfoss north/south ring options (real handler, real north-option legs)", () => {
  it("no option: defaults to the shorter real measured option (south), in both directions", async () => {
    const res1 = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), res1);
    expect(res1.body.selectedOption).toBe("south");
    expect(res1.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "reykjavik-raudavatn" }), res2);
    expect(res2.body.selectedOption).toBe("south");
    expect(res2.body.lengthM).toBeCloseTo(45101.80950260295, 6);
  });

  it("option=south is unchanged from before this round -- same geometry/policyVersion/lengths as the Hella-round pilot", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "south" }), res);
    const body = res.body;
    expect(body.selectedOption).toBe("south");
    expect(body.mode).toBe("directed");
    expect(body.policyVersion).toBe("raudavatn-selfoss-mvp-v1-a73f8191242a0938");
    expect(body.lengthM).toBeCloseTo(44984.77037809235, 6);
  });

  it("option=north, R1->Selfoss: the real long ring route, matches the independently re-run reference total exactly, with the expected via markers", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "north" }), res);
    const body = res.body;
    expect(res.statusCode).toBe(200);
    expect(body.status).toBe("geometry_only");
    expect(body.selectedOption).toBe("north");
    expect(body.mode).toBe("directed");
    expect(body.lengthM).toBeCloseTo(1236038.3222104264, 3);
    expect(body.estimatedConnectorLengthM).toBe(0); // forward direction never needs the Hádegismóar connectors
    const northOption = body.options.find((o) => o.id === "north");
    expect(northOption.via).toEqual(["Borgarnes", "Akureyri", "Egilsstaðir", "Vík"]);
    expect(body.coordinates[0]).toMatchObject({ x: 365522.0175, y: 402772.762 });
    expect(body.coordinates[body.coordinates.length - 1]).toMatchObject({ x: 401739.85, y: 383119.047 });
    let total = 0;
    for (let i = 1; i < body.coordinates.length; i++) total += Math.hypot(body.coordinates[i].x - body.coordinates[i - 1].x, body.coordinates[i].y - body.coordinates[i - 1].y);
    expect(total).toBeCloseTo(body.lengthM, 3);
  });

  it("option=north, Selfoss->R1: uses the two Hádegismóar connectors exactly once each, matches the independently re-run reference total exactly", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "reykjavik-raudavatn", option: "north" }), res);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.selectedOption).toBe("north");
    expect(body.lengthM).toBeCloseTo(1236223.9920674523, 3);
    expect(body.estimatedConnectorLengthM).toBeCloseTo(13.369177697886641, 6);
    const estimatedSlices = body.slices.filter((s) => s.estimated);
    expect(estimatedSlices).toHaveLength(2);
  });

  it("both options are described with real measured lengths, routeIds distinct per option AND per direction, and stable across repeated calls", async () => {
    const res1 = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), res1);
    const res2 = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), res2);
    expect(res2.body.options).toEqual(res1.body.options);

    const res3 = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "reykjavik-raudavatn" }), res3);
    const [south1, north1] = res1.body.options;
    const [south3, north3] = res3.body.options;
    expect(south1.routeId).not.toBe(south3.routeId); // different direction -> different routeId
    expect(north1.routeId).not.toBe(north3.routeId);
    expect(south1.routeId).not.toBe(north1.routeId); // different option -> different routeId
    expect(south1.lengthM).toBeLessThan(north1.lengthM);
  });

  it("unknown/repeated option value -> 400, never echoing the raw value", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "east" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("invalid_option");
    expect(JSON.stringify(res.body)).not.toContain("east");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: ["north", "south"] }), res2);
    expect(res2.statusCode).toBe(400);
  });

  it("option is ignored (old plain contract, no 400, even for an invalid value) for Selfoss<->Hella -- a pair that shares a place with the pilot but is itself outside the four-pair pilot", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella", option: "north" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty("mode");
    expect(res.body).not.toHaveProperty("selectedOption");
    expect(res.body).not.toHaveProperty("options");
    expect(res.body.lengthM).toBeCloseTo(35646.17744949154, 6);
  });

  it("P1/P5 regression (moved from the earlier 'Hella is unaffected' test, since Hella is now itself a ring-options pair): Selfoss<->Hella and Egilsstaðir<->Seyðisfjörður stay completely unaffected, including an invalid option value, which is still ignored (200, never 400) for them", async () => {
    for (const option of [undefined, "north", "bogus"]) {
      const query = { from: "selfoss", to: "hella", ...(option !== undefined ? { option } : {}) };
      const res = makeRes();
      await handler(makeReq("GET", query), res);
      expect(res.statusCode).toBe(200);
      expect(res.body).not.toHaveProperty("selectedOption");
      expect(res.body.lengthM).toBeCloseTo(35646.17744949154, 6);
      expect(res.body.geometryId).toBe("1e5ec24e068b90156c1c9b0ec1c00d39");

      const res2 = makeRes();
      await handler(makeReq("GET", { from: "hella", to: "selfoss", ...(option !== undefined ? { option } : {}) }), res2);
      expect(res2.statusCode).toBe(200);
      expect(res2.body).not.toHaveProperty("selectedOption");
      expect(res2.body.geometryId).toBe("6c8979a3345eb95c1a582277835834c1");
    }

    const resRoad93 = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur" }), resRoad93);
    expect(resRoad93.body).not.toHaveProperty("selectedOption");
    expect(resRoad93.body.lengthM).toBeCloseTo(24148.860880942146, 6);
  });
});

describe("GET /api/winter-route-geometry -- Rauðavatn<->Hella north/south ring options (hella-ring-options-mvp, a deliberate contract change: Hella previously ignored `option`)", () => {
  it("south Rauðavatn<->Hella is byte-for-byte unchanged from the raudavatn-hella-mvp round -- only the new selectedOption/options envelope fields are added", async () => {
    const res1 = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "south" }), res1);
    expect(res1.body.selectedOption).toBe("south");
    expect(res1.body.lengthM).toBeCloseTo(80681.31193354058, 6);
    expect(res1.body.slices).toHaveLength(21);
    expect(res1.body.geometryId).toBe("a7137730003351c3d1b81cd43755b632");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "hella", to: "reykjavik-raudavatn", option: "south" }), res2);
    expect(res2.body.selectedOption).toBe("south");
    expect(res2.body.lengthM).toBeCloseTo(80747.98695209449, 6);
    expect(res2.body.slices).toHaveLength(19);
    expect(res2.body.geometryId).toBe("e77ac0a9b47bd56d804a038da72878e3");
  });

  it("default (no option) for Hella is also south, the real shorter measured option, in both directions", async () => {
    const res1 = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella" }), res1);
    expect(res1.body.selectedOption).toBe("south");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "hella", to: "reykjavik-raudavatn" }), res2);
    expect(res2.body.selectedOption).toBe("south");
  });

  it("option=north, R1->Hella: the real long ring route all the way to Hella (not a south-then-back-via-Selfoss detour), matching the independently re-run reference exactly", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "north" }), res);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.selectedOption).toBe("north");
    expect(body.lengthM).toBeCloseTo(1200394.6507663461, 3);
    expect(body.slices).toHaveLength(197);
    expect(body.estimatedConnectorLengthM).toBe(0);
    const northOption = body.options.find((o) => o.id === "north");
    expect(northOption.via).toEqual(["Borgarnes", "Akureyri", "Egilsstaðir", "Vík"]);
    expect(body.coordinates[0]).toMatchObject({ x: 365522.0175, y: 402772.762 });
    expect(body.coordinates[body.coordinates.length - 1]).toMatchObject({ x: 430972.1263, y: 370845.6043 });
    let total = 0;
    for (let i = 1; i < body.coordinates.length; i++) total += Math.hypot(body.coordinates[i].x - body.coordinates[i - 1].x, body.coordinates[i].y - body.coordinates[i - 1].y);
    expect(total).toBeCloseTo(body.lengthM, 3);
    // P5: no south-pilot-only sourceId, and the Akureyri reverse quirk does NOT occur on this direction.
    expect(body.slices.some((s) => [2138, 2135, 36807].includes(s.sourceId))).toBe(false);
  });

  it("option=north, Hella->R1: uses the two Hádegismóar connectors exactly once each, matching the independently re-run reference exactly", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "hella", to: "reykjavik-raudavatn", option: "north" }), res);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.selectedOption).toBe("north");
    expect(body.lengthM).toBeCloseTo(1200533.8282369296, 3);
    expect(body.slices).toHaveLength(199);
    expect(body.estimatedConnectorLengthM).toBeCloseTo(13.369177697886641, 6);
    expect(body.slices.filter((s) => s.estimated)).toHaveLength(2);
  });

  it("P5: the Hella-endpoint-stub reverse edge (~3.19 m) occurs ONLY on south R1->Hella, never on either north case; the Akureyri 32964 reverse edge occurs ONLY on north Hella->R1, never on north R1->Hella", async () => {
    const southR1Hella = await (async () => { const res = makeRes(); await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "south" }), res); return res.body; })();
    const northR1Hella = await (async () => { const res = makeRes(); await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "north" }), res); return res.body; })();
    const northHellaR1 = await (async () => { const res = makeRes(); await handler(makeReq("GET", { from: "hella", to: "reykjavik-raudavatn", option: "north" }), res); return res.body; })();

    const slice3591South = southR1Hella.slices.find((s) => s.sourceId === 3591);
    expect(slice3591South).toMatchObject({ fromIndex: 3, toIndex: 0, direction: "reverse" });

    // North R1->Hella's own final approach to 3591 is a different, shorter
    // sub-span that never includes the specific reverse edge against ring
    // 16641 (fromIndex 1->0 only, not 2->1->0).
    const slice3591North = northR1Hella.slices.find((s) => s.sourceId === 3591);
    expect(slice3591North).toMatchObject({ fromIndex: 1, toIndex: 0, direction: "reverse" });
    expect(slice3591North.lengthM).toBeCloseTo(1.253002705508261, 6);

    const slice32964NorthR1Hella = northR1Hella.slices.find((s) => s.sourceId === 32964);
    expect(slice32964NorthR1Hella.direction).toBe("forward"); // never reverse on this direction
    const slice32964NorthHellaR1 = northHellaR1.slices.find((s) => s.sourceId === 32964);
    expect(slice32964NorthHellaR1).toMatchObject({ fromIndex: 3, toIndex: 0, direction: "reverse" });
  });

  it("P4: exact full routeId values for all eight pair/option/direction combinations -- Selfoss's own values preserved verbatim, Hella gets its own distinct prefix, all stable/unique", async () => {
    async function getOptions(from, to) {
      const res = makeRes();
      await handler(makeReq("GET", { from, to }), res);
      return res.body.options;
    }
    const [selfossEastSouth, selfossEastNorth] = await getOptions("reykjavik-raudavatn", "selfoss");
    const [selfossWestSouth, selfossWestNorth] = await getOptions("selfoss", "reykjavik-raudavatn");
    const [hellaEastSouth, hellaEastNorth] = await getOptions("reykjavik-raudavatn", "hella");
    const [hellaWestSouth, hellaWestNorth] = await getOptions("hella", "reykjavik-raudavatn");

    expect(selfossEastSouth.routeId).toBe("raudavatn-selfoss-south-215a1805457eb42ad937c6d8217f10aa");
    expect(selfossEastNorth.routeId).toBe("raudavatn-selfoss-north-d0e0996e7500b868364007e1cad20046");
    expect(selfossWestSouth.routeId).toBe("raudavatn-selfoss-south-d657c07e56020a367aa54f240ae42ad7");
    expect(selfossWestNorth.routeId).toBe("raudavatn-selfoss-north-323c5b6f4a97b6a7ecc468964142e10c");
    expect(hellaEastSouth.routeId).toBe("raudavatn-hella-south-a7137730003351c3d1b81cd43755b632");
    expect(hellaEastNorth.routeId).toBe("raudavatn-hella-north-a8704618cc1a4325e9933b9079c841d9");
    expect(hellaWestSouth.routeId).toBe("raudavatn-hella-south-e77ac0a9b47bd56d804a038da72878e3");
    expect(hellaWestNorth.routeId).toBe("raudavatn-hella-north-fc32a8502ed9efb56bbed33cd07da20c");

    const allIds = [selfossEastSouth, selfossEastNorth, selfossWestSouth, selfossWestNorth, hellaEastSouth, hellaEastNorth, hellaWestSouth, hellaWestNorth].map((o) => o.routeId);
    expect(new Set(allIds).size).toBe(allIds.length); // all eight unique

    // Stable across repeated calls.
    const [hellaEastSouth2] = await getOptions("reykjavik-raudavatn", "hella");
    expect(hellaEastSouth2.routeId).toBe(hellaEastSouth.routeId);

    // via fixed per P4: south always [], north always the same four names, on BOTH pairs.
    expect(selfossEastSouth.via).toEqual([]);
    expect(hellaEastSouth.via).toEqual([]);
    expect(selfossEastNorth.via).toEqual(["Borgarnes", "Akureyri", "Egilsstaðir", "Vík"]);
    expect(hellaEastNorth.via).toEqual(["Borgarnes", "Akureyri", "Egilsstaðir", "Vík"]);
  });

  it("option=south/north explicit selection works for Hella exactly like Selfoss; unknown/empty/array/repeated option -> 400, never echoed", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "north" }), res);
    expect(res.body.selectedOption).toBe("north");

    for (const badOption of ["east", "", "SOUTH", ["north", "south"]]) {
      const resBad = makeRes();
      await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: badOption }), resBad);
      expect(resBad.statusCode).toBe(400);
      expect(resBad.body.error).toBe("invalid_option");
      expect(resBad.body.field).toBe("option");
    }
  });
});

describe("GET /api/winter-route-geometry -- Westfjords entry (junction-1-60-baulan <-> budardalur, westfjords-entry-mvp, real handler/real region dataset)", () => {
  it("junction -> budardalur: geometry_only, tier 0, the real 7-sourceId chain in order, pinned endpoints, continuous coordinates, real measured length", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.tier).toBe(0);
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body).not.toHaveProperty("mode"); // undirected, unlike the Rauðavatn pilot
    expect(body).not.toHaveProperty("datasetVersion"); // a separate region, not the main pilot dataset
    expect(typeof body.regionVersion).toBe("string");
    expect(body.slices.map((s) => s.sourceId)).toEqual([3544, 3590, 2649, 3753, 2648, 2647, 2769]);
    expect(body.lengthM).toBeCloseTo(42155.20284701861, 2);
    expect(body.idButurIds).toEqual([904070037, 905030037, 805030037]);
    expect(body.via).toEqual(["Brattabrekka", "Breiðabólstaður"]);
    expect(body.lengthNote).toMatch(/tier-0/i);
    expect(body.accessApproach.ownerCoordinateOffsetM).toBeCloseTo(160.147617850274, 3);

    let total = 0;
    for (let i = 1; i < body.coordinates.length; i++) total += Math.hypot(body.coordinates[i].x - body.coordinates[i - 1].x, body.coordinates[i].y - body.coordinates[i - 1].y);
    expect(total).toBeCloseTo(body.lengthM, 3);
  });

  it("budardalur -> junction: reverse direction, real reversed chain, same length, different geometryId", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "junction-1-60-baulan" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.slices.map((s) => s.sourceId)).toEqual([2769, 2647, 2648, 3753, 2649, 3590, 3544]);
    expect(body.lengthM).toBeCloseTo(42155.20284701861, 2);

    const forward = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), forward);
    expect(body.geometryId).not.toBe(forward.body.geometryId);
  });

  it("the junction id is recognized ONLY paired with budardalur -- any other combination still gets the plain 400 unknown_place_id, never a 200", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "hella" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("unknown_place_id");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "junction-1-60-baulan" }), res2);
    expect(res2.statusCode).toBe(400);
  });

  it("P6: every other pair's contract is completely unaffected by this region existing -- Rauðavatn<->Selfoss/Hella, Selfoss<->Hella, vegur 93, same_place, and the unsupported 51/56 places", async () => {
    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resUnmapped = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), resUnmapped);
    expect(resUnmapped.statusCode).toBe(200);
    expect(resUnmapped.body.status).toBe("unsupported");
    expect(resUnmapped.body.reason).toBe("endpoint_mapping_unavailable");

    const resUnknown = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "atlantis" }), resUnknown);
    expect(resUnknown.statusCode).toBe(400);
    expect(resUnknown.body.error).toBe("unknown_place_id");
  });
});

describe("GET /api/winter-route-geometry -- Westfjords Búðardalur<->Flókalundur (westfjords-flokalundur-mvp, real handler/real region dataset)", () => {
  it("budardalur -> flokalundur: geometry_only, tier 0, the real 20-sourceId chain (connector included) in order, real measured length, estimated connector surfaced", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.tier).toBe(0);
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("datasetVersion");
    expect(typeof body.regionVersion).toBe("string");

    const expectedChain = [2769, 3197, 3247, 3462, 40961, 3460, 3771, 3755, 3754, 3750, 49925, -4, 50566, 3678, 3677, 3675, 3672, 3651, 3869, 3868, 3648];
    expect(body.slices.map((s) => s.sourceId)).toEqual(expectedChain);
    expect(body.slices.filter((s) => s.estimated)).toHaveLength(1);
    expect(body.slices.find((s) => s.estimated).sourceId).toBe(-4);

    expect(body.lengthM).toBeCloseTo(172474.22, 0);
    expect(body.estimatedConnectorLengthM).toBeCloseTo(0.005, 2);
    expect(body.idButurIds).toEqual([805030037, 905070037, 905080037, 805090037, 905110037, 905130037, 560250037, 560260037, 805140037, 905150037, 905160037, 905170037]);
    expect(body.lengthNote).toMatch(/tier-0/i);
    expect(body.accessApproach.ownerCoordinateOffsetM).toBeCloseTo(51.300370295420294, 3);

    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 3);
  });

  it("flokalundur -> budardalur: reverse direction, real reversed chain, same length, different geometryId", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "budardalur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.lengthM).toBeCloseTo(172474.22, 0);

    const forwardRes = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur" }), forwardRes);
    expect(body.slices.map((s) => s.sourceId)).toEqual([...forwardRes.body.slices.map((s) => s.sourceId)].reverse());
    expect(body.geometryId).not.toBe(forwardRes.body.geometryId);
  });

  it("flokalundur is recognized ONLY paired with budardalur -- any other combination still gets the plain 400 unknown_place_id, never a 200 -- EXCEPT flokalundur<->flokalundur, which became same_place in the closure-implementation round (ticket #501 step 2, B1)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "hella" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("unknown_place_id");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "flokalundur" }), res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.status).toBe("same_place");

    const res3 = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "junction-1-60-baulan" }), res3);
    expect(res3.statusCode).toBe(400);
    expect(res3.body.error).toBe("unknown_place_id");
  });

  it("P8: the existing junction-1-60-baulan<->budardalur pair's own response is byte-identical/unchanged by this new region existing -- same length, slice count, and geometryId as before this round", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), res);
    expect(res.body.lengthM).toBeCloseTo(42155.20284701861, 6);
    expect(res.body.slices).toHaveLength(7);
    expect(res.body.geometryId).toBe("742bbdeda4fa8e8a43497d8baf81ca78");

    const rev = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "junction-1-60-baulan" }), rev);
    expect(rev.body.geometryId).toBe("559dde16d36824995bbe9cfe143b1896");
  });

  it("P8: every other pair's contract is completely unaffected by this second region existing -- Rauðavatn<->Selfoss/Hella, vegur 93, same_place, and the unsupported 51/56 places", async () => {
    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resUnmapped = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), resUnmapped);
    expect(resUnmapped.statusCode).toBe(200);
    expect(resUnmapped.body.status).toBe("unsupported");
    expect(resUnmapped.body.reason).toBe("endpoint_mapping_unavailable");

    const resUnknown = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "atlantis" }), resUnknown);
    expect(resUnknown.statusCode).toBe(400);
    expect(resUnknown.body.error).toBe("unknown_place_id");
  });
});

describe("GET /api/winter-route-geometry -- Westfjords Flókalundur<->Ísafjörður (westfjords-isafjordur-mvp, real handler/real region dataset)", () => {
  it("flokalundur -> isafjordur: geometry_only, tier 0, the real 18-sourceId chain in order (no connector), real measured length, roundabout caveat surfaced", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "isafjordur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.tier).toBe(0);
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("datasetVersion");
    expect(typeof body.regionVersion).toBe("string");

    const expectedChain = [3648, 3009, 3008, 2870, 38085, 38087, 38088, 2994, 3003, 2767, 2993, 2297, 2890, 2618, 2600, 3835, 3833, 3834];
    expect(body.slices.map((s) => s.sourceId)).toEqual(expectedChain);
    expect(body.slices.some((s) => s.estimated)).toBe(false); // no connector in this round

    expect(body.lengthM).toBeCloseTo(87618.55, 0);
    expect(body.idButurIds).toEqual([905170037, 660350037, 905310037, 906010037, 906720037, 806030037, 906040037, 906070037, 906080037, 664020037, 906700037, 806110037, 906120037]);
    expect(body.lengthNote).toMatch(/tier-0/i);
    expect(body.lengthNote).toMatch(/roundabout/i);
    expect(body.via).toContain("Dýrafjarðargöng");
    expect(body.accessApproach.ownerCoordinateOffsetM).toBeCloseTo(164.61838967158116, 3);

    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 3);
  });

  it("isafjordur -> flokalundur: reverse direction, real reversed chain, same length, different geometryId", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "flokalundur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.lengthM).toBeCloseTo(87618.55, 0);

    const forwardRes = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "isafjordur" }), forwardRes);
    expect(body.slices.map((s) => s.sourceId)).toEqual([...forwardRes.body.slices.map((s) => s.sourceId)].reverse());
    expect(body.geometryId).not.toBe(forwardRes.body.geometryId);
  });

  it("flokalundur<->isafjordur is the only new pair recognized -- flokalundur with anything else (including hella) still gets 400 unknown_place_id", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "hella" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("unknown_place_id");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "junction-1-60-baulan" }), res2);
    expect(res2.statusCode).toBe(400);
  });

  it("isafjordur keeps its existing contract with every pair outside the closure-implementation round's own six supported ids -- 200 unsupported endpoint_mapping_unavailable, never a 400; isafjordur<->budardalur and isafjordur<->isafjordur became geometry_only/same_place in that later round (ticket #501 step 2, B1/B2)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "budardalur" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("geometry_only");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "hella" }), res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.reason).toBe("endpoint_mapping_unavailable");

    const res3 = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "isafjordur" }), res3);
    expect(res3.statusCode).toBe(200);
    expect(res3.body.reason).toBe("endpoint_mapping_unavailable");

    const res4 = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "isafjordur" }), res4);
    expect(res4.statusCode).toBe(200);
    expect(res4.body.status).toBe("same_place");
  });

  it("P7: the existing flokalundur<->budardalur and junction-1-60-baulan<->budardalur pairs' own responses are byte-identical/unchanged by this third region existing", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur" }), res);
    expect(res.body.lengthM).toBeCloseTo(172474.2228360156, 6);
    expect(res.body.slices).toHaveLength(21);
    expect(res.body.geometryId).toBe("9d3e8ed90702ba8c1ddd42da6b77967d");
    expect(res.body.regionVersion).toBe("2f68aa481848357b");

    const rev = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "budardalur" }), rev);
    expect(rev.body.geometryId).toBe("751dbdae1921b182d2f595a78c737ecb");

    const entry = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), entry);
    expect(entry.body.lengthM).toBeCloseTo(42155.20284701861, 6);
    expect(entry.body.geometryId).toBe("742bbdeda4fa8e8a43497d8baf81ca78");
  });

  it("P7: every other pair's contract is completely unaffected by this third region existing -- Rauðavatn<->Selfoss/Hella, vegur 93, same_place, and the unsupported 51/56 places", async () => {
    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resUnmapped = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), resUnmapped);
    expect(resUnmapped.statusCode).toBe(200);
    expect(resUnmapped.body.status).toBe("unsupported");
    expect(resUnmapped.body.reason).toBe("endpoint_mapping_unavailable");

    const resUnknown = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "atlantis" }), resUnknown);
    expect(resUnknown.statusCode).toBe(400);
    expect(resUnknown.body.error).toBe("unknown_place_id");
  });
});

describe("GET /api/winter-route-geometry -- Westfjords Ísafjörður<->Hólmavík (westfjords-holmavik-mvp, real handler/real region dataset)", () => {
  it("isafjordur -> holmavik: geometry_only, tier 0, the real 26-sourceId chain in order (no connector), real measured length, roundabout caveat and via name-trap handled", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.tier).toBe(0);
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("datasetVersion");
    expect(typeof body.regionVersion).toBe("string");

    const expectedChain = [3834, 3833, 3830, 3392, 3298, 3535, 3627, 3629, 3609, 3244, 3218, 3217, 3216, 3220, 3194, 3148, 3195, 3626, 3605, 3419, 3418, 3415, 53466, 3370, 3347, 3883];
    expect(body.slices.map((s) => s.sourceId)).toEqual(expectedChain);
    expect(body.slices.some((s) => s.estimated)).toBe(false); // no connector in this round

    expect(body.lengthM).toBeCloseTo(223136.99, 0);
    expect(body.idButurIds).toEqual([906120037, 906140037, 906150037, 906160037, 906170037, 907070037, 907050037, 761220037, 907040037]);
    expect(body.lengthNote).toMatch(/tier-0/i);
    expect(body.lengthNote).toMatch(/roundabout/i);
    expect(body.via).toContain("Súðavík");
    expect(body.via).not.toContain("Ísafjörður");
    expect(body.accessApproach.ownerCoordinateOffsetM).toBeCloseTo(437.31993395679643, 3);

    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 3);
  });

  it("holmavik -> isafjordur: reverse direction, real reversed chain, same length, different geometryId", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "isafjordur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.lengthM).toBeCloseTo(223136.99, 0);

    const forwardRes = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik" }), forwardRes);
    expect(body.slices.map((s) => s.sourceId)).toEqual([...forwardRes.body.slices.map((s) => s.sourceId)].reverse());
    expect(body.geometryId).not.toBe(forwardRes.body.geometryId);
  });

  it("holmavik with an id outside the 56-list/flokalundur/junction-* set still gets 400 unknown_place_id -- holmavik<->flokalundur became geometry_only (F-H) in the closure-implementation round (ticket #501 step 2), so it is no longer the example used here", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "atlantis" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("unknown_place_id");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "junction-1-60-baulan" }), res2);
    expect(res2.statusCode).toBe(400);
  });

  it("holmavik and isafjordur keep their existing contract with every pair outside the closure-implementation round's own six supported ids -- 200 unsupported endpoint_mapping_unavailable, never a 400; holmavik<->budardalur and holmavik<->holmavik became geometry_only/same_place in that later round (ticket #501 step 2, B1/B2)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "budardalur" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("geometry_only");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "hella" }), res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.reason).toBe("endpoint_mapping_unavailable");

    const res3 = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "holmavik" }), res3);
    expect(res3.statusCode).toBe(200);
    expect(res3.body.status).toBe("same_place");

    const res4 = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "holmavik" }), res4);
    expect(res4.statusCode).toBe(200);
    expect(res4.body.reason).toBe("endpoint_mapping_unavailable");
  });

  it("P8: the existing flokalundur<->isafjordur, flokalundur<->budardalur, and junction-1-60-baulan<->budardalur pairs' own responses are byte-identical/unchanged by this fourth region existing", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "isafjordur" }), res);
    expect(res.body.lengthM).toBeCloseTo(87618.54830414167, 6);
    expect(res.body.slices).toHaveLength(18);
    expect(res.body.geometryId).toBe("8b97e2e43a594e5c9b5efc24b82d6736");
    expect(res.body.regionVersion).toBe("06fca99f301d1444");

    const rev = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "flokalundur" }), rev);
    expect(rev.body.geometryId).toBe("0eebee66c0e5303de512b9f643fcc75a");

    const flkBud = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur" }), flkBud);
    expect(flkBud.body.lengthM).toBeCloseTo(172474.2228360156, 6);
    expect(flkBud.body.geometryId).toBe("9d3e8ed90702ba8c1ddd42da6b77967d");

    const entry = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), entry);
    expect(entry.body.lengthM).toBeCloseTo(42155.20284701861, 6);
    expect(entry.body.geometryId).toBe("742bbdeda4fa8e8a43497d8baf81ca78");
  });

  it("P8: every other pair's contract is completely unaffected by this fourth region existing -- Rauðavatn<->Selfoss/Hella, vegur 93, same_place, and the unsupported 51/56 places", async () => {
    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resUnmapped = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), resUnmapped);
    expect(resUnmapped.statusCode).toBe(200);
    expect(resUnmapped.body.status).toBe("unsupported");
    expect(resUnmapped.body.reason).toBe("endpoint_mapping_unavailable");

    const resUnknown = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "atlantis" }), resUnknown);
    expect(resUnknown.statusCode).toBe(400);
    expect(resUnknown.body.error).toBe("unknown_place_id");
  });
});

describe("GET /api/winter-route-geometry -- Westfjords Hólmavík<->junction-1-68-stadarskali (westfjords-road68-mvp, real handler/real region dataset)", () => {
  it("junction-1-68-stadarskali -> holmavik: geometry_only, tier 0, the real 12-sourceId chain in order (no connector), real measured length, no owner offset on the junction side", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "junction-1-68-stadarskali", to: "holmavik" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.tier).toBe(0);
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("datasetVersion");
    expect(typeof body.regionVersion).toBe("string");

    const expectedChain = [1796, 1720, 1717, 1444, 3278, 24002, 3411, 2427, 2773, 2690, 3611, 3883];
    expect(body.slices.map((s) => s.sourceId)).toEqual(expectedChain);
    expect(body.slices.some((s) => s.estimated)).toBe(false); // no connector in this round

    expect(body.lengthM).toBeCloseTo(110073.97, 0);
    expect(body.idButurIds).toEqual([907350037, 907010037, 907020037, 907030037, 707040037, 907040037]);
    expect(body.lengthNote).toMatch(/tier-0/i);
    expect(body.via).toContain("Innstrandavegur");
    expect(body.via).not.toContain("Laxárdalsheiði");
    // the real response's own owner offset is Hólmavík's, not the junction's
    expect(body.accessApproach.ownerCoordinateOffsetM).toBeCloseTo(437.31993395679643, 3);

    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 3);
  });

  it("holmavik -> junction-1-68-stadarskali: reverse direction, real reversed chain, same length, different geometryId", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "junction-1-68-stadarskali" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.lengthM).toBeCloseTo(110073.97, 0);

    const forwardRes = makeRes();
    await handler(makeReq("GET", { from: "junction-1-68-stadarskali", to: "holmavik" }), forwardRes);
    expect(body.slices.map((s) => s.sourceId)).toEqual([...forwardRes.body.slices.map((s) => s.sourceId)].reverse());
    expect(body.geometryId).not.toBe(forwardRes.body.geometryId);
  });

  it("junction-1-68-stadarskali is recognized ONLY paired with holmavik -- any other combination (including isafjordur, junction-1-60-baulan, budardalur, itself) still gets 400 unknown_place_id", async () => {
    for (const to of ["isafjordur", "junction-1-60-baulan", "budardalur", "junction-1-68-stadarskali", "flokalundur"]) {
      const res = makeRes();
      await handler(makeReq("GET", { from: "junction-1-68-stadarskali", to }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("unknown_place_id");
    }
  });

  it("holmavik<->flokalundur and holmavik<->budardalur both became geometry_only in the later closure-implementation round (ticket #501 step 2, B2) -- this road68 round's own pair is additive only and unaffected", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "flokalundur" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("geometry_only");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "budardalur" }), res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.status).toBe("geometry_only");
  });

  it("P8: the existing isafjordur<->holmavik, flokalundur<->isafjordur, flokalundur<->budardalur, and junction-1-60-baulan<->budardalur pairs' own responses are byte-identical/unchanged by this fifth region existing", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik" }), res);
    expect(res.body.lengthM).toBeCloseTo(223136.98949144362, 6);
    expect(res.body.slices).toHaveLength(26);
    expect(res.body.geometryId).toBe("2d47312feaa4fa8aa674c7af85616461");
    expect(res.body.regionVersion).toBe("adfc38ce4897744c");

    const rev = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "isafjordur" }), rev);
    expect(rev.body.geometryId).toBe("ffe6847001f2be1ed57d85a874d2c48a");

    const flkIsa = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "isafjordur" }), flkIsa);
    expect(flkIsa.body.lengthM).toBeCloseTo(87618.54830414167, 6);
    expect(flkIsa.body.geometryId).toBe("8b97e2e43a594e5c9b5efc24b82d6736");

    const flkBud = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur" }), flkBud);
    expect(flkBud.body.lengthM).toBeCloseTo(172474.2228360156, 6);
    expect(flkBud.body.geometryId).toBe("9d3e8ed90702ba8c1ddd42da6b77967d");

    const entry = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), entry);
    expect(entry.body.lengthM).toBeCloseTo(42155.20284701861, 6);
    expect(entry.body.geometryId).toBe("742bbdeda4fa8e8a43497d8baf81ca78");
  });

  it("P8: every other pair's contract is completely unaffected by this fifth region existing -- Rauðavatn<->Selfoss/Hella, Egilsstaðir<->Seyðisfjörður, vegur 93, same_place, and the unsupported 51/56 places", async () => {
    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resEgils = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur" }), resEgils);
    expect(resEgils.body.lengthM).toBeCloseTo(24148.8609, 1);

    const resUnmapped = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), resUnmapped);
    expect(resUnmapped.statusCode).toBe(200);
    expect(resUnmapped.body.status).toBe("unsupported");
    expect(resUnmapped.body.reason).toBe("endpoint_mapping_unavailable");

    const resUnknown = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "atlantis" }), resUnknown);
    expect(resUnknown.statusCode).toBe(400);
    expect(resUnknown.body.error).toBe("unknown_place_id");
  });
});

describe("GET /api/winter-route-geometry -- Westfjords Hólmavík<->junction-60-61-throskuldar (westfjords-throskuldar-mvp, real handler/real region dataset)", () => {
  it("junction-60-61-throskuldar -> holmavik: geometry_only, tier 0, the real 4-sourceId chain in order (no connector), first slice is FULL 3321, real measured length, via exactly [\"Þröskuldar\"]", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "junction-60-61-throskuldar", to: "holmavik" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.tier).toBe(0);
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("datasetVersion");
    expect(typeof body.regionVersion).toBe("string");

    const expectedChain = [3321, 3324, 3611, 3883];
    expect(body.slices.map((s) => s.sourceId)).toEqual(expectedChain);
    expect(body.slices[0].fromIndex).toBe(0);
    expect(body.slices.some((s) => s.estimated)).toBe(false); // no connector in this round

    expect(body.lengthM).toBeCloseTo(30555.32, 0);
    expect(body.idButurIds).toEqual([907000037, 707040037, 907040037]);
    expect(body.lengthNote).toMatch(/tier-0/i);
    expect(body.via).toEqual(["Þröskuldar"]);
    // the real response's own owner offset is Hólmavík's, not the junction's
    expect(body.accessApproach.ownerCoordinateOffsetM).toBeCloseTo(437.31993395679643, 3);

    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 3);
  });

  it("holmavik -> junction-60-61-throskuldar: reverse direction, real reversed chain, same length, different geometryId", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "junction-60-61-throskuldar" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.lengthM).toBeCloseTo(30555.32, 0);

    const forwardRes = makeRes();
    await handler(makeReq("GET", { from: "junction-60-61-throskuldar", to: "holmavik" }), forwardRes);
    expect(body.slices.map((s) => s.sourceId)).toEqual([...forwardRes.body.slices.map((s) => s.sourceId)].reverse());
    expect(body.geometryId).not.toBe(forwardRes.body.geometryId);
  });

  it("junction-60-61-throskuldar is recognized ONLY paired with holmavik -- any other combination (including junction-1-68-stadarskali, isafjordur, junction-1-60-baulan, budardalur, itself) still gets 400 unknown_place_id", async () => {
    for (const to of ["junction-1-68-stadarskali", "isafjordur", "junction-1-60-baulan", "budardalur", "junction-60-61-throskuldar", "flokalundur"]) {
      const res = makeRes();
      await handler(makeReq("GET", { from: "junction-60-61-throskuldar", to }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("unknown_place_id");
    }
  });

  it("holmavik<->flokalundur and holmavik<->budardalur both became geometry_only in the later closure-implementation round (ticket #501 step 2, B2) -- this throskuldar round's own pair is additive only and unaffected", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "flokalundur" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("geometry_only");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "budardalur" }), res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.status).toBe("geometry_only");
  });

  it("P8: the existing junction-1-68-stadarskali<->holmavik, isafjordur<->holmavik, flokalundur<->isafjordur, flokalundur<->budardalur, and junction-1-60-baulan<->budardalur pairs' own responses are byte-identical/unchanged by this sixth region existing", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "junction-1-68-stadarskali", to: "holmavik" }), res);
    expect(res.body.lengthM).toBeCloseTo(110073.97484054108, 6);
    expect(res.body.slices).toHaveLength(12);
    expect(res.body.geometryId).toBe("124d9ec93d3906a17c9b2d91d2cb0a73");
    expect(res.body.regionVersion).toBe("c1e9cd24a2aaa02c");

    const rev = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "junction-1-68-stadarskali" }), rev);
    expect(rev.body.geometryId).toBe("f1933968efffd50843055023053ef516");

    const isaHol = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik" }), isaHol);
    expect(isaHol.body.lengthM).toBeCloseTo(223136.98949144362, 6);
    expect(isaHol.body.geometryId).toBe("2d47312feaa4fa8aa674c7af85616461");

    const flkIsa = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "isafjordur" }), flkIsa);
    expect(flkIsa.body.lengthM).toBeCloseTo(87618.54830414167, 6);
    expect(flkIsa.body.geometryId).toBe("8b97e2e43a594e5c9b5efc24b82d6736");

    const flkBud = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur" }), flkBud);
    expect(flkBud.body.lengthM).toBeCloseTo(172474.2228360156, 6);
    expect(flkBud.body.geometryId).toBe("9d3e8ed90702ba8c1ddd42da6b77967d");

    const entry = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), entry);
    expect(entry.body.lengthM).toBeCloseTo(42155.20284701861, 6);
    expect(entry.body.geometryId).toBe("742bbdeda4fa8e8a43497d8baf81ca78");
  });

  it("P8: every other pair's contract is completely unaffected by this sixth region existing -- Rauðavatn<->Selfoss/Hella, Egilsstaðir<->Seyðisfjörður, vegur 93, same_place, and the unsupported 51/56 places", async () => {
    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resEgils = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur" }), resEgils);
    expect(resEgils.body.lengthM).toBeCloseTo(24148.8609, 1);

    const resUnmapped = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), resUnmapped);
    expect(resUnmapped.statusCode).toBe(200);
    expect(resUnmapped.body.status).toBe("unsupported");
    expect(resUnmapped.body.reason).toBe("endpoint_mapping_unavailable");

    const resUnknown = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "atlantis" }), resUnknown);
    expect(resUnknown.statusCode).toBe(400);
    expect(resUnknown.body.error).toBe("unknown_place_id");
  });
});

describe("GET /api/winter-route-geometry -- Westfjords Flókalundur<->Patreksfjörður (westfjords-patreksfjordur-mvp, real handler/real region dataset)", () => {
  it("flokalundur -> patreksfjordur: geometry_only, tier 0, the real 8-sourceId chain in order (one estimated connector), real measured length, via exactly [\"Brjánslækur\",\"Kleifaheiði\"]", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "patreksfjordur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.tier).toBe(0);
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("datasetVersion");
    expect(typeof body.regionVersion).toBe("string");

    const expectedChain = [3648, 3698, 3339, 3334, 3332, 2271, -5, 53127];
    expect(body.slices.map((s) => s.sourceId)).toEqual(expectedChain);
    expect(body.slices.filter((s) => s.estimated)).toHaveLength(1);
    expect(body.slices.find((s) => s.estimated).sourceId).toBe(-5);

    expect(body.lengthM).toBeCloseTo(61400.1, 0);
    expect(body.estimatedConnectorLengthM).toBeCloseTo(4.39, 1);
    expect(body.idButurIds).toEqual([905170037, 905180037, 905190037, 905200037, 905250037, 562070037]);
    expect(body.lengthNote).toMatch(/tier-0/i);
    expect(body.lengthNote).toMatch(/estimated/i);
    expect(body.via).toEqual(["Brjánslækur", "Kleifaheiði"]);
    expect(body.accessApproach.ownerCoordinateOffsetM).toBeCloseTo(8.775919534139193, 3);

    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 3);
  });

  it("patreksfjordur -> flokalundur: reverse direction, real reversed chain, same length, different geometryId", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "flokalundur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.lengthM).toBeCloseTo(61400.1, 0);

    const forwardRes = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "patreksfjordur" }), forwardRes);
    expect(body.slices.map((s) => s.sourceId)).toEqual([...forwardRes.body.slices.map((s) => s.sourceId)].reverse());
    expect(body.geometryId).not.toBe(forwardRes.body.geometryId);
  });

  it("flokalundur<->patreksfjordur is additive only -- flokalundur with anything other than budardalur/isafjordur/patreksfjordur/holmavik/talknafjordur still gets 400 unknown_place_id (flokalundur<->holmavik became geometry_only in the later closure-implementation round, ticket #501 step 2, B2)", async () => {
    for (const to of ["hella", "junction-1-60-baulan", "junction-60-61-throskuldar"]) {
      const res = makeRes();
      await handler(makeReq("GET", { from: "flokalundur", to }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("unknown_place_id");
    }
  });

  it("patreksfjordur<->budardalur and patreksfjordur<->patreksfjordur became geometry_only/same_place in the later closure-implementation round (ticket #501 step 2, B1/B2) -- this round's own pair is additive only and unaffected", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "budardalur" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("geometry_only");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "patreksfjordur" }), res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.status).toBe("same_place");
  });

  it("P9: the existing six westfjords pairs' own responses are byte-identical/unchanged by this eighth region existing", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "isafjordur" }), res);
    expect(res.body.lengthM).toBeCloseTo(87618.54830414167, 6);
    expect(res.body.geometryId).toBe("8b97e2e43a594e5c9b5efc24b82d6736");

    const flkBud = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur" }), flkBud);
    expect(flkBud.body.lengthM).toBeCloseTo(172474.2228360156, 6);
    expect(flkBud.body.geometryId).toBe("9d3e8ed90702ba8c1ddd42da6b77967d");

    const entry = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), entry);
    expect(entry.body.geometryId).toBe("742bbdeda4fa8e8a43497d8baf81ca78");

    const isaHol = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik" }), isaHol);
    expect(isaHol.body.lengthM).toBeCloseTo(223136.98949144362, 6);
    expect(isaHol.body.geometryId).toBe("2d47312feaa4fa8aa674c7af85616461");

    const road68 = makeRes();
    await handler(makeReq("GET", { from: "junction-1-68-stadarskali", to: "holmavik" }), road68);
    expect(road68.body.lengthM).toBeCloseTo(110073.97484054108, 6);
    expect(road68.body.geometryId).toBe("124d9ec93d3906a17c9b2d91d2cb0a73");

    const throskuldar = makeRes();
    await handler(makeReq("GET", { from: "junction-60-61-throskuldar", to: "holmavik" }), throskuldar);
    expect(throskuldar.body.lengthM).toBeCloseTo(30555.315457176555, 6);
    expect(throskuldar.body.geometryId).toBe("e72b5d8434200eb4976b94ad63d32426");
  });

  it("P9: every other pair's contract is completely unaffected by this eighth region existing -- Rauðavatn<->Selfoss/Hella, Egilsstaðir<->Seyðisfjörður, vegur 93, same_place, and the unsupported 51/56 places", async () => {
    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resEgils = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur" }), resEgils);
    expect(resEgils.body.lengthM).toBeCloseTo(24148.8609, 1);

    const resUnmapped = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), resUnmapped);
    expect(resUnmapped.statusCode).toBe(200);
    expect(resUnmapped.body.status).toBe("unsupported");
    expect(resUnmapped.body.reason).toBe("endpoint_mapping_unavailable");

    const resUnknown = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "atlantis" }), resUnknown);
    expect(resUnknown.statusCode).toBe(400);
    expect(resUnknown.body.error).toBe("unknown_place_id");
  });
});

describe("GET /api/winter-route-geometry -- Westfjords Patreksfjörður<->Tálknafjörður (westfjords-talknafjordur-mvp, real handler/real region dataset)", () => {
  it("patreksfjordur -> talknafjordur: geometry_only, tier 0, the real 4-sourceId chain in order (reused connector), real measured length, routeEndsShortOfOwnerCoordinate flag, via exactly [\"Miklidalur\"]", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "talknafjordur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.tier).toBe(0);
    expect(body.drivingAccess).toBe("UNVERIFIED");
    expect(body).not.toHaveProperty("mode");
    expect(body).not.toHaveProperty("datasetVersion");
    expect(typeof body.regionVersion).toBe("string");

    const expectedChain = [53127, -5, 3361, 2889];
    expect(body.slices.map((s) => s.sourceId)).toEqual(expectedChain);
    expect(body.slices.filter((s) => s.estimated)).toHaveLength(1);
    expect(body.slices.find((s) => s.estimated).sourceId).toBe(-5);

    expect(body.lengthM).toBeCloseTo(17114.94, 0);
    expect(body.estimatedConnectorLengthM).toBeCloseTo(4.39, 1);
    expect(body.idButurIds).toEqual([562070037, 905260037, 506170037]);
    expect(body.lengthNote).toMatch(/tier-0/i);
    expect(body.lengthNote).toMatch(/town continuation/i);
    expect(body.lengthNote).toMatch(/the start of 3361/i);
    expect(body.lengthNote).not.toMatch(/between the retained lines 2271 and 53127/i);
    expect(body.lengthNote).toMatch(/4\.39 m estimated connector/i);
    expect(body.lengthNote).toMatch(/does not reach/i);
    expect(body.lengthNote).toMatch(/Bíldudalur.*Hálfdán.*ferry.*out of scope/i);
    expect(body.lengthNote).toMatch(/no claim about winter closure/i);
    expect(body.via).toEqual(["Miklidalur"]);
    expect(body.accessApproach.patreksfjordur.ownerCoordinateOffsetM).toBeCloseTo(8.775919534139193, 3);
    expect(body.accessApproach.talknafjordur.ownerCoordinateOffsetM).toBeCloseTo(995.4294251530142, 1);
    expect(body.accessApproach.talknafjordur.routeEndsShortOfOwnerCoordinate).toBe(true);

    expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 3);
  });

  it("talknafjordur -> patreksfjordur: reverse direction, real reversed chain, same length, different geometryId", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "talknafjordur", to: "patreksfjordur" }), res);
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body.status).toBe("geometry_only");
    expect(body.lengthM).toBeCloseTo(17114.94, 0);

    const forwardRes = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "talknafjordur" }), forwardRes);
    expect(body.slices.map((s) => s.sourceId)).toEqual([...forwardRes.body.slices.map((s) => s.sourceId)].reverse());
    expect(body.geometryId).not.toBe(forwardRes.body.geometryId);
  });

  it("talknafjordur/patreksfjordur keep the existing gate with every pair outside the closure-implementation round's own six supported ids -- 200 unsupported for genuinely unmapped ids, 400 for junction-* with talknafjordur; isafjordur/budardalur/holmavik/flokalundur/talknafjordur-itself and patreksfjordur-itself all became geometry_only/same_place in that later round (ticket #501 step 2, B1/B2), so this round's own pair remains additive only and unaffected", async () => {
    for (const to of ["bildudalur", "hella"]) {
      const res = makeRes();
      await handler(makeReq("GET", { from: "talknafjordur", to }), res);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("unsupported");
      expect(res.body.reason).toBe("endpoint_mapping_unavailable");
    }

    for (const to of ["isafjordur", "budardalur", "holmavik"]) {
      const res = makeRes();
      await handler(makeReq("GET", { from: "talknafjordur", to }), res);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("geometry_only");
    }

    const resSame = makeRes();
    await handler(makeReq("GET", { from: "talknafjordur", to: "talknafjordur" }), resSame);
    expect(resSame.statusCode).toBe(200);
    expect(resSame.body.status).toBe("same_place");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "patreksfjordur" }), res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.status).toBe("same_place");

    const resFlk = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "talknafjordur" }), resFlk);
    expect(resFlk.statusCode).toBe(200);
    expect(resFlk.body.status).toBe("geometry_only");

    for (const from of ["junction-1-60-baulan", "junction-1-68-stadarskali", "junction-60-61-throskuldar"]) {
      const res3 = makeRes();
      await handler(makeReq("GET", { from, to: "talknafjordur" }), res3);
      expect(res3.statusCode).toBe(400);
      expect(res3.body.error).toBe("unknown_place_id");
    }
  });

  it("P9: the existing eight westfjords pairs' own responses are byte-identical/unchanged by this tenth region existing", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "patreksfjordur" }), res);
    expect(res.body.lengthM).toBeCloseTo(61400.098965121026, 6);
    expect(res.body.geometryId).toBe("c4312f35bf25f0bc3394423f20927a6a");
    expect(res.body.regionVersion).toBe("1c09dfb6f6fde51c");

    const rev = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "flokalundur" }), rev);
    expect(rev.body.geometryId).toBe("b326156f58b6cf5a91c70c01fc9ffe57");

    const flkIsa = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "isafjordur" }), flkIsa);
    expect(flkIsa.body.lengthM).toBeCloseTo(87618.54830414167, 6);
    expect(flkIsa.body.geometryId).toBe("8b97e2e43a594e5c9b5efc24b82d6736");

    const flkBud = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur" }), flkBud);
    expect(flkBud.body.geometryId).toBe("9d3e8ed90702ba8c1ddd42da6b77967d");

    const entry = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), entry);
    expect(entry.body.geometryId).toBe("742bbdeda4fa8e8a43497d8baf81ca78");

    const isaHol = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik" }), isaHol);
    expect(isaHol.body.geometryId).toBe("2d47312feaa4fa8aa674c7af85616461");

    const road68 = makeRes();
    await handler(makeReq("GET", { from: "junction-1-68-stadarskali", to: "holmavik" }), road68);
    expect(road68.body.geometryId).toBe("124d9ec93d3906a17c9b2d91d2cb0a73");

    const throskuldar = makeRes();
    await handler(makeReq("GET", { from: "junction-60-61-throskuldar", to: "holmavik" }), throskuldar);
    expect(throskuldar.body.geometryId).toBe("e72b5d8434200eb4976b94ad63d32426");
  });

  it("P9: every other pair's contract is completely unaffected by this tenth region existing -- Rauðavatn<->Selfoss/Hella, Egilsstaðir<->Seyðisfjörður, vegur 93, same_place, and the unsupported 51/56 places", async () => {
    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resEgils = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur" }), resEgils);
    expect(resEgils.body.lengthM).toBeCloseTo(24148.8609, 1);

    const resUnmapped = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "keflavik" }), resUnmapped);
    expect(resUnmapped.statusCode).toBe(200);
    expect(resUnmapped.body.status).toBe("unsupported");
    expect(resUnmapped.body.reason).toBe("endpoint_mapping_unavailable");

    const resUnknown = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "atlantis" }), resUnknown);
    expect(resUnknown.statusCode).toBe(400);
    expect(resUnknown.body.error).toBe("unknown_place_id");
  });
});

describe("GET /api/winter-route-geometry -- Westfjords closure-implementation: 10 new cross-leg pairs + 6 same_place endpoints (ticket #501 step 2, real handler/real combined region dataset)", () => {
  const REGION_VERSION = "b93e0334e095cf95";

  // Pinned against a real, independent handler run of this exact production
  // code against the real runtime server_data/westfjords-region-combined.json
  // (gathered via a one-off script, never hand-computed) -- not copied from
  // the approved prompt's own cited sandbox figures without this independent
  // re-verification.
  const PAIR_EXPECTED = {
    "budardalur|holmavik": { lengthM: 78697.77054505677, geometryId: "b19c8443173f07732be3e79e856ad64c", estConn: 0, via: ["Gilsfjörður", "Þröskuldar"] },
    "holmavik|budardalur": { lengthM: 78697.77054505677, geometryId: "1295e077570d89ec6de491efbcf0f029", estConn: 0, via: ["Þröskuldar", "Gilsfjörður"] },
    "budardalur|isafjordur": { lengthM: 260092.77114015716, geometryId: "ef0d7cfdfbcd1d01b014ddb9cd704644", estConn: 0.0050234308413424035, via: ["Gilsfjörður", "Þorskafjörður", "Klettsháls", "Dýrafjarðargöng"] },
    "isafjordur|budardalur": { lengthM: 260092.7711401572, geometryId: "9ececf4d9e5369c2f49780685b480cc9", estConn: 0.0050234308413424035, via: ["Dýrafjarðargöng", "Klettsháls", "Þorskafjörður", "Gilsfjörður"] },
    "budardalur|patreksfjordur": { lengthM: 233874.32180113663, geometryId: "754d7e04760d31cb86c6319079ee8586", estConn: 4.398206058358473, via: ["Gilsfjörður", "Þorskafjörður", "Klettsháls", "Brjánslækur", "Kleifaheiði"] },
    "patreksfjordur|budardalur": { lengthM: 233874.32180113657, geometryId: "be6ec419b0c65ab404cc5ddd998e000b", estConn: 4.398206058358473, via: ["Kleifaheiði", "Brjánslækur", "Klettsháls", "Þorskafjörður", "Gilsfjörður"] },
    "budardalur|talknafjordur": { lengthM: 248219.98974281375, geometryId: "e1010409f490cf77fe0873bf1042f949", estConn: 0.0050234308413424035, via: ["Gilsfjörður", "Þorskafjörður", "Klettsháls", "Brjánslækur", "Kleifaheiði", "Miklidalur"] },
    "talknafjordur|budardalur": { lengthM: 248219.9897428137, geometryId: "c5f2c4a7fd7df5d6166056da76c1a91e", estConn: 0.0050234308413424035, via: ["Miklidalur", "Kleifaheiði", "Brjánslækur", "Klettsháls", "Þorskafjörður", "Gilsfjörður"] },
    "flokalundur|holmavik": { lengthM: 154887.0832053119, geometryId: "23b6db9d3987f9e7e5289ff06a6bd8fb", estConn: 0.0050234308413424035, via: ["Klettsháls", "Þorskafjörður", "Þröskuldar"] },
    "holmavik|flokalundur": { lengthM: 154887.08320531194, geometryId: "89bec6957062abe778afaa09ce5c3858", estConn: 0.0050234308413424035, via: ["Þröskuldar", "Þorskafjörður", "Klettsháls"] },
    "flokalundur|talknafjordur": { lengthM: 75745.76690679816, geometryId: "fcdc9e5001a1f1eaa96e7ced7015f1a0", estConn: 0, via: ["Brjánslækur", "Kleifaheiði", "Miklidalur"] },
    "talknafjordur|flokalundur": { lengthM: 75745.76690679815, geometryId: "7379efa5334290f8faf462793852fc04", estConn: 0, via: ["Miklidalur", "Kleifaheiði", "Brjánslækur"] },
    "isafjordur|patreksfjordur": { lengthM: 148325.1015395726, geometryId: "91304012b7289a6b7fc6a6fe4055e616", estConn: 4.39318262751713, via: ["Dýrafjarðargöng", "Brjánslækur", "Kleifaheiði"] },
    "patreksfjordur|isafjordur": { lengthM: 148325.10153957258, geometryId: "1d495adc73a311ddc3af660f1e9465d4", estConn: 4.39318262751713, via: ["Kleifaheiði", "Brjánslækur", "Dýrafjarðargöng"] },
    "isafjordur|talknafjordur": { lengthM: 162670.76948124974, geometryId: "8b191a7039f81354a4a87ac93c794ad3", estConn: 0, via: ["Dýrafjarðargöng", "Brjánslækur", "Kleifaheiði", "Miklidalur"] },
    "talknafjordur|isafjordur": { lengthM: 162670.7694812497, geometryId: "d39cb96db7ff1a8c7af2d705153ee825", estConn: 0, via: ["Miklidalur", "Kleifaheiði", "Brjánslækur", "Dýrafjarðargöng"] },
    "holmavik|patreksfjordur": { lengthM: 216287.18217043296, geometryId: "68c439488c9df5ea7e23847e26465d98", estConn: 4.398206058358473, via: ["Þröskuldar", "Þorskafjörður", "Klettsháls", "Brjánslækur", "Kleifaheiði"] },
    "patreksfjordur|holmavik": { lengthM: 216287.1821704329, geometryId: "09f59ede944a234479e6de3d2ef778db", estConn: 4.398206058358473, via: ["Kleifaheiði", "Brjánslækur", "Klettsháls", "Þorskafjörður", "Þröskuldar"] },
    "holmavik|talknafjordur": { lengthM: 230632.85011211009, geometryId: "a749a24cace4fcfaa4da1fb2824fe396", estConn: 0.0050234308413424035, via: ["Þröskuldar", "Þorskafjörður", "Klettsháls", "Brjánslækur", "Kleifaheiði", "Miklidalur"] },
    "talknafjordur|holmavik": { lengthM: 230632.85011211003, geometryId: "0c1053496bebb0f328ac0486b07beb50", estConn: 0.0050234308413424035, via: ["Miklidalur", "Kleifaheiði", "Brjánslækur", "Klettsháls", "Þorskafjörður", "Þröskuldar"] },
  };

  for (const [key, expected] of Object.entries(PAIR_EXPECTED)) {
    const [from, to] = key.split("|");
    it(`${from} -> ${to}: geometry_only, tier 0, real pinned length/geometryId/via/estimatedConnectorLengthM, coordinates sum to lengthM`, async () => {
      const res = makeRes();
      await handler(makeReq("GET", { from, to }), res);
      expect(res.statusCode).toBe(200);
      const body = res.body;
      expect(body.status).toBe("geometry_only");
      expect(body.tier).toBe(0);
      expect(body.drivingAccess).toBe("UNVERIFIED");
      expect(body.regionVersion).toBe(REGION_VERSION);
      expect(body.lengthM).toBeCloseTo(expected.lengthM, 3);
      expect(body.geometryId).toBe(expected.geometryId);
      expect(body.estimatedConnectorLengthM).toBeCloseTo(expected.estConn, 6);
      expect(body.via).toEqual(expected.via);
      expect(body.lengthNote).toMatch(/tier-0/i);
      expect(body.lengthNote).toMatch(/no claim about winter closure/i);
      const offsets = { budardalur: 160.1476178502974, flokalundur: 51.30036446804795, isafjordur: 164.61838967158118, holmavik: 437.31993395679643, patreksfjordur: 8.775919534139193, talknafjordur: 995.4294251543986 };
      for (const id of [from, to]) {
        expect(body.accessApproach[id].ownerCoordinateOffsetM).toBeCloseTo(offsets[id], 6);
        if (id === "talknafjordur") expect(body.accessApproach[id].routeEndsShortOfOwnerCoordinate).toBe(true);
      }
      if ([from, to].includes("talknafjordur")) expect(body.lengthNote).toMatch(/town continuation/i);
      else expect(body.lengthNote).not.toMatch(/town continuation/i);
      const roundabout = body.slices.find((s) => s.sourceId === 3834);
      if (roundabout) expect(roundabout.direction).toBe(from === "isafjordur" ? "reverse" : "forward");
      else expect(body.lengthNote).not.toMatch(/roundabout \(3834/);
      expect(body.idButurIds).not.toContain(null);
      expect(body.idButurIds).toEqual(body.slices.map((s) => s.idbutur).filter((id) => id != null).filter((id, i, ids) => i === 0 || id !== ids[i - 1]));
      expect(sumCoordinates(body.coordinates)).toBeCloseTo(body.lengthM, 3);
    });
  }

  it("reverse direction is the exact reverse chain of forward for every one of the 10 pairs, with a different geometryId", async () => {
    const SEEN = new Set();
    for (const key of Object.keys(PAIR_EXPECTED)) {
      const [from, to] = key.split("|");
      const pairKey = [from, to].sort().join("|");
      if (SEEN.has(pairKey)) continue;
      SEEN.add(pairKey);
      const fwd = makeRes();
      await handler(makeReq("GET", { from, to }), fwd);
      const rev = makeRes();
      await handler(makeReq("GET", { from: to, to: from }), rev);
      expect(rev.body.slices.map((s) => s.sourceId)).toEqual([...fwd.body.slices.map((s) => s.sourceId)].reverse());
      expect(rev.body.geometryId).not.toBe(fwd.body.geometryId);
      expect(rev.body.lengthM).toBeCloseTo(fwd.body.lengthM, 3);
    }
  });

  it("budardalur|isafjordur and budardalur|talknafjordur and flokalundur|holmavik and holmavik|talknafjordur all use the ~5mm connector -4 (estimatedConnectorLengthM ~0.005), never the ~4.39m connector -5 alone, in a pair that doesn't reach Patreksfjörður's own approach", async () => {
    for (const [from, to] of [["budardalur", "isafjordur"], ["budardalur", "talknafjordur"], ["flokalundur", "holmavik"], ["holmavik", "talknafjordur"]]) {
      const res = makeRes();
      await handler(makeReq("GET", { from, to }), res);
      expect(res.body.slices.map((s) => s.sourceId)).toContain(-4);
      expect(res.body.slices.map((s) => s.sourceId)).not.toContain(53127);
      expect(res.body.slices.map((s) => s.sourceId)).not.toContain(-5);
    }
  });

  it("budardalur|patreksfjordur and holmavik|patreksfjordur use BOTH connectors (-4 and -5), confirmed by two separate lengthNote sentences and two estimated slices", async () => {
    for (const [from, to] of [["budardalur", "patreksfjordur"], ["holmavik", "patreksfjordur"]]) {
      const res = makeRes();
      await handler(makeReq("GET", { from, to }), res);
      expect(res.body.slices.filter((s) => s.estimated).map((s) => s.sourceId).sort()).toEqual([-5, -4].sort());
      expect(res.body.lengthNote).toMatch(/~5 mm estimated connector \(sourceId -4\)/);
      expect(res.body.lengthNote).toMatch(/~4\.39 m estimated connector \(sourceId -5\)/);
    }
  });

  it("isafjordur|patreksfjordur and isafjordur|talknafjordur never touch sourceId 3648 (Flókalundur's own insertion point is a pure pass-through, not on this leg of the corridor)", async () => {
    for (const to of ["patreksfjordur", "talknafjordur"]) {
      const res = makeRes();
      await handler(makeReq("GET", { from: "isafjordur", to }), res);
      expect(res.body.slices.map((s) => s.sourceId)).not.toContain(3648);
    }
  });

  it("budardalur|holmavik and flokalundur|holmavik use sourceId 3321 (the shared Þröskuldar triple-point line) for the holmavik leg, same as the pre-existing junction-60-61-throskuldar<->holmavik pair's own chain", async () => {
    for (const from of ["budardalur", "flokalundur"]) {
      const res = makeRes();
      await handler(makeReq("GET", { from, to: "holmavik" }), res);
      expect(res.body.slices.map((s) => s.sourceId)).toContain(3321);
    }
  });

  it("isafjordur-involving pairs pass through the 3834 roundabout and the lengthNote reads the real direction for that specific result (forward vs. reverse differ)", async () => {
    const fwd = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "isafjordur" }), fwd);
    const rev = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "budardalur" }), rev);
    expect(fwd.body.slices.map((s) => s.sourceId)).toContain(3834);
    expect(fwd.body.lengthNote).toMatch(/roundabout \(3834, VEGHLUTI 1, undirected\)/);
    expect(rev.body.lengthNote).toMatch(/roundabout \(3834, VEGHLUTI 1, undirected\)/);
  });

  it("junction-* ids are excluded from both the new 10-pair allowlist and same_place -- still 400 unknown_place_id, never a 200, even when paired with a now-supported Westfjords id", async () => {
    for (const [from, to] of [
      ["junction-1-60-baulan", "isafjordur"],
      ["junction-1-60-baulan", "junction-1-60-baulan"],
      ["junction-1-68-stadarskali", "patreksfjordur"],
      ["junction-1-68-stadarskali", "junction-1-68-stadarskali"],
      ["junction-60-61-throskuldar", "talknafjordur"],
      ["junction-60-61-throskuldar", "junction-60-61-throskuldar"],
    ]) {
      const res = makeRes();
      await handler(makeReq("GET", { from, to }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("unknown_place_id");
    }
  });

  const SAME_PLACE_EXPECTED = {
    budardalur: { geometryId: "421e6b5c90f86097aa426f20f9c2be9a", z: 24.473128257522806 },
    flokalundur: { geometryId: "efa809e6597c29f06ef851d3e1772612", z: 0 },
    isafjordur: { geometryId: "4875a5e207794409ef5a916dc1ece821", z: 0 },
    holmavik: { geometryId: "75fa494ddc23aa2545193eb845c65a0b", z: 0 },
    patreksfjordur: { geometryId: "a6ac57df43ab6aea1b935a042a179d0d", z: 0 },
    talknafjordur: { geometryId: "1780ebae635bfffa41fbc0517bd11116", z: 0 },
  };

  for (const [id, expected] of Object.entries(SAME_PLACE_EXPECTED)) {
    it(`${id} -> ${id}: same_place, lengthM 0, real pinned geometryId, single coordinate with the real endpoint's own z`, async () => {
      const res = makeRes();
      await handler(makeReq("GET", { from: id, to: id }), res);
      expect(res.statusCode).toBe(200);
      const body = res.body;
      expect(body.status).toBe("same_place");
      expect(body.tier).toBe(0);
      expect(body.regionVersion).toBe(REGION_VERSION);
      expect(body.lengthM).toBe(0);
      expect(body.geometryId).toBe(expected.geometryId);
      expect(body.via).toEqual([]);
      expect(body.idButurIds).toEqual([]);
      expect(body.slices).toEqual([]);
      expect(body.coordinates).toHaveLength(1);
      expect(body.coordinates[0].z).toBe(expected.z);
      expect(body.accessApproach[id].ownerCoordinateOffsetM).toBeGreaterThan(0);
      expect(body.lengthNote).toMatch(/tier-0/i);
    });
  }

  it("talknafjordur's same_place response flags routeEndsShortOfOwnerCoordinate, same as every talknafjordur pair branch -- the other five same_place responses do not carry that flag", async () => {
    const tal = makeRes();
    await handler(makeReq("GET", { from: "talknafjordur", to: "talknafjordur" }), tal);
    expect(tal.body.accessApproach.talknafjordur.routeEndsShortOfOwnerCoordinate).toBe(true);

    for (const id of ["budardalur", "flokalundur", "isafjordur", "holmavik", "patreksfjordur"]) {
      const res = makeRes();
      await handler(makeReq("GET", { from: id, to: id }), res);
      expect(res.body.accessApproach[id]).not.toHaveProperty("routeEndsShortOfOwnerCoordinate");
    }
  });

  it("the existing eight Westfjords pairs, ring pilot, vegur 93, and the ring-pilot same_place ids remain byte-identical/unaffected by this round's own two new branches existing", async () => {
    const flkIsa = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "isafjordur" }), flkIsa);
    expect(flkIsa.body.lengthM).toBeCloseTo(87618.54830414167, 6);
    expect(flkIsa.body.geometryId).toBe("8b97e2e43a594e5c9b5efc24b82d6736");

    const entry = makeRes();
    await handler(makeReq("GET", { from: "junction-1-60-baulan", to: "budardalur" }), entry);
    expect(entry.body.geometryId).toBe("742bbdeda4fa8e8a43497d8baf81ca78");

    const road68 = makeRes();
    await handler(makeReq("GET", { from: "junction-1-68-stadarskali", to: "holmavik" }), road68);
    expect(road68.body.geometryId).toBe("124d9ec93d3906a17c9b2d91d2cb0a73");

    const throskuldar = makeRes();
    await handler(makeReq("GET", { from: "junction-60-61-throskuldar", to: "holmavik" }), throskuldar);
    expect(throskuldar.body.geometryId).toBe("e72b5d8434200eb4976b94ad63d32426");

    const patTal = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "talknafjordur" }), patTal);
    expect(patTal.body.lengthM).toBeCloseTo(17114.94, 0);

    const resSelfoss = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), resSelfoss);
    expect(resSelfoss.body.lengthM).toBeCloseTo(44984.77037809235, 6);

    const resSelfossSame = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "selfoss" }), resSelfossSame);
    expect(resSelfossSame.body.status).toBe("same_place");
  });
});

function actualLoadRealDataset() {
  // The mock wraps the real implementation, so calling it with no override
  // in place returns the real, unmodified dataset -- used here only to
  // build the shuffled-copy fixture above, never to bypass the mock.
  return loadGeometryDataset();
}

describe("GET /api/winter-route-geometry -- disconnected graph (synthetic injection, not a real pair)", () => {
  it("200 unsupported/disconnected_graph when the (mocked) dataset's two mapped endpoints are not edge-connected", async () => {
    const synthetic = {
      schemaVersion: 1,
      normalizationVersion: 1,
      crs: "EPSG:3057",
      tier: 2,
      datasetVersion: "test-synthetic",
      sources: [],
      lines: [
        { sourceId: 1, idbutur: 100, tier: 2, veghluti: 1, name: "a", vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }], evidenceRef: "synthetic#1" },
        { sourceId: 2, idbutur: 200, tier: 2, veghluti: 1, name: "b", vertices: [{ x: 500, y: 500 }, { x: 510, y: 500 }], evidenceRef: "synthetic#2" },
      ],
      endpoints: {
        selfoss: { x: 0, y: 0, sourceId: 1 },
        hella: { x: 510, y: 500, sourceId: 2 },
      },
    };
    loadGeometryDataset.mockImplementationOnce(() => synthetic);

    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("unsupported");
    expect(res.body.reason).toBe("disconnected_graph");
    expect(res.body.drivingAccess).toBe("UNVERIFIED");
    expect(res.body.from).toBe("selfoss");
    expect(res.body.to).toBe("hella");
  });
});

describe("GET /api/winter-route-geometry -- dataset load failure", () => {
  it("500 when the loader throws (scoped mock, real runtime data untouched)", async () => {
    loadGeometryDataset.mockImplementationOnce(() => {
      throw new Error("simulated dataset load failure");
    });
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella" }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("geometry_dataset_error");
  });
});
