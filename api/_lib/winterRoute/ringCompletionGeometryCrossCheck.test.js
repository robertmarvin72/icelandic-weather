// api/_lib/winterRoute/ringCompletionGeometryCrossCheck.test.js
// Ticket #503 ring-completion, P5/P9(a) -- "próf sem kallar geometry-
// handler og ber geometryId/lengthM/slices saman við gagnasvarið fyrir
// allar 16, ekki resolver við sjálfan sig". Calls the REAL, unmodified
// api/winter-route-geometry.js handler for all 16 directions and compares
// its own geometryId/lengthM/idButurIds against
// resolveRingCompletionGeometry's own output. Exact-reverse assertions
// are allowed here (Jonesy's own sandbox proved all 16 directions are
// genuinely symmetric for this group), unlike the Westfjords modules.
// @vitest-environment node
import { describe, it, expect } from "vitest";
import geometryHandler from "../../winter-route-geometry.js";
import { resolveRingCompletionGeometry } from "./ringCompletionRoute.js";

function makeReq(from, to) { return { method: "GET", query: { from, to } }; }
function makeRes() {
  return {
    statusCode: 200, headers: {}, body: null,
    setHeader(n, v) { this.headers[n] = v; },
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
    end() { return this; },
  };
}

const PAIRS = [
  ["reykjavik-raudavatn", "egilsstadir"], ["reykjavik-raudavatn", "seydisfjordur"],
  ["selfoss", "hella"], ["selfoss", "egilsstadir"], ["selfoss", "seydisfjordur"],
  ["hella", "egilsstadir"], ["hella", "seydisfjordur"], ["egilsstadir", "seydisfjordur"],
];

describe("ring-completion resolver vs. the real /api/winter-route-geometry handler (not resolver-vs-itself)", () => {
  for (const [a, b] of PAIRS) {
    for (const [from, to] of [[a, b], [b, a]]) {
      it(`${from}->${to}: geometryId/lengthM/idButurIds match the real geometry handler exactly, no selectedOption/policyVersion`, async () => {
        const res = makeRes();
        await geometryHandler(makeReq(from, to), res);
        expect(res.body.status).toBe("geometry_only");
        expect(res.body.selectedOption).toBeUndefined();
        expect(res.body.policyVersion).toBeUndefined();
        expect(typeof res.body.datasetVersion).toBe("string");

        const geo = resolveRingCompletionGeometry(from, to);
        expect(geo.ok).toBe(true);
        expect(geo.geometryId).toBe(res.body.geometryId);
        expect(geo.lengthM).toBeCloseTo(res.body.lengthM, 6);
        expect(geo.datasetVersion).toBe(res.body.datasetVersion);

        const realIdButurIds = [];
        for (const s of res.body.slices) {
          if (s.idbutur == null) continue;
          if (!realIdButurIds.includes(s.idbutur)) realIdButurIds.push(s.idbutur);
        }
        expect(geo.idButurList).toEqual(realIdButurIds);
      });
    }
  }

  it("a stray option=north on a generic pair is ignored by the real handler too (same geometryId as without it)", async () => {
    const res1 = makeRes();
    await geometryHandler({ method: "GET", query: { from: "reykjavik-raudavatn", to: "egilsstadir" } }, res1);
    const res2 = makeRes();
    await geometryHandler({ method: "GET", query: { from: "reykjavik-raudavatn", to: "egilsstadir", option: "north" } }, res2);
    expect(res2.body.geometryId).toBe(res1.body.geometryId);
    expect(res2.body.selectedOption).toBeUndefined();
  });
});
