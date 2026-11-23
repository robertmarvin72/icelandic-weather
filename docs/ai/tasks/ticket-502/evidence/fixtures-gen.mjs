// Task-local, read-only fixture generator for ticket #502. Calls the REAL
// exported handler (no mocks, no stubs) and prints the real response
// shapes used as inline fixtures in src/lib/winterRouteGeometryResponse.test.js
// and src/pages/WinterRoute.test.jsx. Never imported by production code.
// Run with: node docs/ai/tasks/ticket-502/evidence/fixtures-gen.mjs

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

// Only the fields the new UI's own response logic reads -- trimmed
// deliberately so fixtures stay small and reviewable; coordinates/slices
// are never used by the UI (approved-prompt-v1.md P5g) and are omitted
// here, not just hidden in the DOM.
const RELEVANT_KEYS = [
  "schemaVersion", "tier", "status", "from", "to", "reason", "error", "field",
  "selectedOption", "options", "via", "estimatedConnectorLengthM", "accessApproach",
];
function trim(body) {
  if (!body) return body;
  const out = {};
  for (const k of RELEVANT_KEYS) if (k in body) out[k] = body[k];
  return out;
}

async function call(from, to, option) {
  const res = makeRes();
  await handler(makeReq("GET", option ? { from, to, option } : { from, to }), res);
  return { statusCode: res.statusCode, body: trim(res.body) };
}

for (const [label, from, to, option] of [
  ["budardalur->patreksfjordur (both connectors)", "budardalur", "patreksfjordur"],
  ["budardalur->talknafjordur (T flag)", "budardalur", "talknafjordur"],
  ["rvk->selfoss (options)", "reykjavik-raudavatn", "selfoss"],
  ["hella->selfoss (no options)", "hella", "selfoss"],
  ["selfoss->selfoss (ring same_place)", "selfoss", "selfoss"],
  ["talknafjordur->talknafjordur (T same_place)", "talknafjordur", "talknafjordur"],
  ["rvk->budardalur (unsupported)", "reykjavik-raudavatn", "budardalur"],
  ["flokalundur->selfoss (400 unknown_place_id)", "flokalundur", "selfoss"],
  ["selfoss->flokalundur (400 unknown_place_id)", "selfoss", "flokalundur"],
  ["rvk->selfoss option=bogus (400 invalid_option)", "reykjavik-raudavatn", "selfoss", "bogus"],
]) {
  const result = await call(from, to, option);
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(result, null, 2));
}

console.log("\n--- 405 (POST method) ---");
const res405 = makeRes();
await handler(makeReq("POST", { from: "selfoss", to: "hella" }), res405);
console.log(res405.statusCode, JSON.stringify(res405.body));

// P7(c) contract list: all 121 ordered pairs of the UI's own 11-id list,
// real handler, printed as a compact pasteable JS array of
// [from, to, httpStatus, status-or-error] for the response module's own
// contract test (never a live handler call at test time -- this script's
// output is pasted into the test file as a static fixture table).
console.log("\n--- P7(c) 121-pair contract table ---");
const PLACE_IDS = ["reykjavik-raudavatn", "selfoss", "hella", "egilsstadir", "seydisfjordur", "budardalur", "flokalundur", "isafjordur", "holmavik", "patreksfjordur", "talknafjordur"];
const rows = [];
for (const from of PLACE_IDS) {
  for (const to of PLACE_IDS) {
    const res = makeRes();
    await handler(makeReq("GET", { from, to }), res);
    const marker = res.statusCode === 200 ? res.body.status : res.body.error;
    rows.push(`["${from}","${to}",${res.statusCode},"${marker}"]`);
  }
}
console.log("[\n  " + rows.join(",\n  ") + "\n]");

const counts = {};
for (const row of rows) {
  const marker = row.match(/,"(\w+)"\]$/)[1];
  counts[marker] = (counts[marker] || 0) + 1;
}
console.log("\ncounts:", JSON.stringify(counts));
