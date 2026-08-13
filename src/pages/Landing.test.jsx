import React from "react";
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "./Landing";

// jsdom has no IntersectionObserver — needed by framer-motion's whileInView
// sections on this page. Minimal stub, test-environment only.
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const t = (k) => k;

function renderLanding(initialEntry = "/iceland-camping-weather") {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Landing t={t} />
    </MemoryRouter>
  );
}

describe("Landing — hero page CTAs point at canonical eltumvedrid.is (not campcast.is)", () => {
  it("no CTA on the page links to campcast.is", () => {
    renderLanding();
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.getAttribute("href")).not.toMatch(/campcast\.is/);
    }
  });

  it("header, hero, and final CTAs all point to https://eltumvedrid.is/ when there is no query string", () => {
    renderLanding("/iceland-camping-weather");
    const links = screen.getAllByRole("link");
    const appLinks = links.filter((l) => l.getAttribute("href")?.startsWith("https://eltumvedrid.is"));
    // header CTA, hero primary CTA, final CTA
    expect(appLinks.length).toBe(3);
    for (const link of appLinks) {
      expect(link.getAttribute("href")).toBe("https://eltumvedrid.is/");
    }
  });

  it("preserves UTM query params from the landing page onto every app CTA", () => {
    renderLanding("/iceland-camping-weather?utm_source=facebook&utm_campaign=launch");
    const links = screen.getAllByRole("link");
    const appLinks = links.filter((l) => l.getAttribute("href")?.startsWith("https://eltumvedrid.is"));
    expect(appLinks.length).toBe(3);
    for (const link of appLinks) {
      expect(link.getAttribute("href")).toBe(
        "https://eltumvedrid.is/?utm_source=facebook&utm_campaign=launch"
      );
    }
  });

  it("in-page anchor links (#how-it-works etc.) are untouched", () => {
    // Landing.jsx has its own internal `tr()` (landingTranslations), independent
    // of the `t` prop, so assert on the actual rendered EN copy here. Scoped to
    // the header nav since some labels ("How it works") also appear as section
    // headings further down the page.
    renderLanding();
    const nav = within(document.querySelector("nav"));
    expect(nav.getByText("How it works").getAttribute("href")).toBe("#how-it-works");
    expect(nav.getByText("Why").getAttribute("href")).toBe("#why-campcast");
    expect(nav.getByText("Screenshots").getAttribute("href")).toBe("#screenshots");
  });
});
