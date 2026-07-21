/**
 * Model v1.0 edge-case runner.
 * Adapted from template: fixed import depth and paths for running via
 * `npx vitest run tests/04_Edge_Cases/Runner_Templates/model-v1-edge-cases.test.js`
 * from the project root (vitest.config.js include does not cover tests/).
 *
 * Malformed-input cases (EC-190–EC-193, expected_type="review") are executed
 * in a separate describe block. Their actual behavior is recorded with
 * run_status="Review" and they do not count as failures.
 */
import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Paths relative to project root (where vitest is always invoked from)
const ROOT = process.cwd();
const RESULTS_DIR = path.resolve(ROOT, "tests/04_Edge_Cases/Results");

import {
  basePointsFromTemp,
  windPenaltyPoints,
  rainPenaltyPoints,
  gustPenaltyPoints,
  pointsToClass,
  getSkyComfortModifier,
  getColdWindPenalty,
  getWintryPrecipPenalty,
  rainStreakPenaltyPoints,
  scoreSiteDay,
} from "../../../src/lib/scoring.js";

const vectorPath = path.resolve(ROOT, "tests/04_Edge_Cases/Test_Vectors/model_v1_edge_cases.json");
const payload = JSON.parse(fs.readFileSync(vectorPath, "utf8"));
const results = [];

function runVector(t) {
  switch (t.function) {
    case "basePointsFromTemp":
      return basePointsFromTemp(t.tmax, t.season);
    case "scoreSiteDay.basePts": {
      const result = scoreSiteDay({
        date: t.season === "winter" ? "2026-01-15" : "2026-07-15",
        tmax: t.tmax,
        windMax: 0,
        windGust: 0,
        rain: 0,
        weatherCode: 2,
      });
      return result.breakdown?.basePts ?? result.basePts;
    }
    case "windPenaltyPoints":
      return windPenaltyPoints(t.windMax, t.season);
    case "rainPenaltyPoints":
      return rainPenaltyPoints(t.rain);
    case "gustPenaltyPoints":
      return gustPenaltyPoints(t.gust, t.windMax, t.season);
    case "pointsToClass":
      return pointsToClass(t.points);
    case "getSkyComfortModifier":
      return getSkyComfortModifier(t.weatherCode);
    case "getColdWindPenalty":
      return getColdWindPenalty(t.tmax, t.windMax);
    case "getWintryPrecipPenalty":
      return getWintryPrecipPenalty(t.weatherCode, t.tmax);
    case "rainStreakPenaltyPoints":
      return rainStreakPenaltyPoints(t.points);
    case "round1":
      return Math.round(Number(t.notes.match(/input=([-0-9.]+)/)?.[1]) * 10) / 10;
    case "scoreSiteDay":
      return scoreSiteDay({
        date: t.season === "winter" ? "2026-01-15" : "2026-07-15",
        tmax: t.tmax,
        windMax: t.windMax,
        windGust: t.gust,
        rain: t.rain,
        weatherCode: t.weatherCode,
      });
    default:
      throw new Error(`Unsupported function: ${t.function}`);
  }
}

// ── Literal inputs for malformed-input cases (cannot be serialised in JSON) ──
const MALFORMED_LITERALS = {
  "EC-190": { call: () => basePointsFromTemp("12", null),   label: 'basePointsFromTemp("12", null)' },
  "EC-191": { call: () => windPenaltyPoints(NaN, null),      label: "windPenaltyPoints(NaN, null)" },
  "EC-192": { call: () => rainPenaltyPoints(Infinity),       label: "rainPenaltyPoints(Infinity)" },
  "EC-193": { call: () => getSkyComfortModifier({}),         label: "getSkyComfortModifier({})" },
};

// ── Normal test cases ────────────────────────────────────────────────────────
const normalTests = payload.tests.filter((t) => t.expected_type !== "review");
const reviewTests = payload.tests.filter((t) => t.expected_type === "review");

describe("Model v1.0 edge cases", () => {
  for (const t of normalTests) {
    it(`${t.test_id} ${t.description}`, () => {
      const started = performance.now();
      let actual;
      let status = "Pass";
      let error = null;

      try {
        actual = runVector(t);

        if (t.expected_type === "object") {
          expect(actual.points).toBe(t.expected.points);
          expect(actual.finalClass ?? actual.class).toBe(t.expected.class);
          if (actual.pointsRaw !== undefined) {
            expect(actual.pointsRaw).toBe(t.expected.pointsRaw);
          }
        } else {
          expect(actual).toEqual(t.expected);
        }
      } catch (err) {
        status = "Fail";
        error = String(err?.stack ?? err);
        throw err;
      } finally {
        results.push({
          test_id: t.test_id,
          group: t.group,
          function: t.function,
          description: t.description,
          expected: t.expected,
          actual_result: t.expected_type === "object" && actual != null
            ? { points: actual.points, class: actual.finalClass ?? actual.class, pointsRaw: actual.pointsRaw }
            : actual,
          run_status: status,
          runtime_ms: Number((performance.now() - started).toFixed(3)),
          error_message: error,
          executed_at: new Date().toISOString(),
          commit: payload.commit,
          tags: t.tags,
        });
      }
    });
  }
});

// ── Malformed-input cases (executed separately, recorded as Review) ───────
describe("Model v1.0 malformed inputs [Review]", () => {
  for (const t of reviewTests) {
    it(`${t.test_id} ${t.description}`, () => {
      const started = performance.now();
      const entry = MALFORMED_LITERALS[t.test_id];
      let actual;
      let errorMsg = null;

      try {
        if (entry) {
          actual = entry.call();
        } else {
          actual = runVector(t);
        }
      } catch (err) {
        actual = `THROWS: ${err?.message ?? String(err)}`;
        errorMsg = String(err?.stack ?? err);
      }

      results.push({
        test_id: t.test_id,
        group: t.group,
        function: t.function,
        description: t.description,
        expected: t.expected,
        actual_result: actual,
        run_status: "Review",
        notes: entry
          ? `Literal call: ${entry.label}`
          : `JSON input (null) used — literal value not JSON-serialisable`,
        runtime_ms: Number((performance.now() - started).toFixed(3)),
        error_message: errorMsg,
        executed_at: new Date().toISOString(),
        commit: payload.commit,
        tags: t.tags,
      });

      // Do NOT throw — Review cases are informational only
      console.log(
        `  [Review] ${t.test_id} ${t.description}: actual = ${JSON.stringify(actual)}`
      );
    });
  }
});

// ── Flush results after all tests ────────────────────────────────────────────
afterAll(() => {
  const out = path.resolve(RESULTS_DIR, "edge_case_results.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\n✓ Results written → ${out}`);
  console.log(`  Total: ${results.length} | Pass: ${results.filter(r => r.run_status === "Pass").length} | Fail: ${results.filter(r => r.run_status === "Fail").length} | Review: ${results.filter(r => r.run_status === "Review").length}`);
});
