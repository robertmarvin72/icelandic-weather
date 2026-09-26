import { describe, it, expect } from "vitest";
import {
  AURORA_CLIENT_FRESH_MAX_AGE_MINUTES,
  AURORA_CLIENT_STALE_MAX_AGE_MINUTES,
  classifyAuroraAge,
  applyClientFreshness,
  nextFreshnessBoundaries,
} from "./auroraFreshnessPolicy";
// Test-only imports of the server policy, to prove parity without bundling
// server code into the frontend.
import { AURORA_FRESH_MAX_AGE_MINUTES, AURORA_STALE_MAX_AGE_MINUTES } from "../../api/_lib/auroraDecision/constants";
import { classifyAuroraCache } from "../../api/_lib/auroraDecision/freshness";

const FETCHED = "2026-09-25T10:00:00.000Z";
const FETCHED_MS = Date.parse(FETCHED);
const MIN = 60000;

describe("client freshness policy — parity with the server policy", () => {
  it("uses exactly the server's fresh/stale constants", () => {
    expect(AURORA_CLIENT_FRESH_MAX_AGE_MINUTES).toBe(AURORA_FRESH_MAX_AGE_MINUTES);
    expect(AURORA_CLIENT_STALE_MAX_AGE_MINUTES).toBe(AURORA_STALE_MAX_AGE_MINUTES);
  });

  it("classifies identically to the server's classifyAuroraCache at and around every boundary", () => {
    const offsetsMs = [
      -5 * MIN, // future clock skew
      0,
      479 * MIN,
      480 * MIN,
      480 * MIN + 1,
      481 * MIN,
      1439 * MIN,
      1440 * MIN,
      1440 * MIN + 1,
      2000 * MIN,
    ];
    for (const offset of offsetsMs) {
      const now = new Date(FETCHED_MS + offset);
      const server = classifyAuroraCache({ snapshot: { nights: [] }, source_fetched_at: FETCHED }, now);
      const client = classifyAuroraAge(FETCHED, now.getTime());
      expect(client.state, `offset ${offset}ms`).toBe(server.state);
    }
  });

  it("missing or malformed timestamps are unavailable, exactly like the server", () => {
    for (const bad of [null, undefined, "", "not-a-date", 42]) {
      expect(classifyAuroraAge(bad, FETCHED_MS).state).toBe("unavailable");
    }
  });
});

describe("applyClientFreshness", () => {
  function result(primary = "success", sourceFetchedAt = FETCHED) {
    return { primary, freshness: "fresh", body: { auroraCache: { state: "fresh", sourceFetchedAt }, best: { band: "good" } } };
  }

  it("keeps a fresh result usable and untouched", () => {
    const c = result();
    const out = applyClientFreshness(c, FETCHED_MS + 480 * MIN);
    expect(out.primary).toBe("success");
    expect(out.freshness).toBe("fresh");
    expect(out.body).toBe(c.body); // response never mutated/copied
  });

  it("downgrades a result to stale exactly one millisecond past the fresh boundary, keeping it usable", () => {
    const out = applyClientFreshness(result(), FETCHED_MS + 480 * MIN + 1);
    expect(out.primary).toBe("success");
    expect(out.freshness).toBe("stale");
  });

  it("turns an over-age result into an explicit expired unavailable state with no body (out of ranking/map/comparison)", () => {
    const out = applyClientFreshness(result("partial"), FETCHED_MS + 1440 * MIN + 1);
    expect(out).toMatchObject({ primary: "domain_unavailable", freshness: "unavailable", expired: true, body: null, sourceFetchedAt: FETCHED });
  });

  it("a usable result with a missing/malformed timestamp can never be fresh", () => {
    for (const bad of [null, "garbage"]) {
      const out = applyClientFreshness(result("success", bad), FETCHED_MS);
      expect(out.expired).toBe(true);
      expect(out.freshness).toBe("unavailable");
    }
  });

  it("leaves non-result classifications and null unchanged", () => {
    const noDark = { primary: "no_darkness", freshness: "fresh", body: {} };
    expect(applyClientFreshness(noDark, FETCHED_MS + 9999 * MIN)).toBe(noDark);
    expect(applyClientFreshness(null, FETCHED_MS)).toBeNull();
  });
});

describe("nextFreshnessBoundaries", () => {
  it("returns only strictly-future boundaries just past each inclusive limit", () => {
    expect(nextFreshnessBoundaries(FETCHED, FETCHED_MS)).toEqual([FETCHED_MS + 480 * MIN + 1, FETCHED_MS + 1440 * MIN + 1]);
    expect(nextFreshnessBoundaries(FETCHED, FETCHED_MS + 500 * MIN)).toEqual([FETCHED_MS + 1440 * MIN + 1]);
    expect(nextFreshnessBoundaries(FETCHED, FETCHED_MS + 2000 * MIN)).toEqual([]);
    expect(nextFreshnessBoundaries("bad", FETCHED_MS)).toEqual([]);
  });
});
