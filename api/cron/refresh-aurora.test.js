// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("postgres", () => ({
  default: () => {
    const fn = async () => [];
    fn.json = (v) => v;
    return fn;
  },
}));

vi.mock("../_lib/aurora/cache.js", () => ({
  claimAuroraRefreshLease: vi.fn(),
  releaseAuroraRefreshLease: vi.fn(),
  persistAuroraSnapshot: vi.fn(),
}));

vi.mock("../_lib/aurora/fetchAurora.js", () => ({
  fetchAuroraXml: vi.fn(),
}));

import { claimAuroraRefreshLease, releaseAuroraRefreshLease, persistAuroraSnapshot } from "../_lib/aurora/cache.js";
import { fetchAuroraXml } from "../_lib/aurora/fetchAurora.js";
import handler from "./refresh-aurora.js";

const CRON_SECRET = "test-cron-secret";
const SAMPLE_XML = `<?xml version="1.0"?><aurora><night_data><evening_date>2026-08-24</evening_date><activity_forecast>2</activity_forecast><sun><sunset>21:13</sunset><darkness>22:10</darkness><dawn>04:52</dawn><sunrise>05:49</sunrise></sun><moon><age>12</age><schedule_type>4</schedule_type><schedule_description>x</schedule_description><moonrise>21:39</moonrise><moonset>00:41</moonset></moon></night_data></aurora>`;

function makeReq(authHeader) {
  return { headers: authHeader !== undefined ? { authorization: authHeader } : {} };
}

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = CRON_SECRET;
  releaseAuroraRefreshLease.mockResolvedValue(undefined);
});

