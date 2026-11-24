// Task-local, read-only script for ticket #503 ring-options
// (approved-prompt-v1.md P1/P7, "Framkvæmdarsamræming Ripley" points 2-3).
// Runs the ONE authorized bounded real-network probe before any app code
// consumes it: union road feeds (72 IdButur) once, then EXACTLY the
// production forecast-fetch flow for all 8 variants, R->Selfoss north
// (18 points, the max) FIRST. Saves evidence/probe-output.json.
//
// Run with: node --env-file=.env.local --env-file=.env.development.local
//   docs/ai/tasks/ticket-503/ring-options/evidence/probe-and-registry.mjs

import fs from "fs";
import {
  resolveRingOptionGeometry, ringOptionForecastPoints,
} from "../../../../../../api/_lib/winterRoute/ringOptionsRoute.js";
import { fetchRoadSegments, fetchRoadPoints } from "../../../../../../api/_lib/winterRoute/roadFetch.js";
import { fetchWinterRouteForecast, resolveWinterRouteForecastAuth } from "../../../../../../api/_lib/winterRoute/forecastFetch.js";
import { exportFreshness } from "../../../../../../api/_lib/winterRoute/freshness.js";

function haversineKm(a, b) {
  const R = 6371.0088, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const VARIANTS = [
  // R->Selfoss north FIRST (18 points, the max) per Ripley's own binding order.
  ["reykjavik-raudavatn", "selfoss", "north"],
  ["reykjavik-raudavatn", "selfoss", "south"],
  ["selfoss", "reykjavik-raudavatn", "south"],
  ["selfoss", "reykjavik-raudavatn", "north"],
  ["reykjavik-raudavatn", "hella", "south"],
  ["hella", "reykjavik-raudavatn", "south"],
  ["reykjavik-raudavatn", "hella", "north"],
  ["hella", "reykjavik-raudavatn", "north"],
];

console.log("=== resolving all 8 variants, union IdButur ===");
const geos = {};
const unionIdButur = new Set();
for (const [from, to, option] of VARIANTS) {
  const geo = resolveRingOptionGeometry(from, to, option);
  if (!geo.ok) throw new Error(`STOP: ${from}->${to} ${option} failed: ${geo.reason}`);
  geos[`${from}|${to}|${option}`] = geo;
  geo.idButurList.forEach((id) => unionIdButur.add(id));
  console.log(`${from}->${to} ${option}: ok, ${geo.pointIds.length} points, ${geo.idButurList.length} IdButur`);
}
const unionIdButurList = [...unionIdButur];
console.log("union IdButur count:", unionIdButurList.length);

const probeOutput = { generatedAt: new Date().toISOString(), calls: [] };

console.log("\n=== (1) ONE fetchRoadSegments + ONE fetchRoadPoints for the union ===");
const auth = resolveWinterRouteForecastAuth();
console.log("forecast auth available (boolean only):", auth.available);
probeOutput.forecastAuthAvailable = auth.available;

const UPSTREAM_FETCH_OPTIONS = { timeoutMs: 15000, maxBytes: 2 * 1024 * 1024 };
const now = new Date();
let callCount = 0;

const segStart = Date.now();
const segmentsResult = await fetchRoadSegments(unionIdButurList, UPSTREAM_FETCH_OPTIONS);
callCount += 1;
const segElapsed = Date.now() - segStart;
console.log("segments ok:", segmentsResult.ok, segmentsResult.ok ? "" : segmentsResult.reason, `elapsed=${segElapsed}ms`);
const segmentsCall = { call: "fetchRoadSegments", ok: segmentsResult.ok, elapsedMs: segElapsed };
if (segmentsResult.ok) {
  const exp = exportFreshness(segmentsResult.feedDagsKeyrtUt, now);
  const found = segmentsResult.rows.filter((r) => r.found).length;
  const ambiguous = segmentsResult.rows.filter((r) => r.ambiguous).length;
  const missing = segmentsResult.rows.filter((r) => !r.found).map((r) => r.idButur);
  console.log(`  feedDagsKeyrtUt=${segmentsResult.feedDagsKeyrtUt} ageMinutes=${exp.ageMinutes?.toFixed(1)} isStale=${exp.isStale} found=${found}/${unionIdButurList.length} ambiguous=${ambiguous}`);
  for (const id of missing) console.log("  MISSING idButur=", id);
  Object.assign(segmentsCall, { feedDagsKeyrtUt: segmentsResult.feedDagsKeyrtUt, ageMinutes: exp.ageMinutes, isStale: exp.isStale, totalRequested: unionIdButurList.length, found, ambiguous, missing });
} else segmentsCall.reason = segmentsResult.reason;
probeOutput.calls.push(segmentsCall);

const ptsStart = Date.now();
const pointsResult = await fetchRoadPoints(unionIdButurList, UPSTREAM_FETCH_OPTIONS);
callCount += 1;
const ptsElapsed = Date.now() - ptsStart;
console.log("points ok:", pointsResult.ok, pointsResult.ok ? "" : pointsResult.reason, `elapsed=${ptsElapsed}ms`);
const pointsCall = { call: "fetchRoadPoints", ok: pointsResult.ok, elapsedMs: ptsElapsed };
if (pointsResult.ok) {
  const exp = exportFreshness(pointsResult.feedDagsKeyrtUt, now);
  const relevant = pointsResult.points.filter((p) => unionIdButurList.includes(p.idButur));
  console.log(`  feedDagsKeyrtUt=${pointsResult.feedDagsKeyrtUt} ageMinutes=${exp.ageMinutes?.toFixed(1)} isStale=${exp.isStale} notices=${relevant.length}`);
  for (const n of relevant) console.log(`  idButur=${n.idButur} astand=${n.astand} gildirTil=${n.gildirTil ?? "(none)"}`);
  Object.assign(pointsCall, { feedDagsKeyrtUt: pointsResult.feedDagsKeyrtUt, ageMinutes: exp.ageMinutes, isStale: exp.isStale, noticeCount: relevant.length, notices: relevant.map((n) => ({ idButur: n.idButur, astand: n.astand, gildirTilKnown: n.gildirTil != null })) });
} else pointsCall.reason = pointsResult.reason;
probeOutput.calls.push(pointsCall);

if (!auth.available) {
  console.log("\nkey_missing -- STOP on forecast portion per P1/P7. Road portion above still real/complete.");
  probeOutput.callCount = callCount;
  fs.writeFileSync(new URL("./probe-output.json", import.meta.url), JSON.stringify(probeOutput, null, 2));
  process.exit(0);
}

console.log("\n=== (2) forecast batches, R->Selfoss north (18 points) FIRST, then 7 remaining ===");
const forecastCalls = [];
let orderOk = true;
const orderResults = [];
let maxResponseBytes = 0;

for (const [from, to, option] of VARIANTS) {
  const geo = geos[`${from}|${to}|${option}`];
  const points = ringOptionForecastPoints(geo.pointIds);
  const forecastPoints = points.map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, labelIs: p.labelIs, labelEn: p.labelEn }));

  const fStart = Date.now();
  const forecastResult = await fetchWinterRouteForecast({ now, fetchOptions: UPSTREAM_FETCH_OPTIONS, forecastPoints });
  callCount += 1;
  const fElapsed = Date.now() - fStart;
  const bodyBytes = JSON.stringify(forecastResult).length;
  maxResponseBytes = Math.max(maxResponseBytes, bodyBytes);
  console.log(`${from}->${to} ${option}: forecast ok=${forecastResult.ok} points=${forecastPoints.length} elapsed=${fElapsed}ms approxBytes=${bodyBytes}`);

  const callRecord = { from, to, option, ok: forecastResult.ok, pointCount: forecastPoints.length, elapsedMs: fElapsed, approxResponseBytes: bodyBytes };
  if (forecastResult.ok) {
    callRecord.window = forecastResult.window;
    callRecord.points = [];
    const requestedPoints = forecastPoints.map((p) => ({ lat: p.lat, lon: p.lon }));
    const returnedPoints = forecastResult.points.map((pt) => (pt.ok ? { lat: pt.latitude, lon: pt.longitude } : null));
    function isInRequestOrder(resultIndex, returnedCoord, allRequested) {
      const distances = allRequested.map((rp, j) => ({ j, km: haversineKm(returnedCoord, rp) }));
      const own = distances.find((d) => d.j === resultIndex).km;
      const sorted = [...distances].sort((x, y) => x.km - y.km);
      const secondNearestOtherThanSelf = sorted.find((d) => d.j !== resultIndex)?.km ?? Infinity;
      return { ok: Math.abs(own - Math.min(...distances.map((d) => d.km))) < 1e-9, marginKm: secondNearestOtherThanSelf - own };
    }
    forecastResult.points.forEach((pt, i) => {
      const p = points[i];
      if (!pt.ok) { callRecord.points.push({ id: p.id, ok: false, reason: pt.reason }); return; }
      const snapKm = haversineKm({ lat: forecastPoints[i].lat, lon: forecastPoints[i].lon }, { lat: pt.latitude, lon: pt.longitude });
      const order = isInRequestOrder(i, returnedPoints[i], requestedPoints);
      if (!order.ok) { orderOk = false; console.log(`  ORDER_MISMATCH ${from}->${to} ${option} point=${p.id}`); }
      orderResults.push({ from, to, option, point: p.id, ...order });
      callRecord.points.push({ id: p.id, ok: true, requestedLat: forecastPoints[i].lat, requestedLon: forecastPoints[i].lon, returnedLat: pt.latitude, returnedLon: pt.longitude, snapKm, returnedElevation: pt.elevation, nativeZ: p.nativeZ, marginKm: order.marginKm });
    });
  } else {
    callRecord.reason = forecastResult.reason;
  }
  forecastCalls.push(callRecord);

  if (callCount >= 10) { console.log("\nreached the 10-call proof maximum, stopping here."); break; }
}

probeOutput.forecastCalls = forecastCalls;
probeOutput.orderCheck = { ok: orderOk, results: orderResults };
probeOutput.callCount = callCount;
probeOutput.maxForecastResponseBytes = maxResponseBytes;
console.log("\ncall count:", callCount, "(max 10 allowed)");
console.log("order check (production subsets of all 8 variants):", orderOk ? "all pass" : "FAILURE -- STOP");
console.log("max forecast response bytes (18-point variant or otherwise):", maxResponseBytes);

fs.writeFileSync(new URL("./probe-output.json", import.meta.url), JSON.stringify(probeOutput, null, 2));
console.log("\nSaved evidence/probe-output.json.");
console.log("=== Probe complete. No URLs, keys, or raw feed snapshots were printed above. ===");
