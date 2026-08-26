// google-apps-script/decision-quiz/loadCore.js
//
// Test-support ONLY — never deployed to Apps Script (uses Node's `vm` and
// `fs`, neither of which exist in the Apps Script runtime). Loads core.js's
// LITERAL source text and executes it in a fresh sandbox, exposing the same
// `DecisionQuizCore` global the real deployed project gets — this is the
// "runtime-neutral global loaded by a Vitest harness" mechanism: Vitest
// exercises the exact bytes that get uploaded to Apps Script, never a
// separate reimplementation.

import fs from "fs";
import path from "path";
import vm from "vm";

export function loadDecisionQuizCore() {
  const corePath = path.join(process.cwd(), "google-apps-script/decision-quiz/core.js");
  const source = fs.readFileSync(corePath, "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "core.js" });
  return sandbox.DecisionQuizCore;
}