describe("refresh-aurora — authentication (must happen before any lease/DB/upstream work)", () => {
  it("valid Bearer auth is allowed through to the claim step", async () => {
    claimAuroraRefreshLease.mockResolvedValue(false); // lease busy — stop right after auth for this test
    const res = makeRes();
    await handler(makeReq(`Bearer ${CRON_SECRET}`), res);

    expect(claimAuroraRefreshLease).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it("missing Authorization header is rejected with 401, no lease claim, no upstream fetch", async () => {
    const res = makeRes();
    await handler(makeReq(undefined), res);

    expect(res.statusCode).toBe(401);
    expect(claimAuroraRefreshLease).not.toHaveBeenCalled();
    expect(fetchAuroraXml).not.toHaveBeenCalled();
  });

  it("an invalid/wrong secret is rejected with 401, no lease claim, no upstream fetch", async () => {
    const res = makeRes();
    await handler(makeReq("Bearer wrong-secret"), res);

    expect(res.statusCode).toBe(401);
    expect(claimAuroraRefreshLease).not.toHaveBeenCalled();
    expect(fetchAuroraXml).not.toHaveBeenCalled();
  });

  it("CRON_SECRET unset in the environment rejects even a Bearer-shaped header", async () => {
    delete process.env.CRON_SECRET;
    const res = makeRes();
    await handler(makeReq("Bearer anything"), res);

    expect(res.statusCode).toBe(401);
    expect(claimAuroraRefreshLease).not.toHaveBeenCalled();
  });
});

describe("refresh-aurora — flow", () => {
  const authedReq = () => makeReq(`Bearer ${CRON_SECRET}`);

  it("success: claim → fetch → parse → persist → 200", async () => {
    claimAuroraRefreshLease.mockResolvedValue(true);
    fetchAuroraXml.mockResolvedValue(SAMPLE_XML);
    persistAuroraSnapshot.mockResolvedValue(undefined);

    const res = makeRes();
    await handler(authedReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.nights).toBe(1);
    expect(persistAuroraSnapshot).toHaveBeenCalledOnce();
    expect(releaseAuroraRefreshLease).not.toHaveBeenCalled(); // persist already clears the lease
  });

  it("lease not acquired: skips cleanly, never calls Vedur.is", async () => {
    claimAuroraRefreshLease.mockResolvedValue(false);

    const res = makeRes();
    await handler(authedReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, skipped: true, reason: "lease_not_acquired" });
    expect(fetchAuroraXml).not.toHaveBeenCalled();
    expect(persistAuroraSnapshot).not.toHaveBeenCalled();
  });

  it("upstream fetch failure: releases the lease, does not persist, returns 500", async () => {
    claimAuroraRefreshLease.mockResolvedValue(true);
    fetchAuroraXml.mockRejectedValue(new Error("Aurora upstream timeout"));

    const res = makeRes();
    await handler(authedReq(), res);

    expect(res.statusCode).toBe(500);
    expect(persistAuroraSnapshot).not.toHaveBeenCalled();
    expect(releaseAuroraRefreshLease).toHaveBeenCalledOnce();
  });

  it("empty/invalid parse result: releases the lease, does not persist (never overwrites last-known-good with garbage)", async () => {
    claimAuroraRefreshLease.mockResolvedValue(true);
    fetchAuroraXml.mockResolvedValue("<not>valid aurora xml</not>");

    const res = makeRes();
    await handler(authedReq(), res);

    expect(res.statusCode).toBe(500);
    expect(persistAuroraSnapshot).not.toHaveBeenCalled();
    expect(releaseAuroraRefreshLease).toHaveBeenCalledOnce();
  });

  it("DB persist failure: releases the lease, returns 500", async () => {
    claimAuroraRefreshLease.mockResolvedValue(true);
    fetchAuroraXml.mockResolvedValue(SAMPLE_XML);
    persistAuroraSnapshot.mockRejectedValue(new Error("connection reset"));

    const res = makeRes();
    await handler(authedReq(), res);

    expect(res.statusCode).toBe(500);
    expect(releaseAuroraRefreshLease).toHaveBeenCalledOnce();
  });
});

describe("refresh-aurora — single-flight concurrency evidence: N attempts → exactly 1 upstream fetch", () => {
  it("20 concurrent invocations where only the atomic claim's first caller succeeds result in exactly one fetchAuroraXml call", async () => {
    // Models exactly what the real `UPDATE ... WHERE (refreshing_until IS
    // NULL OR refreshing_until < now()) RETURNING id` guarantees atomically
    // at the DB level: only the first caller ever gets `true`.
    let claimed = false;
    claimAuroraRefreshLease.mockImplementation(async () => {
      if (claimed) return false;
      claimed = true;
      return true;
    });
    fetchAuroraXml.mockResolvedValue(SAMPLE_XML);
    persistAuroraSnapshot.mockResolvedValue(undefined);

    const results = await Promise.all(
      Array.from({ length: 20 }, () => handler(makeReq(`Bearer ${CRON_SECRET}`), makeRes()))
    );

    expect(fetchAuroraXml).toHaveBeenCalledTimes(1);
    expect(persistAuroraSnapshot).toHaveBeenCalledTimes(1);
    expect(claimAuroraRefreshLease).toHaveBeenCalledTimes(20);
    void results;
  });

  it("a failed fetch does not permanently lock future refreshes — a subsequent claim (post-expiry, modeled here as lease released) succeeds again", async () => {
    claimAuroraRefreshLease.mockResolvedValueOnce(true);
    fetchAuroraXml.mockRejectedValueOnce(new Error("network error"));

    const res1 = makeRes();
    await handler(makeReq(`Bearer ${CRON_SECRET}`), res1);
    expect(res1.statusCode).toBe(500);
    expect(releaseAuroraRefreshLease).toHaveBeenCalledOnce(); // lease released, reclaimable

    // Next tick: lease is free again (release happened), a new attempt can claim it.
    claimAuroraRefreshLease.mockResolvedValueOnce(true);
    fetchAuroraXml.mockResolvedValueOnce(SAMPLE_XML);
    const res2 = makeRes();
    await handler(makeReq(`Bearer ${CRON_SECRET}`), res2);
    expect(res2.statusCode).toBe(200);
  });
});
