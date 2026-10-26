// Ticket #464 — R3 note. Confirms, via the real retained scoring.js, that
// wind=5/gust=8 (the harness's own "all calm" hourly fixture, which the
// modal badges as hourly "Good") already crosses the winter gustiness
// penalty threshold when fed to the daily formula on a winter date.
import { register } from "node:module";
register("./esm-ext-loader.mjs", import.meta.url);
const { gustPenaltyPoints, scoreSiteDay } = await import("../../../../../src/lib/scoring.js");

console.log("wind=5, gust=8 -> diff =", 8 - 5, "(hourly Good: wind<=10 and gust<=15, both true)");
console.log("gustPenaltyPoints(8,5,'winter') =", gustPenaltyPoints(8, 5, "winter"), "(diff=3.0 >= 2.9, so NOT zero)");
const r = scoreSiteDay({ date: "2026-10-28", tmax: 10, windMax: 5, windGust: 8, rain: 0, weatherCode: 1, shelter: 0 });
console.log("full scoreSiteDay on a winter day with these exact wind/gust values:", JSON.stringify(r.components), "points=", r.points, "class=", r.finalClass);
