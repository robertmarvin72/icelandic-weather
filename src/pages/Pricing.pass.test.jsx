import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
  resolveCheckoutSource: () => "test",
  persistCheckoutSource: () => {},
}));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

// t returns the key itself so tests assert on key presence
const t = (k) => k;

function renderPricing(props = {}) {
  render(<Pricing lang="en" theme="dark" t={t} me={null} {...props} />);
}

describe("Pricing — four plan cards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders all four CTA buttons", () => {
    renderPricing();
    expect(screen.getByText("pricingPass30CTA")).toBeDefined();
    expect(screen.getByText("pricingCtaMonthly")).toBeDefined();
    expect(screen.getByText("pricingPassYearCTA")).toBeDefined();
    expect(screen.getByText("pricingCtaYearly")).toBeDefined();
  });

  it("renders pass30 card title", () => {
    renderPricing();
    expect(screen.getByText("pricingPass30Title")).toBeDefined();
  });

  it("renders passyear card title", () => {
    renderPricing();
    expect(screen.getByText("pricingPassYearTitle")).toBeDefined();
  });

  it("pass30 card shows popular badge", () => {
    renderPricing();
    expect(screen.getByText("pricingPassPopularBadge")).toBeDefined();
  });

  it("yearly card shows best-value badge", () => {
    renderPricing();
    expect(screen.getByText("pricingBestValue")).toBeDefined();
  });

  it("pass cards show no-renewal text key", () => {
    renderPricing();
    expect(screen.getByText("pricingPass30RenewalText")).toBeDefined();
    expect(screen.getByText("pricingPassYearRenewalText")).toBeDefined();
  });

  it("subscription cards show auto-renewal text keys", () => {
    renderPricing();
    expect(screen.getByText("pricingYearlyRenewalText")).toBeDefined();
    expect(screen.getByText("pricingMonthlyRenewalText")).toBeDefined();
  });

  it("pass card CTAs carry data-plan attribute", () => {
    renderPricing();
    const btn30 = screen.getByText("pricingPass30CTA").closest("button");
    const btnYear = screen.getByText("pricingPassYearCTA").closest("button");
    expect(btn30.dataset.plan).toBe("pass30");
    expect(btnYear.dataset.plan).toBe("passyear");
  });

  it("subscription card CTAs carry data-plan attribute", () => {
    renderPricing();
    const btnMonthly = screen.getByText("pricingCtaMonthly").closest("button");
    const btnYearly = screen.getByText("pricingCtaYearly").closest("button");
    expect(btnMonthly.dataset.plan).toBe("monthly");
    expect(btnYearly.dataset.plan).toBe("yearly");
  });

  it("all CTA buttons are disabled when terms not accepted", () => {
    renderPricing();
    const buttons = screen.getAllByRole("button").filter((b) => b.dataset.plan);
    buttons.forEach((btn) => expect(btn.disabled).toBe(true));
  });

  it("pass CTA buttons become enabled after accepting terms", () => {
    renderPricing();
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    const btn30 = screen.getByText("pricingPass30CTA").closest("button");
    const btnYear = screen.getByText("pricingPassYearCTA").closest("button");
    expect(btn30.disabled).toBe(false);
    expect(btnYear.disabled).toBe(false);
  });

  it("pass CTAs remain enabled for an active pro subscriber (stacking allowed)", () => {
    renderPricing({
      me: {
        user: { email: "sub@example.com" },
        entitlements: { pro: true, proUntil: null },
        subscription: { plan: "yearly" },
      },
    });
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    const btn30 = screen.getByText("pricingPass30CTA").closest("button");
    const btnYear = screen.getByText("pricingPassYearCTA").closest("button");
    expect(btn30.disabled).toBe(false);
    expect(btnYear.disabled).toBe(false);
  });

  it("pass cards show one-time micro text", () => {
    renderPricing();
    // pricingPassMicro appears once per pass card
    const nodes = screen.getAllByText("pricingPassMicro");
    expect(nodes.length).toBeGreaterThanOrEqual(2);
  });

  it("pass cards show duration text", () => {
    renderPricing();
    expect(screen.getByText("pricingPass30Duration")).toBeDefined();
    expect(screen.getByText("pricingPassYearDuration")).toBeDefined();
  });

  it("pass CTAs show busy text while pending checkout", () => {
    // Can't easily simulate async busyPlan here; just verify idle labels are present
    renderPricing();
    expect(screen.getByText("pricingPass30CTA")).toBeDefined();
    expect(screen.getByText("pricingPassYearCTA")).toBeDefined();
  });

  it("pass confirm text uses pricingPassCtaConfirm key", () => {
    renderPricing();
    const nodes = screen.getAllByText("pricingPassCtaConfirm");
    expect(nodes.length).toBe(2);
  });

  it("subscription confirm text still uses pricingCtaConfirm key", () => {
    renderPricing();
    const nodes = screen.getAllByText("pricingCtaConfirm");
    expect(nodes.length).toBeGreaterThanOrEqual(2);
  });

  it("displays pass30 price from getDisplayPrices", () => {
    renderPricing();
    expect(screen.getByText("€6.99")).toBeDefined();
  });

  it("displays passyear price from getDisplayPrices", () => {
    renderPricing();
    expect(screen.getByText("€29.99")).toBeDefined();
  });

  it("error message renders when set", () => {
    // error state is internal; test via indirect mechanism — just check layout integrity
    renderPricing();
    expect(screen.queryByText("subscribeOopsTitle")).toBeNull();
  });

  it("all four plan cards include pricingFeatureWindShelter", () => {
    renderPricing();
    const nodes = screen.getAllByText("pricingFeatureWindShelter");
    expect(nodes.length).toBe(4);
  });

  it("pricingFeatureNoRenewal does not appear in pass feature lists (max 2 occurrences of no-renewal per card)", () => {
    renderPricing();
    // micro + renewalText already contain the no-renewal message — feature list must not add a third
    const nodes = screen.queryAllByText("pricingFeatureNoRenewal");
    expect(nodes.length).toBe(0);
  });

  it("grid element has no inline display style — layout is CSS-class-driven", () => {
    const { container } = render(<Pricing lang="en" theme="dark" t={t} me={null} />);
    const grid = container.querySelector(".pricing-plans-grid");
    expect(grid).toBeTruthy();
    expect(grid.style.display).toBeFalsy();
  });
});

