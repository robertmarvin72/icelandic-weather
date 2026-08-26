import { describe, it, expect } from "vitest";
import { validateAuroraDecisionBody } from "./validateRequest.js";

describe("validateAuroraDecisionBody", () => {
  it("accepts a valid body and deduplicates location IDs", () => {
    const result = validateAuroraDecisionBody({ evening: "2026-08-24", locationIds: ["a", "b", "a"] });
    expect(result).toEqual({ ok: true, evening: "2026-08-24", locationIds: ["a", "b"] });
  });

  it("rejects a malformed body (not an object)", () => {
    expect(validateAuroraDecisionBody(null).code).toBe("invalid_body");
    expect(validateAuroraDecisionBody("x").code).toBe("invalid_body");
    expect(validateAuroraDecisionBody(["a"]).code).toBe("invalid_body");
  });

  it("rejects a malformed evening date", () => {
    expect(validateAuroraDecisionBody({ evening: "24-08-2026", locationIds: ["a"] }).code).toBe("invalid_evening");
    expect(validateAuroraDecisionBody({ evening: "2026-13-40", locationIds: ["a"] }).code).toBe("invalid_evening");
    expect(validateAuroraDecisionBody({ evening: "2026-02-30", locationIds: ["a"] }).code).toBe("invalid_evening");
    expect(validateAuroraDecisionBody({ locationIds: ["a"] }).code).toBe("invalid_evening");
  });

  it("rejects an empty or non-string-array selection", () => {
    expect(validateAuroraDecisionBody({ evening: "2026-08-24", locationIds: [] }).code).toBe("empty_selection");
    expect(validateAuroraDecisionBody({ evening: "2026-08-24" }).code).toBe("empty_selection");
    expect(validateAuroraDecisionBody({ evening: "2026-08-24", locationIds: [1, 2] }).code).toBe("empty_selection");
    expect(validateAuroraDecisionBody({ evening: "2026-08-24", locationIds: ["a", ""] }).code).toBe(
      "empty_selection",
    );
  });

  it("rejects too many locations, enforced after deduplication", () => {
    const ids = Array.from({ length: 9 }, (_, i) => `loc-${i}`);
    expect(validateAuroraDecisionBody({ evening: "2026-08-24", locationIds: ids }).code).toBe("too_many_locations");

    const eightUnique = Array.from({ length: 8 }, (_, i) => `loc-${i}`);
    expect(validateAuroraDecisionBody({ evening: "2026-08-24", locationIds: eightUnique }).ok).toBe(true);

    const duplicatedDownToEight = [...eightUnique, ...eightUnique, "loc-0"];
    expect(validateAuroraDecisionBody({ evening: "2026-08-24", locationIds: duplicatedDownToEight }).ok).toBe(true);
  });

  it("ignores client-supplied tier/entitlement/ranking fields entirely", () => {
    const withExtras = validateAuroraDecisionBody({
      evening: "2026-08-24",
      locationIds: ["a"],
      tier: "pro",
      isPro: true,
      ranking: ["a"],
    });
    expect(withExtras).toEqual({ ok: true, evening: "2026-08-24", locationIds: ["a"] });
  });
});
