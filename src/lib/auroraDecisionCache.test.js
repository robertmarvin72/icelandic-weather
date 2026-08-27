import { describe, it, expect, beforeEach, vi } from "vitest";
import { getOrCreateAuroraDecision, invalidateAuroraDecision, clearAuroraDecisionCache } from "./auroraDecisionCache";

beforeEach(() => clearAuroraDecisionCache());

describe("getOrCreateAuroraDecision — in-flight reuse", () => {
  it("returns the SAME promise for the same key while the first call is still pending", () => {
    const factory = vi.fn(() => new Promise(() => {})); // never resolves
    const p1 = getOrCreateAuroraDecision("k1", factory);
    const p2 = getOrCreateAuroraDecision("k1", factory);
    expect(p1).toBe(p2);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("creates a fresh promise for a different key", () => {
    const factory = vi.fn(() => new Promise(() => {}));
    getOrCreateAuroraDecision("k1", factory);
    getOrCreateAuroraDecision("k2", factory);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe("getOrCreateAuroraDecision — bounded recently-resolved reuse", () => {
  it("returns the same (already-resolved) promise for a repeat call within the reuse window", async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });
    const p1 = getOrCreateAuroraDecision("k1", factory);
    await p1;
    const p2 = getOrCreateAuroraDecision("k1", factory);
    expect(factory).toHaveBeenCalledTimes(1);
    await expect(p2).resolves.toEqual({ ok: true });
  });
});

describe("invalidateAuroraDecision — explicit retry bypass", () => {
  it("forces exactly one fresh call after invalidation", async () => {
    const factory = vi.fn().mockResolvedValue({ ok: true });
    await getOrCreateAuroraDecision("k1", factory);
    invalidateAuroraDecision("k1");
    getOrCreateAuroraDecision("k1", factory);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe("getOrCreateAuroraDecision — failure does not poison future attempts", () => {
  it("allows a fresh call after a rejected promise for the same key", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("network down"));
    const succeeding = vi.fn().mockResolvedValue({ ok: true });

    await getOrCreateAuroraDecision("k1", failing).catch(() => {});
    // microtask flush so the internal .catch() cleanup runs
    await Promise.resolve();
    await Promise.resolve();

    await getOrCreateAuroraDecision("k1", succeeding);
    expect(succeeding).toHaveBeenCalledTimes(1);
  });
});
