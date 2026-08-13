import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "./PrivacyPage";
import { commonTranslations } from "../i18n/translations.common";

const tFor = (lang) => (key) => commonTranslations[lang]?.[key] ?? key;

function renderPrivacy(lang = "en") {
  render(<PrivacyPage t={tFor(lang)} theme="light" />);
}

describe("PrivacyPage — Miði #332: legacy 'Chase the Weather' branding removed from EN body copy", () => {
  it("EN: privacyIntro1/privacyPayments/privacySharing/privacyChanges no longer say 'Chase the Weather'", () => {
    expect(commonTranslations.en.privacyIntro1).not.toContain("Chase the Weather");
    expect(commonTranslations.en.privacyPayments).not.toContain("Chase the Weather");
    expect(commonTranslations.en.privacySharing).not.toContain("Chase the Weather");
    expect(commonTranslations.en.privacyChanges).not.toContain("Chase the Weather");
  });

  it("EN: those paragraphs now refer to Eltum Veðrið instead", () => {
    expect(commonTranslations.en.privacyIntro1).toContain("Eltum Veðrið");
    expect(commonTranslations.en.privacyPayments).toContain("Eltum Veðrið");
    expect(commonTranslations.en.privacySharing).toContain("Eltum Veðrið");
    expect(commonTranslations.en.privacyChanges).toContain("Eltum Veðrið");
  });

  it("no 'Chase the Weather' anywhere in rendered EN Privacy page", () => {
    renderPrivacy("en");
    expect(document.body.textContent).not.toContain("Chase the Weather");
  });

  it("IS body copy already used Eltum Veðrið and is unchanged", () => {
    expect(commonTranslations.is.privacyIntro1).toContain("Eltum Veðrið");
    expect(commonTranslations.is.privacyPayments).toContain("Eltum Veðrið");
    expect(commonTranslations.is.privacySharing).toContain("Eltum Veðrið");
    expect(commonTranslations.is.privacyChanges).toContain("Eltum Veðrið");
  });
});

describe("PrivacyPage — Miði #332: contact email uses canonical hello@eltumvedrid.is", () => {
  it("EN: contact mailto link and visible text use hello@eltumvedrid.is", () => {
    renderPrivacy("en");
    const link = screen.getByText("hello@eltumvedrid.is");
    expect(link.getAttribute("href")).toBe("mailto:hello@eltumvedrid.is");
  });

  it("IS: contact mailto link and visible text use hello@eltumvedrid.is", () => {
    renderPrivacy("is");
    const link = screen.getByText("hello@eltumvedrid.is");
    expect(link.getAttribute("href")).toBe("mailto:hello@eltumvedrid.is");
  });

  it("old campcast.is contact address no longer appears on the page", () => {
    renderPrivacy("en");
    expect(document.body.textContent).not.toContain("campcast.is");
  });
});

describe("PrivacyPage — all body paragraphs render in both locales", () => {
  const keys = [
    "privacyIntro1",
    "privacyIntro2",
    "privacyPayments",
    "privacyUsage",
    "privacySharing",
    "privacyRetention",
    "privacyRights",
    "privacyChanges",
  ];

  for (const lang of ["en", "is"]) {
    it(`${lang}: all paragraph keys present in translations`, () => {
      keys.forEach((key) => {
        expect(commonTranslations[lang][key], `missing key "${key}" in ${lang}`).toBeTruthy();
      });
    });

    it(`${lang}: all paragraphs render on the page`, () => {
      renderPrivacy(lang);
      keys.forEach((key) => {
        expect(screen.getByText(commonTranslations[lang][key])).toBeDefined();
      });
    });
  }
});
