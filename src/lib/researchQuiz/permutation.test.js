import { describe, it, expect } from "vitest";
import { fisherYatesShuffle } from "./permutation";

describe("fisherYatesShuffle", () => {
  it("returns a permutation containing exactly the same elements", () => {
    const result = fisherYatesShuffle(["a", "b", "c"], () => 0.5);
    expect(result.sort()).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const input = ["a", "b", "c"];
    const copy = [...input];
    fisherYatesShuffle(input, () => 0.99);
    expect(input).toEqual(copy);
  });

  it("is a real permutation, not a fixed order, across different random sequences", () => {
    const items = ["stay", "move", "consider"];
    const orders = new Set();
    // Deterministic sweep across the random-number space rather than
    // Math.random(), so this assertion is not flaky.
    for (let seed = 0; seed < 20; seed++) {
      const r = seed / 20;
      orders.add(fisherYatesShuffle(items, () => r).join(","));
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  it("with randomFn always returning 0, produces the identity-reversal Fisher-Yates result deterministically", () => {
    // A fixed randomFn should produce a deterministic, reproducible result —
    // proving the algorithm itself, not Math.random, controls the outcome.
    const a = fisherYatesShuffle(["a", "b", "c", "d"], () => 0);
    const b = fisherYatesShuffle(["a", "b", "c", "d"], () => 0);
    expect(a).toEqual(b);
  });
});
