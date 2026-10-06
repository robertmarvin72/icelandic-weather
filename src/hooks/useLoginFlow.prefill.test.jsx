// #434 F4 — after logout the login modal must not prefill the previous account email.
// Uses the real useLoginFlow hook. The test never calls setLoginEmail("") itself: the empty
// value on reopen comes from openLoginModal reading me.user after the user becomes null.
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLoginFlow } from "./useLoginFlow";

const SIGNED_IN = { ok: true, user: { id: "u1", email: "camper@example.com" }, entitlements: { pro: true } };
const ANONYMOUS = { ok: true, user: null, entitlements: { pro: false } };

function setup(initialMe) {
  return renderHook(
    ({ me }) =>
      useLoginFlow({
        me,
        navigate: vi.fn(),
        pushToast: vi.fn(),
        refetchMe: vi.fn(),
        t: (k) => k,
      }),
    { initialProps: { me: initialMe } }
  );
}

describe("useLoginFlow after logout (no old email prefill)", () => {
  it("reopening with the user now null shows an empty email, not the previous account email", () => {
    const { result, rerender } = setup(SIGNED_IN);

    act(() => result.current.openLoginModal());
    expect(result.current.loginEmail).toBe("camper@example.com");
    act(() => result.current.closeLoginModal());

    // Logout resets me to the anonymous shape. This test deliberately does not clear loginEmail,
    // so the empty value must come from openLoginModal alone.
    rerender({ me: ANONYMOUS });

    act(() => result.current.openLoginModal());
    expect(result.current.loginEmail).toBe("");
  });

  it("typed but unsubmitted text is replaced on reopen (prefill from current me, not stale input)", () => {
    const { result, rerender } = setup(SIGNED_IN);

    act(() => result.current.openLoginModal());
    act(() => result.current.setLoginEmail("typed-unsent@example.com"));
    expect(result.current.loginEmail).toBe("typed-unsent@example.com");
    act(() => result.current.closeLoginModal());

    rerender({ me: ANONYMOUS });
    act(() => result.current.openLoginModal());
    expect(result.current.loginEmail).toBe("");
    expect(result.current.loginEmail).not.toBe("typed-unsent@example.com");
  });
});
