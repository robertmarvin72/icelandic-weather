// Ticket 416 (#416) — same short Aurora Pro-value bullet on all four plan
// feature arrays, plus the shared same-assessment qualification/link.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Pricing from "./Pricing";
import { translations } from "../i18n/translations";

vi.mock("../hooks/useMe", () => ({ useMe: () => ({ me: null }) }));
vi.mock("../config/pricing", () => ({
  getDisplayPrices: () => ({ monthly: "€4.99", yearly: "€24.99", pass30: "€6.99", passyear: "€29.99" }),
}));
vi.mock("../components/Footer", () => ({ default: () => null }));
vi.mock("../lib/attribution", () => ({ getStoredAttribution: () => null }));
vi.mock("../lib/checkoutSource", () => ({
  resolveCheckoutSource: () => "test",
  persistCheckoutSource: () => {},
}));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

function realT(lang) {
  const dict = translations[lang];
  return (k) => dict[k] ?? k;
}

function renderPricing(lang = "is") {
  return render(<Pricing lang={lang} theme="dark" t={realT(lang)} me={null} />);
}

describe("Pricing — Ticket 416 (#416): Aurora bullet on all four plans, real translations dictionary", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["is", "en"])("%s: the exact Aurora bullet text appears at least 4 times — one per plan card", (lang) => {
    const dict = translations[lang];
    renderPricing(lang);
    const nodes = screen.getAllByText(dict.pricingFeatureAurora);
    expect(nodes.length).toBe(4);
  });

  it("exact bullet text matches the approved prompt's wording", () => {
    expect(translations.en.pricingFeatureAurora).toBe("Northern Lights: details and place comparison");
    expect(translations.is.pricingFeatureAurora).toBe("Norðurljós: nánari upplýsingar og samanburður staða");
  });

  it("renders the shared same-assessment qualification and a link to the detailed PricingInfo explanation", () => {
    const dict = translations.en;
    renderPricing("en");
    expect(screen.getByText(dict.auroraInfoSameAssessment)).toBeInTheDocument();
    const link = screen.getByText(dict.pricingAuroraLearnMoreLink);
    expect(link.closest("a")).toHaveAttribute("href", "/pricing-info");
  });

  it("does not imply Pro-exclusive basic forecasts — the qualification names Free explicitly", () => {
    renderPricing("en");
    expect(translations.en.auroraInfoSameAssessment.toLowerCase()).toContain("free");
  });

  it("preserves every other pre-existing feature bullet unchanged", () => {
    const dict = translations.is;
    renderPricing("is");
    expect(screen.getAllByText(dict.pricingFeatureComparisons).length).toBe(4);
    expect(screen.getAllByText(dict.pricingFeatureAllPro).length).toBe(4);
    expect(screen.getAllByText(dict.pricingFeatureWindShelter).length).toBe(4);
    // Cancel-anytime only appears on the two subscription plans, not the
    // two one-time passes — unchanged pre-existing behavior.
    expect(screen.getAllByText(dict.pricingFeatureCancelAnytime).length).toBe(2);
  });

  it("preserves all four CTAs and prices unchanged (identity translator, matching the existing Pricing regression convention)", () => {
    render(<Pricing lang="en" theme="dark" t={(k) => k} me={null} />);
    expect(screen.getByText("pricingPass30CTA")).toBeDefined();
    expect(screen.getByText("pricingCtaMonthly")).toBeDefined();
    expect(screen.getByText("pricingPassYearCTA")).toBeDefined();
    expect(screen.getByText("pricingCtaYearly")).toBeDefined();
  });
});
