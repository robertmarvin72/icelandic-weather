import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

const t = (k) => k;

function renderFooter() {
  render(
    <MemoryRouter>
      <Footer t={t} />
    </MemoryRouter>
  );
}

describe("Footer — Miði #332: legal links and contact email", () => {
  it("links to /terms, /privacy, and /refund", () => {
    renderFooter();
    expect(screen.getByText("footerTerms").getAttribute("href")).toBe("/terms");
    expect(screen.getByText("footerPrivacy").getAttribute("href")).toBe("/privacy");
    expect(screen.getByText("footerRefund").getAttribute("href")).toBe("/refund");
  });

  it("contact link uses canonical hello@eltumvedrid.is", () => {
    renderFooter();
    const contactLink = screen.getByText(/footerContact/).closest("a");
    expect(contactLink.getAttribute("href")).toBe("mailto:hello@eltumvedrid.is");
    expect(contactLink.textContent).toContain("hello@eltumvedrid.is");
  });

  it("no campcast.is reference anywhere in the footer", () => {
    renderFooter();
    expect(document.body.textContent).not.toContain("campcast.is");
  });
});
