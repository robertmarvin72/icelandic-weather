// #430 — frozen local review experiment (Round 2 F7 / C6). Reads the frozen
// candidate.diff, splits it into per-file sections, packs them into chunks
// under a conservative preflight token estimate, and sends each chunk to
// the local Ollama qwen3-coder:30b model with explicit options. Findings
// are written ONLY to qwen-review.md in this local-review/ directory —
// never summarized or disclosed in cc-report.md, CURRENT.md, or the shared
// review-packet. This script and its raw outputs are themselves excluded
// from the review packet for the same reason.
import fs from "node:fs";
import path from "node:path";

const WALL_CLOCK_BUDGET_MS = 15 * 60 * 1000;
const MAX_CHUNKS = 12;
const NUM_CTX = 4096;
const NUM_PREDICT = 800; // within the <=1024 cap, leaves headroom
const PESSIMISTIC_CHARS_PER_TOKEN = 3; // deliberately pessimistic (over-estimates tokens)
const PROMPT_TOKEN_BUDGET = NUM_CTX - 1024; // reserve >=1024 tokens of output margin -> prompt_eval_count should stay <= 3072

const DIFF_PATH = path.resolve("docs/ai/tasks/ticket-430/review-packet/candidate.diff");
const OUT_DIR = path.resolve("docs/ai/tasks/ticket-430/local-review");

const raw = fs.readFileSync(DIFF_PATH, "utf8");
// Split into per-file sections on "diff --git" boundaries, keeping the marker.
const parts = raw.split(/(?=^diff --git )/m).filter((s) => s.trim().length > 0);

function estTokens(str) {
  return Math.ceil(Buffer.byteLength(str, "utf8") / PESSIMISTIC_CHARS_PER_TOKEN);
}

const INSTRUCTION =
  "You are reviewing a git diff for a React/Vite web app (source-level correctness review). " +
  "Focus on correctness bugs: race conditions, stale closures, incorrect conditionals, wrong event semantics, " +
  "missing cleanup, off-by-one logic. Be concise: at most 4 findings as a numbered list, each one or two " +
  "sentences, or reply exactly NONE if you find nothing. Do not restate the whole diff.\n\n";

// Pack file-sections into chunks under the prompt token budget (greedy,
// preserving file order so related files tend to land together).
const chunks = [];
let cur = [];
let curTokens = estTokens(INSTRUCTION);
for (const part of parts) {
  const t = estTokens(part);
  if (t + estTokens(`\n\n--- chunk nonce: xxxxxxxx ---\n`) > PROMPT_TOKEN_BUDGET) {
    // A single file section alone exceeds the budget — split it further by line.
    const lines = part.split("\n");
    let sub = [];
    let subTokens = estTokens(INSTRUCTION);
    for (const line of lines) {
      const lt = estTokens(line + "\n");
      if (subTokens + lt > PROMPT_TOKEN_BUDGET && sub.length) {
        chunks.push(sub.join("\n"));
        sub = [];
        subTokens = estTokens(INSTRUCTION);
      }
      sub.push(line);
      subTokens += lt;
    }
    if (sub.length) chunks.push(sub.join("\n"));
    continue;
  }
  if (curTokens + t > PROMPT_TOKEN_BUDGET && cur.length) {
    chunks.push(cur.join("\n"));
    cur = [];
    curTokens = estTokens(INSTRUCTION);
  }
  cur.push(part);
  curTokens += t;
}
if (cur.length) chunks.push(cur.join("\n"));

console.log(`Planned ${chunks.length} chunk(s) from ${parts.length} file section(s).`);

const budgetRecord = chunks.map((c, i) => ({
  chunk: i + 1,
  bytes: Buffer.byteLength(c, "utf8"),
  pessimisticEstimateTokens: estTokens(INSTRUCTION) + estTokens(c),
}));
fs.writeFileSync(path.join(OUT_DIR, "chunk-budget.json"), JSON.stringify(budgetRecord, null, 2));
budgetRecord.forEach((b) => console.log(`chunk ${b.chunk}: ${b.bytes} bytes, pessimistic estimate ${b.pessimisticEstimateTokens} tokens`));

async function runChunk(index, content) {
  const nonce = Math.random().toString(36).slice(2, 10); // unique per-chunk prefix, defeats prefix-cache reuse
  const prompt = `${INSTRUCTION}--- chunk nonce: ${nonce} ---\n\n${content}`;
  const promptFile = path.join(OUT_DIR, `chunk-${String(index).padStart(2, "0")}-prompt.txt`);
  fs.writeFileSync(promptFile, prompt);

  const estimate = estTokens(prompt);
  const start = Date.now();
  let json;
  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3-coder:30b",
        prompt,
        stream: false,
        options: { num_ctx: NUM_CTX, num_predict: NUM_PREDICT },
      }),
    });
    json = await res.json();
  } catch (e) {
    return { index, error: e.message, elapsedMs: Date.now() - start, pessimisticEstimateTokens: estimate };
  }
  const elapsedMs = Date.now() - start;
  const responseFile = path.join(OUT_DIR, `chunk-${String(index).padStart(2, "0")}-response.txt`);
  fs.writeFileSync(responseFile, json.response ?? "");

  const promptEvalCount = json.prompt_eval_count ?? null;
  // C6(b): a missing or implausibly low returned prompt_eval_count marks this
  // chunk's fit "unverified", never "verified" — the pessimistic preflight
  // estimate remains primary evidence either way.
  const fitStatus = promptEvalCount == null || promptEvalCount < estimate * 0.4 ? "unverified" : "corroborated";

  return {
    index,
    elapsedMs,
    pessimisticEstimateTokens: estimate,
    promptEvalCount,
    evalCount: json.eval_count ?? null,
    fitStatus,
    responseFile: path.relative(OUT_DIR, responseFile),
  };
}

async function main() {
  const startAll = Date.now();
  const log = [];
  let stoppedOnBudget = false;

  for (let i = 0; i < chunks.length; i++) {
    if (i >= MAX_CHUNKS) {
      stoppedOnBudget = true;
      log.push({ index: i + 1, skipped: "max-chunks-reached" });
      break;
    }
    if (Date.now() - startAll > WALL_CLOCK_BUDGET_MS) {
      stoppedOnBudget = true;
      log.push({ index: i + 1, skipped: "wall-clock-budget-exceeded" });
      break;
    }
    console.log(`\n--- running chunk ${i + 1}/${chunks.length} ---`);
    const result = await runChunk(i + 1, chunks[i]);
    console.log(JSON.stringify({ ...result, responseFile: result.responseFile }, null, 2));
    log.push(result);
  }

  const totalElapsedMs = Date.now() - startAll;
  const meta = {
    model: "qwen3-coder:30b",
    ollamaVersion: "0.40.0",
    numCtx: NUM_CTX,
    numPredict: NUM_PREDICT,
    plannedChunks: chunks.length,
    ranChunks: log.filter((l) => !l.skipped).length,
    stoppedOnBudget,
    totalElapsedMs,
    wallClockBudgetMs: WALL_CLOCK_BUDGET_MS,
    log,
  };
  fs.writeFileSync(path.join(OUT_DIR, "run-meta.json"), JSON.stringify(meta, null, 2));
  console.log(`\nTotal elapsed: ${(totalElapsedMs / 1000).toFixed(1)}s, chunks run: ${meta.ranChunks}/${chunks.length}, stoppedOnBudget=${stoppedOnBudget}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
