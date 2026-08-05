import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RefundPage from "./RefundPage";
import { commonTranslations } from "../i18n/translations.common";

const tFor = (lang) => (key) => commonTranslations[lang]?.[key] ?? key;

function renderRefund(lang = "en") {
  render(<RefundPage t={tFor(lang)} theme="light" />);
}

describe("RefundPage — passes paragraph", () => {
  it("EN: passes paragraph renders", () => {
    renderRefund("en");
    expect(screen.getByText(commonTranslations.en.refundPasses)).toBeDefined();
  });

  it("IS: passes paragraph renders", () => {
    renderRefund("is");
    expect(screen.getByText(commonTranslations.is.refundPasses)).toBeDefined();
  });
});

describe("RefundPage — 14-day window includes passes", () => {
  it("EN: refundWindow mentions pass", () => {
    expect(commonTranslations.en.refundWindow).toMatch(/pass/i);
  });

  it("IS: refundWindow mentions passa", () => {
    expect(commonTranslations.is.refundWindow).toMatch(/passa/i);
  });

  it("EN: refundWindow renders on page", () => {
    renderRefund("en");
    expect(screen.getByText(commonTranslations.en.refundWindow)).toBeDefined();
  });

  it("IS: refundWindow renders on page", () => {
    renderRefund("is");
    expect(screen.getByText(commonTranslations.is.refundWindow)).toBeDefined();
  });
});

describe("RefundPage — contact email updated", () => {
  it("EN: contact text contains hello@eltumvedrid.is", () => {
    expect(commonTranslations.en.refundContact).toContain("hello@eltumvedrid.is");
  });

  it("IS: contact text contains hello@eltumvedrid.is", () => {
    expect(commonTranslations.is.refundContact).toContain("hello@eltumvedrid.is");
  });

  it("EN: old email not present", () => {
    expect(commonTranslations.en.refundContact).not.toContain("campcast.is");
  });

  it("IS: old email not present", () => {
    expect(commonTranslations.is.refundContact).not.toContain("campcast.is");
  });
});

describe("RefundPage — access revoked paragraph", () => {
  it("EN: refundAccessRevoked renders", () => {
    renderRefund("en");
    expect(screen.getByText(commonTranslations.en.refundAccessRevoked)).toBeDefined();
  });

  it("IS: refundAccessRevoked renders", () => {
    renderRefund("is");
    expect(screen.getByText(commonTranslations.is.refundAccessRevoked)).toBeDefined();
  });
});

describe("RefundPage — all 8 paragraphs render in both locales", () => {
  const keys = [
    "refundIntro",
    "refundCancel",
    "refundPasses",
    "refundWindow",
    "refundAfterWindow",
    "refundRenewals",
    "refundAccessRevoked",
    "refundContact",
  ];

  for (const lang of ["en", "is"]) {
    it(`${lang}: all paragraph keys present in translations`, () => {
      keys.forEach((key) => {
        expect(
          commonTranslations[lang][key],
          `missing key "${key}" in ${lang}`
        ).toBeTruthy();
      });
    });
  }
});
