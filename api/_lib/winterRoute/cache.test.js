// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRoadData, getForecastData, __resetWinterRouteCacheForTests, ROAD_TTL_MS, ROAD_MAX_STALE_MS } from "./cache.js";

beforeEach(() => {
  __resetWinterRouteCacheForTests();
});

describe("getRoadData — TTL, single-flight coalescing, stale fallback", () => {
  it("serves the cached value within the TTL without calling the fetcher again", async () => {
    let clock = 0;
    const now = () => clock;
    const fetcher = vi.fn().mockResolvedValue({ ok: true, value: "A" });

    const first = await getRoadData(fetcher, { now });
    expect(first.value).toBe("A");
    expect(fetcher).toHaveBeenCalledTimes(1);

    clock += ROAD_TTL_MS - 1;
    const second = await getRoadData(fetcher, { now });
    expect(second.value).toBe("A");
    expect(second.stale).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refetches once the TTL has expired", async () => {
    let clock = 0;
    const now = () => clock;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: "A" })
      .mockResolvedValueOnce({ ok: true, value: "B" });

    await getRoadData(fetcher, { now });
    clock += ROAD_TTL_MS + 1;
    const second = await getRoadData(fetcher, { now });

    expect(second.value).toBe("B");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent calls into a single upstream fetch", async () => {
    let clock = 0;
    const now = () => clock;
    let resolveFetch;
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const p1 = getRoadData(fetcher, { now });
    const p2 = getRoadData(fetcher, { now });
    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveFetch({ ok: true, value: "shared" });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.value).toBe("shared");
    expect(r2.value).toBe("shared");
  });

  it("falls back to last-known-good, marked stale with a real age, when a refresh fails within the max-stale window", async () => {
    let clock = 0;
    const now = () => clock;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: "A" })
      .mockResolvedValueOnce({ ok: false, reason: "upstream_error" });

    await getRoadData(fetcher, { now });
    clock += ROAD_TTL_MS + 1000;
    const second = await getRoadData(fetcher, { now });

    expect(second.value).toBe("A");
    expect(second.stale).toBe(true);
    expect(second.cacheAgeMs).toBe(ROAD_TTL_MS + 1000);
  });

  it("reports unavailable once the last-known-good exceeds the max-stale bound — never served as if open/good", async () => {
    let clock = 0;
    const now = () => clock;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: "A" })
      .mockResolvedValueOnce({ ok: false, reason: "upstream_error" });

    await getRoadData(fetcher, { now });
    clock += ROAD_MAX_STALE_MS + 1000;
    const second = await getRoadData(fetcher, { now });

    expect(second.ok).toBe(false);
    expect(second.value).toBeUndefined();
  });

  it("road and forecast buckets are independent", async () => {
    const roadFetcher = vi.fn().mockResolvedValue({ ok: true, value: "road" });
    const forecastFetcher = vi.fn().mockResolvedValue({ ok: true, value: "forecast" });

    const road = await getRoadData(roadFetcher);
    const forecast = await getForecastData(forecastFetcher);

    expect(road.value).toBe("road");
    expect(forecast.value).toBe("forecast");
  });
});
