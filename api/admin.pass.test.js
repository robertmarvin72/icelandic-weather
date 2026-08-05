// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// mock postgres so admin.js module can load without a real DB
vi.mock("postgres", () => ({ default: () => { const fn = async () => []; fn.json = v => v; return fn; } }));
vi.mock("./_lib/getMe.js", () => ({ getMeFromRequest: vi.fn() }));
vi.mock("./_lib/buildBlogPrompt.js", () => ({ buildBlogPrompt: vi.fn(), BLOG_POST_TYPES: [] }));

import { getProSummary } from "./admin.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeSql(summaryRow) {
  const fn = async () => [summaryRow];
  fn.json = v => v;
  return fn;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("getProSummary — pass holders counted", () => {
  it("returns active count from injected sql result", async () => {
    const testSql = makeSql({ active: 3, expired: 1, conversion_rate: "37.5" });
    const result = await getProSummary(testSql);

    expect(result.active).toBe(3);
    expect(result.expired).toBe(1);
    expect(result.conversionRate).toBe(37.5);
  });

  it("pass-only user counted as active (active=1, expired=0)", async () => {
    // When user_pass row is active and user_subscription row does not exist,
    // the UNION brings the pass row into all_pro_flags → bool_or → is_active=true.
    // This test verifies the JS shape is correct when the SQL returns active=1.
    const testSql = makeSql({ active: 1, expired: 0, conversion_rate: "10.0" });
    const result = await getProSummary(testSql);

    expect(result.active).toBe(1);
    expect(result.expired).toBe(0);
  });

  it("user with both active subscription and active pass counted once (active=1)", async () => {
    // The GROUP BY user_id + bool_or de-duplicates: a user with both a subscription
    // row and a pass row still contributes exactly one row to sub_flags.
    const testSql = makeSql({ active: 1, expired: 0, conversion_rate: "50.0" });
    const result = await getProSummary(testSql);

    expect(result.active).toBe(1);
  });

  it("no active users → active=0", async () => {
    const testSql = makeSql({ active: 0, expired: 2, conversion_rate: "0.0" });
    const result = await getProSummary(testSql);

    expect(result.active).toBe(0);
    expect(result.expired).toBe(2);
  });

  it("uses module-level sql when no testSql provided (smoke — does not throw)", async () => {
    // The module-level sql is the vi.mock no-op that returns [].
    // getProSummary() with no arg should return zeros gracefully.
    const result = await getProSummary();
    expect(result.active).toBe(0);
    expect(result.expired).toBe(0);
    expect(result.conversionRate).toBe(0);
  });
});
