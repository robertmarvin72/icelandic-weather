// Ticket #450 v5 (M5). Node built-ins only, no dependencies, STDOUT-ONLY
// (writes nothing; caller redirects stdout to reference-check-verify.output.txt).
// Reads ONLY the four fixed input files below -- no network, no subprocess,
// no recursive search, nothing else is hashed or scanned by this script.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const taskDir = join(here, "..");

const INPUT_FILES = [
  "research-report.md",
  "provider-matrix.csv",
  "source-register.md",
  "cc-report.md",
];

const out = [];
const log = (s) => out.push(s);

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

const contents = {};
log("## SHA256 of each input file");
for (const name of INPUT_FILES) {
  const buf = readFileSync(join(taskDir, name));
  contents[name] = buf.toString("utf8");
  log(`${sha256(buf)}  ${name}`);
}
log("");

// X2's six patterns plus the seventh "line 62" variant pattern (M4).
const PATTERNS = [
  { name: "hliðarfund|hlidarfund", re: /hliðarfund|hlidarfund/i },
  { name: "vanti þessa skynjara", re: /vanti þessa skynjara/i },
  { name: "sensor-absence|sensor absence", re: /sensor-absence|sensor absence/i },
  { name: "zero broken", re: /zero broken/i },
  { name: "engin brotin", re: /engin brotin/i },
  { name: "reproduced inline", re: /reproduced inline/i },
  { name: "lína 62|línu 62|line 62|L62", re: /lína 62|línu 62|line 62|L62/i },
];

log("## Matching lines per pattern (file:line:excerpt)");
for (const pattern of PATTERNS) {
  log(`### ${pattern.name}`);
  let total = 0;
  for (const name of INPUT_FILES) {
    const lines = contents[name].split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (pattern.re.test(lines[i])) {
        total++;
        const excerpt = lines[i].length > 220 ? lines[i].slice(0, 220) + "…" : lines[i];
        log(`${name}:${i + 1}:${excerpt}`);
      }
    }
  }
  log(`(matching-line count for this pattern: ${total})`);
  log("");
}

// M2 uniqueness check: the R7 flag-only sentence must occur exactly once
// between the "## 1." and "## 2." headings of research-report.md.
log("## M2 uniqueness check (research-report.md, R7 flag-only sentence)");
{
  const lines = contents["research-report.md"].split("\n");
  let h1Line = -1, h2Line = -1;
  for (let i = 0; i < lines.length; i++) {
    if (h1Line === -1 && /^## 1\./.test(lines[i])) h1Line = i + 1;
    if (h1Line !== -1 && h2Line === -1 && /^## 2\./.test(lines[i])) { h2Line = i + 1; break; }
  }
  log(`'## 1.' heading at line: ${h1Line}`);
  log(`'## 2.' heading at line: ${h2Line}`);
  let occurrences = 0;
  const hits = [];
  if (h1Line !== -1 && h2Line !== -1) {
    for (let i = h1Line; i < h2Line - 1; i++) {
      if (lines[i].includes("Leiðrétt orðalag (R7):")) {
        occurrences++;
        hits.push(i + 1);
      }
    }
  }
  log(`occurrences of "Leiðrétt orðalag (R7):" strictly between '## 1.' and '## 2.': ${occurrences}`);
  log(`line number(s) of occurrence(s): ${hits.join(", ") || "(none)"}`);
}
log("");

// Pointer existence checks: §8 heading in research-report.md, and the
// reference-check.md file's own heading, both of which research-report.md
// and cc-report.md point to.
log("## Pointer existence checks");
{
  const rrLines = contents["research-report.md"].split("\n");
  const s8Line = rrLines.findIndex((l) => /^## 8\./.test(l));
  log(`research-report.md '## 8.' heading: ${s8Line === -1 ? "NOT FOUND" : `found at line ${s8Line + 1} ("${rrLines[s8Line]}")`}`);

  const refCheckPath = join(taskDir, "reference-check.md");
  const refCheckExists = existsSync(refCheckPath);
  log(`reference-check.md exists at expected path: ${refCheckExists}`);
  if (refCheckExists) {
    const refLines = readFileSync(refCheckPath, "utf8").split("\n");
    const headingLine = refLines.findIndex((l) => /^# /.test(l));
    log(`reference-check.md top heading: ${headingLine === -1 ? "NOT FOUND" : `found at line ${headingLine + 1} ("${refLines[headingLine]}")`}`);
  }
}

console.log(out.join("\n"));
