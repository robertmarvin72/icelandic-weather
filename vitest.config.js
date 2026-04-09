import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setupTests.js"],

    // ✅ Make sure our utility tests are picked up
    include: ["src/**/*.test.js", "src/**/*.spec.js", "src/**/*.test.jsx", "src/**/*.spec.jsx"],

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
