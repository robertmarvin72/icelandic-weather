// api/_lib/winterRoute/westfjordsCompletionGeometryCrossCheck.test.js
// Ticket #503 westfjords-completion, P6(a)/P8(a) -- "próf sem kallar
// geometry-handler og ber geometryId/lengthM/idButurIds saman við
// gagnasvarið fyrir allar 16, ekki resolver við sjálfan sig". Calls the
// REAL exported api/winter-route-geometry.js handler (unmodified) and
// compares its own geometryId/lengthM/idButurIds against
// resolveWestfjordsCompletionGeometry's own output, for all sixteen
// directions, plus a regression check for B<->H and one westfjords-batch
// pair (both untouched by this round).
// @vitest-environment node
import { describe, it, expect } from "vitest";
import geometryHandler from "../../winter-route-geometry.js";
import { resolveWestfjordsCompletionGeometry } from "./westfjordsCompletionRoute.js";
import { resolveBudardalurHolmavikGeometry } from "./budardalurHolmavikRoute.js";
import { resolveWestfjordsBatchGeometry } from "./westfjordsBatchRoute.js";

function makeReq(from, to) {
  return { method: "GET", url: "/api/winter-route-geometry", query: { from, to } };
}
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
  ["budardalur", "isafjordur"], ["flokalundur", "isafjordur"], ["isafjordur", "holmavik"],
  ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"], ["flokalundur", "holmavik"],
  ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"],
];

describe("westfjords-completion resolver vs. the real /api/winter-route-geometry handler (not resolver-vs-itself)", () => {
  for (const [a, b] of PAIRS) {
    for (const [from, to] of [[a, b], [b, a]]) {
      it(`${from}->${to}: geometryId, lengthM and idButurIds match the real geometry handler exactly`, async () => {
        const res = makeRes();
        await geometryHandler(makeReq(from, to), res);
        expect(res.body.status).toBe("geometry_only");

        const geo = resolveWestfjordsCompletionGeometry(from, to);
        expect(geo.ok).toBe(true);
        expect(geo.geometryId).toBe(res.body.geometryId);
        expect(geo.lengthM).toBeCloseTo(res.body.lengthM, 6);
        expect(geo.idButurList).toEqual(res.body.idButurIds);
      });
    }
  }

  it("B<->H's own existing resolver still matches the real geometry handler (unaffected regression check)", async () => {
    const res = makeRes();
    await geometryHandler(makeReq("budardalur", "holmavik"), res);
    const geo = resolveBudardalurHolmavikGeometry("budardalur", "holmavik");
    expect(geo.geometryId).toBe(res.body.geometryId);
    expect(geo.idButurList).toEqual(res.body.idButurIds);
  });

  it("a westfjords-batch pair (budardalur<->flokalundur) still matches the real geometry handler (unaffected regression check)", async () => {
    const res = makeRes();
    await geometryHandler(makeReq("budardalur", "flokalundur"), res);
    const geo = resolveWestfjordsBatchGeometry("budardalur", "flokalundur");
    expect(geo.geometryId).toBe(res.body.geometryId);
    expect(geo.idButurList).toEqual(res.body.idButurIds);
  });
});
