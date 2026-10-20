// Ticket #450 v3 correction (K2/V1). Node built-ins only, no dependencies.
// Reads ONLY the already-retained observation sample and parameter catalog
// (no new network request) and reports every one of the 50 keys per row,
// over all 24 retained rows, with null/non-null/missing counts kept
// distinct, and the field's documented description where one exists.
// Run: node docs/ai/tasks/ticket-450/research-tools/observation-field-table.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const samplesDir = join(here, "..", "samples");

const rows = JSON.parse(readFileSync(join(samplesDir, "vedur-obs-1350-20261018.json"), "utf8"));
const paramDefs = JSON.parse(readFileSync(join(samplesDir, "vedur-parameters-aws-hour.json"), "utf8"));

const out = [];
const log = (s) => out.push(s);

log(`Rows read: ${rows.length}`);

// Every key present in row 0 (all retained rows are expected to share the
// same key set -- checked explicitly below, not assumed).
const keysRow0 = Object.keys(rows[0]);
const keySetsDiffer = rows.some((r) => {
  const ks = Object.keys(r);
  return ks.length !== keysRow0.length || ks.some((k) => !keysRow0.includes(k));
});
log(`Key set identical across all ${rows.length} rows: ${!keySetsDiffer}`);
log(`Keys per row: ${keysRow0.length}`);
log("");

const IDENTIFIER_KEYS = new Set(["station", "name", "time"]);

const results = [];
for (const key of keysRow0) {
  let nonNull = 0, nullCount = 0, missing = 0;
  for (const row of rows) {
    if (!(key in row)) missing++;
    else if (row[key] === null) nullCount++;
    else nonNull++;
  }
  const allNull = nullCount === rows.length;
  const allNonNull = nonNull === rows.length;
  const partial = !allNull && !allNonNull && missing === 0;
  results.push({ key, nonNull, nullCount, missing, allNull, allNonNull, partial, description: paramDefs[key] ?? "(no description in retained parameters file)" });
}

log("## Per-key table (50 keys, 24 rows each)");
log("key | non-null | null | missing | description");
log("---|---|---|---|---");
for (const r of results) {
  log(`${r.key} | ${r.nonNull} | ${r.nullCount} | ${r.missing} | ${r.description}`);
}
log("");

const allNullKeys = results.filter((r) => r.allNull).map((r) => r.key);
const allNonNullKeys = results.filter((r) => r.allNonNull).map((r) => r.key);
const partialKeys = results.filter((r) => r.partial).map((r) => r.key);
const missingAnyKeys = results.filter((r) => r.missing > 0).map((r) => r.key);

log("## Summary (denominator = 24 rows per key; two different key-set denominators reported below)");
log(`Total keys per row: ${keysRow0.length}`);
log(`All-null keys (${allNullKeys.length}): ${allNullKeys.join(", ")}`);
log(`All-non-null keys (${allNonNullKeys.length}): ${allNonNullKeys.join(", ")}`);
log(`Partially-null keys (${partialKeys.length}): ${partialKeys.length ? partialKeys.join(", ") : "(none)"}`);
log(`Keys with any 'missing' (absent from a row, distinct from null) (${missingAnyKeys.length}): ${missingAnyKeys.length ? missingAnyKeys.join(", ") : "(none)"}`);
log("");
log(`Denominator A -- all 50 keys (incl. identifiers station/name/time): ${allNonNullKeys.length} all-non-null + ${allNullKeys.length} all-null = ${allNonNullKeys.length + allNullKeys.length} of ${keysRow0.length}`);

const dataFieldResults = results.filter((r) => !IDENTIFIER_KEYS.has(r.key));
const dataAllNull = dataFieldResults.filter((r) => r.allNull).length;
const dataAllNonNull = dataFieldResults.filter((r) => r.allNonNull).length;
log(`Denominator B -- 47 data fields (excl. station/name/time): ${dataAllNonNull} all-non-null + ${dataAllNull} all-null = ${dataAllNonNull + dataAllNull} of ${dataFieldResults.length}`);

const rField = results.find((r) => r.key === "r");
log("");
log(`'r' (precipitation) specifically: non-null=${rField.nonNull} null=${rField.nullCount} missing=${rField.missing} (expected 24/24 null)`);

log("");
log("'All-null' is reported as an observed count only -- it is NOT read as 'no rain'/'zero', as 'sensor absent', or as a general provider missing-data policy (one day, one station).");

const text = out.join("\n");
writeFileSync(join(here, "observation-field-table.output.txt"), text, "utf8");
console.log(text);
