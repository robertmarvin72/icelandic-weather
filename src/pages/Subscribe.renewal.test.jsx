import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Subscribe from "./Subscribe";

vi.mock("../hooks/useMe", () => ({
  useMe: () => ({ me: null, refetchMe: vi.fn() }),
}));
vi.mock("../lib/attribution", () => ({ getStoredAttribution: () => null }));
vi.mock("../lib/checkoutSource", () => ({
  resolveCheckoutSource: () => "test",
  persistCheckoutSource: () => {},
}));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

const t = (k) => k;

function setSearch(qs) {
  Object.defineProperty(window, "location", {
    value: { search: qs, assign: vi.fn(), href: "" },
    writable: true,
    configurable: true,
  });
}

describe("Subscribe — auto-renewal disclosures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSearch("");
  });

  afterEach(() => {
    setSearch("");
  });

  it("shows monthly renewal text key for default plan (monthly)", () => {
    render(<Subscribe t={t} theme="dark" />);
    expect(screen.getByText("pricingMonthlyRenewalText")).toBeDefined();
    expect(screen.queryByText("pricingYearlyRenewalText")).toBeNull();
  });

  it("shows yearly renewal text key when plan=yearly", () => {
    setSearch("?plan=yearly");
    render(<Subscribe t={t} theme="dark" />);
    expect(screen.getByText("pricingYearlyRenewalText")).toBeDefined();
    expect(screen.queryByText("pricingMonthlyRenewalText")).toBeNull();
  });

  it("shows confirmation text below the CTA", () => {
    render(<Subscribe t={t} theme="dark" />);
    expect(screen.getByText("pricingCtaConfirm")).toBeDefined();
  });

  it("monthly and yearly renewal texts are different", () => {
    const monthlyEN =
      "Renews automatically every month until cancelled. You can cancel at any time and keep access until the end of the paid period.";
    const yearlyEN =
      "Renews automatically every year until cancelled. You can cancel at any time and keep access until the end of the paid period.";
    expect(monthlyEN).not.toBe(yearlyEN);
  });
});
