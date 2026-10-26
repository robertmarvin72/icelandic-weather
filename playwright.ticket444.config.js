import { defineConfig, devices } from "@playwright/test";

// Ticket #444 — browser acceptance must run against the actual PRODUCTION
// build (`vite preview`, serving the just-built dist/), reusing the same
// pattern established for ticket #460 (playwright.ticket460.config.js):
// every /api/* response is fully mocked via page.route(), so the dev-vs-
// preview server choice doesn't matter for correctness, only for fidelity
// to the real bundle.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["temperature-display-ticket-444.spec.js"],
  fullyParallel: false,
  reporter: "list",
  outputDir: "outputs/ticket-444-browser-evidence/test-results",
  use: {
    baseURL: "http://localhost:4444",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --port 4444 --strictPort",
    url: "http://localhost:4444",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
