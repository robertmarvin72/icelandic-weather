// api/_lib/winterRoute/ringOptionsGeometryCrossCheck.test.js
// Ticket #503 ring-options, P6(a)/P9(a) -- "próf sem kallar geometry-
// handler og ber geometryId/lengthM/slices saman við gagnasvarið fyrir
// allar 8, ekki resolver við sjálfan sig". Calls the REAL, unmodified
// api/winter-route-geometry.js handler for all 8 variants and compares
// its own geometryId/lengthM/idButurIds against
// resolveRingOptionGeometry's own output.
// @vitest-environment node
import { describe, it, expect } from "vitest";
import geometryHandler from "../../winter-route-geometry.js";
import { resolveRingOptionGeometry } from "./ringOptionsRoute.js";

function makeReq(from, to, option) { return { method: "GET", query: { from, to, option } }; }
function makeRes() {
  return {
    statusCode: 200, headers: {}, body: null,
    setHeader(n, v) { this.headers[n] = v; },
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
    end() { return this; },
  };
}

const PAIRS = [["reykjavik-raudavatn", "selfoss"], ["reykjavik-raudavatn", "hella"]];

describe("ring-options resolver vs. the real /api/winter-route-geometry handler (not resolver-vs-itself)", () => {
  for (const [a, b] of PAIRS) {
    for (const option of ["south", "north"]) {
      for (const [from, to] of [[a, b], [b, a]]) {
        it(`${from}->${to} option=${option}: geometryId/lengthM/idButurIds match the real geometry handler exactly`, async () => {
          const res = makeRes();
          await geometryHandler(makeReq(from, to, option), res);
          expect(res.body.status).toBe("geometry_only");
          expect(res.body.selectedOption).toBe(option);

          const geo = resolveRingOptionGeometry(from, to, option);
          expect(geo.ok).toBe(true);
          expect(geo.geometryId).toBe(res.body.geometryId);
          expect(geo.lengthM).toBeCloseTo(res.body.lengthM, 6);
          expect(geo.datasetVersion).toBe(res.body.datasetVersion);
          expect(geo.policyVersion).toBe(res.body.policyVersion);

          const realIdButurIds = [];
          for (const s of res.body.slices) {
            if (s.idbutur == null) continue;
            if (!realIdButurIds.includes(s.idbutur)) realIdButurIds.push(s.idbutur);
          }
          expect(geo.idButurList).toEqual(realIdButurIds);
        });
      }
    }
  }
});
