import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AffiliateCta from "./AffiliateCta";
import { trackEvent } from "../lib/analytics";
import { translations } from "../i18n/translations";
import { createAffiliateImpressionHolder } from "../lib/affiliateImpressionHolder";
import { VIATOR_NORTHERN_LIGHTS_URL } from "../config/affiliateOffers";
import { NL_FREE_EXPERIMENT_ID } from "../config/features";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

// Same FakeIntersectionObserver pattern as WeatherVoiceCard.test.jsx.
class FakeIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {
    this.disconnected = true;
  }
  trigger(entries) {
    this.callback(entries);
  }
}
FakeIntersectionObserver.instances = [];

function tFor(lang) {
  const dict = translations[lang];
  return (k) => dict[k] ?? k;
}

function holderWith(visitId = "v1") {
  const raw = createAffiliateImpressionHolder();
  raw.startVisit(visitId);
  return { visitId, tryConsume: (v, p) => raw.tryConsume(v, p), raw };
}

describe("AffiliateCta — exact URL, attributes and copy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("outbound anchor uses the exact Viator URL, new-tab target and sponsored rel", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    const link = screen.getByRole("link", { name: /Compare Northern Lights tours/ });
    expect(link.getAttribute("href")).toBe(VIATOR_NORTHERN_LIGHTS_URL);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer sponsored");
  });

  it("renders exact EN copy and disclosure beneath the CTA", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    expect(screen.getByText("Want to join a Northern Lights tour?")).toBeInTheDocument();
    expect(screen.getByText(/Prefer to go with a local guide\?/)).toBeInTheDocument();
    expect(screen.getByText("Partner link · We may earn a commission if you book.")).toBeInTheDocument();
  });

  it("renders exact IS copy and disclosure beneath the CTA", () => {
    render(<AffiliateCta t={tFor("is")} placement="homepage_northern_lights" />);
    expect(screen.getByText("Viltu fara í norðurljósaferð með leiðsögumanni?")).toBeInTheDocument();
    expect(screen.getByText("Skoða norðurljósaferðir")).toBeInTheDocument();
    expect(screen.getByText("Samstarfstengill · Við gætum fengið þóknun ef þú bókar ferð.")).toBeInTheDocument();
  });

  it("accessible name begins with the visible CTA label and includes the translated new-tab suffix", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    const link = screen.getByRole("link");
    expect(link.textContent.startsWith("Compare Northern Lights tours")).toBe(true);
    expect(link.textContent).toContain("(opens in a new tab)");
  });

  it("IS accessible suffix text", () => {
    render(<AffiliateCta t={tFor("is")} placement="homepage_northern_lights" />);
    expect(screen.getByRole("link").textContent).toContain("(opnast í nýjum flipa)");
  });

  // #430 v2/F1: disclosure must be at least text-xs (12px), not text-[11px].
  // Class guard only; the real evidence is the browser-measured computed
  // font-size in the v2 browser harness (see cc-report.md's v2 section).
  it("disclosure uses the text-xs class guard, not the old text-[11px]", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    const disclosure = screen.getByText("Partner link · We may earn a commission if you book.");
    expect(disclosure.className).toContain("text-xs");
    expect(disclosure.className).not.toContain("text-[11px]");
  });
});

