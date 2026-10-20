// Ticket #450 v2 correction (J3), v3 K4 timestamp fix, v4 W2/L3 per-segment
// extension. Node built-ins only, no dependencies, STDOUT-ONLY (v4/L3: no
// writeFileSync -- caller redirects stdout to the task-local .output.txt).
// Reads only the two already-retained sample files (no new network request)
// and compares the Keflavík entry of the app-equivalent baseline against
// the single-point dmi_seamless experiment, aligned by the `time` string.
// Run: node docs/ai/tasks/ticket-450/research-tools/compare-baseline-vs-dmi-seamless.mjs > docs/ai/tasks/ticket-450/research-tools/compare-baseline-vs-dmi-seamless.output.txt
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const samplesDir = join(here, "..", "samples");

const baselineArr = JSON.parse(readFileSync(join(samplesDir, "openmeteo-baseline-4point.json"), "utf8"));
const baseline = Array.isArray(baselineArr) ? baselineArr[0] : baselineArr; // Keflavík is location 0
const experiment = JSON.parse(readFileSync(join(samplesDir, "openmeteo-dmi-seamless-experiment.json"), "utf8"));

const out = [];
const log = (s) => out.push(s);

log("# Baseline (Keflavík) vs dmi_seamless experiment — comparison output");
log("");
log("## Point identity check");
log(`baseline:   lat=${baseline.latitude} lon=${baseline.longitude} elevation=${baseline.elevation} timezone=${baseline.timezone} utc_offset_seconds=${baseline.utc_offset_seconds}`);
log(`experiment: lat=${experiment.latitude} lon=${experiment.longitude} elevation=${experiment.elevation} timezone=${experiment.timezone} utc_offset_seconds=${experiment.utc_offset_seconds}`);
log(`lat equal: ${baseline.latitude === experiment.latitude}; lon equal: ${baseline.longitude === experiment.longitude}; elevation equal: ${baseline.elevation === experiment.elevation}`);
log(`baseline hourly_units: ${JSON.stringify(baseline.hourly_units)}`);
log(`experiment hourly_units: ${JSON.stringify(experiment.hourly_units)}`);
const tempUnitEqual = baseline.hourly_units?.temperature_2m === experiment.hourly_units?.temperature_2m;
const windUnitEqual = baseline.hourly_units?.windspeed_10m === experiment.hourly_units?.windspeed_10m;
log(`temperature_2m unit equal: ${tempUnitEqual}; windspeed_10m unit equal: ${windUnitEqual}`);
log("");

// restrictToTimes: optional array of baseline time-strings to restrict the
// comparison to (v4/W2: per-segment counts). When given, only those baseline
// times are compared/counted as "missing in baseline" candidates; the
// experiment side is still looked up BY TIME STRING (never by array index --
// L3's explicit requirement), so a segment's "missing in experiment" count
// reflects a real lookup miss, not an index-alignment artifact.
function alignAndCompare(variable, restrictToTimes = null) {
  const bTime = baseline.hourly?.time ?? [];
  const eTime = experiment.hourly?.time ?? [];
  const bVal = baseline.hourly?.[variable] ?? [];
  const eVal = experiment.hourly?.[variable] ?? [];

  const bMap = new Map(bTime.map((t, i) => [t, bVal[i]]));
  const eMap = new Map(eTime.map((t, i) => [t, eVal[i]]));

  const baselineTimesInScope = restrictToTimes ?? bTime;
  const experimentTimesInScope = restrictToTimes ?? eTime;
  const allTimes = new Set([...baselineTimesInScope, ...(restrictToTimes ? [] : experimentTimesInScope)]);
  let compared = 0, matching = 0, mismatching = 0, missingInBaseline = 0, missingInExperiment = 0;
  const mismatches = [];

  for (const t of allTimes) {
    const hasB = bMap.has(t);
    const hasE = eMap.has(t);
    if (!hasB) { missingInBaseline++; continue; }
    if (!hasE) { missingInExperiment++; continue; }
    compared++;
    const vb = bMap.get(t);
    const ve = eMap.get(t);
    if (vb === ve) matching++;
    else { mismatching++; mismatches.push({ time: t, baseline: vb, experiment: ve }); }
  }

  return { variable, totalBaselineSteps: bTime.length, totalExperimentSteps: eTime.length, compared, matching, mismatching, missingInBaseline, missingInExperiment, mismatches: mismatches.slice(0, 10) };
}

const tempResult = alignAndCompare("temperature_2m");
const windResult = alignAndCompare("windspeed_10m");

log("## temperature_2m");
log(JSON.stringify({ ...tempResult, mismatches: tempResult.mismatches.length ? tempResult.mismatches : "(none)" }, null, 2));
log("");
log("## windspeed_10m");
log(JSON.stringify({ ...windResult, mismatches: windResult.mismatches.length ? windResult.mismatches : "(none)" }, null, 2));
log("");

