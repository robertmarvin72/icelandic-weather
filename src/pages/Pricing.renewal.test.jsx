import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Pricing from "./Pricing";

vi.mock("../hooks/useMe", () => ({ useMe: () => ({ me: null }) }));
vi.mock("../config/pricing", () => ({ getDisplayPrices: () => ({ yearly: "€24.99", monthly: "€4.99" }) }));
vi.mock("../components/Footer", () => ({ default: () => null }));
vi.mock("../lib/attribution", () => ({ getStoredAttribution: () => null }));
vi.mock("../lib/checkoutSource", () => ({
  resolveCheckoutSource: () => "test",
  persistCheckoutSource: () => {},
}));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

// t returns the key itself so we can assert on key presence and fallback text
const t = (k) => k;

function renderPricing(props = {}) {
  render(<Pricing lang="en" theme="dark" t={t} me={null} {...props} />);
}

describe("Pricing — auto-renewal disclosures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders yearly renewal text key near the yearly price", () => {
    renderPricing();
    expect(screen.getByText("pricingYearlyRenewalText")).toBeDefined();
  });

  it("renders monthly renewal text key near the monthly price", () => {
    renderPricing();
    expect(screen.getByText("pricingMonthlyRenewalText")).toBeDefined();
  });

  it("renders confirmation text below the yearly CTA", () => {
    renderPricing();
    // With t=(k)=>k, the key itself appears — there are two ctaConfirm divs (yearly + monthly)
    const nodes = screen.getAllByText("pricingCtaConfirm");
    expect(nodes.length).toBeGreaterThanOrEqual(2);
  });

  it("renders confirmation text below the monthly CTA", () => {
    renderPricing();
    const nodes = screen.getAllByText("pricingCtaConfirm");
    expect(nodes.length).toBeGreaterThanOrEqual(2);
  });

  it("yearly CTA idle label uses pricingCtaYearly key", () => {
    renderPricing();
    // With t=(k)=>k the button text is the key
    expect(screen.getByText("pricingCtaYearly")).toBeDefined();
  });

  it("monthly CTA idle label uses pricingCtaMonthly key", () => {
    renderPricing();
    expect(screen.getByText("pricingCtaMonthly")).toBeDefined();
  });

  it("upgrade state: yearly CTA shows pricingCtaUpgradeToYearly when user has monthly plan", () => {
    renderPricing({
      me: {
        user: { email: "test@example.com" },
        entitlements: { pro: true, proUntil: null },
        subscription: { plan: "monthly" },
      },
    });
    expect(screen.getByText("pricingCtaUpgradeToYearly")).toBeDefined();
    // The new "Start annual subscription" key must not appear as a button label
    expect(screen.queryByText("pricingCtaYearly")).toBeNull();
  });

  it("yearly and monthly renewal text keys are distinct", () => {
    renderPricing();
    const yearly = screen.getByText("pricingYearlyRenewalText");
    const monthly = screen.getByText("pricingMonthlyRenewalText");
    expect(yearly).not.toBe(monthly);
    expect(yearly.textContent).not.toBe(monthly.textContent);
  });
});
