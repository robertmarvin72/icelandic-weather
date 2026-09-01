import { describe, it, expect } from "vitest";
import { selectAuroraReasonSummaries } from "./auroraReasonSummaries";

describe("selectAuroraReasonSummaries — deterministic, capped at two", () => {
  it("selects the activity reason first, then the sky reason, regardless of input order", () => {
    expect(selectAuroraReasonSummaries(["clear_sky", "meaningful_activity"])).toEqual([
      "meaningful_activity",
      "clear_sky",
    ]);
    expect(selectAuroraReasonSummaries(["meaningful_activity", "clear_sky"])).toEqual([
      "meaningful_activity",
      "clear_sky",
    ]);
  });

  it("never returns more than two entries even with many supported reasons present", () => {
    const result = selectAuroraReasonSummaries([
      "meaningful_activity",
      "low_activity",
      "clear_sky",
      "partial_cloud",
      "heavy_cloud",
    ]);
    expect(result).toHaveLength(2);
  });

  it("returns one entry when only one category is supported", () => {
    expect(selectAuroraReasonSummaries(["meaningful_activity"])).toEqual(["meaningful_activity"]);
    expect(selectAuroraReasonSummaries(["heavy_cloud"])).toEqual(["heavy_cloud"]);
  });

  it("returns an empty array when no supported reason exists — never fabricates or pads", () => {
    expect(selectAuroraReasonSummaries([])).toEqual([]);
    expect(selectAuroraReasonSummaries(undefined)).toEqual([]);
    expect(selectAuroraReasonSummaries(null)).toEqual([]);
  });

  it("precipitation/moonlight reasons are not summarized into tiles (not 'supported' for this purpose)", () => {
    expect(selectAuroraReasonSummaries(["precipitation_reduced_visibility", "moonlight_reduced_visibility"])).toEqual([]);
  });

  it("picks the highest-priority sky reason when several are present", () => {
    expect(selectAuroraReasonSummaries(["heavy_cloud", "clear_sky", "partial_cloud"])).toEqual(["clear_sky"]);
  });

  it("is a pure function — does not mutate the input array", () => {
    const input = ["clear_sky", "meaningful_activity"];
    const copy = [...input];
    selectAuroraReasonSummaries(input);
    expect(input).toEqual(copy);
  });

  it("repeated calls with the same input produce the same output (deterministic)", () => {
    const input = ["heavy_cloud", "low_activity", "precipitation_reduced_visibility"];
    expect(selectAuroraReasonSummaries(input)).toEqual(selectAuroraReasonSummaries(input));
  });
});
