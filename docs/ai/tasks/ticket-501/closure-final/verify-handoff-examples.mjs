// Task-local, read-only verification script for closure-final (ticket #501
// step 3). Calls the real exported handler directly -- no mocks, no data
// changes, no code changes. Produces the exact live values cited in
// final-handoff.md sections 2 and 5. Never imported by production code.
// Run with: node docs/ai/tasks/ticket-501/closure-final/verify-handoff-examples.mjs

import handler from "../../../../../api/winter-route-geometry.js";

function makeReq(method, query) {
  return { method, url: "/api/winter-route-geometry", query };
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

console.log("--- P2 cross-check boundary cases ---");
for (const [from, to] of [
  ["kopavogur", "kopavogur"],
  ["flokalundur", "selfoss"],
  ["reykjavik-raudavatn", "budardalur"],
  ["junction-1-60-baulan", "isafjordur"],
  ["junction-1-68-stadarskali", "patreksfjordur"],
  ["junction-60-61-throskuldar", "talknafjordur"],
  ["junction-1-60-baulan", "junction-1-60-baulan"],
]) {
  const res = makeRes();
  await handler(makeReq("GET", { from, to }), res);
  console.log(from, "->", to, ":", res.statusCode, res.body.status ?? res.body.error, res.body.reason ?? "");
}

console.log("\n--- P5 example (1): budardalur<->holmavik ---");
const bh = makeRes();
await handler(makeReq("GET", { from: "budardalur", to: "holmavik" }), bh);
console.log(JSON.stringify({ status: bh.body.status, regionVersion: bh.body.regionVersion, geometryId: bh.body.geometryId, lengthM: bh.body.lengthM, slices: bh.body.slices.length, via: bh.body.via, idButurIds: bh.body.idButurIds, estimatedConnectorLengthM: bh.body.estimatedConnectorLengthM }, null, 2));
const hb = makeRes();
await handler(makeReq("GET", { from: "holmavik", to: "budardalur" }), hb);
console.log("reverse geometryId:", hb.body.geometryId);

console.log("\n--- P5 example (2): talknafjordur<->talknafjordur (same_place) ---");
const tt = makeRes();
await handler(makeReq("GET", { from: "talknafjordur", to: "talknafjordur" }), tt);
console.log(JSON.stringify({ status: tt.body.status, regionVersion: tt.body.regionVersion, geometryId: tt.body.geometryId, lengthM: tt.body.lengthM, accessApproach: tt.body.accessApproach, lengthNote: tt.body.lengthNote }, null, 2));

console.log("\n--- P5 example (3): reykjavik-raudavatn<->selfoss (south default + north option) ---");
const south = makeRes();
await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss" }), south);
console.log(JSON.stringify({ datasetVersion: south.body.datasetVersion, policyVersion: south.body.policyVersion, mode: south.body.mode, selectedOption: south.body.selectedOption, lengthM: south.body.lengthM }, null, 2));
const north = makeRes();
await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "north" }), north);
console.log(JSON.stringify({ selectedOption: north.body.selectedOption, lengthM: north.body.lengthM }, null, 2));
