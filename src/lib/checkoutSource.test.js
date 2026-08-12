import { describe, it, expect, beforeEach } from "vitest";
import { resolveCheckoutSource, persistCheckoutSource, readCheckoutSource } from "./checkoutSource";

function setLocation(url) {
  window.history.pushState({}, "", url);
}

describe("checkoutSource — stale sessionStorage prevention", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setLocation("/");
  });

  it("explicit query wins over stale sessionStorage", () => {
    sessionStorage.setItem("checkout_source", "old_source");
    setLocation("/pricing?src=comparison");
    expect(resolveCheckoutSource()).toBe("comparison");
  });

  it("direct /pricing visit does not inherit a stale sessionStorage source — resolves to the route", () => {
    sessionStorage.setItem("checkout_source", "comparison");
    setLocation("/pricing");
    expect(resolveCheckoutSource()).toBe("pricing");
  });

  it("refresh on an explicit URL keeps resolving the explicit source", () => {
    setLocation("/pricing?src=travel_advisor");
    expect(resolveCheckoutSource()).toBe("travel_advisor");
    // Simulate a refresh: location is unchanged, resolve is called again.
    expect(resolveCheckoutSource()).toBe("travel_advisor");
  });

  it("fresh direct /pricing with empty sessionStorage resolves to the route fallback", () => {
    setLocation("/pricing");
    expect(resolveCheckoutSource()).toBe("pricing");
  });

  it("sessionStorage still serves as fallback when the route itself can't identify context", () => {
    // Preserves the persistence feature for genuinely ambiguous routes —
    // the fix must not delete session-based attribution outright.
    sessionStorage.setItem("checkout_source", "comparison");
    setLocation("/some-unmapped-route");
    expect(resolveCheckoutSource()).toBe("comparison");
  });

  it("persistCheckoutSource + readCheckoutSource still round-trip unaffected (Success page carrier)", () => {
    persistCheckoutSource("weekly_ranking");
    setLocation("/success");
    expect(readCheckoutSource()).toBe("weekly_ranking");
  });
});
