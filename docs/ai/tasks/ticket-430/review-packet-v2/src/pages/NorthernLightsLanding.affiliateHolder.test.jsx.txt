// Ticket #430 — NorthernLightsLanding's own affiliate impression holder:
// a fresh visit per genuine page mount, surviving the ?date query replace
// (which never remounts this page). Mocks NorthernLightsThreeNight itself
// (same established pattern as NorthernLightsLanding.cardWiring.test.jsx)
// and inspects the exact `affiliateImpressionHolder` prop it receives.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("theme", JSON.stringify("dark"));
  useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
});

function latestProps() {
  return NorthernLightsThreeNight.mock.calls[NorthernLightsThreeNight.mock.calls.length - 1][0];
}

describe("NorthernLightsLanding — affiliate impression holder", () => {
  it("passes a holder with a visitId string and a tryConsume function", () => {
    renderPage();
    const { affiliateImpressionHolder } = latestProps();
    expect(affiliateImpressionHolder).toBeTruthy();
    expect(typeof affiliateImpressionHolder.visitId).toBe("string");
    expect(affiliateImpressionHolder.visitId.length).toBeGreaterThan(0);
    expect(typeof affiliateImpressionHolder.tryConsume).toBe("function");
  });

  it("two separate mounts get two different visit ids", () => {
    const a = renderPage();
    const idA = latestProps().affiliateImpressionHolder.visitId;
    a.unmount();

    renderPage();
    const idB = latestProps().affiliateImpressionHolder.visitId;

    expect(idA).not.toBe(idB);
  });

  it("the holder actually gates: tryConsume succeeds once per placement, then fails", () => {
    renderPage();
    const { affiliateImpressionHolder } = latestProps();
    expect(affiliateImpressionHolder.tryConsume(affiliateImpressionHolder.visitId, "northern_lights_forecast")).toBe(true);
    expect(affiliateImpressionHolder.tryConsume(affiliateImpressionHolder.visitId, "northern_lights_forecast")).toBe(false);
  });

  it("the ?date selection replace (onSelectedDateChange) does not change the visit id — same visit, same holder", () => {
    renderPage();
    const firstProps = latestProps();
    const idBefore = firstProps.affiliateImpressionHolder.visitId;
    // Consume the opportunity BEFORE the simulated selection, to prove the
    // replace does not reopen it.
    expect(firstProps.affiliateImpressionHolder.tryConsume(idBefore, "northern_lights_forecast")).toBe(true);

    // Simulate the real child calling back with a new selected night, exactly
    // as NorthernLightsThreeNight does via onSelectedDateChange -> router replace.
    act(() => {
      firstProps.onSelectedDateChange("2026-09-27", { isInitial: false });
    });

    const afterProps = latestProps();
    expect(afterProps.affiliateImpressionHolder.visitId).toBe(idBefore);
    // Same visit: the already-consumed placement stays consumed (not reopened).
    expect(afterProps.affiliateImpressionHolder.tryConsume(idBefore, "northern_lights_forecast")).toBe(false);
  });

  it("the initial ?date in the URL does not by itself consume or reset anything (viewedRef/Helmet path untouched)", () => {
    renderPage("/en/northern-lights?date=2026-09-26");
    const props = latestProps();
    expect(props.requestedDate).toBe("2026-09-26");
    expect(typeof props.affiliateImpressionHolder.visitId).toBe("string");
  });
});
