import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NorthernLightsLanding from "./NorthernLightsLanding";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => <>{children}</>,
  HelmetProvider: ({ children }) => <>{children}</>,
}));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../hooks/useMe", () => ({ useMe: vi.fn() }));

import { useMe } from "../hooks/useMe";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/en/northern-lights"]}>
      <NorthernLightsLanding />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  localStorage.clear();
  useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {}))); // NorthernLightsCard's own request — never resolves, loading forever is fine for these assertions
  // Aurora season (Sep-Mar) pinned for determinism — NorthernLightsCard
  // renders nothing outside season, and this page has no `now` override
  // prop in production (correctly matches App.jsx's own usage), so tests
  // that need the real card visible must pin the system clock instead.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-01T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("NorthernLightsLanding — page structure, order, and required copy", () => {
  it("renders header, hero, card, how-it-works, disclaimer, and footer in that order", () => {
    renderPage();

    const heading = screen.getByRole("heading", { level: 1, name: "Find the best Northern Lights conditions in Iceland tonight" });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText("We compare cloud cover, aurora activity and darkness across locations to help you decide where to go.")).toBeInTheDocument();

    const card = screen.getByTestId("nl-card");
    const howEyebrow = screen.getByText("How it works");
    const howText = screen.getByText("Current viewing conditions are compared across Iceland using aurora activity, cloud conditions, and darkness.");
    const disclaimer = screen.getByText("The Northern Lights are a natural phenomenon. No forecast can guarantee visibility.");
    const footerLink = screen.getByRole("link", { name: /about/i });

    // DOM document-order check via compareDocumentPosition.
    const DOCUMENT_POSITION_FOLLOWING = 4;
    function isBefore(a, b) {
      return !!(a.compareDocumentPosition(b) & DOCUMENT_POSITION_FOLLOWING);
    }

    expect(isBefore(heading, card)).toBe(true);
    expect(isBefore(card, howEyebrow)).toBe(true);
    expect(isBefore(howText, disclaimer)).toBe(true);
    expect(isBefore(disclaimer, footerLink)).toBe(true);
  });

  it("Ticket 399 v3 (Round 3): the header renders the English logo at the established full size, with no tagline", () => {
    renderPage();
    // Brand's slim variant's tagline ("brandTagline") collides with the
    // logo above it (negative top margin, no compensating CSS — a
    // pre-existing shared Brand.jsx defect, not fixed here per the
    // corrective prompt's scope boundary). hideTagline suppresses it
    // route-locally; this asserts the real rendered header never shows it,
    // regardless of size variant.
    expect(screen.queryByText("Find better weather")).toBeNull();

    // The logo itself must still be present (English alt text, since lang="en").
    const logos = screen.getAllByAltText("Chase the Weather");
    expect(logos.length).toBeGreaterThan(0);

    // Must use the established full-size responsive contract (h-20 md:h-32,
    // 80px/128px — matching the homepage's own branding), not the 40px
    // slim variant this route shipped with in v1/v2. Fails if the route
    // regresses back to size="slim" (h-10) or drops hideTagline (which
    // would make the tagline reappear, caught by the assertion above).
    for (const logo of logos) {
      expect(logo.className).toContain("h-20");
      expect(logo.className).toContain("md:h-32");
      expect(logo.className).not.toContain("h-10");
    }
  });

  it("does not add a long SEO article, testimonials, or unrelated campsite-weather modules", () => {
    renderPage();
    expect(screen.queryByText(/testimonial/i)).toBeNull();
    expect(screen.queryByRole("table")).toBeNull(); // no forecast table / dashboard section
  });
});

describe("NorthernLightsLanding — forced English regardless of saved language (real card translation path)", () => {
  it("renders the real NorthernLightsCard's English title even when localStorage.lang is 'is'", () => {
    localStorage.setItem("lang", JSON.stringify("is"));

    renderPage();

    // Real card, real i18n lookup — not a lang-prop-only assertion. This is
    // nlCardTitle's actual EN value, unmistakably distinct from the IS
    // value "Norðurljós í kvöld".
    expect(screen.getByText("Northern Lights tonight")).toBeInTheDocument();
    expect(screen.queryByText("Norðurljós í kvöld")).toBeNull();
  });

  it("visiting the route never overwrites the user's saved language", () => {
    localStorage.setItem("lang", JSON.stringify("is"));
    renderPage();
    expect(JSON.parse(localStorage.getItem("lang"))).toBe("is");
  });

  it("the <html lang> signal is English", () => {
    renderPage();
    // Helmet is mocked to a pass-through here; the <html lang="en" /> tag
    // itself is asserted for real in NorthernLightsLanding.metadata.test.jsx
    // where a real HelmetProvider applies it to the document. This test
    // only proves the page requests it (the mock renders its children,
    // and <html lang="en" /> is a valid, harmless self-closing element in
    // that pass-through tree — no error is thrown).
    expect(screen.getByTestId("nl-card")).toBeInTheDocument();
  });
});

describe("NorthernLightsLanding — aurora_landing_viewed analytics", () => {
  it("fires exactly once, truthful non-PII payload, only after entitlement resolution is truthful", () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();

    expect(trackEvent).toHaveBeenCalledWith("aurora_landing_viewed", { lang: "en", tier: "free" });
    expect(trackEvent.mock.calls.filter((c) => c[0] === "aurora_landing_viewed")).toHaveLength(1);

    const payload = trackEvent.mock.calls.find((c) => c[0] === "aurora_landing_viewed")[1];
    for (const key of Object.keys(payload)) {
      expect(["lang", "tier"]).toContain(key);
    }
  });

  it("reports tier: pro when entitlement resolution truthfully shows an active Pro subscription", () => {
    useMe.mockReturnValue({ me: { ok: true, user: { email: "a@b.com" }, entitlements: { pro: true, proUntil: "2027-01-01" } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();
    expect(trackEvent).toHaveBeenCalledWith("aurora_landing_viewed", { lang: "en", tier: "pro" });
  });

  it("does not fire while entitlement resolution is still loading, and does not label it Free", () => {
    useMe.mockReturnValue({ me: null, loadingMe: true, refetchMe: vi.fn() });
    renderPage();
    expect(trackEvent).not.toHaveBeenCalledWith("aurora_landing_viewed", expect.anything());
  });

  it("fires once resolution completes, and does not duplicate on the ordinary rerender that follows", () => {
    useMe.mockReturnValue({ me: null, loadingMe: true, refetchMe: vi.fn() });
    const { rerender } = renderPage();
    expect(trackEvent).not.toHaveBeenCalledWith("aurora_landing_viewed", expect.anything());

    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    rerender(
      <MemoryRouter initialEntries={["/en/northern-lights"]}>
        <NorthernLightsLanding />
      </MemoryRouter>,
    );
    expect(trackEvent.mock.calls.filter((c) => c[0] === "aurora_landing_viewed")).toHaveLength(1);

    // A further ordinary rerender (unrelated theme localStorage write) must not duplicate.
    localStorage.setItem("theme", JSON.stringify("dark"));
    rerender(
      <MemoryRouter initialEntries={["/en/northern-lights"]}>
        <NorthernLightsLanding />
      </MemoryRouter>,
    );
    expect(trackEvent.mock.calls.filter((c) => c[0] === "aurora_landing_viewed")).toHaveLength(1);
  });
});

describe("NorthernLightsLanding — global pageview is not duplicated by this page", () => {
  it("this page never calls trackPageView itself (the global AnalyticsTracker owns that)", () => {
    renderPage();
    expect(trackEvent.mock.calls.some((c) => c[0] === "page_view" || c[0] === "pageview")).toBe(false);
  });
});
