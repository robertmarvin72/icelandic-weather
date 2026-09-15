// Ticket 416 (#416) — compact Free/Pro Northern Lights explanation on PricingInfo.jsx.
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PricingInfo from "./PricingInfo";
import { translations } from "../i18n/translations";

vi.mock("../components/Footer", () => ({ default: () => null }));
vi.mock("../config/pricing", () => ({
  getDisplayPrices: () => ({ monthly: "€4.99", yearly: "€24.99", pass30: "€6.99", passyear: "€29.99" }),
}));

function realT(lang) {
  const dict = translations[lang];
  return (k) => dict[k] ?? k;
}

function renderInfo(lang) {
  return render(<PricingInfo lang={lang} theme="light" t={realT(lang)} onUpgrade={() => {}} />);
}

describe("PricingInfo — Ticket 416 (#416): Aurora Free/Pro explanation, real translations dictionary", () => {
  it.each(["is", "en"])("%s: renders exact title, Free/Pro labels+bodies, same-assessment and seasonal notes", (lang) => {
    const dict = translations[lang];
    renderInfo(lang);

    expect(screen.getByText(dict.pricingInfoAuroraTitle)).toBeInTheDocument();
    expect(screen.getByText(dict.pricingInfoAuroraFreeLabel)).toBeInTheDocument();
    expect(screen.getByText(dict.pricingInfoAuroraFreeBody)).toBeInTheDocument();
    expect(screen.getByText(dict.pricingInfoAuroraProLabel)).toBeInTheDocument();
    expect(screen.getByText(dict.pricingInfoAuroraProBody)).toBeInTheDocument();
    expect(screen.getByText(dict.auroraInfoSameAssessment)).toBeInTheDocument();
    expect(screen.getByText(dict.auroraInfoSeasonalNote)).toBeInTheDocument();

    for (const key of [
      "pricingInfoAuroraTitle",
      "pricingInfoAuroraFreeLabel",
      "pricingInfoAuroraFreeBody",
      "pricingInfoAuroraProLabel",
      "pricingInfoAuroraProBody",
    ]) {
      expect(dict[key]).toBeTypeOf("string");
      expect(dict[key].length).toBeGreaterThan(0);
      expect(screen.queryByText(key)).toBeNull();
    }
  });

  it("never promises a numeric score, live data, exact timing, or an unconditional map/list", () => {
    const dict = translations.en;
    renderInfo("en");
    const bodyText = `${dict.pricingInfoAuroraFreeBody} ${dict.pricingInfoAuroraProBody}`.toLowerCase();
    expect(bodyText).not.toMatch(/\bscore\b/);
    expect(bodyText).not.toMatch(/live data/);
    expect(bodyText).not.toMatch(/exact time/);
    // "when results support them" — conditional, not a blanket guarantee.
    expect(dict.pricingInfoAuroraProBody.toLowerCase()).toContain("when results support them");
  });

  it("preserves the existing four feature tiles unchanged alongside the new Aurora block", () => {
    const dict = translations.is;
    renderInfo("is");
    expect(screen.getByText(dict.pricingInfoFeature1Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pricingInfoFeature2Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pricingInfoFeature3Title)).toBeInTheDocument();
    expect(screen.getByText(dict.pricingInfoFeature4Title)).toBeInTheDocument();
  });

  it("preserves price display and upgrade/refund CTAs unchanged", () => {
    const { container } = renderInfo("en");
    expect(container.textContent).toContain("€4.99");
    expect(screen.getByText(translations.en.pricingInfoUpgradeLink)).toBeInTheDocument();
    expect(screen.getByText(translations.en.pricingInfoRefundLink)).toBeInTheDocument();
  });
});
