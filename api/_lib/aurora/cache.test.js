// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  claimAuroraRefreshLease,
  releaseAuroraRefreshLease,
  persistAuroraSnapshot,
  readAuroraSnapshot,
} from "./cache.js";

// Minimal fake `sql` tag matching the `postgres` package's call shape closely
// enough to assert on the query text and drive a scripted response queue —
// same style already used elsewhere in this repo's api/*.test.js files.
function makeSql(responses) {
  const calls = [];
  let idx = 0;

  function sql(strings, ...values) {
    calls.push({ text: strings.join("?"), values });
    const r = responses[idx] ?? [];
    idx++;
    return Promise.resolve(r);
  }
  sql.json = (v) => ({ __json: v });
  sql.calls = calls;
  return sql;
}

describe("claimAuroraRefreshLease", () => {
  it("returns true when the UPDATE claims a row (RETURNING has a row)", async () => {
    const sql = makeSql([[{ id: 1 }]]);
    const claimed = await claimAuroraRefreshLease(sql);
    expect(claimed).toBe(true);
  });

  it("returns false when the UPDATE claims nothing (lease already held)", async () => {
    const sql = makeSql([[]]);
    const claimed = await claimAuroraRefreshLease(sql);
    expect(claimed).toBe(false);
  });

  it("the claim query is a conditional UPDATE ... WHERE ... RETURNING, not a plain UPSERT", () => {
    const sql = makeSql([[{ id: 1 }]]);
    claimAuroraRefreshLease(sql);
    const text = sql.calls[0].text;
    expect(text).toMatch(/UPDATE aurora_forecast_cache/i);
    expect(text).toMatch(/WHERE id = 1/i);
    expect(text).toMatch(/refreshing_until IS NULL OR refreshing_until < now\(\)/i);
    expect(text).toMatch(/RETURNING id/i);
    expect(text).not.toMatch(/ON CONFLICT/i);
  });
});

describe("releaseAuroraRefreshLease", () => {
  it("clears refreshing_until without touching snapshot columns", async () => {
    const sql = makeSql([[]]);
    await releaseAuroraRefreshLease(sql);
    const text = sql.calls[0].text;
    expect(text).toMatch(/SET\s*refreshing_until = NULL/i);
    expect(text).not.toMatch(/snapshot/i);
  });
});

describe("persistAuroraSnapshot", () => {
  it("writes the snapshot, source_fetched_at, and clears the lease in one UPDATE", async () => {
    const sql = makeSql([[]]);
    await persistAuroraSnapshot(sql, {
      nights: [{ eveningDate: "2026-08-24" }],
      sourceFetchedAt: "2026-08-24T17:00:00Z",
    });
    const text = sql.calls[0].text;
    expect(text).toMatch(/UPDATE aurora_forecast_cache/i);
    expect(text).toMatch(/snapshot = /i);
    expect(text).toMatch(/source_fetched_at = /i);
    expect(text).toMatch(/refreshing_until = NULL/i);
    expect(text).toMatch(/WHERE id = 1/i);
  });

  it("wraps the nights array in a { nights } object for forward-compatible JSONB shape", async () => {
    const sql = makeSql([[]]);
    await persistAuroraSnapshot(sql, {
      nights: [{ eveningDate: "2026-08-24" }],
      sourceFetchedAt: "2026-08-24T17:00:00Z",
    });
    const jsonArg = sql.calls[0].values.find((v) => v && v.__json);
    expect(jsonArg.__json).toEqual({ nights: [{ eveningDate: "2026-08-24" }] });
  });
});

describe("readAuroraSnapshot", () => {
  it("returns the row when present", async () => {
    const row = { snapshot: { nights: [] }, source_fetched_at: "2026-08-24T17:00:00Z" };
    const sql = makeSql([[row]]);
    const result = await readAuroraSnapshot(sql);
    expect(result).toEqual(row);
  });

  it("returns null when the singleton row is absent", async () => {
    const sql = makeSql([[]]);
    const result = await readAuroraSnapshot(sql);
    expect(result).toBeNull();
  });
});
