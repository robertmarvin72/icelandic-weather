import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Pricing from "./Pricing";

vi.mock("../hooks/useMe", () => ({ useMe: () => ({ me: null }) }));
vi.mock("../config/pricing", () => ({
  getDisplayPrices: () => ({
    monthly: "€4.99",
    yearly: "€24.99",
    pass30: "€6.99",
    passyear: "€29.99",
  }),
}));
vi.mock("../components/Footer", () => ({ default: () => null }));
vi.mock("../lib/attribution", () => ({ getStoredAttribution: () => null }));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
// checkoutSource is intentionally NOT mocked here — this file exercises the
// real stale-sessionStorage-prevention logic in src/lib/checkoutSource.js.

const t = (k) => k;

const LOGGED_IN_FREE_USER = {
  user: { email: "camper@example.com" },
  entitlements: { pro: false, proUntil: null },
  subscription: null,
};

function setLocation(url) {
  window.history.pushState({}, "", url);
}

function renderPricing() {
  render(<Pricing lang="en" theme="dark" t={t} me={LOGGED_IN_FREE_USER} />);
}

function mockCheckoutFetch() {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ ok: true, url: "https://pay.example.com/checkout/test" }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function acceptTermsAndClick(ctaKey) {
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByText(ctaKey).closest("button"));
}

describe("Pricing — stale checkout_source prevention (real checkoutSource.js)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    setLocation("/");
  });

  it("stale sessionStorage from an earlier feature CTA is superseded by a later direct /pricing visit", async () => {
    sessionStorage.setItem("checkout_source", "comparison");
    setLocation("/pricing");
    const fetchMock = mockCheckoutFetch();
    renderPricing();

    await acceptTermsAndClick("pricingPass30CTA");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.upgrade_source).toBe("pricing");
  });

  it("explicit ?src= query still wins over route and any stale session value", async () => {
    sessionStorage.setItem("checkout_source", "old_stale_value");
    setLocation("/pricing?src=comparison");
    const fetchMock = mockCheckoutFetch();
    renderPricing();

    await acceptTermsAndClick("pricingPass30CTA");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.upgrade_source).toBe("comparison");
  });

  it("stale-source fix does not disturb qr_source attribution in the same checkout request", async () => {
    sessionStorage.setItem("checkout_source", "comparison");
    sessionStorage.setItem("qr_source", "qr123");
    setLocation("/pricing");
    const fetchMock = mockCheckoutFetch();
    renderPricing();

    await acceptTermsAndClick("pricingPass30CTA");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.upgrade_source).toBe("pricing");
    expect(body.qr_source).toBe("qr123");
  });
});
