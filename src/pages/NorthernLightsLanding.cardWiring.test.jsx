import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { northernLightsTranslations } from "../i18n/translations.northernLights";

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }) => <>{children}</>,
  HelmetProvider: ({ children }) => <>{children}</>,
}));
vi.mock("../hooks/useMe", () => ({ useMe: vi.fn() }));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../components/NorthernLightsThreeNight", () => ({
  default: vi.fn(() => <div data-testid="nl3-module-stub" />),
}));

import { useMe } from "../hooks/useMe";
import NorthernLightsThreeNight from "../components/NorthernLightsThreeNight";
import NorthernLightsLanding from "./NorthernLightsLanding";

function renderPage(entry = "/en/northern-lights") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <NorthernLightsLanding />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("theme", JSON.stringify("dark"));
});

describe("NorthernLightsLanding — exact props reach the canonical NorthernLightsThreeNight module", () => {
  it("passes the independently-built English t, lang='en', truthful entitlements, the saved theme, and truthful loadingMe", () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();

    expect(NorthernLightsThreeNight).toHaveBeenCalledOnce();
    const props = NorthernLightsThreeNight.mock.calls[0][0];

    expect(props.lang).toBe("en");
    expect(props.theme).toBe("dark");
    expect(props.t("nlMultiSectionTitle")).toBe(northernLightsTranslations.en.nlMultiSectionTitle);
    expect(props.t("nlMultiSectionTitle")).not.toBe(northernLightsTranslations.is.nlMultiSectionTitle);
    expect(props.entitlements).toEqual({ isPro: false, proUntil: null });
    // Ticket #431: no onUpgrade prop reaches the module any more — removed
    // along with the teaser/purchase-callback journey.
    expect(props.onUpgrade).toBeUndefined();
    expect(props.loadingMe).toBe(false);
  });

  it("reflects a truthful Pro entitlement", () => {
    useMe.mockReturnValue({ me: { ok: true, user: { email: "a@b.com" }, entitlements: { pro: true, proUntil: "2027-01-01" } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();
    const props = NorthernLightsThreeNight.mock.calls[0][0];
    expect(props.entitlements).toEqual({ isPro: true, proUntil: "2027-01-01" });
  });

  it("never assumes Pro or Free before entitlement resolution — reflects the safe default while loading, and reports loadingMe truthfully", () => {
    useMe.mockReturnValue({ me: null, loadingMe: true, refetchMe: vi.fn() });
    renderPage();
    const props = NorthernLightsThreeNight.mock.calls[0][0];
    expect(props.entitlements).toEqual({ isPro: false, proUntil: null });
    expect(props.loadingMe).toBe(true);
  });
});

// This file mocks NorthernLightsThreeNight (verified: the page imports that
// module, not the retired NorthernLightsCard) purely to pin the exact props
// the page passes. The real shared component, hook, policy and router
// hand-off are exercised un-mocked in NorthernLightsLanding.homeHandoff.test.jsx.
describe("NorthernLightsLanding — #425 surface and query wiring props", () => {
  it("declares surface=landing and passes a query-derived requestedDate plus a selection-report callback", () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage("/en/northern-lights?date=2026-09-26&utm_source=x");
    const props = NorthernLightsThreeNight.mock.calls[0][0];
    expect(props.surface).toBe("landing");
    expect(props.requestedDate).toBe("2026-09-26");
    expect(typeof props.onSelectedDateChange).toBe("function");
  });

  it("passes requestedDate=null for a missing, duplicate, malformed or impossible date", () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    for (const entry of [
      "/en/northern-lights",
      "/en/northern-lights?date=2026-09-26&date=2026-09-27",
      "/en/northern-lights?date=nope",
      "/en/northern-lights?date=2026-02-30",
    ]) {
      NorthernLightsThreeNight.mockClear();
      const { unmount } = renderPage(entry);
      expect(NorthernLightsThreeNight.mock.calls[0][0].requestedDate, entry).toBeNull();
      unmount();
    }
  });
});

// Ticket #431: the module's onUpgrade callback, the login/checkout boundary
// it used to reach, and the lower conversion section's own CTA are all
// removed from this page — covered by NorthernLightsLanding.test.jsx's own
// "the lower conversion section is removed, for every tier" assertions.
