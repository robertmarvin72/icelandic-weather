// Ticket #464 — task-local Vitest config (J1/J9). Not part of the repo's
// own test config; never referenced by package.json or vitest.config.js.
// Points `root` at the real repo root (so `../../../../src/...` imports
// resolve exactly as production code does) but restricts `include` to this
// task's own spec file only. Run with:
//   npx vitest run --config docs/ai/tasks/ticket-464/harness/vitest.config.ticket464.mjs
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..", "..", "..");

export default defineConfig({
  root: repoRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "virtual:pwa-register": path.join(repoRoot, "src/test/mocks/virtualPwaRegister.js"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.join(repoRoot, "src/test/setupTests.js")],
    include: ["docs/ai/tasks/ticket-464/harness/*.spec.jsx"],
  },
});
