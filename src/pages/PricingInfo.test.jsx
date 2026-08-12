import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PricingInfo from "./PricingInfo";
import { pricingTranslations } from "../i18n/translations.pricing";

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

describe("PricingInfo — Miði 7-fix: '7-day forecast' fact-fix no longer claims a Free-and-Pro-equal feature as Pro-exclusive", () => {
  it("EN: feature tile and includes-list item replaced with genuinely Pro-only value", () => {
    expect(pricingTranslations.en.pricingInfoFeature1Title).toBe("Wind direction & shelter");
    expect(pricingTranslations.en.pricingInfoFeature1Body).toBe(
      "See wind direction and a shelter score to pick calmer, more sheltered campsites."
    );
    expect(pricingTranslations.en.pricingInfoIncludes2).toBe("Full Top 5 best campsites ranking");
    expect(pricingTranslations.en.pricingInfoFeature1Title).not.toMatch(/7-day/i);
    expect(pricingTranslations.en.pricingInfoIncludes2).not.toMatch(/7-day/i);
  });

  it("IS: sama leiðrétting", () => {
    expect(pricingTranslations.is.pricingInfoFeature1Title).toBe("Vindátt og skjól");
    expect(pricingTranslations.is.pricingInfoFeature1Body).toBe(
      "Sjáðu vindátt og skjólstuðul til að velja rólegri, skjólsælli tjaldsvæði."
    );
    expect(pricingTranslations.is.pricingInfoIncludes2).toBe("Fullur Topp 5-listi yfir bestu tjaldsvæðin");
    expect(pricingTranslations.is.pricingInfoFeature1Title).not.toMatch(/7 daga/i);
    expect(pricingTranslations.is.pricingInfoIncludes2).not.toMatch(/7 daga/i);
  });

  it("neighbouring pricingInfo keys on the same page are unchanged", () => {
    expect(pricingTranslations.en.pricingInfoFeature2Title).toBe("Route Planner");
    expect(pricingTranslations.en.pricingInfoFeature3Title).toBe("Better decision support");
    expect(pricingTranslations.en.pricingInfoFeature4Title).toBe("Compare two campsites");
    expect(pricingTranslations.en.pricingInfoIncludes1).toBe("Full access to Route Planner");
    expect(pricingTranslations.en.pricingInfoIncludes3).toBe("Wind direction and shelter insights");
    expect(pricingTranslations.en.pricingInfoIncludes4).toBe("Compare all 242 campsites across Iceland");
    expect(pricingTranslations.en.pricingInfoUpgradeLink).toBe("Get Chase the Weather Pro");

    expect(pricingTranslations.is.pricingInfoIncludes1).toBe("Fullur aðgangur að Ferðaráðgjafa");
    expect(pricingTranslations.is.pricingInfoIncludes3).toBe("Vindátt og skjól-innsýn");
    expect(pricingTranslations.is.pricingInfoIncludes4).toBe("Berðu saman öll 242 tjaldsvæði landsins");
  });
});