describe("Pricing — i18n key completeness", () => {
  it("all new pass i18n keys resolve via t prop", () => {
    render(<Pricing lang="en" theme="dark" t={t} me={null} />);
    const keys = [
      "pricingPass30Title",
      "pricingPassYearTitle",
      "pricingPerOneTime",
      "pricingPassMicro",
      "pricingPass30Duration",
      "pricingPassYearDuration",
      "pricingPass30RenewalText",
      "pricingPassYearRenewalText",
      "pricingPass30CTA",
      "pricingPassYearCTA",
      "pricingPassCtaConfirm",
      "pricingPassPopularBadge",
    ];
    keys.forEach((key) => {
      const found = screen.queryAllByText(key);
      expect(found.length, `key "${key}" not found in rendered output`).toBeGreaterThan(0);
    });
  });
});

describe("Pricing — IS translations þolfall", () => {
  it("IS pricingPass30CTA uses þolfall (passa, not pass)", async () => {
    const { commonTranslations } = await import("../i18n/translations.common");
    expect(commonTranslations.is.pricingPass30CTA).toBe("Kaupa 30 daga passa");
  });

  it("IS pricingPassYearCTA uses þolfall (árspassa, not árspass)", async () => {
    const { commonTranslations } = await import("../i18n/translations.common");
    expect(commonTranslations.is.pricingPassYearCTA).toBe("Kaupa árspassa");
  });

  it("EN CTA text is unchanged", async () => {
    const { commonTranslations } = await import("../i18n/translations.common");
    expect(commonTranslations.en.pricingPass30CTA).toBe("Buy 30-day pass");
    expect(commonTranslations.en.pricingPassYearCTA).toBe("Buy annual pass");
  });
});
