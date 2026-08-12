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
vi.mock("../lib/checkoutSource", () => ({
  resolveCheckoutSource: () => "travel_advisor",
  persistCheckoutSource: () => {},
}));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

const t = (k) => k;

// Logged in, free (not pro) — every plan button stays clickable.
const LOGGED_IN_FREE_USER = {
  user: { email: "camper@example.com" },
  entitlements: { pro: false, proUntil: null },
  subscription: null,
};

function renderPricing(props = {}) {
  render(<Pricing lang="en" theme="dark" t={t} me={LOGGED_IN_FREE_USER} {...props} />);
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

describe("Pricing — upgrade_source threading to /api/checkout (Miði 7b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["pricingPass30CTA"],
    ["pricingCtaMonthly"],
    ["pricingPassYearCTA"],
    ["pricingCtaYearly"],
  ])("%s: request body includes upgrade_source from resolveCheckoutSource()", async (ctaKey) => {
    const fetchMock = mockCheckoutFetch();
    renderPricing();

    await acceptTermsAndClick(ctaKey);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/checkout");
    const body = JSON.parse(opts.body);
    expect(body.upgrade_source).toBe("travel_advisor");
    // Existing fields must still be present/unaffected.
    expect(typeof body.plan).toBe("string");
  });
});
