import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";

// #217 pre-upgrade regression gate — route-matching baseline against
// react-router-dom@7.12.0. Renders the REAL AppRoutes.jsx (real path strings,
// real <Routes>/<Route> table) so matching runs through react-router's own
// matchRoutes engine, not a hand-copied route array that could drift out of
// sync with the real file. Every leaf page import is replaced with a trivial
// data-testid stub — this suite asserts observable route outcome only
// (which route won), never a leaf page's internal behavior.
//
// usePageRouteProps/useMe/useToast are the only app hooks AppRoutes.jsx calls
// directly (confirmed via full-file audit, #217 addendum) — that's why only
// these three are mocked alongside the leaf page imports.

vi.mock("./hooks/usePageRouteProps", () => ({
  usePageRouteProps: () => ({ t: (k) => k, lang: "en", theme: "light" }),
}));
vi.mock("./hooks/useMe", () => ({ useMe: () => ({ me: null }) }));
vi.mock("./hooks/useToast", () => ({ useToast: () => ({ pushToast: () => {} }) }));

vi.mock("./pages/About", () => ({ default: () => <div data-testid="page-about" /> }));
vi.mock("./pages/NotFound", () => ({ default: () => <div data-testid="page-notfound" /> }));
vi.mock("./pages/Pricing", () => ({ default: () => <div data-testid="page-pricing" /> }));
vi.mock("./pages/PricingInfo", () => ({ default: () => <div data-testid="page-pricing-info" /> }));
vi.mock("./pages/PrivacyPage", () => ({ default: () => <div data-testid="page-privacy" /> }));
vi.mock("./pages/RefundPage", () => ({ default: () => <div data-testid="page-refund" /> }));
vi.mock("./pages/Subscribe", () => ({ default: () => <div data-testid="page-subscribe" /> }));
vi.mock("./pages/Success", () => ({ default: () => <div data-testid="page-success" /> }));
vi.mock("./pages/TermsPage", () => ({ default: () => <div data-testid="page-terms" /> }));
vi.mock("./pages/AdminDashboard", () => ({ default: () => <div data-testid="page-admin" /> }));
vi.mock("./pages/Landing", () => ({ default: () => <div data-testid="page-landing" /> }));
vi.mock("./pages/BlogIndex", () => ({ default: () => <div data-testid="page-blogindex" /> }));
vi.mock("./pages/BlogPostPage", () => ({ default: () => <div data-testid="page-blogpost" /> }));
vi.mock("./pages/Brochure", () => ({ default: () => <div data-testid="page-brochure" /> }));
vi.mock("./pages/CampaignLandingPage", () => ({
  default: () => <div data-testid="page-campaign" />,
}));
vi.mock("./pages/Welcome", () => ({ default: () => <div data-testid="page-welcome" /> }));

function StubHome() {
  return <div data-testid="page-home" />;
}

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes HomeComponent={StubHome} />
    </MemoryRouter>
  );
}

describe("AppRoutes — route-matching baseline (#217 pre-upgrade regression gate, react-router-dom@7.12.0)", () => {
  it("/pricing renders the Pricing route", () => {
    renderAt("/pricing");
    expect(screen.getByTestId("page-pricing")).toBeInTheDocument();
  });

  it("/pricing/ (trailing slash) renders the Pricing route", () => {
    renderAt("/pricing/");
    expect(screen.getByTestId("page-pricing")).toBeInTheDocument();
  });

  it("/pricing// (trailing double slash) renders the Pricing route — current trailing-slash tolerance", () => {
    renderAt("/pricing//");
    expect(screen.getByTestId("page-pricing")).toBeInTheDocument();
  });

  it("/blog/asbyrgi renders the BlogPost route", () => {
    renderAt("/blog/asbyrgi");
    expect(screen.getByTestId("page-blogpost")).toBeInTheDocument();
  });

  it("/blog//asbyrgi (internal double slash) renders NotFound", () => {
    renderAt("/blog//asbyrgi");
    expect(screen.getByTestId("page-notfound")).toBeInTheDocument();
  });

  it("/en/blog//asbyrgi (internal double slash) renders NotFound", () => {
    renderAt("/en/blog//asbyrgi");
    expect(screen.getByTestId("page-notfound")).toBeInTheDocument();
  });

  it("//pricing (leading double slash) renders NotFound", () => {
    renderAt("//pricing");
    expect(screen.getByTestId("page-notfound")).toBeInTheDocument();
  });

  it("an unknown path renders NotFound", () => {
    renderAt("/does-not-exist");
    expect(screen.getByTestId("page-notfound")).toBeInTheDocument();
  });
});
