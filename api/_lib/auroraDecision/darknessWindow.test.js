import { describe, it, expect } from "vitest";
import { computeNationalDarknessWindow } from "./darknessWindow.js";

describe("computeNationalDarknessWindow", () => {
  it("reconstructs a midnight-crossing window using the hour<12 -> next day rule", () => {
    const night = { eveningDate: "2026-08-24", sun: { darknessStart: "22:00", dawn: "05:00" } };
    expect(computeNationalDarknessWindow(night)).toEqual({
      start: "2026-08-24T22:00:00.000Z",
      end: "2026-08-25T05:00:00.000Z",
    });
  });

  it("returns null when darknessStart or dawn is missing", () => {
    expect(computeNationalDarknessWindow({ eveningDate: "2026-08-24", sun: { darknessStart: null, dawn: "05:00" } })).toBeNull();
    expect(computeNationalDarknessWindow({ eveningDate: "2026-08-24", sun: {} })).toBeNull();
  });

  it("returns null for a non-chronological window rather than fabricating one", () => {
    // Both hours land in the "same day" bucket (>=12), so end would be
    // before start — must not silently produce an inverted window.
    const night = { eveningDate: "2026-08-24", sun: { darknessStart: "23:00", dawn: "13:00" } };
    expect(computeNationalDarknessWindow(night)).toBeNull();
  });
});
