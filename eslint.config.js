import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Ignore build + generated artifacts
  globalIgnores(["dist", "coverage"]),

  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z_]", args: "after-used", argsIgnorePattern: "^[A-Z_]" },
      ],
    },
  },

  // Serverless / API routes run in Node
  {
    files: ["api/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Root-level Node config files (executed by their own tooling, not the browser bundle)
  {
    files: ["playwright.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Vitest (tests)
  {
    files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest, // describe/test/expect...
        vi: "readonly",
      },
    },
  },

  // Test-support loader for the deployed Apps Script core (#395) — Node-only,
  // never deployed itself (see google-apps-script/decision-quiz/loadCore.js).
  {
    files: ["google-apps-script/decision-quiz/loadCore.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // The actual deployed Apps Script source for the #395 decision quiz
  // backend (core.js/adapter.js). Neither browser nor Node globals apply —
  // these run in the Apps Script V8 sandbox. doPost/doGet are entry points
  // invoked by the Apps Script platform itself, never called from within
  // this project, so they are exempted from no-unused-vars here only.
  {
    files: ["google-apps-script/decision-quiz/core.js", "google-apps-script/decision-quiz/adapter.js"],
    rules: {
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^(doGet|doPost|[A-Z_])", args: "after-used", argsIgnorePattern: "^[A-Z_]" },
      ],
    },
  },
  {
    files: ["google-apps-script/decision-quiz/adapter.js"],
    languageOptions: {
      globals: {
        PropertiesService: "readonly",
        SpreadsheetApp: "readonly",
        LockService: "readonly",
        ContentService: "readonly",
        DecisionQuizCore: "readonly",
      },
    },
  },
]);
