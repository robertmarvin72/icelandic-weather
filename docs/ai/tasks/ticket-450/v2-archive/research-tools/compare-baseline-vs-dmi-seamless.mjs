// Ticket #450 v2 correction (J3). Node built-ins only, no dependencies.
// Reads only the two already-retained sample files (no new network request)
// and compares the Keflavík entry of the app-equivalent baseline against
// the single-point dmi_seamless experiment, aligned by the `time` string.
// Run: node docs/ai/tasks/ticket-450/research-tools/compare-baseline-vs-dmi-seamless.mjs
import { readFileSync, writeFileSync } from "node:fs";
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

function alignAndCompare(variable) {
  const bTime = baseline.hourly?.time ?? [];
  const eTime = experiment.hourly?.time ?? [];
  const bVal = baseline.hourly?.[variable] ?? [];
  const eVal = experiment.hourly?.[variable] ?? [];

  const bMap = new Map(bTime.map((t, i) => [t, bVal[i]]));
  const eMap = new Map(eTime.map((t, i) => [t, eVal[i]]));

  const allTimes = new Set([...bTime, ...eTime]);
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

// Segment the 168-hour baseline series relative to the retrieval hour.
// Retrieval time (response Date header, server time, not independently
// logged local time) for the baseline request was 2026-10-19T17:47:22Z.
const RETRIEVAL_ISO_HOUR = "2026-10-19T17:00"; // Open-Meteo hourly steps are on the hour; 17:47 falls in the 17:00 step
const bTime = baseline.hourly?.time ?? [];
const retrievalIdx = bTime.indexOf(RETRIEVAL_ISO_HOUR);

log("## Segments relative to retrieval hour (baseline series only; see J3.2 wording in the report for interpretation)");
log(`retrieval hour step found at index: ${retrievalIdx} (time=${bTime[retrievalIdx]}); total steps: ${bTime.length}`);
if (retrievalIdx >= 0) {
  const before = bTime.slice(0, retrievalIdx);
  const next72 = bTime.slice(retrievalIdx, retrievalIdx + 72);
  const remaining = bTime.slice(retrievalIdx + 72);
  log(`segment A (before retrieval hour): ${before.length} steps, ${before[0] ?? "(none)"} .. ${before[before.length - 1] ?? "(none)"}`);
  log(`segment B (72 steps from first step on/after retrieval hour): ${next72.length} steps, ${next72[0] ?? "(none)"} .. ${next72[next72.length - 1] ?? "(none)"}`);
  log(`segment C (remaining): ${remaining.length} steps, ${remaining[0] ?? "(none)"} .. ${remaining[remaining.length - 1] ?? "(none)"}`);
} else {
  log("retrieval-hour step not found in baseline time array — segmentation not performed");
}

const text = out.join("\n");
writeFileSync(join(here, "compare-baseline-vs-dmi-seamless.output.txt"), text, "utf8");
console.log(text);
