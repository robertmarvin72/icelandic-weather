// Ticket 401 (#401) — explicit value assertions so a future edit that
// nudges one threshold cannot silently drag the other along with it.
import { describe, it, expect } from "vitest";
import { AURORA_FRESH_MAX_AGE_MINUTES, AURORA_STALE_MAX_AGE_MINUTES } from "./constants.js";

describe("Aurora freshness thresholds", () => {
  it("AURORA_FRESH_MAX_AGE_MINUTES is exactly 480 (8h)", () => {
    expect(AURORA_FRESH_MAX_AGE_MINUTES).toBe(480);
  });

  it("AURORA_STALE_MAX_AGE_MINUTES is exactly 1440 (24h), unchanged by Ticket 401", () => {
    expect(AURORA_STALE_MAX_AGE_MINUTES).toBe(1440);
  });
});