describe("AffiliateCta — impression (IntersectionObserver + visibilityState)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("no event on render alone (no trigger)", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("no event at 0.49 (below threshold)", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 0.49 }]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("no event when isIntersecting is false even at ratio 0.6", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: false, intersectionRatio: 0.6 }]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("emits exactly one affiliate_offer_viewed at exactly 0.50", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 0.5 }]);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("affiliate_offer_viewed", {
      partner: "viator",
      campaign: "northern_lights",
      placement: "homepage_northern_lights",
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
      forecast_verdict: "good",
      selected_night: "2026-09-25",
    });
  });

  it("no event at 0.4 (explicit sub-threshold case)", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 0.4 }]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("evaluates the LAST entry when a callback carries several", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([
      { isIntersecting: true, intersectionRatio: 0.9 },
      { isIntersecting: false, intersectionRatio: 0 },
    ]);
    expect(trackEvent).not.toHaveBeenCalled(); // last entry is non-intersecting
  });

  it("fires only once even if the threshold is crossed twice", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    const inst = FakeIntersectionObserver.instances[0];
    inst.trigger([{ isIntersecting: true, intersectionRatio: 0.8 }]);
    inst.trigger([{ isIntersecting: false, intersectionRatio: 0 }]);
    inst.trigger([{ isIntersecting: true, intersectionRatio: 0.8 }]);
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("omits forecast_verdict/selected_night when absent, never a fabricated placeholder", () => {
    render(<AffiliateCta t={tFor("en")} placement="northern_lights_forecast" holder={holderWith()} />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(trackEvent).toHaveBeenCalledWith("affiliate_offer_viewed", {
      partner: "viator",
      campaign: "northern_lights",
      placement: "northern_lights_forecast",
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
    });
  });

  it("holder absent: CTA renders and is clickable, but no impression event ever fires", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" band="good" selectedNight="2026-09-25" />);
    expect(screen.getByRole("link")).toBeInTheDocument();
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("already-consumed holder (another CTA instance already fired this visit+placement): no second impression", () => {
    const holder = holderWith("v1");
    holder.tryConsume("v1", "homepage_northern_lights"); // pre-consume, as if a prior mount already fired
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holder} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("a stale holder visitId (captured before the owner moved to a new visit) cannot consume", () => {
    const raw = createAffiliateImpressionHolder();
    raw.startVisit("v1");
    const staleHolder = { visitId: "v1", tryConsume: (v, p) => raw.tryConsume(v, p) };
    raw.startVisit("v2"); // owner already moved on before this CTA's observer fires
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={staleHolder} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("hidden tab: an eligible intersection does not consume the holder", () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("a later visibilitychange to visible, with the element still intersecting, emits once", () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    FakeIntersectionObserver.instances[0].trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(trackEvent).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("disconnects the observer and removes the visibilitychange listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(
      <AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />
    );
    const inst = FakeIntersectionObserver.instances[0];
    unmount();
    expect(inst.disconnected).toBe(true);
    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("a stale/obsolete callback after cleanup never fires", () => {
    const { unmount } = render(
      <AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />
    );
    const inst = FakeIntersectionObserver.instances[0];
    unmount();
    inst.trigger([{ isIntersecting: true, intersectionRatio: 1 }]); // the component already cleaned up
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("missing IntersectionObserver: no fabricated impression, no crash", () => {
    vi.unstubAllGlobals();
    const original = globalThis.IntersectionObserver;
    delete globalThis.IntersectionObserver;
    expect(() =>
      render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />)
    ).not.toThrow();
    expect(trackEvent).not.toHaveBeenCalled();
    globalThis.IntersectionObserver = original;
  });

  it("changing selected night before visibility uses the latest metadata, not the mount-time snapshot", () => {
    const holder = holderWith();
    const { rerender } = render(
      <AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holder} band="poor" selectedNight="2026-09-25" />
    );
    // Night changes before the card ever reaches 50% — no impression yet.
    rerender(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holder} band="excellent" selectedNight="2026-09-26" />);
    expect(trackEvent).not.toHaveBeenCalled();

    const latestInstance = FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
    latestInstance.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    expect(trackEvent).toHaveBeenCalledWith(
      "affiliate_offer_viewed",
      expect.objectContaining({ forecast_verdict: "excellent", selected_night: "2026-09-26" })
    );
  });
});

describe("AffiliateCta — click / auxclick", () => {
  beforeEach(() => vi.clearAllMocks());

  it("left click fires affiliate_clicked with destination, full metadata, no impression fields missing", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" band="good" selectedNight="2026-09-25" />);
    fireEvent.click(screen.getByRole("link"));
    expect(trackEvent).toHaveBeenCalledWith("affiliate_clicked", {
      partner: "viator",
      campaign: "northern_lights",
      placement: "homepage_northern_lights",
      destination: "viator_northern_lights_search",
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
      forecast_verdict: "good",
      selected_night: "2026-09-25",
    });
  });

  it("click fires independent of the holder/impression state (no impression ever emitted here, no IntersectionObserver stubbed)", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" holder={holderWith()} band="good" selectedNight="2026-09-25" />);
    fireEvent.click(screen.getByRole("link"));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("affiliate_clicked", expect.any(Object));
  });

  it("repeated clicks each fire their own event (no click-side dedup)", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    const link = screen.getByRole("link");
    fireEvent.click(link);
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("a modified click (ctrl-click) still fires the click event", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    fireEvent.click(screen.getByRole("link"), { ctrlKey: true });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("middle click (auxclick button 1) fires affiliate_clicked", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    const link = screen.getByRole("link");
    fireEvent(link, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("affiliate_clicked", expect.any(Object));
  });

  it("right click (auxclick button 2) does not fire affiliate_clicked", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    const link = screen.getByRole("link");
    fireEvent(link, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 2 }));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("a throwing analytics call is caught locally and does not propagate", () => {
    trackEvent.mockImplementationOnce(() => {
      throw new Error("ga boom");
    });
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    expect(() => fireEvent.click(screen.getByRole("link"))).not.toThrow();
  });

  it("click never calls preventDefault (native anchor navigation is preserved)", () => {
    render(<AffiliateCta t={tFor("en")} placement="homepage_northern_lights" />);
    const link = screen.getByRole("link");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(event, "preventDefault");
    link.dispatchEvent(event);
    expect(preventSpy).not.toHaveBeenCalled();
  });
});
