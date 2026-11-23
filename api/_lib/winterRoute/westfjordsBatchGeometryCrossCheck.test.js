// api/_lib/winterRoute/westfjordsBatchGeometryCrossCheck.test.js
// Ticket #503 westfjords-batch, P5(a)/P7(a) — "próf per par/átt sem ber
// geometryId/lengthM/slice-röð saman við raun-geometry-handler (ekki
// aðeins resolver við sjálfan sig)". Calls the REAL exported
// api/winter-route-geometry.js handler (ticket #501, unmodified) and
// compares its own geometryId/lengthM against resolveWestfjordsBatchGeometry's
// own output, for all twelve directions.
// @vitest-environment node
import { describe, it, expect } from "vitest";
import geometryHandler from "../../winter-route-geometry.js";
import { resolveWestfjordsBatchGeometry } from "./westfjordsBatchRoute.js";
import { resolveBudardalurHolmavikGeometry } from "./budardalurHolmavikRoute.js";

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
  ["budardalur", "flokalundur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"],
  ["flokalundur", "patreksfjordur"], ["flokalundur", "talknafjordur"], ["patreksfjordur", "talknafjordur"],
];

describe("westfjords-batch resolver vs. the real /api/winter-route-geometry handler (not resolver-vs-itself)", () => {
  for (const [a, b] of PAIRS) {
    for (const [from, to] of [[a, b], [b, a]]) {
      it(`${from}->${to}: geometryId and lengthM match the real geometry handler exactly`, async () => {
        const res = makeRes();
        await geometryHandler(makeReq(from, to), res);
        expect(res.body.status).toBe("geometry_only");

        const geo = resolveWestfjordsBatchGeometry(from, to);
        expect(geo.ok).toBe(true);
        expect(geo.geometryId).toBe(res.body.geometryId);
        expect(geo.lengthM).toBeCloseTo(res.body.lengthM, 6);
        expect(geo.idButurList).toEqual(res.body.idButurIds);
      });
    }
  }

  it("B<->H's own existing resolver also matches the real geometry handler (unaffected regression check)", async () => {
    const res = makeRes();
    await geometryHandler(makeReq("budardalur", "holmavik"), res);
    const geo = resolveBudardalurHolmavikGeometry("budardalur", "holmavik");
    expect(geo.geometryId).toBe(res.body.geometryId);
    expect(geo.idButurList).toEqual(res.body.idButurIds);
  });
});
