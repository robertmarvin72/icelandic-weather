// api/_lib/winterRoute/ringOptionGeometry.test.js — Ticket #503
// ring-options, P5(b): composeSouthOption/composeNorthOption were
// extracted verbatim out of api/winter-route-geometry.js. This proves the
// extraction changed nothing: the real, unmodified
// api/winter-route-geometry.js handler (which now imports these two
// functions from this module) produces byte-identical JSON for all 8
// variants to the pre-extraction snapshot captured in
// docs/ai/tasks/ticket-503/ring-options/evidence/extraction-snapshot-before.json.
// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import geometryHandler from "../../winter-route-geometry.js";
import { composeSouthOption, composeNorthOption } from "./ringOptionGeometry.js";
import { loadGeometryDataset } from "./geometryDataset.js";

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

describe("composeSouthOption/composeNorthOption extraction (P5b) — the real handler's own 8 responses are unaffected", () => {
  const snapshotPath = path.join(process.cwd(), "docs/ai/tasks/ticket-503/ring-options/evidence/extraction-snapshot-before.json");
  const before = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

  for (const [a, b] of PAIRS) {
    for (const option of ["south", "north"]) {
      for (const [from, to] of [[a, b], [b, a]]) {
        it(`${from}->${to} option=${option}: real handler response is byte-identical to the pre-extraction snapshot`, async () => {
          const res = makeRes();
          await geometryHandler(makeReq(from, to, option), res);
          expect(res.body).toEqual(before[`${from}|${to}|${option}`]);
        });
      }
    }
  }
});

describe("composeSouthOption/composeNorthOption called directly", () => {
  const dataset = loadGeometryDataset();

  it("composeSouthOption resolves reykjavik-raudavatn->selfoss with the pinned geometryId/length", () => {
    const result = composeSouthOption("reykjavik-raudavatn", "selfoss", dataset);
    expect(result.status).toBe("geometry_only");
    expect(result.geometryId).toBe("215a1805457eb42ad937c6d8217f10aa");
    expect(result.lengthM).toBeCloseTo(44984.8, 0);
  });

  it("composeNorthOption resolves reykjavik-raudavatn->selfoss via two legs through Egilsstaðir with the pinned geometryId/length", () => {
    const result = composeNorthOption("reykjavik-raudavatn", "selfoss", dataset);
    expect(result.status).toBe("geometry_only");
    expect(result.geometryId).toBe("d0e0996e7500b868364007e1cad20046");
    expect(result.lengthM).toBeCloseTo(1236038.3, 0);
  });

  it("forward and reverse never share a geometryId (direction-dependent, never a mechanical reversal)", () => {
    const fwd = composeNorthOption("reykjavik-raudavatn", "selfoss", dataset);
    const rev = composeNorthOption("selfoss", "reykjavik-raudavatn", dataset);
    expect(fwd.geometryId).not.toBe(rev.geometryId);
  });
});
