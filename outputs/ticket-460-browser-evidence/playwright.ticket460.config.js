import { defineConfig, devices } from "@playwright/test";

// Ticket #460 — browser acceptance must run against the actual PRODUCTION
// build (`vite preview`, serving the just-built dist/), not the dev server:
// J6 notes a production build has no /api at all, so every /api/* response
// in these specs is fully mocked via page.route() — this config only
// changes which static bundle is served.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["route-risk-ticket-460.spec.js"],
  fullyParallel: false,
  reporter: "list",
  outputDir: "outputs/ticket-460-browser-evidence/test-results",
  use: {
    baseURL: "http://localhost:4460",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --port 4460 --strictPort",
    url: "http://localhost:4460",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
