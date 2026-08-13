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
  it("EN: feature tile replaced with genuinely Pro-only value", () => {
    expect(pricingTranslations.en.pricingInfoFeature1Title).toBe("Wind direction & shelter");
    expect(pricingTranslations.en.pricingInfoFeature1Body).toBe(
      "See wind direction and a shelter score to pick calmer, more sheltered campsites."
    );
    expect(pricingTranslations.en.pricingInfoFeature1Title).not.toMatch(/7-day/i);
  });

  it("IS: sama leiðrétting", () => {
    expect(pricingTranslations.is.pricingInfoFeature1Title).toBe("Vindátt og skjól");
    expect(pricingTranslations.is.pricingInfoFeature1Body).toBe(
      "Sjáðu vindátt og skjólstuðul til að velja rólegri, skjólsælli tjaldsvæði."
    );
    expect(pricingTranslations.is.pricingInfoFeature1Title).not.toMatch(/7 daga/i);
  });

  it("neighbouring pricingInfo keys untouched by the 7c-2 rewrite are unchanged", () => {
    expect(pricingTranslations.en.pricingInfoFeature2Title).toBe("Route Planner");
    expect(pricingTranslations.en.pricingInfoFeature4Title).toBe("Compare two campsites");
    expect(pricingTranslations.en.pricingInfoUpgradeLink).toBe("Get Chase the Weather Pro");
  });
});

describe("PricingInfo — Miði 7c-2: second-value-layer copy", () => {
  it("EN: page-level title/lead reframe how Pro supports the decision", () => {
    expect(pricingTranslations.en.pricingInfoTitle).toBe(
      "How Pro turns weather data into a clear decision"
    );
    expect(pricingTranslations.en.pricingInfoLead).toBe(
      "Full rankings, side-by-side comparisons, and guidance on whether it's worth moving — across all 242 campsites, so you're not guessing where, when, or why."
    );
  });

  it("IS: page-level title/lead reframe how Pro supports the decision", () => {
    expect(pricingTranslations.is.pricingInfoTitle).toBe("Svona hjálpar Pro þér að taka ákvörðun");
    expect(pricingTranslations.is.pricingInfoLead).toBe(
      "Fullur listi, samanburður hlið við hlið og leiðsögn um hvort borgi sig að færa sig — fyrir öll 242 tjaldsvæði landsins — svo þú þarft ekki að giska á hvert, hvenær eða hvers vegna."
    );
  });

  it("EN: Feature3 rewritten to resolve the title/body decision-support mismatch", () => {
    expect(pricingTranslations.en.pricingInfoFeature3Title).toBe("Full Top 5 ranking");
    expect(pricingTranslations.en.pricingInfoFeature3Body).toBe(
      "See every top-ranked campsite in Iceland right now, not just a preview — so you know where your best options actually are."
    );
    expect(pricingTranslations.en.pricingInfoFeature3Title).not.toBe("Better decision support");
  });

  it("IS: Feature3 rewritten to resolve the title/body decision-support mismatch", () => {
    expect(pricingTranslations.is.pricingInfoFeature3Title).toBe("Fullur Topp 5-listi");
    expect(pricingTranslations.is.pricingInfoFeature3Body).toBe(
      "Sjáðu öll efstu tjaldsvæðin á landinu núna, ekki bara sýnishorn — svo þú vitir hvar bestu kostirnir raunverulega eru."
    );
    expect(pricingTranslations.is.pricingInfoFeature3Title).not.toBe("Betri ákvörðun");
  });

  it("Feature1, Feature2, Feature4 were kept unchanged (not rewritten for consistency's sake)", () => {
    expect(pricingTranslations.en.pricingInfoFeature1Title).toBe("Wind direction & shelter");
    expect(pricingTranslations.en.pricingInfoFeature2Title).toBe("Route Planner");
    expect(pricingTranslations.en.pricingInfoFeature2Body).toBe(
      "Find nearby campsites where the weather may be better."
    );
    expect(pricingTranslations.en.pricingInfoFeature4Title).toBe("Compare two campsites");
    expect(pricingTranslations.en.pricingInfoFeature4Body).toBe(
      "See day by day which campsite is calmer, drier or warmer, and open an hourly breakdown when the decision matters."
    );

    expect(pricingTranslations.is.pricingInfoFeature2Title).toBe("Ferðaráðgjafi");
    expect(pricingTranslations.is.pricingInfoFeature4Title).toBe("Berðu saman tvö tjaldsvæði");
  });

  it("includes-list keys were removed (not just unused) after being folded into Feature3", () => {
    expect(pricingTranslations.en.pricingInfoIncludesTitle).toBeUndefined();
    expect(pricingTranslations.en.pricingInfoIncludes1).toBeUndefined();
    expect(pricingTranslations.en.pricingInfoIncludes2).toBeUndefined();
    expect(pricingTranslations.en.pricingInfoIncludes3).toBeUndefined();
    expect(pricingTranslations.en.pricingInfoIncludes4).toBeUndefined();

    expect(pricingTranslations.is.pricingInfoIncludesTitle).toBeUndefined();
    expect(pricingTranslations.is.pricingInfoIncludes1).toBeUndefined();
    expect(pricingTranslations.is.pricingInfoIncludes2).toBeUndefined();
    expect(pricingTranslations.is.pricingInfoIncludes3).toBeUndefined();
    expect(pricingTranslations.is.pricingInfoIncludes4).toBeUndefined();
  });

  it("renders all four feature tiles but no longer renders an includes list", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoFeature1Title")).toBeDefined();
    expect(screen.getByText("pricingInfoFeature2Title")).toBeDefined();
    expect(screen.getByText("pricingInfoFeature3Title")).toBeDefined();
    expect(screen.getByText("pricingInfoFeature4Title")).toBeDefined();
    expect(screen.queryByText("pricingInfoIncludesTitle")).toBeNull();
  });

  it("trust/payment sections still render after the includes-list removal", () => {
    renderInfo();
    expect(screen.getByText("pricingInfoTrustTitle")).toBeDefined();
    expect(screen.getByText("pricingInfoTrustBody")).toBeDefined();
    expect(screen.getByText("pricingInfoRefundLink")).toBeDefined();
    expect(screen.getByText("pricingInfoUpgradeLink")).toBeDefined();
  });
});
