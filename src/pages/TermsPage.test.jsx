import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TermsPage from "./TermsPage";
import { commonTranslations } from "../i18n/translations.common";

const tFor = (lang) => (key) => commonTranslations[lang]?.[key] ?? key;

function renderTerms(lang = "en") {
  render(<TermsPage t={tFor(lang)} lang={lang} theme="light" />);
}

describe("TermsPage — Miði #332 correction: temporary brand-only CampCast statement", () => {
  it("EN: statement is the exact approved temporary brand-only wording", () => {
    renderTerms("en");
    expect(commonTranslations.en.termsOperatorStatement).toBe(
      "CampCast is a brand used for Eltum Veðrið."
    );
    expect(screen.getByText(commonTranslations.en.termsOperatorStatement)).toBeDefined();
  });

  it("IS: statement is the exact approved temporary brand-only wording", () => {
    renderTerms("is");
    expect(commonTranslations.is.termsOperatorStatement).toBe(
      "CampCast er vörumerki sem notað er fyrir Eltum Veðrið."
    );
    expect(screen.getByText(commonTranslations.is.termsOperatorStatement)).toBeDefined();
  });

  it("EN: does not claim CampCast is the operator, legal business name, or data controller", () => {
    const text = commonTranslations.en.termsOperatorStatement;
    expect(text).not.toMatch(/operated by/i);
    expect(text).not.toMatch(/legal business name/i);
    expect(text).not.toMatch(/data controller/i);
  });

  it("IS: does not claim CampCast is the operator, legal business name, or data controller", () => {
    const text = commonTranslations.is.termsOperatorStatement;
    expect(text).not.toMatch(/rekið af/i);
    expect(text).not.toMatch(/rekstrarheiti/i);
    expect(text).not.toMatch(/ábyrgðaraðili/i);
  });

  it("EN: old operator statement text is not present anywhere on the rendered page", () => {
    renderTerms("en");
    expect(document.body.textContent).not.toContain("is operated by CampCast");
    expect(document.body.textContent).not.toContain("legal business name");
  });

  it("IS: old operator statement text is not present anywhere on the rendered page", () => {
    renderTerms("is");
    expect(document.body.textContent).not.toContain("rekið af CampCast");
    expect(document.body.textContent).not.toContain("rekstrarheiti");
  });
});

describe("TermsPage — Miði #332: legacy 'Chase the Weather' branding removed from EN body copy", () => {
  it("EN: termsIntro1/termsIntro3/termsLiability no longer say 'Chase the Weather'", () => {
    expect(commonTranslations.en.termsIntro1).not.toContain("Chase the Weather");
    expect(commonTranslations.en.termsIntro3).not.toContain("Chase the Weather");
    expect(commonTranslations.en.termsLiability).not.toContain("Chase the Weather");
  });

  it("EN: those paragraphs now refer to Eltum Veðrið instead", () => {
    expect(commonTranslations.en.termsIntro1).toContain("Eltum Veðrið");
    expect(commonTranslations.en.termsIntro3).toContain("Eltum Veðrið");
    expect(commonTranslations.en.termsLiability).toContain("Eltum Veðrið");
  });

  it("no 'Chase the Weather' anywhere in rendered EN Terms page", () => {
    renderTerms("en");
    expect(document.body.textContent).not.toContain("Chase the Weather");
  });
});

describe("TermsPage — all body paragraphs render in both locales", () => {
  const keys = [
    "termsOperatorStatement",
    "termsIntro1",
    "termsIntro2",
    "termsIntro3",
    "termsLiability",
  ];

  for (const lang of ["en", "is"]) {
    it(`${lang}: all paragraph keys present in translations`, () => {
      keys.forEach((key) => {
        expect(commonTranslations[lang][key], `missing key "${key}" in ${lang}`).toBeTruthy();
      });
    });

    it(`${lang}: all paragraphs render on the page`, () => {
      renderTerms(lang);
      keys.forEach((key) => {
        expect(screen.getByText(commonTranslations[lang][key])).toBeDefined();
      });
    });
  }
});
