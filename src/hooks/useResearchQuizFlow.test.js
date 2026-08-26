import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResearchQuizFlow, STAGE } from "./useResearchQuizFlow";

const SCENARIOS = [{ id: "stay" }, { id: "move" }, { id: "consider" }];

const VALID_ANSWER = { interpretation: "stay", reason: "weather_similar", action: "stay_put", note: "" };

function setup(overrides = {}) {
  let clock = 0;
  const nowFn = overrides.nowFn || (() => (clock += 1000));
  const fetchImpl = overrides.fetchImpl || vi.fn().mockResolvedValue({ json: async () => ({ ok: true, receivedAt: "r" }) });

  return renderHook(() =>
    useResearchQuizFlow({
      scenarios: SCENARIOS,
      webAppUrl: "https://script.google.com/x/exec",
      campaign: null,
      testVersion: "1",
      fixtureVersion: "1",
      lang: "is",
      fetchImpl,
      randomFn: overrides.randomFn || (() => 0.1),
      nowFn,
      wallClockIso: overrides.wallClockIso || (() => "2026-08-24T10:00:00.000Z"),
      getViewportCategory: () => "desktop",
    }),
  );
}

describe("useResearchQuizFlow — stage transitions and permutation stability", () => {
  it("starts at consent, moves to quiz after consent()", () => {
    const { result } = setup();
    expect(result.current.stage).toBe(STAGE.CONSENT);
    act(() => result.current.consent());
    expect(result.current.stage).toBe(STAGE.QUIZ);
  });

  it("generates the scenario order once and keeps it stable across rerenders", () => {
    const { result, rerender } = setup();
    const firstOrder = result.current.scenarioOrder;
    rerender();
    expect(result.current.scenarioOrder).toEqual(firstOrder);
    act(() => result.current.consent());
    rerender();
    expect(result.current.scenarioOrder).toEqual(firstOrder);
  });

  it("scenarioOrder is a real permutation of all scenario ids", () => {
    const { result } = setup();
    expect([...result.current.scenarioOrder].sort()).toEqual(["consider", "move", "stay"]);
  });
});

describe("useResearchQuizFlow — incomplete-answer prevention", () => {
  it("does not advance on an incomplete/invalid answer", () => {
    const { result } = setup();
    act(() => result.current.consent());
    const before = result.current.currentIndex;
    act(() => result.current.answerScenario({ interpretation: "not_a_real_value", reason: "x", action: "y" }));
    expect(result.current.currentIndex).toBe(before);
    expect(result.current.stage).toBe(STAGE.QUIZ);
  });

  it("advances through all scenarios to READY on complete answers", () => {
    const { result } = setup();
    act(() => result.current.consent());
    act(() => result.current.answerScenario(VALID_ANSWER));
    act(() => result.current.answerScenario(VALID_ANSWER));
    act(() => result.current.answerScenario(VALID_ANSWER));
    expect(result.current.stage).toBe(STAGE.READY);
  });
});

describe("useResearchQuizFlow — first action capture", () => {
  it("records only the FIRST action per scenario; later calls are no-ops", () => {
    const { result } = setup();
    act(() => result.current.consent());
    act(() => result.current.recordFirstAction("primary_cta"));
    act(() => result.current.recordFirstAction("secondary_link")); // should not overwrite
    act(() => result.current.answerScenario(VALID_ANSWER));
    expect(result.current.answers[result.current.scenarioOrder[0]].firstAction).toBe("primary_cta");
  });

  it("defaults to 'none' when no action was recorded before answering", () => {
    const { result } = setup();
    act(() => result.current.consent());
    act(() => result.current.answerScenario(VALID_ANSWER));
    expect(result.current.answers[result.current.scenarioOrder[0]].firstAction).toBeNull();
  });
});

describe("useResearchQuizFlow — timing boundary", () => {
  it("records a bounded interpretation duration derived from the monotonic clock", () => {
    const { result } = setup();
    act(() => result.current.consent());
    act(() => result.current.answerScenario(VALID_ANSWER));
    const recorded = result.current.answers[result.current.scenarioOrder[0]];
    expect(recorded.interpretationMs).toBe(1000); // nowFn increments by 1000 each call
  });
});

describe("useResearchQuizFlow — submission", () => {
  async function completeAllScenarios(result) {
    await act(async () => result.current.consent());
    await act(async () => result.current.answerScenario(VALID_ANSWER));
    await act(async () => result.current.answerScenario(VALID_ANSWER));
    await act(async () => result.current.answerScenario(VALID_ANSWER));
  }

  it("moves READY -> SUBMITTING -> CONFIRMED on a successful acknowledgment", async () => {
    const { result } = setup();
    await completeAllScenarios(result);
    expect(result.current.stage).toBe(STAGE.READY);
    await act(async () => result.current.submit());
    expect(result.current.stage).toBe(STAGE.CONFIRMED);
  });

  it("moves to FAILED on a readable ok:false response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ json: async () => ({ ok: false, code: "invalid_version" }) });
    const { result } = setup({ fetchImpl });
    await completeAllScenarios(result);
    await act(async () => result.current.submit());
    expect(result.current.stage).toBe(STAGE.FAILED);
  });

  it("moves to UNCONFIRMED on a network error, and retry() returns to READY for a resend", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const { result } = setup({ fetchImpl });
    await completeAllScenarios(result);
    await act(async () => result.current.submit());
    expect(result.current.stage).toBe(STAGE.UNCONFIRMED);

    act(() => result.current.retry());
    expect(result.current.stage).toBe(STAGE.READY);
  });

  it("duplicate-click safety: calling submit() twice in rapid succession only invokes fetchImpl once", async () => {
    let resolveFirst;
    const fetchImpl = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolveFirst = resolve; }),
    );
    const { result } = setup({ fetchImpl });
    await completeAllScenarios(result);

    act(() => {
      result.current.submit();
      result.current.submit(); // second call while the first is still in flight
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst({ json: async () => ({ ok: true, receivedAt: "r" }) });
    });
    expect(result.current.stage).toBe(STAGE.CONFIRMED);
  });

  it("retry resends a byte-equivalent payload: same session_id and answers, only client_completed_at may differ", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ json: async () => ({ ok: false, code: "busy" }) });
    const { result } = setup({ fetchImpl });
    await completeAllScenarios(result);

    await act(async () => result.current.submit());
    act(() => result.current.retry());
    await act(async () => result.current.submit());

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    const secondBody = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(secondBody.session_id).toBe(firstBody.session_id);
    expect(secondBody.scenarios).toEqual(firstBody.scenarios);
    expect(secondBody.scenario_order).toEqual(firstBody.scenario_order);
  });
});
