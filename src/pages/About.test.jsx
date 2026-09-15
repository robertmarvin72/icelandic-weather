// Ticket 416 (#416) — compact Northern Lights section on About.jsx.
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import About from "./About";
import { translations } from "../i18n/translations";

function realT(lang) {
  const dict = translations[lang];
  return (k) => dict[k] ?? k;
}

describe("About — Ticket 416 (#416): Northern Lights section, real translations dictionary", () => {
  it.each(["is", "en"])("%s: renders exact heading, body, non-guarantee caveat, and seasonal note — no raw missing key leaks", (lang) => {
    const dict = translations[lang];
    const { container } = render(<About t={realT(lang)} lang={lang} />);

    expect(screen.getByText(dict.aboutAuroraTitle)).toBeInTheDocument();
    expect(screen.getByText(dict.aboutAuroraBody)).toBeInTheDocument();
    expect(screen.getByText(dict.aboutAuroraProNote)).toBeInTheDocument();
    expect(screen.getByText(dict.auroraInfoSameAssessment)).toBeInTheDocument();
    expect(screen.getByText(dict.auroraInfoNoGuarantee)).toBeInTheDocument();
    expect(container.textContent).toContain(dict.auroraInfoSeasonalNote);

    for (const key of [
      "aboutAuroraTitle",
      "aboutAuroraBody",
      "aboutAuroraProNote",
      "auroraInfoSameAssessment",
      "auroraInfoNoGuarantee",
      "auroraInfoSeasonalNote",
      "aboutAuroraLink",
    ]) {
      expect(dict[key]).toBeTypeOf("string");
      expect(dict[key].length).toBeGreaterThan(0);
      expect(dict[key]).not.toBe(key);
      expect(screen.queryByText(key)).toBeNull();
    }
  });

  it("Icelandic (default/is): the forecast link targets the same-page anchor, not a standalone route", () => {
    render(<About t={realT("is")} lang="is" />);
    const link = screen.getByText(translations.is.aboutAuroraLink);
    expect(link.closest("a")).toHaveAttribute("href", "/#northern-lights");
  });

  it("English: the forecast link targets the permanent forced-English standalone route", () => {
    render(<About t={realT("en")} lang="en" />);
    const link = screen.getByText(translations.en.aboutAuroraLink);
    expect(link.closest("a")).toHaveAttribute("href", "/en/northern-lights");
  });

  it("defaults to the Icelandic anchor when lang is omitted (safe default, matches app-wide default language)", () => {
    render(<About t={realT("is")} />);
    const link = screen.getByText(translations.is.aboutAuroraLink);
    expect(link.closest("a")).toHaveAttribute("href", "/#northern-lights");
  });

  it("does not invent a standalone Icelandic Aurora route (/is/northern-lights)", () => {
    render(<About t={realT("is")} lang="is" />);
    const link = screen.getByText(translations.is.aboutAuroraLink);
    expect(link.closest("a").getAttribute("href")).not.toMatch(/\/is\/northern-lights/);
  });

  it("preserves all pre-existing About content unchanged (features, pro features, outro, support)", () => {
    const dict = translations.is;
    render(<About t={realT("is")} lang="is" />);
    expect(screen.getByText(dict.aboutTitle)).toBeInTheDocument();
    expect(screen.getByText(dict.aboutFeaturesTitle)).toBeInTheDocument();
    expect(screen.getByText(dict.aboutProTitle)).toBeInTheDocument();
    expect(screen.getByText(dict.aboutOutro)).toBeInTheDocument();
    expect(screen.getByText(dict.aboutSupportTitle)).toBeInTheDocument();
    for (const item of dict.aboutFeatures) expect(screen.getByText(item)).toBeInTheDocument();
    for (const item of dict.aboutProFeatures) expect(screen.getByText(item)).toBeInTheDocument();
  });
});

describe("About — Ticket 416 (#416) Round 2 correction: aboutAuroraBody no longer falsely promises a per-site assessment", () => {
  // Literal expected strings, independent of the imported dictionary
  // values — a corruption of the dictionary itself would not silently
  // pass this test the way `dict.aboutAuroraBody` comparisons would.
  const EXACT_EN =
    "We assess Northern Lights activity together with local weather conditions to evaluate tonight's viewing conditions at the places we check.";
  const EXACT_IS =
    "Við metum norðurljósavirkni ásamt staðbundnum veðurskilyrðum til að meta aðstæður til norðurljósaskoðunar í kvöld á þeim stöðum sem við skoðum.";

  it("EN: renders the exact corrected literal sentence", () => {
    render(<About t={realT("en")} lang="en" />);
    expect(screen.getByText(EXACT_EN)).toBeInTheDocument();
  });

  it("IS: renders the exact corrected literal sentence", () => {
    render(<About t={realT("is")} lang="is" />);
    expect(screen.getByText(EXACT_IS)).toBeInTheDocument();
  });

  it("EN: the former personalized claim is gone", () => {
    const { container } = render(<About t={realT("en")} lang="en" />);
    expect(container.textContent).not.toMatch(/at your campsite/i);
  });

  it("IS: the former personalized claim is gone", () => {
    const { container } = render(<About t={realT("is")} lang="is" />);
    expect(container.textContent).not.toMatch(/á þínu tjaldsvæði/i);
  });

  it("EN dictionary value matches the exact corrected literal (belt-and-braces, not a substitute for the literal assertions above)", () => {
    expect(translations.en.aboutAuroraBody).toBe(EXACT_EN);
  });

  it("IS dictionary value matches the exact corrected literal (belt-and-braces, not a substitute for the literal assertions above)", () => {
    expect(translations.is.aboutAuroraBody).toBe(EXACT_IS);
  });
});
