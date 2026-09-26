import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
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

const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateSpy };
});

import { useMe } from "../hooks/useMe";
import { trackEvent } from "../lib/analytics";
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
    expect(typeof props.onUpgrade).toBe("function");
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

describe("NorthernLightsLanding — the module's upgrade source reaches the existing checkout boundary unchanged", () => {
  it("logged-in Free user: calling the module's onUpgrade('northern_lights_card') navigates to /pricing carrying that exact source", async () => {
    useMe.mockReturnValue({
      me: { ok: true, user: { email: "camper@example.com" }, entitlements: { pro: false, proUntil: null } },
      loadingMe: false,
      refetchMe: vi.fn(),
    });
    renderPage();

    const { onUpgrade } = NorthernLightsThreeNight.mock.calls[0][0];
    await act(async () => {
      await onUpgrade("northern_lights_card");
    });

    expect(navigateSpy).toHaveBeenCalledOnce();
    const [destination] = navigateSpy.mock.calls[0];
    const url = new URL(destination, "https://example.test");
    expect(url.pathname).toBe("/pricing");
    expect(url.searchParams.get("src")).toBe("northern_lights_card");
    expect(url.searchParams.get("email")).toBe("camper@example.com");
  });

  it("anonymous visitor: calling onUpgrade opens the existing login modal instead of inventing a new auth flow", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();

    expect(screen.queryByRole("dialog")).toBeNull();

    const { onUpgrade } = NorthernLightsThreeNight.mock.calls[0][0];
    await act(async () => {
      await onUpgrade("northern_lights_card");
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

describe("NorthernLightsLanding — Ticket 403: the lower conversion section's own CTA (unaffected by Ticket #423 Phase 2)", () => {
  it("logged-in Free user: clicking the value-section CTA fires northern_lights_landing_cta_clicked (placement: value_section) exactly once, then navigates to /pricing carrying that exact source", async () => {
    useMe.mockReturnValue({
      me: { ok: true, user: { email: "camper@example.com" }, entitlements: { pro: false, proUntil: null } },
      loadingMe: false,
      refetchMe: vi.fn(),
    });
    renderPage();

    await act(async () => {
      screen.getByRole("button", { name: "Show me where to go tonight" }).click();
    });

    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_landing_cta_clicked")).toHaveLength(1);
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_landing_cta_clicked", {
      lang: "en",
      tier: "free",
      placement: "value_section",
      source: "northern_lights_landing_value_section",
    });

    expect(navigateSpy).toHaveBeenCalledOnce();
    const [destination] = navigateSpy.mock.calls[0];
    const url = new URL(destination, "https://example.test");
    expect(url.pathname).toBe("/pricing");
    expect(url.searchParams.get("src")).toBe("northern_lights_landing_value_section");
  });

  it("the value-section CTA never fires the multi-night module's own northern_lights_multi_day_upgrade_clicked event", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: { email: "camper@example.com" }, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();

    await act(async () => {
      screen.getByRole("button", { name: "Show me where to go tonight" }).click();
    });

    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_multi_day_upgrade_clicked")).toBe(false);
  });
});
