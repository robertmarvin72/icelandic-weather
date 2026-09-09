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
vi.mock("../components/NorthernLightsCard", () => ({
  default: vi.fn(() => <div data-testid="nl-card-stub" />),
}));

const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateSpy };
});

import { useMe } from "../hooks/useMe";
import { trackEvent } from "../lib/analytics";
import NorthernLightsCard from "../components/NorthernLightsCard";
import NorthernLightsLanding from "./NorthernLightsLanding";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/en/northern-lights"]}>
      <NorthernLightsLanding />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("theme", JSON.stringify("dark"));
});

describe("NorthernLightsLanding — exact props reach the canonical NorthernLightsCard", () => {
  it("passes the independently-built English t, lang='en', truthful entitlements, and the saved theme", () => {
    useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();

    expect(NorthernLightsCard).toHaveBeenCalledOnce();
    const props = NorthernLightsCard.mock.calls[0][0];

    expect(props.lang).toBe("en");
    expect(props.theme).toBe("dark");
    expect(props.t("nlCardTitle")).toBe(northernLightsTranslations.en.nlCardTitle);
    expect(props.t("nlCardTitle")).not.toBe(northernLightsTranslations.is.nlCardTitle);
    expect(props.entitlements).toEqual({ isPro: false, proUntil: null });
    expect(typeof props.onUpgrade).toBe("function");
    // Ticket 403 (#403): the page must request the landing presentation
    // explicitly — the homepage/default consumer never passes this.
    expect(props.variant).toBe("landing");
  });

  it("reflects a truthful Pro entitlement", () => {
    useMe.mockReturnValue({ me: { ok: true, user: { email: "a@b.com" }, entitlements: { pro: true, proUntil: "2027-01-01" } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();
    const props = NorthernLightsCard.mock.calls[0][0];
    expect(props.entitlements).toEqual({ isPro: true, proUntil: "2027-01-01" });
  });

  it("never assumes Pro or Free before entitlement resolution — reflects the safe default while loading, matching the homepage's own contract", () => {
    useMe.mockReturnValue({ me: null, loadingMe: true, refetchMe: vi.fn() });
    renderPage();
    const props = NorthernLightsCard.mock.calls[0][0];
    expect(props.entitlements).toEqual({ isPro: false, proUntil: null });
  });
});

describe("NorthernLightsLanding — the card's upgrade source reaches the existing checkout boundary unchanged", () => {
  it("logged-in Free user: calling the card's onUpgrade('northern_lights_card') navigates to /pricing carrying that exact source", async () => {
    useMe.mockReturnValue({
      me: { ok: true, user: { email: "camper@example.com" }, entitlements: { pro: false, proUntil: null } },
      loadingMe: false,
      refetchMe: vi.fn(),
    });
    renderPage();

    const { onUpgrade } = NorthernLightsCard.mock.calls[0][0];
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

    const { onUpgrade } = NorthernLightsCard.mock.calls[0][0];
    await act(async () => {
      await onUpgrade("northern_lights_card");
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

describe("NorthernLightsLanding — Ticket 403: the lower conversion section's own CTA", () => {
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

  it("the value-section CTA never fires the card's own northern_lights_upgrade_clicked event", async () => {
    useMe.mockReturnValue({ me: { ok: true, user: { email: "camper@example.com" }, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
    renderPage();

    await act(async () => {
      screen.getByRole("button", { name: "Show me where to go tonight" }).click();
    });

    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_upgrade_clicked")).toBe(false);
  });
});
