import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PricingInfo from "./PricingInfo";

vi.mock("../components/Footer", () => ({ default: () => null }));
vi.mock("../config/pricing", () => ({
  getDisplayPrices: (lang) =>
    lang === "is"
      ? { monthly: "790 kr", yearly: "3.590 kr", pass30: "995 kr", passyear: "4.268 kr" }
      : { monthly: "€4.99", yearly: "€24.99", pass30: "€6.99", passyear: "€29.99" },
}));

const t = (k) => k;

function renderInfo(props = {}) {
  return render(<PricingInfo lang="en" theme="light" t={t} onUpgrade={() => {}} {...props} />);
}

describe("PricingInfo — four price boxes", () => {
  it("renders pass30 label", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoPass30Label")).toBeDefined();
  });

  it("renders passyear label", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoPassYearLabel")).toBeDefined();
  });

  it("renders monthly label", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoMonthlyLabel")).toBeDefined();
  });

  it("renders yearly label", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoYearlyLabel")).toBeDefined();
  });

  it("pass30 body appears", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoPass30Body")).toBeDefined();
  });

  it("passyear body appears", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoPassYearBody")).toBeDefined();
  });

  it("one-time suffix key appears twice in page (once per pass card)", () => {
    renderInfo();
    const count = (document.body.textContent.match(/pricingInfoOneTime/g) || []).length;
    expect(count).toBe(2);
  });

  it("pass30 price comes from getDisplayPrices (EN)", () => {
    renderInfo({ lang: "en" });
    expect(document.body.textContent).toContain("€6.99");
  });

  it("passyear price comes from getDisplayPrices (EN)", () => {
    renderInfo({ lang: "en" });
    expect(document.body.textContent).toContain("€29.99");
  });

  it("pass30 price comes from getDisplayPrices (IS)", () => {
    renderInfo({ lang: "is" });
    expect(document.body.textContent).toContain("995 kr");
  });

  it("passyear price comes from getDisplayPrices (IS)", () => {
    renderInfo({ lang: "is" });
    expect(document.body.textContent).toContain("4.268 kr");
  });

  it("subscription monthly price comes from getDisplayPrices (EN)", () => {
    renderInfo({ lang: "en" });
    expect(document.body.textContent).toContain("€4.99");
  });

  it("subscription yearly price comes from getDisplayPrices (EN)", () => {
    renderInfo({ lang: "en" });
    expect(document.body.textContent).toContain("€24.99");
  });

  it("subscription monthly price comes from getDisplayPrices (IS)", () => {
    renderInfo({ lang: "is" });
    expect(document.body.textContent).toContain("790 kr");
  });

  it("subscription yearly price comes from getDisplayPrices (IS)", () => {
    renderInfo({ lang: "is" });
    expect(document.body.textContent).toContain("3.590 kr");
  });

  it("EUR disclaimer renders", () => {
    renderInfo();
    expect(screen.getByText("pricingChargedInEur")).toBeDefined();
  });

  it("updated trust body appears", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoTrustBody")).toBeDefined();
  });

  it("refund link renders", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoRefundLink")).toBeDefined();
  });

  it("upgrade link button renders", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoUpgradeLink")).toBeDefined();
  });
});
