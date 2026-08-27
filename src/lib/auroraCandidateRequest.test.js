import { describe, it, expect } from "vitest";
import { normalizeLocationIds, buildAuroraRequestKey } from "./auroraCandidateRequest";

describe("normalizeLocationIds", () => {
  it("dedupes and sorts into a deterministic canonical order", () => {
    expect(normalizeLocationIds(["b", "a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("produces the same order regardless of input order", () => {
    expect(normalizeLocationIds(["c", "a", "b"])).toEqual(normalizeLocationIds(["a", "b", "c"]));
  });

  it("does not mutate the input array", () => {
    const input = ["b", "a"];
    normalizeLocationIds(input);
    expect(input).toEqual(["b", "a"]);
  });
});

describe("buildAuroraRequestKey", () => {
  it("is identical for the same (evening, locationIds) regardless of input array order/duplicates", () => {
    const a = buildAuroraRequestKey("2026-09-01", ["b", "a", "a"]);
    const b = buildAuroraRequestKey("2026-09-01", ["a", "b"]);
    expect(a).toBe(b);
  });

  it("differs when evening differs", () => {
    const a = buildAuroraRequestKey("2026-09-01", ["a", "b"]);
    const b = buildAuroraRequestKey("2026-09-02", ["a", "b"]);
    expect(a).not.toBe(b);
  });

  it("differs when the ID set differs", () => {
    const a = buildAuroraRequestKey("2026-09-01", ["a", "b"]);
    const b = buildAuroraRequestKey("2026-09-01", ["a", "c"]);
    expect(a).not.toBe(b);
  });
});
