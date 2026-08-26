import { describe, it, expect } from "vitest";
import { resolveLocationIds } from "./resolveLocations.js";

const CANONICAL = [
  { id: "loc-a", name: "A", lat: 64.1, lon: -21.9 },
  { id: "loc-b", name: "B", lat: 65.2, lon: -18.5 },
];

describe("resolveLocationIds", () => {
  it("resolves known IDs to their canonical records, never trusting client-supplied lat/lon/name", () => {
    const { resolved, unknownIds } = resolveLocationIds(["loc-a"], CANONICAL);
    expect(resolved).toEqual([{ id: "loc-a", name: "A", lat: 64.1, lon: -21.9 }]);
    expect(unknownIds).toEqual([]);
  });

  it("reports unknown IDs separately from resolved ones", () => {
    const { resolved, unknownIds } = resolveLocationIds(["loc-a", "loc-ghost"], CANONICAL);
    expect(resolved.map((l) => l.id)).toEqual(["loc-a"]);
    expect(unknownIds).toEqual(["loc-ghost"]);
  });

  it("preserves input order in the resolved list", () => {
    const { resolved } = resolveLocationIds(["loc-b", "loc-a"], CANONICAL);
    expect(resolved.map((l) => l.id)).toEqual(["loc-b", "loc-a"]);
  });
});
