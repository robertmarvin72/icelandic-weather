// @vitest-environment node
//
// Ticket 401 (#401) — asserts the deployed cron schedule directly from
// vercel.json (not a copy/re-derivation of it), so a future edit to the
// real deployment config is what this test actually verifies. Vercel Cron
// Jobs run in UTC (no per-project timezone setting exists in vercel.json
// for crons); Iceland observes no DST (UTC+0 year-round), so 08/14/20 UTC
// maps 1:1 to 08:00/14:00/20:00 Reykjavík wall-clock time year-round —
// recorded here and in cc-report.md, not assumed silently.
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vercelConfig = JSON.parse(readFileSync(path.resolve(__dirname, "../../vercel.json"), "utf8"));

function findCron(configPath) {
  return vercelConfig.crons.find((c) => c.path === configPath);
}

describe("vercel.json — cron schedules", () => {
  it("contains exactly one /api/cron/refresh-aurora entry, scheduled 08:00/14:00/20:00 UTC", () => {
    const matches = vercelConfig.crons.filter((c) => c.path === "/api/cron/refresh-aurora");
    expect(matches).toHaveLength(1);
    expect(matches[0].schedule).toBe("0 8,14,20 * * *");
  });

  it("the blog-draft cron is untouched (found by path, not array position)", () => {
    const blogCron = findCron("/api/cron/generate-blog-draft");
    expect(blogCron).toBeDefined();
    expect(blogCron.schedule).toBe("0 8 * * 1");
  });

  it("no cron entry was added or removed", () => {
    expect(vercelConfig.crons).toHaveLength(2);
  });
});
