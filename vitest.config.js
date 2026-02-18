import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setupTests.js"],

    // ✅ Make sure our utility tests are picked up
    include: ["src/**/*.test.js", "src/**/*.spec.js"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",

      // ✅ Only measure relevant source files
      include: [
        "src/utils/**/*.js",
      ],

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
