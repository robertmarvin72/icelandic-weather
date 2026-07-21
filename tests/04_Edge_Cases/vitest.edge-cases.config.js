import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setupTests.js"],
    include: ["tests/04_Edge_Cases/Runner_Templates/model-v1-edge-cases.test.js"],
  },
});
