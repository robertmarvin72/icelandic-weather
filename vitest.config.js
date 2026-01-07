import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setupTests.js"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",

      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.config.*",
        "**/*.d.ts",
        "src/main.jsx",
      ],
    },
  },
});