// Segment the 168-hour baseline series relative to the ACTUAL retrieval
// instant (v3/K4 correction). The baseline request's response `Date` header
// (server response time, not an independently logged local retrieval clock)
// was 2026-10-19T17:47:22Z. baseline.hourly.time entries are naive strings
// (e.g. "2026-10-19T17:00") in Atlantic/Reykjavik time, which has
// utc_offset_seconds=0 (confirmed above), so they can be compared directly
// against a UTC instant without any offset conversion.
//
// v2's script floored 17:47:22Z down to the "17:00" step string and treated
// that step as "on/after retrieval" -- but 17:00 is strictly BEFORE
// 17:47:22, so flooring put one extra step in the wrong segment. This is a
// correction of METHOD on the same retained data, not new evidence; the
// numeric 168/168/0/0 equality totals above are completely unaffected.
const RETRIEVAL_INSTANT = new Date("2026-10-19T17:47:22Z");
const bTime = baseline.hourly?.time ?? [];
const stepInstants = bTime.map((t) => new Date(`${t}:00Z`));
let firstOnOrAfterIdx = stepInstants.findIndex((d) => d.getTime() >= RETRIEVAL_INSTANT.getTime());

log("## Segments relative to the ACTUAL retrieval instant (timestamp-based, v3/K4 correction; baseline series only)");
log(`retrieval instant: ${RETRIEVAL_INSTANT.toISOString()} (server response time)`);
log(`first step at/after retrieval instant: index ${firstOnOrAfterIdx} (time=${bTime[firstOnOrAfterIdx]}); total steps: ${bTime.length}`);
if (firstOnOrAfterIdx >= 0) {
  const before = bTime.slice(0, firstOnOrAfterIdx);
  const next72 = bTime.slice(firstOnOrAfterIdx, firstOnOrAfterIdx + 72);
  const remaining = bTime.slice(firstOnOrAfterIdx + 72);
  log(`segment A (strictly before retrieval instant): ${before.length} steps, ${before[0] ?? "(none)"} .. ${before[before.length - 1] ?? "(none)"}`);
  log(`segment B (72 steps from the first step at/after retrieval instant): ${next72.length} steps, ${next72[0] ?? "(none)"} .. ${next72[next72.length - 1] ?? "(none)"}`);
  log(`segment C (remaining): ${remaining.length} steps, ${remaining[0] ?? "(none)"} .. ${remaining[remaining.length - 1] ?? "(none)"}`);
  log("");
  log("Note: this 72-step window is counted from the RETRIEVAL instant, not from any forecast model RUN time (which is unknown/UNK — see provider-matrix.csv). It must not be described as '0-72h of the forecast'.");
  log("");

  // v4/W2/L3: per-segment, per-variable compared/matching/mismatching/missing
  // counts -- the v3 report only gave the global 168/168/0/0 totals and
  // inferred the per-segment split without actually counting it per segment.
  // Experiment values are looked up BY TIME STRING for each segment (never
  // by re-slicing the experiment array by index), so a segment boundary on
  // the baseline side cannot silently misalign with the experiment side.
  log("## Per-segment, per-variable comparison (v4/W2 — six rows: 2 variables x 3 segments)");
  const segments = [
    { name: "A (strictly before retrieval instant)", times: before },
    { name: "B (72 steps from first on/after retrieval instant)", times: next72 },
    { name: "C (remaining)", times: remaining },
  ];
  const variables = ["temperature_2m", "windspeed_10m"];
  const segmentResults = {};
  for (const variable of variables) {
    segmentResults[variable] = [];
    for (const seg of segments) {
      const r = alignAndCompare(variable, seg.times);
      segmentResults[variable].push({ segment: seg.name, ...r });
      log(`${variable} / segment ${seg.name}: compared=${r.compared} matching=${r.matching} mismatching=${r.mismatching} missingInBaseline=${r.missingInBaseline} missingInExperiment=${r.missingInExperiment}`);
    }
  }
  log("");

  log("## Self-check: per-segment sums vs. global totals (must equal the 168/168/0/0 totals above)");
  for (const variable of variables) {
    const sums = segmentResults[variable].reduce(
      (acc, r) => ({
        compared: acc.compared + r.compared,
        matching: acc.matching + r.matching,
        mismatching: acc.mismatching + r.mismatching,
        missingInExperiment: acc.missingInExperiment + r.missingInExperiment,
      }),
      { compared: 0, matching: 0, mismatching: 0, missingInExperiment: 0 }
    );
    const globalResult = variable === "temperature_2m" ? tempResult : windResult;
    const sumMatchesGlobal =
      sums.compared === globalResult.compared &&
      sums.matching === globalResult.matching &&
      sums.mismatching === globalResult.mismatching &&
      sums.missingInExperiment === globalResult.missingInExperiment;
    log(`${variable}: segment sums = ${JSON.stringify(sums)}; global = ${JSON.stringify({ compared: globalResult.compared, matching: globalResult.matching, mismatching: globalResult.mismatching, missingInExperiment: globalResult.missingInExperiment })}; self-check PASS: ${sumMatchesGlobal}`);
  }
} else {
  log("no step at/after the retrieval instant was found in the baseline time array — segmentation not performed, per-segment comparison skipped");
}

console.log(out.join("\n"));
