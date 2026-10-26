// Ticket #464 — Round 2 correction (approved-prompt-v2.md, R1). Extends the
// Round 1 script with a raw daily.weathercode sweep for Oct-28, an Oct-27
// overcast check, and an explicit no-gust-vs-gust-equal-wind comparison.
// Executes the REAL, retained scoring.js (no copy). Run with:
//   node --import ./docs/ai/tasks/ticket-464/harness/esm-ext-loader.mjs docs/ai/tasks/ticket-464/harness/reference-cases-script-v2.mjs
import { register } from "node:module";

register("./esm-ext-loader.mjs", import.meta.url);

const {
  getSkyComfortModifier,
  getColdWindPenalty,
  getWintryPrecipPenalty,
  getPleasantnessModifier,
  gustPenaltyPoints,
  scoreSiteDay,
} = await import("../../../../../src/lib/scoring.js");

function hr(title) {
  console.log("\n==== " + title + " ====");
}

hr("R1 — raw daily.weathercode sweep, Oct-28 baseline (tmax5.8, windMax5.1, rain0, winter), NO gust");
// "No gust" here means windGust: null, which is what scoreSiteDay/gustPenaltyPoints
// treat as "absent" (gustPenaltyPoints returns 0 immediately when gust == null,
// scoring.js:131). This is deliberately distinct from a *reported* gust that
// happens to equal windMax (diff=0), which also yields gustPen=0 but for a
// different reason (diff<=0 short-circuit, scoring.js:134) -- shown explicitly below.
const codes = [null, 0, 1, 2, 3, 45, 51, 61, 95, 66, 67, 71, 77, 85];
for (const code of codes) {
  const r = scoreSiteDay({ date: "2026-10-28", tmax: 5.8, windMax: 5.1, windGust: null, rain: 0, weatherCode: code, shelter: 0 });
  const sky = getSkyComfortModifier(code);
  const coldWind = getColdWindPenalty(5.8, 5.1);
  const wintry = getWintryPrecipPenalty(code, 5.8);
  console.log(
    `code=${String(code).padStart(4)}  sky=${sky}  coldWind=${coldWind}  wintry=${wintry}  pleasantness=${r.components.pleasantness}  points=${r.points}  class=${r.finalClass}`
  );
}

hr("R1 — for each code above, sweep gust to find the FIRST gust value that reaches 'Bad' (step 0.1 m/s, 0..20)");
for (const code of codes) {
  const noGust = scoreSiteDay({ date: "2026-10-28", tmax: 5.8, windMax: 5.1, windGust: null, rain: 0, weatherCode: code, shelter: 0 });
  if (noGust.finalClass === "Bad") {
    console.log(`code=${String(code).padStart(4)}  already "Bad" with NO gust at all (points=${noGust.points})`);
    continue;
  }
  let firstBadGust = null;
  for (let g = 0; g <= 20.0001; g += 0.1) {
    const r = scoreSiteDay({ date: "2026-10-28", tmax: 5.8, windMax: 5.1, windGust: Math.round(g * 10) / 10, rain: 0, weatherCode: code, shelter: 0 });
    if (r.finalClass === "Bad") {
      firstBadGust = Math.round(g * 10) / 10;
      break;
    }
  }
  console.log(`code=${String(code).padStart(4)}  no-gust class=${noGust.finalClass} (points=${noGust.points})  first Bad gust=${firstBadGust ?? "none found <=20"}`);
}

hr("R1 — explicit no-gust vs gust-equal-to-windMax comparison (code=1, clear)");
const a = scoreSiteDay({ date: "2026-10-28", tmax: 5.8, windMax: 5.1, windGust: null, rain: 0, weatherCode: 1, shelter: 0 });
const b = scoreSiteDay({ date: "2026-10-28", tmax: 5.8, windMax: 5.1, windGust: 5.1, rain: 0, weatherCode: 1, shelter: 0 });
console.log(`windGust=null   -> gustPen=${a.gustPen}  points=${a.points}  class=${a.finalClass}  (gustPenaltyPoints short-circuits on g==null, scoring.js:131)`);
console.log(`windGust=5.1 (==windMax) -> gustPen=${b.gustPen}  points=${b.points}  class=${b.finalClass}  (diff=0, short-circuits on diff<=0, scoring.js:134)`);
console.log("Not materially different for this input: both reach gustPen=0 via two different early-return branches of gustPenaltyPoints.");

hr("R1 — Oct-27 overcast raw code=3, owner-reported rounded baseline (tmax6.7, windMax4.8, rain0.2), NO gust");
const oct27 = scoreSiteDay({ date: "2026-10-27", tmax: 6.7, windMax: 4.8, windGust: null, rain: 0.2, weatherCode: 3, shelter: 0 });
console.log("input: tmax=6.7 windMax=4.8 rain=0.2 weatherCode=3 (overcast) windGust=null shelter=0");
console.log("components:", JSON.stringify(oct27.components));
console.log(`points=${oct27.points}  class=${oct27.finalClass}  <-- owner reported "Fair/Sæm"`);

hr("R1 — sky-penalty comparison, code=3 (overcast, sky=-1) vs code=45 (fog, sky=-1) vs wintry codes (66/71/85)");
for (const code of [3, 45, 66, 71, 85]) {
  const sky = getSkyComfortModifier(code);
  const wintry = getWintryPrecipPenalty(code, 5.8);
  const pleasant = getPleasantnessModifier({ tmax: 5.8, windMax: 5.1, weatherCode: code });
  console.log(`code=${code}  sky=${sky}  wintry=${wintry}  pleasantness(sky-coldWind-wintry)=${pleasant}`);
}

hr("done");
