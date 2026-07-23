import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCheckoutFlow } from "./useCheckoutFlow";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

const meLoggedIn = {
  user: { email: "test@example.com" },
  entitlements: { pro: false },
};

function makeHookArgs(overrides = {}) {
  return {
    me: meLoggedIn,
    navigate: vi.fn(),
    openLoginModal: vi.fn(),
    pushToast: vi.fn(),
    refetchMe: vi.fn(),
    t: (k) => k,
    ...overrides,
  };
}

describe("startCheckout src attribution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("appends src to the pricing URL when src is provided", async () => {
    const args = makeHookArgs();
    const { result } = renderHook(() => useCheckoutFlow(args));
    await result.current.startCheckout("weekly_ranking");
    expect(args.navigate).toHaveBeenCalledOnce();
    const url = args.navigate.mock.calls[0][0];
    expect(url).toContain("src=weekly_ranking");
  });

  it("preserves the email param when src is appended", async () => {
    const args = makeHookArgs();
    const { result } = renderHook(() => useCheckoutFlow(args));
    await result.current.startCheckout("weekly_ranking");
    const url = args.navigate.mock.calls[0][0];
    expect(url).toContain("email=test%40example.com");
    expect(url).toContain("src=weekly_ranking");
  });

  it("works with src=weather_finder", async () => {
    const args = makeHookArgs();
    const { result } = renderHook(() => useCheckoutFlow(args));
    await result.current.startCheckout("weather_finder");
    const url = args.navigate.mock.calls[0][0];
    expect(url).toContain("src=weather_finder");
  });

  it("does not append src when called without arguments", async () => {
    const args = makeHookArgs();
    const { result } = renderHook(() => useCheckoutFlow(args));
    await result.current.startCheckout();
    const url = args.navigate.mock.calls[0][0];
    expect(url).not.toContain("src=");
    expect(url).toContain("email=");
  });

  it("does not append src when called with undefined", async () => {
    const args = makeHookArgs();
    const { result } = renderHook(() => useCheckoutFlow(args));
    await result.current.startCheckout(undefined);
    const url = args.navigate.mock.calls[0][0];
    expect(url).not.toContain("src=");
  });

  it("navigates to /pricing as the base path", async () => {
    const args = makeHookArgs();
    const { result } = renderHook(() => useCheckoutFlow(args));
    await result.current.startCheckout("weekly_ranking");
    const url = args.navigate.mock.calls[0][0];
    expect(url).toMatch(/^\/pricing\?/);
  });

  it("does not navigate when user is not logged in", async () => {
    const args = makeHookArgs({ me: null });
    const { result } = renderHook(() => useCheckoutFlow(args));
    await result.current.startCheckout("weekly_ranking");
    expect(args.navigate).not.toHaveBeenCalled();
    expect(args.openLoginModal).toHaveBeenCalledOnce();
  });

  it("does not navigate when user already has pro", async () => {
    const args = makeHookArgs({ me: { user: { email: "pro@example.com" }, entitlements: { pro: true } } });
    const { result } = renderHook(() => useCheckoutFlow(args));
    await result.current.startCheckout("weekly_ranking");
    expect(args.navigate).not.toHaveBeenCalled();
  });
});
