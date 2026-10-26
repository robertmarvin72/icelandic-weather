// Ticket #444 — getTmaxWindowCompleteness had no test file before this
// ticket (it's new this round). This does not test any ranking/scoring
// change — the function only decides whether the CARD may show the
// existing engine metrics.avgTemp, never computes a replacement value.
import { describe, it, expect } from "vitest";
import { getTmaxWindowCompleteness } from "./weatherFinderDisplay";

function rows(tmaxValues) {
  return tmaxValues.map((tmax) => ({ tmax }));
}

describe("getTmaxWindowCompleteness", () => {
  it("complete daily maxima [2,2,2,10] over 4 rows, days=4 -> complete, windowLength 4", () => {
    expect(getTmaxWindowCompleteness(rows([2, 2, 2, 10]), 4)).toEqual({
      complete: true,
      windowLength: 4,
    });
  });

  it("missing middle [10,null,10], days=3 -> incomplete", () => {
    expect(getTmaxWindowCompleteness(rows([10, null, 10]), 3)).toEqual({
      complete: false,
      windowLength: 3,
    });
  });

  it("all missing, days=3 -> incomplete", () => {
    expect(getTmaxWindowCompleteness(rows([null, null, null]), 3)).toEqual({
      complete: false,
      windowLength: 3,
    });
  });

  it("short window (fewer rows than days) -> incomplete", () => {
    expect(getTmaxWindowCompleteness(rows([10, 10]), 3)).toEqual({
      complete: false,
      windowLength: 3,
    });
  });

  it("missing/undefined row (array shorter than windowLength via a hole) -> incomplete, not a crash", () => {
    const sparse = [{ tmax: 10 }, undefined, { tmax: 10 }];
    expect(getTmaxWindowCompleteness(sparse, 3)).toEqual({ complete: false, windowLength: 3 });
  });

  it("genuinely sparse array (a real hole, not an explicit undefined element) is not silently passed", () => {
    const sparse = new Array(3);
    sparse[0] = { tmax: 10 };
    sparse[2] = { tmax: 10 };
    // sparse[1] is a true hole — Array.prototype.every would skip it silently.
    expect(getTmaxWindowCompleteness(sparse, 3)).toEqual({ complete: false, windowLength: 3 });
  });

  it("NaN/Infinity/string tmax values -> incomplete", () => {
    expect(getTmaxWindowCompleteness(rows([10, NaN, 10]), 3)).toEqual({
      complete: false,
      windowLength: 3,
    });
    expect(getTmaxWindowCompleteness(rows([10, Infinity, 10]), 3)).toEqual({
      complete: false,
      windowLength: 3,
    });
    expect(getTmaxWindowCompleteness(rows([10, "10", 10]), 3)).toEqual({
      complete: false,
      windowLength: 3,
    });
  });

  it("[0, -5, 2] remains valid — 0 and negative temperatures are legitimate, not missing", () => {
    expect(getTmaxWindowCompleteness(rows([0, -5, 2]), 3)).toEqual({
      complete: true,
      windowLength: 3,
    });
  });

  it("later out-of-window rows are ignored even when invalid", () => {
    const withTrailingGarbage = [{ tmax: 10 }, { tmax: 12 }, { tmax: null }, { tmax: NaN }];
    expect(getTmaxWindowCompleteness(withTrailingGarbage, 2)).toEqual({
      complete: true,
      windowLength: 2,
    });
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["0", 0],
    ["negative", -3],
    ["non-integer", 2.5],
    ["string", "3"],
    ["NaN", NaN],
  ])("invalid days (%s) fails closed to incomplete with windowLength null, never the engine's whole-array fallback", (_label, days) => {
    expect(getTmaxWindowCompleteness(rows([10, 10, 10]), days)).toEqual({
      complete: false,
      windowLength: null,
    });
  });

  it("non-array forecastRows -> incomplete, does not throw", () => {
    expect(getTmaxWindowCompleteness(null, 3)).toEqual({ complete: false, windowLength: 3 });
    expect(getTmaxWindowCompleteness(undefined, 3)).toEqual({ complete: false, windowLength: 3 });
  });

  it("does not mutate the input array", () => {
    const input = Object.freeze(rows([2, 2, 2, 10]).map((r) => Object.freeze(r)));
    expect(() => getTmaxWindowCompleteness(input, 4)).not.toThrow();
  });
});
